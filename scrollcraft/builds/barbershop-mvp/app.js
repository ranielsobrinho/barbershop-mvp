/* Seu Carlos Barbearia · public landing + booking
   Vanilla, no build step. Talks to the same gateway the React app uses. */
(function () {
  'use strict';

  var API = (document.querySelector('meta[name="api-base"]') || {}).content || '';
  var FORCED_DEMO = /(?:\?|&)demo=1(?:&|$)/.test(location.search);
  var S = {
    services: [],
    serviceId: null,
    date: null,
    time: null,
    month: startOfMonth(new Date()),
    blocked: [],
    step: 1,
    demo: FORCED_DEMO,
    appointment: null,
    busy: false
  };

  var MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  var FALLBACK_SERVICES = [
    { id: 'corte', name: 'Corte', description: 'Corte de cabelo masculino na tesoura e máquina.', priceCents: 3000, slotMin: 30, active: true },
    { id: 'barba', name: 'Barba', description: 'Aparar, modelar e finalizar com toalha quente.', priceCents: 2000, slotMin: 30, active: true },
    { id: 'corte-barba', name: 'Corte + Barba', description: 'O serviço completo, com acabamento na navalha.', priceCents: 4500, slotMin: 60, active: true },
    { id: 'sobrancelha', name: 'Sobrancelha', description: 'Design masculino discreto, sem exagero.', priceCents: 1500, slotMin: 15, active: true }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var ym = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function money(cents) {
    return (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function svcById(id) {
    for (var i = 0; i < S.services.length; i++) if (S.services[i].id === id) return S.services[i];
    return null;
  }
  function longDate(d) {
    return d.getDate() + ' de ' + MONTHS[d.getMonth()] + ' de ' + d.getFullYear();
  }
  function shortDate(d) {
    return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
  }
  function sel(selStr, root) { return (root || document).querySelector(selStr); }
  function all(selStr, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selStr)); }

  /* ---------------------------------------------------------------- api -- */
  async function request(path, options) {
    var opt = Object.assign({ headers: { 'Content-Type': 'application/json' } }, options || {});
    var res = await fetch(API + path, opt);
    if (!res.ok) {
      var body = null;
      try { body = await res.json(); } catch (e) {}
      var err = new Error((body && (body.message || body.error)) || ('HTTP ' + res.status));
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return res.json();
  }

  /* --------------------------------------------------------------- load -- */
  async function load() {
    var results = await Promise.allSettled([
      request('/api/settings'),
      request('/api/services')
    ]);

    var settings = null;
    var services = null;

    if (results[0].status === 'fulfilled') settings = results[0].value && results[0].value.settings;
    if (results[1].status === 'fulfilled') services = results[1].value && results[1].value.services;

    if (settings) {
      if (settings.companyName) {
        var companyName = settings.companyName;
        document.title = companyName + ' · Agendamento';
        var description = document.querySelector('meta[name="description"]');
        if (description) description.content = 'Agende seu horário na ' + companyName + ' de forma rápida e simples.';
        var brand = sel('.brand');
        if (brand) { brand.setAttribute('aria-label', companyName + ', início'); brand.textContent = companyName; }
        ['heroTitle', 'aptShopName', 'footerCompanyName'].forEach(function (id) {
          var el = $(id);
          if (el) el.textContent = companyName;
        });
        all('.apt-card__shop').forEach(function (el) { el.textContent = companyName; });
      }
      if (settings.heroText) {
        var lede = $('heroLede');
        if (lede) lede.textContent = settings.heroText;
      }
      if (settings.heroImageUrl) {
        var img = $('heroImg');
        if (img) { img.src = settings.heroImageUrl; img.hidden = false; }
      }
    }

    if (!Array.isArray(services) || !services.length) {
      S.demo = true;
      services = FALLBACK_SERVICES;
    }
    S.services = services.filter(function (s) { return s.active !== false; });

    if (S.demo) {
      var tag = $('demoTag');
      if (tag) tag.hidden = false;
      document.documentElement.setAttribute('data-demo', 'true');
    }

    renderServiceRail();
    renderServiceOptions();
    paintCard(false);
    renderCalendar();
  }

  /* ------------------------------------------------------------ services -- */
  function renderServiceRail() {
    var host = $('svcCards');
    if (!host) return;
    host.innerHTML = S.services.map(function (s, i) {
      var n = String(i + 1).padStart(2, '0');
      return '' +
        '<article class="svc">' +
          '<span class="svc__no">' + n + '</span>' +
          '<h3 class="svc__name">' + esc(s.name) + '</h3>' +
          '<p class="svc__desc">' + esc(s.description || 'Acabamento caprichado, do jeito que você gosta.') + '</p>' +
          '<div class="svc__meta">' +
            '<span class="svc__time">' + (s.slotMin || 30) + ' min</span>' +
            '<span class="svc__price">' + money(s.priceCents) + '</span>' +
          '</div>' +
          '<button type="button" class="svc__pick" data-pick-service="' + esc(s.id) + '">Escolher</button>' +
        '</article>';
    }).join('');
  }

  function renderServiceOptions() {
    var host = $('serviceOptions');
    if (!host) return;
    host.innerHTML = S.services.map(function (s) {
      return '' +
        '<button type="button" class="svc-opt" role="radio" aria-checked="' + (S.serviceId === s.id ? 'true' : 'false') + '" data-service="' + esc(s.id) + '">' +
          '<span class="svc-opt__dot" aria-hidden="true"></span>' +
          '<span class="svc-opt__body">' +
            '<span class="svc-opt__name">' + esc(s.name) + '</span>' +
            '<span class="svc-opt__meta">' + (s.slotMin || 30) + ' min</span>' +
          '</span>' +
          '<span class="svc-opt__price">' + money(s.priceCents) + '</span>' +
        '</button>';
    }).join('');
  }

  function chooseService(id, opts) {
    if (!svcById(id)) return;
    S.serviceId = id;
    all('.svc-opt').forEach(function (b) {
      b.setAttribute('aria-checked', String(b.getAttribute('data-service') === id));
    });
    paintCard(true);
    if (opts && opts.advance) {
      goStep(2);
      if (opts.scroll) {
        var target = $('agendar');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /* -------------------------------------------------------------- stepper -- */
  function goStep(n) {
    S.step = n;
    all('[data-panel]').forEach(function (p) {
      p.hidden = Number(p.getAttribute('data-panel')) !== n;
    });
    all('[data-stepdot]').forEach(function (d) {
      d.classList.toggle('is-done', Number(d.getAttribute('data-stepdot')) <= Math.min(n, 4));
    });
    if (n >= 1 && n <= 5) {
      var h = $('stepTitle' + n);
      if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    }
  }

  /* ------------------------------------------------------------- calendar -- */
  function renderCalendar() {
    var grid = $('calGrid');
    var label = $('monthLabel');
    if (!grid || !label) return;
    var y = S.month.getFullYear(), m = S.month.getMonth();
    label.textContent = MONTHS[m] + ' ' + y;

    var first = new Date(y, m, 1);
    var days = new Date(y, m + 1, 0).getDate();
    var offset = first.getDay();
    var today = startOfDay(new Date());
    var thisMonth = startOfMonth(today);
    var prev = $('prevMonth');
    if (prev) prev.disabled = S.month.getTime() <= thisMonth.getTime();

    var html = '';
    for (var i = 0; i < offset; i++) html += '<span aria-hidden="true"></span>';
    for (var d = 1; d <= days; d++) {
      var date = new Date(y, m, d);
      var key = ymd(date);
      var past = date.getTime() < today.getTime();
      var blocked = S.blocked.indexOf(key) !== -1;
      var isToday = date.getTime() === today.getTime();
      var picked = S.date && ymd(S.date) === key;
      var cls = 'cal__day' + (isToday ? ' is-today' : '') + (picked ? ' is-picked' : '');
      html += '<button type="button" class="' + cls + '" data-day="' + d + '"' +
        (past || blocked ? ' disabled' : '') +
        ' aria-label="' + d + ' de ' + MONTHS[m] + (isToday ? ', hoje' : '') + (blocked ? ', indisponível' : '') + '"' +
        ' aria-pressed="' + (picked ? 'true' : 'false') + '">' + d + '</button>';
    }
    grid.innerHTML = html;
  }

  async function loadBlocked() {
    if (S.demo) { S.blocked = []; return; }
    try {
      var data = await request('/api/blocked-dates?month=' + ym(S.month));
      S.blocked = Array.isArray(data.dates) ? data.dates : [];
    } catch (e) {
      S.blocked = [];
    }
  }

  function pickDate(d) {
    var y = S.month.getFullYear(), m = S.month.getMonth();
    var date = new Date(y, m, d);
    if (date.getTime() < startOfDay(new Date()).getTime()) return;
    S.date = date;
    S.time = null;
    renderCalendar();
    paintCard(true);
    goStep(3);
    loadSlots();
  }

  /* ----------------------------------------------------------- slots -- */
  function demoSlots(date) {
    var dow = date.getDay();
    if (dow === 0) return [];
    var opens = dow === 6 ? 8 * 60 : 9 * 60;
    var closes = dow === 6 ? 14 * 60 : 18 * 60;
    var out = [];
    for (var m = opens; m + 30 <= closes; m += 30) {
      if (dow !== 6 && m >= 12 * 60 && m < 13 * 60) continue;
      out.push({ start: pad(Math.floor(m / 60)) + ':' + pad(m % 60),
                 end: pad(Math.floor((m + 30) / 60)) + ':' + pad((m + 30) % 60) });
    }
    return out;
  }

  async function loadSlots() {
    var grid = $('slotGrid');
    var empty = $('slotEmpty');
    var forEl = $('slotsFor');
    if (!grid || !empty || !S.date) return;

    if (forEl) forEl.textContent = longDate(S.date);
    grid.innerHTML = '';
    empty.hidden = true;

    var service = svcById(S.serviceId);
    if (!service) return;

    var slots = null;
    if (S.demo) {
      slots = demoSlots(S.date);
    } else {
      try {
        var data = await request('/api/availability?date=' + ymd(S.date) + '&serviceId=' + encodeURIComponent(S.serviceId));
        slots = Array.isArray(data.slots) ? data.slots : [];
      } catch (e) {
        slots = [];
      }
    }

    if (!slots.length) {
      empty.hidden = false;
      return;
    }

    grid.innerHTML = slots.map(function (s) {
      var picked = S.time === s.start;
      return '<button type="button" class="slot' + (picked ? ' is-picked' : '') + '" role="radio" aria-checked="' + (picked ? 'true' : 'false') + '" data-time="' + esc(s.start) + '">' + esc(s.start) + '</button>';
    }).join('');
  }

  function pickTime(time) {
    S.time = time;
    all('.slot').forEach(function (b) {
      var on = b.getAttribute('data-time') === time;
      b.classList.toggle('is-picked', on);
      b.setAttribute('aria-checked', String(on));
    });
    paintCard(true);
    goStep(4);
    var nameInput = $('nameInput');
    if (nameInput && !nameInput.value) {
      // focus only after the panel is shown, without yanking the page
      setTimeout(function () { try { nameInput.focus({ preventScroll: true }); } catch (e) { nameInput.focus(); } }, 60);
    }
  }

  /* ----------------------------------------------------- appointment card -- */
  function setRow(el, value, animate) {
    if (!el) return;
    var has = value != null && value !== '';
    var next = has ? value : '—';
    if (el.getAttribute('data-value') === next) return;
    el.setAttribute('data-value', next);
    el.textContent = next;
    el.classList.toggle('is-empty', !has);
    if (has && animate) {
      el.classList.remove('is-inked');
      void el.offsetWidth;
      el.classList.add('is-inked');
    }
  }

  function paintCard(animate) {
    var service = svcById(S.serviceId);
    setRow($('cardService'), service ? service.name : '', animate);
    setRow($('cardDate'), S.date ? shortDate(S.date) : '', animate);
    setRow($('cardTime'), S.time || '', animate);
    var nameInput = $('nameInput');
    setRow($('cardClient'), nameInput && nameInput.value.trim() ? nameInput.value.trim() : '', animate);
    var total = $('cardTotal');
    if (total) total.textContent = service ? money(service.priceCents) : '—';
  }

  function stampCard(appt) {
    var card = $('aptCard');
    var no = $('cardNo');
    var stampDate = $('stampDate');
    if (no) no.textContent = String(appt.id || '').replace(/^demo/i, '').slice(0, 8).toUpperCase() || '000000';
    if (stampDate && S.date) stampDate.textContent = shortDate(S.date) + (S.time ? ' · ' + S.time : '');
    if (card) card.classList.add('is-stamped');
  }

  function resetCard() {
    var card = $('aptCard');
    if (card) card.classList.remove('is-stamped');
    var no = $('cardNo');
    if (no) no.textContent = '—';
    var stampDate = $('stampDate');
    if (stampDate) stampDate.textContent = '';
    ['cardService', 'cardDate', 'cardTime', 'cardClient'].forEach(function (id) {
      var el = $(id);
      if (el) { el.setAttribute('data-value', ''); el.textContent = '—'; el.classList.add('is-empty'); el.classList.remove('is-inked'); }
    });
    var total = $('cardTotal');
    if (total) total.textContent = '—';
  }

  /* ---------------------------------------------------------------- phone -- */
  function maskPhone(v) {
    var d = String(v || '').replace(/\D/g, '').slice(0, 11);
    if (!d) return '';
    if (d.length <= 2) return '(' + d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  function phoneDigits(v) { return String(v || '').replace(/\D/g, ''); }

  function phoneCursorPosition(masked, digitsBeforeCursor, advanceSeparators) {
    var maxDigits = phoneDigits(masked).length;
    var target = Math.max(0, Math.min(digitsBeforeCursor, maxDigits));
    if (!target) return 0;

    var seen = 0;
    var pos = 0;
    while (pos < masked.length && seen < target) {
      if (/\d/.test(masked.charAt(pos))) seen++;
      pos++;
    }

    // After insertion, place the caret after punctuation the mask added at
    // this boundary (for example ") " after the area code or "-" in the number).
    // After deletion, stay before that punctuation so backspace can reach the
    // previous digit instead of repeatedly deleting a separator the mask restores.
    if (advanceSeparators) {
      while (pos < masked.length && /\D/.test(masked.charAt(pos))) pos++;
    }
    return pos;
  }

  /* ---------------------------------------------------------------- submit -- */
  async function submitBooking(ev) {
    ev.preventDefault();
    if (S.busy) return;
    var err = $('formError');
    if (err) err.hidden = true;

    var nameInput = $('nameInput');
    var phoneInput = $('phoneInput');
    var name = nameInput ? nameInput.value.trim() : '';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    var msg = '';
    if (name.length < 2) msg = 'Informe seu nome completo.';
    else if (!(phoneDigits(phone).length === 10 || phoneDigits(phone).length === 11)) msg = 'Telefone inválido. Use DDD e número.';
    if (msg) {
      if (err) { err.textContent = msg; err.hidden = false; }
      (name.length < 2 ? nameInput : phoneInput).focus();
      return;
    }

    var service = svcById(S.serviceId);
    if (!service || !S.date || !S.time) return;

    var local = S.date.getFullYear() + '-' + pad(S.date.getMonth() + 1) + '-' + pad(S.date.getDate());
    var startsAt = new Date(local + 'T' + S.time + ':00-03:00').toISOString();
    var btn = $('confirmBtn');
    S.busy = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Agendando...'; }

    try {
      var appt;
      if (S.demo) {
        await new Promise(function (r) { setTimeout(r, 650); });
        appt = {
          id: 'demo' + Math.random().toString(36).slice(2, 8).toUpperCase(),
          serviceId: service.id,
          customerName: name,
          customerPhone: phone,
          startsAt: startsAt,
          priceCents: service.priceCents,
          status: 'pending'
        };
      } else {
        var honeypot = $('honeypot');
        var data = await request('/api/appointments', {
          method: 'POST',
          body: JSON.stringify({
            serviceId: service.id,
            customerName: name,
            customerPhone: phone,
            startsAt: startsAt,
            website: honeypot ? honeypot.value : ''
          })
        });
        appt = data.appointment;
      }
      S.appointment = appt;
      finishBooking(appt);
    } catch (e) {
      if (e.status === 409) {
        S.time = null;
        paintCard(true);
        if (err) { err.textContent = 'Esse horário acabou de ser ocupado. Escolha outro.'; err.hidden = false; }
        goStep(3);
        loadSlots();
      } else {
        if (err) { err.textContent = 'Não foi possível concluir o agendamento. Tente novamente.'; err.hidden = false; }
      }
    } finally {
      S.busy = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Confirmar agendamento'; }
    }
  }

  function finishBooking(appt) {
    var service = svcById(appt.serviceId || S.serviceId);
    var date = S.date;
    var time = S.time;
    var setText = function (id, v) { var el = $(id); if (el) el.textContent = v; };
    setText('doneService', service ? service.name : 'Serviço');
    setText('doneDate', date ? longDate(date) : '—');
    setText('doneTime', time || '—');
    setText('doneTotal', money(appt.priceCents != null ? appt.priceCents : (service ? service.priceCents : 0)));
    stampCard(appt);
    goStep(5);
    var card = $('aptCard');
    if (card && window.innerWidth <= 1024) {
      setTimeout(function () { card.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 420);
    }
  }

  function resetBooking() {
    S.serviceId = null; S.date = null; S.time = null; S.appointment = null;
    S.month = startOfMonth(new Date()); S.blocked = [];
    resetCard();
    renderServiceOptions();
    renderCalendar();
    var nameInput = $('nameInput'); if (nameInput) nameInput.value = '';
    var phoneInput = $('phoneInput'); if (phoneInput) phoneInput.value = '';
    var err = $('formError'); if (err) err.hidden = true;
    goStep(1);
    var target = $('agendar');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------------------------------------------------------- events -- */
  function wire() {
    document.addEventListener('click', function (ev) {
      var t = ev.target.closest ? ev.target.closest('[data-pick-service],[data-service],[data-time],[data-day],[data-back],[data-nav]') : null;
      if (!t) return;

      if (t.hasAttribute('data-pick-service')) {
        ev.preventDefault();
        chooseService(t.getAttribute('data-pick-service'), { advance: true, scroll: true });
        return;
      }
      if (t.hasAttribute('data-service')) {
        chooseService(t.getAttribute('data-service'), { advance: true });
        return;
      }
      if (t.hasAttribute('data-time')) {
        pickTime(t.getAttribute('data-time'));
        return;
      }
      if (t.hasAttribute('data-day')) {
        pickDate(Number(t.getAttribute('data-day')));
        return;
      }
      if (t.hasAttribute('data-back')) {
        var n = Number(t.getAttribute('data-back'));
        if (n >= 1 && n <= 4) goStep(n);
        return;
      }
    });

    var prev = $('prevMonth');
    var next = $('nextMonth');
    if (prev) prev.addEventListener('click', function () {
      S.month = new Date(S.month.getFullYear(), S.month.getMonth() - 1, 1);
      loadBlocked().then(renderCalendar);
    });
    if (next) next.addEventListener('click', function () {
      S.month = new Date(S.month.getFullYear(), S.month.getMonth() + 1, 1);
      loadBlocked().then(renderCalendar);
    });

    var phoneInput = $('phoneInput');
    if (phoneInput) phoneInput.addEventListener('input', function (event) {
      var rawValue = phoneInput.value;
      var rawCursor = phoneInput.selectionStart;
      var digitsBeforeCursor = phoneDigits(rawValue.slice(0, rawCursor == null ? rawValue.length : rawCursor)).length;
      var masked = maskPhone(rawValue);
      var isDeletion = String(event.inputType || '').indexOf('delete') === 0;
      var cursor = phoneCursorPosition(masked, digitsBeforeCursor, !isDeletion);

      phoneInput.value = masked;
      try { phoneInput.setSelectionRange(cursor, cursor); } catch (e) {}
    });

    var nameInput = $('nameInput');
    if (nameInput) nameInput.addEventListener('input', function () { paintCard(true); });

    var form = $('detailsForm');
    if (form) form.addEventListener('submit', submitBooking);

    var again = $('newBooking');
    if (again) again.addEventListener('click', resetBooking);

    var year = $('year');
    if (year) year.textContent = new Date().getFullYear();

    window.addEventListener('resize', function () { /* engine re-measures rails */ }, { passive: true });
  }

  /* ----------------------------------------------------------------- boot -- */
  function boot() {
    wire();
    // Mount the engine before data arrives so the hero lands instantly; the pan
    // rail is measured per frame, so late cards need no remount.
    if (window.ScrollCraft) window.ScrollCraft.mount(document.body);
    load().then(function () {
      dispatchEvent(new Event('resize'));
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { dispatchEvent(new Event('resize')); });
      }
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { dispatchEvent(new Event('resize')); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
