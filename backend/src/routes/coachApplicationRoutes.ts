import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import {
  submitCoachApplication,
  getCoachApplications,
  getCoachApplication,
  updateApplicationStatus,
  getCoachApplicationStats,
  bulkUpdateApplicationStatus
} from '../controllers/coachApplicationController';

const router = Router();

// Validation middleware for coach application submission
const validateCoachApplication = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('educationalBackground').notEmpty().withMessage('Educational background is required'),
  body('coachingExperienceYears').notEmpty().withMessage('Coaching experience is required'),
  body('coachingExpertise').isArray({ min: 1, max: 5 }).withMessage('Select 1-5 areas of expertise'),
  body('ageGroupsComfortable').isArray({ min: 1 }).withMessage('Select at least one age group'),
  body('actTrainingLevel').notEmpty().withMessage('ACT training level is required'),
  body('coachingPhilosophy').isLength({ min: 10, max: 500 }).withMessage('Coaching philosophy must be 10-500 characters'),
  body('coachingTechniques').isArray({ min: 1 }).withMessage('Select at least one coaching technique'),
  body('sessionStructure').notEmpty().withMessage('Session structure is required'),
  body('scopeHandlingApproach').isLength({ min: 10, max: 1000 }).withMessage('Scope handling approach must be 10-1000 characters'),
  body('boundaryMaintenanceApproach').notEmpty().withMessage('Boundary maintenance approach is required'),
  body('comfortableWithSuicidalThoughts').notEmpty().withMessage('Suicidal thoughts comfort level is required'),
  body('selfHarmProtocol').isLength({ min: 10, max: 1000 }).withMessage('Self-harm protocol must be 10-1000 characters'),
  body('weeklyHoursAvailable').notEmpty().withMessage('Weekly hours availability is required'),
  body('preferredSessionLength').notEmpty().withMessage('Preferred session length is required'),
  body('availabilityTimes').isArray({ min: 1 }).withMessage('Select at least one availability time'),
  body('videoConferencingComfort').notEmpty().withMessage('Video conferencing comfort level is required'),
  body('internetConnectionQuality').notEmpty().withMessage('Internet connection quality is required'),
  body('languagesFluent').isArray({ min: 1 }).withMessage('Select at least one language'),
  body('references').isArray({ min: 2 }).withMessage('At least 2 references are required'),
  body('references.*.name').notEmpty().withMessage('Reference name is required'),
  body('references.*.title').notEmpty().withMessage('Reference title is required'),
  body('references.*.organization').notEmpty().withMessage('Reference organization is required'),
  body('references.*.email').isEmail().withMessage('Reference email must be valid'),
  body('agreementsAccepted.termsOfService').equals('true').withMessage('Terms of service must be accepted'),
  body('agreementsAccepted.confidentiality').equals('true').withMessage('Confidentiality agreement must be accepted'),
  body('agreementsAccepted.scopeOfPractice').equals('true').withMessage('Scope of practice agreement must be accepted'),
  body('agreementsAccepted.platformTerms').equals('true').withMessage('Platform terms must be accepted'),
  body('agreementsAccepted.discretionaryApproval').equals('true').withMessage('Discretionary approval must be accepted'),
  body('agreementsAccepted.responseTime').equals('true').withMessage('Response time agreement must be accepted'),
  body('agreementsAccepted.refundPolicy').equals('true').withMessage('Refund policy must be accepted')
];

// Public route - Submit coach application
router.post('/applications', validateCoachApplication, submitCoachApplication);

// Admin routes - require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get all coach applications (with filtering and pagination)
router.get('/applications', getCoachApplications);

// Get specific coach application
router.get('/applications/:id', getCoachApplication);

// Update application status (approve/reject/suspend)
router.put('/applications/:id/status', [
  body('status').isIn(['pending', 'under_review', 'approved', 'rejected', 'suspended']).withMessage('Invalid status'),
  body('reviewerId').notEmpty().withMessage('Reviewer ID is required')
], updateApplicationStatus);

// Get application statistics
router.get('/stats', getCoachApplicationStats);

// Bulk update application statuses
router.put('/applications/bulk-status', [
  body('applicationIds').isArray({ min: 1 }).withMessage('At least one application ID is required'),
  body('status').isIn(['pending', 'under_review', 'approved', 'rejected', 'suspended']).withMessage('Invalid status'),
  body('reviewerId').notEmpty().withMessage('Reviewer ID is required')
], bulkUpdateApplicationStatus);

export default router;