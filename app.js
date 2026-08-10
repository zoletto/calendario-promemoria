const STORAGE_KEY = 'appuntamenti_v1';

const contactName = document.getElementById('contactName');
const contactPhone = document.getElementById('contactPhone');
const apptDate = document.getElementById('apptDate');
const apptTime = document.getElementById('apptTime');
const pickBtn = document.getElementById('pickBtn');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const emptyMsg = document.getElementById('emptyMsg');
const pickerNote = document.getElementById('pickerNote');
const phoneWarning = document.getElementById('phoneWarning');
const remindersBox = document.getElementById('remindersBox');
const NOTIFIED_KEY = 'notificati_v1';
const calGrid = document.getElementById('calGrid');
const calTitle = document.getElementById('calTitle');
const dayAppts = document.getElementById('dayAppts');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
let calViewDate = new Date();
let selectedDay = null;

// --- Google Calendar ---
const GCAL_CLIENT_ID = '910697756509-t4ev2fc7hqvqisrk9sq4r7r0cprfq6j4.apps.googleusercontent.com';
const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const gcalBtn = document.getElementById('gcalBtn');
const gcalStatus = document.getElementById('gcalStatus');
let gcalToken = null;
let gcalEventsCache = {}; // key: 'YYYY-MM' -> array of events
let tokenClient = null;

function initGcal() {
  if (!window.google || !google.accounts || !google.accounts.oauth2) {
    setTimeout(initGcal, 300);
    return;
  }
  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GCAL_CLIENT_ID,
      scope: GCAL_SCOPE,
      callback: (resp) => {
        if (resp.error) {
          gcalStatus.textContent = 'Collegamento non riuscito, riprova';
          return;
        }
        gcalToken = resp.access_token;
        gcalStatus.textContent = 'Google Calendar collegato';
        gcalStatus.classList.add('on');
        gcalBtn.textContent = 'Aggiorna collegamento';
        gcalEventsCache = {};
        renderCalendar();
      }
    });
  } catch (err) {
    gcalStatus.textContent = 'Google Calendar non disponibile';
  }
}
initGcal();

gcalBtn.addEventListener('click', () => {
  if (!tokenClient) {
    gcalStatus.textContent = 'Attendi il caricamento, poi riprova';
    return;
  }
  tokenClient.requestAccessToken({ prompt: gcalToken ? '' : 'consent' });
});

async function fetchGcalEvents(year, month) {
  const key = `${year}-${pad(month + 1)}`;
  if (!gcalToken) return [];
  if (gcalEventsCache[key]) return gcalEventsCache[key];
  const timeMin = new Date(year, month, 1).toISOString();
  const timeMax = new Date(year, month + 1, 1).toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${gcalToken}` } });
    if (!res.ok) throw new Error('gcal fetch failed');
    const data = await res.json();
    const events = (data.items || []).map(ev => ({
      title: ev.summary || '(senza titolo)',
      date: (ev.start.dateTime || ev.start.date).slice(0, 10),
      time: ev.start.dateTime ? ev.start.dateTime.slice(11, 16) : null,
      fromGoogle: true
    }));
    gcalEventsCache[key] = events;
    return events;
  } catch {
    return [];
  }
}

async function createGcalEvent(name, phone, date, time) {
  if (!gcalToken) return null;
  const start = new Date(date + 'T' + time);
  const end = new Date(start.getTime() + 60 * 60000);
  const body = {
    summary: name,
    description: phone ? `Telefono: ${phone}` : '',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() }
  };
  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${gcalToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    gcalEventsCache = {}; // invalida la cache del mese
    return data.id || null;
  } catch {
    return null; // silenzioso: l'appuntamento resta comunque salvato in locale
  }
}

async function updateGcalEvent(eventId, name, phone, date, time) {
  if (!gcalToken || !eventId) return;
  const start = new Date(date + 'T' + time);
  const end = new Date(start.getTime() + 60 * 60000);
  const body = {
    summary: name,
    description: phone ? `Telefono: ${phone}` : '',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() }
  };
  try {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${gcalToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    gcalEventsCache = {};
  } catch { /* silenzioso */ }
}

async function deleteGcalEvent(eventId) {
  if (!gcalToken || !eventId) return;
  try {
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${gcalToken}` }
    });
    gcalEventsCache = {};
  } catch { /* silenzioso */ }
}
// --- fine Google Calendar ---

// Il Contact Picker API funziona solo su Chrome Android, in PWA installata o tab HTTPS
const canPickContacts = 'contacts' in navigator && 'ContactsManager' in window;
if (!canPickContacts) {
  pickerNote.textContent = 'Selezione dalla rubrica non disponibile in questo browser: inserisci nome e numero manualmente.';
}

