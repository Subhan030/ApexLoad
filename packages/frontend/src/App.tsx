import './index.css';
import { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { Layout } from './components/Layout';
import { ConfigForm } from './components/ConfigForm';
import { MonitorPage } from './pages/MonitorPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  const [activeTab, setActiveTab] = useState('configure');
  const { send } = useWebSocket();

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'configure' && <ConfigForm onSend={send} />}
      {activeTab === 'monitor' && <MonitorPage />}
      {activeTab === 'results' && <ResultsPage />}
      {activeTab === 'history' && <HistoryPage />}
    </Layout>
  );
}

export default App;
