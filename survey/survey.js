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
        { v: 'call', label: 'Schedule a call with Patriot to help me' },
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
    md += '> Generated by AIShield (Patriot Consulting clone) on ' + date + '.\n\n';
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
    md += 'Patriot Consulting can review and operationalize it — contact 1-844-560-4630 or info@patriotconsulting.com._\n';
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

  async function generatePackage(name, email) {
    const ctrls = selectedControls();
    const enforced = ctrls.filter(c => c.decision === 'BLOCK');
    const zip = new JSZip();
    const date = new Date().toISOString().slice(0, 10);

    zip.file('README.txt',
      'AIShield AI Governance Package\n==============================\n\n' +
      'Prepared for: ' + name + ' <' + email + '>\nGenerated: ' + date + '\n\n' +
      'Contents:\n' +
      '  policy/AI-Governance-Policy.md   NIST AI RMF 1.0-aligned policy tailored to your selections\n' +
      '  selections.json                  Machine-readable record of every answer and decision\n' +
      '  configs/intune/                  Microsoft Intune device configuration baseline\n' +
      '  configs/jamf/                    Jamf configuration profile skeleton\n' +
      '  configs/powershell/              PowerShell enforcement skeleton\n' +
      '  configs/bash/                    Bash enforcement skeleton\n\n' +
      enforced.length + ' controls are enforced (BLOCK).\n\n' +
      'These configs are generated from your selections as a deployment starting point.\n' +
      'Patriot Consulting can review and operationalize them: 1-844-560-4630 / info@patriotconsulting.com\n');

    zip.file('policy/AI-Governance-Policy.md', buildPolicyMarkdown(name, email));
    zip.file('selections.json', JSON.stringify({
      contact: { name, email }, generatedAt: new Date().toISOString(),
      persona: state.persona, globalInstructions: state.instructions || DEFAULT_INSTRUCTIONS,
      controls: ctrls,
    }, null, 2));
    zip.file('configs/intune/ai-governance.json', buildIntune(enforced));
    zip.file('configs/jamf/ai-governance.mobileconfig.plist', buildJamf(enforced));
    zip.file('configs/powershell/Deploy-AIControls.ps1', buildPowershell(enforced));
    zip.file('configs/bash/deploy-ai-controls.sh', buildBash(enforced));

    return zip.generateAsync({ type: 'blob' });
  }

  function postureLabel(v) { return ({ lockdown: 'Lock it all down', middle: 'Find the middle ground', friendly: 'Developer Friendly' })[v] || ''; }
  function dataGovLabel(v) { return v === 'call' ? 'Requested a call with Patriot' : v; }
  function groupBy(arr, fn) { return arr.reduce((a, x) => { const k = fn(x); (a[k] = a[k] || []).push(x); return a; }, {}); }

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('#reviewBtn').addEventListener('click', () => {
      if (!window.JSZip) { alert('Package library is still loading — please try again in a moment.'); return; }
      openModal();
    });
    $('#cancelBtn').addEventListener('click', closeModal);
    $('#closeSuccess').addEventListener('click', closeModal);
    $('#downloadBtn').addEventListener('click', handleDownload);
    $('#emailInput').addEventListener('keydown', e => { if (e.key === 'Enter') handleDownload(); });
    $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
