// Create context menu item
browser.contextMenus.create({
  id: "askAboutText",
  title: "Ask about this text",
  contexts: ["selection"]
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askAboutText") {
    // Send message to content script to show the popup
    browser.tabs.sendMessage(tab.id, {
      action: "showPopup",
      selectedText: info.selectionText
    });
  }
});

// Handle messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getPageContent") {
    // Get the full page content
    browser.tabs.sendMessage(sender.tab.id, { action: "getPageContent" })
      .then(response => {
        sendResponse({ pageContent: response.pageContent });
      });
    return true; // Will respond asynchronously
  }
  
  if (message.action === "askLLM") {
    // Get API settings from storage
    browser.storage.local.get(['apiKey', 'apiProvider', 'includeFullPage'])
      .then(settings => {
        if (!settings.apiKey) {
          sendResponse({ error: "API key not configured" });
          return;
        }

        // Prepare the prompt
        let prompt = `Context: "${message.selectedText}"`;
        if (settings.includeFullPage && message.pageContent) {
          prompt += `\nFull page: "${message.pageContent.substring(0, 2000)}..."`;
        }
        prompt += `\nQuestion: "${message.question}"`;

        // Call appropriate API based on provider
        callLLMAPI(settings.apiProvider, settings.apiKey, prompt, message.messages || [])
          .then(response => {
            sendResponse({ 
              answer: response.content,
              provider: settings.apiProvider
            });
          })
          .catch(error => {
            sendResponse({ error: error.message });
          });
      });
    return true; // Will respond asynchronously
  }
});

async function callLLMAPI(provider, apiKey, prompt, messages = []) {
  const endpoints = {
    'openai': 'https://api.openai.com/v1/chat/completions',
    'anthropic': 'https://api.anthropic.com/v1/messages',
    'gemini': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  // Default system message for web browsing context
  const systemMessage = {
    role: "system",
    content: "You are an AI assistant embedded in a web browser extension. Your role is to help users understand and analyze content from web pages. Keep your responses clear, concise, and directly relevant to the user's questions about the selected text. If you need more context, say so. Always maintain a helpful and professional tone."
  };

  let body;
  switch (provider) {
    case 'openai':
      body = {
        model: "gpt-3.5-turbo",
        messages: [
          systemMessage,
          ...messages,
          { role: "user", content: prompt }
        ]
      };
      break;
    case 'anthropic':
      body = {
        model: "claude-3-opus-20240229",
        messages: [
          { role: "system", content: systemMessage.content },
          ...messages,
          { role: "user", content: prompt }
        ],
        max_tokens: 1024
      };
      break;
    case 'gemini':
      body = {
        contents: [
          { role: "system", parts: [{ text: systemMessage.content }] },
          ...messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          })),
          { role: "user", parts: [{ text: prompt }] }
        ]
      };
      break;
    default:
      throw new Error("Unsupported API provider");
  }

  const response = await fetch(endpoints[provider], {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  
  let content;
  switch (provider) {
    case 'openai':
      content = data.choices[0].message.content;
      break;
    case 'anthropic':
      content = data.content[0].text;
      break;
    case 'gemini':
      content = data.candidates[0].content.parts[0].text;
      break;
    default:
      throw new Error("Unsupported API provider");
  }

  return {
    content,
    provider
  };
} 