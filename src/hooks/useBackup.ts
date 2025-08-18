import { useState, useEffect } from 'react';
import { backupService, BackupMetadata } from '../services/backup';

export const useBackup = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);

  // Charger les sauvegardes au démarrage
  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const backupsData = await backupService.listBackups();
      setBackups(backupsData);
    } catch (err) {
      console.error('Erreur lors du chargement des sauvegardes:', err);
      setError('Erreur lors du chargement des sauvegardes');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (name?: string) => {
    try {
      setOperationLoading(true);
      setError(null);
      const newBackup = await backupService.createBackup(name);
      setBackups(prev => [newBackup, ...prev]);
      return newBackup;
    } catch (err) {
      console.error('Erreur lors de la création de la sauvegarde:', err);
      setError('Erreur lors de la création de la sauvegarde');
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    try {
      setOperationLoading(true);
      setError(null);
      await backupService.restoreBackup(backupId);
    } catch (err) {
      console.error('Erreur lors de la restauration:', err);
      setError('Erreur lors de la restauration de la sauvegarde');
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    try {
      setOperationLoading(true);
      setError(null);
      await backupService.deleteBackup(backupId);
      setBackups(prev => prev.filter(backup => backup.id !== backupId));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression de la sauvegarde');
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

  const exportBackup = async (backupId: string) => {
    try {
      setOperationLoading(true);
      setError(null);
      await backupService.exportBackup(backupId);
    } catch (err) {
      console.error('Erreur lors de l\'export:', err);
      setError('Erreur lors de l\'export de la sauvegarde');
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

  const importBackup = async (file: File) => {
    try {
      setOperationLoading(true);
      setError(null);
      const newBackup = await backupService.importBackup(file);
      setBackups(prev => [newBackup, ...prev]);
      return newBackup;
    } catch (err) {
      console.error('Erreur lors de l\'import:', err);
      setError('Erreur lors de l\'import de la sauvegarde');
      throw err;
    } finally {
      setOperationLoading(false);
    }
  };

  const getBackupStats = async () => {
    try {
      return await backupService.getBackupStats();
    } catch (err) {
      console.error('Erreur lors du calcul des statistiques:', err);
      throw err;
    }
  };

  return {
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
    refreshBackups: loadBackups
  };
};