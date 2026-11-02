import React from "react";
import { ART_REGISTRY } from "./art";

/**
 * Illustration component for "In Their World"
 * Renders an accessible, zero-layout-shift image grounded in the ART_REGISTRY.
 *
 * @param {Object} props
 * @param {string} [props.artKey] - Key from ART_REGISTRY
 * @param {string} [props.src] - Direct image source fallback if not in registry
 * @param {string} [props.alt] - Accessible description (empty string if decorative)
 * @param {number} [props.width] - Intrinsic width in pixels
 * @param {number} [props.height] - Intrinsic height in pixels
 * @param {boolean} [props.priority=false] - When true (hero/above the fold), uses eager loading and high fetch priority
 * @param {boolean} [props.decorative=false] - Purely decorative, sets alt="" and aria-hidden="true"
 * @param {string} [props.className=""] - Additional CSS class names
 * @param {React.CSSProperties} [props.style] - Optional inline style overrides
 */
export default function Illustration({
  artKey,
  src,
  alt,
  width,
  height,
  priority = false,
  decorative,
  className = "",
  style,
  ...rest
}) {
  const entry = (artKey && ART_REGISTRY[artKey]) || null;

  const finalSrc = src || (entry ? entry.src : "");
  const isDecorative = decorative !== undefined ? decorative : (entry ? Boolean(entry.decorative) : false);
  const finalAlt = isDecorative ? "" : (alt !== undefined ? alt : (entry ? entry.alt : ""));
  const finalWidth = width || (entry ? entry.width : undefined);
  const finalHeight = height || (entry ? entry.height : undefined);

  if (!finalSrc) {
    return null;
  }

  return (
    <img
      src={finalSrc}
      alt={finalAlt}
      width={finalWidth}
      height={finalHeight}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      aria-hidden={isDecorative ? "true" : undefined}
      className={`itw-art ${className}`.trim()}
      style={style}
      {...rest}
    />
  );
}
