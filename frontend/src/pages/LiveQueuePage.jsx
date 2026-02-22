import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinQueue, getQueueStatus, leaveQueue } from '../api/queue';
import { getEvent, getTrivia, getPolls } from '../api/content';
import socketService from '../services/socketService';
import behaviorCollector from '../utils/behaviorCollector';
import QueueStatus from '../components/queue/QueueStatus';
import TriviaGame from '../components/games/TriviaGame';
import PollGame from '../components/games/PollGame';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LiveQueuePage.css';

export default function LiveQueuePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Queue state
  const [sessionId, setSessionId] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [event, setEvent] = useState(null);
  const [artistId, setArtistId] = useState(null);

  // Game state
  const [activeGame, setActiveGame] = useState(null); // 'trivia', 'poll', or null
  const [triviaQuestions, setTriviaQuestions] = useState([]);
  const [pollQuestions, setPollQuestions] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize queue session
  useEffect(() => {
    async function initializeQueue() {
      try {
        setLoading(true);
        setError(null);

        // Get event details
        const eventData = await getEvent(eventId);
        setEvent(eventData);
        setArtistId(eventData.artistId._id || eventData.artistId);

        // Check for existing session
        const savedSession = localStorage.getItem(`queue_session_${eventId}`);
        let session;

        if (savedSession) {
          try {
            session = await getQueueStatus(savedSession);
            setSessionId(savedSession);
          } catch {
            // Session expired, join new
            localStorage.removeItem(`queue_session_${eventId}`);
            session = await joinNewQueue();
          }
        } else {
          session = await joinNewQueue();
        }

        setQueueData(session);

        // Connect socket and start behavior collection
        if (session.sessionId || savedSession) {
          const sid = session.sessionId || savedSession;
          socketService.connect(sid);
          behaviorCollector.start(sid);
        }
      } catch (err) {
        console.error('Failed to initialize queue:', err);
        setError(err.message || 'Failed to join queue');
      } finally {
        setLoading(false);
      }
    }

    async function joinNewQueue() {
      const userId = localStorage.getItem('userId');
      const result = await joinQueue(eventId, userId);
      setSessionId(result.sessionId);
      localStorage.setItem(`queue_session_${eventId}`, result.sessionId);
      return result;
    }

    if (eventId) {
      initializeQueue();
    }

    return () => {
      socketService.disconnect();
      behaviorCollector.stop();
    };
  }, [eventId]);

  // Socket event listeners
  useEffect(() => {
    const unsubPosition = socketService.on('positionUpdate', (data) => {
      setQueueData(prev => ({
        ...prev,
        position: data.position,
        estimatedWait: data.estimatedWait
      }));
    });

    const unsubTrust = socketService.on('trustUpdate', (data) => {
      setQueueData(prev => ({
        ...prev,
        trustScore: data.trustScore,
        trustLevel: data.trustLevel
      }));
    });

    const unsubAdvance = socketService.on('advance', () => {
      alert('Congratulations! You can now purchase tickets!');
      navigate('/live-queue');
    });

    return () => {
      unsubPosition();
      unsubTrust();
      unsubAdvance();
    };
  }, [navigate]);

  // Load game content - always fetch fresh AI trivia for each round
  const loadGameContent = useCallback(async (gameType) => {
    if (!artistId) return;

    setGamesLoading(true);
    try {
      if (gameType === 'trivia') {
        // Always fetch fresh AI-generated trivia questions
        const trivia = await getTrivia(artistId, { limit: 5, useAI: true });
        setTriviaQuestions(trivia);
      } else if (gameType === 'poll' && pollQuestions.length === 0) {
        const polls = await getPolls(artistId, 3);
        setPollQuestions(polls);
      }
    } catch (err) {
      console.error(`Failed to load ${gameType}:`, err);
    } finally {
      setGamesLoading(false);
    }
  }, [artistId, pollQuestions.length]);

  const startGame = async (gameType) => {
    await loadGameContent(gameType);
    setActiveGame(gameType);
  };

  const handleGameComplete = (result) => {
    console.log('Game completed:', result);
    setActiveGame(null);
  };

  const handleTrustUpdate = (newScore, newLevel) => {
    setQueueData(prev => ({
      ...prev,
      trustScore: newScore,
      trustLevel: newLevel
    }));
  };

  const handleLeaveQueue = async () => {
    if (!sessionId) return;

    const confirmed = window.confirm('Are you sure you want to leave the queue?');
    if (!confirmed) return;

    try {
      await leaveQueue(sessionId);
      localStorage.removeItem(`queue_session_${eventId}`);
      socketService.disconnect();
      behaviorCollector.stop();
      navigate('/live-queue');
    } catch (err) {
      console.error('Failed to leave queue:', err);
    }
  };

  if (loading) {
    return (
      <div className="queue-page">
        <Header />
        <main className="queue-main">
          <div className="loading-container">
            <div className="loading-spinner" />
            <p>Joining queue...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="queue-page">
        <Header />
        <main className="queue-main">
          <div className="error-container">
            <h2>Oops!</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/live-queue')}>
              Back to Live Queue
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="queue-page">
      <Header />
      <main className="queue-main">
        <div className="queue-container">
          {/* Queue Status Section */}
          <section className="queue-section">
            <QueueStatus
              position={queueData?.position || 0}
              queueSize={queueData?.queueSize || 0}
              estimatedWait={queueData?.estimatedWait || 'Calculating...'}
              trustScore={queueData?.trustScore || 50}
              trustLevel={queueData?.trustLevel || 'silver'}
              event={{
                name: event?.eventName,
                venue: event?.venue,
                date: event?.date
              }}
            />
          </section>

          {/* Game Section */}
          <section className="game-section">
            {activeGame === null ? (
              <div className="game-selector">
                <h2>Boost Your Trust Level</h2>
                <p>Play games while you wait to improve your queue position!</p>

                <div className="game-cards">
                  <div className="game-card" onClick={() => startGame('trivia')}>
                    <span className="game-icon">🎯</span>
                    <h3>Artist Trivia</h3>
                    <p>Test your knowledge about {event?.artistId?.name || 'the artist'}</p>
                    <span className="game-reward">+5-15 Trust Points</span>
                  </div>

                  <div className="game-card" onClick={() => startGame('poll')}>
                    <span className="game-icon">📊</span>
                    <h3>Fan Polls</h3>
                    <p>Vote and see what other fans think</p>
                    <span className="game-reward">+3-5 Trust Points</span>
                  </div>
                </div>
              </div>
            ) : gamesLoading ? (
              <div className="game-loading">
                <div className="loading-spinner" />
                <p>Loading game...</p>
              </div>
            ) : activeGame === 'trivia' ? (
              <TriviaGame
                questions={triviaQuestions}
                sessionId={sessionId}
                onComplete={handleGameComplete}
                onTrustUpdate={handleTrustUpdate}
              />
            ) : activeGame === 'poll' ? (
              <PollGame
                polls={pollQuestions}
                sessionId={sessionId}
                onComplete={handleGameComplete}
                onTrustUpdate={handleTrustUpdate}
              />
            ) : null}

            {activeGame && (
              <button
                className="back-to-menu"
                onClick={() => setActiveGame(null)}
              >
                Back to Games Menu
              </button>
            )}
          </section>

          {/* Leave Queue Button */}
          <div className="queue-actions">
            <button className="leave-queue-btn" onClick={handleLeaveQueue}>
              Leave Queue
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
