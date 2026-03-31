import { categorize } from './categorizer.js'

function parseMXAmount(str) {
  if (!str || str.trim() === '-') return null
  return parseFloat(str.replace(/[$,\s]/g, '')) || null
}

function parseMXDate(str) {
  // Format: 23/Mar/2026 or 30/Mar/2026
  const months = { ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11 }
  const parts = str.trim().split('/')
  if (parts.length !== 3) return new Date(str)
  const day = parseInt(parts[0])
  const mon = months[parts[1].toLowerCase().slice(0, 3)]
  const year = parseInt(parts[2])
  return new Date(year, mon, day)
}

function extractMetaLine(lines, key) {
  for (const line of lines) {
    if (line.toUpperCase().startsWith(key.toUpperCase())) {
      return line.slice(key.length).trim()
    }
  }
  return null
}

export function parseCSV(rawText, fileName) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)

  // Find header row index
  const ccHeaderIndex = lines.findIndex(l =>
    l.toUpperCase().startsWith('FECHA,CONSECUTIVO')
  )
  const chkHeaderIndex = lines.findIndex(l =>
    l.toUpperCase().startsWith('FECHA,HORA,SUCURSAL')
  )

  if (ccHeaderIndex !== -1) {
    return parseCreditCard(lines, ccHeaderIndex, fileName)
  } else if (chkHeaderIndex !== -1) {
    return parseChecking(lines, chkHeaderIndex, fileName)
  } else {
    throw new Error(`Unrecognized CSV format in "${fileName}". Expected credit card or checking account format.`)
  }
}

function parseCreditCard(lines, headerIndex, fileName) {
  const metaLines = lines.slice(0, headerIndex)
  const cardName = extractMetaLine(metaLines, 'Producto:') || fileName.replace('.csv', '')
  const lastFour = (extractMetaLine(metaLines, 'No. de Tarjeta:') || '').replace(/\*/g, '').slice(-4)

  const accountId = `cc_${cardName.replace(/\s+/g, '_').toUpperCase()}`
  const accountLabel = `${cardName}${lastFour ? ` (****${lastFour})` : ''}`

  const transactions = []
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i])
    if (row.length < 4) continue
    const [fecha, , concepto, importe] = row
    const amount = parseMXAmount(importe)
    if (amount === null) continue
    const date = parseMXDate(fecha)
    const { category, color } = categorize(concepto)
    transactions.push({
      id: `${accountId}_${i}`,
      date: date.toISOString(),
      dateLabel: fecha.trim(),
      concepto: concepto.trim(),
      amount,
      type: 'expense',
      category,
      color,
      accountId,
      accountLabel,
    })
  }

  return { accountId, accountLabel, type: 'credit_card', transactions }
}

function parseChecking(lines, headerIndex, fileName) {
  const metaLines = lines.slice(0, headerIndex)
  const cardName = extractMetaLine(metaLines, 'Producto:') || extractMetaLine(metaLines, 'CUENTA:') || 'Checking Account'
  // Last 4 digits from "**9214" pattern or explicit card number line
  const accountNumLine = extractMetaLine(metaLines, 'No. de Tarjeta:') || extractMetaLine(metaLines, 'No. de Cuenta:') || metaLines.find(l => /\*\*\d{4}/.test(l)) || ''
  const lastFourMatch = accountNumLine.match(/\*+(\d{4})/)
  const lastFour = lastFourMatch ? lastFourMatch[1] : ''

  const accountId = `chk_${cardName.replace(/\s+/g, '_').toUpperCase()}`
  const accountLabel = `${cardName}${lastFour ? ` (****${lastFour})` : ''}`

  const transactions = []
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = splitCSVLine(lines[i])
    if (row.length < 6) continue
    const [fecha, , , concepto, retiro, deposito] = row

    const withdrawalAmt = parseMXAmount(retiro)
    const depositAmt = parseMXAmount(deposito)
    const date = parseMXDate(fecha)

    if (depositAmt !== null && depositAmt > 0) {
      const { category, color } = categorize(concepto)
      transactions.push({
        id: `${accountId}_dep_${i}`,
        date: date.toISOString(),
        dateLabel: fecha.trim(),
        concepto: concepto.trim(),
        amount: depositAmt,
        type: 'income',
        category: 'Income',
        color: '#22c55e',
        accountId,
        accountLabel,
      })
    }

    if (withdrawalAmt !== null && withdrawalAmt !== 0) {
      const { category, color } = categorize(concepto)
      transactions.push({
        id: `${accountId}_ret_${i}`,
        date: date.toISOString(),
        dateLabel: fecha.trim(),
        concepto: concepto.trim(),
        amount: Math.abs(withdrawalAmt),
        type: 'expense',
        category,
        color,
        accountId,
        accountLabel,
      })
    }
  }

  return { accountId, accountLabel, type: 'checking', transactions }
}

function splitCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { result.push(current); current = '' }
    else { current += ch }
  }
  result.push(current)
  return result
}
