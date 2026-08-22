import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  FileSpreadsheet,
  HardDrive,
  Layers,
  Loader2,
  Search,
} from 'lucide-react'
import { useData } from '../../context/useData'
import { getDatasetFromStore } from '../../lib/datasetStore'
import { formatBytes, type Dataset } from '../../lib/csvAnalyzer'
import './dashboard.css'

const full = new Intl.NumberFormat('es-MX')

const PAGE_SIZES = [10, 25, 50, 100]

interface CombinedRow {
  __source: string
  [column: string]: unknown
}

function pageWindow(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  let start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)
  start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function HistorialDatos() {
  const { history } = useData()

  const [datasets, setDatasets] = useState<Dataset[] | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const storedIds = useMemo(
    () => history.filter((e) => e.stored).map((e) => e.id),
    [history],
  )

  // Carga todos los datasets guardados para unir sus filas en una sola tabla
  useEffect(() => {
    if (storedIds.length === 0) return
    let cancelled = false
    void Promise.all(storedIds.map((id) => getDatasetFromStore(id)))
      .then((found) => {
        if (!cancelled) {
          setDatasets(found.filter((d): d is Dataset => d !== null))
        }
      })
      .catch(() => {
        if (!cancelled) setDatasets([])
      })
    return () => {
      cancelled = true
    }
  }, [storedIds])

  // Unión de columnas de todos los datasets, en orden de llegada
  const columns = useMemo(() => {
    if (!datasets?.length) return [] as string[]
    const seen = new Set<string>()
    const cols: string[] = []
    for (const ds of datasets) {
      for (const h of ds.headers) {
        if (!seen.has(h)) {
          seen.add(h)
          cols.push(h)
        }
      }
    }
    return cols
  }, [datasets])

  const rows: CombinedRow[] = useMemo(() => {
    if (!datasets) return []
    return datasets.flatMap((ds) =>
      ds.rows.map((r) => ({ __source: ds.fileName, ...r })),
    )
  }, [datasets])

  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.trim().toLowerCase()
    return rows.filter((row) =>
      Object.values(row).some(
        (v) => v != null && String(v).toLowerCase().includes(q),
      ),
    )
  }, [rows, query])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const pageRows = filteredRows.slice(startIndex, startIndex + pageSize)

  // Resumen global del historial
  const totalBytes = history.reduce((a, e) => a + e.sizeBytes, 0)
  const totalDups = history.reduce((a, e) => a + (e.duplicateRows ?? 0), 0)

  const stats = [
    {
      icon: Database,
      label: 'Cargas registradas',
      value: history.length > 0 ? full.format(history.length) : '—',
      sub: 'CSVs y versiones limpias',
    },
    {
      icon: Layers,
      label: 'Filas en la tabla',
      value:
        datasets && datasets.length > 0 ? full.format(rows.length) : '—',
      sub: 'Unión de todos los datasets',
    },
    {
      icon: FileSpreadsheet,
      label: 'Columnas combinadas',
      value: columns.length > 0 ? full.format(columns.length) : '—',
      sub: 'Campos únicos entre archivos',
    },
    {
      icon: HardDrive,
      label: 'Volumen acumulado',
      value: totalBytes > 0 ? formatBytes(totalBytes) : '—',
      sub:
        totalDups > 0
          ? `${full.format(totalDups)} duplicadas detectadas`
          : 'Peso total procesado',
    },
  ]

  return (
    <div className="overview">
      <header className="overview__head">
        <div>
          <h1>Historial de datos</h1>
          <p>
            Todas las filas de todos los CSV que has cargado, unidas en una sola
            tabla acumulada.
          </p>
        </div>
        <Link to="/dashboard/procesar" className="btn btn--primary">
          Procesar CSV
        </Link>
      </header>

      <section className="stats-grid">
        {stats.map((k) => (
          <article key={k.label} className="stat-card">
            <div className="stat-card__top">
              <span className="stat-card__icon">
                <k.icon size={20} />
              </span>
            </div>
            <p className="stat-card__label">{k.label}</p>
            <p className="stat-card__value">{k.value}</p>
            <p className="stat-card__sub">{k.sub}</p>
          </article>
        ))}
      </section>

      {history.length === 0 || storedIds.length === 0 || (datasets !== null && datasets.length === 0) ? (
        <section className="panel">
          <div className="link-card__empty">
            <Database size={30} strokeWidth={1.7} />
            <div>
              <strong>Todavía no hay datos que mostrar</strong>
              <p>
                Cada CSV que proceses se agregará automáticamente a esta tabla
                consolidada.
              </p>
              <Link to="/dashboard/procesar" className="btn btn--primary">
                Ir a Procesar Datos
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="panel warehouse">
          <div className="panel__head">
            <div>
              <h3>Tabla consolidada</h3>
              <p>Datos reales de todos tus datasets unidos fila por fila</p>
            </div>
            <span className="panel__tag panel__tag--soft">
              {full.format(columns.length)} columnas ·{' '}
              {full.format(rows.length)} filas totales
            </span>
          </div>

          {datasets === null ? (
            <div className="ok-note">
              <Loader2 size={18} className="spin" />
              Uniendo tus datasets…
            </div>
          ) : (
            <>
              <div className="table-toolbar">
                <div className="table-toolbar__search">
                  <Search size={16} />
                  <input
                    type="search"
                    placeholder="Buscar en todas las filas y columnas…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                  />
                </div>
                <label className="table-toolbar__size">
                  Filas por página
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                  >
                    {PAGE_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="table-scroll table-scroll--tall">
                <table className="data-table data-table--dense">
                  <thead>
                    <tr>
                      <th className="rownum">#</th>
                      <th>Origen</th>
                      {columns.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row, i) => (
                      <tr key={startIndex + i}>
                        <td className="rownum">{full.format(startIndex + i + 1)}</td>
                        <td>
                          <span className="mono historial-source">
                            {row.__source}
                          </span>
                        </td>
                        {columns.map((c) => {
                          const v = row[c]
                          return (
                            <td key={c}>
                              {v === undefined || v === null || v === ''
                                ? '—'
                                : String(v)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={columns.length + 2}
                          className="no-results"
                        >
                          Sin resultados para «{query}»
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <span className="pagination__info">
                  Mostrando{' '}
                  {filteredRows.length === 0
                    ? 0
                    : full.format(startIndex + 1)}
                  –
                  {full.format(
                    Math.min(startIndex + pageSize, filteredRows.length),
                  )}{' '}
                  de {full.format(filteredRows.length)}
                  {query ? ` (filtro: «${query}»)` : ''}
                </span>
                <div className="pagination__controls">
                  <button
                    onClick={() => setPage(1)}
                    disabled={safePage === 1}
                    aria-label="Primera página"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {pageWindow(safePage, totalPages).map((p) => (
                    <button
                      key={p}
                      className={p === safePage ? 'is-current' : ''}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={safePage === totalPages}
                    aria-label="Última página"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
