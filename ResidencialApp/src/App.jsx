import React, { useState, useEffect } from 'react';
import { 
  Package, Car, Phone, LogOut, LayoutDashboard, PlusCircle, 
  Map as MapIcon, Bell, Settings, User, Mail, Lock, Eye, Home, Info, ArrowRight, Shield, Trash2, ShieldAlert, Receipt, Users, X
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import AuthProvider, { useAuth } from './AuthContext';

// Import Modules
import PackageModule from './modules/Packages';
import PhoneModule from './modules/Phones';
import VehicleModule from './modules/Vehicles';
import VisitorsModule from './modules/Visitors';

const ALL_HOUSES = Array.from({ length: 99 }, (_, i) => `CASA ${i + 1}`);

/* --- CORE COMPONENTS --- */

const SidebarItem = ({ to, icon: Icon, label, active }) => (
  <Link 
    to={to} 
    className={`sidebar-link ${active ? 'active' : ''}`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </Link>
);

const SummaryBox = ({ label, value, icon: Icon }) => (
  <div className="premium-card flex flex-col justify-between h-44 relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 group-hover:scale-110 transition-transform">
       <Icon size={80} className="text-primary" />
    </div>
    <div className="flex justify-between items-start">
       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">{label}</span>
    </div>
    <div className="text-4xl font-black text-white tracking-tighter">{value}</div>
  </div>
);

/* --- MODALS --- */

const AddHouseModal = ({ isOpen, onClose, onAdd }) => {
  const { users } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '', unidadId: '' });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.unidadId) {
      setError('Todos los campos son obligatorios');
      return;
    }
    const res = await onAdd(formData.username, formData.password, formData.unidadId);
    if (res.success) {
      setFormData({ username: '', password: '', unidadId: '' });
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md premium-card p-10 bg-bg-sidebar border-t-2 border-primary shadow-2xl">
        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-8">Registrar Nueva Casa</h3>
        <form onSubmit={handleSubmit} className="space-y-5">
           <div className="space-y-2">
             <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Seleccionar Unidad</label>
             <select 
               className="premium-input uppercase font-black bg-bg-dark border-primary/20 appearance-none text-center" 
               value={formData.unidadId} 
               onChange={e=>setFormData({...formData, unidadId: e.target.value})}
             >
               <option value="">-- SELECCIONAR CASA --</option>
               {ALL_HOUSES.filter(h => !users.some(u => u.unidadId === h)).map(h => (
                 <option key={h} value={h}>{h}</option>
               ))}
             </select>
           </div>
           <div className="space-y-2">
             <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">USUARIO</label>
             <input type="text" placeholder="USUARIO" className="premium-input font-bold" value={formData.username} onChange={e=>setFormData({...formData, username: e.target.value})} />
           </div>
           <div className="space-y-2">
             <label className="text-[9px] font-black text-text-muted uppercase tracking-widest ml-1">Contraseña Inicial</label>
             <input type="password" placeholder="••••••••" className="premium-input" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} />
           </div>
           {error && <p className="text-error text-[10px] font-black uppercase text-center">{error}</p>}
           <div className="flex gap-4 mt-8">
              <button type="button" onClick={onClose} className="segment-btn px-6 py-3">Cancelar</button>
              <button type="submit" className="btn-primary flex-1 py-3 text-[9px]">Guardar Residente</button>
           </div>
        </form>
      </div>
    </div>
  );
};

/* --- LAYOUTS --- */

