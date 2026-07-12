const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem.model');

mongoose.connect('mongodb://127.0.0.1:27017/restaurant-pos')
  .then(async () => {
    try {
      const item = await MenuItem.create({
        name: 'Test Dish',
        description: 'Test',
        category: 'chinh',
        price: 100000,
        prepareTime: 15
      });
      console.log('Success:', item);
      await MenuItem.findByIdAndDelete(item._id);
    } catch (err) {
      console.error('Validation Error:', err.message);
    }
    mongoose.disconnect();
  });
