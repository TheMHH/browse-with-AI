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
        prompt += `\nQuestion: "${message.question}"\nAnswer concisely.`;

        // Call appropriate API based on provider
        callLLMAPI(settings.apiProvider, settings.apiKey, prompt)
          .then(response => {
            sendResponse({ answer: response });
          })
          .catch(error => {
            sendResponse({ error: error.message });
          });
      });
    return true; // Will respond asynchronously
  }
});

async function callLLMAPI(provider, apiKey, prompt) {
  const endpoints = {
    'openai': 'https://api.openai.com/v1/chat/completions',
    'deepseek': 'https://api.deepseek.com/v1/chat/completions',
    'gemini': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  let body;
  switch (provider) {
    case 'openai':
      body = {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      };
      break;
    case 'deepseek':
      body = {
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      };
      break;
    case 'gemini':
      body = {
        contents: [{ parts: [{ text: prompt }] }]
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
  
  switch (provider) {
    case 'openai':
      return data.choices[0].message.content;
    case 'deepseek':
      return data.choices[0].message.content;
    case 'gemini':
      return data.candidates[0].content.parts[0].text;
    default:
      throw new Error("Unsupported API provider");
  }
} 