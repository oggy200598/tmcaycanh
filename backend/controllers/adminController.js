const { pool } = require("../config/db");

/**
 * Get system dashboard statistics and low-stock alerts ()
 */
async function getDashboardStats(req, res) {
  try {
    // 1. Revenue & orders
    const revRes = await pool.query(`
      SELECT 
        COALESCE(SUM(tongtien), 0) AS tongdoanthu,
        COUNT(madonhang) AS tongdonhang,
        COUNT(CASE WHEN trangthaidonhang = 'DaHoanThanh' THEN 1 END) AS dondahoanthanh,
        COUNT(CASE WHEN trangthaidonhang = 'ChoXacNhan' THEN 1 END) AS donchoxacnhan
      FROM donhang
    `);

    // 2. Total counts
    const userRes = await pool.query("SELECT COUNT(*) AS total FROM nguoidung");
    const plantRes = await pool.query(
      "SELECT COUNT(*) AS total FROM caycanh WHERE trangthai = 'Active'",
    );
    const pendingRes = await pool.query(
      "SELECT COUNT(*) AS total FROM caycanh WHERE trangthai = 'Pending'",
    );
    const nurseryRes = await pool.query(
      "SELECT COUNT(*) AS total FROM vuonuom WHERE trangthai = 'Active'",
    );

    // 3. Low stock alerts ()
    const alertRes = await pool.query(`
      SELECT 
        tk.matonkho, tk.soluongton, tk.soluongtamgiu, v.nguongtonkhotoithieu,
        c.tencay, v.tenvuonuom, ncc.tencongty
      FROM tonkho tk
      JOIN vuonuom v ON tk.mavuonuom = v.mavuonuom
      JOIN caycanh c ON tk.macay = c.macay
      JOIN nhacungcap ncc ON v.manhacungcap = ncc.manhacungcap
      WHERE tk.soluongton <= v.nguongtonkhotoithieu
    `);

    res.json({
      success: true,
      data: {
        tongDoanThu: Number(revRes.rows[0].tongdoanthu),
        tongDonHang: Number(revRes.rows[0].tongdonhang),
        donDaHoanThanh: Number(revRes.rows[0].dondahoanthanh),
        donChoXacNhan: Number(revRes.rows[0].donchoxacnhan),
        tongNguoiDung: Number(userRes.rows[0].total),
        tongCayDangBan: Number(plantRes.rows[0].total),
        cayChoDuyet: Number(pendingRes.rows[0].total),
        tongVuonUom: Number(nurseryRes.rows[0].total),
        canhBaoTonKhoThap: alertRes.rows.map((row) => ({
          maTonKho: row.matonkho,
          tenCay: row.tencay,
          tenVuonUom: row.tenvuonuom,
          tenCongTy: row.tencongty,
          soLuongTon: row.soluongton,
          nguongToiThieu: row.nguongtonkhotoithieu,
        })),
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tải thống kê dashboard." },
    });
  }
}

/**
 * Get GIS Heatmap data for completed orders ()
 */
async function getHeatmapData(req, res) {
  try {
    const result = await pool.query(`
      SELECT 
        dc.vido, dc.kinhdo, dc.diachichitiet,
        COUNT(dh.madonhang) AS sodonhang,
        SUM(dh.tongtien) AS tonggiatri,
        AVG(dh.khoangcachkm) AS khoangcachtrungbinh
      FROM donhang dh
      JOIN diachigiaohang dc ON dh.madiachi = dc.madiachi
      WHERE dh.trangthaidonhang = 'DaHoanThanh'
      GROUP BY dc.vido, dc.kinhdo, dc.diachichitiet
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        viDo: Number(row.vido),
        kinhDo: Number(row.kinhdo),
        diaChiChiTiet: row.diachichitiet,
        soDonHang: Number(row.sodonhang),
        tongGiaTri: Number(row.tonggiatri),
        intensity: Math.min(1.0, 0.3 + Number(row.sodonhang) * 0.2),
      })),
    });
  } catch (error) {
    console.error("Heatmap error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tải dữ liệu bản đồ nhiệt." },
    });
  }
}

/**
 * Manage users
 */
async function getUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT manguoidung, tendangnhap, email, sodienthoai, hoten, vaitro, daxacthuc, trangthai, ngaytao
       FROM nguoidung ORDER BY ngaytao DESC`,
    );

    res.json({
      success: true,
      data: result.rows.map((u) => ({
        maNguoiDung: u.manguoidung,
        tenDangNhap: u.tendangnhap,
        email: u.email,
        soDienThoai: u.sodienthoai,
        hoTen: u.hoten,
        vaiTro: u.vaitro,
        daXacThuc: u.daxacthuc,
        trangThai: u.trangthai,
        ngayTao: u.ngaytao,
      })),
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tải danh sách người dùng." },
    });
  }
}

/**
 * Update user status (Active / Locked)
 */
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { trangThai } = req.body;

    if (!["Active", "Locked"].includes(trangThai)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "Trạng thái chỉ có thể là Active hoặc Locked.",
        },
      });
    }

    const result = await pool.query(
      "UPDATE nguoidung SET trangthai = $1 WHERE manguoidung = $2 RETURNING manguoidung, hoten, trangthai",
      [trangThai, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Không tìm thấy người dùng." },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Đã cập nhật trạng thái người dùng thành: ${trangThai}.`,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "Lỗi cập nhật trạng thái người dùng.",
      },
    });
  }
}

