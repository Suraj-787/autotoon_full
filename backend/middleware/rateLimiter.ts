import rateLimit from 'express-rate-limit';

/**
 * Rate limiting middleware configurations
 */

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for generation endpoints
export const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 generation requests per minute
  message: {
    success: false,
    message: 'Too many generation requests, please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiting for image generation
export const imageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each IP to 5 image generation requests per 5 minutes
  message: {
    success: false,
    message: 'Image generation rate limit exceeded. Please wait before generating more images.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Library operations rate limiting
export const libraryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 library operations per minute
  message: {
    success: false,
    message: 'Too many library operations, please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
