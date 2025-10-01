"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Banknote, 
  Wallet, 
  Settings, 
  Shield, 
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Download,
  Upload,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface PaymentMethod {
  id: string;
  type: 'bank' | 'gcash' | 'paymaya' | 'paypal' | 'wise';
  name: string;
  accountNumber?: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  addedDate: string;
  lastUsed?: string;
}

interface PaymentSettings {
  preferredMethod: string;
  autoPayout: boolean;
  payoutThreshold: number;
  payoutFrequency: 'weekly' | 'biweekly' | 'monthly';
  taxSettings: {
    hasTaxId: boolean;
    taxId?: string;
    taxName?: string;
  };
  notifications: {
    payoutReceived: boolean;
    payoutFailed: boolean;
    thresholdReached: boolean;
    taxDocuments: boolean;
  };
}

interface PayoutHistory {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: string;
  date: string;
  reference?: string;
  description: string;
}

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'bank',
    name: 'BDO Savings Account',
    accountNumber: '****1234',
    accountName: 'John Doe',
    isDefault: true,
    isVerified: true,
    addedDate: '2024-01-01',
    lastUsed: '2024-01-15'
  },
  {
    id: '2',
    type: 'gcash',
    name: 'GCash',
    accountNumber: '09171234567',
    accountName: 'John Doe',
    isDefault: false,
    isVerified: true,
    addedDate: '2024-01-05',
    lastUsed: '2024-01-10'
  }
];

const mockPayoutHistory: PayoutHistory[] = [
  {
    id: '1',
    amount: 2500.00,
    status: 'completed',
    method: 'BDO Savings Account',
    date: '2024-01-15',
    reference: 'TXN-2024-001',
    description: 'Monthly commission payout'
  },
  {
    id: '2',
    amount: 1800.00,
    status: 'completed',
    method: 'GCash',
    date: '2024-01-01',
    reference: 'TXN-2024-002',
    description: 'Weekly commission payout'
  },
  {
    id: '3',
    amount: 3200.00,
    status: 'processing',
    method: 'BDO Savings Account',
    date: '2024-01-20',
    reference: 'TXN-2024-003',
    description: 'Monthly commission payout'
  }
];

