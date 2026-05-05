const express = require('express');
const morgan = require('morgan');
const productController = require('./controllers/productController');
const productRouter = require('./routes/productRoutes');

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/public`));

app
  .route('/')
  .get(productController.getOverviewPage);

app
  .route('/overview')
  .get(productController.getOverviewPage);

app
  .route('/item')
  .get(productController.getItemPage);

app.use('/api/v1/products', productRouter);

app
  .route('/api')
  .get(productController.getAPIData);

app
  .route('/add-product')
  .get(productController.getAddProductPage)
  .post(productController.createProductForm);

module.exports = app;