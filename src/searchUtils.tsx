import { Medication } from './data';

// 1. Basic Arabic normalization
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآٱء]/g, 'ا')     // Normalize alef variants & hamza
    .replace(/[ة]/g, 'ه')         // Normalize taa marbouta -> haa
    .replace(/[يى]/g, 'ي')        // Normalize yaa/alef maksoura -> yaa
    .replace(/[ًٌٍَُِّْـ]/g, '')    // Remove diacritics & tatweel
    .replace(/[-\/\\^$*+?.()|[\]{}]/g, ' ') // Replace punctuation with space
    .trim();
}

// 2. Vowel-stripped / skeleton normalization for fuzzy Arabic matching
export function fuzzySkeleton(text: string): string {
  const norm = normalizeArabic(text);
  // Remove long vowels (و , ي , ا) to create phonetic skeleton
  return norm.replace(/[ويا]/g, '');
}

// 3. Levenshtein Distance for typo tolerance
export function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// 4. Clinical Synonym / Trade Name Groups
// If a query matches any term in a group, expand search to include all synonyms in that group
const SYNONYM_GROUPS: string[][] = [
  // Pantoprazole & trade names
  ['بانتوبرازول', 'بروتوفكس', 'برتوفكس', 'فيوتوبان', 'بانتولوك', 'pantoprazole', 'protofix', 'viotopan', 'pantoloc', 'زوركال', 'zurcal', 'كنترولوك', 'controloc'],
  // Omeprazole / Esomeprazole
  ['اوميز', 'نابيوزول', 'ايسوميبرازول', 'زوميجيرال', 'omeprazole', 'esomeprazole', 'omez', 'napizole'],
  // Paracetamol
  ['باراسيتامول', 'بنادول', 'برفلجان', 'بيرفالجان', 'انجكتمول', 'موفامول', 'سيتال', 'paracetamol', 'panadol', 'perfalgan', 'injectmol'],
  // Propofol / Diprivan
  ['بروبوفول', 'دبريفان', 'ديبيرفان', 'diprivan', 'propofol'],
  // Iron / Itaverose
  ['ايتافيروز', 'ايتوفيروز', 'بيتوفيروز', 'حديد', 'itaverose'],
  // Aminophylline / Etaphylline
  ['امينوفلين', 'ايتافللين', 'aminophylline', 'etaphylline'],
  // Phytomenadione / Vit K
  ['كوناكيون', 'امري ك', 'ابيكافيت', 'phytomenadione', 'konakion', 'epicavit'],
  // Alveofact
  ['الفيوفاكت', 'alveofact'],
  // Furosemide / Lasix
  ['فوروسيميد', 'لازيكس', 'furosemide', 'lasix'],
  // Ondansetron / Zofran / Danset
  ['اوندانستيرون', 'دانست', 'زوفران', 'ondansetron', 'zofran', 'danset'],
  // Metronidazole / Flagyl
  ['ميترونيدازول', 'فلاجيل', 'فلادازول', 'metronidazole', 'flagyl'],
  // Ceftriaxone / Rocephin / Epicephin
  ['سيفترياكسون', 'سفترياكسون', 'سيفرياكسون', 'روسيفين', 'سفاكسون', 'ابيسفين', 'ابيسيفين', 'إبيسفين', 'إبيسفين', 'ceftriaxone', 'rocephin', 'epicephin'],
  // Meropenem / Meronem
  ['ميروبينيم', 'ميرونام', 'ميرونيم', 'meropenem', 'meronem'],
  // Vancomycin
  ['فانكوميسين', 'فانكوسين', 'vancomycin'],
  // Dexmedetomidine / Precedex
  ['بريزيدكس', 'دكسميديتوميدين', 'precedex', 'dexmedetomidine'],
  // Betolvex
  ['بيتولفكس', 'بيطولفكس', 'betolvex'],
  // Levetiracetam / Teratam / Keppra
  ['تيراتام', 'تيراليبسي', 'تيرليبيسى', 'كيبيليسى', 'كيبرا', 'تيربريكس', 'teratam', 'tiratam', 'keppra', 'levetiracetam', 'inadilvox', 'leinoseiz'],
  // Telebrix
  ['تليبركس', 'telebrix'],
  // Tetanus
  ['تيتانوس', 'tetanus'],
  // Nitroglycerin / Glyceryl Trinitrate / Tridil / Nitronal
  ['جلسرايل', 'تراينيترات', 'جلسرين', 'ترينيترات', 'ترايديل', 'نيترونال', 'tridil', 'nitronal', 'glyceryl', 'trinitrate', 'nitroglycerin'],
  // Dobutamine / Dobutrex
  ['دوبوتامين', 'دبيوتامين', 'دوبتركس', 'دبيوتركس', 'دوبوتركس', 'dobutamine', 'dobutrex'],
  // Dopamine
  ['دوبامين', 'dopamine'],
  // Diprofos
  ['دبروفوس', 'ديبروفوس', 'ديروفوس', 'ديكساجلوب', 'diprofos', 'diprophos'],
  // Spasmofree
  ['سبازموفري', 'سبازمو', 'سيزمو', 'spasmofree', 'spasmo'],
  // Cerocetam / Cerebrocetam / Piracetam / Nootropil
  ['سيبروسيتام', 'سيروبروسيتام', 'سيروسيتام', 'بيراسيتام', 'نيتروبيل', 'نوتروبيل', 'cerocetam', 'cerebrocetam', 'piracetam', 'nootropil'],
  // Streptokinase / Sedonase
  ['ستربتوكينيز', 'سيدوناز', 'سيدروناز', 'sedonase', 'sedronase', 'streptokinase'],
  // Succinylcholine / Scoline
  ['سكسينيل', 'سكسينيل كولين', 'سكيولين', 'succinylcholine', 'scoline'],
  // Cefoperazone / Cefobid / Peracef / Cefuzone
  ['سيفوبيرازون', 'سيفوبيروزون', 'سيفوبيد', 'سيفوزون', 'بيراسيف', 'سيفوبيرازون بلس', 'سيفوبيد بلس', 'cefoperazone', 'cefobid', 'peracef', 'cefuzone'],
  // Sevoflurane / Sevorane
  ['سيفوفلوران', 'سيفوران', 'سيفو فلوران', 'sevoflurane', 'sevorane'],
  // Cerebrolysin
  ['سيربرولايسين', 'سربرولايزين', 'سيربرولايزين', 'سبرجولاسين', 'سبرجو', 'cerebrolysin'],
  // Digoxin / Cardixin / Lanoxin
  ['كارديكسين', 'كاردكسين', 'كارديكين', 'لانوكسين', 'ديجوكسين', 'كارديقين', 'cardixin', 'lanoxin', 'digoxin'],
  // Caffeine Citrate / Encafine / Acetofent
  ['كافيين', 'انكافاين', 'انفاكافين', 'انفكافين', 'اسيتوفنت', 'أسيتوفنت', 'caffeine', 'encafine', 'acetofent'],
  // Ketalar / Ketamine
  ['كتالار', 'كيتالار', 'كيتامين', 'كتامين', 'ketalar', 'ketamine'],
  // Labetalol / Labipress
  ['لابيتالول', 'لابيبرس', 'لاببرس', 'labetalol', 'labipress'],
  // Neostigmine / Maestrotens / Mestinon / Pyridostigmine
  ['نيوستجمين', 'مايستروتنس', 'مايسترو', 'مستينون', 'ميستينون', 'بريدوستجمين', 'neostigmine', 'maestrotens', 'mestinon', 'pyridostigmine'],
  // Penfill / Insulins
  ['بنفل', 'بنسل', 'بنقل', 'بنفيل', 'penfill', 'penfills'],
  // Midazolam / Midathetic / Dormicum
  ['ميداثيتك', 'ميدانيتك', 'ميدازولام', 'دورميكام', 'midathetic', 'midazolam', 'dormicum'],
  // Unictam / Ampicillin + Sulbactam / Sulbin
  ['يونيكتام', 'انيكتام', 'يونيكتم', 'انيكتم', 'سولبين', 'سلبين', 'سولبيسين', 'سولباكتام', 'سلبوكتام', 'امبيسيلين', 'امبيسلين', 'unictam', 'sulbin', 'sulbacin', 'ampicillin', 'sulbactam'],
  // Nalufin / Nalbuphine
  ['نالوفين', 'نالبوفين', 'نالفين', 'nalufin', 'nalbuphine', 'nalfin'],
  // Granisetron / Kytril / Granitron
  ['جرانسيترون', 'جراسنيترون', 'جرانيسيترون', 'جرانترون', 'كايتريل', 'كيترل', 'granisetron', 'kytril', 'granitron'],
  // Kidmin / Amino acids for renal failure
  ['كيدمين', 'كيدمن', 'كدين', 'كيدامين', 'kidmin'],
  // Cefoxitin
  ['سيفوكسيتين', 'سيفوكستين', 'سيفوكسين', 'سيوفوكسيتين', 'cefoxitin'],
  // Betadine / Povidone Iodine
  ['بيتادين', 'بتادين', 'بوفيدون', 'بوفيدين', 'betadine', 'povidone', 'iodine'],
  // Bivatracin / Bivracin / Bacitracin
  ['بيفتراسين', 'بيفاتراسين', 'بيقتراسين', 'بيفراسين', 'بفترسين', 'بيفترسين', 'bivatracin', 'bivracin', 'bacitracin', 'neomycin'],
  // Pre NAN / Infant Milk
  ['بري نان', 'برينان', 'بري-نان', 'نان', 'لبن أطفال', 'pre nan', 'prenan', 'pre-nan', 'nan'],
  // Tussin / Tussin Mix
  ['توسين', 'توسين ميكس', 'توسين شراب', 'توسين كحة', 'توسين نورمال', 'توسينميكس', 'tussin', 'tussin mix'],
  // Oxytocin / Syntocinon
  ['اوكسي توسين', 'أوكسي توسين', 'اوكسيتوسين', 'سينتوسين', 'oxytocin', 'syntocinon'],
  // Ethamsylate / Dicynone
  ['ايثاميسيلات', 'اثاميسيلات', 'دايسينون', 'ديسينون', 'ethamsylate', 'dicynone'],
  // Cyclopentolate / Cyclogyl / Suixlate
  ['سيكلوبنتولات', 'سيكلوجل', 'سويكسولات', 'سوكسيلات', 'سواكسلات', 'cyclopentolate', 'cyclogyl', 'suixlate'],
  // Cidex / Glutaraldehyde / Disinfectant
  ['سيدكس', 'سيدكس مطهر', 'سيدكس مناظير', 'سيدكس أدوات', 'سيدكس ادوات', 'غلوتارالدهيد', 'جلارالدهيد', 'جلوتارالدهيد', 'cidex', 'glutaraldehyde'],
  // Uride / UR-AID / Fawwar
  ['يورايد', 'يورإيد', 'ورايد', 'يور ايد', 'يور-ايد', 'يور إيد', 'فوار يورايد', 'فوار يورإيد', 'uraid', 'ur-aid', 'ur aid', 'uride', 'euride'],
  // Neomune
  ['نيوميون', 'نيومين', 'نيو ميون', 'نيوميون زجاجة', 'neomune', 'neomun', 'ne-mune'],
  // Ensure
  ['انشور', 'إنشور', 'انشور زجاجة', 'انشور شراب', 'ensure', 'ensur'],
  // Betamin / Peptamen
  ['بيتامين', 'بيتامين زجاجة', 'بيبتامين', 'بتامين', 'betamin', 'peptamen', 'bitamin'],
  // Domigest
  ['دوميجست', 'دومجست', 'دوميجست شراب', 'دوميغيست', 'domigest', 'domegest'],
  // Hydroferrin Enrich
  ['هيدروفرين', 'هيدروفرين انريتش', 'هيدروفرين إنريتش', 'انريتش', 'إنريتش', 'حديد قطرة', 'hydroferrin', 'enrich', 'hydroferrin enrich'],
  // Primacor / Milrinone
  ['بريماكور', 'بريماكور امبول', 'بريماكور أمبول', 'ميلرينون', 'primacor', 'milrinone'],
  // Arbatag / Tegretol / Carbamazepine
  ['ارباتج', 'أرباتج', 'ارباتاج', 'ارباتج200', 'تجريتول', 'تجريتول 200', 'كاربامازيبين', 'arbatag', 'tegretol', 'carbamazepine'],
  // Amocerebral / Amoseryle
  ['اموسريبرال', 'أموسريبرال', 'اموسريبرال بلس', 'أموسريبرال بلس', 'اموزيريل', 'اموزبريل', 'amoseryle', 'amocerebral', 'amocerebral plus'],
  // Erastapex / Irastapex / Olmesartan
  ['ايراستبكس', 'ايراستابكس', 'ايرستابكس', 'erastapex', 'irastapex'],
  // Alfacalcidol / One Alpha / Bonecare
  ['الفاكالسيدول', 'الفاكسيدول', 'وان الفا', 'وان الفاء', 'بونكير', 'alfacalcidol', 'one alpha', 'bonecare'],
  // Ursochol / Ursofalk
  ['اورسكول', 'اورسوفالك', 'أورسوفالك', 'ursochol', 'ursofalk', 'ursodeoxycholic'],
  // Bilichol / Rowachol / Bilcol
  ['بيليكول', 'بيلكول', 'رواكول', 'روابكس', 'bilichol', 'rowachol', 'bilcol', 'rowapex'],
  // Torasemide / Examide
  ['تروسيميد', 'تروسيميده', 'اكساميد', 'أكساميد', 'torasemide', 'torsemide', 'examide'],
  // Metformin / Cidophage / Glucophage
  ['ميتفورمين', 'متفورمين', 'سيدوفاج', 'سدوفاج', 'جلوكوفاج', 'جلوكوفاج اكس ار', 'جلكوفاج', 'metformin', 'cidophage', 'glucophage'],
  // Glucan / Glibenclamide + Metformin
  ['جلوكان', 'جلوبينكلاميد', 'جلوكوفانس', 'glucan', 'glibenclamide', 'glucovance'],
  // Forxiga / Dapagliflozin / Diglifloz
  ['فورسيجا', 'فورسياجا', 'ديجليفلوز', 'داباجليفلوزين', 'dapagliflozin', 'forxiga'],
  // Diosmin / Daflon
  ['ديوزمين', 'دافلون', 'دفلون', 'ديوسمين', 'diosmin', 'daflon'],
  // Diamicron / Diamedizen / Gliclazide
  ['دياميكرون', 'دياميدازين', 'دياميدزين', 'دياميديزين', 'دياميكرو', 'جليكلازيد', 'diamicron', 'diamedizen', 'diamedazine', 'gliclazide'],
  // Depakine / Valproate
  ['ديباكين', 'دباكين', 'فالبروات', 'صوديوم فالبروات', 'ديباكين كرونو', 'depakine', 'valproate', 'sodium valproate', 'valproic'],
  // Risperidone / Risperdal / Apexidone
  ['ريسبريدون', 'رسبريدون', 'ريسبردال', 'رسبردال', 'ابكسيدون', 'أبكسيدون', 'سيكودال', 'risperidone', 'risperdal', 'apexidone', 'psychodal'],
  // Randil / Adancor / Nicorandil
  ['رانديل', 'ادانكور', 'أدانكور', 'نيكورانديل', 'نيكوراندايل', 'randil', 'adancor', 'nicorandil'],
  // Ramipril / Tritace
  ['رامبيريل', 'راميبريل', 'تريتاس', 'تريتيس', 'ramipril', 'tritace'],
  // Sulfasalazine / Salazopyrin
  ['سلفاسلازين', 'سلفاسالازين', 'سالازوبيرين', 'سلازوبيرين', 'sulfasalazine', 'salazopyrin'],
  // Sinopril / Lisinopril / Zestril
  ['سينوبريل', 'ليزينوبريل', 'ليسينوبريل', 'زيستريل', 'sinopril', 'lisinopril', 'zestril'],
  // Sinopril Co / Zestoretic
  ['سينوبريل كو', 'سينوبريل كوا', 'زيستوريتك', 'زيستورتك', 'sinopril co', 'zestoretic', 'lisinopril co'],
  // Seloken ZOK / Betaloc / Metoprolol
  ['سيلوكين', 'سيلوكين زوك', 'سيلوكينزوك', 'بيتالوك', 'بيتاتالوك', 'ميتوبرولول', 'seloken', 'seloken zok', 'betaloc', 'betaloc zok', 'metoprolol'],
  // Marevan / Warfarin
  ['ماريفان', 'مريفان', 'مارفان', 'وارفارين', 'ورفارين', 'marevan', 'warfarin'],
  // Cerebromap / Praxilene / Naftidrofuryl
  ['سريبروماب', 'سيربروماب', 'سيرسروفوريل', 'سيرسرو فوريل', 'نافتيدروفوريل', 'بريكسيلين', 'براكسيلين', 'براكسلان', 'cerebromap', 'naftidrofuryl', 'praxilene'],
  // Vildagliptin / Galvus / Vildaglose
  ['فيلداجلبتن', 'فيلداجليبتين', 'فيلداجليبتن', 'جالفوس', 'جلفوس', 'فيلداجلوز', 'فيلداجلوس', 'فيلداجلاوز', 'vildagliptin', 'galvus', 'vildaglose'],
  // Vildagliptin Met / Galvus Met / Vildaglose Plus
  ['فيلداجلبتن بلس', 'جالفوس مت', 'جالفوس ميت', 'جلفوس مت', 'فيلداجلوز بلس', 'فيلداجلوز مت', 'galvus met', 'vildagliptin met', 'vildaglose plus', 'vildaglose met'],
  // Famotidine / Antodine
  ['فاموتيدين', 'فاموتدين', 'فاموتين', 'انتودين', 'أنتودين', 'famotidine', 'antodine'],
  // Voriconazole / Vfend
  ['فوريكونازول', 'فوركونازول', 'ففند', 'فيفند', 'voriconazole', 'vfend'],
  // Fluoxetine / Prozac
  ['فلوكسيتين', 'فلوكسين', 'بروزاك', 'فلوزاك', 'ديبريبان', 'fluoxetine', 'prozac'],
  // Paroxetine / Seroxat
  ['باروكسيتين', 'بروكسيتين', 'سيروكسات', 'سروكسات', 'paroxetine', 'seroxat'],
  // Vitayami
  ['فيتايامي', 'فيتامي', 'فيتايامى', 'vitayami'],
  // Calcium Carbonate / Calcimate / Cal-Preg
  ['كالسيوم كربونات', 'كربونات الكالسيوم', 'كالسيمات', 'كال بريج', 'كالبريج', 'كال بريج اقراص', 'كالسيترون', 'calcium carbonate', 'calcimate', 'cal-preg', 'calpreg'],
  // Hydrochlorothiazide / Esidrex
  ['هيدروكلوروثيازيد', 'هيدروكلوروثيازايد', 'اسيدريكس', 'أسيدريكس', 'hydrochlorothiazide', 'esidrex', 'hctz'],
  // Bromazepam / Lexotanil / Calmepam
  ['برومازيبام', 'بروموزيبام', 'لكسوتانيل', 'لوكسوتانيل', 'كالميبام', 'bromazepam', 'lexotanil', 'calmepam'],
  // Cardura / Doxazosin
  ['كاردورا', 'كردورا', 'دوكسازوسين', 'دكسازوسين', 'cardura', 'doxazosin'],
  // Cosantox / Cozantex
  ['كوزانتوكس', 'كوزنتوكس', 'كوزانتكس', 'كوزانتيكس', 'cosantox', 'cozantex'],
  // Lasilactone / Spironolactone + Furosemide
  ['لازيلاكتون', 'لازلاكتون', 'لازيلكتون', 'لوزاركتون', 'lasilactone', 'lazilactone'],
  // Montelukast / Singulair / Clairair / Asmacast
  ['مونتيلوكاست', 'مونتيلوكست', 'سينجولير', 'سنجولير', 'ازماكاست', 'أزماكاست', 'إزماكاست', 'كلير اير', 'montelukast', 'singulair', 'clairair', 'asmacast'],
  // Methyldopa / Aldomet
  ['ميثيل دوبا', 'ميثيلدوبا', 'مثيل دوبا', 'الدومت', 'الدمت', 'ألدومت', 'ألدوميت', 'methyldopa', 'aldomet'],
  // Mebendazole / Vermox / Antiver
  ['ميبندازول', 'مبندازول', 'فيرموكس', 'فرمكس', 'انتيفير', 'أنتيفير', 'mebendazole', 'vermox', 'antiver'],
  // Trimetazidine / Vastarel / Metamidine / Metacardia
  ['ميتاميدين', 'ميتاكارديا', 'متاكارديا', 'فاستاريل', 'فستاريل', 'فاستوريل', 'تريميتازيدين', 'تريمتازيدين', 'metamidine', 'metacardia', 'vastarel', 'trimetazidine'],
  // Isosorbide Mononitrate / Mononit / Imdur / Monomak
  ['مونونيت', 'ايزوسوربيد', 'أيزوسوربيد', 'مونوماك', 'ايمدور', 'إيمدور', 'isosorbide mononitrate', 'mononit', 'imdur', 'monomak'],
  // Cyclobenzaprine / Multi-relax / Move Easy
  ['سايكلوبنزابرين', 'سيكلوبنزابرين', 'مالتي ريلاكس', 'مالتي-ريلاكس', 'موف ايزي', 'موف إيزي', 'موفايزي', 'cyclobenzaprine', 'multi-relax', 'multirelax', 'move easy', 'moveasy'],
  // Milga / Neurovit
  ['ميلجا', 'ملجا', 'ميلجا ادفانس', 'نيوروفيت', 'نيورفيت', 'milga', 'neurovit'],
  // Mucosta / Rebamipide
  ['ميكوستا', 'مكوستا', 'ريباميبيد', 'ريبامبيد', 'mucosta', 'rebamipide'],
  // Methyltechno
  ['ميثيل تكنو', 'ميثيلتكنو', 'ميثيل تكنو أفلام', 'methyltechno'],
  // Repaglinide / Megix / Novonorm
  ['ميجكس', 'مجكس', 'ريباجلينيد', 'رباجلينيد', 'نوفونورم', 'نوفونوروم', 'megix', 'repaglinide', 'novonorm'],
  // Formoterol / Metrohaler / Foradil
  ['متروهيلر', 'متروهيلار', 'مترو هيلر', 'فورميترول', 'فورمترول', 'فورايديل', 'فوراديل', 'metrohaler', 'formoterol', 'foradil'],
  // Nitroglycerin / Nitromak
  ['نيتروجليسرين', 'نتروجليسرين', 'نيتروماك', 'نيتروماك ريتارد', 'nitroglycerin', 'nitromak'],
  // Nebivolol / Nebilet / Nevilob
  ['نيبفولول', 'نيبيفولول', 'نيبيلت', 'نبيلت', 'نيفيلوب', 'نيفلب', 'نفلوب', 'nebivolol', 'nebilet', 'nevilob', 'nebilob'],
  // Hydroxychloroquine / Plaquenil / Hydroquine
  ['هيدروكسي كلوروكين', 'هيدروكسي كلوروكوين', 'بلاكونيل', 'بلاكوانيل', 'هيدروكين', 'هيدروكوين', 'هيدروكسيكوين', 'hydroxychloroquine', 'plaquenil', 'hydroquine', 'hydroquin'],
  // Rowatinex / Urinex
  ['رواتينكس', 'رواتينكس كبسول', 'رواتنكس', 'يورينكس', 'يورنكس', 'روانكس', 'rowatinex', 'urinex'],
  // Carvid / Carvedilol / Dilatrend
  ['كارفيد', 'كرفيد', 'كارفيديلول', 'كارفيدلول', 'ديلاتريند', 'ديلاتيرند', 'carvid', 'carvedilol', 'dilatrend'],
  // Valsartan / Tareg / Diovan / Disartan
  ['فالسارتان', 'فلستاران', 'تارج', 'طارق', 'تارغ', 'دايوفان', 'ديوفان', 'ديسارتان', 'valsartan', 'tareg', 'diovan', 'disartan'],
  // Verapamil / Isoptin
  ['فيراباميل', 'فراباميل', 'فيرابميل', 'ايزوبتين', 'إيزوبتين', 'ايزوبتن', 'verapamil', 'isoptin'],
  // Captopril / Capoten
  ['كابتوبريل', 'كبتوبريل', 'كابوتين', 'كابتن', 'كابوتن', 'captopril', 'capoten'],
  // Marevan / Warfarin
  ['مارفان', 'ماريفان', 'مرفان', 'مريفان', 'وارفارين', 'ورفارين', 'marevan', 'marivan', 'warfarin']
];

