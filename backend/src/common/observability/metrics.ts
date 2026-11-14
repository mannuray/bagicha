import { Injectable } from '@nestjs/common';
import {
  Counter,
  Meter,
  metrics,
  ObservableGauge,
  ObservableResult,
} from '@opentelemetry/api';

export type AiFeature = 'identify' | 'diagnose' | 'ask_ai';
export type AiOutcome = 'ok' | 'invalid_response' | 'error' | 'not_configured';

/** The one place business metrics are defined and emitted. */
@Injectable()
export class Metrics {
  private readonly meter: Meter = metrics.getMeter('bagicha-backend');
  private readonly aiCalls: Counter = this.meter.createCounter(
    'bagicha.ai.calls',
    { description: 'AI provider calls by feature and outcome' },
  );
  private readonly diagnoses: Counter = this.meter.createCounter(
    'bagicha.diagnoses.recorded',
    { description: 'Diagnoses saved to a plant record' },
  );
  private readonly tasksCreated: Counter = this.meter.createCounter(
    'bagicha.tasks.created',
    { description: 'Tasks created, by source' },
  );
  private readonly tasksCompleted: Counter = this.meter.createCounter(
    'bagicha.tasks.completed',
    { description: 'Tasks marked completed' },
  );
  private readonly rateLimited: Counter = this.meter.createCounter(
    'bagicha.rate_limit.rejected',
    { description: 'Requests rejected by a rate limit bucket' },
  );
  private readonly catalogueLoads: Counter = this.meter.createCounter(
    'bagicha.catalogue.loads',
    { description: 'Plant catalogue loads into memory, by version' },
  );
  private readonly queueDepthSources = new Map<string, () => Promise<number>>();
  private queueDepthGauge?: ObservableGauge;

  aiCall(feature: AiFeature, outcome: AiOutcome): void {
    this.aiCalls.add(1, { feature, outcome });
  }

  diagnosisRecorded(issue: string): void {
    this.diagnoses.add(1, { issue });
  }

  taskCreated(source: string, count = 1): void {
    if (count > 0) this.tasksCreated.add(count, { source });
  }

  taskCompleted(): void {
    this.tasksCompleted.add(1);
  }

  rateLimitRejected(bucket: string): void {
    this.rateLimited.add(1, { bucket });
  }

  catalogueLoaded(version: number, crops: number): void {
    this.catalogueLoads.add(1, { version: String(version), crops });
  }

  registerQueueDepth(name: string, getDepth: () => Promise<number>): void {
    this.queueDepthSources.set(name, getDepth);
    if (this.queueDepthGauge) return;
    this.queueDepthGauge = this.meter.createObservableGauge(
      'bagicha.queue.depth',
      { description: 'Jobs waiting or active, by queue' },
    );
    this.queueDepthGauge.addCallback(async (result: ObservableResult) => {
      for (const [queue, read] of this.queueDepthSources) {
        try {
          result.observe(await read(), { queue });
        } catch {
          // A queue that can't report this cycle is skipped, not fatal.
        }
      }
    });
  }
}
