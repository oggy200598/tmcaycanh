# CONTEXT & PROJECT GUIDELINES: TMCayCanh

> Tài liệu quy chuẩn kỹ thuật, quy tắc nghiệp vụ và chuẩn hóa dữ liệu toàn diện cho hệ thống website thương mại điện tử kinh doanh cây cảnh tích hợp GIS **TMCayCanh**.
> Mọi thay đổi về code, schema hoặc tính năng cần tuân thủ nghiêm ngặt các quy tắc dưới đây nhằm bảo đảm tính nhất quán dữ liệu từ Database, Backend đến Frontend.

---

## 1. TỔNG QUAN HỆ THỐNG VÀ CÔNG NGHỆ

- **Tên dự án:** TMCayCanh (E-commerce Cây cảnh tích hợp GIS).
- **Frontend:** React (Vite), Axios, Leaflet/Mapbox/OpenLayers (Bản đồ tương tác GIS), Vanilla CSS/CSS Modules (tuân thủ Rich Aesthetics, Responsive).
- **Backend:** Node.js, Express REST API, PostgreSQL (sử dụng PostGIS / pg driver).
- **Database:** PostgreSQL (Hệ cơ sở dữ liệu quan hệ 12 bảng chuẩn hóa).
- **Spatial Engine:** Tính toán khoảng cách (Haversine/GIS ST_Distance), lọc bán kính (Spatial Radius Query), đối chiếu khí hậu/thổ nhưỡng (Spatial Matching Engine).

---

## 2. CHUẨN HÓA DỮ LIỆU & QUY ƯỚC ĐẶT TÊN (DATA CONSISTENCY)

Để tránh xung đột giữa PostgreSQL (tự chuyển lowercase nếu không bọc ngoặc kép) và JavaScript (camelCase):

### 2.1. Quy ước Database (PostgreSQL)

- **Tên bảng:** Viết theo dạng `PascalCase` bọc ngoặc kép khi định nghĩa hoặc truy vấn trong SQL:
  - `"NguoiDung"`, `"NhaCungCap"`, `"DanhMuc"`, `"DiaChiGiaoHang"`
  - `"VuonUom"`, `"CayCanh"`, `"YeuCauSinhTruong"`, `"TonKho"`
  - `"TaptinTruyenThong"`, `"DonHang"`, `"ChiTietDonHang"`, `"DanhGia"`
- **Tên cột:** Viết theo dạng `camelCase` bọc ngoặc kép trong DDL:
  - Ví dụ: `"maCay"`, `"tenCay"`, `"giaBan"`, `"soLuongTon"`, `"viDo"`, `"kinhDo"`,...
- **Định dạng dữ liệu thống nhất:**
  - Tiền tệ: `NUMERIC(15, 2)` (Backend xử lý định dạng Number, Frontend hiển thị format `VND`).
  - Tọa độ GIS: `DOUBLE PRECISION` (`viDo`: -90.0 đến +90.0, `kinhDo`: -180.0 đến +180.0) hoặc `GEOGRAPHY(Point, 4326)`.
  - Khóa chính: `VARCHAR(50)` (Định dạng UUID/GUID v4 hoặc mã tiền tố có nghĩa, ví dụ: `USR_...`, `CAY_...`, `DH_...`).
  - Ngày tháng: `TIMESTAMP WITH TIME ZONE` (ISO 8601 UTC string: `YYYY-MM-DDTHH:mm:ss.sssZ`).

### 2.2. Quy ước Backend & API RESTful

- **Response Format thống nhất:**

```json
{
  "success": true,
  "data": {},
  "message": "Thông báo nếu có",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Khi xảy ra lỗi:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi dễ hiểu cho người dùng",
    "details": []
  }
}
```

- **Tên trường JSON:** Giữ nguyên `camelCase` đồng bộ 1:1 với tên cột trong CSDL (ví dụ: `maCay`, `tenCay`, `giaBan`, `maVuonUom`).

### 2.3. Quy ước Frontend

