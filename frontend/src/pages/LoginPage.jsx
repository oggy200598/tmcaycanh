import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TreePine, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  const [tenDangNhap, setTenDangNhap] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');
      const loggedUser = await login(tenDangNhap, matKhau);

      if (loggedUser.vaiTro === 'Admin' || loggedUser.vaiTro === 'Staff' || loggedUser.vaiTro === 'Supplier') {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user, pass) => {
    setTenDangNhap(user);
    setMatKhau(pass);
  };

  return (
    <div className="container" style={{
      padding: '4rem 1.25rem',
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
        maxWidth: '460px',
        width: '100%',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-700), var(--primary-800))',
            color: '#ffffff',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
          }}>
            <TreePine size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--primary-900)', marginBottom: '0.25rem' }}>
            Đăng Nhập TMCayCanh
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Hệ sinh thái thương mại cây cảnh tích hợp không gian GIS
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

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group">
            <label className="input-label">Tên đăng nhập hoặc Email</label>
            <input
              type="text"
              required
              value={tenDangNhap}
              onChange={(e) => setTenDangNhap(e.target.value)}
              placeholder="customer@gmail.com"
              className="input-field"
            />
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
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>
        </form>

        {/* Quick Demo Logins for Pair Programming / Review */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
            Đăng Nhập Nhanh Theo Vai Trò Demo:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => quickLogin('customer@gmail.com', '123456')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              👤 Khách Hàng
            </button>
            <button
              type="button"
              onClick={() => quickLogin('supplier@saigonbonsai.vn', '123456')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              🌱 Nhà Cung Cấp
            </button>
            <button
              type="button"
              onClick={() => quickLogin('staff@tmcaycanh.vn', '123456')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              🛡️ Nhân Viên (Staff)
            </button>
            <button
              type="button"
              onClick={() => quickLogin('admin@tmcaycanh.vn', '123456')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem' }}
            >
              ⚡ Quản Trị (Admin)
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