/**
 * Get all categories
 */
async function getCategories(req, res) {
  try {
    const result = await pool.query(`
      SELECT dm.madanhmuc, dm.tendanhmuc, dm.mota, COUNT(c.macay) AS socay
      FROM danhmuc dm
      LEFT JOIN caycanh c ON dm.madanhmuc = c.madanhmuc AND c.trangthai = 'Active'
      GROUP BY dm.madanhmuc, dm.tendanhmuc, dm.mota
      ORDER BY dm.madanhmuc
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        maDanhMuc: row.madanhmuc,
        tenDanhMuc: row.tendanhmuc,
        moTa: row.mota,
        soCay: Number(row.socay),
      })),
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tải danh mục." },
    });
  }
}

/**
 * ========================================================
 * ADMIN CRUD: CÂY CẢNH (PLANTS)
 * ========================================================
 */
async function getAdminPlants(req, res) {
  try {
    const result = await pool.query(`
      SELECT c.macay, c.tencay, c.tenkhoahoc, c.motakichthuoc, c.giaban, c.mota, c.huongdanchamsoc, c.khoiluongkg, c.trangthai, c.daxuatban, c.madanhmuc, dm.tendanhmuc,
             t.duongdantaptin as anhchinh,
             y.nhietdotoithieu, y.nhietdotoida, y.doamtoiuu, y.yeucauanhsang, y.loaidat,
             COALESCE(SUM(tk.soluongton), 0) as tongtonkho
      FROM caycanh c
      LEFT JOIN danhmuc dm ON c.madanhmuc = dm.madanhmuc
      LEFT JOIN yeucausinhtruong y ON c.macay = y.macay
      LEFT JOIN (
        SELECT DISTINCT ON (macay) macay, duongdantaptin
        FROM taptintruyenthong
        WHERE laanhchinh = true
        ORDER BY macay, matruyenthong ASC
      ) t ON c.macay = t.macay
      LEFT JOIN tonkho tk ON c.macay = tk.macay
      GROUP BY c.macay, c.tencay, c.tenkhoahoc, c.motakichthuoc, c.giaban, c.mota, c.huongdanchamsoc, c.khoiluongkg, c.trangthai, c.daxuatban, c.madanhmuc, dm.tendanhmuc, t.duongdantaptin, y.nhietdotoithieu, y.nhietdotoida, y.doamtoiuu, y.yeucauanhsang, y.loaidat
      ORDER BY c.macay DESC
    `);

    res.json({
      success: true,
      data: result.rows.map((p) => ({
        maCay: p.macay,
        tenCay: p.tencay,
        tenKhoaHoc: p.tenkhoahoc,
        moTaKichThuoc: p.motakichthuoc,
        giaBan: Number(p.giaban),
        moTa: p.mota,
        huongDanChamSoc: p.huongdanchamsoc,
        khoiLuongKg: Number(p.khoiluongkg || 1.0),
        trangThai: p.trangthai,
        daXuatBan: p.daxuatban,
        maDanhMuc: p.madanhmuc,
        tenDanhMuc: p.tendanhmuc,
        anhChinh: p.anhchinh || "/assets/images/cay_van_phong.jpg",
        tongTonKho: Number(p.tongtonkho || 0),
        growthRequirement: {
          nhietDoToiThieu: Number(p.nhietdotoithieu || 18),
          nhietDoToiDa: Number(p.nhietdotoida || 35),
          doAmToiUu: Number(p.doamtoiuu || 65),
          yeuCauAnhSang: p.yeucauanhsang || "Bán râm",
          loaiDat: p.loaidat || "Đất hữu cơ tơi xốp",
        },
      })),
    });
  } catch (error) {
    console.error("Admin get plants error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi tải danh sách cây cảnh." } });
  }
}

async function createAdminPlant(req, res) {
  const client = await pool.connect();
  try {
    const {
      maCay,
      tenCay,
      tenKhoaHoc,
      moTaKichThuoc,
      giaBan,
      moTa,
      huongDanChamSoc,
      khoiLuongKg,
      maDanhMuc,
      trangThai,
      daXuatBan,
      hinhAnhUrl,
      growthRequirement,
    } = req.body;

    if (!tenCay || !giaBan || !maDanhMuc) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Tên cây, giá bán và danh mục là bắt buộc." },
      });
    }

    await client.query("BEGIN");
    const plantId = maCay || `CAY_${Date.now()}`;
    const status = trangThai || "Active";
    const published = daXuatBan !== undefined ? daXuatBan : true;

    await client.query(
      `INSERT INTO caycanh (macay, tencay, tenkhoahoc, motakichthuoc, giaban, mota, huongdanchamsoc, khoiluongkg, trangthai, daxuatban, madanhmuc)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        plantId,
        tenCay,
        tenKhoaHoc || "",
        moTaKichThuoc || "Kích thước tiêu chuẩn",
        Number(giaBan),
        moTa || "",
        huongDanChamSoc || "Tưới nước đều đặn, tránh nắng gắt trực tiếp.",
        Number(khoiLuongKg || 1.0),
        status,
        published,
        maDanhMuc,
      ]
    );

    // YeuCauSinhTruong
    const gr = growthRequirement || {};
    await client.query(
      `INSERT INTO yeucausinhtruong (mayeucau, nhietdotoithieu, nhietdotoida, doamtoiuu, yeucauanhsang, loaidat, macay)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `YC_${Date.now()}`,
        Number(gr.nhietDoToiThieu || 18),
        Number(gr.nhietDoToiDa || 35),
        Number(gr.doAmToiUu || 65),
        gr.yeuCauAnhSang || "Bán râm",
        gr.loaiDat || "Đất vi sinh tơi xốp",
        plantId,
      ]
    );

    // TapTinTruyenThong
    const img = hinhAnhUrl || "/assets/images/cay_van_phong.jpg";
    await client.query(
      `INSERT INTO taptintruyenthong (matruyenthong, loaitruyenthong, duongdantaptin, dungluongbyte, laanhchinh, macay)
       VALUES ($1, 'image', $2, 180000, true, $3)`,
      [`MED_${Date.now()}`, img, plantId]
    );

    // TonKho initial distribution
    const firstNursery = await client.query("SELECT mavuonuom FROM vuonuom LIMIT 1");
    if (firstNursery.rows.length > 0) {
      await client.query(
        `INSERT INTO tonkho (matonkho, soluongton, soluongtamgiu, lancapnhatcuoi, mavuonuom, macay)
         VALUES ($1, 20, 0, NOW(), $2, $3)`,
        [`TK_${Date.now()}`, firstNursery.rows[0].mavuonuom, plantId]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, message: "Thêm cây cảnh thành công!", data: { maCay: plantId } });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Admin create plant error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi tạo mới cây cảnh." } });
  } finally {
    client.release();
  }
}

async function updateAdminPlant(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      tenCay,
      tenKhoaHoc,
      moTaKichThuoc,
      giaBan,
      moTa,
      huongDanChamSoc,
      khoiLuongKg,
      maDanhMuc,
      trangThai,
      daXuatBan,
      hinhAnhUrl,
      growthRequirement,
    } = req.body;

    await client.query("BEGIN");

    await client.query(
      `UPDATE caycanh 
       SET tencay = $1, tenkhoahoc = $2, motakichthuoc = $3, giaban = $4, mota = $5,
           huongdanchamsoc = $6, khoiluongkg = $7, madanhmuc = $8, trangthai = $9, daxuatban = $10
       WHERE macay = $11`,
      [
        tenCay,
        tenKhoaHoc,
        moTaKichThuoc,
        Number(giaBan),
        moTa,
        huongDanChamSoc,
        Number(khoiLuongKg || 1.0),
        maDanhMuc,
        trangThai,
        daXuatBan,
        id,
      ]
    );

    if (growthRequirement) {
      await client.query(
        `UPDATE yeucausinhtruong
         SET nhietdotoithieu = $1, nhietdotoida = $2, doamtoiuu = $3, yeucauanhsang = $4, loaidat = $5
         WHERE macay = $6`,
        [
          Number(growthRequirement.nhietDoToiThieu || 18),
          Number(growthRequirement.nhietDoToiDa || 35),
          Number(growthRequirement.doAmToiUu || 65),
          growthRequirement.yeuCauAnhSang || "Bán râm",
          growthRequirement.loaiDat || "Đất vi sinh tơi xốp",
          id,
        ]
      );
    }

    if (hinhAnhUrl) {
      const existingMedia = await client.query("SELECT matruyenthong FROM taptintruyenthong WHERE macay = $1", [id]);
      if (existingMedia.rows.length > 0) {
        await client.query("UPDATE taptintruyenthong SET duongdantaptin = $1 WHERE macay = $2 AND laanhchinh = true", [hinhAnhUrl, id]);
      } else {
        await client.query(
          "INSERT INTO taptintruyenthong (matruyenthong, loaitruyenthong, duongdantaptin, dungluongbyte, laanhchinh, macay) VALUES ($1, 'image', $2, 180000, true, $3)",
          [`MED_${Date.now()}`, hinhAnhUrl, id]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Cập nhật cây cảnh thành công!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Admin update plant error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi cập nhật cây cảnh." } });
  } finally {
    client.release();
  }
}

async function deleteAdminPlant(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // Check if plant has orders
    const orderCheck = await client.query("SELECT machitietdonhang FROM chitietdonhang WHERE macay = $1 LIMIT 1", [id]);
    if (orderCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "HAS_ORDER_HISTORY",
          message: "Không thể xóa cây cảnh này vì đã phát sinh lịch sử đơn hàng. Hãy chuyển trạng thái sang ẩn/Pending thay vì xóa.",
        },
      });
    }

    await client.query("BEGIN");
    await client.query("DELETE FROM taptintruyenthong WHERE macay = $1", [id]);
    await client.query("DELETE FROM yeucausinhtruong WHERE macay = $1", [id]);
    await client.query("DELETE FROM tonkho WHERE macay = $1", [id]);
    await client.query("DELETE FROM caycanh WHERE macay = $1", [id]);
    await client.query("COMMIT");

    res.json({ success: true, message: "Đã xóa cây cảnh thành công!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Admin delete plant error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi xóa cây cảnh." } });
  } finally {
    client.release();
  }
}

/**
 * ========================================================
 * ADMIN CRUD: NHÀ CUNG CẤP (SUPPLIERS)
 * ========================================================
 */
async function getAdminSuppliers(req, res) {
  try {
    const result = await pool.query(`
      SELECT ncc.manhacungcap, ncc.tencongty, ncc.masothue, ncc.sodienthoailienhe, ncc.emaillienhe, ncc.diemuytin,
             COUNT(DISTINCT v.mavuonuom) as sovuonuom
      FROM nhacungcap ncc
      LEFT JOIN vuonuom v ON ncc.manhacungcap = v.manhacungcap
      GROUP BY ncc.manhacungcap, ncc.tencongty, ncc.masothue, ncc.sodienthoailienhe, ncc.emaillienhe, ncc.diemuytin
      ORDER BY ncc.manhacungcap
    `);

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        maNhaCungCap: r.manhacungcap,
        tenCongTy: r.tencongty,
        maSoThue: r.masothue,
        soDienThoaiLienHe: r.sodienthoailienhe,
        emailLienHe: r.emaillienhe,
        diemUyTin: Number(r.diemuytin || 5.0),
        soVuonUom: Number(r.sovuonuom || 0),
      })),
    });
  } catch (error) {
    console.error("Admin get suppliers error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi tải nhà cung cấp." } });
  }
}

async function createAdminSupplier(req, res) {
  try {
    const { maNhaCungCap, tenCongTy, maSoThue, soDienThoaiLienHe, emailLienHe, diemUyTin } = req.body;
    if (!tenCongTy || !emailLienHe) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Tên công ty và email liên hệ là bắt buộc." },
      });
    }

    const nccId = maNhaCungCap || `NCC_${Date.now()}`;
    await pool.query(
      `INSERT INTO nhacungcap (manhacungcap, tencongty, masothue, sodienthoailienhe, emaillienhe, diemuytin)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nccId, tenCongTy, maSoThue || "", soDienThoaiLienHe || "", emailLienHe, Number(diemUyTin || 5.0)]
    );

    res.status(201).json({ success: true, message: "Thêm nhà cung cấp thành công!", data: { maNhaCungCap: nccId } });
  } catch (error) {
    console.error("Admin create supplier error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi thêm nhà cung cấp." } });
  }
}

