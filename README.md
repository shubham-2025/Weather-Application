# 🌦️ Weather App

A modern, elegant **Weather Application** built with **Vite + React + TypeScript**, styled using **Tailwind CSS**, and powered by the **OpenWeather API**. It features **glassmorphism** UI, **Google Places-powered city search**, **geolocation-based auto-detection**, and a clean **Redux Toolkit** state layer with typed hooks.

> From real-time conditions to a thoughtful, animated interface, this app is designed to feel fast, informative, and delightful.

---

## ✨ Features

* **City Search with Autocomplete** (Google Places API)
* **Current Weather** with dynamic **day/night** icon switching
* **Hourly (next 24 hours)** and **7-day** forecast cards
* **Geolocation** → Auto-detect user city + reverse geocoding
* **Recent Searches** (persisted via `localStorage` & managed by Redux)
* **Animated Message Panel** for success/error/loading
* **Dynamic Backgrounds** based on weather conditions
* **Glassmorphism** cards & responsive layout
* **Type-safe** end-to-end with TypeScript interfaces

---

## 🧱 Tech Stack

* **Vite** (build tooling)
* **React + TypeScript**
* **Tailwind CSS**
* **Redux Toolkit** (store, slice, thunks)
* **react-router** (routing)
* **@react-google-maps/api** (Places Autocomplete)
* **OpenWeather API** (`/weather`, `/forecast`)
* **axios** (HTTP)
* **react-icons** (icons) & **motion/react** (animations)

---

## 🗂️ Project Structure

```
src
├─ app/                 # Redux store + typed hooks
│  ├─ hook.ts
│  └─ store.ts
├─ components/          # Reusable UI components
│  ├─ ForecastCard.tsx
│  ├─ MessagePanel.tsx
│  ├─ Searchbar.tsx
│  ├─ Sidebar.tsx
│  └─ WeatherCard.tsx
├─ features/
│  └─ search/
│     ├─ searchSlice.ts
│     └─ searchThunk.ts
├─ hooks/
│  ├─ useGeolocation.ts
│  ├─ useMessenger.tsx
│  └─ useWeather.ts        # used by pages (implementation not shown here)
├─ pages/
│  ├─ Homepage.tsx
│  └─ Citypage.tsx
├─ utils/
│  ├─ local.ts
│  └─ weather.ts
├─ App.css
├─ App.tsx
├─ index.css
└─ types.ts
```

> **Public assets**: images, icons, and SVG logo/title are stored under `public/` (e.g., `clear-sky.jpg`, `cloudy.jpg`, `rain.webp`, `snow.webp`, `thunderstorm.webp`, `haze.jpg`, `sunny.jpg`, `night.webp`, `night-sky.webp`, etc.).

---

## 🔐 Environment Variables

Create a `.env` file in the project root with your keys:

```env
VITE_WEATHER_KEY=your_openweather_api_key
VITE_PLACES_API=your_google_maps_api_key
```

> Keys are exposed to the client (prefixed `VITE_`). Do **not** commit real keys to source control.

---

## 🧭 Architecture & Data Flow

```
[UI Components] ──▶ [hooks/useWeather] ──▶ [utils/weather.ts -> axios -> OpenWeather]
      ▲                        │
      │                        └─ handles unit, loading, error, data
      │
[Searchbar] ─▶ [Redux searchSlice + Thunks] ─▶ [localStorage]
      │
[useGeolocation] ─▶ Google Geocoding API ─▶ City name ─▶ useWeather
```

* **Redux Toolkit** manages **search history** only (slice: `search`).
* **Weather fetching** (current + forecast) is encapsulated in a custom hook `useWeather` (consumed by pages) which calls `utils/weather.ts` (`getWeather`, `getForecast`).
* **UI** reacts to weather conditions and toggles CSS variables/classes to update backgrounds and theme.

---

## 🧩 Detailed Breakdown

### 1) `app/`

#### `hook.ts`

Typed versions of Redux hooks for app-wide type safety.

```ts
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

* Ensures `dispatch` and `selector` usage is fully **type-checked**.

#### `store.ts`

```ts
import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "../features/search/searchSlice";

