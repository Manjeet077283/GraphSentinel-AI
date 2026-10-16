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
  ChatResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
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
  getHealth: () => request<HealthResponse>('/api/health'),

  getOverview: () => request<OverviewResponse>('/api/overview'),

  getServices: (params?: { status?: string; criticality?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.criticality) query.set('criticality', params.criticality);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<ServiceSummary[]>(`/api/services${qs}`);
  },

  getService: (serviceId: string) => request<ServiceDetail>(`/api/services/${serviceId}`),

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

  getGraphData: (params?: {
    include_evidence?: boolean;
    incident_id?: string;
    service_id?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.include_evidence !== undefined) query.set('include_evidence', String(params.include_evidence));
    if (params?.incident_id) query.set('incident_id', params.incident_id);
    if (params?.service_id) query.set('service_id', params.service_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<GraphResponse>(`/api/graph${qs}`);
  },

  sendChat: (data: ChatRequest) =>
    request<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  triggerSeed: (wipe: boolean, adminSecret: string) =>
    request<{ message: string; summary: any }>(`/api/admin/seed?wipe=${wipe}`, {
      method: 'POST',
      headers: {
        'X-Admin-Secret': adminSecret,
      },
    }),
};
