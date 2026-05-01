-- =====================================================================
-- Daha fazla seed data — Manzara post'ları + Pazaryeri ilanları
-- Idempotent: aynı title varsa eklemez. Var olan kullanıcı verisine
-- dokunmaz.
-- =====================================================================

-- ---- MANZARA POSTLARI ----
INSERT INTO posts (image_url, caption, location_name, likes_count)
SELECT * FROM (VALUES
  ('https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=800&auto=format&fit=crop',
   'Sabah kahvesi eşliğinde güneşe uyanmak... 🌲☕️', 'Yedigöller, Bolu', 24),
  ('https://images.unsplash.com/photo-1513311068348-19c8fbdc0bb6?q=80&w=800&auto=format&fit=crop',
   'Yollar bizi çağırıyor. Sıradaki durak neresi olsun? 🚐', 'Kaş, Antalya', 56),
  ('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop',
   'Akşam yemeği hazırlıkları başladı. Odun ateşi bir başka.', 'Kaz Dağları, Balıkesir', 12),
  ('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop',
   'Karavanın yanından geçen uzun bir patika. Güzelliğe paydos!', 'Kapadokya, Nevşehir', 38),
  ('https://images.unsplash.com/photo-1527786356703-4b100091cd2c?q=80&w=800&auto=format&fit=crop',
   'Yıldızlar altında bir gece. Şehir ışıkları sıfır.', 'Nemrut Dağı, Adıyaman', 89),
  ('https://images.unsplash.com/photo-1517824806704-9040b037703b?q=80&w=800&auto=format&fit=crop',
   'Sabahları su kenarına park etmek gibisi yok. 🌊', 'Salda Gölü, Burdur', 67),
  ('https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800&auto=format&fit=crop',
   'Bugün rüzgar kuvvetli ama manzara muhteşem.', 'Patara Plajı, Antalya', 45),
  ('https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop',
   'Sonbahar ormanları arasında kayboluyoruz...', 'Yedigöller Milli Parkı', 78),
  ('https://images.unsplash.com/photo-1533873984035-25970ab07461?q=80&w=800&auto=format&fit=crop',
   '15 gündür yoldayız. Karavan benim için bir ev artık.', 'Çıralı, Antalya', 102),
  ('https://images.unsplash.com/photo-1516939884455-1445c8652f83?q=80&w=800&auto=format&fit=crop',
   'Sabah 6:00 — kimse yok, sadece biz ve bu manzara.', 'Şile Sahili, İstanbul', 31),
  ('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
   'Güneş battı, sıra ateş yakmaya geldi 🔥', 'Uludağ, Bursa', 54),
  ('https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=800&auto=format&fit=crop',
   'Kayalık sahillerde kahvaltı keyfi.', 'Datça, Muğla', 73),
  ('https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop',
   'Yeşilin her tonu bir arada.', 'Karagöl, Artvin', 41),
  ('https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop',
   'Bu manzaraya 3 gün baktım, hâlâ doyamadım.', 'Aladağlar, Niğde', 95),
  ('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
   'Karadeniz yaylaları, sis ve sessizlik.', 'Ayder Yaylası, Rize', 116)
) AS new_posts(image_url, caption, location_name, likes_count)
WHERE NOT EXISTS (
  SELECT 1 FROM posts p WHERE p.location_name = new_posts.location_name AND p.caption = new_posts.caption
);

