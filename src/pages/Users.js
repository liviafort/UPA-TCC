// src/pages/Users.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';
import AdminSidebar from '../components/AdminSidebar';
import { getAllUsers, inactivateUser, activateUser, createUser } from '../server/Api';
import logo from '../assets/logo.png';
import '../styles/Users.css';

function Users() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToToggle, setUserToToggle] = useState(null);

  // Lista de estados brasileiros (para o formulário de criação)
  const brazilianStates = [
    { uf: 'AC', name: 'Acre' },
    { uf: 'AL', name: 'Alagoas' },
    { uf: 'AP', name: 'Amapá' },
    { uf: 'AM', name: 'Amazonas' },
    { uf: 'BA', name: 'Bahia' },
    { uf: 'CE', name: 'Ceará' },
    { uf: 'DF', name: 'Distrito Federal' },
    { uf: 'ES', name: 'Espírito Santo' },
    { uf: 'GO', name: 'Goiás' },
    { uf: 'MA', name: 'Maranhão' },
    { uf: 'MT', name: 'Mato Grosso' },
    { uf: 'MS', name: 'Mato Grosso do Sul' },
    { uf: 'MG', name: 'Minas Gerais' },
    { uf: 'PA', name: 'Pará' },
    { uf: 'PB', name: 'Paraíba' },
    { uf: 'PR', name: 'Paraná' },
    { uf: 'PE', name: 'Pernambuco' },
    { uf: 'PI', name: 'Piauí' },
    { uf: 'RJ', name: 'Rio de Janeiro' },
    { uf: 'RN', name: 'Rio Grande do Norte' },
    { uf: 'RS', name: 'Rio Grande do Sul' },
    { uf: 'RO', name: 'Rondônia' },
    { uf: 'RR', name: 'Roraima' },
    { uf: 'SC', name: 'Santa Catarina' },
    { uf: 'SP', name: 'São Paulo' },
    { uf: 'SE', name: 'Sergipe' },
    { uf: 'TO', name: 'Tocantins' }
  ];

  const [createFormData, setCreateFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    role: 'PADRAO'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserProfile();
    loadUsers();
  }, []);

  useEffect(() => {
    // Filtrar usuários quando o termo de busca mudar
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const loadUserProfile = async () => {
    if (user?.id) {
      try {
        const profile = await AuthService.getUserProfile(user.id);
        setUserProfile(profile);
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      }
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = (userId, currentStatus) => {
    const user = users.find(u => u.id === userId);
    setUserToToggle({ ...user, currentStatus });
    setShowConfirmModal(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggle) return;

    const isActive = userToToggle.currentStatus === 'ACTIVE';
    const action = isActive ? 'inativar' : 'ativar';
    const actionPast = isActive ? 'inativado' : 'ativado';

    try {
      setSaving(true);
      if (isActive) {
        await inactivateUser(userToToggle.id);
      } else {
        await activateUser(userToToggle.id);
      }
      setShowConfirmModal(false);
      setUserToToggle(null);
      loadUsers();
      // Mostra mensagem de sucesso
      setTimeout(() => {
        alert(`Usuário ${actionPast} com sucesso!`);
      }, 300);
    } catch (error) {
      console.error(`Erro ao ${action} usuário:`, error);
      alert(`Erro ao ${action} usuário: ` + error.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelToggleStatus = () => {
    setShowConfirmModal(false);
    setUserToToggle(null);
  };

  const handleViewUser = (userToView) => {
    setSelectedUser(userToView);
    setShowEditModal(true);
  };

  const handleCreateUser = () => {
    setCreateFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      role: 'PADRAO'
    });
    setShowCreateModal(true);
  };

  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveNewUser = async () => {
    // Validação dos campos obrigatórios
    if (!createFormData.username || !createFormData.password || !createFormData.name) {
      alert('Por favor, preencha os campos obrigatórios: Nome, Username e Senha');
      return;
    }

    try {
      setSaving(true);
      console.log('Dados enviados para criar usuário:', createFormData);
      await createUser(createFormData);
      alert('Usuário criado com sucesso!');
      setShowCreateModal(false);
      loadUsers(); // Recarrega a lista
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      console.error('Response data:', error.response?.data);
      alert('Erro ao criar usuário: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner-large"></div>
        <p>Carregando usuários...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userProfile={userProfile}
      />

      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <button className="menu-button" onClick={() => setSidebarOpen(!sidebarOpen)}>
            &#9776;
          </button>
          <Link to="/">
            <div className="admin-logo">
              <img src={logo} alt="Logo" width="106" height="40" viewBox="0 0 60 60"/>
            </div>
          </Link>
        </div>
      </header>

      {/* Page Title Banner */}
      <div className="page-title-banner">
        <div className="page-title-banner-content">
          <h1>Usuários</h1>
          <p>Gerencie os usuários do sistema</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-container">

          {/* Search Bar and Create Button */}
          <div className="users-controls">
            <div className="search-bar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Procurar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-create-user" onClick={handleCreateUser}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Criar Novo Usuário
            </button>
          </div>

          {/* Users Table */}
          <div className="users-table-card">
            <table className="users-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Ativo</th>       
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => handleViewUser(userItem)}
                        title="Visualizar usuário"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                    </td>
                    <td className="user-name-cell">{userItem.name || userItem.username}</td>
                    <td>
                      <span className={`type-badge ${userItem.role?.toLowerCase()}`}>
                        {userItem.role === 'ADMIN' ? 'ADMINISTRADOR' :
                         userItem.role === 'PADRAO' ? 'PADRÃO' :
                         userItem.role || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle ${userItem.status === 'ACTIVE' ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleUserStatus(userItem.id, userItem.status)}
                        title={userItem.status === 'ACTIVE' ? 'Inativar usuário' : 'Ativar usuário'}
                      >
                        {userItem.status === 'ACTIVE' ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                          </svg>
                        )}
                      </button>
                    </td>
                   
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="no-results">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <p>Nenhum usuário encontrado</p>
              </div>
            )}
          </div>

          {/* Pagination Info */}
          <div className="table-footer">
            <p>Página 1 de 1 página(s)</p>
          </div>

        </div>
      </main>

      {/* View User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes do Usuário</h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="user-info-display">
                <div className="info-row">
                  <span className="info-label">Nome:</span>
                  <span className="info-value">{selectedUser.name || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Username:</span>
                  <span className="info-value">@{selectedUser.username}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Telefone:</span>
                  <span className="info-value">{selectedUser.phone || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Cidade:</span>
                  <span className="info-value">{selectedUser.city || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Estado:</span>
                  <span className="info-value">{selectedUser.state || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Tipo:</span>
                  <span className={`type-badge ${selectedUser.role?.toLowerCase()}`}>
                    {selectedUser.role === 'ADMIN' ? 'ADMINISTRADOR' : 'PADRÃO'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge-inline ${selectedUser.status?.toLowerCase()}`}>
                    {selectedUser.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content create-user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Novo Usuário</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="user-edit-form">
                <div className="form-group">
                  <label htmlFor="create-name">Nome Completo</label>
                  <input
                    type="text"
                    id="create-name"
                    name="name"
                    value={createFormData.name}
                    onChange={handleCreateInputChange}
                    placeholder="Digite o nome completo"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-username">Username</label>
                  <input
                    type="text"
                    id="create-username"
                    name="username"
                    value={createFormData.username}
                    onChange={handleCreateInputChange}
                    placeholder="Digite o username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-password">Senha</label>
                  <input
                    type="password"
                    id="create-password"
                    name="password"
                    value={createFormData.password}
                    onChange={handleCreateInputChange}
                    placeholder="Digite a senha"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-email">Email</label>
                  <input
                    type="email"
                    id="create-email"
                    name="email"
                    value={createFormData.email}
                    onChange={handleCreateInputChange}
                    placeholder="Digite o email"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-phone">Telefone</label>
                  <input
                    type="tel"
                    id="create-phone"
                    name="phone"
                    value={createFormData.phone}
                    onChange={handleCreateInputChange}
                    placeholder="Digite o telefone"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-city">Cidade</label>
                  <input
                    type="text"
                    id="create-city"
                    name="city"
                    value={createFormData.city}
                    onChange={handleCreateInputChange}
                    placeholder="Digite a cidade"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="create-state">Estado</label>
                  <select
                    id="create-state"
                    name="state"
                    value={createFormData.state}
                    onChange={handleCreateInputChange}
                  >
                    <option value="">Selecione um estado</option>
                    {brazilianStates.map(state => (
                      <option key={state.uf} value={state.uf}>
                        {state.name} - {state.uf}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="create-role">Role</label>
                  <select
                    id="create-role"
                    name="role"
                    value={createFormData.role}
                    onChange={handleCreateInputChange}
                  >
                    <option value="PADRAO">Colaborador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowCreateModal(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={handleSaveNewUser}
                disabled={saving}
              >
                {saving ? 'Criando...' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && userToToggle && (
        <div className="modal-overlay" onClick={cancelToggleStatus}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Ação</h3>
              <button
                className="modal-close"
                onClick={cancelToggleStatus}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="confirm-message">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ margin: '0 auto 20px', display: 'block', color: '#09AC96' }}
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                    fill="currentColor"
                  />
                </svg>
                <p style={{ fontSize: '1.1rem', textAlign: 'center', marginBottom: '8px', fontWeight: '600', color: '#1f2937' }}>
                  Tem certeza que deseja {userToToggle.currentStatus === 'ACTIVE' ? 'inativar' : 'ativar'} este usuário?
                </p>
                <p style={{ fontSize: '0.95rem', textAlign: 'center', color: '#6b7280' }}>
                  Usuário: <strong>{userToToggle.name}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  className="btn-cancel"
                  onClick={cancelToggleStatus}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  className="btn-save"
                  onClick={confirmToggleStatus}
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