- Sử dụng đúng tên thuộc tính JSON từ Backend (không đổi tên trừ khi qua ViewModel mapper).
- Hiển thị tiền tệ: Định dạng chuẩn `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
- Xử lý tọa độ GIS: Luôn theo thứ tự chuẩn `[latitude, longitude]` (Vĩ độ trước, Kinh độ sau) khi làm việc với Leaflet/Bản đồ.

---

## 3. CƠ SỞ DỮ LIỆU & CHI TIẾT 12 BẢNG

1. **`NguoiDung`**: `maNguoiDung` (PK), `tenDangNhap`, `matKhauMaHoa`, `email`, `soDienThoai`, `hoTen`, `vaiTro` (`Customer` | `Supplier` | `Staff` | `Admin`), `daXacThuc`, `trangThai` (`Active` | `Locked`), `ngayTao`.
2. **`NhaCungCap`**: `maNhaCungCap` (PK), `tenCongTy`, `maSoThue`, `soDienThoaiLienHe`, `emailLienHe`, `diemUyTin`.
3. **`DanhMuc`**: `maDanhMuc` (PK), `tenDanhMuc`, `moTa`.
4. **`DiaChiGiaoHang`**: `maDiaChi` (PK), `tenNguoiNhan`, `soDienThoaiNguoiNhan`, `diaChiChiTiet`, `viDo`, `kinhDo`, `macDinh`, `maNguoiDung` (FK).
5. **`VuonUom`**: `maVuonUom` (PK), `tenVuonUom`, `diaChi`, `viDo`, `kinhDo`, `banKinhGiaoToiDaKm`, `nguongTonKhoToiThieu`, `danhGiaNhaCungCap`, `trangThai`, `maNhaCungCap` (FK).
6. **`CayCanh`**: `maCay` (PK), `tenCay`, `tenKhoaHoc`, `moTaKichThuoc`, `giaBan`, `moTa`, `huongDanChamSoc`, `khoiLuongKg`, `trangThai` (`Pending` | `Approved` | `Rejected` | `Active`), `daXuatBan` (BOOLEAN), `maDanhMuc` (FK).
7. **`YeuCauSinhTruong`**: `maYeuCau` (PK), `nhietDoToiThieu`, `nhietDoToiDa`, `doAmToiUu`, `yeuCauAnhSang` (`Toàn phần` | `Bán râm` | `Trong nhà`), `loaiDat`, `maCay` (FK, UNIQUE).
8. **`TonKho`**: `maTonKho` (PK), `soLuongTon`, `soLuongTamGiu`, `lanCapNhatCuoi`, `maVuonUom` (FK), `maCay` (FK).
9. **`TaptinTruyenThong`**: `maTruyenThong` (PK), `loaiTruyenThong` (`image` | `video`), `duongDanTaptin`, `dungLuongByte`, `laAnhChinh` (BOOLEAN), `maCay` (FK).
10. **`DonHang`**: `maDonHang` (PK), `ngayDatHang`, `tongTien`, `phiVanChuyen`, `khoangCachKm`, `phuongThucThanhToan` (`COD` | `VNPAY` | `MOMO` | `BANK_TRANSFER`), `trangThaiThanhToan` (`ChuaThanhToan` | `DaThanhToan` | `DaHoanTien`), `trangThaiDonHang`, `tamGiuDen`, `daXacNhanSucKhoe` (BOOLEAN), `anhSucKhoeUrl`, `maNguoiDung` (FK), `maDiaChi` (FK), `maVuonUom` (FK).
11. **`ChiTietDonHang`**: `maChiTietDonHang` (PK), `soLuong`, `donGia`, `thanhTien`, `maDonHang` (FK), `maCay` (FK).
12. **`DanhGia`**: `maDanhGia` (PK), `soSaoDanhGia` (1-5), `binhLuan`, `duongDanTruyenThong`, `ngayTao`, `maDonHang` (FK, UNIQUE), `maChiTietDonHang` (FK).

---

## 4. QUY TẮC NGHIỆP VỤ BẮT BUỘC (BUSINESS RULES - BR)

- **BR01 (Quản lý tài khoản & OTP):** Mỗi người dùng chỉ được dùng duy nhất 1 Email/Số điện thoại. Phải xác thực OTP trước khi đặt hàng hoặc đăng bán sản phẩm.
- **BR02 (Phân quyền 4 vai trò):** `Customer`, `Supplier`, `Staff`, `Admin`. Admin có toàn bộ quyền của Staff và quyền tối cao hệ thống.
- **BR03 (Vườn ươm & Tọa độ GIS):** Nhà cung cấp bắt buộc phải khai báo tọa độ (`viDo`, `kinhDo`) hợp lệ trước khi tạo sản phẩm hoặc thiết lập tồn kho.
- ** (Kiểm duyệt cây cảnh):** Cây mới tạo phải ở trạng thái chờ duyệt. Chỉ hiển thị công khai (`daXuatBan = true` và `trangThai = 'Active'`) khi được Staff/Admin phê duyệt.
- ** (Tham số sinh trưởng):** Cây cảnh bắt buộc có bản ghi 1-1 tại `YeuCauSinhTruong`: `nhietDoToiThieu < nhietDoToiDa`, `doAmToiUu`, `yeuCauAnhSang`, `loaiDat`.
- ** (Spatial Matching Engine):** Khi khách chọn tọa độ nhận hàng/vị trí trên bản đồ, hệ thống tự động đối chiếu thông số môi trường/khí hậu vùng địa lý với `YeuCauSinhTruong` để tính % tương thích và gán nhãn "Cây hợp thổ nhưỡng".
- ** (Spatial Radius Query - Bán kính giao):** Khách hàng chỉ được mua sản phẩm từ các Vườn ươm có khoảng cách $\le$ `banKinhGiaoToiDaKm` (thường tối đa 50 km với cây tươi công trình) so với điểm ghim nhận hàng.
- ** (Tính phí vận chuyển GIS):**
  PhiVanChuyen = KhoangCachKm _ HeSoCuoc _ HeSoKhoiLuong
- ** (Ghim vị trí nhận hàng):** Đơn hàng bắt buộc phải có tọa độ ghim chính xác (`viDo`, `kinhDo`) trên bản đồ kèm địa chỉ văn bản.
- ** (Khóa tồn kho tạm giữ - Inventory Lock):** Khi khách tạo đơn hàng, `soLuongTamGiu` tăng lên tương ứng trong vòng **15 phút**. Tồn kho khả dụng = `soLuongTon - soLuongTamGiu`.
- ** (Tự động hủy đơn quá hạn):** Nếu thanh toán trực tuyến không hoàn tất sau 15 phút, scheduler/cron hủy đơn (`Cancelled`), giải phóng `soLuongTamGiu`.
- ** (Luồng trạng thái đơn hàng tuyến tính - Không nhảy bước):**
  ChoXacNhan -> DaXacNhan -> DangChuanBiHang -> DangGiaHang -> DaHoanThanh
  _(Trạng thái `DaHuy` chỉ hợp lệ khi đơn chưa chuyển sang `DangGiaoHang`)._
- ** (Xác nhận sức khỏe cây trước khi giao):** Nhân viên/Nhà cung cấp bắt buộc tải lên `anhSucKhoeUrl` chụp thực tế cây tại vườn và đánh dấu `daXacNhanSucKhoe = true` trước khi chuyển sang `DangGiaoHang`.
- ** (Live Order Tracking):** Vị trí GPS đơn hàng được cập nhật liên tục (chu kỳ 30s) để khách hàng theo dõi trực quan trên bản đồ.
- ** (Đánh giá sản phẩm):** Chỉ được đánh giá khi đơn hàng ở trạng thái `DaHoanThanh`. Mỗi sản phẩm trong một đơn hàng chỉ được đánh giá 1 lần (1 đến 5 sao).
- ** (Tính điểm uy tín NCC):** `diemUyTin` của Nhà cung cấp = Trung bình cộng toàn bộ số sao từ các đánh giá thuộc các vườn ươm của NCC đó.
- ** (Trừ tồn kho chính thức):** Khi đơn hàng chuyển sang `DaHoanThanh`, `soLuongTon` giảm chính thức và `soLuongTamGiu` được giải phóng.
- ** (Cảnh báo tồn kho tối thiểu):** Khi `soLuongTon <= nguongTonKhoToiThieu`, hệ thống tự kích hoạt thông báo (Email/Push) cho Nhà cung cấp.
- ** (Bản đồ nhiệt Heatmap GIS):** Dữ liệu phân tích Heatmap đơn hàng chỉ thống kê trên các đơn có trạng thái `DaHoanThanh` trong khoảng thời gian xác định.

---

## 5. QUY TẮC KIẾN TRÚC & PHÁT TRIỂN BACKEND

1. **Transaction Integrity (ACID):** Mọi thao tác Đặt hàng, Hủy đơn, Trừ/Khóa tồn kho phải bọc trong Transaction (`BEGIN ... COMMIT / ROLLBACK`). Tuyệt đối không để xảy ra race condition khi nhiều người cùng đặt 1 cây.
2. **Kiến trúc Layered Architecture:**
   - `controllers/`: Tiếp nhận HTTP request, parse params, validate input và gọi service.
   - `services/`: Xử lý nghiệp vụ logic (GIS matching, tính phí ship, khóa tồn kho, chuyển trạng thái đơn).
   - `repositories/` hoặc `models/`: Thực thi truy vấn SQL thuần hoặc query builder với PostgreSQL (`pool.query`).
   - `middlewares/`: Kiểm tra Authentication (JWT), Authorization (RBAC: Admin, Staff, Supplier, Customer), Request Validation.
3. **Spatial Queries:**
   - Sử dụng công thức Haversine hoặc PostGIS `ST_DWithin`, `ST_Distance` để lọc bán kính vườn ươm và điểm giao.
4. **Bảo mật & Mã hóa:**
   - Mật khẩu mã hóa bằng `bcrypt` (salt rounds $\ge$ 10).
   - Tham số hóa 100% truy vấn SQL (`$1, $2, ...`) để phòng chống SQL Injection.

---

## 6. QUY TẮC KIẾN TRÚC & PHÁT TRIỂN FRONTEND

### 6.1. UX/UI & Nguyên tắc Thiết kế

1. **UX/UI & Thiết kế Thẩm mỹ (Rich Aesthetics):**
   - Theme hiện đại, tone màu tự nhiên (xanh lá cây botanical `#2D6A4F`, `#52B788`, nền kem nhạt `#F8F9FA` hoặc dark mode thanh lịch).
   - Responsive toàn diện (Mobile First & Desktop).
   - Tuyệt đối không dùng giao diện thô ráp hoặc placeholder trống; luôn có skeleton loading và thông báo trạng thái rõ ràng (Toast message).
