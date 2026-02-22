import apiClient from './client';

export async function submitGame(sessionId, gameType, questionId, answer, responseTime) {
  const res = await apiClient.post('/games/submit', {
    sessionId,
    gameType,
    questionId,
    answer,
    responseTime
  });
  return res.data;
}

export async function getGameHistory(sessionId) {
  const res = await apiClient.get(`/games/history/${sessionId}`);
  return res.data;
}

export async function streamBehavior(sessionId, events) {
  const res = await apiClient.post('/games/behavior/stream', { sessionId, events });
  return res.data;
}

export async function getTrustBreakdown(sessionId) {
  const res = await apiClient.get(`/games/trust/${sessionId}`);
  return res.data;
}
