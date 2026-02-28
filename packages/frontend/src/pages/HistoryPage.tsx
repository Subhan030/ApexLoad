import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export function HistoryPage() {
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        fetch('http://localhost:3000/results')
            .then(r => r.json())
            .then(data => setResults(data.results || []))
            .catch(() => { });
    }, []);

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
                const stats = r.stats_json ? JSON.parse(r.stats_json) : null;
                const config = r.config_json ? JSON.parse(r.config_json) : null;
                return (
                    <div key={r.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold text-white">{r.config_name}</p>
                                <p className="text-xs text-[#64748b] mt-0.5">{config?.url} · {new Date(r.started_at).toLocaleString()}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'completed' ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'}`}>
                                {r.status}
                            </span>
                        </div>
                        {stats && (
                            <div className="grid grid-cols-4 gap-3 mt-3">
                                {[
                                    { label: 'Requests', value: stats.totalRequests },
                                    { label: 'Throughput', value: `${stats.throughput?.toFixed(1)} rps` },
                                    { label: 'P99', value: `${stats.latency?.p99}ms` },
                                    { label: 'Errors', value: `${(stats.errorRate * 100).toFixed(1)}%` },
                                ].map(item => (
                                    <div key={item.label} className="bg-[#0f172a] rounded-lg p-2 text-center">
                                        <p className="text-xs text-[#64748b]">{item.label}</p>
                                        <p className="text-sm font-bold text-[#38bdf8]">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
