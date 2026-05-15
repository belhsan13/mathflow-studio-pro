export const MathEngine = {
  parseExpression: (input) => {
    if (!input) return '0';
    let expr = input.toLowerCase()
      .replace(/\^/g, '**')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/exp/g, 'Math.exp')
      .replace(/log/g, 'Math.log')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/pi/g, 'Math.PI')
      .replace(/e/g, 'Math.E');
    
    expr = expr.replace(/(\d)(x|n)/g, '$1*$2');
    return expr;
  },

  evaluate: (expr, x) => {
    try {
      const fn = new Function('x', 'n', `return ${expr}`);
      const result = fn(x, x);
      return (typeof result === 'number' && !isNaN(result)) ? result : NaN;
    } catch (e) {
      return NaN;
    }
  },

  getPoints: (expr, range = { min: -10, max: 10 }, steps = 150) => {
    const points = [];
    const stepSize = (range.max - range.min) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = range.min + i * stepSize;
      const y = MathEngine.evaluate(expr, x);
      if (!isNaN(y) && isFinite(y)) {
        points.push({ x, y });
      }
    }
    return points;
  },

  getSequencePoints: (expr, start = 0, count = 15) => {
    const points = [];
    for (let n = start; n < start + count; n++) {
      const y = MathEngine.evaluate(expr, n);
      if (!isNaN(y) && isFinite(y)) {
        points.push({ x: n, y });
      }
    }
    return points;
  },

  findIntersections: (expr1, expr2, range = { min: -10, max: 10 }) => {
    const intersections = [];
    const steps = 300;
    const h = (range.max - range.min) / steps;
    for (let i = 0; i < steps; i++) {
      const x1 = range.min + i * h;
      const x2 = x1 + h;
      const diff1 = MathEngine.evaluate(expr1, x1) - MathEngine.evaluate(expr2, x1);
      const diff2 = MathEngine.evaluate(expr1, x2) - MathEngine.evaluate(expr2, x2);
      if (diff1 * diff2 <= 0 && !isNaN(diff1) && !isNaN(diff2)) {
        let low = x1, high = x2, mid = (x1 + x2) / 2;
        for(let j = 0; j < 6; j++) {
          mid = (low + high) / 2;
          const mDiff = MathEngine.evaluate(expr1, mid) - MathEngine.evaluate(expr2, mid);
          if (mDiff * (MathEngine.evaluate(expr1, low) - MathEngine.evaluate(expr2, low)) <= 0) high = mid;
          else low = mid;
        }
        intersections.push({ x: mid, y: MathEngine.evaluate(expr1, mid) });
      }
    }
    return intersections;
  },

  format: (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return "N/A";
    return Number(num).toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: decimals 
    });
  }
};