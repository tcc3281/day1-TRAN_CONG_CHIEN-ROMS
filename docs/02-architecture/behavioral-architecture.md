# Comprehensive System Dynamics & Behavioral Architecture

> **System**: Restaurant Operations Management System (ROMS)
> **Standard**: UML 2.5 Dynamic & Behavioral Modeling Specification
> **Traceability**: Mapped 1:1 against C4 Containers/Components and Use Case Taxonomy (`../01-requirements/usecase-auth-specification.md`).

---

## Complete Behavioral Architecture Roadmap (22 Diagrams)

```
ROMS COMPREHENSIVE BEHAVIORAL SPECIFICATION
│
├── 🔄 1. STATE MACHINE DIAGRAMS (3 Core Data Entities)
│   ├── State 1: Order Item Lifecycle (ORDER_ITEMS)
│   ├── State 2: Dining Table Lifecycle (DINING_TABLES)
│   └── State 3: Invoice Lifecycle (INVOICES)
│
├── ⏱️ 2. SEQUENCE DIAGRAMS (14 Technical API & Event Interactions)
│   ├── Seq 1: Staff Authentication (Manager JWT / Server Quick PIN)
│   ├── Seq 2: Open Table & Session Initialization
│   ├── Seq 3: Table Transfer Workflow (Chuyển Bàn)
│   ├── Seq 4: Table Merge Workflow (Gộp Bàn)
│   ├── Seq 5: First-Round Ordering & Real-Time KDS Dispatch
│   ├── Seq 6: Subsequent Add-on Orders (isAddon: true)
│   ├── Seq 7: Kitchen Cooking Progression & Waitstaff Ready Alert
│   ├── Seq 8: Instant Out-of-Stock (86) Freeze & Real-Time Sync
│   ├── Seq 9: Voucher Validation & VIP Loyalty Point Redemption
│   ├── Seq 10: Pre-Bill Thermal Printing (80mm ESC/POS)
│   ├── Seq 11: Cash Settlement & Change Calculation
│   ├── Seq 12: Dynamic VietQR Settlement & Bank Webhook Callback
│   ├── Seq 13: Dish Photo Upload to Media Storage
│   └── Seq 14: Shift Revenue & Gross Margin Analytics Query
│
└── 📊 3. ACTIVITY DIAGRAMS (5 Multi-Role Business Workflows)
    ├── Act 1: Advance Reservation & Walk-in Seating Flow
    ├── Act 2: End-to-End Dining & Billing Cycle (4 Swimlanes)
    ├── Act 3: Void Item & Kitchen Waste Approval Process
    ├── Act 4: Split Bill & Divided Settlement Workflow
    └── Act 5: Cash Drawer Opening, Reconciliation & Handover
```

---

# PART 1: STATE MACHINE DIAGRAMS (3 Entities)

## 1.1. Order Item Lifecycle (`ORDER_ITEMS`)

* **Objective**: Governs dish preparation states, kitchen station handoffs, and loss-prevention cancellation gates.

```mermaid
stateDiagram-v2
    [*] --> QUEUED : Order Dispatched (Waitstaff POS)

    QUEUED --> COOKING : Chef Claims Ticket (KDS Touch)
    COOKING --> READY : Cooking Finished (KDS Touch)
    READY --> SERVED : Runner Delivers to Table
    SERVED --> [*] : Bill Settled

    %% Cancellation Branches
    QUEUED --> CANCELLED : Void before cooking (Auto-approved)
  
    COOKING --> CANCELLED : Cancel mid-cooking<br>[Guard: Manager Approval Required]
    note right of CANCELLED
        Logged into Kitchen Waste Ledger
        if food/ingredients were utilized.
    end note

    CANCELLED --> [*]
```

---

## 1.2. Dining Table Lifecycle (`DINING_TABLES`)

* **Objective**: Prevents double-booking, manages dining sessions, and synchronizes floor map color codes across all POS clients.

```mermaid
stateDiagram-v2
    [*] --> VACANT : Initial Floor Setup

    VACANT --> RESERVED : Advance Booking Recorded<br>[Trigger: 30m prior to arrival]
    RESERVED --> OCCUPIED : Guest Arrives & Check-in
    RESERVED --> VACANT : Booking Cancelled / No-show

    VACANT --> OCCUPIED : Walk-in Guests Seated (Open Table)
  
    OCCUPIED --> BILLING_PENDING : Pre-bill Printed (Cashier)
    BILLING_PENDING --> OCCUPIED : Cart Re-opened (Item added / Disputed)
    BILLING_PENDING --> CLEANING : Full Payment Confirmed
  
    CLEANING --> VACANT : Table Sanitized & Reset
```

---

## 1.3. Invoice Lifecycle (`INVOICES`)

