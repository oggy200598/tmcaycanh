const test = require('node:test');
const assert = require('node:assert/strict');
const { pool } = require('../config/db');

test('Database Integrity & Seed Data Verification', async (t) => {
  await t.test('1. Database connection is active', async () => {
    const res = await pool.query('SELECT NOW() AS current_time');
    assert.ok(res.rows[0].current_time);
  });

  await t.test('2. All 12 tables have populated seed records', async () => {
    const tables = [
      'nguoidung',
      'nhacungcap',
      'danhmuc',
      'diachigiaohang',
      'vuonuom',
      'caycanh',
      'yeucausinhtruong',
      'tonkho',
      'taptintruyenthong',
      'donhang',
      'chitietdonhang',
      'danhgia',
    ];

    for (const tbl of tables) {
      const res = await pool.query(`SELECT COUNT(*) AS count FROM ${tbl}`);
      const count = Number(res.rows[0].count);
      assert.ok(count > 0, `Table ${tbl} should have records, found ${count}`);
    }
  });

  await t.test('3. Verify 1-to-1 relationship between CayCanh and YeuCauSinhTruong (BR05)', async () => {
    const res = await pool.query(`
      SELECT c.macay, c.tencay, y.nhietdotoithieu, y.nhietdotoida, y.yeucauanhsang
      FROM caycanh c
      INNER JOIN yeucausinhtruong y ON c.macay = y.macay
    `);
    assert.ok(res.rows.length >= 8, 'All plants should have a matching growth requirement');
    for (const row of res.rows) {
      assert.ok(row.nhietdotoithieu < row.nhietdotoida, 'nhietdotoithieu must be strictly less than nhietdotoida');
      assert.ok(['Toàn phần', 'Bán râm', 'Trong nhà'].includes(row.yeucauanhsang));
    }
  });

  await t.test('4. Verify VuonUom GIS coordinates are valid (BR03)', async () => {
    const res = await pool.query('SELECT mavuonuom, tenvuonuom, vido, kinhdo, bankinhgiaotoidakm FROM vuonuom');
    assert.ok(res.rows.length >= 4);
    for (const v of res.rows) {
      assert.ok(v.vido >= -90 && v.vido <= 90, 'Latitude must be between -90 and +90');
      assert.ok(v.kinhdo >= -180 && v.kinhdo <= 180, 'Longitude must be between -180 and +180');
      assert.ok(v.bankinhgiaotoidakm > 0, 'Delivery radius must be > 0');
    }
  });

  await t.test('5. Verify Users have valid roles and authentication states (BR01, BR02)', async () => {
    const res = await pool.query('SELECT manguoidung, email, vaitro, daxacthuc, trangthai FROM nguoidung');
    assert.ok(res.rows.length >= 6);
    const roles = new Set(res.rows.map((u) => u.vaitro));
    assert.ok(roles.has('Admin'), 'Must contain Admin role');
    assert.ok(roles.has('Staff'), 'Must contain Staff role');
    assert.ok(roles.has('Supplier'), 'Must contain Supplier role');
    assert.ok(roles.has('Customer'), 'Must contain Customer role');
  });

  // End pool after tests
  t.after(() => {
    pool.end();
  });
});