export function isGenericOrUnitToken(token: string): boolean {
  const norm = normalizeArabic(token);
  if (!norm) return true;
  if (/^\d+%?$/.test(norm)) return true;
  if (/^\d+(مل|جم|مجم|g|mg|ml)$/.test(norm)) return true;
  const genericWords = new Set([
    'مل', 'جم', 'مجم', 'التر', 'تر', 'فيال', 'فايل', 'امبول', 'امبولات',
    'اقراص', 'قرص', 'كبسول', 'كبسولات', 'بخاخ', 'بخاخه', 'زجاجه', 'زجاجة',
    'انبوبة', 'انبوبه', 'قمع', 'شريط', 'محلول', 'حقنة', 'حقنه', 'علبة', 'علبه',
    'ml', 'mg', 'g', 'vial', 'amp', 'ampoule', 'bottle', 'box', 'tablet', 'capsule'
  ]);
  return genericWords.has(norm);
}

// Expand search terms based on clinical synonyms
function expandQueryTerms(rawQuery: string): string[] {
  const normQuery = normalizeArabic(rawQuery);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  const expanded = new Set<string>(queryTokens);

  for (const token of queryTokens) {
    if (isGenericOrUnitToken(token)) continue;
    const tokenSkel = fuzzySkeleton(token);
    for (const group of SYNONYM_GROUPS) {
      const isMatch = group.some(item => {
        const normItem = normalizeArabic(item);
        if (normItem === token) return true;
        const itemWords = normItem.split(/\s+/);
        if (itemWords.length > 1 && itemWords.includes(token)) {
          return false;
        }
        if (normItem.length >= 4 && (normItem.includes(token) || token.includes(normItem))) return true;
        if (tokenSkel.length >= 4 && fuzzySkeleton(item) === tokenSkel) return true;
        return false;
      });

      if (isMatch) {
        group.forEach(syn => expanded.add(normalizeArabic(syn)));
      }
    }
  }

  return Array.from(expanded);
}

