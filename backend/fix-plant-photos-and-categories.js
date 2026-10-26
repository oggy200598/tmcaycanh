const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

const targetDir = path.join(__dirname, '../frontend/public/assets/images');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 1. Curated real botanical photos from Unsplash
const realPhotos = [
  { file: 'tung_thom.jpg', id: 'photo-1542273917363-3b1817f69a2d' }, // Pine/Cypress
  { file: 'bonsai_tung.jpg', id: 'photo-1514517521153-1be72277b32f' }, // Real Bonsai tree in pot
  { file: 'bonsai_mai.jpg', id: 'photo-1579783900882-c0d3dad7b119' }, // Real Flowering Bonsai
  { file: 'sen_sedum.jpg', id: 'photo-1509223197845-458d87318791' }, // Sedum green jellybean
  { file: 'sen_da_bap_cai.jpg', id: 'photo-1520412099551-62b6bafeb5bb' }, // Rosette succulent
  { file: 'sen_da_hong.jpg', id: 'photo-1459411552884-841db9b3cc2a' }, // Pink edged succulent
  { file: 'sen_da_den.jpg', id: 'photo-1446071103084-c257b5f70672' }, // Dark / Ruby succulent
  { file: 'sen_da_phat_ba.jpg', id: 'photo-1509423350716-97f9360b4e09' }, // Sempervivum
  { file: 'sen_da_rubi.jpg', id: 'photo-1446071103084-c257b5f70672' }, // Red succulent
  { file: 'kim_tien.jpg', id: 'photo-1632207691143-643e2a9a9361' }, // Zamioculcas
  { file: 'bang_singapore.jpg', id: 'photo-1545241047-6083a3684587' }, // Ficus lyrata
  { file: 'luoi_ho.jpg', id: 'photo-1520412099551-62b6bafeb5bb' }, // Snake plant
  { file: 'lan_y.jpg', id: 'photo-1487700160041-babef9c3cb55' }, // Peace lily
  { file: 'kim_ngan.jpg', id: 'photo-1617173944883-6ffbd35d584d' }, // Money tree
  { file: 'van_nien_thanh.jpg', id: 'photo-1596547609652-9cf5d8d76921' }, // Dieffenbachia
  { file: 'nha_dam.jpg', id: 'photo-1502082553048-f009c37129b9' }, // Aloe
  { file: 'cau_tieu_tram.jpg', id: 'photo-1512428813834-c702c7702b78' }, // Palm
  { file: 'duong_xi.jpg', id: 'photo-1598880940371-c756e015fea1' }, // Fern
  { file: 'thiet_moc_lan.jpg', id: 'photo-1598880940080-ff9a29891b85' }, // Dracaena
  { file: 'trau_ba.jpg', id: 'photo-1614594975525-e45190c55d0b' }, // Pothos
  { file: 'hoa_lan.jpg', id: 'photo-1566999573217-25c859ec1450' }, // Orchid
  { file: 'hoa_hong.jpg', id: 'photo-1559563458-527698bf5295' }, // Rose
  { file: 'cay_san_vuon.jpg', id: 'photo-1585320806297-9794b3e4eeae' }, // Garden foliage
  { file: 'cay_phong_thuy.jpg', id: 'photo-1518531933037-91b2f5f229cc' }, // Fortune plant
  { file: 'chau_cay_qua_tang.jpg', id: 'photo-1463936575829-25148e1db1b8' }, // Gift potted plant
  { file: 'cam_nhung.jpg', id: 'photo-1485955900006-10f4d324d411' }, // Fittonia
  { file: 'cay_van_phong.jpg', id: 'photo-1497250681960-ef046c08a56e' } // Foliage plant
];

