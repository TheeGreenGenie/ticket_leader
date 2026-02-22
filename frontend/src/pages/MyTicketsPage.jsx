import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './MyTicketsPage.css';

export default function MyTicketsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="mytickets-page">
      <Header />

      <main className="mytickets-main">
        <section className="mytickets-hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <span className="hero-badge">My Tickets</span>
            <h1>Your Ticket Dashboard</h1>
            <p>Track your events, queue outcomes, and ticket status in one place.</p>
          </div>
        </section>

        <section className="mytickets-section">
          <div className="mytickets-empty">
            <h3>No tickets yet</h3>
            <p>Join a live queue to start building your ticket history.</p>
            <button type="button" onClick={() => navigate('/live-queue')}>
              Browse Live Queues
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
