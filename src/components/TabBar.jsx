import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/trade', label: '아이템교환소' },
  { to: '/calendar', label: '캘린더' },
  { to: '/', label: '홈' },
  { to: '/friends', label: '친구' },
  { to: '/weekly', label: '평가' },
]

export default function TabBar() {
  return (
    <nav className="tabbar">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}