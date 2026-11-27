import { type AgentModel, type AgentProviderStatus, type ModelChoice, ModelId } from "@starlight/contracts";
import {
  type AgentProviderDriver,
  type AgentToolkit,
  type AgentTurnEvent,
  AgentTurnFailed,
} from "@starlight/core";
import { Cause, Effect, Option, Queue, Stream } from "effect";
import { AGENT_INSTRUCTIONS, asError, capitalized, effortLabel, notReady } from "#adapters/agent.ts";
import { output } from "#adapters/cli.ts";
import type { Inbound } from "./app-server.ts";
import { type Connection, findExecutable, makeConnector } from "./connection.ts";
import { answerToolCalls, threadTools } from "./tools.ts";
import { makeUsage } from "./usage.ts";

interface CodexModel {
  readonly model: string;
  readonly displayName: string;
  readonly hidden: boolean;
  readonly supportedReasoningEfforts: ReadonlyArray<{ readonly reasoningEffort: string }>;
  readonly defaultReasoningEffort: string;
  readonly upgrade: string | null;
}

interface CodexAccount {
  readonly account: {
    readonly type: string;
    readonly email?: string | null;
    readonly planType?: string;
  } | null;
}

interface Opened {
  readonly thread: { readonly id: string };
}

interface TurnCompleted {
  readonly turn: { readonly status: string; readonly error: { readonly message: string } | null };
}

const VERSIONED_SLUG = /^gpt-([\d.]+)-(.+)$/;

const lineOf = (slug: string) => {
  const match = VERSIONED_SLUG.exec(slug);
  return match?.[1] && match[2] ? { family: match[2], version: match[1].split(".").map(Number) } : undefined;
};

const isNewer = (a: ReadonlyArray<number>, b: ReadonlyArray<number>) => {
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference > 0;
  }
  return false;
};

const isLegacy = (model: CodexModel, catalog: ReadonlyArray<CodexModel>) => {
  if (model.upgrade !== null) return true;
  const line = lineOf(model.model);
  return (
    line !== undefined &&
    catalog.some((other) => {
      const candidate = lineOf(other.model);
      return candidate?.family === line.family && isNewer(candidate.version, line.version);
    })
  );
};

const catalogs = new WeakMap<Connection, Promise<ReadonlyArray<CodexModel>>>();

const listModels = (connection: Connection) => {
  const known = catalogs.get(connection);
  if (known) return known;
  const catalog = fetchModels(connection);
  catalogs.set(connection, catalog);
  void catalog.catch(() => catalogs.delete(connection));
  return catalog;
};

const fetchModels = async ({ server }: Connection) => {
  const models: Array<CodexModel> = [];
  let cursor: string | null = null;
  do {
    const page: { data: ReadonlyArray<CodexModel>; nextCursor: string | null } = await server.request(
      "model/list",
      {
        cursor,
      },
    );
    models.push(...page.data);
    cursor = page.nextCursor;
  } while (cursor !== null);
  return models.filter((model) => !model.hidden);
};

