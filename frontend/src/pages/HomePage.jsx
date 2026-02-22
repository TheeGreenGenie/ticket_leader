import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="home-page">
      <Header />

      <main className="home-main">
        <section className="home-hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <span className="hero-badge">Welcome Back</span>
            <h1>TicketLeader Home</h1>
            <p>Jump back into live queues, track your tickets, or open the 3D map experience.</p>
          </div>
        </section>

        <section className="home-actions">
          <button type="button" onClick={() => navigate('/live-queue')}>
            Open Live Queue
          </button>
          <button type="button" onClick={() => navigate('/my-tickets')}>
            Open My Tickets
          </button>
          <button type="button" onClick={() => navigate('/stadium')}>
            Open 3D Map
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
