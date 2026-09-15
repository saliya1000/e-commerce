export async function validateAddressWithGoogle(shippingAddress: any): Promise<{ isValid: boolean; message?: string }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Fallback behavior if API key is not provided (e.g. during local tests)
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY is not defined. Skipping strict Google Maps address validation.');
    return { isValid: true };
  }

  const { line1, city, postal_code, country } = shippingAddress;

  const url = `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`;

  const requestBody = {
    address: {
      regionCode: country.trim().toLowerCase() === 'finland' || country.trim().toLowerCase() === 'fi' ? 'FI' : undefined,
      addressLines: [line1, city, postal_code],
    },
    enableUspsCass: false, // Not applicable for FI
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('Google Maps API responded with error:', response.status, response.statusText);
      // If the API fails (e.g. rate limit, bad request), allow the fallback basic validation to prevail
      return { isValid: true };
    }

    const data = await response.json();
    const verdict = data?.result?.verdict;

    if (!verdict) {
      console.error('Unexpected Google Maps API response structure:', data);
      return { isValid: true };
    }

    // Strict validation check
    if (
      !verdict.addressComplete ||
      verdict.validationConclusion === 'UNCONFIRMED_AND_SUSPICIOUS' ||
      verdict.hasUnconfirmedComponents
    ) {
      return {
        isValid: false,
        message: 'The shipping address could not be verified. Please enter a correct address.',
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating address with Google Maps:', error);
    // Fall back to true if network error so checkout isn't completely blocked
    return { isValid: true };
  }
}
