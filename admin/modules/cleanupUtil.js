/**
 * Utility script to clean up the Realtime Database.
 * Standardizes everything to 4-digit padding (0001-1000).
 */
async function cleanupDatabase() {
  console.log('🚀 Starting deep database cleanup...');
  if (typeof rifaRef === 'undefined') {
    console.error('❌ rifaRef not found. Are you on the admin dashboard?');
    return;
  }

  const snapshot = await rifaRef.once('value');
  const data = snapshot.val();

  if (!data) {
    console.log('✅ Database is already empty.');
    return;
  }

  let removedCount = 0;
  let fixedCount = 0;
  let totalCount = 0;

  for (const key in data) {
    totalCount++;
    const item = data[key];
    const canonicalKey = String(item.numero);

    // 1. Eliminar disponibles
    if (item.estado === 'disponible' || !item.estado) {
      await rifaRef.child(key).remove();
      removedCount++;
    }
    // 2. Corregir IDs con formato viejo (ej: "01", "001", "0001" -> "1")
    else if (key !== canonicalKey) {
      console.log(
        `🔧 Migrando key "${key}" a "${canonicalKey}" (sin ceros)...`,
      );
      await rifaRef.child(canonicalKey).set(item);
      await rifaRef.child(key).remove();
      fixedCount++;
    }
  }

  console.log(`✅ Cleanup finished!
  - Total records found: ${totalCount}
  - Records removed (disponibles): ${removedCount}
  - Records fixed (re-formatted to 4 digits): ${fixedCount}
  - Final records: ${totalCount - removedCount}`);
}

/**
 * Utility to completely clear the history log.
 */
async function clearHistory() {
  if (
    !confirm(
      '⚠️ ¿Estás seguro de que quieres BORRAR TODO el historial de movimientos? Esta acción no se puede deshacer.',
    )
  ) {
    return;
  }

  console.log('🗑️ Borrando historial...');
  if (typeof databaseHistorialRef === 'undefined') {
    console.error('❌ databaseHistorialRef not found.');
    return;
  }

  try {
    await databaseHistorialRef.remove();
    console.log('✅ Historial borrado correctamente.');
  } catch (error) {
    console.error('❌ Error al borrar historial:', error);
  }
}

// Global exposure
window.cleanupDatabase = cleanupDatabase;
window.clearHistory = clearHistory;
