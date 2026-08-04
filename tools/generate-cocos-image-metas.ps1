param(
    [Parameter(Mandatory = $true)]
    [string[]]$Directories
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function New-DirectoryMeta([string]$DirectoryPath) {
    $metaPath = "$DirectoryPath.meta"
    if (Test-Path -LiteralPath $metaPath) { return }

    $meta = [ordered]@{
        ver = '1.2.0'
        importer = 'directory'
        imported = $true
        uuid = [guid]::NewGuid().ToString()
        files = @()
        subMetas = @{}
        userData = @{}
    }
    $meta | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $metaPath -Encoding utf8
}

function New-ImageMeta([System.IO.FileInfo]$Image) {
    $metaPath = "$($Image.FullName).meta"
    if (Test-Path -LiteralPath $metaPath) { return }

    $uuid = [guid]::NewGuid().ToString()
    $displayName = $Image.BaseName
    $bitmap = [System.Drawing.Image]::FromFile($Image.FullName)
    try {
        $width = $bitmap.Width
        $height = $bitmap.Height
    } finally {
        $bitmap.Dispose()
    }
    $halfWidth = $width / 2
    $halfHeight = $height / 2
    $textureUuid = "$uuid@6c48a"

    $textureMeta = [ordered]@{
        importer = 'texture'; uuid = $textureUuid; displayName = $displayName
        id = '6c48a'; name = 'texture'
        userData = [ordered]@{
            wrapModeS = 'clamp-to-edge'; wrapModeT = 'clamp-to-edge'
            imageUuidOrDatabaseUri = $uuid; isUuid = $true; visible = $false
            minfilter = 'linear'; magfilter = 'linear'; mipfilter = 'none'; anisotropy = 0
        }
        ver = '1.0.22'; imported = $true; files = @('.json'); subMetas = @{}
    }
    $spriteMeta = [ordered]@{
        importer = 'sprite-frame'; uuid = "$uuid@f9941"; displayName = $displayName
        id = 'f9941'; name = 'spriteFrame'
        userData = [ordered]@{
            trimThreshold = 1; rotated = $false; offsetX = 0; offsetY = 0
            trimX = 0; trimY = 0; width = $width; height = $height
            rawWidth = $width; rawHeight = $height
            borderTop = 0; borderBottom = 0; borderLeft = 0; borderRight = 0
            packable = $true; pixelsToUnit = 100; pivotX = 0.5; pivotY = 0.5; meshType = 0
            vertices = [ordered]@{
                rawPosition = @(-$halfWidth, -$halfHeight, 0, $halfWidth, -$halfHeight, 0, -$halfWidth, $halfHeight, 0, $halfWidth, $halfHeight, 0)
                indexes = @(0, 1, 2, 2, 1, 3)
                uv = @(0, $height, $width, $height, 0, 0, $width, 0)
                nuv = @(0, 0, 1, 0, 0, 1, 1, 1)
                minPos = @(-$halfWidth, -$halfHeight, 0); maxPos = @($halfWidth, $halfHeight, 0)
            }
            isUuid = $true; imageUuidOrDatabaseUri = $textureUuid; atlasUuid = ''; trimType = 'auto'
        }
        ver = '1.0.12'; imported = $true; files = @('.json'); subMetas = @{}
    }
    $meta = [ordered]@{
        ver = '1.0.27'; importer = 'image'; imported = $true; uuid = $uuid
        files = @('.json', '.png')
        subMetas = [ordered]@{ '6c48a' = $textureMeta; 'f9941' = $spriteMeta }
        userData = [ordered]@{
            type = 'sprite-frame'; fixAlphaTransparencyArtifacts = $false
            hasAlpha = $true; redirect = $textureUuid
        }
    }
    $meta | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $metaPath -Encoding utf8
}

foreach ($directory in $Directories) {
    $resolved = (Resolve-Path -LiteralPath $directory).Path
    New-DirectoryMeta $resolved
    New-DirectoryMeta (Split-Path -Parent $resolved)
    Get-ChildItem -LiteralPath $resolved -Filter '*.png' -File | ForEach-Object { New-ImageMeta $_ }
}