contactPhone.addEventListener('blur', () => {
  const v = contactPhone.value.trim();
  if (v && !v.startsWith('+')) {
    if (/^3\d{8,9}$/.test(v.replace(/\s/g, ''))) {
      contactPhone.value = '+39 ' + v;
    } else {
      phoneWarning.style.display = 'block';
    }
  } else {
    phoneWarning.style.display = 'none';
  }
});

pickBtn.addEventListener('click', async () => {
  if (!canPickContacts) {
    contactName.focus();
    return;
  }
  try {
    const props = ['name', 'tel'];
    const opts = { multiple: false };
    const contacts = await navigator.contacts.select(props, opts);
    if (contacts.length > 0) {
      const c = contacts[0];
      contactName.value = (c.name && c.name[0]) || '';
      contactPhone.value = (c.tel && c.tel[0]) || '';
    }
  } catch (err) {
    pickerNote.textContent = 'Selezione annullata o non consentita.';
  }
});

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const cancelEditBtn = document.getElementById('cancelEditBtn');
let editingId = null;

function exitEditMode() {
  editingId = null;
  contactName.value = '';
  contactPhone.value = '';
  apptDate.value = '';
  apptTime.value = '';
  addBtn.textContent = 'Aggiungi appuntamento';
  cancelEditBtn.style.display = 'none';
}
cancelEditBtn.addEventListener('click', exitEditMode);

function loadAppointments() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveAppointments(appts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appts));
}

function formatDate(dateStr, timeStr) {
  const d = new Date(dateStr + 'T' + timeStr);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + ' alle ' + timeStr;
}

function waLink(phone, name, dateStr, timeStr) {
  const firstName = name.trim().split(' ')[0] || name;
  const when = formatDate(dateStr, timeStr);
  const msg = `Ciao ${firstName}, ti ricordo il nostro appuntamento del ${when}.`;
  const cleanPhone = phone.replace(/[^0-9+]/g, '').replace('+', '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
}

function pad(n) { return String(n).padStart(2, '0'); }

async function renderCalendar() {
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  const monthName = calViewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  calTitle.textContent = monthName;

  const appts = loadAppointments();
  const gcalEvents = await fetchGcalEvents(year, month);
  const apptDates = new Set([...appts.map(a => a.date), ...gcalEvents.map(e => e.date)]);

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // lunedì = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  calGrid.innerHTML = '';
  ['L', 'M', 'M', 'G', 'V', 'S', 'D'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-dow';
    el.textContent = d;
    calGrid.appendChild(el);
  });

  for (let i = 0; i < startOffset; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty-cell';
    calGrid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
    const el = document.createElement('div');
    el.className = 'cal-day';
    if (dateStr === todayStr) el.classList.add('today');
    if (dateStr === selectedDay) el.classList.add('selected');
    el.innerHTML = d + (apptDates.has(dateStr) ? '<span class="dot"></span>' : '');
    el.addEventListener('click', () => {
      selectedDay = (selectedDay === dateStr) ? null : dateStr;
      renderCalendar();
      renderDayAppts();
    });
    calGrid.appendChild(el);
  }
}

async function renderDayAppts() {
  if (!selectedDay) { dayAppts.innerHTML = ''; return; }
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  const localAppts = loadAppointments()
    .filter(a => a.date === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));
  const gcalEvents = (await fetchGcalEvents(year, month))
    .filter(e => e.date === selectedDay);
  // evita di duplicare eventi già creati dall'app stessa (stesso nome e ora)
  const localKeys = new Set(localAppts.map(a => a.name + '|' + a.time));
  const otherGcalEvents = gcalEvents.filter(e => !localKeys.has(e.title + '|' + e.time));

  if (localAppts.length === 0 && otherGcalEvents.length === 0) {
    dayAppts.innerHTML = `<p class="note">Nessun appuntamento in questo giorno.</p>`;
    return;
  }
  const localHtml = localAppts.map(a => `
    <div class="appt">
      <p class="name">${a.name}</p>
      <p class="when">${a.time}</p>
      <a class="btn-wa" target="_blank" href="${waLink(a.phone, a.name, a.date, a.time)}">Invia promemoria WhatsApp</a>
    </div>
  `).join('');
  const gcalHtml = otherGcalEvents.map(e => `
    <div class="appt">
      <p class="name">${e.title}</p>
      <p class="when">${e.time ? e.time : 'tutto il giorno'} · da Google Calendar</p>
    </div>
  `).join('');
  dayAppts.innerHTML = localHtml + gcalHtml;
}

prevMonthBtn.addEventListener('click', () => {
  calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1);
  renderCalendar();
});
nextMonthBtn.addEventListener('click', () => {
  calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1);
  renderCalendar();
});

