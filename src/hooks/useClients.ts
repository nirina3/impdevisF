import { useState, useEffect } from 'react';
import { Client } from '../types';

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Mohammed Alami',
    email: 'mohammed.alami@email.com',
    phone: '+212 6 12 34 56 78',
    address: '123 Rue Hassan II, Casablanca, Maroc',
    company: 'Alami Import Export',
    createdAt: new Date('2023-12-01'),
    totalQuotes: 5,
    totalValue: 225000000
  },
  {
    id: '2',
    name: 'Fatima Benali',
    email: 'fatima.benali@email.com',
    phone: '+212 6 87 65 43 21',
    address: '456 Avenue Mohammed V, Rabat, Maroc',
    company: 'Benali Trading',
    createdAt: new Date('2023-11-15'),
    totalQuotes: 3,
    totalValue: 140000000
  },
  {
    id: '3',
    name: 'Ahmed Tazi',
    email: 'ahmed.tazi@email.com',
    phone: '+212 6 11 22 33 44',
    address: '789 Rue Allal Ben Abdellah, Fès, Maroc',
    createdAt: new Date('2023-10-20'),
    totalQuotes: 8,
    totalValue: 335000000
  }
];

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useClients - Starting to load clients...');
    setTimeout(() => {
      console.log('useClients - Loading mock clients:', mockClients.length);
      setClients(mockClients);
      setLoading(false);
    }, 300);
  }, []);

  const addClient = (client: Omit<Client, 'id' | 'createdAt' | 'totalQuotes' | 'totalValue'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date(),
      totalQuotes: 0,
      totalValue: 0
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...updates } : client
    ));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
  };

  console.log('useClients - Current state:', { clientsCount: clients.length, loading });
  return {
    clients,
    loading,
    addClient,
    updateClient,
    deleteClient
  };
};