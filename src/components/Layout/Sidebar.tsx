import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  Settings, 
  Users,
  TrendingUp,
  Calculator,
  History,
  Briefcase
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-500' },
    { path: '/quotes', icon: FileText, label: 'Devis', color: 'text-emerald-500' },
    { path: '/quotes/new', icon: Plus, label: 'Nouveau Devis', color: 'text-violet-500' },
    { path: '/cost-calculation', icon: Calculator, label: 'Calcul des coûts', color: 'text-amber-500' },
    { path: '/cost-history', icon: History, label: 'Historique Calculs', color: 'text-purple-500' },
    { path: '/analytics', icon: TrendingUp, label: 'Analyses', color: 'text-rose-500' },
    { path: '/clients', icon: Users, label: 'Clients', color: 'text-cyan-500' },
    { path: '/settings', icon: Settings, label: 'Paramètres', color: 'text-neutral-500' },
  ];

  return (
    <div className="bg-white h-full shadow-strong border-r border-neutral-200/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-soft">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">ImportPro</h1>
            <p className="text-xs text-neutral-500 font-medium">Gestion des Devis</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="mt-6 pb-6">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                } group`}
              >
                <div className={`stat-icon ${isActive ? 'bg-white/20' : 'bg-neutral-100'} mr-3`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full shadow-glow"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-neutral-200/50">
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 rounded-xl border border-primary-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800">Version 1.0</p>
              <p className="text-xs text-neutral-500">Système professionnel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;