import { createContext } from 'react'
import type { Dataset, HistoryEntry } from '../lib/csvAnalyzer'

export interface DataContextValue {
  dataset: Dataset | null
  history: HistoryEntry[]
  saveDataset: (dataset: Dataset) => void
  restoreFromHistory: (id: string) => Promise<boolean>
}

export const DataContext = createContext<DataContextValue | null>(null)
