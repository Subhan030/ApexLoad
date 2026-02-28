import './index.css';
import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Layout } from './components/Layout';
import { ConfigForm } from './components/ConfigForm';
import { MonitorPage } from './pages/MonitorPage';
import { ResultsPage } from './pages/ResultsPage';

function App() {
  const [activeTab, setActiveTab] = useState('configure');
  const { send } = useWebSocket();

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'configure' && <ConfigForm onSend={send} />}
      {activeTab === 'monitor' && <MonitorPage />}
      {activeTab === 'results' && <ResultsPage />}

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