async function updateAdminSupplier(req, res) {
  try {
    const { id } = req.params;
    const { tenCongTy, maSoThue, soDienThoaiLienHe, emailLienHe, diemUyTin } = req.body;

    await pool.query(
      `UPDATE nhacungcap
       SET tencongty = $1, masothue = $2, sodienthoailienhe = $3, emaillienhe = $4, diemuytin = $5
       WHERE manhacungcap = $6`,
      [tenCongTy, maSoThue, soDienThoaiLienHe, emailLienHe, Number(diemUyTin || 5.0), id]
    );

    res.json({ success: true, message: "Cập nhật nhà cung cấp thành công!" });
  } catch (error) {
    console.error("Admin update supplier error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi cập nhật nhà cung cấp." } });
  }
}

async function deleteAdminSupplier(req, res) {
  try {
    const { id } = req.params;
    const checkVuon = await pool.query("SELECT mavuonuom FROM vuonuom WHERE manhacungcap = $1 LIMIT 1", [id]);
    if (checkVuon.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "HAS_NURSERIES", message: "Không thể xóa nhà cung cấp đang có vườn ươm trực thuộc." },
      });
    }

    await pool.query("DELETE FROM nhacungcap WHERE manhacungcap = $1", [id]);
    res.json({ success: true, message: "Đã xóa nhà cung cấp thành công!" });
  } catch (error) {
    console.error("Admin delete supplier error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi xóa nhà cung cấp." } });
  }
}

