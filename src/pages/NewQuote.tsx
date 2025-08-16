import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotes } from '../hooks/useQuotes';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Calculator, 
  DollarSign, 
  TrendingUp,
  FileText,
  Eye,
  Download,
  Send,
  User,
  Building,
  Truck,
  CreditCard
} from 'lucide-react';
import { Quote, QuoteItem } from '../types';
import { formatNumberWithSpaces, parseFormattedNumber } from '../utils/formatters';
import { generateQuotePDF, printQuote } from '../utils/pdf';

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
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  hsCode: string;
  category: string;
  productLink: string;
}

interface ExchangeRates {
  USD: number;
  EUR: number;
  CNY: number;
}

const NewQuote: React.FC = () => {
  const navigate = useNavigate();
  const { addQuote } = useQuotes();
  
  // Données client et devis
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientCompany: '',
    originCountry: '',
    destinationPort: '',
    shippingMethod: 'sea' as Quote['shippingMethod'],
    currency: 'MGA' as Quote['currency'],
    validUntil: '',
    estimatedDelivery: '',
    notes: ''
  });

  // Données d'acompte
  const [downPaymentData, setDownPaymentData] = useState({
    percentage: 0,
    amount: 0,
    paymentMethod: '',
    notes: ''
  });

  // Taux de change
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 4500,
    EUR: 4900,
    CNY: 620
  });

  // Articles avec calcul de coûts intégré
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
      originCountry: 'Chine',
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      hsCode: '',
      category: '',
      productLink: ''
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [activeTab, setActiveTab] = useState('client');

  // Fonctions de conversion et calcul
  const convertToMGA = (amount: number, currency: 'USD' | 'EUR' | 'CNY' | 'MGA'): number => {
    if (currency === 'MGA') return amount;
    return amount * exchangeRates[currency];
  };

  const calculateSellingPrice = (item: CostItem): number => {
    const purchasePriceMGA = convertToMGA(item.purchasePrice, item.mainCurrency);
    const transportFeesMGA = convertToMGA(item.transportFeesOriginal, item.transportCurrency);
    const totalCostMGA = (purchasePriceMGA * item.quantity) + transportFeesMGA + item.miscFees + item.customsFees;
    return totalCostMGA + (totalCostMGA * item.margin / 100);
  };

  const getTotalCostMGA = (item: CostItem) => {
    const purchasePriceMGA = convertToMGA(item.purchasePrice, item.mainCurrency);
    return (purchasePriceMGA * item.quantity) + item.transportFees + item.miscFees + item.customsFees;
  };

  const getMarginAmount = (item: CostItem) => {
    const totalCost = getTotalCostMGA(item);
    return totalCost * item.margin / 100;
  };

  // Gestionnaires d'événements
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleExchangeRateChange = (currency: keyof ExchangeRates, value: string) => {
    const numValue = parseFormattedNumber(value);
    setExchangeRates(prev => ({ ...prev, [currency]: numValue }));
    
    setItems(prev => prev.map(item => ({
      ...item,
      transportFees: convertToMGA(item.transportFeesOriginal, item.transportCurrency),
      sellingPrice: calculateSellingPrice({ ...item, transportFees: convertToMGA(item.transportFeesOriginal, item.transportCurrency) })
    })));
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

  const handleDimensionChange = (index: number, dimension: string, value: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, dimensions: { ...item.dimensions, [dimension]: value } }
        : item
    ));
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
      originCountry: 'Chine',
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      hsCode: '',
      category: '',
      productLink: ''
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) newErrors.clientName = 'Le nom du client est requis';
    if (!formData.clientEmail.trim()) newErrors.clientEmail = 'L\'email du client est requis';
    if (!formData.clientPhone.trim()) newErrors.clientPhone = 'Le téléphone du client est requis';
    if (!formData.clientAddress.trim()) newErrors.clientAddress = 'L\'adresse du client est requise';
    if (!formData.destinationPort.trim()) newErrors.destinationPort = 'Le port de destination est requis';
    if (!formData.validUntil) newErrors.validUntil = 'La date de validité est requise';
    if (!formData.estimatedDelivery) newErrors.estimatedDelivery = 'La date de livraison estimée est requise';

    items.forEach((item, index) => {
      if (!item.description.trim()) newErrors[`item_${index}_description`] = 'La description est requise';
      if (item.quantity <= 0) newErrors[`item_${index}_quantity`] = 'La quantité doit être positive';
      if (!item.category.trim()) newErrors[`item_${index}_category`] = 'La catégorie est requise';
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

    const newQuote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
      quoteNumber: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      ...formData,
      validUntil: new Date(formData.validUntil),
      estimatedDelivery: new Date(formData.estimatedDelivery),
      status: 'draft',
      totalAmount,
      paymentStatus,
      remainingAmount,
      downPayment: downPaymentData.amount > 0 ? {
        id: `dp_${Date.now()}`,
        amount: downPaymentData.amount,
        percentage: downPaymentData.percentage,
        paymentMethod: downPaymentData.paymentMethod,
        notes: downPaymentData.notes
      } : undefined,
      items: items.map((item, index) => ({
        id: `item_${index}_${Date.now()}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: Math.round(item.sellingPrice / item.quantity),
        purchasePrice: Math.round(convertToMGA(item.purchasePrice, item.mainCurrency)),
        miscFees: item.miscFees,
        customsFees: item.customsFees,
        sellingPrice: Math.round(item.sellingPrice / item.quantity),
        weight: item.weight,
        dimensions: item.dimensions,
        hsCode: item.hsCode,
        category: item.category,
        productLink: item.productLink,
        mainCurrency: item.mainCurrency,
        exchangeRates: exchangeRates,
        transportFees: Math.round(item.transportFees),
        transportFeesOriginal: item.transportFeesOriginal,
        transportCurrency: item.transportCurrency
      }))
    };

    addQuote(newQuote);
    navigate('/quotes');
  };

  const generateQuotePreview = () => {
    if (!validateForm()) return;
    setShowQuotePreview(true);
  };

  const exportQuoteAsPDF = () => {
    const quoteData = {
      quoteNumber: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      ...formData,
      totalAmount: calculateTotal(),
      remainingAmount: calculateTotal() - downPaymentData.amount,
      downPayment: downPaymentData.amount > 0 ? downPaymentData : null,
      items: items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        sellingPrice: Math.round(item.sellingPrice / item.quantity),
        category: item.category
      })),
      createdAt: new Date(),
      validUntil: new Date(formData.validUntil),
      estimatedDelivery: new Date(formData.estimatedDelivery)
    };
    
    generateQuotePDF(quoteData);
  };

  const countries = [
    'Chine', 'États-Unis', 'Allemagne', 'France', 'Italie', 'Japon', 
    'Corée du Sud', 'Royaume-Uni', 'Espagne', 'Pays-Bas', 'Belgique', 'Autre'
  ];

  const categories = [
    'Électronique', 'Informatique', 'Textile', 'Machines', 'Automobile',
    'Cosmétiques', 'Alimentaire', 'Construction', 'Mobilier', 'Autre'
  ];

  const ports = [
    'Port de Casablanca', 'Port de Tanger Med', 'Port d\'Agadir', 'Port de Safi',
    'Aéroport Mohammed V', 'Aéroport de Marrakech', 'Frontière Ceuta', 'Frontière Melilla'
  ];

  const tabs = [
    { id: 'client', label: 'Informations Client', icon: User },
    { id: 'shipping', label: 'Expédition', icon: Truck },
    { id: 'costs', label: 'Calcul des Coûts', icon: Calculator },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'preview', label: 'Aperçu Devis', icon: Eye }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/quotes')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau Devis d'Importation</h1>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateQuotePreview}
            className="btn-secondary flex items-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>Aperçu</span>
          </button>
          <button
            onClick={exportQuoteAsPDF}
            className="btn-accent flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exporter PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Onglet Informations Client */}
        {activeTab === 'client' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Informations Client</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="+212 6 12 34 56 78"
                />
                {errors.clientPhone && <p className="text-red-500 text-xs mt-1">{errors.clientPhone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entreprise
                </label>
                <input
                  type="text"
                  value={formData.clientCompany}
                  onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                  className="input-field"
                  placeholder="Nom de l'entreprise (optionnel)"
                />
              </div>

              <div className="md:col-span-2">
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
        )}

        {/* Onglet Expédition */}
        {activeTab === 'shipping' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Informations d'Expédition</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Port de destination *
                </label>
                <select
                  value={formData.destinationPort}
                  onChange={(e) => handleInputChange('destinationPort', e.target.value)}
                  className={`input-field ${errors.destinationPort ? 'border-red-500' : ''}`}
                >
                  <option value="">Sélectionner un port</option>
                  {ports.map(port => (
                    <option key={port} value={port}>{port}</option>
                  ))}
                </select>
                {errors.destinationPort && <p className="text-red-500 text-xs mt-1">{errors.destinationPort}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mode d'expédition
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes générales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="Notes et commentaires sur le devis..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Onglet Calcul des Coûts */}
        {activeTab === 'costs' && (
          <div className="space-y-6">
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

            {/* Articles avec calcul de coûts */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Articles et Calcul des Coûts</h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un article</span>
                </button>
              </div>

              {items.map((item, index) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Article {index + 1}</h3>
                    {items.length > 1 && (
                      <button
                        type="button"
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
                        <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium mr-2">📝</span>
                          Informations de base
                        </h4>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description de l'article *
                            </label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className={`input-field ${errors[`item_${index}_description`] ? 'border-red-500' : ''}`}
                              placeholder="Description de l'article..."
                            />
                            {errors[`item_${index}_description`] && (
                              <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Catégorie *
                              </label>
                              <select
                                value={item.category}
                                onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                                className={`input-field ${errors[`item_${index}_category`] ? 'border-red-500' : ''}`}
                              >
                                <option value="">Sélectionner une catégorie</option>
                                {categories.map(category => (
                                  <option key={category} value={category}>{category}</option>
                                ))}
                              </select>
                              {errors[`item_${index}_category`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_category`]}</p>
                              )}
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

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Code HS
                              </label>
                              <input
                                type="text"
                                value={item.hsCode}
                                onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                                className="input-field"
                                placeholder="Ex: 8517.12.00"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lien produit
                              </label>
                              <input
                                type="url"
                                value={item.productLink}
                                onChange={(e) => handleItemChange(index, 'productLink', e.target.value)}
                                className="input-field"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium mr-2">💰</span>
                          Prix et quantité
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              Devise principale
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

                          <div>
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

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Longueur (cm)
                            </label>
                            <input
                              type="text"
                              value={formatNumberWithSpaces(item.dimensions.length)}
                              onChange={(e) => handleDimensionChange(index, 'length', parseFormattedNumber(e.target.value))}
                              className="input-field"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Largeur (cm)
                            </label>
                            <input
                              type="text"
                              value={formatNumberWithSpaces(item.dimensions.width)}
                              onChange={(e) => handleDimensionChange(index, 'width', parseFormattedNumber(e.target.value))}
                              className="input-field"
                              placeholder="0"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hauteur (cm)
                            </label>
                            <input
                              type="text"
                              value={formatNumberWithSpaces(item.dimensions.height)}
                              onChange={(e) => handleDimensionChange(index, 'height', parseFormattedNumber(e.target.value))}
                              className="input-field"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium mr-2">🚚</span>
                          Frais de transport
                        </h4>
                        
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
                        <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium mr-2">📋</span>
                          Autres frais et marge
                        </h4>
                        
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
                      <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b border-blue-200 flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium mr-2">💰</span>
                        Résultats du calcul
                      </h4>

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

              {/* Résumé global des coûts */}
              {items.length > 1 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium mr-3">📊</span>
                    Résumé Global des Coûts
                  </h3>
                  
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
                        {formatNumberWithSpaces(Math.round(calculateTotal()))} Ar
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
          </div>
        )}

        {/* Onglet Paiement */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Conditions de Paiement</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pourcentage d'acompte (%)
                </label>
                <input
                  type="text"
                  value={formatNumberWithSpaces(downPaymentData.percentage)}
                  onChange={(e) => handleDownPaymentChange('percentage', parseFormattedNumber(e.target.value))}
                  className={`input-field ${errors.downPaymentPercentage ? 'border-red-500' : ''}`}
                  placeholder="0"
                  max="100"
                />
                {errors.downPaymentPercentage && (
                  <p className="text-red-500 text-xs mt-1">{errors.downPaymentPercentage}</p>
                )}
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
                  <option value="">Sélectionner</option>
                  <option value="cash">Espèces</option>
                  <option value="bank_transfer">Virement bancaire</option>
                  <option value="check">Chèque</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Solde restant
                </label>
                <div className="input-field bg-gray-50 text-gray-700">
                  {formatNumberWithSpaces(calculateTotal() - downPaymentData.amount)} Ar
                </div>
              </div>

              <div className="lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes sur le paiement
                </label>
                <textarea
                  value={downPaymentData.notes}
                  onChange={(e) => handleDownPaymentChange('notes', e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="Conditions particulières de paiement..."
                />
              </div>
            </div>

            {/* Résumé financier */}
            <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé Financier</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Montant total</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatNumberWithSpaces(Math.round(calculateTotal()))} Ar
                  </p>
                </div>
                
                {downPaymentData.amount > 0 && (
                  <>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Acompte ({formatNumberWithSpaces(downPaymentData.percentage)}%)</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatNumberWithSpaces(downPaymentData.amount)} Ar
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Solde restant</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatNumberWithSpaces(calculateTotal() - downPaymentData.amount)} Ar
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Aperçu Devis */}
        {activeTab === 'preview' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Aperçu du Devis Client</h2>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={exportQuoteAsPDF}
                  className="btn-accent flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const quoteData = {
                      quoteNumber: `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
                      ...formData,
                      totalAmount: calculateTotal(),
                      items: items,
                      createdAt: new Date(),
                      validUntil: new Date(formData.validUntil),
                      estimatedDelivery: new Date(formData.estimatedDelivery)
                    };
                    printQuote(quoteData);
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>

            {/* Aperçu du devis formaté */}
            <div className="border border-gray-300 rounded-lg p-8 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
              {/* En-tête du devis */}
              <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">DEVIS D'IMPORTATION</h1>
                <p className="text-lg text-gray-600">QT-{new Date().getFullYear()}-{String(Date.now()).slice(-6)}</p>
              </div>

              {/* Informations client et entreprise */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">INFORMATIONS CLIENT</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nom:</strong> {formData.clientName || '[Nom du client]'}</p>
                    <p><strong>Email:</strong> {formData.clientEmail || '[Email]'}</p>
                    <p><strong>Téléphone:</strong> {formData.clientPhone || '[Téléphone]'}</p>
                    {formData.clientCompany && <p><strong>Entreprise:</strong> {formData.clientCompany}</p>}
                    <p><strong>Adresse:</strong> {formData.clientAddress || '[Adresse]'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">INFORMATIONS LIVRAISON</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Destination:</strong> {formData.destinationPort || '[Port de destination]'}</p>
                    <p><strong>Mode d'expédition:</strong> {
                      formData.shippingMethod === 'sea' ? 'Maritime' :
                      formData.shippingMethod === 'air' ? 'Aérien' : 'Terrestre'
                    }</p>
                    <p><strong>Date de création:</strong> {format(new Date(), 'dd/MM/yyyy', { locale: fr })}</p>
                    <p><strong>Valide jusqu'au:</strong> {formData.validUntil ? format(new Date(formData.validUntil), 'dd/MM/yyyy', { locale: fr }) : '[Date de validité]'}</p>
                    <p><strong>Livraison estimée:</strong> {formData.estimatedDelivery ? format(new Date(formData.estimatedDelivery), 'dd/MM/yyyy', { locale: fr }) : '[Date de livraison]'}</p>
                  </div>
                </div>
              </div>

              {/* Tableau des articles */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">DÉTAIL DES ARTICLES</h3>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Description</th>
                      <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">Quantité</th>
                      <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Prix Unitaire</th>
                      <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-3 text-sm">
                          <div>
                            <p className="font-medium">{item.description || `Article ${index + 1}`}</p>
                            <p className="text-gray-500 text-xs">{item.category}</p>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                          {formatNumberWithSpaces(item.quantity)}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-sm">
                          {formatNumberWithSpaces(Math.round(item.sellingPrice / item.quantity))} Ar
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-right text-sm font-medium">
                          {formatNumberWithSpaces(Math.round(item.sellingPrice))} Ar
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div className="flex justify-end mb-8">
                <div className="w-80">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span>Sous-total:</span>
                      <span className="font-medium">{formatNumberWithSpaces(Math.round(calculateTotal()))} Ar</span>
                    </div>
                    
                    {downPaymentData.amount > 0 && (
                      <>
                        <div className="flex justify-between py-2">
                          <span>Acompte ({formatNumberWithSpaces(downPaymentData.percentage)}%):</span>
                          <span className="font-medium text-blue-600">
                            {formatNumberWithSpaces(downPaymentData.amount)} Ar
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span>Solde restant:</span>
                          <span className="font-medium text-orange-600">
                            {formatNumberWithSpaces(calculateTotal() - downPaymentData.amount)} Ar
                          </span>
                        </div>
                      </>
                    )}
                    
                    <div className="flex justify-between py-3 text-lg font-bold border-t-2 border-gray-300">
                      <span>TOTAL:</span>
                      <span className="text-green-600">{formatNumberWithSpaces(Math.round(calculateTotal()))} Ar</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="border-t border-gray-300 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">CONDITIONS GÉNÉRALES</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>• Ce devis est valable jusqu'au {formData.validUntil ? format(new Date(formData.validUntil), 'dd/MM/yyyy', { locale: fr }) : '[Date de validité]'}</p>
                  <p>• Livraison estimée: {formData.estimatedDelivery ? format(new Date(formData.estimatedDelivery), 'dd/MM/yyyy', { locale: fr }) : '[Date de livraison]'}</p>
                  <p>• Mode d'expédition: {
                    formData.shippingMethod === 'sea' ? 'Maritime' :
                    formData.shippingMethod === 'air' ? 'Aérien' : 'Terrestre'
                  }</p>
                  {downPaymentData.amount > 0 && (
                    <p>• Acompte de {formatNumberWithSpaces(downPaymentData.percentage)}% requis à la commande</p>
                  )}
                  {formData.notes && <p>• {formData.notes}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/quotes')}
              className="btn-secondary"
            >
              Annuler
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={generateQuotePreview}
              className="btn-secondary flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Aperçu</span>
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Créer le devis</span>
            </button>
          </div>
        </div>
      </form>

      {/* Résumé flottant */}
      <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-strong border border-gray-200 p-4 max-w-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Résumé du Devis</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Articles:</span>
            <span className="font-medium">{formatNumberWithSpaces(items.length)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Quantité totale:</span>
            <span className="font-medium">{formatNumberWithSpaces(items.reduce((sum, item) => sum + item.quantity, 0))}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-gray-900 font-semibold">Total:</span>
            <span className="font-bold text-green-600">
              {formatNumberWithSpaces(Math.round(calculateTotal()))} Ar
            </span>
          </div>
          {downPaymentData.amount > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Acompte:</span>
              <span>{formatNumberWithSpaces(downPaymentData.amount)} Ar</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewQuote;