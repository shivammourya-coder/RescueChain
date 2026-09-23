import { EmergencyRequest, ResourceItem, AnalyticsData, User } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "";

function getHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  const token = localStorage.getItem("rescuechain_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      // no-op
    }
    const err = new Error(errorMsg) as any;
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  auth: {
    async register(data: {
      name: string;
      email: string;
      password: string;
      role: string;
      phone?: string;
      organization?: string;
    }): Promise<{ token: string; user: User }> {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },

    async login(data: { email: string; password: string }): Promise<{ token: string; user: User }> {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },

    async me(): Promise<User> {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  requests: {
    async create(data: {
      description: string;
      lat: number;
      lng: number;
      clientId: string;
      contact?: string;
      reportedAt?: string;
    }): Promise<EmergencyRequest> {
      const res = await fetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },

    async track(trackCode: string, reporterToken?: string): Promise<EmergencyRequest> {
      const headers = getHeaders();
      const savedToken = reporterToken || localStorage.getItem(`rescuechain_reporter_token_${trackCode}`);
      if (savedToken) {
        (headers as Record<string, string>)["x-reporter-token"] = savedToken;
      }
      const res = await fetch(`${API_BASE}/api/requests/track/${encodeURIComponent(trackCode)}`, {
        headers
      });
      return handleResponse(res);
    },

    async verifyReporter(trackCode: string, data: { phone?: string; otp?: string; quickVerify?: boolean }): Promise<{ verified: boolean; reporterToken: string; otp: string }> {
      const res = await fetch(`${API_BASE}/api/requests/track/${encodeURIComponent(trackCode)}/verify-reporter`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },

    async list(filters?: { status?: string; category?: string }): Promise<EmergencyRequest[]> {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.category) params.append("category", filters.category);
      const url = `${API_BASE}/api/requests${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { headers: getHeaders() });
      return handleResponse(res);
    },

    async flagFake(id: string): Promise<{ success: boolean; request: EmergencyRequest }> {
      const res = await fetch(`${API_BASE}/api/requests/${id}/flag-fake`, {
        method: "POST",
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    async escalate(id: string): Promise<EmergencyRequest> {
      const res = await fetch(`${API_BASE}/api/requests/${id}/escalate`, {
        method: "POST",
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  resources: {
    async list(): Promise<ResourceItem[]> {
      const res = await fetch(`${API_BASE}/api/resources`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    async create(data: {
      name: string;
      types: string[];
      quantity: number;
      unit: string;
      lat: number;
      lng: number;
    }): Promise<ResourceItem> {
      const res = await fetch(`${API_BASE}/api/resources`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },

    async update(id: string, data: { quantity?: number; active?: boolean }): Promise<ResourceItem> {
      const res = await fetch(`${API_BASE}/api/resources/${id}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },

  tasks: {
    async getAvailable(lat?: number, lng?: number): Promise<EmergencyRequest[]> {
      const params = new URLSearchParams();
      if (lat !== undefined) params.append("lat", String(lat));
      if (lng !== undefined) params.append("lng", String(lng));
      const res = await fetch(`${API_BASE}/api/tasks/available?${params.toString()}`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    async getMine(): Promise<EmergencyRequest[]> {
      const res = await fetch(`${API_BASE}/api/tasks/mine`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    async accept(id: string): Promise<EmergencyRequest> {
      const res = await fetch(`${API_BASE}/api/tasks/${id}/accept`, {
        method: "POST",
        headers: getHeaders()
      });
      return handleResponse(res);
    },

    async pickup(id: string, data: { photo?: string; lat?: number; lng?: number }): Promise<EmergencyRequest> {
      const res = await fetch(`${API_BASE}/api/tasks/${id}/pickup`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },

    async transit(id: string, data: { lat?: number; lng?: number }): Promise<EmergencyRequest> {
      const res = await fetch(`${API_BASE}/api/tasks/${id}/transit`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },

    async deliver(id: string, data: { otp: string; lat?: number; lng?: number }): Promise<{ success: boolean; request: EmergencyRequest }> {
      const res = await fetch(`${API_BASE}/api/tasks/${id}/deliver`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },

  analytics: {
    async get(): Promise<AnalyticsData> {
      const res = await fetch(`${API_BASE}/api/analytics`, {
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  },

  demo: {
    async reset(): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`${API_BASE}/api/demo/reset`, {
        method: "POST",
        headers: getHeaders()
      });
      return handleResponse(res);
    }
  }
};
