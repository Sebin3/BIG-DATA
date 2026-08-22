import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  FileSpreadsheet,
  Layers,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useData } from '../../context/useData'
import HistoryTable from '../../components/HistoryTable'
import {
  TYPE_LABELS,
  cleanDataset,
  formatBytes,
  type CleanOptions,
  type CleanReport,
} from '../../lib/csvAnalyzer'
import './dashboard.css'
import './LimpiezaDatos.css'

const full = new Intl.NumberFormat('es-MX')

const PAGE_SIZES = [10, 25, 50, 100]

function pageWindow(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  let start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)
  start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function LimpiezaDatos() {
  const { dataset, history, saveDataset } = useData()

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [options, setOptions] = useState<CleanOptions>({
    removeDuplicates: false,
    fillNumeric: false,
    fillCategorical: false,
  })
  const [cleaning, setCleaning] = useState(false)
  const [lastReport, setLastReport] = useState<{
    report: CleanReport
    fileName: string
  } | null>(null)

  const filteredRows = useMemo(() => {
    if (!dataset) return []
    const q = query.trim().toLowerCase()
    if (!q) return dataset.rows
    return dataset.rows.filter((row) =>
      dataset.headers.some((h) => (row[h] ?? '').toLowerCase().includes(q)),
    )
  }, [dataset, query])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * pageSize
  const visibleRows = filteredRows.slice(startIndex, startIndex + pageSize)

  const numericMissing =
    dataset?.columns.reduce(
      (acc, c) => (c.type === 'numeric' ? acc + c.missing : acc),
      0,
    ) ?? 0
  const otherMissing =
    dataset?.columns.reduce(
      (acc, c) => (c.type !== 'numeric' ? acc + c.missing : acc),
      0,
    ) ?? 0
  const dupCount = dataset?.duplicateRows ?? 0

  const nothingToClean =
    dupCount === 0 && numericMissing === 0 && otherMissing === 0

  const handleClean = async () => {
    if (!dataset || cleaning || nothingToClean) return
    setCleaning(true)
    setLastReport(null)
    try {
      const result = await cleanDataset(dataset, options)
      saveDataset(result.dataset)
      setLastReport({ report: result.report, fileName: result.dataset.fileName })
      setPage(1)
    } finally {
      setCleaning(false)
    }
  }

  const toggleOption = (key: keyof CleanOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const findings =
    dataset?.columns.filter((c) => c.missing > 0).sort((a, b) => b.missing - a.missing) ??
    []

  return (
    <div className="limpieza">
      <header className="limpieza__head">
        <div>
          <h1>Limpieza de datos</h1>
          <p>
            Explora el dataset completo, elimina filas duplicadas y rellena
            valores faltantes. Cada limpieza genera una versión nueva y trazable
            en tu historial.
          </p>
        </div>
        <Link to="/dashboard/procesar" className="btn btn--ghost">
          Procesar otro CSV
        </Link>
      </header>

      {!dataset ? (
        <section className="panel">
          <div className="link-card__empty">
            <Database size={30} strokeWidth={1.7} />
            <div>
              <strong>No hay un CSV vinculado actualmente</strong>
              <p>
                Procesa un archivo para explorar sus datos en la tabla y ejecutar
                limpiezas. También puedes abrir cualquier dataset guardado desde
                la lista de abajo.
              </p>
              <Link to="/dashboard/procesar" className="btn btn--primary">
                Ir a Procesar Datos
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="panel link-strip">
            <span className="file-chip" title={dataset.fileName}>
              <FileSpreadsheet size={15} />
              {dataset.fileName}
            </span>
            <ul className="link-strip__meta">
              <li>{formatBytes(dataset.sizeBytes)}</li>
              <li>{full.format(dataset.rowCount)} filas</li>
              <li>{dataset.columnCount} columnas</li>
              <li>Completitud {dataset.completeness.toFixed(1)}%</li>
              <li>{dataset.duplicateRows} duplicadas</li>
            </ul>
          </section>

          <section className="panel">
            <div className="panel__head">
              <div>
                <h3>Tabla de datos</h3>
                <p>Dataset completo cargado desde el CSV activo</p>
              </div>
              <span className="panel__tag panel__tag--soft">
                {full.format(filteredRows.length)}{' '}
                {query ? 'coincidencias' : 'filas'}
              </span>
            </div>

            <div className="table-toolbar">
              <div className="table-toolbar__search">
                <Search size={16} />
                <input
                  type="search"
                  placeholder="Buscar en todas las columnas…"
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
                    {dataset.headers.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, i) => (
                    <tr key={startIndex + i}>
                      <td className="rownum">{full.format(startIndex + i + 1)}</td>
                      {dataset.headers.map((h) => (
                        <td key={h}>{row[h] || ''}</td>
                      ))}
                    </tr>
                  ))}
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={dataset.headers.length + 1} className="no-results">
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
                –{full.format(Math.min(startIndex + pageSize, filteredRows.length))}{' '}
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
          </section>

          <section className="charts-grid charts-grid--limpieza">
            <article className="panel">
              <div className="panel__head">
                <div>
                  <h3>Operaciones de limpieza</h3>
                  <p>
                    Se genera «{dataset.fileName.replace(/\.csv$/i, '')} (limpio).csv»
                    como nueva versión trazable
                  </p>
                </div>
              </div>

              {nothingToClean ? (
                <div className="clean-ok">
                  <ShieldCheck size={22} />
                  Este dataset no tiene duplicados ni celdas vacías que corregir.
                </div>
              ) : (
                <>
                  <ul className="clean-options">
                    <li>
                      <label>
                        <input
                          type="checkbox"
                          checked={options.removeDuplicates}
                          disabled={dupCount === 0}
                          onChange={() => toggleOption('removeDuplicates')}
                        />
                        <span>
                          Eliminar filas duplicadas
                          <small>
                            {dupCount > 0
                              ? `${full.format(dupCount)} filas idénticas detectadas`
                              : 'Sin duplicados'}
                          </small>
                        </span>
                      </label>
                    </li>
                    <li>
                      <label>
                        <input
                          type="checkbox"
                          checked={options.fillNumeric}
                          disabled={numericMissing === 0}
                          onChange={() => toggleOption('fillNumeric')}
                        />
                        <span>
                          Rellenar numéricos con la mediana
                          <small>
                            {numericMissing > 0
                              ? `${full.format(numericMissing)} celdas vacías en columnas numéricas`
                              : 'Sin faltantes numéricos'}
                          </small>
                        </span>
                      </label>
                    </li>
                    <li>
                      <label>
                        <input
                          type="checkbox"
                          checked={options.fillCategorical}
                          disabled={otherMissing === 0}
                          onChange={() => toggleOption('fillCategorical')}
                        />
                        <span>
                          Rellenar texto/categorías con el valor frecuente
                          <small>
                            {otherMissing > 0
                              ? `${full.format(otherMissing)} celdas vacías en demás columnas`
                              : 'Sin otros faltantes'}
                          </small>
                        </span>
                      </label>
                    </li>
                  </ul>

                  <button
                    className="btn btn--primary clean-btn"
                    onClick={() => void handleClean()}
                    disabled={
                      cleaning ||
                      (!options.removeDuplicates &&
                        !options.fillNumeric &&
                        !options.fillCategorical)
                    }
                  >
                    {cleaning ? (
                      <Loader2 size={17} className="spin" />
                    ) : (
                      <Sparkles size={17} />
                    )}
                    {cleaning ? 'Limpiando…' : 'Ejecutar limpieza'}
                  </button>
                </>
              )}

              {lastReport && (
                <p className="clean-report">
                  <CheckCircle2 size={17} />
                  <span>
                    Listo: <b>{lastReport.report.removedDuplicates}</b> duplicados
                    eliminados, <b>{full.format(lastReport.report.filledCells)}</b>{' '}
                    celdas rellenadas ({full.format(lastReport.report.rowsBefore)} →{' '}
                    {full.format(lastReport.report.rowsAfter)} filas). Guardada como{' '}
                    <b className="mono">{lastReport.fileName}</b>.
                  </span>
                </p>
              )}
            </article>

            <article className="panel">
              <div className="panel__head">
                <div>
                  <h3>Hallazgos de calidad</h3>
                  <p>Pendientes según el último perfilado</p>
                </div>
                {findings.length === 0 && dupCount === 0 && (
                  <span className="panel__tag">
                    <ShieldCheck size={13} /> Saludable
                  </span>
                )}
              </div>

              {findings.length === 0 && dupCount === 0 ? (
                <div className="ok-note ok-note--sm">
                  ✓ Sin problemas de calidad detectados
                </div>
              ) : (
                <ul className="findings">
                  {dupCount > 0 && (
                    <li className="finding finding--warn">
                      <Layers size={17} />
                      <div>
                        <strong>{full.format(dupCount)} filas duplicadas</strong>
                        <small>Coinciden en todas sus columnas.</small>
                      </div>
                    </li>
                  )}
                  {findings.slice(0, 8).map((col) => (
                    <li key={col.name} className="finding">
                      <TriangleAlert size={17} />
                      <div>
                        <strong>
                          «{col.name}» · {TYPE_LABELS[col.type]}
                        </strong>
                        <small>
                          {full.format(col.missing)} faltantes (
                          {((col.missing / Math.max(dataset.rowCount, 1)) * 100).toFixed(1)}
                          %)
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      )}

      <section className="panel">
        <div className="panel__head">
          <div>
            <h3>Historial de datasets</h3>
            <p>
              Todas las versiones procesadas quedan guardadas. Abre cualquiera
              sin volver a procesar su archivo.
            </p>
          </div>
          <span className="panel__tag panel__tag--soft">
            <Database size={13} /> {history.length} registros
          </span>
        </div>

        {history.length > 0 ? (
          <HistoryTable activeId={dataset?.id} />
        ) : (
          <div className="ok-note ok-note--sm history-empty">
            Aún no hay cargas registradas. Procesa tu primer CSV para comenzar el
            historial.
          </div>
        )}
      </section>
    </div>
  )
}
