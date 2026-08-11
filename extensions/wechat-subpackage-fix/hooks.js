'use strict';

const fs = require('fs');
const path = require('path');
const REMOTE_BUNDLE_NAMES = ['dino-art', 'resources'];
const REMOTE_SERVER_URL = 'https://sprout-playland-assets.wdbzk.com/';

exports.throwError = true;

function directorySize(directory) {
  let bytes = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    bytes += entry.isDirectory() ? directorySize(entryPath) : fs.statSync(entryPath).size;
  }
  return bytes;
}

function moveDirectoryContents(source, destination, shouldMove) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (!shouldMove(entry.name)) {
      continue;
    }
    fs.renameSync(path.join(source, entry.name), path.join(destination, entry.name));
  }
}

function findSettingsFile(settingsPath) {
  if (fs.existsSync(settingsPath)) {
    return settingsPath;
  }
  const directory = path.dirname(settingsPath);
  const name = fs.readdirSync(directory)
    .find((entry) => /^settings(?:\.[a-f0-9]+)?\.json$/i.test(entry));
  if (!name) {
    throw new Error(`Missing generated settings file in: ${directory}`);
  }
  return path.join(directory, name);
}

exports.onAfterBuild = async function onAfterBuild(options, result) {
  if (options.platform !== 'wechatgame' || !result || !result.dest) {
    return;
  }

  const settingsPath = findSettingsFile(result.paths.settings);
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  const remoteBundles = Array.isArray(settings.assets.remoteBundles)
    ? settings.assets.remoteBundles
    : [];
  for (const bundleName of REMOTE_BUNDLE_NAMES) {
    const source = path.join(result.paths.assets, bundleName);
    const destination = path.join(result.paths.remote, bundleName);
    if (fs.existsSync(source)) {
      moveDirectoryContents(source, destination, (name) => !/^index(?:\.[a-f0-9]+)?\.js$/i.test(name));
    }
    if (!fs.existsSync(destination)) {
      throw new Error(`Missing generated bundle resources: ${destination}`);
    }
    if (!remoteBundles.includes(bundleName)) {
      remoteBundles.push(bundleName);
    }

    const bundleBytes = directorySize(destination);
    console.log(
      `[wechat-subpackage-fix] ${bundleName} remote bundle ready: `
        + `${(bundleBytes / 1024 / 1024).toFixed(2)}MB`,
    );
  }
  settings.assets.server = REMOTE_SERVER_URL;
  settings.assets.remoteBundles = remoteBundles;
  settings.assets.preloadBundles = Array.isArray(settings.assets.preloadBundles)
    ? settings.assets.preloadBundles.filter((entry) => entry?.bundle !== 'resources')
    : [];
  settings.assets.downloadMaxConcurrency = 6;
  fs.writeFileSync(settingsPath, JSON.stringify(settings), 'utf8');
  console.log(`[wechat-subpackage-fix] remote server: ${REMOTE_SERVER_URL}`);

  // `remote` only contains files that are deployed to the static resource server.
  // Keep the directory beside the build for deployment, but never upload it as
  // part of the WeChat game package.
  const projectConfigPath = path.join(result.dest, 'project.config.json');
  if (fs.existsSync(projectConfigPath)) {
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
    const packOptions = projectConfig.packOptions ?? {};
    const ignore = Array.isArray(packOptions.ignore) ? packOptions.ignore : [];
    if (!ignore.some((entry) => entry?.type === 'folder' && entry?.value === 'remote')) {
      ignore.push({ type: 'folder', value: 'remote' });
    }
    projectConfig.packOptions = {
      ...packOptions,
      ignore,
      include: Array.isArray(packOptions.include) ? packOptions.include : [],
    };
    fs.writeFileSync(projectConfigPath, JSON.stringify(projectConfig), 'utf8');
  }
};
