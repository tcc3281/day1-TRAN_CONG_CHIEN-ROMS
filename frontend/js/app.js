/**
 * Main Application Script for Gia Vi Viet POS & Back Office
 * Renders POS, KDS Kitchen, Cashier, and Menu Admin views with interactive event handlers
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
let isTableModalOpen = false;
let isKitchenOutStockModalOpen = false;
let isInventoryModalOpen = false;
let isStaffModalOpen = false;
let isReportModalOpen = false;
let kdsStationFilter = 'ALL'; // 'ALL' | 'Bếp Nóng' | 'Bếp Lạnh' | 'Quầy Bar'

// Format VND currency
function formatVND(num) {
  return (num || 0).toLocaleString('vi-VN');
}

// Global Category Selection Helpers (safe from '&' string escaping)
window.selectPosCategory = function(idx) {
  posCategory = State.categories[idx] || 'Tất cả';
  renderApp();
};

window.selectMenuCategory = function(idx) {
  menuCategory = State.categories[idx] || 'Tất cả';
  renderApp();
};

// Focus-preserving search input handlers
window.handlePosSearchInput = function(e) {
  posSearch = e.target.value;
  const cursor = e.target.selectionStart;
  renderApp();
  const input = document.getElementById('pos-search-input');
  if (input) {
    input.focus();
    input.setSelectionRange(cursor, cursor);
  }
};

window.handleMenuSearchInput = function(e) {
  menuSearch = e.target.value;
  const cursor = e.target.selectionStart;
  renderApp();
  const input = document.getElementById('menu-search-input');
  if (input) {
    input.focus();
    input.setSelectionRange(cursor, cursor);
  }
};

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
  } else if (State.activeView === 'KDS') {
    container.innerHTML = renderKdsHTML();
    attachKdsEvents();
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
  const totalKdsPending = State.kdsTickets.reduce(
    (sum, t) => sum + t.items.filter((i) => i.status !== 'SERVED').length,
    0
  );

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
              Gourmet POS & KDS
            </span>
          </div>
          <p class="text-xs text-slate-500 font-medium">Hệ thống Vận hành Nhà hàng (Core MVP + KDS)</p>
        </div>
      </div>

      <!-- 4 Core View Switcher Tabs -->
      <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
        <button
          onclick="State.setActiveView('POS_ORDER')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            State.activeView === 'POS_ORDER'
              ? 'bg-white text-brand-700 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }"
        >
          <span>1. POS Gọi Món</span>
          ${
            totalItemCount > 0
              ? `<span class="px-1.5 py-0.2 text-[10px] bg-brand-600 text-white rounded-full font-bold">${totalItemCount}</span>`
              : ''
          }
        </button>

        <button
          onclick="State.setActiveView('KDS')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            State.activeView === 'KDS'
              ? 'bg-white text-amber-700 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }"
        >
          <span>2. Bếp & Bar (KDS)</span>
          ${
            totalKdsPending > 0
              ? `<span class="px-1.5 py-0.2 text-[10px] bg-amber-600 text-white rounded-full font-bold animate-pulse">${totalKdsPending}</span>`
              : ''
          }
        </button>

        <button
          onclick="State.setActiveView('CASHIER')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            State.activeView === 'CASHIER'
              ? 'bg-white text-emerald-700 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }"
        >
          <span>3. Quầy Thu Ngân</span>
        </button>

        <button
          onclick="State.setActiveView('MENU_ADMIN')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            State.activeView === 'MENU_ADMIN'
              ? 'bg-white text-brand-700 shadow-sm border border-slate-200 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }"
        >
          <span>4. Quản Lý Menu</span>
        </button>
      </div>

      <!-- Active Status: Clickable Table Selector or Admin -->
      <div class="flex items-center gap-3 min-w-max">
        ${
          State.activeView !== 'MENU_ADMIN'
            ? `
          <div
            onclick="isTableModalOpen = true; renderApp()"
            class="flex items-center gap-2.5 bg-brand-50/80 hover:bg-brand-100/90 border border-brand-200 px-3 py-1.5 rounded-xl cursor-pointer transition-all shadow-xs group"
            title="Bấm để xem sơ đồ bàn và chuyển bàn"
          >
            <span class="w-2.5 h-2.5 rounded-full ${
              State.tableInfo.status === 'OCCUPIED'
                ? 'bg-amber-500 animate-pulse'
                : State.tableInfo.status === 'RESERVED'
                ? 'bg-blue-500'
                : 'bg-emerald-500'
            }"></span>
            <div class="text-left">
              <div class="flex items-center gap-1 text-xs font-extrabold text-brand-900">
                <span>${State.tableInfo.number || 'Bàn ' + State.tableInfo.id}</span>
                <span class="text-[10px] font-normal text-slate-500">• ${State.tableInfo.area}</span>
                <span class="text-[10px] text-brand-600 underline font-semibold ml-1 group-hover:text-brand-800">Đổi bàn ▾</span>
              </div>
              <div class="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                <span>${State.tableInfo.guests || 0} khách</span>
                <span>• ${State.tableInfo.orderCode ? `<strong class="font-mono text-brand-700">${State.tableInfo.orderCode}</strong> (Hóa đơn tạm)` : 'Bàn trống'}</span>
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
  const activeTables = State.getActiveTablesWithBills();

  return `
    <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">
      <!-- Left: Food Catalog (65%) -->
      <div class="flex-1 p-4 lg:p-6 overflow-y-auto">
        <!-- Quick Active Tables Bar (Bàn đang phục vụ) -->
        <div class="mb-3 p-2.5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
          <div class="flex items-center gap-2 min-w-max">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-xs font-black text-slate-800 uppercase tracking-wide">Bàn Có Khách:</span>
            <span class="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">${activeTables.length} bàn</span>
          </div>
          <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            ${activeTables
              .map((t) => {
                const isCur = t.id === State.currentTableId;
                const tb = State.getTableBilling(t.id);
                return `
              <button
                type="button"
                onclick="State.switchTable('${t.id}')"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isCur
                    ? 'bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }"
                title="Bấm để chuyển sang ${t.number} (${t.area})"
              >
                <span>${t.number}</span>
                <span class="text-[10px] opacity-80 font-mono font-normal">(${formatVND(tb.total)}đ)</span>
              </button>
            `;
              })
              .join('')}
            <button
              type="button"
              onclick="isTableModalOpen = true; renderApp()"
              class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-brand-600 hover:bg-brand-50 border border-dashed border-brand-300 whitespace-nowrap"
            >
              + Đổi bàn khác
            </button>
          </div>
        </div>

        <!-- Search & Categories -->
        <div class="space-y-2.5 pb-2">
          <div class="relative">
            <input
              id="pos-search-input"
              type="text"
              placeholder="Tìm nhanh tên món hoặc mã món ăn (vd: Bò Fuji, Lẩu, Trà đào...)"
              value="${posSearch}"
              oninput="handlePosSearchInput(event)"
              class="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm"
            />
            <svg class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>

          <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            ${State.categories
              .map(
                (cat, idx) => `
              <button
                type="button"
                onclick="selectPosCategory(${idx})"
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
            <div class="p-3 bg-white rounded-xl border transition-all ${
              item.status === 'QUEUED'
                ? 'border-amber-300 bg-amber-50/20 shadow-xs'
                : 'border-slate-200/90 shadow-sm'
            }">
              <div class="flex items-start gap-2.5">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80';" class="w-12 h-12 rounded-lg object-cover border border-slate-100 flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-1">
                    <div>
                      <h5 class="text-xs font-bold text-slate-900 leading-snug line-clamp-1">${item.name}</h5>
                      ${
                        item.isAddon
                          ? `<span class="inline-block text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 mt-0.5">⚡ Món gọi thêm</span>`
                          : ''
                      }
                    </div>
                    <button onclick="State.removeOrderItem('${item.dishId}')" class="text-slate-400 hover:text-red-600 p-0.5">✕</button>
                  </div>
                  <div class="flex items-center justify-between gap-1 mt-1">
                    <span class="text-[11px] text-slate-500 font-mono-nums">Đơn giá: ${formatVND(item.price)} đ</span>
                    ${
                      item.status === 'SERVED'
                        ? `<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300">🍽️ Đã ra bàn</span>`
                        : item.status === 'READY'
                        ? `<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">✓ Xong [${item.station || State.getStationForDish(item)}]</span>`
                        : item.status === 'COOKING'
                        ? `<span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">🔥 Đang nấu [${item.station || State.getStationForDish(item)}]</span>`
                        : `<span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">⏳ Chờ gửi bếp [${item.station || State.getStationForDish(item)}]</span>`
                    }
                  </div>

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
                <span>Tiền món (Tạm tính):</span>
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
                <span class="font-black text-slate-900 text-xs uppercase tracking-wide">Tổng hóa đơn tạm tính:</span>
                <span class="font-black text-brand-700 text-base font-mono-nums">${formatVND(billing.total)} đ</span>
              </div>
            </div>

            <!-- Workflow Guidance Banner -->
            ${(() => {
              const pendingCount = State.orderItems.filter((i) => i.status === 'QUEUED').length;
              const hasSentItems = State.orderItems.some((i) => i.status !== 'QUEUED');
              const hasItems = State.orderItems.length > 0;
              if (!hasItems) return '';

              return `
              <div class="text-[11px] p-2.5 rounded-xl border flex items-center gap-2 ${
                pendingCount > 0
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }">
                <span class="text-sm flex-shrink-0">${pendingCount > 0 ? '🔔' : '✓'}</span>
                <span class="leading-tight font-medium">
                  ${
                    hasSentItems && pendingCount > 0
                      ? `Bàn <strong>${State.tableInfo.number || 'Bàn ' + State.tableInfo.id}</strong> đang có <strong class="text-brand-700 font-bold">${pendingCount} món mới gọi thêm</strong>. Bấm nút bên dưới để chuyển vé xuống Bếp & Bar ngay!`
                      : pendingCount > 0
                      ? `Bước 1: Có <strong class="font-bold text-brand-700">${pendingCount} món mới</strong> chưa gửi. Bấm <strong>"Gửi Bếp (KDS)"</strong> để Bếp/Bar nấu!`
                      : `Hóa đơn tạm tính: <strong class="text-brand-700 font-bold">${formatVND(billing.total)} đ</strong>. Toàn bộ món đã gửi Bếp & Bar. Khi khách dùng xong, bấm <strong>"Thanh Toán"</strong>.`
                  }
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onclick="State.sendOrderToKitchen()"
                  class="py-2.5 px-3 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all touch-active ${
                    pendingCount > 0
                      ? 'bg-brand-600 hover:bg-brand-700 text-white ring-2 ring-brand-500/30 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                  }"
                  title="${pendingCount > 0 ? 'Gửi món xuống trạm Bếp & Quầy Bar' : 'Tất cả món đã được gửi bếp'}"
                >
                  ${
                    hasSentItems && pendingCount > 0
                      ? `👨‍🍳 Gửi Thêm (${pendingCount} món)`
                      : pendingCount > 0
                      ? `👨‍🍳 Gửi Bếp (${pendingCount} món)`
                      : `✓ Đã gửi (${State.orderItems.length} món)`
                  }
                </button>

                <button
                  type="button"
                  onclick="State.setActiveView('CASHIER')"
                  class="py-2.5 px-3 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all touch-active ${
                    pendingCount === 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                      : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                  }"
                  title="Chuyển sang quầy thu ngân để đối soát hóa đơn tạm và thanh toán"
                >
                  💵 Hóa Đơn Tạm & Trả Tiền →
                </button>
              </div>
            `;
            })()}
          </div>
        `
            : ''
        }
      </aside>
    </div>
  `;
}

function attachPosEvents() {
  // Search input events are handled cleanly via handlePosSearchInput to preserve cursor focus
}

function appendQuickNoteToLastItem(tag) {
  if (State.orderItems.length > 0) {
    const last = State.orderItems[State.orderItems.length - 1];
    const newNote = last.note ? `${last.note}, ${tag}` : tag;
    State.updateItemNote(last.dishId, newNote);
  }
}

// --- 2. KDS KITCHEN VIEW ---
function renderKdsHTML() {
  const allTickets = State.kdsTickets;

  let queuedCount = 0;
  let cookingCount = 0;
  let readyCount = 0;
  const stationCounts = {
    'ALL': 0,
    'Bếp Nóng': 0,
    'Bếp Lạnh': 0,
    'Quầy Bar': 0
  };

  allTickets.forEach((t) => {
    t.items.forEach((item) => {
      if (item.status === 'QUEUED') queuedCount++;
      else if (item.status === 'COOKING') cookingCount++;
      else if (item.status === 'READY') readyCount++;

      if (item.status !== 'SERVED') {
        stationCounts['ALL']++;
        if (stationCounts[item.station] !== undefined) {
          stationCounts[item.station]++;
        }
      }
    });
  });

  const filteredTickets = allTickets
    .map((ticket) => {
      const filteredItems = ticket.items.filter((item) => {
        if (kdsStationFilter === 'ALL') return true;
        return item.station === kdsStationFilter;
      });
      return { ...ticket, displayItems: filteredItems };
    })
    .filter((t) => t.displayItems.length > 0);

  const currentTimeStr = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `
    <div class="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      <!-- KDS Top Bar -->
      <div class="p-3 bg-slate-800/95 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-brand-600 flex items-center justify-center text-white font-black text-base shadow-sm">
            👨‍🍳
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-extrabold text-sm tracking-tight text-white uppercase">Gia Vị Việt KDS</h2>
              <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Điều Phối Bếp & Bar
              </span>
            </div>
            <p class="text-[11px] text-slate-400">Trạm hiển thị thứ tự gọi món FIFO đồng bộ thời gian thực</p>
          </div>
        </div>

        <!-- Metric badges -->
        <div class="flex items-center gap-2 text-xs">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-700/60 border border-slate-600">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="text-slate-300 text-[11px]">Chờ nấu:</span>
            <strong class="text-amber-400 font-mono font-bold">${queuedCount}</strong>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-700/60 border border-slate-600">
            <span class="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
            <span class="text-slate-300 text-[11px]">Đang nấu:</span>
            <strong class="text-brand-400 font-mono font-bold">${cookingCount}</strong>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-700/60 border border-slate-600">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="text-slate-300 text-[11px]">Chờ bê:</span>
            <strong class="text-emerald-400 font-mono font-bold">${readyCount}</strong>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-700/60 border border-slate-600">
            <span class="text-slate-300 text-[11px]">Bàn active:</span>
            <strong class="text-white font-mono font-bold">${allTickets.length}</strong>
          </div>
        </div>

        <!-- Clock & Station Filter with Badges -->
        <div class="flex items-center gap-3">
          <div class="px-2.5 py-1 bg-slate-950/80 border border-slate-700 rounded-xl font-mono text-xs font-bold text-amber-400 shadow-inner">
            🕒 ${currentTimeStr}
          </div>
          <div class="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs gap-1">
            ${['ALL', 'Bếp Nóng', 'Bếp Lạnh', 'Quầy Bar']
              .map(
                (st) => `
              <button
                type="button"
                onclick="kdsStationFilter = '${st}'; renderApp()"
                class="px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  kdsStationFilter === st
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }"
              >
                <span>${st === 'ALL' ? 'Tất cả' : st}</span>
                <span class="text-[10px] px-1.5 py-0.2 rounded-full ${
                  kdsStationFilter === st
                    ? 'bg-amber-800 text-amber-200'
                    : 'bg-slate-800 text-slate-400'
                }">${stationCounts[st] || 0}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      </div>

      <!-- KDS Main Tickets Grid -->
      <div class="flex-1 p-4 lg:p-6 overflow-y-auto">
        ${
          filteredTickets.length === 0
            ? `
          <div class="h-full flex flex-col items-center justify-center text-center p-12 text-slate-500">
            <div class="text-5xl mb-3">🍳</div>
            <h3 class="font-extrabold text-base text-slate-300">Không có đơn món nào đang chờ chế biến</h3>
            <p class="text-xs text-slate-500 mt-1 max-w-sm">Tất cả món đã ra bàn hoặc chuyển qua phân hệ POS để nhận gọi món mới cho bàn</p>
            <button onclick="State.setActiveView('POS_ORDER')" class="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md">
              Sang POS Gọi Thêm Món →
            </button>
          </div>
        `
            : `
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 items-start">
            ${filteredTickets
              .map((ticket) => {
                const isOverdue = ticket.isOverdue || ticket.elapsedMinutes > 15;
                const isCooking = ticket.items.some((i) => i.status === 'COOKING');
                const allReady = ticket.items.every((i) => i.status === 'READY' || i.status === 'SERVED');

                return `
                <div class="bg-slate-800 rounded-2xl border-2 transition-all shadow-lg flex flex-col overflow-hidden ${
                  isOverdue
                    ? 'border-red-500 shadow-red-500/20 ring-1 ring-red-500'
                    : allReady
                    ? 'border-emerald-500/80 shadow-emerald-500/10'
                    : isCooking
                    ? 'border-amber-500/90 shadow-amber-500/10'
                    : 'border-slate-700'
                }">
                  <!-- Ticket Header -->
                  <div class="p-3 bg-slate-800/95 border-b border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div class="flex items-center gap-1.5">
                        <span class="font-black text-base text-white">${ticket.tableName}</span>
                        <span class="text-[11px] font-semibold text-slate-400">(${ticket.area})</span>
                        ${isOverdue ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-black bg-red-600 text-white animate-pulse">QUÁ 15P</span>` : ''}
                      </div>
                      <div class="text-[11px] text-slate-400 font-mono mt-0.5">
                        ${ticket.orderCode} • Phục vụ: <strong>${ticket.server}</strong>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-mono text-xs font-bold ${isOverdue ? 'text-red-400' : 'text-amber-400'}">
                        ⏱ ${ticket.elapsedMinutes} phút
                      </div>
                      <span class="text-[10px] text-slate-400 font-medium">Vào: ${ticket.orderTime}</span>
                    </div>
                  </div>

                  <!-- Ticket Items List -->
                  <div class="p-3 space-y-2.5 divide-y divide-slate-700/60 max-h-80 overflow-y-auto">
                    ${ticket.displayItems
                      .map((item) => {
                        const isItemReady = item.status === 'READY' || item.status === 'SERVED';
                        const isItemCooking = item.status === 'COOKING';

                        return `
                        <div class="pt-2 first:pt-0">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex items-start gap-2 min-w-0">
                              <span class="w-6 h-6 rounded-lg bg-slate-700 text-amber-300 font-black text-xs flex items-center justify-center font-mono flex-shrink-0">
                                ${item.quantity}
                              </span>
                              <div class="min-w-0">
                                <h4 class="text-xs font-bold leading-tight ${isItemReady ? 'line-through text-slate-500' : 'text-slate-100'}">
                                  ${item.name}
                                </h4>
                                <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  ${
                                    item.isAddon
                                      ? `<span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-500/50 animate-pulse">⚡ GỌI THÊM ${item.addonTime ? `(${item.addonTime})` : ''}</span>`
                                      : ''
                                  }
                                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                    item.station === 'Quầy Bar'
                                      ? 'bg-purple-900/60 text-purple-200 border-purple-700/60'
                                      : item.station === 'Bếp Nóng'
                                      ? 'bg-amber-900/60 text-amber-200 border-amber-700/60'
                                      : 'bg-sky-900/60 text-sky-200 border-sky-700/60'
                                  }">
                                    ${item.station === 'Quầy Bar' ? '🍹' : item.station === 'Bếp Nóng' ? '🔥' : '🥗'} ${item.station}
                                  </span>
                                  <span class="text-[9px] font-bold ${
                                    isItemReady
                                      ? 'text-emerald-400'
                                      : isItemCooking
                                      ? 'text-amber-400'
                                      : 'text-sky-400'
                                  }">
                                    ${item.status === 'SERVED' ? '🍽️ Đã ra bàn' : isItemReady ? '✓ Đã xong' : isItemCooking ? '🔥 Đang nấu' : '⏳ Chờ nhận'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <!-- Chef Item Toggle Button -->
                            <div>
                              ${
                                !isItemReady
                                  ? `
                                <button
                                  type="button"
                                  onclick="State.updateKdsItemStatus('${ticket.id}', '${item.id}', '${isItemCooking ? 'READY' : 'COOKING'}')"
                                  class="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all shadow-sm ${
                                    isItemCooking
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                                  }"
                                >
                                  ${isItemCooking ? 'Xong món ✓' : 'Nấu ngay →'}
                                </button>
                              `
                                  : item.status !== 'SERVED'
                                  ? `
                                <button
                                  type="button"
                                  onclick="State.updateKdsItemStatus('${ticket.id}', '${item.id}', 'SERVED')"
                                  class="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-300"
                                  title="Đã bàn giao cho nhân viên phục vụ"
                                >
                                  Đã ra bàn 🍽️
                                </button>
                              `
                                  : `
                                <span class="text-[10px] font-bold text-slate-500 italic">Đã giao</span>
                              `
                              }
                            </div>
                          </div>

                          <!-- Cooking dietary note -->
                          ${
                            item.note
                              ? `
                            <div class="mt-1.5 p-1.5 bg-amber-950/40 rounded-lg border border-amber-800/40 text-[10px] text-amber-200 italic font-medium">
                              ⚠️ Ghi chú: ${item.note}
                            </div>
                          `
                              : ''
                          }
                        </div>
                      `;
                      })
                      .join('')}
                  </div>

                  <!-- Ticket Footer Action -->
                  <div class="p-2.5 bg-slate-850 border-t border-slate-700 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onclick="State.bumpKdsTicket('${ticket.id}', '${kdsStationFilter}')"
                      class="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      ${kdsStationFilter === 'ALL' ? `✓ Hoàn Tất Toàn Bộ Vé (${ticket.tableName})` : `✓ Hoàn Tất Món [${kdsStationFilter}] (${ticket.tableName})`}
                    </button>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        `
        }
      </div>

      <!-- KDS Bottom Chef Bar -->
      <div class="p-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2.5 text-slate-400">
          <div class="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold">
            NT
          </div>
          <div>
            <span class="font-bold text-slate-200">Bếp Trưởng: Nguyễn Văn Tuấn</span>
            <span class="text-[10px] text-slate-500 block">Ca trực trưa (10:00 - 15:00) • Hệ thống KDS Online</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            onclick="isKitchenOutStockModalOpen = true; renderApp()"
            class="px-3.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <span>⚠️ Báo Tạm Hết Món (86)</span>
          </button>

          <button
            onclick="State.recallKdsTicket()"
            class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            ↺ Thu Hồi Vé Vừa Xong (${State.bumpedTickets.length})
          </button>
        </div>
      </div>
    </div>
  `;
}

function attachKdsEvents() {
  // Attached via inline handlers
}

// --- 3. CASHIER VIEW ---
function renderCashierHTML() {
  const activeTables = State.getActiveTablesWithBills();

  // If currently selected table has no items, but other tables have bills, switch to the first active table
  if (State.orderItems.length === 0 && activeTables.length > 0) {
    const firstActive = activeTables[0];
    State.currentTableId = firstActive.id;
    State.tableInfo = { ...firstActive };
    State.orderItems = JSON.parse(JSON.stringify(firstActive.items || []));
  }

  const billing = State.getBilling();

  const quickDenominations = [
    { label: '100k', value: 100000 },
    { label: '200k', value: 200000 },
    { label: '500k', value: 500000 },
    { label: '1.000k', value: 1000000 },
    { label: 'Đúng số tiền', value: billing.total }
  ];

  return `
    <div class="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4">
      <!-- Subheader -->
      <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div class="flex items-center gap-3">
          <button
            onclick="State.setActiveView('POS_ORDER')"
            class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            ← Quay lại POS Order
          </button>
          <div class="h-5 w-px bg-slate-200"></div>
          <div>
            <h2 class="text-xs font-extrabold text-slate-900">Quầy Thu Ngân • Danh Sách Hóa Đơn Tạm & Thanh Toán</h2>
            <p class="text-[11px] text-slate-500">Mô hình Phục vụ tại bàn (Thanh toán sau) • Đối soát hóa đơn tạm và xử lý thanh toán</p>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span class="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
            🟢 Đang có ${activeTables.length} bàn mở hóa đơn tạm
          </span>
          <span>Thu ngân: <strong>${State.tableInfo.server || 'Trần Minh Tâm'}</strong></span>
        </div>
      </div>

      <!-- Section: Danh Sách Bàn Có Hóa Đơn Tạm Cần Thanh Toán -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <h3 class="text-xs font-black uppercase tracking-wider text-slate-800">
              Danh Sách Bàn Có Hóa Đơn Tạm Cần Thanh Toán
            </h3>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
              ${activeTables.length} bàn đang phục vụ
            </span>
          </div>
          <span class="text-[11px] text-slate-400 font-medium">
            (Bấm vào bất kỳ bàn nào bên dưới để mở hóa đơn tạm của bàn đó)
          </span>
        </div>

        ${
          activeTables.length === 0
            ? `
          <div class="py-8 text-center text-slate-400">
            <p class="text-xs font-bold text-slate-600">Hiện tại không có bàn nào có hóa đơn tạm</p>
            <p class="text-[11px] text-slate-400 mt-0.5">Tất cả bàn đều trống hoặc đã hoàn tất thanh toán giải phóng bàn.</p>
            <button
              onclick="State.setActiveView('POS_ORDER')"
              class="mt-3 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Mở Màn Hình POS Gọi Món Cho Khách Mới
            </button>
          </div>
        `
            : `
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            ${activeTables
              .map((t) => {
                const isSelected = t.id === State.currentTableId;
                const tBilling = State.getTableBilling(t.id);
                const hasCooking = t.items.some((i) => i.status === 'COOKING');
                const hasQueued = t.items.some((i) => i.status === 'QUEUED');
                const allServed = t.items.every((i) => i.status === 'SERVED');

                return `
                <div
                  onclick="State.switchTable('${t.id}'); renderApp()"
                  class="group relative p-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-white hover:border-brand-400 hover:bg-slate-50 shadow-xs'
                  }"
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <div class="flex items-center gap-1.5">
                      <span class="font-extrabold text-sm text-slate-900 group-hover:text-brand-700">${t.number}</span>
                      <span class="text-[10px] text-slate-400 font-medium font-mono">${t.orderCode}</span>
                    </div>
                    ${
                      isSelected
                        ? `
                      <span class="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-600 text-white shadow-xs animate-pulse">
                        ✓ Đang chọn
                      </span>
                    `
                        : `
                      <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 group-hover:bg-brand-50 group-hover:text-brand-700">
                        Bấm để xem
                      </span>
                    `
                    }
                  </div>

                  <div class="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>${t.area}</span>
                    <span>${t.guests || 2} khách</span>
                  </div>

                  <div class="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div class="text-[10px] font-bold">
                      ${
                        allServed
                          ? `
                        <span class="text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">🍽️ Đã ra bàn đủ</span>
                      `
                          : hasCooking
                          ? `
                        <span class="text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">🔥 Đang nấu (${tBilling.itemCount} món)</span>
                      `
                          : hasQueued
                          ? `
                        <span class="text-sky-700 bg-sky-100/80 px-1.5 py-0.5 rounded border border-sky-200">⏳ Có món chờ gửi</span>
                      `
                          : `
                        <span class="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">${tBilling.itemCount} món</span>
                      `
                      }
                    </div>
                    <span class="text-xs font-black text-brand-700 font-mono-nums">
                      ${formatVND(tBilling.total)} đ
                    </span>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        `
        }
      </div>

      ${
        State.orderItems.length === 0
          ? `
        <div class="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p class="text-xs font-semibold text-slate-500">Vui lòng chọn 1 bàn ở danh sách trên để xem chi tiết hóa đơn tạm.</p>
        </div>
      `
          : `
        <!-- 2 Columns Grid: Left Bill + Right Payment -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <!-- Left: Pre-bill receipt (42%) -->
          <div class="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div class="text-center pb-3 border-b border-slate-200">
              <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase mb-1.5">
                <span>📄 HÓA ĐƠN TẠM TÍNH (PRE-BILL)</span>
              </div>
              <h4 class="font-extrabold text-sm uppercase tracking-wider text-slate-900">Nhà Hàng Gia Vị Việt</h4>
              <p class="text-[11px] text-slate-500">123 Phố Huế, P. Hàng Bài, Q. Hoàn Kiếm, Hà Nội</p>
              <p class="text-[11px] text-slate-500 font-mono">Hotline: 1900 6868</p>

              <div class="mt-2.5 pt-2 border-t border-dashed border-slate-200 text-left text-xs space-y-1 text-slate-600 font-medium">
                <div class="flex justify-between">
                  <span>Bàn: <strong class="text-brand-800 text-sm font-bold">${State.tableInfo.number || 'Bàn ' + State.tableInfo.id}</strong> (${State.tableInfo.area})</span>
                  <span>Khách: <strong>${State.tableInfo.guests || 2}</strong></span>
                </div>
                <div class="flex justify-between">
                  <span>Mã hóa đơn tạm: <strong class="font-mono text-brand-700">${State.tableInfo.orderCode}</strong></span>
                  <span>Giờ vào: <strong>${State.tableInfo.checkIn || '12:15'}</strong></span>
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
                        <div class="flex items-center gap-1.5 flex-wrap">
                          <span>${item.name}</span>
                          ${
                            item.isAddon
                              ? `<span class="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">⚡ Gọi thêm</span>`
                              : ''
                          }
                        </div>
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
                <span class="text-[11px] font-bold uppercase tracking-wider text-brand-900 block">Tổng Tạm Tính:</span>
                <span class="text-[10px] text-slate-500 italic">(Đã bao gồm VAT & phí PV)</span>
              </div>
              <span class="text-xl font-black text-brand-700 font-mono-nums">${formatVND(billing.total)} đ</span>
            </div>

            <div class="grid grid-cols-2 gap-2 mt-4">
              <button
                onclick="isPreBillModalOpen = true; renderApp()"
                class="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              >
                🖨️ In Phiếu Tạm Tính
              </button>

              <button
                onclick="State.setActiveView('POS_ORDER')"
                class="py-2.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                title="Khách muốn gọi thêm món cho bàn này"
              >
                ➕ Khách Gọi Thêm Món
              </button>
            </div>
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
      `
      }
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
            <div class="px-3 py-2 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200 cursor-pointer shadow-xs">
              🍴 Quản Lý Thực Đơn
            </div>
            <div class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors" onclick="isTableModalOpen = true; renderApp()">
              🪑 Sơ Đồ Bàn & Phòng
            </div>
            <div class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors" onclick="isInventoryModalOpen = true; renderApp()">
              📦 Kho Nguyên Liệu
            </div>
            <div class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors" onclick="isStaffModalOpen = true; renderApp()">
              👥 Nhân Sự & Phân Quyền
            </div>
            <div class="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors" onclick="isReportModalOpen = true; renderApp()">
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
            <p class="text-xs text-slate-500 mt-0.5">Thêm món, cập nhật giá, bật/tắt còn-hết hàng đồng bộ tức thời với máy POS & KDS</p>
          </div>
          <button
            type="button"
            onclick="openDishDrawer(null)"
            class="py-2 px-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            + Thêm Món Mới
          </button>
        </div>

        <!-- 4 Clickable KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <div
            onclick="menuStatusFilter = 'AVAILABLE'; renderApp()"
            class="p-4 rounded-2xl border bg-white shadow-xs cursor-pointer hover:border-brand-500 hover:shadow-md transition-all group ${
              menuStatusFilter === 'AVAILABLE' ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200'
            }"
            title="Bấm để lọc món đang bán"
          >
            <span class="text-xs font-semibold text-slate-500 block group-hover:text-brand-600">Tổng số món đang bán ▾</span>
            <div class="text-base font-extrabold text-slate-900 mt-1">${availableCount} / ${totalDishes} món</div>
            <span class="text-[11px] text-slate-500 font-medium">${outOfStockCount} món tạm ngưng</span>
          </div>

          <div
            onclick="isCategoryModalOpen = true; renderApp()"
            class="p-4 rounded-2xl border bg-white shadow-xs cursor-pointer hover:border-brand-500 hover:shadow-md transition-all group"
            title="Bấm để mở quản lý nhóm thực đơn"
          >
            <span class="text-xs font-semibold text-slate-500 block group-hover:text-brand-600">Số nhóm thực đơn ▾</span>
            <div class="text-base font-extrabold text-slate-900 mt-1">${State.categories.length - 1} nhóm</div>
            <span class="text-[11px] text-brand-600 font-semibold underline">Chạm để chỉnh sửa</span>
          </div>

          <div
            onclick="menuStatusFilter = 'OUT_OF_STOCK'; renderApp()"
            class="p-4 rounded-2xl border bg-white shadow-xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group ${
              menuStatusFilter === 'OUT_OF_STOCK' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200'
            }"
            title="Bấm để lọc món tạm hết hàng"
          >
            <span class="text-xs font-semibold text-slate-500 block group-hover:text-amber-700">Món tạm hết hàng ▾</span>
            <div class="text-base font-extrabold text-amber-700 mt-1">${outOfStockCount} món</div>
            <span class="text-[11px] text-slate-500 font-medium">Báo hết từ Bếp hoặc Kho</span>
          </div>

          <div
            onclick="openDishDrawer('${bestSeller.id}')"
            class="p-4 rounded-2xl border bg-white shadow-xs cursor-pointer hover:border-brand-500 hover:shadow-md transition-all group"
            title="Bấm để chỉnh sửa món bán chạy nhất"
          >
            <span class="text-xs font-semibold text-slate-500 block group-hover:text-brand-600">Món Bán Chạy Nhất ▾</span>
            <div class="text-base font-extrabold text-slate-900 mt-1 truncate">${bestSeller.name}</div>
            <span class="text-[11px] text-slate-500 font-medium">${bestSeller.salesCount} lượt gọi tháng này</span>
          </div>
        </div>

        <!-- Filter Toolbar & Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
            <div class="flex items-center gap-2 flex-1 max-w-md">
              <input
                id="menu-search-input"
                type="text"
                placeholder="Tìm món theo tên hoặc mã SKU..."
                value="${menuSearch}"
                oninput="handleMenuSearchInput(event)"
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
              type="button"
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
                (cat, idx) => `
              <button
                type="button"
                onclick="selectMenuCategory(${idx})"
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
                          title="Bấm để chuyển đổi trạng thái (đồng bộ tức thời sang POS & KDS)"
                        >
                          ${!isOutOfStock ? '● Đang bán' : '✕ Tạm hết'}
                        </button>
                      </td>
                      <td class="py-3 px-4 text-right">
                        <button type="button" onclick="openDishDrawer('${dish.id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-bold text-xs border border-slate-200 transition-all" title="Chỉnh sửa món">✎ Sửa</button>
                        <button type="button" onclick="confirmDeleteDish('${dish.id}')" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs border border-red-200 ml-1.5 transition-all" title="Xóa món">🗑 Xóa</button>
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
    ${renderTableModalHTML()}
    ${renderKitchenOutStockModalHTML()}
    ${renderInventoryModalHTML()}
    ${renderStaffModalHTML()}
    ${renderReportModalHTML()}
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
          <button
            type="button"
            onclick="isDrawerOpen = false; renderApp()"
            class="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all"
          >
            Hủy
          </button>
          <button
            type="button"
            onclick="handleDrawerSubmit(event)"
            class="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Lưu Món
          </button>
        </div>
      </div>
    </div>
  `;
}

function handleDrawerSubmit(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('drawer-name')?.value.trim();
  if (!name) {
    State.showToast('Vui lòng nhập tên món ăn!', 'warning');
    document.getElementById('drawer-name')?.focus();
    return;
  }
  const sku = document.getElementById('drawer-sku')?.value.trim() || ('MON-' + Math.floor(100 + Math.random() * 900));
  const unit = document.getElementById('drawer-unit')?.value.trim() || 'Phần';
  const category = document.getElementById('drawer-cat')?.value || 'Món Khai Vị';
  const price = Number(document.getElementById('drawer-price')?.value) || 0;
  const cost = Number(document.getElementById('drawer-cost')?.value) || 0;
  const image = document.getElementById('drawer-image')?.value.trim() || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
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
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div class="text-center pb-3 border-b border-dashed border-slate-300">
          <div class="inline-block px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-black uppercase mb-1 border border-amber-300">
            HÓA ĐƠN TẠM TÍNH (PRE-BILL)
          </div>
          <h4 class="font-black text-sm uppercase text-slate-900">NHÀ HÀNG GIA VỊ VIỆT</h4>
          <p class="text-xs text-slate-500">123 Phố Huế, Q. Hoàn Kiếm, Hà Nội • Hotline: 1900 6868</p>
          <div class="mt-2 text-left text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium">
            <div class="flex justify-between">
              <span>Bàn: <strong class="text-brand-800">${State.tableInfo.number || 'Bàn ' + State.tableInfo.id}</strong> (${State.tableInfo.area})</span>
              <span>Khách: <strong>${State.tableInfo.guests || 2}</strong></span>
            </div>
            <div class="flex justify-between">
              <span>Mã hóa đơn tạm: <strong class="font-mono text-brand-700">${State.tableInfo.orderCode}</strong></span>
              <span>Giờ vào: <strong>${State.tableInfo.checkIn || '12:15'}</strong></span>
            </div>
          </div>
        </div>
        <div class="py-3 space-y-1.5 text-xs border-b border-dashed border-slate-300 max-h-52 overflow-y-auto">
          ${State.orderItems
            .map(
              (item) => `
            <div class="flex justify-between items-start">
              <div>
                <span class="font-semibold text-slate-800">${item.name} x ${item.quantity}</span>
                ${item.isAddon ? `<span class="text-[9px] font-bold text-amber-700 block">• Gọi thêm</span>` : ''}
                ${item.note ? `<span class="text-[10px] text-slate-400 italic block">• ${item.note}</span>` : ''}
              </div>
              <span class="font-mono-nums font-bold text-slate-900">${formatVND(item.price * item.quantity)} đ</span>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="py-2.5 text-xs space-y-1 border-b border-dashed border-slate-300 text-slate-600">
          <div class="flex justify-between">
            <span>Tiền món:</span>
            <span class="font-mono-nums font-bold">${formatVND(billing.subtotal)} đ</span>
          </div>
          ${
            billing.voucherDiscount > 0
              ? `
            <div class="flex justify-between text-emerald-600">
              <span>Khuyến mãi (${State.appliedVoucher?.label}):</span>
              <span class="font-mono-nums">-${formatVND(billing.voucherDiscount)} đ</span>
            </div>
          `
              : ''
          }
          ${
            billing.pointsDiscount > 0
              ? `
            <div class="flex justify-between text-emerald-600">
              <span>Trừ điểm VIP:</span>
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
        <div class="pt-3 flex justify-between items-baseline text-xs">
          <span class="text-slate-500 uppercase font-black text-[11px]">Tổng cộng tạm tính:</span>
          <span class="font-black text-brand-700 text-xl font-mono-nums">${formatVND(billing.total)} đ</span>
        </div>
        <p class="text-[10px] text-slate-400 italic text-center mt-2">
          (Quý khách vui lòng kiểm tra lại món ăn trước khi nhân viên xuất hóa đơn thanh toán)
        </p>
        <div class="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button onclick="isPreBillModalOpen = false; renderApp()" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Đóng</button>
          <button onclick="window.print(); isPreBillModalOpen = false; renderApp()" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold">In Phiếu</button>
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

function renderTableModalHTML() {
  if (!isTableModalOpen) return '';

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 class="font-extrabold text-sm text-slate-900">Sơ Đồ Bàn & Điều Phối Chỗ Ngồi</h3>
            <p class="text-xs text-slate-500">Chạm vào bàn để mở order hoặc chuyển bàn phục vụ</p>
          </div>
          <button onclick="isTableModalOpen = false; renderApp()" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="my-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-1">
          ${State.tables
            .map((t) => {
              const isCurrent = t.id === State.currentTableId;
              const isOccupied = t.status === 'OCCUPIED';
              const isReserved = t.status === 'RESERVED';
              const isVacant = t.status === 'VACANT';
              const tBilling = isOccupied ? State.getTableBilling(t.id) : null;

              return `
              <div
                onclick="State.switchTable('${t.id}'); isTableModalOpen = false; renderApp()"
                class="p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  isCurrent
                    ? 'border-brand-600 bg-brand-50/60 shadow-md ring-2 ring-brand-500/20'
                    : isOccupied
                    ? 'border-amber-300 bg-amber-50/40 hover:border-amber-500 hover:bg-amber-50'
                    : isReserved
                    ? 'border-blue-300 bg-blue-50/40 hover:border-blue-500'
                    : 'border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/20'
                }"
              >
                <div class="flex items-center justify-between">
                  <span class="font-black text-sm text-slate-900">${t.number}</span>
                  <span class="text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isOccupied
                      ? 'bg-amber-100 text-amber-800'
                      : isReserved
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }">
                    ${isOccupied ? 'Có khách' : isReserved ? 'Đặt trước' : 'Bàn trống'}
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">${t.area} • Sức chứa: ${t.capacity} người</div>
                <div class="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600 flex justify-between font-medium">
                  <span>${isOccupied && tBilling ? `${t.guests} khách • ${formatVND(tBilling.total)}đ` : isReserved ? t.checkIn : 'Sẵn sàng đón khách'}</span>
                  <span class="font-mono font-bold text-brand-700">${t.orderCode || ''}</span>
                </div>
              </div>
            `;
            })
            .join('')}
        </div>

        <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <div class="flex items-center gap-3">
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Trống</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Đang phục vụ</span>
            <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Đặt trước</span>
          </div>
          <button onclick="isTableModalOpen = false; renderApp()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl">
            Đóng
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderKitchenOutStockModalHTML() {
  if (!isKitchenOutStockModalOpen) return '';

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-slate-900 text-slate-100 rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-700 flex flex-col max-h-[85vh]">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="font-extrabold text-sm text-amber-400">Báo Hết Món Nhanh (Trạm Bếp & Bar)</h3>
            <p class="text-xs text-slate-400">Bấm để chuyển trạng thái còn/hết, đồng bộ tức thời sang POS sảnh</p>
          </div>
          <button onclick="isKitchenOutStockModalOpen = false; renderApp()" class="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        <div class="my-3 divide-y divide-slate-800 overflow-y-auto max-h-96 pr-1">
          ${State.dishes
            .map((dish) => {
              const isOut = dish.status === 'out_of_stock';
              return `
              <div class="py-2.5 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 min-w-0">
                  <img src="${dish.image}" alt="${dish.name}" class="w-9 h-9 rounded-lg object-cover border border-slate-700 flex-shrink-0 ${isOut ? 'grayscale opacity-50' : ''}" />
                  <div class="min-w-0">
                    <h5 class="text-xs font-bold leading-snug truncate ${isOut ? 'text-slate-500 line-through' : 'text-slate-100'}">${dish.name}</h5>
                    <span class="text-[10px] text-slate-400 font-mono">#${dish.sku} • ${dish.category}</span>
                  </div>
                </div>

                <button
                  onclick="State.toggleDishStatus('${dish.id}'); renderApp()"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0 ${
                    isOut
                      ? 'bg-red-600 hover:bg-red-500 text-white ring-2 ring-red-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }"
                >
                  ${isOut ? '✕ Đang Hết Hàng' : '✓ Đang Còn Món'}
                </button>
              </div>
            `;
            })
            .join('')}
        </div>

        <div class="pt-3 border-t border-slate-800 flex justify-end">
          <button onclick="isKitchenOutStockModalOpen = false; renderApp()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl">
            Đóng Bảng
          </button>
        </div>
      </div>
    </div>
  `;
}

// --- INVENTORY / KHO NGUYÊN LIỆU MODAL (Bám sát inventory_items trong DB) ---
function renderInventoryModalHTML() {
  if (!isInventoryModalOpen) return '';

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-sm text-slate-900">📦 Quản Lý Kho & Nguyên Liệu Thực Phẩm</h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">DB: inventory_items</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Theo dõi định mức tồn kho, tự động cảnh báo nguyên liệu sắp hết cho bếp</p>
          </div>
          <button onclick="isInventoryModalOpen = false; renderApp()" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="my-3 overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th class="py-2.5 px-3">Tên Nguyên Liệu & Mã</th>
                <th class="py-2.5 px-3 text-right">Tồn Kho Hiện Tại</th>
                <th class="py-2.5 px-3 text-right">Định Mức Tối Thiểu</th>
                <th class="py-2.5 px-3 text-center">Trạng Thái</th>
                <th class="py-2.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium">
              ${MOCK_INVENTORY.map((inv) => {
                const isLow = inv.status === 'LOW_STOCK' || inv.stock <= inv.minStock;
                return `
                <tr class="hover:bg-slate-50 ${isLow ? 'bg-amber-50/30' : ''}">
                  <td class="py-2.5 px-3">
                    <div class="font-bold text-slate-900">${inv.name}</div>
                    <span class="text-[10px] text-slate-400 font-mono">#${inv.sku}</span>
                  </td>
                  <td class="py-2.5 px-3 text-right font-bold ${isLow ? 'text-red-600' : 'text-slate-800'} font-mono-nums">
                    ${inv.stock} ${inv.unit}
                  </td>
                  <td class="py-2.5 px-3 text-right text-slate-500 font-mono-nums">
                    ${inv.minStock} ${inv.unit}
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${
                      isLow
                        ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }">
                      ${isLow ? '⚠️ Sắp hết' : '✓ Ổn định'}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onclick="inv.stock += 5; inv.status = 'NORMAL'; State.showToast('Đã ghi nhận nhập thêm 5 ' + '${inv.unit}' + ' ${inv.name}', 'success'); renderApp();"
                      class="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[11px] border border-brand-200 transition-all"
                    >
                      + Nhập thêm 5${inv.unit}
                    </button>
                  </td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>* Dữ liệu liên kết định lượng qua bảng <code>dish_recipes</code> để trừ kho khi order.</span>
          <button onclick="isInventoryModalOpen = false; renderApp()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl">
            Đóng Bảng Kho
          </button>
        </div>
      </div>
    </div>
  `;
}

// --- STAFF / NHÂN SỰ & PHÂN QUYỀN MODAL (Bám sát users & roles trong DB) ---
function renderStaffModalHTML() {
  if (!isStaffModalOpen) return '';

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-sm text-slate-900">👥 Nhân Sự & Phân Quyền Vận Hành (RBAC)</h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-800 border border-brand-200">DB: users & roles</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Danh sách nhân sự đang trong ca trực hôm nay (Ca Trưa 10:00 - 15:00)</p>
          </div>
          <button onclick="isStaffModalOpen = false; renderApp()" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="my-3 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto p-1">
          ${MOCK_STAFF.map((staff) => `
            <div class="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-brand-500 transition-all flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                ${staff.avatar}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-xs text-slate-900 truncate">${staff.name}</h4>
                  <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                  </span>
                </div>
                <div class="text-[11px] font-semibold text-brand-700 mt-0.5">${staff.roleLabel}</div>
                <div class="text-[10px] text-slate-400 font-mono mt-0.5">@${staff.username} • SĐT: ${staff.phone}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>* Phân quyền RBAC kiểm soát quyền duyệt hủy món và xuất báo cáo doanh thu.</span>
          <button onclick="isStaffModalOpen = false; renderApp()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl">
            Đóng Bảng Nhân Sự
          </button>
        </div>
      </div>
    </div>
  `;
}

// --- REPORT / BÁO CÁO DOANH THU MODAL (Bám sát invoices & payments trong DB) ---
function renderReportModalHTML() {
  if (!isReportModalOpen) return '';

  return `
    <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-base text-slate-900">📊 Báo Cáo Doanh Thu & Hiệu Quả Ca Trực</h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">DB: invoices</span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5">Dữ liệu tổng hợp thời gian thực từ các hóa đơn đã thanh toán</p>
          </div>
          <button onclick="isReportModalOpen = false; renderApp()" class="text-slate-400 hover:text-slate-600 p-1">✕</button>
        </div>

        <div class="my-4 space-y-4 overflow-y-auto pr-1">
          <!-- 4 Metrics -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 bg-brand-50 rounded-xl border border-brand-200">
              <span class="text-[11px] font-bold text-brand-900 block">Doanh Thu Hôm Nay</span>
              <div class="text-base font-black text-brand-700 mt-1 font-mono-nums">${formatVND(MOCK_REPORTS.todayRevenue)} đ</div>
            </div>
            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span class="text-[11px] font-bold text-emerald-900 block">Hóa Đơn Hoàn Tất</span>
              <div class="text-base font-black text-emerald-700 mt-1 font-mono-nums">${MOCK_REPORTS.completedOrders} đơn</div>
            </div>
            <div class="p-3 bg-sky-50 rounded-xl border border-sky-200">
              <span class="text-[11px] font-bold text-sky-900 block">Giá Trị Đơn TB</span>
              <div class="text-base font-black text-sky-700 mt-1 font-mono-nums">${formatVND(MOCK_REPORTS.averageCheck)} đ</div>
            </div>
            <div class="p-3 bg-purple-50 rounded-xl border border-purple-200">
              <span class="text-[11px] font-bold text-purple-900 block">Bàn Đang Ăn</span>
              <div class="text-base font-black text-purple-700 mt-1 font-mono-nums">${MOCK_REPORTS.activeTables} bàn</div>
            </div>
          </div>

          <!-- Payment Methods Breakdown -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <h4 class="font-bold text-slate-800 mb-2">Tỷ lệ theo phương thức thanh toán:</h4>
            <div class="space-y-2">
              <div>
                <div class="flex justify-between mb-1 text-slate-600 font-medium">
                  <span>📲 VietQR Chuyển Khoản (55%)</span>
                  <span class="font-bold text-slate-900 font-mono-nums">${formatVND(MOCK_REPORTS.paymentBreakdown.vietqr.amount)} đ (${MOCK_REPORTS.paymentBreakdown.vietqr.count} đơn)</span>
                </div>
                <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div class="bg-sky-500 h-full rounded-full" style="width: 55%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1 text-slate-600 font-medium">
                  <span>💵 Tiền Mặt (Cash) (30%)</span>
                  <span class="font-bold text-slate-900 font-mono-nums">${formatVND(MOCK_REPORTS.paymentBreakdown.cash.amount)} đ (${MOCK_REPORTS.paymentBreakdown.cash.count} đơn)</span>
                </div>
                <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div class="bg-emerald-500 h-full rounded-full" style="width: 30%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between mb-1 text-slate-600 font-medium">
                  <span>💳 Thẻ Ngân Hàng POS (15%)</span>
                  <span class="font-bold text-slate-900 font-mono-nums">${formatVND(MOCK_REPORTS.paymentBreakdown.card.amount)} đ (${MOCK_REPORTS.paymentBreakdown.card.count} đơn)</span>
                </div>
                <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div class="bg-brand-500 h-full rounded-full" style="width: 15%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Selling Dishes -->
          <div class="p-4 bg-white rounded-2xl border border-slate-200 text-xs">
            <h4 class="font-bold text-slate-800 mb-2">Món ăn mang lại doanh thu cao nhất:</h4>
            <div class="divide-y divide-slate-100">
              ${MOCK_REPORTS.topDishes.map((td, idx) => `
                <div class="py-2 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-black text-[11px] flex items-center justify-center">${idx + 1}</span>
                    <span class="font-bold text-slate-900">${td.name}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-black text-brand-700 font-mono-nums">${formatVND(td.revenue)} đ</span>
                    <span class="text-[10px] text-slate-400 block">${td.sold} lượt gọi</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onclick="window.print();"
            class="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold"
          >
            🖨️ In Báo Cáo Ca
          </button>
          <button
            type="button"
            onclick="isReportModalOpen = false; renderApp()"
            class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Đóng Báo Cáo
          </button>
        </div>
      </div>
    </div>
  `;
}

