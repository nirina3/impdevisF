import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuotes } from '../hooks/useQuotes';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { Plus, Trash2, Save, ArrowLeft, Eye, FileText } from 'lucide-react';
import { Quote, QuoteItem } from '../types';
import { formatNumberWithSpaces, parseFormattedNumber } from '../utils/formatters';
import { generateQuotePDF, printQuote } from '../utils/pdf';

const NewQuote: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addQuote } = useQuotes();
  const { calculationData, clearCalculation } = useCostCalculation();
  
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    originCountry: '',
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
      margin: 20
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Vérifier si on vient du calcul des coûts
  const fromCostCalculation = searchParams.get('from') === 'cost-calculation';

  // Charger les données du calcul des coûts si disponibles
  useEffect(() => {
    if (fromCostCalculation && calculationData) {
      // Convertir les données du calcul des coûts vers le format du devis
      const convertedItems = calculationData.items.map(costItem => ({
        description: costItem.description,
        quantity: costItem.quantity,
        unitPrice: costItem.sellingPrice,
        purchasePrice: costItem.purchasePrice,
        miscFees: costItem.miscFees,
        customsFees: costItem.customsFees,
        sellingPrice: costItem.sellingPrice,
        weight: costItem.weight || 0,
        dimensions: costItem.dimensions || { length: 0, width: 0, height: 0 },
        hsCode: costItem.hsCode || '',
        category: costItem.category || '',
        productLink: costItem.productLink || '',
        margin: costItem.margin
      }));

      setItems(convertedItems);

      // Pré-remplir le pays d'origine si tous les articles viennent du même pays
      const countries = [...new Set(calculationData.items.map(item => item.originCountry))];
      if (countries.length === 1) {
        setFormData(prev => ({ ...prev, originCountry: countries[0] }));
      }
    }
  }, [fromCostCalculation, calculationData]);

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
        
        // Calcul automatique du prix de vente
        if (['purchasePrice', 'miscFees', 'customsFees'].includes(field)) {
          const purchasePrice = field === 'purchasePrice' ? value : updatedItem.purchasePrice;
          const miscFees = field === 'miscFees' ? value : updatedItem.miscFees;
          const customsFees = field === 'customsFees' ? value : updatedItem.customsFees;
          
          const totalCost = purchasePrice + miscFees + customsFees;
          const margin = updatedItem.margin || 0;
          updatedItem.sellingPrice = totalCost + (totalCost * margin / 100);
          updatedItem.unitPrice = updatedItem.sellingPrice;
        }
        
        // Recalcul du prix de vente si la marge change
        if (field === 'margin') {
          const totalCost = updatedItem.purchasePrice + updatedItem.miscFees + updatedItem.customsFees;
          updatedItem.sellingPrice = totalCost + (totalCost * value / 100);
          updatedItem.unitPrice = updatedItem.sellingPrice;
        }
        
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
      margin: 20
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);
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
      quoteNumber: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      ...formData,
      validUntil: new Date(formData.validUntil),
      estimatedDelivery: new Date(formData.estimatedDelivery),
      status: 'draft',
      totalAmount,
      paymentStatus,
      remainingAmount,
      destinationPort: '', // Valeur par défaut vide puisque le champ est supprimé
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

  const handleClearCostData = () => {
    clearCalculation();
    // Réinitialiser les articles à un article vide
    setItems([{
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
      margin: 20
    }]);
  };

  const generatePreviewQuote = (): Quote => {
    const totalAmount = calculateTotal();
    const remainingAmount = totalAmount - downPaymentData.amount;
    
    let paymentStatus: Quote['paymentStatus'] = 'unpaid';
    if (downPaymentData.amount === totalAmount) paymentStatus = 'paid';
    else if (downPaymentData.amount > 0) paymentStatus = 'partial';

    return {
      id: 'preview',
      quoteNumber: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      ...formData,
      validUntil: formData.validUntil ? new Date(formData.validUntil) : new Date(),
      estimatedDelivery: formData.estimatedDelivery ? new Date(formData.estimatedDelivery) : new Date(),
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalAmount,
      paymentStatus,
      remainingAmount,
      destinationPort: '',
      downPayment: downPaymentData.amount > 0 ? {
        id: `dp_preview`,
        amount: downPaymentData.amount,
        percentage: downPaymentData.percentage,
        paymentMethod: downPaymentData.paymentMethod,
        notes: downPaymentData.notes
      } : undefined,
      items: items.map((item, index) => ({
        ...item,
        id: `item_${index}_preview`
      }))
    };
  };

  const previewQuote = generatePreviewQuote();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/quotes')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nouveau Devis</h1>
        </div>
      </div>

      {/* Notification si les données viennent du calcul des coûts */}
      {fromCostCalculation && calculationData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-green-900">Données importées du calcul des coûts</h3>
                <p className="text-sm text-green-700">
                  {calculationData.items.length} article(s) importé(s) • 
                  Calculé le {calculationData.calculatedAt.toLocaleString('fr-FR')} • 
                  Total : {formatNumberWithSpaces(Math.round(calculationData.totalSellingPrice))} Ar
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/cost-calculation')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Retour au calcul
              </button>
              <button
                onClick={handleClearCostData}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Effacer les données
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('form')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'form'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <FileText className="w-4 h-4" />
                <span>Formulaire</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'preview'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <Eye className="w-4 h-4" />
                <span>Aperçu Devis</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations Client */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations Client</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du client *
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      className={`input-field ${errors.clientName ? 'border-red-500' : ''}`}
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
                      className={`input-field ${errors.clientEmail ? 'border-red-500' : ''}`}
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
                      className={`input-field ${errors.clientPhone ? 'border-red-500' : ''}`}
                      placeholder="+261 34 12 345 67"
                    />
                    {errors.clientPhone && <p className="text-red-500 text-xs mt-1">{errors.clientPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse *
                    </label>
                    <textarea
                      value={formData.clientAddress}
                      onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                      rows={3}
                      className={`input-field ${errors.clientAddress ? 'border-red-500' : ''}`}
                      placeholder="Adresse complète du client"
                    />
                    {errors.clientAddress && <p className="text-red-500 text-xs mt-1">{errors.clientAddress}</p>}
                  </div>
                </div>
              </div>

              {/* Articles */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-primary flex items-center space-x-2 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Ajouter un article</span>
                    <span className="sm:hidden">Ajouter</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm sm:text-md font-medium text-gray-900">Article {index + 1}</h3>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className={`input-field ${errors[`item_${index}_description`] ? 'border-red-500' : ''}`}
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
                            className={`input-field ${errors[`item_${index}_quantity`] ? 'border-red-500' : ''}`}
                            placeholder="1"
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prix d'achat (Ar)
                          </label>
                          <input
                            type="text"
                            value={formatNumberWithSpaces(item.purchasePrice)}
                            onChange={(e) => handleItemChange(index, 'purchasePrice', parseFormattedNumber(e.target.value))}
                            className="input-field"
                            placeholder="0"
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
                            Prix de vente unitaire (Ar)
                           {fromCostCalculation && (
                             <span className="text-xs text-green-600 ml-1">(Calculé automatiquement)</span>
                           )}
                          </label>
                          <input
                            type="text"
                            value={formatNumberWithSpaces(item.sellingPrice)}
                            onChange={(e) => handleItemChange(index, 'sellingPrice', parseFormattedNumber(e.target.value))}
                           className={`input-field ${fromCostCalculation ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                            placeholder="0"
                           readOnly={fromCostCalculation}
                          />
                         {fromCostCalculation && (
                           <p className="text-xs text-green-600 mt-1">
                             Prix calculé avec marge de {formatNumberWithSpaces(item.margin || 0)}%
                           </p>
                         )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Marge en pourcentage (%)
                           {fromCostCalculation && (
                             <span className="text-xs text-green-600 ml-1">(Importée du calcul)</span>
                           )}
                          </label>
                          <input
                            type="text"
                            value={formatNumberWithSpaces(item.margin || 0)}
                            onChange={(e) => handleItemChange(index, 'margin', parseFormattedNumber(e.target.value))}
                           className={`input-field ${fromCostCalculation ? 'bg-green-50 border-green-200' : ''}`}
                            placeholder="20"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Poids (kg)
                          </label>
                          <input
                            type="text"
                            value={formatNumberWithSpaces(item.weight)}
                            onChange={(e) => handleItemChange(index, 'weight', parseFormattedNumber(e.target.value))}
                            className="input-field"
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
                            className="input-field"
                            placeholder="Électronique, Textile, etc."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code HS
                          </label>
                          <input
                            type="text"
                            value={item.hsCode || ''}
                            onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                            className="input-field"
                            placeholder="8517.12.00"
                          />
                        </div>

                        {/* Dimensions */}
                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dimensions (cm)
                          </label>
                          <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <input
                              type="text"
                              value={formatNumberWithSpaces(item.dimensions.length)}
                              onChange={(e) => handleDimensionChange(index, 'length', parseFormattedNumber(e.target.value))}
                              className="input-field"
                              placeholder="Longueur"
                            />
                            <input
                              type="text"
                              value={formatNumberWithSpaces(item.dimensions.width)}
                              onChange={(e) => handleDimensionChange(index, 'width', parseFormattedNumber(e.target.value))}
                              className="input-field"
                              placeholder="Largeur"
                            />
                            <input
                              type="text"
                              value={formatNumberWithSpaces(item.dimensions.height)}
                              onChange={(e) => handleDimensionChange(index, 'height', parseFormattedNumber(e.target.value))}
                              className="input-field"
                              placeholder="Hauteur"
                            />
                          </div>
                        </div>

                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lien produit (optionnel)
                          </label>
                          <input
                            type="url"
                            value={item.productLink || ''}
                            onChange={(e) => handleItemChange(index, 'productLink', e.target.value)}
                            className="input-field"
                            placeholder="https://exemple.com/produit"
                          />
                        </div>
                      </div>

                      {/* Résumé de l'article */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Coût unitaire (sans marge):</span>
                            <span>{formatNumberWithSpaces(item.purchasePrice + item.miscFees + item.customsFees)} Ar</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Marge ({formatNumberWithSpaces(item.margin || 0)}%):</span>
                            <span>+{formatNumberWithSpaces(Math.round((item.purchasePrice + item.miscFees + item.customsFees) * (item.margin || 0) / 100))} Ar</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Prix de vente unitaire:</span>
                            <span className="font-semibold text-gray-900 text-sm">
                              {formatNumberWithSpaces(item.sellingPrice)} Ar
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Total pour cet article:</span>
                            <span className="font-bold text-blue-600 text-sm">
                              {formatNumberWithSpaces(item.quantity * item.sellingPrice)} Ar
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expédition - Section corrigée */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Expédition</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pays d'origine *
                    </label>
                    <input
                      type="text"
                      value={formData.originCountry}
                      onChange={(e) => handleInputChange('originCountry', e.target.value)}
                      className={`input-field ${errors.originCountry ? 'border-red-500' : ''}`}
                      placeholder="Chine, France, Allemagne..."
                    />
                    {errors.originCountry && <p className="text-red-500 text-xs mt-1">{errors.originCountry}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mode d'expédition *
                    </label>
                    <select
                      value={formData.shippingMethod}
                      onChange={(e) => handleInputChange('shippingMethod', e.target.value)}
                      className="input-field"
                    >
                      <option value="sea">Maritime</option>
                      <option value="air">Aérien</option>
                      <option value="land">Terrestre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de validité *
                    </label>
                    <input
                      type="date"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange('validUntil', e.target.value)}
                      className={`input-field ${errors.validUntil ? 'border-red-500' : ''}`}
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
                      className={`input-field ${errors.estimatedDelivery ? 'border-red-500' : ''}`}
                    />
                    {errors.estimatedDelivery && <p className="text-red-500 text-xs mt-1">{errors.estimatedDelivery}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes générales
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="input-field"
                      placeholder="Notes ou instructions spéciales..."
                    />
                  </div>
                </div>
              </div>

              {/* Acompte */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acompte (Optionnel)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pourcentage d'acompte (%)
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(downPaymentData.percentage)}
                      onChange={(e) => handleDownPaymentChange('percentage', parseFormattedNumber(e.target.value))}
                      className={`input-field ${errors.downPaymentPercentage ? 'border-red-500' : ''}`}
                      placeholder="30"
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
                      className="input-field"
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
                      className="input-field"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="cash">Espèces</option>
                      <option value="bank_transfer">Virement bancaire</option>
                      <option value="check">Chèque</option>
                      <option value="mobile_money">Mobile Money</option>
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
                      className="input-field"
                      placeholder="Notes optionnelles..."
                    />
                  </div>
                </div>
              </div>

              {/* Résumé */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total articles</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatNumberWithSpaces(items.length)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Montant total</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {formatNumberWithSpaces(calculateTotal())} Ar
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Solde restant</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600">
                      {formatNumberWithSpaces(calculateTotal() - downPaymentData.amount)} Ar
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/quotes')}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>Créer le devis</span>
                </button>
              </div>
            </form>
          ) : (
            /* Aperçu du devis - Section réparée */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Aperçu du Devis</h2>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => printQuote(previewQuote)}
                    className="btn-secondary flex items-center justify-center space-x-2 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Imprimer</span>
                  </button>
                  <button
                    onClick={() => generateQuotePDF(previewQuote)}
                    className="btn-primary flex items-center justify-center space-x-2 text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Télécharger PDF</span>
                  </button>
                </div>
              </div>

              {/* Aperçu du devis */}
              <div className="bg-white border border-gray-300 rounded-lg p-4 sm:p-8 shadow-sm">
                {/* En-tête du devis */}
                <div className="text-center mb-8 border-b border-gray-200 pb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">DEVIS D'IMPORTATION</h1>
                  <p className="text-lg sm:text-xl text-gray-600">{previewQuote.quoteNumber}</p>
                </div>

                {/* Informations client et devis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Informations Client</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Nom:</span> {previewQuote.clientName || 'Non renseigné'}</p>
                      <p><span className="font-medium">Email:</span> {previewQuote.clientEmail || 'Non renseigné'}</p>
                      <p><span className="font-medium">Téléphone:</span> {previewQuote.clientPhone || 'Non renseigné'}</p>
                      <p><span className="font-medium">Adresse:</span> {previewQuote.clientAddress || 'Non renseignée'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Informations Devis</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Date de création:</span> {previewQuote.createdAt.toLocaleDateString('fr-FR')}</p>
                      <p><span className="font-medium">Valide jusqu'au:</span> {previewQuote.validUntil.toLocaleDateString('fr-FR')}</p>
                      <p><span className="font-medium">Livraison estimée:</span> {previewQuote.estimatedDelivery.toLocaleDateString('fr-FR')}</p>
                      <p><span className="font-medium">Origine:</span> {previewQuote.originCountry || 'Non renseigné'}</p>
                      <p><span className="font-medium">Mode d'expédition:</span> {
                        previewQuote.shippingMethod === 'sea' ? 'Maritime' :
                        previewQuote.shippingMethod === 'air' ? 'Aérien' : 'Terrestre'
                      }</p>
                    </div>
                  </div>
                </div>

                {/* Articles */}
                <div className="mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Articles</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 hidden sm:table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-300">Description</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b border-gray-300">Quantité</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b border-gray-300">Prix Unitaire</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase border-b border-gray-300">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {previewQuote.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                              <div>
                                <p className="font-medium">{item.description || 'Article sans description'}</p>
                                {item.category && <p className="text-xs text-gray-500">{item.category}</p>}
                                {item.hsCode && <p className="text-xs text-gray-500">Code HS: {item.hsCode}</p>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center border-b border-gray-200">
                              {formatNumberWithSpaces(item.quantity)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right border-b border-gray-200">
                              {formatNumberWithSpaces(item.sellingPrice)} Ar
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right border-b border-gray-200">
                              {formatNumberWithSpaces(item.quantity * item.sellingPrice)} Ar
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile articles view */}
                    <div className="sm:hidden space-y-4">
                      {previewQuote.items.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="font-medium text-gray-900 mb-2">
                            {item.description || 'Article sans description'}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Quantité:</span>
                              <span className="ml-1 font-medium">{formatNumberWithSpaces(item.quantity)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Prix unitaire:</span>
                              <span className="ml-1 font-medium">{formatNumberWithSpaces(item.sellingPrice)} Ar</span>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-gray-200">
                              <span className="text-gray-500">Total:</span>
                              <span className="ml-1 font-bold text-blue-600">
                                {formatNumberWithSpaces(item.quantity * item.sellingPrice)} Ar
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total et paiement */}
                <div className="border-t border-gray-300 pt-6">
                  <div className="flex justify-end">
                    <div className="w-full max-w-xs sm:max-w-sm space-y-3">
                      <div className="flex justify-between items-center text-base sm:text-lg">
                        <span className="font-semibold text-gray-900">TOTAL:</span>
                        <span className="font-bold text-gray-900 text-lg sm:text-xl">
                          {formatNumberWithSpaces(previewQuote.totalAmount)} Ar
                        </span>
                      </div>
                      
                      {previewQuote.downPayment && previewQuote.downPayment.amount > 0 && (
                        <>
                          <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-3">
                            <span className="text-gray-600">
                              Acompte ({formatNumberWithSpaces(previewQuote.downPayment.percentage)}%):
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatNumberWithSpaces(previewQuote.downPayment.amount)} Ar
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Solde restant:</span>
                            <span className="font-medium text-orange-600">
                              {formatNumberWithSpaces(previewQuote.remainingAmount)} Ar
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {previewQuote.notes && (
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Notes</h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {previewQuote.notes}
                    </p>
                  </div>
                )}

                {/* Conditions */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Conditions</h3>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>• Ce devis est valable jusqu'au {previewQuote.validUntil.toLocaleDateString('fr-FR')}</p>
                    <p>• Livraison estimée: {previewQuote.estimatedDelivery.toLocaleDateString('fr-FR')}</p>
                    <p>• Les prix sont exprimés en Ariary malgache (MGA)</p>
                    <p>• Les frais de douane et taxes sont inclus dans les prix</p>
                    {previewQuote.downPayment && previewQuote.downPayment.amount > 0 && (
                      <p>• Un acompte de {formatNumberWithSpaces(previewQuote.downPayment.percentage)}% est requis à la commande</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewQuote;