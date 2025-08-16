import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotes } from '../hooks/useQuotes';
import { Plus, Trash2, Save, ArrowLeft, Calculator } from 'lucide-react';
import { Quote, QuoteItem } from '../types';
import { formatNumberWithSpaces, parseFormattedNumber } from '../utils/formatters';

const NewQuote: React.FC = () => {
  const navigate = useNavigate();
  const { addQuote } = useQuotes();
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    originCountry: '',
    destinationPort: '',
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
      productLink: ''
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

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
          
          updatedItem.sellingPrice = purchasePrice + miscFees + customsFees;
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
      productLink: ''
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
        ...item,
        id: `item_${index}_${Date.now()}`
      }))
    };

    addQuote(newQuote);
    navigate('/quotes');
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
          <h1 className="text-2xl font-bold text-gray-900">Nouveau Devis d'Importation</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations Client */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations Client</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Informations d'Expédition */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations d'Expédition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays d'origine *
              </label>
              <select
                value={formData.originCountry}
                onChange={(e) => handleInputChange('originCountry', e.target.value)}
                className={`input-field ${errors.originCountry ? 'border-red-500' : ''}`}
              >
                <option value="">Sélectionner un pays</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {errors.originCountry && <p className="text-red-500 text-xs mt-1">{errors.originCountry}</p>}
            </div>

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
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un article</span>
            </button>
          </div>

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Article {index + 1}</h3>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-3">
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
                      Code HS
                    </label>
                    <input
                      type="text"
                      value={item.hsCode || ''}
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
                      value={item.productLink || ''}
                      onChange={(e) => handleItemChange(index, 'productLink', e.target.value)}
                      className="input-field"
                      placeholder="https://..."
                    />
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

                  <div className="lg:col-span-3">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Calcul automatique</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Prix de vente unitaire:</span>
                          <p className="font-semibold text-blue-900">
                            {formatNumberWithSpaces(item.sellingPrice)} Ar
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-700">Total pour {formatNumberWithSpaces(item.quantity)} unité(s):</span>
                          <p className="font-semibold text-blue-900">
                            {formatNumberWithSpaces(item.quantity * item.sellingPrice)} Ar
                          </p>
                        </div>
                        <div>
                          <span className="text-blue-700">Marge:</span>
                          <p className="font-semibold text-green-600">
                            {formatNumberWithSpaces(item.sellingPrice - item.purchasePrice - item.miscFees - item.customsFees)} Ar
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acompte */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acompte (Optionnel)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pourcentage (%)
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
                Montant (Ar)
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
                Notes sur l'acompte
              </label>
              <textarea
                value={downPaymentData.notes}
                onChange={(e) => handleDownPaymentChange('notes', e.target.value)}
                rows={2}
                className="input-field"
                placeholder="Notes concernant l'acompte..."
              />
            </div>
          </div>
        </div>

        {/* Notes générales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes Générales</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="input-field"
            placeholder="Notes et commentaires sur le devis..."
          />
        </div>

        {/* Résumé */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Résumé du Devis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Nombre d'articles</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumberWithSpaces(items.length)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Quantité totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumberWithSpaces(items.reduce((sum, item) => sum + item.quantity, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Montant total</p>
              <p className="text-3xl font-bold text-green-600">
                {formatNumberWithSpaces(calculateTotal())} Ar
              </p>
            </div>
          </div>

          {downPaymentData.amount > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Acompte ({formatNumberWithSpaces(downPaymentData.percentage)}%)</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatNumberWithSpaces(downPaymentData.amount)} Ar
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Solde restant</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatNumberWithSpaces(calculateTotal() - downPaymentData.amount)} Ar
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/quotes')}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
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