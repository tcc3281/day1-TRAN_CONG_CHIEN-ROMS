/**
 * Main Application Script for Gia Vi Viet POS & Back Office
 * Renders POS, Cashier, and Menu Admin views with interactive event handlers
 */

// Local UI state
let posSearch = '';
let posCategory = 'Tất cả';
let menuSearch = '';
let menuCategory = 'Tất cả';
let menuStatusFilter = 'ALL';
let activeNoteDishId = null;
let editingDishId = null;
let isDrawerOpen = false;
let isCategoryModalOpen = false;
let isPreBillModalOpen = false;
let isInvoiceModalOpen = false;

// Format VND currency
function formatVND(num) {
  return (num || 0).toLocaleString('vi-VN');
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  State.subscribe(renderApp);
  renderApp();
});

function renderApp() {
  renderTopNav();
  const container = document.getElementById('main-content');
  if (!container) return;

  if (State.activeView === 'POS_ORDER') {
    container.innerHTML = renderPosOrderHTML();
    attachPosEvents();
  } else if (State.activeView === 'CASHIER') {
    container.innerHTML = renderCashierHTML();
    attachCashierEvents();
  } else if (State.activeView === 'MENU_ADMIN') {
    container.innerHTML = renderMenuAdminHTML();
    attachMenuAdminEvents();
  }

  renderModals();
}

// --- Top Navigation ---
function renderTopNav() {
  const topNavEl = document.getElementById('top-nav');
  if (!topNavEl) return;

  const totalItemCount = State.orderItems.reduce((sum, item) => sum + item.quantity, 0);

  topNavEl.innerHTML = `
    <div class="px-4 py-2.5 flex items-center justify-between gap-4">
      <!-- Brand & Logo -->
      <div class="flex items-center gap-3 min-w-max">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <span class="font-extrabold text-base tracking-tight text-slate-900">GIA VỊ VIỆT</span>
            <span class="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              Gourmet POS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Hệ thống Vận hành Nhà hàng (Core MVP)</p>
        </div>
      </div>

      <!-- 3 Core View Switcher Tabs -->
      <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
        <button
          onclick="State.setActiveView('POS_ORDER')"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            State.activeView === 'POS_ORDER'
              ? 'bg-white text-brand-700 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }"
        >
          <span>1. POS Ghi Nhận Món</span>
          ${
            totalItemCount > 0
              ? `<span class="ml-0.5 px-1.5 py-0.2 text-[10px] bg-brand-600 text-white rounded-full font-bold">${totalItemCount}</span>`
              : ''
          }
        </button>

        <button
          onclick="State.setActiveView('CASHIER')"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            State.activeView === 'CASHIER'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }"
        >
          <span>2. Quầy Thu Ngân & Tính Tiền</span>
        </button>

        <button
          onclick="State.setActiveView('MENU_ADMIN')"
          class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            State.activeView === 'MENU_ADMIN'
              ? 'bg-white text-brand-700 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }"
        >
          <span>3. Quản Lý Thực Đơn (Admin)</span>
        </button>
      </div>

      <!-- Active Status: Table 05 or Admin -->
      <div class="flex items-center gap-3 min-w-max">
        ${
          State.activeView !== 'MENU_ADMIN'
            ? `
          <div class="flex items-center gap-2 bg-brand-50/70 border border-brand-200/80 px-3 py-1.5 rounded-xl">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div class="text-left">
              <div class="flex items-center gap-1.5 text-xs font-extrabold text-brand-900">
                <span>Bàn ${State.tableInfo.id}</span>
                <span class="text-[11px] font-normal text-slate-500">• ${State.tableInfo.area}</span>
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                <span>${State.tableInfo.guests} khách</span>
                <span>• Vào: ${State.tableInfo.checkIn}</span>
              </div>
            </div>
          </div>
        `
            : `
          <div class="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <div class="text-left">
              <span class="font-bold text-slate-800">Lê Hoàng Nam</span>
              <span class="text-[10px] block text-slate-500 font-semibold">Quản lý trưởng Back Office</span>
            </div>
          </div>
        `
        }
      </div>
    </div>
  `;
}

