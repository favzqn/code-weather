const features = [
  {
    icon: '📊',
    title: 'Commit Activity',
    description:
      'Track development pace with weekly commit frequency and trend analysis. Detect when projects are slowing down.',
  },
  {
    icon: '👥',
    title: 'Contributor Health',
    description:
      'See team diversity and active contributor counts. More contributors means healthier, more sustainable projects.',
  },
  {
    icon: '📦',
    title: 'Dependency Audit',
    description:
      'Find risky packages — deprecated, unmaintained, or with license issues. Keep your dependency tree healthy.',
  },
  {
    icon: '🧪',
    title: 'Test Coverage',
    description:
      'Detect test frameworks, count test files vs source files, and check for coverage configuration.',
  },
  {
    icon: '🐛',
    title: 'Issue Tracker',
    description:
      'Monitor open issues, stale issues, and close rates via the GitHub API. Stay on top of your backlog.',
  },
  {
    icon: '⚡',
    title: 'CI/CD Status',
    description:
      'Check build health across GitHub Actions, GitLab CI, and more. Know if your pipeline is passing.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to know
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Six key metrics that tell you exactly how healthy your project is, all
            presented as an intuitive weather forecast.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-800/50 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-green-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
