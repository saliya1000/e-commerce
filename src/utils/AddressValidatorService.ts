export class AddressValidatorService {
  /**
   * Mock address validation service.
   * Rejects fake addresses and specific mock postal codes.
   */
  static validate(shippingAddress: any): { isValid: boolean; message?: string } {
    if (!shippingAddress) {
      return { isValid: false, message: 'Shipping address is required.' };
    }

    const { line1, city, postal_code, country } = shippingAddress;

    if (!line1 || typeof line1 !== 'string' || line1.trim() === '') {
      return { isValid: false, message: 'Street address (line1) is required and cannot be empty.' };
    }

    if (!city || typeof city !== 'string' || city.trim() === '') {
      return { isValid: false, message: 'City is required and cannot be empty.' };
    }

    if (!country || typeof country !== 'string' || country.trim() === '') {
      return { isValid: false, message: 'Country is required and cannot be empty.' };
    }

    if (!postal_code || typeof postal_code !== 'string' || postal_code.trim() === '') {
      return { isValid: false, message: 'Postal code is required and cannot be empty.' };
    }

    // Basic format validation for postalCode (alphanumeric with optional spaces or hyphens, e.g. "12345", "SW1A 1AA", "90210-1234")
    const postalCodeRegex = /^[A-Za-z0-9\s\-]+$/;
    if (!postalCodeRegex.test(postal_code.trim())) {
      return { isValid: false, message: 'Postal code format is invalid. It should contain only letters, numbers, spaces, or hyphens.' };
    }

    // Existing checks for fake addresses
    const fakeKeywords = ['fake', 'test', 'nowhere'];
    const line1Lower = line1.toLowerCase();
    const cityLower = city.toLowerCase();

    for (const keyword of fakeKeywords) {
      if (line1Lower.includes(keyword) || cityLower.includes(keyword)) {
        return { 
          isValid: false, 
          message: 'Unable to verify shipping address. Please enter a valid real-world address.' 
        };
      }
    }

    if (postal_code === '00000') {
      return { 
        isValid: false, 
        message: 'Unable to verify shipping address. Please enter a valid real-world address.' 
      };
    }

    return { isValid: true };
  }
}
