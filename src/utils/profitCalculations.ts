import { Quote } from '../types';

export interface ProfitAnalysis {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  costRatio: number;
  quotesAnalyzed: number;
}

export interface PerformanceMetrics {
  averageQuoteValue: number;
  averageCostPerQuote: number;
  averageProfitPerQuote: number;
  returnOnInvestment: number;
  totalItems: number;
}

// Taux de change par défaut (identiques à ceux utilisés dans l'application)
const DEFAULT_EXCHANGE_RATES = {
  USD: 4500,
  EUR: 4900,
  CNY: 620
};

// Fonction pour convertir une devise vers MGA
const convertToMGA = (amount: number, currency: string, exchangeRates?: { [key: string]: number }): number => {
  if (currency === 'MGA') return amount;
  
  const rates = exchangeRates || DEFAULT_EXCHANGE_RATES;
  const rate = rates[currency];
  
  if (!rate) {
    console.warn(`Taux de change non trouvé pour ${currency}, utilisation du taux par défaut`);
    return amount * (DEFAULT_EXCHANGE_RATES[currency as keyof typeof DEFAULT_EXCHANGE_RATES] || 1);
  }
  
  return amount * rate;
};

// Calculer le coût total d'un article
const calculateItemCost = (item: any): number => {
  // Prix d'achat converti en MGA
  const purchasePriceMGA = convertToMGA(
    item.purchasePrice || 0, 
    item.mainCurrency || 'MGA', 
    item.exchangeRates
  );
  
  // Coût d'achat total
  const totalPurchaseCost = purchasePriceMGA * (item.quantity || 1);
  
  // Frais de transport (déjà en MGA ou convertis)
  const transportFees = item.transportFees || 0;
  
  // Autres frais (déjà en MGA)
  const miscFees = item.miscFees || 0;
  const customsFees = item.customsFees || 0;
  
  return totalPurchaseCost + transportFees + miscFees + customsFees;
};

// Calculer l'analyse des bénéfices
export const calculateProfitAnalysis = (quotes: Quote[]): ProfitAnalysis => {
  if (!quotes || quotes.length === 0) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      netProfit: 0,
      profitMargin: 0,
      costRatio: 0,
      quotesAnalyzed: 0
    };
  }

  let totalRevenue = 0;
  let totalCost = 0;

  quotes.forEach(quote => {
    // Chiffre d'affaires = prix de vente total du devis
    totalRevenue += quote.totalAmount;
    
    // Coût total = somme des coûts de tous les articles
    const quoteCost = quote.items.reduce((sum, item) => {
      return sum + calculateItemCost(item);
    }, 0);
    
    totalCost += quoteCost;
  });

  const netProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const costRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalCost,
    netProfit,
    profitMargin,
    costRatio,
    quotesAnalyzed: quotes.length
  };
};

// Calculer les métriques de performance
export const calculatePerformanceMetrics = (quotes: Quote[]): PerformanceMetrics => {
  if (!quotes || quotes.length === 0) {
    return {
      averageQuoteValue: 0,
      averageCostPerQuote: 0,
      averageProfitPerQuote: 0,
      returnOnInvestment: 0,
      totalItems: 0
    };
  }

  const analysis = calculateProfitAnalysis(quotes);
  const totalItems = quotes.reduce((sum, quote) => sum + quote.items.length, 0);

  const averageQuoteValue = analysis.totalRevenue / quotes.length;
  const averageCostPerQuote = analysis.totalCost / quotes.length;
  const averageProfitPerQuote = analysis.netProfit / quotes.length;
  const returnOnInvestment = analysis.totalCost > 0 ? (analysis.netProfit / analysis.totalCost) * 100 : 0;

  return {
    averageQuoteValue,
    averageCostPerQuote,
    averageProfitPerQuote,
    returnOnInvestment,
    totalItems
  };
};

// Filtrer les devis par période
export const filterQuotesByPeriod = (
  quotes: Quote[], 
  period: 'month' | 'year', 
  year: number, 
  month?: number
): Quote[] => {
  return quotes.filter(quote => {
    const quoteDate = new Date(quote.createdAt);
    const quoteYear = quoteDate.getFullYear();
    const quoteMonth = quoteDate.getMonth() + 1; // getMonth() retourne 0-11
    
    if (period === 'year') {
      return quoteYear === year;
    } else if (period === 'month' && month !== undefined) {
      return quoteYear === year && quoteMonth === month;
    }
    
    return false;
  });
};

// Calculer les tendances par rapport à une période précédente
export const calculateTrends = (current: ProfitAnalysis, previous: ProfitAnalysis) => {
  const revenueTrend = previous.totalRevenue > 0 
    ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
    : 0;
  
  const profitTrend = previous.netProfit > 0 
    ? ((current.netProfit - previous.netProfit) / previous.netProfit) * 100
    : 0;

  const quotesTrend = previous.quotesAnalyzed > 0 
    ? ((current.quotesAnalyzed - previous.quotesAnalyzed) / previous.quotesAnalyzed) * 100
    : 0;

  return { revenueTrend, profitTrend, quotesTrend };
};