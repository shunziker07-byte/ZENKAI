/* ---------------------------------------------------------------------
   Adaptateur de stockage local (localStorage), compatible navigateur.
   Même interface asynchrone (get/set/delete/list) utilisée par le reste
   du code, qui utilise déjà await un peu partout.
--------------------------------------------------------------------- */
const storage = {
  async get(key){
    const v = localStorage.getItem(key);
    return v !== null ? { key, value: v } : null;
  },
  async set(key, value){
    localStorage.setItem(key, value);
    return { key, value };
  },
  async delete(key){
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix){
    const keys = Object.keys(localStorage).filter(k => !prefix || k.startsWith(prefix));
    return { keys };
  }
};

/* ---------------------------------------------------------------------
   Chargement des icônes personnalisées (assets/icones/) avec repli
   automatique sur Material Symbols si le fichier est absent ou cassé.
   Chaque élément marqué data-icon-src="..." dans le HTML est rempli ici :
   on crée l'<img> en JS et on attache le listener d'erreur AVANT de fixer
   le src, pour ne jamais manquer l'événement 'error'.
--------------------------------------------------------------------- */
function loadIcon(wrap){
  const src = wrap.dataset.iconSrc;
  const fallbackGlyph = wrap.dataset.iconFallback || 'circle';
  const size = wrap.dataset.iconSize || '24';
  if(!src) return;
  const img = document.createElement('img');
  img.alt = '';
  img.draggable = false;
  img.style.width = size + 'px';
  img.style.height = size + 'px';
  img.style.objectFit = 'contain';
  img.style.display = 'block';
  img.addEventListener('error', () => {
    img.remove();
    wrap.classList.add('icon-fallback');
    const span = document.createElement('span');
    span.className = 'material-symbols-outlined';
    span.style.fontSize = size + 'px';
    span.style.lineHeight = '1';
    span.textContent = fallbackGlyph;
    wrap.appendChild(span);
  }, { once: true });
  img.src = src;
  wrap.appendChild(img);
}
function initIcons(){
  document.querySelectorAll('[data-icon-src]').forEach(wrap => {
    wrap.innerHTML = '';
    wrap.classList.remove('icon-fallback');
    loadIcon(wrap);
  });
}

/* ===================== STATE ===================== */
const now_ = new Date();
const TODAY = new Date(now_.getFullYear(), now_.getMonth(), now_.getDate());
let state = null;

