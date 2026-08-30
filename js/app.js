// LocalStorage Based Demo Database
const DEFAULT_DATA = {
  fund: 150000,
  fundUpdated: new Date().toLocaleDateString(),
  currentUser: null,
  users: [
    { id: 1, username: 'admin', password: 'password', role: 'admin', name: 'Admin Account', nameUr: 'ایڈمن اکاؤنٹ', phone: '0300-0000000', relation: 'Head', relationUr: 'سربراہ' },
    { id: 2, username: 'ali', password: 'password', role: 'member', name: 'Ali Raza', nameUr: 'علی رضا', phone: '0300-1234567', relation: 'Son', relationUr: 'بیٹا' },
    { id: 3, username: 'zara', password: 'password', role: 'member', name: 'Zara Khan', nameUr: 'ذرا خان', phone: '0300-7654321', relation: 'Daughter', relationUr: 'بیٹی' }
  ],
  transactions: [
    { id: 101, from: 'Ali Raza', to: 'Zara Khan', amount: 5000, reason: 'Education support / تعلیم کے لیے', status: 'approved', date: '2026-08-20' }
  ],
  requests: [],
  paymentMethods: {
    easypaisa: { number: '03123456789', name: 'Family Lead' },
    jazzcash: { number: '03009876543', name: 'Family Lead' },
    bank: { name: 'Meezan Bank', title: 'Family Support Fund', number: '010203040506', iban: 'PK00MEZN00010203040506' }
  }
};

// Load or initialize state
let db = JSON.parse(localStorage.getItem('iff_db')) || DEFAULT_DATA;
function saveDB() {
  localStorage.setItem('iff_db', JSON.stringify(db));
}

// UI Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

// Navigation Router
function navigateTo(pageId) {
  pages.forEach(p => p.classList.add('hidden'));
  const activePage = document.getElementById(`page-${pageId}`);
  if (activePage) activePage.classList.remove('hidden');

  navLinks.forEach(link => {
    if (link.dataset.page === pageId) {
      link.classList.add('bg-primary-50', 'text-primary-700');
    } else {
      link.classList.remove('bg-primary-50', 'text-primary-700');
    }
  });
  
  renderPageData(pageId);
}

// Authentication
loginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const u = document.getElementById('login-username').value;
  const p = document.getElementById('login-password').value;

  const user = db.users.find(item => item.username === u && item.password === p);
  if (user) {
    db.currentUser = user;
    saveDB();
    initApp();
  } else {
    alert('غلط یوزر نیم یا پاس ورڈ! (آزمائش کے لیے admin اور password استعمال کریں)');
  }
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
  db.currentUser = null;
  saveDB();
  location.reload();
});

// Init App UI
function initApp() {
  if (!db.currentUser) {
    loginScreen.classList.remove('hidden');
    appScreen.classList.add('hidden');
    return;
  }

  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');

  document.getElementById('user-display').textContent = db.currentUser.name;
  const roleBadge = document.getElementById('role-badge');
  roleBadge.textContent = db.currentUser.role;
  roleBadge.className = `px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${db.currentUser.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`;

  if (db.currentUser.role === 'admin') {
    document.getElementById('nav-admin')?.classList.remove('hidden');
  }

  navigateTo('dashboard');
}

// Render dynamic data
function renderPageData(page) {
  if (page === 'dashboard') {
    document.getElementById('fund-balance').textContent = `Rs ${db.fund.toLocaleString()}`;
    document.getElementById('fund-updated').textContent = `Updated: ${db.fundUpdated}`;
    document.getElementById('pending-count').textContent = db.requests.length;
    document.getElementById('members-count').textContent = db.users.length;
    
    // Render Recent Tx
    const txList = document.getElementById('recent-tx-list');
    txList.innerHTML = db.transactions.map(t => `
      <div class="p-4 flex items-center justify-between">
        <div>
          <p class="font-medium text-slate-800 text-sm">${t.from} ➔ ${t.to}</p>
          <p class="text-xs text-slate-400">${t.reason}</p>
        </div>
        <span class="font-bold text-emerald-600 text-sm">Rs ${t.amount}</span>
      </div>
    `).join('') || '<p class="p-4 text-sm text-slate-400">No transactions yet.</p>';
  }

  if (page === 'members') {
    const grid = document.getElementById('members-grid');
    grid.innerHTML = db.users.map(u => `
      <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h4 class="font-bold text-slate-800">${u.name} (${u.nameUr || ''})</h4>
        <p class="text-xs text-slate-500 mt-1">Relation: ${u.relation}</p>
        <p class="text-xs text-primary-600 mt-2 font-mono">${u.phone}</p>
      </div>
    `).join('');
  }

  if (page === 'payments') {
    const cards = document.getElementById('payment-cards');
    const p = db.paymentMethods;
    cards.innerHTML = `
      <div class="p-4 rounded-xl bg-green-50 border border-green-200">
        <h4 class="font-bold text-green-900">Easypaisa</h4>
        <p class="text-sm text-green-800 mt-1">${p.easypaisa.number}</p>
        <p class="text-xs text-green-600">${p.easypaisa.name}</p>
      </div>
      <div class="p-4 rounded-xl bg-red-50 border border-red-200">
        <h4 class="font-bold text-red-900">JazzCash</h4>
        <p class="text-sm text-red-800 mt-1">${p.jazzcash.number}</p>
        <p class="text-xs text-red-600">${p.jazzcash.name}</p>
      </div>
      <div class="p-4 rounded-xl bg-blue-50 border border-blue-200">
        <h4 class="font-bold text-blue-900">${p.bank.name}</h4>
        <p class="text-sm text-blue-800 mt-1">Acc: ${p.bank.number}</p>
        <p class="text-xs text-blue-600">IBAN: ${p.bank.iban}</p>
      </div>
    `;
  }
}

// Handle Hash Links
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '') || 'dashboard';
  navigateTo(hash);
});

// Setup Mobile Menu & Languages
document.getElementById('menu-btn')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('-translate-x-full');
});

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
