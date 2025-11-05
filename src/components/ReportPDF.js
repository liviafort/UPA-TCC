// src/components/ReportPDF.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: '3 solid #09AC96',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#09AC96',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 5,
    textAlign: 'center',
  },

  // UPA Info Card
  upaCard: {
    marginBottom: 20,
    padding: 18,
    backgroundColor: '#f9fafb',
    border: '1 solid #e5e7eb',
  },
  upaName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  upaInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 10,
  },
  upaLabel: {
    fontWeight: 'bold',
    width: 90,
    color: '#374151',
    fontSize: 10,
  },
  upaValue: {
    flex: 1,
    color: '#6b7280',
    fontSize: 10,
  },

  // Filter Info
  filterInfo: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderLeft: '4 solid #0284c7',
  },
  filterText: {
    fontSize: 10,
    color: '#0c4a6e',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#09AC96',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '2 solid #d1fae5',
  },

  // Stats Cards Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 15,
    backgroundColor: '#f9fafb',
    borderLeft: '4 solid #09AC96',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
  },

  // Chart Representation (Bar Charts)
  chartContainer: {
    marginTop: 15,
  },
  chartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chartLabel: {
    width: 120,
    fontSize: 9,
    color: '#374151',
    fontWeight: 'bold',
  },
  chartBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    position: 'relative',
  },
  chartBarFill: {
    height: '100%',
  },
  chartValue: {
    width: 60,
    fontSize: 9,
    color: '#1f2937',
    textAlign: 'right',
    paddingLeft: 8,
    fontWeight: 'bold',
  },

  // Pie Chart Representation
  pieChartContainer: {
    marginTop: 15,
  },
  pieChartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
  },
  pieChartColor: {
    width: 16,
    height: 16,
    marginRight: 10,
  },
  pieChartLabel: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
    fontWeight: 'bold',
  },
  pieChartValue: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: 'bold',
    marginRight: 10,
  },
  pieChartPercentage: {
    fontSize: 9,
    color: '#6b7280',
  },

  // Tables
  table: {
    marginTop: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    paddingVertical: 10,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    borderBottom: '2 solid #d1d5db',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#374151',
  },
  tableCellBold: {
    fontWeight: 'bold',
    color: '#1f2937',
  },

  // Wait Time Analytics Summary
  waitTimeSummary: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    marginBottom: 15,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderLeft: '3 solid #f59e0b',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#92400e',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#78350f',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 8,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },

  // Page Break
  pageBreak: {
    marginTop: 20,
  },
});

// Color map for classifications
const COLOR_MAP = {
  'NAO_TRIADO': '#94a3b8',
  'AZUL': '#3b82f6',
  'VERDE': '#10b981',
  'AMARELO': '#f59e0b',
  'VERMELHO': '#ef4444'
};

