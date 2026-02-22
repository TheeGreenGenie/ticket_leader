import { useState, useEffect, useCallback } from 'react';
import { submitGame } from '../../api/games';
import './TriviaGame.css';

export default function TriviaGame({ questions, sessionId, onComplete, onTrustUpdate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleAnswer = useCallback(async (answerIndex) => {
    if (isAnswered || loading) return;

    setLoading(true);
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);

    const responseTime = Date.now() - startTime;
    const correct = answerIndex === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
    }

    try {
      const result = await submitGame(
        sessionId,
        'trivia',
        currentQuestion._id,
        answerIndex,
        responseTime
      );

      if (onTrustUpdate && result.newTrustScore !== undefined) {
        onTrustUpdate(result.newTrustScore, result.newTrustLevel);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }

    setLoading(false);
  }, [isAnswered, loading, startTime, currentQuestion, sessionId, onTrustUpdate]);

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete({ score, total: questions.length });
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setTimeLeft(10);
      setStartTime(Date.now());
    }
  };

  // Timer countdown
  useEffect(() => {
    if (isAnswered || timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isAnswered]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      handleAnswer(-1); // -1 indicates timeout
    }
  }, [timeLeft, isAnswered, handleAnswer]);

  if (!currentQuestion) {
    return <div className="trivia-loading">Loading questions...</div>;
  }

  return (
    <div className="trivia-game">
      <div className="trivia-header">
        <div className="trivia-progress">
          Question {currentIndex + 1} of {questions.length}
        </div>
        <div className="trivia-score">
          Score: {score}
        </div>
        <div className={`trivia-timer ${timeLeft <= 3 ? 'timer-warning' : ''}`}>
          {timeLeft}s
        </div>
      </div>

      <div className="trivia-question">
        <span className={`difficulty-badge ${currentQuestion.difficulty}`}>
          {currentQuestion.difficulty}
        </span>
        <h3>{currentQuestion.question}</h3>
      </div>

      <div className="trivia-options">
        {currentQuestion.options.map((option, index) => {
          let className = 'trivia-option';
          if (isAnswered) {
            if (index === currentQuestion.correctAnswer) {
              className += ' correct';
            } else if (index === selectedAnswer && !isCorrect) {
              className += ' incorrect';
            }
          } else if (index === selectedAnswer) {
            className += ' selected';
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswer(index)}
              disabled={isAnswered || loading}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="option-text">{option}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className={`trivia-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
          <span className="feedback-icon">
            {isCorrect ? '✓' : '✗'}
          </span>
          <span className="feedback-text">
            {isCorrect ? 'Correct!' : `Wrong! The answer was: ${currentQuestion.options[currentQuestion.correctAnswer]}`}
          </span>
          <button className="next-button" onClick={handleNext}>
            {isLastQuestion ? 'See Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}
