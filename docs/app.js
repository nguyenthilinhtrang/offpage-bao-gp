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

// ---------- API key persistence ----------
const apiKeyInput = document.getElementById("apiKey");
const saveKeyCheckbox = document.getElementById("saveKey");
const modelSelect = document.getElementById("model");

(function loadSavedKey() {
  const saved = localStorage.getItem("offpage_api_key");
  if (saved) apiKeyInput.value = saved;
})();

apiKeyInput.addEventListener("change", () => {
  if (saveKeyCheckbox.checked) {
    localStorage.setItem("offpage_api_key", apiKeyInput.value.trim());
  }
});
saveKeyCheckbox.addEventListener("change", () => {
  if (!saveKeyCheckbox.checked) localStorage.removeItem("offpage_api_key");
});

function getApiKey() {
  return apiKeyInput.value.trim();
}

// ---------- BTK dynamic list ----------
const btkList = document.getElementById("btkList");
let btkCounter = 0;

function addBtkRow() {
  btkCounter += 1;
  const id = btkCounter;
  const row = document.createElement("div");
  row.className = "btk-row";
  row.dataset.id = id;
  row.innerHTML = `
    <input type="text" class="btk-name" placeholder="Tên BTK (VD: Thương hiệu)" value="BTK ${id}" />
    <input type="file" class="btk-file" accept=".csv,.txt" />
    <button type="button" class="remove-btk">Xoá</button>
  `;
  row.querySelector(".remove-btk").addEventListener("click", () => {
    if (btkList.children.length > 1) row.remove();
  });
  btkList.appendChild(row);
}
document.getElementById("addBtkBtn").addEventListener("click", addBtkRow);
addBtkRow();

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

