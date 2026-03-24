/**
 * firestoreService.js — Wrapper for Database operations.
 * Optimized for a model where only RESERVED/SOLD numbers are stored in Firebase.
 */

const FirestoreService = (() => {
  // ─── Numbers ───────────────────────────────────────────────

  /**
   * Listen to all active (non-available) numbers in real-time using RTDB.
   */
  function escucharNumeros(callback) {
    if (typeof rifaRef === 'undefined') {
      console.error('rifaRef no disponible. Verifica firebase-config.js');
      return () => {};
    }

    // Escuchamos toda la colección/rama de números
    rifaRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const busyNumbers = [];

      if (data) {
        // En RTDB los datos pueden venir como objeto o array
        if (typeof data === 'object' && !Array.isArray(data)) {
          Object.keys(data).forEach((key) => {
            busyNumbers.push({ id: key, ...data[key] });
          });
        } else if (Array.isArray(data)) {
          data.forEach((val, index) => {
            if (val) busyNumbers.push({ id: String(index), ...val });
          });
        }
      }

      callback(busyNumbers);
    });

    return () => rifaRef.off();
  }

  /**
   * Save or update a number reservation in RTDB.
   * Key is the 4-digit padded number (e.g. "0005").
   */
  async function actualizarNumero(numObj) {
    const ahora = new Date().toISOString();
    const numeroStr = String(numObj.numero);

    console.log(`[FirestoreService] Actualizando número ${numObj.numero}...`, {
      idActual: numObj.id,
      idNuevo: numeroStr,
    });

    // 1. Borrar rastro de cualquier formato anterior (01, 001, 0001) para evitar duplicidad
    const formats = [
      String(numObj.numero).padStart(2, '0'),
      String(numObj.numero).padStart(3, '0'),
      String(numObj.numero).padStart(4, '0'),
    ];

    for (const f of formats) {
      if (f !== numeroStr) await rifaRef.child(f).remove();
    }

    if (numObj.id && numObj.id !== numeroStr && !formats.includes(numObj.id)) {
      await rifaRef.child(numObj.id).remove();
    }

    // 2. Si el estado es 'disponible', nos aseguramos de borrar cualquier rastro
    if (numObj.estado === 'disponible') {
      const formats = [
        String(numObj.numero),
        String(numObj.numero).padStart(2, '0'),
        String(numObj.numero).padStart(3, '0'),
        String(numObj.numero).padStart(4, '0'),
      ];
      for (const f of formats) {
        await rifaRef.child(f).remove();
      }
      return;
    }

    // 3. Guardar en la ruta estandarizada (sin ceros)
    return rifaRef.child(numeroStr).set({
      numero: parseInt(numObj.numero),
      nombre: numObj.nombre || '',
      telefono: numObj.telefono || '',
      direccion: numObj.direccion || '',
      estado: numObj.estado || 'reservado',
      fechaActualizacion: ahora,
    });
  }

  /**
   * Reset a number completely (remove from DB).
   * @param {number} numero
   */
  async function resetearNumero(numero) {
    if (typeof rifaRef === 'undefined') return;
    const formats = [
      String(numero),
      String(numero).padStart(2, '0'),
      String(numero).padStart(3, '0'),
      String(numero).padStart(4, '0'),
    ];

    console.log(
      `[FirestoreService] Limpiando rastro completo del número ${numero}...`,
    );

    for (const f of formats) {
      await rifaRef.child(f).remove();
    }
  }

  // ─── History / Audit ──────────────────────────────────────

  async function registrarHistorial({
    numero,
    accion,
    estadoAnterior,
    estadoNuevo,
    usuario,
  }) {
    if (typeof databaseHistorialRef === 'undefined') return;

    return databaseHistorialRef.push({
      numero,
      accion,
      estadoAnterior,
      estadoNuevo,
      usuario: usuario || 'admin',
      fecha: new Date().toISOString(),
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    });
  }

  function escucharHistorial(callback, limite = 50) {
    if (typeof databaseHistorialRef === 'undefined') {
      callback([]);
      return () => {};
    }

    const query = databaseHistorialRef.limitToLast(limite);
    query.on('value', (snapshot) => {
      const data = snapshot.val();
      const entries = [];
      if (data) {
        Object.keys(data).forEach((key) => {
          entries.push({ id: key, ...data[key] });
        });
        entries.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
      callback(entries);
    });

    return () => query.off();
  }

  // ─── Configuration ────────────────────────────────────────

  async function obtenerConfiguracion() {
    try {
      if (typeof configRifaRef === 'undefined')
        return { precioNumero: 0, nombreRifa: 'Rifa' };

      const snapshot = await configRifaRef.once('value');
      const data = snapshot.val();
      return data || { precioNumero: 1000, nombreRifa: 'Mi Rifa' };
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      return { precioNumero: 1000, nombreRifa: 'Mi Rifa' };
    }
  }

  async function actualizarConfiguracion(config) {
    try {
      if (typeof configRifaRef === 'undefined') return;
      return configRifaRef.update(config);
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      throw error;
    }
  }

  function escucharConfiguracion(callback) {
    if (typeof configRifaRef === 'undefined') {
      callback({ precioNumero: 1000, nombreRifa: 'Rifa' });
      return () => {};
    }

    configRifaRef.on('value', (snapshot) => {
      const data = snapshot.val() || { precioNumero: 1000, nombreRifa: 'Rifa' };
      callback(data);
    });

    return () => configRifaRef.off();
  }

  return {
    actualizarNumero,
    escucharNumeros,
    escucharHistorial,
    actualizarConfiguracion,
    obtenerConfiguracion,
    escucharConfiguracion,
    registrarHistorial,
    resetearNumero,
  };
})();
