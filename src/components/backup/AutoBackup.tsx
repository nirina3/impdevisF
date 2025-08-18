import React, { useState, useEffect } from 'react';
import { useBackup } from '../../hooks/useBackup';
import { Clock, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AutoBackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  maxBackups: number;
  lastAutoBackup: Date | null;
}

const AutoBackup: React.FC = () => {
  const { createBackup, backups, deleteBackup } = useBackup();
  const [settings, setSettings] = useState<AutoBackupSettings>({
    enabled: false,
    frequency: 'weekly',
    maxBackups: 5,
    lastAutoBackup: null
  });

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('autoBackupSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...parsed,
          lastAutoBackup: parsed.lastAutoBackup ? new Date(parsed.lastAutoBackup) : null
        });
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de sauvegarde automatique:', error);
      }
    }
  }, []);

  // Sauvegarder les paramètres dans localStorage
  const saveSettings = (newSettings: AutoBackupSettings) => {
    setSettings(newSettings);
    localStorage.setItem('autoBackupSettings', JSON.stringify(newSettings));
  };

  // Vérifier si une sauvegarde automatique est nécessaire
  const shouldCreateAutoBackup = (): boolean => {
    if (!settings.enabled || !settings.lastAutoBackup) return settings.enabled;

    const now = new Date();
    const lastBackup = settings.lastAutoBackup;
    const timeDiff = now.getTime() - lastBackup.getTime();

    switch (settings.frequency) {
      case 'daily':
        return timeDiff > 24 * 60 * 60 * 1000; // 24 heures
      case 'weekly':
        return timeDiff > 7 * 24 * 60 * 60 * 1000; // 7 jours
      case 'monthly':
        return timeDiff > 30 * 24 * 60 * 60 * 1000; // 30 jours
      default:
        return false;
    }
  };

  // Créer une sauvegarde automatique
  const createAutoBackup = async () => {
    try {
      const now = new Date();
      const backupName = `Sauvegarde automatique - ${format(now, 'dd/MM/yyyy HH:mm', { locale: fr })}`;
      
      await createBackup(backupName);
      
      // Mettre à jour la date de dernière sauvegarde
      const newSettings = {
        ...settings,
        lastAutoBackup: now
      };
      saveSettings(newSettings);

      // Nettoyer les anciennes sauvegardes automatiques si nécessaire
      await cleanupOldAutoBackups();
      
      console.log('Sauvegarde automatique créée avec succès');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde automatique:', error);
    }
  };

  // Nettoyer les anciennes sauvegardes automatiques
  const cleanupOldAutoBackups = async () => {
    try {
      const autoBackups = backups
        .filter(backup => backup.name.includes('Sauvegarde automatique'))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (autoBackups.length > settings.maxBackups) {
        const backupsToDelete = autoBackups.slice(settings.maxBackups);
        
        for (const backup of backupsToDelete) {
          await deleteBackup(backup.id);
        }
        
        console.log(`${backupsToDelete.length} anciennes sauvegardes automatiques supprimées`);
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des sauvegardes:', error);
    }
  };

  // Vérifier périodiquement si une sauvegarde est nécessaire
  useEffect(() => {
    const checkAutoBackup = () => {
      if (shouldCreateAutoBackup()) {
        createAutoBackup();
      }
    };

    // Vérifier immédiatement
    checkAutoBackup();

    // Vérifier toutes les heures
    const interval = setInterval(checkAutoBackup, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings]);

  const getNextBackupDate = (): Date | null => {
    if (!settings.enabled || !settings.lastAutoBackup) return null;

    const lastBackup = settings.lastAutoBackup;
    const nextBackup = new Date(lastBackup);

    switch (settings.frequency) {
      case 'daily':
        nextBackup.setDate(nextBackup.getDate() + 1);
        break;
      case 'weekly':
        nextBackup.setDate(nextBackup.getDate() + 7);
        break;
      case 'monthly':
        nextBackup.setMonth(nextBackup.getMonth() + 1);
        break;
    }

    return nextBackup;
  };

  const nextBackupDate = getNextBackupDate();
  const autoBackupsCount = backups.filter(backup => backup.name.includes('Sauvegarde automatique')).length;

  return (
    <div className="space-y-6">
      {/* Configuration de la sauvegarde automatique */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Sauvegarde Automatique</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Activer la sauvegarde automatique</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => saveSettings({ ...settings, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fréquence de sauvegarde
              </label>
              <select
                value={settings.frequency}
                onChange={(e) => saveSettings({ ...settings, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                disabled={!settings.enabled}
                className="input-field"
              >
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre maximum de sauvegardes automatiques
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxBackups}
                onChange={(e) => saveSettings({ ...settings, maxBackups: parseInt(e.target.value) || 5 })}
                disabled={!settings.enabled}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Les anciennes sauvegardes automatiques seront supprimées automatiquement.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">État de la sauvegarde automatique</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut :</span>
                  <div className="flex items-center space-x-2">
                    {settings.enabled ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Activé</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-400">Désactivé</span>
                      </>
                    )}
                  </div>
                </div>

                {settings.enabled && settings.lastAutoBackup && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dernière sauvegarde :</span>
                    <span className="text-sm font-medium text-gray-900">
                      {format(settings.lastAutoBackup, 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                )}

                {settings.enabled && nextBackupDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Prochaine sauvegarde :</span>
                    <span className="text-sm font-medium text-blue-600">
                      {format(nextBackupDate, 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sauvegardes automatiques :</span>
                  <span className="text-sm font-medium text-gray-900">
                    {autoBackupsCount} / {settings.maxBackups}
                  </span>
                </div>
              </div>
            </div>

            {settings.enabled && (
              <button
                onClick={createAutoBackup}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <Clock className="w-4 h-4" />
                <span>Créer une sauvegarde maintenant</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoBackup;