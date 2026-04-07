let data = { people: [], families: [], events: [] };
let timeline;

let editingPersonId = null;
let editingFamilyId = null;
let editingEventId = null;

// ===== LOAD / SAVE =====
async function load() {
  const saved = localStorage.getItem("bibleData");

  if (saved) {
    data = JSON.parse(saved);
  } else {
    const res = await fetch("dados.json");
    data = await res.json();
    save();
  }

  render();
}

function save() {
  localStorage.setItem("bibleData", JSON.stringify(data));
}

// ===== PERSON =====
function addPerson() {
  const name = document.getElementById("name").value;
  const birth = Number(document.getElementById("birth").value);
  const death = Number(document.getElementById("death").value);
  const approx = document.getElementById("approx").checked;

  if (!name) return;

  if (editingPersonId) {
    const p = data.people.find(p => p.id === editingPersonId);
    p.name = name;
    p.birth = isNaN(birth) ? null : birth;
    p.death = isNaN(death) ? null : death;
    p.approximate = approx;
    editingPersonId = null;
  } else {
    data.people.push({
      id: Date.now(),
      name,
      birth: isNaN(birth) ? null : birth,
      death: isNaN(death) ? null : death,
      approximate: approx
    });
  }

  resetPersonForm();
  save();
  render();
}

function editPerson(id) {
  const p = data.people.find(p => p.id === id);
  if (!p) return;

  editingPersonId = id;

  document.getElementById("name").value = p.name;
  document.getElementById("birth").value = p.birth || "";
  document.getElementById("death").value = p.death || "";
  document.getElementById("approx").checked = p.approximate || false;
}

function deletePerson(id) {
  data.people = data.people.filter(p => p.id !== id);

  data.families.forEach(f => {
    if (f.husband === id) f.husband = null;
    if (f.wife === id) f.wife = null;
    f.children = f.children.filter(c => c !== id);
  });

  data.events.forEach(e => {
    e.people = (e.people || []).filter(pid => pid !== id);
  });

  save();
  render();
}

function resetPersonForm() {
  editingPersonId = null;
  document.getElementById("name").value = "";
  document.getElementById("birth").value = "";
  document.getElementById("death").value = "";
  document.getElementById("approx").checked = false;
}

// ===== FAMILY =====
function addChildField(value = "") {
  const div = document.createElement("div");
  const select = document.createElement("select");

  data.people.forEach(p => {
    select.add(new Option(p.name, p.id));
  });

  select.value = value;

  div.appendChild(select);
  document.getElementById("childrenContainer").appendChild(div);
}

function addFamily() {
  const husband = Number(document.getElementById("husband").value) || null;
  const wife = Number(document.getElementById("wife").value) || null;
  const start = Number(document.getElementById("start").value);
  const end = Number(document.getElementById("end").value);

  const children = [];
  document.querySelectorAll("#childrenContainer select").forEach(s => {
    if (s.value) children.push(Number(s.value));
  });

  if (editingFamilyId) {
    const f = data.families.find(f => f.id === editingFamilyId);
    f.husband = husband;
    f.wife = wife;
    f.start = isNaN(start) ? null : start;
    f.end = isNaN(end) ? null : end;
    f.children = children;
    editingFamilyId = null;
  } else {
    data.families.push({
      id: Date.now(),
      husband,
      wife,
      start: isNaN(start) ? null : start,
      end: isNaN(end) ? null : end,
      children
    });
  }

  resetFamilyForm();
  save();
  render();
}

function editFamily(id) {
  const f = data.families.find(f => f.id === id);
  if (!f) return;

  editingFamilyId = id;

  document.getElementById("husband").value = f.husband || "";
  document.getElementById("wife").value = f.wife || "";
  document.getElementById("start").value = f.start || "";
  document.getElementById("end").value = f.end || "";

  const container = document.getElementById("childrenContainer");
  container.innerHTML = "";
  f.children.forEach(c => addChildField(c));
}

function deleteFamily(id) {
  data.families = data.families.filter(f => f.id !== id);
  save();
  render();
}

function resetFamilyForm() {
  editingFamilyId = null;
  document.getElementById("husband").value = "";
  document.getElementById("wife").value = "";
  document.getElementById("start").value = "";
  document.getElementById("end").value = "";
  document.getElementById("childrenContainer").innerHTML = "";
}

// ===== EVENTS =====
function addEvent() {
  const title = document.getElementById("eventTitle").value;
  const year = Number(document.getElementById("eventYear").value);
  const end = Number(document.getElementById("eventEnd").value);
  const person = Number(document.getElementById("eventPerson").value);

  if (!title || isNaN(year)) return;

  if (editingEventId) {
    const e = data.events.find(e => e.id === editingEventId);
    e.title = title;
    e.year = year;
    e.end = isNaN(end) ? null : end;
    e.people = person ? [person] : [];
    editingEventId = null;
  } else {
    data.events.push({
      id: Date.now(),
      title,
      year,
      end: isNaN(end) ? null : end,
      people: person ? [person] : []
    });
  }

  resetEventForm();
  save();
  render();
}

