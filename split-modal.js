class SplitModal {
  constructor(app, trn, splits) {
    this.app = app;
    this.el = app.document.createElement('div');
    this.el.className = 'modal fade';
    this.el.id = 'split_modal';
    this.el.setAttribute('tabindex', '-1');
    this.el.setAttribute('aria-hidden', 'true');

    this.el.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 id="split_modal_title" class="modal-title fs-5">Modal title</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div id="split_modal_body" class="modal-body">
            ...
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" id="split_modal_submit" class="btn btn-primary save">Save changes</button>
          </div>
        </div>
      </div>`;

    this.trn = trn; // live ref to transaction being edited
    this.splits = splits; // deep clone, so splits can be thrown away on 'cancel'

    // TODO: split event handlers based on report vs #split_modal
    delegateEvents({
      'input #split_modal_body': this.onInput,
      'click button.save': this.onSave,
      'click #split_modal a.cat': this.onSplitCategoryClick,
      'click #split_modal button.add': this.onSplitAdd,
      'click #split_modal button.del': this.onSplitDel,
    }, this);

    this.renderSplitModal();
  }

  // recalc total and update total validation
  onInput(evt) {
    let split_ix = evt.target.dataset.splitIx;
    if (currency_re.test(evt.target.value)) {
      let val = parseFloat(evt.target.value);
      this.splits[split_ix].amount = Math.round(val * 100);
    }
    this.validateSplitModal();
  }

  renderSplitModal() {
    this.$('#split_modal_title').innerText = `${this.trn.description} (${toUSDate(this.trn.date)})`;

    let splits_sum = sumAmounts(this.splits);
    let html = `
      <form class="was-validated">
        ${this.splits.map((split, split_ix) => {
          let cat = this.app.categories.find(cat => cat.id == split.category_id);
          return `<div class="input-group mb-3">
            <span class="input-group-text">$</span>
            <input type="text" class="form-control amount" inputmode="numeric" data-split-ix="${split_ix}" pattern="${currency_re.source}" value="${displayCents(split.amount)}">
            <button type="button" class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">${cat.name}</button>
            ${this.app.renderCatDropdown(cat, split_ix)}
            <button type="button" class="btn btn-outline-danger del" data-split-ix="${split_ix}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
              </svg>
            </button>
          </div>`
        }).join('')}
          <div class="mb-3 text-end">
            <button type="button" class="btn btn-success add">
              <svg class="bi" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-circle-fill" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/>
              </svg>
              Add Split
            </button>
          </div>
          <div class="mb-3">
            <label for="split_modal_total" class="col-form-label">Total</label>
            <div class="input-group">
              <span class="input-group-text">$</span>
              <input type="text" id="split_modal_total" class="form-control" aria-describedby="total_help_inline" value="${displayCents(splits_sum)}" disabled readonly>
              <div id="total_help_inline" class="form-text invalid-feedback text-start">
                Must total ${displayCents(this.trn.amount)}
              </div>
            </div>
          </div>
        </div>
      </form>`;
    this.$('#split_modal_body').innerHTML = html;
  }

  validateSplitModal() {
    let are_all_inputs_valid = true;
    let inputs = this.$('#split_modal_body').querySelectorAll('input.amount');
    for (let input of inputs) {
      if (!currency_re.test(input.value))
        are_all_inputs_valid = false;
    }

    let splits_sum = are_all_inputs_valid ? sumAmounts(this.splits) : Number.NaN;
    this.$('#split_modal_total').value = isNaN(splits_sum) ? '' : displayCents(splits_sum);
    if (splits_sum == this.trn.amount) {
      this.$('#split_modal_total').classList.remove('is-invalid');
      this.$('#split_modal_submit').removeAttribute('disabled');
    }
    else {
      this.$('#split_modal_total').classList.add('is-invalid');
      this.$('#split_modal_submit').setAttribute('disabled', 'disabled');
    }
  }

  onSplitCategoryClick(evt, curr_target) {
    let data = curr_target.dataset;
    this.splits[data.splitIx].category_id = parseInt(data.catId);
    this.renderSplitModal();
  }

  onSplitAdd() {
    this.splits.push({category_id: -1, amount: 0});
    this.renderSplitModal();
  }

  onSplitDel(evt, curr_target) {
    let data = curr_target.dataset;
    let ix = parseInt(data.splitIx);
    this.splits.splice(ix, 1);
    this.renderSplitModal();
    this.validateSplitModal();
  }

  onSave() {
    this.trn.splits = this.splits;
    this.app.saveTransactions();
    this.app.bs_modal.getInstance(this.el).hide();
    this.el.addEventListener('hidden.bs.modal', () => this.remove(), {once: true});
    this.app.navigate();
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