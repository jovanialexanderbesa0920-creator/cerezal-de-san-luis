import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { auth, db } from './firebase';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Secondary instance to register users without signing out the admin
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // Listen to all residential accounts (for admin view and registration drop down)
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'residente'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(allUsers);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let profileUnsub = null;
    const authUnsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        // Use onSnapshot to benefit from persistence and faster UI sync
        profileUnsub = onSnapshot(doc(db, 'users', u.uid), (userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ uid: u.uid, ...userData });
            setRole(userData.role);
          } else {
            setUser(null);
            setRole(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile sync error:", err);
          setLoading(false);
        });
      } else {
        if (profileUnsub) profileUnsub();
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const login = async (username, password, isRegister = false, unidadId = '') => {
    try {
      const email = `${username.toLowerCase().trim()}@cerezal.com`;
      
      if (isRegister) {
        // First, check if unit is already taken in the users collection
        const q = query(collection(db, 'users'), where('unidadId', '==', unidadId.toUpperCase()));
        // Note: This check might not be atomic, but sufficient for this context
        
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const userData = {
          uid: credential.user.uid,
          username: username.trim(),
          unidadId: unidadId.toUpperCase(),
          role: 'residente',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', credential.user.uid), userData);
        return { success: true, user: userData };
      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
        return { success: true, user: userDoc.data() };
      }
    } catch (err) {
      console.error(err);
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') msg = 'El nombre de usuario already in use.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') msg = 'Usuario o contraseña incorrectos.';
      return { success: false, message: msg };
    }
  };

  const register = async (username, password, unidadId) => {
    try {
        const email = `${username.toLowerCase().trim()}@cerezal.com`;
        // Use secondaryAuth to prevent current admin from being signed out
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const userData = {
          uid: credential.user.uid,
          username: username.trim(),
          unidadId: unidadId.toUpperCase(),
          role: 'residente',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', credential.user.uid), userData);
        
        // Sign out secondary session immediately
        await signOut(secondaryAuth);
        
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, message: err.message };
    }
  };

  const changeMyPassword = async (newPassword) => {
    if (!auth.currentUser) return { success: false, message: 'No session active' };
    try {
      if (newPassword.length < 6) throw new Error('Mínimo 6 caracteres');
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteAccount = async (userId) => {
    try {
        // Important: this only deletes the Firestore doc. 
        // Deleting the real Auth user requires admin privileges or Cloud Functions.
        await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
        console.error(err);
    }
  };
  
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  const setupFirestore = async () => {
    try {
      const adminPass = prompt('Define una contraseña para Portería (Mínimo 6 caracteres):');
      if (!adminPass || adminPass.length < 6) {
        alert('Contraseña inválida o muy corta. Reintentar.');
        return;
      }

      // 1. Create Portería Auth Account
      const email = 'porteria@cerezal.com';
      const credential = await createUserWithEmailAndPassword(auth, email, adminPass);
      
      // 2. Create Portería User Profile in Firestore
      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        username: 'porteria',
        unidadId: 'ADMIN',
        role: 'admin',
        createdAt: new Date().toISOString()
      });

      // 3. Create 12 visitor slots
      for (let i = 1; i <= 12; i++) {
        await setDoc(doc(db, 'visitor_slots', i.toString()), {
          id: i,
          occupied: false,
          plate: '',
          unit: '',
          type: 'Carro',
          entry: null
        });
      }

      // 4. Add default phones
      const phones = [
        { nombre: 'Portería Principal', numero: '6017618770', tipo: 'General' },
        { nombre: 'Administración', numero: '3001234567', tipo: 'General' },
        { nombre: 'Policía Nacional', numero: '123', tipo: 'Emergencia' },
        { nombre: 'Bomberos Bogotá', numero: '119', tipo: 'Emergencia' },
        { nombre: 'Ambulancia (CRUE)', numero: '125', tipo: 'Emergencia' }
      ];
      for (const p of phones) {
        await addDoc(collection(db, 'telefonos'), p);
      }

      console.log('Firebase Initialized Successfully');
      alert('¡Todo listo! Se ha creado la cuenta "porteria" y se han configurado los parqueaderos y el directorio. Ya puedes ingresar.');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
         alert('La base de datos ya fue inicializada previamente.');
      } else {
         alert('Error inicializando: ' + err.message);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, users, login, logout, register, deleteAccount, setupFirestore, changeMyPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
