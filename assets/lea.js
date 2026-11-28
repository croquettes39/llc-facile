/* Léa — assistante automatique de LLC Facile (sans IA externe).
   Base de réponses en français, darija et anglais. Chaque sujet a des mots-clés (toutes langues confondues).
   À METTRE À JOUR si les prix, délais ou formules changent (comme tools/build.py et la fonction llcfacile-commande). */
window.LEA = (() => {
  const WA = '+212 6 63 28 51 19';
  const K = [
    { id: 'hello', w: 0.5, kw: ['bonjour', 'salut', 'bonsoir', 'coucou', 'hello', 'hi ', 'hey', 'salam', 'slm', 'السلام', 'سلام', 'مرحبا', 'اهلا', 'صباح الخير', 'مساء الخير'],
      fr: "Bonjour ! Je suis Léa. Posez-moi vos questions sur la création de votre LLC aux États-Unis : formules, prix, documents, délais, Stripe ou banque.",
      ar: "مرحبا! أنا ليا. سولني على تأسيس الشركة ديالك فميريكان: العروض، الأثمنة، الوثائق، المدة، Stripe ولا البنك.",
      en: "Hello! I'm Léa. Ask me anything about setting up your US LLC: packages, prices, documents, timing, Stripe or banking." },
    { id: 'thanks', w: 0.5, kw: ['merci', 'thank', 'thx', 'شكرا', 'الله يخليك', 'baraka', 'choukran', 'chokran', 'top', 'parfait', 'super'],
      fr: "Avec plaisir ! Si vous avez une autre question, je suis là. Pour commander, c'est sur la page Commander, et pour parler à quelqu'un, écrivez-nous sur WhatsApp au " + WA + ".",
      ar: "بلا جميل! إلا عندك شي سؤال آخر أنا هنا. باش تطلب، دخل لصفحة الطلب، وباش تهضر مع شي واحد كتب لينا فالواتساب " + WA + ".",
      en: "You're welcome! I'm here if you have another question. To order, use the Order page, or message us on WhatsApp at " + WA + "." },
    { id: 'prix', w: 1, kw: ['prix', 'tarif', 'combien', 'cout', 'coute', 'formule', 'offre', 'pack', 'forfait', 'cher', 'price', 'cost', 'how much', 'package', 'plan', 'بشحال', 'شحال', 'ثمن', 'الثمن', 'الاثمنه', 'الاتمنه', 'التمن', 'العروض', 'عرض', 'الباقه', 'flous', 'bchhal', 'chhal', 'taman', 'thaman'],
      fr: "Nous avons trois formules, prix fixes TTC et frais d'État du Wyoming inclus. Basic à 299 €, soit 3 290 dirhams : la création de la LLC, l'agent enregistré la première année, un numéro américain et l'EIN. Ultimate à 499 €, soit 5 390 dirhams, la plus choisie : en plus, l'aide pour Stripe, PayPal et le compte bancaire US. Ultimate Launch à 699 €, soit 7 590 dirhams : en plus, votre boutique Shopify configurée. Toutes les formules comprennent un suivi pendant 6 mois après la création. Tous les détails sont sur la page Tarifs.",
      ar: "عندنا تلاتة د العروض، الثمن ثابت وفيه مصاريف ولاية وايومينغ. Basic ب 3 290 درهم (299 أورو): تأسيس الشركة، الوكيل المسجل العام اللول، نمرة ميريكانية و EIN. Ultimate ب 5 390 درهم (499 أورو)، هو اللي كيختارو بزاف: زيادة على هادشي، المساعدة ف Stripe و PayPal والحساب البنكي الميريكاني. Ultimate Launch ب 7 590 درهم (699 أورو): زيادة على هادشي، كنوجدو ليك متجر Shopify. وكاع العروض فيهم متابعة لمدة 6 شهور من بعد التأسيس. كلشي مفصل فصفحة الأثمنة.",
      en: "We have three packages, fixed prices with Wyoming state fees included. Basic at €299: LLC formation, registered agent for the first year, a US phone number and the EIN. Ultimate at €499, the most popular: plus help with Stripe, PayPal and a US business bank account. Ultimate Launch at €699: plus your Shopify store set up. Every package includes 6 months of follow-up after formation. Full details are on the Pricing page." },
    { id: 'basic', w: 4, kw: ['basic', 'basique', 'بيزيك', 'البسيط'],
      fr: "La formule Basic coûte 299 €, soit 3 290 dirhams, paiement unique. Elle comprend la création de votre LLC au Wyoming avec les frais d'État, l'agent enregistré la première année, un numéro de téléphone américain, le numéro EIN, un accompagnement de base et un suivi pendant 6 mois après la création.",
      ar: "العرض Basic ب 3 290 درهم (299 أورو)، كتخلصو مرة وحدة. فيه تأسيس الشركة فوايومينغ مع مصاريف الولاية، الوكيل المسجل العام اللول، نمرة تيليفون ميريكانية، نمرة EIN، مواكبة أساسية ومتابعة لمدة 6 شهور من بعد التأسيس.",
      en: "The Basic package is €299, one-time payment. It includes your Wyoming LLC formation with state fees, the registered agent for the first year, a US phone number, the EIN, basic support and 6 months of follow-up after formation." },
    { id: 'ultimate', w: 4, kw: ['ultimate', 'ultime', 'اولتيمت', 'الكامل'],
      fr: "La formule Ultimate coûte 499 €, soit 5 390 dirhams, et c'est la plus choisie. Elle comprend tout le Basic, plus l'aide pour ouvrir Stripe et PayPal, l'aide pour ouvrir un compte professionnel américain comme Mercury ou Wise, et un accompagnement complet. La version Ultimate Launch, à 699 €, ajoute la création de votre boutique Shopify.",
      ar: "العرض Ultimate ب 5 390 درهم (499 أورو)، وهو اللي كيختارو بزاف. فيه كلشي ديال Basic، زايد المساعدة باش تحل Stripe و PayPal، والمساعدة باش تحل حساب بنكي ميريكاني بحال Mercury ولا Wise، ومواكبة كاملة. و Ultimate Launch ب 7 590 درهم كيزيد ليك متجر Shopify.",
      en: "The Ultimate package is €499 and it's our most popular. It includes everything in Basic, plus help opening Stripe and PayPal, help opening a US business account such as Mercury or Wise, and full support. Ultimate Launch, at €699, adds your Shopify store." },
    { id: 'launch', w: 3, kw: ['launch', 'ultimate launch', 'boutique', 'shopify', 'site e-commerce', 'ecommerce', 'e-commerce', 'store', 'shop', 'متجر', 'شوبيفاي', 'لانش', 'المتجر'],
      fr: "La formule Ultimate Launch coûte 699 €, soit 7 590 dirhams. Elle comprend tout l'Ultimate, plus la création et la configuration de votre boutique Shopify, les paiements par carte via Stripe et PayPal, et un lancement accompagné. Shopify Payments n'est pas inclus, car il demande un numéro SSN ou ITIN.",
      ar: "العرض Ultimate Launch ب 7 590 درهم (699 أورو). فيه كلشي ديال Ultimate، زايد كنصاوبو ونوجدو ليك متجر Shopify، الخلاص بالكارط عبر Stripe و PayPal، ومواكبة فالانطلاقة. Shopify Payments ماشي داخل، حيت خاصو نمرة SSN ولا ITIN.",
      en: "The Ultimate Launch package is €699. It includes everything in Ultimate, plus building and configuring your Shopify store, card payments through Stripe and PayPal, and a guided launch. Shopify Payments isn't included, as it requires an SSN or ITIN." },
    { id: 'suivi', w: 4, kw: ['suivi', 'suivez', 'suivre', 'apres la creation', 'combien de temps vous', '6 mois', 'six mois', 'follow', 'follow-up', 'after formation', 'متابعه', 'كتتابعو', 'تتبعو', 'المواكبه'],
      fr: "On vous suit pendant 6 mois à partir de la création de votre LLC, quelle que soit la formule. Pendant ces 6 mois, vous nous écrivez sur WhatsApp ou par e-mail dès que vous avez une question sur votre société, votre EIN, votre banque ou vos paiements.",
      ar: "كنتابعوك لمدة 6 شهور من نهار كتتأسس الشركة ديالك، كيفما كان العرض. فهاد 6 شهور، كتكتب لينا فواتساب ولا فالإيميل على أي سؤال على الشركة، EIN، البنك ولا الخلاص.",
      en: "We follow up with you for 6 months from the formation of your LLC, whatever the package. During those 6 months, message us on WhatsApp or by email whenever you have a question about your company, your EIN, your bank or your payments." },
    { id: 'compta', w: 4, kw: ['comptab', 'comptable', 'bilan', 'tenue des comptes', '1065', 'expert-comptable', 'rendez-vous fiscal', 'bookkeeping', 'accountant', 'accounting', 'المحاسبه', 'محاسب', 'الحسابات', 'كونطابل', 'كونطابيليتي', 'comptabilite'],
      fr: "La maintenance annuelle à 290 € couvre les obligations américaines, mais pas la tenue des comptes. En option, notre comptable partenaire s'en occupe : maintenance plus comptabilité de l'année pour 690 € par an au total, déclaration 1065 pour une LLC à plusieurs associés dès 990 € par an, ou un rendez-vous fiscal d'une heure pour le Maroc ou la France à 120 €. Pour en profiter, écrivez-nous sur WhatsApp au " + WA + ".",
      ar: "الصيانة السنوية ب 3 150 درهم فيها الالتزامات الأمريكية، ولكن ما فيهاش الحسابات. كخدمة زايدة، المحاسب الشريك ديالنا كيتكلف بها: الصيانة مع المحاسبة ديال العام ب 7 490 درهم فالعام فالمجموع، Form 1065 إلا كانو بزاف ديال الشركاء من 10 750 درهم فالعام، ولا موعد ضريبي ديال ساعة للمغرب ولا فرنسا ب 1 300 درهم. كتب لينا فالواتساب " + WA + ".",
      en: "Annual maintenance at €290 covers your US filings, but not bookkeeping. As an option, our partner accountant handles it: maintenance plus the year's bookkeeping for €690 per year in total, Form 1065 for a multi-member LLC from €990 per year, or a one-hour tax meeting for Morocco or France at €120. Message us on WhatsApp at " + WA + "." },
    { id: 'itin', w: 5, kw: ['itin', 'shopify payments', 'numero fiscal personnel', 'ssn', 'ايتين', 'اي تي اي ان'],
      fr: "L'option ITIN coûte 249 € en plus, soit 2 690 dirhams. On prépare et on suit votre demande de numéro fiscal américain personnel auprès de l'IRS. Il est utile notamment pour Shopify Payments. L'acceptation dépend de l'IRS et n'est pas garantie. L'option se paie avec un second lien, juste après la commande.",
      ar: "الخيار ITIN ب 2 690 درهم زايدين (249 أورو). كنوجدو ونتابعو الطلب ديال النمرة الضريبية الشخصية عند IRS. كتنفع خصوصا ل Shopify Payments. القبول كيرجع ل IRS وماشي مضمون. كتخلصو برابط ثاني مورا الطلب.",
      en: "The ITIN option is an extra €249. We prepare and follow up your application for a personal US tax number with the IRS. It's useful for Shopify Payments in particular. Approval is up to the IRS and isn't guaranteed. It's paid with a second link, right after your order." },
    { id: 'maintenance', w: 2, kw: ['maintenance', 'renouvel', 'chaque annee', 'annuel', 'annee prochaine', 'deuxieme annee', '2e annee', 'rapport annuel', 'annual', 'renewal', 'every year', 'الصيانه', 'كل عام', 'العام الجاي', 'التجديد', 'سنويا'],
      fr: "À partir de la deuxième année, la maintenance coûte 290 € par an, soit 3 150 dirhams. Elle comprend l'agent enregistré au Wyoming, le rapport annuel de l'État, la déclaration Form 5472 et 1120 pro forma, et les rappels d'échéances. C'est un paiement unique chaque année, pas un abonnement automatique.",
      ar: "من العام الثاني، الصيانة ب 3 150 درهم فالعام (290 أورو). فيها الوكيل المسجل فوايومينغ، التقرير السنوي ديال الولاية، التصريح Form 5472 و 1120، والتذكير بالمواعيد. كتخلصها مرة فالعام، ماشي اشتراك أوتوماتيكي.",
      en: "From the second year, maintenance is €290 per year. It covers the Wyoming registered agent, the state annual report, the Form 5472 and pro forma 1120 filing, and deadline reminders. It's a one-time payment each year, not an automatic subscription." },
    { id: 'stripe', w: 1.5, kw: ['stripe', 'paypal', 'encaisser', 'paiement par carte', 'accepter les cartes', 'سترايب', 'سطرايب', 'باي بال', 'بايبال', 'نخلص الكليان', 'نتخلص'],
      fr: "Stripe n'accepte pas les sociétés marocaines. Avec une LLC américaine, son EIN et un compte bancaire US, vous pouvez demander un compte Stripe américain et un compte PayPal Business pour encaisser vos clients par carte. On vous accompagne dans la demande avec la formule Ultimate. La validation finale reste décidée par Stripe et PayPal.",
      ar: "Stripe ما كيقبلش الشركات المغربية. بشركة LLC ميريكانية، مع EIN وحساب بنكي ميريكاني، تقدر تطلب حساب Stripe ميريكاني و PayPal Business باش تخلص الكليان ديالك بالكارط. كنعاونوك فالطلب فالعرض Ultimate. القبول النهائي كيقررو Stripe و PayPal.",
      en: "Stripe doesn't accept Moroccan companies. With a US LLC, its EIN and a US bank account, you can apply for a US Stripe account and PayPal Business to take card payments. We help you apply with the Ultimate package. Final approval is up to Stripe and PayPal." },
    { id: 'banque', w: 1.5, kw: ['banque', 'bancaire', 'compte pro', 'mercury', 'wise', 'relay', 'bank', 'account', 'dollar', 'البنك', 'بنك', 'حساب', 'الحساب', 'لكونط', 'كونط', 'compte'],
      fr: "Une fois la LLC créée et l'EIN obtenu, on vous aide à ouvrir en ligne un compte professionnel américain, par exemple chez Mercury ou Wise Business, pour recevoir des dollars et des euros. C'est inclus dans les formules Ultimate et Ultimate Launch. L'ouverture dépend de la banque et n'est pas garantie.",
      ar: "مني كتكون الشركة واجدة و EIN عندك، كنعاونوك تحل أونلاين حساب بنكي ميريكاني ديال الشركة، بحال Mercury ولا Wise Business، باش توصلك الدولار والأورو. هادشي داخل ف Ultimate و Ultimate Launch. الفتح كيرجع للبنك وماشي مضمون.",
      en: "Once the LLC is formed and the EIN obtained, we help you open a US business account online, for example with Mercury or Wise Business, to receive dollars and euros. It's included in Ultimate and Ultimate Launch. Approval depends on the bank and isn't guaranteed." },
    { id: 'documents', w: 1.5, kw: ['document', 'papier', 'passeport', 'carte d\'identite', 'piece', 'besoin de quoi', 'il faut quoi', 'passport', 'id card', 'what do i need', 'وثائق', 'الوراق', 'اوراق', 'الباسبور', 'باسبور', 'جواز', 'البطاقه', 'لاكارط', 'شنو خاصني', 'اشنو خاصني'],
      fr: "Il faut seulement un passeport valide, ou à défaut votre carte d'identité, votre adresse complète, le nom souhaité pour la société avec deux autres choix, une courte description de votre activité, et si vous êtes plusieurs, les associés et leurs parts. Tout se fait dans le formulaire en ligne, en une dizaine de minutes.",
      ar: "خاصك غير الباسبور صالح، ولا البطاقة الوطنية، العنوان الكامل ديالك، السمية اللي بغيتي للشركة مع جوج اختيارات أخرى، شرح قصير على النشاط ديالك، وإلا كنتو بزاف، الشركاء والحصص ديالهم. كلشي كيدار فالاستمارة أونلاين، ف عشر دقايق تقريبا.",
      en: "You just need a valid passport, or your ID card, your full address, your preferred company name with two backups, a short description of your business, and if there are several of you, the partners and their shares. It's all done in the online form, in about ten minutes." },
    { id: 'delai', w: 1.5, kw: ['delai', 'combien de temps', 'temps', 'rapide', 'quand', 'jours', 'semaine', 'duree', 'how long', 'when', 'time', 'days', 'شحال د الوقت', 'المده', 'مده', 'الوقت', 'ايام', 'امتى', 'فوقاش', 'شحال ديال الوقت', 'قداش'],
      fr: "La société est en général enregistrée au Wyoming en quelques jours ouvrés. Le numéro EIN peut prendre de quelques jours à plusieurs semaines, car les délais de l'IRS varient pour les non-résidents. On vous tient informé sur WhatsApp à chaque étape.",
      ar: "الشركة عادة كتسجل فوايومينغ ف شي أيام ديال الخدمة. نمرة EIN تقدر تاخد من شي أيام حتى لشي أسابيع، حيت المدة ديال IRS كتبدل للناس اللي ماساكنينش فميريكان. كنخبروك فالواتساب ف كل مرحلة.",
      en: "The company is usually registered in Wyoming within a few business days. The EIN can take from a few days to several weeks, as IRS timing varies for non-residents. We keep you posted on WhatsApp at every step." },
    { id: 'visa', w: 1.5, kw: ['visa', 'voyage', 'aller aux etats', 'se deplacer', 'resident', 'habiter', 'vivre aux', 'nationalite', 'marocain', 'etranger', 'travel', 'live in', 'citizen', 'فيزا', 'السفر', 'نسافر', 'نمشي لميريكان', 'ساكن', 'مغربي', 'الجنسيه'],
      fr: "Non, pas besoin de visa ni de voyage, et pas besoin d'habiter aux États-Unis. Tout se fait à distance, depuis le Maroc, la France ou ailleurs. Il n'y a pas non plus de capital minimum.",
      ar: "لا، ما محتاجش فيزا ولا تسافر، وما خاصكش تكون ساكن فميريكان. كلشي كيدار عن بعد، من المغرب، فرنسا ولا أي بلاد. وما كاينش رأس مال أدنى.",
      en: "No, you don't need a visa or to travel, and you don't need to live in the US. Everything is done remotely, from Morocco, France or anywhere else. There's no minimum capital either." },
    { id: 'impots', w: 2, kw: ['impot', 'taxe', 'fiscal', 'fiscalite', 'tva', 'declarer', 'payer moins', '0%', 'office des changes', 'tax', 'irs', 'الضريبه', 'الضرائب', 'ضريبه', 'لاطاكس', 'مكتب الصرف', 'التصريح'],
      fr: "Je ne peux pas donner de conseil fiscal. Selon votre pays de résidence, vous pouvez rester imposable chez vous et avoir des déclarations à faire, ainsi que des règles de change à respecter, comme l'Office des Changes au Maroc. Nous vous conseillons de consulter un expert-comptable ou un fiscaliste. Côté américain, notre maintenance annuelle inclut la déclaration Form 5472 et 1120 pro forma. Pour le Maroc ou la France, nous proposons aussi un rendez-vous fiscal d'une heure avec notre comptable partenaire, à 120 €.",
      ar: "ما نقدرش نعطيك استشارة ضريبية. على حساب البلاد اللي ساكن فيها، تقدر تبقى خاضع للضريبة تما وعندك تصريحات، وخاصك تحترم قوانين الصرف، بحال مكتب الصرف فالمغرب. كننصحوك تشاور مع خبير محاسب. من الجهة الميريكانية، الصيانة السنوية فيها التصريح Form 5472 و 1120. وللمغرب ولا فرنسا، عندنا موعد ضريبي ديال ساعة مع المحاسب الشريك ديالنا ب 1 300 درهم.",
      en: "I can't give tax advice. Depending on your country of residence, you may remain taxable there with filings to make, and currency-exchange rules to follow. Please consult an accountant or tax adviser. On the US side, our annual maintenance includes the Form 5472 and pro forma 1120 filing. For Morocco or France, we also offer a one-hour tax meeting with our partner accountant, at €120." },
    { id: 'wyoming', w: 1.5, kw: ['wyoming', 'pourquoi', 'delaware', 'etat', 'quel etat', 'why', 'which state', 'وايومينغ', 'علاش', 'الولايه'],
      fr: "On crée les LLC au Wyoming parce que c'est un des États les plus simples et les moins chers à maintenir : frais annuels faibles, pas d'impôt d'État sur les sociétés et une bonne confidentialité. C'est un choix très courant pour les entrepreneurs non-résidents.",
      ar: "كنأسسو الشركات فوايومينغ حيت من أسهل الولايات وأرخصهم فالصيانة: مصاريف سنوية قليلة، ما كايناش ضريبة ديال الولاية على الشركات، وسرية مزيانة. هو اختيار معروف بزاف عند المقاولين اللي ماساكنينش فميريكان.",
      en: "We form LLCs in Wyoming because it's one of the simplest and cheapest states to maintain: low annual fees, no state corporate income tax and good privacy. It's a very common choice for non-resident founders." },
    { id: 'ein', w: 2, kw: ['ein', 'numero fiscal', 'numero d\'entreprise', 'tax id', 'employer identification', 'النمره الضريبيه'],
      fr: "L'EIN est le numéro d'identification de votre société auprès de l'IRS, l'administration fiscale américaine. Il est indispensable pour ouvrir un compte bancaire, Stripe ou PayPal. Nous le demandons pour vous, il est inclus dans toutes les formules.",
      ar: "EIN هي النمرة ديال الشركة عند IRS، الإدارة الضريبية الميريكانية. ضرورية باش تحل حساب بنكي، Stripe ولا PayPal. حنا كنطلبوها ليك، وداخلة ف جميع العروض.",
      en: "The EIN is your company's identification number with the IRS, the US tax authority. You need it to open a bank account, Stripe or PayPal. We apply for it for you, and it's included in every package." },
    { id: 'etapes', w: 1.5, kw: ['commander', 'commande', 'etape', 'comment ca marche', 'comment faire', 'procedure', 'demarrer', 'commencer', 'inscri', 'order', 'how does it work', 'steps', 'start', 'كيفاش', 'المراحل', 'نطلب', 'نبدا', 'الطلب', 'kifach', 'kifash'],
      fr: "C'est simple. Un : vous remplissez le formulaire sur la page Commander, en une dizaine de minutes, et vous payez en ligne. Deux : on dépose votre société au Wyoming. Trois : on obtient votre numéro EIN auprès de l'IRS. Quatre : selon votre formule, on vous aide pour la banque, Stripe, PayPal ou Shopify. On vous suit sur WhatsApp du début à la fin.",
      ar: "ساهلة. واحد: كتعمر الاستمارة فصفحة الطلب ف عشر دقايق تقريبا، وكتخلص أونلاين. جوج: كنسجلو الشركة ديالك فوايومينغ. تلاتة: كنجيبو ليك نمرة EIN من IRS. ربعة: على حساب العرض، كنعاونوك فالبنك، Stripe، PayPal ولا Shopify. كنتابعوك فالواتساب من اللول حتى اللخر.",
      en: "It's simple. One: fill in the form on the Order page, about ten minutes, and pay online. Two: we file your company in Wyoming. Three: we get your EIN from the IRS. Four: depending on your package, we help with banking, Stripe, PayPal or Shopify. We support you on WhatsApp from start to finish." },
    { id: 'payer', w: 1.5, kw: ['payer', 'paiement', 'virement', 'carte bancaire', 'en dirham', 'en euro', 'cash', 'plusieurs fois', 'pay ', 'payment', 'card', 'نخلص', 'الخلاص', 'خلاص', 'بالدرهم', 'لاكارط', 'تحويل', 'nkhalas'],
      fr: "Le paiement se fait en ligne par carte bancaire, de façon sécurisée avec Stripe, juste après le formulaire de commande. Il est encaissé en euros ; les montants en dirhams ou en francs suisses sont indicatifs et votre banque fait la conversion. C'est un paiement unique, sans abonnement.",
      ar: "الخلاص كيكون أونلاين بالكارط البنكية، بأمان عبر Stripe، مورا الاستمارة ديال الطلب. كيتخلص بالأورو، والثمن بالدرهم غير للتوضيح والبنك ديالك كيدير التحويل. كتخلص مرة وحدة، بلا اشتراك.",
      en: "Payment is made online by card, securely through Stripe, right after the order form. It's charged in euros; amounts in dirhams or Swiss francs are indicative and your bank does the conversion. It's a one-time payment, no subscription." },
    { id: 'llc', w: 1, kw: ['c\'est quoi', 'qu\'est-ce', 'quest ce', 'llc', 'societe americaine', 'what is', 'شنو هي', 'اش هي', 'شركه', 'الشركه'],
      fr: "Une LLC est une société américaine à responsabilité limitée, simple à gérer et sans capital minimum. Votre patrimoine personnel est séparé de celui de la société. Elle permet de vendre partout dans le monde et d'accéder aux outils américains comme Stripe, PayPal et les banques en ligne.",
      ar: "LLC هي شركة ميريكانية ذات مسؤولية محدودة، ساهلة فالتسيير وبلا رأس مال أدنى. الأملاك الشخصية ديالك كتبقى بعيدة على الشركة. كتخليك تبيع فالعالم كامل وتوصل للأدوات الميريكانية بحال Stripe و PayPal والبنوك أونلاين.",
      en: "An LLC is a US limited liability company, simple to run with no minimum capital. Your personal assets are kept separate from the company's. It lets you sell worldwide and access US tools like Stripe, PayPal and online banks." },
    { id: 'associes', w: 1.5, kw: ['associe', 'plusieurs', 'partenaire', 'a deux', 'mon mari', 'ma femme', 'partner', 'co-founder', 'شريك', 'الشركاء', 'جوج د الناس'],
      fr: "Oui, une LLC peut avoir un ou plusieurs associés. Vous indiquez simplement chaque associé et sa part dans le formulaire de commande, et chacun envoie sa pièce d'identité.",
      ar: "إيه، الشركة تقدر يكون فيها شريك واحد ولا بزاف. غير كتكتب كل شريك والحصة ديالو فالاستمارة، وكل واحد كيصيفط الباسبور ديالو.",
      en: "Yes, an LLC can have one or several members. Just list each member and their share in the order form, and each one sends their ID." },
    { id: 'rembourse', w: 2, kw: ['rembours', 'annul', 'retract', 'refund', 'cancel', 'cgv', 'conditions', 'نرجع', 'الفلوس', 'الغاء', 'نلغي'],
      fr: "Les conditions d'annulation et de remboursement sont détaillées dans nos conditions générales de vente, en bas de chaque page. En résumé : avant le dépôt de la société au Wyoming, vous êtes remboursé, déduction faite des frais déjà engagés et d'un forfait de traitement ; après le dépôt, les frais d'État et l'agent enregistré ne sont plus remboursables. Pour un cas précis, écrivez-nous sur WhatsApp au " + WA + ".",
      ar: "شروط الإلغاء والاسترجاع مفصلة فالشروط العامة ديال البيع، لتحت ف كل صفحة. باختصار: قبل ما تتسجل الشركة فوايومينغ، كترجع ليك الفلوس من غير المصاريف اللي تخلصات ومصاريف المعالجة؛ ومورا التسجيل، مصاريف الولاية والوكيل المسجل ما كيترجعوش. لأي حالة خاصة، كتب لينا فالواتساب " + WA + ".",
      en: "Cancellation and refund terms are set out in our terms of sale, linked at the bottom of every page. In short: before the Wyoming filing, you're refunded minus costs already incurred and a processing fee; after filing, state fees and the registered agent aren't refundable. For a specific case, message us on WhatsApp at " + WA + "." },
    { id: 'contact', w: 1, kw: ['whatsapp', 'telephone', 'appeler', 'parler', 'humain', 'conseiller', 'contact', 'mail', 'email', 'joindre', 'call', 'phone', 'human', 'واتساب', 'الواتساب', 'تيليفون', 'نعيط', 'نهضر', 'نتواصل', 'الرقم', 'النمره'],
      fr: "Vous pouvez nous écrire sur WhatsApp au " + WA + " pour le Maroc, ou au +33 7 80 80 31 30 pour la France et l'Europe, ou par e-mail à contact@llcfacile.com. Une vraie personne vous répond, en français ou en darija.",
      ar: "تقدر تكتب لينا فالواتساب " + WA + " للمغرب، ولا +33 7 80 80 31 30 لفرنسا وأوروبا، ولا فالإيميل contact@llcfacile.com. كيجاوبك شخص حقيقي، بالدارجة ولا بالفرنسية.",
      en: "You can message us on WhatsApp at " + WA + " for Morocco or +33 7 80 80 31 30 for France and Europe, or email contact@llcfacile.com. A real person replies, in French, Darija or English." },
    { id: 'confiance', w: 1.5, kw: ['arnaque', 'fiable', 'confiance', 'serieux', 'legal', 'legit', 'scam', 'trust', 'qui etes', 'who are you', 'نصب', 'ثقه', 'قانوني', 'شكون نتوما'],
      fr: "LLC Facile est une marque de Sovereignlife immo, une SARL marocaine immatriculée à Casablanca. Nous faisons l'accompagnement administratif de la création de votre LLC, avec un suivi personnel sur WhatsApp. Les mentions légales et les CGV sont en bas de chaque page.",
      ar: "LLC Facile علامة ديال Sovereignlife immo، شركة مغربية SARL مسجلة فالدار البيضاء. كنواكبوك إداريا فتأسيس الشركة ديالك، مع متابعة شخصية فالواتساب. المعلومات القانونية والشروط العامة لتحت ف كل صفحة.",
      en: "LLC Facile is a brand of Sovereignlife immo, a Moroccan SARL registered in Casablanca. We provide administrative support for your LLC formation, with personal follow-up on WhatsApp. Legal notice and terms are at the bottom of every page." },
  ];

  const norm = (s) => ' ' + String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[’`]/g, "'").replace(/[^\p{L}\p{N}' %+-]+/gu, ' ').replace(/\s+/g, ' ') + ' ';
  const KN = K.map(k => ({ ...k, nk: k.kw.map(norm).map(x => x.trim()) }));

  const FALLBACK = {
    fr: "Je n'ai pas la réponse exacte à cette question. Écrivez-nous sur WhatsApp au " + WA + ", une vraie personne vous répond rapidement. Vous pouvez aussi me demander : les prix, les documents, les délais, Stripe ou la banque.",
    ar: "ما عنديش الجواب المضبوط على هاد السؤال. كتب لينا فالواتساب " + WA + "، كيجاوبك شخص حقيقي دغيا. وتقدر تسولني على: الأثمنة، الوثائق، المدة، Stripe ولا البنك.",
    en: "I don't have the exact answer to that. Message us on WhatsApp at " + WA + " and a real person will reply quickly. You can also ask me about prices, documents, timing, Stripe or banking.",
  };

  return {
    answer(q, lang) {
      const L = /[؀-ۿ]/.test(q) ? 'ar' : (lang in FALLBACK ? lang : 'fr');
      const t = norm(q);
      let best = null, score = 0;
      for (const k of KN) {
        let s = 0;
        for (const w of k.nk) {
          if (!w) continue;
          const hit = w.length <= 3 ? t.includes(' ' + w + ' ') : t.includes(w);
          if (hit) s += 1 + Math.min(w.length, 12) / 12;
        }
        s *= k.w;
        if (s > score) { score = s; best = k; }
      }
      return { lang: L, id: best ? best.id : null, text: best ? best[L] : FALLBACK[L] };
    },
  };
})();
