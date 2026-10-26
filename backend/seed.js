const bcrypt = require("bcryptjs");
const { pool } = require("./config/db");

async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log(
      "--- Cleaning existing data in correct FK dependency order ---",
    );
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

    const hashedPassword = await bcrypt.hash("123456", 10);
    const now = new Date();

    console.log("--- 1. Seeding NguoiDung ---");
    const users = [
      {
        ma: "USR_ADMIN_01",
        user: "admin",
        email: "admin@tmcaycanh.vn",
        phone: "0901111111",
        name: "Quản Trị Viên Hệ Thống",
        role: "Admin",
      },
      {
        ma: "USR_STAFF_01",
        user: "staff01",
        email: "staff@tmcaycanh.vn",
        phone: "0902222222",
        name: "Trần Văn Kiểm Duyệt",
        role: "Staff",
      },
      {
        ma: "USR_SUPP_01",
        user: "saigonbonsai",
        email: "supplier@saigonbonsai.vn",
        phone: "0903333333",
        name: "Vườn Kiểng Sài Gòn Bonsai",
        role: "Supplier",
      },
      {
        ma: "USR_SUPP_02",
        user: "dalatflora",
        email: "supplier2@dalatflora.vn",
        phone: "0904444444",
        name: "Trang Trại Hoa & Cây Đà Lạt",
        role: "Supplier",
      },
      {
        ma: "USR_CUST_01",
        user: "customer01",
        email: "customer@gmail.com",
        phone: "0905555555",
        name: "Nguyễn Văn Khách Hàng",
        role: "Customer",
      },
      {
        ma: "USR_CUST_02",
        user: "huonggiang",
        email: "huonggiang@gmail.com",
        phone: "0906666666",
        name: "Lê Hương Giang",
        role: "Customer",
      },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO nguoidung (manguoidung, tendangnhap, matkhaumahoa, email, sodienthoai, hoten, vaitro, daxacthuc, trangthai, ngaytao)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          u.ma,
          u.user,
          hashedPassword,
          u.email,
          u.phone,
          u.name,
          u.role,
          true,
          "Active",
          now,
        ],
      );
    }

    console.log("--- 2. Seeding NhaCungCap ---");
    const suppliers = [
      {
        ma: "NCC_01",
        ten: "Công Ty Cổ Phần Sài Gòn Bonsai & Cảnh Quan",
        mst: "0312456789",
        phone: "0903333333",
        email: "supplier@saigonbonsai.vn",
        rating: 4.9,
      },
      {
        ma: "NCC_02",
        ten: "Hợp Tác Xã Sinh Vật Cảnh Đà Lạt Xanh",
        mst: "5801239876",
        phone: "0904444444",
        email: "supplier2@dalatflora.vn",
        rating: 4.8,
      },
      {
        ma: "NCC_03",
        ten: "Vườn Ươm Cây Giống & Hoa Kiểng Chợ Lách Bến Tre",
        mst: "1300998877",
        phone: "0907778899",
        email: "cholach.plants@gmail.com",
        rating: 4.7,
      },
    ];

    for (const s of suppliers) {
      await client.query(
        `INSERT INTO nhacungcap (manhacungcap, tencongty, masothue, sodienthoailienhe, emaillienhe, diemuytin)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [s.ma, s.ten, s.mst, s.phone, s.email, s.rating],
      );
    }

    console.log("--- 3. Seeding DanhMuc ---");
    const categories = [
      {
        ma: "DM_INDOOR",
        ten: "Cây Cảnh Trong Nhà & Văn Phòng",
        mota: "Các loại cây lọc không khí, chịu bóng râm, dễ chăm sóc trong phòng máy lạnh.",
      },
      {
        ma: "DM_BALCONY",
        ten: "Cây Ban Công & Sân Thượng",
        mota: "Các loại cây ưa sáng, chịu nắng tốt, cho hoa rực rỡ và leo giàn.",
      },
      {
        ma: "DM_BONSAI",
        ten: "Bonsai & Cây Phong Thủy Nghệ Thuật",
        mota: "Tác phẩm cây thế bonsai lâu năm mang ý nghĩa tài lộc, bình an, trường thọ.",
      },
      {
        ma: "DM_LANDSCAPE",
        ten: "Cây Công Trình & Sân Vườn Biệt Thự",
        mota: "Cây bóng mát, cây tán lớn, phủ xanh cảnh quan đô thị và sân vườn cao cấp.",
      },
      {
        ma: "DM_DESK",
        ten: "Cây Để Bàn & Sen Đá - Xương Rồng",
        mota: "Cây mini xinh xắn trang trí bàn làm việc, hút bức xạ điện tử.",
      },
    ];

    for (const c of categories) {
      await client.query(
        `INSERT INTO danhmuc (madanhmuc, tendanhmuc, mota) VALUES ($1, $2, $3)`,
        [c.ma, c.ten, c.mota],
      );
    }

    console.log("--- 4. Seeding DiaChiGiaoHang ---");
    const addresses = [
      {
        ma: "DC_01",
        ten: "Nguyễn Văn Khách Hàng",
        phone: "0905555555",
        diachi: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        vido: 10.7745,
        kinhdo: 106.7032,
        macdinh: true,
        user: "USR_CUST_01",
      },
      {
        ma: "DC_02",
        ten: "Lê Hương Giang",
        phone: "0906666666",
        diachi: "45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        vido: 10.7812,
        kinhdo: 106.6998,
        macdinh: true,
        user: "USR_CUST_02",
      },
      {
        ma: "DC_03",
        ten: "Nguyễn Văn Khách Hàng",
        phone: "0905555555",
        diachi:
          "Khu Đô Thị Sala, Phường An Lợi Đông, TP. Thủ Đức, TP. Hồ Chí Minh",
        vido: 10.7681,
        kinhdo: 106.7214,
        macdinh: false,
        user: "USR_CUST_01",
      },
    ];

    for (const a of addresses) {
      await client.query(
        `INSERT INTO diachigiaohang (madiachi, tennguoinhan, sodienthoainguoinhan, diachichitiet, vido, kinhdo, macdinh, manguoidung)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [a.ma, a.ten, a.phone, a.diachi, a.vido, a.kinhdo, a.macdinh, a.user],
      );
    }

    console.log("--- 5. Seeding VuonUom ---");
    const nurseries = [
      {
        ma: "VU_01",
        ten: "Vườn Ươm Cây Kiểng Sài Gòn Xanh (Quận 12)",
        diachi: "158 Hà Huy Giáp, Phường Thạnh Lộc, Quận 12, TP. Hồ Chí Minh",
        vido: 10.8672,
        kinhdo: 106.6853,
        radius: 45.0,
        minStock: 5,
        rating: 4.9,
        status: "Active",
        ncc: "NCC_01",
      },
      {
        ma: "VU_02",
        ten: "Trung Tâm Bonsai & Cảnh Quan Thủ Đức",
        diachi:
          "24 Đường số 8, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh",
        vido: 10.8523,
        kinhdo: 106.7712,
        radius: 35.0,
        minStock: 3,
        rating: 4.8,
        status: "Active",
        ncc: "NCC_01",
      },
      {
        ma: "VU_03",
        ten: "Trại Ươm Cây Giống & Hoa Cao Nguyên Đà Lạt",
        diachi: "Vạn Thành, Phường 5, TP. Đà Lạt, Tỉnh Lâm Đồng",
        vido: 11.9404,
        kinhdo: 108.4182,
        radius: 120.0,
        minStock: 10,
        rating: 4.9,
        status: "Active",
        ncc: "NCC_02",
      },
      {
        ma: "VU_04",
        ten: "Vườn Cây Ăn Quả & Kiểng Chợ Lách",
        diachi: "Thị trấn Chợ Lách, Huyện Chợ Lách, Tỉnh Bến Tre",
        vido: 10.2541,
        kinhdo: 106.1265,
        radius: 80.0,
        minStock: 8,
        rating: 4.7,
        status: "Active",
        ncc: "NCC_03",
      },
    ];

    for (const v of nurseries) {
      await client.query(
        `INSERT INTO vuonuom (mavuonuom, tenvuonuom, diachi, vido, kinhdo, bankinhgiaotoidakm, nguongtonkhotoithieu, danhgianhacungcap, trangthai, manhacungcap)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          v.ma,
          v.ten,
          v.diachi,
          v.vido,
          v.kinhdo,
          v.radius,
          v.minStock,
          v.rating,
          v.status,
          v.ncc,
        ],
      );
    }

    console.log("--- 6. Seeding CayCanh & YeuCauSinhTruong ---");
    const plants = [
      {
        ma: "CAY_KIM_TIEN",
        ten: "Cây Kim Tiền (Kim Phát Tài)",
        tenKhoaHoc: "Zamioculcas zamiifolia",
        kichThuoc: "Chiều cao 60-80cm, tán rộng 45cm",
        gia: 350000,
        mota: "Cây Kim Tiền có lá xanh mướt mập mạp, sinh trưởng tốt trong bóng râm, biểu tượng của sự may mắn, thịnh vượng và tiền tài.",
        chamSoc:
          "Tưới nước 1 tuần/lần. Tránh để ngập úng gốc. Lau lá định kỳ bằng khăn mềm để lá luôn quang hợp tốt.",
        khoiLuong: 4.5,
        trangThai: "Active",
        daXuatBan: true,
        danhMuc: "DM_INDOOR",
        growth: {
          minTemp: 18,
          maxTemp: 35,
          doAm: 60,
          anhSang: "Trong nhà",
          loaiDat: "Đất tơi xốp, thoát nước tốt pha mùn dừa",
        },
      },
      {
        ma: "CAY_LUOI_HO",
        ten: "Cây Lưỡi Hổ Hoàng Kim",
        tenKhoaHoc: "Sansevieria trifasciata Laurentii",
        kichThuoc: "Chiều cao 50-70cm",
        gia: 280000,
        mota: "Khả năng thanh lọc độc tố formaldehyde và giải phóng oxy vào ban đêm vượt trội, viền vàng rực rỡ phong thủy xua đuổi tà khí.",
        chamSoc:
          "Chịu hạn cực tốt, chỉ tưới khi đất khô hoàn toàn (10-14 ngày/lần). Đặt nơi thoáng mát có ánh sáng gián tiếp.",
        khoiLuong: 3.2,
        trangThai: "Active",
        daXuatBan: true,
        danhMuc: "DM_INDOOR",
        growth: {
          minTemp: 15,
          maxTemp: 38,
          doAm: 50,
          anhSang: "Trong nhà",
          loaiDat: "Đất cát pha thịt nhẹ thoát nước nhanh",
        },
      },
      {
        ma: "CAY_MONSTERA",
        ten: "Trầu Bà Nam Mỹ Lá Xẻ (Monstera Deliciosa)",
        tenKhoaHoc: "Monstera deliciosa",
        kichThuoc: "Chiều cao 90-120cm, tán lá rộng 70cm",
        gia: 750000,
        mota: "Mệnh danh là hoàng hậu cây nội thất với các phiến lá xẻ độc đáo phong cách Tropical quý phái, tạo không gian sang trọng.",
        chamSoc:
          "Ưa ẩm, phun sương giữ ẩm cho lá. Tưới 2-3 lần/tuần khi lớp đất mặt hơi khô. Ánh sáng tán xạ.",
        khoiLuong: 6.8,
        trangThai: "Active",
        daXuatBan: true,
        danhMuc: "DM_INDOOR",
        growth: {
          minTemp: 20,
          maxTemp: 32,
          doAm: 75,
          anhSang: "Bán râm",
          loaiDat: "Hỗn hợp xơ dừa, perlite, peatmoss giàu dinh dưỡng",
        },
      },
      {
        ma: "CAY_HOA_GIAY",
        ten: "Hoa Giấy Cẩm Thạch Ngũ Sắc",
        tenKhoaHoc: "Bougainvillea spectabilis variegata",
        kichThuoc: "Chiều cao 1.5m, gốc bonsai 10cm",
        gia: 1250000,
        mota: "Cây ghép 5 màu rực rỡ, lá cẩm thạch độc đáo, ưa nắng gắt ban công sân thượng, siêng hoa quanh năm.",
        chamSoc:
          "Cần nắng trực tiếp ít nhất 6 tiếng/ngày. Tưới đẫm mỗi ngày vào sáng sớm. Bón NPK kích hoa sau mỗi đợt tàn.",
        khoiLuong: 12.0,
        trangThai: "Active",
        daXuatBan: true,
        danhMuc: "DM_BALCONY",
        growth: {
          minTemp: 22,
          maxTemp: 40,
          doAm: 55,
          anhSang: "Toàn phần",
          loaiDat: "Đất đỏ bazan hoặc đất thịt pha trấu hun",
        },
      },
      {
        ma: "CAY_TUNG_LA_HAN",
        ten: "Tùng La Hán Bonsai Cổ Thụ Dáng Trực",
        tenKhoaHoc: "Podocarpus macrophyllus",
        kichThuoc: "Chiều cao 1.8m, hoành gốc 28cm, tuổi thọ 25 năm",
        gia: 18500000,
        mota: "Kiệt tác bonsai thế Quân Tử vững chãi, biểu tượng của sự trường thọ, uy nghi và khí phách kiên cường của gia chủ.",
        chamSoc:
          "Cắt tỉa lá dăm định kỳ 3 tháng/lần. Giữ ẩm vừa phải, đất phải thoát nước cực nhanh, bón phân hữu cơ vi sinh.",
        khoiLuong: 45.0,
        trangThai: "Active",
        daXuatBan: true,
        danhMuc: "DM_BONSAI",
        growth: {
          minTemp: 16,
          maxTemp: 35,
          doAm: 65,
          anhSang: "Toàn phần",
          loaiDat: "Đất phù sa trộn xỉ than, đất akadama Nhật Bản",
        },
      },
      {
        ma: "CAY_LOC_VUNG",
        ten: "Lộc Vừng Cảnh Quan Tán Tròn",
        tenKhoaHoc: "Barringtonia acutangula",
        kichThuoc: "Chiều cao 2.5m, đường kính thân 15cm",
        gia: 4200000,
        mota: "Nằm trong bộ tứ quý Sanh - Sung - Tùng - Lộc, hoa buông dài đỏ thắm ngát hương, mang lại thịnh vượng cho khuôn viên biệt thự.",
        chamSoc:
          "Ưa ẩm và nước, có thể trồng ven hồ cá. Tưới ngày 2 lần vào mùa khô. Chăm sóc sâu đục thân hàng năm.",
        khoiLuong: 55.0,
        trangThai: "Active",
        daXuatBan: true,
        danhMuc: "DM_LANDSCAPE",
        growth: {
          minTemp: 18,
          maxTemp: 38,
          doAm: 80,
          anhSang: "Toàn phần",
          loaiDat: "Đất thịt nặng, đất phù sa bồi lắng giữ ẩm",
        },
      },
      {
        ma: "CAY_SEN_DA_NGOC",
        ten: "Sen Đá Kim Cương Dạ Quang Mini",
        tenKhoaHoc: "Haworthia cooperi var. truncata",
        kichThuoc: "Đường kính 8cm, chậu gốm mộc 10cm",
        gia: 95000,
        mota: "Các múi lá mọng nước trong suốt như pha lê, hấp thụ tia bức xạ từ màn hình máy tính và thiết bị điện thoại cực tốt.",
        chamSoc:
          "Tưới thấm ngược 1 tuần/lần. Đặt cạnh cửa sổ có ánh sáng nhẹ buổi sáng. Đất phải thoát nước tức thì.",
        khoiLuong: 0.5,
        trangThai: "Active",
        daXuatBan: true,
        danhMuc: "DM_DESK",
        growth: {
          minTemp: 16,
          maxTemp: 30,
          doAm: 45,
          anhSang: "Bán râm",
          loaiDat: "Hỗn hợp pumice, perlite, akadama chuyên sen đá",
        },
      },
      {
        ma: "CAY_VAN_NIEN_THANH",
        ten: "Vạn Niên Thanh Leo Cột Phú Quý",
        tenKhoaHoc: "Epipremnum aureum",
        kichThuoc: "Chiều cao 1.4m, cột xơ dừa",
        gia: 480000,
        mota: "Lá to bản có vệt vàng kim sang trọng, lọc khói bụi và khí độc cực mạnh, mang sinh khí dồi dào cho văn phòng.",
        chamSoc:
          "Tưới nước vào cả gốc và trụ xơ dừa 2 lần/tuần. Lau lá để giữ độ bóng mượt. Không để dưới ánh nắng gay gắt.",
        khoiLuong: 7.5,
        trangThai: "Active",
        daXuatBan: true,
        danhMuc: "DM_INDOOR",
        growth: {
          minTemp: 18,
          maxTemp: 34,
          doAm: 70,
          anhSang: "Trong nhà",
          loaiDat: "Đất tơi xốp trộn mùn cưa và trấu hun",
        },
      },
    ];

    let reqIndex = 1;
    for (const p of plants) {
      await client.query(
        `INSERT INTO caycanh (macay, tencay, tenkhoahoc, motakichthuoc, giaban, mota, huongdanchamsoc, khoiluongkg, trangthai, daxuatban, madanhmuc)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          p.ma,
          p.ten,
          p.tenKhoaHoc,
          p.kichThuoc,
          p.gia,
          p.mota,
          p.chamSoc,
          p.khoiLuong,
          p.trangThai,
          p.daXuatBan,
          p.danhMuc,
        ],
      );

      const maYeuCau = `YC_${String(reqIndex).padStart(2, "0")}`;
      reqIndex++;
      await client.query(
        `INSERT INTO yeucausinhtruong (mayeucau, nhietdotoithieu, nhietdotoida, doamtoiuu, yeucauanhsang, loaidat, macay)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          maYeuCau,
          p.growth.minTemp,
          p.growth.maxTemp,
          p.growth.doAm,
          p.growth.anhSang,
          p.growth.loaiDat,
          p.ma,
        ],
      );
    }

    console.log("--- 7. Seeding TonKho ---");
    const stocks = [
      { ma: "TK_01", vuon: "VU_01", cay: "CAY_KIM_TIEN", ton: 25, tamGiu: 2 },
      { ma: "TK_02", vuon: "VU_01", cay: "CAY_LUOI_HO", ton: 40, tamGiu: 0 },
      { ma: "TK_03", vuon: "VU_01", cay: "CAY_MONSTERA", ton: 15, tamGiu: 1 },
      {
        ma: "TK_04",
        vuon: "VU_01",
        cay: "CAY_VAN_NIEN_THANH",
        ton: 18,
        tamGiu: 0,
      },
      { ma: "TK_05", vuon: "VU_02", cay: "CAY_HOA_GIAY", ton: 12, tamGiu: 0 },
      { ma: "TK_06", vuon: "VU_02", cay: "CAY_TUNG_LA_HAN", ton: 4, tamGiu: 0 },
      { ma: "TK_07", vuon: "VU_02", cay: "CAY_LOC_VUNG", ton: 6, tamGiu: 1 },
      {
        ma: "TK_08",
        vuon: "VU_03",
        cay: "CAY_SEN_DA_NGOC",
        ton: 120,
        tamGiu: 5,
      },
      { ma: "TK_09", vuon: "VU_03", cay: "CAY_MONSTERA", ton: 30, tamGiu: 0 },
      { ma: "TK_10", vuon: "VU_04", cay: "CAY_HOA_GIAY", ton: 28, tamGiu: 2 },
      { ma: "TK_11", vuon: "VU_04", cay: "CAY_KIM_TIEN", ton: 35, tamGiu: 0 },
    ];

    for (const tk of stocks) {
      await client.query(
        `INSERT INTO tonkho (matonkho, soluongton, soluongtamgiu, lancapnhatcuoi, mavuonuom, macay)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [tk.ma, tk.ton, tk.tamGiu, now, tk.vuon, tk.cay],
      );
    }

    console.log(
      "--- 8. Seeding TaptinTruyenThong (Curated Botanical Images) ---",
    );
    const media = [
      {
        ma: "MED_01",
        loai: "image",
        url: "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80",
        dungLuong: 245000,
        laAnhChinh: true,
        cay: "CAY_KIM_TIEN",
      },
      {
        ma: "MED_02",
        loai: "image",
        url: "https://images.unsplash.com/photo-1599598425947-3206fb5df3e5?auto=format&fit=crop&w=800&q=80",
        dungLuong: 198000,
        laAnhChinh: true,
        cay: "CAY_LUOI_HO",
      },
      {
        ma: "MED_03",
        loai: "image",
        url: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80",
        dungLuong: 310000,
        laAnhChinh: true,
        cay: "CAY_MONSTERA",
      },
      {
        ma: "MED_04",
        loai: "image",
        url: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?auto=format&fit=crop&w=800&q=80",
        dungLuong: 280000,
        laAnhChinh: true,
        cay: "CAY_HOA_GIAY",
      },
      {
        ma: "MED_05",
        loai: "image",
        url: "https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=800&q=80",
        dungLuong: 420000,
        laAnhChinh: true,
        cay: "CAY_TUNG_LA_HAN",
      },
      {
        ma: "MED_06",
        loai: "image",
        url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80",
        dungLuong: 350000,
        laAnhChinh: true,
        cay: "CAY_LOC_VUNG",
      },
      {
        ma: "MED_07",
        loai: "image",
        url: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&w=800&q=80",
        dungLuong: 150000,
        laAnhChinh: true,
        cay: "CAY_SEN_DA_NGOC",
      },
      {
        ma: "MED_08",
        loai: "image",
        url: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=800&q=80",
        dungLuong: 260000,
        laAnhChinh: true,
        cay: "CAY_VAN_NIEN_THANH",
      },
    ];

    for (const m of media) {
      await client.query(
        `INSERT INTO taptintruyenthong (matruyenthong, loaitruyenthong, duongdantaptin, dungluongbyte, laanhchinh, macay)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [m.ma, m.loai, m.url, m.dungLuong, m.laAnhChinh, m.cay],
      );
    }

    console.log("--- 9. Seeding DonHang & ChiTietDonHang ---");
    // Order 1: Completed order with health photo and review (, , )
    const dh1Date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO donhang (madonhang, ngaydathang, tongtien, phivanchuyen, khoangcachkm, phuongthucthanhtoan, trangthaithanhtoan, trangthaidonhang, tamgiuden, daxacnhansuckhoe, anhsuckhoeurl, manguoidung, madiachi, mavuonuom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        "DH_001",
        dh1Date,
        1050000,
        45000,
        12.4,
        "VNPAY",
        "DaThanhToan",
        "DaHoanThanh",
        null,
        true,
        "https://images.unsplash.com/photo-1599598425947-3206fb5df3e5?auto=format&fit=crop&w=400&q=80",
        "USR_CUST_01",
        "DC_01",
        "VU_01",
      ],
    );

    await client.query(
      `INSERT INTO chitietdonhang (machitietdonhang, soluong, dongia, thanhtien, madonhang, macay)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ["CTDH_001_1", 2, 350000, 700000, "DH_001", "CAY_KIM_TIEN"],
    );

    await client.query(
      `INSERT INTO chitietdonhang (machitietdonhang, soluong, dongia, thanhtien, madonhang, macay)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ["CTDH_001_2", 1, 280000, 280000, "DH_001", "CAY_LUOI_HO"],
    );

    // Order 2: In-transit order (DangGiaoHang) with confirmed health ()
    const dh2Date = new Date(Date.now() - 6 * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO donhang (madonhang, ngaydathang, tongtien, phivanchuyen, khoangcachkm, phuongthucthanhtoan, trangthaithanhtoan, trangthaidonhang, tamgiuden, daxacnhansuckhoe, anhsuckhoeurl, manguoidung, madiachi, mavuonuom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        "DH_002",
        dh2Date,
        790000,
        40000,
        9.8,
        "COD",
        "ChuaThanhToan",
        "DangGiaoHang",
        null,
        true,
        "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=400&q=80",
        "USR_CUST_02",
        "DC_02",
        "VU_01",
      ],
    );

    await client.query(
      `INSERT INTO chitietdonhang (machitietdonhang, soluong, dongia, thanhtien, madonhang, macay)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ["CTDH_002_1", 1, 750000, 750000, "DH_002", "CAY_MONSTERA"],
    );

    // Order 3: Pending confirmation order with 15-minute lock (, )
    const dh3Date = new Date();
    const tamGiuDen = new Date(Date.now() + 15 * 60 * 1000);
    await client.query(
      `INSERT INTO donhang (madonhang, ngaydathang, tongtien, phivanchuyen, khoangcachkm, phuongthucthanhtoan, trangthaithanhtoan, trangthaidonhang, tamgiuden, daxacnhansuckhoe, anhsuckhoeurl, manguoidung, madiachi, mavuonuom)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        "DH_003",
        dh3Date,
        4300000,
        100000,
        14.2,
        "VNPAY",
        "ChuaThanhToan",
        "ChoXacNhan",
        tamGiuDen,
        false,
        null,
        "USR_CUST_01",
        "DC_03",
        "VU_02",
      ],
    );

    await client.query(
      `INSERT INTO chitietdonhang (machitietdonhang, soluong, dongia, thanhtien, madonhang, macay)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ["CTDH_003_1", 1, 4200000, 4200000, "DH_003", "CAY_LOC_VUNG"],
    );

    console.log("--- 10. Seeding DanhGia ---");
    await client.query(
      `INSERT INTO danhgia (madanhgia, sosaodanhgia, binhluan, duongdantruyenthong, ngaytao, madonhang, machitietdonhang)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        "DG_001",
        5,
        "Cây Kim Tiền và Lưỡi Hổ nhận được rất tươi tốt, lá xanh bóng mượt, đóng gói cẩn thận bằng khung gỗ chuyên dụng. Shipper giao nhanh và tư vấn nhiệt tình!",
        "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=400&q=80",
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        "DH_001",
        "CTDH_001_1",
      ],
    );

    await client.query("COMMIT");
    console.log(
      "✅ DATABASE SEEDING COMPLETED SUCCESSFULLY WITH ALL 12 TABLES!",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ SEEDING FAILED:", error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
