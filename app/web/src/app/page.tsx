"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CreateSwitch } from "@/components/CreateSwitch";
import { MySwitches } from "@/components/MySwitches";
import { Heartbeat } from "@/components/Heartbeat";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <nav className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">⏱️ Dead Man's Switch</h1>
            </div>
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Secure Your Digital Legacy
          </h2>
          <p className="text-gray-400">
            Create a dead man's switch that automatically distributes your assets
            to beneficiaries if you stop sending heartbeats.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <CreateSwitch />
            <Heartbeat />
          </div>
          <div>
            <MySwitches />
          </div>
        </div>
      </div>
    </main>
  );
}
