// app.js — wires the topic drawer, persisted preferences, and feed together.

import { TOPICS, addCustomTopic, removeCustomTopic } from './topics.js';
import { initFeed, startFeed, setActiveTopics, renderCard, getPinnedCards, surpriseMe } from './feed.js';

const ACTIVE_KEY = 'curio_active_topics_v1';
const THEME_KEY = 'curio_theme_v1';
const THEME_COLORS = { light: '#faf7f0', dark: '#14171a' };

const feedEl = document.getElementById('feed');
const emptyState = document.getElementById('emptyState');
const drawer = document.getElementById('drawer');
const topicList = document.getElementById('topicList');
const toastEl = document.getElementById('toast');
const savedListEl = document.getElementById('savedList');
const savedEmptyEl = document.getElementById('savedEmpty');
const savedSearchEl = document.getElementById('savedSearch');
const themeToggle = document.getElementById('themeToggle');
const dock = document.getElementById('dock');
const views = document.querySelectorAll('.view');
const toTopBtn = document.getElementById('toTopBtn');

function loadActive() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set(TOPICS.map(t => t.id)); // default: everything on
}
function saveActive(set) {
  try { localStorage.setItem(ACTIVE_KEY, JSON.stringify([...set])); } catch {}
}

let active = loadActive();
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

// ----- theme -----

function loadTheme() {
  try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'; }
  catch { return 'light'; }
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', THEME_COLORS[theme]);
  themeToggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
  try { localStorage.setItem(THEME_KEY, theme); } catch {}
}
themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});
applyTheme(loadTheme());

// ----- bottom dock / view switching -----

function switchView(name) {
  for (const view of views) view.hidden = view.id !== name;
  for (const btn of dock.querySelectorAll('.dock-btn')) {
    if (btn.dataset.view === name) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  }
  if (name === 'savedView') {
    savedSearchEl.value = '';
    savedQuery = '';
    renderSavedList();
  }
  updateToTopVisibility();
}
dock.addEventListener('click', (e) => {
  const btn = e.target.closest('.dock-btn');
  if (btn) switchView(btn.dataset.view);
});

// ----- back to top -----

function activeScroller() {
  return savedListEl.closest('.view').hidden ? feedEl : savedListEl;
}
function updateToTopVisibility() {
  const scroller = activeScroller();
  toTopBtn.classList.toggle('show', scroller.scrollTop > window.innerHeight * 0.75);
}
feedEl.addEventListener('scroll', updateToTopVisibility, { passive: true });
savedListEl.addEventListener('scroll', updateToTopVisibility, { passive: true });
toTopBtn.addEventListener('click', () => {
  activeScroller().scrollTo({ top: 0, behavior: 'smooth' });
});

// ----- saved view -----

let savedQuery = '';

function matchesSavedQuery(card, query) {
  if (!query) return true;
  const haystack = `${card.title} ${card.teaser || ''} ${card.body || ''} ${card.meta || ''}`.toLowerCase();
  return haystack.includes(query);
}

function renderSavedList() {
  savedListEl.innerHTML = '';
  const all = getPinnedCards();
  savedSearchEl.hidden = all.length === 0;

  if (!all.length) {
    savedListEl.hidden = true;
    savedEmptyEl.hidden = false;
    savedEmptyEl.querySelector('h2').textContent = 'Nothing saved yet';
    savedEmptyEl.querySelector('p').textContent = 'Tap ☆ Save on any card in your feed to keep it here.';
    return;
  }

  const cards = all.filter(c => matchesSavedQuery(c, savedQuery));
  if (!cards.length) {
    savedListEl.hidden = true;
    savedEmptyEl.hidden = false;
    savedEmptyEl.querySelector('h2').textContent = 'No matches';
    savedEmptyEl.querySelector('p').textContent = `Nothing saved matches "${savedQuery}".`;
    return;
  }

  savedListEl.hidden = false;
  savedEmptyEl.hidden = true;
  for (const card of cards) {
    const node = renderCard(card);
    if (!node) continue;
    savedListEl.appendChild(node);
    // buildActions' save button calls stopPropagation(), so a listener on
    // #savedList would never see the click — attach directly to the button
    // instead, where it runs right after the toggle (same element, so
    // stopPropagation doesn't affect listener order here).
    const saveBtn = node.querySelector('.action');
    saveBtn?.addEventListener('click', () => {
      if (getPinnedCards().some(c => c.id === card.id)) return;
      renderSavedList();
    });
  }
}
savedSearchEl.addEventListener('input', () => {
  savedQuery = savedSearchEl.value.trim().toLowerCase();
  renderSavedList();
});

