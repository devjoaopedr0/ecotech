import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './compartilhado/context/AuthContext';
import { ThemeProvider } from './compartilhado/context/ThemeContext';
import { PlantsProvider } from './compartilhado/context/PlantsContext';
import { AppRoutes } from './routes';

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
