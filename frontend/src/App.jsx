import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LiveQueuePage from './pages/LiveQueuePage';
import WalkthroughPage from './pages/WalkthroughPage';
import VerifyPage from './pages/VerifyPage';
import BlockedPage from './pages/BlockedPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/queue/:eventId" element={<LiveQueuePage />} />
        <Route path="/walkthrough" element={<WalkthroughPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/blocked" element={<BlockedPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
