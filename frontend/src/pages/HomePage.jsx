import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useLocation } from '../context/LocationContext';
import ProductCard from '../components/ProductCard';
import InteractiveMap from '../components/InteractiveMap';
import {
  Compass,
  Sparkles,
  TreePine,
  Search,
  ShieldCheck,
  Truck,
  ArrowRight,
  Thermometer,
  Droplets,
  Layers,
} from 'lucide-react';

export default function HomePage() {
  const { currentLocation } = useLocation();
  const [plants, setPlants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nurseries, setNurseries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [plantsRes, catsRes, nursRes] = await Promise.all([
          api.get(`/plants?lat=${currentLocation.lat}&lon=${currentLocation.lon}&temp=${currentLocation.temp || 28}&humidity=${currentLocation.humidity || 70}`),
          api.get('/categories'),
          api.get(`/nurseries?lat=${currentLocation.lat}&lon=${currentLocation.lon}`),
        ]);
        setPlants(plantsRes.data?.data || []);
        setCategories(catsRes.data?.data || []);
        setNurseries(nursRes.data?.data || []);
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentLocation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #081c15 0%, #1b4332 50%, #2d6a4f 100%)',
        color: '#ffffff',
        padding: '4.5rem 0 5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle decorative circles */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(82,183,136,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(82, 183, 136, 0.2)',
              border: '1px solid rgba(82, 183, 136, 0.4)',
              color: 'var(--primary-200)',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}>
              <Compass size={14} /> NỀN TẢNG CÂY CẢNH TÍCH HỢP GIS ĐẦU TIÊN
            </div>

            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '1.25rem',
              letterSpacing: '-1px',
            }}>
              Chọn Cây Chuẩn Thổ Nhưỡng, Giao Tươi Tận Nơi Qua Bản Đồ GIS
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#d1d5db',
              lineHeight: 1.6,
              marginBottom: '2rem',
            }}>
              Hệ thống tự động phân tích điều kiện nhiệt độ, độ ẩm và loại đất tại tọa độ của bạn để gợi ý các loại cây phù hợp nhất, kết nối trực tiếp các vườn ươm trong bán kính 50km.
            </p>

            {/* Quick Search & Region Selector Bar */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              backgroundColor: '#ffffff',
              padding: '0.5rem',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              maxWidth: '650px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', color: 'var(--text-muted)' }}>
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Tìm tên cây cảnh, bonsai, cây lọc không khí..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  flexGrow: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  color: 'var(--text-main)',
                }}
              />
              <Link to={`/products?search=${encodeURIComponent(searchKeyword)}`} className="btn btn-primary">
                Tìm Kiếm
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Realtime Local Climate & GIS Match Banner */}
      <section className="container">
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem 2rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-800)',
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Compass size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                THÔNG SỐ MÔI TRƯỜNG KHU VỰC CỦA BẠN (GIS)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                {currentLocation.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Thermometer size={20} color="#ea580c" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nhiệt độ TB</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{currentLocation.temp || 30}°C</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Droplets size={20} color="#0284c7" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Độ ẩm TB</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{currentLocation.humidity || 72}%</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} color="#65a30d" />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loại thổ nhưỡng</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{currentLocation.soil || 'Đất phù sa'}</div>
              </div>
            </div>
          </div>

          <Link to="/recommendations" className="btn btn-outline btn-sm">
            Xem Cây Hợp Khí Hậu Này <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase' }}>
              DANH MỤC CÂY CẢNH
            </div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--primary-900)' }}>Khám Phá Theo Không Gian Trồng</h2>
          </div>
          <Link to="/products" style={{ color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}>
          {categories.map((cat) => (
            <Link
              key={cat.maDanhMuc}
              to={`/products?category=${cat.maDanhMuc}`}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-500)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-800)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <TreePine size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-900)' }}>
                {cat.tenDanhMuc}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {cat.moTa?.slice(0, 65)}...
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)', marginTop: 'auto' }}>
                {cat.soCay || 2} loại cây có sẵn
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Plants with GIS Badges */}
      <section className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase' }}>
              CÂY CẢNH NỔI BẬT & ĐỐI CHIẾU GIS
            </div>
            <h2 style={{ fontSize: '1.75rem', color: 'var(--primary-900)' }}>Sản Phẩm Tương Thích Nhất Với Bạn</h2>
          </div>
          <Link to="/products" style={{ color: 'var(--primary-700)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Xem toàn bộ sản phẩm <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Đang nạp danh sách cây cảnh và tính toán chỉ số GIS...
          </div>
        ) : (
          <div className="grid-cols-4">
            {plants.slice(0, 8).map((plant) => (
              <ProductCard key={plant.maCay} plant={plant} />
            ))}
          </div>
        )}
      </section>

      {/* Interactive GIS Nursery Map Explorer Preview */}
      <section className="container">
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-light)',
          padding: '2rem',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase' }}>
                MẠNG LƯỚI KHÔNG GIAN
              </div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-900)' }}>Vườn Ươm Đối Tác Trong Vùng Địa Lý</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Xem vị trí thực tế của các vườn ươm và bán kính giao hàng tối đa ({currentLocation.name})
              </p>
            </div>
            <Link to="/map-explorer" className="btn btn-primary">
              Mở Toàn Màn Hình Bản Đồ <Compass size={16} />
            </Link>
          </div>

          <InteractiveMap
            nurseries={nurseries}
            userLocation={{ lat: currentLocation.lat, lon: currentLocation.lon, name: currentLocation.name }}
            height="400px"
          />
        </div>
      </section>
    </div>
  );
}