export const store = configureStore({
  reducer: { search: searchReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

* Registers the **`search`** reducer.
* Exposes **`RootState`** and **`AppDispatch`** types.

---

### 2) `features/search`

#### `searchSlice.ts`

* State: `previousSearches: Array<SearchType>`
* Reducers: `addSearch`
* Extra reducers for async thunks:

  * `getSearchesFromLocalStorage.fulfilled` → loads & sorts by `time` (desc)
  * `addSearchToLocalStorage.fulfilled` → upserts search, keeps list sorted
  * `removeSearchFromLocalStorage.fulfilled` → deletes by `term`

```ts
interface searchState { previousSearches: Array<SearchType>; }
const initialState: searchState = { previousSearches: [] };
```

#### `searchThunk.ts`

* `getSearchesFromLocalStorage` → read `localStorage['searches']`
* `addSearchToLocalStorage` → upsert `{term,time}` into `localStorage`
* `removeSearchFromLocalStorage` → remove by `term`

> Persistence model uses a single key: **`searches`** → `Array<{ term: string; time: number }>`.

---

### 3) `hooks/`

#### `useGeolocation.ts`

* Requests browser **geolocation**. If granted, stores `{ latitude, longitude }` plus a human-readable **city** via **Google Geocoding API**.
* Errors are surfaced via **`useMessenger`** to the `MessagePanel`.
* Exposes: `{ location, address, isAllowed }`.

```ts
GET https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key=VITE_PLACES_API
```

#### `useMessenger.tsx`

* Context provider + hook to show transient messages: `"none" | "error" | "success" | "loading"`.
* Auto-clears non-loading messages after **3s**.
* Consumed by `MessagePanel`.

#### `useWeather.ts`

* Consumed in `Homepage` & `Citypage`.
* Responsible for:

  * Selected **unit** (`metric`/`imperial`)
  * Fetching **current weather** and **forecast**
  * Loading & error state management
* Internally calls `utils/weather.ts` functions.

> Although the implementation wasn't included, its usage is clear from pages. It exposes `fetchWeather`, `fetchForecast`, `weather`, `forecast`, `unit`, `loading`, `loadingForecast`, `error`, `errorForecast`.

---

### 4) `components/`

#### `Searchbar.tsx`

* Uses **`@react-google-maps/api`** to load Places library.
* **Debounced** predictions; suggestions shown while focused.
* On submit/click → navigates to `/city/{city}` and persists search via thunk.

Key behaviors:

* `libraries: ["places"]`
* Prediction selection uses `description.split(",")[0]` to isolate city.
* Persists `{ term: city.toLowerCase(), time: Date.now() }` via `addSearchToLocalStorage`.

#### `Sidebar.tsx`

* Responsive glass sidebar with **logo/title**, **Searchbar**, and **Recent Searches**.
* `previousSearches` pulled from Redux on mount using `getSearchesFromLocalStorage`.
* Delete button triggers `removeSearchFromLocalStorage`.

#### `MessagePanel.tsx`

* Animated bottom panel (enter/exit) using `motion/react`.
* Shows success ✅, error ❌, loading ⏳ with appropriate colors.

#### `WeatherCard.tsx`

* Displays **current conditions** with:

  * Big condition icon (day/night aware)
  * Temp (current, high, low), feels-like
  * Sunrise 🌅, Sunset 🌇 (timezone-corrected via `formatTimeWithTimezone`)
  * Stats grid: humidity, visibility, pressure, wind speed/dir (with arrow rotation), cloudiness
* Icon logic:

  * If description is `"clear sky"` **after** sunset → uses moon icon
  * Else maps via `weatherIcons` (fallback → `default`)

#### `ForecastCard.tsx`

* **Hourly Forecast (next 24h)**: filters by `dt_txt` within 0–24h from `Date.now()`.
* **7-Day Forecast**: maps one entry per day using first occurrence for each weekday.
* Uses OpenWeather’s icon set per entry.
* Glassmorphism cards and responsive grid layout.

---

### 5) `pages/`

#### `Homepage.tsx`

* Uses **`useGeolocation`** to detect city → fetches **current** + **forecast** via `useWeather`.
* Sets **dynamic background** and `body` theme class based on `weather.weather[0].description` and time of day (sunset-aware).
* Displays header with city name + local time via `formatTimeWithTimezone`.

#### `Citypage.tsx`

* Reads `:city` from the URL using `useParams`.
* Fetches **current** + **forecast** for that city.
* Same **dynamic background/theme** logic as `Homepage`.

> Both pages show a loader (`.loader`) when `loading && loadingForecast`.

---

### 6) `utils/`

#### `weather.ts`

* API endpoints & helpers.

```ts
const API_KEY = import.meta.env.VITE_WEATHER_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast";

export async function getWeather(city: string, system: "metric" | "imperial") {
  return (await axios.get(`${BASE_URL}?q=${city}&appid=${API_KEY}&units=${system}`)).data;
}

export async function getForecast(city: string, system: "metric" | "imperial") {
  return (await axios.get(`${FORECAST_URL}?q=${city}&appid=${API_KEY}&units=${system}`)).data;
}

export const formatTimeWithTimezone = (timestamp: number, timezone: number) =>
  new Date((timestamp + timezone) * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC",
  });

export const weatherIcons = { /* maps description -> react-icons component */ };
export const weatherBackgrounds = { /* maps description -> background url */ };
```

* **`weatherIcons`**: maps OpenWeather descriptions (e.g., `"clear sky"`, `"rain"`) to icon components.
* **`weatherBackgrounds`**: maps descriptions to background images.

#### `local.ts`

* Minimal helper to read searches from `localStorage`.

```ts
export function getSearches() {
  const previousSearches = localStorage.getItem("searches");
  return previousSearches ? JSON.parse(previousSearches) : [];
}
```

---

### 7) Routing & Shell

#### `App.tsx`

* Defines routes with nested `Layout`:

```tsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route path="/" element={<Homepage />} />
    <Route path="/city/:city" element={<Citypage />} />
  </Route>
</Routes>
```

> `Layout` typically renders shared UI (e.g., `Sidebar`, `MessagePanel`, etc.) and an `<Outlet />` for the pages. (Layout implementation not shown.)

---

### 8) Styling

#### `index.css`

* Imports Google Font (**Inter**), Tailwind, and defines **CSS variables** & per-weather **theme classes**:

  * `.weather-sunny`, `.weather-night`, `.weather-rainy`, `.weather-cloudy`, `.weather-misty`, `.weather-snowy`
* Custom scrollbar and default background (`.bg` uses `background.png`).

#### `App.css`

* Page padding & responsive left gutter when sidebar is visible
* Glass/blurred surfaces for `.sidebar`, `.card`, `.tp-card`, `.f-card`
* Loader animation (`.loader`) as a rotating radial pattern

> The **glassmorphism** look is achieved via translucent backgrounds + `backdrop-filter: blur(...)` and subtle borders/shadows.

---

### 9) Types

Defined centrally in `types.ts` for type safety and IDE autocompletion:

* **`WeatherData`**: full shape returned by OpenWeather `/weather`
* **`ForecastData`**: shape returned by OpenWeather `/forecast`
* **`SearchType`**: `{ term: string; time: number }` object persisted to `localStorage`

These interfaces ensure all components, hooks, and reducers receive and produce correctly typed data throughout the app.

---

## 🧪 How It Works (End-to-End)

1. **User opens app** → `Homepage` mounts → `useGeolocation` tries to get lat/lng.
2. On success → Reverse geocoding (Google) → resolves **city name**.
3. `useWeather` fetches **current** + **forecast** from OpenWeather for that city.
4. `Homepage` / `Citypage` render **WeatherCard** + **ForecastCard** and set **background/theme**.
5. **Searchbar**: user types → debounced Places predictions appear → select or submit → navigate to `/city/{city}` → thunk persists search → page fetches data.
6. **Sidebar** shows **Recent Searches** from Redux (backed by `localStorage`).

---

## 🛠️ Setup & Development

### Prerequisites

* **Node.js ≥ 18** (recommended)
* An **OpenWeather API key**
* A **Google Maps API key** with **Places** and **Geocoding** enabled

### Install & Run

```bash
# install deps
npm install

# start dev server
npm run dev

# build for production
npm run build

# preview production build
npm run preview
```

> Vite will print the local dev URL. Open it in your browser.

---

## 📡 APIs Used

### OpenWeather

* **Current**: `GET /data/2.5/weather?q={city}&appid={key}&units={metric|imperial}`
* **Forecast**: `GET /data/2.5/forecast?q={city}&appid={key}&units={metric|imperial}`

### Google Maps

* **Places Autocomplete** via `@react-google-maps/api` (client-side)
* **Reverse Geocoding**: `GET /maps/api/geocode/json?latlng={lat},{lng}&key={key}`

---

## 🔍 Notes, Tips & Edge Cases

* Weather description strings come from OpenWeather and can vary. Fallbacks (`default`) exist for icons/backgrounds.
* The **7-day** preview in `ForecastCard` uses the first forecast entry per weekday from the 3-hourly list provided by OpenWeather (`/forecast`), sliced to 7 entries.
* If geolocation fails or is blocked, `Homepage` won’t fetch until a **city is searched**.
* Searches are deduplicated and ordered **most recent first**.
* Time formatting uses `formatTimeWithTimezone(timestamp, timezone)` to display **local city time**.

---

## 🚧 Known Improvements / TODO

* Add **unit toggle** (°C/°F) in the UI (hook already supports `metric`/`imperial`).
* Validate library imports (`react-router-dom` is typical for browser usage).
* Add **error boundaries** and **retry** actions.
* Expand forecast to a true **7-day daily API** (OpenWeather One Call) for accuracy.
* Add tests for hooks and thunks.

---

## 👏 Credits

* **OpenWeather** for weather data
* **Google Maps Platform** for Places & Geocoding
* **Tailwind CSS**, **react-icons**, **motion/react** for UI polish

---

## 🎬 The Climax

This isn’t just another weather app — it’s a **crafted experience**. The blend of **speed (Vite)**, **type safety (TypeScript)**, **polish (Tailwind + glassmorphism)**, and **smart UX (autocomplete, geolocation, animated messages)** makes it **seriously nice** to use. You’ll feel the quality in every interaction. **It’s clean, modern, and very nice.** ✨

---

# 🛠️ Installation & Setup

Follow these steps to set up and run the **Weather App** locally.

---

## 📦 Prerequisites

* [Node.js](https://nodejs.org/) (v18+ recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* API Keys:

  * 🌦️ [OpenWeather API Key](https://openweathermap.org/api)
  * 📍 [Google Maps Places API Key](https://developers.google.com/maps/documentation/places/web-service/overview)

---

## 🚀 Steps to Run Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/weather-app.git
   cd weather-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create a `.env` file** in the root directory and add your API keys:

   ```env
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Your app will be available at: [http://localhost:5173](http://localhost:5173)

5. **Build for production:**

   ```bash
   npm run build
   npm run preview
   ```

---

## 🔧 Troubleshooting

* Double-check that your **API keys** are correct.
* Ensure the **Places API** is enabled in your Google Cloud Console.
* Delete `node_modules` and run `npm install` again if issues persist.

---

🎉 That’s it! You now have the Weather App running locally.


# 🤝 Contributing

We welcome contributions to make the **Weather App** better! 🚀

---

## 📋 How to Contribute

1. **Fork** the repository.
2. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes:**

   ```bash
   git commit -m "Add some feature"
   ```
4. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a **Pull Request** 🎉

---

## ✅ Contribution Guidelines

* Follow existing **code style** and **naming conventions**.
* Add **comments** where necessary for clarity.
* Ensure all **tests pass** before submitting.
* Update **documentation** if you add new features.

---

## 📝 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Shubham Mahapure

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

💡 *Contributions, bug reports, and feature requests are always welcome!*

