// Core TypeScript definitions for RescueChain

export type UserRole = "volunteer" | "ngo" | "authority";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  organization?: string;
}

export type RequestStatus =
  | "REPORTED"
  | "AI_PROCESSED"
  | "CLUSTERED"
  | "RESOURCE_MATCHED"
  | "VOLUNTEER_ASSIGNED"
  | "PICKUP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "VERIFIED";

export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

export type EmergencyCategory = "medical" | "food" | "water" | "shelter" | "rescue" | "other";

export interface TimelineEntry {
  status: RequestStatus;
  at: string;
  by: string;
  note: string;
  location?: [number, number]; // [lng, lat]
  photoUrl?: string;
}

export interface EmergencyRequest {
  id: string;
  clientId?: string;
  trackCode: string;
  otp?: string;
  reporterToken?: string;
  isReporter?: boolean;
  description: string;
  category: EmergencyCategory;
  urgency: UrgencyLevel;
  needs: string[];
  summary: string;
  people: number;
  suspectedFake: boolean;
  triageSource: "ai" | "rules";
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  contact?: string;
  status: RequestStatus;
  timeline: TimelineEntry[];
  clusterId?: string;
  duplicateOf?: string;
  reportCount: number;
  escalationLevel: number;
  resource?: {
    id: string;
    name: string;
    type: string;
    quantity: number;
    unit: string;
    location: [number, number];
  };
  volunteer?: {
    id: string;
    name: string;
    phone?: string;
  };
  reportedAt: string;
  deliveredAt?: string;
  distanceKm?: number;
  etaMinutes?: number;
  speedLabel?: string;
}

export interface ResourceItem {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  types: string[];
  quantity: number;
  unit: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  active: boolean;
  allocated: number;
}

export interface QueuedOfflineReport {
  clientId: string;
  description: string;
  lat: number;
  lng: number;
  contact?: string;
  reportedAt: string;
  synced?: boolean;
}

export interface AnalyticsData {
  totalRequests: number;
  deliveredAndVerified: number;
  avgResponseTimeMinutes: number;
  duplicatesMerged: number;
  fakeFlagged: number;
  byStatus: Record<RequestStatus, number>;
  byCategory: Record<EmergencyCategory, number>;
  hotspots: Array<{
    clusterId: string;
    requestCount: number;
    lat: number;
    lng: number;
    maxUrgency: number;
  }>;
  stock: Array<{
    name: string;
    total: number;
    allocated: number;
    available: number;
    unit: string;
  }>;
  shortages: Array<{
    item: string;
    deficit: number;
    severity: "critical" | "high" | "medium";
  }>;
}
