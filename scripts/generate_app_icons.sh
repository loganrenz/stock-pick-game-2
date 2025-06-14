#!/bin/bash

# Check if input SVG is provided
if [ -z "$1" ]; then
  echo "ERROR: No SVG file provided"
  echo "Usage: $0 <path-to-svg>"
  exit 1
fi

INPUT_SVG="$1"
OUTPUT_DIR="icons-output"

# Function to check and install Homebrew dependencies
install_dependency() {
  local cmd=$1
  local pkg=$2
  echo "DEBUG: Checking for $cmd"
  if ! command -v "$cmd" &> /dev/null; then
    echo "DEBUG: $cmd not found, installing $pkg via Homebrew"
    if brew install "$pkg"; then
      echo "DEBUG: Successfully installed $pkg"
    else
      echo "ERROR: Failed to install $pkg"
      exit 1
    fi
  else
    echo "DEBUG: $cmd already installed"
  fi
}

# Check and install Homebrew if missing
echo "DEBUG: Checking for Homebrew"
if ! command -v brew &> /dev/null; then
  echo "DEBUG: Homebrew not found, installing"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Homebrew"
    exit 1
  fi
  echo "DEBUG: Homebrew installed"
else
  echo "DEBUG: Homebrew already installed"
fi

# Install required dependencies
install_dependency "inkscape" "inkscape"
install_dependency "makeicns" "makeicns"
install_dependency "magick" "imagemagick"

# Create output directory
echo "DEBUG: Creating output directory: $OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# iOS sizes (points, with 1x, 2x, 3x where applicable)
sizes_ios=("20:20 40 60" "29:29 58 87" "40:40 80 120" "76:76 152" "84:84 168" "1024:1024")
labels_ios=("20x20" "29x29" "40x40" "76x76" "84x84" "1024x1024")

# macOS icon sizes (px)
sizes_macos=(16 32 64 128 256 512 1024)
labels_macos=("16x16" "32x32" "64x64" "128x128" "256x256" "512x512" "1024x1024")

# Web sizes (px)
sizes_web=(16 32 96 128 144 152 180 192 256 512)
labels_web=("favicon-16x16" "favicon-32x32" "favicon-96x96" "ms-icon-128x128" "ms-icon-144x144" "apple-touch-icon-152x152" "apple-touch-icon-180x180" "favicon-192x192" "apple-touch-icon-256x256" "web-icon-512x512")

# Favicon and ICO sizes
sizes_favicon=(16 32 64)
labels_favicon=("favicon-16x16" "favicon-32x32" "favicon-64x64")

# Generate iOS icons
echo "DEBUG: Generating iOS icons"
for i in "${!sizes_ios[@]}"; do
  IFS=':' read -r -a dim_array <<< "${sizes_ios[i]}"
  base_label=${labels_ios[i]}
  IFS=' ' read -r -a dimensions <<< "${dim_array[1]}"
  for dim in "${dimensions[@]}"; do
    echo "DEBUG: Generating iOS icon: Icon-App-${base_label}@${dim}.png (${dim}x${dim})"
    inkscape "$INPUT_SVG" --export-filename="$OUTPUT_DIR/Icon-App-${base_label}@${dim}.png" -w "$dim" -h "$dim"
    [ $? -eq 0 ] || echo "ERROR: Failed to generate iOS icon: Icon-App-${base_label}@${dim}.png"
  done
done

# Generate macOS icons
echo "DEBUG: Generating macOS icons"
for i in "${!sizes_macos[@]}"; do
  dim=${sizes_macos[i]}
  label=${labels_macos[i]}
  echo "DEBUG: Generating macOS icon: icon-${label}.png (${dim}x${dim})"
  inkscape "$INPUT_SVG" --export-filename="$OUTPUT_DIR/icon-${label}.png" -w "$dim" -h "$dim"
  [ $? -eq 0 ] || echo "ERROR: Failed to generate macOS icon: icon-${label}.png"
done

# Generate macOS .icns
echo "DEBUG: Generating macOS .icns file: stockpick.icns"
makeicns -16 "$OUTPUT_DIR/icon-16x16.png" -32 "$OUTPUT_DIR/icon-32x32.png" -128 "$OUTPUT_DIR/icon-128x128.png" -256 "$OUTPUT_DIR/icon-256x256.png" -512 "$OUTPUT_DIR/icon-512x512.png" -out "$OUTPUT_DIR/stockpick.icns"
[ $? -eq 0 ] || echo "ERROR: Failed to generate macOS .icns"

# Generate Web icons
echo "DEBUG: Generating Web icons"
for i in "${!sizes_web[@]}"; do
  dim=${sizes_web[i]}
  label=${labels_web[i]}
  echo "DEBUG: Generating Web icon: ${label}.png (${dim}x${dim})"
  inkscape "$INPUT_SVG" --export-filename="$OUTPUT_DIR/${label}.png" -w "$dim" -h "$dim"
  [ $? -eq 0 ] || echo "ERROR: Failed to generate Web icon: ${label}.png"
done

# Generate ICO for favicon
echo "DEBUG: Generating favicon.ico"
magick "$OUTPUT_DIR/favicon-16x16.png" "$OUTPUT_DIR/favicon-32x32.png" "$OUTPUT_DIR/favicon-64x64.png" "$OUTPUT_DIR/favicon.ico"
[ $? -eq 0 ] || echo "ERROR: Failed to generate favicon.ico"

# Generate favicon PNGs
echo "DEBUG: Generating favicon PNGs"
for i in "${!sizes_favicon[@]}"; do
  dim=${sizes_favicon[i]}
  label=${labels_favicon[i]}
  echo "DEBUG: Generating favicon: ${label}.png (${dim}x${dim})"
  inkscape "$INPUT_SVG" --export-filename="$OUTPUT_DIR/${label}.png" -w "$dim" -h "$dim"
  [ $? -eq 0 ] || echo "ERROR: Failed to generate favicon: ${label}.png"
done

# Generate manifest.json for web
echo "DEBUG: Generating manifest.json"
cat << EOF > "$OUTPUT_DIR/manifest.json"
{
  "name": "Stock Pick App",
  "short_name": "StockPick",
  "icons": [
    {"src": "favicon-192x192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "web-icon-512x512.png", "sizes": "512x512", "type": "image/png"}
  ],
  "theme_color": "#ffffff",
  "background_color": "#ffffff",
  "display": "standalone"
}
EOF
[ $? -eq 0 ] || echo "ERROR: Failed to generate manifest.json"

# Confirmation message
echo "Icons generated in folder: $OUTPUT_DIR"