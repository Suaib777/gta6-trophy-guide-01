// Leonida Trophy Guide — tracker logic. Loads data/trophies.json and data/roadmap.json
// (files under app/, nothing from the network), renders the checklist, the roadmap,
// filters, spoiler mode, export/import and the per-trophy detail panel. Progress is
// kept in localStorage and never leaves the browser unless the user exports it.
const EARNED_KEY = 'gta6-guide-earned-v1';
const SPOILER_KEY = 'gta6-guide-spoiler-v1';
const TOTAL_POINTS = 1350;

let trophies = [];
let roadmap = null;
let earned = loadEarned();
let spoilerOn = loadSpoilerSetting();
let selectedId = null;
const filters = { search: '', kind: 'all', grade: 'all' };

const $ = (id) => document.getElementById(id);

async function fetchJson(path) {
  const response = await fetch(path);
  return response.json();
}

function loadEarned() {
  try {
    const ids = JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]');
    return new Set(ids.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function loadSpoilerSetting() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}

function saveSpoilerSetting() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

function trophyById(id) {
  return trophies.find((t) => t.id === id);
}

function isSpoilerHidden(trophy) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.id);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function trophyMatchesFilters(trophy) {
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind === 'online') return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  if (filters.search) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.mission ?? ''} ${trophy.chapter ?? ''} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(filters.search)) return false;
  }
  return true;
}

function renderProgressStats() {
  const earnedPoints = trophies.filter((t) => earned.has(t.id)).reduce((sum, t) => sum + t.points, 0);
  $('earned-count').textContent = `${earned.size} / ${trophies.length}`;
  $('points').textContent = `${earnedPoints} / ${TOTAL_POINTS} pts`;
  $('progress-fill').style.width = `${trophies.length ? (earned.size / trophies.length) * 100 : 0}%`;
  const chips = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const total = trophies.filter((t) => t.grade === grade).length;
    const got = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    return `<span><b>${gradeLabel(grade)}</b> ${got}/${total}</span>`;
  });
  $('grade-chips').innerHTML = chips.join('');
}

function renderRoadmap() {
  if (!roadmap) return;
  $('roadmap-meta').textContent = `Difficulty ${roadmap.difficulty} · ${roadmap.hours} · ${roadmap.playthroughs} playthrough · ${roadmap.online_trophies} online trophies`;
  $('missable-text').textContent = roadmap.missable_warning.text;
  $('roadmap-stages').innerHTML = roadmap.stages.map((stage) => {
    const names = stage.trophy_ids.map((id) => trophyById(id)?.name ?? '').filter(Boolean).join(', ');
    return `<article class="roadmap-stage"><h3>Stage ${stage.stage} — ${stage.title}</h3><span class="hours">${stage.hours}</span><p>${stage.text}</p><p class="stage-trophies">Trophies: ${names}</p></article>`;
  }).join('');
  $('roadmap-tips').innerHTML = roadmap.tips.map((tip) => `<li>${tip}</li>`).join('');
}

