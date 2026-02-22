import axios from 'axios';

const API = axios.create({ baseURL: '/api/content' });

export async function getArtists() {
  const res = await API.get('/artists');
  return res.data;
}

export async function getArtist(artistId) {
  const res = await API.get(`/artists/${artistId}`);
  return res.data;
}

export async function getTrivia(artistId, options = {}) {
  const { limit = 5, difficulty = 'mixed', useAI = true } = options;
  const res = await API.get(`/artists/${artistId}/trivia`, {
    params: { limit, difficulty, useAI }
  });
  return res.data;
}

export async function generateTrivia(artistId, count = 5, difficulty = 'mixed', fresh = false) {
  const res = await API.get(`/artists/${artistId}/trivia/generate`, {
    params: { count, difficulty, fresh }
  });
  return res.data;
}

export async function getPolls(artistId, limit = 5) {
  const res = await API.get(`/artists/${artistId}/polls`, { params: { limit } });
  return res.data;
}

export async function getEvents(active = true) {
  const res = await API.get('/events', { params: { active } });
  return res.data;
}

export async function getEvent(eventId) {
  const res = await API.get(`/events/${eventId}`);
  return res.data;
}
