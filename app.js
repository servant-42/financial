class App {
  constructor(localStorage, location, document, bs_modal) {
    // pass in dependencies, so the app can be isolated and tested
    this.el = document.createElement('div');
    this.localStorage = localStorage;
    this.location = location;
    this.document = document;
    this.bs_modal = bs_modal;

    // legacy pseudo-transaction from old spreadsheets (really just month summaries per category)
    let trn_json = this.localStorage.getItem('transactions');
    this.transactions = trn_json ? JSON.parse(trn_json) : [
      {"id": "1", "date": "2024-09-01", "amount": 109590, "splits": [{"category_id": 0, "amount": 109590}]},
      {"id": "2", "date": "2024-10-01", "amount": 174589, "splits": [{"category_id": 0, "amount": 174589}]},
      {"id": "3", "date": "2024-11-01", "amount": 114460, "splits": [{"category_id": 0, "amount": 114460}]},
      {"id": "4", "date": "2024-12-01", "amount": 164193, "splits": [{"category_id": 0, "amount": 164193}]},
      {"id": "5", "date": "2025-01-01", "amount": 294205, "splits": [{"category_id": 0, "amount": 294205}]},
      {"id": "6", "date": "2025-02-01", "amount": 211455, "splits": [{"category_id": 0, "amount": 211455}]},
      {"id": "7", "date": "2025-03-01", "amount": 214717, "splits": [{"category_id": 0, "amount": 214717}]},
      {"id": "8", "date": "2024-09-01", "amount": -3298, "splits": [{"category_id": 2, "amount": -3298}]},
      {"id": "9", "date": "2024-10-01", "amount": -0, "splits": [{"category_id": 2, "amount": -0}]},
      {"id": "10", "date": "2024-11-01", "amount": -7537, "splits": [{"category_id": 2, "amount": -7537}]},
      {"id": "11", "date": "2024-12-01", "amount": -3298, "splits": [{"category_id": 2, "amount": -3298}]},
      {"id": "12", "date": "2025-01-01", "amount": -7538, "splits": [{"category_id": 2, "amount": -7538}]},
      {"id": "13", "date": "2025-02-01", "amount": -1884, "splits": [{"category_id": 2, "amount": -1884}]},
      {"id": "14", "date": "2025-03-01", "amount": -4711, "splits": [{"category_id": 2, "amount": -4711}]},
      {"id": "15", "date": "2024-09-01", "amount": -0, "splits": [{"category_id": 3, "amount": -0}]},
      {"id": "16", "date": "2024-10-01", "amount": -92649, "splits": [{"category_id": 3, "amount": -92649}]},
      {"id": "17", "date": "2024-11-01", "amount": -142252, "splits": [{"category_id": 3, "amount": -142252}]},
      {"id": "18", "date": "2024-12-01", "amount": -75635, "splits": [{"category_id": 3, "amount": -75635}]},
      {"id": "19", "date": "2025-01-01", "amount": -55908, "splits": [{"category_id": 3, "amount": -55908}]},
      {"id": "20", "date": "2025-02-01", "amount": -129569, "splits": [{"category_id": 3, "amount": -129569}]},
      {"id": "21", "date": "2025-03-01", "amount": -74966, "splits": [{"category_id": 3, "amount": -74966}]},
      {"id": "22", "date": "2025-01-01", "amount": -2439, "splits": [{"category_id": 6, "amount": -2439}]},
      {"id": "23", "date": "2024-09-01", "amount": -20295, "splits": [{"category_id": 4, "amount": -20295}]},
      {"id": "24", "date": "2024-10-01", "amount": -34896, "splits": [{"category_id": 4, "amount": -34896}]},
      {"id": "25", "date": "2024-11-01", "amount": -37414, "splits": [{"category_id": 4, "amount": -37414}]},
      {"id": "26", "date": "2024-12-01", "amount": -7974, "splits": [{"category_id": 4, "amount": -7974}]},
      {"id": "27", "date": "2025-01-01", "amount": -37382, "splits": [{"category_id": 4, "amount": -37382}]},
      {"id": "28", "date": "2025-02-01", "amount": -41233, "splits": [{"category_id": 4, "amount": -41233}]},
      {"id": "29", "date": "2025-03-01", "amount": -28853, "splits": [{"category_id": 4, "amount": -28853}]},
      {"id": "30", "date": "2024-10-01", "amount": -1141, "splits": [{"category_id": 5, "amount": -1141}]},
      {"id": "31", "date": "2025-01-01", "amount": -28031, "splits": [{"category_id": 5, "amount": -28031}]},
      {"id": "32", "date": "2024-09-01", "amount": -11728, "splits": [{"category_id": 1, "amount": -11728}]},
      {"id": "33", "date": "2024-10-01", "amount": -11728, "splits": [{"category_id": 1, "amount": -11728}]},
      {"id": "34", "date": "2024-11-01", "amount": -11728, "splits": [{"category_id": 1, "amount": -11728}]},
      {"id": "35", "date": "2024-12-01", "amount": -11728, "splits": [{"category_id": 1, "amount": -11728}]},
      {"id": "36", "date": "2025-01-01", "amount": -11728, "splits": [{"category_id": 1, "amount": -11728}]},
      {"id": "37", "date": "2025-02-01", "amount": -11728, "splits": [{"category_id": 1, "amount": -11728}]},
      {"id": "38", "date": "2025-03-01", "amount": -11478, "splits": [{"category_id": 1, "amount": -11478}]},
    ];

    this.legacy_trn_splits = {
      "00002061470000036100": [{"category_id": 2, "amount": -3123}, {"category_id": 3, "amount": -74000}],
      "00002073640000034703": [{"category_id": 2, "amount": -3513}, {"category_id": 3, "amount": -109322}],
      "00002095980000039276": [{"category_id": 2, "amount": -3904}, {"category_id": 3, "amount": -105164}],
      "00002085410000035679": [{"category_id": 2, "amount": -781}, {"category_id": 3, "amount": -99858}],
      "00002073640000034702": [{"category_id": 2, "amount": -725}, {"category_id": 3, "amount": -21277}],
      "00002061470000036099": [{"category_id": 2, "amount": -644}, {"category_id": 3, "amount": -14405}],
      "00002062530000035450": [{"category_id": 3, "amount": 80}],
      "00002095980000039275": [{"category_id": 2, "amount": -806}, {"category_id": 3, "amount": -20471}],
      "00002085410000035678": [{"category_id": 2, "amount": -161}, {"category_id": 3, "amount": -19436}],
    };

    this.el.innerHTML = `
      <div id="filedrag" style="font-weight: bold; text-align: center; padding: 1em 0; margin: 1em 0; color: #555; border: 2px dashed #555; border-radius: 7px; cursor: default">
        Drop .OFX or .QFX file here
      </div>`;

    delegateEvents({
      'dragover #filedrag': this.fileDragHover,
      'dragleave #filedrag': this.fileDragHover,
      'drop #filedrag': this.fileSelectHandler,
    }, this);

    this.start_balance_cents = 986673;
    this.legacy_cutoff = '2025-04';

    this.month_names = {'09': 'September', '10': 'October', '11': 'November', '12': 'December', '01': 'January', '02': 'February', '03': 'March', '04': 'April', '05': 'May', '06': 'June', '07': 'July', '08': 'August'};

    this.categories = [
      {id: 0, name: 'Regular Giving', type: 'income'},
      {id: 9, name: 'One-Time Giving', type: 'income'},
      {id: -1, name: '[Uncategorized]', type: 'expense'},
      {id: 2, name: 'Bookkeeper', type: 'expense'},
      {id: 3, name: 'Director', type: 'expense'},
      {id: 10, name: 'Associate Director', type: 'expense'},
      {id: 6, name: 'Events', type: 'expense'},
      {id: 4, name: 'Food', type: 'expense'},
      {id: 5, name: 'Newsletter', type: 'expense'},
      {id: 1, name: 'Online Services', type: 'expense'},
      {id: 7, name: 'Promotional', type: 'expense'},
      {id: 8, name: 'Training & Materials', type: 'expense'},
    ];

    this.auto_cat_rules = [
      {pattern: "BANKCARD 1161 MTOT", category_id: 0},
      {pattern: "DEPOSIT BRANCH 0362", category_id: 0},
      {pattern: "INTEREST PAYMENT", category_id: 0},
      {pattern: "RELIAFUND INC DEPOSIT", category_id: 0},
      {pattern: "GIVING FIRE ACH FEES", category_id: 1},
      {pattern: "GOOGLE *GSUITE", category_id: 1},
      {pattern: "GOOGLE GSUITE", category_id: 1},
      {pattern: "GOOGLE WORKSPACE", category_id: 1},
      {pattern: "GUSTO FEE", category_id: 1},
      {pattern: "GUSTO TLR", category_id: 1},
      {pattern: "QUICKEN INC", category_id: 1},
      {pattern: "BHAM TECH FOOD SERVICE", category_id: 4},
      {pattern: "HANA TERIYAKI", category_id: 4},
      {pattern: "MAC FOOD PAVI", category_id: 4},
      {pattern: "PAPA JOHN", category_id: 4},
      {pattern: "SAFEWAY", category_id: 4},
      {pattern: "SUBWAY", category_id: 4},
      {pattern: "TACO TIME", category_id: 4},
      {pattern: "MI RANCHO", category_id: 4},
      {pattern: "COSTCO WHSE", category_id: 4},
      {pattern: "PANDA EXPRESS", category_id: 4},
      {pattern: "TIMEKEEPERS", category_id: 5},
      {pattern: "USPS PO", category_id: 5},
    ];
  }

  onHashChange() {
    this.navigate();
  }

  navigate() {
    if (this.view)
      this.view.remove();
    let hash = this.location.hash.replace(/^#/, '');
    if (/^\d\d\d\d-\d\d$/.test(hash)) {
      this.view = new MonthView(this, hash);
    }
    else if (/^\d\d\d\d$/.test(hash)) {
      this.view = new YearView(this, parseInt(hash));
    }
    else {
      let start_year = new Date().getFullYear();
      let SEPT = 8; // JS months are 0-based
      if (new Date().getMonth() < SEPT)
        start_year--;
      this.view = new YearView(this, start_year);
    }
    this.el.insertBefore(this.view.el, this.el.firstChild);
  }

  // file drag hover
  fileDragHover(e) {
    e.stopPropagation();
    e.preventDefault();
    e.target.className = (e.type == "dragover" ? "hover" : "");
  }

  fileSelectHandler(e) {
    // cancel event and hover styling
    this.fileDragHover(e);

    // fetch FileList object
    let file = (e.target.files || e.dataTransfer.files)[0];

    console.log('file dropped:', file.name, file.type, file.size);
    let reader = new FileReader();
    reader.onload = this.onFileLoad.bind(null, reader, file);
    reader.readAsText(file);
  }

  async onFileLoad(reader, file, e) {
    let text = reader.result;

    if (!/\.[OQ]FX/i.test(file.name))
      return alert(`File name "${file.name}" does not end in .OFX or .QFX`);

    let new_transactions = parseOFXQFX(text);

    // don't import anything before the legacy cutoff (April 2025)
    // since these are in the legacy summary data
    new_transactions = new_transactions.filter(trn => trn.date >= this.legacy_cutoff);

    // build index of preexisting transactions
    let idx = {};
    for (let trn of this.transactions)
      idx[trn.id] = trn;

    // iterate new transactions & add ones that aren't preexisting
    let add_trns = [];
    for (let new_trn of new_transactions) {
      let old_trn = idx[new_trn.id];
      if (old_trn) {
        if (old_trn.date != new_trn.date || old_trn.amount != new_trn.amount || old_trn.description != new_trn.description)
          console.warning(`Did not import updated transaction date/amount/description (${new_trn.id}): ${new_trn.date} / ${new_trn.amount} / ${new_trn.description}`);
      }
      else {
        this.transactions.push(new_trn);
        add_trns.push(new_trn);
      }
    }

    this.transactions.sort((a, b) => a.date == b.date ? 0 : (a.date < b.date ? -1 : 1));
    
    for (let trn of add_trns) {
      if (trn.id in this.legacy_trn_splits) {
        trn.splits = this.legacy_trn_splits[trn.id];
      }
      else {
        // the first rule that matches is the one that "wins"
        for (let rule of this.auto_cat_rules) {
          if (trn.description.toUpperCase().includes(rule.pattern)) {
            trn.splits = [{category_id: rule.category_id, amount: trn.amount}];
            break;
          }
        }
      }
    }

    this.saveTransactions();

    this.navigate();
    return;
  };

  saveTransactions() {
    this.localStorage.setItem('transactions', JSON.stringify(this.transactions, null, 2));
  }

  renderCatDropdown(curr_cat, split_ix, trn_id) {
    let prev_cat = null;
    return `<ul class="dropdown-menu">
      ${this.categories.map(cat => {
        // track the difference in category types, to inject divider
        let html = prev_cat && prev_cat.type != cat.type ? '<li><hr class="dropdown-divider"></li>' : '';
        prev_cat = cat;

        return html + `<li>
          <a class="dropdown-item cat ${cat == curr_cat ? 'active' : ''}" href="${this.location.hash}" data-cat-id="${cat.id}" data-trn-id="${trn_id}", data-split-ix="${split_ix}">
            ${cat.name}
          </a></li>`;
      }).join('')}
    </ul>`;
  }

  $(sel) {
    return this.el.querySelector(sel);
  }

  $$(sel) {
    return this.el.querySelectorAll(sel);
  }
}


// pure helper functions / utils

let currency_re = /^-?\d+(\.\d\d)?$/;

// like Backbone's delegateEvents()
function delegateEvents(events, view) {
  let handlers_by_evt = {};
  for (let key in events) {
    let space_ix = key.indexOf(' ');
    let evt_name = space_ix > -1 ? key.slice(0, space_ix) : key;
    if (!(evt_name in handlers_by_evt))
      handlers_by_evt[evt_name] = {};

    let handlers_by_sel = handlers_by_evt[evt_name];
    let sel = space_ix > -1 ? key.slice(space_ix + 1) : '*';
    if (sel in handlers_by_sel)
      throw new Error(`multiple event handlers for identical event/selector: ${key}`);
    handlers_by_evt[evt_name][sel] = events[key];
  }

  for (let evt_name in handlers_by_evt) {
    let handlers_by_sel = handlers_by_evt[evt_name];
    view.el.addEventListener(evt_name, function(evt) {
      for (let sel in handlers_by_sel) {
        let node = evt.target;
        while (node && node.matches && !node.matches(sel))
          node = node.parentNode;

        if (node && node.matches) {
          handlers_by_sel[sel].call(view, evt, node);
          break;
        }
      }
    });
  }
}

// sample OFX files available at https://github.com/wesabe/fixofx/tree/master/test/fixtures
// QFX is a quicken-specific extension that adds stuff, but we should only be relying on core tags/attributes
function parseOFXQFX(text) {
  let transactions = [];

  let parser = sax.parser(false);
  let curr_tag = '';
  let curr_trans = null;

  parser.onerror = function (e) {
    console.error(e);
  };
  parser.ontext = function (t) {
    t = t.trim();
    if (t && curr_trans) {
      if (curr_tag == 'TRNTYPE')
        curr_trans.type = t.toLowerCase();
      else if (curr_tag == 'DTPOSTED')
        curr_trans.date = `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
      else if (curr_tag == 'TRNAMT')
        curr_trans.amount = Math.round(parseFloat(t) * 100);
      else if (curr_tag == 'FITID')
        curr_trans.id = t;
      else if (curr_tag == 'NAME')
        curr_trans.description = t;
    }
  };
  parser.onopentag = function (node) {
    curr_tag = node.name;
    if (curr_tag == 'STMTTRN') {
      if (curr_trans)
        throw new Error('<SMTMTRN opened without previous one closing');
      curr_trans = {};
    }
  };
  parser.onclosetag = function (tag_name) {
    if (tag_name == 'STMTTRN') {
      // ensure every record has a category; default to -1 (uncategorized)
      curr_trans.splits = [{category_id: -1, amount: curr_trans.amount}];
      transactions.push(curr_trans);
      curr_trans = null;
    }
  };

  parser.write(text).close();
  if (curr_trans)
    throw new Error('final <SMTMTRN not closed');

  console.log(transactions);
  return transactions;
}

function getYear(dt_str) {
  return dt_str.slice(0, 4);
}

function getYearMonth(dt_str) {
  return dt_str.slice(0, 7);
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function toUSDate(iso_date) {
  let date_parts = iso_date.split('-');
  return `${date_parts[1]}/${date_parts[2]}/${date_parts[0]}`;
}

function filterRecords(records, filters) {
  if (filters.month)
    records = records.filter(r => getYearMonth(r.date) == filters.month);
  
  let filtered_records;
  // can't check if (filters.category_id) since 0 is a valid category_id
  if ('category_id' in filters) {
    filtered_records = [];
    for (let record of records) {
      let ix = 0;
      for (let item of record.splits) {
        if (item.category_id == filters.category_id)
          filtered_records.push({...item, id: record.id, description: record.description, date: record.date, split: record.splits.length > 1, ix, orig_trn: record});
        ix++;
      }
    }
  }
  else {
    filtered_records = records;
  }

  return filtered_records;
}

function areSplitsValid(record) {
  let trn = record.orig_trn || record;

  return sumAmounts(trn.splits) == trn.amount;
}

function sumAmounts(records) {
  let total = 0;
  for (let record of records)
    total += record.amount;
  
  return total;
}

function displayCents(cents) {
  if (!cents)
    return '';
  let val = cents / 100;
  let str = val.toFixed(2);
  if (val >= 1000)
    str = `${str.slice(0, -6)},${str.slice(-6)}`;
  return str;
}

function assert(val) {
  if (!val)
    throw new Error(`Assertion failed`);
}
