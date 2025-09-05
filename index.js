const { ethers, FetchRequest } = require("ethers");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { SocksProxyAgent } = require("socks-proxy-agent");
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

dotenv.config();

// === CONFIG ===
// List of public RPCs for Celo.
const RPCS = [
  "https://celo.drpc.org",
  "https://forno.celo.org",
  "https://rpc.ankr.com/celo",
  "https://1rpc.io/celo"
];
const GAS_LIMIT = 21000;
const keysFile = "key.txt";
let lastKey = null;

// --- Dead proxy tracking ---
const deadProxyFile = "dead_proxies.json";
let DEAD_PROXIES = {};

function loadDeadProxies() {
  if (fs.existsSync(deadProxyFile)) {
    try {
      DEAD_PROXIES = JSON.parse(fs.readFileSync(deadProxyFile, "utf-8"));
    } catch (e) {
      console.error(chalk.red("⚠️ Error parsing dead_proxies.json, starting fresh."));
      DEAD_PROXIES = {};
    }
  }
}

function saveDeadProxies() {
  fs.writeFileSync(deadProxyFile, JSON.stringify(DEAD_PROXIES, null, 2));
}

function markProxyDead(proxy) {
  if (!proxy) return;
  if (!DEAD_PROXIES[proxy]) {
    DEAD_PROXIES[proxy] = { failures: 1, markedAt: new Date().toISOString() };
  } else {
    DEAD_PROXIES[proxy].failures++;
    DEAD_PROXIES[proxy].markedAt = new Date().toISOString();
  }
  saveDeadProxies();
  console.log(chalk.red(`🪦 Marked proxy as dead: ${proxy}`));
}

// --- Load keys from file ---
const PRIVATE_KEYS = fs.readFileSync(keysFile, "utf-8")
  .split("\n")
  .map(line => line.trim())
  .filter(line => line.length > 0);

// --- Load proxies from file ---
loadDeadProxies();
const proxyFile = "proxy.txt";
const PROXIES = fs.existsSync(proxyFile)
  ? fs.readFileSync(proxyFile, "utf-8")
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 0 && !DEAD_PROXIES[l]) // skip dead
  : [];

console.log(chalk.magenta(`🌐 Loaded ${PROXIES.length} proxies (skipped ${Object.keys(DEAD_PROXIES).length} dead)`));

// --- Wallet Persona Management ---
const personaFile = "personas.json";
let walletProfiles = {};

function loadPersonas() {
  if (fs.existsSync(personaFile)) {
    try {
      walletProfiles = JSON.parse(fs.readFileSync(personaFile, "utf-8"));
      console.log(chalk.cyan("🎭 Loaded existing personas"));
    } catch (e) {
      console.error(chalk.bgRed.white.bold("❌ Error parsing personas.json, starting fresh."));
      walletProfiles = {};
    }
  }
}

function savePersonas() {
  fs.writeFileSync(personaFile, JSON.stringify(walletProfiles, null, 2));
}

function ensurePersona(wallet) {
  if (!walletProfiles[wallet.address]) {
    walletProfiles[wallet.address] = {
      idleBias: Math.random() * 0.25,
      pingBias: Math.random() * 0.25,
      minAmount: 0.00005 + Math.random() * 0.0001,
      maxAmount: 0.015 + Math.random() * 0.005
    };
    savePersonas();
  }
  return walletProfiles[wallet.address];
}


// --- Dynamic Log File Management (Daily Rotation) ---
// This function returns the log file path for the current day.
function getLogFile() {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  return path.join(__dirname, `tx_log_${today}.csv`);
}

// This function initializes the log file with a header if it doesn't exist.
function initLogFile() {
  const logFile = getLogFile();
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(
      logFile,
      "timestamp,wallet,tx_hash,nonce,gas_used,gas_price_gwei,fee_celo,status,action\n"
    );
  }
  return logFile;
}

// --- Tx Log Buffer ---
let txBuffer = [];
const FLUSH_INTERVAL = 60 * 1000; // 1 min
function bufferTxLog(entry) {
  txBuffer.push(entry);
}
function flushTxLog() {
  if (txBuffer.length === 0) return;
  const logFile = initLogFile();
  fs.appendFileSync(logFile, txBuffer.join("\n") + "\n");
  console.log(chalk.gray(`📝 Flushed ${txBuffer.length} tx logs to disk`));
  txBuffer = [];
}
// Periodic flusher
setInterval(flushTxLog, FLUSH_INTERVAL);

