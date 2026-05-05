module.exports = (temp, product) => {
  let output = temp.replace(/{%PRODUCTNAME%}/g, product.name);
  output = output.replace(/{%PRICE%}/g, product.price);
  output = output.replace(/{%CATEGORY%}/g, product.category);
  output = output.replace(/{%DESCRIPTION%}/g, product.description);
  output = output.replace(/{%SELLER%}/g, product.seller);
  output = output.replace(/{%ID%}/g, product._id);
  return output;
};