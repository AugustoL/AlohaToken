export const ALHfromWei = function(amount) {
  return amount / Math.pow(10, 18);
}

export const ALHtoWei = function(amount) {
  return amount * Math.pow(10, 18);
}