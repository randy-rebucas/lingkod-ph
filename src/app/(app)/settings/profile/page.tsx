'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Star, 
  Search,
  MessageSquare,
  Shield,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon,
  Globe,
  Lock
} from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings } from '@/lib/user-settings-service';

export default function ProfileVisibilitySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('ProfileVisibilitySettings');
  
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
      const defaultSettings = await getUserSettings(user!.uid);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load profile visibility settings'
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
          description: 'Profile visibility settings saved successfully'
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
        description: 'Failed to save profile visibility settings'
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

  const getVisibilityIcon = (isVisible: boolean) => {
    return isVisible ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-gray-400" />;
  };

  const getVisibilityBadge = (isVisible: boolean) => {
    return isVisible ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <Globe className="h-3 w-3 mr-1" />
        Public
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600 border-gray-600">
        <Lock className="h-3 w-3 mr-1" />
        Private
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Profile Visibility</h1>
            <p className="text-muted-foreground">Loading your profile visibility settings...</p>
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
            <h1 className="text-3xl font-bold">Profile Visibility</h1>
            <p className="text-muted-foreground">Failed to load profile visibility settings</p>
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
            <Eye className="h-8 w-8" />
            Profile Visibility
          </h1>
          <p className="text-muted-foreground">
            Control what information is visible to other users
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Overview
            </CardTitle>
            <CardDescription>
              Your current profile visibility status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getVisibilityIcon(settings.privacy.profile.profilePublic)}
                <div>
                  <h3 className="font-medium">Profile Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {settings.privacy.profile.profilePublic 
                      ? 'Your profile is visible to other users' 
                      : 'Your profile is private and not visible to other users'
                    }
                  </p>
                </div>
              </div>
              {getVisibilityBadge(settings.privacy.profile.profilePublic)}
            </div>
          </CardContent>
        </Card>

        {/* Main Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Profile Visibility Settings
            </CardTitle>
            <CardDescription>
              Control what information is visible to other users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="profile-public">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Make your profile visible to other users
                </p>
              </div>
              <Switch
                id="profile-public"
                checked={settings.privacy.profile.profilePublic}
                onCheckedChange={(checked) => updateProfileSetting('profilePublic', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Show Full Name
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your full name on your profile
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(settings.privacy.profile.showFullName)}
                  <Switch
                    checked={settings.privacy.profile.showFullName}
                    onCheckedChange={(checked) => updateProfileSetting('showFullName', checked)}
                    disabled={!settings.privacy.profile.profilePublic}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Show Email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email address on your profile
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(settings.privacy.profile.showEmail)}
                  <Switch
                    checked={settings.privacy.profile.showEmail}
                    onCheckedChange={(checked) => updateProfileSetting('showEmail', checked)}
                    disabled={!settings.privacy.profile.profilePublic}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Show Phone
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your phone number on your profile
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(settings.privacy.profile.showPhone)}
                  <Switch
                    checked={settings.privacy.profile.showPhone}
                    onCheckedChange={(checked) => updateProfileSetting('showPhone', checked)}
                    disabled={!settings.privacy.profile.profilePublic}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Show Location
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your location on your profile
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(settings.privacy.profile.showLocation)}
                  <Switch
                    checked={settings.privacy.profile.showLocation}
                    onCheckedChange={(checked) => updateProfileSetting('showLocation', checked)}
                    disabled={!settings.privacy.profile.profilePublic}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Show Services
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your services on your profile
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(settings.privacy.profile.showServices)}
                  <Switch
                    checked={settings.privacy.profile.showServices}
                    onCheckedChange={(checked) => updateProfileSetting('showServices', checked)}
                    disabled={!settings.privacy.profile.profilePublic}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Show Reviews
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display reviews on your profile
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(settings.privacy.profile.showReviews)}
                  <Switch
                    checked={settings.privacy.profile.showReviews}
                    onCheckedChange={(checked) => updateProfileSetting('showReviews', checked)}
                    disabled={!settings.privacy.profile.profilePublic}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Show Bookings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your booking history on your profile
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(settings.privacy.profile.showBookings)}
                  <Switch
                    checked={settings.privacy.profile.showBookings}
                    onCheckedChange={(checked) => updateProfileSetting('showBookings', checked)}
                    disabled={!settings.privacy.profile.profilePublic}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    Show Earnings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your earnings information on your profile
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getVisibilityIcon(settings.privacy.profile.showEarnings)}
                  <Switch
                    checked={settings.privacy.profile.showEarnings}
                    onCheckedChange={(checked) => updateProfileSetting('showEarnings', checked)}
                    disabled={!settings.privacy.profile.profilePublic}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Discovery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Discovery
            </CardTitle>
            <CardDescription>
              Control how others can find and discover your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-search">Allow Search</Label>
                <p className="text-sm text-muted-foreground">
                  Allow your profile to appear in search results
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getVisibilityIcon(settings.privacy.profile.allowSearch)}
                <Switch
                  id="allow-search"
                  checked={settings.privacy.profile.allowSearch}
                  onCheckedChange={(checked) => updateProfileSetting('allowSearch', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-direct-contact">Allow Direct Contact</Label>
                <p className="text-sm text-muted-foreground">
                  Allow other users to contact you directly
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getVisibilityIcon(settings.privacy.profile.allowDirectContact)}
                <Switch
                  id="allow-direct-contact"
                  checked={settings.privacy.profile.allowDirectContact}
                  onCheckedChange={(checked) => updateProfileSetting('allowDirectContact', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Tips
            </CardTitle>
            <CardDescription>
              Best practices for maintaining your privacy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Keep your profile public</strong> to help clients find and book your services. You can still control which specific information is visible.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Be careful with personal information</strong> like your email and phone number. Only share what you're comfortable with.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Show your services and reviews</strong> to build trust with potential clients and increase your bookings.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Consider hiding earnings information</strong> to maintain privacy about your income.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Profile Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Profile Preview
            </CardTitle>
            <CardDescription>
              See how your profile appears to other users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {settings.privacy.profile.showFullName ? 'John Doe' : 'User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {settings.privacy.profile.showLocation ? 'Manila, Philippines' : 'Location hidden'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {settings.privacy.profile.showEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>john.doe@example.com</span>
                    </div>
                  )}
                  
                  {settings.privacy.profile.showPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+63 912 345 6789</span>
                    </div>
                  )}

                  {settings.privacy.profile.showServices && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      <span>House Cleaning, Gardening, Plumbing</span>
                    </div>
                  )}

                  {settings.privacy.profile.showReviews && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>4.8/5 (24 reviews)</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {settings.privacy.profile.allowDirectContact && (
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
