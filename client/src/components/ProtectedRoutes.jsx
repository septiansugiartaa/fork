import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles }) => {
  // 1. Ambil data dari LocalStorage
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  // 2. Cek Login: Kalau ga ada token/user, tendang ke Login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  let user = {};
  try {
    user = JSON.parse(userStr);
  } catch (e) {
    // Kalo JSON rusak, paksa logout
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
  
  let userRole = "";

  if (typeof user.role === 'string') {
      userRole = user.role.toLowerCase();
  } 
  else if (user.user_role && Array.isArray(user.user_role) && user.user_role.length > 0) {
      userRole = user.user_role[0]?.role?.role?.toLowerCase() || "";
  }

  if (allowedRoles.includes(userRole)) {
    return <Outlet />;
  } else {
    // Redirect balik ke dashboard mereka masing-masing
    if (userRole === 'santri') {
        return <Navigate to="/santri" replace />;
    } else if (userRole === 'orangtua' || userRole === 'wali') {
        return <Navigate to="/orangtua" replace />;
    } else if (userRole === 'pengurus') {
        return <Navigate to="/pengurus" replace />;
    } else if (userRole === 'pimpinan') {
        return <Navigate to="/pimpinan" replace />;
    } else if (userRole === 'ustadz') {
        return <Navigate to="/ustadz" replace />;
    } else if (userRole === 'admin' || userRole === 'administrator') {
        return <Navigate to="/admin" replace />;
    } else if (userRole === 'timkes') {
        return <Navigate to="/timkesehatan" replace />;
    } else {
        // Fallback jika role tidak dikenali
        return <Navigate to="/login" replace />;
    }
  }
};

export default ProtectedRoute;