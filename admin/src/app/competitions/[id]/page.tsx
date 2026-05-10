'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API = 'http://localhost:3001';

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [comp, setComp] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [tab, setTab] = useState<'equipos' | 'fases' | 'partidos' | 'premios'>('equipos');
  const [loading, setLoading] = useState(true);

  // Forms
  const [newTeamName, setNewTeamName] = useState('');
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseOrder, setNewPhaseOrder] = useState('1');
  const [newPhaseOpen, setNewPhaseOpen] = useState('');
  const [newPhaseClose, setNewPhaseClose] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedPhaseForGroup, setSelectedPhaseForGroup] = useState('');
  const [matchForm, setMatchForm] = useState({ phaseId: '', groupId: '', homeTeamId: '', awayTeamId: '', matchDate: '' });
  const [resultForm, setResultForm] = useState<any>({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [compRes, teamsRes] = await Promise.all([
        fetch(`${API}/competitions/${id}`).then(r => r.json()),
        fetch(`${API}/teams`).then(r => r.json()).catch(() => []),
      ]);
      setComp(compRes);
      setAllTeams(teamsRes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── TEAMS ──────────────────────────────────────
  const addTeam = async () => {
    if (!newTeamName.trim()) return;
    // Create global team first
    const teamRes = await fetch(`${API}/teams`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTeamName.trim() }),
    });
    const team = await teamRes.json();
    // Link to competition
    await fetch(`${API}/competitions/${id}/teams`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: team.id }),
    });
    setNewTeamName('');
    fetchAll();
  };

  const linkExistingTeam = async (teamId: string) => {
    await fetch(`${API}/competitions/${id}/teams`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId }),
    });
    fetchAll();
  };

  const removeTeam = async (ctId: string) => {
    await fetch(`${API}/competitions/${id}/teams/${ctId}`, { method: 'DELETE' });
    fetchAll();
  };

  const assignTeamToGroup = async (ctId: string, groupId: string) => {
    await fetch(`${API}/competitions/${id}/teams/${ctId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: groupId || null }),
    });
    fetchAll();
  };

  // ── PHASES ──────────────────────────────────────
  const addPhase = async () => {
    if (!newPhaseName.trim()) return;
    await fetch(`${API}/competitions/${id}/phases`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newPhaseName.trim(),
        order: parseInt(newPhaseOrder) || 1,
        openDate: newPhaseOpen || new Date().toISOString(),
        closeDate: newPhaseClose || new Date().toISOString(),
      }),
    });
    setNewPhaseName(''); setNewPhaseOrder(String((comp?.phases?.length || 0) + 2));
    fetchAll();
  };

  const removePhase = async (phaseId: string) => {
    if (!confirm('¿Eliminar esta fase y todos sus partidos?')) return;
    await fetch(`${API}/competitions/${id}/phases/${phaseId}`, { method: 'DELETE' });
    fetchAll();
  };

  // ── GROUPS ──────────────────────────────────────
  const addGroup = async () => {
    if (!newGroupName.trim() || !selectedPhaseForGroup) return;
    await fetch(`${API}/competitions/${id}/phases/${selectedPhaseForGroup}/groups`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    setNewGroupName('');
    fetchAll();
  };

  const updateGroupResult = async (groupId: string, data: any) => {
    await fetch(`${API}/competitions/groups/${groupId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    fetchAll();
  };

  // ── MATCHES ──────────────────────────────────────
  const addMatch = async () => {
    const { phaseId, homeTeamId, awayTeamId, matchDate, groupId } = matchForm;
    if (!phaseId || !homeTeamId || !awayTeamId || !matchDate) return alert('Completá todos los campos');
    await fetch(`${API}/matches`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phaseId, homeTeamId, awayTeamId, matchDate, groupId: groupId || undefined }),
    });
    setMatchForm({ phaseId: '', groupId: '', homeTeamId: '', awayTeamId: '', matchDate: '' });
    fetchAll();
  };

  const saveResult = async (matchId: string) => {
    const r = resultForm[matchId];
    if (!r) return;
    await fetch(`${API}/matches/${matchId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        homeScore90: parseInt(r.h90) || 0,
        awayScore90: parseInt(r.a90) || 0,
        homeScore120: r.h120 !== '' ? parseInt(r.h120) : undefined,
        awayScore120: r.a120 !== '' ? parseInt(r.a120) : undefined,
        status: 'FINISHED',
      }),
    });
    fetchAll();
  };

  if (loading) return <div className="p-10 text-slate-400">Cargando...</div>;
  if (!comp) return <div className="p-10 text-red-500">Competencia no encontrada</div>;

  const compTeams = comp.teams || [];
  const phases = (comp.phases || []).sort((a: any, b: any) => a.order - b.order);
  const allGroups = phases.flatMap((p: any) => (p.groups || []).map((g: any) => ({ ...g, phaseName: p.name })));
  const allMatches = phases.flatMap((p: any) => (p.matches || []).map((m: any) => ({ ...m, phaseName: p.name })));

  // Teams not yet in this competition
  const linkedTeamIds = compTeams.map((ct: any) => ct.teamId);
  const unlinkedTeams = allTeams.filter((t: any) => !linkedTeamIds.includes(t.id));

  const tabs = [
    { key: 'equipos', label: '⚽ Equipos', count: compTeams.length },
    { key: 'fases', label: '📅 Fases y Grupos', count: phases.length },
    { key: 'partidos', label: '🏟️ Partidos', count: allMatches.length },
    { key: 'premios', label: '🏆 Premios', count: 0 },
  ];

  return (
    <div className="p-10">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => router.push('/competitions')} className="text-slate-400 hover:text-slate-700 text-2xl">←</button>
        <h1 className="text-3xl font-bold">{comp.name}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${comp.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {comp.active ? 'ACTIVA' : 'INACTIVA'}
        </span>
      </div>
      <p className="text-slate-400 mb-8 ml-10">Configurá los equipos, fases, grupos y partidos de esta competencia</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-5 py-3 font-bold text-sm rounded-t-lg transition-colors ${tab === t.key ? 'bg-white border border-b-0 border-slate-200 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.label} <span className="ml-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── EQUIPOS ── */}
      {tab === 'equipos' && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="font-bold mb-4">Agregar Equipo Nuevo</h3>
            <div className="flex gap-3 mb-3">
              <input className="flex-1 border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nombre del equipo (ej: Argentina)" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTeam()} />
              <button onClick={addTeam} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Agregar</button>
            </div>

            {unlinkedTeams.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-400 mb-2">O agregar equipo existente:</p>
                <div className="flex flex-wrap gap-2">
                  {unlinkedTeams.slice(0, 20).map((t: any) => (
                    <button key={t.id} onClick={() => linkExistingTeam(t.id)} className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-lg text-sm transition-colors flex items-center gap-1.5">
                      {t.flagUrl && <img src={t.flagUrl} className="w-5 h-3.5 object-cover rounded-sm" />}
                      + {t.name}
                    </button>
                  ))}
                  {unlinkedTeams.length > 20 && <span className="text-slate-400 text-sm self-center">...y {unlinkedTeams.length - 20} más</span>}
                </div>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-400 mb-3">{compTeams.length} equipos en esta competencia</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {compTeams.map((ct: any) => (
              <div key={ct.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  {ct.team?.flagUrl ? (
                    <img src={ct.team.flagUrl} alt={ct.team.name} className="w-10 h-7 object-cover rounded shadow-sm border border-slate-200" />
                  ) : (
                    <span className="text-2xl">🏳️</span>
                  )}
                  <div>
                    <span className="font-bold">{ct.team?.name || ct.teamId}</span>
                    {ct.group && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{ct.group.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs"
                    value={ct.groupId || ''}
                    onChange={e => assignTeamToGroup(ct.id, e.target.value)}
                  >
                    <option value="">Sin grupo</option>
                    {allGroups.map((g: any) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                  <button onClick={() => removeTeam(ct.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FASES Y GRUPOS ── */}
      {tab === 'fases' && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="font-bold mb-4">Nueva Fase</h3>
            <div className="grid grid-cols-4 gap-3">
              <input className="border border-slate-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre (ej: Fase de Grupos)" value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} />
              <input className="border border-slate-300 rounded-lg px-4 py-2 outline-none" type="number" placeholder="Orden" value={newPhaseOrder} onChange={e => setNewPhaseOrder(e.target.value)} />
              <input className="border border-slate-300 rounded-lg px-4 py-2 outline-none" type="datetime-local" value={newPhaseOpen} onChange={e => setNewPhaseOpen(e.target.value)} title="Apertura predicciones" />
              <input className="border border-slate-300 rounded-lg px-4 py-2 outline-none" type="datetime-local" value={newPhaseClose} onChange={e => setNewPhaseClose(e.target.value)} title="Cierre predicciones" />
            </div>
            <button onClick={addPhase} className="mt-3 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Crear Fase</button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="font-bold mb-4">Nuevo Grupo</h3>
            <div className="flex gap-3">
              <select className="border border-slate-300 rounded-lg px-4 py-2" value={selectedPhaseForGroup} onChange={e => setSelectedPhaseForGroup(e.target.value)}>
                <option value="">Seleccionar fase...</option>
                {phases.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="flex-1 border border-slate-300 rounded-lg px-4 py-2 outline-none" placeholder="Nombre del grupo (ej: Grupo A)" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              <button onClick={addGroup} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Crear Grupo</button>
            </div>
          </div>

          {phases.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-6 mb-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-sm text-slate-400">Orden: {p.order} • Predicciones: {new Date(p.openDate).toLocaleDateString('es-AR')} — {new Date(p.closeDate).toLocaleDateString('es-AR')}</p>
                </div>
                <button onClick={() => removePhase(p.id)} className="text-red-400 hover:text-red-600 text-sm font-medium">Eliminar Fase</button>
              </div>
              {(p.groups || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.groups.map((g: any) => {
                    const groupTeams = compTeams.filter((ct: any) => ct.groupId === g.id);
                    return (
                      <div key={g.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 min-w-[250px]">
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-bold text-sm">{g.name}</p>
                        </div>
                        
                        {groupTeams.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Sin equipos asignados</p>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Equipos</p>
                              {groupTeams.map((ct: any) => (
                                <p key={ct.id} className="text-sm flex items-center gap-2">
                                  {ct.team?.flagUrl && <img src={ct.team.flagUrl} className="w-4 h-2.5 object-cover rounded-sm" />}
                                  {ct.team?.name}
                                </p>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-slate-200">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Resultados Oficiales</p>
                              <div className="space-y-2">
                                <select 
                                  className="w-full text-xs border border-slate-200 rounded px-2 py-1"
                                  value={g.officialFirstPlaceId || ''}
                                  onChange={(e) => updateGroupResult(g.id, { officialFirstPlaceId: e.target.value || null })}
                                >
                                  <option value="">1º Puesto...</option>
                                  {groupTeams.map((ct: any) => <option key={ct.id} value={ct.teamId}>{ct.team?.name}</option>)}
                                </select>
                                <select 
                                  className="w-full text-xs border border-slate-200 rounded px-2 py-1"
                                  value={g.officialSecondPlaceId || ''}
                                  onChange={(e) => updateGroupResult(g.id, { officialSecondPlaceId: e.target.value || null })}
                                >
                                  <option value="">2º Puesto...</option>
                                  {groupTeams.map((ct: any) => <option key={ct.id} value={ct.teamId}>{ct.team?.name}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PARTIDOS ── */}
      {tab === 'partidos' && (
        <div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="font-bold mb-4">Nuevo Partido</h3>
            <div className="grid grid-cols-2 gap-3">
              <select className="border border-slate-300 rounded-lg px-4 py-2" value={matchForm.phaseId} onChange={e => setMatchForm({ ...matchForm, phaseId: e.target.value })}>
                <option value="">Fase...</option>
                {phases.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className="border border-slate-300 rounded-lg px-4 py-2" value={matchForm.groupId} onChange={e => setMatchForm({ ...matchForm, groupId: e.target.value, homeTeamId: '', awayTeamId: '' })}>
                <option value="">Grupo (opcional)...</option>
                {allGroups.map((g: any) => <option key={g.id} value={g.id}>{g.phaseName} — {g.name}</option>)}
              </select>
              {(() => {
                const teamsForSelect = matchForm.groupId
                  ? compTeams.filter((ct: any) => ct.groupId === matchForm.groupId)
                  : compTeams;
                return (<>
                  <select className="border border-slate-300 rounded-lg px-4 py-2" value={matchForm.homeTeamId} onChange={e => setMatchForm({ ...matchForm, homeTeamId: e.target.value })}>
                    <option value="">Local...</option>
                    {teamsForSelect.map((ct: any) => <option key={ct.id} value={ct.id}>{ct.team?.name}</option>)}
                  </select>
                  <select className="border border-slate-300 rounded-lg px-4 py-2" value={matchForm.awayTeamId} onChange={e => setMatchForm({ ...matchForm, awayTeamId: e.target.value })}>
                    <option value="">Visitante...</option>
                    {teamsForSelect.map((ct: any) => <option key={ct.id} value={ct.id}>{ct.team?.name}</option>)}
                  </select>
                </>);
              })()}
              <input className="border border-slate-300 rounded-lg px-4 py-2" type="datetime-local" value={matchForm.matchDate} onChange={e => setMatchForm({ ...matchForm, matchDate: e.target.value })} />
              <button onClick={addMatch} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Crear Partido</button>
            </div>
          </div>

          {phases.map((p: any) => {
            const phaseMatches = allMatches.filter((m: any) => m.phaseId === p.id).sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
            if (phaseMatches.length === 0) return null;
            return (
              <div key={p.id} className="mb-6">
                <h3 className="font-bold text-lg mb-3">{p.name}</h3>
                <div className="grid gap-2">
                  {phaseMatches.map((m: any) => {
                    const homeTeam = compTeams.find((ct: any) => ct.id === m.homeTeamId)?.team?.name || '?';
                    const awayTeam = compTeams.find((ct: any) => ct.id === m.awayTeamId)?.team?.name || '?';
                    const r = resultForm[m.id] || {};
                    return (
                      <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-bold">{homeTeam} vs {awayTeam}</p>
                          <p className="text-xs text-slate-400">{new Date(m.matchDate).toLocaleString('es-AR')} • {m.status}</p>
                        </div>
                        {m.status === 'FINISHED' ? (
                          <div className="text-center bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                            <p className="text-sm font-bold text-green-700">{m.homeScore90} - {m.awayScore90}</p>
                            {m.homeScore120 != null && <p className="text-xs text-green-500">TE: {m.homeScore120} - {m.awayScore120}</p>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input className="w-12 border rounded px-2 py-1 text-center" placeholder="L" value={r.h90 || ''} onChange={e => setResultForm({ ...resultForm, [m.id]: { ...r, h90: e.target.value } })} />
                            <span className="text-slate-400">-</span>
                            <input className="w-12 border rounded px-2 py-1 text-center" placeholder="V" value={r.a90 || ''} onChange={e => setResultForm({ ...resultForm, [m.id]: { ...r, a90: e.target.value } })} />
                            <input className="w-12 border rounded px-2 py-1 text-center text-xs" placeholder="TE L" title="Tiempo Extra Local" value={r.h120 || ''} onChange={e => setResultForm({ ...resultForm, [m.id]: { ...r, h120: e.target.value } })} />
                            <input className="w-12 border rounded px-2 py-1 text-center text-xs" placeholder="TE V" title="Tiempo Extra Visitante" value={r.a120 || ''} onChange={e => setResultForm({ ...resultForm, [m.id]: { ...r, a120: e.target.value } })} />
                            <button onClick={() => saveResult(m.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700">Guardar</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PREMIOS ── */}
      {tab === 'premios' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-lg mb-4">Resultados Oficiales de Premios</h3>
          <p className="text-slate-400 text-sm mb-6">Definí los premios oficiales al finalizar la competencia</p>
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-bold text-slate-500">MVP del Torneo</label>
              <input className="w-full border border-slate-300 rounded-lg px-4 py-3 mt-1" placeholder="Nombre del jugador MVP" defaultValue={comp.officialMvpId || ''} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-500">Goleador</label>
              <input className="w-full border border-slate-300 rounded-lg px-4 py-3 mt-1" placeholder="Nombre del goleador" defaultValue={comp.officialTopScorerId || ''} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-500">Mejor Arquero</label>
              <input className="w-full border border-slate-300 rounded-lg px-4 py-3 mt-1" placeholder="Nombre del mejor arquero" defaultValue={comp.officialGoalkeeperId || ''} />
            </div>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 w-fit">Guardar Premios</button>
          </div>
        </div>
      )}
    </div>
  );
}
