/**
 * pdfReport.js — Optimized report generation using native window.print()
 */

const PdfReport = (() => {
  /**
   * Populate the hidden report template and trigger printer dialog.
   * @param {Array} nums - all numbers array
   * @param {string} nombreRifa - raffle name
   * @param {number} precioNumero - price per number
   */
  function generarReporte(nums, nombreRifa, precioNumero) {
    try {
      const vendidos = nums.filter((n) => n.estado === 'vendido');
      const disponibles = nums.filter((n) => n.estado === 'disponible').length;
      const totalRecaudado = vendidos.length * precioNumero;

      const ahora = new Date();
      const fechaStr = ahora.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const horaStr = ahora.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // 1. Populate Header & Meta
      document.getElementById('report-raffle-name').textContent =
        nombreRifa || 'Reporte de Rifa';
      document.getElementById('report-date').textContent = fechaStr;
      document.getElementById('report-time').textContent = horaStr;
      document.getElementById('report-footer-date').textContent =
        `Generado el: ${fechaStr} ${horaStr}`;

      // 2. Populate Summary
      document.getElementById('report-stat-vendidos').textContent =
        vendidos.length;
      document.getElementById('report-stat-disponibles').textContent =
        disponibles;
      document.getElementById('report-stat-recaudado').textContent =
        _formatearDinero(totalRecaudado);

      // 3. Populate Table
      const tableBody = document.getElementById('report-table-body');
      tableBody.innerHTML = '';

      if (vendidos.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No hay números vendidos para mostrar</td></tr>`;
      } else {
        vendidos.forEach((n) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${n.numero}</td>
            <td>${n.nombre || '-'}</td>
            <td>${n.telefono || '-'}</td>
            <td>${n.direccion || '-'}</td>
            <td style="text-transform: uppercase;">${n.estado}</td>
            <td>${_formatearFechaCorta(n.fechaActualizacion || n.fecha || '')}</td>
          `;
          tableBody.appendChild(row);
        });
      }

      // 4. Trigger Print
      window.print();
    } catch (error) {
      console.error('[PdfReport] Error al preparar reporte:', error);
      alert('Error al preparar el reporte para imprimir.');
    }
  }

  function _formatearDinero(cantidad) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(cantidad);
  }

  function _formatearFechaCorta(fechaISO) {
    if (!fechaISO) return '-';
    try {
      const d = new Date(fechaISO);
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '-';
    }
  }

  return {
    generarReporte,
  };
})();
