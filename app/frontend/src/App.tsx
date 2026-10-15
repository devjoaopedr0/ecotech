import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PlantsProvider } from './context/PlantsContext';
import ProtectedRoute from './routes/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import VisaoGeral from './pages/VisaoGeral';
import Dashboard from './pages/Dashboard';
import Monitor from './pages/Monitor';
import Plantas from './pages/Plantas';
import Configuracoes from './pages/Configuracoes';
import Watch from './pages/Watch';
import { useIsWatch } from './hooks/useIsWatch';

function AppRoutes() {
  const isWatch = useIsWatch();

  // No Apple Watch só existem o login e o controle de irrigação.
  if (isWatch) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Watch />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>{(openMenu: () => void) => <VisaoGeral openMenu={openMenu} />}</MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>{(openMenu: () => void) => <Dashboard openMenu={openMenu} />}</MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitor"
        element={
          <ProtectedRoute>
            <MainLayout>{(openMenu: () => void) => <Monitor openMenu={openMenu} />}</MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plantas"
        element={
          <ProtectedRoute>
            <MainLayout>{(openMenu: () => void) => <Plantas openMenu={openMenu} />}</MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute>
            <MainLayout>{(openMenu: () => void) => <Configuracoes openMenu={openMenu} />}</MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlantsProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PlantsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
