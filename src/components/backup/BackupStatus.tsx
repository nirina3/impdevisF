import React, { useState, useEffect } from 'react';
import { useBackup } from '../../hooks/useBackup';
import { Shield, Clock, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { safeFormatDate } from '../../utils/formatters';

const BackupStatus: React.FC = () => {
  const { backups, getBackupStats } = useBackup();
  const [stats, setStats] = useState<any>(null);
  const [lastBackup, setLastBackup] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const backupStats = await getBackupStats();
        setStats(backupStats);
        
        if (backups.length > 0) {
          setLastBackup(backups[0]); // Le plus récent
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de statut:', error);
      }
    };

    loadData();
  }, [backups, getBackupStats]);

  const getBackupHealthStatus = () => {
    if (!lastBackup) {
      return {
        status: 'warning',
        message: 'Aucune sauvegarde disponible',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: AlertTriangle
      };
    }

    const now = new Date();
    const daysSinceLastBackup = Math.floor((now.getTime() - lastBackup.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLastBackup <= 1) {
      return {
        status: 'excellent',
        message: 'Vos données sont bien protégées',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle
      };
    } else if (daysSinceLastBackup <= 7) {
      return {
        status: 'good',
        message: 'Sauvegarde récente disponible',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: Shield
      };
    } else {
      return {
        status: 'warning',
        message: 'Sauvegarde recommandée',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: AlertTriangle
      };
    }
  };

  const healthStatus = getBackupHealthStatus();
  const StatusIcon = healthStatus.icon;

  return (
    <div className={`${healthStatus.bgColor} ${healthStatus.borderColor} border rounded-lg p-4`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 ${healthStatus.bgColor} rounded-lg`}>
          <StatusIcon className={`w-5 h-5 ${healthStatus.color}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${healthStatus.color}`}>
            État de la Sauvegarde
          </h3>
          <p className="text-sm text-gray-700 mt-1">
            {healthStatus.message}
          </p>
          {lastBackup && (
            <p className="text-xs text-gray-500 mt-1">
              Dernière sauvegarde : {safeFormatDate(lastBackup.createdAt, 'dd/MM/yyyy à HH:mm')}
            </p>
          )}
        </div>
        {stats && (
          <div className="text-right">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Database className="w-4 h-4" />
              <span>{stats.totalBackups} sauvegarde{stats.totalBackups > 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupStatus;