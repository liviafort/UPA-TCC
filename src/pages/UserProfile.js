// src/pages/UserProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, changePassword } from '../server/Api';
import logo from '../assets/logo.png';
import '../styles/UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Dados do formulário de edição
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: ''
  });

  // Dados do formulário de senha
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const data = await getUserProfile(user.id);

      console.log('=== GET USER PROFILE ===');
      console.log('User ID:', user.id);
      console.log('Profile Data:', data);
      console.log('========================');

      setProfile(data);
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || ''
      });
    } catch (err) {
      setError('Erro ao carregar perfil: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const updatedProfile = await updateUserProfile(user.id, formData);
      setProfile(updatedProfile);
      setEditMode(false);
      setSuccess('Perfil atualizado com sucesso!');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao atualizar perfil: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      city: profile.city || '',
      state: profile.state || ''
    });
    setError('');
  };

  const handleChangePassword = async () => {
    try {
      setError('');
      setSuccess('');

      if (!passwordData.currentPassword) {
        setError('Informe a senha atual');
        return;
      }

      if (!passwordData.newPassword) {
        setError('Informe a nova senha');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      setSaving(true);

      await changePassword(user.id, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: ''
      });
      setSuccess('Senha alterada com sucesso!');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao alterar senha: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="admin-reports">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <img src={logo} alt="Logo" width="106" height="40" />
          </div>

          <div className="admin-user-menu">
            <button onClick={() => navigate('/admin/dashboard')} className="admin-back-btn">
              Voltar
            </button>
            <div className="admin-user-info">
              <div className="admin-user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="admin-user-name">{user?.username}</span>
            </div>
            <button onClick={handleLogout} className="admin-logout-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3H3V17H13V15H11V15H5V5H11V5H13V3Z" fill="currentColor"/>
                <path d="M16.293 9.293L13.293 6.293L14.707 4.879L20 10.172L14.707 15.465L13.293 14.051L16.293 11.051H7V9.051H16.293V9.293Z" fill="currentColor"/>
              </svg>
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-container">

          {/* Page Title */}
          <div className="page-title-section">
            <h2>Meu Perfil</h2>
            <p>Gerencie suas informações pessoais e configurações de segurança</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          {/* Profile Info Card */}
          <div className="chart-card">
            <div className="profile-header-card">
              <div className="profile-avatar-large">
                {profile?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="profile-info">
                <h3>{profile?.name || 'Usuário'}</h3>
                <p className="username-text">@{profile?.username || user?.username}</p>
                <span className={`status-badge-profile ${profile?.status?.toUpperCase() === 'ACTIVE' ? 'active' : 'inactive'}`}>
                  {profile?.status?.toUpperCase() === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* User Data Card */}
          <div className="chart-card">
            <div className="card-header">
              <h3>Dados do Usuário</h3>
              {!editMode && (
                <button
                  className="btn-edit-profile"
                  onClick={() => setEditMode(true)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar
                </button>
              )}
            </div>

            <div className="profile-form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className={editMode ? 'editable' : ''}
                  />
                </div>

                <div className="form-group">
                  <label>Nome de Usuário</label>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    disabled
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className={editMode ? 'editable' : ''}
                  />
                </div>

                <div className="form-group">
                  <label>Telefone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className={editMode ? 'editable' : ''}
                    placeholder="(83) 98888-7777"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cidade</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className={editMode ? 'editable' : ''}
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    className={editMode ? 'editable' : ''}
                    maxLength="2"
                    placeholder="PB"
                  />
                </div>
              </div>

              {editMode && (
                <div className="form-actions">
                  <button
                    className="btn-cancel"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Card */}
          <div className="chart-card">
            <div className="card-header">
              <h3>Segurança</h3>
            </div>
            <div className="security-content">
              <p className="security-description">Mantenha sua conta segura alterando sua senha regularmente</p>
              <button
                className="btn-change-password"
                onClick={() => setShowPasswordModal(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Alterar Senha
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alterar Senha</h3>
              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Senha Atual</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={saving}
                  placeholder="Digite sua senha atual"
                />
              </div>

              <div className="form-group">
                <label>Nova Senha</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  disabled={saving}
                  placeholder="Digite a nova senha (deve ter pelo menos 6 caracteres)"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowPasswordModal(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={handleChangePassword}
                disabled={saving}
              >
                {saving ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
