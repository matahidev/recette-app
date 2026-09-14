/* ---------- Persistance ---------- */
const STORAGE_KEY = 'recette-app-data-v1';

function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) ||
    'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

function loadDishes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Lecture impossible', e);
    return [];
  }
}

function saveDishes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes));
  } catch (e) {
    console.error('Sauvegarde impossible', e);
  }
}

let dishes = loadDishes();

function getDish(id) {
  return dishes.find(d => d.id === id);
}

/* ---------- Navigation (pile d'écrans, pas de vraie URL) ---------- */
let stack = [{ view: 'list' }];
let formState = null;      // { mode: 'new'|'edit', dish, ingredients:[], steps:[] }
let confirmState = null;   // { title, message, onConfirm }

function current() { return stack[stack.length - 1]; }
function goTo(view) { stack.push(view); render(); }
function goBack() { if (stack.length > 1) stack.pop(); render(); }
function resetTo(view) { stack = [view]; render(); }

/* ---------- Rendu principal ---------- */
const app = document.getElementById('app');

function render() {
  const view = current();
  let html = '';
  if (view.view === 'list') html = renderListScreen();
  else if (view.view === 'detail') html = renderDetailScreen(getDish(view.id));
  else if (view.view === 'shopping') html = renderShoppingScreen(getDish(view.id));
  else if (view.view === 'prep') html = renderPrepScreen(getDish(view.id));

  app.innerHTML = html;

  if (formState) renderFormOverlay();
  if (confirmState) renderConfirmOverlay();
}

/* ---------- Écran : liste des plats ---------- */
function renderListScreen() {
  if (dishes.length === 0) {
    return `
      <div class="screen">
        <h1 class="page-title">Mes plats</h1>
        <div class="empty-state">
          <div class="glyph">🍽️</div>
          <div class="serif">Aucun plat pour l'instant</div>
          <p>Appuie sur + pour ajouter ta première recette.</p>
        </div>
      </div>
      <button class="fab" data-action="new-dish" aria-label="Ajouter un plat">+</button>
    `;
  }

  const rows = dishes.map((d, i) => `
    <li>
      <button class="dish-row" data-action="open-dish" data-id="${d.id}">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="info">
          <div class="name">${escapeHtml(d.name)}</div>
          <div class="meta">
            <span>${d.ingredients.length} ingrédient${d.ingredients.length > 1 ? 's' : ''}</span>
            <span>${d.steps.length} étape${d.steps.length > 1 ? 's' : ''}</span>
          </div>
        </span>
        <span class="chevron">›</span>
      </button>
    </li>
  `).join('');

  return `
    <div class="screen">
      <h1 class="page-title">Mes plats</h1>
      <p class="page-sub">${dishes.length} plat${dishes.length > 1 ? 's' : ''} enregistré${dishes.length > 1 ? 's' : ''}</p>
      <ul class="dish-list">${rows}</ul>
    </div>
    <button class="fab" data-action="new-dish" aria-label="Ajouter un plat">+</button>
  `;
}

/* ---------- Écran : détail d'un plat ---------- */
function renderDetailScreen(dish) {
  if (!dish) return renderListScreen();

  return `
    <div class="screen">
      <div class="topbar">
        <button class="back" data-action="back">‹ Plats</button>
      </div>
      <h1 class="page-title">${escapeHtml(dish.name)}</h1>
      ${dish.description ? `<p class="dish-desc">${escapeHtml(dish.description)}</p>` : ''}

      <div class="option-list">
        <button class="option-panel shopping" data-action="open-shopping" data-id="${dish.id}">
          <span class="oi">🛒</span>
          <span class="ot">
            <h3>Liste de courses</h3>
            <p>${dish.ingredients.length} ingrédient${dish.ingredients.length > 1 ? 's' : ''}</p>
          </span>
        </button>
        <button class="option-panel prep" data-action="open-prep" data-id="${dish.id}">
          <span class="oi">📖</span>
          <span class="ot">
            <h3>Préparation</h3>
            <p>${dish.steps.length} étape${dish.steps.length > 1 ? 's' : ''}</p>
          </span>
        </button>
      </div>

      <div class="dish-actions">
        <button class="text-btn" data-action="edit-dish" data-id="${dish.id}">Modifier</button>
        <button class="text-btn danger" data-action="delete-dish" data-id="${dish.id}">Supprimer</button>
      </div>
    </div>
  `;
}

