import React, { useRef, useEffect, useState, useMemo } from 'react';

const FunctionPlotter = ({ expression1, expression2, mode, intersectionPoint, width = 600, height = 400 }) => {
  const svgRef = useRef(null);
  // Adjusted initial viewBox to prevent potential rendering issues before plotRange is calculated
  const [viewBox, setViewBox] = useState({ x: -10, y: -10, width: 20, height: 20 });

  const plotRange = useMemo(() => {
    let minX = -10, maxX = 10, minY = -10, maxY = 10;

    if (mode === 'sequence' && expression1 && expression1.terms) {
      const terms = expression1.terms.filter(t => typeof t === 'number' && isFinite(t));
      if (terms.length > 0) {
        minX = 0;
        maxX = Math.max(10, terms.length - 1);
        minY = Math.min(...terms, -10);
        maxY = Math.max(...terms, 10);
      }
    } else if (mode === 'plot') {
      // For function plotting, if points are available, adjust range based on them
      const allPoints = [];
      if (expression1?.points) allPoints.push(...expression1.points);
      if (expression2?.points) allPoints.push(...expression2.points);

      if (allPoints.length > 0) {
        minX = Math.min(...allPoints.map(p => p.x), -10);
        maxX = Math.max(...allPoints.map(p => p.x), 10);
        minY = Math.min(...allPoints.map(p => p.y), -10);
        maxY = Math.max(...allPoints.map(p => p.y), 10);
      }
    }

    // Add some padding, but ensure it doesn't collapse the range to zero if all points are identical
    const effectiveWidth = Math.max(maxX - minX, 1); // Ensure minimum width of 1
    const effectiveHeight = Math.max(maxY - minY, 1); // Ensure minimum height of 1

    const paddingX = effectiveWidth * 0.1;
    const paddingY = effectiveHeight * 0.1;

    return {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY
    };
  }, [expression1, expression2, mode]);

  useEffect(() => {
    // Update viewBox when plotRange changes
    setViewBox({
      x: plotRange.minX,
      y: plotRange.minY,
      width: plotRange.maxX - plotRange.minX,
      height: plotRange.maxY - plotRange.minY
    });
  }, [plotRange]);

  // Ensure width and height are numerical and positive before using in transformations
  const effectiveWidth = width > 0 ? width : 600;
  const effectiveHeight = height > 0 ? height : 400;

  const transformX = (x) => (x - viewBox.x) / viewBox.width * effectiveWidth;
  const transformY = (y) => effectiveHeight - ((y - viewBox.y) / viewBox.height * effectiveHeight);

  const renderFunction = (points, color = 'steelblue') => {
    if (!points || points.length < 2) return null;

    const pathData = points.map((p, i) => {
      // Only draw if point is finite, otherwise break path
      if (!isFinite(p.x) || !isFinite(p.y)) return 'M'; // Start new path segment
      const command = i === 0 ? 'M' : 'L';
      return `${command}${transformX(p.x)},${transformY(p.y)}`;
    }).join(' ');

    // Filter out 'M M' or 'L M' sequences which can occur from NaN values
    const cleanedPathData = pathData.replace(/(M|L)(M|L)/g, '$1');

    if (cleanedPathData.trim() === 'M') return null; // No valid path data

    return (
      <path
        key={color}
        d={cleanedPathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    );
  };

  const renderSequence = (terms, color = 'darkorange') => {
    if (!terms || terms.length === 0) return null;

    return terms.map((term, index) => {
      if (typeof term !== 'number' || !isFinite(term)) return null;
      return (
        <circle
          key={`seq-${index}`}
          cx={transformX(index)}
          cy={transformY(term)}
          r="3"
          fill={color}
        />
      );
    });
  };

  return (
    <div className="relative w-full h-full min-h-[300px] bg-white border border-slate-200 rounded-md shadow-inner overflow-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        // Ensure viewBox values are finite and valid to prevent SVG errors
        viewBox={`${isFinite(viewBox.x) ? viewBox.x : 0} ${isFinite(viewBox.y) ? viewBox.y : 0} ${isFinite(viewBox.width) && viewBox.width > 0 ? viewBox.width : 1} ${isFinite(viewBox.height) && viewBox.height > 0 ? viewBox.height : 1}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ border: '1px solid #e2e8f0', borderRadius: '0.375rem' }}
      >
        {/* Grid lines */}
        {Array.from({ length: Math.ceil(viewBox.width) + 1 }).map((_, i) => {
          const x = Math.floor(viewBox.x) + i;
          return (
            <line
              key={`vx-${x}`}
              x1={transformX(x)}
              y1={transformY(viewBox.y)}
              x2={transformX(x)}
              y2={transformY(viewBox.y + viewBox.height)}
              stroke="#eee"
              strokeWidth="0.5"
            />
          );
        })}
        {Array.from({ length: Math.ceil(viewBox.height) + 1 }).map((_, i) => {
          const y = Math.floor(viewBox.y) + i;
          return (
            <line
              key={`hy-${y}`}
              x1={transformX(viewBox.x)}
              y1={transformY(y)}
              x2={transformX(viewBox.x + viewBox.width)}
              y2={transformY(y)}
              stroke="#eee"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Axes */}
        <line x1={transformX(viewBox.x)} y1={transformY(0)} x2={transformX(viewBox.x + viewBox.width)} y2={transformY(0)} stroke="#64748b" strokeWidth="1" />
        <line x1={transformX(0)} y1={transformY(viewBox.y)} x2={transformX(0)} y2={transformY(viewBox.y + viewBox.height)} stroke="#64748b" strokeWidth="1" />

        {/* Axis labels */}
        <text x={transformX(viewBox.x + viewBox.width) - 5} y={transformY(0) + 15} textAnchor="end" fontSize="8" fill="#64748b">x</text>
        <text x={transformX(0) + 10} y={transformY(viewBox.y + viewBox.height) + 5} textAnchor="start" fontSize="8" fill="#64748b">y</text>

        {/* Origin label */}
        <text x={transformX(0) - 5} y={transformY(0) - 5} textAnchor="end" fontSize="8" fill="#64748b">(0,0)</text>

        {mode === 'plot' && expression1?.points && renderFunction(expression1.points, 'steelblue')}
        {mode === 'plot' && expression2?.points && renderFunction(expression2.points, 'indianred')}
        {mode === 'sequence' && expression1?.terms && renderSequence(expression1.terms, 'darkorange')}

        {/* Intersection Point */}
        {intersectionPoint && typeof intersectionPoint.x === 'number' && isFinite(intersectionPoint.x) &&
         typeof intersectionPoint.y === 'number' && isFinite(intersectionPoint.y) && (
          <g>
            <circle
              cx={transformX(intersectionPoint.x)}
              cy={transformY(intersectionPoint.y)}
              r="4"
              fill="purple"
              stroke="white"
              strokeWidth="1.5"
            />
            <text
              x={transformX(intersectionPoint.x) + 8}
              y={transformY(intersectionPoint.y) - 8}
              fontSize="10"
              fill="purple"
            >
              ({intersectionPoint.x.toFixed(2)}, {intersectionPoint.y.toFixed(2)})
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default FunctionPlotter;
