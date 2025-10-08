import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

interface ExportData {
  overview: any;
  userMetrics: any;
  coachMetrics: any;
  financialMetrics: any;
  sessionMetrics: any;
  topCoaches: any[];
  topSpecialties: any[];
}

// Export to CSV
export const exportToCSV = (data: ExportData, filename: string = 'analytics-report') => {
  // Prepare data for CSV
  const overviewData = [
    ['Overview Metrics', ''],
    ['Total Users', data.overview.totalUsers],
    ['Total Coaches', data.overview.totalCoaches],
    ['Completed Sessions', data.overview.totalSessions],
    ['Total Revenue', `$${data.overview.totalRevenue}`],
    ['User Growth', `${data.overview.userGrowth}%`],
    ['Coach Growth', `${data.overview.coachGrowth}%`],
    ['Session Growth', `${data.overview.sessionGrowth}%`],
    ['Revenue Growth', `${data.overview.revenueGrowth}%`],
    ['', ''],
    ['User Metrics', ''],
    ['New Users This Month', data.userMetrics.newUsersThisMonth],
    ['Active Users', data.userMetrics.activeUsers],
    ['User Retention Rate', `${data.userMetrics.userRetentionRate}%`],
    ['Avg Sessions Per User', data.userMetrics.averageSessionsPerUser],
    ['', ''],
    ['Coach Metrics', ''],
    ['Average Rating', data.coachMetrics.averageRating],
    ['Total Coach Hours', data.coachMetrics.totalCoachHours],
    ['Avg Session Duration', `${data.coachMetrics.averageSessionDuration} min`],
    ['Coach Utilization Rate', `${data.coachMetrics.coachUtilizationRate}%`],
    ['', ''],
    ['Financial Metrics', ''],
    ['Monthly Recurring Revenue', `$${data.financialMetrics.monthlyRecurringRevenue}`],
    ['Average Session Value', `$${data.financialMetrics.averageSessionValue}`],
    ['Revenue Per User', `$${data.financialMetrics.revenuePerUser}`],
    ['Conversion Rate', `${data.financialMetrics.conversionRate}%`],
    ['', ''],
    ['Session Metrics', ''],
    ['Completion Rate', `${data.sessionMetrics.completionRate}%`],
    ['No Show Rate', `${data.sessionMetrics.noShowRate}%`],
    ['Cancellation Rate', `${data.sessionMetrics.cancellationRate}%`],
    ['Average Rating', data.sessionMetrics.averageRating],
  ];

  // Add top coaches data
  const topCoachesData = [
    ['', ''],
    ['Top Coaches', '', '', ''],
    ['Name', 'Rating', 'Sessions', 'Revenue'],
    ...(data.topCoaches || []).map((coach: any) => [
      coach.name || 'N/A',
      coach.rating || 0,
      coach.sessions || 0,
      `$${coach.revenue || 0}`
    ])
  ];

  // Add top specialties data
  const topSpecialtiesData = [
    ['', ''],
    ['Top Specialties', '', ''],
    ['Specialty', 'Sessions', 'Percentage'],
    ...(data.topSpecialties || []).map((specialty: any) => [
      specialty.name || 'N/A',
      specialty.sessions || 0,
      `${specialty.percentage || 0}%`
    ])
  ];

  // Combine all data
  const csvData = [...overviewData, ...topCoachesData, ...topSpecialtiesData];

  // Convert to CSV
  const csv = Papa.unparse(csvData);

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to PDF
export const exportToPDF = (data: ExportData, filename: string = 'analytics-report') => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Add title
  pdf.setFontSize(20);
  pdf.text('Analytics Report', pageWidth / 2, 20, { align: 'center' });
  
  // Add date
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
  
  let yPosition = 40;
  
  // Overview Section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overview Metrics', 14, yPosition);
  yPosition += 10;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const overviewData = [
    ['Metric', 'Value', 'Growth'],
    ['Total Users', String(data.overview.totalUsers || 0), `${data.overview.userGrowth || 0}%`],
    ['Total Coaches', String(data.overview.totalCoaches || 0), `${data.overview.coachGrowth || 0}%`],
    ['Completed Sessions', String(data.overview.totalSessions || 0), `${data.overview.sessionGrowth || 0}%`],
    ['Total Revenue', `$${data.overview.totalRevenue || 0}`, `${data.overview.revenueGrowth || 0}%`],
  ];
  
  autoTable(pdf, {
    head: [overviewData[0]],
    body: overviewData.slice(1),
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  yPosition = (pdf as any).lastAutoTable.finalY + 15;
  
  // User Metrics
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('User Metrics', 14, yPosition);
  yPosition += 10;
  
  const userMetricsData = [
    ['Metric', 'Value'],
    ['New Users This Month', String(data.userMetrics.newUsersThisMonth || 0)],
    ['Active Users', String(data.userMetrics.activeUsers || 0)],
    ['User Retention Rate', `${data.userMetrics.userRetentionRate || 0}%`],
    ['Avg Sessions Per User', String(data.userMetrics.averageSessionsPerUser || 0)],
  ];
  
  autoTable(pdf, {
    head: [userMetricsData[0]],
    body: userMetricsData.slice(1),
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  yPosition = (pdf as any).lastAutoTable.finalY + 15;
  
  // Coach Metrics
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Coach Metrics', 14, yPosition);
  yPosition += 10;
  
  const coachMetricsData = [
    ['Metric', 'Value'],
    ['Average Rating', data.coachMetrics.averageRating.toString()],
    ['Total Coach Hours', data.coachMetrics.totalCoachHours.toString()],
    ['Avg Session Duration', `${data.coachMetrics.averageSessionDuration} min`],
    ['Coach Utilization Rate', `${data.coachMetrics.coachUtilizationRate}%`],
  ];
  
  autoTable(pdf, {
    head: [coachMetricsData[0]],
    body: coachMetricsData.slice(1),
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Check if we need a new page
  if ((pdf as any).lastAutoTable.finalY > 220) {
    pdf.addPage();
    yPosition = 20;
  } else {
    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // Financial Metrics
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Financial Metrics', 14, yPosition);
  yPosition += 10;
  
  const financialMetricsData = [
    ['Metric', 'Value'],
    ['Monthly Recurring Revenue', `$${data.financialMetrics.monthlyRecurringRevenue}`],
    ['Average Session Value', `$${data.financialMetrics.averageSessionValue}`],
    ['Revenue Per User', `$${data.financialMetrics.revenuePerUser}`],
    ['Conversion Rate', `${data.financialMetrics.conversionRate}%`],
  ];
  
  autoTable(pdf, {
    head: [financialMetricsData[0]],
    body: financialMetricsData.slice(1),
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Check if we need a new page
  if ((pdf as any).lastAutoTable.finalY > 220) {
    pdf.addPage();
    yPosition = 20;
  } else {
    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // Top Coaches
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top Coaches', 14, yPosition);
  yPosition += 10;
  
  const topCoachesData = [
    ['Name', 'Rating', 'Sessions', 'Revenue'],
    ...(data.topCoaches || []).map((coach: any) => [
      coach.name || 'N/A',
      String(coach.rating || 0),
      String(coach.sessions || 0),
      `$${coach.revenue || 0}`
    ])
  ];
  
  autoTable(pdf, {
    head: [topCoachesData[0]],
    body: topCoachesData.slice(1),
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Check if we need a new page
  if ((pdf as any).lastAutoTable.finalY > 220) {
    pdf.addPage();
    yPosition = 20;
  } else {
    yPosition = (pdf as any).lastAutoTable.finalY + 15;
  }
  
  // Top Specialties
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Top Specialties', 14, yPosition);
  yPosition += 10;
  
  const topSpecialtiesData = [
    ['Specialty', 'Sessions', 'Percentage'],
    ...(data.topSpecialties || []).map((specialty: any) => [
      specialty.name || 'N/A',
      String(specialty.sessions || 0),
      `${specialty.percentage || 0}%`
    ])
  ];
  
  autoTable(pdf, {
    head: [topSpecialtiesData[0]],
    body: topSpecialtiesData.slice(1),
    startY: yPosition,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Save the PDF
  pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
};