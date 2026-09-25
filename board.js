(() => {
const B = window.BOARD;
if (!B || !document.getElementById("bd")) return;
const TODAY = B.today, TASKS = B.tasks;
document.getElementById("bd").insertAdjacentHTML("beforebegin", "<style>" + "#bd{padding:.5rem 0;font-size:14px}.st{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:12px}.st div{background:var(--surface-1);border-radius:var(--radius);padding:.75rem 1rem;min-width:0}.st small{display:block;font-size:13px;color:var(--text-secondary)}.st b{font-size:24px;font-weight:500}.st em{display:block;font-size:12px;font-style:normal;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fl{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}.fl button{font-size:13px;padding:4px 12px;height:auto}.fl button[aria-pressed=true]{background:var(--bg-accent);color:var(--text-accent);border-color:var(--border-accent)}.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;align-items:start}.col{background:var(--surface-1);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px;min-height:120px}.col.over{outline:1.5px dashed var(--border-accent);outline-offset:-2px}.ch{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:var(--text-secondary);padding:2px 4px 0}.ch span{margin-left:auto;font-weight:400;color:var(--text-muted)}.cd{background:var(--surface-2);border:0.5px solid var(--border);border-radius:var(--radius);padding:10px 12px;cursor:grab}.cd:hover{border-color:var(--border-strong)}.cd.op{border-color:var(--border-accent);cursor:default}.cd.mv{border-style:dashed;border-color:var(--border-accent)}.tp{display:flex;gap:8px;align-items:baseline}.nn{font-size:12px;color:var(--text-muted);min-width:18px}.tt{line-height:1.4;color:var(--text-primary)}.mt{display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center;margin-top:8px;font-size:12px;color:var(--text-secondary)}.pl{font-size:11px;padding:1px 8px;border-radius:var(--radius);display:inline-flex;gap:3px;align-items:center}.p-high{background:var(--bg-danger);color:var(--text-danger)}.p-medium{background:var(--bg-warning);color:var(--text-warning)}.p-low{background:var(--surface-1);color:var(--text-secondary)}.nw{background:var(--bg-success);color:var(--text-success)}.old{color:var(--text-warning)}.late{color:var(--text-danger)}.bar{height:4px;background:var(--surface-1);border-radius:2px;margin-top:8px;overflow:hidden}.bar div{height:100%;background:var(--text-success)}.nt{margin-top:6px;font-size:12px;color:var(--text-secondary);display:flex;gap:4px;align-items:baseline}.dt{margin-top:10px;padding-top:10px;border-top:0.5px solid var(--border);font-size:13px;line-height:1.5;cursor:auto}.dt p{margin:0 0 8px}.lb{font-size:12px;color:var(--text-muted)}.ac{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}.ac button{font-size:12px;padding:3px 10px;height:auto}.pd{margin-top:12px;background:var(--surface-1);border-radius:12px;padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:13px}.pd .sp{flex:1}" + "</style>");
const COLS = [["todo","To do","ti-circle-dashed"],["progress","In progress","ti-progress"],["blocked","Blocked","ti-lock"]];
const STATUS = {todo:"to do", progress:"in-progress", blocked:"blocked"};
const PI = {high:"ti-flame", medium:"ti-arrow-up-right", low:"ti-arrow-down-right"};
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const ago = s => Math.round((Date.parse(TODAY) - Date.parse(s)) / 864e5);
const mins = s => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(s || ""); return m ? (+m[1] || 0) * 60 + (+m[2] || 0) : 0; };
const hm = m => !m ? "" : m < 60 ? m + "m" : Math.floor(m / 60) + "h" + (m % 60 ? m % 60 + "m" : "");
const late = t => t.planned && ago(t.planned) > 0;
const FILTERS = [["all","All",() => true],["high","High priority",t => t.priority === "high"],["late","Past planned date",late],["new","New today",t => ago(t.created) === 0]];
TASKS.forEach(t => t.home = t.col);
let open = null, filter = "all", sent = false;
const bd = document.getElementById("bd");

function card(t) {
  const age = ago(t.created), done = t.done || 0, total = t.total || 0, isOpen = open === t.n;
  const when = !t.planned ? "unplanned" : ago(t.planned) === 0 ? "today" : t.planned.slice(8) + "-" + t.planned.slice(5, 7);
  let h = `<div class="cd${isOpen ? " op" : ""}${t.col !== t.home ? " mv" : ""}" draggable="true" tabindex="0" role="button" aria-expanded="${isOpen}" data-n="${t.n}">` +
    `<div class="tp"><span class="nn">${t.n}</span><span class="tt">${esc(t.title)}</span></div>` +
    `<div class="mt"><span class="pl p-${t.priority}"><i class="ti ${PI[t.priority]}" aria-hidden="true"></i>${t.priority}</span>` +
    `<span class="${late(t) ? "late" : ""}"><i class="ti ti-calendar" aria-hidden="true"></i> ${when}</span>` +
    (t.est ? `<span><i class="ti ti-clock" aria-hidden="true"></i> ${hm(mins(t.est))}</span>` : "") +
    (age === 0 ? `<span class="pl nw">new</span>` : `<span class="${age > 14 ? "old" : ""}"><i class="ti ti-hourglass" aria-hidden="true"></i> ${age}d</span>`) + `</div>` +
    (total ? `<div class="bar" title="${done} of ${total} steps done"><div style="width:${Math.round(done / total * 100)}%"></div></div>` : "") +
    (t.blocked ? `<div class="nt"><i class="ti ti-lock" aria-hidden="true"></i>Waiting on ${esc(t.blocked)}</div>` : "") +
    (t.check ? `<div class="nt"><i class="ti ti-eye" aria-hidden="true"></i>Waiting for your check</div>` : "") +
    (t.depends ? `<div class="nt"><i class="ti ti-link" aria-hidden="true"></i>After ${esc(t.depends)}</div>` : "");
  if (isOpen) {
    h += `<div class="dt">` + (t.objective ? `<p>${esc(t.objective)}</p>` : "") +
      (t.next ? `<p class="lb">Next step${total ? ` (${done} of ${total} done)` : ""}</p><p><i class="ti ti-arrow-right" aria-hidden="true"></i> ${esc(t.next)}</p>` : "") +
      `<p class="lb">Move to</p><div class="ac">${COLS.filter(c => c[0] !== t.col).map(c => `<button data-act="move" data-n="${t.n}" data-to="${c[0]}"><i class="ti ${c[2]}" aria-hidden="true"></i> ${c[1]}</button>`).join("")}</div>` +
      `<div class="ac"><button data-act="ask" data-p="Show task ${t.n}: ${esc(t.title)}">Full ticket ↗</button>` +
      (t.col !== "blocked" ? `<button data-act="ask" data-p="Dispatch ${t.n} (${esc(t.title)})">Dispatch ↗</button>` : "") +
      `<button data-act="ask" data-p="Land ${t.n} (${esc(t.title)})">Land ↗</button></div></div>`;
  }
  return h + `</div>`;
}

function render() {
  const f = FILTERS.find(x => x[0] === filter)[2];
  const oldest = TASKS.reduce((a, t) => !a || ago(t.created) > ago(a.created) ? t : a, null);
  const moves = TASKS.filter(t => t.col !== t.home);
  bd.innerHTML =
    `<div class="st"><div><small>Open</small><b>${TASKS.length}</b></div>` +
    `<div><small>High priority</small><b>${TASKS.filter(t => t.priority === "high").length}</b></div>` +
    `<div><small>Past planned date</small><b>${TASKS.filter(late).length}</b></div>` +
    `<div><small>Oldest open</small><b>${oldest ? ago(oldest.created) + "d" : "-"}</b><em>${oldest ? esc(oldest.title) : ""}</em></div></div>` +
    `<div class="fl">${FILTERS.map(x => `<button data-act="filter" data-f="${x[0]}" aria-pressed="${filter === x[0]}">${x[1]}</button>`).join("")}</div>` +
    `<div class="cols">${COLS.map(([k, l, ic]) => {
      const it = TASKS.filter(t => t.col === k), vis = it.filter(f);
      return `<div class="col" data-col="${k}"><div class="ch"><i class="ti ${ic}" style="font-size:16px" aria-hidden="true"></i>${l}<span>${it.length}${it.length ? " · " + hm(it.reduce((a, t) => a + mins(t.est), 0)) : ""}</span></div>` +
        (vis.map(card).join("") || `<div class="nt" style="padding:8px 4px">${it.length ? "Filtered out" : "Nothing here. Enjoy it."}</div>`) + `</div>`;
    }).join("")}</div>` +
    (moves.length ? `<div class="pd"><i class="ti ti-arrows-exchange" aria-hidden="true"></i><span class="sp">${moves.map(t => `${t.n} to ${STATUS[t.col]}`).join(", ")}</span><button data-act="undo">Undo</button><button data-act="apply">Apply ${moves.length} move${moves.length > 1 ? "s" : ""} ↗</button></div>`
      : sent ? `<div class="pd"><i class="ti ti-check" aria-hidden="true"></i>Sent to chat</div>` : "");
}

bd.addEventListener("click", e => {
  const a = e.target.closest("[data-act]");
  if (a) {
    const k = a.dataset.act;
    if (k === "ask") return sendPrompt(a.dataset.p);
    if (k === "filter") filter = a.dataset.f;
    if (k === "move") { TASKS.find(t => t.n == a.dataset.n).col = a.dataset.to; sent = false; }
    if (k === "undo") TASKS.forEach(t => t.col = t.home);
    if (k === "apply") {
      const m = TASKS.filter(t => t.col !== t.home);
      sendPrompt("Apply board moves: " + m.map(t => `${t.n} (${t.title}) to ${STATUS[t.col]}`).join("; "));
      m.forEach(t => t.home = t.col); sent = true;
    }
    return render();
  }
  const c = e.target.closest(".cd");
  if (c && !e.target.closest(".dt")) { const n = +c.dataset.n; open = open === n ? null : n; render(); }
});
bd.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("cd")) { e.preventDefault(); e.target.click(); } });
bd.addEventListener("dragstart", e => { const c = e.target.closest(".cd"); if (c) { e.dataTransfer.setData("text/plain", c.dataset.n); e.dataTransfer.effectAllowed = "move"; } });
bd.addEventListener("dragover", e => { const l = e.target.closest(".col"); if (l) { e.preventDefault(); bd.querySelectorAll(".col.over").forEach(x => x !== l && x.classList.remove("over")); l.classList.add("over"); } });
bd.addEventListener("dragleave", e => { const l = e.target.closest(".col"); if (l && !l.contains(e.relatedTarget)) l.classList.remove("over"); });
bd.addEventListener("drop", e => {
  const l = e.target.closest(".col"); if (!l) return;
  e.preventDefault();
  const t = TASKS.find(x => x.n == e.dataTransfer.getData("text/plain"));
  if (t) { t.col = l.dataset.col; sent = false; }
  render();
});
render();
})();
