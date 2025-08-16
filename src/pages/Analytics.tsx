import React from 'react';
import { useQuotes } from '../hooks/useQuotes';
import { useClients } from '../hooks/useClients';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Package,
  Globe,
  Truck
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { formatNumberWithSpaces, formatAriary } from '../utils/formatters';

const Analytics: React.FC = () => {
  const { quotes, loading: quotesLoading, error: quotesError, refreshQuotes } = useQuotes();
  const { clients, loading: clientsLoading, error: clientsError, refreshClients } = useClients();

  if ((quotesLoading || clientsLoading) && quotes.length === 0 && clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Afficher les erreurs s'il y en a
  if (quotesError || clientsError) {
    return (
      <div className="space-y-4">
        {quotesError && (
          <ErrorMessage message={quotesError} onRetry={refreshQuotes} />
        )}
        {clientsError && (
          <ErrorMessage message={clientsError} onRetry={refreshClients} />
        )}
      </div>
    );
  }

  // Calculs des statistiques
  const totalValue = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);
  const averageQuoteValue = quotes.length > 0 ? totalValue / quotes.length : 0;
  
  // Statistiques par statut
  const statusStats = quotes.reduce((acc, quote) => {
    acc[quote.status] = (acc[quote.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Statistiques par mode d'expédition
  const shippingStats = quotes.reduce((acc, quote) => {
    acc[quote.shippingMethod] = (acc[quote.shippingMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Statistiques par pays d'origine
  const countryStats = quotes.reduce((acc, quote) => {
    acc[quote.originCountry] = (acc[quote.originCountry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Évolution mensuelle (6 derniers mois)
  const last6Months = eachMonthOfInterval({
    start: startOfMonth(subMonths(new Date(), 5)),
    end: endOfMonth(new Date())
  });

  const monthlyData = last6Months.map(month => {
    const monthQuotes = quotes.filter(quote => {
      const quoteMonth = startOfMonth(quote.createdAt);
      return quoteMonth.getTime() === month.getTime();
    });

    return {
      month: format(month, 'MMM yyyy', { locale: fr }),
      quotes: monthQuotes.length,
      value: monthQuotes.reduce((sum, quote) => sum + quote.totalAmount, 0)
    };
  });

  // Top clients
  const clientStats = clients
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5);

  const getShippingMethodLabel = (method: string) => {
    switch (method) {
      case 'sea': return 'Maritime';
      case 'air': return 'Aérien';
      case 'land': return 'Terrestre';
      default: return method;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'pending': return 'En Attente';
      case 'confirmed': return 'Confirmé';
      case 'delivered': return 'Livré';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analyses</h1>
        <div className="text-sm text-gray-500">
          Données basées sur {quotes.length} devis
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Chiffre d'Affaires</h3>
              <p className="text-2xl font-bold text-gray-900">
                {totalValue.toLocaleString('fr-FR')} Ar
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Valeur Moyenne</h3>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(averageQuoteValue).toLocaleString('fr-FR')} Ar
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Articles</h3>
              <p className="text-2xl font-bold text-gray-900">
                {quotes.reduce((sum, quote) => sum + quote.items.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Taux de Conversion</h3>
              <p className="text-2xl font-bold text-gray-900">
                {quotes.length > 0 ? Math.round((statusStats.confirmed || 0) / quotes.length * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Évolution Mensuelle</h2>
          </div>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{data.month}</span>
                    <span className="text-sm text-gray-500">{data.quotes} devis</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${totalValue > 0 ? (data.value / totalValue) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatAriary(data.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <PieChart className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Répartition par Statut</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(statusStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    status === 'confirmed' ? 'bg-green-500' :
                    status === 'pending' ? 'bg-yellow-500' :
                    status === 'delivered' ? 'bg-blue-500' :
                    status === 'cancelled' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></div>
                  <span className="text-sm text-gray-900">{getStatusLabel(status)}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{formatNumberWithSpaces(count)}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({formatNumberWithSpaces(Math.round((count / quotes.length) * 100))}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modes d'expédition */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Truck className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Modes d'Expédition</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(shippingStats).map(([method, count]) => (
              <div key={method} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    method === 'sea' ? 'bg-blue-500' :
                    method === 'air' ? 'bg-sky-500' :
                    'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-gray-900">{getShippingMethodLabel(method)}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{formatNumberWithSpaces(count)}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({formatNumberWithSpaces(Math.round((count / quotes.length) * 100))}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pays d'origine */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Pays d'Origine</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(countryStats)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([country, count]) => (
              <div key={country} className="flex items-center justify-between">
                <span className="text-sm text-gray-900">{country}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{formatNumberWithSpaces(count)}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({formatNumberWithSpaces(Math.round((count / quotes.length) * 100))}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top clients */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Clients</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-500">Client</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Entreprise</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">Devis</th>
                <th className="text-right py-2 text-sm font-medium text-gray-500">Valeur Totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientStats.map((client) => (
                <tr key={client.id}>
                  <td className="py-3 text-sm text-gray-900">{client.name}</td>
                  <td className="py-3 text-sm text-gray-600">{client.company || '-'}</td>
                  <td className="py-3 text-sm text-gray-900 text-right">{formatNumberWithSpaces(client.totalQuotes)}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">
                    {formatAriary(client.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;