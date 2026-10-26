const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/auth');

/**
 * Register a new user (Customer or Supplier) (BR01)
 */
async function register(req, res) {
  try {
    const { tenDangNhap, matKhau, email, soDienThoai, hoTen, vaiTro } = req.body;

    if (!tenDangNhap || !matKhau || !email || !soDienThoai || !hoTen) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc.' },
      });
    }

    const assignedRole = vaiTro === 'Supplier' ? 'Supplier' : 'Customer';

    // Check duplicate username, email, phone (BR01)
    const existing = await pool.query(
      'SELECT manguoidung FROM nguoidung WHERE tendangnhap = $1 OR email = $2 OR sodienthoai = $3',
      [tenDangNhap, email, soDienThoai]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'Tên đăng nhập, Email hoặc Số điện thoại đã được đăng ký.' },
      });
    }

    const hashedPassword = await bcrypt.hash(matKhau, 10);
    const maNguoiDung = `USR_${Date.now()}`;

    await pool.query(
      `INSERT INTO nguoidung (manguoidung, tendangnhap, matkhaumahoa, email, sodienthoai, hoten, vaitro, daxacthuc, trangthai, ngaytao)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [maNguoiDung, tenDangNhap, hashedPassword, email, soDienThoai, hoTen, assignedRole, true, 'Active']
    );

    // If Supplier, create an initial supplier record
    if (assignedRole === 'Supplier') {
      const maNhaCungCap = `NCC_${Date.now()}`;
      await pool.query(
        `INSERT INTO nhacungcap (manhacungcap, tencongty, masothue, sodienthoailienhe, emaillienhe, diemuytin)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [maNhaCungCap, hoTen + ' (Vườn Kiểng)', 'Chưa cập nhật', soDienThoai, email, 5.0]
      );
    }

    const token = jwt.sign(
      { maNguoiDung, tenDangNhap, email, hoTen, vaiTro: assignedRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { maNguoiDung, tenDangNhap, email, soDienThoai, hoTen, vaiTro: assignedRole },
      },
      message: 'Đăng ký tài khoản thành công.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Đã có lỗi xảy ra trong quá trình đăng ký.' },
    });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { tenDangNhap, matKhau } = req.body;

    if (!tenDangNhap || !matKhau) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Vui lòng nhập tên đăng nhập/email và mật khẩu.' },
      });
    }

    const result = await pool.query(
      `SELECT manguoidung, tendangnhap, matkhaumahoa, email, sodienthoai, hoten, vaitro, daxacthuc, trangthai
       FROM nguoidung
       WHERE tendangnhap = $1 OR email = $1`,
      [tenDangNhap]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác.' },
      });
    }

    const user = result.rows[0];

    if (user.trangthai === 'Locked') {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_LOCKED', message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' },
      });
    }

    const isMatch = await bcrypt.compare(matKhau, user.matkhaumahoa);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Tài khoản hoặc mật khẩu không chính xác.' },
      });
    }

    const token = jwt.sign(
      {
        maNguoiDung: user.manguoidung,
        tenDangNhap: user.tendangnhap,
        email: user.email,
        hoTen: user.hoten,
        vaiTro: user.vaitro,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          maNguoiDung: user.manguoidung,
          tenDangNhap: user.tendangnhap,
          email: user.email,
          soDienThoai: user.sodienthoai,
          hoTen: user.hoten,
          vaiTro: user.vaitro,
          daXacThuc: user.daxacthuc,
        },
      },
      message: 'Đăng nhập thành công.',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi hệ thống khi đăng nhập.' },
    });
  }
}

/**
 * Get current authenticated user profile
 */
async function getProfile(req, res) {
  try {
    const result = await pool.query(
      `SELECT manguoidung, tendangnhap, email, sodienthoai, hoten, vaitro, daxacthuc, trangthai, ngaytao
       FROM nguoidung WHERE manguoidung = $1`,
      [req.user.maNguoiDung]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy người dùng.' },
      });
    }

    const user = result.rows[0];

    // If Supplier, also fetch supplier company info
    let supplierInfo = null;
    if (user.vaitro === 'Supplier') {
      const sResult = await pool.query(
        'SELECT * FROM nhacungcap WHERE emaillienhe = $1 OR sodienthoailienhe = $2 LIMIT 1',
        [user.email, user.sodienthoai]
      );
      if (sResult.rows.length > 0) {
        supplierInfo = sResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        user: {
          maNguoiDung: user.manguoidung,
          tenDangNhap: user.tendangnhap,
          email: user.email,
          soDienThoai: user.sodienthoai,
          hoTen: user.hoten,
          vaiTro: user.vaitro,
          daXacThuc: user.daxacthuc,
          ngayTao: user.ngaytao,
        },
        supplierInfo,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Không thể lấy thông tin người dùng.' },
    });
  }
}

/**
 * Get delivery addresses of customer
 */
async function getAddresses(req, res) {
  try {
    const result = await pool.query(
      `SELECT madiachi, tennguoinhan, sodienthoainguoinhan, diachichitiet, vido, kinhdo, macdinh
       FROM diachigiaohang WHERE manguoidung = $1 ORDER BY macdinh DESC, madiachi DESC`,
      [req.user.maNguoiDung]
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        maDiaChi: row.madiachi,
        tenNguoiNhan: row.tennguoinhan,
        soDienThoaiNguoiNhan: row.sodienthoainguoinhan,
        diaChiChiTiet: row.diachichitiet,
        viDo: Number(row.vido),
        kinhDo: Number(row.kinhdo),
        macDinh: row.macdinh,
      })),
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi tải danh sách địa chỉ.' },
    });
  }
}

/**
 * Add delivery address with GIS pin (BR09)
 */
async function addAddress(req, res) {
  try {
    const { tenNguoiNhan, soDienThoaiNguoiNhan, diaChiChiTiet, viDo, kinhDo, macDinh } = req.body;

    if (!tenNguoiNhan || !soDienThoaiNguoiNhan || !diaChiChiTiet || viDo === undefined || kinhDo === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Bắt buộc ghim tọa độ và nhập địa chỉ chi tiết (BR09).' },
      });
    }

    const maDiaChi = `DC_${Date.now()}`;

    if (macDinh) {
      await pool.query('UPDATE diachigiaohang SET macdinh = false WHERE manguoidung = $1', [req.user.maNguoiDung]);
    }

    await pool.query(
      `INSERT INTO diachigiaohang (madiachi, tennguoinhan, sodienthoainguoinhan, diachichitiet, vido, kinhdo, macdinh, manguoidung)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [maDiaChi, tenNguoiNhan, soDienThoaiNguoiNhan, diaChiChiTiet, viDo, kinhDo, Boolean(macDinh), req.user.maNguoiDung]
    );

    res.status(201).json({
      success: true,
      data: { maDiaChi, tenNguoiNhan, soDienThoaiNguoiNhan, diaChiChiTiet, viDo, kinhDo, macDinh: Boolean(macDinh) },
      message: 'Thêm địa chỉ giao hàng thành công.',
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi thêm địa chỉ giao hàng.' },
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  getAddresses,
  addAddress,
};