const LayoutCore = ({ children }) => {
  const { logout, role, user, changeMyPassword } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const menu = role === 'admin' ? [
    { to: '/admin', icon: LayoutDashboard, label: 'Inicio' },
    { to: '/admin/packages', icon: Package, label: 'Paquetes' },
    { to: '/admin/visitors', icon: Users, label: 'Visitantes' },
    { to: '/admin/phones', icon: Phone, label: 'Directorio' },
    { to: '/admin/vehicles', icon: Car, label: 'Vehículos' },
  ] : [
    { to: '/resident', icon: LayoutDashboard, label: 'Mi Panel' },
    { to: '/resident/packages', icon: Package, label: 'Mi Correo' },
    { to: '/resident/visitors', icon: Users, label: 'Visitantes' },
    { to: '/resident/phones', icon: Phone, label: 'Directorio' },
    { to: '/resident/vehicles', icon: Car, label: 'Mis Autos' },
  ];

  const nameTag = user?.unidadId || user?.username || 'Residente';

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen w-full bg-bg-dark overflow-hidden relative">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-bg-sidebar border-b border-white/5 flex items-center justify-between px-6 z-[60]">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
            <h1 className="text-xs font-black tracking-tighter text-white uppercase italic">CEREZAL</h1>
         </div>
         <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-primary hover:bg-white/5 rounded-lg transition-colors">
            {isSidebarOpen ? <X size={24} /> : <Settings size={22} />}
         </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden animate-in fade-in duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 lg:static w-72 bg-bg-sidebar h-full flex flex-col border-r border-white/5 z-[80] shadow-2xl transition-transform duration-300 ease-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-10 mb-6 hidden lg:block">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
              <h1 className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">CEREZAL DE SAN LUIS</h1>
           </div>
           <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.3em] opacity-40 ml-5">Residencial Premium</p>
        </div>

        {/* Mobile Sidebar Head */}
        <div className="p-10 border-b border-white/5 mb-6 lg:hidden flex items-center justify-between">
            <h2 className="text-sm font-black text-white italic tracking-tighter uppercase underline decoration-primary decoration-2 underline-offset-4">MENÚ PRINCIPAL</h2>
            <button onClick={closeSidebar} className="text-text-muted"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menu.map(item => (
            <div key={item.to} onClick={closeSidebar}>
              <SidebarItem 
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                active={location.pathname === item.to} 
              />
            </div>
          ))}
        </nav>

        <div className="mt-auto p-8 border-t border-white/5 lg:border-none">
           <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl mb-6 group border border-transparent hover:border-white/10 transition-all">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                 <User size={18} />
              </div>
              <div className="overflow-hidden">
                 <p className="text-[11px] font-black text-white truncate uppercase tracking-widest">{nameTag}</p>
                 <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest">{role === 'admin' ? 'OPERATIVO' : 'RESIDENTE'}</p>
              </div>
           </div>

           <button 
             onClick={async () => {
               const newP = prompt('Defina su NUEVA contraseña (Mínimo 6 caracteres):');
               if (newP && newP.length >= 6) {
                 const res = await changeMyPassword(newP);
                 if (res.success) alert('¡Contraseña actualizada con éxito!');
                 else alert('Error: ' + res.message);
               } else if (newP) {
                 alert('La contraseña debe tener al menos 6 caracteres.');
               }
               closeSidebar();
             }}
             className="w-full mb-3 flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all text-[8px] font-black uppercase tracking-widest border border-white/10 group"
           >
             <Shield className="text-secondary group-hover:scale-110 transition-transform" size={14} />
             CAMBIAR CONTRASEÑA
           </button>

           <button 
             onClick={() => { logout(); closeSidebar(); }}
             className="w-full flex items-center justify-center gap-3 p-4 bg-error/5 hover:bg-error text-error hover:text-white rounded-xl transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-error/5 group"
           >
              <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
              CERRAR SESIÓN
           </button>
        </div>
      </aside>

      {/* Viewport */}
      <main className="flex-1 overflow-y-auto bg-bg-dark relative pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-16">
          {children}
        </div>
        
        {/* Decorative corner blur */}
        <div className="absolute bottom-0 right-0 w-[60vw] md:w-[40vw] h-[60vw] md:h-[40vw] bg-primary/2 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />
      </main>
    </div>
  );
};

/* --- DASHBOARDS --- */

