// src/utils/pdfGenerator.js
import { jsPDF } from 'jspdf';
import logo from '../assets/logo.png';

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
  const primaryColor = [9, 172, 150];
  const textColor = [31, 41, 55];
  const grayColor = [107, 114, 128];

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
      doc.text(String(header), 14 + (i * colWidth) + 2, currentY + 7);
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
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de UPA', pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(String(upaData?.nome || 'Nome da UPA'), pageWidth / 2, 26, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Período: ${String(filterDate || 'Últimos 7 dias')}`, pageWidth / 2, 36, { align: 'center' });

  yPosition = 55;

  // Informações da UPA
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações da UPA', 14, yPosition);

  // Adiciona a logo no canto direito
  try {
    const logoWidth = 30;
    const logoHeight = 12;
    const logoX = pageWidth - logoWidth - 14; // 14 de margem da direita
    const logoY = yPosition - 8; // Alinha com o texto
    doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight);
  } catch (error) {
    console.error('Erro ao adicionar logo ao PDF:', error);
  }

  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);

  const upaInfo = [
    ['Endereço:', String(upaData?.endereco || '-')]
  ];

  upaInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(String(label), 14, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 50, yPosition);
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

  const stats = analyticsData?.statistics || {};
  const statsRows = [
    ['Total de Eventos', String(stats.total_visits || 0)],
    ['Tempo Médio de Espera', `${String((Number(stats.average_wait_time) || 0).toFixed(0))} min`],
    ['Taxa de Conclusão', `${String((Number(stats.occupancy_rate) || 0).toFixed(1))}%`]
  ];

  yPosition = drawTable(['Métrica', 'Valor'], statsRows, yPosition);
  yPosition += 15;
  checkPageBreak(50);

  // Distribuição por Classificação
  if (analyticsData?.distribution && Array.isArray(analyticsData.distribution) && analyticsData.distribution.length > 0) {
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Distribuição por Classificação', 14, yPosition);
    yPosition += 10;

    // Cria um mapa de percentuais para fácil acesso
    const percentagesMap = {};
    if (analyticsData?.percentages && Array.isArray(analyticsData.percentages)) {
      analyticsData.percentages.forEach(item => {
        if (item?.classificacao) {
          percentagesMap[item.classificacao] = item.percentual || 0;
        }
      });
    }

    const distRows = analyticsData.distribution.map(item => {
      const classificacao = String(item?.classificacao || '-');
      const quantidade = String(item?.quantidade || 0);
      const percentual = percentagesMap[item?.classificacao]
        ? String((Number(percentagesMap[item.classificacao]) || 0).toFixed(1)) + '%'
        : '0.0%';

      return [classificacao, quantidade, percentual];
    });

    yPosition = drawTable(['Classificação', 'Quantidade', 'Percentual'], distRows, yPosition);
    yPosition += 15;
    checkPageBreak(50);
  }

  // Tempos de Espera por Classificação
  if (analyticsData?.waitTimesByClassification && Object.keys(analyticsData.waitTimesByClassification).length > 0) {
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Tempos Médios de Espera', 14, yPosition);
    yPosition += 10;

    // Ordena as classificações na ordem correta
    const allClassifications = ['VERMELHO', 'LARANJA', 'AMARELO', 'VERDE', 'AZUL'];
    const waitRows = allClassifications.map(classification => {
      const value = analyticsData.waitTimesByClassification[classification];
      const tempoMedio = value ? Math.max(0, value) : 0;
      return [
        String(classification),
        String(Math.round(tempoMedio))
      ];
    });

    yPosition = drawTable(['Classificação', 'Tempo Médio (min)'], waitRows, yPosition);
    yPosition += 15;
    checkPageBreak(50);
  }

  // Bairros Atendidos
  if (analyticsData?.bairros && Array.isArray(analyticsData.bairros) && analyticsData.bairros.length > 0) {
    checkPageBreak(80);

    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bairros Atendidos', 14, yPosition);
    yPosition += 10;

    const bairrosRows = analyticsData.bairros.slice(0, 10).map(item => [
      String(item?.bairro || '-'),
      String(item?.total || 0),
      String((Number(item?.percentual) || 0).toFixed(1)) + '%',
      String(item?.mediaTempoEspera || 0)
    ]);

    yPosition = drawTable(['Bairro', 'Pacientes', '%', 'Tempo (min)'], bairrosRows, yPosition);
    yPosition += 15;
  }

  // Dashboard Analytics
  if (dashboardAnalytics?.ultimas24h) {
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
        String(dashboardAnalytics.ultimas24h.totalEntradas || 0),
        String(dashboardAnalytics.ultimas24h.totalTriagens || 0),
        String(dashboardAnalytics.ultimas24h.totalAtendimentos || 0)
      ]);
    }

    if (dashboardAnalytics.hoje) {
      dashRows.push([
        'Hoje',
        String(dashboardAnalytics.hoje.totalEntradas || 0),
        String(dashboardAnalytics.hoje.totalTriagens || 0),
        String(dashboardAnalytics.hoje.totalAtendimentos || 0)
      ]);
    }

    if (dashboardAnalytics.ontem) {
      dashRows.push([
        'Ontem',
        String(dashboardAnalytics.ontem.totalEntradas || 0),
        String(dashboardAnalytics.ontem.totalTriagens || 0),
        String(dashboardAnalytics.ontem.totalAtendimentos || 0)
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
