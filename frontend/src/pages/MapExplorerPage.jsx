import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useLocation } from '../context/LocationContext';
import InteractiveMap from '../components/InteractiveMap';
import { MapPin, Compass, Truck, Star, TreePine, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MapExplorerPage() {
  const { currentLocation, setCoordinates } = useLocation();
  const [nurseries, setNurseries] = useState([]);
  const [selectedNursery, setSelectedNursery] = useState(null);
  const [nurseryDetail, setNurseryDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNurseries() {
      try {
        setLoading(true);
        const res = await api.get(`/nurseries?lat=${currentLocation.lat}&lon=${currentLocation.lon}`);
        const data = res.data?.data || [];
        setNurseries(data);
        if (data.length > 0) {
          setSelectedNursery(data[0]);
        }
      } catch (err) {
        console.error('Fetch nurseries error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNurseries();
  }, [currentLocation]);

  useEffect(() => {
    if (!selectedNursery) return;
    api.get(`/nurseries/${selectedNursery.maVuonUom}`)
      .then((res) => setNurseryDetail(res.data?.data))
      .catch((err) => console.error(err));
  }, [selectedNursery]);

  const handleMapLocationSelect = (lat, lon, address) => {
    setCoordinates(lat, lon, address);
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
          Bản Đồ Không Gian GIS & Mạng Lưới Vườn Ươm
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Nhấp chuột bất kỳ trên bản đồ để đổi điểm ghim nhận hàng hoặc chọn vườn ươm để xem bán kính giao hàng tối đa.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Interactive Map */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 'var(--radius-xl)', padding: '1rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
          <InteractiveMap
            nurseries={nurseries}
            userLocation={{ lat: currentLocation.lat, lon: currentLocation.lon, name: currentLocation.name }}
            onLocationSelect={handleMapLocationSelect}
            selectedNurseryId={selectedNursery?.maVuonUom}
            height="580px"
          />

          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="var(--primary-600)" />
            Tọa độ hiện tại của bạn: <strong>{currentLocation.lat.toFixed(4)}, {currentLocation.lon.toFixed(4)}</strong> ({currentLocation.name})
          </div>
        </div>

        {/* Nursery Sidebar Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary-900)', marginBottom: '0.75rem' }}>
              Danh Sách Vườn Ươm Khu Vực
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
              {nurseries.map((n) => {
                const isSelected = selectedNursery?.maVuonUom === n.maVuonUom;
                return (
                  <div
                    key={n.maVuonUom}
                    onClick={() => setSelectedNursery(n)}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid var(--primary-600)' : '1px solid var(--border-light)',
                      backgroundColor: isSelected ? 'var(--primary-50)' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-900)' }}>
                        {n.tenVuonUom}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Bán kính: {n.banKinhGiaoToiDaKm} km | ⭐ {n.danhGiaNhaCungCap}
                      </div>
                    </div>
                    {n.khoangCachKm !== null && (
                      <span className="badge badge-gis">
                        {n.khoangCachKm} km
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Nursery Inventory Showcase */}
          {selectedNursery && nurseryDetail && (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-light)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
                <TreePine size={18} color="var(--primary-700)" />
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-900)' }}>
                  Kho Cây Tại: {nurseryDetail.tenVuonUom}
                </h4>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Đơn vị sở hữu: <strong>{nurseryDetail.nhaCungCap?.tenCongTy}</strong> (Uy tín: ⭐ {nurseryDetail.nhaCungCap?.diemUyTin}/5)
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                {nurseryDetail.tonKho?.map((item) => (
                  <div
                    key={item.maTonKho}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.4rem',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    <img
                      src={item.anhChinh || 'https://images.unsplash.com/photo-1632207691143-643e2a9a9361?auto=format&fit=crop&w=120&q=80'}
                      alt={item.tenCay}
                      style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div style={{ flexGrow: 1 }}>
                      <Link to={`/products/${item.maCay}`} style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary-900)' }}>
                        {item.tenCay}
                      </Link>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 700 }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.giaBan)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Còn <strong>{item.tonKhaDung}</strong> cây
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