/**
 * ========================================================
 * ADMIN CRUD: VƯỜN ƯƠM (NURSERIES)
 * ========================================================
 */
async function getAdminNurseries(req, res) {
  try {
    const result = await pool.query(`
      SELECT v.mavuonuom, v.tenvuonuom, v.diachi, v.vido, v.kinhdo, v.bankinhgiaotoidakm, v.nguongtonkhotoithieu, v.danhgianhacungcap, v.trangthai, v.manhacungcap,
             ncc.tencongty,
             COUNT(DISTINCT tk.macay) as socaytonkho
      FROM vuonuom v
      LEFT JOIN nhacungcap ncc ON v.manhacungcap = ncc.manhacungcap
      LEFT JOIN tonkho tk ON v.mavuonuom = tk.mavuonuom
      GROUP BY v.mavuonuom, v.tenvuonuom, v.diachi, v.vido, v.kinhdo, v.bankinhgiaotoidakm, v.nguongtonkhotoithieu, v.danhgianhacungcap, v.trangthai, v.manhacungcap, ncc.tencongty
      ORDER BY v.mavuonuom
    `);

    res.json({
      success: true,
      data: result.rows.map((r) => ({
        maVuonUom: r.mavuonuom,
        tenVuonUom: r.tenvuonuom,
        diaChi: r.diachi,
        viDo: Number(r.vido || 10.77),
        kinhDo: Number(r.kinhdo || 106.70),
        banKinhGiaoToiDaKm: Number(r.bankinhgiaotoidakm || 30),
        nguongTonKhoToiThieu: Number(r.nguongtonkhotoithieu || 5),
        danhGiaNhaCungCap: Number(r.danhgianhacungcap || 4.9),
        trangThai: r.trangthai,
        maNhaCungCap: r.manhacungcap,
        tenCongTy: r.tencongty,
        soCayTonKho: Number(r.socaytonkho || 0),
      })),
    });
  } catch (error) {
    console.error("Admin get nurseries error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi tải vườn ươm." } });
  }
}

