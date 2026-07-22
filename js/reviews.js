/* ═══════════════════════════════════════════════════════════
   STUDENT REVIEWS — Supabase + Google login
   ═══════════════════════════════════════════════════════════
   SETUP: fill in the two values below from your Supabase project
   (Settings → API). See SETUP-SUPABASE.md for the full guide.
   ═══════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://czgzsdksbtrmtoilfklv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tuF6C094GpmEHHjboBWlZQ_vahiuIYX';

/* Courses students can pick — edit this list freely */
const COURSES = [
  'SolidWorks', 'CATIA V5', 'AutoCAD', 'Creo', 'Fusion 360', 'Inventor',
  'BIW / Auto Body Design', 'Reverse Engineering', 'AWS Cloud', 'IoT',
  'Android Studio', 'Adobe Photoshop', 'Excel Expert', 'Other',
];

/* How many reviews to show on the home page before the "View all" button */
const HOME_LIMIT = 6;
/* true when we are on reviews.html (shows every review, no limit) */
const IS_FULL_PAGE = document.body.dataset.page === 'reviews';

const isConfigured = () =>
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

let sb = null;
let currentUser = null;
let myReview = null;

/* ── tiny helpers ── */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const starsHTML = n => Array.from({ length: 5 }, (_, i) =>
  `<span class="star${i < n ? ' on' : ''}">★</span>`).join('');

const initials = name => String(name || '?').trim().split(/\s+/)
  .slice(0, 2).map(w => w[0]).join('').toUpperCase();

const timeAgo = iso => {
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (d < 1) return 'Today';
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} month${m > 1 ? 's' : ''} ago`;
  const y = Math.floor(m / 12);
  return `${y} year${y > 1 ? 's' : ''} ago`;
};

/* ═══ 1 · BOOT ═══ */
const initReviews = async () => {
  const grid = document.getElementById('reviewGrid');
  if (!grid) return;

  buildCourseOptions();
  wireStarInput();
  wireFormEvents();

  if (!isConfigured()) {
    showDemoMode();
    return;
  }

  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // react to login / logout (also handles the OAuth redirect back)
  sb.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    refreshAuthUI();
    if (currentUser) loadMyReview();
  });

  const { data: { session } } = await sb.auth.getSession();
  currentUser = session?.user ?? null;
  refreshAuthUI();

  await loadReviews();
  if (currentUser) await loadMyReview();
};

/* ═══ 2 · AUTH ═══ */
const signIn = async () => {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href.split('#')[0] },
  });
  if (error) toast('Could not start Google sign-in: ' + error.message, true);
};

const signOut = async () => {
  await sb.auth.signOut();
  currentUser = null;
  myReview = null;
  refreshAuthUI();
  closeReviewModal();
};

const refreshAuthUI = () => {
  const loginBtn = document.getElementById('reviewLoginBtn');
  const writeBtn = document.getElementById('reviewWriteBtn');
  const userBox = document.getElementById('reviewUser');
  if (!loginBtn) return;

  if (currentUser) {
    const meta = currentUser.user_metadata || {};
    const name = meta.full_name || meta.name || currentUser.email;
    loginBtn.hidden = true;
    writeBtn.hidden = false;
    userBox.hidden = false;
    userBox.innerHTML = `
      <span class="ru-avatar">${meta.avatar_url
        ? `<img src="${esc(meta.avatar_url)}" alt="">`
        : esc(initials(name))}</span>
      <span class="ru-name">${esc(name)}</span>
      <button class="ru-out" id="reviewSignOut" type="button">Sign out</button>`;
    document.getElementById('reviewSignOut').onclick = signOut;
  } else {
    loginBtn.hidden = false;
    writeBtn.hidden = true;
    userBox.hidden = true;
    userBox.innerHTML = '';
  }
};

/* ═══ 3 · LOAD REVIEWS ═══ */
const loadReviews = async () => {
  const grid = document.getElementById('reviewGrid');
  grid.innerHTML = `<p class="review-empty">Loading reviews…</p>`;

  const { data, error } = await sb
    .from('reviews')
    .select('name, avatar_url, course, rating, review, created_at')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="review-empty">Could not load reviews right now.</p>`;
    console.error(error);
    return;
  }
  renderReviews(data || []);
};

