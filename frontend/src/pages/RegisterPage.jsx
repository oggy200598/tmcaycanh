import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TreePine, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [hoTen, setHoTen] = useState('');
  const [tenDangNhap, setTenDangNhap] = useState('');
  const [email, setEmail] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [vaiTro, setVaiTro] = useState('Customer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      const loggedUser = await register({
        hoTen,
        tenDangNhap,
        email,
        soDienThoai,
        matKhau,
        vaiTro,
      });

      if (loggedUser.vaiTro === 'Supplier' || loggedUser.vaiTro === 'Staff' || loggedUser.vaiTro === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi đăng ký tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{
      padding: '3rem 1.25rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        padding: '2.5rem',
        maxWidth: '520px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-700), var(--primary-800))',
            color: '#ffffff',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.5rem',
          }}>
            <TreePine size={24} />
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
            Đăng Ký Tài Khoản
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tham gia cộng đồng mua bán & chăm sóc cây cảnh thông minh GIS
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Bạn tham gia với tư cách:</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.6rem 0.85rem',
                border: vaiTro === 'Customer' ? '2px solid var(--primary-600)' : '1px solid var(--border-light)',
                backgroundColor: vaiTro === 'Customer' ? 'var(--primary-50)' : '#ffffff',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}>
                <input
                  type="radio"
                  name="vaiTro"
                  value="Customer"
                  checked={vaiTro === 'Customer'}
                  onChange={(e) => setVaiTro(e.target.value)}
                />
                <span>👤 Khách Hàng</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.6rem 0.85rem',
                border: vaiTro === 'Supplier' ? '2px solid var(--primary-600)' : '1px solid var(--border-light)',
                backgroundColor: vaiTro === 'Supplier' ? 'var(--primary-50)' : '#ffffff',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}>
                <input
                  type="radio"
                  name="vaiTro"
                  value="Supplier"
                  checked={vaiTro === 'Supplier'}
                  onChange={(e) => setVaiTro(e.target.value)}
                />
                <span>🌱 Nhà Cung Cấp</span>
              </label>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Họ và tên</label>
            <input
              type="text"
              required
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Tên đăng nhập</label>
            <input
              type="text"
              required
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              placeholder="nguyenvana"
              className="input-field"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="a@gmail.com"
                className="input-field"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Số điện thoại</label>
              <input
                type="tel"
                required
                value={soDienThoai}
                onChange={(e) => setSoDienThoai(e.target.value)}
                placeholder="0901234567"
                className="input-field"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Mật khẩu</label>
            <input
              type="password"
              required
              value={matKhau}
              onChange={(e) => setMatKhau(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
            Đăng nhập tại đây
          </Link>
        </div>
      </div>
    </div>
  );
}