* **Objective**: Guarantees financial immutability so audited historical figures cannot be tampered with.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Table Active (Accumulating Order Items)
  
    DRAFT --> PREBILL_ISSUED : Pre-bill Printed for Guest Review
    PREBILL_ISSUED --> DRAFT : Cart Adjustment / Voucher Applied
  
    PREBILL_ISSUED --> AWAITING_PAYMENT : Payment Method Chosen (Cash / VietQR)
    AWAITING_PAYMENT --> PAID : Funds Collected & Reconciled
  
    PAID --> [*] : Sealed Permanently (Table Released)
  
    PREBILL_ISSUED --> VOIDED : Total Bill Cancelled<br>[Guard: Manager Super-Admin]
    VOIDED --> [*]
```

---

# PART 2: SEQUENCE DIAGRAMS (14 Technical Flows)

## 2.1. Staff Authentication (Manager JWT / Server Quick PIN)

* **Mapped Use Cases**: `UC-SEC-AUTH`
* **Objective**: Provides instant 4-digit PIN switching for floor tablets while enforcing secure JWT for back office.

```mermaid
sequenceDiagram
    autonumber
    actor Staff as 👤 Staff Member
    participant Client as 📱 Mobile App / 🌐 Web App
    participant Gateway as 🚪 API Gateway
    participant AuthCtrl as 🔐 Security & Auth Component
    participant DB as 🗄️ PostgreSQL DB

    alt Waitstaff Floor Access (Fast PIN)
        Staff->>Client: Enters 4-digit PIN (e.g. 1234) on Table POS
        Client->>Gateway: POST /api/v1/auth/quick-pin {"pin": "1234"}
        Gateway->>AuthCtrl: Forward Request
        AuthCtrl->>DB: SELECT id, role, full_name FROM users WHERE pin_hash = SHA256(1234)
        DB-->>AuthCtrl: User Found (Role: SERVER, id: 8)
        AuthCtrl-->>Client: Return Session Token (TTL: 8 Hours)
        Client-->>Staff: Unlock POS Interface for Server #8
    else Manager Back-Office Access (Strong JWT)
        Staff->>Client: Enters Username + Complex Password
        Client->>Gateway: POST /api/v1/auth/login {"username": "admin", "password": "..."}
        Gateway->>AuthCtrl: Forward Request
        AuthCtrl->>DB: Verify bcrypt password hash
        DB-->>AuthCtrl: Match OK (Role: MANAGER)
        AuthCtrl-->>Client: Return Access Token (JWT 15m) + Refresh Token (7d)
        Client-->>Staff: Unlock Admin Dashboard
    end
```

---

## 2.2. Open Table & Dining Session Initialization

* **Mapped Use Cases**: `UC-POS-PRI-01`

```mermaid
sequenceDiagram
    autonumber
    actor Server as 👤 Waitstaff
    participant Mobile as 📱 Waitstaff Mobile App
    participant Gateway as 🚪 API Gateway
    participant TableCtrl as 🪑 TablesController
    participant DB as 🗄️ PostgreSQL DB

    Server->>Mobile: Taps Table #05 on Floor Plan
    Mobile->>Mobile: Prompts guest count modal (Default: 4 guests)
    Server->>Mobile: Enters guest count & taps "Open Table"
    Mobile->>Gateway: POST /api/v1/tables/05/open {"guestCount": 4} [Bearer Token]
    Gateway->>TableCtrl: Forward Request
  
    activate TableCtrl
    TableCtrl->>DB: UPDATE dining_tables SET status = 'OCCUPIED' WHERE id = 5 AND status = 'VACANT'
    TableCtrl->>DB: INSERT into ORDERS (order_code, table_id, server_id, guest_count, status)
    DB-->>TableCtrl: Created Order ID: #ORD-9912
    TableCtrl-->>Gateway: HTTP 201 Created {"orderId": 9912, "table": "05"}
    deactivate TableCtrl

    Gateway-->>Mobile: HTTP 201 Created
    Mobile-->>Server: Table #05 turns RED (OCCUPIED) & opens POS Cart
```

---

## 2.3. Table Transfer Workflow (Chuyển Bàn)

* **Mapped Use Cases**: `UC-EXT-01`
* **Objective**: Moves active orders from Table A to Table B atomically.

```mermaid
sequenceDiagram
    autonumber
    actor Server as 👤 Waitstaff
    participant Mobile as 📱 Waitstaff Mobile App
    participant TableCtrl as 🪑 TablesController
    participant DB as 🗄️ PostgreSQL DB
    participant Hub as ⚡ RestaurantHub (SignalR)

    Server->>Mobile: Selects Table #02 -> Taps "Transfer Table" -> Selects Table #09
    Mobile->>TableCtrl: POST /api/v1/tables/transfer {"fromTableId": 2, "toTableId": 9}
  
    activate TableCtrl
    Note over TableCtrl,DB: Atomic Database Transaction
    TableCtrl->>DB: BEGIN TRANSACTION
    TableCtrl->>DB: Verify Table #09 is currently VACANT
    TableCtrl->>DB: UPDATE orders SET table_id = 9 WHERE table_id = 2 AND status = 'OPEN'
    TableCtrl->>DB: UPDATE dining_tables SET status = 'VACANT' WHERE id = 2
    TableCtrl->>DB: UPDATE dining_tables SET status = 'OCCUPIED' WHERE id = 9
    TableCtrl->>DB: COMMIT TRANSACTION
  
    TableCtrl->>Hub: Broadcast "TableStateChanged" (Table 02 -> VACANT, Table 09 -> OCCUPIED)
    TableCtrl-->>Mobile: HTTP 200 OK {"message": "Table transferred successfully"}
    deactivate TableCtrl

    Hub-->>Mobile: Floor map updates across all staff screens in real-time
