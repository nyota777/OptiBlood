import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertTriangle, CheckCircle, Calendar, TrendingUp } from 'lucide-react';
import { PredictionResult } from '../../api/predictions';

interface PredictionCardProps {
  prediction: PredictionResult;
}

export function PredictionCard({ prediction }: PredictionCardProps) {
  const isShortage = prediction.predicted_shortage;
  const probabilityPercentage = (prediction.shortage_probability * 100).toFixed(0);

  return (
    <Card className={`${isShortage ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isShortage ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-900">Shortage Predicted</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-900">No Shortage Expected</span>
              </>
            )}
          </CardTitle>
          <Badge 
            className={`${
              isShortage 
                ? 'bg-red-100 text-red-800 border-red-300' 
                : 'bg-green-100 text-green-800 border-green-300'
            }`}
            variant="outline"
          >
            AI Prediction
          </Badge>
        </div>
        <CardDescription className={isShortage ? 'text-red-700' : 'text-green-700'}>
          Based on historical data and current inventory trends
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Forecast Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Forecast Date</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(prediction.forecast_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Shortage Probability */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              <span>Shortage Probability</span>
            </div>
            <p className={`text-lg font-semibold ${
              isShortage ? 'text-red-600' : 'text-green-600'
            }`}>
              {probabilityPercentage}%
            </p>
          </div>

          {/* Prediction Status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Predicted Shortage</span>
            </div>
            <p className={`text-lg font-semibold ${
              isShortage ? 'text-red-600' : 'text-green-600'
            }`}>
              {isShortage ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Message */}
        {prediction.message && (
          <div className={`mt-4 p-4 rounded-lg ${
            isShortage ? 'bg-red-100 border border-red-200' : 'bg-green-100 border border-green-200'
          }`}>
            <p className={`text-sm ${isShortage ? 'text-red-800' : 'text-green-800'}`}>
              <strong>Analysis:</strong> {prediction.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
