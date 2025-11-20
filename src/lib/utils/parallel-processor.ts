/**
 * Parallel Processing Utility
 * 
 * Provides utilities for processing arrays of items in parallel with controlled concurrency,
 * error handling, and progress tracking.
 */

export interface ParallelProcessorOptions {
  /** Maximum number of items to process concurrently (default: 3) */
  concurrency?: number
  /** Whether to continue processing if individual items fail (default: true) */
  continueOnError?: boolean
  /** Optional progress callback called after each batch completes */
  onBatchComplete?: (batchIndex: number, totalBatches: number, results: ProcessingResult<any>[]) => void
  /** Optional progress callback called after each item completes */
  onItemComplete?: (itemIndex: number, totalItems: number, result: ProcessingResult<any>) => void
}

export interface ProcessingResult<T> {
  /** Whether the processing was successful */
  success: boolean
  /** The processed result (if successful) */
  result?: T
  /** Error information (if failed) */
  error?: string
  /** Original item index in the array */
  index: number
  /** Processing duration in milliseconds */
  duration: number
}

export interface BatchProcessingStats {
  /** Total number of items processed */
  totalItems: number
  /** Number of successfully processed items */
  successCount: number
  /** Number of failed items */
  failureCount: number
  /** Total processing duration in milliseconds */
  totalDuration: number
  /** Average processing time per item */
  averageDuration: number
  /** Processing throughput (items per second) */
  throughput: number
}

/**
 * Process an array of items in parallel with controlled concurrency
 * 
 * @param items Array of items to process
 * @param processor Function that processes each item
 * @param options Processing options
 * @returns Array of processing results and statistics
 */
export async function processInParallel<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput, index: number) => Promise<TOutput>,
  options: ParallelProcessorOptions = {}
): Promise<{
  results: ProcessingResult<TOutput>[]
  stats: BatchProcessingStats
}> {
  const {
    concurrency = 3,
    continueOnError = true,
    onBatchComplete,
    onItemComplete
  } = options

  if (items.length === 0) {
    return {
      results: [],
      stats: {
        totalItems: 0,
        successCount: 0,
        failureCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        throughput: 0
      }
    }
  }

  const results: ProcessingResult<TOutput>[] = []
  const startTime = Date.now()
  
  // Process items in chunks of specified concurrency
  const totalBatches = Math.ceil(items.length / concurrency)
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * concurrency
    const batchEnd = Math.min(batchStart + concurrency, items.length)
    const batch = items.slice(batchStart, batchEnd)
    
    // Create promises for this batch
    const batchPromises = batch.map(async (item, batchItemIndex) => {
      const globalIndex = batchStart + batchItemIndex
      const itemStartTime = Date.now()
      
      try {
        const result = await processor(item, globalIndex)
        const duration = Date.now() - itemStartTime
        
        const processingResult: ProcessingResult<TOutput> = {
          success: true,
          result,
          index: globalIndex,
          duration
        }
        
        onItemComplete?.(globalIndex, items.length, processingResult)
        return processingResult
        
      } catch (error) {
        const duration = Date.now() - itemStartTime
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        const processingResult: ProcessingResult<TOutput> = {
          success: false,
          error: errorMessage,
          index: globalIndex,
          duration
        }
        
        onItemComplete?.(globalIndex, items.length, processingResult)
        
        if (!continueOnError) {
          throw error
        }
        
        return processingResult
      }
    })
    
    // Wait for all items in this batch to complete
    const batchResults = await Promise.allSettled(batchPromises)
    
    // Process batch results
    for (const settledResult of batchResults) {
      if (settledResult.status === 'fulfilled') {
        results.push(settledResult.value)
      } else {
        // This should only happen if continueOnError is false and we didn't catch the error above
        const errorResult: ProcessingResult<TOutput> = {
          success: false,
          error: settledResult.reason instanceof Error ? settledResult.reason.message : String(settledResult.reason),
          index: results.length,
          duration: 0
        }
        results.push(errorResult)
      }
    }
    
    // Call batch complete callback
    onBatchComplete?.(batchIndex + 1, totalBatches, results.slice(batchStart, batchEnd))
  }
  
  // Calculate statistics
  const totalDuration = Date.now() - startTime
  const successCount = results.filter(r => r.success).length
  const failureCount = results.length - successCount
  const averageDuration = results.length > 0 
    ? results.reduce((sum, r) => sum + r.duration, 0) / results.length 
    : 0
  const throughput = totalDuration > 0 ? (results.length / totalDuration) * 1000 : 0
  
  const stats: BatchProcessingStats = {
    totalItems: items.length,
    successCount,
    failureCount,
    totalDuration,
    averageDuration,
    throughput
  }
  
  return { results, stats }
}

/**
 * Process items in parallel and return only successful results
 * 
 * @param items Array of items to process
 * @param processor Function that processes each item
 * @param options Processing options
 * @returns Array of successful results
 */
export async function processInParallelSuccessOnly<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput, index: number) => Promise<TOutput>,
  options: ParallelProcessorOptions = {}
): Promise<TOutput[]> {
  const { results } = await processInParallel(items, processor, options)
  return results
    .filter(result => result.success && result.result !== undefined)
    .map(result => result.result!)
}

/**
 * Process items in parallel with retry logic
 * 
 * @param items Array of items to process
 * @param processor Function that processes each item
 * @param options Processing options
 * @param maxRetries Maximum number of retries per item (default: 2)
 * @param retryDelay Delay between retries in milliseconds (default: 1000)
 * @returns Array of processing results and statistics
 */
export async function processInParallelWithRetry<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput, index: number) => Promise<TOutput>,
  options: ParallelProcessorOptions = {},
  maxRetries: number = 2,
  retryDelay: number = 1000
): Promise<{
  results: ProcessingResult<TOutput>[]
  stats: BatchProcessingStats
}> {
  const processorWithRetry = async (item: TInput, index: number): Promise<TOutput> => {
    let lastError: Error | undefined
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await processor(item, index)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }
    
    throw lastError || new Error('Unknown error during retry processing')
  }
  
  return processInParallel(items, processorWithRetry, options)
}

/**
 * Utility function to create a rate-limited processor that respects API rate limits
 * 
 * @param processor Original processor function
 * @param rateLimitMs Minimum time between calls in milliseconds
 * @returns Rate-limited processor function
 */
export function createRateLimitedProcessor<TInput, TOutput>(
  processor: (item: TInput, index: number) => Promise<TOutput>,
  rateLimitMs: number
): (item: TInput, index: number) => Promise<TOutput> {
  let lastCallTime = 0
  
  return async (item: TInput, index: number): Promise<TOutput> => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime
    
    if (timeSinceLastCall < rateLimitMs) {
      const delay = rateLimitMs - timeSinceLastCall
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    lastCallTime = Date.now()
    return processor(item, index)
  }
}

/**
 * Helper function to log processing progress
 */
export function createProgressLogger(label: string = 'Processing') {
  return {
    onBatchComplete: (batchIndex: number, totalBatches: number, results: ProcessingResult<any>[]) => {
      const successCount = results.filter(r => r.success).length
      console.log(`📦 ${label} - Batch ${batchIndex}/${totalBatches} complete (${successCount}/${results.length} successful)`)
    },
    
    onItemComplete: (itemIndex: number, totalItems: number, result: ProcessingResult<any>) => {
      const status = result.success ? '✅' : '❌'
      const progress = Math.round(((itemIndex + 1) / totalItems) * 100)
      console.log(`${status} ${label} - Item ${itemIndex + 1}/${totalItems} (${progress}%) - ${result.duration}ms`)
    }
  }
}
