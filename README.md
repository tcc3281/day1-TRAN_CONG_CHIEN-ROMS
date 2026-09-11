# Restaurant Operations Management System

## 1. Problem Statement

Running a restaurant manually or with fragmented tools causes severe operational bottlenecks:
* **Order inaccuracies & miscommunication**: Hand-written orders lead to missing items, delayed cooking, and incorrect kitchen modifications.
* **Billing errors & slow turnover**: Manual bill calculations with discounts, service charges, and VAT increase checkout delays and cashier discrepancies.
* **Disconnected operations**: Front-of-house (servers), kitchen, and back-office (management) lack real-time synchronization on table statuses, depleted ingredients, and sales numbers.

### The Objective
Design and build an integrated, end-to-end **Restaurant Operations Management System** using a **Top-Down Approach**:
* **Phase 1 (Minimum Viable Core)**: Digitize the 3 mission-critical functions — **Menu Management**, **Order Taking (POS)**, and **Billing & Payment** — allowing the business to take orders and collect revenue seamlessly.
* **Human-in-the-Loop Fallback**: Non-core features (such as physical table assignment, oral kitchen callouts, and manual inventory spreadsheets) are temporarily managed by staff until subsequent phases.

---

## 2. Feature Breakdown (`docs/top-down-approach-mindmap.png`)

Based on the [Top-Down Architecture Mindmap](docs/top-down-approach-mindmap.png), the system is decomposed into 5 core functional modules:

```
                          ┌─ 1. Table & Reservation Management
                          ├─ 2. Order Management (POS) [Core Phase 1]
Restaurant Operations ────┼─ 3. Kitchen Coordination (KDS)
      System              ├─ 4. Back Office Management [Core Phase 1]
                          └─ 5. Payment & Invoicing [Core Phase 1]
```

### Module 1: Table & Reservation Management (Quản lý Bàn & Đặt chỗ)
* **Floor Plan Layout (Sắp xếp không gian quán)**:
  * Displays a visual table layout organized by dining zones (Floor 1, VIP rooms, Outdoor).
  * Uses color-coded indicators to quickly identify table states (*Vacant, Occupied, Reserved*).
* **Seating Coordination (Điều phối chỗ ngồi)**:
  * Opens tables when new guests arrive.
  * Merges adjacent tables into a single large table for group dining.
  * Transfers all active ordered items from one table to another when guests relocate.
* **Reservation Handling (Xử lý lịch hẹn trước)**:
  * Records advance guest booking details (guest name, contact, party size, arrival time).
  * Automatically/manually switches status from "Reserved" to "Serving" upon check-in.
  * Cancels no-show reservations after a configured grace period.

### Module 2: Order Management (Quản lý Đơn hàng) — *[Highlighted Core Phase 1]*
* **Order Entry (Ghi nhận món ăn)**:
  * Rapidly searches and filters dishes by category or name.
  * Adjusts dish quantities on the fly with stepper controls `[- 1 +]`.
  * Attaches custom dietary notes per line item (*e.g., no onion, less spicy, sauce on the side*).
* **Information Handoff (Chuyển giao thông tin)**:
  * Dispatches verified customer orders directly to the kitchen display and cashier desk.
* **Order Incident Handling (Xử lý sự cố gọi món)**:
  * Removes unsent items directly from the active cart.
  * Submits item cancellation requests (requiring manager authorization) if food has already been sent to the kitchen.

### Module 3: Kitchen Coordination (Điều phối Bếp / KDS)
* **Order Reception (Tiếp nhận yêu cầu)**:
  * Displays cooking tickets in chronological FIFO order (First In, First Out).
  * Clearly highlights special customer dietary notes attached to each item.
* **Preparation Progress (Báo tiến độ nấu nướng)**:
  * Updates item preparation stages (*Preparing, Cooked, Ready for Pickup*).
* **Stock Availability Alerting (Báo tình trạng món ăn)**:
  * Toggles an item to "Out of Stock" instantly, preventing front-of-house staff from taking further orders for that dish.

### Module 4: Back Office Management (Quản lý nhà hàng) — *[Highlighted Core Phase 1]*
* **Menu Management (Quản lý thực đơn)**:
  * Creates and updates dishes, sets base retail prices and VAT rates, uploads food photography, and structures dish categories.
* **Inventory Tracking (Quản lý kho hàng)**:
  * Monitors remaining raw ingredient balances in storage.
  * Logs supplier replenishment shipments and purchase invoices.
* **Staff & Access Control (Quản lý nhân sự)**:
  * Provisions employee accounts and assigns role-based permissions (Cashier, Server, Chef, Admin).
* **Business Performance Analytics (Theo dõi hiệu quả kinh doanh)**:
  * Renders revenue charts across daily, weekly, and monthly intervals.
  * Compiles top 5 best-selling dishes and underperforming items.

### Module 5: Payment & Invoicing (Thanh toán & Hóa đơn) — *[Highlighted Core Phase 1]*
* **Bill Calculation (Tính tiền)**:
  * Generates pre-bill previews summarizing food items, applied voucher codes, service fees (5%), and VAT (8%).
  * Deducts accumulated customer loyalty points.
* **Flexible Payments (Hỗ trợ cách trả tiền linh hoạt)**:
  * Supports multiple payment channels: Cash (with automatic change calculator), VietQR dynamic transfer, POS card swipe, and E-Wallets.
* **Document Handover (Bàn giao chứng từ)**:
  * Prints thermal pre-bills for table-side guest review.
  * Finalizes the sale and issues official electronic VAT invoices, automatically clearing the table for the next party.

---

## 3. Interactive Frontend Prototype

The interactive prototype for the 3 Phase 1 core modules is located in [`frontend/`](frontend/):
* Simply open [`frontend/index.html`](frontend/index.html) in your browser.
* No build tools, Node.js, or Docker required.
