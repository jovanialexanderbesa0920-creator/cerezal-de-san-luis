import React, { useState, useEffect } from 'react';
import { Package, Receipt, Mail, CheckCircle, Trash2, Edit2, RotateCcw, ChevronDown, ChevronRight, Home } from 'lucide-react';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';

/* ─── helpers ─── */
const getPkgIcon = (type) => {
  switch (type) {
    case 'Recibo': return <Receipt size={16} />;
    case 'Sobre':  return <Mail size={16} />;
    default:       return <Package size={16} />;
  }
};

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

/* ─── House accordion row (admin Tab 1) ─── */
const HouseAccordion = ({ house, items, onDeliver, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="premium-card p-0 overflow-hidden border border-white/5">
      {/* ── Header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/[0.04] transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all border ${
            open ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-white/30'
          }`}>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </div>
          <div className="flex items-center gap-3">
            <Home size={14} className="text-text-muted" />
            <span className="text-sm font-black text-white uppercase tracking-widest">{house}</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
            {items.length} {items.length === 1 ? 'pendiente' : 'pendientes'}
          </span>
        </div>
        <div className="flex gap-1">
          {items.map(p => (
            <span key={p.id} className="w-2 h-2 rounded-full bg-primary/60" title={p.descripcion} />
          ))}
        </div>
      </button>

      {/* ── Checklist ── */}
      {open && (
        <div className="border-t border-white/5 divide-y divide-white/5 animate-in slide-in-from-top-2 duration-200">
          {items.map(p => (
            <div key={p.id} className="flex items-center gap-5 px-8 py-4 hover:bg-white/[0.03] transition-colors group/item">
              
              {/* Checkbox-style deliver button */}
              <button
                onClick={() => onDeliver(p.id)}
                title="Marcar como entregado"
                className="w-6 h-6 rounded-lg border-2 border-white/20 hover:border-success hover:bg-success/20 flex items-center justify-center transition-all flex-shrink-0 group/cb"
              >
                <CheckCircle size={13} className="text-success opacity-0 group-hover/cb:opacity-100 transition-opacity" />
              </button>

              {/* Package type icon */}
              <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                {getPkgIcon(p.tipo)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white uppercase tracking-widest truncate">{p.descripcion}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/5">
                    {p.tipo}
                  </span>
                  <span className="text-[9px] text-text-muted font-bold">Llegó: {fmtDate(p.llegada)}</span>
                </div>
                {p.observaciones && (
                  <p className="text-[9px] italic text-text-muted opacity-40 mt-1 truncate">"{p.observaciones}"</p>
                )}
              </div>

              {/* Edit / Delete (appear on row hover) */}
              <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onEdit(p)}
                  title="Editar"
                  className="p-2 bg-white/5 hover:bg-white/10 text-white/30 hover:text-white rounded-xl transition-all border border-white/5"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  title="Eliminar"
                  className="p-2 bg-error/10 hover:bg-error text-error/40 hover:text-white rounded-xl transition-all border border-error/20"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Delivered house accordion (admin Tab 2) ─── */
const DeliveredHouseAccordion = ({ house, items, onReset, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="premium-card p-0 overflow-hidden border border-white/5">
      {/* ── Header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/[0.04] transition-colors group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all border ${
            open ? 'bg-success/20 border-success/40 text-success' : 'bg-white/5 border-white/10 text-white/30'
          }`}>
            {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </div>
          <div className="flex items-center gap-3">
            <Home size={14} className="text-text-muted" />
            <span className="text-sm font-black text-white uppercase tracking-widest">{house}</span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-success/10 text-success rounded-full border border-success/20">
            {items.length} {items.length === 1 ? 'entregado' : 'entregados'}
          </span>
        </div>
        <div className="flex gap-1">
          {items.map(p => (
            <span key={p.id} className="w-2 h-2 rounded-full bg-success/60" title={p.descripcion} />
          ))}
        </div>
      </button>

      {/* ── Rows ── */}
      {open && (
        <div className="border-t border-white/5 divide-y divide-white/5 animate-in slide-in-from-top-2 duration-200">
          {items.map(p => (
            <div key={p.id} className="flex items-center gap-5 px-8 py-4 hover:bg-white/[0.03] transition-colors group/item">
              {/* Check icon */}
              <div className="w-6 h-6 rounded-lg bg-success/20 border-2 border-success flex items-center justify-center flex-shrink-0">
                <CheckCircle size={13} className="text-success" />
              </div>
              {/* Package type icon */}
              <div className="p-2 rounded-xl bg-success/10 text-success/60 flex-shrink-0">
                {getPkgIcon(p.tipo)}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-white/60 uppercase tracking-widest truncate line-through decoration-success/40">{p.descripcion}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[8px] text-text-muted font-bold">Llegó: {fmtDate(p.llegada)}</span>
                  <span className="text-[8px] text-success font-bold">✓ Entregado: {fmtDate(p.entrega)}</span>
                </div>
              </div>
              {/* Revert / Delete (appear on hover) */}
              <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onReset(p.id)}
                  title="Revertir a pendiente"
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-text-dim hover:text-white rounded-xl transition-all text-[8px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5"
                >
                  <RotateCcw size={12} /> Revertir
                </button>
                <button
                  onClick={() => onDelete(p.id)}
                  title="Eliminar"
                  className="p-2 bg-error/10 hover:bg-error text-error/40 hover:text-white rounded-xl transition-all border border-error/20"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Resident card ─── */
const ResidentCard = ({ pkg: p }) => (
  <div className={`premium-card p-8 flex flex-col gap-5 border-t-2 ${p.estado === 'Entregado' ? 'border-success/20 opacity-60' : 'border-primary/50 bg-[#0F172A]'}`}>
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl ${p.estado === 'Entregado' ? 'bg-success/10 text-success/50' : 'bg-primary/10 text-primary'}`}>
        {p.tipo === 'Recibo' ? <Receipt size={22} /> : p.tipo === 'Sobre' ? <Mail size={22} /> : <Package size={22} />}
      </div>
      <span className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${p.estado === 'Entregado' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
        {p.tipo}
      </span>
    </div>
    <div>
      <p className="text-sm font-black text-white uppercase tracking-widest">{p.descripcion}</p>
      {p.observaciones && (
        <p className="text-[9px] italic text-text-muted opacity-50 mt-2">"{p.observaciones}"</p>
      )}
    </div>
    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Llegó: {fmtDate(p.llegada)}</p>
      {p.entrega && (
        <p className="text-[9px] font-bold text-success uppercase tracking-widest">✓ {fmtDate(p.entrega)}</p>
      )}
    </div>
  </div>
);

/* ════════════════════════════════════════
   MAIN MODULE
═══════════════════════════════════════ */
export default function PackageModule() {
  const { user, role, users } = useAuth();
  const [packages, setPackages]   = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'delivered'
  const [showAdd, setShowAdd]     = useState(false);
  const [editId, setEditId]       = useState(null);
  const [formData, setFormData]   = useState({ unidad: '', tipo: 'Paquete', descripcion: '', observaciones: '' });

  const registeredUnits = users.filter(u => u.role === 'residente').map(u => u.unidadId);

  /* ── Firestore listener ── */
  useEffect(() => {
    const q = role === 'admin'
      ? query(collection(db, 'packages'), orderBy('llegada', 'desc'))
      : query(collection(db, 'packages'), where('unidad', '==', user.unidadId), orderBy('llegada', 'desc'));

    const unsub = onSnapshot(q, snap => {
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [role, user.unidadId]);

  /* ── CRUD ── */
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDoc(doc(db, 'packages', editId), { ...formData });
        setEditId(null);
      } else {
        await addDoc(collection(db, 'packages'), {
          ...formData,
          llegada: new Date().toISOString(),
          estado: 'En portería',
          entrega: null
        });
      }
      setShowAdd(false);
      setFormData({ unidad: '', tipo: 'Paquete', descripcion: '', observaciones: '' });
    } catch (err) { console.error(err); }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setFormData({ unidad: p.unidad, tipo: p.tipo, descripcion: p.descripcion, observaciones: p.observaciones || '' });
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro permanentemente?')) return;
    try { await deleteDoc(doc(db, 'packages', id)); } catch (err) { console.error(err); }
  };

  const handleDeliver = async (pkId) => {
    try {
      await updateDoc(doc(db, 'packages', pkId), {
        estado: 'Entregado',
        entrega: new Date().toISOString()
      });
      setActiveTab('delivered'); // jump user to the delivered tab
    } catch (err) { console.error(err); }
  };

  const handleReset = async (pkId) => {
    try {
      await updateDoc(doc(db, 'packages', pkId), { estado: 'En portería', entrega: null });
      setActiveTab('pending');
    } catch (err) { console.error(err); }
  };

  /* ── Derived lists ── */
  const pending   = packages.filter(p => p.estado !== 'Entregado');
  const delivered = packages.filter(p => p.estado === 'Entregado');

  // Group pending by house for admin accordion
  const pendingByHouse = pending.reduce((acc, p) => {
    if (!acc[p.unidad]) acc[p.unidad] = [];
    acc[p.unidad].push(p);
    return acc;
  }, {});
  const housesSorted = Object.keys(pendingByHouse).sort((a, b) =>
    a.localeCompare(b, 'es', { numeric: true })
  );

  // Group delivered by house for admin accordion
  const deliveredByHouse = delivered.reduce((acc, p) => {
    if (!acc[p.unidad]) acc[p.unidad] = [];
    acc[p.unidad].push(p);
    return acc;
  }, {});
  const deliveredHousesSorted = Object.keys(deliveredByHouse).sort((a, b) =>
    a.localeCompare(b, 'es', { numeric: true })
  );

  /* ══════════ RENDER ══════════ */
  return (
    <div className="space-y-10 animate-ready">

      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Paquetes</h2>
          <p className="text-text-dim text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">Control Cerezal de San Luis</p>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => { setShowAdd(v => !v); if (showAdd) setEditId(null); }}
            className="btn-primary text-[9px] px-8"
          >
            {showAdd ? 'Cerrar Panel' : '+ Registrar Entrega'}
          </button>
        )}
      </div>

      {/* ── Add / Edit form ── */}
      {showAdd && role === 'admin' && (
        <form onSubmit={handleAdd} className="premium-card p-10 bg-white/5 border-t-2 border-primary/50 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-widest mb-10">
            {editId ? 'Editando Paquete' : 'Nueva Recepción de Paquete'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <select className="premium-input text-xs uppercase" value={formData.unidad} onChange={e => setFormData({ ...formData, unidad: e.target.value })} required>
              <option value="">Seleccionar Unidad...</option>
              {registeredUnits.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select className="premium-input text-xs uppercase font-black" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
              <option>Paquete</option>
              <option>Recibo</option>
              <option>Sobre</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="DESCRIPCIÓN (E.g. Amazon, MercadoLibre)"
            className="premium-input text-xs uppercase mb-6"
            value={formData.descripcion}
            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
            required
          />
          <textarea
            placeholder="OBSERVACIONES ADICIONALES"
            className="premium-input text-xs uppercase min-h-[120px]"
            value={formData.observaciones}
            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
          />
          <div className="flex justify-end gap-3 mt-10">
            <button type="button" onClick={() => { setShowAdd(false); setEditId(null); }} className="segment-btn px-6 text-[9px]">Cancelar</button>
            <button type="submit" className="btn-primary px-10 text-[9px]">
              {editId ? 'Guardar Cambios' : 'Registrar en Sistema'}
            </button>
          </div>
        </form>
      )}

      {/* ── TABS ── */}
      <div className="flex items-center gap-1 p-1.5 bg-black/30 rounded-2xl w-fit border border-white/5 backdrop-blur-sm">
        {/* Tab: En Portería */}
        <button
          onClick={() => setActiveTab('pending')}
          className={`relative px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${
            activeTab === 'pending'
              ? 'bg-primary text-white shadow-lg shadow-primary/30'
              : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Package size={14} />
          En Portería
          {pending.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
              activeTab === 'pending' ? 'bg-white/25 text-white' : 'bg-white/10 text-text-muted'
            }`}>
              {pending.length}
            </span>
          )}
        </button>

        {/* Tab: Entregados */}
        <button
          onClick={() => setActiveTab('delivered')}
          className={`relative px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${
            activeTab === 'delivered'
              ? 'bg-[#16a34a] text-white shadow-lg shadow-green-900/40'
              : 'text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <CheckCircle size={14} />
          Entregados
          {delivered.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
              activeTab === 'delivered' ? 'bg-white/25 text-white' : 'bg-white/10 text-text-muted'
            }`}>
              {delivered.length}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════
          TAB 1 — EN PORTERÍA
      ══════════════════════════════════════ */}
      {activeTab === 'pending' && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {pending.length === 0 ? (
            <div className="py-24 text-center premium-card border-dashed opacity-30 flex flex-col items-center gap-4">
              <Package size={36} className="opacity-40" />
              <p className="text-[10px] font-black uppercase tracking-widest">Sin paquetes en portería</p>
            </div>
          ) : role === 'admin' ? (
            /* Admin: accordion grouped by house */
            housesSorted.map(house => (
              <HouseAccordion
                key={house}
                house={house}
                items={pendingByHouse[house]}
                onDeliver={handleDeliver}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            /* Resident: card grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pending.map(p => <ResidentCard key={p.id} pkg={p} />)}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB 2 — ENTREGADOS
      ══════════════════════════════════════ */}
      {activeTab === 'delivered' && (
        <div className="animate-in fade-in duration-300">
          {delivered.length === 0 ? (
            <div className="py-24 text-center premium-card border-dashed opacity-30 flex flex-col items-center gap-4">
              <CheckCircle size={36} className="opacity-40" />
              <p className="text-[10px] font-black uppercase tracking-widest">No hay entregas registradas aún</p>
            </div>
          ) : role === 'admin' ? (
            /* Admin: accordion grouped by house */
            <div className="space-y-3">
              {deliveredHousesSorted.map(house => (
                <DeliveredHouseAccordion
                  key={house}
                  house={house}
                  items={deliveredByHouse[house]}
                  onReset={handleReset}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            /* Resident: card grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {delivered.map(p => <ResidentCard key={p.id} pkg={p} />)}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
