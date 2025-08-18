import React, { useState, useMemo } from 'react';
import { useQuotes } from '../hooks/useQuotes';
import { 
  TrendingUp, 
  DollarSign, 
  Calculator, 
  Target,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  FileText
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import ProfitAnalysisChart from '../components/analytics/ProfitAnalysisChart';
import { 
  calculateProfitAnalysis, 
  calculatePerformanceMetrics, 
  filterQuotesByPeriod 
} from '../utils/profitCalculations';
import { formatAriary, formatNumberWithSpaces } from '../utils/formatters';

const Analytics: React.FC = () => {
  const { quotes, loading, error, refreshQuotes } = useQuotes();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  // Filtrer les devis selon la période sélectionnée
  const filteredQuotes = useMemo(() => {
    if (selectedMonth === 'all') {
      return quotes.filter(quote => new Date(quote.createdAt).getFullYear() === selectedYear);
    } else {
      return filterQuotesByPeriod(quotes, 'month', selectedYear, selectedMonth as number);
    }
  }, [quotes, selectedYear, selectedMonth]);

  // Calculer les analyses financières
  const profitAnalysis = useMemo(() => {
    return calculateProfitAnalysis(filteredQuotes);
  }, [filteredQuotes]);

  const performanceMetrics = useMemo(() => {
    return calculatePerformanceMetrics(filteredQuotes);
  }, [filteredQuotes]);

  // Calculer les tendances (comparaison avec la période précédente)
  const previousPeriodQuotes = useMemo(() => {
    if (selectedMonth === 'all') {
      return quotes.filter(quote => new Date(quote.createdAt).getFullYear() === selectedYear - 1);
    } else {
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      return filterQuotesByPeriod(quotes, 'month', prevYear, prevMonth);
    }
  }, [quotes, selectedYear, selectedMonth]);

  const previousAnalysis = useMemo(() => {
    return calculateProfitAnalysis(previousPeriodQuotes);
  }, [previousPeriodQuotes]);

  // Calculer les tendances en pourcentage
  const trends = useMemo(() => {
    const revenueTrend = previousAnalysis.totalRevenue > 0 
      ? ((profitAnalysis.totalRevenue - previousAnalysis.totalRevenue) / previousAnalysis.totalRevenue) * 100
      : 0;
    
    const profitTrend = previousAnalysis.netProfit > 0 
      ? ((profitAnalysis.netProfit - previousAnalysis.netProfit) / previousAnalysis.netProfit) * 100
      : 0;

    const quotesTrend = previousAnalysis.quotesAnalyzed > 0 
      ? ((profitAnalysis.quotesAnalyzed - previousAnalysis.quotesAnalyzed) / previousAnalysis.quotesAnalyzed) * 100
      : 0;

    return { revenueTrend, profitTrend, quotesTrend };
  }, [profitAnalysis, previousAnalysis]);

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

  const availableYears = [...new Set(quotes.map(quote => new Date(quote.createdAt).getFullYear()))].sort((a, b) => b - a);
  const availableYears = [...new Set(quotes
    .map(quote => {
      const date = new Date(quote.createdAt);
      return isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
    })
    .filter(year => !isNaN(year))
  )].sort((a, b) => b - a);
  
  // S'assurer qu'il y a au moins l'année courante
  if (availableYears.length === 0) {
    availableYears.push(new Date().getFullYear());
  }
  const months = [
    { value: 'all', label: 'Toute l\'année' },
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

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
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend > 0 ? 'bg-success-50 text-success-700' : 
            trend < 0 ? 'bg-error-50 text-error-700' : 
            'bg-neutral-50 text-neutral-700'
          }`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : 
             trend < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
            <span>{trend === 0 ? '0%' : `${trend > 0 ? '+' : ''}${Math.round(trend)}%`}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analyses Financières</h1>
            <p className="text-sm text-gray-500">
              Analyse des bénéfices et performance commerciale
            </p>
          </div>
        </div>
      </div>

      {/* Filtres de période */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mx-0 sm:mx-0">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Période d'analyse</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Année
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input-field"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mois
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="input-field"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            Période sélectionnée: {selectedMonth === 'all' ? `Année ${selectedYear}` : `${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
            • {formatNumberWithSpaces(filteredQuotes.length)} devis analysés
          </p>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={DollarSign}
          title="Chiffre d'Affaires"
          value={formatAriary(profitAnalysis.totalRevenue)}
          subtitle={`${formatNumberWithSpaces(profitAnalysis.quotesAnalyzed)} devis`}
          trend={trends.revenueTrend}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        
        <StatCard
          icon={Calculator}
          title="Coût Total"
          value={formatAriary(profitAnalysis.totalCost)}
          subtitle={`${Math.round(profitAnalysis.costRatio)}% du CA`}
          color="text-orange-600"
          bgColor="bg-orange-50"
        />
        
        <StatCard
          icon={TrendingUp}
          title="Bénéfice Net"
          value={formatAriary(profitAnalysis.netProfit)}
          subtitle={`Marge: ${Math.round(profitAnalysis.profitMargin)}%`}
          trend={trends.profitTrend}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        
        <StatCard
          icon={Target}
          title="ROI"
          value={`${Math.round(performanceMetrics.returnOnInvestment)}%`}
          subtitle="Retour sur investissement"
          color="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Analyse détaillée */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique de répartition */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
          <div className="flex items-center space-x-3 mb-6">
            <PieChart className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Répartition Coûts/Bénéfices</h2>
          </div>
          
          <ProfitAnalysisChart 
            totalCost={profitAnalysis.totalCost}
            netProfit={profitAnalysis.netProfit}
          />
        </div>

        {/* Métriques de performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Indicateurs de Performance</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Valeur moyenne par devis</span>
              <span className="font-bold text-blue-600">
                {formatAriary(performanceMetrics.averageQuoteValue)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Coût moyen par devis</span>
              <span className="font-bold text-orange-600">
                {formatAriary(performanceMetrics.averageCostPerQuote)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Bénéfice moyen par devis</span>
              <span className="font-bold text-green-600">
                {formatAriary(performanceMetrics.averageProfitPerQuote)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Retour sur investissement</span>
              <span className="font-bold text-purple-600">
                {Math.round(performanceMetrics.returnOnInvestment)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analyse par statut */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Analyse par Statut de Devis</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { status: 'pending', label: 'En Attente', color: 'amber' },
            { status: 'confirmed', label: 'Confirmés', color: 'emerald' },
            { status: 'delivered', label: 'Livrés', color: 'blue' },
            { status: 'cancelled', label: 'Annulés', color: 'red' }
          ].map(({ status, label, color }) => {
            const statusQuotes = filteredQuotes.filter(q => q.status === status);
            const statusValue = statusQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
            const statusCount = statusQuotes.length;
            
            return (
              <div key={status} className={`p-4 bg-${color}-50 rounded-lg border border-${color}-200`}>
                <div className="text-center">
                  <p className={`text-sm font-medium text-${color}-700`}>{label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {formatNumberWithSpaces(statusCount)}
                  </p>
                  <p className={`text-xs text-${color}-600 mt-1`}>
                    {formatAriary(statusValue)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analyse par mode de paiement */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Analyse des Paiements</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { status: 'unpaid', label: 'Non Payés', color: 'red' },
            { status: 'partial', label: 'Acomptes Versés', color: 'orange' },
            { status: 'paid', label: 'Soldés', color: 'green' }
          ].map(({ status, label, color }) => {
            const paymentQuotes = filteredQuotes.filter(q => q.paymentStatus === status);
            const paymentValue = paymentQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
            const paymentCount = paymentQuotes.length;
            const remainingAmount = paymentQuotes.reduce((sum, q) => sum + q.remainingAmount, 0);
            
            return (
              <div key={status} className={`p-4 bg-${color}-50 rounded-lg border border-${color}-200`}>
                <div className="text-center">
                  <p className={`text-sm font-medium text-${color}-700`}>{label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {formatNumberWithSpaces(paymentCount)}
                  </p>
                  <p className={`text-xs text-${color}-600 mt-1`}>
                    Valeur: {formatAriary(paymentValue)}
                  </p>
                  {status !== 'paid' && remainingAmount > 0 && (
                    <p className={`text-xs text-${color}-700 mt-1 font-medium`}>
                      Reste: {formatAriary(remainingAmount)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Résumé de la formule de calcul */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6 mx-0 sm:mx-0">
        <div className="flex items-center space-x-3 mb-4">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Méthode de Calcul</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Formule du Bénéfice Net</h3>
            <div className="font-mono text-sm text-gray-700 space-y-2 bg-white p-4 rounded-lg border border-blue-200">
              <div>Chiffre d'Affaires = Σ(Prix de vente total par devis)</div>
              <div>Coût Total = Σ(Prix d'achat + Transport + Frais divers + Douane)</div>
              <div className="border-t border-gray-200 pt-2 font-bold text-blue-600">
                Bénéfice Net = Chiffre d'Affaires - Coût Total
              </div>
              <div>Marge Bénéficiaire = (Bénéfice Net / CA) × 100</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-3">Détail des Calculs</h3>
            <div className="text-sm text-gray-700 space-y-2 bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between">
                <span>Articles analysés:</span>
                <span className="font-medium">
                  {formatNumberWithSpaces(filteredQuotes.reduce((sum, q) => sum + q.items.length, 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Devis analysés:</span>
                <span className="font-medium">{formatNumberWithSpaces(profitAnalysis.quotesAnalyzed)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taux de conversion coût:</span>
                <span className="font-medium">{Math.round(profitAnalysis.costRatio)}%</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span>Efficacité financière:</span>
                <span className={`font-bold ${profitAnalysis.profitMargin > 20 ? 'text-green-600' : 
                  profitAnalysis.profitMargin > 10 ? 'text-orange-600' : 'text-red-600'}`}>
                  {profitAnalysis.profitMargin > 20 ? 'Excellente' : 
                   profitAnalysis.profitMargin > 10 ? 'Bonne' : 'À améliorer'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message si pas de données */}
      {filteredQuotes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 mx-0 sm:mx-0">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée pour cette période</h3>
          <p className="text-gray-500">
            Sélectionnez une autre période ou créez des devis pour voir les analyses.
          </p>
        </div>
      )}
    </div>
  );
};

export default Analytics;