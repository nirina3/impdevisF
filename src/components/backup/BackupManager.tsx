import React, { useState, useRef } from 'react';
import { useBackup } from '../../hooks/useBackup';
import { 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Save, 
  AlertTriangle,
  Calendar,
  Database,
  FileText,
  Users,
  Calculator,
  HardDrive,
  Clock,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import Modal from '../ui/Modal';
import { formatNumberWithSpaces, safeFormatDate } from '../../utils/formatters';

const BackupManager: React.FC = () => {
  const {
    backups,
    loading,
    error,
    operationLoading,
    createBackup,
    restoreBackup,
    deleteBackup,
    exportBackup,
    importBackup,
    getBackupStats,
    refreshBackups
  } = useBackup();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [backupName, setBackupName] = useState('');
  const [stats, setStats] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const backupStats = await getBackupStats();
        setStats(backupStats);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      }
    };

    if (backups.length > 0) {
      loadStats();
    }
  }, [backups, getBackupStats]);

  const handleCreateBackup = async () => {
    try {
      await createBackup(backupName.trim() || undefined);
      setShowCreateModal(false);
      setBackupName('');
      alert('Sauvegarde créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;
    
    try {
      await restoreBackup(selectedBackup);
      setShowRestoreModal(false);
      setSelectedBackup(null);
      alert('Restauration terminée avec succès ! La page va se recharger.');
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
    }
  };

  const handleDeleteBackup = async () => {
    if (!selectedBackup) return;
    
    try {
      await deleteBackup(selectedBackup);
      setShowDeleteModal(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importBackup(file);
      alert('Sauvegarde importée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage message={error} onRetry={refreshBackups} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions principales */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={operationLoading}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          {operationLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Créer une sauvegarde</span>
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={operationLoading}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Importer une sauvegarde</span>
        </button>
        
        <button
          onClick={refreshBackups}
          disabled={operationLoading}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Sauvegardes</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatNumberWithSpaces(stats.totalBackups)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Taille totale</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatFileSize(stats.totalSize)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Plus récente</p>
                <p className="text-sm font-bold text-gray-900">
                  {stats.newestBackup ? format(stats.newestBackup, 'dd/MM/yyyy', { locale: fr }) : 'Aucune'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Plus ancienne</p>
                <p className="text-sm font-bold text-gray-900">
                  {stats.oldestBackup ? format(stats.oldestBackup, 'dd/MM/yyyy', { locale: fr }) : 'Aucune'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des sauvegardes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Sauvegardes Disponibles</h3>
          <p className="text-sm text-gray-500 mt-1">
            {backups.length} sauvegarde{backups.length > 1 ? 's' : ''} disponible{backups.length > 1 ? 's' : ''}
          </p>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune sauvegarde</h3>
            <p className="text-gray-500 mb-6">
              Créez votre première sauvegarde pour protéger vos données.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2 mx-auto"
            >
              <Save className="w-4 h-4" />
              <span>Créer une sauvegarde</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {backups.map((backup) => (
              <div key={backup.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Database className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{backup.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {safeFormatDate(backup.createdAt, 'dd/MM/yyyy à HH:mm')}
                          </span>
                          <span className="flex items-center">
                            <HardDrive className="w-4 h-4 mr-1" />
                            {formatFileSize(backup.size)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {formatNumberWithSpaces(backup.quotesCount)}
                        </p>
                        <p className="text-xs text-gray-500">Devis</p>
                      </div>
                      
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {formatNumberWithSpaces(backup.clientsCount)}
                        </p>
                        <p className="text-xs text-gray-500">Clients</p>
                      </div>
                      
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Calculator className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {formatNumberWithSpaces(backup.calculationsCount)}
                        </p>
                        <p className="text-xs text-gray-500">Calculs</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedBackup(backup.id);
                        setShowRestoreModal(true);
                      }}
                      disabled={operationLoading}
                      className="btn-primary text-sm flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Restaurer</span>
                    </button>
                    
                    <button
                      onClick={() => exportBackup(backup.id)}
                      disabled={operationLoading}
                      className="btn-secondary text-sm flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exporter</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedBackup(backup.id);
                        setShowDeleteModal(true);
                      }}
                      disabled={operationLoading}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création de sauvegarde */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une nouvelle sauvegarde"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">Sauvegarde complète</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Cette sauvegarde inclura tous vos devis, clients et calculs de coûts.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de la sauvegarde (optionnel)
            </label>
            <input
              type="text"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              className="input-field"
              placeholder="Nom personnalisé pour cette sauvegarde"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si vide, un nom automatique sera généré avec la date et l'heure.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
              disabled={operationLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleCreateBackup}
              className="btn-primary flex items-center space-x-2"
              disabled={operationLoading}
            >
              {operationLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Créer la sauvegarde</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de restauration */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Confirmer la restauration"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Action irréversible</h3>
                <p className="text-sm text-red-700 mt-1">
                  Cette action supprimera toutes vos données actuelles et les remplacera par celles de la sauvegarde.
                </p>
              </div>
            </div>
          </div>

          {selectedBackup && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Sauvegarde sélectionnée :</h4>
              {(() => {
                const backup = backups.find(b => b.id === selectedBackup);
                return backup ? (
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Nom :</strong> {backup.name}</p>
                    <p><strong>Date :</strong> {safeFormatDate(backup.createdAt, 'dd/MM/yyyy à HH:mm')}</p>
                    <p><strong>Contenu :</strong> {backup.quotesCount} devis, {backup.clientsCount} clients, {backup.calculationsCount} calculs</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          <p className="text-sm text-gray-600">
            Êtes-vous absolument certain de vouloir restaurer cette sauvegarde ?
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowRestoreModal(false)}
              className="btn-secondary"
              disabled={operationLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleRestoreBackup}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              disabled={operationLoading}
            >
              {operationLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>Confirmer la restauration</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de suppression */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer cette sauvegarde ? Cette action est irréversible.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn-secondary"
              disabled={operationLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteBackup}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              disabled={operationLoading}
            >
              {operationLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BackupManager;