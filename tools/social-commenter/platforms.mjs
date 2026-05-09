export const platforms = {
  twitter: {
    name: 'Twitter (X)',
    match: /twitter\.com|x\.com/,
    selectors: {
      input: '[data-testid="tweetTextarea_0"]',
      submit: '[data-testid="tweetButtonInline"]'
    },
    quickMsgs: ['Muhteşem bir bakış açısı! 🚀', 'Katılıyorum, kesinlikle doğru. 💯', 'Bunu daha önce düşünmemiştim, teşekkürler! 🙏']
  },
  instagram: {
    name: 'Instagram',
    match: /instagram\.com/,
    selectors: {
      input: 'textarea[aria-label="Yorum ekle..."]',
      submit: 'button:has-text("Paylaş")'
    },
    quickMsgs: ['Harika bir kare! 🔥', 'Emeğine sağlık, çok güzel. ✨', 'Takipteyiz! 🙌']
  },
  tiktok: {
    name: 'TikTok',
    match: /tiktok\.com/,
    selectors: {
      input: 'div[contenteditable="true"]',
      submit: 'button:has-text("Paylaş")'
    },
    quickMsgs: ['Çok eğlenceli bir video! 😂', 'Bu akımı sevdim! ✨', 'Daha fazlası gelsin! 🚀']
  },
  generic: {
    name: 'Genel Site',
    match: /.*/,
    selectors: {
      input: 'textarea, input[type="text"]',
      submit: 'button[type="submit"]'
    },
    quickMsgs: ['Eline sağlık!', 'Çok güzel bir içerik.', 'Teşekkürler.']
  }
};
