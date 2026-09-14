# Đặc Tả Giao Thức Thời Gian Thực (SignalR Realtime Contract)

> **Hệ Thống**: Restaurant Operations Management System (ROMS)  
> **Giao thức**: WebSocket / ASP.NET Core SignalR Core  
> **Hub Endpoint**: `/hubs/restaurant`  
> **Mục tiêu**: Đồng bộ trạng thái tức thì giữa **Máy tính bảng phục vụ (POS)**, **Màn hình cảm ứng bếp (KDS)** và **Quầy thu ngân (Cashier Desk)** với độ trễ dưới 200ms.

---

## 1. Cơ Chế Kết Nối & Xác Thực (Connection & Auth)

### 1.1. URL Kết Nối & Query Parameters
* **URL**: `wss://api.giaviviet.vn/hubs/restaurant` (hoặc `http://localhost:5000/hubs/restaurant`)
* **Xác thực**:
  * **Thiết bị phục vụ (Waitstaff)**: Gửi Access Token qua Query Parameter `?access_token=<JWT_OR_PIN_SESSION>`
  * **Màn hình trạm bếp (KDS Kiosk)**: Gửi Station Token qua Query Parameter `?station_token=<STATION_TOKEN>&station=<HOT|COLD|BAR>`

### 1.2. Phân Nhóm Kênh Phát Sóng (Hub Groups)
Khi kết nối thành công, Server tự động hoặc qua hàm `JoinGroup` phân loại client vào các nhóm logic:

```
                  ┌─► Group: "Floor_Waitstaff"  (Nhận rung chuông khi món READY, nhận cảnh báo 86)
                  │
ROMS SignalR Hub ─┼─► Group: "Station_HOT"      (Nhận vé nấu bếp nóng theo FIFO)
  (/hubs/restaurant)─┼─► Group: "Station_COLD"     (Nhận vé salad, món nguội, khai vị)
                  ├─► Group: "Station_BAR"      (Nhận vé pha chế đồ uống)
                  ├─► Group: "Cashier_Desk"     (Nhận cập nhật bàn xin in bill, bàn đã ăn xong)
                  └─► Group: "Managers"         (Nhận thông báo xin duyệt hủy món đang nấu)
```

---

## 2. Danh Mục Sự Kiện Chi Tiết (Realtime Events Specification)

### 2.1. Server $\longrightarrow$ Client (Sự kiện Đẩy từ Máy Chủ Xuống Thiết Bị)

#### Event 1: `ReceiveNewTicket` (Bắn Vé Món Xuống Bếp KDS)
* **Kênh nhận**: `Group("Station_HOT")`, `Group("Station_COLD")`, `Group("Station_BAR")`
* **Trigger**: Phục vụ bấm **"Gửi Bếp"** trên tablet (`POST /api/v1/orders/{id}/items`).
* **Hành vi UI**: Màn hình KDS phát tiếng chuông *Bíp bíp*, vé mới chèn vào đầu hàng đợi FIFO với viền nhấp nháy xanh.
* **Payload JSON**:
```json
{
  "orderId": 8821,
  "orderCode": "#ORD-8821",
  "tableNumber": "Bàn 03",
  "serverName": "Trần Công Chiến",
  "isAddon": false,
  "station": "HOT",
  "dispatchedAt": "2026-09-14T14:30:15Z",
  "items": [
    {
      "itemId": 101,
      "dishId": 10,
      "dishName": "Bò Fuji Áp Chảo Sốt Tiêu",
      "quantity": 2,
      "cookingNote": "Ít cay, sốt riêng",
      "status": "QUEUED"
    },
    {
      "itemId": 102,
      "dishId": 14,
      "dishName": "Lẩu Nấm Chim Câu",
      "quantity": 1,
      "cookingNote": "Nước trong",
      "status": "QUEUED"
    }
  ]
}
```

---

#### Event 2: `DishStatusChanged` (Cập Nhật Tiến Trình Món Ăn)
* **Kênh nhận**: `Group("Floor_Waitstaff")`, `Group("Cashier_Desk")`
* **Trigger**: Đầu bếp chạm vào món trên KDS để đổi trạng thái (`QUEUED` $\to$ `COOKING` $\to$ `READY`).
* **Hành vi UI**:
  * Khi món sang `READY`: Tablet của phục vụ **rung và phát âm thanh báo nhận món** để runner lập tức bưng ra bàn.
  * Màn hình Cashier đổi màu badge trạng thái món.
* **Payload JSON**:
```json
{
  "itemId": 101,
  "orderId": 8821,
  "dishName": "Bò Fuji Áp Chảo Sốt Tiêu",
  "tableNumber": "Bàn 03",
  "previousStatus": "COOKING",
  "newStatus": "READY",
  "station": "HOT",
  "updatedAt": "2026-09-14T14:42:00Z"
}
```

---

#### Event 3: `DishOutOfStockAlert` (Cảnh Báo Khóa Món Hết Hàng 86 Tức Thì)
* **Kênh nhận**: **Toàn bộ hệ thống** (`All Clients`: Mọi Tablet phục vụ và Quầy thu ngân).
* **Trigger**: Đầu bếp hoặc Quản lý gạt công tắc khóa món (`PATCH /api/v1/dishes/{id}/status`).
* **Hành vi UI**:
  * Thẻ món ăn trên lưới Menu của toàn bộ tablet phục vụ lập tức chuyển sang màu xám mờ, đóng dấu nhãn đỏ **`[HẾT HÀNG - 86]`**.
  * Ngăn chặn hành vi nhấn chọn món vào giỏ hàng ngay tại tầng giao diện.
