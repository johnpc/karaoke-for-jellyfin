#!/usr/bin/env node

/**
 * Karaoke for Jellyfin - Android TV APK Builder
 *
 * This script automates the process of building an Android TV APK
 * using Google's Bubblewrap CLI tool.
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Load environment variables from .env files
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, "utf8");
    envContent.split("\n").forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

// Load environment variables from .env files
loadEnvFile(".env");
loadEnvFile(".env.local");

// Configuration
const CONFIG = {
  packageName: "com.jellyfin.karaoke.tv",
  appName: "Karaoke TV",
  buildDir: "android-tv-build",
  manifestFile: "public/manifest-tv.json",
  outputApk: "karaoke-tv.apk",
};

// Colors for console output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, {
      stdio: "inherit",
      encoding: "utf8",
      timeout: 30000, // 30 second timeout
      ...options,
    });
  } catch (error) {
    if (error.status === "SIGTERM") {
      log(`❌ Command timed out: ${command}`, "red");
    } else {
      log(`❌ Command failed: ${command}`, "red");
    }
    throw error;
  }
}

function findJavaPath() {
  // Common Java installation paths on macOS
  const javaPaths = [
    "/Library/Java/JavaVirtualMachines/amazon-corretto-17.jdk/Contents/Home/bin/java",
    "/Library/Java/JavaVirtualMachines/amazon-corretto-21.jdk/Contents/Home/bin/java",
    "/Library/Java/JavaVirtualMachines/amazon-corretto-11.jdk/Contents/Home/bin/java",
    "/opt/homebrew/opt/openjdk@17/bin/java",
    "/opt/homebrew/opt/openjdk@11/bin/java",
    "/opt/homebrew/opt/openjdk/bin/java",
    "/usr/local/opt/openjdk@17/bin/java",
    "/usr/local/opt/openjdk@11/bin/java",
    "/usr/local/opt/openjdk/bin/java",
  ];

  for (const javaPath of javaPaths) {
    try {
      if (fs.existsSync(javaPath)) {
        // Test if this Java works with a timeout
        execSync(`timeout 10s "${javaPath}" -version`, {
          stdio: "pipe",
          timeout: 15000,
        });
        return javaPath;
      }
    } catch (error) {
      // Continue to next path
    }
  }

  // Fallback to system java (might be the problematic wrapper)
  return "java";
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

function checkDependencies() {
  log("🔍 Checking dependencies...", "yellow");

  const commands = [
    { cmd: "node", args: "--version" },
    { cmd: "npm", args: "--version" },
    { cmd: "java", args: "--version", timeout: true },
  ];

  for (const { cmd, args, timeout } of commands) {
    try {
      const command = timeout ? `timeout 10s ${cmd} ${args}` : `${cmd} ${args}`;
      execCommand(command, { stdio: "pipe" });
      log(`✅ ${cmd} is available`, "green");
    } catch (error) {
      if (error.status === 124) {
        log(`❌ ${cmd} command timed out (likely hanging)`, "red");
        log(`💡 Try setting JAVA_HOME to a proper Java installation`, "yellow");
      } else {
        log(`❌ ${cmd} is not installed`, "red");
      }
      process.exit(1);
    }
  }

  // Check for Bubblewrap CLI
  try {
    execCommand("bubblewrap --version", { stdio: "pipe" });
    log("✅ Bubblewrap CLI is available", "green");
  } catch (error) {
    log("⚠️  Installing Bubblewrap CLI...", "yellow");
    execCommand("npm install -g @bubblewrap/cli");
    log("✅ Bubblewrap CLI installed", "green");
  }
}

function createTVManifest() {
  log("📱 Creating Android TV manifest...", "yellow");

  const tvManifest = {
    name: "Karaoke TV Display",
    short_name: "Karaoke TV",
    description: "Full-screen karaoke display for Android TV",
    start_url: "/tv",
    display: "fullscreen",
    background_color: "#8B5CF6",
    theme_color: "#8B5CF6",
    orientation: "landscape-primary",
    scope: "/",
    lang: "en",
    categories: ["entertainment", "music"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  fs.writeFileSync(CONFIG.manifestFile, JSON.stringify(tvManifest, null, 2));
  log("✅ TV manifest created", "green");
}

function buildNextJS() {
  log("🏗️  Building Next.js application...", "yellow");

  if (!fs.existsSync("node_modules")) {
    log("📦 Installing dependencies...", "yellow");
    execCommand("npm install");
  }

  execCommand("npm run build");
  log("✅ Next.js build completed", "green");
}

async function initializeBubblewrap() {
  log("🫧 Initializing Bubblewrap project...", "yellow");

  // Clean up previous build
  if (fs.existsSync(CONFIG.buildDir)) {
    fs.rmSync(CONFIG.buildDir, { recursive: true, force: true });
  }

  fs.mkdirSync(CONFIG.buildDir, { recursive: true });
  process.chdir(CONFIG.buildDir);

  // Get server URL from environment variable
  let serverUrl = process.env.KARAOKE_SERVER_URL;

  if (!serverUrl) {
    log("⚠️  KARAOKE_SERVER_URL not found in environment variables", "yellow");
    serverUrl = await promptUser(
      "Enter your Karaoke server URL (e.g., http://192.168.1.100:3967): "
    );
  } else {
    log(`📡 Using server URL from environment: ${serverUrl}`, "green");
  }

  if (!serverUrl) {
    log("❌ Server URL is required", "red");
    process.exit(1);
  }

  // Initialize Bubblewrap
  const initCommand = [
    "bubblewrap init",
    `--manifest="${serverUrl}/manifest-tv.json"`,
    "--directory=.",
    `--packageId="${CONFIG.packageName}"`,
    `--name="${CONFIG.appName}"`,
    `--launcherName="${CONFIG.appName}"`,
    "--display=fullscreen",
    "--orientation=landscape",
    '--themeColor="#8B5CF6"',
    '--backgroundColor="#8B5CF6"',
    '--startUrl="/tv"',
    `--iconUrl="${serverUrl}/icons/icon-512x512.png"`,
    `--maskableIconUrl="${serverUrl}/icons/icon-512x512.png"`,
  ].join(" ");

  execCommand(initCommand);
  log("✅ Bubblewrap project initialized", "green");

  return serverUrl;
}

function configureAndroidTV() {
  log("📺 Configuring Android TV settings...", "yellow");

  if (fs.existsSync("twa-manifest.json")) {
    const manifest = JSON.parse(fs.readFileSync("twa-manifest.json", "utf8"));

    // Add Android TV specific features
    if (!manifest.androidPackage) {
      manifest.androidPackage = {};
    }

    manifest.androidPackage.features = [
      {
        name: "android.software.leanback",
        required: true,
      },
      {
        name: "android.hardware.touchscreen",
        required: false,
      },
      {
        name: "android.hardware.gamepad",
        required: false,
      },
    ];

    // Add TV launcher category
    manifest.androidPackage.categories = [
      "android.intent.category.LEANBACK_LAUNCHER",
    ];

    // Add required permissions
    manifest.androidPackage.permissions = [
      { name: "android.permission.INTERNET" },
      { name: "android.permission.ACCESS_NETWORK_STATE" },
      { name: "android.permission.WAKE_LOCK" },
    ];

    fs.writeFileSync("twa-manifest.json", JSON.stringify(manifest, null, 2));
    log("✅ Android TV configuration completed", "green");
  }
}

function buildAPK() {
  log("🔨 Building APK...", "yellow");

  execCommand("bubblewrap build");

  // Find the generated APK
  const apkFiles = fs.readdirSync(".").filter(file => file.endsWith(".apk"));

  if (apkFiles.length > 0) {
    const apkFile = apkFiles[0];
    log(`✅ APK build completed: ${apkFile}`, "green");

    // Copy APK to project root
    const targetPath = path.join("..", CONFIG.outputApk);
    fs.copyFileSync(apkFile, targetPath);
    log(`📱 APK copied to: ${targetPath}`, "green");

    return targetPath;
  } else {
    log("❌ APK file not found", "red");
    process.exit(1);
  }
}

async function installAPK(apkPath) {
  const install = await promptUser(
    "Do you want to install the APK to a connected Android TV device? (y/N): "
  );

  if (install.toLowerCase() === "y" || install.toLowerCase() === "yes") {
    try {
      execCommand("adb --version", { stdio: "pipe" });
      log("📱 Installing APK to connected device...", "yellow");
      execCommand(`adb install "${apkPath}"`);
      log("✅ APK installed successfully!", "green");
    } catch (error) {
      log("❌ ADB not found. Please install Android SDK platform tools", "red");
    }
  }
}

function cleanup() {
  log("🧹 Cleaning up...", "yellow");

  // Go back to project root
  process.chdir("..");

  // Remove temporary TV manifest
  if (fs.existsSync(CONFIG.manifestFile)) {
    fs.unlinkSync(CONFIG.manifestFile);
  }
}

async function main() {
  try {
    log("🎤 Building Karaoke for Jellyfin Android TV APK", "blue");
    log("==================================================", "blue");

    checkDependencies();
    createTVManifest();
    buildNextJS();
    await initializeBubblewrap();
    configureAndroidTV();
    const apkPath = buildAPK();
    await installAPK(apkPath);
    cleanup();

    log("🎉 Android TV APK build process completed!", "green");
    log(`📱 Your Karaoke TV APK is ready: ${CONFIG.outputApk}`, "blue");
    log(
      "🚀 Install it on your Android TV to enjoy full-screen karaoke!",
      "blue"
    );
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, "red");
    cleanup();
    process.exit(1);
  }
}

// Handle script interruption
process.on("SIGINT", () => {
  log("\n🛑 Build interrupted by user", "yellow");
  cleanup();
  process.exit(0);
});

// Run the main function
main();
