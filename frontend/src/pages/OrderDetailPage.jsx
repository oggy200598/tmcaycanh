import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import InteractiveMap from "../components/InteractiveMap";
import {
  CheckCircle,
  Clock,
  Truck,
  Package,
  ShieldCheck,
  Star,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review modal state ()
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data?.data);
      } catch (err) {
        setError(err.message || "Không thể tải thông tin đơn hàng.");
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!reviewModalItem || !order) return;
    try {
      setSubmittingReview(true);
      await api.post("/reviews", {
        maDonHang: order.maDonHang,
        maChiTietDonHang: reviewModalItem.maChiTietDonHang,
        soSaoDanhGia: reviewRating,
        binhLuan: reviewComment,
      });

      setReviewSuccessMsg("Cảm ơn bạn đã gửi đánh giá sản phẩm thành công!");
      setTimeout(() => {
        setReviewModalItem(null);
        setReviewSuccessMsg("");
        // Reload order
        api.get(`/orders/${id}`).then((res) => setOrder(res.data?.data));
      }, 1500);
    } catch (err) {
      alert(err.message || "Lỗi gửi đánh giá.");
    } finally {
      setSubmittingReview(false);
    }
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
        Đang nạp chi tiết đơn hàng & định vị lộ trình...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div
        className="container"
        style={{ padding: "6rem 0", textAlign: "center" }}
      >
        <h2 style={{ color: "var(--danger)", marginBottom: "1rem" }}>
          {error || "Không tìm thấy đơn hàng"}
        </h2>
        <Link to="/orders" className="btn btn-primary">
          Xem danh sách đơn hàng
        </Link>
      </div>
    );
  }

  // Linear Stepper Stages ()
  const stages = [
    { key: "ChoXacNhan", title: "Chờ Xác Nhận", desc: "Khóa tồn kho 15p" },
    { key: "DaXacNhan", title: "Đã Tiếp Nhận", desc: "Vườn ươm chuẩn bị" },
    {
      key: "DangChuanBiHang",
      title: "Đóng Gói & Kiểm Định",
      desc: "Chụp ảnh sức khỏe",
    },
    { key: "DangGiaoHang", title: "Đang Giao Hàng", desc: "Live GPS Tracking" },
    { key: "DaHoanThanh", title: "Đã Hoàn Thành", desc: "Giao tận nơi" },
  ];

  const currentStageIndex = stages.findIndex(
    (s) => s.key === order.trangThaiDonHang,
  );
  const isCancelled = order.trangThaiDonHang === "DaHuy";

  return (
    <div
      className="container"
      style={{ paddingTop: "2rem", paddingBottom: "5rem" }}
    >
      {/* Top Header */}
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
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <Link to="/orders" style={{ color: "var(--primary-600)" }}>
              ← Danh sách đơn hàng
            </Link>
          </div>
          <h1
            style={{
              fontSize: "1.75rem",
              color: "var(--primary-900)",
              marginTop: "0.25rem",
            }}
          >
            Chi Tiết Đơn Hàng #{order.maDonHang}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span
            className={`badge badge-${order.trangThaiDonHang}`}
            style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
          >
            {order.trangThaiDonHang}
          </span>
          <span
            className="badge badge-gis"
            style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
          >
            Thanh toán: {order.trangThaiThanhToan}
          </span>
        </div>
      </div>

      {/* Linear Stepper Progress Bar () */}
      {!isCancelled && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border-light)",
            padding: "2rem 1.5rem",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            {/* Connecting Line */}
            <div
              style={{
                position: "absolute",
                top: "18px",
                left: "5%",
                right: "5%",
                height: "4px",
                backgroundColor: "#e2e8f0",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "var(--primary-600)",
                  width: `${Math.max(0, currentStageIndex / (stages.length - 1)) * 100}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {stages.map((stage, idx) => {
              const isPastOrCurrent = currentStageIndex >= idx;
              const isCurrent = currentStageIndex === idx;

              return (
                <div
                  key={stage.key}
                  style={{
                    zIndex: 2,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "18%",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: isPastOrCurrent
                        ? "var(--primary-600)"
                        : "#ffffff",
                      color: isPastOrCurrent ? "#ffffff" : "var(--text-muted)",
                      border: `3px solid ${isPastOrCurrent ? "var(--primary-600)" : "#cbd5e1"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      boxShadow: isCurrent
                        ? "0 0 0 4px rgba(82, 183, 136, 0.3)"
                        : "none",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {isPastOrCurrent ? "✓" : idx + 1}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      color: isPastOrCurrent
                        ? "var(--primary-900)"
                        : "var(--text-muted)",
                    }}
                  >
                    {stage.title}
                  </div>
                  <div
                    style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}
                  >
                    {stage.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid: Info + Plant Health Verification + GIS Live Tracking */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* Left Column: Order Items & Plant Health Verification () */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Plant Health Inspection Card () */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-light)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <ShieldCheck size={22} color="var(--primary-700)" />
                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-900)" }}>
                  Ảnh Kiểm Định Sức Khỏe Cây Tại Vườn ()
                </h3>
              </div>
              {order.daXacNhanSucKhoe ? (
                <span className="badge badge-climate-high">
                  <CheckCircle size={13} /> Sức khỏe cây đạt chuẩn
                </span>
              ) : (
                <span className="badge badge-ChoXacNhan">
                  <Clock size={13} /> Đang chờ nhân viên chụp ảnh
                </span>
              )}
            </div>

            {order.anhSucKhoeUrl ? (
              <div>
                <div
                  style={{
                    width: "100%",
                    height: "240px",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    backgroundColor: "#f1f5f9",
                    border: "1px solid var(--border-light)",
                    marginBottom: "0.75rem",
                  }}
                >
                  <img
                    src={order.anhSucKhoeUrl}
                    alt="Plant health inspection"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
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
                  🌿 <strong>Biên bản kiểm tra:</strong> Lá xanh bóng mượt, thân
                  khỏe mạnh, bộ rễ đã được đóng bọc giữ ẩm chuyên dụng trước khi
                  bàn giao đơn vị vận chuyển.
                </p>
              </div>
            ) : (
              <div
                style={{
                  padding: "2rem",
                  backgroundColor: "var(--surface-bg)",
                  borderRadius: "var(--radius-md)",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                Nhân viên vườn ươm sẽ tải lên hình ảnh chụp thực tế cây ngay khi
                hoàn tất đóng gói và trước khi chuyển sang trạng thái "Đang giao
                hàng".
              </div>
            )}
          </div>

          {/* Purchased Items */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-light)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <h3
              style={{
                fontSize: "1.1rem",
                color: "var(--primary-900)",
                marginBottom: "1rem",
              }}
            >
              Danh Sách Cây Trong Đơn Hàng
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {order.danhSachSanPham?.map((item) => (
                <div
                  key={item.maChiTietDonHang}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    paddingBottom: "1rem",
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
                      width: "60px",
                      height: "60px",
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
                      Số lượng: {item.soLuong} | Đơn giá:{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.donGia)}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--primary-800)",
                        fontSize: "0.9rem",
                        marginTop: "2px",
                      }}
                    >
                      Thành tiền:{" "}
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.thanhTien)}
                    </div>
                  </div>

                  {/* Review Button for Completed Orders () */}
                  {order.trangThaiDonHang === "DaHoanThanh" && (
                    <div>
                      {item.daDanhGia ? (
                        <span
                          className="badge badge-climate-high"
                          style={{ fontSize: "0.75rem" }}
                        >
                          ✓ Đã Đánh Giá
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewModalItem(item)}
                          className="btn btn-primary btn-sm"
                        >
                          <Star size={13} /> Đánh Giá Cây
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                fontSize: "0.85rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-muted)",
                }}
              >
                <span>Cước vận chuyển tuyến GIS ({order.khoangCachKm} km)</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(order.phiVanChuyen)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "var(--primary-900)",
                  borderTop: "1px solid var(--border-light)",
                  paddingTop: "0.5rem",
                }}
              >
                <span>Tổng Cộng</span>
                <span>
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(order.tongTien)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: GIS Live Tracking Map () & Delivery Address */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-light)",
              padding: "1.5rem",
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
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Truck size={20} color="var(--primary-700)" />
                <h3 style={{ fontSize: "1.1rem", color: "var(--primary-900)" }}>
                  Live Order Tracking GIS ()
                </h3>
              </div>
              <span className="badge badge-gis">Cập nhật mỗi 30s</span>
            </div>

            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "1rem",
              }}
            >
              Theo dõi lộ trình giao cây từ{" "}
              <strong>{order.vuonUom?.tenVuonUom}</strong> đến điểm nhận của bạn
              ({order.khoangCachKm} km).
            </p>

            <InteractiveMap
              nurseries={order.vuonUom ? [order.vuonUom] : []}
              userLocation={{
                lat: order.diaChiGiao?.viDo,
                lon: order.diaChiGiao?.kinhDo,
                name: order.diaChiGiao?.diaChiChiTiet,
              }}
              height="300px"
            />

            <div
              style={{
                marginTop: "1.25rem",
                backgroundColor: "var(--surface-bg)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                fontSize: "0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
              }}
            >
              <div>
                <strong>Người nhận:</strong> {order.diaChiGiao?.tenNguoiNhan} -{" "}
                {order.diaChiGiao?.soDienThoai}
              </div>
              <div>
                <strong>Địa chỉ:</strong> {order.diaChiGiao?.diaChiChiTiet}
              </div>
              <div>
                <strong>Tọa độ GPS nhận:</strong> [
                {order.diaChiGiao?.viDo?.toFixed(4)},{" "}
                {order.diaChiGiao?.kinhDo?.toFixed(4)}]
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal () */}
      {reviewModalItem && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
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
              maxWidth: "500px",
              width: "90%",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                color: "var(--primary-900)",
                marginBottom: "0.5rem",
              }}
            >
              Đánh Giá Cây: {reviewModalItem.tenCay}
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginBottom: "1.25rem",
              }}
            >
              Đánh giá của bạn sẽ giúp hệ thống tính điểm uy tín cho vườn ươm
              ().
            </p>

            {reviewSuccessMsg ? (
              <div
                style={{
                  color: "var(--success)",
                  fontWeight: 700,
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                ✓ {reviewSuccessMsg}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div>
                  <label
                    className="input-label"
                    style={{ marginBottom: "0.5rem", display: "block" }}
                  >
                    Chấm số sao (1-5):
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: s <= reviewRating ? "#f59e0b" : "#cbd5e1",
                        }}
                      >
                        <Star
                          size={28}
                          fill={s <= reviewRating ? "#f59e0b" : "none"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Nhận xét chi tiết</label>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Cây nhận được có tươi tốt không? Vận chuyển thế nào..."
                    className="input-field"
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    justifyContent: "flex-end",
                    marginTop: "0.5rem",
                  }}
                >
                  <button
                    onClick={() => setReviewModalItem(null)}
                    className="btn btn-secondary"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="btn btn-primary"
                  >
                    {submittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
