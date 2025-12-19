"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { Dashboard } from "@/components/Dashboard";
import { CreateSwitch } from "@/components/CreateSwitch";
import { Heartbeat } from "@/components/Heartbeat";
import { MySwitches } from "@/components/MySwitches";
import { Icons, Tabs, Badge } from "@/components/ui";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => ({ default: mod.WalletMultiButton })),
  { ssr: false }
);

type TabId = "dashboard" | "create" | "heartbeat" | "switches";

export default function Home() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <Icons.Activity className="w-4 h-4" /> },
    { id: "create", label: "Create", icon: <Icons.Plus className="w-4 h-4" /> },
    { id: "heartbeat", label: "Heartbeat", icon: <Icons.Heart className="w-4 h-4" /> },
    { id: "switches", label: "Switches", icon: <Icons.Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-grid-pattern bg-noise">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Icons.Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-white">Dead Man's Switch</h1>
                <p className="text-xs text-zinc-400">Solana Digital Legacy</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:block">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={(id) => setActiveTab(id as TabId)}
              />
            </div>

            {/* Wallet Button */}
            <div className="flex items-center gap-3">
              {publicKey && (
                <Badge variant="success" className="hidden sm:flex">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                  Connected
                </Badge>
              )}
              <WalletMultiButton />
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-zinc-800/50">
          <div className="flex justify-around py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "text-purple-400"
                    : "text-zinc-500"
                }`}
              >
                {tab.icon}
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {activeTab === "dashboard" && "Dashboard"}
            {activeTab === "create" && "Create Switch"}
            {activeTab === "heartbeat" && "Send Heartbeat"}
            {activeTab === "switches" && "My Switches"}
          </h2>
          <p className="text-zinc-400">
            {activeTab === "dashboard" && "Overview of your digital legacy protection"}
            {activeTab === "create" && "Set up a new Dead Man's Switch"}
            {activeTab === "heartbeat" && "Keep your switches active"}
            {activeTab === "switches" && "Manage your existing switches"}
          </p>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "create" && <CreateSwitch />}
          {activeTab === "heartbeat" && <Heartbeat />}
          {activeTab === "switches" && <MySwitches />}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Icons.Shield className="w-4 h-4" />
              <span>Dead Man's Switch on Solana</span>
            </div>
            <div className="flex items-center gap-6 text-zinc-500 text-sm">
              <a href="https://devnet.solana.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors">
                Devnet
              </a>
              <span className="text-zinc-700">•</span>
              <span>Built with ❤️</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
