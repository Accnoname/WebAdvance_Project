# Handoff Report — Cart & Reservation Optimization Orchestration

## Milestone State
- **Milestone 1**: Plan & Dispatch [DONE]
- **Milestone 2**: Codebase Exploration [DONE]
- **Milestone 3**: Synthesis & Proposal [DONE]
- **Milestone 4**: Audit & Victory [IN_PROGRESS]

## Active Subagents
- None (All subagents completed). `explorer_1` (Conv ID: `5de33a62-8bfc-4c7d-80c7-8370b5f610e1`) has completed its exploration and returned its findings.

## Pending Decisions
- None.

## Remaining Work
- Trigger the Victory Auditor to verify completeness and correctness of the final report.

## Key Artifacts
- `d:\Web Nhà Hàng\.agents\orchestrator\ORIGINAL_REQUEST.md` — Copy of verbatim user request
- `d:\Web Nhà Hàng\.agents\orchestrator\plan.md` — Orchestrator plan
- `d:\Web Nhà Hàng\.agents\orchestrator\progress.md` — Progress tracker
- `d:\Web Nhà Hàng\.agents\orchestrator\cart_reservation_optimization.md` — Synthesized final optimization report & code proposals

---

## Observation & Analysis Summary

### Observation
- Frontend: `CartPage.jsx` and `cartStore.js` mismatch on `variant` parameters and undefined variable `variant` in `updateNote` causing runtime crash.
- Transition: `ReservationPage.jsx` groups preorder items purely by item ID, erasing separate notes/variants, and does not forward note/variant in the payload.
- Backend: `reservation.service.js` creates orders directly bypassing service logic, fails to set `table.currentOrder` upon customer arrival (`da_den`), and does not reset table status to `trong` when a reservation is canceled (`da_huy`).
- Database: `Cart` and `Order` schemas are missing the `variant` field.

### Logic Chain
1. Mismatch of parameters and undefined variables in `cartStore.js` leads to instant runtime crashes and incorrect data formatting when modifying items in the cart.
2. Destructive gộp món in `ReservationPage.jsx` wipes out custom specifications, creating mismatch between customer expectation and actual kitchen production.
3. Lack of table `currentOrder` association on check-in makes staff unable to retrieve or modify active orders from the POS table view, breaking POS functionality.
4. Absence of table release on reservation cancellation locks the table indefinitely, leading to artificial capacity shortage and operational errors.

### Caveats
- State analysis was conducted statically.
- Ensure the database migration (adding `variant` fields) is handled carefully if data exists.

### Conclusion
- Implementation of the proposed store parameter fixes, custom unique key grouping, database schema update, and status-sync adjustments on check-in and cancel will solve all 11 issues.

### Verification Method
- Perform manual verification: add items with notes/variants, edit notes (no crash), reserve table, verify no gộp món, check-in reservation, verify table state and `currentOrder` on staff screen, cancel reservation, verify table status is 'trong'.
