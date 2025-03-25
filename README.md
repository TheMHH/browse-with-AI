# Browse with AI - Firefox Extension

A Firefox extension that allows you to ask questions about selected text on any webpage using various AI language models.

## Features

- Select text on any webpage and right-click to ask questions about it
- Support for multiple AI providers (OpenAI, DeepSeek, Google Gemini)
- Option to include full page context for better answers
- Clean and intuitive popup interface
- Secure API key storage

## Installation

1. Clone this repository or download the source code
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" on the left sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the extension directory and select any file (e.g., `manifest.json`)

## Configuration

1. Click the extension icon in your Firefox toolbar
2. Select your preferred AI provider from the dropdown
3. Enter your API key for the selected provider
4. Optionally enable "Include full page context" by default
5. Click "Save Settings"

## Usage

1. Select any text on a webpage by dragging your mouse over it
2. Right-click the selected text
3. Click "Ask about this text" in the context menu
4. Type your question in the popup that appears
5. Optionally toggle "Include full page context" if you want to include the full webpage content
6. Click "Ask" to get your answer

## Supported AI Providers

- OpenAI (GPT-3.5)
- DeepSeek
- Google Gemini

## Privacy & Security

- API keys are stored locally in your browser
- No data is sent to any servers except the selected AI provider
- Full page context is optional and can be toggled per request

## Development

The extension is built using vanilla JavaScript and uses the Firefox WebExtensions API. The main components are:

- `manifest.json`: Extension configuration
- `background.js`: Handles context menu and API interactions
- `content.js`: Manages the popup UI and page content extraction
- `popup.html/js`: Settings configuration interface

## License

MIT License - feel free to use and modify as needed. 