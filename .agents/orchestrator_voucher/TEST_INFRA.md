# E2E Test Infra: Voucher Optimization

## Test Philosophy
- Opaque-box, requirement-driven.
- Focus on concurrency robustness (double checkout prevention) and edge cases (undefined discountValue).

## Feature Inventory
| # | Feature | Source | Tier 1 | Tier 2 | Tier 3 |
|---|---------|--------|:------:|:------:|:------:|
| 1 | Voucher Validation | ORIGINAL_REQUEST | 5 | 5 | ✓ |
| 2 | Double Checkout Prevention | ORIGINAL_REQUEST | 5 | 5 | ✓ |
| 3 | Order Cancel Rollback | ORIGINAL_REQUEST | 5 | 5 | ✓ |
| 4 | Frontend UX & Direct Apply | ORIGINAL_REQUEST | 5 | 5 | ✓ |

## Test Case Design Methodology
- **Tier 1 - Feature Coverage**:
  - Test valid percentage voucher application.
  - Test valid fixed voucher application.
  - Test validation with too low order value.
  - Test expired voucher rejection.
  - Test unavailable voucher rejection.
- **Tier 2 - Boundary & Corner Cases**:
  - Test voucher with undefined `discountValue` (should not crash backend, should return 0 discount or fail gracefully).
  - Test voucher at exactly the min order amount.
  - Test voucher with exactly max uses reached.
  - Test cancellation of an order that has a voucher (verify usedCount is decremented).
  - Test checkout with voucher where order creation fails (verify usedCount is NOT incremented or rolled back).
- **Tier 3 - Concurrency**:
  - Simulating 5 concurrent checkouts for a voucher with maxUses=1. Only 1 must succeed; 4 must fail with error.
- **Tier 4 - Real-World Application Scenarios**:
  - A user adds items, applies a voucher, goes to checkout, VNPay payment fails/cancelled, then tries again with the same voucher. The second attempt should succeed.
  - A user creates an order with a voucher but leaves it unpaid, then returns to cart, adds more items, and checkouts again with the same voucher. The first unpaid order should be cancelled, releasing the voucher, and the second checkout should succeed.
