import React from 'react';

const ScreenWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[400px] h-[864px] bg-slate-950 text-slate-50 overflow-hidden flex flex-col font-sans relative">
    {/* Status Bar Mock */}
    <div className="h-12 w-full flex justify-between items-center px-6 text-sm font-medium">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-3 border border-white rounded-sm relative">
          <div className="w-3 h-2 bg-white m-px" />
        </div>
      </div>
    </div>
    {children}
    {/* Bottom Bar Mock */}
    <div className="h-1 bg-white/20 w-32 rounded-full absolute bottom-2 left-1/2 -translate-x-1/2" />
  </div>
);

export const Screen1_Home = () => (
  <ScreenWrapper>
    <div className="px-6 pt-8 pb-4 flex justify-between items-center border-b border-white/5 bg-slate-900">
      <div>
        <h1 className="text-2xl font-bold text-slate-50 mb-1">Hola, Fede 👋</h1>
        <p className="text-[10px] font-bold tracking-[1.5px] text-slate-500 uppercase -mb-1">Puntuación Global</p>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-yellow-500">12,450 <span className="text-lg">PTS</span></span>
          <span className="text-xl font-extrabold text-slate-400">#4</span>
        </div>
      </div>
      <div className="w-14 h-14 rounded-full border border-white/20 bg-slate-800 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/avatar_fede.png" alt="avatar" className="w-full h-full object-cover" />
      </div>
    </div>
    
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-black text-slate-400 tracking-[2px] uppercase">Torneos Activos</h2>
      </div>
      
      <div className="flex flex-col gap-4">
        {/* Tournament 1 */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 shadow-lg shadow-black/20">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-50">Copa América 2024</h3>
              <p className="text-xs text-slate-400">🏅 Oficial • 12,450 jugadores</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-3 py-1 rounded-lg text-xs font-bold">
              VER
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <div className="flex-1 bg-slate-900 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Tu Posición</p>
              <p className="font-bold text-yellow-500">2° lugar</p>
            </div>
            <div className="flex-1 bg-slate-900 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Puntos</p>
              <p className="font-bold text-slate-50">145 pts</p>
            </div>
          </div>
        </div>

        {/* Tournament 2 */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/5 shadow-lg shadow-black/20">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-50">Los Pibes del Fútbol</h3>
              <p className="text-xs text-slate-400">👤 Personalizado • 14 jugadores</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-3 py-1 rounded-lg text-xs font-bold">
              VER
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <div className="flex-1 bg-slate-900 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Tu Posición</p>
              <p className="font-bold text-yellow-500">1° lugar 🏆</p>
            </div>
            <div className="flex-1 bg-slate-900 rounded-xl p-3 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Puntos</p>
              <p className="font-bold text-slate-50">84 pts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ScreenWrapper>
);

export const Screen2_Create = () => (
  <ScreenWrapper>
    <div className="px-6 py-6 border-b border-white/5 bg-slate-900 text-center relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400">◀</div>
      <h1 className="text-lg font-bold text-slate-50">Crear Torneo</h1>
    </div>
    <div className="p-6 flex-1 flex flex-col">
      <p className="text-slate-400 text-sm mb-8 text-center">
        Armá tu propio torneo privado para competir con amigos o compañeros de trabajo.
      </p>

      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nombre del Torneo</label>
        <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 flex items-center">
          <span className="text-lg text-slate-50 font-semibold">Oficina Prode 2024</span>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Torneo Base</label>
        <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <span className="text-slate-50 font-medium">Liga Profesional Argentina</span>
          </div>
          <span className="text-slate-400 text-xs">▼</span>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Privacidad</label>
        <div className="flex gap-4">
          <div className="flex-1 bg-yellow-500/20 border-2 border-yellow-500 rounded-xl p-4 flex flex-col items-center">
            <span className="text-2xl mb-1">🔒</span>
            <span className="font-bold text-yellow-500 text-sm">Privado</span>
          </div>
          <div className="flex-1 bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col items-center opacity-50">
            <span className="text-2xl mb-1">🔓</span>
            <span className="font-bold text-slate-400 text-sm">Público</span>
          </div>
        </div>
      </div>

      <div className="mt-auto mb-10">
        <div className="bg-yellow-500 rounded-xl py-4 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-yellow-500/20">
          CREAR TORNEO
        </div>
      </div>
    </div>
  </ScreenWrapper>
);

export const Screen3_Predict = () => (
  <ScreenWrapper>
    <div className="px-6 py-6 bg-slate-900">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-slate-400">◀</div>
        <h1 className="text-xl font-black text-slate-50">Liga Argentina</h1>
      </div>
      <div className="flex gap-6">
        <div className="border-b-2 border-yellow-500 pb-2">
          <span className="text-yellow-500 font-bold">Fecha 12</span>
        </div>
        <div className="pb-2">
          <span className="text-slate-400 font-medium">Clasificación</span>
        </div>
      </div>
    </div>
    
    <div className="flex-1 overflow-hidden p-6 bg-slate-950">
      <div className="flex flex-col gap-4">
        {/* Match 1 - Completed */}
        <div className="bg-slate-800/80 rounded-2xl border border-emerald-500/30 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
            +5 PTS (Exacto)
          </div>
          <p className="text-center text-[10px] text-emerald-400 font-bold tracking-widest mb-3">FINALIZADO</p>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center w-1/3">
              <div className="w-10 h-10 bg-slate-100 rounded-full mb-2 flex items-center justify-center text-xl">🦅</div>
              <span className="text-xs font-bold">América</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-slate-900 px-4 py-2 rounded-xl flex gap-3 text-xl font-black border border-emerald-500/50">
                <span className="text-emerald-500">2</span>
                <span className="text-slate-600">-</span>
                <span className="text-emerald-500">1</span>
              </div>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <div className="w-10 h-10 bg-slate-100 rounded-full mb-2 flex items-center justify-center text-xl">🐐</div>
              <span className="text-xs font-bold">Chivas</span>
            </div>
          </div>
        </div>

        {/* Match 2 - Pending Predict */}
        <div className="bg-slate-800/80 rounded-2xl border border-white/10 p-4">
          <p className="text-center text-[10px] text-slate-400 font-bold tracking-widest mb-3">HOY 21:00</p>
          <div className="flex justify-between items-center">
            <div className="flex flex-col items-center w-1/3">
              <div className="w-10 h-10 bg-blue-500 rounded-full mb-2 flex items-center justify-center text-xl border-2 border-white/20">💙</div>
              <span className="text-xs font-bold">Cruz Azul</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex gap-2">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl font-black text-yellow-500 border border-yellow-500/30">
                  1
                </div>
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-2xl font-black text-yellow-500 border border-yellow-500/30">
                  1
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center w-1/3">
              <div className="w-10 h-10 bg-red-500 rounded-full mb-2 flex items-center justify-center text-xl border-2 border-white/20">🐯</div>
              <span className="text-xs font-bold">Tigres</span>
            </div>
          </div>
          <div className="mt-4 bg-yellow-500 text-slate-950 font-bold text-center py-3 rounded-xl text-sm">
            GUARDAR RESULTADO
          </div>
        </div>
      </div>
    </div>
  </ScreenWrapper>
);

export const Screen4_Ranking = () => (
  <ScreenWrapper>
    <div className="px-6 py-6 bg-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-slate-400">◀</div>
          <h1 className="text-xl font-black text-slate-50">Los Pibes</h1>
        </div>
        <div className="text-slate-400">⚙️</div>
      </div>
      <div className="flex gap-6">
        <div className="pb-2">
          <span className="text-slate-400 font-medium">Predicciones</span>
        </div>
        <div className="border-b-2 border-yellow-500 pb-2">
          <span className="text-yellow-500 font-bold">Ranking</span>
        </div>
      </div>
    </div>
    
    <div className="flex-1 bg-slate-950 p-4">
      {/* Top 3 Podium */}
      <div className="flex justify-center items-end gap-2 h-40 mb-6 px-4">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-1/3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar_matias.png" className="w-10 h-10 rounded-full border-2 border-slate-300 mb-2 object-cover" alt="Matias"/>
          <span className="text-xs font-bold text-slate-300 mb-1">Matias</span>
          <div className="w-full bg-slate-800 rounded-t-lg h-20 flex flex-col items-center pt-2 border-t-2 border-slate-300">
            <span className="text-xl font-black text-slate-300">2</span>
            <span className="text-xs font-bold text-yellow-500">124 pts</span>
          </div>
        </div>
        {/* 1st Place */}
        <div className="flex flex-col items-center w-1/3 z-10">
          <div className="relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl">👑</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatar_fede.png" className="w-14 h-14 rounded-full border-2 border-yellow-500 mb-2 object-cover" alt="Fede"/>
          </div>
          <span className="text-sm font-bold text-yellow-500 mb-1">Fede (Tú)</span>
          <div className="w-full bg-yellow-500/20 rounded-t-lg h-24 flex flex-col items-center pt-2 border-t-2 border-yellow-500">
            <span className="text-2xl font-black text-yellow-500">1</span>
            <span className="text-xs font-bold text-yellow-500">145 pts</span>
          </div>
        </div>
        {/* 3rd Place */}
        <div className="flex flex-col items-center w-1/3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar_lucas.png" className="w-10 h-10 rounded-full border-2 border-amber-600 mb-2 object-cover" alt="Lucas"/>
          <span className="text-xs font-bold text-amber-600 mb-1">Lucas</span>
          <div className="w-full bg-slate-800 rounded-t-lg h-16 flex flex-col items-center pt-2 border-t-2 border-amber-600">
            <span className="text-xl font-black text-amber-600">3</span>
            <span className="text-xs font-bold text-yellow-500">110 pts</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
          <span className="w-6 text-center font-bold text-slate-400">4</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar_nico.png" className="w-8 h-8 rounded-full ml-2 mr-3 object-cover" alt="Nico"/>
          <span className="font-bold flex-1">Nico</span>
          <span className="font-bold text-yellow-500">95 pts</span>
        </div>
        <div className="flex items-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
          <span className="w-6 text-center font-bold text-slate-400">5</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avatar_tomas.png" className="w-8 h-8 rounded-full ml-2 mr-3 object-cover" alt="Tomas"/>
          <span className="font-bold flex-1">Tomas</span>
          <span className="font-bold text-yellow-500">82 pts</span>
        </div>
      </div>
    </div>
  </ScreenWrapper>
);

export const Screen5_Profile = () => (
  <ScreenWrapper>
    <div className="px-6 py-6 border-b border-white/5 bg-slate-900 text-center">
      <h1 className="text-lg font-bold text-slate-50">Mi Perfil</h1>
    </div>
    <div className="p-6 flex-1 flex flex-col items-center">
      <div className="relative mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/avatar_fede.png" className="w-24 h-24 rounded-full border-4 border-slate-800 object-cover" alt="Fede"/>
        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-slate-950 w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">
          ✏️
        </div>
      </div>
      <h2 className="text-2xl font-bold text-slate-50 mb-1">Federico Rossi</h2>
      <p className="text-slate-400 mb-8">fede@prode.com</p>

      <div className="w-full bg-slate-800/80 rounded-2xl border border-yellow-500/30 p-6 mb-6">
        <h3 className="text-xs font-black text-slate-400 tracking-[2px] uppercase text-center mb-6">Estadísticas Históricas</h3>
        
        <div className="flex justify-around mb-6">
          <div className="text-center">
            <p className="text-4xl font-black text-yellow-500 mb-1">24</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Torneos</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-4xl font-black text-yellow-500 mb-1">6</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Campeonatos</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between border border-white/5">
          <span className="text-slate-300 font-medium">Plenos Acertados</span>
          <span className="text-emerald-500 font-black text-xl">142</span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3">
        <div className="bg-slate-800 rounded-xl p-4 flex justify-between items-center text-slate-300 font-medium">
          <span>Notificaciones</span>
          <span className="text-yellow-500">Activadas</span>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 flex justify-between items-center text-slate-300 font-medium">
          <span>Cerrar Sesión</span>
          <span className="text-red-500">▶</span>
        </div>
      </div>
    </div>
  </ScreenWrapper>
);
