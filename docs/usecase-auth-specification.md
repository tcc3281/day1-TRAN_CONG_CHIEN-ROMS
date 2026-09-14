# Đặc Tả Use Case & Ma Trận Phân Quyền (Authentication & Authorization)

> **Hệ Thống Quản Lý Vận Hành Nhà Hàng (Restaurant Operations Management System - ROMS)**  
> **Nguyên lý thiết kế**: Xác định Actor (Tác nhân) $\longrightarrow$ Xác thực (Authentication) $\longrightarrow$ Phân quyền (Authorization) $\longrightarrow$ Danh mục Use Case (Chính & Phụ).

---

## 1. Mối Quan Hệ Giữa Actor, Xác Thực (Authen) và Phân Quyền (Author)

Trong kỹ thuật phần mềm hướng đối tượng và bảo mật, luồng kiểm soát truy cập được xác lập chặt chẽ:

```
[Người dùng thực tế] ──(Authentication)──> [Actor Định Danh + Role] ──(Authorization)──> [Thực thi Use Case]
```

1. **Actor (Chủ thể)**: Đại diện cho vai trò nghiệp vụ tham gia vào hệ thống.
2. **Authentication (Xác thực)**: Cơ chế hệ thống xác minh *"Bạn là ai?"*. Tùy đặc thù vận hành của nhà hàng F&B, phương thức đăng nhập phải tối ưu tốc độ và tính tiện dụng.
3. **Authorization (Phân quyền)**: Cơ chế hệ thống trả lời *"Bạn được phép làm những Use Case nào?"*. Áp dụng mô hình **RBAC (Role-Based Access Control)**.

---

## 2. Chiến Lược Xác Thực (Authentication Strategy) Theo Từng Actor

| Actor | Ngữ Cảnh Hoạt Động | Cơ Chế Xác Thực (Authen) | Lý Do Thiết Kế |
| :--- | :--- | :--- | :--- |
| **👤 Waitstaff (Phục vụ)** | Cầm tablet di chuyển quanh phòng ăn, ca làm việc nhiều nhân viên luân phiên chạm máy. | **Mã PIN nhanh (4–6 chữ số)** | Giờ cao điểm không thể gõ mật khẩu dài. Nhập PIN 1 giây để gán `server_id` vào đơn hàng. |
| **👨‍🍳 Kitchen (Đầu bếp / Bar)** | Màn hình cảm ứng KDS treo cố định tại khu bếp, tay nhân viên dính dầu mỡ/nước. | **Device / Station Token** | Thiết bị đăng nhập 1 lần lúc mở nhà hàng theo trạm (Hot Kitchen, Cold Salad, Bar). Không bắt nhập mật khẩu khi thao tác. |
| **💳 Cashier (Thu ngân)** | Ngồi tại quầy thu ngân trung tâm, chịu trách nhiệm về dòng tiền thực tế. | **Tài khoản cá nhân + Mở ca tiền mặt (Session ID)** | Bắt buộc định danh chính xác người thu tiền để kiểm kê két tiền (Cash Drawer Reconcile) lúc giao ca. |
| **👔 Manager (Quản lý / Admin)** | Sử dụng máy tính Back Office hoặc điện thoại di động điều hành. | **Username/Password + JWT Token** (Expiry: 15p, Refresh Token: 7 ngày) | Bảo vệ các nghiệp vụ trọng yếu: cấu hình menu, sửa giá bán, xem báo cáo doanh thu và duyệt hủy đơn. |

---

## 3. Danh Mục Use Case Hệ Thống (Phân Tầng Chính & Phụ)

```
Phân hệ Nghiệp Vụ
├── 1. Gọi món tại bàn (POS Ordering)
│   ├── Use Case Chính (Primary): UC-POS-PRI-01, 02, 03
│   └── Use Case Phụ / Mở rộng (Secondary): UC-POS-SEC-01, 02, 03
├── 2. Điều phối bếp & Bar (Kitchen KDS)
│   ├── Use Case Chính (Primary): UC-KIT-PRI-01, 02, 03
│   └── Use Case Phụ / Mở rộng (Secondary): UC-KIT-SEC-01, 02
├── 3. Thu ngân & Thanh toán (Billing & Settlement)
│   ├── Use Case Chính (Primary): UC-CSH-PRI-01, 02, 03
│   └── Use Case Phụ / Mở rộng (Secondary): UC-CSH-SEC-01, 02, 03
└── 4. Quản trị & Menu (Back Office & Governance)
    ├── Use Case Chính (Primary): UC-MGR-PRI-01, 02
    └── Use Case Phụ / Mở rộng (Secondary): UC-MGR-SEC-01, 02
```

