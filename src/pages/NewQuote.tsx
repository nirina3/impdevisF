import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuotes } from '../hooks/useQuotes';
import { useClients } from '../hooks/useClients';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { Plus, Trash2, Save, ArrowLeft, Calculator, DollarSign } from 'lucide-react';
import { Quote, QuoteItem } from '../types';
import { formatNumberWithSpaces, parseFormattedNumber } from '../utils/formatters';

const NewQuote: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addQuote } = useQuotes();
  const { clients } = useClients();
  const { calculationData, hasCalculation } = useCostCalculation();
  
  // Vérifier si on vient du calcul des coûts
  const fromCostCalculation = searchParams.get('from') === 'cost-calculation';

  // Taux de change (identiques à ceux du calcul des coûts)
  const [exchangeRates] = useState({
    USD: 4500,
    EUR: 4900,
    CNY: 620
  });

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    originCountry: 'Chine',
    destinationPort: 'Toamasina',
    shippingMethod: 'sea' as Quote['shippingMethod'],
    currency: 'MGA' as Quote['currency'],
    validUntil: '',
    estimatedDelivery: '',
    notes: ''
  });

  const [downPaymentData, setDownPaymentData] = useState({
    percentage: 0,
    amount: 0,
    paymentMethod: '',
    notes: ''
  });

  const [items, setItems] = useState<Omit<QuoteItem, 'id'>[]>([
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      purchasePrice: 0,
      miscFees: 0,
      customsFees: 0,
      sellingPrice: 0,
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      hsCode: '',
      category: '',
      productLink: '',
      mainCurrency: 'CNY',
      exchangeRates: exchangeRates,
      transportFees: 0,
      transportFeesOriginal: 0,
      transportCurrency: 'MGA',
      margin: 20
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données du calcul des coûts si disponible
  useEffect(() => {
    if (fromCostCalculation && hasCalculation() && calculationData) {
      console.log('Chargement des données du calcul des coûts...');
      
      // Convertir les données du calcul vers le format des items de devis
      const calculatedItems = calculationData.items.map((calcItem, index) => ({
        description: calcItem.description,
        quantity: calcItem.quantity,
        unitPrice: calcItem.sellingPrice / calcItem.quantity, // Prix unitaire de vente
        purchasePrice: calcItem.purchasePrice,
        miscFees: calcItem.miscFees,
        customsFees: calcItem.customsFees,
        sellingPrice: calcItem.sellingPrice,
        weight: calcItem.weight || 0,
        dimensions: calcItem.dimensions || { length: 0, width: 0, height: 0 },
        hsCode: calcItem.hsCode || '',
        category: calcItem.category || '',
        productLink: calcItem.productLink || '',
        mainCurrency: calcItem.mainCurrency,
        exchangeRates: calculationData.exchangeRates,
        transportFees: calcItem.transportFees,
        transportFeesOriginal: calcItem.transportFeesOriginal,
        transportCurrency: calcItem.transportCurrency,
        margin: calcItem.margin || 20
      }));

      setItems(calculatedItems);
      
      // Pré-remplir le pays d'origine basé sur les articles
      const countries = [...new Set(calculationData.items.map(item => item.originCountry))];
      if (countries.length === 1) {
        setFormData(prev => ({ ...prev, originCountry: countries[0] }));
      }
    }
  }, [fromCostCalculation, hasCalculation, calculationData]);

  // Fonction de conversion de devise vers MGA (identique au calcul des coûts)
  const convertToMGA = (amount: number, currency: 'USD' | 'EUR' | 'CNY' | 'MGA'): number => {
    if (currency === 'MGA') return amount;
    return amount * exchangeRates[currency];
  };

  // Fonction de calcul du prix de vente (identique au calcul des coûts)
  const calculateSellingPrice = (item: Omit<QuoteItem, 'id'>): number => {
    // Si on vient du calcul des coûts, préserver le prix de vente calculé
    if (fromCostCalculation && hasCalculation() && calculationData) {
      const originalItem = calculationData.items.find(calcItem => calcItem.description === item.description);
      if (originalItem) {
        return originalItem.sellingPrice;
      }
    }
    
    // Convertir le prix d'achat en MGA
    const purchasePriceMGA = convertToMGA(item.purchasePrice, item.mainCurrency as 'USD' | 'EUR' | 'CNY');
    
    // Convertir les frais de transport en MGA
    const transportFeesMGA = convertToMGA(item.transportFeesOriginal || 0, item.transportCurrency as 'USD' | 'EUR' | 'CNY' | 'MGA');
    
    // Coût total en MGA
    const totalCostMGA = (purchasePriceMGA * item.quantity) + transportFeesMGA + (item.miscFees || 0) + (item.customsFees || 0);
    
    // Ajouter la marge
    const margin = item.margin || 20;
    return totalCostMGA + (totalCostMGA * margin / 100);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDownPaymentChange = (field: string, value: string | number) => {
    const totalAmount = calculateTotal();
    
    if (field === 'percentage') {
      const percentage = typeof value === 'string' ? parseFloat(value) || 0 : value;
      const amount = Math.round((totalAmount * percentage) / 100);
      setDownPaymentData(prev => ({ ...prev, percentage, amount }));
    } else if (field === 'amount') {
      const amount = typeof value === 'string' ? parseFloat(value) || 0 : value;
      const percentage = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
      setDownPaymentData(prev => ({ ...prev, amount, percentage }));
    } else {
      setDownPaymentData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        // Si on vient du calcul des coûts et qu'on modifie la marge, recalculer uniquement le prix de vente
        if (fromCostCalculation && field === 'margin') {
          const purchasePriceMGA = convertToMGA(updatedItem.purchasePrice, updatedItem.mainCurrency as 'USD' | 'EUR' | 'CNY');
          const transportFeesMGA = convertToMGA(updatedItem.transportFeesOriginal || 0, updatedItem.transportCurrency as 'USD' | 'EUR' | 'CNY' | 'MGA');
          const totalCostMGA = (purchasePriceMGA * updatedItem.quantity) + transportFeesMGA + (updatedItem.miscFees || 0) + (updatedItem.customsFees || 0);
          updatedItem.sellingPrice = totalCostMGA + (totalCostMGA * value / 100);
          updatedItem.unitPrice = updatedItem.sellingPrice / updatedItem.quantity;
          return updatedItem;
        }
        
        // Si on vient du calcul des coûts, ne pas recalculer automatiquement sauf si c'est un champ qui affecte le coût
        const fieldsAffectingCost = ['purchasePrice', 'quantity', 'transportFeesOriginal', 'transportCurrency', 'miscFees', 'customsFees', 'originCountry'];
        if (fromCostCalculation && !fieldsAffectingCost.includes(field)) {
          return updatedItem;
        }
        
        // Logique spéciale pour les frais de transport selon l'origine
        if (field === 'originCountry') {
          if (value === 'Chine') {
            updatedItem.transportCurrency = 'MGA';
            updatedItem.transportFeesOriginal = 0; // Remise à zéro pour éviter les conversions incorrectes
          } else {
            updatedItem.transportCurrency = 'USD';
            updatedItem.transportFeesOriginal = 0; // Remise à zéro pour éviter les conversions incorrectes
          }
        }
        
        // Synchronisation des devises pour EUR, USD et MGA (pas CNY)
        if (field === 'mainCurrency' && ['EUR', 'USD', 'MGA'].includes(value)) {
          updatedItem.transportCurrency = value;
          updatedItem.transportFeesOriginal = 0; // Remise à zéro pour éviter les conversions incorrectes
        }
        
        // Mise à jour des frais de transport en MGA
        if (field === 'transportFeesOriginal' || field === 'transportCurrency') {
          updatedItem.transportFees = convertToMGA(
            field === 'transportFeesOriginal' ? value : updatedItem.transportFeesOriginal || 0,
            field === 'transportCurrency' ? value : updatedItem.transportCurrency as 'USD' | 'EUR' | 'CNY' | 'MGA'
          );
        }
        
        // Recalculer le prix de vente avec la formule exacte du calcul des coûts
        const newSellingPrice = calculateSellingPrice(updatedItem);
        updatedItem.sellingPrice = newSellingPrice;
        updatedItem.unitPrice = newSellingPrice / updatedItem.quantity;
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleDimensionChange = (index: number, dimension: string, value: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, dimensions: { ...item.dimensions, [dimension]: value } }
        : item
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      purchasePrice: 0,
      miscFees: 0,
      customsFees: 0,
      sellingPrice: 0,
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      hsCode: '',
      category: '',
      productLink: '',
      mainCurrency: 'CNY',
      exchangeRates: exchangeRates,
      transportFees: 0,
      transportFeesOriginal: 0,
      transportCurrency: 'MGA',
      margin: 20
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.sellingPrice, 0);
  };

  const generateQuoteNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    return `QT${year}${month}${day}${time}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) newErrors.clientName = 'Le nom du client est requis';
    if (!formData.clientEmail.trim()) newErrors.clientEmail = 'L\'email du client est requis';
    if (!formData.clientPhone.trim()) newErrors.clientPhone = 'Le téléphone du client est requis';
    if (!formData.clientAddress.trim()) newErrors.clientAddress = 'L\'adresse du client est requise';
    if (!formData.originCountry.trim()) newErrors.originCountry = 'Le pays d\'origine est requis';
    if (!formData.validUntil) newErrors.validUntil = 'La date de validité est requise';
    if (!formData.estimatedDelivery) newErrors.estimatedDelivery = 'La date de livraison estimée est requise';

    items.forEach((item, index) => {
      if (!item.description.trim()) newErrors[`item_${index}_description`] = 'La description est requise';
      if (item.quantity <= 0) newErrors[`item_${index}_quantity`] = 'La quantité doit être positive';
    });

    if (downPaymentData.percentage > 100) newErrors.downPaymentPercentage = 'Le pourcentage ne peut pas dépasser 100%';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const totalAmount = calculateTotal();
    const remainingAmount = totalAmount - downPaymentData.amount;
    
    let paymentStatus: Quote['paymentStatus'] = 'unpaid';
    if (downPaymentData.amount === totalAmount) paymentStatus = 'paid';
    else if (downPaymentData.amount > 0) paymentStatus = 'partial';

    const baseQuote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
      quoteNumber: generateQuoteNumber(),
      ...formData,
      status: 'draft',
      validUntil: new Date(formData.validUntil),
      estimatedDelivery: new Date(formData.estimatedDelivery),
      totalAmount,
      paymentStatus,
      remainingAmount,
      items: items.map((item, index) => ({
        ...item,
        id: `item_${index}_${Date.now()}`
      }))
    };

    // Only include downPayment if there's an actual down payment amount
    const newQuote = downPaymentData.amount > 0 ? {
      ...baseQuote,
      downPayment: {
        id: `dp_${Date.now()}`,
        amount: downPaymentData.amount,
        percentage: downPaymentData.percentage,
        paymentMethod: downPaymentData.paymentMethod,
        notes: downPaymentData.notes,
        paidDate: null
      }
    } : baseQuote;

    addQuote(newQuote);
    navigate('/quotes');
  };

  const countries = [
    'Chine', 'France', 'USA'
  ];


  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-0 xl-container mobile-scroll-fix touch-page-container page-content-mobile">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/quotes')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Nouveau Devis</h1>
        </div>
        {fromCostCalculation && hasCalculation() && (
          <div className="hidden sm:flex items-center space-x-2 text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 sm:px-3 py-2 rounded-lg">
            <Calculator className="w-4 h-4" />
            <span className="hidden md:inline">Données importées du calcul des coûts</span>
            <span className="md:hidden">Données importées</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mobile-form-container touch-form">
        {/* Informations Client */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Informations Client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-form-stack tablet-form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du client *
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                className={`input-field touch-input ${errors.clientName ? 'border-red-500' : ''}`}
                placeholder="Nom complet du client"
              />
              {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                className={`input-field touch-input ${errors.clientEmail ? 'border-red-500' : ''}`}
                placeholder="email@exemple.com"
              />
              {errors.clientEmail && <p className="text-red-500 text-xs mt-1">{errors.clientEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                className={`input-field touch-input ${errors.clientPhone ? 'border-red-500' : ''}`}
                placeholder="+261 34 12 345 67"
              />
              {errors.clientPhone && <p className="text-red-500 text-xs mt-1">{errors.clientPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse *
              </label>
              <input
                type="text"
                value={formData.clientAddress}
                onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                className={`input-field touch-input ${errors.clientAddress ? 'border-red-500' : ''}`}
                placeholder="Adresse complète"
              />
              {errors.clientAddress && <p className="text-red-500 text-xs mt-1">{errors.clientAddress}</p>}
            </div>
          </div>
        </div>

        {/* Informations Expédition */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Informations Expédition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-form-stack tablet-form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays d'origine *
              </label>
              <select
                value={formData.originCountry}
                onChange={(e) => handleInputChange('originCountry', e.target.value)}
                className={`input-field touch-input ${errors.originCountry ? 'border-red-500' : ''}`}
              >
                <option value="Chine">Chine</option>
                <option value="France">France</option>
                <option value="USA">USA</option>
              </select>
              {errors.originCountry && <p className="text-red-500 text-xs mt-1">{errors.originCountry}</p>}
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode d'expédition
              </label>
              <select
                value={formData.shippingMethod}
                onChange={(e) => handleInputChange('shippingMethod', e.target.value)}
                className="input-field touch-input"
              >
                <option value="sea">Maritime</option>
                <option value="air">Aérien</option>
                <option value="land">Terrestre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Articles</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary flex items-center space-x-2 text-sm touch-target"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter un article</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4 mobile-card-stack">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm sm:text-base font-medium text-gray-900">Article {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 touch-target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mobile-form-stack tablet-form-grid">
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className={`input-field touch-input ${errors[`item_${index}_description`] ? 'border-red-500' : ''}`}
                      placeholder="Description de l'article"
                    />
                    {errors[`item_${index}_description`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantité *
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(item.quantity)}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFormattedNumber(e.target.value))}
                      className={`input-field touch-input ${errors[`item_${index}_quantity`] ? 'border-red-500' : ''}`}
                      placeholder="1"
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Devise principale articles
                    </label>
                    <select
                      value={item.mainCurrency}
                      onChange={(e) => handleItemChange(index, 'mainCurrency', e.target.value)}
                      className="input-field touch-input"
                    >
                      <option value="CNY">CNY (¥)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="MGA">MGA (Ar)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix d'achat unitaire ({item.mainCurrency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        {item.mainCurrency === 'USD' ? '$' : 
                         item.mainCurrency === 'EUR' ? '€' : 
                         item.mainCurrency === 'CNY' ? '¥' : 'Ar'}
                      </span>
                      <input
                        type="text"
                        value={formatNumberWithSpaces(item.purchasePrice)}
                        onChange={(e) => handleItemChange(index, 'purchasePrice', parseFormattedNumber(e.target.value))}
                        className="pl-10 input-field touch-input"
                        placeholder="0"
                      />
                    </div>
                    {item.mainCurrency !== 'MGA' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Équivalent: {formatNumberWithSpaces(Math.round(convertToMGA(item.purchasePrice, item.mainCurrency as 'USD' | 'EUR' | 'CNY')))} Ar
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frais de transport ({item.transportCurrency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        {item.transportCurrency === 'USD' ? '$' : 
                         item.transportCurrency === 'EUR' ? '€' : 
                         item.transportCurrency === 'CNY' ? '¥' : 'Ar'}
                      </span>
                      <input
                        type="text"
                        value={formatNumberWithSpaces(item.transportFeesOriginal || 0)}
                        onChange={(e) => {
                          const value = parseFormattedNumber(e.target.value);
                          handleItemChange(index, 'transportFeesOriginal', value);
                        }}
                        className="pl-10 input-field touch-input"
                        placeholder="0"
                      />
                    </div>
                    {item.transportCurrency !== 'MGA' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Équivalent: {formatNumberWithSpaces(Math.round(convertToMGA(item.transportFeesOriginal || 0, item.transportCurrency as 'USD' | 'EUR' | 'CNY')))} Ar
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marge (%)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(item.margin || 20)}
                      onChange={(e) => handleItemChange(index, 'margin', parseFormattedNumber(e.target.value))}
                      className="input-field touch-input"
                      placeholder="20"
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
                      className="input-field touch-input"
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
                      className="input-field touch-input"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix de vente unitaire (Ar)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={formatNumberWithSpaces(Math.round(item.unitPrice))}
                        className="pl-10 input-field bg-gray-50 touch-input"
                        readOnly
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Calculé automatiquement
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poids (kg)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(item.weight)}
                      onChange={(e) => handleItemChange(index, 'weight', parseFormattedNumber(e.target.value))}
                      className="input-field touch-input"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      className="input-field touch-input"
                      placeholder="Électronique, Textile, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code HS
                    </label>
                    <input
                      type="text"
                      value={item.hsCode}
                      onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                      className="input-field touch-input"
                      placeholder="Code douanier"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimensions (L × l × H en cm)
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <input
                        type="text"
                        value={formatNumberWithSpaces(item.dimensions.length)}
                        onChange={(e) => handleDimensionChange(index, 'length', parseFormattedNumber(e.target.value))}
                        className="input-field touch-input"
                        placeholder="Longueur"
                      />
                      <input
                        type="text"
                        value={formatNumberWithSpaces(item.dimensions.width)}
                        onChange={(e) => handleDimensionChange(index, 'width', parseFormattedNumber(e.target.value))}
                        className="input-field touch-input"
                        placeholder="Largeur"
                      />
                      <input
                        type="text"
                        value={formatNumberWithSpaces(item.dimensions.height)}
                        onChange={(e) => handleDimensionChange(index, 'height', parseFormattedNumber(e.target.value))}
                        className="input-field touch-input"
                        placeholder="Hauteur"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lien produit (optionnel)
                    </label>
                    <input
                      type="url"
                      value={item.productLink}
                      onChange={(e) => handleItemChange(index, 'productLink', e.target.value)}
                      className="input-field touch-input"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dates et Validité */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Dates et Validité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-form-stack tablet-form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valide jusqu'au *
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => handleInputChange('validUntil', e.target.value)}
                className={`input-field touch-input ${errors.validUntil ? 'border-red-500' : ''}`}
              />
              {errors.validUntil && <p className="text-red-500 text-xs mt-1">{errors.validUntil}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Livraison estimée *
              </label>
              <input
                type="date"
                value={formData.estimatedDelivery}
                onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                className={`input-field touch-input ${errors.estimatedDelivery ? 'border-red-500' : ''}`}
              />
              {errors.estimatedDelivery && <p className="text-red-500 text-xs mt-1">{errors.estimatedDelivery}</p>}
            </div>
          </div>
        </div>

        {/* Acompte */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Acompte (optionnel)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mobile-form-stack tablet-form-grid">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pourcentage d'acompte (%)
              </label>
              <input
                type="text"
                value={formatNumberWithSpaces(downPaymentData.percentage)}
                onChange={(e) => handleDownPaymentChange('percentage', parseFormattedNumber(e.target.value))}
                className={`input-field touch-input ${errors.downPaymentPercentage ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {errors.downPaymentPercentage && <p className="text-red-500 text-xs mt-1">{errors.downPaymentPercentage}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant d'acompte (Ar)
              </label>
              <input
                type="text"
                value={formatNumberWithSpaces(downPaymentData.amount)}
                onChange={(e) => handleDownPaymentChange('amount', parseFormattedNumber(e.target.value))}
                className="input-field touch-input"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mode de paiement
              </label>
              <select
                value={downPaymentData.paymentMethod}
                onChange={(e) => handleDownPaymentChange('paymentMethod', e.target.value)}
                className="input-field touch-input"
              >
                <option value="">Sélectionner...</option>
                <option value="cash">Espèces</option>
                <option value="bank_transfer">Virement bancaire</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="check">Chèque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes sur l'acompte
              </label>
              <input
                type="text"
                value={downPaymentData.notes}
                onChange={(e) => handleDownPaymentChange('notes', e.target.value)}
                className="input-field touch-input"
                placeholder="Notes optionnelles"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Notes additionnelles</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="input-field touch-input"
            placeholder="Notes, conditions particulières, etc."
          />
        </div>

        {/* Aperçu du devis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Aperçu du devis</h2>
          
          <div className="overflow-x-auto mobile-table-container">
            <table className="min-w-full divide-y divide-gray-200 tablet-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix unitaire
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                      {item.description || `Article ${index + 1}`}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                      {formatNumberWithSpaces(item.quantity)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                      {formatNumberWithSpaces(Math.round(item.unitPrice))} Ar
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                      {formatNumberWithSpaces(Math.round(item.sellingPrice))} Ar
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 sm:mt-6 flex justify-end">
            <div className="w-full sm:w-64 lg:w-72">
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Sous-total:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatNumberWithSpaces(Math.round(calculateTotal()))} Ar
                </span>
              </div>
              
              {downPaymentData.amount > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">
                      Acompte ({formatNumberWithSpaces(downPaymentData.percentage)}%):
                    </span>
                    <span className="text-sm font-medium text-orange-600">
                      -{formatNumberWithSpaces(downPaymentData.amount)} Ar
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Solde restant:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatNumberWithSpaces(Math.round(calculateTotal() - downPaymentData.amount))} Ar
                    </span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="text-base font-semibold text-gray-900">Total:</span>
                <span className="text-base font-bold text-gray-900">
                  {formatNumberWithSpaces(Math.round(calculateTotal()))} Ar
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mobile-button-stack">
          <button
            type="button"
            onClick={() => navigate('/quotes')}
            className="btn-secondary touch-target"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center justify-center space-x-2 touch-target"
          >
            <Save className="w-4 h-4" />
            <span>Créer le devis</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewQuote;