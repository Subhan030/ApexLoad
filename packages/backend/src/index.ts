// ApexLoad Backend — Entry Point
import 'dotenv/config';
import { WSServer } from './api/ws-server';
import { createHttpServer } from './api/http-server';

const WS_PORT = 8765;
const HTTP_PORT = 3000;

const wsServer = new WSServer(WS_PORT);
console.log('Backend ready. Connect via ws://localhost:' + WS_PORT);

createHttpServer(HTTP_PORT).catch((err) => {
    console.error('[HTTP] Failed to start:', err);
    process.exit(1);
});
