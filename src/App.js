import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, MessageSquareText, Plus, X, FunctionSquare, Sigma, AreaChart, CircleDot, Brain, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { MathEngine } from './MathEngine';
import FunctionPlotter from './components/FunctionPlotter';
import AIChat from './components/AIChat';
import AISettings from './components/AISettings';
import { AI_SYSTEM_INSTRUCTION, INITIAL_AI_SUGGESTIONS } from './ai-utils/prompts';

const EXAMPLES = [
  { label: 'Quadratique', expr: 'x^2 - 4', mode: 'plot' },
  { label: 'Trigonométrique', expr: 'sin(x)', mode: 'plot' },
  { label: 'Exponentielle', expr: 'exp(x)', mode: 'plot' },
  { label: 'Logarithmique', expr: 'log(x)', mode: 'plot' },
  { label: 'Suite Arithmétique', expr: '2n + 1', mode: 'sequence' },
  { label: 'Suite Géométrique', expr: '2^n', mode: 'sequence' }
];

export default function App() {
  const [expression, setExpression] = useState('');
  const [expression2, setExpression2] = useState('');
  const [mode, setMode] = useState('plot'); // 'plot' or 'sequence'
  const [result, setResult] = useState(NaN);
  const [parsedExpr, setParsedExpr] = useState(null);
  const [parsedExpr2, setParsedExpr2] = useState(null);
  const [plotPoints, setPlotPoints] = useState(null);
  const [plotPoints2, setPlotPoints2] = useState(null);
  const [sequenceAnalysis, setSequenceAnalysis] = useState(null);
  const [intersectionPoint, setIntersectionPoint] = useState(null);
  const [error, setError] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // AI Settings
  const [aiApiKey, setAiApiKey] = useState(localStorage.getItem('geminiApiKey') || '');
  const [aiModel, setAiModel] = useState(localStorage.getItem('geminiModel') || 'gemini-1.5-flash');
  const [aiTemperature, setAiTemperature] = useState(parseFloat(localStorage.getItem('geminiTemperature')) || 0.7);
  const [aiThinkingLevel, setAiThinkingLevel] = useState(localStorage.getItem('geminiThinkingLevel') || 'none');

  const inputRef = useRef(null);

  const handleExpressionChange = (e) => {
    setExpression(e.target.value);
  };

  const handleExpression2Change = (e) => {
    setExpression2(e.target.value);
  };

  const updateMath = useCallback(() => {
    setError(null);
    setResult(NaN);
    setPlotPoints(null);
    setPlotPoints2(null);
    setSequenceAnalysis(null);
    setIntersectionPoint(null);

    if (!expression.trim()) {
      setParsedExpr(null);
      setParsedExpr2(null);
      return;
    }

    let currentParsedExpr = null;
    let currentParsedExpr2 = null;

    try {
      currentParsedExpr = MathEngine.parse(expression);
      setParsedExpr(currentParsedExpr);

      if (expression2.trim()) {
        currentParsedExpr2 = MathEngine.parse(expression2);
        setParsedExpr2(currentParsedExpr2);
      } else {
        setParsedExpr2(null);
      }
    } catch (e) {
      setError('Syntaxe invalide pour l\'expression.');
      setParsedExpr(null);
      setParsedExpr2(null);
      return;
    }

    if (mode === 'plot') {
      const range = { min: -10, max: 10 };
      const step = 0.1;

      const points1 = MathEngine.generatePoints(expression, range, step, 'x');
      setPlotPoints({ expr: expression, points: points1 });

      if (expression2.trim()) {
        const points2 = MathEngine.generatePoints(expression2, range, step, 'x');
        setPlotPoints2({ expr: expression2, points: points2 });

        // Find intersection
        const intersections = MathEngine.findIntersection(expression, expression2, range, step);
        if (intersections.length > 0) {
          setIntersectionPoint(intersections[0]); // Display first intersection for simplicity
        } else {
          setIntersectionPoint(null);
        }
      }

      const f0 = MathEngine.evaluate(expression, { x: 0 });
      setResult(f0);
    } else if (mode === 'sequence') {
      const nMax = 10;
      const analysis = MathEngine.analyzeSequence(expression, nMax);
      setSequenceAnalysis(analysis);

      // Generate points for plotting sequence terms
      const sequencePoints = analysis.terms.map((term, index) => ({ x: index, y: term }));
      setPlotPoints({ expr: expression, terms: sequencePoints });

      const u0 = MathEngine.evaluate(expression, { n: 0 });
      setResult(u0);
    }
  }, [expression, expression2, mode]);

  useEffect(() => {
    updateMath();
  }, [expression, expression2, mode, updateMath]);

  useEffect(() => {
    // Load AI API key from environment variable if available and not set in local storage
    // This code relies on Vite's import.meta.env for environment variables
    if (import.meta.env.VITE_GEMINI_API_KEY && !aiApiKey) {
      setAiApiKey(import.meta.env.VITE_GEMINI_API_KEY);
      localStorage.setItem('geminiApiKey', import.meta.env.VITE_GEMINI_API_KEY);
    }
  }, [aiApiKey]);

  const handleExampleClick = (example) => {
    setExpression(example.expr);
    setExpression2('');
    setMode(example.mode);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const clearInputs = () => {
    setExpression('');
    setExpression2('');
    setError(null);
    setResult(NaN);
    setPlotPoints(null);
    setPlotPoints2(null);
    setSequenceAnalysis(null);
    setIntersectionPoint(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'plot' ? 'sequence' : 'plot'));
    setExpression2(''); // Clear second expression when changing mode
    clearInputs(); // Clear other states
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 p-4 flex items-center justify-between z-10">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <AreaChart size={28} className="text-indigo-600" />
          MathFlow Studio Élité AI
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(true)}
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
            aria-label="Ouvrir le chat IA"
          >
            <MessageSquareText size={20} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="relative p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
            aria-label="Ouvrir les paramètres IA"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Left Panel: Input & Controls */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md flex flex-col space-y-6">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <FunctionSquare size={20} className="text-indigo-500" />
            Calculateur d'Expressions
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="expression-input" className="block text-sm font-medium text-slate-700 mb-1">Expression principale ({mode === 'plot' ? 'f(x)' : 'u_n'})</label>
              <input
                ref={inputRef}
                id="expression-input"
                type="text"
                className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono text-slate-800"
                value={expression}
                onChange={handleExpressionChange}
                placeholder={mode === 'plot' ? 'Ex: x^2 - 2x + 1' : 'Ex: 2*n + 1'}
              />
            </div>

            {mode === 'plot' && (
              <div>
                <label htmlFor="expression2-input" className="block text-sm font-medium text-slate-700 mb-1">Seconde Expression (g(x), optionnel)</label>
                <input
                  id="expression2-input"
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono text-slate-800"
                  value={expression2}
                  onChange={handleExpression2Change}
                  placeholder="Ex: x + 3"
                />
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">Mode:</span>
              <button
                onClick={toggleMode}
                className={clsx(
                  'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all',
                  mode === 'plot' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
                aria-pressed={mode === 'plot'}
              >
                <FunctionSquare size={16} /> Fonction (f(x))
              </button>
              <button
                onClick={toggleMode}
                className={clsx(
                  'flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all',
                  mode === 'sequence' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                )}
                aria-pressed={mode === 'sequence'}
              >
                <Sigma size={16} /> Suite (u_n)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={clearInputs}
              className="flex-1 p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              <X size={18} /> Effacer
            </button>
            <button
              onClick={() => updateMath()}
              className="flex-1 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Mettre à jour
            </button>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-200">
            <h3 className="text-md font-semibold text-slate-800">Exemples Rapides</h3>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm hover:bg-slate-200 transition-colors"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: Plotter */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md flex flex-col space-y-6 relative">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <AreaChart size={20} className="text-purple-500" />
            Visualisation Graphique
          </h2>

          <div className="flex-1 relative w-full h-full min-h-[300px]">
            <FunctionPlotter
              expression1={plotPoints}
              expression2={plotPoints2}
              mode={mode}
              intersectionPoint={intersectionPoint}
            />
          </div>

          {/* Results Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div className="space-y-2">
              <h3 className="text-md font-semibold text-slate-800">Résultats Numériques</h3>
              <div className="bg-slate-50 p-4 rounded-md space-y-2 text-sm text-slate-700">
                <div className="flex justify-between border-b pb-2">
                  <span>{mode === 'plot' ? 'f(0):' : 'u_0:'}</span>
                  <span className="font-medium text-slate-900 font-mono">{MathEngine.format(result)}</span>
                </div>
                {mode === 'plot' && intersectionPoint && (
                  <div className="flex justify-between border-b pb-2">
                    <span>Intersection:</span>
                    <span className="font-medium text-slate-900 font-mono">({MathEngine.format(intersectionPoint.x)}, {MathEngine.format(intersectionPoint.y)})</span>
                  </div>
                )}
                {mode === 'sequence' && sequenceAnalysis && (
                  <>
                    <div className="flex justify-between border-b pb-2">
                      <span>Type de suite:</span>
                      <span className="font-medium text-slate-900 font-mono">
                        {sequenceAnalysis.isArithmetic ? 'Arithmétique' : (sequenceAnalysis.isGeometric ? 'Géométrique' : 'Autre')}
                      </span>
                    </div>
                    {sequenceAnalysis.param !== null && sequenceAnalysis.paramName !== null && (
                      <div className="flex justify-between">
                        <span>{sequenceAnalysis.paramName}:</span>
                        <span className="font-medium text-slate-900 font-mono">{MathEngine.format(sequenceAnalysis.param)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-md font-semibold text-slate-800">Termes / Points Clés</h3>
              <div className="bg-slate-50 p-4 rounded-md max-h-40 overflow-y-auto text-sm text-slate-700">
                {mode === 'sequence' && sequenceAnalysis && sequenceAnalysis.terms.length > 0 ? (
                  <ul className="space-y-1">
                    {sequenceAnalysis.terms.map((term, index) => (
                      <li key={index} className="flex justify-between">
                        <span>u_{index}:</span>
                        <span className="font-mono">{MathEngine.format(term)}</span>
                      </li>
                    ))}
                  </ul>
                ) : mode === 'plot' && plotPoints?.points.length > 0 ? (
                  <p className="italic text-slate-500">Voir le graphe pour la visualisation des points.</p>
                ) : (
                  <p className="italic text-slate-500">Aucune donnée à afficher.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Chat Sidebar */}
      <AnimatePresence>
        {showChat && (
          <AIChat
            apiKey={aiApiKey}
            model={aiModel}
            temperature={aiTemperature}
            systemInstruction={AI_SYSTEM_INSTRUCTION}
            currentExpression={expression}
            currentExpression2={expression2}
            currentMode={mode}
            onClose={() => setShowChat(false)}
            onUpdateApiKey={() => setShowSettings(true)} // Suggest opening settings if API key error
          />
        )}
      </AnimatePresence>

      {/* AI Settings Sidebar */}
      <AnimatePresence>
        {showSettings && (
          <AISettings
            apiKey={aiApiKey}
            setApiKey={setAiApiKey}
            model={aiModel}
            setModel={setAiModel}
            temperature={aiTemperature}
            setTemperature={setAiTemperature}
            thinkingLevel={aiThinkingLevel}
            setThinkingLevel={setAiThinkingLevel}
            systemInstruction={AI_SYSTEM_INSTRUCTION} // Display system instruction
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}