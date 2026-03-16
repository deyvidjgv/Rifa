/**
 * modal.js — Modal for client number registration.
 * Used on the client page for reserving a number.
 */

function abrirModal(numero) {
  // Create backdrop
  const fondo = document.createElement('div');
  fondo.classList.add('modal-fondo');

  // Create modal window
  const modal = document.createElement('div');
  modal.classList.add('modal');

  modal.innerHTML = `
    <h2>🎟️ Número: ${numero}</h2>
    
    <div class="modal-input-group">
      <label>Nombre Completo</label>
      <input type="text" id="nombre" placeholder="Ej. Juan Pérez">
    </div>

    <div class="modal-input-group">
      <label>Teléfono de Contacto</label>
      <input type="text" id="telefono" placeholder="Ej. 3001234567">
    </div>

    <div class="modal-input-group">
      <label>Dirección</label>
      <input type="text" id="direccion" placeholder="Ej. Calle 123 #45-67">
    </div>

    <div class="modal-botones">
      <button id="guardar">Confirmar Registro</button>
      <button id="cancelar">Cerrar</button>
    </div>
  `;

  fondo.appendChild(modal);
  document.body.appendChild(fondo);

  // Close on backdrop click
  fondo.addEventListener('click', (e) => {
    if (e.target === fondo) fondo.remove();
  });

  // Cancel button
  document.getElementById('cancelar').onclick = () => {
    fondo.remove();
  };

  // Save button
  document.getElementById('guardar').onclick = () => {
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();

    // Validate
    if (!nombre || !telefono || !direccion) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Find the number
    const num = numeros.find((n) => n.numero === numero);
    if (!num) {
      alert('Número no encontrado');
      return;
    }

    const ahora = new Date().toISOString();

    // Prepare data
    num.nombre = nombre;
    num.telefono = telefono;
    num.direccion = direccion;
    num.estado = 'reservado';
    num.fecha = num.fecha || ahora;
    num.fechaActualizacion = ahora;

    // Save to Firestore
    const guardarBtn = document.getElementById('guardar');
    guardarBtn.disabled = true;
    guardarBtn.textContent = 'Guardando...';

    console.log(`[Cliente] Intentando reservar número ${num.numero}...`);
    actualizarNumeroFirebase(num)
      .then(() => {
        console.log(`[Cliente] Número ${num.numero} reservado con éxito.`);
        // Log the reservation in history
        if (
          typeof FirestoreService !== 'undefined' &&
          FirestoreService.registrarHistorial
        ) {
          FirestoreService.registrarHistorial({
            numero: num.numero,
            accion: `Reserva realizada por el cliente: ${nombre}`,
            estadoAnterior: 'disponible',
            estadoNuevo: 'reservado',
            usuario: 'cliente',
          }).catch((err) =>
            console.error('[Cliente] Error al registrar historial:', err),
          );
        }
        fondo.remove();
      })
      .catch((err) => {
        console.error('[Cliente] Error al procesar reserva:', err);
        guardarBtn.disabled = false;
        guardarBtn.textContent = 'Confirmar Registro';
        alert(
          'ERROR AL REGISTRAR: ' +
            err.message +
            '\n\nEs posible que debas autorizar el dominio en la consola de Firebase.',
        );
      });
  };
}
