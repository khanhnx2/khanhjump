const STORAGE_KEY = 'khanhJumpCharactersV1';
const SELECTED_KEY = 'khanhJumpSelectedCharacterV1';
const DEFAULT_FACE = 'assets/characters/player-father.png';

const DEFAULT_CHARACTERS = [
  { id: 'Father', name: 'Father', faceSrc: 'assets/characters/player-father.png' },
  { id: 'Khôi', name: 'Khôi', faceSrc: 'assets/characters/player-khoi.png' },
  { id: 'Nguyên', name: 'Nguyên', faceSrc: 'assets/characters/player-nguyen.png' }
];

export class CharacterManager {
  constructor(root, onSelect) {
    this.root = root;
    this.onSelect = onSelect;
    this.characters = readCharacters();
    this.selectedId = readSelectedId(this.characters);
    this.fileInput = createFileInput();
    this.root.appendChild(this.fileInput);
    this.root.addEventListener('click', (event) => this.handleClick(event));
    this.root.addEventListener('mousedown', (event) => event.stopPropagation());
    this.root.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });
    this.render();
  }

  get selected() {
    return this.characters.find((character) => character.id === this.selectedId) || this.characters[0];
  }

  handleClick(event) {
    const action = event.target.closest('[data-character-action]');
    const option = event.target.closest('[data-character-id]');
    if (action) {
      event.preventDefault();
      this.runAction(action.dataset.characterAction);
    } else if (option) {
      event.preventDefault();
      this.select(option.dataset.characterId);
    }
  }

  select(id) {
    if (!this.characters.some((character) => character.id === id)) return;
    this.selectedId = id;
    saveSelectedId(id);
    this.render();
    this.onSelect(this.selected);
  }

  runAction(action) {
    if (action === 'rename') this.renameSelected();
    if (action === 'photo') this.changePhoto(this.selectedId);
    if (action === 'add') this.addCharacter();
    if (action === 'delete') this.deleteSelected();
  }

  renameSelected() {
    const nextName = window.prompt('Tên character', this.selected.name);
    if (!nextName || !nextName.trim()) return;
    this.updateCharacter(this.selectedId, { name: nextName.trim() });
  }

  changePhoto(id) {
    this.fileInput.onchange = () => {
      const file = this.fileInput.files && this.fileInput.files[0];
      this.fileInput.value = '';
      if (!file) return;
      readFileAsDataUrl(file, (faceSrc) => this.updateCharacter(id, { faceSrc }));
    };
    this.fileInput.click();
  }

  addCharacter() {
    const name = window.prompt('Tên character mới', `Player ${this.characters.length + 1}`);
    if (!name || !name.trim()) return;
    const character = { id: `custom-${Date.now()}`, name: name.trim(), faceSrc: DEFAULT_FACE };
    this.characters.push(character);
    this.selectedId = character.id;
    this.persist();
    this.render();
    this.onSelect(this.selected);
    this.changePhoto(character.id);
  }

  deleteSelected() {
    if (this.characters.length <= 1) return;
    const name = this.selected.name;
    if (!window.confirm(`Xóa ${name}?`)) return;
    this.characters = this.characters.filter((character) => character.id !== this.selectedId);
    this.selectedId = this.characters[0].id;
    this.persist();
    this.render();
    this.onSelect(this.selected);
  }

  updateCharacter(id, patch) {
    this.characters = this.characters.map((character) =>
      character.id === id ? { ...character, ...patch } : character
    );
    this.persist();
    this.render();
    this.onSelect(this.selected);
  }

  persist() {
    writeJson(STORAGE_KEY, this.characters);
    saveSelectedId(this.selectedId);
  }

  render() {
    this.root.textContent = '';
    const list = document.createElement('div');
    list.className = 'character-list';
    for (const character of this.characters) list.appendChild(this.createOption(character));

    const actions = document.createElement('div');
    actions.className = 'character-actions';
    actions.append(
      createActionButton('rename', 'Tên'),
      createActionButton('photo', 'Ảnh'),
      createActionButton('add', '+'),
      createActionButton('delete', 'Xóa')
    );
    this.root.append(list, actions, this.fileInput);
  }

  createOption(character) {
    const button = document.createElement('button');
    button.className = `character-option${character.id === this.selectedId ? ' active' : ''}`;
    button.type = 'button';
    button.dataset.characterId = character.id;
    button.setAttribute('aria-pressed', String(character.id === this.selectedId));
    button.innerHTML = `<img src="${escapeAttr(character.faceSrc)}" alt=""><span></span>`;
    button.querySelector('span').textContent = character.name;
    return button;
  }
}

function createActionButton(action, text) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'character-action';
  button.dataset.characterAction = action;
  button.textContent = text;
  return button;
}

function createFileInput() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.className = 'character-file-input';
  return input;
}

function readCharacters() {
  const saved = readJson(STORAGE_KEY);
  const characters = Array.isArray(saved) && saved.length ? saved : DEFAULT_CHARACTERS;
  return characters.map((character) => ({ ...character }));
}

function readSelectedId(characters) {
  const saved = localStorage.getItem(SELECTED_KEY);
  return characters.some((character) => character.id === saved) ? saved : characters[0].id;
}

function saveSelectedId(id) {
  try {
    localStorage.setItem(SELECTED_KEY, id);
  } catch {
    // Selection falls back to the first character if storage is unavailable.
  }
}

function readFileAsDataUrl(file, onLoad) {
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result || DEFAULT_FACE));
  reader.readAsDataURL(file);
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Character edits remain in memory if storage is full or unavailable.
  }
}

function escapeAttr(value) {
  return String(value).replace(/"/g, '&quot;');
}
