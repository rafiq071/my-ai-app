'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function UserProfile() {
  const { data: session, status } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-8 h-8 bg-[#1f1f2e] rounded-full animate-pulse"></div>
        <span>Loading...</span>
      </div>
    )
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="px-4 py-2 bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm rounded-lg transition-colors"
      >
        Sign In
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 px-3 py-2 hover:bg-[#1f1f2e] rounded-lg transition-colors"
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={session.user.name || 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center text-white font-semibold">
            {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
          </div>
        )}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-white">
            {session.user?.name || 'User'}
          </div>
          <div className="text-xs text-gray-500">
            {session.user?.email}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            showMenu ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-[#1f1f2e] border border-[#2a2a3e] rounded-lg shadow-xl z-20">
            <div className="p-3 border-b border-[#2a2a3e]">
              <div className="text-sm font-medium text-white">
                {session.user?.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {session.user?.email}
              </div>
            </div>

            <div className="p-2">
              <a
                href="/app/admin"
                onClick={() => setShowMenu(false)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a3e] rounded transition-colors"
              >
                🛡️ Admin
              </a>
              <button
                onClick={() => {
                  setShowMenu(false)
                  // TODO: Navigate to profile settings
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a3e] rounded transition-colors"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)
                  // TODO: Navigate to projects
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-[#2a2a3e] rounded transition-colors"
              >
                📁 My Projects
              </button>
            </div>

            <div className="p-2 border-t border-[#2a2a3e]">
              <button
                onClick={() => {
                  setShowMenu(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-[#2a2a3e] rounded transition-colors"
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
