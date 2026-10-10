# CardStudio — Digital Business Card Template Gallery

A frontend prototype for the digital business card project. It includes a searchable/filterable gallery of 25 reusable visual templates, a live preview, a template selection state, and a demo preview editor for name, role, company, and website.

## Stack
- Next.js 14 / React / TypeScript
- Tailwind CSS (with custom responsive CSS for precise template styling)
- Lucide icons

## Run locally
1. Install Node.js 18.17+ (Node.js 20 LTS recommended).
2. Extract this ZIP.
3. Open a terminal in this folder and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:3000

## What works in this prototype
- 25 distinct template presets, inspired by the supplied screenshots
- Template gallery with category filters and text search
- Selected-template state and live preview
- Responsive gallery and mobile-style preview frame
- Preview modal with editable demo name, job title, company, and website
- Shared profile data across every template

## Not connected yet
This is the frontend stage. It does not yet save users/cards to MySQL, provide authentication, generate production QR codes, publish public card URLs, or connect to a Node/Express API. Those are the next integration steps.

## Important customization
- Template metadata and palette/layout choices: `src/app/page.tsx` in the `templates` array.
- Shared sample card data: `initialCard` in `src/app/page.tsx`.
- Template layouts/styles: `src/app/globals.css`.
- Shared renderer: `CardPreview` component in `src/app/page.tsx`.

## Production follow-up
Before production, replace demo social links and sample profile content, use uploaded profile/logo images, add form validation, persist selection through an API, and configure canonical public card slugs.
