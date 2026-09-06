export class AddressValidatorService {
  /**
   * Mock address validation service.
   * Rejects fake addresses and specific mock postal codes.
   */
  static validate(shippingAddress: any): { isValid: boolean; message?: string } {
    if (!shippingAddress) {
      return { isValid: false, message: 'Shipping address is required.' };
    }

    const { line1, city, postal_code } = shippingAddress;
    
    // Check for fake street or city names
    const fakeKeywords = ['fake', 'test', 'nowhere'];
    const line1Lower = (line1 || '').toLowerCase();
    const cityLower = (city || '').toLowerCase();

    for (const keyword of fakeKeywords) {
      if (line1Lower.includes(keyword) || cityLower.includes(keyword)) {
        return { 
          isValid: false, 
          message: 'Unable to verify shipping address. Please enter a valid real-world address.' 
        };
      }
    }

    // Check for mock zip codes
    if (postal_code === '00000' || postal_code === '12345') {
      return { 
        isValid: false, 
        message: 'Unable to verify shipping address. Please enter a valid real-world address.' 
      };
    }

    return { isValid: true };
  }
}
