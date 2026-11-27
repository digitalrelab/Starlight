import { Composer } from "#renderer/features/agent/composer.tsx";
import { Message } from "#renderer/features/agent/transcript.tsx";

export const ChatPreview = () => (
  <div className="py-4">
    <div inert className="flex flex-col gap-6 rounded-md bg-surface-sunken p-4">
      <Message role="user" text="Summarize this folder in one line." pending={false} />
      <Message
        role="assistant"
        text="It holds **12 photos** from a weekend trip and a `notes.md` with the itinerary."
        pending={false}
      />
      <Composer placeholder="Reply…" disabled onSubmit={() => Promise.resolve()} />
    </div>
  </div>
);
