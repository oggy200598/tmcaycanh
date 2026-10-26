const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const app = require("../server");

test("Image Upload Service Verification (TDD)", async (t) => {
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

  const token = jwt.sign(
    { maNguoiDung: "US_TEST", vaiTro: "NhaCungCap", email: "supplier@test.com" },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "1h" }
  );

  let uploadedDiskPath = null;

  await t.test("1. Reject upload if no file is attached", async () => {
    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, "NO_FILE");
  });

  await t.test("2. Upload valid image file and save to frontend/public/assets/images", async () => {
    const dummyPngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );

    const formData = new FormData();
    const blob = new Blob([dummyPngBuffer], { type: "image/png" });
    formData.append("image", blob, "test_upload.png");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const body = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(body.success, true);
    assert.ok(body.data.url.startsWith("/assets/images/"));

    uploadedDiskPath = path.join(
      __dirname,
      "../../frontend/public",
      body.data.url
    );

    assert.ok(fs.existsSync(uploadedDiskPath), "File should be created in frontend/public/assets/images/");
  });

  await t.test("3. Reject upload without authentication", async () => {
    const dummyPngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
    const formData = new FormData();
    const blob = new Blob([dummyPngBuffer], { type: "image/png" });
    formData.append("image", blob, "test_no_auth.png");

    const res = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    });

    assert.strictEqual(res.status, 401);
  });

  // Clean up
  if (uploadedDiskPath && fs.existsSync(uploadedDiskPath)) {
    fs.unlinkSync(uploadedDiskPath);
  }
});
