/**
 * Build script for Spicy Lyric Translater
 * Automatically injects version from package.json into the bundle
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;

// Also update manifest.json to keep in sync
const manifestPath = './manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.version !== version) {
    manifest.version = version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`Updated manifest.json version to ${version}`);
}

const isWatch = process.argv.includes('--watch');

const buildOptions = {
    entryPoints: ['src/app.ts'],
    bundle: true,
    outfile: 'dist/spicy-lyric-translater.js',
    format: 'iife',
    globalName: 'SpicyLyricTranslater',
    platform: 'browser',
    target: 'es2020',
    define: {
        '__VERSION__': JSON.stringify(version)
    }
};

if (isWatch) {
    esbuild.context(buildOptions).then(ctx => {
        ctx.watch();
        console.log(`Watching for changes... (version: ${version})`);
    });
} else {
    esbuild.build(buildOptions).then(result => {
        console.log(`Built successfully! (version: ${version})`);
    }).catch(() => process.exit(1));
}