---

### Phân Hệ 1: Gọi Món Tại Bàn (POS Ordering)

#### A. Use Case Chính (Primary)
* **`UC-POS-PRI-01`: Mở Bàn & Bắt Đầu Phiên Ăn (Open Table)**
  * *Actor*: Phục vụ (`Server`).
  * *Mục tiêu*: Chuyển bàn từ `VACANT` $\to$ `OCCUPIED`, tạo bản ghi `ORDERS` với mã đơn duy nhất (ví dụ: `#ORD-8821`).
  * *Đầu vào*: Số bàn, số lượng khách thực tế.
* **`UC-POS-PRI-02`: Chọn Món & Thêm Vào Giỏ Hàng (Cart Management)**
  * *Actor*: Phục vụ (`Server`).
  * *Mục tiêu*: Tìm kiếm món theo tên/SKU, chọn số lượng, kiểm tra món còn khả dụng hay không.
  * *Ràng buộc*: Không cho phép thêm món đang ở trạng thái `OUT_OF_STOCK`.
* **`UC-POS-PRI-03`: Bắn Đơn Xuống Bếp (Dispatch Order to Kitchen)**
  * *Actor*: Phục vụ (`Server`).
  * *Mục tiêu*: Xác nhận các món trong giỏ, tạo các bản ghi `ORDER_ITEMS` ở trạng thái `QUEUED`, phát tín hiệu Real-time (SignalR) tới màn hình KDS của bếp.

#### B. Use Case Phụ / Mở Rộng (Secondary / Extension)
* **`UC-POS-SEC-01`: Đính Kèm Ghi Chú Chế Biến (Special Dietary Notes)** `<<extend UC-POS-PRI-02>>`
  * *Mục tiêu*: Gắn yêu cầu riêng của khách vào từng dòng món ăn (*ít cay, không hành, sốt để riêng*).
* **`UC-POS-SEC-02`: Gọi Món Bổ Sung Đợt Tiếp Theo (Add-on Ordering)** `<<extend UC-POS-PRI-03>>`
  * *Mục tiêu*: Khách gọi thêm món đợt 2/3 mà không làm gián đoạn trạng thái nấu của các món đợt 1.
* **`UC-POS-SEC-03`: Yêu Cầu Hủy Món Đã Gửi Bếp (Request Void/Cancellation)** `<<extend UC-POS-PRI-03>>`
  * *Mục tiêu*: Khách đổi ý không ăn món đã bấm gửi bếp.
  * *Quy tắc kiểm soát rủi ro*: Bắt buộc phải có `Manager` phê duyệt; ghi nhận nguyên nhân hủy (Khách hủy / Bếp làm hỏng).

---

### Phân Hệ 2: Điều Phối Bếp & Pha Chế (Kitchen KDS)

#### A. Use Case Chính (Primary)
* **`UC-KIT-PRI-01`: Tiếp Nhận Vé Món Theo Thứ Tự FIFO (FIFO Ticket Queue)**
  * *Actor*: Đầu bếp (`Kitchen`).
  * *Mục tiêu*: Màn hình hiển thị các món ăn xếp hàng theo thứ tự thời gian gọi (*First In First Out*), kèm đồng hồ đếm phút cảnh báo món chờ lâu.
* **`UC-KIT-PRI-02`: Nhận Nấu Món (Claim Cooking Stage)**
  * *Actor*: Đầu bếp (`Kitchen`).
  * *Mục tiêu*: Chuyển trạng thái món từ `QUEUED` $\to$ `COOKING` để các đầu bếp khác không nấu trùng món.
