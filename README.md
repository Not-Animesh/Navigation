# Galgotias University -- Indoor Campus Navigation System

A web-based campus navigation application for exploring Galgotias
University, finding campus blocks, discovering facilities, and accessing
navigation tools.

## 1. Project Overview

### Features

-   **Dashboard:** Campus overview and quick links.
-   **Campus Map:** Interactive Google Maps view of the university
    campus.
-   **Navigation:** Route-planning interface with QR-code scanning
    support.
-   **Campus Directory:** Browse campus blocks and available directory
    categories.
-   **Settings:** Configure appearance, map preferences, navigation
    options, and accessibility preferences.
-   **QR Scanner:** Scan supported campus-location QR codes from the
    Navigation section.

### Campus Blocks

-   A-Block
-   B-Block
-   C-Block
-   AI-ML Block

The floor selector includes Ground, First, Second, Third, Fourth, and
Fifth Floors.

> The floor selector provides six floor-level options. It does not mean
> verified indoor maps or room-level routes are available for every
> block and floor.

## 2. Technology Stack

  Technology                    Purpose
  ----------------------------- -----------------------------
  Next.js                       React application framework
  React                         User interface
  TypeScript                    Type safety
  Tailwind CSS                  Styling
  Lucide React                  Icons
  Google Maps JavaScript API    Interactive campus map
  `@googlemaps/js-api-loader`   Loading Google Maps
  `html5-qrcode`                QR-code scanning
  pnpm                          Package management

## 3. Prerequisites

Install the following before setting up the project:

-   **Node.js:** Download from https://nodejs.org/
-   **pnpm:** Install with `npm install -g pnpm`
-   **Git (optional):** Download from https://git-scm.com/
-   **Visual Studio Code (recommended):** https://code.visualstudio.com/

Verify the installations:

``` bash
node -v
npm -v
pnpm -v
git --version
```

Use a Node.js version supported by the dependencies in this project.

## 4. Download or Clone the Project

### Option A: Clone using Git

``` bash
git clone YOUR_REPOSITORY_URL
cd navigation
```

Replace `YOUR_REPOSITORY_URL` with the actual repository URL. If the
cloned folder has a different name, enter that folder instead.

### Option B: Download ZIP

1.  Open the project's repository.
2.  Select **Code → Download ZIP**.
3.  Extract the ZIP file.
4.  Open the extracted folder in Visual Studio Code.

Open the terminal in the project root, where `package.json` is located.

## 5. Install Dependencies

Run this command from the project root:

``` bash
pnpm install
```

This installs the dependencies listed in `package.json`. Keep the
`pnpm-lock.yaml` file with the project.

## 6. Configure the Google Maps API Key

The campus map uses the Google Maps JavaScript API. Each person setting
up the project should configure their own API key.

### Step 1: Open Google Cloud Console

Visit https://console.cloud.google.com/ and sign in with a Google
account.

### Step 2: Create a Google Cloud project

1.  Open the project selector.
2.  Select **New Project**.
3.  Enter a project name, such as `GU Campus Navigation`.
4.  Create the project and select it.

### Step 3: Enable Maps JavaScript API

1.  Open **APIs & Services → Library**.
2.  Search for **Maps JavaScript API**.
3.  Open it and select **Enable**.

Google Maps Platform may require billing to be enabled. Check the
current requirements in Google Cloud Console.

### Step 4: Create an API key

1.  Open **APIs & Services → Credentials**.
2.  Select **Create Credentials → API key**.
3.  Copy the generated key.

### Step 5: Create `.env.local`

In the project root---the same folder that contains
`package.json`---create a new file named:

``` text
.env.local
```

Example project layout:

``` text
navigation/
├── public/
├── src/
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tsconfig.json
├── .gitignore
└── .env.local
```

On Windows, make sure the filename is exactly `.env.local`, not
`.env.local.txt`. In VS Code, use **New File** in the project root.

### Step 6: Add the API key

Open `.env.local` and add:

``` env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

Replace the placeholder with the key from Google Cloud Console. Do not
include quotation marks.

Example format (not a working key):

``` env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy_REPLACE_WITH_YOUR_REAL_KEY
```

### Step 7: Restrict the API key

In Google Cloud Console, open the API key settings and configure
restrictions:

-   **Application restriction:** Websites (HTTP referrers).
-   **API restriction:** Restrict to Maps JavaScript API.
-   **Local development referrer:** `http://localhost:3000/*`
-   **Production referrer:** Add the actual deployed website domain.

