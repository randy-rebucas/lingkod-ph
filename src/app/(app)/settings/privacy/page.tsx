'use client';

import React, { useState, useEffect } from 'react';
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
export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
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
        description: 'Failed to load privacy settings'
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
        description: 'Privacy settings saved successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save privacy settings'
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

  const updateDataSharingSetting = (field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.privacy.dataSharing as any)[field] = value;
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
          <p className="text-muted-foreground mb-4">There was an error loading your privacy settings.</p>
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
              Privacy & Security
            </h1>
            <p className="text-muted-foreground">
              Control your privacy and security settings
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
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile information
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
              <Label>Show Email</Label>
              <p className="text-sm text-muted-foreground">
                Display your email on your profile
              </p>
            </div>
            <Switch
              checked={settings.privacy.profile.showEmail}
              onCheckedChange={(checked) => updateProfileSetting('showEmail', checked)}
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


      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>
            Control how your data is used and shared
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Data Analytics</Label>
              <p className="text-sm text-muted-foreground">
                Allow us to use your data to improve our services
              </p>
            </div>
            <Switch
              checked={settings.privacy.dataSharing.shareWithAnalytics}
              onCheckedChange={(checked) => updateDataSharingSetting('shareWithAnalytics', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Communications</Label>
              <p className="text-sm text-muted-foreground">
                Receive promotional emails and updates
              </p>
            </div>
            <Switch
              checked={settings.privacy.dataSharing.marketingConsent}
              onCheckedChange={(checked) => updateDataSharingSetting('marketingConsent', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Share with Partners</Label>
              <p className="text-sm text-muted-foreground">
                Allow sharing data with trusted partners
              </p>
            </div>
            <Switch
              checked={settings.privacy.dataSharing.shareWithPartners}
              onCheckedChange={(checked) => updateDataSharingSetting('shareWithPartners', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}