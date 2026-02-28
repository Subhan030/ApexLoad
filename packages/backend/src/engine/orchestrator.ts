import { LoadTestConfig, RequestResult, AggregatedStats, TestStatus } from '../types';
import { StatsCollector } from '../stats/histogram';
import { LoadWorker } from './worker';
import { EventEmitter } from 'events';

export interface EngineEvents {
    'result': (result: RequestResult, stats: AggregatedStats) => void;
    'status': (status: TestStatus) => void;
    'progress': (completed: number, total: number) => void;
    'complete': (stats: AggregatedStats) => void;
    'error': (error: Error) => void;
}

export class LoadEngine extends EventEmitter {
    private config: LoadTestConfig;
    private stats: StatsCollector;
    private workers: LoadWorker[] = [];
    private status: TestStatus = 'idle';
    private requestsIssued = 0;
    private requestsCompleted = 0;
    private progressInterval?: NodeJS.Timer;

    constructor(config: LoadTestConfig) {
        super();
        this.config = config;
        this.stats = new StatsCollector();
    }

    private getNextRequestSlot(): number | null {
        if (this.requestsIssued >= this.config.totalRequests) return null;
        return ++this.requestsIssued;
    }

    private onResult = (result: RequestResult): void => {
        this.stats.record(result);
        this.requestsCompleted++;
        this.emit('result', result, this.stats.aggregate());
        this.emit('progress', this.requestsCompleted, this.config.totalRequests);
    };

    async start(): Promise<void> {
        if (this.status === 'running') throw new Error('Test already running');

        this.stats.reset();
        this.requestsIssued = 0;
        this.requestsCompleted = 0;
        this.status = 'running';
        this.emit('status', this.status);

        const { concurrency, rampUpSeconds } = this.config;
        const rampDelay = rampUpSeconds > 0 ? (rampUpSeconds * 1000) / concurrency : 0;

        const workerPromises: Promise<void>[] = [];

        for (let i = 0; i < concurrency; i++) {
            if (this.status !== 'running') break;

            const worker = new LoadWorker(this.config, i, { value: this.requestsIssued });
            this.workers.push(worker);
            this.stats.setActiveWorkers(this.workers.length);

            workerPromises.push(worker.run(() => this.getNextRequestSlot(), this.onResult));

            if (rampDelay > 0 && i < concurrency - 1) {
                await new Promise(r => setTimeout(r, rampDelay));
            }
        }

        await Promise.all(workerPromises);

        this.status = 'completed';
        this.emit('status', this.status);
        this.emit('complete', this.stats.aggregate());
    }

    stop(): void {
        this.status = 'completed';
        this.workers.forEach(w => w.stop());
        this.workers = [];
        this.emit('status', this.status);
        this.emit('complete', this.stats.aggregate());
    }

    getStats(): AggregatedStats {
        return this.stats.aggregate();
    }
}
