/**
 * State Management for Restaurant POS & Back Office
 * Dispatches state updates and computes financial totals
 */

const State = {
  activeView: 'POS_ORDER', // 'POS_ORDER' | 'CASHIER' | 'MENU_ADMIN'
  dishes: [...INITIAL_DISHES],
  categories: [...INITIAL_CATEGORIES],
  orderItems: [...INITIAL_ORDER_ITEMS],
  tableInfo: { ...MOCK_TABLE },
  appliedVoucher: MOCK_VOUCHERS[0], // VIPGOLD10 by default
  customer: MOCK_CUSTOMERS[0], // Nguyen Thi Mai (VIP Gold)
  useLoyaltyPoints: true,
  paymentMethod: 'CASH', // 'CASH' | 'VIETQR' | 'CARD' | 'WALLET'
  cashReceived: 1000000,
  listeners: [],

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  },

  notify() {
    this.listeners.forEach((listener) => listener());
  },

  setActiveView(view) {
    this.activeView = view;
    this.notify();
  },

  // --- POS Order Actions ---
  addToOrder(dish) {
    if (dish.status === 'out_of_stock') {
      this.showToast(`Món "${dish.name}" hiện đang hết hàng!`, 'warning');
      return;
    }
    const existing = this.orderItems.find((item) => item.dishId === dish.id);
    if (existing) {
      existing.quantity += 1;
      this.showToast(`Đã tăng số lượng "${dish.name}" (+1)`);
    } else {
      this.orderItems.push({
        dishId: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: 1,
        note: '',
        image: dish.image
      });
      this.showToast(`Đã thêm "${dish.name}" vào đơn gọi món!`);
    }
    this.notify();
  },

  updateQuantity(dishId, delta) {
    const item = this.orderItems.find((i) => i.dishId === dishId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      this.orderItems = this.orderItems.filter((i) => i.dishId !== dishId);
    }
    this.notify();
  },

  updateItemNote(dishId, note) {
    const item = this.orderItems.find((i) => i.dishId === dishId);
    if (item) {
      item.note = note;
      this.showToast('Đã lưu ghi chú cho món ăn');
      this.notify();
    }
  },

  removeOrderItem(dishId) {
    this.orderItems = this.orderItems.filter((i) => i.dishId !== dishId);
    this.showToast('Đã xóa món khỏi đơn', 'info');
    this.notify();
  },

  clearOrder() {
    this.orderItems = [];
    this.showToast('Đã làm mới giỏ gọi món', 'info');
    this.notify();
  },

  sendOrderToKitchen() {
    if (this.orderItems.length === 0) {
      this.showToast('Giỏ hàng trống, vui lòng chọn món trước!', 'warning');
      return;
    }
    this.showToast(`Đã gửi ${this.orderItems.length} món xuống Bếp (KDS) thành công!`, 'success');
  },

  // --- Menu Management Actions (Back Office) ---
  toggleDishStatus(dishId) {
    const dish = this.dishes.find((d) => d.id === dishId);
    if (dish) {
      dish.status = dish.status === 'available' ? 'out_of_stock' : 'available';
      dish.badge = dish.status === 'out_of_stock' ? 'Tạm hết' : dish.bestSeller ? 'Best Seller' : '';
      this.showToast(
        `Món "${dish.name}" chuyển sang: ${dish.status === 'available' ? 'Đang bán' : 'Tạm hết hàng'}`,
        'info'
      );
      this.notify();
    }
  },

  addDish(newDish) {
    this.dishes.unshift({
      ...newDish,
      id: `dish-${Date.now()}`,
      salesCount: 0
    });
    this.showToast(`Đã thêm món "${newDish.name}" vào thực đơn!`, 'success');
    this.notify();
  },

  updateDish(id, updatedFields) {
    const index = this.dishes.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.dishes[index] = { ...this.dishes[index], ...updatedFields };
      this.showToast(`Đã lưu thay đổi món "${this.dishes[index].name}"`, 'success');
      this.notify();
    }
  },

  deleteDish(id) {
    const dish = this.dishes.find((d) => d.id === id);
    if (dish) {
      this.dishes = this.dishes.filter((d) => d.id !== id);
      this.showToast(`Đã xóa món "${dish.name}"`, 'info');
      this.notify();
    }
  },

  addCategory(categoryName) {
    if (this.categories.includes(categoryName)) {
      this.showToast('Nhóm món đã tồn tại!', 'warning');
      return;
    }
    this.categories.push(categoryName);
    this.showToast(`Đã tạo nhóm món "${categoryName}"!`, 'success');
    this.notify();
  },

  // --- Billing Calculations ---
  getBilling() {
    const subtotal = this.orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    let voucherDiscount = 0;
    if (this.appliedVoucher) {
      if (this.appliedVoucher.discountPercent > 0) {
        voucherDiscount = Math.round((subtotal * this.appliedVoucher.discountPercent) / 100);
      } else if (this.appliedVoucher.discountAmount > 0) {
        voucherDiscount = this.appliedVoucher.discountAmount;
      }
    }

    let pointsDiscount = 0;
    if (this.useLoyaltyPoints && this.customer) {
      pointsDiscount = this.customer.maxRedeemPoints * 1000; // 50k
    }

    const totalDiscount = voucherDiscount + pointsDiscount;
    const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
    const serviceFee = Math.round(discountedSubtotal * 0.05);
    const vat = Math.round((discountedSubtotal + serviceFee) * 0.08);
    const rawTotal = discountedSubtotal + serviceFee + vat;
    const total = Math.round(rawTotal / 1000) * 1000;
    const change = Math.max(0, this.cashReceived - total);

    return {
      subtotal,
      voucherDiscount,
      pointsDiscount,
      totalDiscount,
      serviceFee,
      vat,
      total,
      change
    };
  },

  resetTableAfterPayment() {
    this.orderItems = [];
    this.cashReceived = 1000000;
    this.activeView = 'POS_ORDER';
    this.showToast('Đã hoàn tất thanh toán & giải phóng Bàn 05!', 'success');
    this.notify();
  },

  // Toast Notification
  showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast-container');
    if (!toastEl) return;

    const bgColors = {
      success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      warning: 'bg-amber-50 border-amber-300 text-amber-900',
      info: 'bg-sky-50 border-sky-300 text-sky-900'
    };

    const icons = {
      success: `<svg class="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
      warning: `<svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
      info: `<svg class="w-4 h-4 text-sky-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
    };

    toastEl.innerHTML = `
      <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold ${bgColors[type] || bgColors.info} animate-bounce">
        ${icons[type] || icons.info}
        <span>${message}</span>
      </div>
    `;

    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toastEl.innerHTML = '';
    }, 3500);
  }
};
