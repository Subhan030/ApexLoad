import { useCallback, useState } from 'react';
import { useTestStore } from '../store/testStore';
import type { LoadTestConfig, AggregatedStats } from '../types';
import { BrainCircuit, Loader2, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = 'http://localhost:3000';

interface AIAnalystPanelProps {
    config: LoadTestConfig;
    stats: AggregatedStats;
}

const SEVERITY_CONFIG = {
    healthy: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-600/30', label: 'Healthy' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-600/30', label: 'Warning' },
    critical: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20 border-red-600/30', label: 'Critical' },
};

export function AIAnalystPanel({ config, stats }: AIAnalystPanelProps) {
    const {
        aiAnalysis, setAiAnalysis,
        aiStreaming, setAiStreaming,
        aiStreamText, appendAiStreamText, clearAiStreamText
    } = useTestStore();
    const [expanded, setExpanded] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);

    const runAnalysis = useCallback(async () => {
        setAiStreaming(true);
        clearAiStreamText();
        setAiAnalysis(null);
        setHasStarted(true);

        try {
            const res = await fetch(`${API_BASE}/ai/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config, stats })
            });

            if (!res.ok || !res.body) throw new Error('Analysis request failed');

            // Read SSE stream
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const lines = decoder.decode(value).split('\n');
                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') break;

                    try {
                        const event = JSON.parse(data);
                        if (event.type === 'token') {
                            appendAiStreamText(event.text);
                        } else if (event.type === 'complete') {
                            setAiAnalysis(event.result);
                        } else if (event.type === 'error') {
                            throw new Error(event.message);
                        }
                    } catch {
                        // Skip malformed SSE lines
                    }
                }
            }
        } catch (err: any) {
            appendAiStreamText(`\n\n❌ Analysis failed: ${err.message}`);
        } finally {
            setAiStreaming(false);
        }
    }, [config, stats, setAiStreaming, clearAiStreamText, setAiAnalysis, appendAiStreamText]);

    const severityConfig = aiAnalysis
        ? SEVERITY_CONFIG[aiAnalysis.severity]
        : SEVERITY_CONFIG.warning;

    return (
        <div className={`rounded-xl border overflow-hidden transition-all ${aiAnalysis ? severityConfig.bg : 'bg-[#1e293b] border-[#334155]'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <BrainCircuit className={`w-5 h-5 ${aiAnalysis ? severityConfig.color : 'text-[#38bdf8]'}`} />
                    <span className="font-semibold text-sm text-white">🤖 AI Bottleneck Analyst</span>
                    {aiAnalysis && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${severityConfig.bg} ${severityConfig.color} font-medium`}>
                            {severityConfig.label}
                        </span>
                    )}
                    {aiStreaming && (
                        <span className="flex items-center gap-1 text-xs text-[#38bdf8] animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!aiStreaming && (
                        <button
                            onClick={runAnalysis}
                            className="flex items-center gap-1.5 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        >
                            <BrainCircuit className="w-3.5 h-3.5" />
                            {hasStarted ? 'Re-Analyze' : 'Analyze with Claude'}
                        </button>
                    )}
                    {hasStarted && (
                        <button onClick={() => setExpanded(!expanded)} className="text-[#64748b] hover:text-white">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Streaming / Analysis Content */}
            {expanded && hasStarted && (
                <div className="px-4 pb-4">
                    {/* Structured Issues & Suggestions (shown after stream completes) */}
                    {aiAnalysis && aiAnalysis.detectedIssues.length > 0 && (
                        <div className="mb-3 grid grid-cols-2 gap-3">
                            <div className="bg-[#0f172a]/60 rounded-lg p-3">
                                <p className="text-xs text-[#64748b] uppercase tracking-wider font-semibold mb-2">Issues Detected</p>
                                <ul className="flex flex-col gap-1">
                                    {aiAnalysis.detectedIssues.map((issue, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-red-300">
                                            <span className="text-red-400 mt-0.5 shrink-0">•</span>{issue}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-[#0f172a]/60 rounded-lg p-3">
                                <p className="text-xs text-[#64748b] uppercase tracking-wider font-semibold mb-2">Recommended Actions</p>
                                <ul className="flex flex-col gap-1">
                                    {aiAnalysis.suggestions.map((sug, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-emerald-300">
                                            <span className="text-emerald-400 mt-0.5 shrink-0">→</span>{sug}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Full streaming markdown text */}
                    <div className="bg-[#0f172a]/40 rounded-lg p-4 font-mono text-xs text-[#cbd5e1] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                        {aiStreamText || (aiStreaming ? <span className="text-[#38bdf8] animate-pulse">Claude is thinking...</span> : null)}
                        {/* Blinking cursor while streaming */}
                        {aiStreaming && <span className="inline-block w-2 h-3 bg-[#38bdf8] ml-0.5 animate-pulse" />}
                    </div>

                    {aiAnalysis && (
                        <p className="text-xs text-[#475569] mt-2">
                            Analysis generated at {new Date(aiAnalysis.generatedAt).toLocaleTimeString()}
                        </p>
                    )}
                </div>
            )}

            {/* Initial CTA (before first analysis) */}
            {!hasStarted && (
                <div className="px-4 pb-4 text-xs text-[#475569]">
                    Click "Analyze with Claude" to get an AI-powered diagnosis of your test results — Claude will identify bottlenecks, explain root causes, and suggest fixes.
                </div>
            )}
        </div>
    );
}