2. **GIS Map Integration:**
   - Cho phép người dùng ghim (pin) vị trí nhận hàng, tự động lấy tọa độ qua Geolocation API hoặc kéo thả marker.
   - Hiển thị trực quan: Vị trí khách, vị trí Vườn ươm, bán kính phủ sóng, và tuyến đường giao hàng.
   - Trực quan hóa độ phù hợp khí hậu/thổ nhưỡng bằng biểu tượng hoặc màu sắc trực quan (Badge tương thích: 95% hợp khí hậu).
3. **State Management & API Client:**
   - Đóng gói API calls trong thư mục `services/api/` hoặc `api/`.
   - Lưu trữ Auth token trong `localStorage` / HTTP-only cookies; gắn Authorization header qua Axios interceptor.

### 6.2. Danh sách Màn hình Giao diện Hệ thống (Pages / Views)

#### A. Giao diện chung (Customer / Guest)

- **Trang chủ (`/`):** Banner giới thiệu, danh mục nổi bật, cây cảnh bán chạy, bộ lọc GIS nhanh.
- **Đăng ký (`/register`):** Form đăng ký tài khoản (Khách hàng / Nhà cung cấp) có xác thực OTP.
- **Đăng nhập (`/login`):** Form đăng nhập JWT, quên mật khẩu.
- **Danh sách sản phẩm (`/products`):** Tìm kiếm, lọc theo giá, loại cây, vùng khí hậu & khoảng cách bán kính GIS.
- **Chi tiết sản phẩm (`/products/:id`):** Hình ảnh/video, thông số sinh trưởng, kiểm tra độ hợp thổ nhưỡng GIS, chọn vườn ươm.
- **Giỏ hàng (`/cart`):** Danh sách cây đã chọn, điều chỉnh số lượng, chọn điểm giao nhận.
- **Đơn hàng (`/orders`):** Quản lý lịch sử đơn hàng theo các trạng thái.
- **Chi tiết đơn hàng (`/orders/:id`):** Thông tin người nhận, danh sách cây, hóa đơn thanh toán, trạng thái sức khỏe cây.
- **Đánh giá sản phẩm (`/orders/:id/review`):** Form chấm sao (1-5), nhận xét và tải ảnh thực tế.
- **Bản đồ GIS (`/map-explorer`):** Bản đồ tương tác hiển thị vị trí các vườn ươm, bán kính giao hàng và cây phù hợp theo khu vực.
- **Hỗ trợ và khiếu nại (`/support`):** Gửi yêu cầu trợ giúp, khiếu nại đơn hàng hoặc cây hư hỏng khi vận chuyển.
- **Tài khoản cá nhân (`/profile`):** Quản lý thông tin cá nhân, mật khẩu, thông báo.
- **Địa chỉ giao hàng (`/profile/addresses`):** Danh sách địa chỉ đã lưu kèm ghim tọa độ GIS chuẩn.
- **Theo dõi giao hàng (`/orders/:id/tracking`):** Live Tracking đơn hàng trên bản đồ thời gian thực.
- **Gợi ý cây cảnh (`/recommendations`):** Hệ thống gợi ý thông minh dựa trên vị trí GPS, thời tiết và loại đất nơi sống.

