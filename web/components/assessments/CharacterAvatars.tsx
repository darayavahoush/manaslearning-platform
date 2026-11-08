'use client'
import React from 'react'

// Bespoke Storybook Vector Character Portraits for Quest Welcome Wizard
// Designed specifically for children ages 4-14: expressive, charming, friendly, and instantly understandable.

// ----------------------------------------------------------------------
// ADHD: Sunbird Valley Explorer Guild Classes
// ----------------------------------------------------------------------

export function CanopyRangerAvatarSvg({className = 'w-full h-full'}: {className?: string}) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Canopy Sky Ranger">
      <defs>
        <radialGradient id="rangerSky" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="55%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
        <linearGradient id="rangerCowl" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="rangerBow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B45309" />
          <stop offset="50%" stopColor="#78350F" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>

      {/* Background Sunrise Canopy */}
      <rect width="240" height="180" fill="url(#rangerSky)" />
      {/* Distant Trees */}
      <path d="M-10 180 L20 120 L50 180 Z" fill="#047857" opacity="0.25" />
      <path d="M190 180 L220 115 L250 180 Z" fill="#047857" opacity="0.25" />
      <circle cx="210" cy="45" r="28" fill="#FFFBEB" opacity="0.6" />

      {/* Ranger Carved Bow on Shoulder */}
      <path d="M50 170 Q30 90 65 30 Q70 28 73 32 Q40 90 60 170 Z" fill="url(#rangerBow)" stroke="#451A03" strokeWidth="1.5" />
      <path d="M68 32 L56 168" stroke="#FEF3C7" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
      {/* Golden Feather on Bow */}
      <path d="M65 30 C72 20 85 24 80 34 C76 31 70 31 65 30 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1" />

      {/* Shoulders & Forest Tunic */}
      <path d="M60 180 C60 145 90 135 120 135 C150 135 180 145 180 180 Z" fill="#065F46" />
      {/* Tunic Collar & Leather Straps */}
      <path d="M100 135 L120 162 L140 135" fill="#047857" stroke="#FDE68A" strokeWidth="1.5" />
      <path d="M85 140 L155 178" stroke="#92400E" strokeWidth="5" strokeLinecap="round" />
      <circle cx="118" cy="158" r="4.5" fill="#FBBF24" stroke="#78350F" strokeWidth="1.2" />

      {/* Ranger Hooded Cowl (Back) */}
      <ellipse cx="120" cy="85" rx="46" ry="50" fill="#047857" />

      {/* Face & Ears */}
      <ellipse cx="80" cy="88" rx="8" ry="12" fill="#F5D0A9" />
      <ellipse cx="160" cy="88" rx="8" ry="12" fill="#F5D0A9" />
      <path d="M82 80 C82 50 120 48 120 48 C120 48 158 50 158 80 C158 112 142 126 120 126 C98 126 82 112 82 80 Z" fill="#F5D0A9" />

      {/* Messy Scout Hair */}
      <path d="M86 68 C92 50 110 44 120 44 C132 44 150 50 154 68 C144 60 134 60 128 66 C120 58 112 58 104 65 C98 60 92 62 86 68 Z" fill="#78350F" />
      <path d="M86 68 C84 78 88 84 90 86 C89 78 92 72 95 70 Z" fill="#78350F" />
      <path d="M154 68 C156 78 152 84 150 86 C151 78 148 72 145 70 Z" fill="#78350F" />

      {/* Ranger Hooded Cowl (Front Frame) */}
      <path d="M76 80 C76 42 100 34 120 34 C140 34 164 42 164 80 C164 96 158 112 152 120 C140 128 132 128 120 128 C108 128 100 128 88 120 C82 112 76 96 76 80 Z" fill="none" stroke="url(#rangerCowl)" strokeWidth="8" strokeLinejoin="round" />
      {/* Scout Eagle Feather on Hood */}
      <g transform="translate(150, 40) rotate(25)">
        <path d="M0 0 C6 -15 18 -20 20 -25 C14 -18 8 -10 0 0 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
        <path d="M2 -3 C6 -14 14 -18 18 -22" stroke="#FFFBEB" strokeWidth="1" />
      </g>

      {/* Cheerful Eyebrows */}
      <path d="M96 76 Q106 72 113 75" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M144 76 Q134 72 127 75" stroke="#451A03" strokeWidth="2.5" strokeLinecap="round" />

      {/* Sparkling Observant Eyes */}
      <ellipse cx="104" cy="85" rx="6.5" ry="7.5" fill="#451A03" />
      <ellipse cx="136" cy="85" rx="6.5" ry="7.5" fill="#451A03" />
      <circle cx="106" cy="83" r="2.5" fill="#FFFFFF" />
      <circle cx="138" cy="83" r="2.5" fill="#FFFFFF" />
      <circle cx="103" cy="87" r="1.2" fill="#FFFFFF" />
      <circle cx="135" cy="87" r="1.2" fill="#FFFFFF" />

      {/* Cute Freckles */}
      <circle cx="98" cy="94" r="0.9" fill="#B45309" opacity="0.6" />
      <circle cx="102" cy="96" r="0.9" fill="#B45309" opacity="0.6" />
      <circle cx="106" cy="94" r="0.9" fill="#B45309" opacity="0.6" />
      <circle cx="134" cy="94" r="0.9" fill="#B45309" opacity="0.6" />
      <circle cx="138" cy="96" r="0.9" fill="#B45309" opacity="0.6" />
      <circle cx="142" cy="94" r="0.9" fill="#B45309" opacity="0.6" />

      {/* Cute Button Nose */}
      <path d="M118 92 Q120 95 122 92" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />

      {/* Big Confident Smile */}
      <path d="M107 103 Q120 115 133 103" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="#F87171" />
      {/* Rosy Cheeks */}
      <ellipse cx="94" cy="95" rx="6" ry="4" fill="#F87171" opacity="0.35" />
      <ellipse cx="146" cy="95" rx="6" ry="4" fill="#F87171" opacity="0.35" />

      {/* Drifting Golden Leaves */}
      <g transform="translate(30, 45) rotate(15)">
        <path d="M0 0 C6 -8 14 -4 12 4 C8 8 2 6 0 0 Z" fill="#FBBF24" opacity="0.85" />
      </g>
      <g transform="translate(195, 125) rotate(-20)">
        <path d="M0 0 C5 -6 12 -3 10 3 C7 6 2 5 0 0 Z" fill="#F59E0B" opacity="0.75" />
      </g>
    </svg>
  )
}

