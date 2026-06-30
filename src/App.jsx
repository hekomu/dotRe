import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="mx-auto min-h-screen max-w-md pb-16">
        <Routes>
          {/* 로그인 페이지는 누구나 접근 가능 */}
          <Route path="/login" element={<LoginPage />} />

          {/* 아래는 로그인해야 접근 가능 */}
          <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
          <Route path="/raid" element={<ProtectedRoute><RaidPage /></ProtectedRoute>} />
          <Route path="/trade" element={<ProtectedRoute><TradePage /></ProtectedRoute>} />
          <Route path="/write" element={<ProtectedRoute><DiaryWritePage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/item-result" element={<ProtectedRoute><ItemResultPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </Routes>
        <TabBar />
      </div>
    </BrowserRouter>
  )
}