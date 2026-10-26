import React, { useEffect, useRef } from "react";
import L from "leaflet";

export default function InteractiveMap({
  nurseries = [],
  userLocation = null,
  onLocationSelect = null,
  height = "480px",
  showRadiusRings = true,
  selectedNurseryId = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialCenter = userLocation
        ? [userLocation.lat, userLocation.lon]
        : [10.7745, 106.7032]; // Ho Chi Minh City default

      const map = L.map(mapContainerRef.current).setView(initialCenter, 11);

      // OpenStreetMap Tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors | TMCayCanh GIS",
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Click to select location
      if (onLocationSelect) {
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          onLocationSelect(
            lat,
            lng,
            `Tọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          );
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Add Nursery Markers & Coverage Circles
    nurseries.forEach((n) => {
      const isSelected = selectedNurseryId === n.maVuonUom;

      // Custom Botanical Nursery Marker
      const nurseryIcon = L.divIcon({
        className: "custom-nursery-marker",
        html: `
          <div style="
            background: ${isSelected ? "#e11d48" : "#1b4332"};
            color: #ffffff;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-size: 16px;
          ">
            🌱
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17],
      });

      const marker = L.marker([n.viDo, n.kinhDo], { icon: nurseryIcon }).addTo(
        layer,
      );

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; min-width: 180px;">
          <strong style="color: #1b4332; font-size: 14px;">${n.tenVuonUom}</strong><br/>
          <span style="color: #64748b; font-size: 12px;">${n.diaChi}</span><br/>
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0;">
            ⭐ Đánh giá: <strong>${n.danhGiaNhaCungCap || 4.9} / 5</strong><br/>
            🚚 Bán kính giao: <strong>${n.banKinhGiaoToiDaKm} km</strong><br/>
            ${n.khoangCachKm !== undefined ? `📍 Cách bạn: <strong>${n.khoangCachKm} km</strong>` : ""}
          </div>
        </div>
      `);

      // Delivery Radius Circle ()
      if (showRadiusRings && n.banKinhGiaoToiDaKm) {
        L.circle([n.viDo, n.kinhDo], {
          radius: n.banKinhGiaoToiDaKm * 1000,
          color: isSelected ? "#e11d48" : "#2d6a4f",
          fillColor: isSelected ? "#fda4af" : "#52b788",
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: "4, 6",
        }).addTo(layer);
      }
    });

    // 2. Add User Location Marker
    if (userLocation && userLocation.lat && userLocation.lon) {
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div style="
            background: #2563eb;
            color: #ffffff;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(37,99,235,0.4);
            font-size: 15px;
          ">
            📍
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lon], {
        icon: userIcon,
        draggable: Boolean(onLocationSelect),
      }).addTo(layer);

      userMarker.bindPopup(`
        <div style="font-size: 13px;">
          <strong>Vị trí nhận hàng của bạn</strong><br/>
          <span>${userLocation.name || "Điểm ghim GPS"}</span>
        </div>
      `);

      if (onLocationSelect) {
        userMarker.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationSelect(lat, lng, "Vị trí đã kéo thả trên bản đồ");
        });
      }

      userMarkerRef.current = userMarker;
    }
  }, [nurseries, userLocation, showRadiusRings, selectedNurseryId]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        border: "1px solid var(--border-light)",
      }}
    >
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* Map Legend Overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          zIndex: 500,
          backgroundColor: "rgba(255, 255, 255, 0.92)",
          backdropFilter: "blur(6px)",
          padding: "0.4rem 0.75rem",
          borderRadius: "var(--radius-md)",
          fontSize: "0.72rem",
          boxShadow: "var(--shadow-md)",
          border: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px" }}>🌱</span> Vườn ươm đối tác
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px" }}>📍</span> Điểm nhận hàng của bạn
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              border: "1.5px dashed #2d6a4f",
              borderRadius: "50%",
              backgroundColor: "rgba(82, 183, 136, 0.2)",
            }}
          />
          Bán kính giao hàng tối đa (GIS)
        </div>
      </div>
    </div>
  );
}
