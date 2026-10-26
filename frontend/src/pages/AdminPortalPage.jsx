import React, { useState, useEffect } from 'react';
import api from '../api/client';
import InteractiveMap from '../components/InteractiveMap';
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
} from 'lucide-react';

export default function AdminPortalPage() {
  const [stats, setStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [pendingPlants, setPendingPlants] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'heatmap' | 'moderation' | 'users'

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [statsRes, heatRes, plantsRes, usersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/heatmap'),
        api.get('/plants?status=Pending'),
        api.get('/admin/users'),
      ]);

      setStats(statsRes.data?.data);
      setHeatmapData(heatRes.data?.data || []);
      setPendingPlants(plantsRes.data?.data || []);
      setUsersList(usersRes.data?.data || []);
    } catch (err) {
      console.error('Admin data error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Handle Plant Approval (BR04)
  const handleApprovePlant = async (plantId, approved) => {
    try {
      await api.patch(`/plants/${plantId}/status`, {
        trangThai: approved ? 'Active' : 'Rejected',
        daXuatBan: approved,
      });
      alert(approved ? 'Đã phê duyệt sản phẩm thành công!' : 'Đã từ chối sản phẩm.');
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Lỗi kiểm duyệt sản phẩm.');
    }
  };

  // Handle Toggle User Lock
  const handleToggleLockUser = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Locked' : 'Active';
    try {
      await api.patch(`/admin/users/${userId}/status`, { trangThai: nextStatus });
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật trạng thái người dùng.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        Đang nạp bảng điều khiển quản trị hệ thống...
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--primary-600)', fontWeight: 700 }}>
          HỆ THỐNG QUẢN TRỊ & GIÁM SÁT GIS (ADMIN & STAFF)
        </div>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary-900)', marginTop: '0.25rem' }}>
          Trung Tâm Vận Hành & Bản Đồ Nhiệt Không Gian
        </h1>
      </div>

      {/* Overview Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>TỔNG DOANH THU SÀN</span>
            <TrendingUp size={18} color="var(--primary-600)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)', marginTop: '0.5rem' }}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.tongDoanThu || 0)}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>TỔNG ĐƠN HÀNG</span>
            <Package size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)', marginTop: '0.5rem' }}>
            {stats?.tongDonHang || 0} đơn
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
            ✓ {stats?.donDaHoanThanh || 0} đơn đã hoàn thành
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>CÂY CHỜ DUYỆT (BR04)</span>
            <ShieldCheck size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)', marginTop: '0.5rem' }}>
            {stats?.cayChoDuyet || 0} cây
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Cần kiểm tra tham số sinh trưởng
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>NGƯỜI DÙNG HỆ THỐNG</span>
            <Users size={18} color="#6366f1" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)', marginTop: '0.5rem' }}>
            {stats?.tongNguoiDung || 0} tài khoản
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-light)',
        marginBottom: '2rem',
      }}>
        {[
          { key: 'overview', label: '📊 Cảnh Báo Tồn Kho Tối Thiểu (BR18)' },
          { key: 'heatmap', label: '🔥 Bản Đồ Nhiệt Heatmap Đơn Hàng (BR19)' },
          { key: 'moderation', label: `🛡️ Kiểm Duyệt Cây Cảnh (${pendingPlants.length}) (BR04)` },
          { key: 'users', label: '👥 Quản Lý Người Dùng' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === tab.key ? 'var(--primary-700)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.key ? '3px solid var(--primary-700)' : '3px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Low-Stock Alerts (BR18) */}
      {activeTab === 'overview' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <AlertTriangle size={20} color="#b45309" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-900)' }}>
              Cảnh Báo Tồn Kho Tối Thiểu (minStockThreshold - BR18)
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Tự động kích hoạt cảnh báo bổ sung hàng khi số lượng tồn kho giảm xuống bằng hoặc thấp hơn ngưỡng tối thiểu của vườn.
          </p>

          {stats?.canhBaoTonKhoThap?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.canhBaoTonKhoThap.map((alertItem) => (
                <div
                  key={alertItem.maTonKho}
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    padding: '0.85rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>{alertItem.tenCay}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#78350f' }}>
                      Tại: {alertItem.tenVuonUom} ({alertItem.tenCongTy})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-DaHuy">
                      Còn {alertItem.soLuongTon} cây (Ngưỡng: {alertItem.nguongToiThieu})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              ✓ Tất cả các vườn ươm hiện đều đáp ứng tốt ngưỡng tồn kho tối thiểu.
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GIS Heatmap (BR19) */}
      {activeTab === 'heatmap' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <Flame size={20} color="#ea580c" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-900)' }}>
              Bản Đồ Nhiệt Mật Độ Đơn Hàng Hoàn Thành (Heatmap GIS - BR19)
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Phân tích mật độ đơn hàng đã giao thành công (DaHoanThanh) theo tọa độ địa lý phục vụ quy hoạch mở rộng vườn ươm mới.
          </p>

          <InteractiveMap
            nurseries={[]}
            userLocation={{ lat: 10.7745, lon: 106.7032, name: 'Trung tâm phân tích Heatmap TP. HCM' }}
            height="460px"
          />

          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Thống Kê Điểm Mật Độ Đơn Hàng:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {heatmapData.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--surface-bg)', borderRadius: '6px', fontSize: '0.8rem' }}>
                  <span>📍 {h.diaChiChiTiet} ([{h.viDo?.toFixed(4)}, {h.kinhDo?.toFixed(4)}])</span>
                  <span><strong>{h.soDonHang} đơn</strong> | Tổng giá trị: {new Intl.NumberFormat('vi-VN').format(h.tongGiaTri)} đ</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Product Approval Pipeline (BR04) */}
      {activeTab === 'moderation' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-900)', marginBottom: '1rem' }}>
            Danh Sách Cây Cảnh Đang Chờ Kiểm Duyệt (Pending)
          </h3>

          {pendingPlants.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              ✓ Không có cây cảnh nào đang chờ duyệt.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingPlants.map((plant) => (
                <div
                  key={plant.maCay}
                  style={{
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1rem', color: 'var(--primary-900)' }}>{plant.tenCay}</h4>
                    <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      {plant.tenKhoaHoc} | Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(plant.giaBan)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Sinh trưởng: {plant.yeuCauSinhTruong?.nhietDoToiThieu}°C - {plant.yeuCauSinhTruong?.nhietDoToiDa}°C | {plant.yeuCauSinhTruong?.yeuCauAnhSang} | {plant.yeuCauSinhTruong?.loaiDat}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleApprovePlant(plant.maCay, true)}
                      className="btn btn-primary btn-sm"
                    >
                      <CheckCircle size={14} /> Duyệt & Xuất Bản
                    </button>
                    <button
                      onClick={() => handleApprovePlant(plant.maCay, false)}
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                      <XCircle size={14} /> Từ Chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: User Management */}
      {activeTab === 'users' && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--primary-900)', marginBottom: '1rem' }}>
            Danh Sách Người Dùng & Phân Quyền (BR01, BR02)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {usersList.map((u) => (
              <div
                key={u.maNguoiDung}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-900)' }}>
                    {u.hoTen} ({u.tenDangNhap})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {u.email} | SĐT: {u.soDienThoai} | Vai trò: <strong>{u.vaiTro}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge ${u.trangThai === 'Active' ? 'badge-climate-high' : 'badge-DaHuy'}`}>
                    {u.trangThai}
                  </span>

                  {u.vaiTro !== 'Admin' && (
                    <button
                      onClick={() => handleToggleLockUser(u.maNguoiDung, u.trangThai)}
                      className="btn btn-secondary btn-sm"
                    >
                      {u.trangThai === 'Active' ? <Lock size={13} /> : <Unlock size={13} />}
                      {u.trangThai === 'Active' ? 'Khóa' : 'Mở Khóa'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
