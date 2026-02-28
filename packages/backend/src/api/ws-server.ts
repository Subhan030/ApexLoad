import { WebSocket, WebSocketServer } from 'ws';
import { AggregatedStats, LoadTestConfig, TestStatus } from '../types';
import { LoadEngine } from '../engine/orchestrator';
import { saveResult, saveConfig } from '../db';
import { v4 as uuidv4 } from 'uuid';

interface WSMessage {
    type: string;
    payload?: any;
}

export class WSServer {
    private wss: WebSocketServer;
    private activeEngine?: LoadEngine;
    private activeSessionId?: string;
    private clients: Set<WebSocket> = new Set();

    constructor(port: number) {
        this.wss = new WebSocketServer({ port });
        this.wss.on('connection', (ws) => this.handleConnection(ws));
        console.log(`[WS] Server listening on ws://localhost:${port}`);
    }

    private broadcast(type: string, payload: any): void {
        const msg = JSON.stringify({ type, payload });
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    }

    private handleConnection(ws: WebSocket): void {
        this.clients.add(ws);
        ws.on('close', () => this.clients.delete(ws));
        ws.on('message', (raw) => {
            try {
                const msg: WSMessage = JSON.parse(raw.toString());
                this.handleMessage(ws, msg);
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', payload: 'Invalid JSON' }));
            }
        });

        ws.send(JSON.stringify({ type: 'connected', payload: { version: '1.0.0' } }));
    }

    private async handleMessage(ws: WebSocket, msg: WSMessage): Promise<void> {
        switch (msg.type) {

            case 'START_TEST': {
                if (this.activeEngine) {
                    ws.send(JSON.stringify({ type: 'error', payload: 'Test already running' }));
                    return;
                }

                const config: LoadTestConfig = { ...msg.payload, id: msg.payload.id || uuidv4() };
                await saveConfig(config.id, config.name, config);

                this.activeSessionId = uuidv4();
                this.activeEngine = new LoadEngine(config);
                await saveResult(this.activeSessionId, config.id, new Date(), 'running');

                this.activeEngine.on('result', (result, stats) => {
                    this.broadcast('STATS_UPDATE', { stats, latestResult: result });
                });

                this.activeEngine.on('status', (status: TestStatus) => {
                    this.broadcast('STATUS_CHANGE', { status });
                });

                this.activeEngine.on('complete', async (stats: AggregatedStats) => {
                    await saveResult(this.activeSessionId!, config.id, new Date(), 'completed', stats, new Date());
                    this.broadcast('TEST_COMPLETE', { stats, sessionId: this.activeSessionId });
                    this.activeEngine = undefined;
                    this.activeSessionId = undefined;
                });

                this.activeEngine.on('error', (err) => {
                    this.broadcast('TEST_ERROR', { error: err.message });
                    this.activeEngine = undefined;
                });

                this.broadcast('TEST_STARTED', { sessionId: this.activeSessionId, config });
                this.activeEngine.start().catch(err => {
                    this.broadcast('TEST_ERROR', { error: err.message });
                    this.activeEngine = undefined;
                });
                break;
            }

            case 'STOP_TEST': {
                if (this.activeEngine) {
                    this.activeEngine.stop();
                }
                break;
            }

            case 'GET_STATUS': {
                ws.send(JSON.stringify({
                    type: 'STATUS',
                    payload: { running: !!this.activeEngine }
                }));
                break;
            }

            default:
                ws.send(JSON.stringify({ type: 'error', payload: `Unknown message type: ${msg.type}` }));
        }
    }
}
