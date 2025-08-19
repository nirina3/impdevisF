import React from 'react';
import { formatAriary, formatNumberWithSpaces } from '../../utils/formatters';

interface ProfitAnalysisChartProps {
  totalCost: number;
  netProfit: number;
}

const ProfitAnalysisChart: React.FC<ProfitAnalysisChartProps> = ({ totalCost, netProfit }) => {
  const total = totalCost + netProfit;
  
  // Gérer le cas où il n'y a pas de données
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full mx-auto mb-3"></div>
          <p className="text-sm">Aucune donnée à afficher</p>
        </div>
      </div>
    );
  }
  
  const costPercentage = (totalCost / total) * 100;
  const profitPercentage = (netProfit / total) * 100;
  
  // Calcul des angles pour le graphique en donut
  const costAngle = (costPercentage / 100) * 360;
  const profitAngle = (profitPercentage / 100) * 360;
  
  // Paramètres du donut
  const size = 200;
  const strokeWidth = 40;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Calcul des longueurs d'arc
  const costStrokeLength = (costPercentage / 100) * circumference;
  const profitStrokeLength = (profitPercentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Cercle de fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          
          {/* Segment des coûts (orange/rouge) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#costGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${costStrokeLength} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              animation: 'drawCircle 1.5s ease-out forwards'
            }}
          />
          
          {/* Segment des bénéfices (vert) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#profitGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${profitStrokeLength} ${circumference}`}
            strokeDashoffset={-costStrokeLength}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              animation: 'drawCircle 1.5s ease-out 0.5s forwards'
            }}
          />
          
          {/* Définition des gradients */}
          <defs>
            <linearGradient id="costGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
            <linearGradient id="profitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Texte central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {formatNumberWithSpaces(Math.round(total))} Ar
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Marge: {total > 0 ? Math.round(profitPercentage) : 0}%
            </p>
          </div>
        </div>
      </div>
      
      {/* Légende */}
      <div className="mt-6 space-y-3 w-full">
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-500 to-red-600"></div>
            <span className="text-sm font-medium text-gray-700">Coût Total</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{formatNumberWithSpaces(Math.round(totalCost))} Ar</p>
            <p className="text-xs text-gray-500">{total > 0 ? Math.round(costPercentage) : 0}%</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"></div>
            <span className="text-sm font-medium text-gray-700">Bénéfice Net</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900">{formatNumberWithSpaces(Math.round(netProfit))} Ar</p>
            <p className="text-xs text-gray-500">{total > 0 ? Math.round(profitPercentage) : 0}%</p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes drawCircle {
          from {
            stroke-dasharray: 0 ${circumference};
          }
          to {
            stroke-dasharray: var(--final-dash-array) ${circumference};
          }
        }
      `}</style>
    </div>
  );
};

export default ProfitAnalysisChart;