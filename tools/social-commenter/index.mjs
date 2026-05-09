import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { platforms } from './platforms.mjs';
import prompts from 'prompts';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.join(__dirname, 'user_data');

async function main() {
  console.log(chalk.blue.bold('\n🚀 Social Assistant Pro başlatılıyor...\n'));

  const response = await prompts([
    {
      type: 'select',
      name: 'platform',
      message: 'Hangi platformda işlem yapmak istersiniz?',
      choices: [
        { title: 'Twitter (X)', value: 'https://x.com' },
        { title: 'Instagram', value: 'https://www.instagram.com' },
        { title: 'TikTok', value: 'https://www.tiktok.com' },
        { title: 'Özel URL Gir', value: 'custom' }
      ]
    },
    {
      type: prev => prev === 'custom' ? 'text' : null,
      name: 'customUrl',
      message: 'Lütfen hedef URL\'yi girin:',
      initial: 'https://'
    }
  ]);

  if (!response.platform) {
    console.log(chalk.red('İşlem iptal edildi.'));
    process.exit(0);
  }

  const url = response.platform === 'custom' ? response.customUrl : response.platform;
  await launch(url);
}

async function launch(url) {
  console.log(chalk.gray('Tarayıcı hazırlanıyor...'));
  
  if (!fs.existsSync(USER_DATA_DIR)) {
    fs.mkdirSync(USER_DATA_DIR, { recursive: true });
  }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: null,
    args: ['--start-maximized'],
    locale: 'tr-TR'
  });

  const page = await context.newPage();

  // Tıklama olayını dinle
  await page.exposeFunction('onTargetClick', async (data) => {
    console.log(chalk.green(`\n✍️ Yazılıyor:`) + chalk.white(` "${data.text}"`));
    
    // İnsan gibi yazma simülasyonu
    await page.keyboard.type(data.text, { delay: Math.floor(Math.random() * 50) + 40 });
    
    if (data.autoEnter) {
      console.log(chalk.gray('⌨️ Enter tuşuna basılıyor...'));
      await page.waitForTimeout(400);
      await page.keyboard.press('Enter');
    }
  });

  // Her sayfa değişiminde platformu belirle ve scripti enjekte et
  page.on('framenavigated', async (frame) => {
    if (frame !== page.mainFrame()) return;
    
    const currentUrl = page.url();
    const platformKey = Object.keys(platforms).find(key => platforms[key].match.test(currentUrl)) || 'generic';
    const platform = platforms[platformKey];
    
    await page.evaluate((p) => {
      window.currentPlatform = p;
      if (window.updateQuickMessages) window.updateQuickMessages(p.quickMsgs);
    }, platform);
  });

  await page.addInitScript({ path: path.join(__dirname, 'overlay.js') });

  console.log(chalk.cyan(`🌐 ${url} adresine gidiliyor...`));
  await page.goto(url);
  
  console.log(chalk.green.bold('\n✅ Sistem hazır!'));
  console.log(chalk.yellow('İpucu: Sayfadaki herhangi bir yazı kutusuna tıkladığınızda otomatik yazım başlar.\n'));
}

main().catch(err => {
  console.error(chalk.red('Kritik Hata:'), err);
});
