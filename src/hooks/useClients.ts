import { useState, useEffect } from 'react';
import { Client } from '../types';
import { clientsService } from '../services/firestore';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useClients - Starting to load clients from Firebase...');
        const clientsData = await clientsService.getAll();
        console.log('useClients - Loaded clients:', clientsData.length);
        setClients(clientsData);
      } catch (err) {
        console.error('useClients - Error loading clients:', err);
        setError('Erreur lors du chargement des clients');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  const addClient = async (client: Omit<Client, 'id' | 'createdAt' | 'totalQuotes' | 'totalValue'>) => {
    try {
      console.log('useClients - Adding new client...');
      const newClient = await clientsService.add(client);
      setClients(prev => [newClient, ...prev]);
      return newClient;
    } catch (err) {
      console.error('useClients - Error adding client:', err);
      setError('Erreur lors de la création du client');
      throw err;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      console.log('useClients - Updating client:', id);
      await clientsService.update(id, updates);
      setClients(prev => prev.map(client => 
        client.id === id ? { ...client, ...updates } : client
      ));
    } catch (err) {
      console.error('useClients - Error updating client:', err);
      setError('Erreur lors de la mise à jour du client');
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      console.log('useClients - Deleting client:', id);
      await clientsService.delete(id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      console.error('useClients - Error deleting client:', err);
      setError('Erreur lors de la suppression du client');
      throw err;
    }
  };

  const refreshClients = async () => {
    try {
      setLoading(false);
      setError(null);
      const clientsData = await clientsService.getAll();
      setClients(clientsData);
    } catch (err) {
      console.error('useClients - Error refreshing clients:', err);
      setError('Erreur lors du rafraîchissement des clients');
    } finally {
      setLoading(false);
    }
  };

  console.log('useClients - Current state:', { clientsCount: clients.length, loading });
  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    refreshClients
  };
};