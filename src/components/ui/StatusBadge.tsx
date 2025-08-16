import React from 'react';
import { Quote } from '../../types';

interface StatusBadgeProps {
  status: Quote['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: Quote['status']) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Brouillon',
          className: 'bg-neutral-100 text-neutral-700 border-neutral-200'
        };
      case 'pending':
        return {
          label: 'En Attente',
          className: 'bg-amber-100 text-amber-700 border-amber-200'
        };
      case 'confirmed':
        return {
          label: 'Confirmé',
          className: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
      case 'delivered':
        return {
          label: 'Livré',
          className: 'bg-blue-100 text-blue-700 border-blue-200'
        };
      case 'cancelled':
        return {
          label: 'Annulé',
          className: 'bg-error-100 text-error-700 border-error-200'
        };
      default:
        return {
          label: status,
          className: 'bg-neutral-100 text-neutral-700 border-neutral-200'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`badge ${config.className} shadow-soft`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;