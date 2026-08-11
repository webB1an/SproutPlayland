[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$groups = @(
    @{
        Size = 384
        Files = @(
            'assets\resources\art\common\home\icons\home-icon-bubble-v2.png',
            'assets\resources\art\common\home\icons\home-icon-memory.png',
            'assets\resources\art\common\home\icons\home-icon-puzzle-v2.png',
            'assets\resources\art\common\home\icons\home-icon-scratch-v2.png',
            'assets\resources\art\common\home\icons\home-icon-shadow.png'
        )
    },
    @{
        Size = 256
        Files = @(
            'assets\resources\art\common\ui-generated\ui-back.png',
            'assets\resources\art\common\ui-generated\ui-help.png',
            'assets\resources\art\common\ui-generated\ui-menu.png',
            'assets\resources\art\common\ui-generated\ui-next.png',
            'assets\resources\art\common\ui-generated\ui-play.png',
            'assets\resources\art\common\ui-generated\ui-replay.png',
            'assets\resources\art\games\puzzle\ui\start-play-button.png'
        )
    }
)

foreach ($group in $groups) {
    $size = [int]$group.Size
    foreach ($relativePath in $group.Files) {
        $sourcePath = [System.IO.Path]::GetFullPath((Join-Path $projectRoot $relativePath))
        if (-not $sourcePath.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Texture path escaped the project root: $sourcePath"
        }
        if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
            throw "Texture not found: $sourcePath"
        }

        $source = [System.Drawing.Image]::FromFile($sourcePath)
        try {
            if ($source.Width -le $size -and $source.Height -le $size) {
                continue
            }
            $bitmap = [System.Drawing.Bitmap]::new(
                $size,
                $size,
                [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
            )
            try {
                $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
                try {
                    $graphics.Clear([System.Drawing.Color]::Transparent)
                    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                    $graphics.DrawImage($source, 0, 0, $size, $size)
                } finally {
                    $graphics.Dispose()
                }
                $temporaryPath = "$sourcePath.optimized.png"
                $bitmap.Save($temporaryPath, [System.Drawing.Imaging.ImageFormat]::Png)
            } finally {
                $bitmap.Dispose()
            }
        } finally {
            $source.Dispose()
        }

        $resolvedTemporary = [System.IO.Path]::GetFullPath($temporaryPath)
        if (-not $resolvedTemporary.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Temporary texture path escaped the project root: $resolvedTemporary"
        }
        Move-Item -LiteralPath $resolvedTemporary -Destination $sourcePath -Force
        Write-Output "Optimized $relativePath to ${size}x${size}"
    }
}
