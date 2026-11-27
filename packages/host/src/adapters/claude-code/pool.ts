import type { Session } from "./session.ts";

const IDLE_MS = 10 * 60 * 1000;
const MAX_PARKED = 3;

interface Held<A> {
  readonly value: A;
  readonly timer: ReturnType<typeof setTimeout>;
}

export const makePool = (open: (resume: string | undefined) => Promise<Session>) => {
  const parked = new Map<string, Held<Session>>();
  let spare: Held<Promise<Session>> | undefined;

  const unpark = (id: string) => {
    const held = parked.get(id);
    if (!held) return undefined;
    clearTimeout(held.timer);
    parked.delete(id);
    return held.value;
  };

  const takeSpare = () => {
    const held = spare;
    if (!held) return undefined;
    clearTimeout(held.timer);
    spare = undefined;
    return held.value;
  };

  const prepare = () => {
    if (spare) return spare.value;
    const session = open(undefined);
    const held = {
      value: session,
      timer: setTimeout(() => {
        if (spare === held)
          void takeSpare()?.then(
            (idle) => idle.close(),
            () => {},
          );
      }, IDLE_MS),
    };
    spare = held;
    void session.catch(() => {
      if (spare === held) void takeSpare();
    });
    return session;
  };

  return {
    prepare,
    acquire: (resume: string | undefined) => {
      if (resume !== undefined) {
        const session = unpark(resume);
        return session ? Promise.resolve(session) : open(resume);
      }
      const session = takeSpare()?.catch(() => open(undefined)) ?? open(undefined);
      void prepare().catch(() => {});
      return session;
    },
    park: (session: Session) => {
      const id = session.id;
      if (id === undefined) return session.close();
      unpark(id)?.close();
      parked.set(id, {
        value: session,
        timer: setTimeout(() => unpark(id)?.close(), IDLE_MS),
      });
      const [oldest] = parked.keys();
      if (parked.size > MAX_PARKED && oldest !== undefined) unpark(oldest)?.close();
    },
    forget: (id: string) => unpark(id)?.close(),
  };
};

export type Pool = ReturnType<typeof makePool>;
