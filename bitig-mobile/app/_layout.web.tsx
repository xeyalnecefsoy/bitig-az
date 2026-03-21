import '../global.css'

// Important: On web, `./_layout` would resolve back to `_layout.web.tsx` (this file),
// causing infinite recursion. Import the non-platform file explicitly.
export { default } from './_layout.tsx'

