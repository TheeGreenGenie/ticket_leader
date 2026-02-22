import axios from 'axios';

const API = axios.create({ baseURL: '/api/auth' });

export async function login(email, password, captchaToken) {
  const res = await API.post('/login', { email, password, captchaToken });
  return res.data; // expects { token, user }
}

export async function signup(name, email, password, captchaToken) {
  const res = await API.post('/signup', { name, email, password, captchaToken });
  return res.data; // expects { token, user }
}
