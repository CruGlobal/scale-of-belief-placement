'use strict'
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('events', 'derived_tstamp', 'TIMESTAMP(0)')
      .then(() => queryInterface.addColumn('events', 'collector_tstamp', 'TIMESTAMP(0)'))
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('events', 'derived_tstamp')
      .then(() => queryInterface.removeColumn('events', 'collector_tstamp'))
  }
}
