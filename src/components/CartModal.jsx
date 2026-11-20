import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { SHAPES } from '@/config/shapes';
import { MATERIALS } from '@/config/pricing';
import { getLabelSheet } from '@/config/labelSheets';
import CartItemPreview from '@/components/CartItemPreview';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export const SHIPPING_COST = 6;

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const grandTotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);

  const goToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden border-l border-border bg-card shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-foreground" />
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Your cart</h2>
            {cartItems.length > 0 && (
              <Badge variant="secondary">{cartItems.length}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted">
                <ShoppingBag className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Your shopping cart is empty.</p>
              <Button variant="outline" onClick={onClose}>
                Back to designer
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartItems.map((item, index) => {
                const shapeName = SHAPES.find((s) => s.id === item.shape)?.name || item.shape;
                const materialName = item.material
                  ? (MATERIALS.find((m) => m.id === item.material)?.name || item.material)
                  : 'Standard 4CP';

                return (
                  <div
                    key={index}
                    className="flex gap-4 rounded-xl border border-border bg-background/60 p-3"
                  >
                    <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-foreground">
                      <CartItemPreview item={item} className="size-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="truncate text-sm font-semibold text-foreground">
                          Label design #{index + 1}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveItem(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {shapeName} · {materialName.replace('-', ' ')}
                        {item.labelSheetId && ` · ${getLabelSheet(item.labelSheetId).name}`}
                      </p>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{item.quantity} labels</span>
                        <span className="text-sm font-semibold tabular-nums">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-border bg-card px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold tabular-nums">${grandTotal.toFixed(2)}</span>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Delivery and payment are collected on the next page.
            </p>
            <Button size="lg" className="w-full" onClick={goToCheckout}>
              Continue to checkout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
