import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Calendar,
  MapPin,
  Clock,
  Eye,
  CheckCircle,
  Truck,
  AlertCircle,
} from 'lucide-react';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const url = filterStatus ? `/orders?status=${filterStatus}` : '/orders';
        const res = await api.get(url);
        setOrders(res.data?.data || []);
      } catch (err) {
        console.error('Fetch orders error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [filterStatus]);

  const getStatusBadge = (status) => {
    const map = {
      ChoXacNhan: { label: 'Chờ Xác Nhận (Giữ Tồn Kho 15p)', class: 'badge-ChoXacNhan' },
      DaXacNhan: { label: 'Đã Xác Nhận', class: 'badge-DaXacNhan' },
      DangChuanBiHang: { label: 'Đang Chuẩn Bị & Kiểm Định Cây', class: 'badge-DangChuanBiHang' },
      DangGiaoHang: { label: 'Đang Giao Hàng (Live Tracking)', class: 'badge-DangGiaoHang' },
      DaHoanThanh: { label: 'Đã Hoàn Thành', class: 'badge-DaHoanThanh' },
      DaHuy: { label: 'Đã Hủy', class: 'badge-DaHuy' },
    };
    const s = map[status] || { label: status, class: 'badge-gis' };
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
            Lịch Sử Đơn Hàng Cây Cảnh
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Quản lý quy trình vận chuyển tuyến tính, kiểm định sức khỏe cây và định vị hành trình thời gian thực.
          </p>
        </div>

        {/* Filter by status */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'ChoXacNhan', 'DangChuanBiHang', 'DangGiaoHang', 'DaHoanThanh'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
            >
              {st === '' ? 'Tất cả' : st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Đang tải danh sách đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          padding: '4rem 2rem',
          textAlign: 'center',
        }}>
          <Package size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
          <h3 style={{ color: 'var(--primary-900)', marginBottom: '0.5rem' }}>Không có đơn hàng nào</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Bạn chưa có đơn đặt hàng nào trong trạng thái này.
          </p>
          <Link to="/products" className="btn btn-primary">
            Khám phá cây cảnh
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div
              key={order.maDonHang}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-800)' }}>
                    #{order.maDonHang}
                  </span>
                  {getStatusBadge(order.trangThaiDonHang)}
                  {order.daXacNhanSucKhoe && (
                    <span className="badge badge-climate-high" style={{ fontSize: '0.7rem' }}>
                      <CheckCircle size={12} /> Cây Đã Kiểm Định Sức Khỏe
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {new Date(order.ngayDatHang).toLocaleString('vi-VN')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} /> {order.tenVuonUom} ({order.khoangCachKm} km)
                  </span>
                  <span>Phương thức: <strong>{order.phuongThucThanhToan}</strong></span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Giao đến: <strong>{order.diaChiGiao?.tenNguoiNhan}</strong> - {order.diaChiGiao?.diaChiChiTiet}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.tongTien)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Cước ship: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.phiVanChuyen)}
                  </div>
                </div>

                <Link to={`/orders/${order.maDonHang}`} className="btn btn-outline btn-sm">
                  <Eye size={15} /> Chi Tiết & Theo Dõi
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