function editEvent(id) {
  const e = data.events.find(e => e.id === id);
  if (!e) return;

  editingEventId = id;

  document.getElementById("eventTitle").value = e.title;
  document.getElementById("eventYear").value = e.year;
  document.getElementById("eventEnd").value = e.end || "";
  document.getElementById("eventPerson").value = e.people?.[0] || "";
}

function deleteEvent(id) {
  data.events = data.events.filter(e => e.id !== id);
  save();
  render();
}

function resetEventForm() {
  editingEventId = null;
  document.getElementById("eventTitle").value = "";
  document.getElementById("eventYear").value = "";
  document.getElementById("eventEnd").value = "";
  document.getElementById("eventPerson").value = "";
}

// ===== LISTS =====
function renderPeopleList() {
  const ul = document.getElementById("peopleList");
  ul.innerHTML = "";

  data.people.forEach(p => {
    const li = document.createElement("li");
    li.innerText = p.name;

    li.onclick = () => editPerson(p.id);

    const del = document.createElement("button");
    del.innerText = "X";
    del.onclick = (e) => {
      e.stopPropagation();
      deletePerson(p.id);
    };

    li.appendChild(del);
    ul.appendChild(li);
  });
}

function renderFamilyList() {
  const ul = document.getElementById("familyList");
  ul.innerHTML = "";

  data.families.forEach(f => {
    const h = data.people.find(p => p.id === f.husband)?.name || "—";
    const w = data.people.find(p => p.id === f.wife)?.name || "—";

    const li = document.createElement("li");
    li.innerText = `${h} + ${w} (${f.children.length} filhos)`;

    li.onclick = () => editFamily(f.id);

    const del = document.createElement("button");
    del.innerText = "X";
    del.onclick = (e) => {
      e.stopPropagation();
      deleteFamily(f.id);
    };

    li.appendChild(del);
    ul.appendChild(li);
  });
}

function renderEventList() {
  const ul = document.getElementById("eventList");
  ul.innerHTML = "";

  data.events.forEach(e => {
    const li = document.createElement("li");
    li.innerText = e.end
      ? `${e.title} (${e.year} → ${e.end})`
      : `${e.title} (${e.year})`;

    li.onclick = () => editEvent(e.id);

    const del = document.createElement("button");
    del.innerText = "X";
    del.onclick = (ev) => {
      ev.stopPropagation();
      deleteEvent(e.id);
    };

    li.appendChild(del);
    ul.appendChild(li);
  });
}

