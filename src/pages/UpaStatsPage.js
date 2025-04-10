// src/pages/UpaStatsPage.js
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
  ResponsiveContainer,
  RadialBar,
  RadialBarChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  PolarRadiusAxis
} from 'recharts';
import '../styles/UpaStatsPage.css';

function UpaStatsPage({ upas }) {
  const { id } = useParams();
  const upa = upas.find((u) => u.id === parseInt(id));

  if (!upa) {
    return (
      <div className="upa-stats-container">
        <h2>UPA não encontrada.</h2>
        <Link to="/" className="back-link">Voltar ao Mapa</Link>
      </div>
    );
  }

  // Valores mockados (exemplo)
  const totalFila = 839;          // Pacientes totais na fila
  const atendidosHoje = 344;      // Pacientes atendidos hoje

  // Número de pacientes aguardando para cada classificação
  const azulAguardando = 83;
  const verdeAguardando = 34;
  const amareloAguardando = 26;
  const vermelhoAguardando = 3;

  // Tempo médio de espera para cada classificação (exemplo)
  const tempoMedioAzul = "15 min";
  const tempoMedioVerde = "10 min";
  const tempoMedioAmarelo = "20 min";
  const tempoMedioVermelho = "30 min";

  // Histórico de atendimentos dos últimos 7 dias (mock)
  const historicoAtendimentos = [
    { dia: 'Seg', atendidos: 280 },
    { dia: 'Ter', atendidos: 300 },
    { dia: 'Qua', atendidos: 200 },
    { dia: 'Qui', atendidos: 400 },
    { dia: 'Sex', atendidos: 350 },
    { dia: 'Sáb', atendidos: 100 },
    { dia: 'Dom', atendidos: 150 },
  ];

  // Dados para gráficos das classificações
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

  // Cores personalizadas para o gráfico de pizza
  const pieColors = ['#4b9cea', '#48db8b', '#ffe266', '#ff7c7c'];

  return (
    <div className="upa-stats-container">
      <header className="stats-header">
        <h1>{upa.name}</h1>
        <p>{upa.address}</p>
      </header>
      
      {/* Seção de cartões com KPIs */}
      <div className="stats-main">

        {/* Cartões de classificação com tempo médio de espera */}
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

      {/* Seção de gráficos */}
      <div className="stats-charts">
        <div className="chart-card">
          <h3>Distribuição de Pacientes por Classificação</h3>
          <BarChart
            width={400}
            height={300}
            data={classificacoesData}
            margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Pacientes" />
          </BarChart>
        </div>

        <div className="chart-card">
          <h3>Percentual de Pacientes por Classificação</h3>
          <PieChart width={350} height={300}>
            <Pie
              data={classificacoesData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {classificacoesData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="chart-card chart-fullwidth">
        <h3>Evolução de Atendimentos nos Últimos 7 Dias</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={historicoAtendimentos}
            margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="atendidos" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
          <h3>Tempo Médio de Atendimento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={mediaAtendimentoData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 40]} />
              <Radar
                name="Tempo (min)"
                dataKey="tempo"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>


      </div>

      <footer className="stats-footer">
        <Link to="/" className="back-link">Voltar ao Mapa</Link>
      </footer>
    </div>
  );
}

export default UpaStatsPage;
