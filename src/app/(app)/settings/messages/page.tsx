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
  MessageSquare, 
  UserMinus, 
  UserX,
  Shield, 
  Settings as SettingsIcon,
  AlertCircle,
  Filter
} from 'lucide-react';
import { UserSettings } from '@/types/user-settings';
import { getUserSettings, updateUserSettings } from '@/lib/user-settings-service';

export default function MessagesSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const _t = useTranslations('Settings');
  
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [restrictedUsers, setRestrictedUsers] = useState<string[]>([]);

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
      setBlockedUsers(defaultSettings.privacy.blockedUsers);
      setRestrictedUsers(defaultSettings.privacy.restrictedUsers);
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
  };

  const saveSettings = async () => {
    if (!settings || !user) return;
    
    try {
      setSaving(true);
      const updatedSettings = {
        ...settings,
        privacy: {
          ...settings.privacy,
          blockedUsers,
          restrictedUsers
        }
      };
      
      const result = await updateUserSettings(user.uid, updatedSettings);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Message settings saved successfully'
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
        description: 'Failed to save message settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateMessageSetting = (field: string, value: any) => {
    if (!settings) return;
    
    const newSettings = { ...settings };
    (newSettings.privacy.directMessages as any)[field] = value;
    setSettings(newSettings);
  };

  const _addBlockedUser = (userId: string) => {
    if (!blockedUsers.includes(userId)) {
      setBlockedUsers([...blockedUsers, userId]);
    }
  };

  const removeBlockedUser = (userId: string) => {
    setBlockedUsers(blockedUsers.filter(id => id !== userId));
  };

  const _addRestrictedUser = (userId: string) => {
    if (!restrictedUsers.includes(userId)) {
      setRestrictedUsers([...restrictedUsers, userId]);
    }
  };

  const removeRestrictedUser = (userId: string) => {
    setRestrictedUsers(restrictedUsers.filter(id => id !== userId));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Message Settings</h1>
            <p className="text-muted-foreground">Loading your message preferences...</p>
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
            <h1 className="text-3xl font-bold">Message Settings</h1>
            <p className="text-muted-foreground">Failed to load message settings</p>
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
            <MessageSquare className="h-8 w-8" />
            Messages & Communication
          </h1>
          <p className="text-muted-foreground">
            Control how others can contact you and manage your conversations
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Message Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message Permissions
            </CardTitle>
            <CardDescription>
              Control who can send you messages and how
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
                onCheckedChange={(checked) => updateMessageSetting('allowDirectMessages', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-from">Allow Messages From</Label>
              <Select
                value={settings.privacy.directMessages.allowMessagesFrom}
                onValueChange={(value) => updateMessageSetting('allowMessagesFrom', value)}
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
                onCheckedChange={(checked) => updateMessageSetting('allowGroupMessages', checked)}
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
                onCheckedChange={(checked) => updateMessageSetting('messageNotifications', checked)}
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
                onCheckedChange={(checked) => updateMessageSetting('readReceipts', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message-retention">Message Retention</Label>
              <Select
                value={settings.privacy.directMessages.messageRetention}
                onValueChange={(value) => updateMessageSetting('messageRetention', value)}
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

        {/* Blocked Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Blocked Users
            </CardTitle>
            <CardDescription>
              Users who are blocked from contacting you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-user">Block User</Label>
              <div className="flex gap-2">
                <Input
                  id="block-user"
                  placeholder="Enter user ID or email"
                  className="flex-1"
                />
                <Button size="sm">
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Block a user to prevent them from contacting you
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Currently Blocked Users</Label>
              {blockedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users are currently blocked</p>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((userId) => (
                    <div key={userId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <UserMinus className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{userId}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlockedUser(userId)}
                      >
                        Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Restricted Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Restricted Users
            </CardTitle>
            <CardDescription>
              Users with limited access to your profile and messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restrict-user">Restrict User</Label>
              <div className="flex gap-2">
                <Input
                  id="restrict-user"
                  placeholder="Enter user ID or email"
                  className="flex-1"
                />
                <Button size="sm">
                  <Shield className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Restrict a user to limit their access to your profile
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Currently Restricted Users</Label>
              {restrictedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users are currently restricted</p>
              ) : (
                <div className="space-y-2">
                  {restrictedUsers.map((userId) => (
                    <div key={userId} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{userId}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRestrictedUser(userId)}
                      >
                        Remove Restriction
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Message Filters
            </CardTitle>
            <CardDescription>
              Automatically filter and organize your messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Message filtering features are coming soon. You'll be able to automatically sort messages, set up auto-replies, and create custom filters.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Reply</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically reply to messages when you're away
                  </p>
                </div>
                <Switch disabled />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Spam Filter</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically filter out spam messages
                  </p>
                </div>
                <Switch disabled />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Keyword Filtering</Label>
                  <p className="text-sm text-muted-foreground">
                    Filter messages based on keywords
                  </p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Message Statistics
            </CardTitle>
            <CardDescription>
              Overview of your messaging activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-muted-foreground">Total Messages</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-muted-foreground">Active Conversations</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-muted-foreground">Unread Messages</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
