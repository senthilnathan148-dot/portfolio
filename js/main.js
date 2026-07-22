/* ═══════════════════════════════════════════════════════════
   SENTHIL NATHAN A — PORTFOLIO
   Vanilla ES6 · no frameworks
   ═══════════════════════════════════════════════════════════ */
'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const lerp = (a, b, t) => a + (b - a) * t;

/* ═══ 1 · CANVAS PARTICLE FIELD ═══ */
const initParticles = () => {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles;
  const mouse = { x: -9999, y: -9999 };

  const resize = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    const count = Math.min(110, Math.floor((w * h) / 16000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.4,
      hue: Math.random() > 0.5 ? '8,145,178' : '37,99,235',
      a: Math.random() * 0.5 + 0.15,
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      // gentle push away from cursor
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 120) {
        p.x += (dx / dist) * 0.6;
        p.y += (dy / dist) * 0.6;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},${p.a})`;
      ctx.fill();
    }
    // connective lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 110) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(8,145,178,${0.08 * (1 - d / 110)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  };

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  resize();
  draw();
};

/* ═══ 2 · CUSTOM CURSOR + MOUSE GLOW ═══ */
const initCursor = () => {
  if (!isFinePointer) return;
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const glow = document.getElementById('mouseGlow');
  if (!dot || !ring || !glow) return;
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my, gx = mx, gy = my;

  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const loop = () => {
    rx = lerp(rx, mx, 0.18);
    ry = lerp(ry, my, 0.18);
    gx = lerp(gx, mx, 0.06);
    gy = lerp(gy, my, 0.06);
    dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
    ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
    glow.style.left = `${gx}px`; glow.style.top = `${gy}px`;
    requestAnimationFrame(loop);
  };
  loop();

  const hoverables = 'a, button, .flip-card, .tag, .tilt';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverables)) ring.classList.add('is-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverables)) ring.classList.remove('is-hover');
  });
};

/* ═══ 3 · MAGNETIC ELEMENTS ═══ */
const initMagnetic = () => {
  if (!isFinePointer || reduceMotion) return;
  document.querySelectorAll('.magnetic').forEach(el => {
    const strength = 0.35;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = '';
      setTimeout(() => (el.style.transition = ''), 500);
    });
  });
};

/* ═══ 4 · NAV — scroll state, progress bar, active link, hamburger ═══ */
const initNav = () => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const progress = document.getElementById('scrollProgress');
  const links = [...document.querySelectorAll('.nav-link')];
  // only same-page links (#section) can be scroll-spied.
  // On reviews.html / gallery.html the links are "index.html#about",
  // which is NOT a valid CSS selector — so filter those out first.
  const spy = links
    .map(l => ({ link: l, href: l.getAttribute('href') || '' }))
    .filter(x => x.href.startsWith('#') && x.href.length > 1)
    .map(x => ({ ...x, section: document.getElementById(x.href.slice(1)) }))
    .filter(x => x.section);

  const onScroll = () => {
    nav.classList.toggle('scrolled', scrollY > 40);
    if (progress) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = max > 0 ? `${(scrollY / max) * 100}%` : '0%';
    }

    if (!spy.length) return;          // sub-pages: nothing to highlight
    let current = spy[0];
    for (const s of spy) {
      if (s.section.getBoundingClientRect().top <= innerHeight * 0.35) current = s;
    }
    spy.forEach(s => s.link.classList.toggle('active', s === current));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // hamburger
  const burger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const toggle = open => {
    burger.classList.toggle('open', open);
    navLinks.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
    // stagger link entrance
    navLinks.querySelectorAll('.nav-link').forEach((l, i) => {
      l.style.transitionDelay = open ? `${0.05 + i * 0.04}s` : '0s';
    });
  };
  burger.addEventListener('click', () => toggle(!burger.classList.contains('open')));
  navLinks.addEventListener('click', e => { if (e.target.closest('a')) toggle(false); });
};

/* ═══ 5 · TYPING EFFECT ═══ */
const initTyping = () => {
  const roles = ['SolidWorks & CATIA V5', 'AutoCAD & Creo', 'Automotive BIW Design', 'AWS Cloud & IoT', 'Fusion 360 & Inventor'];
  const el = document.getElementById('typed');
  if (!el) return;
  if (reduceMotion) { el.textContent = roles[0]; return; }
  let ri = 0, ci = 0, deleting = false;
  const tick = () => {
    const word = roles[ri];
    el.textContent = word.slice(0, ci);
    if (!deleting && ci < word.length) { ci++; setTimeout(tick, 62); }
    else if (!deleting) { deleting = true; setTimeout(tick, 1700); }
    else if (ci > 0) { ci--; setTimeout(tick, 30); }
    else { deleting = false; ri = (ri + 1) % roles.length; setTimeout(tick, 350); }
  };
  tick();
};

/* ═══ 6 · COUNTER ANIMATION ═══ */
const initCounters = () => {
  const counters = document.querySelectorAll('[data-count]');
  const animate = el => {
    const target = +el.dataset.count;
    const dur = 1600;
    const t0 = performance.now();
    const step = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    reduceMotion ? (el.textContent = target.toLocaleString()) : requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.6 });
  counters.forEach(c => io.observe(c));
};

/* ═══ 7 · DATA — skills, certificates, projects, testimonials ═══ */
const SKILLS = [
  { name: 'SolidWorks', cat: 'CAD', pct: 92, level: 'Expert Level', logo: 'https://img.icons8.com/?size=100&id=62397&format=png&color=000000' },
  { name: 'AutoCAD', cat: 'CAD', pct: 90, level: 'Expert Level', logo: 'assets/skill-autodesk.svg', local: true },
  { name: 'CATIA V5', cat: 'CAD / BIW', pct: 88, level: 'Advanced', logo: 'https://img.icons8.com/?size=100&id=6LuKZMwS6lAo&format=png&color=000000' },
  { name: 'Excel Expert', cat: 'Productivity', pct: 82, level: 'Advanced', logo: 'https://img.icons8.com/?size=100&id=117561&format=png&color=000000' },
  { name: 'Fusion 360', cat: 'CAD', pct: 78, level: 'Proficient', logo: 'assets/skill-autodesk.svg', local: true },
  { name: 'Creo', cat: 'CAD', pct: 75, level: 'Proficient', logo: 'https://img.icons8.com/?size=100&id=nHO01oOdNoK4&format=png&color=000000' },
  { name: 'Inventor', cat: 'CAD', pct: 72, level: 'Proficient', logo: 'assets/skill-autodesk.svg', local: true },
  { name: 'Photoshop', cat: 'Design', pct: 70, level: 'Proficient', logo: 'https://img.icons8.com/?size=100&id=13677&format=png&color=000000' },
  { name: 'AWS Cloud', cat: 'Cloud', pct: 68, level: 'Intermediate', logo: 'https://img.icons8.com/?size=100&id=wU62u24brJ44&format=png&color=000000' },
  { name: 'Android / IoT', cat: 'Tech', pct: 62, level: 'Intermediate', logo: 'https://img.icons8.com/?size=100&id=17836&format=png&color=000000' },
  { name: 'After Effects', cat: 'Motion Graphics', pct: 40, level: 'Basic Knowledge', logo: 'https://img.icons8.com/color/96/adobe-after-effects.png' },
  { name: 'Unreal Engine', cat: '3D / Real-Time', pct: 35, level: 'Basic Knowledge', logo: 'https://img.icons8.com/color/96/unreal-engine.png', dark: true },
];

const CERTS = [
  { year: '2022', name: 'Proficient in SolidWorks', issuer: 'Dassault Systèmes', logo: 'https://img.icons8.com/?size=100&id=62397&format=png&color=000000', url: 'https://drive.google.com/file/d/1c94qHx1OYNrQayjJrOIKp8s9PVhU9J8_/view' },
  { year: '2026', name: 'Proficient in Revit BIM', issuer: 'Autodesk', logo: 'assets/skill-autodesk.svg', local: true, url: 'https://drive.google.com/file/d/1bLyZTA7sLTDtKllxk07mBBCULRm1x6FX/view?usp=sharing' },
  { year: '2022', name: 'Proficient in Revit MEP', issuer: 'Autodesk', logo: 'assets/skill-autodesk.svg', local: true, url: 'https://drive.google.com/file/d/1qfhgF6BLsI6WRR5uxHm8Mkd5DyCDY1MI/view' },
  { year: '2022', name: 'Master in Auto Body Design', issuer: 'Dassault Systèmes & Autodesk', logo: 'https://img.icons8.com/?size=100&id=12018&format=png&color=000000', url: 'https://drive.google.com/file/d/1Kzk2K7m6Fo7QIpjf8o8y8thkIja4bFvu/view' },
  { year: '2025', name: 'AWS Academy Cloud Foundations', issuer: 'Amazon Web Services', logo: 'https://img.icons8.com/?size=100&id=wU62u24brJ44&format=png&color=000000', url: 'https://drive.google.com/file/d/1_Q-TrFKoh4llJNq7AblC3NlBBdfSQy-P/view' },
  { year: 'Global', name: 'AutoCAD Certified Professional', issuer: 'Autodesk', logo: 'assets/skill-autodesk.svg', local: true, url: 'https://drive.google.com/file/d/1bmZODMoHRmOXsuE_5SnPSFie-M5_hj-z/view' },
];

/* ═══ PROJECT VIDEOS ════════════════════════════════════════
   Silent demo clips (audio removed). They autoplay muted on
   loop when scrolled into view. Add more by dropping an mp4
   in assets/videos and adding a line here.
   ═══════════════════════════════════════════════════════════ */
const PROJECT_VIDEOS = [
  { src: 'assets/videos/project-1.mp4', poster: 'assets/videos/project-1.jpg', title: 'MetaHuman Animator — video to 3D performance' },
  { src: 'assets/videos/project-2.mp4', poster: 'assets/videos/project-2.jpg', title: 'Live Link Face — real-time facial capture' },
  { src: 'assets/videos/project-3.mp4', poster: 'assets/videos/project-3.jpg', title: 'Sequencer — cinematic scene & camera work' },
];

/* ═══ TRAINING PHOTOS ═══════════════════════════════════════
   45 classroom photos, auto-optimised.
   To add more: drop them in assets/gallery and add a line here
   as { t: 'thumbnail path', f: 'full-size path' }
   ═══════════════════════════════════════════════════════════ */
const TRAINING_PHOTOS = [
  { t: 'assets/gallery/g01-t.jpg', f: 'assets/gallery/g01.jpg' },
  { t: 'assets/gallery/g02-t.jpg', f: 'assets/gallery/g02.jpg' },
  { t: 'assets/gallery/g03-t.jpg', f: 'assets/gallery/g03.jpg' },
  { t: 'assets/gallery/g04-t.jpg', f: 'assets/gallery/g04.jpg' },
  { t: 'assets/gallery/g05-t.jpg', f: 'assets/gallery/g05.jpg' },
  { t: 'assets/gallery/g06-t.jpg', f: 'assets/gallery/g06.jpg' },
  { t: 'assets/gallery/g07-t.jpg', f: 'assets/gallery/g07.jpg' },
  { t: 'assets/gallery/g08-t.jpg', f: 'assets/gallery/g08.jpg' },
  { t: 'assets/gallery/g09-t.jpg', f: 'assets/gallery/g09.jpg' },
  { t: 'assets/gallery/g10-t.jpg', f: 'assets/gallery/g10.jpg' },
  { t: 'assets/gallery/g11-t.jpg', f: 'assets/gallery/g11.jpg' },
  { t: 'assets/gallery/g12-t.jpg', f: 'assets/gallery/g12.jpg' },
  { t: 'assets/gallery/g13-t.jpg', f: 'assets/gallery/g13.jpg' },
  { t: 'assets/gallery/g14-t.jpg', f: 'assets/gallery/g14.jpg' },
  { t: 'assets/gallery/g15-t.jpg', f: 'assets/gallery/g15.jpg' },
  { t: 'assets/gallery/g16-t.jpg', f: 'assets/gallery/g16.jpg' },
  { t: 'assets/gallery/g17-t.jpg', f: 'assets/gallery/g17.jpg' },
  { t: 'assets/gallery/g18-t.jpg', f: 'assets/gallery/g18.jpg' },
  { t: 'assets/gallery/g19-t.jpg', f: 'assets/gallery/g19.jpg' },
  { t: 'assets/gallery/g20-t.jpg', f: 'assets/gallery/g20.jpg' },
  { t: 'assets/gallery/g21-t.jpg', f: 'assets/gallery/g21.jpg' },
  { t: 'assets/gallery/g22-t.jpg', f: 'assets/gallery/g22.jpg' },
  { t: 'assets/gallery/g23-t.jpg', f: 'assets/gallery/g23.jpg' },
  { t: 'assets/gallery/g24-t.jpg', f: 'assets/gallery/g24.jpg' },
  { t: 'assets/gallery/g25-t.jpg', f: 'assets/gallery/g25.jpg' },
  { t: 'assets/gallery/g26-t.jpg', f: 'assets/gallery/g26.jpg' },
  { t: 'assets/gallery/g27-t.jpg', f: 'assets/gallery/g27.jpg' },
  { t: 'assets/gallery/g28-t.jpg', f: 'assets/gallery/g28.jpg' },
  { t: 'assets/gallery/g29-t.jpg', f: 'assets/gallery/g29.jpg' },
  { t: 'assets/gallery/g30-t.jpg', f: 'assets/gallery/g30.jpg' },
  { t: 'assets/gallery/g31-t.jpg', f: 'assets/gallery/g31.jpg' },
  { t: 'assets/gallery/g32-t.jpg', f: 'assets/gallery/g32.jpg' },
  { t: 'assets/gallery/g33-t.jpg', f: 'assets/gallery/g33.jpg' },
  { t: 'assets/gallery/g34-t.jpg', f: 'assets/gallery/g34.jpg' },
  { t: 'assets/gallery/g35-t.jpg', f: 'assets/gallery/g35.jpg' },
  { t: 'assets/gallery/g36-t.jpg', f: 'assets/gallery/g36.jpg' },
  { t: 'assets/gallery/g37-t.jpg', f: 'assets/gallery/g37.jpg' },
  { t: 'assets/gallery/g38-t.jpg', f: 'assets/gallery/g38.jpg' },
  { t: 'assets/gallery/g39-t.jpg', f: 'assets/gallery/g39.jpg' },
  { t: 'assets/gallery/g40-t.jpg', f: 'assets/gallery/g40.jpg' },
  { t: 'assets/gallery/g41-t.jpg', f: 'assets/gallery/g41.jpg' },
  { t: 'assets/gallery/g42-t.jpg', f: 'assets/gallery/g42.jpg' },
  { t: 'assets/gallery/g43-t.jpg', f: 'assets/gallery/g43.jpg' },
  { t: 'assets/gallery/g44-t.jpg', f: 'assets/gallery/g44.jpg' },
  { t: 'assets/gallery/g45-t.jpg', f: 'assets/gallery/g45.jpg' },
];

/* ═══ MY WORK ═══════════════════════════════════════════════
   Real projects only. To add a new one, copy a block below.

   kind  — small label above the title
   name  — project title
   desc  — 1–3 sentences on what it does
   tags  — technologies / tools used
   live  — live website URL, or '' if there isn't one
   git   — GitHub repo URL, or '' if it's private
   img   — screenshot in assets/ e.g. 'assets/project-x.png'
           (leave it out to use the built-in art below)
   art   — built-in artwork: 'lab' | 'door' | 'chassis' | 'cloud' | 'tower'
   ═══════════════════════════════════════════════════════════ */
const PROJECTS = [
  {
    kind: 'Web Application · Full Stack',
    name: 'Lab IT Ticket System — 3D Campus Labs',
    desc: 'An interactive 3D lab portal built for Ethnotech Academy. Students rotate and zoom a live 3D view of the computer labs and click any PC to raise an IT ticket. Trainers, IT admins and lab allocators each get their own role-based dashboard to track, assign and resolve issues, with batch management and name import/export.',
    tags: ['3D Web', 'JavaScript', 'Role-Based Login', 'Ticket Workflow', 'Netlify'],
    live: 'https://friendly-malabi-0cde44.netlify.app/',
    git: '',
    img: 'assets/project-lab.jpg',   // screenshot (falls back to art below if missing)
    art: 'lab',
  },
  {
    kind: 'WebXR · 3D Experience',
    name: 'VR Portfolio — Immersive 3D Résumé',
    desc: 'My portfolio rebuilt as a walkable 3D space. Visitors drag to rotate, scroll to zoom, and can hit "Enter VR" to view it in a headset. Built with WebXR so it runs straight in the browser — no app, no install.',
    tags: ['WebXR', 'Three.js', '3D Web', 'VR', 'GitHub Pages'],
    live: 'https://senthilnathan148-dot.github.io/senthilvr/',
    git: '',
    img: 'assets/project-vr.jpg',    // add a screenshot here anytime
    art: 'vr',
  },
  {
    kind: 'Self-Learning · 3D & Virtual Production',
    name: 'Unreal Engine — MetaHuman & Cinematics',
    desc: 'Teaching myself Unreal Engine 5 in my own time. So far: driving a MetaHuman from my own video with MetaHuman Animator, live facial capture through Live Link Face, and building cinematic shots in Sequencer with lighting and camera moves. Clips below are from that practice.',
    tags: ['Unreal Engine 5', 'MetaHuman', 'Live Link Face', 'Sequencer', 'Motion Capture'],
    live: '',
    git: '',
    img: 'assets/project-unreal.jpg',
    art: 'vr',
  },
  {
    kind: 'Automotive Design · Clay Modelling',
    name: 'Q-Trail — Concept Vehicle Clay Model',
    desc: 'A concept off-road vehicle taken from hand sketch to a fully sculpted, finished clay model. Blocking the volume, refining the surfaces and detailing the wheels and greenhouse by hand — the same industrial clay workflow used in automotive studios for body (BIW) design.',
    tags: ['Clay Modelling', 'Automotive Design', 'Concept Vehicle', 'Surfacing', 'Hand Sculpting'],
    live: '', git: '',
    img: 'assets/clay/qtrail/q10.jpg',
    clay: { dir: 'assets/clay/qtrail/q', count: 29, vids: ['assets/clay/vids/qv01'] },
  },
  {
    kind: 'Automotive Design · Clay Modelling',
    name: 'Team Car — Full-Scale Clay Buck',
    desc: 'A team automotive clay project: setting up the template boards, building the armature and shaping a large-scale car buck together. Shows collaborative studio workflow — measuring, applying clay and scraping the surfaces down to a clean automotive form.',
    tags: ['Clay Modelling', 'Full-Scale Buck', 'Teamwork', 'Automotive Design', 'Surfacing'],
    live: '', git: '',
    img: 'assets/clay/teamcar/t20.jpg',
    clay: { dir: 'assets/clay/teamcar/t', count: 24, vids: [] },
  },
  {
    kind: 'Mechanical Design · CATIA V5',
    name: '3-Cylinder Steam Engine',
    desc: 'A 3-cylinder radial steam engine designed in CATIA V5 — 37 individual parts modelled and assembled into a complete mechanism with pistons, crank and valve gear, then photo-rendered.',
    tags: ['CATIA V5', 'Assembly Design', 'Solid Modelling', 'Mechanism', 'Rendering'],
    live: '', git: '',
    img: 'assets/cad/steam/01.jpg',
    gallery: ['assets/cad/steam/01.jpg', 'assets/cad/steam/02.jpg', 'assets/cad/steam/03.jpg', 'assets/cad/steam/04.jpg'],
  },
  {
    kind: 'Product Design · CATIA V5',
    name: 'LED Bulb — Product Model',
    desc: 'An LED bulb modelled in CATIA V5 — the lens, heat-sink body, driver base and cap built with surface and solid features, then assembled and rendered as a complete product.',
    tags: ['CATIA V5', 'Surface Modelling', 'Solid Modelling', 'Product Design'],
    live: '', git: '',
    img: 'assets/cad/led/01.jpg',
    gallery: ['assets/cad/led/01.jpg', 'assets/cad/led/02.jpg'],
  },
  {
    kind: 'Mechanical Design · CATIA V5',
    name: 'Jet Engine — Turbofan',
    desc: 'A turbofan jet engine modelled in CATIA V5 — fan, compressor and turbine stages, shaft and nacelle designed part-by-part, assembled into a full engine and finished with photo-real rendering.',
    tags: ['CATIA V5', 'Assembly Design', 'Turbomachinery', 'Rendering'],
    live: '', git: '',
    img: 'assets/cad/jet/01.jpg',
    gallery: ['assets/cad/jet/01.jpg', 'assets/cad/jet/02.jpg', 'assets/cad/jet/03.jpg', 'assets/cad/jet/04.jpg'],
  },
  {
    kind: 'Mechanical Design · CATIA V5',
    name: 'Horizontal Steam Engine',
    desc: 'A horizontal steam engine modelled in CATIA V5 — flywheel, cylinder, piston, crank and connecting rod built as individual parts and assembled with mechanical constraints, then rendered.',
    tags: ['CATIA V5', 'Assembly Design', 'Solid Modelling', 'Mechanism'],
    live: '', git: '',
    img: 'assets/cad/eng/01.jpg',
    gallery: ['assets/cad/eng/01.jpg', 'assets/cad/eng/02.jpg', 'assets/cad/eng/03.jpg'],
  },
];

/* ═══ 8 · RENDER — skills ═══ */
const renderSkills = () => {
  const _g = document.getElementById('skillsGrid');
  if (!_g) return;
  _g.innerHTML = SKILLS.map((s, i) => `
    <div class="flip-card reveal-scale" style="--d:${(i % 5) * 0.07}s" tabindex="0" role="button"
         aria-label="${s.name}: ${s.pct} percent, ${s.level}">
      <div class="flip-inner">
        <div class="flip-front">
          <div class="logo-chip"><img class="${s.local ? 'local' : ''}" src="${s.logo}" alt="${s.name} logo" loading="lazy"></div>
          <div class="skill-name">${s.name}</div>
          <div class="skill-cat">${s.cat}</div>
        </div>
        <div class="flip-back" style="--pct:${s.pct}%">
          <div class="b-pct">${s.pct}%</div>
          <div class="b-bar"><div class="b-fill"></div></div>
          <div class="b-label">${s.level}</div>
        </div>
      </div>
    </div>`).join('');
};

/* ═══ 9 · RENDER — certificates ═══ */
const renderCerts = () => {
  const _g = document.getElementById('certGrid');
  if (!_g) return;
  _g.innerHTML = CERTS.map((c, i) => `
    <div class="flip-card cert-flip reveal-scale" style="--d:${(i % 3) * 0.09}s" tabindex="0" role="button"
         aria-label="${c.name}, ${c.issuer}, ${c.year}" data-url="${c.url}" data-name="${c.name}">
      <div class="flip-inner">
        <div class="flip-front">
          <div class="logo-chip"><img class="${c.local ? 'local' : ''}" src="${c.logo}" alt="${c.issuer} logo" loading="lazy"></div>
          <div class="skill-name">${c.name}</div>
          <div class="skill-cat">${c.issuer}</div>
        </div>
        <div class="flip-back">
          <div class="cert-year-big">${c.year}</div>
          <div class="b-label" style="margin-top:8px">${c.issuer}</div>
          <button class="cert-btn" data-open-cert>View Certificate ↗</button>
        </div>
      </div>
    </div>`).join('');
};

/* ═══ 10 · RENDER — projects (SVG preview art, no external images) ═══ */
const projectArt = kind => {
  const defs = `<defs>
    <linearGradient id="pg-${kind}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00E5FF" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#3B82F6" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="bg-${kind}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0B1428"/><stop offset="1" stop-color="#050810"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#bg-${kind})"/>
  <g stroke="rgba(0,229,255,0.07)" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 58}" y1="0" x2="${i * 58}" y2="360"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${i * 58}" x2="640" y2="${i * 58}"/>`).join('')}</g>`;

  const art = {
    lab: `<g fill="none" stroke="url(#pg-lab)" stroke-width="2.5">
      <path d="M110 250 L320 160 L530 250 L320 340 Z" opacity="0.5"/>
      <g stroke-linejoin="round">
        <path d="M180 232 l52-22 34 14 -52 22z"/><path d="M198 224 v-30 l34 14 v30"/><path d="M232 208 v-30 l34 14 v30"/>
        <path d="M280 190 l52-22 34 14 -52 22z"/><path d="M298 182 v-30 l34 14 v30"/><path d="M332 166 v-30 l34 14 v30"/>
        <path d="M380 232 l52-22 34 14 -52 22z"/><path d="M398 224 v-30 l34 14 v30"/><path d="M432 208 v-30 l34 14 v30"/>
        <path d="M280 288 l52-22 34 14 -52 22z"/><path d="M298 280 v-30 l34 14 v30"/><path d="M332 264 v-30 l34 14 v30"/>
      </g>
      <circle cx="332" cy="150" r="9" fill="url(#pg-lab)" stroke="none"/>
      <path d="M332 128 v-26 M332 96 l-9 -9 M332 96 l9 -9" opacity="0.9"/>
      <rect x="404" y="66" width="150" height="52" rx="8" opacity="0.9"/>
      <path d="M420 84 h84 M420 98 h58" opacity="0.8"/>
      <circle cx="536" cy="80" r="5" fill="url(#pg-lab)" stroke="none"/>
    </g><text x="110" y="330" fill="rgba(0,229,255,0.55)" font-family="monospace" font-size="13">3D LAB VIEW · TICKET #OPEN · ROLE-BASED</text>`,
    vr: `<g fill="none" stroke="url(#pg-vr)" stroke-width="2.5">
      <path d="M195 150 h250 a26 26 0 0 1 26 26 v58 a26 26 0 0 1 -26 26 h-58 l-24 26 -36 0 -24 -26 h-108 a26 26 0 0 1 -26 -26 v-58 a26 26 0 0 1 26 -26 z"/>
      <ellipse cx="252" cy="199" rx="34" ry="26"/>
      <ellipse cx="388" cy="199" rx="34" ry="26"/>
      <path d="M169 176 h-22 M471 176 h22" opacity="0.85"/>
      <ellipse cx="320" cy="200" rx="150" ry="52" stroke-dasharray="4 8" opacity="0.5"/>
      <ellipse cx="320" cy="200" rx="150" ry="52" stroke-dasharray="4 8" opacity="0.45" transform="rotate(58 320 200)"/>
      <ellipse cx="320" cy="200" rx="150" ry="52" stroke-dasharray="4 8" opacity="0.45" transform="rotate(-58 320 200)"/>
      <circle cx="470" cy="200" r="5" fill="url(#pg-vr)" stroke="none"/>
      <circle cx="170" cy="200" r="5" fill="url(#pg-vr)" stroke="none"/>
    </g><text x="150" y="318" fill="rgba(0,229,255,0.55)" font-family="monospace" font-size="13">WEBXR · DRAG TO ROTATE · ENTER VR</text>`,
    bulb: `<g fill="none" stroke="url(#pg-bulb)" stroke-width="2.5" stroke-linejoin="round">
      <path d="M320 92 a80 80 0 0 1 54 138 c-10 10 -17 23 -19 38 h-70 c-2 -15 -9 -28 -19 -38 a80 80 0 0 1 54 -138z"/>
      <path d="M286 272 h68 M292 288 h56 M300 304 h40"/>
      <polyline points="298,182 312,162 320,198 328,162 342,182"/>
      <g opacity="0.5"><path d="M320 92 v-28 M424 176 h26 M216 176 h-26 M250 110 l-20 -20 M390 110 l20 -20"/></g>
    </g><text x="320" y="342" fill="rgba(0,229,255,0.5)" font-family="monospace" font-size="12.5" text-anchor="middle">CATIA V5 · LED BULB · SURFACE + SOLID</text>`,
    jet: `<g fill="none" stroke="url(#pg-jet)" stroke-width="2.5" stroke-linejoin="round">
      <path d="M170 150 h270 l46 22 -46 22 h-270 a34 42 0 0 1 0 -44z"/>
      <ellipse cx="170" cy="172" rx="16" ry="44"/>
      <g stroke-width="1.6" opacity="0.75">${Array.from({ length: 12 }, (_, i) => `<line x1="170" y1="172" x2="${(170 + Math.cos(i / 12 * 6.283) * 16).toFixed(1)}" y2="${(172 + Math.sin(i / 12 * 6.283) * 44).toFixed(1)}"/>`).join('')}</g>
      <path d="M486 150 l40 22 -40 22"/>
      <path d="M210 160 h240 M210 184 h240" opacity="0.4" stroke-dasharray="4 6"/>
    </g><text x="320" y="330" fill="rgba(0,229,255,0.5)" font-family="monospace" font-size="12.5" text-anchor="middle">CATIA V5 · TURBOFAN · JET ENGINE</text>`,
    hengine: `<g fill="none" stroke="url(#pg-hengine)" stroke-width="2.5" stroke-linejoin="round">
      <circle cx="205" cy="215" r="62"/><circle cx="205" cy="215" r="13"/>
      <g stroke-width="1.5" opacity="0.6">${Array.from({ length: 8 }, (_, i) => `<line x1="${(205 + Math.cos(i / 8 * 6.283) * 15).toFixed(1)}" y1="${(215 + Math.sin(i / 8 * 6.283) * 15).toFixed(1)}" x2="${(205 + Math.cos(i / 8 * 6.283) * 60).toFixed(1)}" y2="${(215 + Math.sin(i / 8 * 6.283) * 60).toFixed(1)}"/>`).join('')}</g>
      <rect x="305" y="188" width="158" height="54" rx="7"/>
      <path d="M267 215 h40 M463 215 h32 M479 200 v30"/>
      <circle cx="205" cy="215" r="6" fill="url(#pg-hengine)" stroke="none"/>
    </g><text x="320" y="330" fill="rgba(0,229,255,0.5)" font-family="monospace" font-size="12.5" text-anchor="middle">CATIA V5 · HORIZONTAL STEAM ENGINE</text>`,
    door: `<g fill="none" stroke="url(#pg-door)" stroke-width="2.5">
      <path d="M170 260 L170 130 Q170 95 210 90 L420 78 Q470 76 480 120 L490 260 Z"/>
      <path d="M195 250 L195 140 Q196 112 225 108 L415 98"/>
      <circle cx="440" cy="175" r="14"/><path d="M300 165 h95" stroke-dasharray="5 6"/>
      <path d="M210 200 h230" opacity="0.5" stroke-dasharray="3 7"/>
    </g><text x="170" y="305" fill="rgba(0,229,255,0.55)" font-family="monospace" font-size="13">CATIA V5 · BIW-DOOR-PNL-001</text>`,
    chassis: `<g fill="none" stroke="url(#pg-chassis)" stroke-width="2.5">
      <circle cx="180" cy="240" r="46"/><circle cx="180" cy="240" r="18"/>
      <circle cx="470" cy="240" r="46"/><circle cx="470" cy="240" r="18"/>
      <path d="M180 240 L280 140 L400 140 L470 240 M280 140 L310 240 M400 140 L360 100 L300 96"/>
    </g><g fill="rgba(0,229,255,0.5)">${Array.from({ length: 24 }, () => { const x = 150 + Math.random() * 360, y = 90 + Math.random() * 100; return `<circle cx="${x}" cy="${y}" r="1.4"/>`; }).join('')}</g>
    <text x="150" y="310" fill="rgba(0,229,255,0.55)" font-family="monospace" font-size="13">SCAN-TO-CAD · POINT CLOUD 84%</text>`,
    cloud: `<g fill="none" stroke="url(#pg-cloud)" stroke-width="2.5">
      <path d="M400 150 h-1.26A80 80 0 1 0 310 250 h90 a50 50 0 0 0 0-100z" transform="translate(-40,-45) scale(1.05)"/>
      <rect x="200" y="240" width="70" height="46" rx="8"/><rect x="300" y="240" width="70" height="46" rx="8"/><rect x="400" y="240" width="70" height="46" rx="8"/>
      <path d="M235 240 v-25 h200 v25 M335 240 v-25"/>
    </g><text x="200" y="320" fill="rgba(0,229,255,0.55)" font-family="monospace" font-size="13">AWS · EC2 · S3 · IOT-CORE</text>`,
    tower: `<g fill="none" stroke="url(#pg-tower)" stroke-width="2.5">
      <path d="M290 300 L320 70 L350 300 M296 250 h48 M301 200 h38 M306 150 h28 M311 105 h18"/>
      <path d="M290 300 L350 300" stroke-width="4"/>
      <path d="M320 70 l-35 -20 M320 70 l35 -20 M320 70 v-25"/>
      <circle cx="320" cy="70" r="6" fill="url(#pg-tower)"/>
      <path d="M410 120 a90 90 0 0 1 0 120 M440 100 a130 130 0 0 1 0 160" opacity="0.55"/>
      <path d="M230 120 a90 90 0 0 0 0 120 M200 100 a130 130 0 0 0 0 160" opacity="0.55"/>
    </g><text x="200" y="330" fill="rgba(0,229,255,0.55)" font-family="monospace" font-size="13">AUTOCAD · RF-ZONE ANALYSIS</text>`,
  };
  return `<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">${defs}${art[kind]}</svg>`;
};

