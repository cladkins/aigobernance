/* AIShield survey — clone with client-side package download (no email send). */
(function () {
  'use strict';

  const DATA = window.SURVEY_DATA;
  const QUESTIONS = DATA.questions;
  const MS = DATA.msControls.map((c, i) => ({ ...c, vendorId: 'ms_' + i }));
  const NIST = DATA.nist;
  const CAT_VENDOR = DATA.categoryVendor;
  const CAT_DESC = DATA.categoryDesc;

  // ---- Persona questions (verbatim from the live survey) ----
  const PERSONA = [
    {
      id: 'posture', type: 'single',
      q: '1. Which posture fits your situation today?',
      options: [
        { v: 'lockdown', label: 'Lock it all down', help: "Right call if you haven't yet established data governance policies for AI." },
        { v: 'middle', label: 'Find the middle ground', help: 'Right call if you have some governance in place but want to balance enablement and risk.' },
        { v: 'friendly', label: 'Developer Friendly', help: "Right call if you've already established AI governance, defined acceptable use, and want to maximize developer velocity." },
      ],
    },
    {
      id: 'regulations', type: 'multi',
      q: '2. Are you subject to any of these industry regulations? (select all that apply)',
      options: ['PCI-DSS', 'HIPAA / HITECH', 'SOX', 'GLBA', 'FERPA', 'FDA 21 CFR Part 11', 'CCPA / CPRA', 'GDPR', 'FedRAMP / FISMA', 'CMMC / DFARS'].map(v => ({ v, label: v })),
    },
    {
      id: 'frameworks', type: 'multi',
      q: '3. Required to be compliant with any of these certifications or frameworks?',
      options: ['SOC 2', 'ISO 27001', 'HITRUST', 'CIS Controls', 'NIST CSF', 'NIST 800-53', 'NIST 800-171'].map(v => ({ v, label: v })),
    },
    {
      id: 'aiTech', type: 'multi',
      q: '4. Which AI technologies do you have or need to govern? (filters the survey to only what applies)',
      hint: 'No selection = all sections shown.',
      options: ['Anthropic', 'OpenAI', 'Microsoft'].map(v => ({ v, label: v })),
    },
    {
      id: 'os', type: 'multi',
      q: '5. Which operating systems are in scope? (filters controls to relevant endpoints and mobile paths)',
      hint: 'No selection = all operating systems shown.',
      options: ['Windows', 'macOS', 'Linux', 'Android', 'iOS'].map(v => ({ v, label: v })),
    },
    {
      id: 'dataGov', type: 'single',
      q: '6. Have you completed Data Governance before deploying AI Solutions?',
      options: [
        { v: 'Complete', label: 'Complete' },
        { v: 'In Progress', label: 'In Progress' },
        { v: 'Not Started', label: 'Not Started' },
        { v: 'call', label: 'Schedule a call with BlueVoyant to help me' },
      ],
    },
  ];

  const AUDIT_FRAMEWORKS = ['SOC 2', 'ISO 27001', 'HITRUST', 'NIST CSF', 'NIST 800-53', 'NIST 800-171'];
  const DEFAULT_INSTRUCTIONS =
    "Before deleting, overwriting, or renaming any existing file, show me what will change and wait for confirmation. " +
    "Never modify files outside the current working folder unless I explicitly ask you to. " +
    "Never process prompts containing Personally Identifiable Information or Customer Names.";

  // ---- State ----
  const state = {
    persona: { posture: '', regulations: [], frameworks: [], aiTech: [], os: [], dataGov: '' },
    decisions: {},        // controlId -> 'BLOCK' | 'ALLOW'
    expanded: {},         // category -> bool
    instructions: '',
  };

  // ---- Catalog: ordered list of categories ----
  const ANTHROPIC_CATS = ['Claude Desktop/Cowork', 'Claude CLI', 'Claude Code in Web Browser', 'Claude in Chrome'];
  const OPENAI_CATS = ['Codex Desktop', 'Codex CLI'];
  const STAR_CATS = ['Shadow AI / Personal AI Subscriptions', 'AI Auditing'];

  function controlsByCategory(cat) { return QUESTIONS.filter(q => q.category === cat); }
  function isEnablement(q) { return /unrestricted,?\s*org-wide access/i.test(q.question); }

  // Default decision for a toggle control given the chosen posture.
  function defaultFor(q) {
    const p = state.persona.posture;
    if (p === 'lockdown') return 'BLOCK';
    if (p === 'friendly') return (q.category === 'AI Auditing' || q.category === 'Shadow AI / Personal AI Subscriptions') ? 'BLOCK' : 'ALLOW';
    // middle ground: relax pure enablement decisions, enforce everything else
    return isEnablement(q) ? 'ALLOW' : 'BLOCK';
  }
  function defaultForMs() {
    return state.persona.posture === 'friendly' ? 'ALLOW' : 'BLOCK';
  }

  function complianceLocked() {
    return state.persona.frameworks.some(f => AUDIT_FRAMEWORKS.includes(f));
  }

  // Apply posture defaults to every control (respecting compliance lock).
  function applyDefaults() {
    QUESTIONS.forEach(q => { state.decisions[q.id] = defaultFor(q); });
    MS.forEach(c => { state.decisions[c.vendorId] = defaultForMs(); });
    enforceLock();
  }
  function enforceLock() {
    if (complianceLocked()) {
      controlsByCategory('AI Auditing').forEach(q => { state.decisions[q.id] = 'BLOCK'; });
    }
  }

  // ---- Visibility filters (AI tech + OS) ----
  function vendorVisible(vendor) {
    const sel = state.persona.aiTech;
    if (vendor === '*') return true;
    if (sel.length === 0) return true;
    return sel.includes(vendor);
  }
  function msVisible() {
    const sel = state.persona.aiTech;
    return sel.length === 0 || sel.includes('Microsoft');
  }
  function osVisible(q) {
    const sel = state.persona.os;
    if (sel.length === 0) return true;
    if (!q.operatingSystems || q.operatingSystems.length === 0) return true;
    return q.operatingSystems.some(o => sel.includes(o));
  }
  function visibleControlsForCat(cat) {
    return controlsByCategory(cat).filter(osVisible);
  }

  // ---- Build the ordered, visible category list ----
  function visibleCategories() {
    const out = [];
    if (vendorVisible('Anthropic')) ANTHROPIC_CATS.forEach(c => out.push({ cat: c, vendor: 'Anthropic' }));
    if (vendorVisible('OpenAI')) OPENAI_CATS.forEach(c => out.push({ cat: c, vendor: 'OpenAI' }));
    if (msVisible()) out.push({ cat: '__microsoft__', vendor: 'Microsoft' });
    STAR_CATS.forEach(c => out.push({ cat: c, vendor: '*' }));
    return out.filter(({ cat }) => cat === '__microsoft__' ? MS.length : visibleControlsForCat(cat).length);
  }

  // ---- Counts ----
  function allVisibleControlIds() {
    const ids = [];
    visibleCategories().forEach(({ cat }) => {
      if (cat === '__microsoft__') MS.forEach(c => ids.push(c.vendorId));
      else visibleControlsForCat(cat).forEach(q => ids.push(q.id));
    });
    return ids;
  }
  function appliedCount() { return allVisibleControlIds().filter(id => state.decisions[id] === 'BLOCK').length; }
  function totalCount() { return allVisibleControlIds().length; }

  // =================== Rendering ===================
  const $ = sel => document.querySelector(sel);

  function chip(label, active, onClick, locked) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.disabled = !!locked;
    b.className = 'text-xs rounded-full border px-3 py-1.5 transition-all duration-150 font-medium ' +
      (active ? 'border-blue-500 bg-blue-500/15 text-blue-200' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600 hover:text-slate-200') +
      (locked ? ' opacity-60 cursor-not-allowed' : '');
    b.addEventListener('click', onClick);
    return b;
  }

  function renderPersona() {
    const wrap = $('#personaQuestions');
    wrap.innerHTML = '';
    PERSONA.forEach(pq => {
      const block = document.createElement('div');
      const h = document.createElement('div');
      h.className = 'text-white font-medium mb-3';
      h.textContent = pq.q;
      block.appendChild(h);

      if (pq.type === 'single' && pq.options.some(o => o.help)) {
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-3 gap-3';
        pq.options.forEach(o => {
          const active = state.persona[pq.id] === o.v;
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'text-left rounded-xl border p-4 transition-all duration-150 ' +
            (active ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30' : 'border-slate-700 bg-slate-900/50 hover:border-slate-600');
          card.innerHTML = '<div class="font-semibold text-white text-sm mb-1">' + esc(o.label) + '</div>' +
            (o.help ? '<div class="text-xs text-slate-400 leading-relaxed">' + esc(o.help) + '</div>' : '');
          card.addEventListener('click', () => { state.persona[pq.id] = o.v; applyDefaults(); renderAll(); });
          grid.appendChild(card);
        });
        block.appendChild(grid);
      } else {
        const row = document.createElement('div');
        row.className = 'flex flex-wrap gap-2';
        pq.options.forEach(o => {
          let active;
          if (pq.type === 'multi') active = state.persona[pq.id].includes(o.v);
          else active = state.persona[pq.id] === o.v;
          row.appendChild(chip(o.label, active, () => {
            if (pq.type === 'multi') {
              const arr = state.persona[pq.id];
              const i = arr.indexOf(o.v);
              if (i >= 0) arr.splice(i, 1); else arr.push(o.v);
            } else {
              state.persona[pq.id] = active ? '' : o.v;
            }
            if (pq.id === 'frameworks') enforceLock();
            renderAll();
          }));
        });
        block.appendChild(row);
        if (pq.hint) {
          const hint = document.createElement('div');
          hint.className = 'text-xs text-slate-500 mt-2';
          hint.textContent = pq.hint;
          block.appendChild(hint);
        }
      }
      wrap.appendChild(block);
    });
  }

  function renderComplianceLock() {
    const el = $('#complianceLock');
    if (complianceLocked()) {
      el.classList.remove('hidden');
      el.innerHTML = '<span class="font-semibold">Compliance lock applied: </span>AI Auditing controls are forced ' +
        '<span class="font-mono text-amber-300">ON</span> because the framework(s) you selected (' +
        esc(state.persona.frameworks.filter(f => AUDIT_FRAMEWORKS.includes(f)).join(', ')) +
        ') mandate audit logging, audit data export, and a defined retention policy. Those toggles are locked below.';
    } else {
      el.classList.add('hidden');
    }
  }

  function decisionToggle(id, locked) {
    const decision = state.decisions[id] || 'ALLOW';
    const wrap = document.createElement('div');
    wrap.className = 'inline-flex rounded-lg border border-slate-700 overflow-hidden text-xs font-mono shrink-0' + (locked ? ' opacity-70' : '');
    [['BLOCK', 'bg-blue-600 text-white'], ['ALLOW', 'bg-slate-700 text-slate-200']].forEach(([val, activeCls]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = val;
      b.disabled = !!locked;
      const active = decision === val;
      b.className = 'px-3 py-1.5 transition-colors ' + (active ? activeCls : 'bg-transparent text-slate-500 hover:text-slate-300') + (locked ? ' cursor-not-allowed' : '');
      b.addEventListener('click', () => { if (locked) return; state.decisions[id] = val; renderAll(); });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function controlRow(q, locked) {
    const row = document.createElement('div');
    row.className = 'rounded-lg border border-slate-800 bg-slate-950/40 p-4';
    const top = document.createElement('div');
    top.className = 'flex items-start justify-between gap-4';
    const left = document.createElement('div');
    left.className = 'min-w-0';
    left.innerHTML = '<div class="text-sm text-slate-200 leading-snug">' + esc(q.question) + '</div>' +
      (q.nist_alignment ? '<div class="text-xs text-blue-400/80 font-mono mt-1">' + esc(q.nist_alignment) + '</div>' : '') +
      (locked ? '<div class="text-xs text-amber-300 mt-1">Locked by compliance selection</div>' : '');
    top.appendChild(left);
    top.appendChild(decisionToggle(q.id, locked));
    row.appendChild(top);

    const details = [];
    if (q.preamble) details.push(['What this means', q.preamble]);
    if (q.if_no) details.push(['If you block it', q.if_no]);
    if (q.note) details.push(['Note', q.note]);
    if (q.consultantNote) details.push(['Consultant note', q.consultantNote]);
    if (details.length) {
      const det = document.createElement('details');
      det.className = 'mt-3 group';
      const sum = document.createElement('summary');
      sum.className = 'text-xs text-blue-400 cursor-pointer select-none hover:text-blue-300';
      sum.textContent = 'Details';
      det.appendChild(sum);
      const body = document.createElement('div');
      body.className = 'mt-2 space-y-2';
      details.forEach(([k, v]) => {
        body.innerHTML += '<div class="text-xs leading-relaxed"><span class="font-semibold text-slate-300">' + esc(k) + ': </span><span class="text-slate-400">' + esc(v) + '</span></div>';
      });
      det.appendChild(body);
      row.appendChild(det);
    }
    return row;
  }

  function msRow(c) {
    const row = document.createElement('div');
    row.className = 'rounded-lg border border-slate-800 bg-slate-950/40 p-4';
    const top = document.createElement('div');
    top.className = 'flex items-start justify-between gap-4';
    const left = document.createElement('div');
    left.className = 'min-w-0';
    left.innerHTML = '<div class="text-sm text-slate-200 leading-snug">' + esc(c.title) + '</div>' +
      '<div class="text-xs text-slate-400 leading-relaxed mt-1">' + esc(c.description) + '</div>';
    top.appendChild(left);
    top.appendChild(decisionToggle(c.vendorId, false));
    row.appendChild(top);
    return row;
  }

  function accordion(title, desc, controlIds, bodyBuilder) {
    const applied = controlIds.filter(id => state.decisions[id] === 'BLOCK').length;
    const open = !!state.expanded[title];
    const wrap = document.createElement('div');
    wrap.className = 'rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden';
    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-slate-900/80 transition-colors';
    head.innerHTML =
      '<div class="min-w-0"><div class="font-semibold text-white">' + esc(title) + '</div>' +
      (desc ? '<div class="text-xs text-slate-400 mt-0.5">' + esc(desc) + '</div>' : '') + '</div>' +
      '<div class="flex items-center gap-3 shrink-0"><span class="text-xs font-mono text-slate-400">' + applied + '/' + controlIds.length + ' applied</span>' +
      '<svg class="h-4 w-4 text-slate-500 transition-transform ' + (open ? 'rotate-90' : '') + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"></path></svg></div>';
    head.addEventListener('click', () => { state.expanded[title] = !open; renderControls(); });
    wrap.appendChild(head);
    if (open) {
      const body = document.createElement('div');
      body.className = 'px-4 pb-4 space-y-3 border-t border-slate-800';
      bodyBuilder(body);
      wrap.appendChild(body);
    }
    return wrap;
  }

  function renderControls() {
    const host = $('#controlGroups');
    host.innerHTML = '';
    const locked = complianceLocked();
    visibleCategories().forEach(({ cat, vendor }) => {
      if (cat === '__microsoft__') {
        host.appendChild(accordion('Microsoft', 'Copilot, Purview, Entra, Intune, Edge, Agent365, and Defender controls.',
          MS.map(c => c.vendorId), body => MS.forEach(c => body.appendChild(msRow(c)))));
      } else {
        const ctrls = visibleControlsForCat(cat);
        const desc = CAT_DESC[cat] || '';
        const isAudit = cat === 'AI Auditing';
        host.appendChild(accordion(cat, desc, ctrls.map(q => q.id),
          body => ctrls.forEach(q => body.appendChild(controlRow(q, isAudit && locked)))));
      }
    });
  }

  function renderStatus() {
    const applied = appliedCount(), total = totalCount();
    $('#appliedCount').textContent = applied;
    $('#totalCount').textContent = total;
    $('#enforceCount').textContent = applied;
    const riskPct = total ? Math.round((1 - applied / total) * 100) : 0;
    $('#riskBar').style.width = riskPct + '%';
    const label = riskPct < 34 ? 'Low' : riskPct < 67 ? 'Medium' : 'High';
    const color = riskPct < 34 ? 'text-green-400' : riskPct < 67 ? 'text-amber-400' : 'text-red-400';
    const rl = $('#riskLabel');
    rl.textContent = label;
    rl.className = 'text-xs font-semibold w-9 ' + color;
  }

  function renderAll() { enforceLock(); renderComplianceLock(); renderControls(); renderStatus(); }

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  // =================== Package generation ===================
  function selectedControls() {
    const out = [];
    visibleCategories().forEach(({ cat, vendor }) => {
      if (cat === '__microsoft__') {
        MS.forEach(c => out.push({ vendor: 'Microsoft', category: 'Microsoft', title: c.title, description: c.description, decision: state.decisions[c.vendorId], nist: '' }));
      } else {
        visibleControlsForCat(cat).forEach(q => out.push({ vendor: vendor === '*' ? 'Enterprise-wide' : vendor, category: cat, title: q.question, decision: state.decisions[q.id], nist: q.nist_alignment || '', if_no: q.if_no || '' }));
      }
    });
    return out;
  }

  function buildPolicyMarkdown(name, email) {
    const ctrls = selectedControls();
    const enforced = ctrls.filter(c => c.decision === 'BLOCK');
    const permitted = ctrls.filter(c => c.decision === 'ALLOW');
    const date = new Date().toISOString().slice(0, 10);
    const p = state.persona;
    const nistRefs = [...new Set(enforced.flatMap(c => (c.nist || '').split('+').map(s => s.trim()).filter(Boolean)))];

    let md = '';
    md += '# AI Governance Policy\n';
    md += '## NIST AI RMF 1.0-Aligned Governance Document\n\n';
    md += '> Generated by AIShield by BlueVoyant on ' + date + '.\n\n';
    md += '**Prepared for:** ' + name + ' (' + email + ')\n\n';
    md += '---\n\n## 1. Organizational Profile\n\n';
    md += '| Attribute | Selection |\n|---|---|\n';
    md += '| Security posture | ' + (postureLabel(p.posture) || '—') + ' |\n';
    md += '| Industry regulations | ' + (p.regulations.join(', ') || 'None selected') + ' |\n';
    md += '| Certifications / frameworks | ' + (p.frameworks.join(', ') || 'None selected') + ' |\n';
    md += '| AI technologies in scope | ' + (p.aiTech.join(', ') || 'All') + ' |\n';
    md += '| Operating systems in scope | ' + (p.os.join(', ') || 'All') + ' |\n';
    md += '| Data governance maturity | ' + (dataGovLabel(p.dataGov) || '—') + ' |\n\n';

    md += '## 2. Control Summary\n\n';
    md += '- **' + enforced.length + '** controls enforced (BLOCK)\n';
    md += '- **' + permitted.length + '** behaviors permitted (ALLOW)\n';
    if (complianceLocked()) md += '- AI Auditing controls **locked ON** to satisfy: ' + p.frameworks.filter(f => AUDIT_FRAMEWORKS.includes(f)).join(', ') + '\n';
    md += '\n';

    md += '## 3. Enforced Controls\n\n';
    const byVendor = groupBy(enforced, c => c.vendor);
    Object.keys(byVendor).forEach(v => {
      md += '### ' + v + '\n\n';
      byVendor[v].forEach(c => {
        md += '- **' + c.title + '**';
        if (c.nist) md += '  \n  _NIST: ' + c.nist + '_';
        if (c.if_no) md += '  \n  _Enforcement: ' + c.if_no + '_';
        md += '\n';
      });
      md += '\n';
    });

    if (permitted.length) {
      md += '## 4. Permitted Behaviors (accepted risk)\n\n';
      permitted.forEach(c => { md += '- ' + c.title + ' _(' + c.vendor + ')_\n'; });
      md += '\n';
    }

    md += '## 5. Global AI Operating Instructions\n\n';
    md += '```\n' + (state.instructions || DEFAULT_INSTRUCTIONS) + '\n```\n\n';
    md += 'Deploy to OpenAI Codex as `~/.codex/AGENTS.md`. For Claude, paste under Organization settings → Organization and access → Organization instructions (Team/Enterprise).\n\n';

    if (nistRefs.length) {
      md += '## 6. NIST AI RMF Crosswalk\n\n';
      md += '| Reference | Function | Summary |\n|---|---|---|\n';
      nistRefs.forEach(ref => {
        const def = NIST[ref];
        md += '| ' + ref + ' | ' + (def ? def.label : '') + ' | ' + (def ? def.summary.replace(/\|/g, '/') : '') + ' |\n';
      });
      md += '\n';
    }

    md += '---\n\n_This document is generated from your survey selections and is a starting point, not legal advice. ';
    md += 'BlueVoyant can review and operationalize it — email contact@bluevoyant.com or request a demo at https://www.bluevoyant.com/request-a-demo._\n';
    return md;
  }

  function buildIntune(enforced) {
    return JSON.stringify({
      '@odata.type': '#microsoft.graph.deviceConfiguration',
      displayName: 'AIShield — AI Governance Baseline',
      description: 'Generated AI governance baseline. ' + enforced.length + ' controls enforced.',
      generatedAt: new Date().toISOString(),
      settings: enforced.map((c, i) => ({
        id: 'aishield-' + (i + 1),
        vendor: c.vendor, control: c.title, action: 'BLOCK',
        nistAlignment: c.nist || null, enforcement: c.if_no || null,
      })),
    }, null, 2);
  }
  function buildJamf(enforced) {
    let x = '<?xml version="1.0" encoding="UTF-8"?>\n<!-- AIShield AI Governance — Jamf configuration profile (skeleton) -->\n';
    x += '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n';
    x += '  <key>PayloadDisplayName</key><string>AIShield AI Governance Baseline</string>\n';
    x += '  <key>PayloadIdentifier</key><string>ai.aishield.governance</string>\n';
    x += '  <key>EnforcedControls</key>\n  <array>\n';
    enforced.forEach(c => { x += '    <dict><key>vendor</key><string>' + esc(c.vendor) + '</string><key>control</key><string>' + esc(c.title) + '</string><key>action</key><string>BLOCK</string></dict>\n'; });
    x += '  </array>\n</dict></plist>\n';
    return x;
  }
  function buildPowershell(enforced) {
    let s = '<#\n  AIShield — AI Governance enforcement (PowerShell skeleton)\n  Generated ' + new Date().toISOString() + '\n  ' + enforced.length + ' controls enforced. Review before running in production.\n#>\n\n';
    s += '$ErrorActionPreference = "Stop"\n\n$Controls = @(\n';
    enforced.forEach(c => { s += '  @{ Vendor = "' + ps(c.vendor) + '"; Control = "' + ps(c.title) + '"; Action = "BLOCK"; Nist = "' + ps(c.nist || '') + '" }\n'; });
    s += ')\n\nforeach ($c in $Controls) {\n  Write-Host "[BLOCK] $($c.Vendor): $($c.Control)"\n  # TODO: map to Intune/registry/AppLocker enforcement for this control\n}\n';
    return s;
  }
  function buildBash(enforced) {
    let s = '#!/usr/bin/env bash\n# AIShield — AI Governance enforcement (Bash skeleton)\n# Generated ' + new Date().toISOString() + '\n# ' + enforced.length + ' controls enforced. Review before running in production.\nset -euo pipefail\n\n';
    s += 'declare -a CONTROLS=(\n';
    enforced.forEach(c => { s += '  "' + sh(c.vendor + ' :: ' + c.title) + '"\n'; });
    s += ')\n\nfor c in "${CONTROLS[@]}"; do\n  echo "[BLOCK] $c"\n  # TODO: apply enforcement (profiles, MDM, config) for this control\ndone\n';
    return s;
  }
  function ps(s) { return String(s).replace(/"/g, '`"'); }
  function sh(s) { return String(s).replace(/"/g, '\\"'); }

  function buildExecSummary(name, email, a) {
    const p = state.persona;
    const date = new Date().toISOString().slice(0, 10);
    const fns = ['Govern', 'Map', 'Measure', 'Manage'];
    let md = '';
    md += '# AI Governance — Executive Summary\n\n';
    md += '_Board-ready overview · Generated by AIShield by BlueVoyant · ' + date + '_\n\n';
    md += '**Prepared for:** ' + name + ' (' + email + ')\n\n';
    md += '---\n\n## Bottom line\n\n';
    md += 'Your organization has a **Governance Posture Score of ' + a.postureScore + '/100** ';
    md += '(' + a.counts.enforced + ' of ' + a.counts.total + ' assessed controls enforced), placing AI governance ';
    md += 'maturity at **Tier ' + a.maturity.tier + ' — ' + a.maturity.name + '**. ' + a.maturity.blurb + '\n\n';
    md += '| Metric | Result |\n|---|---|\n';
    md += '| Governance Posture Score | **' + a.postureScore + ' / 100** |\n';
    md += '| Residual Risk Index | **' + a.residualIndex + ' / 100** (lower is better) |\n';
    md += '| Maturity Tier | **Tier ' + a.maturity.tier + ' — ' + a.maturity.name + '** |\n';
    md += '| Controls enforced | ' + a.counts.enforced + ' of ' + a.counts.total + ' |\n';
    md += '| Developer enablement preserved | ' + a.enablementBalance + '% |\n';
    md += '| Strategic posture | ' + (postureLabel(p.posture) || '—') + ' |\n\n';

    md += '## NIST AI RMF function coverage\n\n| Function | Coverage |\n|---|---|\n';
    fns.forEach(f => { const x = a.byFunction[f]; md += '| ' + f + ' | ' + x.pct + '% (' + x.covered + '/' + x.total + ') |\n'; });
    md += '\n';

    if (a.compliance.length) {
      md += '## Compliance readiness\n\n| Obligation | Coverage | Status |\n|---|---|---|\n';
      a.compliance.forEach(c => { md += '| ' + c.name + ' | ' + c.pct + '% (' + c.enforced + '/' + c.relevant + ') | ' + c.status + ' |\n'; });
      md += '\n';
    }

    md += '## Top residual risks (action required)\n\n';
    if (a.topRisks.length) {
      a.topRisks.slice(0, 5).forEach((r, i) => {
        md += (i + 1) + '. **[' + r.severityLabel + ']** ' + r.title + ' _(' + r.domain + ')_\n';
        md += '   - Recommendation: ' + r.recommendation + '\n';
      });
    } else { md += 'No high-severity behaviors are currently left permitted. Strong posture.\n'; }
    md += '\n';

    md += '## Recommended next steps\n\n';
    md += '1. **Phase 1 (0–30 days):** implement ' + a.roadmap.phase1.length + ' high-impact, low-effort controls (quick wins).\n';
    md += '2. **Phase 2 (30–90 days):** implement ' + a.roadmap.phase2.length + ' controls requiring coordinated deployment.\n';
    md += '3. **Phase 3 (90+ days):** complete the remaining ' + a.roadmap.phase3.length + ' controls and establish continuous measurement.\n';
    md += '4. Engage BlueVoyant to operationalize, validate, and run these controls.\n\n';
    md += '---\n\n_Generated from survey selections as a decision-support starting point, not legal advice. ';
    md += 'Talk to BlueVoyant: contact@bluevoyant.com · https://www.bluevoyant.com/request-a-demo_\n';
    return md;
  }

  function csvCell(s) { s = String(s == null ? '' : s); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function buildRiskRegisterCSV(a) {
    const head = ['Control ID', 'Vendor', 'Domain', 'Control', 'Decision', 'Severity', 'Residual Risk', 'NIST Alignment', 'Suggested Owner', 'Implementation Phase', 'Enforcement / Mitigation'];
    const phaseOf = title => a.roadmap.phase1.some(c => c.title === title) ? 'Phase 1 (0-30d)' : a.roadmap.phase2.some(c => c.title === title) ? 'Phase 2 (30-90d)' : a.roadmap.phase3.some(c => c.title === title) ? 'Phase 3 (90d+)' : '—';
    const rows = a.enriched.map((c, i) => {
      const title = c.title || c.question;
      const residual = c.decision === 'ALLOW' ? c.severityLabel : 'Mitigated';
      return [
        'AIS-' + String(i + 1).padStart(3, '0'), c.vendor, c.domain, title, c.decision,
        c.severityLabel, residual, c.nist || '', c.owner,
        c.decision === 'BLOCK' ? phaseOf(title) : 'N/A (permitted)', c.if_no || c.description || '',
      ].map(csvCell).join(',');
    });
    return head.map(csvCell).join(',') + '\n' + rows.join('\n') + '\n';
  }

  function buildRoadmap(a) {
    const date = new Date().toISOString().slice(0, 10);
    let md = '# AI Governance Implementation Roadmap\n\n_Generated ' + date + ' · sequenced by impact and effort_\n\n';
    const phase = (title, window, list) => {
      md += '## ' + title + ' — ' + window + ' (' + list.length + ' controls)\n\n';
      if (!list.length) { md += '_No controls in this phase._\n\n'; return; }
      md += '| Control | Domain | Severity | Effort | Owner | Steps |\n|---|---|---|---|---|---|\n';
      list.forEach(c => {
        md += '| ' + mdCell(c.title) + ' | ' + c.domain + ' | ' + c.severityLabel + ' | ' + c.effortLabel + ' | ' + c.owner + ' | ' + mdCell(c.steps) + ' |\n';
      });
      md += '\n';
    };
    phase('Phase 1 · Quick wins', '0–30 days', a.roadmap.phase1);
    phase('Phase 2 · Coordinated rollout', '30–90 days', a.roadmap.phase2);
    phase('Phase 3 · Hardening & measurement', '90+ days', a.roadmap.phase3);
    md += '---\n\nBlueVoyant can own delivery of this roadmap end to end: contact@bluevoyant.com\n';
    return md;
  }
  function mdCell(s) { return String(s || '').replace(/\|/g, '/').replace(/\n+/g, ' '); }

  function buildComplianceCrosswalk(a) {
    let md = '# Compliance Crosswalk\n\nHow your selected control decisions map to each compliance obligation.\n\n';
    if (!a.compliance.length) { md += '_No frameworks or regulations were selected._\n'; return md; }
    a.compliance.forEach(c => {
      md += '## ' + c.name + ' — ' + c.status + ' (' + c.pct + '%)\n\n';
      md += '- Relevant controls assessed: ' + c.relevant + '\n- Controls enforced: ' + c.enforced + '\n';
      if (c.gaps.length) {
        md += '- **Open gaps to close:**\n';
        c.gaps.forEach(g => { md += '  - [' + g.severityLabel + '] ' + (g.title || g.question) + ' _(' + g.domain + ')_\n'; });
      } else { md += '- No open gaps in the assessed control set.\n'; }
      md += '\n';
    });
    md += '---\n\n_Indicative mapping for prioritization — not a certified compliance attestation._\n';
    return md;
  }

  async function generatePackage(name, email) {
    const a = currentAnalysis || runAnalysis();
    const ctrls = selectedControls();
    const enforced = ctrls.filter(c => c.decision === 'BLOCK');
    const zip = new JSZip();
    const date = new Date().toISOString().slice(0, 10);

    zip.file('README.txt',
      'AIShield AI Governance Package — by BlueVoyant\n' +
      '==============================================\n\n' +
      'Prepared for: ' + name + ' <' + email + '>\nGenerated: ' + date + '\n\n' +
      'Governance Posture Score: ' + a.postureScore + '/100  |  Maturity: Tier ' + a.maturity.tier + ' (' + a.maturity.name + ')\n' +
      'Controls enforced: ' + a.counts.enforced + ' of ' + a.counts.total + '  |  Residual Risk Index: ' + a.residualIndex + '/100\n\n' +
      'Contents:\n' +
      '  01-Executive-Summary.md       Board-ready overview: score, maturity, top risks, next steps\n' +
      '  02-AI-Governance-Policy.md    NIST AI RMF 1.0-aligned policy tailored to your selections\n' +
      '  03-Risk-Register.csv          Every control: severity, residual risk, owner, phase (import to Excel/GRC)\n' +
      '  04-Implementation-Roadmap.md  Phased plan sequenced by impact and effort\n' +
      '  05-Compliance-Crosswalk.md    Coverage and gaps per selected framework/regulation\n' +
      '  selections.json               Machine-readable record of answers, decisions, and analysis\n' +
      '  configs/intune/               Microsoft Intune device configuration baseline\n' +
      '  configs/jamf/                 Jamf configuration profile skeleton\n' +
      '  configs/powershell/           PowerShell enforcement skeleton\n' +
      '  configs/bash/                 Bash enforcement skeleton\n\n' +
      'These artifacts are a decision-support starting point. BlueVoyant can review,\n' +
      'operationalize, and run them: contact@bluevoyant.com / https://www.bluevoyant.com/request-a-demo\n');

    zip.file('01-Executive-Summary.md', buildExecSummary(name, email, a));
    zip.file('02-AI-Governance-Policy.md', buildPolicyMarkdown(name, email));
    zip.file('03-Risk-Register.csv', buildRiskRegisterCSV(a));
    zip.file('04-Implementation-Roadmap.md', buildRoadmap(a));
    zip.file('05-Compliance-Crosswalk.md', buildComplianceCrosswalk(a));
    zip.file('selections.json', JSON.stringify({
      contact: { name, email }, generatedAt: new Date().toISOString(),
      persona: state.persona, globalInstructions: state.instructions || DEFAULT_INSTRUCTIONS,
      analysis: {
        postureScore: a.postureScore, residualIndex: a.residualIndex, maturity: a.maturity,
        byFunction: a.byFunction, byDomain: a.byDomain, compliance: a.compliance.map(c => ({ name: c.name, pct: c.pct, status: c.status })),
        enablementBalance: a.enablementBalance,
      },
      controls: ctrls,
    }, null, 2));
    zip.file('configs/intune/ai-governance.json', buildIntune(enforced));
    zip.file('configs/jamf/ai-governance.mobileconfig.plist', buildJamf(enforced));
    zip.file('configs/powershell/Deploy-AIControls.ps1', buildPowershell(enforced));
    zip.file('configs/bash/deploy-ai-controls.sh', buildBash(enforced));

    return zip.generateAsync({ type: 'blob' });
  }

  function postureLabel(v) { return ({ lockdown: 'Lock it all down', middle: 'Find the middle ground', friendly: 'Developer Friendly' })[v] || ''; }
  function dataGovLabel(v) { return v === 'call' ? 'Requested a call with BlueVoyant' : v; }
  function groupBy(arr, fn) { return arr.reduce((a, x) => { const k = fn(x); (a[k] = a[k] || []).push(x); return a; }, {}); }

  // =================== Analysis + results dashboard ===================
  let currentAnalysis = null;
  function runAnalysis() { currentAnalysis = AISHIELD.scoring.analyze(state.persona, selectedControls()); return currentAnalysis; }

  function bandColor(p) { return p >= 68 ? '#22c55e' : p >= 45 ? '#fbbf24' : '#ef4444'; }
  function sevColor(label) {
    return { Critical: '#ef4444', High: '#f97316', Moderate: '#fbbf24', Low: '#3a7cff', Informational: '#7e858f' }[label] || '#7e858f';
  }
  function statusColor(s) { return s === 'On track' ? '#22c55e' : s === 'Partial' ? '#fbbf24' : '#ef4444'; }

  function donut(scorePct, color, big, sub) {
    const r = 54, c = 2 * Math.PI * r, off = c * (1 - scorePct / 100);
    return '<svg width="148" height="148" viewBox="0 0 148 148" class="shrink-0">' +
      '<circle cx="74" cy="74" r="' + r + '" fill="none" stroke="#26292e" stroke-width="12"/>' +
      '<circle cx="74" cy="74" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 74 74)"/>' +
      '<text x="74" y="72" text-anchor="middle" fill="#ffffff" font-size="34" font-weight="700">' + big + '</text>' +
      '<text x="74" y="94" text-anchor="middle" fill="#9aa0aa" font-size="11">' + esc(sub) + '</text></svg>';
  }
  function bar(label, p, color, meta) {
    return '<div class="mb-3"><div class="flex justify-between items-baseline text-xs mb-1">' +
      '<span class="text-slate-200">' + esc(label) + '</span>' +
      '<span class="text-slate-400 font-mono">' + p + '%' + (meta ? ' <span class="text-slate-600">' + esc(meta) + '</span>' : '') + '</span></div>' +
      '<div class="h-2 rounded-full bg-slate-800 overflow-hidden"><div class="h-full rounded-full" style="width:' + p + '%;background:' + color + '"></div></div></div>';
  }
  function card(inner, cls) { return '<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 ' + (cls || '') + '">' + inner + '</div>'; }

  function renderResults(a) {
    const host = $('#resultsView');
    const fns = ['Govern', 'Map', 'Measure', 'Manage'];
    let h = '';

    // Header + actions
    h += '<div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">' +
      '<div><div class="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-1">Results</div>' +
      '<h1 class="text-3xl md:text-4xl font-bold text-white">Your AI Governance Posture</h1>' +
      '<p class="text-slate-400 mt-2 max-w-2xl">A board-ready view of where you stand, what risk remains, and what to do next — derived from your ' + a.counts.total + ' control decisions.</p></div>' +
      '<div class="flex gap-2 shrink-0"><button id="backBtn" class="h-11 px-4 rounded-md border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-semibold">Edit responses</button>' +
      '<button id="downloadFromResults" class="h-11 px-5 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors text-sm font-semibold">Download full package</button></div></div>';

    // Hero metrics
    h += '<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">';
    h += card('<div class="flex items-center gap-5">' + donut(a.postureScore, bandColor(a.postureScore), a.postureScore, 'of 100') +
      '<div><div class="text-sm uppercase tracking-wider text-slate-500 mb-1">Governance Posture Score</div>' +
      '<div class="text-2xl font-bold text-white mb-1">Tier ' + a.maturity.tier + ' · ' + esc(a.maturity.name) + '</div>' +
      '<div class="text-sm text-slate-400 leading-relaxed">' + esc(a.maturity.blurb) + '</div></div></div>', 'lg:col-span-2');
    h += card(
      '<div class="text-sm uppercase tracking-wider text-slate-500 mb-3">Risk & enablement</div>' +
      '<div class="space-y-4">' +
      '<div><div class="flex justify-between text-xs mb-1"><span class="text-slate-300">Residual Risk Index</span><span class="font-mono" style="color:' + bandColor(100 - a.residualIndex) + '">' + a.residualIndex + '/100</span></div>' +
      '<div class="h-2 rounded-full bg-slate-800 overflow-hidden"><div class="h-full rounded-full" style="width:' + a.residualIndex + '%;background:' + bandColor(100 - a.residualIndex) + '"></div></div></div>' +
      '<div><div class="flex justify-between text-xs mb-1"><span class="text-slate-300">Controls enforced</span><span class="font-mono text-slate-300">' + a.counts.enforced + '/' + a.counts.total + '</span></div>' +
      '<div class="h-2 rounded-full bg-slate-800 overflow-hidden"><div class="h-full rounded-full bg-blue-500" style="width:' + Math.round(a.counts.enforced / a.counts.total * 100) + '%"></div></div></div>' +
      '<div><div class="flex justify-between text-xs mb-1"><span class="text-slate-300">Developer enablement preserved</span><span class="font-mono text-slate-300">' + a.enablementBalance + '%</span></div>' +
      '<div class="h-2 rounded-full bg-slate-800 overflow-hidden"><div class="h-full rounded-full" style="width:' + a.enablementBalance + '%;background:#8dedc7"></div></div></div>' +
      '</div>');
    h += '</div>';

    // Coverage: NIST + domains
    h += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">';
    let nistInner = '<div class="text-sm uppercase tracking-wider text-slate-500 mb-4">NIST AI RMF function coverage</div>';
    fns.forEach(f => { const x = a.byFunction[f]; nistInner += bar(f, x.pct, bandColor(x.pct), x.covered + '/' + x.total); });
    h += card(nistInner);
    let domInner = '<div class="text-sm uppercase tracking-wider text-slate-500 mb-4">Coverage by control domain</div>';
    Object.keys(a.byDomain).forEach(d => { const x = a.byDomain[d]; domInner += bar(d, x.pct, bandColor(x.pct), x.covered + '/' + x.total); });
    h += card(domInner);
    h += '</div>';

    // Compliance crosswalk
    if (a.compliance.length) {
      let comp = '<div class="text-sm uppercase tracking-wider text-slate-500 mb-4">Compliance readiness</div><div class="space-y-2">';
      a.compliance.forEach(c => {
        comp += '<div class="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">' +
          '<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style="background:' + statusColor(c.status) + '22;color:' + statusColor(c.status) + '">' + esc(c.status) + '</span>' +
          '<span class="text-sm text-slate-200 flex-1 min-w-0 truncate">' + esc(c.name) + '</span>' +
          '<div class="hidden sm:block w-28 h-1.5 rounded-full bg-slate-800 overflow-hidden"><div class="h-full rounded-full" style="width:' + c.pct + '%;background:' + statusColor(c.status) + '"></div></div>' +
          '<span class="text-xs font-mono text-slate-400 w-20 text-right">' + c.pct + '% (' + c.enforced + '/' + c.relevant + ')</span></div>';
      });
      comp += '</div>';
      h += '<div class="mb-4">' + card(comp) + '</div>';
    }

    // Top residual risks
    let risks = '<div class="flex items-center justify-between mb-4"><div class="text-sm uppercase tracking-wider text-slate-500">Top residual risks</div><span class="text-xs text-slate-500">behaviors currently permitted</span></div>';
    if (a.topRisks.length) {
      risks += '<div class="space-y-3">';
      a.topRisks.forEach(r => {
        risks += '<div class="rounded-lg border border-slate-800 bg-slate-950/40 p-4">' +
          '<div class="flex items-start gap-3"><span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold shrink-0 mt-0.5" style="background:' + sevColor(r.severityLabel) + '22;color:' + sevColor(r.severityLabel) + '">' + esc(r.severityLabel) + '</span>' +
          '<div class="min-w-0"><div class="text-sm text-slate-100 leading-snug">' + esc(r.title) + '</div>' +
          '<div class="text-xs text-slate-500 mt-0.5">' + esc(r.domain) + (r.nist ? ' · ' + esc(r.nist) : '') + '</div>' +
          '<div class="text-xs text-slate-400 mt-2 leading-relaxed"><span class="text-slate-300 font-medium">Mitigate: </span>' + esc(r.recommendation) + '</div></div></div></div>';
      });
      risks += '</div>';
    } else {
      risks += '<div class="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">No high-severity behaviors are left permitted. Strong posture.</div>';
    }
    h += '<div class="mb-4">' + card(risks) + '</div>';

    // Roadmap
    const phaseCol = (title, win, list, accent) => {
      let c = '<div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">' +
        '<div class="flex items-center gap-2 mb-1"><span class="h-2 w-2 rounded-full" style="background:' + accent + '"></span><span class="font-semibold text-white">' + title + '</span></div>' +
        '<div class="text-xs text-slate-500 mb-4">' + win + ' · ' + list.length + ' controls</div>';
      if (!list.length) c += '<div class="text-xs text-slate-600">No controls in this phase.</div>';
      list.slice(0, 8).forEach(x => {
        c += '<div class="text-xs text-slate-300 py-1.5 border-b border-slate-800/70 last:border-0 leading-snug"><span class="font-mono text-slate-500">' + esc(x.severityLabel[0]) + '</span> ' + esc(x.title) + '</div>';
      });
      if (list.length > 8) c += '<div class="text-xs text-slate-500 mt-2">+ ' + (list.length - 8) + ' more in the package</div>';
      return c + '</div>';
    };
    h += '<div class="mb-4"><div class="text-sm uppercase tracking-wider text-slate-500 mb-4">Implementation roadmap</div>' +
      '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">' +
      phaseCol('Phase 1 · Quick wins', '0–30 days', a.roadmap.phase1, '#22c55e') +
      phaseCol('Phase 2 · Rollout', '30–90 days', a.roadmap.phase2, '#3a7cff') +
      phaseCol('Phase 3 · Hardening', '90+ days', a.roadmap.phase3, '#8dedc7') +
      '</div></div>';

    // CTA
    h += '<div class="gradient-fill rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">' +
      '<div><div class="text-lg font-bold text-slate-950">Turn this into an operational program</div>' +
      '<div class="text-sm text-slate-950/70">BlueVoyant can validate your posture, deploy the controls, and run them 24/7.</div></div>' +
      '<div class="flex gap-2 shrink-0"><button id="downloadFromResults2" class="h-11 px-5 rounded-md bg-slate-950 text-white hover:bg-slate-900 transition-colors text-sm font-semibold">Download package</button>' +
      '<a href="https://www.bluevoyant.com/request-a-demo" target="_blank" rel="noopener noreferrer" class="h-11 px-5 rounded-md bg-white text-slate-950 hover:bg-slate-100 transition-colors text-sm font-bold flex items-center">Talk to BlueVoyant</a></div></div>';

    host.innerHTML = h;
    $('#backBtn').addEventListener('click', backToSurvey);
    $('#downloadFromResults').addEventListener('click', () => { if (guardZip()) openModal(); });
    $('#downloadFromResults2').addEventListener('click', () => { if (guardZip()) openModal(); });
  }

  function guardZip() {
    if (!window.JSZip) { alert('Package library is still loading — please try again in a moment.'); return false; }
    return true;
  }
  function showResults() { renderResults(runAnalysis()); $('#surveyView').classList.add('hidden'); $('#resultsView').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function backToSurvey() { $('#resultsView').classList.add('hidden'); $('#surveyView').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  // =================== Modal / download flow ===================
  let lastBlobUrl = null;
  function openModal() {
    $('#modalForm').classList.remove('hidden');
    $('#modalSuccess').classList.add('hidden');
    $('#formError').classList.add('hidden');
    $('#modal').classList.remove('hidden');
    $('#nameInput').focus();
  }
  function closeModal() {
    $('#modal').classList.add('hidden');
    if (lastBlobUrl) { URL.revokeObjectURL(lastBlobUrl); lastBlobUrl = null; }
  }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

  async function handleDownload() {
    const name = $('#nameInput').value.trim();
    const email = $('#emailInput').value.trim();
    const err = $('#formError');
    if (!name) { err.textContent = 'Please enter your name.'; err.classList.remove('hidden'); return; }
    if (!validEmail(email)) { err.textContent = 'Please enter a valid email address.'; err.classList.remove('hidden'); return; }
    err.classList.add('hidden');
    const btn = $('#downloadBtn');
    btn.disabled = true; btn.textContent = 'Building package…';
    try {
      const blob = await generatePackage(name, email);
      const url = URL.createObjectURL(blob);
      lastBlobUrl = url;
      const fname = 'AIShield-Governance-Package-' + new Date().toISOString().slice(0, 10) + '.zip';
      const a = document.createElement('a');
      a.href = url; a.download = fname; document.body.appendChild(a); a.click(); a.remove();
      const manual = $('#manualDownload');
      manual.href = url; manual.download = fname;
      $('#modalForm').classList.add('hidden');
      $('#modalSuccess').classList.remove('hidden');
    } catch (e) {
      err.textContent = 'Could not build the package: ' + e.message; err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Download package';
    }
  }

  // =================== Wire up ===================
  function init() {
    if (!DATA || !window.JSZip) { /* JSZip loads async; guarded at download time */ }
    renderPersona();
    applyDefaults();
    renderAll();

    const ta = $('#globalInstructions');
    ta.value = DEFAULT_INSTRUCTIONS;
    state.instructions = DEFAULT_INSTRUCTIONS;
    $('#charCount').textContent = ta.value.length;
    ta.addEventListener('input', () => { state.instructions = ta.value; $('#charCount').textContent = ta.value.length; });

    $('#expandAll').addEventListener('click', () => { visibleCategories().forEach(({ cat }) => state.expanded[cat === '__microsoft__' ? 'Microsoft' : cat] = true); renderControls(); });
    $('#collapseAll').addEventListener('click', () => { state.expanded = {}; renderControls(); });
    $('#resetBtn').addEventListener('click', () => {
      state.persona = { posture: '', regulations: [], frameworks: [], aiTech: [], os: [], dataGov: '' };
      state.expanded = {};
      applyDefaults();
      ta.value = DEFAULT_INSTRUCTIONS; state.instructions = DEFAULT_INSTRUCTIONS; $('#charCount').textContent = ta.value.length;
      renderPersona(); renderAll();
      $('#resultsView').classList.add('hidden');
      $('#surveyView').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('#reviewBtn').addEventListener('click', showResults);
    $('#cancelBtn').addEventListener('click', closeModal);
    $('#closeSuccess').addEventListener('click', closeModal);
    $('#downloadBtn').addEventListener('click', handleDownload);
    $('#emailInput').addEventListener('keydown', e => { if (e.key === 'Enter') handleDownload(); });
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
