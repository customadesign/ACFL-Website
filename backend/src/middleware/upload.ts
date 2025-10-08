import multer from 'multer';
import { supabase } from '../lib/supabase';

// Configure multer to store files in memory for Supabase upload
const storage = multer.memoryStorage();

// File filter to restrict file types and size
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Blocked file types for security reasons
  const blockedTypes = [
    'image/svg+xml',           // SVG files can contain XSS payloads
    'text/html',               // HTML files
    'application/x-httpd-php', // PHP files
    'application/x-sh',        // Shell scripts
    'application/javascript',  // JavaScript files
    'text/javascript'
  ];

  // Check file extension as additional security layer
  const fileExtension = file.originalname.toLowerCase().split('.').pop();
  const blockedExtensions = ['svg', 'html', 'htm', 'php', 'sh', 'js', 'exe', 'bat', 'cmd'];

  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/mpeg',
    'application/zip',
    'application/x-zip-compressed'
  ];

  // Block dangerous file types
  if (blockedTypes.includes(file.mimetype) || blockedExtensions.includes(fileExtension || '')) {
    cb(new Error(`File type ${file.mimetype} is not allowed for security reasons. SVG and executable files are blocked.`));
    return;
  }

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: images (JPG, PNG, GIF, WebP), PDFs, documents, audio, video, and zip files.`));
  }
};

export const uploadAttachment = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
});

// Function to upload file to Supabase Storage
export const uploadToSupabase = async (file: Express.Multer.File, userId: string) => {
  try {
    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('message_attachments')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('message_attachments')
      .getPublicUrl(fileName);

    return {
      path: data.path,
      url: urlData.publicUrl,
      fullPath: data.fullPath
    };
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
};