import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { contentController } from '../controllers/contentController';

const router = Router();

// Public routes
router.get('/public/content', contentController.getPublishedContent);
router.get('/public/faq/categories', contentController.getFAQCategories);
router.get('/public/faq/items', contentController.getFAQItems);
router.post('/public/faq/:id/feedback', contentController.trackFAQHelpfulness);

// Admin routes
router.use(authenticate);
router.use(authorize('admin'));

// Static content management
router.get('/content', contentController.getAllContent);
router.post('/content', contentController.createContent);
router.put('/content/:id', contentController.updateContent);
router.delete('/content/:id', contentController.deleteContent);

// FAQ management
router.post('/faq/categories', contentController.createFAQCategory);
router.post('/faq/items', contentController.createFAQItem);
router.put('/faq/items/:id', contentController.updateFAQItem);
router.delete('/faq/items/:id', contentController.deleteFAQItem);

export default router;