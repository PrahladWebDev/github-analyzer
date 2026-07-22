import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

export async function analyzeUser(username, { deep = false } = {}) {
  const { data } = await client.get(`/github/analyze/${username}`, { params: { deep } });
  return data;
}

export async function compareUsers(userA, userB) {
  const { data } = await client.get(`/github/compare/${userA}/${userB}`);
  return data;
}

export async function getAISummary(username) {
  const { data } = await client.get(`/ai/summary/${username}`);
  return data.summary;
}

export async function getAIRoast(username) {
  const { data } = await client.get(`/ai/roast/${username}`);
  return data.roast;
}

export async function getCompareVerdict(userA, userB) {
  const { data } = await client.get(`/ai/compare-verdict/${userA}/${userB}`);
  return data.verdict;
}

export function extractErrorMessage(err) {
  return err?.response?.data?.error || err.message || 'Something went wrong';
}
