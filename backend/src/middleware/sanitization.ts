import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous scripts, event handlers, and other malicious content
 */
export const sanitizeHTML = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'target', 'rel', 'width', 'height'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'svg'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
};

/**
 * Middleware to sanitize request body fields that contain HTML
 * Prevents XSS attacks through content submission
 */
export const sanitizeRequestBody = (fieldsToSanitize: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || typeof req.body !== 'object') {
      return next();
    }

    try {
      // If no specific fields specified, sanitize common HTML fields
      const fields = fieldsToSanitize.length > 0 ? fieldsToSanitize : [
        'content', 'description', 'body', 'message', 'notes', 'bio'
      ];

      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeHTML(req.body[field]);
        }
      }

      next();
    } catch (error) {
      console.error('Error sanitizing request body:', error);
      res.status(400).json({ error: 'Invalid content format' });
    }
  };
};

/**
 * Sanitize all string values in an object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && (
      key.includes('content') ||
      key.includes('description') ||
      key.includes('body') ||
      key.includes('message') ||
      key.includes('notes') ||
      key.includes('bio')
    )) {
      sanitized[key] = sanitizeHTML(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Validate and sanitize TinyMCE editor content
 */
export const sanitizeTinyMCEContent = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // First pass: Remove potentially dangerous content
  const cleaned = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'strike', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
      'hr', 'sub', 'sup', 's', 'del', 'ins'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'target', 'rel', 'width', 'height', 'align'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'svg', 'form', 'input', 'button'],
    FORBID_ATTR: [
      'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
      'onmousemove', 'onkeydown', 'onkeyup', 'onkeypress', 'onfocus',
      'onblur', 'onchange', 'onsubmit'
    ],
  });

  return cleaned;
};
