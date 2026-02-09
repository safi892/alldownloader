import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/ui/layouts/MainLayout";
import { DownloadDashboard } from "@/ui/components/Dashboard/DownloadDashboard";
import { HistoryPage } from "@/ui/components/History/HistoryPage";
import { SettingsPage } from "@/ui/components/Settings/SettingsPage";
import { PlatformsPage } from "@/ui/components/Platforms/PlatformsPage";
import { ChannelsPage } from "@/ui/components/Channels/ChannelsPage";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

function App() {
  useKeyboardShortcuts();
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<DownloadDashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/platforms" element={<PlatformsPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
