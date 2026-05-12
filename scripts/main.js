/**
 * SMAS Mobility Fleet Report — MyGeotab Add-in
 * Merged UI + Data module following proper MyGeotab lifecycle pattern.
 */
(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // INLINE SVG ICONS (avoids Google Fonts CSP issues in MyGeotab iframe)
  // Same approach as the Import KML add-in.
  // ══════════════════════════════════════════════════════════════

  var ICONS = {
    'check_circle':       '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
    'extension':          '<path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7s2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>',
    'info':               '<path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
    'play_arrow':         '<path d="M8 5v14l11-7z"/>',
    'arrow_back':         '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>',
    'download':           '<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>',
    'chevron_left':       '<path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>',
    'chevron_right':      '<path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>',
    'expand_more':        '<path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>',
    'close':              '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
    'directions_car':     '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>',
    'inventory_2':        '<path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4l16-.02V7z"/>',
    'groups':             '<path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73L18 18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58A2.01 2.01 0 0 0 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85A6.95 6.95 0 0 0 20 14c-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>',
    'speed':              '<path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/>',
    'local_gas_station':  '<path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>',
    'cloud':              '<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>',
    'timer':              '<path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>',
    'report':             '<path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3 0-.72.58-1.3 1.3-1.3.72 0 1.3.58 1.3 1.3 0 .72-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z"/>',
    'battery_alert':      '<path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18h-2v-2h2v2zm0-4h-2V9h2v5z"/>',
    'fender_minor':       '<path d="M19 8h-1V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v2H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h1v3c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-3h6v3c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-3h1c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zM8 6h8v2H8V6z"/>',
    'car_crash':          '<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>',
    'progress_activity':  '<path d="M12 2v4c3.31 0 6 2.69 6 6h4c0-5.52-4.48-10-10-10z"/>',
    'radio_button_unchecked': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>'
  };

  function buildSvg(name, size) {
    var inner = ICONS[name];
    if (!inner) return '';
    size = size || 20;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="currentColor" aria-hidden="true">' + inner + '</svg>';
  }
  window.buildSvg = buildSvg;

  function setupIcons(root) {
    root = root || document;
    var spans = root.querySelectorAll('span.material-symbols-rounded');
    Array.prototype.forEach.call(spans, function (span) {
      if (span.querySelector('svg')) return; // already replaced
      var name = (span.textContent || '').trim();
      var path = ICONS[name];
      if (!path) return;
      var size = 18;
      if (span.classList.contains('smas-stat-icon')) size = 18;
      else if (span.classList.contains('trip-chevron')) size = 20;
      else if (span.parentElement && span.parentElement.classList.contains('smas-info-note')) size = 18;
      else if (span.parentElement && span.parentElement.tagName === 'BUTTON') size = 18;
      span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="currentColor" aria-hidden="true">' + path + '</svg>';
    });
  }
  window.setupIcons = setupIcons;

  // ══════════════════════════════════════════════════════════════
  // ADD-IN PILL POPOVER (description + Send feedback)
  // ══════════════════════════════════════════════════════════════

  var SUPPORT_EMAIL = 'farinnugraha@geotab.com';
  var ADDIN_DESCRIPTION = 'This add-in is provided on an "as-is" basis. You assume all risks and costs associated with its use, including any damage to equipment, software, or data. Geotab is not obligated to provide maintenance, technical support, or any other assistance for this tool.';

  function setupAddinPills() {
    var pills = document.querySelectorAll('.smas-addin-pill');
    Array.prototype.forEach.call(pills, function (pill) {
      if (pill.dataset.popoverInit) return;
      pill.dataset.popoverInit = '1';
      pill.style.cursor = 'pointer';
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');

      pill.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleAddinPopover(pill);
      });
      pill.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAddinPopover(pill);
        }
      });
    });

    document.addEventListener('click', function (e) {
      var pop = document.getElementById('smasAddinPopover');
      if (pop && !pop.contains(e.target) && !e.target.closest('.smas-addin-pill')) {
        pop.remove();
      }
    });
  }

  function toggleAddinPopover(pill) {
    var existing = document.getElementById('smasAddinPopover');
    if (existing) {
      existing.remove();
      return;
    }
    var pop = document.createElement('div');
    pop.id = 'smasAddinPopover';
    pop.className = 'smas-addin-popover';
    pop.innerHTML =
      '<p class="smas-addin-popover__text">' + ADDIN_DESCRIPTION + '</p>' +
      '<div class="smas-addin-popover__actions">' +
        '<button type="button" class="smas-btn smas-btn--primary smas-addin-popover__send">Send feedback</button>' +
        '<button type="button" class="smas-btn smas-btn--secondary smas-addin-popover__close">Close</button>' +
      '</div>';
    document.body.appendChild(pop);

    // Position fixed, clamped to viewport
    var rect = pill.getBoundingClientRect();
    var popWidth = 320;
    var margin = 16;
    var leftPos = Math.min(rect.left, window.innerWidth - popWidth - margin);
    leftPos = Math.max(margin, leftPos);

    pop.style.position = 'fixed';
    pop.style.top = (rect.bottom + 8) + 'px';
    pop.style.left = leftPos + 'px';

    pop.querySelector('.smas-addin-popover__send').addEventListener('click', function () {
      navigator.clipboard.writeText(SUPPORT_EMAIL).then(function () {
        var toast = document.getElementById('toast');
        if (toast) {
          toast.innerHTML = '<span class="material-symbols-rounded">check_circle</span>Email copied to clipboard.';
          setupIcons(toast);
          toast.classList.add('visible');
          setTimeout(function () { toast.classList.remove('visible'); }, 2500);
        }
        pop.remove();
      });
    });
    pop.querySelector('.smas-addin-popover__close').addEventListener('click', function () {
      pop.remove();
    });
  }
  window.setupAddinPills = setupAddinPills;

  // ══════════════════════════════════════════════════════════════
  // UI HELPERS (run immediately — available before geotab.addin)
  // ══════════════════════════════════════════════════════════════

  // Date defaults: first/last day of previous month
  (function initDateDefaults() {
    var now  = new Date();
    var y    = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    var m    = now.getMonth() === 0 ? 12 : now.getMonth();
    var last = new Date(y, m, 0).getDate();
    var pad  = function (n) { return String(n).padStart(2, '0'); };
    var startEl = document.getElementById('startDate');
    var endEl   = document.getElementById('endDate');
    if (startEl) startEl.value = y + '-' + pad(m) + '-01';
    if (endEl)   endEl.value   = y + '-' + pad(m) + '-' + pad(last);
  }());

  // Screen management
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('active');
    });
    var el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
    if (id === 'screen-preview') {
      renderVehicleTable();
      renderTripTable();
    }
    setupIcons();
  }
  window.showScreen = showScreen;

  function goBack() { showScreen('screen-config'); }
  window.goBack = goBack;

  // Validation
  function validate() {
    var s  = document.getElementById('startDate').value;
    var e  = document.getElementById('endDate').value;
    var si = document.getElementById('startDate');
    var ei = document.getElementById('endDate');
    var er = document.getElementById('dateError');
    si.classList.remove('input-error');
    ei.classList.remove('input-error');
    er.classList.remove('visible');
    if (!s || !e) return true;
    if (s >= e) {
      si.classList.add('input-error');
      ei.classList.add('input-error');
      er.classList.add('visible');
      return false;
    }
    return true;
  }
  (function initValidation() {
    var startEl = document.getElementById('startDate');
    var endEl   = document.getElementById('endDate');
    if (startEl) startEl.addEventListener('change', validate);
    if (endEl)   endEl.addEventListener('change', validate);
  }());

  // Generating animation
  var STEPS = [
    'Connecting to MyGeotab',
    'Fetching vehicle list',
    'Fetching trips',
    'Fetching fuel consumed & exceptions',
    'Fetching battery voltage data',
    'Building Excel report'
  ];

  var ICON_DONE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
  var ICON_SPIN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 14.03 20 13.07 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>';
  var ICON_DOT  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>';

  function renderSteps(activeIdx) {
    var html = '';
    STEPS.forEach(function (label, i) {
      var cls, icon;
      if (i < activeIdx)       { cls = 'step-done';    icon = ICON_DONE; }
      else if (i === activeIdx) { cls = 'step-active';  icon = ICON_SPIN; }
      else                      { cls = 'step-pending'; icon = ICON_DOT;  }
      html += '<div class="smas-step ' + cls + '">'
            + '<span class="smas-step-icon">' + icon + '</span>'
            + '<span class="smas-step-label">' + label + '</span>'
            + '</div>';
    });
    var el = document.getElementById('genSteps');
    if (el) el.innerHTML = html;
  }
  window.renderSteps = renderSteps;

  // Mockup-mode startGenerating (will be overwritten by live mode)
  function startGeneratingMockup() {
    if (!validate()) return;
    showScreen('screen-generating');

    var step = 2;
    renderSteps(step);

    var timer = setInterval(function () {
      step += 1;
      if (step >= STEPS.length) {
        clearInterval(timer);
        renderSteps(STEPS.length);
        var spinner = document.getElementById('genSpinner');
        if (spinner) spinner.style.opacity = '0';
        setTimeout(function () { showScreen('screen-preview'); }, 700);
        return;
      }
      renderSteps(step);
    }, 900);
  }
  window.startGenerating = startGeneratingMockup;

  // Mockup-mode downloadExcel
  function downloadExcelMockup() {
    var t = document.getElementById('toast');
    if (t) {
      t.classList.add('visible');
      setTimeout(function () { t.classList.remove('visible'); }, 3000);
    }
  }
  window.downloadExcel = downloadExcelMockup;

  // Pagination
  var PAGE_SIZE = 50;
  var vehicleCurrentPage = 1;

  function vehiclePage(delta) {
    var rows = document.querySelectorAll('#vehicleTbody tr');
    var totalPages = Math.ceil(rows.length / PAGE_SIZE);
    vehicleCurrentPage = Math.max(1, Math.min(vehicleCurrentPage + delta, totalPages));
    renderVehicleTable();
  }
  window.vehiclePage = vehiclePage;

  function renderVehicleTable() {
    var rows = Array.from(document.querySelectorAll('#vehicleTbody tr'));
    var total = rows.length;
    var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    var start = (vehicleCurrentPage - 1) * PAGE_SIZE;
    var end   = Math.min(start + PAGE_SIZE, total);

    rows.forEach(function (r, i) {
      r.style.display = (i >= start && i < end) ? '' : 'none';
    });

    var pageInfo = document.getElementById('vehiclePageInfo');
    var prevBtn  = document.getElementById('vehiclePrev');
    var nextBtn  = document.getElementById('vehicleNext');
    var heading  = document.getElementById('vehicleHeadingCount');

    if (pageInfo) pageInfo.textContent = 'Page ' + vehicleCurrentPage + ' of ' + totalPages;
    if (prevBtn)  prevBtn.disabled = vehicleCurrentPage === 1;
    if (nextBtn)  nextBtn.disabled = vehicleCurrentPage === totalPages;
    if (heading)  heading.textContent = 'showing ' + (start + 1) + '–' + end + ' of ' + total + ' vehicles';
  }
  window.renderVehicleTable = renderVehicleTable;

  var tripCurrentPage = 1;

  function tripPage(delta) {
    var rows = document.querySelectorAll('#tripTbody tr');
    var totalPages = Math.ceil(rows.length / PAGE_SIZE);
    tripCurrentPage = Math.max(1, Math.min(tripCurrentPage + delta, totalPages));
    renderTripTable();
  }
  window.tripPage = tripPage;

  function renderTripTable() {
    var rows = Array.from(document.querySelectorAll('#tripTbody tr'));
    var total = rows.length;
    var totalPages = Math.ceil(total / PAGE_SIZE) || 1;
    var start = (tripCurrentPage - 1) * PAGE_SIZE;
    var end   = Math.min(start + PAGE_SIZE, total);

    rows.forEach(function (r, i) {
      r.style.display = (i >= start && i < end) ? '' : 'none';
    });

    var pageInfo = document.getElementById('tripPageInfo');
    var prevBtn  = document.getElementById('tripPrev');
    var nextBtn  = document.getElementById('tripNext');
    var heading  = document.getElementById('tripHeadingCount');

    if (pageInfo) pageInfo.textContent = 'Page ' + tripCurrentPage + ' of ' + totalPages;
    if (prevBtn)  prevBtn.disabled = tripCurrentPage === 1;
    if (nextBtn)  nextBtn.disabled = tripCurrentPage === totalPages;
    if (heading)  heading.textContent = 'showing ' + (start + 1) + '–' + end + ' of ' + total + ' trips';
  }
  window.renderTripTable = renderTripTable;

  // Initial icon + popover wiring (runs immediately for mockup mode and
  // before the live add-in focus lifecycle fires)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setupIcons();
      setupAddinPills();
    });
  } else {
    setupIcons();
    setupAddinPills();
  }


  // ══════════════════════════════════════════════════════════════
  // GEOTAB ADD-IN LIFECYCLE + DATA MODULE
  // ══════════════════════════════════════════════════════════════

  window.geotab = window.geotab || {};
  window.geotab.addin = window.geotab.addin || {};

  geotab.addin.smasMobilityFleetReport = function () {
    var api = null;
    var state = null;
    var groupMap = {};
    var customerGroups = {};
    var lastSummaryRows = [];
    var lastTripRows = [];
    var lastDateRange = { start: '', end: '', database: '' };

    var RESULT_LIMIT = 25000;
    var TZ_OFFSET_HOURS = 7;
    var RATE_LIMIT_BATCH = 100;
    var RATE_LIMIT_DELAY_MS = 3000;

    // Promise wrappers
    function apiCall(method, params) {
      return new Promise(function (resolve, reject) {
        api.call(method, params, resolve, reject);
      });
    }
    function apiMultiCall(calls) {
      return new Promise(function (resolve, reject) {
        api.multiCall(calls, resolve, reject);
      });
    }

    function paginatedMultiCall(calls) {
      var results = [];
      var i = 0;
      function processNext() {
        if (i >= calls.length) return Promise.resolve(results);
        var batch = calls.slice(i, i + RATE_LIMIT_BATCH);
        i += RATE_LIMIT_BATCH;
        return apiMultiCall(batch).then(function (batchResults) {
          results = results.concat(batchResults);
          if (i < calls.length) {
            return new Promise(function (r) { setTimeout(r, RATE_LIMIT_DELAY_MS); }).then(processNext);
          }
          return results;
        });
      }
      return processNext();
    }

    function fetchAllByDateChunks(typeName, search, chunkDays) {
      chunkDays = chunkDays || 3;
      var startDt = new Date(search.fromDate);
      var endDt = new Date(search.toDate);
      var seen = {};
      var allRecords = [];

      function processChunk(chunkStart) {
        if (chunkStart >= endDt) return Promise.resolve(allRecords);
        var chunkEnd = new Date(Math.min(chunkStart.getTime() + chunkDays * 86400000, endDt.getTime()));
        var chunkToDt = chunkEnd < endDt ? new Date(chunkEnd.getTime() - 1000) : chunkEnd;
        var chunkSearch = Object.assign({}, search, {
          fromDate: toIso(chunkStart),
          toDate:   toIso(chunkToDt),
        });
        return apiCall('Get', { typeName: typeName, search: chunkSearch }).then(function (batch) {
          batch = batch || [];
          if (batch.length >= RESULT_LIMIT) {
            console.warn('Chunk hit ' + RESULT_LIMIT + ' limit: ' + chunkSearch.fromDate + ' → ' + chunkSearch.toDate);
          }
          batch.forEach(function (rec) {
            if (!seen[rec.id]) {
              seen[rec.id] = true;
              allRecords.push(rec);
            }
          });
          return processChunk(chunkEnd);
        });
      }
      return processChunk(startDt);
    }

    // Date / duration helpers
    function toIso(date) {
      return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }
    function localToUtcIso(localDateStr, isEnd) {
      var parts = localDateStr.split('-').map(Number);
      var localMs = Date.UTC(parts[0], parts[1] - 1, parts[2], isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0);
      return toIso(new Date(localMs - TZ_OFFSET_HOURS * 3600000));
    }
    function parseDuration(d) {
      if (!d) return 0;
      if (typeof d === 'string') {
        var m = d.match(/^(?:(\d+)\.)?(\d+):(\d+):(\d+(?:\.\d+)?)$/);
        if (m) {
          return parseInt(m[1] || '0', 10) * 86400
               + parseInt(m[2], 10) * 3600
               + parseInt(m[3], 10) * 60
               + parseFloat(m[4]);
        }
      }
      return 0;
    }
    function eventDurationSec(e) {
      var d = parseDuration(e.duration);
      if (d > 0) return d;
      if (e.activeFrom && e.activeTo) {
        return Math.max(0, (new Date(e.activeTo) - new Date(e.activeFrom)) / 1000);
      }
      return 0;
    }
    function fmtDuration(totalSec) {
      var s = Math.floor(totalSec || 0);
      var h = Math.floor(s / 3600);
      var mn = Math.floor((s % 3600) / 60);
      var sec = s % 60;
      return String(h).padStart(2, '0') + ':' + String(mn).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }
    function fmtDtLocal(dt) {
      if (!dt) return '';
      var utc = new Date(dt);
      var local = new Date(utc.getTime() + TZ_OFFSET_HOURS * 3600000);
      var Y = local.getUTCFullYear();
      var M = String(local.getUTCMonth() + 1).padStart(2, '0');
      var D = String(local.getUTCDate()).padStart(2, '0');
      var H = String(local.getUTCHours()).padStart(2, '0');
      var mn = String(local.getUTCMinutes()).padStart(2, '0');
      var S = String(local.getUTCSeconds()).padStart(2, '0');
      return Y + '-' + M + '-' + D + ' ' + H + ':' + mn + ':' + S;
    }
    function extractCustomerNames(groupIds) {
      var names = [];
      groupIds.forEach(function (gid) {
        var gname = groupMap[gid] || '';
        var re = /\[([^\[\]]+)\]/g;
        var m;
        while ((m = re.exec(gname)) !== null) names.push(m[1]);
      });
      return names.length ? names.join(', ') : 'N/A';
    }
    function fmtNum(n, decimals) {
      decimals = decimals == null ? 0 : decimals;
      if (n === 'N/A' || n === null || n === undefined) return 'N/A';
      return Number(n).toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    function escapeHtml(s) {
      if (s == null) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function setStep(stepIndex) {
      renderSteps(stepIndex);
    }

    // Customer dropdown
    function loadCustomerDropdown() {
      if (Object.keys(groupMap).length > 0) {
        return Promise.resolve();
      }
      return apiCall('Get', { typeName: 'Group' }).then(function (allGroups) {
        groupMap = {};
        customerGroups = {};
        allGroups.forEach(function (g) {
          groupMap[g.id] = g.name || '';
          var m = (g.name || '').match(/\[([^\[\]]+)\]/);
          if (m) customerGroups[g.id] = m[1];
        });
        var select = document.getElementById('groupSelect');
        if (!select) return;
        select.innerHTML = '<option value="">All Customers</option>';
        Object.keys(customerGroups).sort(function (a, b) {
          return customerGroups[a].localeCompare(customerGroups[b]);
        }).forEach(function (gid) {
          var opt = document.createElement('option');
          opt.value = gid;
          opt.textContent = customerGroups[gid];
          select.appendChild(opt);
        });
      });
    }

    // Main pipeline
    function generateReport(config) {
      var startDate = config.startDate;
      var endDate = config.endDate;
      var customerId = config.customerId;
      var battThreshold = config.battThreshold;
      var co2Factor = config.co2Factor;
      var startUtc = localToUtcIso(startDate, false);
      var endUtc = localToUtcIso(endDate, true);
      var nowUtc = toIso(new Date());
      var activeIds, devicesFiltered, deviceMap, deviceIds, archivedIds, nameToDids;
      var tripAgg = {}, rawTripsForSheet2 = [];
      var odometerKm = {}, fillupCount = {}, fillupVolume = {}, fuelConsumed = {};
      var idleEvts, minorEvts, majorEvts, speedEvts;
      var idlingCounts = {}, idlingDuration = {}, minorCounts = {}, majorCounts = {}, speedingCounts = {};
      var batteryVoltage = {};

      setStep(1);

      return Promise.resolve()
        .then(function () {
          if (Object.keys(groupMap).length) return;
          return apiCall('Get', { typeName: 'Group' }).then(function (allGroups) {
            allGroups.forEach(function (g) {
              groupMap[g.id] = g.name || '';
              var m = (g.name || '').match(/\[([^\[\]]+)\]/);
              if (m) customerGroups[g.id] = m[1];
            });
          });
        })
        .then(function () {
          return Promise.all([
            apiCall('Get', { typeName: 'Device', search: { fromDate: startUtc } }),
            apiCall('Get', { typeName: 'Device', search: { fromDate: nowUtc } }),
          ]);
        })
        .then(function (results) {
          var devicesRaw = results[0];
          var devicesActive = results[1];
          activeIds = new Set(devicesActive.map(function (d) { return d.id; }));
          devicesFiltered = devicesRaw;
          if (customerId) {
            devicesFiltered = devicesRaw.filter(function (d) {
              return (d.groups || []).some(function (g) { return g.id === customerId; });
            });
          }
          deviceMap = {};
          devicesFiltered.forEach(function (d) {
            var groupIds = (d.groups || []).map(function (g) { return g.id; });
            deviceMap[d.id] = {
              name: d.name || '',
              vin: d.vehicleIdentificationNumber || '',
              serial: d.serialNumber || '',
              customer: extractCustomerNames(groupIds),
            };
          });
          deviceIds = Object.keys(deviceMap);
          archivedIds = deviceIds.filter(function (did) { return !activeIds.has(did); });

          nameToDids = {};
          var ordered = deviceIds.filter(function (d) { return activeIds.has(d); }).concat(archivedIds);
          ordered.forEach(function (did) {
            var name = deviceMap[did].name;
            if (!nameToDids[name]) nameToDids[name] = [];
            nameToDids[name].push(did);
          });
          var vinToCanonical = {}, toMerge = {};
          Object.keys(nameToDids).forEach(function (name) {
            nameToDids[name].forEach(function (did) {
              var vin = (deviceMap[did].vin || '').trim();
              if (!vin) return;
              if (vinToCanonical[vin]) {
                var canon = vinToCanonical[vin];
                if (canon !== name && !toMerge[name]) toMerge[name] = canon;
              } else {
                vinToCanonical[vin] = name;
              }
            });
          });
          Object.keys(toMerge).forEach(function (name) {
            nameToDids[toMerge[name]] = nameToDids[toMerge[name]].concat(nameToDids[name]);
            delete nameToDids[name];
          });

          setStep(2);
          var tripCalls = deviceIds.map(function (did) {
            return ['Get', { typeName: 'Trip', search: { deviceSearch: { id: did }, fromDate: startUtc, toDate: endUtc } }];
          });
          return paginatedMultiCall(tripCalls);
        })
        .then(function (tripResults) {
          var tripsRaw = [];
          tripResults.forEach(function (r) { tripsRaw = tripsRaw.concat(r || []); });
          tripsRaw.forEach(function (t) {
            var did = t.device.id;
            if (!tripAgg[did]) tripAgg[did] = { max_speed: 0, total_drive_sec: 0 };
            var maxS = +(t.maximumSpeed || 0);
            var driveS = parseDuration(t.drivingDuration);
            var idleS = parseDuration(t.idlingDuration);
            tripAgg[did].max_speed = Math.max(tripAgg[did].max_speed, maxS);
            tripAgg[did].total_drive_sec += driveS;
            rawTripsForSheet2.push({
              did: did, start: t.start, stop: t.stop || t.nextTripStart,
              drive_sec: driveS, idle_sec: idleS, distance: +(t.distance || 0),
              max_speed: maxS, avg_speed: +(t.averageSpeed || 0), odo_km: +(t.odometer || 0) / 1000,
            });
          });

          setStep(3);
          var odoCalls = deviceIds.map(function (did) {
            return ['Get', { typeName: 'StatusData', search: {
              deviceSearch: { id: did }, diagnosticSearch: { id: 'DiagnosticOdometerAdjustmentId' },
              fromDate: endUtc, toDate: endUtc,
            }}];
          });
          return paginatedMultiCall(odoCalls);
        })
        .then(function (odoResults) {
          deviceIds.forEach(function (did, i) {
            var records = odoResults[i] || [];
            if (records.length) {
              var latest = records.reduce(function (a, b) {
                return new Date(a.dateTime) > new Date(b.dateTime) ? a : b;
              });
              odometerKm[did] = Math.round(+(latest.data || 0) / 1000 * 100) / 100;
            }
          });
          var fillupCalls = deviceIds.map(function (did) {
            return ['Get', { typeName: 'FillUp', search: { deviceSearch: { id: did }, fromDate: startUtc, toDate: endUtc } }];
          });
          return paginatedMultiCall(fillupCalls).catch(function () { return []; });
        })
        .then(function (fillupResults) {
          var allFillups = [];
          fillupResults.forEach(function (r) { allFillups = allFillups.concat(r || []); });
          allFillups.forEach(function (f) {
            var did = (f.device || {}).id;
            if (!did) return;
            var vol = +(f.volume || 0);
            var derived = +(f.derivedVolume || 0);
            var hasTransaction = String(f.confidence || '').indexOf('FuelTransaction') !== -1;
            var effectiveVol = hasTransaction ? (vol > 0 ? vol : derived) : (derived > 0 ? derived : vol);
            fillupCount[did] = (fillupCount[did] || 0) + 1;
            fillupVolume[did] = (fillupVolume[did] || 0) + effectiveVol;
          });
          var activeDeviceIds = deviceIds.filter(function (did) { return activeIds.has(did); });
          var fuelCalls = activeDeviceIds.map(function (did) {
            return ['Get', { typeName: 'FuelUsed', search: { deviceSearch: { id: did }, fromDate: startUtc, toDate: endUtc } }];
          });
          return paginatedMultiCall(fuelCalls).catch(function () { return []; });
        })
        .then(function (fuelResults) {
          var allFuel = [];
          fuelResults.forEach(function (r) { allFuel = allFuel.concat(r || []); });
          allFuel.forEach(function (f) {
            var did = (f.device || {}).id;
            if (did) fuelConsumed[did] = (fuelConsumed[did] || 0) + +(f.totalFuelUsed || 0);
          });
          return Promise.all([
            fetchAllByDateChunks('ExceptionEvent', { ruleSearch: { id: 'RuleIdlingId' }, fromDate: startUtc, toDate: endUtc }),
            fetchAllByDateChunks('ExceptionEvent', { ruleSearch: { id: 'RuleEnhancedMinorCollisionId' }, fromDate: startUtc, toDate: endUtc }),
            fetchAllByDateChunks('ExceptionEvent', { ruleSearch: { id: 'RuleEnhancedMajorCollisionId' }, fromDate: startUtc, toDate: endUtc }),
            fetchAllByDateChunks('ExceptionEvent', { ruleSearch: { id: 'RulePostedSpeedingId' }, fromDate: startUtc, toDate: endUtc }),
          ]);
        })
        .then(function (evtResults) {
          idleEvts = evtResults[0];
          minorEvts = evtResults[1];
          majorEvts = evtResults[2];
          speedEvts = evtResults[3];

          if (!archivedIds.length) return;
          function supplementalFetch(ruleId) {
            var reqs = archivedIds.map(function (did) {
              return ['Get', { typeName: 'ExceptionEvent', search: {
                deviceSearch: { id: did }, ruleSearch: { id: ruleId }, fromDate: startUtc, toDate: endUtc,
              }}];
            });
            return paginatedMultiCall(reqs).then(function (r) {
              var out = [];
              r.forEach(function (b) { out = out.concat(b || []); });
              return out;
            });
          }
          function mergeInto(base, extra) {
            var seen = {};
            base.forEach(function (e) { seen[e.id] = true; });
            extra.forEach(function (e) {
              if (!seen[e.id]) { seen[e.id] = true; base.push(e); }
            });
          }
          return Promise.all([
            supplementalFetch('RuleIdlingId'),
            supplementalFetch('RuleEnhancedMinorCollisionId'),
            supplementalFetch('RuleEnhancedMajorCollisionId'),
            supplementalFetch('RulePostedSpeedingId'),
          ]).then(function (extras) {
            mergeInto(idleEvts, extras[0]);
            mergeInto(minorEvts, extras[1]);
            mergeInto(majorEvts, extras[2]);
            mergeInto(speedEvts, extras[3]);
          });
        })
        .then(function () {
          idleEvts.forEach(function (e) {
            var did = (e.device || {}).id;
            if (did) {
              idlingCounts[did] = (idlingCounts[did] || 0) + 1;
              idlingDuration[did] = (idlingDuration[did] || 0) + eventDurationSec(e);
            }
          });
          minorEvts.forEach(function (e) { var d = (e.device || {}).id; if (d) minorCounts[d] = (minorCounts[d] || 0) + 1; });
          majorEvts.forEach(function (e) { var d = (e.device || {}).id; if (d) majorCounts[d] = (majorCounts[d] || 0) + 1; });
          speedEvts.forEach(function (e) { var d = (e.device || {}).id; if (d) speedingCounts[d] = (speedingCounts[d] || 0) + 1; });

          setStep(4);
          var activeDeviceIds = deviceIds.filter(function (did) { return activeIds.has(did); });
          var nowUtc = toIso(new Date());
          var battCalls = activeDeviceIds.map(function (did) {
            return ['Get', { typeName: 'StatusData', search: {
              deviceSearch: { id: did }, diagnosticSearch: { id: 'DiagnosticGoDeviceVoltageId' },
              fromDate: nowUtc, toDate: nowUtc,
            }}];
          });
          return paginatedMultiCall(battCalls).then(function (battResults) {
            activeDeviceIds.forEach(function (did, i) {
              var records = battResults[i] || [];
              if (records.length) {
                var latest = records.reduce(function (a, b) {
                  return new Date(a.dateTime) > new Date(b.dateTime) ? a : b;
                });
                batteryVoltage[did] = Math.round(+(latest.data || 0) * 100) / 100;
              }
            });
          });
        })
        .then(function () {
          setStep(5);
          var summaryRows = [];
          Object.keys(nameToDids).forEach(function (name) {
            var dids = nameToDids[name];
            var info = deviceMap[dids[0]];
            var maxSpd = 0;
            dids.forEach(function (d) { maxSpd = Math.max(maxSpd, (tripAgg[d] || {}).max_speed || 0); });
            var odoVals = dids.map(function (d) { return odometerKm[d]; }).filter(function (v) { return v != null; });
            var odo = odoVals.length ? Math.max.apply(null, odoVals) : null;
            var fuelL = 0;
            dids.forEach(function (d) { fuelL += fuelConsumed[d] || 0; });
            fuelL = Math.round(fuelL * 100) / 100;
            var co2Kg = fuelL > 0 ? Math.round(fuelL * co2Factor * 100) / 100 : 'N/A';
            var fCount = 0, fVol = 0;
            dids.forEach(function (d) { fCount += fillupCount[d] || 0; fVol += fillupVolume[d] || 0; });
            var fVolDisplay = (fCount > 0 && fVol < 0.001) ? 'N/A' : Math.round(fVol);
            var minor = 0, major = 0, idleC = 0, idleD = 0, spdC = 0;
            dids.forEach(function (d) {
              minor += minorCounts[d] || 0;
              major += majorCounts[d] || 0;
              idleC += idlingCounts[d] || 0;
              idleD += idlingDuration[d] || 0;
              spdC += speedingCounts[d] || 0;
            });
            var battV;
            dids.some(function (d) { if (batteryVoltage[d] != null) { battV = batteryVoltage[d]; return true; } });

            summaryRows.push({
              'Vehicle Name': info.name,
              'Customer': info.customer,
              'VIN': info.vin || 'N/A',
              'Serial No.': info.serial || 'N/A',
              'Odometer (km)': odo != null ? Math.round(odo) : 'N/A',
              'Fill-up Count': fCount,
              'Fill-up Volume (L)': fVolDisplay,
              'Fuel Consumed (L)': fuelL > 0 ? fuelL : 'N/A',
              'Max Speed (km/h)': Math.round(maxSpd * 10) / 10,
              'CO2 Emission (kg)': co2Kg,
              'Minor Collisions': minor,
              'Major Collisions': major,
              'Idle Event Count': idleC,
              'Total Idling': fmtDuration(idleD),
              'Speeding Events': spdC,
              'Battery Voltage (V)': battV != null ? Math.round(battV * 100) / 100 : 'N/A',
            });
          });

          var tripRows = rawTripsForSheet2.map(function (t) {
            var info = deviceMap[t.did] || {};
            return {
              'Vehicle Name': info.name || '',
              'Customer': info.customer || '',
              'VIN': info.vin || 'N/A',
              'Trip Start': fmtDtLocal(t.start),
              'Trip End': fmtDtLocal(t.stop),
              'Duration': fmtDuration(t.drive_sec),
              'Distance (km)': Math.round(t.distance * 100) / 100,
              'Avg Speed (km/h)': Math.round(t.avg_speed * 10) / 10,
              'Max Speed (km/h)': Math.round(t.max_speed * 10) / 10,
              'Idling Duration': fmtDuration(t.idle_sec),
              'Odometer End (km)': Math.round(t.odo_km),
            };
          });

          lastSummaryRows = summaryRows;
          lastTripRows = tripRows;
          lastDateRange = { start: startDate, end: endDate, database: state ? state.database : 'unknown' };

          return { summaryRows: summaryRows, tripRows: tripRows, archivedCount: archivedIds.length, battThreshold: battThreshold };
        });
    }

    // Render results
    function renderResults(data, battThreshold) {
      var totalVehicles = data.summaryRows.length;
      var customerSet = {};
      data.summaryRows.forEach(function (r) {
        if (r.Customer && r.Customer !== 'N/A') {
          r.Customer.split(', ').forEach(function (c) { customerSet[c] = true; });
        }
      });
      var totalCustomers = Object.keys(customerSet).length;
      var maxSpeed = 0, totalFuel = 0, totalCo2 = 0, totalMinor = 0, totalMajor = 0, totalIdleSec = 0, totalSpeed = 0, lowBatt = 0;
      data.summaryRows.forEach(function (r) {
        maxSpeed = Math.max(maxSpeed, +r['Max Speed (km/h)'] || 0);
        totalFuel += r['Fuel Consumed (L)'] === 'N/A' ? 0 : +r['Fuel Consumed (L)'];
        totalCo2 += r['CO2 Emission (kg)'] === 'N/A' ? 0 : +r['CO2 Emission (kg)'];
        totalMinor += +r['Minor Collisions'] || 0;
        totalMajor += +r['Major Collisions'] || 0;
        totalIdleSec += parseDuration(r['Total Idling']);
        totalSpeed += +r['Speeding Events'] || 0;
        if (r['Battery Voltage (V)'] !== 'N/A' && +r['Battery Voltage (V)'] < battThreshold) lowBatt++;
      });

      var stats = [
        { icon: 'directions_car',    label: 'Total Vehicles', value: fmtNum(totalVehicles) },
        { icon: 'inventory_2',       label: 'Archived (in Period)', value: fmtNum(data.archivedCount) },
        { icon: 'groups',            label: 'Total Customers', value: fmtNum(totalCustomers) },
        { icon: 'speed',             label: 'Max Speed (km/h)', value: fmtNum(maxSpeed, 1) },
        { icon: 'local_gas_station', label: 'Fuel Consumed (L)', value: fmtNum(totalFuel) },
        { icon: 'cloud',             label: 'CO₂ Emissions (kg)', value: fmtNum(totalCo2) },
        { icon: 'fender_minor',      label: 'Minor Collisions', value: fmtNum(totalMinor) },
        { icon: 'car_crash',         label: 'Major Collisions', value: fmtNum(totalMajor), warn: totalMajor > 0 },
        { icon: 'timer',             label: 'Total Idling', value: fmtDuration(totalIdleSec) },
        { icon: 'report',            label: 'Speeding Events', value: fmtNum(totalSpeed) },
        { icon: 'battery_alert',     label: 'Low Battery', value: fmtNum(lowBatt), warn: lowBatt > 0 },
      ];
      var statBar = document.querySelector('.smas-stat-bar');
      if (statBar) {
        statBar.innerHTML = stats.map(function (s) {
          return '<div class="smas-stat">'
            + '<div class="smas-stat-header">'
            + '<span class="material-symbols-rounded smas-stat-icon">' + s.icon + '</span>'
            + '<span class="smas-stat-label">' + s.label + '</span>'
            + '</div>'
            + '<span class="smas-stat-value' + (s.warn ? ' warn' : '') + '">' + s.value + '</span>'
            + '</div>';
        }).join('');
        if (typeof setupIcons === 'function') setupIcons(statBar);
      }

      var vTbody = document.getElementById('vehicleTbody');
      if (vTbody) {
        vTbody.innerHTML = data.summaryRows.map(function (r, i) {
          var battV = r['Battery Voltage (V)'];
          var battCls = (battV !== 'N/A' && +battV < battThreshold) ? 'num batt-low' : 'num';
          var majCls = (+r['Major Collisions'] > 0) ? 'num warn' : 'num';
          var fillVol = r['Fill-up Volume (L)'] === 'N/A' ? '<td class="num na">N/A</td>' : '<td class="num">' + fmtNum(r['Fill-up Volume (L)']) + '</td>';
          return '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(r['Vehicle Name']) + '</td><td>' + escapeHtml(r['Customer']) + '</td>'
            + '<td>' + escapeHtml(r['VIN']) + '</td><td>' + escapeHtml(r['Serial No.']) + '</td>'
            + '<td class="num">' + (r['Odometer (km)'] === 'N/A' ? '<span class="na">N/A</span>' : fmtNum(r['Odometer (km)'])) + '</td>'
            + '<td class="num">' + fmtNum(r['Fill-up Count']) + '</td>' + fillVol
            + '<td class="num">' + (r['Fuel Consumed (L)'] === 'N/A' ? '<span class="na">N/A</span>' : fmtNum(r['Fuel Consumed (L)'], 1)) + '</td>'
            + '<td class="num">' + fmtNum(r['Max Speed (km/h)'], 1) + '</td>'
            + '<td class="num">' + (r['CO2 Emission (kg)'] === 'N/A' ? '<span class="na">N/A</span>' : fmtNum(r['CO2 Emission (kg)'], 1)) + '</td>'
            + '<td class="num">' + fmtNum(r['Minor Collisions']) + '</td><td class="' + majCls + '">' + fmtNum(r['Major Collisions']) + '</td>'
            + '<td class="num">' + fmtNum(r['Idle Event Count']) + '</td><td>' + r['Total Idling'] + '</td>'
            + '<td class="num">' + fmtNum(r['Speeding Events']) + '</td>'
            + '<td class="' + battCls + '">' + (battV === 'N/A' ? '<span class="na">N/A</span>' : fmtNum(battV, 2)) + '</td></tr>';
        }).join('');
      }

      var tTbody = document.getElementById('tripTbody');
      if (tTbody) {
        tTbody.innerHTML = data.tripRows.slice(0, 500).map(function (r) {
          return '<tr><td>' + escapeHtml(r['Vehicle Name']) + '</td><td>' + escapeHtml(r['Customer']) + '</td>'
            + '<td>' + escapeHtml(r['VIN']) + '</td>'
            + '<td>' + escapeHtml(r['Trip Start']) + '</td><td>' + escapeHtml(r['Trip End']) + '</td>'
            + '<td>' + escapeHtml(r['Duration']) + '</td><td class="num">' + fmtNum(r['Distance (km)'], 2) + '</td>'
            + '<td class="num">' + fmtNum(r['Avg Speed (km/h)'], 1) + '</td><td class="num">' + fmtNum(r['Max Speed (km/h)'], 1) + '</td>'
            + '<td>' + escapeHtml(r['Idling Duration']) + '</td><td class="num">' + fmtNum(r['Odometer End (km)']) + '</td></tr>';
        }).join('');
      }

      vehicleCurrentPage = 1;
      tripCurrentPage = 1;
      renderVehicleTable();
      renderTripTable();
    }

    // Excel generation
    function downloadExcelLive() {
      if (!lastSummaryRows.length) return;
      if (typeof ExcelJS === 'undefined') {
        alert('ExcelJS library not loaded.');
        return;
      }
      var wb = new ExcelJS.Workbook();
      wb.creator = 'SMAS Mobility Fleet Report Add-in';
      var HEADER_BG = '1F3864', HEADER_FG = 'FFFFFF', ALT_ROW_BG = 'EBF3FB', BAD_BG = 'FCE4D6', BAD_FG = 'C00000';
      var battThreshold = +document.getElementById('battThreshold').value || 11.5;

      function thinBorder() {
        return { top: { style: 'thin', color: { argb: 'FFBFBFBF' } }, bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
                 left: { style: 'thin', color: { argb: 'FFBFBFBF' } }, right: { style: 'thin', color: { argb: 'FFBFBFBF' } } };
      }
      function styleHeader(ws, headers) {
        ws.addRow(headers);
        var headerRow = ws.getRow(1);
        headerRow.height = 22;
        headerRow.eachCell(function (cell) {
          cell.font = { name: 'Calibri', bold: true, color: { argb: 'FF' + HEADER_FG }, size: 10 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + HEADER_BG } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = thinBorder();
        });
        ws.views = [{ state: 'frozen', ySplit: 1 }];
      }
      function autoWidth(ws, headers) {
        headers.forEach(function (h, i) {
          var maxLen = h.length;
          ws.eachRow(function (row) {
            var v = row.getCell(i + 1).value;
            if (v != null) maxLen = Math.max(maxLen, String(v).length);
          });
          ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 3, 10), 35);
        });
      }

      var ws1 = wb.addWorksheet('Vehicle Summary');
      var s1Cols = Object.keys(lastSummaryRows[0]);
      styleHeader(ws1, s1Cols);
      lastSummaryRows.forEach(function (row, idx) {
        var values = s1Cols.map(function (c) { return row[c]; });
        var r = ws1.addRow(values);
        var bg = (idx + 2) % 2 === 0 ? ALT_ROW_BG : 'FFFFFF';
        r.eachCell(function (cell, colNumber) {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.border = thinBorder();
          var colName = s1Cols[colNumber - 1];
          if (colName === 'Battery Voltage (V)') {
            var v = parseFloat(cell.value);
            if (!isNaN(v) && v < battThreshold) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BAD_BG } };
              cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF' + BAD_FG } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } };
            }
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } };
          }
        });
      });
      autoWidth(ws1, s1Cols);

      var ws2 = wb.addWorksheet('Trip Detail');
      if (lastTripRows.length) {
        var s2Cols = Object.keys(lastTripRows[0]);
        styleHeader(ws2, s2Cols);
        lastTripRows.forEach(function (row, idx) {
          var values = s2Cols.map(function (c) { return row[c]; });
          var r = ws2.addRow(values);
          var bg = (idx + 2) % 2 === 0 ? ALT_ROW_BG : 'FFFFFF';
          r.eachCell(function (cell) {
            cell.font = { name: 'Calibri', size: 10 };
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            cell.border = thinBorder();
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } };
          });
        });
        autoWidth(ws2, s2Cols);
      }

      wb.xlsx.writeBuffer().then(function (buf) {
        var blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'SMAS_Mobility_Fleet_Report_' + lastDateRange.database + '_' + lastDateRange.start + '_to_' + lastDateRange.end + '.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        var t = document.getElementById('toast');
        if (t) { t.classList.add('visible'); setTimeout(function () { t.classList.remove('visible'); }, 3000); }
      });
    }

    // Live generate handler
    function handleGenerate() {
      var startDate = document.getElementById('startDate').value;
      var endDate = document.getElementById('endDate').value;
      if (!startDate || !endDate || startDate >= endDate) {
        alert('Please pick a valid date range.');
        return;
      }
      var customerId = document.getElementById('groupSelect').value || '';
      var battThreshold = +document.getElementById('battThreshold').value || 11.5;
      var co2Factor = 2.31;

      showScreen('screen-generating');
      setStep(0);

      generateReport({ startDate: startDate, endDate: endDate, customerId: customerId, battThreshold: battThreshold, co2Factor: co2Factor })
        .then(function (data) {
          renderResults(data, battThreshold);
          showScreen('screen-preview');
        })
        .catch(function (e) {
          console.error('Report generation failed:', e);
          alert('Report generation failed: ' + (e && e.message ? e.message : String(e)));
          showScreen('screen-config');
        });
    }

    // Lifecycle
    return {
      initialize: function (api_, state_, callback) {
        api = api_;
        state = state_;
        window.startGenerating = handleGenerate;
        window.downloadExcel = downloadExcelLive;
        callback();
      },
      focus: function (api_, state_) {
        api = api_;
        state = state_;
        var container = document.getElementById('smasMobilityFleetReport');
        if (container) container.style.display = 'block';
        if (typeof setupIcons === 'function') setupIcons();
        if (typeof setupAddinPills === 'function') setupAddinPills();
        loadCustomerDropdown().catch(function (e) { console.warn('Failed to load customer dropdown:', e); });
      },
      blur: function () {
        var container = document.getElementById('smasMobilityFleetReport');
        if (container) container.style.display = 'none';
      },
    };
  };

}());
