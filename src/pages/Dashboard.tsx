import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useQuotes } from '../hooks/useQuotes';
import { useClients } from '../hooks/useClients';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  ArrowRight,
  Calculator,
  BarChart3
} from 'lucide-react';
import { formatAriary, formatNumberWithSpaces, safeFormatDate } from '../utils/formatters';

const Dashboard: React.FC = () => {
  const [user, loading, error] = useAuthState(auth);
  const { quotes, loading: quotesLoading, error: quotesError, refreshQuotes } = useQuotes();
  const { clients, loading: clientsLoading, error: clientsError, refreshClients } = useClients();

  if (loading || quotesLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || quotesError || clientsError) {
    return (
      <ErrorMessage 
        message={error?.message || quotesError || clientsError || 'Erreur lors du chargement des données'} 
        onRetry={() => {
          refreshQuotes();
          refreshClients();
        }}
      />
    );
  }

  // Calculer les vraies statistiques
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
  const confirmedQuotes = quotes.filter(q => q.status === 'confirmed').length;
  const deliveredQuotes = quotes.filter(q => q.status === 'delivered').length;
  const totalClients = clients.length;
  
  // Calculer la valeur totale de tous les devis en Ariary
  const totalValue = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);
  
  // Calculer la valeur des devis confirmés/livrés
  const confirmedValue = quotes
    .filter(q => q.status === 'confirmed' || q.status === 'delivered')
    .reduce((sum, quote) => sum + quote.totalAmount, 0);

  // Devis récents (5 derniers)
  const recentQuotes = quotes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Calculer la croissance mensuelle (comparaison avec le mois précédent)
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const currentMonthQuotes = quotes.filter(q => {
    const quoteDate = new Date(q.createdAt);
    return quoteDate.getMonth() === currentMonth && quoteDate.getFullYear() === currentYear;
  });

  const lastMonthQuotes = quotes.filter(q => {
    const quoteDate = new Date(q.createdAt);
    return quoteDate.getMonth() === lastMonth && quoteDate.getFullYear() === lastMonthYear;
  });

  const monthlyGrowth = lastMonthQuotes.length > 0 
    ? ((currentMonthQuotes.length - lastMonthQuotes.length) / lastMonthQuotes.length) * 100
    : currentMonthQuotes.length > 0 ? 100 : 0;

  const stats = [
    {
      title: 'Devis Total',
      value: totalQuotes,
      icon: FileText,
      color: 'bg-blue-500',
      change: monthlyGrowth > 0 ? `+${Math.round(monthlyGrowth)}%` : `${Math.round(monthlyGrowth)}%`,
      isPositive: monthlyGrowth >= 0
    },
    {
      title: 'Clients Actifs',
      value: totalClients,
      icon: Users,
      color: 'bg-green-500',
      change: totalClients > 0 ? 'Actif' : 'Aucun',
      isPositive: totalClients > 0
    },
    {
      title: 'En Attente',
      value: pendingQuotes,
      icon: Clock,
      color: 'bg-yellow-500',
      change: pendingQuotes > 0 ? `${pendingQuotes} en cours` : 'Aucun',
      isPositive: pendingQuotes === 0
    },
    {
      title: 'Valeur Totale',
      value: formatAriary(totalValue),
      icon: DollarSign,
      color: 'bg-purple-500',
      change: confirmedValue > 0 ? `${Math.round((confirmedValue / totalValue) * 100)}% confirmé` : 'En attente',
      isPositive: confirmedValue > 0
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'delivered':
        return 'Livré';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      case 'draft':
        return 'Brouillon';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-0 xl-container mobile-scroll-fix touch-page-container page-content-mobile">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-600">
            Bienvenue, {user?.email || 'Utilisateur'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center text-xs sm:text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 tablet-grid-2 xl-spacing">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card mobile-card-stack">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {typeof stat.value === 'number' ? formatNumberWithSpaces(stat.value) : stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${stat.isPositive ? 'text-green-600' : 'text-orange-600'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mobile-form-stack tablet-grid-2">
          <Link
            to="/quotes/new"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200 group touch-friendly"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-gray-900 text-sm">Nouveau Devis</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/cost-calculation"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg hover:shadow-md transition-all duration-200 group touch-friendly"
          >
            <div className="flex items-center">
              <div className="p-2 bg-amber-100 rounded-lg mr-3">
                <Calculator className="w-5 h-5 text-amber-600" />
              </div>
              <span className="font-medium text-gray-900 text-sm">Calcul Coûts</span>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/clients"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg hover:shadow-md transition-all duration-200 group touch-friendly"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium text-gray-900 text-sm">Nouveau Client</span>
            </div>
            <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/analytics"
            className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg hover:shadow-md transition-all duration-200 group touch-friendly"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium text-gray-900 text-sm">Analyses</span>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mobile-form-stack">
        {/* Recent Quotes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-0 tablet-optimized mobile-card-stack">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Devis Récents
            </h3>
            <Link 
              to="/quotes" 
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Voir tout
            </Link>
          </div>
          <div className="p-4 sm:p-6">
            {recentQuotes.length > 0 ? (
              <div className="space-y-4">
                {recentQuotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 touch-friendly">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {quote.clientName}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {safeFormatDate(quote.createdAt, 'dd/MM/yyyy')}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">
                          {quote.quoteNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatAriary(quote.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getStatusText(quote.status)}
                        </p>
                      </div>
                      {getStatusIcon(quote.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucun devis récent</p>
                <Link
                  to="/quotes/new"
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer un devis</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Aperçu des paiements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-0 tablet-optimized mobile-card-stack">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              État des Paiements
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {[
                { 
                  status: 'paid', 
                  label: 'Soldés', 
                  count: quotes.filter(q => q.paymentStatus === 'paid').length,
                  value: quotes.filter(q => q.paymentStatus === 'paid').reduce((sum, q) => sum + q.totalAmount, 0),
                  color: 'text-green-600',
                  bgColor: 'bg-green-50'
                },
                { 
                  status: 'partial', 
                  label: 'Acomptes versés', 
                  count: quotes.filter(q => q.paymentStatus === 'partial').length,
                  value: quotes.filter(q => q.paymentStatus === 'partial').reduce((sum, q) => sum + (q.downPayment?.amount || 0), 0),
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-50'
                },
                { 
                  status: 'unpaid', 
                  label: 'Non payés', 
                  count: quotes.filter(q => q.paymentStatus === 'unpaid').length,
                  value: quotes.filter(q => q.paymentStatus === 'unpaid').reduce((sum, q) => sum + q.totalAmount, 0),
                  color: 'text-red-600',
                  bgColor: 'bg-red-50'
                }
              ].map((payment) => (
                <div key={payment.status} className={`flex items-center justify-between p-3 ${payment.bgColor} rounded-lg touch-friendly`}>
                  <div>
                    <p className={`text-sm font-medium ${payment.color}`}>{payment.label}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${payment.color}`}>
                      {formatAriary(Math.round(payment.value))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Aperçu des statuts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Aperçu des Statuts
          </h3>
          <Link 
            to="/quote-management" 
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Gérer les devis
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mobile-form-stack tablet-grid-2">
          {[
            { 
              status: 'draft', 
              label: 'Brouillons', 
              count: quotes.filter(q => q.status === 'draft').length,
              icon: FileText,
              color: 'text-gray-600',
              bgColor: 'bg-gray-50'
            },
            { 
              status: 'pending', 
              label: 'En Attente', 
              count: pendingQuotes,
              icon: Clock,
              color: 'text-yellow-600',
              bgColor: 'bg-yellow-50'
            },
            { 
              status: 'confirmed', 
              label: 'Confirmés', 
              count: confirmedQuotes,
              icon: CheckCircle,
              color: 'text-green-600',
              bgColor: 'bg-green-50'
            },
            { 
              status: 'delivered', 
              label: 'Livrés', 
              count: deliveredQuotes,
              icon: CheckCircle,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50'
            },
            { 
              status: 'cancelled', 
              label: 'Annulés', 
              count: quotes.filter(q => q.status === 'cancelled').length,
              icon: AlertCircle,
              color: 'text-red-600',
              bgColor: 'bg-red-50'
            }
          ].map((statusItem) => {
            const Icon = statusItem.icon;
            return (
              <div key={statusItem.status} className={`text-center p-4 ${statusItem.bgColor} rounded-lg border border-gray-200 mobile-card-stack`}>
                <Icon className={`w-8 h-8 ${statusItem.color} mx-auto mb-2`} />
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatNumberWithSpaces(statusItem.count)}
                </p>
                <p className={`text-sm ${statusItem.color} font-medium`}>{statusItem.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Résumé financier */}
      {totalValue > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 tablet-optimized mobile-card-stack">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6">Résumé Financier</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mobile-form-stack tablet-grid-2">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {formatAriary(Math.round(totalValue))}
              </p>
              <p className="text-sm text-blue-600 font-medium">Chiffre d'Affaires Total</p>
              <p className="text-xs text-gray-500 mt-1">{formatNumberWithSpaces(totalQuotes)} devis</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {formatAriary(Math.round(confirmedValue))}
              </p>
              <p className="text-sm text-green-600 font-medium">Valeur Confirmée</p>
              <p className="text-xs text-gray-500 mt-1">{formatNumberWithSpaces(confirmedQuotes + deliveredQuotes)} devis</p>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {formatAriary(Math.round(quotes.filter(q => q.paymentStatus === 'unpaid' || q.paymentStatus === 'partial').reduce((sum, q) => sum + q.remainingAmount, 0)))}
              </p>
              <p className="text-sm text-orange-600 font-medium">Montants en Attente</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatNumberWithSpaces(quotes.filter(q => q.remainingAmount > 0).length)} devis
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message si pas de données */}
      {totalQuotes === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 mx-0 mobile-spacing">
          <div className="p-6">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Commencez votre activité</h3>
            <p className="text-gray-500 mb-6">
              Créez votre premier devis pour voir apparaître les statistiques et analyses.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mobile-button-stack">
              <Link
                to="/cost-calculation"
                className="btn-secondary flex items-center space-x-2 touch-target"
              >
                <Calculator className="w-4 h-4" />
                <span>Calculer les coûts</span>
              </Link>
              <Link
                to="/quotes/new"
                className="btn-primary flex items-center space-x-2 touch-target"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un devis</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;