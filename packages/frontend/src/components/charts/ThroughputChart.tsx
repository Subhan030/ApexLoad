import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { TimelinePoint } from '../../types';

interface Props { data: TimelinePoint[]; }

export function ThroughputChart({ data }: Props) {
    const chartData = data.map((p, i) => ({
        t: i + 1,
        rps: parseFloat(p.throughput.toFixed(2)),
        errorRate: parseFloat((p.errorRate * 100).toFixed(2)),
    }));

    return (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">⚡ Throughput (req/s)</h3>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}s`} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} labelStyle={{ color: '#64748b' }} />
                    <Area type="monotone" dataKey="rps" stroke="#34d399" fill="url(#throughputGrad)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
