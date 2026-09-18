"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sparkles,
  Globe,
  MapPin,
  Check,
  Plus,
  Loader2,
  CheckCircle2,
  Bot,
  Building2,
  Layers,
  ChevronDown,
  Compass,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TIER1_COUNTRIES,
  EXTENDED_TIER1_COUNTRIES,
  ALL_TARGET_COUNTRIES,
  HIGH_TICKET_NICHES,
  AVAILABLE_AI_MODELS,
  CountryConfig,
} from "@/lib/constants/automation";
import { generateTier1KeywordsAction } from "@/lib/actions/automation";
import confetti from "canvas-confetti";

interface AiKeywordGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeywordsAdded?: () => void;
}

const PRIMARY_COUNTRY_CODES: Array<"US" | "GB" | "CA" | "AU"> = ["US", "GB", "CA", "AU"];

export function AiKeywordGeneratorModal({
  open,
  onOpenChange,
  onKeywordsAdded,
}: AiKeywordGeneratorModalProps) {
  // Country Selection
  const [activeTab, setActiveTab] = useState<"PRIMARY" | "EXTENDED">("PRIMARY");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("US");
  const [customCountryName, setCustomCountryName] = useState<string>("");

  // Territory Selection (State & City)
  const [selectedStateCode, setSelectedStateCode] = useState<string>("TX");
  const [selectedCity, setSelectedCity] = useState<string>("Katy");
  const [isCustomTerritory, setIsCustomTerritory] = useState<boolean>(false);
  const [customStateText, setCustomStateText] = useState<string>("");
  const [customCityText, setCustomCityText] = useState<string>("");

  // Niche & Model
  const [selectedNiche, setSelectedNiche] = useState<string>(HIGH_TICKET_NICHES[0].name);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash-lite");
  const [count, setCount] = useState<number>(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active Country Config
  const activeCountryConfig: CountryConfig = useMemo(() => {
    return (
      ALL_TARGET_COUNTRIES[selectedCountryCode] ||
      TIER1_COUNTRIES.US
    );
  }, [selectedCountryCode]);

  // Available States for selected country
  const availableStates = useMemo(() => {
    return activeCountryConfig.states || [];
  }, [activeCountryConfig]);

  // Active State Object
  const activeStateObj = useMemo(() => {
    return (
      availableStates.find((s) => s.code === selectedStateCode) ||
      availableStates.find((s) => s.isTopDefault) ||
      availableStates[0]
    );
  }, [availableStates, selectedStateCode]);

  // Available Cities for active state
  const availableCities = useMemo(() => {
    return activeStateObj?.cities || [];
  }, [activeStateObj]);

  // When country changes, automatically select its top economic state and top city
  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const country = ALL_TARGET_COUNTRIES[code] || TIER1_COUNTRIES.US;
    const topState = country.states.find((s) => s.isTopDefault) || country.states[0];
    if (topState) {
      setSelectedStateCode(topState.code);
      const topCity = topState.cities.find((c) => c.isTopDefault) || topState.cities[0];
      setSelectedCity(topCity?.name || "ALL");
    }
    setIsCustomTerritory(false);
  };

  // When state changes, automatically select its top city
  const handleStateChange = (stateCode: string) => {
    if (stateCode === "__CUSTOM__") {
      setIsCustomTerritory(true);
      return;
    }
    setIsCustomTerritory(false);
    setSelectedStateCode(stateCode);
    const stateObj = availableStates.find((s) => s.code === stateCode);
    if (stateObj) {
      const topCity = stateObj.cities.find((c) => c.isTopDefault) || stateObj.cities[0];
      setSelectedCity(topCity?.name || "ALL");
    }
  };

  const activeModel =
    AVAILABLE_AI_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_AI_MODELS[0];
  const activeNicheObj =
    HIGH_TICKET_NICHES.find((n) => n.name === selectedNiche) || HIGH_TICKET_NICHES[0];

  // Live Query Matrix Preview
  const sampleQueryPreview = useMemo(() => {
    const stateLabel = isCustomTerritory ? customStateText || "State" : activeStateObj?.code || "TX";
    const cityLabel = isCustomTerritory
      ? customCityText || "Metro Area"
      : selectedCity === "ALL"
      ? activeStateObj?.cities[0]?.name || "Katy"
      : selectedCity;

    return `${activeNicheObj.defaultSearch} in ${cityLabel}, ${stateLabel}`;
  }, [activeNicheObj, selectedCity, activeStateObj, isCustomTerritory, customStateText, customCityText]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSuccessMessage(null);

    const finalState = isCustomTerritory ? customStateText.trim() : activeStateObj?.name;
    const finalCity = isCustomTerritory ? customCityText.trim() : selectedCity;

    try {
      const res = await generateTier1KeywordsAction({
        country: selectedCountryCode,
        state: finalState,
        city: finalCity === "ALL" ? undefined : finalCity,
        niche: selectedNiche,
        count,
        modelId: selectedModel,
        customCountryName: customCountryName.trim() || undefined,
      });

      if (res.success) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        setSuccessMessage(
          `Successfully queued ${res.addedCount} high-ticket search queries for ${activeCountryConfig.name}!`
        );
        setTimeout(() => {
          onOpenChange(false);
          setSuccessMessage(null);
          if (onKeywordsAdded) onKeywordsAdded();
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate AI keywords");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pb-3 border-b border-border/60">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>AI Territory Matrix Scout</span>
                <Badge variant="purple" className="text-[9px] uppercase font-mono">
                  Multi-Model Intelligence
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Generate systematic, high-intent Google Maps queries across Tier-1 economic powerhouses.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-1 text-xs">
          {/* 1. Country Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-indigo-500" />
                <span>Target Country (Tier-1 Economies)</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-normal">
                Currency: <span className="font-mono text-primary font-bold">{activeCountryConfig.currency}</span>
              </span>
            </div>

            {/* Country Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {PRIMARY_COUNTRY_CODES.map((code) => {
                const c = TIER1_COUNTRIES[code];
                const isSelected = selectedCountryCode === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setActiveTab("PRIMARY");
                      handleCountryChange(code);
                    }}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected && activeTab === "PRIMARY"
                        ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30 text-foreground shadow-2xs font-bold"
                        : "bg-muted/40 border-border/70 hover:border-border text-muted-foreground"
                    }`}
                  >
                    <span className="text-lg shrink-0">{c.flag}</span>
                    <div className="truncate">
                      <div className="text-[11px] leading-tight">{c.code}</div>
                      <div className="text-[10px] opacity-75 truncate">{c.name.split(" ")[0]}</div>
                    </div>
                  </button>
                );
              })}

              {/* 5th Tab: Extended & Custom Country */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("EXTENDED");
                  if (PRIMARY_COUNTRY_CODES.includes(selectedCountryCode as any)) {
                    handleCountryChange("DE");
                  }
                }}
                className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === "EXTENDED"
                    ? "bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/30 text-foreground shadow-2xs font-bold"
                    : "bg-muted/40 border-border/70 hover:border-border text-muted-foreground"
                }`}
              >
                <span className="text-lg shrink-0">🌍</span>
                <div className="truncate">
                  <div className="text-[11px] leading-tight">Extended</div>
                  <div className="text-[10px] opacity-75 truncate">Tier-1 & Custom</div>
                </div>
              </button>
            </div>

            {/* Extended Country Dropdown (if Extended tab active) */}
            {activeTab === "EXTENDED" && (
              <div className="p-3 rounded-2xl bg-muted/40 border border-indigo-500/20 space-y-2 animate-in fade-in">
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedCountryCode}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground cursor-pointer font-medium"
                  >
                    <optgroup label="Additional Tier-1 Economic Markets">
                      {Object.keys(EXTENDED_TIER1_COUNTRIES).map((code) => {
                        const c = EXTENDED_TIER1_COUNTRIES[code];
                        return (
                          <option key={code} value={code}>
                            {c.flag} {c.name} ({c.currency})
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="Custom Territory">
                      <option value="CUSTOM">✍️ Enter Custom Country Name & Territory</option>
                    </optgroup>
                  </select>

                  {selectedCountryCode === "CUSTOM" && (
                    <Input
                      placeholder="e.g. Norway, Switzerland, Singapore"
                      value={customCountryName}
                      onChange={(e) => setCustomCountryName(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-card"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Territory Selector: High-Economic Density State & City Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-muted/30 dark:bg-zinc-950/40 border border-border/70">
            {/* Top Economic States */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                  Top Economic State / Region
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  High purchasing power
                </span>
              </label>

              {!isCustomTerritory ? (
                <select
                  value={selectedStateCode}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground cursor-pointer font-medium"
                >
                  {availableStates.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code}) {s.isTopDefault ? "★ Default Hub" : ""}
                    </option>
                  ))}
                  <option value="__CUSTOM__">✍️ Custom State / Region...</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <Input
                    placeholder="e.g. Texas or TX"
                    value={customStateText}
                    onChange={(e) => setCustomStateText(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-card"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomTerritory(false)}
                    className="h-9 text-[10px] px-2"
                  >
                    Reset
                  </Button>
                </div>
              )}
            </div>

            {/* Affluent City / Commercial Corridor */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>City Hub / Commercial Cluster</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {selectedCity === "ALL" ? "Blanket Matrix Mode" : "Single Hub"}
                </span>
              </label>

              {!isCustomTerritory ? (
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground cursor-pointer font-medium"
                >
                  <option value="ALL">
                    🌐 Blanket All Top Hubs in {activeStateObj?.code || "State"} (Matrix Mode)
                  </option>
                  {availableCities.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} {c.isTopDefault ? "★ Top Commercial Center" : `(${c.type?.replace("_", " ")})`}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="e.g. Katy, The Woodlands, Austin"
                  value={customCityText}
                  onChange={(e) => setCustomCityText(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-card"
                />
              )}
            </div>
          </div>

          {/* 3. High-Ticket Industry Niche Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                <span>Commercial Industry & High-Ticket Niche</span>
              </label>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                Avg: {activeNicheObj.avgContract}
              </Badge>
            </div>

            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground cursor-pointer font-medium"
            >
              {HIGH_TICKET_NICHES.map((n) => (
                <option key={n.id} value={n.name}>
                  {n.isTopDefault ? "🔥 [TOP PRIORITY] " : ""}
                  {n.name} — ({n.avgContract} deal size • {n.urgency} urgency)
                </option>
              ))}
            </select>
          </div>

          {/* 4. AI Engine & Fallback Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-indigo-500" />
                  <span>AI Model Engine</span>
                </label>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground cursor-pointer font-medium"
              >
                {AVAILABLE_AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.freeTierLimit}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch Count */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-foreground">Query Matrix Batch Size</label>
                <span className="font-mono text-primary font-bold">{count} search queries</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      count === num
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-muted/40 border-border/60 hover:border-border text-muted-foreground"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Live Combinatorial Search Matrix Preview */}
          <div className="p-3 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-1.5">
            <div className="font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <Compass className="h-3.5 w-3.5" />
                <span>Live Query Matrix Preview:</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {activeCountryConfig.flag} {activeCountryConfig.name} • {activeStateObj?.code || "TX"}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-border/80 text-[11px] font-mono text-slate-800 dark:text-zinc-200 flex items-center justify-between">
              <span className="truncate">"{sampleQueryPreview}"</span>
              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">Google Maps Query</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Targeting:{" "}
              <span className="text-foreground font-medium">
                {selectedCity === "ALL"
                  ? availableCities.map((c) => c.name).slice(0, 5).join(", ") + "..."
                  : selectedCity}
              </span>{" "}
              in {activeStateObj?.name} with automated cascade to free Groq LPU & zero-API matrix fallback.
            </p>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl text-xs cursor-pointer"
            disabled={isGenerating}
          >
            Cancel
          </Button>

          <Button
            variant="gradient"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Scouting Matrix with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate & Queue {count} Territory Queries</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
