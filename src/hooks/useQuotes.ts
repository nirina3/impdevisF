import { useState, useEffect } from 'react';
import { Quote, QuoteItem } from '../types';

// Mock data pour la démonstration
const mockQuotes: Quote[] = [
  {
    id: '1',
    quoteNumber: 'QT-2024-001',
    clientName: 'Mohammed Alami',
    clientEmail: 'mohammed.alami@email.com',
    clientPhone: '+212 6 12 34 56 78',
    clientAddress: '123 Rue Hassan II, Casablanca, Maroc',
    status: 'confirmed',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    validUntil: new Date('2024-02-15'),
    totalAmount: 78750000,
    currency: 'MGA',
    shippingMethod: 'sea',
    originCountry: 'Chine',
    destinationPort: 'Port de Casablanca',
    estimatedDelivery: new Date('2024-02-28'),
    downPayment: {
      id: 'dp1',
      amount: 23625000,
      percentage: 30,
      paidDate: new Date('2024-01-16'),
      paymentMethod: 'Virement bancaire'
    },
    paymentStatus: 'partial',
    remainingAmount: 55125000,
    items: [
      {
        id: '1',
        description: 'Équipements électroniques',
        quantity: 50,
        unitPrice: 1250000,
        purchasePrice: 800000,
        miscFees: 150000,
        customsFees: 200000,
        sellingPrice: 1250000,
        weight: 500,
        dimensions: { length: 30, width: 20, height: 15 },
        hsCode: '8517.12.00',
        category: 'Électronique',
        productLink: 'https://example.com/product1'
      },
      {
        id: '2',
        description: 'Accessoires informatiques',
        quantity: 100,
        unitPrice: 375000,
        purchasePrice: 250000,
        miscFees: 50000,
        customsFees: 75000,
        sellingPrice: 375000,
        weight: 200,
        dimensions: { length: 15, width: 10, height: 5 },
        hsCode: '8473.30.20',
        category: 'Informatique'
      }
    ],
    notes: 'Livraison urgente demandée'
  },
  {
    id: '2',
    quoteNumber: 'QT-2024-002',
    clientName: 'Fatima Benali',
    clientEmail: 'fatima.benali@email.com',
    clientPhone: '+212 6 87 65 43 21',
    clientAddress: '456 Avenue Mohammed V, Rabat, Maroc',
    status: 'pending',
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    validUntil: new Date('2024-02-18'),
    totalAmount: 44500000,
    currency: 'MGA',
    shippingMethod: 'air',
    originCountry: 'Allemagne',
    destinationPort: 'Aéroport Mohammed V',
    estimatedDelivery: new Date('2024-02-05'),
    paymentStatus: 'unpaid',
    remainingAmount: 44500000,
    items: [
      {
        id: '3',
        description: 'Machines industrielles',
        quantity: 2,
        unitPrice: 21000000,
        purchasePrice: 15000000,
        miscFees: 2000000,
        customsFees: 4000000,
        sellingPrice: 21000000,
        weight: 1500,
        dimensions: { length: 200, width: 150, height: 100 },
        hsCode: '8479.89.97',
        category: 'Machines'
      }
    ]
  },
  {
    id: '3',
    quoteNumber: 'QT-2024-003',
    clientName: 'Ahmed Tazi',
    clientEmail: 'ahmed.tazi@email.com',
    clientPhone: '+212 6 11 22 33 44',
    clientAddress: '789 Rue Allal Ben Abdellah, Fès, Maroc',
    status: 'delivered',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25'),
    validUntil: new Date('2024-02-10'),
    totalAmount: 111500000,
    currency: 'MGA',
    shippingMethod: 'sea',
    originCountry: 'Italie',
    destinationPort: 'Port de Tanger Med',
    estimatedDelivery: new Date('2024-01-30'),
    downPayment: {
      id: 'dp3',
      amount: 111500000,
      percentage: 100,
      paidDate: new Date('2024-01-25'),
      paymentMethod: 'Espèces'
    },
    paymentStatus: 'paid',
    remainingAmount: 0,
    items: [
      {
        id: '4',
        description: 'Matériaux de construction',
        quantity: 1000,
        unitPrice: 92500,
        purchasePrice: 60000,
        miscFees: 10000,
        customsFees: 22500,
        sellingPrice: 92500,
        weight: 5000,
        dimensions: { length: 100, width: 50, height: 20 },
        hsCode: '6810.11.00',
        category: 'Construction'
      }
    ]
  }
];

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useQuotes - Starting to load quotes...');
    // Simuler un appel API
    setTimeout(() => {
      console.log('useQuotes - Loading mock quotes:', mockQuotes.length);
      setQuotes(mockQuotes);
      setLoading(false);
    }, 500);
  }, []);

  const addQuote = (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newQuote: Quote = {
      ...quote,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setQuotes(prev => [newQuote, ...prev]);
    return newQuote;
  };

  const updateQuote = (id: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(quote => 
      quote.id === id 
        ? { ...quote, ...updates, updatedAt: new Date() }
        : quote
    ));
  };

  const deleteQuote = (id: string) => {
    setQuotes(prev => prev.filter(quote => quote.id !== id));
  };

  const getQuoteById = (id: string) => {
    return quotes.find(quote => quote.id === id);
  };

  console.log('useQuotes - Current state:', { quotesCount: quotes.length, loading });
  return {
    quotes,
    loading,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuoteById
  };
};