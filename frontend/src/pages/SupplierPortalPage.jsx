import React, { useState, useEffect } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import InteractiveMap from "../components/InteractiveMap";
import {
  TreePine,
  Package,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  MapPin,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function SupplierPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("orders"); // 'orders' | 'inventory' | 'nursery' | 'createPlant'

  const [orders, setOrders] = useState([]);
  const [nurseries, setNurseries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Health check modal / update state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [healthPhotoUrl, setHealthPhotoUrl] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New Nursery form state (BR03)
  const [nurseryName, setNurseryName] = useState("");
  const [nurseryAddress, setNurseryAddress] = useState("");
  const [nurseryLat, setNurseryLat] = useState(10.8672);
  const [nurseryLon, setNurseryLon] = useState(106.6853);
  const [nurseryRadius, setNurseryRadius] = useState(40);
  const [nurseryMinStock, setNurseryMinStock] = useState(5);

  // New Plant form state (, )
  const [plantName, setPlantName] = useState("");
  const [scienceName, setScienceName] = useState("");
  const [plantSize, setPlantSize] = useState("Cao 60-80cm");
  const [plantPrice, setPlantPrice] = useState(300000);
  const [plantWeight, setPlantWeight] = useState(3.5);
  const [plantDesc, setPlantDesc] = useState("");
  const [plantCare, setPlantCare] = useState("");
  const [plantCat, setPlantCat] = useState("DM_INDOOR");
  const [plantNursery, setPlantNursery] = useState("");
  const [plantMinTemp, setPlantMinTemp] = useState(18);
  const [plantMaxTemp, setPlantMaxTemp] = useState(35);
  const [plantHumidity, setPlantHumidity] = useState(65);
  const [plantSunlight, setPlantSunlight] = useState("Trong nhà");
  const [plantSoil, setPlantSoil] = useState("Đất tơi xốp, giàu mùn dừa");
  const [plantImageUrl, setPlantImageUrl] = useState("");

  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    loadSupplierData();
  }, []);

  async function loadSupplierData() {
    try {
      setLoading(true);
      const [ordRes, nursRes, catRes] = await Promise.all([
        api.get("/orders"),
        api.get("/nurseries"),
        api.get("/categories"),
      ]);
      setOrders(ordRes.data?.data || []);
      const nList = nursRes.data?.data || [];
      setNurseries(nList);
      if (nList.length > 0) setPlantNursery(nList[0].maVuonUom);
      setCategories(catRes.data?.data || []);
    } catch (err) {
      console.error("Supplier data error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Order State Transition (, , )
  const handleTransitionOrder = async (orderId, nextState) => {
    try {
      setUpdatingStatus(true);
      await api.patch(`/orders/${orderId}/status`, {
        trangThaiMoi: nextState,
        anhSucKhoeUrl: healthPhotoUrl || undefined,
      });

      setStatusMessage(
        `Đã chuyển đơn hàng #${orderId} sang trạng thái: ${nextState}`,
      );
      setSelectedOrder(null);
      setHealthPhotoUrl("");
      await loadSupplierData();
    } catch (err) {
      alert(err.message || "Lỗi cập nhật trạng thái đơn.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Create Nursery (BR03)
  const handleCreateNursery = async (e) => {
    e.preventDefault();
    try {
      await api.post("/nurseries", {
        tenVuonUom: nurseryName,
        diaChi: nurseryAddress,
        viDo: Number(nurseryLat),
        kinhDo: Number(nurseryLon),
        banKinhGiaoToiDaKm: Number(nurseryRadius),
        nguongTonKhoToiThieu: Number(nurseryMinStock),
      });

      setStatusMessage("Thiết lập vườn ươm & tọa độ GIS thành công.");
      setNurseryName("");
      setNurseryAddress("");
      await loadSupplierData();
    } catch (err) {
      alert(err.message || "Lỗi tạo vườn ươm.");
    }
  };

  // Create Plant (, )
  const handleCreatePlant = async (e) => {
    e.preventDefault();
    try {
      await api.post("/plants", {
        tenCay: plantName,
        tenKhoaHoc: scienceName,
        moTaKichThuoc: plantSize,
        giaBan: Number(plantPrice),
        moTa: plantDesc,
        huongDanChamSoc: plantCare,
        khoiLuongKg: Number(plantWeight),
        maDanhMuc: plantCat,
        maVuonUom: plantNursery,
        soLuongTonBanDau: 15,
        hinhAnhUrl: plantImageUrl,
        growthRequirement: {
          nhietDoToiThieu: Number(plantMinTemp),
          nhietDoToiDa: Number(plantMaxTemp),
          doAmToiUu: Number(plantHumidity),
          yeuCauAnhSang: plantSunlight,
          loaiDat: plantSoil,
        },
      });

      setStatusMessage(
        "Tạo sản phẩm thành công! Đã gửi Staff/Admin kiểm duyệt thuộc tính và vị trí ().",
      );
      setPlantName("");
      setScienceName("");
      setPlantDesc("");
    } catch (err) {
      alert(err.message || "Lỗi tạo cây cảnh.");
    }
  };

  return (
    <div
      className="container"
      style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--primary-600)",
              fontWeight: 700,
            }}
          >
            CỔNG DÀNH CHO NHÀ CUNG CẤP & VƯỜN ƯƠM
          </div>
          <h1
            style={{
              fontSize: "2rem",
              color: "var(--primary-900)",
              marginTop: "0.25rem",
            }}
          >
            Quản Lý Vận Hành Vườn Ươm GIS
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            className="badge badge-gis"
            style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}
          >
            ⭐ Điểm Uy Tín: 4.9 / 5 ()
          </span>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            backgroundColor: "#dcfce7",
            border: "1px solid #86efac",
            color: "#166534",
            padding: "0.85rem 1.25rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            fontWeight: 600,
          }}
        >
          ✓ {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-light)",
          marginBottom: "2rem",
        }}
      >
        {[
          { key: "orders", label: "📦 Đơn Hàng & Kiểm Định Cây" },
          { key: "nursery", label: "📍 Thiết Lập Vườn Ươm " },
          { key: "createPlant", label: "🌱 Đăng Bán Cây Mới" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.75rem 1.25rem",
              fontWeight: 700,
              fontSize: "0.9rem",
              border: "none",
              background: "none",
              cursor: "pointer",
              color:
                activeTab === tab.key
                  ? "var(--primary-700)"
                  : "var(--text-muted)",
              borderBottom:
                activeTab === tab.key
                  ? "3px solid var(--primary-700)"
                  : "3px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Orders Fulfillment & Health Check (, ) */}
      {activeTab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Danh sách đơn hàng cần tiếp nhận và xuất kho. Bạn bắt buộc phải chụp
            ảnh xác nhận sức khỏe cây trước khi chuyển sang "Đang Giao Hàng" ().
          </div>

          {orders.map((o) => (
            <div
              key={o.maDonHang}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-light)",
                padding: "1.25rem",
                boxShadow: "var(--shadow-sm)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "1rem",
                      color: "var(--primary-800)",
                    }}
                  >
                    #{o.maDonHang}
                  </span>
                  <span className={`badge badge-${o.trangThaiDonHang}`}>
                    {o.trangThaiDonHang}
                  </span>
                  {o.daXacNhanSucKhoe && (
                    <span
                      className="badge badge-climate-high"
                      style={{ fontSize: "0.7rem" }}
                    >
                      ✓ Đã xác nhận sức khỏe
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Khách: <strong>{o.tenKhachHang}</strong> | Giao:{" "}
                  {o.diaChiGiao?.diaChiChiTiet} ({o.khoangCachKm} km)
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--primary-700)",
                    fontWeight: 700,
                    marginTop: "2px",
                  }}
                >
                  Tổng tiền:{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(o.tongTien)}
                </div>
              </div>

              {/* Action Buttons depending on linear state */}
              <div
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
              >
                {o.trangThaiDonHang === "ChoXacNhan" && (
                  <button
                    onClick={() =>
                      handleTransitionOrder(o.maDonHang, "DaXacNhan")
                    }
                    className="btn btn-primary btn-sm"
                  >
                    Tiếp Nhận Đơn
                  </button>
                )}

                {o.trangThaiDonHang === "DaXacNhan" && (
                  <button
                    onClick={() =>
                      handleTransitionOrder(o.maDonHang, "DangChuanBiHang")
                    }
                    className="btn btn-secondary btn-sm"
                  >
                    Bắt Đầu Chuẩn Bị Hàng
                  </button>
                )}

                {o.trangThaiDonHang === "DangChuanBiHang" && (
                  <button
                    onClick={() => setSelectedOrder(o)}
                    className="btn btn-primary btn-sm"
                  >
                    📸 Chụp Ảnh Sức Khỏe & Giao Hàng ()
                  </button>
                )}

                {o.trangThaiDonHang === "DangGiaoHang" && (
                  <button
                    onClick={() =>
                      handleTransitionOrder(o.maDonHang, "DaHoanThanh")
                    }
                    className="btn btn-primary btn-sm"
                  >
                    Xác Nhận Đã Giao Thành Công (Trừ Kho )
                  </button>
                )}

                {o.trangThaiDonHang === "DaHoanThanh" && (
                  <span className="badge badge-climate-high">
                    ✓ Đơn Đã Hoàn Thành
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Plant Health Photo Upload Modal () */}
          {selectedOrder && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3000,
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "var(--radius-xl)",
                  padding: "2rem",
                  maxWidth: "520px",
                  width: "90%",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.25rem",
                    color: "var(--primary-900)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Kiểm Định Sức Khỏe Cây #{selectedOrder.maDonHang}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    marginBottom: "1.25rem",
                  }}
                >
                  Theo quy định , đơn vị xuất cây bắt buộc phải cập nhật link
                  ảnh thực tế cây tại vườn và xác nhận đạt chuẩn chất lượng
                  trước khi giao.
                </p>

                <div className="input-group" style={{ marginBottom: "1rem" }}>
                  <label className="input-label">
                    URL Ảnh Chụp Thực Tế Tại Vườn
                  </label>
                  <input
                    type="text"
                    value={healthPhotoUrl}
                    onChange={(e) => setHealthPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="input-field"
                  />
                  <div
                    style={{ display: "flex", gap: "0.5rem", marginTop: "6px" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setHealthPhotoUrl(
                          "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80",
                        )
                      }
                      style={{
                        fontSize: "0.75rem",
                        background: "none",
                        border: "none",
                        color: "var(--primary-700)",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Dùng ảnh mẫu cây xanh đạt chuẩn
                    </button>
                  </div>
                </div>

                {healthPhotoUrl && (
                  <div
                    style={{
                      width: "100%",
                      height: "180px",
                      borderRadius: "var(--radius-md)",
                      overflow: "hidden",
                      marginBottom: "1rem",
                    }}
                  >
                    <img
                      src={healthPhotoUrl}
                      alt="preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="btn btn-secondary"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() =>
                      handleTransitionOrder(
                        selectedOrder.maDonHang,
                        "DangGiaoHang",
                      )
                    }
                    disabled={!healthPhotoUrl || updatingStatus}
                    className="btn btn-primary"
                  >
                    {updatingStatus
                      ? "Đang lưu..."
                      : "Xác Nhận & Chuyển Sang Giao Hàng"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Setup Nursery with GIS (BR03) */}
      {activeTab === "nursery" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
          }}
        >
          <form
            onSubmit={handleCreateNursery}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-light)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <h3 style={{ fontSize: "1.15rem", color: "var(--primary-900)" }}>
              Thêm Vườn Ươm & Khai Báo Tọa Độ GIS
            </h3>

            <div className="input-group">
              <label className="input-label">Tên Vườn Ươm</label>
              <input
                type="text"
                required
                value={nurseryName}
                onChange={(e) => setNurseryName(e.target.value)}
                placeholder="Vườn Ươm Cây Kiểng ABC"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Địa chỉ thực tế</label>
              <input
                type="text"
                required
                value={nurseryAddress}
                onChange={(e) => setNurseryAddress(e.target.value)}
                placeholder="Số nhà, đường, quận/huyện, tỉnh thành..."
                className="input-field"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "1rem",
              }}
            >
              <div className="input-group">
                <label className="input-label">Vĩ Độ (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={nurseryLat}
                  onChange={(e) => setNurseryLat(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Kinh Độ (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={nurseryLon}
                  onChange={(e) => setNurseryLon(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "1rem",
              }}
            >
              <div className="input-group">
                <label className="input-label">Bán Kính Giao Tối Đa (km)</label>
                <input
                  type="number"
                  value={nurseryRadius}
                  onChange={(e) => setNurseryRadius(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">
                  Ngưỡng Tồn Kho Tối Thiểu ()
                </label>
                <input
                  type="number"
                  value={nurseryMinStock}
                  onChange={(e) => setNurseryMinStock(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: "0.5rem" }}
            >
              Lưu Vườn Ươm & Tọa Độ GIS
            </button>
          </form>

          {/* Map Preview */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-xl)",
              padding: "1rem",
              border: "1px solid var(--border-light)",
            }}
          >
            <h4
              style={{
                fontSize: "0.95rem",
                color: "var(--primary-900)",
                marginBottom: "0.75rem",
              }}
            >
              Bản Đồ Kiểm Tra Vị Trí Vườn Ươm
            </h4>
            <InteractiveMap
              nurseries={[
                {
                  maVuonUom: "NEW",
                  tenVuonUom: nurseryName || "Vườn mới",
                  viDo: nurseryLat,
                  kinhDo: nurseryLon,
                  banKinhGiaoToiDaKm: nurseryRadius,
                },
              ]}
              userLocation={{
                lat: nurseryLat,
                lon: nurseryLon,
                name: "Vị trí vườn mới",
              }}
              onLocationSelect={(lat, lon) => {
                setNurseryLat(lat);
                setNurseryLon(lon);
              }}
              height="350px"
            />
          </div>
        </div>
      )}

      {/* TAB 3: Create Plant with Growth Requirements (, ) */}
      {activeTab === "createPlant" && (
        <form
          onSubmit={handleCreatePlant}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-light)",
            padding: "2rem",
            maxWidth: "850px",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.25rem", color: "var(--primary-900)" }}>
              Đăng Bán Cây Cảnh & Cấu Hình Tham Số Sinh Trưởng 1-1 (, )
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Cây cảnh mới tạo sẽ ở trạng thái Chờ Duyệt (Pending) trước khi
              Staff/Admin xuất bản lên sàn.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "1rem",
            }}
          >
            <div className="input-group">
              <label className="input-label">Tên Cây Cảnh</label>
              <input
                type="text"
                required
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                placeholder="Cây Bàng Singapore"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Tên Khoa Học</label>
              <input
                type="text"
                value={scienceName}
                onChange={(e) => setScienceName(e.target.value)}
                placeholder="Ficus lyrata"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Giá Bán (VND)</label>
              <input
                type="number"
                required
                value={plantPrice}
                onChange={(e) => setPlantPrice(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Khối Lượng Cây (kg)</label>
              <input
                type="number"
                step="0.1"
                value={plantWeight}
                onChange={(e) => setPlantWeight(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Danh Mục</label>
              <select
                value={plantCat}
                onChange={(e) => setPlantCat(e.target.value)}
                className="input-field"
              >
                {categories.map((c) => (
                  <option key={c.maDanhMuc} value={c.maDanhMuc}>
                    {c.tenDanhMuc}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Vườn Ươm Chứa Cây</label>
              <select
                value={plantNursery}
                onChange={(e) => setPlantNursery(e.target.value)}
                className="input-field"
              >
                {nurseries.map((n) => (
                  <option key={n.maVuonUom} value={n.maVuonUom}>
                    {n.tenVuonUom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 1-1 Growth Requirements Section () */}
          <div
            style={{
              backgroundColor: "var(--surface-bg)",
              borderRadius: "var(--radius-lg)",
              padding: "1.25rem",
              border: "1px solid var(--border-light)",
            }}
          >
            <h4
              style={{
                fontSize: "0.95rem",
                color: "var(--primary-800)",
                marginBottom: "0.75rem",
              }}
            >
              Tham Số Sinh Trưởng Bắt Buộc (YeuCauSinhTruong - )
            </h4>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              <div className="input-group">
                <label className="input-label">Nhiệt Độ Tối Thiểu (°C)</label>
                <input
                  type="number"
                  value={plantMinTemp}
                  onChange={(e) => setPlantMinTemp(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nhiệt Độ Tối Đa (°C)</label>
                <input
                  type="number"
                  value={plantMaxTemp}
                  onChange={(e) => setPlantMaxTemp(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Độ Ẩm Tối Ưu (%)</label>
                <input
                  type="number"
                  value={plantHumidity}
                  onChange={(e) => setPlantHumidity(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nhu Cầu Ánh Sáng</label>
                <select
                  value={plantSunlight}
                  onChange={(e) => setPlantSunlight(e.target.value)}
                  className="input-field"
                >
                  <option value="Trong nhà">Trong nhà (Ưa râm)</option>
                  <option value="Bán râm">Bán râm</option>
                  <option value="Toàn phần">Toàn phần (Nắng trực tiếp)</option>
                </select>
              </div>

              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label className="input-label">Loại Đất Khuyên Dùng</label>
                <input
                  type="text"
                  value={plantSoil}
                  onChange={(e) => setPlantSoil(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Link Hình Ảnh Cây</label>
            <input
              type="text"
              value={plantImageUrl}
              onChange={(e) => setPlantImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="input-field"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ marginTop: "0.5rem" }}
          >
            Đăng Sản Phẩm Mới & Chờ Duyệt ()
          </button>
        </form>
      )}
    </div>
  );
}
