import React, { useState, useEffect, useMemo } from 'react';
import { 
  FunctionSquare, 
  Zap, 
  AreaChart, 
  Variable, 
  Calculator, 
  RefreshCw, 
  Layers, 
  BrainCircuit, 
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { MathEngine } from './MathEngine';
import FunctionPlotter from './components/FunctionPlotter';

const EXAMPLES = [
  { label: 'Quadratic', expr: 'x^2 - 4', mode: 'plot' },
  { label: 'Arith. Sequence', expr: '3*n + 2', mode: 'sequence' },
  { label: 'Geom. Sequence', expr: '2 * 1.5^n', mode: 'sequence' },
  { label: 'Intersection', expr: 'sin(x)', expr2: '0.5*x', mode: 'intersection' }
];

export default function MathFlowApp() {
  const [expression, setExpression] = useState('x^2 - 4');
  const [expression2, setExpression2] = useState('x');
  const [activeTab, setActiveTab] = useState('plot');
  const [range, setRange] = useState({ min: -5, max: 5 });
  const [suggestions, setSuggestions] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const parsedExpr = useMemo(() => MathEngine.parseExpression(expression), [expression]);
  const parsedExpr2 = useMemo(() => MathEngine.parseExpression(expression2), [expression2]);
  
  const points = useMemo(() => {
    if (activeTab === 'sequence') return MathEngine.getSequencePoints(parsedExpr, 0, 15);
    return MathEngine.getPoints(parsedExpr, range);
  }, [parsedExpr, range, activeTab]);

  const points2 = useMemo(() => {
    if (activeTab === 'intersection') return MathEngine.getPoints(parsedExpr2, range);
    return [];
  }, [parsedExpr2, range, activeTab]);

  const intersections = useMemo(() => {
    if (activeTab === 'intersection') return MathEngine.findIntersections(parsedExpr, parsedExpr2, range);
    return [];
  }, [parsedExpr, parsedExpr2, range, activeTab]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoadingAI(true);
      try {
        const apiKey = window?.ENV?.GEMINI_API_KEY || '';
        if (!apiKey) throw new Error('No API Key');

        const prompt = `Student is studying ${activeTab === 'sequence' ? 'sequence u_n = ' : 'function f(x) = '}${expression}. Suggest 3 math questions. Return JSON array of strings.`;
        
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } })
        });
        
        const data = await res.json();
        setSuggestions(JSON.parse(data.candidates[0].content.parts[0].text));
      } catch (err) {
        setSuggestions(activeTab === 'sequence' 
          ? ["Is this sequence convergent?", "Find the 100th term.", "Is it monotonic?"]
          : ["Find the roots of f(x).", "Calculate the derivative.", "Determine the limit at infinity."]);
      } finally {
        setLoadingAI(false);
      }
    };
    const timer = setTimeout(fetchSuggestions, 800);
    return () => clearTimeout(timer);
  }, [expression, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <FunctionSquare size={20} />
          </div>
          <h1 className="font-bold text-xl">MathFlow <span className="text-indigo-600">Pro</span></h1>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {['plot', 'sequence', 'intersection'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all",
                activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {tab === 'sequence' ? 'Suit (u_n)' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              {activeTab === 'sequence' ? 'Sequence Expression' : 'Primary Function'}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 italic">{activeTab === 'sequence' ? 'u_n =' : 'f(x) ='}</span>
              <input 
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {activeTab === 'intersection' && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Second Function g(x)</label>
                <input 
                  value={expression2}
                  onChange={(e) => setExpression2(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-600 outline-none"
                />
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button 
                  key={ex.label} 
                  onClick={() => { setExpression(ex.expr); if(ex.expr2) setExpression2(ex.expr2); setActiveTab(ex.mode); }}
                  className="text-[11px] px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full font-bold hover:bg-indigo-100"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </section>

          <AnimatePresence mode="wait">
            {activeTab === 'sequence' ? (
              <motion.section 
                key="seq" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <h3 className="font-bold flex items-center gap-2 mb-4"><Layers size={18} className="text-violet-500" /> Sequence Terms</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="flex justify-between p-2 bg-slate-50 rounded border border-slate-100 text-xs font-mono">
                      <span className="text-slate-400">u_{n}</span>
                      <span className="font-bold text-indigo-600">{MathEngine.format(MathEngine.evaluate(parsedExpr, n))}</span>
                    </div>
                  ))}
                </div>
              </motion.section>
            ) : (
              <motion.section 
                key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
              >
                <h3 className="font-bold flex items-center gap-2 mb-4"><Variable size={18} className="text-indigo-500" /> Viewport Range</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={range.min} onChange={e => setRange(r => ({...r, min: parseFloat(e.target.value) || 0}))} className="p-2 bg-slate-50 border rounded-lg text-sm" />
                  <input type="number" value={range.max} onChange={e => setRange(r => ({...r, max: parseFloat(e.target.value) || 0}))} className="p-2 bg-slate-50 border rounded-lg text-sm" />
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2 text-indigo-300"><BrainCircuit size={18} /> Tutor AI Suggestions</h3>
              {loadingAI && <RefreshCw size={14} className="animate-spin text-slate-500" />}
            </div>
            <div className="space-y-3">
              {suggestions.map((q, i) => (
                <div key={i} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 text-sm flex gap-3">
                  <MessageSquare size={14} className="text-indigo-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-300">{q}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <FunctionPlotter 
            points={points} 
            points2={points2}
            intersections={intersections}
            range={activeTab === 'sequence' ? { min: -1, max: 16 } : range} 
            mode={activeTab === 'sequence' ? 'discrete' : 'continuous'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold flex items-center gap-2 mb-3"><Calculator size={18} className="text-slate-400" /> Analysis</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between border-b pb-2">
                  <span>Mode:</span>
                  <span className="font-medium text-slate-900 capitalize">{activeTab}</span>
                </div>
                <div className="flex justify-between">
                  <span>Origin f(0):</span>
                  <span className="font-medium text-slate-900 font-mono">{MathEngine.format(MathEngine.evaluate(parsedExpr, 0))}</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-bold flex items-center gap-2 mb-3">Syntax Info</h4>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="bg-slate-50 p-2 rounded">x^2 : Power</div>
                <div className="bg-slate-50 p-2 rounded">sin(x) : Trig</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}