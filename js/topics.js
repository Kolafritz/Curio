// topics.js — the subject index for Curio.
// Each topic is a "drawer" in the cabinet: an id, a label, an ink color,
// a glyph, and the seed material used to pull real content for it.

export const TOPICS = [
  {
    id: 'philosophy',
    label: 'Practical Philosophy',
    short: 'Philosophy',
    ink: '#8B5E34',
    glyph: '◈',
    kind: 'wiki',
    seeds: ['Stoicism', 'Virtue ethics', 'Practical wisdom', 'Socratic method',
      'Existentialism', 'Meaning of life', 'Memento mori', 'Amor fati',
      'Taoism', 'Confucianism', 'Pragmatism (philosophy)', 'Phronesis']
  },
  {
    id: 'stoicism',
    label: 'Stoicism',
    short: 'Stoicism',
    ink: '#6B4226',
    glyph: '⚖',
    kind: 'stoic-quote',
    wikiquotePages: ['Marcus Aurelius', 'Seneca the Younger', 'Epictetus'],
    seeds: ['Meditations (Marcus Aurelius)', 'Epictetus', 'Seneca the Younger',
      'Enchiridion of Epictetus', 'Zeno of Citium', 'Chrysippus', 'Stoicism']
  },
  {
    id: 'epicureanism',
    label: 'Hedonism & Epicureanism',
    short: 'Epicureanism',
    ink: '#B5623B',
    glyph: '❦',
    kind: 'wiki',
    seeds: ['Epicurus', 'Epicureanism', 'Hedonism', 'Ataraxia',
      'Lucretius', 'De rerum natura', 'Cyrenaics', 'Garden of Epicurus']
  },
  {
    id: 'euro-history',
    label: 'European History',
    short: 'Euro History',
    ink: '#3E5C76',
    glyph: '⚜',
    kind: 'wiki',
    seeds: ['Renaissance', 'French Revolution', 'Roman Empire', 'Byzantine Empire',
      'Napoleonic Wars', 'Age of Enlightenment', 'Viking Age', 'Holy Roman Empire',
      'Reformation', 'Industrial Revolution', 'Peace of Westphalia', 'Habsburg monarchy']
  },
  {
    id: 'asia-history',
    label: 'Chinese, Japanese & Korean History',
    short: 'East Asian History',
    ink: '#2F6B5E',
    glyph: '卍',
    kind: 'wiki',
    seeds: ['Tang dynasty', 'Joseon', 'Sengoku period', 'Ming dynasty', 'Qing dynasty',
      'Heian period', 'Genghis Khan', 'Samurai', 'Goryeo', 'Meiji Restoration',
      'Three Kingdoms of Korea', 'Edo period', 'Silk Road']
  },
  {
    id: 'history-facts',
    label: 'History Fun Facts',
    short: 'Fun Facts',
    ink: '#46586B',
    glyph: '✦',
    kind: 'onthisday',
    seeds: ['List of common misconceptions about history', 'Ancient Rome',
      'Etymology', 'Unusual historical events']
  },
  {
    id: 'medieval',
    label: 'Medieval Life, Food & Medicine',
    short: 'Medieval Life',
    ink: '#7A6A4F',
    glyph: '☙',
    kind: 'wiki',
    seeds: ['Medieval medicine', 'Medieval cuisine', 'Trial by ordeal',
      'Medieval hygiene', 'Black Death', 'Guild', 'Sumptuary law', 'Bloodletting',
      'Leech therapy', 'Medieval clothing', 'Feudalism', 'Plague doctor',
      'Medieval agriculture', 'Miracle play']
  },
  {
    id: 'mindset',
    label: 'Mindset & Self-Improvement',
    short: 'Mindset',
    ink: '#4F7C6E',
    glyph: '↟',
    kind: 'wiki',
    seeds: ['Growth mindset', 'Self-efficacy', 'Grit (personality trait)',
      'Delayed gratification', 'Locus of control', 'Neuroplasticity',
      'Resilience (psychology)', 'Flow (psychology)', 'Habit']
  },
  {
    id: 'finance',
    label: 'Personal Finance',
    short: 'Finance',
    ink: '#55693D',
    glyph: '⟠',
    kind: 'wiki',
    seeds: ['Compound interest', 'Index fund', 'Emergency fund', 'Diversification (finance)',
      'Inflation', 'Dollar cost averaging', 'Financial literacy', 'Debt',
      'Behavioral economics', 'Opportunity cost']
  },
  {
    id: 'psychology',
    label: 'Human Behaviour & Psychology',
    short: 'Psychology',
    ink: '#6B3F5C',
    glyph: '☍',
    kind: 'mixed-research',
    seeds: ['Cognitive bias', 'Confirmation bias', 'Attachment theory',
      'Dunning–Kruger effect', 'Decision-making', 'Emotional regulation',
      'Theory of mind', 'Prospect theory', 'Social psychology'],
    researchTerms: ['cognitive bias decision making', 'emotion regulation psychology',
      'social psychology behavior', 'habit formation psychology']
  },
  {
    id: 'marketing',
    label: 'Consumer Psychology & Marketing',
    short: 'Marketing',
    ink: '#8A4A6B',
    glyph: '❖',
    kind: 'mixed-research',
    seeds: ['Consumer behaviour', 'Nudge theory', 'Social proof', 'Scarcity (social psychology)',
      'Anchoring (cognitive bias)', 'Brand loyalty', 'Loss aversion', 'Persuasion',
      'Price discrimination', 'Advertising'],
    researchTerms: ['consumer psychology marketing', 'pricing anchoring effect',
      'social proof persuasion advertising', 'brand loyalty consumer behavior']
  },
  {
    id: 'fitness',
    label: 'Fitness, Exercise & Bodybuilding',
    short: 'Fitness',
    ink: '#8C3B3B',
    glyph: '⚔',
    kind: 'mixed-research',
    seeds: ['Progressive overload', 'Hypertrophy', 'Strength training', 'Resistance training',
      'VO2 max', 'Creatine', 'Delayed onset muscle soreness', 'Bodybuilding',
      'Periodization', 'Muscle protein synthesis'],
    researchTerms: ['resistance training muscle hypertrophy', 'progressive overload strength',
      'creatine supplementation exercise', 'exercise recovery muscle soreness']
  },
  {
    id: 'nutrition',
    label: 'Nutrition & Flexible Dieting',
    short: 'Nutrition',
    ink: '#6B8E4E',
    glyph: '⚗',
    kind: 'mixed-nutrition',
    seeds: ['Flexible dieting', 'If It Fits Your Macros', 'Nutrient timing', 'Macronutrient',
      'Caloric deficit', 'Protein (nutrient)', 'Dietary fiber', 'Sports nutrition',
      'Diet quality', 'Intuitive eating', 'Meal frequency', 'Micronutrient'],
    researchTerms: ['flexible dieting adherence', 'protein intake body composition',
      'nutrient timing exercise performance', 'caloric restriction weight loss',
      'diet adherence long term outcomes']
  },
  {
    id: 'tennis',
    label: 'Improving Your Tennis Game',
    short: 'Tennis',
    ink: '#3F7A46',
    glyph: '◐',
    kind: 'wiki',
    seeds: ['Tennis', 'Serve (tennis)', 'Topspin', 'Tennis grip', 'History of tennis',
      'One-handed backhand', 'Tennis elbow', 'Tennis strategy', 'Wimbledon Championships',
      'Kick serve']
  },
  {
    id: 'german',
    label: 'German',
    short: 'German',
    ink: '#A67C1E',
    glyph: 'ß',
    kind: 'vocab-de',
    seeds: ['German grammar', 'German language']
  },
  {
    id: 'korean',
    label: 'Korean',
    short: 'Korean',
    ink: '#A34A4A',
    glyph: '한',
    kind: 'vocab-ko',
    seeds: ['Korean language', 'Hangul', 'Korean honorifics']
  },
  {
    id: 'beer',
    label: 'Beer',
    short: 'Beer',
    ink: '#C08A2E',
    glyph: '☗',
    kind: 'mixed-research',
    seeds: ['History of beer', 'Ancient Egyptian brewing', 'Beer in Mesopotamia', 'Sumerian beer',
      'Medieval brewing', 'Trappist beer', 'Reinheitsgebot', 'Craft beer movement', 'Homebrewing',
      'Beer style', 'India pale ale', 'Lager', 'Sour beer', 'Hops', 'Brewing', 'Barley malt',
      'Beer tasting'],
    researchTerms: ['brewing fermentation science', 'hop chemistry beer flavor',
      'yeast fermentation beer', 'beer sensory analysis tasting']
  },
  {
    id: 'honey',
    label: 'Honey',
    short: 'Honey',
    ink: '#CBA135',
    glyph: '⬡',
    kind: 'mixed-research',
    seeds: ['History of beekeeping', 'Ancient Egyptian apiculture', 'Mead', 'Tej (drink)',
      'Beekeeping', 'Urban beekeeping', 'Honey bee', 'Honeycomb', 'Apiary', 'Manuka honey',
      'Varietal honey', 'Honey tasting', 'Pollination', 'Queen bee', 'Royal jelly'],
    researchTerms: ['honey bee foraging behavior', 'honey antimicrobial properties',
      'honey botanical origin authentication', 'beekeeping colony health']
  }
];

