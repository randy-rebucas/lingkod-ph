'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  Shield, 
  Eye, 
  Palette, 
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const settingsSections = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
      href: '/settings/notifications'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Control your privacy and security settings',
      icon: Shield,
      href: '/settings/privacy'
    },
    {
      id: 'profile',
      title: 'Profile Visibility',
      description: 'Manage what others can see about you',
      icon: Eye,
      href: '/settings/profile'
    },
    {
      id: 'appearance',
      title: 'Appearance & Language',
      description: 'Customize your interface and language',
      icon: Palette,
      href: '/settings/appearance'
    },
    {
      id: 'messages',
      title: 'Messages & Communication',
      description: 'Control how others can contact you',
      icon: MessageSquare,
      href: '/settings/messages'
    }
  ];


  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account preferences and privacy settings
        </p>
      </div>

      {/* Settings Sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Link key={section.id} href={section.href}>
              <Card className="cursor-pointer transition-all duration-200 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-6 w-6 text-muted-foreground" />
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    {section.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}