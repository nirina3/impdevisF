import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuotes } from '../hooks/useQuotes';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { Quote, QuoteItem } from '../types';

const EditQuote: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { quotes, updateQuote } = useQuotes();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  
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
    notes: '',
    status: 'draft' as Quote['status']
  });

  const [downPaymentData, setDownPaymentData] = useState({
    percentage: 0,
    amount: 0,
    paymentMethod: '',
    notes: ''
  });

  const [items, setItems] = useState<Omit<QuoteItem, 'id'>[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      const foundQuote = quotes.find(q => q.id === id);
      if (foundQuote) {
        setQuote(foundQuote);
        
        // Remplir le formulaire avec les données existantes
        setFormData({
          clientName: foundQuote.clientName,
          clientEmail: foundQuote.clientEmail,
          clientPhone: foundQuote.clientPhone,
          clientAddress: foundQuote.clientAddress,
          originCountry: foundQuote.originCountry,
          shippingMethod: foundQuote.shippingMethod,
          currency: foundQuote.currency,
          validUntil: foundQuote.validUntil.toISOString().split('T')[0],
          estimatedDelivery: foundQuote.estimatedDelivery.toISOString().split('T')[0],
          notes: foundQuote.notes || '',
          status: foundQuote.status
        });

        if (foundQuote.downPayment) {
          setDownPaymentData({
            percentage: foundQuote.downPayment.percentage,
            amount: foundQuote.downPayment.amount,
            paymentMethod: foundQuote.downPayment.paymentMethod || '',
            notes: foundQuote.downPayment.notes || ''
          });
        }

        setItems(foundQuote.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          purchasePrice: item.purchasePrice,
          miscFees: item.miscFees,
          customsFees: item.customsFees,
          sellingPrice: item.sellingPrice,
          weight: item.weight,
          dimensions: item.dimensions,
          hsCode: item.hsCode,
          category: item.category,
          productLink: item.productLink
        })));
      }
      setLoading(false);
    }
  }, [id, quotes]);

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
    
    if (!validateForm() || !quote) return;

    const totalAmount = calculateTotal();
    const remainingAmount = totalAmount - downPaymentData.amount;
    
    let paymentStatus: Quote['paymentStatus'] = 'unpaid';
    if (downPaymentData.amount === totalAmount) paymentStatus = 'paid';
    else if (downPaymentData.amount > 0) paymentStatus = 'partial';

    const baseUpdatedQuote: Partial<Quote> = {
      ...formData,
      validUntil: new Date(formData.validUntil),
      estimatedDelivery: new Date(formData.estimatedDelivery),
      totalAmount,
      paymentStatus,
      remainingAmount,
      items: items.map((item, index) => ({
        ...item,
        id: quote.items[index]?.id || `item_${index}_${Date.now()}`
      }))
    };

    // Only include downPayment if there's an actual down payment amount
    const updatedQuote = downPaymentData.amount > 0 ? {
      ...baseUpdatedQuote,
      downPayment: {
        id: quote.downPayment?.id || `dp_${Date.now()}`,
        amount: downPaymentData.amount,
        percentage: downPaymentData.percentage,
        paymentMethod: downPaymentData.paymentMethod,
        notes: downPaymentData.notes,
        paidDate: null
      }
    } : baseUpdatedQuote;

    updateQuote(quote.id, updatedQuote);
    navigate('/quotes');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Devis non trouvé</p>
        <button
          onClick={() => navigate('/quotes')}
          className="mt-4 btn-primary"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">
            Modifier le devis {quote.quoteNumber}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Statut du devis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statut du devis</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="input-field"
            >
              <option value="draft">Brouillon</option>
              <option value="pending">En Attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="delivered">Livré</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>

        {/* Le reste du formulaire est identique à NewQuote mais avec les données pré-remplies */}

        {/* Informations Client */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
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
                className={`input-field ${errors.clientAddress ? 'border-red-500' : ''}`}
                placeholder="Adresse complète"
              />
              {errors.clientAddress && <p className="text-red-500 text-xs mt-1">{errors.clientAddress}</p>}
            </div>
          </div>
        </div>

        {/* Informations Expédition */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations Expédition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pays d'origine *
              </label>
              <select
                value={formData.originCountry}
                onChange={(e) => handleInputChange('originCountry', e.target.value)}
                className={`input-field ${errors.originCountry ? 'border-red-500' : ''}`}
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
                className="input-field"
              >
                <option value="sea">Maritime</option>
                <option value="air">Aérien</option>
                <option value="land">Terrestre</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Articles</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary flex items-center space-x-2"
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
                      Quantité *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className={`input-field ${errors[`item_${index}_quantity`] ? 'border-red-500' : ''}`}
                      placeholder="1"
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix unitaire (Ar)
                    </label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix d'achat (Ar)
                    </label>
                    <input
                      type="number"
                      value={item.purchasePrice}
                      onChange={(e) => handleItemChange(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frais divers (Ar)
                    </label>
                    <input
                      type="number"
                      value={item.miscFees}
                      onChange={(e) => handleItemChange(index, 'miscFees', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frais de douane (Ar)
                    </label>
                    <input
                      type="number"
                      value={item.customsFees}
                      onChange={(e) => handleItemChange(index, 'customsFees', parseFloat(e.target.value) || 0)}
                      className="input-field"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0)}
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
                      value={item.hsCode}
                      onChange={(e) => handleItemChange(index, 'hsCode', e.target.value)}
                      className="input-field"
                      placeholder="Code douanier"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dimensions (L × l × H en cm)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={item.dimensions.length}
                        onChange={(e) => handleDimensionChange(index, 'length', parseFloat(e.target.value) || 0)}
                        className="input-field"
                        placeholder="Longueur"
                      />
                      <input
                        type="number"
                        value={item.dimensions.width}
                        onChange={(e) => handleDimensionChange(index, 'width', parseFloat(e.target.value) || 0)}
                        className="input-field"
                        placeholder="Largeur"
                      />
                      <input
                        type="number"
                        value={item.dimensions.height}
                        onChange={(e) => handleDimensionChange(index, 'height', parseFloat(e.target.value) || 0)}
                        className="input-field"
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
                      className="input-field"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dates et Validité */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dates et Validité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Acompte */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acompte (optionnel)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pourcentage d'acompte (%)
              </label>
              <input
                type="number"
                value={downPaymentData.percentage}
                onChange={(e) => handleDownPaymentChange('percentage', parseFloat(e.target.value) || 0)}
                className={`input-field ${errors.downPaymentPercentage ? 'border-red-500' : ''}`}
                placeholder="0"
              />
              {errors.downPaymentPercentage && <p className="text-red-500 text-xs mt-1">{errors.downPaymentPercentage}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant d'acompte (Ar)
              </label>
              <input
                type="number"
                value={downPaymentData.amount}
                onChange={(e) => handleDownPaymentChange('amount', parseFloat(e.target.value) || 0)}
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
                className="input-field"
                placeholder="Notes optionnelles"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes additionnelles</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="input-field"
            placeholder="Notes, conditions particulières, etc."
          />
        </div>

        {/* Aperçu du devis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aperçu du devis</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix unitaire
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.description || `Article ${index + 1}`}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.unitPrice.toLocaleString('fr-FR')} Ar
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {(item.quantity * item.unitPrice).toLocaleString('fr-FR')} Ar
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600">Sous-total:</span>
                <span className="text-sm font-medium text-gray-900">
                  {calculateTotal().toLocaleString('fr-FR')} Ar
                </span>
              </div>
              
              {downPaymentData.amount > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600">
                      Acompte ({downPaymentData.percentage}%):
                    </span>
                    <span className="text-sm font-medium text-orange-600">
                      -{downPaymentData.amount.toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Solde restant:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {(calculateTotal() - downPaymentData.amount).toLocaleString('fr-FR')} Ar
                    </span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between py-2 border-t border-gray-200">
                <span className="text-base font-semibold text-gray-900">Total:</span>
                <span className="text-base font-bold text-gray-900">
                  {calculateTotal().toLocaleString('fr-FR')} Ar
                </span>
              </div>
            </div>
          </div>
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
            <span>Sauvegarder les modifications</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditQuote;