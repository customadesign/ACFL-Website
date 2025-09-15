import { Router } from 'express';
import {
  getStaffMembers,
  getStaffPermissions,
  updateStaffPermissions,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
  getStaffProfile,
  updateStaffProfile,
  uploadStaffProfilePhoto
} from '../controllers/staffController';
import {
  sendStaffInvitation,
  getStaffInvitations,
  resendStaffInvitation,
  cancelStaffInvitation,
  acceptStaffInvitation,
  getInvitationDetails
} from '../controllers/staffInvitationController';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';

const router = Router();

// Multer configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Staff profile routes (for logged-in staff member)
router.get('/profile', authorize('staff'), getStaffProfile);              // GET /api/admin/staff/profile
router.put('/profile', authorize('staff'), updateStaffProfile);           // PUT /api/admin/staff/profile
router.post('/profile/photo', authorize('staff'), upload.single('photo'), uploadStaffProfilePhoto); // POST /api/admin/staff/profile/photo

// Staff management routes - admin only
router.get('/', authorize('admin'), getStaffMembers);                    // GET /api/admin/staff
router.post('/', authorize('admin'), createStaffMember);                 // POST /api/admin/staff
router.put('/:id', authorize('admin'), updateStaffMember);               // PUT /api/admin/staff/:id
router.delete('/:id', authorize('admin'), deleteStaffMember);            // DELETE /api/admin/staff/:id

// Staff permissions routes
router.get('/permissions', authorize('admin', 'staff'), getStaffPermissions);     // GET /api/admin/staff/permissions - staff can read
router.put('/permissions', authorize('admin'), updateStaffPermissions);           // PUT /api/admin/staff/permissions - admin only

// Staff invitation routes - admin only
router.post('/invitations', authorize('admin'), sendStaffInvitation);            // POST /api/admin/staff/invitations - send invitation
router.get('/invitations', authorize('admin'), getStaffInvitations);             // GET /api/admin/staff/invitations - list invitations
router.post('/invitations/:id/resend', authorize('admin'), resendStaffInvitation); // POST /api/admin/staff/invitations/:id/resend - resend invitation
router.post('/invitations/:id/cancel', authorize('admin'), cancelStaffInvitation); // POST /api/admin/staff/invitations/:id/cancel - cancel invitation

// Public invitation acceptance routes (no auth required)
router.get('/invitation-details/:token', getInvitationDetails);                  // GET /api/admin/staff/invitation-details/:token - get invitation details
router.post('/accept-invitation', acceptStaffInvitation);                       // POST /api/admin/staff/accept-invitation - accept invitation

export default router;