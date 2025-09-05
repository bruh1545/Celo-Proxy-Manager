# Celo Proxy Farm

A stealth-optimized farming script for the **Celo blockchain**, using multiple proxies and wallet personas to simulate human-like activity. Built with **Node.js** and **ethers.js**, the script manages randomized wallet behaviors, transaction delays, and proxy cycling for long-term testnet/mainnet farming.

## Features

* 🔑 Multi-wallet farming with private key loading from `key.txt`
* 🌐 Proxy support with automatic failover
* 🕵️ Persona-driven wallet behavior (random idle periods, activity simulation)
* ⏳ Randomized transaction delays to mimic human activity
* 🛡️ Gas-aware scheduling
* 🗂️ Persistent wallet profiles (CSV + JSON tracking)
* 📜 Logging of all transactions & failures

## Installation

```bash
# Clone repo
git clone https://github.com/yourusername/celo-proxy-farm.git
cd celo-proxy-farm

# Install dependencies
npm install
```

## Setup

1. Copy `.env.example` to `.env` and configure your settings:

   ```bash
   cp .env.example .env
   ```

   Example variables:

   ```env
   BACKEND_API_URL=https://backend.example.com
   RPCS=https://celo.drpc.org,https://forno.celo.org
   PROXY_LIST=proxies.txt
   ```

2. Add private keys (one per line) in `key.txt`.

3. Add your proxy list (HTTP/SOCKS5) in `proxies.txt`.

## Usage

Run the script with:

```bash
node index.js
```

### Flags & Options

* `--retry` → enable 6h retry cycle for failed proxies
* `--debug` → verbose logging

Example:

```bash
node index.js --retry --debug
```

## File Structure

```
├── index.js          # Main script
├── package.json      # Dependencies
├── .env.example      # Example environment variables
├── key.txt           # Private keys (ignored in git)
├── proxies.txt       # Proxy list (ignored in git)
├── SECURITY.md       # Security guidelines
└── README.md         # Project docs
```

## Security

* **Never commit** `key.txt`, `.env`, or any sensitive data.
* Always use separate wallets for farming/testing.
* Refer to [`SECURITY.md`](SECURITY.md) for guidelines.

## License

MIT License © 2025

---

💡 Tip: Use a scheduler (like cron or pm2) to run this script continuously with auto-restart.
