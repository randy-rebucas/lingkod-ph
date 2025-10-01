"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Circle,
  ArrowRight,
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
  Zap,
  Copy,
  ExternalLink,
  Calendar,
  DollarSign,
  BarChart3,
  Download,
  MessageSquare
} from "lucide-react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { PartnerReferralTracker } from "@/lib/partner-referral-tracker";

interface WelcomeData {
  partnerData: any;
  referralCode: string;
  referralLink: string;
  onboardingProgress: number;
  setupTasks: SetupTask[];
}

interface SetupTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  action?: string;
  actionUrl?: string;
}

const getSetupTasks = (t: any): SetupTask[] => [
  {
    id: "profile",
    title: t('completeCompanyProfile'),
    description: t('completeCompanyProfileDescription'),
    completed: false,
    required: true,
    action: t('completeProfile'),
    actionUrl: "/partners/onboarding"
  },
  {
    id: "referral-code",
    title: t('getReferralCode'),
    description: t('getReferralCodeDescription'),
    completed: false,
    required: true,
    action: t('generateCode'),
    actionUrl: "/partners/referral-codes"
  },
  {
    id: "marketing-materials",
    title: t('downloadMarketingMaterials'),
    description: t('downloadMarketingMaterialsDescription'),
    completed: false,
    required: false,
    action: t('downloadMaterials'),
    actionUrl: "/partners/marketing-materials"
  },
  {
    id: "first-referral",
    title: t('makeFirstReferral'),
    description: t('makeFirstReferralDescription'),
    completed: false,
    required: true,
    action: t('shareLink'),
    actionUrl: "/partners/dashboard"
  },
  {
    id: "payment-setup",
    title: t('setupPaymentInformation'),
    description: t('setupPaymentInformationDescription'),
    completed: false,
    required: true,
    action: t('setupPayment'),
    actionUrl: "/partners/payment-settings"
  },
  {
    id: "goals",
    title: t('setPartnershipGoals'),
    description: t('setPartnershipGoalsDescription'),
    completed: false,
    required: false,
    action: t('setGoals'),
    actionUrl: "/partners/goals"
  }
];

export default function PartnerWelcomePage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('PartnerWelcome');
  
  const [welcomeData, setWelcomeData] = useState<WelcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<SetupTask[]>([]);

  useEffect(() => {
    if (userRole !== 'partner') {
      router.push('/dashboard');
      return;
    }
    // Initialize tasks with translations
    setTasks(getSetupTasks(t));
    loadWelcomeData();
  }, [user, userRole, router, t]);

  const loadWelcomeData = async () => {
    if (!user) return;

    try {
      const db = getDb();
      if (!db) throw new Error("Database not available");
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const partnerData = userData.partnerData || {};
        
        // Check task completion status
        const updatedTasks = tasks.map(task => {
          switch (task.id) {
            case "profile":
              return { ...task, completed: !!(partnerData.companyDescription && partnerData.primaryContact?.name) };
            case "referral-code":
              return { ...task, completed: !!userData.referralCode };
            case "marketing-materials":
              return { ...task, completed: partnerData.marketingMaterialsDownloaded || false };
            case "first-referral":
              return { ...task, completed: partnerData.firstReferralMade || false };
            case "payment-setup":
              return { ...task, completed: partnerData.paymentSetup || false };
            case "goals":
              return { ...task, completed: !!(partnerData.monthlyReferralGoal && partnerData.targetAudience?.length > 0) };
            default:
              return task;
          }
        });

        setTasks(updatedTasks);

        const completedTasks = updatedTasks.filter(task => task.completed).length;
        const onboardingProgress = (completedTasks / updatedTasks.length) * 100;

        setWelcomeData({
          partnerData,
          referralCode: userData.referralCode || "",
          referralLink: userData.referralCode ? `${window.location.origin}/signup?ref=${userData.referralCode}` : "",
          onboardingProgress,
          setupTasks: updatedTasks
        });
      }
    } catch (error) {
      console.error('Error loading welcome data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('copied'),
      description: t('copiedDescription', { label })
    });
  };

  const markTaskComplete = async (taskId: string) => {
    try {
      const db = getDb();
      if (!db) throw new Error("Database not available");
      
      await updateDoc(doc(db, "users", user?.uid || ""), {
        [`partnerData.${taskId}Completed`]: true,
        [`partnerData.${taskId}CompletedAt`]: serverTimestamp()
      });

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed: true } : task
      ));

      toast({
        title: t('taskCompleted'),
        description: t('taskCompletedDescription')
      });
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  const handleTaskAction = (task: SetupTask) => {
    if (task.actionUrl) {
      router.push(task.actionUrl);
    } else if (task.id === "first-referral") {
      // Mark as complete when they visit dashboard
      markTaskComplete(task.id);
      router.push('/partners/dashboard');
    }
  };


  if (loading) {
    return (
      <div className="container space-y-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">{t('loadingWelcomeDashboard')}</p>
          </div>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(task => task.completed).length;
  const requiredTasks = tasks.filter(task => task.required);
  const completedRequiredTasks = requiredTasks.filter(task => task.completed).length;

  return (
    <PartnerAccessGuard>
      <div className="container space-y-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Handshake className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('setupProgress')}
            </CardTitle>
            <CardDescription>
              {t('setupProgressDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('overallProgress')}</span>
                <span className="text-sm text-muted-foreground">{t('tasksCompleted', { completed: completedTasks, total: tasks.length })}</span>
              </div>
              <Progress value={welcomeData?.onboardingProgress || 0} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('requiredTasks')}</span>
                <span className="text-sm text-muted-foreground">{t('tasksCompleted', { completed: completedRequiredTasks, total: requiredTasks.length })}</span>
              </div>
              <Progress value={(completedRequiredTasks / requiredTasks.length) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {welcomeData?.referralCode && (
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {t('yourReferralCode')}
                </CardTitle>
                <CardDescription>
                  {t('referralCodeDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                    {welcomeData.referralCode}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(welcomeData.referralCode, "Referral code")}
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
                  {t('yourReferralLink')}
                </CardTitle>
                <CardDescription>
                  {t('referralLinkDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono truncate">
                    {welcomeData.referralLink}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(welcomeData.referralLink, "Referral link")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Setup Tasks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {t('setupTasks')}
            </CardTitle>
            <CardDescription>
              {t('setupTasksDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {task.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{task.title}</h3>
                      {task.required && (
                        <Badge variant="secondary" className="text-xs">{t('required')}</Badge>
                      )}
                      {task.completed && (
                        <Badge variant="default" className="text-xs bg-green-600">{t('completed')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    
                    {!task.completed && task.action && (
                      <Button
                        size="sm"
                        onClick={() => handleTaskAction(task)}
                        className="mr-2"
                      >
                        {task.action}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Partnership Benefits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t('partnershipBenefits')}
            </CardTitle>
            <CardDescription>
              {t('partnershipBenefitsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('commissionEarnings')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('commissionEarningsDescription')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('marketingSupport')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('marketingSupportDescription')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t('analyticsDashboard')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('analyticsDashboardDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('needHelp')}
            </CardTitle>
            <CardDescription>
              {t('needHelpDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('emailSupport')}</p>
                  <p className="text-sm text-muted-foreground">partners@localpro.asia</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{t('phoneSupport')}</p>
                  <p className="text-sm text-muted-foreground">+63 2 1234 5678</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <a href="/partners/dashboard">
              {t('goToDashboard')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <a href="/partners/onboarding">
              {t('completeSetup')}
            </a>
          </Button>
        </div>
      </div>
      </div>
    </PartnerAccessGuard>
  );
}
