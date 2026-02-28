import './index.css';
import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useTestStore } from './store/testStore';
import { Layout } from './components/Layout';
import { ConfigForm } from './components/ConfigForm';
import { StatsGrid } from './components/StatsGrid';
import { LatencyChart } from './components/charts/LatencyChart';
import { ThroughputChart } from './components/charts/ThroughputChart';
import { PercentileChart } from './components/charts/PercentileChart';

function App() {
  const { send } = useWebSocket();
  const { stats, liveTimeline } = useTestStore();
  const [activeTab, setActiveTab] = useState('configure');

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'configure' && <ConfigForm onSend={send} />}

      {activeTab === 'monitor' && (
        <div className="max-w-6xl mx-auto">
          {stats ? (
            <>
              <StatsGrid stats={stats} />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <LatencyChart data={liveTimeline} />
                <ThroughputChart data={liveTimeline} />
              </div>
              <div className="mt-4">
                <PercentileChart stats={stats} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-[#475569]">
              <p className="text-lg font-medium">No test data yet</p>
              <p className="text-sm mt-1">Start a load test from the Configure tab to see live stats</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="flex flex-col items-center justify-center h-64 text-[#475569]">
          <p className="text-lg font-medium">📋 Results</p>
          <p className="text-sm mt-1">Test results and AI analysis will appear here after a test completes</p>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex flex-col items-center justify-center h-64 text-[#475569]">
          <p className="text-lg font-medium">🕐 History</p>
          <p className="text-sm mt-1">Previous test results from the database will be listed here</p>
        </div>
      )}
    </Layout>
  );
}

export default App;
