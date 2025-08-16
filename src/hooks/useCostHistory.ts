import { useState, useEffect } from 'react';
import { CostCalculationData } from './useCostCalculation';
import { costCalculationsService } from '../services/firestore';

export interface SavedCostCalculation extends CostCalculationData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useCostHistory = () => {
  const [calculations, setCalculations] = useState<SavedCostCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les calculs depuis Firebase au démarrage
  useEffect(() => {
    const loadCalculations = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useCostHistory - Starting to load calculations from Firebase...');
        const calculationsData = await costCalculationsService.getAll();
        console.log('useCostHistory - Loaded calculations:', calculationsData.length);
        setCalculations(calculationsData);
      } catch (err) {
        console.error('useCostHistory - Error loading calculations:', err);
        setError('Erreur lors du chargement de l\'historique des calculs');
        setCalculations([]);
      } finally {
        setLoading(false);
      }
    };

    loadCalculations();
  }, []);

  // Ajouter un nouveau calcul
  const addCalculation = async (calculation: CostCalculationData, name?: string) => {
    try {
      const now = new Date();
      const calculationName = name || `Calcul du ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      
      console.log('useCostHistory - Adding new calculation...');
      const newCalculation = await costCalculationsService.add(calculation, calculationName);
      setCalculations(prev => [newCalculation, ...prev]);
      
      return newCalculation;
    } catch (err) {
      console.error('useCostHistory - Error adding calculation:', err);
      setError('Erreur lors de la sauvegarde du calcul');
      throw err;
    }
  };

  // Supprimer un calcul
  const deleteCalculation = async (id: string) => {
    try {
      console.log('useCostHistory - Deleting calculation:', id);
      await costCalculationsService.delete(id);
      setCalculations(prev => prev.filter(calc => calc.id !== id));
    } catch (err) {
      console.error('useCostHistory - Error deleting calculation:', err);
      setError('Erreur lors de la suppression du calcul');
      throw err;
    }
  };

  // Dupliquer un calcul
  const duplicateCalculation = async (calculation: SavedCostCalculation) => {
    try {
      const now = new Date();
      const duplicatedData = {
        ...calculation,
        calculatedAt: now
      };
      
      const duplicatedCalculation = await costCalculationsService.add(
        duplicatedData, 
        `${calculation.name} (Copie)`
      );

      setCalculations(prev => [duplicatedCalculation, ...prev]);
      return duplicatedCalculation;
    } catch (err) {
      console.error('useCostHistory - Error duplicating calculation:', err);
      setError('Erreur lors de la duplication du calcul');
      throw err;
    }
  };

  // Mettre à jour le nom d'un calcul
  const updateCalculationName = async (id: string, newName: string) => {
    try {
      console.log('useCostHistory - Updating calculation name:', id);
      await costCalculationsService.update(id, { name: newName });
      setCalculations(prev => prev.map(calc => 
        calc.id === id 
          ? { ...calc, name: newName, updatedAt: new Date() }
          : calc
      ));
    } catch (err) {
      console.error('useCostHistory - Error updating calculation name:', err);
      setError('Erreur lors de la mise à jour du nom');
      throw err;
    }
  };

  // Rafraîchir les calculs
  const refreshCalculations = async () => {
    try {
      setLoading(false);
      setError(null);
      const calculationsData = await costCalculationsService.getAll();
      setCalculations(calculationsData);
    } catch (err) {
      console.error('useCostHistory - Error refreshing calculations:', err);
      setError('Erreur lors du rafraîchissement des calculs');
    } finally {
      setLoading(false);
    }
  };

  // Exporter un calcul (reste inchangé car c'est un export local)
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

  console.log('useCostHistory - Current state:', { calculationsCount: calculations.length, loading });
  return {
    calculations,
    loading,
    error,
    addCalculation,
    deleteCalculation,
    duplicateCalculation,
    updateCalculationName,
    exportCalculation,
    getStatistics,
    searchCalculations,
    getCalculationById,
    refreshCalculations
  };
};