'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface AdminPlayer {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  teamId: string;
  teamName: string;
  flagUrl?: string;
}

interface AdminMatch {
  id: string;
  phaseId: string;
  groupId?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  matchDate: string;
  status: string;
  homeScore90?: number | null;
  awayScore90?: number | null;
  homeScore120?: number | null;
  awayScore120?: number | null;
  phaseName?: string;
  fechaLabel?: string;
}

interface AdminGroup {
  id: string;
  phaseId: string;
  name: string;
  phaseName?: string;
  officialFirstPlaceId?: string | null;
  officialSecondPlaceId?: string | null;
}

interface AdminPhase {
  id: string;
  competitionId: string;
  name: string;
  order: number;
  openDate: string;
  closeDate: string;
  groups?: AdminGroup[];
  matches?: AdminMatch[];
}

interface CompetitionTeamInfo {
  id: string;
  competitionId: string;
  teamId: string;
  groupId?: string | null;
  team?: {
    id: string;
    name: string;
    flagUrl?: string;
  };
  group?: AdminGroup | null;
}

interface AdminCompetition {
  id: string;
  name: string;
  format: string;
  active: boolean;
  phases?: AdminPhase[];
  teams?: CompetitionTeamInfo[];
}

export default function MatchesPage() {
  const [competitions, setCompetitions] = useState<AdminCompetition[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [selectedFecha, setSelectedFecha] = useState<string>('Fecha 1');
  const [loading, setLoading] = useState<boolean>(true);
  const [resultForm, setResultForm] = useState<Record<string, { h90: string; a90: string; h120?: string; a120?: string }>>({});

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const res = await apiFetch('/competitions');
      if (res.ok) {
        const data: AdminCompetition[] = await res.json();
        setCompetitions(data);
        // Auto-select the first active competition if available
        const active = data.find(c => c.active);
        if (active) {
          setSelectedCompId(active.id);
          if (active.phases && active.phases.length > 0) {
            // Sort by order asc
            const sortedPhases = [...active.phases].sort((a, b) => a.order - b.order);
            setSelectedPhaseId(sortedPhases[0].id);
          }
        } else if (data.length > 0) {
          setSelectedCompId(data[0].id);
          if (data[0].phases && data[0].phases.length > 0) {
            const sortedPhases = [...data[0].phases].sort((a, b) => a.order - b.order);
            setSelectedPhaseId(sortedPhases[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch competitions', e);
    } finally {
      setLoading(false);
    }
  };

  const reloadSingleCompetition = async (compId: string) => {
    try {
      const res = await apiFetch(`/competitions/${compId}`);
      if (res.ok) {
        const updatedComp: AdminCompetition = await res.json();
        setCompetitions(prev => prev.map(c => c.id === compId ? updatedComp : c));
      }
    } catch (e) {
      console.error('Failed to reload competition details', e);
    }
  };

  const saveResult = async (matchId: string) => {
    const r = resultForm[matchId];
    if (!r) return;
    try {
      const res = await apiFetch(`/matches/${matchId}`, {
        method: 'PATCH',
        body: {
          homeScore90: r.h90 ? parseInt(r.h90) || 0 : 0,
          awayScore90: r.a90 ? parseInt(r.a90) || 0 : 0,
          homeScore120: (r.h120 && r.h120 !== '') ? parseInt(r.h120) : undefined,
          awayScore120: (r.a120 && r.a120 !== '') ? parseInt(r.a120) : undefined,
          status: 'FINISHED',
        },
      });

      if (res.ok) {
        alert('Resultado oficial guardado con éxito');
        if (selectedCompId) {
          await reloadSingleCompetition(selectedCompId);
        }
      } else {
        alert('Error al guardar el resultado');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al guardar el resultado');
    }
  };

  // Helper to enrich a phase's matches with their matchday (Fecha) label
  const getEnrichedPhaseMatches = (phaseMatches: AdminMatch[], phaseHasGroups: boolean): AdminMatch[] => {
    if (!phaseHasGroups) {
      return phaseMatches.map(m => ({ ...m, fechaLabel: 'General' }));
    }

    const byGroup: Record<string, AdminMatch[]> = {};
    phaseMatches.forEach(m => {
      const g = m.groupId || 'General';
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(m);
    });

    const enriched: AdminMatch[] = [];
    Object.keys(byGroup).forEach(groupId => {
      const sorted = byGroup[groupId].sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
      sorted.forEach((m, idx) => {
        const fechaLabel = `Fecha ${Math.floor(idx / 2) + 1}`;
        enriched.push({ ...m, fechaLabel });
      });
    });

    return enriched;
  };

  if (loading) return <div className="p-10 text-slate-400">Cargando partidos...</div>;

  const selectedComp = competitions.find(c => c.id === selectedCompId);
  const phases = selectedComp ? (selectedComp.phases || []).sort((a, b) => a.order - b.order) : [];
  const selectedPhase = phases.find(p => p.id === selectedPhaseId);

  // Groups and matches calculations
  const allGroups = phases.flatMap((p) => (p.groups || []).map((g) => ({ ...g, phaseName: p.name })));
  const allMatches: AdminMatch[] = phases.flatMap((p) => 
    (p.matches || []).map((m) => ({ ...m, phaseName: p.name }))
  );

  const phaseMatches = selectedPhase ? allMatches.filter(m => m.phaseId === selectedPhase.id) : [];
  const hasGroups = selectedPhase ? !!(selectedPhase.groups && selectedPhase.groups.length > 0) : false;
  const enrichedMatches = getEnrichedPhaseMatches(phaseMatches, hasGroups);

  const uniqueFechas = Array.from(
    new Set(enrichedMatches.map(m => m.fechaLabel).filter(Boolean))
  ).sort((a, b) => a!.localeCompare(b!, undefined, { numeric: true })) as string[];

  const hasMultipleFechas = uniqueFechas.length > 1;

  const activeFecha = uniqueFechas.includes(selectedFecha)
    ? selectedFecha
    : (uniqueFechas[0] || 'Fecha 1');

  const renderedMatches = hasMultipleFechas
    ? enrichedMatches.filter(m => m.fechaLabel === activeFecha)
    : enrichedMatches;

  const sortedMatches = renderedMatches.sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

  return (
    <div className="p-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Partidos y Resultados Oficiales</h1>
          <p className="text-slate-500">Cargá los resultados oficiales para calcular los puntajes del prode en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-slate-500">Competencia:</label>
          <select 
            className="border border-slate-300 rounded-xl px-4 py-2.5 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            value={selectedCompId || ''}
            onChange={e => {
              const compId = e.target.value;
              setSelectedCompId(compId);
              const found = competitions.find(c => c.id === compId);
              if (found && found.phases && found.phases.length > 0) {
                const sortedPhases = [...found.phases].sort((a, b) => a.order - b.order);
                setSelectedPhaseId(sortedPhases[0].id);
              } else {
                setSelectedPhaseId('');
              }
              setSelectedFecha('Fecha 1');
            }}
          >
            <option value="">Seleccionar competencia...</option>
            {competitions.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.active ? '(Activa)' : '(Inactiva)'}</option>
            ))}
          </select>
        </div>
      </div>

      {competitions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <p className="text-6xl mb-4">🏟️</p>
          <p className="text-xl font-bold text-slate-700">No hay competencias creadas</p>
          <p className="text-slate-400">Creá competencias oficiales en la sección correspondiente para ver sus partidos.</p>
        </div>
      ) : !selectedComp ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-400 italic">Por favor, seleccioná una competencia para ver sus partidos.</p>
        </div>
      ) : (
        <>
          {/* Phase Navigation Tabs */}
          {phases.length > 0 ? (
            <div className="flex gap-2 mb-6 border-b border-slate-200">
              {phases.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPhaseId(p.id);
                    setSelectedFecha('Fecha 1');
                  }}
                  className={`px-5 py-3 font-bold text-sm rounded-t-lg transition-colors ${
                    selectedPhaseId === p.id 
                      ? 'bg-white border border-b-0 border-slate-200 text-blue-600' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 mb-6">
              <p className="text-slate-400 italic">Esta competencia no tiene fases configuradas.</p>
            </div>
          )}

          {/* Matches List Section */}
          {selectedPhase && (
            <div>
              {/* Matchday Selector (Dynamic tabs based on fechaLabel) */}
              {hasMultipleFechas && (
                <div className="flex flex-wrap gap-2 mb-6 bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-fit">
                  {uniqueFechas.map(f => (
                    <button
                      key={f}
                      onClick={() => setSelectedFecha(f)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        activeFecha === f
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                          : 'text-slate-500 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {sortedMatches.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <p className="text-slate-400 italic">No hay partidos programados para esta fecha/fase.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {sortedMatches.map((m: AdminMatch) => {
                    const homeTeam = selectedComp.teams?.find(ct => ct.id === m.homeTeamId)?.team?.name || '?';
                    const awayTeam = selectedComp.teams?.find(ct => ct.id === m.awayTeamId)?.team?.name || '?';
                    const r = resultForm[m.id] || {};
                    const isFinished = m.status === 'FINISHED';

                    return (
                      <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-bold text-slate-800 text-base">{homeTeam} vs {awayTeam}</span>
                            {m.groupId && (
                              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
                                {allGroups.find(g => g.id === m.groupId)?.name}
                              </span>
                            )}
                            {m.fechaLabel && m.fechaLabel !== 'General' && (
                              <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                                {m.fechaLabel}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {new Date(m.matchDate).toLocaleString('es-AR')} • {isFinished ? 'FINALIZADO' : 'PROGRAMADO'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isFinished ? (
                            <div className="flex items-center gap-4">
                              <div className="text-center bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                                <span className="text-sm font-bold text-green-700">{m.homeScore90} - {m.awayScore90}</span>
                                {!hasGroups && m.homeScore120 != null && (
                                  <span className="block text-[10px] text-green-500 font-bold mt-0.5">
                                    TE: {m.homeScore120} - {m.awayScore120}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  // Reset resultForm to allow editing
                                  setResultForm({
                                    ...resultForm,
                                    [m.id]: {
                                      h90: String(m.homeScore90 ?? ''),
                                      a90: String(m.awayScore90 ?? ''),
                                      h120: String(m.homeScore120 ?? ''),
                                      a120: String(m.awayScore120 ?? ''),
                                    }
                                  });
                                  // Set match status to SCHEDULED locally to show editor input
                                  setCompetitions(prev => 
                                    prev.map(c => c.id === selectedCompId ? {
                                      ...c,
                                      phases: c.phases?.map(ph => ({
                                        ...ph,
                                        matches: ph.matches?.map(match => 
                                          match.id === m.id ? { ...match, status: 'SCHEDULED' } : match
                                        )
                                      }))
                                    } : c)
                                  );
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-bold"
                              >
                                Editar
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input 
                                className="w-12 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                placeholder="L" 
                                value={r.h90 || ''} 
                                onChange={e => setResultForm({ ...resultForm, [m.id]: { ...r, h90: e.target.value } })} 
                              />
                              <span className="text-slate-400 font-bold">-</span>
                              <input 
                                className="w-12 border border-slate-300 rounded-lg px-2 py-1 text-center font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                placeholder="V" 
                                value={r.a90 || ''} 
                                onChange={e => setResultForm({ ...resultForm, [m.id]: { ...r, a90: e.target.value } })} 
                              />
                              {!hasGroups && (
                                <>
                                  <input 
                                    className="w-14 border border-slate-300 rounded-lg px-1 py-1 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                    placeholder="TE L" 
                                    title="Tiempo Extra Local"
                                    value={r.h120 || ''} 
                                    onChange={e => setResultForm({ ...resultForm, [m.id]: { ...r, h120: e.target.value } })} 
                                  />
                                  <input 
                                    className="w-14 border border-slate-300 rounded-lg px-1 py-1 text-center text-xs outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                    placeholder="TE V" 
                                    title="Tiempo Extra Visitante"
                                    value={r.a120 || ''} 
                                    onChange={e => setResultForm({ ...resultForm, [m.id]: { ...r, a120: e.target.value } })} 
                                  />
                                </>
                              )}
                              <button 
                                onClick={() => saveResult(m.id)} 
                                className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-sm transition"
                              >
                                Guardar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
