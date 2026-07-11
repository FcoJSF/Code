import Dexie from 'dexie'

export const db = new Dexie('BudgetApp')

db.version(1).stores({
  accounts: 'accountId, accountLabel, type',
  transactions: 'id, accountId, date, type, category, amount',
})

db.version(2).stores({
  accounts: 'accountId, accountLabel, type',
  transactions: 'id, accountId, date, type, category, amount',
  budgets: 'category',
  debts: '++id, name',
  goals: '++id, name',
  settings: 'key',
})

export async function saveAccount(accountData) {
  const { accountId, accountLabel, type, transactions } = accountData
  await db.accounts.put({ accountId, accountLabel, type })
  // bulkPut upserts — existing transactions are updated, new ones are added
  // This allows uploading multiple months for the same account without losing data
  await db.transactions.bulkPut(transactions)
}

export async function deleteAccount(accountId) {
  await db.accounts.delete(accountId)
  await db.transactions.where('accountId').equals(accountId).delete()
}

export async function getAllAccounts() {
  return db.accounts.toArray()
}

export async function getTransactions({ accountIds, monthYear } = {}) {
  let query = db.transactions
  let all = await query.toArray()

  if (accountIds && accountIds.length > 0) {
    all = all.filter(t => accountIds.includes(t.accountId))
  }

  if (monthYear) {
    all = all.filter(t => {
      const d = new Date(t.date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthYear
    })
  }

  return all.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export async function getAvailableMonths() {
  const all = await db.transactions.toArray()
  const set = new Set(all.map(t => {
    const d = new Date(t.date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }))
  return [...set].sort().reverse()
}

// ---- Budget (per-category monthly limits) ----

export async function getBudgets() {
  return db.budgets.toArray()
}

export async function setBudget(category, limit) {
  if (limit > 0) {
    await db.budgets.put({ category, limit })
  } else {
    await db.budgets.delete(category)
  }
}

// ---- Settings (monthly income, etc.) ----

export async function getSetting(key, fallback = null) {
  const row = await db.settings.get(key)
  return row ? row.value : fallback
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

// ---- Debts ----

export async function getDebts() {
  return db.debts.toArray()
}

export async function saveDebt(debt) {
  if (debt.id != null) return db.debts.put(debt)
  return db.debts.add(debt)
}

export async function deleteDebt(id) {
  await db.debts.delete(id)
}

// ---- Savings goals ----

export async function getGoals() {
  return db.goals.toArray()
}

export async function saveGoal(goal) {
  if (goal.id != null) return db.goals.put(goal)
  return db.goals.add(goal)
}

export async function deleteGoal(id) {
  await db.goals.delete(id)
}
