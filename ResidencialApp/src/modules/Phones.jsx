import React, { useState, useEffect } from 'react';
import { Phone, Search, Users, Shield, PlusCircle, Trash2, Edit2, Info, CheckCircle, ExternalLink, Home, Contact, User, Heart, Briefcase } from 'lucide-react';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

const RELATION_TYPES = ['Propietario', 'Arrendatario', 'Familiar'];

const getRelationIcon = (type) => {
  switch (type) {
    case 'Propietario': return <Shield size={18} className="text-secondary" />;
    case 'Arrendatario': return <Briefcase size={18} className="text-primary" />;
    default: return <Heart size={18} className="text-error" />;
  }
};

export default function PhoneModule() {
  const { user, role, users } = useAuth();
  const [directorio, setDirectorio] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedHouse, setSelectedHouse] = useState(role === 'residente' ? user.unidadId : null);
  const [editData, setEditData] = useState([
    { name: '', phone: '', type: 'Propietario' },
    { name: '', phone: '', type: 'Arrendatario' },
    { name: '', phone: '', type: 'Familiar' }
  ]);
  const [search, setSearch] = useState('');

  // Filter only units that are actually registered by the administration
  const REGISTERED_HOUSES = [...new Set(users.map(u => u.unidadId))].filter(u => u && u !== 'ADMIN').sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'directorio'), (snapshot) => {
      const data = {};
      snapshot.docs.forEach(doc => {
        data[doc.id] = doc.data().numeros || [
          { name: '', phone: '', type: 'Propietario' },
          { name: '', phone: '', type: 'Arrendatario' },
          { name: '', phone: '', type: 'Familiar' }
        ];
      });
      setDirectorio(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (selectedHouse && directorio[selectedHouse]) {
      // Create fresh copies of objects to avoid state mutation
      setEditData(directorio[selectedHouse].map(item => ({ ...item })));
    } else {
      setEditData([
        { name: '', phone: '', type: 'Propietario' },
        { name: '', phone: '', type: 'Arrendatario' },
        { name: '', phone: '', type: 'Familiar' }
      ]);
    }

    const unsubPorter = onSnapshot(doc(db, 'telefonos', 'porteria'), (docSnap) => {
      if (docSnap.exists()) {
        setPorterPhone(docSnap.data().numero);
      }
    });

    return () => unsubPorter();
  }, [selectedHouse, directorio]);

  const saveNumbers = async () => {
    if (!selectedHouse) return;
    try {
      await setDoc(doc(db, 'directorio', selectedHouse), {
        numeros: editData,
        lastUpdate: new Date().toISOString()
      });
      alert('¡Información de citofonía sincronizada con éxito!');
      if (role === 'admin') setSelectedHouse(null);
    } catch (err) {
      console.error(err);
      alert('Error guardando en la nube: ' + err.message);
    }
  };

  const updateEditField = (index, field, value) => {
    const newData = editData.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setEditData(newData);
  };

  const filteredHouses = REGISTERED_HOUSES.filter(h => 
    h.toLowerCase().includes(search.toLowerCase())
  );

  const [callingId, setCallingId] = useState(null);
  const [porterPhone, setPorterPhone] = useState('+57XXXXXXXXXX'); // Default with prefix

  const updatePorterPhone = async () => {
    try {
      if (porterPhone) {
        await setDoc(doc(db, 'telefonos', 'porteria'), { numero: porterPhone });
        // Optional user feedback or silent.
      }
    } catch (err) {
      console.error("Error saving porter phone", err);
    }
  };

  const handleCall = async (phone, contactName, houseId) => {
    if (!phone) return alert('No hay un número registrado para este contacto.');
    if (!porterPhone) return alert('Por favor, defina el número de este teléfono de portería arriba.');
    
    setCallingId(contactName); 
    
    try {
      // ✅ MOD PUENTE SEGURO (UBER FLOW)
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase');
      
      const makeCall = httpsCallable(functions, 'makeSecureCall');
      const result = await makeCall({ 
        targetPhone: phone,
        porterPhone: porterPhone 
      });
      
      if (result.data.success) {
          alert(`📡 PUENTE INICIADO: Tu teléfono (${porterPhone}) sonará pronto. Contesta para hablar con ${contactName} de la Casa ${houseId}. Al ser cuenta de prueba, asegúrate de haber verificado este número en Twilio.`);
      } else {
          throw new Error("No se pudo iniciar el puente");
      }
      
    } catch (err) {
      console.error("Falla en puente seguro:", err);
      alert("Error: El servidor de llamadas no está activo o no tiene saldo.");
      // Eliminamos fallback a tel: para evitar filtrar el número real
    } finally {
      setTimeout(() => setCallingId(null), 4000);
    }
  };

  if (loading) return <div className="p-20 text-center text-primary font-black animate-pulse uppercase tracking-widest text-[10px]">Sincronizando Directorio de Cerezal...</div>;

  return (
    <div className="space-y-12 animate-ready">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">DIRECTORIO SEGURO</h2>
          <p className="text-text-dim text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Control de Privacidad Blindada para Residentes</p>
        </div>
        
        {role === 'admin' && (
          <div className="premium-card p-4 bg-primary/5 border-primary/20 flex items-center gap-4">
             <div className="p-2 bg-primary/10 rounded-xl text-primary"><Phone size={16} /></div>
             <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-primary tracking-widest mb-1">Teléfono de esta Portería</span>
                <input 
                  type="tel" 
                  value={porterPhone} 
                  onChange={(e) => setPorterPhone(e.target.value.replace(/[^\d+]/g, ''))}
                  onBlur={updatePorterPhone}
                  className="bg-transparent border-none p-0 text-xs font-black text-white tracking-[0.2em] focus:ring-0 w-32"
                />
             </div>
          </div>
        )}
      </div>

      {!selectedHouse ? (
        <div className="space-y-8">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="BUSCAR CASA (E.g. CASA 29)" 
              className="premium-input pl-16 w-full text-xs font-black uppercase tracking-widest"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredHouses.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredHouses.map(h => (
                <button 
                  key={h}
                  onClick={() => setSelectedHouse(h)}
                  className="premium-card p-10 flex flex-col items-center gap-4 hover:border-primary/50 hover:bg-white/5 transition-all text-center group"
                >
                  <div className="relative">
                    <Home size={32} className="text-text-muted group-hover:text-primary transition-colors" />
                    {directorio[h]?.some(n => n?.name?.trim() && n?.phone?.trim()) && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-bg-dark" />
                    )}
                  </div>
                  <div>
                    <p className="font-black text-[11px] uppercase tracking-widest text-white leading-none mb-1">{h}</p>
                    <p className="text-[8px] font-bold text-text-muted uppercase italic">Ver Citofonía</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center premium-card border-dashed opacity-40">
               <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Esperando Unidades Registradas en Cerezal</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
           <div className="flex items-center justify-between">
              <button 
                onClick={() => role === 'admin' ? setSelectedHouse(null) : null} 
                className={`text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${role === 'admin' ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'}`}
              >
                {role === 'admin' ? '← Volver al Listado de Unidades' : `PANEL DE CITOFONÍA: ${selectedHouse}`}
              </button>
           </div>

           <div className="premium-card p-0 bg-transparent border-none overflow-visible">
              <div className="grid grid-cols-1 gap-8">
                 {editData.map((val, idx) => (
                    <div key={idx} className="premium-card bg-[#111827] p-0 border-l-4 border-primary overflow-hidden group hover:border-secondary transition-all shadow-xl">
                       <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5 h-full">
                          
                          {/* Left: Metadata & Relation */}
                          <div className="w-full md:w-56 p-10 flex flex-col items-center justify-center text-center space-y-4 bg-white/2 cursor-default shrink-0">
                             <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                                {getRelationIcon(val.type)}
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-white tracking-[0.2em] mb-1">{val.type}</p>
                                <p className="text-[8px] font-bold text-text-muted uppercase">Vínculo Residente</p>
                             </div>
                             {role === 'residente' && (
                               <select 
                                 className="bg-transparent border-none text-[8px] font-black uppercase tracking-widest text-primary focus:ring-0 cursor-pointer text-center"
                                 value={val.type}
                                 onChange={(e) => updateEditField(idx, 'type', e.target.value)}
                               >
                                  {RELATION_TYPES.map(t => <option key={t} value={t} className="bg-bg-sidebar">{t}</option>)}
                               </select>
                             )}
                          </div>

                          {/* Middle: Name Form */}
                          <div className="flex-1 p-10 flex flex-col justify-center gap-2">
                             <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.4em] mb-1">Nombre Completo del Contacto</span>
                             {role === 'residente' ? (
                               <input 
                                 type="text"
                                 placeholder="NOMBRE COMPLETO"
                                 className="bg-transparent border-none text-2xl font-black text-white p-0 focus:ring-0 uppercase placeholder:opacity-5 w-full tracking-tighter"
                                 value={val.name}
                                 onChange={(e) => updateEditField(idx, 'name', e.target.value.toUpperCase())}
                               />
                             ) : (
                               <h4 className="text-3xl font-black text-white uppercase tracking-tighter italic">{val.name || '--- SIN NOMBRE ---'}</h4>
                             )}
                             <p className="text-[9px] font-medium text-text-muted uppercase tracking-widest mt-2">Dato exclusivo para el control interno de Portería de Cerezal.</p>
                          </div>

                          {/* Right: Phone Actions */}
                          <div className="w-full md:w-80 p-10 bg-white/2 flex flex-col justify-center gap-4">
                             <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.4em] mb-1">Control de Comunicación</span>
                             {role === 'residente' ? (
                               <div className="relative group/field">
                                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/field:text-primary transition-colors" size={16} />
                                  <input 
                                    type="tel"
                                    placeholder="NÚMERO DE TELÉFONO"
                                    className="premium-input pl-14 h-16 text-lg font-black tracking-widest bg-bg-dark"
                                    value={val.phone}
                                    onChange={(e) => updateEditField(idx, 'phone', e.target.value.replace(/\D/g, ''))}
                                    maxLength={10}
                                  />
                               </div>
                             ) : (
                               <button 
                                 onClick={() => handleCall(val.phone, val.name, selectedHouse)}
                                 disabled={callingId}
                                 className={`w-full h-20 rounded-2xl shadow-xl shadow-primary/10 flex items-center justify-center gap-4 transition-all group/btn ${callingId === val.name ? 'bg-secondary animate-pulse text-white' : 'bg-primary hover:bg-white text-white hover:text-primary'}`}
                               >
                                  <div className="p-3 bg-white/10 rounded-lg group-hover/btn:bg-primary/10 transition-colors">
                                     <Phone size={24} className={callingId === val.name ? 'animate-bounce' : 'group-hover/btn:rotate-12 transition-transform'} />
                                  </div>
                                  <div className="text-left">
                                     <p className="text-[11px] font-black uppercase tracking-widest leading-none">
                                        {callingId === val.name ? 'CONECTANDO...' : 'LLAMADA SEGURA'}
                                     </p>
                                     <p className="text-[8px] font-bold uppercase opacity-60 tracking-widest mt-1">
                                        {callingId === val.name ? 'Estableciendo Túnel Privado' : 'Hacer clic para marcar'}
                                     </p>
                                  </div>
                               </button>
                             )}
                          </div>

                       </div>
                    </div>
                 ))}
              </div>

              {role === 'residente' && (
                <div className="pt-20 flex flex-col items-center gap-10">
                   <button 
                     onClick={saveNumbers} 
                     className="btn-primary px-32 py-8 text-sm text-white shadow-[0_20px_50px_rgba(249,115,22,0.3)] hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                   >
                      SINCRONIZAR TODA LA INFORMACIÓN
                   </button>
                   
                   <div className="flex items-center gap-4 text-secondary/40">
                      <Shield size={20} />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Protección de Datos Grado Bancario Activa</p>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