#### B. Giao diện Nhà cung cấp (`/supplier`)

- **Dashboard NCC (`/supplier/dashboard`):** Thống kê doanh thu vườn, tổng đơn hàng, đánh giá trung bình.
- **Quản lý vườn (`/supplier/nurseries`):** Thiết lập thông tin vườn ươm, ghim tọa độ GIS, bán kính giao hàng tối đa.
- **Quản lý sản phẩm (`/supplier/products`):** Danh sách cây cảnh thuộc sở hữu, trạng thái duyệt (`Pending`, `Active`).
- **Thêm/Sửa sản phẩm (`/supplier/products/create`):** Form nhập thông tin cây, hình ảnh và cài đặt `YeuCauSinhTruong`.
- **Quản lý tồn kho (`/supplier/inventory`):** Theo dõi `soLuongTon`, `soLuongTamGiu`, nhận cảnh báo tồn kho tối thiểu.
- **Quản lý đơn hàng (`/supplier/orders`):** Tiếp nhận đơn, upload `anhSucKhoeUrl`, xác nhận sức khỏe cây và chuyển giao vận chuyển.
- **Thông tin nhà cung cấp (`/supplier/profile`):** Cập nhật tên công ty, mã số thuế, điểm uy tín.

#### C. Giao diện Admin (`/admin`)

