# Solstice Hotel

A hotel booking application with searchable availability, room inventory, reservations, lookup, cancellation and an inventory management view. The UI uses Philippine pesos and Manila dates. Room prices and guest information are stored in Cloudflare D1 SQLite. Reservations are confirmed without online payment; the amount is due at the hotel.

Portfolio demonstration by RowLee Tanawan. The implementation uses Next.js-compatible App Router APIs with the Vinext runtime; deployment targets Cloudflare Workers. It is not a conventional standalone `next dev` deployment.

## Features

- Pick check-in and check-out dates (1–30 nights) and guests; availability excludes confirmed, overlapping reservations and rooms in maintenance.
- Reserve a room with guest details. The server assigns the physical room atomically and returns a reference such as `SH-1234ABCD`.
- Look up a reservation with its reference and email. Cancel a confirmed reservation before its check-in date.
- In the management tab, add room types and physical rooms, set rooms to maintenance, and view upcoming reservations.

## Technology

React, TypeScript, Next.js-compatible App Router, Vinext, Vite and responsive CSS. Cloudflare D1 SQLite and Drizzle migrations provide persistent data.

## Run locally

Node.js 22.13+ is required. Follow [installation, database initialization and walkthrough instructions](docs/SETUP.md), including the project-specific migration command. Dependencies and local database files are excluded from source control.

## Screenshots

Actual application screenshots are pending capture. No mockup is presented as a running application screenshot.

## Project layout

- `app/page.tsx`: application interface
- `app/globals.css`: responsive styling
- `app/api/`: server workflows, where applicable
- `db/` and `drizzle/`: schema and migrations, where applicable
- `docs/SETUP.md`: full setup, workflow rules and limitations

## Demo scope

Use fictional data for portfolio demonstrations. See [documented limitations](docs/SETUP.md) before deployment; authentication, payment integrations and operational safeguards vary by project and are not implied by the portfolio presentation.
