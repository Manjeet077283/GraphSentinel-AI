// GraphSentinel AI - API Client Service

import {
  HealthResponse,
  OverviewResponse,
  ServiceSummary,
  ServiceDetail,
  IncidentSummary,
  IncidentDetail,
  ImpactAnalysisResponse,
  GraphResponse,
  ChatRequest,
  ChatResponse,
  AuthResponse,
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ResolutionWorkflowResponse,
  ResolutionStepItem,
  VerifyRecoveryResponse,
  GlobalSearchResponse,
  InvestigationReportResponse,
  UploadPreviewResponse,
  ImportDatasetRequest,
  DatasetSummary,
  DatasetRecordItem,
  ProvenanceSummaryResponse,
  ConversationSummary,
  ConversationDetail,
  TranslateMessageRequest,
  GraphDiagnosticsResponse
} from '../types';

// Resolve API base URL:
// 1. If VITE_API_URL is explicitly configured, use it (normalizing any 'localhost:8000' to '127.0.0.1:8000'
//    to prevent Windows IPv6 [::1] loopback connection refused errors when the backend is bound to IPv4).
// 2. In browser local development, default to 'http://127.0.0.1:8000' to ensure IPv4 loopback connectivity.
const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl !== undefined) {
    const trimmed = envUrl.trim();
    if (trimmed === '') {
      return ''; // Explicitly configured for same-origin / reverse-proxy deployments
    }
    let normalized = trimmed.replace(/\/+$/, '').replace('://localhost:8000', '://127.0.0.1:8000');
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://') && !normalized.startsWith('/')) {
      normalized = `https://${normalized}`;
    }
    if (normalized === 'https://graphsentinel-backend' || normalized === 'http://graphsentinel-backend' || normalized.endsWith('/graphsentinel-backend')) {
      normalized = 'https://graphsentinel-backend.onrender.com';
    }
    return normalized;
  }
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
      return 'http://127.0.0.1:8000';
    }
    // In production without explicit VITE_API_URL, default to same-origin relative URLs
    return '';
  }
  return 'http://127.0.0.1:8000';
};

