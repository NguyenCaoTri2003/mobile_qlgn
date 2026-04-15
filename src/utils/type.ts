export type OrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PROCESSING"
  | "SUPPLEMENT_REQUIRED"
  | "REJECTED"
  | "COMPLETED"
  | "FINISHED"
  | "INCOMPLETE";
export type ViewState = 'DASHBOARD' | 'ORDERS' | 'LOGS' | 'USER_MANAGEMENT' | 'GUIDE';

export interface DepartmentType {
  id: number;
  name: string;
  code: string;
}
export type FilterType = 'ALL' | 'PENDING_GROUP' | 'DONE_GROUP' | 'SUPPLEMENT';

export interface Attachment {
  id: any;
  name: string;
  qty: number;
  checked: boolean;
}

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
}

export interface ActivityLog {
  id: number,
  timestamp: number;
  userEmail: string;
  userName: string;
  action: string;
  orderId: string;
  details: string;
  orderCode: string
}

export interface Notification {
  id: string;
  timestamp: number;
  message: string;
  read: boolean;
  targetRole?: 'QL' | 'NVADMIN' | 'NVGN' | 'IT';
  targetEmail?: string;
}

export interface Sender {
  name: string;
  phone: string;
}

// export const DEPARTMENTS: DepartmentType[] = ['Visa Việt Nam', 'Visa Nước Ngoài', 'Giấy Phép Lao Động'];

export interface CustomerData {
  phone: string;
  company: string;
  address: string;
  contact: string;
}

export const SENDERS: Sender[] = [
  { name: 'Thùy Dương GPLĐ', phone: '0906604788' },
  { name: 'Kim Chi Visa', phone: '0901234567' },
  { name: 'Minh Tâm Admin', phone: '0909888999' },
  { name: 'Lễ Tân Nhị Gia', phone: '02838456789' }
];

export interface Order {
  id: number;
  orderCode: string;
  createDate: number;
  creator: string;
  receiver: string | null;
  receiverName?: string;
  department: DepartmentType;
  senderName: string;
  senderPhone: string;
  time: string;
  date: string;
  company: string;
  address: string; // Combined full address
  addressLine?: string; // Formerly addressNumber/Số địa chỉ
  ward?: string;
  district?: string;
  province?: string;
  contact: string;
  phone: string;
  purpose: string;
  notes: string;
  amountVND: number;
  amountUSD: number;
  attachments: Attachment[];
  uploadedFiles?: { name: string, type: string, data: string }[];
  missingDocs?: string;
  orderId?: string;
  status: OrderStatus;
  statusUpdateDate?: number;
  completionImages?: string[];
  completionNote?: string;
  deliveryLocation?: LocationData;
  signature?: string;
  rejectionReason?: string;
  supplementNote?: string;
  supplementRequesterName?: string;
  supplementDate?: number;
  requestNote?: string;
  reviewNote?: string;
  adminResponse?: string;
  priority: 'high' | 'medium' | 'normal' | 'low';
  sort_index: number;
  shipperHighlightColor?: 'red' | 'blue' | 'yellow' | null;
  updatedAt: number;
  files?: { id: number; fileName: string; filePath: string, originalName: string }[];
}

export type UserRole = "QL" | "NVADMIN" | "NVGN" | "IT";

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  departmentId?: number;
}