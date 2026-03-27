(() => {
  const STORAGE_KEY = "clinic-appointments";

  const form = document.getElementById("patient-form");
  const formTitle = document.getElementById("form-title");
  const submitLabel = document.getElementById("submit-label");
  const cancelEditBtn = document.getElementById("cancel-edit");
  const nameInput = document.getElementById("name");
  const complaintInput = document.getElementById("complaint");
  const visitTimeInput = document.getElementById("visitTime");
  const todayList = document.getElementById("today-list");
  const emptyState = document.getElementById("empty-state");
  const totalCount = document.getElementById("total-count");
  const seenCount = document.getElementById("seen-count");

  /** @type {Array<{id: string, name: string, complaint: string, visitTime: string, seen: boolean}>} */
  const appointments = [];
  let editingId = null;

  function saveAppointments() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }

  function loadAppointments() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      parsed.forEach((item) => {
        if (!item || typeof item !== "object") return;
        if (!item.id || !item.name || !item.complaint || !item.visitTime) return;

        appointments.push({
          id: String(item.id),
          name: String(item.name),
          complaint: String(item.complaint),
          visitTime: String(item.visitTime),
          seen: Boolean(item.seen),
        });
      });
    } catch (error) {
      console.error("讀取本機資料失敗", error);
    }
  }

  function setDefaultVisitTime() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    visitTimeInput.value = local;
  }

  function exitEditMode() {
    editingId = null;
    formTitle.textContent = "新增病患";
    submitLabel.textContent = "新增病患";
    cancelEditBtn.hidden = true;
    form.reset();
    setDefaultVisitTime();
  }

  function enterEditMode(item) {
    editingId = item.id;
    formTitle.textContent = "編輯病患";
    submitLabel.textContent = "儲存修改";
    cancelEditBtn.hidden = false;
    nameInput.value = item.name;
    complaintInput.value = item.complaint;
    visitTimeInput.value = item.visitTime;
    nameInput.focus();
  }

  function getTodayKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${d} ${hh}:${mm}`;
  }

  function render() {
    const todayKey = getTodayKey();
    const todayAppointments = appointments
      .filter((item) => item.visitTime.slice(0, 10) === todayKey)
      .sort((a, b) => a.visitTime.localeCompare(b.visitTime));

    todayList.innerHTML = "";

    if (todayAppointments.length === 0) {
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
    }

    let seen = 0;

    todayAppointments.forEach((item) => {
      if (item.seen) seen += 1;

      const row = document.createElement("li");
      row.className = "patient-item";
      if (item.seen) row.classList.add("is-seen");

      const info = document.createElement("div");
      info.className = "patient-info";
      info.innerHTML = `
        <p class="line"><strong>姓名：</strong>${item.name}</p>
        <p class="line"><strong>主訴：</strong>${item.complaint}</p>
        <p class="line"><strong>看診時間：</strong>${formatDateTime(item.visitTime)}</p>
      `;

      const actionGroup = document.createElement("div");
      actionGroup.className = "action-group";

      const seenBtn = document.createElement("button");
      seenBtn.type = "button";
      seenBtn.className = "action-btn seen-btn";
      seenBtn.textContent = item.seen ? "已看診" : "標記已看診";
      seenBtn.disabled = item.seen;
      seenBtn.addEventListener("click", () => {
        item.seen = true;
        saveAppointments();
        render();
      });

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "action-btn edit-btn";
      editBtn.textContent = "編輯";
      editBtn.addEventListener("click", () => {
        enterEditMode(item);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "action-btn delete-btn";
      deleteBtn.textContent = "刪除";
      deleteBtn.addEventListener("click", () => {
        if (!confirm(`確定要刪除「${item.name}」的預約嗎？`)) {
          return;
        }

        const index = appointments.findIndex((appt) => appt.id === item.id);
        if (index === -1) return;
        appointments.splice(index, 1);
        saveAppointments();

        if (editingId === item.id) {
          exitEditMode();
        }

        render();
      });

      actionGroup.appendChild(seenBtn);
      actionGroup.appendChild(editBtn);
      actionGroup.appendChild(deleteBtn);

      row.appendChild(info);
      row.appendChild(actionGroup);
      todayList.appendChild(row);
    });

    totalCount.textContent = String(todayAppointments.length);
    seenCount.textContent = String(seen);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const complaint = complaintInput.value.trim();
    const visitTime = visitTimeInput.value;

    if (!name || !complaint || !visitTime) {
      alert("請完整填寫姓名、主訴與看診時間");
      return;
    }

    if (editingId) {
      const target = appointments.find((item) => item.id === editingId);
      if (!target) {
        alert("找不到要編輯的病患資料，請重新操作");
        exitEditMode();
        render();
        return;
      }

      target.name = name;
      target.complaint = complaint;
      target.visitTime = visitTime;
      saveAppointments();
      exitEditMode();
      render();
      return;
    }

    appointments.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      complaint,
      visitTime,
      seen: false,
    });

    saveAppointments();
    form.reset();
    setDefaultVisitTime();
    render();
  });

  cancelEditBtn.addEventListener("click", () => {
    exitEditMode();
    render();
  });

  loadAppointments();
  setDefaultVisitTime();

  render();
})();