/* ---------- Écran : liste de courses ---------- */
function renderShoppingScreen(dish) {
  if (!dish) return renderListScreen();

  const rows = dish.ingredients.length === 0
    ? `<div class="empty-state"><p>Modifie le plat pour ajouter des ingrédients.</p></div>`
    : `<ul class="ingredient-list">${dish.ingredients.map(ing => `
        <li>
          <button class="ingredient-row ${ing.checked ? 'checked' : ''}" data-action="toggle-ingredient" data-dish="${dish.id}" data-ing="${ing.id}">
            <span class="checkbox">
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1 5L4.5 8.5L12 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
            <span class="itext">
              ${escapeHtml(ing.name)}
              ${ing.quantity ? `<span class="qty">${escapeHtml(ing.quantity)}</span>` : ''}
            </span>
          </button>
        </li>
      `).join('')}</ul>`;

  return `
    <div class="screen">
      <div class="topbar">
        <button class="back" data-action="back">‹ ${escapeHtml(dish.name)}</button>
        ${dish.ingredients.some(i => i.checked) ? `<button class="text-btn" data-action="uncheck-all" data-id="${dish.id}">Tout décocher</button>` : ''}
      </div>
      <h1 class="page-title">Liste de courses</h1>
      ${rows}
    </div>
  `;
}

/* ---------- Écran : préparation ---------- */
function renderPrepScreen(dish) {
  if (!dish) return renderListScreen();

  const rows = dish.steps.length === 0
    ? `<div class="empty-state"><p>Modifie le plat pour ajouter des étapes.</p></div>`
    : `<div class="step-list">${dish.steps.map((s, i) => `
        <div class="step-row">
          <span class="ghost-num">${i + 1}</span>
          <span class="step-text">${escapeHtml(s.content)}</span>
        </div>
      `).join('')}</div>`;

  return `
    <div class="screen">
      <div class="topbar">
        <button class="back" data-action="back">‹ ${escapeHtml(dish.name)}</button>
      </div>
      <h1 class="page-title">Préparation</h1>
      ${rows}
    </div>
  `;
}

/* ---------- Formulaire (ajout / édition) ---------- */
function openForm(dishId) {
  const existing = dishId ? getDish(dishId) : null;
  formState = {
    mode: existing ? 'edit' : 'new',
    id: existing ? existing.id : null,
    name: existing ? existing.name : '',
    description: existing ? existing.description : '',
    ingredients: existing ? existing.ingredients.map(i => ({ ...i })) : [],
    steps: existing ? existing.steps.map(s => ({ ...s })) : []
  };
  render();
}

function closeForm() {
  formState = null;
  render();
}

