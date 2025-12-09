# Adventure Time Project Logic Guide

This document outlines the core logic of the Adventure Time booking platform based on codebase analysis.

## 1. Core Technologies

-   **Framework:** Next.js (App Router)
-   **Language:** TypeScript
-   **Database:** MongoDB (using Mongoose ODM)
-   **Payment Provider:** Netopia (MobilPay)
-   **Styling:** Tailwind CSS
-   **Authentication:** Likely NextAuth.js (suggested by `lib/auth.ts`) or custom JWT/session logic.

## 2. Database Structure (`lib/models/`)

The project uses MongoDB with Mongoose schemas defined in `lib/models/`. Key models include:

-   `adventure.ts`: Defines the bookable services/adventures. Stores details like title, description, price, advance payment percentage, duration, dates, location, difficulty, images, requirements, included/excluded items, cutoff hours for booking, etc.
-   `user.ts`: Defines user accounts. Stores name, email, hashed password, phone, address, sign-up date, and importantly, an embedded array of the user's orders.
-   `booking.ts`: Defines the main booking records. **This is the primary collection for storing all bookings.** Contains `orderId` (custom unique ID), `adventureId`, `userId`, `username` (denormalized), adventure details (copied), dates, price details, quantity, status, comments, and payment information. Uses `timestamps: true`.
-   `paymentIntent.ts`: Stores details about payment intent attempts, linking `userId`, `bookingId`, `orderId`, status, amount, currency, and Netopia-specific details. Seems to track the lifecycle of a payment attempt.
-   `coupon.ts`: Defines discount coupons.
-   `blog.ts`: Defines blog posts.

## 3. Order/Booking Storage

Order/Booking data is stored in **two locations**:

1.  **Primary Storage (`bookings` collection):** Defined by `lib/models/booking.ts`. Each booking is a separate document in this collection. Contains comprehensive details including links (`userId`, `adventureId`), calculated prices, payment details, status, and copied adventure information. This collection is likely used for admin panel views and direct booking management.
2.  **Embedded Storage (`users` collection):** Defined by `OrderSchema` *within* `lib/models/user.ts`. An array named `orders` within each User document holds copies of that user's bookings. This schema is similar but not identical to the main `BookingSchema`. It includes fields like `orderId`, dates, `products` (seems to be adventure details), `total` (price), `advancePayment`, `status`, payment details, and a nested `details` object containing extensive adventure information copied at the time of booking. This is likely used for quickly displaying a user's order history in their profile without querying the main `bookings` collection.

**Data Consistency:** The system must ensure that when a booking is created or updated (e.g., status change, payment details), the changes are reflected in *both* the `bookings` collection document and the corresponding embedded order object within the relevant `users` collection document. This logic is primarily handled in the server actions (`lib/actions/`).

## 4. Booking Creation & Price Calculation (`lib/actions/booking.ts`)

-   The `createBooking` server action handles new booking creation.
-   **Inputs:** `adventureId`, `userId`, `bookingDate`, `quantity`, `comments`.
-   **Process:**
    1.  Fetches the relevant `Adventure` and `User`.
    2.  Performs booking time validation (cannot book in the past, respects `bookingCutoffHour`).
    3.  Generates a unique `orderId` (e.g., `ADV-XXXXXXXX`).
    4.  **Price Calculation:**
        -   `totalPrice = adventure.price * quantity`
        -   `advancePaymentAmount = round(totalPrice * (adventure.advancePaymentPercentage / 100))`
    5.  Determines `startDate` and `endDate`.
    6.  Creates a new document in the `bookings` collection, storing `adventure.price` (per person), `quantity`, calculated `advancePaymentAmount`, initial `status` ('pending' if advance payment > 0, else 'awaiting confirmation'), and copies relevant adventure details.
    7.  Pushes a corresponding embedded order object into the `User.orders` array, storing the calculated `totalPrice` and `advancePaymentAmount`, initial `status`, and copies extensive adventure details into the `details` subdocument.
    8.  Sends a confirmation email.
-   **Result:** A new booking record exists in the `bookings` collection, and a copy exists in the user's profile.

## 5. Payment Intent/URL Generation (`lib/actions/payment.ts`)

