export interface LoadTestConfig {
    id: string;
    name: string;
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers: Record<string, string>;
    body?: string;
    concurrency: number;       // Parallel workers
    totalRequests: number;     // Total requests to fire
    rampUpSeconds: number;     // Gradual ramp-up period
    timeoutMs: number;         // Per-request timeout
    thinkTimeMs: number;       // Delay between requests per worker
}

export interface RequestResult {
    requestId: number;
    startTime: number;
    endTime: number;
    latencyMs: number;
    statusCode: number;
    success: boolean;
    error?: string;
    bytes: number;
}

export interface AggregatedStats {
    totalRequests: number;
    successCount: number;
    errorCount: number;
    errorRate: number;
    throughput: number;        // req/sec
    bytesTransferred: number;
    latency: {
        min: number;
        max: number;
        mean: number;
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
        p999: number;
    };
    timeline: TimelinePoint[];
}

export interface TimelinePoint {
    timestamp: number;
    throughput: number;
    latencyP50: number;
    latencyP95: number;
    activeWorkers: number;
    errorRate: number;
}

export type TestStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface TestSession {
    id: string;
    config: LoadTestConfig;
    status: TestStatus;
    startTime?: number;
    endTime?: number;
    stats?: AggregatedStats;
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

export interface AIAnalysisResult {
    sessionId: string;
    analysis: string;           // Full streamed text from LLM
    severity: 'healthy' | 'warning' | 'critical';
    detectedIssues: string[];   // Structured list extracted from response
    suggestions: string[];      // Actionable next steps
    generatedAt: number;
}

export interface ParsedTestConfig {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: string;
    concurrency?: number;
    totalRequests?: number;
    rampUpSeconds?: number;
    timeoutMs?: number;
    thinkTimeMs?: number;
    name?: string;
    confidence: number;         // 0–1, how confident the LLM is in its parsing
    rawIntent: string;          // Original user prompt echoed back
}
