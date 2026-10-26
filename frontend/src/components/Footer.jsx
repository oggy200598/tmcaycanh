import React from 'react';
import { TreePine, ShieldCheck, MapPin, Compass, Clock, Truck } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--primary-900)',
      color: '#cbd5e1',
      marginTop: 'auto',
      paddingTop: '3.5rem',
      paddingBottom: '2rem',
      borderTop: '4px solid var(--primary-700)',
    }}>
      <div className="container">
        {/* Core Value Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '2.5rem',
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(82, 183, 136, 0.2)', padding: '0.6rem', borderRadius: '10px', color: 'var(--primary-400)' }}>
              <Compass size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Spatial Matching Engine</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                Tự động đối chiếu khí hậu & thổ nhưỡng nơi bạn sống với sinh trưởng của cây.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(82, 183, 136, 0.2)', padding: '0.6rem', borderRadius: '10px', color: 'var(--primary-400)' }}>
              <Truck size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Giao Cây Tươi Bán Kính GIS</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                Phục vụ cây cảnh tươi trong bán kính tối đa 50km từ vườn ươm gần nhất.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(82, 183, 136, 0.2)', padding: '0.6rem', borderRadius: '10px', color: 'var(--primary-400)' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Kiểm Định Sức Khỏe Cây</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                Chụp ảnh thực tế tại vườn và xác nhận sức khỏe trước khi bàn giao vận chuyển.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(82, 183, 136, 0.2)', padding: '0.6rem', borderRadius: '10px', color: 'var(--primary-400)' }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>Khóa Tồn Kho 15 Phút</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                Minh bạch số lượng tạm giữ thời gian thực, bảo đảm 100% giữ cây khi đặt hàng.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation & Credits */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2rem',
          fontSize: '0.875rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <TreePine size={24} color="var(--primary-400)" />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>TMCayCanh.GIS</span>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.6, color: '#94a3b8' }}>
              Nền tảng thương mại điện tử chuyên biệt ngành cây cảnh, cây phong thủy và cảnh quan sân vườn tích hợp hệ thống thông tin địa lý GIS.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '0.75rem' }}>Danh Mục Chính</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#94a3b8' }}>
              <li>🌿 Cây Cảnh Trong Nhà & Văn Phòng</li>
              <li>🌺 Cây Ban Công & Sân Thượng</li>
              <li>🎍 Bonsai & Cây Thế Phong Thủy</li>
              <li>🌳 Cây Công Trình & Sân Vườn Biệt Thự</li>
              <li>🌵 Sen Đá & Cây Mini Để Bàn</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '0.75rem' }}>Mạng Lưới Vườn Ươm GIS</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#94a3b8' }}>
              <li>📍 Vườn Kiểng Quận 12 (TP. HCM)</li>
              <li>📍 Trung Tâm Bonsai TP. Thủ Đức</li>
              <li>📍 Trại Ươm Cây Giống Cao Nguyên Đà Lạt</li>
              <li>📍 Vườn Cây Hoa Kiểng Chợ Lách Bến Tre</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '0.75rem' }}>Quy Định & Pháp Lý</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#94a3b8' }}>
              <li>Bảo hành sống khỏe 30 ngày</li>
              <li>Chính sách vận chuyển theo cước GIS</li>
              <li>Quy chuẩn kiểm duyệt chất lượng BR04</li>
              <li>Điều khoản phân quyền 4 vai trò</li>
            </ul>
          </div>
        </div>

        <div style={{
          marginTop: '2.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#64748b',
        }}>
          © 2026 TMCayCanh. Dự án Đồ án Thương Mại Điện Tử & Hệ Thống Thông Tin Địa Lý GIS (Nhóm 14).
        </div>
      </div>
    </footer>
  );
}
