import axios from 'axios';

const API = axios.create({ baseURL: '/api/games' });

export async function submitGame(sessionId, gameType, questionId, answer, responseTime) {
  const res = await API.post('/submit', {
    sessionId,
    gameType,
    questionId,
    answer,
    responseTime
  });
  return res.data;
}

export async function getGameHistory(sessionId) {
  const res = await API.get(`/history/${sessionId}`);
  return res.data;
}

export async function streamBehavior(sessionId, events) {
  const res = await API.post('/behavior/stream', { sessionId, events });
  return res.data;
}

export async function getTrustBreakdown(sessionId) {
  const res = await API.get(`/trust/${sessionId}`);
  return res.data;
}