export function AstralSpellcasterAvatarSvg({className = 'w-full h-full'}: {className?: string}) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Astral Spellcaster">
      <defs>
        <radialGradient id="astralSky" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#EDE9FE" />
          <stop offset="40%" stopColor="#C4B5FD" />
          <stop offset="85%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#4C1D95" />
        </radialGradient>
        <linearGradient id="astralCape" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="60%" stopColor="#5B21B6" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>
        <linearGradient id="wandGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Background Starlight Twilight */}
      <rect width="240" height="180" fill="url(#astralSky)" />
      {/* Constellations */}
      <line x1="30" y1="35" x2="60" y2="25" stroke="#DDD6FE" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <line x1="60" y1="25" x2="85" y2="45" stroke="#DDD6FE" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <circle cx="30" cy="35" r="2.5" fill="#FEF08A" />
      <circle cx="60" cy="25" r="3" fill="#FFFFFF" />
      <circle cx="85" cy="45" r="2" fill="#FEF08A" />

      <circle cx="195" cy="30" r="2" fill="#FEF08A" />
      <circle cx="215" cy="50" r="2.5" fill="#FFFFFF" />
      <line x1="195" y1="30" x2="215" y2="50" stroke="#DDD6FE" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

      {/* Shoulders & Magic Robe */}
      <path d="M55 180 C55 145 85 135 120 135 C155 135 185 145 185 180 Z" fill="url(#astralCape)" />
      {/* Star Embellished Mantle Collar */}
      <path d="M90 135 L120 165 L150 135 Z" fill="#4338CA" stroke="#FDE047" strokeWidth="1.5" />
      <polygon points="120,146 123,153 130,153 124,157 126,164 120,160 114,164 116,157 110,153 117,153" fill="#FDE047" />

      {/* Cape Hood (Back) */}
      <ellipse cx="120" cy="84" rx="48" ry="52" fill="#312E81" />

      {/* Face & Big Cheerful Ears */}
      <ellipse cx="78" cy="88" rx="8" ry="12" fill="#FED7AA" />
      <ellipse cx="162" cy="88" rx="8" ry="12" fill="#FED7AA" />
      <path d="M80 80 C80 50 120 48 120 48 C120 48 160 50 160 80 C160 112 144 126 120 126 C96 126 80 112 80 80 Z" fill="#FED7AA" />

      {/* Midnight Indigo Flowing Hair */}
      <path d="M76 75 C76 44 100 36 120 36 C140 36 164 44 164 75 C156 62 144 58 136 62 C126 54 114 54 106 62 C96 58 84 62 76 75 Z" fill="#1E1B4B" />
      <path d="M78 76 C76 96 82 108 85 112 C82 100 84 88 88 82 Z" fill="#1E1B4B" />
      <path d="M162 76 C164 96 158 108 155 112 C158 100 156 88 152 82 Z" fill="#1E1B4B" />

      {/* Golden Star Hairpin */}
      <g transform="translate(142, 54)">
        <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#FBBF24" stroke="#D97706" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="1.5" fill="#FFFBEB" />
      </g>

      {/* Curious Mage Eyebrows */}
      <path d="M94 74 Q105 68 114 73" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M146 74 Q135 68 126 73" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />

      {/* Wonder-Filled Star Eyes */}
      <ellipse cx="104" cy="84" rx="7" ry="8" fill="#4C1D95" />
      <ellipse cx="136" cy="84" rx="7" ry="8" fill="#4C1D95" />
      <circle cx="104" cy="84" r="5" fill="#3B82F6" />
      <circle cx="136" cy="84" r="5" fill="#3B82F6" />
      {/* Catchlights */}
      <circle cx="106" cy="81" r="2.8" fill="#FFFFFF" />
      <circle cx="138" cy="81" r="2.8" fill="#FFFFFF" />
      <circle cx="102" cy="86" r="1.2" fill="#FFFFFF" />
      <circle cx="134" cy="86" r="1.2" fill="#FFFFFF" />

      {/* Button Nose */}
      <circle cx="120" cy="92" r="1.5" fill="#EA580C" opacity="0.6" />

      {/* Wonder Smile */}
      <path d="M109 102 Q120 114 131 102" stroke="#4C1D95" strokeWidth="2.5" strokeLinecap="round" fill="#F472B6" />
      {/* Rosy Violet Cheeks */}
      <ellipse cx="93" cy="95" rx="6" ry="4" fill="#F472B6" opacity="0.4" />
      <ellipse cx="147" cy="95" rx="6" ry="4" fill="#F472B6" opacity="0.4" />

      {/* Crystal Star Wand (Foreground Left) */}
      <g transform="translate(42, 60) rotate(-15)">
        <rect x="14" y="25" width="4" height="85" rx="2" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1" />
        <circle cx="16" cy="22" r="16" fill="#FEF08A" opacity="0.35" />
        <polygon points="16,8 20,18 30,19 22,25 25,35 16,29 7,35 10,25 2,19 12,18" fill="url(#wandGlow)" stroke="#B45309" strokeWidth="1" />
        <circle cx="16" cy="22" r="4" fill="#FFFFFF" />
      </g>

      {/* Floating Magic Sparks */}
      <circle cx="78" cy="65" r="1.8" fill="#FEF08A" />
      <circle cx="178" cy="115" r="1.5" fill="#FEF08A" />
      <circle cx="190" cy="95" r="2" fill="#DDD6FE" />
    </svg>
  )
}