export default function PaymentSettingsPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [settings, setSettings] = useState<PaymentSettings>({
    preferredMethod: '',
    autoPayout: true,
    payoutThreshold: 1000,
    payoutFrequency: 'monthly',
    taxSettings: {
      hasTaxId: false,
      taxId: '',
      taxName: ''
    },
    notifications: {
      payoutReceived: true,
      payoutFailed: true,
      thresholdReached: true,
      taxDocuments: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [showAccountNumbers, setShowAccountNumbers] = useState(false);

  useEffect(() => {
    const loadPaymentData = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          setPaymentMethods(mockPaymentMethods);
          setPayoutHistory(mockPayoutHistory);
          setSettings(prev => ({
            ...prev,
            preferredMethod: mockPaymentMethods.find(m => m.isDefault)?.id || ''
          }));
        } catch (error) {
          console.error('Error loading payment data:', error);
          toast({
            variant: "destructive",
            title: "Error Loading Payment Data",
            description: "Failed to load payment settings. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadPaymentData();
  }, [user, userRole]);

  const handleAddPaymentMethod = () => {
    // In a real app, this would open a modal or navigate to add payment method
    toast({
      title: "Add Payment Method",
      description: "This would open the add payment method form.",
    });
  };

  const handleEditPaymentMethod = (methodId: string) => {
    setEditingMethod(methodId);
    // In a real app, this would open an edit form
    toast({
      title: "Edit Payment Method",
      description: "This would open the edit payment method form.",
    });
  };

  const handleDeletePaymentMethod = (methodId: string) => {
    // In a real app, this would show a confirmation dialog
    toast({
      title: "Delete Payment Method",
      description: "This would delete the payment method after confirmation.",
    });
  };

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods(prev => 
      prev.map(method => ({
        ...method,
        isDefault: method.id === methodId
      }))
    );
    setSettings(prev => ({
      ...prev,
      preferredMethod: methodId
    }));
    toast({
      title: "Default Payment Method Updated",
      description: "Your default payment method has been changed.",
    });
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Settings Saved",
      description: "Your payment settings have been updated successfully.",
    });
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Banknote className="h-4 w-4" />;
      case 'gcash': return <CreditCard className="h-4 w-4" />;
      case 'paymaya': return <CreditCard className="h-4 w-4" />;
      case 'paypal': return <CreditCard className="h-4 w-4" />;
      case 'wise': return <CreditCard className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Payment Settings</h1>
        <p className="text-muted-foreground">
          Manage your payment methods, payout preferences, and transaction history
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{payoutHistory.reduce((sum, payout) => sum + payout.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{payoutHistory
                .filter(p => p.status === 'processing' || p.status === 'pending')
                .reduce((sum, payout) => sum + payout.amount, 0)
                .toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Methods</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
            <p className="text-xs text-muted-foreground">
              {paymentMethods.filter(m => m.isVerified).length} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settings.payoutFrequency === 'weekly' ? '7' : 
               settings.payoutFrequency === 'biweekly' ? '14' : '30'} days
            </div>
            <p className="text-xs text-muted-foreground">
              Based on your frequency
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="methods" className="space-y-6">
        <TabsList>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="settings">Payout Settings</TabsTrigger>
          <TabsTrigger value="history">Payout History</TabsTrigger>
          <TabsTrigger value="tax">Tax Information</TabsTrigger>
        </TabsList>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Manage your payment methods for receiving payouts
                  </CardDescription>
                </div>
                <Button onClick={handleAddPaymentMethod}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPaymentMethodIcon(method.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{method.name}</h3>
                            {method.isDefault && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                Default
                              </span>
                            )}
                            {method.isVerified ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {method.accountName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {showAccountNumbers ? method.accountNumber : '••••••••'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAccountNumbers(!showAccountNumbers)}
                        >
                          {showAccountNumbers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(method.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPaymentMethod(method.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payout Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive your payouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredMethod">Preferred Payment Method</Label>
                    <Select
                      value={settings.preferredMethod}
                      onValueChange={(value) => handleSettingsChange('preferredMethod', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payoutFrequency">Payout Frequency</Label>
                    <Select
                      value={settings.payoutFrequency}
                      onValueChange={(value) => handleSettingsChange('payoutFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payoutThreshold">Minimum Payout Amount</Label>
                    <Input
                      id="payoutThreshold"
                      type="number"
                      value={settings.payoutThreshold}
                      onChange={(e) => handleSettingsChange('payoutThreshold', Number(e.target.value))}
                      placeholder="1000"
                    />
                    <p className="text-sm text-muted-foreground">
                      Minimum amount before automatic payout
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="autoPayout">Automatic Payouts</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically process payouts when threshold is reached
                      </p>
                    </div>
                    <Switch
                      id="autoPayout"
                      checked={settings.autoPayout}
                      onCheckedChange={(checked) => handleSettingsChange('autoPayout', checked)}
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="payoutReceived">Payout Received</Label>
                        <Switch
                          id="payoutReceived"
                          checked={settings.notifications.payoutReceived}
                          onCheckedChange={(checked) => handleNotificationChange('payoutReceived', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="payoutFailed">Payout Failed</Label>
                        <Switch
                          id="payoutFailed"
                          checked={settings.notifications.payoutFailed}
                          onCheckedChange={(checked) => handleNotificationChange('payoutFailed', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="thresholdReached">Threshold Reached</Label>
                        <Switch
                          id="thresholdReached"
                          checked={settings.notifications.thresholdReached}
                          onCheckedChange={(checked) => handleNotificationChange('thresholdReached', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="taxDocuments">Tax Documents</Label>
                        <Switch
                          id="taxDocuments"
                          checked={settings.notifications.taxDocuments}
                          onCheckedChange={(checked) => handleNotificationChange('taxDocuments', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payout History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>
                    View your payout transaction history
                  </CardDescription>
                </div>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payoutHistory.map((payout) => (
                  <div key={payout.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payout.status)}
                        <div>
                          <h3 className="font-medium">₱{payout.amount.toLocaleString()}</h3>
                          <p className="text-sm text-muted-foreground">
                            {payout.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payout.method} • {payout.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                        {payout.reference && (
                          <span className="text-sm text-muted-foreground">
                            {payout.reference}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Information Tab */}
        <TabsContent value="tax" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tax Information</CardTitle>
              <CardDescription>
                Manage your tax information for commission reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="hasTaxId">Tax ID Available</Label>
                    <p className="text-sm text-muted-foreground">
                      Do you have a tax identification number?
                    </p>
                  </div>
                  <Switch
                    id="hasTaxId"
                    checked={settings.taxSettings.hasTaxId}
                    onCheckedChange={(checked) => 
                      handleSettingsChange('taxSettings', {
                        ...settings.taxSettings,
                        hasTaxId: checked
                      })
                    }
                  />
                </div>

                {settings.taxSettings.hasTaxId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID Number</Label>
                      <Input
                        id="taxId"
                        value={settings.taxSettings.taxId || ''}
                        onChange={(e) => 
                          handleSettingsChange('taxSettings', {
                            ...settings.taxSettings,
                            taxId: e.target.value
                          })
                        }
                        placeholder="Enter your tax ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxName">Tax Name</Label>
                      <Input
                        id="taxName"
                        value={settings.taxSettings.taxName || ''}
                        onChange={(e) => 
                          handleSettingsChange('taxSettings', {
                            ...settings.taxSettings,
                            taxName: e.target.value
                          })
                        }
                        placeholder="Enter tax name"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Tax Documents</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>2024 Tax Summary</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Commission Report - Q4 2023</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Tax Information
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </PartnerAccessGuard>
  );
}
