class YearView {
  constructor(app, year_1) {
    this.app = app;
    this.el = app.document.createElement('div');
    this.el.id = 'report';

    // get the bounds of the data, so we know what prev/next links we can provide
    // TODO: make these global so we don't need to walk them all the time?
    let todays_date = toISODate(new Date());
    let earliest_date = app.transactions[0]?.date || todays_date;
    let latest_date = app.transactions[0]?.date || todays_date;
    for (let trn of app.transactions) {
      if (trn.date < earliest_date)
        earliest_date = trn.date;
      else if (trn.date > latest_date)
        latest_date = trn.date;
    }

    let year_2 = year_1 + 1;
    let months = [`${year_1}-09`, `${year_1}-10`, `${year_1}-11`, `${year_1}-12`, `${year_2}-01`, `${year_2}-02`, `${year_2}-03`, `${year_2}-04`, `${year_2}-05`, `${year_2}-06`, `${year_2}-07`, `${year_2}-08`];
    let year_records = app.transactions.filter(r => months.includes(getYearMonth(r.date)));

    // pre-calculate all relevant categories
    let category_ids = [];
    for (let record of year_records)
      for (let item of record.splits)
        if (!category_ids.includes(item.category_id))
          category_ids.push(item.category_id);

    let cats = app.categories.filter(cat => category_ids.includes(cat.id));

    // heading
    app.document.title = `${year_1}-${year_2} Annual Overview`;
    let html = `<h3>${app.document.title}`;

    if (earliest_date < months[0] || latest_date.slice(0, 7) > months[11]) {
      html += '<div class="btn-group" role="group" aria-label="year navigation buttons" style="margin-left: 1rem">';
      if (earliest_date < months[0])
        html += `<a href="#${year_1 - 1}" class="btn btn-outline-secondary">← Previous Year</button>`;
      if (latest_date.slice(0, 7) > months[11])
        html += `<a href="#${year_1 + 1}" class="btn btn-outline-secondary">Next Year →</button>`;
      html += '</div>';
    }
    html += '</h3>';

    // build table
    html += '<table>';
    // display column headers at the top of the table
    html += '<tr>';
    html += '<th></th>'; // empty cell in the top-left corner
    for (let month of months) {
      let month_name = app.month_names[month.slice(-2)];
      html += `<th><b>${month >= app.legacy_cutoff ? `<a href="#${month}" class="month">${month_name}</a>` : month_name}</b></th>`;
    }
    html += '</tr>';

    let totals = {income: {}, expense: {}};
    for (let cat_type of ['income', 'expense']) {
      html += `<tr><th class="sidebar"><u>${capitalize(cat_type)}</u></th></tr>`;
      for (let cat of cats.filter(cat => cat.type == cat_type)) {
        html += `<tr><th class="category">${cat.name}</th>`;
        for (let month of months) {
          let records = filterRecords(year_records, {month, category_id: cat.id});
          let are_valid = records.every(trn => areSplitsValid(trn));
          let cents = sumAmounts(records);
          if (cat.type == 'expense')
            cents = -cents;

          if (!totals[cat_type][month])
            totals[cat_type][month] = 0;
          totals[cat_type][month] += cents;
          html += `<td class="amt ${are_valid ? '' : 'invalid'}">${displayCents(cents)}</td>`;
        }
        html += '</tr>';
      }

      html += '<tr><th class="sidebar">Total</th>';
      for (let month of months) {
        html += `<td class="amt"><b>${displayCents(totals[cat_type][month])}</b></td>`;
      }
      html += '</tr>';
      html += '<tr><th class="separator"></th></tr>';
    }

    html += '<tr><th class="sidebar">Profit / Loss</th>';
    for (let month of months) {
      html += `<td class="amt"><b>${displayCents(totals.income[month] - totals.expense[month])}</b></td>`;
    }
    html += '</tr>';

    html += '<tr><th class="separator"></th></tr>';

    html += '<tr><th class="sidebar">Balance</th>';
    let balance_cents = app.start_balance_cents;
    for (let month of months) {
      if (totals.income[month] || totals.expense[month]) {
        balance_cents += totals.income[month] - totals.expense[month];
        html += `<td class="amt"><b>${displayCents(balance_cents)}</b></td>`;
      }
      else {
        // empty balance cell for months that aren't populated with income/expenses yet
        html += `<td class="amt"></td>`;
      }
    }
    html += '</tr>';
    
    html += '</table>';
    this.el.innerHTML = html;
  }

  remove() {
    this.el.remove();
  }
}