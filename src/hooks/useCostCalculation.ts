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