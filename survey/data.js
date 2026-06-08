// Auto-derived from the public aishield365.ai survey bundle for this clone.
window.SURVEY_DATA={
  "questions": [
    {
      "category": "Claude Desktop/Cowork",
      "question": "Allow or block unrestricted, org-wide access to Claude Cowork (no role-based gating)",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Android",
        "iOS"
      ],
      "preamble": "What 'admin-level gating' means: Cowork Admin Settings let you disable Cowork org-wide, restrict it by role (Enterprise plans only), or leave it on for everyone by default. Without gating, contractors, interns, and new hires get the same access as long-tenured employees on day one.",
      "if_no": "Toggle Cowork OFF organization-wide in Admin Settings > Capabilities (or use Enterprise RBAC custom roles to limit Cowork access).",
      "nist_alignment": "AI RMF Govern 1.1 + CSF Protect PR.AC",
      "note": "Org-wide toggle is the only control on Team plans; Enterprise adds per-role granularity.",
      "consultantNote": "Cowork is genuinely transformative for cross-functional teams — think real-time AI collaboration that accelerates projects by weeks. But an ungated rollout means every contractor, new hire, and intern has full access from day one. Start with a phased rollout by role, not a full block. And don't let 'no AI' become your default policy — if you block the org-managed deployment, employees will connect their personal ChatGPT or Claude accounts to M365 via OAuth, and their personal chat history will hold your customer data with no path to recover it on termination, no MFA you can enforce, and an open IP-ownership argument if the subscription was on their personal card. Govern it; don't ban it.",
      "id": "ctrl_1",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude Desktop/Cowork",
      "question": "Allow or block Cowork from driving Chrome via the Cowork-to-Chrome bridge",
      "operatingSystems": [
        "Windows",
        "macOS"
      ],
      "preamble": "What it is: a Cowork feature that lets the desktop app reach into a Chrome window you've authorized and drive it — clicking, typing, navigating, reading pages — on Cowork's initiative. Different from the standalone Claude Chrome extension, where the human is the actor.",
      "if_no": "Disable Cowork's Chrome bridge in Admin Settings > Connectors. This is separate from disabling the standalone Claude Chrome extension — the two are configured independently even though they share the same extension plumbing.",
      "nist_alignment": "AI RMF Map 1.1 + CSF Protect PR.DS",
      "note": "Chrome bridge is on by default on non-Enterprise plans.",
      "consultantNote": "The Cowork-to-Chrome bridge is different from the standalone Claude Chrome extension, and worth understanding before you decide. The standalone extension lets a human user inside their browser ask Claude to read or act on the page they are already looking at — the user is the actor, Claude is the assistant. The Cowork-to-Chrome bridge is the inverse: Cowork (the desktop app) reaches into a Chrome window you have authorized and drives it on Cowork's initiative — clicking, typing, navigating, and reading pages from a workflow, skill, or scheduled task. Both use the same Chrome extension as plumbing, but the threat model is different. With the bridge, the agent making decisions is Cowork (and any background process you have authorized), not the human in front of the screen. That widens the prompt-injection blast radius substantially — a malicious page can now hijack a workflow rather than just a single user interaction. If you have already restricted autonomous Cowork behaviors (Dispatch, scheduled tasks), the marginal risk of the bridge is small. If you have not, the bridge multiplies whatever exposure those features carry.",
      "id": "ctrl_2",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude Desktop/Cowork",
      "question": "Allow or block Cowork's built-in web search without a domain allowlist",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Android",
        "iOS"
      ],
      "preamble": "What it is: Cowork's built-in tool that lets the assistant search the open web and pull pages back into the conversation, without opening a browser. Separate connector from the Chrome bridge.",
      "if_no": "Set org-wide web-search restrictions or domain allowlists in Cowork Admin Settings > Connectors.",
      "nist_alignment": "AI RMF Map 1.1 + CSF Protect PR.DS",
      "note": "Cowork's built-in web search is a separate connector from the Chrome bridge — disabling one does not disable the other.",
      "consultantNote": "Unrestricted web search inside Cowork is a legitimate productivity multiplier — your developers research faster, debug better, ship sooner. The real risk is data exfiltration through prompts that inadvertently include internal IP being sent to whichever search backend Cowork uses, plus the inverse risk: prompt-injected content inside search results steering downstream actions. A domain allowlist or category-level restriction preserves most of the research value while keeping your crown jewels off the open internet.",
      "id": "ctrl_3",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude Desktop/Cowork",
      "question": "Allow or block users from installing or connecting unsanctioned MCP servers and plugins in Cowork",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "preamble": "What it is: MCP (Model Context Protocol) servers and plugins extend Claude Code Desktop/CLI/IDE to your tools — Jira, Salesforce, your CRM, internal databases. The enforceable controls are managed-settings.json policy, managed-mcp.json for a fixed MCP set, and managed marketplace restrictions.",
      "if_no": "Deploy managed-settings.json with strict marketplace/plugin restrictions and managed-mcp.json via MDM (Jamf/Intune) so only org-approved MCPs/plugins can be used.",
      "nist_alignment": "AI RMF Manage 2.2 + CSF Protect PR.PS",
      "note": "AIShield ships a lockdown baseline. IT must replace the empty managed-mcp.json server map with approved MCP entries before rollout if any MCPs should remain available.",
      "consultantNote": "The actual enforceable controls here are not a click-to-approve UI. Claude Code supports managed MCP control through managed-mcp.json, MCP allow/deny policy through managed settings, and marketplace restrictions through strictKnownMarketplaces / strictPluginOnlyCustomization. AIShield ships a conservative empty-server baseline because your approved MCP list is tenant-specific. Before production rollout, convert the approved MCP inventory into managed-mcp.json entries or keep the empty map to disable MCP entirely. For plugins, restrict marketplace sources first; otherwise a plugin can become a supply-chain path for skills, hooks, agents, and MCP servers.",
      "id": "ctrl_4",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude Desktop/Cowork",
      "question": "Allow or block Cowork from running scheduled, background, or Dispatch tasks without human-in-the-loop approval",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Android",
        "iOS"
      ],
      "preamble": "What it is: Cowork can run skills, workflows, and scheduled tasks autonomously without a person watching. Dispatch additionally lets you trigger or interact with these tasks from a mobile phone — effectively giving Cowork a remote-control channel from the phone into a corporate workstation.",
      "if_no": "Disable Dispatch toggle (Admin Settings > Capabilities) and enforce folder-scoping / mount-point restrictions.",
      "nist_alignment": "AI RMF Measure 1.2",
      "note": "Prevents persistent autonomous execution.",
      "consultantNote": "Background automation is where AI stops being a tool and starts being an agent — and that's where things get interesting, fast. The productivity case is real: automated research, scheduled summaries, proactive alerts. The risk is equally real: autonomous actions without a human in the loop can cascade into irreversible changes. Require approval checkpoints on any Dispatch workflow that touches production systems. One Dispatch-specific risk worth interrogating before you enable it: Dispatch effectively grants remote-control access to a corporate workstation from a mobile phone. Ask the obvious questions — are those phones enrolled in your MDM, covered by mobile threat defense, and subject to the same compliance posture as the corporate workstation itself? A jailbroken, lost, or malware-infected phone now becomes a remote-control channel into the user's corporate machine. Termination scenarios are equally important: a disgruntled or recently-exited employee with Dispatch still active can drive their (former) corporate machine from their personal phone until you revoke the session. Treat Dispatch like any other remote access tool — tie it to a managed mobile device posture, document session revocation in your offboarding runbook, and make sure terminating identity also terminates active Dispatch channels, not just account access.",
      "id": "ctrl_5",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude Desktop/Cowork",
      "question": "Allow or block Claude Desktop Computer Use on managed Windows and macOS endpoints",
      "operatingSystems": [
        "Windows",
        "macOS"
      ],
      "preamble": "What it is: Claude Desktop Computer Use lets Claude open apps, control the screen, and work directly on the user's actual desktop. Anthropic documents it as a research preview for macOS and Windows on Pro or Max plans, off by default, and not available on Team or Enterprise plans.",
      "if_no": "Keep Claude Desktop Computer Use disabled in Settings. On macOS, deny or tightly review Accessibility and Screen Recording permissions; on Windows, treat the desktop-app toggle as a user-level exception until Anthropic exposes enterprise enforcement.",
      "nist_alignment": "AI RMF Manage 1.3 + CSF Protect PR.AC",
      "note": "Claude Desktop Computer Use runs on the actual desktop, not the sandboxed Bash boundary. It is currently a Pro/Max preview rather than a Team/Enterprise capability.",
      "consultantNote": "Patriot's take: do not confuse this with a normal coding assistant permission. Computer Use gives Claude a screen, keyboard, and pointer on the user's real machine, so anything visible in apps, browser windows, simulators, and prompts can become model context. For most enterprises the right answer is not broad enablement; it is a documented exception for lab devices, mobile simulators, or GUI-only test workflows, with endpoint evidence showing macOS Accessibility and Screen Recording are denied by default.",
      "id": "ctrl_6",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude CLI",
      "question": "Allow or block developers from bypassing Claude Code permission prompts or using auto mode without managed policy",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Set permissions.disableBypassPermissionsMode = \"disable\", permissions.disableAutoMode = \"disable\", and allowManagedPermissionRulesOnly = true in managed-settings.json.",
      "nist_alignment": "AI RMF Manage 1.3",
      "note": "Managed settings apply across Claude Code CLI, IDE, and Desktop and cannot be overridden by user/project settings.",
      "consultantNote": "Developers hate permission prompts — every click breaks their flow. We get it. But bypass mode and unmanaged auto mode are exactly where a prompt injection turns into command execution. Disable bypass and auto mode in managed settings, then approve exceptions through change management for isolated environments where the risk is understood.",
      "id": "ctrl_7",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude CLI",
      "question": "Allow or block Bash, file, and network commands in the Claude CLI running without per-command allow/deny rules",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Add explicit managed permissions in managed-settings.json (deny curl/wget/nc/WebFetch and secret reads; ask before broad Edit/Write and destructive shell commands).",
      "nist_alignment": "CSF Protect PR.PS + AI RMF Map 2.2",
      "note": "Permission rules are nested under the permissions object and take managed-setting precedence.",
      "consultantNote": "This is the CISO question that keeps us up at night. Unrestricted CLI access means Claude can read your .env files, curl internal services, and write anywhere on the filesystem. The productivity gain from full access is marginal compared to scoped access. Deny .env reads and external network by default — your devs keep 95% of their velocity and you close a gaping attack surface.",
      "id": "ctrl_8",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude CLI",
      "question": "Allow or block users from running custom or non-managed hooks in the Claude CLI",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Set \"allowManagedHooksOnly\": true in managed-settings.json.",
      "nist_alignment": "AI RMF Govern 2.1",
      "note": "Prevents persistence via malicious pre/post hooks.",
      "consultantNote": "Custom hooks are a power feature that enable workflow automation most developers never use anyway. The threat model here is subtle but nasty: a malicious hook installed via a compromised repo creates persistent code execution on every Claude CLI invocation. Lock it to managed hooks — your power users won't notice and your security team will thank you.",
      "id": "ctrl_9",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude CLI",
      "question": "Allow or block Claude CLI Computer Use research preview on macOS",
      "operatingSystems": [
        "macOS"
      ],
      "preamble": "What it is: Claude CLI exposes Computer Use as a built-in MCP server named computer-use. It is off by default, persists per project once enabled, and Anthropic currently documents the CLI preview for macOS with Pro or Max plan requirements plus Accessibility and Screen Recording permissions.",
      "if_no": "Keep the computer-use MCP server disabled for Claude CLI projects unless a documented macOS lab exception is approved; deny or review Accessibility and Screen Recording through MDM/TCC policy.",
      "nist_alignment": "AI RMF Manage 1.3 + CSF Protect PR.AC",
      "note": "Claude CLI Computer Use is currently macOS-only, requires Pro or Max, is not available on Team or Enterprise plans, and uses per-session app approvals after the built-in MCP server is enabled.",
      "consultantNote": "Patriot's take: the CLI version is safer than a blanket desktop handoff only if you keep it project-scoped and permission-scoped. It still crosses a serious boundary: a terminal AI session can ask for GUI control, clipboard access, and app approvals. Allow it for simulator testing and GUI-only QA on managed Macs, not as a default developer capability.",
      "id": "ctrl_10",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude CLI",
      "question": "Allow or block Claude Remote Control from iOS or Android devices into local Claude Code sessions",
      "operatingSystems": [
        "Android",
        "iOS"
      ],
      "preamble": "What it is: Remote Control lets a user drive a running Claude Code CLI or VS Code session from claude.ai/code or the Claude mobile app. The local machine remains the execution host; the phone sends prompts, approvals, and follow-up messages over Anthropic's TLS relay.",
      "if_no": "Disable Remote Control by default in Claude Code settings and require any mobile approval path to use enrolled iOS/Android devices, device compliance, screen lock, push-notification review, and an offboarding step that revokes active sessions.",
      "nist_alignment": "AI RMF Manage 1.3 + CSF Protect PR.AC",
      "note": "Remote Control opens no inbound ports, but it creates a mobile command channel into local tools, MCP servers, project files, and shell access.",
      "consultantNote": "Patriot's take: Remote Control is operationally useful, especially when a long-running task needs a decision while the engineer is away. The governance question is whether a personal phone can steer a corporate workstation. If the mobile device is not enrolled, compliant, and revocable, a lost phone or stale session becomes remote access to local code, credentials, and tools. Treat it like privileged remote access, not like a notification feature.",
      "id": "ctrl_11",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude Code in Web Browser",
      "question": "Allow or block open network egress from Claude Code (web) cloud sandboxes (no domain allowlist)",
      "if_no": "Force \"No network access\" or custom restricted-domain environment (default allowlist is broad).",
      "nist_alignment": "AI RMF Manage 1.1 + CSF Protect PR.IP",
      "note": "Git operations route through Anthropic's scoped proxy automatically.",
      "consultantNote": "Cloud sandboxes with broad network access are a data exfiltration path dressed up as a productivity feature. Yes, your devs need to pull packages and hit APIs — but they don't need unrestricted egress from a session that may contain your proprietary code. Define a domain allowlist that covers your package registries and internal APIs. Git operations work fine through the proxy regardless.",
      "id": "ctrl_12",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude Code in Web Browser",
      "question": "Allow or block developers from bringing their own credentials into Claude Code (web) sessions",
      "if_no": "Use the isolated cloud sandbox + enforce no sensitive credentials in the session (proxy handles git auth).",
      "nist_alignment": "AI RMF Map 1.5",
      "note": "Credentials never enter the sandbox.",
      "consultantNote": "The cloud sandbox is actually one of the better security stories in this space — credentials don't enter the session by design. What you're protecting against is developers who bring their own auth tokens into the session because it's convenient. Document and enforce the credential-free workflow; the proxy-based git auth covers the common case without any productivity loss.",
      "id": "ctrl_13",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude in Chrome",
      "question": "Allow or block the Claude Chrome extension organization-wide",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Toggle the extension OFF org-wide in Admin Settings > Capabilities (or use site blocklist).",
      "nist_alignment": "AI RMF Govern 1.2 + CSF Protect PR.AC",
      "note": "Extension is Beta; high prompt-injection surface.",
      "consultantNote": "Browser extensions that read page content are inherently high-risk — they sit between your employees and everything they do online. Claude in Chrome is genuinely useful for summarizing, drafting, and researching. But it's also Beta with a large prompt-injection attack surface. Consider an allowlist rollout to specific roles (marketing, research) while keeping it off for finance, legal, and engineering.",
      "id": "ctrl_14",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude in Chrome",
      "question": "Allow or block Claude in Chrome from interacting with sites the user visits, without a configured allowlist",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Configure a site allowlist in the Claude Chrome extension (Permissions > Your approved sites). The extension only operates on sites you have explicitly approved, so there is no separate blocklist control — the allowlist is the protection.",
      "nist_alignment": "CSF Protect PR.DS",
      "note": "The Claude Chrome extension's permission model is allowlist-only; if a site isn't on the approved list, the extension cannot read or act on it.",
      "consultantNote": "Browser extensions that can read and click on any page are inherently high-risk surfaces — they sit between your employees and everything they do online. The Claude Chrome extension gives you two practical choices: allow on every site, or allow only on a specific approved list. There is no separate blocklist option — if a site is not on your approved list, the extension simply has no permission to operate there. For most organizations, the right answer is an allowlist that covers your research and productivity domains (CRM, marketing tools, public web, knowledge bases) and explicitly omits your internal admin consoles — AWS/Azure/GCP, your Okta or Entra admin, Workday or your HRIS, your billing or finance SaaS. Because the extension cannot operate outside the allowlist, a prompt-injected internal admin page cannot trigger AI-driven privilege escalation — the extension has no foothold there to begin with. Plan the allowlist before rollout. Adding a site after an 'I need this' request is much easier than removing one after an incident.",
      "id": "ctrl_15",
      "vendor": "Anthropic"
    },
    {
      "category": "Claude in Chrome",
      "question": "Allow or block autonomous (hands-off) mode in Claude in Chrome",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Force default \"Ask Before Acting\" mode; disable pre-approve for high-risk actions (purchases, deletes).",
      "nist_alignment": "AI RMF Manage 2.3",
      "note": "Even in Follow-Plan mode, irreversible actions still prompt.",
      "consultantNote": "Autonomous mode in a browser extension means Claude can click, submit, and purchase on behalf of your employees. The efficiency argument is real for repetitive workflows. The risk argument is equally real: a prompt-injected instruction on a page can trigger irreversible actions. \"Ask Before Acting\" costs maybe 30 seconds per workflow and keeps a human in the loop on consequential decisions.",
      "id": "ctrl_16",
      "vendor": "Anthropic"
    },
    {
      "category": "Codex Desktop",
      "question": "Allow or block Codex Desktop from controlling screen, keyboard, and mouse without per-session approval",
      "operatingSystems": [
        "Windows",
        "macOS"
      ],
      "if_no": "Deploy Codex requirements.toml with [features].computer_use = false unless Computer Use is approved; separately review macOS Screen Recording/Accessibility permissions.",
      "nist_alignment": "AI RMF Manage 1.3 + CSF Protect PR.AC",
      "note": "OpenAI documents Codex Computer Use for macOS and Windows. Windows use runs on the active desktop; macOS requires Screen Recording and Accessibility.",
      "consultantNote": "Full computer-use without approval is the most powerful — and most dangerous — AI capability you will deploy. We're talking about an agent that can see your screen, type passwords, and click through UIs. The productivity case is compelling for isolated dev tasks, and Windows support now makes this a mainstream endpoint question rather than a Mac-only edge case. The risk case is a fully compromised machine if the agent is misdirected. Keep the generated requirements.toml block unless you have a governed exception, and require per-app approval plus macOS TCC review where applicable.",
      "id": "ctrl_17",
      "vendor": "OpenAI"
    },
    {
      "category": "Codex Desktop",
      "question": "Allow or block unvetted Codex Desktop plugins and marketplace extensions",
      "operatingSystems": [
        "Windows",
        "macOS"
      ],
      "if_no": "Use Codex cloud managed requirements to disable plugin sharing where needed, and require manual review of installed/enabled plugins in the Codex app or CLI plugin browser.",
      "nist_alignment": "AI RMF Map 2.1",
      "note": "OpenAI documents plugin enable/disable state in config.toml and plugin sharing control in managed requirements, but not a local MDM marketplace allowlist equivalent.",
      "consultantNote": "Codex plugins can bundle skills, MCP servers, apps, and hooks, so plugin review belongs in the same supply-chain lane as browser extensions and developer tooling. Do not hand your infrastructure team a fake config key for marketplace lockdown. Use the documented managed requirement to disable plugin sharing where appropriate, keep a vetted workspace marketplace, and require periodic review of installed and enabled plugins until OpenAI exposes a stronger managed allowlist.",
      "id": "ctrl_18",
      "vendor": "OpenAI"
    },
    {
      "category": "Codex Desktop",
      "question": "Allow or block Codex Desktop running under your full user account with access to stored credentials",
      "operatingSystems": [
        "Windows",
        "macOS"
      ],
      "if_no": "Deploy Codex requirements.toml to allow only read-only/workspace-write sandbox modes and deny reads of credential paths such as ~/.ssh, ~/.aws, ~/.kube, and .env files.",
      "nist_alignment": "CSF Protect PR.DS",
      "note": "Use requirements.toml for non-overridable sandbox and deny-read requirements; use managed_config.toml only for starting defaults.",
      "consultantNote": "Running a computer-use AI agent with full session privileges on an account that holds credentials is like leaving your car running with the keys inside. Workspace-scoped sandbox mode eliminates this risk with zero productivity impact for legitimate coding workflows. Any developer who needs broader access for a specific task can request it through a privileged session — don't make it the default.",
      "id": "ctrl_19",
      "vendor": "OpenAI"
    },
    {
      "category": "Codex Desktop",
      "question": "Allow or block Codex remote connections, mobile remote control, and SSH hosts",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux",
        "Android",
        "iOS"
      ],
      "preamble": "What it is: Codex remote connections let signed-in devices or the ChatGPT mobile app continue work on a connected host. SSH host support lets the Codex App run threads against a remote filesystem and shell; the host supplies project files, plugins, MCP servers, browser access, Computer Use, credentials, and approvals.",
      "if_no": "Do not enable Codex Remote Control or SSH hosts unless the host is inventoried, managed, awake/locked appropriately, and reachable only through approved SSH, VPN, or mesh networking. For mobile access, require managed iOS/Android devices and documented session revocation.",
      "nist_alignment": "AI RMF Manage 1.3 + CSF Protect PR.AC",
      "note": "OpenAI warns not to expose Codex app-server transports directly on shared or public networks; use SSH plus VPN or mesh networking for remote reachability.",
      "consultantNote": "Patriot's take: this is remote access to the workstation or dev host where the real context lives. The phone is just the steering wheel; the connected host provides files, shell, plugins, MCP servers, signed-in websites, and Computer Use. That makes SSH host approval and mobile device posture part of the same decision. Approve only managed hosts with least-privilege SSH keys, no public app-server exposure, and an offboarding runbook that cuts both ChatGPT session access and SSH reachability.",
      "id": "ctrl_20",
      "vendor": "OpenAI"
    },
    {
      "category": "Codex CLI",
      "question": "Allow or block Codex CLI running in full-auto execute mode on developer machines",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Deploy Codex requirements.toml with allowed_approval_policies = [\"untrusted\", \"on-request\"] and managed_config.toml with approval_policy = \"on-request\".",
      "nist_alignment": "AI RMF Manage 1.3",
      "note": "requirements.toml prevents approval_policy = \"never\" and full-auto local execution.",
      "consultantNote": "Auto-execute mode is where developers feel the full speed of AI-assisted coding — no interruptions, just results. It's also where a single misunderstood instruction can delete files, commit broken code, or expose credentials. Approve read-only auto-execution broadly; gate write operations behind a confirmation step. You preserve 80% of the velocity and eliminate the tail risk.",
      "id": "ctrl_21",
      "vendor": "OpenAI"
    },
    {
      "category": "Codex CLI",
      "question": "Allow or block Codex CLI from auto-loading MCP servers from project-local config files",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Deploy Codex requirements.toml with an approved [mcp_servers] identity list; an empty list disables all Codex MCP servers until IT adds approved command/url identities.",
      "nist_alignment": "CSF Protect PR.PS + AI RMF Map 1.3",
      "note": "Project-local .codex layers are ignored for untrusted projects, but managed MCP requirements are the durable allowlist control.",
      "consultantNote": "Auto-loading MCP configs from cloned repositories is a supply-chain attack vector that most security teams haven't even heard of yet. A malicious repo ships a .codex/config.toml that loads a rogue MCP server — and now your developer's Codex is exfiltrating code on every session. System-level MCP allowlist is the fix; it has zero impact on developers working with approved tools.",
      "id": "ctrl_22",
      "vendor": "OpenAI"
    },
    {
      "category": "Codex CLI",
      "question": "Allow or block Codex CLI access to the network and filesystem outside the defined workspace",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Deploy Codex requirements.toml with allowed sandbox modes, permissions.filesystem.deny_read, and experimental_network domain rules; set sandbox_workspace_write.network_access = false in managed_config.toml.",
      "nist_alignment": "AI RMF Manage 2.2",
      "note": "requirements.toml is the enforcement layer; managed_config.toml is only the launch default.",
      "consultantNote": "Unrestricted filesystem and network access from a CLI AI agent means a compromised session can traverse your entire development environment. The workspace boundary is your primary containment line. Package registries and your internal artifact server belong on the allowlist; everything else should require explicit approval. This is the control that turns a potential breach into a contained incident.",
      "id": "ctrl_23",
      "vendor": "OpenAI"
    },
    {
      "category": "Codex CLI",
      "question": "Allow or block Codex CLI from using plaintext auth caches or unmanaged login methods",
      "operatingSystems": [
        "Windows",
        "macOS",
        "Linux"
      ],
      "if_no": "Set cli_auth_credentials_store = \"keyring\" in managed_config.toml and, where the ChatGPT workspace ID is known, configure forced_login_method / forced_chatgpt_workspace_id through managed configuration.",
      "nist_alignment": "CSF Protect PR.IP",
      "note": "OpenAI documents cli_auth_credentials_store and forced login/workspace settings; AIShield does not emit undocumented prevent_home_redirection keys.",
      "consultantNote": "The durable control here is credential and workspace hygiene, not a fictional CODEX_HOME lockdown key. Prefer the OS credential store over auth.json, force ChatGPT workspace login when your tenant can supply the workspace ID, and use endpoint controls to prevent users from launching Codex with unapproved environment overrides. Treat ~/.codex/auth.json like a password whenever file-based auth is unavoidable.",
      "id": "ctrl_24",
      "vendor": "OpenAI"
    },
    {
      "category": "Shadow AI / Personal AI Subscriptions",
      "question": "Allow or block employees from granting personal AI accounts (ChatGPT, Claude, others) OAuth access to corporate M365",
      "if_no": "Enable Entra Admin Consent workflow for OAuth so users cannot self-grant third-party app access. Audit existing connections by exporting Enterprise Applications or using Microsoft Defender for Cloud Apps to surface third-party AI integrations.",
      "nist_alignment": "AI RMF Govern 1.4 + CSF Protect PR.AC + PR.DS",
      "note": "Closes the BYOAI gap that org-managed Cowork/Codex policies cannot touch.",
      "consultantNote": "Personal AI subscriptions OAuth'd into M365 are the worst of both worlds: corporate data flows into a chat history you can't audit, can't migrate when the employee resigns, can't subject to eDiscovery, and can't enforce MFA on. The data lands on the employee's personal device with no AV/EDR/DLP/retention coverage, and if the subscription is on their personal card you have a live IP-ownership argument waiting to happen. Turning on Entra Admin Consent costs you nothing in productivity — it just routes new OAuth requests through IT so you can sanction the right tool instead of inheriting whichever one the employee picked first. Pair it with a Defender for Cloud Apps review to find the connections that are already live.",
      "id": "ctrl_25",
      "vendor": "*"
    },
    {
      "category": "Shadow AI / Personal AI Subscriptions",
      "question": "Allow or block users from uploading internal documents to public LLMs",
      "if_no": "Configure Microsoft Purview DLP, endpoint DLP, Defender for Cloud Apps session controls, or approved browser/SSE proxy controls to block uploads of internal, confidential, regulated, or sensitivity-labeled documents to unsanctioned public AI services.",
      "nist_alignment": "AI RMF Manage 2.2 + CSF Protect PR.DS + PR.AA",
      "note": "Blocks internal document exfiltration to public LLMs while preserving approved enterprise AI channels.",
      "consultantNote": "This is the CISO-priority shadow-AI control: employees drag internal strategy decks, contracts, source files, financial workbooks, or customer exports into a public AI chat because it is faster than waiting for an approved tool. The productivity need is real, so the answer should not be a vague 'do not paste documents into AI' policy. Use Purview DLP, endpoint DLP, Defender for Cloud Apps, Managed Edge, SSE, or equivalent controls to block internal and sensitivity-labeled documents from unsanctioned public LLM upload paths while explicitly allowing approved enterprise AI workspaces where retention, audit, identity, and contractual protections apply.",
      "id": "ctrl_26",
      "vendor": "*"
    },
    {
      "category": "AI Auditing",
      "question": "Enable IT auditing of Cowork activity (prompts, MCP calls, skills)",
      "preamble": "What it is: Cowork ships with prompt, MCP-call, and skill telemetry OFF by default. This isn't a typical Allow/Block control — it's an opt-in to a deeper audit posture. The default state (left) is OFF, which is what every Cowork tenant has unless someone configures otherwise. The right position activates an OpenTelemetry pipeline (or a Microsoft-native equivalent) that retains the activity record.",
      "if_no": "Enable OpenTelemetry streaming and configure log inclusion for prompts/MCP/skills, OR configure Microsoft Purview inline DLP via Managed Edge Browser, OR enable Entra SSE prompt inspection at the network egress layer.",
      "nist_alignment": "AI RMF Measure 2.1 + CSF Detect DE.AE",
      "note": "Telemetry is off by default; opt-in only.",
      "inverted": true,
      "toggleLabels": {
        "on": "Deploy Auditing",
        "off": "OFF (default)"
      },
      "consultantNote": "The dominant security view: full audit logging with prompt visibility is the most reliable way to reconstruct an AI-assisted decision after the fact. Without it, incident response often turns into guesswork, and the inability to produce evidence may increase regulatory exposure in audited industries. The legal counter-view, more common than many security teams realize: prompt and MCP telemetry is discoverable. Every interaction your employees have with Claude becomes a record that could be subpoenaed in litigation. In industries where logging isn't mandated — manufacturing, retail, hospitality, parts of professional services — some general counsels prefer to minimize AI telemetry specifically to reduce e-discovery surface area. The argument: less retained data, less to be subpoenaed, less to be mischaracterized. Neither view is universally right. The decision depends on your industry's regulatory floor, your incident-response maturity, your appetite for litigation risk, and what your legal counsel says about your specific exposure. A third axis often overlooked in the security-vs-legal debate is operational cost. Standing up an OpenTelemetry collector, securing it on a distributed or hybrid network, and retaining Cowork-scale prompt volume is real engineering work — typically 1–2 weeks of build plus ongoing maintenance. That cost is often what tips smaller orgs toward minimal telemetry even when their security and legal teams both want more. Microsoft-native paths can recover meaningful visibility without bespoke infrastructure: Microsoft Purview inline DLP via the Managed Edge Browser can inspect and apply policy to prompts as they leave the device, and Microsoft Entra SSE (Global Secure Access) can perform prompt inspection at the network egress layer for AI domains. Neither is a perfect replacement for prompt-level audit, but if you're already on a Microsoft E5 or E7 tenant the lift is much smaller than standing up an OTel pipeline from scratch, and the data lands in Purview where it's governed by the same retention and eDiscovery controls as the rest of your M365 estate. Our recommendation: have this conversation explicitly with both your security lead and your general counsel before deciding — Patriot can facilitate. One caveat regardless of which path you choose: this control only covers your org-managed deployment. If employees connect personal ChatGPT or Claude accounts to M365 via OAuth, you have no prompt visibility and no eDiscovery hook on termination. Pair this with Entra Admin Consent for OAuth and a Defender for Cloud Apps review of third-party AI Enterprise Apps to close that shadow-AI gap.",
      "id": "ctrl_27",
      "vendor": "*"
    },
    {
      "category": "AI Auditing",
      "question": "Enable the Anthropic Compliance API and stream activity to your SIEM",
      "preamble": "What it is: The Anthropic Compliance API streams activity feed events, chat content, and file content programmatically to a SIEM or compliance platform. It is OFF by default. Requires the Claude Enterprise plan (not available on Team or individual plans) and is enabled by the Primary Owner in Organization settings > Data and Privacy.",
      "if_no": "Enable the Compliance API in Organization settings > Data and Privacy, generate a compliance access key, and configure your SIEM (Microsoft Sentinel via the OTLP/HTTPS ingest path, or your equivalent platform) to consume the activity feed.",
      "nist_alignment": "AI RMF Measure 2.1 + CSF Detect DE.AE",
      "note": "Enterprise plan only. Anthropic publishes the activity feed; you provide the SIEM and the analytics rules.",
      "inverted": true,
      "toggleLabels": {
        "on": "Enable Compliance API",
        "off": "OFF (default)"
      },
      "consultantNote": "This is the foundation underneath every other audit control on this page. Without the Compliance API enabled, your SIEM has nothing to ingest and the analytics rules in the next two questions are theoretical. Microsoft Sentinel is the natural target if you are already in the Microsoft ecosystem — its OTLP ingest path accepts Anthropic's streaming format, and Sentinel's UEBA + analytics rules give you the alerting layer that Anthropic explicitly does not provide. If you are on Splunk, Elastic Security, or Chronicle, the same OTLP/HTTPS endpoint works. Be aware that the Compliance API streams chat content — that data lands in your SIEM under your retention and access policies, which is the right outcome but may require coordination with your data governance team before you turn it on. Enterprise plan is a hard requirement; if you are on the Team plan, you cannot enable this and your audit posture is limited to the basic Cowork telemetry above.",
      "id": "ctrl_28",
      "vendor": "*"
    },
    {
      "category": "AI Auditing",
      "question": "Configure a finite chat history retention TTL",
      "preamble": "What it is: By default Anthropic retains conversation and project data indefinitely. Enterprise admins can set a custom Time-to-Live (minimum 30 days) in Organization settings > Data and Privacy. When the TTL elapses, data is permanently deleted at midnight UTC on the scheduled day. Requires the Claude Enterprise plan. Changing the TTL applies retroactively — existing data beyond the new window is deleted on save.",
      "if_no": "Navigate to Organization settings > Data and Privacy and set a custom retention period (minimum 30 days). Coordinate with your legal team on the appropriate window before saving — deletion is irreversible and applies to existing data beyond the new window.",
      "nist_alignment": "CSF Protect PR.DS + CSF Protect PR.IP",
      "note": "Enterprise plan only. Minimum 30 days. Retention changes are logged in audit logs. Deletion at midnight UTC on scheduled day.",
      "inverted": true,
      "toggleLabels": {
        "on": "Configure TTL",
        "off": "OFF (default — indefinite)"
      },
      "consultantNote": "Indefinite retention is the worst kind of default — nobody actively chose it, but every Enterprise tenant inherits it. The legal argument for setting a TTL is the strongest: every retained Claude conversation is a discoverable record that may be subpoenaed in litigation, and the longer the tail, the larger the e-discovery surface. The security counter-argument is real: you may want to keep prompts long enough to reconstruct an incident months later. Most orgs land between 90 days and 1 year depending on regulatory floor. For the non-Anthropic AI on the same workforce (Microsoft 365 Copilot, in particular), the parallel control is Microsoft Purview retention policies, which apply across your M365 estate — pair the two if you are running multi-vendor AI to keep your retention posture consistent across tools. One operational note: the TTL change is retroactive, so the first time you save a new policy you will see a one-time mass deletion of all data older than the window. Have legal and ops sign off before that first save.",
      "id": "ctrl_29",
      "vendor": "*"
    },
    {
      "category": "AI Auditing",
      "question": "Configure anomaly and unusual-prompt detection on the SIEM-ingested audit feed",
      "preamble": "What it is: Anthropic does not offer customer-facing anomaly detection on prompts — they explicitly position this as the SIEM's responsibility. With the Compliance API streaming to your SIEM, you build the alerting layer on top. Common Microsoft-stack tools that fit: Microsoft Sentinel (UEBA + analytics rules), Microsoft Defender for Cloud Apps (anomaly detection policies for SaaS AI applications), and Microsoft Purview Insider Risk Management (behavior-driven alerts that correlate AI usage with broader insider-threat signals).",
      "if_no": "With the Compliance API enabled, build alerting in one or more of: (a) Microsoft Sentinel UEBA — baselines user activity and surfaces deviations on AI workloads; (b) Microsoft Defender for Cloud Apps anomaly policies — application-layer detection for SaaS AI tools you have enrolled; (c) Microsoft Purview Insider Risk Management — correlates AI usage with broader behavioral signals such as off-hours data access.",
      "nist_alignment": "CSF Detect DE.AE + AI RMF Measure 2.1",
      "note": "Requires upstream Compliance API enablement. Sentinel UEBA is the closest fit for prompt-level anomalies.",
      "inverted": true,
      "toggleLabels": {
        "on": "Enable Detection",
        "off": "OFF (default)"
      },
      "consultantNote": "Anthropic is explicit that anomaly detection on prompts is your SIEM's job — so the real question is which SIEM, and have you actually written the analytics rules? Microsoft Sentinel UEBA baselines user activity against AI workloads and surfaces statistical outliers, which works once the Compliance API stream is landing in a Sentinel workspace. Defender for Cloud Apps catches anomaly patterns at the application layer for SaaS AI you have enrolled and is the better fit for shadow-AI detection. Purview Insider Risk Management correlates AI activity with broader insider-threat signals like off-hours access, mass downloads, or behavior changes after a performance review — that is the closest thing to a unified view, but requires Purview licensing and tuning. Most mature programs use a combination: Sentinel for prompt-level, Defender for Cloud Apps for application-level, Purview IRM for behavior-level. If you have not stood up at least one of these, the audit logs sit in storage and no one looks at them until a problem has already happened — the audit-without-alerting trap.",
      "id": "ctrl_30",
      "vendor": "*"
    }
  ],
  "msControls": [
    {
      "id": "scout",
      "title": "Microsoft Scout — govern the always-on personal agent",
      "description": "Microsoft's new always-on AI agent (announced June 2026) autonomously coordinates scheduling, calendar, and follow-ups across Teams, Outlook, OneDrive, and SharePoint using Work IQ. Governance controls — Entra identity scoping, Intune policy enforcement, data-protection policy adherence, and human-approval gates for sensitive actions — as it moves from private preview toward general availability."
    },
    {
      "id": "purview_ai",
      "title": "Microsoft Purview controls for AI",
      "description": "Sensitivity labels applied to AI-generated content, DLP policies for prompts leaving the device, and audit retention aligned with the rest of your M365 estate."
    },
    {
      "id": "agent_controls",
      "title": "Microsoft 365 Agent Controls",
      "description": "Granular permissions and scope-of-action gates for Copilot Agents and other Microsoft-managed AI agents operating across your tenant."
    },
    {
      "id": "entra_sse",
      "title": "Microsoft Entra SSE — malicious prompt injection protection",
      "description": "Global Secure Access providing malicious prompt injection protection at the network egress layer for AI domains (E7 included; E3/E5 require Entra Internet Access or Entra Suite add-on confirmation). Detects and blocks weaponized prompts before they reach the AI service."
    },
    {
      "id": "intune_app_control",
      "title": "App Control — block Claude Desktop installation",
      "description": "Intune-managed App Control / WDAC policies that prevent the Claude desktop app from being installed on managed endpoints outside of approved roles."
    },
    {
      "id": "edge_extensions",
      "title": "Microsoft Managed Edge — block browser extensions",
      "description": "Edge ExtensionInstallBlocklist policies that prevent installation of unsanctioned browser extensions, including AI extensions you have not approved."
    },
    {
      "id": "agent365",
      "title": "Agent365 — block Shadow AI agents",
      "description": "Policy-level controls to prevent unsanctioned third-party AI agents from connecting to your tenant via Agent365 protocols."
    },
    {
      "id": "defender_cloud_apps",
      "title": "Defender for Cloud Apps — discover & block Shadow AI",
      "description": "Use MDA Cloud Discovery to surface unsanctioned AI usage across the org and apply session/access policies to block or limit it."
    }
  ],
  "nist": {
    "AI RMF Govern 1.1": {
      "framework": "AI RMF",
      "label": "GOVERN 1.1",
      "summary": "Legal and regulatory requirements involving AI are understood, managed, and documented. Organizations must know which laws apply (privacy, sectoral, anti-discrimination, IP) before they deploy."
    },
    "AI RMF Govern 1.2": {
      "framework": "AI RMF",
      "label": "GOVERN 1.2",
      "summary": "The characteristics of trustworthy AI — valid, reliable, safe, secure, accountable, transparent, explainable, privacy-enhanced, fair — are integrated into organizational policies, processes, procedures, and practices."
    },
    "AI RMF Govern 1.4": {
      "framework": "AI RMF",
      "label": "GOVERN 1.4",
      "summary": "The risk management process and its outcomes are established through transparent policies, procedures, and other controls based on organizational risk priorities — including controls over how AI systems and data may be accessed or extended by third parties."
    },
    "AI RMF Govern 2.1": {
      "framework": "AI RMF",
      "label": "GOVERN 2.1",
      "summary": "Roles and responsibilities and lines of communication related to mapping, measuring, and managing AI risks are documented and are clear to individuals and teams throughout the organization."
    },
    "AI RMF Map 1.1": {
      "framework": "AI RMF",
      "label": "MAP 1.1",
      "summary": "Intended purposes, potentially beneficial uses, context-specific laws, norms and expectations, and the prospective settings in which the AI system will be deployed are understood and documented."
    },
    "AI RMF Map 1.3": {
      "framework": "AI RMF",
      "label": "MAP 1.3",
      "summary": "The organization's mission and relevant goals for AI technology are understood and documented, so AI capability decisions are anchored to business objectives rather than tool enthusiasm."
    },
    "AI RMF Map 1.5": {
      "framework": "AI RMF",
      "label": "MAP 1.5",
      "summary": "Organizational risk tolerances are determined and documented. Teams need an explicit appetite statement so that 'how much risk is acceptable' is a leadership decision, not a developer judgment call."
    },
    "AI RMF Map 2.1": {
      "framework": "AI RMF",
      "label": "MAP 2.1",
      "summary": "The specific tasks and methods used to implement the tasks that the AI system will support are defined — including dependencies on third-party components, plugins, and extensions."
    },
    "AI RMF Map 2.2": {
      "framework": "AI RMF",
      "label": "MAP 2.2",
      "summary": "Information about the AI system's knowledge limits and how system output may be utilized and overseen by humans is documented. Sufficient information must be provided so relevant AI actors can make informed decisions and take subsequent action."
    },
    "AI RMF Measure 1.2": {
      "framework": "AI RMF",
      "label": "MEASURE 1.2",
      "summary": "Appropriateness of AI metrics and effectiveness of existing controls is regularly assessed and updated, including reports of errors and potential impacts on affected communities."
    },
    "AI RMF Measure 2.1": {
      "framework": "AI RMF",
      "label": "MEASURE 2.1",
      "summary": "Test sets, metrics, and details about the tools used during Test, Evaluation, Verification, and Validation (TEVV) are documented — including the prompts, transcripts, and telemetry needed to reconstruct AI-assisted decisions after the fact."
    },
    "AI RMF Manage 1.3": {
      "framework": "AI RMF",
      "label": "MANAGE 1.3",
      "summary": "Responses to the AI risks deemed high priority — identified by the MAP function — are developed, planned, and documented. Risk response options include mitigating, transferring, avoiding, or accepting; the choice is recorded."
    },
    "AI RMF Manage 2.2": {
      "framework": "AI RMF",
      "label": "MANAGE 2.2",
      "summary": "Mechanisms are in place and applied to sustain the value of deployed AI systems — including ongoing controls that scope what tools, networks, and data the AI can reach as conditions change."
    },
    "AI RMF Manage 2.3": {
      "framework": "AI RMF",
      "label": "MANAGE 2.3",
      "summary": "Procedures are followed to respond to and recover from a previously unknown risk when it is identified — particularly relevant for autonomous AI actions where novel failure modes emerge in production."
    },
    "CSF Protect PR.AC": {
      "framework": "CSF",
      "label": "Protect — PR.AC (Identity Management & Access Control)",
      "summary": "Access to physical and logical assets and associated facilities is limited to authorized users, processes, and devices, and is managed consistent with the assessed risk of unauthorized access. (CSF 2.0 evolves this into PR.AA.)"
    },
    "CSF Protect PR.DS": {
      "framework": "CSF",
      "label": "Protect — PR.DS (Data Security)",
      "summary": "Information and records (data) are managed consistent with the organization's risk strategy to protect the confidentiality, integrity, and availability of information — at rest, in transit, and in use."
    },
    "CSF Protect PR.PS": {
      "framework": "CSF",
      "label": "Protect — PR.PS (Platform Security)",
      "summary": "The hardware, software (e.g., firmware, operating systems, applications), and services of physical and virtual platforms are managed consistent with the organization's risk strategy — covering software allowlisting, configuration baselines, and patching."
    },
    "CSF Detect DE.AE": {
      "framework": "CSF",
      "label": "Detect — DE.AE (Adverse Event Analysis)",
      "summary": "Anomalies, indicators of compromise, and other potentially adverse events are analyzed to characterize the events and detect cybersecurity incidents — requires telemetry sufficient to reconstruct what happened."
    },
    "CSF Protect PR.IP": {
      "framework": "CSF",
      "label": "Protect — PR.IP (Information Protection Processes & Procedures)",
      "summary": "Security policies (that address purpose, scope, roles, responsibilities, management commitment, and coordination among organizational entities), processes, and procedures are maintained and used to manage protection of information systems and assets."
    }
  },
  "categoryVendor": {
    "Claude Desktop/Cowork": "Anthropic",
    "Claude CLI": "Anthropic",
    "Claude Code in Web Browser": "Anthropic",
    "Claude in Chrome": "Anthropic",
    "Codex Desktop": "OpenAI",
    "Codex CLI": "OpenAI",
    "Shadow AI / Personal AI Subscriptions": "*",
    "AI Auditing": "*"
  },
  "categoryDesc": {
    "Claude Desktop/Cowork": "Web and desktop collaboration interface",
    "Claude CLI": "Claude Code terminal interface",
    "Claude Code in Web Browser": "Cloud-hosted coding sandboxes",
    "Claude in Chrome": "Browser extension for page interaction",
    "Codex Desktop": "Computer-use desktop agent",
    "Codex CLI": "Command-line coding agent",
    "Shadow AI / Personal AI Subscriptions": "Personal subscriptions and unsanctioned OAuth access",
    "AI Auditing": "Audit, retention, and detection posture"
  }
};
