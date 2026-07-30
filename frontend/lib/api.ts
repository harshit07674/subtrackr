import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  withCredentials: true, // sends the refreshToken cookie automatically
  headers: { 'Content-Type': 'application/json' },
});

// Global callback when session is permanently expired
let sessionExpiredHandler: (() => void) | null = null;
export function onSessionExpired(handler: () => void) {
  sessionExpiredHandler = handler;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// ── Response interceptor: handles 401/403 token refresh & session expiration ──
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const url = originalRequest?.url || '';

    // Ignore auth entry routes where 401/403 is an expected credential error
    const isAuthEntryRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/verify-email') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if ((status === 401 || status === 403) && !isAuthEntryRoute && originalRequest && !originalRequest._retry) {
      if (url.includes('/auth/refresh')) {
        // Refresh token request itself failed — session is ended
        if (sessionExpiredHandler) sessionExpiredHandler();
        const message = error.response?.data?.message ?? 'Session expired. Please log in again.';
        const err = new Error(message) as ApiError;
        err.status = status;
        return Promise.reject(err);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.get<{ accessToken: string }>(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/auth/refresh`,
          { withCredentials: true }
        );
        const newAccessToken = refreshRes.data.accessToken;

        isRefreshing = false;
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr, null);

        if (sessionExpiredHandler) {
          sessionExpiredHandler();
        }

        const message = 'Session expired. Please log in again.';
        const err = new Error(message) as ApiError;
        err.status = 401;
        return Promise.reject(err);
      }
    }

    const message = error.response?.data?.message ?? error.message ?? 'Something went wrong';
    const err = new Error(message) as ApiError;
    err.status = error.response?.status;
    err.data = error.response?.data as Record<string, unknown>;
    return Promise.reject(err);
  }
);

// ── Helper: build Authorization header ───────────────────────────────────────
const bearer = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: unknown) => api.post('/auth/register', body).then((r) => r.data),

  login: (body: unknown) =>
    api.post<{ accessToken: string; user: unknown; message: string }>('/auth/login', body).then((r) => r.data),

  logout: () => api.get('/auth/logout').then((r) => r.data),

  logoutAll: () => api.get('/auth/logout-all-devices').then((r) => r.data),

  refresh: () => api.get<{ accessToken: string }>('/auth/refresh').then((r) => r.data),

  verifyEmail: (body: unknown) => api.post('/auth/verify-email', body).then((r) => r.data),

  forgotPassword: (body: unknown) => api.post('/auth/forgot-password', body).then((r) => r.data),

  resetPassword: (body: unknown) => api.post('/auth/reset-password', body).then((r) => r.data),

  me: (token: string) =>
    api
      .get<{
        id: string;
        username?: string;
        email: string;
        verified: boolean;
        primaryCurrency?: string;
        defaultNotificationDays?: number;
      }>('/auth/me', bearer(token))
      .then((r) => r.data),

  updateSettings: (body: { primaryCurrency?: string; defaultNotificationDays?: number }, token: string) =>
    api
      .put<{ success: boolean; message: string; user: Record<string, unknown> }>('/auth/settings', body, bearer(token))
      .then((r) => r.data),

  getDashboardKPIs: (token: string) =>
    api
      .get<{
        primaryCurrency?: string;
        totalSubscriptionCount: number;
        activeSubscriptionCount: number;
        pausedSubscriptionCount?: number;
        cancelledSubscriptionCount?: number;
        expiredSubscriptionCount: number;
        freeTrialCount?: number;
        totalExpensesAmount?: number;
        totalExpensesAmountINR?: number;
      }>('/auth/dashboard-kpi', bearer(token))
      .then((r) => r.data),
};

// ── Subscription endpoints ────────────────────────────────────────────────────
export const subsApi = {
  getAll: (token: string) => api.get<{ subscriptions: unknown[] }>('/subscription', bearer(token)).then((r) => r.data),

  getCatalog: (search?: string) =>
    api
      .get<{ success: boolean; catalog: unknown[]; count: number }>('/subscription/catalog', { params: { search } })
      .then((r) => r.data),

  bulkImport: (subscriptions: unknown[], token: string) =>
    api
      .post<{ success: boolean; count: number; subscriptions: unknown[] }>(
        '/subscription/bulk-import',
        { subscriptions },
        bearer(token)
      )
      .then((r) => r.data),

  add: (body: unknown, token: string) => api.post('/subscription', body, bearer(token)).then((r) => r.data),

  update: (id: string, body: unknown, token: string) =>
    api.patch(`/subscription/${id}`, body, bearer(token)).then((r) => r.data),

  delete: (id: string, token: string) => api.delete(`/subscription/${id}`, bearer(token)).then((r) => r.data),

  getById: (id: string, token: string) =>
    api
      .get<{ subscription: unknown; message: string; success: string; status: string }>(
        `/subscription/${id}`,
        bearer(token)
      )
      .then((r) => r.data),

  search: (
    filters: {
      name?: string;
      category?: string;
      currency?: string;
      billingCycle?: string;
      paymentMethod?: string;
      renewal?: 'expired' | 'today' | '7d' | '30d' | '90d' | '180d' | '365d';
      minPrice?: number;
      maxPrice?: number;
      sortBy?: 'price' | 'renewalDate' | 'serviceName' | 'createdAt';
      order?: 'asc' | 'desc';
    },
    token: string
  ) =>
    api
      .request<{ subscriptions: unknown[]; count: number; appliedFilters: Record<string, unknown> }>({
        method: 'QUERY',
        url: '/subscription',
        data: filters,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      .then((r) => r.data),
};

// ── Workspace endpoints ───────────────────────────────────────────────────────
export const workspaceApi = {
  getAll: (token: string) =>
    api.get<{ status: string; message: string; workspace: unknown[] }>('/workspace', bearer(token)).then((r) => r.data),

  getById: (id: string, token: string) =>
    api
      .get<{ status: string; message: string; workspace: unknown }>(`/workspace/${id}`, bearer(token))
      .then((r) => r.data),

  create: (body: unknown, token: string) =>
    api
      .post<{ status: string; message: string; workspace: unknown }>('/workspace/create', body, bearer(token))
      .then((r) => r.data),

  update: (id: string, body: unknown, token: string) =>
    api
      .put<{ status: string; message: string; workspace: unknown }>(`/workspace/${id}`, body, bearer(token))
      .then((r) => r.data),

  delete: (id: string, token: string) =>
    api.delete<{ status: string; message: string }>(`/workspace/${id}`, bearer(token)).then((r) => r.data),

  getSubscriptions: (id: string, token: string) =>
    api
      .get<{ status: string; message: string; subscriptions: unknown[] }>(
        `/workspace/${id}/subscriptions`,
        bearer(token)
      )
      .then((r) => r.data),
};

// ── Analytics & Forecasting endpoints ────────────────────────────────────────
export const analyticsApi = {
  get: (token: string, workSpaceId?: string) =>
    api
      .get<{
        status: string;
        message: string;
        targetCurrency: string;
        workspaceInfo?: unknown;
        kpis: {
          totalMonthlySpend: number;
          activeSubsCount: number;
          upcomingRenewalsCount: number;
          freeTrialCount: number;
        };
        spendingTrends: Array<{ month: string; amount: number; currency: string }>;
        expensesByPaymentGroup: Array<{
          paymentMethod: string;
          amount: number;
          currency: string;
          count: number;
          percentage: number;
        }>;
        categoryBreakdown: Array<{
          category: string;
          amount: number;
          currency: string;
          count: number;
          percentage: number;
          color: string;
        }>;
        projections: {
          next30Days: number;
          next6Months: number;
          next12Months: number;
          monthlyBreakdown: Array<{ month: string; amount: number; currency: string }>;
        };
      }>(`/analytics${workSpaceId && workSpaceId !== 'all' ? `?workSpaceId=${workSpaceId}` : ''}`, bearer(token))
      .then((r) => r.data),
};

// ── Web Push Notification Endpoints ──────────────────────────────────────────
export const pushApi = {
  getVapidPublicKey: () =>
    api.get<{ status: string; publicKey: string }>('/auth/vapid-public-key').then((r) => r.data),

  subscribe: (subscription: unknown, token: string) =>
    api
      .post<{ status: string; message: string }>('/auth/subscribe-push', { subscription }, bearer(token))
      .then((r) => r.data),

  unsubscribe: (endpoint: string, token: string) =>
    api
      .post<{ status: string; message: string }>('/auth/unsubscribe-push', { endpoint }, bearer(token))
      .then((r) => r.data),

  sendTest: (token: string) =>
    api.post<{ status: string; message: string }>('/auth/test-push', {}, bearer(token)).then((r) => r.data),
};
