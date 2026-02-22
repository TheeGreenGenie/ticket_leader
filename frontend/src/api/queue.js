import apiClient from './client';

export async function joinQueue(eventId, userId = null, triviaQuestionId = null, triviaAnswer = null) {
  const res = await apiClient.post('/queue/join', { eventId, userId, triviaQuestionId, triviaAnswer });
  return res.data;
}

export async function getQueueStatus(sessionId) {
  const res = await apiClient.get(`/queue/status/${sessionId}`);
  return res.data;
}

export async function leaveQueue(sessionId) {
  const res = await apiClient.post(`/queue/leave/${sessionId}`);
  return res.data;
}
