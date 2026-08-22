import { useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileUp,
  Gauge,
  Layers,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { useData } from '../../context/useData'
import {
  analyzeCsvFile,
  formatBytes,
  formatDuration,
  type ProcessPhase,
} from '../../lib/csvAnalyzer'
import './dashboard.css'
import './ProcesarDatos.css'

const STEPS: { key: ProcessPhase; label: string; detail: string }[] = [
  { key: 'validating', label: 'Validando formato', detail: 'Extensión y tipo MIME del archivo' },
  { key: 'reading', label: 'Leyendo archivo', detail: 'Parser CSV con detección de encabezados' },
  { key: 'analyzing', label: 'Analizando columnas', detail: 'Tipos, estadísticos y valores faltantes' },
  { key: 'finalizing', label: 'Integrando al panel', detail: 'Generación de métricas y series' },
]

const STEP_ORDER: ProcessPhase[] = ['idle', 'validating', 'reading', 'analyzing', 'finalizing', 'done']

function stepState(stepKey: ProcessPhase, phase: ProcessPhase) {
  if (phase === 'done') return 'done'
  const currentIdx = STEP_ORDER.indexOf(phase)
  const stepIdx = STEP_ORDER.indexOf(stepKey)
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'current'
  return 'pending'
}

export default function ProcesarDatos() {
  const { dataset, saveDataset } = useData()
  const [phase, setPhase] = useState<ProcessPhase>('idle')
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [lastProcessed, setLastProcessed] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  const busy = phase !== 'idle' && phase !== 'done'

  const handleFile = async (file: File | undefined | null) => {
    if (!file || busy) return
    setError('')
    try {
      const result = await analyzeCsvFile(file, setPhase)
      saveDataset(result)
      setLastProcessed(result.fileName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
      setPhase('idle')
    }
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragActive(false)
    void handleFile(e.dataTransfer.files?.[0])
  }

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!busy) setDragActive(true)
  }

  const previewHeaders = dataset?.headers.slice(0, 6) ?? []
  const previewRows = dataset?.rows.slice(0, 8) ?? []

  return (
    <div className="procesar">
      <header className="procesar__head">
        <div>
          <h1>Procesar datos</h1>
          <p>
            Carga un archivo CSV para que el motor lo lea, lo perfile y actualice
            automáticamente todas las métricas del Panel General.
          </p>
        </div>
        <Link to="/dashboard" className="btn btn--ghost">
          Ver panel general
        </Link>
      </header>

      <div className="procesar__grid">
        <section className="procesar__main">
          <div
            className={`dropzone ${dragActive ? 'is-drag' : ''} ${busy ? 'is-busy' : ''}`}
            onClick={() => !busy && inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={() => setDragActive(false)}
            role="button"
            tabIndex={0}
            aria-disabled={busy}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !busy) {
                inputRef.current?.click()
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                void handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            {busy ? (
              <>
                <span className="dropzone__spinner">
                  <Loader2 size={34} className="spin" />
                </span>
                <strong>Procesando archivo…</strong>
                <small>No cierres ni recargues la ventana</small>
              </>
            ) : (
              <>
                <span className="dropzone__icon">
                  <FileUp size={30} strokeWidth={1.8} />
                </span>
                <strong>
                  Arrastra tu archivo CSV o haz clic para seleccionarlo
                </strong>
                <small>
                  El motor infiere tipos de dato, estadísticos y calidad automáticamente
                </small>
                <span className="dropzone__hint">CSV · UTF-8 · máx. 200,000 filas</span>
              </>
            )}
          </div>

          {error && (
            <p className="procesar__error">
              <AlertTriangle size={17} /> {error}
            </p>
          )}

          {!error && lastProcessed && (
            <p className="procesar__ok">
              <CheckCircle2 size={17} /> «{lastProcessed}» se integró correctamente al panel.
            </p>
          )}

          {dataset && (
            <article className="panel active-file">
              <div className="panel__head">
                <div>
                  <h3>Archivo activo en el panel</h3>
                  <p>Este dataset alimenta todas las vistas del Panel General</p>
                </div>
                <span className="panel__tag">
                  <Gauge size={13} /> Completitud {dataset.completeness.toFixed(1)}%
                </span>
              </div>

              <ul className="active-file__meta">
                <li>
                  <FileSpreadsheet size={16} />
                  <strong className="mono">{dataset.fileName}</strong>
                </li>
                <li>{formatBytes(dataset.sizeBytes)}</li>
                <li>{new Intl.NumberFormat('es-MX').format(dataset.rowCount)} filas</li>
                <li>{dataset.columnCount} columnas</li>
                <li>{formatDuration(dataset.processMs)}</li>
                <li>
                  <Layers size={14} /> {dataset.duplicateRows} duplicadas
                </li>
              </ul>

              <div className="preview-wrap">
                <table className="data-table preview-table">
                  <thead>
                    <tr>
                      {previewHeaders.map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {previewHeaders.map((h) => (
                          <td key={h}>{row[h] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="preview-note">
                Vista previa de las primeras 8 filas ·{' '}
                {dataset.headers.length > 6
                  ? `mostrando 6 de ${dataset.headers.length} columnas`
                  : `${dataset.headers.length} columnas`}
              </p>
            </article>
          )}
        </section>

        <aside className="procesar__side">
          <article className="panel pipeline">
            <div className="panel__head">
              <div>
                <h3>Pipeline de proceso</h3>
                <p>Ejecución paso a paso del motor</p>
              </div>
              {!busy && (
                <button
                  className="pipeline__reset"
                  onClick={() => setPhase('idle')}
                  title="Reiniciar pipeline"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
            <ol className="pipeline__steps">
              {STEPS.map((step) => {
                const state = stepState(step.key, phase)
                return (
                  <li key={step.key} className={`pipeline__step is-${state}`}>
                    <span className="pipeline__dot">
                      {state === 'done' ? (
                        <CheckCircle2 size={18} />
                      ) : state === 'current' ? (
                        <Loader2 size={18} className="spin" />
                      ) : (
                        <span className="pipeline__pending-dot" />
                      )}
                    </span>
                    <div>
                      <strong>{step.label}</strong>
                      <small>{step.detail}</small>
                    </div>
                  </li>
                )
              })}
            </ol>
          </article>

          <article className="panel">
            <div className="panel__head">
              <div>
                <h3>Formato recomendado</h3>
                <p>Columnas ideales para el dominio de ventas</p>
              </div>
            </div>
            <p className="format-text">
              El motor detecta semánticamente las columnas para rotular las
              gráficas con nombres reales:
            </p>
            <ul className="format-list">
              {[
                ['fecha', 'Serie temporal mensual'],
                ['producto', 'Contexto de detalle'],
                ['categoria', 'Ranking por categoría'],
                ['cantidad', 'Volumen vendido'],
                ['precio_unitario', 'Se excluye del total'],
                ['total', 'KPI de ingresos'],
                ['canal', 'Composición de ventas'],
                ['region', 'Segmentación opcional'],
              ].map(([col, why]) => (
                <li key={col}>
                  <code>{col}</code>
                  <small>{why}</small>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </div>
  )
}
