-- Todo App Template Code
-- Insert this AFTER running seed-templates.sql

-- Todo App Files
INSERT INTO public.template_files (template_id, path, content, type) VALUES
('11111111-1111-1111-1111-111111111111', 'app/page.tsx', 
'use client'

import { useState } from ''react''

interface Todo {
  id: number
  text: string
  completed: boolean
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('''')

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }])
      setInput('''')
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">✓ Todo App</h1>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === ''Enter'' && addTodo()}
            placeholder="What needs to be done?"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTodo}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {todos.map(todo => (
            <div
              key={todo.id}
              className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="w-5 h-5"
              />
              <span className={`flex-1 ${todo.completed ? ''line-through opacity-50'' : ''''}`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No todos yet. Add one above!
          </div>
        )}

        <div className="mt-6 text-sm text-gray-500 text-center">
          {todos.filter(t => !t.completed).length} items left
        </div>
      </div>
    </div>
  )
}', 'file'),

('11111111-1111-1111-1111-111111111111', 'app/layout.tsx',
'export const metadata = {
  title: ''Todo App'',
  description: ''A simple todo application'',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}', 'file');

COMMENT ON TABLE public.template_files IS ''Template contains working Todo App code'';
