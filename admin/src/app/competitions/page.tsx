'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:3001';

interface Competition {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  _count?: { tournaments: number; phases: number; teams: number };
}

export default function CompetitionsPage() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const res = await fetch(`${API_URL}/competitions`);
      const data = await res.json();
      setCompetitions(data);
    } catch (e) {
      console.error('Failed to fetch competitions', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/competitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setNewName('');
      setShowCreate(false);
      fetchCompetitions();
    } catch (e) {
      alert('Error creating competition');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que querés eliminar esta competencia?')) return;
    try {
      await fetch(`${API_URL}/competitions/${id}`, { method: 'DELETE' });
      fetchCompetitions();
    } catch (e) {
      alert('Error deleting competition');
    }
  };

  const toggleActive = async (comp: Competition) => {
    try {
      await fetch(`${API_URL}/competitions/${comp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !comp.active }),
      });
      fetchCompetitions();
    } catch (e) {
      alert('Error updating competition');
    }
  };

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Competiciones Oficiales</h1>
          <p className="text-slate-500">Creá y administrá las competencias oficiales (ej: Mundial 2026)</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          + Nueva Competencia
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Crear Competencia Oficial</h2>
            <input
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Mundial FIFA 2026"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowCreate(false); setNewName(''); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Competitions list */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Cargando...</div>
      ) : competitions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🏟️</p>
          <p className="text-xl font-bold text-slate-700">No hay competencias aún</p>
          <p className="text-slate-400">Creá una nueva competencia para empezar</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {competitions.map(comp => (
            <div
              key={comp.id}
              className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/competitions/${comp.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${comp.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                <div>
                  <h3 className="text-lg font-bold">{comp.name}</h3>
                  <p className="text-sm text-slate-400">
                    Creada: {new Date(comp.createdAt).toLocaleDateString('es-AR')}
                    {comp.active ? ' • Activa' : ' • Inactiva'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(comp)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    comp.active
                      ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                      : 'border-green-300 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {comp.active ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDelete(comp.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
