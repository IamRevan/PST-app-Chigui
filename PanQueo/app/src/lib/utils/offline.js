import { getItem, setItem } from './storage';
import { STORAGE_KEYS } from './constants';

export const addToOfflineQueue = async (action) => {
  const queue = (await getItem(STORAGE_KEYS.OFFLINE_QUEUE)) || [];
  queue.push({
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  });
  await setItem(STORAGE_KEYS.OFFLINE_QUEUE, queue);
};

export const processOfflineQueue = async (apiClient) => {
  const queue = (await getItem(STORAGE_KEYS.OFFLINE_QUEUE)) || [];
  if (queue.length === 0) return [];

  const results = [];
  const remaining = [];

  for (const item of queue) {
    try {
      const response = await apiClient[item.method](item.url, item.data);
      results.push({ id: item.id, status: 'success', response: response.data });
    } catch {
      remaining.push(item);
      results.push({ id: item.id, status: 'failed' });
    }
  }

  await setItem(STORAGE_KEYS.OFFLINE_QUEUE, remaining);
  return results;
};
