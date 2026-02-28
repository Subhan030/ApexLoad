import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TimelinePoint } from '../../types';

interface Props { data: TimelinePoint[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3 text-xs">
            <p className="text-[#64748b] mb-1">t+{label}s</p>
            {payload.map((p: any) => (
                <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}ms</p>
            ))}
        </div>
    );
};

export function LatencyChart({ data }: Props) {
    const chartData = data.map((p, i) => ({
        t: i + 1,
        p50: p.latencyP50,
        p95: p.latencyP95,
    }));

    return (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">📉 Latency Over Time</h3>
            <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}s`} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}ms`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Line type="monotone" dataKey="p50" stroke="#38bdf8" strokeWidth={2} dot={false} name="P50" isAnimationActive={false} />
                    <Line type="monotone" dataKey="p95" stroke="#f472b6" strokeWidth={2} dot={false} name="P95" isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
