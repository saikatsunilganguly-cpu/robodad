/* RoboDad language practice: curated beginner lessons and role-play scenes.
   Every phrase here was written by hand (not generated on the fly), so lessons
   are the same for everyone and can be checked by a fluent speaker.
   Hindi lines carry Devanagari (t), Roman letters (r) and English (e). */
(function(){
  const fr = {
    name: "French", native: "Français", voice: "fr-CA", hello: "Bonjour",
    lessons: [
      { id:"greet", title:"Hellos and goodbyes", tip:"In Québec you'll hear \"Allô !\" for hi, too.", p:[
        { t:"Bonjour !", e:"Hello! / Good morning!" },
        { t:"Salut !", e:"Hi! (casual)" },
        { t:"Ça va ?", e:"How's it going?" },
        { t:"Ça va bien, merci.", e:"I'm doing well, thanks." },
        { t:"À plus tard !", e:"See you later!" } ] },
      { id:"me", title:"All about you", tip:"Enchanté if you're a guy, enchantée if you're a girl. Sounds the same, spelled different. Classic French.", p:[
        { t:"Je m'appelle Sam.", e:"My name is Sam." },
        { t:"Comment tu t'appelles ?", e:"What's your name?" },
        { t:"J'ai quinze ans.", e:"I'm fifteen." },
        { t:"J'habite à Toronto.", e:"I live in Toronto." },
        { t:"Enchanté !", e:"Nice to meet you!" } ] },
      { id:"polite", title:"Magic words", tip:"Use vous with adults you don't know and tu with friends. Dad rule: when in doubt, vous.", p:[
        { t:"S'il vous plaît.", e:"Please. (polite)" },
        { t:"Merci beaucoup !", e:"Thank you very much!" },
        { t:"De rien.", e:"You're welcome." },
        { t:"Excusez-moi.", e:"Excuse me." },
        { t:"Pardon ?", e:"Sorry? (I didn't catch that)" } ] },
      { id:"cafe", title:"At the café", tip:"\"Je voudrais\" (I would like) is politer than \"Je veux\" (I want). Servers notice.", p:[
        { t:"Je voudrais un croissant.", e:"I'd like a croissant." },
        { t:"Un chocolat chaud, s'il vous plaît.", e:"A hot chocolate, please." },
        { t:"C'est combien ?", e:"How much is it?" },
        { t:"L'addition, s'il vous plaît.", e:"The bill, please." },
        { t:"C'est délicieux !", e:"It's delicious!" } ] },
      { id:"school", title:"School survival", tip:"\"Tu peux répéter ?\" will save you in every French class. Use it without shame.", p:[
        { t:"J'ai un test demain.", e:"I have a test tomorrow." },
        { t:"Mon cours préféré, c'est les maths.", e:"My favourite class is math." },
        { t:"Je n'ai pas compris.", e:"I didn't understand." },
        { t:"Tu peux répéter ?", e:"Can you say that again?" },
        { t:"Comment dit-on « pencil » en français ?", e:"How do you say \"pencil\" in French?" } ] },
      { id:"around", title:"Getting around", tip:"In Montréal the subway is le métro. Same as Paris, fewer accordions.", p:[
        { t:"Où est le métro ?", e:"Where is the subway?" },
        { t:"À gauche.", e:"To the left." },
        { t:"À droite.", e:"To the right." },
        { t:"Tout droit.", e:"Straight ahead." },
        { t:"C'est loin ?", e:"Is it far?" } ] },
      { id:"feel", title:"How you feel", tip:"Add an e when a girl is speaking: contente, fatiguée, stressée.", p:[
        { t:"Je suis content.", e:"I'm happy." },
        { t:"Je suis fatigué.", e:"I'm tired." },
        { t:"J'ai faim.", e:"I'm hungry. (literally: I have hunger)" },
        { t:"Je suis stressé.", e:"I'm stressed." },
        { t:"Pas de souci !", e:"No worries!" } ] },
      { id:"fun", title:"Weekend plans", tip:"In Québec the weekend is often la fin de semaine. You'll sound like a local.", p:[
        { t:"J'aime jouer au soccer.", e:"I like playing soccer." },
        { t:"J'écoute de la musique.", e:"I'm listening to music." },
        { t:"Tu fais quoi ce week-end ?", e:"What are you doing this weekend?" },
        { t:"On joue aux jeux vidéo ?", e:"Want to play video games?" },
        { t:"C'est génial !", e:"That's awesome!" } ] },
    ],
    scenes: [
      { id:"cafe", title:"Café in Montréal", who:"Dad's the server", open:"Bonjour ! Bienvenue au café. Qu'est-ce que je vous sers ? (Hi! Welcome to the café. What can I get you?)", hints:["Je voudrais un croissant.", "Un chocolat chaud, s'il vous plaît.", "C'est combien ?"] },
      { id:"intro", title:"New classmate", who:"Dad's the new kid", open:"Salut ! Je suis nouveau ici. Comment tu t'appelles ? (Hi! I'm new here. What's your name?)", hints:["Je m'appelle…", "J'ai quinze ans.", "Enchanté !"] },
      { id:"directions", title:"Lost in Québec City", who:"Dad's a friendly local", open:"Bonjour ! Vous avez l'air perdu. Je peux vous aider ? (Hello! You look lost. Can I help you?)", hints:["Où est le métro ?", "C'est loin ?", "Merci beaucoup !"] },
      { id:"shop", title:"Hoodie shopping", who:"Dad's the cashier", open:"Bonjour ! Vous cherchez quelque chose ? (Hello! Are you looking for something?)", hints:["Je voudrais un hoodie.", "C'est combien ?", "Merci, bonne journée !"] },
      { id:"free", title:"Just chat", who:"Dad asks about your day", open:"Salut ! Ça va ? Qu'est-ce que tu as fait aujourd'hui ? (Hi! How's it going? What did you do today?)", hints:["Ça va bien, merci.", "J'ai un test demain.", "Je suis fatigué."] },
    ],
  };

  const hi = {
    name: "Hindi", native: "हिन्दी", voice: "hi-IN", hello: "Namaste",
    lessons: [
      { id:"greet", title:"Hellos and goodbyes", tip:"Namaste works with everyone, any time of day. Fold your hands for bonus points.", p:[
        { t:"नमस्ते!", r:"Namaste!", e:"Hello!" },
        { t:"आप कैसे हैं?", r:"Aap kaise hain?", e:"How are you? (polite)" },
        { t:"मैं ठीक हूँ।", r:"Main theek hoon.", e:"I'm fine." },
        { t:"धन्यवाद!", r:"Dhanyavaad!", e:"Thank you!" },
        { t:"फिर मिलेंगे!", r:"Phir milenge!", e:"See you again!" } ] },
      { id:"me", title:"All about you", tip:"Guys say ka and rehta, girls say ki and rehti. Hindi verbs care who's talking.", p:[
        { t:"मेरा नाम सैम है।", r:"Mera naam Sam hai.", e:"My name is Sam." },
        { t:"आपका नाम क्या है?", r:"Aapka naam kya hai?", e:"What's your name?" },
        { t:"मैं पंद्रह साल का हूँ।", r:"Main pandrah saal ka hoon.", e:"I'm fifteen. (girls: ki)" },
        { t:"मैं टोरंटो में रहता हूँ।", r:"Main Toronto mein rehta hoon.", e:"I live in Toronto. (girls: rehti)" },
        { t:"आपसे मिलकर खुशी हुई।", r:"Aapse milkar khushi hui.", e:"Nice to meet you." } ] },
      { id:"polite", title:"Magic words", tip:"Add ji to be respectful: haan ji, nahin ji. Aunties love it.", p:[
        { t:"कृपया", r:"Kripya", e:"Please (formal)" },
        { t:"शुक्रिया!", r:"Shukriya!", e:"Thanks!" },
        { t:"कोई बात नहीं।", r:"Koi baat nahin.", e:"No problem. / It's okay." },
        { t:"माफ़ कीजिए।", r:"Maaf kijiye.", e:"Excuse me. / Sorry." },
        { t:"जी हाँ।", r:"Ji haan.", e:"Yes. (polite)" } ] },
      { id:"chai", title:"At the chai stall", tip:"\"Dijiye\" is the polite way to say give me. Say it and the chai tastes better. Science.", p:[
        { t:"एक चाय दीजिए।", r:"Ek chai dijiye.", e:"One chai, please." },
        { t:"दो समोसे भी।", r:"Do samose bhi.", e:"Two samosas too." },
        { t:"कितने पैसे हुए?", r:"Kitne paise hue?", e:"How much is it?" },
        { t:"बहुत स्वादिष्ट है!", r:"Bahut swaadisht hai!", e:"It's really tasty!" },
        { t:"चीनी कम, प्लीज़।", r:"Cheeni kam, please.", e:"Less sugar, please." } ] },
      { id:"school", title:"School survival", tip:"Kal means both yesterday and tomorrow. Hindi keeps you on your toes.", p:[
        { t:"कल मेरा टेस्ट है।", r:"Kal mera test hai.", e:"I have a test tomorrow." },
        { t:"मेरा पसंदीदा विषय गणित है।", r:"Mera pasandeeda vishay ganit hai.", e:"My favourite subject is math." },
        { t:"मुझे समझ नहीं आया।", r:"Mujhe samajh nahin aaya.", e:"I didn't understand." },
        { t:"फिर से बोलिए?", r:"Phir se boliye?", e:"Could you say it again?" },
        { t:"इसे हिंदी में क्या कहते हैं?", r:"Ise Hindi mein kya kehte hain?", e:"What's this called in Hindi?" } ] },
      { id:"around", title:"Getting around", tip:"Seedhe, baayein, daayein: that's every auto-rickshaw ride sorted.", p:[
        { t:"बाज़ार कहाँ है?", r:"Bazaar kahaan hai?", e:"Where is the market?" },
        { t:"बाएँ", r:"Baayein", e:"Left" },
        { t:"दाएँ", r:"Daayein", e:"Right" },
        { t:"सीधे", r:"Seedhe", e:"Straight ahead" },
        { t:"कितनी दूर है?", r:"Kitni door hai?", e:"How far is it?" } ] },
      { id:"feel", title:"How you feel", tip:"In Hindi hunger \"attaches\" to you: mujhe bhookh lagi hai. Very dramatic. Very accurate.", p:[
        { t:"मैं खुश हूँ।", r:"Main khush hoon.", e:"I'm happy." },
        { t:"मुझे नींद आ रही है।", r:"Mujhe neend aa rahi hai.", e:"I'm sleepy." },
        { t:"मुझे भूख लगी है।", r:"Mujhe bhookh lagi hai.", e:"I'm hungry." },
        { t:"मुझे प्यास लगी है।", r:"Mujhe pyaas lagi hai.", e:"I'm thirsty." },
        { t:"कोई टेंशन नहीं!", r:"Koi tension nahin!", e:"No worries!" } ] },
      { id:"fun", title:"Family and fun", tip:"Chalo means let's go, come on, or okay. One word, many jobs. Like dad.", p:[
        { t:"ये मेरे पापा हैं।", r:"Ye mere papa hain.", e:"This is my dad." },
        { t:"मुझे क्रिकेट खेलना पसंद है।", r:"Mujhe cricket khelna pasand hai.", e:"I like playing cricket." },
        { t:"चलो, गाना सुनते हैं!", r:"Chalo, gaana sunte hain!", e:"Come on, let's listen to a song!" },
        { t:"बहुत मज़ा आया!", r:"Bahut mazaa aaya!", e:"That was so much fun!" },
        { t:"वाह, कमाल है!", r:"Waah, kamaal hai!", e:"Wow, that's amazing!" } ] },
    ],
    scenes: [
      { id:"chai", title:"Chai stall", who:"Dad's the chaiwala", open:"नमस्ते! क्या लोगे? चाय, समोसा? (Namaste! Kya loge? Chai, samosa? = Hello! What'll you have? Chai, samosa?)", hints:["Ek chai dijiye.", "Do samose bhi.", "Kitne paise hue?"] },
      { id:"family", title:"Chatty uncle", who:"Dad's your uncle at a family visit", open:"अरे, कितने बड़े हो गए! पढ़ाई कैसी चल रही है? (Arre, kitne bade ho gaye! Padhai kaisi chal rahi hai? = Wow, look how big you've got! How's school going?)", hints:["Main theek hoon.", "Kal mera test hai.", "Mujhe cricket khelna pasand hai."] },
      { id:"auto", title:"Auto-rickshaw ride", who:"Dad's the driver", open:"हाँ जी, कहाँ जाना है? (Haan ji, kahaan jaana hai? = Yes, where do you need to go?)", hints:["Bazaar jaana hai.", "Kitne paise?", "Kitni door hai?"] },
      { id:"market", title:"Fruit market", who:"Dad's the fruit seller", open:"आइए, आइए! ताज़े आम हैं! क्या चाहिए? (Aaiye, aaiye! Taaze aam hain! Kya chahiye? = Come, come! Fresh mangoes! What do you need?)", hints:["Do aam dijiye.", "Kitne paise hue?", "Shukriya!"] },
      { id:"free", title:"Just chat", who:"Dad asks about your day", open:"नमस्ते! आज आपका दिन कैसा था? (Namaste! Aaj aapka din kaisa tha? = Hello! How was your day today?)", hints:["Main khush hoon.", "Mujhe neend aa rahi hai.", "Bahut mazaa aaya!"] },
    ],
  };

  window.LESSONS = { fr, hi };
})();
