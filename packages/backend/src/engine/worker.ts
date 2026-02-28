import { Client } from 'undici';
import { LoadTestConfig, RequestResult } from '../types';

export class LoadWorker {
    private client: Client;
    private config: LoadTestConfig;
    private workerId: number;
    private requestCounter: number;
    private stopped = false;

    constructor(config: LoadTestConfig, workerId: number, requestCounter: { value: number }) {
        this.config = config;
        this.workerId = workerId;
        this.requestCounter = 0; // Local reference
        this.client = new Client(this.getOrigin(config.url), {
            pipelining: 1,
            keepAliveTimeout: 30_000,
            connect: { timeout: config.timeoutMs }
        });
    }

    private getOrigin(url: string): string {
        const u = new URL(url);
        return `${u.protocol}//${u.host}`;
    }

    private getPath(url: string): string {
        const u = new URL(url);
        return u.pathname + u.search;
    }

    stop() {
        this.stopped = true;
        this.client.close().catch(() => { });
    }

    async run(
        getRequestSlot: () => number | null,
        onResult: (result: RequestResult) => void
    ): Promise<void> {
        while (!this.stopped) {
            const requestId = getRequestSlot();
            if (requestId === null) break;

            const startTime = performance.now();
            let result: RequestResult;

            try {
                const path = this.getPath(this.config.url);
                const response = await this.client.request({
                    method: this.config.method as any,
                    path,
                    headers: {
                        'content-type': 'application/json',
                        ...this.config.headers
                    },
                    body: this.config.body || null,
                    headersTimeout: this.config.timeoutMs,
                    bodyTimeout: this.config.timeoutMs,
                });

                const body = await response.body.text();
                const endTime = performance.now();

                result = {
                    requestId,
                    startTime,
                    endTime,
                    latencyMs: endTime - startTime,
                    statusCode: response.statusCode,
                    success: response.statusCode >= 200 && response.statusCode < 400,
                    bytes: Buffer.byteLength(body)
                };
            } catch (err: any) {
                const endTime = performance.now();
                result = {
                    requestId,
                    startTime,
                    endTime,
                    latencyMs: endTime - startTime,
                    statusCode: 0,
                    success: false,
                    error: err.message,
                    bytes: 0
                };
            }

            onResult(result);

            if (this.config.thinkTimeMs > 0 && !this.stopped) {
                await new Promise(r => setTimeout(r, this.config.thinkTimeMs));
            }
        }

        await this.client.close().catch(() => { });
    }
}
