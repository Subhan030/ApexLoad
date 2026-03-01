import { useEffect, useRef, useCallback } from 'react';
import { useTestStore } from '../store/testStore';

const WS_URL = 'ws://localhost:8765';

export function useWebSocket() {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { setConnected } = useTestStore();

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            ws.send(JSON.stringify({ type: 'GET_STATUS' }));
        };

        ws.onclose = () => {
            setConnected(false);
            reconnectTimer.current = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
            ws.close();
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleMessage(msg);
            } catch (e) {
                console.error('WS parse error', e);
            }
        };
    }, [setConnected]);

    function handleMessage(msg: { type: string; payload: any }) {
        const { setStats, setStatus, setSessionId, addTimelinePoint } = useTestStore.getState();
        switch (msg.type) {
            case 'TEST_STARTED':
                setStatus('running');
                setSessionId(msg.payload.sessionId);
                break;
            case 'STATS_UPDATE':
                setStats(msg.payload.stats);
                if (msg.payload.stats.timeline?.length > 0) {
                    const latest = msg.payload.stats.timeline.at(-1);
                    if (latest) addTimelinePoint(latest);
                }
                break;
            case 'STATUS_CHANGE':
                setStatus(msg.payload.status);
                break;
            case 'TEST_COMPLETE':
                setStats(msg.payload.stats);
                setStatus('completed');
                break;
            case 'TEST_ERROR':
                setStatus('error');
                break;
            case 'STATUS':
                if (msg.payload.running === false && useTestStore.getState().status === 'running') {
                    // Test finished or aborted while disconnected
                    setStatus('completed');
                }
                break;
        }
    }

    const send = useCallback((type: string, payload?: any) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type, payload }));
        }
    }, []);

    useEffect(() => {
        connect();
        return () => {
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            if (wsRef.current) {
                // Prevents infinite reconnect loops on StrictMode unmount
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [connect]);

    return { send };
}