* **`UC-KIT-PRI-03`: Báo Nấu Xong (Mark Dish Ready)**
  * *Actor*: Đầu bếp (`Kitchen`).
  * *Mục tiêu*: Chuyển món từ `COOKING` $\to$ `READY`, phát thông báo âm thanh hoặc tín hiệu để nhân viên tiếp thực (Runner) bưng ra bàn.

#### B. Use Case Phụ / Mở Rộng (Secondary / Extension)
* **`UC-KIT-SEC-01`: Lọc Vé Theo Trạm Chuyên Môn (Station Routing)** `<<extend UC-KIT-PRI-01>>`
  * *Mục tiêu*: Bếp xào chỉ thấy món nóng, quầy Bar chỉ thấy đồ uống, quầy lạnh chỉ thấy gỏi/salad.
* **`UC-KIT-SEC-02`: Báo Hết Món Tức Thì (Instant 86 / Out-of-Stock Alert)** `<<extend UC-KIT-PRI-01>>`
  * *Mục tiêu*: Khi hết nguyên liệu, đầu bếp bấm nút 1 chạm để khóa món sang `OUT_OF_STOCK`, ngay lập tức đồng bộ khóa trên mọi tablet POS của bồi bàn.

---

### Phân Hệ 3: Thu Ngân & Thanh Toán (Billing & Settlement)

#### A. Use Case Chính (Primary)
* **`UC-CSH-PRI-01`: In Phiếu Tạm Tính (Print Pre-Bill)**
  * *Actor*: Thu ngân (`Cashier`).
  * *Mục tiêu*: Xuất phiếu in nhiệt 80mm mang lại bàn để khách kiểm tra danh sách món trước khi thanh toán.
* **`UC-CSH-PRI-02`: Quyết Toán Hóa Đơn Đa Kênh (Settle Multi-Channel Payment)**
  * *Actor*: Thu ngân (`Cashier`).
  * *Mục tiêu*: Ghi nhận tiền thu qua Tiền mặt (Cash), Chuyển khoản VietQR động, Quẹt thẻ POS, hoặc Ví điện tử. Hỗ trợ tách/ghép phương thức thanh toán.
* **`UC-CSH-PRI-03`: Đóng Đơn & Giải Phóng Bàn (Close Order & Release Table)**
  * *Actor*: Thu ngân (`Cashier`).
  * *Mục tiêu*: Niêm phong bản ghi hóa đơn `INVOICES` (bất biến), chuyển trạng thái bàn về `VACANT` để đón lượt khách tiếp theo.

#### B. Use Case Phụ / Mở Rộng (Secondary / Extension)
* **`UC-CSH-SEC-01`: Áp Mã Giảm Giá Voucher (Redeem Voucher)** `<<extend UC-CSH-PRI-02>>`
  * *Mục tiêu*: Kiểm tra tính hợp lệ của mã voucher, trừ tiền theo % hoặc số tiền cố định.
* **`UC-CSH-SEC-02`: Tích & Tiêu Điểm Khách Thân Thiết (Loyalty Points)** `<<extend UC-CSH-PRI-02>>`
  * *Mục tiêu*: Nhập số điện thoại khách, hiển thị hạng thành viên, quy đổi điểm tích lũy thành tiền giảm giá.
* **`UC-CSH-SEC-03`: Tự Động Tính Tiền Thừa (Cash Change Calculator)** `<<extend UC-CSH-PRI-02>>`
  * *Mục tiêu*: Thu ngân nhập số tiền khách đưa, hệ thống tự động tính số tiền thừa trả lại để chống thất thoát.

---

### Phân Hệ 4: Quản Trị & Menu (Back Office & Governance)

#### A. Use Case Chính (Primary)
* **`UC-MGR-PRI-01`: Quản Trị Danh Mục & Món Ăn (Menu CRUD)**
  * *Actor*: Quản lý (`Manager`).
  * *Mục tiêu*: Thêm mới, chỉnh sửa thông tin món, hình ảnh, đơn vị tính, phân nhóm danh mục.
* **`UC-MGR-PRI-02`: Cấu Hình Giá Bán, Giá Vốn & Thuế VAT (Pricing & Cost Margins)**
  * *Actor*: Quản lý (`Manager`).
  * *Mục tiêu*: Quản lý giá bán lẻ, giá vốn ước tính và thiết lập thuế suất VAT (8%).

