"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  Clock,
  AlertCircle,
  Award,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  DollarSign,
  Star,
  Trophy,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'referrals' | 'revenue' | 'conversion' | 'engagement' | 'custom';
  target: number;
  current: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'paused' | 'failed';
  priority: 'low' | 'medium' | 'high';
  category: 'business' | 'personal' | 'team' | 'growth';
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

interface Milestone {
  id: string;
  title: string;
  target: number;
  achieved: boolean;
  achievedDate?: string;
}

interface GoalProgress {
  goalId: string;
  progress: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  lastUpdated: string;
}

const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Monthly Referral Target',
    description: 'Achieve 50 new referrals this month',
    type: 'referrals',
    target: 50,
    current: 32,
    unit: 'referrals',
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'active',
    priority: 'high',
    category: 'business',
    milestones: [
      { id: '1', title: '25 referrals', target: 25, achieved: true, achievedDate: '2024-01-15' },
      { id: '2', title: '50 referrals', target: 50, achieved: false }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'Revenue Growth',
    description: 'Generate ₱100,000 in commission revenue',
    type: 'revenue',
    target: 100000,
    current: 67500,
    unit: '₱',
    period: 'quarterly',
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    status: 'active',
    priority: 'high',
    category: 'business',
    milestones: [
      { id: '1', title: '₱50,000', target: 50000, achieved: true, achievedDate: '2024-02-15' },
      { id: '2', title: '₱75,000', target: 75000, achieved: false },
      { id: '3', title: '₱100,000', target: 100000, achieved: false }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20'
  },
  {
    id: '3',
    title: 'Conversion Rate Improvement',
    description: 'Improve referral conversion rate to 15%',
    type: 'conversion',
    target: 15,
    current: 12.5,
    unit: '%',
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'active',
    priority: 'medium',
    category: 'growth',
    milestones: [
      { id: '1', title: '10% conversion', target: 10, achieved: true, achievedDate: '2024-01-10' },
      { id: '2', title: '15% conversion', target: 15, achieved: false }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20'
  },
  {
    id: '4',
    title: 'Social Media Engagement',
    description: 'Increase social media engagement by 200%',
    type: 'engagement',
    target: 200,
    current: 150,
    unit: '%',
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'active',
    priority: 'low',
    category: 'personal',
    milestones: [
      { id: '1', title: '100% increase', target: 100, achieved: true, achievedDate: '2024-01-12' },
      { id: '2', title: '200% increase', target: 200, achieved: false }
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-20'
  }
];

export default function GoalsPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const loadGoals = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          setGoals(mockGoals);
        } catch (error) {
          console.error('Error loading goals:', error);
          toast({
            variant: "destructive",
            title: "Error Loading Goals",
            description: "Failed to load your goals. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadGoals();
  }, [user, userRole]);

  const handleCreateGoal = () => {
    setShowCreateForm(true);
    // In a real app, this would open a modal or form
    toast({
      title: "Create New Goal",
      description: "This would open the goal creation form.",
    });
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    // In a real app, this would open an edit form
    toast({
      title: "Edit Goal",
      description: `Editing goal: ${goal.title}`,
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    // In a real app, this would show a confirmation dialog
    toast({
      title: "Delete Goal",
      description: "This would delete the goal after confirmation.",
    });
  };

  const handleUpdateProgress = (goalId: string, newProgress: number) => {
    setGoals(prev => 
      prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, current: newProgress, updatedAt: new Date().toISOString() }
          : goal
      )
    );
    toast({
      title: "Progress Updated",
      description: "Goal progress has been updated successfully.",
    });
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'referrals': return <Users className="h-4 w-4" />;
      case 'revenue': return <DollarSign className="h-4 w-4" />;
      case 'conversion': return <TrendingUp className="h-4 w-4" />;
      case 'engagement': return <Star className="h-4 w-4" />;
      case 'custom': return <Target className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'paused': return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredGoals = goals.filter(goal => {
    const matchesPeriod = selectedPeriod === 'all' || goal.period === selectedPeriod;
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    return matchesPeriod && matchesStatus;
  });

  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  const totalProgress = activeGoals.length > 0 
    ? activeGoals.reduce((sum, goal) => sum + calculateProgress(goal), 0) / activeGoals.length 
    : 0;


  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Goals Management</h1>
        <p className="text-muted-foreground">
          Set, track, and achieve your partnership goals
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals.length}</div>
            <p className="text-xs text-muted-foreground">
              Goals achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across active goals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0 ? ((completedGoals.length / goals.length) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Goals completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Overview
          </CardTitle>
          <CardDescription>
            Track your progress across all active goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeGoals.map((goal) => {
              const progress = calculateProgress(goal);
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getGoalIcon(goal.type)}
                      <span className="font-medium">{goal.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {progress.toFixed(1)}% complete
                    </span>
                    <span className="text-muted-foreground">
                      {goal.target - goal.current} {goal.unit} remaining
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Goals Management */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Goals</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleCreateGoal}>
              <Plus className="h-4 w-4 mr-2" />
              New Goal
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals.map((goal) => {
              const progress = calculateProgress(goal);
              return (
                <Card key={goal.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getGoalIcon(goal.type)}
                        <div>
                          <CardTitle className="text-lg line-clamp-2">{goal.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {goal.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(goal.status)}`}>
                          {goal.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{goal.current} {goal.unit}</span>
                        <span>{goal.target} {goal.unit}</span>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Milestones</h4>
                      <div className="space-y-1">
                        {goal.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center gap-2 text-sm">
                            {milestone.achieved ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className={milestone.achieved ? 'line-through text-muted-foreground' : ''}>
                              {milestone.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditGoal(goal)}
                        className="flex-1"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals
              .filter(goal => goal.status === 'active')
              .map((goal) => {
                const progress = calculateProgress(goal);
                return (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getGoalIcon(goal.type)}
                          <div>
                            <CardTitle className="text-lg line-clamp-2">{goal.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {goal.description}
                            </CardDescription>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{goal.current} {goal.unit}</span>
                          <span>{goal.target} {goal.unit}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditGoal(goal)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals
              .filter(goal => goal.status === 'completed')
              .map((goal) => {
                const progress = calculateProgress(goal);
                return (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow border-green-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-green-500" />
                          <div>
                            <CardTitle className="text-lg line-clamp-2">{goal.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {goal.description}
                            </CardDescription>
                          </div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Final Progress</span>
                          <span className="text-sm text-green-600 font-medium">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{goal.current} {goal.unit}</span>
                          <span>{goal.target} {goal.unit}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditGoal(goal)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="paused" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoals
              .filter(goal => goal.status === 'paused')
              .map((goal) => {
                const progress = calculateProgress(goal);
                return (
                  <Card key={goal.id} className="hover:shadow-md transition-shadow border-yellow-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getGoalIcon(goal.type)}
                          <div>
                            <CardTitle className="text-lg line-clamp-2">{goal.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {goal.description}
                            </CardDescription>
                          </div>
                        </div>
                        <Minus className="h-5 w-5 text-yellow-500" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={progress} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{goal.current} {goal.unit}</span>
                          <span>{goal.target} {goal.unit}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditGoal(goal)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Goal Setting Tips
          </CardTitle>
          <CardDescription>
            Best practices for setting and achieving your partnership goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">SMART Goals</h4>
              <p className="text-sm text-muted-foreground">
                Make your goals Specific, Measurable, Achievable, Relevant, and Time-bound.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Regular Reviews</h4>
              <p className="text-sm text-muted-foreground">
                Review and adjust your goals regularly to stay on track.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Break Down Goals</h4>
              <p className="text-sm text-muted-foreground">
                Use milestones to break large goals into smaller, manageable steps.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Track Progress</h4>
              <p className="text-sm text-muted-foreground">
                Monitor your progress regularly and celebrate small wins.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PartnerAccessGuard>
  );
}
