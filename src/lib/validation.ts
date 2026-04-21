import { z } from 'zod';

// ── Auth Schemas ──

export const loginSchema = z.object({
  login: z.string().min(1, 'Login is required').max(100),
  password: z.string().min(1, 'Password is required').max(128),
});

export const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

export const resetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required').max(255),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ── User Schemas ──

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  email: z.string().email('Invalid email address').max(255),
  name: z.string().min(1, 'Name is required').max(100),
  displayName: z.string().max(100).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['dev_admin', 'tenant_admin', 'finance_controller', 'engineer']).optional(),
  personalEmail: z.string().email().max(255).nullable().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().max(100).nullable().optional(),
  email: z.string().email().max(255).optional(),
  role: z.enum(['dev_admin', 'tenant_admin', 'finance_controller', 'engineer']).optional(),
  personalEmail: z.string().email().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().max(50).nullable().optional(),
});

// ── Asset Schemas ──

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  assetTag: z.string().min(1).max(100).optional(),
  category: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  assignedTo: z.string().max(200).optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  vendor: z.string().max(200).optional(),
  warrantyExpiry: z.string().optional(),
  serialNumber: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  manufacturer: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
}).passthrough();

// ── Maintenance Schemas ──

export const createMaintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  type: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  assetId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().max(200).optional(),
}).passthrough();

// ── Generic ID param ──

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/**
 * Validate request body with a Zod schema.
 * Returns { data } on success, { error, status } on failure.
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): 
  { success: true; data: T } | { success: false; error: string; status: 400 } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    return { success: false, error: messages, status: 400 };
  }
  return { success: true, data: result.data };
}