- **Dashboard Admin (`/admin/dashboard`):** Tổng quan toàn hệ thống, Heatmap đơn hàng GIS, biểu đồ doanh thu, thống kê người dùng.
- **Quản lý người dùng (`/admin/users`):** Khóa/Mở tài khoản, tìm kiếm người dùng.
- **Phân quyền (`/admin/roles`):** Quản lý vai trò (`Customer`, `Supplier`, `Staff`, `Admin`) và quyền hạn.
- **Quản lý NCC (`/admin/suppliers`):** Duyệt hồ sơ nhà cung cấp mới, quản lý điểm uy tín.
- **Quản lý danh mục (`/admin/categories`):** Thêm, sửa, xóa danh mục cây cảnh.
- **Quản lý sản phẩm (`/admin/products`):** Quản lý toàn bộ cây trên sàn, gỡ bỏ sản phẩm vi phạm.
- **Quản lý đơn hàng (`/admin/orders`):** Giám sát toàn bộ luồng đơn hàng hệ thống, xử lý tranh chấp/hoàn tiền.
- **Báo cáo doanh thu (`/admin/reports`):** Báo cáo tài chính, hoa hồng sàn, phân tích vùng mật độ mua sắm (Heatmap).

#### D. Giao diện Nhân viên (`/staff`)

- **Dashboard Nhân viên (`/staff/dashboard`):** Danh sách công việc cần xử lý trong ngày.
- **Kiểm duyệt sản phẩm (`/staff/product-approval`):** Duyệt thông tin cây cảnh mới và kiểm tra tham số `YeuCauSinhTruong`.
- **Kiểm duyệt vị trí (`/staff/location-approval`):** Xác minh tọa độ GIS vườn ươm đăng ký mới có hợp lệ.
- **Xử lý đơn hàng (`/staff/order-processing`):** Kiểm tra `anhSucKhoeUrl` nhà cung cấp gửi lên trước khi cho phép giao.
- **Quản lý hỗ trợ (`/staff/tickets`):** Tiếp nhận và phản hồi các yêu cầu/khiếu nại từ người dùng.

---

## 7. QUY TẮC CẤU TRÚC THƯ MỤC VÀ VỊ TRÍ ĐẶT FILE (PROJECT FOLDER STRUCTURE)

Dự án được phân chia thành cấu trúc Monorepo/Multi-folder rõ ràng. Mọi mã nguồn và tài nguyên phát triển phải nằm đúng vị trí dưới đây, tuyệt đối không tạo các file code nằm rải rác ngoài thư mục gốc (`tmcaycanh/`).

