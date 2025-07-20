export class FileAnalyzer {
  extractFileReferences(query: string, availableFiles: string[]): string[] {
    const references: string[] = [];
    
    // Direct file mentions
    for (const file of availableFiles) {
      const fileName = file.split('/').pop() || file;
      if (query.toLowerCase().includes(fileName.toLowerCase())) {
        references.push(file);
      }
    }
    
    // Component/function name mentions
    const componentPattern = /\b[A-Z][a-zA-Z]*(?:Component|Page|Hook|Provider)?\b/g;
    const functionPattern = /\b[a-z][a-zA-Z]*(?:Function|Handler|Util)?\b/g;
    
    const components = query.match(componentPattern) || [];
    const functions = query.match(functionPattern) || [];
    
    // Find files that might contain these components/functions
    for (const name of [...components, ...functions]) {
      const matchingFiles = availableFiles.filter(file => 
        file.toLowerCase().includes(name.toLowerCase()) ||
        file.toLowerCase().includes(this.camelToKebab(name))
      );
      references.push(...matchingFiles);
    }
    
    return [...new Set(references)];
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}