#### B. Use Case Phụ / Mở Rộng (Secondary / Extension)
* **`UC-MGR-SEC-01`: Phê Duyệt Yêu Cầu Hủy Món (Approve Void Items)** `<<extend UC-POS-SEC-03>>`
  * *Mục tiêu*: Kiểm tra lý do phục vụ yêu cầu hủy món, bấm phê duyệt để trừ món khỏi hóa đơn và ghi log kiểm toán.
* **`UC-MGR-SEC-02`: Báo Cáo Doanh Thu & Tỷ Suất Lợi Nhuận Gộp (Gross Margin Analytics)**
  * *Mục tiêu*: Theo dõi doanh thu theo ca, thống kê phương thức thanh toán, tỷ suất lợi nhuận gộp theo từng món ăn.

---

## 4. Ma Trận Phân Quyền Vai Trò (RBAC Matrix)

Ma trận này ánh xạ trực tiếp từng mã Use Case tới quyền hạn của 4 Actor:
* **✅ (Allow)**: Được phép toàn quyền thực thi.
* **❌ (Deny)**: Hệ thống chặn (Trả về HTTP 403 Forbidden).
* **⚠️ (Conditional)**: Phải thỏa mãn điều kiện hoặc cần cấp trên duyệt.

| Mã Use Case | Tên Chức Năng Nghiệp Vụ | 👤 Server | 👨‍🍳 Kitchen | 💳 Cashier | 👔 Manager |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `UC-POS-PRI-01` | Mở bàn & gán lượt khách | ✅ | ❌ | ✅ | ✅ |
| `UC-POS-PRI-02` | Thêm món vào giỏ hàng | ✅ | ❌ | ✅ | ✅ |
| `UC-POS-PRI-03` | Gửi đơn xuống bếp (KDS) | ✅ | ❌ | ✅ | ✅ |
| `UC-POS-SEC-01` | Gắn ghi chú món ăn | ✅ | ❌ | ✅ | ✅ |
| `UC-POS-SEC-02` | Gọi món bổ sung đợt 2/3 | ✅ | ❌ | ✅ | ✅ |
| `UC-POS-SEC-03` | Gửi yêu cầu hủy món đã nấu | ⚠️ Gửi request | ❌ | ⚠️ Gửi request | ❌ |
| `UC-KIT-PRI-01` | Xem hàng đợi món FIFO | ❌ | ✅ | ❌ | ✅ |
| `UC-KIT-PRI-02` | Nhận nấu món (`COOKING`) | ❌ | ✅ | ❌ | ❌ |
| `UC-KIT-PRI-03` | Báo món đã nấu xong (`READY`) | ❌ | ✅ | ❌ | ❌ |
| `UC-KIT-SEC-01` | Lọc vé theo trạm nấu | ❌ | ✅ | ❌ | ✅ |
| `UC-KIT-SEC-02` | Báo hết món tức thì (Khóa 86) | ❌ | ✅ | ❌ | ✅ |
| `UC-CSH-PRI-01` | In phiếu tạm tính Pre-bill | ❌ | ❌ | ✅ | ✅ |
| `UC-CSH-PRI-02` | Quyết toán hóa đơn đa kênh | ❌ | ❌ | ✅ | ✅ |
| `UC-CSH-PRI-03` | Giải phóng bàn (`VACANT`) | ❌ | ❌ | ✅ | ✅ |
| `UC-CSH-SEC-01` | Áp mã khuyến mãi Voucher | ❌ | ❌ | ⚠️ Theo hạn mức | ✅ |
| `UC-CSH-SEC-02` | Tra cứu & tích điểm VIP | ❌ | ❌ | ✅ | ✅ |
| `UC-CSH-SEC-03` | Tính tiền thừa tự động | ❌ | ❌ | ✅ | ✅ |
| `UC-MGR-PRI-01` | Thêm / Sửa / Xóa món ăn | ❌ | ❌ | ❌ | ✅ |
| `UC-MGR-PRI-02` | Cấu hình giá bán & Thuế VAT | ❌ | ❌ | ❌ | ✅ |
| `UC-MGR-SEC-01` | Duyệt yêu cầu hủy món | ❌ | ❌ | ❌ | ✅ |
| `UC-MGR-SEC-02` | Xem báo cáo doanh thu & Lãi | ❌ | ❌ | ⚠️ Chỉ ca hiện tại | ✅ Toàn hệ thống |

