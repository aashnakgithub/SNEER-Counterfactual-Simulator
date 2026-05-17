# Singapore Monetary Policy Counterfactual Simulator 🇸🇬 

An interactive, quantitative macroeconomic simulation tool built to empirically evaluate the structural validity of the Monetary Authority of Singapore's (MAS) exchange-rate targeted monetary policy framework (**S$NEER**). 

The application maps real-world historical shocks to demonstrate why a small, ultra-open economy prioritizes exchange rate pass-through mechanics over traditional domestic interest rate targeting (Taylor-Rule), showcasing the constraints of the Mundell-Fleming **Impossible Trinity**.

### 🛠️ Core Features & Macroeconomic Engines
* **S$NEER Transmission Engine:** Models the continuous, annualized appreciation/depreciation crawl within a symmetric policy band using empirically grounded Exchange Rate Pass-Through (ERPT) coefficients ($\beta_1 = 0.35$).
* **Counterfactual Taylor-Rule Engine:** Simulates a domestic interest rate regime under an open capital account, demonstrating the structural volatility ($\sigma = 1.25$) triggered by speculative hot money inflows.
* **Historical Empirical Scenarios:** Pre-loaded baseline matrices mapping the 2020 Global Recession, the 2022 Post-Pandemic Supply Shock, and the 2025–2026 Middle East Energy Crisis.
* **Tech Stack:** Standalone frontend architecture utilizing HTML5 Canvas, modern dark-themed financial UI, and reactive state management powered by vanilla JavaScript and **Chart.js**.
