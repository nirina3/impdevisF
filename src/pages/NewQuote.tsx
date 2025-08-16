import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotes } from '../hooks/useQuotes';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Quote, QuoteItem } from '../types';
import { formatNumberWithSpaces, parseFormattedNumber, formatAriary } from '../utils/formatters';

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
    notes: '',
    downPaymentPercentage: 0,
    downPaymentAmount: 0
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
          updatedItem.unitPrice = updatedItem.sellingPrice; // Synchroniser avec le prix unitaire
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
      if (item.unitPrice <= 0) newErrors[`item_${index}_unitPrice`] = 'Le prix unitaire doit être positif';
    });

    if (downPaymentData.percentage > 100) newErrors.downPaymentPercentage = 'Le pourcentage ne peut pas dépasser 100%';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.sellingPrice), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const quoteNumber = `QT-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
    const totalAmount = calculateTotal();
    const remainingAmount = totalAmount - downPaymentData.amount;
    
    let paymentStatus: Quote['paymentStatus'] = 'unpaid';
    if (downPaymentData.amount === totalAmount) paymentStatus = 'paid';
    else if (downPaymentData.amount > 0) paymentStatus = 'partial';

    const newQuote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'> = {
      quoteNumber,
      ...formData,
      status: 'draft',
      validUntil: new Date(formData.validUntil),
      estimatedDelivery: new Date(formData.estimatedDelivery),
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
          <h1 className="text-2xl font-bold text-gray-900">Nouveau Devis</h1>
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
              <input
                type="text"
                value={formData.clientAddress}
                onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                className={`input-field ${errors.clientAddress ? 'border-red-500' : ''}`}
                placeholder="Adresse complète"
              />
              {errors.clientAddress && <p className="text-red-500 text-xs mt-1">{errors.clientAddress}</p>}
            </div>
          </div>
        </div>

        {/* Informations Expédition */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations Expédition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays d'origine *
              </label>
              <input
                type="text"
                value={formData.originCountry}
                onChange={(e) => handleInputChange('originCountry', e.target.value)}
                className={`input-field ${errors.originCountry ? 'border-red-500' : ''}`}
                placeholder="Chine, Allemagne, etc."
              />
              {errors.originCountry && <p className="text-red-500 text-xs mt-1">{errors.originCountry}</p>}
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
                Devise
              </label>
              <input
                type="text"
                value="MGA (Ariary)"
                disabled
                className="input-field bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valide jusqu'au *
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

        {/* Section Acompte */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acompte (Optionnel)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pourcentage (%)
              </label>
              <input
                type="text"
                value={formatNumberWithSpaces(downPaymentData.percentage)}
                onChange={(e) => handleDownPaymentChange('percentage', parseFormattedNumber(e.target.value))}
                className={`input-field ${errors.downPaymentPercentage ? 'border-red-500' : ''}`}
              />
              {errors.downPaymentPercentage && <p className="text-red-500 text-xs mt-1">{errors.downPaymentPercentage}</p>}
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
                <option value="Virement bancaire">Virement bancaire</option>
                <option value="Chèque">Chèque</option>
                <option value="Espèces">Espèces</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes acompte
              </label>
              <input
                type="text"
                value={downPaymentData.notes}
                onChange={(e) => handleDownPaymentChange('notes', e.target.value)}
                className="input-field"
                placeholder="Notes sur l'acompte..."
              />
            </div>

            {calculateTotal() > 0 && downPaymentData.amount > 0 && (
              <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total devis</p>
                    <p className="font-semibold text-gray-900">
                      {formatAriary(calculateTotal())}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Acompte ({downPaymentData.percentage}%)</p>
                    <p className="font-semibold text-blue-600">
                      {formatAriary(downPaymentData.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Solde restant</p>
                    <p className="font-semibold text-orange-600">
                      {formatAriary(calculateTotal() - downPaymentData.amount)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
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

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Article {index + 1}</h3>
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
                  <div className="md:col-span-2">
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
                      Quantité *
                    </label>
                    <input
                      type="text"
                      value={formatNumberWithSpaces(item.quantity)}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFormattedNumber(e.target.value))}
                      className={`input-field ${errors[`item_${index}_quantity`] ? 'border-red-500' : ''}`}
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lien produit (optionnel)
                    </label>
                    <input
                      type="url"
                      value={item.productLink}
                      onChange={(e) => handleItemChange(index, 'productLink', e.target.value)}
                      className="input-field"
                      placeholder="https://exemple.com/produit"
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
                      className="input-field"
                      placeholder="8517.12.00"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimensions (cm)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
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

                  {/* Section Calcul des coûts */}
                  <div className="md:col-span-3">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 border-t-2 border-primary-200 pt-6 flex items-center">
                      <span className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium mr-3">💰</span>
                      Calcul des coûts
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-sm">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix d'achat (Ar) *
                        </label>
                        <input
                          type="text"
                          value={formatNumberWithSpaces(item.purchasePrice)}
                          onChange={(e) => handleItemChange(index, 'purchasePrice', parseFormattedNumber(e.target.value))}
                          className="input-field border-blue-300 focus:border-blue-500 focus:ring-blue-500"
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
                          className="input-field border-blue-300 focus:border-blue-500 focus:ring-blue-500"
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
                          className="input-field border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix de vente (Ar) ✨
                        </label>
                        <div className="input-field bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 text-green-800 font-bold text-lg shadow-inner">
                          {formatNumberWithSpaces(item.sellingPrice)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          🔄 Calculé automatiquement
                        </p>
                      </div>
                      
                      {/* Résumé du calcul */}
                      <div className="md:col-span-4 mt-4 p-4 bg-white border border-blue-300 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Détail du calcul:</span>
                          <span className="font-mono text-gray-800">
                            {formatNumberWithSpaces(item.purchasePrice)} + {formatNumberWithSpaces(item.miscFees)} + {formatNumberWithSpaces(item.customsFees)} = <strong className="text-green-600">{formatAriary(item.sellingPrice)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3 text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      Sous-total: {formatAriary(item.quantity * item.sellingPrice)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">
                Total: {formatAriary(calculateTotal())}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes (optionnel)</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="input-field"
            placeholder="Notes additionnelles, instructions spéciales, etc."
          />
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