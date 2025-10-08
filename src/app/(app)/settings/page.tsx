'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Bell, 
  Shield, 
  Eye, 
  Palette, 
  User, 
  Smartphone, 
  Mail, 
  MessageSquare,
  Globe,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const _user = useAuth();
  const _t = useTranslations('Settings');
  const _router = useRouter();

  const settingsSections = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
      href: '/settings/notifications',
      badge: null,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Control your privacy and security settings',
      icon: Shield,
      href: '/settings/privacy',
      badge: null,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'profile',
      title: 'Profile Visibility',
      description: 'Manage what others can see about you',
      icon: Eye,
      href: '/settings/profile',
      badge: null,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'appearance',
      title: 'Appearance & Language',
      description: 'Customize your interface and language',
      icon: Palette,
      href: '/settings/appearance',
      badge: null,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Manage your account information',
      icon: User,
      href: '/settings/account',
      badge: null,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    },
    {
      id: 'messages',
      title: 'Messages & Communication',
      description: 'Control how others can contact you',
      icon: MessageSquare,
      href: '/settings/messages',
      badge: null,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    }
  ];

  const quickActions = [
    {
      id: 'export',
      title: 'Export Settings',
      description: 'Download your settings as a backup',
      icon: Download,
      action: () => handleExportSettings(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'import',
      title: 'Import Settings',
      description: 'Restore settings from a backup file',
      icon: Upload,
      action: () => handleImportSettings(),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'reset',
      title: 'Reset to Defaults',
      description: 'Restore all settings to default values',
      icon: RotateCcw,
      action: () => handleResetSettings(),
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  const handleExportSettings = () => {
    // TODO: Implement settings export
    console.log('Export settings');
  };

  const handleImportSettings = () => {
    // TODO: Implement settings import
    console.log('Import settings');
  };

  const handleResetSettings = () => {
    // TODO: Implement settings reset
    console.log('Reset settings');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account preferences and privacy settings
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Link key={section.id} href={section.href}>
              <Card className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${section.borderColor} border-2`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${section.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${section.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {section.title}
                        {section.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {section.badge}
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Separator />

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Card 
                key={action.id} 
                className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${action.borderColor} border-2`}
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${action.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {action.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Settings Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Overview</CardTitle>
          <CardDescription>
            Quick overview of your current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Email Notifications</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Enabled
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">SMS Notifications</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Disabled
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Profile Visibility</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Public
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Language</span>
              </div>
              <Badge variant="outline" className="text-xs">
                English
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}