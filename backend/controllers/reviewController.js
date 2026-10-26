const { pool } = require('../config/db');

/**
 * Submit review for an item in a completed order (BR15, BR16)
 */
async function createReview(req, res) {
  const client = await pool.connect();
  try {
    const { maDonHang, maChiTietDonHang, soSaoDanhGia, binhLuan, duongDanTruyenThong } = req.body;
    const userId = req.user.maNguoiDung;

    if (!maDonHang || !maChiTietDonHang || !soSaoDanhGia) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Vui lòng cung cấp mã đơn hàng, sản phẩm và số sao đánh giá.' },
      });
    }

    const stars = parseInt(soSaoDanhGia, 10);
    if (isNaN(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_RATING', message: 'Số sao đánh giá phải từ 1 đến 5 sao.' },
      });
    }

    // Check order belongs to user and is DaHoanThanh (BR15)
    const oRes = await client.query(
      `SELECT dh.madonhang, dh.trangthaidonhang, dh.mavuonuom, v.manhacungcap
       FROM donhang dh
       JOIN vuonuom v ON dh.mavuonuom = v.mavuonuom
       WHERE dh.madonhang = $1 AND dh.manguoidung = $2`,
      [maDonHang, userId]
    );

    if (oRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng của bạn.' },
      });
    }

    const order = oRes.rows[0];

    if (order.trangthaidonhang !== 'DaHoanThanh') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ORDER_NOT_COMPLETED',
          message: 'Chỉ có thể gửi đánh giá khi đơn hàng đã ở trạng thái "Đã hoàn thành" (BR15).',
        },
      });
    }

    // Check if already reviewed (UNIQUE constraint on maDonHang or check maChiTietDonHang)
    const existing = await client.query(
      'SELECT madanhgia FROM danhgia WHERE madonhang = $1',
      [maDonHang]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'ALREADY_REVIEWED', message: 'Đơn hàng này đã được gửi đánh giá rồi (BR15).' },
      });
    }

    await client.query('BEGIN');

    const maDanhGia = `DG_${Date.now()}`;

    await client.query(
      `INSERT INTO danhgia (madanhgia, sosaodanhgia, binhluan, duongdantruyenthong, ngaytao, madonhang, machitietdonhang)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
      [maDanhGia, stars, binhLuan || '', duongDanTruyenThong || null, maDonHang, maChiTietDonHang]
    );

    // BR16: Recalculate Supplier Rating
    const supplierId = order.manhacungcap;
    const avgRes = await client.query(
      `SELECT AVG(dg.sosaodanhgia) as avg_rating
       FROM danhgia dg
       JOIN donhang dh ON dg.madonhang = dh.madonhang
       JOIN vuonuom v ON dh.mavuonuom = v.mavuonuom
       WHERE v.manhacungcap = $1`,
      [supplierId]
    );

    const newRating = Math.round(Number(avgRes.rows[0].avg_rating || 5.0) * 10) / 10;

    await client.query('UPDATE nhacungcap SET diemuytin = $1 WHERE manhacungcap = $2', [newRating, supplierId]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        maDanhGia,
        soSaoDanhGia: stars,
        binhLuan,
        diemUyTinNCCMoi: newRating,
      },
      message: 'Cảm ơn bạn đã gửi đánh giá sản phẩm!',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi gửi đánh giá sản phẩm.' },
    });
  } finally {
    client.release();
  }
}

module.exports = {
  createReview,
};
