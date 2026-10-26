const { pool } = require('../config/db');
const gisService = require('../services/gisService');

/**
 * Create a new Order with ACID Transaction and Inventory Lock (BR07, BR08, BR09, BR10)
 */
async function createOrder(req, res) {
  const client = await pool.connect();
  try {
    const { maVuonUom, maDiaChi, viDoGiao, kinhDoGiao, diaChiChiTiet, items, phuongThucThanhToan } = req.body;
    const maNguoiDung = req.user.maNguoiDung;

    if (!maVuonUom || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Vui lòng chọn vườn ươm và danh sách cây cần mua.' },
      });
    }

    // 1. Fetch Nursery info
    const nResult = await client.query(
      'SELECT mavuonuom, tenvuonuom, vido, kinhdo, bankinhgiaotoidakm FROM vuonuom WHERE mavuonuom = $1',
      [maVuonUom]
    );

    if (nResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Vườn ươm không tồn tại.' },
      });
    }

    const nursery = nResult.rows[0];

    // 2. Resolve delivery address & GIS coordinates (BR09)
    let destLat, destLon, resolvedDiaChiId;

    if (maDiaChi) {
      const addrRes = await client.query(
        'SELECT madiachi, vido, kinhdo FROM diachigiaohang WHERE madiachi = $1',
        [maDiaChi]
      );
      if (addrRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Địa chỉ giao hàng không hợp lệ.' },
        });
      }
      destLat = Number(addrRes.rows[0].vido);
      destLon = Number(addrRes.rows[0].kinhdo);
      resolvedDiaChiId = addrRes.rows[0].madiachi;
    } else if (viDoGiao !== undefined && kinhDoGiao !== undefined) {
      destLat = Number(viDoGiao);
      destLon = Number(kinhDoGiao);
      // Create new address for user
      const newAddrId = `DC_${Date.now()}`;
      await client.query(
        `INSERT INTO diachigiaohang (madiachi, tennguoinhan, sodienthoainguoinhan, diachichitiet, vido, kinhdo, macdinh, manguoidung)
         VALUES ($1, $2, $3, $4, $5, $6, false, $7)`,
        [newAddrId, req.user.hoTen, req.user.soDienThoai || '0901234567', diaChiChiTiet || 'Địa chỉ ghim GIS', destLat, destLon, maNguoiDung]
      );
      resolvedDiaChiId = newAddrId;
    } else {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_GIS_COORDINATES', message: 'Bắt buộc phải ghim vị trí nhận hàng trên bản đồ GIS (BR09).' },
      });
    }

    // 3. Calculate GIS distance & validate radius (BR07)
    const distanceKm = gisService.calculateDistance(destLat, destLon, Number(nursery.vido), Number(nursery.kinhdo));

    if (distanceKm > Number(nursery.bankinhgiaotoidakm)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OUT_OF_DELIVERY_RADIUS',
          message: `Khoảng cách giao (${distanceKm} km) vượt quá bán kính phục vụ tối đa của vườn (${nursery.bankinhgiaotoidakm} km) (BR07).`,
        },
      });
    }

    // 4. Begin ACID Transaction for Inventory Reservation (BR10)
    await client.query('BEGIN');

    let subTotal = 0;
    let totalWeightKg = 0;
    const validatedItems = [];

    for (const item of items) {
      const { maCay, soLuong } = item;
      const qty = parseInt(soLuong, 10);

      if (!maCay || isNaN(qty) || qty <= 0) {
        throw new Error('Số lượng sản phẩm không hợp lệ.');
      }

      // Lock row FOR UPDATE to prevent race condition
      const stockRes = await client.query(
        `SELECT tk.matonkho, tk.soluongton, tk.soluongtamgiu, c.giaban, c.tencay, c.khoiluongkg
         FROM tonkho tk
         JOIN caycanh c ON tk.macay = c.macay
         WHERE tk.mavuonuom = $1 AND tk.macay = $2
         FOR UPDATE`,
        [maVuonUom, maCay]
      );

      if (stockRes.rows.length === 0) {
        throw new Error(`Cây [${maCay}] không tồn tại trong kho của vườn ươm này.`);
      }

      const stock = stockRes.rows[0];
      const availableStock = stock.soluongton - stock.soluongtamgiu;

      if (availableStock < qty) {
        throw new Error(`Sản phẩm "${stock.tencay}" chỉ còn ${availableStock} cây khả dụng (yêu cầu: ${qty}).`);
      }

      // Lock inventory: increment soLuongTamGiu (BR10)
      await client.query(
        `UPDATE tonkho 
         SET soluongtamgiu = soluongtamgiu + $1, lancapnhatcuoi = NOW() 
         WHERE matonkho = $2`,
        [qty, stock.matonkho]
      );

      const donGia = Number(stock.giaban);
      const thanhTien = donGia * qty;
      subTotal += thanhTien;
      totalWeightKg += Number(stock.khoiluongkg || 2.0) * qty;

      validatedItems.push({
        maCay,
        tenCay: stock.tencay,
        soLuong: qty,
        donGia,
        thanhTien,
      });
    }

    // 5. Calculate shipping fee (BR08)
    const phiVanChuyen = gisService.calculateShippingFee(distanceKm, totalWeightKg);
    const tongTien = subTotal + phiVanChuyen;

    // 6. Insert Order with 15-minute reservation timer (BR10, BR11)
    const maDonHang = `DH_${Date.now()}`;
    const tamGiuDen = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
    const ptt = phuongThucThanhToan || 'COD';
    const ttThanhToan = ptt === 'COD' ? 'ChuaThanhToan' : 'ChuaThanhToan';

    await client.query(
      `INSERT INTO donhang (
        madonhang, ngaydathang, tongtien, phivanchuyen, khoangcachkm,
        phuongthucthanhtoan, trangthaithanhtoan, trangthaidonhang, tamgiuden,
        daxacnhansuckhoe, anhsuckhoeurl, manguoidung, madiachi, mavuonuom
      ) VALUES ($1, NOW(), $2, $3, $4, $5, $6, 'ChoXacNhan', $7, false, null, $8, $9, $10)`,
      [
        maDonHang,
        tongTien,
        phiVanChuyen,
        distanceKm,
        ptt,
        ttThanhToan,
        tamGiuDen,
        maNguoiDung,
        resolvedDiaChiId,
        maVuonUom,
      ]
    );

    // 7. Insert Order Details
    let detailIndex = 1;
    for (const item of validatedItems) {
      const maChiTietDonHang = `CTDH_${Date.now()}_${detailIndex++}`;
      await client.query(
        `INSERT INTO chitietdonhang (machitietdonhang, soluong, dongia, thanhtien, madonhang, macay)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [maChiTietDonHang, item.soLuong, item.donGia, item.thanhTien, maDonHang, item.maCay]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        maDonHang,
        tongTien,
        phiVanChuyen,
        khoangCachKm: distanceKm,
        phuongThucThanhToan: ptt,
        trangThaiDonHang: 'ChoXacNhan',
        trangThaiThanhToan: ttThanhToan,
        tamGiuDen,
        chiTiet: validatedItems,
      },
      message: 'Đặt hàng thành công. Đơn hàng được giữ tồn kho trong 15 phút (BR10).',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(400).json({
      success: false,
      error: { code: 'ORDER_CREATION_FAILED', message: error.message || 'Lỗi khi tạo đơn hàng.' },
    });
  } finally {
    client.release();
  }
}

/**
 * Get orders list with filter by status or role
 */
async function getOrders(req, res) {
  try {
    const { status, nurseryId } = req.query;
    const userRole = req.user.vaiTro;
    const userId = req.user.maNguoiDung;

    let query = `
      SELECT 
        dh.madonhang, dh.ngaydathang, dh.tongtien, dh.phivanchuyen, dh.khoangcachkm,
        dh.phuongthucthanhtoan, dh.trangthaithanhtoan, dh.trangthaidonhang, dh.tamgiuden,
        dh.daxacnhansuckhoe, dh.anhsuckhoeurl, dh.manguoidung, dh.madiachi, dh.mavuonuom,
        u.hoten AS tenkhachhang, u.email AS emailkhachhang, u.sodienthoai AS sdtkhachhang,
        v.tenvuonuom,
        dc.diachichitiet, dc.vido, dc.kinhdo, dc.tennguoinhan, dc.sodienthoainguoinhan,
        COUNT(ctdh.machitietdonhang) AS tongsosanpham
      FROM donhang dh
      JOIN nguoidung u ON dh.manguoidung = u.manguoidung
      JOIN vuonuom v ON dh.mavuonuom = v.mavuonuom
      JOIN diachigiaohang dc ON dh.madiachi = dc.madiachi
      LEFT JOIN chitietdonhang ctdh ON dh.madonhang = ctdh.madonhang
      WHERE 1=1
    `;

    const params = [];

    // Customer only sees their orders
    if (userRole === 'Customer') {
      params.push(userId);
      query += ` AND dh.manguoidung = $${params.length}`;
    } else if (userRole === 'Supplier') {
      // Supplier sees orders for their nurseries
      params.push(userId);
      query += ` AND v.manhacungcap IN (
        SELECT manhacungcap FROM nhacungcap ncc 
        JOIN nguoidung nd ON (ncc.emaillienhe = nd.email OR ncc.sodienthoailienhe = nd.sodienthoai)
        WHERE nd.manguoidung = $${params.length}
      )`;
    }

    if (nurseryId) {
      params.push(nurseryId);
      query += ` AND dh.mavuonuom = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND dh.trangthaidonhang = $${params.length}`;
    }

    query += `
      GROUP BY 
        dh.madonhang, dh.ngaydathang, dh.tongtien, dh.phivanchuyen, dh.khoangcachkm,
        dh.phuongthucthanhtoan, dh.trangthaithanhtoan, dh.trangthaidonhang, dh.tamgiuden,
        dh.daxacnhansuckhoe, dh.anhsuckhoeurl, dh.manguoidung, dh.madiachi, dh.mavuonuom,
        u.hoten, u.email, u.sodienthoai, v.tenvuonuom, dc.diachichitiet, dc.vido, dc.kinhdo,
        dc.tennguoinhan, dc.sodienthoainguoinhan
      ORDER BY dh.ngaydathang DESC
    `;

    const result = await pool.query(query, params);

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
        tamGiuDen: row.tamgiuden,
        daXacNhanSucKhoe: row.daxacnhansuckhoe,
        anhSucKhoeUrl: row.anhsuckhoeurl,
        tenVuonUom: row.tenvuonuom,
        tenKhachHang: row.tenkhachhang,
        diaChiGiao: {
          tenNguoiNhan: row.tennguoinhan,
          soDienThoai: row.sodienthoainguoinhan,
          diaChiChiTiet: row.diachichitiet,
          viDo: Number(row.vido),
          kinhDo: Number(row.kinhdo),
        },
        tongSoSanPham: Number(row.tongsosanpham),
      })),
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi tải danh sách đơn hàng.' },
    });
  }
}

/**
 * Get detailed order by ID
 */
async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    const oResult = await pool.query(
      `SELECT dh.*, u.hoten, u.email, u.sodienthoai,
              v.tenvuonuom, v.diachi AS diachivuon, v.vido AS vidovuon, v.kinhdo AS kinhdovuon,
              dc.diachichitiet, dc.vido AS vidogiao, dc.kinhdo AS kinhdogiao, dc.tennguoinhan, dc.sodienthoainguoinhan
       FROM donhang dh
       JOIN nguoidung u ON dh.manguoidung = u.manguoidung
       JOIN vuonuom v ON dh.mavuonuom = v.mavuonuom
       JOIN diachigiaohang dc ON dh.madiachi = dc.madiachi
       WHERE dh.madonhang = $1`,
      [id]
    );

    if (oResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng.' },
      });
    }

    const order = oResult.rows[0];

    // Order items
    const itemsRes = await pool.query(
      `SELECT ctdh.*, c.tencay, c.tenkhoahoc, c.motakichthuoc,
              (SELECT duongdantaptin FROM taptintruyenthong WHERE macay = c.macay AND laanhchinh = true LIMIT 1) as anhchinh,
              (SELECT madanhgia FROM danhgia WHERE machitietdonhang = ctdh.machitietdonhang LIMIT 1) as madanhgia
       FROM chitietdonhang ctdh
       JOIN caycanh c ON ctdh.macay = c.macay
       WHERE ctdh.madonhang = $1`,
      [id]
    );

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
        tamGiuDen: order.tamgiuden,
        daXacNhanSucKhoe: order.daxacnhansuckhoe,
        anhSucKhoeUrl: order.anhsuckhoeurl,
        khachHang: {
          maNguoiDung: order.manguoidung,
          hoTen: order.hoten,
          email: order.email,
          soDienThoai: order.sodienthoai,
        },
        vuonUom: {
          maVuonUom: order.mavuonuom,
          tenVuonUom: order.tenvuonuom,
          diaChi: order.diachivuon,
          viDo: Number(order.vidovuon),
          kinhDo: Number(order.kinhdovuon),
        },
        diaChiGiao: {
          maDiaChi: order.madiachi,
          tenNguoiNhan: order.tennguoinhan,
          soDienThoai: order.sodienthoainguoinhan,
          diaChiChiTiet: order.diachichitiet,
          viDo: Number(order.vidogiao),
          kinhDo: Number(order.kinhdogiao),
        },
        danhSachSanPham: itemsRes.rows.map((row) => ({
          maChiTietDonHang: row.machitietdonhang,
          maCay: row.macay,
          tenCay: row.tencay,
          tenKhoaHoc: row.tenkhoahoc,
          anhChinh: row.anhchinh,
          soLuong: row.soluong,
          donGia: Number(row.dongia),
          thanhTien: Number(row.thanhtien),
          daDanhGia: Boolean(row.madanhgia),
        })),
      },
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi tải chi tiết đơn hàng.' },
    });
  }
}

/**
 * Update Order status strictly adhering to BR12, BR13, BR17
 */
async function updateOrderStatus(req, res) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { trangThaiMoi, anhSucKhoeUrl } = req.body;

    const oRes = await client.query(
      'SELECT madonhang, trangthaidonhang, daxacnhansuckhoe, mavuonuom FROM donhang WHERE madonhang = $1',
      [id]
    );

    if (oRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Đơn hàng không tồn tại.' },
      });
    }

    const currentOrder = oRes.rows[0];
    const currentState = currentOrder.trangthaidonhang;

    // Validate linear sequence (BR12)
    if (!gisService.isValidOrderTransition(currentState, trangThaiMoi)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Không thể chuyển trạng thái từ "${currentState}" sang "${trangThaiMoi}". Hệ thống tuân thủ chu trình tuyến tính (BR12).`,
        },
      });
    }

    // BR13: Transition to DangGiaoHang requires plant health verification
    if (trangThaiMoi === 'DangGiaoHang') {
      const healthPhoto = anhSucKhoeUrl || currentOrder.anhsuckhoeurl;
      if (!healthPhoto) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'HEALTH_VERIFICATION_REQUIRED',
            message: 'Bắt buộc cập nhật ảnh thực tế và xác nhận sức khỏe cây đạt chuẩn trước khi giao hàng (BR13).',
          },
        });
      }
    }

    await client.query('BEGIN');

    // Fetch items of this order
    const itemsRes = await client.query(
      'SELECT macay, soluong FROM chitietdonhang WHERE madonhang = $1',
      [id]
    );

    // If transition to DaHoanThanh: officially reduce stock and release reservation (BR17)
    if (trangThaiMoi === 'DaHoanThanh') {
      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE tonkho 
           SET soluongton = GREATEST(0, soluongton - $1),
               soluongtamgiu = GREATEST(0, soluongtamgiu - $1),
               lancapnhatcuoi = NOW()
           WHERE mavuonuom = $2 AND macay = $3`,
          [item.soluong, currentOrder.mavuonuom, item.macay]
        );
      }
      // Also mark payment complete if COD
      await client.query("UPDATE donhang SET trangthaithanhtoan = 'DaThanhToan' WHERE madonhang = $1", [id]);
    }

    // If cancelled: release reservation (BR11)
    if (trangThaiMoi === 'DaHuy') {
      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE tonkho 
           SET soluongtamgiu = GREATEST(0, soluongtamgiu - $1),
               lancapnhatcuoi = NOW()
           WHERE mavuonuom = $2 AND macay = $3`,
          [item.soluong, currentOrder.mavuonuom, item.macay]
        );
      }
    }

    // Update order status
    let healthFlag = currentOrder.daxacnhansuckhoe;
    let finalHealthUrl = currentOrder.anhsuckhoeurl;

    if (trangThaiMoi === 'DangGiaoHang') {
      healthFlag = true;
      finalHealthUrl = anhSucKhoeUrl || currentOrder.anhsuckhoeurl;
    }

    await client.query(
      `UPDATE donhang 
       SET trangthaidonhang = $1, daxacnhansuckhoe = $2, anhsuckhoeurl = $3 
       WHERE madonhang = $4`,
      [trangThaiMoi, healthFlag, finalHealthUrl, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        maDonHang: id,
        trangThaiTruoc: currentState,
        trangThaiHienTai: trangThaiMoi,
        daXacNhanSucKhoe: healthFlag,
        anhSucKhoeUrl: finalHealthUrl,
      },
      message: `Đơn hàng đã chuyển sang trạng thái: ${trangThaiMoi}.`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Lỗi cập nhật trạng thái đơn hàng.' },
    });
  } finally {
    client.release();
  }
}

/**
 * Upload & Confirm plant health before dispatch (BR13)
 */
async function confirmPlantHealth(req, res) {
  try {
    const { id } = req.params;
    const { anhSucKhoeUrl } = req.body;

    if (!anhSucKhoeUrl) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Vui lòng cung cấp link ảnh sức khỏe cây (BR13).' },
      });
    }

    const result = await pool.query(
      `UPDATE donhang 
       SET daxacnhansuckhoe = true, anhsuckhoeurl = $1 
       WHERE madonhang = $2 
       RETURNING madonhang, daxacnhansuckhoe, anhsuckhoeurl`,
      [anhSucKhoeUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Không tìm thấy đơn hàng.' },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Đã xác nhận sức khỏe cây đạt chuẩn.',
    });
  } catch (error) {
    console.error('Confirm plant health error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Lỗi xác nhận sức khỏe cây.' },
    });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  confirmPlantHealth,
};
