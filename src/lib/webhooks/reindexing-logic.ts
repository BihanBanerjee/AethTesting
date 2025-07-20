// Smart re-indexing decision logic
export function shouldTriggerReindexing(changedFiles: string[]): boolean {
  // Trigger re-indexing for significant changes
  const significantPatterns = [
    /package\.json$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /Dockerfile$/,
    /docker-compose\.ya?ml$/,
    /\.env/,
    /tsconfig\.json$/,
    /tailwind\.config\./,
    /next\.config\./,
    /prisma\/schema\.prisma$/,
    /src\/.*\.(ts|tsx|js|jsx)$/
  ];

  return changedFiles.some(file => 
    significantPatterns.some(pattern => pattern.test(file))
  ) || changedFiles.length > 10; // Or if many files changed
}