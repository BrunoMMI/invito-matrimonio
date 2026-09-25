(() => {
  'use strict';

  // --- Dati dell'evento (dal "Testo Invito") ---
  const EVENT = {
    title: 'Matrimonio di Davide & Amalia',
    // Cerimonia: domenica 13 dicembre 2026, ore 11:00 (fuso Europe/Rome)
    y: 2026, mo: 12, d: 13, h: 11, mi: 0,
    place: 'Santuario Ave Gratia Plena, Piedimonte Matese (CE)',
    details: 'Davide Del Basso & Amalia Zoccolillo. Dopo la cerimonia: Castello di Faicchio (BN). ' +
             'Conferma la presenza entro il 15 novembre 2026.',
    durationMin: 60 // durata segnaposto dell'evento in calendario (solo la cerimonia)
  };
  const IBAN = document.getElementById('iban')?.dataset.iban || '';
  const WHATSAPP = { davide: '393285833058', amalia: '393401817007' };

  // --- Istante UTC di un orario "a muro" in Europe/Rome ---
  function romeToUTC(y, mo, d, h, mi) {
    const guess = Date.UTC(y, mo - 1, d, h, mi);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Rome', hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric'
    }).formatToParts(new Date(guess)).reduce((a, p) => (a[p.type] = +p.value, a), {});
    const asRome = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return guess - (asRome - guess);
  }
  const START = romeToUTC(EVENT.y, EVENT.mo, EVENT.d, EVENT.h, EVENT.mi);
  const END = START + EVENT.durationMin * 60000;

  // --- Countdown ---
  const el = {
    box: document.getElementById('countdown'), msg: document.getElementById('cd-msg'),
    d: document.getElementById('cd-d'), h: document.getElementById('cd-h'),
    m: document.getElementById('cd-m'), s: document.getElementById('cd-s')
  };
  const pad = n => String(n).padStart(2, '0');
  const romeDay = t => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(t));

  function tick() {
    const now = Date.now();
    const diff = START - now;
    if (diff > 0) {
      const s = Math.floor(diff / 1000);
      el.d.textContent = Math.floor(s / 86400);
      el.h.textContent = pad(Math.floor(s % 86400 / 3600));
      el.m.textContent = pad(Math.floor(s % 3600 / 60));
      el.s.textContent = pad(s % 60);
      return true;
    }
    el.box.hidden = true;
    el.msg.hidden = false;
    el.msg.textContent = romeDay(now) === romeDay(START)
      ? 'Oggi ci sposiamo!'
      : 'Grazie per aver festeggiato con noi';
    return romeDay(now) === romeDay(START); // continua a controllare solo nel giorno delle nozze
  }
  if (tick()) {
    const timer = setInterval(() => { if (!tick()) clearInterval(timer); }, 1000);
  }

  // --- Calendario (.ics + Google Calendar) ---
  const fmtUTC = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const icsEscape = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  function buildICS() {
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Davide e Amalia//Invito//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:matrimonio-davide-amalia-20261213@invito',
      'DTSTAMP:' + fmtUTC(Date.now()),
      'DTSTART:' + fmtUTC(START),
      'DTEND:' + fmtUTC(END),
      'SUMMARY:' + icsEscape(EVENT.title),
      'LOCATION:' + icsEscape(EVENT.place),
      'DESCRIPTION:' + icsEscape(EVENT.details),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Domani ci sposiamo!', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
  }

  document.getElementById('btn-ics')?.addEventListener('click', () => {
    const blob = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'matrimonio-davide-amalia.ics' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  const gcal = document.getElementById('btn-gcal');
  if (gcal) {
    gcal.href = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
      action: 'TEMPLATE', text: EVENT.title,
      dates: fmtUTC(START) + '/' + fmtUTC(END),
      details: EVENT.details, location: EVENT.place
    });
  }

  // --- WhatsApp precompilato ---
  const waText = nome =>
    `Ciao ${nome}! Confermo la mia presenza al vostro matrimonio del 13 dicembre 2026.\n\n` +
    'Nome e cognome:\nNumero di persone:\nAllergie o intolleranze alimentari:';
  [['wa-davide', 'davide', 'Davide'], ['wa-amalia', 'amalia', 'Amalia']].forEach(([id, key, nome]) => {
    const a = document.getElementById(id);
    if (a) a.href = `https://wa.me/${WHATSAPP[key]}?text=${encodeURIComponent(waText(nome))}`;
  });

  // --- Copia IBAN ---
  const status = document.getElementById('copy-status');
  const say = msg => { status.textContent = msg; setTimeout(() => { status.textContent = ''; }, 3500); };
  document.getElementById('btn-copy')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(IBAN);
      say('IBAN copiato negli appunti');
    } catch {
      const t = Object.assign(document.createElement('textarea'), { value: IBAN });
      t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* ignora */ }
      t.remove();
      say(ok ? 'IBAN copiato negli appunti' : 'Non è stato possibile copiare: selezionalo a mano');
    }
  });

  // --- Comparsa allo scroll ---
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(i => io.observe(i));
  } else {
    items.forEach(i => i.classList.add('in'));
  }
})();
