import type { AggregatedStats } from '../types';

interface StatCardProps { label: string; value: string | number; unit?: string; highlight?: 'good' | 'warn' | 'error' | 'info'; }

function StatCard({ label, value, unit, highlight = 'info' }: StatCardProps) {
    const colors = { good: 'text-emerald-400', warn: 'text-amber-400', error: 'text-red-400', info: 'text-[#38bdf8]' };
    return (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex flex-col gap-1">
            <span className="text-[10px] text-[#64748b] uppercase tracking-widest font-semibold">{label}</span>
            <span className={`text-2xl font-bold ${colors[highlight]}`}>{value}</span>
            {unit && <span className="text-xs text-[#475569]">{unit}</span>}
        </div>
    );
}

interface StatsGridProps { stats: AggregatedStats; }

export function StatsGrid({ stats }: StatsGridProps) {
    const errorPct = (stats.errorRate * 100).toFixed(1);
    const errorHighlight = stats.errorRate > 0.05 ? 'error' : stats.errorRate > 0.01 ? 'warn' : 'good';

    return (
        <div className="grid grid-cols-4 gap-3 mb-4">
            <StatCard label="Total Requests" value={stats.totalRequests.toLocaleString()} />
            <StatCard label="Throughput" value={stats.throughput.toFixed(1)} unit="req/sec" highlight="info" />
            <StatCard label="Error Rate" value={`${errorPct}%`} highlight={errorHighlight} />
            <StatCard label="Success" value={stats.successCount.toLocaleString()} highlight="good" />
            <StatCard label="P50 Latency" value={stats.latency.p50} unit="ms" highlight="info" />
            <StatCard label="P95 Latency" value={stats.latency.p95} unit="ms" highlight={stats.latency.p95 > 500 ? 'warn' : 'info'} />
            <StatCard label="P99 Latency" value={stats.latency.p99} unit="ms" highlight={stats.latency.p99 > 1000 ? 'error' : 'info'} />
            <StatCard label="Max Latency" value={stats.latency.max} unit="ms" highlight={stats.latency.max > 2000 ? 'error' : 'warn'} />
        </div>
    );
}
