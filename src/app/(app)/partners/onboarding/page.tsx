"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Copy,
  ExternalLink,
  Target,
  Users,
  TrendingUp,
  Award,
  FileText,
  Settings,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  Handshake,
  Star,
  Zap
} from "lucide-react";
import { doc, updateDoc, getDoc, serverTimestamp, Firestore } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { PartnerReferralTracker } from "@/lib/partner-referral-tracker";

interface OnboardingData {
  // Profile Setup
  companyLogo?: string;
  companyDescription: string;
  website: string;
  socialMedia: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    instagram?: string;
  };
  
  // Contact Information
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    position: string;
  };
  
  // Business Details
  businessType: string;
  businessAddress: string;
  businessHours: string;
  serviceAreas: string[];
  
  // Partnership Preferences
  preferredCommissionRate: string;
  paymentMethod: string;
  reportingFrequency: string;
  
  // Marketing Preferences
  marketingMaterials: string[];
  coBranding: boolean;
  caseStudies: boolean;
  
  // Goals and Expectations
  monthlyReferralGoal: string;
  targetAudience: string[];
  marketingBudget: string;
  
  // Terms and Agreements
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
  agreeToDataSharing: boolean;
}

const commissionRates = [
  "5% - Standard Rate",
  "7% - Preferred Rate", 
  "10% - Premium Rate",
  "Custom Rate (to be discussed)"
];

const paymentMethods = [
  "Bank Transfer",
  "PayPal",
  "GCash",
  "Maya",
  "Check"
];

const reportingFrequencies = [
  "Weekly",
  "Monthly", 
  "Quarterly"
];

const marketingMaterials = [
  "Email Templates",
  "Social Media Graphics",
  "Website Banners",
  "Print Materials",
  "Video Content",
  "Case Studies",
  "Testimonials",
  "Press Releases"
];

const monthlyGoals = [
  "1-10 referrals",
  "11-25 referrals",
  "26-50 referrals",
  "51-100 referrals",
  "100+ referrals"
];

const marketingBudgets = [
  "₱0 - Organic only",
  "₱1,000 - ₱5,000",
  "₱5,000 - ₱10,000", 
  "₱10,000 - ₱25,000",
  "₱25,000+"
];

const businessTypes = [
  "Food & Catering (restaurants, catering services)",
  "Laundry & Dry Cleaning",
  "Supplies & Hardware",
  "Wellness (salons, spas, massage)",
  "Logistics (transport, delivery, moving services)"
];

