// Initial Data Model
const DEFAULT_DATA = {
  fundBalance: 0,
  totalReceived: 0,
  totalPending: 0,
  totalSpent: 0,
  lastUpdated: new Date().toISOString().split('T')[0],
  members: [],
  transactions: []
};

class AppState {
  constructor() {
    this.currentUser = JSON.parse(sessionStorage.getItem('family_user')) || null;
    this.data = JSON.parse(localStorage.getItem('family_portal_data')) || DEFAULT_DATA;
    this.init();
  }

  saveData() {
    localStorage.setItem('family_portal_data', JSON.stringify(this.data));
    this.recalculateTotals();
    this.render();
  }

  recalculateTotals() {
    let received = 0;
    let pending = 0;
    let spent = 0;

    this.data.transactions.forEach(tx => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.type === 'expense') {
        spent += amt;
      } else if (tx.status === 'approved') {
        received += amt;
      } else if (tx.status === 'pending') {
        pending += amt;
      }
    });

    this.data.totalReceived = received;
    this.data.totalPending = pending;
    this.data.totalSpent = spent;
    this.data.fundBalance = received - spent;
  }

  login(username, password) {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

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

  addMember(name, role, phone) {
    const newMember = {
      id: Date.now(),
      name,
      role,
      phone,
      status: 'فعال'
    };
    this.data.members.push(newMember);
    this.saveData();
  }

  removeMember(id) {
    this.data.members = this.data.members.filter(m => m.id !== id);
    this.saveData();
  }

  addTransaction(memberName, amount, type, status, date) {
    const newTx = {
      id: Date.now(),
      member: memberName,
      amount: parseFloat(amount),
      type,
      status,
      date: date || new Date().toISOString().split('T')[0]
    };
    this.data.transactions.push(newTx);
    this.saveData();
  }

  removeTransaction(id) {
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    this.saveData();
  }

  init() {
    this.recalculateTotals();
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
          alert('غلط یوزر نیم یا پاس ورڈ!');
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
      this.handleRouting();
    }
  }

  renderDashboard() {
    document.getElementById('fund-balance').textContent = `Rs ${this.data.fundBalance.toLocaleString()}`;
    document.getElementById('total-received').textContent = `Rs ${this.data.totalReceived.toLocaleString()}`;
    document.getElementById('total-pending').textContent = `Rs ${this.data.totalPending.toLocaleString()}`;
    document.getElementById('total-spent').textContent = `Rs ${this.data.totalSpent.toLocaleString()}`;

    const memCount = document.getElementById('members-count');
    if (memCount) memCount.textContent = this.data.members.length;

    const txList = document.getElementById('recent-tx-list');
    if (txList) {
      if (this.data.transactions.length === 0) {
        txList.innerHTML = `<p class="p-4 text-xs text-slate-400 text-center">کوئی ہسٹری موجود نہیں ہے۔</p>`;
      } else {
        txList.innerHTML = this.data.transactions.map(tx => `
          <div class="p-4 border-b border-slate-50 flex justify-between items-center text-xs">
            <div>
              <p class="font-bold text-slate-700">${tx.member} (${tx.type === 'expense' ? 'خرچ' : 'جمع'})</p>
              <p class="text-slate-400 mt-0.5">${tx.date} • <span class="${tx.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}">${tx.status === 'approved' ? 'منظور شدہ' : 'پینڈنگ'}</span></p>
            </div>
            <div class="flex items-center space-x-3 space-x-reverse">
              <span class="font-bold ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-600'}">
                ${tx.type === 'expense' ? '-' : '+'}Rs ${tx.amount.toLocaleString()}
              </span>
              <button onclick="window.app.removeTransaction(${tx.id})" class="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">ڈیلیٹ</button>
            </div>
          </div>
        `).join('');
      }
    }
  }

  renderMembers() {
    const grid = document.getElementById('members-grid');
    if (grid) {
      if (this.data.members.length === 0) {
        grid.innerHTML = `<p class="col-span-2 text-xs text-slate-400 text-center py-4">کوئی فیملی ممبر موجود نہیں ہے۔ اوپر سے نیا ممبر شامل کریں۔</p>`;
      } else {
        grid.innerHTML = this.data.members.map(m => `
          <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <h4 class="font-bold text-slate-800 text-sm">${m.name}</h4>
              <p class="text-xs text-slate-400 mt-0.5">${m.role} • ${m.phone}</p>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
              <span class="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg font-medium">${m.status}</span>
              <button onclick="window.app.removeMember(${m.id})" class="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">ڈیلیٹ</button>
            </div>
          </div>
        `).join('');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppState();
});