function pad(n){ return String(n).padStart(2,'0'); }
function dstr(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function uid(){ return Math.random().toString(36).slice(2,9); }

function emptyState(account){
  return {
    user: { name: account.name, email: account.email, plan: 'Compte gratuit', memberSince: formatMemberSince(account.createdAt), initials: initialsOf(account.name) },
    settings: { platform: 'Crunchyroll', audioTrack: 'VOSTFR (Japonais)', hideSpoilers: true, autoReminders: true, theme: 'Fuchsia Noir' },
    watching: [
      { id: uid(), title: 'Solo Leveling', genre: 'Action, Fantasy', season: 'Saison 1', watched: 8, total: 12, status: 'recent', note: 'Ép. 9 récemment sorti' },
      { id: uid(), title: 'Frieren', genre: "Beyond Journey's End", season: '', watched: 23, total: 28, status: 'ok', note: 'Dernière diffusion suivie' },
      { id: uid(), title: 'Demon Slayer', genre: 'Hashira Training Arc', season: 'Arc 4', watched: 4, total: 8, status: 'late', note: "Disponible jusqu'à l'épisode 6", lateBy: 2 },
      { id: uid(), title: 'Kaiju No. 8', genre: 'Sci-Fi, Action', season: 'Saison 1', watched: 6, total: 12, status: 'ok', note: 'À jour avec la VF' }
    ],
    watchlist: [
      { id: uid(), title: 'Chainsaw Man', type: 'Anime', genre: 'Dark Fantasy, Action', note: '12 épisodes', priority: 3 },
      { id: uid(), title: 'Bleach: TYBW', type: 'Anime', genre: 'Shônen, Supernatural', note: 'Partie 3 en cours', priority: 2 },
      { id: uid(), title: 'Dune : Deuxième Partie', type: 'Film', genre: 'Science-fiction', note: '2h46', priority: 3 },
      { id: uid(), title: 'Arcane', type: 'Série', genre: 'Animation, Drame', note: 'Saison 2 · 9 ép.', priority: 1 }
    ],
    ranking: [
      { id: uid(), title: 'Attack on Titan', note: "L'Attaque des Titans · Chef-d'œuvre", score: 9.9, tier: 'S', eps: 'Terminé (100%)', tag: 'Recommandation S+' },
      { id: uid(), title: 'Hunter x Hunter (2011)', note: 'Arc Fourmis-Chimères légendaire', score: 9.7, tier: 'S', eps: '148 eps · Vu', tag: 'Indémodable' },
      { id: uid(), title: 'FMA: Brotherhood', note: 'Cohérence parfaite du lore', score: 9.6, tier: 'S', eps: '64 eps · Vu', tag: 'Pilier Shonen' },
      { id: uid(), title: 'Jujutsu Kaisen', note: 'Animation MAPPA magistrale', score: 9.3, tier: 'A', eps: 'Saison 2 incluse', tag: 'Arc Shibuya' },
      { id: uid(), title: 'Death Note', note: 'Duel intellectuel au sommet', score: 9.2, tier: 'A', eps: '37 eps · Vu', tag: 'Classique' },
      { id: uid(), title: 'Cyberpunk: Edgerunners', note: 'Claque visuelle Studio Trigger', score: 9.0, tier: 'A', eps: '10 eps · Vu', tag: 'Ost Mémorable' }
    ]
  };
}
function initialsOf(name){ const p = (name||'').trim().split(/\s+/).filter(Boolean); return (p.map(w=>w[0]).slice(0,2).join('') || '??').toUpperCase(); }
function formatMemberSince(dateStr){ try{ const d = new Date(dateStr+'T00:00:00'); return capitalize(d.toLocaleDateString('fr-FR',{month:'short', year:'numeric'})); }catch(e){ return ''; } }
function capitalize(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function simpleHash(str){ let h = 0; for(let i=0;i<str.length;i++){ h = (h<<5)-h + str.charCodeAt(i); h |= 0; } return 'h'+h; }
function posterGradient(seed){
  const g = ['linear-gradient(135deg,#ff4898,#392f17)','linear-gradient(135deg,#653e4a,#131318)','linear-gradient(135deg,#d6c5a2,#392f17)','linear-gradient(135deg,#8e004b,#131318)','linear-gradient(135deg,#5b3f47,#0e0e13)'];
  let h = 0; for(let i=0;i<seed.length;i++) h += seed.charCodeAt(i);
  return g[h % g.length];
}

/* ----- account / session storage (client-side demo auth, no real backend) ----- */
const ACCOUNTS_KEY = 'zenkai_accounts_v1';
const SESSION_KEY = 'zenkai_session_v1';
function stateKeyFor(email){ return 'zenkai_state__' + email; }
let currentEmail = null;

async function loadAccounts(){
  try{ const res = await storage.get(ACCOUNTS_KEY); if(res && res.value) return JSON.parse(res.value); }catch(e){}
  return [];
}
async function saveAccounts(accounts){
  try{ await storage.set(ACCOUNTS_KEY, JSON.stringify(accounts)); }catch(e){}
}
async function loadSession(){
  try{ const res = await storage.get(SESSION_KEY); if(res && res.value) return res.value; }catch(e){}
  return null;
}
async function saveSession(email){
  try{ if(email) await storage.set(SESSION_KEY, email); else await storage.delete(SESSION_KEY); }catch(e){}
}
async function loadUserState(email){
  try{ const res = await storage.get(stateKeyFor(email)); if(res && res.value) return JSON.parse(res.value); }catch(e){}
  return null;
}
async function saveState(){
  if(!currentEmail) return;
  try{ await storage.set(stateKeyFor(currentEmail), JSON.stringify(state)); }catch(e){ /* storage unavailable */ }
}
async function deleteUserState(email){
  try{ await storage.delete(stateKeyFor(email)); }catch(e){}
}

async function ensureDemoAccount(){
  const accounts = await loadAccounts();
  if(!accounts.find(a => a.email === 'demo@zenkai.app')){
    accounts.push({ name: 'Léa Parker', email: 'demo@zenkai.app', passwordHash: simpleHash('demo1234'), provider: 'email', createdAt: dstr(TODAY) });
    await saveAccounts(accounts);
  }
}

async function loginAs(account){
  currentEmail = account.email;
  await saveSession(currentEmail);
  const loaded = await loadUserState(currentEmail);
  state = loaded || emptyState(account);
  await saveState();
  showApp();
  setActivePage('home');
  toast(`Bienvenue, ${account.name.split(' ')[0]} !`);
}

async function logout(){
  await saveSession(null);
  currentEmail = null;
  state = null;
  showLogin();
}

function showApp(){
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-header').classList.remove('hidden');
  const mainEl = document.getElementById('app-main');
  mainEl.classList.remove('hidden'); mainEl.classList.add('flex');
  document.getElementById('app-nav').classList.remove('hidden');
}
function showLogin(){
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-header').classList.add('hidden');
  const mainEl = document.getElementById('app-main');
  mainEl.classList.add('hidden'); mainEl.classList.remove('flex');
  document.getElementById('app-nav').classList.add('hidden');
  setAuthMode('login');
  document.getElementById('auth-form').reset();
  hideAuthError();
}

/* ----- auth UI ----- */
let authMode = 'login';
function initAuthUI(){
  document.getElementById('tab-login').addEventListener('click', () => setAuthMode('login'));
  document.getElementById('tab-signup').addEventListener('click', () => setAuthMode('signup'));
  document.getElementById('toggle-pw').addEventListener('click', () => {
    const pw = document.getElementById('auth-password');
    const btn = document.getElementById('toggle-pw');
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    btn.querySelector('span').textContent = show ? 'visibility_off' : 'visibility';
  });
  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  document.getElementById('btn-google').addEventListener('click', handleGoogleAuth);
}
function setAuthMode(mode){
  authMode = mode;
  const loginTab = document.getElementById('tab-login');
  const signupTab = document.getElementById('tab-signup');
  loginTab.classList.toggle('bg-primary-container', mode==='login');
  loginTab.classList.toggle('text-on-primary-container', mode==='login');
  loginTab.classList.toggle('font-semibold', mode==='login');
  loginTab.classList.toggle('text-on-surface-variant', mode!=='login');
  signupTab.classList.toggle('bg-primary-container', mode==='signup');
  signupTab.classList.toggle('text-on-primary-container', mode==='signup');
  signupTab.classList.toggle('font-semibold', mode==='signup');
  signupTab.classList.toggle('text-on-surface-variant', mode!=='signup');
  document.getElementById('auth-name').classList.toggle('hidden', mode!=='signup');
  document.getElementById('auth-title').textContent = mode==='login' ? 'Bon retour' : 'Créer un compte';
  document.getElementById('auth-subtitle').textContent = mode==='login' ? 'Connecte-toi pour retrouver tes films, séries et animés.' : 'Crée ton compte pour centraliser tout ce que tu regardes.';
  document.getElementById('auth-submit').textContent = mode==='login' ? 'Se connecter' : 'Créer mon compte';
  hideAuthError();
}
function showAuthError(msg){ const e = document.getElementById('auth-error'); e.textContent = msg; e.classList.remove('hidden'); }
function hideAuthError(){ document.getElementById('auth-error').classList.add('hidden'); }

async function handleAuthSubmit(e){
  e.preventDefault();
  hideAuthError();
  const email = document.getElementById('auth-email').value.trim().toLowerCase();
  const password = document.getElementById('auth-password').value;
  const name = document.getElementById('auth-name').value.trim();
  if(!email || !password){ showAuthError('Merci de remplir tous les champs.'); return; }
  const accounts = await loadAccounts();
  if(authMode === 'signup'){
    if(!name){ showAuthError('Merci d\u2019indiquer ton nom.'); return; }
    if(password.length < 4){ showAuthError('Le mot de passe doit faire au moins 4 caractères.'); return; }
    if(accounts.find(a => a.email === email)){ showAuthError('Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.'); return; }
    const account = { name, email, passwordHash: simpleHash(password), provider: 'email', createdAt: dstr(TODAY) };
    accounts.push(account);
    await saveAccounts(accounts);
    await loginAs(account);
  } else {
    const account = accounts.find(a => a.email === email);
    if(!account || account.passwordHash !== simpleHash(password)){ showAuthError('E-mail ou mot de passe incorrect.'); return; }
    await loginAs(account);
  }
}

async function handleGoogleAuth(){
  openModal(`
    <div class="text-center py-2">
      <h3 class="font-headline-md text-headline-md text-on-surface mb-1">Connexion Google</h3>
      <p class="font-body-md text-body-md text-on-surface-variant mb-4">Aucune vraie authentification Google n'est reliée à ce prototype : indique le nom et l'e-mail du compte à utiliser pour simuler la connexion.</p>
      <div class="flex flex-col gap-3 text-left">
        <input id="g-auth-name" type="text" placeholder="Nom complet" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"/>
        <input id="g-auth-email" type="email" placeholder="prenom.nom@gmail.com" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"/>
      </div>
      <button id="g-auth-confirm" class="mt-4 w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md font-semibold active:scale-[0.98] transition-all">Continuer</button>
    </div>
  `);
  document.getElementById('g-auth-confirm').addEventListener('click', async () => {
    const name = document.getElementById('g-auth-name').value.trim();
    const email = document.getElementById('g-auth-email').value.trim().toLowerCase();
    if(!name || !email){ toast('Nom et e-mail requis'); return; }
    const accounts = await loadAccounts();
    let account = accounts.find(a => a.email === email);
    if(!account){
      account = { name, email, passwordHash: null, provider: 'google', createdAt: dstr(TODAY) };
      accounts.push(account);
      await saveAccounts(accounts);
    }
    closeModal();
    await loginAs(account);
  });
}

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('opacity-0'); t.classList.add('opacity-100');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>{ t.classList.add('opacity-0'); t.classList.remove('opacity-100'); }, 1800);
}

