import { evaluate, parse } from 'mathjs';

export const MathEngine = {
  // Safely evaluates a mathematical expression
  evaluate: (expression, variables = {}) => {
    try {
      const scope = { ...variables };
      const result = evaluate(expression, scope);
      // Ensure result is a finite number, otherwise return NaN
      return typeof result === 'number' && isFinite(result) ? result : NaN;
    } catch (error) {
      console.error("Error evaluating expression:", error);
      return NaN;
    }
  },

  // Parses an expression to check for validity without evaluating
  parse: (expression) => {
    try {
      const parsed = parse(expression);
      // Return the parsed expression object to be used by evaluate later
      return parsed;
    } catch (error) {
      // If parsing fails, throw an error to be caught by the caller
      throw new Error(`Invalid expression syntax: ${error.message}`);
    }
  },

  // Generates points for plotting a function or sequence
  generatePoints: (expression, range, step, param = 'x') => {
    const points = [];
    try {
      const parsedExpr = MathEngine.parse(expression); // Use MathEngine.parse to get parsed object
      for (let i = range.min; i <= range.max; i += step) {
        const value = MathEngine.evaluate(parsedExpr, { [param]: i });
        if (typeof value === 'number' && isFinite(value)) {
          points.push({ x: i, y: value });
        }
      }
    } catch (error) {
      console.error("Error generating points:", error);
    }
    return points;
  },

  // Finds intersection points between two expressions
  findIntersection: (expr1, expr2, range, step) => {
    const intersections = [];
    try {
      const parsedExpr1 = MathEngine.parse(expr1);
      const parsedExpr2 = MathEngine.parse(expr2);

      for (let i = range.min; i < range.max; i += step) {
        const y1_current = MathEngine.evaluate(parsedExpr1, { x: i });
        const y2_current = MathEngine.evaluate(parsedExpr2, { x: i });

        const y1_next = MathEngine.evaluate(parsedExpr1, { x: i + step });
        const y2_next = MathEngine.evaluate(parsedExpr2, { x: i + step });

        if (isFinite(y1_current) && isFinite(y2_current) && isFinite(y1_next) && isFinite(y2_next)) {
          // Check if functions cross each other or are very close
          if ((y1_current - y2_current) * (y1_next - y2_next) < 0 || Math.abs(y1_current - y2_current) < 1e-6) {
            // Simple linear approximation for intersection point
            const intersectionX = i - step * (y1_current - y2_current) / ((y1_next - y2_next) - (y1_current - y2_current));
            const intersectionY = MathEngine.evaluate(parsedExpr1, { x: intersectionX });
            if (isFinite(intersectionX) && isFinite(intersectionY)) {
              intersections.push({ x: intersectionX, y: intersectionY });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error finding intersection:", error);
    }
    return intersections;
  },

  // Analyzes a sequence for arithmetic/geometric properties and generates terms
  analyzeSequence: (expression, nMax = 10) => {
    const terms = [];
    let isArithmetic = true;
    let isGeometric = true;
    let diff = null;
    let ratio = null;

    try {
      const parsedExpr = MathEngine.parse(expression);

      for (let n = 0; n <= nMax; n++) {
        const value = MathEngine.evaluate(parsedExpr, { n: n });
        if (typeof value === 'number' && isFinite(value)) {
          terms.push(value);
        } else {
          terms.push(NaN); // Mark as invalid term
          isArithmetic = false;
          isGeometric = false;
        }
      }

      if (terms.length > 1 && terms.every(t => typeof t === 'number' && isFinite(t))) {
        diff = terms[1] - terms[0];
        if (terms[0] !== 0) {
          ratio = terms[1] / terms[0];
        }

        for (let i = 1; i < terms.length - 1; i++) {
          if (Math.abs((terms[i + 1] - terms[i]) - diff) > 1e-9) {
            isArithmetic = false;
          }
          // Handle division by zero for ratio check
          if (terms[i] === 0) {
            if (terms[i+1] !== 0) isGeometric = false; // if current term is 0 but next is not, cannot be geometric
          } else if (Math.abs((terms[i + 1] / terms[i]) - ratio) > 1e-9) {
            isGeometric = false;
          }
        }
      } else {
        isArithmetic = false;
        isGeometric = false;
      }

      return {
        terms: terms,
        isArithmetic: isArithmetic,
        isGeometric: isGeometric,
        param: isArithmetic ? diff : (isGeometric ? ratio : null),
        paramName: isArithmetic ? 'Raison (d)' : (isGeometric ? 'Raison (q)' : null)
      };
    } catch (error) {
      console.error("Error analyzing sequence:", error);
      return { terms: [], isArithmetic: false, isGeometric: false, param: null, paramName: null };
    }
  },

  // Safely formats a number, handles NaN, Infinity, and null
  format: (value, precision = 2) => {
    if (typeof value !== 'number' || !isFinite(value)) {
      return 'N/A';
    }
    return value.toFixed(precision);
  }
};