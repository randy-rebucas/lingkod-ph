
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Moon, Sun, Bell, AtSign, MessageSquare } from "lucide-react"

export default function SettingsPage() {
    const [theme, setTheme] = useState("light");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of the app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
                                <span>Theme</span>
                                <span className="font-normal leading-snug text-muted-foreground">
                                    Select your preferred theme.
                                </span>
                            </Label>
                             <div className="flex items-center gap-2">
                                <Sun className={`h-6 w-6 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <Switch 
                                    id="theme-mode"
                                    checked={theme === 'dark'}
                                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                />
                                <Moon className={`h-6 w-6 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Choose how you want to be notified.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="booking-updates" className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-accent" />
                                <span className="font-semibold">Booking Updates</span>
                            </Label>
                            <Switch id="booking-updates" defaultChecked />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="new-messages" className="flex items-center gap-3">
                                <MessageSquare className="h-5 w-5 text-accent" />
                                <span className="font-semibold">New Messages</span>
                            </Label>
                            <Switch id="new-messages" defaultChecked />
                        </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="promotional-emails" className="flex items-center gap-3">
                                <AtSign className="h-5 w-5 text-accent" />
                                <span className="font-semibold">Promotional Emails</span>
                            </Label>
                            <Switch id="promotional-emails" />
                        </div>
                        <div className="text-right">
                             <Button>Save Preferences</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
