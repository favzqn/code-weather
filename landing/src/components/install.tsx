'use client';

import { useState } from 'react';

export function Install() {
  const [copiedGlobal, setCopiedGlobal] = useState(false);
  const [copiedNpx, setCopiedNpx] = useState(false);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="install" className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Get started in seconds</h2>
        <p className="text-gray-400 text-lg mb-12">
          Install globally or run directly with npx.
        </p>

        <div className="space-y-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-left text-gray-300">
              Install globally
            </h3>
            <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4 border border-gray-700">
              <code className="text-green-400 font-mono text-sm">
                npm install -g code-weather
              </code>
              <button
                onClick={() =>
                  copyToClipboard('npm install -g code-weather', setCopiedGlobal)
                }
                className="ml-4 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-300 hover:text-white transition-colors"
              >
                {copiedGlobal ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-left text-gray-300">
              Or run with npx
            </h3>
            <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4 border border-gray-700">
              <code className="text-green-400 font-mono text-sm">
                npx code-weather
              </code>
              <button
                onClick={() =>
                  copyToClipboard('npx code-weather', setCopiedNpx)
                }
                className="ml-4 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-300 hover:text-white transition-colors"
              >
                {copiedNpx ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-gray-800/30 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Usage</h3>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 font-mono text-sm text-left">
            <div className="text-gray-500"># Navigate to any git repo</div>
            <div className="text-green-400">$ cd your-project</div>
            <div className="text-gray-500 mt-2"># Run the health check</div>
            <div className="text-green-400">$ code-weather</div>
            <div className="text-gray-500 mt-2"># Or get JSON output</div>
            <div className="text-green-400">$ code-weather --json</div>
          </div>
        </div>
      </div>
    </section>
  );
}
