import { CACHE_DURATION } from '../constants';
import { getCurrentUnixMillis } from '../utils';
import { getDb } from '../utils/mongodb';

export const getCachedData = async <T>(
  key: string,
  collection: string
): Promise<T | null> => {
  try {
    const db = await getDb();
    const cacheCollection = `cache_${collection}`;

    const doc = await db.collection(cacheCollection).findOne({ key: key });

    if (!doc) {
      return null;
    }

    // Check if cache is expired
    if (getCurrentUnixMillis() - doc.timestamp > CACHE_DURATION.PRICE) {
      // Remove expired cache entry
      await db.collection(cacheCollection).deleteOne({ key: key });
      return null;
    }

    // Remove MongoDB-specific fields and return cached data
    const { _id, key: cacheKey, timestamp, ...data } = doc;
    return data as T;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

export const setCachedData = async <T>(
  key: string,
  collection: string,
  data: T
): Promise<void> => {
  try {
    const db = await getDb();
    const cacheCollection = `cache_${collection}`;

    await db.collection(cacheCollection).replaceOne(
      { key: key },
      {
        key: key,
        ...data,
        timestamp: getCurrentUnixMillis(),
      },
      { upsert: true }
    );
  } catch (error) {
    console.error('Error setting cached data:', error);
  }
};
