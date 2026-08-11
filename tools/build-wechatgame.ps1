$ErrorActionPreference = 'Stop'

$project = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$creator = if ($env:COCOS_CREATOR_PATH) {
    $env:COCOS_CREATOR_PATH
} else {
    'D:\DevTools\CocosCreator\3.8.8\CocosCreator.exe'
}
$config = Join-Path $project 'wechatgame-build.config.json'
$stdout = Join-Path $project 'temp\codex-cocos-build.stdout.log'
$stderr = Join-Path $project 'temp\codex-cocos-build.stderr.log'

if (-not (Test-Path -LiteralPath $creator -PathType Leaf)) {
    throw "Cocos Creator executable not found: $creator"
}

$arguments = @(
    '--project', $project,
    '--build', "configPath=$config"
)

$process = Start-Process `
    -FilePath $creator `
    -ArgumentList $arguments `
    -WindowStyle Hidden `
    -PassThru `
    -Wait `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr

Write-Output "EXIT=$($process.ExitCode)"
if ($process.ExitCode -eq 36) {
    exit 0
}
exit $process.ExitCode