/* ===================== NAV ===================== */
const PAGE_TITLES = { home: 'Home', actually: 'Actually', watchlist: 'Watchlist', ranking: 'Ranking', settings: 'Settings' };
let currentPage = 'home';

function setActivePage(page){
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[page];
  document.querySelectorAll('.nav-btn').forEach(b => {
    const active = b.dataset.nav === page;
    b.classList.toggle('text-primary', active);
    b.classList.toggle('font-bold', active);
    b.classList.toggle('text-on-surface-variant', !active);
    b.querySelector('.nav-dot').classList.toggle('opacity-100', active);
  });
  renderCurrentPage();
  window.scrollTo(0,0);
}
document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => setActivePage(b.dataset.nav)));
document.getElementById('btn-profile').addEventListener('click', () => setActivePage('settings'));

function renderCurrentPage(){
  if(currentPage === 'home') renderHome();
  else if(currentPage === 'actually') renderActually();
  else if(currentPage === 'watchlist') renderWatchlist();
  else if(currentPage === 'ranking') renderRanking();
  else if(currentPage === 'settings') renderSettings();
}

/* ===================== MODAL ===================== */
function openModal(html){
  document.getElementById('modal-panel').innerHTML = html;
  document.getElementById('modal-backdrop').classList.add('active');
}
function closeModal(){
  document.getElementById('modal-backdrop').classList.remove('active');
}
document.getElementById('modal-backdrop').addEventListener('click', (e)=>{
  if(e.target.id === 'modal-backdrop') closeModal();
});

/* ===================== HOME ===================== */
function renderHome(){
  const totalEpisodes = state.watching.reduce((sum, w) => sum + w.watched, 0);
  const continueItem = state.watching[0];
  const toCatchUp = state.watching.filter(w => w.status !== 'ok').slice(0, 2);
  const trending = state.watchlist.slice(0, 2);
  const dateFmt = TODAY.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase();

  const el = document.getElementById('page-home');
  el.innerHTML = `
    <div class="flex items-center justify-between pt-2 pb-1">
      <span class="font-label-sm text-label-sm text-primary font-bold flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>${dateFmt}</span>
      <span class="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">${state.watching.length} en cours</span>
    </div>
    <h1 class="font-display text-display text-on-surface mt-1">Bonjour, ${state.user.name.split(' ')[0]}</h1>
    <p class="font-body-lg text-body-lg text-on-surface-variant mt-1 mb-5">Prêt(e) pour ton marathon du soir ?</p>

    <div class="rounded-[20px] bg-surface-container p-card-padding border border-white/[0.06]">
      <div class="flex items-start justify-between">
        <div>
          <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider">RYTHME DE VISIONNAGE</span>
          <div class="flex items-baseline gap-1.5 mt-1">
            <span class="font-display text-display text-on-surface">${totalEpisodes}</span>
            <span class="font-headline-md text-headline-md text-on-surface-variant">épisodes</span>
          </div>
        </div>
        <div class="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-primary text-[22px]">bolt</span>
        </div>
      </div>
      <div class="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center">
        <div><span class="font-label-sm text-label-sm text-on-surface-variant block mb-0.5">En cours</span><span class="font-headline-md text-headline-md text-on-surface font-bold">${state.watching.length}</span></div>
        <div><span class="font-label-sm text-label-sm text-on-surface-variant block mb-0.5">Watchlist</span><span class="font-headline-md text-headline-md text-primary font-bold">${state.watchlist.length}</span></div>
        <div><span class="font-label-sm text-label-sm text-on-surface-variant block mb-0.5">Notés</span><span class="font-headline-md text-headline-md text-on-surface font-bold">${state.ranking.length}</span></div>
      </div>
    </div>

    <div class="flex items-center justify-between mt-6 mb-2">
      <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider">REPRENDRE LA LECTURE</span>
      <button data-nav-to="actually" class="font-label-sm text-label-sm text-primary">Tout voir</button>
    </div>
    ${continueItem ? `
    <div class="rounded-[20px] overflow-hidden bg-surface-container-high border border-primary/25 shadow-[0_0_24px_rgba(255,31,143,0.08)]">
      <div class="poster h-32" style="background:${posterGradient(continueItem.title)}"><span>${continueItem.genre}</span></div>
      <div class="p-card-padding">
        <h3 class="font-headline-md text-headline-md text-on-surface">${continueItem.title}</h3>
        <p class="font-label-md text-label-md text-on-surface-variant mt-0.5">Épisode ${continueItem.watched} / ${continueItem.total}</p>
        <div class="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden mt-2.5">
          <div class="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style="width:${Math.round(continueItem.watched/continueItem.total*100)}%"></div>
        </div>
        <div class="flex gap-2 mt-4">
          <button data-action="inc-episode" data-id="${continueItem.id}" class="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-body-md text-body-md font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"><span class="material-symbols-outlined text-[18px]">play_arrow</span>Continuer</button>
          <button data-nav-to="actually" class="w-11 h-11 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center active:scale-95 transition-transform"><span class="material-symbols-outlined text-[18px]">info</span></button>
        </div>
      </div>
    </div>` : `
    <div class="rounded-[20px] bg-surface-container p-card-padding text-center">
      <p class="font-body-md text-body-md text-on-surface-variant mb-3">Rien en cours pour l'instant.</p>
      <button data-nav-to="watchlist" class="px-4 py-2 rounded-xl bg-primary text-on-primary font-body-md text-body-md font-semibold inline-flex items-center gap-1.5"><span class="material-symbols-outlined text-[16px]">add</span>Voir ma watchlist</button>
    </div>`}

    <div class="grid grid-cols-3 gap-2.5 mt-5">
      <button data-nav-to="actually" class="quick-nav rounded-2xl bg-surface-container p-3 flex flex-col gap-2 active:scale-95 transition-transform text-left">
        <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-primary"><span class="material-symbols-outlined text-[18px]">play_circle</span></div>
        <span class="font-label-sm text-label-sm text-on-surface-variant">Actually</span>
        <span class="font-headline-md text-headline-md text-on-surface leading-tight">${state.watching.length} titres</span>
      </button>
      <button data-nav-to="watchlist" class="quick-nav rounded-2xl bg-surface-container p-3 flex flex-col gap-2 active:scale-95 transition-transform text-left">
        <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-tertiary"><span class="material-symbols-outlined text-[18px]">bookmark</span></div>
        <span class="font-label-sm text-label-sm text-on-surface-variant">Watchlist</span>
        <span class="font-headline-md text-headline-md text-on-surface leading-tight">${state.watchlist.length} titres</span>
      </button>
      <button data-nav-to="ranking" class="quick-nav rounded-2xl bg-surface-container p-3 flex flex-col gap-2 active:scale-95 transition-transform text-left">
        <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-secondary"><span class="material-symbols-outlined text-[18px]">emoji_events</span></div>
        <span class="font-label-sm text-label-sm text-on-surface-variant">Ranking</span>
        <span class="font-headline-md text-headline-md text-on-surface leading-tight">${state.ranking.length} notés</span>
      </button>
    </div>

    <div class="flex items-center justify-between mt-6 mb-2">
      <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider">À RATTRAPER</span>
      ${toCatchUp.length ? `<button data-nav-to="actually" class="font-label-sm text-label-sm text-primary">Voir tout</button>` : ''}
    </div>
    ${toCatchUp.length === 0 ? `
    <div class="rounded-2xl bg-surface-container p-4 text-center">
      <p class="font-label-sm text-label-sm text-on-surface-variant">Tout est à jour, bravo !</p>
    </div>` : `
    <div class="flex flex-col gap-2.5">
      ${toCatchUp.map(w => `
      <div class="rounded-2xl bg-surface-container p-3.5 flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl poster shrink-0" style="background:${posterGradient(w.title)}"></div>
        <div class="min-w-0 flex-1">
          <p class="font-body-md text-body-md text-on-surface truncate">${w.title}</p>
          <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">${w.note}</p>
        </div>
        <span class="px-2 py-0.5 rounded-full ${w.status==='late' ? 'bg-error-container/25 text-error' : 'bg-surface-container-high text-on-surface-variant'} font-label-sm text-label-sm shrink-0">${w.status==='late' ? (w.lateBy+' en retard') : 'récent'}</span>
      </div>`).join('')}
    </div>`}

    <div class="flex items-center justify-between mt-6 mb-2">
      <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider">TENDANCES DE TA WATCHLIST</span>
      <button data-nav-to="watchlist" class="font-label-sm text-label-sm text-primary">Explorer</button>
    </div>
    <div class="grid grid-cols-2 gap-2.5">
      ${trending.map(t => `
      <div class="rounded-2xl overflow-hidden bg-surface-container">
        <div class="poster h-24" style="background:${posterGradient(t.title)}"><span>${t.type}</span></div>
        <div class="p-2.5">
          <p class="font-label-md text-label-md text-on-surface truncate">${t.title}</p>
          <p class="font-label-sm text-label-sm text-on-surface-variant truncate">${t.genre}</p>
        </div>
      </div>`).join('')}
    </div>

    <div class="mt-6 rounded-2xl bg-surface-container-low p-3.5 flex items-start gap-3">
      <div class="w-8 h-8 rounded-full bg-tertiary-container/30 flex items-center justify-center text-tertiary shrink-0"><span class="material-symbols-outlined text-[16px]">auto_awesome</span></div>
      <div>
        <p class="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">Conseil ZENKAI <span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span></p>
        <p class="font-body-md text-body-md text-on-surface-variant mt-0.5">${continueItem ? `Termine ${continueItem.title} avant la sortie du prochain épisode.` : 'Ajoute un titre à ta watchlist pour commencer ton marathon.'}</p>
      </div>
    </div>
  `;

  el.querySelectorAll('[data-nav-to]').forEach(b => b.addEventListener('click', () => setActivePage(b.dataset.navTo)));
  el.querySelectorAll('[data-action="inc-episode"]').forEach(b => b.addEventListener('click', () => incrementEpisode(b.dataset.id)));
}

