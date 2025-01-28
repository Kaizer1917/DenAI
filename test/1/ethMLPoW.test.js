const UsingEthML = artifacts.require("UsingEthML");
const EthMLMain = artifacts.require("EthMLMain");
const EthMLAbi = require("../../build/contracts/EthML.json").abi;

contract("EthMLMain", async (accounts) => {
  let usingEthML, ethML;

  //const [alice, bob, john, mike, dave, chris] = accounts;

  it("is deployed properly", async () => {
    ethML = await EthMLMain.deployed();
    usingEthML = await UsingEthML.deployed();
    assert(ethML.address !== "");
    assert(usingEthML.address !== "");
  });

  it("allows submission of data", async () => {
    //Request for prediction through UsingEthML contract
    const dataPoint = "QmTkzDwWqPbnAh5YiV5VwcTLnGdwSNsNTn2aDxdXBFca7D";
    const modelId = 1;
    const tip = 0;
    await usingEthML.requestPrediction(modelId, dataPoint, tip, {
      from: accounts[0],
    });

    const vars = await ethML.getCurrentVariables();
    const challenge = vars[0];
    const difficulty = vars[2];

    let res;

    for (let i = 1; i < 6; i++) {
      let nonce = 0;
      let target = BigInt(challenge) / BigInt(difficulty);
      result = BigInt("0x" + "f".repeat(64));
      while (result > target) {
        nonce++;
        result = BigInt(web3.utils.soliditySha3(challenge, accounts[i], nonce));
      }
      let data = web3.eth.abi.encodeFunctionCall(EthMLAbi[1], [1, 356, nonce]);
      res = await ethML.sendTransaction({
        from: accounts[i],
        data,
      });
    }

    assert(res.logs[0].args.prediction.toNumber() === 356);
  });

  it("generates fresh supply of token as reward", async () => {
    let bal;
    for (let i = 1; i < 6; i++) {
      bal = await ethML.balanceOf(accounts[i]);
      if (bal.toString() !== "1050000000000000000000")
        assert(false, "Invalid balance.");
    }

    bal = await ethML.totalSupply();
    assert(bal.toString() === "6250000000000000000000");
  });

  it("UsingEthML receives the request", async () => {
    const res = await usingEthML.getLatestResponse();
    assert(res.toNumber() === 356);
  });

  it("allows submission of another data", async () => {
    //Request for prediction through UsingEthML contract
    const dataPoint = "QmTkzDwWqPbnAh5YiV5VwcTLnGdwSNsNTn2aDxdXBFca7D";
    const modelId = 1;
    const tip = 0;
    await usingEthML.requestPrediction(modelId, dataPoint, tip, {
      from: accounts[0],
    });

    const vars = await ethML.getCurrentVariables();
    const challenge = vars[0];
    const difficulty = vars[2];

    let res;

    for (let i = 1; i < 6; i++) {
      let nonce = 0;
      let target = BigInt(challenge) / BigInt(difficulty);
      result = BigInt("0x" + "f".repeat(64));
      while (result > target) {
        nonce++;
        result = BigInt(web3.utils.soliditySha3(challenge, accounts[i], nonce));
      }
      let data = web3.eth.abi.encodeFunctionCall(EthMLAbi[1], [2, 358, nonce]);
      //console.log(i);
      res = await ethML.sendTransaction({
        from: accounts[i],
        data,
      });
    }

    //assert(res.logs[0].args.prediction.toNumber() === 358);
  });
});
