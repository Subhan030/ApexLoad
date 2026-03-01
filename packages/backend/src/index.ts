import 'dotenv/config';
import { WSServer } from './api/ws-server';
import { createHttpServer } from './api/http-server';
import { initializeDatabase } from './db';

const WS_PORT = 8765;
const HTTP_PORT = 3000;

async function main() {
    // Ensure database tables exist (critical for packaged Electron app)
    initializeDatabase();

    await createHttpServer(HTTP_PORT);
    new WSServer(WS_PORT);

    const aiEnabled = !!process.env.OPENROUTER_API_KEY;

    console.log('');
    console.log('🚀 ApexLoad Backend Ready');
    console.log(`   REST API  → http://localhost:${HTTP_PORT}`);
    console.log(`   WebSocket → ws://localhost:${WS_PORT}`);
    console.log(`   AI Engine → ${aiEnabled ? '✅ Enabled (OpenRouter — anthropic/claude-3.5-sonnet)' : '⚠️  Disabled (set OPENROUTER_API_KEY)'}`);
    if (aiEnabled) {
        console.log(`     POST /ai/parse-intent  — Natural Language Test Builder`);
        console.log(`     POST /ai/analyze       — Streaming Bottleneck Analyst`);
    }
    console.log('');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