const ReportPDF = ({ upaData, analyticsData, filterDate, dashboardAnalytics }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = () => {
    return new Date().toLocaleString('pt-BR');
  };

  const formatMinutes = (minutes) => {
    if (!minutes || minutes < 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Atendimentos UPA</Text>
          <Text style={styles.subtitle}>Gerado em: {formatDateTime()}</Text>
        </View>

        {/* Filter Date Info */}
        {filterDate && (
          <View style={styles.filterInfo}>
            <Text style={styles.filterText}>Período: {filterDate}</Text>
          </View>
        )}

        {/* UPA Information */}
        {upaData && (
          <View style={styles.upaCard}>
            <Text style={styles.upaName}>{upaData.nome}</Text>
            <View style={styles.upaInfoRow}>
              <Text style={styles.upaLabel}>Endereço:</Text>
              <Text style={styles.upaValue}>{upaData.endereco || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        {analyticsData?.statistics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estatísticas Rápidas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total de Eventos</Text>
                <Text style={styles.statValue}>{analyticsData.statistics.total_visits || 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Média Diária</Text>
                <Text style={styles.statValue}>{analyticsData.statistics.daily_average || 0}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Taxa de Conclusão</Text>
                <Text style={styles.statValue}>{analyticsData.statistics.occupancy_rate || 0}%</Text>
              </View>
              {analyticsData.bairros && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Bairros Atendidos</Text>
                  <Text style={styles.statValue}>{analyticsData.bairros.length || 0}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Distribution Chart */}
        {analyticsData?.distribution && analyticsData.distribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distribuição por Classificação</Text>
            <View style={styles.pieChartContainer}>
              {analyticsData.distribution.map((item, index) => {
                const total = analyticsData.distribution.reduce((sum, d) => sum + d.quantidade, 0);
                const percentage = total > 0 ? ((item.quantidade / total) * 100).toFixed(1) : 0;
                return (
                  <View key={index} style={styles.pieChartItem}>
                    <View style={[styles.pieChartColor, { backgroundColor: COLOR_MAP[item.classificacao] || '#94a3b8' }]} />
                    <Text style={styles.pieChartLabel}>{item.classificacao}</Text>
                    <Text style={styles.pieChartValue}>{item.quantidade}</Text>
                    <Text style={styles.pieChartPercentage}>({percentage}%)</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Percentages Chart */}
        {analyticsData?.distribution && analyticsData.distribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Percentuais por Classificação</Text>
            <View style={styles.chartContainer}>
              {analyticsData.distribution.map((item, index) => {
                const total = analyticsData.distribution.reduce((sum, d) => sum + d.quantidade, 0);
                const percentage = total > 0 ? ((item.quantidade / total) * 100) : 0;
                return (
                  <View key={index} style={styles.chartBar}>
                    <Text style={styles.chartLabel}>{item.classificacao}</Text>
                    <View style={styles.chartBarContainer}>
                      <View style={[
                        styles.chartBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: COLOR_MAP[item.classificacao] || '#94a3b8'
                        }
                      ]} />
                    </View>
                    <Text style={styles.chartValue}>{percentage.toFixed(1)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </Page>

      {/* Second Page */}
      <Page size="A4" style={styles.page}>
        {/* Wait Times Chart */}
        {analyticsData?.waitTimes && analyticsData.waitTimes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tempos Médios de Espera por Classificação</Text>
            <View style={styles.chartContainer}>
              {analyticsData.waitTimes.map((item, index) => {
                const maxTime = Math.max(...analyticsData.waitTimes.map(w => w.tempoMedio || 0));
                const percentage = maxTime > 0 ? ((item.tempoMedio / maxTime) * 100) : 0;
                return (
                  <View key={index} style={styles.chartBar}>
                    <Text style={styles.chartLabel}>{item.classificacao}</Text>
                    <View style={styles.chartBarContainer}>
                      <View style={[
                        styles.chartBarFill,
                        {
                          width: `${percentage}%`,
                          backgroundColor: COLOR_MAP[item.classificacao] || '#94a3b8'
                        }
                      ]} />
                    </View>
                    <Text style={styles.chartValue}>{formatMinutes(item.tempoMedio)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Wait Time Analytics */}
        {analyticsData?.statistics?.average_wait_time && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Análise Detalhada de Tempos de Espera</Text>
            <View style={styles.waitTimeSummary}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Tempo Médio Geral</Text>
                <Text style={styles.summaryValue}>
                  {formatMinutes(analyticsData.statistics.average_wait_time)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Bairros Table */}
        {analyticsData?.bairros && analyticsData.bairros.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bairros Atendidos (Top 10)</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }, styles.tableCellBold]}>Bairro</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Pacientes</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Percentual</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Tempo Médio</Text>
              </View>
              {analyticsData.bairros.slice(0, 10).map((bairro, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{bairro.bairro}</Text>
                  <Text style={styles.tableCell}>{bairro.total}</Text>
                  <Text style={styles.tableCell}>{bairro.percentual?.toFixed(1)}%</Text>
                  <Text style={styles.tableCell}>{bairro.mediaTempoEspera} min</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Dashboard Analytics */}
        {dashboardAnalytics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Estatísticas Gerais - {dashboardAnalytics.upaNome || upaData?.nome}
            </Text>

            {/* Comparison Table */}
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, { flex: 2 }, styles.tableCellBold]}>Período</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Entradas</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Triagens</Text>
                <Text style={[styles.tableCell, styles.tableCellBold]}>Atendimentos</Text>
              </View>

              {dashboardAnalytics.ultimas24h && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }, styles.tableCellBold]}>Últimas 24h</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.ultimas24h.totalEntradas || 0}</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.ultimas24h.totalTriagens || 0}</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.ultimas24h.totalAtendimentos || 0}</Text>
                </View>
              )}

              {dashboardAnalytics.hoje && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }, styles.tableCellBold]}>Hoje</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.hoje.totalEntradas || 0}</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.hoje.totalTriagens || 0}</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.hoje.totalAtendimentos || 0}</Text>
                </View>
              )}

              {dashboardAnalytics.ontem && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }, styles.tableCellBold]}>Ontem</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.ontem.totalEntradas || 0}</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.ontem.totalTriagens || 0}</Text>
                  <Text style={styles.tableCell}>{dashboardAnalytics.ontem.totalAtendimentos || 0}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Veja +Saúde - Análise detalhada de dados e estatísticas das UPAs{'\n'}
          Relatório gerado automaticamente em {formatDateTime()}
        </Text>
      </Page>
    </Document>
  );
};

export default ReportPDF;
