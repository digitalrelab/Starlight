import type { McpSdkServerConfigWithInstance, Query } from "@anthropic-ai/claude-agent-sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  type CallToolResult,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { AgentToolkit, AgentToolResult } from "@starlight/core";
import { Effect, Option } from "effect";

const SERVER = "starlight";

export const ALLOWED_TOOLS = [`mcp__${SERVER}`];

const toCallToolResult = ({ content, failed }: AgentToolResult): CallToolResult => ({
  content: content.map((item) =>
    item._tag === "Text"
      ? { type: "text", text: item.text }
      : { type: "image", data: item.data, mimeType: item.mediaType },
  ),
  isError: failed,
});

const createServer = (initial: AgentToolkit) => {
  let toolkit = initial;
  const instance = new McpServer(
    { name: SERVER, version: "1" },
    { capabilities: { tools: {} }, instructions: initial.instructions },
  );
  instance.server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: toolkit.tools.map(({ name, description, parameters }) => ({
      name,
      description,
      inputSchema: { ...parameters, type: "object" as const },
      _meta: { "anthropic/alwaysLoad": true },
    })),
  }));
  instance.server.setRequestHandler(CallToolRequestSchema, ({ params }) =>
    Effect.runPromise(toolkit.call(params.name, params.arguments ?? {})).then(toCallToolResult),
  );
  return {
    config: { type: "sdk", name: SERVER, instance } satisfies McpSdkServerConfigWithInstance,
    use: (next: AgentToolkit) => {
      toolkit = next;
    },
  };
};

export const makeToolServer = () => {
  let server: ReturnType<typeof createServer> | undefined;
  let registered = false;

  return {
    use: async (query: Query, toolkit: Option.Option<AgentToolkit>) => {
      if (Option.isNone(toolkit)) {
        if (registered) await query.setMcpServers({});
        registered = false;
        return;
      }
      if (server) server.use(toolkit.value);
      else server = createServer(toolkit.value);
      if (!registered) await query.setMcpServers({ [SERVER]: server.config });
      registered = true;
    },
  };
};