/* ═══ 10x · STUDENT PROJECTS (Android apps built by my students) ═══ */
const STUDENT_PROJECTS = [
  { name: 'Blood Donor App', students: 'ICE Batch', tech: 'Android Studio', grad: 'linear-gradient(160deg,#e53935,#b71c1c)',
    desc: 'Connects blood donors with people in urgent need nearby.', icon: 'assets/student/blood.png' },
  { name: 'Braille Translator', students: 'Priyan', tech: 'Android Studio', grad: 'linear-gradient(160deg,#5c6bc0,#303f9f)',
    desc: 'Converts typed text into Braille to support visually-impaired users.', icon: 'assets/student/braille.png' },
  { name: 'App Market', students: 'Tarun · Cova', tech: 'Android Studio', grad: 'linear-gradient(160deg,#29b6f6,#0277bd)',
    desc: 'An app-marketplace concept for browsing and downloading apps.', icon: 'assets/student/appmarket.png' },
  { name: 'Sam Fire', students: 'Sanjay · Vishwaijeth', tech: 'Android Studio', grad: 'linear-gradient(160deg,#37474f,#000000)', game: true,
    desc: 'An action-packed mobile game built end-to-end in Android Studio.', icon: 'assets/student/samfire.png' },
  { name: 'Iron & Crown', students: 'Surya', tech: 'Android Studio', grad: 'linear-gradient(160deg,#8d6e63,#3e2723)', game: true,
    desc: 'A fantasy strategy game of kingdoms, battles and crowns.', icon: 'assets/student/sl.png' },
  { name: 'Expense Tracker', students: 'Bhuvi · Pragathi', tech: 'Android Studio', grad: 'linear-gradient(160deg,#26a69a,#00695c)',
    desc: 'Track daily spending, set budgets and see where the money goes.', glyph: '💰' },
  { name: 'Calculation App', students: 'Israel Paul Akash', tech: 'Android Studio', grad: 'linear-gradient(160deg,#0891b2,#164e63)',
    desc: 'A clean calculator app for quick everyday math.', glyph: '🔢' },
  { name: 'Book Review', students: 'Israel Paul Akash', tech: 'Android Studio', grad: 'linear-gradient(160deg,#ffa726,#ef6c00)',
    desc: 'Browse books and share ratings & reviews with other readers.', glyph: '📚' },
  { name: 'HomeView 3D', students: 'Bharathram · Kishan', tech: 'Android Studio', grad: 'linear-gradient(160deg,#26c6da,#00838f)',
    desc: '3D home & interior visualization for exploring room layouts.', glyph: '🏠' },
  { name: 'Crop AI', students: 'Ugesh · Surya', tech: 'Android Studio', grad: 'linear-gradient(160deg,#66bb6a,#2e7d32)',
    desc: 'AI-assisted crop guidance to help farmers improve yield.', glyph: '🌱' },
  { name: 'Activity Tracker', students: 'Priyan', tech: 'Android Studio', grad: 'linear-gradient(160deg,#ff7043,#d84315)',
    desc: 'Logs daily activities and habits to keep users on track.', glyph: '🏃' },
  { name: 'Pet Care', students: 'Sharu · Mohana Priya', tech: 'Android Studio', grad: 'linear-gradient(160deg,#ec407a,#ad1457)',
    desc: 'Manage pet feeding, health records and reminders in one place.', glyph: '🐾' },
];

