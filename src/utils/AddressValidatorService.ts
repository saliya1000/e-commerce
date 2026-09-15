export class AddressValidatorService {
  /**
   * Mock address validation service.
   * Rejects fake addresses and specific mock postal codes.
   */
  static validate(shippingAddress: any): { isValid: boolean; message?: string } {
    if (!shippingAddress) {
      return { isValid: false, message: 'Shipping address is required.' };
    }

    const { name, line1, city, postal_code, country, phone } = shippingAddress;

    if (!name || typeof name !== 'string' || name.trim().length < 2 || !/\p{L}/u.test(name)) {
      return { isValid: false, message: 'Name is required, must be at least 2 characters long, and must contain letters.' };
    }

    if (!line1 || typeof line1 !== 'string' || line1.trim().length < 5 || !/\p{L}/u.test(line1)) {
      return { isValid: false, message: 'Street address (line1) must be at least 5 characters long and contain letters.' };
    }

    if (!city || typeof city !== 'string' || city.trim() === '' || !/\p{L}/u.test(city)) {
      return { isValid: false, message: 'City is required and must contain letters.' };
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

    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      return { isValid: false, message: 'Phone number is required.' };
    }

    // Finnish phone number validation: starts with +358 followed by 4 to 12 digits
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!/^\+358\d{4,12}$/.test(cleanPhone)) {
      return { isValid: false, message: 'Phone number must be a valid Finnish number starting with +358.' };
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
