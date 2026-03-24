// configuración
const numerosPorPagina = 100;
let paginaActual = 1;

// elementos HTML
const contenedorNumeros = document.getElementById('numeros');
const contenedorPaginacion = document.getElementById('paginacion');
const inputBuscar = document.getElementById('buscarNumero');
const btnBuscar = document.getElementById('btnBuscar');

// mostrar números según página
function mostrarNumeros(pagina) {
  paginaActual = pagina;
  contenedorNumeros.innerHTML = '';

  const inicio = (pagina - 1) * numerosPorPagina;
  const fin = inicio + numerosPorPagina;
  const numerosPagina = numeros.slice(inicio, fin);

  const fragment = document.createDocumentFragment();

  numerosPagina.forEach((num) => {
    const div = document.createElement('div');
    div.classList.add('numero');
    div.textContent = num.numero;

    // Estado del número — all 5 states
    switch (num.estado) {
      case 'disponible':
        div.classList.add('disponible');
        break;
      case 'vendido':
        div.classList.add('vendido');
        break;
      case 'cancelado':
        div.classList.add('cancelado');
        break;
      case 'reservado':
        div.classList.add('reservado');
        break;
      // Legacy support
      case 'apartado':
        div.classList.add('reservado');
        break;
      default:
        div.classList.add('disponible');
    }

    // Click — only if disponible
    div.addEventListener('click', () => {
      if (num.estado === 'disponible') {
        abrirModal(num.numero);
      }
    });

    fragment.appendChild(div);
  });

  contenedorNumeros.appendChild(fragment);
  crearPaginacion();
}

function crearPaginacion() {
  contenedorPaginacion.innerHTML = '';
  const totalPaginas = Math.ceil(numeros.length / numerosPorPagina);

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === paginaActual) btn.classList.add('active');

    btn.addEventListener('click', () => {
      mostrarNumeros(i);
    });

    contenedorPaginacion.appendChild(btn);
  }
}

// buscar número específico
btnBuscar.addEventListener('click', () => {
  const numero = parseInt(inputBuscar.value);

  if (numero < 1 || numero > 1000) {
    alert('Número inválido');
    return;
  }

  const pagina = Math.ceil(numero / numerosPorPagina);
  mostrarNumeros(pagina);

  // Highlight the number after render
  setTimeout(() => {
    const cards = contenedorNumeros.querySelectorAll('.numero');
    cards.forEach((card) => {
      if (card.textContent === String(numero)) {
        card.classList.add('highlighted');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => card.classList.remove('highlighted'), 3000);
      }
    });
  }, 100);
});

// Enter key search support
inputBuscar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    btnBuscar.click();
  }
});

// iniciar sistema
mostrarNumeros(1);

// ===== Lógica del Número Ganador =====
let configRifaGlobal = null;
let lottieYaMostrado = false; // solo se ejecuta una vez por visita

if (typeof FirestoreService !== 'undefined') {
  FirestoreService.escucharConfiguracion((config) => {
    configRifaGlobal = config;
    renderBannerGanador();
  });
}

// Hook llamado desde numeros.js cuando la DB se actualiza
window.onNumerosActualizados = function (nums) {
  renderBannerGanador();
};

function renderBannerGanador() {
  const banner = document.getElementById('bannerGanador');
  const numVal = document.getElementById('ganadorNumeroVal');
  const subtitulo = document.getElementById('ganadorSubtitulo');

  if (
    !banner ||
    !configRifaGlobal ||
    !configRifaGlobal.numeroGanador ||
    configRifaGlobal.numeroGanador === ''
  ) {
    if (banner) banner.style.display = 'none';
    return;
  }

  const ganadorNumero = String(configRifaGlobal.numeroGanador);
  const numObj = (typeof numeros !== 'undefined' ? numeros : []).find(
    (n) => String(n.numero) === ganadorNumero,
  );

  if (numVal) numVal.textContent = ganadorNumero;
  banner.style.display = 'block';

  // Mostrar animación fullscreen solo una vez por visita
  const overlay = document.getElementById('lottieOverlay');
  const overlayNum = document.getElementById('overlayNumeroVal');
  if (overlay && !lottieYaMostrado) {
    lottieYaMostrado = true;
    if (overlayNum) overlayNum.textContent = ganadorNumero;
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 900);
    }, 5000);
  }

  if (subtitulo) {
    if (numObj) {
      if (numObj.estado === 'vendido') {
        subtitulo.innerHTML = `¡Felicidades a <strong>${numObj.nombre || 'nuestro cliente'}</strong>!`;
      } else if (
        numObj.estado === 'reservado' ||
        numObj.estado === 'pendiente_pago'
      ) {
        subtitulo.innerHTML = `Apartado por <strong>${numObj.nombre || 'alguien'}</strong> (Pendiente de pago).`;
      } else {
        subtitulo.textContent =
          '¡Este número no fue comprado! Sigue participando.';
      }
    } else {
      subtitulo.textContent =
        '¡Este número no fue comprado! Sigue participando.';
    }
  }
}
