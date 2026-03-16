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
        div.innerHTML = `<span>${num.numero}</span><small><i class="fas fa-fire"></i></small>`;
        break;
      case 'cancelado':
        div.classList.add('cancelado');
        div.innerHTML = `<span>${num.numero}</span><small><i class="fas fa-times-circle"></i></small>`;
        break;
      case 'reservado':
        div.classList.add('reservado');
        div.innerHTML = `<span>${num.numero}</span><small><i class="fas fa-hourglass-half"></i></small>`;
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
