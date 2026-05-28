export function Demo() {
  return (
    <section id="demo" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See it in action</h2>
          <p className="text-gray-400 text-lg">Run one command. Get instant insights.</p>
        </div>

        <div className="terminal-shadow rounded-xl overflow-hidden border border-gray-700">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-gray-500 text-sm ml-2 font-mono">Terminal</span>
          </div>

          <div className="bg-[#0d1117] p-6 font-mono text-sm leading-relaxed overflow-x-auto">
            <div className="text-gray-500 mb-4">$ code-weather</div>

            <div className="mb-1">&nbsp;</div>
            <div className="mb-1">
              <span className="text-white font-bold">🌤️  Project Health Report</span>
            </div>
            <div className="text-gray-600 mb-2">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
            <div className="mb-1">
              <span className="text-white font-bold">Overall:</span>{' '}
              <span className="text-green-400 font-bold">72/100</span>{' '}
              <span className="text-yellow-400 font-bold">⛅ Partly Cloudy</span>
            </div>
            <div className="mb-1">&nbsp;</div>

            <div className="mb-1">
              <span>📊 Commit Activity</span>{' '}
              <span className="text-green-400">☀️  Sunny</span>{' '}
              <span className="text-gray-500">    </span>
              <span className="text-gray-400">(14 commits this week)</span>
            </div>
            <div className="mb-1">
              <span>👥 Contributors</span>{' '}
              <span className="text-yellow-400">🌤️  Mostly Sunny</span>{' '}
              <span className="text-gray-400">(3 active)</span>
            </div>
            <div className="mb-1">
              <span>🐛 Open Issues</span>{' '}
              <span className="text-blue-400">🌧️  Rainy</span>{' '}
              <span className="text-gray-500">    </span>
              <span className="text-gray-400">(23 open, 8 stale)</span>
            </div>
            <div className="mb-1">
              <span>🧪 Test Coverage</span>{' '}
              <span className="text-yellow-400">⛅  Cloudy</span>{' '}
              <span className="text-gray-500">    </span>
              <span className="text-gray-400">(67% coverage)</span>
            </div>
            <div className="mb-1">
              <span>📦 Dependencies</span>{' '}
              <span className="text-red-400">🌩️  Stormy</span>{' '}
              <span className="text-gray-500">   </span>
              <span className="text-gray-400">(12 abandoned, 3 GPL)</span>
            </div>
            <div className="mb-1">
              <span>⚡ Build Status</span>{' '}
              <span className="text-green-400">☀️  Sunny</span>{' '}
              <span className="text-gray-500">    </span>
              <span className="text-gray-400">(last 10 builds passed)</span>
            </div>

            <div className="mb-1">&nbsp;</div>
            <div className="text-white font-bold mb-1">💡 Suggestions:</div>
            <div className="text-yellow-400">→ Fix 8 stale issues (oldest: 47 days)</div>
            <div className="text-yellow-400">→ Replace 3 GPL dependencies</div>
            <div className="text-yellow-400">→ Add tests to src/utils/</div>

            <div className="mb-1">&nbsp;</div>
            <div className="text-gray-600">
              Generated in 1.2s | code-weather v1.0.0
            </div>
            <div className="mt-2">
              <span className="text-gray-500">$</span>{' '}
              <span className="cursor-blink text-white">▊</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
