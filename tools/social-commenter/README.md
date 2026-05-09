# Social Media Commenter Pro

Bu uygulama, Instagram, TikTok ve Twitter (X) gibi sosyal medya platformlarında hızlı ve yarı otomatik bir şekilde yorum yapmanızı sağlar.

## Özellikler

- **Tıkla ve Yaz:** Herhangi bir yazı alanına tıkladığınızda önceden belirlenmiş metni otomatik yazar.
- **Platform Tanıma:** Twitter, Instagram ve TikTok için özel hızlı mesaj şablonları sunar.
- **İnsan Benzeri Yazım:** Bot algılama sistemlerine takılmamak için rastgele gecikmelerle harf harf yazar.
- **Oturum Koruması:** Giriş bilgilerinizi saklar, her seferinde tekrar giriş yapmanıza gerek kalmaz.
- **Şık Arayüz:** Tarayıcı içinde yüzen kontrol paneli ile mesajları anlık değiştirebilirsiniz.

## Kurulum

Uygulamanın olduğu dizine gidin:
```bash
cd tools/social-commenter
```

Bağımlılıkları yükleyin:
```bash
npm install
```

## Kullanım

Uygulamayı başlatın:
```bash
node index.mjs
```

Başladıktan sonra terminal size hangi platforma gitmek istediğinizi soracaktır. Tarayıcı açıldığında:
1. Eğer giriş yapmadıysanız giriş yapın.
2. Yazı yazmak istediğiniz alana (yorum kutusu, tweet alanı vb.) fare ile tıklayın.
3. Uygulama seçili mesajı sizin yerinize yazacaktır.

## İpuçları

- **Auto-Enter:** Paneldeki onay kutusunu işaretleyerek yazma işlemi bittikten sonra mesajın otomatik gönderilmesini sağlayabilirsiniz.
- **Hızlı Mesajlar:** Paneldeki butonlara tıklayarak hazır şablonlar arasında hızlıca geçiş yapabilirsiniz.
- **Güvenlik:** Uygulama şifrelerinizi asla görmez veya kaydetmez; sadece tarayıcının standart çerez (cookie) sistemini kullanır.
