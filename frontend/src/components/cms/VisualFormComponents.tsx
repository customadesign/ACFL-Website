'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Edit2, Check, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { getDefaultContent } from '@/lib/cms/defaultContent';

// Pricing Plan Builder Component
interface PricingPlan {
  id?: string;
  name: string;
  description: string;
  price: number;
  sessions: number;
  popular?: boolean;
  features: string[];
}

export const PricingPlanBuilder = ({
  value = [],
  onChange
}: {
  value: PricingPlan[];
  onChange: (plans: PricingPlan[]) => void;
}) => {
  const [plans, setPlans] = useState<PricingPlan[]>(value);

  // Initialize with default content if empty
  useEffect(() => {
    if (value.length === 0) {
      const defaultPlans = getDefaultContent('plans', 'pricing_plans') as PricingPlan[];
      setPlans(defaultPlans);
      onChange(defaultPlans);
    } else {
      setPlans(value);
    }
  }, [value, onChange]);

  const addPlan = () => {
    const newPlan: PricingPlan = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      sessions: 0,
      features: ['']
    };
    const updatedPlans = [...plans, newPlan];
    setPlans(updatedPlans);
    onChange(updatedPlans);
  };

  const updatePlan = (index: number, updates: Partial<PricingPlan>) => {
    const updatedPlans = plans.map((plan, i) =>
      i === index ? { ...plan, ...updates } : plan
    );
    setPlans(updatedPlans);
    onChange(updatedPlans);
  };

  const deletePlan = (index: number) => {
    const updatedPlans = plans.filter((_, i) => i !== index);
    setPlans(updatedPlans);
    onChange(updatedPlans);
  };

  const addFeature = (planIndex: number) => {
    const updatedPlans = [...plans];
    updatedPlans[planIndex].features.push('');
    setPlans(updatedPlans);
    onChange(updatedPlans);
  };

  const updateFeature = (planIndex: number, featureIndex: number, value: string) => {
    const updatedPlans = [...plans];
    updatedPlans[planIndex].features[featureIndex] = value;
    setPlans(updatedPlans);
    onChange(updatedPlans);
  };

  const deleteFeature = (planIndex: number, featureIndex: number) => {
    const updatedPlans = [...plans];
    updatedPlans[planIndex].features = updatedPlans[planIndex].features.filter((_, i) => i !== featureIndex);
    setPlans(updatedPlans);
    onChange(updatedPlans);
  };

  const clearAllPlans = () => {
    setPlans([]);
    onChange([]);
  };

  const resetToDefaults = () => {
    const defaultPlans = getDefaultContent('plans', 'pricing_plans') as PricingPlan[];
    setPlans(defaultPlans);
    onChange(defaultPlans);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pricing Plans</h3>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={clearAllPlans} size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={addPlan} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>
      </div>

      {plans.map((plan, planIndex) => (
        <Card key={plan.id || planIndex} className="relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-base">Plan {planIndex + 1}</CardTitle>
            </div>
            <Button
              onClick={() => deletePlan(planIndex)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Plan Name</label>
                <Input
                  value={plan.name}
                  onChange={(e) => updatePlan(planIndex, { name: e.target.value })}
                  placeholder="e.g., Monthly Sessions"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={plan.description}
                  onChange={(e) => updatePlan(planIndex, { description: e.target.value })}
                  placeholder="e.g., Perfect for ongoing support"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={plan.price}
                  onChange={(e) => updatePlan(planIndex, { price: parseFloat(e.target.value) || 0 })}
                  placeholder="99.95"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sessions per Month</label>
                <Input
                  type="number"
                  value={plan.sessions}
                  onChange={(e) => updatePlan(planIndex, { sessions: parseInt(e.target.value) || 0 })}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`popular-${planIndex}`}
                checked={plan.popular || false}
                onChange={(e) => updatePlan(planIndex, { popular: e.target.checked })}
                className="rounded"
              />
              <label htmlFor={`popular-${planIndex}`} className="text-sm font-medium">
                Mark as "Most Popular"
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Features</label>
                <Button
                  onClick={() => addFeature(planIndex)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(planIndex, featureIndex, e.target.value)}
                      placeholder="e.g., 2 x 50-minute sessions monthly"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => deleteFeature(planIndex, featureIndex)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {plans.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">No pricing plans yet</p>
            <Button onClick={addPlan} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// FAQ Builder Component
interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

export const FAQBuilder = ({
  value = [],
  onChange
}: {
  value: FAQItem[];
  onChange: (items: FAQItem[]) => void;
}) => {
  const [items, setItems] = useState<FAQItem[]>(value);

  // Initialize with default content if empty
  useEffect(() => {
    if (value.length === 0) {
      const defaultItems = getDefaultContent('items', 'faq_builder') as FAQItem[];
      setItems(defaultItems);
      onChange(defaultItems);
    } else {
      setItems(value);
    }
  }, [value, onChange]);

  const addItem = () => {
    const newItem: FAQItem = {
      id: Date.now().toString(),
      question: '',
      answer: ''
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const updateItem = (index: number, updates: Partial<FAQItem>) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const deleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const clearAllItems = () => {
    setItems([]);
    onChange([]);
  };

  const resetToDefaults = () => {
    const defaultItems = getDefaultContent('items', 'faq_builder') as FAQItem[];
    setItems(defaultItems);
    onChange(defaultItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">FAQ Items</h3>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={clearAllItems} size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      {items.map((item, index) => (
        <Card key={item.id || index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-base">FAQ {index + 1}</CardTitle>
            </div>
            <Button
              onClick={() => deleteItem(index)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <Input
                value={item.question}
                onChange={(e) => updateItem(index, { question: e.target.value })}
                placeholder="What is included in the coaching sessions?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Answer</label>
              <Textarea
                value={item.answer}
                onChange={(e) => updateItem(index, { answer: e.target.value })}
                placeholder="Each session includes..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">No FAQ items yet</p>
            <Button onClick={addItem} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First FAQ
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Generic List Builder for features, benefits, etc.
interface ListItem {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
  articles?: string[];
}

export const ListBuilder = ({
  value = [],
  onChange,
  title = "Items",
  singular = "Item",
  showIcon = false,
  showDescription = true,
  fieldName = "",
  pageContext = ""
}: {
  value: ListItem[];
  onChange: (items: ListItem[]) => void;
  title?: string;
  singular?: string;
  showIcon?: boolean;
  showDescription?: boolean;
  fieldName?: string;
  pageContext?: string;
}) => {
  const [items, setItems] = useState<ListItem[]>(value);

  // Initialize with default content if empty
  useEffect(() => {
    if (!value || value.length === 0) {
      const defaultItems = getDefaultContent(fieldName, 'list_builder', pageContext) as ListItem[];
      console.log(`ListBuilder: fieldName=${fieldName}, pageContext=${pageContext}, defaultItems:`, defaultItems);
      if (defaultItems.length > 0) {
        setItems(defaultItems);
        onChange(defaultItems);
      }
    } else {
      setItems(value);
    }
  }, [value, onChange, fieldName, pageContext]);

  const addItem = () => {
    const newItem: ListItem = {
      id: Date.now().toString(),
      title: '',
      description: showDescription ? '' : undefined,
      icon: showIcon ? '' : undefined,
      articles: (fieldName === 'categories') ? [] : undefined
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const updateItem = (index: number, updates: Partial<ListItem>) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, ...updates } : item
    );
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const deleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    onChange(updatedItems);
  };

  const clearAllItems = () => {
    setItems([]);
    onChange([]);
  };

  const resetToDefaults = () => {
    const defaultItems = getDefaultContent(fieldName, 'list_builder', pageContext) as ListItem[];
    setItems(defaultItems);
    onChange(defaultItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-2">
          {getDefaultContent(fieldName, 'list_builder', pageContext).length > 0 && (
            <Button onClick={resetToDefaults} size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
          )}
          <Button onClick={clearAllItems} size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <Button onClick={addItem} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add {singular}
          </Button>
        </div>
      </div>

      {items.map((item, index) => (
        <Card key={item.id || index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-base">{singular} {index + 1}</CardTitle>
            </div>
            <Button
              onClick={() => deleteItem(index)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                placeholder={`Enter ${singular.toLowerCase()} title`}
              />
            </div>
            {showDescription && (
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={item.description || ''}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  placeholder={`Enter ${singular.toLowerCase()} description`}
                  rows={2}
                />
              </div>
            )}
            {showIcon && (
              <div>
                <label className="block text-sm font-medium mb-1">Icon (optional)</label>
                <Input
                  value={item.icon || ''}
                  onChange={(e) => updateItem(index, { icon: e.target.value })}
                  placeholder="Icon name or URL"
                />
              </div>
            )}
            {fieldName === 'categories' && (
              <div>
                <label className="block text-sm font-medium mb-1">Articles</label>
                <div className="space-y-2">
                  {(item.articles || []).map((article, articleIndex) => (
                    <div key={articleIndex} className="flex gap-2">
                      <Input
                        value={article}
                        onChange={(e) => {
                          const newArticles = [...(item.articles || [])];
                          newArticles[articleIndex] = e.target.value;
                          updateItem(index, { articles: newArticles });
                        }}
                        placeholder="Enter article title"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          const newArticles = (item.articles || []).filter((_, i) => i !== articleIndex);
                          updateItem(index, { articles: newArticles });
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => {
                      const newArticles = [...(item.articles || []), ''];
                      updateItem(index, { articles: newArticles });
                    }}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Article
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {items.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">No {title.toLowerCase()} yet</p>
            <Button onClick={addItem} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First {singular}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Statistics Builder Component
interface Statistic {
  label: string;
  value: number;
  suffix?: string;
}

export const StatisticsBuilder = ({
  value = {},
  onChange,
  fields = [],
  pageContext = ""
}: {
  value: Record<string, any>;
  onChange: (stats: Record<string, any>) => void;
  fields: Array<{key: string, label: string, suffix?: string}>;
  pageContext?: string;
}) => {
  const [stats, setStats] = useState(value);

  // Initialize with default content if empty
  useEffect(() => {
    if (Object.keys(value).length === 0) {
      const defaultStats = getDefaultContent('stats', 'stats_builder', pageContext) as Record<string, any>;
      if (Object.keys(defaultStats).length > 0) {
        setStats(defaultStats);
        onChange(defaultStats);
      }
    } else {
      setStats(value);
    }
  }, [value, onChange, pageContext]);

  const updateStat = (key: string, updates: any) => {
    const updatedStats = { ...stats, [key]: updates };
    setStats(updatedStats);
    onChange(updatedStats);
  };

  const clearAllStats = () => {
    setStats({});
    onChange({});
  };

  const resetToDefaults = () => {
    const defaultStats = getDefaultContent('stats', 'stats_builder', pageContext) as Record<string, any>;
    setStats(defaultStats);
    onChange(defaultStats);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statistics</h3>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} size="sm" variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={clearAllStats} size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <Card key={field.key}>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium">{field.label}</label>
                <Input
                  type="number"
                  value={stats[field.key] || ''}
                  onChange={(e) => updateStat(field.key, parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                {field.suffix && (
                  <p className="text-xs text-gray-500">Will display as: {stats[field.key] || '0'}{field.suffix}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};