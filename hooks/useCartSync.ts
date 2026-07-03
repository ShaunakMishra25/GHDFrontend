import { useCallback, useState } from 'react';
import { useCartStore } from '../store/cart.store';
import { orderService } from '../services/order.service';
import { CartItem } from '../types/api';

export function useCartSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { items } = useCartStore();
  const { clearCart } = useCartStore();

  const syncToServer = useCallback(async () => {
    if (items.length === 0) return;
    setIsSyncing(true);
    try {
      await orderService.clearCart();
      for (const item of items) {
        await orderService.addToCart(item.product_id, item.quantity);
      }
    } catch (err) {
      console.warn('Cart sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [items]);

  const syncFromServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      const cart = await orderService.getCart();
      if (cart.items?.length > 0) {
        clearCart();
        cart.items.forEach((item: CartItem) => useCartStore.getState().addItem(item));
      }
    } catch {
      // offline - use local cart
    } finally {
      setIsSyncing(false);
    }
  }, [clearCart]);

  return { syncToServer, syncFromServer, isSyncing };
}
