import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  Plus, 
  Edit, 
  Phone, 
  Mail, 
  Calendar, 
  Heart,
  Search,
  Filter,
  Download,
  UserPlus,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { UserRole } from '../../App';
import { toast } from 'sonner@2.0.3';
import { donorAPI, scheduleAPI, emailAPI, predictionAPI, donationAPI } from '../../services/api';
import { Textarea } from '../ui/textarea';

interface DonorManagementProps {
  userRole: UserRole;
}

interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodType: string;
  status: 'active' | 'inactive' | 'deferred';
  lastDonation: string;
  totalDonations: number;
  eligibleNext: string;
  age: number;
  weight: number;
  registrationDate: string;
  gender?: 'male' | 'female' | 'other';
}

interface DonationHistory {
  id: string;
  donorId: string;
  date: string;
  bloodType: string;
  units: number;
  location: string;
  status: 'completed' | 'deferred' | 'cancelled';
}

export function DonorManagement({ userRole }: DonorManagementProps) {
  const [donors, setDonors] = useState<Donor[]>([]);

  const [donationHistory] = useState<DonationHistory[]>([
    { id: '1', donorId: '1', date: '2024-10-15', bloodType: 'O+', units: 1, location: 'Main Center', status: 'completed' },
    { id: '2', donorId: '2', date: '2024-11-01', bloodType: 'A-', units: 1, location: 'Mobile Drive', status: 'completed' },
    { id: '3', donorId: '3', date: '2024-09-20', bloodType: 'B+', units: 0, location: 'Main Center', status: 'deferred' },
    { id: '4', donorId: '4', date: '2024-11-10', bloodType: 'AB+', units: 1, location: 'Corporate Drive', status: 'completed' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBloodType, setFilterBloodType] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('donors');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPredictDialogOpen, setIsPredictDialogOpen] = useState(false);
  const [isRecordDonationDialogOpen, setIsRecordDonationDialogOpen] = useState(false);
  const [recordDonationDonor, setRecordDonationDonor] = useState<Donor | null>(null);
  const [predictDonor, setPredictDonor] = useState<Donor | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [isBulkPredictDialogOpen, setIsBulkPredictDialogOpen] = useState(false);
  const [bulkPredictions, setBulkPredictions] = useState<any[]>([]);
  const [bulkPredictLoading, setBulkPredictLoading] = useState(false);
  const [scheduleDonor, setScheduleDonor] = useState<Donor | null>(null);
  const [emailDonor, setEmailDonor] = useState<Donor | null>(null);
  const [scheduleData, setScheduleData] = useState({
    scheduled_date: '',
    scheduled_time: '09:00',
    notes: ''
  });
  const [emailData, setEmailData] = useState({
    subject: '',
    message: ''
  });
  const [donationData, setDonationData] = useState({
    quantity: 450, // Default 450ml (1 unit)
    blood_type: ''
  });
  const [newDonor, setNewDonor] = useState<Partial<Donor>>({
    name: '',
    email: '',
    phone: '',
    bloodType: '',
    age: 0,
    weight: 0,
    status: 'active',
    gender: undefined
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'deferred': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isEligibleToDonate = (eligibleNext: string) => {
    return new Date(eligibleNext) <= new Date();
  };

  const getDaysUntilEligible = (eligibleNext: string) => {
    const today = new Date();
    const eligible = new Date(eligibleNext);
    const diffTime = eligible.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donor.bloodType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || donor.status === filterStatus;
    const matchesBloodType = filterBloodType === 'all' || donor.bloodType === filterBloodType;
    return matchesSearch && matchesStatus && matchesBloodType;
  });

  const eligibleDonors = donors.filter(donor => 
    donor.status === 'active' && isEligibleToDonate(donor.eligibleNext)
  );

  // Fetch donors from API
  const fetchDonors = async () => {
    try {
      const response = await donorAPI.getAll();
      if (response.data.success) {
        // Map backend data to frontend format
        const mappedDonors = response.data.data.map((donor: any) => ({
          id: donor.id,
          name: donor.name,
          email: donor.email,
          phone: donor.contact || '', // Map contact to phone
          bloodType: donor.blood_type || '', // Map blood_type to bloodType
          status: donor.available ? 'active' : 'inactive', // Map available to status
          lastDonation: donor.last_donation_date 
            ? new Date(donor.last_donation_date).toISOString().split('T')[0] 
            : '',
          totalDonations: donor.total_donations || 0,
          eligibleNext: donor.last_donation_date 
            ? new Date(new Date(donor.last_donation_date).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          age: donor.age || 0,
          weight: donor.weight || 0,
          registrationDate: donor.createdAt 
            ? new Date(donor.createdAt).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          gender: donor.gender || null
        }));
        setDonors(mappedDonors);
      }
    } catch (error: any) {
      console.error('Error fetching donors:', error);
      // Don't show error toast on initial load if unauthorized - might just need login
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch donors');
      }
    }
  };

  // Fetch donors on component mount
  useEffect(() => {
    fetchDonors();
    
    // Check if we should open the Add Donor dialog (from Quick Actions)
    const shouldOpenDialog = sessionStorage.getItem('openAddDonorDialog');
    if (shouldOpenDialog === 'true') {
      setIsAddDialogOpen(true);
      sessionStorage.removeItem('openAddDonorDialog');
    }
  }, []);

  const handleAddDonor = async () => {
    if (!newDonor.name || !newDonor.email || !newDonor.bloodType || !newDonor.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Map frontend fields to backend API format
      const donorData = {
        name: newDonor.name!,
        email: newDonor.email!,
        contact: newDonor.phone || '', // Map phone to contact
        blood_type: newDonor.bloodType!, // Map bloodType to blood_type
        status: newDonor.status || 'active', // Map status
        age: newDonor.age || null,
        weight: newDonor.weight || null,
        gender: newDonor.gender || null,
        city: null
      };

      const response = await donorAPI.create(donorData);
      
      if (response.data.success) {
        // Refresh donors list from API
        await fetchDonors();
        setNewDonor({ name: '', email: '', phone: '', bloodType: '', age: 0, weight: 0, status: 'active', gender: undefined });
        setIsAddDialogOpen(false);
        toast.success('Donor added successfully');
      }
    } catch (error: any) {
      console.error('Error adding donor:', error);
      
      // Provide more detailed error messages
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 'Failed to add donor';
        toast.error(errorMessage);
        console.error('Error details:', error.response.data);
      } else if (error.request) {
        // Request made but no response (network error, server not running)
        toast.error('Cannot connect to server. Make sure the backend is running on port 5000.');
        console.error('Network error - no response from server:', error.request);
      } else {
        // Something else happened
        toast.error(error.message || 'Failed to add donor');
        console.error('Error:', error.message);
      }
    }
  };

  const handleEditDonor = (donor: Donor) => {
    setEditingDonor(donor);
    setNewDonor(donor);
    setIsAddDialogOpen(true);
  };

  const handleScheduleDonation = async () => {
    if (!scheduleDonor || !scheduleData.scheduled_date) {
      toast.error('Please select a date for the appointment');
      return;
    }

    try {
      const response = await scheduleAPI.create({
        donor_id: scheduleDonor.id,
        scheduled_date: scheduleData.scheduled_date,
        scheduled_time: scheduleData.scheduled_time,
        notes: scheduleData.notes || ''
      });

      if (response.data.success) {
        toast.success(`Appointment scheduled successfully for ${scheduleDonor.name}`);
        setIsScheduleDialogOpen(false);
        setScheduleDonor(null);
        setScheduleData({ scheduled_date: '', scheduled_time: '09:00', notes: '' });
      }
    } catch (error: any) {
      console.error('Error scheduling donation:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule appointment');
    }
  };

  const handleRecordDonation = async () => {
    if (!recordDonationDonor || !donationData.blood_type || !donationData.quantity) {
      toast.error('Please provide blood type and quantity');
      return;
    }

    try {
      const response = await donationAPI.create({
        donor_id: recordDonationDonor.id,
        blood_type: donationData.blood_type,
        quantity: donationData.quantity
      });

      if (response.data.success) {
        toast.success(`Donation recorded successfully for ${recordDonationDonor.name}`);
        setIsRecordDonationDialogOpen(false);
        setRecordDonationDonor(null);
        setDonationData({ quantity: 450, blood_type: '' });
        // Refresh donor list to show updated stats (total_donations, last_donation_date)
        await fetchDonors();
      }
    } catch (error: any) {
      console.error('Error recording donation:', error);
      toast.error(error.response?.data?.message || 'Failed to record donation');
    }
  };

  const openRecordDonationDialog = (donor: Donor) => {
    setRecordDonationDonor(donor);
    setDonationData({
      quantity: 450,
      blood_type: donor.bloodType
    });
    setIsRecordDonationDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailDonor || !emailData.subject || !emailData.message) {
      toast.error('Please provide both subject and message');
      return;
    }

    try {
      const response = await emailAPI.send({
        donorIds: [emailDonor.id],
        subject: emailData.subject,
        message: emailData.message,
        templateType: 'custom'
      });

      if (response.data.success) {
        toast.success(`Email sent successfully to ${emailDonor.name}`);
        setIsEmailDialogOpen(false);
        setEmailDonor(null);
        setEmailData({ subject: '', message: '' });
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    }
  };

  const openScheduleDialog = (donor: Donor) => {
    setScheduleDonor(donor);
    setIsScheduleDialogOpen(true);
  };

  const openEmailDialog = (donor: Donor) => {
    setEmailDonor(donor);
    setEmailData({
      subject: `Blood Donation Request - ${donor.name}`,
      message: `Dear ${donor.name},\n\nWe hope this message finds you well. We would like to invite you to donate blood at our facility.\n\nYour blood type (${donor.bloodType}) is currently needed, and your contribution would make a significant difference.\n\nPlease let us know your availability, and we can schedule an appointment at your convenience.\n\nThank you for your continued support.\n\nBest regards,\nOptiBlood Team`
    });
    setIsEmailDialogOpen(true);
  };

  const handleBulkPredict = async () => {
    const eligibleDonors = donors.filter(d => d.totalDonations >= 2);
    
    if (eligibleDonors.length === 0) {
      toast.error('No donors with 2+ donations available for prediction');
      return;
    }

    setIsBulkPredictDialogOpen(true);
    setBulkPredictLoading(true);
    setBulkPredictions([]);

    try {
      const predictions = await Promise.all(
        eligibleDonors.map(async (donor) => {
          try {
            const response = await predictionAPI.predictDonorAvailability(donor.id);
            if (response.data.success) {
              return {
                donor,
                prediction: response.data.data
              };
            }
            return null;
          } catch (error) {
            console.error(`Error predicting for ${donor.name}:`, error);
            return null;
          }
        })
      );

      setBulkPredictions(predictions.filter(p => p !== null));
    } catch (error) {
      console.error('Error fetching bulk predictions:', error);
      toast.error('Failed to fetch predictions');
    } finally {
      setBulkPredictLoading(false);
    }
  };

  const openPredictDialog = async (donor: Donor) => {
    setPredictDonor(donor);
    setPrediction(null);
    setIsPredictDialogOpen(true);
    setPredictLoading(true);

    try {
      const response = await predictionAPI.predictDonorAvailability(donor.id);
      if (response.data.success) {
        setPrediction(response.data.data);
      }
    } catch (error: any) {
      console.error('Error predicting donor availability:', error);
      toast.error(error.response?.data?.message || 'Failed to predict availability');
    } finally {
      setPredictLoading(false);
    }
  };

  const handleUpdateDonor = async () => {
    if (!editingDonor) return;

    try {
      // Map frontend fields to backend API format
      const donorData = {
        name: newDonor.name,
        email: newDonor.email,
        contact: newDonor.phone, // Map phone to contact
        blood_type: newDonor.bloodType, // Map bloodType to blood_type
        status: newDonor.status, // Map status
        age: newDonor.age || null,
        weight: newDonor.weight || null,
        gender: newDonor.gender || null,
        city: null
      };

      const response = await donorAPI.update(editingDonor.id, donorData);
      
      if (response.data.success) {
        // Refresh donors list from API
        await fetchDonors();
        setEditingDonor(null);
        setNewDonor({ name: '', email: '', phone: '', bloodType: '', age: 0, weight: 0, status: 'active', gender: undefined });
        setIsAddDialogOpen(false);
        toast.success('Donor updated successfully');
      }
    } catch (error: any) {
      console.error('Error updating donor:', error);
      toast.error(error.response?.data?.message || 'Failed to update donor');
    }
  };

  const handleExportData = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Blood Type', 'Status', 'Total Donations', 'Last Donation', 'Next Eligible'],
      ...filteredDonors.map(donor => [
        donor.name,
        donor.email,
        donor.phone,
        donor.bloodType,
        donor.status,
        donor.totalDonations.toString(),
        donor.lastDonation || 'Never',
        donor.eligibleNext
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donor-database.csv';
    a.click();
    toast.success('Donor data exported successfully');
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Donor Management</h1>
          <p className="text-muted-foreground">Manage donor records, history, and eligibility</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleBulkPredict()}
            disabled={donors.filter(d => d.totalDonations >= 2).length === 0}
            title={donors.filter(d => d.totalDonations >= 2).length === 0 ? "Needs 2+ donations to predict" : "View predictions for all eligible donors"}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Predict Availability
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Donor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingDonor ? 'Edit Donor' : 'Add New Donor'}</DialogTitle>
                <DialogDescription>
                  {editingDonor ? 'Update donor information' : 'Register a new blood donor'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Enter full name"
                    value={newDonor.name || ''}
                    onChange={(e) => setNewDonor(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newDonor.email || ''}
                    onChange={(e) => setNewDonor(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="Enter phone number"
                    value={newDonor.phone || ''}
                    onChange={(e) => setNewDonor(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Select 
                      value={newDonor.bloodType} 
                      onValueChange={(value) => setNewDonor(prev => ({ ...prev, bloodType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select 
                      value={newDonor.gender || ''} 
                      onValueChange={(value) => setNewDonor(prev => ({ ...prev, gender: value as 'male' | 'female' | 'other' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={newDonor.status} 
                    onValueChange={(value) => setNewDonor(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="deferred">Deferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      placeholder="Age"
                      value={newDonor.age || ''}
                      onChange={(e) => setNewDonor(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      placeholder="Weight"
                      value={newDonor.weight || ''}
                      onChange={(e) => setNewDonor(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingDonor(null);
                    setNewDonor({ name: '', email: '', phone: '', bloodType: '', age: 0, weight: 0, status: 'active', gender: undefined });
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingDonor ? handleUpdateDonor : handleAddDonor}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {editingDonor ? 'Update Donor' : 'Add Donor'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">{donors.length}</p>
              <p className="text-sm text-gray-600">Total Donors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">
                {donors.filter(d => d.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active Donors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-blue-600">{eligibleDonors.length}</p>
              <p className="text-sm text-gray-600">Eligible Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-purple-600">
                {donors.reduce((sum, donor) => sum + donor.totalDonations, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Donations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Record Donations Section */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-600" />
            <span>Quick Record Donations</span>
          </CardTitle>
          <CardDescription>
            Record donations for eligible donors to enable prediction features (requires 2+ donations)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Eligible Donors</span>
                <Badge className="bg-green-100 text-green-800">{eligibleDonors.length}</Badge>
              </div>
              <p className="text-xs text-gray-500">Donors ready to donate</p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Can Predict</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {donors.filter(d => d.totalDonations >= 2).length}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">Donors with 2+ donations</p>
            </div>
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Need More Donations</span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {donors.filter(d => d.totalDonations < 2 && d.status === 'active').length}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">Need 1-2 more donations</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {eligibleDonors.slice(0, 6).map((donor) => (
                <Button
                  key={donor.id}
                  size="sm"
                  variant="outline"
                  onClick={() => openRecordDonationDialog(donor)}
                  className="bg-white hover:bg-green-50 border-green-200"
                >
                  <Heart className="h-3 w-3 mr-1 text-red-600" />
                  {donor.name}
                  <Badge className="ml-2 bg-gray-100 text-gray-700">
                    {donor.totalDonations} donation{donor.totalDonations !== 1 ? 's' : ''}
                  </Badge>
                </Button>
              ))}
              {eligibleDonors.length > 6 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveTab('eligible')}
                  className="bg-white hover:bg-green-50 border-green-200"
                >
                  View All ({eligibleDonors.length})
                </Button>
              )}
            </div>
            {eligibleDonors.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                No eligible donors at the moment. Donors become eligible 3 days after their last donation.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="donors">Donor Database</TabsTrigger>
          <TabsTrigger value="eligible">Eligible Donors</TabsTrigger>
          <TabsTrigger value="history">Donation History</TabsTrigger>
        </TabsList>

        <TabsContent value="donors">
          <Card>
            <CardHeader>
              <CardTitle>Donor Database</CardTitle>
              <CardDescription>Comprehensive donor information and management</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, or blood type..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterBloodType} onValueChange={setFilterBloodType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Blood Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {bloodTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Donations</TableHead>
                    <TableHead>Last Donation</TableHead>
                    <TableHead>Next Eligible</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonors.map((donor) => (
                    <TableRow key={donor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {donor.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{donor.name}</p>
                            <p className="text-sm text-gray-500">Age {donor.age}, {donor.weight}kg</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            <span className="truncate">{donor.email}</span>
                          </div>
                          {donor.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              <span>{donor.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{donor.bloodType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(donor.status)}>
                          {donor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{donor.totalDonations}</TableCell>
                      <TableCell>
                        {donor.lastDonation ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                            {donor.lastDonation}
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          <span className={isEligibleToDonate(donor.eligibleNext) ? 'text-green-600' : 'text-gray-600'}>
                            {isEligibleToDonate(donor.eligibleNext) 
                              ? 'Eligible now' 
                              : `${getDaysUntilEligible(donor.eligibleNext)} days`
                            }
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDonor(donor)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDonor(donor)}
                          >
                            View
                          </Button>
                          {donor.totalDonations >= 2 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPredictDialog(donor)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Based on KNBTS guidelines"
                            >
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Predict Availability
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredDonors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No donors found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eligible">
          <Card>
            <CardHeader>
              <CardTitle>Eligible Donors</CardTitle>
              <CardDescription>Donors currently eligible for donation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eligibleDonors.map((donor) => (
                  <div key={donor.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {donor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{donor.name}</h4>
                          <Badge variant="outline" className="text-xs">{donor.bloodType}</Badge>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Eligible</Badge>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Last donation: {donor.lastDonation || 'Never'}</p>
                      <p>Total donations: {donor.totalDonations}</p>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        <span className="truncate">{donor.email}</span>
                      </div>
                      {donor.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{donor.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2 mt-4">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          onClick={() => openScheduleDialog(donor)}
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openEmailDialog(donor)}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Contact
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openRecordDonationDialog(donor)}
                        className="w-full bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        Record Donation
                      </Button>
                      {donor.totalDonations >= 2 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openPredictDialog(donor)}
                          className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Based on KNBTS guidelines"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Predict Availability
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {eligibleDonors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No donors are currently eligible for donation.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Donation History</CardTitle>
              <CardDescription>Recent donation activities and outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Donor</TableHead>
                    <TableHead>Blood Type</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donationHistory.map((donation) => {
                    const donor = donors.find(d => d.id === donation.donorId);
                    return (
                      <TableRow key={donation.id}>
                        <TableCell>{donation.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {donor?.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span>{donor?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{donation.bloodType}</Badge>
                        </TableCell>
                        <TableCell>{donation.units}</TableCell>
                        <TableCell>{donation.location}</TableCell>
                        <TableCell>
                          <Badge className={
                            donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                            donation.status === 'deferred' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {donation.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Donation Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Donation Appointment</DialogTitle>
            <DialogDescription>
              Schedule a donation appointment with {scheduleDonor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Donor</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{scheduleDonor?.name}</p>
                <p className="text-sm text-gray-600">{scheduleDonor?.email}</p>
                <p className="text-sm text-gray-600">Blood Type: {scheduleDonor?.bloodType}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={scheduleData.scheduled_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setScheduleData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_time">Time</Label>
              <Input
                id="scheduled_time"
                type="time"
                value={scheduleData.scheduled_time}
                onChange={(e) => setScheduleData(prev => ({ ...prev, scheduled_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any special notes or instructions..."
                value={scheduleData.notes}
                onChange={(e) => setScheduleData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsScheduleDialogOpen(false);
                setScheduleDonor(null);
                setScheduleData({ scheduled_date: '', scheduled_time: '09:00', notes: '' });
              }}>
                Cancel
              </Button>
              <Button onClick={handleScheduleDonation} className="bg-red-600 hover:bg-red-700">
                Schedule Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email to Donor</DialogTitle>
            <DialogDescription>
              Send an email to {emailDonor?.name} ({emailDonor?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{emailDonor?.name}</p>
                <p className="text-sm text-gray-600">{emailDonor?.email}</p>
                <p className="text-sm text-gray-600">Blood Type: {emailDonor?.bloodType}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_subject">Subject *</Label>
              <Input
                id="email_subject"
                type="text"
                placeholder="Email subject"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email_message">Message *</Label>
              <Textarea
                id="email_message"
                placeholder="Write your message here..."
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                rows={8}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => {
                setIsEmailDialogOpen(false);
                setEmailDonor(null);
                setEmailData({ subject: '', message: '' });
              }}>
                Cancel
              </Button>
              <Button onClick={handleSendEmail} className="bg-red-600 hover:bg-red-700">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Predict Availability Dialog */}
      <Dialog open={isPredictDialogOpen} onOpenChange={setIsPredictDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Predict Availability</DialogTitle>
            <DialogDescription>
              Based on KNBTS guidelines and donation history
            </DialogDescription>
          </DialogHeader>
          {predictDonor && (
            <div className="space-y-4">
              {/* Donor Info */}
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-500">Name</Label>
                      <p className="font-medium">{predictDonor.name}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs text-gray-500">Blood Group</Label>
                        <p className="font-medium font-mono">{predictDonor.bloodType}</p>
                      </div>
                      {predictDonor.gender && (
                        <div>
                          <Label className="text-xs text-gray-500">Gender</Label>
                          <p className="font-medium capitalize">{predictDonor.gender}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Last Donation</Label>
                      <p className="font-medium">
                        {predictDonor.lastDonation || 'Never'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prediction Results */}
                {predictLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Running prediction...</p>
                    </div>
                  </div>
                ) : prediction ? (
                  <>
                    {prediction.can_predict === false || prediction.status === 'Not enough data' ? (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <p className="font-medium text-yellow-900">Not enough data</p>
                          </div>
                          <p className="text-sm text-yellow-800">{prediction.message}</p>
                          <div className="pt-2 border-t border-yellow-200">
                            <p className="text-xs text-yellow-700">
                              <strong>KNBTS Rule:</strong> {prediction.knbts_rule}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-600">Predicted Next Donation</Label>
                            <p className="text-lg font-semibold text-gray-900">
                              {prediction.next_donation ? new Date(prediction.next_donation).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                            <div>
                              <Label className="text-xs text-gray-600">Status</Label>
                              <div className="mt-1">
                                {prediction.status === 'Available' || prediction.status?.includes('Available') ? (
                                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                                ) : prediction.status?.startsWith('Wait') ? (
                                  <Badge className="bg-yellow-100 text-yellow-800">{prediction.status}</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">{prediction.status}</Badge>
                                )}
                              </div>
                            </div>
                            {prediction.days_until_eligible !== null && prediction.days_until_eligible !== undefined && (
                              <div className="text-right">
                                <Label className="text-xs text-gray-600">Countdown</Label>
                                <p className="text-lg font-semibold text-blue-600">
                                  {prediction.days_until_eligible <= 0 ? (
                                    <span className="text-green-600">Now</span>
                                  ) : (
                                    `${prediction.days_until_eligible} day${prediction.days_until_eligible !== 1 ? 's' : ''}`
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                          {prediction.message && (
                            <div className="pt-2 border-t border-blue-200">
                              <p className="text-sm text-gray-700">{prediction.message}</p>
                            </div>
                          )}
                          <div className="pt-2 border-t border-blue-200">
                            <p className="text-xs text-gray-600">
                              <strong>KNBTS Rule:</strong> {prediction.knbts_rule}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">Failed to generate prediction</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => {
              setIsPredictDialogOpen(false);
              setPredictDonor(null);
              setPrediction(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Donation Dialog */}
      <Dialog open={isRecordDonationDialogOpen} onOpenChange={setIsRecordDonationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Donation</DialogTitle>
            <DialogDescription>
              Record a blood donation for {recordDonationDonor?.name}
            </DialogDescription>
          </DialogHeader>
          {recordDonationDonor && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-gray-500">Donor Name</Label>
                    <p className="font-medium">{recordDonationDonor.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Blood Type</Label>
                    <p className="font-medium font-mono">{recordDonationDonor.bloodType}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Blood Type</Label>
                <Select 
                  value={donationData.blood_type} 
                  onValueChange={(value) => setDonationData(prev => ({ ...prev, blood_type: value }))}
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
              <div className="space-y-2">
                <Label>Quantity (ml)</Label>
                <Input
                  type="number"
                  placeholder="Enter quantity in milliliters"
                  min="1"
                  value={donationData.quantity || ''}
                  onChange={(e) => setDonationData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-xs text-gray-500">Standard donation: 450ml (1 unit)</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsRecordDonationDialogOpen(false);
                  setRecordDonationDonor(null);
                  setDonationData({ quantity: 450, blood_type: '' });
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleRecordDonation}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Record Donation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Predict Availability Dialog */}
      <Dialog open={isBulkPredictDialogOpen} onOpenChange={setIsBulkPredictDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Predict Availability - All Eligible Donors</DialogTitle>
            <DialogDescription>
              Predictions based on KNBTS guidelines for donors with 2+ donations
            </DialogDescription>
          </DialogHeader>
          {bulkPredictLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading predictions...</p>
              </div>
            </div>
          ) : bulkPredictions.length > 0 ? (
            <div className="space-y-4">
              {bulkPredictions.map((item: any) => {
                const { donor, prediction } = item;
                if (!prediction || prediction.can_predict === false) return null;

                return (
                  <div key={donor.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {donor.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{donor.name}</h4>
                            <p className="text-sm text-gray-500">
                              Blood Group: <span className="font-mono">{donor.bloodType}</span>
                              {donor.gender && ` • ${donor.gender.charAt(0).toUpperCase() + donor.gender.slice(1)}`}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <Label className="text-xs text-gray-500">Total Donations</Label>
                            <p className="font-medium">{donor.totalDonations}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Last Donation</Label>
                            <p className="font-medium">
                              {donor.lastDonation 
                                ? new Date(donor.lastDonation).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'Never'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Predicted Next</Label>
                            <p className="font-medium text-blue-600">
                              {prediction.next_donation 
                                ? new Date(prediction.next_donation).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Status</Label>
                            <div className="mt-1">
                              {prediction.status === 'Available' || prediction.status?.includes('Available') ? (
                                <Badge className="bg-green-100 text-green-800">Available</Badge>
                              ) : prediction.status?.startsWith('Wait') ? (
                                <Badge className="bg-yellow-100 text-yellow-800">{prediction.status}</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800">{prediction.status}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {prediction.days_until_eligible !== null && prediction.days_until_eligible !== undefined && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600">
                              {prediction.days_until_eligible <= 0 
                                ? <span className="text-green-600 font-medium">Eligible now</span>
                                : `Eligible in ${prediction.days_until_eligible} day${prediction.days_until_eligible !== 1 ? 's' : ''}`
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No eligible donors found for prediction</p>
              <p className="text-sm mt-2">Donors need at least 2 donations to generate predictions</p>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsBulkPredictDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}