export function SunfireKnightAvatarSvg({className = 'w-full h-full'}: {className?: string}) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sunfire Knight">
      <defs>
        <radialGradient id="sunfireSky" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="50%" stopColor="#FDE68A" />
          <stop offset="85%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
        <linearGradient id="armorGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
        <linearGradient id="shieldShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>

      {/* Background Dawn Rays */}
      <rect width="240" height="180" fill="url(#sunfireSky)" />
      {/* Sun Rays */}
      <path d="M120 70 L90 -20 L150 -20 Z" fill="#FFFBEB" opacity="0.3" />
      <path d="M120 70 L-20 40 L-20 100 Z" fill="#FFFBEB" opacity="0.25" />
      <path d="M120 70 L260 40 L260 100 Z" fill="#FFFBEB" opacity="0.25" />

      {/* Brave Hero Capelet */}
      <path d="M60 180 C50 145 75 130 120 130 C165 130 190 145 180 180 Z" fill="#DC2626" />

      {/* Golden Breastplate & Pauldrons */}
      <path d="M70 180 C70 148 92 138 120 138 C148 138 170 148 170 180 Z" fill="url(#armorGold)" stroke="#78350F" strokeWidth="2" />
      {/* Pauldrons (Shoulder Guards) */}
      <path d="M60 155 C55 140 75 136 90 144 C82 158 72 165 60 155 Z" fill="url(#armorGold)" stroke="#78350F" strokeWidth="1.5" />
      <path d="M180 155 C185 140 165 136 150 144 C158 158 168 165 180 155 Z" fill="url(#armorGold)" stroke="#78350F" strokeWidth="1.5" />

      {/* Embossed Sun Sigil on Chest */}
      <circle cx="120" cy="162" r="8" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />
      <path d="M120 150 L120 174 M108 162 L132 162 M112 154 L128 170 M112 170 L128 154" stroke="#B45309" strokeWidth="1.2" />

      {/* Hero Head & Ears */}
      <ellipse cx="78" cy="86" rx="8" ry="12" fill="#E0A96D" />
      <ellipse cx="162" cy="86" rx="8" ry="12" fill="#E0A96D" />
      <path d="M80 78 C80 48 120 46 120 46 C120 46 160 48 160 78 C160 110 144 126 120 126 C96 126 80 110 80 78 Z" fill="#E0A96D" />

      {/* Tousled Auburn Hero Hair */}
      <path d="M78 72 C78 40 102 32 120 32 C138 32 162 40 162 72 C154 58 144 54 138 60 C130 50 118 50 110 60 C100 54 88 58 78 72 Z" fill="#451A03" />
      <path d="M78 72 C74 88 80 96 84 100 C80 90 82 80 86 76 Z" fill="#451A03" />
      <path d="M162 72 C166 88 160 96 156 100 C160 90 158 80 154 76 Z" fill="#451A03" />

      {/* Golden Knight Circlet Headband */}
      <path d="M78 68 C102 62 138 62 162 68 L160 74 C138 68 102 68 80 74 Z" fill="url(#armorGold)" stroke="#78350F" strokeWidth="1" />
      <polygon points="120,58 124,66 120,68 116,66" fill="#FDE047" stroke="#78350F" strokeWidth="1" />
      <circle cx="120" cy="67" r="2.5" fill="#DC2626" />

      {/* Determined & Kind Eyebrows */}
      <path d="M94 76 Q106 72 114 76" stroke="#451A03" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M146 76 Q134 72 126 76" stroke="#451A03" strokeWidth="2.8" strokeLinecap="round" />

      {/* Bright Amber Eyes */}
      <ellipse cx="104" cy="85" rx="6.5" ry="7.5" fill="#451A03" />
      <ellipse cx="136" cy="85" rx="6.5" ry="7.5" fill="#451A03" />
      <circle cx="104" cy="85" r="4.5" fill="#D97706" />
      <circle cx="136" cy="85" r="4.5" fill="#D97706" />
      <circle cx="106" cy="83" r="2.5" fill="#FFFFFF" />
      <circle cx="138" cy="83" r="2.5" fill="#FFFFFF" />

      {/* Sturdy Nose */}
      <path d="M118 91 Q120 94 122 91" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />

      {/* Big Friendly Hero Grin */}
      <path d="M106 103 Q120 117 134 103" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="#FFFFFF" />
      {/* Rosy Cheeks */}
      <ellipse cx="93" cy="95" rx="6" ry="4" fill="#EA580C" opacity="0.3" />
      <ellipse cx="147" cy="95" rx="6" ry="4" fill="#EA580C" opacity="0.3" />

      {/* Sunstone Shield (Foreground Right) */}
      <g transform="translate(162, 90)">
        <path d="M10 10 Q35 0 60 10 Q55 55 35 75 Q15 55 10 10 Z" fill="url(#shieldShine)" stroke="#78350F" strokeWidth="2" />
        <circle cx="35" cy="35" r="12" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.5" />
        <circle cx="35" cy="35" r="6" fill="#F59E0B" />
        {/* Sun spikes on shield */}
        <path d="M35 18 L35 52 M18 35 L52 35 M23 23 L47 47 M23 47 L47 23" stroke="#B45309" strokeWidth="1.5" />
      </g>
    </svg>
  )
}

