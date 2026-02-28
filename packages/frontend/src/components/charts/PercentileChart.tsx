import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import type { AggregatedStats } from '../../types';

interface Props { stats: AggregatedStats; }

export function PercentileChart({ stats }: Props) {
    const data = [
        { name: 'P50', value: stats.latency.p50 },
        { name: 'P75', value: stats.latency.p75 },
        { name: 'P90', value: stats.latency.p90 },
        { name: 'P95', value: stats.latency.p95 },
        { name: 'P99', value: stats.latency.p99 },
        { name: 'P99.9', value: stats.latency.p999 },
    ];

    const colors = ['#38bdf8', '#0ea5e9', '#6366f1', '#a78bfa', '#f472b6', '#f87171'];

    return (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">📊 Percentile Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}ms`} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(v) => [`${v}ms`, 'Latency']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
