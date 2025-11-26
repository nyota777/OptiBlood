import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// DatePickerWithRange removed as it's not implemented
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, XAxis, YAxis, BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Calendar, 
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Printer,
  Share,
  Loader2
} from 'lucide-react';
import { UserRole } from '../../App';
import { toast } from 'sonner@2.0.3';
import { reportsAPI } from '../../services/api';

interface ReportsAnalyticsProps {
  userRole: UserRole;
}

export function ReportsAnalytics({ userRole }: ReportsAnalyticsProps) {
  const [reportType, setReportType] = useState('summary');
  const [timeRange, setTimeRange] = useState('6months');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getAnalytics(timeRange);
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load analytics data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  // Use real data or fallback to empty arrays
  const monthlyStats = analytics?.monthlyStats || [];
  const bloodTypeDistribution = analytics?.bloodTypeDistribution || [];
  const donorDemographics = analytics?.donorDemographics || [];
  const summary = analytics?.summary || {
    totalCollections: 0,
    totalDistributions: 0,
    efficiencyRate: 0,
    shortageEvents: 0,
    percentageChange: 0
  };

  // Campaign performance - can be removed or made optional since it's not tracked
  const campaignPerformance: any[] = [];

  const predefinedReports = [
    {
      name: 'Monthly Summary Report',
      description: 'Comprehensive overview of collections, distributions, and inventory',
      frequency: 'Monthly',
      lastGenerated: '2024-12-01',
      format: 'PDF'
    },
    {
      name: 'Donor Activity Analysis',
      description: 'Detailed donor engagement and retention metrics',
      frequency: 'Quarterly',
      lastGenerated: '2024-11-15',
      format: 'Excel'
    },
    {
      name: 'Shortage Incident Report',
      description: 'Analysis of shortage events and response effectiveness',
      frequency: 'As needed',
      lastGenerated: '2024-11-28',
      format: 'PDF'
    },
    {
      name: 'Campaign ROI Analysis',
      description: 'Return on investment for donation campaigns',
      frequency: 'Quarterly',
      lastGenerated: '2024-10-30',
      format: 'Excel'
    }
  ];

  const handleExportReport = (format: string, reportName: string) => {
    // Simulate report generation
    toast.success(`Generating ${reportName} in ${format.toUpperCase()} format...`);
    
    // In a real application, this would trigger a download
    setTimeout(() => {
      toast.success(`${reportName} downloaded successfully`);
    }, 2000);
  };

  const generateCustomReport = () => {
    toast.success(`Generating custom ${reportType} report for ${timeRange} period...`);
  };

  const getTotalCollections = () => summary.totalCollections || 0;
  const getTotalDistributions = () => summary.totalDistributions || 0;
  const getTotalShortageEvents = () => summary.shortageEvents || 0;
  const getEfficiencyRate = () => summary.efficiencyRate || 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate comprehensive reports and analyze performance data</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Last Month</SelectItem>
              <SelectItem value="quarterly">Last Quarter</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="yearly">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={generateCustomReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Collections</p>
                <p className="text-2xl font-semibold text-gray-900">{getTotalCollections().toLocaleString()}</p>
                <p className={`text-xs flex items-center mt-1 ${
                  summary.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {summary.percentageChange >= 0 ? '+' : ''}{summary.percentageChange}% vs last period
                </p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Distributions</p>
                <p className="text-2xl font-semibold text-gray-900">{getTotalDistributions().toLocaleString()}</p>
                <p className="text-xs text-gray-500">6-month total</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Efficiency Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {getEfficiencyRate()}%
                </p>
                <p className="text-xs text-gray-500">collection to distribution</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <PieChartIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shortage Events</p>
                <p className="text-2xl font-semibold text-red-600">{getTotalShortageEvents()}</p>
                <p className="text-xs text-gray-500">6-month total</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Predefined Reports</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Collections vs Distributions Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Collections vs Distributions Trend</CardTitle>
              <CardDescription>Monthly comparison of blood collections and distributions</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyStats.length > 0 ? (
                <div className="h-64 w-full mt-4">
                  <ChartContainer
                    config={{
                      collections: {
                        label: "Collections",
                        color: "#22c55e",
                      },
                      distributions: {
                        label: "Distributions",
                        color: "#ef4444",
                      },
                    }}
                  >
                    <LineChart data={monthlyStats} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 'auto']}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="collections" 
                        stroke="#22c55e" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Collections"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="distributions" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Distributions"
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              ) : (
                <div className="h-64 w-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No data available for the selected period</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blood Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Blood Type Distribution</CardTitle>
                <CardDescription>Current inventory breakdown by blood type</CardDescription>
              </CardHeader>
              <CardContent>
                {bloodTypeDistribution.length > 0 && bloodTypeDistribution.some((item: any) => item.units > 0) ? (
                  <>
                    <div className="h-48 w-full">
                      <ChartContainer
                        config={{
                          "O+": { label: "O+", color: "#ef4444" },
                          "A+": { label: "A+", color: "#f97316" },
                          "B+": { label: "B+", color: "#eab308" },
                          "AB+": { label: "AB+", color: "#22c55e" },
                          "O-": { label: "O-", color: "#3b82f6" },
                          "A-": { label: "A-", color: "#8b5cf6" },
                          "B-": { label: "B-", color: "#ec4899" },
                          "AB-": { label: "AB-", color: "#6b7280" }
                        }}
                      >
                        <PieChart width="100%" height="100%">
                          <Pie
                            data={bloodTypeDistribution.filter((item: any) => item.units > 0)}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            dataKey="percentage"
                          >
                            {bloodTypeDistribution.filter((item: any) => item.units > 0).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {bloodTypeDistribution.map((item: any) => (
                        <div key={item.type} className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-mono">{item.type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{item.percentage}%</span>
                            <span className="text-xs text-muted-foreground">({item.units})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 w-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No inventory data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Donor Demographics */}
            <Card>
              <CardHeader>
                <CardTitle>Donor Demographics</CardTitle>
                <CardDescription>Age distribution of active donors</CardDescription>
              </CardHeader>
              <CardContent>
                {donorDemographics.length > 0 && donorDemographics.some((demo: any) => demo.count > 0) ? (
                  <>
                    <div className="h-48 w-full mt-4">
                      <ChartContainer
                        config={{
                          count: {
                            label: "Number of Donors",
                            color: "#3b82f6",
                          },
                        }}
                      >
                        <BarChart data={donorDemographics} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <XAxis 
                            dataKey="ageGroup" 
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 'auto']}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                      {donorDemographics.map((demo: any) => (
                        <div key={demo.ageGroup} className="flex items-center justify-between text-sm">
                          <span>{demo.ageGroup} years</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{demo.count.toLocaleString()}</span>
                            <Badge variant="outline" className="text-xs">
                              {demo.percentage}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 w-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No donor age data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Campaign Performance - Optional section, can be removed if not tracked */}
          {campaignPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance Analysis</CardTitle>
                <CardDescription>ROI and effectiveness metrics for donation campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignPerformance.map((campaign: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{campaign.campaign}</h4>
                        <Badge className="bg-green-100 text-green-800">
                          ROI: {campaign.roi}x
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Reach</p>
                          <p className="font-medium">{campaign.reach.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Registrations</p>
                          <p className="font-medium">{campaign.registrations.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Collections</p>
                          <p className="font-medium">{campaign.collections.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cost</p>
                          <p className="font-medium">${campaign.cost.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Conversion</p>
                          <p className="font-medium">
                            {Math.round((campaign.collections / campaign.registrations) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Predefined Reports</CardTitle>
              <CardDescription>Standard reports generated automatically or on-demand</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predefinedReports.map((report, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{report.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Frequency: {report.frequency}</span>
                          <span>Last: {report.lastGenerated}</span>
                          <Badge variant="outline" className="text-xs">
                            {report.format}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleExportReport('pdf', report.name)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleExportReport('excel', report.name)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Excel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Generator</CardTitle>
              <CardDescription>Create tailored reports with specific parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary Report</SelectItem>
                      <SelectItem value="inventory">Inventory Analysis</SelectItem>
                      <SelectItem value="donors">Donor Report</SelectItem>
                      <SelectItem value="campaigns">Campaign Analysis</SelectItem>
                      <SelectItem value="trends">Trend Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Range</label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Last 7 Days</SelectItem>
                      <SelectItem value="monthly">Last Month</SelectItem>
                      <SelectItem value="quarterly">Last Quarter</SelectItem>
                      <SelectItem value="yearly">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="print">Print</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">Report Preview</h4>
                <p className="text-sm text-gray-600">
                  This {reportType.replace('_', ' ')} report will include {timeRange} data 
                  and be exported as {exportFormat.toUpperCase()} format.
                </p>
              </div>

              <div className="flex space-x-2">
                <Button 
                  className="bg-red-600 hover:bg-red-700" 
                  onClick={generateCustomReport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}