-   The `initiateNetopiaPayment` server action handles starting the payment process.
-   **Inputs:** `bookingId`.
-   **Process:**
    1.  Fetches the `Booking` and associated `User`.
    2.  Retrieves Netopia credentials and API endpoint URL from environment variables.
    3.  Determines the `paymentAmount` (uses `advancePaymentAmount` from the booking if > 0, otherwise the full `booking.price`). Note: `booking.price` stores the *per-person* price, so this might need review if `quantity` > 1 and only advance is paid. *Correction: `createBooking` stores the per-person price in `booking.price`, but the calculated `advancePaymentAmount` is based on the total price (`adventure.price * quantity`). `initiateNetopiaPayment` correctly uses `booking.advancePaymentAmount` or `booking.price` (which assumes quantity 1 if full price is used here - potential edge case?).* It seems `initiateNetopiaPayment` might assume the `booking.price` field represents the total price *if* advance payment wasn't calculated/required, which could be inconsistent if quantity > 1. However, `advancePaymentAmount` *is* calculated based on total price, so using that primary seems correct. Let's assume `booking.price` is primarily for display or reference and the logic focuses on `advancePaymentAmount` when applicable.
    4.  Constructs a payload for the Netopia `/payment/card/start` API, including `notifyUrl` (pointing to the webhook endpoint `/api/webhooks/netopia`), `redirectUrl`, `orderId`, amount, currency, and billing details.
    5.  Calls the Netopia API.
    6.  On success, receives a `paymentURL`.
    7.  Updates the `Booking` document: sets `paymentUrl`, sets `status` to `pending_payment`, stores basic `paymentDetails` (attempt number, type, amount).
    8.  Updates the corresponding embedded order in the `User.orders` array: sets `paymentUrl`, sets `status` to `pending_payment`, stores `paymentDetails`.
    9.  Returns the `paymentUrl` to the frontend.
-   **Result:** The booking status is updated, the payment URL is stored, and the user is redirected to Netopia to complete the payment.

## 6. Order Confirmation & Final Storage (Webhooks & Admin Actions)

1.  **Webhook Handling (`lib/actions/payment.ts -> handleNetopiaWebhook`, triggered by `app/api/webhooks/netopia/route.ts`):**
    *   Netopia sends an asynchronous notification to the `/api/webhooks/netopia` endpoint upon payment completion/failure.
    *   The `handleNetopiaWebhook` action verifies the webhook signature/data.
    *   It finds the `Booking` document using the `orderId` from the webhook payload.
    *   It updates the `Booking` document: sets `status` (e.g., `payment_confirmed`, `declined`), stores detailed transaction info in `paymentTransactionDetails`.
    *   It updates the corresponding embedded order in `User.orders` similarly (status, `paymentTransactionDetails`).
    *   It likely sends a payment confirmation/failure email.
2.  **Manual Confirmation (`lib/actions/booking.ts -> updateBookingStatus`, triggered by Admin Panel):**
    *   Bookings might enter a state like `payment_confirmed` or `awaiting confirmation` (if no payment needed or in dev mode).
    *   An administrator likely uses the Control Panel (`app/control-panel/`) to view these bookings.
    *   The admin can manually change the status (e.g., to `confirmed`, `cancelled`) using UI elements that call the `updateBookingStatus` server action.
    *   `updateBookingStatus` updates the `status` field in *both* the `Booking` document and the embedded `User.orders` item.
    *   It potentially sends a final confirmation email.
3.  **Final State:** A confirmed order has its `status` set to `confirmed` (or `completed`, `cancelled`, etc.) in both the `bookings` collection and the `users` collection's embedded `orders` array. All relevant details (dates, prices, user info, payment transaction details) are persisted in these records.

## 7. Admin Control Panel (`app/control-panel/`)

-   Provides an interface for administrators to manage the platform.
-   **Order Display:**
    *   Likely fetches all booking data by calling the `getAllBookings()` server action (`lib/actions/booking.ts`).
    *   `getAllBookings()` queries the `bookings` collection.
    *   Displays bookings in a table/list, showing key details like Order ID, User, Adventure, Dates, Price, Status.
-   **Order Management:**
    *   Allows admins to view booking details.
    *   Provides functionality to update booking status (Confirm, Cancel, Complete) by calling the `updateBookingStatus` action.
    *   May include other management features (e.g., managing adventures, users, coupons).

## 8. Key Logic Files Summary

-   **Models:** `lib/models/` (user.ts, booking.ts, adventure.ts, paymentIntent.ts) - Data structure.
-   **Booking Actions:** `lib/actions/booking.ts` - Create, read, update (status), delete bookings; handles data consistency between `bookings` and `user.orders`.
-   **Payment Actions:** `lib/actions/payment.ts` - Initiate Netopia payment, handle webhooks.
-   **Payment Webhook Route:** `app/api/webhooks/netopia/route.ts` (likely) - Receives Netopia notifications and calls `handleNetopiaWebhook`.
-   **Booking Frontend:** `app/booking/` (likely) - UI for selecting adventure dates and initiating booking.
-   **Admin Frontend:** `app/control-panel/` - UI for viewing and managing bookings.
-   **Database Connection:** `lib/db.ts` - Connects to MongoDB.
-   **Email:** `lib/email.ts` - Sends transactional emails. 