// --- 1. POS ORDER VIEW ---
function renderPosOrderHTML() {
  const filteredDishes = State.dishes.filter((dish) => {
    const matchSearch =
      dish.name.toLowerCase().includes(posSearch.toLowerCase()) ||
      dish.sku.toLowerCase().includes(posSearch.toLowerCase());
    const matchCat = posCategory === 'Tất cả' || dish.category === posCategory;
    return matchSearch && matchCat;
  });

  const billing = State.getBilling();

  return `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left: Food Catalog (65%) -->
      <div class="flex-1 p-4 lg:p-6 overflow-y-auto">
        <!-- Search & Categories -->
        <div class="space-y-2.5 pb-2">
          <div class="relative">
            <input
              id="pos-search-input"
              type="text"
              placeholder="Tìm nhanh tên món hoặc mã món ăn (vd: Bò Fuji, Lẩu, Trà đào...)"
              value="${posSearch}"
              class="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>

          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            ${State.categories
              .map(
                (cat) => `
              <button
                onclick="posCategory = '${cat}'; renderApp()"
                class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-active ${
                  posCategory === cat
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }"
              >
                ${cat}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Food Cards Grid -->
        <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-8">
          ${
            filteredDishes.length === 0
              ? `
            <div class="col-span-full py-16 text-center text-slate-400">
              <p class="font-bold text-sm text-slate-600">Không tìm thấy món ăn phù hợp</p>
              <p class="text-xs text-slate-400 mt-1">Hãy thử tìm kiếm từ khóa khác hoặc chuyển danh mục</p>
            </div>
          `
              : filteredDishes
                  .map((dish) => {
                    const isOutOfStock = dish.status === 'out_of_stock';
                    const inCart = State.orderItems.find((i) => i.dishId === dish.id);
                    const qty = inCart ? inCart.quantity : 0;

                    return `
              <div
                onclick="${!isOutOfStock ? `State.addToOrder(State.dishes.find(d => d.id === '${dish.id}'))` : ''}"
                class="group relative bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isOutOfStock
                    ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200 hover:border-brand-500 hover:shadow-md cursor-pointer touch-active'
                } ${qty > 0 ? 'ring-2 ring-brand-500/80 border-brand-500' : ''}"
              >
                <div class="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img src="${dish.image}" alt="${dish.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80';" class="w-full h-full object-cover transition-transform duration-300 ${!isOutOfStock ? 'group-hover:scale-105' : 'grayscale'}" loading="lazy" />
                  
                  ${
                    dish.badge
                      ? `
                    <span class="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wide ${
                      isOutOfStock
                        ? 'bg-slate-700 text-white'
                        : dish.badge === 'Best Seller'
                        ? 'bg-amber-500 text-white'
                        : dish.badge === 'Cay nhẹ'
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }">
                      ${dish.badge}
                    </span>
                  `
                      : ''
                  }

                  ${
                    qty > 0
                      ? `<span class="absolute top-2 right-2 bg-brand-600 text-white text-xs font-extrabold px-2 py-0.5 rounded-full shadow-md animate-pulse">✓ ${qty}</span>`
                      : ''
                  }

                  ${
                    isOutOfStock
                      ? `
                    <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center">
                      <span class="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow">Hết hàng</span>
                    </div>
                  `
                      : ''
                  }
                </div>

                <div class="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <div class="flex items-center justify-between gap-1 text-[11px] text-slate-500 font-medium">
                      <span>${dish.category}</span>
                      <span class="text-slate-400 font-mono">#${dish.sku}</span>
                    </div>
                    <h4 class="font-bold text-slate-800 text-xs mt-0.5 line-clamp-1 group-hover:text-brand-600 transition-colors">
                      ${dish.name}
                    </h4>
                  </div>

                  <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span class="text-xs font-black text-brand-700 font-mono-nums">
                        ${formatVND(dish.price)} đ
                      </span>
                      <span class="text-[10px] text-slate-400 block font-normal">/${dish.unit}</span>
                    </div>

                    <button
                      type="button"
                      ${isOutOfStock ? 'disabled' : ''}
                      class="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all shadow-sm ${
                        isOutOfStock
                          ? 'bg-slate-300 cursor-not-allowed'
                          : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/30'
                      }"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            `;
                  })
                  .join('')
          }
        </div>
      </div>

      <!-- Right: Active Order Cart (35%) -->
      <aside class="w-full lg:w-96 flex flex-col bg-slate-50/80 border-l border-slate-200 h-[calc(100vh-61px)] sticky top-[61px]">
        <div class="p-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 class="font-extrabold text-sm text-slate-900">Chi Tiết Gọi Món</h3>
            <span class="text-[11px] text-slate-500 font-medium">
              Bàn ${State.tableInfo.id} • Mã: <strong class="font-mono text-brand-700">${State.tableInfo.orderCode}</strong>
            </span>
          </div>

          ${
            State.orderItems.length > 0
              ? `
            <button onclick="State.clearOrder()" class="text-[11px] font-semibold text-slate-400 hover:text-red-600 transition-colors">
              Xóa giỏ
            </button>
          `
              : ''
          }
        </div>

        <!-- Scrollable Cart Items -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2.5">
          ${
            State.orderItems.length === 0
              ? `
            <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div class="w-12 h-12 rounded-full bg-slate-200/70 flex items-center justify-center mb-3 text-lg">🛒</div>
              <p class="text-xs font-bold text-slate-600">Chưa có món nào trong giỏ</p>
              <p class="text-[11px] text-slate-400 mt-1 max-w-[200px]">Chạm vào thẻ món bên trái để thêm món cho khách</p>
            </div>
          `
              : State.orderItems
                  .map(
                    (item) => `
            <div class="p-3 bg-white rounded-xl border border-slate-200/90 shadow-sm">
              <div class="flex items-start gap-2.5">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80';" class="w-12 h-12 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-1">
                    <h5 class="text-xs font-bold text-slate-900 leading-snug line-clamp-1">${item.name}</h5>
                    <button onclick="State.removeOrderItem('${item.dishId}')" class="text-slate-400 hover:text-red-600 p-0.5">✕</button>
                  </div>
                  <div class="text-[11px] text-slate-500 font-mono-nums mt-0.5">Đơn giá: ${formatVND(item.price)} đ</div>

                  <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                    <!-- Stepper -->
                    <div class="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button onclick="State.updateQuantity('${item.dishId}', -1)" class="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">-</button>
                      <span class="w-7 text-center text-xs font-extrabold text-slate-900 font-mono-nums">${item.quantity}</span>
                      <button onclick="State.updateQuantity('${item.dishId}', 1)" class="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">+</button>
                    </div>
                    <span class="text-xs font-extrabold text-brand-700 font-mono-nums">${formatVND(item.price * item.quantity)} đ</span>
                  </div>
                </div>
              </div>

              <!-- Note -->
              <div class="mt-2 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between">
                <div onclick="openNoteModal('${item.dishId}')" class="text-[11px] text-slate-600 hover:text-brand-700 cursor-pointer italic truncate">
                  ${item.note ? `✎ Ghi chú: ${item.note}` : '+ Thêm ghi chú cho bếp...'}
                </div>
              </div>
            </div>
          `
                  )
                  .join('')
          }
        </div>

        <!-- Cart Footer -->
        ${
          State.orderItems.length > 0
            ? `
          <div class="p-3.5 bg-white border-t border-slate-200 space-y-3 shadow-lg">
            <!-- Quick notes suggestion -->
            <div class="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              <span class="text-[10px] text-slate-400 font-semibold whitespace-nowrap">Gợi ý:</span>
              ${QUICK_NOTES.slice(0, 4)
                .map(
                  (tag) => `
                <button
                  onclick="appendQuickNoteToLastItem('${tag}')"
                  class="text-[10px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-600 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap"
                >
                  +${tag}
                </button>
              `
                )
                .join('')}
            </div>

            <div class="space-y-1 text-xs text-slate-600 font-medium">
              <div class="flex justify-between">
                <span>Tạm tính tiền món:</span>
                <span class="font-bold text-slate-800 font-mono-nums">${formatVND(billing.subtotal)} đ</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Phí dịch vụ (5%):</span>
                <span class="font-mono-nums">${formatVND(billing.serviceFee)} đ</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>Thuế GTGT (VAT 8%):</span>
                <span class="font-mono-nums">${formatVND(billing.vat)} đ</span>
              </div>
              <div class="pt-2 border-t border-dashed border-slate-200 flex justify-between items-baseline">
                <span class="font-black text-slate-900 text-xs uppercase tracking-wide">Tổng tiền dự kiến:</span>
                <span class="font-black text-brand-700 text-base font-mono-nums">${formatVND(billing.total)} đ</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button
                onclick="State.sendOrderToKitchen()"
                class="py-2.5 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-1.5 transition-all touch-active"
              >
                Gửi Bếp (KDS)
              </button>
              <button
                onclick="State.setActiveView('CASHIER')"
                class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all touch-active"
              >
                Thanh Toán →
              </button>
            </div>
          </div>
        `
            : ''
        }
      </aside>
    </div>
  `;
}

function attachPosEvents() {
  const input = document.getElementById('pos-search-input');
  if (input) {
    input.addEventListener('input', (e) => {
      posSearch = e.target.value;
      renderApp();
    });
  }
}

function appendQuickNoteToLastItem(tag) {
  if (State.orderItems.length > 0) {
    const last = State.orderItems[State.orderItems.length - 1];
    const newNote = last.note ? `${last.note}, ${tag}` : tag;
    State.updateItemNote(last.dishId, newNote);
  }
}

// --- 2. CASHIER VIEW ---
function renderCashierHTML() {
  const billing = State.getBilling();

  if (State.orderItems.length === 0) {
    return `
      <div class="flex-1 p-6 max-w-lg mx-auto my-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
        <div class="text-4xl mb-3">⚠️</div>
        <h3 class="font-extrabold text-sm text-slate-800">Chưa có món nào để thanh toán</h3>
        <p class="text-xs text-slate-500 mt-1 mb-4">Vui lòng quay lại màn hình POS để chọn món cho bàn</p>
        <button
          onclick="State.setActiveView('POS_ORDER')"
          class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
        >
          Đến Màn Hình POS Chọn Món
        </button>
      </div>
    `;
  }

  const quickDenominations = [
    { label: '100k', value: 100000 },
    { label: '200k', value: 200000 },
    { label: '500k', value: 500000 },
    { label: '1.000k', value: 1000000 },
    { label: 'Đúng số tiền', value: billing.total }
  ];

  return `
    <div class="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      <!-- Subheader -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center gap-3">
          <button
            onclick="State.setActiveView('POS_ORDER')"
            class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            ← Quay lại Order
          </button>
          <div class="h-5 w-px bg-slate-200"></div>
          <div>
            <h2 class="text-xs font-extrabold text-slate-900">Quầy Thu Ngân • Thanh Toán & Xuất Hóa Đơn</h2>
            <p class="text-[11px] text-slate-500">Đối soát phiếu tạm tính và xử lý phương thức thanh toán</p>
          </div>
        </div>
        <div class="text-xs text-slate-500 font-medium">
          Thời lượng: <strong>1h 15p</strong> • Thu ngân: <strong>${State.tableInfo.server}</strong>
        </div>
      </div>

      <!-- 2 Columns Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <!-- Left: Pre-bill receipt (42%) -->
        <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div class="text-center pb-3 border-b border-slate-200">
            <h4 class="font-extrabold text-sm uppercase tracking-wider text-slate-900">Nhà Hàng Gia Vị Việt</h4>
            <p class="text-[11px] text-slate-500">123 Phố Huế, P. Hàng Bài, Q. Hoàn Kiếm, Hà Nội</p>
            <p class="text-[11px] text-slate-500 font-mono">Hotline: 1900 6868</p>

            <div class="mt-2.5 pt-2 border-t border-dashed border-slate-200 text-left text-xs space-y-1 text-slate-600 font-medium">
              <div class="flex justify-between">
                <span>Bàn: <strong class="text-brand-800">Bàn ${State.tableInfo.id}</strong> (${State.tableInfo.area})</span>
                <span>Khách: <strong>${State.tableInfo.guests}</strong></span>
              </div>
              <div class="flex justify-between">
                <span>Mã đơn: <strong class="font-mono">${State.tableInfo.orderCode}</strong></span>
                <span>Giờ vào: <strong>${State.tableInfo.checkIn}</strong></span>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="py-3 border-b border-dashed border-slate-200 max-h-56 overflow-y-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="text-slate-400 font-semibold border-b border-slate-100 text-left">
                  <th class="pb-1">Tên món</th>
                  <th class="pb-1 text-center w-8">SL</th>
                  <th class="pb-1 text-right w-20">Đơn giá</th>
                  <th class="pb-1 text-right w-24">Thành tiền</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                ${State.orderItems
                  .map(
                    (item) => `
                  <tr>
                    <td class="py-2 pr-1 font-semibold text-slate-800">
                      ${item.name}
                      ${item.note ? `<span class="text-[10px] text-slate-400 italic block">• ${item.note}</span>` : ''}
                    </td>
                    <td class="py-2 text-center font-bold text-slate-700 font-mono-nums">${item.quantity}</td>
                    <td class="py-2 text-right text-slate-500 font-mono-nums">${formatVND(item.price)}</td>
                    <td class="py-2 text-right font-bold text-slate-900 font-mono-nums">${formatVND(item.price * item.quantity)}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
          </div>

          <!-- Breakdown -->
          <div class="py-3 space-y-1.5 text-xs text-slate-600 font-medium border-b border-dashed border-slate-200">
            <div class="flex justify-between">
              <span>Tiền món (Subtotal):</span>
              <span class="font-bold text-slate-800 font-mono-nums">${formatVND(billing.subtotal)} đ</span>
            </div>
            ${
              billing.voucherDiscount > 0
                ? `
              <div class="flex justify-between text-emerald-600 font-semibold">
                <span>Giảm giá (${State.appliedVoucher?.label}):</span>
                <span class="font-mono-nums">-${formatVND(billing.voucherDiscount)} đ</span>
              </div>
            `
                : ''
            }
            ${
              billing.pointsDiscount > 0
                ? `
              <div class="flex justify-between text-emerald-600 font-semibold">
                <span>Trừ điểm VIP (${State.customer?.name}):</span>
                <span class="font-mono-nums">-${formatVND(billing.pointsDiscount)} đ</span>
              </div>
            `
                : ''
            }
            <div class="flex justify-between text-slate-500">
              <span>Phí phục vụ (5%):</span>
              <span class="font-mono-nums">+${formatVND(billing.serviceFee)} đ</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Thuế GTGT (VAT 8%):</span>
              <span class="font-mono-nums">+${formatVND(billing.vat)} đ</span>
            </div>
          </div>

          <div class="mt-3 p-3.5 bg-brand-50 rounded-xl border border-brand-200 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold uppercase tracking-wider text-brand-900 block">Tổng Thanh Toán:</span>
              <span class="text-[10px] text-slate-500 italic">(Đã làm tròn)</span>
            </div>
            <span class="text-xl font-black text-brand-700 font-mono-nums">${formatVND(billing.total)} đ</span>
          </div>

          <button
            onclick="isPreBillModalOpen = true; renderApp()"
            class="w-full mt-4 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
          >
            🖨️ In Phiếu Tạm Tính Cho Khách
          </button>
        </div>

        <!-- Right: Loyalty, Payment Methods, Change Calculator (58%) -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Loyalty & Voucher -->
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <!-- Customer -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-800">Khách hàng thân thiết:</span>
                ${
                  State.customer
                    ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">${State.customer.tier}</span>`
                    : ''
                }
              </div>
              <div class="flex gap-2">
                <input
                  id="customer-phone-input"
                  type="text"
                  placeholder="Nhập SĐT khách (vd: 0988123456)..."
                  value="${State.customer?.phone || ''}"
                  class="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                />
                <button
                  onclick="handleCustomerSearch()"
                  class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200"
                >
                  Tra cứu
                </button>
              </div>

              ${
                State.customer
                  ? `
                <div class="mt-2.5 p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-bold text-slate-900">${State.customer.name}</div>
                    <div class="text-[11px] text-slate-500">Điểm: <strong class="text-amber-700">${formatVND(State.customer.points)}</strong></div>
                  </div>
                  <label class="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-amber-300">
                    <input
                      type="checkbox"
                      ${State.useLoyaltyPoints ? 'checked' : ''}
                      onchange="State.useLoyaltyPoints = this.checked; State.notify()"
                      class="w-3.5 h-3.5 text-brand-600 rounded"
                    />
                    <span class="text-[11px] font-bold text-slate-700">Dùng 50 điểm (-50k)</span>
                  </label>
                </div>
              `
                  : ''
              }
            </div>

            <!-- Voucher -->
            <div class="pt-3 border-t border-slate-100">
              <span class="text-xs font-bold text-slate-800 block mb-2">Mã giảm giá & Khuyến mãi:</span>
              <div class="flex flex-wrap gap-1.5">
                ${MOCK_VOUCHERS.map((v) => {
                  const isSel = State.appliedVoucher?.code === v.code;
                  return `
                  <button
                    onclick="State.appliedVoucher = ${isSel ? 'null' : `MOCK_VOUCHERS.find(x => x.code === '${v.code}')`}; State.notify()"
                    class="text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                      isSel
                        ? 'bg-brand-50 border-brand-500 text-brand-800'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                    }"
                  >
                    ${isSel ? '✓ ' : ''}${v.label}
                  </button>
                `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <span class="text-xs font-bold text-slate-800 block">Phương thức thanh toán:</span>
            <div class="grid grid-cols-2 gap-2.5">
              ${[
                { id: 'CASH', title: '💵 Tiền mặt (Cash)', sub: 'Thu & thối tiền' },
                { id: 'VIETQR', title: '📲 Quét VietQR', sub: 'Napas247 chuyển khoản' },
                { id: 'CARD', title: '💳 Thẻ ngân hàng', sub: 'Visa/Master/Napas POS' },
                { id: 'WALLET', title: '👛 Ví điện tử', sub: 'MoMo, ZaloPay' }
              ]
                .map((m) => {
                  const isSel = State.paymentMethod === m.id;
                  return `
                <button
                  onclick="State.paymentMethod = '${m.id}'; State.notify()"
                  class="p-3 rounded-xl border text-left transition-all ${
                    isSel
                      ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/20 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50'
                  }"
                >
                  <div class="font-bold text-xs text-slate-900">${m.title}</div>
                  <div class="text-[10px] text-slate-500 mt-0.5">${m.sub}</div>
                </button>
              `;
                })
                .join('')}
            </div>

            ${
              State.paymentMethod === 'VIETQR'
                ? `
              <div class="mt-3 p-4 bg-sky-50 rounded-xl border border-sky-200 flex items-center gap-4">
                <div class="w-24 h-24 bg-white p-2 rounded-lg border border-sky-200 flex items-center justify-center font-bold text-sky-700 text-center text-xs">
                  [MÃ VIETQR DỘNG]
                </div>
                <div class="text-xs space-y-1">
                  <span class="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold text-[10px]">VietQR Napas247</span>
                  <div class="font-bold text-slate-900">Số tiền: <strong class="text-brand-700">${formatVND(billing.total)} đ</strong></div>
                  <div class="text-slate-600 text-[11px]">Ngân hàng: <strong>Vietcombank</strong> (STK: 1029384756)</div>
                  <div class="text-slate-500 text-[10px]">Nội dung: <strong>THANHTOAN ${State.tableInfo.orderCode}</strong></div>
                </div>
              </div>
            `
                : ''
            }
          </div>

          <!-- Cash change & Hero checkout button -->
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            ${
              State.paymentMethod === 'CASH'
                ? `
              <div>
                <span class="text-xs font-bold text-slate-800 block mb-2">Tính tiền thối cho khách:</span>
                <div class="grid grid-cols-5 gap-1.5 mb-3">
                  ${quickDenominations
                    .map(
                      (d) => `
                    <button
                      onclick="State.cashReceived = ${d.value}; State.notify()"
                      class="py-1.5 px-2 text-xs font-bold rounded-lg border ${
                        State.cashReceived === d.value
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }"
                    >
                      ${d.label}
                    </button>
                  `
                    )
                    .join('')}
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-[11px] font-semibold text-slate-500 block mb-1">Tiền khách đưa (VNĐ):</label>
                    <input
                      type="number"
                      step="1000"
                      value="${State.cashReceived}"
                      oninput="State.cashReceived = Number(this.value) || 0; State.notify()"
                      class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono-nums"
                    />
                  </div>
                  <div class="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col justify-between">
                    <span class="text-[10px] font-bold text-emerald-800 uppercase">Tiền thối lại khách:</span>
                    <span class="text-base font-black text-emerald-700 font-mono-nums">${formatVND(billing.change)} đ</span>
                  </div>
                </div>
              </div>
            `
                : ''
            }

            <button
              onclick="isInvoiceModalOpen = true; renderApp()"
              class="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm uppercase tracking-wide shadow-lg shadow-emerald-600/30 transition-all touch-active mt-2"
            >
              ✓ Xác Nhận Thanh Toán & In Hóa Đơn (${formatVND(billing.total)} đ)
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function attachCashierEvents() {
  // Attached via inline handlers
}

function handleCustomerSearch() {
  const phone = document.getElementById('customer-phone-input')?.value.trim();
  const found = MOCK_CUSTOMERS.find((c) => c.phone === phone);
  if (found) {
    State.customer = found;
    State.showToast(`Đã tìm thấy thành viên: ${found.name}`);
  } else {
    State.showToast('Không tìm thấy thành viên với SĐT này!', 'info');
  }
  State.notify();
}

// --- 3. MENU ADMIN VIEW ---
function renderMenuAdminHTML() {
  const totalDishes = State.dishes.length;
  const outOfStockCount = State.dishes.filter((d) => d.status === 'out_of_stock').length;
  const availableCount = totalDishes - outOfStockCount;
  const bestSeller = State.dishes.find((d) => d.bestSeller) || State.dishes[0];

  const filteredDishes = State.dishes.filter((dish) => {
    const matchSearch =
      dish.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      dish.sku.toLowerCase().includes(menuSearch.toLowerCase());
    const matchCat = menuCategory === 'Tất cả' || dish.category === menuCategory;
    const matchStatus =
      menuStatusFilter === 'ALL' ||
      (menuStatusFilter === 'AVAILABLE' && dish.status === 'available') ||
      (menuStatusFilter === 'OUT_OF_STOCK' && dish.status === 'out_of_stock');
    return matchSearch && matchCat && matchStatus;
  });

  return `
    <div class="flex-1 flex overflow-hidden">
      <!-- Admin Sidebar -->
      <aside class="hidden md:flex w-60 bg-white border-r border-slate-200 flex-col justify-between p-3.5 flex-shrink-0">
        <div class="space-y-4">
          <div class="px-2 py-1">
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Quản Trị Vận Hành</span>
          </div>

          <nav class="space-y-1">
            <div class="px-3 py-2 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              🍴 Quản Lý Thực Đơn
            </div>
            <div class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer" onclick="State.showToast('Phân hệ Sơ đồ bàn sẽ mở ở Phase 2', 'info')">
              🪑 Sơ Đồ Bàn & Phòng
            </div>
            <div class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer" onclick="State.showToast('Phân hệ Kho hàng sẽ mở ở Phase 2', 'info')">
              📦 Kho Nguyên Liệu
            </div>
            <div class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer" onclick="State.showToast('Phân hệ Nhân sự sẽ mở ở Phase 2', 'info')">
              👥 Nhân Sự & Phân Quyền
            </div>
            <div class="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer" onclick="State.showToast('Phân hệ Báo cáo sẽ mở ở Phase 2', 'info')">
              📊 Báo Cáo Doanh Thu
            </div>
          </nav>
        </div>

        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
          Hotline POS: 1900 6868
        </div>
      </aside>

      <!-- Main Admin Content -->
      <main class="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <!-- Header -->
        <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 class="text-lg font-black text-slate-900">Quản Lý Thực Đơn & Danh Mục Món Ăn</h1>
            <p class="text-xs text-slate-500 mt-0.5">Thêm món, cập nhật giá, bật/tắt còn-hết hàng đồng bộ tức thời với máy POS</p>
          </div>
          <button
            onclick="openDishDrawer(null)"
            class="py-2 px-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            + Thêm Món Mới
          </button>
        </div>

        <!-- 4 KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <div class="p-4 rounded-2xl border bg-white shadow-xs">
            <span class="text-xs font-semibold text-slate-500 block">Tổng số món đang bán</span>
            <div class="text-base font-extrabold text-slate-900 mt-1">${availableCount} / ${totalDishes} món</div>
            <span class="text-[11px] text-slate-500 font-medium">${outOfStockCount} món tạm ngưng</span>
          </div>
          <div class="p-4 rounded-2xl border bg-white shadow-xs">
            <span class="text-xs font-semibold text-slate-500 block">Số nhóm thực đơn</span>
            <div class="text-base font-extrabold text-slate-900 mt-1">${State.categories.length - 1} nhóm</div>
            <span class="text-[11px] text-slate-500 font-medium">Đồng bộ với màn hình POS</span>
          </div>
          <div class="p-4 rounded-2xl border bg-white shadow-xs">
            <span class="text-xs font-semibold text-slate-500 block">Món tạm hết hàng</span>
            <div class="text-base font-extrabold text-amber-700 mt-1">${outOfStockCount} món</div>
            <span class="text-[11px] text-slate-500 font-medium">Cần nhập thêm nguyên liệu</span>
          </div>
          <div class="p-4 rounded-2xl border bg-white shadow-xs">
            <span class="text-xs font-semibold text-slate-500 block">Món Bán Chạy Nhất</span>
            <div class="text-base font-extrabold text-slate-900 mt-1 truncate">${bestSeller.name}</div>
            <span class="text-[11px] text-slate-500 font-medium">${bestSeller.salesCount} lượt gọi tháng này</span>
          </div>
        </div>

        <!-- Filter Toolbar & Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div class="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm món theo tên hoặc mã SKU..."
                value="${menuSearch}"
                oninput="menuSearch = this.value; renderApp()"
                class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-500"
              />
              <select
                onchange="menuStatusFilter = this.value; renderApp()"
                class="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="ALL" ${menuStatusFilter === 'ALL' ? 'selected' : ''}>Tất cả trạng thái</option>
                <option value="AVAILABLE" ${menuStatusFilter === 'AVAILABLE' ? 'selected' : ''}>Đang bán</option>
                <option value="OUT_OF_STOCK" ${menuStatusFilter === 'OUT_OF_STOCK' ? 'selected' : ''}>Tạm hết</option>
              </select>
            </div>

            <button
              onclick="isCategoryModalOpen = true; renderApp()"
              class="py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold"
            >
              📁 Quản Lý Nhóm Món
            </button>
          </div>

          <!-- Category strip -->
          <div class="px-4 py-2 bg-white border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            ${State.categories
              .map(
                (cat) => `
              <button
                onclick="menuCategory = '${cat}'; renderApp()"
                class="px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                  menuCategory === cat
                    ? 'bg-brand-50 text-brand-700 border border-brand-300'
                    : 'text-slate-500 hover:bg-slate-100'
                }"
              >
                ${cat}
              </button>
            `
              )
              .join('')}
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th class="py-3 px-4">Món Ăn & SKU</th>
                  <th class="py-3 px-3">Nhóm Món</th>
                  <th class="py-3 px-3 text-right">Giá Bán Niêm Yết</th>
                  <th class="py-3 px-3 text-right">Giá Vốn & Margin</th>
                  <th class="py-3 px-3 text-center">Trạng Thái Bán (Sync POS)</th>
                  <th class="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${
                  filteredDishes.length === 0
                    ? `<tr><td colspan="6" class="py-8 text-center text-slate-400">Không tìm thấy món ăn phù hợp</td></tr>`
                    : filteredDishes
                        .map((dish) => {
                          const isOutOfStock = dish.status === 'out_of_stock';
                          const margin = Math.round(((dish.price - dish.cost) / dish.price) * 100);

                          return `
                    <tr class="hover:bg-slate-50 ${isOutOfStock ? 'bg-slate-50/40 text-slate-400' : ''}">
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                          <img src="${dish.image}" alt="${dish.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80';" class="w-11 h-11 rounded-xl object-cover border border-slate-200 flex-shrink-0 ${isOutOfStock ? 'grayscale opacity-60' : ''}" />
                          <div>
                            <div class="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>${dish.name}</span>
                              ${dish.bestSeller ? `<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Best Seller</span>` : ''}
                            </div>
                            <span class="font-mono text-[10px] text-slate-400">#${dish.sku} • ${dish.unit}</span>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-3">
                        <span class="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                          ${dish.category}
                        </span>
                      </td>
                      <td class="py-3 px-3 text-right">
                        <span class="font-black text-brand-700 text-xs font-mono-nums">${formatVND(dish.price)} đ</span>
                        <span class="text-[10px] text-slate-400 block">VAT ${dish.vat}%</span>
                      </td>
                      <td class="py-3 px-3 text-right">
                        <span class="font-semibold text-slate-600 font-mono-nums block">${formatVND(dish.cost)} đ</span>
                        <span class="text-[10px] font-bold text-emerald-600">Lãi: ${margin}%</span>
                      </td>
                      <td class="py-3 px-3 text-center">
                        <button
                          type="button"
                          onclick="State.toggleDishStatus('${dish.id}')"
                          class="px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                            !isOutOfStock
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'
                          }"
                          title="Bấm để chuyển đổi trạng thái (đồng bộ tức thời sang POS)"
                        >
                          ${!isOutOfStock ? '● Đang bán' : '✕ Tạm hết'}
                        </button>
                      </td>
                      <td class="py-3 px-4 text-right">
                        <button onclick="openDishDrawer('${dish.id}')" class="p-1.5 text-slate-500 hover:text-brand-600" title="Chỉnh sửa">✎</button>
                        <button onclick="confirmDeleteDish('${dish.id}')" class="p-1.5 text-slate-400 hover:text-red-600 ml-1" title="Xóa món">🗑</button>
                      </td>
                    </tr>
                  `;
                        })
                        .join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `;
}

function attachMenuAdminEvents() {
  // Attached via inline handlers
}

function confirmDeleteDish(id) {
  const dish = State.dishes.find((d) => d.id === id);
  if (dish && confirm(`Bạn có chắc muốn xóa món "${dish.name}"?`)) {
    State.deleteDish(id);
  }
}

// --- MODALS ---
function renderModals() {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    ${renderNoteModalHTML()}
    ${renderDishDrawerHTML()}
    ${renderCategoryModalHTML()}
    ${renderPreBillModalHTML()}
    ${renderInvoiceModalHTML()}
  `;
}

function openNoteModal(dishId) {
  activeNoteDishId = dishId;
  renderApp();
}

function renderNoteModalHTML() {
  if (!activeNoteDishId) return '';
  const item = State.orderItems.find((i) => i.dishId === activeNoteDishId);
  if (!item) return '';

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-bold text-sm text-slate-900">Ghi chú món ăn</h3>
            <p class="text-xs text-brand-700 font-semibold">${item.name}</p>
          </div>
          <button onclick="activeNoteDishId = null; renderApp()" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="my-3">
          <label class="text-xs font-semibold text-slate-600 block mb-2">Gợi ý nhanh (chạm để thêm):</label>
          <div class="flex flex-wrap gap-1.5">
            ${QUICK_NOTES.map(
              (tag) => `
              <button
                type="button"
                onclick="document.getElementById('note-modal-input').value = (document.getElementById('note-modal-input').value ? document.getElementById('note-modal-input').value + ', ' : '') + '${tag}'"
                class="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
              >
                + ${tag}
              </button>
            `
            ).join('')}
          </div>
        </div>

        <div class="mb-4">
          <label class="text-xs font-semibold text-slate-600 block mb-1">Chi tiết yêu cầu:</label>
          <textarea
            id="note-modal-input"
            rows="3"
            placeholder="Ví dụ: Sốt riêng, ít cay, không hành..."
            class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
          >${item.note || ''}</textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button onclick="activeNoteDishId = null; renderApp()" class="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
          <button
            onclick="State.updateItemNote('${item.dishId}', document.getElementById('note-modal-input').value); activeNoteDishId = null; renderApp()"
            class="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
          >
            Lưu ghi chú
          </button>
        </div>
      </div>
    </div>
  `;
}

function openDishDrawer(dishId) {
  editingDishId = dishId;
  isDrawerOpen = true;
  renderApp();
}

function renderDishDrawerHTML() {
  if (!isDrawerOpen) return '';
  const dish = editingDishId ? State.dishes.find((d) => d.id === editingDishId) : null;

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div class="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div>
          <div class="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
            <div>
              <h3 class="text-sm font-extrabold text-slate-900">${dish ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Mới'}</h3>
              <p class="text-[11px] text-slate-500">${dish ? dish.sku : 'Thực đơn Gia Vị Việt'}</p>
            </div>
            <button onclick="isDrawerOpen = false; renderApp()" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
          </div>

          <form id="drawer-form" onsubmit="handleDrawerSubmit(event)" class="p-5 space-y-4 text-xs">
            <div>
              <label class="font-bold text-slate-700 block mb-1">Tên món ăn *:</label>
              <input
                id="drawer-name"
                type="text"
                required
                value="${dish ? dish.name : ''}"
                placeholder="Ví dụ: Bò Fuji Nướng Đá"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="font-bold text-slate-700 block mb-1">Mã món (SKU):</label>
                <input
                  id="drawer-sku"
                  type="text"
                  value="${dish ? dish.sku : 'MON-' + Math.floor(100 + Math.random() * 900)}"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                />
              </div>
              <div>
                <label class="font-bold text-slate-700 block mb-1">Đơn vị tính:</label>
                <input
                  id="drawer-unit"
                  type="text"
                  value="${dish ? dish.unit : 'Phần'}"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>
            </div>

            <div>
              <label class="font-bold text-slate-700 block mb-1">Nhóm thực đơn:</label>
              <select id="drawer-cat" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold">
                ${State.categories
                  .filter((c) => c !== 'Tất cả')
                  .map((cat) => `<option value="${cat}" ${dish && dish.category === cat ? 'selected' : ''}>${cat}</option>`)
                  .join('')}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label class="text-[11px] font-semibold text-slate-500 block mb-1">Giá bán niêm yết (VNĐ):</label>
                <input
                  id="drawer-price"
                  type="number"
                  step="1000"
                  value="${dish ? dish.price : 150000}"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-brand-700 font-mono-nums"
                />
              </div>
              <div>
                <label class="text-[11px] font-semibold text-slate-500 block mb-1">Giá vốn (Cost):</label>
                <input
                  id="drawer-cost"
                  type="number"
                  step="1000"
                  value="${dish ? dish.cost : 60000}"
                  class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 font-mono-nums"
                />
              </div>
            </div>

            <div>
              <label class="font-bold text-slate-700 block mb-1">URL Hình ảnh món ăn:</label>
              <input
                id="drawer-image"
                type="text"
                value="${dish ? dish.image : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'}"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div class="space-y-2 pt-2 border-t border-slate-100">
              <label class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span class="font-bold text-slate-800">Đang kinh doanh</span>
                <input
                  id="drawer-status"
                  type="checkbox"
                  ${dish && dish.status === 'out_of_stock' ? '' : 'checked'}
                  class="w-4 h-4 text-brand-600 rounded"
                />
              </label>
              <label class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span class="font-bold text-slate-800">Món Best Seller</span>
                <input
                  id="drawer-bestseller"
                  type="checkbox"
                  ${dish && dish.bestSeller ? 'checked' : ''}
                  class="w-4 h-4 text-brand-600 rounded"
                />
              </label>
            </div>
          </form>
        </div>

        <div class="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
          <button onclick="isDrawerOpen = false; renderApp()" class="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl">Hủy</button>
          <button form="drawer-form" type="submit" class="flex-1 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm">Lưu Món</button>
        </div>
      </div>
    </div>
  `;
}

function handleDrawerSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('drawer-name')?.value.trim();
  const sku = document.getElementById('drawer-sku')?.value.trim();
  const unit = document.getElementById('drawer-unit')?.value.trim() || 'Phần';
  const category = document.getElementById('drawer-cat')?.value;
  const price = Number(document.getElementById('drawer-price')?.value) || 0;
  const cost = Number(document.getElementById('drawer-cost')?.value) || 0;
  const image = document.getElementById('drawer-image')?.value.trim();
  const isAvailable = document.getElementById('drawer-status')?.checked;
  const isBestSeller = document.getElementById('drawer-bestseller')?.checked;

  const payload = {
    name,
    sku,
    unit,
    category,
    price,
    cost,
    image,
    status: isAvailable ? 'available' : 'out_of_stock',
    bestSeller: isBestSeller,
    badge: isBestSeller ? 'Best Seller' : !isAvailable ? 'Tạm hết' : '',
    vat: 8
  };

  if (editingDishId) {
    State.updateDish(editingDishId, payload);
  } else {
    State.addDish(payload);
  }

  isDrawerOpen = false;
  renderApp();
}

function renderCategoryModalHTML() {
  if (!isCategoryModalOpen) return '';

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 class="font-extrabold text-sm text-slate-900">Quản Lý Nhóm Món Ăn</h3>
          <button onclick="isCategoryModalOpen = false; renderApp()" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <form onsubmit="handleCategoryAdd(event)" class="my-4 flex gap-2">
          <input
            id="new-category-input"
            type="text"
            placeholder="Tên nhóm mới (vd: Món Chay, BBQ)..."
            class="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
          <button type="submit" class="px-3.5 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">+ Thêm</button>
        </form>

        <div class="space-y-1.5 max-h-56 overflow-y-auto">
          ${State.categories
            .filter((c) => c !== 'Tất cả')
            .map(
              (c) => `
            <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
              <span>${c}</span>
              <span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Sync POS</span>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="pt-4 mt-3 border-t border-slate-100 flex justify-end">
          <button onclick="isCategoryModalOpen = false; renderApp()" class="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">Đóng</button>
        </div>
      </div>
    </div>
  `;
}

function handleCategoryAdd(e) {
  e.preventDefault();
  const input = document.getElementById('new-category-input');
  if (input && input.value.trim()) {
    State.addCategory(input.value.trim());
    input.value = '';
    renderApp();
  }
}

function renderPreBillModalHTML() {
  if (!isPreBillModalOpen) return '';
  const billing = State.getBilling();

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
        <div class="text-center pb-3 border-b border-dashed border-slate-300">
          <h4 class="font-black text-sm uppercase">PHIẾU TẠM TÍNH</h4>
          <p class="text-xs text-slate-500">Bàn ${State.tableInfo.id} • ${State.tableInfo.orderCode}</p>
        </div>
        <div class="py-3 space-y-1 text-xs border-b border-dashed border-slate-300 max-h-48 overflow-y-auto">
          ${State.orderItems
            .map(
              (item) => `
            <div class="flex justify-between">
              <span>${item.name} x ${item.quantity}</span>
              <span class="font-mono-nums">${formatVND(item.price * item.quantity)} đ</span>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="pt-3 text-right text-xs">
          <p class="text-slate-500">Tổng thanh toán:</p>
          <p class="font-black text-brand-700 text-lg font-mono-nums">${formatVND(billing.total)} đ</p>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button onclick="isPreBillModalOpen = false; renderApp()" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Đóng</button>
          <button onclick="window.print(); isPreBillModalOpen = false; renderApp()" class="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold">In Phiếu</button>
        </div>
      </div>
    </div>
  `;
}

function renderInvoiceModalHTML() {
  if (!isInvoiceModalOpen) return '';
  const billing = State.getBilling();

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="text-center pb-4 border-b border-slate-100">
          <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xl">✓</div>
          <h3 class="text-base font-extrabold text-slate-900">Thanh Toán Thành Công!</h3>
          <p class="text-xs text-slate-500 mt-0.5">Hóa đơn điện tử <strong class="font-mono text-brand-700">#HD-${Date.now().toString().slice(-6)}</strong> đã hoàn tất</p>
        </div>

        <div class="my-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 overflow-y-auto space-y-2 text-xs">
          <div class="flex justify-between">
            <span>Bàn phục vụ:</span>
            <strong>Bàn ${State.tableInfo.id} (${State.tableInfo.area})</strong>
          </div>
          <div class="flex justify-between">
            <span>Phương thức:</span>
            <strong>${State.paymentMethod === 'CASH' ? 'Tiền mặt' : State.paymentMethod === 'VIETQR' ? 'VietQR' : 'Thẻ POS'}</strong>
          </div>
          <div class="pt-2 border-t border-dashed border-slate-200 space-y-1">
            ${State.orderItems.map((i) => `<div class="flex justify-between text-slate-600"><span>${i.name} x ${i.quantity}</span><span>${formatVND(i.price * i.quantity)} đ</span></div>`).join('')}
          </div>
          <div class="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
            <span>TỔNG TIỀN ĐÃ THU:</span>
            <span class="text-brand-700 font-mono-nums">${formatVND(billing.total)} đ</span>
          </div>
        </div>

        <div class="pt-2 flex items-center gap-3">
          <button onclick="isInvoiceModalOpen = false; renderApp()" class="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Đóng</button>
          <button onclick="isInvoiceModalOpen = false; State.resetTableAfterPayment()" class="flex-1 py-3 bg-brand-600 text-white rounded-xl text-xs font-bold">Giải Phóng Bàn & Đón Khách Mới →</button>
        </div>
      </div>
    </div>
  `;
}
