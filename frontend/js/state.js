/**
 * State Management for Restaurant POS & Back Office
 * Dispatches state updates and computes financial totals
 */

const State = {
  activeView: 'POS_ORDER', // 'POS_ORDER' | 'KDS' | 'CASHIER' | 'MENU_ADMIN'
  dishes: [...INITIAL_DISHES],
  categories: [...INITIAL_CATEGORIES],
  tables: [...MOCK_TABLES],
  currentTableId: '05',
  tableInfo: { ...MOCK_TABLE },
  orderItems: [...INITIAL_ORDER_ITEMS],
  kdsTickets: [...INITIAL_KDS_TICKETS],
  kdsFilter: 'ALL', // 'ALL' | 'Bếp Nóng' | 'Bếp Lạnh' | 'Quầy Bar'
  bumpedTickets: [],
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

  // Helper: Determine kitchen prep station
  getStationForDish(dishOrName, category = '') {
    const name = typeof dishOrName === 'string' ? dishOrName : dishOrName?.name || '';
    const cat = typeof dishOrName === 'object' ? dishOrName?.category || category : category;
    if (
      cat === 'Đồ Uống & Rượu' ||
      name.includes('Trà') ||
      name.includes('Bia') ||
      name.includes('Rượu') ||
      name.includes('Nước') ||
      name.includes('Cà phê') ||
      name.includes('Cocktail')
    ) {
      return 'Quầy Bar';
    }
    if (
      cat === 'Lẩu Đặc Biệt' ||
      cat === 'Món Bò & Bê' ||
      cat === 'Hải Sản Tươi Sống' ||
      name.includes('Lẩu') ||
      name.includes('Bò') ||
      name.includes('Cua') ||
      name.includes('Cá') ||
      name.includes('Nướng') ||
      name.includes('Chiên') ||
      name.includes('Xào')
    ) {
      return 'Bếp Nóng';
    }
    return 'Bếp Lạnh';
  },

  // --- Table Switcher (Bàn & Phòng) ---
  switchTable(tableId) {
    // 1. Save active cart to current table in tables list
    const currentT = this.tables.find((t) => t.id === this.currentTableId);
    if (currentT) {
      currentT.items = JSON.parse(JSON.stringify(this.orderItems));
      if (this.orderItems.length > 0) {
        currentT.status = 'OCCUPIED';
        currentT.guests = currentT.guests || 2;
        if (!currentT.orderCode) currentT.orderCode = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    }

    // 2. Switch to target table
    const nextT = this.tables.find((t) => t.id === tableId);
    if (!nextT) return;

    this.currentTableId = tableId;
    this.tableInfo = { ...nextT };

    // 3. Check if table has active ticket in KDS and sync latest statuses
    const kdsTicket = this.kdsTickets.find((t) => t.tableId === tableId);
    if (kdsTicket && nextT.items) {
      nextT.items.forEach((ti) => {
        const ki = kdsTicket.items.find(
          (k) => k.dishId === ti.dishId && (ti.isAddon ? k.isAddon : !k.isAddon)
        ) || kdsTicket.items.find((k) => k.dishId === ti.dishId);
        if (ki) ti.status = ki.status;
      });
    }

    this.orderItems = nextT.items ? JSON.parse(JSON.stringify(nextT.items)) : [];
    this.showToast(`Đã chuyển sang ${nextT.number} (${nextT.area})`, 'info');
    this.notify();
  },

  // --- Table Configuration & Management (Khớp dining_tables trong DB) ---
  addTable({ number, area, capacity }) {
    if (!number) {
      this.showToast('Vui lòng nhập tên hoặc số bàn!', 'warning');
      return;
    }
    const exists = this.tables.some((t) => t.number.toLowerCase() === number.toLowerCase());
    if (exists) {
      this.showToast(`Số bàn "${number}" đã tồn tại! Vui lòng chọn số khác.`, 'warning');
      return;
    }

    const id = 'tbl-' + Date.now().toString().slice(-4);
    const newTable = {
      id,
      number,
      area: area || 'Tầng 1 - Sảnh Chính',
      capacity: Number(capacity) || 4,
      status: 'VACANT', // 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'CLEANING'
      guests: 0,
      checkIn: '',
      server: 'Trần Minh Tâm',
      orderCode: '',
      items: []
    };

    this.tables.push(newTable);
    this.showToast(`Đã tạo thành công ${number} (${area})!`, 'success');
    this.notify();
  },

  deleteTable(tableId) {
    const tbl = this.tables.find((t) => t.id === tableId);
    if (!tbl) return;
    if (tbl.status === 'OCCUPIED' || (tbl.items && tbl.items.length > 0)) {
      this.showToast(`Không thể xóa ${tbl.number} vì đang có khách hoặc có món ăn!`, 'warning');
      return;
    }

    this.tables = this.tables.filter((t) => t.id !== tableId);
    if (this.currentTableId === tableId && this.tables.length > 0) {
      this.switchTable(this.tables[0].id);
    }
    this.showToast(`Đã xóa ${tbl.number} khỏi sơ đồ mặt bằng!`, 'info');
    this.notify();
  },

  toggleTableCleaning(tableId) {
    const tbl = this.tables.find((t) => t.id === tableId);
    if (!tbl) return;
    if (tbl.status === 'OCCUPIED') {
      this.showToast(`${tbl.number} đang có khách, không thể chuyển dọn dẹp!`, 'warning');
      return;
    }

    tbl.status = tbl.status === 'CLEANING' ? 'VACANT' : 'CLEANING';
    if (this.currentTableId === tableId) {
      this.tableInfo.status = tbl.status;
    }
    this.showToast(
      `${tbl.number}: ${tbl.status === 'CLEANING' ? 'Đang dọn dẹp' : 'Đã dọn xong - Sẵn sàng đón khách'}`,
      'info'
    );
    this.notify();
  },

  // --- POS Order Actions (Synchronized with Active Table & KDS) ---
  addToOrder(dish) {
    if (dish.status === 'out_of_stock') {
      this.showToast(`Món "${dish.name}" hiện đang hết hàng! Vui lòng chọn món khác.`, 'warning');
      return;
    }
    const station = this.getStationForDish(dish);
    const hasSentItems = this.orderItems.some((i) => i.status !== 'QUEUED');

    // Find if there is an unsent (QUEUED) item for this dish
    const existingQueued = this.orderItems.find(
      (item) => item.dishId === dish.id && item.status === 'QUEUED'
    );

    if (existingQueued) {
      existingQueued.quantity += 1;
      this.showToast(`Đã tăng số lượng "${dish.name}" (+1)`);
    } else {
      // If table already has items sent to kitchen, this new item is "Món gọi thêm"
      const isAddon = hasSentItems;
      this.orderItems.push({
        dishId: dish.id,
        name: dish.name,
        category: dish.category,
        station: station,
        price: dish.price,
        quantity: 1,
        note: isAddon ? 'Gọi thêm' : '',
        status: 'QUEUED', // 'QUEUED' | 'COOKING' | 'READY' | 'SERVED'
        isAddon: isAddon,
        image: dish.image
      });
      this.showToast(
        isAddon
          ? `Đã thêm món gọi thêm "${dish.name}" cho ${this.tableInfo.number || 'Bàn ' + this.tableInfo.id}!`
          : `Đã thêm "${dish.name}" vào giỏ gọi món!`
      );
    }

    // Immediately reflect to tables state
    const tbl = this.tables.find((t) => t.id === this.currentTableId);
    if (tbl) {
      tbl.items = JSON.parse(JSON.stringify(this.orderItems));
      tbl.status = 'OCCUPIED';
      tbl.guests = tbl.guests || 2;
      if (!tbl.orderCode) tbl.orderCode = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      this.tableInfo.orderCode = tbl.orderCode;
      this.tableInfo.status = tbl.status;
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

    // Sync to active table
    const tbl = this.tables.find((t) => t.id === this.currentTableId);
    if (tbl) {
      tbl.items = JSON.parse(JSON.stringify(this.orderItems));
      if (this.orderItems.length === 0 && !this.kdsTickets.some((t) => t.tableId === this.currentTableId)) {
        tbl.status = 'VACANT';
        tbl.orderCode = '';
        this.tableInfo.status = 'VACANT';
        this.tableInfo.orderCode = '';
      }
    }

    // Sync to KDS ticket if exists
    const ticket = this.kdsTickets.find((t) => t.tableId === this.currentTableId);
    if (ticket) {
      const kdsItem = ticket.items.find((i) => i.dishId === dishId);
      if (kdsItem) {
        if (item.quantity <= 0) {
          ticket.items = ticket.items.filter((i) => i.dishId !== dishId);
        } else {
          kdsItem.quantity = item.quantity;
        }
      }
    }

    this.notify();
  },

  updateItemNote(dishId, note) {
    const item = this.orderItems.find((i) => i.dishId === dishId);
    if (item) {
      item.note = note;
      // Sync to table
      const tbl = this.tables.find((t) => t.id === this.currentTableId);
      if (tbl && tbl.items) {
        const ti = tbl.items.find((i) => i.dishId === dishId);
        if (ti) ti.note = note;
      }
      // Sync to KDS ticket
      const ticket = this.kdsTickets.find((t) => t.tableId === this.currentTableId);
      if (ticket) {
        const ki = ticket.items.find((i) => i.dishId === dishId);
        if (ki) ki.note = note;
      }
      this.showToast('Đã cập nhật ghi chú món ăn');
      this.notify();
    }
  },

  removeOrderItem(dishId) {
    this.orderItems = this.orderItems.filter((i) => i.dishId !== dishId);
    // Sync to table
    const tbl = this.tables.find((t) => t.id === this.currentTableId);
    if (tbl) {
      tbl.items = JSON.parse(JSON.stringify(this.orderItems));
      if (this.orderItems.length === 0 && !this.kdsTickets.some((t) => t.tableId === this.currentTableId)) {
        tbl.status = 'VACANT';
        tbl.orderCode = '';
        this.tableInfo.status = 'VACANT';
      }
    }
    // Sync to KDS
    const ticket = this.kdsTickets.find((t) => t.tableId === this.currentTableId);
    if (ticket) {
      ticket.items = ticket.items.filter((i) => i.dishId !== dishId);
    }
    this.showToast('Đã xóa món khỏi đơn', 'info');
    this.notify();
  },

  clearOrder() {
    this.orderItems = [];
    const tbl = this.tables.find((t) => t.id === this.currentTableId);
    if (tbl) {
      tbl.items = [];
      if (!this.kdsTickets.some((t) => t.tableId === this.currentTableId)) {
        tbl.status = 'VACANT';
        tbl.orderCode = '';
        this.tableInfo.status = 'VACANT';
      }
    }
    this.showToast('Đã làm mới giỏ gọi món', 'info');
    this.notify();
  },

  sendOrderToKitchen() {
    if (this.orderItems.length === 0) {
      this.showToast('Giỏ hàng trống, vui lòng chọn món trước!', 'warning');
      return;
    }

    const newQueuedItems = this.orderItems.filter((i) => i.status === 'QUEUED');
    if (newQueuedItems.length === 0) {
      this.showToast('Tất cả các món của bàn này đã được gửi bếp trước đó!', 'info');
      return;
    }

    const tableId = this.currentTableId;

    // Set any queued items to COOKING
    newQueuedItems.forEach((i) => {
      i.status = 'COOKING';
      if (!i.station) i.station = this.getStationForDish(i);
    });

    const tbl = this.tables.find((t) => t.id === tableId);
    if (tbl) {
      tbl.status = 'OCCUPIED';
      tbl.items = JSON.parse(JSON.stringify(this.orderItems));
      if (!tbl.orderCode) tbl.orderCode = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      this.tableInfo.orderCode = tbl.orderCode;
      this.tableInfo.status = 'OCCUPIED';
    }

    // Check existing KDS ticket
    let existingTicket = this.kdsTickets.find((t) => t.tableId === tableId);
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (existingTicket) {
      // Append newly queued items to existing ticket with add-on indicator
      newQueuedItems.forEach((activeItem, idx) => {
        existingTicket.items.push({
          id: `kds-${tableId}-${activeItem.dishId}-${Date.now()}-${idx}`,
          dishId: activeItem.dishId,
          name: activeItem.name,
          quantity: activeItem.quantity,
          station: activeItem.station || this.getStationForDish(activeItem),
          note: activeItem.note || '',
          status: 'COOKING',
          isAddon: true,
          addonTime: nowTime
        });
      });
      existingTicket.status = 'COOKING';
      this.showToast(
        `Đã gửi thêm ${newQueuedItems.length} món gọi thêm của ${this.tableInfo.number || 'Bàn ' + tableId} xuống Bếp & Bar! Hóa đơn tạm đã cập nhật.`,
        'success'
      );
    } else {
      // Create new KDS ticket
      const newTicket = {
        id: `ticket-${tableId}-${Date.now()}`,
        orderCode: this.tableInfo.orderCode || `#ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        tableId: tableId,
        tableName: this.tableInfo.number || `Bàn ${tableId}`,
        area: this.tableInfo.area,
        server: this.tableInfo.server || 'Trần Minh Tâm',
        guests: this.tableInfo.guests || 2,
        orderTime: nowTime,
        elapsedMinutes: 1,
        isOverdue: false,
        items: this.orderItems.map((item, idx) => ({
          id: `kds-${tableId}-${item.dishId}-${idx}`,
          dishId: item.dishId,
          name: item.name,
          quantity: item.quantity,
          station: item.station || this.getStationForDish(item),
          note: item.note || '',
          status: 'COOKING'
        }))
      };
      this.kdsTickets.unshift(newTicket);
      this.showToast(`Đã gửi ${this.orderItems.length} món xuống Bếp & Quầy Bar (KDS)! Hóa đơn tạm đã khởi tạo.`, 'success');
    }

    this.notify();
  },

  // --- KDS Kitchen & Bar Actions ---
  updateKdsItemStatus(ticketId, itemId, newStatus) {
    const ticket = this.kdsTickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const item = ticket.items.find((i) => i.id === itemId);
    if (!item) return;

    item.status = newStatus;

    // 1. Sync to corresponding table in this.tables
    const targetTable = this.tables.find((t) => t.id === ticket.tableId);
    if (targetTable && targetTable.items) {
      const tableItem = targetTable.items.find((i) => i.dishId === item.dishId);
      if (tableItem) tableItem.status = newStatus;
    }

    // 2. Sync to active orderItems if table is currently selected
    if (ticket.tableId === this.currentTableId) {
      const activeItem = this.orderItems.find((i) => i.dishId === item.dishId);
      if (activeItem) activeItem.status = newStatus;
    }

    const statusNames = {
      QUEUED: 'Chờ nhận nấu',
      COOKING: 'Đang nấu',
      READY: 'Đã xong - Chờ bê',
      SERVED: 'Đã giao ra bàn'
    };

    this.showToast(`[KDS ${ticket.tableName} • ${item.station}] ${item.name}: ${statusNames[newStatus] || newStatus}`, 'info');
    this.notify();
  },

  bumpKdsTicket(ticketId, stationFilter = 'ALL') {
    const ticket = this.kdsTickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    if (stationFilter === 'ALL') {
      // Mark all items as SERVED and bump ticket completely
      const index = this.kdsTickets.findIndex((t) => t.id === ticketId);
      if (index !== -1) {
        const bumped = this.kdsTickets.splice(index, 1)[0];
        bumped.items.forEach((i) => (i.status = 'SERVED'));
        this.bumpedTickets.push(bumped);

        // Sync table and order items
        const targetTable = this.tables.find((t) => t.id === bumped.tableId);
        if (targetTable && targetTable.items) {
          targetTable.items.forEach((i) => (i.status = 'SERVED'));
        }
        if (bumped.tableId === this.currentTableId) {
          this.orderItems.forEach((i) => (i.status = 'SERVED'));
        }

        this.showToast(`Đã hoàn tất toàn bộ vé của ${bumped.tableName}!`, 'success');
      }
    } else {
      // Station-specific bump: only complete items in this station (e.g. Quầy Bar or Bếp Nóng)
      let stationItems = ticket.items.filter((i) => i.station === stationFilter);
      stationItems.forEach((i) => (i.status = 'SERVED'));

      // Sync to table
      const targetTable = this.tables.find((t) => t.id === ticket.tableId);
      if (targetTable && targetTable.items) {
        targetTable.items.forEach((ti) => {
          if (stationItems.some((si) => si.dishId === ti.dishId)) {
            ti.status = 'SERVED';
          }
        });
      }
      if (ticket.tableId === this.currentTableId) {
        this.orderItems.forEach((oi) => {
          if (stationItems.some((si) => si.dishId === oi.dishId)) {
            oi.status = 'SERVED';
          }
        });
      }

      // Check if all items across ALL stations in this ticket are now SERVED
      const allDone = ticket.items.every((i) => i.status === 'SERVED');
      if (allDone) {
        const index = this.kdsTickets.findIndex((t) => t.id === ticketId);
        if (index !== -1) {
          const bumped = this.kdsTickets.splice(index, 1)[0];
          this.bumpedTickets.push(bumped);
        }
        this.showToast(`Đã hoàn tất toàn bộ các món của ${ticket.tableName}!`, 'success');
      } else {
        this.showToast(`Đã hoàn tất các món trạm [${stationFilter}] cho ${ticket.tableName}. Các món trạm khác vẫn tiếp tục chế biến!`, 'info');
      }
    }

    this.notify();
  },

  recallKdsTicket() {
    if (this.bumpedTickets.length === 0) {
      this.showToast('Không có vé nào vừa hoàn tất để thu hồi!', 'info');
      return;
    }
    const recalled = this.bumpedTickets.pop();
    this.kdsTickets.unshift(recalled);

    // Sync back to table and order
    const targetTable = this.tables.find((t) => t.id === recalled.tableId);
    if (targetTable && targetTable.items) {
      targetTable.items.forEach((ti) => {
        const ki = recalled.items.find((k) => k.dishId === ti.dishId);
        if (ki) ti.status = 'READY';
      });
    }
    if (recalled.tableId === this.currentTableId) {
      this.orderItems.forEach((oi) => {
        const ki = recalled.items.find((k) => k.dishId === oi.dishId);
        if (ki) oi.status = 'READY';
      });
    }

    this.showToast(`Đã thu hồi vé của ${recalled.tableName} về màn hình bếp!`, 'success');
    this.notify();
  },

  // --- Menu Management Actions (Back Office) ---
  toggleDishStatus(dishId) {
    const dish = this.dishes.find((d) => d.id === dishId);
    if (dish) {
      dish.status = dish.status === 'available' ? 'out_of_stock' : 'available';
      dish.badge = dish.status === 'out_of_stock' ? 'Tạm hết' : dish.bestSeller ? 'Best Seller' : '';
      this.showToast(
        `Món "${dish.name}" chuyển sang: ${dish.status === 'available' ? 'Đang bán' : 'Tạm hết hàng (Sync POS & KDS)'}`,
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

  // Calculate bill total for any specific table
  getTableBilling(tableId) {
    const tbl = this.tables.find((t) => t.id === tableId);
    if (!tbl || !tbl.items || tbl.items.length === 0) {
      return { subtotal: 0, serviceFee: 0, vat: 0, total: 0, itemCount: 0 };
    }
    const itemCount = tbl.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = tbl.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const vat = Math.round((subtotal + serviceFee) * 0.08);
    const rawTotal = subtotal + serviceFee + vat;
    const total = Math.round(rawTotal / 1000) * 1000;
    return { subtotal, serviceFee, vat, total, itemCount };
  },

  // Retrieve all tables that currently have active orders / temporary bills
  getActiveTablesWithBills() {
    return this.tables.filter((t) => (t.items && t.items.length > 0) || t.status === 'OCCUPIED');
  },

  resetTableAfterPayment() {
    const tableId = this.currentTableId;
    const tbl = this.tables.find((t) => t.id === tableId);
    if (tbl) {
      tbl.status = 'VACANT';
      tbl.items = [];
      tbl.guests = 0;
      tbl.orderCode = '';
      tbl.checkIn = '';
    }

    // Remove this table's ticket from active KDS tickets
    this.kdsTickets = this.kdsTickets.filter((t) => t.tableId !== tableId);

    // Reset order items and active table info
    this.orderItems = [];
    this.tableInfo = tbl ? { ...tbl } : { ...this.tables[0] };
    this.cashReceived = 1000000;
    this.appliedVoucher = null;
    this.customer = null;
    this.activeView = 'POS_ORDER';

    this.showToast(`Đã hoàn tất thanh toán & giải phóng ${tbl ? tbl.number : 'bàn'}!`, 'success');
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
