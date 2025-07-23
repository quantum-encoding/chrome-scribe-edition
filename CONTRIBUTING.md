# Contributing to AI Chronicle

Thank you for your interest in contributing to AI Chronicle! We're excited to build this tool together with our community.

## 🎁 How to Get Your Free Copy First

Before contributing, make sure you've claimed your free copy:

1. Visit [www.quantumencoding.io](https://www.quantumencoding.io)
2. Join our community
3. Share the project on your favorite platform (Twitter/X, LinkedIn, Facebook, etc.)
4. Like, comment, and subscribe to help us grow
5. Get your free download link!

## 🤝 Ways to Contribute

### 1. Report Bugs
- Use the [Issues](https://github.com/quantum-encoding/chrome-scribe-edition/issues) tab
- Describe the bug clearly
- Include steps to reproduce
- Add screenshots if relevant
- Mention which AI platform you were using

### 2. Suggest Features
- Open a new issue with the "enhancement" label
- Describe the feature and its benefits
- Share use cases

### 3. Submit Code

#### Platform-Specific Scrapers
We especially need help with:
- **ChatGPT Scraper** (`scripts/gpt-dom-scraper.js`)
- **Claude Scraper** (`scripts/claude-dom-scraper.js`)

#### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly on the target platform
5. Commit with clear messages: `git commit -m "Add: ChatGPT scraper implementation"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

### 4. Improve Documentation
- Fix typos or clarify instructions
- Add examples
- Translate to other languages

### 5. Share and Promote
- Write blog posts about your use cases
- Create video tutorials
- Share on social media with #AIChronicle
- Tag [@QuantumEncoding](https://twitter.com/quantumencoding)

## 📋 Code Guidelines

### General Principles
- Keep it simple and readable
- Comment complex logic
- Follow existing code style
- Test on multiple conversation sizes

### Scraper Guidelines
When creating platform scrapers:
1. Use the `gemini-dom-scraper.js` as a template
2. Implement adaptive scrolling for large conversations
3. Handle platform-specific DOM structures
4. Export in all three formats (MD, JSON, TXT)
5. Include error handling
6. Test with conversations of various sizes (especially 10k+ messages)

### Commit Messages
- `Add:` for new features
- `Fix:` for bug fixes
- `Update:` for improvements
- `Doc:` for documentation
- `Style:` for formatting

## 🔍 Testing

Before submitting:
1. Test on the target platform
2. Try different conversation lengths
3. Test all export formats
4. Verify file downloads work
5. Check console for errors

## 🌟 Recognition

Contributors will be:
- Listed in our README
- Mentioned in release notes
- Featured on our website (with permission)
- Given early access to new features

## 📧 Questions?

- Email: [info@quantumencoding.io](mailto:info@quantumencoding.io)
- Website: [www.quantumencoding.io](https://www.quantumencoding.io)

## 🦆 Community Values

- **Collaboration**: We build together
- **Quality**: We create tools that work reliably
- **Innovation**: We find creative solutions
- **Respect**: We value all contributions

Remember: Every conversation is worth preserving. Let's make AI Chronicle the best tool for capturing these important dialogues!

---

**Note**: By contributing, you agree that your contributions will be licensed under the same MIT license as the project.