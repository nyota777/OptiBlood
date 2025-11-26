import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, XAxis, YAxis, AreaChart, Area, BarChart, Bar, Tooltip } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  Target,
  Activity,
  Brain,
  RefreshCw
} from 'lucide-react';
import { UserRole } from '../../App';

interface PredictionForecastProps {
  userRole: UserRole;
}

export function PredictionForecast({ userRole }: PredictionForecastProps) {
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedBloodType, setSelectedBloodType] = useState('all');

  // Mock prediction data
  const demandForecast = [
    { date: '2024-12-10', predicted: 45, actual: 42, confidence: 0.92 },
    { date: '2024-12-11', predicted: 52, actual: 48, confidence: 0.89 },
    { date: '2024-12-12', predicted: 38, actual: 41, confidence: 0.94 },
    { date: '2024-12-13', predicted: 67, actual: null, confidence: 0.87 },
    { date: '2024-12-14', predicted: 71, actual: null, confidence: 0.85 },
    { date: '2024-12-15', predicted: 58, actual: null, confidence: 0.91 },
    { date: '2024-12-16', predicted: 49, actual: null, confidence: 0.88 }
  ];

  const shortageRisk = [
    { bloodType: 'O-', currentStock: 18, predictedNeed: 35, riskLevel: 'high', daysToShortage: 2 },
    { bloodType: 'AB-', currentStock: 5, predictedNeed: 8, riskLevel: 'medium', daysToShortage: 4 },
    { bloodType: 'B-', currentStock: 8, predictedNeed: 12, riskLevel: 'medium', daysToShortage: 5 },
    { bloodType: 'A+', currentStock: 45, predictedNeed: 48, riskLevel: 'low', daysToShortage: 12 },
    { bloodType: 'O+', currentStock: 85, predictedNeed: 75, riskLevel: 'none', daysToShortage: null }
  ];

  const seasonalTrends = [
    { month: 'Jan', donations: 850, demand: 920, trend: 'high_demand' },
    { month: 'Feb', donations: 780, demand: 840, trend: 'moderate' },
    { month: 'Mar', donations: 920, demand: 880, trend: 'surplus' },
    { month: 'Apr', donations: 680, demand: 950, trend: 'high_demand' },
    { month: 'May', donations: 950, demand: 890, trend: 'surplus' },
    { month: 'Jun', donations: 820, demand: 870, trend: 'moderate' }
  ];

  const aiInsights = [
    {
      type: 'critical',
      title: 'Critical Shortage Predicted',
      description: 'O- blood type will reach critical levels in 48 hours based on current consumption patterns.',
      confidence: 94,
      action: 'Launch emergency donor recruitment campaign',
      timeframe: '48 hours'
    },
    {
      type: 'optimization',
      title: 'Inventory Optimization',
      description: 'AB+ blood shows 15% lower demand than predicted. Consider reallocating resources.',
      confidence: 87,
      action: 'Redistribute collection focus',
      timeframe: '1 week'
    },
    {
      type: 'opportunity',
      title: 'Donation Drive Timing',
      description: 'Historical data suggests 23% higher turnout on weekends for university locations.',
      confidence: 91,
      action: 'Schedule weekend campus drives',
      timeframe: 'Ongoing'
    }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'none': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'optimization': return <Target className="h-4 w-4 text-blue-600" />;
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPredictionAccuracy = () => {
    const actualData = demandForecast.filter(d => d.actual !== null);
    if (actualData.length === 0) return 0;
    
    const accuracy = actualData.reduce((acc, data) => {
      const error = Math.abs(data.predicted - data.actual!) / data.actual!;
      return acc + (1 - error);
    }, 0) / actualData.length;
    
    return Math.round(accuracy * 100);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Predictions & Forecasting</h1>
          <p className="text-gray-600">Machine learning insights for blood shortage prediction</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="14days">14 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Update Model
          </Button>
        </div>
      </div>

      {/* AI Model Performance */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Model Accuracy</p>
                <p className="text-2xl font-semibold text-gray-900">{getPredictionAccuracy()}%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.3% this week
                </p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Predictions Made</p>
                <p className="text-2xl font-semibold text-gray-900">1,247</p>
                <p className="text-xs text-gray-500">this month</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-semibold text-red-600">3</p>
                <p className="text-xs text-gray-500">active now</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Next Update</p>
                <p className="text-2xl font-semibold text-gray-900">2h</p>
                <p className="text-xs text-gray-500">real-time learning</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>AI Alert:</strong> Model predicts critical O- shortage in 48 hours with 94% confidence. Immediate action recommended.
        </AlertDescription>
      </Alert>

      {/* Demand Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Demand Forecast</CardTitle>
          <CardDescription>AI-predicted blood demand vs actual consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full mt-4">
            <ChartContainer
              config={{
                predicted: {
                  label: "Predicted Demand",
                  color: "hsl(var(--chart-1))",
                },
                actual: {
                  label: "Actual Demand",
                  color: "hsl(var(--chart-2))",
                },
                confidence: {
                  label: "Confidence",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <LineChart data={demandForecast} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="var(--color-predicted)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="var(--color-actual)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shortage Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Shortage Risk Analysis</CardTitle>
            <CardDescription>AI-calculated shortage probability by blood type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shortageRisk.map((risk) => (
                <div key={risk.bloodType} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono">{risk.bloodType}</Badge>
                      <span className="text-sm text-gray-600">
                        {risk.currentStock} / {risk.predictedNeed} units
                      </span>
                    </div>
                    <Badge className={getRiskColor(risk.riskLevel)}>
                      {risk.riskLevel === 'none' ? 'Safe' : `${risk.riskLevel} risk`}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Stock ratio: {Math.round((risk.currentStock / risk.predictedNeed) * 100)}%
                    </span>
                    {risk.daysToShortage && (
                      <span className={`flex items-center ${
                        risk.daysToShortage <= 3 ? 'text-red-600' : 
                        risk.daysToShortage <= 7 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {risk.daysToShortage} days to shortage
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Patterns</CardTitle>
            <CardDescription>Historical donation and demand trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full mt-4">
              <ChartContainer
                config={{
                  donations: {
                    label: "Donations",
                    color: "hsl(var(--chart-1))",
                  },
                  demand: {
                    label: "Demand",
                    color: "hsl(var(--chart-2))",
                  },
                }}
              >
                <BarChart data={seasonalTrends} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="donations" fill="var(--color-donations)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="demand" fill="var(--color-demand)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights</CardTitle>
          <CardDescription>Machine learning recommendations and opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.confidence}% confidence
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {insight.timeframe}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">
                    Recommended: {insight.action}
                  </span>
                  <Button size="sm" variant="outline">
                    Take Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Model Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Model Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-medium">v2.1.3</span>
              </div>
              <div className="flex justify-between">
                <span>Last Trained:</span>
                <span className="font-medium">Dec 8, 2024</span>
              </div>
              <div className="flex justify-between">
                <span>Training Data:</span>
                <span className="font-medium">2.3M records</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Historical donation patterns</p>
              <p>• Hospital demand records</p>
              <p>• Seasonal trends analysis</p>
              <p>• Emergency event data</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Next Update</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>Real-time learning active</p>
              <p>Model updates every 2 hours</p>
              <p>Emergency retraining when confidence drops below 80%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}