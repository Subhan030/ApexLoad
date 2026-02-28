import './index.css';
import { useTestStore } from './store/testStore';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { send } = useWebSocket();
  const { connected, status, aiStreaming } = useTestStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a]">
      <div className="flex flex-col items-center gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9] flex items-center justify-center">
            <span className="text-[#0f172a] font-bold text-lg">⚡</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">ApexLoad</h1>
            <p className="text-xs text-[#64748b]">API Performance Testing Tool</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 max-w-md w-full mt-4">
          <div className="flex items-center justify-center gap-3 text-sm">
            <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
            <span className="text-[#334155]">|</span>
            <span className="text-[#94a3b8]">
              Status: <span className="text-white font-medium">{status}</span>
            </span>
            <span className="text-[#334155]">|</span>
            <span className="text-[#94a3b8]">
              AI: <span className="text-white font-medium">{aiStreaming ? 'streaming' : 'idle'}</span>
            </span>
          </div>
          <p className="text-xs text-[#475569] text-center mt-3">
            Phase F2 complete — WebSocket layer & Zustand store wired.
          </p>
          <div className="flex justify-center gap-3 mt-4">
            <span className="px-3 py-1 bg-[#38bdf8]/10 text-[#38bdf8] text-xs font-medium rounded-lg border border-[#38bdf8]/20">
              React 19
            </span>
            <span className="px-3 py-1 bg-[#38bdf8]/10 text-[#38bdf8] text-xs font-medium rounded-lg border border-[#38bdf8]/20">
              TypeScript
            </span>
            <span className="px-3 py-1 bg-[#38bdf8]/10 text-[#38bdf8] text-xs font-medium rounded-lg border border-[#38bdf8]/20">
              Tailwind v4
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20">
              Zustand
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20">
              WebSocket
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