// 5. Main Search Function
export function searchMedications(items: Medication[], query: string): Medication[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const normQuery = normalizeArabic(trimmed);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return [];

  const nameQueryTokens = queryTokens.filter(t => !isGenericOrUnitToken(t));
  const expandedTerms = expandQueryTerms(trimmed);

  return items.map(item => {
    const normName = normalizeArabic(item.name);
    const itemTokens = normName.split(/\s+/).filter(Boolean);

    let score = 0;
    let firstMatchIndex = 999;

    const normNameCompact = normName.replace(/\s+/g, '');
    const normQueryCompact = normQuery.replace(/\s+/g, '');

    // Strict Name Check: If user typed specific medication name token(s),
    // the item MUST match ALL of these name tokens (or expanded synonyms/compact string match).
    if (nameQueryTokens.length > 0) {
      const matchesAllNameTokens = nameQueryTokens.every(qToken => {
        const qSkel = fuzzySkeleton(qToken);
        const directMatch = itemTokens.some(iToken => {
          if (iToken === qToken || iToken.startsWith(qToken) || iToken.includes(qToken)) return true;
          if (qSkel.length >= 3) {
            const iSkel = fuzzySkeleton(iToken);
            if (iSkel === qSkel || iSkel.startsWith(qSkel) || iSkel.includes(qSkel)) return true;
            if (Math.abs(iToken.length - qToken.length) <= 2 && levenshtein(qToken, iToken) <= 1) return true;
          }
          return false;
        });

        if (directMatch) return true;

        return expandedTerms.some(expTerm => {
          if (expTerm === qToken) return false;
          const expCompact = expTerm.replace(/\s+/g, '');
          if (expCompact.length >= 3 && normNameCompact.includes(expCompact)) return true;
          return itemTokens.some(iToken => iToken === expTerm || iToken.startsWith(expTerm) || iToken.includes(expTerm));
        });
      });

      const compactMatch = normQueryCompact.length >= 3 && normNameCompact.includes(normQueryCompact);

      if (!matchesAllNameTokens && !compactMatch) {
        return { item, score: 0, firstMatchIndex, nameLength: normName.length };
      }
    }

    // First word match bonus (gives priority to items whose primary name starts with the searched token)
    if (nameQueryTokens.length > 0 && itemTokens.length > 0) {
      const firstQToken = nameQueryTokens[0];
      const firstIToken = itemTokens[0];
      if (firstIToken === firstQToken) {
        score += 800;
      } else if (firstIToken.startsWith(firstQToken)) {
        score += 500;
      }
    }

    // 1. Full name matching against full query
    if (normName === normQuery || normNameCompact === normQueryCompact) {
      score += 1000;
      firstMatchIndex = 0;
    } else if (normName.startsWith(normQuery) || normNameCompact.startsWith(normQueryCompact)) {
      score += 600;
      firstMatchIndex = 0;
    } else {
      const idx = normName.indexOf(normQuery);
      if (idx !== -1) {
        const isWordStart = idx === 0 || normName.charAt(idx - 1) === ' ';
        score += isWordStart ? 400 : 100;
        firstMatchIndex = idx;
      } else if (normQueryCompact.length >= 3 && normNameCompact.includes(normQueryCompact)) {
        score += 350;
        firstMatchIndex = normNameCompact.indexOf(normQueryCompact);
      }
    }

    // 2. Token level check for query tokens
    for (const qToken of queryTokens) {
      const qSkel = fuzzySkeleton(qToken);
      let tokenMatched = false;

      for (const iToken of itemTokens) {
        if (iToken === qToken) {
          score += 250;
          tokenMatched = true;
        } else if (iToken.startsWith(qToken)) {
          score += 180;
          tokenMatched = true;
        } else if (iToken.includes(qToken)) {
          score += 60;
          tokenMatched = true;
        } else if (qSkel.length >= 3) {
          const iSkel = fuzzySkeleton(iToken);
          if (iSkel === qSkel) {
            score += 120;
            tokenMatched = true;
          } else if (iSkel.startsWith(qSkel)) {
            score += 90;
            tokenMatched = true;
          } else if (iSkel.includes(qSkel)) {
            score += 40;
            tokenMatched = true;
          } else if (Math.abs(iToken.length - qToken.length) <= 2) {
            const dist = levenshtein(qToken, iToken);
            if (dist <= 1 || (qToken.length >= 6 && dist <= 2)) {
              score += 30;
              tokenMatched = true;
            }
          }
        }
      }

      // 3. Synonym / Expanded term match if direct token didn't match directly
      if (!tokenMatched) {
        for (const expTerm of expandedTerms) {
          if (expTerm === qToken) continue;
          if (normName.startsWith(expTerm)) {
            score += 150;
            tokenMatched = true;
            break;
          } else if (normName.includes(expTerm)) {
            score += 80;
            tokenMatched = true;
            break;
          }
        }
      }
    }

    return { item, score, firstMatchIndex, nameLength: normName.length };
  })
  .filter(result => result.score > 0)
  .sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.firstMatchIndex !== b.firstMatchIndex) return a.firstMatchIndex - b.firstMatchIndex;
    return a.nameLength - b.nameLength;
  })
  .map(result => result.item);
}