/* Reconstructed mini app-screens (based on each project's real layout XML) */
const spBar = (color = '#fff', t = '9:41') => `<div class="sp-status" style="color:${color}"><span>${t}</span><span class="sp-sig" style="background:${color === '#fff' ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.35)'}"></span></div>`;
const spKeys = arr => arr.map(k => `<span class="k${'=+-*/'.includes(k) || k === '×' || k === '÷' ? ' op' : ''}${k === '=' ? ' eq' : ''}">${k}</span>`).join('');

// Screens rebuilt to match each app's REAL colors & layout (from its XML), with live animation
const SCREENS = {
  // light theme · gray #A4A3A3 buttons · red #D30606 accent
  'Calculation App': p => `${spBar('#333')}<div class="sc calc"><div class="calc-head">CALCULATOR APP</div><div class="calc-disp"><span>78 × 9</span><b class="count" data-to="702">0</b></div><div class="calc-grid">${spKeys(['C','(',')','÷','7','8','9','×','4','5','6','−','1','2','3','+','0','00','.','='])}</div></div>`,
  // Material light · green #2E7D32 toolbar · white cards · bg #F4F7F6
  'Expense Tracker': p => `${spBar('#fff')}<div class="sc ex"><div class="ex-top">Expense Tracker</div><div class="ex-body"><div class="ex-card"><small>Monthly Budget</small><div class="ex-nums"><div><small>Spent</small><b style="color:#D32F2F">₹<i class="count" data-to="4200">0</i></b></div><div><small>Balance</small><b style="color:#2E7D32">₹<i class="count" data-to="5800">0</i></b></div></div></div><div class="ex-btn">＋ Add Expense</div><small class="ex-h2">Transaction History</small><div class="ex-row"><span>🍔 Food</span><em>−₹320</em></div><div class="ex-row"><span>🚌 Travel</span><em>−₹90</em></div><div class="ex-row"><span>📱 Recharge</span><em>−₹239</em></div></div></div>`,
  // light #F8F9FA · white surface · blue #2962FF dots (animated) · amber #FFAB00
  'Braille Translator': p => `${spBar('#333')}<div class="sc br"><div class="br-top">⠿ Braille Translator</div><div class="br-card"><div class="br-in">hello</div><div class="br-dots">${[[1,1,0,1,0,1],[1,0,0,1,1,0],[1,1,1,0,0,0],[1,1,1,0,0,0],[1,0,1,0,1,0]].map((c,ci)=>`<span class="br-cell" style="animation-delay:${ci*0.35}s">${c.map(d=>`<i class="${d?'on':''}"></i>`).join('')}</span>`).join('')}</div><small class="br-lbl">Vibration Speed</small><div class="br-slider"><i></i></div><div class="br-btn">📳 Start Vibration</div></div></div>`,
  // light #FFF5F5 · pink cards #FCEBEB · dark-red text · ECG + heart animation
  'Blood Donor App': p => `${spBar('#791F1F')}<div class="sc bd"><div class="bd-card bd-hero"><div><b>Donate blood,<br>save lives</b><small>One donation saves 3 lives</small></div><span class="bd-heart">♥</span></div><div class="bd-ecg"><svg viewBox="0 0 120 30" preserveAspectRatio="none"><polyline class="ecg" points="0,15 20,15 26,15 30,4 36,26 42,15 60,15 66,15 70,6 76,24 82,15 120,15"/></svg></div><div class="bd-stats"><div class="bd-card"><b>4.5M</b><small>need yearly</small></div><div class="bd-card"><b>38K</b><small>daily</small></div><div class="bd-card"><b>1 in 7</b><small>patients</small></div></div><div class="bd-btn">♥ Register as Donor</div></div>`,
  // dark gradient #2D1B4E→#0A0E21 · navy text on translucent cards
  'App Market': p => `${spBar('#fff')}<div class="sc am"><span class="am-logo">▲</span><div class="am-h">Appmarket</div><small class="am-tag">Discover and download the world's most popular apps.</small><div class="am-grid">${['🛒','📘','📷','▶️','🎵','💬','🗺️','🎮'].map((e,i)=>`<span style="animation-delay:${i*0.12}s">${e}</span>`).join('')}</div><div class="am-btn">Get Started →</div></div>`,
  // light #F0F2F5 · navy #1A2332 bar · floor #D4A574 / wall #2C3E50 / ceiling
  'HomeView 3D': p => `${spBar('#fff')}<div class="sc hv"><div class="hv-top">🏠 HomeView 3D</div><div class="hv-body"><div class="hv-plan"><i class="wall" style="left:6%;top:8%;width:42%;height:26%"></i><i class="ceil" style="right:6%;top:8%;width:36%;height:40%"></i><i class="floor drop" style="left:6%;bottom:8%;width:54%;height:34%"></i><span class="hv-sofa drop2">🛋️</span></div><small class="hv-hint">Tap floor plan to place furniture</small><div class="hv-btn">🗑 Clear Room</div></div></div>`,
  // green welcome + AI chat (typing animation)
  'Crop AI': p => `${spBar('#fff')}<div class="sc ai"><div class="ai-top">🌱 Crop AI</div><div class="ai-body"><div class="ai-bot">Welcome! Ask me anything about crops.</div><div class="ai-me">Why are my tomato leaves yellow?</div><div class="ai-bot ai-typing"><i></i><i></i><i></i></div><div class="ai-input"><span>Ask about your crops…</span><em>Send</em></div></div></div>`,
  'Book Review': p => `${spBar('#fff')}<div class="sc bks"><div class="bk-top">📚 Book Review</div><div class="bk-body">${[['Atomic Habits','★★★★★'],['The Alchemist','★★★★☆'],['Wings of Fire','★★★★★']].map(b=>`<div class="bk"><span class="bk-c"></span><div><b>${b[0]}</b><em>${b[1]}</em></div></div>`).join('')}</div></div>`,
  'Activity Tracker': p => `${spBar('#fff')}<div class="sc at"><div class="at-top">🏃 Activity</div><div class="at-body"><div class="at-ring"><b class="count" data-to="8240">0</b><small>steps</small></div><div class="at-row"><span>🔥 Calories</span><em>412</em></div><div class="at-row"><span>📍 Distance</span><em>5.8 km</em></div><div class="at-row"><span>⏱ Active</span><em>64 min</em></div></div></div>`,
  'Pet Care': p => `${spBar('#fff')}<div class="sc pc"><div class="pc-top">🐾 Pet Care</div><div class="pc-body"><div class="pc-pet"><span class="pc-av">🐕</span><div><b>Bruno</b><small>Golden Retriever · 3y</small></div></div><small class="pc-h2">Reminders</small><div class="pc-row"><span>🍖 Feed</span><em>8:00 AM</em></div><div class="pc-row"><span>💊 Vitamin</span><em>2:00 PM</em></div><div class="pc-row"><span>🩺 Vet visit</span><em>Sat</em></div></div></div>`,
};

