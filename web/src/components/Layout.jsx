import { Outlet, NavLink } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-lg text-indigo-600">PromptCraft</span>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}>
          홈
        </NavLink>
        <NavLink to="/build" className={({ isActive }) => isActive ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}>
          빌드
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => isActive ? 'text-indigo-600 font-medium' : 'text-gray-600 hover:text-gray-900'}>
          히스토리
        </NavLink>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
