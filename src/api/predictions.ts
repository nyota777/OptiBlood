import api from '../services/api';

export interface PredictionResult {
  status: string;
  forecast_date: string;
  predicted_shortage: boolean;
  shortage_probability: number;
  message: string;
}

/**
 * Run the AI blood shortage prediction model
 * @returns Promise with prediction results
 */
export const runPrediction = async (): Promise<PredictionResult> => {
  try {
    const response = await api.post('/predict-shortage', {});
    
    if (response.data.success && response.data.data) {
      const predictions = response.data.data.predictions || [];
      
      // Find the highest risk prediction
      const highestRisk = predictions.reduce((max: any, pred: any) => {
        return (!max || pred.probability > max.probability) ? pred : max;
      }, null);
      
      // Calculate overall shortage status
      const shortages = predictions.filter((p: any) => p.predicted_shortage);
      const overallShortage = shortages.length > 0;
      const avgProbability = predictions.reduce((sum: number, p: any) => sum + p.probability, 0) / predictions.length;
      
      // Build message
      const shortageTypes = shortages.map((p: any) => p.blood_type).join(', ');
      const message = overallShortage
        ? `High probability of blood shortage detected for: ${shortageTypes}. Current inventory levels and donor availability suggest potential shortages.`
        : 'No significant shortages predicted. Current inventory levels and donor availability are sufficient.';
      
      // Forecast date (30 days from now)
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + 30);
      
      return {
        status: 'success',
        forecast_date: forecastDate.toISOString().split('T')[0],
        predicted_shortage: overallShortage,
        shortage_probability: avgProbability,
        message: message
      };
    } else {
      throw new Error('Invalid prediction response');
    }
  } catch (error: any) {
    console.error('Prediction error:', error);
    
    // If backend is not available, return mock data for development
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.response?.status === 500) {
      console.warn('Backend not available or error occurred, using mock prediction data');
      // Return mock prediction data
      return {
        status: 'success',
        forecast_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        predicted_shortage: Math.random() > 0.5,
        shortage_probability: Math.random() * 0.4 + 0.6, // Random between 0.6 and 1.0
        message: 'High probability of blood shortage next month for A+ and O- types. (Mock Data - Backend not connected)'
      };
    }
    throw new Error(error.response?.data?.message || 'Failed to run prediction. Please try again later.');
  }
};