// ----------------------------------------------------------------------
// Autism: Lumina Groves Superpower Affinities
// ----------------------------------------------------------------------

export function GroveHarmonizerAvatarSvg({className = 'w-full h-full'}: {className?: string}) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Grove Harmonizer">
      <defs>
        <radialGradient id="groveSky" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#F0FDF4" />
          <stop offset="50%" stopColor="#DCFCE7" />
          <stop offset="85%" stopColor="#86EFAC" />
          <stop offset="100%" stopColor="#34D399" />
        </radialGradient>
        <linearGradient id="natureTunic" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
      </defs>

      {/* Background Soft Dappled Forest */}
      <rect width="240" height="180" fill="url(#groveSky)" />
      {/* Gentle Canopy Bokeh Circles */}
      <circle cx="45" cy="40" r="22" fill="#FFFFFF" opacity="0.45" />
      <circle cx="195" cy="50" r="26" fill="#FFFFFF" opacity="0.4" />
      <circle cx="120" cy="20" r="18" fill="#FFFFFF" opacity="0.3" />

      {/* Shoulders & Linen Tunic */}
      <path d="M55 180 C55 145 85 135 120 135 C155 135 185 145 185 180 Z" fill="url(#natureTunic)" />
      {/* Embroidered Vine Neckline */}
      <path d="M95 135 Q120 155 145 135" stroke="#A7F3D0" strokeWidth="2.5" fill="none" />
      <circle cx="108" cy="142" r="2" fill="#FEF08A" />
      <circle cx="120" cy="146" r="2.5" fill="#FEF08A" />
      <circle cx="132" cy="142" r="2" fill="#FEF08A" />

      {/* Head & Ears */}
      <ellipse cx="78" cy="88" rx="8" ry="12" fill="#E6CA9A" />
      <ellipse cx="162" cy="88" rx="8" ry="12" fill="#E6CA9A" />
      <path d="M80 80 C80 50 120 48 120 48 C120 48 160 50 160 80 C160 112 144 126 120 126 C96 126 80 112 80 80 Z" fill="#E6CA9A" />

      {/* Dark Braided Hair */}
      <path d="M78 72 C78 40 102 32 120 32 C138 32 162 40 162 72 C154 58 144 54 136 60 C128 50 116 50 108 60 C98 54 88 58 78 72 Z" fill="#1C1917" />
      <path d="M78 72 C74 94 80 110 82 116 C80 104 80 90 84 82 Z" fill="#1C1917" />
      <path d="M162 72 C166 94 160 110 158 116 C160 104 160 90 156 82 Z" fill="#1C1917" />

      {/* Wreath of Clover Leaves & Jasmine Buds */}
      <path d="M76 64 C98 52 142 52 164 64" stroke="#047857" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Clover Clusters */}
      <g transform="translate(86, 56)">
        <circle cx="0" cy="0" r="3.5" fill="#34D399" />
        <circle cx="4" cy="-2" r="3.5" fill="#10B981" />
        <circle cx="2" cy="3" r="3.5" fill="#059669" />
      </g>
      <g transform="translate(154, 56)">
        <circle cx="0" cy="0" r="3.5" fill="#34D399" />
        <circle cx="-4" cy="-2" r="3.5" fill="#10B981" />
        <circle cx="-2" cy="3" r="3.5" fill="#059669" />
      </g>
      {/* Jasmine Blossom in Center */}
      <g transform="translate(120, 52)">
        <circle cx="-3" cy="0" r="3" fill="#FFFFFF" />
        <circle cx="3" cy="0" r="3" fill="#FFFFFF" />
        <circle cx="0" cy="-3" r="3" fill="#FFFFFF" />
        <circle cx="0" cy="3" r="3" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="2" fill="#FDE047" />
      </g>

      {/* Gentle Relaxed Eyebrows */}
      <path d="M95 76 Q106 72 113 75" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M145 76 Q134 72 127 75" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />

      {/* Gentle Green Smiling Eyes */}
      <ellipse cx="104" cy="85" rx="6.5" ry="7" fill="#064E3B" />
      <ellipse cx="136" cy="85" rx="6.5" ry="7" fill="#064E3B" />
      <circle cx="104" cy="85" r="4.5" fill="#059669" />
      <circle cx="136" cy="85" r="4.5" fill="#059669" />
      <circle cx="106" cy="83" r="2.5" fill="#FFFFFF" />
      <circle cx="138" cy="83" r="2.5" fill="#FFFFFF" />
      <circle cx="103" cy="87" r="1.2" fill="#FFFFFF" />
      <circle cx="135" cy="87" r="1.2" fill="#FFFFFF" />

      {/* Gentle Smile */}
      <path d="M108 103 Q120 114 132 103" stroke="#064E3B" strokeWidth="2.5" strokeLinecap="round" fill="#FCA5A5" />
      {/* Soft Rosy Cheeks */}
      <ellipse cx="94" cy="95" rx="6" ry="4" fill="#FCA5A5" opacity="0.4" />
      <ellipse cx="146" cy="95" rx="6" ry="4" fill="#FCA5A5" opacity="0.4" />

      {/* Two Glowing Friendly Fireflies */}
      <g transform="translate(42, 95)">
        <circle cx="0" cy="0" r="10" fill="#FEF08A" opacity="0.35" />
        <circle cx="0" cy="0" r="4.5" fill="#FEF08A" />
        <ellipse cx="-2" cy="-4" rx="2" ry="4" fill="#FFFFFF" opacity="0.7" transform="rotate(-20)" />
        <ellipse cx="2" cy="-4" rx="2" ry="4" fill="#FFFFFF" opacity="0.7" transform="rotate(20)" />
        <path d="M-8 8 Q-12 16 -18 20" stroke="#FEF08A" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      </g>
      <g transform="translate(198, 85)">
        <circle cx="0" cy="0" r="9" fill="#FEF08A" opacity="0.35" />
        <circle cx="0" cy="0" r="4" fill="#FEF08A" />
        <ellipse cx="-2" cy="-3.5" rx="1.8" ry="3.5" fill="#FFFFFF" opacity="0.7" transform="rotate(-20)" />
        <ellipse cx="2" cy="-3.5" rx="1.8" ry="3.5" fill="#FFFFFF" opacity="0.7" transform="rotate(20)" />
        <path d="M8 8 Q12 14 16 18" stroke="#FEF08A" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      </g>
    </svg>
  )
}

