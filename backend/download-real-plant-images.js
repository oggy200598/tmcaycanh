const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

const targetDir = path.join(__dirname, '../frontend/public/assets/images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Map of real plant photos
const plantPhotos = [
  { name: 'kim_tien.jpg', id: 'photo-1632207691143-643e2a9a9361', keywords: ['kim tiền'] },
  { name: 'bang_singapore.jpg', id: 'photo-1545241047-6083a3684587', keywords: ['bàng singapore'] },
  { name: 'sen_da.jpg', id: 'photo-1509423350716-97f9360b4e09', keywords: ['sen đá', 'sedum'] },
  { name: 'sen_da_hong.jpg', id: 'photo-1459411552884-841db9b3cc2a', keywords: ['bông hồng', 'viền hồng'] },
  { name: 'sen_da_do.jpg', id: 'photo-1446071103084-c257b5f70672', keywords: ['phật bà', 'rubi'] },
  { name: 'trau_ba.jpg', id: 'photo-1614594975525-e45190c55d0b', keywords: ['trầu bà'] },
  { name: 'luoi_ho.jpg', id: 'photo-1520412099551-62b6bafeb5bb', keywords: ['lưỡi hổ'] },
  { name: 'lan_y.jpg', id: 'photo-1487700160041-babef9c3cb55', keywords: ['lan ý', 'hồng môn'] },
  { name: 'kim_ngan.jpg', id: 'photo-1617173944883-6ffbd35d584d', keywords: ['kim ngân'] },
  { name: 'van_nien_thanh.jpg', id: 'photo-1596547609652-9cf5d8d76921', keywords: ['vạn niên thanh'] },
  { name: 'nha_dam.jpg', id: 'photo-1502082553048-f009c37129b9', keywords: ['nha đam', 'ngọc ngân'] },
  { name: 'cau_tieu_tram.jpg', id: 'photo-1512428813834-c702c7702b78', keywords: ['cau tiểu trâm'] },
  { name: 'bonsai.jpg', id: 'photo-1512496015851-a90fb38ba796', keywords: ['bonsai', 'mai', 'tùng'] },
  { name: 'duong_xi.jpg', id: 'photo-1598880940371-c756e015fea1', keywords: ['dương xỉ'] },
  { name: 'thiet_moc_lan.jpg', id: 'photo-1598880940080-ff9a29891b85', keywords: ['thiết mộc lan', 'phú quý'] },
  { name: 'monstera.jpg', id: 'photo-1470058869958-2a77ade41c02', keywords: ['nội thất'] },
  { name: 'cay_van_phong.jpg', id: 'photo-1485955900006-10f4d324d411', keywords: ['để bàn'] },
  { name: 'cay_kieng_la.jpg', id: 'photo-1501004318641-b39e6451bec6', keywords: ['thủy sinh'] }
];

async function downloadAll() {
  console.log('1. Downloading real plant photos to assets/images/...');
  for (const item of plantPhotos) {
    const filePath = path.join(targetDir, item.name);
    try {
      const url = `https://images.unsplash.com/${item.id}?w=700&auto=format&fit=crop&q=80`;
      const res = await fetch(url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        console.log(`   ✓ Saved ${item.name} (${buffer.length} bytes)`);
      } else {
        console.warn(`   ✗ Failed to download ${item.name}: ${res.status}`);
      }
    } catch (err) {
      console.error(`   ✗ Error downloading ${item.name}:`, err.message);
    }
  }

  // Also write default cay_van_nien_thanh.png with real photo
  const defaultPngPath = path.join(targetDir, 'cay_van_nien_thanh.png');
  const srcJpg = path.join(targetDir, 'van_nien_thanh.jpg');
  if (fs.existsSync(srcJpg)) {
    fs.copyFileSync(srcJpg, defaultPngPath);
    console.log('   ✓ Updated default cay_van_nien_thanh.png with real plant photo');
  }

  // Remove the old diagram files from assets/images
  console.log('2. Removing old architectural diagram images...');
  const diagramFiles = [
    '1793021848364_2015479814636826102_g9036106454944814440_41a33ab63cdc85ee8dcc04ef6c63dda1.jpg',
    '1793021887311_6353931741028154147_g9036106454944814440_5c1f31811a5de40b4be5cf409a08a964.jpg',
    '1793021891892_6353931741028154147_g9036106454944814440_6a35f5957ac09bb43dbc59b7c4099d40.jpg'
  ];
  for (const f of diagramFiles) {
    const p = path.join(targetDir, f);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`   ✓ Deleted diagram file: ${f}`);
    }
  }

  // Update Database records in taptintruyenthong
  console.log('3. Updating database taptintruyenthong with real plant image paths...');
  const dbNames = ['tmcaycanh', 'tmdt_caycanh'];
  for (const dbName of dbNames) {
    try {
      const client = await pool.connect();
      // Switch DB if needed
      await client.query(`SELECT 1`);
      
      const plantsRes = await client.query('SELECT macay, tencay, madanhmuc FROM caycanh');
      for (const plant of plantsRes.rows) {
        const lowerName = plant.tencay.toLowerCase();
        let matchedPhoto = plantPhotos[0].name;

        for (const p of plantPhotos) {
          if (p.keywords.some(kw => lowerName.includes(kw))) {
            matchedPhoto = p.name;
            break;
          }
        }

        const relativeUrl = `/assets/images/${matchedPhoto}`;

        // Update taptintruyenthong for this plant
        await client.query(
          `UPDATE taptintruyenthong 
           SET duongdantaptin = $1, laanhchinh = true 
           WHERE macay = $2`,
          [relativeUrl, plant.macay]
        );
      }
      client.release();
      console.log(`   ✓ Updated all plant images in ${dbName} database.`);
    } catch (err) {
      console.warn(`   Notice for ${dbName}:`, err.message);
    }
  }

  console.log('Done downloading real plant photos and updating database!');
}

downloadAll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
