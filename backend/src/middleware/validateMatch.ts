import { Request, Response, NextFunction } from 'express';


export const validateMatchRequest = (req: Request, res: Response, next: NextFunction) => {
  const requiredFields = [
    'areaOfConcern',
    'location',
    'therapistGender',
    'language',
    'paymentMethod',
    'availability'
  ];

  console.log('req.body', req.body);
  const missingFields = requiredFields.filter(field => !req.body[field]);
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  next();
}; 