import axios from 'axios';

const API = axios.create({ baseURL: '/api/queue' });

export async function joinQueue(eventId, userId = null) {
  const res = await API.post('/join', { eventId, userId });
  return res.data;
}

export async function getQueueStatus(sessionId) {
  const res = await API.get(`/status/${sessionId}`);
  return res.data;
}

export async function leaveQueue(sessionId) {
  const res = await API.post(`/leave/${sessionId}`);
  return res.data;
}

export async function saveLocation(sessionId, locationData) {
  const res = await API.post(`/location/${sessionId}`, { locationData });
  return res.data;
}
