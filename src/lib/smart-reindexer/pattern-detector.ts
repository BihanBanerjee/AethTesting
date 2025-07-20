export class PatternDetector {
  detectFramework(files: string[]): string {
    if (files.includes('next.config.js') || files.includes('next.config.ts')) {
      return 'nextjs';
    }
    if (files.includes('nuxt.config.js') || files.includes('nuxt.config.ts')) {
      return 'nuxt';
    }
    if (files.includes('angular.json')) {
      return 'angular';
    }
    if (files.includes('vue.config.js')) {
      return 'vue';
    }
    if (files.some(f => f.includes('package.json'))) {
      return 'nodejs';
    }
    
    return 'unknown';
  }

  isConfigFile(path: string): boolean {
    const configPatterns = [
      /package\.json$/,
      /tsconfig\.json$/,
      /webpack\.config\./,
      /vite\.config\./,
      /next\.config\./,
      /tailwind\.config\./,
      /eslint\.config\./,
      /\.env/,
      /docker-compose\.ya?ml$/,
      /Dockerfile$/
    ];
    
    return configPatterns.some(pattern => pattern.test(path));
  }

  isEntryPoint(path: string): boolean {
    const entryPatterns = [
      /^src\/main\./,
      /^src\/index\./,
      /^src\/app\./,
      /^pages\/_app\./,
      /^app\/layout\./,
      /^src\/App\./
    ];
    
    return entryPatterns.some(pattern => pattern.test(path));
  }

  isApiFile(path: string): boolean {
    const apiPatterns = [
      /\/api\//,
      /\/routes\//,
      /\/controllers\//,
      /\/endpoints\//,
      /server\/.*\.ts$/,
      /backend\/.*\.ts$/
    ];
    
    return apiPatterns.some(pattern => pattern.test(path));
  }

  isSchemaFile(path: string): boolean {
    const schemaPatterns = [
      /schema\.prisma$/,
      /\/models\//,
      /\/schemas\//,
      /\/database\//,
      /migration/
    ];
    
    return schemaPatterns.some(pattern => pattern.test(path));
  }

  isTestFile(path: string): boolean {
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /__tests__\//,
      /\/tests?\//
    ];
    
    return testPatterns.some(pattern => pattern.test(path));
  }

  isDocumentationFile(path: string): boolean {
    const docPatterns = [
      /README/i,
      /\.md$/,
      /\/docs?\//,
      /CHANGELOG/i,
      /LICENSE/i
    ];
    
    return docPatterns.some(pattern => pattern.test(path));
  }

  isCoreFile(path: string, framework: string): boolean {
    // Framework-specific core file detection
    const genericCorePatterns = [
      /src\/.*\.(ts|tsx|js|jsx)$/,
      /lib\/.*\.(ts|tsx|js|jsx)$/,
      /utils\/.*\.(ts|tsx|js|jsx)$/,
      /components\/.*\.(ts|tsx|js|jsx)$/,
      /hooks\/.*\.(ts|tsx|js|jsx)$/
    ];

    const frameworkSpecific: Record<string, RegExp[]> = {
      nextjs: [
        /^app\/.*\.(ts|tsx)$/,
        /^pages\/.*\.(ts|tsx|js|jsx)$/,
        /^src\/app\/.*\.(ts|tsx)$/
      ],
      nuxt: [
        /^pages\/.*\.(vue|ts|js)$/,
        /^components\/.*\.(vue|ts|js)$/
      ],
      angular: [
        /^src\/app\/.*\.(ts|html|scss)$/
      ]
    };

    const patterns = [
      ...genericCorePatterns,
      ...(frameworkSpecific[framework] || [])
    ];

    return patterns.some(pattern => pattern.test(path)) && 
           !this.isTestFile(path) && 
           !this.isConfigFile(path);
  }
}