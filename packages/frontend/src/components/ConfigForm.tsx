import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useTestStore } from '../store/testStore';
import { useNLBuilder } from '../hooks/useNLBuilder';
import { v4 as uuidv4 } from 'uuid';
import { Play, StopCircle, RotateCcw, Wand2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const schema = z.object({
    name: z.string().min(1, 'Name required'),
    url: z.string().url('Valid URL required'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    headers: z.string().optional(),
    body: z.string().optional(),
    concurrency: z.coerce.number().min(1).max(1000),
    totalRequests: z.coerce.number().min(1).max(100000),
    rampUpSeconds: z.coerce.number().min(0).max(300),
    timeoutMs: z.coerce.number().min(100).max(60000),
    thinkTimeMs: z.coerce.number().min(0).max(10000),
});

type FormValues = z.infer<typeof schema>;

interface ConfigFormProps { onSend: (type: string, payload?: any) => void; }

export function ConfigForm({ onSend }: ConfigFormProps) {
    const { status, reset, setCurrentConfig, nlParsing, nlError, nlPrompt, setNlPrompt } = useTestStore();
    const isRunning = status === 'running';
    const [showNL, setShowNL] = useState(true); // NL panel open by default

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            name: 'My API Test', url: 'https://httpbin.org/get',
            method: 'GET', concurrency: 10, totalRequests: 100,
            rampUpSeconds: 5, timeoutMs: 5000, thinkTimeMs: 0,
        }
    });

    // Hook that calls /ai/parse-intent and fills form fields
    const { parseIntent } = useNLBuilder(setValue);

    const onSubmit = (data: FormValues) => {
        let headers: Record<string, string> = {};
        try { if (data.headers) headers = JSON.parse(data.headers); } catch { }

        const config = {
            id: uuidv4(), name: data.name, url: data.url,
            method: data.method, headers,
            body: data.body || undefined,
            concurrency: data.concurrency, totalRequests: data.totalRequests,
            rampUpSeconds: data.rampUpSeconds, timeoutMs: data.timeoutMs, thinkTimeMs: data.thinkTimeMs,
        };
        setCurrentConfig(config);
        reset();
        onSend('START_TEST', config);
    };

    const Field = ({ label, name, type = 'text', placeholder, children }: { label: string; name: keyof FormValues; type?: string; placeholder?: string; children?: React.ReactNode }) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-[#64748b] uppercase tracking-wider font-medium">{label}</label>
            {children || (
                <input type={type} {...register(name)} placeholder={placeholder}
                    className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] transition-colors" />
            )}
            {errors[name] && <span className="text-red-400 text-xs">{errors[name]?.message as string}</span>}
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-4">

            {/* ─── 🤖 Natural Language Builder Panel ─────────────────────────────── */}
            <div className="bg-gradient-to-r from-[#0f172a] to-[#1a1f35] border border-[#38bdf8]/30 rounded-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setShowNL(!showNL)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                    <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-[#38bdf8]" />
                        <span className="text-sm font-semibold text-[#38bdf8]">🤖 AI Test Builder</span>
                        <span className="text-xs text-[#475569] ml-1">— describe your test in plain English</span>
                    </div>
                    {showNL ? <ChevronUp className="w-4 h-4 text-[#64748b]" /> : <ChevronDown className="w-4 h-4 text-[#64748b]" />}
                </button>

                {showNL && (
                    <div className="px-4 pb-4 flex flex-col gap-3">
                        <textarea
                            value={nlPrompt}
                            onChange={(e) => setNlPrompt(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    parseIntent(nlPrompt);
                                }
                            }}
                            placeholder={`Examples:\n• "stress test https://api.myapp.com/login with 200 concurrent users, POST, ramp up 30 seconds"\n• "quick smoke test on localhost:3000/health"\n• "soak test my checkout endpoint for 5 minutes with 50 users and bearer token auth"`}
                            rows={3}
                            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#334155] focus:outline-none focus:border-[#38bdf8] resize-none font-mono text-xs leading-relaxed"
                        />

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={nlParsing || !nlPrompt.trim()}
                                onClick={() => parseIntent(nlPrompt)}
                                className="flex items-center gap-2 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] font-semibold px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {nlParsing
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing with Claude...</>
                                    : <><Wand2 className="w-4 h-4" /> Auto-fill Form</>
                                }
                            </button>
                            <span className="text-xs text-[#475569]">or Cmd/Ctrl+Enter</span>
                        </div>

                        {nlError && (
                            <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">
                                <span className="text-red-400 text-xs mt-0.5">⚠</span>
                                <span className="text-red-300 text-xs">{nlError}</span>
                            </div>
                        )}

                        {!nlParsing && !nlError && nlPrompt && (
                            <p className="text-xs text-emerald-400/70">
                                ✓ Fields auto-filled below — review and adjust before starting
                            </p>
                        )}
                    </div>
                )}
            </div>
            {/* ─────────────────────────────────────────────────────────────────────── */}

            <form onSubmit={handleSubmit(onSubmit as any)} className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="flex flex-col gap-4">
                    <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]">
                        <h2 className="text-sm font-semibold text-[#38bdf8] mb-4 uppercase tracking-wider">🎯 Endpoint</h2>
                        <div className="flex flex-col gap-3">
                            <Field label="Test Name" name="name" placeholder="My API Load Test" />
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Field label="URL" name="url" placeholder="https://api.example.com/endpoint" />
                                </div>
                                <div className="w-32">
                                    <Field label="Method" name="method">
                                        <select {...register('method')} className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-[#38bdf8]">
                                            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m}>{m}</option>)}
                                        </select>
                                    </Field>
                                </div>
                            </div>
                            <Field label="Headers (JSON)" name="headers" placeholder='{"Authorization": "Bearer token"}' />
                            <Field label="Body (JSON)" name="body" placeholder='{"key": "value"}' />
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                    <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155]">
                        <h2 className="text-sm font-semibold text-[#38bdf8] mb-4 uppercase tracking-wider">⚡ Load Profile</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Concurrency (workers)" name="concurrency" type="number" placeholder="10" />
                            <Field label="Total Requests" name="totalRequests" type="number" placeholder="100" />
                            <Field label="Ramp Up (seconds)" name="rampUpSeconds" type="number" placeholder="5" />
                            <Field label="Timeout (ms)" name="timeoutMs" type="number" placeholder="5000" />
                            <Field label="Think Time (ms)" name="thinkTimeMs" type="number" placeholder="0" />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {!isRunning ? (
                            <button type="submit" className="flex-1 flex items-center justify-center gap-2 bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#0f172a] font-bold py-3 rounded-xl transition-all text-sm">
                                <Play className="w-4 h-4" /> Start Load Test
                            </button>
                        ) : (
                            <button type="button" onClick={() => onSend('STOP_TEST')}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all text-sm">
                                <StopCircle className="w-4 h-4" /> Stop Test
                            </button>
                        )}
                        <button type="button" onClick={() => reset()}
                            className="px-4 py-3 bg-[#334155] hover:bg-[#475569] text-white rounded-xl transition-all">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
