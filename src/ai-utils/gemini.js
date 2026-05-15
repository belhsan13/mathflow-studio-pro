const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export const fetchStreamedGeminiResponse = async (
  apiKey,
  model,
  temperature,
  systemInstruction,
  chatHistory,
  thinkingLevel,
  currentExpression,
  currentExpression2,
  currentMode,
  onNewChunk,
  onComplete,
  onError
) => {
  if (!apiKey) {
    onError(new Error("Clé API Gemini non configurée."));
    return;
  }

  const headers = {
    'x-goog-api-key': apiKey,
    'Content-Type': 'application/json'
  };

  const contents = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Add current context to the AI prompt
  const contextParts = [];
  if (currentExpression) {
    contextParts.push({ text: `Expression 1 actuelle: ${currentExpression}` });
  }
  if (currentExpression2) {
    contextParts.push({ text: `Expression 2 actuelle: ${currentExpression2}` });
  }
  if (currentMode) {
    contextParts.push({ text: `Mode actuel: ${currentMode === 'plot' ? 'Tracé de fonction' : 'Suite mathématique'}` });
  }

  // Only add context parts if there are actual context messages to add
  if (contextParts.length > 0) {
    contents.push({
      role: 'user',
      parts: contextParts
    });
  }

  const body = {
    contents: contents,
    generationConfig: {
      temperature: parseFloat(temperature),
      topP: 0.8,
      topK: 10,
      responseMimeType: "application/json",
      responseJsonSchema: {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "explanation": { "type": "string" },
          "cards": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "type": { "type": "string", "enum": ["calcul", "graphique", "propriete", "definition"] },
                "title": { "type": "string" },
                "content": { "type": "string" },
                "expression1": { "type": "string", "description": "Required for graphique type" },
                "expression2": { "type": "string", "description": "Optional for graphique type" }
              },
              "required": ["type", "title", "content"]
            }
          },
          "suggested_questions": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["title", "explanation"]
      }
    }
  };

  if (systemInstruction) {
    body.system_instruction = { parts: [{ text: systemInstruction }] };
  }
  if (thinkingLevel && thinkingLevel !== 'none') {
    body.generationConfig.thinkingConfig = { thinkingLevel: thinkingLevel };
  }

  try {
    const response = await fetch(`${GEMINI_API_BASE_URL}/${model}:streamGenerateContent`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Erreur API: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let jsonBuffer = ''; // Buffer specifically for JSON objects

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process each potential JSON object
      let lastIndex = 0;
      while (true) {
        const startIndex = buffer.indexOf('{', lastIndex);
        if (startIndex === -1) break;

        // Try to find the matching '}' for the current '{' to get a complete JSON object
        let braceCount = 0;
        let jsonEndIndex = -1;
        for (let i = startIndex; i < buffer.length; i++) {
          if (buffer[i] === '{') braceCount++;
          else if (buffer[i] === '}') braceCount--;

          if (braceCount === 0) {
            jsonEndIndex = i;
            break;
          }
        }

        if (jsonEndIndex === -1) break; // Not a complete JSON object yet

        let jsonCandidate = buffer.substring(startIndex, jsonEndIndex + 1);

        try {
          const data = JSON.parse(jsonCandidate);
          if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            const text = data.candidates[0].content.parts[0].text;
            onNewChunk(text); // Send raw text chunk
          }
          lastIndex = jsonEndIndex + 1;
        } catch (e) {
          // Not a complete or valid JSON object, keep buffering for the next attempt
          lastIndex = startIndex + 1; // Move past the opening brace to find next potential JSON
          if (lastIndex >= buffer.length) break; // Avoid infinite loop if invalid JSON starts at the end
        }
      }
      buffer = buffer.substring(lastIndex);
    }
    onComplete();

  } catch (error) {
    console.error("Erreur de streaming Gemini:", error);
    onError(error);
  }
};