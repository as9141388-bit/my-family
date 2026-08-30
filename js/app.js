// Data Models & Initial State
const DEFAULT_DATA = {
  fundBalance: 1545000,
  lastUpdated: '2026-08-30',
  members: [
    { id: 1, name: 'عمران خان', role: 'فیملی ہیڈ', phone: '0300-1234567', status: 'فعال' },
    { id: 2, name: 'سارہ احمد', role: 'ممبر', phone: '0321-7654321', status: 'فعال' },
    { id: 3, name: 'علی رضا', role: 'ممبر', phone: '0333-9876543', status: 'فعال' }
  ],
  transactions: [
    { id: 101, member: 'عمران خان', amount: 50000, date: '2026-08-25', status: 'منظور شدہ', type: 'جمع' },
    { id: 102, member: 'سارہ احمد', amount: 20000, date: '2026-08-20', status: 'منظور شدہ', type: 'جمع' }
  ],
  payments: [
    { type: 'بینک ٹرانسفر', title: 'HBL Bank', detail: 'Account: 1234-567890123-01 (Title: Ismaili Family Fund)' },
    { type: 'ایزی پیسہ / جاز کیش', title: 'EasyPaisa / JazzCash', detail: 'Mobile: 0300-1234567' }
  ]
};

// Application State Manager
class AppState {
  constructor() {
    this.currentUser = JSON.parse(sessionStorage.getItem('family_user')) || null;
    this.data = JSON.parse(localStorage.getItem('family_portal_data')) || DEFAULT_DATA;
    this.init();
  }

  saveData() {
    localStorage.setItem('family_portal_data', JSON.stringify(this.data));
  }

  login(username, password) {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Accept admin/password OR user/password
    if ((cleanUser === 'admin' || cleanUser === 'user') && cleanPass === 'password') {
      this.currentUser = {
        username: cleanUser,
        role: cleanUser === 'admin' ? 'ایڈمن' : 'ممبر'
      };
      sessionStorage.setItem('family_user', JSON.stringify(this.currentUser));
      return true;
    }
    return false;
  }

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('family_user');
    window.location.hash = '';
    this.render();
  }

  init() {
    this.bindEvents();
    this.render();
    window.addEventListener('hashchange', () => this.handleRouting());
  }

  bindEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('login-username').value;
        const p = document.getElementById('login-password').value;
        if (this.login(u, p)) {
          this.render();
          window.location.hash = 'dashboard';
        } else {
          alert('غلط یوزر نیم یا پاس ورڈ! آزمائش کے لیے admin اور password استعمال کریں۔');
        }
      });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }

  handleRouting() {
    if (!this.currentUser) return;
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
    
    const targetPage = document.getElementById(`page-${hash}`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
    } else {
      document.getElementById('page-dashboard')?.classList.remove('hidden');
    }
  }

  render() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');

    if (!this.currentUser) {
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (appScreen) appScreen.classList.add('hidden');
    } else {
      if (loginScreen) loginScreen.classList.add('hidden');
      if (appScreen) appScreen.classList.remove('hidden');

      const roleBadge = document.getElementById('role-badge');
      if (roleBadge) {
        roleBadge.textContent = this.currentUser.role;
        roleBadge.className = `text-xs px-2.5 py-1 rounded-full font-semibold ${
          this.currentUser.role === 'ایڈمن' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
        }`;
      }

      this.renderDashboard();
      this.renderMembers();
      this.renderPayments();
      this.handleRouting();
    }
  }

  renderDashboard() {
    const fundBal = document.getElementById('fund-balance');
    if (fundBal) fundBal.textContent = `Rs ${this.data.fundBalance.toLocaleString()}`;
    
    const fundUp = document.getElementById('fund-updated');
    if (fundUp) fundUp.textContent = `آخری اپڈیٹ: ${this.data.lastUpdated}`;

    const memCount = document.getElementById('members-count');
    if (memCount) memCount.textContent = this.data.members.length;

    const txList = document.getElementById('recent-tx-list');
    if (txList) {
      txList.innerHTML = this.data.transactions.map(tx => `
        <div class="p-4 border-b border-slate-50 flex justify-between items-center text-xs">
          <div>
            <p class="font-bold text-slate-700">${tx.member}</p>
            <p class="text-slate-400 mt-0.5">${tx.date}</p>
          </div>
          <span class="font-bold text-emerald-600">+Rs ${tx.amount.toLocaleString()}</span>
        </div>
      `).join('');
    }
  }

  renderMembers() {
    const grid = document.getElementById('members-grid');
    if (grid) {
      grid.innerHTML = this.data.members.map(m => `
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
          <div>
            <h4 class="font-bold text-slate-800 text-sm">${m.name}</h4>
            <p class="text-xs text-slate-400 mt-0.5">${m.role} • ${m.phone}</p>
          </div>
          <span class="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-medium">${m.status}</span>
        </div>
      `).join('');
    }
  }

  renderPayments() {
    const cards = document.getElementById('payment-cards');
    if (cards) {
      cards.innerHTML = this.data.payments.map(p => `
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span class="text-xs font-bold text-primary-600">${p.type}</span>
          <h4 class="font-bold text-slate-800 text-sm mt-1">${p.title}</h4>
          <p class="text-xs text-slate-500 mt-1">${p.detail}</p>
        </div>
      `).join('');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppState();
});