function buildTrophyCard(trophy) {
  const hidden = isSpoilerHidden(trophy);
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `trophy-card${earned.has(trophy.id) ? ' earned' : ''}${selectedId === trophy.id ? ' selected' : ''}${hidden ? ' spoiler-hidden' : ''}`;
  card.dataset.trophyId = String(trophy.id);
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${hidden ? 'hidden trophy' : trophy.name} as earned`);
  box.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleEarned(trophy.id, box.checked);
  });
  const body = document.createElement('span');
  const name = document.createElement('span');
  name.className = 'trophy-name';
  name.textContent = hidden ? 'Hidden trophy — earn it to reveal' : trophy.name;
  const desc = document.createElement('span');
  desc.className = 'trophy-desc';
  desc.textContent = hidden ? 'Story trophy hidden while spoiler mode is on.' : trophy.description;
  const meta = document.createElement('span');
  meta.className = 'trophy-meta';
  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = gradeLabel(trophy.grade);
  meta.append(badge);
  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'flag-missable';
    flag.textContent = 'Missable';
    meta.append(flag);
  }
  if (trophy.secret) {
    const flag = document.createElement('span');
    flag.className = 'flag-secret';
    flag.textContent = 'Hidden on PSN';
    meta.append(flag);
  }
  if (!hidden && trophy.chapter) {
    const where = document.createElement('span');
    where.textContent = trophy.mission ? `${trophy.chapter} · ${trophy.mission}` : trophy.chapter;
    meta.append(where);
  }
  const points = document.createElement('span');
  points.textContent = `${trophy.points} pts`;
  meta.append(points);
  body.append(name, desc, meta);
  card.append(box, body);
  card.addEventListener('click', () => openTrophyDetail(trophy.id));
  return card;
}

function renderTrophyList() {
  const list = $('trophy-list');
  list.replaceChildren();
  const shown = trophies.filter(trophyMatchesFilters);
  for (const trophy of shown) list.append(buildTrophyCard(trophy));
  const empty = $('empty-state');
  if (shown.length === 0) {
    empty.hidden = false;
    empty.textContent = filters.kind === 'online'
      ? 'No online trophies — all 55 trophies are offline single-player, so there is nothing to show here.'
      : 'No trophies match these filters. Clear the search or change the kind / grade.';
  } else {
    empty.hidden = true;
  }
  $('filter-note').textContent = `Showing ${shown.length} of ${trophies.length} trophies` +
    (filters.kind !== 'all' ? ` · kind: ${filters.kind}` : '') +
    (filters.grade !== 'all' ? ` · grade: ${filters.grade}` : '') +
    (filters.search ? ` · search: “${filters.search}”` : '');
  $('list-heading').textContent = filters.kind === 'missable' ? 'Missable trophies' : 'All trophies';
}

function toggleEarned(id, isEarned) {
  if (isEarned) earned.add(id);
  else earned.delete(id);
  saveEarned();
  renderProgressStats();
  renderTrophyList();
  if (selectedId === id) renderTrophyDetail(trophyById(id));
}

function renderTrophyDetail(trophy) {
  const panel = $('detail');
  if (!trophy) {
    panel.innerHTML = '<p class="detail-empty">Select a trophy to see its guide, sources and when it can be missed.</p>';
    return;
  }
  panel.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = trophy.name;
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = trophy.description;
  const facts = document.createElement('dl');
  facts.className = 'detail-facts';
  const factRows = [
    ['Grade', `${gradeLabel(trophy.grade)} · ${trophy.points} pts`],
    ['Kind', trophy.kind],
    ['Chapter', trophy.chapter ?? '—'],
    ['Mission', trophy.mission ?? '—'],
    ['Hidden', trophy.secret ? 'Yes — hidden on PSN until earned' : 'No'],
    ['Missable', trophy.missable ? 'Yes — see warning below' : 'No'],
  ];
  for (const [label, value] of factRows) {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    row.append(dt, dd);
    facts.append(row);
  }
  panel.append(title, desc, facts);
  if (isSpoilerHidden(trophy)) {
    const note = document.createElement('p');
    note.className = 'detail-warning';
    note.textContent = 'This story trophy is hidden while spoiler mode is on. Earn it in the game, or turn spoiler mode off, to see its guide.';
    panel.append(note);
  } else {
    if (trophy.missable) {
      const warn = document.createElement('p');
      warn.className = 'detail-warning';
      warn.textContent = 'Missable — read the guide before you finish Chapter 1. Every other trophy can be earned after the story.';
      panel.append(warn);
    }
    const guide = document.createElement('div');
    guide.className = 'detail-guide';
    for (const paragraph of trophy.guide.split('\n')) {
      const p = document.createElement('p');
      p.textContent = paragraph;
      guide.append(p);
    }
    panel.append(guide);
    const sources = document.createElement('div');
    sources.className = 'detail-sources';
    const heading = document.createElement('strong');
    heading.textContent = 'Sources — where each fact comes from:';
    const list = document.createElement('ul');
    for (const source of trophy.sources) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.name;
      item.append(link);
      list.append(item);
    }
    sources.append(heading, list);
    panel.append(sources);
  }
  const actions = document.createElement('div');
  actions.className = 'detail-actions';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = earned.has(trophy.id) ? '✓ Earned — mark as not earned' : 'Mark as earned';
  toggle.className = earned.has(trophy.id) ? 'secondary' : '';
  toggle.addEventListener('click', () => toggleEarned(trophy.id, !earned.has(trophy.id)));
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'secondary';
  close.textContent = 'Close';
  close.addEventListener('click', closeTrophyDetail);
  actions.append(toggle, close);
  panel.append(actions);
}

function openTrophyDetail(id) {
  selectedId = id;
  renderTrophyList();
  renderTrophyDetail(trophyById(id));
  history.replaceState(null, '', `#trophy-${id}`);
}

function closeTrophyDetail() {
  selectedId = null;
  renderTrophyList();
  renderTrophyDetail(null);
  history.replaceState(null, '', ' ');
}

function exportProgress() {
  const payload = {
    app: 'gta6-trophy-guide',
    version: 1,
    exported_at: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    spoiler: spoilerOn,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    const valid = ids.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
    earned = new Set(valid);
    if (typeof data.spoiler === 'boolean') {
      spoilerOn = data.spoiler;
      $('spoiler').checked = spoilerOn;
      saveSpoilerSetting();
    }
    saveEarned();
    renderProgressStats();
    renderTrophyList();
    if (selectedId) renderTrophyDetail(trophyById(selectedId));
    $('filter-note').textContent = `Imported ${valid.length} earned trophies.`;
  } catch {
    $('filter-note').textContent = 'That file could not be imported — it is not a progress file from this guide.';
  }
}

function applyFiltersFromControls() {
  filters.search = $('search').value.trim().toLowerCase();
  filters.kind = $('kind').value;
  filters.grade = $('grade').value;
  renderTrophyList();
}

function wireControls() {
  $('search').addEventListener('input', applyFiltersFromControls);
  $('kind').addEventListener('change', applyFiltersFromControls);
  $('grade').addEventListener('change', applyFiltersFromControls);
  $('spoiler').checked = spoilerOn;
  $('spoiler').addEventListener('change', () => {
    spoilerOn = $('spoiler').checked;
    saveSpoilerSetting();
    renderTrophyList();
    if (selectedId) renderTrophyDetail(trophyById(selectedId));
  });
  $('export').addEventListener('click', exportProgress);
  $('import').addEventListener('change', (event) => {
    importProgress(event.target.files[0]);
    event.target.value = '';
  });
  $('reset').addEventListener('click', () => {
    if (window.confirm('Clear all earned trophies?')) {
      earned = new Set();
      saveEarned();
      renderProgressStats();
      renderTrophyList();
      if (selectedId) renderTrophyDetail(trophyById(selectedId));
    }
  });
  $('missable-open').addEventListener('click', () => openTrophyDetail(roadmap?.missable_warning?.trophy_id ?? 28));
}

async function init() {
  const data = await fetchJson('data/trophies.json');
  trophies = data.trophies;
  roadmap = await fetchJson('data/roadmap.json');
  wireControls();
  renderRoadmap();
  renderProgressStats();
  renderTrophyList();
  const match = location.hash.match(/^#trophy-(\d+)$/);
  if (match && trophyById(Number(match[1]))) {
    openTrophyDetail(Number(match[1]));
  } else if (location.hash === '#roadmap') {
    $('roadmap').scrollIntoView();
  }
}

init();
