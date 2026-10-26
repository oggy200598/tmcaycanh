import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { useCart } from '../context/CartContext';
import {
  MapPin,
  ShoppingBag,
  User,
  LogOut,
  Compass,
  Sparkles,
  TreePine,
  ShieldCheck,
  ChevronDown,
  Layers,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin, isStaff, isSupplier } = useAuth();
  const { currentLocation, selectPreset, presets, detectBrowserLocation } = useLocation();
  const { totalItemsCount } = useCart();
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const routerLocation = useRouterLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => routerLocation.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-light)',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
    }}>
      {/* Top GIS Location Bar */}
      <div style={{
        backgroundColor: 'var(--primary-900)',
        color: '#ffffff',
        padding: '0.35rem 0',
        fontSize: '0.75rem',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-200)' }}>
              <MapPin size={13} /> Vị trí GIS của bạn:
            </span>
            <button
              onClick={() => setShowLocationMenu(!showLocationMenu)}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '2px 8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {currentLocation.name}
              <ChevronDown size={12} />
            </button>

            {/* Location Switcher Dropdown */}
            {showLocationMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: '#ffffff',
                color: 'var(--text-main)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-light)',
                minWidth: '280px',
                zIndex: 2000,
                padding: '0.5rem',
              }}>
                <div style={{ padding: '0.35rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  CHỌN KHU VỰC ĐỐI CHIẾU THỔ NHƯỠNG & GIS
                </div>
                {presets.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      selectPreset(p);
                      setShowLocationMenu(false);
                    }}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: currentLocation.name === p.name ? 'var(--primary-50)' : 'transparent',
                      color: currentLocation.name === p.name ? 'var(--primary-700)' : 'inherit',
                      fontWeight: currentLocation.name === p.name ? 700 : 500,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span>{p.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {p.temp}°C | Độ ẩm {p.humidity}% | {p.soil}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    onClick={() => {
                      detectBrowserLocation();
                      setShowLocationMenu(false);
                    }}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-700)',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textAlign: 'left',
                    }}
                  >
                    🎯 Tự động định vị qua GPS thiết bị
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span>🌿 Hỗ trợ giao cây tươi trong bán kính 50km</span>
            <span>📞 Hotline: 1900 8899</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-700), var(--primary-800))',
            color: '#ffffff',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(45, 106, 79, 0.3)',
          }}>
            <TreePine size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)', letterSpacing: '-0.5px' }}>
              TMCayCanh<span style={{ color: 'var(--primary-500)', fontSize: '0.9rem', marginLeft: '2px' }}>.GIS</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '-3px' }}>
              THƯƠNG MẠI CÂY CẢNH & KHÔNG GIAN ĐỊA LÝ
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link
            to="/"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              backgroundColor: isActive('/') ? 'var(--primary-50)' : 'transparent',
              color: isActive('/') ? 'var(--primary-700)' : 'var(--text-secondary)',
            }}
          >
            Trang Chủ
          </Link>

          <Link
            to="/products"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              backgroundColor: isActive('/products') ? 'var(--primary-50)' : 'transparent',
              color: isActive('/products') ? 'var(--primary-700)' : 'var(--text-secondary)',
            }}
          >
            Cây Cảnh
          </Link>

          <Link
            to="/map-explorer"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: isActive('/map-explorer') ? 'var(--primary-50)' : 'transparent',
              color: isActive('/map-explorer') ? 'var(--primary-700)' : 'var(--text-secondary)',
            }}
          >
            <Compass size={16} />
            Bản Đồ GIS
          </Link>

          <Link
            to="/recommendations"
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: isActive('/recommendations') ? 'var(--primary-50)' : 'transparent',
              color: isActive('/recommendations') ? 'var(--primary-700)' : 'var(--text-secondary)',
            }}
          >
            <Sparkles size={16} />
            Hợp Thổ Nhưỡng
          </Link>

          {/* Supplier Portal Link */}
          {isSupplier && (
            <Link
              to="/supplier"
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.875rem',
                backgroundColor: isActive('/supplier') ? 'var(--primary-50)' : 'transparent',
                color: isActive('/supplier') ? 'var(--primary-700)' : 'var(--primary-800)',
              }}
            >
              Cổng Vườn Ươm
            </Link>
          )}

          {/* Admin / Staff Link */}
          {isStaff && (
            <Link
              to="/admin"
              style={{
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: isActive('/admin') ? 'var(--primary-50)' : 'transparent',
                color: isActive('/admin') ? 'var(--primary-700)' : 'var(--text-secondary)',
              }}
            >
              <ShieldCheck size={16} />
              Quản Trị {isAdmin ? 'Admin' : 'Staff'}
            </Link>
          )}
        </nav>

        {/* Right Actions: Cart & User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Cart Icon */}
          <Link
            to="/cart"
            style={{
              position: 'relative',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
              color: 'var(--primary-800)',
            }}
          >
            <ShoppingBag size={20} />
            {totalItemsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                backgroundColor: 'var(--primary-600)',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 700,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              }}>
                {totalItemsCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'none',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.4rem 0.75rem',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-100)',
                  color: 'var(--primary-800)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}>
                  {user.hoTen?.charAt(0) || 'U'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {user.hoTen}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {user.vaiTro}
                  </div>
                </div>
                <ChevronDown size={14} />
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  marginTop: '6px',
                  backgroundColor: '#ffffff',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-light)',
                  minWidth: '180px',
                  zIndex: 2000,
                  overflow: 'hidden',
                }}>
                  <Link
                    to="/orders"
                    onClick={() => setShowUserMenu(false)}
                    style={{
                      display: 'block',
                      padding: '0.6rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'var(--text-main)',
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    📦 Đơn hàng của tôi
                  </Link>

                  {isSupplier && (
                    <Link
                      to="/supplier"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'block',
                        padding: '0.6rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-main)',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      🌱 Quản lý Vườn ươm
                    </Link>
                  )}

                  {isStaff && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'block',
                        padding: '0.6rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-main)',
                        borderBottom: '1px solid var(--border-light)',
                      }}
                    >
                      🛡️ Trang Quản trị
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      padding: '0.6rem 1rem',
                      fontSize: '0.85rem',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600,
                    }}
                  >
                    <LogOut size={14} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Đăng Nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Đăng Ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
