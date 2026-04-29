import { Navigate, Outlet } from 'react-router-dom';
import { clearAuthSession, getAuthToken, getStoredAuthUser } from '../utils/authStorage';

const ROLE_DASHBOARD = {
  santri:       '/santri',
  orangtua:     '/orangtua',
  wali:         '/orangtua',
  pengurus:     '/pengurus',
  pimpinan:     '/pimpinan',
  ustadz:       '/ustadz',
  admin:        '/admin',
  timkesehatan: '/timkesehatan',
};

const ProtectedRoute = ({ allowedRoles }) => {
  const token = getAuthToken();
  const user = getStoredAuthUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Normalisasi role dari berbagai shape data (string langsung, atau nested user_role array)
  let userRole = '';
  if (typeof user.role === 'string') {
    userRole = user.role.toLowerCase();
  } else if (Array.isArray(user.user_role) && user.user_role.length > 0) {
    userRole = user.user_role[0]?.role?.role?.toLowerCase() || '';
  }

  if (!userRole) {
    clearAuthSession();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  // Redirect ke dashboard sesuai role — fallback ke login jika tidak dikenali
  const redirectTo = ROLE_DASHBOARD[userRole] ?? '/login';
  return <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
