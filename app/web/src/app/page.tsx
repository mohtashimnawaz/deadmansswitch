"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { CreateSwitchWithAssets } from "@/components/CreateSwitchWithAssets";
import { MySwitches } from "@/components/MySwitches";
import { Heartbeat } from "@/components/Heartbeat";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col relative">
      {/* Fluid Flowing Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl" style={{animation: 'smoothFloat 10s ease-in-out infinite'}}></div>
        <div className="absolute top-1/3 right-20 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl" style={{animation: 'smoothFloat 12s ease-in-out infinite', animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-300/20 rounded-full blur-3xl" style={{animation: 'smoothFloat 14s ease-in-out infinite', animationDelay: '4s'}}></div>
      </div>
      
      {/* Fluid Header */}
      <nav className="w-full backdrop-blur-xl shadow-lg relative z-10" style={{
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.65))',
        borderBottom: '2px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div className="px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4" style={{animation: 'wave 5s ease-in-out infinite'}}>
              <div className="animated-icon" style={{animation: 'smoothFloat 4s ease-in-out infinite'}}>
                <div className="clock-icon"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent" style={{backgroundSize: '200% auto', animation: 'fluidFlow 3s ease infinite'}}>
                  Dead Man's Switch
                </h1>
                <p className="text-sm text-gray-700 font-medium">Secure Your Digital Legacy</p>
              </div>
            </div>
            <WalletMultiButton className="!rounded-full !font-semibold !shadow-xl hover:!shadow-2xl !transition-all !duration-500 !text-lg !px-8 !py-4" style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #8b5cf6 100%)',
              backgroundSize: '200% 200%',
              animation: 'fluidFlow 3s ease infinite',
              transform: 'translateZ(0)',
              transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }} />
          </div>
        </div>

        {/* Fluid Hero Section */}
        <div className="backdrop-blur-lg py-8 px-8 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.15))',
          borderTop: '1px solid rgba(139, 92, 246, 0.2)'
        }}>
          <div className="text-center relative z-10">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-3" style={{
              backgroundSize: '200% auto',
              animation: 'fluidFlow 3s ease infinite, smoothFloat 5s ease-in-out infinite'
            }}>
              Protect What Matters Most
            </h2>
            <p className="text-base text-gray-700 max-w-3xl mx-auto">
              Automatically distribute your digital assets to beneficiaries if you stop sending heartbeats.
              Peace of mind for you and your loved ones.
            </p>
          </div>
        </div>
      </nav>

      {/* Zigzag Layout Content */}
      <div className="flex-1 overflow-y-auto relative z-10 px-8 py-12">
        <div className="max-w-6xl mx-auto space-y-16">
          
          {/* Zigzag Item 1 - Right Aligned */}
          <div className="flex items-center gap-12">
            <div className="flex-1 flex justify-end">
              <div className="w-full max-w-2xl opacity-0 animate-pulse" style={{
                animation: 'slideInRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards'
              }}>
                <div className="relative zigzag-connector">
                  <CreateSwitchWithAssets />
                </div>
              </div>
            </div>
          </div>

          {/* Zigzag Connector Line */}
          <div className="flex justify-center">
            <div className="w-1 h-12 bg-gradient-to-b from-purple-400 via-purple-300 to-transparent rounded-full"></div>
          </div>

          {/* Zigzag Item 2 - Left Aligned */}
          <div className="flex items-center gap-12">
            <div className="flex-1">
              <div className="w-full max-w-2xl opacity-0" style={{
                animation: 'slideInLeft 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards'
              }}>
                <div className="relative zigzag-connector">
                  <Heartbeat />
                </div>
              </div>
            </div>
          </div>

          {/* Zigzag Connector Line */}
          <div className="flex justify-center">
            <div className="w-1 h-12 bg-gradient-to-b from-purple-400 via-purple-300 to-transparent rounded-full"></div>
          </div>

          {/* Zigzag Item 3 - Right Aligned */}
          <div className="flex items-center gap-12">
            <div className="flex-1 flex justify-end">
              <div className="w-full max-w-2xl opacity-0" style={{
                animation: 'slideInRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s forwards'
              }}>
                <MySwitches />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
