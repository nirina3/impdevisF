import React, { useState } from 'react';
import { useUserSettings } from '../hooks/useUserSettings';
import { dataFormattingService } from '../services/dataFormatting';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import Modal from '../components/ui/Modal';
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  DollarSign,
  Save,
  Bell,
  Shield,
  Palette,
  Database,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { settings, loading, error, updateSettings } = useUserSettings();
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const [profileData, setProfileData] = useState(
    settings?.profile || {
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '+261 34 12 345 67',
      company: 'Import Export Solutions',
      address: '123 Avenue de l\'Indépendance, Antananarivo, Madagascar',
      website: 'www.importexport.mg'
    }
  );

  const [businessData, setBusinessData] = useState(
    settings?.business || {
      companyName: 'Import Export Solutions',
      taxId: 'NIF123456789',
      currency: 'MGA',
      language: 'fr',
      timezone: 'Indian/Antananarivo',
      quoteValidityDays: 30,
      quotePrefix: 'QT'
    }
  );

  const [notifications, setNotifications] = useState({
    emailQuoteCreated: true,
    emailQuoteConfirmed: true,
    emailQuoteDelivered: true,
    pushNotifications: true,
    weeklyReports: true,
    monthlyReports: false
  });

  // Mettre à jour les données locales quand les paramètres sont chargés
  React.useEffect(() => {
    if (settings) {
      setProfileData(settings.profile);
      setBusinessData(settings.business);
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage message={error} />
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'business', label: 'Entreprise', icon: Building },
    { id: 'data', label: 'Données', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'appearance', label: 'Apparence', icon: Palette }
  ];

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessChange = (field: string, value: string | number) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings({
        profile: profileData,
        business: businessData
      });
      
      // Afficher une notification de succès
      alert('Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleDataReset = async () => {
    try {
      setIsResetting(true);
      await dataFormattingService.formatAllData();
      setShowResetModal(false);
      alert('Données réinitialisées avec succès ! La page va se recharger.');
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      alert('Erreur lors de la réinitialisation des données');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <button 
          onClick={handleSave} 
          className="btn-primary flex items-center space-x-2"
          disabled={activeTab === 'data'}
        >
          <Save className="w-4 h-4" />
          <span>Sauvegarder</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation des onglets */}
        <div className="lg:w-64 mx-0 sm:mx-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="flex-1 mx-0 sm:mx-0">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations Personnelles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Building className="w-4 h-4 inline mr-1" />
                    Entreprise *
                  </label>
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => handleProfileChange('company', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Adresse complète *
                  </label>
                  <textarea
                    value={profileData.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    rows={3}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Site web
                  </label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => handleProfileChange('website', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Paramètres Entreprise</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={businessData.companyName}
                    onChange={(e) => handleBusinessChange('companyName', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifiant fiscal (NIF) *
                  </label>
                  <input
                    type="text"
                    value={businessData.taxId}
                    onChange={(e) => handleBusinessChange('taxId', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Devise par défaut
                  </label>
                  <select
                    value={businessData.currency}
                    onChange={(e) => handleBusinessChange('currency', e.target.value)}
                    className="input-field bg-gray-50"
                    disabled
                  >
                    <option value="MGA">MGA (Ariary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Langue
                  </label>
                  <select
                    value={businessData.language}
                    onChange={(e) => handleBusinessChange('language', e.target.value)}
                    className="input-field"
                  >
                    <option value="fr">Français</option>
                    <option value="mg">Malagasy</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuseau horaire
                  </label>
                  <select
                    value={businessData.timezone}
                    onChange={(e) => handleBusinessChange('timezone', e.target.value)}
                    className="input-field"
                  >
                    <option value="Indian/Antananarivo">Indian/Antananarivo</option>
                    <option value="Indian/Mauritius">Indian/Mauritius</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validité des devis (jours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={businessData.quoteValidityDays}
                    onChange={(e) => handleBusinessChange('quoteValidityDays', parseInt(e.target.value))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Préfixe des devis
                  </label>
                  <input
                    type="text"
                    value={businessData.quotePrefix}
                    onChange={(e) => handleBusinessChange('quotePrefix', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Gestion des Données</h2>
              
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                      <h3 className="text-sm font-medium text-amber-900">Zone de Danger</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Les actions ci-dessous affecteront définitivement vos données.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-3">Réinitialisation des Données</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Cette action supprimera toutes vos données existantes (devis, clients, calculs) et les remplacera par des données de démonstration cohérentes.
                    </p>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-red-900">Attention !</h4>
                          <ul className="text-sm text-red-700 mt-1 space-y-1">
                            <li>• Tous vos devis existants seront supprimés</li>
                            <li>• Tous vos clients seront supprimés</li>
                            <li>• Tout l'historique des calculs sera supprimé</li>
                            <li>• Cette action est irréversible</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowResetModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Réinitialisation en cours...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Réinitialiser toutes les données</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Données de Démonstration</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Après la réinitialisation, l'application sera peuplée avec :
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• 3 clients de démonstration avec des informations complètes</li>
                      <li>• 3 devis avec des calculs de coûts réalistes</li>
                      <li>• Des données cohérentes pour tester les analyses financières</li>
                      <li>• Des exemples de différents statuts de devis et de paiement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Préférences de Notification</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Notifications Email</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailQuoteCreated', label: 'Nouveau devis créé' },
                      { key: 'emailQuoteConfirmed', label: 'Devis confirmé' },
                      { key: 'emailQuoteDelivered', label: 'Devis livré' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[key as keyof typeof notifications]}
                            onChange={(e) => handleNotificationChange(key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Autres Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'pushNotifications', label: 'Notifications push' },
                      { key: 'weeklyReports', label: 'Rapports hebdomadaires' },
                      { key: 'monthlyReports', label: 'Rapports mensuels' }
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[key as keyof typeof notifications]}
                            onChange={(e) => handleNotificationChange(key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Sécurité</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Changer le mot de passe</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="••••••••"
                      />
                    </div>
                    <button className="btn-primary">
                      Mettre à jour le mot de passe
                    </button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Authentification à deux facteurs</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Ajoutez une couche de sécurité supplémentaire à votre compte.
                  </p>
                  <button className="btn-secondary">
                    Activer l'authentification à deux facteurs
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Sessions actives</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Gérez vos sessions actives sur différents appareils.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Session actuelle</p>
                        <p className="text-xs text-gray-500">Chrome sur Windows • Casablanca, Maroc</p>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Actif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Apparence</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Thème</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'light', name: 'Clair', description: 'Thème clair par défaut' },
                      { id: 'dark', name: 'Sombre', description: 'Thème sombre pour les yeux' },
                      { id: 'auto', name: 'Automatique', description: 'Suit les préférences système' }
                    ].map((theme) => (
                      <div key={theme.id} className="relative">
                        <input
                          type="radio"
                          id={theme.id}
                          name="theme"
                          defaultChecked={theme.id === 'light'}
                          className="sr-only peer"
                        />
                        <label
                          htmlFor={theme.id}
                          className="flex flex-col p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 peer-checked:border-primary-600 peer-checked:bg-primary-50"
                        >
                          <span className="font-medium text-gray-900">{theme.name}</span>
                          <span className="text-sm text-gray-500">{theme.description}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Couleur d'accent</h3>
                  <div className="flex space-x-3">
                    {[
                      { color: 'bg-blue-600', name: 'Bleu' },
                      { color: 'bg-green-600', name: 'Vert' },
                      { color: 'bg-purple-600', name: 'Violet' },
                      { color: 'bg-red-600', name: 'Rouge' },
                      { color: 'bg-orange-600', name: 'Orange' }
                    ].map((colorOption) => (
                      <button
                        key={colorOption.name}
                        className={`w-8 h-8 rounded-full ${colorOption.color} ring-2 ring-offset-2 ring-transparent hover:ring-gray-300 focus:ring-gray-400`}
                        title={colorOption.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Densité d'affichage</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'comfortable', name: 'Confortable', description: 'Plus d\'espace entre les éléments' },
                      { id: 'compact', name: 'Compact', description: 'Moins d\'espace, plus de contenu visible' }
                    ].map((density) => (
                      <div key={density.id} className="flex items-center">
                        <input
                          type="radio"
                          id={density.id}
                          name="density"
                          defaultChecked={density.id === 'comfortable'}
                          className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                        />
                        <label htmlFor={density.id} className="ml-3">
                          <span className="text-sm font-medium text-gray-900">{density.name}</span>
                          <p className="text-xs text-gray-500">{density.description}</p>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmation de réinitialisation */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Confirmer la réinitialisation des données"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Action irréversible</h3>
                <p className="text-sm text-red-700 mt-1">
                  Cette action supprimera définitivement toutes vos données existantes.
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">
            Êtes-vous absolument certain de vouloir réinitialiser toutes les données de l'application ?
            Cette action ne peut pas être annulée.
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowResetModal(false)}
              className="btn-secondary"
              disabled={isResetting}
            >
              Annuler
            </button>
            <button
              onClick={handleDataReset}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Réinitialisation...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Confirmer la réinitialisation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;