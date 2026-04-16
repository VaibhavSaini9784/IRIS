import { useState } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '@/lib/api';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Phone,
  Mail,
  MessageSquare,
  HelpCircle,
  Save,
  LogOut
} from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Missing Information", description: "Please fill all password fields", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "New password and confirm password do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Password Too Short", description: "Password must be at least 6 characters long", variant: "destructive" });
      return;
    }

    try {
      const { data } = await api.post('/change-password', {
        currentPassword,
        newPassword
      });


      toast({
        title: "Password Updated ✅",
        description: data.message || "Your password has been changed successfully.",
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "Could not update password. Please check your current password.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitFeedback = () => {
    if (!feedbackMessage.trim()) {
      toast({
        title: "Empty Feedback",
        description: "Please enter your feedback message",
        variant: "destructive",
      });
      return;
    }

    // TODO: Replace with actual API call
    console.log('Submitting feedback:', feedbackMessage);

    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback. We'll review it shortly.",
    });

    setFeedbackMessage('');
  };

  const faqItems = [
    {
      question: "How do I reset a worker's attendance?",
      answer: "Contact your system administrator or use the 'Reset Attendance' option in the worker's profile."
    },
    {
      question: "What if the IRIS verification fails?",
      answer: "Ensure the worker ID is entered correctly. If the issue persists, check if the worker is registered in the IRIS database."
    },
    {
      question: "How can I generate attendance reports?",
      answer: "Use the Reports section in the main dashboard to generate daily, weekly, or monthly attendance reports."
    },
    {
      question: "What should I do if a worker's ID is not scanning?",
      answer: "Try manual entry of the ID number. If the problem continues, contact technical support."
    }
  ];

  return (
    <Layout title="Settings">
      <div className="space-y-6">
        {/* Profile Information */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <User size={20} />
              </div>
              <div>
                <CardTitle className="text-primary">Profile Information</CardTitle>
                <CardDescription>Your account details and role information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={user?.name || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user?.username || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input value={user?.id || ''} disabled className="bg-muted" />
              </div>
            </div>
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Profile information is managed by your system administrator.
                Contact IT support for any changes.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Lock size={20} />
              </div>
              <div>
                <CardTitle className="text-primary">Change Password</CardTitle>
                <CardDescription>Update your account password for security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword} className="bg-primary hover:bg-primary-hover text-primary-foreground">
              <Save className="mr-2 h-4 w-4" />
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* Contact Information & Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Us */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <Phone size={20} />
                </div>
                <div>
                  <CardTitle className="text-primary">Contact Support</CardTitle>
                  <CardDescription>Get help when you need it</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Technical Support</p>
                    <p className="text-sm text-muted-foreground">1800-123-4567 (Toll Free)</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@iris.gov.in</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <SettingsIcon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">System Admin</p>
                    <p className="text-sm text-muted-foreground">admin@mnrega.gov.in</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="p-3 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Support Hours:</strong><br />
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday: 9:00 AM - 2:00 PM<br />
                  Sunday: Emergency support only
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Form */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <CardTitle className="text-primary">Send Feedback</CardTitle>
                  <CardDescription>Help us improve the system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Tell us about your experience, suggestions, or report issues..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleSubmitFeedback} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground">
                <MessageSquare className="mr-2 h-4 w-4" />
                Submit Feedback
              </Button>

              <div className="p-3 bg-accent rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your feedback is important to us. We review all submissions and use them to improve the system.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <HelpCircle size={20} />
              </div>
              <div>
                <CardTitle className="text-primary">Frequently Asked Questions</CardTitle>
                <CardDescription>Common questions and their answers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg bg-accent/30">
                  <h4 className="font-medium text-foreground mb-2">{item.question}</h4>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card className="border-2 border-destructive/20 bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Sign Out</h3>
                <p className="text-sm text-muted-foreground">
                  Securely log out of the IRIS Recognition System
                </p>
              </div>
              <Button
                onClick={logout}
                variant="destructive"
                size="lg"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;