
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import PromotersPage from "@/pages/PromotersPage";
import MapPage from "@/pages/MapPage";
import AnalysisPage from "@/pages/AnalysisPage";
import LandAnalysisPage from "@/pages/LandAnalysisPage";
import RentalAnalysisPage from "@/pages/RentalAnalysisPage";
import FraccionamientosPage from "@/pages/FraccionamientosPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ConfigPage from "@/pages/ConfigPage";
import FixRolePage from "@/pages/FixRolePage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/fix-role" element={<FixRolePage />} />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><DashboardPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/promoters" element={
            <ProtectedRoute>
              <Layout><PromotersPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/map" element={
            <ProtectedRoute>
              <Layout><MapPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/analysis" element={
            <ProtectedRoute>
              <Layout><AnalysisPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/land-analysis" element={
            <ProtectedRoute>
              <Layout><LandAnalysisPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/rental-analysis" element={
            <ProtectedRoute>
              <Layout><RentalAnalysisPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/fraccionamientos" element={
            <ProtectedRoute>
              <Layout><FraccionamientosPage /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Ruta de configuración (solo para owners) */}
          <Route path="/config" element={
            <ProtectedRoute requiredRole="owner">
              <Layout><ConfigPage /></Layout>
            </ProtectedRoute>
          } />
          
          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
