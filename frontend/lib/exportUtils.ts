import type { Subscription } from '@/types';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'CA$',
  JPY: '¥',
};

function formatCurrencyAmount(amount: number, currency: string = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/**
 * Flow 5.2: Export subscriptions array to CSV file spreadsheet.
 */
export function exportToCSV(subscriptions: Subscription[], filename: string = 'subtrackr_subscriptions.csv') {
  if (!subscriptions || subscriptions.length === 0) return;

  const headers = [
    'Service Name',
    'Category',
    'Price',
    'Currency',
    'Billing Cycle',
    'Renewal Date',
    'Payment Method',
    'Status',
    'Free Trial',
    'Notes',
  ];

  const rows = subscriptions.map((sub) => [
    `"${(sub.serviceName || '').replace(/"/g, '""')}"`,
    `"${(sub.category || '').replace(/"/g, '""')}"`,
    sub.price ?? 0,
    `"${(sub.currency || 'USD').replace(/"/g, '""')}"`,
    `"${(sub.billingCycle || 'monthly').replace(/"/g, '""')}"`,
    sub.renewalDate ? `="` + new Date(sub.renewalDate).toISOString().split('T')[0] + `"` : '""',
    `"${(sub.paymentMethod || 'Other').replace(/"/g, '""')}"`,
    `"${(sub.status || 'active').replace(/"/g, '""')}"`,
    sub.isFreeTrial ? 'Yes' : 'No',
    `"${(sub.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Flow 5.2: Export subscriptions summary as a printable PDF / Financial Statement.
 */
export function exportToPDF(
  subscriptions: Subscription[],
  title: string = 'SubTrackr Financial Statement',
  primaryCurrency: string = 'INR'
) {
  if (!subscriptions || subscriptions.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const totalMonthlySpend = subscriptions.reduce((sum, s) => {
    let cost = s.price || 0;
    if (s.billingCycle === 'yearly') cost /= 12;
    else if (s.billingCycle === 'weekly') cost = (cost * 52) / 12;
    else if (s.billingCycle === 'daily') cost *= 30.43;
    return sum + cost;
  }, 0);

  const freeTrialsCount = subscriptions.filter((s) => s.isFreeTrial).length;
  const activeSubsCount = subscriptions.filter((s) => (s.status || 'active') === 'active').length;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #6366f1; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .summary-grid { display: flex; gap: 16px; margin-bottom: 30px; }
          .card { flex: 1; padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
          .card-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
          .card-value { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; background: #f1f5f9; padding: 12px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
          .badge { padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
          .badge-active { background: #dcfce7; color: #15803d; }
          .badge-paused { background: #fef9c3; color: #a16207; }
          .badge-cancelled { background: #fee2e2; color: #b91c1c; }
          .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SubTrackr</div>
            <div class="subtitle">${title} — Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 14px;">Inventory Overview</div>
            <div style="font-size: 11px; color: #64748b;">${subscriptions.length} Subscriptions</div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="card">
            <div class="card-title">Est. Monthly Spend</div>
            <div class="card-value">${formatCurrencyAmount(totalMonthlySpend, primaryCurrency)}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Subscriptions</div>
            <div class="card-value">${subscriptions.length}</div>
          </div>
          <div class="card">
            <div class="card-title">Active Subscriptions</div>
            <div class="card-value">${activeSubsCount}</div>
          </div>
          <div class="card">
            <div class="card-title">Free Trials</div>
            <div class="card-value">${freeTrialsCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th>Price</th>
              <th>Cycle</th>
              <th>Renewal Date</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${subscriptions
              .map(
                (s) => `
              <tr>
                <td><strong>${s.serviceName}</strong></td>
                <td>${s.category || 'General'}</td>
                <td>${s.currency || 'USD'} ${s.price}</td>
                <td style="text-transform: capitalize;">${s.billingCycle}</td>
                <td>${s.renewalDate ? new Date(s.renewalDate).toLocaleDateString() : '-'}</td>
                <td>${s.paymentMethod || 'Other'}</td>
                <td><span class="badge badge-${(s.status || 'active').toLowerCase()}">${s.status || 'active'}</span></td>
                <td>${s.notes || '-'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          Report compiled automatically by SubTrackr Financial Suite. Confidential.
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
