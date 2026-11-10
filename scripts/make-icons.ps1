# Generates proper square PWA icons for ClaimWise from the shield portion of the logo.
# Run:  powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $root 'public\claimwise-logo.png'
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# --- 1. Crop to the shield graphic (excludes "ClaimWise" wordmark + tagline) ---
$cropHeight = [int]([Math]::Round($src.Height * 0.70)) # shield occupies the top ~70%
$cropRect = New-Object System.Drawing.Rectangle(0, 0, $src.Width, $cropHeight)
$crop = $src.Clone($cropRect, $src.PixelFormat)

# --- 2. Auto-trim transparent/white margins to get a tight bounding box ---
$minX = $crop.Width; $minY = $crop.Height; $maxX = 0; $maxY = 0
for ($y = 0; $y -lt $crop.Height; $y += 2) {
  for ($x = 0; $x -lt $crop.Width; $x += 2) {
    $p = $crop.GetPixel($x, $y)
    $isContent = ($p.A -gt 16) -and (($p.A -lt 240) -or ($p.R -lt 235 -or $p.G -lt 235 -or $p.B -lt 235))
    if ($isContent) {
      if ($x -lt $minX) { $minX = $x }
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -lt $minY) { $minY = $y }
      if ($y -gt $maxY) { $maxY = $y }
    }
  }
}
$box = New-Object System.Drawing.Rectangle($minX, $minY, ($maxX - $minX + 2), ($maxY - $minY + 2))
$shield = $crop.Clone($box, $crop.PixelFormat)
Write-Output ("Trimmed shield: {0}x{1} from crop {2}x{3}" -f $shield.Width, $shield.Height, $crop.Width, $crop.Height)

function New-Icon([int]$size, [string]$outPath, [double]$contentRatio) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::White)

  # Fit shield inside a contentRatio-sized box, centered
  $inner = [double]($size * $contentRatio)
  $scale = [Math]::Min($inner / $shield.Width, $inner / $shield.Height)
  $w = $shield.Width * $scale
  $h = $shield.Height * $scale
  $x = ($size - $w) / 2
  $y = ($size - $h) / 2
  $g.DrawImage($shield, [float]$x, [float]$y, [float]$w, [float]$h)
  $g.Dispose()

  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("Wrote {0}" -f $outPath)
}

# Regular icons: logo takes ~88% of the tile
New-Icon 512 (Join-Path $root 'public\icon-512.png') 0.88
New-Icon 192 (Join-Path $root 'public\icon-192.png') 0.88
New-Icon 180 (Join-Path $root 'public\apple-touch-icon.png') 0.88
New-Icon 64  (Join-Path $root 'public\favicon-64.png') 0.88

# Maskable icons: keep content inside the 80% safe-zone circle (~62% content box)
New-Icon 512 (Join-Path $root 'public\icon-maskable-512.png') 0.62
New-Icon 192 (Join-Path $root 'public\icon-maskable-192.png') 0.62

# Root favicon file (app router picks up app/icon.png automatically)
New-Icon 256 (Join-Path $root 'app\icon.png') 0.88

$shield.Dispose(); $crop.Dispose(); $src.Dispose()
Write-Output 'Done.'
