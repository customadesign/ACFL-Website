'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Check,
  HelpCircle,
  Users,
  Briefcase,
  Mail,
  Newspaper,
  BookOpen,
  PenTool,
  DollarSign,
  Users2,
  Building2
} from 'lucide-react';
import {
  PricingPlanBuilder,
  FAQBuilder,
  ListBuilder,
  StatisticsBuilder
} from '@/components/cms/VisualFormComponents';
import { getDefaultContent } from '@/lib/cms/defaultContent';

interface StaticContent {
  id: string;
  slug: string;
  title: string;
  content: string;
  content_type: string;
  is_published: boolean;
  display_order: number;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

interface PageSection {
  id: string;
  title: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'rich_text' | 'number' | 'array' | 'list_builder' | 'faq_builder' | 'pricing_plans' | 'stats_builder';
    placeholder?: string;
    description?: string;
  }>;
}

const PAGE_TEMPLATES = {
  help: {
    icon: HelpCircle,
    name: 'Help Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'How Can We Help You?' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Find answers to your questions...' }
        ]
      },
      {
        id: 'categories',
        title: 'Help Categories',
        fields: [
          {
            name: 'categories',
            label: 'Help Categories',
            type: 'list_builder',
            description: 'Array of category objects with title, description, icon, and articles'
          }
        ]
      },
      {
        id: 'contact',
        title: 'Contact Support Section',
        fields: [
          { name: 'title', label: 'Section Title', type: 'text', placeholder: 'Still Need Help?' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Our support team is here to assist you with any questions or concerns.' },
          { name: 'email', label: 'Support Email', type: 'text', placeholder: 'support@actcoachingforlife.com' },
          { name: 'phone', label: 'Support Phone', type: 'text', placeholder: '1-800-ACT-HELP' }
        ]
      }
    ]
  },
  about: {
    icon: Users,
    name: 'About Us Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'About ACT Coaching for Life' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'We\'re transforming lives through evidence-based Acceptance and Commitment Therapy coaching, helping people create meaningful change and live authentically.' }
        ]
      },
      {
        id: 'mission',
        title: 'Mission Section',
        fields: [
          { name: 'title', label: 'Mission Title', type: 'text', placeholder: 'Our Mission' },
          { name: 'content', label: 'Mission Content', type: 'rich_text', placeholder: 'At ACT Coaching for Life, we believe everyone deserves to live a life aligned with their values. Our mission is to make professional, evidence-based coaching accessible to anyone seeking meaningful change.' },
          { name: 'tagline', label: 'Tagline', type: 'text', placeholder: 'Compassionate, evidence-based care' }
        ]
      },
      {
        id: 'stats',
        title: 'Statistics',
        fields: [
          { name: 'stats', label: 'Page Statistics', type: 'stats_builder' }
        ]
      },
      {
        id: 'values',
        title: 'Core Values',
        fields: [
          { name: 'title', label: 'Values Title', type: 'text', placeholder: 'Our Core Values' },
          { name: 'subtitle', label: 'Values Subtitle', type: 'text', placeholder: 'These principles guide everything we do' },
          { name: 'items', label: 'Core Values', type: 'list_builder' }
        ]
      },
      {
        id: 'story',
        title: 'Our Story',
        fields: [
          { name: 'title', label: 'Story Title', type: 'text', placeholder: 'Our Story' },
          { name: 'content', label: 'Story Content', type: 'rich_text', placeholder: 'ACT Coaching for Life was founded with a simple yet powerful vision: to bridge the gap between those seeking personal growth and qualified ACT practitioners who could guide them.' }
        ]
      },
      {
        id: 'team',
        title: 'Leadership Team',
        fields: [
          { name: 'title', label: 'Team Title', type: 'text', placeholder: 'Meet Our Leadership' },
          { name: 'subtitle', label: 'Team Subtitle', type: 'text', placeholder: 'Dedicated professionals committed to your growth' },
          { name: 'members', label: 'Leadership Team', type: 'list_builder' }
        ]
      }
    ]
  },
  careers: {
    icon: Briefcase,
    name: 'Careers Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'Join Our Mission' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Be part of a team that\'s transforming mental health care through evidence-based ACT coaching.' }
        ]
      },
      {
        id: 'whyJoinUs',
        title: 'Why Join Us Section',
        fields: [
          { name: 'title', label: 'Section Title', type: 'text', placeholder: 'Why Join ACT Coaching For Life?' },
          { name: 'subtitle', label: 'Section Subtitle', type: 'text', placeholder: 'Join a mission-driven team making real impact in mental health' },
          { name: 'benefits', label: 'Why Join Us Benefits', type: 'list_builder' }
        ]
      },
      {
        id: 'openPositions',
        title: 'Open Positions',
        fields: [
          { name: 'title', label: 'Positions Title', type: 'text', placeholder: 'Open Positions' },
          { name: 'subtitle', label: 'Positions Subtitle', type: 'text', placeholder: 'Explore opportunities to grow your career while helping others' },
          { name: 'positions', label: 'Open Positions', type: 'list_builder' }
        ]
      },
      {
        id: 'benefitsSection',
        title: 'Benefits & Perks',
        fields: [
          { name: 'title', label: 'Benefits Title', type: 'text', placeholder: 'Benefits & Perks' },
          { name: 'subtitle', label: 'Benefits Subtitle', type: 'text', placeholder: 'We take care of our team so they can take care of our clients' },
          { name: 'items', label: 'Benefits List', type: 'array', description: 'Array of benefit strings' }
        ]
      }
    ]
  },
  contact: {
    icon: Mail,
    name: 'Contact Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'Get In Touch' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'We\'re here to help you on your journey to better mental health. Reach out to us anytime.' }
        ]
      },
      {
        id: 'contactMethods',
        title: 'Contact Methods',
        fields: [
          { name: 'title', label: 'Section Title', type: 'text', placeholder: 'How to Reach Us' },
          { name: 'subtitle', label: 'Section Subtitle', type: 'text', placeholder: 'Choose the method that works best for you' },
          { name: 'methods', label: 'Contact Methods', type: 'list_builder' }
        ]
      },
      {
        id: 'contactForm',
        title: 'Contact Form',
        fields: [
          { name: 'title', label: 'Form Title', type: 'text', placeholder: 'Send us a message' },
          { name: 'description', label: 'Form Description', type: 'text', placeholder: 'Fill out the form below and we\'ll get back to you within 24 hours' }
        ]
      },
      {
        id: 'officeInfo',
        title: 'Office Information',
        fields: [
          { name: 'title', label: 'Office Title', type: 'text', placeholder: 'Our Office' },
          { name: 'address', label: 'Office Address', type: 'textarea', placeholder: '123 Wellness Drive\nSuite 100\nMindful City, MC 12345' },
          { name: 'hours', label: 'Business Hours', type: 'textarea', placeholder: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed' }
        ]
      }
    ]
  },
  press: {
    icon: Newspaper,
    name: 'Press Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'Press Center' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Latest news and updates from ACT Coaching for Life' }
        ]
      },
      {
        id: 'pressReleases',
        title: 'Press Releases',
        fields: [
          { name: 'title', label: 'Section Title', type: 'text', placeholder: 'Latest News' },
          { name: 'releases', label: 'Press Releases', type: 'list_builder' }
        ]
      },
      {
        id: 'mediaKit',
        title: 'Media Kit',
        fields: [
          { name: 'title', label: 'Media Kit Title', type: 'text', placeholder: 'Media Kit' },
          { name: 'description', label: 'Media Kit Description', type: 'textarea', placeholder: 'Download our media assets, logos, and company information for your coverage.' },
          { name: 'items', label: 'Media Kit Items', type: 'list_builder' }
        ]
      },
      {
        id: 'awards',
        title: 'Awards & Recognition',
        fields: [
          { name: 'title', label: 'Awards Title', type: 'text', placeholder: 'Awards & Recognition' },
          { name: 'items', label: 'Awards & Recognition', type: 'list_builder' }
        ]
      }
    ]
  },
  resources: {
    icon: BookOpen,
    name: 'Resources Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'Resources' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Tools and resources to support your journey' }
        ]
      },
      {
        id: 'categories',
        title: 'Resource Categories',
        fields: [
          { name: 'title', label: 'Categories Title', type: 'text', placeholder: 'Browse Resources' },
          { name: 'categories', label: 'Resource Categories', type: 'list_builder' }
        ]
      },
      {
        id: 'featured',
        title: 'Featured Resources',
        fields: [
          { name: 'title', label: 'Featured Title', type: 'text', placeholder: 'Featured Resources' },
          { name: 'resources', label: 'Featured Resources', type: 'list_builder' }
        ]
      },
      {
        id: 'newsletter',
        title: 'Newsletter Signup',
        fields: [
          { name: 'title', label: 'Newsletter Title', type: 'text', placeholder: 'Stay Updated' },
          { name: 'description', label: 'Newsletter Description', type: 'textarea', placeholder: 'Get the latest resources, tips, and insights delivered directly to your inbox.' }
        ]
      }
    ]
  },
  blog: {
    icon: PenTool,
    name: 'Blog Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'Blog' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Insights, tips, and stories from our coaching community' }
        ]
      },
      {
        id: 'featured',
        title: 'Featured Posts',
        fields: [
          { name: 'title', label: 'Featured Title', type: 'text', placeholder: 'Featured Articles' },
          { name: 'posts', label: 'Featured Blog Posts', type: 'list_builder' }
        ]
      },
      {
        id: 'categories',
        title: 'Blog Categories',
        fields: [
          { name: 'title', label: 'Categories Title', type: 'text', placeholder: 'Categories' },
          { name: 'categories', label: 'Blog Categories', type: 'list_builder' }
        ]
      },
      {
        id: 'recentPosts',
        title: 'Recent Posts',
        fields: [
          { name: 'title', label: 'Recent Posts Title', type: 'text', placeholder: 'Latest Posts' },
          { name: 'posts', label: 'Recent Blog Posts', type: 'list_builder' }
        ]
      }
    ]
  },
  pricing: {
    icon: DollarSign,
    name: 'Pricing Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'Pricing Plans' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Choose the perfect plan for your coaching journey' }
        ]
      },
      {
        id: 'plans',
        title: 'Pricing Plans',
        fields: [
          { name: 'title', label: 'Plans Title', type: 'text', placeholder: 'Choose Your Plan' },
          { name: 'subtitle', label: 'Plans Subtitle', type: 'text', placeholder: 'Flexible options to fit your needs' },
          { name: 'plans', label: 'Pricing Plans', type: 'pricing_plans' }
        ]
      },
      {
        id: 'features',
        title: 'Features Comparison',
        fields: [
          { name: 'title', label: 'Features Title', type: 'text', placeholder: 'What\'s Included' },
          { name: 'features', label: 'Feature Comparison', type: 'list_builder' }
        ]
      },
      {
        id: 'faq',
        title: 'Pricing FAQ',
        fields: [
          { name: 'title', label: 'FAQ Title', type: 'text', placeholder: 'Frequently Asked Questions' },
          { name: 'items', label: 'FAQ Items', type: 'faq_builder' }
        ]
      },
      {
        id: 'guarantee',
        title: 'Money-Back Guarantee',
        fields: [
          { name: 'title', label: 'Guarantee Title', type: 'text', placeholder: 'Risk-Free Guarantee' },
          { name: 'description', label: 'Guarantee Description', type: 'textarea', placeholder: 'If you\'re not completely satisfied with your coaching experience, we\'ll refund your money.' },
          { name: 'period', label: 'Guarantee Period', type: 'text', placeholder: '30 days' }
        ]
      }
    ]
  },
  'group-coaching': {
    icon: Users2,
    name: 'Group Coaching Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'Group Coaching' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Connect, learn, and grow with others on a similar journey' }
        ]
      },
      {
        id: 'benefits',
        title: 'Benefits of Group Coaching',
        fields: [
          { name: 'title', label: 'Benefits Title', type: 'text', placeholder: 'Why Choose Group Coaching?' },
          { name: 'subtitle', label: 'Benefits Subtitle', type: 'text', placeholder: 'Experience the power of shared growth and mutual support' },
          { name: 'benefits', label: 'Group Benefits', type: 'list_builder' }
        ]
      },
      {
        id: 'howItWorks',
        title: 'How It Works',
        fields: [
          { name: 'title', label: 'Process Title', type: 'text', placeholder: 'How Group Coaching Works' },
          { name: 'steps', label: 'Process Steps', type: 'list_builder' }
        ]
      },
      {
        id: 'programs',
        title: 'Available Programs',
        fields: [
          { name: 'title', label: 'Programs Title', type: 'text', placeholder: 'Current Group Programs' },
          { name: 'programs', label: 'Group Programs', type: 'list_builder' }
        ]
      },
      {
        id: 'testimonials',
        title: 'Group Testimonials',
        fields: [
          { name: 'title', label: 'Testimonials Title', type: 'text', placeholder: 'What Participants Say' },
          { name: 'testimonials', label: 'Client Testimonials', type: 'list_builder' }
        ]
      }
    ]
  },
  corporate: {
    icon: Building2,
    name: 'Corporate Coaching Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Page Title', type: 'text', placeholder: 'Corporate Coaching Solutions' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Transform your organization with evidence-based coaching programs' }
        ]
      },
      {
        id: 'services',
        title: 'Corporate Services',
        fields: [
          { name: 'title', label: 'Services Title', type: 'text', placeholder: 'Our Corporate Services' },
          { name: 'services', label: 'Service Offerings', type: 'list_builder' }
        ]
      },
      {
        id: 'benefits',
        title: 'Business Benefits',
        fields: [
          { name: 'title', label: 'Benefits Title', type: 'text', placeholder: 'Why Invest in Employee Coaching?' },
          { name: 'benefits', label: 'Business Benefits', type: 'list_builder' }
        ]
      },
      {
        id: 'process',
        title: 'Implementation Process',
        fields: [
          { name: 'title', label: 'Process Title', type: 'text', placeholder: 'Our Implementation Process' },
          { name: 'steps', label: 'Implementation Steps', type: 'list_builder' }
        ]
      },
      {
        id: 'caseStudies',
        title: 'Case Studies',
        fields: [
          { name: 'title', label: 'Case Studies Title', type: 'text', placeholder: 'Success Stories' },
          { name: 'studies', label: 'Case Studies', type: 'list_builder' }
        ]
      },
      {
        id: 'contact',
        title: 'Contact Sales',
        fields: [
          { name: 'title', label: 'Contact Title', type: 'text', placeholder: 'Ready to Get Started?' },
          { name: 'description', label: 'Contact Description', type: 'textarea', placeholder: 'Contact our corporate team to discuss how we can help transform your organization.' },
          { name: 'email', label: 'Sales Email', type: 'text', placeholder: 'corporate@actcoachingforlife.com' },
          { name: 'phone', label: 'Sales Phone', type: 'text', placeholder: '1-800-ACT-CORP' }
        ]
      }
    ]
  }
};

