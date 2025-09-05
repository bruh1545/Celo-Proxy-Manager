# Celo Proxy Manager

## Automated Celo transaction simulator with proxy routing, persona-driven behavior, and logging.


A **Node.js + ethers.js** based automation tool for the **Celo blockchain**, designed to handle multi-wallet transactions with proxy routing, randomized behavior, and structured logging.
This tool is useful for **transaction simulation, network reliability testing, and load balancing across RPC endpoints** while ensuring traffic diversity with proxy rotation.

## ✨ Features

* 🔑 **Multi-wallet support** – load private keys from `key.txt`
* 🌐 **Proxy management with failover** – skips unreachable proxies, tracked in `dead_proxies.json`
* 🎭 **Wallet personas** – each wallet is assigned usage traits (idle bias, transfer bias, min/max transfer)
* 🔄 **Randomized activity** – non-repetitive transaction patterns for simulation realism
* ⏳ **Adaptive delays** – waits 30–150s (+ jitter) between wallet actions
* ⛽ **Gas-aware logic** – avoids overused accounts (e.g., nonce caps) and unbalanced wallets
* 📝 **CSV logging** – daily rotated transaction logs for analysis
* 🔁 **Error handling** – automatic retry once before skipping
* 📂 **Persistent state** – proxy health and wallet personas saved across runs
* 🎛 **Interactive console logs** – color-coded status with CELO explorer links

## 🚀 Installation

```bash
# Clone the repo
git clone https://github.com/CryptoExplor/celo-proxy-manager.git
cd celo-proxy-manager

# Install dependencies
npm install
```

## ⚙️ Setup

1. **Environment variables**
   Copy `.env.example` → `.env`:

   ```bash
   cp .env.example .env
   ```

   Example `.env`:

   ```env
   BACKEND_API_URL=https://backend.example.com   # optional
   RPCS=https://celo.drpc.org,https://forno.celo.org,https://rpc.ankr.com/celo,https://1rpc.io/celo
   PROXY_LIST=proxy.txt
   ```

2. **Wallet private keys** → add them to `key.txt` (one per line):

   ```
   0xabc123...
   0xdef456...
   ```

3. **Proxies** → add to `proxy.txt` (HTTP/SOCKS5 supported):

   ```
   socks5://127.0.0.1:9050
   http://username:password@proxyserver:8080
   ```

   Dead proxies are automatically cached in `dead_proxies.json`.

## ▶️ Usage

Run the automation tool:

```bash
node index.js
```

### How It Works

* Selects a random wallet + proxy for each cycle
* Randomized chance to idle (simulates inactivity)
* Executes one of:

  * **Ping transaction** – 0 CELO tx to validate network
  * **Self-transfer** – randomized CELO amount sent to self
* Logs all activity to console and CSV
* Retries failed transactions once before moving on

Example console output:

```
🌐 Loaded 14 proxies (skipped 2 dead)
🎭 Loaded existing personas
🔍 Searching for a working RPC endpoint...
✅ Connected: https://celo.drpc.org, Chain ID: 42220
🎲 Wallet: 0x123...
Balance: 1.234 CELO | Nonce: 42
🌍 Using Proxy: socks5://127.0.0.1:9050
✅ Sent tx: 0xabc...
🟢 Confirmed!
   Gas Used: 21000 | Gas Price: 0.5 gwei | Fee: 0.0000105 CELO
⏳ Waiting 97s before next action...
```

## 📦 Output Files

* `tx_log_YYYY-MM-DD.csv` → daily transaction logs
* `dead_proxies.json` → failed proxy tracker
* `personas.json` → wallet persona definitions
* `key.txt` → wallet private keys (**ignored by git**)
* `proxy.txt` → proxy list (**ignored by git**)

## 📂 Project Structure

```
├── index.js             # Main automation script
├── package.json         # Dependencies
├── .env.example         # Example env vars
├── .gitignore           # Ignores sensitive files
├── key.txt              # Private keys (ignored)
├── proxy.txt            # Proxies (ignored)
├── dead_proxies.json    # Failed proxy cache
├── personas.json        # Wallet persona settings
├── tx_log_YYYY-MM-DD.csv# Daily logs
└── README.md            # Documentation
```

## 🔐 Security Notes

* **Do not commit** `key.txt`, `.env`, or proxy credentials
* Always use test or dedicated wallets for automation tasks
* Rotate proxies regularly for reliability

## 📜 License

MIT License © 2025 CryptoExplor

---

💡 Tip: For production usage, run with [PM2](https://pm2.keymetrics.io/) for auto-restart and log management.
