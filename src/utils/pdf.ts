import { UserSettings } from '../services/userSettings';
import { formatNumberWithSpaces, safeFormatDate } from './formatters';

// Utilitaire pour la génération de PDF des devis au format HTML A5
export const generateQuotePDF = (quote: any, userSettings?: UserSettings) => {
  const htmlContent = generateQuoteHTML(quote, userSettings);
  
  // Créer un blob HTML et déclencher le téléchargement
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `devis-${quote.quoteNumber}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Génération du contenu HTML pour le devis au format A5
export const generateQuoteHTML = (quote: any, userSettings?: UserSettings) => {
  const profile = userSettings?.profile || {
    name: 'Import Export Solutions',
    email: 'contact@importexport.mg',
    phone: '+261 34 12 345 67',
    company: 'Import Export Solutions',
    address: '123 Avenue de l\'Indépendance, Antananarivo, Madagascar',
    website: 'www.importexport.mg'
  };

  const business = userSettings?.business || {
    companyName: 'Import Export Solutions',
    taxId: 'NIF123456789'
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Devis ${quote.quoteNumber}</title>
    <style>
        /* Format A5 : 148mm x 210mm */
        @page {
            size: A5;
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 10px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 118mm; /* A5 width minus margins */
            margin: 0 auto;
            padding: 0;
        }
        
        /* En-tête avec informations personnelles */
        .header {
            background: linear-gradient(135deg, #475569 0%, #334155 100%);
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 15px;
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 15px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .company-details {
            font-size: 8px;
            line-height: 1.3;
            opacity: 0.9;
        }
        
        .quote-info {
            text-align: right;
            flex-shrink: 0;
        }
        
        .quote-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .quote-number {
            font-size: 12px;
            font-weight: bold;
            background: rgba(255, 255, 255, 0.2);
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
        }
        
        /* Informations client */
        .client-section {
            background: #f8fafc;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 15px;
            border-left: 4px solid #475569;
        }
        
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .client-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 9px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: 600;
            color: #64748b;
            margin-bottom: 2px;
        }
        
        .info-value {
            color: #1e293b;
        }
        
        /* Tableau des articles */
        .items-section {
            margin-bottom: 15px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th {
            background: #475569;
            color: white;
            padding: 6px 4px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            vertical-align: middle;
        }
        
        .items-table td {
            padding: 6px 4px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .item-description {
            font-weight: 500;
            color: #1e293b;
            text-align: left;
            padding-left: 8px;
        }
        
        .text-right {
            text-align: right;
            padding-right: 8px;
        }
        
        .text-center {
            text-align: center;
        }
        
        /* Totaux */
        .totals-section {
            background: #f1f5f9;
            padding: 10px;
            border-radius: 6px;
            margin-bottom: 15px;
        }
        
        .totals-table {
            width: 100%;
            font-size: 9px;
        }
        
        .totals-table td {
            padding: 3px 0;
            border: none;
        }
        
        .total-label {
            font-weight: 500;
            color: #64748b;
        }
        
        .total-value {
            font-weight: 600;
            color: #1e293b;
            text-align: right;
        }
        
        .grand-total {
            border-top: 2px solid #475569;
            padding-top: 6px !important;
            margin-top: 6px;
        }
        
        .grand-total .total-label {
            font-size: 11px;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
        }
        
        .grand-total .total-value {
            font-size: 12px;
            font-weight: bold;
            color: #059669;
        }
        
        /* Informations supplémentaires */
        .additional-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
            font-size: 8px;
        }
        
        .info-box {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 8px;
        }
        
        .info-box-title {
            font-weight: bold;
            color: #475569;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        
        /* Notes */
        .notes-section {
            background: #fffbeb;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 15px;
        }
        
        .notes-title {
            font-size: 10px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 6px;
            text-transform: uppercase;
        }
        
        .notes-content {
            font-size: 9px;
            line-height: 1.4;
            color: #78350f;
        }
        
        /* Pied de page */
        .footer {
            border-top: 2px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
            font-size: 7px;
            color: #64748b;
            margin-top: 20px;
        }
        
        .footer-line {
            margin-bottom: 2px;
        }
        
        /* Styles d'impression */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .container {
                max-width: none;
            }
            
            .header {
                break-inside: avoid;
            }
            
            .items-table {
                break-inside: avoid;
            }
            
            .totals-section {
                break-inside: avoid;
            }
        }
        
        /* Responsive pour aperçu écran */
        @media screen and (max-width: 600px) {
            .header-content {
                flex-direction: column;
                gap: 10px;
            }
            
            .quote-info {
                text-align: left;
            }
            
            .client-info {
                grid-template-columns: 1fr;
            }
            
            .additional-info {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- En-tête avec informations personnelles -->
        <div class="header">
            <div class="header-content">
                <div class="company-info">
                    <div class="company-name">${business.companyName}</div>
                    <div class="company-details">
                        <div><strong>${profile.name}</strong></div>
                        <div>${profile.address}</div>
                        <div>Tél: ${profile.phone}</div>
                        <div>Email: ${profile.email}</div>
                        ${profile.website ? `<div>Web: ${profile.website}</div>` : ''}
                        ${business.taxId ? `<div>NIF: ${business.taxId}</div>` : ''}
                    </div>
                </div>
                <div class="quote-info">
                    <div class="quote-title">Devis</div>
                    <div class="quote-number">${quote.quoteNumber}</div>
                </div>
            </div>
        </div>
        
        <!-- Informations client -->
        <div class="client-section">
            <div class="section-title">Informations Client</div>
            <div class="client-info">
                <div class="info-item">
                    <div class="info-label">Nom</div>
                    <div class="info-value">${quote.clientName}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value">${quote.clientEmail}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Téléphone</div>
                    <div class="info-value">${quote.clientPhone}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Date</div>
                    <div class="info-value">${safeFormatDate(quote.createdAt, 'dd/MM/yyyy')}</div>
                </div>
            </div>
            <div style="margin-top: 8px;">
                <div class="info-label">Adresse</div>
                <div class="info-value">${quote.clientAddress}</div>
            </div>
        </div>
        
        <!-- Articles -->
        <div class="items-section">
            <div class="section-title">Articles</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 45%; text-align: left; padding-left: 8px;">Description</th>
                        <th style="width: 15%; text-align: center;">Qté</th>
                        <th style="width: 20%; text-align: right; padding-right: 8px;">P.U. (Ar)</th>
                        <th style="width: 20%; text-align: right; padding-right: 8px;">Total (Ar)</th>
                    </tr>
                </thead>
                <tbody>
                    ${quote.items.map((item: any) => `
                        <tr>
                            <td class="item-description" style="text-align: left; padding-left: 8px;">${item.description}</td>
                            <td class="text-center">${formatNumberWithSpaces(item.quantity)}</td>
                            <td class="text-right" style="text-align: right; padding-right: 8px;">${formatNumberWithSpaces(Math.round(item.unitPrice))}</td>
                            <td class="text-right" style="text-align: right; padding-right: 8px;">${formatNumberWithSpaces(Math.round(item.quantity * item.unitPrice))}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Totaux -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td class="total-label">Sous-total</td>
                    <td class="total-value">${formatNumberWithSpaces(quote.totalAmount)} Ar</td>
                </tr>
                ${quote.downPayment ? `
                    <tr>
                        <td class="total-label">Acompte (${quote.downPayment.percentage}%)</td>
                        <td class="total-value">-${formatNumberWithSpaces(quote.downPayment.amount)} Ar</td>
                    </tr>
                    <tr>
                        <td class="total-label">Solde restant</td>
                        <td class="total-value">${formatNumberWithSpaces(quote.remainingAmount)} Ar</td>
                    </tr>
                ` : ''}
                <tr class="grand-total">
                    <td class="total-label">Total</td>
                    <td class="total-value">${formatNumberWithSpaces(quote.totalAmount)} Ar</td>
                </tr>
            </table>
        </div>
        
        <!-- Informations supplémentaires -->
        <div class="additional-info">
            <div class="info-box">
                <div class="info-box-title">Expédition</div>
                <div><strong>Origine:</strong> ${quote.originCountry}</div>
                <div><strong>Mode:</strong> ${quote.shippingMethod === 'sea' ? 'Maritime' : quote.shippingMethod === 'air' ? 'Aérien' : 'Terrestre'}</div>
                <div><strong>Destination:</strong> ${quote.destinationPort}</div>
            </div>
            <div class="info-box">
                <div class="info-box-title">Délais</div>
                <div><strong>Valide jusqu'au:</strong><br>${safeFormatDate(quote.validUntil, 'dd/MM/yyyy')}</div>
                <div><strong>Livraison estimée:</strong><br>${safeFormatDate(quote.estimatedDelivery, 'dd/MM/yyyy')}</div>
            </div>
        </div>
        
        <!-- Notes -->
        ${quote.notes ? `
            <div class="notes-section">
                <div class="notes-title">Notes</div>
                <div class="notes-content">${quote.notes}</div>
            </div>
        ` : ''}
        
        <!-- Pied de page -->
        <div class="footer">
            <div class="footer-line">Ce devis est valable ${userSettings?.business?.quoteValidityDays || 30} jours à compter de la date d'émission.</div>
            <div class="footer-line">Merci de votre confiance - ${business.companyName}</div>
            ${profile.website ? `<div class="footer-line">${profile.website}</div>` : ''}
        </div>
    </div>
</body>
</html>
  `;
};

export const printQuote = (quote: any) => {
  const printQuote = (quote: any, userSettings?: UserSettings) => {
  }
  const htmlContent = generateQuoteHTML(quote, userSettings);
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};