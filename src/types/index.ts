export interface Quote {
  id: string;
  userId: string;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  status: 'draft' | 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  validUntil: Date;
  items: QuoteItem[];
  totalAmount: number;
  currency: 'MGA';
  notes?: string;
  shippingMethod: 'air' | 'sea' | 'land';
  originCountry: string;
  destinationPort: string;
  estimatedDelivery: Date;
  downPayment?: DownPayment;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  remainingAmount: number;
}

export interface DownPayment {
  id: string;
  amount: number;
  percentage: number;
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
}

export interface PaymentHistory {
  id: string;
  quoteId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  type: 'downpayment' | 'final' | 'partial';
  notes?: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  miscFees: number;
  customsFees: number;
  sellingPrice: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  hsCode?: string;
  category: string;
  productLink?: string;
  mainCurrency?: string;
  exchangeRates?: { [key: string]: number };
  transportFees?: number;
  transportFeesOriginal?: number;
  transportCurrency?: string;
  margin?: number;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  createdAt: Date;
  totalQuotes: number;
  totalValue: number;
}

export interface DashboardStats {
  totalQuotes: number;
  pendingQuotes: number;
  confirmedQuotes: number;
  deliveredQuotes: number;
  totalValue: number;
  monthlyGrowth: number;
}