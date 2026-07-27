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

// Wikipedia/Commons thumbnail URLs embed their width, e.g. ".../320px-Foo.jpg" —
// request a larger rendition of the same source image for a crisper display.
function upsizeThumbnail(url, width = 640) {
  if (!url) return null;
  return url.replace(/\/(\d+)px-/, `/${width}px-`);
}

// Fallback image source for cards whose primary API has no photo of its own
// (quotes, vocab, research abstracts) or whose Wikipedia article lacks a
// thumbnail — searches Wikimedia Commons, which is free, keyless, and CORS-enabled.
async function fetchCommonsImage(query) {
  if (!query) return null;
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`;
    const data = await safeJson(url);
    const pages = Object.values(data.query?.pages || {});
    // Commons renders a .jpg/.png *preview* even for PDFs, SVGs, DjVu scans, etc.,
    // so the thumbnail URL's extension isn't a reliable signal — check the source
    // file's own title instead (e.g. "File:Foo.jpg" vs "File:Old_Book_Scan.pdf").
    const photos = pages
      .filter(p => p.title && /\.(jpe?g|png)$/i.test(p.title) && p.imageinfo?.[0]?.thumburl)
      .map(p => p.imageinfo[0].thumburl);
    if (!photos.length) return null;
    return pick(photos);
  } catch {
    return null;
  }
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

  const image = upsizeThumbnail(summary.thumbnail?.source) || await fetchCommonsImage(summary.title);

  return {
    id: uid(),
    topicId: topic.id,
    mode: 'direct',
    title: summary.title,
    teaser,
    body,
    image,
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
  const image = upsizeThumbnail(page?.thumbnail?.source) || await fetchCommonsImage(page?.titles?.normalized);
  return {
    id: uid(),
    topicId: topic.id,
    mode: 'flip',
    title: `On this day, ${ev.year}`,
    teaser: page?.titles?.normalized || 'Tap to reveal what happened',
    body: ev.text,
    image,
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
      image: await fetchCommonsImage(page),
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
      image: await fetchCommonsImage(q.author),
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
    image: await fetchCommonsImage(term),
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

// ---------- Internet Archive (public-domain texts, any topic) ----------

function normalizeArchiveDescription(desc) {
  if (Array.isArray(desc)) return desc.join(' ');
  return desc || '';
}

export async function fetchArchiveCard(topic) {
  const term = pick(topic.seeds);
  const params = new URLSearchParams();
  // Restricted to title/subject rather than full-text — an unrestricted query
  // matches incidental OCR mentions buried in unrelated scanned documents.
  params.set('q', `(title:(${term}) OR subject:(${term})) AND mediatype:texts`);
  params.append('fl[]', 'identifier');
  params.append('fl[]', 'title');
  params.append('fl[]', 'description');
  params.append('fl[]', 'creator');
  params.append('sort[]', 'downloads desc');
  params.set('rows', '10');
  params.set('output', 'json');
  const url = `https://archive.org/advancedsearch.php?${params.toString()}`;

  const data = await safeJson(url);
  const docs = (data.response?.docs || [])
    .map(d => ({ ...d, description: normalizeArchiveDescription(d.description) }))
    .filter(d => d.identifier && d.title && d.description.length > 60);
  const fresh = docs.filter(d => !isSeen('ia:' + d.identifier));
  const doc = pick(fresh.length ? fresh : docs);
  if (!doc) return null;
  markSeen('ia:' + doc.identifier);

  const body = doc.description.length > 500 ? doc.description.slice(0, 500) + '…' : doc.description;
  const creator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator;

  return {
    id: uid(),
    topicId: topic.id,
    mode: 'direct',
    title: doc.title,
    teaser: body.split(/(?<=[.!?])\s+/)[0],
    body,
    image: `https://archive.org/services/img/${doc.identifier}`,
    sourceLabel: 'Internet Archive' + (creator ? ' — ' + creator : ''),
    sourceUrl: `https://archive.org/details/${doc.identifier}`,
    meta: ''
  };
}

// ---------- PubMed (nutrition/health research) ----------

