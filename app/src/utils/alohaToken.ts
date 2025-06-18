import web3 from "./web3";


export const ALHfromWei = function(amount) {
  return web3.utils.fromWei(amount, "ether");
}

export const ALHtoWei = function(amount) {
  return web3.utils.toWei(amount, "ether");
}