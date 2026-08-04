`icon.ico` is a multi-resolution (16/32/48/256px) rasterization of
`packages/frontend/public/favicon.svg`, used by `electron-builder.yml`'s
`icon:` field and by `main.cjs` for the `BrowserWindow` icon. Regenerate it
from that SVG if the logo ever changes (e.g. via `sharp` + `png-to-ico` in a
throwaway script — neither is a tracked dependency of this package since
they're only needed for this one-off conversion).
