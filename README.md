# Celo Proxy Farm

A stealth-optimized farming script for the **Celo blockchain**, using multiple proxies and wallet personas to simulate human-like testnet/mainnet activity.
Built with **Node.js** and **ethers.js**, it manages randomized wallet behaviors, transaction delays, dynamic logging, and proxy failover for long-term interaction.

## ✨ Features

* 🔑 **Multi-wallet support**: load private keys from `key.txt`
* 🌐 **Proxy cycling with dead-proxy cache**: failed proxies are skipped automatically, logged in `dead_proxies.json`
* 🕵️ **Persona-driven behavior**: each wallet has unique traits (`idleBias`, `pingBias`, min/max transfer ranges)
* 🔄 **Randomized key reuse**: small chance to reuse last key (human-like activity)
* ⏳ **Dynamic random delays**: waits 30–150s (+ jitter) between transactions
* ⛽ **Gas-aware with nonce cap**: skips wallets with nonce ≥ 535, avoids unbalanced accounts
* 📝 **Daily rotated CSV logs**: transactions are buffered and written to `tx_log_YYYY-MM-DD.csv`
* 🔁 **Retry on error**: failed transactions are retried once before skipping
* 📂 **Persistent state**: personas and proxies stored in JSON files
* 🎛 **Interactive console logs**: color-coded status with CELO explorer links

## 🚀 Installation

```bash
# Clone the repo
git clone https://github.com/CryptoExplor/celo-proxy-farm.git
cd celo-proxy-farm

# Install dependencies
npm install
```

## ⚙️ Setup

1. **Environment variables**
   Copy `.env.example` → `.env` (optional if using default RPCs):

   ```bash
   cp .env.example .env
   ```

   Example `.env`:

   ```env
   BACKEND_API_URL=https://backend.example.com  # optional
   RPCS=https://celo.drpc.org,https://forno.celo.org,https://rpc.ankr.com/celo,https://1rpc.io/celo
   PROXY_LIST=proxy.txt
   ```

2. **Wallet private keys** → add to `key.txt` (1 per line):

   ```
   0xabc123...
   0xdef456...
   ```

3. **Proxies** → add to `proxy.txt` (HTTP/SOCKS5, one per line):

   ```
   socks5://127.0.0.1:9050
   http://username:password@proxyserver:8080
   ```

   Dead proxies are tracked in `dead_proxies.json` and skipped automatically.

## ▶️ Usage

Run the farmer:

```bash
node index.js
```

### Behavior

* Picks random wallet + random proxy each cycle
* Sometimes reuses last wallet for realism
* Sometimes idles (no transaction this round)
* Chooses between:

  * **Ping tx**: sends 0 CELO (burns gas)
  * **Self-send**: sends small randomized CELO amount to itself
* Logs activity, retries once if failed, then continues

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
⏳ Waiting 97s before next tx...
```

## 📦 Output Files

* `tx_log_YYYY-MM-DD.csv` → daily rotated transaction logs
* `dead_proxies.json` → cache of failed proxies
* `personas.json` → wallet persona traits
* `key.txt` → wallet private keys (**ignored by git**)
* `proxy.txt` → proxy list (**ignored by git**)

## 📂 File Structure

```
├── index.js             # Main farming script
├── package.json         # Dependencies
├── .env.example         # Example env vars
├── .gitignore           # Ignores sensitive files
├── key.txt              # Private keys (ignored)
├── proxy.txt            # Proxies (ignored)
├── dead_proxies.json    # Dead proxy tracker
├── personas.json        # Wallet personas
├── tx_log_YYYY-MM-DD.csv# Daily tx logs
└── README.md            # Documentation
```

## 🔐 Security Notes

* **Never commit** `key.txt`, `.env`, or proxy credentials.
* Use **burner/test wallets** for farming.
* Rotate proxies regularly.

## 📜 License

MIT License © 2025 CryptoExplor

---

💡 Tip: Use [PM2](https://pm2.keymetrics.io/) for process management (auto-restart, logs, uptime).