// 6. Helper to highlight matched words or search terms in the rendered text
export function getMatchedTerms(fullName: string, query: string): string[] {
  if (!query.trim()) return [];
  const expanded = expandQueryTerms(query);
  
  const words = fullName.split(/\s+/).filter(Boolean);
  return words.filter(word => {
    const normW = normalizeArabic(word);
    if (!normW) return false;
    const wordSkel = fuzzySkeleton(normW);

    return expanded.some(term => {
      if (normW.includes(term) || term.includes(normW)) return true;
      if (wordSkel.length >= 3 && (fuzzySkeleton(term).includes(wordSkel) || wordSkel.includes(fuzzySkeleton(term)))) return true;
      if (Math.abs(normW.length - term.length) <= 2) {
        if (levenshtein(normW, term) <= 1) return true;
      }
      return false;
    });
  });
}

export function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const matchedTerms = getMatchedTerms(text, query);
  if (matchedTerms.length === 0) return <>{text}</>;

  const tokens = text.split(/(\s+)/);

  return (
    <>
      {tokens.map((token, i) => {
        const isMatch = matchedTerms.includes(token);
        if (isMatch) {
          return (
            <mark key={i} className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-semibold border border-amber-200/80">
              {token}
            </mark>
          );
        }
        return <span key={i}>{token}</span>;
      })}
    </>
  );
}
