# AI Chronicle - The Scribe 🦆

> The Scribe for your AI conversations - by Quantum Encoding Ltd

AI Chronicle is a powerful Chrome extension that captures and exports your conversations with AI assistants including Google AI Studio (Gemini), with support for ChatGPT and Claude coming soon.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- **Smart Conversation Capture**: Intelligently scrolls through and captures entire AI conversations
- **Multiple Export Formats**: Export as Markdown, JSON, or Plain Text
- **Optimized Performance**: Adaptive scrolling that speeds through large messages (handles 50k+ message sessions!)
- **Thought Capture**: Includes experimental model thoughts from Gemini
- **Background Downloads**: Saves files automatically without popups
- **Professional UI**: Clean, modern interface with Quantum Encoding branding

## 🚀 Installation

### From Release Package (Recommended)

1. Download the latest release from the [Releases](https://github.com/quantum-encoding/chrome-scribe-edition/releases) page
2. Unzip the package to a folder on your computer
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the unzipped folder
6. The AI Chronicle icon will appear in your extensions bar!

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/quantum-encoding/chrome-scribe-edition.git
   cd chrome-scribe-edition
   ```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the repository folder
5. The AI Chronicle icon will appear in your extensions bar!

## 📖 Usage

1. Navigate to a supported AI platform:
   - ✅ Google AI Studio (Gemini) - Fully supported
   - 🔜 ChatGPT - Coming soon
   - 🔜 Claude - Coming soon

2. Click the AI Chronicle extension icon

3. Select your preferred export format:
   - **Markdown** - Perfect for documentation and notes
   - **JSON** - Structured data for further processing
   - **Plain Text** - Simple, clean text format

4. Choose your capture method:
   - **Scrape Conversation** - Quick capture of visible messages
   - **Auto-Scroll & Scrape** - Complete capture of long conversations (handles 50k+ messages!)

5. Your conversation will be automatically downloaded to your Downloads folder!

## 🛠️ Technical Details

### Supported Platforms

| Platform | Status | Scraper |
|----------|--------|---------|
| Google AI Studio | ✅ Fully Supported | `gemini-dom-scraper.js` |
| ChatGPT | 🔜 Coming Soon | In Development |
| Claude | 🔜 Coming Soon | In Development |

### Project Structure

```
chrome-scribe-edition/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── scripts/
│   ├── popup.js          # Popup logic
│   ├── content.js        # Content script for page interaction
│   ├── background.js     # Background service worker
│   └── gemini-dom-scraper.js  # Gemini-specific scraper
├── styles/
│   └── popup.css         # Popup styling
└── images/              # Extension icons and assets
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Get Your Free Copy

1. Visit [www.quantumencoding.io](https://www.quantumencoding.io)
2. Join our community
3. Share on your favorite platform
4. Like, comment, and subscribe to help us grow!

## 📧 Support

For questions, suggestions, or support:
- Website: [www.quantumencoding.io](https://www.quantumencoding.io)
- Email: [info@quantumencoding.io](mailto:info@quantumencoding.io)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by Quantum Encoding Ltd
- Special thanks to our growing community of AI enthusiasts
- Powered by AI Workflow Services 🦆

---

**Note**: This extension is designed to work with publicly accessible AI chat interfaces. Please respect the terms of service of the platforms you use it with.