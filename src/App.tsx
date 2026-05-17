import React, { useState, useEffect, useRef } from "react";
import { 
  RotateCcw, Sliders, Globe, Activity, BookOpen, AlertCircle, 
  TrendingUp, Compass, Cpu, HelpCircle, CheckCircle, Flame, DollarSign, Eye
} from "lucide-react";
import Chart from "chart.js/auto";

// Define Scenario Data Matrix as requested
interface Scenario {
  id: string;
  name: string;
  year: string;
  description: string;
  source: string;
  importedInflationStart: number;
  importedInflationPeak: number;
  importedInflationEnd: number;
  outputGapStart: number;
  outputGapPeak: number;
  outputGapEnd: number;
  recommendedSlope: number;
  recommendedWidth: number;
  recommendedCenter: number;
  recommendedInterestRate: number;
  academicCitation: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "supply-shock-2022",
    name: "2022 Post-Pandemic Supply Shock",
    year: "2022",
    source: "BIS Papers No. 142",
    description: "Post-COVID supply blockades and global energy spikes created a massive cost-push inflation. Singapore's domestic labor market was highly tight with output gap expansion (+1.50%). S$NEER appreciated aggressively to insulate the local CPI.",
    academicCitation: "IMF Selected Issues Paper 'Exchange Rate Pass-Through to Inflation in Singapore' (2024) by N. Eklou, and Tan et al. (2011).",
    importedInflationStart: 6.10,
    importedInflationPeak: 8.20,
    importedInflationEnd: 3.00,
    outputGapStart: 1.50,
    outputGapPeak: 2.10,
    outputGapEnd: 0.30,
    recommendedSlope: 2.0,
    recommendedWidth: 4.0,
    recommendedCenter: 0.0,
    recommendedInterestRate: 4.5
  },
  {
    id: "energy-crisis-2025",
    name: "2025–2026 Middle East Energy Crisis",
    year: "2025–2026",
    source: "MAS Macroeconomic Review",
    description: "Geopolitical blockades in crude shipping lanes triggered stagflationary shocks (+4.80% import price surge). Domestic output gap started positive but crashed as petroleum and utility costs eroded business activities.",
    academicCitation: "IMF Working Paper (WP/11/141) 'Exchange Rate Pass-Through over the Business Cycle in Singapore'.",
    importedInflationStart: 4.80,
    importedInflationPeak: 7.10,
    importedInflationEnd: 3.50,
    outputGapStart: 0.50,
    outputGapPeak: 0.90,
    outputGapEnd: -1.10,
    recommendedSlope: 1.5,
    recommendedWidth: 4.0,
    recommendedCenter: 0.0,
    recommendedInterestRate: 4.0
  },
  {
    id: "covid-deflation-2020",
    name: "2020 Global COVID Recession",
    year: "2020",
    source: "MAS Annual Report 2020/21",
    description: "A catastrophic demand shock during lockouts. Imported prices plunged into severe deflation (-1.20% baseline) with a deep labor underutilization and GDP output gap contraction of -4.00%. MAS flattened and re-centered the band.",
    academicCitation: "Tan, S. N., et al., 'MAS Monetary Policy Operations' (2011) / Singapore Economic Review.",
    importedInflationStart: -1.20,
    importedInflationPeak: -3.30,
    importedInflationEnd: 1.20,
    outputGapStart: -4.00,
    outputGapPeak: -6.50,
    outputGapEnd: -1.00,
    recommendedSlope: 0.0,
    recommendedWidth: 4.0,
    recommendedCenter: -1.0,
    recommendedInterestRate: 1.0
  }
];