export default function PartnerOnboardingPage() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('PartnerOnboarding');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  
  const [formData, setFormData] = useState<OnboardingData>({
    companyDescription: "",
    website: "",
    socialMedia: {},
    primaryContact: {
      name: "",
      email: "",
      phone: "",
      position: ""
    },
    businessType: "",
    businessAddress: "",
    businessHours: "",
    serviceAreas: [],
    preferredCommissionRate: "",
    paymentMethod: "",
    reportingFrequency: "",
    marketingMaterials: [],
    coBranding: false,
    caseStudies: false,
    monthlyReferralGoal: "",
    targetAudience: [],
    marketingBudget: "",
    agreeToTerms: false,
    agreeToMarketing: false,
    agreeToDataSharing: false
  });

  const [errors, setErrors] = useState<{[key: string]: any}>({});

  useEffect(() => {
    if (userRole !== 'partner') {
      router.push('/dashboard');
      return;
    }

    // Load existing partner data
    loadPartnerData();
  }, [user, userRole, router]);

  const loadPartnerData = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(getDb() as Firestore, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const partnerData = userData.partnerData || {};
        
        setFormData(prev => ({
          ...prev,
          companyDescription: partnerData.description || "",
          website: partnerData.website || "",
          primaryContact: {
            name: userData.displayName || "",
            email: userData.email || "",
            phone: userData.phone || "",
            position: partnerData.position || ""
          },
          businessType: partnerData.businessType || "",
          businessAddress: partnerData.location || "",
          targetAudience: partnerData.targetAudience || [],
          monthlyReferralGoal: partnerData.expectedReferrals || ""
        }));

        // Generate referral code if not exists
        if (userData.referralCode) {
          setReferralCode(userData.referralCode);
          setReferralLink(`${window.location.origin}/signup?ref=${userData.referralCode}`);
        }
      }
    } catch (error) {
      console.error('Error loading partner data:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: any} = {};

    switch (step) {
      case 1:
        if (!formData.companyDescription.trim()) newErrors.companyDescription = "Company description is required";
        if (!formData.primaryContact.name.trim()) {
          newErrors["primaryContact.name"] = "Contact name is required";
        }
        if (!formData.primaryContact.email.trim()) {
          newErrors["primaryContact.email"] = "Contact email is required";
        }
        if (!formData.primaryContact.phone.trim()) {
          newErrors["primaryContact.phone"] = "Contact phone is required";
        }
        break;
      case 2:
        if (!formData.businessType.trim()) newErrors.businessType = "Business type is required";
        if (!formData.businessAddress.trim()) newErrors.businessAddress = "Business address is required";
        if (!formData.businessHours.trim()) newErrors.businessHours = "Business hours are required";
        if (formData.serviceAreas.length === 0) newErrors.serviceAreas = "Please select at least one service area";
        break;
      case 3:
        if (!formData.preferredCommissionRate) newErrors.preferredCommissionRate = "Commission rate is required";
        if (!formData.paymentMethod) newErrors.paymentMethod = "Payment method is required";
        if (!formData.reportingFrequency) newErrors.reportingFrequency = "Reporting frequency is required";
        break;
      case 4:
        if (formData.marketingMaterials.length === 0) newErrors.marketingMaterials = "Please select at least one marketing material";
        if (!formData.monthlyReferralGoal) newErrors.monthlyReferralGoal = "Monthly referral goal is required";
        if (formData.targetAudience.length === 0) newErrors.targetAudience = "Please select at least one target audience";
        break;
      case 5:
        if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms and conditions";
        if (!formData.agreeToDataSharing) newErrors.agreeToDataSharing = "You must agree to data sharing";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof OnboardingData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field as keyof OnboardingData]: value }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayChange = (field: keyof OnboardingData, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`
    });
  };

  const handleComplete = async () => {
    if (!validateStep(5) || !user) return;

    setLoading(true);
    try {
      // Update user document with onboarding data
      const db = getDb();
      if (!db) throw new Error("Database not available");
      
      await updateDoc(doc(db, "users", user.uid), {
        partnerData: {
          ...formData,
          onboardingCompleted: true,
          onboardingCompletedAt: serverTimestamp(),
          status: 'active'
        },
        accountStatus: 'active'
      });

      // Create initial referral code
      if (!referralCode) {
        const result = await PartnerReferralTracker.createReferralCode(
          user.uid,
          "Default referral code",
          {}
        );
        
        if (result.success && result.referralCode) {
          setReferralCode(result.referralCode.code);
          setReferralLink(`${window.location.origin}/signup?ref=${result.referralCode.code}`);
        }
      }

      toast({
        title: "Onboarding Complete!",
        description: "Welcome to the LocalPro partner network. You can now start referring users and earning commissions."
      });

      router.push('/partners/dashboard');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        variant: "destructive",
        title: "Onboarding Failed",
        description: error.message || "There was an error completing your onboarding. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Company Profile</h2>
        <p className="text-muted-foreground">Tell us about your company and primary contact</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyDescription">Company Description *</Label>
          <Textarea
            id="companyDescription"
            value={formData.companyDescription}
            onChange={(e) => handleInputChange('companyDescription', e.target.value)}
            placeholder="Describe your company, its mission, and what makes it unique..."
            rows={4}
          />
          {errors.companyDescription && <p className="text-sm text-red-500">{errors.companyDescription}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://yourcompany.com"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">Primary Contact Name *</Label>
            <Input
              id="contactName"
              value={formData.primaryContact.name}
              onChange={(e) => handleInputChange('primaryContact.name', e.target.value)}
              placeholder="Enter contact name"
            />
            {errors["primaryContact.name"] && <p className="text-sm text-red-500">{errors["primaryContact.name"]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPosition">Position/Title</Label>
            <Input
              id="contactPosition"
              value={formData.primaryContact.position}
              onChange={(e) => handleInputChange('primaryContact.position', e.target.value)}
              placeholder="Enter position or title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email *</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.primaryContact.email}
              onChange={(e) => handleInputChange('primaryContact.email', e.target.value)}
              placeholder="Enter contact email"
            />
            {errors["primaryContact.email"] && <p className="text-sm text-red-500">{errors["primaryContact.email"]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone">Contact Phone *</Label>
            <Input
              id="contactPhone"
              value={formData.primaryContact.phone}
              onChange={(e) => handleInputChange('primaryContact.phone', e.target.value)}
              placeholder="Enter contact phone"
            />
            {errors["primaryContact.phone"] && <p className="text-sm text-red-500">{errors["primaryContact.phone"]}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Business Information</h2>
        <p className="text-muted-foreground">Provide your business details and service areas</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="businessType">Business Type *</Label>
          <Select
            value={formData.businessType}
            onValueChange={(value) => handleInputChange('businessType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your business type" />
            </SelectTrigger>
            <SelectContent>
              {businessTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.businessType && <p className="text-sm text-red-500">{errors.businessType}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessAddress">Business Address *</Label>
          <Input
            id="businessAddress"
            value={formData.businessAddress}
            onChange={(e) => handleInputChange('businessAddress', e.target.value)}
            placeholder="Enter your business address"
          />
          {errors.businessAddress && <p className="text-sm text-red-500">{errors.businessAddress}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessHours">Business Hours *</Label>
          <Input
            id="businessHours"
            value={formData.businessHours}
            onChange={(e) => handleInputChange('businessHours', e.target.value)}
            placeholder="e.g., Monday-Friday 9AM-6PM"
          />
          {errors.businessHours && <p className="text-sm text-red-500">{errors.businessHours}</p>}
        </div>

        <div className="space-y-4">
          <Label>Service Areas *</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {["Metro Manila", "Cebu", "Davao", "Iloilo", "Baguio", "Cagayan de Oro", "Bacolod", "Zamboanga", "Other"].map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={area}
                  checked={formData.serviceAreas.includes(area)}
                  onCheckedChange={(checked) => 
                    handleArrayChange('serviceAreas', area, checked as boolean)
                  }
                />
                <Label htmlFor={area} className="text-sm">{area}</Label>
              </div>
            ))}
          </div>
          {errors.serviceAreas && <p className="text-sm text-red-500">{errors.serviceAreas}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Partnership Preferences</h2>
        <p className="text-muted-foreground">Configure your partnership settings</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="commissionRate">Preferred Commission Rate *</Label>
          <select
            id="commissionRate"
            value={formData.preferredCommissionRate}
            onChange={(e) => handleInputChange('preferredCommissionRate', e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option value="">Select commission rate</option>
            {commissionRates.map((rate) => (
              <option key={rate} value={rate}>{rate}</option>
            ))}
          </select>
          {errors.preferredCommissionRate && <p className="text-sm text-red-500">{errors.preferredCommissionRate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Preferred Payment Method *</Label>
          <select
            id="paymentMethod"
            value={formData.paymentMethod}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option value="">Select payment method</option>
            {paymentMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportingFrequency">Reporting Frequency *</Label>
          <select
            id="reportingFrequency"
            value={formData.reportingFrequency}
            onChange={(e) => handleInputChange('reportingFrequency', e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option value="">Select reporting frequency</option>
            {reportingFrequencies.map((frequency) => (
              <option key={frequency} value={frequency}>{frequency}</option>
            ))}
          </select>
          {errors.reportingFrequency && <p className="text-sm text-red-500">{errors.reportingFrequency}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Marketing & Goals</h2>
        <p className="text-muted-foreground">Set your marketing preferences and goals</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Marketing Materials Needed *</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {marketingMaterials.map((material) => (
              <div key={material} className="flex items-center space-x-2">
                <Checkbox
                  id={material}
                  checked={formData.marketingMaterials.includes(material)}
                  onCheckedChange={(checked) => 
                    handleArrayChange('marketingMaterials', material, checked as boolean)
                  }
                />
                <Label htmlFor={material} className="text-sm">{material}</Label>
              </div>
            ))}
          </div>
          {errors.marketingMaterials && <p className="text-sm text-red-500">{errors.marketingMaterials}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="coBranding"
              checked={formData.coBranding}
              onCheckedChange={(checked) => handleInputChange('coBranding', checked)}
            />
            <Label htmlFor="coBranding" className="text-sm">
              Interested in co-branded marketing materials
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="caseStudies"
              checked={formData.caseStudies}
              onCheckedChange={(checked) => handleInputChange('caseStudies', checked)}
            />
            <Label htmlFor="caseStudies" className="text-sm">
              Interested in case studies and success stories
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyGoal">Monthly Referral Goal *</Label>
          <select
            id="monthlyGoal"
            value={formData.monthlyReferralGoal}
            onChange={(e) => handleInputChange('monthlyReferralGoal', e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option value="">Select monthly goal</option>
            {monthlyGoals.map((goal) => (
              <option key={goal} value={goal}>{goal}</option>
            ))}
          </select>
          {errors.monthlyReferralGoal && <p className="text-sm text-red-500">{errors.monthlyReferralGoal}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingBudget">Marketing Budget</Label>
          <select
            id="marketingBudget"
            value={formData.marketingBudget}
            onChange={(e) => handleInputChange('marketingBudget', e.target.value)}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            <option value="">Select marketing budget</option>
            {marketingBudgets.map((budget) => (
              <option key={budget} value={budget}>{budget}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Terms & Agreements</h2>
        <p className="text-muted-foreground">Review and accept the partnership terms</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Partnership Agreement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>By completing onboarding, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Maintain professional standards and integrity</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Protect confidential information and user privacy</li>
                <li>Follow partnership guidelines and best practices</li>
                <li>Provide accurate reporting and documentation</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
            />
            <Label htmlFor="agreeToTerms" className="text-sm">
              I agree to the Partnership Agreement and Terms of Service *
            </Label>
          </div>
          {errors.agreeToTerms && <p className="text-sm text-red-500">{errors.agreeToTerms}</p>}

          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToMarketing"
              checked={formData.agreeToMarketing}
              onCheckedChange={(checked) => handleInputChange('agreeToMarketing', checked)}
            />
            <Label htmlFor="agreeToMarketing" className="text-sm">
              I agree to receive marketing communications and partnership updates
            </Label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="agreeToDataSharing"
              checked={formData.agreeToDataSharing}
              onCheckedChange={(checked) => handleInputChange('agreeToDataSharing', checked)}
            />
            <Label htmlFor="agreeToDataSharing" className="text-sm">
              I agree to share necessary data for partnership management and analytics *
            </Label>
          </div>
          {errors.agreeToDataSharing && <p className="text-sm text-red-500">{errors.agreeToDataSharing}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to LocalPro Partners!</h2>
        <p className="text-muted-foreground">Your onboarding is complete. Here are your referral tools:</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Use this code to track referrals and earn commissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(referralCode, "Referral code")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link to refer new users to LocalPro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(referralLink, "Referral link")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary mb-2">You're all set!</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Access your partner dashboard to track performance</li>
                  <li>• Download marketing materials from your dashboard</li>
                  <li>• Start sharing your referral link to earn commissions</li>
                  <li>• Contact our partnership team for any questions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };


  return (
    <PartnerAccessGuard>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Handshake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Partner Onboarding</h1>
                <p className="text-sm text-muted-foreground">Complete your partner setup</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {currentStep} of 6
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="container py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 6 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentStep < 6 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? "Completing..." : "Complete Onboarding"}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      </div>
    </PartnerAccessGuard>
  );
}
