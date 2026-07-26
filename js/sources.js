// sources.js — pulls live content from free, keyless public APIs and
// normalizes everything into one card shape:
//
// { id, topicId, mode: 'flip'|'direct', title, teaser, body,
//   image, sourceLabel, sourceUrl, meta }

import { TOPIC_MAP } from './topics.js';
import { STOIC_FALLBACK, DE_CARDS, KO_CARDS } from './curated.js';

const SEEN_KEY = 'curio_seen_v1';
const SEEN_CAP = 600;

function loadSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveSeen(set) {
  const arr = [...set];
  const trimmed = arr.length > SEEN_CAP ? arr.slice(arr.length - SEEN_CAP) : arr;
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed)); } catch {}
}
let seen = loadSeen();
function markSeen(key) { seen.add(key); saveSeen(seen); }
function isSeen(key) { return seen.has(key); }

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

async function safeJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('bad response ' + res.status);
  return res.json();
}

// ---------- Wikipedia ----------

async function wikiSearchTitles(term, lang = 'en', limit = 6) {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=${limit}&format=json&origin=*`;
  const data = await safeJson(url);
  return (data.query?.search || []).map(r => r.title);
}

async function wikiSummary(title, lang = 'en') {
  const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const data = await safeJson(url);
  if (!data.extract || data.type === 'disambiguation') return null;
  return data;
}

export async function fetchWikiCard(topic) {
  const term = pick(topic.seeds);
  const titles = await wikiSearchTitles(term);
  const fresh = titles.filter(t => !isSeen('wiki:' + t));
  const title = pick(fresh.length ? fresh : titles);
  if (!title) return null;
  const summary = await wikiSummary(title);
  if (!summary) return null;
  markSeen('wiki:' + title);

  const sentences = summary.extract.split(/(?<=[.!?])\s+/);
  const teaser = sentences.slice(0, 1).join(' ');
  const body = summary.extract;

  return {
    id: uid(),
    topicId: topic.id,
    mode: 'direct',
    title: summary.title,
    teaser,
    body,
    image: summary.thumbnail?.source || null,
    sourceLabel: 'Wikipedia',
    sourceUrl: summary.content_urls?.desktop?.page || null,
    meta: summary.description || ''
  };
}

// ---------- On This Day (history fun facts) ----------

export async function fetchOnThisDayCard(topic) {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`;
  const data = await safeJson(url);
  const events = data.events || [];
  const fresh = events.filter(e => !isSeen('otd:' + e.year + e.text.slice(0, 20)));
  const ev = pick(fresh.length ? fresh : events);
  if (!ev) return null;
  markSeen('otd:' + ev.year + ev.text.slice(0, 20));

  const page = ev.pages?.[0];
  return {
    id: uid(),
    topicId: topic.id,
    mode: 'flip',
    title: `On this day, ${ev.year}`,
    teaser: page?.titles?.normalized || 'Tap to reveal what happened',
    body: ev.text,
    image: page?.thumbnail?.source || null,
    sourceLabel: 'Wikipedia — On This Day',
    sourceUrl: page?.content_urls?.desktop?.page || null,
    meta: ''
  };
}

// ---------- Wikiquote (Stoicism) ----------

async function wikiquoteQuotes(page) {
  const url = `https://en.wikiquote.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&format=json&prop=text&origin=*`;
  const data = await safeJson(url);
  const html = data.parse?.text?.['*'];
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const items = [...doc.querySelectorAll('li')]
    .map(li => li.textContent.trim())
    .filter(t => t.length > 20 && t.length < 320 && !t.startsWith('↑'));
  return items;
}

