// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../services/AuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica se há um usuário logado ao carregar a aplicação
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  /**
   * Faz login do usuário
   */
  const login = async (username, password) => {
    try {
      const data = await AuthService.login(username, password);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Faz logout do usuário
   */
  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  /**
   * Registra novo usuário
   */
  const signup = async (userData) => {
    try {
      const data = await AuthService.signup(userData);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Verifica se o usuário está autenticado
   */
  const isAuthenticated = () => {
    return AuthService.isAuthenticated();
  };

  const value = {
    user,
    login,
    logout,
    signup,
    isAuthenticated,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