```

---

## 2.4. Table Merge Workflow (Gộp Bàn Tiệc)

* **Mapped Use Cases**: `UC-EXT-02`
* **Objective**: Merges multiple tables into one master dining bill.

```mermaid
sequenceDiagram
    autonumber
    actor Server as 👤 Waitstaff
    participant Mobile as 📱 Waitstaff Mobile App
    participant TableCtrl as 🪑 TablesController
    participant DB as 🗄️ PostgreSQL DB

    Server->>Mobile: Selects Table #03 & #04 -> Taps "Merge Tables" (Master: Table #03)
    Mobile->>TableCtrl: POST /api/v1/tables/merge {"primaryTableId": 3, "secondaryTableId": 4}
  
    activate TableCtrl
    TableCtrl->>DB: BEGIN TRANSACTION
    TableCtrl->>DB: Find active Order of Table #03 (Master) & Table #04 (Secondary)
    TableCtrl->>DB: UPDATE order_items SET order_id = MasterOrderId WHERE order_id = SecondaryOrderId
    TableCtrl->>DB: UPDATE orders SET status = 'MERGED', closed_at = NOW() WHERE id = SecondaryOrderId
    TableCtrl->>DB: UPDATE dining_tables SET status = 'OCCUPIED' WHERE id IN (3, 4)
    TableCtrl->>DB: COMMIT TRANSACTION
    TableCtrl-->>Mobile: HTTP 200 OK {"masterOrderId": 9912, "mergedTables": [3, 4]}
    deactivate TableCtrl

    Mobile-->>Server: Combined bill preview displayed under Table #03 (VIP Group)
```

---

## 2.5. First-Round Ordering & Real-Time KDS Ticket Dispatch

* **Mapped Use Cases**: `UC-POS-PRI-02`, `UC-POS-PRI-03`, `UC-KIT-PRI-01`

```mermaid
sequenceDiagram
    autonumber
    actor Server as 👤 Waitstaff
    participant Mobile as 📱 Waitstaff Mobile App
    participant Gateway as 🚪 API Gateway
    participant OrdersCtrl as 🛒 OrdersController
    participant DB as 🗄️ PostgreSQL DB
    participant Hub as ⚡ RestaurantHub (SignalR)
    participant KDS as 🖥️ Kitchen Web App (KDS)

    Server->>Mobile: Taps "Send to Kitchen" for Table #05
    Mobile->>Gateway: POST /api/v1/orders/9912/dispatch [Bearer Token]
    Gateway->>OrdersCtrl: Forward Request
  
    activate OrdersCtrl
    Note over OrdersCtrl,DB: Price Snapshot Pattern: Freeze unit_price in line items
    OrdersCtrl->>DB: INSERT into ORDER_ITEMS (order_id, dish_id, quantity, unit_price, status, cooking_note)
    DB-->>OrdersCtrl: Persisted 4 Items at current catalog price
  
    OrdersCtrl->>Hub: Publish "ReceiveNewTicket" (TicketId, Table: "05", Items, Notes)
    deactivate OrdersCtrl

    Hub-->>KDS: Push WebSocket Event: "ReceiveNewTicket"
  
    activate KDS
    KDS->>KDS: Play Chime Sound 🔔 & Insert Ticket Card into FIFO Queue
    deactivate KDS

    OrdersCtrl-->>Mobile: HTTP 200 OK
    Mobile-->>Server: Green Toast: "Order dispatched to Kitchen"
```

---

## 2.6. Subsequent Add-on Orders (`isAddon: true`)

* **Mapped Use Cases**: `UC-POS-SEC-02`
* **Objective**: Appends new dishes without resetting cooking progress of round-1 items.

```mermaid
sequenceDiagram
    autonumber
    actor Server as 👤 Waitstaff
    participant Mobile as 📱 Waitstaff Mobile App
    participant OrdersCtrl as 🛒 OrdersController
    participant DB as 🗄️ PostgreSQL DB
    participant Hub as ⚡ RestaurantHub (SignalR)
    participant KDS as 🖥️ Kitchen Web App (KDS)

    Server->>Mobile: Adds 2 beers & 1 dessert for Table #05 -> Taps "Send Add-on"
    Mobile->>OrdersCtrl: POST /api/v1/orders/9912/addon {"items": [...]}
  
    activate OrdersCtrl
    OrdersCtrl->>DB: INSERT into ORDER_ITEMS (..., is_addon = true, status = 'QUEUED')
    DB-->>OrdersCtrl: Inserted 2 new items
  
    OrdersCtrl->>Hub: Publish "ReceiveAddonItems" (OrderId: 9912, Table: "05", NewItems)
    deactivate OrdersCtrl

    Hub-->>KDS: Push WebSocket Event: "ReceiveAddonItems"
  
    activate KDS
    KDS->>KDS: Highlight active Table #05 Ticket Card with yellow badge: "[+ ĐỢT 2]"
    deactivate KDS

    OrdersCtrl-->>Mobile: HTTP 200 OK
