import React, { useState } from "react";
import Navbar from "./components/common/navbar";
import { ToastProvider } from "./components/common/toastmanager";
import Server from "./pages/server";
import Settings from "./pages/settings";
import About from "./pages/about";
import Logs from "./pages/logs";

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>("Server");

  const renderTab = () => {
    switch (currentTab) {
      case "Server":
        return <Server />;
      case "Logs":
        return <Logs />;
      case "Settings":
        return <Settings />;
      case "About":
        return <About />;
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen bg-gray-900 text-gray-200">
        <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />
        <main className="flex-1">{renderTab()}</main>
      </div>
    </ToastProvider>
  );
};

export default App;