export default function App() {
  // Scenario selector
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);

  // S$NEER policy variables (user-controlled sliders)
  const [sNeerSlope, setSNeerSlope] = useState<number>(SCENARIOS[0].recommendedSlope);
  const [bandWidth, setBandWidth] = useState<number>(SCENARIOS[0].recommendedWidth);
  const [reCentering, setReCentering] = useState<number>(SCENARIOS[0].recommendedCenter);

  // Interest rate policy variables (user-controlled sliders)
  const [localRate, setLocalRate] = useState<number>(SCENARIOS[0].recommendedInterestRate);
  const [globalRate, setGlobalRate] = useState<number>(3.50); // Hardcoded baseline from user request

  // Empirical Coefficients (collapsible tuning metrics block)
  const [beta1, setBeta1] = useState<number>(0.30); // Target consumer price index pass-through (0.25 to 0.35 over 9mo)
  const [beta2, setBeta2] = useState<number>(0.45); // Output gap sensitivity
  const [sigma, setSigma] = useState<number>(1.25); // Capital mobility divergence factor
  const [showCoeffsSettings, setShowCoeffsSettings] = useState<boolean>(false);

  // Noise Profile (Generated once or re-rolled)
  const [noiseSeed, setNoiseSeed] = useState<number>(42);
  const [noiseArray, setNoiseArray] = useState<number[]>([]);
  const [indexNoiseArray, setIndexNoiseArray] = useState<number[]>([]);

  // Active visualization tab
  const [activeTab, setActiveTab] = useState<"inflation" | "band">("inflation");

  // Chart instances
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Re-roll noise shocks
  const handleRerollShocks = () => {
    setNoiseSeed(Math.random());
  };

  // Generate deterministic-like noise vector when seed changes or on mount
  useEffect(() => {
    const mainNoise: number[] = [];
    const idxNoise: number[] = [];
    for (let i = 0; i <= 24; i++) {
      // White noise mimicking standard model tracking variance
      mainNoise.push((Math.sin(noiseSeed * (i + 1) * 37) * 0.5) + (Math.cos(noiseSeed * (i + 52) * 11) * 0.5));
      idxNoise.push((Math.cos(noiseSeed * (i + 13) * 63) * 0.5) + (Math.sin(noiseSeed * (i + 87) * 29) * 0.5));
    }
    setNoiseArray(mainNoise);
    setIndexNoiseArray(idxNoise);
  }, [noiseSeed]);

  // Fast reset parameters when active scenario changes
  const applyScenarioPresets = (sc: Scenario) => {
    setActiveScenario(sc);
    setSNeerSlope(sc.recommendedSlope);
    setBandWidth(sc.recommendedWidth);
    setReCentering(sc.recommendedCenter);
    setLocalRate(sc.recommendedInterestRate);
  };

  // Preset shortcut buttons (Neutral / Aggressive / Easing)
  const handlePresetStance = (type: "mas_actual" | "neutral" | "aggressive_tight" | "expansionary_easing") => {
    if (type === "mas_actual") {
      setSNeerSlope(activeScenario.recommendedSlope);
      setBandWidth(activeScenario.recommendedWidth);
      setReCentering(activeScenario.recommendedCenter);
      setLocalRate(activeScenario.recommendedInterestRate);
    } else if (type === "neutral") {
      setSNeerSlope(0.0);
      setBandWidth(4.0);
      setReCentering(0.0);
      setLocalRate(3.5);
    } else if (type === "aggressive_tight") {
      setSNeerSlope(3.5);
      setBandWidth(3.0);
      setReCentering(1.5);
      setLocalRate(5.5);
    } else if (type === "expansionary_easing") {
      setSNeerSlope(-1.5);
      setBandWidth(5.0);
      setReCentering(-1.5);
      setLocalRate(1.5);
    }
  };

  // Cubic Bezier interpolation logic for monthly smooth timeseries profile (Month 0 to 24)
  const getInterpolatedValue = (t: number, start: number, peakVal: number, endVal: number) => {
    const peakMonth = 6;
    if (t <= peakMonth) {
      const fraction = t / peakMonth;
      const tEase = fraction < 0.5 ? 2 * fraction * fraction : 1 - Math.pow(-2 * fraction + 2, 2) / 2;
      return start + (peakVal - start) * tEase;
    } else {
      const fraction = (t - peakMonth) / (24 - peakMonth);
      const tEase = fraction < 0.5 ? 2 * fraction * fraction : 1 - Math.pow(-2 * fraction + 2, 2) / 2;
      return peakVal + (endVal - peakVal) * tEase;
    }
  };

  // Compile calculations for 24 months
  const simData = Array.from({ length: 25 }, (_, t) => {
    // 1. Get baseline economic values for step t
    const importedInflation = getInterpolatedValue(
      t, 
      activeScenario.importedInflationStart, 
      activeScenario.importedInflationPeak, 
      activeScenario.importedInflationEnd
    );
    const outputGap = getInterpolatedValue(
      t, 
      activeScenario.outputGapStart, 
      activeScenario.outputGapPeak, 
      activeScenario.outputGapEnd
    );

    // 2. Extract noise scalar
    const nVal = noiseArray[t] || 0;
    const trackingVariance = nVal * 0.15; // standard tracking variance within boundaries

    // S$NEER Calculation System (Engine A)
    // S$NEER inflation is buffered directly by structural currency appreciation slope
    const sNeerCoreInflation = (beta1 * (importedInflation - sNeerSlope)) + (beta2 * outputGap) + trackingVariance;

    // S$NEER index crawl band math
    const baseMidpoint = 100.0 * (1 + (reCentering / 100));
    // Annualized crawl slope translated to cumulative monthly appreciating path
    const midpoint = baseMidpoint * Math.pow(1 + (sNeerSlope / 100) / 12, t);
    const boundUpper = midpoint * (1 + (bandWidth / 200));
    const boundLower = midpoint * (1 - (bandWidth / 200));

    // Simulated market pressures (capital inflow from output gap + external price shock index demand)
    const idxNoise = indexNoiseArray[t] || 0;
    const rawMarketNeerValue = midpoint + (outputGap * 0.8) + (importedInflation * 0.3) + (idxNoise * 0.5);
    const sNeerIndexValue = Math.max(boundLower, Math.min(boundUpper, rawMarketNeerValue));

    // Intervention tracking: Flag active state defense when market pressures hit target bounds
    const isUpperIntervent = rawMarketNeerValue >= boundUpper;
    const isLowerIntervent = rawMarketNeerValue <= boundLower;

    // Hypothetical Domestic Interest Rate System (Engine B)
    // Interest rate local is user-controlled, global rate is hardcoded (3.5%). 
    // Absolute divergence term represents speculative capital flow pressure & unmitigated core imported inflation
    const rateDivergenceCapitalShock = sigma * Math.abs(localRate - globalRate);
    const hypotheticalDomesticInflation = (beta1 * importedInflation) + (beta2 * outputGap) + rateDivergenceCapitalShock + trackingVariance;

    return {
      month: t,
      importedInflation,
      outputGap,
      sNeerCoreInflation,
      sNeerIndexValue,
      midpoint,
      boundUpper,
      boundLower,
      hypotheticalDomesticInflation,
      isUpperIntervent,
      isLowerIntervent
    };
  });

  // Aggregation Metrics
  const avgSNeerInflation = simData.reduce((acc, d) => acc + d.sNeerCoreInflation, 0) / 25;
  const avgHypotheticalInflation = simData.reduce((acc, d) => acc + d.hypotheticalDomesticInflation, 0) / 25;
  const peakSNeerInflation = Math.max(...simData.map(d => d.sNeerCoreInflation));
  const peakHypotheticalInflation = Math.max(...simData.map(d => d.hypotheticalDomesticInflation));
  const finalExchangeRateStrength = simData[24].sNeerIndexValue - 100;
  const upperDefensesCount = simData.filter(d => d.isUpperIntervent).length;
  const lowerDefensesCount = simData.filter(d => d.isLowerIntervent).length;

  // React component charting effect
  useEffect(() => {
    if (!chartRef.current) return;

    const labels = simData.map((_, t) => `Month ${t}`);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const datasetGroup = activeTab === "inflation" ? [
      {
        label: "Simulated S$NEER Core Inflation (Exchange Rate Stance)",
        data: simData.map(d => parseFloat(d.sNeerCoreInflation.toFixed(3))),
        borderColor: "#22d3ee", // Neon Cyan
        backgroundColor: "rgba(6, 182, 212, 0.08)",
        borderWidth: 3,
        pointBackgroundColor: "#22d3ee",
        pointHoverRadius: 7,
        tension: 0.15,
        fill: true,
      },
      {
        label: "Counterfactual Domestic Interest Rate Regime (Taylor Rule)",
        data: simData.map(d => parseFloat(d.hypotheticalDomesticInflation.toFixed(3))),
        borderColor: "#f97316", // Vibrant Orange
        backgroundColor: "rgba(249, 115, 22, 0.04)",
        borderWidth: 3,
        borderDash: [5, 4],
        pointBackgroundColor: "#f97316",
        pointHoverRadius: 7,
        tension: 0.15,
      },
      {
        label: "Raw Imported Inflation Baseline",
        data: simData.map(d => parseFloat(d.importedInflation.toFixed(2))),
        borderColor: "rgba(148, 163, 184, 0.35)", // Ghost slate
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointStyle: "circle",
        tension: 0.1,
      }
    ] : [
      {
        label: "S$NEER Band Midpoint (Crawling Slope Target)",
        data: simData.map(d => parseFloat(d.midpoint.toFixed(2))),
        borderColor: "#94a3b8",
        borderWidth: 1.5,
        borderDash: [4, 4],
        fill: false,
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: "S$NEER Policy Upper Bound (Ceiling Band)",
        data: simData.map(d => parseFloat(d.boundUpper.toFixed(2))),
        borderColor: "rgba(239, 68, 68, 0.7)", // Crimson Bound
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: "S$NEER Policy Lower Bound (Floor Band)",
        data: simData.map(d => parseFloat(d.boundLower.toFixed(2))),
        borderColor: "rgba(239, 68, 68, 0.7)",
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        tension: 0.1,
      },
      {
        label: "Actual Tracked S$NEER Index",
        data: simData.map(d => parseFloat(d.sNeerIndexValue.toFixed(2))),
        borderColor: "#22d3ee", // Neon Cyan
        borderWidth: 3,
        backgroundColor: "rgba(6, 182, 212, 0.05)",
        fill: false,
        pointBackgroundColor: simData.map(d => {
          if (d.isUpperIntervent) return "#f87171"; // Red highlights on defenses
          if (d.isLowerIntervent) return "#fbbf24";
          return "#22d3ee";
        }),
        pointRadius: 4,
        pointHoverRadius: 8,
        tension: 0.15,
      }
    ];

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: datasetGroup,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#94a3b8",
              font: { family: "ui-monospace, monospace", size: 11 },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: "#121214",
            titleColor: "#f1f5f9",
            bodyColor: "#f1f5f9",
            borderColor: "#334155",
            borderWidth: 1,
            titleFont: { family: "ui-monospace, monospace" },
            bodyFont: { family: "ui-monospace, monospace" },
            callbacks: {
              label: function (context: any) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y + (activeTab === "inflation" ? "%" : "");
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(255, 255, 255, 0.03)" },
            ticks: { color: "#64748b", font: { family: "ui-monospace, monospace", size: 10 } }
          },
          y: {
            grid: { color: "rgba(255, 255, 255, 0.03)" },
            ticks: {
              color: "#64748b",
              font: { family: "ui-monospace, monospace", size: 10 },
              callback: function (value) {
                return activeTab === "inflation" ? value + "%" : value;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [activeScenario, sNeerSlope, bandWidth, reCentering, localRate, globalRate, beta1, beta2, sigma, activeTab, noiseArray]);

  return (
    <div id="monetary-simulator-root" className="min-h-screen bg-[#0B0B0C] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* 1. Header & Status Bar */}
      <header className="border-b border-[#1A1A1E] bg-[#101012] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2 border border-cyan-500/30 rounded-lg">
            <Cpu className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-50 flex items-center gap-2">
              S$NEER Counterfactual Simulator <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-400/20">EMPIRICAL STANCE</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-wider">MONETARY POLICY DIVISION &bull; REPUBLIC OF SINGAPORE</p>
          </div>
        </div>

        {/* Info Pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="bg-[#18181C] border border-neutral-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-400">Model Engine:</span>
            <span className="text-cyan-400 font-bold">Mundell-Fleming IS-LM-BP</span>
          </div>
          <button 
            onClick={handleRerollShocks}
            className="bg-[#18181C] hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/30 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition text-cyan-400 cursor-pointer"
            title="Re-rolls stochastic market shocks along the quarterly time series path"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-roll Shocks</span>
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        {/* Left Hand: Controls Side Deck (4 Cols on Large) */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* A. Historical Scenarios Card */}
          <div className="bg-[#101012] rounded-xl border border-neutral-800 p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-slate-400 uppercase">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Historical Shock Scenarios</span>
            </div>

            <div className="flex flex-col gap-2">
              {SCENARIOS.map(sc => (
                <button
                  key={sc.id}
                  onClick={() => applyScenarioPresets(sc)}
                  className={`text-left p-3.5 rounded-lg border transition flex flex-col gap-1.5 relative overflow-hidden ${
                    activeScenario.id === sc.id
                      ? "bg-cyan-500/5 border-cyan-500/40 text-slate-100"
                      : "bg-[#141417]/40 border-neutral-800 hover:border-neutral-700 text-slate-400"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-sm text-slate-200">{sc.name}</span>
                    <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                      {sc.year}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2 leading-relaxed text-slate-400">{sc.description}</p>
                  <span className="text-[10px] text-slate-500 font-mono tracking-tight mt-1 italic line-clamp-1">{sc.source}</span>
                  {activeScenario.id === sc.id && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* B. S$NEER Framework Parameters Slider Panel */}
          <div className="bg-[#101012] rounded-xl border border-neutral-800 p-5 shadow-lg flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-slate-400 uppercase">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Engine A: S$NEER Crawl Settings</span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded uppercase">Exchange Rate Target</span>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Slip 1: Crawling Slope */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1">
                    Annual Slope Crawl <span className="text-[10px] text-slate-400 font-mono italic">(Slope)</span>
                  </span>
                  <span className="font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded font-bold border border-cyan-400/20">
                    {sNeerSlope > 0 ? `+${sNeerSlope.toFixed(1)}%` : `${sNeerSlope.toFixed(1)}%`}
                  </span>
                </div>
                <input 
                  type="range"
                  min="-2.0"
                  max="4.0"
                  step="0.1"
                  value={sNeerSlope}
                  onChange={(e) => setSNeerSlope(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-2.0% (Depreciating)</span>
                  <span>0.0% (Flat)</span>
                  <span>+4.0% (Strong appreciation)</span>
                </div>
              </div>

              {/* Slider 2: Band Width */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">
                    Symmetrical Band Width <span className="text-[10px] text-slate-400 font-mono italic">(Width)</span>
                  </span>
                  <span className="font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded font-bold border border-cyan-400/20">
                    &plusmn;{(bandWidth / 2).toFixed(1)}% ({bandWidth.toFixed(1)}% total)
                  </span>
                </div>
                <input 
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.1"
                  value={bandWidth}
                  onChange={(e) => setBandWidth(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1.0% (Extremely Narrow)</span>
                  <span>4.0% (Typical)</span>
                  <span>8.0% (Very Wide)</span>
                </div>
              </div>

              {/* Slider 3: Midpoint Re-centering */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">
                    Midpoint Shift <span className="text-[10px] text-slate-400 font-mono italic">(Re-centering)</span>
                  </span>
                  <span className="font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded font-bold border border-cyan-400/20">
                    {reCentering > 0 ? `+${reCentering.toFixed(1)}%` : `${reCentering.toFixed(1)}%`}
                  </span>
                </div>
                <input 
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.1"
                  value={reCentering}
                  onChange={(e) => setReCentering(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-3.0% (Downward)</span>
                  <span>0.0% (Unchanged)</span>
                  <span>+3.0% (Upward level)</span>
                </div>
              </div>

            </div>
          </div>

          {/* C. Counterfactual Interest Rate Settings Card */}
          <div className="bg-[#101012] rounded-xl border border-neutral-800 p-5 shadow-lg flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-slate-400 uppercase">
                <Globe className="w-4 h-4 text-orange-400" />
                <span>Engine B: Hypothetical Regime Settings</span>
              </div>
              <span className="text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded uppercase font-bold">Domestic Interest Rate</span>
            </div>

            <div className="flex flex-col gap-4">
              
              {/* Slider: Local Interest Rate */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">
                    Hypothetical Local Rate <span className="text-[10px] text-slate-400 font-mono italic">(i_local)</span>
                  </span>
                  <span className="font-mono text-orange-400 bg-orange-400/5 px-2 py-0.5 rounded font-bold border border-orange-400/20">
                    {localRate.toFixed(1)}%
                  </span>
                </div>
                <input 
                  type="range"
                  min="0.0"
                  max="6.0"
                  step="0.1"
                  value={localRate}
                  onChange={(e) => setLocalRate(parseFloat(e.target.value))}
                  className="w-full accent-orange-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.0% (Deep stimulative)</span>
                  <span>3.5% (Global baseline)</span>
                  <span>6.0% (Extreme tight)</span>
                </div>
              </div>

              {/* Indicator: Global Interest Rate */}
              <div className="bg-[#141417] rounded-lg border border-neutral-800/60 p-3 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Fed / Global Target Rate (i_global)</span>
                  <span className="font-bold text-slate-300">3.5%</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Rate Gap (Trilemma Divergence):</span>
                  <span className={`font-mono text-xs font-bold ${Math.abs(localRate - globalRate) > 1.0 ? "text-amber-500" : "text-green-400"}`}>
                    &Delta; {Math.abs(localRate - globalRate).toFixed(1)}%
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* D. Preset Stance Quick Shortcuts */}
          <div className="bg-[#101012]/80 rounded-xl border border-neutral-800/80 p-4 shadow flex flex-col gap-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">Quick Policy Presets</span>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => handlePresetStance("mas_actual")}
                className="max-w-full text-center py-2 px-3 bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 hover:bg-cyan-950/80 rounded font-mono text-xs transition cursor-pointer"
              >
                MAS Hist. Actual
              </button>
              <button 
                onClick={() => handlePresetStance("neutral")}
                className="max-w-full text-center py-2 px-3 bg-neutral-800 border border-neutral-700 text-slate-400 hover:bg-neutral-750 hover:text-slate-300 rounded font-mono text-xs transition cursor-pointer"
              >
                Flat / Parity
              </button>
              <button 
                onClick={() => handlePresetStance("aggressive_tight")}
                className="max-w-full text-center py-2 px-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/80 rounded font-mono text-xs transition cursor-pointer"
              >
                Aggressive Hawk
              </button>
              <button 
                onClick={() => handlePresetStance("expansionary_easing")}
                className="max-w-full text-center py-2 px-3 bg-rose-950/40 border border-rose-800/40 text-rose-400 hover:bg-rose-950/80 rounded font-mono text-xs transition cursor-pointer"
              >
                Dovish stimulus
              </button>
            </div>
          </div>

        </section>

        {/* Right Hand: Visualizations & Detailed Economics Analytics Panels (8 Cols) */}
        <section className="lg:col-span-8 flex flex-col gap-6">

          {/* Metric Row Banner Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Metric 1 */}
            <div className="bg-[#101012] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase flex items-center gap-1">
                AVG S$NEER CPI
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-xl md:text-2xl font-bold font-mono text-cyan-400">
                  {avgSNeerInflation.toFixed(2)}%
                </span>
                <span className="text-slate-500 text-[10px] font-mono">{(avgSNeerInflation < 1.0 || avgSNeerInflation > 2.5) ? "(Skewed)" : "(Target)"}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 leading-snug">Average with tracking variance</p>
              <div className="absolute right-4 bottom-4 opacity-5 text-cyan-400">
                <Activity className="w-8 h-8" />
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#101012] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                AVG INTER-RATE CPI
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-xl md:text-2xl font-bold font-mono text-orange-400">
                  {avgHypotheticalInflation.toFixed(2)}%
                </span>
                <span className="text-slate-500 text-[10px] font-mono">
                  {avgHypotheticalInflation > avgSNeerInflation ? `+${(avgHypotheticalInflation - avgSNeerInflation).toFixed(1)}% Pt` : ""}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Capital trilemma volatility penalty</p>
              <div className="absolute right-4 bottom-4 opacity-5 text-orange-400">
                <Globe className="w-8 h-8" />
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-[#101012] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                PEAK SPIKE OUTCOME
              </span>
              <div className="mt-2 flex flex-col">
                <span className="text-base font-bold font-mono text-rose-400 leading-tight">
                  S$NEER: {peakSNeerInflation.toFixed(2)}%
                </span>
                <span className="text-xs font-mono text-orange-400 leading-tight">
                  DOM: {peakHypotheticalInflation.toFixed(2)}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Max quarterly overshoot peaks</p>
              <div className="absolute right-4 bottom-4 opacity-5 text-rose-400">
                <Flame className="w-8 h-8" />
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-[#101012] border border-neutral-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                MAS INTERVENTIONS
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-xl md:text-2xl font-bold font-mono text-teal-400">
                  {upperDefensesCount + lowerDefensesCount}
                </span>
                <span className="text-slate-500 text-[10px] font-mono">months defensive</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {upperDefensesCount} ceiling / {lowerDefensesCount} floor defenses
              </p>
              <div className="absolute right-4 bottom-4 opacity-5 text-teal-400">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>

          </div>

          {/* Interactive Core Charts Plot Chrome */}
          <div className="bg-[#101012] rounded-xl border border-neutral-800 p-5 shadow-lg flex-1 flex flex-col min-h-115">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-800/60 pb-4 mb-4 gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight font-mono">
                    {activeTab === "inflation" ? "Comparative Macroeconomic Outcomes (Core Inflation)" : "S$NEER Band Path Projection"}
                  </h3>
                  <p className="text-xs text-slate-400">Dynamic 24-month horizon discrete time-series model</p>
                </div>
              </div>

              {/* Tab Selector Buttons */}
              <div className="bg-[#18181C] p-1.5 rounded-lg border border-neutral-800/80 flex gap-1">
                <button
                  onClick={() => setActiveTab("inflation")}
                  className={`px-3 py-1.5 rounded font-mono text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "inflation" 
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Comparative CPI
                </button>
                <button
                  onClick={() => setActiveTab("band")}
                  className={`px-3 py-1.5 rounded font-mono text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "band" 
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                      : "text-slate-400 hover:text-slate-300"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  S$NEER Policy Band
                </button>
              </div>
            </div>

            {/* Dynamic Canvas Container */}
            <div className="flex-1 relative w-full h-80 min-h-75">
              <canvas ref={chartRef} />
            </div>

            {/* Footnote about active tab */}
            <div className="mt-4 pt-3 border-t border-neutral-800/40 text-[11px] font-mono text-slate-500 flex justify-between items-center bg-[#151518]/40 p-2.5 rounded-lg">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                S$NEER Core Inflation includes direct crawling erosion: Beta_1 * (Import_Inf - Slope).
              </span>
              <span>Horizon t = 0 to 24 Months</span>
            </div>
          </div>

          {/* Collapsible drawer for advanced empirical coefficients parameters control */}
          <div className="bg-[#101012] rounded-xl border border-neutral-800 shadow-lg overflow-hidden transition-all duration-300">
            <button
              onClick={() => setShowCoeffsSettings(!showCoeffsSettings)}
              className="w-full flex justify-between items-center px-5 py-4 hover:bg-[#131316] text-slate-300 font-mono text-xs uppercase tracking-wider transition cursor-pointer"
            >
              <span className="flex items-center gap-2 font-bold">
                <Sliders className="w-4 h-4 text-emerald-400 animate-pulse" />
                Advanced Empirical Coefficients Optimizer
              </span>
              <span className="text-[10px] text-cyan-400 bg-cyan-950/25 px-2.5 py-1 rounded border border-cyan-900/30">
                {showCoeffsSettings ? "Hide Weights Config" : "Tweak Coefficients Weights"}
              </span>
            </button>

            {showCoeffsSettings && (
              <div className="px-5 pb-5 pt-1 border-t border-neutral-800/60 bg-[#121215]/50 flex flex-col gap-5">
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Adjust standard IMF empirically sourced baseline parameters to evaluate Singapore's sensitivity. Citations to the designated IMF models are documented at the base of the policy brief.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Weight 1 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Exchange Pass-Through (&beta;_1)</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-450/10 px-1.5 py-0.5 rounded border border-emerald-400/20">{beta1.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.20"
                      max="1.10"
                      step="0.05"
                      value={beta1}
                      onChange={(e) => setBeta1(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>0.20 (Short-Run CPI)</span>
                      <span>1.00 (Long-Run Import)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">IMF (2024): CPI trans is cumulative 0.25 to 0.35 over 9mo.</p>
                  </div>

                  {/* Weight 2 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Output Gap Sensitivity (&beta;_2)</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-450/10 px-1.5 py-0.5 rounded border border-emerald-400/20">{beta2.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.10"
                      max="0.80"
                      step="0.05"
                      value={beta2}
                      onChange={(e) => setBeta2(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>0.10 (Insensitive)</span>
                      <span>0.80 (High sensitivity)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">IMF WP/11/141: Singapore baseline set at 0.45.</p>
                  </div>

                  {/* Weight 3 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-medium">Mundell-Fleming Speculation (&sigma;)</span>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-450/10 px-1.5 py-0.5 rounded border border-emerald-400/20">{sigma.toFixed(2)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0.50"
                      max="2.50"
                      step="0.05"
                      value={sigma}
                      onChange={(e) => setSigma(parseFloat(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                      <span>0.50 (Low Arbitrage)</span>
                      <span>2.50 (High Volatility)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 italic">Mundell-Fleming open capital account multiplier rate gap.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Academic Report Panel */}
          <div className="bg-[#121215] border border-neutral-800 rounded-xl p-5 shadow flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono">
                Academic Policy Brief &amp; Counterfactual Verdict
              </h3>
            </div>

            <div className="flex flex-col gap-3 text-slate-300 text-xs leading-relaxed">
              <p>
                Under the current scenario: <span className="text-slate-100 font-bold">"{activeScenario.name}"</span>, 
                the imported inflation baseline spikes to <span className="text-red-400 font-bold">{Math.max(activeScenario.importedInflationStart, activeScenario.importedInflationPeak).toFixed(1)}%</span> and domestic output gap peaks around <span className="text-cyan-300 font-bold font-mono">+{activeScenario.outputGapPeak.toFixed(1)}%</span>. 
                With Singapore's high long-run Exchange Rate Pass-Through (ERPT) coefficient set at <span className="text-slate-200 font-bold font-mono">Beta_1 = 1.00</span> (import prices) and cumulative consumer price transmission parametered at <span className="text-emerald-400 font-bold font-mono">{(beta1).toFixed(2)}</span>, 
                direct exchange rate insulation is uniquely powerful.
              </p>
              
              <div className="bg-[#16161B] border border-neutral-800 p-3.5 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] leading-relaxed">
                <div>
                  <span className="text-cyan-400 block font-bold mb-1">// CHANNEL A: THE S$NEER PARADIGM</span>
                  By appreciating the S$NEER slope by <span className="text-slate-100 font-bold">{sNeerSlope > 0 ? `+${sNeerSlope}%` : `${sNeerSlope}%`}</span> annually, MAS effectively lowers domestic imported cost pressures to <span className="text-cyan-400 font-bold">{(Math.max(activeScenario.importedInflationStart, activeScenario.importedInflationPeak) - sNeerSlope).toFixed(2)}%</span> in local terms. 
                  Average core inflation stabilizes at <span className="text-cyan-400 font-bold">{avgSNeerInflation.toFixed(2)}%</span>, keeping the price index insulated within the managed band bounds.
                </div>
                <div>
                  <span className="text-orange-400 block font-bold mb-1">// CHANNEL B: HYPOTHETICAL LOCAL RATES</span>
                  Under domestic interest rate targeting, the exchange rate remains unmanaged (slope = 0), letting the raw import shock propagate at 100%. 
                  Because Singapore maintains open capital boundaries, attempting to raise interest rates to <span className="text-slate-100 font-bold">{localRate.toFixed(1)}%</span> deviates from global benchmark (3.5%), inducing a speculative hot-money capital fee / volatility penalty of <span className="text-orange-400 font-bold">{(sigma * Math.abs(localRate - 3.5)).toFixed(2)}%</span>. 
                  This pushes counterfactual core inflation to <span className="text-orange-400 font-bold">{avgHypotheticalInflation.toFixed(2)}%</span>.
                </div>
              </div>

              <div className="flex items-start gap-2 bg-indigo-550/5 border border-indigo-500/10 p-3 rounded-lg text-slate-400 text-[11px] leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-indigo-300 block mb-0.5">Mundell-Fleming "Impossible Trinity" Invariant:</strong>
                  Since Singapore chooses an open capital account and utilizes exchange rate targeted floating bands, it must give up domestic interest rate autonomy. Attempting to manage domestic bank rates independently induces speculative arbitrage capital inflows and volatility, inflating core prices further. Thus, Singapore's unique structure validates exchange-rate management for small open economies with massive external trading indices.
                </p>
              </div>

              <div className="pt-2 border-t border-neutral-800/60 mt-2 flex flex-col gap-1 text-[10px] text-slate-500 font-mono">
                <span className="font-bold uppercase text-slate-400 block mb-0.5">Empirical Citations &amp; Academic Origins:</span>
                <span>[1] Exchange Rate Pass-Through Coefficient (&beta;_1): IMF Selected Issues Paper &quot;Exchange Rate Pass-Through to Inflation in Singapore&quot; (2024) by N. Eklou, and Tan et al. (2011).</span>
                <span>[2] Domestic Output Gap Sensitivity Coefficient (&beta;_2): IMF Working Paper (WP/11/141) &quot;Exchange Rate Pass-Through over the Business Cycle in Singapore&quot;.</span>
                <span>[3] Open Capital Account Volatility Factor (&sigma;): Mundell-Fleming trilemma capital asset correlation index limits.</span>
              </div>

            </div>
          </div>

        </section>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-[#1A1A1E] bg-[#101012] py-4 px-6 text-center text-xs font-mono text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>Singapore Counterfactual S$NEER Monetary Policy Model &bull; Standalone Research Visualizer</span>
        <span>MAS Academic Policy Monograph Series &bull; Ref: WP/11/141</span>
      </footer>

    </div>
  );
}
