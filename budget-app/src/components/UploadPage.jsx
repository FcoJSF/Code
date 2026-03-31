import { useState, useRef, useEffect } from 'react'
import { getAllAccounts, saveAccount, deleteAccount } from '../utils/db.js'
import { parseCSV } from '../utils/csvParser.js'
import { Upload, Trash2, CheckCircle, AlertCircle, FileText } from 'lucide-react'

export default function UploadPage({ onUploaded }) {
  const [accounts, setAccounts] = useState([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState([]) // [{name, status, message}]
  const fileInputRef = useRef()

  useEffect(() => {
    getAllAccounts().then(setAccounts)
  }, [])

  async function handleFiles(files) {
    setUploading(true)
    const newResults = []

    for (const file of files) {
      try {
        const text = await file.text()
        const accountData = parseCSV(text, file.name)
        await saveAccount(accountData)
        newResults.push({
          name: file.name,
          status: 'success',
          message: `${accountData.transactions.length} transactions loaded as "${accountData.accountLabel}"`,
        })
      } catch (err) {
        newResults.push({
          name: file.name,
          status: 'error',
          message: err.message,
        })
      }
    }

    setResults(newResults)
    const updatedAccounts = await getAllAccounts()
    setAccounts(updatedAccounts)
    setUploading(false)

    if (newResults.some(r => r.status === 'success')) {
      setTimeout(onUploaded, 1200)
    }
  }

  function onFileInputChange(e) {
    const files = Array.from(e.target.files || [])
    if (files.length) handleFiles(files)
    e.target.value = ''
  }

  function onDrop(e) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'))
    if (files.length) handleFiles(files)
  }

  async function handleDelete(accountId) {
    await deleteAccount(accountId)
    setAccounts(prev => prev.filter(a => a.accountId !== accountId))
  }

  return (
    <div className="px-4 pt-6 pb-4 flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-slate-100">Upload CSV</h1>
      <p className="text-sm text-slate-400 -mt-3">
        Upload your bank CSV statements. Each file will be parsed and stored on your device.
      </p>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-500 active:border-indigo-400 transition-colors"
      >
        {uploading ? (
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Upload size={32} className="text-slate-500" />
        )}
        <div className="text-center">
          <p className="text-slate-300 font-medium text-sm">
            {uploading ? 'Processing...' : 'Tap to select CSV files'}
          </p>
          <p className="text-slate-500 text-xs mt-1">Credit card or checking account format</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          onChange={onFileInputChange}
          className="hidden"
        />
      </div>

      {/* Upload results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl ${
                r.status === 'success' ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'
              }`}
            >
              {r.status === 'success'
                ? <CheckCircle size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                : <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              }
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{r.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loaded accounts */}
      {accounts.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-slate-300">Loaded accounts</h2>
          {accounts.map(acc => (
            <div key={acc.accountId} className="bg-slate-900 rounded-xl p-3 flex items-center gap-3">
              <FileText size={18} className="text-indigo-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{acc.accountLabel}</p>
                <p className="text-xs text-slate-500 capitalize">{acc.type.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => handleDelete(acc.accountId)}
                className="p-2 text-slate-500 hover:text-red-400 active:text-red-300 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Format guide */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-2">Supported formats</h2>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-medium text-indigo-400 mb-1">Credit card</p>
            <code className="text-xs text-slate-400 font-mono">FECHA,CONSECUTIVO,CONCEPTO,IMPORTE</code>
          </div>
          <div>
            <p className="text-xs font-medium text-indigo-400 mb-1">Checking account</p>
            <code className="text-xs text-slate-400 font-mono">FECHA,HORA,SUCURSAL,CONCEPTO,RETIRO,DEPOSITO,SALDO,REFERENCIA</code>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            The app auto-detects the card name from the <code className="text-slate-400">Producto:</code> header line in the CSV.
          </p>
        </div>
      </div>
    </div>
  )
}
