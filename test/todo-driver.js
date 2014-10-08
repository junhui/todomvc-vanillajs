'use strict';
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('selenium-chromedriver');
var locators = require('./make-locators')(require('./locators.json'));

function TodoDriver() {
  chrome.setDefaultService(
    new chrome.ServiceBuilder(chromeDriver.path).build()
  );
}

module.exports = TodoDriver;

TodoDriver.prototype.start = function(url){
 this.seleniumDriver = new webdriver.Builder()
    .withCapabilities(webdriver.Capabilities.chrome())
    .build();
  return this.seleniumDriver.get(url);
};
TodoDriver.prototype.quit = function(){
  return this.seleniumDriver.quit();
};
TodoDriver.prototype.getTitle = function() {
  return this.seleniumDriver.getTitle();
};
TodoDriver.prototype.create = function(title) {
  var seleniumDriver = this.seleniumDriver;
  return this.seleniumDriver.findElement(locators.todoItem.input)
    .then(function(el) {
      return el.sendKeys(title, webdriver.Key.ENTER);
    }).then(function() {
      return seleniumDriver.wait(function() {
        return seleniumDriver.findElement(locators.todoItem.input)
          .then(function(el) {
            return el.getText();
          }).then(function(text) {
            return text === '';
          });
      });
    });

};
TodoDriver.prototype.readText = function(locator) {
  return this.seleniumDriver.findElement(locator)
    .then(function(el) {
      return el.getText();
    });
};
TodoDriver.prototype.readItems = function(index) {
  var seleniumDriver = this.seleniumDriver;
  return seleniumDriver.findElements(locators.todoItem.label)
    .then(function(els) {
      return els[index].getText();
    });
};
TodoDriver.prototype.edit = function(index, append) {
  var seleniumDriver = this.seleniumDriver;
  var todoDriver = this;
  return seleniumDriver.findElements(locators.todoItem.label)
    .then(function(els) {
      return seleniumDriver.actions()
        .doubleClick(els[index])
        .sendKeys(append, webdriver.Key.ENTER)
        .perform();
    }).then(function() {
      return seleniumDriver.wait(function() {
        return todoDriver.userCanSee(locators.todoItem.editInput)
          .then(function(userCanSee) {
            return !userCanSee;
          });
      });
    }).then(function() {
      return seleniumDriver.findElements(locators.todoItem.label);
    })
    .then(function(els) {
      return els[index].getText();
    });
};
TodoDriver.prototype.delete = function(index) {
  var seleniumDriver = this.seleniumDriver;
  var todoDriver = this;
  var initElementCount;
  return seleniumDriver.findElements(locators.todoItem.label)
    .then(function(els) {
      return seleniumDriver.actions()
        .mouseMove(els[index])
        .perform();
    }).then(function() {
      return seleniumDriver.wait(function() {
        return seleniumDriver.findElements(locators.destroy)
          .then(function(els) {
            return els[index].isDisplayed();
          });
      });
    }).then(function() {
      return seleniumDriver.findElements(locators.destroy);
    }).then(function(els) {
      initElementCount = els.length;
      return els[index].click();
    }).then(function() {
      return seleniumDriver.wait(function() {
        return todoDriver.countItems().then(function(count) {
          return count < initElementCount;
        });
      });
    });

};
TodoDriver.prototype.countItems = function() {
  return this.seleniumDriver.findElements(locators.todoItem.label)
    .then(function(els) {
      return els.length;
    });
};
TodoDriver.prototype.complete = function(index) {
  var seleniumDriver = this.seleniumDriver;
  var todoDriver = this;
  return this.seleniumDriver.findElements(locators.todoItem.toggle)
    .then(function(els) {
      return els[index].click();
    }).then(function() {
      return seleniumDriver.wait(function() {
        return seleniumDriver.findElements(locators.todoItem.container)
          .then(function(items) {
            return todoDriver._hasClass(items[index], 'completed');
          });
      });
    });
};

TodoDriver.prototype._hasClass = function(el, query) {
  return el.getAttribute('className')
    .then(function(className) {
      return className.split(' ').indexOf(query) > -1;
    });
};
TodoDriver.prototype.isCongratulating = function() {
  var todoDriver = this;
  return this.seleniumDriver.findElement(locators.todoList)
    .then(function(el) {
      return todoDriver._hasClass(el, 'congrats');
    });
};
TodoDriver.prototype.userCanSee = function(locator) {
  return this.seleniumDriver.userCanSee(locator);
};

webdriver.WebDriver.prototype.userCanSee = function(locator) {
  var seleniumDriver = this;
  return this.isElementPresent(locator)
    .then(function(isPresent) {
      if (isPresent === false) {
        return false;
      }
      return seleniumDriver.findElement(locator)
        .then(function(el) {
          return el.isDisplayed();
        });
    });
};
