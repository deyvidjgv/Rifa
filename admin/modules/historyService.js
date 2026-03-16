/**
 * historyService.js — Audit log UI for the admin dashboard.
 * Renders change history from the Firestore `historial` collection.
 */

const HistoryUI = (() => {
  let unsubscribe = null;

  /**
   * Start listening to the audit log and render in the table.
   */
  function iniciar() {
    const tbody = document.getElementById('historialBody');
    if (!tbody) return;

    unsubscribe = FirestoreService.escucharHistorial((entries) => {
      renderizarHistorial(entries, tbody);
    }, 50);
  }

  /**
   * Render audit log entries grouped by date.
   */
  function renderizarHistorial(entries, tbody) {
    tbody.innerHTML = '';

    if (entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="historial-empty">
            No hay registros de cambios aún.
          </td>
        </tr>
      `;
      return;
    }

    // Grouping by date string (local)
    const grouped = {};
    entries.forEach((entry) => {
      const dateKey = _obtenerEtiquetaFecha(entry.fecha);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(entry);
    });

    const fragment = document.createDocumentFragment();

    Object.keys(grouped).forEach((dateLabel) => {
      // Create a date header row
      const headerRow = document.createElement('tr');
      headerRow.className = 'history-date-header';
      headerRow.innerHTML = `<td colspan="5"><i class="fas fa-calendar-day"></i> ${dateLabel}</td>`;
      fragment.appendChild(headerRow);

      grouped[dateLabel].forEach((entry) => {
        const tr = document.createElement('tr');
        const horaFormateada = _formatearHora(entry.fecha);

        tr.innerHTML = `
          <td data-label="Hora"><strong>${horaFormateada}</strong></td>
          <td data-label="Número"><strong>${entry.numero}</strong></td>
          <td data-label="Acción">${entry.accion || ''}</td>
          <td data-label="Cambio">
            <span class="estado-badge estado-${entry.estadoAnterior}">${entry.estadoAnterior || '-'}</span>
            <i class="fas fa-arrow-right" style="font-size: 10px; opacity: 0.5; margin: 0 4px;"></i>
            <span class="estado-badge estado-${entry.estadoNuevo}">${entry.estadoNuevo || '-'}</span>
          </td>
          <td data-label="Usuario">${entry.usuario || 'admin'}</td>
        `;
        fragment.appendChild(tr);
      });
    });

    tbody.appendChild(fragment);
  }

  function _obtenerEtiquetaFecha(fechaISO) {
    if (!fechaISO) return 'Fecha Desconocida';
    const d = new Date(fechaISO);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);

    const dStr = d.toLocaleDateString();
    if (dStr === hoy.toLocaleDateString()) return 'Hoy';
    if (dStr === ayer.toLocaleDateString()) return 'Ayer';

    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function _formatearHora(fechaISO) {
    if (!fechaISO) return '--:--';
    const d = new Date(fechaISO);
    return d.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Register a state change in the audit log.
   */
  async function registrarCambio(
    numero,
    accion,
    estadoAnterior,
    estadoNuevo,
    usuario,
  ) {
    return FirestoreService.registrarHistorial({
      numero,
      accion,
      estadoAnterior,
      estadoNuevo,
      usuario: usuario || 'admin',
    });
  }

  function _formatearFecha(fechaISO) {
    if (!fechaISO) return '-';
    try {
      const d = new Date(fechaISO);
      return d.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaISO;
    }
  }

  /**
   * Stop listening.
   */
  function detener() {
    if (unsubscribe) unsubscribe();
  }

  return {
    iniciar,
    registrarCambio,
    detener,
  };
})();
