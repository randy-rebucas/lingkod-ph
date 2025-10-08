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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Star, 
  MessageSquare,
  Clock,
  Users,
  Globe,
  Lock,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings } from '@/lib/user-settings-service';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('Settings');
  
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
      const result = await updateUserSettings(user.uid, settings);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Privacy settings saved successfully'
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
        description: 'Failed to save privacy settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePrivacySetting = (type: 'profile' | 'onlineStatus' | 'directMessages' | 'dataSharing', field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.privacy[type] as any)[field] = value;
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Privacy Settings</h1>
            <p className="text-muted-foreground">Loading your privacy preferences...</p>
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
            <h1 className="text-3xl font-bold">Privacy Settings</h1>
            <p className="text-muted-foreground">Failed to load privacy settings</p>
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
            <Shield className="h-8 w-8" />
            Privacy & Security
          </h1>
          <p className="text-muted-foreground">
            Control your privacy and security settings
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Profile Visibility
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
                onCheckedChange={(checked) => updatePrivacySetting('profile', 'profilePublic', checked)}
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
                <Switch
                  checked={settings.privacy.profile.showFullName}
                  onCheckedChange={(checked) => updatePrivacySetting('profile', 'showFullName', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
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
                <Switch
                  checked={settings.privacy.profile.showEmail}
                  onCheckedChange={(checked) => updatePrivacySetting('profile', 'showEmail', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
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
                <Switch
                  checked={settings.privacy.profile.showPhone}
                  onCheckedChange={(checked) => updatePrivacySetting('profile', 'showPhone', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
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
                <Switch
                  checked={settings.privacy.profile.showLocation}
                  onCheckedChange={(checked) => updatePrivacySetting('profile', 'showLocation', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
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
                <Switch
                  checked={settings.privacy.profile.showServices}
                  onCheckedChange={(checked) => updatePrivacySetting('profile', 'showServices', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
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
                <Switch
                  checked={settings.privacy.profile.showReviews}
                  onCheckedChange={(checked) => updatePrivacySetting('profile', 'showReviews', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
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
                  onCheckedChange={(checked) => updatePrivacySetting('profile', 'allowSearch', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Direct Contact</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow other users to contact you directly
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.profile.allowDirectContact}
                  onCheckedChange={(checked) => updatePrivacySetting('profile', 'allowDirectContact', checked)}
                  disabled={!settings.privacy.profile.profilePublic}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Online Status
            </CardTitle>
            <CardDescription>
              Control your online presence and activity status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-online">Show Online Status</Label>
                <p className="text-sm text-muted-foreground">
                  Display when you're online to other users
                </p>
              </div>
              <Switch
                id="show-online"
                checked={settings.privacy.onlineStatus.showOnlineStatus}
                onCheckedChange={(checked) => updatePrivacySetting('onlineStatus', 'showOnlineStatus', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-last-seen">Show Last Seen</Label>
                <p className="text-sm text-muted-foreground">
                  Display when you were last active
                </p>
              </div>
              <Switch
                id="show-last-seen"
                checked={settings.privacy.onlineStatus.showLastSeen}
                onCheckedChange={(checked) => updatePrivacySetting('onlineStatus', 'showLastSeen', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-typing">Show Typing Indicator</Label>
                <p className="text-sm text-muted-foreground">
                  Show when you're typing in messages
                </p>
              </div>
              <Switch
                id="show-typing"
                checked={settings.privacy.onlineStatus.showTypingIndicator}
                onCheckedChange={(checked) => updatePrivacySetting('onlineStatus', 'showTypingIndicator', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-away">Auto Away Timeout (minutes)</Label>
              <Select
                value={settings.privacy.onlineStatus.autoAwayTimeout.toString()}
                onValueChange={(value) => updatePrivacySetting('onlineStatus', 'autoAwayTimeout', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Automatically set status to away after this period of inactivity
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Direct Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages & Communication
            </CardTitle>
            <CardDescription>
              Control how others can contact you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-messages">Allow Direct Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Allow other users to send you direct messages
                </p>
              </div>
              <Switch
                id="allow-messages"
                checked={settings.privacy.directMessages.allowDirectMessages}
                onCheckedChange={(checked) => updatePrivacySetting('directMessages', 'allowDirectMessages', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-from">Allow Messages From</Label>
              <Select
                value={settings.privacy.directMessages.allowMessagesFrom}
                onValueChange={(value) => updatePrivacySetting('directMessages', 'allowMessagesFrom', value)}
                disabled={!settings.privacy.directMessages.allowDirectMessages}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="contacts">Contacts Only</SelectItem>
                  <SelectItem value="providers">Providers Only</SelectItem>
                  <SelectItem value="clients">Clients Only</SelectItem>
                  <SelectItem value="none">No One</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Control who can send you direct messages
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="group-messages">Allow Group Messages</Label>
                <p className="text-sm text-muted-foreground">
                  Allow participation in group conversations
                </p>
              </div>
              <Switch
                id="group-messages"
                checked={settings.privacy.directMessages.allowGroupMessages}
                onCheckedChange={(checked) => updatePrivacySetting('directMessages', 'allowGroupMessages', checked)}
                disabled={!settings.privacy.directMessages.allowDirectMessages}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="message-notifications">Message Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications for new messages
                </p>
              </div>
              <Switch
                id="message-notifications"
                checked={settings.privacy.directMessages.messageNotifications}
                onCheckedChange={(checked) => updatePrivacySetting('directMessages', 'messageNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="read-receipts">Read Receipts</Label>
                <p className="text-sm text-muted-foreground">
                  Show when you've read messages
                </p>
              </div>
              <Switch
                id="read-receipts"
                checked={settings.privacy.directMessages.readReceipts}
                onCheckedChange={(checked) => updatePrivacySetting('directMessages', 'readReceipts', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-retention">Message Retention</Label>
              <Select
                value={settings.privacy.directMessages.messageRetention}
                onValueChange={(value) => updatePrivacySetting('directMessages', 'messageRetention', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forever">Forever</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="1day">1 Day</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How long to keep message history
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Data Sharing & Privacy
            </CardTitle>
            <CardDescription>
              Control how your data is shared and used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                These settings control how your data is shared with third parties and used for analytics and marketing.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Share with Partners</Label>
                  <p className="text-sm text-muted-foreground">
                    Share data with trusted business partners
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing.shareWithPartners}
                  onCheckedChange={(checked) => updatePrivacySetting('dataSharing', 'shareWithPartners', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Share with Advertisers</Label>
                  <p className="text-sm text-muted-foreground">
                    Share data for targeted advertising
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing.shareWithAdvertisers}
                  onCheckedChange={(checked) => updatePrivacySetting('dataSharing', 'shareWithAdvertisers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Share with Analytics</Label>
                  <p className="text-sm text-muted-foreground">
                    Share data for analytics and improvement
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing.shareWithAnalytics}
                  onCheckedChange={(checked) => updatePrivacySetting('dataSharing', 'shareWithAnalytics', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Consent</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow use of data for marketing purposes
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing.marketingConsent}
                  onCheckedChange={(checked) => updatePrivacySetting('dataSharing', 'marketingConsent', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analytics Consent</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow use of data for analytics
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing.analyticsConsent}
                  onCheckedChange={(checked) => updatePrivacySetting('dataSharing', 'analyticsConsent', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cookies Consent</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow use of cookies for functionality
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing.cookiesConsent}
                  onCheckedChange={(checked) => updatePrivacySetting('dataSharing', 'cookiesConsent', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Data Export</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow exporting your personal data
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing.allowDataExport}
                  onCheckedChange={(checked) => updatePrivacySetting('dataSharing', 'allowDataExport', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Data Deletion</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow deletion of your personal data
                  </p>
                </div>
                <Switch
                  checked={settings.privacy.dataSharing.allowDataDeletion}
                  onCheckedChange={(checked) => updatePrivacySetting('dataSharing', 'allowDataDeletion', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
