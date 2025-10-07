// Script de autenticación global para el frontend SGU

/**
 * Verifica si el usuario está autenticado
 */
function isAuthenticated() {
  const token = localStorage.getItem('sgu_auth_token');
  return !!token;
}

/**
 * Obtiene la información del usuario desde el token
 */
function getUserInfo() {
  const token = localStorage.getItem('sgu_auth_token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      name: payload.firstName ? `${payload.firstName} ${payload.lastName}` : payload.email,
      role: payload.role || 'Usuario',
      email: payload.email,
      initials: payload.firstName ? 
        `${payload.firstName[0]}${payload.lastName[0]}`.toUpperCase() : 
        payload.email[0].toUpperCase()
    };
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
}

/**
 * Redirige al login si no está autenticado
 */
function redirectToLogin() {
  if (!isAuthenticated()) {
    window.location.href = '/login';
  }
}

/**
 * Inicializa la autenticación en la página actual
 */
function initAuth() {
  const isAuthenticatedUser = isAuthenticated();
  const currentPath = window.location.pathname;
  
  // Si estamos en páginas que no requieren autenticación o en logout
  if (currentPath === '/login' || currentPath === '/register' || currentPath === '/logout') {
    // Si ya estamos autenticados y estamos en login o register, redirigir al dashboard
    if (isAuthenticatedUser && (currentPath === '/login' || currentPath === '/register')) {
      console.log('Usuario ya autenticado, redirigiendo al dashboard...');
      window.location.href = '/';
    }
    // Si estamos en /logout, no hacer nada (dejar que la página maneje el logout)
    return;
  }
  
  // Si estamos en cualquier otra página y no estamos autenticados, redirigir al login
  if (!isAuthenticatedUser) {
    console.log('Usuario no autenticado, redirigiendo al login...');
    window.location.href = '/login';
  }
}

/**
 * Maneja el logout
 */
function logout() {
  console.log('🚪 Ejecutando logout...');
  
  // Limpiar tokens
  localStorage.removeItem('sgu_auth_token');
  localStorage.removeItem('sgu_refresh_token');
  
  // Limpiar cualquier otro dato de sesión
  sessionStorage.clear();
  
  console.log('✅ Tokens eliminados');
  
  // Forzar recarga completa de la página de login
  window.location.replace('/login');
}

/**
 * Actualiza la información del usuario en el header
 */
function updateUserInfo() {
  const userInfo = getUserInfo();
  if (!userInfo) return;
  
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const userInitials = document.getElementById('user-initials');
  
  if (userName) userName.textContent = userInfo.name;
  if (userRole) userRole.textContent = userInfo.role;
  if (userInitials) userInitials.textContent = userInfo.initials;
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Inicializando autenticación...');
  initAuth();
  updateUserInfo();
  
  // Usar setTimeout para asegurar que los elementos estén en el DOM
  setTimeout(() => {
    // Configurar logout button si existe
    const logoutButton = document.getElementById('logout-button');
    console.log('🔍 Buscando botón de logout:', logoutButton ? 'Encontrado' : 'No encontrado');
    
    if (logoutButton) {
      console.log('✅ Configurando evento de logout');
      logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🚪 Cerrando sesión...');
        logout();
      });
    }
    
    // Configurar menú de usuario si existe
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');
    
    if (userMenuButton && userMenu) {
      console.log('✅ Configurando menú de usuario');
      userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('📂 Toggle menú de usuario');
        userMenu.classList.toggle('hidden');
      });
      
      // Cerrar menú al hacer clic fuera
      document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target) && !userMenuButton.contains(e.target)) {
          userMenu.classList.add('hidden');
        }
      });
    }
  }, 100);
});

// Exportar funciones para uso global
window.SGUAuth = {
  isAuthenticated,
  getUserInfo,
  logout,
  redirectToLogin,
  updateUserInfo
};
