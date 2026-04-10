import path from 'path';

import { logOk, logStep, mkdirp, writeText } from './utils.js';

// ─── Scaffold the packages/shared/ directory ─────────────────────────────────

/**
 * Write the `packages/shared/` skeleton into the project root.
 * Called by the orchestrator when `--mobile` is passed.
 */
export function scaffoldSharedPackage(projectRoot: string, projectName: string): void {
  const sharedRoot = path.join(projectRoot, 'packages', 'shared');

  logStep('Creating packages/shared — cross-platform types, schemas & i18n');

  // Directories
  mkdirp(path.join(sharedRoot, 'src', 'types'));
  mkdirp(path.join(sharedRoot, 'src', 'schemas'));
  mkdirp(path.join(sharedRoot, 'src', 'constants'));
  mkdirp(path.join(sharedRoot, 'src', 'utils'));
  mkdirp(path.join(sharedRoot, 'src', 'i18n'));

  // Root config files
  writeText(path.join(sharedRoot, 'package.json'), sharedPackageJson(projectName));
  logOk('package.json');

  writeText(path.join(sharedRoot, 'tsconfig.json'), sharedTsconfig());
  logOk('tsconfig.json');

  writeText(path.join(sharedRoot, 'vitest.config.ts'), sharedVitestConfig());
  logOk('vitest.config.ts');

  // Source files
  writeText(path.join(sharedRoot, 'src', 'index.ts'), sharedIndexTs());
  logOk('src/index.ts');

  writeText(path.join(sharedRoot, 'src', 'types', 'user.ts'), sharedUserTypes());
  logOk('src/types/user.ts');

  writeText(path.join(sharedRoot, 'src', 'schemas', 'auth.schema.ts'), sharedAuthSchema());
  logOk('src/schemas/auth.schema.ts');

  writeText(path.join(sharedRoot, 'src', 'schemas', 'user.schema.ts'), sharedUserSchema());
  logOk('src/schemas/user.schema.ts');

  // i18n stubs
  for (const lang of ['en', 'fr', 'nl']) {
    writeText(path.join(sharedRoot, 'src', 'i18n', `${lang}.json`), '{}\n');
  }
  logOk('src/i18n/ (en, fr, nl)');

  // Empty directory placeholders
  writeText(path.join(sharedRoot, 'src', 'constants', '.gitkeep'), '');
  writeText(path.join(sharedRoot, 'src', 'utils', '.gitkeep'), '');
  logOk('src/constants/, src/utils/ (empty placeholders)');
}

// ─── File content builders ───────────────────────────────────────────────────

function sharedPackageJson(projectName: string): string {
  return `{
  "name": "@${projectName}/shared",
  "version": "0.1.0",
  "private": true,
  "description": "Shared types, schemas, constants and i18n for web + mobile",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "test": "vitest run"
  },
  "exports": {
    "./types/*": "./src/types/*",
    "./schemas/*": "./src/schemas/*",
    "./constants/*": "./src/constants/*",
    "./i18n/*": "./src/i18n/*"
  },
  "dependencies": {
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "typescript": "^6.0.2",
    "vitest": "^3.2.1"
  }
}
`;
}

function sharedTsconfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
`;
}

function sharedVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
`;
}

function sharedIndexTs(): string {
  return `// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  User,
  UserRole,
  AuthTokens,
  LoginUser,
  LoginResponse,
  RegisterResponse,
} from './types/user';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

// Auth
export {
  loginSchema,
  registerBaseSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} from './schemas/auth.schema';
export type {
  LoginInput,
  RegisterBaseInput,
  ForgotPasswordInput,
  ChangePasswordInput,
} from './schemas/auth.schema';

// User
export {
  loginUserSchema,
  userSchema,
  loginResponseSchema,
  registerResponseSchema,
  tokenRefreshResponseSchema,
} from './schemas/user.schema';
export type {
  UserFromSchema,
  LoginResponseFromSchema,
  RegisterResponseFromSchema,
  TokenRefreshResponseFromSchema,
} from './schemas/user.schema';
`;
}

function sharedUserTypes(): string {
  return `export type UserRole = 'user' | 'admin';

/**
 * Minimal user object embedded in the login response.
 * The login endpoint returns fewer fields than /auth/me/.
 */
export interface LoginUser {
  id: string;
  email: string;
  username?: string;
  first_name: string;
  last_name: string;
  email_verified?: boolean;
}

/**
 * Full user profile returned by GET /auth/me/.
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  email_verified?: boolean;
  role: UserRole | null;
  avatar?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: LoginUser;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
  email: string;
}
`;
}

function sharedAuthSchema(): string {
  return `import { z } from 'zod';

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email_or_username: z.string().trim().min(1, 'Email or username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export const registerBaseSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(2, 'Username must be at least 2 characters')
      .max(150)
      .refine((v) => !v.includes('@'), { message: 'Username cannot contain @' })
      .refine((v) => !v.includes(' '), { message: 'Username cannot contain spaces' }),
    first_name: z.string().trim().max(150),
    last_name: z.string().trim().max(150),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirm: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['user', 'admin']).optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

export type RegisterBaseInput = z.infer<typeof registerBaseSchema>;

// ---------------------------------------------------------------------------
// Forgot / Change password
// ---------------------------------------------------------------------------

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_new_password: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: 'Passwords do not match',
    path: ['confirm_new_password'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
`;
}

function sharedUserSchema(): string {
  return `import { z } from 'zod';

/**
 * Minimal user object embedded in the login response.
 * nimoh_base returns: { id, email, username, first_name, last_name, email_verified }
 */
export const loginUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string().optional(),
  first_name: z.string(),
  last_name: z.string(),
  email_verified: z.boolean().optional(),
});

/**
 * Login response from POST /api/v1/auth/login/.
 * refresh_token is present only for mobile clients (X-Client-Type: mobile).
 */
export const loginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  token_type: z.string(),
  expires_in: z.number(),
  user: loginUserSchema,
});

export type LoginResponseFromSchema = z.infer<typeof loginResponseSchema>;

/**
 * Full user object returned by GET /api/v1/auth/me/.
 */
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  username: z.string().optional(),
  email_verified: z.boolean().optional(),
  role: z.enum(['user', 'admin']).nullable(),
  avatar: z.string().optional(),
});

export type UserFromSchema = z.infer<typeof userSchema>;

/**
 * Register response from POST /api/v1/auth/register/.
 * Does NOT return tokens — user must verify email first.
 */
export const registerResponseSchema = z.object({
  message: z.string(),
  user_id: z.string(),
  email: z.string(),
});

export type RegisterResponseFromSchema = z.infer<typeof registerResponseSchema>;

/**
 * Token refresh response (mobile) from POST /api/v1/auth/token/refresh/.
 * nimoh_base returns { access, refresh } when X-Refresh-Token header is used.
 */
export const tokenRefreshResponseSchema = z.object({
  access: z.string(),
  refresh: z.string().optional(),
});

export type TokenRefreshResponseFromSchema = z.infer<typeof tokenRefreshResponseSchema>;
`;
}
