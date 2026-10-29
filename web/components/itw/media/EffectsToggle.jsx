import React, { useEffect } from "react";

/**
 * EffectsToggle: One-tap kill-switch for sensory effects (glare, flicker, motion).
 * Automatically honors prefers-reduced-motion on mount and system changes.
 */
export default function EffectsToggle({
  effectsEnabled,
  onToggle,
  className = "",
}) {
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches && effectsEnabled) {
      onToggle(false);
    }
    const listener = (e) => {
      if (e.matches) onToggle(false);
    };
    if (mql.addEventListener) {
      mql.addEventListener("change", listener);
      return () => mql.removeEventListener("change", listener);
    } else if (mql.addListener) {
      mql.addListener(listener);
      return () => mql.removeListener(listener);
    }
  }, [effectsEnabled, onToggle]);

  return (
    <button
      type="button"
      className={`itw-btn-ghost itw-effects-toggle-btn${!effectsEnabled ? " itw-effects-disabled" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={!effectsEnabled}
      onClick={() => onToggle(!effectsEnabled)}
      title={
        effectsEnabled
          ? "Turn off visual glare, flicker, and background video motion"
          : "Turn visual effects back on"
      }
    >
      <span
        className={`itw-effects-status-dot${effectsEnabled ? " itw-dot-active" : " itw-dot-off"}`}
        aria-hidden="true"
      />
      {effectsEnabled ? "Turn off effects" : "Effects off (reduced)"}
    </button>
  );
}
