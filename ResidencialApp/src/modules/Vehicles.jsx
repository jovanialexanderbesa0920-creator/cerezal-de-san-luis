import React, { useState, useEffect } from 'react';
import { Car, Bike, PlusCircle, LogIn, LogOut, CheckCircle, Info, Map as MapIcon, Edit2, Trash2, Home, Shield, ShieldAlert } from 'lucide-react';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

const ALL_HOUSES = Array.from({ length: 99 }, (_, i) => `CASA ${i + 1}`);

export default function VehicleModule() {
  const { user, role, users } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [visitorSlots, setVisitorSlots] = useState([]);
  const [activeTab, setActiveTab] = useState('privados');
  const [selectedUnit, setSelectedUnit] = useState(role === 'residente' ? user.unidadId : null);
  const [showAddPrivate, setShowAddPrivate] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [privateFormData, setPrivateFormData] = useState({
    placa: '',
    tipo: 'Carro',
    propietario: ''
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
    // Sync Private Vehicles
    const qVehicles = query(collection(db, 'vehicles'));
    const unsubVehicles = onSnapshot(qVehicles, (snapshot) => {
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Sync Visitor Slots
    const qSlots = query(collection(db, 'visitor_slots'));
    const unsubSlots = onSnapshot(qSlots, (snapshot) => {
      const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by slot ID
      setVisitorSlots(slots.sort((a, b) => parseInt(a.id) - parseInt(b.id)));
    });

    return () => { unsubVehicles(); unsubSlots(); };
  }, []);

  useEffect(() => {
    if (showAddPrivate && !editId && selectedUnit) {
      setPrivateFormData(prev => ({ ...prev, propietario: selectedUnit }));
    }
  }, [showAddPrivate, editId, selectedUnit]);

  const currentPrivateVehicles = vehicles.filter(v => v.unidadId === selectedUnit);
  const availableVisitorSlotsCount = visitorSlots.filter(s => !s.occupied).length;

  const handleAddPrivate = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDoc(doc(db, 'vehicles', editId), { ...privateFormData });
        setEditId(null);
      } else {
        if (currentPrivateVehicles.length >= 2 && role === 'residente') {
          alert('Máximo 2 vehículos privados por unidad');
          return;
        }
        await addDoc(collection(db, 'vehicles'), {
          ...privateFormData,
          unidadId: selectedUnit,
          estado: 'Fuera'
        });
      }
      setShowAddPrivate(false);
      setPrivateFormData({ placa: '', tipo: 'Carro', propietario: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPrivate = (v) => {
    setPrivateFormData({ placa: v.placa, tipo: v.tipo, propietario: v.propietario });
    setEditId(v.id);
    setShowAddPrivate(true);
  };

  const handleDeletePrivate = async (id) => {
    if (window.confirm('¿Eliminar este vehículo?')) {
      try {
          await deleteDoc(doc(db, 'vehicles', id));
      } catch (err) {
          console.error(err);
      }
    }
  };

  const togglePrivateStatus = async (vId, currentStatus) => {
    try {
        await updateDoc(doc(db, 'vehicles', vId), {
            estado: currentStatus === 'Dentro' ? 'Fuera' : 'Dentro'
        });
    } catch (err) {
        console.error(err);
    }
  };

  const occupyVisitorSlot = async (slotId, data) => {
    try {
        console.log('Occupying slot:', slotId, data);
        const sId = String(slotId);
        await updateDoc(doc(db, 'visitor_slots', sId), {
            occupied: true,
            plate: String(data.plate).toUpperCase(),
            unit: data.unit,
            entry: new Date().toISOString()
        });
        alert('Espacio ocupado exitosamente');
    } catch (err) {
        console.error('Error occupying slot:', err);
        alert('Error al ocupar espacio: ' + err.message);
    }
  };

  const freeVisitorSlot = async (slotId) => {
    try {
        const sId = String(slotId);
        await updateDoc(doc(db, 'visitor_slots', sId) , {
            occupied: false,
            plate: '',
            unit: '',
            type: 'Carro',
            entry: null
        });
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="space-y-10 animate-ready">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Control Vehicular</h2>
          <p className="text-text-dim text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Parqueaderos Cerezal de San Luis</p>
        </div>
        
        <div className="segmented-control p-1">
          <button 
            onClick={() => setActiveTab('privados')}
            className={`segment-btn ${activeTab === 'privados' ? 'active' : ''}`}
          >Privados</button>
          <button 
            onClick={() => setActiveTab('visitantes')}
            className={`segment-btn ${activeTab === 'visitantes' ? 'active' : ''}`}
          >Visitantes</button>
        </div>
      </div>

      {activeTab === 'privados' ? (
        <div className="space-y-8">
          {role === 'admin' && !selectedUnit && (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {registeredUnits.map(unit => {
                  const unitVehicles = vehicles.filter(v => v.unidadId === unit);
                  return (
                    <button 
                      key={unit}
                      onClick={() => setSelectedUnit(unit)}
                      className="premium-card p-8 flex flex-col items-center gap-4 hover:border-primary/50 hover:bg-white/5 transition-all text-center group"
                    >
                       <Home className="text-text-muted group-hover:text-primary transition-colors" size={24} />
                       <span className="font-black text-xs uppercase tracking-widest text-white">{unit}</span>
                    </button>
                  );
                })}
                {registeredUnits.length === 0 && (
                  <div className="col-span-full py-20 text-center premium-card border-dashed opacity-40">
                    <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">No hay unidades registradas</p>
                  </div>
                )}
             </div>
          )}

          {selectedUnit && (
             <div className="space-y-8">
                <div className="flex items-center justify-between">
                   <button onClick={() => role === 'admin' ? setSelectedUnit(null) : null} className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-all">
                     {role === 'admin' ? '← Volver a Unidades' : `Unidad: ${selectedUnit}`}
                   </button>
                   {currentPrivateVehicles.length < 2 && (
                      <button onClick={() => setShowAddPrivate(!showAddPrivate)} className="btn-primary text-[9px] px-6">
                        {showAddPrivate ? 'Cerrar' : '+ Vehículo'}
                      </button>
                   )}
                </div>

                {showAddPrivate && (
                   <form onSubmit={handleAddPrivate} className="premium-card p-10 bg-white/5 border-t-2 border-primary/40 animate-in slide-in-from-top-4 duration-300">
                      <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-8">Información del Vehículo</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <input
                          type="text"
                          placeholder="PLACA"
                          className="premium-input text-center font-black tracking-widest uppercase"
                          value={privateFormData.placa}
                          onChange={(e) => setPrivateFormData({ ...privateFormData, placa: e.target.value.toUpperCase() })}
                          required
                        />
                        <select
                          className="premium-input text-center font-black uppercase"
                          value={privateFormData.tipo}
                          onChange={(e) => setPrivateFormData({ ...privateFormData, tipo: e.target.value })}
                        >
                          <option>Carro</option>
                          <option>Moto</option>
                        </select>
                        <input
                          type="text"
                          placeholder="PROPIETARIO"
                          className="premium-input text-center uppercase font-black cursor-default opacity-70"
                          value={privateFormData.propietario}
                          readOnly
                        />
                      </div>
                      <div className="flex justify-end gap-3 mt-10">
                        <button type="button" onClick={() => { setShowAddPrivate(false); setEditId(null); }} className="segment-btn px-6 text-[9px]">Cancelar</button>
                        <button type="submit" className="btn-primary px-10 text-[9px]">{editId ? 'Guardar' : 'Registrar'}</button>
                      </div>
                   </form>
                )}

                <div className="module-grid">
                   {currentPrivateVehicles.map((v) => (
                      <div key={v.id} className="premium-card p-10 group relative border-t-2 border-primary/10">
                         <div className="flex justify-between items-start mb-8">
                            <div className={`p-4 rounded-3xl ${v.estado === 'Dentro' ? 'bg-success/5 text-success' : 'bg-white/5 text-text-muted'}`}>
                               {v.tipo === 'Moto' ? <Bike size={32} /> : <Car size={32} />}
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => handleEditPrivate(v)} className="p-2 hover:bg-white/10 rounded-xl text-text-muted hover:text-white transition-all"><Edit2 size={16} /></button>
                               <button onClick={() => handleDeletePrivate(v.id)} className="p-2 hover:bg-error/10 rounded-xl text-error/30 hover:text-error transition-all"><Trash2 size={16} /></button>
                            </div>
                         </div>
                         <div className="mb-8">
                             <div className="flex items-center gap-3 mb-1">
                                <span className="text-4xl font-black text-white tracking-widest">{v.placa}</span>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${v.estado === 'Dentro' ? 'bg-success/20 text-success' : 'bg-white/10 text-text-muted'}`}>
                                   {v.estado}
                                </span>
                             </div>
                             <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{v.propietario}</p>
                         </div>
                         
                         {role === 'admin' && (
                            <button 
                              onClick={() => togglePrivateStatus(v.id, v.estado)}
                              className={`w-full py-5 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${v.estado === 'Dentro' ? 'bg-error/5 text-error hover:bg-error hover:text-white' : 'bg-primary/5 text-primary hover:bg-primary hover:text-white'}`}
                            >
                               {v.estado === 'Dentro' ? <LogOut size={16} /> : <LogIn size={16} />}
                               {v.estado === 'Dentro' ? 'Marcar Salida' : 'Marcar Entrada'}
                            </button>
                         )}
                      </div>
                   ))}
                </div>
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-12">
           <div className="premium-card p-10 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary">
              <div>
                 <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] mb-4">Disponibilidad Actual</p>
                 <div className="flex items-baseline gap-3">
                    <span className="text-7xl font-black text-white">{availableVisitorSlotsCount}</span>
                    <span className="text-primary text-xl font-black">/ {visitorSlots.length} Cupos</span>
                 </div>
              </div>
              <MapIcon className="text-primary/20" size={100} />
           </div>

           <div className="parking-grid">
              {visitorSlots.map((slot) => (
                <VisitorParkingSlot 
                  key={slot.id} 
                  slot={slot} 
                  onOccupy={(data) => occupyVisitorSlot(slot.id, data)}
                  onFree={() => freeVisitorSlot(slot.id)}
                  isAdmin={role === 'admin'}
                  registeredUnits={registeredUnits}
                />
              ))}
           </div>
        </div>
      )}
    </div>
  );
}

function VisitorParkingSlot({ slot, onOccupy, onFree, isAdmin, registeredUnits }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [data, setData] = useState({ plate: '', unit: '' });

  const isOwnVisitor = user?.unidadId === slot.unit;

  if (slot.occupied) {
    const entryDate = slot.entry ? new Date(slot.entry) : null;
    const dateFormatted = entryDate ? entryDate.toLocaleDateString([], { day: '2-digit', month: 'short' }) : '-';
    const timeFormatted = entryDate ? entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

    return (
      <div className="premium-card p-8 border-t-2 border-error/50 flex flex-col justify-between h-72 group relative overflow-hidden bg-gradient-to-b from-error/5 to-transparent">
        <div className="absolute top-4 right-4 text-error opacity-40"><ShieldAlert size={16} /></div>
        <div>
           <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-6 italic">ESPACIO #{slot.id}</p>
           {(isAdmin || isOwnVisitor) ? (
             <>
               <h4 className="text-4xl font-black text-white tracking-widest mb-1 uppercase">{slot.plate}</h4>
               <p className="text-[10px] font-black text-primary uppercase tracking-widest">Unidad: {slot.unit} {isOwnVisitor && '(TU VISITA)'}</p>
             </>
           ) : (
             <h4 className="text-3xl font-black text-error uppercase tracking-[0.2em] animate-pulse">Ocupado</h4>
           )}
        </div>
        <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-4">
           {(isAdmin || isOwnVisitor) && (
             <div className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 shadow-inner">
                <div className="space-y-1">
                   <p className="text-[7px] font-black text-text-dim uppercase tracking-widest opacity-50">ENTRADA</p>
                   <p className="text-[10px] font-black text-white uppercase tracking-widest">{dateFormatted} | {timeFormatted}</p>
                </div>
                {isAdmin && (
                  <button onClick={onFree} className="px-6 py-2 bg-error text-white transition-all text-[8px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-error/20 hover:scale-105 active:scale-95">
                     LIBERAR
                  </button>
                )}
             </div>
           )}
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); onOccupy(data); setShowForm(false); }} className="premium-card p-8 h-72 border-t-2 border-primary/50 animate-in zoom-in-95 duration-200 flex flex-col justify-between">
        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-4">OCUPAR ESPACIO #{slot.id}</p>
        <div className="space-y-4">
          <input autoFocus className="premium-input text-center text-xl font-black uppercase tracking-widest h-20" placeholder="PLACA" value={data.plate} onChange={e => setData({...data, plate: e.target.value.toUpperCase()})} required maxLength={7} />
          
          <select 
            className="premium-input text-center text-[10px] uppercase font-black bg-bg-dark border-primary/20 appearance-none w-full h-16" 
            value={data.unit} 
            onChange={e => setData({...data, unit: e.target.value})} 
            required
          >
            <option value="">-- SELECCIONE UNIDAD DESTINO --</option>
            {registeredUnits.map(u => (
               <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 pt-4">
           <button type="submit" className="btn-primary flex-1 text-[9px]">OCUPAR</button>
           <button type="button" onClick={() => setShowForm(false)} className="segment-btn px-4 text-[9px]">X</button>
        </div>
      </form>
    );
  }

  return (
    <div 
      onClick={() => isAdmin && setShowForm(true)}
      className={`premium-card h-72 flex flex-col items-center justify-center p-8 gap-6 border-2 border-dashed border-white/5 bg-transparent hover:bg-primary/5 transition-all text-center group ${isAdmin ? 'cursor-pointer hover:border-primary/40' : 'opacity-40'}`}
    >
       <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center text-text-muted group-hover:text-primary group-hover:scale-110 transition-all">
          <PlusCircle size={40} />
       </div>
       <div>
          <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-1">ESPACIO #{slot.id}</p>
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">DISPONIBLE</p>
       </div>
    </div>
  );
}