function incrementEpisode(id){
  const w = state.watching.find(w => w.id === id);
  if(!w) return;
  if(w.watched < w.total) w.watched++;
  if(w.watched >= w.total) w.status = 'ok';
  saveState();
  renderCurrentPage();
  toast(`+1 épisode — ${w.title} (${w.watched}/${w.total})`);
}

/* ===================== ACTUALLY ===================== */
let actuallyStatusFilter = 'toutes';
let actuallySearch = '';

function renderActually(){
  const el = document.getElementById('page-actually');
  const lateCount = state.watching.filter(w => w.status === 'late').length;

  let list = state.watching;
  if(actuallyStatusFilter === 'ok') list = list.filter(w => w.status === 'ok');
  else if(actuallyStatusFilter === 'late') list = list.filter(w => w.status === 'late');
  if(actuallySearch) list = list.filter(w => w.title.toLowerCase().includes(actuallySearch.toLowerCase()));

  el.innerHTML = `
    <div class="pt-2">
      <h1 class="font-headline-lg text-headline-lg text-on-surface">En cours de visionnage</h1>
      <p class="font-body-lg text-body-lg text-on-surface-variant mt-1">Gère tes séries actives et suis les sorties.</p>
    </div>

    <div class="mt-4 rounded-2xl bg-surface-container p-3.5 flex items-center gap-2.5">
      <span class="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
      <input id="actually-search" type="text" value="${actuallySearch}" placeholder="Rechercher parmi tes visionnages..." class="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant"/>
    </div>

    <div class="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
      ${[['toutes','Tous les statuts'],['ok','À jour'],['late',`En retard (${lateCount})`]].map(([k,label]) => `
        <button data-status="${k}" class="status-tab px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${actuallyStatusFilter===k ? 'bg-surface-container-highest text-on-surface font-semibold' : 'bg-surface-container text-on-surface-variant'}">${label}</button>
      `).join('')}
    </div>

    <div class="flex flex-col gap-2.5 mt-5" id="watching-list">
      ${list.length === 0 ? `<div class="rounded-2xl bg-surface-container p-6 text-center"><p class="font-body-md text-body-md text-on-surface-variant">Aucun résultat.</p></div>` : list.map(w => renderWatchingCard(w)).join('')}
    </div>

    <button id="btn-add-watching" class="mt-6 w-full py-3.5 rounded-xl bg-surface-container-high text-on-surface font-headline-md text-headline-md font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
      <span class="material-symbols-outlined text-[22px]">add</span><span>Ajouter un titre en cours</span>
    </button>
  `;

  el.querySelector('#actually-search').addEventListener('input', (e) => { actuallySearch = e.target.value; renderActually(); const inp = document.getElementById('actually-search'); if(inp){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } });
  el.querySelectorAll('.status-tab').forEach(b => b.addEventListener('click', () => { actuallyStatusFilter = b.dataset.status; renderActually(); }));
  el.querySelectorAll('[data-action="inc-episode"]').forEach(b => b.addEventListener('click', () => incrementEpisode(b.dataset.id)));
  el.querySelectorAll('[data-action="remove-watching"]').forEach(b => b.addEventListener('click', () => {
    state.watching = state.watching.filter(w => w.id !== b.dataset.id);
    saveState(); renderActually(); toast('Titre retiré de Actually');
  }));
  el.querySelector('#btn-add-watching').addEventListener('click', openAddWatchingModal);
}

