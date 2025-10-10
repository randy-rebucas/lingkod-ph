'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MessageSquare, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings } from '@/lib/user-settings-service';
import { useRouter } from 'next/navigation';
export default function MessagesSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const userSettings = await getUserSettings(user!.uid);
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load message settings'
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user, loadSettings]);

  const saveSettings = async () => {
    if (!settings || !user) return;
    
    try {
      setSaving(true);
      await updateUserSettings(user.uid, settings);
      toast({
        title: 'Success',
        description: 'Message settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save message settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDirectMessageSetting = (field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.privacy.directMessages as any)[field] = value;
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
          <p className="text-muted-foreground mb-4">There was an error loading your message settings.</p>
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
              Messages & Communication
            </h1>
            <p className="text-muted-foreground">
              Manage how others can contact you
            </p>
          </div>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Direct Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Direct Messages
          </CardTitle>
          <CardDescription>
            Control who can send you direct messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Direct Messages</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to send you direct messages
              </p>
            </div>
            <Switch
              checked={settings.privacy.directMessages.allowDirectMessages}
              onCheckedChange={(checked) => updateDirectMessageSetting('allowDirectMessages', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Group Messages</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to add you to group messages
              </p>
            </div>
            <Switch
              checked={settings.privacy.directMessages.allowGroupMessages}
              onCheckedChange={(checked) => updateDirectMessageSetting('allowGroupMessages', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Message Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new messages
              </p>
            </div>
            <Switch
              checked={settings.privacy.directMessages.messageNotifications}
              onCheckedChange={(checked) => updateDirectMessageSetting('messageNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Message Filtering
          </CardTitle>
          <CardDescription>
            Control message content and filtering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Read Receipts</Label>
              <p className="text-sm text-muted-foreground">
                Show when you've read messages
              </p>
            </div>
            <Switch
              checked={settings.privacy.directMessages.readReceipts}
              onCheckedChange={(checked) => updateDirectMessageSetting('readReceipts', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}