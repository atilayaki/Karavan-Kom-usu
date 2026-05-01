'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './rehber.module.css';
import CostCalculator from '@/components/CostCalculator';
import { supabase } from '@/lib/supabase';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { IconBook, IconCamp, IconMap, IconSOS, IconRadio, IconBell } from '@/components/Icons';

export default function RehberPage() {
  const scrollRef = useScrollReveal();
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [seasonalTips, setSeasonalTips] = useState<any[]>([]);

  useEffect(() => {
    const currentMonth = new Date().getMonth() + 1;
    supabase.from('seasonal_tips')
      .select('*')
      .eq('month', currentMonth)
      .then(({ data }) => {
        if (data) setSeasonalTips(data);
      });
  }, []);

  const guideSections = [
    {
      id: 1,
      title: 'Karavan Dönüşüm Mevzuatı',
      icon: <IconBook size={24} color="var(--forest-green)" />,
      description: 'Panelvandan motokaravana dönüşümde Tse onayı, proje çizimi ve ruhsat değişim süreçleri.',
      fullContent: `
        <h3>Karavan Dönüşüm Süreci Adımları</h3>
        <p>Panelvan bir aracı karavana dönüştürmek yasal olarak belli kurallara tabidir. İşte 2024 güncel süreci:</p>
        <ol>
          <li><strong>Proje Çizimi:</strong> Yetkili bir makine mühendisine karavan projesi çizdirilmelidir.</li>
          <li><strong>Donanım Gereksinimleri:</strong> Araçta sabit bir yatak, yemek masası, ocak ve depolama alanları bulunmalıdır.</li>
          <li><strong>TSE Denetimi:</strong> Çizilen proje ile birlikte araç TSE Araç Kontrol Merkezi'ne götürülür.</li>
          <li><strong>TUVTURK Muayenesi:</strong> TSE onayından sonra araç 'Özel Amaçlı Motokaravan' olarak muayeneye girer.</li>
          <li><strong>Ruhsat Değişimi:</strong> Son olarak noter üzerinden ruhsat cinsi değiştirilir.</li>
        </ol>
        <div class="alert">⚠️ Not: Aracınız 5 yaşından küçükse ÖTV farkı çıkabilir, dikkat edin!</div>
      `,
      articles: [
        'Mühendislik projesi nasıl çizdirilir?',
        'TSE Araç Kontrol Merkezi denetimi',
        'Noter ve ruhsat değişim masrafları'
      ]
    },
    {
      id: 2,
      title: 'O2 Belgesi ve Çekme Karavanlar',
      icon: <IconCamp size={24} color="var(--sunset-orange)" />,
      description: '750 kg altı (O1) ve 750 kg üstü (O2) karavanların yasal statüleri ve gereksinimleri.',
      fullContent: `
        <h3>O1 vs O2 Belgesi: Hangisi Sizin İçin?</h3>
        <p>Çekme karavanlarda ağırlık en kritik yasal sınırdır.</p>
        <ul>
          <li><strong>O1 Belgesi (750 kg Altı):</strong> Ruhsat ve plaka gerektirmez. Aracınızın plakasıyla kullanılır. Muayene zorunluluğu yoktur.</li>
          <li><strong>O2 Belgesi (750 kg Üstü):</strong> Kendi ruhsatı ve plakası vardır. Her yıl muayeneye girmesi gerekir.</li>
          <li><strong>BE Ehliyet:</strong> 750 kg üzerindeki karavanları çekmek için B sınıfı ehliyet yetmez, BE sınıfı gerekir.</li>
        </ul>
      `,
      articles: [
        'O1 ve O2 belgesi farkları',
        'Frenli dingil zorunluluğu',
        'Ruhsat ve plaka işlemleri'
      ]
    },
    {
      id: 3,
      title: 'Konaklama ve Park Kuralları',
      icon: <IconMap size={24} color="var(--forest-green)" />,
      description: 'Milli parklar, sahiller ve şehir içlerinde karavanla bekleme/konaklama kuralları.',
      fullContent: `
        <h3>Karavanla Nerede Konaklanır?</h3>
        <p>Karavanla özgürlük harikadır ancak yasal sınırları bilmek sizi cezalardan korur.</p>
        <p><strong>Şehir İçi:</strong> Karavanlar Karayolları Trafik Kanunu'na göre 'M1' sınıfı araçtır. Park yasağı olmayan her yere park edebilirsiniz. Ancak kamp aktivitesi yasaktır.</p>
      `,
      articles: [
        'Karayolları üzerinde park etme',
        'Özel orman alanlarında kamp',
        'Belediye yönetmelikleri'
      ]
    },
    {
      id: 4,
      title: 'Vergi ve Sigorta (MTV)',
      icon: <IconSOS size={24} color="var(--danger)" />,
      description: 'Motokaravanlar için MTV hesaplamaları ve trafik/kasko sigortaları.',
      fullContent: `
        <h3>Karavan Masrafları: Vergi ve Sigorta</h3>
        <p>Karavan sahibi olmanın yıllık sabit giderleri şunlardır:</p>
        <ul>
          <li><strong>MTV:</strong> Vergi, aracın yaşına göre belirlenir.</li>
          <li><strong>Trafik Sigortası:</strong> Motokaravan sigortası panelvanlara göre biraz yüksektir.</li>
          <li><strong>Karavan Kaskosu:</strong> Mutlaka yaptırılmalıdır.</li>
        </ul>
      `,
      articles: [
        'Yaş ve motor hacmine göre MTV',
        'Karavan kaskosu neleri kapsar?',
        'Vergi avantajları'
      ]
    }
  ];

  return (
    <div className={styles.container} ref={scrollRef}>
      <div className={styles.header + " reveal"}>
        <span className="font-accent" style={{fontSize: '1.5rem', color: 'var(--sunset-orange)'}}>Bilgi Bankası</span>
        <h2 className={styles.title}>Karavan Mevzuat ve Rehber</h2>
        <p className={styles.subtitle}>Yola çıkmadan önce bilmeniz gereken tüm resmi süreçler, kurallar ve püf noktaları.</p>
      </div>

      <div className={styles.grid + " stagger-children"}>
        {guideSections.map((section) => (
          <div key={section.id} className={styles.card + " glass-card"}>
            <div className={styles.cardHeader}>
              <div className={styles.iconBox}>{section.icon}</div>
              <h3>{section.title}</h3>
            </div>
            <p className={styles.description}>{section.description}</p>
            <div className={styles.divider}></div>
            <ul className={styles.articleList}>
              {section.articles.map((article, idx) => (
                <li key={idx}>
                  <IconBook size={14} /> <span>{article}</span>
                </li>
              ))}
            </ul>
            <button 
              className={styles.readMoreBtn}
              onClick={() => setSelectedSection(section)}
            >
              Rehberi İncele →
            </button>
          </div>
        ))}
      </div>
      
      {seasonalTips.length > 0 && (
        <div className={styles.seasonalSection + " glass-card reveal"}>
          <div className={styles.seasonalHeader}>
            <div className={styles.calendarIcon}>
              <span className={styles.monthLabel}>{new Date().toLocaleDateString('tr-TR', { month: 'short' })}</span>
              <span className={styles.dayLabel}>{new Date().getDate()}</span>
            </div>
            <div>
              <h3>Ayın Karavancı İpuçları</h3>
              <p>{new Date().toLocaleDateString('tr-TR', { month: 'long' })} Ayı Tavsiyeleri</p>
            </div>
          </div>
          <div className={styles.tipsGrid}>
            {seasonalTips.map(tip => (
              <div key={tip.id} className={styles.tipCard}>
                <span className={styles.tipCategory}>{tip.category}</span>
                <h4>{tip.title}</h4>
                <p>{tip.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="reveal">
        <CostCalculator />
      </div>
      
      <div className={styles.askCommunity + " glass-card reveal"}>
        <div className={styles.askContent}>
          <IconRadio size={40} color="var(--forest-green)" />
          <div>
            <h3>Aradığını Bulamadın mı?</h3>
            <p>Mevzuat çok sık değişiyor. En güncel bilgiyi "Telsiz" üzerinden diğer karavancılara sorarak öğrenebilirsin.</p>
          </div>
        </div>
        <Link href="/telsiz" className="btn-primary" style={{textDecoration: 'none'}}>
          Telsizden Soru Sor
        </Link>
      </div>

      {/* Detay Modalı */}
      {selectedSection && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSection(null)}>
          <div className={styles.modalContent + " glass-card reveal-scale visible"} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedSection(null)}>×</button>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconBox}>{selectedSection.icon}</div>
              <h2>{selectedSection.title}</h2>
            </div>
            <div 
              className={styles.modalBody}
              dangerouslySetInnerHTML={{ __html: selectedSection.fullContent }}
            />
            <button className="btn-primary" style={{marginTop: '30px', width: '100%'}} onClick={() => setSelectedSection(null)}>
              Anladım, Teşekkürler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
