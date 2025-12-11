"use client";

import dynamic from "next/dynamic";
import { CreateSwitchWithAssets } from "@/components/CreateSwitchWithAssets";
import { MySwitches } from "@/components/MySwitches";
import { Heartbeat } from "@/components/Heartbeat";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then(mod => ({ default: mod.WalletMultiButton })),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Header */}
      <nav className="w-full backdrop-blur-xl shadow-lg relative z-10" style={{
        background: 'rgba(255, 255, 255, 0.85)',
        borderBottom: '2px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div className="px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4">
              <div className="animated-icon">
                <div className="clock-icon"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-purple-600">
                  Dead Man's Switch
                </h1>
                <p className="text-sm text-gray-700 font-medium">Secure Your Digital Legacy</p>
              </div>
            </div>
            <WalletMultiButton className="!rounded-xl !font-semibold !shadow-lg hover:!shadow-xl !transition-all !duration-300 !text-lg !px-8 !py-4" style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
            }} />
          </div>
        </div>

        {/* Hero Section */}
        <div className="backdrop-blur-lg py-8 px-8 relative overflow-hidden" style={{
          background: 'rgba(139, 92, 246, 0.1)',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <div className="text-center relative z-10">
            <h2 className="text-3xl font-bold text-purple-600 mb-3">
              Protect What Matters Most
            </h2>
            <p className="text-base text-gray-700 max-w-3xl mx-auto">
              Automatically distribute your digital assets to beneficiaries if you stop sending heartbeats.
              Peace of mind for you and your loved ones.
            </p>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto relative z-10 px-8 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Zigzag Item 1 - Right Aligned */}
          <div className="flex justify-end">
            <div className="w-full max-w-3xl">
              <CreateSwitchWithAssets />
            </div>
          </div>

          {/* Connector Line */}
          <div className="flex justify-center">
            <div className="w-0.5 h-16 bg-gradient-to-b from-purple-400 to-purple-200"></div>
          </div>

          {/* Zigzag Item 2 - Left Aligned */}
          <div className="flex justify-start">
            <div className="w-full max-w-3xl">
              <Heartbeat />
            </div>
          </div>

          {/* Connector Line */}
          <div className="flex justify-center">
            <div className="w-0.5 h-16 bg-gradient-to-b from-purple-400 to-purple-200"></div>
          </div>

          {/* Zigzag Item 3 - Right Aligned */}
          <div className="flex justify-end">
            <div className="w-full max-w-3xl">
              <MySwitches />
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
