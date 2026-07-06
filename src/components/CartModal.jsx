import React, { useState } from 'react';
import { SHAPES } from '../config/shapes';
import { MATERIALS } from '../config/pricing';
import { getLabelSheet } from '../config/labelSheets';
import CartItemPreview from './CartItemPreview';

export const SHIPPING_COST = 6;

const EMPTY_SHIPPING_ADDRESS = {
  name: '',
  street: '',
  city: '',
  state: '',
  zip: ''
};

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onCompleteOrder
}) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [shippingAddress, setShippingAddress] = useState(EMPTY_SHIPPING_ADDRESS);

  const updateShippingField = (field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };
  
  // Card payment form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  if (!isOpen) return null;

  const grandTotal = cartItems.reduce((acc, item) => acc + item.totalPrice, 0);
  const shippingCost = deliveryMethod === 'shipping' ? SHIPPING_COST : 0;
  const orderTotal = grandTotal + shippingCost;

  const handleCheckout = (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    if (deliveryMethod === 'shipping') {
      const { name, street, city, state, zip } = shippingAddress;
      if (!name.trim() || !street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
        alert('Please complete all shipping address fields.');
        return;
      }
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

    // FOR NOW: bypass payment and go straight to PDF download
    onCompleteOrder(cartItems, {
      paymentMethod,
      buyerName: cardName.trim() || 'Customer',
      orderDate: new Date().toISOString(),
      orderId: `#${Date.now().toString().slice(-10)}`,
      buyerId: Math.random().toString(36).slice(2, 19),
      deliveryMethod,
      shippingAddress: normalizedShipping,
      shippingCost
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sansUI">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Cart Panel Drawer */}
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 overflow-hidden animate-slide-in">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-luxury-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="text-xl font-bold font-serifHeading text-luxury-charcoal">Your Cart</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-luxury-charcoal transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-medium">Your shopping cart is currently empty.</p>
              <button 
                onClick={onClose}
                className="text-xs font-bold text-luxury-gold hover:underline"
              >
                Back to Designer
              </button>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-4">
                {cartItems.map((item, index) => {
                  const shapeName = SHAPES.find((s) => s.id === item.shape)?.name || item.shape;
                  const materialName = item.material
                    ? (MATERIALS.find((m) => m.id === item.material)?.name || item.material)
                    : 'Standard 4CP';

                  return (
                    <div key={index} className="flex space-x-4 p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                      {/* Canvas Screenshot Preview */}
                      <div className="w-20 h-20 bg-gray-900 border border-gray-200 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                        <CartItemPreview item={item} className="w-full h-full" />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-bold text-luxury-charcoal truncate">
                            Label Design #{index + 1}
                          </h4>
                          <button 
                            onClick={() => onRemoveItem(index)}
                            className="text-gray-400 hover:text-red-500 p-0.5"
                            title="Remove item"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 capitalize">
                          {shapeName} • {materialName.replace('-', ' ')}
                          {item.labelSheetId && ` • ${getLabelSheet(item.labelSheetId).name}`}
                        </p>
                        {item.textSegments?.length > 0 && (
                          <p className="text-[10px] text-gray-400 italic truncate mt-0.5">
                            &ldquo;{item.textSegments.map((s) => s.text).filter(Boolean).join(' · ')}&rdquo;
                          </p>
                        )}
                        <div className="flex justify-between items-baseline mt-2">
                          <span className="text-[10px] text-gray-400 font-semibold">{item.quantity} labels</span>
                          <span className="text-xs font-bold text-luxury-gold">${item.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <hr className="border-gray-100" />

              {/* Delivery */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 font-sansUI">
                  Delivery
                </h3>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-luxury-gold/50 has-[:checked]:border-luxury-gold has-[:checked]:bg-luxury-gold/5 transition-colors">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="pickup"
                      checked={deliveryMethod === 'pickup'}
                      onChange={() => setDeliveryMethod('pickup')}
                      className="mt-0.5 accent-luxury-gold"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-luxury-charcoal">Pickup</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">Free — pick up at the winery</span>
                    </span>
                    <span className="text-xs font-bold text-luxury-gold">Free</span>
                  </label>
                  <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-luxury-gold/50 has-[:checked]:border-luxury-gold has-[:checked]:bg-luxury-gold/5 transition-colors">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="shipping"
                      checked={deliveryMethod === 'shipping'}
                      onChange={() => setDeliveryMethod('shipping')}
                      className="mt-0.5 accent-luxury-gold"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-luxury-charcoal">Shipping</span>
                      <span className="block text-[10px] text-gray-500 mt-0.5">USPS delivery to your address</span>
                    </span>
                    <span className="text-xs font-bold text-luxury-gold">${SHIPPING_COST.toFixed(2)}</span>
                  </label>
                </div>
                {deliveryMethod === 'shipping' && (
                  <div className="space-y-3 p-3.5 bg-gray-50 border border-gray-100 rounded-lg">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Shipping address</p>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={shippingAddress.name}
                        onChange={(e) => updateShippingField('name', e.target.value)}
                        className="w-full p-2 text-xs border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Street address</label>
                      <input
                        type="text"
                        required
                        placeholder="123 Main St"
                        value={shippingAddress.street}
                        onChange={(e) => updateShippingField('street', e.target.value)}
                        className="w-full p-2 text-xs border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">City</label>
                      <input
                        type="text"
                        required
                        placeholder="Napa"
                        value={shippingAddress.city}
                        onChange={(e) => updateShippingField('city', e.target.value)}
                        className="w-full p-2 text-xs border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">State</label>
                        <input
                          type="text"
                          required
                          placeholder="CA"
                          value={shippingAddress.state}
                          onChange={(e) => updateShippingField('state', e.target.value)}
                          className="w-full p-2 text-xs border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">ZIP</label>
                        <input
                          type="text"
                          required
                          placeholder="94558"
                          value={shippingAddress.zip}
                          onChange={(e) => updateShippingField('zip', e.target.value)}
                          className="w-full p-2 text-xs border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* Order total */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-baseline text-gray-600">
                  <span>Subtotal</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-baseline text-gray-600">
                  <span>{deliveryMethod === 'shipping' ? 'Shipping (USPS)' : 'Pickup'}</span>
                  <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-luxury-charcoal">Order total</span>
                  <span className="text-2xl font-bold text-luxury-gold">${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Payment Section */}
              <form onSubmit={handleCheckout} className="space-y-4 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 font-sansUI">
                  Payment Method
                </h3>
                
                {/* Method Dropdown */}
                <div className="relative">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full text-xs font-semibold text-luxury-charcoal bg-white border border-gray-200 rounded-lg p-2.5 pr-10 hover:border-luxury-gold focus:border-luxury-gold focus:outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a0aec0%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_12px_center] bg-no-repeat transition-colors"
                  >
                    <option value="card">Standard Card (Visa/Mastercard)</option>
                    <option value="apple">Apple Pay</option>
                    <option value="google">Google Pay</option>
                  </select>
                </div>

                {/* Conditional Fields */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3 p-3.5 bg-gray-50 border border-gray-100 rounded-lg text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Cardholder Name
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Card Number
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="•••• •••• •••• ••••" 
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Expiry Date
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="MM/YY" 
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          CVV
                        </label>
                        <input 
                          type="text" 
                          required
                          placeholder="•••" 
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded focus:border-luxury-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'apple' && (
                  <div className="p-4 bg-black rounded-lg text-center cursor-pointer hover:bg-black/90 transition-colors flex items-center justify-center space-x-2">
                    <span className="text-white text-sm font-semibold"> Pay with Apple Pay</span>
                  </div>
                )}

                {paymentMethod === 'google' && (
                  <div className="p-4 bg-white border border-gray-200 rounded-lg text-center cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 shadow-sm">
                    <span className="text-gray-700 text-sm font-semibold flex items-center">
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google Pay
                    </span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full bg-luxury-gold text-luxury-charcoal hover:bg-luxury-gold/90 font-bold py-3.5 px-6 rounded-md tracking-wider uppercase transition-all shadow-md mt-4"
                >
                  {paymentMethod === 'card' ? 'Complete Card Payment' : `Proceed with ${paymentMethod === 'apple' ? 'Apple Pay' : 'Google Pay'}`}
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