```

---

## 2.7. Kitchen Cooking Progression & Waitstaff Ready Alert

* **Mapped Use Cases**: `UC-KIT-PRI-02`, `UC-KIT-PRI-03`

```mermaid
sequenceDiagram
    autonumber
    actor Chef as 👨‍🍳 Chef
    participant KDS as 🖥️ Kitchen Web App (KDS)
    participant OrdersCtrl as 🛒 OrdersController
    participant DB as 🗄️ PostgreSQL DB
    participant Hub as ⚡ RestaurantHub (SignalR)
    participant Mobile as 📱 Waitstaff Mobile App
    actor Server as 👤 Waitstaff Runner

    Chef->>KDS: Taps item "Lẩu Thái" (QUEUED -> COOKING)
    KDS->>OrdersCtrl: PATCH /api/v1/order-items/401/status {"status": "COOKING"}
    OrdersCtrl->>DB: UPDATE order_items SET status = 'COOKING' WHERE id = 401
    OrdersCtrl-->>KDS: HTTP 200 OK

    Note over Chef,KDS: 15 minutes preparation
    Chef->>KDS: Taps item "Lẩu Thái" (COOKING -> READY)
    KDS->>OrdersCtrl: PATCH /api/v1/order-items/401/status {"status": "READY"}
    OrdersCtrl->>DB: UPDATE order_items SET status = 'READY' WHERE id = 401
  
    OrdersCtrl->>Hub: Publish "DishReadyNotification" (Table: "05", Dish: "Lẩu Thái")
    Hub-->>Mobile: Push WebSocket to Server assigned to Table #05
  
    activate Mobile
    Mobile->>Mobile: Vibrate device 📳 & Play alert chime
    Mobile-->>Server: Banner: "Table 05: Lẩu Thái is READY at Kitchen Pass!"
    deactivate Mobile

    Server->>Chef: Runner collects pot and delivers to Table #05
```

---

## 2.8. Instant Out-of-Stock (86) Freeze & Real-Time Sync

* **Mapped Use Cases**: `UC-KIT-SEC-02`
* **Objective**: Locks depleted dishes across all POS clients in $< 200\text{ ms}$.

```mermaid
sequenceDiagram
    autonumber
    actor Chef as 👨‍🍳 Chef
    participant KDS as 🖥️ Kitchen Web App (KDS)
    participant DishesCtrl as 📋 DishesController
    participant DB as 🗄️ PostgreSQL DB
    participant Hub as ⚡ RestaurantHub (SignalR)
    participant Mobile as 📱 Waitstaff Mobile App

    Chef->>KDS: Toggles "Cá Hồi Nướng" switch to [OUT OF STOCK]
    KDS->>DishesCtrl: PATCH /api/v1/dishes/18/toggle-86 {"status": "OUT_OF_STOCK"}
  
    activate DishesCtrl
    DishesCtrl->>DB: UPDATE dishes SET status = 'OUT_OF_STOCK' WHERE id = 18
    DishesCtrl->>Hub: Broadcast "DishAvailabilityChanged" (DishId: 18, Status: "OUT_OF_STOCK")
    deactivate DishesCtrl

    Hub-->>Mobile: Push WebSocket broadcast to ALL floor devices
  
    activate Mobile
    Mobile->>Mobile: Update in-memory catalog
    Mobile->>Mobile: Grey out "Cá Hồi Nướng" card & add Red Badge: [86 - HẾT HÀNG]
    deactivate Mobile
  
    Note over Mobile: Waitstaff attempting to tap card is instantly blocked with alert
```

---

## 2.9. Voucher Validation & VIP Loyalty Point Redemption

* **Mapped Use Cases**: `UC-CSH-SEC-01`, `UC-CSH-SEC-02`

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as 💳 Cashier
    participant WebPOS as 💻 Cashier Web POS
    participant InvoicesCtrl as 💳 InvoicesController
    participant DB as 🗄️ PostgreSQL DB

    Cashier->>WebPOS: Enters Customer Phone: "0901234567" & Voucher: "VIPGOLD10"
    WebPOS->>InvoicesCtrl: POST /api/v1/invoices/validate-discounts {"orderId": 9912, "phone": "0901234567", "voucher": "VIPGOLD10"}
  
    activate InvoicesCtrl
    InvoicesCtrl->>DB: Query customer membership tier & available loyalty points
    DB-->>InvoicesCtrl: Tier: GOLD, Points: 50,000 pts (= 50,000 VND)
  
    InvoicesCtrl->>DB: Query vouchers WHERE code = 'VIPGOLD10' AND is_active = true
    DB-->>InvoicesCtrl: Voucher valid (10% discount, max 100,000 VND)
  
    InvoicesCtrl->>InvoicesCtrl: Recalculate Totals:<br>Subtotal: 800,000 VND<br>Voucher: -80,000 VND<br>Points: -50,000 VND<br>Service Fee (5%): +33,500 VND<br>VAT (8%): +56,280 VND<br>Final Total: 759,780 VND -> Rounded: 760,000 VND
  
    InvoicesCtrl-->>WebPOS: HTTP 200 OK (Calculated Breakdown)
    deactivate InvoicesCtrl

    WebPOS-->>Cashier: Shows recalculated bill ready for settlement
```

