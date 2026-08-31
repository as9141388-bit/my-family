<!DOCTYPE html>
<html lang="ur" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ismaili Family Foundation</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50: '#f0fdfa', 100: '#ccfbf1', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e' }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-50 font-sans text-slate-800 antialiased min-h-screen">

  <div id="login-screen" class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800">اسماعیلی فیملی فاؤنڈیشن</h1>
        <p class="text-sm text-slate-500 mt-1">محفوظ فیملی پورٹل میں لاگ ان کریں</p>
      </div>

      <form id="login-form" class="space-y-5">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">یوزر نیم (Username)</label>
          <input type="text" id="login-username" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="admin">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">پاس ورڈ (Password)</label>
          <input type="password" id="login-password" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="password">
        </div>
        <button type="submit" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-md">
          لاگ ان کریں
        </button>
      </form>
    </div>
  </div>

  <div id="app" class="hidden min-h-screen flex flex-col md:flex-row">
    <aside id="sidebar" class="w-full md:w-64 bg-white border-l border-slate-200 flex-shrink-0">
      <div class="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 class="font-bold text-slate-800 text-lg">فیملی پورٹل</h2>
          <span id="role-badge" class="mt-1 inline-block"></span>
        </div>
      </div>
      <nav class="p-4 space-y-2">
        <a href="#dashboard" class="nav-link block px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-100">ڈیش بورڈ</a>
        <a href="#members" class="nav-link block px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-100">فیملی ممبرز</a>
        <a href="#tree" class="nav-link block px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-100">🌳 شجرہ نسب (Family Trees)</a>
      </nav>
      <div class="p-4 border-t border-slate-100 mt-auto">
        <button id="logout-btn" class="w-full text-right px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg">لاگ آؤٹ</button>
      </div>
    </aside>

    <main class="flex-1 p-6 md:p-10">
      <section id="page-dashboard" class="page space-y-6">
        <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-6 text-white shadow-lg">
          <p class="text-xs opacity-80">موجودہ کل فیملی فنڈ (Current Net Balance)</p>
          <h3 id="fund-balance" class="text-3xl font-extrabold mt-1">Rs 0</h3>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p class="text-xs text-slate-400">Receive Fund (موصول فنڈ)</p>
            <p id="total-received" class="text-lg font-bold text-emerald-600 mt-1">Rs 0</p>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p class="text-xs text-slate-400">Pending Fund (پینڈنگ)</p>
            <p id="total-pending" class="text-lg font-bold text-amber-500 mt-1">Rs 0</p>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p class="text-xs text-slate-400">خرچ فنڈ (Spent Fund)</p>
            <p id="total-spent" class="text-lg font-bold text-red-500 mt-1">Rs 0</p>
          </div>
          <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p class="text-xs text-slate-400">کل ممبرز</p>
            <p id="members-count" class="text-lg font-bold text-slate-800 mt-1">0</p>
          </div>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h4 class="font-bold text-sm text-slate-800">نئی رقم / خرچ درج کریں (Add Entry)</h4>
          <form onsubmit="event.preventDefault(); window.app.addTransaction(this.member.value, this.amount.value, this.type.value, this.status.value, this.date.value); this.reset();" class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input type="text" name="member" placeholder="ممبر کا نام" required class="px-3 py-2 border rounded-xl text-xs">
            <input type="number" name="amount" placeholder="رقم (Rs)" required class="px-3 py-2 border rounded-xl text-xs">
            <select name="type" class="px-3 py-2 border rounded-xl text-xs">
              <option value="income">جمع (Income)</option>
              <option value="expense">خرچ (Expense)</option>
            </select>
            <select name="status" class="px-3 py-2 border rounded-xl text-xs">
              <option value="approved">منظور شدہ (Approved)</option>
              <option value="pending">پینڈنگ (Pending)</option>
            </select>
            <input type="date" name="date" class="px-3 py-2 border rounded-xl text-xs">
            <button type="submit" class="col-span-1 md:col-span-5 bg-primary-600 text-white text-xs py-2 rounded-xl font-bold hover:bg-primary-700">شامل کریں</button>
          </form>
        </div>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-100 font-bold text-sm">ہسٹری فنڈز (History Funds)</div>
          <div id="recent-tx-list"></div>
        </div>
      </section>

      <section id="page-members" class="page hidden space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-800">فیملی ممبرز</h3>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-slate-800 mb-3">نیا ممبر شامل کریں</h4>
          <form onsubmit="event.preventDefault(); window.app.addMember(this.name.value, this.role.value, this.phone.value); this.reset();" class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input type="text" name="name" placeholder="نام" required class="px-3 py-2 border rounded-xl text-xs">
            <input type="text" name="role" placeholder="عہدہ (مثلاً ممبر / سربراہ)" required class="px-3 py-2 border rounded-xl text-xs">
            <input type="text" name="phone" placeholder="فون نمبر" required class="px-3 py-2 border rounded-xl text-xs">
            <button type="submit" class="bg-primary-600 text-white text-xs py-2 rounded-xl font-bold hover:bg-primary-700">اضافہ کریں</button>
          </form>
        </div>

        <div id="members-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
      </section>

      <section id="page-tree" class="page hidden space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-bold text-slate-800">قبیلے کے خاندانوں کے شجرہ نسب</h3>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 class="font-bold text-sm text-slate-800 mb-3">نیا شجرہ نسب شامل کریں</h4>
          <form onsubmit="event.preventDefault(); window.app.addFamilyTree(this.familyName.value, this.headName.value, this.treeDetails.value); this.reset();" class="grid grid-cols-1 gap-3">
            <input type="text" name="familyName" placeholder="خاندان / شاخ کا نام (مثلاً: آلِ احمد)" required class="px-3 py-2 border rounded-xl text-xs">
            <input type="text" name="headName" placeholder="سربراہ کا نام (بزرگ کا نام)" required class="px-3 py-2 border rounded-xl text-xs">
            <textarea name="treeDetails" placeholder="شجرہ نسب کی تفصیل (والد کا نام، بچوں کے نام وغیرہ)" rows="4" required class="px-3 py-2 border rounded-xl text-xs"></textarea>
            <button type="submit" class="bg-primary-600 text-white text-xs py-2 rounded-xl font-bold hover:bg-primary-700">شجرہ محفوظ کریں</button>
          </form>
        </div>

        <div id="trees-grid" class="grid grid-cols-1 gap-4"></div>
      </section>
    </main>
  </div>

  <script src="js/app.js"></script>
</body>
</html>
