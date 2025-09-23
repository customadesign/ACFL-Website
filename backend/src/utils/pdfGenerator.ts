import { Invoice, InvoiceItem } from '../types/invoice';

// Using html-pdf-node for PDF generation (already in package.json)
const htmlToPdf = require('html-pdf-node');

export async function generateInvoicePDF(invoice: any, items: InvoiceItem[]): Promise<Buffer> {
  const html = generateInvoiceHTML(invoice, items);

  const options = {
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  };

  const file = { content: html };
  const pdfBuffer = await htmlToPdf.generatePdf(file, options);

  return pdfBuffer;
}

function generateInvoiceHTML(invoice: any, items: InvoiceItem[]): string {
  const formatCurrency = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        ${item.description}
        ${item.service_date ? `<br><small style="color: #666;">Service Date: ${formatDate(item.service_date)}</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.unit_price_cents)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        ${item.discount_percentage ? `-${item.discount_percentage}%` : '-'}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        ${formatCurrency(item.amount_cents - (item.discount_amount_cents || 0))}
      </td>
    </tr>
  `).join('');

  const statusColor = {
    draft: '#6b7280',
    pending: '#f59e0b',
    sent: '#3b82f6',
    paid: '#10b981',
    partially_paid: '#8b5cf6',
    overdue: '#ef4444',
    cancelled: '#6b7280',
    refunded: '#6b7280'
  }[invoice.status] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 40px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        .logo-section {
          flex: 1;
        }
        .invoice-details {
          text-align: right;
          flex: 1;
        }
        .invoice-number {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 8px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          background-color: ${statusColor};
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .parties {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .party {
          flex: 1;
        }
        .party h3 {
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .party-details {
          color: #111827;
          font-size: 14px;
        }
        .party-details strong {
          font-size: 16px;
          color: #111827;
        }
        .invoice-meta {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .meta-label {
          color: #6b7280;
          font-weight: 500;
        }
        .meta-value {
          color: #111827;
          font-weight: 600;
        }
        .items-table {
          width: 100%;
          margin-bottom: 30px;
        }
        .items-table th {
          background-color: #f3f4f6;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        .items-table th:last-child {
          text-align: right;
        }
        .totals {
          margin-left: auto;
          width: 300px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-row.grand-total {
          border-bottom: none;
          border-top: 2px solid #111827;
          margin-top: 8px;
          padding-top: 12px;
          font-size: 18px;
          font-weight: bold;
          color: #111827;
        }
        .notes-section {
          margin-top: 40px;
          padding: 20px;
          background-color: #f9fafb;
          border-radius: 8px;
        }
        .notes-section h3 {
          color: #374151;
          margin-bottom: 10px;
          font-size: 14px;
          text-transform: uppercase;
        }
        .notes-content {
          color: #6b7280;
          font-size: 14px;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        .payment-due {
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .payment-due.overdue {
          background-color: #fee2e2;
          border-color: #ef4444;
        }
        .payment-due.paid {
          background-color: #d1fae5;
          border-color: #10b981;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-section">
            <h1 style="color: #111827; font-size: 28px;">INVOICE</h1>
          </div>
          <div class="invoice-details">
            <div class="invoice-number">${invoice.invoice_number}</div>
            <div class="status-badge">${invoice.status.toUpperCase()}</div>
          </div>
        </div>

        <div class="parties">
          <div class="party">
            <h3>From</h3>
            <div class="party-details">
              <strong>${invoice.coach.name}</strong><br>
              ${invoice.coach.email}<br>
              ${invoice.coach.phone || ''}
            </div>
          </div>
          <div class="party" style="text-align: right;">
            <h3>Bill To</h3>
            <div class="party-details">
              <strong>${invoice.client.name}</strong><br>
              ${invoice.client.email}<br>
              ${invoice.client.phone || ''}
            </div>
          </div>
        </div>

        <div class="invoice-meta">
          <div class="meta-row">
            <span class="meta-label">Issue Date:</span>
            <span class="meta-value">${formatDate(invoice.issue_date)}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Due Date:</span>
            <span class="meta-value">${formatDate(invoice.due_date)}</span>
          </div>
          ${invoice.paid_date ? `
          <div class="meta-row">
            <span class="meta-label">Paid Date:</span>
            <span class="meta-value">${formatDate(invoice.paid_date)}</span>
          </div>
          ` : ''}
          ${invoice.payment_terms ? `
          <div class="meta-row">
            <span class="meta-label">Payment Terms:</span>
            <span class="meta-value">${invoice.payment_terms}</span>
          </div>
          ` : ''}
        </div>

        ${invoice.balance_due_cents > 0 ? `
        <div class="payment-due ${invoice.status === 'overdue' ? 'overdue' : ''}">
          <strong>Amount Due: ${formatCurrency(invoice.balance_due_cents)}</strong>
          ${invoice.status === 'overdue' ? ' - OVERDUE' : ''}
        </div>
        ` : invoice.status === 'paid' ? `
        <div class="payment-due paid">
          <strong>PAID IN FULL</strong>
        </div>
        ` : ''}

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40%;">Description</th>
              <th style="width: 15%; text-align: center;">Quantity</th>
              <th style="width: 15%; text-align: right;">Unit Price</th>
              <th style="width: 15%; text-align: right;">Discount</th>
              <th style="width: 15%; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.subtotal_cents)}</span>
          </div>
          ${invoice.discount_cents > 0 ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>-${formatCurrency(invoice.discount_cents)}</span>
          </div>
          ` : ''}
          ${invoice.tax_amount_cents > 0 ? `
          <div class="total-row">
            <span>Tax (${invoice.tax_rate}%):</span>
            <span>${formatCurrency(invoice.tax_amount_cents)}</span>
          </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>Total:</span>
            <span>${formatCurrency(invoice.total_cents)}</span>
          </div>
          ${invoice.amount_paid_cents > 0 ? `
          <div class="total-row">
            <span>Paid:</span>
            <span>-${formatCurrency(invoice.amount_paid_cents)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Balance Due:</span>
            <span>${formatCurrency(invoice.balance_due_cents)}</span>
          </div>
          ` : ''}
        </div>

        ${invoice.notes ? `
        <div class="notes-section">
          <h3>Notes</h3>
          <div class="notes-content">${invoice.notes}</div>
        </div>
        ` : ''}

        ${invoice.terms_and_conditions ? `
        <div class="notes-section">
          <h3>Terms & Conditions</h3>
          <div class="notes-content">${invoice.terms_and_conditions}</div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for your business!</p>
          <p style="margin-top: 10px;">
            This invoice was generated on ${formatDate(new Date())}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function generateInvoiceCSV(invoices: any[]): string {
  const headers = [
    'Invoice Number',
    'Client',
    'Coach',
    'Issue Date',
    'Due Date',
    'Status',
    'Subtotal',
    'Tax',
    'Discount',
    'Total',
    'Amount Paid',
    'Balance Due'
  ];

  const rows = invoices.map(invoice => [
    invoice.invoice_number,
    invoice.client_name,
    invoice.coach_name,
    new Date(invoice.issue_date).toLocaleDateString(),
    new Date(invoice.due_date).toLocaleDateString(),
    invoice.status,
    (invoice.subtotal_cents / 100).toFixed(2),
    (invoice.tax_amount_cents / 100).toFixed(2),
    (invoice.discount_cents / 100).toFixed(2),
    (invoice.total_cents / 100).toFixed(2),
    (invoice.amount_paid_cents / 100).toFixed(2),
    (invoice.balance_due_cents / 100).toFixed(2)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}