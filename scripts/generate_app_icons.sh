#!/bin/bash

# Check if input argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-image>"
  exit 1
fi

INPUT_IMAGE="$1"
OUTPUT_DIR="icons-output"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# iOS sizes
sizes_ios=("20 40 60" "29 58 87" "40 80 120" "76 152" "83.5 167" "1024")
labels_ios=("20x20" "29x29" "40x40" "76x76" "83.5x83.5" "1024x1024")

# Web sizes
sizes_web=(16 32 96 192 180 512)
labels_web=("favicon-16x16" "favicon-32x32" "favicon-96x96" "favicon-192x192" "apple-touch-icon" "web-icon-512x512")

# Generate iOS icons
for i in "${!sizes_ios[@]}"; do
  IFS=' ' read -r -a dimensions <<< "${sizes_ios[i]}"
  base_label=${labels_ios[i]}
  for dim in "${dimensions[@]}"; do
    convert "$INPUT_IMAGE" -resize "${dim}x${dim}" "$OUTPUT_DIR/Icon-App-${base_label}@${dim}.png"
  done
done

# Generate Web icons
for i in "${!sizes_web[@]}"; do
  dim=${sizes_web[i]}
  label=${labels_web[i]}
  convert "$INPUT_IMAGE" -resize "${dim}x${dim}" "$OUTPUT_DIR/${label}.png"
done

# Confirmation message
echo "Icons generated in folder: $OUTPUT_DIR"
