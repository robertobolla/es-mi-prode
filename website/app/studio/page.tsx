"use client";

import { useState, useRef } from "react";
import { toPng } from "html-to-image";
import { Screen1_Home, Screen2_Create, Screen3_Predict, Screen4_Ranking, Screen5_Profile } from "./Mockups";

// Dimensiones estándar App Store (iPhone 6.5")
const SCREEN_W = 1284;
const SCREEN_H = 2778;
const SCREENS = 5;
const TOTAL_W = SCREEN_W * SCREENS;

export default function StudioPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const ref0 = useRef<HTMLDivElement>(null);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);
  const ref4 = useRef<HTMLDivElement>(null);

  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const drawPhoneMockup = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    imgElement: HTMLImageElement | null
  ) => {
    // Escala del teléfono (un poco más chico que la pantalla completa)
    const phoneW = 1000;
    const phoneH = 2160;
    const padding = 24;
    const radius = 100;

    // Dibujar borde/cuerpo del teléfono
    ctx.save();
    ctx.fillStyle = "#1E293B"; // Slate 800
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    drawRoundedRect(ctx, x - phoneW / 2, y - phoneH / 2, phoneW, phoneH, radius);
    ctx.fill();
    ctx.restore();

    // Dibujar borde interno metálico
    ctx.save();
    ctx.strokeStyle = "#475569"; // Slate 600
    ctx.lineWidth = 8;
    drawRoundedRect(ctx, x - phoneW / 2 + 4, y - phoneH / 2 + 4, phoneW - 8, phoneH - 8, radius - 4);
    ctx.stroke();
    ctx.restore();

    // Dibujar pantalla (fondo negro por si la imagen no carga)
    const screenX = x - phoneW / 2 + padding;
    const screenY = y - phoneH / 2 + padding;
    const screenW = phoneW - padding * 2;
    const screenH = phoneH - padding * 2;
    const screenRadius = radius - padding;

    ctx.save();
    drawRoundedRect(ctx, screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip(); // Cortar la imagen a la forma redondeada de la pantalla
    ctx.fillStyle = "#000000";
    ctx.fill();

    if (imgElement) {
      // Dibujar imagen escalada para cubrir la pantalla (cover)
      const imgRatio = imgElement.width / imgElement.height;
      const screenRatio = screenW / screenH;
      let drawW = screenW;
      let drawH = screenH;
      let drawX = screenX;
      let drawY = screenY;

      if (imgRatio > screenRatio) {
        drawW = screenH * imgRatio;
        drawX = screenX - (drawW - screenW) / 2;
      } else {
        drawH = screenW / imgRatio;
        drawY = screenY - (drawH - screenH) / 2;
      }

      ctx.drawImage(imgElement, drawX, drawY, drawW, drawH);
    }
    
    // Notch simulado
    ctx.fillStyle = "#000000";
    drawRoundedRect(ctx, x - 150, screenY - 5, 300, 80, 40);
    ctx.fill();

    ctx.restore();
  };

  const drawText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    align: CanvasTextAlign = "center"
  ) => {
    ctx.save();
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    
    // Configurar sombra
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    
    const lines = text.split("\\n");
    lines.forEach((line, i) => {
      if (i > 0 && line.includes("*")) {
        ctx.fillStyle = "#EAB308"; // Dorado
        line = line.replace("*", "");
      } else {
        ctx.fillStyle = "#FFFFFF";
      }
      
      ctx.font = "900 120px Inter, sans-serif";
      ctx.fillText(line, x, y + i * 140);
    });
    ctx.restore();
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (!src.startsWith("data:")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
      img.src = src;
    });
  };

  const generatePanorama = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Capturar los mockups DOM a imágenes
      const mockupImagesSrc = await Promise.all(
        [ref0, ref1, ref2, ref3, ref4].map(async (ref) => {
          if (!ref.current) return null;
          return await toPng(ref.current, { 
            cacheBust: true, 
            pixelRatio: 3,
            skipFonts: true
          });
        })
      );

      const loadedImages = await Promise.all(
        mockupImagesSrc.map(src => src ? loadImage(src) : Promise.resolve(null))
      );

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = TOTAL_W;
      canvas.height = SCREEN_H;

      // Fondo base
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, TOTAL_W, SCREEN_H);

      // Gradientes
      const grad1 = ctx.createRadialGradient(SCREEN_W, SCREEN_H / 2, 0, SCREEN_W, SCREEN_H / 2, 2000);
      grad1.addColorStop(0, "rgba(234, 179, 8, 0.15)");
      grad1.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, TOTAL_W, SCREEN_H);

      const grad2 = ctx.createRadialGradient(SCREEN_W * 3, SCREEN_H / 2, 0, SCREEN_W * 3, SCREEN_H / 2, 2000);
      grad2.addColorStop(0, "rgba(59, 130, 246, 0.1)");
      grad2.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, TOTAL_W, SCREEN_H);

      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await loadImage("/logo.png");
      } catch {
        console.warn("Logo not found");
      }

      // Dibujar Mockups
      drawPhoneMockup(ctx, SCREEN_W * 0 + SCREEN_W / 2, SCREEN_H / 2 + 600, loadedImages[0]);
      drawPhoneMockup(ctx, SCREEN_W * 1, SCREEN_H / 2 + 500, loadedImages[1]);
      drawPhoneMockup(ctx, SCREEN_W * 2 + 300, SCREEN_H / 2 + 400, loadedImages[2]);
      drawPhoneMockup(ctx, SCREEN_W * 2 + 900, SCREEN_H / 2 + 800, loadedImages[3] || loadedImages[2]);
      drawPhoneMockup(ctx, SCREEN_W * 3 + SCREEN_W / 2, SCREEN_H / 2 + 600, loadedImages[4] || loadedImages[0]);

      if (logoImg) {
        ctx.save();
        ctx.shadowColor = "rgba(234, 179, 8, 0.5)";
        ctx.shadowBlur = 100;
        ctx.drawImage(logoImg, SCREEN_W * 4 + SCREEN_W / 2 - 300, SCREEN_H / 2 - 400, 600, 600);
        ctx.restore();
      }

      drawText(ctx, "Competí con\\n*tus amigos", SCREEN_W * 0 + SCREEN_W / 2, 450);
      drawText(ctx, "Creá torneos\\n*a tu medida", SCREEN_W * 1 + SCREEN_W / 2, 450);
      drawText(ctx, "Predecí\\n*cada fecha", SCREEN_W * 2 + SCREEN_W / 2, 450);
      drawText(ctx, "Rankings en\\n*tiempo real", SCREEN_W * 3 + SCREEN_W / 2, 450);
      drawText(ctx, "Convertite en\\n*Leyenda.", SCREEN_W * 4 + SCREEN_W / 2, SCREEN_H / 2 + 400);

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = SCREEN_W;
      sliceCanvas.height = SCREEN_H;
      const sliceCtx = sliceCanvas.getContext("2d");

      for (let i = 0; i < SCREENS; i++) {
        sliceCtx?.clearRect(0, 0, SCREEN_W, SCREEN_H);
        sliceCtx?.drawImage(canvas, -i * SCREEN_W, 0);
        
        const dataUrl = sliceCanvas.toDataURL("image/jpeg", 0.95);
        const link = document.createElement("a");
        link.download = `appstore_screenshot_${i + 1}.jpg`;
        link.href = dataUrl;
        link.click();
        
        await new Promise(r => setTimeout(r, 500));
      }

    } catch (error: any) {
      console.error("Detalle del error:", error);
      alert("Error generando imágenes: " + (error?.message || JSON.stringify(error)));
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePlayStoreFeatureGraphic = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);

    try {
      // Capturar la Screen4_Ranking (ref3)
      const imgSrc = await toPng(ref3.current!, { 
        cacheBust: true, 
        pixelRatio: 3,
        skipFonts: true
      });
      const loadedMockup = await loadImage(imgSrc);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 1024;
      const H = 500;
      canvas.width = W;
      canvas.height = H;

      // Fondo base oscuro premium (Slate 950)
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, W, H);

      // Orbe azul detrás del teléfono para resaltarlo
      const grad1 = ctx.createRadialGradient(W * 0.75, H / 2, 0, W * 0.75, H / 2, 400);
      grad1.addColorStop(0, "rgba(59, 130, 246, 0.4)"); // Azul brillante
      grad1.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, W, H);

      // Orbe dorado detrás del logo para resaltarlo
      const grad2 = ctx.createRadialGradient(W * 0.25, H / 2, 0, W * 0.25, H / 2, 400);
      grad2.addColorStop(0, "rgba(234, 179, 8, 0.3)"); // Dorado
      grad2.addColorStop(1, "rgba(2, 6, 23, 0)");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, W, H);

      // Patrón de cuadrícula (Grid) para darle textura deportiva/tecnológica
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < W; i += 40) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, H);
      }
      for (let j = 0; j < H; j += 40) {
        ctx.moveTo(0, j);
        ctx.lineTo(W, j);
      }
      ctx.stroke();

      // Cargar logo
      let logoImg: HTMLImageElement | null = null;
      try {
        logoImg = await loadImage("/logo.png");
      } catch {
        console.warn("Logo not found");
      }

      // Dibujar Mockup en el lado derecho (escalado para caber en 500px de alto)
      ctx.save();
      const scale = 450 / 2160; // phoneH es 2160, queremos que ocupe 450px
      ctx.translate(W * 0.7, H / 2);
      ctx.scale(scale, scale);
      drawPhoneMockup(ctx, 0, 0, loadedMockup);
      ctx.restore();

      // Dibujar Logo en el lado izquierdo
      if (logoImg) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.1)";
        ctx.shadowBlur = 20;
        const logoSize = 350;
        ctx.drawImage(logoImg, W * 0.25 - logoSize / 2, H / 2 - logoSize / 2, logoSize, logoSize);
        ctx.restore();
      }

      // Descargar
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.download = `playstore_feature_graphic_1024x500.jpg`;
      link.href = dataUrl;
      link.click();

    } catch (error: any) {
      console.error("Detalle del error:", error);
      alert("Error generando imagen: " + (error?.message || JSON.stringify(error)));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20 pt-32 min-h-screen">
      <div className="mb-12 text-center">
        <span className="mb-4 inline-block rounded-full bg-gold/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold">
          Mockups Ideales
        </span>
        <h1 className="text-4xl font-black md:text-5xl">
          App Store <span className="text-gold">Studio</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
          Visualizá las pantallas ideales generadas automáticamente con datos de prueba, manteniendo 
          la estética 100% fiel a la app. Generá las capturas para las tiendas con un clic.
        </p>
      </div>

      {/* Renderizado de Mockups Escalados para previsualización */}
      <div className="flex flex-wrap justify-center gap-8 mb-12">
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Pantalla 1</h3>
          <div className="scale-[0.6] origin-top h-[518px] shadow-2xl rounded-[3rem] overflow-hidden border-8 border-slate-800 bg-slate-950">
             <div><Screen1_Home /></div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Pantalla 2</h3>
          <div className="scale-[0.6] origin-top h-[518px] shadow-2xl rounded-[3rem] overflow-hidden border-8 border-slate-800 bg-slate-950">
             <div><Screen2_Create /></div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Pantalla 3</h3>
          <div className="scale-[0.6] origin-top h-[518px] shadow-2xl rounded-[3rem] overflow-hidden border-8 border-slate-800 bg-slate-950">
             <div><Screen3_Predict /></div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Pantalla 4</h3>
          <div className="scale-[0.6] origin-top h-[518px] shadow-2xl rounded-[3rem] overflow-hidden border-8 border-slate-800 bg-slate-950">
             <div><Screen4_Ranking /></div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Pantalla 5</h3>
          <div className="scale-[0.6] origin-top h-[518px] shadow-2xl rounded-[3rem] overflow-hidden border-8 border-slate-800 bg-slate-950">
             <div><Screen5_Profile /></div>
          </div>
        </div>
      </div>

      {/* Nodos ocultos sin escalar para capturar imágenes en altísima resolución */}
      <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0">
         <div ref={ref0} className="w-[400px] h-[864px] overflow-hidden"><Screen1_Home /></div>
         <div ref={ref1} className="w-[400px] h-[864px] overflow-hidden"><Screen2_Create /></div>
         <div ref={ref2} className="w-[400px] h-[864px] overflow-hidden"><Screen3_Predict /></div>
         <div ref={ref3} className="w-[400px] h-[864px] overflow-hidden"><Screen4_Ranking /></div>
         <div ref={ref4} className="w-[400px] h-[864px] overflow-hidden"><Screen5_Profile /></div>
      </div>

      <div className="text-center flex flex-col items-center gap-6">
        <button
          onClick={generatePanorama}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-xl bg-gold px-12 py-5 text-lg font-bold text-gold-contrast shadow-lg shadow-gold/20 transition-all hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "⏳ Generando Capturas..." : "✨ Exportar Panorama App Store"}
        </button>

        <button
          onClick={generatePlayStoreFeatureGraphic}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-12 py-5 text-lg font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? "⏳ Generando Gráfico..." : "🎮 Exportar Gráfico de Funciones (1024x500)"}
        </button>

        <p className="mt-4 text-xs text-slate-500 max-w-lg">
          Se capturarán estas pantallas con los datos ideales y se insertarán en el diseño panorámico. El Gráfico de Funciones está listo para subir a Google Play.
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
