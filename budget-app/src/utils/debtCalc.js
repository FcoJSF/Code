// Simulates month-by-month payoff of a set of debts.
//
// strategy: 'avalanche' (highest APR first) or 'snowball' (smallest balance first)
// Each month: every debt accrues interest (APR/12) and receives its minimum
// payment; all extra budget goes to the single focus debt. Freed-up minimums
// roll over to the next focus debt once one is paid off.
//
// Returns { months, totalInterest, totalPaid, debtFreeDate, perDebt, timeline }
// or { impossible: true } when payments don't cover interest growth.

const MAX_MONTHS = 600 // 50 years — beyond this we call it unpayable

export function simulatePayoff(debts, extraMonthly, strategy) {
  const active = debts
    .filter(d => d.balance > 0)
    .map(d => ({
      id: d.id,
      name: d.name,
      balance: d.balance,
      rate: (d.apr || 0) / 100 / 12,
      minPayment: d.minPayment || 0,
      interestPaid: 0,
      paidOffMonth: null,
    }))

  if (active.length === 0) return null

  const order = [...active].sort((a, b) =>
    strategy === 'snowball' ? a.balance - b.balance : b.rate - a.rate
  )

  const timeline = [] // total remaining balance per month, for charting
  let month = 0
  let totalInterest = 0
  let totalPaid = 0

  timeline.push({ month: 0, balance: sum(active, d => d.balance) })

  while (active.some(d => d.balance > 0.005)) {
    month++
    if (month > MAX_MONTHS) return { impossible: true }

    // Accrue interest
    for (const d of active) {
      if (d.balance <= 0) continue
      const interest = d.balance * d.rate
      d.balance += interest
      d.interestPaid += interest
      totalInterest += interest
    }

    // Minimum payments, collecting freed minimums from settled debts
    let extra = extraMonthly
    for (const d of active) {
      if (d.balance <= 0) {
        extra += d.minPayment
        continue
      }
      const pay = Math.min(d.minPayment, d.balance)
      d.balance -= pay
      totalPaid += pay
    }

    // Extra goes to focus debts in strategy order
    for (const d of order) {
      if (extra <= 0) break
      if (d.balance <= 0) continue
      const pay = Math.min(extra, d.balance)
      d.balance -= pay
      totalPaid += pay
      extra -= pay
    }

    for (const d of active) {
      if (d.balance <= 0.005 && d.paidOffMonth === null) {
        d.balance = 0
        d.paidOffMonth = month
      }
    }

    timeline.push({ month, balance: sum(active, d => d.balance) })
  }

  const debtFreeDate = addMonths(new Date(), month)

  return {
    months: month,
    totalInterest,
    totalPaid,
    debtFreeDate,
    timeline,
    perDebt: active.map(d => ({
      id: d.id,
      name: d.name,
      interestPaid: d.interestPaid,
      paidOffMonth: d.paidOffMonth,
      paidOffDate: addMonths(new Date(), d.paidOffMonth),
    })),
  }
}

export function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

export function formatMonthsDuration(months) {
  if (months < 12) return `${months} mo`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m === 0 ? `${y} yr` : `${y} yr ${m} mo`
}

function sum(arr, fn) {
  return arr.reduce((s, x) => s + fn(x), 0)
}
