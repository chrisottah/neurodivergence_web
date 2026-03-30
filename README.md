# neurodive-website

Official website for **Neurodivergence Revived CIC** — a UK community interest company empowering neurodivergent individuals, families, and caregivers.

## 🌐 Live Site
GitHub Pages: https://[YOUR-USERNAME].github.io/neurodive-website
Production: https://neurodivergencerevived.org

## 📁 Structure
```
neurodive-website/
├── index.html          # Main HTML (all pages)
├── css/
│   └── style.css       # All styles + dark/light theme
├── js/
│   └── main.js         # Routing, forms, chatbot, animations
└── assets/
    └── nova-avatar.svg # Chatbot avatar (replace with your image)
```

## 🚀 Setup

### GitHub Pages
1. Push this repo to GitHub as `neurodive-website`
2. Go to Settings → Pages → Deploy from branch: `main` / `/ (root)`
3. Your site will be live at `https://[username].github.io/neurodive-website`

### Contact Form (Formspree)
1. Create a free account at https://formspree.io
2. Create a form pointing to: neurodivergencerevived@gmail.com
3. Follow the comments in `js/main.js` (search for FORMSPREE)

### Chatbot (Claude API)
The chatbot uses the Anthropic Claude API. For production hosting,
set up a lightweight proxy to keep your API key secure.

### Nova Avatar
Replace `assets/nova-avatar.svg` with your preferred PNG/JPG image.
Recommended: 80×80px, square, friendly face or icon.