const DashboardAdmin = () => {
  const { users, deleteAccount, register } = useAuth();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  
  // Real stats
  const [stats, setStats] = useState({ packages: 0, bills: 0, freeParking: 0 });

  useEffect(() => {
    // Sync stats from Firestore
    const unsubPkgs = onSnapshot(collection(db, 'packages'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        packages: data.filter(p => (p.estado !== 'Entregado') && p.tipo !== 'Recibo').length,
        bills: data.filter(p => (p.estado !== 'Entregado') && p.tipo === 'Recibo').length
      }));
    });

    const unsubSlots = onSnapshot(collection(db, 'visitor_slots'), (snapshot) => {
      const slots = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        freeParking: slots.filter(s => !s.occupied).length
      }));
    });

    return () => { unsubPkgs(); unsubSlots(); };
  }, []);

  const residentUsers = users ? users.filter(u => u.role !== 'admin') : [];
  
  return (
    <div className="space-y-16">
       <AddHouseModal 
         isOpen={showModal} 
         onClose={() => setShowModal(false)} 
         onAdd={register} 
       />

       <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <span className="text-primary font-black text-[10px] uppercase tracking-[0.5em] mb-3 block">CENTRAL DE OPERACIONES</span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter italic">PORTERÍA</h2>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <PlusCircle size={18} /> ASIGNAR CASA
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <SummaryBox label="Paquetes y Sobres" value={stats.packages} icon={Package} />
          <SummaryBox label="Recibos Pendientes" value={stats.bills} icon={Receipt} />
          <SummaryBox label="Parqueo Visitantes" value={stats.freeParking} icon={Car} />
       </div>

       {/* Managed Accounts */}
       <div className="premium-card p-0 overflow-hidden border-none shadow-[0_0_100px_rgba(0,0,0,0.4)]">
          <header className="bg-bg-sidebar/50 px-10 py-6 flex items-center justify-between border-b border-white/5">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Settings size={18} className="text-primary" /></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Administración de Casas</h3>
             </div>
             <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Total: {residentUsers.length} Unidades</span>
          </header>
          
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-bg-dark/50 text-[9px] font-black uppercase tracking-[0.3em] text-text-muted">
                   <tr>
                      <th className="px-10 py-5">Nombre / Propietario</th>
                      <th className="px-10 py-5">Unidad / Casa</th>
                      <th className="px-10 py-5 text-right">Acción</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {residentUsers.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                         <td className="px-10 py-6 text-xs font-bold text-white flex items-center gap-4">
                            <div className="w-8 h-8 rounded-2xl bg-white/5 flex items-center justify-center text-[11px] font-black text-text-dim border border-white/5 uppercase">
                               {u.username ? u.username[0] : '?'}
                            </div>
                            <span>{u.username || 'Sin nombre'}</span>
                         </td>
                         <td className="px-10 py-6">
                            <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{u.unidadId}</span>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <button 
                              onClick={() => { if(window.confirm('¿Eliminar esta cuenta permanentemente?')) deleteAccount(u.id); }}
                              className="p-3 hover:bg-error/10 text-error/20 hover:text-error rounded-xl transition-all"
                            >
                               <Trash2 size={18} />
                            </button>
                         </td>
                      </tr>
                   ))}
                   {residentUsers.length === 0 && (
                      <tr>
                         <td colSpan="3" className="px-10 py-24 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-30">
                               <Shield size={40} />
                               <p className="text-[10px] font-black uppercase tracking-[0.3em]">No hay unidades residenciales registradas</p>
                            </div>
                         </td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );
};

