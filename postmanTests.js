const fetch = global.fetch || require('node-fetch');

(async function() {
  const cases = [
    {name:'Aggregation', method:'GET', url:'http://localhost:3000/api/v1/products/product-category'},
    {name:'Virtual', method:'GET', url:'http://localhost:3000/api/v1/products?limit=1&fields=name,productSlug,daysPosted,price'},
    {name:'Doc middleware', method:'GET', url:'http://localhost:3000/api/v1/products?limit=2&fields=name,productSlug'},
    {name:'Built-in validator fail', method:'POST', url:'http://localhost:3000/api/v1/products', body:{name:'Test description too long',price:100,category:'Testing',description:'This description is intentionally more than fifty characters long to trigger validation error.',seller:'User',priceDiscount:50}},
    {name:'Custom validator fail', method:'POST', url:'http://localhost:3000/api/v1/products', body:{name:'Price discount invalid',price:100,category:'Testing',description:'Valid short description',seller:'User',priceDiscount:120}},
    {name:'Create premium product', method:'POST', url:'http://localhost:3000/api/v1/products', body:{name:'Premium Magic Item',price:1200,category:'Collectibles',description:'High tier premium product',seller:'EliteVendor',priceDiscount:1100,premiumProducts:true}},
    {name:'Query filter check', method:'GET', url:'http://localhost:3000/api/v1/products?fields=name,price,premiumProducts'}
  ];

  for (const c of cases) {
    try {
      const options = { method: c.method, headers: {'Content-Type': 'application/json'} };
      if (c.body) options.body = JSON.stringify(c.body);
      const res = await fetch(c.url, options);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch (_) { data = text; }
      console.log('---', c.name, 'status', res.status);
      console.log(data);
    } catch (err) {
      console.log('---', c.name, 'error', err.message || err);
    }
  }
})();
