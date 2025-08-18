import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Bell, Search, User, Settings, LogOut, Menu, Briefcase } from 'lucide-react';
import QuickBackup from '../backup/QuickBackup';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const handleLogout = async () => {
    try {
      console.log('Attempting to sign out user...');
      await signOut(auth);
      console.log('User signed out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-neutral-200/50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 tablet-header">
      <div className="flex items-center justify-between">
        {/* Mobile menu button and logo */}
        <div className="flex items-center lg:hidden min-w-0 flex-1 sm:flex-none">
          <button
            type="button"
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all duration-200 mr-2 sm:mr-3 touch-target"
            onClick={onMenuClick}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-soft">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-gradient truncate">ImportPro</h1>
          </div>
        </div>

        {/* Search bar - hidden on mobile */}
        <div className="header-search hidden md:flex items-center flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl lg:ml-0">
          <div className="relative w-full mr-3 lg:mr-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un devis, client ou produit..."
              className="pl-12 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full bg-white/50 backdrop-blur-sm transition-all duration-200 placeholder-neutral-400 text-sm min-h-[44px] tablet-text-base"
            />
          </div>
          <QuickBackup />
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 ml-2 sm:ml-4 lg:ml-6 flex-shrink-0">
          {/* Notifications */}
          <div className="relative hidden sm:block lg:block">
            <button className="relative p-2 sm:p-2.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all duration-200 group min-h-[44px] min-w-[44px] flex items-center justify-center touch-target">
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-error-500 to-error-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-soft">
                3
              </span>
            </button>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-3 lg:pl-4 border-l border-neutral-200">
            <div className="text-right hidden md:block lg:block">
              <p className="text-sm font-semibold text-neutral-900">
                {user?.email || 'Utilisateur'}
              </p>
              <p className="text-xs text-neutral-500 hidden lg:block">Gestionnaire Principal</p>
            </div>
            <div className="relative group">
              <div className="w-10 h-10 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-200 cursor-pointer min-h-[44px] min-w-[44px] touch-target">
                <User className="w-5 h-5 text-white" />
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-11 sm:top-12 w-48 sm:w-52 bg-white rounded-xl shadow-strong border border-neutral-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 modal-content">
                <div className="p-2">
                  <Link to="/profile" className="w-full flex items-center px-3 py-2.5 sm:py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors duration-200 min-h-[44px] touch-friendly">
                    <User className="w-4 h-4 mr-3" />
                    Mon Profil
                  </Link>
                  <Link to="/settings" className="w-full flex items-center px-3 py-2.5 sm:py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors duration-200 min-h-[44px] touch-friendly">
                    <Settings className="w-4 h-4 mr-3" />
                    Paramètres
                  </Link>
                  <hr className="my-2 border-neutral-200" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2.5 sm:py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors duration-200 min-h-[44px] touch-friendly"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;