const DashboardResident = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [porterPhone, setPorterPhone] = useState('+57XXXXXXXXXX');

  useEffect(() => {
    if (!user?.unidadId) return;

    // Sync only pending packages for this unit
    const qPkgs = query(
      collection(db, 'packages'),
      where('unidad', '==', user.unidadId)
    );

    const unsubPkgs = onSnapshot(qPkgs, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      const count = docs.filter(p => (p.estado !== 'Entregado' && p.estado !== 'entregado')).length;
      setPendingCount(count);
    });

    const unsubPorter = onSnapshot(doc(db, 'telefonos', 'porteria'), (docSnap) => {
      if (docSnap.exists()) {
         setPorterPhone(docSnap.data().numero);
      }
    });

    return () => { unsubPkgs(); unsubPorter(); };
  }, [user?.unidadId]);

  return (
    <div className="space-y-20 max-w-5xl mx-auto">
       <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-4">
             <p className="text-primary font-black text-[10px] uppercase tracking-[0.6em]">Cerezal de San Luis</p>
             <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">Bienvenido,<br/><span className="text-primary italic">{user?.username || 'Residente'}</span></h2>
          </div>
          <div className="p-8 bg-bg-card rounded-[3rem] border border-white/5 shadow-2xl min-w-[320px] flex items-center justify-between">
             <div className="space-y-1">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Su Unidad</p>
                <p className="text-4xl font-black text-white tracking-tighter">{user?.unidadId}</p>
             </div>
             <div className="p-5 bg-primary rounded-[2rem] text-white shadow-xl shadow-primary/30"><Home size={32} /></div>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="premium-card p-12 group bg-gradient-to-br from-white/[0.03] to-transparent hover:border-primary/30">
             <div className="flex items-center gap-5 mb-14">
                <div className="p-4 bg-primary/10 rounded-3xl text-primary transition-transform group-hover:scale-110"><Package size={28} /></div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">CORRESPONDENCIA</h3>
             </div>
             <div className="p-10 text-center bg-black/40 rounded-[2.5rem] border border-white/5 border-dashed">
                {pendingCount > 0 ? (
                  <div className="space-y-2">
                     <p className="text-5xl font-black text-white">{pendingCount}</p>
                     <p className="text-[9px] font-black uppercase tracking-widest text-primary">Entregas esperando por usted</p>
                  </div>
                ) : (
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Sin entregas pendientes por recoger</p>
                )}
             </div>
          </div>

          <div className="premium-card p-12 group bg-gradient-to-br from-white/[0.03] to-transparent hover:border-secondary/30">
             <div className="flex items-center gap-5 mb-14">
                <div className="p-4 bg-secondary/10 rounded-3xl text-secondary transition-transform group-hover:scale-110"><Shield size={28} /></div>
                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">CANAL DE ACCESO</h3>
             </div>
             <ul className="space-y-5">
                <li>
                  <a href={`tel:${porterPhone}`} className="w-full p-8 bg-black/40 hover:bg-white/5 border border-white/5 rounded-[2rem] flex items-center justify-between transition-all group/item">
                     <span className="text-xs font-black uppercase tracking-widest text-text-dim group-hover/item:text-white transition-colors">PORTERÍA PRINCIPAL</span>
                     <div className="p-3 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"><Phone size={20} /></div>
                  </a>
                </li>
                <li>
                   <button className="w-full p-8 bg-black/20 opacity-40 rounded-[2rem] flex items-center justify-between border border-transparent">
                      <span className="text-xs font-black uppercase tracking-widest text-text-muted">ADMINISTRACIÓN</span>
                      <ArrowRight size={20} className="text-text-muted" />
                   </button>
                </li>
             </ul>
          </div>
       </div>
    </div>
  );
};

/* --- ACCESS PORTAL --- */

