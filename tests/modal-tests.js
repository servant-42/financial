describe('split modal', function() {
  let modal, data, last_save_timestamp;
  let mock_storage = {
    getItem: function() {},
    setItem: function(key) {
      if (key == 'transactions')
        last_save_timestamp = Date.now();
    }
  };
  let mock_location = {hash: ''};
  let mock_document = {
    title: '',
    createElement: function(tag) {
      return document.createElement(tag);
    },
  };

  function mock_bs_modal() { };
  mock_bs_modal.getInstance = function() {
    return {show: function() {}, hide: function() {}};
  };
  let app = new App(mock_storage, mock_location, mock_document, mock_bs_modal);
  // for these test, stub out navigate
  app.navigate = function() {};

  it('should add splits', function() {
    setup({transactions: [{amount: 1234}]});
    $('button.add').click();
    assert.eachIncludes(modal.splits, [
      {amount: 1234},
      {amount: 0},
    ]);
    assert.eachIncludes($$('input.amount'), [
      {value: '12.34'},
      {value: ''},
    ]);
  });

  it('should remove first split', function() {
    setup({transactions: [{splits: [{amount: 1234}, {amount: 1111}]}]});
    $('button.del').click();
    assert.eachIncludes(modal.splits, [{amount: 1111}]);
    assert.eachIncludes($$('input.amount'), [{value: '11.11'}]);
  });

  it('should remove last split', function() {
    setup({transactions: [{splits: [{amount: 1234}, {amount: 1111}]}]});
    $$('button.del')[1].click();
    assert.eachIncludes(modal.splits, [{amount: 1234}]);
    assert.eachIncludes($$('input.amount'), [{value: '12.34'}]);
  });

  it('should disable save when splits do not add up', function() {
    setup({transactions: [{amount: 1234}]});
    $('button.add').click();
    type($$('input.amount')[1], '3.33');
    assert($('button.save').disabled);
  });

  it('should save changes when save is clicked', function() {
    let start = Date.now();
    setup({transactions: [{amount: 1234}]});
    $('button.add').click();
    type($('input.amount'), '12.00');
    type($$('input.amount')[1], '0.34');
    $('button.save').click();
    assert.eachIncludes(data.transactions, [
      {amount: 1234}
    ]);
    assert.eachIncludes(data.transactions[0].splits, [
      {amount: 1200},
      {amount: 34},
    ]);
    assert(last_save_timestamp > start);
  });

  function setup(passed_data) {
    data = passed_data;

    // fill out test transactions based on minimalist data
    let id = 1;
    let date = toISODate(new Date());
    for (let trn of data.transactions) {
      _.defaults(trn, {
        id: (id++).toString(),
        date,
        amount: trn.splits && sumAmounts(trn.splits),
        splits: [{amount: trn.amount}],
        description: '',
      });
      for (let split of trn.splits) {
        _.defaults(split, {
          category_id: -1,
        });
      }
    }
    app.transactions = data.transactions;
    
    let trn = app.transactions[0];
    modal = new SplitModal(app, trn, trn.splits);
  }

  function toISODate(dt) {
    return [dt.getFullYear(), pad2(dt.getMonth()+1), pad2(dt.getDate())].join('-');
  }

  function pad2(n) {
    if (n < 10)
      return `0${n}`;
    else
      return n;
  }

  function $(sel) {
    return modal.el.querySelector(sel);
  }

  function $$(sel) {
    let elements = modal.el.querySelectorAll(sel);
    return Array.from(elements);
  }

  // a small, opinionated subset of chai's assert() API, with a few additions
  function assert(val) {
    if (!val)
      throw new Error(`Assertion failed: expected ${toString(val)} to be truthy`);
  }

  assert.equal = function(actual, expected) {
    if (actual != expected)
      throw new Error(`Assertion failed: expected ${toString(actual)} to equal ${toString(expected)}`);
  };

  assert.include = function(haystack, needle) {
    if (typeof haystack == 'object') {
      assert.equal(typeof needle, 'object');
      let all_included = true;
      for (let key in needle)
        if (haystack[key] != needle[key])
          all_included = false;
      
      if (!all_included)
        throw new Error(`Assertion failed: expected ${toString(haystack)} to include ${toString(needle)}`);
    }
    else {
      throw new Error('Unimplemented: assert.include() for non-objects is not yet implemented');
    }
  };

  assert.eachIncludes = function(haystacks, needles) {
    assert.equal(haystacks.length, needles.length);
    for (let n = 0; n < haystacks.length; n++)
      assert.include(haystacks[n], needles[n]);
  };

  function toString(val) {
    if (typeof val == 'object' && val != null)
      return JSON.stringify(val, null, 2);
    else
      return val;
  }

  function type(sel_or_el, new_val) {
    let el = typeof sel_or_el == 'string' ? $(sel_or_el) : sel_or_el;
    el.value = new_val;
    el.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
  }
});
