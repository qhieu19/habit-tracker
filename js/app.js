// ─── CONSTANTS ────────────────────────────────────────
const COLORS = ['#0a7abf', '#5a9e1e', '#c48a00', '#9b35f1', '#e07070', '#35b8a0', '#e07a35', '#555'];
const FREQ_LB = { daily: 'Hàng ngày', weekdays: 'T2–T6', weekends: 'T7–CN', '3x': '3x/tuần' };
const UNIT_TARGETS = { ml: 2000, lít: 2, bước: 10000, phút: 30, trang: 20, calo: 2000, km: 5 };
const UNIT_INCS = { ml: [150, 200, 300, 500], lít: [0.25, 0.5, 1], bước: [1000, 2000, 5000], phút: [5, 10, 15, 30], trang: [5, 10, 20], calo: [100, 200, 300, 500], km: [1, 2, 5] };

// ─── LOCAL STATE ──────────────────────────────────────
let editId = null, currentTab = 'all', currentType = 'boolean', currentIncs = [];

// ─── DATE HELPERS ─────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }
function ds(d) { return d.toISOString().split('T')[0]; }

// ─── LOG HELPERS ──────────────────────────────────────
function getLog(id, date) {
    date = date || today();
    return (logs[date] && logs[date][id] != null) ? logs[date][id] : null;
}

function isDone(h, date) {
    date = date || today();
    const v = getLog(h.id, date);
    if (h.type === 'quantity') return v !== null && v >= h.target;
    return v === true;
}

function getPct(h, date) {
    date = date || today();
    if (h.type !== 'quantity') return isDone(h, date) ? 100 : 0;
    const v = getLog(h.id, date) || 0;
    return Math.min(100, Math.round(v / h.target * 100));
}

function getVal(h, date) {
    date = date || today();
    return getLog(h.id, date) || 0;
}

// ─── ACTIONS ──────────────────────────────────────────
function toggle(id) {
    const d = today();
    if (!logs[d]) logs[d] = {};
    if (logs[d][id] === true) delete logs[d][id];
    else logs[d][id] = true;
    save(); render();
}

function addQty(id, amt) {
    const h = habits.find(x => x.id === id); if (!h) return;
    const d = today();
    if (!logs[d]) logs[d] = {};
    const cur = logs[d][id] || 0;
    const nv = Math.max(0, cur + amt);
    if (nv === 0) delete logs[d][id]; else logs[d][id] = nv;
    save(); render();
}

function resetQty(id) {
    const d = today();
    if (logs[d]) delete logs[d][id];
    save(); render();
}

// ─── STREAK ───────────────────────────────────────────
function calcStreak(h) {
    let s = 0, d = new Date();
    for (let i = 0; i < 365; i++) {
        const dstr = ds(d);
        if (isDone(h, dstr)) { s++; d.setDate(d.getDate() - 1); }
        else { if (dstr === today() && i === 0) { d.setDate(d.getDate() - 1); continue; } break; }
    }
    return s;
}

function calcBestStreak(h) {
    let best = 0, cur = 0;
    for (const dstr of Object.keys(logs).sort()) {
        if (isDone(h, dstr)) { cur++; if (cur > best) best = cur; } else cur = 0;
    }
    return best;
}

// ─── STATS ────────────────────────────────────────────
function updateStats() {
    const total = habits.length;
    const done = habits.filter(h => isDone(h)).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    let wt = 0, wd = 0;
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        wt += habits.length;
        wd += habits.filter(h => isDone(h, ds(d))).length;
    }
    let gs = 0;
    for (let i = 0; i < 365; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dstr = ds(d);
        if (logs[dstr] && Object.values(logs[dstr]).some(v => v)) { gs++; }
        else { if (i === 0) continue; break; }
    }
    let best = 0;
    habits.forEach(h => { const b = calcBestStreak(h); if (b > best) best = b; });

    document.getElementById('statToday').textContent = `${done}/${total}`;
    document.getElementById('statBestStreak').textContent = best;
    document.getElementById('statWeek').textContent = (wt ? Math.round(wd / wt * 100) : 0) + '%';
    document.getElementById('statTotal').textContent = total;
    document.getElementById('globalStreak').textContent = gs;

    const bw = document.getElementById('todayBarWrap');
    if (total > 0) {
        bw.style.display = 'block';
        document.getElementById('todayBarLabel').textContent = `${done} / ${total}`;
        document.getElementById('todayBarFill').style.width = pct + '%';
    } else bw.style.display = 'none';
}

