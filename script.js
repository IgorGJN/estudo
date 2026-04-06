let data = null;
let timeline;
let editingId = null;

async function loadData() {
  const saved = localStorage.getItem("bibleData");

  if (saved) {
    data = JSON.parse(saved);
  } else {
    const res = await fetch('dados.json');
    data = await res.json();
  }

  // Corrigir dados antigos
  data.relations = data.relations.map(r => {
    if (!r.type) return { ...r, type: "parent" };
    return r;
  });

  if (!data.families) {
  data.families = [];

  const parentMap = {};

  // Mapear filhos por pai
  data.relations
    .filter(r => r.type === "parent")
    .forEach(r => {
      if (!parentMap[r.from]) parentMap[r.from] = [];
      parentMap[r.from].push(r.to);
    });

  // Mapear cônjuges
  const spouseMap = {};
  data.relations
    .filter(r => r.type === "spouse")
    .forEach(r => {
      spouseMap[r.from] = r.to;
    });

  // Criar famílias
  Object.keys(parentMap).forEach(fatherId => {
    const father = Number(fatherId);
    const mother = spouseMap[father] || null;

    data.families.push({
      id: Date.now() + Math.random(),
      father,
      mother,
      children: parentMap[father]
    });
  });
}


  save();
  render();
}

function save() {
  localStorage.setItem("bibleData", JSON.stringify(data));
}

// ===== RENDER =====
function render() {
  renderTree();
  renderTimeline(); // chamada única
  renderPeopleList();
  renderEventList();
  renderOptions(); // centraliza selects
}

// ===== PERSON =====
function addOrUpdatePerson() {
  const name = document.getElementById("name").value;
  const parent = Number(document.getElementById("parent").value);
  const spouse = Number(document.getElementById("spouse").value);

  if (!name) return;

  if (editingId) {
    const p = data.people.find(p => p.id === editingId);
    if (!p) return;

    p.name = name;

    // REMOVER relações antigas desse tipo
    data.relations = data.relations.filter(r =>
      !(r.type === "parent" && r.to === editingId) &&
      !(r.type === "spouse" && (r.from === editingId || r.to === editingId))
    );

    // NOVO PAI
    if (parent) {
      data.relations.push({ type: "parent", from: parent, to: editingId });
    }

    // NOVO CÔNJUGE (bidirecional único)
    if (spouse) {
      if (!data.relations.find(r => r.type === "spouse" && r.from === editingId && r.to === spouse)) {
        data.relations.push({ type: "spouse", from: editingId, to: spouse });
        data.relations.push({ type: "spouse", from: spouse, to: editingId });
      }
    }

    editingId = null;
  } else {
    const id = Date.now();
    data.people.push({ id, name });

    if (parent) {
      data.relations.push({ type: "parent", from: parent, to: id });
    }

    if (spouse) {
      data.relations.push({ type: "spouse", from: id, to: spouse });
      data.relations.push({ type: "spouse", from: spouse, to: id });
    }
  }

  resetForm();
  save();
  render();
}

function editPerson(id) {
  const p = data.people.find(p => p.id === id);
  if (!p) return;

  editingId = id;

  document.getElementById("name").value = p.name;
  document.getElementById("birth").value = p.birth || "";
  document.getElementById("death").value = p.death || "";
  document.getElementById("approx").checked = p.approximate || false;

  // PAI
  const parentRel = data.relations.find(r => r.type === "parent" && r.to === id);
  document.getElementById("parent").value = parentRel ? parentRel.from : "";

  // CÔNJUGE (pega o primeiro)
  const spouseRel = data.relations.find(r => r.type === "spouse" && r.from === id);
  document.getElementById("spouse").value = spouseRel ? spouseRel.to : "";
}

function deletePerson(id) {
  data.people = data.people.filter(p => p.id !== id);
  data.relations = data.relations.filter(r => r.from !== id && r.to !== id);
  data.events.forEach(e => e.people = e.people.filter(pid => pid !== id));

  save();
  render();
}

function resetForm() {
  editingId = null;

  document.getElementById("name").value = "";
  document.getElementById("birth").value = "";
  document.getElementById("death").value = "";
  document.getElementById("approx").checked = false;
}

// ===== EVENT =====
function addEvent() {
  const title = document.getElementById("eventTitle").value;
  const startYear = Number(document.getElementById("eventYear").value);
  const endYear = Number(document.getElementById("eventEnd").value);
  const approx = document.getElementById("eventApprox").checked;
  const person = Number(document.getElementById("eventPerson").value);

  if (!title || isNaN(startYear)) return;

  if (editingId) {
    const e = data.events.find(ev => ev.id === editingId);
    if (!e) return;

    e.title = title;
    e.year = startYear;
    e.end = isNaN(endYear) ? null : endYear;
    e.approximate = approx;
    e.people = person ? [person] : [];

    editingId = null;
  } else {
    const id = Date.now();

    data.events.push({
      id,
      title,
      year: startYear,
      end: isNaN(endYear) ? null : endYear,
      approximate: approx,
      people: person ? [person] : []
    });
  }

  document.getElementById("eventTitle").value = "";
  document.getElementById("eventYear").value = "";
  document.getElementById("eventEnd").value = "";
  document.getElementById("eventApprox").checked = false;
  document.getElementById("eventPerson").value = "";

  save();
  render();
}

function deleteEvent(id) {
  data.events = data.events.filter(e => e.id !== id);
  save();
  render();
}

// ===== LISTS =====
function renderPeopleList() {
  const ul = document.getElementById("peopleList");
  ul.innerHTML = "";

  data.people.forEach(p => {
    const li = document.createElement("li");
    li.innerText = p.name;
    li.onclick = () => editPerson(p.id);

    const btn = document.createElement("button");
    btn.innerText = "X";
    btn.onclick = (e) => {
      e.stopPropagation();
      deletePerson(p.id);
    };

    li.appendChild(btn);
    ul.appendChild(li);
  });
}