const renderReviews = list => {
  const grid = document.getElementById('reviewGrid');
  const summary = document.getElementById('reviewSummary');
  const more = document.getElementById('reviewMore');

  if (!list.length) {
    grid.innerHTML = `<p class="review-empty">No reviews yet — be the first student to leave one!</p>`;
    if (summary) summary.hidden = true;
    if (more) more.hidden = true;
    return;
  }

  const total = list.length;
  const avg = (list.reduce((s, r) => s + r.rating, 0) / total).toFixed(1);
  if (summary) {
    summary.hidden = false;
    summary.innerHTML = `
      <span class="rs-score">${avg}</span>
      <span class="rs-stars">${starsHTML(Math.round(avg))}</span>
      <span class="rs-count">from ${total} student review${total > 1 ? 's' : ''}</span>`;
  }

  // home page shows only the newest few
  const shown = IS_FULL_PAGE ? list : list.slice(0, HOME_LIMIT);

  if (more) {
    if (!IS_FULL_PAGE && total > HOME_LIMIT) {
      more.hidden = false;
      more.innerHTML = `<a class="btn btn-ghost magnetic" href="reviews.html">
        <span>View all ${total} reviews →</span></a>`;
    } else {
      more.hidden = true;
      more.innerHTML = '';
    }
  }

  grid.innerHTML = shown.map((r, i) => `
    <article class="glass review-card reveal-scale" style="--d:${(i % 3) * 0.08}s">
      <div class="rc-stars">${starsHTML(r.rating)}</div>
      <p class="rc-text">${esc(r.review)}</p>
      <footer class="rc-foot">
        <span class="rc-avatar">${r.avatar_url
          ? `<img src="${esc(r.avatar_url)}" alt="" loading="lazy">`
          : esc(initials(r.name))}</span>
        <span class="rc-who">
          <span class="rc-name">${esc(r.name)}</span>
          <span class="rc-meta">${esc(r.course)} · ${timeAgo(r.created_at)}</span>
        </span>
      </footer>
    </article>`).join('');

  // let the existing scroll-reveal observer pick these up
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  grid.querySelectorAll('.reveal-scale').forEach(el => io.observe(el));
};

/* ═══ 4 · MY REVIEW (pending state) ═══ */
const loadMyReview = async () => {
  const { data } = await sb
    .from('reviews')
    .select('id, course, rating, review, approved')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  myReview = data || null;
  const note = document.getElementById('reviewPending');
  const writeBtn = document.getElementById('reviewWriteBtn');

  if (myReview) {
    writeBtn.textContent = 'Edit my review';
    if (note) {
      note.hidden = myReview.approved;
      note.textContent = myReview.approved
        ? ''
        : 'Thanks! Your review is waiting for approval — it will appear here soon.';
    }
  } else {
    writeBtn.textContent = 'Write a review';
    if (note) note.hidden = true;
  }
};

/* ═══ 5 · FORM ═══ */
const buildCourseOptions = () => {
  const sel = document.getElementById('reviewCourse');
  if (!sel) return;
  sel.innerHTML = `<option value="" disabled selected>Choose the course you took…</option>` +
    COURSES.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
};

