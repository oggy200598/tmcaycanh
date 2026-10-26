import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useLocation } from "../context/LocationContext";
import { useCart } from "../context/CartContext";
import {
  Sparkles,
  MapPin,
  Sun,
  Thermometer,
  Droplets,
  Layers,
  Scale,
  ShieldCheck,
  Truck,
  CheckCircle,
  AlertTriangle,
  Star,
  ShoppingCart,
} from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLocation } = useLocation();
  const { addToCart } = useCart();

  const [plant, setPlant] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedNursery, setSelectedNursery] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPlantDetail() {
      try {
        setLoading(true);
        const res = await api.get(
          `/plants/${id}?lat=${currentLocation.lat}&lon=${currentLocation.lon}`,
        );
        const data = res.data?.data;
        setPlant(data);

        if (data.hinhAnh && data.hinhAnh.length > 0) {
          const main =
            data.hinhAnh.find((img) => img.laAnhChinh) || data.hinhAnh[0];
          setSelectedImage(main.duongDan);
        }

        // Auto select first available nursery within radius
        if (data.danhSachVuonUom && data.danhSachVuonUom.length > 0) {
          const defaultNursery =
            data.danhSachVuonUom.find(
              (n) => n.trongBanKinhGiao && n.tonKhaDung > 0,
            ) || data.danhSachVuonUom[0];
          setSelectedNursery(defaultNursery);
        }
      } catch (err) {
        setError(err.message || "Không thể tải thông tin cây cảnh.");
      } finally {
        setLoading(false);
      }
    }

    loadPlantDetail();
  }, [id, currentLocation]);

  const handleAddToCart = () => {
    if (!plant || !selectedNursery) return;
    addToCart(plant, selectedNursery, quantity);
    navigate("/cart");
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{
          padding: "6rem 0",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        Đang nạp chi tiết cây và thông số sinh thái GIS...
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div
        className="container"
        style={{ padding: "6rem 0", textAlign: "center" }}
      >
        <h2 style={{ color: "var(--danger)", marginBottom: "1rem" }}>
          {error || "Không tìm thấy sản phẩm"}
        </h2>
        <button
          onClick={() => navigate("/products")}
          className="btn btn-primary"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(plant.giaBan);

  const climateScore = plant.doPhuHopKhiHau?.score ?? 85;

  return (
    <div
      className="container"
      style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}
    >
      {/* Top Breadcrumb */}
      <div
        style={{
          fontSize: "0.85rem",
          color: "var(--text-muted)",
          marginBottom: "1.5rem",
        }}
      >
        Trang chủ / {plant.tenDanhMuc} /{" "}
        <span style={{ color: "var(--text-main)", fontWeight: 600 }}>
          {plant.tenCay}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "3rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Image Gallery */}
        <div>
          <div
            style={{
              width: "100%",
              height: "460px",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              backgroundColor: "#ffffff",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-md)",
              position: "relative",
            }}
          >
            <img
              src={
                selectedImage ||
                "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=800&q=80"
              }
              alt={plant.tenCay}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            {/* Climate Badge */}
            <div style={{ position: "absolute", top: "16px", left: "16px" }}>
              <span
                className={`badge ${climateScore >= 75 ? "badge-climate-high" : "badge-climate-med"}`}
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
              >
                <Sparkles size={14} /> {plant.doPhuHopKhiHau?.badge}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {plant.hinhAnh && plant.hinhAnh.length > 1 && (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              {plant.hinhAnh.map((img) => (
                <div
                  key={img.maTruyenThong}
                  onClick={() => setSelectedImage(img.duongDan)}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    cursor: "pointer",
                    border:
                      selectedImage === img.duongDan
                        ? "2px solid var(--primary-600)"
                        : "1px solid var(--border-light)",
                  }}
                >
                  <img
                    src={img.duongDan}
                    alt="thumb"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Plant Metadata & Order Form */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--primary-600)",
                textTransform: "uppercase",
              }}
            >
              {plant.tenDanhMuc}
            </div>
            <h1
              style={{
                fontSize: "2.25rem",
                color: "var(--primary-900)",
                margin: "0.25rem 0",
              }}
            >
              {plant.tenCay}
            </h1>
            <div
              style={{
                fontStyle: "italic",
                color: "var(--text-muted)",
                fontSize: "1rem",
              }}
            >
              {plant.tenKhoaHoc}
            </div>
          </div>

          <div
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "var(--primary-800)",
              display: "flex",
              alignItems: "baseline",
              gap: "0.75rem",
            }}
          >
            {formattedPrice}
            <span
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              (Đã bao gồm chậu & bảo dưỡng ban đầu)
            </span>
          </div>

          {/* Environmental Climate Matching Gauge () */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              padding: "1.25rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 700,
                  color: "var(--primary-900)",
                }}
              >
                <Sparkles size={18} color="var(--primary-600)" />
                Đối Chiếu Thổ Nhưỡng GIS ({currentLocation.name})
              </div>
              <span
                style={{
                  fontWeight: 800,
                  color: climateScore >= 75 ? "var(--primary-700)" : "#d97706",
                  fontSize: "1.1rem",
                }}
              >
                {climateScore}%
              </span>
            </div>

            {/* Meter Bar */}
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#e2e8f0",
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  width: `${climateScore}%`,
                  height: "100%",
                  backgroundColor:
                    climateScore >= 75 ? "var(--primary-500)" : "#f59e0b",
                  transition: "width 0.5s ease",
                }}
              />
            </div>

            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}
            >
              Dựa vào vị trí nhận hàng của bạn tại {currentLocation.name}, cây
              có mức độ thích nghi <strong>{climateScore}%</strong>. Cây sinh
              trưởng tốt trong dải nhiệt độ{" "}
              {plant.yeuCauSinhTruong?.nhietDoToiThieu}°C -{" "}
              {plant.yeuCauSinhTruong?.nhietDoToiDa}°C và môi trường ánh sáng{" "}
              {plant.yeuCauSinhTruong?.yeuCauAnhSang}.
            </p>
          </div>

          {/* 1-1 Growth Requirements Specs () */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0.75rem",
              backgroundColor: "var(--surface-bg)",
              padding: "1rem",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Sun size={18} color="var(--primary-600)" />
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Ánh Sáng
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {plant.yeuCauSinhTruong?.yeuCauAnhSang}
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Thermometer size={18} color="#ea580c" />
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Nhiệt Độ Thích Hợp
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {plant.yeuCauSinhTruong?.nhietDoToiThieu}°C -{" "}
                  {plant.yeuCauSinhTruong?.nhietDoToiDa}°C
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Droplets size={18} color="#0284c7" />
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Độ Ẩm Tối Ưu
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {plant.yeuCauSinhTruong?.doAmToiUu}%
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Layers size={18} color="#65a30d" />
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Loại Đất Khuyên Dùng
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {plant.yeuCauSinhTruong?.loaiDat}
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Scale size={18} color="var(--primary-600)" />
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Khối Lượng
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {plant.khoiLuongKg} kg
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ShieldCheck size={18} color="var(--primary-600)" />
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Kích Thước Thân
                </div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {plant.moTaKichThuoc}
                </div>
              </div>
            </div>
          </div>

          {/* Select Nursery & GIS Delivery Info (, ) */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "var(--primary-900)",
                marginBottom: "0.5rem",
              }}
            >
              Chọn Vườn Ươm Xuất Hàng Gần Nhất (GIS):
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {plant.danhSachVuonUom?.map((n) => {
                const isSelected = selectedNursery?.maVuonUom === n.maVuonUom;
                return (
                  <div
                    key={n.maVuonUom}
                    onClick={() => setSelectedNursery(n)}
                    style={{
                      border: isSelected
                        ? "2px solid var(--primary-600)"
                        : "1px solid var(--border-light)",
                      backgroundColor: isSelected
                        ? "var(--primary-50)"
                        : "#ffffff",
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          color: "var(--primary-900)",
                        }}
                      >
                        {n.tenVuonUom}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {n.diaChi}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--primary-700)",
                          marginTop: "2px",
                        }}
                      >
                        Kho khả dụng: <strong>{n.tonKhaDung} cây</strong> | ⭐{" "}
                        {n.danhGiaVuon} / 5
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {n.khoangCachKm !== null && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--text-main)",
                          }}
                        >
                          📍 Cách {n.khoangCachKm} km
                        </div>
                      )}
                      {n.trongBanKinhGiao ? (
                        <span
                          className="badge badge-gis"
                          style={{ marginTop: "4px" }}
                        >
                          Phí ship: ~
                          {new Intl.NumberFormat("vi-VN").format(
                            n.phiVanChuyenUocTinh || 25000,
                          )}{" "}
                          đ
                        </span>
                      ) : (
                        <span
                          className="badge badge-DaHuy"
                          style={{ marginTop: "4px" }}
                        >
                          Vượt bán kính ({n.banKinhGiaoToiDaKm}km)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              marginTop: "0.5rem",
            }}
          >
            {/* Quantity */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{
                  padding: "0.5rem 0.85rem",
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                -
              </button>
              <span
                style={{
                  padding: "0.5rem 1rem",
                  fontWeight: 600,
                  minWidth: "40px",
                  textAlign: "center",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{
                  padding: "0.5rem 0.85rem",
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="btn btn-primary btn-lg"
              style={{ flexGrow: 1 }}
              disabled={!selectedNursery || !selectedNursery.trongBanKinhGiao}
            >
              <ShoppingCart size={18} /> Mua Ngay
            </button>
          </div>

          {/* Customer Reviews List () */}
          <div
            style={{
              borderTop: "1px solid var(--border-light)",
              paddingTop: "1.5rem",
              marginTop: "1rem",
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                color: "var(--primary-900)",
                marginBottom: "1rem",
              }}
            >
              Đánh Giá Từ Khách Hàng ({plant.tongDanhGia || 0})
            </h3>

            {plant.danhGia && plant.danhGia.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {plant.danhGia.map((rev) => (
                  <div
                    key={rev.maDanhGia}
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid var(--border-light)",
                      padding: "1rem",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                        {rev.nguoiDanhGia}
                      </span>
                      <div style={{ display: "flex", color: "#f59e0b" }}>
                        {[...Array(rev.soSao)].map((_, i) => (
                          <Star key={i} size={14} fill="#f59e0b" />
                        ))}
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.5,
                      }}
                    >
                      "{rev.binhLuan}"
                    </p>
                    {rev.hinhAnh && (
                      <img
                        src={rev.hinhAnh}
                        alt="review"
                        style={{
                          width: "60px",
                          height: "60px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          marginTop: "6px",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Chưa có đánh giá nào cho cây này. Hãy là người đầu tiên mua và
                nhận xét!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
