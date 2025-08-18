import { Quote } from '../types';

/**
 * Utilitaires pour les calculs de bénéfices et analyses financières
 */

export interface ProfitAnalysis {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  costRatio: number;
  quotesAnalyzed: number;
}

/**
 * Calcule l'analyse des bénéfices pour une liste de devis
 * @param quotes - Liste des devis à analyser
 * @returns Analyse complète des bénéfices
 */
export const calculateProfitAnalysis = (quotes: Quote[]): ProfitAnalysis => {
  if (quotes.length === 0) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      netProfit: 0,
      profitMargin: 0,
      costRatio: 0,
      quotesAnalyzed: 0
    };
  }

  // Calculer le chiffre d'affaires total (somme des montants totaux des devis)
  const totalRevenue = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);

  // Calculer le coût total des marchandises
  const totalCost = quotes.reduce((sum, quote) => {
    return sum + quote.items.reduce((itemSum, item) => {
      // Utiliser les données de coût réelles si disponibles
      if (item.purchasePrice && item.exchangeRates && item.mainCurrency) {
        // Convertir le prix d'achat en MGA
        const exchangeRate = item.mainCurrency === 'MGA' ? 1 : 
                           item.exchangeRates[item.mainCurrency as keyof typeof item.exchangeRates] || 1;
        const purchasePriceMGA = item.purchasePrice * exchangeRate;
        
        // Coût total = (prix d'achat × quantité) + frais de transport + frais divers + frais de douane
        const itemTotalCost = (purchasePriceMGA * item.quantity) + 
                             (item.transportFees || 0) + 
                             (item.miscFees || 0) + 
                             (item.customsFees || 0);
        
        return itemSum + itemTotalCost;
      } else {
        // Si pas de données de coût détaillées, estimer basé sur une marge moyenne
        // Estimation : coût = 75% du prix de vente (marge de 25%)
        const estimatedCost = (item.unitPrice * item.quantity) * 0.75;
        return itemSum + estimatedCost;
      }
    }, 0);
  }, 0);

  // Calculer le bénéfice net
  const netProfit = totalRevenue - totalCost;

  // Calculer les ratios
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

/**
 * Filtre les devis selon une période donnée
 * @param quotes - Liste des devis
 * @param periodType - Type de période ('day', 'week', 'month')
 * @param year - Année
 * @param month - Mois (1-12)
 * @param week - Semaine du mois (1-4)
 * @param day - Date spécifique
 * @returns Devis filtrés selon la période
 */
export const filterQuotesByPeriod = (
  quotes: Quote[],
  periodType: 'day' | 'week' | 'month',
  year: number,
  month?: number,
  week?: number,
  day?: Date
): Quote[] => {
  return quotes.filter(quote => {
    const quoteDate = new Date(quote.createdAt);
    const quoteYear = quoteDate.getFullYear();
    const quoteMonth = quoteDate.getMonth() + 1;
    
    if (quoteYear !== year) return false;
    
    if (periodType === 'month') {
      return month ? quoteMonth === month : true;
    } else if (periodType === 'week' && month && week) {
      if (quoteMonth !== month) return false;
      // Calculer la semaine du mois
      const weekOfMonth = Math.ceil(quoteDate.getDate() / 7);
      return weekOfMonth === week;
    } else if (periodType === 'day' && day) {
      return quoteDate.toDateString() === day.toDateString();
    }
    
    return true;
  });
};

/**
 * Calcule les métriques de performance financière
 * @param quotes - Liste des devis
 * @returns Métriques de performance
 */
export const calculatePerformanceMetrics = (quotes: Quote[]) => {
  const analysis = calculateProfitAnalysis(quotes);
  
  return {
    ...analysis,
    averageQuoteValue: quotes.length > 0 ? analysis.totalRevenue / quotes.length : 0,
    averageCostPerQuote: quotes.length > 0 ? analysis.totalCost / quotes.length : 0,
    averageProfitPerQuote: quotes.length > 0 ? analysis.netProfit / quotes.length : 0,
    returnOnInvestment: analysis.totalCost > 0 ? (analysis.netProfit / analysis.totalCost) * 100 : 0
  };
};