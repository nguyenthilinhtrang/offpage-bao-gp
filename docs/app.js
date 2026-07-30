"use strict";

const CONFIG = {
  ANTHROPIC_API_URL: "https://api.anthropic.com/v1/messages",
  ANTHROPIC_VERSION: "2023-06-01",
  BAO_SHEET_CSV_URL:
    "https://docs.google.com/spreadsheets/d/19Mj7CKc26bzewgh8W8nq5G8RwD2nV4spcBIMHicLr5Q/gviz/tq?tqx=out:csv&gid=1705456031",
  GP_SHEET_CSV_URL:
    "https://docs.google.com/spreadsheets/d/1LYhURznnUbWq-8Ir_qpsC38RYlx3QIppC3MK2kDCRgs/gviz/tq?tqx=out:csv",
  MAX_TOKENS_STAGE1: 8000,
  MAX_TOKENS_STAGE2: 8000,
};

// ---------- helpers ----------
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function setStatus(el, text, kind) {
  el.textContent = text;
  el.className = "status" + (kind ? " " + kind : "");
}

function esc(s) {
  const div = document.createElement("div");
  div.textContent = s == null ? "" : String(s);
  return div.innerHTML;
}

async function fetchGoogleSheetCsv(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Không tải được bảng giá (HTTP ${resp.status})`);
  return await resp.text();
}

// ---------- CSV parsing (thuần JS, không tốn token) ----------
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function findColumnIndex(headerRow, aliases) {
  const lower = headerRow.map((h) => h.trim().toLowerCase());
  for (const alias of aliases) {
    const idx = lower.findIndex((h) => h.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Đoán cột TOP hiện tại: ưu tiên khớp đúng "now", tránh nhầm với cột "AIO" (chỉ số AI Overview, không phải rank). */
function guessTopColumn(headerRow) {
  const lower = headerRow.map((h) => h.trim().toLowerCase());
  let idx = lower.findIndex((h) => h === "now" || h.includes("now"));
  if (idx !== -1) return idx;
  idx = lower.findIndex((h) => !h.includes("aio") && (h.includes("vị trí") || h.includes("vi tri") || h.includes("position") || h.includes("rank")));
  if (idx !== -1) return idx;
  idx = lower.findIndex((h) => !h.includes("aio") && h.includes("top"));
  return idx;
}

function guessKeywordColumn(headerRow) {
  return findColumnIndex(headerRow, ["từ khoá", "từ khóa", "tu khoa", "keyword", "anchor"]);
}

function guessUrlColumn(headerRow) {
  return findColumnIndex(headerRow, ["url", "link", "trang đích", "trang dich"]);
}

function parseTopValue(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (s === "" || s === "-" || s.toLowerCase() === "n/a" || s.startsWith(">")) return null; // out TOP 30
  const digits = s.replace(/[^\d]/g, "");
  if (digits === "") return null;
  return parseInt(digits, 10);
}

/** Lọc bớt dòng chắc chắn bị loại (Note nêu rõ tạm dừng/dừng bán) trước khi gửi CSV giá lên Claude — không đổi kết quả, chỉ giảm token. */
function preFilterExcludedRows(csvText) {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return csvText;
  const header = rows[0];
  const noteIdx = findColumnIndex(header, ["ghi chú", "ghi chu", "note", "trạng thái", "trang thai"]);
  if (noteIdx === -1) return csvText;
  const excludePhrases = ["tạm dừng", "tam dung", "dừng bán", "dung ban", "dừng nhận", "dung nhan", "ngừng nhận", "ngung nhan"];
  const kept = [header];
  let removed = 0;
  for (const r of rows.slice(1)) {
    const note = (r[noteIdx] || "").toLowerCase();
    if (excludePhrases.some((p) => note.includes(p))) {
      removed++;
      continue;
    }
    kept.push(r);
  }
  if (removed > 0) {
    console.log(`preFilterExcludedRows: đã loại ${removed} dòng theo Note (tạm dừng/dừng bán) trước khi gửi lên Claude`);
  }
  return kept.map((r) => r.map((f) => (f.includes(",") || f.includes('"') ? '"' + f.replace(/"/g, '""') + '"' : f)).join(",")).join("\n");
}

// ---------- Khối 2: BTK rows với ô xác nhận cột ----------
const btkList = document.getElementById("btkList");
const btkData = new Map(); // id -> { header, rows }
let btkCounter = 0;

function addBtkRow() {
  btkCounter += 1;
  const id = btkCounter;
  const row = document.createElement("div");
  row.className = "btk-row";
  row.dataset.id = id;
  row.innerHTML = `
    <div class="row">
      <input type="text" class="btk-name" placeholder="Tên BTK (VD: Thương hiệu)" value="BTK ${id}" />
      <input type="file" class="btk-file" accept=".csv,.txt" />
      <button type="button" class="remove-btk">Xoá</button>
    </div>
    <div class="btk-col-confirm hidden">
      <label>Cột Từ khoá: <select class="col-keyword"></select></label>
      <label>Cột TOP hiện tại: <select class="col-top"></select></label>
      <label>Cột URL: <select class="col-url"></select></label>
    </div>
  `;
  row.querySelector(".remove-btk").addEventListener("click", () => {
    if (btkList.children.length > 1) {
      btkData.delete(id);
      row.remove();
    }
  });
  row.querySelector(".btk-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const confirmBox = row.querySelector(".btk-col-confirm");
    if (!file) {
      confirmBox.classList.add("hidden");
      btkData.delete(id);
      return;
    }
    const text = await readFileAsText(file);
    const parsed = parseCSV(text);
    if (parsed.length < 2) {
      setStatus(document.getElementById("freeStatus"), `File BTK "${row.querySelector(".btk-name").value}" không đọc được dữ liệu.`, "error");
      confirmBox.classList.add("hidden");
      return;
    }
    const header = parsed[0];
    btkData.set(id, { header, rows: parsed.slice(1) });

    const options = header.map((h, i) => `<option value="${i}">${i}: ${esc(h)}</option>`).join("");
    const selKeyword = row.querySelector(".col-keyword");
    const selTop = row.querySelector(".col-top");
    const selUrl = row.querySelector(".col-url");
    selKeyword.innerHTML = options;
    selTop.innerHTML = options;
    selUrl.innerHTML = options;
    const gKeyword = guessKeywordColumn(header);
    const gTop = guessTopColumn(header);
    const gUrl = guessUrlColumn(header);
    if (gKeyword !== -1) selKeyword.value = gKeyword;
    if (gTop !== -1) selTop.value = gTop;
    if (gUrl !== -1) selUrl.value = gUrl;
    confirmBox.classList.remove("hidden");
  });
  btkList.appendChild(row);
}
document.getElementById("addBtkBtn").addEventListener("click", addBtkRow);
addBtkRow();

/**
 * Bước 1-4 của skill top-rank-backlink-analysis: thống kê TOP theo BTK,
 * %keyword_in_top10 theo URL, lọc ứng viên. 100% JS thuần, đồng bộ,
 * KHÔNG gọi API — cột đã được người dùng xác nhận qua dropdown ở Khối 2.
 */
function computeStage1Free(btkBlocks) {
  const topStats = [];
  const candidates = [];
  const top1to10 = [];

  for (const { name, header, rows, keywordIdx, urlIdx, topIdx } of btkBlocks) {
    const dataRows = rows
      .map((r) => ({
        keyword: (r[keywordIdx] || "").trim(),
        url: (r[urlIdx] || "").trim(),
        top: parseTopValue(r[topIdx]),
      }))
      .filter((r) => r.keyword);

    const stat = { btk: name, tongSo: 0, top1_3: 0, top1_5: 0, top1_10: 0, top10_20: 0, top20_30: 0, outTop30: 0 };
    for (const r of dataRows) {
      stat.tongSo++;
      if (r.top != null && r.top <= 3) stat.top1_3++;
      if (r.top != null && r.top <= 5) stat.top1_5++;
      if (r.top != null && r.top <= 10) stat.top1_10++;
      else if (r.top != null && r.top <= 20) stat.top10_20++;
      else if (r.top != null && r.top <= 30) stat.top20_30++;
      else stat.outTop30++;
    }
    topStats.push(stat);

    const byUrl = new Map();
    for (const r of dataRows) {
      if (!r.url) continue;
      if (!byUrl.has(r.url)) byUrl.set(r.url, []);
      byUrl.get(r.url).push(r);
    }
    const urlPercentTop10 = new Map();
    for (const [url, items] of byUrl) {
      const top10Count = items.filter((r) => r.top != null && r.top <= 10).length;
      urlPercentTop10.set(url, items.length ? top10Count / items.length : 0);
    }

    for (const r of dataRows) {
      if (r.top != null && r.top > 10 && r.top <= 20) {
        candidates.push({ btk: name, anchor: r.keyword, url: r.url, top: r.top, lyDo: "TOP 10-20 (Bước 3)" });
      } else if (r.top != null && r.top > 20 && r.top <= 30) {
        const pct = urlPercentTop10.get(r.url) || 0;
        if (pct > 0.5) {
          candidates.push({
            btk: name,
            anchor: r.keyword,
            url: r.url,
            top: r.top,
            lyDo: `TOP 20-30, URL "gần thắng" (${Math.round(pct * 100)}% từ khoá khác đã TOP10) — Bước 4`,
          });
        }
      } else if (r.top != null && r.top <= 10) {
        top1to10.push({ btk: name, anchor: r.keyword, url: r.url, top: r.top });
      }
    }
  }

  return { topStats, candidates, top1to10 };
}

let freeResult = null;

document.getElementById("runFreeBtn").addEventListener("click", () => {
  const statusEl = document.getElementById("freeStatus");
  try {
    const rows = Array.from(btkList.querySelectorAll(".btk-row"));
    const btkBlocks = [];
    for (const row of rows) {
      const id = Number(row.dataset.id);
      const data = btkData.get(id);
      if (!data) continue;
      const name = row.querySelector(".btk-name").value.trim() || "BTK";
      const keywordIdx = Number(row.querySelector(".col-keyword").value);
      const topIdx = Number(row.querySelector(".col-top").value);
      const urlIdx = Number(row.querySelector(".col-url").value);
      btkBlocks.push({ name, header: data.header, rows: data.rows, keywordIdx, topIdx, urlIdx });
    }
    if (btkBlocks.length === 0) throw new Error("Cần upload ít nhất 1 file check TOP và xác nhận cột.");

    freeResult = computeStage1Free(btkBlocks);
    if (freeResult.candidates.length === 0) {
      setStatus(
        statusEl,
        "Không có từ khoá nào đạt điều kiện đề xuất offpage (TOP 10-20 hoặc TOP 20-30 ở URL gần thắng). Kiểm tra lại cột đã chọn hoặc file check TOP.",
        "error"
      );
    } else {
      setStatus(statusEl, `Xong — ${freeResult.candidates.length} từ khoá ứng viên. Không tốn phí.`, "ok");
    }

    renderFreeResult(freeResult);
    document.getElementById("khoi2-results").classList.remove("hidden");
    document.getElementById("khoi3").classList.remove("hidden");
  } catch (err) {
    setStatus(statusEl, "Lỗi: " + err.message, "error");
  }
});

function renderFreeResult(result) {
  const statsTable = document.getElementById("topStatsTable");
  statsTable.innerHTML =
    "<tr><th>BTK</th><th>Tổng từ</th><th>TOP 1-3</th><th>TOP 1-5</th><th>TOP 1-10</th><th>TOP 10-20</th><th>TOP 20-30</th><th>Out TOP 30</th></tr>" +
    result.topStats
      .map(
        (r) =>
          `<tr><td>${esc(r.btk)}</td><td>${r.tongSo}</td><td>${r.top1_3}</td><td>${r.top1_5}</td><td>${r.top1_10}</td><td>${r.top10_20}</td><td>${r.top20_30}</td><td>${r.outTop30}</td></tr>`
      )
      .join("");

  const candTable = document.getElementById("candidatesTable");
  candTable.innerHTML =
    "<tr><th>#</th><th>BTK</th><th>Anchor</th><th>URL</th><th>TOP</th><th>Lý do</th></tr>" +
    result.candidates
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${esc(r.btk)}</td><td>${esc(r.anchor)}</td><td>${esc(r.url)}</td><td>${r.top}</td><td>${esc(
            r.lyDo
          )}</td></tr>`
      )
      .join("");
}

