'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ArrowRight, Star, Calendar, DollarSign, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/lib/api';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  icon: React.ComponentType<any>;
  href?: string;
}

export default function CoachOnboarding() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachProfile, setCoachProfile] = useState<any>(null);
  const [coachRates, setCoachRates] = useState<any[]>([]);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role !== 'coach') {
      router.push('/login');
      return;
    }
    
    fetchCoachProfile();
  }, [user]);

  const fetchCoachProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch coach profile
      const profileResponse = await fetch(`${getApiUrl()}/api/coaches/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (profileResponse.ok) {
        const data = await profileResponse.json();
        setCoachProfile(data.coach);
        
        // Fetch coach rates
        try {
          const ratesResponse = await fetch(`${getApiUrl()}/api/payments/public/coaches/${user?.id}/rates`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (ratesResponse.ok) {
            const ratesData = await ratesResponse.json();
            setCoachRates(ratesData);
            updateOnboardingSteps(data.coach, ratesData);
          } else {
            updateOnboardingSteps(data.coach, []);
          }
        } catch (ratesError) {
          console.error('Error fetching coach rates:', ratesError);
          updateOnboardingSteps(data.coach, []);
        }
      }
    } catch (error) {
      console.error('Error fetching coach profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOnboardingSteps = (profile: any, rates: any[] = []) => {
    const onboardingSteps: OnboardingStep[] = [
      {
        id: 'profile_completion',
        title: 'Complete Your Profile',
        description: 'Add your bio, specialties, and professional information',
        completed: !!(profile?.bio && profile?.specialties?.length > 0 && profile?.qualifications),
        required: true,
        icon: User,
        href: '/coaches/profile'
      },
      {
        id: 'set_availability',
        title: 'Set Your Availability',
        description: 'Configure your schedule and available time slots',
        completed: !!(profile?.availability && profile?.availability.length > 0),
        required: true,
        icon: Calendar,
        href: '/coaches/availability'
      },
      {
        id: 'set_rates',
        title: 'Set Your Rates',
        description: 'Configure your hourly rates and payment preferences',
        completed: rates.length > 0 && rates.some(r => r.is_active),
        required: true,
        icon: DollarSign,
        href: '/coaches/profile'
      },
      {
        id: 'review_guidelines',
        title: 'Review Platform Guidelines',
        description: 'Familiarize yourself with coaching standards and policies',
        completed: false, // This would be tracked separately
        required: true,
        icon: Star,
        href: '/coaches/guidelines'
      }
    ];

    setSteps(onboardingSteps);
  };

  const getCompletionPercentage = () => {
    const completedSteps = steps.filter(step => step.completed).length;
    return Math.round((completedSteps / steps.length) * 100);
  };

  const getNextStep = () => {
    return steps.find(step => !step.completed && step.required);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();
  const nextStep = getNextStep();
  const isComplete = completionPercentage === 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to ACT Coaching For Life!
          </h1>
          <p className="text-lg text-gray-600">
            Let's get your coach profile set up so you can start helping clients
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Onboarding Progress</CardTitle>
                <CardDescription>
                  Complete these steps to activate your coach profile
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            
            {isComplete ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Onboarding Complete!</p>
                    <p className="text-sm text-green-700">
                      Your profile is ready and you can now start accepting client bookings.
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={() => router.push('/coaches')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            ) : nextStep ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-800">Next Step:</p>
                    <p className="text-sm text-blue-700">{nextStep.title}</p>
                  </div>
                  <Button 
                    onClick={() => router.push(nextStep.href || '/coaches')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Onboarding Steps */}
        <div className="grid gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card 
                key={step.id} 
                className={`transition-all duration-200 ${
                  step.completed 
                    ? 'bg-green-50 border-green-200' 
                    : step.required 
                    ? 'hover:shadow-md cursor-pointer' 
                    : 'opacity-75'
                }`}
                onClick={() => step.href && !step.completed && router.push(step.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${
                        step.completed 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          step.completed 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {step.title}
                          </h3>
                          {step.required && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {step.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                      
                      {step.href && !step.completed && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(step.href!);
                          }}
                        >
                          {step.completed ? 'Review' : 'Start'}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              Our support team is here to help you get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Getting Started Guide</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Learn the basics of using our platform and best practices for online coaching.
                </p>
                <Button variant="outline" size="sm">
                  View Guide
                </Button>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Contact Support</h4>
                <p className="text-sm text-green-700 mb-3">
                  Have questions? Our support team is available to help you succeed.
                </p>
                <Button variant="outline" size="sm">
                  Get Help
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skip Onboarding (for testing) */}
        {!isComplete && (
          <div className="text-center mt-8">
            <Button 
              variant="outline" 
              onClick={() => router.push('/coaches')}
              className="text-gray-500"
            >
              Skip for now (you can complete this later)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}