function renderWatchingCard(w){
  const pct = Math.round(w.watched / w.total * 100);
  const badge = w.status === 'late'
    ? `<span class="px-2 py-0.5 rounded-full bg-error-container/25 text-error font-label-sm text-label-sm font-semibold shrink-0">${w.lateBy} en retard</span>`
    : w.status === 'recent'
      ? `<span class="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-sm text-label-sm font-semibold shrink-0">récent</span>`
      : `<span class="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm font-semibold shrink-0">À jour</span>`;
  return `
  <div class="rounded-2xl bg-surface-container overflow-hidden">
    <div class="flex gap-3 p-card-padding">
      <div class="w-14 h-20 rounded-xl poster shrink-0" style="background:${posterGradient(w.title)}"><span>${w.season||''}</span></div>
      <div class="min-w-0 flex-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-headline-md text-headline-md text-on-surface truncate">${w.title}</h3>
          ${badge}
        </div>
        <p class="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">${w.genre}</p>
        <p class="font-label-sm text-label-sm text-on-surface-variant truncate mt-0.5">${w.note}</p>
        <div class="flex items-center justify-between mt-2 mb-1">
          <span class="font-label-sm text-label-sm text-on-surface-variant">Ép. ${w.watched} / ${w.total}</span>
        </div>
        <div class="h-1.5 w-full rounded-full bg-surface-container-highest overflow-hidden">
          <div class="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style="width:${pct}%"></div>
        </div>
      </div>
    </div>
    <div class="flex gap-2 px-card-padding pb-card-padding">
      <button data-action="inc-episode" data-id="${w.id}" class="flex-1 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-body-md text-body-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform"><span class="material-symbols-outlined text-[16px]">add</span>+1 Épisode</button>
      <button data-action="remove-watching" data-id="${w.id}" class="w-11 h-11 rounded-xl flex items-center justify-center text-error active:scale-95 transition-transform"><span class="material-symbols-outlined text-[18px]">delete</span></button>
    </div>
  </div>`;
}

function openAddWatchingModal(){
  openModal(`
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-headline-lg text-headline-lg text-on-surface">Ajouter un titre en cours</h3>
      <button data-action="close" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">close</span></button>
    </div>
    <div class="flex flex-col gap-3">
      <input id="w-title" type="text" placeholder="Titre" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"/>
      <input id="w-genre" type="text" placeholder="Genre / note" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"/>
      <div class="flex gap-3">
        <input id="w-watched" type="number" min="0" value="0" placeholder="Épisodes vus" class="flex-1 bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface focus:border-primary"/>
        <input id="w-total" type="number" min="1" value="12" placeholder="Total" class="flex-1 bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface focus:border-primary"/>
      </div>
      <button id="btn-save-watching" class="mt-2 w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md font-semibold active:scale-[0.98] transition-all">Ajouter</button>
    </div>
  `);
  document.querySelector('[data-action="close"]').addEventListener('click', closeModal);
  document.getElementById('btn-save-watching').addEventListener('click', () => {
    const title = document.getElementById('w-title').value.trim();
    if(!title){ toast('Ajoute un titre'); return; }
    const genre = document.getElementById('w-genre').value.trim() || 'Sans genre';
    const watched = parseInt(document.getElementById('w-watched').value,10) || 0;
    const total = Math.max(parseInt(document.getElementById('w-total').value,10) || 1, watched);
    state.watching.unshift({ id: uid(), title, genre, season: '', watched, total, status: 'ok', note: 'Ajouté manuellement' });
    saveState(); closeModal(); renderActually(); toast(`${title} ajouté à Actually`);
  });
}

/* ===================== WATCHLIST ===================== */
let watchlistTypeFilter = 'Tous';
let watchlistSearch = '';

function renderWatchlist(){
  const el = document.getElementById('page-watchlist');
  const types = ['Tous', 'Anime', 'Série', 'Film'];

  let list = state.watchlist.slice().sort((a,b) => b.priority - a.priority);
  if(watchlistTypeFilter !== 'Tous') list = list.filter(t => t.type === watchlistTypeFilter);
  if(watchlistSearch) list = list.filter(t => t.title.toLowerCase().includes(watchlistSearch.toLowerCase()));

  el.innerHTML = `
    <div class="pt-2">
      <h1 class="font-headline-lg text-headline-lg text-on-surface">Ta watchlist</h1>
      <p class="font-body-lg text-body-lg text-on-surface-variant mt-1">Tout ce que tu as envie de voir, films, séries et animés confondus.</p>
    </div>

    <div class="mt-4 rounded-2xl bg-surface-container p-3.5 flex items-center gap-2.5">
      <span class="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
      <input id="watchlist-search" type="text" value="${watchlistSearch}" placeholder="Rechercher dans ta watchlist..." class="flex-1 bg-transparent outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant"/>
    </div>

    <div class="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
      ${types.map(t => `<button data-type="${t}" class="type-tab px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${watchlistTypeFilter===t ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container text-on-surface-variant'}">${t}</button>`).join('')}
    </div>

    <div class="grid grid-cols-2 gap-2.5 mt-5" id="watchlist-grid">
      ${list.length === 0 ? `<div class="col-span-2 rounded-2xl bg-surface-container p-6 text-center"><p class="font-body-md text-body-md text-on-surface-variant">Aucun résultat.</p></div>` : list.map(t => renderWatchlistCard(t)).join('')}
    </div>

    <button id="btn-add-watchlist" class="mt-6 w-full py-3.5 rounded-xl bg-surface-container-high text-on-surface font-headline-md text-headline-md font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
      <span class="material-symbols-outlined text-[22px]">add</span><span>Ajouter à la watchlist</span>
    </button>
  `;

  el.querySelector('#watchlist-search').addEventListener('input', (e) => { watchlistSearch = e.target.value; renderWatchlist(); const inp = document.getElementById('watchlist-search'); if(inp){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } });
  el.querySelectorAll('.type-tab').forEach(b => b.addEventListener('click', () => { watchlistTypeFilter = b.dataset.type; renderWatchlist(); }));
  el.querySelectorAll('[data-action="start-watching"]').forEach(b => b.addEventListener('click', () => startWatching(b.dataset.id)));
  el.querySelectorAll('[data-action="remove-watchlist"]').forEach(b => b.addEventListener('click', () => {
    state.watchlist = state.watchlist.filter(t => t.id !== b.dataset.id);
    saveState(); renderWatchlist(); toast('Titre retiré de la watchlist');
  }));
  el.querySelector('#btn-add-watchlist').addEventListener('click', openAddWatchlistModal);
}

function renderWatchlistCard(t){
  const stars = Array.from({length:3},(_,i) => `<span class="material-symbols-outlined text-[13px] ${i < t.priority ? 'text-tertiary' : 'text-outline-variant'}">star</span>`).join('');
  return `
  <div class="rounded-2xl overflow-hidden bg-surface-container flex flex-col">
    <div class="poster h-28" style="background:${posterGradient(t.title)}"><span>${t.type}</span></div>
    <div class="p-3 flex-1 flex flex-col">
      <p class="font-label-md text-label-md text-on-surface truncate">${t.title}</p>
      <p class="font-label-sm text-label-sm text-on-surface-variant truncate">${t.genre}</p>
      <div class="flex items-center gap-0.5 mt-1">${stars}</div>
      <div class="flex gap-1.5 mt-2">
        <button data-action="start-watching" data-id="${t.id}" class="flex-1 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1 active:scale-95 transition-transform"><span class="material-symbols-outlined text-[14px]">play_arrow</span>Commencer</button>
        <button data-action="remove-watchlist" data-id="${t.id}" class="w-8 h-8 rounded-lg flex items-center justify-center text-error shrink-0 active:scale-95 transition-transform"><span class="material-symbols-outlined text-[15px]">close</span></button>
      </div>
    </div>
  </div>`;
}