function renderDrawerList() {
  topicList.innerHTML = '';
  for (const topic of TOPICS) {
    const row = document.createElement('div');
    row.className = 'topic-row' + (active.has(topic.id) ? ' active' : '');
    row.dataset.id = topic.id;
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-pressed', active.has(topic.id) ? 'true' : 'false');

    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = topic.ink + '33';
    swatch.style.color = topic.ink;
    swatch.textContent = topic.glyph;

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = topic.label;

    row.appendChild(swatch);
    row.appendChild(name);

    if (topic.custom) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'topic-delete';
      del.setAttribute('aria-label', `Remove ${topic.label}`);
      del.textContent = '✕';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        removeCustomTopic(topic.id);
        active.delete(topic.id);
        renderDrawerList();
      });
      row.appendChild(del);
    }

    const toggle = document.createElement('div');
    toggle.className = 'toggle';
    row.appendChild(toggle);

    const toggleActive = () => {
      if (active.has(topic.id)) active.delete(topic.id);
      else active.add(topic.id);
      row.classList.toggle('active');
      row.setAttribute('aria-pressed', active.has(topic.id) ? 'true' : 'false');
    };
    row.addEventListener('click', toggleActive);
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleActive(); }
    });

    topicList.appendChild(row);
  }
}

function handleAddTopic() {
  const nameInput = document.getElementById('newTopicName');
  const seedsInput = document.getElementById('newTopicSeeds');
  const topic = addCustomTopic(nameInput.value, seedsInput.value);
  if (!topic) { showToast('Enter a topic name first'); return; }
  active.add(topic.id);
  nameInput.value = '';
  seedsInput.value = '';
  renderDrawerList();
  showToast(`Added "${topic.label}"`);
}

function openDrawer() {
  if (active.size === 0) active = new Set(TOPICS.map(t => t.id));
  renderDrawerList();
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
}

let feedStarted = false;
function applySelection() {
  saveActive(active);
  const ids = [...active];
  if (ids.length === 0) {
    feedEl.hidden = true;
    emptyState.hidden = false;
  } else {
    feedEl.hidden = false;
    emptyState.hidden = true;
    if (!feedStarted) { feedStarted = true; startFeed(ids); }
    else setActiveTopics(ids);
  }
}

document.getElementById('topicsBtn').addEventListener('click', openDrawer);
document.getElementById('emptyCta').addEventListener('click', openDrawer);
document.getElementById('drawerClose').addEventListener('click', () => { closeDrawer(); });
document.getElementById('drawerDone').addEventListener('click', () => { closeDrawer(); applySelection(); });
document.getElementById('selectAll').addEventListener('click', () => {
  active = new Set(TOPICS.map(t => t.id));
  renderDrawerList();
});
document.getElementById('clearAll').addEventListener('click', () => {
  active = new Set();
  renderDrawerList();
});
document.getElementById('addTopicBtn').addEventListener('click', handleAddTopic);
document.getElementById('newTopicSeeds').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); }
});
drawer.addEventListener('click', (e) => { if (e.target === drawer) { closeDrawer(); applySelection(); } });

// tapping a card's side tab opens the topic drawer (event delegation, cards render dynamically)
feedEl.addEventListener('click', (e) => {
  if (e.target.closest('.tab')) openDrawer();
});

// ----- surprise me -----

const surpriseBtn = document.getElementById('surpriseBtn');
surpriseBtn.addEventListener('click', async () => {
  if (surpriseBtn.disabled) return;
  if (document.getElementById('feedView').hidden) switchView('feedView');
  surpriseBtn.disabled = true;
  const card = await surpriseMe();
  surpriseBtn.disabled = false;
  if (!card) showToast('Trouble finding something new — check your connection');
});

// ----- boot -----
initFeed({ feedElement: feedEl, toastFn: showToast });
applySelection();

// ----- offline notice -----
window.addEventListener('offline', () => showToast('Offline — showing saved & cached cards'));
window.addEventListener('online', () => showToast('Back online'));

// ----- service worker -----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// ----- install prompt -----
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});
window.addEventListener('appinstalled', () => { installBtn.hidden = true; });
