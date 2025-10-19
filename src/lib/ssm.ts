import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Cache for parameters to avoid repeated SSM calls
const parameterCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get a parameter from SSM Parameter Store with caching
 * @param parameterName - The name of the parameter to retrieve
 * @param useCache - Whether to use cached value (default: true)
 * @returns The parameter value
 */
export async function getParameter(
  parameterName: string,
  useCache: boolean = true
): Promise<string> {
  const now = Date.now();

  // Check cache first
  if (useCache) {
    const cached = parameterCache.get(parameterName);
    if (cached && cached.expiresAt > now) {
      console.log(`Using cached parameter: ${parameterName}`);
      return cached.value;
    }
  }

  try {
    console.log(`Fetching parameter from SSM: ${parameterName}`);
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);

    if (!response.Parameter?.Value) {
      throw new Error(`Parameter ${parameterName} not found or has no value`);
    }

    const value = response.Parameter.Value;

    // Cache the value
    parameterCache.set(parameterName, {
      value,
      expiresAt: now + CACHE_TTL_MS,
    });

    return value;
  } catch (error) {
    console.error(`Error fetching parameter ${parameterName}:`, error);
    throw error;
  }
}

/**
 * Get multiple parameters from SSM Parameter Store
 * @param parameterNames - Array of parameter names to retrieve
 * @returns Object with parameter names as keys and values
 */
export async function getParameters(
  parameterNames: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all(
    parameterNames.map(async (name) => {
      results[name] = await getParameter(name);
    })
  );

  return results;
}

/**
 * Clear the parameter cache (useful for testing or forced refresh)
 */
export function clearParameterCache(): void {
  parameterCache.clear();
  console.log('Parameter cache cleared');
}