async function downloadImages() {
  console.log('1. Downloading verified botanical images...');
  for (const item of realPhotos) {
    const filePath = path.join(targetDir, item.file);
    try {
      const url = `https://images.unsplash.com/${item.id}?w=700&auto=format&fit=crop&q=80`;
      const res = await fetch(url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
        console.log(`   ✓ Saved ${item.file} (${buffer.length} bytes)`);
      } else {
        console.warn(`   ✗ Failed ${item.file}: ${res.status}`);
      }
    } catch (err) {
      console.error(`   ✗ Error ${item.file}:`, err.message);
    }
  }

  // Overwrite default png
  const vanNienThanh = path.join(targetDir, 'van_nien_thanh.jpg');
  if (fs.existsSync(vanNienThanh)) {
    fs.copyFileSync(vanNienThanh, path.join(targetDir, 'cay_van_nien_thanh.png'));
  }

  // Remove the old bad makeup / diagram files if present
  const badFiles = ['bonsai.jpg'];
  for (const f of badFiles) {
    const p = path.join(targetDir, f);
    if (fs.existsSync(p)) {
      // replace bonsai.jpg with bonsai_tung.jpg so nothing breaks if referenced
      const goodBonsai = path.join(targetDir, 'bonsai_tung.jpg');
      if (fs.existsSync(goodBonsai)) {
        fs.copyFileSync(goodBonsai, p);
        console.log(`   ✓ Replaced ${f} with real bonsai tree photo`);
      }
    }
  }
}

// 2. Map plant names to exact distinct photos
function getPhotoForPlant(plantName, catId) {
  const name = plantName.toLowerCase();
  
  if (name.includes('tùng thơm')) return '/assets/images/tung_thom.jpg';
  if (name.includes('tùng') || name.includes('bonsai') || name.includes('mai')) return '/assets/images/bonsai_tung.jpg';
  
  // Succulents - distinct mapping
  if (name.includes('sedum')) return '/assets/images/sen_sedum.jpg';
  if (name.includes('bắp cải xanh')) return '/assets/images/sen_sedum.jpg';
  if (name.includes('bắp cải')) return '/assets/images/sen_da_bap_cai.jpg';
  if (name.includes('bông hồng đen')) return '/assets/images/sen_da_den.jpg';
  if (name.includes('bông hồng xanh')) return '/assets/images/sen_da_hong.jpg';
  if (name.includes('viền hồng')) return '/assets/images/sen_da_hong.jpg';
  if (name.includes('rubi')) return '/assets/images/sen_da_rubi.jpg';
  if (name.includes('phật bà')) return '/assets/images/sen_da_phat_ba.jpg';
  if (name.includes('sen đá')) return '/assets/images/sen_da_bap_cai.jpg';
  
  // Other species
  if (name.includes('kim tiền')) return '/assets/images/kim_tien.jpg';
  if (name.includes('bàng singapore')) return '/assets/images/bang_singapore.jpg';
  if (name.includes('lưỡi hổ')) return '/assets/images/luoi_ho.jpg';
  if (name.includes('lan ý')) return '/assets/images/lan_y.jpg';
  if (name.includes('trầu bà')) return '/assets/images/trau_ba.jpg';
  if (name.includes('kim ngân')) return '/assets/images/kim_ngan.jpg';
  if (name.includes('vạn niên thanh')) return '/assets/images/van_nien_thanh.jpg';
  if (name.includes('nha đam') || name.includes('ngọc ngân')) return '/assets/images/nha_dam.jpg';
  if (name.includes('cau tiểu trâm')) return '/assets/images/cau_tieu_tram.jpg';
  if (name.includes('dương xỉ')) return '/assets/images/duong_xi.jpg';
  if (name.includes('thiết mộc lan')) return '/assets/images/thiet_moc_lan.jpg';
  if (name.includes('hồng môn')) return '/assets/images/lan_y.jpg';
  if (name.includes('phú quý')) return '/assets/images/cay_phong_thuy.jpg';
  
  // Category specific fallbacks
  if (catId === 'S5DM005') return '/assets/images/cay_san_vuon.jpg';
  if (catId === 'S5DM006') return '/assets/images/cay_phong_thuy.jpg';
  if (catId === 'S5DM009') return '/assets/images/bonsai_tung.jpg';
  if (catId === 'S5DM011') return '/assets/images/hoa_lan.jpg';
  if (catId === 'S5DM012') return '/assets/images/chau_cay_qua_tang.jpg';

  return '/assets/images/cay_van_phong.jpg';
}

