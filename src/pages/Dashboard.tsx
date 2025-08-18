import React from 'react';
import { useQuotes } from '../hooks/useQuotes';
import { useClients } from '../hooks/useClients';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  Truck, 
  TrendingUp, 
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PaymentStatusBadge from '../components/ui/PaymentStatusBadge';
import ErrorMessage from '../components/ui/ErrorMessage';
import { formatNumberWithSpaces, formatAriary, safeFormatDate } from '../utils/formatters';

const Dashboard: React.FC = () => {
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

  const stats = {
    totalQuotes: quotes.length,
    pendingQuotes: quotes.filter(q => q.status === 'pending').length,
    confirmedQuotes: quotes.filter(q => q.status === 'confirmed').length,
    deliveredQuotes: quotes.filter(q => q.status === 'delivered').length,
    totalValue: quotes.reduce((sum, quote) => sum + quote.totalAmount, 0),
    totalClients: clients.length,
    unpaidQuotes: quotes.filter(q => q.paymentStatus === 'unpaid').length,
    partialPayments: quotes.filter(q => q.paymentStatus === 'partial').length,
    totalDownPayments: quotes.reduce((sum, quote) => sum + (quote.downPayment?.amount || 0), 0),
    totalRemaining: quotes.reduce((sum, quote) => sum + quote.remainingAmount, 0)
  };

  const recentQuotes = quotes.slice(0, 5);

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, color, bgColor }: any) => (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`stat-icon ${bgColor}`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
              {subtitle && (
                <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Dashboard</h1>
          <p className="text-neutral-500 mt-1 text-sm sm:text-base">
            Vue d'ensemble de votre activité • {safeFormatDate(new Date(), 'dd MMMM yyyy')}
          </p>
        </div>
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

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={FileText}
          title="Total Devis"
          value={formatNumberWithSpaces(stats.totalQuotes)}
          subtitle="Tous statuts confondus"
          trend={12}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Clock}
          title="En Attente"
          value={formatNumberWithSpaces(stats.pendingQuotes)}
          subtitle="Nécessitent une action"
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        <StatCard
          icon={CheckCircle}
          title="Confirmés"
          value={formatNumberWithSpaces(stats.confirmedQuotes)}
          subtitle="Prêts pour livraison"
          trend={8}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={Truck}
          title="Livrés"
          value={formatNumberWithSpaces(stats.deliveredQuotes)}
          subtitle="Missions accomplies"
          trend={15}
          color="text-violet-600"
          bgColor="bg-violet-50"
        />
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="card-elevated p-6 bg-gradient-to-br from-success-50 to-emerald-50 border-success-200">
          <div className="flex items-center space-x-4">
            <div className="stat-icon bg-success-100">
              <DollarSign className="w-7 h-7 text-success-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-success-700">Chiffre d'Affaires</h3>
              <p className="text-2xl sm:text-3xl font-bold text-success-900 mt-1">
                {formatNumberWithSpaces(Math.round(stats.totalValue / 1000000))} M Ar
              </p>
              <p className="text-xs text-success-600 mt-1">
                Moyenne: {formatNumberWithSpaces(stats.totalQuotes > 0 ? Math.round(stats.totalValue / stats.totalQuotes / 1000000) : 0)} M Ar
              </p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 sm:col-span-1 lg:col-span-1">
          <div className="flex items-center space-x-4">
            <div className="stat-icon bg-blue-100">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-700">Clients Actifs</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1">{formatNumberWithSpaces(stats.totalClients)}</p>
              <p className="text-xs text-blue-600 mt-1">
                {formatNumberWithSpaces(Math.round(stats.totalValue / stats.totalClients / 1000000))} M Ar par client
              </p>
            </div>
          </div>
        </div>

        <div className="card-elevated p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center space-x-4">
            <div className="stat-icon bg-amber-100">
              <Calendar className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-700">Soldes Restants</h3>
              <p className="text-2xl sm:text-3xl font-bold text-amber-900 mt-1">
                {formatNumberWithSpaces(Math.round(stats.totalRemaining / 1000000))} M Ar
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {formatNumberWithSpaces(stats.partialPayments)} paiements partiels
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Devis récents */}
      <div className="card-elevated mx-0 sm:mx-0">
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-200/50 bg-gradient-to-r from-neutral-50 to-neutral-100/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900">Devis Récents</h2>
            <Link
              to="/quotes"
              className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center space-x-1 transition-colors duration-200"
            >
              <span>Voir tout</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full hidden sm:table">
            <thead className="bg-neutral-50/50">
              <tr>
                <th className="table-header">Numéro</th>
                <th className="table-header">Client</th>
                <th className="table-header">Statut</th>
                <th className="table-header">Paiement</th>
                <th className="table-header">Montant</th>
                <th className="table-header">Date</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/50">
              {recentQuotes.map((quote, index) => (
                <tr key={quote.id} className="hover:bg-neutral-50/50 transition-colors duration-200 group" style={{ animationDelay: `${index * 100}ms` }}>
                  <td className="table-cell">
                    <span className="font-semibold text-primary-600">{quote.quoteNumber}</span>
                  </td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-neutral-900">{quote.clientName}</div>
                      <div className="text-xs text-neutral-500">{quote.clientEmail}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={quote.status} />
                  </td>
                  <td className="table-cell">
                    <PaymentStatusBadge status={quote.paymentStatus} />
                  </td>
                  <td className="table-cell">
                    <div className="font-semibold text-neutral-900">
                      {quote.totalAmount >= 1000000 
                        ? `${formatNumberWithSpaces(Math.round(quote.totalAmount / 1000000))} M Ar`
                        : formatAriary(quote.totalAmount)
                      }
                    </div>
                    {quote.remainingAmount > 0 && (
                      <div className="text-xs text-amber-600">
                        Reste: {quote.remainingAmount >= 1000000 
                          ? `${formatNumberWithSpaces(Math.round(quote.remainingAmount / 1000000))} M Ar`
                          : formatAriary(quote.remainingAmount)
                        }
                      </div>
                    )}
                  </td>
                  <td className="table-cell text-neutral-500">
                    {safeFormatDate(quote.createdAt, 'dd/MM/yyyy')}
                  </td>
                  <td className="table-cell text-right">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-neutral-200/50">
            {recentQuotes.map((quote, index) => (
              <div key={quote.id} className="p-4 hover:bg-neutral-50/50 transition-colors duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-semibold text-primary-600 text-sm">{quote.quoteNumber}</span>
                    <p className="text-sm font-medium text-neutral-900 mt-1">{quote.clientName}</p>
                    <p className="text-xs text-neutral-500">{quote.clientEmail}</p>
                  </div>
                  <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={quote.status} />
                    <PaymentStatusBadge status={quote.paymentStatus} />
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-neutral-900 text-sm">
                      {quote.totalAmount >= 1000000 
                        ? `${formatNumberWithSpaces(Math.round(quote.totalAmount / 1000000))} M Ar`
                        : formatAriary(quote.totalAmount)
                      }
                    </div>
                    {quote.remainingAmount > 0 && (
                      <div className="text-xs text-amber-600">
                        Reste: {quote.remainingAmount >= 1000000 
                          ? `${formatNumberWithSpaces(Math.round(quote.remainingAmount / 1000000))} M Ar`
                          : formatAriary(quote.remainingAmount)
                        }
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-neutral-500">
                  {safeFormatDate(quote.createdAt, 'dd/MM/yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;