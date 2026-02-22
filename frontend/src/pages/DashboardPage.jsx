import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getEvents } from '../api/content';
import '../styles/styles.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Redirect to login if no token (protected route)
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
    }
  }, [navigate]);

  // Load available events
  useEffect(() => {
    async function loadEvents() {
      try {
        const eventsData = await getEvents();
        setEvents(eventsData);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  const handleJoinQueue = (eventId) => {
    navigate(`/queue/${eventId}`);
  };

  return (
    <>
      {/* Mirrors base.html */}
      <Header />
      <Navbar />
      <div className="body">
        <div className="dashboard-content">
          <h1 className="dashboard-title">Upcoming Events</h1>
          <p className="dashboard-subtitle">Join the queue for your favorite concerts!</p>

          {loadingEvents ? (
            <div className="events-loading">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="no-events">No upcoming events available.</div>
          ) : (
            <div className="events-grid">
              {events.map((event) => (
                <div key={event._id} className="event-card">
                  <div className="event-artist">
                    {event.artistId?.name || 'Unknown Artist'}
                  </div>
                  <h3 className="event-name">{event.eventName}</h3>
                  <div className="event-details">
                    <p className="event-venue">{event.venue}</p>
                    <p className="event-city">{event.city}</p>
                    <p className="event-date">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="event-queue-info">
                    <span className="queue-size">
                      {event.currentQueueSize || 0} in queue
                    </span>
                  </div>
                  <button
                    className="join-queue-btn"
                    onClick={() => handleJoinQueue(event._id)}
                  >
                    Join Queue
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