const API_BASE = getApiBase();

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  try {
    const token = localStorage.getItem('graphsentinel_token');
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) errorMsg = errorJson.detail;
        else if (errorJson.message) errorMsg = errorJson.message;
      } catch {
        // ignore fallback
      }
      throw new ApiError(errorMsg, res.status);
    }

    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Network error connecting to GraphSentinel API (${API_BASE}): ${err.message}`, 0);
  }
}

export const api = {
  // Authentication & Profile
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string, full_name: string, role?: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, role: role || 'Site Reliability Engineer' }),
    }),

  getMe: () => request<UserProfile>('/api/auth/me'),

  getProfile: () => request<UserProfile>('/api/auth/profile'),

  updateProfile: (data: UpdateProfileRequest) =>
    request<UserProfile>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: ChangePasswordRequest) =>
    request<{ status: string; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ status: string; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  // System Health & Overview
  getHealth: () => request<HealthResponse>('/api/health'),

  getOverview: () => request<OverviewResponse>('/api/overview'),

  globalSearch: (q: string) =>
    request<GlobalSearchResponse>(`/api/overview/search?q=${encodeURIComponent(q)}`),

  // Services
  getServices: (params?: { status?: string; criticality?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.criticality) query.set('criticality', params.criticality);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<ServiceSummary[]>(`/api/services${qs}`);
  },

  getService: (serviceId: string) => request<ServiceDetail>(`/api/services/${serviceId}`),

  // Incidents
  getIncidents: (params?: {
    status?: string;
    severity?: string;
    service_id?: string;
    search?: string;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.service_id) query.set('service_id', params.service_id);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<IncidentSummary[]>(`/api/incidents${qs}`);
  },

  getIncident: (incidentId: string) => request<IncidentDetail>(`/api/incidents/${incidentId}`),

  getIncidentImpact: (incidentId: string, maxDepth: number = 3) =>
    request<ImpactAnalysisResponse>(`/api/incidents/${incidentId}/impact?max_depth=${maxDepth}`),

  getIncidentReport: (incidentId: string) =>
    request<InvestigationReportResponse>(`/api/incidents/${incidentId}/report`),

  // Resolution Workflow & Recovery Verification
  getResolutionWorkflow: (incidentId: string) =>
    request<ResolutionWorkflowResponse>(`/api/incidents/${incidentId}/resolution`),

  updateStepStatus: (incidentId: string, stepId: string, status: string, actor?: string) =>
    request<ResolutionStepItem>(`/api/incidents/${incidentId}/resolution/steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, actor: actor || 'On-Call SRE' }),
    }),

  verifyRecovery: (incidentId: string, checklistOverrides?: Record<string, boolean>) =>
    request<VerifyRecoveryResponse>(`/api/incidents/${incidentId}/resolution/verify`, {
      method: 'POST',
      body: JSON.stringify({ checklist_overrides: checklistOverrides || {} }),
    }),

  resolveIncident: (
    incidentId: string,
    data: {
      root_cause_conclusion: string;
      actions_taken: string;
      verification_outcome: string;
      resolution_notes: string;
      resolved_by?: string;
    }
  ) =>
    request<{ status: string; message: string; resolution: any }>(`/api/incidents/${incidentId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reopenIncident: (incidentId: string, reason: string, reopened_by?: string) =>
    request<{ status: string; message: string; detail: any }>(`/api/incidents/${incidentId}/reopen`, {
      method: 'POST',
      body: JSON.stringify({ reason, reopened_by: reopened_by || 'On-Call SRE' }),
    }),

  // Graph Explorer & Diagnostics
  getGraphData: (params?: {
    include_evidence?: boolean;
    incident_id?: string;
    service_id?: string;
    relationship_type?: string;
    severity?: string;
    max_depth?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.include_evidence !== undefined) query.set('include_evidence', String(params.include_evidence));
    if (params?.incident_id) query.set('incident_id', params.incident_id);
    if (params?.service_id) query.set('service_id', params.service_id);
    if (params?.relationship_type) query.set('relationship_type', params.relationship_type);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.max_depth) query.set('max_depth', String(params.max_depth));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<GraphResponse>(`/api/graph${qs}`);
  },

  getGraphDiagnostics: () =>
    request<GraphDiagnosticsResponse>('/api/graph/diagnostics'),

  // AI Agent & Chat
  sendChat: (data: ChatRequest) =>
    request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  translateText: (data: TranslateMessageRequest) =>
    request<{ original: string; target_language: string; translated_text: string }>('/api/chat/translate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Investigation History & Sessions
  getConversations: () =>
    request<ConversationSummary[]>('/api/history'),

  createConversation: (title?: string) =>
    request<ConversationSummary>('/api/history', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  getConversation: (conversationId: string) =>
    request<ConversationDetail>(`/api/history/${conversationId}`),

  deleteConversation: (conversationId: string) =>
    request<{ status: string; message: string }>(`/api/history/${conversationId}`, {
      method: 'DELETE',
    }),

  // Data Workspace & Provenance
  uploadDatasetFile: async (file: File): Promise<UploadPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<UploadPreviewResponse>('/api/data/upload', {
      method: 'POST',
      body: formData,
    });
  },

  importDataset: (data: ImportDatasetRequest) =>
    request<DatasetSummary>('/api/data/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDatasets: () =>
    request<DatasetSummary[]>('/api/data/datasets'),

  getDatasetRecords: (
    datasetId: string,
    params?: { valid_only?: boolean; rejected_only?: boolean; limit?: number }
  ) => {
    const query = new URLSearchParams();
    if (params?.valid_only) query.set('valid_only', 'true');
    if (params?.rejected_only) query.set('rejected_only', 'true');
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<DatasetRecordItem[]>(`/api/data/datasets/${datasetId}/records${qs}`);
  },

  deleteDataset: (datasetId: string) =>
    request<{ status: string; message: string }>(`/api/data/datasets/${datasetId}`, {
      method: 'DELETE',
    }),

  getProvenance: () =>
    request<ProvenanceSummaryResponse>('/api/data/provenance'),

  // Admin
  triggerSeed: (wipe: boolean, adminSecret: string) =>
    request<{ message: string; summary: any }>(`/api/admin/seed?wipe=${wipe}`, {
      method: 'POST',
      headers: {
        'X-Admin-Secret': adminSecret,
      },
    }),
};
