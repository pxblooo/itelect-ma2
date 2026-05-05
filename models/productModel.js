const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A product must have a name'],
  },
  price: {
    type: Number,
    required: [true, 'A product must have a price'],
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        return val < this.price;
      },
      message: 'Discount price should be below regular price'
    }
  },
  category: {
    type: String,
    required: [true, 'A product must have a category'],
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'A product must have a description'],
    maxlength: [50, 'Description must not exceed 50 characters']
  },
  seller: {
    type: String,
    required: [true, 'A product must have a seller'],
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  productSlug: String,
  premiumProducts: {
    type: Boolean,
    default: false
  }
}, { toJSON: { virtuals: true } });

// Virtual Property
productSchema.virtual('daysPosted').get(function() {
  if (!this.postedDate) return 0;
  const today = new Date();
  const diffTime = Math.abs(today - this.postedDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Document Middleware (before save)
productSchema.pre('save', function() {
  this.productSlug = this.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .toUpperCase();
});

// Query Middleware (find operations - only for find queries from API)
// This filters out premiumProducts = true by default
// (use function() without callback in modern Mongoose)
productSchema.pre('find', function() {
  this.where({ premiumProducts: false });
});

// Aggregate Middleware (optional)
productSchema.pre('aggregate', function() {
  // Add a $match stage at the beginning to filter premiumProducts
  this.pipeline().unshift({ $match: { premiumProducts: false } });
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;