---

## 2.10. Pre-Bill Thermal Printing (80mm ESC/POS)

* **Mapped Use Cases**: `UC-CSH-PRI-01`

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as 💳 Cashier
    participant WebPOS as 💻 Cashier Web POS
    participant Printer as 🖨️ Thermal Printer (80mm)
    actor Server as 👤 Waitstaff Runner
    actor Guest as 👥 Guest

    Cashier->>WebPOS: Clicks "Print Pre-Bill" (In Tạm Tính) for Table #05
    WebPOS->>WebPOS: Formats 80mm ESC/POS raw bytes with restaurant logo & itemized subtotal
    WebPOS->>Printer: Sends print buffer over local network TCP/IP (Port 9100)
  
    activate Printer
    Printer->>Printer: Burns receipt & executes paper cut
    Printer-->>Cashier: Outputs 80mm Pre-Bill paper
    deactivate Printer

    Cashier->>Server: Hands paper bill to server
    Server->>Guest: Presents pre-bill in leather bill-folder for table-side review
```

---

## 2.11. Cash Settlement & Automatic Change Calculation

* **Mapped Use Cases**: `UC-CSH-SEC-03`
* **Objective**: Zero mental math errors for cashiers during peak turnover.

```mermaid
sequenceDiagram
    autonumber
    actor Guest as 👥 Guest
    actor Cashier as 💳 Cashier
    participant WebPOS as 💻 Cashier Web POS
    participant InvoicesCtrl as 💳 InvoicesController
    participant DB as 🗄️ PostgreSQL DB

    Guest->>Cashier: Hands 1,000,000 VND cash for 760,000 VND bill
    Cashier->>WebPOS: Selects "CASH" -> Inputs Tendered Amount: 1,000,000 VND
  
    WebPOS->>WebPOS: Computes change: 1,000,000 - 760,000 = 240,000 VND
    WebPOS-->>Cashier: Displays Large Green Badge: "RETURN CHANGE: 240,000 VND"
  
    Cashier->>WebPOS: Taps "Complete Settlement"
    WebPOS->>InvoicesCtrl: POST /api/v1/invoices/settle-cash {"orderId": 9912, "tendered": 1000000, "change": 240000}
  
    activate InvoicesCtrl
    InvoicesCtrl->>DB: INSERT into INVOICES (final_total = 760000, status = 'PAID')
    InvoicesCtrl->>DB: INSERT into PAYMENTS (method = 'CASH', tendered = 1000000, change = 240000)
    InvoicesCtrl->>DB: UPDATE dining_tables SET status = 'CLEANING' WHERE id = 5
    InvoicesCtrl-->>WebPOS: HTTP 200 OK
    deactivate InvoicesCtrl

    Cashier->>Guest: Returns 240,000 VND change & prints official VAT receipt
```

---

## 2.12. Dynamic VietQR Settlement & Bank Webhook Callback

* **Mapped Use Cases**: `UC-CSH-PRI-02`

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as 💳 Cashier
    participant WebPOS as 💻 Cashier Web POS
    participant InvoicesCtrl as 💳 InvoicesController
    participant Bank as 🏦 Banking Gateway (VietQR)
    actor Guest as 👥 Guest
    participant DB as 🗄️ PostgreSQL DB

    Cashier->>WebPOS: Selects "VietQR" -> Total: 760,000 VND
    WebPOS->>InvoicesCtrl: POST /api/v1/invoices/generate-qr {"orderId": 9912, "amount": 760000}
  
    activate InvoicesCtrl
    InvoicesCtrl->>Bank: POST /v2/generate-dynamic-qr (Amount: 760000, Ref: "HD-9912")
    Bank-->>InvoicesCtrl: Returns QR Code String & Payload
    InvoicesCtrl-->>WebPOS: HTTP 200 OK (QR Payload)
    deactivate InvoicesCtrl

    WebPOS-->>Cashier: Renders dynamic VietQR on customer-facing LCD
    Guest->>Bank: Scans QR via Mobile Banking app and completes biometric transfer
  
    Note over Bank,InvoicesCtrl: Asynchronous Bank Webhook Callback
    Bank->>InvoicesCtrl: POST /api/v1/webhooks/vietqr {"ref": "HD-9912", "amount": 760000, "status": "SUCCESS"}
  
    activate InvoicesCtrl
    InvoicesCtrl->>DB: INSERT into INVOICES (status = 'PAID', invoice_code = 'HD-9912')
    InvoicesCtrl->>DB: UPDATE dining_tables SET status = 'CLEANING' WHERE id = 5
    InvoicesCtrl-->>Bank: HTTP 200 OK
    deactivate InvoicesCtrl

    InvoicesCtrl-->>WebPOS: WebSocket Push: "PaymentConfirmed"
    WebPOS-->>Cashier: Screen turns Green: "Payment Received! Table Released to Cleaning."
```

