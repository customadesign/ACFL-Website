import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { JWTPayload } from '../types/auth';

interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const contentController = {
  // Get all static content (admin)
  async getAllContent(req: AuthRequest, res: Response) {
    try {
      const { content_type } = req.query;
      
      let query = supabase
        .from('static_content')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (content_type) {
        query = query.eq('content_type', content_type);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  },

  // Get published content (public)
  async getPublishedContent(req: Request, res: Response) {
    try {
      const { slug, content_type } = req.query;
      
      let query = supabase
        .from('static_content')
        .select('*')
        .eq('is_published', true);
      
      if (slug) {
        const { data, error } = await query.eq('slug', slug).single();
        if (error) throw error;
        return res.json(data);
      } else {
        if (content_type) {
          query = query.eq('content_type', content_type);
        }
        query = query.order('display_order', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching published content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  },

  // Create new content
  async createContent(req: AuthRequest, res: Response) {
    try {
      const { title, content, content_type, slug, meta_description, is_published, display_order } = req.body;
      
      const { data, error } = await supabase
        .from('static_content')
        .insert({
          title,
          content,
          content_type,
          slug,
          meta_description,
          is_published: is_published || false,
          display_order: display_order || 0,
          created_by: req.user?.userId,
          updated_by: req.user?.userId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating content:', error);
      res.status(500).json({ error: 'Failed to create content' });
    }
  },

  // Update content
  async updateContent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const { data, error } = await supabase
        .from('static_content')
        .update({
          ...updates,
          updated_by: req.user?.userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      console.error('Error updating content:', error);
      res.status(500).json({ error: 'Failed to update content' });
    }
  },

  // Delete content
  async deleteContent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('static_content')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({ message: 'Content deleted successfully' });
    } catch (error) {
      console.error('Error deleting content:', error);
      res.status(500).json({ error: 'Failed to delete content' });
    }
  },

  // FAQ Categories
  async getFAQCategories(req: Request, res: Response) {
    try {
      const { data, error } = await supabase
        .from('faq_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching FAQ categories:', error);
      res.status(500).json({ error: 'Failed to fetch FAQ categories' });
    }
  },

  async createFAQCategory(req: AuthRequest, res: Response) {
    try {
      const { name, slug, description, display_order } = req.body;
      
      const { data, error } = await supabase
        .from('faq_categories')
        .insert({
          name,
          slug,
          description,
          display_order: display_order || 0
        })
        .select()
        .single();
      
      if (error) throw error;
      
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating FAQ category:', error);
      res.status(500).json({ error: 'Failed to create FAQ category' });
    }
  },

  // FAQ Items
  async getFAQItems(req: Request, res: Response) {
    try {
      const { category_id } = req.query;
      
      let query = supabase
        .from('faq_items')
        .select(`
          *,
          category:faq_categories(name, slug)
        `)
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      
      if (category_id) {
        query = query.eq('category_id', category_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching FAQ items:', error);
      res.status(500).json({ error: 'Failed to fetch FAQ items' });
    }
  },

  async createFAQItem(req: AuthRequest, res: Response) {
    try {
      const { category_id, question, answer, display_order, is_published } = req.body;
      
      const { data, error } = await supabase
        .from('faq_items')
        .insert({
          category_id,
          question,
          answer,
          display_order: display_order || 0,
          is_published: is_published !== false,
          created_by: req.user?.userId,
          updated_by: req.user?.userId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating FAQ item:', error);
      res.status(500).json({ error: 'Failed to create FAQ item' });
    }
  },

  async updateFAQItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const { data, error } = await supabase
        .from('faq_items')
        .update({
          ...updates,
          updated_by: req.user?.userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json(data);
    } catch (error) {
      console.error('Error updating FAQ item:', error);
      res.status(500).json({ error: 'Failed to update FAQ item' });
    }
  },

  async deleteFAQItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('faq_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      res.json({ message: 'FAQ item deleted successfully' });
    } catch (error) {
      console.error('Error deleting FAQ item:', error);
      res.status(500).json({ error: 'Failed to delete FAQ item' });
    }
  },

  // Track FAQ helpfulness
  async trackFAQHelpfulness(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { helpful } = req.body;
      
      const { data: faq, error: fetchError } = await supabase
        .from('faq_items')
        .select('helpful_count, not_helpful_count')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const updates = helpful
        ? { helpful_count: (faq.helpful_count || 0) + 1 }
        : { not_helpful_count: (faq.not_helpful_count || 0) + 1 };
      
      const { error: updateError } = await supabase
        .from('faq_items')
        .update(updates)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      res.json({ message: 'Feedback recorded' });
    } catch (error) {
      console.error('Error tracking FAQ helpfulness:', error);
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  }
};