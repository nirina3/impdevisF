// Utilitaire pour la génération de PDF des devis
export const generateQuotePDF = (quote: any) => {
  // Simuler la génération PDF
  const content = `
DEVIS D'IMPORTATION
==================

Numéro: ${quote.quoteNumber}
Client: ${quote.clientName}
Date: ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}

ARTICLES:
${quote.items.map((item: any, index: number) => `
${index + 1}. ${item.description}
   Quantité: ${item.quantity}
   Prix unitaire: ${item.sellingPrice.toLocaleString('fr-FR')} Ar
   Sous-total: ${(item.quantity * item.sellingPrice).toLocaleString('fr-FR')} Ar
`).join('')}

TOTAL: ${quote.totalAmount.toLocaleString('fr-FR')} Ar

${quote.downPayment ? `
ACOMPTE: ${quote.downPayment.amount.toLocaleString('fr-FR')} Ar (${quote.downPayment.percentage}%)
SOLDE RESTANT: ${quote.remainingAmount.toLocaleString('fr-FR')} Ar
` : ''}

Valide jusqu'au: ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}
Livraison estimée: ${new Date(quote.estimatedDelivery).toLocaleDateString('fr-FR')}
  `;

  // Créer un blob et déclencher le téléchargement
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `devis-${quote.quoteNumber}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const printQuote = (quote: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Devis ${quote.quoteNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .info { margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f5f5f5; }
        .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>DEVIS D'IMPORTATION</h1>
        <h2>${quote.quoteNumber}</h2>
      </div>
      
      <div class="info">
        <p><strong>Client:</strong> ${quote.clientName}</p>
        <p><strong>Email:</strong> ${quote.clientEmail}</p>
        <p><strong>Téléphone:</strong> ${quote.clientPhone}</p>
        <p><strong>Date:</strong> ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}</p>
        <p><strong>Valide jusqu'au:</strong> ${new Date(quote.validUntil).toLocaleDateString('fr-FR')}</p>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${quote.items.map((item: any) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${item.sellingPrice.toLocaleString('fr-FR')} Ar</td>
              <td>${(item.quantity * item.sellingPrice).toLocaleString('fr-FR')} Ar</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total">
        <p>TOTAL: ${quote.totalAmount.toLocaleString('fr-FR')} Ar</p>
        ${quote.downPayment ? `
          <p>Acompte: ${quote.downPayment.amount.toLocaleString('fr-FR')} Ar (${quote.downPayment.percentage}%)</p>
          <p>Solde restant: ${quote.remainingAmount.toLocaleString('fr-FR')} Ar</p>
        ` : ''}
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
};