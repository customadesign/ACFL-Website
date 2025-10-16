'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getApiUrl } from '@/lib/api';
import NavbarLandingPage from '@/components/NavbarLandingPage';
import Footer from '@/components/Footer';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown,
  HelpCircle,
  MessageCircle
} from 'lucide-react';

interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
}

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  display_order: number;
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  category: {
    name: string;
    slug: string;
  };
}

export default function FAQPage() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterFAQs();
  }, [faqs, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await fetch(`${getApiUrl()}/api/content/public/faq/categories`);
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Fetch FAQ items
      const faqsResponse = await fetch(`${getApiUrl()}/api/content/public/faq/items`);
      if (faqsResponse.ok) {
        const faqsData = await faqsResponse.json();
        setFaqs(faqsData);
      }
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFAQs = () => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category_id === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower)
      );
    }

    setFilteredFaqs(filtered);
  };

  const toggleExpanded = (faqId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedItems(newExpanded);
  };

  const handleFeedback = async (faqId: string, helpful: boolean) => {
    try {
      await fetch(`${getApiUrl()}/api/content/public/faq/${faqId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ helpful })
      });
      
      // Update local state
      setFaqs(prev => prev.map(faq => {
        if (faq.id === faqId) {
          return {
            ...faq,
            helpful_count: helpful ? faq.helpful_count + 1 : faq.helpful_count,
            not_helpful_count: !helpful ? faq.not_helpful_count + 1 : faq.not_helpful_count
          };
        }
        return faq;
      }));
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <nav>
          <NavbarLandingPage />
        </nav>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-teal"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>

      <section className="py-20 flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 bg-brand-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-8 h-8 text-brand-teal" />
            </div>
            <h1 className="text-4xl font-bold text-ink-dark mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about ACT Coaching For Life. Can't find what you're looking for? Contact our support team.
            </p>
          </motion.div>

          {/* Search and Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 space-y-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-lg shadow-sm"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-brand-teal text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === category.id
                        ? 'bg-brand-teal text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* FAQ Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-ink-dark mb-2">
                  No FAQs found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or category filter'
                    : 'No FAQ items have been published yet'
                  }
                </p>
              </div>
            ) : (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleExpanded(faq.id)}
                    className="w-full px-6 py-6 text-left focus:outline-none focus:ring-2 focus:ring-brand-teal/20 rounded-2xl"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <h3 className="text-lg font-semibold text-ink-dark mb-2">
                          {faq.question}
                        </h3>
                        {faq.category && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-teal/10 text-brand-teal">
                            {faq.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {expandedItems.has(faq.id) ? (
                          <ChevronUp className="w-6 h-6 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {expandedItems.has(faq.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6"
                    >
                      <div className="border-t border-gray-100 pt-6">
                        <div className="prose prose-gray max-w-none mb-6">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {faq.answer}
                          </p>
                        </div>

                        {/* Feedback */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                          <span className="text-sm text-gray-500">
                            Was this helpful?
                          </span>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(faq.id, true);
                              }}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>{faq.helpful_count}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(faq.id, false);
                              }}
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              <span>{faq.not_helpful_count}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16"
          >
            <div className="bg-gradient-to-r from-brand-teal/10 to-blue-50 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-semibold text-ink-dark mb-2">
                Still have questions?
              </h3>
              <p className="text-gray-600 mb-6">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-lg transition-colors font-medium shadow-lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Support
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}