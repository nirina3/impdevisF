import { useState, useEffect } from 'react';
import { UserSettings, userSettingsService } from '../services/userSettings';

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const userSettings = await userSettingsService.getUserSettings();
        setSettings(userSettings);
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres:', err);
        setError('Erreur lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      setError(null);
      await userSettingsService.updateUserSettings(newSettings);
      
      // Mettre à jour l'état local
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      setError('Erreur lors de la mise à jour des paramètres');
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings
  };
};