// ---------- Khối 3: API key ----------
const apiKeyInput = document.getElementById("apiKey");
const saveKeyCheckbox = document.getElementById("saveKey");
const modelSelect = document.getElementById("model");

(function loadSavedKey() {
  const saved = localStorage.getItem("offpage_api_key");
  if (saved) apiKeyInput.value = saved;
})();
apiKeyInput.addEventListener("change", () => {
  if (saveKeyCheckbox.checked) localStorage.setItem("offpage_api_key", apiKeyInput.value.trim());
});
saveKeyCheckbox.addEventListener("change", () => {
  if (!saveKeyCheckbox.checked) localStorage.removeItem("offpage_api_key");
});
function getApiKey() {
  return apiKeyInput.value.trim();
}

async function callClaude({ system, userText, maxTokens, jsonSchema }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chưa nhập API key ở Khối 3.");
  const model = modelSelect.value;

  const body = {
    model,
    max_tokens: maxTokens,
    system: [{ type: "text", text: system }],
    messages: [{ role: "user", content: userText }],
    output_config: { format: { type: "json_schema", schema: jsonSchema } },
  };

  const resp = await fetch(CONFIG.ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": CONFIG.ANTHROPIC_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (!resp.ok) {
    const msg = data?.error?.message || `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  if (data.stop_reason === "refusal") {
    throw new Error("Claude từ chối xử lý yêu cầu này (an toàn nội dung). Thử lại hoặc kiểm tra dữ liệu đầu vào.");
  }
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("Không nhận được kết quả hợp lệ từ Claude.");
  return JSON.parse(textBlock.text);
}

// ---------- JSON Schemas ----------
const STAGE1_SCHEMA = {
  type: "object",
  properties: {
    anchorClusters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          btk: { type: "string" },
          anchor1: { type: "string" },
          url1: { type: "string" },
          anchor2: { type: "string" },
          url2: { type: "string" },
          mucGhep: { type: "string", enum: ["Mạnh", "Mạnh-khá", "Bridge"] },
          lyDo: { type: "string" },
        },
        required: ["btk", "anchor1", "url1", "anchor2", "url2", "mucGhep", "lyDo"],
        additionalProperties: false,
      },
    },
    duPhong: {
      type: "array",
      items: {
        type: "object",
        properties: {
          anchor: { type: "string" },
          url: { type: "string" },
          lyDo: { type: "string" },
        },
        required: ["anchor", "url", "lyDo"],
        additionalProperties: false,
      },
    },
  },
  required: ["anchorClusters", "duPhong"],
  additionalProperties: false,
};

const STAGE2_SCHEMA = {
  type: "object",
  properties: {
    baoDaChon: {
      type: "array",
      items: {
        type: "object",
        properties: {
          domain: { type: "string" },
          dr: { type: "string" },
          gia: { type: "integer" },
          anchor1: { type: "string" },
          url1: { type: "string" },
          anchor2: { type: "string" },
          url2: { type: "string" },
          ghiChu: { type: "string" },
        },
        required: ["domain", "dr", "gia", "anchor1", "url1", "anchor2", "url2", "ghiChu"],
        additionalProperties: false,
      },
    },
    gpDaChon: {
      type: "array",
      items: {
        type: "object",
        properties: {
          domain: { type: "string" },
          gia: { type: "integer" },
          anchor1: { type: "string" },
          url1: { type: "string" },
          anchor2: { type: "string" },
          url2: { type: "string" },
          ghiChu: { type: "string" },
        },
        required: ["domain", "gia", "anchor1", "url1", "anchor2", "url2", "ghiChu"],
        additionalProperties: false,
      },
    },
    tongNganSachBao: { type: "integer" },
    tongNganSachGp: { type: "integer" },
    ghiChuChung: { type: "string" },
  },
  required: ["baoDaChon", "gpDaChon", "tongNganSachBao", "tongNganSachGp", "ghiChuChung"],
  additionalProperties: false,
};

// ---------- System prompts ----------
const STAGE1_SYSTEM = `Bạn là chuyên gia kỹ thuật SEO Offpage (tương đương agent seo-offpage-technical trong workspace này).

Bước 1-4 của quy trình (thống kê TOP theo BTK, lọc ứng viên TOP10-20 và TOP20-30 "URL gần thắng") ĐÃ được tính sẵn bằng JavaScript thuần ở phía client — không cần làm lại, không cần kiểm tra lại số liệu đó. Bạn chỉ nhận danh sách "ứng viên đã lọc sẵn" (mảng candidates) và nhiệm vụ của bạn CHỈ là 2 việc dưới đây.

## Việc 1 — Xét KPI-aware (chỉ khi có mảng top1to10 và file KPI đính kèm)
Nếu có mảng "top1to10" (các từ khoá đã TOP1-10, do JS liệt kê sẵn theo BTK) và có file KPI, đối chiếu: nếu mốc KPI gần hơn (VD TOP5) của 1 BTK chưa đạt dù nhiều từ đã TOP1-3, hãy CHỌN THÊM một số từ khoá phù hợp nhất từ top1to10 của đúng BTK đó (ưu tiên từ đang gần ngưỡng KPI nhất) làm ứng viên bổ sung, gộp vào danh sách ứng viên để ghép cụm ở Việc 2, ghi lý do "KPI-aware" rõ ràng. Nếu không có file KPI hoặc top1to10 rỗng, bỏ qua việc này hoàn toàn.

## Việc 2 — Ghép cụm anchor (2 anchor/bài)
QUY TẮC BẮT BUỘC (kiểm tra trước mọi quy tắc khác): 2 anchor trong CÙNG 1 cụm phải trỏ 2 URL đích KHÁC NHAU — không bao giờ ghép 2 anchor cùng URL vào chung 1 bài. Nếu 1 URL có nhiều anchor tốt (biến thể từ khoá), mỗi anchor phải "xuất khẩu" ghép với anchor thuộc URL khác, ở các cụm khác nhau.
Điều kiện ghép hợp lý (đạt 1 trong 2):
- Cùng đối tượng/ngữ cảnh cụ thể (không chỉ cùng ngành lớn) => nhãn "Mạnh".
- Khác đối tượng cụ thể nhưng gộp tự nhiên trong bài dạng tổng hợp/use-case liên quan => nhãn "Mạnh-khá".
Nếu không tìm được đối tác hợp lý nào cùng đối tượng/ngữ cảnh nhưng vẫn buộc phải ghép (hết lựa chọn, do dữ liệu hạn chế) => nhãn "Bridge", ghi rõ lý do đây là giới hạn thực tế của dữ liệu.
KHÔNG ép ghép 2 chủ đề hoàn toàn lạc nhau nếu còn cách khác — nhưng nếu thực sự hết lựa chọn thì để Bridge, không bỏ sót anchor.
Trước khi trả kết quả: rà lại toàn bộ, đảm bảo KHÔNG có dòng nào url1 === url2.

## Dự phòng
Anchor tốt nhưng chưa dùng được (hết đối tác ghép, URL đã đủ 2 anchor...) đưa vào mảng duPhong kèm lý do.

Chỉ trả về JSON đúng schema đã cho, không thêm giải thích ngoài JSON.`;

const STAGE2_SYSTEM = `Bạn là PM quản lý dự án Offpage (tương đương agent offpage-pm trong workspace này).
Nhiệm vụ: từ danh sách cụm anchor đã ghép (JSON) + danh sách domain báo/guest post (do người dùng cung cấp — có thể là danh sách họ tự lọc sẵn, hoặc bảng giá sống của công ty), chọn domain báo + guest post đúng mục tiêu số lượng và ngân sách.

Người dùng cho trước: x = số báo mong muốn, y = tổng ngân sách báo (= x × giá mong muốn/bài); z = số GP mong muốn, n = tổng ngân sách GP. Đây chỉ là MỤC TIÊU tham khảo — không ép chọn đủ x/z bằng mọi giá nếu danh sách domain không đủ lựa chọn phù hợp.

## Nguyên tắc lọc domain
- Ưu tiên domain dofollow ("Link Do" = 2 hoặc tương đương). Domain "Link Do = 0" hoặc cần mua thêm mới dofollow thì loại trừ khi ngân sách cho phép mua thêm và đã cộng đúng chi phí ẩn đó vào tổng.
- Loại domain có Note "tạm dừng nhận", "dừng bán", hoặc mô hình tính phí khác theo bài (VD textlink theo tháng, gói theo năm) trừ khi không còn lựa chọn nào khác.
- Với guest post: lọc theo đúng danh mục ngành của website khách nếu danh sách có cột danh mục phù hợp. Nếu không có danh mục ngành đúng nghĩa, dùng nhóm "Tin tổng hợp (đa ngành)" làm phương án thay thế hợp lý (site đa chủ đề, chấp nhận nhiều topic).
- Domain thuộc mảng coin/forex: cộng phụ phí +20% vào đơn giá trước khi tính tổng.

## Chọn theo ngân sách (bài toán subset selection)
1. Kiểm tra tính khả thi: giá trung bình mục tiêu = y/x (báo) hoặc n/z (GP). Nếu phi thực tế so với giá thực tế trong danh sách, vẫn chọn tốt nhất có thể nhưng ghi rõ trong ghiChuChung rằng không hoàn toàn khả thi.
2. Sắp xếp theo hiệu quả DR/Giá (báo) hoặc DA-DR/Giá (GP) giảm dần, ưu tiên khung giá phổ biến: báo 1.000.000–2.000.000đ/bài, GP 500.000–1.000.000đ/bài (khung tham chiếu, không cứng nhắc nếu ngân sách khác).
3. Chọn đúng x báo và z GP nếu danh sách đủ lựa chọn phù hợp, sao cho tổng giá gần y/n nhất có thể, độ lệch mục tiêu <=10%. Nếu không đạt được (thiếu domain phù hợp hoặc lệch ngân sách), chọn phương án gần nhất và ghi rõ lý do trong ghiChuChung — không tự ý chọn thêm domain không phù hợp chỉ để đủ số.
4. Gán đúng 1 cụm anchor (2 anchor, 2 URL khác nhau — GIỮ NGUYÊN cặp đã ghép ở bước 1, không tự ghép lại) cho mỗi domain đã chọn. Không gán trùng 1 cụm anchor cho 2 domain khác nhau. Ưu tiên gán cụm "Mạnh"/"Mạnh-khá" cho báo (chi phí cao hơn, rủi ro thương hiệu cao hơn), để cụm "Bridge" xuống guest post nếu có thể.
5. Nếu số cụm anchor nhiều hơn số domain có thể chọn trong ngân sách, phần dư không đưa vào baoDaChon/gpDaChon — ghi rõ số lượng còn dư trong ghiChuChung.

Chỉ trả về JSON đúng schema đã cho, không thêm giải thích ngoài JSON.`;

// ---------- Khối 3a: ghép cụm anchor ----------
let clusterResult = null;

document.getElementById("runClusterBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("clusterStatus");
  const btn = document.getElementById("runClusterBtn");
  try {
    if (!freeResult) throw new Error("Cần chạy Khối 2 trước.");
    if (!getApiKey()) throw new Error("Vui lòng nhập API key ở Khối 3 trước.");

    const kpiFile = document.getElementById("kpiFile").files[0];
    const kpiText = kpiFile ? await readFileAsText(kpiFile) : "";
    const projectName = document.getElementById("projectName").value.trim() || "(chưa đặt tên)";

    let userText = `Dự án: ${projectName}\n\n### Danh sách ứng viên đã lọc sẵn (Bước 1-4 đã tính bằng JS, tổng ${freeResult.candidates.length} ứng viên)\n${JSON.stringify(
      freeResult.candidates
    )}`;
    if (kpiText) {
      userText += `\n\n### Danh sách từ khoá đã TOP1-10 theo BTK (chỉ dùng để xét KPI-aware nếu cần)\n${JSON.stringify(
        freeResult.top1to10
      )}\n\n### File KPI\n${kpiText}`;
    }

    btn.disabled = true;
    setStatus(statusEl, "Đang gọi Claude để ghép cụm anchor...", "loading");

    const llmResult = await callClaude({
      system: STAGE1_SYSTEM,
      userText,
      maxTokens: CONFIG.MAX_TOKENS_STAGE1,
      jsonSchema: STAGE1_SCHEMA,
    });

    clusterResult = { anchorClusters: llmResult.anchorClusters, duPhong: llmResult.duPhong };
    renderClusterResult(clusterResult);
    setStatus(statusEl, "Xong.", "ok");
    document.getElementById("khoi3b").classList.remove("hidden");
  } catch (err) {
    setStatus(statusEl, "Lỗi: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

function renderClusterResult(result) {
  const clusterTable = document.getElementById("anchorClusterTable");
  clusterTable.innerHTML =
    "<tr><th>#</th><th>BTK</th><th>Anchor 1</th><th>URL 1</th><th>Anchor 2</th><th>URL 2</th><th>Mức ghép</th><th>Lý do</th></tr>" +
    result.anchorClusters
      .map(
        (r, i) =>
          `<tr><td>${i + 1}</td><td>${esc(r.btk)}</td><td>${esc(r.anchor1)}</td><td>${esc(r.url1)}</td><td>${esc(
            r.anchor2
          )}</td><td>${esc(r.url2)}</td><td class="${mucGhepClass(r.mucGhep)}">${esc(r.mucGhep)}</td><td>${esc(
            r.lyDo
          )}</td></tr>`
      )
      .join("");

  const duPhongTable = document.getElementById("duPhongTable");
  duPhongTable.innerHTML =
    "<tr><th>Anchor</th><th>URL</th><th>Lý do</th></tr>" +
    (result.duPhong || []).map((r) => `<tr><td>${esc(r.anchor)}</td><td>${esc(r.url)}</td><td>${esc(r.lyDo)}</td></tr>`).join("");
}

function mucGhepClass(m) {
  if (m === "Mạnh") return "tag-manh";
  if (m === "Mạnh-khá") return "tag-manhkha";
  return "tag-bridge";
}

// ---------- Khối 3b: chọn domain theo ngân sách (live preview) ----------
function updateBudgetPreview() {
  const el = document.getElementById("tongNganSachPreview");
  if (!el) return;
  const baoSoLuong = Number(document.getElementById("baoSoLuong").value) || 0;
  const baoNganSachMoiBai = Number(document.getElementById("baoNganSachMoiBai").value) || 0;
  const gpSoLuong = Number(document.getElementById("gpSoLuong").value) || 0;
  const gpNganSachMoiBai = Number(document.getElementById("gpNganSachMoiBai").value) || 0;
  const tongBao = baoSoLuong * baoNganSachMoiBai;
  const tongGp = gpSoLuong * gpNganSachMoiBai;
  el.textContent = `Tổng ngân sách dự kiến: ${(tongBao + tongGp).toLocaleString("vi-VN")}đ (Báo: ${tongBao.toLocaleString(
    "vi-VN"
  )}đ, GP: ${tongGp.toLocaleString("vi-VN")}đ)`;
}
["baoSoLuong", "baoNganSachMoiBai", "gpSoLuong", "gpNganSachMoiBai"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", updateBudgetPreview);
});
updateBudgetPreview();

let stage2Result = null;

document.getElementById("runStage2Btn").addEventListener("click", async () => {
  const statusEl = document.getElementById("stage2Status");
  const btn = document.getElementById("runStage2Btn");
  try {
    if (!clusterResult) throw new Error("Cần ghép cụm anchor (3a) trước.");
    if (!getApiKey()) throw new Error("Vui lòng nhập API key ở Khối 3 trước.");

    btn.disabled = true;

    const baoListFile = document.getElementById("baoListFile").files[0];
    const gpListFile = document.getElementById("gpListFile").files[0];

    let baoCsvRaw, gpCsvRaw, baoSource, gpSource;
    if (baoListFile) {
      baoCsvRaw = await readFileAsText(baoListFile);
      baoSource = "danh sách bạn tự cung cấp";
    }
    if (gpListFile) {
      gpCsvRaw = await readFileAsText(gpListFile);
      gpSource = "danh sách bạn tự cung cấp";
    }
    if (!baoListFile || !gpListFile) {
      setStatus(statusEl, "Đang tải bảng giá sống từ Google Sheet...", "loading");
      const [baoLive, gpLive] = await Promise.all([
        baoListFile ? Promise.resolve(null) : fetchGoogleSheetCsv(CONFIG.BAO_SHEET_CSV_URL),
        gpListFile ? Promise.resolve(null) : fetchGoogleSheetCsv(CONFIG.GP_SHEET_CSV_URL),
      ]);
      if (baoLive != null) {
        baoCsvRaw = baoLive;
        baoSource = "Google Sheet giá báo chung của công ty";
      }
      if (gpLive != null) {
        gpCsvRaw = gpLive;
        gpSource = "Google Sheet giá guest post chung của công ty";
      }
    }

    const baoCsv = preFilterExcludedRows(baoCsvRaw);
    const gpCsv = preFilterExcludedRows(gpCsvRaw);

    const baoSoLuong = Number(document.getElementById("baoSoLuong").value) || 0;
    const baoNganSachMoiBai = Number(document.getElementById("baoNganSachMoiBai").value) || 0;
    const gpSoLuong = Number(document.getElementById("gpSoLuong").value) || 0;
    const gpNganSachMoiBai = Number(document.getElementById("gpNganSachMoiBai").value) || 0;
    const baoTongNganSach = baoSoLuong * baoNganSachMoiBai;
    const gpTongNganSach = gpSoLuong * gpNganSachMoiBai;

    const userText = `Mục tiêu báo: x = ${baoSoLuong} bài, ngân sách mong muốn/bài ~${baoNganSachMoiBai.toLocaleString(
      "vi-VN"
    )}đ => tổng ngân sách báo y = ${baoTongNganSach.toLocaleString("vi-VN")}đ.
Mục tiêu guest post: z = ${gpSoLuong} bài, ngân sách mong muốn/bài ~${gpNganSachMoiBai.toLocaleString(
      "vi-VN"
    )}đ => tổng ngân sách GP n = ${gpTongNganSach.toLocaleString("vi-VN")}đ.

### Cụm anchor đã ghép (output 3a, JSON)
${JSON.stringify(clusterResult.anchorClusters)}

### Bảng giá báo PR dofollow (nguồn: ${baoSource})
${baoCsv}

### Bảng giá guest post (nguồn: ${gpSource})
${gpCsv}`;

    const estTokens = estimateTokens(userText);
    setStatus(
      statusEl,
      `Đang chọn domain theo ngân sách (~${estTokens.toLocaleString("vi-VN")} token input, có thể mất 1-2 phút)...`,
      "loading"
    );

    stage2Result = await callClaude({
      system: STAGE2_SYSTEM,
      userText,
      maxTokens: CONFIG.MAX_TOKENS_STAGE2,
      jsonSchema: STAGE2_SCHEMA,
    });

    renderStage2(stage2Result);
    setStatus(statusEl, "Xong.", "ok");
    document.getElementById("khoi3-results").classList.remove("hidden");
  } catch (err) {
    setStatus(statusEl, "Lỗi: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

function renderStage2(result) {
  const baoTable = document.getElementById("baoTable");
  baoTable.innerHTML =
    "<caption style='text-align:left;font-weight:600;margin-bottom:.4rem'>Danh sách báo</caption>" +
    "<tr><th>Domain</th><th>DR</th><th>Giá</th><th>Anchor 1</th><th>URL 1</th><th>Anchor 2</th><th>URL 2</th><th>Ghi chú</th></tr>" +
    result.baoDaChon
      .map(
        (r) =>
          `<tr><td>${esc(r.domain)}</td><td>${esc(r.dr)}</td><td>${r.gia.toLocaleString("vi-VN")}đ</td><td>${esc(
            r.anchor1
          )}</td><td>${esc(r.url1)}</td><td>${esc(r.anchor2)}</td><td>${esc(r.url2)}</td><td>${esc(r.ghiChu)}</td></tr>`
      )
      .join("");

  const gpTable = document.getElementById("gpTable");
  gpTable.innerHTML =
    "<caption style='text-align:left;font-weight:600;margin-bottom:.4rem'>Danh sách guest post</caption>" +
    "<tr><th>Domain</th><th>Giá</th><th>Anchor 1</th><th>URL 1</th><th>Anchor 2</th><th>URL 2</th><th>Ghi chú</th></tr>" +
    result.gpDaChon
      .map(
        (r) =>
          `<tr><td>${esc(r.domain)}</td><td>${r.gia.toLocaleString("vi-VN")}đ</td><td>${esc(r.anchor1)}</td><td>${esc(
            r.url1
          )}</td><td>${esc(r.anchor2)}</td><td>${esc(r.url2)}</td><td>${esc(r.ghiChu)}</td></tr>`
      )
      .join("");

  const tong = result.tongNganSachBao + result.tongNganSachGp;
  document.getElementById("tongNganSach").innerHTML =
    `Tổng ngân sách: <strong>${tong.toLocaleString("vi-VN")}đ</strong> ` +
    `(Báo: ${result.tongNganSachBao.toLocaleString("vi-VN")}đ, GP: ${result.tongNganSachGp.toLocaleString(
      "vi-VN"
    )}đ)<br/><span class="hint">${esc(result.ghiChuChung)}</span>`;
}

// ---------- Export xlsx ----------
document.getElementById("exportBtn").addEventListener("click", () => {
  if (!clusterResult || !stage2Result) return;
  const wb = XLSX.utils.book_new();

  const overview = [
    ["KẾ HOẠCH OFFPAGE"],
    ["Tổng ngân sách", (stage2Result.tongNganSachBao + stage2Result.tongNganSachGp).toLocaleString("vi-VN") + "đ"],
    ["Ghi chú", stage2Result.ghiChuChung],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), "Tổng quan");

  const anchorRows = [
    ["BTK", "Anchor 1", "URL 1", "Anchor 2", "URL 2", "Mức ghép", "Lý do"],
    ...clusterResult.anchorClusters.map((r) => [r.btk, r.anchor1, r.url1, r.anchor2, r.url2, r.mucGhep, r.lyDo]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(anchorRows), "Cụm Anchor");

  const baoRows = [
    ["Domain", "DR", "Giá", "Anchor 1", "URL 1", "Anchor 2", "URL 2", "Ghi chú"],
    ...stage2Result.baoDaChon.map((r) => [r.domain, r.dr, r.gia, r.anchor1, r.url1, r.anchor2, r.url2, r.ghiChu]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(baoRows), "Báo");

  const gpRows = [
    ["Domain", "Giá", "Anchor 1", "URL 1", "Anchor 2", "URL 2", "Ghi chú"],
    ...stage2Result.gpDaChon.map((r) => [r.domain, r.gia, r.anchor1, r.url1, r.anchor2, r.url2, r.ghiChu]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(gpRows), "Guest Post");

  const projectName = document.getElementById("projectName").value.trim() || "DuAn";
  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${projectName.replace(/\s+/g, "")}-KeHoachOffpage-${today}.xlsx`);
});
