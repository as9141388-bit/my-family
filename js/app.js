const DEFAULT_DATA = {
  fundBalance: 0,
  totalReceived: 0,
  totalPending: 0,
  totalSpent: 0,
  lastUpdated: new Date().toISOString().split('T')[0],
  members: [],
  transactions: [],
  familyTrees: [],
  accounts: [
    { id: 1, type: 'Easypaisa', name: 'Easypaisa Mobile', accNumber: '03001234567', accTitle: 'Ismaili Foundation' },
    { id: 2, type: 'JazzCash', name: 'JazzCash Mobile', accNumber: '03007654321', accTitle: 'Ismaili Foundation' }
  ]
};

class AppState {
  constructor() {
    this.currentUser = JSON.parse(sessionStorage.getItem('family_user')) || null;
    this.data = JSON.parse(localStorage.getItem('family_portal_data')) || DEFAULT_DATA;
    if (!this.data.accounts) this.data.accounts = DEFAULT_DATA.accounts;
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

  addMember(name, role, phone, status = 'غیر منظور شدہ') {
    const newMember = {
      id: Date.now(),
      name,
      role,
      phone,
      status: this.currentUser?.role === 'ایڈمن' ? 'منظور شدہ' : status
    };
    this.data.members.push(newMember);
    this.saveData();
  }

  approveMember(id) {
    const m = this.data.members.find(mem => mem.id === id);
    if (m) m.status = 'منظور شدہ';
    this.saveData();
  }

  removeMember(id) {
    this.data.members = this.data.members.filter(m => m.id !== id);
    this.saveData();
  }

  addAccount(type, name, accNumber, accTitle) {
    if (this.currentUser?.role !== 'ایڈمن') return;
    this.data.accounts.push({ id: Date.now(), type, name, accNumber, accTitle });
    this.saveData();
  }

  removeAccount(id) {
    if (this.currentUser?.role !== 'ایڈمن') return;
    this.data.accounts = this.data.accounts.filter(a => a.id !== id);
    this.saveData();
  }

  addTransaction(memberName, amount, type, status, date, paymentMethod = 'Direct', trxId = '-') {
    const newTx = {
      id: Date.now(),
      member: memberName,
      amount: parseFloat(amount),
      type,
      status: this.currentUser?.role === 'ایڈمن' ? status : 'pending',
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod,
      trxId
    };
    this.data.transactions.push(newTx);
    this.saveData();
    alert('درخواست بھیج دی گئی ہے! ایڈمن کی منظوری کے بعد فنڈ میں اضافہ ہوگا۔');
  }

  approveTransaction(id) {
    const tx = this.data.transactions.find(t => t.id === id);
    if (tx) tx.status = 'approved';
    this.saveData();
  }

  removeTransaction(id) {
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    this.saveData();
  }

  addFamilyTree(familyName, headName, details) {
    this.data.familyTrees.push({ id: Date.now(), familyName, headName, details });
    this.saveData();
  }

  removeFamilyTree(id) {
    this.data.familyTrees = this.data.familyTrees.filter(t => t.id !== id);
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
      this.renderAccounts();
      this.renderMembers();
      this.renderTrees();
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
              <p class="text-slate-400 mt-0.5">${tx.date} • طریقہ: <b>${tx.paymentMethod || 'Direct'}</b> • TID: <b>${tx.trxId || '-'}</b></p>
              <p class="mt-0.5"><span class="${tx.status === 'approved' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}">${tx.status === 'approved' ? 'منظور شدہ' : 'پینڈنگ (منظوری کی ضرورت ہے)'}</span></p>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
              <span class="font-bold ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-600'}">
                ${tx.type === 'expense' ? '-' : '+'}Rs ${tx.amount.toLocaleString()}
              </span>
              ${this.currentUser.role === 'ایڈمن' && tx.status === 'pending' ? `
                <button onclick="window.app.approveTransaction(${tx.id})" class="text-xs px-2 py-1 bg-emerald-500 text-white rounded-lg">منظور کریں</button>
              ` : ''}
              ${this.currentUser.role === 'ایڈمن' ? `
                <button onclick="window.app.removeTransaction(${tx.id})" class="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">ڈیلیٹ</button>
              ` : ''}
            </div>
          </div>
        `).join('');
      }
    }
  }

  renderAccounts() {
    const grid = document.getElementById('accounts-grid');
    const adminCard = document.getElementById('admin-add-account-card');

    if (adminCard) {
      adminCard.style.display = this.currentUser.role === 'ایڈمن' ? 'block' : 'none';
    }

    if (grid) {
      grid.innerHTML = this.data.accounts.map(a => `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold px-2.5 py-1 rounded-full ${a.type === 'Easypaisa' ? 'bg-emerald-100 text-emerald-800' : a.type === 'JazzCash' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">${a.type}</span>
            ${this.currentUser.role === 'ایڈمن' ? `<button onclick="window.app.removeAccount(${a.id})" class="text-xs text-red-500 hover:underline">حذف کریں</button>` : ''}
          </div>
          <h4 class="font-bold text-slate-800 text-sm mt-2">${a.name}</h4>
          <p class="text-xs text-slate-600">نمبر: <b class="text-slate-800 select-all">${a.accNumber}</b></p>
          <p class="text-xs text-slate-600">عنوان (Title): <b>${a.accTitle}</b></p>
        </div>
      `).join('');
    }
  }

  renderMembers() {
    const grid = document.getElementById('members-grid');
    if (grid) {
      if (this.data.members.length === 0) {
        grid.innerHTML = `<p class="col-span-2 text-xs text-slate-400 text-center py-4">کوئی فیملی ممبر موجود نہیں ہے۔</p>`;
      } else {
        grid.innerHTML = this.data.members.map(m => `
          <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div>
              <h4 class="font-bold text-slate-800 text-sm">${m.name}</h4>
              <p class="text-xs text-slate-400 mt-0.5">${m.role} • ${m.phone}</p>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
              <span class="text-xs px-2 py-1 ${m.status === 'منظور شدہ' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} rounded-lg font-medium">${m.status}</span>
              ${this.currentUser.role === 'ایڈمن' && m.status !== 'منظور شدہ' ? `
                <button onclick="window.app.approveMember(${m.id})" class="text-xs px-2 py-1 bg-emerald-500 text-white rounded-lg">منظور کریں</button>
              ` : ''}
              ${this.currentUser.role === 'ایڈمن' ? `
                <button onclick="window.app.removeMember(${m.id})" class="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">ڈیلیٹ</button>
              ` : ''}
            </div>
          </div>
        `).join('');
      }
    }
  }

  renderTrees() {
    const grid = document.getElementById('trees-grid');
    if (grid) {
      if (this.data.familyTrees.length === 0) {
        grid.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">کوئی شجرہ نسب درج نہیں ہے۔</p>`;
      } else {
        grid.innerHTML = this.data.familyTrees.map(t => `
          <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div class="flex justify-between items-center border-b pb-2">
              <div>
                <h4 class="font-bold text-primary-700 text-base">خاندان: ${t.familyName}</h4>
                <p class="text-xs text-slate-500">سربراہ / بزرگ: <b>${t.headName}</b></p>
              </div>
              ${this.currentUser.role === 'ایڈمن' ? `<button onclick="window.app.removeFamilyTree(${t.id})" class="text-xs px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">ڈیلیٹ شجرہ</button>` : ''}
            </div>
            <p class="text-xs text-slate-700 whitespace-pre-line leading-relaxed">${t.details}</p>
          </div>
        `).join('');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppState();
});
