const fetch = require("node-fetch");
const { ethers } = require("ethers");
const dotenv = require("dotenv");
dotenv.config();

let historicalPrice = [];

async function getCurrentBlock() {
  const provider = new ethers.providers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
  );
  const currentBlock = await provider.getBlock("latest");
  const currentBlockNumber = currentBlock.number - 5;
  // subtract five blocks because the subgraph doesn't have the latest block due to its latency. you might have to subtract more blocks.
  // it's more accurate to make a graph query to get latest available block then you know how many blocks you are behind
  return currentBlockNumber;
}

// @task dynamically get the number of blocks per a day
// @task need to decide at which time of the day we fetch a closing price
function getBlocksPerDay() {
  return 6500;
}

// @task iterate through pairs and dynamically get an exchange contract address with two token addresses
function getExchangeAddress() {
  return "0xa478c2975ab1ea89e8196811f51a7b7ade33eb11";
}

// @task use the unique identifier for ordering. it is rare but possible that createdAtTimestamp is the same in another contract
async function getFirst1000Pairs(lastCreatedAtTimestamp, blockNumber) {
  const subgraphEndpoint =
    "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";
  const queryData = JSON.stringify({
    query: `query getFirst1000Pairs($lastCreatedAtTimestamp: Int!, $blockNumber: Int!) {
      pairs(
        first: 1000,
        orderDirection: asc,
        orderBy: createdAtTimestamp,
        where: {
          createdAtTimestamp_gt: $lastCreatedAtTimestamp,
        },
        block: {
          number: $blockNumber
        }
      ){
        id
        createdAtTimestamp,
        token0Price
      }
    }`,
    variables: {
      lastCreatedAtTimestamp,
      blockNumber
    }
  });

  let response;
  try {
    response = await fetch(subgraphEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: queryData
    });
  } catch (error) {
    console.log(error);
  }

  try {
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.log(error);
  }
}

function getLastCreatedAtTimestamp(response) {
  let createdAtTimestampList = [];
  for (let i = 0; i < response.pairs.length; i++) {
    createdAtTimestampList.push(response.pairs[i].createdAtTimestamp);
  }
  const lastCreatedAtTimestamp = Math.max(...createdAtTimestampList);
  return lastCreatedAtTimestamp;
}

function filterWETHPricesInDAI(pairs, exchangeAddress) {
  let prices = [];
  for (let i = 0; i < pairs.length; i++) {
    if ((pairs[i].id = exchangeAddress)) {
      prices.push(pairs[i].token0Price);
    }
  }
  return prices;
}

async function getAllPairs(blockNumber) {
  let response = null;
  let pairs = [];
  for (let entityCounter = 0; entityCounter < 30; entityCounter++) {
    let lastCreatedAtTimestamp;
    if (entityCounter === 0) {
      lastCreatedAtTimestamp = 0;
    } else {
      lastCreatedAtTimestamp = getLastCreatedAtTimestamp(response);
    }

    try {
      response = await getFirst1000Pairs(lastCreatedAtTimestamp, blockNumber);
      pairs = pairs.concat(response.pairs);
    } catch (error) {
      console.log(error);
    }
  }
  return pairs;
}

// @task this fetcher is still unstable.
// @task dynamically decide to get price from either token0 or token1.
(async () => {
  const currentBlockNumber = await getCurrentBlock();
  const blocksPerDay = getBlocksPerDay();
  for (let blockCounter = 0; blockCounter < 30; blockCounter++) {
    const blockNumber = currentBlockNumber - blockCounter * blocksPerDay;
    const pairs = await getAllPairs(blockNumber);
    const DAI_WETH_ExchangeAddress = getExchangeAddress();
    let WETHPricesInDAI = filterWETHPricesInDAI(
      pairs,
      DAI_WETH_ExchangeAddress
    );
    historicalPrice = historicalPrice.concat(WETHPricesInDAI);
    console.log("historicalPrice ==>", historicalPrice);
  }
})();
