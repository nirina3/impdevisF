import React, { useState } from 'react';
import { useQuotes } from '../hooks/useQuotes';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import ErrorMessage from '../components/ui/ErrorMessage';
import PaymentStatusBadge from '../components/ui/PaymentStatusBadge';
import { Quote } from '../types';
import { formatAriary, formatNumberWithSpaces } from '../utils/formatters';
import { generateQuotePDF } from '../utils/pdf';

const QuotesList: React.FC = () => {
  const navigate = useNavigate();
  const { quotes, loading, error, deleteQuote, refreshQuotes } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

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

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteQuote = () => {
    if (quoteToDelete) {
      deleteQuote(quoteToDelete);
      setQuoteToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const exportQuote = (quote: Quote) => {
    generateQuotePDF(quote);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Liste des Devis</h1>
        <div className="hidden sm:block">
          <Link
            to="/quotes/new"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Devis</span>
          </Link>
        </div>
        <div className="sm:hidden">
          <Link
            to="/quotes/new"
            className="btn-primary p-3 rounded-xl"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par numéro ou client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm min-w-0"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="pending">En Attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="delivered">Livré</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des devis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop table view */}
        <div className="overflow-x-auto hidden lg:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paiement
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Solde Restant
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Date Création
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Livraison Estimée
                </th>
                <th className="px-4 xl:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {quote.quoteNumber}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{quote.clientName}</div>
                      <div className="text-xs text-gray-500 hidden xl:block">{quote.clientEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={quote.status} />
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <PaymentStatusBadge status={quote.paymentStatus} />
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatAriary(quote.totalAmount)}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">
                    <span className={quote.remainingAmount > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                      {formatAriary(quote.remainingAmount)}
                    </span>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                    {format(quote.createdAt, 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden xl:table-cell">
                    {format(quote.estimatedDelivery, 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => setSelectedQuote(quote)}
                        className="text-indigo-600 hover:text-indigo-900 p-1.5 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => exportQuote(quote)}
                        className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded-lg transition-all duration-200 hidden sm:block"
                        title="Exporter PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/quotes/edit/${quote.id}`)}
                        className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
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

        {/* Mobile/Tablet card view */}
        <div className="lg:hidden divide-y divide-gray-200">
          {filteredQuotes.map((quote) => (
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
                    onClick={() => setSelectedQuote(quote)}
                    className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/quotes/edit/${quote.id}`)}
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
                <span>Créé le {format(quote.createdAt, 'dd/MM/yyyy', { locale: fr })}</span>
                <span>Livraison: {format(quote.estimatedDelivery, 'dd/MM/yyyy', { locale: fr })}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredQuotes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun devis trouvé</p>
          </div>
        )}
      </div>

      {/* Modal de détails du devis */}
      <Modal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
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
                  <p><span className="font-medium">Mode:</span> {selectedQuote.shippingMethod}</p>
                  <p><span className="font-medium">Livraison estimée:</span> {format(selectedQuote.estimatedDelivery, 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Informations Paiement</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Statut:</span> <PaymentStatusBadge status={selectedQuote.paymentStatus} /></p>
                  <p><span className="font-medium">Total:</span> {selectedQuote.totalAmount.toLocaleString('fr-FR')} Ar</p>
                  {selectedQuote.downPayment && (
                    <p><span className="font-medium">Acompte:</span> {selectedQuote.downPayment.amount.toLocaleString('fr-FR')} Ar ({selectedQuote.downPayment.percentage}%)</p>
                  )}
                  <p><span className="font-medium">Solde restant:</span> 
                    <span className={selectedQuote.remainingAmount > 0 ? 'text-orange-600 font-medium ml-1' : 'text-green-600 ml-1'}>
                      {selectedQuote.remainingAmount.toLocaleString('fr-FR')} Ar
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Articles</h4>
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
              <div className="mt-4 text-right">
                <p className="text-lg font-semibold">
                  Total: {formatAriary(selectedQuote.totalAmount)}
                </p>
              </div>
            </div>

            {selectedQuote.notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{selectedQuote.notes}</p>
              </div>
            )}
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
              onClick={handleDeleteQuote}
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

export default QuotesList;