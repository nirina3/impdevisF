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

// Helper function to clean undefined values from objects
const cleanUndefinedFields = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date) return obj;
  if (obj instanceof Timestamp) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefinedFields(item));
  }
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = cleanUndefinedFields(value);
      }
    });
    return cleaned;
  }
  return obj;
};

// Collections
const QUOTES_COLLECTION = 'quotes';
const CLIENTS_COLLECTION = 'clients';
const COST_CALCULATIONS_COLLECTION = 'costCalculations';

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
        ...(quote.downPayment && {
          downPayment: {
            ...quote.downPayment,
            paidDate: quote.downPayment.paidDate ? convertToTimestamp(quote.downPayment.paidDate) : null
          }
        })
      };

      const cleanedData = cleanUndefinedFields(quoteData);
      const docRef = await addDoc(collection(db, QUOTES_COLLECTION), cleanedData);
      
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
          downPayment: cleanUndefinedFields({
            ...updates.downPayment,
            paidDate: updates.downPayment.paidDate ? convertToTimestamp(updates.downPayment.paidDate) : null
          })
        })
      };

      const cleanedData = cleanUndefinedFields(updateData);
      await updateDoc(docRef, cleanedData);
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

      const cleanedData = cleanUndefinedFields(clientData);
      const docRef = await addDoc(collection(db, CLIENTS_COLLECTION), cleanedData);
      
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
      const cleanedData = cleanUndefinedFields(updates);
      await updateDoc(docRef, cleanedData);
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
      const updateData = {
        totalQuotes,
        totalValue
      };
      const cleanedData = cleanUndefinedFields(updateData);
      await updateDoc(docRef, cleanedData);
    } catch (error) {
      console.error('Error updating client stats:', error);
      throw error;
    }
  }
};

// Cost Calculations services
export const costCalculationsService = {
  // Get all cost calculations
  async getAll(): Promise<any[]> {
    try {
      const q = query(collection(db, COST_CALCULATIONS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          calculatedAt: convertTimestamp(data.calculatedAt)
        };
      });
    } catch (error) {
      console.error('Error fetching cost calculations:', error);
      throw error;
    }
  },

  // Get cost calculation by ID
  async getById(id: string): Promise<any | null> {
    try {
      const docRef = doc(db, COST_CALCULATIONS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
          calculatedAt: convertTimestamp(data.calculatedAt)
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching cost calculation:', error);
      throw error;
    }
  },

  // Add new cost calculation
  async add(calculationData: any, name: string): Promise<any> {
    try {
      const now = new Date();
      const dataToSave = {
        ...calculationData,
        name,
        createdAt: convertToTimestamp(now),
        updatedAt: convertToTimestamp(now),
        calculatedAt: convertToTimestamp(calculationData.calculatedAt || now)
      };

      const cleanedData = cleanUndefinedFields(dataToSave);
      const docRef = await addDoc(collection(db, COST_CALCULATIONS_COLLECTION), cleanedData);
      
      return {
        id: docRef.id,
        ...calculationData,
        name,
        createdAt: now,
        updatedAt: now,
        calculatedAt: calculationData.calculatedAt || now
      };
    } catch (error) {
      console.error('Error adding cost calculation:', error);
      throw error;
    }
  },

  // Update cost calculation
  async update(id: string, updates: any): Promise<void> {
    try {
      const docRef = doc(db, COST_CALCULATIONS_COLLECTION, id);
      const updateData = {
        ...updates,
        updatedAt: convertToTimestamp(new Date())
      };

      const cleanedData = cleanUndefinedFields(updateData);
      await updateDoc(docRef, cleanedData);
    } catch (error) {
      console.error('Error updating cost calculation:', error);
      throw error;
    }
  },

  // Delete cost calculation
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COST_CALCULATIONS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting cost calculation:', error);
      throw error;
    }
  }
};