let chosenRating = 0;
const wireStarInput = () => {
  const wrap = document.getElementById('starInput');
  if (!wrap) return;
  wrap.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<button type="button" class="star-btn" data-v="${i + 1}" aria-label="${i + 1} star">★</button>`).join('');

  const paint = n => wrap.querySelectorAll('.star-btn')
    .forEach((b, i) => b.classList.toggle('on', i < n));

  wrap.addEventListener('click', e => {
    const b = e.target.closest('.star-btn');
    if (!b) return;
    chosenRating = +b.dataset.v;
    paint(chosenRating);
  });
  wrap.addEventListener('mouseover', e => {
    const b = e.target.closest('.star-btn');
    if (b) paint(+b.dataset.v);
  });
  wrap.addEventListener('mouseleave', () => paint(chosenRating));
};

const openReviewModal = () => {
  if (!currentUser) return signIn();
  const m = document.getElementById('reviewModal');
  if (myReview) {
    document.getElementById('reviewCourse').value = myReview.course;
    document.getElementById('reviewText').value = myReview.review;
    chosenRating = myReview.rating;
    document.querySelectorAll('#starInput .star-btn')
      .forEach((b, i) => b.classList.toggle('on', i < chosenRating));
  }
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
};

const closeReviewModal = () => {
  const m = document.getElementById('reviewModal');
  if (!m) return;
  m.classList.remove('active');
  document.body.style.overflow = '';
};

const submitReview = async e => {
  e.preventDefault();
  const course = document.getElementById('reviewCourse').value;
  const text = document.getElementById('reviewText').value.trim();
  const btn = document.getElementById('reviewSubmitBtn');

  if (!chosenRating) return toast('Please pick a star rating.', true);
  if (!course) return toast('Please choose your course.', true);
  if (text.length < 10) return toast('Please write at least 10 characters.', true);

  btn.disabled = true;
  btn.textContent = 'Sending…';

  const meta = currentUser.user_metadata || {};
  const row = {
    user_id: currentUser.id,
    name: meta.full_name || meta.name || currentUser.email,
    avatar_url: meta.avatar_url || null,
    email: currentUser.email,
    course, rating: chosenRating, review: text,
    approved: false,
  };

  const { error } = myReview
    ? await sb.from('reviews').update(row).eq('user_id', currentUser.id)
    : await sb.from('reviews').insert(row);

  btn.disabled = false;
  btn.textContent = 'Submit review';

  if (error) {
    toast('Could not save: ' + error.message, true);
    return;
  }
  closeReviewModal();
  toast('Thank you! Your review was sent for approval.');
  await loadMyReview();
};

const wireFormEvents = () => {
  const login = document.getElementById('reviewLoginBtn');
  const write = document.getElementById('reviewWriteBtn');
  const form = document.getElementById('reviewForm');
  const close = document.getElementById('reviewModalClose');
  const overlay = document.getElementById('reviewModal');

  if (login) login.onclick = () => (isConfigured() ? signIn() : showDemoMode(true));
  if (write) write.onclick = openReviewModal;
  if (form) form.onsubmit = submitReview;
  if (close) close.onclick = closeReviewModal;
  if (overlay) overlay.addEventListener('click', e => {
    if (e.target === overlay) closeReviewModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeReviewModal();
  });
};

/* ═══ 6 · TOAST ═══ */
const toast = (msg, isError = false) => {
  let t = document.getElementById('reviewToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'reviewToast';
    t.className = 'review-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 4000);
};

/* ═══ 7 · DEMO MODE (before Supabase keys are added) ═══ */
const showDemoMode = (clicked = false) => {
  const grid = document.getElementById('reviewGrid');
  const day = 864e5;
  const sample = [
    { name: 'Praveen K', course: 'CATIA V5', rating: 5, created_at: new Date(Date.now() - 7 * day).toISOString(),
      review: 'Senthil sir teaches CATIA the way industry actually uses it. The BIW door panel project alone taught me more than a semester of theory — I cracked my design interview because of it.' },
    { name: 'Divya R', course: 'SolidWorks', rating: 5, created_at: new Date(Date.now() - 18 * day).toISOString(),
      review: 'We engaged him for a corporate SolidWorks batch of 24 engineers. Structured, patient, and every session ended with a working model. Feedback scores were the highest we have recorded.' },
    { name: 'Mohamed Arif', course: 'AWS Cloud', rating: 5, created_at: new Date(Date.now() - 26 * day).toISOString(),
      review: 'From AutoCAD basics to AWS Cloud Foundations, his training is completely hands-on. He does not move forward until every student can do it themselves. Highly recommended.' },
    { name: 'Karthika S', course: 'AutoCAD', rating: 5, created_at: new Date(Date.now() - 34 * day).toISOString(),
      review: 'I joined with zero drafting knowledge. Within six weeks I was preparing full site drawings on my own. The way he breaks down each command with a real drawing makes it stick.' },
    { name: 'Vignesh M', course: 'BIW / Auto Body Design', rating: 5, created_at: new Date(Date.now() - 45 * day).toISOString(),
      review: 'The BIW module is genuinely industry level. Master sections, hemming, weld flanges — he explains why each feature exists on a real car, not just how to click it. Got placed in an automotive design firm.' },
    { name: 'Anitha P', course: 'Excel Expert', rating: 4, created_at: new Date(Date.now() - 58 * day).toISOString(),
      review: 'Very practical Excel sessions. Pivot tables, lookups and dashboards taught with actual company data. I automated a report that used to take me three hours every week.' },
    { name: 'Sathish Kumar', course: 'Creo', rating: 5, created_at: new Date(Date.now() - 67 * day).toISOString(),
      review: 'Switched from SolidWorks to Creo for a new job and was worried. He mapped every concept I already knew to the Creo way of doing it. Was productive at work within two weeks.' },
    { name: 'Nithya Balaji', course: 'Fusion 360', rating: 5, created_at: new Date(Date.now() - 79 * day).toISOString(),
      review: 'Loved that we designed and actually 3D printed our final part. Sketching, parametric modelling and assembly all covered clearly. He replies to doubts even after the course ended.' },
    { name: 'Rahul Dev', course: 'Reverse Engineering', rating: 4, created_at: new Date(Date.now() - 92 * day).toISOString(),
      review: 'Point cloud cleanup to a finished surface model — a workflow no college teaches. Sessions were a bit fast at the start but he re-explained everything patiently when we asked.' },
    { name: 'Sneha Ravi', course: 'Adobe Photoshop', rating: 5, created_at: new Date(Date.now() - 108 * day).toISOString(),
      review: 'Took this for product presentation work. Masking, retouching and rendering touch-ups explained simply for engineers who never used Photoshop. My design portfolio looks completely different now.' },
    { name: 'Ajay Krishnan', course: 'IoT', rating: 5, created_at: new Date(Date.now() - 124 * day).toISOString(),
      review: 'We built a working sensor dashboard end to end and pushed the data to the cloud. As a mechanical student I never thought I could do this. Excellent teaching, very approachable.' },
  ];
  renderReviews(sample);

  const note = document.getElementById('reviewPending');
  if (note) {
    note.hidden = false;
    note.innerHTML = 'Showing sample reviews — add your Supabase keys in <code>js/reviews.js</code> to accept real student reviews. See <strong>SETUP-SUPABASE.md</strong>.';
  }
  if (clicked) toast('Add your Supabase keys first — see SETUP-SUPABASE.md', true);
};

document.addEventListener('DOMContentLoaded', initReviews);
