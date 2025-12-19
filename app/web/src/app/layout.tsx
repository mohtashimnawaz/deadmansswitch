import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/WalletProvider";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Dead Man's Switch | Solana Digital Legacy",
  description: "Secure your digital legacy on Solana. Automatically distribute your crypto assets to beneficiaries with a decentralized dead man's switch.",
  keywords: ["solana", "crypto", "inheritance", "dead man's switch", "digital legacy", "web3"],
  authors: [{ name: "Dead Man's Switch" }],
  openGraph: {
    title: "Dead Man's Switch | Solana Digital Legacy",
    description: "Secure your digital legacy on Solana",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8b5cf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-[#0a0a0f]`}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
