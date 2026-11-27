export const Priority = { background: 0, nearby: 1, visible: 2 } as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export interface Work {
  readonly key: string;
  readonly task: () => Promise<boolean>;
}

interface Listener {
  readonly priority: Priority;
  readonly onDone: ((succeeded: boolean) => void) | undefined;
}

interface Job extends Work {
  readonly order: number;
  readonly listeners: Set<Listener>;
  running: boolean;
}

const priorityOf = (job: Job) => {
  let highest: number = Priority.background;
  for (const listener of job.listeners) highest = Math.max(highest, listener.priority);
  return highest;
};

const outranks = (a: Job, b: Job) => {
  const difference = priorityOf(a) - priorityOf(b);
  return difference === 0 ? a.order > b.order : difference > 0;
};

export const createWorkQueue = (concurrency: number) => {
  const jobs = new Map<string, Job>();
  let active = 0;
  let sequence = 0;

  const next = () => {
    let best: Job | undefined;
    for (const job of jobs.values()) {
      if (!job.running && (!best || outranks(job, best))) best = job;
    }
    return best;
  };

  const pump = () => {
    while (active < concurrency) {
      const job = next();
      if (!job) return;
      job.running = true;
      active++;
      void job
        .task()
        .catch(() => false)
        .then((succeeded) => {
          active--;
          jobs.delete(job.key);
          for (const listener of job.listeners) listener.onDone?.(succeeded);
          pump();
        });
    }
  };

  const enqueue = ({ key, task }: Work, listener: Listener) => {
    const job = jobs.get(key) ?? { key, task, order: sequence++, listeners: new Set(), running: false };
    jobs.set(key, job);
    job.listeners.add(listener);
    return () => {
      job.listeners.delete(listener);
      if (job.listeners.size === 0 && !job.running) jobs.delete(key);
    };
  };

  return {
    request: (work: Work, priority: Priority, onDone?: (succeeded: boolean) => void) => {
      const cancel = enqueue(work, { priority, onDone });
      pump();
      return cancel;
    },
    requestAll: (works: ReadonlyArray<Work>, priority: Priority) => {
      const cancels = works.toReversed().map((work) => enqueue(work, { priority, onDone: undefined }));
      pump();
      return () => {
        for (const cancel of cancels) cancel();
      };
    },
  };
};
