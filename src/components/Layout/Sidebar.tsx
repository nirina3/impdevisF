import React from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Settings, 
  Settings as SettingsIcon,
  Users,
  TrendingUp,
  Calculator,
  History,
  Briefcase,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const [quotesMenuOpen, setQuotesMenuOpen] = useState(true);

  // Vérifier si on est dans une page liée aux devis
  const isQuotesSection = location.pathname.startsWith('/quotes') || 
                         location.pathname === '/quote-management';

  // Ouvrir automatiquement le menu devis si on est dans une section devis
  React.useEffect(() => {
    if (isQuotesSection) {
      setQuotesMenuOpen(true);
    }
  }, [isQuotesSection]);

  const mainMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-500' },
    { path: '/clients', icon: Users, label: 'Clients', color: 'text-cyan-500' },
    { path: '/cost-calculation', icon: Calculator, label: 'Calcul des coûts', color: 'text-amber-500' },
    { path: '/cost-history', icon: History, label: 'Historique Calculs', color: 'text-purple-500' },
    { path: '/analytics', icon: TrendingUp, label: 'Analyses', color: 'text-rose-500' },
    { path: '/settings', icon: SettingsIcon, label: 'Paramètres', color: 'text-neutral-500' },
  ];

  const quotesMenuItems = [
    { path: '/quotes', icon: FileText, label: 'Liste des Devis', color: 'text-emerald-500' },
    { path: '/quote-management', icon: Settings, label: 'Gestion des Devis', color: 'text-indigo-500' },
    { path: '/quotes/new', icon: Plus, label: 'Nouveau Devis', color: 'text-violet-500' },
  ];

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white h-full shadow-strong border-r border-neutral-200/50 backdrop-blur-sm tablet-sidebar flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 lg:p-6 border-b border-neutral-200/50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gradient">ImportPro</h1>
            <p className="text-xs sm:text-sm text-neutral-500 font-medium">Gestion des Devis</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-4 sm:mt-6 pb-6 px-2 sm:px-0 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {/* Menu principal */}
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={`sidebar-item ${
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                } group mobile-nav-item touch-friendly`}
              >
                <div className={`stat-icon ${isActive ? 'bg-white/20' : 'bg-neutral-100'} mr-3 flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                </div>
                <span className="font-medium text-sm sm:text-base truncate">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-glow"></div>
                )}
              </Link>
            );
          })}

          {/* Menu accordéon pour les devis */}
          <div className="mx-3">
            <button
              onClick={() => setQuotesMenuOpen(!quotesMenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isQuotesSection
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } group mobile-nav-item touch-friendly`}
            >
              <div className="flex items-center">
                <div className={`stat-icon ${isQuotesSection ? 'bg-primary-100' : 'bg-neutral-100'} mr-3 flex-shrink-0`}>
                  <FileText className={`w-5 h-5 ${isQuotesSection ? 'text-primary-600' : 'text-emerald-500'}`} />
                </div>
                <span className="font-medium text-sm sm:text-base truncate">Devis</span>
              </div>
              <div className="flex-shrink-0">
                {quotesMenuOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              </div>
            </button>

            {/* Sous-menu des devis */}
            {quotesMenuOpen && (
              <div className="mt-1 ml-4 sm:ml-6 space-y-1">
                {quotesMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={handleLinkClick}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-primary-100 text-primary-700 border-l-2 border-primary-600' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group mobile-nav-item touch-friendly`}
                    >
                      <div className={`p-2 rounded-lg mr-3 flex-shrink-0 ${isActive ? 'bg-primary-200' : 'bg-neutral-100'}`}>
                        <Icon className={`w-4 h-4 ${isActive ? 'text-primary-700' : item.color}`} />
                      </div>
                      <span className="font-medium truncate">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full flex-shrink-0"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 sm:p-5 lg:p-6 border-t border-neutral-200/50 flex-shrink-0">
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-3 sm:p-4 rounded-xl border border-primary-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-800 truncate">Version 1.0</p>
              <p className="text-xs text-neutral-500 truncate">Système professionnel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;