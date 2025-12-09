"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CreateSwitch } from "@/components/CreateSwitch";
import { MySwitches } from "@/components/MySwitches";
import { Heartbeat } from "@/components/Heartbeat";

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="border-b border-white/20 bg-white/40 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="text-4xl">⏱️</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Dead Man's Switch</h1>
                <p className="text-xs text-gray-600">Secure Your Digital Legacy</p>
              </div>
            </div>
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !rounded-xl !font-semibold !shadow-md hover:!shadow-lg !transition-all" />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Protect What Matters Most
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Automatically distribute your digital assets to beneficiaries if you stop sending heartbeats.
            Peace of mind for you and your loved ones.
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
