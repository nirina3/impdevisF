import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Quote, Client } from '../types';

// Collections
const QUOTES_COLLECTION = 'quotes';
const CLIENTS_COLLECTION = 'clients';

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Helper function to convert Date to Firestore timestamp
const convertToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Quote services
export const quotesService = {
  // Get all quotes
  async getAll(): Promise<Quote[]> {
    try {
      const q = query(collection(db, QUOTES_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          validUntil: convertTimestamp(data.validUntil),
          estimatedDelivery: convertTimestamp(data.estimatedDelivery),
          downPayment: data.downPayment ? {
            ...data.downPayment,
            paidDate: data.downPayment.paidDate ? convertTimestamp(data.downPayment.paidDate) : undefined
          } : undefined
        } as Quote;
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  },

  // Get quote by ID
  async getById(id: string): Promise<Quote | null> {
    try {
      const docRef = doc(db, QUOTES_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          validUntil: convertTimestamp(data.validUntil),
          estimatedDelivery: convertTimestamp(data.estimatedDelivery),
          downPayment: data.downPayment ? {
            ...data.downPayment,
            paidDate: data.downPayment.paidDate ? convertTimestamp(data.downPayment.paidDate) : undefined
          } : undefined
        } as Quote;
      }
      return null;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw error;
    }
  },

  // Add new quote
  async add(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    try {
      const now = new Date();
      const quoteData = {
        ...quote,
        createdAt: convertToTimestamp(now),
        updatedAt: convertToTimestamp(now),
        validUntil: convertToTimestamp(quote.validUntil),
        estimatedDelivery: convertToTimestamp(quote.estimatedDelivery),
        downPayment: quote.downPayment ? {
          ...quote.downPayment,
          paidDate: quote.downPayment.paidDate ? convertToTimestamp(quote.downPayment.paidDate) : undefined
        } : undefined
      };

      const docRef = await addDoc(collection(db, QUOTES_COLLECTION), quoteData);
      
      return {
        id: docRef.id,
        ...quote,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Error adding quote:', error);
      throw error;
    }
  },

  // Update quote
  async update(id: string, updates: Partial<Quote>): Promise<void> {
    try {
      const docRef = doc(db, QUOTES_COLLECTION, id);
      const updateData = {
        ...updates,
        updatedAt: convertToTimestamp(new Date()),
        ...(updates.validUntil && { validUntil: convertToTimestamp(updates.validUntil) }),
        ...(updates.estimatedDelivery && { estimatedDelivery: convertToTimestamp(updates.estimatedDelivery) }),
        ...(updates.downPayment && {
          downPayment: {
            ...updates.downPayment,
            paidDate: updates.downPayment.paidDate ? convertToTimestamp(updates.downPayment.paidDate) : undefined
          }
        })
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  },

  // Delete quote
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, QUOTES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  },

  // Get quotes by status
  async getByStatus(status: Quote['status']): Promise<Quote[]> {
    try {
      const q = query(
        collection(db, QUOTES_COLLECTION), 
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          validUntil: convertTimestamp(data.validUntil),
          estimatedDelivery: convertTimestamp(data.estimatedDelivery),
          downPayment: data.downPayment ? {
            ...data.downPayment,
            paidDate: data.downPayment.paidDate ? convertTimestamp(data.downPayment.paidDate) : undefined
          } : undefined
        } as Quote;
      });
    } catch (error) {
      console.error('Error fetching quotes by status:', error);
      throw error;
    }
  }
};

// Client services
export const clientsService = {
  // Get all clients
  async getAll(): Promise<Client[]> {
    try {
      const q = query(collection(db, CLIENTS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt)
        } as Client;
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  // Get client by ID
  async getById(id: string): Promise<Client | null> {
    try {
      const docRef = doc(db, CLIENTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt)
        } as Client;
      }
      return null;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  },

  // Add new client
  async add(client: Omit<Client, 'id' | 'createdAt' | 'totalQuotes' | 'totalValue'>): Promise<Client> {
    try {
      const now = new Date();
      const clientData = {
        ...client,
        createdAt: convertToTimestamp(now),
        totalQuotes: 0,
        totalValue: 0
      };

      const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), clientData);
      
      return {
        id: docRef.id,
        ...client,
        createdAt: now,
        totalQuotes: 0,
        totalValue: 0
      };
    } catch (error) {
      console.error('Error adding client:', error);
      throw error;
    }
  },

  // Update client
  async update(id: string, updates: Partial<Client>): Promise<void> {
    try {
      const docRef = doc(db, CLIENTS_COLLECTION, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  // Delete client
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, CLIENTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Update client statistics (total quotes and value)
  async updateStats(clientId: string, totalQuotes: number, totalValue: number): Promise<void> {
    try {
      const docRef = doc(db, CLIENTS_COLLECTION, clientId);
      await updateDoc(docRef, {
        totalQuotes,
        totalValue
      });
    } catch (error) {
      console.error('Error updating client stats:', error);
      throw error;
    }
  }
};