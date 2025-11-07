// src/utils/pdfGenerator.js
import { jsPDF } from 'jspdf';

export const generateReportPDF = ({
  upaData,
  analyticsData,
  dashboardAnalytics,
  filterDate
}) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Cores
  const primaryColor = [9, 172, 150]; // #09AC96
  const textColor = [31, 41, 55]; // #1F2937
  const grayColor = [107, 114, 128]; // #6B7280

  // Função auxiliar para adicionar nova página se necessário
  const checkPageBreak = (neededSpace) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
      return true;
    }
    return false;
  };

  // Função para desenhar uma tabela simples
  const drawTable = (headers, rows, startY) => {
    const colWidth = (pageWidth - 28) / headers.length;
    let currentY = startY;

    // Desenhar cabeçalho
    doc.setFillColor(...primaryColor);
    doc.rect(14, currentY, pageWidth - 28, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    headers.forEach((header, i) => {
      doc.text(header, 14 + (i * colWidth) + 2, currentY + 7);
    });

    currentY += 10;

    // Desenhar linhas
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    rows.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(14, currentY, pageWidth - 28, 8, 'F');
      }

      row.forEach((cell, colIndex) => {
        const text = String(cell || '-');
        doc.text(text, 14 + (colIndex * colWidth) + 2, currentY + 6);
      });

      currentY += 8;
    });

    return currentY;
  };

  // Cabeçalho
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de UPA', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(upaData.nome || 'Nome da UPA', pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Período: ${filterDate}`, pageWidth / 2, 33, { align: 'center' });

  yPosition = 50;

  // Informações da UPA
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações da UPA', 14, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);

  const upaInfo = [
    ['Endereço:', upaData.endereco || '-']

  ];

  upaInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 50, yPosition);
    yPosition += 6;
  });

  yPosition += 10;
  checkPageBreak(50);

  // Estatísticas Gerais
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Estatísticas Gerais', 14, yPosition);
  yPosition += 10;

  const stats = analyticsData.statistics;
  const statsRows = [
    ['Total de Eventos', (stats.total_visits || 0).toString()],
    ['Média Diária', (stats.daily_average || 0).toString()],
    ['Tempo Médio de Espera', `${(stats.average_wait_time || 0).toFixed(0)} min`],
    ['Taxa de Ocupação', `${(stats.occupancy_rate || 0).toFixed(1)}%`]
  ];

  yPosition = drawTable(['Métrica', 'Valor'], statsRows, yPosition);
  yPosition += 15;
  checkPageBreak(50);

  // Distribuição por Classificação
  if (analyticsData.distribution && analyticsData.distribution.length > 0) {
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Distribuição por Classificação', 14, yPosition);
    yPosition += 10;

    const distRows = analyticsData.distribution.map(item => [
      item.classificacao || '-',
      (item.quantidade || 0).toString()
    ]);

    yPosition = drawTable(['Classificação', 'Quantidade'], distRows, yPosition);
    yPosition += 15;
    checkPageBreak(50);
  }

  // Tempos de Espera por Classificação
  if (analyticsData.waitTimes && analyticsData.waitTimes.length > 0) {
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tempos Médios de Espera', 14, yPosition);
    yPosition += 10;

    const waitRows = analyticsData.waitTimes.map(item => [
      item.classificacao || '-',
      (item.tempoMedio || 0).toFixed(0)
    ]);

    yPosition = drawTable(['Classificação', 'Tempo Médio (min)'], waitRows, yPosition);
    yPosition += 15;
    checkPageBreak(50);
  }

  // Bairros Atendidos
  if (analyticsData.bairros && analyticsData.bairros.length > 0) {
    checkPageBreak(80);

    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bairros Atendidos', 14, yPosition);
    yPosition += 10;

    const bairrosRows = analyticsData.bairros.slice(0, 10).map(item => [
      item.bairro || '-',
      (item.total || 0).toString(),
      (item.percentual || 0).toFixed(1) + '%',
      (item.mediaTempoEspera || 0).toString()
    ]);

    yPosition = drawTable(['Bairro', 'Pacientes', '%', 'Tempo (min)'], bairrosRows, yPosition);
    yPosition += 15;
  }

  // Dashboard Analytics
  if (dashboardAnalytics && dashboardAnalytics.ultimas24h) {
    checkPageBreak(80);

    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Comparação Temporal', 14, yPosition);
    yPosition += 10;

    const dashRows = [];

    if (dashboardAnalytics.ultimas24h) {
      dashRows.push([
        'Últimas 24h',
        (dashboardAnalytics.ultimas24h.totalEntradas || 0).toString(),
        (dashboardAnalytics.ultimas24h.totalTriagens || 0).toString(),
        (dashboardAnalytics.ultimas24h.totalAtendimentos || 0).toString()
      ]);
    }

    if (dashboardAnalytics.hoje) {
      dashRows.push([
        'Hoje',
        (dashboardAnalytics.hoje.totalEntradas || 0).toString(),
        (dashboardAnalytics.hoje.totalTriagens || 0).toString(),
        (dashboardAnalytics.hoje.totalAtendimentos || 0).toString()
      ]);
    }

    if (dashboardAnalytics.ontem) {
      dashRows.push([
        'Ontem',
        (dashboardAnalytics.ontem.totalEntradas || 0).toString(),
        (dashboardAnalytics.ontem.totalTriagens || 0).toString(),
        (dashboardAnalytics.ontem.totalAtendimentos || 0).toString()
      ]);
    }

    yPosition = drawTable(['Período', 'Entradas', 'Triagens', 'Atendimentos'], dashRows, yPosition);
  }

  // Rodapé
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.text(
      `Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
      14,
      pageHeight - 10
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  return doc;
};
