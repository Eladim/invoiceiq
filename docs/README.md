# docs/

Drop the demo recording here as **`demo.gif`** (the main README embeds `docs/demo.gif`).

## Recording the 2-minute demo

Record at ~1280×800, then either keep it as an `.mp4` (and link it) or convert to a GIF:

```bash
# mp4 → optimized gif (needs ffmpeg + gifski, or use an online converter / Kap / Loom)
ffmpeg -i demo.mp4 -vf "fps=12,scale=1000:-1:flags=lanczos" -f yuv4mpegpipe - \
  | gifski -o demo.gif --fps 12 --width 1000 -
```

### Shot list (~2 min)

1. **Landing page** — scroll the hero + how-it-works (0:00–0:15)
2. **“Use demo account”** on the sign-in page → land on the dashboard (0:15–0:30)
3. **Dashboard** — stat cards, spend chart (toggle 3m/6m/1y), top vendors (0:30–0:50)
4. **Upload** — drag in an invoice, watch it go `processing → completed` (0:50–1:20)
5. **Detail view** — extracted fields + a **low-confidence** warning flag (1:20–1:40)
6. **List** — search / filter, then **Export CSV** (1:40–1:55)
7. **Billing** — plan + usage meter (end on the upgrade CTA) (1:55–2:00)
