import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://enemup.com"),
  title: {
    default: "ENEM UP | Estude para o ENEM com questões, simulados, redação e IA",
    template: "%s | ENEM UP",
  },
  description:
    "Estude para o ENEM com questões, simulados, correção de redação com IA, plano de estudos personalizado, gamificação e dashboard de desempenho.",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "ENEM",
    "questões ENEM",
    "simulado ENEM",
    "redação ENEM",
    "corretor de redação ENEM",
    "estudar para o ENEM",
    "plano de estudos ENEM",
  ],
  openGraph: {
    title: "ENEM UP | Estude para o ENEM com um plano feito para você",
    description:
      "Questões, simulados, redação com IA, plano de estudos e acompanhamento de desempenho em um só lugar.",
    url: "https://enemup.com",
    siteName: "ENEM UP",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/landing-hero.png",
        width: 1200,
        height: 630,
        alt: "Interface da plataforma ENEM UP",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ENEM UP | Estude para o ENEM",
    description:
      "Questões, simulados, redação com IA, plano de estudos e dashboard de desempenho.",
    images: ["/landing-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-950 text-slate-50">{children}</body>
    </html>
  );
}
