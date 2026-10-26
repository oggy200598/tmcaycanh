import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useLocation } from '../context/LocationContext';
import ProductCard from '../components/ProductCard';
import { Filter, Search, RotateCcw, MapPin, Sun, Sparkles } from 'lucide-react';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentLocation } = useLocation();

  const [plants, setPlants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCat, setSelectedCat] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sunlight, setSunlight] = useState(searchParams.get('sunlight') || '');
  const [radiusKm, setRadiusKm] = useState(searchParams.get('radiusKm') || '');

  useEffect(() => {
    // Load categories
    api.get('/categories')
      .then((res) => setCategories(res.data?.data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    async function fetchFilteredPlants() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (selectedCat) params.append('category', selectedCat);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (sunlight) params.append('sunlight', sunlight);
        if (radiusKm) params.append('radiusKm', radiusKm);

        // Always attach user coordinates for GIS calculation
        params.append('lat', currentLocation.lat);
        params.append('lon', currentLocation.lon);
        params.append('temp', currentLocation.temp || 28);
        params.append('humidity', currentLocation.humidity || 70);

        const res = await api.get(`/plants?${params.toString()}`);
        setPlants(res.data?.data || []);
      } catch (err) {
        console.error('Fetch plants error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFilteredPlants();
  }, [search, selectedCat, minPrice, maxPrice, sunlight, radiusKm, currentLocation]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCat('');
    setMinPrice('');
    setMaxPrice('');
    setSunlight('');
    setRadiusKm('');
    setSearchParams({});
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Title & Location indicator */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
            Danh Sách Cây Cảnh & Sinh Thái
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Tìm kiếm theo thông số sinh trưởng và khoảng cách vườn ươm gần nhất từ <strong>{currentLocation.name}</strong>
          </p>
        </div>

        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-700)' }}>
          Tìm thấy <strong>{plants.length}</strong> sản phẩm phù hợp
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Filter Sidebar */}
        <aside style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--primary-900)' }}>
              <Filter size={18} /> Bộ Lọc Tìm Kiếm
            </div>
            <button
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <RotateCcw size={12} /> Đặt lại
            </button>
          </div>

          {/* Search */}
          <div className="input-group">
            <label className="input-label">Từ khóa tìm kiếm</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Tên cây, tên khoa học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
                style={{ paddingRight: '2rem' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '10px', top: '10px' }} />
            </div>
          </div>

          {/* Categories */}
          <div className="input-group">
            <label className="input-label">Danh mục cây</label>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="input-field"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.maDanhMuc} value={c.maDanhMuc}>
                  {c.tenDanhMuc}
                </option>
              ))}
            </select>
          </div>

          {/* Sunlight Requirement */}
          <div className="input-group">
            <label className="input-label">Nhu cầu ánh sáng</label>
            <select
              value={sunlight}
              onChange={(e) => setSunlight(e.target.value)}
              className="input-field"
            >
              <option value="">Mọi điều kiện ánh sáng</option>
              <option value="Trong nhà">Cây trong nhà (Ưa bóng râm)</option>
              <option value="Bán râm">Bán râm (Ban công, cửa sổ)</option>
              <option value="Toàn phần">Toàn phần (Ưa nắng trực tiếp)</option>
            </select>
          </div>

          {/* GIS Distance Radius */}
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} color="var(--primary-600)" /> Bán kính vườn ươm (GIS)
            </label>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(e.target.value)}
              className="input-field"
            >
              <option value="">Tất cả bán kính</option>
              <option value="15">Trong vòng 15 km (Giao siêu tốc)</option>
              <option value="30">Trong vòng 30 km (Tiêu chuẩn)</option>
              <option value="50">Trong vòng 50 km (Cây công trình/Vườn lớn)</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="input-group">
            <label className="input-label">Khoảng giá (VND)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Từ"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input-field"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Đến"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              Đang tải danh sách cây cảnh...
            </div>
          ) : plants.length === 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-light)',
              padding: '4rem 2rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌱</div>
              <h3 style={{ marginBottom: '0.5rem' }}>Không tìm thấy cây cảnh phù hợp</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Thử mở rộng khoảng cách bán kính GIS hoặc thay đổi tiêu chí lọc nhiệt độ/ánh sáng.
              </p>
              <button onClick={handleResetFilters} className="btn btn-primary btn-sm">
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid-cols-3">
              {plants.map((plant) => (
                <ProductCard key={plant.maCay} plant={plant} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