async function pubmedSearchIds(term, limit = 8) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=${limit}&sort=relevance`;
  const data = await safeJson(url);
  return data.esearchresult?.idlist || [];
}

async function pubmedFetchArticle(id) {
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${id}&rettype=abstract&retmode=xml`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('bad response ' + res.status);
  const xmlText = await res.text();
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const article = doc.querySelector('PubmedArticle');
  if (!article) return null;

  const title = article.querySelector('ArticleTitle')?.textContent?.trim();
  const abstract = [...article.querySelectorAll('AbstractText')].map(n => n.textContent.trim()).join(' ');
  if (!title || !abstract) return null;

  const year = article.querySelector('PubDate Year')?.textContent
    || article.querySelector('PubDate MedlineDate')?.textContent?.slice(0, 4) || '';
  const journal = article.querySelector('Journal Title')?.textContent || '';
  const authors = [...article.querySelectorAll('Author')].slice(0, 3)
    .map(a => a.querySelector('LastName')?.textContent).filter(Boolean).join(', ');

  return { pmid: article.querySelector('PMID')?.textContent, title, abstract, year, journal, authors };
}

async function pubmedCard(topic) {
  const term = pick(topic.researchTerms);
  const ids = await pubmedSearchIds(term);
  const fresh = ids.filter(id => !isSeen('pm:' + id));
  const tryIds = (fresh.length ? fresh : ids).slice(0, 5);

  for (const id of tryIds) {
    try {
      const art = await pubmedFetchArticle(id);
      if (!art || art.abstract.length < 80) continue;
      markSeen('pm:' + id);
      const abstract = art.abstract.length > 500 ? art.abstract.slice(0, 500) + '…' : art.abstract;
      return {
        id: uid(),
        topicId: topic.id,
        mode: 'direct',
        title: art.title,
        teaser: abstract.split(/(?<=[.!?])\s+/)[0],
        body: abstract,
        image: await fetchCommonsImage(term),
        sourceLabel: 'PubMed' + (art.journal ? ' — ' + art.journal : ''),
        sourceUrl: art.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${art.pmid}/` : null,
        meta: `${art.authors}${art.year ? ' · ' + art.year : ''}`
      };
    } catch { /* try the next candidate id */ }
  }
  return null;
}

export async function fetchNutritionCard(topic) {
  // Mostly grounded concept explainers, occasionally a real peer-reviewed abstract.
  const useResearch = Math.random() < 0.35;
  if (useResearch) {
    try {
      const card = await pubmedCard(topic);
      if (card) return card;
    } catch { /* fall through to Wikipedia */ }
  }
  return fetchWikiCard(topic);
}

// ---------- Curated vocab (German / Korean) ----------

async function vocabCard(topic, list) {
  const fresh = list.filter((_, i) => !isSeen(`vocab:${topic.id}:${i}`));
  const pool = fresh.length ? fresh : list;
  const idx = list.indexOf(pick(pool));
  markSeen(`vocab:${topic.id}:${idx}`);
  const item = list[idx];
  const image = (await fetchCommonsImage(item.term)) || (await fetchCommonsImage(topic.label));
  return {
    id: uid(),
    topicId: topic.id,
    mode: 'flip',
    title: item.term,
    teaser: item.lit,
    body: item.mean,
    image,
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
    // Internet Archive covers every topic (public-domain books, old photos,
    // historical documents) — occasionally try it before the topic's own kind.
    if (Math.random() < 0.15) {
      const archiveCard = await fetchArchiveCard(topic);
      if (archiveCard) return archiveCard;
    }
    switch (topic.kind) {
      case 'onthisday': return (await fetchOnThisDayCard(topic)) || (await fetchWikiCard(topic));
      case 'stoic-quote': return await fetchStoicCard(topic);
      case 'mixed-research': return (await fetchResearchCard(topic)) || null;
      case 'mixed-nutrition': return (await fetchNutritionCard(topic)) || null;
      case 'vocab-de':
      case 'vocab-ko': return await fetchVocabCard(topic);
      default: return await fetchWikiCard(topic);
    }
  } catch (err) {
    console.warn('fetchCardForTopic failed for', topicId, err);
    return null;
  }
}
