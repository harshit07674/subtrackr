// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username?: string;
  email: string;
  verified: boolean;
  primaryCurrency?: string;
  defaultNotificationDays?: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  message: string;
}

// ── Subscriptions ─────────────────────────────────────────────────────────────
export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'daily';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  _id: string;
  userId: string;
  serviceName: string;
  category: string;
  price: number;
  currency: string;
  billingCycle: BillingCycle;
  renewalDate: string;
  paymentMethod?: string;
  notes?: string;
  status?: SubscriptionStatus;
  isFreeTrial?: boolean;
  freeTrialEndDate?: string;
  workSpaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionFormData = Omit<Subscription, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;

export interface SubscriptionUpdateData extends Partial<SubscriptionFormData> {}

// ── Workspaces ────────────────────────────────────────────────────────────────
export interface Workspace {
  _id: string;
  userId: string;
  name: string;
  category: string;
  totalNumberOfSubscriptions: number;
  colorTheme?: {
    primary: string;
    secondary: string;
  };
  iconName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WorkspaceFormData = Omit<Workspace, '_id' | 'userId' | 'totalNumberOfSubscriptions' | 'createdAt' | 'updatedAt'>;

// ── Service Catalog ───────────────────────────────────────────────────────────
export interface CatalogPlan {
  planId: string;
  planName: string;
  billingCycle: BillingCycle;
  pricing: Record<string, number>;
  notes: string;
}

export interface CatalogService {
  id: string;
  serviceName: string;
  category: string;
  brandColor: string;
  logoIcon?: string;
  defaultBillingCycle?: BillingCycle;
  supportsUsageTracking: boolean;
  pricing?: Record<string, number>;
  defaultNotes?: string;
  plans: CatalogPlan[];
}

// ── API error ─────────────────────────────────────────────────────────────────
export interface ApiError extends Error {
  status?: number;
  data?: Record<string, unknown>;
}
