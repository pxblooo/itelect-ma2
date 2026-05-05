const Product = require('../models/productModel');
const fs = require('fs');
const path = require('path');
const replaceTemplate = require('../modules/replaceTemplate');

const tempOverview = fs.readFileSync(`${__dirname}/../public/template-overview.html`, 'utf-8');
const tempCard = fs.readFileSync(`${__dirname}/../public/template-card.html`, 'utf-8');
const tempItem = fs.readFileSync(`${__dirname}/../public/template-item.html`, 'utf-8');

exports.checkID = (req, res, next, val) => {
  console.log(`Product id is: ${val}`);
  next();
};

exports.checkBody = (req, res, next) => {
  if (!req.body.name || !req.body.price || !req.body.category || !req.body.description || !req.body.seller) {
    return res.status(400).json({
      status: 'fail',
      message: 'Missing required fields: name, price, category, description, seller'
    });
  }
  next();
};

exports.getHomePage = (req, res) => {
  res.status(200).sendFile(`${__dirname}/../public/index.html`);
};

exports.getOverviewPage = async (req, res) => {
  try {
    const products = await Product.find(); // show all products in overview
    res.status(200).set('Content-Type', 'text/html');
    const cardsHtml = products.map(el => replaceTemplate(tempCard, el)).join('');
    const output = tempOverview.replace('{%PRODUCT_CARDS%}', cardsHtml);
    res.send(output);
  } catch (err) {
    res.status(500).send('Error loading products');
  }
};

exports.getItemPage = async (req, res) => {
  try {
    const id = req.query.id;
    const format = req.query.format;
    const product = await Product.findById(id);

    if (!product) {
      if (format === 'json') {
        res.status(404).set('Content-Type', 'application/json');
        res.send(JSON.stringify({ status: 'fail', message: 'Product not found' }));
      } else {
        res.status(404).set('Content-Type', 'text/html');
        res.send('<h1>Product not found</h1>');
      }
      return;
    }

    if (format === 'json') {
      res.status(200).set('Content-Type', 'application/json');
      res.send(JSON.stringify({ status: 'success', data: { product } }));
    } else {
      res.status(200).set('Content-Type', 'text/html');
      const output = replaceTemplate(tempItem, product);
      res.send(output);
    }
  } catch (err) {
    res.status(500).send('Error loading product');
  }
};

exports.getAPIData = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    // 1) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1.1) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Product.find(JSON.parse(queryStr));

    // 2) Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('price');
    }

    // 3) Field limiting
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      query = query.select('-__v');
    }

    // 4) Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numProducts = await Product.countDocuments();
      if (skip >= numProducts) {
        return res.status(404).json({
          status: 'fail',
          message: 'Page does not exist'
        });
      }
    }

    const products = await query;

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (err) {
    console.log('Error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message || 'An error occurred'
    });
  }
};

exports.aliasTopCheap = (req, res, next) => {
  req.query.limit = '3';
  req.query.sort = 'price';
  req.query.fields = 'name,price,category,seller';
  next();
};

