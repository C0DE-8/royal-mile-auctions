# Site Improvements And Mailer Plan

## Current Read

The site already has the main auction loop in place:

- Public frontend pages for home, inventory, vehicle detail, bid, buyer info, dashboard, contact, sell vehicle, and not found.
- Buyer flow for registration, login, vehicle selection, bid submission, wallet payment submission, and dashboard history.
- Admin flow for login, inventory CRUD, multiple vehicle images, bid review, demo bid creation, auction closing, crypto wallet CRUD, and user listing.
- Backend Express API with MySQL tables for users, auction items, auction item images, bids, payments, and wallets.

The biggest missing piece is operational communication. Admins can see users and auction activity, but they cannot message buyers from the dashboard yet.

## UI Additions

- [x] Add an admin `Mailer` tab after `Users`.
- [x] Add a compact admin email composer with recipient mode, recipients, subject, message body, and send action.
- [x] Let admin choose between `Manual email`, `Selected users`, and `All active buyers`.
- [x] Add checkboxes to the user list so admins can pick users before switching to the mailer.
- [x] Show selected recipient count in the mailer tab and in the user table toolbar.
- [x] Add a preview panel showing subject, recipient count, and message body before sending.
- [x] Add success/error toast feedback after send.
- [x] Add disabled/loading states while sending email.
- [x] Add a simple sent-message history list in admin, even if the first version only stores logs.
- [x] Improve admin dashboard metrics with total users, active bids, pending payments, and recently closed auctions.
- [ ] Add clearer empty states for bids, users, wallets, and mail history.
- [x] Add per-row user actions: edit role, activate/deactivate, and email user.
- [x] Add admin payment review tab with search, status filter, confirm/reject actions, and email-buyer shortcut.
- [x] Keep buyer bid page synced with backend bid history after logout/login.
- [x] Show bidder standings with one visible row per buyer and a clear highest-bidder label.
- [x] Let admin reuse a past demo bidder for top-up bids.
- [x] End auction from admin Bids tab and move the highest bidder into won cars.

## Flow Additions

- [x] From `Users`, admin can select one or more users and click `Email selected`.
- [x] From `Bids`, admin can email a bidder directly from a bid row.
- [x] From auction close success, admin can email the winning bidder.
- [x] From `Mailer`, admin can type one email manually when the recipient is not yet a registered user.
- [x] Require a confirmation step before sending to multiple users.
- [x] Show the send result: delivered, failed, skipped invalid email, or queued.
- [x] Keep the admin on the mailer form if validation fails so the message is not lost.


## the mail information 

server: server200.web-hosting.com
Email: info@middlesvilletrustedloans.com
password: OYXEu7&p!5f&$88


## Backend Additions

- [x] Add a mail provider dependency, preferably `nodemailer` for SMTP or a transactional provider SDK later.
- [x] Add mail environment variables:
  - [x] `MAIL_HOST`
  - [x] `MAIL_PORT`
  - [x] `MAIL_SECURE`
  - [x] `MAIL_USER`
  - [x] `MAIL_PASS`
  - [x] `MAIL_FROM`
- [x] Create `backend/src/services/mailer.js` for transport setup and send logic.
- [x] Add validation for recipients, subject, and message body.
- [x] Add `POST /api/admin/emails/send`.
- [x] Accept request body with `recipientMode`, `emails`, `userIds`, `subject`, and `body`.
- [x] Resolve `userIds` to active user emails on the backend.
- [x] Reject empty subject or body.
- [x] Reject sends with no valid recipients.
- [x] Enforce admin authentication through the existing `authenticate` and `requireAdmin` middleware.
- [x] Return a clear summary: total requested, sent count, failed count, and failed recipients.
- [x] Add a send cap before allowing large sends.
- [x] Add a database table for email logs.
- [x] Add auction fee field to auction items.
- [x] Add won-item tracking table for closed auctions.
- [x] Add fee payment receipt upload support.
- [x] Add user won-items endpoint.
- [x] Add admin won-items endpoint and status update route.
- [x] Keep won items on hold until the fee payment is confirmed.
- [x] Add bid activity summary endpoint with current high bid and minimum next bid.
- [x] Reuse existing bidder account when admin submits a demo top-up bid.
- [x] Verify auction close creates a won item for the highest bidder.

## Suggested Email Log Table

```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT UNSIGNED NOT NULL,
  recipient_email VARCHAR(190) NOT NULL,
  recipient_user_id INT UNSIGNED,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status ENUM('sent', 'failed') NOT NULL,
  error_message TEXT,
  provider_message_id VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_email_logs_admin FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_email_logs_recipient_user FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_email_logs_admin (admin_user_id),
  INDEX idx_email_logs_recipient_email (recipient_email),
  INDEX idx_email_logs_status (status)
);
```

## Frontend Implementation Checklist

- [x] Update `frontend/src/api/admin.js` with:
  - [x] `sendAdminEmail(token, payload)`
  - [x] `fetchAdminEmailLogs(token)` if logs are added immediately
- [x] Update `frontend/src/pages/Admin/AdminPage.jsx`:
  - [x] Add `Mailer` to `adminTabs`.
  - [x] Add mailer form state: recipient mode, manual emails, selected user IDs, subject, body.
  - [x] Add user selection state.
  - [x] Add `handleEmailSubmit`.
  - [x] Add recipient count and validation messages.
  - [x] Add email action buttons in `Users` and `Bids`.
- [x] Update `frontend/src/App.css`:
  - [x] Mailer form layout.
  - [x] Recipient chips or selected user list.
  - [x] Preview panel.
  - [x] User table checkbox column.
  - [x] Mobile layout for the mailer and user selection flow.

## Backend Implementation Checklist

- [x] Install mail dependency in `backend`.
- [x] Add mail configuration to backend README.
- [x] Add `backend/src/services/mailer.js`.
- [x] Add email route handlers in `backend/src/routes/admin.js` or split into `backend/src/routes/adminEmails.js`.
- [x] Add migration for `email_logs`.
- [x] Add email log mapper if needed.
- [x] Add tests or manual API checks for:
  - [x] Manual recipient send.
  - [x] Selected user send.
  - [x] Invalid email rejection.
  - [x] Empty subject/body rejection.
  - [x] Unauthenticated rejection.
  - [x] Non-admin rejection.
  - [x] All active buyer send.
  - [x] Payment status update.
  - [x] Buyer bid summary reload after existing bids.
  - [x] Admin demo bidder reuse.
  - [x] Admin auction close creates won item.

## Recommended Build Order

- [x] Backend mail service and environment config.
- [x] Admin send endpoint with manual email support.
- [x] Admin mailer UI tab with manual email support.
- [x] User selection in admin users table.
- [x] Selected-user send support.
- [x] Email logs table and admin history.
- [x] Bid-row and auction-close shortcuts.
- [x] Bulk send safeguards.

## Notes

- Start with SMTP through `nodemailer` because it keeps the first implementation provider-neutral.
- For production delivery, use a transactional email provider account rather than a personal inbox SMTP account.
- Bulk email should be limited until unsubscribe/compliance requirements are clear.
- Message body should be plain text in version one. Rich HTML templates can come later after the core flow works.