async function createAdminNursery(req, res) {
  try {
    const { maVuonUom, tenVuonUom, diaChi, viDo, kinhDo, banKinhGiaoToiDaKm, nguongTonKhoToiThieu, maNhaCungCap } = req.body;
    if (!tenVuonUom || !diaChi || !maNhaCungCap) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Tên vườn, địa chỉ và nhà cung cấp là bắt buộc." },
      });
    }

    const vuId = maVuonUom || `VU_${Date.now()}`;
    await pool.query(
      `INSERT INTO vuonuom (mavuonuom, tenvuonuom, diachi, vido, kinhdo, bankinhgiaotoidakm, nguongtonkhotoithieu, danhgianhacungcap, trangthai, manhacungcap)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 5.0, 'Active', $8)`,
      [
        vuId,
        tenVuonUom,
        diaChi,
        Number(viDo || 10.776),
        Number(kinhDo || 106.700),
        Number(banKinhGiaoToiDaKm || 30),
        Number(nguongTonKhoToiThieu || 5),
        maNhaCungCap,
      ]
    );

    res.status(201).json({ success: true, message: "Thêm vườn ươm thành công!", data: { maVuonUom: vuId } });
  } catch (error) {
    console.error("Admin create nursery error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi thêm vườn ươm." } });
  }
}

async function updateAdminNursery(req, res) {
  try {
    const { id } = req.params;
    const { tenVuonUom, diaChi, viDo, kinhDo, banKinhGiaoToiDaKm, nguongTonKhoToiThieu, maNhaCungCap, trangThai } = req.body;

    await pool.query(
      `UPDATE vuonuom
       SET tenvuonuom = $1, diachi = $2, vido = $3, kinhdo = $4, bankinhgiaotoidakm = $5,
           nguongtonkhotoithieu = $6, manhacungcap = $7, trangthai = $8
       WHERE mavuonuom = $9`,
      [
        tenVuonUom,
        diaChi,
        Number(viDo),
        Number(kinhDo),
        Number(banKinhGiaoToiDaKm || 30),
        Number(nguongTonKhoToiThieu || 5),
        maNhaCungCap,
        trangThai || "Active",
        id,
      ]
    );

    res.json({ success: true, message: "Cập nhật vườn ươm thành công!" });
  } catch (error) {
    console.error("Admin update nursery error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi cập nhật vườn ươm." } });
  }
}