function openAddWatchlistModal(){
  openModal(`
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-headline-lg text-headline-lg text-on-surface">Ajouter à la watchlist</h3>
      <button data-action="close" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">close</span></button>
    </div>
    <div class="flex flex-col gap-3">
      <input id="l-title" type="text" placeholder="Titre" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"/>
      <select id="l-type" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface focus:border-primary">
        <option value="Anime">Animé</option>
        <option value="Série">Série</option>
        <option value="Film">Film</option>
      </select>
      <input id="l-genre" type="text" placeholder="Genre / note" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"/>
      <button id="btn-save-watchlist" class="mt-2 w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md font-semibold active:scale-[0.98] transition-all">Ajouter</button>
    </div>
  `);
  document.querySelector('[data-action="close"]').addEventListener('click', closeModal);
  document.getElementById('btn-save-watchlist').addEventListener('click', () => {
    const title = document.getElementById('l-title').value.trim();
    if(!title){ toast('Ajoute un titre'); return; }
    const type = document.getElementById('l-type').value;
    const genre = document.getElementById('l-genre').value.trim() || 'Genre non précisé';
    state.watchlist.unshift({ id: uid(), title, type, genre, note: 'Ajouté manuellement', priority: 2 });
    saveState(); closeModal(); renderWatchlist(); toast(`${title} ajouté à ta watchlist`);
  });
}

function startWatching(id){
  const idx = state.watchlist.findIndex(t => t.id === id);
  if(idx === -1) return;
  const [item] = state.watchlist.splice(idx, 1);
  state.watching.unshift({ id: uid(), title: item.title, genre: item.genre, season: '', watched: 0, total: 12, status: 'ok', note: 'Tout juste commencé' });
  saveState(); renderWatchlist(); toast(`${item.title} déplacé vers Actually`);
}

