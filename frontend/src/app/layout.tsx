import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navigation from "@/components/Navigation";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "nerdCTF - Academy & Cybersecurity Labs",
  description: "Learn advanced penetration testing, reverse engineering, web exploitation, and cryptography with hands-on practice labs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-purple-500/30`}>
        <AuthProvider>
          <div className="fixed inset-0 z-0 matrix-dots opacity-30 pointer-events-none"></div>
          <Navigation />
          <Toaster position="bottom-right" toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid #333' } }} />
          <main className="flex-1 flex flex-col z-10 relative">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
