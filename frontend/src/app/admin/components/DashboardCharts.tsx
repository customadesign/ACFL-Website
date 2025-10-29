'use client';

import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface DashboardChartsProps {
  stats: {
    totalUsers: number;
    totalCoaches: number;
    totalClients: number;
    totalAppointments: number;
    pendingApprovals: number;
    monthlyRevenue: number;
  };
}

export function OverviewBarChart({ stats }: DashboardChartsProps) {
  const data = {
    labels: ['Users', 'Coaches', 'Clients', 'Appointments', 'Pending', 'Revenue (k)'],
    datasets: [
      {
        label: 'Statistics',
        data: [
          stats.totalUsers,
          stats.totalCoaches,
          stats.totalClients,
          stats.totalAppointments,
          stats.pendingApprovals,
          Math.round(stats.monthlyRevenue / 1000)
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // blue
          'rgba(34, 197, 94, 0.8)',    // green
          'rgba(168, 85, 247, 0.8)',   // purple
          'rgba(249, 115, 22, 0.8)',   // orange
          'rgba(234, 179, 8, 0.8)',    // yellow
          'rgba(16, 185, 129, 0.8)'    // emerald
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(16, 185, 129)'
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Platform Overview',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        },
        color: '#1f2937'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.label === 'Revenue (k)') {
                label += '$' + context.parsed.y + 'k';
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280'
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280'
        }
      }
    }
  };

  return (
    <div className="h-[300px] sm:h-[350px]">
      <Bar data={data} options={options} />
    </div>
  );
}

export function UserDistributionChart({ stats }: DashboardChartsProps) {
  const data = {
    labels: ['Coaches', 'Clients', 'Pending Approvals'],
    datasets: [
      {
        label: 'Users',
        data: [
          stats.totalCoaches,
          stats.totalClients,
          stats.pendingApprovals
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(234, 179, 8, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
          'rgb(234, 179, 8)'
        ],
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          font: {
            size: 12
          },
          color: '#6b7280',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'User Distribution',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        },
        color: '#1f2937'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              label += ` (${percentage}%)`;
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="h-[300px] sm:h-[350px]">
      <Doughnut data={data} options={options} />
    </div>
  );
}

export function RevenueAndAppointmentsTrendChart({ stats }: DashboardChartsProps) {
  // Generate mock trend data for the last 6 months
  const generateTrendData = (currentValue: number, months: number = 6) => {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const variance = Math.random() * 0.3 + 0.7; // 70-100% of current value
      data.push(Math.round(currentValue * variance));
    }
    data[data.length - 1] = currentValue; // Set last month to actual value
    return data;
  };

  const months = ['6 months ago', '5 months ago', '4 months ago', '3 months ago', '2 months ago', 'This month'];

  const data = {
    labels: months,
    datasets: [
      {
        label: 'Revenue ($)',
        data: generateTrendData(stats.monthlyRevenue),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Appointments',
        data: generateTrendData(stats.totalAppointments),
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(249, 115, 22)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          },
          color: '#6b7280',
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Revenue & Appointments Trend',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        },
        color: '#1f2937'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 0) {
                label += '$' + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        },
        title: {
          display: true,
          text: 'Revenue ($)',
          color: '#16a34a',
          font: {
            weight: 'bold' as const
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#6b7280'
        },
        title: {
          display: true,
          text: 'Appointments',
          color: '#f97316',
          font: {
            weight: 'bold' as const
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280'
        }
      }
    }
  };

  return (
    <div className="h-[300px] sm:h-[350px]">
      <Line data={data} options={options} />
    </div>
  );
}

export function ActivityChart({ stats }: DashboardChartsProps) {
  const data = {
    labels: ['Total Users', 'Active Coaches', 'Active Clients'],
    datasets: [
      {
        label: 'Count',
        data: [stats.totalUsers, stats.totalCoaches, stats.totalClients],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'User Activity',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        },
        color: '#1f2937'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6b7280'
        }
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280'
        }
      }
    }
  };

  return (
    <div className="h-[250px]">
      <Bar data={data} options={options} />
    </div>
  );
}
