console.log('login.js inicializado');

// Envolver en un evento de carga para asegurar que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const errorMsg = document.getElementById('error');
  const loginForm = document.getElementById('loginForm');

  if (!loginBtn || !loginForm) {
    console.error('No se encontraron los elementos del formulario en el DOM');
    return;
  }

  // Redirigir si ya está logueado
  if (auth) {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Usuario ya logueado:', user.email);
        window.location.href = 'dashboard.html';
      }
    });
  } else {
    console.error(
      "El objeto 'auth' no está disponible. Revisa firebase-config.js",
    );
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    console.log('Intentando iniciar sesión con:', email);

    if (!email || !password) {
      errorMsg.textContent = 'Por favor, completa todos los campos.';
      return;
    }

    // Feedback visual
    loginBtn.disabled = true;
    loginBtn.textContent = 'Ingresando...';
    errorMsg.textContent = '';

    auth
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        console.log('Inicio de sesión exitoso');
        window.location.href = 'dashboard.html';
      })
      .catch((error) => {
        console.error('Error en el login:', error);
        loginBtn.disabled = false;
        loginBtn.textContent = 'Ingresar';

        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-login-credentials': // New Firebase error code
            errorMsg.textContent = 'Credenciales incorrectas.';
            break;
          case 'auth/invalid-email':
            errorMsg.textContent = 'Correo electrónico inválido.';
            break;
          case 'auth/too-many-requests':
            errorMsg.textContent = 'Demasiados intentos. Inténtalo más tarde.';
            break;
          case 'auth/operation-not-allowed':
            errorMsg.textContent =
              'El login con email/password no está habilitado en Firebase.';
            break;
          default:
            // Check for specific message in case code is generic
            if (
              error.message &&
              error.message.includes('INVALID_LOGIN_CREDENTIALS')
            ) {
              errorMsg.textContent = 'Credenciales incorrectas.';
            } else {
              errorMsg.textContent = 'Error: ' + error.message;
            }
        }
      });
  });
});
