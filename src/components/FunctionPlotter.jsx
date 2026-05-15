import React from 'react';

export default function FunctionPlotter({ points, points2 = [], intersections = [], range, mode = 'continuous' }) {
  const width = 800;
  const height = 400;
  const padding = 40;

  const allPoints = [...points, ...points2];
  const yValues = allPoints.map(p => p.y);
  const minY = Math.min(-1, ...yValues);
  const maxY = Math.max(1, ...yValues);
  const yRange = maxY - minY || 2;

  const scaleX = (x) => ((x - range.min) / (range.max - range.min)) * (width - 2 * padding) + padding;
  const scaleY = (y) => height - (((y - minY) / yRange) * (height - 2 * padding) + padding);

  const renderPath = (pts, color) => {
    if (pts.length < 2) return null;
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`).join(' ');
    return <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
  };

  const renderPoints = (pts, color) => {
    return pts.map((p, i) => (
      <g key={i}>
        <line 
          x1={scaleX(p.x)} y1={scaleY(0)} 
          x2={scaleX(p.x)} y2={scaleY(p.y)} 
          stroke={color} strokeWidth="1" strokeDasharray="4 2" opacity="0.3" 
        />
        <circle cx={scaleX(p.x)} cy={scaleY(p.y)} r="4" fill={color} className="transition-all hover:r-6" />
      </g>
    ));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid */}
        <line x1={padding} y1={scaleY(0)} x2={width - padding} y2={scaleY(0)} stroke="#e2e8f0" strokeWidth="1" />
        <line x1={scaleX(0)} y1={padding} x2={scaleX(0)} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
        
        {/* Plots */}
        {mode === 'continuous' ? renderPath(points, '#4f46e5') : renderPoints(points, '#4f46e5')}
        {points2.length > 0 && renderPath(points2, '#10b981')}

        {/* Intersections */}
        {intersections.map((pt, i) => (
          <circle key={i} cx={scaleX(pt.x)} cy={scaleY(pt.y)} r="6" fill="#f43f5e" className="animate-pulse" />
        ))}

        {/* Labels */}
        <text x={width - padding} y={scaleY(0) + 15} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">x/n</text>
        <text x={scaleX(0) + 5} y={padding} className="text-[10px] fill-slate-400 font-mono">y</text>
      </svg>
    </div>
  );
}