---

## 2.13. Dish Photo Upload to Media Storage

* **Mapped Use Cases**: `UC-MGR-PRI-01`
* **Objective**: Preserves database performance by storing binaries in MinIO/S3 and saving only URLs to PostgreSQL.

```mermaid
sequenceDiagram
    autonumber
    actor Manager as 👔 Manager
    participant AdminWeb as 🌐 Manager Web Portal
    participant DishesCtrl as 📋 DishesController
    participant MediaStore as 📁 Media Storage (MinIO / S3)
    participant DB as 🗄️ PostgreSQL DB

    Manager->>AdminWeb: Chooses dish "Bò Fuji Áp Chảo" -> Uploads file `bo-fuji.jpg`
    AdminWeb->>DishesCtrl: POST /api/v1/dishes/42/image [multipart/form-data]
  
    activate DishesCtrl
    DishesCtrl->>DishesCtrl: Validate file format (.jpg, .png) & resize thumbnail
    DishesCtrl->>MediaStore: PUT /dishes/bo-fuji-42.jpg [Binary Stream]
    MediaStore-->>DishesCtrl: 200 OK (Stored Path: `/media/dishes/bo-fuji-42.jpg`)
  
    DishesCtrl->>DB: UPDATE dishes SET image_url = '/media/dishes/bo-fuji-42.jpg' WHERE id = 42
    DB-->>DishesCtrl: Record updated
    DishesCtrl-->>AdminWeb: HTTP 200 OK {"imageUrl": "/media/dishes/bo-fuji-42.jpg"}
    deactivate DishesCtrl

    AdminWeb-->>Manager: Preview displays newly uploaded dish photo
```

---

## 2.14. Shift Revenue & Gross Margin Analytics Query

* **Mapped Use Cases**: `UC-MGR-SEC-02`

```mermaid
sequenceDiagram
    autonumber
    actor Manager as 👔 Manager
    participant AdminWeb as 🌐 Manager Web Portal
    participant AnalyticsCtrl as 📊 AnalyticsController
    participant DB as 🗄️ PostgreSQL DB

    Manager->>AdminWeb: Navigates to "Financial Reports" -> Selects Date Range: Today
    AdminWeb->>AnalyticsCtrl: GET /api/v1/analytics/gross-margin?date=2026-09-14
  
    activate AnalyticsCtrl
    Note over AnalyticsCtrl,DB: Complex Aggregation Query across Invoices and Order Items
    AnalyticsCtrl->>DB: SELECT SUM(final_total), SUM(subtotal), SUM(cost_price) FROM invoices JOIN order_items...
    DB-->>AnalyticsCtrl: Raw Financial Totals
  
    AnalyticsCtrl->>AnalyticsCtrl: Compute: Gross Margin % = (Total Revenue - Total Cost) / Total Revenue
    AnalyticsCtrl-->>AdminWeb: HTTP 200 OK {"revenue": 45200000, "cost": 15800000, "grossMarginPct": 65.04}
    deactivate AnalyticsCtrl

    AdminWeb-->>Manager: Displays KPI summary cards and Top 5 Most Profitable Dishes chart
```

---

# PART 3: ACTIVITY DIAGRAMS (5 Business Workflows)

## 3.1. Advance Reservation & Walk-in Seating Flow

* **Mapped Use Cases**: `UC-EXT-05`, `UC-POS-PRI-01`

```mermaid
flowchart TD
    START([Guest Arrives at Restaurant Entrance]) --> CHECK_BOOKING{Does guest have advance reservation?}

    %% Branch 1: Has Booking
    CHECK_BOOKING -->|Yes| LOOKUP_BOOKING[Hostess enters phone/name in Reservation List]
    LOOKUP_BOOKING --> MATCH_FOUND{Booking found & table pre-assigned?}
    MATCH_FOUND -->|Match Found| CONFIRM_ARRIVE[Mark Reservation as SEATED]
    CONFIRM_ARRIVE --> GUIDE_TABLE[Escort guest to reserved table]

    MATCH_FOUND -->|No Match / Wrong Time| HANDLE_MISMATCH[Explain discrepancy to guest]
    HANDLE_MISMATCH --> CHECK_FLOOR

    %% Branch 2: Walk-in
    CHECK_BOOKING -->|No / Walk-in| CHECK_FLOOR[Check Floor Plan for VACANT tables matching party size]
    CHECK_FLOOR --> HAS_VACANT{Is suitable table available?}

    HAS_VACANT -->|No Table Available| ADD_WAITLIST[Add guest to Waiting List with queue buzzer]
    ADD_WAITLIST --> WAIT_CALL[Guest waits in lobby until table clears]
    WAIT_CALL --> CHECK_FLOOR

    HAS_VACANT -->|Available| SELECT_TABLE[Server taps VACANT table on Mobile App]
    SELECT_TABLE --> GUIDE_TABLE

    GUIDE_TABLE --> OPEN_TABLE[Server inputs guest count & opens table session]
    OPEN_TABLE --> STATUS_OCCUPIED[Table status transitions to OCCUPIED]
    STATUS_OCCUPIED --> END_SEATING([Start Dining Experience])
```

