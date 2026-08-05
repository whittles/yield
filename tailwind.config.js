/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Althoff Woodshop brand palette (extracted from althoffwoodshop.com)
        bg:       '#f5f4f0',       // warm off-white page background
        surface:  '#ffffff',       // card / panel background
        'surface-alt': '#f3f3f3', // alternate surface (matches site scheme-2)
        border:   '#e5e3de',       // warm-tinted border
        header:   '#242833',       // dark header (from site color-scheme-3)
        accent:   '#121212',       // near-black buttons / CTA (matches site buttons)
        'accent-hover': '#2d2d2d',
        success:  '#166534',
        'success-bg': '#dcfce7',
        warning:  '#92400e',
        'warning-bg': '#fef3c7',
        danger:   '#991b1b',
        'danger-bg': '#fee2e2',
        // Text ramp. The old #6b7280 muted token measured 4.39:1 on `bg` and
        // 4.36:1 on `surface-alt` — under AA on the two warm surfaces it was
        // used on most, which made it the single cause of every contrast
        // failure in the app. The ramp below clears 4.5:1 on all three.
        'text-primary':   '#121212',  // 17.0:1 on bg
        'text-secondary': '#4b5563',  //  6.9:1 on bg
        'text-muted':     '#656c78',  //  4.8:1 on bg · 4.8:1 on surface-alt
        // Kept as an alias so existing usages don't silently regress; there is
        // no lighter gray that still passes on the warm backgrounds.
        'text-light':     '#656c78',
        // Secondary text on the dark header — 7.4:1 on `header`.
        'header-muted':   '#a3abb8',

        // Timber palette. Extended from the end-grain colors the Resaw view
        // already used, so diagrams across the app read as one material rather
        // than as generic chart series.
        'timber-face':  '#e8d5b0',
        'timber-edge':  '#d4a84b',
        'timber-core':  '#8b6914',
        'timber-waste': '#cfcabc',
      },
      fontFamily: {
        sans: ['Assistant', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Tinted in the header's slate rather than neutral black — black
        // shadow on a warm ground reads as dirt.
        sheet: '0 1px 2px rgba(36, 40, 51, 0.04), 0 1px 1px rgba(36, 40, 51, 0.03)',
        lifted: '0 6px 16px -4px rgba(36, 40, 51, 0.18), 0 2px 6px -2px rgba(36, 40, 51, 0.10)',
      },
      fontSize: {
        xs:   ['0.75rem',  { lineHeight: '1rem' }],
        sm:   ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem',     { lineHeight: '1.5rem' }],
        lg:   ['1.125rem', { lineHeight: '1.75rem' }],
        xl:   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':['1.5rem',   { lineHeight: '2rem' }],
      },
    },
  },
  plugins: [],
}