exports.productCategoryStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      {
        $match: { price: { $lt: 1000 } }
      },
      {
        $group: {
          _id: '$category',
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { avgPrice: 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (err) {
    console.log('Aggregation error:', err);
    res.status(400).json({
      status: 'fail',
      message: err.message || 'Aggregation failed'
    });
  }
};

exports.seedProducts = async (req, res) => {
  try {
    // Delete all existing products first
    await Product.deleteMany({});
    
    const productsData = [
      { name: 'Chocolate Frog Box', price: 380, category: 'Sweets', description: 'Magical chocolate frogs.', seller: 'Honeydukes', postedDate: new Date('2026-01-15'), premiumProducts: false, priceDiscount: 300 },
      { name: 'Butterbeer Mug', price: 450, category: 'Sweets', description: 'Butterbeer mug from Hogsmeade.', seller: 'ThreeBroomsticks', postedDate: new Date('2026-01-20'), premiumProducts: false, priceDiscount: 350 },
      { name: 'Gryffindor Scarf', price: 850, category: 'Apparel', description: 'Red gold striped Gryffindor scarf.', seller: 'HouseOfHogwarts', postedDate: new Date('2026-02-01'), premiumProducts: false, priceDiscount: 650 },
      { name: 'Slytherin Scarf', price: 850, category: 'Apparel', description: 'Green silver striped Slytherin scarf.', seller: 'HouseOfHogwarts', postedDate: new Date('2026-02-05'), premiumProducts: false, priceDiscount: 650 },
      { name: 'Potion Ingredients Kit', price: 650, category: 'Potions', description: 'Beginner magical potion ingredients kit.', seller: 'PotionsMaster', postedDate: new Date('2026-01-10'), premiumProducts: false, priceDiscount: 500 },
      { name: 'Advanced Spell Book', price: 950, category: 'Books', description: 'Advanced defense spells and charms.', seller: 'DiagonAlley', postedDate: new Date('2026-01-25'), premiumProducts: false, priceDiscount: 750 },
      { name: 'Desk Lamp Magical', price: 750, category: 'Decor', description: 'Magical LED desk lamp for study.', seller: 'MagicalDecor', postedDate: new Date('2026-02-08'), premiumProducts: false, priceDiscount: 600 },
      { name: 'Rune Stones', price: 600, category: 'Books', description: 'Ancient rune stones for fortune.', seller: 'DiagonAlley', postedDate: new Date('2026-02-10'), premiumProducts: true, priceDiscount: 450 },
      { name: 'Marauder\'s Map Replica', price: 2500, category: 'Collectibles', description: 'Detailed replica Marauders Map.', seller: 'WizardCrafts', postedDate: new Date('2026-03-01'), premiumProducts: false },
      { name: 'Interactive Sorting Hat', price: 3500, category: 'Collectibles', description: 'Famous Sorting Hat from Hogwarts.', seller: 'HogwartsStore', postedDate: new Date('2026-03-05'), premiumProducts: false },
      { name: 'Harry Potter Wand', price: 1800, category: 'Wands', description: 'Harry Potter wand replica here.', seller: 'OllivanderWands', postedDate: new Date('2026-02-15'), premiumProducts: false },
      { name: 'Hermione Granger Wand', price: 1800, category: 'Wands', description: 'Hermione wand vine wood replica.', seller: 'OllivanderWands', postedDate: new Date('2026-02-20'), premiumProducts: false },
      { name: 'Ron Weasley Wand', price: 1500, category: 'Wands', description: 'Ron Weasley ash wood wand replica.', seller: 'OllivanderWands', postedDate: new Date('2026-02-18'), premiumProducts: false },
      { name: 'Hogwarts Robe', price: 2200, category: 'Apparel', description: 'Black Hogwarts student robe crest.', seller: 'HogwartsApparel', postedDate: new Date('2026-03-02'), premiumProducts: false },
      { name: 'Platform 9 3/4 Sign', price: 1200, category: 'Decor', description: 'Platform 9.75 Kings Cross replica.', seller: 'MagicalDecor', postedDate: new Date('2026-02-28'), premiumProducts: false }
    ];

    // Manually generate productSlug for each product since insertMany doesn't trigger pre-save hooks
    const productsWithSlugs = productsData.map(product => ({
      ...product,
      productSlug: product.name.toLowerCase().replace(/\s+/g, '-').toUpperCase()
    }));

    const inserted = await Product.insertMany(productsWithSlugs, { ordered: false, runValidators: true });

    res.status(201).json({
      status: 'success',
      message: 'Database cleared and seeded with Harry Potter themed products',
      results: inserted.length,
      data: {
        products: inserted
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({
        status: 'success',
        message: 'Some items already existed; other products were seeded',
        data: {
          error: err.message
        }
      });
    }
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message || err
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message || err
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message || err
    });
  }
};

exports.getAddProductPage = (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'add-product.html');
  res.status(200).sendFile(filePath);
};


exports.createProductForm = async (req, res) => {
  try {
    await Product.create(req.body);
    res.redirect('/overview');
  } catch (err) {
    res.status(400).send('Error creating product');
  }
};
