/**
 * adminDashboard.js — Main controller for the admin dashboard.
 * Wires up all modules: grid, stats, history, search, filters, and PDF generation.
 */

// ─── State ──────────────────────────────────────────────────
let numerosGlobales = [];
let configRifa = { precioNumero: 0, nombreRifa: 'Rifa' };

// ─── Initialization ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Auth guard
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
    }
  });

  // Load configuration
  configRifa = await FirestoreService.obtenerConfiguracion();
  StatsService.setPrecio(configRifa.precioNumero);

  // Set initial value in UI if element exists
  const precioInput = document.getElementById('precioConfig');
  if (precioInput) {
    precioInput.value = configRifa.precioNumero;
  }

  // Start audit log listener
  HistoryUI.iniciar();

  // Setup event listeners
  setupBusqueda();
  setupFiltros();
  setupLogout();
  setupPdfButton();
  setupConfigPrecio();
});

/**
 * Handle price configuration
 */
function setupConfigPrecio() {
  const btnGuardar = document.getElementById('btnGuardarPrecio');
  const precioInput = document.getElementById('precioConfig');

  if (btnGuardar && precioInput) {
    btnGuardar.addEventListener('click', async () => {
      const nuevoPrecio = parseInt(precioInput.value);

      if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
        alert('Por favor ingresa un precio válido');
        return;
      }

      const pass = prompt(
        'Por favor, ingresa tu contraseña de administrador para confirmar el cambio de precio:',
      );

      if (!pass) return;

      btnGuardar.disabled = true;
      btnGuardar.textContent = '...';

      try {
        const user = auth.currentUser;
        if (!user) throw new Error('No hay una sesión activa.');

        // Re-autenticar al usuario con su contraseña actual
        const credential = firebase.auth.EmailAuthProvider.credential(
          user.email,
          pass,
        );
        await user.reauthenticateWithCredential(credential);

        // Si la re-autenticación es exitosa, procedemos a actualizar
        await FirestoreService.actualizarConfiguracion({
          precioNumero: nuevoPrecio,
        });

        configRifa.precioNumero = nuevoPrecio;
        StatsService.setPrecio(nuevoPrecio);
        StatsService.actualizarEstadisticas(numerosGlobales);

        alert(
          'Precio actualizado correctamente despues de validar tu identidad.',
        );
      } catch (error) {
        let errorMsg = 'Error al actualizar el precio.';
        if (error.code === 'auth/wrong-password') {
          errorMsg = 'Contraseña incorrecta. No se ha cambiado el precio.';
        } else {
          errorMsg += ' ' + error.message;
        }
        alert(errorMsg);
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Guardar';
      }
      return; // Evitamos que siga al bloque original si existiera
    });
  }
}

/**
 * Called by numeros.js when data updates in real-time.
 */
function onNumerosActualizados(nums) {
  numerosGlobales = nums;
  GridRenderer.setData(nums);
  StatsService.actualizarEstadisticas(nums);
}

// ─── Search ─────────────────────────────────────────────────
function setupBusqueda() {
  const inputBuscar = document.getElementById('buscarAdmin');
  const btnBuscarNumero = document.getElementById('btnBuscarNumero');

  if (inputBuscar) {
    inputBuscar.addEventListener('input', () => {
      const texto = inputBuscar.value.trim();

      // If it's exactly a number, scroll to it
      const numero = parseInt(texto);
      if (numero >= 1 && numero <= 1000 && texto === numero.toString()) {
        GridRenderer.scrollToNumber(numero);
      } else {
        GridRenderer.setBusqueda(texto);
      }
    });
  }

  if (btnBuscarNumero) {
    btnBuscarNumero.addEventListener('click', () => {
      const texto = inputBuscar.value.trim();
      const numero = parseInt(texto);
      if (numero >= 1 && numero <= 1000) {
        GridRenderer.scrollToNumber(numero);

        // Show info panel if number is reserved or sold
        const num = numerosGlobales.find((n) => n.numero === numero);
        if (num && num.estado !== 'disponible') {
          abrirModalDetalle(num);
        }
      }
    });
  }
}

// ─── Filters ────────────────────────────────────────────────
function setupFiltros() {
  const filtros = document.querySelectorAll('.filtros button');

  filtros.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.filtro;

      // Update active button
      filtros.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      GridRenderer.setFiltro(tipo);
    });
  });
}

// ─── Logout ─────────────────────────────────────────────────
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut().then(() => {
        window.location.href = 'login.html';
      });
    });
  }
}

