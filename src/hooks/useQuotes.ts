import { useState, useEffect } from 'react';
import { Quote } from '../types';
import { quotesService } from '../services/firestore';

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('useQuotes - Starting to load quotes from Firebase...');
        const quotesData = await quotesService.getAll();
        console.log('useQuotes - Loaded quotes:', quotesData.length);
        setQuotes(quotesData);
      } catch (err) {
        console.error('useQuotes - Error loading quotes:', err);
        setError('Erreur lors du chargement des devis');
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, []);

  const addQuote = async (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('useQuotes - Adding new quote...');
      const newQuote = await quotesService.add(quote);
      setQuotes(prev => [newQuote, ...prev]);
      return newQuote;
    } catch (err) {
      console.error('useQuotes - Error adding quote:', err);
      setError('Erreur lors de la création du devis');
      throw err;
    }
  };

  const updateQuote = async (id: string, updates: Partial<Quote>) => {
    try {
      console.log('useQuotes - Updating quote:', id);
      await quotesService.update(id, updates);
      setQuotes(prev => prev.map(quote => 
        quote.id === id 
          ? { ...quote, ...updates, updatedAt: new Date() }
          : quote
      ));
    } catch (err) {
      console.error('useQuotes - Error updating quote:', err);
      setError('Erreur lors de la mise à jour du devis');
      throw err;
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      console.log('useQuotes - Deleting quote:', id);
      await quotesService.delete(id);
      setQuotes(prev => prev.filter(quote => quote.id !== id));
    } catch (err) {
      console.error('useQuotes - Error deleting quote:', err);
      setError('Erreur lors de la suppression du devis');
      throw err;
    }
  };

  const refreshQuotes = async () => {
    try {
      setLoading(false);
      setError(null);
      const quotesData = await quotesService.getAll();
      setQuotes(quotesData);
    } catch (err) {
      console.error('useQuotes - Error refreshing quotes:', err);
      setError('Erreur lors du rafraîchissement des devis');
    } finally {
      setLoading(false);
    }
  };

  const getQuoteById = (id: string) => {
    return quotes.find(quote => quote.id === id);
  };

  console.log('useQuotes - Current state:', { quotesCount: quotes.length, loading });
  return {
    quotes,
    loading,
    error,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuoteById,
    refreshQuotes
  };
};