export default function ContentManagement() {
  const [selectedPage, setSelectedPage] = useState<string>('help');
  const [pageContent, setPageContent] = useState<StaticContent | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSections, setEditingSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPageContent();
  }, [selectedPage]);

  const fetchPageContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiUrl()}/api/admin/content/content?content_type=${selectedPage}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const content = data[0]; // Get the first (and should be only) content for this page
        setPageContent(content);

        if (content && content.content) {
          try {
            setFormData(JSON.parse(content.content));
          } catch {
            setFormData({});
          }
        } else {
          setFormData({});
        }
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (sectionId: string, fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldName]: value
      }
    }));
  };

  const toggleEditSection = (sectionId: string) => {
    setEditingSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const cancelEditSection = (sectionId: string) => {
    // Reload original data for this section
    if (pageContent && pageContent.content) {
      try {
        const originalData = JSON.parse(pageContent.content);
        setFormData(prev => ({
          ...prev,
          [sectionId]: originalData[sectionId] || {}
        }));
      } catch {
        // Handle error silently
      }
    }
    toggleEditSection(sectionId);
  };

  const saveSection = async (sectionId: string) => {
    await handleSave();
    toggleEditSection(sectionId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const contentData = {
        title: `${PAGE_TEMPLATES[selectedPage].name}`,
        slug: selectedPage,
        content: JSON.stringify(formData),
        content_type: selectedPage,
        meta_description: formData.hero?.subtitle || '',
        is_published: pageContent?.is_published || true,
        display_order: 0
      };

      const url = pageContent?.id
        ? `${getApiUrl()}/api/admin/content/content/${pageContent.id}`
        : `${getApiUrl()}/api/admin/content/content`;

      const method = pageContent?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contentData)
      });

      if (response.ok) {
        const savedContent = await response.json();
        setPageContent(savedContent);
        alert('Content saved successfully!');
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublishStatus = async () => {
    if (!pageContent?.id) return;

    try {
      const response = await fetch(`${getApiUrl()}/api/admin/content/content/${pageContent.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_published: !pageContent.is_published
        })
      });

      if (response.ok) {
        setPageContent(prev => prev ? { ...prev, is_published: !prev.is_published } : null);
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  const renderReadOnlyField = (sectionId: string, field: any) => {
    const value = formData[sectionId]?.[field.name] || '';
    const displayValue = value || field.placeholder || 'No content';
    const isPlaceholder = !value && field.placeholder;

    // Display content in read-only mode
    switch (field.type) {
      case 'text':
        return (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className={`${value ? 'text-gray-900 dark:text-gray-100' : isPlaceholder ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 italic'}`}>
              {isPlaceholder ? displayValue : (value || <span className="text-gray-400 italic">No content</span>)}
            </p>
          </div>
        );

      case 'textarea':
      case 'rich_text':
        return (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className={`whitespace-pre-wrap ${value ? 'text-gray-900 dark:text-gray-100' : isPlaceholder ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 italic'}`}>
              {isPlaceholder ? displayValue : (value || <span className="text-gray-400 italic">No content</span>)}
            </p>
          </div>
        );

      case 'number':
        return (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-900 dark:text-gray-100 font-semibold">{value || 0}</p>
          </div>
        );

      case 'array':
        // Check for default content if array is empty
        let hasArrayContent = Array.isArray(value) && value.length > 0;
        let arrayDisplayText = 'No items';
        let isArrayDefault = false;

        if (!hasArrayContent) {
          // Try to get default content for empty arrays
          const defaultArrayItems = getDefaultContent(field.name, 'array', selectedPage);
          if (Array.isArray(defaultArrayItems) && defaultArrayItems.length > 0) {
            arrayDisplayText = `${defaultArrayItems.length} default items available`;
            hasArrayContent = true;
            isArrayDefault = true;
          }
        }

        return (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {Array.isArray(value) && value.length > 0 ? (
              <ul className="list-disc list-inside space-y-1">
                {value.map((item, idx) => (
                  <li key={idx} className="text-gray-900 dark:text-gray-100">{item}</li>
                ))}
              </ul>
            ) : isArrayDefault ? (
              <span className="text-blue-600 dark:text-blue-400">{arrayDisplayText}</span>
            ) : (
              <span className="text-gray-400 italic">{arrayDisplayText}</span>
            )}
          </div>
        );

      case 'pricing_plans':
      case 'faq_builder':
      case 'list_builder':
      case 'stats_builder':
        // Check if we have default content for empty list_builder fields
        let hasContent = Array.isArray(value) && value.length > 0;
        let itemCount = 0;
        let displayText = 'No content configured';

        if (hasContent) {
          itemCount = value.length;
          displayText = `${itemCount} items configured`;
        } else {
          // Try to get default content for various field types
          const defaultItems = getDefaultContent(field.name, field.type, selectedPage);
          if (Array.isArray(defaultItems) && defaultItems.length > 0) {
            itemCount = defaultItems.length;
            displayText = `${itemCount} default items available`;
            hasContent = true;
          } else if (typeof defaultItems === 'object' && defaultItems !== null && Object.keys(defaultItems).length > 0) {
            itemCount = Object.keys(defaultItems).length;
            displayText = `${itemCount} default fields available`;
            hasContent = true;
          }
        }

        // Check if value is an object with content (fallback)
        if (!hasContent && typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
          itemCount = Object.keys(value).length;
          displayText = `${itemCount} fields configured`;
          hasContent = true;
        }

        return (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className={hasContent ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 italic'}>
              {hasContent && !Array.isArray(value) && displayText.includes('default') ?
                <span className="text-blue-600 dark:text-blue-400">{displayText}</span> :
                displayText}
            </p>
          </div>
        );

      default:
        return (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-400 italic">No preview available</p>
          </div>
        );
    }
  };

  const renderField = (sectionId: string, field: any) => {
    const value = formData[sectionId]?.[field.name] || '';

    // Handle new specific field types
    switch (field.type) {
      case 'pricing_plans':
        return (
          <PricingPlanBuilder
            value={Array.isArray(value) ? value : []}
            onChange={(plans) => handleSectionChange(sectionId, field.name, plans)}
          />
        );

      case 'faq_builder':
        return (
          <FAQBuilder
            value={Array.isArray(value) ? value : []}
            onChange={(items) => handleSectionChange(sectionId, field.name, items)}
          />
        );

      case 'stats_builder':
        let statFields = [];
        if (selectedPage === 'pricing') {
          statFields = [
            {key: 'clientsServed', label: 'Clients Served', suffix: '+'},
            {key: 'successRate', label: 'Success Rate', suffix: '%'},
            {key: 'avgImprovement', label: 'Average Improvement', suffix: '%'},
            {key: 'satisfaction', label: 'Satisfaction Rate', suffix: '%'}
          ];
        } else if (selectedPage === 'group-coaching') {
          statFields = [
            {key: 'groupsCompleted', label: 'Groups Completed', suffix: '+'},
            {key: 'participants', label: 'Participants', suffix: '+'},
            {key: 'completionRate', label: 'Completion Rate', suffix: '%'},
            {key: 'averageRating', label: 'Average Rating', suffix: '/5'}
          ];
        } else if (selectedPage === 'corporate-coaching') {
          statFields = [
            {key: 'companiesServed', label: 'Companies Served', suffix: '+'},
            {key: 'employeesImpacted', label: 'Employees Impacted', suffix: '+'},
            {key: 'satisfactionRate', label: 'Satisfaction Rate', suffix: '%'},
            {key: 'reducedTurnover', label: 'Reduced Turnover', suffix: '%'}
          ];
        } else {
          statFields = [
            {key: 'livesChanged', label: 'Lives Changed', suffix: '+'},
            {key: 'certifiedCoaches', label: 'Certified Coaches', suffix: '+'},
            {key: 'satisfaction', label: 'Satisfaction Rate', suffix: '%'},
            {key: 'countries', label: 'Countries', suffix: ''}
          ];
        }

        return (
          <StatisticsBuilder
            value={typeof value === 'object' ? value : {}}
            onChange={(stats) => handleSectionChange(sectionId, field.name, stats)}
            fields={statFields}
            pageContext={selectedPage}
          />
        );

      case 'list_builder':
        let title = field.label || 'Items';
        let singular = 'Item';
        let showIcon = false;
        let showDescription = true;

        // Smart defaults based on field names
        if (field.name === 'categories') {
          singular = 'Category';
          showIcon = true;
        } else if (field.name === 'members') {
          singular = 'Team Member';
        } else if (field.name === 'positions') {
          singular = 'Position';
        } else if (field.name === 'benefits') {
          singular = 'Benefit';
        } else if (field.name === 'methods') {
          singular = 'Contact Method';
          showIcon = true;
        } else if (field.name === 'releases') {
          singular = 'Press Release';
          showDescription = false;
        } else if (field.name === 'resources') {
          singular = 'Resource';
        } else if (field.name === 'posts') {
          singular = 'Blog Post';
        } else if (field.name === 'programs') {
          singular = 'Program';
        } else if (field.name === 'testimonials') {
          singular = 'Testimonial';
        } else if (field.name === 'services') {
          singular = 'Service';
        } else if (field.name === 'steps') {
          singular = 'Step';
          showDescription = false;
        } else if (field.name === 'studies') {
          singular = 'Case Study';
        } else if (field.name === 'features') {
          singular = 'Feature';
          showDescription = false;
        }

        return (
          <ListBuilder
            value={Array.isArray(value) ? value : []}
            onChange={(items) => handleSectionChange(sectionId, field.name, items)}
            title={title}
            singular={singular}
            showIcon={showIcon}
            showDescription={showDescription}
            fieldName={field.name}
            pageContext={selectedPage}
          />
        );
    }

    // Default field rendering for basic types
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleSectionChange(sectionId, field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleSectionChange(sectionId, field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        );

      case 'rich_text':
        return (
          <textarea
            value={value}
            onChange={(e) => handleSectionChange(sectionId, field.name, e.target.value)}
            placeholder={field.placeholder || 'Enter rich text content (HTML supported)'}
            rows={6}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSectionChange(sectionId, field.name, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        );


      case 'array':
        return (
          <div>
            <textarea
              value={Array.isArray(value) ? value.join('\n') : ''}
              onChange={(e) => handleSectionChange(sectionId, field.name, e.target.value.split('\n').filter(line => line.trim()))}
              placeholder="Enter each item on a new line"
              rows={6}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white mb-1"
            />
            <p className="text-sm text-gray-500 mt-1 mb-2">Enter one item per line</p>
          </div>
        );


      default:
        return null;
    }
  };

  const currentTemplate = PAGE_TEMPLATES[selectedPage];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Content Management</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage content for public pages with structured editing
            </p>
          </div>
          <div className="flex items-center gap-4">
            {pageContent && (
              <button
                onClick={togglePublishStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  pageContent.is_published
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {pageContent.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {pageContent.is_published ? 'Published' : 'Draft'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Page Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select Page to Edit</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 mb-4">
          {Object.entries(PAGE_TEMPLATES).map(([key, template]) => {
            const IconComponent = template.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedPage(key)}
                className={`p-4 rounded-lg border transition-colors ${
                  selectedPage === key
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <IconComponent className={`w-6 h-6 mx-auto mb-2 ${
                  selectedPage === key ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <p className={`text-sm font-medium ${
                  selectedPage === key ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {template.name}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Editor */}
      {loading ? (
        <div className="flex items-center justify-center py-12 mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      ) : (
        <div className="space-y-6 mb-6">
          {currentTemplate.sections.map((section) => {
            const isEditing = editingSections.has(section.id);

            return (
              <div
                key={section.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all ${
                  isEditing
                    ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {section.title}
                      </h3>
                      {isEditing && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editing
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!isEditing ? (
                        <button
                          onClick={() => toggleEditSection(section.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm font-medium"
                        >
                          <Edit2 className="w-4 h-4 mr-1.5" />
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => saveSection(section.id)}
                            disabled={saving}
                            className="inline-flex items-center px-3 py-1.5 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            <Check className="w-4 h-4 mr-1.5" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => cancelEditSection(section.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-6">
                      {section.fields.map((field) => (
                        <div key={field.name} className="pb-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-1">
                            {field.label}
                          </label>
                          {renderField(section.id, field)}
                          {field.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{field.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      {section.fields.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            View mode - Click the Edit button to modify this section
                          </p>
                        </div>
                      )}
                      <div className="space-y-6">
                        {section.fields.map((field) => (
                          <div key={field.name} className="pb-2">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 mt-1">
                              {field.label}
                            </label>
                            {renderReadOnlyField(section.id, field)}
                            {field.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{field.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Page Status */}
      {pageContent && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {new Date(pageContent.updated_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}