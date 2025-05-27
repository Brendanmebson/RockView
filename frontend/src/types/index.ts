// frontend/src/types/index.ts
export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'cith_centre' | 'area_supervisor' | 'district_pastor' | 'admin';
  cithCentreId?: string;
  areaSupervisorId?: string;
  districtId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface District {
  _id: string;
  name: string;
  districtNumber: number;
  pastorName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isAssigned?: boolean;
  assignedPastor?: {
    name: string;
    email: string;
  };
  displayText?: string;
}

export interface AreaSupervisor {
  _id: string;
  name: string;
  districtId: District;
  supervisorName: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  isAssigned?: boolean;
  assignedSupervisor?: {
    name: string;
    email: string;
  };
  displayText?: string;
}

export interface CithCentre {
  _id: string;
  name: string;
  areaSupervisorId: AreaSupervisor;
  location: string;
  leaderName: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  isAssigned?: boolean;
  assignedLeaders?: {
    name: string;
    email: string;
  }[];
  displayText?: string;
}

// Separate interface for populated user data - does NOT extend User
export interface PopulatedUser {
  _id: string;
  email: string;
  name: string;
  role: 'cith_centre' | 'area_supervisor' | 'district_pastor' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cithCentreId?: CithCentre;
  areaSupervisorId?: AreaSupervisor;
  districtId?: District;
}

// Interface for user data that might be partially populated - does NOT extend User
export interface UserWithDetails {
  _id: string;
  email: string;
  name: string;
  role: 'cith_centre' | 'area_supervisor' | 'district_pastor' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cithCentreId?: string | {
    _id: string;
    name: string;
    location: string;
  };
  areaSupervisorId?: string | {
    _id: string;
    name: string;
  };
  districtId?: string | {
    _id: string;
    name: string;
    districtNumber: number;
  };
}

export interface WeeklyReportData {
  male: number;
  female: number;
  children: number;
  offerings: number;
  numberOfTestimonies: number;
  numberOfFirstTimers: number;
  firstTimersFollowedUp: number;
  firstTimersConvertedToCITH: number;
  modeOfMeeting: 'physical' | 'virtual' | 'hybrid';
  remarks?: string;
}

export interface WeeklyReport {
  _id: string;
  cithCentreId: {
    _id: string;
    name: string;
    location: string;
    leaderName: string;
    areaSupervisorId?: {
      _id: string;
      name: string;
      districtId?: {
        _id: string;
        name: string;
        districtNumber: number;
      };
    };
  };
  week: string;
  data: WeeklyReportData;
  status: 'pending' | 'area_approved' | 'district_approved' | 'rejected';
  submittedBy: {
    _id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  areaApprovedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  areaApprovedAt?: string;
  districtApprovedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  districtApprovedAt?: string;
  rejectionReason?: string;
  rejectedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSummary {
  totalMale: number;
  totalFemale: number;
  totalChildren: number;
  totalOfferings: number;
  totalTestimonies: number;
  totalFirstTimers: number;
  totalFirstTimersFollowedUp: number;
  totalFirstTimersConverted: number;
  totalReports: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface Message {
  _id: string;
  from: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  to: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  subject: string;
  content: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'report' | 'announcement' | 'prayer_request' | 'administrative';
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  replyTo?: {
    _id: string;
    subject: string;
    content: string;
    from: {
      name: string;
    };
  };
}

// Dashboard data interfaces
export interface DashboardStats {
  totalUsers: number;
  totalDistricts: number;
  totalAreaSupervisors: number;
  totalCithCentres: number;
  totalReports: number;
  totalAttendance: number;
  totalOfferings: number;
  totalFirstTimers: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
}

export interface AttendanceData {
  week: string;
  male: number;
  female: number;
  children: number;
  total: number;
}

export interface OfferingData {
  week: string;
  amount: number;
}

export interface PerformanceData {
  name: string;
  attendance: number;
  offerings: number;
  firstTimers: number;
  district?: string;
}

// Form interfaces
export interface ReportFormData extends WeeklyReportData {
  week: Date | null;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  cithCentreId?: string;
  areaSupervisorId?: string;
  districtId?: string;
}

export interface DistrictFormData {
  name: string;
  districtNumber: number;
  pastorName: string;
  description?: string;
}

export interface AreaSupervisorFormData {
  name: string;
  districtId: string;
  supervisorName: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CithCentreFormData {
  name: string;
  areaSupervisorId: string;
  location: string;
  leaderName: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Filter interfaces
export interface ReportFilters {
  status: string;
  page: number;
  startDate: string | null;
  endDate: string | null;
  cithCentreId: string;
  areaSupervisorId: string;
}

export interface UserFilters {
  role: string;
  isActive: boolean | null;
  search: string;
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface ReportsResponse {
  reports: WeeklyReport[];
  totalPages: number;
  currentPage: number;
  total: number;
}

// Error handling interfaces
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Utility type for safe property access
export type SafeString = string | null | undefined;
export type SafeNumber = number | null | undefined;

// Helper interfaces for type guards
export interface HasId {
  _id: string;
}

export interface HasName {
  name: string;
}

export interface HasEmail {
  email: string;
}

// Type guards and utility types
export type StringOrObject<T> = string | T;

export interface IdNamePair {
  _id: string;
  name: string;
}

export interface BasicUser extends IdNamePair {
  email: string;
  role: string;
}

export interface BasicCentre extends IdNamePair {
  location: string;
}

export interface BasicArea extends IdNamePair {
  supervisorName: string;
}

export interface BasicDistrict extends IdNamePair {
  districtNumber: number;
  pastorName: string;
}