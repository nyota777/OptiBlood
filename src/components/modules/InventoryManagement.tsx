import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  AlertTriangle,
  Search,
  Filter,
  Download,
  Brain,
  Loader2,
  Minus
} from 'lucide-react';
import { UserRole } from '../../App';
import { toast } from 'sonner@2.0.3';
import { runPrediction, PredictionResult } from '../../api/predictions';
import { PredictionCard } from './PredictionCard';
import { inventoryAPI } from '../../services/api';

interface InventoryManagementProps {
  userRole: UserRole;
}

interface BloodUnit {
  id: string;
  bloodType: string;
  units: number;
  expiryDate: string;
  location: string;
  status: 'available' | 'reserved' | 'expired';
  donorId?: string;
  collectionDate: string;
}

export function InventoryManagement({ userRole }: InventoryManagementProps) {
  const [inventory, setInventory] = useState<BloodUnit[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<BloodUnit | null>(null);
  const [newUnit, setNewUnit] = useState<Partial<BloodUnit>>({
    bloodType: '',
    units: 0,
    expiryDate: '',
    location: '',
    status: 'available'
  });
  const [withdrawData, setWithdrawData] = useState({
    bloodType: '',
    units: 0,
    reason: ''
  });

  // Prediction state
  const [isRunningPrediction, setIsRunningPrediction] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const locations = ['Main Storage', 'Emergency Storage', 'OR Storage', 'ICU Storage', 'Blood Bank'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryWarning = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { color: 'text-red-600', message: 'Expired' };
    if (days <= 3) return { color: 'text-red-600', message: `${days} days left` };
    if (days <= 7) return { color: 'text-yellow-600', message: `${days} days left` };
    return { color: 'text-gray-600', message: `${days} days left` };
  };

  const filteredInventory = inventory.filter(unit => {
    const matchesSearch = unit.bloodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         unit.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || unit.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const expiringUnits = inventory.filter(unit => getDaysUntilExpiry(unit.expiryDate) <= 7 && unit.status !== 'expired');

  const handleAddUnit = async () => {
    if (!newUnit.bloodType || !newUnit.units || !newUnit.expiryDate || !newUnit.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await inventoryAPI.create({
        blood_type: newUnit.bloodType,
        units: newUnit.units,
        expiry_date: newUnit.expiryDate,
        collection_date: new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        // Refresh inventory
        await fetchInventory();
        setNewUnit({ bloodType: '', units: 0, expiryDate: '', location: '', status: 'available' });
        setIsAddDialogOpen(false);
        toast.success('Blood unit added successfully');
      }
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      toast.error(error.response?.data?.message || 'Failed to add blood unit');
    }
  };

  const handleWithdrawStock = async () => {
    if (!withdrawData.bloodType || !withdrawData.units || withdrawData.units <= 0) {
      toast.error('Please provide blood type and units to withdraw');
      return;
    }

    try {
      const response = await inventoryAPI.withdraw({
        blood_type: withdrawData.bloodType,
        units: withdrawData.units,
        reason: withdrawData.reason || 'Hospital usage'
      });

      if (response.data.success) {
        // Refresh inventory
        await fetchInventory();
        setWithdrawData({ bloodType: '', units: 0, reason: '' });
        setIsWithdrawDialogOpen(false);
        toast.success(`Successfully withdrew ${withdrawData.units} units of ${withdrawData.bloodType}`);
      }
    } catch (error: any) {
      console.error('Error withdrawing inventory:', error);
      toast.error(error.response?.data?.message || 'Failed to withdraw blood units');
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      if (response.data.success) {
        // Map backend data to frontend format
        const mappedInventory: BloodUnit[] = response.data.data.map((item: any) => ({
          id: item.id,
          bloodType: item.blood_type,
          units: item.units,
          expiryDate: new Date(item.expiry_date).toISOString().split('T')[0],
          location: 'Main Storage', // Default or from backend if available
          status: item.status,
          collectionDate: new Date(item.collection_date).toISOString().split('T')[0]
        }));
        setInventory(mappedInventory);
      }
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch inventory');
      }
    }
  };

  const handleEditUnit = (unit: BloodUnit) => {
    setEditingUnit(unit);
    setNewUnit(unit);
    setIsAddDialogOpen(true);
  };

  const handleUpdateUnit = () => {
    if (!editingUnit) return;

    setInventory(prev => prev.map(unit => 
      unit.id === editingUnit.id ? { ...unit, ...newUnit } : unit
    ));
    setEditingUnit(null);
    setNewUnit({ bloodType: '', units: 0, expiryDate: '', location: '', status: 'available' });
    setIsAddDialogOpen(false);
    toast.success('Blood unit updated successfully');
  };

  const handleDeleteUnit = (id: string) => {
    setInventory(prev => prev.filter(unit => unit.id !== id));
    toast.success('Blood unit removed from inventory');
  };

  const handleExportData = () => {
    const csvContent = [
      ['Blood Type', 'Units', 'Expiry Date', 'Location', 'Status', 'Collection Date'],
      ...filteredInventory.map(unit => [
        unit.bloodType,
        unit.units.toString(),
        unit.expiryDate,
        unit.location,
        unit.status,
        unit.collectionDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blood-inventory.csv';
    a.click();
    toast.success('Inventory data exported successfully');
  };

  // Fetch inventory on component mount
  useEffect(() => {
    fetchInventory();
  }, []);

  const handleRunPrediction = async () => {
    setIsRunningPrediction(true);
    try {
      const result = await runPrediction();
      setPredictionResult(result);
      toast.success('Prediction completed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to run prediction. Please try again later.';
      toast.error(errorMessage);
      console.error('Prediction error:', error);
    } finally {
      setIsRunningPrediction(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage blood stock levels and expiry dates</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleRunPrediction}
            disabled={isRunningPrediction}
            className="bg-blue-50 border-blue-200 hover:bg-blue-100"
          >
            {isRunningPrediction ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Prediction...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run Prediction
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                <Minus className="h-4 w-4 mr-2" />
                Withdraw Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Blood Stock</DialogTitle>
                <DialogDescription>
                  Subtract blood units from inventory (e.g., when hospitals use blood)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Blood Type</Label>
                  <Select 
                    value={withdrawData.bloodType} 
                    onValueChange={(value) => setWithdrawData(prev => ({ ...prev, bloodType: value }))}
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
                  <Label>Units to Withdraw</Label>
                  <Input
                    type="number"
                    placeholder="Enter units to withdraw"
                    min="1"
                    value={withdrawData.units || ''}
                    onChange={(e) => setWithdrawData(prev => ({ ...prev, units: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Input
                    type="text"
                    placeholder="e.g., Hospital usage, Emergency request"
                    value={withdrawData.reason}
                    onChange={(e) => setWithdrawData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsWithdrawDialogOpen(false);
                    setWithdrawData({ bloodType: '', units: 0, reason: '' });
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleWithdrawStock}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Withdraw
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUnit ? 'Edit Blood Unit' : 'Add Blood Unit'}</DialogTitle>
                <DialogDescription>
                  {editingUnit ? 'Update the blood unit information' : 'Add new blood units to inventory'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Blood Type</Label>
                    <Select 
                      value={newUnit.bloodType} 
                      onValueChange={(value) => setNewUnit(prev => ({ ...prev, bloodType: value }))}
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
                    <Label>Units</Label>
                    <Input
                      type="number"
                      placeholder="Enter units"
                      value={newUnit.units || ''}
                      onChange={(e) => setNewUnit(prev => ({ ...prev, units: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={newUnit.expiryDate}
                      onChange={(e) => setNewUnit(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select 
                      value={newUnit.location} 
                      onValueChange={(value) => setNewUnit(prev => ({ ...prev, location: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select 
                    value={newUnit.status} 
                    onValueChange={(value) => setNewUnit(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="reserved">Reserved</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingUnit(null);
                    setNewUnit({ bloodType: '', units: 0, expiryDate: '', location: '', status: 'available' });
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={editingUnit ? handleUpdateUnit : handleAddUnit}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {editingUnit ? 'Update' : 'Add'} Unit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiringUnits.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Expiry Alert:</strong> {expiringUnits.length} blood units expire within 7 days. Review and prioritize usage.
          </AlertDescription>
        </Alert>
      )}

      {/* Prediction Results */}
      {predictionResult && (
        <PredictionCard prediction={predictionResult} />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-900">
                {inventory.reduce((sum, unit) => sum + unit.units, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Units</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">
                {inventory.filter(unit => unit.status === 'available').reduce((sum, unit) => sum + unit.units, 0)}
              </p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-yellow-600">
                {inventory.filter(unit => unit.status === 'reserved').reduce((sum, unit) => sum + unit.units, 0)}
              </p>
              <p className="text-sm text-gray-600">Reserved</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-red-600">
                {expiringUnits.length}
              </p>
              <p className="text-sm text-gray-600">Expiring Soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>Current blood stock with expiry tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by blood type or location..."
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
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood Type</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Collection Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((unit) => {
                const expiryWarning = getExpiryWarning(unit.expiryDate);
                return (
                  <TableRow key={unit.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{unit.bloodType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{unit.units}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{unit.expiryDate}</span>
                        <span className={`text-xs ${expiryWarning.color}`}>
                          {expiryWarning.message}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{unit.location}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(unit.status)}>
                        {unit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{unit.collectionDate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUnit(unit)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No inventory items found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}