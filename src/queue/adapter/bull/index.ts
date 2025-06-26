import { Queue as BullQueue, QueueEvents, QueueOptions as BullQueueOptions, Worker } from 'bullmq';

import { Logger } from '@zetten/core/logger';
import { defaultQueuePatterns, QueuePlugin } from '@zetten/queue/plugin';

export class BullMQPlugin extends QueuePlugin {
  private queues: Map<string, BullQueue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private events: Map<string, QueueEvents> = new Map();

  constructor(
    baseDir: string = "./queue",
    private patterns: string[] = [defaultQueuePatterns],
    logger: Logger = console
  ) { super(baseDir, logger); }

  async init(): Promise<void> {
    await this.readFrom(this.baseDir, ...this.patterns);
    for (const file of this.files) {
      const q = file.module;
      const name = q.options.name;

      const queue = new BullQueue(name, { connection: { url: q.options.redis }, ...q.options } as BullQueueOptions);
      this.queues.set(name, queue);

      const worker = new Worker(name, async job => {
        const progress = (v: number) => job.updateProgress(v);
        await q.jobProcessor({
          id: job.id as string,
          data: job.data,
          progress,
        });
      }, {
        connection: { url: q.options.redis },
        concurrency: q.workerOptions.concurrency,
        limiter: q.workerOptions.limiter,
        metrics: q.workerOptions.metrics,
        drainDelay: q.workerOptions.settings?.drainDelay,
        lockDuration: q.workerOptions.settings?.lockDuration,
        lockRenewTime: q.workerOptions.settings?.lockRenewTime,
        maxStalledCount: q.workerOptions.settings?.maxStalledCount,
        stalledInterval: q.workerOptions.settings?.stalledInterval,
      });
      this.workers.set(name, worker);

      const queueEvents = new QueueEvents(name, {
        connection: { url: q.options.redis }
      });

      this.events.set(name, queueEvents);

      queueEvents.on('completed', ({jobId }) => q.events.onCompleted?.(jobId));
      queueEvents.on('failed', ({ jobId }, err) => q.events.onFailed?.(jobId, err));
      queueEvents.on('progress', ({ jobId }, progress) => q.events.onProgress?.(jobId, parseInt(progress)));

      this.logger.info(`Queue ${name} registered with BullMQ`);
    }
  }

  getQueue(name: string): BullQueue | undefined {
    return this.queues.get(name);
  }

  getWorker(name: string): Worker | undefined {
    return this.workers.get(name);
  }
}