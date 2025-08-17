import React, { useState } from 'react';
import { useCostHistory } from '../hooks/useCostHistory';
import { useCostCalculation } from '../hooks/useCostCalculation';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Calculator, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  Copy,
  Search,
  Calendar,
  TrendingUp,
  Package,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Modal from '../components/ui/Modal';
import { formatNumberWithSpaces, formatAriary } from '../utils/formatters';

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
    getStatistics,
    searchCalculations,
    refreshCalculations
  } = useCostHistory();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [calculationToDelete, setCalculationToDelete] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  if (loading && calculations.length === 0) {
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

  const filteredCalculations = searchTerm ? searchCalculations(searchTerm) : calculations;
  const stats = getStatistics();

  const handleDelete = async () => {
    if (calculationToDelete) {
      try {
        await deleteCalculation(calculationToDelete);
        setCalculationToDelete(null);
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleDuplicate = async (calculation: any) => {
    try {
      await duplicateCalculation(calculation);
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
    }
  };

  const handleEdit = (calculation: any) => {
    // Naviguer vers le calcul des coûts avec les données à modifier
    navigate(`/cost-calculation?edit=${calculation.id}`);
  };

  const handleNameEdit = async (id: string) => {
    if (newName.trim()) {
      try {
        await updateCalculationName(id, newName.trim());
        setEditingName(null);
        setNewName('');
      } catch (error) {
        console.error('Erreur lors de la mise à jour du nom:', error);
      }
    }
  };

  const startNameEdit = (calculation: any) => {
    setEditingName(calculation.id);
    setNewName(calculation.name);
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
          className="btn-primary flex items-center space-x-2"
        >
          <Calculator className="w-4 h-4" />
          <span>Nouveau Calcul</span>
        </button>
      </div>

      {/* Statistiques */}
      {calculations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Calculs</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumberWithSpaces(stats.totalCalculations)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Valeur Totale</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAriary(stats.totalValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Valeur Moyenne</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatAriary(stats.averageValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Articles</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumberWithSpaces(stats.totalItems)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recherche */}
      {calculations.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mx-0 sm:mx-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher dans les calculs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
            />
          </div>
        </div>
      )}

      {/* Liste des calculs */}
      {calculations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 mx-0 sm:mx-0">
          <div className="p-6">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun calcul sauvegardé</h3>
            <p className="text-gray-500 mb-6">
              Commencez par créer votre premier calcul de coûts pour le voir apparaître ici.
            </p>
            <button
              onClick={() => navigate('/cost-calculation')}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Calculator className="w-4 h-4" />
              <span>Créer un calcul</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredCalculations.map((calculation) => (
            <div key={calculation.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mx-0 sm:mx-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {editingName === calculation.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1 text-lg font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1"
                        onBlur={() => handleNameEdit(calculation.id)}
                        onKeyPress={(e) => e.key === 'Enter' && handleNameEdit(calculation.id)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <h3 
                      className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary-600"
                      onClick={() => startNameEdit(calculation)}
                    >
                      {calculation.name}
                    </h3>
                  )}
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(calculation.createdAt, 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setSelectedCalculation(calculation)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(calculation)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="Modifier"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(calculation)}
                    className="text-purple-600 hover:text-purple-800 p-1"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportCalculation(calculation)}
                    className="text-orange-600 hover:text-orange-800 p-1"
                    title="Exporter"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setCalculationToDelete(calculation.id);
                      setShowDeleteModal(true);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Articles:</span>
                  <span className="font-medium text-gray-900">
                    {formatNumberWithSpaces(calculation.items.length)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Coût total:</span>
                  <span className="font-medium text-red-600">
                    {formatAriary(calculation.totalCost)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Marge:</span>
                  <span className="font-medium text-blue-600">
                    {formatAriary(calculation.totalMargin)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-900">Prix de vente:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatAriary(calculation.totalSellingPrice)}
                  </span>
                </div>
              </div>

              {/* Aperçu des articles */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Aperçu des articles:</p>
                <div className="space-y-1">
                  {calculation.items.slice(0, 2).map((item: any, index: number) => (
                    <div key={index} className="text-xs text-gray-600 truncate">
                      • {item.description} (×{formatNumberWithSpaces(item.quantity)})
                    </div>
                  ))}
                  {calculation.items.length > 2 && (
                    <div className="text-xs text-gray-500">
                      ... et {calculation.items.length - 2} autre{calculation.items.length - 2 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCalculations.length === 0 && searchTerm && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200 mx-0 sm:mx-0">
          <p className="text-gray-500">Aucun calcul trouvé pour "{searchTerm}"</p>
        </div>
      )}

      {/* Modal de détails */}
      <Modal
        isOpen={!!selectedCalculation}
        onClose={() => setSelectedCalculation(null)}
        title={`Détails du calcul: ${selectedCalculation?.name}`}
        size="xl"
      >
        {selectedCalculation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Coût Total</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatAriary(selectedCalculation.totalCost)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Marge</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatAriary(selectedCalculation.totalMargin)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Prix de Vente</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatAriary(selectedCalculation.totalSellingPrice)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Articles ({selectedCalculation.items.length})</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix d'achat</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix de vente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedCalculation.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatNumberWithSpaces(item.quantity)}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatNumberWithSpaces(item.purchasePrice)} {item.mainCurrency}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {formatAriary(item.sellingPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => handleEdit(selectedCalculation)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Modifier</span>
              </button>
              <button
                onClick={() => exportCalculation(selectedCalculation)}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exporter</span>
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

export default CostHistory;