// ===== TREE =====
function renderTree() {
  const container = d3.select("#tree");
  container.html("");

  const rootId = Number(document.getElementById("rootPerson")?.value);
  if (!rootId) return;

  const width = 1400;
  const height = 900;

  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g");

  // ZOOM
  svg.call(
    d3.zoom()
      .scaleExtent([0.5, 2])
      .on("zoom", (event) => g.attr("transform", event.transform))
  );

  const spacingX = 160;
  const spacingY = 140;

  const positions = {};
  const visited = new Set();

  const occupied = new Set();

function key(x, y) {
  return `${Math.round(x)}-${Math.round(y)}`;
}

function findFreePosition(x, y) {
  let newX = x;
  let tries = 0;

  while (occupied.has(key(newX, y))) {
    newX += 40; // desloca lateralmente
    tries++;

    if (tries > 20) break; // segurança
  }

  occupied.add(key(newX, y));
  return { x: newX, y };
}


  // ===== PEGAR ÁRVORE COMPLETA =====
  function getFullTree(rootId) {
    const valid = new Set();

    function walkDown(id) {
      valid.add(id);

      data.families.forEach(f => {
        if (f.husband === id || f.wife === id) {
          if (f.husband) valid.add(f.husband);
          if (f.wife) valid.add(f.wife);

          f.children.forEach(c => {
            if (!valid.has(c)) {
              walkDown(c);
            }
          });
        }
      });
    }

    function walkUp(id) {
      data.families.forEach(f => {
        if (f.children.includes(id)) {
          if (f.husband) {
            valid.add(f.husband);
            walkUp(f.husband);
          }
          if (f.wife) {
            valid.add(f.wife);
            walkUp(f.wife);
          }
        }
      });
    }

    walkDown(rootId);
    walkUp(rootId);

    return valid;
  }

  const validIds = getFullTree(rootId);

  // ===== POSICIONAMENTO =====
  function layout(id, x, y, direction) {
    if (visited.has(id)) return;
    visited.add(id);

    positions[id] = findFreePosition(x, y);

    const families = data.families.filter(f =>
      f.husband === id || f.wife === id
    );

    families.forEach((f, index) => {
      const spouseId = f.husband === id ? f.wife : f.husband;

      const offset = (index - (families.length - 1) / 2) * spacingX * 2;
      const sx = x + offset;

      // CÔNJUGE
      if (spouseId && validIds.has(spouseId)) {
        if (!positions[spouseId]) {
          positions[spouseId] = findFreePosition(sx, y);
        }

        g.append("line")
          .attr("x1", x)
          .attr("y1", y)
          .attr("x2", sx)
          .attr("y2", y)
          .attr("stroke", "black");
      }

      const midX = (x + sx) / 2;

      // FILHOS (baixo)
      if (direction >= 0 && f.children.length) {
        const childY = y + spacingY;

        g.append("line")
          .attr("x1", midX)
          .attr("y1", y)
          .attr("x2", midX)
          .attr("y2", childY - 20)
          .attr("stroke", "#555");

        const children = f.children.filter(c => validIds.has(c));
        const startX = midX - ((children.length - 1) * spacingX) / 2;

        children.forEach((cid, i) => {
          const cx = startX + i * spacingX;

          g.append("line")
            .attr("x1", midX)
            .attr("y1", childY - 20)
            .attr("x2", cx)
            .attr("y2", childY)
            .attr("stroke", "#555");

          layout(cid, cx, childY, 1);
        });
      }

      // PAIS (cima)
      if (direction <= 0) {
        data.families.forEach(pf => {
          if (pf.children.includes(id)) {
            const parentY = y - spacingY;

            const parents = [pf.husband, pf.wife].filter(pid =>
              validIds.has(pid)
            );

            const startX = x - ((parents.length - 1) * spacingX) / 2;

            parents.forEach((pid, i) => {
              const px = startX + i * spacingX;

              g.append("line")
                .attr("x1", px)
                .attr("y1", parentY)
                .attr("x2", x)
                .attr("y2", y - 20)
                .attr("stroke", "#555");

              layout(pid, px, parentY, -1);
            });
          }
        });
      }
    });
  }

  // iniciar pelo centro
  layout(rootId, width / 2, height / 2, 0);

  // ===== CORES =====
  function getColor(id) {
    const colors = ["#1976d2", "#388e3c", "#f57c00", "#7b1fa2", "#c2185b"];
    return colors[id % colors.length];
  }

  function formatDates(p) {
    const b = p.birth || "?";
    const d = p.death || "";
    return d ? `${b} - ${d}` : b;
  }

  // ===== DESENHAR =====
  data.people.forEach(p => {
    if (!positions[p.id]) return;

    const pos = positions[p.id];

    const node = g.append("g")
      .attr("transform", `translate(${pos.x}, ${pos.y})`)
      .style("cursor", "pointer")
      .on("click", () => {
        document.getElementById("rootPerson").value = p.id;
        renderTree();
      });

    node.append("circle")
      .attr("r", 12)
      .attr("fill", p.id === rootId ? "#d32f2f" : getColor(p.id));

    node.append("text")
      .attr("y", -18)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .text(p.name);

    node.append("text")
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "#555")
      .text(formatDates(p));
  });
}


// ===== TIMELINE =====
function renderTimeline() {
  const container = document.getElementById("timeline");
  container.innerHTML = "";

  const items = [];

  data.events.forEach(e => {
    items.push({
      content: e.title,
      start: yearToDate(e.year),
      end: e.end ? yearToDate(e.end) : null
    });
  });

  data.people.forEach(p => {
    if (p.birth && p.death) {
      items.push({
        content: p.name,
        start: yearToDate(p.birth),
        end: yearToDate(p.death)
      });
    }
  });

  timeline = new vis.Timeline(container, items);
}

function yearToDate(year) {
  const d = new Date(0);
  d.setFullYear(year);
  return d;
}

// ===== IMPORT / EXPORT =====
function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "dados.json";
  a.click();
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";

  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = evt => {
      data = JSON.parse(evt.target.result);
      save();
      render();
    };

    reader.readAsText(file);
  };

  input.click();
}

// ===== RENDER =====
function render() {
  renderTree();
  renderTimeline();
  renderPeopleList();
  renderFamilyList();
  renderEventList();

  ["husband", "wife", "eventPerson"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.innerHTML = '<option value="">Nenhum</option>';
    data.people.forEach(p => {
      el.add(new Option(p.name, p.id));
    });
  });

  const rootSelect = document.getElementById("rootPerson");
if (rootSelect) {
  rootSelect.innerHTML = "";

  data.people.forEach(p => {
    const opt = new Option(p.name, p.id);
    rootSelect.add(opt);
  });
}


}

function getFullTree(rootId) {
  const valid = new Set();
  const visited = new Set();

  function walk(personId) {
    if (visited.has(personId)) return;
    visited.add(personId);

    valid.add(personId);

    const families = data.families.filter(f =>
      f.husband === personId || f.wife === personId
    );

    families.forEach(f => {
      // incluir cônjuges
      if (f.husband) valid.add(f.husband);
      if (f.wife) valid.add(f.wife);

      // incluir filhos
      f.children.forEach(child => {
        valid.add(child);
        walk(child);
      });
    });
  }

  walk(rootId);
  return valid;
}

load();