const renderStudentProjects = () => {
  const g = document.getElementById('studentGrid');
  if (!g) return;
  g.innerHTML = STUDENT_PROJECTS.map((p, i) => {
    let screen;
    if (p.screenshot) {
      screen = `<img class="sp-shot" src="${p.screenshot}" alt="${p.name} screen" loading="lazy">`;
    } else if (p.game) {
      screen = `<div class="sp-game"><img src="${p.icon}" alt="" loading="lazy"><span class="sp-game-t">${p.name}</span><span class="sp-play">▶</span></div>`;
    } else if (SCREENS[p.name]) {
      screen = `<div class="sp-ui" style="--g:${p.grad}">${SCREENS[p.name](p)}</div>`;
    } else {
      screen = `<div class="sp-app" style="background:${p.grad}"><div class="sp-app-icon">${p.icon ? `<img src="${p.icon}" alt="">` : `<span>${p.glyph||'📱'}</span>`}</div><div class="sp-app-title">${p.name}</div></div>`;
    }
    return `
    <article class="glass student-card reveal-scale" style="--d:${(i % 4) * 0.06}s">
      <div class="sp-phone">
        <span class="sp-phone-cam" aria-hidden="true"></span>
        <div class="sp-screen">${screen}</div>
      </div>
      <div class="sp-body">
        <h3 class="sp-name">${p.name}</h3>
        <p class="sp-students">${p.students}</p>
        <p class="sp-desc">${p.desc}</p>
        <span class="sp-tech">${p.tech}</span>
      </div>
    </article>`;
  }).join('');

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      e.target.querySelectorAll('.count').forEach(c => {
        const to = +c.dataset.to; const t0 = performance.now();
        const step = now => { const k = Math.min((now - t0) / 1200, 1);
          c.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString();
          if (k < 1) requestAnimationFrame(step); };
        reduceMotion ? (c.textContent = to.toLocaleString()) : requestAnimationFrame(step);
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.1 });
  g.querySelectorAll('.reveal-scale').forEach(el => io.observe(el));
};

