// PIN is 4 digits.
// Admin: full access (records, reports, settings, invoices).
// Staff: create and download invoices only — no records, reports or settings.
export const USERS = [
  { id: 'admin', name: 'Admin', pin: '0000', role: 'admin' },
  { id: 'staff', name: 'Staff', pin: '1234', role: 'staff' },
];
