const fetch = require("node-fetch");

const uniswapV2Endpoint =
  "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";

fetch(uniswapV2Endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: `
    query getPrice {
      pairs {
        id
        token0 {
          symbol
        }
        token0Price
        token1 {
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
