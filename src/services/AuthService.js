// src/services/AuthService.js
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'https://api.vejamaisaude.com/upa';

// Configuração dos cookies (1 dia de expiração)
const COOKIE_OPTIONS = {
  expires: 1, // 1 dia
  secure: false, // true em produção com HTTPS
  sameSite: 'lax'
};

class AuthService {
  /**
   * Faz login do usuário
   * @param {string} username - Nome de usuário
   * @param {string} password - Senha
   * @returns {Promise} Retorna dados do usuário e token
   */
  async login(username, password) {
    try {
      console.log('🔐 Tentando fazer login...');

      const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
        username,
        password
      });

      if (response.data.success && response.data.data.token) {
        // Salva o token e dados do usuário nos cookies
        const { token, user } = response.data.data;

        Cookies.set('token', token, COOKIE_OPTIONS);
        Cookies.set('user', JSON.stringify(user), COOKIE_OPTIONS);

        console.log('✅ Login realizado com sucesso! Token salvo em cookie');

        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error('Erro ao conectar com o servidor');
    }
  }

  /**
   * Faz logout do usuário
   */
  logout() {
    console.log('👋 Fazendo logout...');
    Cookies.remove('token');
    Cookies.remove('user');
  }

  /**
   * Registra novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise} Retorna dados do usuário e token
   */
  async signup(userData) {
    try {
      console.log('📝 Tentando registrar novo usuário...');

      const response = await axios.post(`${API_URL}/api/v1/auth/signup`, userData);

      if (response.data.success && response.data.data.token) {
        const { token, user } = response.data.data;

        Cookies.set('token', token, COOKIE_OPTIONS);
        Cookies.set('user', JSON.stringify(user), COOKIE_OPTIONS);

        console.log('✅ Registro realizado com sucesso! Token salvo em cookie');

        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao registrar usuário');
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw new Error('Erro ao conectar com o servidor');
    }
  }

  /**
   * Retorna o token armazenado nos cookies
   * @returns {string|null} Token JWT
   */
  getToken() {
    const token = Cookies.get('token');
    console.log('🔍 getToken - Token length:', token ? token.length : 0);
    return token;
  }

  /**
   * Decodifica um token JWT sem verificação de assinatura
   * @param {string} token - Token JWT
   * @returns {Object|null} Payload do token decodificado
   */
  decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  /**
   * Verifica se o token está expirado
   * @param {string} token - Token JWT
   * @returns {boolean} True se o token estiver expirado
   */
  isTokenExpired(token) {
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      console.log('⚠️ isTokenExpired - Failed to decode token or no exp field');
      return true;
    }

    // exp está em segundos, Date.now() em milissegundos
    const currentTime = Date.now() / 1000;
    const isExpired = decoded.exp < currentTime;

    console.log('🔍 Token expiration check:', {
      exp: decoded.exp,
      currentTime: currentTime,
      isExpired: isExpired,
      expiresIn: Math.round((decoded.exp - currentTime) / 3600) + ' hours'
    });

    return isExpired;
  }

  /**
   * Retorna os dados do usuário logado
   * @returns {Object|null} Dados do usuário
   */
  getCurrentUser() {
    const token = this.getToken();

    // Verifica se o token existe
    if (!token) {
      console.log('⚠️ getCurrentUser - Token ausente');
      return null;
    }

    // Verifica se o token está expirado
    if (this.isTokenExpired(token)) {
      console.log('⚠️ getCurrentUser - Token expirado');
      return null;
    }

    const userStr = Cookies.get('user');
    console.log('🔍 getCurrentUser - User string from cookie:', userStr ? userStr.substring(0, 50) + '...' : 'NULL');

    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        console.log('👤 getCurrentUser - Dados do usuário retornados dos cookies:', userData);
        return userData;
      } catch (error) {
        console.error('❌ getCurrentUser - Erro ao parsear dados do usuário:', error);
        return null;
      }
    }
    console.log('⚠️ getCurrentUser - Nenhum usuário encontrado nos cookies');
    console.log('🔍 getCurrentUser - Todos os cookies:', document.cookie);
    return null;
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean} True se estiver autenticado
   */
  isAuthenticated() {
    const token = this.getToken();
    console.log('🔍 isAuthenticated - Token exists:', !!token);

    if (!token) {
      console.log('❌ isAuthenticated - No token found');
      return false;
    }

    const isExpired = this.isTokenExpired(token);
    console.log('🔍 isAuthenticated - Token expired:', isExpired);

    // Verifica se o token não está expirado
    return !isExpired;
  }

  /**
   * Busca o perfil do usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise} Dados do perfil
   */
  async getUserProfile(userId) {
    try {
      const token = this.getToken();

      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }

      const response = await axios.get(`${API_URL}/api/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erro ao buscar perfil');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);

      if (error.response?.status === 401) {
        // Token inválido ou expirado
        this.logout();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      throw error;
    }
  }
}

export default new AuthService();
