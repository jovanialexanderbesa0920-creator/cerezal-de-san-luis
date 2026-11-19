import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Clock, LogIn, LogOut, Search, 
  Filter, Calendar, ShieldCheck, CheckCircle, Info, Trash2, Home, ArrowLeft
} from 'lucide-react';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

const VisitorsModule = () => {
  const { user, role, users } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedHouse, setSelectedHouse] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    idNumber: '',
    unidadId: role === 'admin' ? '' : user?.unidadId || '',
    date: new Date().toISOString().split('T')[0]
  });

  const registeredUnits = users
    .filter(u => u.role === 'residente')
    .map(u => u.unidadId)
    .sort((a, b) => {
       const numA = parseInt(a?.replace(/\D/g, '')) || 0;
       const numB = parseInt(b?.replace(/\D/g, '')) || 0;
       return numA - numB;
    });

  useEffect(() => {
    const q = role === 'admin'
        ? query(collection(db, 'visitors'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'visitors'), where('unidadId', '==', user?.unidadId || 'NONE'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisitors(data);
    });
    return unsubscribe;
  }, [role, user?.unidadId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, 'visitors'), {
            ...formData,
            status: 'expected',
            createdAt: new Date().toISOString()
        });
        setShowModal(false);
        setFormData({ 
            name: '', 
            idNumber: '', 
            unidadId: role === 'admin' ? '' : user?.unidadId || '', 
            date: new Date().toISOString().split('T')[0] 
        });
    } catch (err) {
        console.error(err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
        const data = { status: newStatus };
        if (newStatus === 'active') data.entryTime = new Date().toISOString();
        if (newStatus === 'departed') data.exitTime = new Date().toISOString();
        
        await updateDoc(doc(db, 'visitors', id), data);
    } catch (err) {
        console.error(err);
    }
  };

  const deleteVisitor = async (id) => {
    if (window.confirm('¿Eliminar este registro de visita?')) {
      try {
          await deleteDoc(doc(db, 'visitors', id));
      } catch (err) {
          console.error(err);
      }
    }
  };

  const filtered = visitors.filter(v => {
    // If admin is viewing a specific house, show only those visitors
    if (role === 'admin' && selectedHouse && v.unidadId !== selectedHouse) return false;
    
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.idNumber.toLowerCase().includes(search.toLowerCase()) ||
                          v.unidadId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filter === 'all' ? true : v.status === filter;
    return matchesSearch && matchesStatus;
  });

  // RENDER ADMIN LIST OF HOUSES
  if (role === 'admin' && !selectedHouse) {
    return (
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <span className="text-primary font-black text-[10px] uppercase tracking-[0.5em] mb-3 block">SEGURIDAD Y ACCESOS</span>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">Visitantes</h2>
          </div>
          <button className="btn-primary flex items-center justify-center gap-2" onClick={() => setShowModal(true)}>
            <UserPlus size={18} /> REGISTRAR VISITA
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card p-6 flex flex-col gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-dim">En el Conjunto</p>
            <p className="text-3xl font-black text-white">{visitors.filter(v => v.status === 'active').length}</p>
          </div>
          <div className="premium-card p-6 flex flex-col gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-dim">Esperados Hoy</p>
            <p className="text-3xl font-black text-white">{visitors.filter(v => v.status === 'expected' && v.date === new Date().toISOString().split('T')[0]).length}</p>
          </div>
          <div className="premium-card p-6 flex flex-col gap-2">
            <p className="text-[9px] font-black uppercase tracking-widest text-text-dim">Total Visitas</p>
            <p className="text-3xl font-black text-white">{visitors.length}</p>
          </div>
          <div className="premium-card p-6 flex flex-col gap-2 border-primary/20">
             <ShieldCheck size={24} className="text-primary opacity-50" />
             <p className="text-[8px] font-bold text-text-muted uppercase mt-2">Protocolo Activo</p>
          </div>
        </div>

        {/* Grid of Houses */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {registeredUnits.map(unitId => {
            const hasActiveVisitors = visitors.some(v => v.unidadId === unitId && v.status === 'active');
            const hasExpectedVisitors = visitors.some(v => v.unidadId === unitId && v.status === 'expected' && v.date === new Date().toISOString().split('T')[0]);
            
            return (
              <button 
                key={unitId}
                onClick={() => setSelectedHouse(unitId)}
                className={`premium-card p-8 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-all hover:-translate-y-1 relative overflow-hidden group ${hasActiveVisitors ? 'ring-1 ring-primary/40' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${hasActiveVisitors ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-text-dim group-hover:text-primary group-hover:border-primary/30'}`}>
                  <Home size={24} />
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">{unitId}</span>
                </div>
                {/* Indicators */}
                <div className="flex gap-2 mt-2">
                  {hasActiveVisitors && (
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" title="Visitantes en conjunto"></span>
                  )}
                  {hasExpectedVisitors && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(255,107,0,0.6)]" title="Visitantes esperados hoy"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-md premium-card p-10 bg-bg-sidebar border-t-2 border-primary shadow-2xl relative">
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-8">Registrar Sorpresa</h3>
              <form onSubmit={handleCreate} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Nombre Completo</label>
                   <input type="text" placeholder="Escriba el nombre..." className="premium-input uppercase font-black" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Documento / ID</label>
                   <input type="text" placeholder="1.023.445.678" className="premium-input uppercase font-black" value={formData.idNumber} onChange={e=>setFormData({...formData, idNumber: e.target.value})} required />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Casa / Unidad</label>
                   <select className="premium-input uppercase font-black bg-bg-dark border-primary/20 appearance-none text-center" value={formData.unidadId} onChange={e=>setFormData({...formData, unidadId: e.target.value})} required>
                     <option value="">-- SELECCIONAR --</option>
                     {registeredUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Fecha de Visita</label>
                   <input type="date" className="premium-input uppercase font-black" value={formData.date} onChange={e=>setFormData({...formData, date: e.target.value})} required />
                 </div>
                 <div className="flex gap-4 mt-8">
                    <button type="button" onClick={() => setShowModal(false)} className="segment-btn px-6 py-3">Cancelar</button>
                    <button type="submit" className="btn-primary flex-1 py-3 text-[9px] uppercase font-black tracking-widest">Registrar Visita</button>
                 </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER VISITORS LIST FOR SELECTED HOUSE OR RESIDENT
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          {role === 'admin' && selectedHouse ? (
            <button 
               onClick={() => setSelectedHouse(null)} 
               className="mb-4 flex items-center gap-2 text-[10px] font-black text-text-dim hover:text-white uppercase tracking-widest transition-colors"
            >
               <ArrowLeft size={14} /> VOLVER A UNIDADES
            </button>
          ) : (
            <span className="text-primary font-black text-[10px] uppercase tracking-[0.5em] mb-3 block">SEGURIDAD Y ACCESOS</span>
          )}
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic">
            {role === 'admin' ? `VISITANTES ${selectedHouse}` : 'Mis Visitas'}
          </h2>
        </div>
        <button className="btn-primary flex items-center justify-center gap-2" onClick={() => setShowModal(true)}>
          <UserPlus size={18} /> {role === 'admin' ? 'REGISTRAR VISITA' : 'ANUNCIAR VISITA'}
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o ID..." 
            className="premium-input pl-16 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
           {['all', 'expected', 'active', 'departed'].map(s => (
             <button
               key={s}
               onClick={() => setFilter(s)}
               className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-muted hover:bg-white/5'}`}
             >
               {s === 'all' ? 'TODOS' : s === 'expected' ? 'ESPERADOS' : s === 'active' ? 'EN SITIO' : 'SALIDA'}
             </button>
           ))}
        </div>
      </div>

      {/* Visitors List */}
      <div className="module-grid">
        {filtered.map(v => (
          <div key={v.id} className={`premium-card p-0 overflow-hidden relative group border-none shadow-2xl transition-all hover:translate-y-[-4px] ${v.status === 'active' ? 'ring-1 ring-primary/30' : ''}`}>
             <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${v.status === 'active' ? 'bg-primary/10 border-primary/20 text-primary animate-pulse' : 'bg-white/5 border-white/5 text-text-dim'}`}>
                      <Users size={24} />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tighter">{v.name}</h4>
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{v.idNumber}</p>
                   </div>
                </div>
                <button onClick={() => deleteVisitor(v.id)} className="p-2 hover:bg-error/10 text-error/20 hover:text-error rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16} />
                </button>
             </div>
             
             <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Calendar size={14} className="text-text-dim" />
                      <span className="text-[9px] font-black text-text-dim uppercase tracking-widest">{v.date}</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <Home size={14} className="text-primary" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{v.unidadId}</span>
                   </div>
                </div>

                {(v.entryTime || v.exitTime) && (
                  <div className="flex flex-col gap-2 relative z-10 w-full">
                    {v.entryTime && (
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 w-full">
                         <Clock size={12} className="text-primary flex-shrink-0" />
                         <p className="text-[8px] font-bold text-text-muted uppercase truncate">Ingreso: <span className="text-white ml-1">{new Date(v.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></p>
                      </div>
                    )}
                    {v.exitTime && (
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 w-full">
                         <Clock size={12} className="text-text-dim flex-shrink-0" />
                         <p className="text-[8px] font-bold text-text-muted uppercase truncate">Salida: <span className="text-white ml-1">{new Date(v.exitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></p>
                      </div>
                    )}
                  </div>
                )}
             </div>

             <div className="p-6 bg-black/30 border-t border-white/5">
                {role === 'admin' ? (
                   <div className="grid grid-cols-2 gap-4">
                      {v.status === 'expected' && (
                         <button 
                            onClick={() => updateStatus(v.id, 'active')}
                            className="col-span-2 w-full py-4 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                         >
                            <LogIn size={14} /> MARCAR INGRESO
                         </button>
                      )}
                      {v.status === 'active' && (
                         <button 
                            onClick={() => updateStatus(v.id, 'departed')}
                            className="col-span-2 w-full py-4 bg-white/10 hover:bg-white text-white hover:text-bg-dark text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                         >
                            <LogOut size={14} /> REGISTRAR SALIDA
                         </button>
                      )}
                      {v.status === 'departed' && (
                         <div className="col-span-2 py-4 bg-success/5 border border-success/10 text-success text-[8px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2">
                            <CheckCircle size={14} /> VISITA FINALIZADA
                         </div>
                      )}
                   </div>
                ) : (
                   <div className="flex items-center justify-center gap-2 py-4">
                      <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest ${v.status === 'expected' ? 'bg-primary/20 text-primary' : v.status === 'active' ? 'bg-success/20 text-success animate-pulse' : 'bg-white/10 text-text-dim'}`}>
                         {v.status === 'expected' ? 'Anunciado' : v.status === 'active' ? 'En el Conjunto' : 'Salida Registrada'}
                      </div>
                   </div>
                )}
             </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-40 text-center opacity-20">
           <Users size={64} className="mx-auto mb-6" />
           <p className="text-[10px] font-black uppercase tracking-[0.6em]">No se encontraron registros</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md premium-card p-10 bg-bg-sidebar border-t-2 border-primary shadow-2xl relative">
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-8">{role === 'admin' ? 'Registrar Sorpresa' : 'Anunciar Visitante'}</h3>
            <form onSubmit={handleCreate} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Nombre Completo</label>
                 <input 
                    type="text" 
                    placeholder="Escriba el nombre..." 
                    className="premium-input uppercase font-black" 
                    value={formData.name} 
                    onChange={e=>setFormData({...formData, name: e.target.value})} 
                    required 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Documento / ID</label>
                 <input 
                    type="text" 
                    placeholder="1.023.445.678" 
                    className="premium-input uppercase font-black" 
                    value={formData.idNumber} 
                    onChange={e=>setFormData({...formData, idNumber: e.target.value})} 
                    required 
                 />
               </div>
               {role === 'admin' ? (
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Casa / Unidad</label>
                   <select 
                     className="premium-input uppercase font-black bg-bg-dark border-primary/20 appearance-none text-center" 
                     value={formData.unidadId} 
                     onChange={e=>setFormData({...formData, unidadId: e.target.value})}
                     required
                   >
                     <option value="">-- SELECCIONAR --</option>
                     {users.map(u => (
                        <option key={u.id} value={u.unidadId}>{u.unidadId}</option>
                     ))}
                   </select>
                 </div>
               ) : (
                 <div className="space-y-2 text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-1">Unidad Automática</p>
                    <p className="text-lg font-black text-primary uppercase tracking-tighter">{user?.unidadId}</p>
                 </div>
               )}
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Fecha de Visita</label>
                 <input 
                    type="date" 
                    className="premium-input uppercase font-black" 
                    value={formData.date} 
                    onChange={e=>setFormData({...formData, date: e.target.value})} 
                    required 
                 />
               </div>
               <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="segment-btn px-6 py-3">Cancelar</button>
                  <button type="submit" className="btn-primary flex-1 py-3 text-[9px] uppercase font-black tracking-widest">Registrar Visita</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsModule;
