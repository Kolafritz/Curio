// feed.js — turns fetched card data into the scrollable index-card feed.

import { TOPIC_MAP } from './topics.js';
import { fetchCardForTopic } from './sources.js';

const PINNED_KEY = 'curio_pinned_v1';
const EDITION_KEY = 'curio_edition_v1';
const BATCH_SIZE = 4;
const PREFETCH_THRESHOLD = 3; // start loading more when this many cards from the end

let feedEl, sentinelObserver;
let topicBag = [];
let activeTopics = [];
let loading = false;
let showToast = () => {};

export function initFeed({ feedElement, toastFn }) {
  feedEl = feedElement;
  showToast = toastFn || showToast;
}

function refillBag() {
  topicBag = [...activeTopics];
  for (let i = topicBag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topicBag[i], topicBag[j]] = [topicBag[j], topicBag[i]];
  }
}
function nextTopic() {
  if (!topicBag.length) refillBag();
  return topicBag.pop();
}

function getPinned() {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '{}'); }
  catch { return {}; }
}
function setPinned(obj) {
  try { localStorage.setItem(PINNED_KEY, JSON.stringify(obj)); } catch {}
}
function isPinned(id) { return !!getPinned()[id]; }
function togglePinned(card) {
  const all = getPinned();
  if (all[card.id]) { delete all[card.id]; }
  else { all[card.id] = card; }
  setPinned(all);
  return !!all[card.id];
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function buildMedia(card, topic) {
  const media = el('div', 'media');
  if (card.image) {
    const img = el('img');
    img.src = card.image;
    img.loading = 'lazy';
    img.alt = card.title;
    media.appendChild(img);
    media.appendChild(el('div', 'scrim'));
  } else {
    const plate = el('div', 'plate');
    plate.style.setProperty('--ink', topic.ink);
    plate.appendChild(el('div', 'glyph', topic.glyph));
    media.appendChild(plate);
  }
  const chip = el('div', 'topic-chip');
  const dot = el('span', 'dot');
  dot.style.background = topic.ink;
  chip.appendChild(dot);
  chip.appendChild(document.createTextNode(topic.short));
  media.appendChild(chip);
  return media;
}

function buildActions(card, faceEl) {
  const actions = el('div', 'actions');

  const save = el('button', 'action');
  save.type = 'button';
  save.textContent = isPinned(card.id) ? '★ Saved' : '☆ Save';
  if (isPinned(card.id)) save.classList.add('saved');
  save.style.setProperty('--ink', TOPIC_MAP[card.topicId]?.ink || '#fff');
  save.addEventListener('click', (e) => {
    e.stopPropagation();
    const nowPinned = togglePinned(card);
    save.textContent = nowPinned ? '★ Saved' : '☆ Save';
    save.classList.toggle('saved', nowPinned);
    showToast(nowPinned ? 'Saved for offline reading' : 'Removed from saved');
  });
  actions.appendChild(save);

  const share = el('button', 'action');
  share.type = 'button';
  share.textContent = '↗ Share';
  share.addEventListener('click', async (e) => {
    e.stopPropagation();
    const shareText = `${card.title} — ${card.teaser}`;
    if (navigator.share) {
      try { await navigator.share({ title: card.title, text: shareText, url: card.sourceUrl || undefined }); }
      catch {}
    } else {
      try {
        await navigator.clipboard.writeText(card.sourceUrl || shareText);
        showToast('Copied to clipboard');
      } catch { showToast('Could not copy'); }
    }
  });
  actions.appendChild(share);

  if (card.sourceUrl) {
    const src = document.createElement('a');
    src.className = 'source-link';
    src.href = card.sourceUrl;
    src.target = '_blank';
    src.rel = 'noopener noreferrer';
    src.textContent = card.sourceLabel + ' ↗';
    src.addEventListener('click', (e) => e.stopPropagation());
    actions.appendChild(src);
  } else if (card.sourceLabel) {
    actions.appendChild(el('span', 'source-link', card.sourceLabel));
  }

  faceEl.appendChild(actions);
}

function buildDirectCard(card, topic) {
  const wrap = el('div', 'card');
  wrap.dataset.topic = topic.id;

  const tab = el('div', 'tab', `${topic.glyph} ${topic.short}`);
  tab.style.background = topic.ink;
  wrap.appendChild(tab);

  const inner = el('div', 'card-inner');
  const face = el('div', 'face front');
  face.appendChild(buildMedia(card, topic));

  const panel = el('div', 'panel');
  panel.appendChild(el('div', 'title', card.title));
  const body = el('p', 'body-text', card.body);
  panel.appendChild(body);
  if (card.meta) panel.appendChild(el('div', 'meta-line', card.meta));
  face.appendChild(panel);
  buildActions(card, panel);

  inner.appendChild(face);
  wrap.appendChild(inner);
  return wrap;
}

function buildFlipCard(card, topic) {
  const wrap = el('div', 'card');
  wrap.dataset.topic = topic.id;

  const tab = el('div', 'tab', `${topic.glyph} ${topic.short}`);
  tab.style.background = topic.ink;
  wrap.appendChild(tab);

  const inner = el('div', 'card-inner');

  // front — the "cover"
  const front = el('div', 'face front flip-mode');
  front.appendChild(buildMedia(card, topic));
  const frontPanel = el('div', 'panel');
  frontPanel.appendChild(el('div', 'title', card.title));
  frontPanel.appendChild(el('p', 'teaser', card.teaser));
  frontPanel.appendChild(el('div', 'flip-hint', 'Tap to reveal'));
  front.appendChild(frontPanel);
  inner.appendChild(front);

  // back — the note
  const back = el('div', 'face back');
  back.style.background = `linear-gradient(165deg, ${topic.ink}22, var(--surface) 55%)`;
  const backPanel = el('div', 'panel');
  backPanel.style.justifyContent = 'center';
  backPanel.appendChild(el('div', 'meta-line', card.sourceLabel));
  const quote = el('p', 'body-text', card.body);
  quote.style.fontFamily = 'var(--font-display)';
  quote.style.fontSize = '1.2rem';
  quote.style.lineHeight = '1.5';
  backPanel.appendChild(quote);
  if (card.meta) backPanel.appendChild(el('div', 'meta-line', card.meta));
  back.appendChild(backPanel);
  buildActions(card, backPanel);
  inner.appendChild(back);

  wrap.appendChild(inner);

  wrap.addEventListener('click', (e) => {
    if (e.target.closest('.actions')) return;
    wrap.classList.toggle('flipped');
  });

  return wrap;
}

function renderCard(card) {
  const topic = TOPIC_MAP[card.topicId];
  if (!topic) return null;
  return card.mode === 'flip' ? buildFlipCard(card, topic) : buildDirectCard(card, topic);
}

// ----- Today's Edition: one fixed batch per calendar day, cached -----

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadStoredEdition() {
  try {
    const raw = JSON.parse(localStorage.getItem(EDITION_KEY) || 'null');
    if (raw && raw.date === todayStr() && Array.isArray(raw.cards) && raw.cards.length) return raw.cards;
  } catch {}
  return null;
}
function saveEdition(cards) {
  try { localStorage.setItem(EDITION_KEY, JSON.stringify({ date: todayStr(), cards })); } catch {}
}

function buildEditionHeader(count) {
  const header = el('div', 'edition-header');
  const dateStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .format(new Date()).toUpperCase();
  header.appendChild(el('div', 'edition-eyebrow', "Today's Edition"));
  header.appendChild(el('div', 'edition-date', dateStr));
  header.appendChild(el('div', 'edition-sub', `${count} fresh picks from your topics, held for today`));
  const hint = el('div', 'edition-scroll-hint');
  hint.appendChild(el('span', null, '↓'));
  hint.appendChild(el('span', null, 'scroll'));
  header.appendChild(hint);
  return header;
}

function buildDivider() {
  const wrap = el('div', 'card divider-card');
  const inner = el('div', 'divider-inner');
  inner.appendChild(el('div', 'divider-rule'));
  inner.appendChild(el('div', 'divider-text', 'Keep exploring'));
  inner.appendChild(el('div', 'divider-sub', 'Endless, live, and never quite the same twice'));
  wrap.appendChild(inner);
  return wrap;
}

async function renderTodaysEdition(topicIds) {
  let cards = loadStoredEdition();
  if (!cards) {
    const results = await Promise.allSettled(topicIds.map(fetchCardForTopic));
    cards = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
    if (cards.length) saveEdition(cards);
  }
  if (!cards.length) return; // nothing reachable right now — infinite section will still try

  feedEl.appendChild(buildEditionHeader(cards.length));
  for (const card of cards) {
    const node = renderCard(card);
    if (node) feedEl.appendChild(node);
  }
  feedEl.appendChild(buildDivider());
}

function ensureSentinel() {
  let s = feedEl.querySelector('.sentinel');
  if (!s) {
    s = document.createElement('div');
    s.className = 'sentinel';
    s.style.height = '1px';
  }
  feedEl.appendChild(s);
  return s;
}

export async function loadMore(count = BATCH_SIZE) {
  if (loading || !activeTopics.length) return;
  loading = true;
  const skeleton = el('div', 'skeleton', 'Gathering more…');
  feedEl.appendChild(skeleton);

  const topics = Array.from({ length: count }, () => nextTopic());
  const results = await Promise.allSettled(topics.map(fetchCardForTopic));
  skeleton.remove();

  let added = 0;
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      const node = renderCard(r.value);
      if (node) { feedEl.appendChild(node); added++; }
    }
  }
  ensureSentinel();
  if (added === 0) {
    showToast('Trouble reaching sources — check your connection');
  }
  loading = false;
}

export async function startFeed(topicIds) {
  activeTopics = topicIds;
  refillBag();
  feedEl.innerHTML = '';
  if (!activeTopics.length) return;

  await renderTodaysEdition(topicIds);

  if (sentinelObserver) sentinelObserver.disconnect();
  loadMore(6);

  sentinelObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) loadMore();
    }
  }, { root: feedEl, rootMargin: '200% 0px' });

  // re-observe sentinel each time it's recreated
  const obs = () => {
    const s = feedEl.querySelector('.sentinel');
    if (s) sentinelObserver.observe(s);
  };
  const mo = new MutationObserver(obs);
  mo.observe(feedEl, { childList: true });
  obs();
}

export function setActiveTopics(topicIds) {
  activeTopics = topicIds;
  refillBag();
}

export function getPinnedCards() {
  return Object.values(getPinned());
}
