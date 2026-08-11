[CmdletBinding()]
param(
    [ValidateRange(128, 512)]
    [int]$Size = 256,

    [ValidateRange(50, 95)]
    [int]$Quality = 78
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$bundleRoot = Join-Path $projectRoot 'assets\game-bundles\dino-art'
$thumbnailRoot = Join-Path $bundleRoot 'thumbnails'
$sources = @(
    @{ Source = 'home-island-fullscene.jpg'; Target = 'home-island-fullscene-thumb.jpg' },
    @{ Source = 'memory-card-back-v1.jpg'; Target = 'memory-card-back-v1.jpg' },
    @{ Source = 'sprout-icon.png'; Target = 'sprout-icon.png' },
    @{ Source = 'sun-icon.png'; Target = 'sun-icon.png' }
)

Get-ChildItem -LiteralPath (Join-Path $bundleRoot 'dinosaurs') -Filter '*.jpg' -File |
    Sort-Object Name |
    ForEach-Object {
        $sources += @{
            Source = "dinosaurs\$($_.Name)"
            Target = "$($_.BaseName)-thumb.jpg"
        }
    }

New-Item -ItemType Directory -Path $thumbnailRoot -Force | Out-Null
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' } |
    Select-Object -First 1
$encoderParameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
$encoderParameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
    [System.Drawing.Imaging.Encoder]::Quality,
    [long]$Quality
)

try {
    foreach ($entry in $sources) {
        $sourcePath = Join-Path $bundleRoot $entry.Source
        $targetPath = Join-Path $thumbnailRoot $entry.Target
        if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
            throw "Thumbnail source not found: $sourcePath"
        }

        $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
        $thumbnail = [System.Drawing.Bitmap]::new(
            $Size,
            $Size,
            [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
        )
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($thumbnail)
            try {
                $isPng = [System.IO.Path]::GetExtension($targetPath) -ieq '.png'
                $graphics.Clear($(if ($isPng) {
                    [System.Drawing.Color]::Transparent
                } else {
                    [System.Drawing.Color]::White
                }))
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

                $scale = [Math]::Max($Size / $sourceImage.Width, $Size / $sourceImage.Height)
                $drawWidth = [int][Math]::Ceiling($sourceImage.Width * $scale)
                $drawHeight = [int][Math]::Ceiling($sourceImage.Height * $scale)
                $drawX = [int][Math]::Floor(($Size - $drawWidth) / 2)
                $drawY = [int][Math]::Floor(($Size - $drawHeight) / 2)
                $graphics.DrawImage($sourceImage, $drawX, $drawY, $drawWidth, $drawHeight)
            } finally {
                $graphics.Dispose()
            }
            if ($isPng) {
                $thumbnail.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
            } else {
                $thumbnail.Save($targetPath, $jpegCodec, $encoderParameters)
            }
        } finally {
            $thumbnail.Dispose()
            $sourceImage.Dispose()
        }
    }
} finally {
    $encoderParameters.Dispose()
}

& (Join-Path $PSScriptRoot 'generate-cocos-image-metas.ps1') -Directories $thumbnailRoot
Write-Output "Generated $($sources.Count) thumbnails at ${Size}x${Size}: $thumbnailRoot"
