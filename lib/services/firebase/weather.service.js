/**
 * Weather Service
 *
 * Handles weather data storage and retrieval for users.
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { BaseService } from './base.service';

// Cache for update timestamps to prevent too frequent updates
const lastUpdateTimestamps = {};

class WeatherService extends BaseService {
  /**
   * Get user's weather data
   * @param {string} uid - User ID
   * @returns {Promise<{ weatherData: Object|null, currentCity: string }>}
   */
  async getUserWeatherData(uid) {
    try {
      if (!uid) {
        this.warn('UID not provided');
        return { weatherData: null, currentCity: 'São Paulo,BR' };
      }

      const userRef = doc(this.firestore, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        this.warn('User not found:', uid);
        return { weatherData: null, currentCity: 'São Paulo,BR' };
      }

      const userData = userDoc.data();
      let currentCity = 'São Paulo,BR';

      // Determine city from user address or previous weather data
      if (userData.address?.city) {
        const cityName = userData.address.city;
        currentCity = cityName.includes(',') ? cityName : `${cityName},BR`;
      } else if (userData.weatherData?.cityRequested) {
        currentCity = userData.weatherData.cityRequested;
      }

      if (userData.weatherData) {
        this.log(`Weather data found for user ${uid} (city: ${currentCity})`);

        // Calculate data age for debugging
        if (userData.weatherData.timestamp) {
          const timestamp = userData.weatherData.timestamp;
          const timestampDate = typeof timestamp === 'object' && timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);
          const diff = Date.now() - timestampDate.getTime();
          this.log(`Data age: ${Math.round(diff / 60000)} minutes`);
        }
      } else {
        this.log(`No weather data for user ${uid} (city: ${currentCity})`);
      }

      return {
        weatherData: userData.weatherData || null,
        currentCity
      };
    } catch (error) {
      console.error('[WeatherService] Error getting weather data:', error);
      return { weatherData: null, currentCity: 'São Paulo,BR' };
    }
  }

  /**
   * Update user's weather data
   * @param {string} uid - User ID
   * @param {Object} weatherData - Weather data to store
   * @param {string} [cityRequested] - City that was requested
   * @returns {Promise<boolean>} Success status
   */
  async updateUserWeatherData(uid, weatherData, cityRequested) {
    try {
      if (!uid) {
        console.error('[WeatherService] UID not provided');
        return false;
      }

      if (!weatherData) {
        console.error('[WeatherService] Invalid weather data');
        return false;
      }

      const city = cityRequested || 'São Paulo,BR';
      const updateKey = `${uid}_${city}`;
      const now = Date.now();

      // Rate limiting - prevent updates more frequent than 5 minutes
      if (lastUpdateTimestamps[updateKey]) {
        const timeSinceLastUpdate = now - lastUpdateTimestamps[updateKey];
        const MIN_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

        if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
          this.log(`Recent update for user ${uid} (${Math.round(timeSinceLastUpdate / 60000)}min ago)`);
          return true;
        }
      }

      lastUpdateTimestamps[updateKey] = now;

      const userRef = doc(this.firestore, 'users', uid);
      const weatherDataWithMetadata = {
        ...weatherData,
        timestamp: new Date(),
        cityRequested: city,
        lastUpdated: new Date().toISOString(),
        updateId: Date.now()
      };

      this.log(`Updating weather data for ${uid} (${city})`);

      await updateDoc(userRef, {
        weatherData: weatherDataWithMetadata
      });

      this.log(`Weather update completed for ${uid}`);
      return true;
    } catch (error) {
      console.error('[WeatherService] Error updating weather data:', error);
      return false;
    }
  }

  /**
   * Clear weather cache for a user
   * @param {string} uid - User ID
   */
  clearUserCache(uid) {
    const keysToDelete = Object.keys(lastUpdateTimestamps)
      .filter(key => key.startsWith(`${uid}_`));
    keysToDelete.forEach(key => delete lastUpdateTimestamps[key]);
    this.log(`Cleared weather cache for user ${uid}`);
  }
}

export const weatherService = new WeatherService();
export default weatherService;
