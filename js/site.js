/* Always open a page at the top (unless the link points to a #section).
   Browsers otherwise restore an old scroll position, which lands mid-page. */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
(() => {
  if (location.hash) return;
  const top = () => { const h = document.documentElement, b = h.style.scrollBehavior;
    h.style.scrollBehavior = "auto"; window.scrollTo(0, 0); h.style.scrollBehavior = b; };
  top();
  addEventListener("DOMContentLoaded", top);
  addEventListener("load", top);
  addEventListener("pageshow", e => { if (e.persisted) top(); });
})();
/* Shared effects for every page: scan-in reveals, number count-up, cursor grid spotlight,
   scroll progress bar, active nav link, timeline/roadmap fill, headline decode.
   Load this at the END of <body>, after any script that renders content. */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- number count-up ---------- */
  function countUp(el){
    const raw = el.dataset.count, m = raw.match(/^([^\d\-−]*)([\-−]?)(\d+(?:\.\d+)?)(.*)$/);
    if (!m || reduce) return;
    const [ , pre, sign, num, post] = m, end = parseFloat(num), t0 = performance.now(), dur = 1100;
    (function tick(now){ const k = Math.min(1,(now-t0)/dur), e = 1-Math.pow(1-k,3);
      el.textContent = pre + sign + (end*e).toFixed(num.includes(".")?1:0) + post;
      if (k < 1) requestAnimationFrame(tick); })(t0);
  }

  /* ---------- scan-in reveals (clip-path hides elements from IntersectionObserver, so check on scroll) ---------- */
  let pending = [...document.querySelectorAll(".reveal")];
  function checkReveals(){
    pending = pending.filter(el => {
      if (el.getBoundingClientRect().top < innerHeight*0.88){
        el.style.setProperty("--sh", el.offsetHeight+"px"); el.classList.add("in"); el.querySelectorAll("[data-count]").forEach(countUp); return false; }
      return true; });
  }

  /* ---------- cursor spotlight on the grid ---------- */
  const glow = document.querySelector(".grid-glow");
  let px = 0, py = 0, pend = false;
  if (!reduce && glow) addEventListener("pointermove", e => {
    px = e.clientX; py = e.clientY;
    if (!pend){ pend = true; requestAnimationFrame(() => { pend = false;
      glow.style.setProperty("--mx", px+"px"); glow.style.setProperty("--my", py+"px"); }); }
  }, {passive:true});

  /* ---------- scroll progress, active nav, timeline + roadmap fills ---------- */
  const prog = document.getElementById("progress");
  const lines = [...document.querySelectorAll("[data-fill]")].map(el => ({
    el, fill: el.querySelector(".fill"), items: [...el.querySelectorAll(el.dataset.fill)] }));
  const navLinks = [...document.querySelectorAll("nav a[href^='#']")];
  const stageLinks = [...document.querySelectorAll("[data-stage-link]")];

  function onScroll(){
    checkReveals();
    const max = document.documentElement.scrollHeight - innerHeight;
    if (prog) prog.style.setProperty("--p", max>0 ? scrollY/max : 0);
    const mark = innerHeight*0.55;
    for (const L of lines){
      const r = L.el.getBoundingClientRect();
      if (L.fill) L.fill.style.setProperty("--h", Math.max(0, Math.min(r.height-6, mark - r.top))+"px");
      L.items.forEach(li => li.classList.toggle("lit", li.getBoundingClientRect().top + 10 < mark));
    }
    let cur = null;
    for (const a of navLinks){ const s = document.getElementById(a.getAttribute("href").slice(1));
      if (s && s.getBoundingClientRect().top < innerHeight*0.4) cur = a; }
    navLinks.forEach(a => a.classList.toggle("on", a === cur));
    let curStage = null;
    for (const a of stageLinks){ const s = document.getElementById(a.dataset.stageLink);
      if (s && s.getBoundingClientRect().top < innerHeight*0.45) curStage = a; }
    stageLinks.forEach(a => a.classList.toggle("on", a === curStage));
  }
  let sPend = false; addEventListener("scroll", () => { if (!sPend){ sPend = true; requestAnimationFrame(() => { sPend = false; onScroll(); }); } }, {passive:true}); addEventListener("resize", onScroll); onScroll();

  /* ---------- headline decode effect ---------- */
  const el = document.getElementById("scramble");
  if (el && !reduce){
    const final = el.textContent, glyphs = "01<>/\\[]{}#*+=θ", t0 = performance.now(), dur = 1400;
    (function tick(now){
      const k = Math.min(1,(now-t0)/dur), n = Math.floor(final.length*k);
      el.textContent = final.slice(0,n) + [...final.slice(n)].map(c => c===" " ? " " : glyphs[Math.random()*glyphs.length|0]).join("");
      if (k < 1) requestAnimationFrame(tick); else el.textContent = final;
    })(t0);
  }

  /* ---------- videos: only play while on screen (saves battery/CPU), respect reduced motion ---------- */
  const vids = [...document.querySelectorAll("video[data-autoplay]")];
  vids.forEach(v => { v.removeAttribute("autoplay"); v.preload = "none"; });
  if (reduce) vids.forEach(v => { v.removeAttribute("autoplay"); v.controls = true; });
  else if ("IntersectionObserver" in window){
    const vo = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) e.target.play().catch(()=>{}); else e.target.pause(); }), {threshold:.25, rootMargin:"200px 0px"});
    vids.forEach(v => vo.observe(v));
  }
  /* ---------- grid background drifts slower than the page (parallax) ---------- */
  if (!reduce){
    const layers = [...document.querySelectorAll(".grid-bg,.grid-glow")];
    let yPend = false;
    const setSy = () => { yPend = false; const y = (-(scrollY*0.35) % 44).toFixed(1);
      layers.forEach(l => l.style.backgroundPosition = `0 ${y}px`); };
    addEventListener("scroll", () => { if (!yPend){ yPend = true; requestAnimationFrame(setSy); } }, {passive:true}); setSy();
  }

  /* ---------- rotating role line: decodes into each phrase in turn ---------- */
  const rot = document.getElementById("roles");
  if (rot && !reduce){
    const roles = rot.dataset.roles.split("|"), glyphs = "01<>/\\[]{}#*+=θ";
    let i = 0;
    const decode = to => { const t0 = performance.now(), dur = 700;
      (function tick(now){ const k = Math.min(1,(now-t0)/dur), n = Math.floor(to.length*k);
        rot.textContent = to.slice(0,n) + [...to.slice(n)].map(c => c===" " ? " " : glyphs[Math.random()*glyphs.length|0]).join("");
        if (k < 1) requestAnimationFrame(tick); else rot.textContent = to; })(t0); };
    decode(roles[0]);
    setInterval(() => { if (document.hidden) return; i = (i+1) % roles.length; decode(roles[i]); }, 2800);
  }
  /* ---------- media rows: columns proportional to aspect ratio = equal heights, no cropping ---------- */
  document.querySelectorAll(".fit-row,.media-row").forEach(row => {
    const kids = [...row.children].filter(k => k.dataset.ar);
    const ars = kids.map(k => { const [w,h] = k.dataset.ar.split("/").map(Number); k.style.setProperty("--ar", w/h); return w/h; });
    if (!ars.length) return;
    if (ars.length === 1){ const maxh = +(row.dataset.maxh || 480); row.style.gridTemplateColumns = `minmax(0, ${Math.round(ars[0]*maxh)}px)`; }
    else row.style.gridTemplateColumns = ars.map(a => `minmax(0, ${a.toFixed(3)}fr)`).join(" ");
  });
})();
