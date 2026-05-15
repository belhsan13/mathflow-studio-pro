import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, Send, Loader2, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchStreamedGeminiResponse } from '../ai-utils/gemini';
import { INITIAL_AI_SUGGESTIONS } from '../ai-utils/prompts';

const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    // Basic Markdown rendering for titles, bold, italics, lists
    let html = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li>$1</li>');

    if (html.includes('<li>')) {
      html = `<ul>${html}</ul>`;
    }

    // Convert newlines to <br> for better readability in simple paragraphs
    html = html.split('\n').map(line => {
        if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<li>') || line.startsWith('</ul')) return line;
        return line + '<br/>';
    }).join('');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return renderMarkdown(content);
};

const AIChat = ({
  apiKey,
  model,
  temperature,
  systemInstruction,
  currentExpression,
  currentExpression2,
  currentMode,
  onClose,
  onUpdateApiKey
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentAssistantResponse, setCurrentAssistantResponse] = useState('');
  const [currentAssistantParsed, setCurrentAssistantParsed] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState(INITIAL_AI_SUGGESTIONS);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, currentAssistantResponse]);

  const sendMessage = async (message) => {
    if (!message.trim() || isLoading) return;
    setError(null);
    setIsLoading(true);
    setCurrentAssistantResponse('');
    setCurrentAssistantParsed(null);

    const newUserMessage = { role: 'user', content: message };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setInputMessage('');
    setSuggestedQuestions([]); // Clear suggestions after user asks a question

    try {
      let streamedResponseText = '';
      let streamedResponseJson = {};
      let jsonBuffer = ''; // Buffer for incomplete JSON chunks

      await fetchStreamedGeminiResponse(
        apiKey,
        model,
        temperature,
        systemInstruction,
        [...chatHistory, newUserMessage], // Pass updated history including current message
        'low', // Thinking level, could be configurable
        currentExpression,
        currentExpression2,
        currentMode,
        (chunk) => {
          // Accumulate chunks into jsonBuffer and try to parse for structured output
          jsonBuffer += chunk;
          try {
            // Attempt to find and parse a complete JSON object from the buffer
            const firstBrace = jsonBuffer.indexOf('{');
            const lastBrace = jsonBuffer.lastIndexOf('}');

            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              const potentialJson = jsonBuffer.substring(firstBrace, lastBrace + 1);
              const parsedData = JSON.parse(potentialJson);

              // Merge parsed data into our structured object for incremental updates
              streamedResponseJson = { ...streamedResponseJson, ...parsedData };
              setCurrentAssistantParsed({ ...streamedResponseJson });

              // Update text content from explanation or fallback to raw chunk
              streamedResponseText = streamedResponseJson.explanation || '';
              onNewChunk(streamedResponseText); // This should be handled by the onNewChunk callback

              // Extract suggested questions if present
              if (parsedData.suggested_questions && Array.isArray(parsedData.suggested_questions)) {
                setSuggestedQuestions(parsedData.suggested_questions);
              }

              // Clear the processed JSON from the buffer
              jsonBuffer = jsonBuffer.substring(lastBrace + 1);
            } else {
                // If no complete JSON, just append chunk to raw text for display
                // This part ensures that text before/after JSON (if not structured) is shown
                streamedResponseText += chunk; 
            }

          } catch (jsonParseError) {
            // If parsing fails, it's not a complete JSON or invalid JSON. Append chunk to raw text.
            streamedResponseText += chunk;
          }
          setCurrentAssistantResponse(streamedResponseText); // Always update with the latest text
        },
        () => {
          // On complete
          setChatHistory((prev) => [
            ...prev,
            { role: 'model', content: streamedResponseText, structured: currentAssistantParsed }
          ]);
          setCurrentAssistantResponse('');
          setCurrentAssistantParsed(null);
          setIsLoading(false);
        },
        (err) => {
          setError(err.message);
          setIsLoading(false);
          setCurrentAssistantResponse('');
          setCurrentAssistantParsed(null);
          // If API key error, prompt user to update
          if (err.message.includes('API key')) {
            onUpdateApiKey();
          }
        }
      );
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (question) => {
    sendMessage(question);
  };

  const renderCard = (card) => {
    switch (card.type) {
      case 'calcul':
        return (
          <div key={card.title} className="bg-indigo-50 p-3 rounded-md border border-indigo-200 text-indigo-800 text-sm">
            <h4 className="font-semibold text-indigo-900 mb-1">{card.title}</h4>
            <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">{card.content}</pre>
          </div>
        );
      case 'graphique':
        return (
          <div key={card.title} className="bg-green-50 p-3 rounded-md border border-green-200 text-green-800 text-sm">
            <h4 className="font-semibold text-green-900 mb-1">{card.title}</h4>
            <p className="text-xs">Expression 1: <code className="font-mono">{card.expression1}</code></p>
            {card.expression2 && <p className="text-xs">Expression 2: <code className="font-mono">{card.expression2}</code></p>}
            <p className="text-xs italic mt-1">Le graphe sera affiché dans l'interface principale si vous entrez ces expressions.</p>
            {/* In a real app, you might embed a plot here or provide a link to plot */}
          </div>
        );
      case 'propriete':
      case 'definition':
        return (
          <div key={card.title} className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-yellow-800 text-sm">
            <h4 className="font-semibold text-yellow-900 mb-1">{card.title}</h4>
            <MarkdownRenderer content={card.content} />
          </div>
        );
      default:
        return null;
    }
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
          <MessageSquareText size={20} /> Tuteur IA
        </h3>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Fermer le chat IA"
        >
          <X size={20} />
        </button>
      </div>

      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {chatHistory.length === 0 && !isLoading && (
          <div className="text-center text-slate-500 italic p-4">
            Commencez une conversation avec votre tuteur en mathématiques IA.
          </div>
        )}

        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={clsx('flex', {
              'justify-end': message.role === 'user',
              'justify-start': message.role === 'model'
            })}
          >
            <div
              className={clsx(
                'max-w-[80%] p-3 rounded-lg shadow-sm',
                {
                  'bg-blue-600 text-white': message.role === 'user',
                  'bg-slate-100 text-slate-800': message.role === 'model'
                }
              )}
            >
              {message.structured ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg">{message.structured.title}</h3>
                  <MarkdownRenderer content={message.structured.explanation} />
                  {message.structured.cards && message.structured.cards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {message.structured.cards.map(renderCard)}
                    </div>
                  )}
                  {message.structured.suggested_questions && message.structured.suggested_questions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <h4 className="font-semibold text-sm mb-2">Questions suggérées:</h4>
                      <div className="flex flex-wrap gap-2">
                        {message.structured.suggested_questions.map((sq, sqIndex) => (
                          <button
                            key={sqIndex}
                            onClick={() => handleSuggestionClick(sq)}
                            className="text-xs px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors text-slate-700"
                          >
                            {sq}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-slate-100 text-slate-800 shadow-sm flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              <span>L'IA réfléchit...</span>
            </div>
          </div>
        )}

        {currentAssistantResponse && !isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-slate-100 text-slate-800 shadow-sm">
              {currentAssistantParsed ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg">{currentAssistantParsed.title}</h3>
                  <MarkdownRenderer content={currentAssistantParsed.explanation} />
                  {currentAssistantParsed.cards && currentAssistantParsed.cards.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {currentAssistantParsed.cards.map(renderCard)}
                    </div>
                  )}
                </div>
              ) : (
                <MarkdownRenderer content={currentAssistantResponse} />
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center gap-2">
            <AlertCircle size={20} />
            <span>Erreur: {error}</span>
          </div>
        )}

        {suggestedQuestions.length > 0 && !isLoading && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="font-semibold text-slate-700 mb-2">Questions suggérées:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((sq, sqIndex) => (
                <button
                  key={sqIndex}
                  onClick={() => handleSuggestionClick(sq)}
                  className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600 border border-slate-200"
                >
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
        <input
          type="text"
          className="flex-1 p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
          placeholder="Posez une question à l'IA..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage(inputMessage);
          }}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage(inputMessage)}
          className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Envoyer le message"
          disabled={isLoading || !inputMessage.trim()}
        >
          <Send size={20} />
        </button>
      </div>
    </motion.div>
  );
};

export default AIChat;
