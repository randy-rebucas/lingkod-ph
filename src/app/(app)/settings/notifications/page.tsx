'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Smartphone, AlertCircle, ArrowLeft, Bell } from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings } from '@/lib/user-settings-service';

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const userSettings = await getUserSettings(user!.uid);
      setSettings(userSettings);
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
      await updateUserSettings(user.uid, settings);
      toast({
        title: 'Success',
        description: 'Notification settings saved successfully'
      });
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

  const updateSetting = (type: 'email' | 'sms' | 'inApp' | 'push', field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.notifications[type] as any)[field] = value;
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Failed to load settings</h3>
          <p className="text-muted-foreground mb-4">There was an error loading your notification settings.</p>
          <Button onClick={loadSettings}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Notification Settings
            </h1>
            <p className="text-muted-foreground">
              Manage how and when you receive notifications
            </p>
          </div>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive notifications via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={settings.notifications.email.enabled}
              onCheckedChange={(checked) => updateSetting('email', 'enabled', checked)}
            />
          </div>

          {settings.notifications.email.enabled && (
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Booking Updates</Label>
                <Switch
                  checked={settings.notifications.email.bookingUpdates}
                  onCheckedChange={(checked) => updateSetting('email', 'bookingUpdates', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Payment Updates</Label>
                <Switch
                  checked={settings.notifications.email.paymentUpdates}
                  onCheckedChange={(checked) => updateSetting('email', 'paymentUpdates', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">New Messages</Label>
                <Switch
                  checked={settings.notifications.email.newMessages}
                  onCheckedChange={(checked) => updateSetting('email', 'newMessages', checked)}
                />
              </div>
            </div>
          )}
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
            Receive notifications via SMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via SMS
              </p>
            </div>
            <Switch
              checked={settings.notifications.sms.enabled}
              onCheckedChange={(checked) => updateSetting('sms', 'enabled', checked)}
            />
          </div>

          {settings.notifications.sms.enabled && (
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Payment Updates</Label>
                <Switch
                  checked={settings.notifications.sms.paymentUpdates}
                  onCheckedChange={(checked) => updateSetting('sms', 'paymentUpdates', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">System Alerts</Label>
                <Switch
                  checked={settings.notifications.sms.systemAlerts}
                  onCheckedChange={(checked) => updateSetting('sms', 'systemAlerts', checked)}
                />
              </div>
            </div>
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
            Receive notifications while using the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications within the app
              </p>
            </div>
            <Switch
              checked={settings.notifications.inApp.enabled}
              onCheckedChange={(checked) => updateSetting('inApp', 'enabled', checked)}
            />
          </div>

          {settings.notifications.inApp.enabled && (
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Booking Updates</Label>
                <Switch
                  checked={settings.notifications.inApp.bookingUpdates}
                  onCheckedChange={(checked) => updateSetting('inApp', 'bookingUpdates', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">New Messages</Label>
                <Switch
                  checked={settings.notifications.inApp.newMessages}
                  onCheckedChange={(checked) => updateSetting('inApp', 'newMessages', checked)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}