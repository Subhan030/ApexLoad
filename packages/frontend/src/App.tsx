import './index.css';

function App() {
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
          <p className="text-sm text-[#94a3b8] text-center">
            Frontend scaffold ready. Connect the backend and WebSocket layer to begin load testing.
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
