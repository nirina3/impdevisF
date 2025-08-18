import React, { useState, useEffect } from 'react';
import { useBackup } from '../../hooks/useBackup';
import { Clock, Play, Pause, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { safeFormatDate } from '../../utils/formatters';

interface ScheduleSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // Format HH:MM
  maxBackups: number;
  lastScheduledBackup: Date | null;
}

const BackupScheduler: React.FC = () => {
  const { createBackup, backups, deleteBackup } = useBackup();
  const [settings, setSettings] = useState<ScheduleSettings>({
    enabled: false,
    frequency: 'weekly',
    time: '02:00',
    maxBackups: 10,
    lastScheduledBackup: null
  });

  const [nextBackupDate, setNextBackupDate] = useState<Date | null>(null);

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('backupScheduleSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...parsed,
          lastScheduledBackup: parsed.lastScheduledBackup ? new Date(parsed.lastScheduledBackup) : null
        });
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de planification:', error);
      }
    }
  }, []);

  // Calculer la prochaine date de sauvegarde
  useEffect(() => {
    if (!settings.enabled) {
      setNextBackupDate(null);
      return;
    }

    const calculateNextBackup = () => {
      const now = new Date();
      const [hours, minutes] = settings.time.split(':').map(Number);
      
      let nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);

      // Si l'heure est déjà passée aujourd'hui, commencer demain
      if (nextDate <= now) {
        nextDate = addDays(nextDate, 1);
      }

      // Ajuster selon la fréquence si on a déjà une dernière sauvegarde
      if (settings.lastScheduledBackup) {
        const lastBackup = new Date(settings.lastScheduledBackup);
        lastBackup.setHours(hours, minutes, 0, 0);

        switch (settings.frequency) {
          case 'daily':
            nextDate = addDays(lastBackup, 1);
            break;
          case 'weekly':
            nextDate = addWeeks(lastBackup, 1);
            break;
          case 'monthly':
            nextDate = addMonths(lastBackup, 1);
            break;
        }

        // Si la date calculée est dans le passé, utiliser la prochaine occurrence
        while (nextDate <= now) {
          switch (settings.frequency) {
            case 'daily':
              nextDate = addDays(nextDate, 1);
              break;
            case 'weekly':
              nextDate = addWeeks(nextDate, 1);
              break;
            case 'monthly':
              nextDate = addMonths(nextDate, 1);
              break;
          }
        }
      }

      return nextDate;
    };

    setNextBackupDate(calculateNextBackup());
  }, [settings]);

  // Sauvegarder les paramètres
  const saveSettings = (newSettings: ScheduleSettings) => {
    setSettings(newSettings);
    localStorage.setItem('backupScheduleSettings', JSON.stringify(newSettings));
  };

  // Vérifier et exécuter les sauvegardes planifiées
  useEffect(() => {
    const checkScheduledBackup = async () => {
      if (!settings.enabled || !nextBackupDate) return;

      const now = new Date();
      if (now >= nextBackupDate) {
        try {
          const backupName = `Sauvegarde planifiée - ${safeFormatDate(now, 'dd/MM/yyyy HH:mm')}`;
          await createBackup(backupName);
          
          // Mettre à jour la dernière sauvegarde
          const newSettings = {
            ...settings,
            lastScheduledBackup: now
          };
          saveSettings(newSettings);

          // Nettoyer les anciennes sauvegardes
          await cleanupOldScheduledBackups();
          
          console.log('Sauvegarde planifiée exécutée avec succès');
        } catch (error) {
          console.error('Erreur lors de la sauvegarde planifiée:', error);
        }
      }
    };

    // Vérifier toutes les minutes
    const interval = setInterval(checkScheduledBackup, 60 * 1000);
    
    // Vérifier immédiatement
    checkScheduledBackup();

    return () => clearInterval(interval);
  }, [settings, nextBackupDate, createBackup]);

  // Nettoyer les anciennes sauvegardes planifiées
  const cleanupOldScheduledBackups = async () => {
    try {
      const scheduledBackups = backups
        .filter(backup => backup.name.includes('Sauvegarde planifiée'))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (scheduledBackups.length > settings.maxBackups) {
        const backupsToDelete = scheduledBackups.slice(settings.maxBackups);
        
        for (const backup of backupsToDelete) {
          await deleteBackup(backup.id);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des sauvegardes planifiées:', error);
    }
  };

  const scheduledBackupsCount = backups.filter(backup => backup.name.includes('Sauvegarde planifiée')).length;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Planification des Sauvegardes</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Sauvegardes planifiées</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => saveSettings({ ...settings, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fréquence
            </label>
            <select
              value={settings.frequency}
              onChange={(e) => saveSettings({ ...settings, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
              disabled={!settings.enabled}
              className="input-field"
            >
              <option value="daily">Tous les jours</option>
              <option value="weekly">Toutes les semaines</option>
              <option value="monthly">Tous les mois</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Heure de sauvegarde
            </label>
            <input
              type="time"
              value={settings.time}
              onChange={(e) => saveSettings({ ...settings, time: e.target.value })}
              disabled={!settings.enabled}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre maximum de sauvegardes à conserver
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.maxBackups}
              onChange={(e) => saveSettings({ ...settings, maxBackups: parseInt(e.target.value) || 10 })}
              disabled={!settings.enabled}
              className="input-field"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Informations de planification</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Statut :</span>
              <div className="flex items-center space-x-2">
                {settings.enabled ? (
                  <>
                    <Play className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Actif</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-400">Inactif</span>
                  </>
                )}
              </div>
            </div>

            {settings.enabled && nextBackupDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Prochaine sauvegarde :</span>
                <span className="text-sm font-medium text-purple-600">
                  {safeFormatDate(nextBackupDate, 'dd/MM/yyyy à HH:mm')}
                </span>
              </div>
            )}

            {settings.lastScheduledBackup && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Dernière exécution :</span>
                <span className="text-sm font-medium text-gray-900">
                  {safeFormatDate(settings.lastScheduledBackup, 'dd/MM/yyyy à HH:mm')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sauvegardes planifiées :</span>
              <span className="text-sm font-medium text-gray-900">
                {scheduledBackupsCount}
              </span>
            </div>
          </div>

          {!settings.enabled && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  Les sauvegardes planifiées sont désactivées
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupScheduler;