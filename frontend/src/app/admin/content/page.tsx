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
import { toast } from 'react-toastify';

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
  blog: {
    icon: PenTool,
    name: 'Blog Page',
    sections: [
      {
        id: 'hero',
        title: 'Hero Section',
        fields: [
          { name: 'title', label: 'Article Title', type: 'text', placeholder: 'Understanding acceptance and commitment in personal growth' },
          { name: 'breadcrumbPrimary', label: 'Breadcrumb Primary', type: 'text', placeholder: 'Blog' },
          { name: 'breadcrumbSecondary', label: 'Breadcrumb Secondary', type: 'text', placeholder: 'ACT Insights' },
          { name: 'authorName', label: 'Author Name', type: 'text', placeholder: 'Sarah Thompson' },
          { name: 'authorAvatarUrl', label: 'Author Avatar URL', type: 'text', placeholder: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop' },
          { name: 'publishDate', label: 'Publish Date', type: 'text', placeholder: '15 Mar 2024' },
          { name: 'readTime', label: 'Read Time', type: 'text', placeholder: '5 min read' },
          { name: 'featuredImageUrl', label: 'Featured Image URL', type: 'text', placeholder: 'https://example.com/featured.jpg' },
          { name: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Insights, tips, and stories from our coaching community' }
        ]
      },
      {
        id: 'article',
        title: 'Article Section',
        fields: [
          { name: 'content', label: 'Article Content (HTML allowed)', type: 'rich_text', placeholder: '<p>Your article content here...</p>' },
          { name: 'tags', label: 'Tags', type: 'array', description: 'Enter one tag per line' }
        ]
      }
    ]
  },
} as const;

type PageKey = keyof typeof PAGE_TEMPLATES;

export default function ContentManagement() {
  const [selectedPage, setSelectedPage] = useState<PageKey>('blog');
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
          // Default seed for blog article content
          if (selectedPage === 'blog') {
            const defaultArticleHtml = (
              `<p>Acceptance is a journey, not a destination. In the landscape of personal growth, we often struggle against our inner experiences, believing that fighting will bring peace. But what if true strength lies in embracing our thoughts and feelings, not battling them?</p>
<p>Acceptance and Commitment Therapy (ACT) offers a unique approach to mental wellness. It teaches us that pain is an inevitable part of human experience. Our suffering increases when we resist what cannot be changed. Instead, ACT guides us to accept our emotions, thoughts, and circumstances while committing to actions aligned with our core values.</p>
<p>Imagine your mind as a vast ocean. Thoughts are waves that come and go. Traditional therapy might teach you to calm the waves. ACT teaches you to become a skilled navigator, riding those waves with purpose and resilience.</p>
<p>The core of ACT revolves around six key processes: psychological flexibility, cognitive defusion, acceptance, contact with the present moment, values, and committed action. These aren't just theoretical concepts but practical skills that transform how we engage with life's challenges.</p>
<p>Cognitive defusion helps us see thoughts as mental events, not absolute truths. Acceptance allows us to experience emotions without being consumed by them. Connecting with the present moment grounds us in reality, not hypothetical fears or regrets.</p>
<p>Values become our compass. They are the deeply held principles that give meaning to our actions. When we align our behaviors with these values, we create a life of purpose and authenticity.</p>
<p>Committed action is where theory meets practice. It's about taking meaningful steps towards our goals, even when discomfort or fear tries to hold us back. Small, consistent actions build resilience and create lasting change.</p>
<p>Personal growth isn't about eliminating negative experiences. It's about developing the capacity to move forward despite them. ACT empowers individuals to live fully, embracing both joy and challenge with equal courage.</p>
<p>Remember, healing is not linear. Some days will feel easier than others. The practice of acceptance is itself a form of strength. By learning to be with our experiences rather than fighting them, we open the door to genuine transformation.</p>`
            );
            setFormData({
              hero: {},
              article: {
                content: defaultArticleHtml,
                tags: []
              }
            });
          } else {
            setFormData({});
          }
        }
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (sectionId: string, fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldName]: value
      }
    }));
  };

  const toggleEditSection = (sectionId: string) => {
    setEditingSections((prev: Set<string>) => {
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
        setFormData((prev: any) => ({
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
        toast.success('Content updated successfully');
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Error saving content. Please try again.');
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
        toast.success(`Page ${pageContent?.is_published ? 'unpublished' : 'published'}`);
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
        const statFields = [
          {key: 'livesChanged', label: 'Lives Changed', suffix: '+'},
          {key: 'certifiedCoaches', label: 'Certified Coaches', suffix: '+'},
          {key: 'satisfaction', label: 'Satisfaction Rate', suffix: '%'},
          {key: 'countries', label: 'Countries', suffix: ''}
        ];

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
  const templateEntries = Object.entries(PAGE_TEMPLATES) as [PageKey, (typeof PAGE_TEMPLATES)[PageKey]][];

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
          {templateEntries.map(([key, template]) => {
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
          {(currentTemplate.sections as unknown as PageSection[]).map((section: PageSection) => {
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
                      {section.fields.map((field: any) => (
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
                        {section.fields.map((field: any) => (
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