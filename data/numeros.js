/**
 * numeros.js — Gestión global de los 1,000 números de la rifa.
 * Genera los números localmente y los mezcla con los datos de Firebase (reservados/vendidos).
 */

let numeros = [];
const TOTAL_NUMEROS = 1000;

// Inicialización local inmediata para que la UI no esté vacía
function inicializarNumerosLocales() {
  const nuevosNumeros = [];
  for (let i = 1; i <= TOTAL_NUMEROS; i++) {
    nuevosNumeros.push({
      numero: i,
      estado: 'disponible',
      nombre: '',
      telefono: '',
      direccion: '',
    });
  }
  numeros = nuevosNumeros;
}

inicializarNumerosLocales();

// Escuchar cambios en Realtime Database
if (typeof FirestoreService !== 'undefined') {
  FirestoreService.escucharNumeros((busyNumbers) => {
    console.log(
      'Sincronizando',
      busyNumbers.length,
      'registros desde Firebase',
    );

    // Resetear a disponibles antes de aplicar los datos de Firebase
    inicializarNumerosLocales();

    // Aplicar datos de Firebase (números reservados, vendidos, etc.)
    busyNumbers.forEach((busy) => {
      const numIdx = busy.numero - 1;
      if (numeros[numIdx]) {
        numeros[numIdx] = {
          ...numeros[numIdx],
          ...busy,
          id: busy.id, // Mantener el ID de Firebase para actualizaciones
        };
      }
    });

    // Notificar a la UI
    setTimeout(() => {
      if (typeof mostrarNumeros === 'function') {
        mostrarNumeros(typeof paginaActual !== 'undefined' ? paginaActual : 1);
      }
      if (typeof filtrar === 'function') {
        filtrar(typeof filtroActual !== 'undefined' ? filtroActual : 'todos');
      }
      if (typeof onNumerosActualizados === 'function') {
        onNumerosActualizados(numeros);
      }
    }, 100);
  });
}

/**
 * Función puente para el modal.
 */
function actualizarNumeroFirebase(numObj) {
  return FirestoreService.actualizarNumero(numObj);
}
