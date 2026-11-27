import type { McpSdkServerConfigWithInstance, Query } from "@anthropic-ai/claude-agent-sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  type CallToolResult,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { AgentToolkit, AgentToolResult } from "@starlight/core";
import { Effect, Option } from "effect";
import { NO_FILE_ACCESS } from "#adapters/agent.ts";

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

export const makeToolServer = () => {
  let toolkit: AgentToolkit | undefined;
  let server: McpSdkServerConfigWithInstance | undefined;
  let registered = false;

  const create = (instructions: string): McpSdkServerConfigWithInstance => {
    const instance = new McpServer(
      { name: SERVER, version: "1" },
      { capabilities: { tools: {} }, instructions },
    );
    instance.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: (toolkit?.tools ?? []).map(({ name, description, parameters }) => ({
        name,
        description,
        inputSchema: { ...parameters, type: "object" as const },
        _meta: { "anthropic/alwaysLoad": true },
      })),
    }));
    instance.server.setRequestHandler(CallToolRequestSchema, ({ params }) =>
      toolkit
        ? Effect.runPromise(toolkit.call(params.name, params.arguments ?? {})).then(toCallToolResult)
        : { content: [{ type: "text", text: NO_FILE_ACCESS }], isError: true },
    );
    return { type: "sdk", name: SERVER, instance };
  };

  return {
    use: async (query: Query, next: Option.Option<AgentToolkit>) => {
      toolkit = Option.getOrUndefined(next);
      const wanted = toolkit !== undefined;
      if (wanted === registered) return;
      await query.setMcpServers(toolkit ? { [SERVER]: (server ??= create(toolkit.instructions)) } : {});
      registered = wanted;
    },
  };
};
