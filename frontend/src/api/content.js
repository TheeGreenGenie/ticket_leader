import apiClient from './client';

export async function getArtists() {
  const res = await apiClient.get('/content/artists');
  return res.data;
}

export async function getArtist(artistId) {
  const res = await apiClient.get(`/content/artists/${artistId}`);
  return res.data;
}

export async function getTrivia(artistId, options = {}) {
  const { limit = 5, difficulty = 'mixed', useAI = true } = options;
  const res = await apiClient.get(`/content/artists/${artistId}/trivia`, {
    params: { limit, difficulty, useAI }
  });
  return res.data;
}

export async function generateTrivia(artistId, count = 5, difficulty = 'mixed', fresh = false) {
  const res = await apiClient.get(`/content/artists/${artistId}/trivia/generate`, {
    params: { count, difficulty, fresh }
  });
  return res.data;
}

export async function getPolls(artistId, limit = 5) {
  const res = await apiClient.get(`/content/artists/${artistId}/polls`, { params: { limit } });
  return res.data;
}

export async function getEvents(active = true) {
  const res = await apiClient.get('/content/events', { params: { active } });
  return res.data;
}

export async function getEvent(eventId) {
  const res = await apiClient.get(`/content/events/${eventId}`);
  return res.data;
}

export async function getLocalTrivia(artistId, city, count = 2) {
  const res = await API.get(`/artists/${artistId}/trivia/local`, {
    params: { city, count }
  });
  return res.data;
}
