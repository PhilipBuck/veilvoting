#!/usr/bin/env node

import http from "http";

const HARDHAT_NODE_URL = "http://localhost:8545";

function checkHardhatNode() {
  return new Promise((resolve) => {
    const req = http.request(
      HARDHAT_NODE_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on("error", () => {
      resolve(false);
    });

    req.write(JSON.stringify({ jsonrpc: "2.0", method: "web3_clientVersion", params: [], id: 1 }));
    req.end();
  });
}

async function main() {
  const isRunning = await checkHardhatNode();

  if (!isRunning) {
    console.error("❌ Hardhat node is not running at", HARDHAT_NODE_URL);
    console.error("   Please run: npx hardhat node");
    process.exit(1);
  }

  console.log("✅ Hardhat node is running");
}

main();
