const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_tmcaycanh_2026';

/**
 * Verifies JWT token and attaches user info to req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để thực hiện thao tác này.' },
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.' },
      });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Role-Based Access Control (RBAC) middleware
 * Admin inherits Staff permissions.
 * @param {string[]} allowedRoles
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' },
      });
    }

    const userRole = req.user.vaiTro;

    // Admin has superset of Staff permissions
    const effectiveRoles = userRole === 'Admin' ? [...allowedRoles, 'Admin', 'Staff'] : [userRole];

    const hasPermission = allowedRoles.some((role) => effectiveRoles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện chức năng này.' },
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRoles,
  JWT_SECRET,
};
