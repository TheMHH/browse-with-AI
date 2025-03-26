// Create and inject popup HTML
function createPopup() {
  // Create container with shadow DOM
  const container = document.createElement('div');
  container.id = 'browse-with-ai-container';
  document.body.appendChild(container);
  
  // Create shadow root
  const shadow = container.attachShadow({ mode: 'open' });
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  shadow.appendChild(overlay);
  
  // Create popup content
  const popup = document.createElement('div');
  popup.id = 'browse-with-ai-popup';
  popup.innerHTML = `
    <div class="browse-with-ai-container">
      <div class="browse-with-ai-header">
        <div class="drag-handle" title="Click and hold to drag">⋮⋮</div>
        <h3>Ask about selected text</h3>
        <button class="close-button" aria-label="Close">&times;</button>
      </div>
      <div class="browse-with-ai-content">
        <div class="chat-container">
          <div class="context-section">
            <div class="selected-text-preview"></div>
            <label class="context-toggle">
              <input type="checkbox" id="includeFullPage">
              <span class="toggle-text">Include page context</span>
            </label>
          </div>
          <div class="messages-container" id="messages">
            <!-- Messages will be added here dynamically -->
          </div>
          <div class="input-section">
            <textarea id="question" placeholder="Ask a question about the selected text..."></textarea>
            <button id="askButton" class="primary-button">
              <svg class="send-icon" viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
        <div id="loading" class="loading hidden">
          <div class="loading-spinner"></div>
          <span>Processing your request...</span>
        </div>
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
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif;
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1;
    }

    /* Light theme (default) */
    #browse-with-ai-popup {
      position: fixed;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      max-width: 500px;
      width: 90%;
      height: 600px;
      box-sizing: border-box;
      transition: none;
      z-index: 2;
      display: flex;
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
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .browse-with-ai-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0; /* Important for nested flexbox scrolling */
    }

    .browse-with-ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
      width: 100%;
      user-select: none;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: 8px 8px 0 0;
      position: sticky;
      top: -24px;
      margin: -24px -24px 4px -24px;
      width: calc(100% + 48px);
      z-index: 1;
    }

    .drag-handle {
      cursor: grab;
      padding: 4px 8px;
      margin: -4px 0;
      border-radius: 4px;
      color: var(--text-muted);
      font-size: 16px;
      letter-spacing: -1px;
      transition: all 0.2s;
    }

    .drag-handle:hover {
      background: var(--hover-bg);
      color: var(--text-primary);
    }

    .drag-handle.dragging {
      cursor: grabbing;
      background: var(--hover-bg);
      color: var(--text-primary);
    }

    .browse-with-ai-header h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 18px;
      font-weight: 600;
      flex-grow: 1;
      margin-left: 12px;
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

    .chat-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0; /* Important for nested flexbox scrolling */
    }

    .context-section {
      flex-shrink: 0; /* Prevent context section from shrinking */
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      background: var(--bg-secondary);
      border-radius: 8px;
      border: 1px solid var(--border-color);
    }

    .context-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      user-select: none;
    }

    .toggle-text {
      color: var(--text-secondary);
      font-size: 13px;
    }

    .selected-text-preview {
      font-style: italic;
      color: var(--text-secondary);
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 4px;
    }

    .messages-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      overflow-y: auto;
      padding-right: 8px;
      padding-bottom: 16px;
      min-height: 200px;
    }

    .message {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message.user {
      justify-content: flex-end;
    }

    .message-content {
      background: var(--bg-secondary);
      padding: 12px 16px;
      border-radius: 12px;
      color: var(--text-primary);
      font-size: 14px;
      line-height: 1.6;
      max-width: 80%;
      border: 1px solid var(--border-color);
    }

    /* AI message specific styles */
    .message:not(.user) .message-content {
      border-top-left-radius: 4px;
    }

    /* User message specific styles */
    .message.user .message-content {
      background: var(--primary-color);
      color: white;
      border: none;
      border-top-right-radius: 4px;
    }

    .input-section {
      flex-shrink: 0; /* Prevent input section from shrinking */
      margin-top: 16px;
      display: flex;
      gap: 12px;
      align-items: flex-end;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 12px;
    }

    textarea {
      flex-grow: 1;
      min-height: 24px;
      max-height: 120px;
      padding: 0;
      border: none;
      border-radius: 0;
      resize: none;
      font-family: inherit;
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-primary);
      background: transparent;
      margin: 0;
    }

    textarea:focus {
      outline: none;
      border: none;
      box-shadow: none;
    }

    .primary-button {
      padding: 8px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .primary-button:hover {
      background: var(--primary-hover);
      transform: scale(1.05);
    }

    .primary-button:disabled {
      background: var(--disabled-bg);
      cursor: not-allowed;
      transform: none;
    }

    .send-icon {
      width: 20px;
      height: 20px;
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

    /* Add AI provider icons */
    .ai-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
      overflow: hidden;
      padding: 6px;
      background: var(--primary-color);
    }

    .ai-avatar svg {
      width: 20px;
      height: 20px;
      display: block;
    }

    .user-avatar {
      background: var(--text-muted);
    }
  `;
  shadow.appendChild(style);

  // Initialize dragging functionality
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  // Load saved position
  browser.storage.local.get(['popupX', 'popupY']).then(result => {
    if (result.popupX !== undefined && result.popupY !== undefined) {
      xOffset = result.popupX;
      yOffset = result.popupY;
      setTranslate(xOffset, yOffset, popup);
    } else {
      // Center the popup if no position is saved
      xOffset = 0;
      yOffset = 0;
      setTranslate(xOffset, yOffset, popup);
    }
  });

  const dragHandle = popup.querySelector('.drag-handle');

  function dragStart(e) {
    // Only start dragging if it's the drag handle
    if (!e.target.classList.contains('drag-handle')) return;

    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    isDragging = true;
    dragHandle.classList.add('dragging');
    popup.style.willChange = 'transform';
    popup.style.transition = 'none';

    // Add document-level event listeners
    if (e.type !== "touchstart") {
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd);
    }
  }

  function dragEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    dragHandle.classList.remove('dragging');
    popup.style.willChange = 'auto';
    
    // Save the final position
    browser.storage.local.set({
      popupX: xOffset,
      popupY: yOffset
    });

    // Remove document-level event listeners
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", dragEnd);
  }

  function drag(e) {
    if (!isDragging) return;

    e.preventDefault();
    
    if (e.type === "touchmove") {
      currentX = e.touches[0].clientX - initialX;
      currentY = e.touches[0].clientY - initialY;
    } else {
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
    }

    xOffset = currentX;
    yOffset = currentY;

    requestAnimationFrame(() => {
      setTranslate(currentX, currentY, popup);
    });
  }

  function setTranslate(xPos, yPos, el) {
    // Keep the popup within the viewport
    const rect = el.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    xPos = Math.min(Math.max(0, xPos), maxX);
    yPos = Math.min(Math.max(0, yPos), maxY);

    // Remove the centering transform and just use translate3d
    el.style.left = '0';
    el.style.top = '0';
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  // Add event listeners for drag handle
  dragHandle.addEventListener("mousedown", dragStart);
  dragHandle.addEventListener("touchstart", dragStart, { passive: true });
  dragHandle.addEventListener("touchend", dragEnd);
  dragHandle.addEventListener("touchmove", drag, { passive: false });

  // Handle click outside popup
  overlay.addEventListener('click', () => {
    container.remove();
  });

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
    const closeButton = popup.querySelector('.close-button');
    const includeFullPageCheckbox = popup.querySelector('#includeFullPage');

    // Set selected text
    selectedTextPreview.textContent = message.selectedText;

    // Handle close button
    closeButton.addEventListener('click', () => {
      container.remove();
    });

    // Add AI provider icons
    const aiProviderIcons = {
      'openai': '<svg width="100%" height="100%" viewBox="0 0 24 24"><path fill="currentColor" d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91a6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9a6.046 6.046 0 0 0 .743 7.097a5.98 5.98 0 0 0 .51 4.911a6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206a5.99 5.99 0 0 0 3.997-2.9a6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081l4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085l4.783 2.759a.78.78 0 0 0 .78 0l5.843-3.369v2.332a.074.074 0 0 1-.028.057l-4.832 2.795a4.504 4.504 0 0 1-6.153-1.645zm-.856-8.246a4.476 4.476 0 0 1 2.346-1.973l-.004.162l.003 5.523a.775.775 0 0 0 .391.676l5.843 3.37-2.02 1.168a.075.075 0 0 1-.057.01l-4.837-2.794a4.504 4.504 0 0 1-1.665-6.142zm16.06 3.798l-5.843-3.37l2.02-1.167a.071.071 0 0 1 .057-.01l4.837 2.794a4.494 4.494 0 0 1-.62 8.115V14.4a.775.775 0 0 0-.391-.676zm2.049-3.03l-.142-.085l-4.779-2.758a.78.78 0 0 0-.78 0L9.31 11.35V9.018a.074.074 0 0 1 .028-.057l4.837-2.794a4.504 4.504 0 0 1 6.688 4.66zM8.519 15.33l-2.02-1.167a.075.075 0 0 1-.038-.052V8.528a4.504 4.504 0 0 1 7.37-3.453l-.142.08l-4.779 2.759a.795.795 0 0 0-.391.681zm1.01-3.087l2.602-1.5l2.602 1.5v2.999l-2.602 1.5l-2.602-1.5z"/></svg>',
      'anthropic': '<svg width="100%" height="100%" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2L2 19.778h20L12 2zm0 4l7.778 13.778H4.222L12 6z"/></svg>',
      'gemini': '<svg width="100%" height="100%" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.5 14c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5s1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm-3-4c-.83 0-1.5-.67-1.5-1.5S12.67 9 13.5 9s1.5.67 1.5 1.5s-.67 1.5-1.5 1.5zm-3 4c-.83 0-1.5-.67-1.5-1.5S9.67 13 10.5 13s1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>',
      'default': '<svg width="100%" height="100%" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8zm-1-14h2v7h-2zm0 8h2v2h-2z"/></svg>'
    };

    // Function to create message HTML
    function createMessageHTML(content, isUser = false, aiProvider = 'default') {
      if (isUser) {
        return `
          <div class="message-content">${content}</div>
        `;
      } else {
        return `
          <div class="message-avatar ai-avatar">
            ${aiProviderIcons[aiProvider] || aiProviderIcons.default}
          </div>
          <div class="message-content">${content}</div>
        `;
      }
    }

    // Handle ask button
    askButton.addEventListener('click', async () => {
      const question = questionInput.value.trim();
      if (!question) return;

      // Add user message
      const messagesContainer = popup.querySelector('#messages');
      const userMessage = document.createElement('div');
      userMessage.className = 'message user';
      userMessage.innerHTML = createMessageHTML(question, true);
      messagesContainer.appendChild(userMessage);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Clear input
      questionInput.value = '';
      
      // Show loading state
      loadingIndicator.classList.remove('hidden');
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

        // Add AI response message with the correct provider icon
        const aiMessage = document.createElement('div');
        aiMessage.className = 'message';
        aiMessage.innerHTML = createMessageHTML(
          response.error || response.answer,
          false,
          response.provider || 'default'
        );
        messagesContainer.appendChild(aiMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } catch (error) {
        // Add error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message';
        errorMessage.innerHTML = createMessageHTML(`Error: ${error.message}`, false, 'default');
        messagesContainer.appendChild(errorMessage);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } finally {
        loadingIndicator.classList.add('hidden');
        askButton.disabled = false;
        questionInput.focus();
      }
    });

    // Handle Enter key in textarea
    questionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        askButton.click();
      }
    });

    // Auto-resize textarea
    questionInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  }

  if (message.action === "getPageContent") {
    sendResponse({ pageContent: document.body.innerText });
  }
}); 