function renderEventList() {
  const ul = document.getElementById("eventList");
  ul.innerHTML = "";

  data.events.forEach(e => {
    const li = document.createElement("li");

    const text = e.end
      ? `${e.title} (${e.year} → ${e.end})`
      : `${e.title} (${e.year})`;

    li.innerText = text;
    li.onclick = () => editEvent(e.id);

    const btn = document.createElement("button");
    btn.innerText = "X";
    btn.onclick = (ev) => {
      ev.stopPropagation();
      deleteEvent(e.id);
    };

    li.appendChild(btn);
    ul.appendChild(li);
  });
}

// ===== SELECTS =====
function renderOptions() {
  const parent = document.getElementById("parent");
  const spouse = document.getElementById("spouse");
  const eventPerson = document.getElementById("eventPerson");

  parent.innerHTML = '<option value="">Nenhum</option>';
  spouse.innerHTML = '<option value="">Nenhum</option>';
  eventPerson.innerHTML = '<option value="">Nenhum</option>';

  data.people.forEach(p => {
    parent.add(new Option(p.name, p.id));
    spouse.add(new Option(p.name, p.id));
    eventPerson.add(new Option(p.name, p.id));
  });
}

// ===== TREE =====
function buildHierarchy() {
  const map = {};

  data.people.forEach(p => {
    map[p.id] = { ...p, children: [], spouses: [] };
  });

  data.relations.forEach(r => {
    if (r.type === "parent") {
      map[r.from]?.children.push(map[r.to]);
    }
    if (r.type === "spouse") {
      map[r.from]?.spouses.push(r.to);
    }
  });

  const childrenIds = data.relations
    .filter(r => r.type === "parent")
    .map(r => r.to);

  const root = data.people.find(p => !childrenIds.includes(p.id));

  return root ? map[root.id] : { name: "Sem raiz", children: [] };
}

function renderTree() {
  const container = d3.select("#tree");
  container.html("");

  const width = 500;
  const height = 500;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const rootData = buildHierarchy();
  if (!rootData) return;

  const root = d3.hierarchy(rootData);

  d3.tree().size([width - 100, height - 100])(root);

  svg.selectAll("line")
    .data(root.links())
    .enter()
    .append("line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y)
    .attr("stroke", "#999");

  const nodes = svg.selectAll("g")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  nodes.append("circle")
    .attr("r", 6)
    .attr("fill", "steelblue");

  nodes.append("text")
    .attr("dy", -10)
    .attr("text-anchor", "middle")
    .text(d => d.data.name);

  nodes.each(function(d) {
  if (d.data.spouses?.length) {
    d.data.spouses.forEach((s, i) => {
      const spouse = data.people.find(p => p.id === s);
      if (!spouse) return;

      const offsetX = 40 + (i * 40);

      // NOME DO CÔNJUGE
      d3.select(this)
        .append("text")
        .attr("x", offsetX)
        .attr("y", 5)
        .text(spouse.name);

      // LINHA LIGANDO
      d3.select(this)
        .append("line")
        .attr("x1", 5)
        .attr("y1", 0)
        .attr("x2", offsetX - 5)
        .attr("y2", 0)
        .attr("stroke", "red");
    });
  }
});
}

// ===== TIMELINE =====
function renderTimeline() {
  const container = document.getElementById("timeline");
  container.innerHTML = "";

  const items = [];

  // ===== EVENTOS =====
  data.events.forEach(e => {
  if (e.end) {
    // EVENTO COM DURAÇÃO
    items.push({
      id: "event_" + e.id,
      content: e.title,
      start: yearToDate(e.year),
      end: yearToDate(e.end),
      type: "range",
      className: "event-item"
    });
  } else {
    // EVENTO PONTUAL
    items.push({
      id: "event_" + e.id,
      content: e.title,
      start: yearToDate(e.year),
      type: "point",
      className: "event-item"
    });
  }
});

  // ===== PERSONAGENS (LINHA DE VIDA) =====
  data.people.forEach(p => {
    if (p.birth && p.death) {
      // intervalo (vida inteira)
      items.push({
        id: "person_" + p.id,
        content: p.name,
        start: yearToDate(p.birth),
        end: yearToDate(p.death),
        type: "range",
        className: "person-range"
      });
    } else if (p.birth) {
      // só nascimento
      items.push({
        id: "person_" + p.id,
        content: p.name + " (nasc.)",
        start: yearToDate(p.birth),
        type: "point",
        className: "person-birth"
      });
    }
  });

  const dataset = new vis.DataSet(items);

  timeline = new vis.Timeline(container, dataset, {
    stack: true,
    zoomMin: 1000 * 60 * 60 * 24 * 365 * 10
  });
}

function yearToDate(year) {
  const date = new Date(0);
  date.setFullYear(year);
  return date;
}

// ===== IMPORT / EXPORT =====
function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "dados.json";
  a.click();
}

function importData() {
  const file = document.getElementById("importFile").files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    data = JSON.parse(e.target.result);
    save();
    render();
  };

  reader.readAsText(file);
}

function editEvent(id) {
  const e = data.events.find(ev => ev.id === id);
  if (!e) return;

  editingId = id;

  document.getElementById("eventTitle").value = e.title;
  document.getElementById("eventYear").value = e.year;
  document.getElementById("eventEnd").value = e.end || "";
  document.getElementById("eventApprox").checked = e.approximate || false;
  document.getElementById("eventPerson").value = e.people?.[0] || "";
}

loadData();