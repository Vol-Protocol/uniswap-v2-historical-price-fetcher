const fetch = require("node-fetch");

const uniswapV2Endpoint =
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";

fetch(uniswapV2Endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `
    query get1stPrice {
      pairs(
        block: { 
          number: 11386176
        }
      ){
        id
        token0(where: {symbol: "DAI"}) {
          symbol
        }
        token0Price
        token1(where: {symbol: "DAI"}) {
          symbol
        }
        token1Price
        totalSupply
      }
    }
    `
  })
})
  .then((response) => response.json())
  .then((data) => console.dir(data, { depth: null }));
