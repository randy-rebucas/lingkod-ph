"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Building2, 
  Users, 
  Wrench, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Handshake,
  Target,
  Award,
  TrendingUp,
  Globe,
  Briefcase,
  Star
} from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { getAuthInstance, getDb } from "@/lib/firebase";
import { generateReferralCode } from "@/lib/referral-code-generator";

interface PartnerApplicationData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  
  // Business Information
  businessType: string;
  businessSize: string;
  website: string;
  location: string;
  description: string;
  
  // Partnership Details
  partnershipType: string;
  targetAudience: string[];
  expectedReferrals: string;
  marketingChannels: string[];
  experience: string;
  
  // Additional Information
  motivation: string;
  goals: string;
  additionalInfo: string;
  
  // Terms and Conditions
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

const partnershipTypes = [
  {
    id: "corporate",
    name: "Corporate Partnership",
    description: "B2B partnerships with corporations and enterprises",
    icon: <Building2 className="h-6 w-6" />,
    benefits: ["Employee Benefits", "B2B Integration", "Custom Pricing", "Dedicated Support"]
  },
  {
    id: "community",
    name: "Community & LGU Partnership",
    description: "Collaboration with local government and community organizations",
    icon: <Users className="h-6 w-6" />,
    benefits: ["Community Programs", "Job Creation", "Social Impact", "Government Relations"]
  },
  {
    id: "supply",
    name: "Supply & Material Partnership",
    description: "Become a preferred supplier for service providers",
    icon: <Wrench className="h-6 w-6" />,
    benefits: ["B2B Sales", "Volume Discounts", "Market Access", "Quality Standards"]
  },
  {
    id: "referral",
    name: "Referral Partnership",
    description: "Refer users and earn commissions",
    icon: <Target className="h-6 w-6" />,
    benefits: ["Commission Earnings", "Referral Tracking", "Performance Analytics", "Flexible Terms"]
  }
];

const businessSizes = [
  "1-10 employees",
  "11-50 employees", 
  "51-200 employees",
  "201-1000 employees",
  "1000+ employees"
];

const businessTypes = [
  "Food & Catering (restaurants, catering services)",
  "Laundry & Dry Cleaning",
  "Supplies & Hardware",
  "Wellness (salons, spas, massage)",
  "Logistics (transport, delivery, moving services)"
];

const targetAudiences = [
  "Small Businesses",
  "Medium Enterprises", 
  "Large Corporations",
  "Government Agencies",
  "Non-Profit Organizations",
  "Educational Institutions",
  "Healthcare Facilities",
  "Real Estate Companies",
  "Construction Companies",
  "Other"
];

const marketingChannels = [
  "Email Marketing",
  "Social Media",
  "Website/Blog",
  "Print Media",
  "Radio/TV",
  "Events/Conferences",
  "Direct Sales",
  "Referral Network",
  "Other"
];

const expectedReferralRanges = [
  "1-10 per month",
  "11-50 per month",
  "51-100 per month", 
  "100+ per month"
];

