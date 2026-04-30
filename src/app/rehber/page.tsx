'use client';

import styles from './rehber.module.css';

export default function RehberPage() {
  const guideSections = [
    {
      id: 1,
      title: 'Karavan Dönüşüm Mevzuatı (2024)',
      icon: '📐',
      description: 'Panelvandan motokaravana dönüşümde Tse onayı, proje çizimi ve ruhsat değişim süreçleri.',
      articles: [
        'Mühendislik projesi nasıl çizdirilir?',
        'TSE Araç Kontrol Merkezi (AKM) randevusu ve denetimi',
        'Noter ve ruhsat değişim masrafları',
        'Gerekli minimum donanımlar (Yatak, ocak, masa)'
      ]
    },
    {
      id: 2,
      title: 'O2 Belgesi ve Çekme Karavanlar',
      icon: '🚐',
      description: '750 kg altı (O1) ve 750 kg üstü (O2) karavanların yasal statüleri ve gereksinimleri.',
      articles: [
        'O1 ve O2 belgesi farkları',
        'Frenli dingil zorunluluğu',
        'Ruhsat ve plaka işlemleri',
        'Hız limitleri ve Karayolları kuralları'
      ]
    },
    {
      id: 3,
      title: 'Konaklama ve Park Kuralları',
      icon: '🏕️',
      description: 'Milli parklar, sahiller ve şehir içlerinde karavanla bekleme/konaklama hakkındaki güncel yönetmelikler.',
      articles: [
        'Karayolları üzerinde park etme',
        'Özel orman alanları ve sit alanlarında kamp',
        'Belediyelerin karavan parkı (Karavanpark) yönetmelikleri'
      ]
    },
    {
      id: 4,
      title: 'Vergi ve Sigorta (MTV)',
      icon: '📄',
      description: 'Motokaravanlar için Motorlu Taşıtlar Vergisi (MTV) hesaplamaları ve trafik/kasko sigortaları.',
      articles: [
        'Yaş ve motor hacmine göre MTV oranları',
        'Karavan kaskosu neleri kapsar?',
        'Panelvan vs Motokaravan vergi farkları'
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Karavan Mevzuat ve Bilgi Rehberi</h2>
        <p>Yola çıkmadan önce bilmeniz gereken tüm resmi süreçler, kurallar ve püf noktaları.</p>
      </div>

      <div className={styles.grid}>
        {guideSections.map((section) => (
          <div key={section.id} className={styles.card + " glass-card"}>
            <div className={styles.cardHeader}>
              <span className={styles.icon}>{section.icon}</span>
              <h3>{section.title}</h3>
            </div>
            <p className={styles.description}>{section.description}</p>
            <div className={styles.divider}></div>
            <ul className={styles.articleList}>
              {section.articles.map((article, idx) => (
                <li key={idx}>
                  <a href="#">📄 {article}</a>
                </li>
              ))}
            </ul>
            <button className={styles.readMoreBtn}>Tümünü Oku →</button>
          </div>
        ))}
      </div>
      
      <div className={styles.askCommunity + " glass-card"}>
        <div className={styles.askContent}>
          <h3>Aradığını Bulamadın mı?</h3>
          <p>Mevzuat çok sık değişiyor. En güncel bilgiyi "Telsiz" üzerinden diğer karavancılara sorarak öğrenebilirsin.</p>
        </div>
        <button className="btn-primary">Telsizden Soru Sor</button>
      </div>
    </div>
  );
}