function render() {
  const appts = loadAppointments().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  list.innerHTML = '';
  emptyMsg.style.display = appts.length ? 'none' : 'block';
  appts.forEach((a) => {
    const div = document.createElement('div');
    div.className = 'appt';
    div.innerHTML = `
      <button class="del" data-id="${a.id}">Elimina</button>
      <button class="edit" data-id="${a.id}">Modifica</button>
      <p class="name">${a.name}</p>
      <p class="when">${formatDate(a.date, a.time)}</p>
      <a class="btn-wa" target="_blank" href="${waLink(a.phone, a.name, a.date, a.time)}">Invia promemoria WhatsApp</a>
    `;
    list.appendChild(div);
  });
  document.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const appts = loadAppointments();
      const target = appts.find(a => a.id === btn.dataset.id);
      const remaining = appts.filter(a => a.id !== btn.dataset.id);
      saveAppointments(remaining);
      if (target && target.gcalEventId) await deleteGcalEvent(target.gcalEventId);
      if (editingId === btn.dataset.id) exitEditMode();
      render();
      renderCalendar();
      renderDayAppts();
    });
  });
  document.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const appts = loadAppointments();
      const target = appts.find(a => a.id === btn.dataset.id);
      if (!target) return;
      editingId = target.id;
      contactName.value = target.name;
      contactPhone.value = target.phone;
      apptDate.value = target.date;
      apptTime.value = target.time;
      addBtn.textContent = 'Salva modifiche';
      cancelEditBtn.style.display = 'block';
      window.scrollTo({ top: document.querySelector('.card:nth-of-type(3)').offsetTop - 10, behavior: 'smooth' });
    });
  });
}

addBtn.addEventListener('click', async () => {
  const name = contactName.value.trim();
  const phone = contactPhone.value.trim();
  const date = apptDate.value;
  const time = apptTime.value;
  if (!name || !phone || !date || !time) {
    alert('Compila nome, numero, data e ora.');
    return;
  }
  const appts = loadAppointments();

  if (editingId) {
    const target = appts.find(a => a.id === editingId);
    if (target) {
      target.name = name;
      target.phone = phone;
      target.date = date;
      target.time = time;
      saveAppointments(appts);
      if (target.gcalEventId) {
        updateGcalEvent(target.gcalEventId, name, phone, date, time);
      } else {
        createGcalEvent(name, phone, date, time).then(id => {
          if (id) { target.gcalEventId = id; saveAppointments(appts); }
        });
      }
    }
    exitEditMode();
  } else {
    const newAppt = { id: uid(), name, phone, date, time, gcalEventId: null };
    appts.push(newAppt);
    saveAppointments(appts);
    createGcalEvent(name, phone, date, time).then(id => {
      if (id) {
        newAppt.gcalEventId = id;
        const latest = loadAppointments();
        const found = latest.find(a => a.id === newAppt.id);
        if (found) { found.gcalEventId = id; saveAppointments(latest); }
      }
    });
    contactName.value = '';
    contactPhone.value = '';
  }
  render();
  renderCalendar();
  renderDayAppts();
});

function getNotified() {
  try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY)) || []; } catch { return []; }
}
function markNotified(id) {
  const n = getNotified();
  n.push(id);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(n));
}

function checkReminders() {
  const appts = loadAppointments();
  const notified = getNotified();
  const now = new Date();
  const due = appts.filter(a => {
    if (notified.includes(a.id)) return false;
    const apptTime = new Date(a.date + 'T' + a.time);
    const hoursLeft = (apptTime - now) / 3600000;
    return hoursLeft > 0 && hoursLeft <= 24;
  });

  remindersBox.innerHTML = '';
  if (due.length === 0) {
    remindersBox.style.display = 'none';
    return;
  }
  remindersBox.style.display = 'block';
  due.forEach(a => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06);';
    row.innerHTML = `
      <span style="font-size:14px;">Ricordati di scrivere a <b>${a.name}</b> (${formatDate(a.date, a.time)})</span>
      <button data-id="${a.id}" style="background:#0f6e56; color:#fff; padding:6px 10px; font-size:13px; white-space:nowrap;">Fatto</button>
    `;
    remindersBox.appendChild(row);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Promemoria appuntamento', {
        body: `Ricordati di scrivere a ${a.name} per l'appuntamento del ${formatDate(a.date, a.time)}`
      });
    }
  });

  remindersBox.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      markNotified(btn.dataset.id);
      checkReminders();
    });
  });
}

if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

render();
renderCalendar();
checkReminders();
setInterval(checkReminders, 15 * 60 * 1000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
