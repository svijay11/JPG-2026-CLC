import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk';
import { ArrowLeft, CreditCard as CreditCardIcon, Lock, ShieldCheck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { SHAPES } from '@/config/shapes';
import { MATERIALS } from '@/config/pricing';
import { getLabelSheet } from '@/config/labelSheets';
import CartItemPreview from '@/components/CartItemPreview';
import OrderDownloadScreen from '@/components/OrderDownloadScreen';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { SHIPPING_COST } from '@/components/CartModal';
import AddressAutocomplete from '@/components/AddressAutocomplete';

const squareAppId = import.meta.env.VITE_SQUARE_APPLICATION_ID || '';
const squareLocationId = import.meta.env.VITE_SQUARE_LOCATION_ID || '';

const EMPTY_SHIPPING_ADDRESS = {
  name: '',
  street: '',
  city: '',
  state: '',
  zip: ''
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    cart,
    completeOrder,
    completedOrder,
    orderMeta,
    clearCompletedOrder
  } = useCart();

  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [shippingAddress, setShippingAddress] = useState(EMPTY_SHIPPING_ADDRESS);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const grandTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.totalPrice, 0),
    [cart]
  );
  const shippingCost = deliveryMethod === 'shipping' ? SHIPPING_COST : 0;
  const orderTotal = grandTotal + shippingCost;
  const amountCents = Math.round(orderTotal * 100);

  if (!completedOrder && cart.length === 0) {
    return <Navigate to="/" replace />;
  }

  const updateShippingField = (field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const buildOrderMeta = () => {
    const email = buyerEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    if (deliveryMethod === 'shipping') {
      const { name, street, city, state, zip } = shippingAddress;
      if (!name.trim() || !street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
        throw new Error('Please complete all shipping address fields.');
      }
    } else if (!buyerName.trim()) {
      throw new Error('Please enter your name for pickup.');
    }

    const normalizedShipping = deliveryMethod === 'shipping'
      ? {
        name: shippingAddress.name.trim(),
        street: shippingAddress.street.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        zip: shippingAddress.zip.trim()
      }
      : null;

    return {
      paymentMethod: 'square',
      buyerName: (deliveryMethod === 'shipping'
        ? shippingAddress.name.trim()
        : buyerName.trim()) || 'Customer',
      buyerEmail: email,
      orderDate: new Date().toISOString(),
      orderId: `#${Date.now().toString().slice(-10)}`,
      buyerId: Math.random().toString(36).slice(2, 19),
      deliveryMethod,
      shippingAddress: normalizedShipping,
      shippingCost
    };
  };

  const handleCardTokenized = async (tokenResult) => {
    setCheckoutError(null);

    if (tokenResult.status !== 'OK' || !tokenResult.token) {
      setCheckoutError(
        tokenResult.errors?.[0]?.message
          || 'Card could not be tokenized. Please check your details.'
      );
      return;
    }

    let meta;
    try {
      meta = buildOrderMeta();
    } catch (err) {
      setCheckoutError(err.message);
      return;
    }

    if (!squareAppId || !squareLocationId) {
      setCheckoutError('Square is not configured. Check your environment variables.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/create-square-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: tokenResult.token,
          amountCents,
          idempotencyKey: crypto.randomUUID(),
          orderId: meta.orderId,
          buyerName: meta.buyerName,
          buyerEmail: meta.buyerEmail,
          note: `Idyll Time Wines labels — ${meta.orderId}`
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Payment failed.');
      }

      completeOrder(cart, {
        ...meta,
        squarePaymentId: data.paymentId,
        receiptUrl: data.receiptUrl || null
      });
    } catch (err) {
      console.error(err);
      setCheckoutError(err?.message || 'Payment failed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_oklch(0.98_0.01_90),_oklch(0.96_0.01_260))]">
      <div className="mx-auto grid min-h-full w-full max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* Order summary column */}
        <aside className="order-2 border-t border-border/70 bg-muted/40 px-6 py-8 lg:order-1 lg:border-r lg:border-t-0 lg:px-10 lg:py-12">
          <div className="mx-auto flex w-full max-w-md flex-col gap-8 lg:mx-0 lg:max-w-none">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Idyll Time Wines
              </p>
              <h1 className="font-serifHeading text-3xl font-semibold tracking-tight text-foreground">
                Order summary
              </h1>
              <p className="text-sm text-muted-foreground">
                Custom printed labels, ready for fulfillment after payment.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {cart.map((item, index) => {
                const shapeName = SHAPES.find((s) => s.id === item.shape)?.name || item.shape;
                const materialName = item.material
                  ? (MATERIALS.find((m) => m.id === item.material)?.name || item.material)
                  : 'Standard 4CP';
                const sheetName = item.labelSheetId
                  ? getLabelSheet(item.labelSheetId)?.name
                  : null;

                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 rounded-xl border border-border/80 bg-card/80 p-3 shadow-sm"
                  >
                    <div className="size-16 overflow-hidden rounded-lg border border-border bg-foreground/95">
                      <CartItemPreview item={item} className="size-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.quantity}× Custom label #{index + 1}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[shapeName, materialName, sheetName].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          ${item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">${grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>{deliveryMethod === 'shipping' ? 'Shipping' : 'Pickup'}</span>
                <span className="tabular-nums">
                  {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 text-base font-semibold text-foreground">
                <span>Total due</span>
                <span className="tabular-nums">${orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                <Lock className="size-3.5" />
                Secure checkout
              </Badge>
              <Badge variant="outline" className="gap-1.5">
                <ShieldCheck className="size-3.5" />
                Powered by Square
              </Badge>
            </div>
          </div>
        </aside>

        {/* Payment column */}
        <main className="order-1 px-6 py-8 lg:order-2 lg:px-10 lg:py-12">
          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <div className="flex items-center justify-between gap-4">
              <Button variant="ghost" size="sm" asChild className="-ml-2">
                <Link to="/">
                  <ArrowLeft data-icon="inline-start" />
                  Back to designer
                </Link>
              </Button>
              <Badge variant="outline">Sandbox</Badge>
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Checkout
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter delivery details, then pay with card.
              </p>
            </div>

            <FieldGroup>
              <FieldSet>
                <FieldLegend>Delivery</FieldLegend>
                <FieldDescription>
                  Pickup is free. USPS shipping is a flat ${SHIPPING_COST.toFixed(2)}.
                </FieldDescription>
                <RadioGroup
                  value={deliveryMethod}
                  onValueChange={setDeliveryMethod}
                  className="mt-2 grid gap-3"
                >
                  <Label
                    htmlFor="delivery-pickup"
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 has-[:checked]:border-foreground has-[:checked]:ring-1 has-[:checked]:ring-foreground"
                  >
                    <RadioGroupItem id="delivery-pickup" value="pickup" className="mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">Pickup</span>
                      <span className="text-xs text-muted-foreground">Free — pick up at the winery</span>
                    </span>
                    <span className="text-sm font-medium">Free</span>
                  </Label>
                  <Label
                    htmlFor="delivery-shipping"
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 has-[:checked]:border-foreground has-[:checked]:ring-1 has-[:checked]:ring-foreground"
                  >
                    <RadioGroupItem id="delivery-shipping" value="shipping" className="mt-0.5" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">Shipping</span>
                      <span className="text-xs text-muted-foreground">USPS delivery to your address</span>
                    </span>
                    <span className="text-sm font-medium">${SHIPPING_COST.toFixed(2)}</span>
                  </Label>
                </RadioGroup>
              </FieldSet>

              <FieldSet>
                <FieldLegend>Contact</FieldLegend>
                <FieldDescription>
                  We&apos;ll use this email for your order confirmation and receipt.
                </FieldDescription>
                <Field>
                  <FieldLabel htmlFor="buyer-email">Email</FieldLabel>
                  <Input
                    id="buyer-email"
                    type="email"
                    inputMode="email"
                    required
                    placeholder="you@example.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>
              </FieldSet>

              {deliveryMethod === 'pickup' ? (
                <FieldSet>
                  <FieldLegend>Your details</FieldLegend>
                  <Field>
                    <FieldLabel htmlFor="buyer-name">Full name</FieldLabel>
                    <Input
                      id="buyer-name"
                      placeholder="Jane Doe"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                </FieldSet>
              ) : (
                <FieldSet>
                  <FieldLegend>Shipping address</FieldLegend>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="ship-name">Full name</FieldLabel>
                      <Input
                        id="ship-name"
                        placeholder="Jane Doe"
                        value={shippingAddress.name}
                        onChange={(e) => updateShippingField('name', e.target.value)}
                        autoComplete="name"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Find address</FieldLabel>
                      <AddressAutocomplete
                        onAddressSelected={({ street, city, state, zip }) => {
                          setShippingAddress((prev) => ({
                            ...prev,
                            street: street || prev.street,
                            city: city || prev.city,
                            state: state || prev.state,
                            zip: zip || prev.zip
                          }));
                        }}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="ship-street">Street address</FieldLabel>
                      <Input
                        id="ship-street"
                        placeholder="123 Main St"
                        value={shippingAddress.street}
                        onChange={(e) => updateShippingField('street', e.target.value)}
                        autoComplete="street-address"
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="ship-city">City</FieldLabel>
                      <Input
                        id="ship-city"
                        placeholder="Napa"
                        value={shippingAddress.city}
                        onChange={(e) => updateShippingField('city', e.target.value)}
                        autoComplete="address-level2"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="ship-state">State</FieldLabel>
                        <Input
                          id="ship-state"
                          placeholder="CA"
                          value={shippingAddress.state}
                          onChange={(e) => updateShippingField('state', e.target.value)}
                          autoComplete="address-level1"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="ship-zip">ZIP</FieldLabel>
                        <Input
                          id="ship-zip"
                          placeholder="94558"
                          value={shippingAddress.zip}
                          onChange={(e) => updateShippingField('zip', e.target.value)}
                          autoComplete="postal-code"
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </FieldSet>
              )}

              <Separator />

              <FieldSet>
                <FieldLegend className="flex items-center gap-2">
                  <CreditCardIcon className="size-4" />
                  Card information
                </FieldLegend>
                <FieldDescription>
                  Sandbox test card: 4111 1111 1111 1111 · any future expiry · any CVV
                </FieldDescription>

                {checkoutError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>{checkoutError}</AlertDescription>
                  </Alert>
                )}

                <div className={`mt-3 ${submitting ? 'pointer-events-none opacity-60' : ''}`}>
                  {(!squareAppId || !squareLocationId) ? (
                    <Alert variant="destructive">
                      <AlertDescription>
                        Missing Square application or location ID. Restart the server after updating `.env`.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <PaymentForm
                      applicationId={squareAppId}
                      locationId={squareLocationId}
                      cardTokenizeResponseReceived={handleCardTokenized}
                      createPaymentRequest={() => ({
                        countryCode: 'US',
                        currencyCode: 'USD',
                        total: {
                          amount: orderTotal.toFixed(2),
                          label: 'Idyll Time Wines'
                        }
                      })}
                    >
                      <div className="overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm">
                        <CreditCard
                          buttonProps={{
                            css: {
                              backgroundColor: 'oklch(0.28 0.04 260)',
                              color: '#fff',
                              fontSize: '15px',
                              fontWeight: '600',
                              borderRadius: '10px',
                              minHeight: '48px',
                              '&:hover': {
                                backgroundColor: 'oklch(0.22 0.04 260)'
                              }
                            }
                          }}
                        >
                          {submitting ? 'Processing…' : `Pay $${orderTotal.toFixed(2)}`}
                        </CreditCard>
                      </div>
                    </PaymentForm>
                  )}
                </div>
              </FieldSet>
            </FieldGroup>

            <p className="text-center text-xs text-muted-foreground">
              By paying, you agree to complete this custom label order with Idyll Time Wines.
            </p>
          </div>
        </main>
      </div>

      {completedOrder && (
        <OrderDownloadScreen
          orderItems={completedOrder}
          orderMeta={orderMeta}
          onDone={() => {
            clearCompletedOrder();
            navigate('/');
          }}
        />
      )}
    </div>
  );
}
