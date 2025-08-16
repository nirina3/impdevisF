import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { Bell, Search, User, Settings, LogOut } from 'lucide-react';

const Header: React.FC = () => {
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
    <header className="bg-white/80 backdrop-blur-md shadow-soft border-b border-neutral-200/50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un devis, client ou produit..."
              className="pl-12 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full bg-white/50 backdrop-blur-sm transition-all duration-200 placeholder-neutral-400"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4 ml-6">
          {/* Notifications */}
          <div className="relative">
            <button className="relative p-3 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-xl transition-all duration-200 group">
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-error-500 to-error-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-soft">
                3
              </span>
            </button>
          </div>
          
          {/* User Menu */}
          <div className="flex items-center space-x-3 pl-4 border-l border-neutral-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-900">
                {user?.email || 'Utilisateur'}
              </p>
              <p className="text-xs text-neutral-500">Gestionnaire Principal</p>
            </div>
            <div className="relative group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-200 cursor-pointer">
                <User className="w-5 h-5 text-white" />
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-strong border border-neutral-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <Link to="/profile" className="w-full flex items-center px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors duration-200">
                    <User className="w-4 h-4 mr-3" />
                    Mon Profil
                  </Link>
                  <Link to="/settings" className="w-full flex items-center px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors duration-200">
                    <Settings className="w-4 h-4 mr-3" />
                    Paramètres
                  </Link>
                  <hr className="my-2 border-neutral-200" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg transition-colors duration-200"
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