export const makeCodexDriver = (workingDirectory: string): AgentProviderDriver => {
  const connect = makeConnector(workingDirectory);

  const thread = (connection: Connection, model: ModelChoice) => ({
    model: model.model,
    cwd: workingDirectory,
    sandbox: "read-only",
    approvalPolicy: "never",
    baseInstructions: AGENT_INSTRUCTIONS,
    config: connection.isolation,
  });

  const openThread = async (
    connection: Connection,
    session: Option.Option<string>,
    model: ModelChoice,
    toolkit: Option.Option<AgentToolkit>,
  ) => {
    if (Option.isSome(session) && connection.threads.has(session.value)) return session.value;
    const params = thread(connection, model);
    const { thread: opened } = await (Option.isSome(session)
      ? connection.server.request<Opened>("thread/resume", {
          ...params,
          threadId: session.value,
          excludeTurns: true,
        })
      : connection.server.request<Opened>("thread/start", { ...params, ...threadTools(toolkit) }));
    connection.threads.add(opened.id);
    return opened.id;
  };

  const effortOf = async (connection: Connection, model: ModelChoice) =>
    model.effort ??
    (await listModels(connection)).find((candidate) => candidate.model === model.model)
      ?.defaultReasoningEffort;

  const status: Effect.Effect<AgentProviderStatus> = Effect.gen(function* () {
    const executable = yield* findExecutable;
    if (Option.isNone(executable)) return notReady("Install Codex, then run “codex login” in a terminal.");
    const [version, { account }] = yield* Effect.all(
      [
        output(executable.value, ["--version"]),
        Effect.tryPromise({
          try: () => connect().then(({ server }) => server.request<CodexAccount>("account/read", {})),
          catch: asError,
        }),
      ],
      { concurrency: "unbounded" },
    );
    if (!account) return notReady("Signed out. Run “codex login” in a terminal.");
    return {
      _tag: "Ready",
      version: version.split(" ").at(-1) ?? version,
      ...(account.email ? { account: account.email } : {}),
      ...(account.planType
        ? { plan: capitalized(account.planType) }
        : account.type === "apiKey"
          ? { plan: "API key" }
          : {}),
    } satisfies AgentProviderStatus;
  }).pipe(Effect.catch((error) => Effect.succeed(notReady(error.message))));

  return {
    name: "Codex",
    status,
    models: Effect.tryPromise(() => connect().then(listModels)).pipe(
      Effect.map((models) =>
        models.map((model): AgentModel => ({
          id: ModelId.make(model.model),
          name: model.displayName,
          efforts: model.supportedReasoningEfforts.map(({ reasoningEffort }) => ({
            id: reasoningEffort,
            label: effortLabel(reasoningEffort),
          })),
          legacy: isLegacy(model, models),
        })),
      ),
      Effect.orElseSucceed((): ReadonlyArray<AgentModel> => []),
    ),
    usage: makeUsage(connect),
    prepare: Effect.sync(() => void connect().catch(() => {})),
    forget: (session) =>
      Effect.tryPromise(() =>
        connect().then(({ server, threads }) => {
          threads.delete(session);
          return server.request("thread/delete", { threadId: session });
        }),
      ).pipe(Effect.catch((error) => Effect.logWarning("Codex thread could not be deleted", error))),
    respond: ({ prompt, session, model, toolkit }) =>
      Stream.callback<AgentTurnEvent, AgentTurnFailed>((queue) =>
        Effect.gen(function* () {
          const connection = yield* Effect.tryPromise({ try: connect, catch: AgentTurnFailed.from });
          const threadId = yield* Effect.tryPromise({
            try: () => openThread(connection, session, model, toolkit),
            catch: AgentTurnFailed.from,
          });
          const effort = yield* Effect.tryPromise({
            try: () => effortOf(connection, model),
            catch: AgentTurnFailed.from,
          });
          let turnId: string | undefined;
          let finished = false;

          const fail = (message: string) => {
            finished = true;
            Queue.failCauseUnsafe(queue, Cause.fail(new AgentTurnFailed({ message })));
          };

          const onNotification = ({ method, params }: Inbound) => {
            if (params.threadId !== threadId) return;
            if (method === "item/agentMessage/delta") {
              Queue.offerUnsafe(queue, { _tag: "TextDelta", text: String(params["delta"]) });
            } else if (method === "error" && params["willRetry"] === false) {
              fail((params["error"] as { message: string }).message);
            } else if (method === "turn/completed") {
              const { turn } = params as unknown as TurnCompleted;
              if (turn.status !== "completed") return fail(turn.error?.message ?? "Codex could not reply.");
              finished = true;
              Queue.offerUnsafe(queue, { _tag: "Completed", session: Option.some(threadId) });
              Queue.endUnsafe(queue);
            }
          };

          yield* Effect.acquireRelease(
            Effect.sync(() => [
              connection.server.listen(onNotification),
              connection.server.answer(answerToolCalls(threadId, toolkit)),
            ]),
            (subscriptions) =>
              Effect.sync(() => {
                for (const unsubscribe of subscriptions) unsubscribe();
                if (!finished && turnId !== undefined) {
                  void connection.server.request("turn/interrupt", { threadId, turnId }).catch(() => {});
                }
              }),
          );
          const started = yield* Effect.tryPromise({
            try: () =>
              connection.server.request<{ turn: { id: string } }>("turn/start", {
                threadId,
                input: [{ type: "text", text: prompt, text_elements: [] }],
                model: model.model,
                effort,
                disabledPluginIds: connection.plugins,
              }),
            catch: AgentTurnFailed.from,
          });
          turnId = started.turn.id;
        }),
      ),
  };
};