/* ===================== RANKING ===================== */
function renderRanking(){
  const el = document.getElementById('page-ranking');
  const sorted = state.ranking.slice().sort((a,b) => b.score - a.score);
  const avg = (state.ranking.reduce((s,r) => s + r.score, 0) / Math.max(1, state.ranking.length)).toFixed(2);
  const tierCounts = { S:0, A:0, B:0 };
  state.ranking.forEach(r => { if(tierCounts[r.tier] !== undefined) tierCounts[r.tier]++; });
  const total = state.ranking.length || 1;

  el.innerHTML = `
    <div class="pt-2">
      <span class="font-label-sm text-label-sm text-primary font-bold flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>PANTHÉON OTAKU</span>
      <h1 class="font-headline-lg text-headline-lg text-on-surface mt-1">Mon classement</h1>
      <p class="font-body-lg text-body-lg text-on-surface-variant mt-1">Ton panthéon personnel noté sur 10.</p>
    </div>

    <div class="mt-5 rounded-[20px] bg-surface-container p-card-padding border border-white/[0.06]">
      <div class="flex items-end justify-between">
        <div>
          <span class="font-label-sm text-label-sm text-on-surface-variant tracking-wider">MOYENNE GLOBALE</span>
          <div class="flex items-baseline gap-1.5 mt-1">
            <span class="font-display text-display text-primary">${avg}</span>
            <span class="font-headline-md text-headline-md text-on-surface-variant">/10</span>
          </div>
        </div>
        <span class="px-2.5 py-1 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm font-semibold">Tier Élite</span>
      </div>
      <div class="mt-4 flex flex-col gap-2">
        ${['S','A','B'].map(tier => {
          const count = tierCounts[tier]; const pct = Math.round(count/total*100);
          return `
          <div class="flex items-center gap-2.5">
            <span class="font-label-sm text-label-sm text-on-surface-variant w-14 shrink-0">Tier ${tier}</span>
            <div class="h-1.5 flex-1 rounded-full bg-surface-container-highest overflow-hidden"><div class="h-full rounded-full ${tier==='S' ? 'bg-gradient-to-r from-tertiary to-tertiary-fixed' : 'bg-gradient-to-r from-primary to-secondary'}" style="width:${pct}%"></div></div>
            <span class="font-label-sm text-label-sm text-on-surface w-6 text-right shrink-0">${count}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <button id="btn-add-ranking" class="mt-5 w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
      <span class="material-symbols-outlined text-[22px]">add</span><span>Noter un nouveau titre</span>
    </button>

    <div class="flex flex-col gap-2.5 mt-6" id="ranking-list">
      ${sorted.length === 0 ? `<div class="rounded-2xl bg-surface-container p-6 text-center"><p class="font-body-md text-body-md text-on-surface-variant">Aucun titre noté pour l'instant.</p></div>` : sorted.map((r,i) => renderRankingRow(r, i+1)).join('')}
    </div>
  `;

  el.querySelector('#btn-add-ranking').addEventListener('click', openAddRankingModal);
  el.querySelectorAll('[data-action="remove-ranking"]').forEach(b => b.addEventListener('click', () => {
    state.ranking = state.ranking.filter(r => r.id !== b.dataset.id);
    saveState(); renderRanking(); toast('Titre retiré du classement');
  }));
}

function renderRankingRow(r, rank){
  return `
  <div class="rounded-2xl bg-surface-container p-3.5 flex items-center gap-3">
    <div class="w-12 h-12 rounded-xl poster shrink-0 flex items-center justify-center" style="background:${posterGradient(r.title)}"><span>#${rank}</span></div>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm font-semibold">Tier ${r.tier}</span>
        <span class="font-label-sm text-label-sm text-on-surface-variant truncate">${r.tag}</span>
      </div>
      <h3 class="font-headline-md text-headline-md text-on-surface truncate">${r.title}</h3>
      <p class="font-label-sm text-label-sm text-on-surface-variant truncate">${r.note} · ${r.eps}</p>
    </div>
    <div class="text-right shrink-0">
      <div class="font-headline-md text-headline-md text-primary">${r.score}<span class="text-label-sm text-on-surface-variant">/10</span></div>
      <button data-action="remove-ranking" data-id="${r.id}" class="font-label-sm text-label-sm text-error">Retirer</button>
    </div>
  </div>`;
}

function openAddRankingModal(){
  openModal(`
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-headline-lg text-headline-lg text-on-surface">Noter un nouveau titre</h3>
      <button data-action="close" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">close</span></button>
    </div>
    <div class="flex flex-col gap-3">
      <input id="r-title" type="text" placeholder="Titre" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"/>
      <input id="r-score" type="number" min="0" max="10" step="0.1" value="8.0" placeholder="Note sur 10" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface focus:border-primary"/>
      <input id="r-note" type="text" placeholder="Commentaire" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary"/>
      <button id="btn-save-ranking" class="mt-2 w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md font-semibold active:scale-[0.98] transition-all">Ajouter au classement</button>
    </div>
  `);
  document.querySelector('[data-action="close"]').addEventListener('click', closeModal);
  document.getElementById('btn-save-ranking').addEventListener('click', () => {
    const title = document.getElementById('r-title').value.trim();
    if(!title){ toast('Ajoute un titre'); return; }
    let score = parseFloat(document.getElementById('r-score').value);
    if(isNaN(score)) score = 8;
    score = Math.max(0, Math.min(10, score));
    const note = document.getElementById('r-note').value.trim() || 'Nouvelle entrée';
    const tier = score >= 9 ? 'S' : score >= 7.5 ? 'A' : 'B';
    state.ranking.push({ id: uid(), title, note, score, tier, eps: 'Vu', tag: 'Ajout perso' });
    saveState(); closeModal(); renderRanking(); toast(`${title} ajouté à ton classement`);
  });
}

/* ===================== SETTINGS ===================== */
function renderSettings(){
  const el = document.getElementById('page-settings');
  const totalEpisodes = state.watching.reduce((sum, w) => sum + w.watched, 0);

  el.innerHTML = `
    <div class="pt-2 rounded-[20px] bg-gradient-to-br from-primary-container/25 to-surface-container p-card-padding flex items-center gap-3.5">
      <div class="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center font-headline-md text-headline-md text-primary font-bold shrink-0">${state.user.initials}</div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-headline-md text-headline-md text-on-surface truncate">${state.user.name}</p>
          <span class="px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold">${state.user.plan}</span>
        </div>
        <p class="font-body-md text-body-md text-on-surface-variant truncate">${state.user.email}</p>
        <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5 flex items-center gap-1"><span class="material-symbols-outlined text-[13px]">verified</span>Membre depuis ${state.user.memberSince}</p>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2.5 mt-5">
      <div class="rounded-xl bg-surface-container p-2.5 text-center"><span class="font-label-sm text-label-sm text-on-surface-variant block">Épisodes</span><span class="font-headline-md text-headline-md text-on-surface">${totalEpisodes}</span></div>
      <div class="rounded-xl bg-surface-container p-2.5 text-center"><span class="font-label-sm text-label-sm text-on-surface-variant block">Notés</span><span class="font-headline-md text-headline-md text-on-surface">${state.ranking.length}</span></div>
      <div class="rounded-xl bg-surface-container p-2.5 text-center"><span class="font-label-sm text-label-sm text-on-surface-variant block">Watchlist</span><span class="font-headline-md text-headline-md text-on-surface">${state.watchlist.length}</span></div>
    </div>

    <span class="font-label-sm text-label-sm text-primary tracking-wider mt-6 mb-2 flex items-center gap-1.5"><span class="material-symbols-outlined text-[15px]">tune</span>PRÉFÉRENCES DE SUIVI</span>
    <div class="rounded-2xl bg-surface-container divide-y divide-white/[0.06]">
      <div class="p-card-padding flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0"><span class="material-symbols-outlined text-[18px]">live_tv</span></div>
          <div class="min-w-0"><p class="font-body-md text-body-md text-on-surface">Plateforme principale</p><p class="font-label-sm text-label-sm text-on-surface-variant">Utilisée pour les liens rapides</p></div>
        </div>
        <select id="set-platform" class="bg-surface-container-high rounded-lg px-2.5 py-1.5 font-label-md text-label-md text-on-surface outline-none shrink-0">
          ${['Crunchyroll','ADN','Netflix'].map(p => `<option value="${p}" ${state.settings.platform===p?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="p-card-padding flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0"><span class="material-symbols-outlined text-[18px]">subtitles</span></div>
          <div class="min-w-0"><p class="font-body-md text-body-md text-on-surface">Piste audio favorite</p><p class="font-label-sm text-label-sm text-on-surface-variant">Préférence par défaut</p></div>
        </div>
        <select id="set-audio" class="bg-surface-container-high rounded-lg px-2.5 py-1.5 font-label-md text-label-md text-on-surface outline-none shrink-0">
          ${['VOSTFR (Japonais)','VF (Français)'].map(a => `<option value="${a}" ${state.settings.audioTrack===a?'selected':''}>${a}</option>`).join('')}
        </select>
      </div>
      <div class="p-card-padding flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0"><span class="material-symbols-outlined text-[18px]">visibility_off</span></div>
          <div class="min-w-0"><p class="font-body-md text-body-md text-on-surface">Masquer les spoilers</p><p class="font-label-sm text-label-sm text-on-surface-variant">Floute résumés et visuels inédits</p></div>
        </div>
        <button id="toggle-spoilers" class="toggle-track w-12 h-7 rounded-full ${state.settings.hideSpoilers?'bg-primary':'bg-surface-container-highest'} relative shrink-0">
          <span class="toggle-dot absolute top-0.5 ${state.settings.hideSpoilers?'left-[22px]':'left-0.5'} w-6 h-6 rounded-full bg-white flex items-center justify-center">${state.settings.hideSpoilers?'<span class="material-symbols-outlined text-[14px] text-primary">check</span>':''}</span>
        </button>
      </div>
      <div class="p-card-padding flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0"><span class="material-symbols-outlined text-[18px]">notifications</span></div>
          <div class="min-w-0"><p class="font-body-md text-body-md text-on-surface">Rappels de sortie automatique</p><p class="font-label-sm text-label-sm text-on-surface-variant">Alerte à la sortie d'un épisode</p></div>
        </div>
        <button id="toggle-reminders" class="toggle-track w-12 h-7 rounded-full ${state.settings.autoReminders?'bg-primary':'bg-surface-container-highest'} relative shrink-0">
          <span class="toggle-dot absolute top-0.5 ${state.settings.autoReminders?'left-[22px]':'left-0.5'} w-6 h-6 rounded-full bg-white flex items-center justify-center">${state.settings.autoReminders?'<span class="material-symbols-outlined text-[14px] text-primary">check</span>':''}</span>
        </button>
      </div>
    </div>

    <span class="font-label-sm text-label-sm text-primary tracking-wider mt-6 mb-2 flex items-center gap-1.5"><span class="material-symbols-outlined text-[15px]">sync</span>DONNÉES & SYNCHRONISATION</span>
    <div class="rounded-2xl bg-surface-container divide-y divide-white/[0.06]">
      <div class="p-card-padding flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0"><span class="material-symbols-outlined text-[18px]">cloud_done</span></div>
          <div class="min-w-0"><p class="font-body-md text-body-md text-on-surface">Sauvegarde locale</p><p class="font-label-sm text-label-sm text-on-surface-variant">Stockée dans ce navigateur</p></div>
        </div>
        <span class="px-2 py-1 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>${nowTime()}</span>
      </div>
      <button id="btn-export" class="w-full p-card-padding flex items-center justify-between gap-3 text-left">
        <div class="flex items-center gap-3 min-w-0"><span class="material-symbols-outlined text-on-surface-variant text-[18px]">download</span><span class="font-body-md text-body-md text-on-surface">Exporter ma collection (.json)</span></div>
        <span class="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
      </button>
    </div>

    <span class="font-label-sm text-label-sm text-primary tracking-wider mt-6 mb-2 flex items-center gap-1.5"><span class="material-symbols-outlined text-[15px]">shield</span>COMPTE & SÉCURITÉ</span>
    <div class="rounded-2xl bg-surface-container divide-y divide-white/[0.06]">
      <button id="btn-change-name" class="w-full p-card-padding flex items-center justify-between gap-3 text-left">
        <div class="flex items-center gap-3"><span class="material-symbols-outlined text-on-surface-variant text-[18px]">badge</span><span class="font-body-md text-body-md text-on-surface">Modifier le profil</span></div>
        <span class="material-symbols-outlined text-on-surface-variant text-[18px]">chevron_right</span>
      </button>
      <button id="btn-logout" class="w-full p-card-padding flex items-center gap-3 text-left">
        <span class="material-symbols-outlined text-on-surface-variant text-[18px]">logout</span><span class="font-body-md text-body-md text-on-surface">Se déconnecter</span>
      </button>
    </div>

    <div class="mt-6 rounded-2xl border border-error/25 bg-error-container/10 p-card-padding">
      <p class="font-body-md text-body-md text-error font-semibold flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px]">warning</span>Zone de danger</p>
      <p class="font-label-sm text-label-sm text-on-surface-variant mt-1.5">La suppression du compte effacera instantanément ton visionnage, ta watchlist et ton classement.</p>
      <button id="btn-delete-account" class="mt-3 w-full py-3 rounded-xl bg-error/15 text-error font-body-md text-body-md font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"><span class="material-symbols-outlined text-[16px]">delete_forever</span>Supprimer définitivement le compte</button>
    </div>

    <p class="text-center font-label-sm text-label-sm text-on-surface-variant/60 mt-6">ZENKAI Engine v1.0.0 · Build Obsidian<br/>Édition Otaku Élite</p>
  `;

  el.querySelector('#set-platform').addEventListener('change', (e) => { state.settings.platform = e.target.value; saveState(); toast('Plateforme mise à jour'); });
  el.querySelector('#set-audio').addEventListener('change', (e) => { state.settings.audioTrack = e.target.value; saveState(); toast('Piste audio mise à jour'); });
  el.querySelector('#toggle-spoilers').addEventListener('click', () => { state.settings.hideSpoilers = !state.settings.hideSpoilers; saveState(); renderSettings(); });
  el.querySelector('#toggle-reminders').addEventListener('click', () => { state.settings.autoReminders = !state.settings.autoReminders; saveState(); renderSettings(); });
  el.querySelector('#btn-export').addEventListener('click', () => {
    try{
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'zenkai-export.json';
      document.body.appendChild(a); a.click(); a.remove();
      toast('Export généré');
    }catch(e){ toast('Export indisponible dans cet aperçu'); }
  });
  el.querySelector('#btn-change-name').addEventListener('click', openEditProfileModal);
  el.querySelector('#btn-logout').addEventListener('click', () => {
    openModal(`
      <div class="text-center py-2">
        <div class="w-14 h-14 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center mx-auto mb-3"><span class="material-symbols-outlined text-[26px]">logout</span></div>
        <h3 class="font-headline-md text-headline-md text-on-surface">Se déconnecter ?</h3>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1.5">Tes données restent sauvegardées, tu pourras te reconnecter à tout moment avec ${state.user.email}.</p>
        <div class="flex gap-2.5 mt-5">
          <button data-action="close" class="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface font-body-md text-body-md">Annuler</button>
          <button id="btn-confirm-logout" class="flex-1 py-3 rounded-xl bg-primary text-on-primary font-body-md text-body-md font-semibold">Se déconnecter</button>
        </div>
      </div>
    `);
    document.querySelector('[data-action="close"]').addEventListener('click', closeModal);
    document.getElementById('btn-confirm-logout').addEventListener('click', async () => {
      closeModal();
      await logout();
      toast('Déconnecté(e)');
    });
  });
  el.querySelector('#btn-delete-account').addEventListener('click', () => {
    openModal(`
      <div class="text-center py-2">
        <div class="w-14 h-14 rounded-full bg-error-container/20 text-error flex items-center justify-center mx-auto mb-3"><span class="material-symbols-outlined text-[26px]">warning</span></div>
        <h3 class="font-headline-md text-headline-md text-on-surface">Supprimer le compte ?</h3>
        <p class="font-body-md text-body-md text-on-surface-variant mt-1.5">Cette action supprime définitivement le compte ${state.user.email} et toutes ses données ZENKAI. Elle est irréversible.</p>
        <div class="flex gap-2.5 mt-5">
          <button data-action="close" class="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface font-body-md text-body-md">Annuler</button>
          <button id="btn-confirm-delete" class="flex-1 py-3 rounded-xl bg-error text-on-error font-body-md text-body-md font-semibold">Supprimer</button>
        </div>
      </div>
    `);
    document.querySelector('[data-action="close"]').addEventListener('click', closeModal);
    document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
      const email = currentEmail;
      const accounts = await loadAccounts();
      await saveAccounts(accounts.filter(a => a.email !== email));
      await deleteUserState(email);
      await saveSession(null);
      currentEmail = null;
      state = null;
      closeModal();
      showLogin();
      toast('Compte supprimé');
    });
  });
}
function nowTime(){ const d = new Date(); return `À ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function openEditProfileModal(){
  openModal(`
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-headline-lg text-headline-lg text-on-surface">Modifier le profil</h3>
      <button data-action="close" class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"><span class="material-symbols-outlined text-[18px]">close</span></button>
    </div>
    <div class="flex flex-col gap-3">
      <input id="p-name" type="text" value="${state.user.name}" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface focus:border-primary"/>
      <input id="p-email" type="email" value="${state.user.email}" class="w-full bg-surface-container-highest/60 border border-white/10 rounded-xl px-3.5 py-3 outline-none font-body-md text-body-md text-on-surface focus:border-primary"/>
      <button id="btn-save-profile" class="mt-2 w-full py-3.5 rounded-xl bg-primary text-on-primary font-headline-md text-headline-md font-semibold active:scale-[0.98] transition-all">Enregistrer</button>
    </div>
  `);
  document.querySelector('[data-action="close"]').addEventListener('click', closeModal);
  document.getElementById('btn-save-profile').addEventListener('click', () => {
    const name = document.getElementById('p-name').value.trim() || state.user.name;
    state.user.name = name;
    state.user.email = document.getElementById('p-email').value.trim() || state.user.email;
    state.user.initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    saveState(); closeModal(); renderSettings(); toast('Profil mis à jour');
  });
}

/* ===================== INIT ===================== */
(async function init(){
  initIcons();
  initAuthUI();
  await ensureDemoAccount();
  const session = await loadSession();
  if(session){
    const accounts = await loadAccounts();
    const account = accounts.find(a => a.email === session);
    if(account){
      currentEmail = account.email;
      const loaded = await loadUserState(currentEmail);
      state = loaded || emptyState(account);
      showApp();
      setActivePage('home');
      return;
    }
  }
  showLogin();
})();
