import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import TabBar from './components/TabBar'
import ProtectedRoute from './components/ProtectedRoute'
import RetroWindow from './components/RetroWindow'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CalendarPage from './pages/CalendarPage'
import FriendsPage from './pages/FriendsPage'
import WeeklyPage from './pages/WeeklyPage'
import TradePage from './pages/TradePage'
import DiaryWritePage from './pages/DiaryWritePage'
import ProfilePage from './pages/ProfilePage'
import ItemResultPage from './pages/ItemResultPage'
import SettingsPage from './pages/SettingsPage'
import ShopPage from './pages/ShopPage'
import RoomEditPage from './pages/RoomEditPage'
import CustomizePage from './pages/CustomizePage'

/** 앱 셸 — 세로 플렉스. 본문만 스크롤되고 탭바는 항상 바닥에.
 *  0단계: 본문을 "Dotre Lab" 레트로 창 프레임(RetroWindow)으로 감싼다.
 *  타이틀바/메뉴탭은 장식용이며 실제 이동은 여전히 하단 TabBar가 담당한다. */
function Shell({ withTabBar = true }) {
  return (
    <div className="shell">
      <RetroWindow>
        <main className="shell-main">
          <Outlet />
        </main>
      </RetroWindow>
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
          <Route path="/weekly" element={<WeeklyPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* 탭바 없는 화면 */}
        <Route element={<FullLayout />}>
          <Route path="/write" element={<DiaryWritePage />} />
          <Route path="/item/:itemId" element={<ItemResultPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/room" element={<RoomEditPage />} />
          <Route path="/customize" element={<CustomizePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
