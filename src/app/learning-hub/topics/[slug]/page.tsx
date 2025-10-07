'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Clock,
  Star,
  Tag,
  BookOpen,
  Users,
  Calendar,
  FileText,
  Video,
  Search,
  ChevronRight,
  CheckCircle,
  Target,
  MessageSquare
} from 'lucide-react';

interface TopicData {
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  lastUpdated: string;
  tags: string[];
  relatedTopics: string[];
  articles: {
    id: number;
    title: string;
    description: string;
    readTime: string;
    difficulty: string;
    isPopular: boolean;
    href: string;
  }[];
  tutorials: {
    id: number;
    title: string;
    description: string;
    duration: string;
    difficulty: string;
    topics: string[];
    href: string;
  }[];
  faq: {
    question: string;
    answer: string;
  }[];
  tips: {
    title: string;
    description: string;
    icon: React.ReactNode;
  }[];
}

const TopicPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from an API or database
  const topicsDatabase: Record<string, TopicData> = {
    'account-setup': {
      slug: 'account-setup',
      title: 'Account Setup',
      description: 'Complete guide to setting up your LocalPro account, including profile creation, verification, and initial configuration.',
      category: 'Getting Started',
      difficulty: 'Beginner',
      estimatedTime: '10 minutes',
      lastUpdated: '2024-01-15',
      tags: ['account', 'setup', 'profile', 'verification', 'onboarding'],
      relatedTopics: ['profile-optimization', 'payment-setup', 'security-settings'],
      articles: [
        {
          id: 1,
          title: 'How to Create Your LocalPro Account',
          description: 'Step-by-step guide to creating your account and completing initial setup',
          readTime: '5 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/account-creation'
        },
        {
          id: 2,
          title: 'Profile Setup Best Practices',
          description: 'Learn how to create an attractive and effective profile',
          readTime: '8 min read',
          difficulty: 'Beginner',
          isPopular: false,
          href: '/learning-hub/articles/profile-setup'
        },
        {
          id: 3,
          title: 'Account Verification Process',
          description: 'Understanding the verification process and requirements',
          readTime: '6 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/account-verification'
        }
      ],
      tutorials: [
        {
          id: 1,
          title: 'Complete Account Setup Tutorial',
          description: 'Video walkthrough of the entire account setup process',
          duration: '12 minutes',
          difficulty: 'Beginner',
          topics: ['Account Creation', 'Profile Setup', 'Verification'],
          href: '/learning-hub/tutorials/account-setup'
        }
      ],
      faq: [
        {
          question: 'What information do I need to create an account?',
          answer: 'You need a valid email address, phone number, and basic personal information. For service providers, you may also need business documents and certifications.'
        },
        {
          question: 'How long does account verification take?',
          answer: 'Account verification typically takes 1-3 business days. We review all submitted documents and information to ensure platform safety.'
        },
        {
          question: 'Can I change my account information later?',
          answer: 'Yes, you can update most account information through your profile settings. Some changes may require re-verification.'
        }
      ],
      tips: [
        {
          title: 'Use a Professional Email',
          description: 'Use a professional email address for better credibility',
          icon: <MessageSquare className="h-5 w-5" />
        },
        {
          title: 'Complete Your Profile',
          description: 'Fill out all profile sections for better visibility',
          icon: <Users className="h-5 w-5" />
        },
        {
          title: 'Upload Clear Photos',
          description: 'Use high-quality, clear photos for your profile',
          icon: <FileText className="h-5 w-5" />
        }
      ]
    },
    'payment-issues': {
      slug: 'payment-issues',
      title: 'Payment Issues',
      description: 'Troubleshooting guide for common payment problems, including failed transactions, refunds, and payment method issues.',
      category: 'Troubleshooting',
      difficulty: 'Beginner',
      estimatedTime: '8 minutes',
      lastUpdated: '2024-01-14',
      tags: ['payment', 'troubleshooting', 'refunds', 'transactions', 'billing'],
      relatedTopics: ['payment-security', 'billing-management', 'refund-process'],
      articles: [
        {
          id: 1,
          title: 'Payment Failed - What to Do',
          description: 'Step-by-step guide to resolving failed payment transactions',
          readTime: '4 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/payment-failed'
        },
        {
          id: 2,
          title: 'Understanding Refund Process',
          description: 'How refunds work and how to request them',
          readTime: '6 min read',
          difficulty: 'Beginner',
          isPopular: false,
          href: '/learning-hub/articles/refund-process'
        },
        {
          id: 3,
          title: 'Payment Method Not Working',
          description: 'Troubleshooting payment method issues',
          readTime: '5 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/payment-method-issues'
        }
      ],
      tutorials: [
        {
          id: 1,
          title: 'Payment Troubleshooting Guide',
          description: 'Video guide to resolving common payment issues',
          duration: '10 minutes',
          difficulty: 'Beginner',
          topics: ['Failed Payments', 'Refunds', 'Payment Methods'],
          href: '/learning-hub/tutorials/payment-troubleshooting'
        }
      ],
      faq: [
        {
          question: 'Why did my payment fail?',
          answer: 'Payment failures can occur due to insufficient funds, expired cards, or security restrictions. Check your payment method and try again.'
        },
        {
          question: 'How long do refunds take?',
          answer: 'Refunds typically process within 3-5 business days, depending on your payment method and bank processing times.'
        },
        {
          question: 'Can I use multiple payment methods?',
          answer: 'Yes, you can add and use multiple payment methods. You can set a default method for convenience.'
        }
      ],
      tips: [
        {
          title: 'Keep Payment Methods Updated',
          description: 'Ensure your payment methods are current and have sufficient funds',
          icon: <CheckCircle className="h-5 w-5" />
        },
        {
          title: 'Contact Support Early',
          description: 'Reach out to support if you encounter persistent payment issues',
          icon: <MessageSquare className="h-5 w-5" />
        },
        {
          title: 'Check Bank Statements',
          description: 'Review your bank statements to track payment status',
          icon: <FileText className="h-5 w-5" />
        }
      ]
    },
    'booking-problems': {
      slug: 'booking-problems',
      title: 'Booking Problems',
      description: 'Solutions for common booking issues including scheduling conflicts, cancellation problems, and booking errors.',
      category: 'Troubleshooting',
      difficulty: 'Beginner',
      estimatedTime: '6 minutes',
      lastUpdated: '2024-01-13',
      tags: ['booking', 'scheduling', 'cancellation', 'troubleshooting', 'calendar'],
      relatedTopics: ['booking-management', 'scheduling-tips', 'cancellation-policy'],
      articles: [
        {
          id: 1,
          title: 'Booking Not Confirmed',
          description: 'What to do when your booking is not confirmed',
          readTime: '3 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/booking-not-confirmed'
        },
        {
          id: 2,
          title: 'How to Cancel a Booking',
          description: 'Step-by-step guide to canceling bookings',
          readTime: '4 min read',
          difficulty: 'Beginner',
          isPopular: false,
          href: '/learning-hub/articles/cancel-booking'
        },
        {
          id: 3,
          title: 'Rescheduling Bookings',
          description: 'How to reschedule your appointments',
          readTime: '5 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/reschedule-booking'
        }
      ],
      tutorials: [
        {
          id: 1,
          title: 'Booking Management Tutorial',
          description: 'Complete guide to managing your bookings',
          duration: '8 minutes',
          difficulty: 'Beginner',
          topics: ['Booking Issues', 'Cancellations', 'Rescheduling'],
          href: '/learning-hub/tutorials/booking-management'
        }
      ],
      faq: [
        {
          question: 'Why can\'t I book a service?',
          answer: 'Booking issues can occur due to provider unavailability, payment problems, or technical issues. Check your payment method and try again.'
        },
        {
          question: 'Can I cancel a booking after confirmation?',
          answer: 'Yes, you can cancel bookings, but cancellation policies vary by provider. Check the specific terms when booking.'
        },
        {
          question: 'How do I reschedule a booking?',
          answer: 'You can reschedule through your booking management page or by contacting the provider directly.'
        }
      ],
      tips: [
        {
          title: 'Book in Advance',
          description: 'Book services in advance to secure your preferred time slots',
          icon: <Calendar className="h-5 w-5" />
        },
        {
          title: 'Check Provider Availability',
          description: 'Verify provider availability before booking',
          icon: <CheckCircle className="h-5 w-5" />
        },
        {
          title: 'Read Cancellation Policies',
          description: 'Understand cancellation policies before booking',
          icon: <FileText className="h-5 w-5" />
        }
      ]
    },
    'profile-management': {
      slug: 'profile-management',
      title: 'Profile Management',
      description: 'Complete guide to managing your LocalPro profile, including updates, privacy settings, and optimization tips.',
      category: 'Features & Functionality',
      difficulty: 'Intermediate',
      estimatedTime: '12 minutes',
      lastUpdated: '2024-01-12',
      tags: ['profile', 'management', 'optimization', 'privacy', 'settings'],
      relatedTopics: ['privacy-settings', 'profile-optimization', 'account-security'],
      articles: [
        {
          id: 1,
          title: 'Profile Optimization Guide',
          description: 'How to optimize your profile for better visibility',
          readTime: '8 min read',
          difficulty: 'Intermediate',
          isPopular: true,
          href: '/learning-hub/articles/profile-optimization'
        },
        {
          id: 2,
          title: 'Privacy Settings Management',
          description: 'Understanding and managing your privacy settings',
          readTime: '6 min read',
          difficulty: 'Beginner',
          isPopular: false,
          href: '/learning-hub/articles/privacy-settings'
        },
        {
          id: 3,
          title: 'Profile Photo Best Practices',
          description: 'Tips for choosing and uploading profile photos',
          readTime: '4 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/profile-photos'
        }
      ],
      tutorials: [
        {
          id: 1,
          title: 'Profile Management Masterclass',
          description: 'Complete guide to managing your profile effectively',
          duration: '15 minutes',
          difficulty: 'Intermediate',
          topics: ['Optimization', 'Privacy', 'Photos', 'Settings'],
          href: '/learning-hub/tutorials/profile-management'
        }
      ],
      faq: [
        {
          question: 'How often should I update my profile?',
          answer: 'Update your profile regularly, especially when your services, availability, or contact information changes.'
        },
        {
          question: 'Can I hide my profile from certain users?',
          answer: 'Yes, you can adjust privacy settings to control who can see your profile and contact information.'
        },
        {
          question: 'What makes a good profile photo?',
          answer: 'Use clear, professional photos that represent you or your business well. Avoid blurry or inappropriate images.'
        }
      ],
      tips: [
        {
          title: 'Keep Information Current',
          description: 'Regularly update your profile information',
          icon: <CheckCircle className="h-5 w-5" />
        },
        {
          title: 'Use Professional Photos',
          description: 'Choose high-quality, professional photos',
          icon: <FileText className="h-5 w-5" />
        },
        {
          title: 'Optimize for Search',
          description: 'Use relevant keywords in your profile description',
          icon: <Search className="h-5 w-5" />
        }
      ]
    },
    'security-settings': {
      slug: 'security-settings',
      title: 'Security Settings',
      description: 'Comprehensive guide to securing your LocalPro account, including password management, two-factor authentication, and privacy controls.',
      category: 'Security & Privacy',
      difficulty: 'Intermediate',
      estimatedTime: '10 minutes',
      lastUpdated: '2024-01-11',
      tags: ['security', 'privacy', 'authentication', 'password', 'settings'],
      relatedTopics: ['account-security', 'privacy-settings', 'data-protection'],
      articles: [
        {
          id: 1,
          title: 'Two-Factor Authentication Setup',
          description: 'How to enable and configure two-factor authentication',
          readTime: '5 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/2fa-setup'
        },
        {
          id: 2,
          title: 'Password Security Best Practices',
          description: 'Creating and managing secure passwords',
          readTime: '6 min read',
          difficulty: 'Beginner',
          isPopular: false,
          href: '/learning-hub/articles/password-security'
        },
        {
          id: 3,
          title: 'Privacy Controls Guide',
          description: 'Understanding and managing your privacy settings',
          readTime: '7 min read',
          difficulty: 'Intermediate',
          isPopular: true,
          href: '/learning-hub/articles/privacy-controls'
        }
      ],
      tutorials: [
        {
          id: 1,
          title: 'Account Security Setup',
          description: 'Complete guide to securing your account',
          duration: '12 minutes',
          difficulty: 'Intermediate',
          topics: ['2FA', 'Passwords', 'Privacy', 'Settings'],
          href: '/learning-hub/tutorials/account-security'
        }
      ],
      faq: [
        {
          question: 'How do I enable two-factor authentication?',
          answer: 'Go to your account settings, select Security, and follow the prompts to set up 2FA using an authenticator app or SMS.'
        },
        {
          question: 'What makes a strong password?',
          answer: 'A strong password should be at least 12 characters long, include numbers and symbols, and avoid common words or personal information.'
        },
        {
          question: 'Can I change my privacy settings anytime?',
          answer: 'Yes, you can adjust your privacy settings at any time through your account settings.'
        }
      ],
      tips: [
        {
          title: 'Enable Two-Factor Authentication',
          description: 'Add an extra layer of security to your account',
          icon: <CheckCircle className="h-5 w-5" />
        },
        {
          title: 'Use Unique Passwords',
          description: 'Create unique passwords for each account',
          icon: <Target className="h-5 w-5" />
        },
        {
          title: 'Review Privacy Settings',
          description: 'Regularly review and update your privacy settings',
          icon: <FileText className="h-5 w-5" />
        }
      ]
    },
    'mobile-app': {
      slug: 'mobile-app',
      title: 'Mobile App',
      description: 'Everything you need to know about the LocalPro mobile app, including features, troubleshooting, and optimization tips.',
      category: 'Features & Functionality',
      difficulty: 'Beginner',
      estimatedTime: '8 minutes',
      lastUpdated: '2024-01-10',
      tags: ['mobile', 'app', 'features', 'troubleshooting', 'optimization'],
      relatedTopics: ['app-features', 'mobile-troubleshooting', 'notifications'],
      articles: [
        {
          id: 1,
          title: 'Mobile App Features Guide',
          description: 'Complete overview of mobile app features',
          readTime: '6 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/mobile-features'
        },
        {
          id: 2,
          title: 'Mobile App Troubleshooting',
          description: 'Common mobile app issues and solutions',
          readTime: '5 min read',
          difficulty: 'Beginner',
          isPopular: false,
          href: '/learning-hub/articles/mobile-troubleshooting'
        },
        {
          id: 3,
          title: 'Push Notifications Setup',
          description: 'How to manage push notifications on mobile',
          readTime: '4 min read',
          difficulty: 'Beginner',
          isPopular: true,
          href: '/learning-hub/articles/push-notifications'
        }
      ],
      tutorials: [
        {
          id: 1,
          title: 'Mobile App Tutorial',
          description: 'Complete guide to using the LocalPro mobile app',
          duration: '10 minutes',
          difficulty: 'Beginner',
          topics: ['Features', 'Settings', 'Notifications', 'Troubleshooting'],
          href: '/learning-hub/tutorials/mobile-app'
        }
      ],
      faq: [
        {
          question: 'How do I download the mobile app?',
          answer: 'Download the LocalPro app from the App Store (iOS) or Google Play Store (Android).'
        },
        {
          question: 'Why is the app running slowly?',
          answer: 'Try closing other apps, restarting your device, or updating to the latest version of the app.'
        },
        {
          question: 'How do I enable push notifications?',
          answer: 'Go to your device settings, find the LocalPro app, and enable notifications. You can also manage notifications within the app.'
        }
      ],
      tips: [
        {
          title: 'Keep App Updated',
          description: 'Always use the latest version of the app',
          icon: <CheckCircle className="h-5 w-5" />
        },
        {
          title: 'Enable Notifications',
          description: 'Turn on push notifications for important updates',
          icon: <MessageSquare className="h-5 w-5" />
        },
        {
          title: 'Clear App Cache',
          description: 'Clear app cache if you experience issues',
          icon: <FileText className="h-5 w-5" />
        }
      ]
    }
  };

  useEffect(() => {
    // Simulate API call
    const fetchTopicData = () => {
      setLoading(true);
      setTimeout(() => {
        const data = topicsDatabase[slug];
        setTopicData(data || null);
        setLoading(false);
      }, 500);
    };

    fetchTopicData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto py-20 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading topic...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!topicData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto py-20 px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Topic Not Found</h1>
            <p className="text-xl text-muted-foreground mb-8">
              The topic you're looking for doesn't exist or has been moved.
            </p>
            <Button asChild>
              <Link href="/learning-hub" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Learning Hub</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/learning-hub" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Learning Hub</span>
                </Link>
              </Button>
            </div>
            
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <Badge variant="secondary" className="mb-4">
                  {topicData.category}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {topicData.title}
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {topicData.description}
                </p>
              </div>
            </div>

            {/* Topic Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{topicData.estimatedTime}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {topicData.difficulty}
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Updated {new Date(topicData.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {topicData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Related Articles</h2>
              <Badge variant="secondary">{topicData.articles.length} articles</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topicData.articles.map((article) => (
                <Card key={article.id} className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {article.difficulty}
                      </Badge>
                      {article.isPopular && (
                        <Badge variant="default" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      <Link href={article.href} className="hover:underline">
                        {article.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {article.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {article.readTime}
                      </div>
                      <Button variant="ghost" size="sm" asChild className="group-hover:bg-primary/10">
                        <Link href={article.href} className="flex items-center space-x-1">
                          <span>Read Article</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tutorials Section */}
      {topicData.tutorials.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Video Tutorials</h2>
                <Badge variant="secondary">{topicData.tutorials.length} tutorials</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topicData.tutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="hover:shadow-lg transition-all duration-300 group">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {tutorial.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {tutorial.duration}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        <Link href={tutorial.href} className="hover:underline">
                          {tutorial.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {tutorial.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {tutorial.topics.map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" asChild className="w-full group-hover:bg-primary/10">
                        <Link href={tutorial.href} className="flex items-center justify-center space-x-1">
                          <Video className="h-4 w-4" />
                          <span>Watch Tutorial</span>
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tips Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Pro Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topicData.tips.map((tip, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                      {tip.icon}
                    </div>
                    <CardTitle className="text-lg">{tip.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tip.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {topicData.faq.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Topics */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Related Topics</h2>
            <div className="flex flex-wrap gap-3">
              {topicData.relatedTopics.map((relatedTopic) => (
                <Button key={relatedTopic} variant="outline" asChild>
                  <Link href={`/learning-hub/topics/${relatedTopic}`} className="flex items-center space-x-2">
                    <span>{relatedTopic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Contact Support</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/learning-hub/all-articles" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Browse All Articles</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TopicPage;