* **Payload JSON**:
```json
{
  "dishId": 10,
  "sku": "BO-FUJI-01",
  "dishName": "Bò Fuji Áp Chảo Sốt Tiêu",
  "status": "OUT_OF_STOCK",
  "reason": "Hết nguyên liệu thịt bò Fuji",
  "triggeredBy": "Chef Tuấn (Bếp trưởng)",
  "timestamp": "2026-09-14T14:45:00Z"
}
```

---

#### Event 4: `TableStatusUpdated` (Đồng Bộ Trạng Thái Sơ Đồ Bàn)
* **Kênh nhận**: `Group("Floor_Waitstaff")`, `Group("Cashier_Desk")`
* **Trigger**: Khi bàn mở phiên, chuyển bàn, xin in tạm tính hoặc đã thanh toán xong.
* **Hành vi UI**: Ô bàn trên sơ đồ sàn tự động đổi màu tương ứng:
  * `VACANT` $\to$ 🟢 Xanh lục
  * `OCCUPIED` $\to$ 🔴 Đỏ đậm
  * `BILLING_PENDING` $\to$ 🟠 Cam
  * `CLEANING` $\to$ 🟣 Tím
* **Payload JSON**:
```json
{
  "tableId": 3,
  "tableNumber": "Bàn 03",
  "zone": "Tầng 1",
  "previousStatus": "BILLING_PENDING",
  "newStatus": "VACANT",
  "currentOrderId": null,
  "updatedAt": "2026-09-14T15:10:00Z"
}
```

---

#### Event 5: `PaymentConfirmed` (Xác Nhận Tiền Đã Vào Tài Khoản)
* **Kênh nhận**: `Group("Cashier_Desk")`, `Group("Floor_Waitstaff")`
* **Trigger**: Webhook ngân hàng bắn báo tiền về khớp mã VietQR (`POST /api/v1/payments/vietqr/callback`).
* **Hành vi UI**: Quầy thu ngân tự động đóng modal VietQR, hiển thị thông báo tích xanh *"Đã nhận đủ 963,900 VNĐ"*, tự động kích hoạt máy in nhiệt in biên lai VAT và giải phóng bàn về `VACANT`.
* **Payload JSON**:
```json
{
  "invoiceId": 1042,
  "invoiceCode": "#HD-2026-0001",
  "tableNumber": "Bàn 03",
  "paymentMethod": "VIETQR",
  "amountPaid": 963900,
  "transactionRef": "ROMS HD1042",
  "paidAt": "2026-09-14T15:05:32Z"
}
```

---

#### Event 6: `CancellationApprovalRequested` (Yêu Cầu Quản Lý Duyệt Hủy Món Đang Nấu)
* **Kênh nhận**: `Group("Managers")`
* **Trigger**: Phục vụ bấm hủy món nhưng bếp đã bấm `COOKING` (`DELETE /api/v1/orders/{id}/items/{itemId}`).
* **Hành vi UI**: Điện thoại quản lý hiện popup yêu cầu phê duyệt hủy món kèm lý do của khách.
* **Payload JSON**:
```json
{
  "orderId": 8821,
  "itemId": 101,
  "dishName": "Bò Fuji Áp Chảo Sốt Tiêu",
  "tableNumber": "Bàn 03",
  "requestedBy": "Phục vụ Lan",
  "reason": "Khách chờ lâu quá 25 phút muốn hủy",
  "elapsedCookingMinutes": 18
}
```

---

## 3. Client $\longrightarrow$ Server (Hàm Gọi Từ Client Lên Hub)

| Hub Method (C# Signature) | Tham số | Mô tả Nghiệp Vụ |
| :--- | :--- | :--- |
| `JoinStation(string stationName)` | `stationName`: `"HOT"`, `"COLD"`, `"BAR"` | KDS Kiosk đăng ký lắng nghe vé riêng theo khu vực chuyên môn. |
| `AcknowledgeTicket(long orderId)` | `orderId`: Mã đơn | Bếp xác nhận đã nhìn thấy vé (dừng tiếng chuông cảnh báo lặp lại). |
| `HeartbeatPing()` | `none` | Client gửi định kỳ mỗi 15 giây để duy trì kết nối qua Nginx reverse proxy. |

---

## 4. Chiến Lược Phục Hồi & Ngoại Tuyến (Reconnection & Resilience)

1. **Tự Động Kết Nối Lại (Auto Reconnect)**:
   * Cấu hình Client SignalR: `.withAutomaticReconnect([0, 2000, 5000, 10000, 30000])`.
   * Khi mất mạng Wifi: Hiển thị thanh cảnh báo đỏ trên UI: *"Mất kết nối máy chủ - Đang thử kết nối lại..."*.
2. **Đồng Bộ Lại Dữ Liệu Sau Khi Phục Hồi (State Resync)**:
   * Sau khi kết nối thành công trở lại (`onreconnected`):
     * KDS tự động gọi `GET /api/v1/kds/tickets` để quét lại toàn bộ vé đang mở, tránh tình trạng bị sót vé trong lúc mạng rớt.
     * POS tự động gọi `GET /api/v1/tables` và `GET /api/v1/dishes` để cập nhật trạng thái mới nhất.
3. **Chống Duplicate Message**:
   * Mỗi sự kiện mang theo trường `timestamp` và `itemId`/`orderId`. Client kiểm tra nếu trạng thái của item đã ở mức cao hơn thì bỏ qua event đến trễ.
