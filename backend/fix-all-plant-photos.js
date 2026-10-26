const https = require('https');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const IMAGES_DIR = path.join(__dirname, '../frontend/public/assets/images');

// Direct Unsplash curated botanical photos for each plant species
const PHOTO_MAP = {
  // Bonsai
  'bonsai_mai.jpg': 'https://images.unsplash.com/photo-1514517521153-1be72277b32f?w=700&auto=format&fit=crop&q=80', // yellow blossom tree
  'bonsai_linh_sam.jpg': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=700&auto=format&fit=crop&q=80', // artistic bonsai
  'bonsai_si.jpg': 'https://images.unsplash.com/photo-1613143323552-09e4544d9354?w=700&auto=format&fit=crop&q=80', // ficus bonsai
  'bonsai_tung.jpg': 'https://images.unsplash.com/photo-1599598425947-5202ed574102?w=700&auto=format&fit=crop&q=80', // pine bonsai

  // Hoa trang tri
  'cam_tu_cau.jpg': 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=700&auto=format&fit=crop&q=80', // hydrangea
  'hoa_hong.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&auto=format&fit=crop&q=80', // heritage rose
  'trang_nguyen.jpg': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=700&auto=format&fit=crop&q=80', // poinsettia red
  'hoa_lan.jpg': 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=700&auto=format&fit=crop&q=80', // orchid purple

  // San vuon
  'cau_vang.jpg': 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=700&auto=format&fit=crop&q=80', // areca palm
  'dua_canh.jpg': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=700&auto=format&fit=crop&q=80', // garden palm
  'hoa_giay.jpg': 'https://images.unsplash.com/photo-1596728325488-81fa0e210777?w=700&auto=format&fit=crop&q=80', // bougainvillea
  'loc_vung.jpg': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=700&auto=format&fit=crop&q=80', // fresh large tree
  'nguyet_que.jpg': 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=700&auto=format&fit=crop&q=80', // fragrant tree

  // Phong thuy
  'phat_tai_bup_sen.jpg': 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=700&auto=format&fit=crop&q=80', // dracaena
  'van_loc_do.jpg': 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=700&auto=format&fit=crop&q=80', // aglaonema red
  'phu_quy.jpg': 'https://images.unsplash.com/photo-1597055181300-e3633a917c9c?w=700&auto=format&fit=crop&q=80', // red border plant
  'truc_phu_quy.jpg': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=700&auto=format&fit=crop&q=80', // lucky bamboo

  // Qua tang
  'co_dong_tien.jpg': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=700&auto=format&fit=crop&q=80', // pilea / hydrocotyle
  'set_sen_da.jpg': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=700&auto=format&fit=crop&q=80', // succulent gift box
  'cam_nhung.jpg': 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=700&auto=format&fit=crop&q=80', // fittonia nerve plant
  'cay_hanh_phuc.jpg': 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=700&auto=format&fit=crop&q=80', // radermachera sinica

  // Sen da & mong nuoc
  'chuoi_ngoc_bi.jpg': 'https://images.unsplash.com/photo-1509223197845-458d87318791?w=700&auto=format&fit=crop&q=80', // burro's tail sedum
  'ngoc_bich.jpg': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=700&auto=format&fit=crop&q=80', // crassula ovata jade
  'xuong_rong_tai_tho.jpg': 'https://images.unsplash.com/photo-1519336056116-bc0f1771dec8?w=700&auto=format&fit=crop&q=80', // bunny ears opuntia cactus
  'sen_da_nau.jpg': 'https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?w=700&auto=format&fit=crop&q=80', // black prince echeveria
  'sen_da_banh_bao.jpg': 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=700&auto=format&fit=crop&q=80', // round plump succulent
  'sen_da_da_quang.jpg': 'https://images.unsplash.com/photo-1446071103084-c257b5f70672?w=700&auto=format&fit=crop&q=80', // haworthia cymbiformis

  // Noi that & cay xanh
  'bach_ma_hoang_tu.jpg': 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=700&auto=format&fit=crop&q=80', // aglaonema white
  'phat_tai_nui.jpg': 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=700&auto=format&fit=crop&q=80', // dracaena draco
  'co_nhat.jpg': 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=700&auto=format&fit=crop&q=80', // licuala palm
  'da_bup_do.jpg': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=700&auto=format&fit=crop&q=80', // rubber tree ficus elastica
  'ngu_gia_bi.jpg': 'https://images.unsplash.com/photo-1600411833196-7c1f6b1a8b90?w=700&auto=format&fit=crop&q=80', // schefflera arboricola
  'ray_voi.jpg': 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=700&auto=format&fit=crop&q=80', // alocasia elephant ear
  'day_nhen.jpg': 'https://images.unsplash.com/photo-1572688484437-25826eb652c5?w=700&auto=format&fit=crop&q=80', // spider plant chlorophytum
  'luoi_meo.jpg': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=700&auto=format&fit=crop&q=80', // bird's nest sansevieria
  'tung_bong_lai.jpg': 'https://images.unsplash.com/photo-1599598425947-5202ed574102?w=700&auto=format&fit=crop&q=80', // podocarpus
  'ngoc_ngan.jpg': 'https://images.unsplash.com/photo-1597055181300-e3633a917c9c?w=700&auto=format&fit=crop&q=80', // dieffenbachia snow

  // Ban cong & treo
  'song_doi.jpg': 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=700&auto=format&fit=crop&q=80', // kalanchoe
  'cuc_tan.jpg': 'https://images.unsplash.com/photo-1525498128493-380d1990a112?w=700&auto=format&fit=crop&q=80', // hanging vernonia
  'hong_mon.jpg': 'https://images.unsplash.com/photo-1596728325488-81fa0e210777?w=700&auto=format&fit=crop&q=80', // anthurium red
  'huong_thao.jpg': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=700&auto=format&fit=crop&q=80', // rosemary herb
  'oai_huong.jpg': 'https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?w=700&auto=format&fit=crop&q=80', // lavender
  'phat_loc.jpg': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=700&auto=format&fit=crop&q=80', // bamboo
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function main() {
  console.log('1. Downloading images...');
  for (const [filename, url] of Object.entries(PHOTO_MAP)) {
    const dest = path.join(IMAGES_DIR, filename);
    try {
      await downloadFile(url, dest);
      console.log(`✓ Downloaded ${filename}`);
    } catch (err) {
      console.error(`✗ Error downloading ${filename}:`, err.message);
    }
  }

  console.log('\n2. Deduplicating and fixing taptintruyenthong...');
  // First, remove duplicate laanhchinh = true for each plant
  // Keep only one row per macay by picking the MIN(matruyenthong)
  await pool.query(`
    UPDATE taptintruyenthong
    SET laanhchinh = false
    WHERE matruyenthong NOT IN (
      SELECT MIN(matruyenthong)
      FROM taptintruyenthong
      GROUP BY macay
    )
  `);

  // Ensure the min row has laanhchinh = true
  await pool.query(`
    UPDATE taptintruyenthong
    SET laanhchinh = true
    WHERE matruyenthong IN (
      SELECT MIN(matruyenthong)
      FROM taptintruyenthong
      GROUP BY macay
    )
  `);

  console.log('\n3. Mapping specific photos to all plant species...');

  const mappings = [
    // Bonsai
    { kw: 'Mai Vàng', file: '/assets/images/bonsai_mai.jpg' },
    { kw: 'Linh Sam', file: '/assets/images/bonsai_linh_sam.jpg' },
    { kw: 'Si Cổ', file: '/assets/images/bonsai_si.jpg' },
    { kw: 'Tùng La Hán', file: '/assets/images/bonsai_tung.jpg' },
    { kw: 'Bonsai', file: '/assets/images/bonsai_tung.jpg' },

    // Hoa
    { kw: 'Cẩm Tú Cầu', file: '/assets/images/cam_tu_cau.jpg' },
    { kw: 'Hoa Hồng', file: '/assets/images/hoa_hong.jpg' },
    { kw: 'Trạng Nguyên', file: '/assets/images/trang_nguyen.jpg' },
    { kw: 'Lan Hồ Điệp', file: '/assets/images/hoa_lan.jpg' },

    // San vuon
    { kw: 'Cau Vàng', file: '/assets/images/cau_vang.jpg' },
    { kw: 'Dừa Cảnh', file: '/assets/images/dua_canh.jpg' },
    { kw: 'Hoa Giấy', file: '/assets/images/hoa_giay.jpg' },
    { kw: 'Lộc Vừng', file: '/assets/images/loc_vung.jpg' },
    { kw: 'Nguyệt Quế', file: '/assets/images/nguyet_que.jpg' },

    // Phong thuy
    { kw: 'Búp Sen', file: '/assets/images/phat_tai_bup_sen.jpg' },
    { kw: 'Vạn Lộc', file: '/assets/images/van_loc_do.jpg' },
    { kw: 'Phú Quý', file: '/assets/images/phu_quy.jpg' },
    { kw: 'Trúc Phú Quý', file: '/assets/images/truc_phu_quy.jpg' },

    // Qua tang
    { kw: 'Cỏ Đồng Tiền', file: '/assets/images/co_dong_tien.jpg' },
    { kw: 'Set Sen Đá', file: '/assets/images/set_sen_da.jpg' },
    { kw: 'Hạnh Phúc', file: '/assets/images/cay_hanh_phuc.jpg' },

    // Sen da & mong nuoc
    { kw: 'Chuỗi ngọc bi', file: '/assets/images/chuoi_ngoc_bi.jpg' },
    { kw: 'Ngọc bích', file: '/assets/images/ngoc_bich.jpg' },
    { kw: 'tai thỏ', file: '/assets/images/xuong_rong_tai_tho.jpg' },
    { kw: 'Xương rồng', file: '/assets/images/xuong_rong_tai_tho.jpg' },
    { kw: 'nâu', file: '/assets/images/sen_da_nau.jpg' },
    { kw: 'Bánh Bao', file: '/assets/images/sen_da_banh_bao.jpg' },
    { kw: 'Dạ Quang', file: '/assets/images/sen_da_da_quang.jpg' },
    { kw: 'Bắp Cải Xanh', file: '/assets/images/sen_sedum.jpg' },
    { kw: 'Bắp Cải', file: '/assets/images/sen_da_bap_cai.jpg' },
    { kw: 'Hồng Đen', file: '/assets/images/sen_da_den.jpg' },
    { kw: 'Hồng Xanh', file: '/assets/images/sen_da_hong.jpg' },
    { kw: 'Viền Hồng', file: '/assets/images/sen_da_hong.jpg' },
    { kw: 'Phật Bà', file: '/assets/images/sen_da_phat_ba.jpg' },
    { kw: 'Rubi', file: '/assets/images/sen_da_rubi.jpg' },
    { kw: 'Sedum', file: '/assets/images/sen_sedum.jpg' },
    { kw: 'Nha đam', file: '/assets/images/nha_dam.jpg' },

    // Noi that & cay xanh
    { kw: 'Bạch mã hoàng tử', file: '/assets/images/bach_ma_hoang_tu.jpg' },
    { kw: 'phát tài núi', file: '/assets/images/phat_tai_nui.jpg' },
    { kw: 'Cọ nhật', file: '/assets/images/co_nhat.jpg' },
    { kw: 'Đa búp đỏ', file: '/assets/images/da_bup_do.jpg' },
    { kw: 'Ngũ gia bì', file: '/assets/images/ngu_gia_bi.jpg' },
    { kw: 'Ráy voi', file: '/assets/images/ray_voi.jpg' },
    { kw: 'Dây nhện', file: '/assets/images/day_nhen.jpg' },
    { kw: 'Cẩm nhung', file: '/assets/images/cam_nhung.jpg' },
    { kw: 'Lưỡi mèo', file: '/assets/images/luoi_meo.jpg' },
    { kw: 'Tùng bồng lai', file: '/assets/images/tung_bong_lai.jpg' },
    { kw: 'Ngọc ngân', file: '/assets/images/ngoc_ngan.jpg' },
    { kw: 'Kim ngân', file: '/assets/images/kim_ngan.jpg' },
    { kw: 'Kim Tiền', file: '/assets/images/kim_tien.jpg' },
    { kw: 'Lan Ý', file: '/assets/images/lan_y.jpg' },
    { kw: 'Lưỡi Hổ', file: '/assets/images/luoi_ho.jpg' },
    { kw: 'Thiết mộc lan', file: '/assets/images/thiet_moc_lan.jpg' },
    { kw: 'Trầu bà', file: '/assets/images/trau_ba.jpg' },
    { kw: 'Vạn niên thanh', file: '/assets/images/van_nien_thanh.jpg' },
    { kw: 'Bàng Singapore', file: '/assets/images/bang_singapore.jpg' },
    { kw: 'Dương xỉ', file: '/assets/images/duong_xi.jpg' },
    { kw: 'Cau tiểu trâm', file: '/assets/images/cau_tieu_tram.jpg' },

    // Ban cong
    { kw: 'sống đời', file: '/assets/images/song_doi.jpg' },
    { kw: 'Cúc tần', file: '/assets/images/cuc_tan.jpg' },
    { kw: 'Hồng môn', file: '/assets/images/hong_mon.jpg' },
    { kw: 'Hương thảo', file: '/assets/images/huong_thao.jpg' },
    { kw: 'Oải hương', file: '/assets/images/oai_huong.jpg' },
    { kw: 'Phát lộc', file: '/assets/images/phat_loc.jpg' },
    { kw: 'Tùng thơm', file: '/assets/images/tung_thom.jpg' },
  ];

  for (const m of mappings) {
    const res = await pool.query(`
      UPDATE taptintruyenthong t
      SET duongdantaptin = $1
      FROM caycanh c
      WHERE t.macay = c.macay 
        AND t.laanhchinh = true
        AND c.tencay ILIKE $2
    `, [m.file, `%${m.kw}%`]);
    console.log(`Updated ${res.rowCount} plants matching "${m.kw}" -> ${m.file}`);
  }

  // Check if any plants still have no media row or null
  const missing = await pool.query(`
    SELECT c.macay, c.tencay
    FROM caycanh c
    WHERE c.macay NOT IN (SELECT macay FROM taptintruyenthong WHERE laanhchinh = true)
  `);
  console.log('Missing media plants count:', missing.rows.length);
  for (const p of missing.rows) {
    await pool.query(`
      INSERT INTO taptintruyenthong (matruyenthong, loaitruyenthong, duongdantaptin, dungluongbyte, laanhchinh, macay)
      VALUES ($1, 'image', '/assets/images/cay_van_phong.jpg', 150000, true, $2)
    `, ['TT_FIX_' + p.macay, p.macay]);
  }

  console.log('\nAll plant photos successfully updated!');
  await pool.end();
}

main().catch(console.error);
