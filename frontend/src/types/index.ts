// frontend/src/types/index.ts
export interface User {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: 'cith_centre' | 'area_supervisor' | 'zonal_supervisor' | 'district_pastor' | 'admin';  cithCentreId?: string;
  areaSupervisorId?: string;
  districtId?: string;
  ZonalSupervisorId?: string;
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
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  displayText?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface AreaSupervisor {
  _id: string;
  name: string;
  districtId: District | string;
  supervisorName: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  isAssigned?: boolean;
  assignedSupervisor?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  displayText?: string;
}

export interface ZonalSupervisor {
  _id: string;
  name: string;
  districtId: District | string;
  areaSupervisorIds: (AreaSupervisor | string)[];
  supervisorName: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  isAssigned?: boolean;
  assignedSupervisor?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  displayText?: string;
}

export interface CithCentre {
  _id: string;
  name: string;
  areaSupervisorId: AreaSupervisor | string;
  location: string;
  leaderName: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
  isAssigned?: boolean;
  assignedLeaders?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  }[];
  displayText?: string;
  areaSupervisorName?: string;
  districtName?: string;
  leaderCount?: number;
  maxLeaders?: number;
  hasVacancy?: boolean;
}

// Separate interface for populated user data
export interface PopulatedUser {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: 'cith_centre' | 'area_supervisor' | 'zonal_supervisor' | 'district_pastor' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cithCentreId?: CithCentre;
  areaSupervisorId?: AreaSupervisor;
  districtId?: District;
}

