export function generateInvoiceNumber(prefix, counter) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const n = String(counter).padStart(4, '0');
  return `${prefix}-${y}${m}${d}-${n}`;
}

export function calculateTotals(lineItems, taxRate) {
  const subtotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const tax = subtotal * (parseFloat(taxRate) || 0);
  const grandTotal = subtotal + tax;
  return { subtotal, tax, grandTotal };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStartOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function getStartOfYear() {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1);
}

export function getStartOfLastMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

export function getEndOfLastMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999);
}

export function sumInvoices(invoices) {
  return invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
}

export function newId() {
  return `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function newItemId() {
  return `item_${Math.random().toString(36).slice(2, 9)}`;
}
