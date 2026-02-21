import axios from 'axios';

const API = axios.create({ baseURL: '/api/auth' });

export async function login(email, password) {
  const res = await API.post('/login', { email, password });
  return res.data; // expects { token, user }
}

export async function signup(name, email, password) {
  const res = await API.post('/signup', { name, email, password });
  return res.data; // expects { token, user }
}
