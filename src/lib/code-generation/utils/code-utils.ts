// src/lib/code-generation/utils/code-utils.ts

export function cleanCodeContent(content: string): string {
  if (!content) return '';
  
  // If content is wrapped in backticks, remove them
  if (content.startsWith('```') && content.endsWith('```')) {
    const lines = content.split('\n');
    lines.shift(); // Remove first ```
    lines.pop();   // Remove last ```
    content = lines.join('\n');
  }
  
  // Remove language specifier from first line if present
  content = content.replace(/^(typescript|javascript|tsx|jsx|ts|js)\n/, '');
  
  return content.trim();
}

export function extractJSON(response: string): string | null {
  // Strategy 1: Look for JSON between ```json and ```
  let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }
  
  // Strategy 2: Look for any code block that starts with {
  jsonMatch = response.match(/```\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    const content = jsonMatch?.[1]?.trim();
    if (content !== undefined && content.startsWith('{')) {
      return content;
    }
  }
  
  // Strategy 3: Look for JSON object directly
  jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  return null;
}

export function lightCleanJSON(jsonStr: string): string {
  // Only do minimal, safe cleaning that won't break valid JSON
  return jsonStr
    // Remove trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix obvious backtick issues (but be very careful)
    .replace(/:\s*`([^`]*)`/g, ': "$1"')
    // Remove any remaining markdown artifacts
    .replace(/^```json\s*/, '')
    .replace(/\s*```$/, '');
}