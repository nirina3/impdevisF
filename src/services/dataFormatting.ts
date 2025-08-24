import { collection, getDocs, deleteDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Quote, Client, QuoteItem } from '../types';

// Helper function to get current user ID
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Utilisateur non connecté');
  }
  return user.uid;
};

// Service pour formater/réinitialiser les données de l'application
export const dataFormattingService = {
  // Supprimer toutes les données existantes
  async clearAllData(): Promise<void> {
    try {
      const userId = getCurrentUserId();
      console.log('Suppression de toutes les données...');
      
      // Supprimer tous les devis
      const quotesSnapshot = await getDocs(query(collection(db, 'quotes'), where('userId', '==', userId)));
      const quoteDeletePromises = quotesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(quoteDeletePromises);
      
      // Supprimer tous les clients
      const clientsSnapshot = await getDocs(query(collection(db, 'clients'), where('userId', '==', userId)));
      const clientDeletePromises = clientsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(clientDeletePromises);
      
      // Supprimer tous les calculs de coûts
      const calculationsSnapshot = await getDocs(query(collection(db, 'costCalculations'), where('userId', '==', userId)));
      const calculationDeletePromises = calculationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(calculationDeletePromises);
      
      console.log('Toutes les données ont été supprimées');
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      throw error;
    }
  },

  // Créer des données de démonstration cohérentes
  async createDemoData(): Promise<void> {
    try {
      const userId = getCurrentUserId();
      console.log('Création des données de démonstration...');
      
      // Créer des clients de démonstration
      const demoClients = [
        {
          name: 'Jean Rakoto',
          userId,
          email: 'jean.rakoto@email.mg',
          phone: '+261 34 12 345 67',
          address: '123 Avenue de l\'Indépendance, Antananarivo',
          company: 'Rakoto Import',
          createdAt: Timestamp.fromDate(new Date('2024-01-15')),
          totalQuotes: 0,
          totalValue: 0
        },
        {
          name: 'Marie Rasoamalala',
          userId,
          email: 'marie.rasoamalala@business.mg',
          phone: '+261 33 98 765 43',
          address: '456 Rue de la Liberté, Fianarantsoa',
          company: 'Madagascar Trading Co',
          createdAt: Timestamp.fromDate(new Date('2024-02-20')),
          totalQuotes: 0,
          totalValue: 0
        },
        {
          name: 'Paul Andriamampianina',
          userId,
          email: 'paul.andria@commerce.mg',
          phone: '+261 32 55 123 89',
          address: '789 Boulevard Ratsimilaho, Toamasina',
          company: 'Coastal Imports',
          createdAt: Timestamp.fromDate(new Date('2024-03-10')),
          totalQuotes: 0,
          totalValue: 0
        }
      ];

      const clientRefs = [];
      for (const client of demoClients) {
        const docRef = await addDoc(collection(db, 'clients'), client);
        clientRefs.push({ id: docRef.id, ...client });
      }

      // Créer des devis de démonstration avec des calculs cohérents
      const demoQuotes = [
        {
          quoteNumber: 'QT202501150830',
          userId,
          clientName: 'Jean Rakoto',
          clientEmail: 'jean.rakoto@email.mg',
          clientPhone: '+261 34 12 345 67',
          clientAddress: '123 Avenue de l\'Indépendance, Antananarivo',
          status: 'confirmed' as const,
          createdAt: Timestamp.fromDate(new Date('2025-01-15')),
          updatedAt: Timestamp.fromDate(new Date('2025-01-15')),
          validUntil: Timestamp.fromDate(new Date('2025-02-15')),
          estimatedDelivery: Timestamp.fromDate(new Date('2025-02-28')),
          currency: 'MGA' as const,
          shippingMethod: 'sea' as const,
          originCountry: 'Chine',
          destinationPort: 'Toamasina',
          paymentStatus: 'partial' as const,
          notes: 'Commande urgente pour le client prioritaire',
          items: [
            {
              id: 'item_1_1737024000000',
              description: 'Smartphones Android 128GB',
              quantity: 50,
              unitPrice: 480000, // Prix de vente unitaire
              purchasePrice: 200, // Prix d'achat en USD
              miscFees: 50000,
              customsFees: 75000,
              sellingPrice: 24000000, // 50 × 480000
              weight: 10,
              dimensions: { length: 15, width: 8, height: 1 },
              hsCode: '8517.12.00',
              category: 'Électronique',
              productLink: 'https://example.com/smartphone',
              mainCurrency: 'USD',
              exchangeRates: { USD: 4500, EUR: 4900, CNY: 620 },
              transportFees: 125000,
              transportFeesOriginal: 125000,
              transportCurrency: 'MGA',
              margin: 20
            }
          ],
          totalAmount: 24000000,
          remainingAmount: 12000000,
          downPayment: {
            id: 'dp_1737024000000',
            amount: 12000000,
            percentage: 50,
            paymentMethod: 'bank_transfer',
            notes: 'Acompte de 50% versé',
            paidDate: Timestamp.fromDate(new Date('2025-01-16'))
          }
        },
        {
          quoteNumber: 'QT202501201045',
          userId,
          clientName: 'Marie Rasoamalala',
          clientEmail: 'marie.rasoamalala@business.mg',
          clientPhone: '+261 33 98 765 43',
          clientAddress: '456 Rue de la Liberté, Fianarantsoa',
          status: 'delivered' as const,
          createdAt: Timestamp.fromDate(new Date('2025-01-20')),
          updatedAt: Timestamp.fromDate(new Date('2025-01-25')),
          validUntil: Timestamp.fromDate(new Date('2025-02-20')),
          estimatedDelivery: Timestamp.fromDate(new Date('2025-03-05')),
          currency: 'MGA' as const,
          shippingMethod: 'air' as const,
          originCountry: 'France',
          destinationPort: 'Ivato',
          paymentStatus: 'paid' as const,
          notes: 'Livraison express demandée',
          items: [
            {
              id: 'item_1_1737456000000',
              description: 'Parfums de luxe français',
              quantity: 20,
              unitPrice: 350000,
              purchasePrice: 120, // Prix d'achat en EUR
              miscFees: 25000,
              customsFees: 45000,
              sellingPrice: 7000000, // 20 × 350000
              weight: 5,
              dimensions: { length: 10, width: 5, height: 15 },
              hsCode: '3303.00.00',
              category: 'Cosmétiques',
              productLink: 'https://example.com/parfum',
              mainCurrency: 'EUR',
              exchangeRates: { USD: 4500, EUR: 4900, CNY: 620 },
              transportFees: 180000,
              transportFeesOriginal: 40,
              transportCurrency: 'USD',
              margin: 25
            }
          ],
          totalAmount: 7000000,
          remainingAmount: 0,
          downPayment: {
            id: 'dp_1737456000000',
            amount: 7000000,
            percentage: 100,
            paymentMethod: 'mobile_money',
            notes: 'Paiement intégral',
            paidDate: Timestamp.fromDate(new Date('2025-01-21'))
          }
        },
        {
          quoteNumber: 'QT202501251230',
          userId,
          clientName: 'Paul Andriamampianina',
          clientEmail: 'paul.andria@commerce.mg',
          clientPhone: '+261 32 55 123 89',
          clientAddress: '789 Boulevard Ratsimilaho, Toamasina',
          status: 'pending' as const,
          createdAt: Timestamp.fromDate(new Date('2025-01-25')),
          updatedAt: Timestamp.fromDate(new Date('2025-01-25')),
          validUntil: Timestamp.fromDate(new Date('2025-02-25')),
          estimatedDelivery: Timestamp.fromDate(new Date('2025-03-15')),
          currency: 'MGA' as const,
          shippingMethod: 'sea' as const,
          originCountry: 'Chine',
          destinationPort: 'Toamasina',
          paymentStatus: 'unpaid' as const,
          notes: 'Devis en attente de validation client',
          items: [
            {
              id: 'item_1_1737888000000',
              description: 'Équipements de bureau (ordinateurs)',
              quantity: 15,
              unitPrice: 1200000,
              purchasePrice: 600, // Prix d'achat en USD
              miscFees: 75000,
              customsFees: 120000,
              sellingPrice: 18000000, // 15 × 1200000
              weight: 45,
              dimensions: { length: 40, width: 30, height: 20 },
              hsCode: '8471.30.00',
              category: 'Informatique',
              productLink: 'https://example.com/computer',
              mainCurrency: 'USD',
              exchangeRates: { USD: 4500, EUR: 4900, CNY: 620 },
              transportFees: 200000,
              transportFeesOriginal: 200000,
              transportCurrency: 'MGA',
              margin: 30
            },
            {
              id: 'item_2_1737888000000',
              description: 'Imprimantes multifonctions',
              quantity: 8,
              unitPrice: 750000,
              purchasePrice: 280, // Prix d'achat en USD
              miscFees: 30000,
              customsFees: 50000,
              sellingPrice: 6000000, // 8 × 750000
              weight: 24,
              dimensions: { length: 35, width: 25, height: 18 },
              hsCode: '8443.31.00',
              category: 'Informatique',
              productLink: 'https://example.com/printer',
              mainCurrency: 'USD',
              exchangeRates: { USD: 4500, EUR: 4900, CNY: 620 },
              transportFees: 80000,
              transportFeesOriginal: 80000,
              transportCurrency: 'MGA',
              margin: 25
            }
          ],
          totalAmount: 24000000,
          remainingAmount: 24000000
        }
      ];

      // Ajouter les devis
      for (const quote of demoQuotes) {
        await addDoc(collection(db, 'quotes'), quote);
      }

      // Mettre à jour les statistiques des clients
      const clientUpdates = [
        { name: 'Jean Rakoto', totalQuotes: 1, totalValue: 24000000 },
        { name: 'Marie Rasoamalala', totalQuotes: 1, totalValue: 7000000 },
        { name: 'Paul Andriamampianina', totalQuotes: 1, totalValue: 24000000 }
      ];

      // Note: Dans un vrai système, on mettrait à jour les clients existants
      // Ici on laisse le système recalculer automatiquement

      console.log('Données de démonstration créées avec succès');
    } catch (error) {
      console.error('Erreur lors de la création des données de démonstration:', error);
      throw error;
    }
  },

  // Fonction principale pour formater toutes les données
  async formatAllData(): Promise<void> {
    try {
      // Supprimer toutes les données existantes
      await this.clearAllData();
      
      // Créer des données de démonstration cohérentes
      await this.createDemoData();
      
      // Nettoyer le localStorage
      localStorage.clear();
      
      console.log('Formatage des données terminé avec succès');
    } catch (error) {
      console.error('Erreur lors du formatage des données:', error);
      throw error;
    }
  }
};