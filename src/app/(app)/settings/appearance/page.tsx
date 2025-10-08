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
  Palette, 
  Globe, 
  Monitor, 
  Moon, 
  Sun, 
  Settings as SettingsIcon,
  Type,
  Eye,
  MousePointer,
  Languages,
  Calendar,
  Clock,
  DollarSign,
  Hash,
  Compass,
  HelpCircle
} from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings } from '@/lib/user-settings-service';

export default function AppearanceSettingsPage() {
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
        description: 'Failed to load appearance settings'
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
          description: 'Appearance settings saved successfully'
        });
        // Apply theme changes immediately
        applyThemeChanges();
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
        description: 'Failed to save appearance settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateAppearanceSetting = (type: 'theme' | 'language', field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.appearance[type] as any)[field] = value;
    setSettings(newSettings);
  };

  const applyThemeChanges = () => {
    if (!settings) return;

    // Apply theme to document
    const root = document.documentElement;
    const theme = settings.appearance.theme.theme;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Apply new theme
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'system') {
      // Use system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    }

    // Apply custom colors
    if (settings.appearance.theme.primaryColor) {
      root.style.setProperty('--primary', settings.appearance.theme.primaryColor);
    }
    if (settings.appearance.theme.accentColor) {
      root.style.setProperty('--accent', settings.appearance.theme.accentColor);
    }

    // Apply font size
    const fontSize = settings.appearance.theme.fontSize;
    if (fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '18px';
    } else {
      root.style.fontSize = '16px';
    }

    // Apply high contrast
    if (settings.appearance.theme.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (settings.appearance.theme.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  };

  const previewTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Appearance Settings</h1>
            <p className="text-muted-foreground">Loading your appearance preferences...</p>
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
            <h1 className="text-3xl font-bold">Appearance Settings</h1>
            <p className="text-muted-foreground">Failed to load appearance settings</p>
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
            <Palette className="h-8 w-8" />
            Appearance & Language
          </h1>
          <p className="text-muted-foreground">
            Customize your interface and language preferences
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme & Colors
            </CardTitle>
            <CardDescription>
              Customize the appearance of your interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.appearance.theme.theme}
                onValueChange={(value) => {
                  updateAppearanceSetting('theme', 'theme', value);
                  previewTheme(value as any);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={settings.appearance.theme.primaryColor}
                    onChange={(e) => updateAppearanceSetting('theme', 'primaryColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={settings.appearance.theme.primaryColor}
                    onChange={(e) => updateAppearanceSetting('theme', 'primaryColor', e.target.value)}
                    placeholder="#059669"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent-color"
                    type="color"
                    value={settings.appearance.theme.accentColor}
                    onChange={(e) => updateAppearanceSetting('theme', 'accentColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={settings.appearance.theme.accentColor}
                    onChange={(e) => updateAppearanceSetting('theme', 'accentColor', e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Select
                value={settings.appearance.theme.fontSize}
                onValueChange={(value) => updateAppearanceSetting('theme', 'fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Adjust the size of text throughout the interface
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select
                value={settings.appearance.theme.fontFamily}
                onValueChange={(value) => updateAppearanceSetting('theme', 'fontFamily', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Default</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your preferred font family
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase contrast for better readability
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.appearance.theme.highContrast}
                  onCheckedChange={(checked) => updateAppearanceSetting('theme', 'highContrast', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reduced-motion">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">
                    Minimize animations and transitions
                  </p>
                </div>
                <Switch
                  id="reduced-motion"
                  checked={settings.appearance.theme.reducedMotion}
                  onCheckedChange={(checked) => updateAppearanceSetting('theme', 'reducedMotion', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
            <CardDescription>
              Set your language and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.appearance.language.language}
                onValueChange={(value) => updateAppearanceSetting('language', 'language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tl">Tagalog</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                  <SelectItem value="ko">한국어</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your preferred language
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <Select
                value={settings.appearance.language.dateFormat}
                onValueChange={(value) => updateAppearanceSetting('language', 'dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How dates are displayed throughout the app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-format">Time Format</Label>
              <Select
                value={settings.appearance.language.timeFormat}
                onValueChange={(value) => updateAppearanceSetting('language', 'timeFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How times are displayed throughout the app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.appearance.language.timezone}
                onValueChange={(value) => updateAppearanceSetting('language', 'timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asia/Manila">Asia/Manila (GMT+8)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                  <SelectItem value="Australia/Sydney">Australia/Sydney (GMT+10)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Your local timezone for accurate time display
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={settings.appearance.language.currency}
                onValueChange={(value) => updateAppearanceSetting('language', 'currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHP">Philippine Peso (₱)</SelectItem>
                  <SelectItem value="USD">US Dollar ($)</SelectItem>
                  <SelectItem value="EUR">Euro (€)</SelectItem>
                  <SelectItem value="GBP">British Pound (£)</SelectItem>
                  <SelectItem value="JPY">Japanese Yen (¥)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Default currency for prices and payments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number-format">Number Format</Label>
              <Select
                value={settings.appearance.language.numberFormat}
                onValueChange={(value) => updateAppearanceSetting('language', 'numberFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">US Format (1,234.56)</SelectItem>
                  <SelectItem value="EU">EU Format (1.234,56)</SelectItem>
                  <SelectItem value="IN">Indian Format (1,23,456.78)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How numbers are formatted throughout the app
              </p>
            </div>
          </CardContent>
        </Card>


        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview
            </CardTitle>
            <CardDescription>
              See how your settings will look
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-card">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Sample Content</h3>
                <p className="text-muted-foreground">
                  This is how your interface will look with the current settings.
                </p>
                <div className="flex gap-2">
                  <Button size="sm">Primary Button</Button>
                  <Button variant="outline" size="sm">Secondary Button</Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Date: {new Date().toLocaleDateString()}<br />
                  Time: {new Date().toLocaleTimeString()}<br />
                  Price: ₱1,234.56
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
