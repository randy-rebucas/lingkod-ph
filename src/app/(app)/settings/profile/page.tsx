'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings } from '@/lib/user-settings-service';
import { useRouter } from 'next/navigation';  
export default function ProfileVisibilitySettingsPage() {
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
        description: 'Failed to load profile settings'
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
        description: 'Profile settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save profile settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateProfileSetting = (field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.privacy.profile as any)[field] = value;
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
          <p className="text-muted-foreground mb-4">There was an error loading your profile settings.</p>
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
              Profile Visibility
            </h1>
            <p className="text-muted-foreground">
              Manage what others can see about you
            </p>
          </div>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Control what information is visible on your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to view your profile
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.profilePublic}
              onCheckedChange={(checked) => updateProfileSetting('profilePublic', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Full Name</Label>
              <p className="text-sm text-muted-foreground">
                Display your full name on your profile
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.showFullName}
              onCheckedChange={(checked) => updateProfileSetting('showFullName', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Email</Label>
              <p className="text-sm text-muted-foreground">
                Display your email address on your profile
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.showEmail}
              onCheckedChange={(checked) => updateProfileSetting('showEmail', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Phone</Label>
              <p className="text-sm text-muted-foreground">
                Display your phone number on your profile
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.showPhone}
              onCheckedChange={(checked) => updateProfileSetting('showPhone', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Location</Label>
              <p className="text-sm text-muted-foreground">
                Display your location on your profile
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.showLocation}
              onCheckedChange={(checked) => updateProfileSetting('showLocation', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Services & Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Services & Reviews
          </CardTitle>
          <CardDescription>
            Control visibility of your services and reviews
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Services</Label>
              <p className="text-sm text-muted-foreground">
                Display your services on your profile
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.showServices}
              onCheckedChange={(checked) => updateProfileSetting('showServices', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Reviews</Label>
              <p className="text-sm text-muted-foreground">
                Display reviews on your profile
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.showReviews}
              onCheckedChange={(checked) => updateProfileSetting('showReviews', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Search</Label>
              <p className="text-sm text-muted-foreground">
                Allow your profile to appear in search results
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.allowSearch}
              onCheckedChange={(checked) => updateProfileSetting('allowSearch', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}