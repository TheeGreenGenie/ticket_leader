import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="home-root">
      <div className="header">
        <h2>TicketLeader</h2>
        <button
          type="button"
          onClick={() => navigate(isLoggedIn ? '/live-queue' : '/login')}
        >
          {isLoggedIn ? 'Live Queue' : 'Login'}
        </button>
      </div>

      <Navbar />

      <div className="body" />

      <div className="footer">
        <p>TicketLeader 2026 ©</p>
      </div>
    </div>
  );
}
