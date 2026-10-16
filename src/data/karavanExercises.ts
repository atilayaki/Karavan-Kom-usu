export interface KaravanExercise {
  id: string;
  name: string;
  tagline: string;
  category: 'surus-sonrasi' | 'bacak-kalca' | 'gogus-kol' | 'core-denge' | 'sabah-esnemesi';
  categoryLabel: string;
  equipment: 'Ekipmansız' | 'Karavan Basamağı' | 'Kamp Sandalyesi' | 'Mat / Çim' | 'Karavan Tamponu';
  targetMuscles: string[];
  secondaryMuscles: string[];
  difficulty: 'Başlangıç' | 'Orta' | 'İleri';
  durationSec: number;
  repsDefault: number;
  setsDefault: number;
  restSec: number;
  caloriesBurnEstimate: number; // kcal per 3 sets
  animationType: 'squat' | 'chair-dips' | 'stepup' | 'pushup' | 'cobra' | 'plank' | 'hamstring' | 'sun-salute';
  tips: string[];
  instructions: string[];
  whyForCaravan: string;
}

export const KARAVAN_EXERCISES: KaravanExercise[] = [
  {
    id: 'direksiyon-bel-kobra',
    name: 'Uzun Sürüş Kobra Esnemesi',
    tagline: 'Direksiyon başında sıkışan bel ve omurgayı sıfırlar',
    category: 'surus-sonrasi',
    categoryLabel: '🧘 Sürüş & Bel Açma',
    equipment: 'Mat / Çim',
    targetMuscles: ['Bel (Erector Spinae)', 'Alt Omurga'],
    secondaryMuscles: ['Karın Kasları', 'Göğüs Kafesi', 'Boyun'],
    difficulty: 'Başlangıç',
    durationSec: 40,
    repsDefault: 10,
    setsDefault: 3,
    restSec: 20,
    caloriesBurnEstimate: 18,
    animationType: 'cobra',
    tips: [
      'Omuzlarını kulaklarına doğru çekme, geride ve aşağıda tut.',
      'Beli sıkıştırmak yerine omurgayı yukarı ve ileri uzatmaya odaklan.',
      'Derin nefes alarak göğsünü aç.'
    ],
    instructions: [
      'Matın veya çimlerin üzerine yüzüstü uzan.',
      'Ellerini omuzlarının tam altına yerleştir, dirseklerini gövdene yakın tut.',
      'Nefes alırken avuç içlerinle hafifçe iterek göğsünü yerden kaldır.',
      'Tepede 3 saniye duraklayıp nefes verirken kontrollüce in.'
    ],
    whyForCaravan: 'Karavan kullanırken saatlerce aynı açıda kalan omurlar arasındaki disk baskısını rahatlatır ve bel ağrısını önler.'
  },
  {
    id: 'karavan-squat',
    name: 'Doğa & Karavan Squat',
    tagline: 'Dolaşımı canlandıran ve bacak gücünü koruyan temel çömelme',
    category: 'bacak-kalca',
    categoryLabel: '🦵 Bacak & Kalça',
    equipment: 'Ekipmansız',
    targetMuscles: ['Ön Bacak (Quadriceps)', 'Kalça (Gluteus)'],
    secondaryMuscles: ['Arka Bacak (Hamstring)', 'Core Kasları'],
    difficulty: 'Başlangıç',
    durationSec: 45,
    repsDefault: 15,
    setsDefault: 3,
    restSec: 30,
    caloriesBurnEstimate: 42,
    animationType: 'squat',
    tips: [
      'Ağırlığı topuklarına ver, dizlerin ayak parmak ucunu aşırı geçmesin.',
      'Göğsünü dik tut, manzaraya doğru karşıya bak.',
      'Çömelirken dizlerini içeri bükme, dışarı doğru aç.'
    ],
    instructions: [
      'Ayaklarını omuz genişliğinde aç, parmak uçların hafifçe dışa baksın.',
      'Kollarını denge için öne uzatarak kalçanı geriye sandalyeye oturur gibi indir.',
      'Uylukların yere paralel olana kadar in.',
      'Topuklarından güç alarak başlangıç pozisyonuna doğrul.'
    ],
    whyForCaravan: 'Uzun yolculuklarda uyuşan bacak damarlarını hızla açar ve kamp yükü taşırken diz sağlığını korur.'
  },
  {
    id: 'kampi-dips',
    name: 'Kamp Sandalyesi Triceps Dips',
    tagline: 'Kamp sandalyesiyle üst gövde ve arka kol kuvvetlendirme',
    category: 'gogus-kol',
    categoryLabel: '💪 Göğüs & Kol',
    equipment: 'Kamp Sandalyesi',
    targetMuscles: ['Arka Kol (Triceps)', 'Ön Omuz'],
    secondaryMuscles: ['Üst Göğüs', 'Üst Sırt'],
    difficulty: 'Orta',
    durationSec: 40,
    repsDefault: 12,
    setsDefault: 3,
    restSec: 30,
    caloriesBurnEstimate: 36,
    animationType: 'chair-dips',
    tips: [
      'Kamp sandalyenizin sabit ve düz bir zeminde olduğundan emin olun.',
      'Dirseklerinizi dışarı açmayın, arkaya doğru bükün.',
      'Omuzlarınızı aşağıda tutarak boynunuzu serbest bırakın.'
    ],
    instructions: [
      'Sandalyenin ucuna oturup ellerinizle oturma kenarını kavrayın.',
      'Kalçanızı öne kaydırıp ayak tabanlarınızla sağlam basın.',
      'Dirseklerinizi 90 derece bükerek gövdenizi aşağı indirin.',
      'Kollarınızla sandalyeyi iterek başlangıç pozisyonuna yükselin.'
    ],
    whyForCaravan: 'Tenteyi açarken, bisiklet taşırken ve ağır karavan ekipmanlarını iterken gereken itme kuvvetini sağlar.'
  },
  {
    id: 'karavan-stepup',
    name: 'Karavan Basamağı Step-Up',
    tagline: 'Karavan giriş basamağını kardiyo ve bacak kondisyonuna çevir',
    category: 'bacak-kalca',
    categoryLabel: '🦵 Bacak & Kalça',
    equipment: 'Karavan Basamağı',
    targetMuscles: ['Kalça (Gluteus)', 'Kuadriseps', 'Kalf'],
    secondaryMuscles: ['Kalp & Dolaşım', 'Ayak Bileği Stabilitesi'],
    difficulty: 'Başlangıç',
    durationSec: 50,
    repsDefault: 16,
    setsDefault: 3,
    restSec: 25,
    caloriesBurnEstimate: 48,
    animationType: 'stepup',
    tips: [
      'Ayağınızı basamağa tam taban basın, parmak ucunda kalmayın.',
      'Yukarı çıkarken öndeki bacağın gücünü kullanın, alttaki bacakla zıplamayın.',
      'Karavan basamağının kilitli ve sağlam olduğunu kontrol edin.'
    ],
    instructions: [
      'Karavan basamağının önünde dik durun.',
      'Sağ ayağınızı basamağın ortasına yerleştirin.',
      'Sağ topuktan güç alarak gövdenizi yukarı itin ve sol ayağı yanına getirin.',
      'Sol ayakla kontrollüce yere inip aynı hareketi bacak değiştirerek tekrarlayın.'
    ],
    whyForCaravan: 'Doğa yürüyüşlerinde yokuş tırmanma gücünü artırır ve kamp yerinde sıfır maliyetle kardiyo sağlar.'
  },
  {
    id: 'karavan-pushup',
    name: 'Karavan Tampon Şınavı',
    tagline: 'Eğimli açıyla eklemleri yormadan göğüs ve kol çalıştırma',
    category: 'gogus-kol',
    categoryLabel: '💪 Göğüs & Kol',
    equipment: 'Karavan Tamponu',
    targetMuscles: ['Göğüs (Pectoralis)', 'Ön Kol'],
    secondaryMuscles: ['Triceps', 'Core', 'Sırt'],
    difficulty: 'Orta',
    durationSec: 45,
    repsDefault: 12,
    setsDefault: 3,
    restSec: 35,
    caloriesBurnEstimate: 38,
    animationType: 'pushup',
    tips: [
      'Vücudunuz baştan topuğa kadar düz bir tahta gibi olsun.',
      'Belinizi aşağı düşürmeyin, kalçanızı yukarı fırlatmayın.',
      'Tampon temiz değilse eldiven veya bez kullanabilirsiniz.'
    ],
    instructions: [
      'Ellerinizi omuz genişliğinden biraz geniş olarak karavan arka tamponuna koyun.',
      'Ayaklarınızı geriye alıp düz bir plank çizgisi oluşturun.',
      'Dirseklerinizi 45 derece açıyla geriye bükerek göğsünüzü tampona yaklaştırın.',
      'Kuvvetlice iterek başlangıç pozisyonuna dönün.'
    ],
    whyForCaravan: 'Düz zeminde şınav çekmek istemeyenler için çamursuz, hijyenik ve eklemleri koruyan mükemmel bir kamp alternatifidir.'
  },
  {
    id: 'karavan-plank',
    name: 'Karavan İçi Denge Plankı',
    tagline: 'Tüm gövdeyi çelik gibi sabitleyen merkez bölgesi duruşu',
    category: 'core-denge',
    categoryLabel: '🔥 Core & Denge',
    equipment: 'Mat / Çim',
    targetMuscles: ['Karın (Abs)', 'Transverse Abdominis'],
    secondaryMuscles: ['Omuzlar', 'Bel', 'Kalça'],
    difficulty: 'Orta',
    durationSec: 45,
    repsDefault: 1, // statik tutuş
    setsDefault: 3,
    restSec: 30,
    caloriesBurnEstimate: 30,
    animationType: 'plank',
    tips: [
      'Boynunu zorlama, yere doğru nötr bakış açısı koru.',
      'Göbeğini omurgaya doğru çekerek karın kaslarını kilitle.',
      'Nefesini tutma; burnundan sakin alıp ağzından ver.'
    ],
    instructions: [
      'Dirseklerin omuzlarının tam altında olacak şekilde ön kollarının üzerine yat.',
      'Ayak parmak uçlarına kalkarak tüm gövdeni yerden kaldır.',
      'Vücudunu dümdüz bir hat haline getirip sabit tut.',
      'Süre boyunca karın ve kalçayı sıkarak pozisyonu koru.'
    ],
    whyForCaravan: 'Karavanda dar alanda bile halı üzerinde 1 metrekarede yapılabilir; karavan sürüşünde doğru postürü korur.'
  },
  {
    id: 'lastik-hamstring',
    name: 'Karavan Lastiği Hamstring Germesi',
    tagline: 'Gaz ve fren bacağındaki gerginliği söken derin bacak esnemesi',
    category: 'surus-sonrasi',
    categoryLabel: '🧘 Sürüş & Bel Açma',
    equipment: 'Karavan Basamağı',
    targetMuscles: ['Arka Bacak (Hamstrings)', 'Kalf'],
    secondaryMuscles: ['Bel', 'Aşil Tendonu'],
    difficulty: 'Başlangıç',
    durationSec: 40,
    repsDefault: 8,
    setsDefault: 2,
    restSec: 15,
    caloriesBurnEstimate: 14,
    animationType: 'hamstring',
    tips: [
      'Sırtını kamburlaştırma, göğsünü öne uzatarak kalçadan eğil.',
      'Dizini kilitleme, hafif mikro-bükülme sağlayabilirsin.',
      'Keskin ağrı hissetme; sadece tatlı bir gerilme olmalı.'
    ],
    instructions: [
      'Karavanın tekeri veya basamağı önüne dik durun.',
      'Bir topuğunuzu tekerin üzerine veya basamağa uzatın.',
      'Destek bacağınızı hafifçe büküp gövdenizi düz tutarak öne doğru eğilin.',
      '20 saniye esnemeyi hissedip diğer bacağa geçin.'
    ],
    whyForCaravan: 'Uzun otoyol sürüşlerinde sürekli pedala basan sağ bacak ve arka zincir kas spazmlarını anında giderir.'
  },
  {
    id: 'sabah-gunese-selam',
    name: 'Kamp Sabahı Güneşe Selam',
    tagline: 'Kuş sesleri eşliğinde göğsü ve akciğerleri açan tam uyanış',
    category: 'sabah-esnemesi',
    categoryLabel: '🌅 Sabah Güneşe Selam',
    equipment: 'Ekipmansız',
    targetMuscles: ['Omuzlar & Göğüs', 'Tüm Omurga'],
    secondaryMuscles: ['Kalça Fleksörleri', 'Kalf', 'Nefes Kapasitesi'],
    difficulty: 'Başlangıç',
    durationSec: 50,
    repsDefault: 8,
    setsDefault: 2,
    restSec: 15,
    caloriesBurnEstimate: 20,
    animationType: 'sun-salute',
    tips: [
      'Güneşin doğuşuna doğru dönün ve temiz doğa havasını ciğerlerinize çekin.',
      'Kollarınızı kaldırırken omuzlarınızı kasmayın, genişçe açılın.',
      'Hareketleri nefesinizle senkronize edin.'
    ],
    instructions: [
      'Ayaklarınız birleşik, dik bir duruşla durun.',
      'Derin bir nefes alarak kollarınızı iki yana ve gökyüzüne doğru uzatın.',
      'Parmak uçlarınızla göğe uzanırken hafifçe geriye doğru esneyin.',
      'Nefes verirken kollarınızı daire çizerek indirin ve öne nazikçe eğilin.'
    ],
    whyForCaravan: 'Karavanın içindeki sabah uyuşukluğunu 2 dakikada atar, kan dolaşımını canlandırarak güne taze enerjiyle başlatır.'
  }
];

