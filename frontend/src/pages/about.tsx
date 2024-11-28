import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { FaSpinner, FaExclamationCircle, FaGithub } from "react-icons/fa";
import { config } from "../../config";

const About: React.FC = () => {
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/docs/readme")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch README.md");
        }
        return response.text();
      })
      .then((data) => {
        setReadmeContent(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load README.md. Please try again later.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 bg-gray-900 text-gray-200 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br opacity-15 animate-gradient" />
        <div className="absolute inset-0 bg-pattern opacity-80" />
      </div>
      <div className="relative z-10 w-full max-w-4xl p-6 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center">
            <FaSpinner className="animate-spin text-blue-500 text-6xl mb-4" />
            <p className="text-xl font-medium">Loading About Page...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-red-400">
            <FaExclamationCircle className="text-6xl mb-4" />
            <p className="text-lg font-medium">{error}</p>
          </div>
        ) : (
          <div className="bg-white bg-opacity-10 p-6 sm:p-8 rounded-lg shadow-xl backdrop-filter backdrop-blur-lg">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 text-center">
              About ServerManager
            </h1>
            <div className="prose prose-invert max-w-none text-gray-200">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {readmeContent}
              </ReactMarkdown>
            </div>
            <div className="flex justify-center mt-8 space-x-8">
              {config.githubUrl && (
                <a
                  href={config.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white transition duration-300 transform hover:scale-110"
                >
                  <FaGithub size={36} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default About;
