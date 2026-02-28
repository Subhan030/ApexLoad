import { useEffect, useState } from 'react';
import { Clock, FileDown, Bot } from 'lucide-react';

export function HistoryPage() {
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        fetch('http://localhost:3000/results')
            .then(r => r.json())
            .then(data => setResults(data.results || []))
            .catch(() => { });
    }, []);

    const handleExportHTML = async (config: any, stats: any) => {
        if (!config || !stats) return;
        const response = await fetch('http://localhost:3000/report', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ config, stats })
        });
        const { html } = await response.json();

        // Use web fallback since we are in the browser
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apexload-report-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportAI = (aiAnalysisText: string | null) => {
        if (!aiAnalysisText) return;

        // Export the raw AI text or JSON analysis as a text file
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

    if (!results.length) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-[#475569]">
                <Clock className="w-10 h-10" />
                <p className="text-sm">No test history yet</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
            <h2 className="text-lg font-bold text-white mb-2">Test History</h2>
            {results.map((r: any) => {
                const stats = r.statsJson ? JSON.parse(r.statsJson) : null;
                const config = r.config?.configJson ? JSON.parse(r.config.configJson) : null;
                return (
                    <div key={r.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-white">{r.config?.name || 'Unknown'}</p>
                                <p className="text-xs text-[#64748b] mt-0.5">{config?.url} · {new Date(r.startedAt).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'completed' ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'}`}>
                                    {r.status}
                                </span>
                            </div>
                        </div>
                        {stats && (
                            <div className="mt-3 flex flex-col gap-3">
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { label: 'Requests', value: stats.totalRequests || 0 },
                                        { label: 'Throughput', value: `${(stats.throughput || 0).toFixed(1)} rps` },
                                        { label: 'P99', value: `${stats.latency?.p99 || 0}ms` },
                                        { label: 'Errors', value: `${((stats.errorRate || 0) * 100).toFixed(1)}%` },
                                    ].map(item => (
                                        <div key={item.label} className="bg-[#0f172a] rounded-lg p-2 text-center">
                                            <p className="text-xs text-[#64748b]">{item.label}</p>
                                            <p className="text-sm font-bold text-[#38bdf8]">{item.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Export Actions */}
                                <div className="flex items-center gap-2 pt-2 border-t border-[#334155]">
                                    <button
                                        onClick={() => handleExportHTML(config, stats)}
                                        className="flex flex-1 items-center justify-center gap-2 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 px-3 py-1.5 rounded text-xs font-semibold text-[#38bdf8] transition-colors"
                                    >
                                        <FileDown className="w-3.5 h-3.5" /> HTML Report
                                    </button>

                                    <button
                                        onClick={() => handleExportAI(r.ai_analysis || (stats && JSON.stringify(stats, null, 2)))}
                                        className="flex flex-1 items-center justify-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded text-xs font-semibold text-purple-400 transition-colors"
                                    >
                                        <Bot className="w-3.5 h-3.5" /> AI Analysis
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