---

## 5. Ánh Xạ Đến Kiến Trúc Kỹ Thuật (Backend & Database)

1. **Bảo mật API (Backend .NET Web API)**:
   ```csharp
   [Authorize(Roles = "MANAGER")]
   [HttpPost("api/v1/orders/{orderId}/items/{itemId}/void-approve")]
   public async Task<IActionResult> ApproveVoidItem(...) { ... }
   ```
2. **Kiểm tra quyền trên Database (DBML)**:
   * Bảng `USERS` liên kết khóa ngoại với `ROLES` qua `role_id`.
   * Bảng `ORDER_ITEMS` có trường `approved_by` (FK trỏ về `USERS.id` của Manager) nhằm bảo đảm tính minh bạch kiểm toán khi có món bị hủy.

---

## 6. Lộ Trình Mở Rộng Ngoài Phạm Vi Core 80/20 (Phase 1.5 & Phase 2+ Backlog)

> ⚠️ **Quy Tắc Quản Trị Phạm Vi (Scope Control)**:  
> Các Use Case dưới đây là các tính năng nghiệp vụ thực tế nhưng **được tách riêng vào danh sách chờ (Backlog) để ưu tiên hoàn thiện trước nhóm 80/20 Core MVP (Menu - POS - Billing)**.  
> Đội ngũ phát triển chỉ kích hoạt nhóm tính năng này sau khi luồng bán hàng cốt lõi đã chạy mượt mà và kiểm thử xong.

### 6.1. Nhóm Điều Phối Phòng Ăn & Két Tiền (Phase 1.5 - Ưu Tiên Tiếp Theo)
* **`UC-EXT-01`: Chuyển Bàn (Transfer Table)**
  * *Actor*: `Server`, `Cashier`.
  * *Mô tả*: Khách đổi chỗ ngồi. Chuyển toàn bộ danh sách món từ Bàn A sang Bàn B; cập nhật Bàn A về `VACANT` và Bàn B sang `OCCUPIED`.
* **`UC-EXT-02`: Gộp Bàn (Merge Tables)**
  * *Actor*: `Server`, `Cashier`.
  * *Mô tả*: Khách đi đoàn đông ngồi nhiều bàn. Nhập 2 đơn hàng thành 1 mã `Order ID` duy nhất để thanh toán chung một hóa đơn.
* **`UC-EXT-03`: Tách Hóa Đơn / Chia Tiền (Split Bill)**
  * *Actor*: `Cashier`.
  * *Mô tả*: Khách muốn chia tiền theo món ăn riêng hoặc chia đều. Tách 1 đơn hàng thành nhiều hóa đơn (`Invoice A`, `Invoice B`) với phương thức thanh toán độc lập.
* **`UC-EXT-04`: Mở Ca & Bàn Giao Két Tiền Mặt (Cash Drawer & Shift Handover)**
  * *Actor*: `Cashier`.
  * *Mô tả*: Khai báo số dư tiền mặt đầu ca (Float), chốt ca và in báo cáo doanh thu theo ca (Báo cáo Z), đối soát tiền mặt thực tế vs số liệu phần mềm.
* **`UC-EXT-05`: Đặt Bàn Trước (Advance Reservation)**
  * *Actor*: `Server`, `Cashier`.
  * *Mô tả*: Ghi nhận thông tin khách đặt trước (Họ tên, SĐT, Số khách, Giờ đến). Tự động khóa bàn sang `RESERVED` trước giờ hẹn 30 phút *(đã có bảng `RESERVATIONS` trong DBML)*.

### 6.2. Nhóm Quản Trị Kho & Định Lượng Thực Phẩm (Phase 2 - Bếp & Kho)
* **`UC-EXT-06`: Cấu Hình Định Lượng Món Ăn (Recipe / Bill of Materials - BOM)**
  * *Actor*: `Manager`.
  * *Mô tả*: Thiết lập công thức định mức cho từng món (ví dụ: 1 phần Bò bít tết = 200g thăn bò + 50g sốt tiêu + 100g khoai tây chiên).