// Ensure logs are written on exit
process.on("exit", flushTxLog);
process.on("SIGINT", () => {
  flushTxLog();
  process.exit();
});

// --- Pick random key (with small chance of reusing last key) ---
// Provides a more "human-like" key selection by sometimes re-using the last key.
function pickRandomKey() {
  if (lastKey && Math.random() < 0.2) return lastKey;
  const idx = Math.floor(Math.random() * PRIVATE_KEYS.length);
  lastKey = PRIVATE_KEYS[idx];
  return lastKey;
}

// --- Pick a random proxy ---
function pickProxy() {
  if (PROXIES.length === 0) return null;
  const idx = Math.floor(Math.random() * PROXIES.length);
  return PROXIES[idx];
}

// --- Provider with proxy ---
function getProviderWithProxy(rpcUrl, proxyUrl) {
  const network = {
    chainId: 42220,
    name: "celo"
  };

  if (!proxyUrl) {
    // Explicitly pass network details to avoid auto-detection errors
    return new ethers.JsonRpcProvider(rpcUrl, network);
  }

  const agent = new SocksProxyAgent(proxyUrl);

  // Use node-fetch explicitly with agent
  const fetcher = (url, opts) => fetch(url, { ...opts, agent });

  const req = new FetchRequest(rpcUrl);
  req.getUrlFunc = () => rpcUrl;
  req.fetch = fetcher;

  // Use the FetchRequest with an explicit network configuration
  return new ethers.JsonRpcProvider(req, network);
}

/**
 * Attempts to connect to an RPC endpoint with a given proxy.
 * @param {string|null} proxy - The proxy URL to use for the connection.
 * @returns {Promise<{provider: ethers.JsonRpcProvider, url: string}>} The working provider and its URL.
 */
