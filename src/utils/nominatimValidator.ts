export async function validateAddressWithNominatim(shippingAddress: any): Promise<{ isValid: boolean; message?: string }> {
  try {
    const { line1, city, postal_code, country } = shippingAddress;

    // Combine street, city, and postalCode into the query string
    const queryParts = [line1, city, postal_code].filter(Boolean);
    const q = encodeURIComponent(queryParts.join(', '));

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'HappyPets-Ecommerce-App',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API responded with error:', response.status, response.statusText);
      // Fallback to true if network error or rate limit so checkout isn't blocked completely
      return { isValid: true };
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return { isValid: true };
    } else {
      return {
        isValid: false,
        message: 'The shipping address could not be verified. Please provide a valid address.',
      };
    }
  } catch (error) {
    console.error('Error validating address with Nominatim:', error);
    return { isValid: true };
  }
}
