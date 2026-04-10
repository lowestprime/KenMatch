"use client";

import { useSearchParams } from "next/navigation";

export function CheckoutBanner() {
  const params = useSearchParams();
  const checkout = params.get("checkout");

  if (checkout === "success") {
    return (
      <div className="checkout-banner is-success" role="status">
        Payment received — your sponsorship commitment has been promoted to committed status. Thank you for backing useful work.
      </div>
    );
  }

  if (checkout === "cancelled") {
    return (
      <div className="checkout-banner is-cancelled" role="status">
        Checkout was cancelled. Your pledge is still recorded as projected support — you can try again or switch to simulated funding.
      </div>
    );
  }

  return null;
}
