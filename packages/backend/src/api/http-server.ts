import Fastify from 'fastify';
import { getConfigs, getResults } from '../db';

export async function createHttpServer(port: number) {
    const app = Fastify({ logger: false });

    app.get('/health', async () => ({ status: 'ok', version: '1.0.0', timestamp: Date.now() }));

    app.get('/configs', async () => ({ configs: await getConfigs() }));

    app.get('/results', async (req: any) => {
        const limit = parseInt(req.query.limit || '50');
        return { results: await getResults(limit) };
    });

    await app.listen({ port, host: '127.0.0.1' });
    console.log(`[HTTP] REST API on http://localhost:${port}`);
    return app;
}
