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

    const validCountries = ['finland', 'fi'];
    if (!validCountries.includes(country.trim().toLowerCase())) {
      return { isValid: false, message: 'We currently only ship to Finland. Please select Finland as your country.' };
    }

    if (!postal_code || typeof postal_code !== 'string' || postal_code.trim() === '') {
      return { isValid: false, message: 'Postal code is required and cannot be empty.' };
    }

    // Finnish postal code validation: exactly 5 digits
    const postalCodeRegex = /^\d{5}$/;
    if (!postalCodeRegex.test(postal_code.trim())) {
      return { isValid: false, message: 'Invalid postal code. Finnish postal codes must be exactly 5 digits.' };
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
