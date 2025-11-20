/**
 * Utility for extracting and parsing JSON from AI responses
 * Handles both structured tool responses and raw text with embedded JSON
 */

export interface JsonExtractionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  rawResponse?: string
}

/**
 * Extract JSON from various response formats:
 * - Structured tool responses
 * - JSON wrapped in markdown code blocks
 * - Raw JSON arrays/objects
 * - Mixed text with embedded JSON
 */
export function extractJson<T = any>(response: string): JsonExtractionResult<T> {
  try {
    // First, try direct JSON parse (structured responses)
    const parsedResponse = JSON.parse(response)
    
    // Check if it's a structured tool response with enrichedEntries
    if (parsedResponse.enrichedEntries && Array.isArray(parsedResponse.enrichedEntries)) {
      return {
        success: true,
        data: parsedResponse.enrichedEntries as T
      }
    }
    
    // If it's already a valid JSON array/object, return it
    if (Array.isArray(parsedResponse) || typeof parsedResponse === 'object') {
      return {
        success: true,
        data: parsedResponse as T
      }
    }
    
    // Unexpected structure
    return {
      success: false,
      error: 'Parsed JSON but unexpected structure',
      rawResponse: response
    }
    
  } catch (directParseError) {
    // Direct parse failed, try extracting from text
    try {
      // Remove markdown code blocks
      let jsonText = response.replace(/```json\n?|\n?```/g, '').trim()
      
      // Find the first complete JSON array
      const arrayStart = jsonText.indexOf('[')
      if (arrayStart !== -1) {
        const arrayEnd = findMatchingBracket(jsonText, arrayStart, '[', ']')
        
        if (arrayEnd !== -1) {
          jsonText = jsonText.substring(arrayStart, arrayEnd + 1)
          const parsed = JSON.parse(jsonText)
          
          return {
            success: true,
            data: parsed as T
          }
        }
      }
      
      // Find the first complete JSON object
      const objectStart = jsonText.indexOf('{')
      if (objectStart !== -1) {
        const objectEnd = findMatchingBracket(jsonText, objectStart, '{', '}')
        
        if (objectEnd !== -1) {
          jsonText = jsonText.substring(objectStart, objectEnd + 1)
          const parsed = JSON.parse(jsonText)
          
          return {
            success: true,
            data: parsed as T
          }
        }
      }
      
      return {
        success: false,
        error: 'No valid JSON found in response',
        rawResponse: response
      }
      
    } catch (extractError) {
      return {
        success: false,
        error: extractError instanceof Error ? extractError.message : 'Unknown extraction error',
        rawResponse: response
      }
    }
  }
}

/**
 * Find matching closing bracket, handling nested brackets and strings
 */
function findMatchingBracket(
  text: string, 
  startIndex: number, 
  openChar: string, 
  closeChar: string
): number {
  let bracketCount = 0
  let inString = false
  let escapeNext = false
  
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString
      continue
    }
    
    if (!inString) {
      if (char === openChar) {
        bracketCount++
      } else if (char === closeChar) {
        bracketCount--
        if (bracketCount === 0) {
          return i
        }
      }
    }
  }
  
  return -1
}