const AccessScreen = () => {
  const { login, setupFirestore } = useAuth();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [regMode, setRegMode] = useState(false);
  const [unity, setUnity] = useState('');
  const [activeTab, setActiveTab] = useState('porteria');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await login(user, pass, activeTab === 'residente' && regMode, unity);
      if (!res.success) setError(res.message);
    } catch (err) {
      setError('Internal system failure.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-8 bg-[#020617] relative selection:bg-primary/30">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-primary/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-secondary/5 rounded-full blur-[200px] pointer-events-none" />

      <div className="mb-8 text-center relative z-10 animate-ready">
         <h1 className="text-2xl md:text-3xl font-black text-white tracking-[0.3em] uppercase italic mb-2">CEREZAL DE SAN LUIS</h1>
         <p className="text-[8px] font-black text-text-muted uppercase tracking-[0.5em] opacity-40">Calle 139 #72-28</p>
         
         <button 
           onClick={(e) => { e.preventDefault(); setupFirestore(); }} 
           className="mt-8 py-2 px-6 border border-white/5 bg-white/5 hover:bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-text-muted transition-all"
         >
           ⚙️ Inicializar Base de Datos (Firebase Cloud)
         </button>
      </div>

      <div className="w-full max-w-[340px] relative z-10 animate-ready [animation-delay:0.2s]">
        <div className="premium-card p-8 bg-bg-sidebar/95 border-t-2 border-primary/50 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] backdrop-blur-3xl">
          <div className="flex justify-center mb-8">
             <div className="segmented-control p-1 w-full max-w-[280px]">
                <button 
                  type="button"
                  onClick={() => { setActiveTab('porteria'); setRegMode(false); }} 
                  className={`segment-btn ${activeTab === 'porteria' ? 'active' : ''} text-[10px] py-3`}
                >INGRESAR</button>
                <button 
                  type="button"
                  onClick={() => { setActiveTab('residente'); setRegMode(true); }} 
                  className={`segment-btn ${activeTab === 'residente' ? 'active' : ''} text-[10px] py-3`}
                >REGISTRAR CASA</button>
             </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {activeTab === 'residente' && regMode && (
               <div className="space-y-2">
                 <p className="text-[8px] font-black text-primary uppercase ml-4 tracking-widest text-center">SELECCIONE SU CASA</p>
                 <select
                    className="premium-input text-center font-black tracking-widest border-primary/30 focus:border-primary bg-bg-sidebar appearance-none cursor-pointer"
                    value={unity}
                    onChange={(e) => setUnity(e.target.value)}
                    required
                 >
                    <option value="">-- ELEGIR UNIDAD --</option>
                    {ALL_HOUSES.filter(h => !useAuth().users.some(u => u.unidadId === h)).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                 </select>
               </div>
            ) || (
               <div className="h-1" /> // Spacer to minimize jump
            )}
            
            <div className="space-y-2">
              <p className="text-[8px] font-black text-text-muted uppercase ml-4 tracking-widest">IDENTIFICADOR</p>
              <input
                type="text"
                className="premium-input text-center placeholder:text-white/10"
                placeholder="USUARIO"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <p className="text-[8px] font-black text-text-muted uppercase ml-4 tracking-widest">CONTRASEÑA</p>
              <input
                type="password"
                className="premium-input text-center"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
              />
            </div>

            {error && (
               <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-center">
                  <p className="text-error text-[10px] font-black uppercase tracking-widest">{error}</p>
               </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full py-6 text-[11px] shadow-2xl shadow-primary/40 relative overflow-hidden group/btn disabled:opacity-50"
            >
              <span className="relative z-10">{loading ? 'AUTENTICANDO...' : regMode ? 'REGISTRAR MI UNIDAD' : 'INGRESAR AL PANEL'}</span>
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
            </button>
          </form>

          {activeTab === 'residente' && (
             <div className="text-center mt-12 border-t border-white/5 pt-8">
                <button onClick={() => { setActiveTab('porteria'); setRegMode(false); }} className="text-[10px] font-black text-text-muted hover:text-primary uppercase tracking-[0.2em] transition-all">
                  ¿Ya tiene una cuenta? ACCEDER
                </button>
             </div>
          )}
        </div>
        
        <p className="text-center mt-12 text-[9px] font-black text-text-muted uppercase tracking-[0.5em] opacity-20">Secure Residencial Access v2.0</p>
      </div>
    </div>
  );
};

/* --- APP BOOTSTRAP --- */

const AppCore = () => {
  const { user, role, loading } = useAuth();
  
  if (loading) return (
     <div className="h-screen w-full flex items-center justify-center bg-[#020617] relative">
        <div className="flex flex-col items-center gap-6 relative z-10">
           <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin" />
           <p className="text-[10px] font-black text-white uppercase tracking-[0.6em] animate-pulse">CEREZAL DE SAN LUIS</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />
     </div>
  );
  
  if (!user) return <AccessScreen />;

  return (
    <Router>
    <LayoutCore>
      <Routes>
        {role === 'admin' ? (
          <>
            <Route path="/admin" element={<DashboardAdmin />} />
            <Route path="/admin/packages" element={<PackageModule />} />
            <Route path="/admin/visitors" element={<VisitorsModule />} />
            <Route path="/admin/phones" element={<PhoneModule />} />
            <Route path="/admin/vehicles" element={<VehicleModule />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        ) : (
          <>
            <Route path="/resident" element={<DashboardResident />} />
            <Route path="/resident/packages" element={<PackageModule />} />
            <Route path="/resident/visitors" element={<VisitorsModule />} />
            <Route path="/resident/phones" element={<PhoneModule />} />
            <Route path="/resident/vehicles" element={<VehicleModule />} />
            <Route path="*" element={<Navigate to="/resident" replace />} />
          </>
        )}
      </Routes>
    </LayoutCore>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppCore />
    </AuthProvider>
  );
}
