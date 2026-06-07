import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "Es Mi Prode - Competí, Predecí y Ganá",
  description:
    "La app de pronósticos deportivos para competir con tus amigos. Creá torneos, predecí resultados y convertite en la leyenda de tu grupo.",
  keywords: [
    "prode",
    "pronósticos",
    "fútbol",
    "predicciones",
    "torneos",
    "deportes",
    "app",
  ],
  openGraph: {
    title: "Es Mi Prode - Competí, Predecí y Ganá",
    description:
      "La app de pronósticos deportivos para competir con tus amigos.",
    type: "website",
    locale: "es_AR",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