async function deleteAdminNursery(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    const orderCheck = await client.query("SELECT madonhang FROM donhang WHERE mavuonuom = $1 LIMIT 1", [id]);
    if (orderCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "HAS_ORDERS", message: "Không thể xóa vườn ươm đã phát sinh đơn hàng." },
      });
    }

    await client.query("BEGIN");
    await client.query("DELETE FROM tonkho WHERE mavuonuom = $1", [id]);
    await client.query("DELETE FROM vuonuom WHERE mavuonuom = $1", [id]);
    await client.query("COMMIT");

    res.json({ success: true, message: "Đã xóa vườn ươm thành công!" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Admin delete nursery error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi xóa vườn ươm." } });
  } finally {
    client.release();
  }
}

/**
 * ========================================================
 * ADMIN CRUD: DANH MỤC (CATEGORIES)
 * ========================================================
 */
async function createAdminCategory(req, res) {
  try {
    const { maDanhMuc, tenDanhMuc, moTa } = req.body;
    if (!tenDanhMuc) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Tên danh mục là bắt buộc." },
      });
    }

    const catId = maDanhMuc || `DM_${Date.now()}`;
    await pool.query(
      `INSERT INTO danhmuc (madanhmuc, tendanhmuc, mota)
       VALUES ($1, $2, $3)`,
      [catId, tenDanhMuc, moTa || ""]
    );

    res.status(201).json({ success: true, message: "Thêm danh mục thành công!", data: { maDanhMuc: catId } });
  } catch (error) {
    console.error("Admin create category error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi thêm danh mục." } });
  }
}

async function updateAdminCategory(req, res) {
  try {
    const { id } = req.params;
    const { tenDanhMuc, moTa } = req.body;

    await pool.query(
      `UPDATE danhmuc
       SET tendanhmuc = $1, mota = $2
       WHERE madanhmuc = $3`,
      [tenDanhMuc, moTa, id]
    );

    res.json({ success: true, message: "Cập nhật danh mục thành công!" });
  } catch (error) {
    console.error("Admin update category error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi cập nhật danh mục." } });
  }
}

async function deleteAdminCategory(req, res) {
  try {
    const { id } = req.params;
    const plantCheck = await pool.query("SELECT macay FROM caycanh WHERE madanhmuc = $1 LIMIT 1", [id]);
    if (plantCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "HAS_PLANTS", message: "Không thể xóa danh mục đang có sản phẩm cây cảnh." },
      });
    }

    await pool.query("DELETE FROM danhmuc WHERE madanhmuc = $1", [id]);
    res.json({ success: true, message: "Đã xóa danh mục thành công!" });
  } catch (error) {
    console.error("Admin delete category error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi xóa danh mục." } });
  }
}

/**
 * ========================================================
 * ADMIN READ-ONLY: ĐƠN HÀNG (ORDERS) - STRICTLY NO EDIT/DELETE
 * ========================================================
 */
