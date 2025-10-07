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
  
  // Si estamos en páginas que no requieren autenticación
  if (currentPath === '/login' || currentPath === '/register') {
    // Si ya estamos autenticados, redirigir al dashboard
    if (isAuthenticatedUser) {
      console.log('Usuario ya autenticado, redirigiendo al dashboard...');
      window.location.href = '/';
    }
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
  localStorage.removeItem('sgu_auth_token');
  localStorage.removeItem('sgu_refresh_token');
  window.location.href = '/login';
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
  console.log('Inicializando autenticación...');
  initAuth();
  updateUserInfo();
  
  // Configurar logout button si existe
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
  
  // Configurar menú de usuario si existe
  const userMenuButton = document.getElementById('user-menu-button');
  const userMenu = document.getElementById('user-menu');
  
  if (userMenuButton && userMenu) {
    userMenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenu.classList.toggle('hidden');
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', () => {
      userMenu.classList.add('hidden');
    });
  }
});

// Exportar funciones para uso global
window.SGUAuth = {
  isAuthenticated,
  getUserInfo,
  logout,
  redirectToLogin,
  updateUserInfo
};
