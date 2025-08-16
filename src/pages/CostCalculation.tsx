import React, { useState } from 'react';
import { Calculator, Plus, Trash2, Save, DollarSign, TrendingUp, ArrowRight, FileText, History } from 'lucide-react';
import { formatNumberWithSpaces, parseFormattedNumber } from '../utils/formatters';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { useCostHistory } from '../hooks/useCostHistory';
import { useNavigate } from 'react-router-dom';

interface CostItem {
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
}

interface ExchangeRates {
  USD: number;
  EUR: number;
  CNY: number;
}

const CostCalculation: React.FC = () => {
  const navigate = useNavigate();
  const { saveCalculation, hasCalculation, calculationData } = useCostCalculation();
  const { calculations } = useCostHistory();

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 4500, // 1 USD = 4500 MGA
    EUR: 4900, // 1 EUR = 4900 MGA
    CNY: 620   // 1 CNY = 620 MGA
  });

  const [items, setItems] = useState<CostItem[]>([
    {
      id: 1,
      description: '',
      quantity: 1,
      purchasePrice: 0,
      mainCurrency: 'USD',
      transportFees: 0,
      transportFeesOriginal: 0,
      transportCurrency: 'USD',
      miscFees: 0,
      customsFees: 0,
      margin: 20,
      sellingPrice: 0,
      originCountry: 'Chine'
    }
  ]);

  const convertToMGA = (amount: number, currency: 'USD' | 'EUR' | 'CNY' | 'MGA'): number => {
    if (currency === 'MGA') return amount;
    return amount * exchangeRates[currency];
  };

  const calculateSellingPrice = (item: CostItem): number => {
    // Convertir le prix d'achat en MGA
    const purchasePriceMGA = convertToMGA(item.purchasePrice, item.mainCurrency);
    
    // Convertir les frais de transport en MGA
    const transportFeesMGA = convertToMGA(item.transportFeesOriginal, item.transportCurrency);
    
    // Coût total en MGA
    const totalCostMGA = (purchasePriceMGA * item.quantity) + transportFeesMGA + item.miscFees + item.customsFees;
    
    // Ajouter la marge
    return totalCostMGA + (totalCostMGA * item.margin / 100);
  };

  const handleExchangeRateChange = (currency: keyof ExchangeRates, value: string) => {
    const numValue = parseFormattedNumber(value);
    setExchangeRates(prev => ({ ...prev, [currency]: numValue }));
    
    // Recalculer tous les prix de vente
    setItems(prev => prev.map(item => ({
      ...item,
      transportFees: convertToMGA(item.transportFeesOriginal, item.transportCurrency),
      sellingPrice: calculateSellingPrice({ ...item, transportFees: convertToMGA(item.transportFeesOriginal, item.transportCurrency) })
    })));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Logique spéciale pour les frais de transport selon l'origine
        if (field === 'originCountry') {
          if (value === 'Chine') {
            updatedItem.transportCurrency = 'MGA';
            updatedItem.transportFeesOriginal = updatedItem.transportFees;
          } else {
            updatedItem.transportCurrency = 'USD';
            updatedItem.transportFeesOriginal = updatedItem.transportFees / exchangeRates.USD;
          }
        }
        
        // Mise à jour des frais de transport en MGA
        if (field === 'transportFeesOriginal' || field === 'transportCurrency') {
          updatedItem.transportFees = convertToMGA(
            field === 'transportFeesOriginal' ? value : updatedItem.transportFeesOriginal,
            field === 'transportCurrency' ? value : updatedItem.transportCurrency
          );
        }
        
        // Recalculer le prix de vente
        updatedItem.sellingPrice = calculateSellingPrice(updatedItem);
        
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now(),
      description: '',
      quantity: 1,
      purchasePrice: 0,
      mainCurrency: 'USD',
      transportFees: 0,
      transportFeesOriginal: 0,
      transportCurrency: 'USD',
      miscFees: 0,
      customsFees: 0,
      margin: 20,
      sellingPrice: 0,
      originCountry: 'Chine'
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getTotalCostMGA = (item: CostItem) => {
    const purchasePriceMGA = convertToMGA(item.purchasePrice, item.mainCurrency);
    return (purchasePriceMGA * item.quantity) + item.transportFees + item.miscFees + item.customsFees;
  };

  const getMarginAmount = (item: CostItem) => {
    const totalCost = getTotalCostMGA(item);
    return totalCost * item.margin / 100;
  };

  const countries = [
    'Chine', 'États-Unis', 'Allemagne', 'France', 'Italie', 'Japon', 
    'Corée du Sud', 'Royaume-Uni', 'Espagne', 'Pays-Bas', 'Belgique', 'Autre'
  ];

  const handleSaveAndCreateQuote = () => {
    // Sauvegarder les données de calcul
    const totalCost = items.reduce((sum, item) => sum + getTotalCostMGA(item), 0);
    const totalMargin = items.reduce((sum, item) => sum + getMarginAmount(item), 0);
    const totalSellingPrice = items.reduce((sum, item) => sum + item.sellingPrice, 0);

    saveCalculation({
      items: items.map(item => ({
        ...item,
        weight: item.weight || 0,
        dimensions: item.dimensions || { length: 0, width: 0, height: 0 },
        hsCode: item.hsCode || '',
        category: item.category || '',
        productLink: item.productLink || ''
      })),
      exchangeRates,
      totalCost,
      totalMargin,
      totalSellingPrice
    });

    // Naviguer vers la création de devis
    navigate('/quotes/new?from=cost-calculation');
  };

  const handleSaveCalculation = () => {
    const totalCost = items.reduce((sum, item) => sum + getTotalCostMGA(item), 0);
    const totalMargin = items.reduce((sum, item) => sum + getMarginAmount(item), 0);
    const totalSellingPrice = items.reduce((sum, item) => sum + item.sellingPrice, 0);

    saveCalculation({
      items: items.map(item => ({
        ...item,
        weight: item.weight || 0,
        dimensions: item.dimensions || { length: 0, width: 0, height: 0 },
        hsCode: item.hsCode || '',
        category: item.category || '',
        productLink: item.productLink || ''
      })),
      exchangeRates,
      totalCost,
      totalMargin,
      totalSellingPrice
    });

    // Afficher une notification de succès (vous pouvez ajouter un toast ici)
    alert('Calcul sauvegardé avec succès !');
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
        <div className="flex space-x-3">
          <button
            onClick={addItem}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un article</span>
          </button>
          <button
            onClick={handleSaveCalculation}
            className="btn-secondary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Sauvegarder</span>
          </button>
          <button
            onClick={handleSaveAndCreateQuote}
            className="btn-primary flex items-center space-x-2"
            disabled={items.length === 0 || items.some(item => !item.description.trim())}
          >
            <FileText className="w-4 h-4" />
            <span>Créer un devis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification si des données sont déjà sauvegardées */}
      {(hasCalculation() && calculationData) || calculations.length > 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">
                {hasCalculation() && calculationData ? 'Calcul précédent disponible' : 'Historique des calculs'}
              </h3>
              {hasCalculation() && calculationData ? (
                <p className="text-sm text-blue-700">
                  Dernière sauvegarde : {calculationData.calculatedAt.toLocaleString('fr-FR')} 
                  • {calculationData.items.length} article(s) 
                  • Total : {formatNumberWithSpaces(Math.round(calculationData.totalSellingPrice))} Ar
                </p>
              ) : (
                <p className="text-sm text-blue-700">
                  {calculations.length} calcul{calculations.length > 1 ? 's' : ''} sauvegardé{calculations.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/cost-history')}
                className="btn-secondary text-sm flex items-center space-x-2"
              >
                <History className="w-4 h-4" />
                <span>Voir l'historique</span>
              </button>
              {hasCalculation() && calculationData && (
                <button
                  onClick={() => navigate('/quotes/new?from=cost-calculation')}
                  className="btn-primary text-sm flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Utiliser pour un devis</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Section des taux de change */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Cours du Jour</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              USD → MGA
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={formatNumberWithSpaces(exchangeRates.USD)}
                onChange={(e) => handleExchangeRateChange('USD', e.target.value)}
                className="pl-10 input-field"
                placeholder="4 500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              EUR → MGA
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">€</span>
              <input
                type="text"
                value={formatNumberWithSpaces(exchangeRates.EUR)}
                onChange={(e) => handleExchangeRateChange('EUR', e.target.value)}
                className="pl-10 input-field"
                placeholder="4 900"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNY → MGA
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">¥</span>
              <input
                type="text"
                value={formatNumberWithSpaces(exchangeRates.CNY)}
                onChange={(e) => handleExchangeRateChange('CNY', e.target.value)}
                className="pl-10 input-field"
                placeholder="620"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Article {index + 1}</h2>
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Supprimer cet article"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Section de saisie */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium mr-2">📝</span>
                    Informations de base
                  </h3>
                  
                  <div className="space-y-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays d'origine
                      </label>
                      <select
                        value={item.originCountry}
                        onChange={(e) => handleItemChange(index, 'originCountry', e.target.value)}
                        className="input-field"
                      >
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium mr-2">💰</span>
                    Prix et quantité
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantité
                      </label>
                      <input
                        type="text"
                        value={formatNumberWithSpaces(item.quantity)}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFormattedNumber(e.target.value))}
                        className="input-field"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Devise principale articles
                      </label>
                      <select
                        value={item.mainCurrency}
                        onChange={(e) => handleItemChange(index, 'mainCurrency', e.target.value)}
                        className="input-field"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="CNY">CNY (¥)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix d'achat unitaire ({item.mainCurrency})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                          {item.mainCurrency === 'USD' ? '$' : item.mainCurrency === 'EUR' ? '€' : '¥'}
                        </span>
                        <input
                          type="text"
                          value={formatNumberWithSpaces(item.purchasePrice)}
                          onChange={(e) => handleItemChange(index, 'purchasePrice', parseFormattedNumber(e.target.value))}
                          className="pl-10 input-field"
                          placeholder="0"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Équivalent: {formatNumberWithSpaces(Math.round(convertToMGA(item.purchasePrice, item.mainCurrency)))} Ar
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium mr-2">🚚</span>
                    Frais de transport
                  </h3>
                  
                  {item.originCountry === 'Chine' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frais de transport (MGA)
                      </label>
                      <input
                        type="text"
                        value={formatNumberWithSpaces(item.transportFeesOriginal)}
                        onChange={(e) => {
                          const value = parseFormattedNumber(e.target.value);
                          handleItemChange(index, 'transportFeesOriginal', value);
                          handleItemChange(index, 'transportFees', value);
                          handleItemChange(index, 'transportCurrency', 'MGA');
                        }}
                        className="input-field"
                        placeholder="0"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Devise transport
                        </label>
                        <select
                          value={item.transportCurrency}
                          onChange={(e) => handleItemChange(index, 'transportCurrency', e.target.value)}
                          className="input-field"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="CNY">CNY (¥)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frais de transport ({item.transportCurrency})
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            {item.transportCurrency === 'USD' ? '$' : item.transportCurrency === 'EUR' ? '€' : '¥'}
                          </span>
                          <input
                            type="text"
                            value={formatNumberWithSpaces(item.transportFeesOriginal)}
                            onChange={(e) => handleItemChange(index, 'transportFeesOriginal', parseFormattedNumber(e.target.value))}
                            className="pl-10 input-field"
                            placeholder="0"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Équivalent: {formatNumberWithSpaces(Math.round(item.transportFees))} Ar
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium mr-2">📋</span>
                    Autres frais et marge
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frais divers (Ar)
                      </label>
                      <input
                        type="text"
                        value={formatNumberWithSpaces(item.miscFees)}
                        onChange={(e) => handleItemChange(index, 'miscFees', parseFormattedNumber(e.target.value))}
                        className="input-field"
                        placeholder="0"
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
                        placeholder="0"
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
                        placeholder="20"
                      />
                    </div>
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
                    <span className="text-sm text-gray-600">Prix d'achat total :</span>
                    <span className="font-medium text-gray-900">
                      {formatNumberWithSpaces(Math.round(convertToMGA(item.purchasePrice, item.mainCurrency) * item.quantity))} Ar
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Frais de transport :</span>
                    <span className="font-medium text-gray-900">
                      {formatNumberWithSpaces(Math.round(item.transportFees))} Ar
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Autres frais :</span>
                    <span className="font-medium text-gray-900">
                      {formatNumberWithSpaces(item.miscFees + item.customsFees)} Ar
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-t border-blue-200 pt-3">
                    <span className="text-sm text-gray-600">Coût total :</span>
                    <span className="font-medium text-gray-900">
                      {formatNumberWithSpaces(Math.round(getTotalCostMGA(item)))} Ar
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Marge ({formatNumberWithSpaces(item.margin)}%) :</span>
                    <span className="font-medium text-blue-600">
                      +{formatNumberWithSpaces(Math.round(getMarginAmount(item)))} Ar
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
                  <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-500 mb-3 font-medium">Détail du calcul :</p>
                    <div className="font-mono text-xs text-gray-700 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Prix unitaire ({item.mainCurrency}):</span>
                        <span>{formatNumberWithSpaces(item.purchasePrice)} {item.mainCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>× Quantité:</span>
                        <span>{formatNumberWithSpaces(item.quantity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>= Sous-total ({item.mainCurrency}):</span>
                        <span>{formatNumberWithSpaces(item.purchasePrice * item.quantity)} {item.mainCurrency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Conversion (taux {formatNumberWithSpaces(exchangeRates[item.mainCurrency])}):</span>
                        <span>{formatNumberWithSpaces(Math.round(convertToMGA(item.purchasePrice * item.quantity, item.mainCurrency)))} Ar</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Transport:</span>
                        <span>{formatNumberWithSpaces(Math.round(item.transportFees))} Ar</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Frais divers:</span>
                        <span>{formatNumberWithSpaces(item.miscFees)} Ar</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Frais douane:</span>
                        <span>{formatNumberWithSpaces(item.customsFees)} Ar</span>
                      </div>
                      <div className="border-t border-gray-200 pt-1.5 flex justify-between font-medium">
                        <span>= Coût total:</span>
                        <span>{formatNumberWithSpaces(Math.round(getTotalCostMGA(item)))} Ar</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Marge ({formatNumberWithSpaces(item.margin)}%):</span>
                        <span>{formatNumberWithSpaces(Math.round(getMarginAmount(item)))} Ar</span>
                      </div>
                      <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold text-green-600">
                        <span>= Prix de vente:</span>
                        <span>{formatNumberWithSpaces(Math.round(item.sellingPrice))} Ar</span>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">📊</span>
            Résumé Global
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Articles</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumberWithSpaces(items.length)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-100 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Coût total</p>
              <p className="text-2xl font-bold text-red-600">
                {formatNumberWithSpaces(Math.round(items.reduce((sum, item) => sum + getTotalCostMGA(item), 0)))} Ar
              </p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Marge totale</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumberWithSpaces(Math.round(items.reduce((sum, item) => sum + getMarginAmount(item), 0)))} Ar
              </p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Prix de vente total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatNumberWithSpaces(Math.round(items.reduce((sum, item) => sum + item.sellingPrice, 0)))} Ar
              </p>
            </div>
          </div>

          {/* Détail par devise */}
          <div className="mt-6 p-4 bg-gradient-to-r from-neutral-50 to-gray-50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Répartition par devise :</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {(['USD', 'EUR', 'CNY'] as const).map(currency => {
                const currencyItems = items.filter(item => item.mainCurrency === currency);
                const totalInCurrency = currencyItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
                const totalInMGA = convertToMGA(totalInCurrency, currency);
                
                if (totalInCurrency === 0) return null;
                
                return (
                  <div key={currency} className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">{currency}</p>
                    <p className="font-semibold text-gray-900">
                      {formatNumberWithSpaces(totalInCurrency)} {currency}
                    </p>
                    <p className="text-xs text-gray-500">
                      ≈ {formatNumberWithSpaces(Math.round(totalInMGA))} Ar
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCalculation;