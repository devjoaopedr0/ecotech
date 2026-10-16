import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PlantsProvider } from './context/PlantsContext';
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
