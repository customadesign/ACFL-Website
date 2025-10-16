'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiUrl } from '@/lib/api';
import { PhoneInput } from '@/components/PhoneInput';
import Footer from "@/components/Footer";
import NavbarLandingPage from '@/components/NavbarLandingPage';
import {
  BasicInformationStep,
  ProfessionalBackgroundStep,
  SpecializationStep,
  ApproachMethodsStep,
  EthicsBoundariesStep,
  CrisisManagementStep,
  AvailabilityStep,
  TechnologyStep,
  LanguagesStep,
  ReferencesStep,
  AgreementsStep
} from '@/components/CoachVerificationSteps';

// Define the form data structure
interface CoachApplicationData {
  // Basic Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  
  // Professional Background (Section 1)
  educationalBackground: string;
  educationalBackgroundOther?: string;
  coachingExperienceYears: string;
  professionalCertifications: string[];
  
  // Specialization & Expertise (Section 2)
  coachingExpertise: string[];
  coachingExpertiseOther?: string;
  ageGroupsComfortable: string[];
  actTrainingLevel: string;
  
  // Approach & Methodology (Section 3)
  coachingPhilosophy: string;
  coachingTechniques: string[];
  sessionStructure: string;
  
  // Professional Boundaries & Ethics (Section 4)
  scopeHandlingApproach: string;
  professionalDisciplineHistory: boolean;
  disciplineExplanation: string;
  boundaryMaintenanceApproach: string;
  boundaryMaintenanceOther?: string;
  
  // Crisis Management (Section 5)
  comfortableWithSuicidalThoughts: string;
  selfHarmProtocol: string;
  
  // Availability & Commitment (Section 6)
  weeklyHoursAvailable: string;
  preferredSessionLength: string;
  availabilityTimes: string[];
  
  // Technology & Communication (Section 7)
  videoConferencingComfort: string;
  internetConnectionQuality: string;
  
  // Languages & Cultural Competency (Section 8)
  languagesFluent: string[];
  
  // Professional References
  references: Array<{
    name: string;
    title: string;
    organization: string;
    email: string;
    phone: string;
  }>;
  
  // Agreement Statements
  agreementsAccepted: {
    termsOfService: boolean;
    confidentiality: boolean;
    scopeOfPractice: boolean;
    platformTerms: boolean;
    discretionaryApproval: boolean;
    professionalInsurance: boolean;
    responseTime: boolean;
    refundPolicy: boolean;
  };
}

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Contact details' },
  { id: 2, title: 'Professional Background', description: 'Education & experience' },
  { id: 3, title: 'Specialization', description: 'Areas of expertise' },
  { id: 4, title: 'Approach & Methods', description: 'Coaching philosophy' },
  { id: 5, title: 'Ethics & Boundaries', description: 'Professional standards' },
  { id: 6, title: 'Crisis Management', description: 'Safety protocols' },
  { id: 7, title: 'Availability', description: 'Schedule & commitment' },
  { id: 8, title: 'Technology', description: 'Technical requirements' },
  { id: 9, title: 'Languages', description: 'Cultural competency' },
  { id: 10, title: 'References', description: 'Professional contacts' },
  { id: 11, title: 'Agreements', description: 'Terms & conditions' },
];

