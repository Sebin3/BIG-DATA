import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
  Database,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './Login.css'

type Mode = 'login' | 'register'

const HIGHLIGHTS = [
  { icon: Database, text: 'Perfilado de millones de registros al instante' },
  { icon: ShieldCheck, text: 'Acceso protegido con verificación OTP' },
  { icon: BarChart3, text: 'Panel ejecutivo con analítica clara' },
]

export default function Login() {
  const { startLogin, startRegister } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const fillDemo = () => {
    setMode('login')
    setEmail('demo@bigdata.io')
    setPassword('demo123')
    setError('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (mode === 'login') {
        startLogin(email, password)
      } else {
        if (!name.trim()) throw new Error('Escribe tu nombre para continuar.')
        if (password.length < 6)
          throw new Error('La contraseña debe tener al menos 6 caracteres.')
        startRegister(name, email, password)
      }
      navigate('/verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
    }
  }

  return (
    <div className="auth">
      <aside className="auth__aside">
        <Logo variant="light" />
        <div className="auth__aside-body">
          <h2>
            Vuelve al centro de <span>control de tus datos</span>
          </h2>
          <p>
            Conecta con tu espacio de análisis y sigue explorando el Big Data
            que impulsa las decisiones de tu empresa.
          </p>
          <ul className="auth__highlights">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="auth__highlight-icon">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="auth__aside-glow" aria-hidden="true" />
      </aside>

      <main className="auth__main">
        <div className="auth__theme">
          <ThemeToggle />
        </div>

        <div className="auth__card">
          <div className="auth__head">
            <h1>{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
            <p>
              {mode === 'login'
                ? 'Ingresa tus credenciales para acceder al dashboard.'
                : 'Regístrate en segundos y empieza a analizar tus datos.'}
            </p>
          </div>

          <div className="auth__tabs" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'is-active' : ''}
              onClick={() => {
                setMode('login')
                setError('')
              }}
            >
              Iniciar sesión
            </button>
            <button
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'is-active' : ''}
              onClick={() => {
                setMode('register')
                setError('')
              }}
            >
              Registrarme
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <label className="field">
                <span>Nombre completo</span>
                <div className="field__control">
                  <UserIcon size={18} className="field__icon" />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>
              </label>
            )}

            <label className="field">
              <span>Correo electrónico</span>
              <div className="field__control">
                <Mail size={18} className="field__icon" />
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </label>

            <label className="field">
              <span>Contraseña</span>
              <div className="field__control">
                <Lock size={18} className="field__icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === 'login' ? 'current-password' : 'new-password'
                  }
                />
                <button
                  type="button"
                  className="field__toggle"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <p className="auth__error">{error}</p>}

            <button type="submit" className="btn btn--primary btn--lg auth__submit">
              {mode === 'login' ? 'Entrar al dashboard' : 'Crear cuenta'}
              <ArrowRight size={18} />
            </button>
          </form>

          <button type="button" className="auth__demo" onClick={fillDemo}>
            Probar con la cuenta demo
          </button>

          <p className="auth__foot">
            <Link to="/">← Volver al inicio</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
