import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Checkbox } from '../ui/checkbox';
import { 
  Mail, 
  Send,
  Heart,
  AlertTriangle,
  Users,
  Calendar,
  CheckCircle,
  FileText
} from 'lucide-react';
import { UserRole } from '../../App';
import { toast } from 'sonner@2.0.3';
import { donorAPI, emailAPI } from '../../services/api';

interface EmailNotificationsProps {
  userRole: UserRole;
}

interface Donor {
  id: string;
  name: string;
  email: string;
  bloodType: string;
  lastDonation: string;
  eligible: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'appreciation' | 'shortage' | 'appointment' | 'custom';
}

export function EmailNotifications({ userRole }: EmailNotificationsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [filterBloodType, setFilterBloodType] = useState<string>('all');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedEmailHistory, setSelectedEmailHistory] = useState<any | null>(null);
  const [showRecipientsDialog, setShowRecipientsDialog] = useState(false);

  const emailTemplates: EmailTemplate[] = [
    {
      id: 'appreciation',
      name: 'Thank You for Donating',
      subject: 'Thank you for your life-saving donation!',
      body: 'Dear [Donor Name],\n\nThank you for your recent blood donation on [Date]. Your generosity has the potential to save up to three lives.\n\nYour contribution makes a real difference in our community, and we are deeply grateful for your ongoing support.\n\nBest regards,\n[Hospital Name] Blood Donation Team',
      type: 'appreciation'
    },
    {
      id: 'shortage',
      name: 'Urgent Blood Needed',
      subject: 'Urgent: We need your help - Blood shortage alert',
      body: 'Dear [Donor Name],\n\nWe are currently experiencing a critical shortage of [Blood Type] blood. As an eligible donor, we urgently need your help.\n\nPlease consider scheduling a donation appointment at your earliest convenience. Your donation could save lives.\n\nTo schedule: Call us at [Phone] or visit our website.\n\nThank you for your continued support.\n\nBest regards,\n[Hospital Name] Blood Donation Team',
      type: 'shortage'
    },
    {
      id: 'appointment',
      name: 'Appointment Reminder',
      subject: 'Reminder: Your blood donation appointment',
      body: 'Dear [Donor Name],\n\nThis is a reminder of your upcoming blood donation appointment:\n\nDate: [Date]\nTime: [Time]\nLocation: [Hospital Name]\n\nPlease remember to:\n- Eat a good meal before your appointment\n- Stay hydrated\n- Bring a valid ID\n\nIf you need to reschedule, please contact us at [Phone].\n\nThank you!\n\nBest regards,\n[Hospital Name] Blood Donation Team',
      type: 'appointment'
    }
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Check if donor is eligible to donate (3 days after last donation - for testing)
  const isEligibleToDonate = (lastDonationDate: string | null): boolean => {
    if (!lastDonationDate) return true; // Never donated, eligible
    
    const lastDonation = new Date(lastDonationDate);
    const today = new Date();
    const daysSinceDonation = Math.floor((today.getTime() - lastDonation.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceDonation >= 3; // 3 days between donations (reduced for testing)
  };

  // Fetch donors from API
  const fetchDonors = async () => {
    try {
      setLoading(true);
      const response = await donorAPI.getAll();
      if (response.data.success) {
        // Map backend data to frontend format
        const mappedDonors: Donor[] = response.data.data.map((donor: any) => {
          const lastDonation = donor.last_donation_date 
            ? new Date(donor.last_donation_date).toISOString().split('T')[0] 
            : '';
          const eligible = isEligibleToDonate(donor.last_donation_date);
          
          return {
            id: donor.id,
            name: donor.name,
            email: donor.email,
            bloodType: donor.blood_type || '',
            lastDonation: lastDonation,
            eligible: eligible
          };
        });
        setDonors(mappedDonors);
      }
    } catch (error: any) {
      console.error('Error fetching donors:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch donors');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch email history
  const fetchEmailHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await emailAPI.getHistory();
      if (response.data.success) {
        setEmailHistory(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching email history:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch email history');
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch donors on component mount
  useEffect(() => {
    fetchDonors();
    fetchEmailHistory();
  }, []);

  const filteredDonors = donors.filter(donor => {
    if (filterBloodType === 'all') return true;
    if (filterBloodType === 'eligible') return donor.eligible;
    return donor.bloodType === filterBloodType;
  });

  const handleSelectAllDonors = () => {
    if (selectedDonors.length === filteredDonors.length) {
      setSelectedDonors([]);
    } else {
      setSelectedDonors(filteredDonors.map(d => d.id));
    }
  };

  const handleToggleDonor = (donorId: string) => {
    if (selectedDonors.includes(donorId)) {
      setSelectedDonors(selectedDonors.filter(id => id !== donorId));
    } else {
      setSelectedDonors([...selectedDonors, donorId]);
    }
  };

  const handleSendEmails = async () => {
    try {
      setShowConfirmDialog(false);
      
      // Get the email content
      const template = getTemplateContent();
      const subject = selectedTemplate === 'custom' ? customSubject : (template?.subject || '');
      const message = selectedTemplate === 'custom' ? customMessage : (template?.body || '');

      if (!subject || !message) {
        toast.error('Please provide both subject and message');
        return;
      }

      // Send emails via API
      const response = await emailAPI.send({
        donorIds: selectedDonors,
        subject: subject,
        message: message,
        templateType: selectedTemplate
      });

      if (response.data.success) {
        const { sent, failed, errors } = response.data.data;
        
        if (sent > 0) {
          toast.success(`Email sent successfully to ${sent} donor(s)`);
        }
        
        if (failed > 0) {
          toast.error(`Failed to send ${failed} email(s). Check console for details.`);
          console.error('Email errors:', errors);
        }

        // Reset form
        setSelectedDonors([]);
        setCustomSubject('');
        setCustomMessage('');
        setSelectedTemplate('');
        
        // Refresh email history
        await fetchEmailHistory();
      }
    } catch (error: any) {
      console.error('Error sending emails:', error);
      toast.error(error.response?.data?.message || 'Failed to send emails');
    }
  };

  const getTemplateContent = () => {
    const template = emailTemplates.find(t => t.id === selectedTemplate);
    return template || null;
  };

  const handleViewRecipients = async (emailId: string) => {
    try {
      const response = await emailAPI.getHistoryById(emailId);
      if (response.data.success) {
        setSelectedEmailHistory(response.data.data);
        setShowRecipientsDialog(true);
      }
    } catch (error: any) {
      console.error('Error fetching email details:', error);
      toast.error('Failed to load email details');
    }
  };

  const getTemplateName = (templateType: string | null) => {
    if (!templateType) return 'Custom Message';
    const template = emailTemplates.find(t => t.id === templateType);
    return template ? template.name : 'Custom Message';
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>Email Notifications</h1>
          <p className="text-muted-foreground">Send emails to donors for appreciation or urgent requests</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700">
          <FileText className="h-4 w-4 mr-2" />
          View Email History
        </Button>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose">Compose Email</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="history">Sent Emails</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Email Composition */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compose Email</CardTitle>
                  <CardDescription>Create and send emails to selected donors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Template</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template or write custom message" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="appreciation">Thank You for Donating</SelectItem>
                        <SelectItem value="shortage">Urgent Blood Needed</SelectItem>
                        <SelectItem value="appointment">Appointment Reminder</SelectItem>
                        <SelectItem value="custom">Custom Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <>
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                          placeholder="Email subject"
                          value={selectedTemplate === 'custom' ? customSubject : getTemplateContent()?.subject || ''}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          disabled={selectedTemplate !== 'custom'}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                          placeholder="Email message"
                          rows={12}
                          value={selectedTemplate === 'custom' ? customMessage : getTemplateContent()?.body || ''}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          disabled={selectedTemplate !== 'custom'}
                        />
                        {selectedTemplate !== 'custom' && (
                          <p className="text-sm text-muted-foreground">
                            Variables like [Donor Name], [Date], [Blood Type] will be automatically replaced
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          {selectedDonors.length} donor(s) selected
                        </div>
                        <Button
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => setShowConfirmDialog(true)}
                          disabled={selectedDonors.length === 0}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Email
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Donor Selection */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Recipients</CardTitle>
                  <CardDescription>Choose donors to receive email</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Filter by</Label>
                    <Select value={filterBloodType} onValueChange={setFilterBloodType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All donors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Donors</SelectItem>
                        <SelectItem value="eligible">Eligible Donors Only</SelectItem>
                        {bloodTypes.map(type => (
                          <SelectItem key={type} value={type}>{type} Donors</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedDonors.length === filteredDonors.length && filteredDonors.length > 0}
                        onCheckedChange={handleSelectAllDonors}
                      />
                      <span className="text-sm">Select All</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{filteredDonors.length} donors</span>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Loading donors...
                      </div>
                    ) : filteredDonors.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No donors found. Register donors in the Donor Management section.
                      </div>
                    ) : (
                      filteredDonors.map((donor) => (
                        <div key={donor.id} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded">
                          <Checkbox
                            checked={selectedDonors.includes(donor.id)}
                            onCheckedChange={() => handleToggleDonor(donor.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{donor.name}</p>
                              <Badge variant="outline" className="text-xs font-mono">{donor.bloodType}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{donor.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {donor.eligible ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Eligible</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Not Eligible</Badge>
                              )}
                              {donor.lastDonation && (
                                <span className="text-xs text-muted-foreground">
                                  Last: {donor.lastDonation}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Heart className="h-4 w-4 mr-2 text-red-600" />
                    Send Appreciation (Recent Donors)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                    Send Shortage Alert (O-)
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    Send Appointment Reminders
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {emailTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground line-clamp-6">
                      {template.body}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        // Switch to compose tab
                        const composeTrigger = document.querySelector('[value="compose"]') as HTMLElement;
                        composeTrigger?.click();
                      }}
                    >
                      Use This Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Sent Emails</CardTitle>
              <CardDescription>History of emails sent to donors</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading email history...
                </div>
              ) : emailHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No email history found. Send your first email to see it here.
                </div>
              ) : (
                <div className="space-y-3">
                  {emailHistory.map((email) => (
                    <div key={email.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{getTemplateName(email.template_type)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(email.createdAt).toLocaleDateString()} • {email.recipient_count} recipient(s)
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          Subject: {email.subject}
                        </p>
                        {email.failed_count > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            {email.failed_count} failed to send
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={email.sent_count > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {email.sent_count} sent
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewRecipients(email.id)}
                        >
                          View Recipients
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recipients Dialog */}
      <Dialog open={showRecipientsDialog} onOpenChange={setShowRecipientsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Recipients</DialogTitle>
            <DialogDescription>
              {selectedEmailHistory && (
                <>
                  {getTemplateName(selectedEmailHistory.template_type)} - {new Date(selectedEmailHistory.createdAt).toLocaleString()}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedEmailHistory && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Subject:</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedEmailHistory.subject}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold">Recipients ({selectedEmailHistory.recipient_count}):</Label>
                <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
                  {selectedEmailHistory.recipients && selectedEmailHistory.recipients.length > 0 ? (
                    selectedEmailHistory.recipients.map((recipient: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{recipient.donorName}</p>
                          <p className="text-xs text-muted-foreground">{recipient.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs font-mono">{recipient.bloodType}</Badge>
                            {recipient.status === 'sent' ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">Sent</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 text-xs">Failed</Badge>
                            )}
                          </div>
                          {recipient.error && (
                            <p className="text-xs text-red-600 mt-1">{recipient.error}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No recipients found</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send Email</DialogTitle>
            <DialogDescription>
              Are you sure you want to send this email to {selectedDonors.length} donor(s)?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm"><strong>Subject:</strong> {selectedTemplate === 'custom' ? customSubject : getTemplateContent()?.subject}</p>
              <p className="text-sm mt-2"><strong>Recipients:</strong> {selectedDonors.length} donor(s)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleSendEmails}>
              <Send className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
