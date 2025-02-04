# DenAI 
> A decentralized machine learning implementation on Ethereum.

DenAI is a fully functional prototype of a decentralized machine learning system, built on the Ethereum blockchain. Decentralized AI aims to combat the high degree of centralization in the field of AI by adding the aspect of distributed computing (here, Distributed Ledger Technology). DenAI allows users to receive predictions from pre-trained ML models residing on a distributed computing network. Users upload the IPFS hash of a data-point & the model id of the model they want the prediction for to a smart contract deployed on Ethereum. This smart contract thereafter forwards the request to the mining system, which is a set of computers running the DenAI-server & storing the models. These servers compute the prediction and upload the generated data along with a mining solution (used as a proof of work for utility token generation) back onto the smart contract, which then returns result to the user.

## Architecture
The design can be thought of as a two-layer structure. The base layer being the model network of computers that make the prediction and also finds the proof of work solution. The top layer would be formed of the set of managing smart contracts which would function as a virtual/logical chain on-top of the existing chain. This virtual chain would keep track of the requested predictions.

![EthML architecture](https://i.ibb.co/zmy2XSw/tuxpi-com-1608895635.jpg)

## Distributed DenAI Platform

A decentralized machine learning platform built on Ethereum that supports distributed model training and multiple simultaneous users.

### Architecture

The platform consists of several key components:

1. **Smart Contract (contracts/DenAI.sol)**
   - Handles user roles (trainers and validators)
   - Manages training tasks and their lifecycle
   - Implements reward distribution
   - Maintains task state and validation requirements

2. **Server (DenAI_server/server.js)**
   - Manages distributed worker nodes
   - Handles task distribution and load balancing
   - Provides REST API for client interactions
   - Uses Redis for distributed state management
   - Implements Bull for task queuing

3. **Worker (DenAI_server/worker.js)**
   - Handles actual model training tasks
   - Reports system metrics for load balancing
   - Implements fault tolerance
   - Communicates with server via WebSocket

## Running Locally
This repo is a truffle project, consisting of the smart contracts and a server implemented in JS.

## Dependencies Installation

### Ethereum Dependencies

Clone Git repo:
``` 
git clone https://github.com/Kaizer1917/DenAI.git 
```

Install truffle for deployment & ganache-cli for running a local blockchain:
```
npm i -g ganache-cli
npm i -g truffle
```

Install dependencies: 
``` 
npm install 
```

### ML Dependencies (Python)

These dependencies can be installed using the python package manager `pip`

- joblib
- sklearn
- numpy
- pandas

## Setup for testing

Start a local blockchain on localhost:8545 using ganache-cli. Note: Please use the mnemonic as stated below, as the accounts formed get prefunded with the tokens.
```
ganache-cli -m hawk couple problem quantum lemon lava saddle swallow want become forum educate -l 10000000
```

Deploy the contracts using truffle:
```
truffle migrate 
```

Start a minimum of 5 instances of DenAI server, in 5 different terminal windows. Note: the digit given as flag denotes the account out of the 10 ganache generated accounts to be used by the server for sending transactions:
```
node ./DenAI_server 0
node ./DenAI_server 1
...
...
node ./DenAI_server 4
```

### Testing

Start truffle console in a new terminal:
```
truffle console
```

In the truffle console, get the deployed instance of UsingDenAI contract:
```
const instance = await UsingDenAI.deployed()
```

Send a prediction request by calling the requestPrediction method is [UsingDenAI contract](https://github.com/Kaizer1917/DenAI/blob/master/contracts/user_contracts/UsingDenAI.sol). You can use one of the pre-generated hashed provided in [testSeed file](https://github.com/Kaizer1917/DenAI/blob/master/.testSeed):
```
await instance.requestPrediction(1, "bafkreiaeigybm7ca2bk4xc3rfoxuvija53tyekayg37hkarfft2tbn4vem", 0)
```

The running servers would catch the generated requests and start mining the result.

## Setup for Distributed DenAI Platform

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp DenAI_server/.env.example DenAI_server/.env
# Edit .env with your configuration
```

3. Start Redis:
```bash
redis-server
```

4. Deploy smart contract:
```bash
truffle migrate
```

5. Start server:
```bash
cd DenAI_server
npm run start
```

6. Start worker(s):
```bash
cd DenAI_server
node worker.js
```

## API Endpoints

- `POST /api/tasks`: Create new training task
- `GET /api/tasks/:taskId`: Get task status and results

## Architecture Benefits

1. **Scalability**
   - Distributed task processing
   - Load balancing across workers
   - Redis-based state management

2. **Reliability**
   - Multiple validation requirements
   - Fault tolerance
   - Task queue management

3. **Security**
   - Role-based access control
   - Rate limiting
   - Input validation

4. **Performance**
   - Asynchronous task processing
   - WebSocket-based communication
   - Efficient state management

## Screenshots

Value Mining:

![Value Mining](https://i.ibb.co/Q98RMxh/1.png)

New Block:

![New Block](https://i.ibb.co/cYzJ7kP/2.png)

## Contributing

1. Fork the repository from [https://github.com/Kaizer1917/DenAI](https://github.com/Kaizer1917/DenAI)
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request at [https://github.com/Kaizer1917/DenAI/pulls](https://github.com/Kaizer1917/DenAI/pulls)

## Issues

If you find any bugs or have feature requests, please create an issue at [https://github.com/Kaizer1917/DenAI/issues](https://github.com/Kaizer1917/DenAI/issues)
