# Singapore Monetary Policy Counterfactual Simulator 🇸🇬

An interactive macroeconomic simulation tool built to evaluate the Monetary Authority of Singapore's S$NEER exchange-rate policy framework through counterfactual scenarios.

The app demonstrates why a small, ultra-open economy uses exchange rate pass-through mechanics instead of a traditional domestic interest-rate Taylor rule, highlighting the Mundell-Fleming impossible trinity in practice.

## Key Features

* **S$NEER Transmission Engine** — Quantifies real-world exchange rate transmission dynamics.
* **Counterfactual Policy Simulation** — Compares MAS-style exchange-rate targeting to hypothetical interest-rate regimes.
* **Historical Scenarios** — Includes shock episodes from the 2020 global recession, 2022 supply disruptions, and later macroeconomic stress.
* **Modern Vite + React UI** — Built with React, Tailwind, Chart.js, and Vite for fast interactive simulation.

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file from `.env.example` if needed.
3. Add your `GEMINI_API_KEY` if required by the app.
4. Start the development server:
   ```bash
   npm run dev
   ```

## GitHub Pages Deployment

This repository is configured to deploy the app automatically via GitHub Actions to the `gh-pages` branch after each push to `main`.

Once the action runs, the simulator will be available at:

`https://aashnakgithub.github.io/SNEER-Counterfactual-Simulator/`

## Notes

* The project is public and ready for assessors to access.
* If the app requires the Gemini API key during build, add a repository secret named `GEMINI_API_KEY` in GitHub Settings > Secrets > Actions.
