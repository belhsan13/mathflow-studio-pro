import React from 'react';
import { motion } from 'framer-motion';
import { Settings, X, Info } from 'lucide-react';

const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Recommandé)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-pro', name: 'Gemini Pro (Ancien)' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' }
];

const AISettings = ({
  apiKey,
  setApiKey,
  model,
  setModel,
  temperature,
  setTemperature,
  thinkingLevel,
  setThinkingLevel,
  systemInstruction,
  onClose
}) => {
  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    setApiKey(newKey);
    // Store in localStorage for persistence
    localStorage.setItem('geminiApiKey', newKey);
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setModel(newModel);
    localStorage.setItem('geminiModel', newModel);
  };

  const handleTemperatureChange = (e) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);
    localStorage.setItem('geminiTemperature', newTemp);
  };

  const handleThinkingLevelChange = (e) => {
    const newLevel = e.target.value;
    setThinkingLevel(newLevel);
    localStorage.setItem('geminiThinkingLevel', newLevel);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      className="fixed right-0 top-0 h-full w-full md:w-1/2 lg:w-1/3 bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Settings size={20} /> Paramètres IA
        </h3>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Fermer les paramètres IA"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        <div>
          <label htmlFor="gemini-api-key" className="block text-sm font-medium text-slate-700 mb-1">Clé API Gemini</label>
          <input
            id="gemini-api-key"
            type="password"
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Entrez votre clé API Gemini"
          />
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Info size={14} />Votre clé est stockée localement dans votre navigateur.
          </p>
          <p className="text-xs text-slate-500 mt-1">Obtenez une clé ici: <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google AI Studio</a></p>
        </div>

        <div>
          <label htmlFor="gemini-model" className="block text-sm font-medium text-slate-700 mb-1">Modèle Gemini</label>
          <select
            id="gemini-model"
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 bg-white"
            value={model}
            onChange={handleModelChange}
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">Choisissez le modèle qui convient le mieux à vos besoins.</p>
        </div>

        <div>
          <label htmlFor="gemini-temperature" className="block text-sm font-medium text-slate-700 mb-1">Température ({temperature})</label>
          <input
            id="gemini-temperature"
            type="range"
            min="0" max="1" step="0.1"
            className="w-full accent-indigo-600"
            value={temperature}
            onChange={handleTemperatureChange}
          />
          <p className="text-xs text-slate-500 mt-1">Contrôle la "créativité" de l'IA. 0.0 = plus précis, 1.0 = plus créatif.</p>
        </div>

        <div>
          <label htmlFor="gemini-thinking-level" className="block text-sm font-medium text-slate-700 mb-1">Niveau de réflexion</label>
          <select
            id="gemini-thinking-level"
            className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 bg-white"
            value={thinkingLevel}
            onChange={handleThinkingLevelChange}
          >
            <option value="none">Aucun</option>
            <option value="low">Faible</option>
            <option value="medium">Moyen</option>
            <option value="high">Élevé</option>
          </select>
          <p className="text-xs text-slate-500 mt-1">Définit la profondeur de la réflexion de l'IA (peut augmenter la latence).</p>
        </div>

        {/* Read-only System Instruction for context, as it's defined in prompts.js */}
        <div>
          <label htmlFor="system-instruction" className="block text-sm font-medium text-slate-700 mb-1">Instruction Système (Non modifiable)</label>
          <textarea
            id="system-instruction"
            className="w-full p-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600 text-sm h-32 resize-none"
            value={systemInstruction}
            readOnly
            disabled
          />
          <p className="text-xs text-slate-500 mt-1">Cette instruction définit le rôle et le format de réponse de l'IA.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default AISettings;
