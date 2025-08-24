import React, { useState } from 'react';
import { useQuotes } from '../hooks/useQuotes';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  Trash2, 
  Download,
  Plus,
  Calendar,
  User,
  DollarSign,
  FileText,
  Settings as SettingsIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeFormatDate } from '../utils/formatters';
import StatusBadge from '../components/ui/StatusBadge';
import PaymentStatusBadge from '../components/ui/PaymentStatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Modal from '../components/ui/Modal';
import { Quote } from '../types';
import { formatAriary, formatNumberWithSpaces } from '../utils/formatters';
import { generateQuotePDF } from '../utils/pdf';
import { useUserSettings } from '../hooks/useUserSettings';

const QuoteManagement: React.FC = () => {
  const navigate = useNavigate();
  const { quotes, loading, error, deleteQuote, refreshQuotes } = useQuotes();
  const { settings: userSettings } = useUserSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  if (loading && quotes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage message={error} onRetry={refreshQuotes} />
    );
  }

  // Filtrage et tri des devis
  const filteredAndSortedQuotes = quotes
    .filter(quote => {
      const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quote.clientEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || quote.paymentStatus === paymentFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const now = new Date();
        const quoteDate = new Date(quote.createdAt);
        
        switch (dateFilter) {
          case 'today':
            matchesDate = quoteDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = quoteDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = quoteDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-desc':
          return b.totalAmount - a.totalAmount;
        case 'amount-asc':
          return a.totalAmount - b.totalAmount;
        case 'client-asc':
          return a.clientName.localeCompare(b.clientName);
        case 'client-desc':
          return b.clientName.localeCompare(a.clientName);
        case 'number-asc':
          return a.quoteNumber.localeCompare(b.quoteNumber);
        case 'number-desc':
          return b.quoteNumber.localeCompare(a.quoteNumber);
        default:
          return 0;
      }
    });

  const handleEdit = (quote: Quote) => {
    navigate(`/quotes/edit/${quote.id}`);
  };

  const handleDelete = () => {
    if (quoteToDelete) {
      deleteQuote(quoteToDelete);
      setQuoteToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetailsModal(true);
  };

  const exportQuote = (quote: Quote) => {
    generateQuotePDF(quote, userSettings || undefined);
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return quotes.length;
    return quotes.filter(q => q.status === status).length;
  };

  const getPaymentCount = (payment: string) => {
    if (payment === 'all') return quotes.length;
    return quotes.filter(q => q.paymentStatus === payment).length;
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Devis</h1>
            <p className="text-sm text-gray-500">
              {filteredAndSortedQuotes.length} devis sur {quotes.length} au total
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/quotes/new')}
            className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Devis</span>
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{formatNumberWithSpaces(quotes.length)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">En Attente</p>
              <p className="text-xl font-bold text-gray-900">{formatNumberWithSpaces(getStatusCount('pending'))}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Confirmés</p>
              <p className="text-xl font-bold text-gray-900">{formatNumberWithSpaces(getStatusCount('confirmed'))}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Valeur Totale</p>
              <p className="text-lg font-bold text-gray-900">
                {formatNumberWithSpaces(Math.round(quotes.reduce((sum, q) => sum + q.totalAmount, 0) / 1000000))} M Ar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 sm:mx-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="xl:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Numéro, client, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full text-sm"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 xl:col-span-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="all">Tous les statuts ({getStatusCount('all')})</option>
                <option value="draft">Brouillon ({getStatusCount('draft')})</option>
                <option value="pending">En Attente ({getStatusCount('pending')})</option>
                <option value="confirmed">Confirmé ({getStatusCount('confirmed')})</option>
                <option value="delivered">Livré ({getStatusCount('delivered')})</option>
                <option value="cancelled">Annulé ({getStatusCount('cancelled')})</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paiement</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="all">Tous les paiements ({getPaymentCount('all')})</option>
                <option value="unpaid">Non payé ({getPaymentCount('unpaid')})</option>
                <option value="partial">Acompte versé ({getPaymentCount('partial')})</option>
                <option value="paid">Soldé ({getPaymentCount('paid')})</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option value="date-desc">Date (plus récent)</option>
                <option value="date-asc">Date (plus ancien)</option>
                <option value="amount-desc">Montant (plus élevé)</option>
                <option value="amount-asc">Montant (plus faible)</option>
                <option value="client-asc">Client (A-Z)</option>
                <option value="client-desc">Client (Z-A)</option>
                <option value="number-asc">Numéro (croissant)</option>
                <option value="number-desc">Numéro (décroissant)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des devis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mx-0 sm:mx-0">
        {/* Vue desktop */}
        <div className="overflow-x-auto hidden lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livraison
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-primary-600">
                      {quote.quoteNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{quote.clientName}</div>
                      <div className="text-sm text-gray-500">{quote.clientEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={quote.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentStatusBadge status={quote.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatAriary(quote.totalAmount)}
                    </div>
                    {quote.remainingAmount > 0 && (
                      <div className="text-xs text-orange-600">
                        Reste: {formatAriary(quote.remainingAmount)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {safeFormatDate(quote.createdAt, 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {safeFormatDate(quote.estimatedDelivery, 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleViewDetails(quote)}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(quote)}
                        className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportQuote(quote)}
                        className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded-lg transition-all duration-200"
                        title="Exporter PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setQuoteToDelete(quote.id);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vue mobile/tablette */}
        <div className="lg:hidden divide-y divide-gray-200">
          {filteredAndSortedQuotes.map((quote) => (
            <div key={quote.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-primary-600 text-sm">{quote.quoteNumber}</span>
                    <StatusBadge status={quote.status} />
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{quote.clientName}</p>
                  <p className="text-xs text-gray-500 truncate">{quote.clientEmail}</p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => handleViewDetails(quote)}
                    className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(quote)}
                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <PaymentStatusBadge status={quote.paymentStatus} />
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm">
                    {formatAriary(quote.totalAmount)}
                  </div>
                  {quote.remainingAmount > 0 && (
                    <div className="text-xs text-orange-600">
                      Reste: {formatAriary(quote.remainingAmount)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Créé le {safeFormatDate(quote.createdAt, 'dd/MM/yyyy', { locale: fr })}</span>
                <span>Livraison: {safeFormatDate(quote.estimatedDelivery, 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedQuotes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun devis trouvé</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || dateFilter !== 'all'
                ? 'Aucun devis ne correspond à vos critères de recherche.'
                : 'Vous n\'avez pas encore créé de devis.'}
            </p>
            {(!searchTerm && statusFilter === 'all' && paymentFilter === 'all' && dateFilter === 'all') && (
              <button
                onClick={() => navigate('/quotes/new')}
                className="btn-primary flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Créer votre premier devis</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Détails du devis ${selectedQuote?.quoteNumber}`}
        size="xl"
      >
        {selectedQuote && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Informations Client</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Nom:</span> {selectedQuote.clientName}</p>
                  <p><span className="font-medium">Email:</span> {selectedQuote.clientEmail}</p>
                  <p><span className="font-medium">Téléphone:</span> {selectedQuote.clientPhone}</p>
                  <p><span className="font-medium">Adresse:</span> {selectedQuote.clientAddress}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Informations Livraison</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Origine:</span> {selectedQuote.originCountry}</p>
                  <p><span className="font-medium">Destination:</span> {selectedQuote.destinationPort}</p>
                  <p><span className="font-medium">Mode:</span> {
                    selectedQuote.shippingMethod === 'sea' ? 'Maritime' :
                    selectedQuote.shippingMethod === 'air' ? 'Aérien' : 'Terrestre'
                  }</p>
                  <p><span className="font-medium">Livraison estimée:</span> {format(selectedQuote.estimatedDelivery, 'dd/MM/yyyy', { locale: fr })}</p>
                  <p><span className="font-medium">Livraison estimée:</span> {safeFormatDate(selectedQuote.estimatedDelivery, 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Statuts</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Statut du devis:</span>
                    <StatusBadge status={selectedQuote.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Statut paiement:</span>
                    <PaymentStatusBadge status={selectedQuote.paymentStatus} />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Informations Financières</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Total:</span> {formatAriary(selectedQuote.totalAmount)}</p>
                  {selectedQuote.downPayment && (
                    <p><span className="font-medium">Acompte:</span> {formatAriary(selectedQuote.downPayment.amount)} ({selectedQuote.downPayment.percentage}%)</p>
                  )}
                  <p><span className="font-medium">Solde restant:</span> 
                    <span className={selectedQuote.remainingAmount > 0 ? 'text-orange-600 font-medium ml-1' : 'text-green-600 ml-1'}>
                      {formatAriary(selectedQuote.remainingAmount)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Articles ({selectedQuote.items.length})</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix Unitaire</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedQuote.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumberWithSpaces(item.quantity)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatAriary(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatAriary(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedQuote.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedQuote.notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => exportQuote(selectedQuote)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exporter PDF</span>
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleEdit(selectedQuote);
                }}
                className="btn-primary flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default QuoteManagement;