import React from "react";
import ServerStats from "../components/serverstats/serverstats";
import FileManager from "../components/filemanager/filemanager";

const Server: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full">
      <div className="bg-gray-800 rounded-lg shadow p-4 h-[70vh] md:h-[80vh]">
        <ServerStats />
      </div>
      <div className="bg-gray-800 rounded-lg shadow p-4 h-[70vh] md:h-[80vh]">
        <FileManager />
      </div>
    </div>
  );
};

export default Server;
