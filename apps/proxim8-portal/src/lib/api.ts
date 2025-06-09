/**
 * Default API client wrapper
 * Re-exports apiClient functions as a default export for convenience
 */
import * as apiClient from '@/utils/apiClient';

const api = {
  get: apiClient.get,
  post: apiClient.post,
  put: apiClient.put,
  delete: apiClient.del,
};

export default api;