import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Loader2, LifeBuoy, Settings } from 'lucide-react'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import ProtectedRoute, { GuestRoute, PendingRoute } from './components/ProtectedRoute'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Verify = lazy(() => import('./pages/Verify'))
const DashboardLayout = lazy(() => import('./layouts/DashboardLayout'))
const Principal = lazy(() => import('./pages/dashboard/Principal'))
const ProcesarDatos = lazy(() => import('./pages/dashboard/ProcesarDatos'))
const LimpiezaDatos = lazy(() => import('./pages/dashboard/LimpiezaDatos'))
const HistorialDatos = lazy(() => import('./pages/dashboard/HistorialDatos'))
const Placeholder = lazy(() => import('./pages/dashboard/Placeholder'))

function RouteFallback() {
  return (
    <div className="route-loader" role="status" aria-label="Cargando">
      <Loader2 size={32} className="route-loader__spinner" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <DataProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <Login />
                  </GuestRoute>
                }
              />
              <Route
                path="/verify"
                element={
                  <PendingRoute>
                    <Verify />
                  </PendingRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Principal />} />
                <Route path="procesar" element={<ProcesarDatos />} />
                <Route path="limpieza" element={<LimpiezaDatos />} />
                <Route path="historial" element={<HistorialDatos />} />
                <Route
                  path="configuracion"
                  element={
                    <Placeholder
                      title="Configuración"
                      description="Ajusta las preferencias de tu cuenta, la apariencia del panel y la gestión de tu equipo."
                      icon={Settings}
                    />
                  }
                />
                <Route
                  path="ayuda"
                  element={
                    <Placeholder
                      title="Ayuda y soporte"
                      description="Consulta guías, atajos del panel y contáctanos si necesitas ayuda con tus análisis de datos."
                      icon={LifeBuoy}
                    />
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </DataProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
