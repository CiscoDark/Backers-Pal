
import React, { useState } from 'react';
import { CURRENCY_SYMBOL } from '../constants';
import { vibrate } from '../utils/haptics';

// Bar Chart Component
interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
  title: string;
  yAxisPrefix?: string;
  yAxisSuffix?: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, yAxisPrefix = '', yAxisSuffix = '' }) => {
  const [tooltip, setTooltip] = useState<{ x: number, y: number, label: string, value: number } | null>(null);

  const chartHeight = 250;
  const chartWidth = 500;
  const barPadding = 10;
  const yAxisLabelWidth = 45;
  const xAxisLabelHeight = 20;

  const maxValue = Math.max(...data.map(d => d.value), 0);
  const scale = maxValue === 0 ? 0 : (chartHeight - xAxisLabelHeight - 20) / maxValue; // 20 for top padding
  const drawableWidth = chartWidth - yAxisLabelWidth;
  const barWidth = data.length > 0 ? (drawableWidth - ((data.length -1) * barPadding)) / data.length : 0;

  const handleBarClick = (e: React.MouseEvent, label: string, value: number) => {
    e.stopPropagation();
    vibrate(30);
    const container = (e.currentTarget as SVGElement).closest('.chart-container');
    if (!container) return;

    if (tooltip && tooltip.label === label) {
      setTooltip(null);
      return;
    }
    
    const rect = container.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (chartWidth / rect.width);
    const svgY = (e.clientY - rect.top) * (chartHeight / rect.height);
    
    setTooltip({
        x: svgX,
        y: svgY - 20,
        label,
        value,
    });
  };

  return (
    <div className="liquid-glass p-6 rounded-2xl">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="relative chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" onClick={() => setTooltip(null)}>
          <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                  </feMerge>
              </filter>
          </defs>
          {/* Y-Axis Labels */}
          <text x="0" y="20" className="text-xs fill-current text-text-secondary">{yAxisPrefix}{maxValue.toFixed(0)}{yAxisSuffix}</text>
          <text x="0" y={chartHeight - xAxisLabelHeight} className="text-xs fill-current text-text-secondary">{yAxisPrefix}0{yAxisSuffix}</text>
          <line x1={yAxisLabelWidth - 5} y1="20" x2={yAxisLabelWidth - 5} y2={chartHeight - xAxisLabelHeight} className="stroke-current text-border" strokeWidth="1"/>

          {/* Bars and X-Axis Labels */}
          <g transform={`translate(${yAxisLabelWidth}, 0)`}>
            {data.map((d, i) => {
              const barHeight = d.value * scale;
              const x = i * (barWidth + barPadding);
              const y = chartHeight - barHeight - xAxisLabelHeight;

              return (
                <g key={d.label}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    className="fill-current text-primary transition-opacity duration-200 cursor-pointer"
                    onClick={(e) => handleBarClick(e, d.label, d.value)}
                    style={{ filter: 'url(#glow)'}}
                  />
                  <text x={x + barWidth / 2} y={chartHeight - 5} textAnchor="middle" className="text-xs fill-current text-text-secondary">{d.label}</text>
                </g>
              );
            })}
          </g>
        </svg>

        {tooltip && (
          <div
            className="absolute liquid-glass text-text-primary text-xs rounded-lg py-1 px-2 pointer-events-none z-10"
            style={{ 
                left: `0px`, 
                top: `0px`, 
                transform: `translate(${tooltip.x}px, ${tooltip.y}px) translateX(-50%)`,
                transformOrigin: 'top center'
            }}
          >
            <div>{tooltip.label}</div>
            <div className="font-bold">{yAxisPrefix}{tooltip.value.toFixed(2)}{yAxisSuffix}</div>
          </div>
        )}
      </div>
    </div>
  );
};


// Line Chart Component - REMOVED as it's no longer used.
interface LineChartData {
  date: string;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  title: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, title }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

  const chartHeight = 250;
  const chartWidth = 500;
  const yAxisLabelWidth = 35;
  const xAxisLabelHeight = 20;
  const paddingTop = 20;
  const paddingBottom = xAxisLabelHeight;

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  
  const yRange = maxValue - minValue;
  const drawableHeight = chartHeight - paddingTop - paddingBottom;
  const scaleY = yRange === 0 ? 0 : drawableHeight / yRange;

  const drawableWidth = chartWidth - yAxisLabelWidth;
  const scaleX = data.length <= 1 ? 0 : drawableWidth / (data.length - 1);
  
  const getCoords = (d: LineChartData, i: number) => ({
      x: yAxisLabelWidth + i * scaleX,
      y: chartHeight - paddingBottom - (d.value - minValue) * scaleY,
  });

  const path = data
    .map((d, i) => {
      const { x, y } = getCoords(d, i);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
    
  const handlePointClick = (e: React.MouseEvent, date: string, value: number) => {
    e.stopPropagation();
    vibrate(30);
    const container = (e.currentTarget as SVGElement).closest('.chart-container');
    if (!container) return;

    if (tooltip && tooltip.date === date) {
      setTooltip(null);
      return;
    }

    const rect = container.getBoundingClientRect();
    const svgX = (e.clientX - rect.left) * (chartWidth / rect.width);
    const svgY = (e.clientY - rect.top) * (chartHeight / rect.height);

    setTooltip({
      x: svgX,
      y: svgY - 20,
      date: new Date(date).toLocaleDateString(),
      value,
    });
  };

  return (
    <div className="liquid-glass p-6 rounded-2xl">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="relative chart-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" onClick={() => setTooltip(null)}>
           <defs>
              <filter id="glowLine" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                  </feMerge>
              </filter>
          </defs>
          {/* Y-Axis Labels */}
          <text x="0" y={paddingTop} className="text-xs fill-current text-text-secondary">{maxValue.toFixed(1)}%</text>
          <text x="0" y={chartHeight - paddingBottom} className="text-xs fill-current text-text-secondary">{minValue.toFixed(1)}%</text>
          <line x1={yAxisLabelWidth - 5} y1={paddingTop} x2={yAxisLabelWidth - 5} y2={chartHeight - paddingBottom} className="stroke-current text-border" strokeWidth="1"/>
          
          {/* Line and Points */}
          <path d={path} className="fill-none stroke-current text-secondary" strokeWidth="2" style={{ filter: 'url(#glowLine)'}} />
          {data.map((d, i) => {
              const {x, y} = getCoords(d, i);
              return (
                <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="5"
                    className="fill-current text-secondary cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                    onClick={(e) => handlePointClick(e, d.date, d.value)}
                />
              )
          })}
        </svg>

        {tooltip && (
          <div
            className="absolute liquid-glass text-text-primary text-xs rounded-lg py-1 px-2 pointer-events-none z-10"
            style={{ 
                left: '0px', 
                top: '0px', 
                transform: `translate(${tooltip.x}px, ${tooltip.y}px) translateX(-50%)`,
                transformOrigin: 'top center'
            }}
          >
            <div>{tooltip.date}</div>
            <div className="font-bold">{tooltip.value.toFixed(2)}%</div>
          </div>
        )}
      </div>
    </div>
  );
};