/* AIShield scoring & analysis engine.
 * Turns raw BLOCK/ALLOW decisions into the things a CISO actually reports on:
 * a weighted governance posture score, residual risk, NIST AI RMF function
 * coverage, compliance crosswalk, top residual risks, and a phased roadmap.
 * Pure functions, no DOM, no dependencies. */
window.AISHIELD = window.AISHIELD || {};
(function () {
  'use strict';

  const HIGH_KW = [
    /remote control/i, /remote access/i, /exfiltrat/i, /unsanctioned/i, /\bMCP\b/i,
    /\bplugin/i, /background|scheduled|dispatch/i, /human-in-the-loop|without .*approval|no human/i,
    /credential/i, /unrestricted/i, /\bshadow/i, /personal (subscription|account|chat)/i, /OAuth/i,
    /computer[ -]use/i, /GUI control/i, /clipboard/i, /full disk|filesystem|file system/i,
    /autonom/i, /browser extension/i, /PII|Personally Identifiable|customer (name|data)/i,
  ];

  function nistFunctions(s) {
    s = s || ''; const out = [];
    if (/Govern/i.test(s)) out.push('Govern');
    if (/\bMap\b/i.test(s)) out.push('Map');
    if (/Measure/i.test(s)) out.push('Measure');
    if (/Manage/i.test(s)) out.push('Manage');
    return out.length ? out : ['Govern'];
  }
  function csfFunction(s) {
    const m = (s || '').match(/CSF (Identify|Protect|Detect|Respond|Recover|Govern)/i);
    return m ? cap(m[1]) : null;
  }
  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1).toLowerCase(); }

  const DOMAINS = ['Access & Identity', 'Data Security', 'Autonomy & Agents', 'Supply Chain & Extensions', 'Shadow AI', 'Monitoring & Audit'];

  function domainOf(c) {
    const t = (c.title || c.question || '') + ' ' + (c.if_no || c.description || '') + ' ' + (c.category || '');
    if (/shadow|personal (subscription|account|chat)|OAuth/i.test(t)) return 'Shadow AI';
    if (/audit|retention|telemetry|\blog\b|logging|detection|monitor/i.test(t)) return 'Monitoring & Audit';
    if (/\bMCP\b|plugin|extension|connector|marketplace/i.test(t)) return 'Supply Chain & Extensions';
    if (/remote|background|scheduled|autonom|computer[ -]use|\bGUI\b|dispatch|human-in-the-loop|\bagent/i.test(t)) return 'Autonomy & Agents';
    if (/\bdata\b|web search|exfiltrat|clipboard|PII|customer/i.test(t)) return 'Data Security';
    return 'Access & Identity';
  }

  const CAT_BASE = {
    'Shadow AI / Personal AI Subscriptions': 5, 'Codex Desktop': 5, 'Codex CLI': 4,
    'Claude in Chrome': 4, 'Claude Code in Web Browser': 4, 'AI Auditing': 4,
    'Claude Desktop/Cowork': 3, 'Claude CLI': 4,
  };

  function severity(c) {
    const t = (c.title || c.question || '') + ' ' + (c.if_no || c.description || '');
    let s = CAT_BASE[c.category] != null ? CAT_BASE[c.category] : 3;
    let boost = 0;
    HIGH_KW.forEach(re => { if (re.test(t)) boost++; });
    s += boost >= 2 ? 2 : boost >= 1 ? 1 : 0;
    return Math.max(1, Math.min(5, s));
  }
  function effort(c) {
    const t = c.if_no || c.description || '';
    if (/MDM|Intune|Jamf|managed-settings|managed-mcp|deploy|WDAC|App Control|GPO|registry|mobileconfig|\bRBAC\b/i.test(t)) return 3;
    if (/admin settings|toggle|disable .*in|Organization settings|\bsetting/i.test(t)) return 1;
    return 2;
  }
  function enablementImpact(c) {
    const q = c.title || c.question || '';
    if (/unrestricted,? *org-wide access/i.test(q)) return 3;
    if (/web search|sandbox|chrome|developer|velocity|\bCLI\b|cowork/i.test(q)) return 2;
    return 1;
  }
  const EFFORT_LABEL = { 1: 'Low', 2: 'Medium', 3: 'High' };
  const SEV_LABEL = { 1: 'Informational', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Critical' };

  // Suggested accountable owner by domain — a starting RACI for the risk register.
  const OWNER = {
    'Access & Identity': 'IAM / Identity team',
    'Data Security': 'Data Protection / DLP team',
    'Autonomy & Agents': 'Application Security',
    'Supply Chain & Extensions': 'Security Architecture',
    'Shadow AI': 'SOC / Security Operations',
    'Monitoring & Audit': 'GRC / Compliance',
  };

  function enrich(c) {
    const sev = severity(c);
    const eff = effort(c);
    const dom = domainOf(c);
    return Object.assign({}, c, {
      severity: sev, severityLabel: SEV_LABEL[sev],
      effort: eff, effortLabel: EFFORT_LABEL[eff],
      enablement: enablementImpact(c),
      domain: dom, owner: OWNER[dom],
      nistFns: nistFunctions(c.nist), csf: csfFunction(c.nist),
    });
  }

  // Which control domains each compliance obligation most depends on.
  const FRAMEWORK_DOMAINS = {
    'SOC 2': ['Monitoring & Audit', 'Access & Identity'],
    'ISO 27001': ['Monitoring & Audit', 'Access & Identity', 'Supply Chain & Extensions'],
    'HITRUST': ['Monitoring & Audit', 'Data Security'],
    'CIS Controls': ['Access & Identity', 'Monitoring & Audit', 'Supply Chain & Extensions'],
    'NIST CSF': ['Monitoring & Audit', 'Access & Identity', 'Autonomy & Agents'],
    'NIST 800-53': ['Monitoring & Audit', 'Access & Identity', 'Data Security'],
    'NIST 800-171': ['Data Security', 'Access & Identity', 'Monitoring & Audit'],
    'PCI-DSS': ['Data Security', 'Monitoring & Audit', 'Access & Identity'],
    'HIPAA / HITECH': ['Data Security', 'Monitoring & Audit', 'Shadow AI'],
    'SOX': ['Monitoring & Audit', 'Access & Identity'],
    'GLBA': ['Data Security', 'Monitoring & Audit'],
    'FERPA': ['Data Security', 'Shadow AI'],
    'FDA 21 CFR Part 11': ['Monitoring & Audit', 'Data Security'],
    'CCPA / CPRA': ['Data Security', 'Shadow AI'],
    'GDPR': ['Data Security', 'Shadow AI', 'Monitoring & Audit'],
    'FedRAMP / FISMA': ['Access & Identity', 'Data Security', 'Monitoring & Audit', 'Autonomy & Agents'],
    'CMMC / DFARS': ['Access & Identity', 'Data Security', 'Monitoring & Audit', 'Supply Chain & Extensions'],
  };

  function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

  function analyze(persona, controls) {
    const enriched = controls.map(enrich);
    const blocked = enriched.filter(c => c.decision === 'BLOCK');
    const allowed = enriched.filter(c => c.decision === 'ALLOW');

    // Weighted posture: share of total risk-weight that is actually controlled.
    const totalWeight = enriched.reduce((a, c) => a + c.severity, 0);
    const coveredWeight = blocked.reduce((a, c) => a + c.severity, 0);
    const postureScore = pct(coveredWeight, totalWeight);
    const residualIndex = 100 - postureScore;

    // NIST AI RMF function coverage.
    const FN = ['Govern', 'Map', 'Measure', 'Manage'];
    const byFunction = {};
    FN.forEach(fn => {
      const rel = enriched.filter(c => c.nistFns.includes(fn));
      const cov = rel.filter(c => c.decision === 'BLOCK');
      byFunction[fn] = { total: rel.length, covered: cov.length, pct: pct(cov.length, rel.length) };
    });

    // Coverage by control domain.
    const byDomain = {};
    DOMAINS.forEach(d => {
      const rel = enriched.filter(c => c.domain === d);
      if (!rel.length) return;
      const cov = rel.filter(c => c.decision === 'BLOCK');
      const w = rel.reduce((a, c) => a + c.severity, 0);
      const cw = cov.reduce((a, c) => a + c.severity, 0);
      byDomain[d] = { total: rel.length, covered: cov.length, pct: pct(cw, w) };
    });

    // Compliance crosswalk for selected obligations.
    const obligations = [...(persona.frameworks || []), ...(persona.regulations || [])];
    const compliance = obligations.map(name => {
      const doms = FRAMEWORK_DOMAINS[name] || [];
      const rel = enriched.filter(c => doms.includes(c.domain));
      const cov = rel.filter(c => c.decision === 'BLOCK');
      const p = pct(cov.length, rel.length);
      return {
        name, relevant: rel.length, enforced: cov.length, pct: p,
        status: p >= 80 ? 'On track' : p >= 50 ? 'Partial' : 'Gap',
        gaps: rel.filter(c => c.decision === 'ALLOW').sort((a, b) => b.severity - a.severity).slice(0, 4),
      };
    });

    // Maturity tier (NIST AI RMF-style tiers).
    const dg = persona.dataGov;
    let tier = 1;
    if (postureScore >= 45) tier = 2;
    if (postureScore >= 68) tier = 3;
    if (postureScore >= 85) tier = 4;
    // Maturity beyond "Repeatable" requires a data-governance foundation.
    if (tier >= 3 && dg !== 'Complete') tier = Math.min(tier, dg === 'Not Started' ? 2 : 3);
    if (tier === 4 && dg !== 'Complete') tier = 3;
    const TIERS = {
      1: { name: 'Partial', blurb: 'Ad-hoc AI use with limited governance. Risk is largely unmanaged.' },
      2: { name: 'Risk-Informed', blurb: 'Key risks identified and some controls in place, but coverage is inconsistent.' },
      3: { name: 'Repeatable', blurb: 'Governance is formalized and consistently applied across AI vendors and endpoints.' },
      4: { name: 'Adaptive', blurb: 'Governance is continuously measured and improved with strong enablement balance.' },
    };

    // Top residual risks = highest-severity behaviors left permitted.
    const topRisks = allowed.slice().sort((a, b) => b.severity - a.severity || b.enablement - a.enablement).slice(0, 6)
      .map(c => ({
        title: c.title || c.question, severity: c.severity, severityLabel: c.severityLabel,
        domain: c.domain, vendor: c.vendor, nist: c.nist || '',
        recommendation: c.if_no || 'Apply this control (set to BLOCK) to mitigate.',
      }));

    // Roadmap = the controls chosen to enforce, sequenced quick-wins first.
    const toImplement = blocked.slice().map(c => ({
      title: c.title || c.question, domain: c.domain, severity: c.severity, severityLabel: c.severityLabel,
      effort: c.effort, effortLabel: c.effortLabel, owner: c.owner, vendor: c.vendor,
      steps: c.if_no || '', nist: c.nist || '',
    }));
    const score = c => c.severity * 2 - c.effort; // high impact, low effort first
    toImplement.sort((a, b) => score(b) - score(a));
    const phase1 = toImplement.filter(c => c.severity >= 4 && c.effort <= 2);
    const phase1ids = new Set(phase1.map(c => c.title));
    const phase3 = toImplement.filter(c => !phase1ids.has(c.title) && c.severity <= 3 && c.effort >= 2);
    const phase3ids = new Set(phase3.map(c => c.title));
    const phase2 = toImplement.filter(c => !phase1ids.has(c.title) && !phase3ids.has(c.title));

    // Enablement balance: how much developer velocity is being preserved.
    const enablementControls = enriched.filter(c => c.enablement >= 2);
    const enablementAllowed = enablementControls.filter(c => c.decision === 'ALLOW').length;
    const enablementBalance = pct(enablementAllowed, enablementControls.length);

    return {
      counts: { total: enriched.length, enforced: blocked.length, permitted: allowed.length },
      postureScore, residualIndex,
      maturity: { tier, name: TIERS[tier].name, blurb: TIERS[tier].blurb },
      byFunction, byDomain, compliance, topRisks,
      roadmap: { phase1, phase2, phase3 },
      enablementBalance,
      enriched,
      generatedAt: new Date().toISOString(),
    };
  }

  window.AISHIELD.scoring = { analyze, enrich, SEV_LABEL, DOMAINS };
})();
