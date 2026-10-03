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
    this.transactions = trn_json ? JSON.parse(trn_json) : [];

    let non_recurring = [
      'SAFEWAY FUEL',
      'SUPER 1 FOODS',
      'COSTCO GAS',
      'MICHAELS',
      'CTCMATH PENNANT',
      'PAOLA BROWN',
      'PANHANDLE CONE',
      'TRADER JOE',
      'CHEFSTORE',
      'AMAZON MKTPL',
      'AMAZON.COM',
      'COSTCO WHSE',
      'THE LONG EAR',
      'POSTAL ANNEX',
      'CICCARELLI',
      'QUEST DIAGNOSTICS',
      'UNION ROASTERS',
      'UNION COFFEE',
      'FRED-MEYER',
      'HALLMARK',
      'STAPLES',
      'CAFE RIO',
      'LOWES',
      'ALL OF LIFE CHURCH',
      'ROSS STORES',
      'ROGERS',
      'XBOX',
      'METRO EXPRESS CAR WASH',
      'COSTCO GAS',
      'CYT NORTH IDAHO',
      'NESPRESSO',
      'TARGET',
      'DROPBOX',
      'WESTSIDE',
      'NATURAL GROCERS',
      'DRINK LMNT',
      'CRAFTED TAP HOUSE',
      'TOP THIS',
      'ROCHELLE@CDA HAIR',
      'GROUNDED SAGE',
      'DOMA CAFE',
      'AMWAY',
      'PRIMALLY PURE',
      'WALMART',
      'APPLE.COM/BILL',
      'PRIME VIDEO',
      'APPLEBEES',
      'SPRINGDASH',
      'CULTURA',
      'CLEARLY FILTERED',
      'PETCO',
      'EXTREMEGRILLED',
      'STONEMAIER',
      'BOOKS & COMPANY',
      'ZAPPOS',
      'PEACOCK',
      'AMAZON RETA',
      'DIRECTNIC',
      'MOSHLIFE',
      'KINDLE',
      'INLAND MAMA',
      'VITACOST',
      'KOOTENAI COUNTY',
      'GOVPROS',
      'TERRE COFFEE',
    ].map(pattern => ({pattern, category_id: 2}));

    let recurring = [
      'GOOGLE WORKSPACE',
      'STORAGE STAR',
      'JEMS.ORG',
      'AUDIBLE',
      'CITY OF COEUR D',
      'DP SERVICE FEE UTILITY',
      'NETFLIX',
      'TITHE.LY',
      'MSI INSURANCE',
      'SPOTIFY',
      'AG NATIONAL OFFICE',
      'CAMPUS SALT',
      'COMPASSION',
      'DISNEY PLUS',
      'LOOPMASTERS',
      'SWITCHFOOT',
      'COVENANT EYES',
      'TRACFONE',
    ].map(pattern => ({pattern, category_id: 1}));

    let house = [
      'TAM\'S TRAVELING TO',
      'KOOTENAI ELECTRIC',
    ].map(pattern => ({pattern, category_id: 3}));

    this.auto_cat_rules = non_recurring.concat(recurring, house);

    // TEMP! this will blow away user's categorization work
    // ONLY do this temporarily to test new auto-cat rules
    this.autoCategorize(this.transactions);

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
      {id: 0, name: 'Income', type: 'income'},
      {id: -1, name: '[Uncategorized]', type: 'expense'},
      {id: 1, name: 'Recurring', type: 'expense'},
      {id: 2, name: 'Non-recurring', type: 'expense'},
      {id: 3, name: 'House', type: 'expense'},
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
    reader.onload = this.onFileLoad.bind(this, reader, file);
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
        let date_changed = old_trn.date != new_trn.date;
        let amt_changed = old_trn.amount != new_trn.amount;
        let desc_changed = old_trn.description != new_trn.description;
        if (date_changed || amt_changed || desc_changed) {
          console.warn(`Did not import updated transaction ${date_changed ? `date ("${old_trn.date}"->"${new_trn.date}"), ` : ''}${amt_changed ? `amount ("${old_trn.amount}"->"${new_trn.amount}"), ` : ''}${desc_changed ? `description ("${old_trn.description}"->"${new_trn.description}")` : ''}`);
        }
      }
      else {
        this.transactions.push(new_trn);
        add_trns.push(new_trn);
      }
    }

    this.transactions.sort((a, b) => a.date == b.date ? 0 : (a.date < b.date ? -1 : 1));

    // ONLY auto-categorize added transactions
    // because it can blow away user's previous categorization work
    this.autoCategorize(add_trns);

    this.saveTransactions();

    this.navigate();
    return;
  };

  autoCategorize(trns) {
    for (let trn of trns) {
      // the first rule that matches is the one that "wins"
      for (let rule of this.auto_cat_rules) {
        if (trn.description.toUpperCase().includes(rule.pattern)) {
          trn.splits = [{category_id: rule.category_id, amount: trn.amount}];
          break;
        }
      }
    }
  }

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

function toISODate(dt) {
  return [dt.getFullYear(), pad2(dt.getMonth()+1), pad2(dt.getDate())].join('-');
}

function pad2(n) {
  if (n < 10)
    return `0${n}`;
  else
    return n;
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
