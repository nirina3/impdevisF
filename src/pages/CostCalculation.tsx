import React, { useState } from 'react';
import { Calculator, Plus, Trash2, Save } from 'lucide-react';
import { formatNumberWithSpaces, parseFormattedNumber } from '../utils/formatters';

const CostCalculation: React.FC = () => {
  const [items, setItems] = useState([
    {
      id: 1,
      description: '',
      purchasePrice: 0,
      miscFees: 0,
      customsFees: 0,
      margin: 20, // Marge en pourcentage
      sellingPrice: 0
    }
  ]);

  const calculateSellingPrice = (purchasePrice: number, miscFees: number, customsFees: number, margin: number) => {
    const totalCost = purchasePrice + miscFees + customsFees;
    return totalCost + (totalCost * margin / 100);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculer le prix de vente
        if (['purchasePrice', 'miscFees', 'customsFees', 'margin'].includes(field)) {
          const purchasePrice = field === 'purchasePrice' ? value : updatedItem.purchasePrice;
          const miscFees = field === 'miscFees' ? value : updatedItem.miscFees;
          const customsFees = field === 'customsFees' ? value : updatedItem.customsFees;
          const margin = field === 'margin' ? value : updatedItem.margin;
          
          updatedItem.sellingPrice = calculateSellingPrice(purchasePrice, miscFees, customsFees, margin);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      description: '',
      purchasePrice: 0,
      miscFees: 0,
      customsFees: 0,
      margin: 20,
      sellingPrice: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getTotalCost = (item: any) => {
    return item.purchasePrice + item.miscFees + item.customsFees;
  };

  const getMarginAmount = (item: any) => {
    const totalCost = getTotalCost(item);
    return totalCost * item.margin / 100;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calculator className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Calcul des Coûts</h1>
        </div>
        <button
          onClick={addItem}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un article</span>
        </button>
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Article {index + 1}</h2>
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="Supprimer cet article"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Section de saisie */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                  📝 Informations de base
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description de l'article
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="input-field"
                    placeholder="Description de l'article..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix d'achat (Ar)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(item.purchasePrice)}
                      onChange={(e) => handleItemChange(index, 'purchasePrice', parseFormattedNumber(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frais divers (Ar)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(item.miscFees)}
                      onChange={(e) => handleItemChange(index, 'miscFees', parseFormattedNumber(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frais de douane (Ar)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(item.customsFees)}
                      onChange={(e) => handleItemChange(index, 'customsFees', parseFormattedNumber(e.target.value))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marge (%)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(item.margin)}
                      onChange={(e) => handleItemChange(index, 'margin', parseFormattedNumber(e.target.value))}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Section de résultats */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-blue-200 flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium mr-2">💰</span>
                  Résultats du calcul
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Coût total :</span>
                    <span className="font-medium text-gray-900">
                      {formatNumberWithSpaces(getTotalCost(item))} Ar
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Marge ({item.margin}%) :</span>
                    <span className="font-medium text-blue-600">
                      +{formatNumberWithSpaces(getMarginAmount(item))} Ar
                    </span>
                  </div>

                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Prix de vente :</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatNumberWithSpaces(Math.round(item.sellingPrice))} Ar
                      </span>
                    </div>
                  </div>

                  {/* Détail du calcul */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-500 mb-2">Détail du calcul :</p>
                    <div className="font-mono text-xs text-gray-700 space-y-1">
                      <div>Prix d'achat: {formatNumberWithSpaces(item.purchasePrice)} Ar</div>
                      <div>+ Frais divers: {formatNumberWithSpaces(item.miscFees)} Ar</div>
                      <div>+ Frais douane: {formatNumberWithSpaces(item.customsFees)} Ar</div>
                      <div className="border-t border-gray-200 pt-1">
                        = Coût total: {formatNumberWithSpaces(getTotalCost(item))} Ar
                      </div>
                      <div>+ Marge ({formatNumberWithSpaces(item.margin)}%): {formatNumberWithSpaces(getMarginAmount(item))} Ar</div>
                      <div className="border-t border-gray-200 pt-1 font-bold text-green-600">
                        = Prix de vente: {formatNumberWithSpaces(Math.round(item.sellingPrice))} Ar
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé global */}
      {items.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé Global</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Coût total</p>
              <p className="text-xl font-bold text-gray-900">
                {formatNumberWithSpaces(items.reduce((sum, item) => sum + getTotalCost(item), 0))} Ar
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Marge totale</p>
              <p className="text-xl font-bold text-blue-600">
                {formatNumberWithSpaces(items.reduce((sum, item) => sum + getMarginAmount(item), 0))} Ar
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Prix de vente total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumberWithSpaces(Math.round(items.reduce((sum, item) => sum + item.sellingPrice, 0)))} Ar
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCalculation;