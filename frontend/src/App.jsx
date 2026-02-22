import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LiveQueuePage from './pages/LiveQueuePage';
import MyTicketsPage from './pages/MyTicketsPage';
import StadiumPage from './pages/StadiumPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/live-queue" element={<DashboardPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/dashboard" element={<Navigate to="/live-queue" replace />} />
        <Route path="/queue/:eventId" element={<LiveQueuePage />} />
        <Route path="/stadium" element={<StadiumPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