// ─── HEATMAP ──────────────────────────────────────────
function buildHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    grid.innerHTML = '';
    const end = new Date(), start = new Date(); start.setDate(start.getDate() - 119);
    while (start.getDay() !== 1) start.setDate(start.getDate() - 1);
    let week = null;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === 1 || !week) {
            week = document.createElement('div');
            week.className = 'heatmap-week';
            grid.appendChild(week);
        }
        const dstr = ds(d), count = habits.filter(h => isDone(h, dstr)).length, total = habits.length;
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        if (count > 0) {
            const r = total ? count / total : 0;
            cell.classList.add(r >= 1 ? 'l4' : r >= 0.66 ? 'l3' : r >= 0.33 ? 'l2' : 'l1');
        }
        cell.setAttribute('data-date', `${dstr} (${count}/${total})`);
        week.appendChild(cell);
    }
}

// ─── RENDER ───────────────────────────────────────────
function render() {
    updateStats(); buildHeatmap();
    const grid = document.getElementById('habitsGrid');
    let filtered = habits;
    if (currentTab === 'done') filtered = habits.filter(h => isDone(h));
    if (currentTab === 'pending') filtered = habits.filter(h => !isDone(h));

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon">${habits.length === 0 ? '🌱' : '✅'}</div><div class="empty-title">${habits.length === 0 ? 'Chưa có thói quen nào' : 'Không có thói quen nào'}</div><div class="empty-sub">${habits.length === 0 ? 'Hãy thêm thói quen đầu tiên!' : 'Thay đổi bộ lọc để xem thêm.'}</div></div>`;
        return;
    }

    grid.innerHTML = '';
    filtered.forEach(h => {
        const streak = calcStreak(h);
        const done = isDone(h);
        const pct = getPct(h);
        const val = h.type === 'quantity' ? getVal(h) : 0;

        const weekDots = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            const dstr = ds(d), p = getPct(h, dstr), dn = isDone(h, dstr), isT = i === 6;
            let cls = 'week-dot';
            if (dn) cls += ' done'; else if (p > 0) cls += ' partial';
            if (isT) cls += ' today-dot';
            return `<div class="${cls}" title="${dstr}: ${p}%"></div>`;
        }).join('');

        const pc = pct >= 100 ? '#5a9e1e' : pct >= 60 ? '#c48a00' : '#0a7abf';

        let progHtml = '';
        if (h.type === 'quantity') {
            const incs = (h.increments && h.increments.length > 0) ? h.increments : [Math.round(h.target / 4), Math.round(h.target / 2)];
            const qaHtml = incs.map(v => `<button class="qa-btn" onclick="addQty('${h.id}',${v})">+${v} ${h.unit}</button>`).join('');
            const doneHtml = done ? `<span class="done-badge">✓ Đạt mục tiêu!</span>` : '';
            const resetHtml = val > 0 ? `<button class="qa-reset" onclick="resetQty('${h.id}')" title="Reset về 0">↺</button>` : '';
            progHtml = `
        <div class="progress-section">
          <div class="prog-header">
            <div class="prog-bar-bg"><div class="prog-bar-fill" style="width:${pct}%;background:${pc}"></div></div>
            <span class="prog-pct" style="color:${pc}">${pct}%</span>
            <span class="prog-amount">${val.toLocaleString()} / ${h.target.toLocaleString()} ${h.unit}</span>
          </div>
          <div class="quick-add-row">
            <span class="qa-label">Thêm:</span>
            ${qaHtml} ${resetHtml} ${doneHtml}
          </div>
        </div>`;
        }

        const card = document.createElement('div');
        card.className = 'habit-card' + (done ? ' fully-done' : '');
        card.innerHTML = `
      <div class="card-top">
        <div class="habit-icon" style="background:${h.color}22">${h.emoji}</div>
        <div class="habit-info">
          <div class="habit-name">${h.name}</div>
          <div class="habit-meta">
            <div class="habit-streak${streak >= 3 ? ' hot' : ''}">
              ${streak > 0 ? '🔥' : '⚪'} ${streak} ngày streak
            </div>
            <div class="habit-freq">${FREQ_LB[h.freq] || h.freq}</div>
            ${h.type === 'quantity' ? `<div class="habit-target-lbl" style="color:${h.color}">🎯 ${h.target.toLocaleString()} ${h.unit}/ngày</div>` : ''}
          </div>
        </div>
        <div class="week-dots">${weekDots}</div>
        <div style="display:flex;align-items:center;gap:7px">
          ${h.type === 'boolean' ? `<button class="check-btn${done ? ' checked' : ''}" onclick="toggle('${h.id}')">${done ? '✓' : ''}</button>` : ''}
          <div class="habit-menu">
            <button class="menu-btn" onclick="toggleMenu('${h.id}')">⋮</button>
            <div class="menu-dropdown" id="menu_${h.id}">
              <div class="menu-item" onclick="editHabit('${h.id}')">✏️ Chỉnh sửa</div>
              <div class="menu-item danger" onclick="deleteHabit('${h.id}')">🗑 Xóa</div>
            </div>
          </div>
        </div>
      </div>
      ${progHtml}`;
        grid.appendChild(card);
    });
}

