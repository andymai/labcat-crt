/* Original SVG vignettes recovered from the pre-editorial-pivot playground
   (commit 57f8b1d^). Each is self-contained — colors baked in, no
   currentColor inheritance, no external resources — so they survive being
   embedded as data URLs inside an <img> element.

   The amber and green variants needed minor edits: amber's traces used
   `stroke="currentColor"` (resolves to nothing when divorced from the
   article's preset color), so the amber color is baked in here; the green
   BBS was originally a <pre> with phosphor inherited from the preset, so
   it's rebuilt as SVG with the green baked in. */

const BARS_SVG = `<svg viewBox="0 0 700 400" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="100" height="270" fill="#c0c0c0"/>
<rect x="100" y="0" width="100" height="270" fill="#c0c000"/>
<rect x="200" y="0" width="100" height="270" fill="#00c0c0"/>
<rect x="300" y="0" width="100" height="270" fill="#00c000"/>
<rect x="400" y="0" width="100" height="270" fill="#c000c0"/>
<rect x="500" y="0" width="100" height="270" fill="#c00000"/>
<rect x="600" y="0" width="100" height="270" fill="#0000c0"/>
<rect x="0" y="270" width="100" height="40" fill="#0000c0"/>
<rect x="100" y="270" width="100" height="40" fill="#0a0a0a"/>
<rect x="200" y="270" width="100" height="40" fill="#c000c0"/>
<rect x="300" y="270" width="100" height="40" fill="#0a0a0a"/>
<rect x="400" y="270" width="100" height="40" fill="#00c0c0"/>
<rect x="500" y="270" width="100" height="40" fill="#0a0a0a"/>
<rect x="600" y="270" width="100" height="40" fill="#c0c0c0"/>
<rect x="0" y="310" width="140" height="90" fill="#000c33"/>
<rect x="140" y="310" width="120" height="90" fill="#ffffff"/>
<rect x="260" y="310" width="170" height="90" fill="#1f1264"/>
<rect x="430" y="310" width="50" height="90" fill="#070707"/>
<rect x="480" y="310" width="50" height="90" fill="#0a0a0a"/>
<rect x="530" y="310" width="50" height="90" fill="#0e0e0e"/>
<rect x="580" y="310" width="120" height="90" fill="#070707"/>
</svg>`;

const MONOSCOPE_SVG = `<svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="600" height="450" fill="#1a1a1a"/>
<g stroke="#9aa0a0" stroke-width="1" fill="none" opacity="0.55">
<path d="M 0 75 L 600 75 M 0 150 L 600 150 M 0 225 L 600 225 M 0 300 L 600 300 M 0 375 L 600 375"/>
<path d="M 75 0 L 75 450 M 150 0 L 150 450 M 225 0 L 225 450 M 300 0 L 300 450 M 375 0 L 375 450 M 450 0 L 450 450 M 525 0 L 525 450"/>
</g>
<circle cx="300" cy="225" r="160" stroke="#e8e8e8" stroke-width="2" fill="none"/>
<circle cx="300" cy="225" r="80" stroke="#e8e8e8" stroke-width="1.5" fill="none"/>
<rect x="40" y="40" width="120" height="20" fill="#202020"/>
<rect x="40" y="60" width="120" height="20" fill="#444"/>
<rect x="40" y="80" width="120" height="20" fill="#777"/>
<rect x="40" y="100" width="120" height="20" fill="#aaa"/>
<rect x="40" y="120" width="120" height="20" fill="#e0e0e0"/>
<g stroke="#e8e8e8" stroke-width="1.2" fill="none">
<path d="M 480 60 L 555 80 M 480 75 L 555 80 M 480 90 L 555 80"/>
<path d="M 480 100 L 555 120 M 480 110 L 555 120 M 480 120 L 555 120 M 480 130 L 555 120 M 480 140 L 555 120"/>
</g>
<text x="300" y="232" text-anchor="middle" fill="#f0f0f0" font-family="monospace" font-size="22" font-weight="600">CH 4</text>
<circle cx="100" cy="380" r="15" fill="#c00000"/>
<circle cx="150" cy="380" r="15" fill="#00c000"/>
<circle cx="200" cy="380" r="15" fill="#0000c0"/>
<circle cx="400" cy="380" r="15" fill="#c0c000"/>
<circle cx="450" cy="380" r="15" fill="#c000c0"/>
<circle cx="500" cy="380" r="15" fill="#00c0c0"/>
</svg>`;

const SCOPE_SVG = `<svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg" stroke="#ffb84d" fill="none">
<rect x="0" y="0" width="600" height="220" fill="#1a0f00"/>
<g stroke="#ffb84d" stroke-width="0.5" opacity="0.25">
<path d="M 0 55 L 600 55 M 0 110 L 600 110 M 0 165 L 600 165"/>
<path d="M 75 0 L 75 220 M 150 0 L 150 220 M 225 0 L 225 220 M 300 0 L 300 220 M 375 0 L 375 220 M 450 0 L 450 220 M 525 0 L 525 220"/>
</g>
<path d="M 0 110 L 600 110" stroke-width="0.8" opacity="0.6"/>
<path d="M 0 110 Q 37 30 75 110 T 150 110 T 225 110 T 300 110 T 375 110 T 450 110 T 525 110 T 600 110" stroke-width="2" stroke-linecap="round"/>
<path d="M 0 110 Q 37 70 75 110 T 150 110 T 225 110 T 300 110 T 375 110 T 450 110 T 525 110 T 600 110" stroke-width="1.2" stroke-linecap="round" opacity="0.55"/>
<path d="M 510 30 q 20 -15 30 0 q 10 15 -10 20 q -20 -5 -10 -20 q 10 -15 30 0" stroke-width="1.5" opacity="0.7"/>
</svg>`;

