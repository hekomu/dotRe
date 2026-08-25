import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import TabBar from './components/TabBar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import FriendsPage from './pages/FriendsPage'
import RaidPage from './pages/RaidPage'
import TradePage from './pages/TradePage'
import DiaryWritePage from './pages/DiaryWritePage'
import ProfilePage from './pages/ProfilePage'
import ItemResultPage from './pages/ItemResultPage'
import SettingsPage from './pages/SettingsPage'

/** 앱 셸 — 세로 플렉스. 본문만 스크롤되고 탭바는 항상 바닥에 */
function Shell({ withTabBar = true }) {
  return (
    <div className="shell">
      <main className="shell-main">
        <Outlet />
      </main>
      {withTabBar && <TabBar />}
    </div>
  )
}

/** 로그인 필요 + 탭바 있음 */
function TabLayout() {
  return (
    <ProtectedRoute>
      <Shell />
    </ProtectedRoute>
  )
}

/** 로그인 필요 + 탭바 없음 (몰입형 화면) */
function FullLayout() {
  return (
    <ProtectedRoute>
      <Shell withTabBar={false} />
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 비로그인 */}
        <Route element={<Shell withTabBar={false} />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* 탭바 있는 주요 화면 */}
        <Route element={<TabLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/raid" element={<RaidPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 탭바 없는 화면 */}
        <Route element={<FullLayout />}>
          <Route path="/write" element={<DiaryWritePage />} />
          <Route path="/item/:itemId" element={<ItemResultPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}