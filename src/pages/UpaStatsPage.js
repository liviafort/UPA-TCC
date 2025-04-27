import React from 'react';
import { useParams, Link } from 'react-router-dom';
import '../styles/UpaStatsPage.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie, Line, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function UpaStatsPage({ upas }) {
  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { enabled: true }
    }
  };
  const { id } = useParams();
  const upa = upas.find(u => u.id === parseInt(id));

  if (!upa) {
    return (
      <div className="upa-stats-container">
        <h2>UPA não encontrada.</h2>
        <Link to="/" className="back-link">← Voltar ao Mapa</Link>
      </div>
    );
  }

  // Dados mockados
  const azulAguardando = 83;
  const verdeAguardando = 34;
  const amareloAguardando = 26;
  const vermelhoAguardando = 3;

  const tempoMedioAzul = '15 min';
  const tempoMedioVerde = '10 min';
  const tempoMedioAmarelo = '20 min';
  const tempoMedioVermelho = '30 min';

  const historicoAtendimentos = [
    { dia: 'Seg', atendidos: 280 },
    { dia: 'Ter', atendidos: 300 },
    { dia: 'Qua', atendidos: 200 },
    { dia: 'Qui', atendidos: 400 },
    { dia: 'Sex', atendidos: 350 },
    { dia: 'Sáb', atendidos: 100 },
    { dia: 'Dom', atendidos: 150 },
  ];

  const classificacoesData = [
    { name: 'Azul', value: azulAguardando },
    { name: 'Verde', value: verdeAguardando },
    { name: 'Amarelo', value: amareloAguardando },
    { name: 'Vermelho', value: vermelhoAguardando },
  ];

  const mediaAtendimentoData = [
    { subject: 'Azul', tempo: 15 },
    { subject: 'Verde', tempo: 10 },
    { subject: 'Amarela', tempo: 20 },
    { subject: 'Vermelha', tempo: 30 },
  ];

  return (
    <div className="upa-stats-container">
      <header className="stats-header">
        <h1>{upa.name}</h1>
        <p>{upa.address}</p>
      </header>

      <div className="stats-main">
        <div className="stats-card stats-card-blue">
          <h2>Classificação Azul</h2>
          <p className="stats-value">{azulAguardando}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio de Espera: {tempoMedioAzul}</p>
        </div>
        <div className="stats-card stats-card-green">
          <h2>Classificação Verde</h2>
          <p className="stats-value">{verdeAguardando}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio de Espera: {tempoMedioVerde}</p>
        </div>
        <div className="stats-card stats-card-yellow">
          <h2>Classificação Amarela</h2>
          <p className="stats-value">{amareloAguardando}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio de Espera: {tempoMedioAmarelo}</p>
        </div>
        <div className="stats-card stats-card-red">
          <h2>Classificação Vermelha</h2>
          <p className="stats-value">{vermelhoAguardando}</p>
          <p className="stats-label">Pacientes aguardando</p>
          <p className="stats-wait">Tempo Médio de Espera: {tempoMedioVermelho}</p>
        </div>
      </div>

      <div className="stats-charts">
        {/* 1. BarChart */}
        <div className="chart-card">
          <h3>Distribuição de Pacientes por Classificação</h3>
          <Bar
            data={{
              labels: classificacoesData.map(c => c.name),
              datasets: [{
                label: 'Pacientes',
                data: classificacoesData.map(c => c.value),
                backgroundColor: ['#4b9cea','#48db8b','#ffe266','#ff7c7c']
              }]
            }}
            options={{
              ...commonOptions,
              scales: { y: { beginAtZero: true } }
            }}
            height={300}
          />
        </div>

        {/* 2. PieChart */}
        <div className="chart-card">
          <h3>Percentual de Pacientes por Classificação</h3>
          <Pie
            data={{
              labels: classificacoesData.map(c => c.name),
              datasets: [{
                data: classificacoesData.map(c => c.value),
                backgroundColor: ['#4b9cea','#48db8b','#ffe266','#ff7c7c']
              }]
            }}
            options={commonOptions}
            height={300}
          />
        </div>

        {/* 3. LineChart */}
        <div className="chart-card">
          <h3>Evolução de Atendimentos nos Últimos 7 Dias</h3>
          <Line
            data={{
              labels: historicoAtendimentos.map(h => h.dia),
              datasets: [{
                label: 'Atendidos',
                data: historicoAtendimentos.map(h => h.atendidos),
                borderColor: '#82ca9d',
                tension: 0.4,
                fill: false
              }]
            }}
            options={{
              ...commonOptions,
              scales: { y: { beginAtZero: true } }
            }}
            height={300}
          />
        </div>

        {/* 4. RadarChart */}
        <div className="chart-card">
          <h3>Tempo Médio de Atendimento</h3>
          <Radar
            data={{
              labels: mediaAtendimentoData.map(m => m.subject),
              datasets: [{
                label: 'Tempo (min)',
                data: mediaAtendimentoData.map(m => m.tempo),
                backgroundColor: 'rgba(136,132,216,0.6)',
                borderColor: '#8884d8',
                borderWidth: 1
              }]
            }}
            options={{
              ...commonOptions,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 40
                }
              }
            }}
            height={300}
          />
        </div>
      </div>


      <footer className="stats-footer">
        <Link to="/" className="back-link">← Voltar ao Mapa</Link>
      </footer>
    </div>
  );
}

export default UpaStatsPage;