export function CrystalAlchemistAvatarSvg({className = 'w-full h-full'}: {className?: string}) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Crystal Alchemist">
      <defs>
        <radialGradient id="alchemistSky" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F0FDFA" />
          <stop offset="45%" stopColor="#CCFBF1" />
          <stop offset="85%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#14B8A6" />
        </radialGradient>
        <linearGradient id="alchemistVest" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F766E" />
          <stop offset="60%" stopColor="#115E59" />
          <stop offset="100%" stopColor="#134E4A" />
        </linearGradient>
        <linearGradient id="flaskLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="50%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>

      {/* Background Lumina Apothecary */}
      <rect width="240" height="180" fill="url(#alchemistSky)" />
      {/* Subtle Crystal Facets */}
      <polygon points="25,20 45,10 40,35" fill="#FFFFFF" opacity="0.35" />
      <polygon points="195,15 215,25 210,45" fill="#FFFFFF" opacity="0.35" />
      <circle cx="210" cy="90" r="18" fill="#CCFBF1" opacity="0.5" />

      {/* Shoulders & Alchemist Vest */}
      <path d="M55 180 C55 145 85 135 120 135 C155 135 185 145 185 180 Z" fill="url(#alchemistVest)" />
      {/* Leather Harness with Tiny Potion Vials */}
      <path d="M85 140 L155 178" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
      {/* Small Vial 1 (Rose Pink) */}
      <rect x="96" y="142" width="6" height="14" rx="2" fill="#F472B6" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="99" cy="141" r="2" fill="#B45309" />
      {/* Small Vial 2 (Amber Gold) */}
      <rect x="106" y="148" width="6" height="14" rx="2" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="109" cy="147" r="2" fill="#B45309" />

      {/* Head & Ears */}
      <ellipse cx="78" cy="88" rx="8" ry="12" fill="#F5D0A9" />
      <ellipse cx="162" cy="88" rx="8" ry="12" fill="#F5D0A9" />
      <path d="M80 80 C80 50 120 48 120 48 C120 48 160 50 160 80 C160 112 144 126 120 126 C96 126 80 112 80 80 Z" fill="#F5D0A9" />

      {/* Messy Chestnut Curls */}
      <path d="M78 72 C78 40 102 30 120 30 C138 30 162 40 162 72 C154 58 144 54 136 60 C128 50 116 50 108 60 C98 54 88 58 78 72 Z" fill="#431407" />
      <circle cx="82" cy="62" r="8" fill="#431407" />
      <circle cx="158" cy="62" r="8" fill="#431407" />
      <circle cx="120" cy="34" r="9" fill="#431407" />
      <circle cx="102" cy="38" r="8" fill="#431407" />
      <circle cx="138" cy="38" r="8" fill="#431407" />

      {/* Round Brass Scholar Spectacles */}
      <circle cx="104" cy="85" r="13" fill="#FFFFFF" fillOpacity="0.2" stroke="#D97706" strokeWidth="2.5" />
      <circle cx="136" cy="85" r="13" fill="#FFFFFF" fillOpacity="0.2" stroke="#D97706" strokeWidth="2.5" />
      <path d="M117 84 Q120 82 123 84" stroke="#D97706" strokeWidth="2.5" fill="none" />
      <path d="M91 84 L80 82" stroke="#D97706" strokeWidth="2" />
      <path d="M149 84 L160 82" stroke="#D97706" strokeWidth="2" />

      {/* Inquisitive Eyebrows */}
      <path d="M94 68 Q105 64 114 68" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M146 66 Q135 62 126 67" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />

      {/* Observant Turquoise-Teal Eyes */}
      <ellipse cx="104" cy="85" rx="6" ry="7" fill="#134E4A" />
      <ellipse cx="136" cy="85" rx="6" ry="7" fill="#134E4A" />
      <circle cx="104" cy="85" r="4.2" fill="#0D9488" />
      <circle cx="136" cy="85" r="4.2" fill="#0D9488" />
      <circle cx="106" cy="83" r="2.5" fill="#FFFFFF" />
      <circle cx="138" cy="83" r="2.5" fill="#FFFFFF" />

      {/* Button Nose */}
      <circle cx="120" cy="94" r="1.5" fill="#B45309" opacity="0.6" />

      {/* Excited "Eureka" Smile */}
      <path d="M110 104 Q120 114 130 104" stroke="#134E4A" strokeWidth="2.5" strokeLinecap="round" fill="#F472B6" />
      {/* Cheeks */}
      <ellipse cx="92" cy="97" rx="5" ry="3.5" fill="#F472B6" opacity="0.4" />
      <ellipse cx="148" cy="97" rx="5" ry="3.5" fill="#F472B6" opacity="0.4" />

      {/* Luminous Crystal Flask (Foreground Right) */}
      <g transform="translate(160, 85)">
        <rect x="18" y="10" width="8" height="12" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.2" />
        <ellipse cx="22" cy="9" rx="5" ry="2" fill="#B45309" />
        <path d="M16 22 L28 22 L38 52 C39 58 35 64 22 64 C9 64 5 58 6 52 Z" fill="url(#flaskLiquid)" stroke="#0284C7" strokeWidth="1.5" />
        {/* Bubbles in Flask */}
        <circle cx="18" cy="46" r="2" fill="#FFFFFF" opacity="0.8" />
        <circle cx="25" cy="38" r="2.5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="21" cy="54" r="1.5" fill="#FFFFFF" opacity="0.7" />
        {/* Glow halo */}
        <circle cx="22" cy="45" r="16" fill="#2DD4BF" opacity="0.25" />
      </g>
    </svg>
  )
}

