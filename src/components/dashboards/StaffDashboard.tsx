import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { LineChart, Line, XAxis, YAxis } from 'recharts';
import { 
  Droplet, 
  Users, 
  TrendingDown, 
  AlertTriangle,
  Activity,
  Calendar,
  Mail,
  Download,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { dashboardAPI, scheduleAPI, donorAPI, emailAPI } from '../../services/api';

interface StaffDashboardProps {
  onNavigate?: (view: string) => void;
}

export function StaffDashboard({ onNavigate }: StaffDashboardProps) {
  const navigate = onNavigate || ((view: string) => {
    // Fallback navigation using window location or state management
    window.location.hash = view;
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isNotificationsDialogOpen, setIsNotificationsDialogOpen] = useState(false);
  const [donors, setDonors] = useState<any[]>([]);
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [scheduleData, setScheduleData] = useState({
    donor_id: '',
    scheduled_date: '',
    scheduled_time: '09:00',
    notes: ''
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        console.error('Dashboard API returned unsuccessful response:', response.data);
        toast.error('Failed to load dashboard data');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);
      if (error.response?.status === 401) {
        // Unauthorized - user needs to login
        toast.error('Please login again');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please check backend logs.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch donors for scheduling
  const fetchDonors = async () => {
    try {
      const response = await donorAPI.getAll();
      if (response.data.success) {
        setDonors(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching donors:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchDonors();
  }, []);

  const handleScheduleDonation = async () => {
    if (!scheduleData.donor_id || !scheduleData.scheduled_date) {
      toast.error('Please select a donor and date');
      return;
    }

    try {
      const response = await scheduleAPI.create(scheduleData);
      if (response.data.success) {
        toast.success('Donation scheduled successfully');
        setIsScheduleDialogOpen(false);
        setScheduleData({ donor_id: '', scheduled_date: '', scheduled_time: '09:00', notes: '' });
        fetchDashboardData(); // Refresh dashboard
      }
    } catch (error: any) {
      console.error('Error scheduling donation:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule donation');
    }
  };

  const handleSendNotifications = async () => {
    if (selectedDonors.length === 0) {
      toast.error('Please select at least one donor');
      return;
    }

    try {
      // Use the email API with a shortage alert template
      const response = await emailAPI.send({
        donorIds: selectedDonors,
        subject: '🩸 Urgent: Blood Donation Needed',
        message: `Dear [Donor Name],

We are experiencing a critical shortage of [Blood Type] blood type and urgently need your help.

Your donation can save lives. Please contact us to schedule a donation appointment at your earliest convenience.

Thank you for being a lifesaver!

[Hospital Name] Blood Donation Team`,
        templateType: 'shortage'
      });

      if (response.data.success) {
        toast.success(`Notifications sent to ${response.data.data.sent} donor(s)`);
        setIsNotificationsDialogOpen(false);
        setSelectedDonors([]);
      }
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast.error(error.response?.data?.message || 'Failed to send notifications');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'safe': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'red': return 'bg-red-100 text-red-600';
      case 'green': return 'bg-green-100 text-green-600';
      case 'orange': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-muted-foreground mb-2">Unable to load dashboard data</p>
          <Button 
            variant="outline" 
            onClick={fetchDashboardData}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const summaryStats = [
    { label: 'Total Donors', value: stats.summary.totalDonors, change: '+0', icon: Users, color: 'blue' },
    { label: 'Blood Units Available', value: stats.summary.totalUnits, change: '+0', icon: Droplet, color: 'red' },
    { label: 'Donations This Month', value: stats.summary.donationsThisMonth, change: '+0', icon: Activity, color: 'green' },
    { label: 'Shortage Alerts', value: stats.summary.shortageAlerts, change: '0', icon: AlertTriangle, color: 'orange' }
  ];

  const criticalTypes = stats.criticalBloodTypes.length > 0 
    ? stats.criticalBloodTypes.join(', ') 
    : 'None';

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">Blood donation management overview</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Donation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Donation</DialogTitle>
                <DialogDescription>
                  Schedule a donation appointment with a donor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Donor</Label>
                  <Select 
                    value={scheduleData.donor_id} 
                    onValueChange={(value) => setScheduleData(prev => ({ ...prev, donor_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a donor" />
                    </SelectTrigger>
                    <SelectContent>
                      {donors.map(donor => (
                        <SelectItem key={donor.id} value={donor.id}>
                          {donor.name} ({donor.blood_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduleData.scheduled_date}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduleData.scheduled_time}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={scheduleData.notes}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleScheduleDonation} className="bg-red-600 hover:bg-red-700">
                    Schedule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isNotificationsDialogOpen} onOpenChange={setIsNotificationsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Mail className="h-4 w-4 mr-2" />
                Send Notifications
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Notifications to Donors</DialogTitle>
                <DialogDescription>
                  Select donors to send urgent blood shortage notifications
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {donors.map((donor) => (
                    <div key={donor.id} className="flex items-center space-x-2 p-2 border rounded">
                      <input
                        type="checkbox"
                        checked={selectedDonors.includes(donor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDonors([...selectedDonors, donor.id]);
                          } else {
                            setSelectedDonors(selectedDonors.filter(id => id !== donor.id));
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{donor.name}</p>
                        <p className="text-xs text-muted-foreground">{donor.email} • {donor.blood_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsNotificationsDialogOpen(false);
                    setSelectedDonors([]);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendNotifications}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={selectedDonors.length === 0}
                  >
                    Send to {selectedDonors.length} Donor(s)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Critical Alerts */}
      {stats.criticalBloodTypes.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Urgent:</strong> Critical shortage detected for {criticalTypes} blood types. Consider sending donor notifications.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl">{stat.value}</p>
                  <p className={`text-xs mt-1 ${
                    stat.change.startsWith('+') ? 'text-green-600' : 
                    stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${getIconColor(stat.color)}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Blood Inventory</CardTitle>
            <CardDescription>Available units by blood type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.bloodInventory && stats.bloodInventory.length > 0 ? (
                stats.bloodInventory.map((item: any) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.type === 'O+' ? '#ef4444' : item.type === 'A+' ? '#f97316' : '#3b82f6' }}
                      />
                      <span className="font-mono">{item.type}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span>{item.units} units</span>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No inventory data available</p>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/inventory')}
            >
              <Download className="h-4 w-4 mr-2" />
              View Full Inventory
            </Button>
          </CardContent>
        </Card>

        {/* Donation Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Donation vs Usage Trends</CardTitle>
            <CardDescription>Last 6 months comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.trends && stats.trends.donations && stats.trends.donations.length > 0 ? (
              <div className="h-64 w-full">
                <ChartContainer
                  config={{
                    donations: {
                      label: "Donations",
                      color: "#22c55e",
                    },
                    usage: {
                      label: "Usage",
                      color: "#ef4444",
                    },
                  }}
                >
                  <LineChart 
                    data={stats.trends.donations.map((d: any, i: number) => ({
                      month: d.month,
                      donations: d.donations || 0,
                      usage: stats.trends.usage && stats.trends.usage[i] ? (stats.trends.usage[i].usage || 0) : 0
                    }))} 
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
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
                      dataKey="donations" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Donations"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="usage" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Usage"
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-64 w-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No trend data available. Start recording donations to see trends.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
            <CardDescription>Latest blood donation records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentDonations && stats.recentDonations.length > 0 ? (
                stats.recentDonations.map((donation: any) => (
                  <div key={donation.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p>{donation.name}</p>
                      <p className="text-sm text-muted-foreground">{donation.date} • {donation.time}</p>
                    </div>
                    <Badge variant="outline" className="font-mono">{donation.type}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent donations</p>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/donors')}
            >
              View All Donations
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Scheduled donor visits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.upcomingAppointments && stats.upcomingAppointments.length > 0 ? (
                stats.upcomingAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p>{appointment.name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.date} • {appointment.time}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono">{appointment.type}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming appointments</p>
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => setIsScheduleDialogOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule New Appointment
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => {
                // Navigate to donors page and set flag to open add dialog
                sessionStorage.setItem('openAddDonorDialog', 'true');
                navigate('donors');
              }}
            >
              <div className="flex flex-col items-start">
                <Users className="h-5 w-5 mb-2 text-blue-600" />
                <span>Register New Donor</span>
                <span className="text-xs text-muted-foreground mt-1">Add donor to database</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => setIsScheduleDialogOpen(true)}
            >
              <div className="flex flex-col items-start">
                <Activity className="h-5 w-5 mb-2 text-green-600" />
                <span>Record Donation</span>
                <span className="text-xs text-muted-foreground mt-1">Log new blood donation</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => setIsNotificationsDialogOpen(true)}
            >
              <div className="flex flex-col items-start">
                <Mail className="h-5 w-5 mb-2 text-red-600" />
                <span>Send Email Alert</span>
                <span className="text-xs text-muted-foreground mt-1">Notify eligible donors</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
