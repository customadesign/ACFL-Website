// Default content for CMS fields to show users what the data structure looks like
// This helps prevent empty forms and provides examples

export const defaultPricingPlans = [
  {
    id: "monthly",
    name: "Monthly Sessions",
    description: "Perfect for ongoing support",
    price: 99.95,
    sessions: 2,
    popular: false,
    features: [
      "2 x 50-minute sessions monthly",
      "Qualified ACT coach matching",
      "Unlimited messaging support",
      "Flexible scheduling",
      "Progress tracking tools",
      "24/7 platform access"
    ]
  },
  {
    id: "weekly",
    name: "Weekly Sessions",
    description: "Intensive transformation support",
    price: 149.95,
    sessions: 4,
    popular: true,
    features: [
      "4 x 50-minute sessions monthly",
      "Priority coach matching",
      "Unlimited messaging support",
      "Flexible scheduling",
      "Advanced progress tracking",
      "Priority support & booking"
    ]
  }
];

export const defaultFAQItems = [
  {
    id: "1",
    question: "What is ACT coaching and how does it work?",
    answer: "ACT (Acceptance and Commitment Therapy) coaching helps you develop psychological flexibility by learning to accept difficult thoughts and feelings while committing to actions aligned with your values. Our coaches guide you through evidence-based techniques in personalized sessions."
  },
  {
    id: "2",
    question: "How long does each coaching session last?",
    answer: "Each coaching session lasts 50 minutes, giving you ample time to explore your challenges, practice new skills, and develop action plans with your coach."
  },
  {
    id: "3",
    question: "Can I switch coaches if needed?",
    answer: "Absolutely! We understand that finding the right coach fit is important. You can request a coach change at any time through your dashboard or by contacting our support team."
  }
];

export const defaultTeamMembers = [
  {
    id: "1",
    title: "Dr. Sarah Mitchell",
    description: "Founder & Lead Clinical Director with 15+ years in ACT therapy",
    icon: "User"
  },
  {
    id: "2",
    title: "Michael Chen",
    description: "Senior Coach specializing in workplace wellness and stress management",
    icon: "User"
  },
  {
    id: "3",
    title: "Dr. Emily Rodriguez",
    description: "Clinical Psychologist focused on anxiety and relationship coaching",
    icon: "User"
  }
];

export const defaultBenefits = [
  {
    id: "1",
    title: "Peer Support",
    description: "Connect with others on similar journeys and build lasting supportive relationships",
    icon: "Users"
  },
  {
    id: "2",
    title: "Shared Learning",
    description: "Learn from diverse perspectives and experiences within the group setting",
    icon: "Target"
  },
  {
    id: "3",
    title: "Cost Effective",
    description: "Access high-quality ACT coaching at a more affordable rate than individual sessions",
    icon: "Heart"
  },
  {
    id: "4",
    title: "Group Dynamics",
    description: "Benefit from group accountability and motivation to achieve your goals",
    icon: "Brain"
  }
];

export const defaultCareerBenefits = [
  {
    id: "1",
    title: "Make a Real Impact",
    description: "Help people transform their lives through evidence-based ACT coaching",
    icon: "Heart"
  },
  {
    id: "2",
    title: "Professional Growth",
    description: "Continuous learning opportunities and career development support",
    icon: "Target"
  },
  {
    id: "3",
    title: "Flexible Work Environment",
    description: "Remote-first culture with flexible schedules and work-life balance",
    icon: "Users"
  },
  {
    id: "4",
    title: "Competitive Benefits",
    description: "Health insurance, retirement plans, and wellness programs",
    icon: "Shield"
  }
];

export const defaultCareerBenefitsList = [
  "Comprehensive health, dental, and vision insurance",
  "401(k) retirement plan with company matching",
  "Flexible paid time off and holidays",
  "Professional development budget",
  "Remote work flexibility",
  "Wellness programs and mental health support",
  "Employee assistance program",
  "Continuing education reimbursement"
];