// 3. New plants to populate the 5 empty categories
const newPlants = [
  // S5DM005: Cây cảnh sân vườn
  {
    macay: 'SV_CAY001',
    tencay: 'Cây Cau Vàng Sân Vườn',
    tenkhoahoc: 'Dypsis lutescens',
    gia: 350000,
    danhmuc: 'S5DM005',
    mota: 'Cây cau vàng tán xòe xanh tốt, tạo bóng mát và cảnh quan sang trọng cho khuôn viên sân vườn, biệt thự.',
    img: '/assets/images/cay_san_vuon.jpg',
    yeucau: { minT: 18, maxT: 38, doAm: 70, anhSang: 'Toàn phần', loaiDat: 'Đất phù sa tơi xốp, thoát nước tốt' }
  },
  {
    macay: 'SV_CAY002',
    tencay: 'Cây Hoa Giấy Ngũ Sắc',
    tenkhoahoc: 'Bougainvillea spectabilis',
    gia: 450000,
    danhmuc: 'S5DM005',
    mota: 'Hoa giấy ghép 5 màu rực rỡ, chịu nắng hạn tốt, thích hợp leo cổng vòm và hàng rào sân vườn.',
    img: '/assets/images/hoa_hong.jpg',
    yeucau: { minT: 15, maxT: 40, doAm: 50, anhSang: 'Toàn phần', loaiDat: 'Đất cát pha mùn dừa' }
  },
  {
    macay: 'SV_CAY003',
    tencay: 'Cây Nguyệt Quế Cổ Thụ Thơm',
    tenkhoahoc: 'Murraya paniculata',
    gia: 680000,
    danhmuc: 'S5DM005',
    mota: 'Hoa trắng tinh khôi tỏa hương thơm ngát về đêm, mang lại bình an và may mắn cho gia chủ.',
    img: '/assets/images/cay_san_vuon.jpg',
    yeucau: { minT: 18, maxT: 35, doAm: 65, anhSang: 'Toàn phần', loaiDat: 'Đất thịt tơi xốp nhiều dinh dưỡng' }
  },
  {
    macay: 'SV_CAY004',
    tencay: 'Cây Dừa Cảnh Sân Vườn',
    tenkhoahoc: 'Chrysalidocarpus lutescens',
    gia: 520000,
    danhmuc: 'S5DM005',
    mota: 'Dừa cảnh tán lá mềm mại, thanh lọc không khí và điều hòa vi khí hậu khu vườn ngoài trời.',
    img: '/assets/images/cay_san_vuon.jpg',
    yeucau: { minT: 20, maxT: 38, doAm: 75, anhSang: 'Toàn phần', loaiDat: 'Đất hữu cơ màu mỡ' }
  },
  {
    macay: 'SV_CAY005',
    tencay: 'Cây Lộc Vừng Phong Thủy Sân Vườn',
    tenkhoahoc: 'Barringtonia acutangula',
    gia: 1200000,
    danhmuc: 'S5DM005',
    mota: 'Cây lộc vừng hoa đỏ buông rủ tuyệt đẹp, tượng trưng cho tài lộc, thịnh vượng tích tụ dài lâu.',
    img: '/assets/images/bonsai_mai.jpg',
    yeucau: { minT: 18, maxT: 36, doAm: 80, anhSang: 'Toàn phần', loaiDat: 'Đất giữ ẩm tốt' }
  },

  // S5DM006: Cây phong thủy
  {
    macay: 'PT_CAY001',
    tencay: 'Cây Phát Tài Búp Sen Phong Thủy',
    tenkhoahoc: 'Dracaena deremensis',
    gia: 180000,
    danhmuc: 'S5DM006',
    mota: 'Búp lá xếp lớp như đóa hoa sen thanh tịnh, thu hút vượng khí và may mắn cho đường công danh.',
    img: '/assets/images/cay_phong_thuy.jpg',
    yeucau: { minT: 18, maxT: 32, doAm: 65, anhSang: 'Bán râm', loaiDat: 'Đất thịt nhẹ giàu mùn' }
  },
  {
    macay: 'PT_CAY002',
    tencay: 'Cây Vạn Lộc Đỏ Tài Lộc',
    tenkhoahoc: 'Aglaonema rotundum',
    gia: 160000,
    danhmuc: 'S5DM006',
    mota: 'Lá cây đỏ rực rỡ tượng trưng cho lửa nhiệt huyết, tài lộc dồi dào và thịnh vượng phát triển.',
    img: '/assets/images/cam_nhung.jpg',
    yeucau: { minT: 18, maxT: 32, doAm: 70, anhSang: 'Trong nhà', loaiDat: 'Đất vi sinh tơi xốp' }
  },
  {
    macay: 'PT_CAY003',
    tencay: 'Cây Phú Quý Tài Lộc',
    tenkhoahoc: 'Aglaonema hybrid',
    gia: 150000,
    danhmuc: 'S5DM006',
    mota: 'Thân trắng hồng, viền lá đỏ kiêu sa mang lại phú quý cát tường cho phòng khách và bàn làm việc.',
    img: '/assets/images/cay_phong_thuy.jpg',
    yeucau: { minT: 16, maxT: 34, doAm: 65, anhSang: 'Bán râm', loaiDat: 'Đất trộn trấu hun xơ dừa' }
  },
  {
    macay: 'PT_CAY004',
    tencay: 'Cây Kim Ngân 5 Củ Thắt Bím',
    tenkhoahoc: 'Pachira aquatica 5-stem',
    gia: 320000,
    danhmuc: 'S5DM006',
    mota: 'Năm thân bện chặt tượng trưng cho ngũ hành tương sinh, cân bằng năng lượng và giữ chặt tiền tài.',
    img: '/assets/images/kim_ngan.jpg',
    yeucau: { minT: 18, maxT: 35, doAm: 60, anhSang: 'Bán râm', loaiDat: 'Đất tơi xốp thoát nước nhanh' }
  },
  {
    macay: 'PT_CAY005',
    tencay: 'Cây Trúc Phú Quý Thủy Canh',
    tenkhoahoc: 'Dracaena sanderiana',
    gia: 120000,
    danhmuc: 'S5DM006',
    mota: 'Thân chia từng đốt thẳng tắp, biểu trưng cho sự ngay thẳng, kiên cường và thăng tiến vững vàng.',
    img: '/assets/images/cay_phong_thuy.jpg',
    yeucau: { minT: 15, maxT: 35, doAm: 70, anhSang: 'Trong nhà', loaiDat: 'Dung dịch thủy sinh hoặc đất mùn' }
  },

  // S5DM009: Cây bonsai
  {
    macay: 'BS_CAY001',
    tencay: 'Bonsai Tùng La Hán Dáng Trực',
    tenkhoahoc: 'Podocarpus macrophyllus',
    gia: 2500000,
    danhmuc: 'S5DM009',
    mota: 'Cây tùng la hán thế trực phong sương, cành lá uốn nắn nghệ thuật, tượng trưng cho chí khí quân tử.',
    img: '/assets/images/bonsai_tung.jpg',
    yeucau: { minT: 15, maxT: 36, doAm: 60, anhSang: 'Toàn phần', loaiDat: 'Đất Akadama nhập khẩu trộn đất sét' }
  },
  {
    macay: 'BS_CAY002',
    tencay: 'Bonsai Mai Vàng Cổ Thụ',
    tenkhoahoc: 'Ochna integerrima',
    gia: 3800000,
    danhmuc: 'S5DM009',
    mota: 'Gốc mai xù xì hơn 20 năm tuổi, dáng bay mềm mại, đơm hoa vàng rực rỡ đón xuân.',
    img: '/assets/images/bonsai_mai.jpg',
    yeucau: { minT: 20, maxT: 38, doAm: 65, anhSang: 'Toàn phần', loaiDat: 'Đất phù sa trộn phân trùn quế' }
  },
  {
    macay: 'BS_CAY003',
    tencay: 'Bonsai Linh Sam Sông Hinh',
    tenkhoahoc: 'Antidesma acidum',
    gia: 1850000,
    danhmuc: 'S5DM009',
    mota: 'Lũa thép tự nhiên độc đáo, hoa màu tím biếc thơm dịu, được giới chơi cây cảnh đánh giá cực cao.',
    img: '/assets/images/bonsai_tung.jpg',
    yeucau: { minT: 16, maxT: 38, doAm: 55, anhSang: 'Toàn phần', loaiDat: 'Đất cát sỏi sa mạc pha mùn' }
  },
  {
    macay: 'BS_CAY004',
    tencay: 'Bonsai Si Cổ Dáng Huyền',
    tenkhoahoc: 'Ficus microcarpa',
    gia: 1600000,
    danhmuc: 'S5DM009',
    mota: 'Thân buông rễ phụ rủ xuống chậu men cổ tích, tạo cảm giác uy nghiêm trường thọ.',
    img: '/assets/images/bonsai_mai.jpg',
    yeucau: { minT: 18, maxT: 38, doAm: 70, anhSang: 'Bán râm', loaiDat: 'Đất thịt nặng giữ ẩm' }
  },

  // S5DM011: Cây hoa trang trí
  {
    macay: 'HT_CAY001',
    tencay: 'Lan Hồ Điệp Tím Hoàng Gia',
    tenkhoahoc: 'Phalaenopsis amabilis',
    gia: 280000,
    danhmuc: 'S5DM011',
    mota: 'Cành hoa cong vút quý phái với 10-12 bông hoa tím đậm sang trọng, độ bền tươi hoa trên 2 tháng.',
    img: '/assets/images/hoa_lan.jpg',
    yeucau: { minT: 18, maxT: 28, doAm: 70, anhSang: 'Bán râm', loaiDat: 'Dớn trắng New Zealand hoặc vỏ thông' }
  },
  {
    macay: 'HT_CAY002',
    tencay: 'Hoa Hồng Cổ Sa Pa Trồng Chậu',
    tenkhoahoc: 'Rosa chinensis Sapa',
    gia: 250000,
    danhmuc: 'S5DM011',
    mota: 'Giống hồng cổ Pháp thuần hóa Sa Pa, form hoa cánh cúp duyên dáng, hương thơm nồng nàn quyến rũ.',
    img: '/assets/images/hoa_hong.jpg',
    yeucau: { minT: 15, maxT: 32, doAm: 65, anhSang: 'Toàn phần', loaiDat: 'Đất hữu cơ giàu mùn giun quế' }
  },
  {
    macay: 'HT_CAY003',
    tencay: 'Hoa Cẩm Tú Cầu Đà Lạt',
    tenkhoahoc: 'Hydrangea macrophylla',
    gia: 190000,
    danhmuc: 'S5DM011',
    mota: 'Đóa hoa cầu tròn sắc xanh lam thanh nhã, đổi màu theo độ pH của đất, làm sáng bừng góc phòng.',
    img: '/assets/images/hoa_lan.jpg',
    yeucau: { minT: 15, maxT: 26, doAm: 75, anhSang: 'Bán râm', loaiDat: 'Đất chua nhẹ thoáng khí' }
  },
  {
    macay: 'HT_CAY004',
    tencay: 'Hoa Trạng Nguyên Đỏ May Mắn',
    tenkhoahoc: 'Euphorbia pulcherrima',
    gia: 140000,
    danhmuc: 'S5DM011',
    mota: 'Lá bắc đỏ thắm rực rỡ báo hiệu mùa thi cử đỗ đạt thành danh và mang lại tài lộc cho gia đình.',
    img: '/assets/images/hoa_hong.jpg',
    yeucau: { minT: 16, maxT: 30, doAm: 60, anhSang: 'Bán râm', loaiDat: 'Đất tơi xốp hữu cơ' }
  },

  // S5DM012: Chậu cây làm quà
  {
    macay: 'QT_CAY001',
    tencay: 'Chậu Cây May Mắn Cỏ Đồng Tiền',
    tenkhoahoc: 'Hydrocotyle verticillata Gift',
    gia: 110000,
    danhmuc: 'S5DM012',
    mota: 'Chậu sứ vẽ tay chứa cỏ đồng tiền xanh mướt, món quà ý nghĩa chúc bình an, may mắn và thịnh vượng.',
    img: '/assets/images/chau_cay_qua_tang.jpg',
    yeucau: { minT: 16, maxT: 35, doAm: 70, anhSang: 'Trong nhà', loaiDat: 'Đất ẩm hoặc thủy sinh bán cạn' }
  },
  {
    macay: 'QT_CAY002',
    tencay: 'Set Sen Đá Hộp Gỗ Quà Tặng VIP',
    tenkhoahoc: 'Succulent Gift Box',
    gia: 290000,
    danhmuc: 'S5DM012',
    mota: 'Hộp gỗ mộc mạc kết hợp 5 loại sen đá mọng nước rực rỡ, kèm thiệp chúc mừng thiết kế thủ công tinh xảo.',
    img: '/assets/images/sen_da_hong.jpg',
    yeucau: { minT: 15, maxT: 32, doAm: 50, anhSang: 'Bán râm', loaiDat: 'Xỉ than pha đá perlite' }
  },
  {
    macay: 'QT_CAY003',
    tencay: 'Chậu Cẩm Nhung Fittonia Đỏ Mini',
    tenkhoahoc: 'Fittonia albivenis Gift',
    gia: 95000,
    danhmuc: 'S5DM012',
    mota: 'Gân lá đỏ nổi bật trên nền xanh, biểu tượng của tình bạn bền chặt và sự quan tâm tinh tế.',
    img: '/assets/images/cam_nhung.jpg',
    yeucau: { minT: 18, maxT: 30, doAm: 75, anhSang: 'Trong nhà', loaiDat: 'Đất ẩm xốp giàu dinh dưỡng' }
  },
  {
    macay: 'QT_CAY004',
    tencay: 'Chậu Cây Hạnh Phúc Để Bàn Quà Tặng',
    tenkhoahoc: 'Radermachera sinica Gift',
    gia: 220000,
    danhmuc: 'S5DM012',
    mota: 'Lá xanh mướt óng ả, cây mang thông điệp cầu chúc niềm vui, hạnh phúc ngập tràn cho người nhận.',
    img: '/assets/images/cay_van_phong.jpg',
    yeucau: { minT: 18, maxT: 32, doAm: 65, anhSang: 'Trong nhà', loaiDat: 'Đất mùn dừa vi sinh' }
  }
];

