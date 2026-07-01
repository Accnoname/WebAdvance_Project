const Reservation = require('../models/Reservation.model');
const { createBaseRepository } = require('./base.repository');

const ReservationRepository = {
  ...createBaseRepository(Reservation),

  findAllWithDetails: (filter = {}, callback) => {
    Reservation.find(filter)
      .populate('table')
      .sort({ createdAt: -1 })
      .then(docs => callback(null, docs))
      .catch(err => callback(err));
  }
};

module.exports = ReservationRepository;
