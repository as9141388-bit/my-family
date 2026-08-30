/* Ismaili Family Foundation - Frontend App */
(function () {
  const API = '';
  let token = localStorage.getItem('iff_token') || null;
  let currentUser = null;

  function formatPKR(n) {
    const num = Number(n) || 0;
    return 'Rs ' + num.toLocaleString('en-PK', { maximumFractionDigits: 0 });
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function statusBadge(status) {
    const map = {
      pending: 'status-pending',
      approved: 'status-approved',
      completed: 'status-completed',
      rejected: 'status-rejected'
    };
    const label = (window.IFF_i18n && window.IFF_i18n.t('status_' + status)) || status;
    return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-slate-100'}">${label}</span>`;
  }

  function showToast(msg, type = 'info') {
    const el = document.getElementById('toast');
    const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-slate-800' };
    el.innerHTML = `<div class="toast-enter ${colors[type] || colors.info} text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">${msg}</div>`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  function showLoading(show) {
    document.getElementById('loading').classList.toggle('hidden', !show);
  }

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + path, { ...options, headers, credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      logout(true);
      throw new Error(data.message || 'Session expired');
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  }

  async function checkAuth() {
    if (!token) return false;
    try {
      const data = await api('/api/auth/me');
      currentUser = data.user;
      return true;
    } catch {
      token = null;
      localStorage.removeItem('iff_token');
      return false;
    }
  }

  function logout(silent) {
    token = null;
    currentUser = null;
    localStorage.removeItem('iff_token');
    fetch(API + '/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    document.getElementById('app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    if (!silent) showToast('Logged out', 'info');
  }

  function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('user-display').textContent = currentUser.fullName || currentUser.username;
    const badge = document.getElementById('role-badge');
    badge.textContent = currentUser.role;
    badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ' +
      (currentUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-primary-100 text-primary-700');
    document.getElementById('nav-admin').classList.toggle('hidden', currentUser.role !== 'admin');
    if (window.IFF_i18n) window.IFF_i18n.applyTranslations();
    navigate(location.hash.slice(1) || 'dashboard');
  }

  function navigate(page) {
    if (!page) page = 'dashboard';
    if (page === 'admin' && currentUser.role !== 'admin') page = 'dashboard';
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.page === page);
    });
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
    location.hash = page;
    loadPage(page);
  }

  async function loadPage(page) {
    try {
      if (page === 'dashboard') await loadDashboard();
      else if (page === 'members') await loadMembers();
      else if (page === 'transfer') await loadTransfer();
      else if (page === 'history') await loadHistory();
      else if (page === 'payments') await loadPayments();
      else if (page === 'admin') await loadAdmin();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function loadDashboard() {
    showLoading(true);
    try {
      const data = await api('/api/dashboard');
      document.getElementById('fund-balance').textContent = formatPKR(data.fund.balance);
      document.getElementById('fund-updated').textContent = data.fund.lastUpdated ? 'Updated ' + formatDate(data.fund.lastUpdated) : '';
      document.getElementById('pending-count').textContent = (data.pendingRequests || []).length;
      document.getElementById('members-count').textContent = (data.members || []).length;

      const txList = document.getElementById('recent-tx-list');
      if (!data.recentTransactions || !data.recentTransactions.length) {
        txList.innerHTML = `<p class="p-5 text-sm text-slate-400 text-center">${window.IFF_i18n.t('no_data')}</p>`;
      } else {
        txList.innerHTML = data.recentTransactions.map(tx => `
          <div class="px-5 py-3 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">${tx.reason || tx.type}</p>
              <p class="text-xs text-slate-500">${tx.fromName || '—'} → ${tx.toName || '—'}</p>
              <p class="text-[11px] text-slate-400 mt-0.5">${formatDate(tx.createdAt)}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-semibold text-slate-800">${formatPKR(tx.amount)}</p>
              ${statusBadge(tx.status)}
            </div>
          </div>
        `).join('');
      }

      const mList = document.getElementById('dash-members-list');
      if (!data.members || !data.members.length) {
        mList.innerHTML = `<p class="p-5 text-sm text-slate-400 text-center">${window.IFF_i18n.t('no_data')}</p>`;
      } else {
        mList.innerHTML = data.members.map(m => `
          <div class="px-5 py-3 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
              ${(m.fullName || '?').charAt(0)}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-slate-800 truncate">${m.fullName}</p>
              <p class="text-xs text-slate-500">${m.relation || ''} ${m.fullNameUrdu ? '· ' + m.fullNameUrdu : ''}</p>
            </div>
          </div>
        `).join('');
      }
    } finally {
      showLoading(false);
    }
  }

  async function loadMembers() {
    showLoading(true);
    try {
      const data = await api('/api/members');
      const grid = document.getElementById('members-grid');
      const active = (data.members || []).filter(m => m.status === 'active');
      if (!active.length) {
        grid.innerHTML = `<p class="text-slate-400 col-span-full text-center py-10">${window.IFF_i18n.t('no_data')}</p>`;
        return;
      }
      grid.innerHTML = active.map(m => `
        <div class="member-card bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-lg">
              ${(m.fullName || '?').charAt(0)}
            </div>
            <div>
              <p class="font-semibold text-slate-800">${m.fullName}</p>
              <p class="text-xs text-slate-500 font-urdu" dir="rtl">${m.fullNameUrdu || ''}</p>
            </div>
          </div>
          <div class="space-y-1 text-sm text-slate-600">
            <p><span class="text-slate-400">Relation:</span> ${m.relation || '—'} ${m.relationUrdu ? '(' + m.relationUrdu + ')' : ''}</p>
            ${m.phone ? `<p><span class="text-slate-400">Phone:</span> ${m.phone}</p>` : ''}
            ${m.email ? `<p class="truncate"><span class="text-slate-400">Email:</span> ${m.email}</p>` : ''}
          </div>
        </div>
      `).join('');
    } finally {
      showLoading(false);
    }
  }

  async function loadTransfer() {
    showLoading(true);
    try {
      const [membersData, transfersData] = await Promise.all([
        api('/api/members'),
        api('/api/transfers')
      ]);
      const select = document.getElementById('transfer-to');
      const active = (membersData.members || []).filter(m => m.status === 'active' && m.userId !== currentUser.id);
      select.innerHTML = `<option value="">${window.IFF_i18n.t('choose_member')}</option>` +
        active.map(m => `<option value="${m.id}">${m.fullName}${m.fullNameUrdu ? ' (' + m.fullNameUrdu + ')' : ''}</option>`).join('');

      const list = document.getElementById('my-requests-list');
      const mine = (transfersData.transfers || []).filter(r => r.fromUserId === currentUser.id || currentUser.role === 'admin');
      if (!mine.length) {
        list.innerHTML = `<p class="text-sm text-slate-400 text-center py-6">${window.IFF_i18n.t('no_data')}</p>`;
      } else {
        list.innerHTML = mine.slice(0, 15).map(r => `
          <div class="bg-white rounded-xl border border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p class="text-sm font-medium">${r.fromName} → ${r.toName}</p>
              <p class="text-xs text-slate-500">${r.reason}</p>
              <p class="text-[11px] text-slate-400">${formatDate(r.createdAt)}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-semibold text-slate-800">${formatPKR(r.amount)}</span>
              ${statusBadge(r.status)}
            </div>
          </div>
        `).join('');
      }
    } finally {
      showLoading(false);
    }
  }

  async function loadHistory() {
    showLoading(true);
    try {
      const data = await api('/api/transactions');
      const list = document.getElementById('history-list');
      if (!data.transactions || !data.transactions.length) {
        list.innerHTML = `<p class="p-8 text-center text-slate-400 text-sm">${window.IFF_i18n.t('no_data')}</p>`;
        return;
      }
      list.innerHTML = data.transactions.map(tx => `
        <div class="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-800">${tx.reason || tx.type}</p>
            <p class="text-xs text-slate-500">${tx.fromName || '—'} → ${tx.toName || '—'}</p>
            <p class="text-[11px] text-slate-400 mt-0.5">${formatDate(tx.createdAt || tx.completedAt)}</p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <span class="font-semibold">${formatPKR(tx.amount)}</span>
            ${statusBadge(tx.status || 'completed')}
          </div>
        </div>
      `).join('');
    } finally {
      showLoading(false);
    }
  }

  async function loadPayments() {
    showLoading(true);
    try {
      const data = await api('/api/payment-methods');
      const m = data.methods || {};
      document.getElementById('payment-cards').innerHTML = `
        <div class="bg-white rounded-2xl border border-green-100 p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm">EP</div>
            <h3 class="font-semibold text-slate-800">Easypaisa</h3>
          </div>
          <p class="text-lg font-mono font-semibold text-slate-800">${m.easypaisa?.number || '—'}</p>
          <p class="text-sm text-slate-500 mt-1">${m.easypaisa?.accountName || ''}</p>
        </div>
        <div class="bg-white rounded-2xl border border-red-100 p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm">JC</div>
            <h3 class="font-semibold text-slate-800">JazzCash</h3>
          </div>
          <p class="text-lg font-mono font-semibold text-slate-800">${m.jazzcash?.number || '—'}</p>
          <p class="text-sm text-slate-500 mt-1">${m.jazzcash?.accountName || ''}</p>
        </div>
        <div class="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">BK</div>
            <h3 class="font-semibold text-slate-800">Bank Account</h3>
          </div>
          <p class="text-sm font-medium text-slate-800">${m.bank?.bankName || '—'}</p>
          <p class="text-sm text-slate-600 mt-1">${m.bank?.accountTitle || ''}</p>
          <p class="text-sm font-mono mt-1">${m.bank?.accountNumber || ''}</p>
          <p class="text-xs text-slate-400 mt-1">${m.bank?.iban || ''}</p>
        </div>
      `;
    } finally {
      showLoading(false);
    }
  }

  async function loadAdmin() {
    if (currentUser.role !== 'admin') return;
    showLoading(true);
    try {
      const [reqData, memData, payData] = await Promise.all([
        api('/api/admin/requests'),
        api('/api/members'),
        api('/api/payment-methods')
      ]);

      const pending = (reqData.requests || []).filter(r => r.status === 'pending');
      const pList = document.getElementById('admin-pending-list');
      if (!pending.length) {
        pList.innerHTML = `<p class="p-6 text-center text-slate-400 text-sm">${window.IFF_i18n.t('no_data')}</p>`;
      } else {
        pList.innerHTML = pending.map(r => `
          <div class="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p class="text-sm font-medium">${r.fromName} → ${r.toName}</p>
              <p class="text-xs text-slate-500">${r.reason}${r.note ? ' · ' + r.note : ''}</p>
              <p class="text-[11px] text-slate-400">${formatDate(r.createdAt)} · ${formatPKR(r.amount)}</p>
            </div>
            <div class="flex gap-2">
              <button data-approve="${r.id}" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">${window.IFF_i18n.t('approve')}</button>
              <button data-reject="${r.id}" class="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200">${window.IFF_i18n.t('reject')}</button>
            </div>
          </div>
        `).join('');
        pList.querySelectorAll('[data-approve]').forEach(btn => {
          btn.addEventListener('click', () => reviewRequest(btn.dataset.approve, 'approve'));
        });
        pList.querySelectorAll('[data-reject]').forEach(btn => {
          btn.addEventListener('click', () => reviewRequest(btn.dataset.reject, 'reject'));
        });
      }

      const m = payData.methods || {};
      document.getElementById('ep-number').value = m.easypaisa?.number || '';
      document.getElementById('ep-name').value = m.easypaisa?.accountName || '';
      document.getElementById('jc-number').value = m.jazzcash?.number || '';
      document.getElementById('jc-name').value = m.jazzcash?.accountName || '';
      document.getElementById('bank-name').value = m.bank?.bankName || '';
      document.getElementById('bank-title').value = m.bank?.accountTitle || '';
      document.getElementById('bank-number').value = m.bank?.accountNumber || '';
      document.getElementById('bank-iban').value = m.bank?.iban || '';

      const aList = document.getElementById('admin-members-list');
      aList.innerHTML = (memData.members || []).map(mm => `
        <div class="px-5 py-3 flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium">${mm.fullName} <span class="text-xs text-slate-400">@${mm.username}</span></p>
            <p class="text-xs text-slate-500">${mm.relation || ''} · ${mm.status} ${mm.role === 'admin' ? '· Admin' : ''}</p>
          </div>
          ${mm.role !== 'admin' ? `<button data-remove="${mm.id}" class="text-xs text-red-600 hover:underline font-medium">${window.IFF_i18n.t('remove')}</button>` : ''}
        </div>
      `).join('');
      aList.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Deactivate this member?')) return;
          try {
            await api('/api/admin/members/' + btn.dataset.remove, { method: 'DELETE' });
            showToast('Member deactivated', 'success');
            loadAdmin();
          } catch (e) { showToast(e.message, 'error'); }
        });
      });
    } finally {
      showLoading(false);
    }
  }

  async function reviewRequest(id, action) {
    try {
      showLoading(true);
      const data = await api('/api/admin/requests/' + id + '/review', {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      showToast(data.message || (action === 'approve' ? 'Approved' : 'Rejected'), 'success');
      loadAdmin();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    try {
      showLoading(true);
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      token = data.token;
      localStorage.setItem('iff_token', token);
      currentUser = data.user;
      showToast('Welcome, ' + currentUser.fullName, 'success');
      showApp();
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      btn.disabled = false;
      showLoading(false);
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => logout());

  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.toggle('hidden');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('-translate-x-full');
    document.getElementById('sidebar-overlay').classList.add('hidden');
  });

  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(a.dataset.page);
    });
  });

  document.getElementById('lang-toggle').addEventListener('click', () => {
    const next = window.IFF_i18n.getLang() === 'en' ? 'ur' : 'en';
    window.IFF_i18n.setLang(next);
  });
  document.getElementById('lang-en')?.addEventListener('click', () => window.IFF_i18n.setLang('en'));
  document.getElementById('lang-ur')?.addEventListener('click', () => window.IFF_i18n.setLang('ur'));

  document.getElementById('transfer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      showLoading(true);
      const body = {
        toMemberId: document.getElementById('transfer-to').value,
        amount: document.getElementById('transfer-amount').value,
        reason: document.getElementById('transfer-reason').value,
        note: document.getElementById('transfer-note').value
      };
      const data = await api('/api/transfer', { method: 'POST', body: JSON.stringify(body) });
      showToast(data.message || 'Request submitted', 'success');
      e.target.reset();
      loadTransfer();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      showLoading(false);
    }
  });

  document.getElementById('payments-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      showLoading(true);
      await api('/api/admin/payment-methods', {
        method: 'PUT',
        body: JSON.stringify({
          easypaisa: { number: document.getElementById('ep-number').value, accountName: document.getElementById('ep-name').value },
          jazzcash: { number: document.getElementById('jc-number').value, accountName: document.getElementById('jc-name').value },
          bank: {
            bankName: document.getElementById('bank-name').value,
            accountTitle: document.getElementById('bank-title').value,
            accountNumber: document.getElementById('bank-number').value,
            iban: document.getElementById('bank-iban').value
          }
        })
      });
      showToast('Payment methods saved', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      showLoading(false);
    }
  });

  document.getElementById('add-member-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      showLoading(true);
      await api('/api/admin/members', {
        method: 'POST',
        body: JSON.stringify({
          username: document.getElementById('am-username').value,
          email: document.getElementById('am-email').value,
          password: document.getElementById('am-password').value,
          fullName: document.getElementById('am-fullname').value,
          fullNameUrdu: document.getElementById('am-fullname-ur').value,
          phone: document.getElementById('am-phone').value,
          relation: document.getElementById('am-relation').value,
          relationUrdu: document.getElementById('am-relation-ur').value
        })
      });
      showToast('Member added successfully', 'success');
      e.target.reset();
      loadAdmin();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      showLoading(false);
    }
  });

  document.getElementById('fund-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      showLoading(true);
      const data = await api('/api/admin/fund', {
        method: 'POST',
        body: JSON.stringify({
          type: document.getElementById('fund-type').value,
          amount: document.getElementById('fund-amount').value,
          note: document.getElementById('fund-note').value
        })
      });
      showToast('Fund updated. New balance: ' + formatPKR(data.balance), 'success');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      showLoading(false);
    }
  });

  window.addEventListener('hashchange', () => {
    if (currentUser) navigate(location.hash.slice(1) || 'dashboard');
  });

  (async function init() {
    if (window.IFF_i18n) window.IFF_i18n.setLang(window.IFF_i18n.getLang());
    showLoading(true);
    const ok = await checkAuth();
    showLoading(false);
    if (ok) showApp();
  })();
})();