-- ---- PAZARYERİ İLANLARI ----
INSERT INTO marketplace_items (title, description, category, price, image_url, location_name)
SELECT * FROM (VALUES
  -- Enerji & Elektrik
  ('100W Güneş Paneli', 'Sadece 2 ay kullanıldı, sıfır gibi.', 'Enerji & Elektrik', 1500.0, 'https://images.unsplash.com/photo-1509391366360-2e959784a276?q=80&w=400&auto=format&fit=crop', 'İzmir'),
  ('200Ah Lityum Akü', 'BMS dahil, 4 yıl garantili. Karavanım satıldığı için.', 'Enerji & Elektrik', 18500.0, 'https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?q=80&w=400&auto=format&fit=crop', 'Ankara'),
  ('3000W İnvertör Saf Sinüs', 'Victron Multiplus II, kullanılmamış kutusunda.', 'Enerji & Elektrik', 14800.0, 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=400&auto=format&fit=crop', 'İstanbul'),
  ('MPPT Şarj Kontrol Cihazı 60A', 'Renogy marka, Bluetooth modül dahil.', 'Enerji & Elektrik', 4200.0, 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=400&auto=format&fit=crop', 'İzmir'),

  -- Su & Tesisat
  ('150L Temiz Su Tankı', 'PE plastik, gıda onaylı. Az kullanılmış.', 'Su & Tesisat', 1200.0, 'https://images.unsplash.com/photo-1559825481-12a05cc00344?q=80&w=400&auto=format&fit=crop', 'Bursa'),
  ('Shurflo Su Pompası 12V', 'Sessiz model, 2 sezon kullandım.', 'Su & Tesisat', 850.0, 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=400&auto=format&fit=crop', 'Antalya'),
  ('Truma Boyler 14L', 'Gaz/elektrik kombine, sökülürken sağlam.', 'Su & Tesisat', 6500.0, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop', 'İstanbul'),

  -- Isıtma & Soğutma
  ('Webasto Air Top 2000 STC', 'Dizel kalorifer, montaj için tüm aksamı dahil.', 'Isıtma & Soğutma', 11500.0, 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?q=80&w=400&auto=format&fit=crop', 'Ankara'),
  ('Truma Combi 4 Kombi', 'Isıtma + sıcak su, az kullanılmış.', 'Isıtma & Soğutma', 22000.0, 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?q=80&w=400&auto=format&fit=crop', 'Bursa'),
  ('Dometic Buzdolabı 95L', '3-way (gaz/elektrik/akü), tertemiz.', 'Isıtma & Soğutma', 7800.0, 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?q=80&w=400&auto=format&fit=crop', 'İzmir'),

  -- Dış Donanım
  ('Tente 3x2.5m Manuel', 'Karavan tentesi, mekanizması sağlam.', 'Dış Donanım', 3200.0, 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=400&auto=format&fit=crop', 'Antalya'),
  ('Çatı Kutu 580L Thule', 'Kullanım izi az, anahtarları dahil.', 'Dış Donanım', 5400.0, 'https://images.unsplash.com/photo-1568625365131-079e026a927d?q=80&w=400&auto=format&fit=crop', 'İstanbul'),
  ('Bisiklet Taşıyıcı 3''lü', 'Çekme demiri tipi, sökülebilir.', 'Dış Donanım', 4100.0, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=400&auto=format&fit=crop', 'Eskişehir'),
  ('Karavan Sineklik Set', 'Kapı + tüm pencereler için ölçü tabanlı.', 'Dış Donanım', 950.0, 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop', 'İzmir'),

  -- Mobilya & İç Mekan
  ('Karavan Yatağı Set 140x190', 'Soğuk köpük, 4 mevsim kılıflı.', 'Mobilya & İç Mekan', 2800.0, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=400&auto=format&fit=crop', 'İstanbul'),
  ('Dometic Ocak 3 Gözlü', 'Cam kapak dahil, az kullanılmış.', 'Mobilya & İç Mekan', 3600.0, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=400&auto=format&fit=crop', 'Bursa'),
  ('Çekme Masa + Sandalye', '4 kişilik set, katlanır model.', 'Mobilya & İç Mekan', 2200.0, 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=400&auto=format&fit=crop', 'Antalya'),

  -- Elektronik
  ('12V LED Spot 6''lı Set', 'Kısılabilir, beyaz/sıcak ışık seçeneği.', 'Elektronik', 480.0, 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?q=80&w=400&auto=format&fit=crop', 'Ankara'),
  ('Karavan TV 22'' 12V', 'DVB-T2 alıcılı, satellite hazır.', 'Elektronik', 4500.0, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=400&auto=format&fit=crop', 'İstanbul'),
  ('4G LTE Router + Anten', 'Karavan için outdoor anten dahil.', 'Elektronik', 2100.0, 'https://images.unsplash.com/photo-1606851094291-6efae152bb87?q=80&w=400&auto=format&fit=crop', 'İzmir'),

  -- İç Donanım
  ('Portatif Tuvalet Thetford', 'Temiz kullanıldı, kimyasalları ile birlikte.', 'İç Donanım', 800.0, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=400&auto=format&fit=crop', 'İstanbul'),
  ('Karavan Duş Set', 'Söküleblir tabanlı, perdesi dahil.', 'İç Donanım', 1400.0, 'https://images.unsplash.com/photo-1620626011761-996317b8d101?q=80&w=400&auto=format&fit=crop', 'Bodrum'),
  ('Karbonmonoksit + Gaz Dedektörü', '12V, ses + LED uyarılı.', 'İç Donanım', 380.0, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop', 'Ankara')
) AS new_items(title, description, category, price, image_url, location_name)
WHERE NOT EXISTS (
  SELECT 1 FROM marketplace_items m WHERE m.title = new_items.title
);