// ─── MENU ─────────────────────────────────────────────
document.addEventListener('click', e => {
    if (!e.target.classList.contains('menu-btn'))
        document.querySelectorAll('.menu-dropdown.open').forEach(m => m.classList.remove('open'));
});

function toggleMenu(id) {
    const m = document.getElementById('menu_' + id), was = m.classList.contains('open');
    document.querySelectorAll('.menu-dropdown.open').forEach(x => x.classList.remove('open'));
    if (!was) m.classList.add('open');
}

function deleteHabit(id) {
    if (confirm('Xóa thói quen này?')) { habits = habits.filter(h => h.id !== id); save(); render(); }
}

// ─── MODAL ────────────────────────────────────────────
function buildColorPicker() {
    const cp = document.getElementById('colorPicker'); cp.innerHTML = '';
    COLORS.forEach(c => {
        const s = document.createElement('div');
        s.className = 'color-swatch'; s.style.background = c; s.setAttribute('data-color', c);
        s.onclick = () => { document.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('selected')); s.classList.add('selected'); };
        cp.appendChild(s);
    });
    cp.children[0].classList.add('selected');
}

function selectType(type) {
    currentType = type;
    document.getElementById('typeBoolean').classList.toggle('selected', type === 'boolean');
    document.getElementById('typeQuantity').classList.toggle('selected', type === 'quantity');
    document.getElementById('quantityFields').classList.toggle('hidden', type !== 'quantity');
}

function setUnit(u, el) {
    document.getElementById('habitUnit').value = u;
    document.querySelectorAll('.unit-preset').forEach(p => p.classList.remove('sel'));
    el.classList.add('sel');
    if (UNIT_TARGETS[u] && !document.getElementById('habitTarget').value)
        document.getElementById('habitTarget').value = UNIT_TARGETS[u];
    if (UNIT_INCS[u]) { currentIncs = [...UNIT_INCS[u]]; renderIncs(); }
}

function renderIncs() {
    const list = document.getElementById('incList'); list.innerHTML = '';
    currentIncs.forEach((v, i) => {
        const t = document.createElement('div'); t.className = 'inc-tag';
        t.innerHTML = `${v} <button onclick="removeInc(${i})">×</button>`;
        list.appendChild(t);
    });
}