// ─── PDF Button ─────────────────────────────────────────────
function setupPdfButton() {
  const pdfBtn = document.getElementById('btnDescargarPdf');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      PdfReport.generarReporte(
        numerosGlobales,
        configRifa.nombreRifa,
        configRifa.precioNumero,
      );
    });
  }
}

// ─── Detail Modal ───────────────────────────────────────────
function abrirModalDetalle(num) {
  // Create backdrop
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';

  const modal = document.createElement('div');
  modal.className = 'modal-detalle';

  const estadoActual = num.estado || 'disponible';
  const esEditable = estadoActual !== 'cancelado';

  modal.innerHTML = `
    <div class="modal-header">
      <h2>Número ${num.numero}</h2>
      <span class="estado-badge estado-${estadoActual}">${estadoActual.toUpperCase()}</span>
    </div>

    <div class="modal-body">
      <div class="modal-input-group">
        <label>Nombre Completo</label>
        <input type="text" id="modalNombre" value="${num.nombre || ''}" placeholder="Ej. Juan Pérez" ${!esEditable ? 'disabled' : ''}>
      </div>

      <div class="modal-input-group">
        <label>Teléfono</label>
        <input type="text" id="modalTelefono" value="${num.telefono || ''}" placeholder="Ej. 3001234567" ${!esEditable ? 'disabled' : ''}>
      </div>

      <div class="modal-input-group">
        <label>Dirección</label>
        <input type="text" id="modalDireccion" value="${num.direccion || ''}" placeholder="Ej. Calle 123 #45-67" ${!esEditable ? 'disabled' : ''}>
      </div>

      <div class="modal-input-group">
        <label>Estado</label>
        <select id="modalEstado" ${!esEditable ? 'disabled' : ''}>
          <option value="disponible" ${estadoActual === 'disponible' ? 'selected' : ''}>Disponible</option>
          <option value="reservado" ${estadoActual === 'reservado' ? 'selected' : ''}>Reservado</option>
          <option value="pendiente_pago" ${estadoActual === 'pendiente_pago' ? 'selected' : ''}>Pendiente de Pago</option>
          <option value="vendido" ${estadoActual === 'vendido' ? 'selected' : ''}>Vendido</option>
          <option value="cancelado" ${estadoActual === 'cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>

      ${num.fecha ? `<p class="modal-fecha"><strong>Fecha registro:</strong> ${_formatearFechaModal(num.fecha)}</p>` : ''}
      ${num.fechaActualizacion ? `<p class="modal-fecha"><strong>Última actualización:</strong> ${_formatearFechaModal(num.fechaActualizacion)}</p>` : ''}
    </div>

    <div class="modal-actions">
      ${esEditable ? '<button id="modalGuardar" class="btn-guardar"><i class="fas fa-save"></i> Guardar Cambios</button>' : ''}
      <button id="modalLimpiar" class="btn-limpiar" title="Borrar datos y liberar número"><i class="fas fa-trash-alt"></i> Limpiar Número</button>
      ${num.telefono ? `<button id="modalWhatsapp" class="btn-whatsapp-modal"><i class="fab fa-whatsapp"></i> WhatsApp</button>` : ''}
      <button id="modalCerrar" class="btn-cerrar">Cerrar</button>
    </div>

    <div class="modal-history-inline">
      <h3><i class="fas fa-history"></i> Historial del Número</h3>
      <div id="inlineHistoryContent" class="history-list-compact">
        <p class="loading-history">Cargando movimientos...</p>
      </div>
    </div>
  `;

  fondo.appendChild(modal);
  document.body.appendChild(fondo);

  // Close
  document
    .getElementById('modalCerrar')
    .addEventListener('click', () => fondo.remove());
  fondo.addEventListener('click', (e) => {
    if (e.target === fondo) fondo.remove();
  });

  // Fetch inline history
  const historyContainer = document.getElementById('inlineHistoryContent');
  FirestoreService.escucharHistorial((entries) => {
    const filtrarPorNumero = entries.filter((e) => e.numero === num.numero);
    if (!historyContainer) return;

    if (filtrarPorNumero.length === 0) {
      historyContainer.innerHTML =
        '<p class="no-history">Sin movimientos previos.</p>';
      return;
    }

    // Group by date
    const groupedModal = {};
    filtrarPorNumero.forEach((e) => {
      const d = new Date(e.fecha);
      const label = d.toLocaleDateString();
      if (!groupedModal[label]) groupedModal[label] = [];
      groupedModal[label].push(e);
    });

    historyContainer.innerHTML = Object.keys(groupedModal)
      .map(
        (date) => `
      <div class="modal-history-day">
        <div class="modal-history-date-header">${date === new Date().toLocaleDateString() ? 'Hoy' : date}</div>
        ${groupedModal[date]
          .map(
            (e) => `
          <div class="history-item-compact">
            <span class="history-date">${new Date(e.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span class="history-action"><i class="fas fa-info-circle"></i> ${e.accion}</span>
            <div class="history-states">
              <span class="badge-mini">${e.estadoAnterior}</span> <i class="fas fa-chevron-right"></i> <span class="badge-mini">${e.estadoNuevo}</span>
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
    `,
      )
      .join('');
  }, 100);

  // WhatsApp
  const waBtn = document.getElementById('modalWhatsapp');
  if (waBtn) {
    waBtn.addEventListener('click', () => {
      window.open(`https://wa.me/57${num.telefono}`, '_blank');
    });
  }

  // Reset (Limpiar)
  const limpiarBtn = document.getElementById('modalLimpiar');
  if (limpiarBtn) {
    limpiarBtn.addEventListener('click', async () => {
      if (
        !confirm(
          `¿Estás seguro de que quieres limpiar totalmente el número ${num.numero}?`,
        )
      )
        return;

      limpiarBtn.disabled = true;
      limpiarBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Limpiando...';

      try {
        await FirestoreService.resetearNumero(num.numero);

        // Log the reset
        const usuario = auth.currentUser ? auth.currentUser.email : 'admin';
        await HistoryUI.registrarCambio(
          num.numero,
          `Limpieza total del número ${num.numero}`,
          estadoActual,
          'disponible',
          usuario,
        );

        fondo.remove();
      } catch (error) {
        alert('Error al limpiar: ' + error.message);
        limpiarBtn.disabled = false;
        limpiarBtn.innerHTML =
          '<i class="fas fa-trash-alt"></i> Limpiar Número';
      }
    });
  }

  // Save
  const guardarBtn = document.getElementById('modalGuardar');
  if (guardarBtn) {
    guardarBtn.addEventListener('click', async () => {
      const nuevoNombre = document.getElementById('modalNombre').value.trim();
      const nuevoTelefono = document
        .getElementById('modalTelefono')
        .value.trim();
      const nuevaDireccion = document
        .getElementById('modalDireccion')
        .value.trim();
      const nuevoEstado = document.getElementById('modalEstado').value;

      guardarBtn.disabled = true;
      guardarBtn.textContent = 'Guardando...';

      console.log(
        `[Dashboard] Guardando cambios para el número ${num.numero}...`,
        { nuevoEstado },
      );
      try {
        // Update Firestore
        await FirestoreService.actualizarNumero({
          id: num.id, // Muy importante pasar el ID actual para evitar duplicidad
          numero: num.numero,
          nombre: nuevoNombre,
          telefono: nuevoTelefono,
          direccion: nuevaDireccion,
          estado: nuevoEstado,
        });

        console.log(
          `[Dashboard] Número ${num.numero} actualizado correctamente en Firebase.`,
        );

        // Log changes if state changed
        if (nuevoEstado !== estadoActual) {
          const accion = `Número ${num.numero} cambió de ${estadoActual} a ${nuevoEstado}`;
          const usuario = auth.currentUser ? auth.currentUser.email : 'admin';
          await HistoryUI.registrarCambio(
            num.numero,
            accion,
            estadoActual,
            nuevoEstado,
            usuario,
          );
        }

        // Log if client data changed
        if (
          nuevoNombre !== (num.nombre || '') ||
          nuevoTelefono !== (num.telefono || '') ||
          nuevaDireccion !== (num.direccion || '')
        ) {
          if (nuevoEstado === estadoActual) {
            const accion = `Datos del número ${num.numero} actualizados`;
            const usuario = auth.currentUser ? auth.currentUser.email : 'admin';
            await HistoryUI.registrarCambio(
              num.numero,
              accion,
              estadoActual,
              nuevoEstado,
              usuario,
            );
          }
        }

        fondo.remove();
      } catch (error) {
        console.error('[Dashboard] Error al guardar cambios:', error);
        guardarBtn.disabled = false;
        guardarBtn.textContent = 'Guardar Cambios';
        alert(
          'ERROR AL GUARDAR: ' +
            error.message +
            '\n\nVerifica la consola para más detalles.',
        );
      }
    });
  }
}

function _formatearFechaModal(fechaISO) {
  if (!fechaISO) return '-';
  try {
    return new Date(fechaISO).toLocaleString('es-CO', {
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
