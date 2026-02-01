class MonthView {
  constructor(app, month) {
    this.app = app;
    this.el = app.document.createElement('div');
    this.el.id = 'report';

    let trns = app.transactions.filter(t => t.date.startsWith(month));

    let category_ids = [];
    for (let t of trns) {
      for (let cat of t.splits) {
        if (!category_ids.includes(cat.category_id))
          category_ids.push(cat.category_id);
      }
    }
    let cats = app.categories.filter(cat => category_ids.includes(cat.id));

    app.document.title = `${month} Month Details`;
    let month_name = app.month_names[month.slice(-2)];
    let html = `<h3>${app.document.title}</h3>
      <p>${trns.length} transactions for the month of ${month_name}</p>`;

    html += `<div style="width: 75px"></div>
      <table class="table" style="table-layout: fixed; width: 100%">`;
      // html += '<tr><td style="width: 100px"></td><td style="width: 85px"></td><td class="action-btn" style="width: 200px"></td><td></td></tr>';
    html += '<colgroup><col style="width: 100px"><col style="width: 85px"><col class="action-btn"><col></col></colgroup>';
    for (let curr_cat of cats) {
      let records = filterRecords(trns, {month, category_id: curr_cat.id});
      let cents = sumAmounts(records);

      html += `<tr><th colspan="4">${curr_cat.name}: ${displayCents(cents)}</th></tr>`;
      html += records.map(function(record) {
        let is_valid = areSplitsValid(record);
        return `<tr>
          <td>${toUSDate(record.date)}</td>
          <td class="amt ${is_valid ? '' : 'invalid'}">${displayCents(record.amount)}</td>
          <td class="action-btn"><div style="display: inline-block" class="dropdown">
            <button type="button" class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              ${curr_cat.name}
            </button>
            ${app.renderCatDropdown(curr_cat, record.ix, record.id)}
            <span class="badge text-bg-${record.split ? 'danger' : 'secondary'} split ${record.split ? 'is-split' : ''}" data-trn-id="${record.id}">Split</span>
          </div></td>
          <td style="white-space: nowrap">${_.escape(record.description)}</td>
          </tr>`;
      }).join('\n');
    }
    html += '</table>';

    this.el.innerHTML = html;

    delegateEvents({
      'click #report a.cat': this.onCategoryClick,
      'click #report span.split': this.onSplitClick,
    }, this);
  }

  onCategoryClick(evt, curr_target) {
    let data = curr_target.dataset;
    let trn = this.app.transactions.find(trn => trn.id == data.trnId);
    trn.splits[data.splitIx].category_id = parseInt(data.catId);
    this.app.saveTransactions();
    this.app.navigate();
  }

  onSplitClick(evt, curr_target) {
    let data = curr_target.dataset;
    let trn = this.app.transactions.find(trn => trn.id == data.trnId);
    let splits = trn.splits.map(split => _.clone(split));
    let modal = new SplitModal(this.app, trn, splits);
    document.body.appendChild(modal.el);
    let bs_modal = this.app.bs_modal;
    new bs_modal(modal.el).show();
  }

  $(sel) {
    return this.el.querySelector(sel);
  }

  $$(sel) {
    return this.el.querySelectorAll(sel);
  }

  remove() {
    this.el.remove();
  }
}
