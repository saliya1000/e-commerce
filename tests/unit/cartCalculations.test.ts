import { calculateSubtotal, calculateTotal, CartItem } from '../../src/utils/cartCalculations';

describe('Cart Calculations', () => {
  const mockItems: CartItem[] = [
    { quantity: 2, product: { price: '15.50' } },
    { quantity: 1, product: { price: 10 } },
    { quantity: 3, product: { price: '5' } },
  ];

  it('should correctly calculate the subtotal of cart items', () => {
    // 2 * 15.50 = 31
    // 1 * 10 = 10
    // 3 * 5 = 15
    // Total = 56
    const subtotal = calculateSubtotal(mockItems);
    expect(subtotal).toBe(56);
  });

  it('should correctly calculate the total including shipping', () => {
    const total = calculateTotal(mockItems, 10);
    expect(total).toBe(66);
  });

  it('should return 0 for an empty cart', () => {
    expect(calculateSubtotal([])).toBe(0);
    expect(calculateTotal([], 15)).toBe(15);
  });
});
