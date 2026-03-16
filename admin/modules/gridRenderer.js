/**
 * gridRenderer.js — Renders the raffle number grid in the admin dashboard.
 * Optimized for 1000 numbers with pagination and DocumentFragment batching.
 */

const GridRenderer = (() => {
  const NUMEROS_POR_PAGINA = 100;
  let paginaActualGrid = 1;
  let numerosData = [];
  let filtroEstado = 'todos';
  let busquedaTexto = '';
  let numeroResaltado = null;

  // State → color mapping
  const ESTADO_COLORES = {
    disponible: { bg: '#2ecc71', text: '#ffffff', label: 'Disponible' },
    reservado: { bg: '#f1c40f', text: '#ffffff', label: 'Reservado' },
    pendiente_pago: { bg: '#f39c12', text: '#ffffff', label: 'Pend. Pago' },
    vendido: { bg: '#e74c3c', text: '#ffffff', label: 'Vendido' },
    cancelado: { bg: '#95a5a6', text: '#ffffff', label: 'Cancelado' },
  };

  /**
   * Set the current data and re-render.
   */
  function setData(nums) {
    numerosData = nums;
    renderizar();
  }

  /**
   * Set filter state and re-render.
   */
  function setFiltro(estado) {
    filtroEstado = estado;
    paginaActualGrid = 1;
    renderizar();
  }

  /**
   * Set search text and re-render.
   */
  function setBusqueda(texto) {
    busquedaTexto = texto.toLowerCase().trim();
    paginaActualGrid = 1;
    renderizar();
  }

  /**
   * Get the currently filtered numbers.
   */
  function getNumerosFiltrados() {
    return numerosData.filter((n) => {
      const matchEstado = filtroEstado === 'todos' || n.estado === filtroEstado;
      const matchTexto =
        !busquedaTexto ||
        n.numero.toString().includes(busquedaTexto) ||
        (n.nombre && n.nombre.toLowerCase().includes(busquedaTexto));
      return matchEstado && matchTexto;
    });
  }

  /**
   * Main render function.
   */
  function renderizar() {
    const contenedor = document.getElementById('gridNumeros');
    const paginacionEl = document.getElementById('gridPaginacion');
    if (!contenedor) return;

    const filtrados = getNumerosFiltrados();
    const totalPaginas = Math.ceil(filtrados.length / NUMEROS_POR_PAGINA);

    // Clamp page
    if (paginaActualGrid > totalPaginas) paginaActualGrid = totalPaginas || 1;

    const inicio = (paginaActualGrid - 1) * NUMEROS_POR_PAGINA;
    const fin = inicio + NUMEROS_POR_PAGINA;
    const pagina = filtrados.slice(inicio, fin);

    // Build grid with DocumentFragment
    const fragment = document.createDocumentFragment();

    pagina.forEach((num) => {
      const card = document.createElement('div');
      card.className = 'grid-card';
      card.dataset.numero = num.numero;

      const estado = ESTADO_COLORES[num.estado] || ESTADO_COLORES.disponible;
      card.style.backgroundColor = estado.bg;
      card.style.color = estado.text;

      card.textContent = num.numero;

      // Highlight if this is the searched number
      if (numeroResaltado === num.numero) {
        card.classList.add('grid-card-highlighted');
      }

      card.addEventListener('click', () => {
        if (typeof abrirModalDetalle === 'function') {
          abrirModalDetalle(num);
        }
      });

      fragment.appendChild(card);
    });

    contenedor.innerHTML = '';
    contenedor.appendChild(fragment);

    // Render pagination
    if (paginacionEl) {
      renderizarPaginacion(paginacionEl, totalPaginas);
    }

    // Scroll to highlighted number
    if (numeroResaltado !== null) {
      const el = contenedor.querySelector(`[data-numero="${numeroResaltado}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  /**
   * Render pagination buttons.
   */
  function renderizarPaginacion(contenedor, totalPaginas) {
    contenedor.innerHTML = '';
    if (totalPaginas <= 1) return;

    // Previous button
    if (paginaActualGrid > 1) {
      const btnPrev = document.createElement('button');
      btnPrev.innerHTML = '&laquo;';
      btnPrev.className = 'pagination-btn';
      btnPrev.addEventListener('click', () => {
        paginaActualGrid--;
        renderizar();
      });
      contenedor.appendChild(btnPrev);
    }

    // Page buttons (show max 7 around current page)
    const startPage = Math.max(1, paginaActualGrid - 3);
    const endPage = Math.min(totalPaginas, paginaActualGrid + 3);

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className =
        'pagination-btn' + (i === paginaActualGrid ? ' active' : '');
      btn.addEventListener('click', () => {
        paginaActualGrid = i;
        renderizar();
      });
      contenedor.appendChild(btn);
    }

    // Next button
    if (paginaActualGrid < totalPaginas) {
      const btnNext = document.createElement('button');
      btnNext.innerHTML = '&raquo;';
      btnNext.className = 'pagination-btn';
      btnNext.addEventListener('click', () => {
        paginaActualGrid++;
        renderizar();
      });
      contenedor.appendChild(btnNext);
    }
  }

  /**
   * Scroll to and highlight a specific number.
   */
  function scrollToNumber(numero) {
    numeroResaltado = numero;

    // Find the page containing this number
    const filtrados = getNumerosFiltrados();
    const index = filtrados.findIndex((n) => n.numero === numero);

    if (index === -1) {
      // Number not found in current filter, reset filter
      filtroEstado = 'todos';
      busquedaTexto = '';
      const allNums = numerosData;
      const idx = allNums.findIndex((n) => n.numero === numero);
      if (idx !== -1) {
        paginaActualGrid = Math.ceil((idx + 1) / NUMEROS_POR_PAGINA);
      }
    } else {
      paginaActualGrid = Math.ceil((index + 1) / NUMEROS_POR_PAGINA);
    }

    renderizar();

    // Clear highlight after 3 seconds
    setTimeout(() => {
      numeroResaltado = null;
      const highlighted = document.querySelector('.grid-card-highlighted');
      if (highlighted) highlighted.classList.remove('grid-card-highlighted');
    }, 3000);
  }

  /**
   * Get current filter state.
   */
  function getFiltroActual() {
    return filtroEstado;
  }

  return {
    setData,
    setFiltro,
    setBusqueda,
    scrollToNumber,
    renderizar,
    getFiltroActual,
    ESTADO_COLORES,
  };
})();
