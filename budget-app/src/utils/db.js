import Dexie from 'dexie'

export const db = new Dexie('BudgetApp')

db.version(1).stores({
  accounts: 'accountId, accountLabel, type',
  transactions: 'id, accountId, date, type, category, amount',
})

export async function saveAccount(accountData) {
  const { accountId, accountLabel, type, transactions } = accountData
  await db.accounts.put({ accountId, accountLabel, type })
  await db.transactions.where('accountId').equals(accountId).delete()
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