async function fetchGoogleSheetCsv(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Không tải được bảng giá (HTTP ${resp.status})`);
  return await resp.text();
}

// ---------- Anthropic call ----------
async function callClaude({ system, userText, maxTokens, jsonSchema }) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Chưa nhập API key.");
  const model = modelSelect.value;

  const body = {
    model,
    max_tokens: maxTokens,
    system: [{ type: "text", text: system }],
    messages: [{ role: "user", content: userText }],
    output_config: {
      format: { type: "json_schema", schema: jsonSchema },
    },
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
    throw new Error(
      "Claude từ chối xử lý yêu cầu này (an toàn nội dung). Thử lại hoặc kiểm tra dữ liệu đầu vào."
    );
  }
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error("Không nhận được kết quả hợp lệ từ Claude.");
  return JSON.parse(textBlock.text);
}

// ---------- JSON Schemas ----------
const STAGE1_SCHEMA = {
  type: "object",
  properties: {
    topStats: {
      type: "array",
      items: {
        type: "object",
        properties: {
          btk: { type: "string" },
          tongSo: { type: "integer" },
          top1_3: { type: "integer" },
          top1_5: { type: "integer" },
          top1_10: { type: "integer" },
          top10_20: { type: "integer" },
          top20_30: { type: "integer" },
          outTop30: { type: "integer" },
        },
        required: ["btk", "tongSo", "top1_3", "top1_5", "top1_10", "top10_20", "top20_30", "outTop30"],
        additionalProperties: false,
      },
    },
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
  required: ["topStats", "anchorClusters", "duPhong"],
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

// ---------- System prompts (condensed from .claude/skills) ----------
const STAGE1_SYSTEM = `Bạn là chuyên gia kỹ thuật SEO Offpage (tương đương agent seo-offpage-technical trong workspace này).
Nhiệm vụ: phân tích (các) file check TOP người dùng cung cấp, rồi ghép các anchor text thành từng cụm 2 anchor/bài.

## Bước 1-2: Đọc & thống kê theo BTK
Mỗi khối dữ liệu người dùng gửi tương ứng 1 BTK (bộ từ khoá), tên BTK đã cho kèm theo. Tự nhận diện cột theo alias:
- Từ khoá: "Từ khoá"/"Keyword"/"Anchor"
- URL: "URL"/"Link"/"Trang đích"
- TOP hiện tại: "TOP"/"Vị trí"/"Position"/"Rank" (rỗng/"-"/">30" => out TOP 30)
Với mỗi BTK, đếm số từ khoá theo khoảng: TOP 1-3, TOP 1-5 (cộng dồn), TOP 1-10 (cộng dồn), TOP 10-20, TOP 20-30, Out TOP 30.

## Bước 3: Lọc từ khoá ưu tiên
- Ưu tiên đề xuất: TOP 10-20.
- Cân nhắc thêm: TOP 20-30 nếu URL chứa từ đó có nhiều từ khác đã TOP 10 (xem Bước 4).
- Loại: out TOP 30 — offpage không có tác động ở khoảng cách xa.
- Từ đã TOP 1-10 mặc định KHÔNG đề xuất, TRỪ KHI có file KPI cho thấy mốc KPI gần hơn (VD TOP5) chưa đạt dù đã TOP1-3 rộng — trường hợp này vẫn ưu tiên đề xuất để đóng gap KPI, ghi rõ lý do "KPI-aware" trong lyDo.

## Bước 4: Phân tích theo URL
%keyword_in_top10 = số từ TOP1-10 / tổng từ trỏ về URL đó.
- URL có %keyword_in_top10 > 50% nhưng các từ còn lại đang TOP 10-30 => ưu tiên cao, offpage cho các từ còn lại.
- URL không có từ nào TOP10 và toàn bộ out TOP20 => loại khỏi phạm vi.

## Bước 5: Ghép cụm anchor (2 anchor/bài)
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
Nhiệm vụ: từ danh sách cụm anchor đã ghép (JSON) + 2 bảng giá sống (báo PR dofollow, guest post) do người dùng cung cấp, chọn domain báo + guest post đúng ngân sách.

## Nguyên tắc lọc domain
- Ưu tiên domain dofollow ("Link Do" = 2 hoặc tương đương). Domain "Link Do = 0" hoặc cần mua thêm mới dofollow thì loại trừ khi ngân sách cho phép mua thêm và đã cộng đúng chi phí ẩn đó vào tổng.
- Loại domain có Note "tạm dừng nhận", "dừng bán", hoặc mô hình tính phí khác theo bài (VD textlink theo tháng, gói theo năm) trừ khi không còn lựa chọn nào khác.
- Với guest post: lọc theo đúng danh mục ngành của website khách nếu sheet có danh mục phù hợp. Nếu không có danh mục ngành đúng nghĩa, dùng nhóm "Tin tổng hợp (đa ngành)" làm phương án thay thế hợp lý (site đa chủ đề, chấp nhận nhiều topic).
- Domain thuộc mảng coin/forex: cộng phụ phí +20% vào đơn giá trước khi tính tổng.

## Chọn theo ngân sách (bài toán subset selection)
1. Kiểm tra tính khả thi: giá trung bình mục tiêu = ngân sách / số lượng cần chọn. Nếu phi thực tế so với giá thực tế trong sheet, vẫn chọn tốt nhất có thể nhưng ghi rõ trong ghiChuChung rằng không hoàn toàn khả thi.
2. Sắp xếp theo hiệu quả DR/Giá (báo) hoặc DA-DR/Giá (GP) giảm dần, ưu tiên khung giá phổ biến: báo 1.000.000–2.000.000đ/bài, GP 500.000–1.000.000đ/bài (khung tham chiếu, không cứng nhắc nếu ngân sách khác).
3. Chọn tới khi tổng giá gần ngân sách nhất có thể, độ lệch mục tiêu <=10%. Nếu không đạt được, chọn phương án gần nhất và ghi rõ trong ghiChuChung.
4. Gán đúng 1 cụm anchor (2 anchor, 2 URL khác nhau — GIỮ NGUYÊN cặp đã ghép ở bước 1, không tự ghép lại) cho mỗi domain đã chọn. Không gán trùng 1 cụm anchor cho 2 domain khác nhau. Ưu tiên gán cụm "Mạnh"/"Mạnh-khá" cho báo (chi phí cao hơn, rủi ro thương hiệu cao hơn), để cụm "Bridge" xuống guest post nếu có thể.
5. Nếu số cụm anchor nhiều hơn số domain có thể chọn trong ngân sách, phần dư không đưa vào baoDaChon/gpDaChon — ghi rõ số lượng còn dư trong ghiChuChung.

Chỉ trả về JSON đúng schema đã cho, không thêm giải thích ngoài JSON.`;

// ---------- Stage 1 ----------
let stage1Result = null;

document.getElementById("runStage1Btn").addEventListener("click", async () => {
  const statusEl = document.getElementById("stage1Status");
  const btn = document.getElementById("runStage1Btn");
  try {
    if (!getApiKey()) throw new Error("Vui lòng nhập API key ở mục 0 trước.");

    const rows = Array.from(btkList.querySelectorAll(".btk-row"));
    const btkBlocks = [];
    for (const row of rows) {
      const name = row.querySelector(".btk-name").value.trim() || "BTK";
      const file = row.querySelector(".btk-file").files[0];
      if (!file) continue;
      const text = await readFileAsText(file);
      btkBlocks.push(`### BTK: ${name}\n${text}`);
    }
    if (btkBlocks.length === 0) throw new Error("Cần upload ít nhất 1 file check TOP.");

    const kpiFile = document.getElementById("kpiFile").files[0];
    const kpiText = kpiFile ? await readFileAsText(kpiFile) : "";

    const projectName = document.getElementById("projectName").value.trim() || "(chưa đặt tên)";

    let userText = `Dự án: ${projectName}\n\n` + btkBlocks.join("\n\n");
    if (kpiText) userText += `\n\n### File KPI\n${kpiText}`;

    btn.disabled = true;
    setStatus(statusEl, "Đang phân tích TOP + ghép anchor (có thể mất 30–90 giây)...", "loading");

    stage1Result = await callClaude({
      system: STAGE1_SYSTEM,
      userText,
      maxTokens: CONFIG.MAX_TOKENS_STAGE1,
      jsonSchema: STAGE1_SCHEMA,
    });

    renderStage1(stage1Result);
    setStatus(statusEl, "Xong.", "ok");
    document.getElementById("section-stage1-results").classList.remove("hidden");
    document.getElementById("section-step2").classList.remove("hidden");
  } catch (err) {
    setStatus(statusEl, "Lỗi: " + err.message, "error");
  } finally {
    btn.disabled = false;
  }
});

