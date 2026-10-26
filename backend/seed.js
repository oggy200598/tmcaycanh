const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool } = require("./config/db");

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log("--- 1. Cleaning existing test data in correct FK dependency order ---");
    await client.query("BEGIN");
    await client.query("DELETE FROM danhgia");
    await client.query("DELETE FROM chitietdonhang");
    await client.query("DELETE FROM donhang");
    await client.query("DELETE FROM taptintruyenthong");
    await client.query("DELETE FROM tonkho");
    await client.query("DELETE FROM yeucausinhtruong");
    await client.query("DELETE FROM caycanh");
    await client.query("DELETE FROM vuonuom");
    await client.query("DELETE FROM diachigiaohang");
    await client.query("DELETE FROM danhmuc");
    await client.query("DELETE FROM nhacungcap");
    await client.query("DELETE FROM nguoidung");
    await client.query("COMMIT");

    console.log("--- 2. Executing DATA/data.sql official dataset ---");
    const sqlPath = path.resolve(__dirname, "../DATA/data.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    await client.query(sql);

    console.log("--- 3. Setting default password ('123456') for accounts ---");
    const defaultHash = await bcrypt.hash("123456", 10);
    await client.query(
      "UPDATE nguoidung SET matkhaumahoa = $1 WHERE matkhaumahoa IS NULL OR matkhaumahoa = ''",
      [defaultHash]
    );

    console.log("--- 4. Ensuring core demo accounts are active for UI Quick Login ---");
    const demoAccounts = [
      {
        ma: "USR_ADMIN_DEMO",
        user: "admin",
        email: "admin@tmcaycanh.vn",
        phone: "0901111111",
        name: "Quản Trị Viên Hệ Thống",
        role: "Admin",
      },
      {
        ma: "USR_STAFF_DEMO",
        user: "staff01",
        email: "staff@tmcaycanh.vn",
        phone: "0902222222",
        name: "Trần Văn Kiểm Duyệt",
        role: "Staff",
      },
      {
        ma: "USR_SUPPLIER_DEMO",
        user: "saigonbonsai",
        email: "supplier@saigonbonsai.vn",
        phone: "0903333333",
        name: "Vườn Kiểng Sài Gòn Bonsai",
        role: "Supplier",
      },
      {
        ma: "USR_CUSTOMER_DEMO",
        user: "customer01",
        email: "customer@gmail.com",
        phone: "0904444444",
        name: "Nguyễn Văn Khách Hàng",
        role: "Customer",
      },
    ];

    for (const acc of demoAccounts) {
      await client.query(
        `INSERT INTO nguoidung (manguoidung, tendangnhap, matkhaumahoa, email, sodienthoai, hoten, vaitro, daxacthuc, trangthai, ngaytao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'Active', NOW())
         ON CONFLICT (manguoidung) DO UPDATE SET matkhaumahoa = $3, email = $4, vaitro = $7`,
        [acc.ma, acc.user, defaultHash, acc.email, acc.phone, acc.name, acc.role]
      );
    }

    console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY FROM DATA/data.sql!");
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Done seeding.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed:", err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
