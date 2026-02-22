import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinQueue, getQueueStatus, leaveQueue, saveLocation } from '../api/queue';
import { getEvent, getTrivia, getPolls, getLocalTrivia } from '../api/content';
import socketService from '../services/socketService';
import behaviorCollector from '../utils/behaviorCollector';
import { checkProximity, isGeolocationSupported } from '../services/locationService';
import QueueStatus from '../components/queue/QueueStatus';
import TriviaGame from '../components/games/TriviaGame';
import PollGame from '../components/games/PollGame';
import LocationPrompt from '../components/queue/LocationPrompt';
import LocalFanBadge from '../components/queue/LocalFanBadge';
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

  // Location state
  const [locationData, setLocationData] = useState(null);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  // Trivia gate state
  const [gatePhase, setGatePhase] = useState('loading'); // 'loading' | 'trivia' | 'joined'
  const [gateQuestion, setGateQuestion] = useState(null);
  const [gateError, setGateError] = useState('');
  const [gateAnswering, setGateAnswering] = useState(false);

  // Bot detection: track wrong attempts and response speed
  const [triviaWrongAttempts, setTriviaWrongAttempts] = useState(0);
  const [fastWrongAttempts, setFastWrongAttempts] = useState(0);
  const gateQuestionShownAt = useRef(null);

  // Game state
  const [activeGame, setActiveGame] = useState(null);
  const [triviaQuestions, setTriviaQuestions] = useState([]);
  const [pollQuestions, setPollQuestions] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize: load event, check for existing session or show trivia gate
  useEffect(() => {
    async function initialize() {
      try {
        setLoading(true);
        setError(null);

        const eventData = await getEvent(eventId);
        setEvent(eventData);
        const aid = eventData.artistId._id || eventData.artistId;
        setArtistId(aid);

        // If user already has a session for this event, skip the gate
        const savedSession = localStorage.getItem(`queue_session_${eventId}`);
        if (savedSession) {
          try {
            const session = await getQueueStatus(savedSession);
            setSessionId(savedSession);
            // Restore location data if available
            if (session.locationData?.granted) {
              setLocationData(session.locationData);
              setLocationChecked(true);
            }
            setQueueData(session);
            socketService.connect(savedSession);
            behaviorCollector.start(savedSession);
            setGatePhase('joined');
            return;
          } catch {
            localStorage.removeItem(`queue_session_${eventId}`);
          }
        }

        // No existing session — fetch a gate trivia question
        const questions = await getTrivia(aid, { limit: 1, useAI: false });
        if (questions && questions.length > 0) {
          setGateQuestion(questions[0]);
          gateQuestionShownAt.current = Date.now();
          setGatePhase('trivia');
        } else {
          // No trivia available — skip gate and join directly
          await joinNewQueue(null, null, 0, 0);
        }

        // Show location prompt after a short delay if not already checked
        if (!session.locationData?.granted && isGeolocationSupported()) {
          setTimeout(() => {
            setShowLocationPrompt(true);
          }, 2000);
        }
      } catch (err) {
        console.error('Failed to initialize queue:', err);
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      initialize();
    }

    return () => {
      socketService.disconnect();
      behaviorCollector.stop();
    };
  }, [eventId]);

  async function joinNewQueue(triviaQuestionId, triviaAnswer, wrongAttempts, fastAttempts) {
    const userId = localStorage.getItem('userId');
    const result = await joinQueue(eventId, userId, triviaQuestionId, triviaAnswer);
    setSessionId(result.sessionId);
    localStorage.setItem(`queue_session_${eventId}`, result.sessionId);
    setQueueData(result);
    socketService.connect(result.sessionId);
    behaviorCollector.start(result.sessionId);

    // Check all 3 bot-detection flags
    const allFlagged = result.isFlagged
      && (fastAttempts >= 1)
      && (wrongAttempts >= 2);

    if (allFlagged) {
      navigate(`/verify?returnTo=/queue/${eventId}`);
      return;
    }

    setGatePhase('joined');
    return result;
  }

  async function handleGateAnswer(answerIndex) {
    if (!gateQuestion || gateAnswering) return;

    // Measure response time since question was shown
    const responseTime = Date.now() - (gateQuestionShownAt.current || Date.now());

    setGateAnswering(true);
    setGateError('');
    try {
      await joinNewQueue(gateQuestion._id, answerIndex, triviaWrongAttempts, fastWrongAttempts);
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Something went wrong.';
      if (err?.response?.status === 403) {
        // Wrong answer — update counters
        const newWrong = triviaWrongAttempts + 1;
        const newFast = responseTime < 1500 ? fastWrongAttempts + 1 : fastWrongAttempts;
        setTriviaWrongAttempts(newWrong);
        setFastWrongAttempts(newFast);

        setGateError(msg + ' Try this new question.');
        try {
          const fresh = await getTrivia(artistId, { limit: 1, useAI: false });
          if (fresh && fresh.length > 0) {
            setGateQuestion(fresh[0]);
            gateQuestionShownAt.current = Date.now();
          }
        } catch {
          // keep same question if fetch fails
        }
      } else {
        setError(msg);
      }
    } finally {
      setGateAnswering(false);
    }
  }

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
      navigate('/dashboard');
    });

    return () => {
      unsubPosition();
      unsubTrust();
      unsubAdvance();
    };
  }, [navigate]);

  // Handle location permission
  const handleLocationGranted = async () => {
    if (!event?.coordinates || !sessionId) return;

    try {
      const result = await checkProximity(event.coordinates);

      if (result.granted) {
        setLocationData(result);

        // Save to backend
        await saveLocation(sessionId, result);
      }

      setLocationChecked(true);
      setShowLocationPrompt(false);
    } catch (err) {
      console.error('Location check failed:', err);
      setShowLocationPrompt(false);
    }
  };

  const handleLocationDismiss = () => {
    setShowLocationPrompt(false);
    setLocationChecked(true);
  };

  // Load game content - with local trivia support
  // Load game content
  const loadGameContent = useCallback(async (gameType) => {
    if (!artistId) return;

    setGamesLoading(true);
    try {
      if (gameType === 'trivia') {
        let trivia = [];

        // If we have location data with a city, mix in local trivia
        if (locationData?.granted && locationData?.city) {
          try {
            const localTrivia = await getLocalTrivia(artistId, locationData.city, 2);
            trivia = [...localTrivia];
            console.log(`Loaded ${localTrivia.length} local trivia questions for ${locationData.city}`);
          } catch (err) {
            console.warn('Local trivia not available:', err);
          }
        }

        // Fill remaining with regular trivia
        const regularCount = 5 - trivia.length;
        if (regularCount > 0) {
          const regularTrivia = await getTrivia(artistId, { limit: regularCount, useAI: true });
          trivia = [...trivia, ...regularTrivia];
        }

        // Shuffle to mix local and regular
        trivia.sort(() => Math.random() - 0.5);
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
  }, [artistId, pollQuestions.length, locationData]);

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
      navigate('/dashboard');
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
            <p>Loading event...</p>
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
            <button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Trivia Gate Screen ────────────────────────────────────────
  if (gatePhase === 'trivia') {
    return (
      <div className="queue-page">
        <Header />
        <main className="queue-main">
          <div className="queue-container">
            <div className="trivia-gate">
              <div className="trivia-gate-header">
                <span className="gate-icon">🔒</span>
                <h2>Prove you're human</h2>
                <p>Answer this question about <strong>{event?.artistId?.name || 'the artist'}</strong> to join the queue.</p>
              </div>

              {gateQuestion ? (
                <>
                  <div className="gate-question">
                    <p>{gateQuestion.question}</p>
                  </div>

                  <div className="gate-options">
                    {gateQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        className="gate-option-btn"
                        onClick={() => handleGateAnswer(index)}
                        disabled={gateAnswering}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {gateError && (
                    <p className="gate-error">{gateError}</p>
                  )}

                  {gateAnswering && (
                    <div className="gate-loading">
                      <div className="loading-spinner" />
                      <p>Verifying...</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="gate-loading">
                  <div className="loading-spinner" />
                  <p>Loading question...</p>
                </div>
              )}

              <button className="back-to-menu" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Queue UI (after passing gate) ────────────────────────────
  return (
    <div className="queue-page">
      <Header />
      <main className="queue-main">
        <div className="queue-container">
          {/* Location Badge - shows if location granted */}
          {locationData?.granted && (
            <section className="location-badge-section">
              <LocalFanBadge locationData={locationData} />
            </section>
          {queueData?.isFlagged && (
            <div className="flag-warning">
              ⚠️ Suspicious activity detected from your network. Your queue position has been adjusted.
            </div>
          )}

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

          {/* Location Prompt - shown once if not checked */}
          {showLocationPrompt && !locationChecked && (
            <section className="location-prompt-section">
              <LocationPrompt
                onLocationGranted={handleLocationGranted}
                onDismiss={handleLocationDismiss}
              />
            </section>
          )}

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
                    {locationData?.granted && locationData?.city && (
                      <span className="game-local-badge">Includes {locationData.city} trivia!</span>
                    )}
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
