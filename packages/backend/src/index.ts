// ApexLoad Backend — Entry Point
import { WSServer } from './api/ws-server';

const WS_PORT = 8765;
const server = new WSServer(WS_PORT);
console.log('Backend ready. Connect via ws://localhost:' + WS_PORT);
