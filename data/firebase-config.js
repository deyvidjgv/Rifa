// Configuración de Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyDirMSGjCb8pta0VmHbs1vtFdfi6jcuy9g',
  authDomain: 'rifa-e41f6.firebaseapp.com',
  databaseURL: 'https://rifa-e41f6-default-rtdb.firebaseio.com',
  projectId: 'rifa-e41f6',
  storageBucket: 'rifa-e41f6.firebasestorage.app',
  messagingSenderId: '337013402090',
  appId: '1:337013402090:web:2925933f7c2ebb1e8e2a93',
  measurementId: 'G-CKWH5561F4',
};

// Inicializar Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Obtener referencias de forma defensiva
const auth = typeof firebase.auth === 'function' ? firebase.auth() : null;
const database =
  typeof firebase.database === 'function' ? firebase.database() : null;

// Referencias a Realtime Database (Solo si el SDK está cargado)
const rifaRef = database ? database.ref('numeros') : null;
const databaseHistorialRef = database ? database.ref('historial') : null;
const configRifaRef = database ? database.ref('configuracion/rifa') : null;

console.log('[Firebase] Referencias inicializadas:', {
  auth: !!auth,
  database: !!database,
  rifaRef: !!rifaRef,
  historial: !!databaseHistorialRef,
});

// Mantener referencias Firestore por si acaso, pero priorizando RTDB
const db =
  typeof firebase.firestore === 'function' ? firebase.firestore() : null;
const firestoreNumerosRef = db ? db.collection('numeros') : null;
