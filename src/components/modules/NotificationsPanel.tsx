import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  Send,
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { UserRole } from '../../App';
import { toast } from 'sonner@2.0.3';

interface NotificationsPanelProps {
  userRole: UserRole;
}

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'shortage' | 'inventory' | 'system' | 'campaign' | 'donor';
  actionRequired: boolean;
  source: string;
}

export function NotificationsPanel({ userRole }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Critical O- Blood Shortage',
      message: 'O- blood type has reached critical levels (8 units remaining). Immediate action required.',
      timestamp: '2024-12-09T14:30:00Z',
      read: false,
      priority: 'high',
      category: 'shortage',
      actionRequired: true,
      source: 'AI Prediction System'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Upcoming Blood Expiry',
      message: '15 units of A+ blood will expire in 48 hours. Consider usage prioritization.',
      timestamp: '2024-12-09T13:15:00Z',
      read: false,
      priority: 'medium',
      category: 'inventory',
      actionRequired: true,
      source: 'Inventory Management'
    },
    {
      id: '3',
      type: 'info',
      title: 'Donation Drive Reminder',
      message: 'Corporate blood drive at TechCorp starts tomorrow at 10:00 AM.',
      timestamp: '2024-12-09T10:45:00Z',
      read: true,
      priority: 'medium',
      category: 'campaign',
      actionRequired: false,
      source: 'Campaign Manager'
    },
    {
      id: '4',
      type: 'success',
      title: 'Monthly Target Achieved',
      message: 'Congratulations! You have achieved 105% of your monthly collection target.',
      timestamp: '2024-12-09T09:20:00Z',
      read: true,
      priority: 'low',
      category: 'campaign',
      actionRequired: false,
      source: 'Performance Tracker'
    },
    {
      id: '5',
      type: 'warning',
      title: 'System Maintenance Scheduled',
      message: 'Planned system maintenance on Dec 15, 2024 from 2:00 AM to 4:00 AM.',
      timestamp: '2024-12-09T08:00:00Z',
      read: false,
      priority: 'medium',
      category: 'system',
      actionRequired: false,
      source: 'System Administrator'
    }
  ]);

  const [filter, setFilter] = useState<string>('all');
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    priority: 'medium' as const,
    recipients: 'all'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    criticalOnly: false
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'critical') return notification.type === 'critical';
    if (filter === 'action-required') return notification.actionRequired;
    return notification.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.type === 'critical').length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    toast.success('Notification deleted');
  };

  const sendCustomAlert = () => {
    if (!newAlert.title || !newAlert.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    const alert: Notification = {
      id: Date.now().toString(),
      type: newAlert.type,
      title: newAlert.title,
      message: newAlert.message,
      timestamp: new Date().toISOString(),
      read: false,
      priority: newAlert.priority,
      category: 'system',
      actionRequired: false,
      source: 'Manual Alert'
    };

    setNotifications(prev => [alert, ...prev]);
    setNewAlert({ title: '', message: '', type: 'info', priority: 'medium', recipients: 'all' });
    toast.success(`Alert sent to ${newAlert.recipients} recipients`);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications & Alerts</h1>
          <p className="text-gray-600">Manage real-time alerts and system notifications</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          {(userRole === 'admin' || userRole === 'blood_bank') && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send Alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Custom Alert</DialogTitle>
                  <DialogDescription>
                    Send a system-wide alert to users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Alert Title</Label>
                    <Input
                      placeholder="Enter alert title"
                      value={newAlert.title}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Enter alert message"
                      value={newAlert.message}
                      onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select 
                        value={newAlert.type} 
                        onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Information</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select 
                        value={newAlert.priority} 
                        onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Select 
                      value={newAlert.recipients} 
                      onValueChange={(value) => setNewAlert(prev => ({ ...prev, recipients: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="hospitals">Hospitals Only</SelectItem>
                        <SelectItem value="blood_banks">Blood Banks Only</SelectItem>
                        <SelectItem value="admins">Administrators Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={sendCustomAlert} className="bg-red-600 hover:bg-red-700">
                      Send Alert
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-semibold text-gray-900">{notifications.length}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-semibold text-orange-600">{unreadCount}</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
                <Volume2 className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Alerts</p>
                <p className="text-2xl font-semibold text-red-600">{criticalCount}</p>
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
                <p className="text-sm text-gray-600">Action Required</p>
                <p className="text-2xl font-semibold text-purple-600">
                  {notifications.filter(n => n.actionRequired).length}
                </p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">All Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Real-time alerts and system notifications</CardDescription>
                </div>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notifications</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="critical">Critical Alerts</SelectItem>
                    <SelectItem value="action-required">Action Required</SelectItem>
                    <SelectItem value="shortage">Shortage Alerts</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="campaign">Campaigns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No notifications found for the selected filter.
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`border rounded-lg p-4 ${
                        notification.read ? 'bg-white' : getNotificationColor(notification.type)
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                              <Badge className={getPriorityBadgeColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <span>Source: {notification.source}</span>
                              {notification.actionRequired && (
                                <Badge variant="outline" className="text-xs">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          {!notification.read && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive alerts via email</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-500">Receive critical alerts via SMS</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, smsNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Browser push notifications</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Sound Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Sound Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {notificationSettings.soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-gray-500" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <p className="font-medium">Sound Alerts</p>
                        <p className="text-sm text-gray-500">Play sound for notifications</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notificationSettings.soundEnabled}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Priority Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Priority Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Critical Alerts Only</p>
                        <p className="text-sm text-gray-500">Only receive critical and high priority alerts</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notificationSettings.criticalOnly}
                      onCheckedChange={(checked) => 
                        setNotificationSettings(prev => ({ ...prev, criticalOnly: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => toast.success('Notification settings saved')}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}