export const TOPIC_MAP = Object.fromEntries(TOPICS.map(t => [t.id, t]));

// ----- custom topics: user-added subjects, no code changes needed -----
// Stored separately from the built-ins above and merged into TOPICS/TOPIC_MAP
// at load time, so feed.js and sources.js (which only know about wiki-kind
// topics) treat them identically to any built-in Wikipedia topic.

const CUSTOM_KEY = 'curio_custom_topics_v1';
const CUSTOM_INKS = ['#4B6584', '#5C4B84', '#84644B', '#4B8471', '#844B6D', '#6D844B', '#4B6E84', '#7A4B84'];

function loadCustomTopics() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); }
  catch { return []; }
}
function saveCustomTopics() {
  try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(TOPICS.filter(t => t.custom))); } catch {}
}
function registerTopic(topic) {
  TOPICS.push(topic);
  TOPIC_MAP[topic.id] = topic;
}
function slugify(name) {
  return 'custom-' + (name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'topic');
}

for (const t of loadCustomTopics()) registerTopic(t);

export function addCustomTopic(name, seedsInput) {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  let id = slugify(trimmed);
  if (TOPIC_MAP[id]) id += '-' + Date.now().toString(36);
  const seeds = (seedsInput || '').split(',').map(s => s.trim()).filter(Boolean);
  const customCount = TOPICS.filter(t => t.custom).length;
  const topic = {
    id,
    label: trimmed,
    short: trimmed.length > 16 ? trimmed.slice(0, 15) + '…' : trimmed,
    ink: CUSTOM_INKS[customCount % CUSTOM_INKS.length],
    glyph: trimmed[0].toUpperCase(),
    kind: 'wiki',
    seeds: seeds.length ? seeds : [trimmed],
    custom: true
  };
  registerTopic(topic);
  saveCustomTopics();
  return topic;
}

export function removeCustomTopic(id) {
  const idx = TOPICS.findIndex(t => t.id === id && t.custom);
  if (idx === -1) return false;
  TOPICS.splice(idx, 1);
  delete TOPIC_MAP[id];
  saveCustomTopics();
  return true;
}
