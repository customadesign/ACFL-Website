import { Router } from 'express';
import { findMatches } from '../controllers/matchController';
import { validateMatchRequest } from '../middleware/validateMatch';


const router = Router();

router.post('/match', validateMatchRequest, findMatches);

export default router; 