'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'

export default function DeploymentPanel() {
  const { currentProject, isDeploying, setIsDeploying, setDeployment, updateDeploymentStatus } =
    useStore()
  const [deploymentError, setDeploymentError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Poll deployment status
  const pollDeploymentStatus = async (deploymentId: string) => {
    try {
      const response = await fetch(`/api/deploy?deploymentId=${deploymentId}`)
      const data = await response.json()

      if (data.success && data.status) {
        updateDeploymentStatus(data.status.state, data.status.error?.message)

        // Stop polling if deployment is done
        if (
          data.status.state === 'READY' ||
          data.status.state === 'ERROR' ||
          data.status.state === 'CANCELED'
        ) {
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
          setIsDeploying(false)
        }
      }
    } catch (error) {
      console.error('Failed to poll deployment status:', error)
    }
  }

  const handleDeploy = async () => {
    if (!currentProject || isDeploying) return

    setIsDeploying(true)
    setDeploymentError(null)

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: currentProject.name,
          files: currentProject.files,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Deployment failed')
      }

      if (data.success && data.deployment) {
        // Save deployment info
        setDeployment(data.deployment)

        // Start polling for status updates
        const interval = setInterval(() => {
          pollDeploymentStatus(data.deployment.id)
        }, 3000) // Poll every 3 seconds

        setPollingInterval(interval)
      } else {
        throw new Error('Invalid deployment response')
      }
    } catch (error) {
      console.error('Deployment error:', error)
      setDeploymentError(error instanceof Error ? error.message : 'Unknown error')
      setIsDeploying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'text-green-400'
      case 'BUILDING':
        return 'text-yellow-400'
      case 'ERROR':
        return 'text-red-400'
      case 'QUEUED':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return '✅'
      case 'BUILDING':
        return '🔨'
      case 'ERROR':
        return '❌'
      case 'QUEUED':
        return '⏳'
      default:
        return '⚪'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'READY':
        return 'Deployed'
      case 'BUILDING':
        return 'Building...'
      case 'ERROR':
        return 'Failed'
      case 'QUEUED':
        return 'Queued'
      default:
        return 'Unknown'
    }
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0a0f] border-t border-[#1f1f2e]">
        <div className="text-center px-4">
          <div className="text-4xl mb-2">🚀</div>
          <p className="text-sm text-gray-500">No project to deploy</p>
        </div>
      </div>
    )
  }

  const deployment = currentProject.deployment

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-t border-[#1f1f2e]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1f1f2e] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">🚀</span>
          <span className="text-sm font-medium text-white">Deployment</span>
        </div>
        
        {!deployment && (
          <button
            onClick={handleDeploy}
            disabled={isDeploying || currentProject.files.length === 0}
            className="px-4 py-1.5 text-sm bg-[#6366f1] hover:bg-[#5558e3] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center gap-2"
          >
            {isDeploying ? (
              <>
                <span className="animate-spin">⏳</span>
                Deploying...
              </>
            ) : (
              <>
                <span>🚀</span>
                Deploy to Vercel
              </>
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {deploymentError && (
          <div className="mb-4 p-4 bg-red-900 bg-opacity-20 border border-red-900 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-red-400">❌</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-400 mb-1">
                  Deployment Failed
                </h3>
                <p className="text-sm text-red-300">{deploymentError}</p>
                {deploymentError.includes('VERCEL_TOKEN') && (
                  <div className="mt-2 text-xs text-red-200">
                    <p>To enable deployments:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Get a Vercel token from https://vercel.com/account/tokens</li>
                      <li>Add it to your .env.local file as VERCEL_TOKEN</li>
                      <li>Restart the development server</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {deployment ? (
          <div className="space-y-4">
            {/* Deployment Status */}
            <div className="bg-[#1f1f2e] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Status</h3>
                <div className={`flex items-center gap-2 text-sm ${getStatusColor(deployment.status)}`}>
                  <span>{getStatusIcon(deployment.status)}</span>
                  <span>{getStatusText(deployment.status)}</span>
                </div>
              </div>

              {deployment.status === 'BUILDING' && (
                <div className="mt-2">
                  <div className="w-full bg-[#0a0a0f] rounded-full h-2">
                    <div className="bg-[#6366f1] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}

              {deployment.error && (
                <div className="mt-3 p-3 bg-red-900 bg-opacity-20 border border-red-900 rounded text-sm text-red-300">
                  {deployment.error}
                </div>
              )}
            </div>

            {/* Deployment URLs */}
            <div className="bg-[#1f1f2e] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">URLs</h3>
              <div className="space-y-2">
                {deployment.status === 'READY' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Live URL</label>
                      <a
                        href={deployment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#6366f1] hover:underline break-all flex items-center gap-2"
                      >
                        {deployment.url}
                        <span className="text-xs">↗</span>
                      </a>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Production URL</label>
                      <a
                        href={deployment.productionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#6366f1] hover:underline break-all flex items-center gap-2"
                      >
                        {deployment.productionUrl}
                        <span className="text-xs">↗</span>
                      </a>
                    </div>
                  </>
                )}

                {deployment.status === 'BUILDING' && (
                  <div className="text-sm text-gray-400">
                    Your app is being built... URLs will be available when ready.
                  </div>
                )}
              </div>
            </div>

            {/* Deployment Info */}
            <div className="bg-[#1f1f2e] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID</span>
                  <span className="text-gray-300 font-mono text-xs">{deployment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-300">
                    {new Date(deployment.createdAt).toLocaleString()}
                  </span>
                </div>
                {deployment.readyAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deployed</span>
                    <span className="text-gray-300">
                      {new Date(deployment.readyAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Redeploy Button */}
            {(deployment.status === 'READY' || deployment.status === 'ERROR') && (
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="w-full px-4 py-2 bg-[#1f1f2e] hover:bg-[#2a2a3e] disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                Redeploy
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Ready to Deploy
            </h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-4">
              Click "Deploy to Vercel" to make your project live on the internet.
              You'll get a URL you can share with anyone!
            </p>
            {currentProject.files.length === 0 && (
              <p className="text-xs text-yellow-400">
                ⚠️ Generate a project first before deploying
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
