# Security Specification: LedgerDay Budget Application

## 1. Data Invariants
1. **User Data Isolation**: A user can only access, query, create, update, or delete their own transactions and settings under `/users/{userId}/...`. No user may read another user's financial ledger or budget data.
2. **Owner Identity Invariant**: For every document write, `userId` in the payload must strictly match the authenticated user's UID (`request.auth.uid`).
3. **Transaction Immutability of Origin**: `userId` and `id` cannot be modified during transaction updates.
4. **Valid Amount & Type**: Budget amounts must be positive numbers (`amount > 0`). Type must be strictly `'add'` or `'minus'`.
5. **Path Hardening**: Document IDs and path variables must be valid alphanumeric strings of reasonable length (`<= 128`).
6. **Default Deny**: All unmapped collections or paths outside `/users/{userId}/...` are blocked for both reads and writes.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)

1. **Unauthenticated Read on User Profile**: Attempting to read `/users/user123` when `request.auth == null`.
2. **Cross-User Profile Read**: User `attacker456` attempting to read `/users/victim123`.
3. **Identity Spoofing on Transaction Create**: User `attacker456` attempting to create `/users/victim123/transactions/tx1` with `userId: 'victim123'`.
4. **Payload Hijacking (User UID mismatch)**: User `attacker456` attempting to create `/users/attacker456/transactions/tx1` with `userId: 'victim123'`.
5. **Negative Amount Injection**: User attempting to create transaction with `amount: -500.0`.
6. **Invalid Transaction Type**: User attempting to create transaction with `type: 'admin_transfer'` instead of `'add'` or `'minus'`.
7. **Ghost Field / Shadow Property Injection**: User attempting to insert unexpected fields like `isSuperAdmin: true` or `verifiedStatus: true`.
8. **Resource Exhaustion String Injection**: User attempting to set description `title` exceeding 200 characters or `notes` exceeding 500 characters.
9. **Invalid Path ID Poisoning**: Document ID with directory traversal or illegal characters like `../../secret`.
10. **Tampering with Owner ID on Update**: Attempting to change `userId` from `attacker456` to `victim123` during update.
11. **Cross-User Listing Attack**: Attacker querying `/users/victim123/transactions` collection.
12. **Modifying Another User's Budget Config**: Attacker trying to write to `/users/victim123/settings/budgetConfig`.

## 3. Test Runner
Refer to `firestore.rules.test.ts` for unit test specifications verifying default deny and owner verification.
