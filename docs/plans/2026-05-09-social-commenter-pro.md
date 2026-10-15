# Social Media Commenter Pro Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a robust, semi-automated social media comment assistant for Twitter, Instagram, and TikTok with a floating UI, platform-specific selectors, and anti-bot measures.

**Architecture:** A Node.js application using Playwright for browser automation, injecting a custom JavaScript overlay into target pages for user interaction and event detection.

**Tech Stack:** Node.js, Playwright, Vanilla JavaScript (for overlay), CSS (for UI).

---

### Task 1: Project Initialization and Dependencies

**Files:**
- Create: `tools/social-commenter/package.json`
- Create: `tools/social-commenter/index.mjs`

**Step 1: Create package.json**
```json
{
  "name": "social-commenter-pro",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "playwright": "^1.44.0",
    "chalk": "^5.3.0",
    "prompts": "^2.4.2"
  }
}
```

**Step 2: Install dependencies**
Run: `cd tools/social-commenter && npm install`

**Step 3: Create initial index.mjs**
```javascript
import { chromium } from 'playwright';
import path from 'path';

const USER_DATA_DIR = path.resolve('./user_data');

async function launch() {
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: null,
    args: ['--start-maximized']
  });
  const page = await context.newPage();
  await page.goto('https://google.com');
}

launch();
```

**Step 4: Commit**
```bash
git add tools/social-commenter
git commit -m "chore: initialize social-commenter-pro project"
```

---

### Task 2: Core Engine & Overlay Injection

**Files:**
- Modify: `tools/social-commenter/index.mjs`
- Create: `tools/social-commenter/overlay.js`

**Step 1: Create the Overlay Script (overlay.js)**
This script will handle the UI and click detection.

```javascript
(function() {
  if (window.SocialCommenter) return;
  
  const state = {
    message: "Harika paylaşım! 🔥",
    autoEnter: true,
    isTyping: false
  };

  const ui = document.createElement('div');
  ui.id = 'social-commenter-ui';
  ui.style = `
    position: fixed; top: 20px; right: 20px; z-index: 999999;
    background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px);
    color: white; padding: 15px; border-radius: 12px;
    width: 280px; font-family: sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
  `;
  
  ui.innerHTML = `
    <h3 style="margin: 0 0 10px 0; font-size: 16px;">Social Assistant Pro</h3>
    <textarea id="sc-msg" style="width: 100%; height: 60px; background: #1e293b; color: white; border: 1px solid #334155; border-radius: 4px; padding: 5px; margin-bottom: 10px; resize: none;">${state.message}</textarea>
    <div style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">Tıkladığınız kutuya bu mesaj yazılır.</div>
    <div style="display: flex; gap: 5px; flex-wrap: wrap;">
      <button class="sc-btn" data-msg="Muhteşem! 🚀">🚀</button>
      <button class="sc-btn" data-msg="Kesinlikle katılıyorum.">👍</button>
      <button class="sc-btn" data-msg="Çok bilgilendirici, teşekkürler.">📚</button>
    </div>
  `;
  
  document.body.appendChild(ui);

  // Click listener for buttons
  ui.querySelectorAll('.sc-btn').forEach(btn => {
    btn.onclick = () => {
      document.getElementById('sc-msg').value = btn.dataset.msg;
    };
  });

  // Global click listener for target inputs
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('#social-commenter-ui')) return;
    
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
      const msg = document.getElementById('sc-msg').value;
      window.onTargetClick({ text: msg });
    }
  }, true);

  window.SocialCommenter = true;
})();
```

**Step 2: Update index.mjs to inject and handle events**
```javascript
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const USER_DATA_DIR = path.resolve('./user_data');
const OVERLAY_PATH = path.resolve('./overlay.js');

async function launch(url = 'https://twitter.com') {
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: null,
    args: ['--start-maximized']
  });
  
  const page = await context.newPage();
  
  await page.exposeFunction('onTargetClick', async (data) => {
    console.log('Target clicked, typing:', data.text);
    await page.keyboard.type(data.text, { delay: 60 });
  });

  await page.addInitScript({ path: OVERLAY_PATH });
  await page.goto(url);
}

launch();
```

---

### Task 3: Platform Specific Configuration (Twitter, IG, TikTok)

**Files:**
- Create: `tools/social-commenter/platforms.js`
- Modify: `tools/social-commenter/index.mjs`

**Step 1: Define platform behaviors**
```javascript
export const platforms = {
  twitter: {
    domain: 'twitter.com',
    commentSelector: '[data-testid="tweetTextarea_0"]'
  },
  instagram: {
    domain: 'instagram.com',
    commentSelector: 'textarea[aria-label="Yorum ekle..."]'
  },
  tiktok: {
    domain: 'tiktok.com',
    commentSelector: 'div[contenteditable="true"]'
  }
};
```

---

### Task 4: Final Polish & CLI Interface

**Step 1: Add command line arguments.**
**Step 2: Add session persistence.**
**Step 3: Create README.md.**
