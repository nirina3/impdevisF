import { useState, useEffect } from 'react';
import { CostCalculationData } from './useCostCalculation';

export interface SavedCostCalculation extends CostCalculationData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'cost_calculations_history';

export const useCostHistory = () => {
  const [calculations, setCalculations] = useState<SavedCostCalculation[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les calculs depuis le localStorage au démarrage
  useEffect(() => {
    const loadCalculations = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          const calculationsWithDates = parsed.map((calc: any) => ({
            ...calc,
            calculatedAt: new Date(calc.calculatedAt),
            createdAt: new Date(calc.createdAt),
            updatedAt: new Date(calc.updatedAt)
          }));
          // Trier par date de création décroissante
          calculationsWithDates.sort((a: SavedCostCalculation, b: SavedCostCalculation) => 
            b.createdAt.getTime() - a.createdAt.getTime()
          );
          setCalculations(calculationsWithDates);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique des calculs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCalculations();
  }, []);

  // Sauvegarder dans le localStorage
  const saveToStorage = (calculationsList: SavedCostCalculation[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(calculationsList));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Ajouter un nouveau calcul
  const addCalculation = (calculation: CostCalculationData, name?: string) => {
    const now = new Date();
    const newCalculation: SavedCostCalculation = {
      ...calculation,
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Calcul du ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: now,
      updatedAt: now
    };

    const updatedCalculations = [newCalculation, ...calculations];
    setCalculations(updatedCalculations);
    saveToStorage(updatedCalculations);
    
    return newCalculation;
  };

  // Supprimer un calcul
  const deleteCalculation = (id: string) => {
    const updatedCalculations = calculations.filter(calc => calc.id !== id);
    setCalculations(updatedCalculations);
    saveToStorage(updatedCalculations);
  };

  // Dupliquer un calcul
  const duplicateCalculation = (calculation: SavedCostCalculation) => {
    const now = new Date();
    const duplicatedCalculation: SavedCostCalculation = {
      ...calculation,
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${calculation.name} (Copie)`,
      createdAt: now,
      updatedAt: now,
      calculatedAt: now
    };

    const updatedCalculations = [duplicatedCalculation, ...calculations];
    setCalculations(updatedCalculations);
    saveToStorage(updatedCalculations);
    
    return duplicatedCalculation;
  };

  // Mettre à jour le nom d'un calcul
  const updateCalculationName = (id: string, newName: string) => {
    const updatedCalculations = calculations.map(calc => 
      calc.id === id 
        ? { ...calc, name: newName, updatedAt: new Date() }
        : calc
    );
    setCalculations(updatedCalculations);
    saveToStorage(updatedCalculations);
  };

  // Exporter un calcul
  const exportCalculation = (calculation: SavedCostCalculation) => {
    const exportData = {
      name: calculation.name,
      createdAt: calculation.createdAt.toISOString(),
      totalCost: calculation.totalCost,
      totalSellingPrice: calculation.totalSellingPrice,
      totalMargin: calculation.totalMargin,
      exchangeRates: calculation.exchangeRates,
      items: calculation.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        originCountry: item.originCountry,
        purchasePrice: item.purchasePrice,
        mainCurrency: item.mainCurrency,
        transportFees: item.transportFees,
        miscFees: item.miscFees,
        customsFees: item.customsFees,
        margin: item.margin,
        sellingPrice: item.sellingPrice,
        category: item.category || '',
        hsCode: item.hsCode || ''
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calcul-${calculation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${calculation.createdAt.toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Obtenir les statistiques
  const getStatistics = () => {
    const totalCalculations = calculations.length;
    const totalValue = calculations.reduce((sum, calc) => sum + calc.totalSellingPrice, 0);
    const averageValue = totalCalculations > 0 ? totalValue / totalCalculations : 0;
    const totalItems = calculations.reduce((sum, calc) => sum + calc.items.length, 0);

    return {
      totalCalculations,
      totalValue,
      averageValue,
      totalItems
    };
  };

  // Rechercher dans les calculs
  const searchCalculations = (searchTerm: string) => {
    if (!searchTerm.trim()) return calculations;
    
    const term = searchTerm.toLowerCase();
    return calculations.filter(calc =>
      calc.name.toLowerCase().includes(term) ||
      calc.items.some(item => 
        item.description.toLowerCase().includes(term) ||
        item.originCountry.toLowerCase().includes(term) ||
        (item.category && item.category.toLowerCase().includes(term))
      )
    );
  };

  // Obtenir un calcul par ID
  const getCalculationById = (id: string) => {
    return calculations.find(calc => calc.id === id);
  };

  return {
    calculations,
    loading,
    addCalculation,
    deleteCalculation,
    duplicateCalculation,
    updateCalculationName,
    exportCalculation,
    getStatistics,
    searchCalculations,
    getCalculationById
  };
};