export const defaultGroupPrograms = [
  {
    id: "1",
    title: "Anxiety & Stress Management",
    description: "Learn ACT techniques to manage anxiety and build resilience in a supportive group environment",
    duration: "8 weeks",
    size: "6-8 participants",
    schedule: "Weekly, 90 minutes"
  },
  {
    id: "2",
    title: "Values-Based Living",
    description: "Discover your core values and learn to live authentically with like-minded individuals",
    duration: "6 weeks",
    size: "8-10 participants",
    schedule: "Weekly, 75 minutes"
  },
  {
    id: "3",
    title: "Workplace Wellness",
    description: "Professional development group focused on psychological flexibility in work environments",
    duration: "10 weeks",
    size: "10-12 participants",
    schedule: "Weekly, 60 minutes"
  }
];

export const defaultContactMethods = [
  {
    id: "1",
    title: "Email Support",
    description: "Get detailed answers to your questions within 24 hours",
    icon: "Mail"
  },
  {
    id: "2",
    title: "Live Chat",
    description: "Instant support during business hours for urgent matters",
    icon: "MessageCircle"
  },
  {
    id: "3",
    title: "Phone Support",
    description: "Speak directly with our support team for personalized assistance",
    icon: "Phone"
  },
  {
    id: "4",
    title: "Video Consultation",
    description: "Schedule a face-to-face consultation to discuss your needs",
    icon: "Video"
  }
];

export const defaultPressReleases = [
  {
    id: "1",
    title: "ACT Coaching For Life Raises $10M Series A to Expand Access to Mental Health Coaching",
    description: "Leading ACT-based coaching platform secures funding to democratize access to evidence-based mental health support.",
    date: "January 15, 2024",
    link: "#"
  },
  {
    id: "2",
    title: "New Study Shows 87% Improvement in Client Outcomes Using ACT Methodology",
    description: "Independent research validates the effectiveness of our personalized coaching approach.",
    date: "December 1, 2023",
    link: "#"
  },
  {
    id: "3",
    title: "ACT Coaching For Life Partners with Major Corporations for Employee Wellness Programs",
    description: "Fortune 500 companies adopt our platform to support employee mental health and wellbeing.",
    date: "October 20, 2023",
    link: "#"
  }
];

export const defaultMediaKitItems = [
  {
    id: "1",
    title: "Company Logos",
    description: "High-resolution logos in various formats (PNG, SVG, EPS)",
    size: "2.3 MB"
  },
  {
    id: "2",
    title: "Executive Bios",
    description: "Leadership team biographies and professional headshots",
    size: "1.8 MB"
  },
  {
    id: "3",
    title: "Company Fact Sheet",
    description: "Key statistics, milestones, and company information",
    size: "450 KB"
  },
  {
    id: "4",
    title: "Product Screenshots",
    description: "Platform interface and feature highlights in high resolution",
    size: "5.2 MB"
  }
];

export const defaultAwards = [
  {
    id: "1",
    title: "Best Mental Health Platform",
    description: "Recognized for innovation in digital mental health solutions",
    year: "2023",
    organization: "Digital Health Awards"
  },
  {
    id: "2",
    title: "Top Workplace Culture",
    description: "Awarded for exceptional remote work culture and employee satisfaction",
    year: "2023",
    organization: "Remote Work Association"
  },
  {
    id: "3",
    title: "Innovation in Therapy",
    description: "Acknowledged for advancing evidence-based therapeutic approaches",
    year: "2022",
    organization: "Psychology Today"
  },
  {
    id: "4",
    title: "Fastest Growing Startup",
    description: "Recognized for rapid growth and market impact",
    year: "2022",
    organization: "TechCrunch"
  }
];

export const defaultBlogPosts = [
  {
    id: "1",
    title: "Understanding ACT: A Beginner's Guide to Psychological Flexibility",
    description: "Learn the core principles of Acceptance and Commitment Therapy and how it can transform your mental health journey.",
    author: "Dr. Sarah Mitchell",
    date: "January 10, 2024",
    category: "ACT Fundamentals",
    readTime: "8 min read"
  },
  {
    id: "2",
    title: "5 Mindfulness Exercises You Can Do Anywhere",
    description: "Simple mindfulness techniques that fit into your busy schedule and help you stay present throughout the day.",
    author: "Michael Chen",
    date: "January 5, 2024",
    category: "Mindfulness",
    readTime: "5 min read"
  },
  {
    id: "3",
    title: "How to Identify Your Core Values and Live by Them",
    description: "A step-by-step guide to discovering what truly matters to you and aligning your actions with your values.",
    author: "Dr. Emily Rodriguez",
    date: "December 28, 2023",
    category: "Values",
    readTime: "12 min read"
  }
];