async function updateDatabase() {
  console.log('2. Updating plant photos & populating empty categories in PostgreSQL...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert new plants for empty categories
    console.log(`   Inserting ${newPlants.length} plants for empty categories...`);
    for (const p of newPlants) {
      // CayCanh
      await client.query(`
        INSERT INTO caycanh (macay, tencay, tenkhoahoc, motakichthuoc, giaban, mota, huongdanchamsoc, khoiluongkg, trangthai, daxuatban, madanhmuc)
        VALUES ($1, $2, $3, 'Cao 25-60cm, tán rộng 20-40cm', $4, $5, 'Tưới nước vừa phải 2-3 lần/tuần, bón phân NPK định kỳ hàng tháng.', 1.5, 'Active', true, $6)
        ON CONFLICT (macay) DO UPDATE SET 
          tencay = EXCLUDED.tencay,
          giaban = EXCLUDED.giaban,
          madanhmuc = EXCLUDED.madanhmuc,
          trangthai = 'Active',
          daxuatban = true
      `, [p.macay, p.tencay, p.tenkhoahoc, p.gia, p.mota, p.danhmuc]);

      // YeuCauSinhTruong
      await client.query(`
        INSERT INTO yeucausinhtruong (mayeucau, nhietdotoithieu, nhietdotoida, doamtoiuu, yeucauanhsang, loaidat, macay)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (macay) DO UPDATE SET
          nhietdotoithieu = EXCLUDED.nhietdotoithieu,
          nhietdotoida = EXCLUDED.nhietdotoida,
          doamtoiuu = EXCLUDED.doamtoiuu,
          yeucauanhsang = EXCLUDED.yeucauanhsang,
          loaidat = EXCLUDED.loaidat
      `, [
        `YC_${p.macay}`,
        p.yeucau.minT,
        p.yeucau.maxT,
        p.yeucau.doAm,
        p.yeucau.anhSang,
        p.yeucau.loaiDat,
        p.macay
      ]);

      // TapTinTruyenThong
      await client.query(`
        INSERT INTO taptintruyenthong (matruyenthong, loaitruyenthong, duongdantaptin, dungluongbyte, laanhchinh, macay)
        VALUES ($1, 'image', $2, 180000, true, $3)
        ON CONFLICT (matruyenthong) DO UPDATE SET duongdantaptin = EXCLUDED.duongdantaptin
      `, [`MED_${p.macay}`, p.img, p.macay]);

      // TonKho in nurseries
      const nurseryRes = await client.query('SELECT mavuonuom FROM vuonuom LIMIT 5');
      const nurseryList = nurseryRes.rows.map(r => r.mavuonuom);
      for (let i = 0; i < nurseryList.length; i++) {
        const vu = nurseryList[i];
        await client.query(`
          INSERT INTO tonkho (matonkho, soluongton, soluongtamgiu, lancapnhatcuoi, mavuonuom, macay)
          VALUES ($1, 20 + ($2 * 5), 0, NOW(), $3, $4)
          ON CONFLICT (matonkho) DO NOTHING
        `, [`TK_${p.macay}_${vu}`, i, vu, p.macay]);
      }
    }

    // 2. Re-assign photo for ALL plants in database to accurate, distinct images
    console.log('   Re-mapping photos for all existing plants to accurate botanical photos...');
    const allPlants = await client.query('SELECT macay, tencay, madanhmuc FROM caycanh');
    for (const plant of allPlants.rows) {
      const accuratePhoto = getPhotoForPlant(plant.tencay, plant.madanhmuc);
      
      const media = await client.query('SELECT matruyenthong FROM taptintruyenthong WHERE macay = $1', [plant.macay]);
      if (media.rows.length === 0) {
        await client.query(`
          INSERT INTO taptintruyenthong (matruyenthong, loaitruyenthong, duongdantaptin, dungluongbyte, laanhchinh, macay)
          VALUES ($1, 'image', $2, 180000, true, $3)
        `, [`MED_${plant.macay}`, accuratePhoto, plant.macay]);
      } else {
        await client.query(`
          UPDATE taptintruyenthong
          SET duongdantaptin = $1, laanhchinh = true
          WHERE macay = $2
        `, [accuratePhoto, plant.macay]);
      }
    }

    await client.query('COMMIT');
    console.log(`   ✓ Successfully updated database with real photos and filled all 12 categories!`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database update failed:', err);
    throw err;
  } finally {
    client.release();
  }
}

async function run() {
  await downloadImages();
  await updateDatabase();
}

run()
  .then(() => {
    console.log('ALL DONE! Botanical images and categories updated.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  });
