import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, XAxis, YAxis, BarChart, Bar, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Droplet, 
  TrendingUp, 
  AlertTriangle,
  Activity,
  Users,
  MessageSquare,
  UserPlus,
  FileText,
  Loader2,
  Phone,
  Mail,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Trash2,
  Shield,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { adminAPI, donorAPI } from '../../services/api';

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKPIs] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [stock, setStock] = useState<any>(null);
  const [availableDonors, setAvailableDonors] = useState<any[]>([]);
  const [shortageRisk, setShortageRisk] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [allDonors, setAllDonors] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [donorSearch, setDonorSearch] = useState('');
  const [donorFilterBloodType, setDonorFilterBloodType] = useState('all');
  const [donorFilterStatus, setDonorFilterStatus] = useState('all');
  
  // Dialog states
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isWalkInDialogOpen, setIsWalkInDialogOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [staffData, setStaffData] = useState({
    name: '',
    email: '',
    password: '',
    hospital_name: '',
    role: 'staff' as 'staff' | 'admin'
  });
  const [campaignData, setCampaignData] = useState({
    blood_groups: [] as string[],
    message: '',
    method: 'email' as 'email' | 'sms'
  });
  const [walkInData, setWalkInData] = useState({
    name: '',
    phone: '',
    blood_type: '',
    email: ''
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Fetch all admin data
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const [kpisRes, forecastRes, stockRes, donorsRes, riskRes, activityRes, allDonorsRes, staffRes] = await Promise.all([
        adminAPI.getKPIs(),
        adminAPI.getForecast(),
        adminAPI.getStock(),
        adminAPI.getAvailableDonors(20),
        adminAPI.getShortageRisk(),
        adminAPI.getActivity(10),
        adminAPI.getAllDonors({ limit: 100 }),
        adminAPI.getStaff()
      ]);

      if (kpisRes.data.success) setKPIs(kpisRes.data.data);
      if (forecastRes.data.success) setForecast(forecastRes.data.data);
      if (stockRes.data.success) setStock(stockRes.data.data);
      if (donorsRes.data.success) setAvailableDonors(donorsRes.data.data);
      if (riskRes.data.success) setShortageRisk(riskRes.data.data);
      if (activityRes.data.success) setActivity(activityRes.data.data);
      if (allDonorsRes.data.success) setAllDonors(allDonorsRes.data.data);
      if (staffRes.data.success) setStaff(staffRes.data.data);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load admin dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSendCampaign = async () => {
    if (campaignData.blood_groups.length === 0 || !campaignData.message) {
      toast.error('Please select blood groups and enter a message');
      return;
    }

    try {
      const response = await adminAPI.sendCampaign(campaignData);
      if (response.data.success) {
        toast.success(`Campaign sent to ${response.data.data.total_recipients} recipients`);
        setIsCampaignDialogOpen(false);
        setCampaignData({ blood_groups: [], message: '', method: 'email' });
        await fetchAdminData(); // Refresh activity
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to send campaign');
    }
  };

  const handleRegisterWalkIn = async () => {
    if (!walkInData.name || !walkInData.phone || !walkInData.blood_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await donorAPI.create({
        name: walkInData.name,
        email: walkInData.email || `${walkInData.name.toLowerCase().replace(' ', '.')}@walkin.optiblood.com`,
        contact: walkInData.phone,
        blood_type: walkInData.blood_type,
        status: 'active'
      });

      if (response.data.success) {
        toast.success('Walk-in donor registered successfully');
        setIsWalkInDialogOpen(false);
        setWalkInData({ name: '', phone: '', blood_type: '', email: '' });
        await fetchAdminData();
      }
    } catch (error: any) {
      console.error('Error registering walk-in donor:', error);
      toast.error(error.response?.data?.message || 'Failed to register donor');
    }
  };

  const handleCreateStaff = async () => {
    if (!staffData.name || !staffData.email || !staffData.password || !staffData.hospital_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await adminAPI.createStaff(staffData);
      if (response.data.success) {
        toast.success('Staff user created successfully');
        setIsStaffDialogOpen(false);
        setStaffData({ name: '', email: '', password: '', hospital_name: '', role: 'staff' });
        await fetchAdminData();
      }
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast.error(error.response?.data?.message || 'Failed to create staff user');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff user?')) {
      return;
    }

    try {
      const response = await adminAPI.deleteStaff(id);
      if (response.data.success) {
        toast.success('Staff user deleted successfully');
        await fetchAdminData();
      }
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast.error(error.response?.data?.message || 'Failed to delete staff user');
    }
  };

  const handleDownloadReport = async (period: 'weekly' | 'monthly') => {
    try {
      const response = await adminAPI.downloadReport(period);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optiblood-${period}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`${period.charAt(0).toUpperCase() + period.slice(1)} report downloaded successfully`);
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const filteredAllDonors = allDonors.filter((donor: any) => {
    const matchesSearch = !donorSearch || 
      donor.name?.toLowerCase().includes(donorSearch.toLowerCase()) ||
      donor.email?.toLowerCase().includes(donorSearch.toLowerCase()) ||
      donor.contact?.toLowerCase().includes(donorSearch.toLowerCase());
    const matchesBloodType = donorFilterBloodType === 'all' || donor.blood_type === donorFilterBloodType;
    const matchesStatus = donorFilterStatus === 'all' || 
      (donorFilterStatus === 'active' && donor.available) ||
      (donorFilterStatus === 'inactive' && !donor.available);
    return matchesSearch && matchesBloodType && matchesStatus;
  });

  const getRiskColor = (probability: number) => {
    if (probability >= 70) return 'bg-red-500';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRiskTextColor = (probability: number) => {
    if (probability >= 70) return 'text-red-900';
    if (probability >= 40) return 'text-yellow-900';
    return 'text-green-900';
  };

  const formatPhone = (phone: string) => {
    // Format Kenyan phone numbers
    if (phone.startsWith('+254')) return phone;
    if (phone.startsWith('0')) return '+254' + phone.substring(1);
    if (phone.startsWith('254')) return '+' + phone;
    return '+254' + phone;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare forecast chart data
  const forecastChartData = [
    ...(forecast?.historical || []).map((h: any) => ({ ...h, donations: h.donations })),
    ...(forecast?.forecast || []).map((f: any) => ({ 
      ...f, 
      donations: f.donations,
      upper: f.confidence_upper,
      lower: f.confidence_lower
    }))
  ];

  return (
    <div className="flex-1 space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System-wide analytics and management - OptiBlood Kenya</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Blood Units</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {kpis?.total_blood_units?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">System-wide stock</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Droplet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Forecast</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {kpis?.today_forecasted_donations || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Expected donations</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Groups</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {kpis?.critical_blood_groups || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {kpis?.critical_blood_types?.join(', ') || 'None'}
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High-Risk Donors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {kpis?.high_risk_donors?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">From shortage model</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demand Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Demand Forecast</CardTitle>
          <CardDescription>Last 12 months actual + Next 12 months predicted (95% confidence interval)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChartData}>
                <defs>
                  <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip />
                <Area 
                  type="monotone" 
                  dataKey="donations" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fill="url(#colorDonations)"
                />
                {forecastChartData.some((d: any) => d.upper) && (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="upper" 
                      stroke="#ef4444" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      fill="none"
                      opacity={0.5}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="lower" 
                      stroke="#ef4444" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      fill="none"
                      opacity={0.5}
                    />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Blood Stock by Group */}
        <Card>
          <CardHeader>
            <CardTitle>Live Blood Stock by Group</CardTitle>
            <CardDescription>Current inventory levels across all blood types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stock?.stock?.map((item: any) => (
                <div key={item.blood_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.blood_type}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">{item.units} units</span>
                      <Badge 
                        className={
                          item.status === 'critical' ? 'bg-red-100 text-red-800' :
                          item.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.status === 'critical' ? 'bg-red-500' :
                        item.status === 'low' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (item.units / 100) * 100)}%` 
                      }}
                    />
                  </div>
                  {item.expiring_units > 0 && (
                    <p className="text-xs text-orange-600">
                      ⚠️ {item.expiring_units} units expiring in next 3 days
                    </p>
                  )}
                </div>
              )) || (
                <p className="text-sm text-gray-500 text-center py-4">No stock data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shortage Risk Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle>Shortage Risk Heatmap</CardTitle>
            <CardDescription>Risk probability by blood group (0-100%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {shortageRisk.map((risk: any) => (
                <div
                  key={risk.blood_type}
                  className={`p-4 rounded-lg ${getRiskColor(risk.risk_probability)} text-white`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{risk.blood_type}</span>
                    <span className="text-sm font-semibold">{risk.risk_probability}%</span>
                  </div>
                  <div className="text-xs opacity-90">
                    <p>Stock: {risk.stock_units} units</p>
                    <p>Demand: {risk.recent_demand} (30d)</p>
                  </div>
                  <Badge 
                    className={`mt-2 ${
                      risk.status === 'high' ? 'bg-red-700' :
                      risk.status === 'medium' ? 'bg-yellow-600' :
                      'bg-green-700'
                    }`}
                  >
                    {risk.status.toUpperCase()} RISK
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Donor Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Available Donors (Top 20)</CardTitle>
          <CardDescription>AI-predicted donor availability with confidence scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Last Donation</TableHead>
                  <TableHead>Predicted Next</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableDonors.length > 0 ? (
                  availableDonors.map((donor: any) => (
                    <TableRow key={donor.id}>
                      <TableCell className="font-medium">{donor.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{formatPhone(donor.phone)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {donor.blood_group}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {donor.last_donation_date 
                          ? new Date(donor.last_donation_date).toLocaleDateString('en-KE', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {donor.predicted_next_eligible
                          ? new Date(donor.predicted_next_eligible).toLocaleDateString('en-KE', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            donor.confidence >= 80 ? 'bg-green-100 text-green-800' :
                            donor.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {donor.confidence}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Send SMS
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No eligible donors available for prediction
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <MessageSquare className="h-5 w-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">Send Campaign</div>
                    <div className="text-xs text-gray-500">SMS/Email to blood groups</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Send Campaign</DialogTitle>
                  <DialogDescription>Send SMS or email to selected blood groups</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Blood Groups</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {bloodTypes.map(type => (
                        <Button
                          key={type}
                          size="sm"
                          variant={campaignData.blood_groups.includes(type) ? "default" : "outline"}
                          onClick={() => {
                            setCampaignData(prev => ({
                              ...prev,
                              blood_groups: prev.blood_groups.includes(type)
                                ? prev.blood_groups.filter(bg => bg !== type)
                                : [...prev.blood_groups, type]
                            }));
                          }}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select 
                      value={campaignData.method} 
                      onValueChange={(value) => setCampaignData(prev => ({ ...prev, method: value as 'email' | 'sms' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Enter campaign message..."
                      value={campaignData.message}
                      onChange={(e) => setCampaignData(prev => ({ ...prev, message: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSendCampaign} className="bg-blue-600 hover:bg-blue-700">
                      Send Campaign
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isWalkInDialogOpen} onOpenChange={setIsWalkInDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <UserPlus className="h-5 w-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Register Walk-in Donor</div>
                    <div className="text-xs text-gray-500">Quick registration form</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Register Walk-in Donor</DialogTitle>
                  <DialogDescription>Quick registration for walk-in donors</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Enter donor name"
                      value={walkInData.name}
                      onChange={(e) => setWalkInData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number *</Label>
                    <Input
                      placeholder="0712345678"
                      value={walkInData.phone}
                      onChange={(e) => setWalkInData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (Optional)</Label>
                    <Input
                      type="email"
                      placeholder="donor@example.com"
                      value={walkInData.email}
                      onChange={(e) => setWalkInData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Blood Type *</Label>
                    <Select 
                      value={walkInData.blood_type} 
                      onValueChange={(value) => setWalkInData(prev => ({ ...prev, blood_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsWalkInDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRegisterWalkIn} className="bg-green-600 hover:bg-green-700">
                      Register
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <Shield className="h-5 w-5 mr-3 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">Manage Staff</div>
                    <div className="text-xs text-gray-500">Add/delete staff accounts</div>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Staff User</DialogTitle>
                  <DialogDescription>Create a new staff or admin account</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Enter staff name"
                      value={staffData.name}
                      onChange={(e) => setStaffData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="staff@hospital.com"
                      value={staffData.email}
                      onChange={(e) => setStaffData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      placeholder="Enter password"
                      value={staffData.password}
                      onChange={(e) => setStaffData(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hospital Name *</Label>
                    <Input
                      placeholder="Enter hospital name"
                      value={staffData.hospital_name}
                      onChange={(e) => setStaffData(prev => ({ ...prev, hospital_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select 
                      value={staffData.role} 
                      onValueChange={(value) => setStaffData(prev => ({ ...prev, role: value as 'staff' | 'admin' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsStaffDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateStaff} className="bg-purple-600 hover:bg-purple-700">
                      Create Staff
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex flex-col space-y-2">
              <Button 
                variant="outline" 
                className="h-auto py-4 justify-start"
                onClick={() => handleDownloadReport('weekly')}
              >
                <Download className="h-5 w-5 mr-3 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Download Weekly Report</div>
                  <div className="text-xs text-gray-500">CSV format</div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 justify-start"
                onClick={() => handleDownloadReport('monthly')}
              >
                <Download className="h-5 w-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Download Monthly Report</div>
                  <div className="text-xs text-gray-500">CSV format</div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full Donor List with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Donors</CardTitle>
              <CardDescription>Search and filter all registered donors</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchAdminData}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-10"
                  value={donorSearch}
                  onChange={(e) => setDonorSearch(e.target.value)}
                />
              </div>
              <Select value={donorFilterBloodType} onValueChange={setDonorFilterBloodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by blood type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blood Types</SelectItem>
                  {bloodTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={donorFilterStatus} onValueChange={setDonorFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Donor Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Total Donations</TableHead>
                    <TableHead>Last Donation</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAllDonors.length > 0 ? (
                    filteredAllDonors.map((donor: any) => (
                      <TableRow key={donor.id}>
                        <TableCell className="font-medium">{donor.name}</TableCell>
                        <TableCell>{donor.email || 'N/A'}</TableCell>
                        <TableCell>{donor.contact || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {donor.blood_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{donor.total_donations || 0}</TableCell>
                        <TableCell>
                          {donor.last_donation_date 
                            ? new Date(donor.last_donation_date).toLocaleDateString('en-KE', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Badge className={donor.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {donor.available ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        {donorSearch || donorFilterBloodType !== 'all' || donorFilterStatus !== 'all'
                          ? 'No donors match your filters'
                          : 'No donors found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-gray-500 text-center">
              Showing {filteredAllDonors.length} of {allDonors.length} donors
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Management */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Account Management</CardTitle>
          <CardDescription>Manage admin and staff user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.length > 0 ? (
                    staff.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.hospital_name}</TableCell>
                        <TableCell>
                          <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={user.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {user.email_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteStaff(user.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        No staff users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Log</CardTitle>
          <CardDescription>Last 10 system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.length > 0 ? (
              activity.map((item: any) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="mt-1">
                    {item.icon === 'droplet' && <Droplet className="h-4 w-4 text-red-600" />}
                    {item.icon === 'alert' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                    {!item.icon && <Activity className="h-4 w-4 text-gray-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.message}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.time_ago || 'Recently'}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
