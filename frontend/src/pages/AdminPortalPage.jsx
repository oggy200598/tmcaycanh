import React, { useState, useEffect } from "react";
import api from "../api/client";
import InteractiveMap from "../components/InteractiveMap";
import { useAuth } from "../context/AuthContext";
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Flame,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Upload,
  X,
  MapPin,
  Building,
  Tag,
  Clock,
  Truck,
  DollarSign,
  AlertCircle
} from "lucide-react";

export default function AdminPortalPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview");

  // Data states for CRUD
  const [plantsList, setPlantsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [nurseriesList, setNurseriesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [pendingPlantsList, setPendingPlantsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Search filters
  const [plantSearch, setPlantSearch] = useState("");
  const [plantCatFilter, setPlantCatFilter] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryNurseryFilter, setInventoryNurseryFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

  // Modals state
  const [plantModal, setPlantModal] = useState({ open: false, mode: "create", data: null });
  const [supplierModal, setSupplierModal] = useState({ open: false, mode: "create", data: null });
  const [nurseryModal, setNurseryModal] = useState({ open: false, mode: "create", data: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, mode: "create", data: null });
  const [inventoryModal, setInventoryModal] = useState({ open: false, mode: "create", data: null });
  const [orderDetailModal, setOrderDetailModal] = useState({ open: false, data: null, loading: false });

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState({ open: false, type: "", id: "", title: "" });

  // Uploading state
  const [uploadingPlantImg, setUploadingPlantImg] = useState(false);

  useEffect(() => {
    if (user?.vaiTro === "Admin") {
      loadInitialData();
    }
  }, [user]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const [statsRes, heatRes, usersRes, catRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/heatmap"),
        api.get("/admin/users"),
        api.get("/admin/categories"),
      ]);
      setStats(statsRes.data?.data);
      setHeatmapData(heatRes.data?.data || []);
      setUsersList(usersRes.data?.data || []);
      setCategoriesList(catRes.data?.data || []);
      // Load first active tab data
      loadTabData(activeTab);
    } catch (err) {
      console.error("Admin data error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load specific tab data on demand
  const loadTabData = async (tabKey) => {
    try {
      if (tabKey === "plants") {
        const res = await api.get("/admin/plants");
        setPlantsList(res.data?.data || []);
      } else if (tabKey === "suppliers") {
        const res = await api.get("/admin/suppliers");
        setSuppliersList(res.data?.data || []);
      } else if (tabKey === "nurseries") {
        const [nursRes, supRes] = await Promise.all([
          api.get("/admin/nurseries"),
          api.get("/admin/suppliers")
        ]);
        setNurseriesList(nursRes.data?.data || []);
        setSuppliersList(supRes.data?.data || []);
      } else if (tabKey === "categories") {
        const res = await api.get("/admin/categories");
        setCategoriesList(res.data?.data || []);
      } else if (tabKey === "inventory") {
        const [invRes, plantRes, nursRes] = await Promise.all([
          api.get("/admin/inventory"),
          api.get("/admin/plants"),
          api.get("/admin/nurseries"),
        ]);
        setInventoryList(invRes.data?.data || []);
        setPlantsList(plantRes.data?.data || []);
        setNurseriesList(nursRes.data?.data || []);
      } else if (tabKey === "approval") {
        const res = await api.get("/plants?status=Pending");
        setPendingPlantsList(res.data?.data || []);
      } else if (tabKey === "orders") {
        const res = await api.get("/admin/orders");
        setOrdersList(res.data?.data || []);
      }
    } catch (err) {
      console.error(`Error loading data for ${tabKey}:`, err);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    loadTabData(key);
  };

  // Image upload helper
  const handleUploadImage = async (file, setUrlCallback) => {
    if (!file) return;
    try {
      setUploadingPlantImg(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success && res.data?.data?.url) {
        setUrlCallback(res.data.data.url);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi tải ảnh lên.");
    } finally {
      setUploadingPlantImg(false);
    }
  };

  // ==========================================
  // CRUD ACTIONS: CÂY CẢNH
  // ==========================================
  const handleSavePlant = async (e) => {
    e.preventDefault();
    const fd = plantModal.data;
    try {
      if (plantModal.mode === "create") {
        await api.post("/admin/plants", fd);
        alert("Thêm cây cảnh mới thành công!");
      } else {
        await api.put(`/admin/plants/${fd.maCay}`, fd);
        alert("Cập nhật cây cảnh thành công!");
      }
      setPlantModal({ open: false, mode: "create", data: null });
      loadTabData("plants");
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi lưu cây cảnh.");
    }
  };

  // ==========================================
  // CRUD ACTIONS: NHÀ CUNG CẤP
  // ==========================================
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    const fd = supplierModal.data;
    try {
      if (supplierModal.mode === "create") {
        await api.post("/admin/suppliers", fd);
        alert("Thêm nhà cung cấp thành công!");
      } else {
        await api.put(`/admin/suppliers/${fd.maNhaCungCap}`, fd);
        alert("Cập nhật nhà cung cấp thành công!");
      }
      setSupplierModal({ open: false, mode: "create", data: null });
      loadTabData("suppliers");
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi lưu nhà cung cấp.");
    }
  };

  // ==========================================
  // CRUD ACTIONS: VƯỜN ƯƠM
  // ==========================================
  const handleSaveNursery = async (e) => {
    e.preventDefault();
    const fd = nurseryModal.data;
    try {
      if (nurseryModal.mode === "create") {
        await api.post("/admin/nurseries", fd);
        alert("Thêm vườn ươm thành công!");
      } else {
        await api.put(`/admin/nurseries/${fd.maVuonUom}`, fd);
        alert("Cập nhật vườn ươm thành công!");
      }
      setNurseryModal({ open: false, mode: "create", data: null });
      loadTabData("nurseries");
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi lưu vườn ươm.");
    }
  };

  // ==========================================
  // CRUD ACTIONS: DANH MỤC
  // ==========================================
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const fd = categoryModal.data;
    try {
      if (categoryModal.mode === "create") {
        await api.post("/admin/categories", fd);
        alert("Thêm danh mục thành công!");
      } else {
        await api.put(`/admin/categories/${fd.maDanhMuc}`, fd);
        alert("Cập nhật danh mục thành công!");
      }
      setCategoryModal({ open: false, mode: "create", data: null });
      loadTabData("categories");
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi lưu danh mục.");
    }
  };

  // ==========================================
  // CRUD ACTIONS: TỒN KHO (INVENTORY)
  // ==========================================
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    const fd = inventoryModal.data;
    try {
      if (inventoryModal.mode === "create") {
        await api.post("/admin/inventory", {
          maCay: fd.maCay,
          maVuonUom: fd.maVuonUom,
          soLuongTon: Number(fd.soLuongTon),
        });
        alert("Thêm bản ghi tồn kho thành công!");
      } else {
        await api.put(`/admin/inventory/${fd.maTonKho}`, {
          soLuongTon: Number(fd.soLuongTon),
        });
        alert("Cập nhật số lượng tồn kho thành công!");
      }
      setInventoryModal({ open: false, mode: "create", data: null });
      loadTabData("inventory");
      loadInitialData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi lưu tồn kho.");
    }
  };

  // ==========================================
  // APPROVAL ACTIONS: KIỂM DUYỆT CÂY CẢNH
  // ==========================================
  const handleApprovePlant = async (plantId) => {
    try {
      await api.patch(`/plants/${plantId}/status`, {
        trangThai: "Active",
        daXuatBan: true,
      });
      alert("Đã phê duyệt và xuất bản cây cảnh thành công!");
      loadTabData("approval");
      loadInitialData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi duyệt cây cảnh.");
    }
  };

  const handleRejectPlant = async (plantId) => {
    if (!window.confirm("Bạn có chắc muốn từ chối kiểm duyệt cây cảnh này?")) return;
    try {
      await api.patch(`/plants/${plantId}/status`, {
        trangThai: "Rejected",
        daXuatBan: false,
      });
      alert("Đã từ chối cây cảnh.");
      loadTabData("approval");
      loadInitialData();
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi từ chối cây cảnh.");
    }
  };

  // ==========================================
  // DELETE CONFIRMATION HANDLER
  // ==========================================
  const handleConfirmDelete = async () => {
    const { type, id } = deleteDialog;
    try {
      if (type === "plant") {
        await api.delete(`/admin/plants/${id}`);
        loadTabData("plants");
      } else if (type === "supplier") {
        await api.delete(`/admin/suppliers/${id}`);
        loadTabData("suppliers");
      } else if (type === "nursery") {
        await api.delete(`/admin/nurseries/${id}`);
        loadTabData("nurseries");
      } else if (type === "category") {
        await api.delete(`/admin/categories/${id}`);
        loadTabData("categories");
      } else if (type === "inventory") {
        await api.delete(`/admin/inventory/${id}`);
        loadTabData("inventory");
        loadInitialData();
      }
      alert("Đã xóa bản ghi thành công!");
      setDeleteDialog({ open: false, type: "", id: "", title: "" });
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi khi xóa bản ghi.");
    }
  };

  // ==========================================
  // VIEW ORDER DETAIL (STRICTLY READ-ONLY)
  // ==========================================
  const handleViewOrderDetail = async (orderId) => {
    try {
      setOrderDetailModal({ open: true, data: null, loading: true });
      const res = await api.get(`/admin/orders/${orderId}`);
      setOrderDetailModal({ open: true, data: res.data?.data, loading: false });
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || "Lỗi tải chi tiết đơn hàng.");
      setOrderDetailModal({ open: false, data: null, loading: false });
    }
  };

  // User Lock/Unlock Toggle
  const handleToggleLockUser = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Locked" : "Active";
    try {
      await api.patch(`/admin/users/${userId}/status`, { trangThai: nextStatus });
      loadInitialData();
    } catch (err) {
      alert(err.message || "Lỗi cập nhật người dùng.");
    }
  };

  // Non-admin block
  if (!user || user.vaiTro !== "Admin") {
    return (
      <div className="container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "var(--radius-xl)", padding: "2.5rem", boxShadow: "var(--shadow-md)" }}>
          <AlertCircle size={48} color="#e11d48" style={{ marginBottom: "1rem" }} />
          <h2 style={{ color: "#9f1239", marginBottom: "0.5rem" }}>Giới Hạn Quyền Quản Trị Hệ Thống</h2>
          <p style={{ color: "#881337", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "1.5rem" }}>
            Trang này và toàn bộ tính năng <strong>CRUD (Thêm, Sửa, Xóa Cây cảnh, Nhà cung cấp, Vườn ươm, Danh mục)</strong> chỉ được phép truy cập bởi tài khoản có vai trò <strong>Admin</strong>.
          </p>
          <a href="/login" className="btn btn-primary" style={{ display: "inline-flex" }}>
            Đăng Nhập Với Tài Khoản Admin Demo
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: "6rem 0", textAlign: "center", color: "var(--text-muted)" }}>
        Đang nạp dữ liệu trung tâm quản trị Admin...
      </div>
    );
  }

  // Filtered Plants
  const filteredPlants = plantsList.filter((p) => {
    const matchSearch = p.tenCay?.toLowerCase().includes(plantSearch.toLowerCase()) || p.maCay?.toLowerCase().includes(plantSearch.toLowerCase());
    const matchCat = plantCatFilter ? p.maDanhMuc === plantCatFilter : true;
    return matchSearch && matchCat;
  });

  // Filtered Inventory
  const filteredInventory = inventoryList.filter((inv) => {
    const matchSearch =
      inv.tenCay?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      inv.maTonKho?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      inv.tenVuonUom?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      inv.tenDanhMuc?.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchNurs = inventoryNurseryFilter ? inv.maVuonUom === inventoryNurseryFilter : true;
    return matchSearch && matchNurs;
  });

  // Filtered Orders
  const filteredOrders = ordersList.filter((o) => {
    const matchId = o.maDonHang?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchName = o.tenKhachHang?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchId || matchName;
  });

  return (
    <div className="container" style={{ paddingTop: "2.5rem", paddingBottom: "5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <div style={{ fontSize: "0.85rem", color: "var(--primary-600)", fontWeight: 700, letterSpacing: "0.5px" }}>
            HỆ THỐNG QUẢN TRỊ & GIÁM SÁT GIS (ADMIN & STAFF)
          </div>
          <h1 style={{ fontSize: "2rem", color: "var(--primary-900)", marginTop: "0.25rem" }}>
            Trung Tâm Vận Hành & Bản Đồ Nhiệt Không Gian
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className="badge badge-gis" style={{ fontSize: "0.85rem", padding: "0.4rem 0.8rem" }}>
            🛡️ Quản trị viên: {user.hoTen || user.email}
          </span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>
            <span>TỔNG DOANH THU SÀN</span>
            <TrendingUp size={18} color="var(--primary-600)" />
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary-900)", marginTop: "0.5rem" }}>
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats?.tongDoanThu || 0)}
          </div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>
            <span>TỔNG ĐƠN HÀNG</span>
            <Package size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary-900)", marginTop: "0.5rem" }}>
            {stats?.tongDonHang || 0} đơn
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--success)" }}>✓ {stats?.donDaHoanThanh || 0} hoàn thành</div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>
            <span>CÂY CHỜ DUYỆT</span>
            <ShieldCheck size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary-900)", marginTop: "0.5rem" }}>
            {stats?.cayChoDuyet || 0} cây
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Cần kiểm tra tham số sinh trưởng</div>
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>
            <span>NGƯỜI DÙNG HỆ THỐNG</span>
            <Users size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary-900)", marginTop: "0.5rem" }}>
            {stats?.tongNguoiDung || 0} tài khoản
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{ display: "flex", gap: "0.35rem", borderBottom: "2px solid var(--border-light)", marginBottom: "2rem", overflowX: "auto", paddingBottom: "2px" }}>
        {[
          { key: "overview", label: "📊 Cảnh Báo Tồn Kho", count: stats?.canhBaoTonKhoThap?.length },
          { key: "heatmap", label: "🔥 Heatmap GIS" },
          { key: "approval", label: "🛡️ Kiểm Duyệt Cây", count: stats?.cayChoDuyet || 0 },
          { key: "plants", label: "🌱 Cây Cảnh (CRUD)", count: plantsList.length },
          { key: "suppliers", label: "🏢 Nhà Cung Cấp (CRUD)", count: suppliersList.length },
          { key: "nurseries", label: "📍 Vườn Ươm (CRUD)", count: nurseriesList.length },
          { key: "categories", label: "🏷️ Danh Mục (CRUD)", count: categoriesList.length },
          { key: "inventory", label: "📦 Tồn Kho (CRUD)", count: inventoryList.length, highlight: true },
          { key: "orders", label: "📋 Đơn Hàng (Chỉ Xem)", count: ordersList.length },
          { key: "users", label: "👥 Người Dùng", count: usersList.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: "0.65rem 1rem",
              fontWeight: 700,
              fontSize: "0.85rem",
              border: "none",
              background: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              color: activeTab === tab.key ? "var(--primary-700)" : "var(--text-muted)",
              borderBottom: activeTab === tab.key ? "3px solid var(--primary-700)" : "3px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "10px", backgroundColor: tab.highlight ? "#e0e7ff" : "#f1f5f9", color: tab.highlight ? "#3730a3" : "#475569" }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & LOW-STOCK ALERTS */}
      {/* ========================================================= */}
      {activeTab === "overview" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.75rem" }}>
            <AlertTriangle size={20} color="#eab308" />
            <h3 style={{ fontSize: "1.1rem", color: "var(--primary-900)" }}>
              Cảnh Báo Cây Dưới Ngưỡng Tồn Kho Tối Thiểu
            </h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
            Hệ thống tự động kích hoạt cảnh báo khi số lượng tồn kho của vườn giảm xuống dưới ngưỡng quy định.
          </p>

          {stats?.canhBaoTonKhoThap && stats.canhBaoTonKhoThap.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.75rem" }}>Mã Kho</th>
                    <th style={{ padding: "0.75rem" }}>Tên Cây</th>
                    <th style={{ padding: "0.75rem" }}>Vườn Ươm</th>
                    <th style={{ padding: "0.75rem" }}>Nhà Cung Cấp</th>
                    <th style={{ padding: "0.75rem" }}>Tồn Hiện Tại</th>
                    <th style={{ padding: "0.75rem" }}>Ngưỡng Tối Thiểu</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.canhBaoTonKhoThap.map((a) => (
                    <tr key={a.maTonKho} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.75rem", fontWeight: 700 }}>{a.maTonKho}</td>
                      <td style={{ padding: "0.75rem", color: "var(--primary-900)", fontWeight: 600 }}>{a.tenCay}</td>
                      <td style={{ padding: "0.75rem" }}>{a.tenVuonUom}</td>
                      <td style={{ padding: "0.75rem" }}>{a.tenCongTy}</td>
                      <td style={{ padding: "0.75rem", color: "#dc2626", fontWeight: 800 }}>{a.soLuongTon} cây</td>
                      <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{a.nguongToiThieu} cây</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--success)" }}>
              ✓ Toàn bộ các vườn ươm đều đang duy trì mức tồn kho an toàn!
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CÂY CẢNH (PLANTS CRUD) */}
      {/* ========================================================= */}
      {activeTab === "plants" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", flex: 1, minWidth: "280px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên cây hoặc mã..."
                  value={plantSearch}
                  onChange={(e) => setPlantSearch(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: "32px", fontSize: "0.85rem" }}
                />
              </div>
              <select
                value={plantCatFilter}
                onChange={(e) => setPlantCatFilter(e.target.value)}
                className="input-field"
                style={{ width: "200px", fontSize: "0.85rem" }}
              >
                <option value="">Tất cả danh mục</option>
                {categoriesList.map((c) => (
                  <option key={c.maDanhMuc} value={c.maDanhMuc}>
                    {c.tenDanhMuc}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                setPlantModal({
                  open: true,
                  mode: "create",
                  data: {
                    tenCay: "",
                    tenKhoaHoc: "",
                    giaBan: 150000,
                    maDanhMuc: categoriesList[0]?.maDanhMuc || "DM001",
                    khoiLuongKg: 1.0,
                    moTa: "",
                    huongDanChamSoc: "",
                    trangThai: "Active",
                    daXuatBan: true,
                    hinhAnhUrl: "/assets/images/cay_van_phong.jpg",
                    growthRequirement: {
                      nhietDoToiThieu: 18,
                      nhietDoToiDa: 35,
                      doAmToiUu: 65,
                      yeuCauAnhSang: "Bán râm",
                      loaiDat: "Đất hữu cơ tơi xốp",
                    },
                  },
                })
              }
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Thêm Cây Cảnh Mới
            </button>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem" }}>Hình Ảnh</th>
                  <th style={{ padding: "0.75rem" }}>Mã / Tên Cây</th>
                  <th style={{ padding: "0.75rem" }}>Danh Mục</th>
                  <th style={{ padding: "0.75rem" }}>Giá Bán</th>
                  <th style={{ padding: "0.75rem" }}>Sinh Trưởng (1-1)</th>
                  <th style={{ padding: "0.75rem" }}>Tổng Tồn</th>
                  <th style={{ padding: "0.75rem" }}>Trạng Thái</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlants.map((p) => (
                  <tr key={p.maCay} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.75rem" }}>
                      <img
                        src={p.anhChinh}
                        alt={p.tenCay}
                        style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", objectFit: "cover", border: "1px solid var(--border-light)" }}
                      />
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--primary-900)" }}>{p.tenCay}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        {p.tenKhoaHoc || p.maCay}
                      </div>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className="badge" style={{ backgroundColor: "#f1f5f9", color: "#334155", fontSize: "0.75rem" }}>
                        {p.tenDanhMuc || p.maDanhMuc}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--primary-800)" }}>
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.giaBan)}
                    </td>
                    <td style={{ padding: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      🌡️ {p.growthRequirement?.nhietDoToiThieu}°C - {p.growthRequirement?.nhietDoToiDa}°C<br />
                      ☀️ {p.growthRequirement?.yeuCauAnhSang}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>{p.tongTonKho} cây</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: p.trangThai === "Active" ? "#dcfce7" : p.trangThai === "Pending" ? "#fef3c7" : "#fee2e2",
                          color: p.trangThai === "Active" ? "#166534" : p.trangThai === "Pending" ? "#92400e" : "#991b1b",
                          fontSize: "0.75rem",
                        }}
                      >
                        {p.trangThai}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button
                        onClick={() =>
                          setPlantModal({
                            open: true,
                            mode: "edit",
                            data: {
                              ...p,
                              hinhAnhUrl: p.anhChinh,
                              growthRequirement: { ...p.growthRequirement },
                            },
                          })
                        }
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: "6px", padding: "0.3rem 0.5rem" }}
                        title="Chỉnh sửa cây cảnh"
                      >
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, type: "plant", id: p.macay || p.maCay, title: `Cây cảnh: ${p.tenCay}` })}
                        className="btn btn-sm"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "none", padding: "0.3rem 0.5rem" }}
                        title="Xóa cây cảnh"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: NHÀ CUNG CẤP (SUPPLIERS CRUD) */}
      {/* ========================================================= */}
      {activeTab === "suppliers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--primary-900)" }}>Danh Sách Nhà Cung Cấp Đối Tác ({suppliersList.length})</h3>
            <button
              onClick={() =>
                setSupplierModal({
                  open: true,
                  mode: "create",
                  data: {
                    tenCongTy: "",
                    maSoThue: "",
                    sodienthoailienhe: "",
                    emailLienHe: "",
                    diemUyTin: 5.0,
                  },
                })
              }
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Thêm Nhà Cung Cấp
            </button>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem" }}>Mã NCC</th>
                  <th style={{ padding: "0.75rem" }}>Tên Doanh Nghiệp</th>
                  <th style={{ padding: "0.75rem" }}>Mã Số Thuế</th>
                  <th style={{ padding: "0.75rem" }}>Liên Hệ</th>
                  <th style={{ padding: "0.75rem" }}>Uy Tín</th>
                  <th style={{ padding: "0.75rem" }}>Số Vườn</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {suppliersList.map((s) => (
                  <tr key={s.maNhaCungCap} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700 }}>{s.maNhaCungCap}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "var(--primary-900)" }}>{s.tenCongTy}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{s.maSoThue || "Chưa cập nhật"}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <div>📧 {s.emailLienHe}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>📞 {s.soDienThoaiLienHe || "---"}</div>
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "#f59e0b" }}>⭐ {s.diemUyTin} / 5</td>
                    <td style={{ padding: "0.75rem" }}>{s.soVuonUom} vườn</td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button
                        onClick={() => setSupplierModal({ open: true, mode: "edit", data: { ...s } })}
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: "6px", padding: "0.3rem 0.5rem" }}
                      >
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, type: "supplier", id: s.maNhaCungCap, title: `Nhà cung cấp: ${s.tenCongTy}` })}
                        className="btn btn-sm"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "none", padding: "0.3rem 0.5rem" }}
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: VƯỜN ƯƠM (NURSERIES CRUD) */}
      {/* ========================================================= */}
      {activeTab === "nurseries" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--primary-900)" }}>Danh Sách Vườn Ươm & Tọa Độ GIS ({nurseriesList.length})</h3>
            <button
              onClick={() =>
                setNurseryModal({
                  open: true,
                  mode: "create",
                  data: {
                    tenVuonUom: "",
                    diaChi: "",
                    viDo: 10.7765,
                    kinhDo: 106.7009,
                    banKinhGiaoToiDaKm: 35,
                    nguongTonKhoToiThieu: 5,
                    maNhaCungCap: suppliersList[0]?.maNhaCungCap || "NCC001",
                  },
                })
              }
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Thêm Vườn Ươm
            </button>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem" }}>Mã Vườn</th>
                  <th style={{ padding: "0.75rem" }}>Tên Vườn Ươm</th>
                  <th style={{ padding: "0.75rem" }}>Nhà Cung Cấp</th>
                  <th style={{ padding: "0.75rem" }}>Địa Chỉ</th>
                  <th style={{ padding: "0.75rem" }}>Tọa Độ GIS (Lat, Lon)</th>
                  <th style={{ padding: "0.75rem" }}>Bán Kính Giao</th>
                  <th style={{ padding: "0.75rem" }}>Kho</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {nurseriesList.map((n) => (
                  <tr key={n.maVuonUom} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700 }}>{n.maVuonUom}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "var(--primary-900)" }}>{n.tenVuonUom}</td>
                    <td style={{ padding: "0.75rem" }}>{n.tenCongTy || n.maNhaCungCap}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)", maxWidth: "220px" }}>{n.diaChi}</td>
                    <td style={{ padding: "0.75rem", fontSize: "0.75rem", fontFamily: "monospace" }}>
                      📍 {Number(n.viDo).toFixed(4)}, {Number(n.kinhDo).toFixed(4)}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "var(--primary-700)" }}>{n.banKinhGiaoToiDaKm} km</td>
                    <td style={{ padding: "0.75rem" }}>{n.soCayTonKho} loại cây</td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button
                        onClick={() => setNurseryModal({ open: true, mode: "edit", data: { ...n } })}
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: "6px", padding: "0.3rem 0.5rem" }}
                      >
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, type: "nursery", id: n.maVuonUom, title: `Vườn ươm: ${n.tenVuonUom}` })}
                        className="btn btn-sm"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "none", padding: "0.3rem 0.5rem" }}
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: DANH MỤC (CATEGORIES CRUD) */}
      {/* ========================================================= */}
      {activeTab === "categories" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem", color: "var(--primary-900)" }}>Danh Sách Danh Mục Cây Cảnh ({categoriesList.length})</h3>
            <button
              onClick={() =>
                setCategoryModal({
                  open: true,
                  mode: "create",
                  data: { tenDanhMuc: "", moTa: "" },
                })
              }
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Thêm Danh Mục
            </button>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem" }}>Mã Danh Mục</th>
                  <th style={{ padding: "0.75rem" }}>Tên Danh Mục</th>
                  <th style={{ padding: "0.75rem" }}>Mô Tả Ý Nghĩa</th>
                  <th style={{ padding: "0.75rem" }}>Số Cây Sẵn Có</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {categoriesList.map((c) => (
                  <tr key={c.maDanhMuc} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700 }}>{c.maDanhMuc}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "var(--primary-900)" }}>{c.tenDanhMuc}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{c.moTa || "Chưa có mô tả"}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--primary-700)" }}>{c.soCay} giống cây</td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button
                        onClick={() => setCategoryModal({ open: true, mode: "edit", data: { ...c } })}
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: "6px", padding: "0.3rem 0.5rem" }}
                      >
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, type: "category", id: c.maDanhMuc, title: `Danh mục: ${c.tenDanhMuc}` })}
                        className="btn btn-sm"
                        style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "none", padding: "0.3rem 0.5rem" }}
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: ĐƠN HÀNG (ORDERS - STRICTLY READ-ONLY) */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div>
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={20} color="#2563eb" />
            <div style={{ fontSize: "0.85rem", color: "#1e40af" }}>
              <strong>Quy tắc nghiệp vụ:</strong> Đơn hàng trong cơ sở dữ liệu là chứng từ giao dịch pháp lý và tài chính, <strong>Admin chỉ có quyền XEM chi tiết</strong> và giám sát tiến trình tuyến tính, tuyệt đối <strong>không cho phép sửa hoặc xóa</strong> để đảm bảo toàn vẹn dữ liệu.
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ position: "relative", width: "320px" }}>
              <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Tìm mã đơn hoặc khách hàng..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="input-field"
                style={{ paddingLeft: "32px", fontSize: "0.85rem" }}
              />
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Tổng số: <strong>{filteredOrders.length}</strong> đơn hàng
            </div>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem" }}>Mã Đơn</th>
                  <th style={{ padding: "0.75rem" }}>Ngày Đặt</th>
                  <th style={{ padding: "0.75rem" }}>Khách Hàng</th>
                  <th style={{ padding: "0.75rem" }}>Vườn Ươm</th>
                  <th style={{ padding: "0.75rem" }}>Khoảng Cách</th>
                  <th style={{ padding: "0.75rem" }}>Tổng Tiền</th>
                  <th style={{ padding: "0.75rem" }}>Thanh Toán</th>
                  <th style={{ padding: "0.75rem" }}>Trạng Thái</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Xem Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.maDonHang} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--primary-800)" }}>{o.maDonHang}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(o.ngayDatHang).toLocaleDateString("vi-VN")}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 600 }}>{o.tenKhachHang}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{o.soDienThoai || o.emailKhachHang}</div>
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{o.tenVuonUom}</td>
                    <td style={{ padding: "0.75rem", color: "var(--primary-700)", fontWeight: 600 }}>{o.khoangCachKm} km</td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--primary-900)" }}>
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(o.tongTien)}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className="badge" style={{ backgroundColor: o.trangThaiThanhToan === "DaThanhToan" ? "#dcfce7" : "#fee2e2", color: o.trangThaiThanhToan === "DaThanhToan" ? "#166534" : "#991b1b", fontSize: "0.72rem" }}>
                        {o.trangThaiThanhToan}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            o.trangThaiDonHang === "DaHoanThanh"
                              ? "#dcfce7"
                              : o.trangThaiDonHang === "DangGiaoHang"
                              ? "#e0e7ff"
                              : "#fef3c7",
                          color:
                            o.trangThaiDonHang === "DaHoanThanh"
                              ? "#166534"
                              : o.trangThaiDonHang === "DangGiaoHang"
                              ? "#3730a3"
                              : "#92400e",
                          fontSize: "0.72rem",
                        }}
                      >
                        {o.trangThaiDonHang}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleViewOrderDetail(o.maDonHang)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.3rem 0.6rem" }}
                      >
                        <Eye size={14} /> Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: HEATMAP GIS */}
      {/* ========================================================= */}
      {activeTab === "heatmap" && (
        <div>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
              <Flame size={20} color="#ea580c" />
              <h3 style={{ fontSize: "1.1rem", color: "var(--primary-900)" }}>Bản Đồ Không Gian GIS - Mật Độ Đơn Hàng Hoàn Thành</h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Phân tích mật độ đơn hàng đã giao thành công theo tọa độ địa lý thực tế để hỗ trợ mở rộng mạng lưới vườn ươm đối tác.
            </p>
          </div>

          <InteractiveMap
            height="500px"
            userLocation={{ lat: 10.7769, lon: 106.7009, name: "Trung tâm TP.HCM" }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 8: USERS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === "users" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "#f8fafc" }}>
                <th style={{ padding: "0.75rem" }}>Họ Tên</th>
                <th style={{ padding: "0.75rem" }}>Tên Đăng Nhập / Email</th>
                <th style={{ padding: "0.75rem" }}>Vai Trò (RBAC)</th>
                <th style={{ padding: "0.75rem" }}>Trạng Thái</th>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.maNguoiDung} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--primary-900)" }}>{u.hoTen || "---"}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <div>{u.tenDangNhap}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span className="badge" style={{ backgroundColor: u.vaiTro === "Admin" ? "#fef3c7" : u.vaiTro === "Supplier" ? "#e0e7ff" : "#f1f5f9", color: u.vaiTro === "Admin" ? "#92400e" : u.vaiTro === "Supplier" ? "#3730a3" : "#334155" }}>
                      {u.vaiTro}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span className="badge" style={{ backgroundColor: u.trangThai === "Active" ? "#dcfce7" : "#fee2e2", color: u.trangThai === "Active" ? "#166534" : "#991b1b" }}>
                      {u.trangThai}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "right" }}>
                    {u.vaiTro !== "Admin" && (
                      <button
                        onClick={() => handleToggleLockUser(u.maNguoiDung, u.trangThai)}
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        {u.trangThai === "Active" ? (
                          <>
                            <Lock size={12} color="#dc2626" /> Khóa
                          </>
                        ) : (
                          <>
                            <Unlock size={12} color="#16a34a" /> Mở Khóa
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: KIỂM DUYỆT CÂY CẢNH */}
      {/* ========================================================= */}
      {activeTab === "approval" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--primary-900)" }}>Kiểm Duyệt Cây Cảnh Chờ Xuất Bản</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Duyệt thông tin loài cây và thông số sinh trưởng đối chiếu thổ nhưỡng trước khi cho phép hiển thị trên sàn thương mại.
              </p>
            </div>
            <span className="badge badge-gis">
              {pendingPlantsList.length} cây chờ duyệt
            </span>
          </div>

          {pendingPlantsList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <CheckCircle size={40} color="#16a34a" style={{ marginBottom: "0.75rem" }} />
              <div style={{ fontWeight: 600, color: "var(--primary-900)" }}>Hiện không có cây cảnh nào chờ kiểm duyệt!</div>
              <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>Toàn bộ sản phẩm đã được phê duyệt và xuất bản hợp lệ.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "0.75rem" }}>Cây Cảnh</th>
                    <th style={{ padding: "0.75rem" }}>Danh Mục</th>
                    <th style={{ padding: "0.75rem" }}>Giá Đề Xuất</th>
                    <th style={{ padding: "0.75rem" }}>Nhiệt Độ / Độ Ẩm</th>
                    <th style={{ padding: "0.75rem" }}>Ánh Sáng / Đất</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPlantsList.map((p) => (
                    <tr key={p.macay} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img src={p.anhchinh || "/assets/images/cay_van_phong.jpg"} alt={p.tencay} style={{ width: "45px", height: "45px", objectFit: "cover", borderRadius: "6px" }} />
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--primary-900)" }}>{p.tencay}</div>
                            <div style={{ fontSize: "0.75rem", fontStyle: "italic", color: "var(--text-muted)" }}>{p.tenkhoahoc || p.macay}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>{p.tendanhmuc || "---"}</td>
                      <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--primary-800)" }}>
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.giaban)}
                      </td>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                        <div>🌡️ {p.nhietdotoithieu}°C - {p.nhietdotoida}°C</div>
                        <div>💧 {p.doamtoiuu}%</div>
                      </td>
                      <td style={{ padding: "0.75rem", fontSize: "0.8rem" }}>
                        <div>☀️ {p.yeucauanhsang}</div>
                        <div style={{ color: "var(--text-muted)" }}>🌱 {p.loaidat}</div>
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => handleApprovePlant(p.macay)}
                            className="btn btn-sm"
                            style={{ backgroundColor: "#16a34a", color: "#fff", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <CheckCircle size={14} /> Duyệt
                          </button>
                          <button
                            onClick={() => handleRejectPlant(p.macay)}
                            className="btn btn-sm btn-secondary"
                            style={{ color: "#dc2626", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <XCircle size={14} /> Từ Chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: QUẢN LÝ TỒN KHO (CRUD) */}
      {/* ========================================================= */}
      {activeTab === "inventory" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", flex: 1, minWidth: "280px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Tìm theo tên cây, mã kho hoặc vườn..."
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: "32px", fontSize: "0.85rem" }}
                />
              </div>
              <select
                value={inventoryNurseryFilter}
                onChange={(e) => setInventoryNurseryFilter(e.target.value)}
                className="input-field"
                style={{ width: "220px", fontSize: "0.85rem" }}
              >
                <option value="">Tất cả vườn ươm</option>
                {nurseriesList.map((n) => (
                  <option key={n.maVuonUom} value={n.maVuonUom}>
                    {n.tenVuonUom}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                setInventoryModal({
                  open: true,
                  mode: "create",
                  data: {
                    maCay: plantsList[0]?.maCay || "",
                    maVuonUom: nurseriesList[0]?.maVuonUom || "",
                    soLuongTon: 50,
                  },
                })
              }
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Thêm Tồn Kho Mới
            </button>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-light)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-light)", textAlign: "left", color: "var(--text-muted)", backgroundColor: "#f8fafc" }}>
                  <th style={{ padding: "0.75rem" }}>Mã Kho</th>
                  <th style={{ padding: "0.75rem" }}>Cây Cảnh</th>
                  <th style={{ padding: "0.75rem" }}>Vườn Ươm</th>
                  <th style={{ padding: "0.75rem" }}>Nhà Cung Cấp</th>
                  <th style={{ padding: "0.75rem" }}>Tồn Hiện Tại</th>
                  <th style={{ padding: "0.75rem" }}>Tạm Giữ (Lock)</th>
                  <th style={{ padding: "0.75rem" }}>Khả Dụng</th>
                  <th style={{ padding: "0.75rem" }}>Cập Nhật Lần Cuối</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((inv) => (
                  <tr key={inv.maTonKho} style={{ borderBottom: "1px solid var(--border-light)" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>{inv.maTonKho}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--primary-900)" }}>{inv.tenCay}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{inv.tenDanhMuc || inv.maCay}</div>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 600 }}>{inv.tenVuonUom}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{inv.maVuonUom}</div>
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{inv.tenCongTy || "---"}</td>
                    <td style={{ padding: "0.75rem" }}>
                      <span className="badge" style={{ backgroundColor: inv.soLuongTon > 10 ? "#dcfce7" : "#fee2e2", color: inv.soLuongTon > 10 ? "#166534" : "#991b1b", fontWeight: 700 }}>
                        {inv.soLuongTon} cây
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#ea580c", fontWeight: 600 }}>
                      {inv.soLuongTamGiu} cây
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--primary-800)", fontWeight: 800 }}>
                      {inv.tonKhaDung} cây
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {inv.lanCapNhatCuoi ? new Date(inv.lanCapNhatCuoi).toLocaleDateString("vi-VN") : "---"}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => setInventoryModal({ open: true, mode: "edit", data: { ...inv } })}
                          className="btn btn-secondary btn-sm"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.3rem 0.6rem" }}
                          title="Chỉnh sửa số lượng tồn kho"
                        >
                          <Edit2 size={14} /> Sửa
                        </button>
                        <button
                          onClick={() => setDeleteDialog({ open: true, type: "inventory", id: inv.maTonKho, title: `Tồn kho ${inv.maTonKho} (${inv.tenCay} tại ${inv.tenVuonUom})` })}
                          className="btn btn-sm"
                          style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "none", display: "inline-flex", alignItems: "center", gap: "4px", padding: "0.3rem 0.6rem" }}
                          title="Xóa bản ghi tồn kho"
                        >
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA CÂY CẢNH */}
      {/* ========================================================= */}
      {plantModal.open && plantModal.data && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", maxWidth: "720px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.25rem", color: "var(--primary-900)" }}>
                {plantModal.mode === "create" ? "Thêm Cây Cảnh Mới (Admin)" : `Chỉnh Sửa Cây Cảnh: ${plantModal.data.tenCay}`}
              </h3>
              <button onClick={() => setPlantModal({ open: false, mode: "create", data: null })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSavePlant} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="input-group">
                  <label className="input-label">Tên Cây Cảnh *</label>
                  <input
                    type="text"
                    required
                    value={plantModal.data.tenCay || ""}
                    onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, tenCay: e.target.value } })}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Tên Khoa Học</label>
                  <input
                    type="text"
                    value={plantModal.data.tenKhoaHoc || ""}
                    onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, tenKhoaHoc: e.target.value } })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div className="input-group">
                  <label className="input-label">Giá Bán (VND) *</label>
                  <input
                    type="number"
                    required
                    value={plantModal.data.giaBan || 0}
                    onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, giaBan: e.target.value } })}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Danh Mục *</label>
                  <select
                    value={plantModal.data.maDanhMuc || ""}
                    onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, maDanhMuc: e.target.value } })}
                    className="input-field"
                  >
                    {categoriesList.map((c) => (
                      <option key={c.maDanhMuc} value={c.maDanhMuc}>
                        {c.tenDanhMuc}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Trạng Thái</label>
                  <select
                    value={plantModal.data.trangThai || "Active"}
                    onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, trangThai: e.target.value } })}
                    className="input-field"
                  >
                    <option value="Active">Active (Đang bán)</option>
                    <option value="Pending">Pending (Chờ duyệt)</option>
                    <option value="Rejected">Rejected (Từ chối)</option>
                  </select>
                </div>
              </div>

              {/* Upload Image Section */}
              <div className="input-group">
                <label className="input-label">Hình Ảnh Đại Diện Cây</label>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <label className="btn btn-secondary" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Upload size={16} />
                    <span>{uploadingPlantImg ? "Đang tải ảnh..." : "Chọn ảnh từ máy (lưu assets/images)"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={uploadingPlantImg}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadImage(e.target.files[0], (url) => {
                            setPlantModal({ ...plantModal, data: { ...plantModal.data, hinhAnhUrl: url, anhChinh: url } });
                          });
                        }
                      }}
                    />
                  </label>
                  {plantModal.data.hinhAnhUrl && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src={plantModal.data.hinhAnhUrl} alt="preview" style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{plantModal.data.hinhAnhUrl}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tham số sinh trưởng */}
              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary-900)", marginBottom: "0.75rem" }}>
                  Tham Số Sinh Trưởng 1-1 (YeuCauSinhTruong)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Nhiệt độ tối thiểu (°C)</label>
                    <input
                      type="number"
                      value={plantModal.data.growthRequirement?.nhietDoToiThieu || 18}
                      onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, growthRequirement: { ...plantModal.data.growthRequirement, nhietDoToiThieu: Number(e.target.value) } } })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Nhiệt độ tối đa (°C)</label>
                    <input
                      type="number"
                      value={plantModal.data.growthRequirement?.nhietDoToiDa || 35}
                      onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, growthRequirement: { ...plantModal.data.growthRequirement, nhietDoToiDa: Number(e.target.value) } } })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Độ ẩm tối ưu (%)</label>
                    <input
                      type="number"
                      value={plantModal.data.growthRequirement?.doAmToiUu || 65}
                      onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, growthRequirement: { ...plantModal.data.growthRequirement, doAmToiUu: Number(e.target.value) } } })}
                      className="input-field"
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem", marginTop: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Nhu cầu ánh sáng</label>
                    <select
                      value={plantModal.data.growthRequirement?.yeuCauAnhSang || "Bán râm"}
                      onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, growthRequirement: { ...plantModal.data.growthRequirement, yeuCauAnhSang: e.target.value } } })}
                      className="input-field"
                    >
                      <option value="Toàn phần">Toàn phần (Nắng trực tiếp)</option>
                      <option value="Bán râm">Bán râm</option>
                      <option value="Trong nhà">Trong nhà (Ưa râm)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Loại đất khuyên dùng</label>
                    <input
                      type="text"
                      value={plantModal.data.growthRequirement?.loaiDat || "Đất hữu cơ tơi xốp"}
                      onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, growthRequirement: { ...plantModal.data.growthRequirement, loaiDat: e.target.value } } })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Mô Tả Sản Phẩm</label>
                <textarea
                  rows={3}
                  value={plantModal.data.moTa || ""}
                  onChange={(e) => setPlantModal({ ...plantModal, data: { ...plantModal.data, moTa: e.target.value } })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setPlantModal({ open: false, mode: "create", data: null })} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {plantModal.mode === "create" ? "Tạo Cây Cảnh" : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA NHÀ CUNG CẤP */}
      {/* ========================================================= */}
      {supplierModal.open && supplierModal.data && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", maxWidth: "540px", width: "100%", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", color: "var(--primary-900)" }}>
                {supplierModal.mode === "create" ? "Thêm Nhà Cung Cấp Mới" : `Sửa Nhà Cung Cấp: ${supplierModal.data.tenCongTy}`}
              </h3>
              <button onClick={() => setSupplierModal({ open: false, mode: "create", data: null })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">Tên Doanh Nghiệp / Vườn Ươm *</label>
                <input
                  type="text"
                  required
                  value={supplierModal.data.tenCongTy || ""}
                  onChange={(e) => setSupplierModal({ ...supplierModal, data: { ...supplierModal.data, tenCongTy: e.target.value } })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="input-group">
                  <label className="input-label">Mã Số Thuế</label>
                  <input
                    type="text"
                    value={supplierModal.data.maSoThue || ""}
                    onChange={(e) => setSupplierModal({ ...supplierModal, data: { ...supplierModal.data, maSoThue: e.target.value } })}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Điểm Uy Tín (1-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={supplierModal.data.diemUyTin || 5.0}
                    onChange={(e) => setSupplierModal({ ...supplierModal, data: { ...supplierModal.data, diemUyTin: e.target.value } })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="input-group">
                  <label className="input-label">Email Liên Hệ *</label>
                  <input
                    type="email"
                    required
                    value={supplierModal.data.emailLienHe || ""}
                    onChange={(e) => setSupplierModal({ ...supplierModal, data: { ...supplierModal.data, emailLienHe: e.target.value } })}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={supplierModal.data.soDienThoaiLienHe || ""}
                    onChange={(e) => setSupplierModal({ ...supplierModal, data: { ...supplierModal.data, soDienThoaiLienHe: e.target.value } })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setSupplierModal({ open: false, mode: "create", data: null })} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {supplierModal.mode === "create" ? "Thêm Mới" : "Lưu Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA VƯỜN ƯƠM */}
      {/* ========================================================= */}
      {nurseryModal.open && nurseryModal.data && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", maxWidth: "600px", width: "100%", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", color: "var(--primary-900)" }}>
                {nurseryModal.mode === "create" ? "Thêm Vườn Ươm Mới" : `Sửa Vườn Ươm: ${nurseryModal.data.tenVuonUom}`}
              </h3>
              <button onClick={() => setNurseryModal({ open: false, mode: "create", data: null })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNursery} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">Tên Vườn Ươm *</label>
                <input
                  type="text"
                  required
                  value={nurseryModal.data.tenVuonUom || ""}
                  onChange={(e) => setNurseryModal({ ...nurseryModal, data: { ...nurseryModal.data, tenVuonUom: e.target.value } })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Nhà Cung Cấp Trực Thuộc *</label>
                <select
                  value={nurseryModal.data.maNhaCungCap || ""}
                  onChange={(e) => setNurseryModal({ ...nurseryModal, data: { ...nurseryModal.data, maNhaCungCap: e.target.value } })}
                  className="input-field"
                >
                  {suppliersList.map((s) => (
                    <option key={s.maNhaCungCap} value={s.maNhaCungCap}>
                      {s.tenCongTy} ({s.maNhaCungCap})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Địa Chỉ Thực Tế *</label>
                <input
                  type="text"
                  required
                  value={nurseryModal.data.diaChi || ""}
                  onChange={(e) => setNurseryModal({ ...nurseryModal, data: { ...nurseryModal.data, diaChi: e.target.value } })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="input-group">
                  <label className="input-label">Vĩ Độ GIS (Latitude) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={nurseryModal.data.viDo || 10.77}
                    onChange={(e) => setNurseryModal({ ...nurseryModal, data: { ...nurseryModal.data, viDo: e.target.value } })}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Kinh Độ GIS (Longitude) *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={nurseryModal.data.kinhDo || 106.70}
                    onChange={(e) => setNurseryModal({ ...nurseryModal, data: { ...nurseryModal.data, kinhDo: e.target.value } })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="input-group">
                  <label className="input-label">Bán Kính Giao Tối Đa (km) *</label>
                  <input
                    type="number"
                    required
                    value={nurseryModal.data.banKinhGiaoToiDaKm || 30}
                    onChange={(e) => setNurseryModal({ ...nurseryModal, data: { ...nurseryModal.data, banKinhGiaoToiDaKm: e.target.value } })}
                    className="input-field"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Ngưỡng Tồn Kho Cảnh Báo</label>
                  <input
                    type="number"
                    value={nurseryModal.data.nguongTonKhoToiThieu || 5}
                    onChange={(e) => setNurseryModal({ ...nurseryModal, data: { ...nurseryModal.data, nguongTonKhoToiThieu: e.target.value } })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setNurseryModal({ open: false, mode: "create", data: null })} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {nurseryModal.mode === "create" ? "Thêm Vườn" : "Lưu Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA DANH MỤC */}
      {/* ========================================================= */}
      {categoryModal.open && categoryModal.data && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", maxWidth: "480px", width: "100%", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", color: "var(--primary-900)" }}>
                {categoryModal.mode === "create" ? "Thêm Danh Mục Mới" : `Sửa Danh Mục: ${categoryModal.data.tenDanhMuc}`}
              </h3>
              <button onClick={() => setCategoryModal({ open: false, mode: "create", data: null })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="input-group">
                <label className="input-label">Tên Danh Mục Cây Cảnh *</label>
                <input
                  type="text"
                  required
                  value={categoryModal.data.tenDanhMuc || ""}
                  onChange={(e) => setCategoryModal({ ...categoryModal, data: { ...categoryModal.data, tenDanhMuc: e.target.value } })}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Mô Tả Danh Mục</label>
                <textarea
                  rows={3}
                  value={categoryModal.data.moTa || ""}
                  onChange={(e) => setCategoryModal({ ...categoryModal, data: { ...categoryModal.data, moTa: e.target.value } })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setCategoryModal({ open: false, mode: "create", data: null })} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {categoryModal.mode === "create" ? "Thêm Mới" : "Lưu Cập Nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THÊM / SỬA TỒN KHO */}
      {/* ========================================================= */}
      {inventoryModal.open && inventoryModal.data && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", maxWidth: "520px", width: "100%", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.25rem", color: "var(--primary-900)" }}>
                {inventoryModal.mode === "create" ? "Thêm Bản Ghi Tồn Kho Mới" : `Điều Chỉnh Tồn Kho #${inventoryModal.data.maTonKho}`}
              </h3>
              <button onClick={() => setInventoryModal({ open: false, mode: "create", data: null })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveInventory} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {inventoryModal.mode === "create" ? (
                <>
                  <div className="input-group">
                    <label className="input-label">Chọn Cây Cảnh *</label>
                    <select
                      value={inventoryModal.data.maCay || ""}
                      onChange={(e) => setInventoryModal({ ...inventoryModal, data: { ...inventoryModal.data, maCay: e.target.value } })}
                      className="input-field"
                      required
                    >
                      <option value="">-- Chọn loài cây --</option>
                      {plantsList.map((p) => (
                        <option key={p.maCay} value={p.maCay}>
                          {p.tenCay} ({p.maCay})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Chọn Vườn Ươm Phân Phối *</label>
                    <select
                      value={inventoryModal.data.maVuonUom || ""}
                      onChange={(e) => setInventoryModal({ ...inventoryModal, data: { ...inventoryModal.data, maVuonUom: e.target.value } })}
                      className="input-field"
                      required
                    >
                      <option value="">-- Chọn vườn ươm --</option>
                      {nurseriesList.map((n) => (
                        <option key={n.maVuonUom} value={n.maVuonUom}>
                          {n.tenVuonUom} ({n.maVuonUom})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-md)", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div><strong>Cây cảnh:</strong> {inventoryModal.data.tenCay}</div>
                  <div><strong>Vườn ươm:</strong> {inventoryModal.data.tenVuonUom}</div>
                  <div><strong>Đang tạm giữ (khóa):</strong> <span style={{ color: "#ea580c", fontWeight: 700 }}>{inventoryModal.data.soLuongTamGiu || 0} cây</span></div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Số Lượng Tồn Thực Tế Tại Vườn *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={inventoryModal.data.soLuongTon !== undefined ? inventoryModal.data.soLuongTon : 0}
                  onChange={(e) => setInventoryModal({ ...inventoryModal, data: { ...inventoryModal.data, soLuongTon: e.target.value } })}
                  className="input-field"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setInventoryModal({ open: false, mode: "create", data: null })} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {inventoryModal.mode === "create" ? "Tạo Tồn Kho" : "Lưu Số Lượng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XEM CHI TIẾT ĐƠN HÀNG (STRICTLY READ-ONLY) */}
      {/* ========================================================= */}
      {orderDetailModal.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", color: "var(--primary-900)" }}>
                  Chi Tiết Đơn Hàng #{orderDetailModal.data?.maDonHang}
                </h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Chế độ giám sát đơn hàng (Chỉ xem - Không chỉnh sửa/xóa)
                </span>
              </div>
              <button onClick={() => setOrderDetailModal({ open: false, data: null, loading: false })} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {orderDetailModal.loading ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Đang nạp chi tiết đơn hàng...</div>
            ) : orderDetailModal.data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Status Badges */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span className="badge badge-gis">Trạng thái: {orderDetailModal.data.trangThaiDonHang}</span>
                  <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>Thanh toán: {orderDetailModal.data.trangThaiThanhToan}</span>
                  <span className="badge" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>PTTT: {orderDetailModal.data.phuongThucThanhToan}</span>
                </div>

                {/* Customer & Delivery Information */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                  <div>
                    <strong style={{ color: "var(--primary-900)" }}>Khách Hàng:</strong>
                    <div>{orderDetailModal.data.khachHang?.hoTen || "Khách hàng"}</div>
                    <div style={{ color: "var(--text-muted)" }}>{orderDetailModal.data.khachHang?.email}</div>
                    <div style={{ color: "var(--text-muted)" }}>📞 {orderDetailModal.data.khachHang?.soDienThoai || "---"}</div>
                  </div>
                  <div>
                    <strong style={{ color: "var(--primary-900)" }}>Địa Chỉ Nhận Hàng (GIS):</strong>
                    <div>{orderDetailModal.data.diaChiGiaoHang?.diaChi}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      📍 {orderDetailModal.data.diaChiGiaoHang?.viDo}, {orderDetailModal.data.diaChiGiaoHang?.kinhDo}
                    </div>
                    <div style={{ color: "var(--primary-700)", fontWeight: 600 }}>
                      🚚 Khoảng cách tuyến: {orderDetailModal.data.khoangCachKm} km
                    </div>
                  </div>
                </div>

                {/* Health photo check */}
                {orderDetailModal.data.anhSucKhoeUrl && (
                  <div style={{ border: "1px solid #86efac", backgroundColor: "#f0fdf4", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <img src={orderDetailModal.data.anhSucKhoeUrl} alt="health" style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                    <div style={{ fontSize: "0.8rem", color: "#166534" }}>
                      <strong>Ảnh chụp thực tế kiểm định sức khỏe cây (BR13):</strong>
                      <div>Đã kiểm duyệt đạt chuẩn trước khi xuất vườn.</div>
                    </div>
                  </div>
                )}

                {/* Item List */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary-900)", marginBottom: "0.5rem" }}>
                    Danh Sách Sản Phẩm Đặt Mua:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {orderDetailModal.data.items?.map((item) => (
                      <div key={item.maChiTietDonHang} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0.75rem", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img src={item.anhCay} alt={item.tenCay} style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover" }} />
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--primary-900)" }}>{item.tenCay}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Số lượng: {item.soLuong} cây</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: "var(--primary-800)" }}>
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.thanhTien)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.9rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>Cước vận chuyển GIS ({orderDetailModal.data.khoangCachKm} km):</span>
                    <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(orderDetailModal.data.phiVanChuyen)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", color: "var(--primary-900)", marginTop: "4px" }}>
                    <span>TỔNG CỘNG:</span>
                    <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(orderDetailModal.data.tongTien)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                  <button onClick={() => setOrderDetailModal({ open: false, data: null, loading: false })} className="btn btn-secondary">
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================= */}
      {deleteDialog.open && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "var(--radius-xl)", maxWidth: "440px", width: "100%", padding: "1.75rem", textAlign: "center" }}>
            <Trash2 size={40} color="#dc2626" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.2rem", color: "#991b1b", marginBottom: "0.5rem" }}>Xác Nhận Xóa Bản Ghi</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Bạn có chắc chắn muốn xóa <strong>{deleteDialog.title}</strong>? Thao tác này sẽ xóa vĩnh viễn dữ liệu khỏi hệ thống.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => setDeleteDialog({ open: false, type: "", id: "", title: "" })} className="btn btn-secondary">
                Hủy Bỏ
              </button>
              <button onClick={handleConfirmDelete} className="btn" style={{ backgroundColor: "#dc2626", color: "#ffffff", border: "none" }}>
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
