import { Item } from "@starlight/ui";
import { Composer } from "#renderer/features/agent/composer.tsx";
import { Message } from "#renderer/features/agent/transcript.tsx";

const REPLY = `It holds **12 photos** from a weekend trip and a \`notes.md\` with the itinerary:

- Saturday: coastal hike
- Sunday: market and museum

\`\`\`sh
open notes.md
\`\`\``;

export const ChatPreview = () => (
  <Item.Panel inert className="flex flex-col gap-6 bg-surface-sunken">
    <Message role="user" text="What’s in this folder?" />
    <Message role="assistant" text={REPLY} />
    <Composer placeholder="Reply…" onSubmit={() => Promise.resolve()} />
  </Item.Panel>
);