export async function fetchStoicCard(topic) {
  try {
    const page = pick(topic.wikiquotePages);
    const quotes = await wikiquoteQuotes(page);
    const fresh = quotes.filter(q => !isSeen('wq:' + q.slice(0, 30)));
    const quote = pick(fresh.length ? fresh : quotes);
    if (!quote) throw new Error('no quotes found');
    markSeen('wq:' + quote.slice(0, 30));
    return {
      id: uid(),
      topicId: topic.id,
      mode: 'flip',
      title: page,
      teaser: 'Tap to reveal',
      body: quote,
      image: null,
      sourceLabel: 'Wikiquote — ' + page,
      sourceUrl: `https://en.wikiquote.org/wiki/${encodeURIComponent(page)}`,
      meta: ''
    };
  } catch {
    const q = pick(STOIC_FALLBACK);
    return {
      id: uid(),
      topicId: topic.id,
      mode: 'flip',
      title: q.author,
      teaser: 'Tap to reveal',
      body: q.text,
      image: null,
      sourceLabel: `${q.work}, ${q.translator}`,
      sourceUrl: null,
      meta: ''
    };
  }
}

// ---------- Semantic Scholar (research angle) ----------

async function semanticScholarCard(topic) {
  const term = pick(topic.researchTerms);
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(term)}&fields=title,abstract,year,authors,url&limit=8`;
  const data = await safeJson(url);
  const papers = (data.data || []).filter(p => p.abstract && p.abstract.length > 80);
  const fresh = papers.filter(p => !isSeen('ss:' + p.paperId));
  const paper = pick(fresh.length ? fresh : papers);
  if (!paper) return null;
  markSeen('ss:' + paper.paperId);

  const authors = (paper.authors || []).slice(0, 3).map(a => a.name).join(', ');
  const abstract = paper.abstract.length > 500 ? paper.abstract.slice(0, 500) + '…' : paper.abstract;

  return {
    id: uid(),
    topicId: topic.id,
    mode: 'direct',
    title: paper.title,
    teaser: abstract.split(/(?<=[.!?])\s+/)[0],
    body: abstract,
    image: null,
    sourceLabel: 'Semantic Scholar research',
    sourceUrl: paper.url || null,
    meta: `${authors}${paper.year ? ' · ' + paper.year : ''}`
  };
}

export async function fetchResearchCard(topic) {
  // Mostly grounded concept explainers, occasionally a real recent paper.
  const useResearch = Math.random() < 0.35;
  if (useResearch) {
    try {
      const card = await semanticScholarCard(topic);
      if (card) return card;
    } catch { /* fall through to Wikipedia */ }
  }
  return fetchWikiCard(topic);
}

// ---------- Curated vocab (German / Korean) ----------

function vocabCard(topic, list) {
  const fresh = list.filter((_, i) => !isSeen(`vocab:${topic.id}:${i}`));
  const pool = fresh.length ? fresh : list;
  const idx = list.indexOf(pick(pool));
  markSeen(`vocab:${topic.id}:${idx}`);
  const item = list[idx];
  return {
    id: uid(),
    topicId: topic.id,
    mode: 'flip',
    title: item.term,
    teaser: item.lit,
    body: item.mean,
    image: null,
    sourceLabel: topic.label,
    sourceUrl: null,
    meta: ''
  };
}

export async function fetchVocabCard(topic) {
  if (topic.id === 'german') return vocabCard(topic, DE_CARDS);
  if (topic.id === 'korean') return vocabCard(topic, KO_CARDS);
  return fetchWikiCard(topic);
}

// ---------- Dispatcher ----------

export async function fetchCardForTopic(topicId) {
  const topic = TOPIC_MAP[topicId];
  if (!topic) return null;
  try {
    switch (topic.kind) {
      case 'onthisday': return (await fetchOnThisDayCard(topic)) || (await fetchWikiCard(topic));
      case 'stoic-quote': return await fetchStoicCard(topic);
      case 'mixed-research': return (await fetchResearchCard(topic)) || null;
      case 'vocab-de':
      case 'vocab-ko': return await fetchVocabCard(topic);
      default: return await fetchWikiCard(topic);
    }
  } catch (err) {
    console.warn('fetchCardForTopic failed for', topicId, err);
    return null;
  }
}
