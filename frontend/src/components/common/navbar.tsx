import React from "react";
import { FaServer, FaFileAlt, FaInfoCircle } from "react-icons/fa";

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { name: "Server", icon: <FaServer /> },
    { name: "Logs", icon: <FaFileAlt /> },
    { name: "About", icon: <FaInfoCircle /> },
  ];

  return (
    <nav className="bg-gray-900 shadow-md">
      <ul className="flex justify-center md:justify-start space-x-6 px-6 py-3">
        {tabs.map((tab) => (
          <li
            key={tab.name}
            className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-md transition-all duration-300 ${
              currentTab === tab.name
                ? "text-blue-400 bg-gray-800"
                : "text-gray-300 hover:text-blue-300 hover:bg-gray-800"
            }`}
            onClick={() => onTabChange(tab.name)}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="hidden md:inline">{tab.name}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
