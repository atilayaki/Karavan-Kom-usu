(function() {
  if (window.SocialCommenter) return;

  // Tasarım ve Stil
  const style = document.createElement('style');
  style.textContent = `
    #social-commenter-ui {
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px);
      color: white; padding: 20px; border-radius: 16px;
      width: 320px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;
      user-select: none;
    }
    #social-commenter-ui h3 {
      margin: 0 0 15px 0; font-size: 18px; font-weight: 600;
      background: linear-gradient(90deg, #60a5fa, #a855f7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    #sc-msg {
      width: 100%; height: 80px; background: #1e293b; color: white;
      border: 1px solid #334155; border-radius: 8px; padding: 10px;
      margin-bottom: 15px; resize: none; font-size: 14px; outline: none;
      transition: border-color 0.2s;
    }
    #sc-msg:focus { border-color: #60a5fa; }
    .sc-btn-group { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 15px; }
    .sc-btn {
      background: #334155; border: none; color: white; padding: 6px 12px;
      border-radius: 6px; cursor: pointer; font-size: 12px;
      transition: all 0.2s;
    }
    .sc-btn:hover { background: #475569; transform: translateY(-1px); }
    .sc-status { font-size: 11px; color: #94a3b8; margin-top: 10px; display: flex; align-items: center; gap: 5px; }
    .sc-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
    
    /* Highlight efekti */
    .sc-highlight {
      outline: 3px solid #60a5fa !important;
      outline-offset: 2px !important;
      transition: outline 0.1s ease !important;
    }
  `;
  document.head.appendChild(style);

  const ui = document.createElement('div');
  ui.id = 'social-commenter-ui';
  ui.innerHTML = `
    <h3>Social Assistant Pro</h3>
    <textarea id="sc-msg" placeholder="Mesajınızı buraya yazın..."></textarea>
    <div class="sc-btn-group" id="sc-quick-msgs">
      <!-- Mesajlar buraya gelecek -->
    </div>
    <div style="font-size: 12px; color: #cbd5e1;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" id="sc-auto-enter" checked> Yazdıktan sonra gönder (Enter)
      </label>
    </div>
    <div class="sc-status">
      <div class="sc-dot"></div>
      <span id="sc-status-text">Sistem Hazır: Bir yazı alanına tıklayın.</span>
    </div>
  `;
  document.body.appendChild(ui);

  // Butonları güncelleme fonksiyonu
  window.updateQuickMessages = (msgs) => {
    const container = document.getElementById('sc-quick-msgs');
    container.innerHTML = '';
    msgs.forEach(msg => {
      const btn = document.createElement('button');
      btn.className = 'sc-btn';
      btn.dataset.msg = msg;
      btn.innerText = msg.length > 20 ? msg.substring(0, 17) + '...' : msg;
      btn.onclick = (e) => {
        e.stopPropagation();
        document.getElementById('sc-msg').value = btn.dataset.msg;
      };
      container.appendChild(btn);
    });
  };

  // İlk yüklemede varsa mevcut mesajları kullan
  if (window.currentPlatform) window.updateQuickMessages(window.currentPlatform.quickMsgs);

  // Highlight ve Tıklama Mantığı
  let lastHovered = null;

  document.addEventListener('mouseover', (e) => {
    const target = e.target;
    if (target.closest('#social-commenter-ui')) return;

    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
      if (lastHovered) lastHovered.classList.remove('sc-highlight');
      target.classList.add('sc-highlight');
      lastHovered = target;
    } else {
      if (lastHovered) {
        lastHovered.classList.remove('sc-highlight');
        lastHovered = null;
      }
    }
  });

  document.addEventListener('click', async (e) => {
    const target = e.target;
    if (target.closest('#social-commenter-ui')) return;

    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
      const msg = document.getElementById('sc-msg').value;
      const autoEnter = document.getElementById('sc-auto-enter').checked;
      
      document.getElementById('sc-status-text').innerText = 'Yazılıyor...';
      
      // Node.js tarafındaki fonksiyonu çağır
      if (window.onTargetClick) {
        await window.onTargetClick({ text: msg, autoEnter });
      }
      
      setTimeout(() => {
        document.getElementById('sc-status-text').innerText = 'Sistem Hazır: Bir yazı alanına tıklayın.';
      }, 1000);
    }
  }, true);

  window.SocialCommenter = true;
  console.log('Social Assistant Pro: Overlay Yüklendi.');
})();
