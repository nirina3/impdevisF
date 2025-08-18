import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    website: string;
  };
  business: {
    companyName: string;
    taxId: string;
    currency: string;
    language: string;
    timezone: string;
    quoteValidityDays: number;
    quotePrefix: string;
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  profile: {
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+261 34 12 345 67',
    company: 'Import Export Solutions',
    address: '123 Avenue de l\'Indépendance, Antananarivo, Madagascar',
    website: 'www.importexport.mg'
  },
  business: {
    companyName: 'Import Export Solutions',
    taxId: 'NIF123456789',
    currency: 'MGA',
    language: 'fr',
    timezone: 'Indian/Antananarivo',
    quoteValidityDays: 30,
    quotePrefix: 'QT'
  }
};

export const userSettingsService = {
  async getUserSettings(): Promise<UserSettings> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return DEFAULT_SETTINGS;
      }

      const docRef = doc(db, 'userSettings', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { ...DEFAULT_SETTINGS, ...docSnap.data() } as UserSettings;
      } else {
        // Créer les paramètres par défaut pour l'utilisateur
        await setDoc(docRef, DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const docRef = doc(db, 'userSettings', user.uid);
      await setDoc(docRef, settings, { merge: true });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  }
};