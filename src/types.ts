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

export interface BankInfo {
  accountNumber: string;
  accountName: string;
  bankName: string;
  routingOrIfsc: string;
  upi?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  discount: number;
  cgst: number;
  sgst: number;
}

export interface DocumentData {
  type: 'Receipt' | 'Invoice';
  number: string;
  date: string;
  dueDate: string;
  customer: CustomerInfo;
  shippedTo: CustomerInfo;
  items: LineItem[];
  currency: string;
  notes: string;
  paymentMethod: string;
  bankInfo: BankInfo;
  paymentLink?: string;
  showQr: boolean;
}
