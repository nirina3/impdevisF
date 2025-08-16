import React from 'react';
import { Quote } from '../../types';

interface PaymentStatusBadgeProps {
  status: Quote['paymentStatus'];
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: Quote['paymentStatus']) => {
    switch (status) {
      case 'unpaid':
        return {
          label: 'Non payé',
          className: 'bg-error-100 text-error-700 border-error-200'
        };
      case 'partial':
        return {
          label: 'Acompte versé',
          className: 'bg-warning-100 text-warning-700 border-warning-200'
        };
      case 'paid':
        return {
          label: 'Soldé',
          className: 'bg-success-100 text-success-700 border-success-200'
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

export default PaymentStatusBadge;