export const defaultJobPositions = [
  {
    id: "1",
    title: "Senior ACT Coach",
    description: "Join our team of expert coaches helping clients achieve psychological flexibility and personal growth.",
    location: "Remote",
    type: "Full-time",
    department: "Clinical"
  },
  {
    id: "2",
    title: "Frontend Developer",
    description: "Build beautiful, accessible user interfaces for our coaching platform using React and TypeScript.",
    location: "Remote",
    type: "Full-time",
    department: "Engineering"
  },
  {
    id: "3",
    title: "Customer Success Manager",
    description: "Help our clients succeed on their coaching journey through proactive support and guidance.",
    location: "Remote",
    type: "Full-time",
    department: "Customer Success"
  }
];

export const defaultCoreValues = [
  {
    id: "1",
    title: "Compassion",
    description: "We approach every interaction with empathy, understanding, and genuine care for human wellbeing",
    icon: "Heart"
  },
  {
    id: "2",
    title: "Evidence-Based",
    description: "All our methods are grounded in scientific research and proven psychological principles",
    icon: "Brain"
  },
  {
    id: "3",
    title: "Accessibility",
    description: "Quality mental health support should be available to everyone, regardless of background or circumstance",
    icon: "Users"
  },
  {
    id: "4",
    title: "Growth",
    description: "We believe in the human capacity for change, resilience, and continuous personal development",
    icon: "Target"
  }
];

export const defaultHelpCategories = [
  {
    id: "1",
    icon: "Users",
    title: "Getting Started",
    description: "Learn how to create an account and find your perfect coach",
    articles: ["How to sign up", "Finding the right coach", "Your first session", "Platform overview"]
  },
  {
    id: "2",
    icon: "CreditCard",
    title: "Billing & Subscriptions",
    description: "Manage your payments and subscription plans",
    articles: ["Pricing plans", "Payment methods", "Cancel subscription", "Refund policy"]
  },
  {
    id: "3",
    icon: "MessageCircle",
    title: "Coaching Sessions",
    description: "Everything about your coaching experience",
    articles: ["Scheduling sessions", "Preparing for coaching", "Session guidelines", "Changing coaches"]
  },
  {
    id: "4",
    icon: "Shield",
    title: "Privacy & Security",
    description: "How we protect your information",
    articles: ["Data security", "Confidentiality", "Account security", "Privacy settings"]
  },
  {
    id: "5",
    icon: "Book",
    title: "ACT Resources",
    description: "Learn more about ACT methodology",
    articles: ["What is ACT?", "Core principles", "Exercises & techniques", "Recommended reading"]
  },
  {
    id: "6",
    icon: "HelpCircle",
    title: "Troubleshooting",
    description: "Common issues and solutions",
    articles: ["Login problems", "Technical issues", "Video call quality", "Mobile app help"]
  }
];

export const defaultProcessSteps = [
  {
    id: "1",
    title: "Initial Assessment",
    description: "We evaluate your needs and match you with the most suitable group program",
    icon: "Clipboard"
  },
  {
    id: "2",
    title: "Group Formation",
    description: "Join a small, carefully curated group of participants with similar goals",
    icon: "Users"
  },
  {
    id: "3",
    title: "Weekly Sessions",
    description: "Participate in structured group sessions led by certified ACT coaches",
    icon: "Calendar"
  },
  {
    id: "4",
    title: "Ongoing Support",
    description: "Access resources and peer support between sessions for continuous growth",
    icon: "Heart"
  }
];

export const defaultTestimonials = [
  {
    id: "1",
    name: "Sarah M.",
    role: "Marketing Manager",
    content: "The group coaching experience was transformative. Learning alongside others facing similar challenges made me feel less alone and more motivated to change.",
    rating: 5
  },
  {
    id: "2",
    name: "David L.",
    role: "Teacher",
    content: "I was skeptical about group therapy at first, but the ACT approach and supportive environment helped me develop skills I use every day.",
    rating: 5
  },
  {
    id: "3",
    name: "Jennifer R.",
    role: "Healthcare Worker",
    content: "The combination of expert guidance and peer support was exactly what I needed. I've made lasting friendships and lasting changes.",
    rating: 5
  }
];

