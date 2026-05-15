import React from 'react';
import { LineChart, Circle } from 'lucide-react';

const FunctionPlotter = ({ title, points, points2, intersections, range, mode }) => {
  const width = 600;
  const height = 400;
  const padding = 40;

  const xMin = range.min;
  const xMax = range.max;
  
  // Dynamically calculate yMin and yMax based on all points
  const allPointsY = [...points, ...points2].filter(p => !isNaN(p.y)).map(p => p.y);
  const yMin = allPointsY.length > 0 ? Math.min(...allPointsY, 0) : -10;
  const yMax = allPointsY.length > 0 ? Math.max(...allPointsY, 0) : 10;

  const xScale = (x) => ((x - xMin) / (xMax - xMin)) * (width - 2 * padding) + padding;
  const yScale = (y) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

  // Generate path data for continuous functions
  const getPathData = (pts) => {
    if (mode === 'sequence' || !pts || pts.length === 0) return '';
    const filteredPoints = pts.filter(p => !isNaN(p.x) && !isNaN(p.y));
    if (filteredPoints.length === 0) return '';

    let path = `M ${xScale(filteredPoints[0].x)} ${yScale(filteredPoints[0].y)}`;
    for (let i = 1; i < filteredPoints.length; i++) {
      const p = filteredPoints[i];
      // Check for large jumps (discontinuities) and start a new path segment
      const prevP = filteredPoints[i - 1];
      const distanceY = Math.abs(yScale(p.y) - yScale(prevP.y));
      const maxJump = height / 2; // Arbitrary threshold, can be adjusted

      if (distanceY > maxJump && Math.abs(p.y) > 1e10) { // If it's a huge jump, often a vertical asymptote
        path += ` M ${xScale(p.x)} ${yScale(p.y)}`;
      } else {
        path += ` L ${xScale(p.x)} ${yScale(p.y)}`;
      }
    }
    return path;
  };

  const pathData1 = getPathData(points);
  const pathData2 = getPathData(points2);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 text-left">
      <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
        <LineChart size={14} /> Graphe
      </label>
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-100 font-mono">
          {/* X Axis */}
          <line x1={padding} y1={yScale(0)} x2={width - padding} y2={yScale(0)} stroke="#cbd5e1" strokeWidth="1" />
          {/* Y Axis */}
          <line x1={xScale(0)} y1={padding} x2={xScale(0)} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />

          {/* X Axis Labels */}
          {[xMin, 0, xMax].map((val, i) => {
            const sx = xScale(val);
            return (
              <g key={`x-label-${i}`}>
                <line x1={sx} y1={yScale(0) - 5} x2={sx} y2={yScale(0) + 5} stroke="#e2e8f0" strokeWidth="1" />
                <text x={sx} y={yScale(0) + 20} textAnchor="middle" fill="#64748b" fontSize="10">
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Y Axis Labels */}
          {[yMin, 0, yMax].map((val, i) => {
            const sy = yScale(val);
            return (
              <g key={`y-label-${i}`}>
                <line x1={xScale(0) - 5} y1={sy} x2={xScale(0) + 5} y2={sy} stroke="#e2e8f0" strokeWidth="1" />
                <text x={xScale(0) - 10} y={sy + 3} textAnchor="end" fill="#64748b" fontSize="10">
                  {val.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Plot points / paths */}
          {mode === 'continuous' ? (
            <g>
              <path d={pathData1} stroke="#6366f1" strokeWidth="2" fill="none" />
              <path d={pathData2} stroke="#f97316" strokeWidth="2" fill="none" />
            </g>
          ) : (
            <g>
              {points.map((p, i) => (
                <Circle key={`p1-${i}`} cx={xScale(p.x)} cy={yScale(p.y)} r="3" fill="#6366f1" />
              ))}
              {points2.map((p, i) => (
                <Circle key={`p2-${i}`} cx={xScale(p.x)} cy={yScale(p.y)} r="3" fill="#f97316" />
              ))}
            </g>
          )}

          {/* Intersections */}
          {intersections.map((p, i) => (
            <Circle key={`int-${i}`} cx={xScale(p.x)} cy={yScale(p.y)} r="4" fill="#ef4444" stroke="white" strokeWidth="1.5" />
          ))}

        </svg>
      </div>
    </div>
  );
};

export default FunctionPlotter;
