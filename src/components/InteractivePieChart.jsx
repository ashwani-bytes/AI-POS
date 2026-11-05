import React, { useState } from 'react'

/**
 * Interactive SVG Donut & Pie Chart Component
 * Crisp vector graphics with hover animations, tooltips, and legends.
 */
const InteractivePieChart = ({ 
  data = [], 
  title, 
  subtitle, 
  unit = '₹', 
  isCount = false 
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  // Filter out zero or negative values
  const validData = data.filter(d => Number(d.value) > 0)
  const total = validData.reduce((acc, d) => acc + Number(d.value), 0)

  // Radius & circumference for SVG circle stroke dash
  const size = 220
  const strokeWidth = 36
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  let accumulatedPercent = 0

  return (
    <div className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-black text-base md:text-lg text-slate-900 dark:text-white">
            {title}
          </h3>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {validData.length} Slices
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-4">
            {subtitle}
          </p>
        )}
      </div>

      {validData.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full border-4 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-2">
            📊
          </div>
          <p className="text-sm font-bold text-slate-500">No data available for this chart yet</p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
          
          {/* SVG Donut / Pie Visualization */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg 
              width={size} 
              height={size} 
              viewBox={`0 0 ${size} ${size}`} 
              className="transform -rotate-90 filter drop-shadow-sm"
            >
              {/* Background ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-slate-100 dark:text-slate-800"
              />

              {/* Slices */}
              {validData.map((item, idx) => {
                const percent = total > 0 ? (item.value / total) : 0
                const strokeDasharray = `${percent * circumference} ${circumference}`
                const strokeDashoffset = -accumulatedPercent * circumference
                accumulatedPercent += percent

                const isHovered = hoveredIdx === idx

                return (
                  <circle
                    key={item.label || idx}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={item.color || '#3b82f6'}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                )
              })}
            </svg>

            {/* Center Label in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
              {hoveredIdx !== null && validData[hoveredIdx] ? (
                <>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                    {validData[hoveredIdx].label}
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {unit === '₹' ? `₹${validData[hoveredIdx].value.toFixed(0)}` : validData[hoveredIdx].value}
                  </span>
                  <span className="text-[11px] font-black text-blue-600 dark:text-blue-400">
                    {validData[hoveredIdx].percentage || Math.round((validData[hoveredIdx].value / total) * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Total
                  </span>
                  <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {unit === '₹' ? `₹${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}` : total}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {isCount ? 'Units' : 'Revenue'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="flex-1 w-full space-y-2 max-h-[190px] overflow-y-auto custom-scrollbar pr-1">
            {validData.map((item, idx) => {
              const isHovered = hoveredIdx === idx
              const pct = item.percentage || (total > 0 ? Math.round((item.value / total) * 100) : 0)

              return (
                <div
                  key={item.label || idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`p-2 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                    isHovered 
                      ? 'bg-slate-100 dark:bg-slate-800 scale-[1.02] shadow-sm' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      {unit === '₹' ? `₹${item.value.toFixed(0)}` : item.value}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white min-w-[36px] text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}
    </div>
  )
}

export default InteractivePieChart
