import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../compartilhado/layouts/MainLayout';
import Login from '../compartilhado/pages/Login';
import Cadastro from '../compartilhado/pages/Cadastro';
import Watch from '../avancado/pages/Watch';
import { useIsWatch } from '../compartilhado/hooks/useIsWatch';
import ProtectedRoute from './ProtectedRoute';
import RotaDoNivel from './RotaDoNivel';
import { ROTAS, ROTAS_INTER_REDIRECIONADAS } from './paths';
import { ROTAS_BASICAS, ROTAS_INTERMEDIARIO, ROTAS_PRIVADAS } from './routeConfig';
import { IntermediarioLayout } from '../intermediario';
import { BasicoLayout } from '../basico';

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
      <Route path={ROTAS.cadastro} element={<Cadastro />} />
      {ROTAS_PRIVADAS.map(({ path, pagina: Pagina }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <RotaDoNivel nivel="avancado">
                <MainLayout>{(openMenu: () => void) => <Pagina openMenu={openMenu} />}</MainLayout>
              </RotaDoNivel>
            </ProtectedRoute>
          }
        />
      ))}
      {ROTAS_INTERMEDIARIO.map(({ path, pagina: Pagina }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <RotaDoNivel nivel="intermediario">
                <IntermediarioLayout>{(openMenu: () => void) => <Pagina openMenu={openMenu} />}</IntermediarioLayout>
              </RotaDoNivel>
            </ProtectedRoute>
          }
        />
      ))}
      {ROTAS_BASICAS.map(({ path, pagina: Pagina }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <RotaDoNivel nivel="basico">
                <BasicoLayout>{(openMenu: () => void) => <Pagina openMenu={openMenu} />}</BasicoLayout>
              </RotaDoNivel>
            </ProtectedRoute>
          }
        />
      ))}
      {ROTAS_INTER_REDIRECIONADAS.map(({ de, para }) => (
        <Route key={de} path={de} element={<Navigate to={para} replace />} />
      ))}
      <Route path="*" element={<Navigate to={ROTAS.visaoGeral} replace />} />
    </Routes>
  );
}
