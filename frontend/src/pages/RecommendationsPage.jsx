import React, { useState, useEffect } from "react";
import api from "../api/client";
import { useLocation } from "../context/LocationContext";
import ProductCard from "../components/ProductCard";
import {
  Sparkles,
  Thermometer,
  Droplets,
  Sun,
  Layers,
  RotateCcw,
} from "lucide-react";

export default function RecommendationsPage() {
  const { currentLocation, selectPreset, presets } = useLocation();

  const [temp, setTemp] = useState(currentLocation.temp || 28);
  const [humidity, setHumidity] = useState(currentLocation.humidity || 70);
  const [sunlight, setSunlight] = useState("Trong nhà");
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendedPlants() {
      try {
        setLoading(true);
        const res = await api.get(
          `/plants?lat=${currentLocation.lat}&lon=${currentLocation.lon}&temp=${temp}&humidity=${humidity}&sunlight=${sunlight}`,
        );
        let list = res.data?.data || [];
        // Sort by climate match score descending
        list.sort(
          (a, b) =>
            (b.doPhuHopKhiHau?.score ?? 0) - (a.doPhuHopKhiHau?.score ?? 0),
        );
        setPlants(list);
      } catch (err) {
        console.error("Fetch recommendations error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendedPlants();
  }, [currentLocation, temp, humidity, sunlight]);

  const handleSelectPreset = (p) => {
    selectPreset(p);
    setTemp(p.temp || 28);
    setHumidity(p.humidity || 70);
  };

  return (
    <div
      className="container"
      style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}
    >
      <div style={{ maxWidth: "800px", marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "var(--primary-100)",
            color: "var(--primary-800)",
            padding: "0.35rem 0.85rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.8rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
          }}
        >
          <Sparkles size={14} /> SPATIAL MATCHING ENGINE ()
        </div>
        <h1
          style={{
            fontSize: "2.25rem",
            color: "var(--primary-900)",
            marginBottom: "0.5rem",
          }}
        >
          Gợi Ý Cây Cảnh Tương Thích Khí Hậu & Thổ Nhưỡng
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          }}
        >
          Hệ sinh thái tự động so sánh dải nhiệt độ, độ ẩm tối ưu và nhu cầu ánh
          sáng của từng loại cây trong cơ sở dữ liệu với điều kiện sống thực tế
          tại khu vực bạn đang ở.
        </p>
      </div>

      {/* Environmental Parameter Controls */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border-light)",
          padding: "1.75rem",
          boxShadow: "var(--shadow-md)",
          marginBottom: "2.5rem",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "var(--primary-900)",
            fontSize: "1.05rem",
            marginBottom: "1rem",
          }}
        >
          Điều Chỉnh Thông Số Môi Trường Tại Nhà / Văn Phòng Của Bạn:
        </div>

        {/* Quick Regional Presets */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "1.5rem",
          }}
        >
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(p)}
              className={`btn btn-sm ${currentLocation.name === p.name ? "btn-primary" : "btn-secondary"}`}
            >
              📍 {p.name} ({p.temp}°C, {p.humidity}%)
            </button>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
          }}
        >
          {/* Temperature Slider */}
          <div className="input-group">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label
                className="input-label"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Thermometer size={16} color="#ea580c" /> Nhiệt độ môi trường
              </label>
              <strong style={{ color: "#ea580c" }}>{temp}°C</strong>
            </div>
            <input
              type="range"
              min="10"
              max="42"
              value={temp}
              onChange={(e) => setTemp(Number(e.target.value))}
              style={{ accentColor: "#ea580c" }}
            />
          </div>

          {/* Humidity Slider */}
          <div className="input-group">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <label
                className="input-label"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Droplets size={16} color="#0284c7" /> Độ ẩm không khí
              </label>
              <strong style={{ color: "#0284c7" }}>{humidity}%</strong>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              value={humidity}
              onChange={(e) => setHumidity(Number(e.target.value))}
              style={{ accentColor: "#0284c7" }}
            />
          </div>

          {/* Sunlight Condition */}
          <div className="input-group">
            <label
              className="input-label"
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Sun size={16} color="var(--primary-600)" /> Vị trí đặt cây dự
              kiến
            </label>
            <select
              value={sunlight}
              onChange={(e) => setSunlight(e.target.value)}
              className="input-field"
            >
              <option value="Trong nhà">
                Phòng khách / Bàn làm việc (Trong nhà)
              </option>
              <option value="Bán râm">
                Ban công / Cửa sổ thoáng (Bán râm)
              </option>
              <option value="Toàn phần">
                Sân thượng / Sân vườn (Nắng toàn phần)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Recommended Plants Grid */}
      <h2
        style={{
          fontSize: "1.5rem",
          color: "var(--primary-900)",
          marginBottom: "1.25rem",
        }}
      >
        Xếp Hạng Cây Thích Nghi Nhất (Từ Cao Xuống Thấp)
      </h2>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--text-muted)",
          }}
        >
          Đang tính toán ma trận tương thích không gian...
        </div>
      ) : (
        <div className="grid-cols-4">
          {plants.map((plant) => (
            <ProductCard key={plant.maCay} plant={plant} />
          ))}
        </div>
      )}
    </div>
  );
}
