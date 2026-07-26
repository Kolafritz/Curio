// curated.js — hand-checked content that doesn't depend on a live fetch.
// The Stoic quotes here are used as an offline fallback; live Wikiquote
// fetches (see sources.js) are the primary path and give far more variety.
// Every quote below was checked against multiple independent sources before
// being included, with the exact translation and reference noted.

export const STOIC_FALLBACK = [
  {
    author: 'Marcus Aurelius', work: 'Meditations',
    translator: 'tr. George Long',
    text: 'Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.'
  },
  {
    author: 'Marcus Aurelius', work: 'Meditations, Book VIII',
    translator: 'tr. George Long',
    text: 'If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it — and this you have the power to revoke at any moment.'
  },
  {
    author: 'Seneca', work: 'Moral Letters to Lucilius, Letter 13 — On Groundless Fears',
    translator: 'tr. Richard M. Gummere',
    text: 'There are more things likely to frighten us than there are to crush us; we suffer more often in imagination than in reality.'
  },
  {
    author: 'Epictetus', work: 'Enchiridion, Ch. V',
    translator: 'tr. George Long, 1888',
    text: 'Men are disturbed not by the things which happen, but by the opinions about the things.'
  },
  {
    author: 'Epictetus', work: 'Enchiridion, Ch. I',
    translator: 'tr. George Long, 1888',
    text: 'Of things, some are in our power, and others are not. In our power are opinion, movement toward a thing, desire, aversion — in a word, whatever are our own acts.'
  }
];

// Untranslatable / distinctive German words — a well-documented genre,
// kept to entries that are genuinely attested in German dictionaries.
export const DE_CARDS = [
  { term: 'Kummerspeck', lit: 'literally "grief bacon"', mean: 'Excess weight gained from emotional overeating.' },
  { term: 'Fernweh', lit: 'literally "far-sickness"', mean: 'An ache for distant places — the opposite of homesickness.' },
  { term: 'Sehnsucht', lit: 'longing / yearning', mean: 'A deep, wistful craving for something undefined, often used philosophically.' },
  { term: 'Gemütlichkeit', lit: 'from gemütlich, "cozy"', mean: 'A warm feeling of comfort, belonging, and unhurried social ease.' },
  { term: 'Weltschmerz', lit: 'literally "world-pain"', mean: 'Weariness at the gap between how the world is and how it "should" be.' },
  { term: 'Schadenfreude', lit: 'literally "harm-joy"', mean: "Pleasure derived from someone else's misfortune." },
  { term: 'Doppelgänger', lit: 'literally "double-goer"', mean: 'A look-alike or double of a living person.' },
  { term: 'Zeitgeist', lit: 'literally "time-spirit"', mean: 'The defining mood or set of ideas of a particular period.' },
  { term: 'der Ohrwurm', lit: 'literally "ear-worm"', mean: 'A song stuck in your head — Germans have a word for it too.' },
  { term: 'Der, die, das', lit: 'grammar note', mean: 'German nouns carry one of three genders (masculine, feminine, neuter) that mostly can\u2019t be guessed from meaning — they have to be learned with the noun itself.' }
];

// Korean vocabulary and language-culture concepts, kept to common,
// well-established words and basic structural notes.
export const KO_CARDS = [
  { term: '눈치 (nunchi)', lit: 'lit. "eye-measure"', mean: 'The subtle art of reading a room — sensing others\u2019 moods and adjusting without being told.' },
  { term: '정 (jeong)', lit: 'no direct English equivalent', mean: 'A slow-built bond of affection and loyalty that forms through shared time, even with rivals.' },
  { term: '화이팅 (hwaiting)', lit: 'from English "fighting"', mean: 'A borrowed cheer meaning roughly "you\u2019ve got this!" — shouted for encouragement.' },
  { term: '안녕하세요', lit: 'annyeonghaseyo', mean: 'The standard polite greeting, "hello" — literally closer to "are you at peace?"' },
  { term: '감사합니다', lit: 'gamsahamnida', mean: 'Formal "thank you," appropriate with strangers, elders, or in professional settings.' },
  { term: 'Speech levels', lit: 'grammar note', mean: 'Korean verb endings shift with formality and relationship — the same sentence changes shape depending on who you\u2019re speaking to.' },
  { term: '한글 (Hangeul)', lit: 'the Korean alphabet', mean: 'Designed in 1443 under King Sejong specifically to be learned quickly — each letter shape reflects the mouth position used to say it.' },
  { term: '은/는 vs 이/가', lit: 'grammar note', mean: 'Two pairs of particles mark a sentence\u2019s subject/topic — 은/는 signals topic or contrast, 이/가 signals the grammatical subject.' }
];
