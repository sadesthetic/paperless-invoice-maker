export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  website?: string;
}

export interface CustomerInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface DocumentData {
  type: 'Receipt' | 'Invoice';
  number: string;
  date: string;
  dueDate: string;
  purpose: string;
  customer: CustomerInfo;
  shippedTo: CustomerInfo;
  items: LineItem[];
  currency: string;
  notes: string;
  paymentMethod: string;
  internalAcNumber: string;
  upi?: string;
  paymentLink?: string;
  showQr: boolean;
}
