import { create } from 'zustand'

export interface FileNode {
  name: string
  path: string
  content: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

export interface Deployment {
  id: string
  url: string
  previewUrl: string
  productionUrl: string
  status: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED'
  createdAt: string
  readyAt?: string
  error?: string
}

export interface Project {
  id: string
  name: string
  description: string
  files: FileNode[]
  createdAt: Date
  updatedAt: Date
  deployment?: Deployment
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface AppState {
  // Current project
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  
  // Chat state
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, 'timestamp'>) => void
  clearMessages: () => void
  
  // UI state
  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void
  
  isDeploying: boolean
  setIsDeploying: (isDeploying: boolean) => void
  
  selectedFile: string | null
  setSelectedFile: (path: string | null) => void
  
  // File operations
  updateFileContent: (path: string, content: string) => void
  addFile: (file: FileNode) => void
  deleteFile: (path: string) => void
  
  // Project operations
  createProject: (name: string, description: string) => void
  updateProject: (updates: Partial<Project>) => void
  
  // Deployment operations
  setDeployment: (deployment: Deployment) => void
  updateDeploymentStatus: (status: Deployment['status'], error?: string) => void
}

export const useStore = create<AppState>((set, get) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, timestamp: new Date() }],
    })),
  clearMessages: () => set({ messages: [] }),
  
  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  
  isDeploying: false,
  setIsDeploying: (isDeploying) => set({ isDeploying }),
  
  selectedFile: null,
  setSelectedFile: (path) => set({ selectedFile: path }),
  
  updateFileContent: (path, content) =>
    set((state) => {
      if (!state.currentProject) return state
      
      const updateFileInTree = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === path) {
            return { ...node, content }
          }
          if (node.children) {
            return { ...node, children: updateFileInTree(node.children) }
          }
          return node
        })
      }
      
      return {
        currentProject: {
          ...state.currentProject,
          files: updateFileInTree(state.currentProject.files),
          updatedAt: new Date(),
        },
      }
    }),
  
  addFile: (file) =>
    set((state) => {
      if (!state.currentProject) return state
      return {
        currentProject: {
          ...state.currentProject,
          files: [...state.currentProject.files, file],
          updatedAt: new Date(),
        },
      }
    }),
  
  deleteFile: (path) =>
    set((state) => {
      if (!state.currentProject) return state
      
      const removeFileFromTree = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter((node) => node.path !== path)
          .map((node) => {
            if (node.children) {
              return { ...node, children: removeFileFromTree(node.children) }
            }
            return node
          })
      }
      
      return {
        currentProject: {
          ...state.currentProject,
          files: removeFileFromTree(state.currentProject.files),
          updatedAt: new Date(),
        },
      }
    }),
  
  createProject: (name, description) =>
    set({
      currentProject: {
        id: Date.now().toString(),
        name,
        description,
        files: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  
  updateProject: (updates) =>
    set((state) => {
      if (!state.currentProject) return state
      return {
        currentProject: {
          ...state.currentProject,
          ...updates,
          updatedAt: new Date(),
        },
      }
    }),
  
  setDeployment: (deployment) =>
    set((state) => {
      if (!state.currentProject) return state
      return {
        currentProject: {
          ...state.currentProject,
          deployment,
        },
      }
    }),
  
  updateDeploymentStatus: (status, error) =>
    set((state) => {
      if (!state.currentProject || !state.currentProject.deployment) return state
      return {
        currentProject: {
          ...state.currentProject,
          deployment: {
            ...state.currentProject.deployment,
            status,
            error,
            readyAt: status === 'READY' ? new Date().toISOString() : state.currentProject.deployment.readyAt,
          },
        },
      }
    }),
}))
