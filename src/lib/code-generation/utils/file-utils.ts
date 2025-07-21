// src/lib/code-generation/utils/file-utils.ts

export function inferFileType(fileName: string): string {
  const path = fileName.toLowerCase();
  if (path.includes('component')) return 'component';
  if (path.includes('hook')) return 'hook';
  if (path.includes('util')) return 'utility';
  if (path.includes('service')) return 'service';
  if (path.includes('api')) return 'api';
  if (path.includes('page')) return 'page';
  return 'module';
}

export function extractExports(sourceCode: string): string[] {
  try {
    const parsed = JSON.parse(sourceCode);
    return parsed.exports || [];
  } catch {
    const exports: string[] = [];
    const exportMatches = sourceCode.match(/export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g);
    if (exportMatches) {
      exportMatches.forEach(match => {
        const name = match.match(/(\w+)$/)?.[1];
        if (name) exports.push(name);
      });
    }
    return exports;
  }
}

export function extractImports(sourceCode: string): string[] {
  try {
    const parsed = JSON.parse(sourceCode);
    return parsed.imports || [];
  } catch {
    const imports: string[] = [];
    const importMatches = sourceCode.match(/import.*from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach(match => {
        const moduleName = match.match(/from\s+['"]([^'"]+)['"]/)?.[1];
        if (moduleName) imports.push(moduleName);
      });
    }
    return imports;
  }
}

interface FileInfo {
  fileName: string;
}

type StructureNode = {
  [key: string]: StructureNode;
} & {
  _files?: string[];
};

export function buildProjectStructure(files: FileInfo[]): string {
  const structure: StructureNode = {};
  
  files.forEach(file => {
    const parts = file.fileName.split('/');
    let current = structure;
    
    parts.forEach((part: string, index: number) => {
      if (index === parts.length - 1) {
        if (!current._files) current._files = [];
        current._files.push(part);
      } else {
        if (!current[part]) current[part] = {};
        current = current[part] as StructureNode;
      }
    });
  });
  
  return formatStructure(structure);
}

function formatStructure(obj: StructureNode, indent = 0): string {
  let result = '';
  const spaces = '  '.repeat(indent);
  
  Object.keys(obj).forEach(key => {
    if (key === '_files') {
      const files = obj[key];
      if (files) {
        files.forEach((file: string) => {
          result += `${spaces}${file}\n`;
        });
      }
    } else {
      result += `${spaces}${key}/\n`;
      const subNode = obj[key] as StructureNode;
      if (subNode) {
        result += formatStructure(subNode, indent + 1);
      }
    }
  });
  
  return result;
}