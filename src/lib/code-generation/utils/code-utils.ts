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
  console.log('🔍 Extracting JSON from response, first 200 chars:', response.substring(0, 200) + '...');
  
  // Strategy 1: Look for JSON between ```json and ```
  let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    console.log('✅ Found JSON in code fences');
    return jsonMatch[1].trim();
  }
  
  // Strategy 2: Look for any code block that starts with {
  jsonMatch = response.match(/```\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    const content = jsonMatch?.[1]?.trim();
    if (content !== undefined && content.startsWith('{')) {
      console.log('✅ Found JSON in generic code fences');
      return content;
    }
  }
  
  // Strategy 3: Look for JSON object directly (find the largest/most complete one)
  const jsonMatches = response.match(/\{[\s\S]*?\}/g);
  if (jsonMatches && jsonMatches.length > 0) {
    // Find the match that looks most like our expected structure
    for (const match of jsonMatches.sort((a, b) => b.length - a.length)) {
      if (match.includes('"type"') || match.includes('"files"') || match.includes('"explanation"')) {
        console.log('✅ Found JSON object with expected structure');
        return match;
      }
    }
    // If no match has our structure, return the largest one
    console.log('⚠️ Found JSON object but without expected structure');
    return jsonMatches[0];
  }
  
  // Strategy 4: Handle partial/truncated JSON responses  
  if (response.includes('"language"') && response.includes('"explanation"')) {
    console.log('⚠️ Detected partial JSON response - will be handled by fallback');
  }
  
  console.log('❌ No JSON found in response');
  return null;
}

export function lightCleanJSON(jsonStr: string): string {
  console.log('🔧 Light cleaning JSON - applying character escaping');
  
  // More comprehensive cleaning to handle unescaped characters in content
  let cleaned = jsonStr
    // Remove trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix obvious backtick issues (but be very careful)
    .replace(/:\s*`([^`]*)`/g, ': "$1"')
    // Remove any remaining markdown artifacts
    .replace(/^```json\s*/, '')
    .replace(/\s*```$/, '');

  // NEW: Fix unescaped characters in JSON string values
  // Target the "content" field specifically since that's where the issue occurs
  
  // Find content field and fix unescaped characters
  const contentMatch = cleaned.match(/"content":\s*"([\s\S]*?)(?="[,}\]]|$)/);
  if (contentMatch) {
    const originalContent = contentMatch[1];
    console.log(`🔧 Found content field with ${originalContent.length} chars, escaping...`);
    
    // Properly escape all problematic characters
    const escapedContent = originalContent
      .replace(/\\/g, '\\\\')         // Escape backslashes first
      .replace(/"/g, '\\"')           // Escape quotes
      .replace(/\n/g, '\\n')          // Escape newlines (this is the main issue!)
      .replace(/\r/g, '\\r')          // Escape carriage returns
      .replace(/\t/g, '\\t');         // Escape tabs
    
    // Replace the content in the JSON
    cleaned = cleaned.replace(
      /"content":\s*"[\s\S]*?(?="[,}\]]|$)/,
      `"content": "${escapedContent}"`
    );
    
    console.log(`✅ Escaped content field (${escapedContent.length} chars)`);
  }

  return cleaned;
}