export function QuietSeekerAvatarSvg({className = 'w-full h-full'}: {className?: string}) {
  return (
    <svg viewBox="0 0 240 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Quiet Seeker">
      <defs>
        <radialGradient id="seekerSky" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="45%" stopColor="#EDE9FE" />
          <stop offset="85%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </radialGradient>
        <linearGradient id="cozyScarf" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>

      {/* Background Peaceful Lavender Dusk */}
      <rect width="240" height="180" fill="url(#seekerSky)" />
      {/* Soft Crescent Moon */}
      <path d="M205 25 A 12 12 0 0 0 215 45 A 16 16 0 1 1 205 25 Z" fill="#FFFBEB" opacity="0.8" />
      <circle cx="45" cy="50" r="1.5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="65" cy="35" r="2" fill="#FFFFFF" opacity="0.8" />
      <circle cx="175" cy="40" r="1.5" fill="#FFFFFF" opacity="0.6" />

      {/* Shoulders & Soft Wool Sweater */}
      <path d="M55 180 C55 145 85 135 120 135 C155 135 185 145 185 180 Z" fill="#475569" />

      {/* Head & Ears */}
      <ellipse cx="78" cy="88" rx="8" ry="12" fill="#F7D6B5" />
      <ellipse cx="162" cy="88" rx="8" ry="12" fill="#F7D6B5" />
      <path d="M80 80 C80 50 120 48 120 48 C120 48 160 50 160 80 C160 112 144 126 120 126 C96 126 80 112 80 80 Z" fill="#F7D6B5" />

      {/* Glossy Black Bob Hair */}
      <path d="M78 72 C78 40 102 32 120 32 C138 32 162 40 162 72 C154 58 144 54 136 58 C128 52 116 52 108 58 C98 54 88 58 78 72 Z" fill="#0F172A" />
      <path d="M78 72 C74 94 76 112 80 118 C78 106 80 92 84 82 Z" fill="#0F172A" />
      <path d="M162 72 C166 94 164 112 160 118 C162 106 160 92 156 82 Z" fill="#0F172A" />

      {/* Cozy Chunky Knit Scarf Wrapped Around Neck */}
      <ellipse cx="120" cy="128" rx="42" ry="18" fill="url(#cozyScarf)" stroke="#312E81" strokeWidth="1.5" />
      {/* Knitted Rib Texture Lines */}
      <path d="M92 122 L94 138 M102 120 L104 142 M112 118 L114 144 M122 118 L124 144 M132 120 L134 142 M142 122 L144 138" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* Scarf fold overlap */}
      <path d="M110 134 C110 148 126 165 132 172 C138 168 142 150 138 136 Z" fill="#4F46E5" stroke="#312E81" strokeWidth="1.2" />

      {/* Peaceful Gentle Eyebrows */}
      <path d="M95 78 Q106 75 113 78" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M145 78 Q134 75 127 78" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />

      {/* Calm Smiling Deep Eyes */}
      <ellipse cx="104" cy="86" rx="6.5" ry="7" fill="#1E1B4B" />
      <ellipse cx="136" cy="86" rx="6.5" ry="7" fill="#1E1B4B" />
      <circle cx="104" cy="86" r="4.2" fill="#4338CA" />
      <circle cx="136" cy="86" r="4.2" fill="#4338CA" />
      <circle cx="106" cy="84" r="2.5" fill="#FFFFFF" />
      <circle cx="138" cy="84" r="2.5" fill="#FFFFFF" />

      {/* Contented Serene Smile */}
      <path d="M110 102 Q120 110 130 102" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
      {/* Soft Rosy Cheeks */}
      <ellipse cx="94" cy="94" rx="6" ry="4" fill="#F472B6" opacity="0.35" />
      <ellipse cx="146" cy="94" rx="6" ry="4" fill="#F472B6" opacity="0.35" />

      {/* Snowy White Peace Dove (Resting on Shoulder Left) */}
      <g transform="translate(42, 85)">
        {/* Dove Body & Tail */}
        <path d="M0 25 C0 10 16 0 30 8 C36 12 40 20 38 28 C34 36 20 40 10 38 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
        <path d="M0 25 L-12 28 L-4 22 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
        {/* Dove Wing */}
        <path d="M12 20 C14 12 26 12 28 22 C26 28 18 30 12 20 Z" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.2" />
        {/* Dove Head & Golden Beak */}
        <circle cx="28" cy="12" r="7" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
        <polygon points="34,12 41,14 34,16" fill="#F59E0B" />
        <circle cx="30" cy="11" r="1.3" fill="#0F172A" />
        {/* Tiny Olive Leaf in Beak */}
        <path d="M38 14 C44 12 46 8 48 6 C46 10 44 14 38 14 Z" fill="#10B981" />
      </g>
    </svg>
  )
}
