[CmdletBinding()]
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$buildRoot = Join-Path $projectRoot 'build\wechatgame\remote'
$deployRoot = Join-Path $projectRoot 'deploy\remote'
$bundles = @('dino-art', 'resources')

if (-not $SkipBuild) {
    & (Join-Path $PSScriptRoot 'build-wechatgame.ps1')
    if ($LASTEXITCODE -ne 0) {
        throw "Cocos build failed with exit code $LASTEXITCODE"
    }
}

foreach ($bundle in $bundles) {
    $source = Join-Path $buildRoot $bundle
    if (-not (Test-Path -LiteralPath $source -PathType Container)) {
        throw "Missing built remote bundle: $source"
    }
    $config = Get-ChildItem -LiteralPath $source -Filter 'config*.json' -File | Select-Object -First 1
    if (-not $config) {
        throw "Missing bundle config: $source"
    }
}

New-Item -ItemType Directory -Path $deployRoot -Force | Out-Null

foreach ($bundle in $bundles) {
    $source = Join-Path $buildRoot $bundle
    $destination = Join-Path $deployRoot $bundle

    if (Test-Path -LiteralPath $destination) {
        Remove-Item -LiteralPath $destination -Recurse -Force
    }
    Copy-Item -LiteralPath $source -Destination $destination -Recurse
}

$fileCount = (Get-ChildItem -LiteralPath $deployRoot -Recurse -File).Count
$totalBytes = (Get-ChildItem -LiteralPath $deployRoot -Recurse -File | Measure-Object -Property Length -Sum).Sum
$totalMb = [Math]::Round($totalBytes / 1MB, 2)

Write-Output "Prepared $fileCount remote asset files ($totalMb MB) in: $deployRoot"
Write-Output 'Next: review the changes, then commit and push deploy/remote together with your code.'