```text
tmcaycanh/
├── backend/                  <-- TOÀN BỘ CODE BACKEND (NODE.JS / EXPRESS)
│   ├── config/               <-- Cấu hình kết nối PostgreSQL, Cloudinary, GIS Services
│   ├── controllers/          <-- Xử lý Logic tiếp nhận request & trả lời Response
│   ├── middlewares/          <-- Authentication (JWT), Phân quyền (RBAC), Error Handler
│   ├── models/               <-- Query SQL tương tác trực tiếp với PostgreSQL
│   ├── routes/               <-- Định nghĩa các đường dẫn RESTful API (v1)
│   ├── services/             <-- Xử lý nghiệp vụ (GIS Matching, Shipping, Payment, Locking)
│   ├── utils/                <-- Hàm tiện ích chung (Haversine formula, Formatters, Mailers)
│   ├── .env                  <-- Biến môi trường Backend (DB credentials, Secret Keys) - IGNORED
│   ├── package.json          <-- Thư viện & Dependencies Backend
│   └── server.js             <-- Entry point chính của Backend Server
│
├── frontend/                 <-- TOÀN BỘ CODE GIAO DIỆN (REACT / VITE)
│   ├── public/               <-- Static Assets công khai (Favicon, Logo tĩnh, Icons)
│   ├── src/                  <-- NƠI CHỨA CODE GIAO DIỆN CHÍNH
│   │   ├── api/              <-- Axios instance & các hàm gọi API sang Backend
│   │   ├── assets/           <-- Hình ảnh, icons, font nội bộ dùng trong React
│   │   ├── components/       <-- UI Components tái sử dụng (Navbar, Button, MapPicker, ProductCard)
│   │   ├── context/          <-- React Context (AuthContext, CartContext)
│   │   ├── hooks/            <-- Custom React Hooks (useAuth, useGeolocation, useMap)
│   │   ├── layouts/          <-- Khung giao diện chính (MainLayout, AdminLayout, SupplierLayout)
│   │   ├── pages/            <-- Các trang giao diện (Customer, Supplier, Admin, Staff pages)
│   │   ├── styles/           <-- Style sheets global hoặc CSS Modules
│   │   ├── utils/            <-- Utilities hiển thị (Format VND, Date format, Map helpers)
│   │   ├── App.jsx           <-- Component điều hướng chính (React Router)
│   │   └── main.jsx          <-- Entry point của ứng dụng Frontend React
│   ├── .gitignore            <-- Gitignore riêng cho phần Frontend
│   ├── index.html            <-- HTML Template chính của Vite
│   ├── package.json          <-- Thư viện & Dependencies Frontend
│   └── vite.config.js        <-- Cấu hình Vite (Port, Proxy API, Plugins)
│
├── media/                    <-- CHỈ CHỨA TÀI LIỆU, ĐỒ ÁN, ẢNH MINH HỌA (IGNORED BY GIT)
│   ├── Nhom14_TMDT_doan.docx
│   └── TMDT_Postgre.txt
│
├── .gitignore                <-- Gitignore cho thư mục gốc dự án
├── context.md                <-- FILE QUY CHUẨN KỸ THUẬT NÀY (LUÔN ĐẶT TẠI ROOT)
└── README.md                 <-- Hướng dẫn cài đặt & Chạy dự án chung
```

### Quy tắc đặt file chi tiết:

1. **Code Giao diện (Frontend):** 100% nằm trong `frontend/src/`. Không tạo file JS/JSX bên ngoài `frontend/src/` ngoại trừ các file cấu hình như `vite.config.js`.
2. **Code Server (Backend):** 100% nằm trong `backend/`. Các file xử lý nghiệp vụ phải chia theo đúng mô hình Layered Architecture (`controllers`, `services`, `routes`, `models`).
3. **Database Scripts & SQL Migration:** Các script khởi tạo PostgreSQL (`.sql`) phải đặt trong `backend/config/` hoặc `backend/migrations/`.
4. **Tài liệu dự án & Báo cáo:** Đặt tại thư mục `media/` ở thư mục gốc và luôn thêm `media/` vào `.gitignore` gốc để tránh đẩy các file tài liệu nặng lên GitHub.
5. **Cấu hình bảo mật (`.env`):** File `.env` chứa mật khẩu CSDL và API Key phải nằm riêng trong `backend/.env` (và `frontend/.env` nếu có), tuyệt đối **không commit** các file này lên Git.

---

## 8. QUY TRÌNH KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (TDD & VALIDATION)

