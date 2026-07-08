export const formatCurrency = (amount, currency = 'Bs') => {
  const formatted = Number(amount).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
};

export const formatCurrencyUSD = (amount) => {
  return `$${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateShort = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
  });
};

export const daysUntil = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const formatQuantity = (value, unit) => {
  return `${Number(value).toLocaleString('es-VE')} ${unit || ''}`.trim();
};
