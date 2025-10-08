import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { contentController } from '../controllers/contentController';
import { sanitizeRequestBody } from '../middleware/sanitization';

const router = Router();

// Public routes
router.get('/public/content', contentController.getPublishedContent);
router.get('/public/faq/categories', contentController.getFAQCategories);
router.get('/public/faq/items', contentController.getFAQItems);
router.post('/public/faq/:id/feedback', contentController.trackFAQHelpfulness);

// Admin routes
router.use(authenticate);
router.use(authorize('admin'));

// Static content management - with HTML sanitization
router.get('/content', contentController.getAllContent);
router.post('/content', sanitizeRequestBody(['content', 'description']), contentController.createContent);
router.put('/content/:id', sanitizeRequestBody(['content', 'description']), contentController.updateContent);
router.delete('/content/:id', contentController.deleteContent);

// FAQ management - with HTML sanitization
router.post('/faq/categories', sanitizeRequestBody(['description']), contentController.createFAQCategory);
router.post('/faq/items', sanitizeRequestBody(['question', 'answer']), contentController.createFAQItem);
router.put('/faq/items/:id', sanitizeRequestBody(['question', 'answer']), contentController.updateFAQItem);
router.delete('/faq/items/:id', contentController.deleteFAQItem);

export default router;