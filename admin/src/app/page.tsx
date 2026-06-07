'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface DashboardData {
  activeCompetitions: number;
  totalUsers: number;
  pendingMatches: number;
  recentActivity: Array<{
    id: string;
    type: string;
    detail: string;
    date: string;
  }>;
}

export default function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await apiFetch('/stats/summary');
        if (!res.ok) throw new Error('Error fetching stats');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error('Failed to fetch dashboard stats', e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-2">Panel General</h1>
      <p className="text-slate-500 mb-8">Bienvenido al panel de administración de Es Mi Prode.</p>
      
      {loading ? (
        <div className="flex items-center gap-3 text-slate-500 py-10">
          <svg className="animate-spin h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Cargando estadísticas en tiempo real...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <h3 className="text-slate-500 font-medium text-sm mb-1">Competencias Activas</h3>
              <p className="text-3xl font-bold text-indigo-600">{data?.activeCompetitions ?? 0}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <h3 className="text-slate-500 font-medium text-sm mb-1">Usuarios Totales</h3>
              <p className="text-3xl font-bold text-emerald-600">{data?.totalUsers ?? 0}</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <h3 className="text-slate-500 font-medium text-sm mb-1">Partidos Pendientes</h3>
              <p className="text-3xl font-bold text-amber-600">{data?.pendingMatches ?? 0}</p>
            </div>
          </div>

          <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">Registro de Actividad Reciente</h2>
            </div>
            <div className="p-6 text-sm text-slate-600">
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="py-3.5 flex justify-between items-center hover:bg-slate-50 px-2 rounded transition">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          activity.type === 'user_registered' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`} />
                        <span className="font-medium text-slate-700">{activity.detail}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(activity.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-3 text-slate-400 italic">Aún no hay actividad registrada</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
