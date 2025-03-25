// Create and inject popup HTML
function createPopup() {
  // Create container with shadow DOM
  const container = document.createElement('div');
  container.id = 'browse-with-ai-container';
  document.body.appendChild(container);
  
  // Create shadow root
  const shadow = container.attachShadow({ mode: 'open' });
  
  // Create popup content
  const popup = document.createElement('div');
  popup.id = 'browse-with-ai-popup';
  popup.innerHTML = `
    <div class="browse-with-ai-container">
      <div class="browse-with-ai-header">
        <h3>Ask about selected text</h3>
        <button class="close-button" aria-label="Close">&times;</button>
      </div>
      <div class="browse-with-ai-content">
        <div class="selected-text-preview"></div>
        <div class="form-group checkbox-group">
          <label class="checkbox-label">
            <input type="checkbox" id="includeFullPage">
            <span class="checkbox-text">Include full page context</span>
          </label>
        </div>
        <div class="form-group">
          <textarea id="question" placeholder="Ask a question about the selected text..."></textarea>
        </div>
        <button id="askButton" class="primary-button">Ask</button>
        <div id="loading" class="loading hidden">
          <div class="loading-spinner"></div>
          <span>Processing your request...</span>
        </div>
        <div id="answer" class="answer hidden"></div>
      </div>
    </div>
  `;
  shadow.appendChild(popup);

  // Add styles to shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    :host {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(0, 0, 0, 0.5);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif;
    }

    /* Light theme (default) */
    #browse-with-ai-popup {
      --bg-primary: #ffffff;
      --bg-secondary: #f8f9fa;
      --text-primary: #1a1a1a;
      --text-secondary: #444444;
      --text-muted: #666666;
      --border-color: #e0e0e0;
      --primary-color: #0066cc;
      --primary-hover: #0052a3;
      --primary-light: rgba(0, 102, 204, 0.1);
      --scrollbar-track: #f1f1f1;
      --scrollbar-thumb: #cccccc;
      --scrollbar-thumb-hover: #999999;
      --overlay-bg: rgba(0, 0, 0, 0.5);
      --disabled-bg: #cccccc;
      --spinner-bg: #f3f3f3;
      --hover-bg: #f0f0f0;

      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      max-width: 500px;
      width: 90%;
      max-height: 85vh;
      overflow-y: auto;
      position: relative;
      box-sizing: border-box;
    }

    /* Dark theme */
    @media (prefers-color-scheme: dark) {
      #browse-with-ai-popup {
        --bg-primary: #1e1e1e;
        --bg-secondary: #2d2d2d;
        --text-primary: #ffffff;
        --text-secondary: #cccccc;
        --text-muted: #999999;
        --border-color: #404040;
        --primary-color: #3b9eff;
        --primary-hover: #1e90ff;
        --primary-light: rgba(59, 158, 255, 0.1);
        --scrollbar-track: #2d2d2d;
        --scrollbar-thumb: #404040;
        --scrollbar-thumb-hover: #4d4d4d;
        --overlay-bg: rgba(0, 0, 0, 0.7);
        --disabled-bg: #404040;
        --spinner-bg: #2d2d2d;
        --hover-bg: #2d2d2d;

        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
      }
    }

    .browse-with-ai-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      width: 100%;
      box-sizing: border-box;
    }

    .browse-with-ai-content {
      width: 100%;
      box-sizing: border-box;
    }

    .browse-with-ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      width: 100%;
    }

    .browse-with-ai-header h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 18px;
      font-weight: 600;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 8px;
      color: var(--text-muted);
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      margin: -8px;
    }

    .close-button:hover {
      background-color: var(--hover-bg);
      color: var(--text-primary);
    }

    .selected-text-preview {
      background: var(--bg-secondary);
      padding: 16px;
      border-radius: 8px;
      font-style: italic;
      max-height: 120px;
      overflow-y: auto;
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      font-size: 14px;
      line-height: 1.5;
      width: 100%;
      box-sizing: border-box;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
      box-sizing: border-box;
    }

    .checkbox-group {
      margin: -4px 0;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 4px 0;
    }

    .checkbox-text {
      font-size: 14px;
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      border: 2px solid var(--primary-color);
      border-radius: 4px;
      cursor: pointer;
      background-color: var(--bg-primary);
    }

    textarea {
      width: 100%;
      min-height: 120px;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      resize: vertical;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-primary);
      background: var(--bg-primary);
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px var(--primary-light);
    }

    textarea::placeholder {
      color: var(--text-muted);
    }

    .primary-button {
      padding: 12px 24px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      transition: background-color 0.2s;
      align-self: flex-start;
    }

    .primary-button:hover {
      background: var(--primary-hover);
    }

    .primary-button:disabled {
      background: var(--disabled-bg);
      cursor: not-allowed;
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-muted);
      font-size: 14px;
      width: 100%;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 3px solid var(--spinner-bg);
      border-top: 3px solid var(--primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .answer {
      margin-top: 4px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
      white-space: pre-wrap;
      color: var(--text-primary);
      font-size: 14px;
      line-height: 1.6;
      border: 1px solid var(--border-color);
      width: 100%;
      box-sizing: border-box;
    }

    .hidden {
      display: none;
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: var(--scrollbar-track);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--scrollbar-thumb-hover);
    }

    * {
      box-sizing: border-box;
    }
  `;
  shadow.appendChild(style);

  return {
    container,
    popup: shadow.querySelector('#browse-with-ai-popup')
  };
}

// Handle messages from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showPopup") {
    const { container, popup } = createPopup();
    const selectedTextPreview = popup.querySelector('.selected-text-preview');
    const questionInput = popup.querySelector('#question');
    const askButton = popup.querySelector('#askButton');
    const loadingIndicator = popup.querySelector('#loading');
    const answerDiv = popup.querySelector('#answer');
    const closeButton = popup.querySelector('.close-button');
    const includeFullPageCheckbox = popup.querySelector('#includeFullPage');

    // Set selected text
    selectedTextPreview.textContent = message.selectedText;

    // Handle close button
    closeButton.addEventListener('click', () => {
      container.remove();
    });

    // Handle click outside popup
    container.addEventListener('click', (e) => {
      // Only close if clicking the overlay background (the container itself)
      // and not any of its children
      if (e.target === container) {
        container.remove();
      }
    });

    // Prevent clicks inside the popup from bubbling up
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Handle ask button
    askButton.addEventListener('click', async () => {
      const question = questionInput.value.trim();
      if (!question) return;

      // Show loading state
      loadingIndicator.classList.remove('hidden');
      answerDiv.classList.add('hidden');
      askButton.disabled = true;

      try {
        // Get page content if needed
        let pageContent = null;
        if (includeFullPageCheckbox.checked) {
          const response = await browser.runtime.sendMessage({ action: "getPageContent" });
          pageContent = response.pageContent;
        }

        // Send question to background script
        const response = await browser.runtime.sendMessage({
          action: "askLLM",
          selectedText: message.selectedText,
          question,
          pageContent
        });

        if (response.error) {
          answerDiv.textContent = `Error: ${response.error}`;
        } else {
          answerDiv.textContent = response.answer;
        }
      } catch (error) {
        answerDiv.textContent = `Error: ${error.message}`;
      } finally {
        loadingIndicator.classList.add('hidden');
        answerDiv.classList.remove('hidden');
        askButton.disabled = false;
      }
    });
  }

  if (message.action === "getPageContent") {
    sendResponse({ pageContent: document.body.innerText });
  }
}); 