async function getAdminOrders(req, res) {
  try {
    const result = await pool.query(`
      SELECT dh.madonhang, dh.ngaydathang, dh.tongtien, dh.phivanchuyen, dh.khoangcachkm,
             dh.phuongthucthanhtoan, dh.trangthaithanhtoan, dh.trangthaidonhang, dh.tamgiuden,
             dh.daxacnhansuckhoe, dh.anhsuckhoeurl,
             u.hoten as tenkhachhang, u.email as emailkhachhang, u.sodienthoai as sdtkhachhang,
             v.tenvuonuom,
             COUNT(ct.machitietdonhang) as tongsosanpham
      FROM donhang dh
      LEFT JOIN nguoidung u ON dh.manguoidung = u.manguoidung
      LEFT JOIN vuonuom v ON dh.mavuonuom = v.mavuonuom
      LEFT JOIN chitietdonhang ct ON dh.madonhang = ct.madonhang
      GROUP BY dh.madonhang, dh.ngaydathang, dh.tongtien, dh.phivanchuyen, dh.khoangcachkm, dh.phuongthucthanhtoan, dh.trangthaithanhtoan, dh.trangthaidonhang, dh.tamgiuden, dh.daxacnhansuckhoe, dh.anhsuckhoeurl, u.hoten, u.email, u.sodienthoai, v.tenvuonuom
      ORDER BY dh.ngaydathang DESC
      LIMIT 200
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        maDonHang: row.madonhang,
        ngayDatHang: row.ngaydathang,
        tongTien: Number(row.tongtien),
        phiVanChuyen: Number(row.phivanchuyen),
        khoangCachKm: Number(row.khoangcachkm),
        phuongThucThanhToan: row.phuongthucthanhtoan,
        trangThaiThanhToan: row.trangthaithanhtoan,
        trangThaiDonHang: row.trangthaidonhang,
        daXacNhanSucKhoe: row.daxacnhansuckhoe,
        anhSucKhoeUrl: row.anhsuckhoeurl,
        tenKhachHang: row.tenkhachhang || "Khách vãng lai",
        emailKhachHang: row.emailkhachhang,
        soDienThoai: row.sdtkhachhang,
        tenVuonUom: row.tenvuonuom,
        soLuongMatHang: Number(row.tongsosanpham),
      })),
    });
  } catch (error) {
    console.error("Admin get orders error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi tải danh sách đơn hàng." } });
  }
}

async function getAdminOrderDetail(req, res) {
  try {
    const { id } = req.params;
    const orderRes = await pool.query(
      `SELECT dh.*, u.hoten, u.email, u.sodienthoai, v.tenvuonuom, v.diachi as diachivuon,
              dc.tennguoinhan, dc.sodienthoainguoinhan, dc.diachichitiet, dc.vido, dc.kinhdo
       FROM donhang dh
       LEFT JOIN nguoidung u ON dh.manguoidung = u.manguoidung
       LEFT JOIN vuonuom v ON dh.mavuonuom = v.mavuonuom
       LEFT JOIN diachigiaohang dc ON dh.madiachi = dc.madiachi
       WHERE dh.madonhang = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy đơn hàng." } });
    }

    const itemsRes = await pool.query(
      `SELECT ct.*, c.tencay, t.duongdantaptin as anhcay
       FROM chitietdonhang ct
       LEFT JOIN caycanh c ON ct.macay = c.macay
       LEFT JOIN taptintruyenthong t ON c.macay = t.macay AND t.laanhchinh = true
       WHERE ct.madonhang = $1`,
      [id]
    );

    const order = orderRes.rows[0];
    res.json({
      success: true,
      data: {
        maDonHang: order.madonhang,
        ngayDatHang: order.ngaydathang,
        tongTien: Number(order.tongtien),
        phiVanChuyen: Number(order.phivanchuyen),
        khoangCachKm: Number(order.khoangcachkm),
        phuongThucThanhToan: order.phuongthucthanhtoan,
        trangThaiThanhToan: order.trangthaithanhtoan,
        trangThaiDonHang: order.trangthaidonhang,
        daXacNhanSucKhoe: order.daxacnhansuckhoe,
        anhSucKhoeUrl: order.anhsuckhoeurl,
        khachHang: {
          hoTen: order.hoten,
          email: order.email,
          soDienThoai: order.sodienthoai,
        },
        vuonUom: {
          tenVuonUom: order.tenvuonuom,
          diaChi: order.diachivuon,
        },
        diaChiGiaoHang: {
          nguoiNhan: order.tennguoinhan,
          soDienThoai: order.sodienthoainguoinhan,
          diaChi: order.diachichitiet,
          viDo: Number(order.vido),
          kinhDo: Number(order.kinhdo),
        },
        items: itemsRes.rows.map((item) => ({
          maChiTietDonHang: item.machitietdonhang,
          maCay: item.macay,
          tenCay: item.tencay,
          anhCay: item.anhcay || "/assets/images/cay_van_phong.jpg",
          soLuong: item.soluong,
          donGia: Number(item.dongia),
          thanhTien: Number(item.thanhtien),
        })),
      },
    });
  } catch (error) {
    console.error("Admin get order detail error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi tải chi tiết đơn hàng." } });
  }
}

/**
 * ========================================================
 * ADMIN CRUD: TỒN KHO (INVENTORY)
 * ========================================================
 */
async function getAdminInventory(req, res) {
  try {
    const result = await pool.query(`
      SELECT tk.matonkho, tk.soluongton, tk.soluongtamgiu, tk.lancapnhatcuoi,
             c.macay, c.tencay, dm.tendanhmuc,
             v.mavuonuom, v.tenvuonuom, ncc.tencongty
      FROM tonkho tk
      JOIN caycanh c ON tk.macay = c.macay
      LEFT JOIN danhmuc dm ON c.madanhmuc = dm.madanhmuc
      JOIN vuonuom v ON tk.mavuonuom = v.mavuonuom
      LEFT JOIN nhacungcap ncc ON v.manhacungcap = ncc.manhacungcap
      ORDER BY tk.lancapnhatcuoi DESC, tk.matonkho DESC
    `);

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        maTonKho: row.matonkho,
        maCay: row.macay,
        tenCay: row.tencay,
        tenDanhMuc: row.tendanhmuc,
        maVuonUom: row.mavuonuom,
        tenVuonUom: row.tenvuonuom,
        tenCongTy: row.tencongty,
        soLuongTon: row.soluongton,
        soLuongTamGiu: row.soluongtamgiu,
        tonKhaDung: Math.max(0, row.soluongton - row.soluongtamgiu),
        lanCapNhatCuoi: row.lancapnhatcuoi,
      })),
    });
  } catch (error) {
    console.error("Admin get inventory error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi tải danh sách tồn kho." } });
  }
}

