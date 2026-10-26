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
    "meta": { "page": 1, "limit": 20, "total": 100 }
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
- **BR04 (Kiểm duyệt cây cảnh):** Cây mới tạo phải ở trạng thái chờ duyệt. Chỉ hiển thị công khai (`daXuatBan = true` và `trangThai = 'Active'`) khi được Staff/Admin phê duyệt.
- **BR05 (Tham số sinh trưởng):** Cây cảnh bắt buộc có bản ghi 1-1 tại `YeuCauSinhTruong`: `nhietDoToiThieu < nhietDoToiDa`, `doAmToiUu`, `yeuCauAnhSang`, `loaiDat`.
- **BR06 (Spatial Matching Engine):** Khi khách chọn tọa độ nhận hàng/vị trí trên bản đồ, hệ thống tự động đối chiếu thông số môi trường/khí hậu vùng địa lý với `YeuCauSinhTruong` để tính % tương thích và gán nhãn "Cây hợp thổ nhưỡng".
- **BR07 (Spatial Radius Query - Bán kính giao):** Khách hàng chỉ được mua sản phẩm từ các Vườn ươm có khoảng cách $\le$ `banKinhGiaoToiDaKm` (thường tối đa 50 km với cây tươi công trình) so với điểm ghim nhận hàng.
- **BR08 (Tính phí vận chuyển GIS):** 
  $$\text{PhiVanChuyen} = \text{KhoangCachKm (qua Map API/Route)} \times \text{HeSoCuoc} \times \text{HeSoKhoiLuong}(\text{khoiLuongKg})$$
- **BR09 (Ghim vị trí nhận hàng):** Đơn hàng bắt buộc phải có tọa độ ghim chính xác (`viDo`, `kinhDo`) trên bản đồ kèm địa chỉ văn bản.
- **BR10 (Khóa tồn kho tạm giữ - Inventory Lock):** Khi khách tạo đơn hàng, `soLuongTamGiu` tăng lên tương ứng trong vòng **15 phút**. Tồn kho khả dụng = `soLuongTon - soLuongTamGiu`.
- **BR11 (Tự động hủy đơn quá hạn):** Nếu thanh toán trực tuyến không hoàn tất sau 15 phút, scheduler/cron hủy đơn (`Cancelled`), giải phóng `soLuongTamGiu`.
- **BR12 (Luồng trạng thái đơn hàng tuyến tính - Không nhảy bước):**
  $$\text{ChoXacNhan} \longrightarrow \text{DaXacNhan} \longrightarrow \text{DangChuanBiHang} \longrightarrow \text{DangGiaHang} \longrightarrow \text{DaHoanThanh}$$
  *(Trạng thái `DaHuy` chỉ hợp lệ khi đơn chưa chuyển sang `DangGiaoHang`).*
- **BR13 (Xác nhận sức khỏe cây trước khi giao):** Nhân viên/Nhà cung cấp bắt buộc tải lên `anhSucKhoeUrl` chụp thực tế cây tại vườn và đánh dấu `daXacNhanSucKhoe = true` trước khi chuyển sang `DangGiaoHang`.
- **BR14 (Live Order Tracking):** Vị trí GPS đơn hàng được cập nhật liên tục (chu kỳ 30s) để khách hàng theo dõi trực quan trên bản đồ.
- **BR15 (Đánh giá sản phẩm):** Chỉ được đánh giá khi đơn hàng ở trạng thái `DaHoanThanh`. Mỗi sản phẩm trong một đơn hàng chỉ được đánh giá 1 lần (1 đến 5 sao).
- **BR16 (Tính điểm uy tín NCC):** `diemUyTin` của Nhà cung cấp = Trung bình cộng toàn bộ số sao từ các đánh giá thuộc các vườn ươm của NCC đó.
- **BR17 (Trừ tồn kho chính thức):** Khi đơn hàng chuyển sang `DaHoanThanh`, `soLuongTon` giảm chính thức và `soLuongTamGiu` được giải phóng.
- **BR18 (Cảnh báo tồn kho tối thiểu):** Khi `soLuongTon <= nguongTonKhoToiThieu`, hệ thống tự kích hoạt thông báo (Email/Push) cho Nhà cung cấp.
- **BR19 (Bản đồ nhiệt Heatmap GIS):** Dữ liệu phân tích Heatmap đơn hàng chỉ thống kê trên các đơn có trạng thái `DaHoanThanh` trong khoảng thời gian xác định.

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

---

## 7. QUY TRÌNH KIỂM THỬ VÀ ĐẢM BẢO CHẤT LƯỢNG (TDD & VALIDATION)

- **TDD (Test-Driven Development):**
  - Mọi logic tính toán quan trọng (Tính phí vận chuyển theo khoảng cách GIS, Giải thuật đối chiếu độ tương thích cây với thời tiết, State machine chuyển trạng thái đơn hàng, Khóa tồn kho tạm giữ) phải được viết unit test xác minh trước khi đưa vào sản phẩm.
- **Checklist sau mỗi lần sửa đổi:**
  - Tự động cập nhật lại `context.md` nếu có sự thay đổi về schema hoặc quy tắc nghiệp vụ.
  - Đảm bảo tính tương thích ngược với dữ liệu đã seed.
