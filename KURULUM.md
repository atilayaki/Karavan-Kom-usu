# KURULUM ve DEVAM Notu

Bu dosya `karavanclaude` çalışma kopyasının nasıl ayağa kaldırılacağını ve son oturumda yapılan değişiklikleri açıklar.

## 1. Supabase Şema Migration'ı (ZORUNLU)

`docs/db_schema_v4.sql` dosyasını **Supabase Dashboard → SQL Editor** üzerinde tek seferde çalıştır.

Bu migration şunları yapar (idempotent — birden fazla kez koşturmak güvenli):

- ✅ `profiles` tablosu için **auto-create trigger** ekler (signup'ta otomatik profil oluşur — önceden eksikti, kritik bug)
- ✅ `messages` tablosunu yaratır (Telsiz chat için, eksikti)
- ✅ `posts` ve `marketplace_items` FK'lerini `profiles`'a çeker (yazar adı görünmüyordu)
- ✅ `notes` tablosu + `vw_notes` view'ı ekler (Askıda Not)
- ✅ `routes` tablosu + `vw_routes` view'ı ekler (İz Bırak)
- ✅ Realtime publication'a `messages` tablosunu ekler
- ✅ Tüm yeni tablolarda RLS'i kapatır (dev modu)
- ✅ Örnek not ve rota verisi ekler

**Önemli:** RLS şu an kapalı. Production'a gitmeden önce her tablo için doğru policy'leri yazmak gerekir.

## 2. Bağımlılıkları Kur ve Çalıştır

```bash
cd karavanclaude
npm install      # node_modules klasörü yok, ilk seferde gerekli
npm run dev      # http://localhost:3000
```

> **Not:** Node.js bu makinede henüz görünür şekilde kurulu değil. Antigravity üzerinden çalıştırıyorduysan bundled tooling'i kullanabilirsin. Yoksa https://nodejs.org/ üzerinden LTS sürümü kur.

## 3. Bu Oturumda Yapılan Değişiklikler

### Yeni dosyalar
- [`docs/db_schema_v4.sql`](docs/db_schema_v4.sql) — toplu migration

### Değişen dosyalar
- [`src/app/manzara/page.tsx`](src/app/manzara/page.tsx) — filtreler artık gerçekten farklı içerik tipleri çekiyor:
  - **En Yeniler / Popüler** → `posts` tablosu (created_at / likes_count'a göre sıralı)
  - **Askıda Notlar** → `vw_notes` view'ı
  - **İz Bırak (Rotalar)** → `vw_routes` view'ı
  - "Rota Paylaş" modal'ı eklendi (waypoints'i `şehir,enlem,boylam` formatında satır satır girilebiliyor)
- [`src/app/kesfet/page.tsx`](src/app/kesfet/page.tsx) — "Askıda Not Bırak" butonu artık çalışıyor:
  - Seçili spot'a not ekleme modal'ı açar
  - Detay görünümünde o spot'a ait notları listeler

### Yeni Türkçe terim eşleşmeleri (kod tarafında)
- `notes` tablosu → "Askıda Not" (coğrafi pinli not)
- `routes` tablosu → "İz Bırak" (paylaşılan rota)

## 4. task_plan'de Tamamlananlar

- ✅ **Phase 4 - Askıda Not Logic**
- ✅ **Phase 4 - İz Bırak (Route sharing) Logic**

## 5. Bilinen Açıklar / Sıradaki İşler

| Öncelik | İş | Not |
|---|---|---|
| P0 | RLS migration'ı çalıştır | `docs/db_schema_v7_rls.sql` (production'a geçerken) |
| P2 | Deployment + SEO | Vercel + sitemap + robots.txt |
| P2 | Image upload size/MIME guard | uploadImage.ts şu an tip+boyut kontrolü yapmıyor |
| P3 | DM kanalları için kanal-bazlı RLS | messages tablosunda DM gizliliği için filter |
| P3 | Bildirim merkezi | nudge dışında push/in-app notif |
| P3 | Telsiz DM channel hash | UUID'den 8-char substring güvenli değil; HMAC veya pair-table kullan |

## 6. Çözülmüş İşler (en son oturum)

- ✅ Routes haritada Leaflet polyline ile çiziliyor (`src/components/Map.tsx`)
- ✅ Notlar haritada turuncu marker (`src/components/Map.tsx`)
- ✅ Manzara filtreleri gerçek farklı kaynak çekiyor
- ✅ Yorum sistemi (`comments` tablosu + nested fetch)
- ✅ Image upload Storage'a (`src/lib/uploadImage.ts`)
- ✅ Bookmarks (Pazaryeri favori)
- ✅ Karavan Garaj profil alanları
- ✅ Profile stats canlı sayım
- ✅ Rehber detay içerikleri

## 6. Hatırlatma — Lint/Build Doğrulaması

Bu oturumda Node.js bulunamadığı için `tsc`/`eslint`/`next build` çalıştırılamadı. Kod manuel review edildi ama tip hataları olmayacağı garanti değil. İlk `npm run dev`'de gözle takip et veya `npm run lint` çalıştır.