function renderStage1(result) {
  const statsTable = document.getElementById("topStatsTable");
  statsTable.innerHTML =
    "<tr><th>BTK</th><th>Tổng từ</th><th>TOP 1-3</th><th>TOP 1-5</th><th>TOP 1-10</th><th>TOP 10-20</th><th>TOP 20-30</th><th>Out TOP 30</th></tr>" +
    result.topStats
      .map(
        (r) =>
          `<tr><td>${esc(r.btk)}</td><td>${r.tongSo}</td><td>${r.top1_3}</td><td>${r.top1_5}</td><td>${r.top1_10}</td><td>${r.top10_20}</td><td>${r.top20_30}</td><td>${r.outTop30}</td></tr>`
      )
      .join("");

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
    (result.duPhong || [])
      .map((r) => `<tr><td>${esc(r.anchor)}</td><td>${esc(r.url)}</td><td>${esc(r.lyDo)}</td></tr>`)
      .join("");
}

function mucGhepClass(m) {
  if (m === "Mạnh") return "tag-manh";
  if (m === "Mạnh-khá") return "tag-manhkha";
  return "tag-bridge";
}

function esc(s) {
  const div = document.createElement("div");
  div.textContent = s == null ? "" : String(s);
  return div.innerHTML;
}

// ---------- Stage 2 ----------
let stage2Result = null;

document.getElementById("runStage2Btn").addEventListener("click", async () => {
  const statusEl = document.getElementById("stage2Status");
  const btn = document.getElementById("runStage2Btn");
  try {
    if (!stage1Result) throw new Error("Cần chạy bước 1 trước.");
    if (!getApiKey()) throw new Error("Vui lòng nhập API key ở mục 0 trước.");

    btn.disabled = true;
    setStatus(statusEl, "Đang tải bảng giá sống từ Google Sheet...", "loading");
    const [baoCsv, gpCsv] = await Promise.all([
      fetchGoogleSheetCsv(CONFIG.BAO_SHEET_CSV_URL),
      fetchGoogleSheetCsv(CONFIG.GP_SHEET_CSV_URL),
    ]);

    const baoMin = Number(document.getElementById("baoMin").value);
    const baoMax = Number(document.getElementById("baoMax").value);
    const gpBudget = Number(document.getElementById("gpBudget").value);

    const userText = `Ngân sách báo: ${baoMin.toLocaleString("vi-VN")} - ${baoMax.toLocaleString(
      "vi-VN"
    )}đ. Ngân sách guest post: ${gpBudget.toLocaleString("vi-VN")}đ.

### Cụm anchor đã ghép (output bước 1, JSON)
${JSON.stringify(stage1Result.anchorClusters)}

### Bảng giá báo PR dofollow (CSV sống)
${baoCsv}

### Bảng giá guest post (CSV sống)
${gpCsv}`;

    const estTokens = estimateTokens(userText);
    document.getElementById("tokenWarning").textContent = "";
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
    document.getElementById("section-stage2-results").classList.remove("hidden");
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
          )}</td><td>${esc(r.url1)}</td><td>${esc(r.anchor2)}</td><td>${esc(r.url2)}</td><td>${esc(
            r.ghiChu
          )}</td></tr>`
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
  if (!stage1Result || !stage2Result) return;
  const wb = XLSX.utils.book_new();

  const overview = [
    ["KẾ HOẠCH OFFPAGE"],
    [
      "Tổng ngân sách",
      (stage2Result.tongNganSachBao + stage2Result.tongNganSachGp).toLocaleString("vi-VN") + "đ",
    ],
    ["Ghi chú", stage2Result.ghiChuChung],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), "Tổng quan");

  const anchorRows = [
    ["BTK", "Anchor 1", "URL 1", "Anchor 2", "URL 2", "Mức ghép", "Lý do"],
    ...stage1Result.anchorClusters.map((r) => [r.btk, r.anchor1, r.url1, r.anchor2, r.url2, r.mucGhep, r.lyDo]),
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
