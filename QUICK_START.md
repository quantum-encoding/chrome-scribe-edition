# Claude Scraper - Quick Start Guide

## 🚀 Fastest Way to Download Everything

### Download Current Conversation (with artifacts)
1. Navigate to any Claude conversation
2. Open F12 Developer Console
3. Paste the contents of `scripts/claude-master-scraper.js`
4. Run: `claudeScraper.downloadCurrent()`

### Download ALL Conversations (bulk download)
1. Navigate to https://claude.ai/chats
2. Open F12 Developer Console  
3. Paste the contents of `scripts/claude-master-scraper.js`
4. Run: `claudeScraper.downloadAll()`

The script will:
- Navigate through each conversation automatically
- Download the conversation text (including thinking blocks)
- Download all artifacts with proper filenames
- Create organized markdown files
- Show progress in the console

## 📁 Output Format

Each conversation is saved as a markdown file containing:
- Conversation metadata (URL, date, message count)
- List of downloaded artifacts
- Full conversation with user/Claude messages
- Thinking blocks (if any)

Artifacts are downloaded with their original filenames.

## 🛠️ Other Scripts

- `claude-complete-downloader.js` - Downloads current conversation only
- `claude-artifact-dropdown-fix.js` - Just downloads artifacts
- `claude-bulk-downloader.js` - Alternative bulk downloader

## 💡 Tips

- Check your browser's download folder for all files
- The script shows progress in the console
- For large conversations, artifact downloads may take a few seconds each
- If a download fails, you can run the script again on that specific conversation