- **TDD (Test-Driven Development):**
  - Mọi logic tính toán quan trọng (Tính phí vận chuyển theo khoảng cách GIS, Giải thuật đối chiếu độ tương thích cây với thời tiết, State machine chuyển trạng thái đơn hàng, Khóa tồn kho tạm giữ) phải được viết unit test xác minh trước khi đưa vào sản phẩm.
- **Checklist sau mỗi lần sửa đổi:**
  - Tự động cập nhật lại `context.md` nếu có sự thay đổi về schema hoặc quy tắc nghiệp vụ.
  - Đảm bảo tính tương thích ngược với dữ liệu đã seed.

---

## 9. TRẠNG THÁI TRIỂN KHAI & KẾT QUẢ KIỂM THỬ (IMPLEMENTATION & VERIFICATION STATUS)

### 9.1. Trạng thái Kết nối Cơ sở Dữ liệu & Dữ liệu Mẫu (Database & Seeding)

- **Tình trạng kết nối PostgreSQL:** Đã kiểm tra và điều chỉnh `DB_NAME=tmcaycanh` trong `backend/.env` và `.env` gốc để kết nối chính xác với PostgreSQL localhost:5432.
- **Dữ liệu mẫu (Seed Data):** Đã tạo script `backend/seed.js` và nạp thành công dữ liệu mẫu cho toàn bộ **12/12 bảng**:
  1. `NguoiDung`: 6 tài khoản mẫu (`Admin`, `Staff`, 2 `Supplier`, 2 `Customer`) có mã hóa mật khẩu bcrypt `123456`.
  2. `NhaCungCap`: 3 nhà cung cấp hoa kiểng & bonsai (TP. HCM, Đà Lạt, Chợ Lách Bến Tre).
  3. `DanhMuc`: 5 danh mục chuẩn (Trong nhà, Ban công, Bonsai, Công trình, Để bàn).
  4. `DiaChiGiaoHang`: Địa chỉ ghim tọa độ GIS chuẩn tại TP. HCM.
  5. `VuonUom`: 4 vườn ươm với tọa độ thực tế, bán kính phục vụ 35 - 120 km.
  6. `CayCanh`: 8 cây cảnh phong thủy và nội thất kèm ảnh curated chất lượng cao.
  7. `YeuCauSinhTruong`: Bản ghi 1-1 cho cả 8 cây với dải nhiệt độ, độ ẩm, ánh sáng, loại đất ().
  8. `TonKho`: 11 bản ghi tồn kho phân bổ theo từng vườn ươm.
  9. `TaptinTruyenThong`: 8 media URLs cho ảnh chính và hình ảnh sinh thái.
  10. `DonHang`: 3 đơn hàng mẫu ở các giai đoạn tuyến tính (`ChoXacNhan` khóa 15p, `DangGiaoHang`, `DaHoanThanh`).
  11. `ChiTietDonHang`: 4 bản ghi chi tiết đơn hàng.
  12. `DanhGia`: Đánh giá 5 sao kèm nhận xét chất lượng phục vụ và đóng gói.

### 9.2. Toàn bộ Endpoint RESTful Backend đã hoàn thiện

- **Auth (`/api/auth`):**
  - `POST /register`: Đăng ký Khách hàng / Nhà cung cấp.
  - `POST /login`: Đăng nhập cấp phát JWT Token.
  - `GET /me`: Lấy thông tin cá nhân và vai trò RBAC.
  - `GET /addresses`, `POST /addresses`: Quản lý địa chỉ giao ghim GPS ().
- **Plants (`/api/plants`):**
  - `GET /`: Lọc cây theo danh mục, giá, ánh sáng, khoảng cách bán kính GIS () và đối chiếu khí hậu ().
  - `GET /:id`: Chi tiết cây, tham số sinh trưởng 1-1, đồng hồ đối chiếu thổ nhưỡng, tồn kho từng vườn và đánh giá.
  - `POST /`: Đăng bán cây mới (trạng thái `Pending` chờ duyệt - , ).
  - `PATCH /:id/status`: Staff/Admin duyệt hoặc từ chối cây cảnh ().
- **Nurseries (`/api/nurseries`):**
  - `GET /`: Danh sách vườn ươm, tính khoảng cách từ điểm ghim khách và bán kính phục vụ.
  - `GET /:id`: Chi tiết vườn và toàn bộ kho cây.
  - `POST /`: Nhà cung cấp tạo vườn ươm kèm tọa độ GIS (BR03).
