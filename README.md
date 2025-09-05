# Celo Proxy Farm

A stealth-optimized farming script for the **Celo blockchain**, using multiple proxies and wallet personas to simulate human-like activity. Built with **Node.js** and **ethers.js**, the script manages randomized wallet behaviors, transaction delays, and proxy cycling for long-term testnet/mainnet farming.

## Features

* 🔑 **Multi-wallet support**: load private keys from `key.txt`
* 🌐 **Proxy failover**: automatic dead proxy detection and 6h retry cycle
* 🕵️ **Persona-driven behavior**: each wallet simulates unique user patterns
* ⏳ **Random delays**: human-like transaction scheduling
* ⛽ **Gas-aware**: avoids high-fee transactions
* 🗂 **Persistent profiles**: wallet history saved in CSV + JSON
* 📜 **Logging**: transactions, proxy failures, retries, and persona activity

## Installation

```bash
# Clone the repo
git clone https://github.com/CryptoExplor/celo-proxy-farm.git
cd celo-proxy-farm

# Install dependencies
npm install
```

## Setup

1. **Configure environment variables**:
   Copy `.env.example` to `.env` and edit values:

   ```bash
   cp .env.example .env
   ```

   Example `.env`:

   ```env
   # Backend endpoint (optional)
   BACKEND_API_URL=https://backend.example.com

   # RPC endpoints (comma-separated)
   RPCS=https://celo.drpc.org,https://forno.celo.org,https://rpc.ankr.com/celo

   # Proxy list filename
   PROXY_LIST=proxy.txt
   ```

2. **Add wallet private keys** in `key.txt` (1 per line):

   ```
   0xabc123...
   0xdef456...
   ```

3. **Add proxies** in `proxy.txt` (HTTP/SOCKS5, one per line):

   ```
   socks5://127.0.0.1:9050
   http://username:password@proxyserver:8080
   ```

## Usage

Run the script:

```bash
node index.js
```

### Options

* `--retry` → enable retry cycle for failed proxies every 6 hours
* `--debug` → verbose logs
* `--dry-run` → simulate behavior without sending transactions

Example:

```bash
node index.js --retry --debug
```

## Logs & Output

* ✅ Successful transactions → logged in `logs/transactions.csv`
* ❌ Dead proxies → written to `dead_proxies.json`
* 🕒 Retry schedule → automatic, every 6h for failed proxies

Example console output:

```
🌐 Loaded 14 proxies
🎭 Loaded existing personas
🔍 Searching for working RPC...
✅ Wallet 0x123 sent tx hash 0xabc...
❌ Proxy 192.168.0.2 marked dead (retry in 6h)
```

## File Structure

```
├── index.js          # Main farming script
├── package.json      # Dependencies & scripts
├── .env.example      # Example environment variables
├── .gitignore        # Ignores sensitive files
├── key.txt           # Private keys (ignored)
├── proxy.txt         # Proxy list (ignored)
├── dead_proxies.json # Dead proxy cache
├── SECURITY.md       # Security guidelines
└── README.md         # Documentation
```

## Security

* **Never commit** `key.txt`, `.env`, or proxy credentials.
* Use burner/test wallets for farming.
* Rotate proxies regularly to avoid detection.
* Review [`SECURITY.md`](SECURITY.md) for detailed guidance.

## License

MIT License © 2025 CryptoExplor

---

💡 Tip: Run with [PM2](https://pm2.keymetrics.io/) or `systemd` for continuous farming with auto-restarts.
