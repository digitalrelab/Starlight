import {
  type EffortLevel,
  type SDKMessage,
  type SDKUserMessage,
  startup,
} from "@anthropic-ai/claude-agent-sdk";
import type { ModelChoice } from "@starlight/contracts";
import { AGENT_INSTRUCTIONS } from "#adapters/agent-instructions.ts";
import { isEffort } from "./models.ts";

const createInput = () => {
  const pending: Array<SDKUserMessage> = [];
  let wake = () => {};
  let ended = false;
  return {
    push: (text: string) => {
      pending.push({ type: "user", message: { role: "user", content: text }, parent_tool_use_id: null });
      wake();
    },
    end: () => {
      ended = true;
      wake();
    },
    messages: (async function* () {
      for (;;) {
        const next = pending.shift();
        if (next) yield next;
        else if (ended) return;
        else await new Promise<void>((resolve) => (wake = resolve));
      }
    })(),
  };
};

export const openSession = async (
  executable: string,
  workingDirectory: string,
  resume: string | undefined,
) => {
  const input = createInput();
  const warm = await startup({
    options: {
      pathToClaudeCodeExecutable: executable,
      cwd: workingDirectory,
      systemPrompt: AGENT_INSTRUCTIONS,
      tools: [],
      settingSources: [],
      includePartialMessages: true,
      ...(resume === undefined ? {} : { resume }),
    },
  });
  const query = warm.query(input.messages);
  let id = resume;
  let model: string | undefined;
  let effort: EffortLevel | null | undefined;

  return {
    models: () => query.supportedModels(),
    get id() {
      return id;
    },
    async *turn(prompt: string, choice: ModelChoice): AsyncGenerator<SDKMessage> {
      if (choice.model !== model) {
        await query.setModel(choice.model);
        model = choice.model;
      }
      const level = choice.effort !== null && isEffort(choice.effort) ? choice.effort : null;
      if (level !== effort) {
        await query.applyFlagSettings({ effortLevel: level });
        effort = level;
      }
      input.push(prompt);
      for (;;) {
        const { value, done } = await query.next();
        if (done) throw new Error("Claude Code stopped before replying.");
        yield value;
        if (value.type === "result") {
          id = value.session_id;
          return;
        }
      }
    },
    close: () => {
      input.end();
      query.close();
    },
  };
};

export type Session = Awaited<ReturnType<typeof openSession>>;