const renderProjects = () => {
  const _g = document.getElementById('projectsGrid');
  if (!_g) return;
  const liveBtn = p => p.live && p.live !== '#' ? `
    <a class="p-action p-live" href="${p.live}" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>
      Visit Live Site
    </a>` : '';

  const gitBtn = p => p.git && p.git !== '#' ? `
    <a class="p-action p-git" href="${p.git}" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
      GitHub
    </a>` : '';

  const galleryBtn = (p, i) => (p.clay || p.gallery) ? `
    <button class="p-action p-live" type="button" data-clay="${i}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
      View Gallery (${projMedia(p).length})
    </button>` : '';

  _g.innerHTML = PROJECTS.map((p, i) => `
    <article class="glass project-card reveal-scale" style="--d:${(i % 2) * 0.1}s">
      <div class="project-media">
        ${projectArt(p.art)}
        ${p.img ? `<img src="${p.img}" alt="${p.name} screenshot" loading="lazy" class="project-shot" onerror="this.remove()">` : ''}
        ${(liveBtn(p) || gitBtn(p) || galleryBtn(p, i)) ? `<div class="project-overlay">${liveBtn(p)}${gitBtn(p)}${galleryBtn(p, i)}</div>` : ''}
      </div>
      <div class="project-body">
        <span class="project-kind">${p.kind}</span>
        <h3 class="project-name">${p.name}</h3>
        <p class="project-desc">${p.desc}</p>
        <div class="project-tags">${p.tags.map(t => `<span class="p-tag">${t}</span>`).join('')}</div>
      </div>
    </article>`).join('');

  _g.querySelectorAll('[data-clay]').forEach(b => b.addEventListener('click', () => openClay(PROJECTS[+b.dataset.clay])));
};