- **Orders (`/api/orders`):**
  - `POST /`: Tạo đơn hàng qua ACID Transaction, kiểm tra bán kính giao (), tính cước vận chuyển GIS (), khóa tồn kho `soLuongTamGiu` 15 phút ().
  - `GET /`, `GET /:id`: Lịch sử và chi tiết đơn hàng.
  - `PATCH /:id/status`: Chuyển trạng thái tuyến tính (), bắt buộc ảnh sức khỏe (), trừ tồn kho chính thức khi hoàn tất (), giải phóng tồn kho khi hủy ().
  - `PATCH /:id/health-check`: Tải ảnh chụp thực tế cây tại vườn và xác nhận sức khỏe đạt chuẩn ().
- **Reviews (`/api/reviews`):**
  - `POST /`: Gửi đánh giá cho đơn hàng `DaHoanThanh` (), tự động tính lại điểm uy tín NCC ().
- **Admin & Giám Sát (`/api/admin`):**
  - `GET /dashboard`: Tổng quan tài chính, đơn hàng, người dùng, cảnh báo tồn kho tối thiểu ().
  - `GET /heatmap`: Dữ liệu bản đồ nhiệt Heatmap GIS đơn hàng hoàn thành ().
  - `GET /users`, `PATCH /users/:id/status`: Quản lý và khóa/mở khóa tài khoản.

### 9.3. Giao diện Frontend (React / Vite / Leaflet) đã hoàn thiện

- `HomePage`: Hero banner thực vật sang trọng, bộ chọn tọa độ và đối chiếu thổ nhưỡng vùng miền, danh mục, cây nổi bật và preview bản đồ vườn ươm.
- `ProductListPage`: Tìm kiếm đa tiêu chí, lọc theo bán kính GIS, điều kiện ánh sáng, giá cả.
- `ProductDetailPage`: Thư viện ảnh, bảng thông số sinh trưởng 1-1, đồng hồ đo độ phù hợp khí hậu, chọn vườn ươm gần nhất và danh sách đánh giá.
- `MapExplorerPage`: Bản đồ tương tác Leaflet toàn màn hình, hiển thị vòng tròn bán kính phủ sóng, chi tiết kho vườn ươm và ghim vị trí nhận hàng.
- `RecommendationsPage`: Hệ thống gợi ý cây cảnh hợp thổ nhưỡng dựa trên bộ lọc khí hậu tương tác (Spatial Matching Engine).
- `CartPage`: Giỏ hàng, bản đồ ghim vị trí nhận hàng, tính cước GIS và khóa tồn kho 15 phút.
- `OrdersPage` & `OrderDetailPage`: Tiến trình tuyến tính Stepper 5 bước (), ảnh kiểm định sức khỏe cây tại vườn (), bản đồ Live Tracking GPS (), form đánh giá 1-5 sao ().
- `SupplierPortalPage`: Quản lý đơn hàng, tải ảnh sức khỏe cây, cảnh báo tồn kho thấp (), thiết lập vườn ươm GIS (BR03), đăng bán cây mới (, ).
- `AdminPortalPage`: Báo cáo doanh thu, bản đồ nhiệt Heatmap GIS (), kiểm duyệt sản phẩm mới (), quản lý người dùng.
- `LoginPage` & `RegisterPage`: Đăng nhập/đăng ký có nút đăng nhập nhanh 4 vai trò demo.

### 9.4. Báo cáo Kết quả Kiểm thử TDD (100% Pass)

- `backend/test/db-integrity.test.js`: 6/6 test cases đạt chuẩn (Kết nối DB, 12 bảng có dữ liệu, quan hệ 1-1 CayCanh - YeuCauSinhTruong, tọa độ vườn ươm, phân quyền RBAC).
- `backend/test/gis-service.test.js`: 5/5 test cases đạt chuẩn (Công thức khoảng cách Haversine, cước ship , thuật toán tương thích thổ nhưỡng , chu trình tuyến tính /).
- `backend/test/api-flow.test.js`: 9/9 test cases đạt chuẩn (Healthcheck, JWT Login, truy vấn GIS, tạo đơn khóa tồn kho ACID , ngăn chặn nhảy cóc trạng thái đơn , kiểm tra bắt buộc ảnh sức khỏe , trừ tồn kho chính thức , Heatmap GIS ).
- `Browser Verification`: Đã chạy kiểm thử tự động trên trình duyệt thật qua `browser_subagent` và ghi lại video phiên làm việc hoàn tất tại `tmcaycanh_demo_1793029699740.webp`.
