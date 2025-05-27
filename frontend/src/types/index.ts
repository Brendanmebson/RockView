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
  // Add optional fields for assignment status
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
  // Add optional fields for assignment status
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
  // Add optional fields for assignment status
  isAssigned?: boolean;
  assignedLeaders?: {
    name: string;
    email: string;
  }[];
  displayText?: string;
}

// Add detailed user interface for admin management
export interface UserWithDetails extends User {
  cithCentreDetails?: {
    _id: string;
    name: string;
    location: string;
  };
  areaSupervisorDetails?: {
    _id: string;
    name: string;
  };
  districtDetails?: {
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
  cithCentreId: CithCentre;
  week: string;
  data: WeeklyReportData;
  status: 'pending' | 'area_approved' | 'district_approved' | 'rejected';
  submittedBy: User;
  submittedAt: string;
  areaApprovedBy?: User;
  areaApprovedAt?: string;
  districtApprovedBy?: User;
  districtApprovedAt?: string;
  rejectionReason?: string;
  rejectedBy?: User;
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