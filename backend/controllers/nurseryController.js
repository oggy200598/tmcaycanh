const { pool } = require("../config/db");
const gisService = require("../services/gisService");

/**
 * Get all nurseries with GIS coordinates & distance calculation
 */
async function getNurseries(req, res) {
  try {
    const { lat, lon } = req.query;

    const result = await pool.query(`
      SELECT 
        v.mavuonuom, v.tenvuonuom, v.diachi, v.vido, v.kinhdo, v.bankinhgiaotoidakm,
        v.nguongtonkhotoithieu, v.danhgianhacungcap, v.trangthai, v.manhacungcap,
        ncc.tencongty, ncc.diemuytin,
        COUNT(DISTINCT tk.macay) AS socaycungcap,
        COALESCE(SUM(tk.soluongton), 0) AS tongsoluongton
      FROM vuonuom v
      JOIN nhacungcap ncc ON v.manhacungcap = ncc.manhacungcap
      LEFT JOIN tonkho tk ON v.mavuonuom = tk.mavuonuom
      WHERE v.trangthai = 'Active'
      GROUP BY v.mavuonuom, ncc.tencongty, ncc.diemuytin
    `);

    const userLat = lat ? Number(lat) : null;
    const userLon = lon ? Number(lon) : null;

    let items = result.rows.map((row) => {
      let distanceKm = null;
      let withinRadius = true;

      if (userLat && userLon) {
        distanceKm = gisService.calculateDistance(
          userLat,
          userLon,
          Number(row.vido),
          Number(row.kinhdo),
        );
        withinRadius = distanceKm <= Number(row.bankinhgiaotoidakm);
      }

      return {
        maVuonUom: row.mavuonuom,
        tenVuonUom: row.tenvuonuom,
        diaChi: row.diachi,
        viDo: Number(row.vido),
        kinhDo: Number(row.kinhdo),
        banKinhGiaoToiDaKm: Number(row.bankinhgiaotoidakm),
        nguongTonKhoToiThieu: row.nguongtonkhotoithieu,
        danhGiaNhaCungCap: Number(row.danhgianhacungcap),
        trangThai: row.trangthai,
        maNhaCungCap: row.manhacungcap,
        tenCongTy: row.tencongty,
        diemUyTin: Number(row.diemuytin),
        soCayCungCap: Number(row.socaycungcap),
        tongSoLuongTon: Number(row.tongsoluongton),
        khoangCachKm: distanceKm,
        trongBanKinhGiao: withinRadius,
      };
    });

    if (userLat && userLon) {
      items.sort((a, b) => a.khoangCachKm - b.khoangCachKm);
    }

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get nurseries error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tải danh sách vườn ươm." },
    });
  }
}

/**
 * Get nursery details and inventory
 */
async function getNurseryById(req, res) {
  try {
    const { id } = req.params;

    const nResult = await pool.query(
      `SELECT v.*, ncc.tencongty, ncc.diemuytin, ncc.sodienthoailienhe, ncc.emaillienhe
       FROM vuonuom v
       JOIN nhacungcap ncc ON v.manhacungcap = ncc.manhacungcap
       WHERE v.mavuonuom = $1`,
      [id],
    );

    if (nResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Không tìm thấy vườn ươm." },
      });
    }

    const n = nResult.rows[0];

    // Inventory of this nursery
    const invResult = await pool.query(
      `SELECT tk.matonkho, tk.soluongton, tk.soluongtamgiu, (tk.soluongton - tk.soluongtamgiu) AS tonkhadung,
              tk.lancapnhatcuoi, c.macay, c.tencay, c.giaban, c.khoiluongkg,
              (SELECT duongdantaptin FROM taptintruyenthong WHERE macay = c.macay AND laanhchinh = true LIMIT 1) as anhchinh
       FROM tonkho tk
       JOIN caycanh c ON tk.macay = c.macay
       WHERE tk.mavuonuom = $1`,
      [id],
    );

    res.json({
      success: true,
      data: {
        maVuonUom: n.mavuonuom,
        tenVuonUom: n.tenvuonuom,
        diaChi: n.diachi,
        viDo: Number(n.vido),
        kinhDo: Number(n.kinhdo),
        banKinhGiaoToiDaKm: Number(n.bankinhgiaotoidakm),
        nguongTonKhoToiThieu: n.nguongtonkhotoithieu,
        danhGiaNhaCungCap: Number(n.danhgianhacungcap),
        trangThai: n.trangthai,
        nhaCungCap: {
          maNhaCungCap: n.manhacungcap,
          tenCongTy: n.tencongty,
          diemUyTin: Number(n.diemuytin),
          soDienThoai: n.sodienthoailienhe,
          email: n.emaillienhe,
        },
        tonKho: invResult.rows.map((row) => ({
          maTonKho: row.matonkho,
          maCay: row.macay,
          tenCay: row.tencay,
          giaBan: Number(row.giaban),
          khoiLuongKg: Number(row.khoiluongkg),
          anhChinh: row.anhchinh,
          soLuongTon: row.soluongton,
          soLuongTamGiu: row.soluongtamgiu,
          tonKhaDung: Number(row.tonkhadung),
          lanCapNhatCuoi: row.lancapnhatcuoi,
          canhBaoTonThap: row.soluongton <= n.nguongtonkhotoithieu, //
        })),
      },
    });
  } catch (error) {
    console.error("Get nursery detail error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tải chi tiết vườn ươm." },
    });
  }
}

/**
 * Create a new Nursery with GIS coordinates
 */
async function createNursery(req, res) {
  try {
    const {
      tenVuonUom,
      diaChi,
      viDo,
      kinhDo,
      banKinhGiaoToiDaKm,
      nguongTonKhoToiThieu,
      maNhaCungCap,
    } = req.body;

    if (!tenVuonUom || !diaChi || viDo === undefined || kinhDo === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Bắt buộc khai báo tọa độ (viDo, kinhDo) và địa chỉ vườn .",
        },
      });
    }

    if (viDo < -90 || viDo > 90 || kinhDo < -180 || kinhDo > 180) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_COORDINATES",
          message: "Tọa độ GPS không hợp lệ.",
        },
      });
    }

    // Default or lookup supplier
    let supplierId = maNhaCungCap;
    if (!supplierId) {
      const s = await pool.query("SELECT manhacungcap FROM nhacungcap LIMIT 1");
      supplierId = s.rows[0].manhacungcap;
    }

    const maVuonUom = `VU_${Date.now()}`;

    await pool.query(
      `INSERT INTO vuonuom (mavuonuom, tenvuonuom, diachi, vido, kinhdo, bankinhgiaotoidakm, nguongtonkhotoithieu, danhgianhacungcap, trangthai, manhacungcap)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        maVuonUom,
        tenVuonUom,
        diaChi,
        viDo,
        kinhDo,
        banKinhGiaoToiDaKm || 30.0,
        nguongTonKhoToiThieu || 5,
        5.0,
        "Active",
        supplierId,
      ],
    );

    res.status(201).json({
      success: true,
      data: {
        maVuonUom,
        tenVuonUom,
        viDo,
        kinhDo,
        banKinhGiaoToiDaKm: banKinhGiaoToiDaKm || 30.0,
      },
      message: "Thiết lập vườn ươm và tọa độ GIS thành công.",
    });
  } catch (error) {
    console.error("Create nursery error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi khởi tạo vườn ươm." },
    });
  }
}

module.exports = {
  getNurseries,
  getNurseryById,
  createNursery,
};