export default function PartnerApplicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('PartnerOnboarding');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PartnerApplicationData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    businessType: "",
    businessSize: "",
    website: "",
    location: "",
    description: "",
    partnershipType: "",
    targetAudience: [],
    expectedReferrals: "",
    marketingChannels: [],
    experience: "",
    motivation: "",
    goals: "",
    additionalInfo: "",
    agreeToTerms: false,
    agreeToMarketing: false
  });

  const [errors, setErrors] = useState<{[key: string]: any}>({});

  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: any} = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
        if (!formData.company.trim()) newErrors.company = "Company name is required";
        if (!formData.position.trim()) newErrors.position = "Position is required";
        break;
      case 2:
        if (!formData.businessType.trim()) newErrors.businessType = "Business type is required";
        if (!formData.businessSize) newErrors.businessSize = "Business size is required";
        if (!formData.location.trim()) newErrors.location = "Location is required";
        if (!formData.description.trim()) newErrors.description = "Business description is required";
        break;
      case 3:
        if (!formData.partnershipType) newErrors.partnershipType = "Partnership type is required";
        if (formData.targetAudience.length === 0) newErrors.targetAudience = "Please select at least one target audience";
        if (!formData.expectedReferrals) newErrors.expectedReferrals = "Expected referrals is required";
        if (formData.marketingChannels.length === 0) newErrors.marketingChannels = "Please select at least one marketing channel";
        break;
      case 4:
        if (!formData.experience.trim()) newErrors.experience = "Experience description is required";
        if (!formData.motivation.trim()) newErrors.motivation = "Motivation is required";
        if (!formData.goals.trim()) newErrors.goals = "Goals are required";
        break;
      case 5:
        if (!formData.agreeToTerms) newErrors.agreeToTerms = "You must agree to the terms and conditions";
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

  const handleInputChange = (field: keyof PartnerApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayChange = (field: keyof PartnerApplicationData, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setLoading(true);
    try {
      // Create user account
      const auth = getAuthInstance();
      if (!auth) throw new Error("Authentication not available");
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        `temp_password_${Date.now()}`
      );
      const user = userCredential.user;

      await updateProfile(user, { 
        displayName: `${formData.firstName} ${formData.lastName}` 
      });

      // Generate referral code
      const referralCode = generateReferralCode(user.uid);

      // Create user document with partner role
      const db = getDb();
      if (!db) throw new Error("Database not available");
      
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: formData.email,
        displayName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        role: 'partner',
        accountStatus: 'pending_approval',
        createdAt: serverTimestamp(),
        loyaltyPoints: 0,
        referralCode: referralCode,
        // Partner-specific data
        partnerData: {
          company: formData.company,
          position: formData.position,
          businessType: formData.businessType,
          businessSize: formData.businessSize,
          website: formData.website,
          location: formData.location,
          description: formData.description,
          partnershipType: formData.partnershipType,
          targetAudience: formData.targetAudience,
          expectedReferrals: formData.expectedReferrals,
          marketingChannels: formData.marketingChannels,
          experience: formData.experience,
          motivation: formData.motivation,
          goals: formData.goals,
          additionalInfo: formData.additionalInfo,
          applicationDate: serverTimestamp(),
          status: 'pending_review'
        }
      });

      // Create partner application document
      await setDoc(doc(db, "partnerApplications", user.uid), {
        applicantId: user.uid,
        applicantName: `${formData.firstName} ${formData.lastName}`,
        applicantEmail: formData.email,
        company: formData.company,
        position: formData.position,
        businessType: formData.businessType,
        businessSize: formData.businessSize,
        website: formData.website,
        location: formData.location,
        description: formData.description,
        partnershipType: formData.partnershipType,
        targetAudience: formData.targetAudience,
        expectedReferrals: formData.expectedReferrals,
        marketingChannels: formData.marketingChannels,
        experience: formData.experience,
        motivation: formData.motivation,
        goals: formData.goals,
        additionalInfo: formData.additionalInfo,
        status: 'pending_review',
        submittedAt: serverTimestamp(),
        reviewedAt: null,
        reviewedBy: null,
        reviewNotes: null
      });

      toast({
        title: "Application Submitted Successfully!",
        description: "Your partner application has been submitted and is under review. We'll contact you within 2-3 business days."
      });

      router.push('/partners/application-success');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        variant: "destructive",
        title: "Application Failed",
        description: error.message || "There was an error submitting your application. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
        <p className="text-muted-foreground">Tell us about yourself and your company</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            placeholder="Enter your first name"
          />
          {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            placeholder="Enter your last name"
          />
          {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Enter your email address"
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="Enter your phone number"
          />
          {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company Name *</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            placeholder="Enter your company name"
          />
          {errors.company && <p className="text-sm text-red-500">{errors.company}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Position/Title *</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => handleInputChange('position', e.target.value)}
            placeholder="Enter your position or title"
          />
          {errors.position && <p className="text-sm text-red-500">{errors.position}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Business Information</h2>
        <p className="text-muted-foreground">Tell us about your business</p>
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
          <Label htmlFor="businessSize">Business Size *</Label>
          <Select value={formData.businessSize} onValueChange={(value) => handleInputChange('businessSize', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select business size" />
            </SelectTrigger>
            <SelectContent>
              {businessSizes.map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.businessSize && <p className="text-sm text-red-500">{errors.businessSize}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://yourcompany.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="City, Province, Philippines"
          />
          {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Business Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your business, services, and target market..."
            rows={4}
          />
          {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Partnership Details</h2>
        <p className="text-muted-foreground">What type of partnership are you interested in?</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Partnership Type *</Label>
          <div className="grid gap-4 md:grid-cols-2">
            {partnershipTypes.map((type) => (
              <Card 
                key={type.id}
                className={`cursor-pointer transition-all ${
                  formData.partnershipType === type.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleInputChange('partnershipType', type.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-primary">{type.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{type.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {type.benefits.map((benefit, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {errors.partnershipType && <p className="text-sm text-red-500">{errors.partnershipType}</p>}
        </div>

        <div className="space-y-4">
          <Label>Target Audience *</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {targetAudiences.map((audience) => (
              <div key={audience} className="flex items-center space-x-2">
                <Checkbox
                  id={audience}
                  checked={formData.targetAudience.includes(audience)}
                  onCheckedChange={(checked) => 
                    handleArrayChange('targetAudience', audience, checked as boolean)
                  }
                />
                <Label htmlFor={audience} className="text-sm">{audience}</Label>
              </div>
            ))}
          </div>
          {errors.targetAudience && <p className="text-sm text-red-500">{errors.targetAudience}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedReferrals">Expected Referrals per Month *</Label>
          <Select value={formData.expectedReferrals} onValueChange={(value) => handleInputChange('expectedReferrals', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select expected referral volume" />
            </SelectTrigger>
            <SelectContent>
              {expectedReferralRanges.map((range) => (
                <SelectItem key={range} value={range}>{range}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.expectedReferrals && <p className="text-sm text-red-500">{errors.expectedReferrals}</p>}
        </div>

        <div className="space-y-4">
          <Label>Marketing Channels *</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {marketingChannels.map((channel) => (
              <div key={channel} className="flex items-center space-x-2">
                <Checkbox
                  id={channel}
                  checked={formData.marketingChannels.includes(channel)}
                  onCheckedChange={(checked) => 
                    handleArrayChange('marketingChannels', channel, checked as boolean)
                  }
                />
                <Label htmlFor={channel} className="text-sm">{channel}</Label>
              </div>
            ))}
          </div>
          {errors.marketingChannels && <p className="text-sm text-red-500">{errors.marketingChannels}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Additional Information</h2>
        <p className="text-muted-foreground">Help us understand your background and goals</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="experience">Relevant Experience *</Label>
          <Textarea
            id="experience"
            value={formData.experience}
            onChange={(e) => handleInputChange('experience', e.target.value)}
            placeholder="Describe your relevant experience in partnerships, business development, or related fields..."
            rows={4}
          />
          {errors.experience && <p className="text-sm text-red-500">{errors.experience}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivation">Motivation for Partnership *</Label>
          <Textarea
            id="motivation"
            value={formData.motivation}
            onChange={(e) => handleInputChange('motivation', e.target.value)}
            placeholder="Why do you want to partner with LocalPro? What drives your interest?"
            rows={3}
          />
          {errors.motivation && <p className="text-sm text-red-500">{errors.motivation}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="goals">Partnership Goals *</Label>
          <Textarea
            id="goals"
            value={formData.goals}
            onChange={(e) => handleInputChange('goals', e.target.value)}
            placeholder="What do you hope to achieve through this partnership? What are your specific goals?"
            rows={3}
          />
          {errors.goals && <p className="text-sm text-red-500">{errors.goals}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
          <Textarea
            id="additionalInfo"
            value={formData.additionalInfo}
            onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
            placeholder="Any additional information you'd like to share..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Terms and Conditions</h2>
        <p className="text-muted-foreground">Please review and accept our terms</p>
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
              <p>By becoming a LocalPro partner, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Maintain high standards of professionalism and integrity</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Protect confidential information and user privacy</li>
                <li>Follow our partnership guidelines and best practices</li>
                <li>Provide accurate and truthful information</li>
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
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary mb-1">What happens next?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Your application will be reviewed within 2-3 business days</li>
                  <li>• We'll contact you to discuss partnership details</li>
                  <li>• Upon approval, you'll receive your partner dashboard access</li>
                  <li>• You'll get your unique referral codes and marketing materials</li>
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
      default: return null;
    }
  };

  return (
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
                <h1 className="text-xl font-bold">Become a Partner</h1>
                <p className="text-sm text-muted-foreground">Join LocalPro's partner network</p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              Step {currentStep} of 5
            </Badge>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="container py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 5 && (
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
              Previous
            </Button>
            
            {currentStep < 5 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
