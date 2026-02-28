import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { AggregatedStats, LoadTestConfig } from '../types';

const TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ApexLoad Performance Report — {{config.name}}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
  h1 { font-size: 1.8rem; color: #38bdf8; margin-bottom: 0.25rem; }
  .subtitle { color: #64748b; margin-bottom: 2rem; font-size: 0.9rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .card { background: #1e293b; border-radius: 12px; padding: 1.25rem; border: 1px solid #334155; }
  .card .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .card .value { font-size: 1.8rem; font-weight: 700; color: #38bdf8; margin-top: 0.25rem; }
  .card .unit { font-size: 0.8rem; color: #94a3b8; }
  .card.error .value { color: #f87171; }
  .card.success .value { color: #34d399; }
  .section { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #334155; }
  .section h2 { font-size: 1rem; color: #94a3b8; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 0.5rem 1rem; color: #64748b; font-size: 0.75rem; text-transform: uppercase; }
  td { padding: 0.5rem 1rem; border-top: 1px solid #334155; font-size: 0.9rem; }
  .bar-container { display: flex; align-items: center; gap: 0.5rem; }
  .bar { height: 8px; background: #38bdf8; border-radius: 4px; }
  canvas { max-height: 280px; }
  .bottleneck { background: #7c2d12; border: 1px solid #ea580c; border-radius: 8px; padding: 1rem; margin-top: 1rem; color: #fed7aa; }
  .bottleneck h3 { color: #fb923c; margin-bottom: 0.5rem; }
</style>
</head>
<body>
<h1>⚡ ApexLoad Performance Report</h1>
<p class="subtitle">{{config.name}} · {{config.url}} · {{formattedDate}}</p>

<div class="grid">
  <div class="card"><div class="label">Total Requests</div><div class="value">{{stats.totalRequests}}</div></div>
  <div class="card success"><div class="label">Success</div><div class="value">{{stats.successCount}}</div></div>
  <div class="card error"><div class="label">Errors</div><div class="value">{{stats.errorCount}}</div><div class="unit">{{errorRatePct}}% error rate</div></div>
  <div class="card"><div class="label">Throughput</div><div class="value">{{throughput}}</div><div class="unit">req/sec</div></div>
  <div class="card"><div class="label">P50 Latency</div><div class="value">{{stats.latency.p50}}</div><div class="unit">ms</div></div>
  <div class="card"><div class="label">P95 Latency</div><div class="value">{{stats.latency.p95}}</div><div class="unit">ms</div></div>
  <div class="card"><div class="label">P99 Latency</div><div class="value">{{stats.latency.p99}}</div><div class="unit">ms</div></div>
  <div class="card"><div class="label">Max Latency</div><div class="value">{{stats.latency.max}}</div><div class="unit">ms</div></div>
</div>

<div class="section">
  <h2>📊 Latency Distribution</h2>
  <canvas id="latencyChart"></canvas>
</div>

<div class="section">
  <h2>📈 Throughput Timeline</h2>
  <canvas id="throughputChart"></canvas>
</div>

<div class="section">
  <h2>🎯 Percentile Breakdown</h2>
  <table>
    <tr><th>Percentile</th><th>Latency</th><th>Distribution</th></tr>
    <tr><td>p50 (Median)</td><td>{{stats.latency.p50}} ms</td><td><div class="bar-container"><div class="bar" style="width:{{p50Pct}}%"></div><span>{{p50Pct}}%</span></div></td></tr>
    <tr><td>p75</td><td>{{stats.latency.p75}} ms</td><td><div class="bar-container"><div class="bar" style="width:{{p75Pct}}%"></div><span>{{p75Pct}}%</span></div></td></tr>
    <tr><td>p90</td><td>{{stats.latency.p90}} ms</td><td><div class="bar-container"><div class="bar" style="width:{{p90Pct}}%"></div><span>{{p90Pct}}%</span></div></td></tr>
    <tr><td>p95</td><td>{{stats.latency.p95}} ms</td><td><div class="bar-container"><div class="bar" style="width:{{p95Pct}}%"></div><span>{{p95Pct}}%</span></div></td></tr>
    <tr><td>p99</td><td>{{stats.latency.p99}} ms</td><td><div class="bar-container"><div class="bar" style="width:{{p99Pct}}%"></div><span>{{p99Pct}}%</span></div></td></tr>
    <tr><td>p99.9</td><td>{{stats.latency.p999}} ms</td><td><div class="bar-container"><div class="bar" style="width:100%"></div><span>100%</span></div></td></tr>
  </table>
</div>

{{#if hasBottleneck}}
<div class="bottleneck">
  <h3>⚠️ Bottleneck Detected</h3>
  <p>{{bottleneckMessage}}</p>
</div>
{{/if}}

<script>
const timelineLabels = {{{timelineLabels}}};
const p50Data = {{{p50Data}}};
const p95Data = {{{p95Data}}};
const throughputData = {{{throughputData}}};

new Chart(document.getElementById('latencyChart'), {
  type: 'line',
  data: {
    labels: timelineLabels,
    datasets: [
      { label: 'P50', data: p50Data, borderColor: '#38bdf8', tension: 0.3, fill: false },
      { label: 'P95', data: p95Data, borderColor: '#f472b6', tension: 0.3, fill: false }
    ]
  },
  options: { plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' }, title: { display: true, text: 'ms', color: '#94a3b8' } } } }
});

new Chart(document.getElementById('throughputChart'), {
  type: 'bar',
  data: { labels: timelineLabels, datasets: [{ label: 'Req/s', data: throughputData, backgroundColor: '#34d39955' , borderColor: '#34d399', borderWidth: 1 }] },
  options: { plugins: { legend: { labels: { color: '#e2e8f0' } } }, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' }, title: { display: true, text: 'req/s', color: '#94a3b8' } } } }
});
</script>
</body>
</html>`;

export function generateReport(config: LoadTestConfig, stats: AggregatedStats): string {
    const template = Handlebars.compile(TEMPLATE);
    const maxLatency = stats.latency.p999 || 1;

    const timeline = stats.timeline;
    const labels = JSON.stringify(timeline.map((_, i) => `${i + 1}s`));
    const p50Data = JSON.stringify(timeline.map(t => t.latencyP50));
    const p95Data = JSON.stringify(timeline.map(t => t.latencyP95));
    const throughputData = JSON.stringify(timeline.map(t => t.throughput.toFixed(2)));

    // Bottleneck detection
    const p99ToP50Ratio = stats.latency.p99 / Math.max(1, stats.latency.p50);
    const hasBottleneck = stats.errorRate > 0.05 || p99ToP50Ratio > 5;
    let bottleneckMessage = '';
    if (stats.errorRate > 0.05) bottleneckMessage += `High error rate (${(stats.errorRate * 100).toFixed(1)}%) — server may be overloaded. `;
    if (p99ToP50Ratio > 5) bottleneckMessage += `P99 is ${p99ToP50Ratio.toFixed(1)}x higher than P50 — significant latency tail, check slow queries or GC pauses.`;

    return template({
        config,
        stats,
        formattedDate: new Date().toLocaleString(),
        errorRatePct: (stats.errorRate * 100).toFixed(2),
        throughput: stats.throughput.toFixed(2),
        p50Pct: Math.round((stats.latency.p50 / maxLatency) * 100),
        p75Pct: Math.round((stats.latency.p75 / maxLatency) * 100),
        p90Pct: Math.round((stats.latency.p90 / maxLatency) * 100),
        p95Pct: Math.round((stats.latency.p95 / maxLatency) * 100),
        p99Pct: Math.round((stats.latency.p99 / maxLatency) * 100),
        timelineLabels: labels,
        p50Data, p95Data, throughputData,
        hasBottleneck, bottleneckMessage
    });
}

export function saveReport(config: LoadTestConfig, stats: AggregatedStats, outputPath: string): string {
    const html = generateReport(config, stats);
    const filePath = path.resolve(outputPath);
    fs.writeFileSync(filePath, html, 'utf-8');
    return filePath;
}
