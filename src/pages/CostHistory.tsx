import React, { useState } from 'react';
import { useEffect } from 'react';
import { useCostHistory } from '../hooks/useCostHistory';
import { 
  History, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Download,
  Plus,
  FileText,
  Calendar,
  DollarSign,
  Package,
  Copy,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Modal from '../components/ui/Modal';
import { formatNumberWithSpaces, formatAriary } from '../utils/formatters';
import { CostCalculationData } from '../hooks/useCostCalculation';

const CostHistory: React.FC = () => {
  const navigate = useNavigate();
  const { 
    calculations, 
    loading, 
    error,
    deleteCalculation, 
    duplicateCalculation, 
    updateCalculationName,
    exportCalculation,
    refreshCalculations
  } = useCostHistory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalculation, setSelectedCalculation] = useState<CostCalculationData | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [calculationToDelete, setCalculationToDelete] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  // Rafraîchir les calculs à chaque fois que le composant est monté
  useEffect(() => {
    refreshCalculations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage message={error} onRetry={refreshCalculations} />
    );
  }

  const filteredCalculations = calculations.filter(calc =>
    calc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.items.some(item => 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.originCountry.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleDeleteCalculation = () => {
    if (calculationToDelete) {
      deleteCalculation(calculationToDelete);
      setCalculationToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleEditName = (id: string, currentName: string) => {
    setEditingName(id);
    setNewName(currentName);
  };

  const handleSaveName = (id: string) => {
    if (newName.trim()) {
      updateCalculationName(id, newName.trim());
    }
    setEditingName(null);
    setNewName('');
  };

  const handleDuplicate = (calculation: CostCalculationData) => {
    duplicateCalculation(calculation);
  };

  const handleUseForQuote = (calculation: CostCalculationData) => {
    // Sauvegarder temporairement le calcul pour l'utiliser dans un nouveau devis
    localStorage.setItem('temp_cost_calculation', JSON.stringify(calculation));
    navigate('/quotes/new?from=cost-calculation');
  };

  const handleEditCalculation = (calculation: CostCalculationData) => {
    // Naviguer vers la page de calcul avec l'ID du calcul à modifier
    navigate(`/cost-calculation?edit=${calculation.id}`);
  };

  const getTotalItems = (calculation: CostCalculationData) => {
    return calculation.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getUniqueCountries = (calculation: CostCalculationData) => {
    const countries = [...new Set(calculation.items.map(item => item.originCountry))];
    return countries.slice(0, 2).join(', ') + (countries.length > 2 ? ` +${countries.length - 2}` : '');
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <History className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historique des Calculs</h1>
            <p className="text-sm text-gray-500">
              {calculations.length} calcul{calculations.length > 1 ? 's' : ''} sauvegardé{calculations.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/cost-calculation')}
          className="btn-primary flex items-center space-x-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau Calcul</span>
          <span className="sm:hidden">Nouveau</span>
        </button>
      </div>

      {/* Recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mx-0 sm:mx-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par nom, description d'article ou pays..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
        </div>
      </div>

      {/* Liste des calculs */}
      {filteredCalculations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center mx-0 sm:mx-0">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Aucun calcul trouvé' : 'Aucun calcul sauvegardé'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? 'Essayez de modifier votre recherche'
              : 'Commencez par créer votre premier calcul de coûts'
            }
          </p>
          <button
            onClick={() => navigate('/cost-calculation')}
            className="btn-primary flex items-center space-x-2 mx-auto text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un calcul</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredCalculations.map((calculation) => (
            <div key={calculation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow duration-200 mx-0 sm:mx-0">
              {/* En-tête avec nom et actions */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  {editingName === calculation.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 text-lg font-semibold border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveName(calculation.id)}
                        onBlur={() => handleSaveName(calculation.id)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <h3 
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors duration-200 truncate"
                      onClick={() => handleEditName(calculation.id, calculation.name)}
                      title="Cliquer pour modifier le nom"
                    >
                      {calculation.name}
                    </h3>
                  )}
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(calculation.calculatedAt, 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={() => setSelectedCalculation(calculation)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all duration-200"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditCalculation(calculation)}
                    className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-all duration-200"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(calculation)}
                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-all duration-200"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportCalculation(calculation)}
                    className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-all duration-200"
                    title="Exporter"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCalculationToDelete(calculation.id);
                      setShowDeleteModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <Package className="w-4 h-4 text-blue-600 mr-1" />
                  </div>
                  <p className="text-sm text-blue-600 font-medium">
                    {formatNumberWithSpaces(calculation.items.length)} article{calculation.items.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-blue-500">
                    {formatNumberWithSpaces(getTotalItems(calculation))} unité{getTotalItems(calculation) > 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-1">
                    <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                  </div>
                  <p className="text-sm text-green-600 font-medium">
                    {formatNumberWithSpaces(Math.round(calculation.totalSellingPrice / 1000000))} M Ar
                  </p>
                  <p className="text-xs text-green-500">Prix de vente</p>
                </div>
              </div>

              {/* Pays d'origine */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Pays d'origine :</p>
                <p className="text-sm text-gray-700 font-medium">{getUniqueCountries(calculation)}</p>
              </div>

              {/* Aperçu des articles */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Aperçu des articles :</p>
                <div className="space-y-1">
                  {calculation.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 truncate">
                      • {item.description || 'Article sans description'} ({formatNumberWithSpaces(item.quantity)})
                    </div>
                  ))}
                  {calculation.items.length > 2 && (
                    <div className="text-xs text-gray-500">
                      ... et {calculation.items.length - 2} autre{calculation.items.length - 2 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => handleUseForQuote(calculation)}
                  className="flex-1 btn-primary text-sm py-2 flex items-center justify-center space-x-1 w-full sm:w-auto"
                >
                  <FileText className="w-3 h-3" />
                  <span className="hidden sm:inline">Créer devis</span>
                  <span className="sm:hidden">Devis</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSelectedCalculation(calculation)}
                  className="btn-secondary text-sm py-2 px-3 w-full sm:w-auto flex items-center justify-center"
                >
                  <Eye className="w-3 h-3" />
                  <span className="ml-1 sm:hidden">Voir</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de détails */}
      <Modal
        isOpen={!!selectedCalculation}
        onClose={() => setSelectedCalculation(null)}
        title={`Détails du calcul : ${selectedCalculation?.name}`}
        size="xl"
      >
        {selectedCalculation && (
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <Package className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-600 font-medium">Articles</p>
                <p className="text-xl font-bold text-blue-900">{formatNumberWithSpaces(selectedCalculation.items.length)}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <DollarSign className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-orange-600 font-medium">Coût Total</p>
                <p className="text-xl font-bold text-orange-900">
                  {formatNumberWithSpaces(Math.round(selectedCalculation.totalCost / 1000000))} M Ar
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-600 font-medium">Prix de Vente</p>
                <p className="text-xl font-bold text-green-900">
                  {formatNumberWithSpaces(Math.round(selectedCalculation.totalSellingPrice / 1000000))} M Ar
                </p>
              </div>
            </div>

            {/* Taux de change utilisés */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Taux de change utilisés</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">USD → MGA</p>
                  <p className="font-semibold text-gray-900">{formatNumberWithSpaces(selectedCalculation.exchangeRates.USD)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">EUR → MGA</p>
                  <p className="font-semibold text-gray-900">{formatNumberWithSpaces(selectedCalculation.exchangeRates.EUR)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm text-gray-600">CNY → MGA</p>
                  <p className="font-semibold text-gray-900">{formatNumberWithSpaces(selectedCalculation.exchangeRates.CNY)}</p>
                </div>
              </div>
            </div>

            {/* Liste des articles */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Articles calculés</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pays</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qté</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Prix Achat</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Marge</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Prix Vente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedCalculation.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">
                          <div>
                            <p className="font-medium">{item.description || 'Article sans description'}</p>
                            {item.category && <p className="text-xs text-gray-500">{item.category}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{item.originCountry}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-center">{formatNumberWithSpaces(item.quantity)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          {formatNumberWithSpaces(item.purchasePrice)} {item.mainCurrency}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatNumberWithSpaces(item.margin || 0)}%</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                          {formatAriary(item.sellingPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => exportCalculation(selectedCalculation)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
              </button>
              <button
                onClick={() => handleUseForQuote(selectedCalculation)}
                className="btn-primary flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Créer un devis</span>
                <ArrowRight className="w-4 h-4" />
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
            Êtes-vous sûr de vouloir supprimer ce calcul ? Cette action est irréversible.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteCalculation}
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

export default CostHistory;