function renderFormOverlay() {
  const f = formState;
  const html = `
    <div class="sheet-overlay" id="sheet">
      <div class="sheet-header">
        <button class="icon-btn" data-action="close-form" aria-label="Fermer">✕</button>
        <h2>${f.mode === 'edit' ? 'Modifier le plat' : 'Nouveau plat'}</h2>
        <span style="width:38px"></span>
      </div>
      <div class="sheet-body">
        <div class="field-group">
          <label class="field-label">Nom du plat</label>
          <input type="text" id="f-name" value="${escapeAttr(f.name)}" placeholder="Ex. Curry de légumes">
        </div>
        <div class="field-group">
          <label class="field-label">Description (optionnel)</label>
          <textarea id="f-desc" rows="2" placeholder="Une courte note sur ce plat">${escapeHtml(f.description)}</textarea>
        </div>

        <div class="field-group">
          <label class="field-label">Liste de courses</label>
          <div id="ing-rows">${renderIngredientRows()}</div>
          <button class="add-link" data-action="add-ingredient">+ Ajouter un ingrédient</button>
        </div>

        <div class="field-group">
          <label class="field-label">Étapes de préparation</label>
          <div id="step-rows">${renderStepRows()}</div>
          <button class="add-link" data-action="add-step">+ Ajouter une étape</button>
        </div>
      </div>
      <div class="sheet-footer">
        <button class="primary-btn" id="f-save" data-action="save-dish">Enregistrer</button>
      </div>
    </div>
  `;
  app.insertAdjacentHTML('beforeend', html);
  bindStaticFieldListeners();
  bindDynamicFieldListeners();
  updateSaveButtonState();
}

function renderIngredientRows() {
  if (formState.ingredients.length === 0) return '';
  return formState.ingredients.map((ing, i) => `
    <div class="dyn-row" data-ing-index="${i}">
      <input type="text" class="name-field" data-field="ing-name" data-index="${i}" placeholder="Ingrédient" value="${escapeAttr(ing.name)}">
      <input type="text" class="qty-field" data-field="ing-qty" data-index="${i}" placeholder="Quantité" value="${escapeAttr(ing.quantity)}">
      <button class="remove-row" data-action="remove-ingredient" data-index="${i}" aria-label="Supprimer">✕</button>
    </div>
  `).join('');
}

function renderStepRows() {
  if (formState.steps.length === 0) return '';
  return formState.steps.map((s, i) => `
    <div class="dyn-row" data-step-index="${i}">
      <span class="step-index">${i + 1}.</span>
      <textarea class="step-field" data-field="step-content" data-index="${i}" placeholder="Décris l'étape">${escapeHtml(s.content)}</textarea>
      <button class="remove-row" data-action="remove-step" data-index="${i}" aria-label="Supprimer">✕</button>
    </div>
  `).join('');
}

function bindStaticFieldListeners() {
  const nameInput = document.getElementById('f-name');
  const descInput = document.getElementById('f-desc');
  nameInput.addEventListener('input', () => {
    formState.name = nameInput.value;
    updateSaveButtonState();
  });
  descInput.addEventListener('input', () => { formState.description = descInput.value; });
}

function bindDynamicFieldListeners() {
  document.querySelectorAll('[data-field="ing-name"]').forEach(el => {
    el.addEventListener('input', () => { formState.ingredients[+el.dataset.index].name = el.value; });
  });
  document.querySelectorAll('[data-field="ing-qty"]').forEach(el => {
    el.addEventListener('input', () => { formState.ingredients[+el.dataset.index].quantity = el.value; });
  });
  document.querySelectorAll('[data-field="step-content"]').forEach(el => {
    el.addEventListener('input', () => { formState.steps[+el.dataset.index].content = el.value; });
  });
}

function updateSaveButtonState() {
  const btn = document.getElementById('f-save');
  if (btn) btn.disabled = formState.name.trim().length === 0;
}

function refreshIngredientRows() {
  document.getElementById('ing-rows').innerHTML = renderIngredientRows();
  bindDynamicFieldListeners();
}

function refreshStepRows() {
  document.getElementById('step-rows').innerHTML = renderStepRows();
  bindDynamicFieldListeners();
}