// Interface for user data that might be partially populated
export interface UserWithDetails {
  _id: string;
  email: string;
  name: string;
  phone: string;
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
  ZonalSupervisorId?: string | {
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
  eventType: string;
  eventDescription?: string;
  data: WeeklyReportData;
  status: 'pending' | 'area_approved' | 'zonal_approved' | 'district_approved' | 'rejected';    submittedBy: {
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
  zonalApprovedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  zonalApprovedAt?: string;
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
  userCentre: CithCentre | null;
  userArea: AreaSupervisor | null;
  userDistrict: District | null;
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
  attachments?: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
  }[];
}

// Dashboard data interfaces
export interface DashboardStats {
  totalUsers: number;
  totalDistricts: number;
  totalAreaSupervisors: number;
  totalCithCentres: number;
  assignedDistricts: number;
  assignedAreas: number;
  assignedCentres: number;
  totalReports: number;
  totalAttendance: number;
  totalOfferings: number;
  totalFirstTimers: number;
}

export interface MonthlyStats {
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

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
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

export interface FirstTimerData {
  week: string;
  firstTimers: number;
  followedUp: number;
  converted: number;
}

export interface DemographicData {
  name: 'Male' | 'Female' | 'Children';
  value: number;
}

export interface PerformanceData {
  name: string;
  attendance: number;
  offerings: number;
  firstTimers: number;
  testimonies: number;
  centres?: number;
  district?: string;
}

export interface CentreComparisonData {
  name: string;
  attendance: number;
  offerings: number;
  firstTimers: number;
  testimonies: number;
}

// Form interfaces
export interface ReportFormData extends WeeklyReportData {
  week: Date | null;
  eventType: string;
  eventDescription?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  cithCentreId?: string;
  areaSupervisorId?: string;
  districtId?: string;
}

export interface DistrictFormData {
  name: string;
  districtNumber: number;
  pastorName?: string;
  description?: string;
}

export interface AreaSupervisorFormData {
  name: string;
  districtId: string;
  supervisorName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface CithCentreFormData {
  name: string;
  areaSupervisorId: string;
  location: string;
  leaderName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface EditUserFormData {
  role: string;
  targetId: string;
  districtId: string;
  areaId: string;
  phone: string;
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
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
}

export interface CithCentreFilters {
  search: string;
  districtId: string;
  areaSupervisorId: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
}

export interface AreaSupervisorFilters {
  search: string;
  districtId: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
}

export interface DistrictFilters {
  search: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
}

// Position Change Request interfaces
export interface PositionChangeRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  currentRole: string;
  newRole: string;
  targetId: string;
  targetEntityName?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  rejectionReason?: string;
}

// Event Type definitions
export type EventType = 
  | 'regular_service'
  | 'singles_day'
  | 'youth_day'
  | 'womens_day'
  | 'mens_day'
  | 'harvest'
  | 'thanksgiving'
  | 'special_crusade'
  | 'baptism_service'
  | 'communion_service'
  | 'prayer_meeting'
  | 'other';

export interface EventTypeOption {
  value: EventType;
  label: string;
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

export interface MessagesResponse {
  messages: Message[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface UsersResponse {
  users: UserWithDetails[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ExportParams {
  startDate?: string;
  endDate?: string;
  format?: 'xlsx' | 'csv';
}

// Error handling interfaces
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string;
}

// Assignment statistics interfaces
export interface AssignmentStats {
  districts: {
    total: number;
    assigned: number;
    unassigned: number;
    assignmentRate: string;
  };
  areaSupervisors: {
    total: number;
    assigned: number;
    unassigned: number;
    assignmentRate: string;
  };
  cithCentres: {
    total: number;
    assigned: number;
    unassigned: number;
    assignmentRate: string;
  };
  overall: {
    totalPositions: number;
    assignedPositions: number;
    overallAssignmentRate: string;
  };
}

export interface AvailablePosition {
  _id: string;
  name: string;
  isAvailable: boolean;
  positionType: string;
  currentLeaderCount?: number;
  maxLeaders?: number;
  hasVacancy?: boolean;
  districtNumber?: number;
  location?: string;
}

export interface AvailablePositionsResponse {
  role: string;
  totalAvailable: number;
  positions: AvailablePosition[];
}

// Utility type for safe property access
export type SafeString = string | null | undefined;
export type SafeNumber = number | null | undefined;
export type SafeBoolean = boolean | null | undefined;
export type SafeDate = string | Date | null | undefined;

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

export interface HasPhone {
  phone: string;
}

export interface HasRole {
  role: string;
}

export interface HasTimestamps {
  createdAt: string;
  updatedAt: string;
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
  phone: string;
  isActive: boolean;
}

export interface BasicCentre extends IdNamePair {
  location: string;
  leaderName: string;
}

export interface BasicArea extends IdNamePair {
  supervisorName: string;
  districtId: string;
}

export interface BasicDistrict extends IdNamePair {
  districtNumber: number;
  pastorName: string;
}

// Component prop interfaces
export interface TableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string;
}

export interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: any;
  onFilterChange: (filters: any) => void;
  sortOptions: { value: string; label: string }[];
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onClearFilters: () => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems: number;
}

// Context interfaces
export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  autoHide?: boolean;
  duration?: number;
}

// Export utility functions for type checking
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj._id === 'string' && typeof obj.email === 'string';
};

export const isWeeklyReport = (obj: any): obj is WeeklyReport => {
  return obj && typeof obj._id === 'string' && obj.data && obj.cithCentreId;
};

export const isCithCentre = (obj: any): obj is CithCentre => {
  return obj && typeof obj._id === 'string' && typeof obj.name === 'string' && typeof obj.location === 'string';
};

export const isAreaSupervisor = (obj: any): obj is AreaSupervisor => {
  return obj && typeof obj._id === 'string' && typeof obj.name === 'string' && obj.districtId;
};

export const isDistrict = (obj: any): obj is District => {
  return obj && typeof obj._id === 'string' && typeof obj.name === 'string' && typeof obj.districtNumber === 'number';
};

// Role-based permission helpers
export type UserRole = 'admin' | 'district_pastor' | 'area_supervisor' | 'cith_centre';

export interface RolePermissions {
  canViewReports: boolean;
  canCreateReports: boolean;
  canApproveReports: boolean;
  canDeleteReports: boolean;
  canManageUsers: boolean;
  canManageDistricts: boolean;
  canManageAreas: boolean;
  canManageCentres: boolean;
  canExportData: boolean;
  canViewAnalytics: boolean;
}

export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'admin':
      return {
        canViewReports: true,
        canCreateReports: false,
        canApproveReports: true,
        canDeleteReports: true,
        canManageUsers: true,
        canManageDistricts: true,
        canManageAreas: true,
        canManageCentres: true,
        canExportData: true,
        canViewAnalytics: true,
      };
    case 'district_pastor':
      return {
        canViewReports: true,
        canCreateReports: false,
        canApproveReports: true,
        canDeleteReports: false,
        canManageUsers: false,
        canManageDistricts: false,
        canManageAreas: true,
        canManageCentres: true,
        canExportData: true,
        canViewAnalytics: true,
      };
    case 'area_supervisor':
      return {
        canViewReports: true,
        canCreateReports: false,
        canApproveReports: true,
        canDeleteReports: false,
        canManageUsers: false,
        canManageDistricts: false,
        canManageAreas: false,
        canManageCentres: true,
        canExportData: true,
        canViewAnalytics: true,
      };
    case 'cith_centre':
      return {
        canViewReports: true,
        canCreateReports: true,
        canApproveReports: false,
        canDeleteReports: true, // Own reports only
        canManageUsers: false,
        canManageDistricts: false,
        canManageAreas: false,
        canManageCentres: false,
        canExportData: false,
        canViewAnalytics: false,
      };
    default:
      return {
        canViewReports: false,
        canCreateReports: false,
        canApproveReports: false,
        canDeleteReports: false,
        canManageUsers: false,
        canManageDistricts: false,
        canManageAreas: false,
        canManageCentres: false,
        canExportData: false,
        canViewAnalytics: false,
      };
  }
};

// Constants for UI components
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  district_pastor: 'District Pastor',
  area_supervisor: 'Area Supervisor',
  cith_centre: 'CITH Centre Leader',
};

export const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  area_approved: 'info',
  district_approved: 'success',
  rejected: 'error',
  active: 'success',
  inactive: 'default',
  assigned: 'success',
  unassigned: 'default',
};

export const PRIORITY_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  low: 'default',
  normal: 'primary',
  high: 'warning',
  urgent: 'error',
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  regular_service: 'Regular Service',
  singles_day: 'Singles Day',
  youth_day: 'Youth Day',
  womens_day: "Women's Day",
  mens_day: "Men's Day",
  harvest: 'Harvest Service',
  thanksgiving: 'Thanksgiving Service',
  special_crusade: 'Special Crusade',
  baptism_service: 'Baptism Service',
  communion_service: 'Communion Service',
  prayer_meeting: 'Prayer Meeting',
  other: 'Other Event',
};