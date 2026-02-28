import { build, Histogram } from 'hdr-histogram-js';
import { RequestResult, AggregatedStats, TimelinePoint } from '../types';

export class StatsCollector {
    private histogram: Histogram;
    private results: RequestResult[] = [];
    private startTime: number;
    private timeline: TimelinePoint[] = [];
    private windowResults: RequestResult[] = [];
    private windowStart: number;
    private activeWorkers = 0;

    constructor() {
        this.histogram = build({ lowestDiscernibleValue: 1, highestTrackableValue: 3_600_000, numberOfSignificantValueDigits: 3 });
        this.startTime = Date.now();
        this.windowStart = this.startTime;
    }

    setActiveWorkers(count: number) {
        this.activeWorkers = count;
    }

    record(result: RequestResult): void {
        this.results.push(result);
        this.windowResults.push(result);
        if (result.success) {
            this.histogram.recordValue(Math.max(1, Math.round(result.latencyMs)));
        }

        // Snapshot timeline every 1 second
        const now = Date.now();
        if (now - this.windowStart >= 1000) {
            this.snapshotTimeline(now);
        }
    }

    private snapshotTimeline(now: number): void {
        const elapsed = (now - this.windowStart) / 1000;
        const windowHisto = build({ lowestDiscernibleValue: 1, highestTrackableValue: 3_600_000, numberOfSignificantValueDigits: 2 });
        let errors = 0;

        for (const r of this.windowResults) {
            if (r.success) windowHisto.recordValue(Math.max(1, Math.round(r.latencyMs)));
            else errors++;
        }

        this.timeline.push({
            timestamp: now,
            throughput: this.windowResults.length / elapsed,
            latencyP50: windowHisto.getValueAtPercentile(50),
            latencyP95: windowHisto.getValueAtPercentile(95),
            activeWorkers: this.activeWorkers,
            errorRate: errors / Math.max(1, this.windowResults.length)
        });

        this.windowResults = [];
        this.windowStart = now;
    }

    aggregate(): AggregatedStats {
        const successResults = this.results.filter(r => r.success);
        const errorResults = this.results.filter(r => !r.success);
        const elapsed = (Date.now() - this.startTime) / 1000;
        const totalBytes = this.results.reduce((acc, r) => acc + r.bytes, 0);

        return {
            totalRequests: this.results.length,
            successCount: successResults.length,
            errorCount: errorResults.length,
            errorRate: errorResults.length / Math.max(1, this.results.length),
            throughput: this.results.length / elapsed,
            bytesTransferred: totalBytes,
            latency: {
                min: this.histogram.minNonZeroValue,
                max: this.histogram.maxValue,
                mean: this.histogram.mean,
                p50: this.histogram.getValueAtPercentile(50),
                p75: this.histogram.getValueAtPercentile(75),
                p90: this.histogram.getValueAtPercentile(90),
                p95: this.histogram.getValueAtPercentile(95),
                p99: this.histogram.getValueAtPercentile(99),
                p999: this.histogram.getValueAtPercentile(99.9),
            },
            timeline: this.timeline
        };
    }

    reset(): void {
        this.histogram.reset();
        this.results = [];
        this.timeline = [];
        this.windowResults = [];
        this.startTime = Date.now();
        this.windowStart = this.startTime;
    }
}