function removeInc(i) { currentIncs.splice(i, 1); renderIncs(); }

function addInc() {
    const v = parseFloat(document.getElementById('newIncVal').value);
    if (!v || v <= 0) return;
    currentIncs.push(v); currentIncs.sort((a, b) => a - b);
    document.getElementById('newIncVal').value = ''; renderIncs();
}

function openModal(reset = true) {
    if (reset) {
        editId = null; currentType = 'boolean'; currentIncs = [];
        document.getElementById('modalTitle').textContent = '✦ Thêm thói quen mới';
        ['habitName', 'habitEmoji', 'habitUnit', 'habitTarget'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('habitFreq').value = 'daily';
        selectType('boolean'); renderIncs();
        document.querySelectorAll('.unit-preset').forEach(p => p.classList.remove('sel'));
    }
    buildColorPicker();
    document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

function editHabit(id) {
    const h = habits.find(x => x.id === id); if (!h) return;
    editId = id; currentType = h.type || 'boolean'; currentIncs = h.increments ? [...h.increments] : [];
    document.getElementById('modalTitle').textContent = '✏️ Chỉnh sửa';
    document.getElementById('habitName').value = h.name;
    document.getElementById('habitEmoji').value = h.emoji;
    document.getElementById('habitFreq').value = h.freq;
    if (h.type === 'quantity') {
        document.getElementById('habitUnit').value = h.unit || '';
        document.getElementById('habitTarget').value = h.target || '';
    }
    openModal(false); selectType(currentType); renderIncs();
    setTimeout(() => {
        document.querySelectorAll('.color-swatch').forEach(s =>
            s.classList.toggle('selected', s.getAttribute('data-color') === h.color));
    }, 50);
}

function saveHabit() {
    const name = document.getElementById('habitName').value.trim();
    const emoji = document.getElementById('habitEmoji').value.trim() || '⭐';
    const freq = document.getElementById('habitFreq').value;
    const color = document.querySelector('.color-swatch.selected')?.getAttribute('data-color') || COLORS[0];
    if (!name) { document.getElementById('habitName').focus(); return; }
    const base = { name, emoji, freq, color, type: currentType };
    if (currentType === 'quantity') {
        base.unit = document.getElementById('habitUnit').value.trim() || 'đơn vị';
        base.target = parseFloat(document.getElementById('habitTarget').value) || 100;
        base.increments = currentIncs.length > 0 ? currentIncs : [Math.round(base.target / 4), Math.round(base.target / 2)];
    }
    if (editId) {
        const h = habits.find(x => x.id === editId);
        if (h) Object.assign(h, base);
    } else {
        habits.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), ...base, createdAt: today() });
    }
    save(); closeModal(); render();
}

document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

function setTab(tab, el) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    render();
}

function updateDate() {
    document.getElementById('headerDate').textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── SEED DATA ────────────────────────────────────────
function maybeSeedData() {
    if (habits.length === 0) {
        habits = [
            { id: 's1', name: 'Uống đủ nước', emoji: '💧', freq: 'daily', color: '#0a7abf', type: 'quantity', unit: 'ml', target: 2000, increments: [150, 200, 300, 500], createdAt: today() },
            { id: 's2', name: 'Đi bộ', emoji: '🚶', freq: 'daily', color: '#5a9e1e', type: 'quantity', unit: 'bước', target: 10000, increments: [1000, 2000, 5000], createdAt: today() },
            { id: 's3', name: 'Tập gym', emoji: '🏋️', freq: 'daily', color: '#c48a00', type: 'boolean', createdAt: today() },
            { id: 's4', name: 'Đọc sách', emoji: '📚', freq: 'daily', color: '#9b35f1', type: 'quantity', unit: 'trang', target: 20, increments: [5, 10, 20], createdAt: today() },
        ];
        save();
    }
}

// ─── PAGE CALLBACK ────────────────────────────────────
function onAuthReady() {
    maybeSeedData();
    updateDate();
    render();
}

// ─── INIT ─────────────────────────────────────────────
initAuth();
