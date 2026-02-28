import Fastify from 'fastify';
import { getConfigs, getResults } from '../db';
import { analyzeBottleneck } from '../ai/analyst';
import { parseTestIntent } from '../ai/intent-parser';
import { AggregatedStats, LoadTestConfig } from '../types';

export async function createHttpServer(port: number) {
    const app = Fastify({ logger: false });

    // Allow JSON bodies up to 1MB
    app.addContentTypeParser('application/json', { parseAs: 'string', bodyLimit: 1_048_576 }, (_, body, done) => {
        try { done(null, JSON.parse(body as string)); } catch (e) { done(e as Error); }
    });

    app.get('/health', async () => ({ status: 'ok', version: '1.0.0', timestamp: Date.now() }));
    app.get('/configs', async () => ({ configs: await getConfigs() }));
    app.get('/results', async (req: any) => ({ results: await getResults(parseInt(req.query.limit || '50')) }));

    // Report generation endpoint
    app.post('/report', async (req: any) => {
        const { config, stats } = req.body as any;
        const { generateReport } = await import('../reporter');
        return { html: generateReport(config, stats) };
    });

    // ─── AI: Natural Language Intent Parser ───────────────────────────────────
    // POST /ai/parse-intent
    // Body: { prompt: string }
    // Returns: ParsedTestConfig (partial LoadTestConfig fields + confidence score)
    app.post('/ai/parse-intent', async (req: any, reply) => {
        const { prompt } = req.body as { prompt: string };

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
            return reply.status(400).send({ error: 'prompt must be at least 5 characters' });
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return reply.status(503).send({ error: 'AI features not configured — OPENROUTER_API_KEY missing' });
        }

        try {
            const parsed = await parseTestIntent(prompt);
            return { success: true, parsed };
        } catch (err: any) {
            console.error('[AI] parse-intent error:', err.message);
            return reply.status(500).send({ error: 'AI parsing failed', details: err.message });
        }
    });

    // ─── AI: Bottleneck Analyst (Streaming SSE) ────────────────────────────────
    // POST /ai/analyze
    // Body: { config: LoadTestConfig, stats: AggregatedStats }
    // Returns: Server-Sent Events stream of text tokens, then a final JSON event
    app.post('/ai/analyze', async (req: any, reply) => {
        const { config, stats } = req.body as { config: LoadTestConfig; stats: AggregatedStats };

        if (!config || !stats) {
            return reply.status(400).send({ error: 'config and stats are required' });
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return reply.status(503).send({ error: 'AI features not configured — OPENROUTER_API_KEY missing' });
        }

        // Set SSE headers for streaming
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        try {
            const result = await analyzeBottleneck(config, stats, (token) => {
                // Push each token as an SSE event
                reply.raw.write(`data: ${JSON.stringify({ type: 'token', text: token })}\n\n`);
            });

            // Final event with structured result
            reply.raw.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
            reply.raw.write('data: [DONE]\n\n');
        } catch (err: any) {
            console.error('[AI] analyze error:', err.message);
            reply.raw.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
        } finally {
            reply.raw.end();
        }
    });

    await app.listen({ port, host: '127.0.0.1' });
    console.log(`[HTTP] REST API on http://localhost:${port}`);
    return app;
}
