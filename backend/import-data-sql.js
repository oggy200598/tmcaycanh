const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const cityCoords = [
  { match: 'Hà Nội', viDo: 21.0285, kinhDo: 105.8542 },
  { match: 'Đà Nẵng', viDo: 16.0544, kinhDo: 108.2022 },
  { match: 'Cần Thơ', viDo: 10.0452, kinhDo: 105.7469 },
  { match: 'Đồng Nai', viDo: 10.9574, kinhDo: 106.8427 },
  { match: 'Bình Dương', viDo: 10.9805, kinhDo: 106.6519 },
  { match: 'Lâm Đồng', viDo: 11.9404, kinhDo: 108.4583 },
  { match: 'Tây Ninh', viDo: 11.3344, kinhDo: 106.0989 },
  { match: 'Hải Phòng', viDo: 20.8449, kinhDo: 106.6881 },
  { match: 'Huế', viDo: 16.4637, kinhDo: 107.5909 },
  { match: 'Nha Trang', viDo: 12.2388, kinhDo: 109.1967 },
  { match: 'Vũng Tàu', viDo: 10.3460, kinhDo: 107.0843 },
  { match: 'Gia Hòa', viDo: 10.8250, kinhDo: 106.7720 },
  { match: 'Hồ Chí Minh', viDo: 10.8231, kinhDo: 106.6297 },
  { match: 'TP.HCM', viDo: 10.8231, kinhDo: 106.6297 },
];

