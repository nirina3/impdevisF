import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useQuotes } from '../hooks/useQuotes';
import { useClients } from '../hooks/useClients';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [user, loading, error] = useAuthState(auth);
  const { quotes, loading: quotesLoading } = useQuotes();
  const { clients, loading: clientsLoading } = useClients();

  if (loading || quotesLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-700">Erreur: {error.message}</span>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
  const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
  const totalClients = clients.length;
  
  const totalValue = quotes
    .filter(q => q.status === 'approved')
    .reduce((sum, quote) => sum + (quote.totalCost || 0), 0);

  const recentQuotes = quotes
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: 'Devis Total',
      value: totalQuotes,
      icon: FileText,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Clients Actifs',
      value: totalClients,
      icon: Users,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'En Attente',
      value: pendingQuotes,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '-5%'
    },
    {
      title: 'Valeur Totale',
      value: `${totalValue.toLocaleString('fr-FR')} €`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+15%'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approuvé';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Rejeté';
      default:
        return 'Inconnu';
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Tableau de Bord
          </h1>
          <p className="text-gray-600">
            Bienvenue, {user?.email || 'Utilisateur'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center text-sm text-gray-500">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card-elevated p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                vs mois dernier
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <div className="card-elevated">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Devis Récents
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {recentQuotes.length > 0 ? (
              <div className="space-y-4">
                {recentQuotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {quote.clientName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {quote.totalCost?.toLocaleString('fr-FR')} €
                      </span>
                      {getStatusIcon(quote.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun devis récent</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card-elevated">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Actions Rapides
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              <button className="w-full btn-primary text-left flex items-center justify-between p-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 mr-3" />
                  <span>Nouveau Devis</span>
                </div>
                <span className="text-sm opacity-75">Ctrl+N</span>
              </button>
              
              <button className="w-full btn-secondary text-left flex items-center justify-between p-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-3" />
                  <span>Ajouter Client</span>
                </div>
                <span className="text-sm opacity-75">Ctrl+U</span>
              </button>
              
              <button className="w-full btn-secondary text-left flex items-center justify-between p-4">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-3" />
                  <span>Voir Analytics</span>
                </div>
                <span className="text-sm opacity-75">Ctrl+A</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="card-elevated">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Aperçu des Statuts
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{approvedQuotes}</p>
              <p className="text-sm text-green-700">Approuvés</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{pendingQuotes}</p>
              <p className="text-sm text-yellow-700">En Attente</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">
                {quotes.filter(q => q.status === 'rejected').length}
              </p>
              <p className="text-sm text-red-700">Rejetés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;