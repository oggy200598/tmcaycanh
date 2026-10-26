# TMCayCanh – Website thương mại điện tử cây cảnh

Dự án xây dựng website bán cây cảnh, sử dụng **React (Vite)** cho giao diện, **Node.js + Express** cho REST API và **PostgreSQL** để lưu trữ dữ liệu.

> **Trạng thái:** Dự án đang trong giai đoạn thiết lập môi trường và kết nối API. Đoạn giao diện đã hướng dẫn hiện chỉ hiển thị danh sách cây cảnh; các chức năng khác là phạm vi phát triển dự kiến, chưa được xác nhận đã triển khai.

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | React, Vite, Axios |
| Backend | Node.js, Express |
| Cơ sở dữ liệu | PostgreSQL |
| Kết nối cơ sở dữ liệu | `pg` (node-postgres) |
| Công cụ phát triển | VS Code, pgAdmin (tùy chọn) |

## 2. Cấu trúc thư mục dự kiến

```text
TMCayCanh/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── ...
├── backend/
│   ├── server.js
│   ├── .env             # Không đưa lên Git
│   ├── package.json
│   └── ...
└── README.md
```

## 3. Yêu cầu môi trường

- Node.js và npm (phiên bản tương thích với Vite đang sử dụng).
- PostgreSQL đang hoạt động ở máy cục bộ hoặc máy chủ có thể truy cập.
- Một database dành cho dự án, ví dụ `tmcaycanh`.

## 4. Cài đặt frontend

Tại thư mục gốc của dự án:

```bash
cd frontend
npm install
npm install axios
npm run dev
```

Mở địa chỉ Vite in ra trong Terminal, thường là **http://localhost:5173**.

Nếu chưa tạo thư mục frontend:

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios
npm run dev
```

## 5. Cài đặt backend

Mở **Terminal khác**, từ thư mục gốc:

```bash
cd backend
npm install
```

Nếu chưa có dự án backend, khởi tạo bằng:

```bash
mkdir backend
cd backend
npm init -y
npm install express pg cors dotenv
npm install --save-dev nodemon
```

Tạo file `backend/.env` (thay thông tin cho đúng máy của bạn):

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=tmcaycanh
```

**Không commit `.env` hoặc mật khẩu lên Git.** Thêm `backend/.env` vào `.gitignore`.

Ví dụ backend tối thiểu trong `backend/server.js` (CommonJS):

```js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.get('/api/cay-canh', async (req, res) => {
  try {
    // Dùng dấu ngoặc kép nếu bảng được tạo đúng tên "CayCanh".
    const result = await pool.query('SELECT * FROM "CayCanh" LIMIT 20');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi truy vấn dữ liệu' });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`API: http://localhost:${process.env.PORT || 5000}`);
});
```

Chạy server:

```bash
npx nodemon server.js
```

Địa chỉ API ví dụ: **http://localhost:5000/api/cay-canh**.

> Ví dụ trên dùng `require()`. Nếu `backend/package.json` có `"type": "module"`, cần đổi code sang cú pháp `import` hoặc bỏ cấu hình đó.

## 6. Thiết lập PostgreSQL

Tạo database (thực hiện từ pgAdmin hoặc `psql` khi kết nối tới database `postgres`):

```sql
CREATE DATABASE tmcaycanh;
```

**Quan trọng:** Các file `TMDT_CreateTables.sql` và `TMCayCanh_Seed_Full.sql` đã tạo trước đó là **SQL Server (T-SQL)**, **không chạy trực tiếp trên PostgreSQL**. Cần chuyển đổi schema và seed sang cú pháp PostgreSQL trước khi import. Sau khi chuyển đổi, chạy schema trước, sau đó mới import seed.

PostgreSQL tự đổi tên định danh *không đặt trong dấu nháy kép* sang chữ thường:

- Nếu tạo `CREATE TABLE "CayCanh" (...)` → truy vấn `SELECT * FROM "CayCanh"`.
- Nếu tạo `CREATE TABLE CayCanh (...)` → truy vấn `SELECT * FROM caycanh`.

Tên cột cũng theo quy tắc tương tự. Phía React phải dùng đúng tên thuộc tính trong JSON mà backend trả về (ví dụ `maCay`, `tenCay`, `giaBan` nếu các cột được khai báo có dấu nháy kép tương ứng).

### Dữ liệu theo sơ đồ ERD

Hệ thống có 12 bảng:

- `NguoiDung`, `DiaChiGiaoHang`
- `NhaCungCap`, `VuonUom`
- `DanhMuc`, `CayCanh`, `YeuCauSinhTruong`
- `TonKho`, `TaptinTruyenThong`
- `DonHang`, `ChiTietDonHang`, `DanhGia`

Dữ liệu seed trước đó gồm thông tin cây và giá tham khảo công khai; khách hàng, tồn kho, đơn hàng và đánh giá là **dữ liệu tổng hợp để kiểm thử**, không phải giao dịch thực tế.

## 7. Kiểm tra kết nối

1. Chạy PostgreSQL và bảo đảm bảng `CayCanh` có dữ liệu.
2. Chạy backend tại cổng `5000`.
3. Mở **http://localhost:5000/api/cay-canh** để kiểm tra JSON trả về.
4. Chạy frontend tại cổng `5173`.
5. Truy cập **http://localhost:5173** để xem danh sách cây cảnh.

Nếu API trả về `[]`, cần kiểm tra dữ liệu trong bảng. Nếu trả lỗi `500`, kiểm tra Terminal backend để xác định lỗi kết nối hoặc truy vấn SQL.

## 8. API hiện được hướng dẫn

| Phương thức | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/cay-canh` | Lấy tối đa 20 cây cảnh |

Các API đăng nhập, giỏ hàng, đặt hàng, quản lý tồn kho và đánh giá sẽ cần xây dựng thêm.

## 9. Lỗi thường gặp

- **`Failed to resolve import "axios"`**: chạy `npm install axios` trong thư mục `frontend` rồi khởi động lại Vite.
- **Trang chỉ có tiêu đề, không thấy cây:** kiểm tra `/api/cay-canh`, dữ liệu database và Console/Network của trình duyệt.
- **`relation "CayCanh" does not exist`**: kiểm tra tên bảng và phân biệt chữ hoa/thường trong PostgreSQL.
- **`password authentication failed`**: kiểm tra biến `DB_USER` và `DB_PASSWORD` trong `.env`.
- **CORS:** bảo đảm backend cho phép origin của frontend, ví dụ `http://localhost:5173`.

## 10. Định hướng phát triển

- Hiển thị danh mục, tìm kiếm và lọc cây cảnh.
- Trang chi tiết sản phẩm và hình ảnh cây.
- Đăng ký, đăng nhập và phân quyền.
- Giỏ hàng, đặt hàng, thanh toán.
- Quản lý đơn hàng, tồn kho và đánh giá sản phẩm.

---

**Dự án:** TMCayCanh  
**Môi trường phát triển:** React + Express + PostgreSQL
