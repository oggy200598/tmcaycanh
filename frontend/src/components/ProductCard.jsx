import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Sparkles, Sun, Eye, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function ProductCard({ plant }) {
  const { addToCart } = useCart();

  const formattedPrice = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(plant.giaBan);

  const climateScore = plant.doPhuHopKhiHau?.score ?? 85;
  const isHighMatch = climateScore >= 75;

  return (
    <div
      className="card"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {/* Image & GIS Floating Badges */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "220px",
          overflow: "hidden",
          backgroundColor: "#e2e8f0",
        }}
      >
        <img
          src={
            plant.anhChinh ||
            "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=600&q=80"
          }
          alt={plant.tenCay}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
        />

        {/* Climate Matching Badge () */}
        <div
          style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2 }}
        >
          <span
            className={`badge ${isHighMatch ? "badge-climate-high" : "badge-climate-med"}`}
          >
            <Sparkles size={12} />{" "}
            {plant.doPhuHopKhiHau?.badge || `${climateScore}% Hợp Khí Hậu`}
          </span>
        </div>

        {/* GIS Distance Badge () */}
        {plant.khoangCachGanNhatKm !== null &&
          plant.khoangCachGanNhatKm !== undefined && (
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                zIndex: 2,
              }}
            >
              <span
                className="badge badge-gis"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <MapPin size={12} color="var(--primary-700)" />
                Vườn cách {plant.khoangCachGanNhatKm} km
              </span>
            </div>
          )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--primary-600)",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          {plant.tenDanhMuc || "Cây Cảnh"}
        </div>

        <Link to={`/products/${plant.maCay}`}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: "4px",
              color: "var(--primary-900)",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {plant.tenCay}
          </h3>
        </Link>

        <div
          style={{
            fontSize: "0.8rem",
            fontStyle: "italic",
            color: "var(--text-muted)",
            marginBottom: "8px",
          }}
        >
          {plant.tenKhoaHoc}
        </div>

        {/* Growth requirements snippet */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            backgroundColor: "var(--primary-50)",
            padding: "0.4rem 0.6rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "0.75rem",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <Sun size={12} color="var(--primary-600)" />{" "}
            {plant.yeuCauSinhTruong?.yeuCauAnhSang || "Bán râm"}
          </span>
          <span>
            🌡️ {plant.yeuCauSinhTruong?.nhietDoToiThieu ?? 18}°C -{" "}
            {plant.yeuCauSinhTruong?.nhietDoToiDa ?? 35}°C
          </span>
        </div>

        {/* Price & Action Buttons */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "0.5rem",
            borderTop: "1px solid var(--border-light)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "1.125rem",
                fontWeight: 800,
                color: "var(--primary-800)",
              }}
            >
              {formattedPrice}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Kho khả dụng: {plant.tongTonKhoDung || 10} cây
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.35rem" }}>
            <Link
              to={`/products/${plant.maCay}`}
              className="btn btn-secondary btn-sm"
              title="Xem chi tiết"
            >
              <Eye size={15} />
            </Link>
            <button
              onClick={() => addToCart(plant, plant.vuonUomGanNhat, 1)}
              className="btn btn-primary btn-sm"
              title="Thêm vào giỏ hàng"
            >
              <ShoppingCart size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
