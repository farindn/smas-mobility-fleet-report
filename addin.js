/**
 * SMAS Mobility Fleet Report — MyGeotab Add-in
 *
 * Ports the data-fetching, aggregation, and Excel-generation logic from
 * smas_mobility_fleet_report.ipynb to JavaScript so the report can be run
 * directly inside MyGeotab without leaving the browser.
 *
 * Lifecycle hook: geotab.addin.smasMobilityFleetReport
 */
geotab.addin.smasMobilityFleetReport = function () {
  'use strict';

  // ── Module state ─────────────────────────────────────────────
  let api = null;
  let state = null;
  let groupMap = {};
  let customerGroups = {};
  let lastSummaryRows = [];
  let lastTripRows = [];
  let lastDateRange = { start: '', end: '', database: '' };

  const RESULT_LIMIT = 25000;
  const TZ_OFFSET_HOURS = 7;          // Asia/Jakarta — fixed UTC+7, no DST
  const RATE_LIMIT_BATCH = 100;       // multiCall batch size
  const RATE_LIMIT_DELAY_MS = 3000;   // delay between batches

  // ── Promise wrappers around MyGeotab JS API ──────────────────
  const apiCall = (method, params) => new Promise((resolve, reject) => {
    api.call(method, params, resolve, reject);
  });

  const apiMultiCall = (calls) => new Promise((resolve, reject) => {
    api.multiCall(calls, resolve, reject);
  });

  /** Batch a large list of Get requests with a delay between batches to stay
   *  under the 2000 calls/min rate limit. */
  async function paginatedMultiCall(calls) {
    const results = [];
    for (let i = 0; i < calls.length; i += RATE_LIMIT_BATCH) {
      const batch = calls.slice(i, i + RATE_LIMIT_BATCH);
      const batchResults = await apiMultiCall(batch);
      results.push(...batchResults);
      if (i + RATE_LIMIT_BATCH < calls.length) {
        await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY_MS));
      }
    }
    return results;
  }

  /** Fetch records by chunking the date range to bypass the 25k result limit.
   *  Deduplicates by event id to handle records appearing at chunk boundaries. */
  async function fetchAllByDateChunks(typeName, search, chunkDays) {
    chunkDays = chunkDays || 3;
    const startDt = new Date(search.fromDate);
    const endDt = new Date(search.toDate);
    const seen = new Set();
    const allRecords = [];
    let chunkStart = startDt;

    while (chunkStart < endDt) {
      let chunkEnd = new Date(chunkStart.getTime() + chunkDays * 86400000);
      if (chunkEnd > endDt) chunkEnd = endDt;
      const chunkToDt = chunkEnd < endDt
        ? new Date(chunkEnd.getTime() - 1000)
        : chunkEnd;

      const chunkSearch = Object.assign({}, search, {
        fromDate: toIso(chunkStart),
        toDate:   toIso(chunkToDt),
      });

      const batch = (await apiCall('Get', { typeName, search: chunkSearch })) || [];
      if (batch.length >= RESULT_LIMIT) {
        console.warn(`Chunk hit ${RESULT_LIMIT} limit: ${chunkSearch.fromDate} → ${chunkSearch.toDate} (data may be truncated)`);
      }
      batch.forEach(rec => {
        const rid = rec.id;
        if (!seen.has(rid)) {
          seen.add(rid);
          allRecords.push(rec);
        }
      });
      chunkStart = chunkEnd;
    }

    return allRecords;
  }

  // ── Date / duration helpers ──────────────────────────────────
  function toIso(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  /** Convert a local YYYY-MM-DD date in Asia/Jakarta to a UTC ISO string.
   *  isEnd: true → end-of-day (23:59:59), else start-of-day (00:00:00). */
  function localToUtcIso(localDateStr, isEnd) {
    const [y, m, d] = localDateStr.split('-').map(Number);
    const localMs = Date.UTC(y, m - 1, d, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0);
    return toIso(new Date(localMs - TZ_OFFSET_HOURS * 3600000));
  }

  /** Parse a .NET TimeSpan string ("HH:MM:SS" or "D.HH:MM:SS") to seconds. */
  function parseDuration(d) {
    if (!d) return 0;
    if (typeof d === 'string') {
      const m = d.match(/^(?:(\d+)\.)?(\d+):(\d+):(\d+(?:\.\d+)?)$/);
      if (m) {
        return parseInt(m[1] || '0', 10) * 86400
             + parseInt(m[2], 10) * 3600
             + parseInt(m[3], 10) * 60
             + parseFloat(m[4]);
      }
    }
    return 0;
  }

  /** Total seconds between activeFrom and activeTo (or duration if available). */
  function eventDurationSec(e) {
    const d = parseDuration(e.duration);
    if (d > 0) return d;
    if (e.activeFrom && e.activeTo) {
      const diff = (new Date(e.activeTo) - new Date(e.activeFrom)) / 1000;
      return Math.max(0, diff);
    }
    return 0;
  }

  function fmtDuration(totalSec) {
    const s = Math.floor(totalSec || 0);
    const h = Math.floor(s / 3600);
    const mn = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return String(h).padStart(2, '0') + ':' + String(mn).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  function fmtDtLocal(dt) {
    if (!dt) return '';
    const utc = new Date(dt);
    const local = new Date(utc.getTime() + TZ_OFFSET_HOURS * 3600000);
    const Y = local.getUTCFullYear();
    const M = String(local.getUTCMonth() + 1).padStart(2, '0');
    const D = String(local.getUTCDate()).padStart(2, '0');
    const H = String(local.getUTCHours()).padStart(2, '0');
    const mn = String(local.getUTCMinutes()).padStart(2, '0');
    const S = String(local.getUTCSeconds()).padStart(2, '0');
    return `${Y}-${M}-${D} ${H}:${mn}:${S}`;
  }

  function extractCustomerNames(groupIds) {
    const names = [];
    groupIds.forEach(gid => {
      const gname = groupMap[gid] || '';
      const re = /\[([^\[\]]+)\]/g;
      let m;
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

  // ── Step UI helper ───────────────────────────────────────────
  function setStep(stepIndex) {
    if (typeof window.renderSteps === 'function') {
      window.renderSteps(stepIndex);
    }
  }

  // ── Customer dropdown population ─────────────────────────────
  async function loadCustomerDropdown() {
    if (Object.keys(groupMap).length === 0) {
      const allGroups = await apiCall('Get', { typeName: 'Group' });
      groupMap = {};
      customerGroups = {};
      allGroups.forEach(g => {
        groupMap[g.id] = g.name || '';
        const m = (g.name || '').match(/\[([^\[\]]+)\]/);
        if (m) customerGroups[g.id] = m[1];
      });
    }
    const select = document.getElementById('groupSelect');
    if (!select) return;
    select.innerHTML = '<option value="">All Customers</option>';
    Object.entries(customerGroups)
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([gid, cname]) => {
        const opt = document.createElement('option');
        opt.value = gid;
        opt.textContent = cname;
        select.appendChild(opt);
      });
  }

  // ── Main pipeline ────────────────────────────────────────────
  async function generateReport(config) {
    const { startDate, endDate, customerId, battThreshold, co2Factor } = config;
    const startUtc = localToUtcIso(startDate, false);
    const endUtc   = localToUtcIso(endDate, true);
    const nowUtc   = toIso(new Date());

    // Step 0: Connecting (already done — api is authenticated)
    setStep(1); // Fetching vehicle list

    // 1) Groups (cached)
    if (Object.keys(groupMap).length === 0) {
      const allGroups = await apiCall('Get', { typeName: 'Group' });
      allGroups.forEach(g => {
        groupMap[g.id] = g.name || '';
        const m = (g.name || '').match(/\[([^\[\]]+)\]/);
        if (m) customerGroups[g.id] = m[1];
      });
    }

    // 2) Devices
    const devicesRaw    = await apiCall('Get', { typeName: 'Device', search: { fromDate: startUtc } });
    const devicesActive = await apiCall('Get', { typeName: 'Device', search: { fromDate: nowUtc } });
    const activeIds = new Set(devicesActive.map(d => d.id));

    // 3) Customer filter
    let devicesFiltered = devicesRaw;
    if (customerId) {
      devicesFiltered = devicesRaw.filter(d =>
        (d.groups || []).some(g => g.id === customerId));
    }

    // 4) Device map
    const deviceMap = {};
    devicesFiltered.forEach(d => {
      const groupIds = (d.groups || []).map(g => g.id);
      deviceMap[d.id] = {
        name:     d.name || '',
        vin:      d.vehicleIdentificationNumber || '',
        serial:   d.serialNumber || '',
        customer: extractCustomerNames(groupIds),
      };
    });
    const deviceIds   = Object.keys(deviceMap);
    const archivedIds = deviceIds.filter(did => !activeIds.has(did));

    // 5) name → [device_ids] (active first, then archived)
    const nameToDids = {};
    const ordered = [...deviceIds.filter(d => activeIds.has(d)), ...archivedIds];
    ordered.forEach(did => {
      const name = deviceMap[did].name;
      if (!nameToDids[name]) nameToDids[name] = [];
      nameToDids[name].push(did);
    });

    // 6) VIN-based merge
    const vinToCanonical = {};
    const toMerge = {};
    Object.entries(nameToDids).forEach(([name, dids]) => {
      dids.forEach(did => {
        const vin = (deviceMap[did].vin || '').trim();
        if (!vin) return;
        if (vinToCanonical[vin]) {
          const canon = vinToCanonical[vin];
          if (canon !== name && !toMerge[name]) toMerge[name] = canon;
        } else {
          vinToCanonical[vin] = name;
        }
      });
    });
    Object.entries(toMerge).forEach(([name, canon]) => {
      nameToDids[canon] = nameToDids[canon].concat(nameToDids[name]);
      delete nameToDids[name];
    });

    setStep(2); // Fetching trips

    // 7) Trips per device
    const tripCalls = deviceIds.map(did => ['Get', {
      typeName: 'Trip',
      search: { deviceSearch: { id: did }, fromDate: startUtc, toDate: endUtc },
    }]);
    const tripResults = await paginatedMultiCall(tripCalls);
    const tripsRaw = tripResults.flatMap(r => r || []);

    const tripAgg = {};
    const rawTripsForSheet2 = [];
    tripsRaw.forEach(t => {
      const did = t.device.id;
      if (!tripAgg[did]) tripAgg[did] = { max_speed: 0, total_drive_sec: 0 };
      const maxS = +(t.maximumSpeed || 0);
      const driveS = parseDuration(t.drivingDuration);
      const idleS  = parseDuration(t.idlingDuration);
      tripAgg[did].max_speed = Math.max(tripAgg[did].max_speed, maxS);
      tripAgg[did].total_drive_sec += driveS;

      rawTripsForSheet2.push({
        did,
        start:    t.start,
        stop:     t.stop || t.nextTripStart,
        drive_sec: driveS,
        idle_sec:  idleS,
        distance:  +(t.distance || 0),
        max_speed: maxS,
        avg_speed: +(t.averageSpeed || 0),
        odo_km:    +(t.odometer || 0) / 1000,
      });
    });

    setStep(3); // Fetching fuel consumed & exceptions

    // 8) Odometer (StatusData with DiagnosticOdometerAdjustmentId at end_utc)
    const odoCalls = deviceIds.map(did => ['Get', {
      typeName: 'StatusData',
      search: {
        deviceSearch:     { id: did },
        diagnosticSearch: { id: 'DiagnosticOdometerAdjustmentId' },
        fromDate: endUtc, toDate: endUtc,
      },
    }]);
    const odoResults = await paginatedMultiCall(odoCalls);
    const odometerKm = {};
    deviceIds.forEach((did, i) => {
      const records = odoResults[i] || [];
      if (records.length) {
        const latest = records.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b);
        odometerKm[did] = Math.round(+(latest.data || 0) / 1000 * 100) / 100;
      }
    });

    // 9) Fill-ups
    const fillupCount = {};
    const fillupVolume = {};
    try {
      const fillupCalls = deviceIds.map(did => ['Get', {
        typeName: 'FillUp',
        search: { deviceSearch: { id: did }, fromDate: startUtc, toDate: endUtc },
      }]);
      const fillupResults = await paginatedMultiCall(fillupCalls);
      fillupResults.flatMap(r => r || []).forEach(f => {
        const did = (f.device || {}).id;
        if (!did) return;
        const vol     = +(f.volume || 0);
        const derived = +(f.derivedVolume || 0);
        // Mirror exact MYG FillUpRecord.Volume precedence
        const hasTransaction = String(f.confidence || '').indexOf('FuelTransaction') !== -1;
        let effectiveVol;
        if (hasTransaction) {
          effectiveVol = vol > 0 ? vol : derived;
        } else {
          effectiveVol = derived > 0 ? derived : vol;
        }
        fillupCount[did]  = (fillupCount[did] || 0) + 1;
        fillupVolume[did] = (fillupVolume[did] || 0) + effectiveVol;
      });
    } catch (e) {
      console.warn('FillUp fetch failed:', e);
    }

    // 10) Fuel consumed (active devices only — matches MYG fuel report scope)
    const fuelConsumed = {};
    try {
      const activeDeviceIds = deviceIds.filter(did => activeIds.has(did));
      const fuelCalls = activeDeviceIds.map(did => ['Get', {
        typeName: 'FuelUsed',
        search: { deviceSearch: { id: did }, fromDate: startUtc, toDate: endUtc },
      }]);
      const fuelResults = await paginatedMultiCall(fuelCalls);
      fuelResults.flatMap(r => r || []).forEach(f => {
        const did = (f.device || {}).id;
        if (did) fuelConsumed[did] = (fuelConsumed[did] || 0) + +(f.totalFuelUsed || 0);
      });
    } catch (e) {
      console.warn('FuelUsed fetch failed:', e);
    }

    // 11) Exception events (chunked by date)
    const idleEvts  = await fetchAllByDateChunks('ExceptionEvent', { ruleSearch: { id: 'RuleIdlingId' },                    fromDate: startUtc, toDate: endUtc });
    const minorEvts = await fetchAllByDateChunks('ExceptionEvent', { ruleSearch: { id: 'RuleEnhancedMinorCollisionId' },    fromDate: startUtc, toDate: endUtc });
    const majorEvts = await fetchAllByDateChunks('ExceptionEvent', { ruleSearch: { id: 'RuleEnhancedMajorCollisionId' },    fromDate: startUtc, toDate: endUtc });
    const speedEvts = await fetchAllByDateChunks('ExceptionEvent', { ruleSearch: { id: 'RulePostedSpeedingId' },            fromDate: startUtc, toDate: endUtc });

    // 12) Supplemental per-device exceptions for archived devices
    if (archivedIds.length) {
      async function supplementalFetch(ruleId) {
        const reqs = archivedIds.map(did => ['Get', {
          typeName: 'ExceptionEvent',
          search: {
            deviceSearch: { id: did },
            ruleSearch:   { id: ruleId },
            fromDate: startUtc, toDate: endUtc,
          },
        }]);
        const r = await paginatedMultiCall(reqs);
        return r.flatMap(b => b || []);
      }
      function mergeInto(base, extra) {
        const seen = new Set(base.map(e => e.id));
        extra.forEach(e => {
          if (!seen.has(e.id)) { seen.add(e.id); base.push(e); }
        });
      }
      mergeInto(idleEvts,  await supplementalFetch('RuleIdlingId'));
      mergeInto(minorEvts, await supplementalFetch('RuleEnhancedMinorCollisionId'));
      mergeInto(majorEvts, await supplementalFetch('RuleEnhancedMajorCollisionId'));
      mergeInto(speedEvts, await supplementalFetch('RulePostedSpeedingId'));
    }

    // Aggregate exceptions by device
    const idlingCounts = {}, idlingDuration = {};
    idleEvts.forEach(e => {
      const did = (e.device || {}).id;
      if (did) {
        idlingCounts[did]   = (idlingCounts[did]   || 0) + 1;
        idlingDuration[did] = (idlingDuration[did] || 0) + eventDurationSec(e);
      }
    });
    const minorCounts = {}, majorCounts = {}, speedingCounts = {};
    minorEvts.forEach(e => { const d = (e.device || {}).id; if (d) minorCounts[d]    = (minorCounts[d]    || 0) + 1; });
    majorEvts.forEach(e => { const d = (e.device || {}).id; if (d) majorCounts[d]    = (majorCounts[d]    || 0) + 1; });
    speedEvts.forEach(e => { const d = (e.device || {}).id; if (d) speedingCounts[d] = (speedingCounts[d] || 0) + 1; });

    setStep(4); // Fetching battery voltage data

    // 13) Battery voltage (active devices only — archived returns stale data)
    const activeDeviceIds = deviceIds.filter(did => activeIds.has(did));
    const battCalls = activeDeviceIds.map(did => ['Get', {
      typeName: 'StatusData',
      search: {
        deviceSearch:     { id: did },
        diagnosticSearch: { id: 'DiagnosticGoDeviceVoltageId' },
        fromDate: nowUtc, toDate: nowUtc,
      },
    }]);
    const battResults = await paginatedMultiCall(battCalls);
    const batteryVoltage = {};
    activeDeviceIds.forEach((did, i) => {
      const records = battResults[i] || [];
      if (records.length) {
        const latest = records.reduce((a, b) => new Date(a.dateTime) > new Date(b.dateTime) ? a : b);
        batteryVoltage[did] = Math.round(+(latest.data || 0) * 100) / 100;
      }
    });

    setStep(5); // Building Excel report

    // 14) Build summary rows
    const summaryRows = [];
    Object.entries(nameToDids).forEach(([name, dids]) => {
      const info = deviceMap[dids[0]];
      const maxSpd = Math.max(0, ...dids.map(d => (tripAgg[d] || {}).max_speed || 0));
      const odoVals = dids.map(d => odometerKm[d]).filter(v => v != null);
      const odo = odoVals.length ? Math.max(...odoVals) : null;
      const fuelL  = Math.round(dids.reduce((s, d) => s + (fuelConsumed[d] || 0), 0) * 100) / 100;
      const co2Kg  = fuelL > 0 ? Math.round(fuelL * co2Factor * 100) / 100 : 'N/A';
      const fCount = dids.reduce((s, d) => s + (fillupCount[d] || 0), 0);
      const fVol   = dids.reduce((s, d) => s + (fillupVolume[d] || 0), 0);
      const fVolDisplay = (fCount > 0 && fVol < 0.001) ? 'N/A' : Math.round(fVol);
      const minor  = dids.reduce((s, d) => s + (minorCounts[d]    || 0), 0);
      const major  = dids.reduce((s, d) => s + (majorCounts[d]    || 0), 0);
      const idleC  = dids.reduce((s, d) => s + (idlingCounts[d]   || 0), 0);
      const idleD  = dids.reduce((s, d) => s + (idlingDuration[d] || 0), 0);
      const spdC   = dids.reduce((s, d) => s + (speedingCounts[d] || 0), 0);
      const battV  = dids.map(d => batteryVoltage[d]).find(v => v != null);

      summaryRows.push({
        'Vehicle Name':        info.name,
        'Customer':            info.customer,
        'VIN':                 info.vin || 'N/A',
        'Serial No.':          info.serial || 'N/A',
        'Odometer (km)':       odo != null ? Math.round(odo) : 'N/A',
        'Fill-up Count':       fCount,
        'Fill-up Volume (L)':  fVolDisplay,
        'Fuel Consumed (L)':   fuelL > 0 ? fuelL : 'N/A',
        'Max Speed (km/h)':    Math.round(maxSpd * 10) / 10,
        'CO2 Emission (kg)':   co2Kg,
        'Minor Collisions':    minor,
        'Major Collisions':    major,
        'Idle Event Count':    idleC,
        'Total Idling':        fmtDuration(idleD),
        'Speeding Events':     spdC,
        'Battery Voltage (V)': battV != null ? Math.round(battV * 100) / 100 : 'N/A',
      });
    });

    // 15) Build trip rows
    const tripRows = rawTripsForSheet2.map(t => {
      const info = deviceMap[t.did] || {};
      return {
        'Vehicle Name':      info.name || '',
        'Customer':          info.customer || '',
        'VIN':               info.vin || 'N/A',
        'Trip Start':        fmtDtLocal(t.start),
        'Trip End':          fmtDtLocal(t.stop),
        'Duration':          fmtDuration(t.drive_sec),
        'Distance (km)':     Math.round(t.distance * 100) / 100,
        'Avg Speed (km/h)':  Math.round(t.avg_speed * 10) / 10,
        'Max Speed (km/h)':  Math.round(t.max_speed * 10) / 10,
        'Idling Duration':   fmtDuration(t.idle_sec),
        'Odometer End (km)': Math.round(t.odo_km),
      };
    });

    lastSummaryRows = summaryRows;
    lastTripRows    = tripRows;
    lastDateRange   = { start: startDate, end: endDate, database: state ? state.database : 'unknown' };

    return { summaryRows, tripRows, archivedCount: archivedIds.length, battThreshold };
  }

  // ── Render results into the Preview screen ──────────────────
  function renderResults(data, battThreshold) {
    // Stat bar
    const totalVehicles = data.summaryRows.length;
    const totalCustomers = new Set(
      data.summaryRows.map(r => r.Customer).filter(c => c && c !== 'N/A')
        .flatMap(c => c.split(', '))
    ).size;
    const maxSpeed     = Math.max(0, ...data.summaryRows.map(r => +r['Max Speed (km/h)'] || 0));
    const totalFuel    = data.summaryRows.reduce((s, r) => s + (r['Fuel Consumed (L)'] === 'N/A' ? 0 : +r['Fuel Consumed (L)']), 0);
    const totalCo2     = data.summaryRows.reduce((s, r) => s + (r['CO2 Emission (kg)'] === 'N/A' ? 0 : +r['CO2 Emission (kg)']), 0);
    const totalMinor   = data.summaryRows.reduce((s, r) => s + (+r['Minor Collisions'] || 0), 0);
    const totalMajor   = data.summaryRows.reduce((s, r) => s + (+r['Major Collisions'] || 0), 0);
    const totalIdleSec = data.summaryRows.reduce((s, r) => s + parseDuration(r['Total Idling']), 0);
    const totalSpeed   = data.summaryRows.reduce((s, r) => s + (+r['Speeding Events'] || 0), 0);
    const lowBatt      = data.summaryRows.filter(r => r['Battery Voltage (V)'] !== 'N/A' && +r['Battery Voltage (V)'] < battThreshold).length;

    const stats = [
      { label: 'Total Vehicles',       value: fmtNum(totalVehicles) },
      { label: 'Archived (in Period)', value: fmtNum(data.archivedCount) },
      { label: 'Total Customers',      value: fmtNum(totalCustomers) },
      { label: 'Max Speed (km/h)',     value: fmtNum(maxSpeed, 1) },
      { label: 'Fuel Consumed (L)',    value: fmtNum(totalFuel) },
      { label: 'CO₂ Emissions (kg)', value: fmtNum(totalCo2) },
      { label: 'Minor Collisions',     value: fmtNum(totalMinor) },
      { label: 'Major Collisions',     value: fmtNum(totalMajor), warn: totalMajor > 0 },
      { label: 'Total Idling',         value: fmtDuration(totalIdleSec) },
      { label: 'Speeding Events',      value: fmtNum(totalSpeed) },
      { label: 'Low Battery',          value: fmtNum(lowBatt), warn: lowBatt > 0 },
    ];
    const statBar = document.querySelector('.smas-stat-bar');
    statBar.innerHTML = stats.map(s =>
      `<div class="smas-stat">
         <span class="smas-stat-value${s.warn ? ' warn' : ''}">${s.value}</span>
         <span class="smas-stat-label">${s.label}</span>
       </div>`
    ).join('');

    // Vehicle table
    const vTbody = document.getElementById('vehicleTbody');
    vTbody.innerHTML = data.summaryRows.map((r, i) => {
      const battV   = r['Battery Voltage (V)'];
      const battCls = (battV !== 'N/A' && +battV < battThreshold) ? 'num batt-low' : 'num';
      const majCls  = (+r['Major Collisions'] > 0) ? 'num warn' : 'num';
      const fillVol = r['Fill-up Volume (L)'] === 'N/A'
        ? '<td class="num na">N/A</td>'
        : `<td class="num">${fmtNum(r['Fill-up Volume (L)'])}</td>`;
      return `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(r['Vehicle Name'])}</td>
        <td>${escapeHtml(r['Customer'])}</td>
        <td style="font-family:monospace;font-size:12px">${escapeHtml(r['VIN'])}</td>
        <td>${escapeHtml(r['Serial No.'])}</td>
        <td class="num">${r['Odometer (km)'] === 'N/A' ? '<span class="na">N/A</span>' : fmtNum(r['Odometer (km)'])}</td>
        <td class="num">${fmtNum(r['Fill-up Count'])}</td>
        ${fillVol}
        <td class="num">${r['Fuel Consumed (L)'] === 'N/A' ? '<span class="na">N/A</span>' : fmtNum(r['Fuel Consumed (L)'], 1)}</td>
        <td class="num">${fmtNum(r['Max Speed (km/h)'], 1)}</td>
        <td class="num">${r['CO2 Emission (kg)'] === 'N/A' ? '<span class="na">N/A</span>' : fmtNum(r['CO2 Emission (kg)'], 1)}</td>
        <td class="num">${fmtNum(r['Minor Collisions'])}</td>
        <td class="${majCls}">${fmtNum(r['Major Collisions'])}</td>
        <td class="num">${fmtNum(r['Idle Event Count'])}</td>
        <td>${r['Total Idling']}</td>
        <td class="num">${fmtNum(r['Speeding Events'])}</td>
        <td class="${battCls}">${battV === 'N/A' ? '<span class="na">N/A</span>' : fmtNum(battV, 2)}</td>
      </tr>`;
    }).join('');

    // Trip table
    const tTbody = document.getElementById('tripTbody');
    tTbody.innerHTML = data.tripRows.slice(0, 500).map(r =>
      `<tr>
        <td>${escapeHtml(r['Vehicle Name'])}</td>
        <td>${escapeHtml(r['Customer'])}</td>
        <td style="font-family:monospace;font-size:12px">${escapeHtml(r['VIN'])}</td>
        <td>${escapeHtml(r['Trip Start'])}</td>
        <td>${escapeHtml(r['Trip End'])}</td>
        <td>${escapeHtml(r['Duration'])}</td>
        <td class="num">${fmtNum(r['Distance (km)'], 2)}</td>
        <td class="num">${fmtNum(r['Avg Speed (km/h)'], 1)}</td>
        <td class="num">${fmtNum(r['Max Speed (km/h)'], 1)}</td>
        <td>${escapeHtml(r['Idling Duration'])}</td>
        <td class="num">${fmtNum(r['Odometer End (km)'])}</td>
      </tr>`
    ).join('');

    // Reset pagination state and re-render
    if (typeof window.renderVehicleTable === 'function') window.renderVehicleTable();
    if (typeof window.renderTripTable    === 'function') window.renderTripTable();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── Excel generation (ExcelJS — styled to match notebook) ───
  async function downloadExcel() {
    if (!lastSummaryRows.length) return;
    if (typeof ExcelJS === 'undefined') {
      alert('ExcelJS library not loaded. Cannot generate Excel.');
      return;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'SMAS Mobility Fleet Report Add-in';

    const HEADER_BG  = '1F3864';
    const HEADER_FG  = 'FFFFFF';
    const ALT_ROW_BG = 'EBF3FB';
    const BAD_BG     = 'FCE4D6';
    const BAD_FG     = 'C00000';

    const battThreshold = +document.getElementById('battThreshold').value || 11.5;

    function styleHeader(ws, headers) {
      ws.addRow(headers);
      const headerRow = ws.getRow(1);
      headerRow.height = 22;
      headerRow.eachCell(cell => {
        cell.font = { name: 'Calibri', bold: true, color: { argb: 'FF' + HEADER_FG }, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + HEADER_BG } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = thinBorder();
      });
      ws.views = [{ state: 'frozen', ySplit: 1 }];
    }
    function thinBorder() {
      return {
        top:    { style: 'thin', color: { argb: 'FFBFBFBF' } },
        bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        left:   { style: 'thin', color: { argb: 'FFBFBFBF' } },
        right:  { style: 'thin', color: { argb: 'FFBFBFBF' } },
      };
    }
    function autoWidth(ws, headers) {
      headers.forEach((h, i) => {
        let maxLen = h.length;
        ws.eachRow(row => {
          const v = row.getCell(i + 1).value;
          if (v != null) maxLen = Math.max(maxLen, String(v).length);
        });
        ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 3, 10), 35);
      });
    }

    // Sheet 1
    const ws1 = wb.addWorksheet('Vehicle Summary');
    const s1Cols = Object.keys(lastSummaryRows[0]);
    styleHeader(ws1, s1Cols);
    lastSummaryRows.forEach((row, idx) => {
      const values = s1Cols.map(c => row[c]);
      const r = ws1.addRow(values);
      const bg = (idx + 2) % 2 === 0 ? ALT_ROW_BG : 'FFFFFF';
      r.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.border = thinBorder();
        const colName = s1Cols[colNumber - 1];
        if (colName === 'Battery Voltage (V)') {
          const v = parseFloat(cell.value);
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

    // Sheet 2
    const ws2 = wb.addWorksheet('Trip Detail');
    if (lastTripRows.length) {
      const s2Cols = Object.keys(lastTripRows[0]);
      styleHeader(ws2, s2Cols);
      lastTripRows.forEach((row, idx) => {
        const values = s2Cols.map(c => row[c]);
        const r = ws2.addRow(values);
        const bg = (idx + 2) % 2 === 0 ? ALT_ROW_BG : 'FFFFFF';
        r.eachCell(cell => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.border = thinBorder();
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bg } };
        });
      });
      autoWidth(ws2, s2Cols);
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SMAS_Mobility_Fleet_Report_${lastDateRange.database}_${lastDateRange.start}_to_${lastDateRange.end}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Click-handler wrapper for Generate ──────────────────────
  async function handleGenerate() {
    const startDate = document.getElementById('startDate').value;
    const endDate   = document.getElementById('endDate').value;
    if (!startDate || !endDate || startDate >= endDate) {
      alert('Please pick a valid date range.');
      return;
    }
    const customerId    = document.getElementById('groupSelect').value || '';
    const battThreshold = +document.getElementById('battThreshold').value || 11.5;
    const co2Factor     = 2.31; // petrol default — could expose in UI later

    if (typeof window.showScreen === 'function') window.showScreen('screen-generating');
    setStep(0);

    try {
      const data = await generateReport({ startDate, endDate, customerId, battThreshold, co2Factor });
      renderResults(data, battThreshold);
      if (typeof window.showScreen === 'function') window.showScreen('screen-preview');
    } catch (e) {
      console.error('Report generation failed:', e);
      alert('Report generation failed: ' + (e && e.message ? e.message : String(e)));
      if (typeof window.showScreen === 'function') window.showScreen('screen-config');
    }
  }

  // ── Lifecycle ────────────────────────────────────────────────
  return {
    initialize: function (api_, state_, callback) {
      api = api_;
      state = state_;
      // Hijack the static handlers — replace mockup behavior with live mode
      window.startGenerating = handleGenerate;
      window.downloadExcel   = downloadExcel;
      callback();
    },
    focus: async function (api_, state_) {
      api = api_;
      state = state_;
      try { await loadCustomerDropdown(); }
      catch (e) { console.warn('Failed to load customer dropdown:', e); }
    },
    blur: function () { /* no-op */ },
  };
};
