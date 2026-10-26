import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import api from "../api/client";
import InteractiveMap from "../components/InteractiveMap";
import {
  Trash2,
  MapPin,
  Truck,
  ShieldCheck,
  CreditCard,
  AlertCircle,
  Clock,
  ArrowRight,
  TreePine,
} from "lucide-react";

export default function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subTotal,
    totalWeightKg,
    selectedNursery,
    setSelectedNursery,
  } = useCart();
  const { user } = useAuth();
  const { currentLocation } = useLocation();
  const navigate = useNavigate();

  const [pinLocation, setPinLocation] = useState({
    lat: currentLocation.lat,
    lon: currentLocation.lon,
    address: currentLocation.name || "Địa chỉ ghim trên bản đồ",
  });

  const [receiverName, setReceiverName] = useState(user?.hoTen || "");
  const [receiverPhone, setReceiverPhone] = useState(user?.soDienThoai || "");
  const [detailAddress, setDetailAddress] = useState(
    "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1",
  );
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // GIS Distance & Shipping calculations
  const [distanceKm, setDistanceKm] = useState(0);
  const [shippingFee, setShippingFee] = useState(25000);
  const [withinRadius, setWithinRadius] = useState(true);

  // Auto-fetch missing GIS coordinates for selected nursery if loaded from simple state
  useEffect(() => {
    if (!selectedNursery?.maVuonUom) return;
    const nLat = Number(selectedNursery.viDo ?? selectedNursery.vido);
    const nLon = Number(selectedNursery.kinhDo ?? selectedNursery.kinhdo);

    if (isNaN(nLat) || isNaN(nLon)) {
      api
        .get(`/nurseries/${selectedNursery.maVuonUom}`)
        .then((res) => {
          const detail = res.data?.data;
          if (detail && detail.viDo !== undefined) {
            setSelectedNursery((prev) => ({
              ...prev,
              ...detail,
              viDo: Number(detail.viDo),
              kinhDo: Number(detail.kinhDo),
              banKinhGiaoToiDaKm: Number(detail.banKinhGiaoToiDaKm || 30),
            }));
          }
        })
        .catch(console.error);
    }
  }, [selectedNursery?.maVuonUom, setSelectedNursery]);

  useEffect(() => {
    if (!selectedNursery || !pinLocation) return;

    const nLat = Number(selectedNursery.viDo ?? selectedNursery.vido ?? selectedNursery.lat);
    const nLon = Number(selectedNursery.kinhDo ?? selectedNursery.kinhdo ?? selectedNursery.lon);
    const pLat = Number(pinLocation.lat);
    const pLon = Number(pinLocation.lon);

    if (isNaN(nLat) || isNaN(nLon) || isNaN(pLat) || isNaN(pLon)) {
      setDistanceKm(0);
      setShippingFee(25000);
      setWithinRadius(true);
      return;
    }

    // Haversine distance
    const toRad = (v) => (v * Math.PI) / 180;
    const dLat = toRad(pLat - nLat);
    const dLon = toRad(pLon - nLon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(nLat)) *
        Math.cos(toRad(pLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(6371 * c * 100) / 100;
    setDistanceKm(dist);

    const radius = Number(
      selectedNursery.banKinhGiaoToiDaKm ??
        selectedNursery.bankinhgiaotoidakm ??
        45,
    );
    const isCovered = dist <= radius;
    setWithinRadius(isCovered);

    // Shipping fee formula ()
    const baseFee = 15000;
    const ratePerKm = 2500;
    const ratePerKg = 1500;
    let fee =
      baseFee + dist * ratePerKm + Math.max(0, totalWeightKg - 1) * ratePerKg;
    fee = Math.max(20000, fee);
    setShippingFee(Math.round(fee / 1000) * 1000);
  }, [selectedNursery, pinLocation, totalWeightKg]);

  const handleMapLocationSelect = (lat, lon, addr) => {
    setPinLocation({ lat, lon, address: addr });
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate("/login?redirect=/cart");
      return;
    }

    if (!selectedNursery) {
      setErrorMsg("Vui lòng chọn vườn ươm xuất hàng.");
      return;
    }

    if (!withinRadius) {
      setErrorMsg(
        `Vị trí giao hàng (${distanceKm} km) vượt quá bán kính giao hàng tối đa của vườn (${selectedNursery.banKinhGiaoToiDaKm} km) ().`,
      );
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const payload = {
        maVuonUom: selectedNursery.maVuonUom,
        viDoGiao: pinLocation.lat,
        kinhDoGiao: pinLocation.lon,
        diaChiChiTiet: `${receiverName} - ${receiverPhone} - ${detailAddress}`,
        phuongThucThanhToan: paymentMethod,
        items: cartItems.map((item) => ({
          maCay: item.maCay,
          soLuong: item.soLuong,
        })),
      };

      const res = await api.post("/orders", payload);
      const createdOrder = res.data?.data;

      clearCart();
      navigate(`/orders/${createdOrder.maDonHang}?success=1`);
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi đặt hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPayment = subTotal + (withinRadius ? shippingFee : 0);

  if (cartItems.length === 0) {
    return (
      <div
        className="container"
        style={{ padding: "6rem 0", textAlign: "center" }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🛒</div>
        <h2 style={{ color: "var(--primary-900)", marginBottom: "0.5rem" }}>
          Giỏ hàng của bạn đang trống
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          Hãy chọn cho không gian sống của bạn những cây cảnh tươi tốt và hợp
          thổ nhưỡng nhất!
        </p>
        <Link to="/products" className="btn btn-primary">
          Khám phá cây cảnh ngay
        </Link>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ paddingTop: "2rem", paddingBottom: "5rem" }}
    >
      <h1
        style={{
          fontSize: "2rem",
          color: "var(--primary-900)",
          marginBottom: "0.5rem",
        }}
      >
        Giỏ Hàng & Xác Nhận Đơn Hàng GIS
      </h1>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.9rem",
          marginBottom: "2rem",
        }}
      >
        Hệ thống tự động tính cước giao cây tươi theo khoảng cách thực tế và
        khóa tồn kho trong 15 phút (, ).
      </p>

      {errorMsg && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #f87171",
            color: "#b91c1c",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 440px",
          gap: "2.5rem",
          alignItems: "start",
        }}
      >
        {/* Left: Items list & Nursery picker */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Selected Nursery Banner */}
          {selectedNursery && (
            <div
              style={{
                backgroundColor: "var(--primary-50)",
                border: "1px solid var(--primary-200)",
                borderRadius: "var(--radius-lg)",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <TreePine size={24} color="var(--primary-700)" />
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--primary-900)",
                      fontSize: "0.95rem",
                    }}
                  >
                    Vườn ươm xuất hàng: {selectedNursery.tenVuonUom}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Bán kính phục vụ: {selectedNursery.banKinhGiaoToiDaKm} km |
                    Khoảng cách đến bạn: {distanceKm} km
                  </div>
                </div>
              </div>
              <span
                className={`badge ${withinRadius ? "badge-climate-high" : "badge-DaHuy"}`}
              >
                {withinRadius ? "Trong bán kính giao" : "Ngoài bán kính!"}
              </span>
            </div>
          )}

          {/* Cart Table */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              overflow: "hidden",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--border-light)",
                fontWeight: 700,
                color: "var(--primary-900)",
              }}
            >
              Danh Sách Cây Cảnh ({cartItems.length} sản phẩm - Tổng tải trọng:{" "}
              {totalWeightKg} kg)
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {cartItems.map((item) => (
                <div
                  key={item.maCay}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <img
                    src={
                      item.anhChinh ||
                      "https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=150&q=80"
                    }
                    alt={item.tenCay}
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "var(--radius-md)",
                      objectFit: "cover",
                    }}
                  />

                  <div style={{ flexGrow: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--primary-900)",
                        fontSize: "0.95rem",
                      }}
                    >
                      {item.tenCay}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {item.tenKhoaHoc} | Nặng: {item.khoiLuongKg} kg
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--primary-700)",
                        fontWeight: 700,
                        marginTop: "2px",
                      }}
                    >
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.giaBan)}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <button
                      onClick={() =>
                        updateQuantity(item.maCay, item.soLuong - 1)
                      }
                      style={{
                        padding: "0.25rem 0.5rem",
                        background: "#f8fafc",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      -
                    </button>
                    <span
                      style={{
                        padding: "0.25rem 0.6rem",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {item.soLuong}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.maCay, item.soLuong + 1)
                      }
                      style={{
                        padding: "0.25rem 0.5rem",
                        background: "#f8fafc",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div
                    style={{
                      minWidth: "90px",
                      textAlign: "right",
                      fontWeight: 700,
                      color: "var(--primary-800)",
                      fontSize: "0.95rem",
                    }}
                  >
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.giaBan * item.soLuong)}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeFromCart(item.maCay)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                    }}
                    title="Xóa khỏi giỏ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Delivery Pinning Map () */}
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
                alignItems: "center",
                gap: "8px",
                marginBottom: "0.5rem",
              }}
            >
              <MapPin size={20} color="var(--primary-700)" />
              <h3 style={{ fontSize: "1.05rem", color: "var(--primary-900)" }}>
                Ghim Vị Trí Nhận Hàng Chính Xác Trên Bản Đồ ()
              </h3>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "1rem",
              }}
            >
              Nhấp hoặc kéo thả điểm ghim để xác định tọa độ GPS giao cây. Phí
              giao hàng sẽ được tự động tính theo khoảng cách thực tế.
            </p>

            <InteractiveMap
              nurseries={
                selectedNursery &&
                !isNaN(Number(selectedNursery.viDo ?? selectedNursery.vido)) &&
                !isNaN(Number(selectedNursery.kinhDo ?? selectedNursery.kinhdo))
                  ? [
                      {
                        ...selectedNursery,
                        viDo: Number(selectedNursery.viDo ?? selectedNursery.vido),
                        kinhDo: Number(selectedNursery.kinhDo ?? selectedNursery.kinhdo),
                        banKinhGiaoToiDaKm: Number(
                          selectedNursery.banKinhGiaoToiDaKm ??
                            selectedNursery.bankinhgiaotoidakm ??
                            30,
                        ),
                      },
                    ]
                  : []
              }
              userLocation={{
                lat: pinLocation.lat,
                lon: pinLocation.lon,
                name: pinLocation.address,
              }}
              onLocationSelect={handleMapLocationSelect}
              height="280px"
            />

            <div
              style={{
                marginTop: "1rem",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.75rem",
              }}
            >
              <div className="input-group">
                <label className="input-label">Họ tên người nhận</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Số điện thoại người nhận</label>
                <input
                  type="text"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="0901234567"
                  className="input-field"
                />
              </div>

              <div className="input-group" style={{ gridColumn: "span 2" }}>
                <label className="input-label">
                  Địa chỉ chi tiết (Số nhà, đường, phường/xã)
                </label>
                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, khu vực..."
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment & Order Summary */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Summary Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <h3
              style={{
                fontSize: "1.15rem",
                color: "var(--primary-900)",
                marginBottom: "1rem",
              }}
            >
              Tóm Tắt Hóa Đơn & Vận Chuyển
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                fontSize: "0.875rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Tiền cây ({cartItems.length} loại)</span>
                <span style={{ fontWeight: 600 }}>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(subTotal)}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Khoảng cách tuyến đường GIS</span>
                <span style={{ fontWeight: 600 }}>{distanceKm} km</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-secondary)",
                }}
              >
                <span>Cước vận chuyển cây tươi ()</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: withinRadius ? "var(--text-main)" : "var(--danger)",
                  }}
                >
                  {withinRadius
                    ? new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(shippingFee)
                    : "Ngoài bán kính!"}
                </span>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-light)",
                  paddingTop: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--primary-900)",
                  }}
                >
                  Tổng Thanh Toán
                </span>
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "var(--primary-800)",
                  }}
                >
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(totalPayment)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div
              style={{
                marginTop: "1.5rem",
                borderTop: "1px solid var(--border-light)",
                paddingTop: "1.25rem",
              }}
            >
              <label
                className="input-label"
                style={{ marginBottom: "0.5rem", display: "block" }}
              >
                Phương thức thanh toán:
              </label>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0.6rem 0.85rem",
                    border:
                      paymentMethod === "COD"
                        ? "1.5px solid var(--primary-600)"
                        : "1px solid var(--border-light)",
                    backgroundColor:
                      paymentMethod === "COD" ? "var(--primary-50)" : "#ffffff",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💵 Thanh toán khi nhận cây (COD)</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0.6rem 0.85rem",
                    border:
                      paymentMethod === "VNPAY"
                        ? "1.5px solid var(--primary-600)"
                        : "1px solid var(--border-light)",
                    backgroundColor:
                      paymentMethod === "VNPAY"
                        ? "var(--primary-50)"
                        : "#ffffff",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === "VNPAY"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>💳 Cổng thanh toán VNPay / Thẻ ngân hàng</span>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "0.6rem 0.85rem",
                    border:
                      paymentMethod === "MOMO"
                        ? "1.5px solid var(--primary-600)"
                        : "1px solid var(--border-light)",
                    backgroundColor:
                      paymentMethod === "MOMO"
                        ? "var(--primary-50)"
                        : "#ffffff",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="MOMO"
                    checked={paymentMethod === "MOMO"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>📱 Ví điện tử MoMo</span>
                </label>
              </div>
            </div>

            {/* Inventory lock notification notice () */}
            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "var(--radius-md)",
                padding: "0.75rem",
                marginTop: "1.25rem",
                fontSize: "0.75rem",
                color: "#92400e",
                display: "flex",
                gap: "6px",
              }}
            >
              <Clock size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Quy định khóa tồn kho ():</strong> Khi nhấn xác nhận, số
                lượng cây sẽ được giữ độc quyền cho bạn trong{" "}
                <strong>15 phút</strong>.
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCheckout}
              disabled={submitting || !withinRadius}
              className="btn btn-primary btn-lg"
              style={{ width: "100%", marginTop: "1.25rem" }}
            >
              {submitting
                ? "Đang tạo đơn & Khóa tồn kho..."
                : "Xác Nhận Đặt Hàng Ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
