import { html } from 'lit';

export const crtFilters = html`
  <svg
    class="crt-filters"
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <filter
        id="crt-bloom"
        x="-15%"
        y="-15%"
        width="130%"
        height="130%"
        color-interpolation-filters="sRGB"
      >
        <feComponentTransfer in="SourceGraphic" result="thresholded">
          <feFuncR type="linear" slope="2.4" intercept="-0.95" />
          <feFuncG type="linear" slope="2.4" intercept="-0.95" />
          <feFuncB type="linear" slope="2.4" intercept="-0.95" />
        </feComponentTransfer>
        <feGaussianBlur in="thresholded" stdDeviation="3" result="bloom" />
        <feBlend in="bloom" in2="SourceGraphic" mode="screen" />
      </filter>

      <filter
        id="crt-aberration"
        x="-5%"
        y="-5%"
        width="110%"
        height="110%"
        color-interpolation-filters="sRGB"
      >
        <feOffset in="SourceGraphic" dx="0.7" dy="0" result="rOff" />
        <feColorMatrix
          in="rOff"
          type="matrix"
          values="1 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 1 0"
          result="r"
        />
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="0 0 0 0 0
                  0 1 0 0 0
                  0 0 0 0 0
                  0 0 0 1 0"
          result="g"
        />
        <feOffset in="SourceGraphic" dx="-0.7" dy="0" result="bOff" />
        <feColorMatrix
          in="bOff"
          type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 1 0 0
                  0 0 0 1 0"
          result="b"
        />
        <feBlend in="r" in2="g" mode="screen" result="rg" />
        <feBlend in="rg" in2="b" mode="screen" />
      </filter>

      <filter
        id="crt-ntsc"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        color-interpolation-filters="sRGB"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.6 0.04"
          numOctaves="2"
          seed="3"
          result="noise"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="0.8"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
`;
