import { useState, useEffect } from 'react';

export interface CostItem {
  id: number;
  description: string;
  quantity: number;
  purchasePrice: number;
  mainCurrency: 'USD' | 'EUR' | 'CNY';
  transportFees: number;
  transportFeesOriginal: number;
  transportCurrency: 'USD' | 'EUR' | 'CNY' | 'MGA';
  miscFees: number;
  customsFees: number;
  margin: number;
  sellingPrice: number;
  originCountry: string;
  weight?: number;
  dimensions?: { length: number; width: number; height: number };
  hsCode?: string;
  category?: string;
  productLink?: string;
}

export interface ExchangeRates {
  USD: number;
  EUR: number;
  CNY: number;
}

export interface CostCalculationData {
  items: CostItem[];
  exchangeRates: ExchangeRates;
  totalCost: number;
  totalMargin: number;
  totalSellingPrice: number;
  calculatedAt: Date;
}

const STORAGE_KEY = 'cost_calculation_data';

export const useCostCalculation = () => {
  const [calculationData, setCalculationData] = useState<CostCalculationData | null>(null);

  // Charger les données depuis le localStorage au démarrage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Reconvertir la date
        parsed.calculatedAt = new Date(parsed.calculatedAt);
        setCalculationData(parsed);
      } catch (error) {
        console.error('Erreur lors du chargement des données de calcul:', error);
      }
    }
  }, []);

  const saveCalculation = (data: Omit<CostCalculationData, 'calculatedAt'>) => {
    const calculationWithDate: CostCalculationData = {
      ...data,
      calculatedAt: new Date()
    };
    
    setCalculationData(calculationWithDate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calculationWithDate));
    
    // Également sauvegarder dans l'historique
    const historyData = localStorage.getItem('cost_calculations_history');
    let history: any[] = [];
    
    if (historyData) {
      try {
        history = JSON.parse(historyData);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
      }
    }
    
    const now = new Date();
    const historyEntry = {
      ...calculationWithDate,
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `Calcul du ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: now,
      updatedAt: now
    };
    
    // Ajouter au début de l'historique
    history.unshift(historyEntry);
    
    // Limiter l'historique à 50 entrées pour éviter un localStorage trop volumineux
    if (history.length > 50) {
      history = history.slice(0, 50);
    }
    
    localStorage.setItem('cost_calculations_history', JSON.stringify(history));
  };

  const clearCalculation = () => {
    setCalculationData(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const hasCalculation = () => {
    return calculationData !== null;
  };

  const getCalculationAge = () => {
    if (!calculationData) return null;
    return Date.now() - calculationData.calculatedAt.getTime();
  };

  const isCalculationRecent = (maxAgeMinutes: number = 30) => {
    const age = getCalculationAge();
    if (!age) return false;
    return age < (maxAgeMinutes * 60 * 1000);
  };

  return {
    calculationData,
    saveCalculation,
    clearCalculation,
    hasCalculation,
    getCalculationAge,
    isCalculationRecent
  };
};