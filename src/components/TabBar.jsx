import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/trade', label: '교환', icon: '/assets/icons/trade.png' },
  { to: '/calendar', label: '캘린더', icon: '/assets/icons/calendar.png' },
  { to: '/', label: '홈', icon: '/assets/icons/home.png' },
  { to: '/friends', label: '친구', icon: '/assets/icons/friend.png' },
  { to: '/weekly', label: '평가', icon: '/assets/icons/test.png' },
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
          <img src={tab.icon} alt="" className="tabbar-icon" draggable={false} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}