import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function SkillGapChart({ have = 0, partial = 0, missing = 0 }) {
  const data = {
    labels: ['Have', 'Partial', 'Missing'],
    datasets: [{
      data: [have, partial, missing],
      backgroundColor: [
        'rgba(6, 214, 160, 0.85)',
        'rgba(255, 209, 102, 0.85)',
        'rgba(239, 71, 111, 0.85)',
      ],
      borderColor: [
        'rgba(6, 214, 160, 0.3)',
        'rgba(255, 209, 102, 0.3)',
        'rgba(239, 71, 111, 0.3)',
      ],
      borderWidth: 2,
      hoverOffset: 6,
    }]
  }

  const options = {
    responsive: true,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          padding: 8,
          font: { size: 12, family: 'Plus Jakarta Sans' },
          usePointStyle: true,
          pointStyleWidth: 8,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 20, 40, 0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw} skill${ctx.raw !== 1 ? 's' : ''}`
        }
      }
    }
  }

  return (
    <div className="relative">
      <Doughnut data={data} options={options} />
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{top: '-8px'}}>
        <span className="text-3xl font-extrabold text-slate-100">{have}</span>
        <span className="text-xs text-slate-500">skills matched</span>
      </div>
    </div>
  )
}