---

## 3.2. End-to-End Dining & Billing Cycle (4 Swimlanes)

* **Mapped Use Cases**: Full operational lifecycle across Customer, Server, Chef, and Cashier.

```mermaid
flowchart TD
    %% Lane 1: Customer
    subgraph LANE_CUS["👥 Customer"]
        C1([Arrive at Restaurant]) --> C2[Request Seating]
        C2 --> C3[Consult Menu with Waitstaff]
        C3 --> C4[Order Dishes with Dietary Notes]
        C4 --> C5[Dine & Enjoy Food]
        C5 --> C6{Order More Dishes?}
        C6 -->|Yes| C4
        C6 -->|No| C7[Request Pre-Bill]
        C7 --> C8{Is Pre-bill Accurate?}
        C8 -->|Dispute| C9[Request Item Adjustment]
        C8 -->|Confirmed| C10[Pay via Cash / VietQR]
        C10 --> C11([Depart Restaurant])
    end

    %% Lane 2: Waitstaff
    subgraph LANE_SRV["👤 Waitstaff (Server)"]
        S1[Check Floor Plan & Open Table]
        S2[Input Cart on Mobile App & Dispatch to Kitchen]
        S3[Receive 'Food Ready' Vibration Alert]
        S4[Collect Dishes from Pass & Serve to Table]
        S5[Coordinate Adjustment with Cashier]
        S6[Clear & Sanitize Table after departure]
        S7[Toggle Table status back to VACANT]
    end

    %% Lane 3: Kitchen
    subgraph LANE_KIT["👨‍🍳 Kitchen / Bar Staff"]
        K1[Receive Ticket on KDS with Audio Chime]
        K2[Tap Ticket: Claim COOKING status]
        K3[Cook Dishes according to Dietary Notes]
        K4[Tap Dish: Mark READY for Service]
    end

    %% Lane 4: Cashier
    subgraph LANE_CSH["💳 Cashier"]
        CS1[Print 80mm Pre-Bill for Table]
        CS2[Apply Vouchers & VIP Loyalty Points]
        CS3[Collect Cash or Display Dynamic VietQR]
        CS4[Verify Funds & Seal Immutable Invoice]
        CS5[Print Fiscal VAT Receipt]
    end

    %% Cross-lane Flow Tracing
    C2 --> S1 --> C3
    C4 --> S2
    S2 --> K1 --> K2 --> K3 --> K4
    K4 --> S3 --> S4 --> C5
    C7 --> CS1 --> C8
    C9 --> S5 --> CS1
    C10 --> CS2 --> CS3 --> CS4 --> CS5
    CS4 --> S6 --> S7
    CS5 --> C11
```

---

## 3.3. Void Item & Kitchen Waste Approval Process

* **Mapped Use Cases**: `UC-POS-SEC-03`, `UC-MGR-SEC-01`
* **Objective**: Prevents unrecorded food theft and enforces manager audit oversight.

```mermaid
flowchart TD
    START([Guest Requests Item Cancellation]) --> CHECK_STAGE{Current preparation stage of item?}

    %% Path 1: Queued (Safe to cancel)
    CHECK_STAGE -->|Status: QUEUED| AUTO_CANCEL[Cancel immediately on POS terminal]
    AUTO_CANCEL --> SEND_KDS_CANCEL[Dispatch cancellation sound to Kitchen KDS]
    SEND_KDS_CANCEL --> REMOVE_ITEM[Remove item from Table Order Cart]
    REMOVE_ITEM --> FINISH_VOID([Zero Loss - Bill Updated])

    %% Path 2: Cooking or Ready (Potential Loss)
    CHECK_STAGE -->|Status: COOKING or READY| WARN_POPUP[Alert: Kitchen has already started preparation!]
    WARN_POPUP --> CALL_MANAGER[Notify Restaurant Manager for Approval]
  
    CALL_MANAGER --> MGR_DECIDE{Manager Approves Cancellation?}

    MGR_DECIDE -->|Rejected| EXPLAIN_GUEST[Politely explain to guest: Dish is already cooked]
    EXPLAIN_GUEST --> KEEP_BILL([Dish remains on bill and is served])

    MGR_DECIDE -->|Approved| LOG_WASTE[Record Item into Kitchen Waste Ledger]
    LOG_WASTE --> RECORD_REASON[Record Reason: Chef Delay / Wrong Food / Guest Emergency]
    RECORD_REASON --> RECORD_MGR[Log Manager User ID for Audit Trail]
    RECORD_MGR --> DEDUCT_MARGIN[Deduct food cost from Shift Margin Report]
    DEDUCT_MARGIN --> REMOVE_ITEM
```