async function createAdminInventory(req, res) {
  try {
    const { maTonKho, maCay, maVuonUom, soLuongTon } = req.body;
    if (!maCay || !maVuonUom || soLuongTon === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Cây cảnh, vườn ươm và số lượng tồn là bắt buộc." },
      });
    }

    const plantCheck = await pool.query("SELECT macay FROM caycanh WHERE macay = $1", [maCay]);
    if (plantCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy cây cảnh." } });
    }

    const nurseryCheck = await pool.query("SELECT mavuonuom FROM vuonuom WHERE mavuonuom = $1", [maVuonUom]);
    if (nurseryCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy vườn ươm." } });
    }

    // Check if duplicate (macay, mavuonuom)
    const existing = await pool.query("SELECT matonkho FROM tonkho WHERE macay = $1 AND mavuonuom = $2", [maCay, maVuonUom]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "ALREADY_EXISTS", message: "Cây cảnh này đã có bản ghi tồn kho tại vườn ươm được chọn. Vui lòng cập nhật số lượng thay vì thêm mới." },
      });
    }

    const newId = maTonKho || `TK_${Date.now()}`;
    await pool.query(
      `INSERT INTO tonkho (matonkho, soluongton, soluongtamgiu, lancapnhatcuoi, mavuonuom, macay)
       VALUES ($1, $2, 0, NOW(), $3, $4)`,
      [newId, Number(soLuongTon), maVuonUom, maCay]
    );

    res.status(201).json({ success: true, message: "Thêm tồn kho thành công!", data: { maTonKho: newId } });
  } catch (error) {
    console.error("Admin create inventory error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi thêm tồn kho." } });
  }
}

async function updateAdminInventory(req, res) {
  try {
    const { id } = req.params;
    const { soLuongTon } = req.body;

    if (soLuongTon === undefined || Number(soLuongTon) < 0) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_INPUT", message: "Số lượng tồn kho không được để trống và phải >= 0." },
      });
    }

    const result = await pool.query(
      `UPDATE tonkho
       SET soluongton = $1, lancapnhatcuoi = NOW()
       WHERE matonkho = $2`,
      [Number(soLuongTon), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy bản ghi tồn kho." } });
    }

    res.json({ success: true, message: "Cập nhật tồn kho thành công!" });
  } catch (error) {
    console.error("Admin update inventory error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi cập nhật tồn kho." } });
  }
}

async function deleteAdminInventory(req, res) {
  try {
    const { id } = req.params;

    const check = await pool.query("SELECT soluongtamgiu FROM tonkho WHERE matonkho = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Không tìm thấy bản ghi tồn kho." } });
    }

    if (Number(check.rows[0].soluongtamgiu) > 0) {
      return res.status(400).json({
        success: false,
        error: { code: "LOCKED_INVENTORY", message: "Không thể xóa bản ghi tồn kho này vì đang có đơn hàng tạm giữ sản phẩm." },
      });
    }

    await pool.query("DELETE FROM tonkho WHERE matonkho = $1", [id]);
    res.json({ success: true, message: "Đã xóa bản ghi tồn kho thành công!" });
  } catch (error) {
    console.error("Admin delete inventory error:", error);
    res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: "Lỗi xóa tồn kho." } });
  }
}

module.exports = {
  getDashboardStats,
  getHeatmapData,
  getUsers,
  updateUserStatus,
  getCategories,
  // Admin CRUD Plants
  getAdminPlants,
  createAdminPlant,
  updateAdminPlant,
  deleteAdminPlant,
  // Admin CRUD Suppliers
  getAdminSuppliers,
  createAdminSupplier,
  updateAdminSupplier,
  deleteAdminSupplier,
  // Admin CRUD Nurseries
  getAdminNurseries,
  createAdminNursery,
  updateAdminNursery,
  deleteAdminNursery,
  // Admin CRUD Categories
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  // Admin Read-only Orders
  getAdminOrders,
  getAdminOrderDetail,
  // Admin CRUD Inventory
  getAdminInventory,
  createAdminInventory,
  updateAdminInventory,
  deleteAdminInventory,
};
