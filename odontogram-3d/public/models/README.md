# Models

Drop the client export here as `odontogram.glb`.

Until it exists, the app generates a stand-in arch in code
(`src/placeholder/ProceduralArch.js`) using the same node names, so the loading,
indexing, state-switching and picking paths are all exercised for real.

## Naming convention

One node — mesh or group — per tooth per state:

```
tooth_11_healthy
tooth_11_unhealthy
tooth_11_very_unhealthy
gum_11_empty            # shown when the tooth is missing
```

Separators are flexible (`_`, `-`, `.`, space), case is ignored, and Blender's
`.001` suffixes are stripped. `Tooth11.Severe`, `T_11_state3` and
`very_unhealthy_tooth_11` all resolve. Numbering can be FDI (11-48) or
Universal (1-32) - whichever the file uses is detected automatically.

Anything that will not parse can be pinned in `tooth-map.json`; see
`tooth-map.example.json`.

## Export checklist

- Apply transforms, +Y up, arch centred on the origin (the app also re-centres
  and scales to a known height, but a clean export makes that a no-op).
- Keep the three state variants of a tooth co-located - the app only toggles
  visibility, it does not move anything.
- glTF Binary (.glb); Draco compression optional, the decoder is already wired.
- Textures in KTX2/WebP where possible; a phone loads this over mobile data.
- Run `?debug=1` after dropping the file in - the console prints a coverage
  report listing any tooth that is missing a variant.
