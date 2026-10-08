# Solstice Hotel — Next.js booking project

A hotel booking application with searchable availability, room inventory, reservations, lookup, cancellation and an inventory management view. The UI uses Philippine pesos and Manila dates. Room prices and guest information are stored in Cloudflare D1 SQLite. Reservations are confirmed without online payment; the amount is due at the hotel.

## Requirements

- Node.js 22.13+ and pnpm 11+
- Cloudflare Wrangler for local D1, included in the dependencies

## Run locally

1. Extract this ZIP and open the `solstice-hotel` folder.
2. Run `corepack enable` and `pnpm install`.
3. Run `pnpm db:generate` only if you modify `db/schema.ts`; the initial migration is included.
4. Run `pnpm dev`. Open the address printed by the development server.
5. On the Rooms page, select **Load sample rooms** to create four room types and 12 rooms. This seed action can only be run once on an empty inventory.

The included `.openai/hosting.json` requests a D1 binding named `DB` for deployment with Sites. `scripts/sites-env.mjs` and the framework runner set up the local Workers environment. If you deploy independently from Sites, configure an equivalent Cloudflare D1 database named `DB`, apply `drizzle/0000_breezy_blackheart.sql`, and adapt the build/runtime scripts as needed.

## Main flows

- Pick check-in and check-out dates (1–30 nights) and guests; availability excludes confirmed, overlapping reservations and rooms in maintenance.
- Reserve a room with guest details. The server assigns the physical room atomically and returns a reference such as `SH-1234ABCD`.
- Look up a reservation with its reference and email. Cancel a confirmed reservation before its check-in date.
- In the management tab, add room types and physical rooms, set rooms to maintenance, and view upcoming reservations.

## Important setup before public use

This is a working demonstration. The management tab and mutation API have no staff authentication. Add role-based authentication, authorization checks, abuse controls and operational policies before exposing it to untrusted users. Email/SMS delivery, payment capture and refunds are not implemented. For production operations, review taxes, cancellation rules, privacy retention and confirmation workflows for your locale.

## Checks

`pnpm exec tsc --noEmit` checks types. `pnpm build` builds the Workers-compatible Next.js app.