* **`UC-EXT-07`: Tự Động Trừ Tồn Kho Thực Tế Theo Định Lượng (Auto Stock Deduction)**
  * *Actor*: `System (Tự động)`.
  * *Mô tả*: Mỗi khi hóa đơn được quyết toán (`PAID`), hệ thống tự động trừ tồn kho nguyên liệu tương ứng theo công thức BOM.
* **`UC-EXT-08`: Ghi Nhận Hao Hụt / Hủy Bếp (Kitchen Waste Logging)**
  * *Actor*: `Kitchen`, `Manager`.
  * *Mô tả*: Ghi nhận chi phí hao hụt khi nguyên liệu hết hạn hoặc đồ ăn nấu hỏng phải bỏ đi để tính chính xác vào giá vốn.

### 6.3. Nhóm Nghiệp Vụ Khách Hàng Thân Thiết & Marketing Nâng Cao (Phase 2.5+)
> 📌 **Lưu ý Kiến Trúc**: Hệ thống ROMS là **ứng dụng nội bộ (Internal Staff System)**, hoàn toàn **KHÔNG CÓ cổng giao diện dành cho Khách hàng (No Customer Portal/App)**.  
> Bảng `CUSTOMERS` trong CSDL chỉ đóng vai trò là **Đối tượng dữ liệu (Data Entity)**. Mọi thao tác tra cứu, tích điểm, áp mã đều do **Thu ngân** hoặc **Phục vụ** thao tác thay trên giao diện nội bộ.

* **`UC-EXT-09`: Tra Cứu Lịch Sử Tiêu Dùng Của Khách Hàng (Customer CRM History)**
  * *Actor*: `Cashier`, `Manager`.
  * *Mô tả*: Thu ngân nhập SĐT để xem lịch sử các hóa đơn cũ và tần suất ghé quán của khách.
* **`UC-EXT-10`: Cấu Hình Khung Giờ Vàng / Happy Hour (Dynamic Pricing)**
  * *Actor*: `Manager`.
  * *Mô tả*: Thiết lập giảm giá tự động theo khung giờ (ví dụ: Giảm 20% đồ uống từ 14:00 – 17:00).
* **`UC-EXT-11`: Cấu Hình Bán Theo Combo / Món Tùy Chọn (Modifiers & Combos)**
  * *Actor*: `Manager`.
  * *Mô tả*: Thiết lập danh sách món bán theo gói combo hoặc món có topping tùy chọn.

---

### 6.4. Ma Trận Phân Quyền Cho Nhóm Mở Rộng (Extension RBAC Matrix)

| Mã Use Case | Tên Chức Năng Mở Rộng | 👤 Server | 👨‍🍳 Kitchen | 💳 Cashier | 👔 Manager |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `UC-EXT-01` | Chuyển bàn phòng ăn | ✅ | ❌ | ✅ | ✅ |
| `UC-EXT-02` | Gộp bàn tiệc | ✅ | ❌ | ✅ | ✅ |
| `UC-EXT-03` | Tách hóa đơn (Split bill) | ❌ | ❌ | ✅ | ✅ |
| `UC-EXT-04` | Mở ca & Chốt két tiền mặt | ❌ | ❌ | ✅ | ✅ |
| `UC-EXT-05` | Đặt bàn trước (Booking) | ✅ | ❌ | ✅ | ✅ |
| `UC-EXT-06` | Cấu hình định lượng món (BOM) | ❌ | ❌ | ❌ | ✅ |
| `UC-EXT-07` | Tự động trừ kho nguyên liệu | ❌ | ❌ | ❌ | 🤖 Tự động |
| `UC-EXT-08` | Báo cáo hao hụt bếp (Waste) | ❌ | Ghi nhận | ❌ | ✅ Duyệt |
| `UC-EXT-09` | Tra cứu lịch sử tiêu dùng khách | ❌ | ❌ | ✅ | ✅ |
| `UC-EXT-10` | Cấu hình khung giờ vàng | ❌ | ❌ | ❌ | ✅ |
| `UC-EXT-11` | Cấu hình món Combo / Topping | ❌ | ❌ | ❌ | ✅ |

