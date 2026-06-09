export interface Department {
  id: number;
  name: string;
  code: string;
  external_id: number;
  is_default?: number;
}

export interface Sender {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

export interface Company {
  id: number;
  company_name: string;
  tax_code?: string;
  address?: string;
  contacts?: Contact[];
}

export interface Contact {
  id: number;
  name: string;
  phone?: string;
}

export interface PhoneSearchResult {
  id: number;
  company_name: string;
  phone: string;
  contactName?: string;
}

export interface ContactSearchResult {
  id: number;
  contactName: string;
  phone: string;
  company_name: string;
}

export interface Attachment {
  name: string;
  qty: number;
  is_original: boolean;
  is_original_hph: boolean;
  is_copy: boolean;
  detail: string;
  note: string;
  checked: boolean;
  selected?: boolean;
  showDetail?: boolean;
  showNote?: boolean;
  external_profile_id?: number | null;
}

export interface VisaLevel {
  id: number;
  name: string;
}

export interface OrderFormData {
  department: number | null;
  senderName: string;
  senderId: number | null;
  senderPhone: string;
  senderEmail: string;
  orderType: "DELIVERY" | "PICKUP";
  company: string;
  companyId: number | null;
  taxCode: string;
  phone: string;
  contact: string;
  contactId: number | null;
  addressLine: string;
  time: string;
  timeSlot: string | null;
  date: string;
  priority: "NORMAL" | "HIGH";
  purpose: string;
  notes: string;
  amountVND: string;
  amountUSD: string;
  paymentType: "COLLECT" | "PAY" | null;
  visaType1: number | null;
  visaType2: number | null;
}

export interface FormErrors {
  department?: string;
  senderName?: string;
  company?: string;
  addressLine?: string;
  purpose?: string;
  [key: string]: string | undefined;
}

export interface NotificationState {
  visible: boolean;
  type: "success" | "error";
  message: string;
}

export interface UploadedFile {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

export interface ExistingFile {
  id: number;
  name: string;
  type: string;
  data: string;
  _deleting?: boolean;
}

export interface OrderData {
  id: number;
  orderCode?: string;
  department?: Department;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  externalSenderId?: number;
  orderType?: "DELIVERY" | "PICKUP";
  company?: string;
  companyId?: number;
  taxCode?: string;
  phone?: string;
  contact?: string;
  contactId?: number;
  address?: string;
  time?: string;
  timeSlot?: string | null;
  date?: string;
  priority?: "NORMAL" | "HIGH";
  purpose?: string;
  notes?: string;
  amountVND?: number;
  amountUSD?: number;
  paymentType?: "COLLECT" | "PAY" | null;
  visaType1?: number;
  visaType2?: number;
  attachments?: Attachment[];
  uploadedFiles?: ExistingFile[];
}