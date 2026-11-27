import {
  FolderAddIcon,
  FolderIcon,
  Message01Icon,
  MessageAdd01Icon,
  Navigation03Icon,
} from "@hugeicons-pro/core-stroke-rounded";
import type { Project } from "@starlight/client";
import { Command, type CommandGroup, type CommandItem } from "@starlight/ui";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Channel } from "#shared/channels.ts";
import { COMMAND_PALETTE_KEY } from "#shared/command-palette.ts";
import { chatLink, newChatLink } from "#renderer/features/agent/chat-links.ts";
import { useCreateProject } from "#renderer/features/projects/use-create-project.ts";
import { SETTINGS_SECTIONS } from "#renderer/features/settings/settings-pages.ts";
import { useStarlight } from "#renderer/lib/context.ts";
import { onMainMessage } from "#renderer/lib/main-messages.ts";
import { defineStore, useStore } from "#renderer/lib/store.ts";

export const COMMAND_PALETTE_SHORTCUT = ["Meta", COMMAND_PALETTE_KEY];

const RECENT_CHATS = 5;

const isOpen = defineStore(false);

onMainMessage(Channel.commandPalette, () => isOpen.set(!isOpen.get()));

export const openCommandPalette = () => isOpen.set(true);

const useChatItems = (projects: ReadonlyArray<Project>): ReadonlyArray<CommandItem> => {
  const { queries } = useStarlight();
  const navigate = useNavigate();
  const names = new Map(projects.map(({ id, name }) => [id, name]));
  return useQueries({
    queries: [null, ...names.keys()].map((projectId) => queries.chats(projectId)),
    combine: (results) =>
      results
        .flatMap(({ data }) => data ?? [])
        .toSorted((a, b) => b.updatedAt - a.updatedAt)
        .map((chat) => ({
          key: chat.id,
          label: chat.title,
          detail: (chat.projectId && names.get(chat.projectId)) || "Agent",
          icon: Message01Icon,
          run: () => navigate(chatLink(chat)),
        })),
  });
};

const Palette = ({ createProject }: { readonly createProject: () => void }) => {
  const { queries } = useStarlight();
  const navigate = useNavigate();
  const { projectId } = useParams({ strict: false });
  const [query, setQuery] = useState("");
  const text = query.trim();
  const projects = useQuery(queries.projects()).data ?? [];
  const project = projects.find(({ id }) => id === projectId);
  const chats = useChatItems(projects);

  const projectItems = projects.map(({ id, name }): CommandItem => ({
    key: id,
    label: name,
    icon: FolderIcon,
    run: () => navigate({ to: "/p/$projectId", params: { projectId: id } }),
  }));

  const pages: ReadonlyArray<CommandItem> = [
    { key: "agent", label: "Agent", icon: Navigation03Icon, run: () => navigate({ to: "/agent" }) },
    ...SETTINGS_SECTIONS.flatMap(({ pages }) =>
      pages.map(({ label, icon, link }) => ({
        key: link.to,
        label,
        detail: "Settings",
        icon,
        run: () => navigate(link),
      })),
    ),
  ];

  const actions: ReadonlyArray<CommandItem> = [
    { key: "new-project", label: "New Project…", icon: FolderAddIcon, run: createProject },
    ...(project
      ? [
          {
            key: "new-chat",
            label: "New chat",
            detail: project.name,
            icon: MessageAdd01Icon,
            run: () => navigate(newChatLink(project.id)),
          },
        ]
      : []),
  ];

  const groups: ReadonlyArray<CommandGroup> = [
    { label: "Recent", items: text === "" ? chats.slice(0, RECENT_CHATS) : [] },
    { label: "Projects", items: Command.rank(projectItems, text) },
    { label: "Chats", items: text === "" ? [] : Command.rank(chats, text) },
    { label: "Pages", items: Command.rank(pages, text) },
    { label: "Actions", items: Command.rank(actions, text) },
  ].filter(({ items }) => items.length > 0);

  return (
    <Command.Root
      placeholder="Search or jump to…"
      query={query}
      onQueryChange={setQuery}
      groups={groups}
      onActivate={(item) => {
        isOpen.set(false);
        item.run();
      }}
    />
  );
};

export const CommandPalette = () => {
  const createProject = useCreateProject();
  return (
    <Command.Dialog label="Command palette" open={useStore(isOpen)} onOpenChange={isOpen.set}>
      <Palette createProject={createProject.run} />
    </Command.Dialog>
  );
};
