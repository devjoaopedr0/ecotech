import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
import Watch from '../pages/Watch';
import { useIsWatch } from '../hooks/useIsWatch';
import ProtectedRoute from './ProtectedRoute';
import { ROTAS } from './paths';
import { ROTAS_PRIVADAS } from './routeConfig';

export default function AppRoutes() {
  const isWatch = useIsWatch();

  // No Apple Watch só existem o login e o controle de irrigação.
  if (isWatch) {
    return (
      <Routes>
        <Route path={ROTAS.login} element={<Login />} />
        <Route
          path={ROTAS.visaoGeral}
          element={
            <ProtectedRoute>
              <Watch />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROTAS.visaoGeral} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path={ROTAS.login} element={<Login />} />
      {ROTAS_PRIVADAS.map(({ path, pagina: Pagina }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <MainLayout>{(openMenu: () => void) => <Pagina openMenu={openMenu} />}</MainLayout>
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<Navigate to={ROTAS.visaoGeral} replace />} />
    </Routes>
  );
}
