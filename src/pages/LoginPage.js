import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';
import '../styles/LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validação básica
    if (!username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    try {
      // Faz login usando o AuthContext
      await login(username, password);

      console.log('✅ Login realizado com sucesso!');

      // Redireciona para o dashboard administrativo
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('❌ Erro no login:', err);
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-branding">
            <img src={logo} alt="Veja+Saúde Logo" />
          </div>
          <div className="login-illustration">
            <div className="illustration-circle circle-1"></div>
            <div className="illustration-circle circle-2"></div>
            <div className="illustration-circle circle-3"></div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-container">
            <div className="login-header">
              <h2>Bem-vindo(a)!</h2>
              <p>Acesse o painel de gestão das UPAs</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">Usuário</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="#9CA3AF"/>
                    <path d="M10 12C4.477 12 0 14.686 0 18V20H20V18C20 14.686 15.523 12 10 12Z" fill="#9CA3AF"/>
                  </svg>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Digite seu usuário"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Senha</label>
                <div className="input-wrapper">
                  <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 7H14V5C14 2.243 11.757 0 9 0C6.243 0 4 2.243 4 5V7H3C1.346 7 0 8.346 0 10V17C0 18.654 1.346 20 3 20H15C16.654 20 18 18.654 18 17V10C18 8.346 16.654 7 15 7ZM6 5C6 3.346 7.346 2 9 2C10.654 2 12 3.346 12 5V7H6V5Z" fill="#9CA3AF"/>
                  </svg>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 0C3.589 0 0 3.589 0 8C0 12.411 3.589 16 8 16C12.411 16 16 12.411 16 8C16 3.589 12.411 0 8 0ZM8 12C7.448 12 7 11.552 7 11C7 10.448 7.448 10 8 10C8.552 10 9 10.448 9 11C9 11.552 8.552 12 8 12ZM9 9H7V4H9V9Z" fill="currentColor"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <a href="/" className="back-link">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7H3.83L9.42 1.41L8 0L0 8L8 16L9.41 14.59L3.83 9H16V7Z" fill="currentColor"/>
                </svg>
                Voltar para o mapa
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
