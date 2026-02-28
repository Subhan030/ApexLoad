import type { ReactNode } from 'react';
import { useTestStore } from '../store/testStore';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface LayoutProps { children: ReactNode; activeTab: string; onTabChange: (tab: string) => void; }

const TABS = [
    { id: 'configure', label: '⚙️ Configure' },
    { id: 'monitor', label: '📊 Monitor' },
    { id: 'results', label: '📋 Results' },
    { id: 'history', label: '🕐 History' },
];

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
    const { connected, status } = useTestStore();

    return (
        <div className="flex flex-col h-screen bg-[#0f172a]">
            {/* Titlebar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#0d1526] border-b border-[#1e293b]">
                <div className="flex items-center gap-2">
                    <Activity className="text-[#38bdf8] w-5 h-5" />
                    <span className="font-bold text-white text-sm tracking-wide">ApexLoad</span>
                    <span className="text-[#475569] text-xs">API Performance Tester</span>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'running' && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                            Test Running
                        </span>
                    )}
                    {connected
                        ? <Wifi className="w-4 h-4 text-emerald-400" />
                        : <WifiOff className="w-4 h-4 text-red-400" />}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 px-4 py-2 bg-[#0d1526] border-b border-[#1e293b]">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`px-4 py-1.5 text-sm rounded-md font-medium transition-all ${activeTab === tab.id
                            ? 'bg-[#38bdf8] text-[#0f172a]'
                            : 'text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1e293b]'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">{children}</div>
        </div>
    );
}