/* ═══ clay project gallery lightbox ═══ */
let clayMedia = [], clayIdx = 0;
const buildClayBox = () => {
  let box = document.getElementById('clayBox');
  if (box) return box;
  box = document.createElement('div');
  box.id = 'clayBox';
  box.className = 'clay-box';
  box.innerHTML = `
    <button class="clay-close" type="button" aria-label="Close">✕</button>
    <button class="clay-nav clay-prev" type="button" aria-label="Previous">‹</button>
    <button class="clay-nav clay-next" type="button" aria-label="Next">›</button>
    <div class="clay-stage" id="clayStage"></div>
    <div class="clay-count" id="clayCount"></div>`;
  document.body.appendChild(box);
  box.querySelector('.clay-close').onclick = closeClay;
  box.querySelector('.clay-prev').onclick = () => stepClay(-1);
  box.querySelector('.clay-next').onclick = () => stepClay(1);
  box.addEventListener('click', e => { if (e.target === box) closeClay(); });
  document.addEventListener('keydown', e => {
    if (!box.classList.contains('open')) return;
    if (e.key === 'Escape') closeClay();
    if (e.key === 'ArrowLeft') stepClay(-1);
    if (e.key === 'ArrowRight') stepClay(1);
  });
  return box;
};
const projMedia = p => {
  const list = [];
  if (p.gallery) p.gallery.forEach(g => list.push(
    typeof g === 'string' ? { type: 'img', src: g } : { type: 'video', src: g.v + '.mp4', poster: g.v + '.jpg' }));
  if (p.clay) {
    p.clay.vids.forEach(v => list.push({ type: 'video', src: v + '.mp4', poster: v + '.jpg' }));
    for (let i = 1; i <= p.clay.count; i++) list.push({ type: 'img', src: `${p.clay.dir}${String(i).padStart(2, '0')}.jpg` });
  }
  return list;
};
const openClay = p => {
  clayMedia = projMedia(p);
  clayIdx = 0;
  buildClayBox().classList.add('open');
  document.body.style.overflow = 'hidden';
  showClay();
};
const showClay = () => {
  const m = clayMedia[clayIdx];
  document.getElementById('clayStage').innerHTML = m.type === 'video'
    ? `<video src="${m.src}" poster="${m.poster}" controls autoplay playsinline></video>`
    : `<img src="${m.src}" alt="Clay model photo">`;
  document.getElementById('clayCount').textContent = `${clayIdx + 1} / ${clayMedia.length}`;
};
const stepClay = d => { clayIdx = (clayIdx + d + clayMedia.length) % clayMedia.length; showClay(); };
const closeClay = () => {
  const box = document.getElementById('clayBox');
  if (box) box.classList.remove('open');
  document.getElementById('clayStage').innerHTML = '';
  document.body.style.overflow = '';
};

