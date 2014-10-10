'use strict';

var assert = require('assert');

var TodoDriver = require('./todo-driver');
var locators = require('./make-locators')(require('./locators.json'));

var port = process.env.NODE_TEST_PORT || 8002;

var screenshotFolder = 'outputscreenshot';

before(function(done) {
  require('./server')(__dirname + '/..', port, done);
  var fs = require('fs');

  if (!fs.existsSync(screenshotFolder)) {
    fs.mkdir(screenshotFolder);
  }
  this.todoDriver = new TodoDriver();
});

beforeEach(function() {
  this.timeout(10 * 1000);
  return this.todoDriver.start('http://localhost:' + port);
});

afterEach(function() {
  var test = this.currentTest;
  var safeName, fileName;
  if (test.state === 'passed') {
    //return;
  }
  safeName = test.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  fileName = screenshotFolder + '/' + safeName + (new Date()).toISOString() + '.png';
  this.todoDriver.takeScreenshot(fileName);
  return this.todoDriver.quit();
});

it('visits the web application', function() {
  return this.todoDriver.getTitle().then(function(title) {
    assert.equal(title, 'VanillaJS • TodoMVC');
  });
});
describe('item creation', function() {
  beforeEach(function() {
    return this.todoDriver.create('order new SSD');
  });

  it('appends new list items to Todo list', function() {
    return this.todoDriver.readItems(0).then(function(text) {
      assert.equal(text, 'order new SSD');
    });
  });
  it('appends new list items to Todo list', function() {
    var todoDriver = this.todoDriver;

    return this.todoDriver.create('this is a new one')
      .then(function() {
        return todoDriver.readItems(1);
      }).then(function(text) {
        assert.equal(text, 'this is a new one');
      });
  });
  it('updates the "Remaining Items" counter', function() {
    return this.todoDriver.readText(locators.todoCount)
      .then(function(text) {
        var remainingRe = /(\d+)/;
        var match = text.match(remainingRe);
        assert(match, '"Remining Items" contains a number');
        assert.equal(match[1], '1');
      });

  });
});
describe('item deletion', function() {
  beforeEach(function() {
    var todoDriver = this.todoDriver;

    return this.todoDriver.create('order new SSD')
      .then(function() {
        return todoDriver.delete(0);
      });
  });
  it('removes list item from Todo list', function() {
    return this.todoDriver.countItems()
      .then(function(itemCount) {
        assert.equal(itemCount, 0);
      });
  });

  it('hides the "Remaining Items" counter when no items remain', function() {
    return this.todoDriver.userCanSee(locators.todoCount)
      .then(function(userCanSee) {
        assert(!userCanSee);
      });
  });
});
describe('item modification', function() {
  beforeEach(function() {
    return this.todoDriver.create('order new SSD');
  });
  it('supports task name modification', function() {
    return this.todoDriver.edit(0, '...now')
      .then(function(text) {
        assert.equal(text, 'order new SSD...now');
      });
  });
});

describe('congrats', function() {
  beforeEach(function() {
    var todoDriver = this.todoDriver;
    return todoDriver.create('first').then(function() {
      return todoDriver.create('second');
    }).then(function() {
      return todoDriver.create('third');
    }).then(function() {
      return todoDriver.complete(2);
    }).then(function() {
      return todoDriver.complete(0);
    }).then(function() {
      return todoDriver.isCongratulating();
    }).then(function(isCongratulating) {
      assert.equal(isCongratulating, false);
    });
  });
  it('should congratulate user when they complete last item', function() {
    var todoDriver = this.todoDriver;
    return todoDriver.complete(1).then(function() {
      return todoDriver.isCongratulating();
    }).then(function(isCongratulating) {
      assert(isCongratulating);
    });
  });
  it('should congratulate user when they remove the last item', function() {
    var todoDriver = this.todoDriver;
    return todoDriver.delete(1).then(function() {
      return todoDriver.isCongratulating();
    }).then(function(isCongratulating) {
      assert(isCongratulating);
    });
  });
});