function saveDishFromForm() {
  const name = formState.name.trim();
  if (!name) return;

  const cleanIngredients = formState.ingredients
    .filter(i => i.name.trim().length > 0)
    .map(i => ({ id: i.id || uid(), name: i.name.trim(), quantity: i.quantity.trim(), checked: i.checked || false }));

  const cleanSteps = formState.steps
    .filter(s => s.content.trim().length > 0)
    .map(s => ({ id: s.id || uid(), content: s.content.trim() }));

  if (formState.mode === 'edit') {
    const dish = getDish(formState.id);
    dish.name = name;
    dish.description = formState.description.trim();
    dish.ingredients = cleanIngredients;
    dish.steps = cleanSteps;
  } else {
    dishes.push({
      id: uid(),
      name,
      description: formState.description.trim(),
      ingredients: cleanIngredients,
      steps: cleanSteps
    });
  }
  saveDishes();
  const savedId = formState.mode === 'edit' ? formState.id : dishes[dishes.length - 1].id;
  formState = null;

  if (current().view === 'list') {
    resetTo({ view: 'detail', id: savedId });
  } else {
    render();
  }
}

/* ---------- Confirmation de suppression ---------- */
function askDeleteDish(id) {
  const dish = getDish(id);
  confirmState = {
    title: 'Supprimer ce plat ?',
    message: `« ${dish.name} » ainsi que sa liste de courses et sa préparation seront supprimés définitivement.`,
    onConfirm: () => {
      dishes = dishes.filter(d => d.id !== id);
      saveDishes();
      confirmState = null;
      resetTo({ view: 'list' });
    }
  };
  render();
}

function renderConfirmOverlay() {
  const c = confirmState;
  const html = `
    <div class="confirm-overlay" data-action="cancel-confirm">
      <div class="confirm-card" onclick="event.stopPropagation()">
        <h3>${escapeHtml(c.title)}</h3>
        <p>${escapeHtml(c.message)}</p>
        <div class="confirm-actions">
          <button class="cancel" data-action="cancel-confirm">Annuler</button>
          <button class="destroy" data-action="confirm-delete">Supprimer</button>
        </div>
      </div>
    </div>
  `;
  app.insertAdjacentHTML('beforeend', html);
}

/* ---------- Utilitaires ---------- */
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
function escapeAttr(str) { return escapeHtml(str); }

/* ---------- Délégation des événements ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  switch (action) {
    case 'new-dish':
      openForm(null);
      break;
    case 'edit-dish':
      openForm(btn.dataset.id);
      break;
    case 'delete-dish':
      askDeleteDish(btn.dataset.id);
      break;
    case 'open-dish':
      goTo({ view: 'detail', id: btn.dataset.id });
      break;
    case 'open-shopping':
      goTo({ view: 'shopping', id: btn.dataset.id });
      break;
    case 'open-prep':
      goTo({ view: 'prep', id: btn.dataset.id });
      break;
    case 'back':
      goBack();
      break;
    case 'toggle-ingredient': {
      const dish = getDish(btn.dataset.dish);
      const ing = dish.ingredients.find(i => i.id === btn.dataset.ing);
      ing.checked = !ing.checked;
      saveDishes();
      render();
      break;
    }
    case 'uncheck-all': {
      const dish = getDish(btn.dataset.id);
      dish.ingredients.forEach(i => { i.checked = false; });
      saveDishes();
      render();
      break;
    }
    case 'close-form':
      closeForm();
      break;
    case 'save-dish':
      saveDishFromForm();
      break;
    case 'add-ingredient':
      formState.ingredients.push({ id: null, name: '', quantity: '', checked: false });
      refreshIngredientRows();
      break;
    case 'remove-ingredient':
      formState.ingredients.splice(+btn.dataset.index, 1);
      refreshIngredientRows();
      break;
    case 'add-step':
      formState.steps.push({ id: null, content: '' });
      refreshStepRows();
      break;
    case 'remove-step':
      formState.steps.splice(+btn.dataset.index, 1);
      refreshStepRows();
      break;
    case 'cancel-confirm':
      confirmState = null;
      render();
      break;
    case 'confirm-delete':
      if (confirmState) confirmState.onConfirm();
      break;
  }
});

/* ---------- Service worker (fonctionnement hors-ligne) ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

/* ---------- Démarrage ---------- */
render();
