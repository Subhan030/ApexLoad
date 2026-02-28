import { useTestStore } from '../store/testStore';
import { StatsGrid } from '../components/StatsGrid';
import { PercentileChart } from '../components/charts/PercentileChart';
import { LatencyChart } from '../components/charts/LatencyChart';
import { ThroughputChart } from '../components/charts/ThroughputChart';
import { AIAnalystPanel } from '../components/AIAnalystPanel';
import { FileDown, CheckCircle, Bot } from 'lucide-react';

declare global { interface Window { electronAPI?: any; } }

export function ResultsPage() {
    const { stats, liveTimeline, currentConfig, status, aiAnalysis } = useTestStore();

    if (!stats || status === 'running') {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-[#475569]">
                <CheckCircle className="w-10 h-10" />
                <p className="text-sm">Results will appear here after a test completes</p>
            </div>
        );
    }

    const handleExportHTML = async () => {
        const response = await fetch('http://localhost:3000/report', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ config: currentConfig, stats })
        });
        const { html } = await response.json();
        if (window.electronAPI) {
            await window.electronAPI.saveReport({ html, filename: `apexload-report-${Date.now()}.html` });
        } else {
            // Fallback for web browser
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `apexload-report-${Date.now()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleExportAI = () => {
        const aiAnalysisText = aiAnalysis ? JSON.stringify(aiAnalysis, null, 2) :
            (stats ? JSON.stringify(stats, null, 2) : null);
        if (!aiAnalysisText) return;

        const blob = new Blob([aiAnalysisText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apexload-ai-analysis-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-4 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                    Test Complete — <span className="text-[#38bdf8]">{currentConfig?.name}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={handleExportHTML}
                        className="flex items-center gap-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0f172a] font-bold px-4 py-2 rounded-lg text-sm transition-all">
                        <FileDown className="w-4 h-4" /> Export HTML
                    </button>
                    <button onClick={handleExportAI}
                        className="flex items-center gap-2 bg-purple-500 hover:bg-purple-400 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all">
                        <Bot className="w-4 h-4" /> Export AI Analysis
                    </button>
                </div>
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
