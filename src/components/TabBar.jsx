import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/trade', label: '아이템교환소' },
  { to: '/calendar', label: '캘린더' },
  { to: '/', label: '홈' },
  { to: '/friends', label: '친구' },
  { to: '/raid', label: '레이드' },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t bg-white">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex-1 py-3 text-center text-sm ${
              isActive ? 'font-bold text-green-600' : 'text-gray-500'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}