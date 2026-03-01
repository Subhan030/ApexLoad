import OpenAI from 'openai';
import { AggregatedStats, LoadTestConfig, AIAnalysisResult } from '../types';

// Lazy-initialize — OpenAI SDK throws at construction if no API key is set
let _client: OpenAI | null = null;
function getClient(): OpenAI {
    if (!_client) {
        _client = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: process.env.OPENROUTER_API_KEY,
        });
    }
    return _client;
}

// The system prompt is carefully engineered:
// - Forces structured output for easy frontend rendering
// - Gives the LLM the exact metrics it needs to be specific
// - Limits scope to API performance only (no hallucination drift)
const ANALYST_SYSTEM_PROMPT = `You are an expert API performance engineer embedded in a load testing tool called ApexLoad.
Your job: analyze load test results and give developers specific, actionable insights.

RESPONSE FORMAT — always follow this exact structure:

## Severity: [HEALTHY | WARNING | CRITICAL]

## What Happened
2–3 sentences summarizing the test result using the exact numbers provided. Be precise.

## Issues Detected
- [Issue name]: [specific metric that shows the problem and what threshold was breached]
(list only real issues found; omit this section if none)

## Root Cause Analysis
For each issue: explain the likely technical cause (e.g., thread pool exhaustion, GC pressure, DB connection limits, lack of connection keep-alive).

## Recommended Actions
- [Priority: HIGH/MEDIUM/LOW] [Specific action with expected outcome]
(give 3–5 actions maximum; be concrete, not generic)

## Next Test to Run
Suggest the single most valuable follow-up test scenario with exact parameters.

RULES:
- Never say "it depends" without a specific alternative
- Always reference the exact metric numbers from the data
- Do not give generic advice like "optimize your database" — be specific`;

export async function analyzeBottleneck(
    config: LoadTestConfig,
    stats: AggregatedStats,
    onToken?: (token: string) => void  // Stream callback for real-time UI
): Promise<AIAnalysisResult> {
    const p99ToP50Ratio = stats.latency.p99 / Math.max(1, stats.latency.p50);

    // Build a dense, structured context block — LLMs perform better with structured input
    const contextBlock = `
LOAD TEST CONFIGURATION:
- Test Name: ${config.name}
- Target URL: ${config.url} [${config.method}]
- Concurrency: ${config.concurrency} parallel workers
- Total Requests: ${config.totalRequests}
- Ramp-up Period: ${config.rampUpSeconds}s
- Per-request Timeout: ${config.timeoutMs}ms
- Think Time: ${config.thinkTimeMs}ms between requests

RESULTS SUMMARY:
- Total Requests Fired: ${stats.totalRequests}
- Success Count: ${stats.successCount} (${((1 - stats.errorRate) * 100).toFixed(1)}%)
- Error Count: ${stats.errorCount} (${(stats.errorRate * 100).toFixed(2)}% error rate)
- Throughput: ${stats.throughput.toFixed(2)} req/sec

LATENCY PERCENTILES:
- Min:    ${stats.latency.min}ms
- P50:    ${stats.latency.p50}ms  ← median user experience
- P75:    ${stats.latency.p75}ms
- P90:    ${stats.latency.p90}ms
- P95:    ${stats.latency.p95}ms  ← 1 in 20 requests slower than this
- P99:    ${stats.latency.p99}ms  ← 1 in 100 requests slower than this
- P99.9:  ${stats.latency.p999}ms ← worst-case tail
- Max:    ${stats.latency.max}ms
- Mean:   ${stats.latency.mean.toFixed(1)}ms

DERIVED METRICS:
- P99/P50 Ratio: ${p99ToP50Ratio.toFixed(2)}x ${p99ToP50Ratio > 5 ? '⚠️ HIGH TAIL LATENCY' : '✅ normal'}
- Bytes Transferred: ${(stats.bytesTransferred / 1024).toFixed(1)} KB total
- Timeline Points: ${stats.timeline.length} second-by-second snapshots

${stats.timeline.length > 0 ? `THROUGHPUT TREND (req/s per second):
${stats.timeline.slice(0, 10).map((t, i) => `  t+${i + 1}s: ${t.throughput.toFixed(1)} rps | p95: ${t.latencyP95}ms | errors: ${(t.errorRate * 100).toFixed(1)}%`).join('\n')}
${stats.timeline.length > 10 ? `  ... and ${stats.timeline.length - 10} more seconds` : ''}` : ''}
`.trim();

    let fullText = '';

    // Use streaming so the frontend can show typing effect in real time
    const stream = await getClient().chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet',
        max_tokens: 1000,
        stream: true,
        messages: [
            { role: 'system', content: ANALYST_SYSTEM_PROMPT },
            { role: 'user', content: contextBlock }
        ]
    });

    for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
            fullText += delta;
            onToken?.(delta);  // Push each token to frontend via WebSocket
        }
    }

    // Parse severity from the structured response
    const severityMatch = fullText.match(/## Severity:\s*(HEALTHY|WARNING|CRITICAL)/i);
    const severity = (severityMatch?.[1]?.toLowerCase() ?? 'warning') as AIAnalysisResult['severity'];

    // Extract issues list
    const issuesSection = fullText.match(/## Issues Detected\n([\s\S]*?)(?=##|$)/)?.[1] ?? '';
    const detectedIssues = issuesSection
        .split('\n')
        .filter(l => l.trim().startsWith('-'))
        .map(l => l.replace(/^-\s*/, '').trim())
        .filter(Boolean);

    // Extract action items
    const actionsSection = fullText.match(/## Recommended Actions\n([\s\S]*?)(?=##|$)/)?.[1] ?? '';
    const suggestions = actionsSection
        .split('\n')
        .filter(l => l.trim().startsWith('-'))
        .map(l => l.replace(/^-\s*/, '').trim())
        .filter(Boolean);

    return {
        sessionId: config.id,
        analysis: fullText,
        severity,
        detectedIssues,
        suggestions,
        generatedAt: Date.now()
    };
}
