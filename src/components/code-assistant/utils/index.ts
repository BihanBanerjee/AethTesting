export function extractFeatures(text: string) {
  const features = [];
  if (text.toLowerCase().includes('authentication') || text.toLowerCase().includes('auth')) features.push('auth');
  if (text.toLowerCase().includes('database') || text.toLowerCase().includes('db')) features.push('database');
  if (text.toLowerCase().includes('api')) features.push('api');
  if (text.toLowerCase().includes('form')) features.push('forms');
  if (text.toLowerCase().includes('validation')) features.push('validation');
  if (text.toLowerCase().includes('responsive')) features.push('responsive');
  return features;
}

export function extractConstraints(text: string) {
  const constraints = [];
  if (text.toLowerCase().includes('responsive')) constraints.push('responsive');
  if (text.toLowerCase().includes('accessible') || text.toLowerCase().includes('a11y')) constraints.push('a11y');
  if (text.toLowerCase().includes('performance')) constraints.push('performance');
  if (text.toLowerCase().includes('mobile')) constraints.push('mobile-first');
  if (text.toLowerCase().includes('seo')) constraints.push('seo');
  return constraints;
}

export function detectImprovementType(text: string): 'performance' | 'readability' | 'security' | 'optimization' {
  if (text.toLowerCase().includes('performance') || text.toLowerCase().includes('faster') || text.toLowerCase().includes('optimize')) return 'performance';
  if (text.toLowerCase().includes('security') || text.toLowerCase().includes('secure')) return 'security';
  if (text.toLowerCase().includes('readable') || text.toLowerCase().includes('clean') || text.toLowerCase().includes('maintainable')) return 'readability';
  return 'optimization';
}

export function detectReviewType(text: string): 'security' | 'performance' | 'comprehensive' {
  if (text.toLowerCase().includes('security')) return 'security';
  if (text.toLowerCase().includes('performance')) return 'performance';
  return 'comprehensive';
}

export function detectDetailLevel(text: string): 'brief' | 'detailed' | 'comprehensive' {
  if (text.toLowerCase().includes('brief') || text.toLowerCase().includes('quick')) return 'brief';
  if (text.toLowerCase().includes('detailed') || text.toLowerCase().includes('deep') || text.toLowerCase().includes('comprehensive')) return 'comprehensive';
  return 'detailed';
}