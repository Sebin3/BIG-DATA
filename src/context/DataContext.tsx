import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DataContext } from './data.context'
import type { Dataset, HistoryEntry } from '../lib/csvAnalyzer'
import {
  getDatasetFromStore,
  saveDatasetToStore,
} from '../lib/datasetStore'

const HISTORY_KEY = 'crm_data_history'
const ACTIVE_KEY = 'crm_active_dataset'
const MAX_HISTORY = 500

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function readActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

function writeActiveId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>(() => readHistory())

  // Al abrir la app, revincula automáticamente el último CSV activo.
  useEffect(() => {
    const id = readActiveId()
    if (!id) return
    let cancelled = false
    void getDatasetFromStore(id)
      .then((found) => {
        if (cancelled) return
        if (found) {
          setDataset(found)
        } else {
          writeActiveId(null)
          setHistory((prev) =>
            prev.map((e) => (e.id === id ? { ...e, stored: false } : e)),
          )
        }
      })
      .catch(() => {
        if (!cancelled) writeActiveId(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(0, MAX_HISTORY)),
      )
    } catch {
      /* almacenamiento no disponible */
    }
  }, [history])

  const saveDataset = useCallback((next: Dataset) => {
    setDataset(next)
    writeActiveId(next.id)
    setHistory((prev) => {
      const entry: HistoryEntry = {
        id: next.id,
        fileName: next.fileName,
        sizeBytes: next.sizeBytes,
        rowCount: next.rowCount,
        columnCount: next.columnCount,
        uploadedAt: next.uploadedAt,
        processMs: next.processMs,
        stored: false,
        duplicateRows: next.duplicateRows,
      }
      return [entry, ...prev.filter((e) => e.id !== next.id)].slice(0, MAX_HISTORY)
    })

    void saveDatasetToStore(next)
      .then(() => {
        setHistory((prev) =>
          prev.map((e) => (e.id === next.id ? { ...e, stored: true } : e)),
        )
      })
      .catch(() => {
        setHistory((prev) =>
          prev.map((e) => (e.id === next.id ? { ...e, stored: false } : e)),
        )
      })
  }, [])

  const restoreFromHistory = useCallback(async (id: string) => {
    try {
      const found = await getDatasetFromStore(id)
      if (!found) return false
      setDataset(found)
      writeActiveId(id)
      return true
    } catch {
      return false
    }
  }, [])

  const value = useMemo(
    () => ({ dataset, history, saveDataset, restoreFromHistory }),
    [dataset, history, saveDataset, restoreFromHistory],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
