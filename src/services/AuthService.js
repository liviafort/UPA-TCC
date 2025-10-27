// src/services/AuthService.js
import axios from 'axios';

const API_URL = 'https://api.vejamaisaude.com/upa';

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
        // Salva o token e dados do usuário no localStorage
        const { token, user } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Login realizado com sucesso!');

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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Registro realizado com sucesso!');

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
   * Retorna o token armazenado
   * @returns {string|null} Token JWT
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Retorna os dados do usuário logado
   * @returns {Object|null} Dados do usuário
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean} True se estiver autenticado
   */
  isAuthenticated() {
    const token = this.getToken();
    return !!token;
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
