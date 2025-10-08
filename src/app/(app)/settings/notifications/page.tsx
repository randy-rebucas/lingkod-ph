'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  AlertCircle, 
  Phone,
  Send,
  Shield,
  MessageSquare,
  Star,
  Briefcase,
  CreditCard,
  User,
  Settings as SettingsIcon
} from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings, sendPhoneVerificationCode, verifyPhoneNumber } from '@/lib/user-settings-service';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const _t = useTranslations('Settings');
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // This would typically call the UserSettingsService
      // For now, we'll use default settings
      const defaultSettings = await getUserSettings(user!.uid);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notification settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !user) return;
    
    try {
      setSaving(true);
      const result = await updateUserSettings(user.uid, settings);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Notification settings saved successfully'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to save settings'
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save notification settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = (type: 'email' | 'sms' | 'inApp' | 'push', field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.notifications[type] as any)[field] = value;
    setSettings(newSettings);
  };

  const handlePhoneVerification = async () => {
    if (!phoneNumber) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a phone number'
      });
      return;
    }

    try {
      setVerifyingPhone(true);
      const result = await sendPhoneVerificationCode(user!.uid, phoneNumber);
      
      if (result.success) {
        setShowPhoneVerification(true);
        toast({
          title: 'Verification Code Sent',
          description: 'Please check your phone for the verification code'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to send verification code'
        });
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send verification code'
      });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter the verification code'
      });
      return;
    }

    try {
      setVerifyingPhone(true);
      const result = await verifyPhoneNumber(user!.uid, phoneNumber, verificationCode);
      
      if (result.success) {
        setShowPhoneVerification(false);
        setVerificationCode('');
        setPhoneNumber('');
        await loadSettings(); // Reload settings to show verified status
        toast({
          title: 'Phone Verified',
          description: 'Your phone number has been verified successfully'
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Invalid verification code'
        });
      }
    } catch (error) {
      console.error('Error verifying phone:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to verify phone number'
      });
    } finally {
      setVerifyingPhone(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Notification Settings</h1>
            <p className="text-muted-foreground">Loading your notification preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Notification Settings</h1>
            <p className="text-muted-foreground">Failed to load notification settings</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notification Settings
          </h1>
          <p className="text-muted-foreground">
            Manage how and when you receive notifications
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Control which email notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-enabled">Enable Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={settings.notifications.email.enabled}
                onCheckedChange={(checked) => updateNotificationSetting('email', 'enabled', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Booking Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about booking status changes
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email.bookingUpdates}
                  onCheckedChange={(checked) => updateNotificationSetting('email', 'bookingUpdates', checked)}
                  disabled={!settings.notifications.email.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about payment status and transactions
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email.paymentUpdates}
                  onCheckedChange={(checked) => updateNotificationSetting('email', 'paymentUpdates', checked)}
                  disabled={!settings.notifications.email.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about your account status and verification
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email.accountUpdates}
                  onCheckedChange={(checked) => updateNotificationSetting('email', 'accountUpdates', checked)}
                  disabled={!settings.notifications.email.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    New Messages
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications for new messages from other users
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email.newMessages}
                  onCheckedChange={(checked) => updateNotificationSetting('email', 'newMessages', checked)}
                  disabled={!settings.notifications.email.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    New Reviews
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications when you receive new reviews
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email.newReviews}
                  onCheckedChange={(checked) => updateNotificationSetting('email', 'newReviews', checked)}
                  disabled={!settings.notifications.email.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    System Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Platform updates and maintenance notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email.systemUpdates}
                  onCheckedChange={(checked) => updateNotificationSetting('email', 'systemUpdates', checked)}
                  disabled={!settings.notifications.email.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security Alerts
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Important security notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email.securityAlerts}
                  onCheckedChange={(checked) => updateNotificationSetting('email', 'securityAlerts', checked)}
                  disabled={!settings.notifications.email.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promotional Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Promotional content and feature announcements
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email.promotionalEmails}
                  onCheckedChange={(checked) => updateNotificationSetting('email', 'promotionalEmails', checked)}
                  disabled={!settings.notifications.email.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Control SMS notifications sent to your phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sms-enabled">Enable SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via SMS
                </p>
              </div>
              <Switch
                id="sms-enabled"
                checked={settings.notifications.sms.enabled}
                onCheckedChange={(checked) => updateNotificationSetting('sms', 'enabled', checked)}
              />
            </div>

            {settings.notifications.sms.enabled && (
              <>
                <Separator />
                
                {!settings.notifications.sms.phoneVerified ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Phone number verification required for SMS notifications.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Phone number verified: {settings.notifications.sms.phoneNumber}
                    </AlertDescription>
                  </Alert>
                )}

                {!showPhoneVerification ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-number">Phone Number</Label>
                      <div className="flex gap-2">
                        <Input
                          id="phone-number"
                          type="tel"
                          placeholder="+63 912 345 6789"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <Button 
                          onClick={handlePhoneVerification}
                          disabled={verifyingPhone || !phoneNumber}
                          size="sm"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter your phone number to receive SMS notifications
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="verification-code">Verification Code</Label>
                      <div className="flex gap-2">
                        <Input
                          id="verification-code"
                          type="text"
                          placeholder="123456"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                        />
                        <Button 
                          onClick={handleVerifyCode}
                          disabled={verifyingPhone || !verificationCode}
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code sent to your phone
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Updates
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        SMS notifications for payment status
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms.paymentUpdates}
                      onCheckedChange={(checked) => updateNotificationSetting('sms', 'paymentUpdates', checked)}
                      disabled={!settings.notifications.sms.enabled || !settings.notifications.sms.phoneVerified}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Important security notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms.systemAlerts}
                      onCheckedChange={(checked) => updateNotificationSetting('sms', 'systemAlerts', checked)}
                      disabled={!settings.notifications.sms.enabled || !settings.notifications.sms.phoneVerified}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Verification Codes
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        SMS verification codes for account security
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms.verificationCodes}
                      onCheckedChange={(checked) => updateNotificationSetting('sms', 'verificationCodes', checked)}
                      disabled={!settings.notifications.sms.enabled || !settings.notifications.sms.phoneVerified}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Booking Reminders
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        SMS reminders for upcoming bookings
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms.bookingReminders}
                      onCheckedChange={(checked) => updateNotificationSetting('sms', 'bookingReminders', checked)}
                      disabled={!settings.notifications.sms.enabled || !settings.notifications.sms.phoneVerified}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Urgent Notifications Only</Label>
                      <p className="text-sm text-muted-foreground">
                        Only receive urgent SMS notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms.urgentOnly}
                      onCheckedChange={(checked) => updateNotificationSetting('sms', 'urgentOnly', checked)}
                      disabled={!settings.notifications.sms.enabled || !settings.notifications.sms.phoneVerified}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* In-App Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              In-App Notifications
            </CardTitle>
            <CardDescription>
              Control notifications within the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inapp-enabled">Enable In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications in the application
                </p>
              </div>
              <Switch
                id="inapp-enabled"
                checked={settings.notifications.inApp.enabled}
                onCheckedChange={(checked) => updateNotificationSetting('inApp', 'enabled', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Notification Sound
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound when receiving notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.inApp.soundEnabled}
                  onCheckedChange={(checked) => updateNotificationSetting('inApp', 'soundEnabled', checked)}
                  disabled={!settings.notifications.inApp.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <VolumeX className="h-4 w-4" />
                    Vibration
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Vibrate device when receiving notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.inApp.vibrationEnabled}
                  onCheckedChange={(checked) => updateNotificationSetting('inApp', 'vibrationEnabled', checked)}
                  disabled={!settings.notifications.inApp.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Frequency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Frequency & Timing
            </CardTitle>
            <CardDescription>
              Control when and how often you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="digest-frequency">Email Digest Frequency</Label>
              <Select
                value={settings.notifications.frequency.digestEmails}
                onValueChange={(value) => {
                  if (!settings) return;
                  const newSettings = { ...settings };
                  newSettings.notifications.frequency.digestEmails = value as any;
                  setSettings(newSettings);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often to receive summary emails of your notifications
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms-frequency">SMS Frequency</Label>
              <Select
                value={settings.notifications.frequency.smsFrequency}
                onValueChange={(value) => {
                  if (!settings) return;
                  const newSettings = { ...settings };
                  newSettings.notifications.frequency.smsFrequency = value as any;
                  setSettings(newSettings);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly Digest</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often to receive SMS notifications
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-sms">Maximum SMS per Day</Label>
              <Select
                value={settings.notifications.frequency.maxSMSPerDay.toString()}
                onValueChange={(value) => {
                  if (!settings) return;
                  const newSettings = { ...settings };
                  newSettings.notifications.frequency.maxSMSPerDay = parseInt(value);
                  setSettings(newSettings);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 SMS per day</SelectItem>
                  <SelectItem value="10">10 SMS per day</SelectItem>
                  <SelectItem value="20">20 SMS per day</SelectItem>
                  <SelectItem value="50">50 SMS per day</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Limit the number of SMS notifications per day
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}