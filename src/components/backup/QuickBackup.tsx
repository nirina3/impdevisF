import React, { useState } from 'react';
import { useBackup } from '../../hooks/useBackup';
import { Save, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

const QuickBackup: React.FC = () => {
  const { createBackup, operationLoading } = useBackup();
  const [lastBackupStatus, setLastBackupStatus] = useState<'success' | 'error' | null>(null);

  const handleQuickBackup = async () => {
    try {
      setLastBackupStatus(null);
      await createBackup();
      setLastBackupStatus('success');
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => setLastBackupStatus(null), 3000);
    } catch (error) {
      setLastBackupStatus('error');
      setTimeout(() => setLastBackupStatus(null), 5000);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleQuickBackup}
        disabled={operationLoading}
        className="btn-secondary flex items-center space-x-2 text-sm"
      >
        {operationLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        <span>Sauvegarde rapide</span>
      </button>

      {lastBackupStatus === 'success' && (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Sauvegardé !</span>
        </div>
      )}

      {lastBackupStatus === 'error' && (
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Erreur</span>
        </div>
      )}
    </div>
  );
};

export default QuickBackup;