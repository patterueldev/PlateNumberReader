#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
out="$root/public/icons"
assets="$root/assets/images"
mkdir -p "$out" "$assets"

bg_start="#1E3A8A"
bg_end="#0B1220"
plate="#F8FAFC"
band="#1D4ED8"
ink="#0B1220"

font=""
for candidate in \
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf" \
  "/System/Library/Fonts/Supplemental/Arial Unicode.ttf" \
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"; do
  if [ -f "$candidate" ]; then
    font="$candidate"
    break
  fi
done

work="$out/.work"
rm -rf "$work"
mkdir -p "$work"

magick -size 1024x1024 "xc:none" \
  -fill "$plate" -draw "roundrectangle 132,362 892,662 56,56" \
  -fill "$band" -draw "roundrectangle 132,362 892,482 56,56" \
  -fill "$band" -draw "rectangle 132,442 892,492" \
  "$work/plate.png"

if [ -n "$font" ]; then
  magick "$work/plate.png" -font "$font" -pointsize 170 -fill "$ink" \
    -gravity center -annotate +0+78 "1234" "$work/plate.png"
fi

magick "$work/plate.png" -trim +repage -bordercolor none -border 48 \
  -background none -gravity center -extent 1024x1024 "$work/mark.png"

magick -size 1024x1024 gradient:"$bg_start"-"$bg_end" "$work/bg.png"

magick "$work/bg.png" "$work/mark.png" -composite "$assets/icon.png"
magick "$assets/icon.png" -resize 48x48 "$assets/favicon.png"
magick "$work/mark.png" -resize 512x512 "$assets/splash-icon.png"

magick -size 1024x1024 gradient:"$bg_start"-"$bg_end" \
  \( "$work/mark.png" -resize 620x620 \) -gravity center -composite \
  -resize 512x512 "$out/icon-maskable-512.png"

magick "$assets/icon.png" -resize 192x192 "$out/icon-192.png"
magick "$assets/icon.png" -resize 512x512 "$out/icon-512.png"
magick "$assets/icon.png" -resize 180x180 "$out/apple-touch-icon.png"

magick -size 1024x1024 gradient:"$bg_start"-"$bg_end" "$assets/android-icon-background.png"
magick -size 1024x1024 "xc:none" \
  \( "$work/mark.png" -resize 620x620 \) -gravity center -composite \
  "$assets/android-icon-foreground.png"
magick -size 1024x1024 "xc:none" \
  -fill none -stroke "#FFFFFF" -strokewidth 28 -draw "roundrectangle 132,362 892,662 56,56" \
  -fill "#FFFFFF" -stroke none -draw "roundrectangle 132,362 892,482 56,56" \
  -fill "#FFFFFF" -draw "rectangle 132,442 892,492" \
  "$assets/android-icon-monochrome.png"

rm -rf "$work"

echo "Icons generated:"
ls -1 "$out"/*.png "$assets"/*.png
