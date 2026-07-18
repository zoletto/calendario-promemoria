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

function render() {
  const appts = loadAppointments().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  list.innerHTML = '';
  emptyMsg.style.display = appts.length ? 'none' : 'block';
  appts.forEach((a, i) => {
    const div = document.createElement('div');
    div.className = 'appt';
    div.innerHTML = `
      <button class="del" data-i="${i}">Elimina</button>
      <p class="name">${a.name}</p>
      <p class="when">${formatDate(a.date, a.time)}</p>
      <a class="btn-wa" target="_blank" href="${waLink(a.phone, a.name, a.date, a.time)}">Invia promemoria WhatsApp</a>
    `;
    list.appendChild(div);
  });
  document.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', () => {
      const appts = loadAppointments();
      appts.splice(Number(btn.dataset.i), 1);
      saveAppointments(appts);
      render();
    });
  });
}

addBtn.addEventListener('click', () => {
  const name = contactName.value.trim();
  const phone = contactPhone.value.trim();
  const date = apptDate.value;
  const time = apptTime.value;
  if (!name || !phone || !date || !time) {
    alert('Compila nome, numero, data e ora.');
    return;
  }
  const appts = loadAppointments();
  appts.push({ name, phone, date, time });
  saveAppointments(appts);
  contactName.value = '';
  contactPhone.value = '';
  render();
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
    const id = a.date + a.time + a.phone;
    if (notified.includes(id)) return false;
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
    const id = a.date + a.time + a.phone;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06);';
    row.innerHTML = `
      <span style="font-size:14px;">Ricordati di scrivere a <b>${a.name}</b> (${formatDate(a.date, a.time)})</span>
      <button data-id="${id}" style="background:#0f6e56; color:#fff; padding:6px 10px; font-size:13px; white-space:nowrap;">Fatto</button>
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
checkReminders();
setInterval(checkReminders, 15 * 60 * 1000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
