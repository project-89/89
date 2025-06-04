export * from './api-key';
export * from './error';
export * from './hash';
export * from './mongo-filters';
export * from './mongo-query';
export { default as mongodb } from './mongodb';
export * from './object';
export * from './request';
export * from './response';
export * from './timestamp';
export * from './wallet';

import { getMongoClient } from './mongodb';

// Export MongoDB utilities
export {
  formatDocument,
  formatDocuments,
  fromObjectId,
  getDb,
  handleMongoError,
  serverTimestamp,
} from './mongodb';

export {
  idFilter,
  idFilterWithConditions,
  stringIdFilter,
} from './mongo-filters';
export { createIdFilter, createMongoQuery } from './mongo-query';

// Export MongoDB session utilities
export {
  abortTransaction,
  commitTransaction,
  startMongoSession,
  withTransaction,
} from './mongo-session';

// Export timestamp utilities
export {
  formatDate,
  getCurrentUnixMillis,
  now,
  toDate,
  toMillis,
  toMongoDate,
} from './timestamp';

/**
 * Initialize database connections
 */
export async function initDatabases() {
  try {
    // Initialize MongoDB
    const client = await getMongoClient();
    console.log('MongoDB initialized successfully');

    return { mongodb: client };
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    throw error;
  }
}
