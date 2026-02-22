import { useState, useEffect } from 'react';
import { submitGame } from '../../api/games';
import './PollGame.css';

export default function PollGame({ polls, sessionId, onComplete, onTrustUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [sliderValue, setSliderValue] = useState(5);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  const currentPoll = polls[currentIndex];
  const isLastPoll = currentIndex === polls.length - 1;

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex]);

  const handleSubmit = async () => {
    if (loading) return;

    const answer = currentPoll.type === 'slider' ? sliderValue : selectedAnswer;
    if (answer === null) return;

    setLoading(true);
    setIsSubmitted(true);

    const responseTime = Date.now() - startTime;

    try {
      const result = await submitGame(
        sessionId,
        'poll',
        currentPoll._id,
        answer,
        responseTime
      );

      if (onTrustUpdate && result.newTrustScore !== undefined) {
        onTrustUpdate(result.newTrustScore, result.newTrustLevel);
      }

      // Show results after a short delay
      setTimeout(() => {
        setShowResults(true);
      }, 500);
    } catch (error) {
      console.error('Failed to submit poll:', error);
    }

    setLoading(false);
  };

  const handleNext = () => {
    if (isLastPoll) {
      onComplete({ completed: currentIndex + 1 });
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setSliderValue(5);
      setIsSubmitted(false);
      setShowResults(false);
    }
  };

  if (!currentPoll) {
    return <div className="poll-loading">Loading polls...</div>;
  }

  const mockResults = currentPoll.mockResults || {};

  return (
    <div className="poll-game">
      <div className="poll-header">
        <div className="poll-progress">
          Poll {currentIndex + 1} of {polls.length}
        </div>
        <span className="poll-category">{currentPoll.category}</span>
      </div>

      <div className="poll-question">
        <h3>{currentPoll.question}</h3>
      </div>

      {currentPoll.type === 'single-choice' ? (
        <div className="poll-options">
          {currentPoll.options.map((option, index) => {
            const percentage = mockResults[option] || Math.floor(Math.random() * 30 + 10);
            const isSelected = selectedAnswer === index;

            return (
              <button
                key={index}
                className={`poll-option ${isSelected ? 'selected' : ''} ${showResults ? 'show-results' : ''}`}
                onClick={() => !isSubmitted && setSelectedAnswer(index)}
                disabled={isSubmitted}
              >
                <div className="option-content">
                  <span className="option-text">{option}</span>
                  {showResults && (
                    <span className="option-percentage">{percentage}%</span>
                  )}
                </div>
                {showResults && (
                  <div
                    className="option-bar"
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="poll-slider">
          <div className="slider-labels">
            <span>{currentPoll.sliderRange?.min || 1}</span>
            <span className="slider-value">{sliderValue}</span>
            <span>{currentPoll.sliderRange?.max || 10}</span>
          </div>
          <input
            type="range"
            min={currentPoll.sliderRange?.min || 1}
            max={currentPoll.sliderRange?.max || 10}
            value={sliderValue}
            onChange={(e) => setSliderValue(parseInt(e.target.value))}
            disabled={isSubmitted}
            className="slider-input"
          />
          <div className="slider-ticks">
            {Array.from({ length: (currentPoll.sliderRange?.max || 10) - (currentPoll.sliderRange?.min || 1) + 1 }, (_, i) => (
              <div key={i} className="tick" />
            ))}
          </div>
        </div>
      )}

      <div className="poll-actions">
        {!isSubmitted ? (
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={currentPoll.type === 'single-choice' && selectedAnswer === null}
          >
            {loading ? 'Submitting...' : 'Submit Vote'}
          </button>
        ) : (
          <button className="next-button" onClick={handleNext}>
            {isLastPoll ? 'Finish Polls' : 'Next Poll'}
          </button>
        )}
      </div>

      {showResults && (
        <div className="poll-thanks">
          Thanks for voting! Your opinion matters.
        </div>
      )}
    </div>
  );
}