---

## 3.4. Split Bill & Divided Settlement Workflow

* **Mapped Use Cases**: `UC-EXT-03`
* **Objective**: Supports split dining parties paying by individual items or equal split.

```mermaid
flowchart TD
    START([Party Requests Separate Bills]) --> CHOOSE_SPLIT_TYPE{Split Method?}

    %% Method 1: Split by Items
    CHOOSE_SPLIT_TYPE -->|By Items Consumed| SELECT_ITEMS[Cashier assigns specific dishes to Bill A and Bill B]
    SELECT_ITEMS --> CALC_SUBTOTAL[System computes separate subtotal, tax & service fee per bill]

    %% Method 2: Equal Split
    CHOOSE_SPLIT_TYPE -->|Equal Division| INPUT_PERSONS[Cashier enters number of paying guests: N]
    INPUT_PERSONS --> DIVIDE_EQUAL[System divides Total Bill by N]

    CALC_SUBTOTAL --> PROCESS_A[Collect payment for Bill A: Cash / VietQR]
    DIVIDE_EQUAL --> PROCESS_A
  
    PROCESS_A --> CHECK_ALL_PAID{Are all split bills settled?}
    CHECK_ALL_PAID -->|No, pending Bill B| PROCESS_B[Collect payment for Bill B]
    PROCESS_B --> CHECK_ALL_PAID

    CHECK_ALL_PAID -->|Yes, All Paid| SEAL_INVOICES[Seal all sub-invoices with shared parent Order Code]
    SEAL_INVOICES --> RELEASE_TABLE[Update Table Status to CLEANING]
    RELEASE_TABLE --> END_SPLIT([Table Cycle Complete])
```

---

## 3.5. Cash Drawer Opening, Reconciliation & Handover

* **Mapped Use Cases**: `UC-EXT-04`
* **Objective**: Prevents cash shrinkage by enforcing double-entry blind counts during shift change.

```mermaid
flowchart TD
    START_SHIFT([Shift Starts]) --> COUNT_FLOAT[Cashier counts opening cash float: e.g. 2,000,000 VND]
    COUNT_FLOAT --> SUBMIT_OPEN[Submit 'Open Shift' in Web POS]
  
    SUBMIT_OPEN --> OPERATE[Process shift orders: Cash, Card, VietQR]
  
    OPERATE --> SHIFT_END([Shift Ends])
    SHIFT_END --> LOCK_STATION[Lock POS terminal to freeze further billing]
  
    LOCK_STATION --> BLIND_COUNT[Cashier performs blind count of physical cash drawer]
    BLIND_COUNT --> INPUT_PHYSICAL[Input physical cash amount into system]
  
    INPUT_PHYSICAL --> SYSTEM_AUDIT[System compares: Physical Cash vs Calculated Software Ledger]
    SYSTEM_AUDIT --> IS_MATCH{Does physical cash match ledger exactly?}

    IS_MATCH -->|Exact Match: Diff = 0| PRINT_Z[Print Fiscal Shift Z-Report]
  
    IS_MATCH -->|Discrepancy: Surplus or Deficit| JOINT_RECOUNT[Perform second blind count together with Manager]
    JOINT_RECOUNT --> STILL_DIFF{Still discrepant?}

    STILL_DIFF -->|Yes| WRITE_EXPLANATION[Cashier enters mandatory explanation note]
    WRITE_EXPLANATION --> MGR_COUNTERSIGN[Manager approves & countersigns discrepancy log]
    MGR_COUNTERSIGN --> PRINT_Z

    STILL_DIFF -->|No, miscount corrected| PRINT_Z

    PRINT_Z --> DROP_SAFE[Deposit cash surplus into restaurant safe]
    DROP_SAFE --> HANDOVER[Handover drawer with base float to incoming Cashier]
    HANDOVER --> FINISH([Shift Successfully Closed])
```

---

## 4. Quality & Compliance Summary

1. **Deterministic State Transitions**: No entity can transition illegally (e.g. an item cannot jump from `QUEUED` straight to `SERVED` without being marked `COOKING` and `READY`).
2. **Audit Accountability**: Every financial deviation (Item Void, Bill Dispute, Cash Drawer Discrepancy) requires explicit Manager authorization and persists in an immutable audit ledger.
3. **Hardware & Latency SLA**:
   * KDS ticket arrival latency: $\le 250\text{ ms}$ over SignalR WebSocket.
   * Instant 86 out-of-stock freeze: $\le 200\text{ ms}$ broadcast across all active mobile terminals.
   * Pre-bill thermal printing: $\le 800\text{ ms}$ execution over local TCP/IP port 9100.
