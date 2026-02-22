import apiClient from './client';

export async function login(email, password, captchaToken) {
  const res = await apiClient.post('/auth/login', { email, password, captchaToken });
  const { token, user } = res.data || {};
  return {
    token,
    userId: user?.id ?? user?._id ?? null,
    name: user?.name ?? '',
    email: user?.email ?? '',
    user,
  };
}

export async function signup(name, email, password, captchaToken) {
  const res = await apiClient.post('/auth/signup', { name, email, password, captchaToken });
  const { token, user } = res.data || {};
  return {
    token,
    userId: user?.id ?? user?._id ?? null,
    name: user?.name ?? '',
    email: user?.email ?? '',
    user,
  };
}
