export function formatMoney(value: number, currency = 'CZK') {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function calculateDebtRisk(debt: number, netWorth: number) {
  if (debt <= 0) {
    return 'Clear';
  }

  const ratio = debt / Math.max(netWorth, 1);

  if (ratio > 0.75) {
    return 'High';
  }

  if (ratio > 0.35) {
    return 'Medium';
  }

  return 'Low';
}

export function calculateInterestCharge(principal: number, interestRate: number) {
  if (principal <= 0 || interestRate <= 0) {
    return 0;
  }

  return Math.max(1, Math.round(principal * interestRate));
}

export function getLoanPressureLabel(debt: number, netWorth: number) {
  const risk = calculateDebtRisk(debt, netWorth);

  switch (risk) {
    case 'High':
      return 'Critical pressure';
    case 'Medium':
      return 'Rising pressure';
    case 'Low':
      return 'Light pressure';
    case 'Clear':
    default:
      return 'No active debt';
  }
}

export function formatLoanDueLabel(principal: number, nextIncreaseAt: string) {
  if (principal <= 0) {
    return 'No active debt';
  }

  const dueAt = new Date(nextIncreaseAt).getTime();

  if (Number.isNaN(dueAt)) {
    return 'Due soon';
  }

  const remainingMs = dueAt - Date.now();

  if (remainingMs <= 0) {
    return 'Due now';
  }

  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `in ${minutes}m`;
  }

  if (minutes <= 0) {
    return `in ${hours}h`;
  }

  return `in ${hours}h ${minutes}m`;
}

export function getCreditLimit(netWorth: number) {
  return Math.max(5000, Math.round(Math.max(netWorth, 0) * 0.8));
}

export function getRemainingCredit(principal: number, netWorth: number) {
  return Math.max(0, getCreditLimit(netWorth) - principal);
}
