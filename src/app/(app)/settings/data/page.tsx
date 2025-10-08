'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Shield, 
  Download, 
  Trash2, 
  Settings as SettingsIcon,
  CheckCircle,
  Info,
  FileText,
  BarChart3,
  Users,
  Calendar,
  MapPin,
  CreditCard,
  MessageSquare
} from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings } from '@/lib/user-settings-service';

export default function DataSharingSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('Settings');
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        description: 'Failed to load data sharing settings'
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
          description: 'Data sharing settings saved successfully'
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
        description: 'Failed to save data sharing settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateDataSharingSetting = (field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.privacy.dataSharing as any)[field] = value;
    setSettings(newSettings);
  };

  const handleDataExport = async () => {
    try {
      setExporting(true);
      // TODO: Implement data export logic
      toast({
        title: 'Data Export Started',
        description: 'Your data export has been initiated. You will receive an email when it\'s ready for download.'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to export data'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleDataDeletion = async () => {
    if (!window.confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      // TODO: Implement data deletion logic
      toast({
        title: 'Data Deletion Requested',
        description: 'Your data deletion request has been submitted. You will receive an email confirmation.'
      });
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete data'
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Data Sharing & Privacy</h1>
            <p className="text-muted-foreground">Loading your data sharing preferences...</p>
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
            <h1 className="text-3xl font-bold">Data Sharing & Privacy</h1>
            <p className="text-muted-foreground">Failed to load data sharing settings</p>
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
            <Database className="h-8 w-8" />
            Data Sharing & Privacy
          </h1>
          <p className="text-muted-foreground">
            Control how your data is used and shared
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Data Collection Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Data Collection Overview
            </CardTitle>
            <CardDescription>
              What data we collect and how we use it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Personal Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Name, email, phone number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Location and address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Date of birth and preferences</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Activity Data</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Messages and communications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Booking history and preferences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment information (encrypted)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Sharing Preferences
            </CardTitle>
            <CardDescription>
              Control how your data is shared with third parties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-analytics">Share Analytics Data</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to use your data for improving our services
                </p>
              </div>
              <Switch
                id="share-analytics"
                checked={settings.privacy.dataSharing.shareWithAnalytics}
                onCheckedChange={(checked) => updateDataSharingSetting('shareWithAnalytics', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-marketing">Share Marketing Data</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to use your data for marketing purposes
                </p>
              </div>
              <Switch
                id="share-marketing"
                checked={settings.privacy.dataSharing.shareWithMarketing}
                onCheckedChange={(checked) => updateDataSharingSetting('shareWithMarketing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-third-party">Share with Third Parties</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to share your data with trusted partners
                </p>
              </div>
              <Switch
                id="share-third-party"
                checked={settings.privacy.dataSharing.shareWithThirdParties}
                onCheckedChange={(checked) => updateDataSharingSetting('shareWithThirdParties', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-partners">Share with Partners</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to share your data with trusted business partners
                </p>
              </div>
              <Switch
                id="share-partners"
                checked={settings.privacy.dataSharing.shareWithPartners}
                onCheckedChange={(checked) => updateDataSharingSetting('shareWithPartners', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-advertisers">Share with Advertisers</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to share your data with advertisers for targeted ads
                </p>
              </div>
              <Switch
                id="share-advertisers"
                checked={settings.privacy.dataSharing.shareWithAdvertisers}
                onCheckedChange={(checked) => updateDataSharingSetting('shareWithAdvertisers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing-consent">Marketing Consent</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to use your data for marketing communications
                </p>
              </div>
              <Switch
                id="marketing-consent"
                checked={settings.privacy.dataSharing.marketingConsent}
                onCheckedChange={(checked) => updateDataSharingSetting('marketingConsent', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="cookies-consent">Cookies Consent</Label>
                <p className="text-sm text-muted-foreground">
                  Allow us to use cookies for analytics and personalization
                </p>
              </div>
              <Switch
                id="cookies-consent"
                checked={settings.privacy.dataSharing.cookiesConsent}
                onCheckedChange={(checked) => updateDataSharingSetting('cookiesConsent', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Access & Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Data Access & Control
            </CardTitle>
            <CardDescription>
              Manage your data and privacy rights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Export Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of all your data
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleDataExport}
                  disabled={exporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export Data'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Delete Your Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete all your data
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDataDeletion}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Data'}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Your Rights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span><strong>Right to Access:</strong> You can request a copy of your data</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span><strong>Right to Rectification:</strong> You can correct inaccurate data</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span><strong>Right to Erasure:</strong> You can request data deletion</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span><strong>Right to Portability:</strong> You can transfer your data</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span><strong>Right to Object:</strong> You can object to data processing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Security
            </CardTitle>
            <CardDescription>
              How we protect your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard encryption.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Access Control:</strong> Only authorized personnel can access your data, and all access is logged.
                </AlertDescription>
              </Alert>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Regular Audits:</strong> We regularly audit our security practices and update our systems.
                </AlertDescription>
              </Alert>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Compliance:</strong> We comply with relevant data protection regulations including GDPR and CCPA.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Data Usage Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Your Data Usage
            </CardTitle>
            <CardDescription>
              Overview of your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-muted-foreground">Data Points Collected</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">3</div>
                <div className="text-sm text-muted-foreground">Sharing Options Enabled</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">2</div>
                <div className="text-sm text-muted-foreground">Sharing Options Disabled</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Policy & Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Privacy Policy & Terms
            </CardTitle>
            <CardDescription>
              Important legal information about your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Privacy Policy</h4>
                  <p className="text-sm text-muted-foreground">
                    Read our complete privacy policy
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Policy
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Terms of Service</h4>
                  <p className="text-sm text-muted-foreground">
                    Read our terms of service
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Terms
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Cookie Policy</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn about our cookie usage
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Policy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