/* ═══ 10b · PROJECT DEMO VIDEOS (muted, autoplay in view) ═══ */
const renderProjectVideos = () => {
  const grid = document.getElementById('videoGrid');
  const wrap = document.getElementById('videoWrap');
  if (!grid) return;
  if (!PROJECT_VIDEOS.length) { if (wrap) wrap.hidden = true; return; }

  grid.innerHTML = PROJECT_VIDEOS.map((v, i) => `
    <figure class="glass video-card reveal-scale" style="--d:${(i % 3) * 0.09}s" tabindex="0" role="button" aria-label="Play ${v.title} full size">
      <div class="video-frame">
        <video src="${v.src}" poster="${v.poster}"
               muted playsinline loop preload="none"
               onerror="this.closest('.video-card').remove(); window._vidCheck && window._vidCheck();"></video>
        <span class="video-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </span>
        <span class="video-badge">No sound</span>
      </div>
      <figcaption class="video-cap">${v.title}</figcaption>
    </figure>`).join('');

  window._vidCheck = () => { if (wrap && !grid.querySelector('.video-card')) wrap.hidden = true; };
  window._vidCheck();

  const cards = [...grid.querySelectorAll('.video-card')];

  // reveal + lazy-load: only load and play when the card is on screen
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const vid = e.target.querySelector('video');
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        if (vid.preload !== 'auto') { vid.preload = 'auto'; vid.load(); }
        if (!reduceMotion) vid.play().catch(() => {});   // muted → allowed to autoplay
      } else if (vid && !vid.paused) {
        vid.pause();                                     // save battery off-screen
      }
    });
  }, { threshold: 0.35 });
  cards.forEach(c => io.observe(c));

  /* ── click a card → open it full size ── */
  const box  = document.getElementById('videoLightbox');
  const bVid = document.getElementById('videoLightboxVid');
  const bCap = document.getElementById('videoLightboxCap');
  if (!box) return;
  let vIdx = 0;

  const showVideo = i => {
    vIdx = (i + PROJECT_VIDEOS.length) % PROJECT_VIDEOS.length;
    const v = PROJECT_VIDEOS[vIdx];
    bVid.src = v.src;
    bVid.poster = v.poster;
    bVid.currentTime = 0;
    bVid.play().catch(() => {});
    if (bCap) bCap.textContent = `${v.title}  ·  ${vIdx + 1} / ${PROJECT_VIDEOS.length}`;
  };

  const openVideo = i => {
    cards.forEach(c => c.querySelector('video')?.pause());   // hush the grid
    showVideo(i);
    box.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeVideo = () => {
    box.classList.remove('active');
    bVid.pause();
    bVid.removeAttribute('src');
    bVid.load();
    document.body.style.overflow = '';
  };

  grid.addEventListener('click', e => {
    const card = e.target.closest('.video-card');
    if (card) openVideo(cards.indexOf(card));
  });
  grid.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.video-card');
      if (card) { e.preventDefault(); openVideo(cards.indexOf(card)); }
    }
  });

  box.addEventListener('click', e => {
    if (e.target.closest('.vl-next')) return showVideo(vIdx + 1);
    if (e.target.closest('.vl-prev')) return showVideo(vIdx - 1);
    if (e.target.closest('.vl-sound')) {          // let them unmute if they want
      bVid.muted = !bVid.muted;
      box.classList.toggle('sound-on', !bVid.muted);
      return;
    }
    if (e.target === box || e.target.closest('.vl-close')) closeVideo();
  });

  document.addEventListener('keydown', e => {
    if (!box.classList.contains('active')) return;
    if (e.key === 'Escape') closeVideo();
    if (e.key === 'ArrowRight') showVideo(vIdx + 1);
    if (e.key === 'ArrowLeft') showVideo(vIdx - 1);
  });
};

