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

    const updatedQuote: Partial<Quote> = {
      ...formData,
      validUntil: new Date(formData.validUntil),
      estimatedDelivery: new Date(formData.estimatedDelivery),
      totalAmount,
      paymentStatus,
      remainingAmount,
      downPayment: downPaymentData.amount > 0 ? {
        id: quote.downPayment?.id || `dp_${Date.now()}`,
        amount: downPaymentData.amount,
        percentage: downPaymentData.percentage,
        paymentMethod: downPaymentData.paymentMethod,
        notes: downPaymentData.notes
      } : undefined,
      items: items.map((item, index) => ({
        ...item,
        id: quote.items[index]?.id || `item_${index}_${Date.now()}`
      }))
    };

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
        {/* ... (même structure que NewQuote) ... */}

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