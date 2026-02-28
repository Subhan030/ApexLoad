import { create } from 'zustand';
import type { AggregatedStats, LoadTestConfig, TestStatus, TimelinePoint, AIAnalysisResult } from '../types';

interface TestStore {
    // Connection
    connected: boolean;
    setConnected: (v: boolean) => void;

    // Test state
    status: TestStatus;
    setStatus: (s: TestStatus) => void;

    sessionId: string | null;
    setSessionId: (id: string | null) => void;

    // Config
    currentConfig: LoadTestConfig | null;
    setCurrentConfig: (c: LoadTestConfig) => void;

    // Stats
    stats: AggregatedStats | null;
    setStats: (s: AggregatedStats) => void;

    // Live timeline (ring buffer — last 120 points)
    liveTimeline: TimelinePoint[];
    addTimelinePoint: (p: TimelinePoint) => void;

    // 🤖 AI: Natural Language parsing state
    nlPrompt: string;
    setNlPrompt: (s: string) => void;
    nlParsing: boolean;
    setNlParsing: (v: boolean) => void;
    nlError: string | null;
    setNlError: (e: string | null) => void;

    // 🤖 AI: Bottleneck analysis state
    aiAnalysis: AIAnalysisResult | null;
    setAiAnalysis: (a: AIAnalysisResult | null) => void;
    aiStreaming: boolean;
    setAiStreaming: (v: boolean) => void;
    aiStreamText: string;          // Accumulates tokens as they arrive
    appendAiStreamText: (t: string) => void;
    clearAiStreamText: () => void;

    // Actions
    reset: () => void;
}

export const useTestStore = create<TestStore>((set) => ({
    connected: false,
    setConnected: (connected) => set({ connected }),

    status: 'idle',
    setStatus: (status) => set({ status }),

    sessionId: null,
    setSessionId: (sessionId) => set({ sessionId }),

    currentConfig: null,
    setCurrentConfig: (currentConfig) => set({ currentConfig }),

    stats: null,
    setStats: (stats) => set({ stats }),

    liveTimeline: [],
    addTimelinePoint: (p) =>
        set((state) => ({ liveTimeline: [...state.liveTimeline.slice(-119), p] })),

    // 🤖 AI state
    nlPrompt: '',
    setNlPrompt: (nlPrompt) => set({ nlPrompt }),
    nlParsing: false,
    setNlParsing: (nlParsing) => set({ nlParsing }),
    nlError: null,
    setNlError: (nlError) => set({ nlError }),

    aiAnalysis: null,
    setAiAnalysis: (aiAnalysis) => set({ aiAnalysis }),
    aiStreaming: false,
    setAiStreaming: (aiStreaming) => set({ aiStreaming }),
    aiStreamText: '',
    appendAiStreamText: (t) => set((state) => ({ aiStreamText: state.aiStreamText + t })),
    clearAiStreamText: () => set({ aiStreamText: '' }),

    reset: () => set({
        status: 'idle', stats: null, liveTimeline: [],
        sessionId: null, aiAnalysis: null, aiStreamText: '', aiStreaming: false
    }),
}));