export const defaultCorporateServices = [
  {
    id: "1",
    title: "Executive Coaching",
    description: "One-on-one leadership coaching for C-level executives and senior managers",
    icon: "Crown"
  },
  {
    id: "2",
    title: "Team Workshops",
    description: "Group sessions focused on building psychological flexibility within teams",
    icon: "Users"
  },
  {
    id: "3",
    title: "Wellness Programs",
    description: "Comprehensive employee wellness initiatives using ACT principles",
    icon: "Heart"
  },
  {
    id: "4",
    title: "Organizational Assessments",
    description: "Evaluate and improve workplace culture and employee wellbeing",
    icon: "BarChart"
  }
];

export const defaultCaseStudies = [
  {
    id: "1",
    title: "Fortune 500 Tech Company",
    description: "Reduced employee burnout by 45% and increased engagement scores by 60% across 500+ employees",
    metrics: "45% reduction in burnout, 60% increase in engagement",
    timeframe: "12 months"
  },
  {
    id: "2",
    title: "Healthcare Organization",
    description: "Improved staff resilience and reduced turnover by 30% in high-stress hospital environment",
    metrics: "30% reduction in turnover, 25% improvement in resilience scores",
    timeframe: "8 months"
  },
  {
    id: "3",
    title: "Manufacturing Corporation",
    description: "Enhanced safety culture and reduced workplace accidents through mindfulness training",
    metrics: "35% reduction in incidents, 50% improvement in safety reporting",
    timeframe: "18 months"
  }
];

export const defaultFeatureComparison = [
  {
    id: "1",
    feature: "One-on-one coaching sessions",
    basic: true,
    premium: true,
    enterprise: true
  },
  {
    id: "2",
    feature: "24/7 messaging support",
    basic: false,
    premium: true,
    enterprise: true
  },
  {
    id: "3",
    feature: "Group coaching access",
    basic: false,
    premium: false,
    enterprise: true
  },
  {
    id: "4",
    feature: "Priority booking",
    basic: false,
    premium: true,
    enterprise: true
  }
];

export const defaultStatistics = {
  about: {
    livesChanged: 10000,
    certifiedCoaches: 150,
    satisfaction: 96,
    countries: 25
  },
  pricing: {
    clientsServed: 5000,
    successRate: 89,
    avgImprovement: 78,
    satisfaction: 94
  },
  groupCoaching: {
    groupsCompleted: 200,
    participants: 1800,
    completionRate: 92,
    averageRating: 4.9
  },
  corporateCoaching: {
    companiesServed: 150,
    employeesImpacted: 25000,
    satisfactionRate: 87,
    reducedTurnover: 35
  }
};

// Function to get default content based on field name and context
export const getDefaultContent = (fieldName: string, fieldType: string, pageContext?: string) => {
  switch (fieldType) {
    case 'pricing_plans':
      return defaultPricingPlans;

    case 'faq_builder':
      return defaultFAQItems;

    case 'array':
      switch (fieldName) {
        case 'items':
          if (pageContext === 'careers') return defaultCareerBenefitsList;
          return [];
        default:
          return [];
      }

    case 'stats_builder':
      if (pageContext === 'pricing') return defaultStatistics.pricing;
      if (pageContext === 'group-coaching') return defaultStatistics.groupCoaching;
      if (pageContext === 'corporate-coaching') return defaultStatistics.corporateCoaching;
      return defaultStatistics.about;

    case 'list_builder':
      switch (fieldName) {
        case 'members': return defaultTeamMembers;
        case 'benefits':
          if (pageContext === 'careers') return defaultCareerBenefits;
          return defaultBenefits;
        case 'programs': return defaultGroupPrograms;
        case 'methods': return defaultContactMethods;
        case 'releases': return defaultPressReleases;
        case 'items':
          if (pageContext === 'press') return defaultMediaKitItems;
          if (pageContext === 'awards') return defaultAwards;
          if (pageContext === 'about') return defaultCoreValues;
          return defaultCoreValues;
        case 'posts': return defaultBlogPosts;
        case 'positions': return defaultJobPositions;
        case 'categories': return defaultHelpCategories;
        case 'resources': return [];
        case 'testimonials': return defaultTestimonials;
        case 'services': return defaultCorporateServices;
        case 'steps': return defaultProcessSteps;
        case 'studies': return defaultCaseStudies;
        case 'features': return defaultFeatureComparison;
        default: return [];
      }

    default:
      return [];
  }
};