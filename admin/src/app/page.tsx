export default function DashboardHome() {
  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-2">Panel General</h1>
      <p className="text-slate-500 mb-8">Bienvenido al panel de administración de Es Mi Prode.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 font-medium text-sm mb-1">Competencias Activas</h3>
          <p className="text-3xl font-bold">—</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 font-medium text-sm mb-1">Usuarios Totales</h3>
          <p className="text-3xl font-bold">—</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-slate-500 font-medium text-sm mb-1">Partidos Pendientes</h3>
          <p className="text-3xl font-bold">—</p>
        </div>
      </div>

      <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold">Registro de Actividad Reciente</h2>
        </div>
        <div className="p-6 text-sm text-slate-500">
          <p className="py-3 text-slate-400 italic">Aún no hay actividad registrada</p>
        </div>
      </div>
    </div>
  );
}
