/**
 * statsService.js — Real-time statistics for the admin dashboard.
 */

const StatsService = (() => {
  let precioNumero = 0;

  /**
   * Set the price per number (from configuration).
   */
  function setPrecio(precio) {
    precioNumero = precio || 0;
  }

  /**
   * Calculate and update statistics in the DOM.
   * @param {Array} nums - array of number objects
   */
  function actualizarEstadisticas(nums) {
    const stats = {
      total: nums.length,
      disponibles: 0,
      reservados: 0,
      pendientePago: 0,
      vendidos: 0,
      cancelados: 0,
    };

    nums.forEach((n) => {
      switch (n.estado) {
        case 'disponible':
          stats.disponibles++;
          break;
        case 'reservado':
          stats.reservados++;
          break;
        case 'pendiente_pago':
          stats.pendientePago++;
          break;
        case 'vendido':
          stats.vendidos++;
          break;
        case 'cancelado':
          stats.cancelados++;
          break;
        default:
          stats.disponibles++;
          break;
      }
    });

    const dineroTotal = stats.vendidos * precioNumero;

    // Update DOM elements
    _actualizarElemento('statTotal', stats.total);
    _actualizarElemento('statDisponibles', stats.disponibles);
    _actualizarElemento(
      'statReservados',
      stats.reservados + stats.pendientePago,
    );
    _actualizarElemento('statVendidos', stats.vendidos);
    _actualizarElemento('statDinero', _formatearDinero(dineroTotal));

    return { ...stats, dineroTotal };
  }

  function _actualizarElemento(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
  }

  function _formatearDinero(cantidad) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(cantidad);
  }

  /**
   * Get current price.
   */
  function getPrecio() {
    return precioNumero;
  }

  return {
    setPrecio,
    getPrecio,
    actualizarEstadisticas,
  };
})();
