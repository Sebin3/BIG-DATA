import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CalendarClock,
  Database,
  FileSpreadsheet,
  HardDrive,
  Layers,
} from 'lucide-react'
import { useData } from '../../context/useData'
import { useAuth } from '../../context/useAuth'
import { TYPE_LABELS, formatBytes } from '../../lib/csvAnalyzer'
import './dashboard.css'
import './Overview.css'

const PIE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--primary-line)',
]
const AMBER = 'var(--chart-warn)'
const GRID = 'var(--chart-grid)'
const TICK = 'var(--text-muted)'
const AREA_STROKE = 'var(--chart-1)'
const CURSOR_SOFT = 'var(--primary-light)'

function greeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Buenos días'
  if (hour >= 12 && hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const compact = new Intl.NumberFormat('es-MX', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const full = new Intl.NumberFormat('es-MX')

interface TooltipItem {
  name?: string | number
  value?: number | string
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
  formatValue?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((item, i) => (
        <p key={i} className="chart-tooltip__row">
          <span
            className="chart-tooltip__swatch"
            style={{ background: item.color }}
          />
          {item.name}:{' '}
          <strong>
            {formatValue && typeof item.value === 'number'
              ? formatValue(item.value)
              : item.value}
          </strong>
        </p>
      ))}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="empty-chart">
      <Database size={30} strokeWidth={1.7} />
      <strong>Sin datos vinculados</strong>
      <small>
        Sube tu primer CSV desde Procesar Datos para generar esta vista.
      </small>
      <Link to="/dashboard/procesar">Ir a Procesar Datos</Link>
    </div>
  )
}

function shortDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Principal() {
  const { dataset, history } = useData()
  const { user } = useAuth()

  const firstName = user?.name.split(' ')[0] ?? 'Usuario'

  const revenueCol = useMemo(() => {
    if (!dataset?.roles.revenue) return null
    return dataset.columns.find((c) => c.name === dataset.roles.revenue) ?? null
  }, [dataset])

  // ---- KPIs globales: agregados de TODOS los datasets integrados ----
  const totalDatasets = history.length
  const storedCount = history.filter((e) => e.stored).length
  const globalRows = history.reduce((a, e) => a + e.rowCount, 0)
  const globalBytes = history.reduce((a, e) => a + e.sizeBytes, 0)
  const lastEntry =
    totalDatasets > 0
      ? [...history].sort(
          (a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt),
        )[0]
      : null

  const dupChartData = history
    .filter((e) => typeof e.duplicateRows === 'number')
    .sort((a, b) => (b.duplicateRows ?? 0) - (a.duplicateRows ?? 0))
    .slice(0, 6)
    .map((e) => ({
      name: e.fileName,
      unicas: Math.max(e.rowCount - (e.duplicateRows ?? 0), 0),
      dup: e.duplicateRows ?? 0,
    }))
  const dupTotal = history.reduce((a, e) => a + (e.duplicateRows ?? 0), 0)

  const shortDateTime = (iso: string) =>
    new Date(iso).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  const kpis = [
    {
      icon: Database,
      label: 'Datasets integrados',
      value: totalDatasets > 0 ? full.format(totalDatasets) : '—',
      sub:
        storedCount > 0
          ? `${storedCount} con copia guardada`
          : 'Se guardan al procesarlos',
    },
    {
      icon: Layers,
      label: 'Registros acumulados',
      value: globalRows > 0 ? full.format(globalRows) : '—',
      sub:
        totalDatasets > 0
          ? `≈ ${full.format(Math.round(globalRows / totalDatasets))} por dataset`
          : 'A la espera de tu primer CSV',
    },
    {
      icon: HardDrive,
      label: 'Volumen procesado',
      value: globalBytes > 0 ? formatBytes(globalBytes) : '—',
      sub:
        totalDatasets > 0
          ? `${formatBytes(Math.round(globalBytes / totalDatasets))} en promedio por archivo`
          : 'Sin información aún',
    },
    {
      icon: CalendarClock,
      label: 'Última carga',
      value: lastEntry ? shortDateTime(lastEntry.uploadedAt) : '—',
      sub: lastEntry ? lastEntry.fileName : 'No has cargado datasets',
    },
  ]

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const totalTypes = dataset
    ? dataset.insights.typeDistribution.reduce((a, b) => a + b.value, 0)
    : 0

  const axisMoney = (v: number) => `$${compact.format(v)}`

  return (
    <div className="overview">
      <header className="overview__head">
        <div>
          <h1>
            {greeting()}, {firstName} 👋
          </h1>
          <p className="overview__date">{today}</p>
        </div>
        {dataset ? (
          <span className="file-chip" title={dataset.fileName}>
            <FileSpreadsheet size={15} />
            {dataset.fileName}
            <small>· {full.format(dataset.rowCount)} filas vinculadas</small>
          </span>
        ) : (
          <Link to="/dashboard/procesar" className="btn btn--primary">
            Procesar CSV
          </Link>
        )}
      </header>

      <section className="stats-grid">
        {kpis.map((k) => (
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

      <section className="panel">
        <div className="panel__head">
          <div>
            <h3>Filas duplicadas por dataset</h3>
            <p>Comparativo global de registros repetidos detectados al procesar cada CSV</p>
          </div>
          {dupTotal > 0 && (
            <span className="panel__tag panel__tag--soft">
              {full.format(dupTotal)} duplicadas en total
            </span>
          )}
        </div>
        {dupChartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={dupChartData}
                layout="vertical"
                margin={{ top: 4, right: 24, bottom: 0, left: 8 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="4 6" stroke={GRID} horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 12 }}
                  tickFormatter={compact.format}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 11.5 }}
                  tickFormatter={(v: string) =>
                    v.length > 20 ? `${v.slice(0, 19)}…` : v
                  }
                />
                <Tooltip
                  cursor={{ fill: CURSOR_SOFT }}
                  content={<ChartTooltip formatValue={(v) => full.format(v)} />}
                />
                <Bar
                  dataKey="unicas"
                  name="Únicas"
                  stackId="dups"
                  fill="var(--chart-3)"
                />
                <Bar
                  dataKey="dup"
                  name="Duplicadas"
                  stackId="dups"
                  fill={AMBER}
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <ul className="legend-list legend-list--row">
              <li>
                <span className="legend-list__dot" style={{ background: 'var(--chart-3)' }} />
                Registros únicos
              </li>
              <li>
                <span className="legend-list__dot" style={{ background: AMBER }} />
                Filas duplicadas
              </li>
            </ul>
          </>
        ) : (
          <div className="ok-note">
            ✓ Los duplicados se mostrarán aquí conforme proceses tus CSV
          </div>
        )}
      </section>

      <section className="charts-grid">
        <article className="panel">
          <div className="panel__head">
            <div>
              <h3>{dataset?.insights.timelineTitle || 'Evolución temporal'}</h3>
              <p>Agregación mensual detectada automáticamente</p>
            </div>
            {dataset?.insights.timeline && (
              <span className="panel__tag">
                {dataset.insights.timeline.length} periodos
              </span>
            )}
          </div>
          {dataset?.insights.timeline ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={dataset.insights.timeline}
                margin={{ top: 10, right: 8, bottom: 0, left: -8 }}
              >
                <defs>
                  <linearGradient id="gradTimeline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AREA_STROKE} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={AREA_STROKE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 12 }}
                  tickFormatter={revenueCol ? axisMoney : compact.format}
                />
                <Tooltip
                  cursor={{ stroke: CURSOR_SOFT, strokeWidth: 2 }}
                  content={
                    <ChartTooltip
                      formatValue={(v) =>
                        revenueCol ? money.format(v) : full.format(v)
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  name={revenueCol ? 'Ingresos' : 'Registros'}
                  dataKey="value"
                  stroke={AREA_STROKE}
                  strokeWidth={2.6}
                  fill="url(#gradTimeline)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </article>

        <article className="panel">
          <div className="panel__head">
            <div>
              <h3>Tipos de dato</h3>
              <p>Composición inferida de las columnas</p>
            </div>
          </div>
          {dataset ? (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={dataset.insights.typeDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={3}
                    cornerRadius={6}
                    strokeWidth={0}
                  >
                    {dataset.insights.typeDistribution.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <ul className="legend-list">
                {dataset.insights.typeDistribution.map((t, i) => (
                  <li key={t.name}>
                    <span
                      className="legend-list__dot"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    {t.name}
                    <strong>
                      {Math.round((t.value / totalTypes) * 100)}% · {t.value}
                    </strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyChart />
          )}
        </article>
      </section>

      <section className="charts-grid charts-grid--trio">
        <article className="panel">
          <div className="panel__head">
            <div>
              <h3>Valores faltantes</h3>
              <p>Celdas vacías por columna</p>
            </div>
          </div>
          {dataset && dataset.insights.missingByColumn.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={dataset.insights.missingByColumn}
                layout="vertical"
                margin={{ top: 4, right: 20, bottom: 0, left: 8 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="4 6" stroke={GRID} horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: CURSOR_SOFT }}
                  content={<ChartTooltip formatValue={(v) => full.format(v)} />}
                />
                <Bar dataKey="missing" name="Faltantes" fill={AMBER} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : dataset ? (
            <div className="ok-note">✓ Sin celdas vacías detectadas</div>
          ) : (
            <EmptyChart />
          )}
        </article>

        <article className="panel">
          <div className="panel__head">
            <div>
              <h3>Distribución de montos</h3>
              <p>
                Histograma de{' '}
                {dataset?.insights.histogramColumn
                  ? `"${dataset.insights.histogramColumn}"`
                  : 'valores numéricos'}
              </p>
            </div>
          </div>
          {dataset?.insights.histogram ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={dataset.insights.histogram}
                margin={{ top: 4, right: 8, bottom: 0, left: -14 }}
                barSize={26}
              >
                <CartesianGrid strokeDasharray="4 6" stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="bin"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 10.5 }}
                  interval={0}
                  angle={-32}
                  textAnchor="end"
                  height={52}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 12 }}
                  tickFormatter={compact.format}
                />
                <Tooltip
                  cursor={{ fill: CURSOR_SOFT }}
                  content={<ChartTooltip formatValue={(v) => full.format(v)} />}
                />
                <Bar dataKey="count" name="Filas" fill={AREA_STROKE} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </article>

        <article className="panel">
          <div className="panel__head">
            <div>
              <h3>
                {dataset?.insights.topCategoriesTitle || 'Categorías principales'}
              </h3>
              <p>Ranking según la columna categórica dominante</p>
            </div>
          </div>
          {dataset?.insights.topCategories ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={dataset.insights.topCategories}
                layout="vertical"
                margin={{ top: 4, right: 20, bottom: 0, left: 8 }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="4 6" stroke={GRID} horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 12 }}
                  tickFormatter={compact.format}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={104}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: TICK, fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: CURSOR_SOFT }}
                  content={<ChartTooltip formatValue={(v) => full.format(v)} />}
                />
                <Bar dataKey="value" name="Total" radius={[0, 8, 8, 0]}>
                  {dataset.insights.topCategories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={1 - i * 0.11} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel__head">
          <div>
            <h3>Resumen de columnas</h3>
            <p>
              Perfil estadístico generado durante el procesamiento
            </p>
          </div>
          {dataset && (
            <span className="panel__tag panel__tag--soft">
              {dataset.columnCount} columnas · {(dataset.processMs / 1000).toFixed(2)} s
            </span>
          )}
        </div>
        {dataset ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Columna</th>
                  <th>Tipo</th>
                  <th>Faltantes</th>
                  <th>Únicos</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {dataset.columns.map((col) => (
                  <tr key={col.name}>
                    <td>
                      <strong className="mono">{col.name}</strong>
                    </td>
                    <td>
                      <span className={`type-badge type-badge--${col.type}`}>
                        {TYPE_LABELS[col.type]}
                      </span>
                    </td>
                    <td>
                      {col.missing > 0
                        ? `${full.format(col.missing)} (${((col.missing / Math.max(dataset.rowCount, 1)) * 100).toFixed(1)}%)`
                        : '0'}
                    </td>
                    <td>{col.unique === null ? '—' : full.format(col.unique)}</td>
                    <td>
                      {col.stats.min !== undefined && col.stats.max !== undefined
                        ? `min ${full.format(Math.round(col.stats.min * 100) / 100)} · máx ${full.format(Math.round(col.stats.max * 100) / 100)} · media ${full.format(Math.round((col.stats.mean ?? 0) * 100) / 100)}`
                        : col.stats.minDate
                          ? `${shortDate(col.stats.minDate)} → ${shortDate(col.stats.maxDate)}`
                          : col.stats.top?.[0]
                            ? `"${col.stats.top[0].label}" × ${full.format(col.stats.top[0].count)}`
                            : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyChart />
        )}
      </section>
    </div>
  )
}
