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
        <button class="close-button">&times;</button>
      </div>
      <div class="browse-with-ai-content">
        <div class="selected-text-preview"></div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="includeFullPage"> Include full page context
          </label>
        </div>
        <div class="form-group">
          <textarea id="question" placeholder="Ask a question about the selected text..."></textarea>
        </div>
        <button id="askButton">Ask</button>
        <div id="loading" class="loading hidden">Processing...</div>
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
    }
    #browse-with-ai-popup {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .browse-with-ai-container {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    .browse-with-ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .browse-with-ai-header h3 {
      margin: 0;
      color: #333;
    }
    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0 5px;
      color: #666;
    }
    .close-button:hover {
      color: #333;
    }
    .selected-text-preview {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      font-style: italic;
      max-height: 100px;
      overflow-y: auto;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .form-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #333;
    }
    textarea {
      width: 100%;
      min-height: 100px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
      font-family: inherit;
    }
    button {
      padding: 8px 16px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
    }
    button:hover {
      background: #0052a3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .loading {
      text-align: center;
      color: #666;
    }
    .answer {
      margin-top: 15px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
      white-space: pre-wrap;
    }
    .hidden {
      display: none;
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
      if (e.target === container) {
        container.remove();
      }
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