import { useTestStore } from '../store/testStore';
import { StatsGrid } from '../components/StatsGrid';
import { PercentileChart } from '../components/charts/PercentileChart';
import { LatencyChart } from '../components/charts/LatencyChart';
import { ThroughputChart } from '../components/charts/ThroughputChart';
import { AIAnalystPanel } from '../components/AIAnalystPanel';
import { FileDown, CheckCircle } from 'lucide-react';

declare global { interface Window { electronAPI?: any; } }

export function ResultsPage() {
    const { stats, liveTimeline, currentConfig, status } = useTestStore();

    if (!stats || status === 'running') {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-[#475569]">
                <CheckCircle className="w-10 h-10" />
                <p className="text-sm">Results will appear here after a test completes</p>
            </div>
        );
    }

    const handleExport = async () => {
        const response = await fetch('http://localhost:3000/report', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ config: currentConfig, stats })
        });
        const { html } = await response.json();
        if (window.electronAPI) {
            await window.electronAPI.saveReport({ html, filename: `apexload-report-${Date.now()}.html` });
        }
    };

    return (
        <div className="flex flex-col gap-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                    Test Complete — <span className="text-[#38bdf8]">{currentConfig?.name}</span>
                </h2>
                <button onClick={handleExport}
                    className="flex items-center gap-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0f172a] font-bold px-4 py-2 rounded-lg text-sm transition-all">
                    <FileDown className="w-4 h-4" /> Export HTML Report
                </button>
            </div>

            {/* 🤖 AI Analyst Panel — shown prominently at top of results */}
            {currentConfig && (
                <AIAnalystPanel config={currentConfig} stats={stats} />
            )}

            <StatsGrid stats={stats} />

            <div className="grid grid-cols-2 gap-4">
                <LatencyChart data={liveTimeline} />
                <ThroughputChart data={liveTimeline} />
            </div>
            <PercentileChart stats={stats} />
        </div>
    );
}