// More aggressive JSON repair for unterminated strings
export function repairUnterminatedJSON(jsonStr: string): string {
  console.log('🔧 Attempting to repair unterminated JSON string');
  
  try {
    // Strategy 1: Maximum content extraction - get as much content as possible
    console.log('🔧 Trying maximum content extraction');
    
    // Find the content field start
    const contentStart = jsonStr.indexOf('"content": "');
    if (contentStart !== -1) {
      const contentValueStart = contentStart + '"content": "'.length;
      
      // Extract everything from content value start to the end of available text
      const availableContent = jsonStr.substring(contentValueStart);
      
      // Since Gemini API sends complete responses, extract ALL available content
      console.log('🔍 Extracting full content without truncation');
      let extractedContent = availableContent;
      
      // Keep the full content as-is since Gemini provides complete responses
      console.log(`🔧 Keeping full content: ${extractedContent.length} characters`);
      
      // Properly escape the content for JSON
      const escapedContent = extractedContent
        .replace(/\\/g, '\\\\')   // Escape backslashes first
        .replace(/"/g, '\\"')     // Escape quotes  
        .replace(/\n/g, '\\n')    // Escape newlines
        .replace(/\r/g, '\\r')    // Escape carriage returns
        .replace(/\t/g, '\\t');   // Escape tabs
      
      // Reconstruct complete JSON
      const repaired = `{
  "type": "file_modification",
  "files": [{
    "path": "README.md",
    "content": "${escapedContent}",
    "language": "markdown",
    "changeType": "modify",
    "diff": ""
  }],
  "explanation": "Enhanced README with improved structure and comprehensive content",
  "warnings": ["Content may be truncated due to response limits - consider asking for specific sections if incomplete"],
  "dependencies": []
}`;
      
      // Test if this produces valid JSON
      try {
        const parsed = JSON.parse(repaired);
        if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0 && parsed.files[0].content.length > 100) {
          console.log(`✅ Successfully repaired JSON with maximum content extraction (${parsed.files[0].content.length} chars)`);
          return repaired;
        }
      } catch (e) {
        console.log('⚠️ Maximum content extraction failed:', e instanceof Error ? e.message : 'Unknown error');
      }
    }
    
    // Strategy 2: Fallback content-aware repair (original approach)
    console.log('🔧 Falling back to original content-aware repair');
    
    const contentMatch = jsonStr.match(/("content":\s*")([^]*?)(?="[,}]|$)/);
    if (contentMatch) {
      const [fullMatch, prefix, content] = contentMatch;
      console.log('🔍 Found content field with fallback method');
      
      // Properly escape the content
      const escapedContent = content
        .replace(/\\/g, '\\\\')   // Escape backslashes first
        .replace(/"/g, '\\"')     // Escape quotes  
        .replace(/\n/g, '\\n')    // Escape newlines
        .replace(/\r/g, '\\r')    // Escape carriage returns
        .replace(/\t/g, '\\t');   // Escape tabs
      
      // Reconstruct the JSON with properly escaped content
      let repaired = jsonStr.substring(0, contentMatch.index! + prefix.length) + 
                     escapedContent + '"';
      
      // Add the rest of the JSON structure
      const afterContent = jsonStr.substring(contentMatch.index! + fullMatch.length);
      
      // Find where the content field should end and add proper closing
      if (!afterContent.includes(',')) {
        // We're at the end of the content field, need to close the file object and arrays
        repaired += ',\n    "language": "markdown",\n    "changeType": "modify",\n    "diff": ""\n  }],\n  "explanation": "Improved README content (fallback repair)",\n  "warnings": [],\n  "dependencies": []\n}';
      } else {
        repaired += afterContent;
      }
      
      // Test if this produces valid JSON
      try {
        const parsed = JSON.parse(repaired);
        if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
          console.log('✅ Successfully repaired JSON with fallback content-aware fix');
          return repaired;
        }
      } catch (e) {
        console.log('⚠️ Fallback content-aware fix failed:', e instanceof Error ? e.message : 'Unknown error');
      }
    }
    
    // Strategy 2: Smart truncation - find a safe cutoff point and reconstruct
    console.log('🔧 Trying smart truncation');
    
    // Find the position where the JSON breaks
    let safeContent = '';
    let inString = false;
    let escapeNext = false;
    let braceDepth = 0;
    let bracketDepth = 0;
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];
      const prevChar = i > 0 ? jsonStr[i - 1] : '';
      
      if (escapeNext) {
        escapeNext = false;
        safeContent += char;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        safeContent += char;
        continue;
      }
      
      if (char === '"' && prevChar !== '\\') {
        inString = !inString;
      } else if (!inString) {
        if (char === '{') braceDepth++;
        else if (char === '}') braceDepth--;
        else if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;
      }
      
      safeContent += char;
      
      // If we're in a reasonable state and have substantial content, consider this a safe stopping point
      if (!inString && braceDepth >= 0 && bracketDepth >= 0 && safeContent.length > 1000) {
        // Check if we can make this into valid JSON
        let testJSON = safeContent;
        
        // If we're in the middle of a string, close it
        if (inString) {
          testJSON += '"';
        }
        
        // Close any open structures
        testJSON += ',\n    "language": "markdown",\n    "changeType": "modify"\n  }]'.repeat(Math.max(1, bracketDepth));
        testJSON += ',\n  "explanation": "Truncated due to parsing issues",\n  "warnings": [],\n  "dependencies": []\n}'.repeat(Math.max(1, braceDepth));
        
        try {
          const parsed = JSON.parse(testJSON);
          if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
            console.log('✅ Successfully repaired JSON with smart truncation');
            return testJSON;
          }
        } catch (e) {
          // Continue trying
        }
      }
    }
    
    console.log('❌ All repair strategies failed');
    
  } catch (error) {
    console.log('❌ Failed to repair JSON:', error);
  }
  
  console.log('❌ All repair strategies failed, returning original');
  return jsonStr; // Return original if repair fails
}