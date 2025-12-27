/**
 * Weather Service - API Layer
 *
 * Serviço para dados meteorológicos via doctor-server.
 * Substitui o antigo weatherService do Firebase.
 */

import apiService from './apiService';

// Cache local para rate limiting
const lastUpdateTimestamps = {};

class WeatherService {
  constructor() {
    this.endpoint = '/weather';
  }

  /**
   * Obtém dados meteorológicos do usuário
   * @returns {Promise<{weatherData: Object|null, currentCity: string}>}
   */
  async getUserWeatherData() {
    try {
      const response = await apiService.get(this.endpoint);

      return {
        weatherData: response.weather_data || null,
        currentCity: response.city_requested || 'São Paulo,BR',
        lastUpdated: response.last_updated,
        isExpired: response.is_expired
      };
    } catch (error) {
      console.error('[WeatherService] Error getting weather data:', error);
      return { weatherData: null, currentCity: 'São Paulo,BR' };
    }
  }

  /**
   * Atualiza dados meteorológicos do usuário
   * @param {Object} weatherData - Dados do clima
   * @param {string} cityRequested - Cidade solicitada
   * @returns {Promise<boolean>}
   */
  async updateUserWeatherData(weatherData, cityRequested) {
    try {
      if (!weatherData) {
        console.error('[WeatherService] Invalid weather data');
        return false;
      }

      const city = cityRequested || 'São Paulo,BR';
      const updateKey = city;
      const now = Date.now();

      // Rate limiting - prevent updates more frequent than 5 minutes
      if (lastUpdateTimestamps[updateKey]) {
        const timeSinceLastUpdate = now - lastUpdateTimestamps[updateKey];
        const MIN_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

        if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
          console.log(`[WeatherService] Recent update (${Math.round(timeSinceLastUpdate / 60000)}min ago)`);
          return true;
        }
      }

      lastUpdateTimestamps[updateKey] = now;

      await apiService.put(this.endpoint, {
        weather_data: weatherData,
        city_requested: city,
      });

      console.log(`[WeatherService] Weather update completed for ${city}`);
      return true;
    } catch (error) {
      console.error('[WeatherService] Error updating weather data:', error);
      return false;
    }
  }

  /**
   * Limpa cache de weather do usuário
   * @returns {Promise<boolean>}
   */
  async clearUserCache() {
    try {
      await apiService.delete(this.endpoint);

      // Limpa cache local também
      Object.keys(lastUpdateTimestamps).forEach(key => {
        delete lastUpdateTimestamps[key];
      });

      console.log('[WeatherService] Weather cache cleared');
      return true;
    } catch (error) {
      console.error('[WeatherService] Error clearing cache:', error);
      return false;
    }
  }
}

const weatherService = new WeatherService();

export { weatherService };
export default weatherService;
