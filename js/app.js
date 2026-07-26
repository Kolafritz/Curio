// app.js — wires the topic drawer, persisted preferences, and feed together.

import { TOPICS, addCustomTopic, removeCustomTopic } from './topics.js';
import { initFeed, startFeed, setActiveTopics } from './feed.js';

const ACTIVE_KEY = 'curio_active_topics_v1';

const feedEl = document.getElementById('feed');
const emptyState = document.getElementById('emptyState');
const drawer = document.getElementById('drawer');
const topicList = document.getElementById('topicList');
const toastEl = document.getElementById('toast');

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