export default function CoachVerificationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CoachApplicationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    educationalBackground: '',
    coachingExperienceYears: '',
    professionalCertifications: [],
    coachingExpertise: [],
    ageGroupsComfortable: [],
    actTrainingLevel: '',
    coachingPhilosophy: '',
    coachingTechniques: [],
    sessionStructure: '',
    scopeHandlingApproach: '',
    professionalDisciplineHistory: false,
    disciplineExplanation: '',
    boundaryMaintenanceApproach: '',
    comfortableWithSuicidalThoughts: '',
    selfHarmProtocol: '',
    weeklyHoursAvailable: '',
    preferredSessionLength: '',
    availabilityTimes: [],
    videoConferencingComfort: '',
    internetConnectionQuality: '',
    languagesFluent: [],
    references: [
      { name: '', title: '', organization: '', email: '', phone: '' },
      { name: '', title: '', organization: '', email: '', phone: '' }
    ],
    agreementsAccepted: {
      termsOfService: false,
      confidentiality: false,
      scopeOfPractice: false,
      platformTerms: false,
      discretionaryApproval: false,
      professionalInsurance: false,
      responseTime: false,
      refundPolicy: false,
    }
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof CoachApplicationData] as string[]), value]
        : (prev[field as keyof CoachApplicationData] as string[]).filter(item => item !== value)
    }));
  };

  const handleReferenceChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      )
    }));
  };

  const handleAgreementChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      agreementsAccepted: {
        ...prev.agreementsAccepted,
        [field]: checked
      }
    }));
  };

  const validateCurrentStep = () => {
    const newErrors: {[key: string]: string} = {};
    
    switch (currentStep) {
      case 1: // Basic Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else {
          const requirements = {
            length: formData.password.length >= 8,
            uppercase: /[A-Z]/.test(formData.password),
            lowercase: /[a-z]/.test(formData.password),
            number: /\d/.test(formData.password)
          };

          const unmet = [];
          if (!requirements.length) unmet.push('at least 8 characters');
          if (!requirements.uppercase) unmet.push('one uppercase letter');
          if (!requirements.lowercase) unmet.push('one lowercase letter');
          if (!requirements.number) unmet.push('one number');

          if (unmet.length > 0) {
            newErrors.password = `Password must contain ${unmet.join(', ')}`;
          }
        }

        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 2: // Professional Background
        if (!formData.educationalBackground) newErrors.educationalBackground = 'Educational background is required';
        if (!formData.coachingExperienceYears) newErrors.coachingExperienceYears = 'Experience level is required';
        break;
        
      case 3: // Specialization
        if (formData.coachingExpertise.length === 0) newErrors.coachingExpertise = 'Select at least one area of expertise';
        if (formData.coachingExpertise.length > 5) newErrors.coachingExpertise = 'Select maximum 5 areas of expertise';
        if (formData.ageGroupsComfortable.length === 0) newErrors.ageGroupsComfortable = 'Select at least one age group';
        if (!formData.actTrainingLevel) newErrors.actTrainingLevel = 'ACT training level is required';
        break;
        
      case 4: // Approach & Methods
        if (!formData.coachingPhilosophy.trim()) newErrors.coachingPhilosophy = 'Coaching philosophy is required';
        if (formData.coachingPhilosophy.length > 500) newErrors.coachingPhilosophy = 'Philosophy must be 500 characters or less';
        if (formData.coachingTechniques.length === 0) newErrors.coachingTechniques = 'Select at least one coaching technique';
        if (!formData.sessionStructure) newErrors.sessionStructure = 'Session structure preference is required';
        break;
        
      case 5: // Ethics & Boundaries
        if (!formData.scopeHandlingApproach.trim()) newErrors.scopeHandlingApproach = 'Scope handling approach is required';
        if (formData.scopeHandlingApproach.length > 1000) newErrors.scopeHandlingApproach = 'Response must be 1000 characters or less';
        if (formData.professionalDisciplineHistory && !formData.disciplineExplanation.trim()) {
          newErrors.disciplineExplanation = 'Please explain the disciplinary history';
        }
        if (!formData.boundaryMaintenanceApproach) newErrors.boundaryMaintenanceApproach = 'Boundary maintenance approach is required';
        break;
        
      case 6: // Crisis Management
        if (!formData.comfortableWithSuicidalThoughts) newErrors.comfortableWithSuicidalThoughts = 'Please select your comfort level';
        if (!formData.selfHarmProtocol.trim()) newErrors.selfHarmProtocol = 'Self-harm protocol is required';
        if (formData.selfHarmProtocol.length > 1000) newErrors.selfHarmProtocol = 'Response must be 1000 characters or less';
        break;
        
      case 7: // Availability
        if (!formData.weeklyHoursAvailable) newErrors.weeklyHoursAvailable = 'Weekly hours availability is required';
        if (!formData.preferredSessionLength) newErrors.preferredSessionLength = 'Preferred session length is required';
        if (formData.availabilityTimes.length === 0) newErrors.availabilityTimes = 'Select at least one availability time';
        break;
        
      case 8: // Technology
        if (!formData.videoConferencingComfort) newErrors.videoConferencingComfort = 'Video conferencing comfort level is required';
        if (!formData.internetConnectionQuality) newErrors.internetConnectionQuality = 'Internet connection quality is required';
        break;
        
      case 9: // Languages
        if (formData.languagesFluent.length === 0) newErrors.languagesFluent = 'Select at least one language';
        break;
        
      case 10: // References
        formData.references.forEach((ref, index) => {
          if (!ref.name.trim()) newErrors[`reference${index}Name`] = `Reference ${index + 1} name is required`;
          if (!ref.title.trim()) newErrors[`reference${index}Title`] = `Reference ${index + 1} title is required`;
          if (!ref.organization.trim()) newErrors[`reference${index}Organization`] = `Reference ${index + 1} organization is required`;
          if (!ref.email.trim()) newErrors[`reference${index}Email`] = `Reference ${index + 1} email is required`;
          else if (!/\S+@\S+\.\S+/.test(ref.email)) newErrors[`reference${index}Email`] = `Reference ${index + 1} email is invalid`;
        });
        break;
        
      case 11: // Agreements
        const requiredAgreements = Object.keys(formData.agreementsAccepted);
        const unacceptedAgreements = requiredAgreements.filter(
          key => !formData.agreementsAccepted[key as keyof typeof formData.agreementsAccepted]
        );
        if (unacceptedAgreements.length > 0) {
          newErrors.agreements = 'All agreements must be accepted to proceed';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/coach-applications/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Application submission failed');
      }

      const data = await response.json();

      // Redirect to pending approval page with email
      router.push(`/register/coach/pending?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Application submission failed' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInformationStep formData={formData} onChange={handleInputChange} errors={errors} />;
      case 2:
        return <ProfessionalBackgroundStep formData={formData} onChange={handleInputChange} onArrayChange={handleArrayChange} errors={errors} />;
      case 3:
        return <SpecializationStep formData={formData} onChange={handleInputChange} onArrayChange={handleArrayChange} errors={errors} />;
      case 4:
        return <ApproachMethodsStep formData={formData} onChange={handleInputChange} onArrayChange={handleArrayChange} errors={errors} />;
      case 5:
        return <EthicsBoundariesStep formData={formData} onChange={handleInputChange} errors={errors} />;
      case 6:
        return <CrisisManagementStep formData={formData} onChange={handleInputChange} errors={errors} />;
      case 7:
        return <AvailabilityStep formData={formData} onChange={handleInputChange} onArrayChange={handleArrayChange} errors={errors} />;
      case 8:
        return <TechnologyStep formData={formData} onChange={handleInputChange} errors={errors} />;
      case 9:
        return <LanguagesStep formData={formData} onArrayChange={handleArrayChange} errors={errors} />;
      case 10:
        return <ReferencesStep formData={formData} onChange={handleReferenceChange} errors={errors} />;
      case 11:
        return <AgreementsStep formData={formData} onChange={handleAgreementChange} errors={errors} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>
      
      <div className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Coach Application</h1>
              <span className="text-sm text-gray-500">
                Step {currentStep} of {STEPS.length}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between mt-2">
              {STEPS.map((step) => (
                <div 
                  key={step.id}
                  className={`text-xs text-center ${
                    step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                    step.id <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}>
                    {step.id}
                  </div>
                  <div className="hidden sm:block">{step.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1]?.title}</CardTitle>
              <CardDescription>{STEPS[currentStep - 1]?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
                  {errors.submit}
                </div>
              )}
              
              {renderStepContent()}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep === STEPS.length ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </Button>
                ) : (
                  <Button
                    onClick={nextStep}
                  >
                    Next
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