const BBS_SVG = `<svg viewBox="0 0 620 360" xmlns="http://www.w3.org/2000/svg" font-family="ui-monospace, monospace" font-size="14">
<rect width="620" height="360" fill="#0a0a0a"/>
<g fill="#88ff88" xml:space="preserve">
<text x="20" y="30">╔══════════════════════════════════════════════════════╗</text>
<text x="20" y="48">║  L A B C A T   B U L L E T I N   S Y S T E M   v3   ║</text>
<text x="20" y="66">║  ──────────────────────────────────────────────────  ║</text>
<text x="20" y="84">║   1  ▸  File areas        4  ▸  Door games           ║</text>
<text x="20" y="102">║   2  ▸  Message bases     5  ▸  Sysop chat           ║</text>
<text x="20" y="120">║   3  ▸  Local users       6  ▸  Goodbye              ║</text>
<text x="20" y="138">╚══════════════════════════════════════════════════════╝</text>
<text x="20" y="158">Selection: _</text>
<text x="20" y="196">C:\\&gt; dir /w</text>
<text x="20" y="222">Volume in drive C is LABCAT-VOL1</text>
<text x="20" y="248">AUTOEXEC BAT   142    COMMAND  COM 37557</text>
<text x="20" y="266">CONFIG   SYS    87    DOS       &lt;DIR&gt;</text>
<text x="20" y="284">LABCAT   EXE 12842    README   TXT  3104</text>
<text x="20" y="302">SCANDISK LOG   612    UTILS     &lt;DIR&gt;</text>
<text x="20" y="326">8 file(s)      54486 bytes</text>
<text x="20" y="344">C:\\&gt; _</text>
</g>
</svg>`;

const LISA_SVG = `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg" font-family="monospace">
<rect x="20" y="20" width="560" height="280" fill="#fafafa" stroke="#1a1a1a" stroke-width="2"/>
<rect x="20" y="20" width="560" height="26" fill="#fafafa" stroke="#1a1a1a" stroke-width="2"/>
<g stroke="#1a1a1a" stroke-width="1">
<path d="M 22 24 L 578 24 M 22 28 L 578 28 M 22 32 L 578 32 M 22 36 L 578 36 M 22 40 L 578 40"/>
</g>
<rect x="220" y="22" width="160" height="22" fill="#fafafa"/>
<text x="300" y="38" text-anchor="middle" fill="#1a1a1a" font-size="13">Q1.report</text>
<rect x="30" y="26" width="14" height="14" fill="#fafafa" stroke="#1a1a1a" stroke-width="1.5"/>
<g fill="#1a1a1a" font-size="13">
<text x="40" y="80">Tonight, finalize fab specs</text>
<text x="40" y="100">for the labcat prototype.</text>
<text x="40" y="135">Tasks ▸</text>
<text x="60" y="155">☐ etch silkscreen</text>
<text x="60" y="175">☐ pour solder paste</text>
<text x="60" y="195">☑ verify pinout</text>
<text x="60" y="215">☐ smoke test</text>
</g>
<g transform="translate(450, 70)">
<rect x="0" y="0" width="90" height="70" fill="#fafafa" stroke="#1a1a1a" stroke-width="2"/>
<rect x="8" y="8" width="74" height="42" fill="#1a1a1a"/>
<circle cx="32" cy="24" r="2" fill="#fafafa"/>
<circle cx="58" cy="24" r="2" fill="#fafafa"/>
<path d="M 30 36 Q 45 44 60 36" stroke="#fafafa" stroke-width="2" fill="none"/>
<rect x="36" y="50" width="18" height="6" fill="#fafafa" stroke="#1a1a1a" stroke-width="1.5"/>
<rect x="20" y="56" width="50" height="6" fill="#fafafa" stroke="#1a1a1a" stroke-width="1.5"/>
<text x="45" y="84" text-anchor="middle" fill="#1a1a1a" font-size="11">Lisa</text>
</g>
<pattern id="dither-50" width="2" height="2" patternUnits="userSpaceOnUse">
<rect width="1" height="1" fill="#1a1a1a"/>
<rect x="1" y="1" width="1" height="1" fill="#1a1a1a"/>
</pattern>
<rect x="380" y="220" width="180" height="60" fill="url(#dither-50)"/>
<rect x="380" y="220" width="180" height="60" fill="none" stroke="#1a1a1a" stroke-width="1.5"/>
<text x="470" y="256" text-anchor="middle" fill="#fafafa" font-size="12" font-weight="600">50% gray</text>
</svg>`;

function svgUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export type SampleKey = 'bars' | 'monoscope' | 'scope' | 'bbs' | 'lisa';

export const SAMPLES: readonly { key: SampleKey; label: string; url: string }[] = [
  { key: 'bars', label: 'bars', url: svgUrl(BARS_SVG) },
  { key: 'monoscope', label: 'monoscope', url: svgUrl(MONOSCOPE_SVG) },
  { key: 'scope', label: 'scope', url: svgUrl(SCOPE_SVG) },
  { key: 'bbs', label: 'bbs', url: svgUrl(BBS_SVG) },
  { key: 'lisa', label: 'lisa', url: svgUrl(LISA_SVG) },
] as const;
