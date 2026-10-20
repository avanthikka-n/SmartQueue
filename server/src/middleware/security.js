/**
 * security.js — Centralised security middleware for SmartQueue
 *
 * Applies:
 *  1. Helmet    — sets 14+ HTTP security headers (XSS, HSTS, CSP, etc.)
 *  2. Rate limiters — per-IP token bucket via express-rate-limit
 *      • globalLimiter  : 300 req / 15 min (all routes)
 *      • authLimiter    : 20 req / 15 min  (login/register brute-force guard)
 *      • tokenLimiter   : 60 req / 1 min   (token generation flood guard)
 *  3. mongoSanitize — strips $ and . from req.body/params/query to
 *                     prevent NoSQL injection via MongoDB operators
 *  4. xssSanitize  — walks req.body strings and escapes HTML entities
 *                     using the actively maintained `xss` package
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { filterXSS } from 'xss';

// ─── 1. Helmet ───────────────────────────────────────────────────────────────
export const helmetMiddleware = helmet({
  // Allow Vite dev & production client to load resources
  contentSecurityPolicy: false,   // Kept off — Vite/React needs inline scripts during dev
  crossOriginEmbedderPolicy: false
});

// ─── 2. Rate limiters ────────────────────────────────────────────────────────
const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    message: { success: false, message },
    handler: (req, res, next, options) => {
      console.warn(`[RateLimit] ${req.ip} hit limit on ${req.originalUrl}`);
      res.status(429).json(options.message);
    }
  });

// 300 requests per 15 minutes for all API traffic
export const globalLimiter = createLimiter(
  15 * 60 * 1000,
  300,
  'Too many requests from this IP. Please wait 15 minutes before retrying.'
);

// 20 login/register attempts per 15 minutes — prevents brute-force
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  'Too many authentication attempts. Please wait 15 minutes before retrying.'
);

// 60 token generation requests per minute — prevents token flooding
export const tokenLimiter = createLimiter(
  60 * 1000,
  60,
  'Too many token requests. Please slow down.'
);

// ─── 3. MongoDB NoSQL Injection Sanitizer ────────────────────────────────────
// Replaces $ and . in keys to prevent operators like { $gt: '' } in body/query
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',       // Replace dangerous chars with _ instead of removing
  onSanitize: ({ req, key }) => {
    console.warn(`[MongoSanitize] Stripped key "${key}" from ${req.ip} → ${req.originalUrl}`);
  }
});

// ─── 4. XSS Sanitizer (recursive body walker) ────────────────────────────────
function sanitizeValue(value) {
  if (typeof value === 'string') return filterXSS(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const key of Object.keys(value)) {
      cleaned[key] = sanitizeValue(value[key]);
    }
    return cleaned;
  }
  return value;
}

export const xssSanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  next();
};