/* ═══ 11b · TRAINING PHOTO GALLERY ═══ */
const HOME_PHOTOS = 6;           // photos shown on the home page
const GALLERY_STEP = 12;         // photos added per click on the gallery page
const IS_GALLERY_PAGE = document.body.dataset.page === 'gallery';
let galleryShown = 0;

const renderTrainingPhotos = () => {
  const grid = document.getElementById('trainGallery');
  const wrap = document.getElementById('trainGalleryWrap');
  const moreBox = document.getElementById('trainGalleryMore');
  if (!grid) return;

  if (!TRAINING_PHOTOS.length) { if (wrap) wrap.hidden = true; return; }

  const countEl = document.getElementById('galleryCount');
  if (countEl) countEl.textContent = `${TRAINING_PHOTOS.length} photos from real sessions — click any photo to view it larger`;

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });

  const addBatch = () => {
    const step = IS_GALLERY_PAGE ? GALLERY_STEP : HOME_PHOTOS;
    const next = TRAINING_PHOTOS.slice(galleryShown, galleryShown + step);
    const html = next.map((p, i) => `
      <figure class="tg-item reveal-scale" style="--d:${(i % 3) * 0.08}s"
              data-full="${p.f}" data-i="${galleryShown + i}" tabindex="0" role="button"
              aria-label="Training photo ${galleryShown + i + 1}">
        <img src="${p.t}" alt="Training session photo ${galleryShown + i + 1}" loading="lazy">
        <span class="tg-zoom" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>
        </span>
      </figure>`).join('');
    grid.insertAdjacentHTML('beforeend', html);
    galleryShown += next.length;

    grid.querySelectorAll('.reveal-scale:not(.visible)').forEach(el => io.observe(el));

    if (moreBox) {
      const left = TRAINING_PHOTOS.length - galleryShown;
      if (left <= 0) {
        moreBox.innerHTML = '';
      } else if (IS_GALLERY_PAGE) {
        // gallery page: load more in place
        moreBox.innerHTML = `<button class="btn btn-ghost magnetic" id="tgMoreBtn" type="button"><span>Show ${Math.min(left, GALLERY_STEP)} more photos (${left} left)</span></button>`;
        const btn = document.getElementById('tgMoreBtn');
        if (btn) btn.onclick = addBatch;
      } else {
        // home page: send them to the full gallery page
        moreBox.innerHTML = `<a class="btn btn-ghost magnetic" href="gallery.html"><span>View all ${TRAINING_PHOTOS.length} photos →</span></a>`;
      }
    }
  };
  addBatch();

  /* ── lightbox with prev / next ── */
  const box = document.getElementById('photoLightbox');
  const boxImg = document.getElementById('photoLightboxImg');
  const boxCap = document.getElementById('photoLightboxCap');
  if (!box) return;
  let idx = 0;

  const show = i => {
    idx = (i + TRAINING_PHOTOS.length) % TRAINING_PHOTOS.length;
    boxImg.src = TRAINING_PHOTOS[idx].f;
    if (boxCap) boxCap.textContent = `${idx + 1} / ${TRAINING_PHOTOS.length}`;
  };
  const open = i => {
    show(i);
    box.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    box.classList.remove('active');
    boxImg.src = '';
    document.body.style.overflow = '';
  };

  grid.addEventListener('click', e => {
    const item = e.target.closest('.tg-item');
    if (item) open(+item.dataset.i);
  });
  grid.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const item = e.target.closest('.tg-item');
      if (item) { e.preventDefault(); open(+item.dataset.i); }
    }
  });

  box.addEventListener('click', e => {
    if (e.target.closest('.pl-next')) return show(idx + 1);
    if (e.target.closest('.pl-prev')) return show(idx - 1);
    if (e.target === box || e.target.closest('.pl-close')) close();
  });
  document.addEventListener('keydown', e => {
    if (!box.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(idx + 1);
    if (e.key === 'ArrowLeft') show(idx - 1);
  });
};

/* ═══ 12 · SCROLL REVEAL + TIMELINE ═══ */
const initReveals = () => {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal, .reveal-scale, .reveal-line, .titem').forEach(el => io.observe(el));

  // hero entrance on load
  requestAnimationFrame(() => {
    document.querySelectorAll('#hero .reveal, #hero .reveal-line').forEach((el, i) => {
      el.style.transitionDelay = `${0.1 + i * 0.12}s`;
      el.classList.add('visible');
      setTimeout(() => (el.style.transitionDelay = ''), 2000);
    });
  });

  // timeline line fill follows scroll
  const timeline = document.getElementById('timeline');
  const fill = document.getElementById('timelineFill');
  if (timeline && fill) {
    const onScroll = () => {
      const r = timeline.getBoundingClientRect();
      const progress = Math.min(Math.max((innerHeight * 0.75 - r.top) / r.height, 0), 1);
      fill.style.height = `${progress * 100}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
};

/* ═══ 13 · PARALLAX (hero shapes + mouse) ═══ */
const initParallax = () => {
  if (reduceMotion) return;
  const layers = [...document.querySelectorAll('[data-depth]')];
  let mx = 0, my = 0, sy = 0;

  window.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  });
  window.addEventListener('scroll', () => { sy = scrollY; }, { passive: true });

  const loop = () => {
    layers.forEach(el => {
      const d = +el.dataset.depth;
      el.style.translate = `${mx * d * 60}px ${my * d * 60 - sy * d * 0.6}px`;
    });
    requestAnimationFrame(loop);
  };
  loop();
};

/* ═══ 14 · 3D TILT CARDS ═══ */
const initTilt = () => {
  if (!isFinePointer || reduceMotion) return;
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
};

/* ═══ 15 · FLIP CARDS (tap on touch) + CERT MODAL ═══ */
const initFlipAndModal = () => {
  document.addEventListener('click', e => {
    const openBtn = e.target.closest('[data-open-cert]');
    if (openBtn) {
      e.stopPropagation();
      const card = openBtn.closest('.flip-card');
      openCertModal(card.dataset.url, card.dataset.name);
      return;
    }
    const flip = e.target.closest('.flip-card');
    if (flip) flip.classList.toggle('flipped');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const flip = e.target.closest?.('.flip-card');
      if (flip) { e.preventDefault(); flip.classList.toggle('flipped'); }
    }
    if (e.key === 'Escape') closeCertModal();
  });

  const overlay = document.getElementById('certModal');
  if (!overlay) return;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeCertModal(); });
  document.getElementById('modalClose').addEventListener('click', closeCertModal);
};

const openCertModal = (driveUrl, title) => {
  const m = document.getElementById('certModal');
  if (!m) return;
  const fileId = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!fileId) return;
  document.getElementById('certModalFrame').src = `https://drive.google.com/file/d/${fileId}/preview`;
  document.getElementById('certModalTitle').textContent = title;
  document.getElementById('certModal').classList.add('active');
  document.body.style.overflow = 'hidden';
};
const closeCertModal = () => {
  const m = document.getElementById('certModal');
  if (!m) return;                      // page has no certificate modal
  m.classList.remove('active');
  const f = document.getElementById('certModalFrame');
  if (f) f.src = '';
  document.body.style.overflow = '';
};

/* ═══ BOOT ═══ */
document.addEventListener('DOMContentLoaded', () => {
  renderSkills();
  renderCerts();
  renderProjects();
  renderProjectVideos();
  renderStudentProjects();
  renderTrainingPhotos();
  initParticles();
  initCursor();
  initNav();
  initTyping();
  initCounters();
  initReveals();
  initParallax();
  initTilt();
  initFlipAndModal();
  initMagnetic();
});
