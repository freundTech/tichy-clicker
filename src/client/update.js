'use strict';

var actions = require('./actions.js');
var calculateItemCost = require('./util/calculate-item-cost.js');
var calculateShopIncome = require('./util/calculate-shop-income.js');
var config = require('../../resources/config.json');
var dispatcher = require('./dispatcher.js');
var Event = require('./util/event.js');
var Particle = require('./util/particle.js');
var shops = require('../../resources/shops.json');

var KEYCODE_SPACEBAR = 32;
var KEYCODE_ENTER = 13;
var KEYCODE_C = 67;
var KEYCODE_V = 86;
var KEYCODE_B = 66;

var interval = 1 / config.ticksPerSecond;

module.exports = {
  init: function (action, state) {
    window.state = state;

    setInterval(function () {
      actions.interval();
    }, 1000 * interval);

    window.addEventListener('keyup', function (e) {
      switch (e.keyCode) {
        case KEYCODE_SPACEBAR:
        case KEYCODE_ENTER:
          actions.increment();
          break;
        case KEYCODE_C:
          actions.setPage('clicker');
          break;
        case KEYCODE_V:
          actions.setPage('shop/systems');
          break;
        case KEYCODE_B:
          actions.setPage('shop/skills');
          break;
      }
    });
  },
  click: function (action, state) {
    var prevLen = state.events.length;
    state.events = state.events.filter(function (event) {
      return !(action.x >= event.x - 8 && action.y >= event.y - 8 && action.x < event.x + 8 && action.y < event.y + 8);
    });

    var clickedEvents = prevLen - state.events.length;
    if (clickedEvents > 0) {
      // prolong rainbow mode time by 5 seconds for every clicked event
      state.rainbowModeTicks += 5 * clickedEvents * config.ticksPerSecond;
    }

    actions.increment();
  },
  increment: function (action, state) {
    var income = (state.rainbowModeTicks > 0 ? 2 : 1) * (calculateShopIncome(shops.skills, state.inventory.skills) + 1);
    state.counter += income;

    state.particles.push(randomParticle(income, state.rainbowModeTicks > 0));
  },
  interval: function (action, state) {
    var income = calculateShopIncome(shops.systems, state.inventory.systems);
    state.counter += income * interval;
    state.ticks++;
    if (state.rainbowModeTicks > 0) {
      state.rainbowModeTicks--;
    }

    var secondHasPassed = state.ticks % config.ticksPerSecond === 0;
    var hasIncome = income !== 0;

    if (secondHasPassed && hasIncome) {
      state.particles.push(randomParticle(income, false));
    }

    // spawn event every ~ 15 sec
    if (secondHasPassed && Math.random() < 1 / 15) {
      state.events.push(randomEvent());
    }
  },
  setPage: function (action, state) {
    state.page = action.path;
  },
  buy: function (action, state) {
    var shop = shops[action.shopName];
    var item = shop.find(function (item) {
      return item.key === action.itemKey;
    });
    var alreadyBought = state.inventory[action.shopName][item.key];
    var cost = calculateItemCost(item, alreadyBought);

    if (cost > state.counter) {
      return;
    }
    state.counter -= cost;
    state.inventory[action.shopName][item.key]++;
  }
};

function randomParticle (value, rainbowMode) {
  return Particle(
    // position (in the upper half)
    20 + 260 * Math.random(), 20 + 130 * Math.random(),
    // initial velocity
    -15 + 30 * Math.random(), 15 + 30 * Math.random(),
    // acceleration
    0, 30 + 80 * Math.random(),
    'hsl(' + (360 * Math.random()) + ', 100%, 50%)',
    value,
    rainbowMode
  );
}

function randomEvent () {
  return Event(
    // position (in the upper half)
    20 + 260 * Math.random(), 20 + 130 * Math.random(),
    // initial velocity
    -15 + 30 * Math.random(), 15 + 30 * Math.random(),
    // acceleration
    0, 30 + 40 * Math.random()
  );
}
