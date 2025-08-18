import { collection, getDocs, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Quote, Client } from '../types';

export interface BackupData {
  version: string;
  createdAt: Date;
  quotes: any[];
  clients: any[];
  costCalculations: any[];
  userSettings?: any;
}

export interface BackupMetadata {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  quotesCount: number;
  clientsCount: number;
  calculationsCount: number;
}

// Helper function to get current user ID
const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Utilisateur non connecté');
  }
  return user.uid;
};

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

export const backupService = {
  // Créer une sauvegarde complète
  async createBackup(name?: string): Promise<BackupMetadata> {
    try {
      const userId = getCurrentUserId();
      console.log('Création de la sauvegarde...');
      
      // Récupérer toutes les données
      const [quotesSnapshot, clientsSnapshot, calculationsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'quotes'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'clients'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'costCalculations'), where('userId', '==', userId)))
      ]);

      // Convertir les données
      const quotes = quotesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const clients = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const costCalculations = calculationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const backupData: BackupData = {
        version: '1.0',
        createdAt: new Date(),
        quotes,
        clients,
        costCalculations
      };

      // Générer un nom de sauvegarde si non fourni
      const backupName = name || `Sauvegarde du ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      
      // Calculer la taille approximative
      const dataSize = JSON.stringify(backupData).length;

      // Sauvegarder dans Firebase
      const backupId = `backup_${Date.now()}`;
      const backupDoc = {
        name: backupName,
        userId,
        createdAt: convertToTimestamp(new Date()),
        data: backupData,
        size: dataSize,
        quotesCount: quotes.length,
        clientsCount: clients.length,
        calculationsCount: costCalculations.length
      };

      await setDoc(doc(db, 'backups', backupId), backupDoc);

      console.log('Sauvegarde créée avec succès');
      
      return {
        id: backupId,
        name: backupName,
        createdAt: new Date(),
        size: dataSize,
        quotesCount: quotes.length,
        clientsCount: clients.length,
        calculationsCount: costCalculations.length
      };
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
      throw error;
    }
  },

  // Lister toutes les sauvegardes
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const userId = getCurrentUserId();
      const q = query(collection(db, 'backups'), where('userId', '==', userId));
      const backupsSnapshot = await getDocs(q);
      
      return backupsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          createdAt: convertTimestamp(data.createdAt),
          size: data.size,
          quotesCount: data.quotesCount,
          clientsCount: data.clientsCount,
          calculationsCount: data.calculationsCount
        };
      }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Erreur lors de la récupération des sauvegardes:', error);
      throw error;
    }
  },

  // Restaurer une sauvegarde
  async restoreBackup(backupId: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      console.log('Restauration de la sauvegarde:', backupId);
      
      // Récupérer la sauvegarde
      const q = query(collection(db, 'backups'), where('userId', '==', userId));
      const backupSnapshot = await getDocs(q);
      const backup = backupSnapshot.docs.find(doc => doc.id === backupId);
      
      if (!backup) {
        throw new Error('Sauvegarde non trouvée');
      }

      const backupDocData = backup.data();
      if (backupDocData.userId !== userId) {
        throw new Error('Accès non autorisé à cette sauvegarde');
      }

      const backupData = backupDocData.data as BackupData;

      // Supprimer toutes les données existantes
      await this.clearAllCollections();

      // Restaurer les données
      await this.restoreCollection('quotes', backupData.quotes);
      await this.restoreCollection('clients', backupData.clients);
      await this.restoreCollection('costCalculations', backupData.costCalculations);

      console.log('Restauration terminée avec succès');
    } catch (error) {
      console.error('Erreur lors de la restauration:', error);
      throw error;
    }
  },

  // Supprimer une sauvegarde
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      
      // Vérifier que la sauvegarde appartient à l'utilisateur
      const docRef = doc(db, 'backups', backupId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Sauvegarde non trouvée');
      }
      
      const backupData = docSnap.data();
      if (backupData.userId !== userId) {
        throw new Error('Accès non autorisé à cette sauvegarde');
      }

      await deleteDoc(docRef);
      console.log('Sauvegarde supprimée:', backupId);
    } catch (error) {
      console.error('Erreur lors de la suppression de la sauvegarde:', error);
      throw error;
    }
  },

  // Exporter une sauvegarde vers un fichier JSON
  async exportBackup(backupId: string): Promise<void> {
    try {
      const userId = getCurrentUserId();
      const q = query(collection(db, 'backups'), where('userId', '==', userId));
      const backupsSnapshot = await getDocs(q);
      const backup = backupsSnapshot.docs.find(doc => doc.id === backupId);
      
      if (!backup) {
        throw new Error('Sauvegarde non trouvée');
      }

      const backupDocData = backup.data();
      if (backupDocData.userId !== userId) {
        throw new Error('Accès non autorisé à cette sauvegarde');
      }

      const backupData = backupDocData;
      const exportData = {
        metadata: {
          name: backupData.name,
          createdAt: backupData.createdAt.toDate().toISOString(),
          version: backupData.data.version,
          quotesCount: backupData.quotesCount,
          clientsCount: backupData.clientsCount,
          calculationsCount: backupData.calculationsCount
        },
        data: backupData.data
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sauvegarde-${backupData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${backupData.createdAt.toDate().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export de la sauvegarde:', error);
      throw error;
    }
  },

  // Importer une sauvegarde depuis un fichier JSON
  async importBackup(file: File): Promise<BackupMetadata> {
    try {
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent);
      
      // Valider la structure des données
      if (!importedData.data || !importedData.metadata) {
        throw new Error('Format de fichier invalide');
      }

      const backupData = importedData.data;
      const metadata = importedData.metadata;

      // Créer une nouvelle sauvegarde avec les données importées
      const backupId = `backup_imported_${Date.now()}`;
      const backupDoc = {
        name: `${metadata.name} (Importé)`,
        createdAt: convertToTimestamp(new Date()),
        data: {
          ...backupData,
          createdAt: new Date()
        },
        size: fileContent.length,
        quotesCount: metadata.quotesCount || 0,
        clientsCount: metadata.clientsCount || 0,
        calculationsCount: metadata.calculationsCount || 0
      };

      await setDoc(doc(db, 'backups', backupId), backupDoc);

      return {
        id: backupId,
        name: backupDoc.name,
        createdAt: new Date(),
        size: backupDoc.size,
        quotesCount: backupDoc.quotesCount,
        clientsCount: backupDoc.clientsCount,
        calculationsCount: backupDoc.calculationsCount
      };
    } catch (error) {
      console.error('Erreur lors de l\'import de la sauvegarde:', error);
      throw error;
    }
  },

  // Supprimer toutes les collections
  async clearAllCollections(): Promise<void> {
    try {
      const userId = getCurrentUserId();
      const collections = ['quotes', 'clients', 'costCalculations'];
      
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des collections:', error);
      throw error;
    }
  },

  // Restaurer une collection
  async restoreCollection(collectionName: string, data: any[]): Promise<void> {
    try {
      const userId = getCurrentUserId();
      for (const item of data) {
        const { id, ...itemData } = item;
        await setDoc(doc(db, collectionName, id), { ...itemData, userId });
      }
    } catch (error) {
      console.error(`Erreur lors de la restauration de la collection ${collectionName}:`, error);
      throw error;
    }
  },

  // Obtenir les statistiques de sauvegarde
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  }> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
          oldestBackup: null,
          newestBackup: null
        };
      }

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const dates = backups.map(backup => backup.createdAt);
      
      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup: new Date(Math.min(...dates.map(d => d.getTime()))),
        newestBackup: new Date(Math.max(...dates.map(d => d.getTime())))
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
};