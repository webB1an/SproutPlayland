[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ServerHost,

    [Parameter(Mandatory = $true)]
    [string]$ServerUser,

    [Parameter(Mandatory = $true)]
    [string]$SshKeyPath,

    [int]$ServerPort = 22,

    [string]$RemoteRoot = '/www/wwwroot/sprout-playland-assets.wdbzk.com/remote'
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$remoteBuildRoot = Join-Path $projectRoot 'build\wechatgame\remote'
$deployId = if ($env:GITHUB_RUN_ID) { $env:GITHUB_RUN_ID } else { [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() }
$localStage = Join-Path $projectRoot "temp\remote-deploy-$deployId"
$remoteStage = "/tmp/sprout-playland-$deployId"
$sshTarget = "$ServerUser@$ServerHost"
$bundles = @('dino-art', 'resources')

if ($RemoteRoot -ne '/www/wwwroot/sprout-playland-assets.wdbzk.com/remote') {
    throw "Unexpected deployment target: $RemoteRoot"
}
if (-not (Test-Path -LiteralPath $SshKeyPath -PathType Leaf)) {
    throw "SSH key not found: $SshKeyPath"
}

New-Item -ItemType Directory -Path $localStage -Force | Out-Null

foreach ($bundle in $bundles) {
    $bundlePath = Join-Path $remoteBuildRoot $bundle
    if (-not (Test-Path -LiteralPath $bundlePath -PathType Container)) {
        throw "Missing built remote bundle: $bundlePath"
    }
    $config = Get-ChildItem -LiteralPath $bundlePath -Filter 'config*.json' -File | Select-Object -First 1
    if (-not $config) {
        throw "Missing bundle config: $bundlePath"
    }

    $archivePath = Join-Path $localStage "$bundle.tar.gz"
    & tar.exe -czf $archivePath -C $remoteBuildRoot $bundle
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to archive bundle: $bundle"
    }
}

$sshOptions = @(
    '-p', $ServerPort,
    '-i', $SshKeyPath,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new'
)
$scpOptions = @(
    '-P', $ServerPort,
    '-i', $SshKeyPath,
    '-o', 'BatchMode=yes',
    '-o', 'StrictHostKeyChecking=accept-new'
)

& ssh.exe @sshOptions $sshTarget "mkdir -p '$remoteStage'"
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to create remote staging directory.'
}

& scp.exe @scpOptions `
    (Join-Path $localStage 'dino-art.tar.gz') `
    (Join-Path $localStage 'resources.tar.gz') `
    (Join-Path $PSScriptRoot 'deploy-remote-assets.sh') `
    "${sshTarget}:${remoteStage}/"
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to upload remote asset archives.'
}

& ssh.exe @sshOptions $sshTarget "GITHUB_RUN_ID='$deployId' bash '$remoteStage/deploy-remote-assets.sh' '$RemoteRoot' '$remoteStage'"
if ($LASTEXITCODE -ne 0) {
    throw 'Remote deployment failed.'
}

Write-Output "Remote assets deployed successfully: $RemoteRoot"
