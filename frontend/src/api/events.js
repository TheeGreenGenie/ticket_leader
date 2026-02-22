import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

export async function getEvent(slug) {
  const res = await API.get(`/events/${slug}`);
  return res.data;
}

export async function createOrder(orderData) {
  const res = await API.post('/orders', orderData);
  return res.data;
}
