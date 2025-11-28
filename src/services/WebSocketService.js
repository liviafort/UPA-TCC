// src/services/WebSocketService.js
import { io } from 'socket.io-client';

// URL do WebSocket - usa variável de ambiente
// nginx redireciona /upa-ws/ para o servidor socket.io na porta 8094
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.subscribedUpas = new Set();
  }

  /**
   * Conecta ao servidor WebSocket
   */
  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WEBSOCKET_URL, {
      path: '/upa-ws/socket.io',
      transports: ['polling', 'websocket'], 
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: true,
    });

    this.socket.on('connect', () => {
      // Reinscreve nas UPAs após reconexão
      this.subscribedUpas.forEach(upaId => {
        this.subscribeToUpa(upaId);
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket desconectado');
    });

    this.socket.on('connect_error', (error) => {
      // Silencioso - não mostra erro
    });

    this.socket.on('connected', (data) => {
      // Silencioso - não mostra resposta do servidor
    });

    return this.socket;
  }

  /**
   * Desconecta do servidor WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.subscribedUpas.clear();
    }
  }

  /**
   * Inscreve-se para receber atualizações de uma UPA específica
   */
  subscribeToUpa(upaId) {
    if (!this.socket?.connected) {
      this.connect();
    }

    this.socket.emit('subscribe_upa', upaId);
    this.subscribedUpas.add(upaId);

    // Confirma a inscrição
    this.socket.once('subscribed', (data) => {
      // console.log('Inscrito na UPA:', data);
    });
  }

  /**
   * Cancela a inscrição de uma UPA
   */
  unsubscribeFromUpa(upaId) {
    if (this.socket) {
      this.socket.emit('unsubscribe_upa', upaId);
      this.subscribedUpas.delete(upaId);
    }
  }

  /**
   * Registra um listener para atualização de fila
   */
  onQueueUpdate(callback) {
    if (!this.socket) this.connect();

    const wrappedCallback = (data) => {
      callback(data);
    };

    this.socket.on('queue_update', wrappedCallback);
    this.listeners.set('queue_update', wrappedCallback);

    return () => this.socket?.off('queue_update', wrappedCallback);
  }

  /**
   * Registra um listener para eventos de pacientes
   */
  onPatientEvent(callback) {
    if (!this.socket) this.connect();

    const wrappedCallback = (data) => {
      callback(data);
    };

    this.socket.on('patient_event', wrappedCallback);
    this.listeners.set('patient_event', wrappedCallback);

    return () => this.socket?.off('patient_event', wrappedCallback);
  }

  /**
   * Registra um listener para mudança de status de UPA
   */
  onUpaStatusChange(callback) {
    if (!this.socket) this.connect();

    const wrappedCallback = (data) => {
      callback(data);
    };

    this.socket.on('upa_status_change', wrappedCallback);
    this.listeners.set('upa_status_change', wrappedCallback);

    return () => this.socket?.off('upa_status_change', wrappedCallback);
  }

  /**
   * Registra um listener para atualização de todas as UPAs
   */
  onAllUpasUpdate(callback) {
    if (!this.socket) this.connect();

    const wrappedCallback = (data) => {
      callback(data);
    };

    this.socket.on('all_upas_update', wrappedCallback);
    this.listeners.set('all_upas_update', wrappedCallback);

    return () => this.socket?.off('all_upas_update', wrappedCallback);
  }

  /**
   * Envia ping para manter conexão ativa
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping', { timestamp: Date.now() });
    }
  }

  /**
   * Verifica se está conectado
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Obtém o ID da sessão
   */
  getSessionId() {
    return this.socket?.id || null;
  }
}

// Exporta uma instância única (singleton)
const webSocketService = new WebSocketService();
export default webSocketService;