async function tryProviders(proxy) {
  console.log(chalk.hex("#00FFFF").bold("🔍 Searching for a working RPC endpoint..."));
  for (const url of RPCS) {
    try {
      const provider = getProviderWithProxy(url, proxy);
      const network = await Promise.race([
        provider.getNetwork(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ]);
      console.log(chalk.hex("#00FF7F").bold(`✅ Connected: ${url}, Chain ID: ${network.chainId}`));
      return { provider, url };
    } catch (e) {
      console.log(chalk.hex("#FF5555").bold(`❌ Failed to connect to ${url}: ${e.message}`));
    }
  }
  throw new Error("All RPC endpoints failed to connect.");
}

/**
 * Iterates through the list of RPCs and returns the first one that successfully connects, with failover.
 * This prevents the script from failing repeatedly on a non-responsive RPC.
 * @param {string|null} proxy - The proxy URL to use for the connection.
 * @returns {Promise<{provider: ethers.JsonRpcProvider, url: string}>} The working provider and its URL.
 */
async function getWorkingProvider(proxy) {
  try {
    return await tryProviders(proxy);
  } catch (err) {
    if (proxy) {
      console.log(chalk.yellow("⚠️ Proxy failed, retrying without proxy..."));
      markProxyDead(proxy);
      return await tryProviders(null);
    }
    throw new Error("All RPCs failed, even without proxy.");
  }
}

function randomDelay(minSec, maxSec) {
  const ms = (Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec) * 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendTx() {
  const key = pickRandomKey();
  const proxy = pickProxy();
  const { provider, url } = await getWorkingProvider(proxy);
  const wallet = new ethers.Wallet(key, provider);
  const profile = ensurePersona(wallet);

  try {
    if (Math.random() < profile.idleBias) {
      console.log(chalk.hex("#808080").italic("\n😴 Persona idle mode, skipping this cycle..."));
      return;
    }

    const balance = await provider.getBalance(wallet.address);
    const walletNonce = await provider.getTransactionCount(wallet.address);

    const NONCE_THRESHOLD = 535;
    if (walletNonce >= NONCE_THRESHOLD) {
      console.log(chalk.bgYellow.black.bold(`\n🟡 Wallet: ${wallet.address} nonce ${walletNonce} >= ${NONCE_THRESHOLD}. Skipping.`));
      return;
    }

    console.log(chalk.hex("#1E90FF").bold.underline(`\n🎲 Wallet: ${wallet.address}`));
    console.log(chalk.hex("#1E90FF").bold(`Using RPC: ${url}`));
    console.log(chalk.hex("#FFD700").bold(`Balance: ${ethers.formatEther(balance)} CELO`));
    console.log(chalk.hex("#FFD700").bold(`Nonce: ${walletNonce}`));
    console.log(chalk.hex("#FF00FF").bold(`🌍 Using Proxy: ${proxy || "none"}`));

    if (balance < ethers.parseEther("0.01")) {
      console.log(chalk.hex("#FFA500").bold("⚠️ Not enough balance, skipping..."));
      return;
    }

    // === Decide action: normal send vs ping ===
    let action = "normal";
    let value;
    if (Math.random() < profile.pingBias) {
      action = "ping";
      value = 0n; // 0 CELO, just burns gas
    } else {
      const amount = profile.minAmount + Math.random() * (profile.maxAmount - profile.minAmount);
      value = ethers.parseEther(amount.toFixed(6));
    }

    const tx = await wallet.sendTransaction({
      to: wallet.address,
      value: value,
      gasLimit: GAS_LIMIT
    });

    console.log(chalk.hex("#7FFF00").bold(`✅ Sent tx: ${tx.hash}`));
    if (tx.gasPrice) {
      console.log(chalk.hex("#FF69B4").bold(`⛽ Gas Price (RPC): ${ethers.formatUnits(tx.gasPrice, "gwei")} gwei`));
    }
    console.log(chalk.dim(`Explorer link: https://celoscan.io/tx/${tx.hash}`));

    let status = "pending", gasUsed = "", feeCELO = "", gasPriceGwei = "", txNonce = tx.nonce;

    const receipt = await Promise.race([
      tx.wait(),
      new Promise((resolve) => setTimeout(resolve, 10000))
    ]);

    if (receipt) {
      status = "confirmed";
      gasUsed = receipt.gasUsed.toString();
      gasPriceGwei = ethers.formatUnits(receipt.gasPrice, "gwei");
      feeCELO = ethers.formatEther(receipt.gasUsed * receipt.gasPrice);

      console.log(chalk.bgGreen.white.bold("🟢 Confirmed!"));
      console.log(`   Nonce: ${txNonce}`);
      console.log(chalk.hex("#ADFF2F").bold(`   Gas Used: ${gasUsed}`));
      console.log(chalk.hex("#FFB6C1").bold(`   Gas Price: ${gasPriceGwei} gwei`));
      console.log(chalk.hex("#FFD700").bold(`   Fee Paid: ${feeCELO} CELO`));
    } else {
      console.log(chalk.bgYellow.white.bold("🟡 No confirmation in 10s, moving on..."));
    }

    // === Buffer to CSV (daily rotation) ===
    const line = [
      new Date().toISOString(),
      wallet.address,
      tx.hash,
      txNonce,
      gasUsed,
      gasPriceGwei,
      feeCELO,
      status,
      action
    ].join(",");
    bufferTxLog(line);

  } catch (err) {
    console.error(chalk.bgRed.white.bold("❌ Error:", err.message));
    throw err;
  }
}

async function safeSendTx() {
  try {
    await sendTx();
  } catch (err) {
    console.log(chalk.hex("#FFA500").bold("⚠️ Retrying after error..."));
    await randomDelay(5, 10);
    try { await sendTx(); } catch (retryErr) {
      console.error(chalk.bgRed.white.bold("❌ Error on retry:", retryErr.message));
    }
  }
}

async function loop() {
  loadPersonas(); // Load personas at the start of the loop
  while (true) {
    await safeSendTx();

    // Base wait time between 30 and 150 seconds.
    let waitSec = Math.floor(Math.random() * (150 - 30 + 1)) + 30;
    // Add jitter ±10% to make the wait time more random and human-like.
    const jitter = Math.floor(waitSec * (Math.random() * 0.2 - 0.1));
    waitSec = Math.max(10, waitSec + jitter);

    console.log(chalk.hex("#00CED1").italic.bold(`⏳ Waiting ${waitSec}s before next tx...`));
    await randomDelay(waitSec, waitSec);
  }
}

loop();