async function importDataSql(dbName) {
  console.log(`\n========================================`);
  console.log(`Starting clean import of DATA/data.sql into: ${dbName}`);
  console.log(`========================================`);

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: dbName,
  });

  await client.connect();

  try {
    console.log(`1. Cleaning existing test data in correct FK order...`);
    await client.query('BEGIN');
    await client.query('DELETE FROM danhgia');
    await client.query('DELETE FROM chitietdonhang');
    await client.query('DELETE FROM donhang');
    await client.query('DELETE FROM taptintruyenthong');
    await client.query('DELETE FROM tonkho');
    await client.query('DELETE FROM yeucausinhtruong');
    await client.query('DELETE FROM caycanh');
    await client.query('DELETE FROM vuonuom');
    await client.query('DELETE FROM diachigiaohang');
    await client.query('DELETE FROM danhmuc');
    await client.query('DELETE FROM nhacungcap');
    await client.query('DELETE FROM nguoidung');
    await client.query('COMMIT');
    console.log(`   Cleaned all 12 tables.`);

    console.log(`2. Reading and executing DATA/data.sql...`);
    const sqlPath = path.resolve(__dirname, '../DATA/data.sql');
    const rawSql = fs.readFileSync(sqlPath, 'utf-8');
    await client.query(rawSql);
    console.log(`   Successfully executed all INSERT statements from data.sql!`);

    console.log(`3. Setting default secure hashed password ('123456') for users with NULL matkhaumahoa...`);
    const defaultHash = await bcrypt.hash('123456', 10);
    const updateRes = await client.query(
      `UPDATE nguoidung SET matkhaumahoa = $1 WHERE matkhaumahoa IS NULL OR matkhaumahoa = ''`,
      [defaultHash]
    );
    console.log(`   Updated password for ${updateRes.rowCount} users.`);

    console.log(`4. Ensuring core demo accounts exist for quick login buttons in frontend...`);
    const demoAccounts = [
      {
        ma: 'USR_ADMIN_DEMO',
        user: 'admin',
        email: 'admin@tmcaycanh.vn',
        phone: '0901111111',
        name: 'Quản Trị Viên Hệ Thống',
        role: 'Admin',
      },
      {
        ma: 'USR_STAFF_DEMO',
        user: 'staff01',
        email: 'staff@tmcaycanh.vn',
        phone: '0902222222',
        name: 'Trần Văn Kiểm Duyệt',
        role: 'Staff',
      },
      {
        ma: 'USR_SUPPLIER_DEMO',
        user: 'saigonbonsai',
        email: 'supplier@saigonbonsai.vn',
        phone: '0903333333',
        name: 'Vườn Kiểng Sài Gòn Bonsai',
        role: 'Supplier',
      },
      {
        ma: 'USR_CUSTOMER_DEMO',
        user: 'customer01',
        email: 'customer@gmail.com',
        phone: '0904444444',
        name: 'Nguyễn Văn Khách Hàng',
        role: 'Customer',
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
    console.log(`   Ensured 4 core demo accounts are active.`);

    console.log(`5. Enriching GIS coordinates for VuonUom from city/province location...`);
    const nurseries = await client.query('SELECT mavuonuom, tenvuonuom, diachi FROM vuonuom');
    for (const n of nurseries.rows) {
      const match = cityCoords.find(
        (c) => n.tenvuonuom.includes(c.match) || n.diachi.includes(c.match)
      ) || { viDo: 10.8231, kinhDo: 106.6297 };

      await client.query(
        'UPDATE vuonuom SET vido = $1, kinhdo = $2 WHERE mavuonuom = $3',
        [match.viDo, match.kinhDo, n.mavuonuom]
      );
    }
    console.log(`   Enriched coordinates for ${nurseries.rows.length} nurseries.`);

    console.log(`6. Enriching delivery coordinates for DiaChiGiaoHang...`);
    await client.query(`
      UPDATE diachigiaohang
      SET vido = 10.75 + (random() * 0.15),
          kinhdo = 106.60 + (random() * 0.20)
      WHERE vido IS NULL OR kinhdo IS NULL
    `);
    console.log(`   Updated delivery coordinates.`);

    console.log(`7. Ensuring default botanical images for products without photos...`);
    const plantPhotos = [
      { name: 'kim_tien.jpg', keywords: ['kim tiền'] },
      { name: 'bang_singapore.jpg', keywords: ['bàng singapore'] },
      { name: 'sen_da.jpg', keywords: ['sen đá', 'sedum'] },
      { name: 'sen_da_hong.jpg', keywords: ['bông hồng', 'viền hồng'] },
      { name: 'sen_da_do.jpg', keywords: ['phật bà', 'rubi'] },
      { name: 'trau_ba.jpg', keywords: ['trầu bà'] },
      { name: 'luoi_ho.jpg', keywords: ['lưỡi hổ'] },
      { name: 'lan_y.jpg', keywords: ['lan ý', 'hồng môn'] },
      { name: 'kim_ngan.jpg', keywords: ['kim ngân'] },
      { name: 'van_nien_thanh.jpg', keywords: ['vạn niên thanh'] },
      { name: 'nha_dam.jpg', keywords: ['nha đam', 'ngọc ngân'] },
      { name: 'cau_tieu_tram.jpg', keywords: ['cau tiểu trâm'] },
      { name: 'bonsai.jpg', keywords: ['bonsai', 'mai', 'tùng'] },
      { name: 'duong_xi.jpg', keywords: ['dương xỉ'] },
      { name: 'thiet_moc_lan.jpg', keywords: ['thiết mộc lan', 'phú quý'] },
      { name: 'monstera.jpg', keywords: ['nội thất'] },
      { name: 'cay_van_phong.jpg', keywords: ['để bàn'] },
      { name: 'cay_kieng_la.jpg', keywords: ['thủy sinh'] }
    ];

    const plantsRes = await client.query('SELECT macay, tencay FROM caycanh');
    for (const plant of plantsRes.rows) {
      const lower = plant.tencay.toLowerCase();
      let matched = plantPhotos[0].name;
      for (const p of plantPhotos) {
        if (p.keywords.some(kw => lower.includes(kw))) {
          matched = p.name;
          break;
        }
      }
      await client.query(
        `UPDATE taptintruyenthong 
         SET duongdantaptin = $1, laanhchinh = true 
         WHERE macay = $2 AND (duongdantaptin IS NULL OR duongdantaptin = '' OR duongdantaptin LIKE '%17930%')`,
        [`/assets/images/${matched}`, plant.macay]
      );
    }
    console.log(`   Assigned real botanical photos to all plants.`);

    console.log(`8. Verifying table row counts in ${dbName}...`);
    const tables = [
      'nguoidung', 'nhacungcap', 'danhmuc', 'diachigiaohang',
      'vuonuom', 'caycanh', 'yeucausinhtruong', 'tonkho',
      'taptintruyenthong', 'donhang', 'chitietdonhang', 'danhgia'
    ];
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`   - ${t.padEnd(20)}: ${res.rows[0].count} rows`);
    }

    console.log(`\nImport into ${dbName} COMPLETED SUCCESSFULLY!`);
  } catch (err) {
    console.error(`Error during import into ${dbName}:`, err);
    throw err;
  } finally {
    await client.end();
  }
}

async function run() {
  try {
    await importDataSql('tmcaycanh');
    try {
      await importDataSql('tmdt_caycanh');
    } catch (e) {
      console.log(`Skipped tmdt_caycanh:`, e.message);
    }
    console.log('\nAll databases updated!');
  } catch (err) {
    console.error('Fatal import error:', err);
    process.exit(1);
  }
}

run();