The `NEXT_PUBLIC_` prefix makes this key available to browser-side code.
It is not a secret. Protect it with website and API restrictions and
monitor its usage.

### Step 8: Restart the development server

If the server is already running, stop it with `Ctrl + C`, then start it
again:

``` bash
pnpm dev
```

Next.js reads environment variables when the server starts.

## 7. Run the Application

Start the development server from the project root:

``` bash
pnpm dev
```

Open http://localhost:3000 in your browser.

### Application Routes

  Route           Description
  --------------- -------------------------------------
  `/`             Redirects to the dashboard
  `/dashboard`    Main dashboard
  `/campus-map`   Interactive campus map
  `/navigation`   Navigation interface and QR scanner
  `/directory`    Campus directory
  `/settings`     Application settings

## 8. Build for Production

Create a production build:

``` bash
pnpm build
```

If the build completes successfully, start the production server:

``` bash
pnpm start
```

To check available scripts, inspect the `scripts` section of
`package.json`. If a lint script is defined, run:

``` bash
pnpm lint
```

## 9. Environment Variables

  -----------------------------------------------------------------------------------
  Variable                            Purpose                 Required
  ----------------------------------- ----------------------- -----------------------
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`   Google Maps JavaScript  Yes
                                      API key                 

  -----------------------------------------------------------------------------------

Example `.env.local`:

``` env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

### Environment file safety

-   Do not commit `.env.local` to Git.
-   Confirm `.env.local` is listed in `.gitignore`.
-   Do not send your personal API key to another person.
-   Each developer should create their own `.env.local` and use their
    own restricted key.
-   If a key is exposed, rotate or replace it in Google Cloud Console.

## 10. Troubleshooting

### Google Maps does not load

Check that: - `.env.local` is in the project root. - The variable name
is exactly `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. - The API key is
correct. - Maps JavaScript API is enabled. - Billing is configured if
required. - The key restrictions allow the current website origin. - The
development server was restarted after editing `.env.local`.

Check the browser developer console for Google Maps API errors. These
can identify an invalid key, referrer restriction, disabled API, or
billing issue.

### Environment variable is undefined

-   Confirm the file is named `.env.local`, not `.env.local.txt`.
-   Confirm it is beside `package.json`.
-   Check the variable name for spelling mistakes.
-   Do not put `export` before the variable.
-   Restart the Next.js development server after changing the file.

### Dependency installation fails

Check versions:

``` bash
node -v
pnpm -v
```

Then retry:

``` bash
pnpm install
```

Use the package manager and lockfile intended for this repository. Avoid
deleting the lockfile without a specific reason.

### QR scanner cannot access the camera

-   Allow camera permission in the browser.
-   Check that the camera is connected and available.
-   Use `http://localhost:3000` for local development.
-   Deployed websites should use HTTPS because camera access normally
    requires a secure context.

## 11. Project Structure

This is a high-level overview of the Next.js App Router structure.
Additional component and utility files may exist.

``` text
navigation/
├── public/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── campus-map/
│   │   │   ├── navigation/
│   │   │   ├── directory/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   └── lib/
│       ├── campus/
│       └── google-maps-loader.ts
├── .env.local
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
└── tsconfig.json
```

## 12. Current Implementation Notes

-   The outdoor campus map uses Google Maps.
-   The application includes selectors for four campus blocks and six
    floor levels.
-   Indoor floor selection is manual; the application does not
    automatically detect the user's floor.
-   Accurate indoor navigation requires verified floor plans, room
    locations, and route connections.
-   QR scanning requires supported campus-location QR codes.
-   Navigation accuracy depends on verified campus location and route
    data.

Do not assume every listed floor has a verified indoor map or that all
room-level routes have been surveyed.

## 13. Quick Setup

``` bash
# 1. Enter the project directory
cd navigation

# 2. Install dependencies
pnpm install

# 3. Create .env.local in the project root
# Add your own Google Maps API key:
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# 4. Start the development server
pnpm dev
```

Open http://localhost:3000 in your browser.

## 14. Project Information

-   **Project Name:** Galgotias University -- Indoor Campus Navigation
    System
-   **Project Type:** Academic Web Application
-   **Framework:** Next.js
-   **Language:** TypeScript
-   **Package Manager:** pnpm
-   **Map Provider:** Google Maps Platform

------------------------------------------------------------------------

*End of README*
