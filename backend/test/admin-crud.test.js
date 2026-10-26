const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("../server");
const { pool } = require("../config/db");

test("Admin Comprehensive CRUD & RBAC Verification (TDD)", async (t) => {
  let server;
  let baseUrl;

  t.before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  const adminToken = jwt.sign(
    { maNguoiDung: "US_ADMIN_TEST", vaiTro: "Admin", email: "admin@test.com" },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "1h" }
  );

  const customerToken = jwt.sign(
    { maNguoiDung: "US_CUST_TEST", vaiTro: "Customer", email: "cust@test.com" },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "1h" }
  );

  const staffToken = jwt.sign(
    { maNguoiDung: "US_STAFF_TEST", vaiTro: "Staff", email: "staff@test.com" },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "1h" }
  );

  async function api(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
        ...options.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  }

  // 1. RBAC Check: Customer cannot access Admin endpoints, Staff can access CRUD but blocked on users
  await t.test("1. Non-admin users are strictly blocked with 403 Forbidden", async () => {
    const resCustomer = await fetch(`${baseUrl}/api/admin/plants`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(resCustomer.status, 403);

    // Staff CAN access plants
    const resStaffPlants = await fetch(`${baseUrl}/api/admin/plants`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.strictEqual(resStaffPlants.status, 200);

    // Staff CANNOT access users management (Admin only)
    const resStaffUsers = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.strictEqual(resStaffUsers.status, 403);
  });

  // 2. Plants CRUD
  const testPlantId = `TEST_PLANT_${Date.now()}`;
  await t.test("2. Admin CRUD on Cây Cảnh (Plants)", async () => {
    // A. Read all
    const listRes = await api("/api/admin/plants");
    assert.strictEqual(listRes.status, 200);
    assert.ok(Array.isArray(listRes.body.data));

    // B. Create
    const createRes = await api("/api/admin/plants", {
      method: "POST",
      body: JSON.stringify({
        maCay: testPlantId,
        tenCay: "Cây Thử Nghiệm Admin",
        giaBan: 199000,
        maDanhMuc: "DM001",
        growthRequirement: {
          nhietDoToiThieu: 15,
          nhietDoToiDa: 32,
          doAmToiUu: 65,
          yeuCauAnhSang: "Bán râm",
        },
      }),
    });
    assert.strictEqual(createRes.status, 201);

    // C. Update
    const updateRes = await api(`/api/admin/plants/${testPlantId}`, {
      method: "PUT",
      body: JSON.stringify({
        tenCay: "Cây Thử Nghiệm Admin Đã Sửa",
        giaBan: 250000,
        maDanhMuc: "DM001",
        trangThai: "Active",
        daXuatBan: true,
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    // D. Delete
    const deleteRes = await api(`/api/admin/plants/${testPlantId}`, {
      method: "DELETE",
    });
    assert.strictEqual(deleteRes.status, 200);
  });

  // 3. Suppliers CRUD
  const testSupplierId = `NCC_TEST_${Date.now()}`;
  await t.test("3. Admin CRUD on Nhà Cung Cấp (Suppliers)", async () => {
    // A. Read
    const list = await api("/api/admin/suppliers");
    assert.strictEqual(list.status, 200);
    assert.ok(Array.isArray(list.body.data));

    // B. Create
    const create = await api("/api/admin/suppliers", {
      method: "POST",
      body: JSON.stringify({
        maNhaCungCap: testSupplierId,
        tenCongTy: "Vườn Ươm Test Admin",
        emailLienHe: "admin_test_ncc@vuon.vn",
        diemUyTin: 4.8,
      }),
    });
    assert.strictEqual(create.status, 201);

    // C. Update
    const update = await api(`/api/admin/suppliers/${testSupplierId}`, {
      method: "PUT",
      body: JSON.stringify({
        tenCongTy: "Vườn Ươm Test Admin Đã Đổi Tên",
        emailLienHe: "admin_test_ncc@vuon.vn",
        diemUyTin: 5.0,
      }),
    });
    assert.strictEqual(update.status, 200);

    // D. Delete
    const del = await api(`/api/admin/suppliers/${testSupplierId}`, {
      method: "DELETE",
    });
    assert.strictEqual(del.status, 200);
  });

  // 4. Nurseries CRUD
  const testNurseryId = `VU_TEST_${Date.now()}`;
  await t.test("4. Admin CRUD on Vườn Ươm (Nurseries)", async () => {
    // Read
    const list = await api("/api/admin/nurseries");
    assert.strictEqual(list.status, 200);

    // Create
    const create = await api("/api/admin/nurseries", {
      method: "POST",
      body: JSON.stringify({
        maVuonUom: testNurseryId,
        tenVuonUom: "Vườn Ươm Test Thủ Đức",
        diaChi: "123 Đường Test, TP. Thủ Đức",
        viDo: 10.85,
        kinhDo: 106.75,
        banKinhGiaoToiDaKm: 35,
        nguongTonKhoToiThieu: 5,
        maNhaCungCap: "NCC001",
      }),
    });
    assert.strictEqual(create.status, 201);

    // Update
    const update = await api(`/api/admin/nurseries/${testNurseryId}`, {
      method: "PUT",
      body: JSON.stringify({
        tenVuonUom: "Vườn Ươm Test Thủ Đức Cập Nhật",
        diaChi: "456 Đường Test Mới",
        viDo: 10.86,
        kinhDo: 106.76,
        banKinhGiaoToiDaKm: 40,
        nguongTonKhoToiThieu: 8,
        maNhaCungCap: "NCC001",
        trangThai: "Active",
      }),
    });
    assert.strictEqual(update.status, 200);

    // Delete
    const del = await api(`/api/admin/nurseries/${testNurseryId}`, {
      method: "DELETE",
    });
    assert.strictEqual(del.status, 200);
  });

  // 5. Categories CRUD
  const testCatId = `DM_TEST_${Date.now()}`;
  await t.test("5. Admin CRUD on Danh Mục (Categories)", async () => {
    // Create
    const create = await api("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({
        maDanhMuc: testCatId,
        tenDanhMuc: "Danh Mục Test Admin",
        moTa: "Mô tả danh mục test",
      }),
    });
    assert.strictEqual(create.status, 201);

    // Update
    const update = await api(`/api/admin/categories/${testCatId}`, {
      method: "PUT",
      body: JSON.stringify({
        tenDanhMuc: "Danh Mục Test Đã Sửa",
        moTa: "Mô tả mới",
      }),
    });
    assert.strictEqual(update.status, 200);

    // Delete
    const del = await api(`/api/admin/categories/${testCatId}`, {
      method: "DELETE",
    });
    assert.strictEqual(del.status, 200);
  });

  // 6. Orders READ-ONLY Check
  await t.test("6. Admin Orders is STRICTLY READ-ONLY (No edit or delete)", async () => {
    const list = await api("/api/admin/orders");
    assert.strictEqual(list.status, 200);
    assert.ok(Array.isArray(list.body.data));
    assert.ok(list.body.data.length > 0);

    // Detail check
    const firstOrderId = list.body.data[0].maDonHang;
    const detail = await api(`/api/admin/orders/${firstOrderId}`);
    assert.strictEqual(detail.status, 200);
    assert.strictEqual(detail.body.data.maDonHang, firstOrderId);
    assert.ok(Array.isArray(detail.body.data.items));

    // Confirm that NO PUT or DELETE endpoint exists on /orders
    const putRes = await api(`/api/admin/orders/${firstOrderId}`, { method: "PUT" });
    assert.strictEqual(putRes.status, 404, "PUT on /orders must return 404 Not Found");

    const delRes = await api(`/api/admin/orders/${firstOrderId}`, { method: "DELETE" });
    assert.strictEqual(delRes.status, 404, "DELETE on /orders must return 404 Not Found");
  });

  // 7. Inventory CRUD
  const testInvId = `TK_TEST_${Date.now()}`;
  await t.test("7. Admin CRUD on Tồn Kho (Inventory)", async () => {
    // List check
    const list = await api("/api/admin/inventory");
    assert.strictEqual(list.status, 200);
    assert.ok(Array.isArray(list.body.data));

    // Get an existing plant & nursery that don't have existing stock
    // Or create a temporary plant to safely test stock
    const testPlantId = `CAY_INV_${Date.now()}`;
    await api("/api/admin/plants", {
      method: "POST",
      body: JSON.stringify({
        maCay: testPlantId,
        tenCay: "Cây Tồn Kho Test",
        giaBan: 99000,
        maDanhMuc: "DM001",
      }),
    });

    // Create inventory record at second nursery S5VU002
    const create = await api("/api/admin/inventory", {
      method: "POST",
      body: JSON.stringify({
        maTonKho: testInvId,
        maCay: testPlantId,
        maVuonUom: "S5VU002",
        soLuongTon: 50,
      }),
    });
    assert.strictEqual(create.status, 201);

    // Update inventory quantity
    const update = await api(`/api/admin/inventory/${testInvId}`, {
      method: "PUT",
      body: JSON.stringify({
        soLuongTon: 75,
      }),
    });
    assert.strictEqual(update.status, 200);

    // Delete inventory record
    const del = await api(`/api/admin/inventory/${testInvId}`, {
      method: "DELETE",
    });
    assert.strictEqual(del.status, 200);

    // Clean up test plant
    await api(`/api/admin/plants/${testPlantId}`, { method: "DELETE" });
  });
});
