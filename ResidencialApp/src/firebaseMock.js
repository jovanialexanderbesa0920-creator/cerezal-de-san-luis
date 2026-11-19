const storage = {
  get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
};

const safeParse = (key) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
};

const initData = () => {
    // Definición limpia de usuarios maestros
    const masters = [
        { id: 'admin_id', username: 'porteria', password: '123', role: 'admin', unidadId: 'PORTERÍA' },
        { id: 'casa29_id', username: 'casa29', password: '123', role: 'residente', unidadId: 'CASA 29' }
    ];
    storage.set('db_users', masters);
    storage.set('db_paquetes', []);
    storage.set('db_telefonos', []);
    storage.set('db_visitor_slots', Array.from({ length: 12 }, (_, i) => ({ id: i + 1, occupied: false, plate: '', unit: '', type: 'Carro', entry: null })));
};

// RESET MAESTRO v6 - Hard wipe para restaurar parqueaderos
if (localStorage.getItem('db_reset_v6') !== 'true') {
    localStorage.clear();
    initData();
    localStorage.setItem('db_reset_v6', 'true');
}

let authListeners = [];
const notify = (u) => authListeners.forEach(cb => cb(u));

export const auth = {
  currentUser: safeParse('auth_user'),
  onAuthStateChanged: (cb) => {
    authListeners.push(cb);
    cb(safeParse('auth_user'));
    return () => { authListeners = authListeners.filter(l => l !== cb); };
  },
  signIn: async (uInput, pInput) => {
    const all = storage.get('db_users');
    const uClean = (uInput || '').trim().toLowerCase();
    const pClean = (pInput || '').trim();
    
    // Búsqueda flexible pero segura
    const matched = all.find(u => 
        u.username.toLowerCase().trim() === uClean && 
        u.password.toString().trim() === pClean
    );

    if (matched) {
      localStorage.setItem('auth_user', JSON.stringify(matched));
      notify(matched);
      return { user: matched };
    }
    
    // Check if user exists but pass is wrong for debug (internally)
    if (all.some(u => u.username.toLowerCase().trim() === uClean)) {
       throw new Error('Contraseña incorrecta para el usuario: ' + uInput);
    }
    
    throw new Error('Identificador "' + uInput + '" no encontrado.');
  },
  register: async (user, pass, unit) => {
    const all = storage.get('db_users');
    const uClean = (user || '').trim().toLowerCase();
    const unitClean = (unit || '').trim().toUpperCase();

    if (all.some(u => u.username.toLowerCase().trim() === uClean)) throw new Error('El nombre de usuario "' + user + '" está tomado.');
    if (all.some(u => u.unidadId.toUpperCase().trim() === unitClean)) throw new Error('La casa "' + unit + '" ya tiene cuenta.');

    const newUser = { id: Date.now().toString(), username: user.trim(), password: pass.trim(), unidadId: unitClean, role: 'residente' };
    storage.set('db_users', [...all, newUser]);
    return { user: newUser };
  },
  signOut: async () => {
    localStorage.removeItem('auth_user');
    notify(null);
  },
  deleteAccount: async (id) => {
    const all = storage.get('db_users');
    storage.set('db_users', all.filter(u => u.id !== id));
  }
};
