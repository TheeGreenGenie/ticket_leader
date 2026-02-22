import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getEvents } from '../api/content';
import './DashboardPage.css';

const MAX_VISIBLE_GENRES = 6;

const FALLBACK_ARTIST_IMAGES = {
  'drake':        ['/drake.webp', '/drake2.avif'],
  'taylor-swift': ['/taylor.webp', '/taylor2.webp'],
  'beyonce':      ['/beyonce2.jpg', '/beyonce2.jpeg'],
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [filter, setFilter] = useState('all');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(e => e.artistId?.genre?.toLowerCase().includes(filter));

  // Build genres sorted by event count descending
  const genreCounts = {};
  events.forEach(e => {
    const g = e.artistId?.genre?.split(',')[0]?.trim();
    if (g) genreCounts[g] = (genreCounts[g] || 0) + 1;
  });
  const genres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  const topGenres  = genres.slice(0, MAX_VISIBLE_GENRES);
  const moreGenres = genres.slice(MAX_VISIBLE_GENRES);

  return (
    <div className="dashboard-page">
      <Header />

      <main className="dashboard-main">
        {/* Hero Section */}
        <section className="dashboard-hero">
          <div className="hero-bg"></div>
          <div className="hero-content">
            <span className="hero-badge">Live Queue System</span>
            <h1>Discover Events</h1>
            <p>Join the queue for your favorite concerts and secure your tickets with our fair, gamified system.</p>
          </div>
        </section>

        {/* Events Section */}
        <section className="events-section">
          <div className="events-header">
            <div className="events-title-group">
              <h2>Upcoming Events</h2>
              <p>{events.length} events available</p>
            </div>

            <div className="events-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              {topGenres.map(genre => (
                <button
                  key={genre}
                  className={`filter-btn ${filter === genre.toLowerCase() ? 'active' : ''}`}
                  onClick={() => { setFilter(genre.toLowerCase()); setMoreOpen(false); }}
                >
                  {genre}
                </button>
              ))}
              {moreGenres.length > 0 && (
                <div className="filter-more-wrap" ref={moreRef}>
                  <button
                    className={`filter-btn ${moreGenres.some(g => filter === g.toLowerCase()) ? 'active' : ''}`}
                    onClick={() => setMoreOpen(o => !o)}
                  >
                    {moreGenres.some(g => filter === g.toLowerCase())
                      ? genres.find(g => filter === g.toLowerCase()) || 'More'
                      : `More ▾`}
                  </button>
                  {moreOpen && (
                    <div className="filter-more-dropdown">
                      {moreGenres.map(genre => (
                        <button
                          key={genre}
                          className={`filter-more-item ${filter === genre.toLowerCase() ? 'active' : ''}`}
                          onClick={() => { setFilter(genre.toLowerCase()); setMoreOpen(false); }}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {loadingEvents ? (
            <div className="events-loading">
              <div className="spinner"></div>
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="no-events">
              <div className="no-events-icon">🎵</div>
              <h3>No events found</h3>
              <p>Check back soon for new events!</p>
            </div>
          ) : (
            <div className="events-grid">
              {(() => {
                const artistCount = {};
                return filteredEvents.map((event, index) => {
                  const slug = event.artistId?.slug;
                  const images = FALLBACK_ARTIST_IMAGES[slug];
                  // Only use API image if it is an absolute HTTPS URL.
                  // Rejects broken Last.fm CDN URLs regardless of machine/OS.
                  const rawApiImage = (event.artistId?.imageUrl || '').trim();
                  const isValidUrl = rawApiImage.startsWith('https://') &&
                    !rawApiImage.includes('last.fm') && !rawApiImage.includes('lastfm');
                  let artistImage = isValidUrl ? rawApiImage : null;
                  if (!artistImage && images) {
                    const count = artistCount[slug] ?? 0;
                    artistImage = images[count % images.length];
                    artistCount[slug] = count + 1;
                  }
                  return (
                <article
                  key={event._id}
                  className="event-card animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {artistImage && (
                    <div className="event-card-image">
                      <img
                        src={artistImage}
                        alt={event.artistId.name}
                      />
                    </div>
                  )}
                  <div className="event-card-header">
                    <span className="event-genre">{event.artistId?.genre?.split(',')[0] || 'Music'}</span>
                    <div className="event-queue-badge">
                      <span className="pulse-dot"></span>
                      {event.currentQueueSize || 0} in queue
                    </div>
                  </div>

                  <div className="event-card-body">
                    <h3 className="event-artist">{event.artistId?.name || 'Unknown Artist'}</h3>
                    <p className="event-name">{event.eventName}</p>

                    <div className="event-details">
                      <div className="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{event.venue}</span>
                      </div>
                      <div className="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span>
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 21h18"/>
                          <path d="M5 21V7l8-4v18"/>
                          <path d="M19 21V11l-6-4"/>
                        </svg>
                        <span>{event.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="event-card-footer">
                    <button
                      className="btn-join-queue"
                      onClick={() => handleJoinQueue(event._id)}
                    >
                      <span>Join Queue</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </article>
                  );
                });
              })()}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
