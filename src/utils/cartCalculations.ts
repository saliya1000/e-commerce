export interface CartItem {
  quantity: number;
  product: {
    price: string | number | any;
  };
}

export const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((acc, item) => {
    return acc + Number(item.product.price) * item.quantity;
  }, 0);
};

export const calculateTotal = (items: CartItem[], shippingCost: number): number => {
  return calculateSubtotal(items) + shippingCost;
};
