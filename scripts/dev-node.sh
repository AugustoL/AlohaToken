#!/bin/bash

# Stop any existing Hardhat node in port 8545
# check if there is a process running in port 8545
stop_hardhat_node() {
  if lsof -ti:8545; then
    echo "Stopping existing Hardhat node..."
    # kill the process running in port 8545
    kill -9 $(lsof -ti:8545)
  else
    echo "No existing Hardhat node found."
  fi
}

# Start the Hardhat node in the background and redirect logs to the console
npx hardhat node &> logs/hardhat_node.log &

# Trap EXIT signal to ensure the Hardhat node is stopped
trap stop_hardhat_node EXIT

# Run the Hardhat dev script and show logs
npx hardhat --network localhost run scripts/dev-deployment.ts &> logs/dev-deployment.log
cat logs/dev-deployment.log

# Ensure the Hardhat node is stopped after the deploy script finishes
stop_hardhat_node