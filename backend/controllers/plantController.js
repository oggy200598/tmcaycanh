const { pool } = require("../config/db");
const gisService = require("../services/gisService");

/**
 * Get plant listing with category, GIS distance, and climate compatibility (, , )
 */
async function getPlants(req, res) {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      sunlight,
      lat,
      lon,
      radiusKm,
      temp,
      humidity,
      status,
    } = req.query;

    let query = `
      SELECT 
        c.macay, c.tencay, c.tenkhoahoc, c.motakichthuoc, c.giaban, c.mota, 
        c.huongdanchamsoc, c.khoiluongkg, c.trangthai, c.daxuatban, c.madanhmuc,
        dm.tendanhmuc,
        y.nhietdotoithieu, y.nhietdotoida, y.doamtoiuu, y.yeucauanhsang, y.loaidat,
        t.duongdantaptin AS anhchinh,
        COALESCE(SUM(tk.soluongton - tk.soluongtamgiu), 0) AS tongtonkhodung
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
      WHERE 1=1
    `;

    const params = [];

    // Filter public published plants unless admin/staff queries all
    if (status) {
      params.push(status);
      query += ` AND c.trangthai ILIKE $${params.length}`;
    } else {
      query += ` AND c.daxuatban = true AND c.trangthai ILIKE 'active'`;
    }

    if (category) {
      params.push(category);
      query += ` AND c.madanhmuc = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(c.tencay) LIKE $${params.length} OR LOWER(c.tenkhoahoc) LIKE $${params.length})`;
    }

    if (minPrice) {
      params.push(Number(minPrice));
      query += ` AND c.giaban >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(Number(maxPrice));
      query += ` AND c.giaban <= $${params.length}`;
    }

    if (sunlight) {
      params.push(sunlight);
      query += ` AND y.yeucauanhsang = $${params.length}`;
    }

    query += `
      GROUP BY 
        c.macay, c.tencay, c.tenkhoahoc, c.motakichthuoc, c.giaban, c.mota, 
        c.huongdanchamsoc, c.khoiluongkg, c.trangthai, c.daxuatban, c.madanhmuc,
        dm.tendanhmuc, y.nhietdotoithieu, y.nhietdotoida, y.doamtoiuu, y.yeucauanhsang, y.loaidat,
        t.duongdantaptin
      ORDER BY c.giaban ASC
    `;

    const result = await pool.query(query, params);

    // If user coordinates provided, compute GIS distance to nearest nursery and spatial matching (, )
    let nurseries = [];
    if (lat && lon) {
      const nRes = await pool.query(`
        SELECT v.mavuonuom, v.tenvuonuom, v.vido, v.kinhdo, v.bankinhgiaotoidakm, tk.macay, (tk.soluongton - tk.soluongtamgiu) AS tonkhadung
        FROM vuonuom v
        JOIN tonkho tk ON v.mavuonuom = tk.mavuonuom
        WHERE (tk.soluongton - tk.soluongtamgiu) > 0
      `);
      nurseries = nRes.rows;
    }

    const userLat = lat ? Number(lat) : null;
    const userLon = lon ? Number(lon) : null;
    const maxRadius = radiusKm ? Number(radiusKm) : 50;

    const currentClimate = {
      nhietDo: temp ? Number(temp) : 28,
      doAm: humidity ? Number(humidity) : 70,
      anhSang: sunlight || "Trong nhà",
    };

    let items = result.rows.map((plant) => {
      // Calculate climate compatibility ()
      const climateMatch = gisService.calculateClimateCompatibility(
        {
          nhietdotoithieu: plant.nhietdotoithieu,
          nhietdotoida: plant.nhietdotoida,
          doamtoiuu: plant.doamtoiuu,
          yeucauanhsang: plant.yeucauanhsang,
          loaidat: plant.loaidat,
        },
        currentClimate,
      );

      let nearestNursery = null;
      let minDistanceKm = null;
      let withinDeliveryRadius = true;

      if (userLat && userLon) {
        const availableNurseries = nurseries.filter(
          (n) => n.macay === plant.macay,
        );
        for (const n of availableNurseries) {
          const dist = gisService.calculateDistance(
            userLat,
            userLon,
            Number(n.vido),
            Number(n.kinhdo),
          );
          if (minDistanceKm === null || dist < minDistanceKm) {
            minDistanceKm = dist;
            nearestNursery = {
              maVuonUom: n.mavuonuom,
              tenVuonUom: n.tenvuonuom,
              khoangCachKm: dist,
              banKinhGiaoToiDaKm: Number(n.bankinhgiaotoidakm),
              tonKhaDung: Number(n.tonkhadung),
            };
          }
        }

        if (nearestNursery) {
          withinDeliveryRadius =
            nearestNursery.khoangCachKm <= nearestNursery.banKinhGiaoToiDaKm;
        }
      }

      return {
        maCay: plant.macay,
        tenCay: plant.tencay,
        tenKhoaHoc: plant.tenkhoahoc,
        moTaKichThuoc: plant.motakichthuoc,
        giaBan: Number(plant.giaban),
        moTa: plant.mota,
        huongDanChamSoc: plant.huongdanchamsoc,
        khoiLuongKg: Number(plant.khoiluongkg),
        trangThai: plant.trangthai,
        daXuatBan: plant.daxuatban,
        maDanhMuc: plant.madanhmuc,
        tenDanhMuc: plant.tendanhmuc,
        anhChinh: plant.anhchinh,
        tongTonKhoDung: Number(plant.tongtonkhodung),
        yeuCauSinhTruong: {
          nhietDoToiThieu: Number(plant.nhietdotoithieu),
          nhietDoToiDa: Number(plant.nhietdotoida),
          doAmToiUu: Number(plant.doamtoiuu),
          yeuCauAnhSang: plant.yeucauanhsang,
          loaiDat: plant.loaidat,
        },
        doPhuHopKhiHau: climateMatch,
        khoangCachGanNhatKm: minDistanceKm,
        vuonUomGanNhat: nearestNursery,
        hopLeBanKinhGiao: withinDeliveryRadius,
      };
    });

    // Spatial filter by radius if radiusKm requested ()
    if (userLat && userLon && radiusKm) {
      items = items.filter(
        (p) =>
          p.khoangCachGanNhatKm !== null && p.khoangCachGanNhatKm <= maxRadius,
      );
    }

    res.json({
      success: true,
      data: items,
      meta: {
        total: items.length,
        userLocation:
          userLat && userLon ? { lat: userLat, lon: userLon } : null,
      },
    });
  } catch (error) {
    console.error("Get plants error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tải danh sách cây cảnh." },
    });
  }
}

/**
 * Get plant detail by ID with images, nurseries, reviews, and growth requirements
 */
async function getPlantById(req, res) {
  try {
    const { id } = req.params;
    const { lat, lon } = req.query;

    const pResult = await pool.query(
      `SELECT c.*, dm.tendanhmuc, y.mayeucau, y.nhietdotoithieu, y.nhietdotoida, y.doamtoiuu, y.yeucauanhsang, y.loaidat
       FROM caycanh c
       LEFT JOIN danhmuc dm ON c.madanhmuc = dm.madanhmuc
       LEFT JOIN yeucausinhtruong y ON c.macay = y.macay
       WHERE c.macay = $1`,
      [id],
    );

    if (pResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Không tìm thấy thông tin cây cảnh.",
        },
      });
    }

    const plant = pResult.rows[0];

    // Images
    const imgResult = await pool.query(
      "SELECT matruyenthong, loaitruyenthong, duongdantaptin, laanhchinh FROM taptintruyenthong WHERE macay = $1 ORDER BY laanhchinh DESC",
      [id],
    );

    // Nurseries stocking this plant
    const nResult = await pool.query(
      `SELECT v.mavuonuom, v.tenvuonuom, v.diachi, v.vido, v.kinhdo, v.bankinhgiaotoidakm, v.danhgianhacungcap,
              tk.soluongton, tk.soluongtamgiu, (tk.soluongton - tk.soluongtamgiu) AS tonkhadung,
              ncc.tencongty, ncc.diemuytin
       FROM tonkho tk
       JOIN vuonuom v ON tk.mavuonuom = v.mavuonuom
       JOIN nhacungcap ncc ON v.manhacungcap = ncc.manhacungcap
       WHERE tk.macay = $1`,
      [id],
    );

    const userLat = lat ? Number(lat) : null;
    const userLon = lon ? Number(lon) : null;

    const nurseries = nResult.rows.map((n) => {
      let distanceKm = null;
      let withinRadius = true;
      let shippingFee = null;

      if (userLat && userLon) {
        distanceKm = gisService.calculateDistance(
          userLat,
          userLon,
          Number(n.vido),
          Number(n.kinhdo),
        );
        withinRadius = distanceKm <= Number(n.bankinhgiaotoidakm);
        shippingFee = gisService.calculateShippingFee(
          distanceKm,
          Number(plant.khoiluongkg),
        );
      }

      return {
        maVuonUom: n.mavuonuom,
        tenVuonUom: n.tenvuonuom,
        diaChi: n.diachi,
        viDo: Number(n.vido),
        kinhDo: Number(n.kinhdo),
        banKinhGiaoToiDaKm: Number(n.bankinhgiaotoidakm),
        danhGiaVuon: Number(n.danhgianhacungcap),
        tenCongTy: n.tencongty,
        diemUyTin: Number(n.diemuytin),
        soLuongTon: n.soluongton,
        soLuongTamGiu: n.soluongtamgiu,
        tonKhaDung: Number(n.tonkhadung),
        khoangCachKm: distanceKm,
        trongBanKinhGiao: withinRadius,
        phiVanChuyenUocTinh: shippingFee,
      };
    });

    // Reviews ()
    const revResult = await pool.query(
      `SELECT dg.madanhgia, dg.sosaodanhgia, dg.binhluan, dg.duongdantruyenthong, dg.ngaytao, u.hoten
       FROM danhgia dg
       JOIN chitietdonhang ctdh ON dg.machitietdonhang = ctdh.machitietdonhang
       JOIN donhang dh ON dg.madonhang = dh.madonhang
       JOIN nguoidung u ON dh.manguoidung = u.manguoidung
       WHERE ctdh.macay = $1
       ORDER BY dg.ngaytao DESC`,
      [id],
    );

    const avgStars =
      revResult.rows.length > 0
        ? revResult.rows.reduce((sum, r) => sum + r.sosaodanhgia, 0) /
          revResult.rows.length
        : 5.0;

    // Climate match
    const climateMatch = gisService.calculateClimateCompatibility({
      nhietdotoithieu: Number(plant.nhietdotoithieu),
      nhietdotoida: Number(plant.nhietdotoida),
      doamtoiuu: Number(plant.doamtoiuu),
      yeucauanhsang: plant.yeucauanhsang,
      loaidat: plant.loaidat,
    });

    res.json({
      success: true,
      data: {
        maCay: plant.macay,
        tenCay: plant.tencay,
        tenKhoaHoc: plant.tenkhoahoc,
        moTaKichThuoc: plant.motakichthuoc,
        giaBan: Number(plant.giaban),
        moTa: plant.mota,
        huongDanChamSoc: plant.huongdanchamsoc,
        khoiLuongKg: Number(plant.khoiluongkg),
        trangThai: plant.trangthai,
        daXuatBan: plant.daxuatban,
        maDanhMuc: plant.madanhmuc,
        tenDanhMuc: plant.tendanhmuc,
        yeuCauSinhTruong: {
          maYeuCau: plant.mayeucau,
          nhietDoToiThieu: Number(plant.nhietdotoithieu),
          nhietDoToiDa: Number(plant.nhietdotoida),
          doAmToiUu: Number(plant.doamtoiuu),
          yeuCauAnhSang: plant.yeucauanhsang,
          loaiDat: plant.loaidat,
        },
        doPhuHopKhiHau: climateMatch,
        hinhAnh: imgResult.rows.map((img) => ({
          maTruyenThong: img.matruyenthong,
          loai: img.loaitruyenthong,
          duongDan: img.duongdantaptin,
          laAnhChinh: img.laanhchinh,
        })),
        danhSachVuonUom: nurseries,
        danhGia: revResult.rows.map((r) => ({
          maDanhGia: r.madanhgia,
          soSao: r.sosaodanhgia,
          binhLuan: r.binhluan,
          hinhAnh: r.duongdantruyenthong,
          ngayTao: r.ngaytao,
          nguoiDanhGia: r.hoten,
        })),
        diemDanhGiaTrungBinh: Math.round(avgStars * 10) / 10,
        tongDanhGia: revResult.rows.length,
      },
    });
  } catch (error) {
    console.error("Get plant detail error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tải chi tiết cây cảnh." },
    });
  }
}

/**
 * Supplier creates a plant (Starts in 'Pending' status awaiting Staff approval , )
 */
async function createPlant(req, res) {
  const client = await pool.connect();
  try {
    const {
      tenCay,
      tenKhoaHoc,
      moTaKichThuoc,
      giaBan,
      moTa,
      huongDanChamSoc,
      khoiLuongKg,
      maDanhMuc,
      hinhAnhUrl,
      maVuonUom,
      soLuongTonBanDau,
      growthRequirement,
    } = req.body;

    if (!tenCay || !giaBan || !maDanhMuc || !growthRequirement || !maVuonUom) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message:
            "Vui lòng điền đầy đủ thông tin cây và thông số sinh trưởng.",
        },
      });
    }

    if (growthRequirement.nhietDoToiThieu >= growthRequirement.nhietDoToiDa) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_GROWTH_PARAMS",
          message: "Nhiệt độ tối thiểu phải nhỏ hơn nhiệt độ tối đa.",
        },
      });
    }

    await client.query("BEGIN");

    const maCay = `CAY_${Date.now()}`;
    const initialStatus = "Pending"; //

    await client.query(
      `INSERT INTO caycanh (macay, tencay, tenkhoahoc, motakichthuoc, giaban, mota, huongdanchamsoc, khoiluongkg, trangthai, daxuatban, madanhmuc)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        maCay,
        tenCay,
        tenKhoaHoc || "",
        moTaKichThuoc || "",
        giaBan,
        moTa || "",
        huongDanChamSoc || "",
        khoiLuongKg || 2.0,
        initialStatus,
        false,
        maDanhMuc,
      ],
    );

    // 1-to-1 YeuCauSinhTruong ()
    const maYeuCau = `YC_${Date.now()}`;
    await client.query(
      `INSERT INTO yeucausinhtruong (mayeucau, nhietdotoithieu, nhietdotoida, doamtoiuu, yeucauanhsang, loaidat, macay)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        maYeuCau,
        growthRequirement.nhietDoToiThieu,
        growthRequirement.nhietDoToiDa,
        growthRequirement.doAmToiUu || 65,
        growthRequirement.yeucauAnhSang || "Bán râm",
        growthRequirement.loaiDat || "Đất hữu cơ tơi xốp",
        maCay,
      ],
    );

    // Media
    const imgUrl = hinhAnhUrl || "/assets/images/cay_van_nien_thanh.png";
    await client.query(
      `INSERT INTO taptintruyenthong (matruyenthong, loaitruyenthong, duongdantaptin, dungluongbyte, laanhchinh, macay)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`MED_${Date.now()}`, "image", imgUrl, 250000, true, maCay],
    );

    // Initial Inventory (TonKho)
    const initStock = soLuongTonBanDau ? Number(soLuongTonBanDau) : 10;
    await client.query(
      `INSERT INTO tonkho (matonkho, soluongton, soluongtamgiu, lancapnhatcuoi, mavuonuom, macay)
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [`TK_${Date.now()}`, initStock, 0, maVuonUom, maCay],
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: { maCay, tenCay, trangThai: initialStatus, daXuatBan: false },
      message:
        "Tạo sản phẩm thành công. Sản phẩm đang chờ Staff/Admin phê duyệt.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create plant error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi tạo cây cảnh mới." },
    });
  } finally {
    client.release();
  }
}

/**
 * Staff/Admin approves or rejects plant ()
 */
async function updatePlantStatus(req, res) {
  try {
    const { id } = req.params;
    const { trangThai, daXuatBan } = req.body;

    if (!["Active", "Rejected", "Pending"].includes(trangThai)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STATUS", message: "Trạng thái không hợp lệ." },
      });
    }

    const isPublished =
      trangThai === "Active" ? Boolean(daXuatBan ?? true) : false;

    const result = await pool.query(
      `UPDATE caycanh 
       SET trangthai = $1, daxuatban = $2 
       WHERE macay = $3 
       RETURNING macay, tencay, trangthai, daxuatban`,
      [trangThai, isPublished, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Không tìm thấy cây cảnh." },
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Đã cập nhật trạng thái cây sang ${trangThai}.`,
    });
  } catch (error) {
    console.error("Update plant status error:", error);
    res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "Lỗi cập nhật trạng thái cây." },
    });
  }
}

module.exports = {
  getPlants,
  getPlantById,
  createPlant,
  updatePlantStatus,
};
