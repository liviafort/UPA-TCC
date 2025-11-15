// src/App.js
import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MapPage from './pages/MapPage';
import UpaStatsPage from './pages/UpaStatsPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Página de Login para Gestores */}
          <Route path="/gestao/login" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Painel Administrativo - Rota Protegida */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Relatórios Administrativos - Rota Protegida */}
          <Route path="/admin/reports" element={
            <PrivateRoute>
              <AdminReports />
            </PrivateRoute>
          } />

          {/* Perfil do Usuário - Rota Protegida */}
          <Route path="/profile" element={
            <PrivateRoute>
              <UserProfile />
            </PrivateRoute>
          } />

          {/* Gestão de Usuários - Rota Protegida apenas para ADMIN */}
          <Route path="/admin/users" element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          } />

          {/* Página de Estatísticas da UPA */}
          <Route path="/upa/:id" element={<UpaStatsPage />} />

          {/* Página Principal com Mapa */}
          <Route path="/" element={<MapPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;