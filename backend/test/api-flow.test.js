const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const app = require("../server");
const { pool } = require("../config/db");

let server;
let baseUrl;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

test("Full Backend API & Business Workflow E2E (TDD)", async (t) => {
  // Start server on ephemeral port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  let customerToken = "";
  let adminToken = "";
  let createdOrderId = "";
  let testPlantId = "CAY001";
  let testNurseryId = "VU001";

  await t.test(
    "1. Health check verifies backend and PostgreSQL connection",
    async () => {
      const res = await request("GET", "/api/health");
      assert.equal(res.status, 200);
      assert.equal(res.body.status, "UP");
    },
  );

  await t.test("2. Customer and Admin login returns JWT tokens", async () => {
    // Customer login
    const cRes = await request("POST", "/api/auth/login", {
      tenDangNhap: "customer@gmail.com",
      matKhau: "123456",
    });
    assert.equal(cRes.status, 200);
    assert.ok(cRes.body.data.token);
    customerToken = cRes.body.data.token;
    assert.equal(cRes.body.data.user.vaiTro, "Customer");

    // Admin login
    const aRes = await request("POST", "/api/auth/login", {
      tenDangNhap: "admin@tmcaycanh.vn",
      matKhau: "123456",
    });
    assert.equal(aRes.status, 200);
    assert.ok(aRes.body.data.token);
    adminToken = aRes.body.data.token;
    assert.equal(aRes.body.data.user.vaiTro, "Admin");
  });

  await t.test(
    "3. GET /api/plants calculates GIS distance & climate compatibility (, )",
    async () => {
      // User in District 1 HCM
      const res = await request(
        "GET",
        "/api/plants?lat=10.7745&lon=106.7032&temp=28&humidity=65",
      );
      assert.equal(res.status, 200);
      assert.ok(res.body.data.length > 0);

      const first = res.body.data[0];
      assert.ok(first.doPhuHopKhiHau.score >= 0);
      assert.ok(first.khoangCachGanNhatKm !== null);
      testPlantId = first.maCay;
      if (first.vuonUomGanNhat) {
        testNurseryId = first.vuonUomGanNhat.maVuonUom;
      }
    },
  );

  await t.test(
    "4. GET /api/plants/:id returns 1-1 growth requirements and nurseries",
    async () => {
      const res = await request(
        "GET",
        `/api/plants/${testPlantId}?lat=10.7745&lon=106.7032`,
      );
      assert.equal(res.status, 200);
      assert.equal(res.body.data.maCay, testPlantId);
      assert.ok(
        res.body.data.yeuCauSinhTruong.nhietDoToiThieu <
          res.body.data.yeuCauSinhTruong.nhietDoToiDa,
      );
      if (res.body.data.danhSachVuonUom && res.body.data.danhSachVuonUom.length > 0) {
        testNurseryId = res.body.data.danhSachVuonUom[0].maVuonUom;
      }
    },
  );

  await t.test(
    "5. POST /api/orders creates order and locks inventory (, , )",
    async () => {
      const res = await request(
        "POST",
        "/api/orders",
        {
          maVuonUom: testNurseryId,
          viDoGiao: 10.7745,
          kinhDoGiao: 106.7032,
          diaChiChiTiet: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
          items: [{ maCay: testPlantId, soLuong: 1 }],
          phuongThucThanhToan: "COD",
        },
        { Authorization: `Bearer ${customerToken}` },
      );

      assert.equal(res.status, 201);
      assert.ok(res.body.data.maDonHang);
      assert.ok(res.body.data.phiVanChuyen >= 20000);
      assert.equal(res.body.data.trangThaiDonHang, "ChoXacNhan");
      createdOrderId = res.body.data.maDonHang;
    },
  );

  await t.test(
    "6. Linear transition enforcement: cannot skip steps ()",
    async () => {
      // Attempting to skip ChoXacNhan directly to DangGiaoHang must be rejected!
      const skipRes = await request(
        "PATCH",
        `/api/orders/${createdOrderId}/status`,
        { trangThaiMoi: "DangGiaoHang" },
        { Authorization: `Bearer ${adminToken}` },
      );
      assert.equal(skipRes.status, 400);
      assert.equal(skipRes.body.error.code, "INVALID_TRANSITION");
    },
  );

  await t.test(
    "7. Step-by-step valid transitions and plant health photo required (, , )",
    async () => {
      // Step 1: ChoXacNhan -> DaXacNhan
      const step1 = await request(
        "PATCH",
        `/api/orders/${createdOrderId}/status`,
        { trangThaiMoi: "DaXacNhan" },
        { Authorization: `Bearer ${adminToken}` },
      );
      assert.equal(step1.status, 200);

      // Step 2: DaXacNhan -> DangChuanBiHang
      const step2 = await request(
        "PATCH",
        `/api/orders/${createdOrderId}/status`,
        { trangThaiMoi: "DangChuanBiHang" },
        { Authorization: `Bearer ${adminToken}` },
      );
      assert.equal(step2.status, 200);

      // Step 3: DangChuanBiHang -> DangGiaoHang without photo should fail ()
      const step3Fail = await request(
        "PATCH",
        `/api/orders/${createdOrderId}/status`,
        { trangThaiMoi: "DangGiaoHang" },
        { Authorization: `Bearer ${adminToken}` },
      );
      assert.equal(step3Fail.status, 400);
      assert.equal(step3Fail.body.error.code, "HEALTH_VERIFICATION_REQUIRED");

      // Step 3 with photo succeeds ()
      const step3Pass = await request(
        "PATCH",
        `/api/orders/${createdOrderId}/status`,
        {
          trangThaiMoi: "DangGiaoHang",
          anhSucKhoeUrl:
            "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80",
        },
        { Authorization: `Bearer ${adminToken}` },
      );
      assert.equal(step3Pass.status, 200);
      assert.equal(step3Pass.body.data.daXacNhanSucKhoe, true);

      // Step 4: DangGiaoHang -> DaHoanThanh ()
      const step4 = await request(
        "PATCH",
        `/api/orders/${createdOrderId}/status`,
        { trangThaiMoi: "DaHoanThanh" },
        { Authorization: `Bearer ${adminToken}` },
      );
      assert.equal(step4.status, 200);
      assert.equal(step4.body.data.trangThaiHienTai, "DaHoanThanh");
    },
  );

  await t.test("8. Admin Dashboard & GIS Heatmap queries (, )", async () => {
    const statsRes = await request("GET", "/api/admin/dashboard", null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.equal(statsRes.status, 200);
    assert.ok(statsRes.body.data.tongDonHang >= 1);

    const heatRes = await request("GET", "/api/admin/heatmap", null, {
      Authorization: `Bearer ${adminToken}`,
    });
    assert.equal(heatRes.status, 200);
    assert.ok(Array.isArray(heatRes.body.data));
  });

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  });
});