export const WORKOUT_ROUTINES = [
  {
    id: 'surus-kurtarma',
    title: '🚐 Uzun Sürüş Sonrası Rahatlama',
    tagline: 'Direksiyon yorgunluğu ve bel tutulmalarına son veren 10 dakikalık paket',
    durationMinutes: 10,
    exerciseIds: ['direksiyon-bel-kobra', 'lastik-hamstring', 'karavan-squat', 'sabah-gunese-selam'],
    level: 'Herkes İçin',
    tag: 'Popüler Kamp Rutini'
  },
  {
    id: 'kamp-kuvvet',
    title: '⚡ Kamp Yeri Vücut Kuvveti',
    tagline: 'Sandalye ve basamakla tüm vücudu fit tutan ekipmansız antrenman',
    durationMinutes: 15,
    exerciseIds: ['karavan-squat', 'kampi-dips', 'karavan-pushup', 'karavan-stepup', 'karavan-plank'],
    level: 'Orta Seviye',
    tag: 'Kas Gücü'
  },
  {
    id: 'gun-dogumu-uyanisi',
    title: '🌅 Gün Doğumu Uyanış & Mobilite',
    tagline: 'Kahve demlenirken güne taze enerjiyle başlamak için 6 dakikalık ritüel',
    durationMinutes: 6,
    exerciseIds: ['sabah-gunese-selam', 'direksiyon-bel-kobra', 'lastik-hamstring'],
    level: 'Hafif & Ferahlatıcı',
    tag: 'Sabah Rutini'
  }
];
