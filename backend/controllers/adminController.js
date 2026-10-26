const { pool } = require('../config/db');

/**
 * Get system dashboard statistics and low-stock alerts (BR18)
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
    const userRes = await pool.query('SELECT COUNT(*) AS total FROM nguoidung');
    const plantRes = await pool.query('SELECT COUNT(*) AS total FROM caycanh WHERE trangthai = \'Active\'');
    const pendingRes = await pool.query('SELECT COUNT(*) AS total FROM caycanh WHERE trangthai = \'Pending\'');
    const nurseryRes = await pool.query('SELECT COUNT(*) AS total FROM vuonuom WHERE trangthai = \'Active\'');

    // 3. Low stock alerts (BR18)
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
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi tải thống kê dashboard.' },
    });
  }
}

/**
 * Get GIS Heatmap data for completed orders (BR19)
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
    console.error('Heatmap error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi tải dữ liệu bản đồ nhiệt.' },
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
       FROM nguoidung ORDER BY ngaytao DESC`
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi tải danh sách người dùng.' },
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

    if (!['Active', 'Locked'].includes(trangThai)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Trạng thái chỉ có thể là Active hoặc Locked.' },
      });
    }

    const result = await pool.query(
      'UPDATE nguoidung SET trangthai = $1 WHERE manguoidung = $2 RETURNING manguoidung, hoten, trangthai',
      [trangThai, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy người dùng.' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Đã cập nhật trạng thái người dùng thành: ${trangThai}.`,
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi cập nhật trạng thái người dùng.' },
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
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi tải danh mục.' },
    });
  }
}

module.exports = {
  getDashboardStats,
  getHeatmapData,
  getUsers,
  updateUserStatus,
  getCategories,
};
