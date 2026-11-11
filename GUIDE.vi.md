# Hướng dẫn sử dụng Nexus Kit (So sánh 2 trường hợp)

Tài liệu này hướng dẫn cách cài đặt và vận hành **Nexus Kit** theo 2 kịch bản thực tế:
- **Bên A:** Dự án **mới tinh** (chưa có code, chưa có file).
- **Bên B:** Dự án **đang làm dở** (đã có sẵn mã nguồn, `README.md`, `.gitignore`, cấu trúc thư mục riêng...).

> **Điều kiện trước khi bắt đầu:** Máy đã cài Node.js `>= 18`.  
> *(Khuyên dùng: chạy `npm install -g create-nexus-kit@latest` để dùng lệnh ngắn `nexus-kit` thay cho `npx create-nexus-kit@latest`.)*

---

## 1. Bảng đối chiếu nhanh (1 bên Dự án mới — 1 bên Dự án đang làm dở)

| Hạng mục | Bên A: Dự án mới chưa có gì | Bên B: Dự án đang làm dở đã có file |
| :--- | :--- | :--- |
| **Vị trí đứng trong Terminal** | Đứng ở **thư mục cha** (ví dụ `~/Documents`) | Đứng **bên trong gốc thư mục dự án** (ví dụ `~/Documents/CloudPulse`) |
| **Lệnh khởi tạo** | `npx create-nexus-kit@latest my-app` *(hoặc `nexus-kit my-app`)* | `npx create-nexus-kit@latest .` *(bắt buộc có dấu chấm `.`)* |
| **Ảnh hưởng tới file cũ** | Tạo toàn bộ thư mục & file mới từ đầu | **An toàn:** Tự động `[SKIPPED]` các file đã tồn tại (`README.md`, `.gitignore`...). Chỉ ghi đè nếu bạn chủ động thêm `--force` |
| **Khai báo Tech Stack** | Mở `.specify/constitution.md` và điền công nghệ dự kiến dùng | Mở `.specify/constitution.md`, điền đúng stack hiện tại **+ ghi chú thêm thư mục code thật** (nếu không dùng `src/`) |
| **Kiểm tra sau cài đặt** | `cd my-app && npx create-nexus-kit@latest --doctor` | `npx create-nexus-kit@latest --doctor` (ngay tại gốc dự án) |
| **Cài đặt IDE Adapter cũ** | Tạo mới cả 4 file (`AGENTS.md`, `CLAUDE.md`, Cursor, Copilot) | Nếu dự án đã có sẵn `AGENTS.md` hoặc `CLAUDE.md`, CLI sẽ skip — cần mở file cũ và bổ sung trỏ tới `.specify/constitution.md` và `.agents/skills/` |
| **Khi lập Spec đầu tiên** | Lập spec cho tính năng đầu tiên từ trang giấy trắng | Lập spec cho **tính năng mới / phần sửa đổi tiếp theo** (hoặc task refactor), không cần viết lại spec cho code cũ đã chạy ổn |

---

## 2. Hướng dẫn chi tiết theo từng bên

<table>
<tr>
<th width="50%">Bên A: Dự án mới chưa có gì</th>
<th width="50%">Bên B: Dự án đang làm dở đã có file</th>
</tr>
<tr>
<td valign="top">

### Bước 1A: Tạo thư mục & khung dự án
Đứng ở thư mục cha (ví dụ `~/Documents`), không đứng bên trong repo `nexus-kit`:
```bash
cd ~/Documents
npx create-nexus-kit@latest my-app
cd my-app
```
CLI sẽ tạo trọn bộ:
- `.specify/` (`constitution.md`, `templates/`, `tasks/`)
- `.agents/skills/` (`sdd-planner`, `sdd-coder`, `sdd-verifier`)
- `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/nexus-kit.mdc`, `.github/copilot-instructions.md`
- `src/`, `README.md`, `.gitignore`

### Bước 2A: Khai báo Tech Stack
Mở `.specify/constitution.md`, sửa dòng 4:
```markdown
4. TECH STACK: TypeScript 5, Next.js 15, Zod, Vitest
```

### Bước 3A: Kiểm tra sức khỏe khung
```bash
npx create-nexus-kit@latest --doctor
```
Kết quả chuẩn ban đầu: `0 failed` (chỉ còn 1 `[WARN]` nhắc `.specify/tasks/` chưa có file spec nào — hoàn toàn bình thường).

### Bước 4A: Khởi tạo code dự án (nếu cần) & làm tính năng đầu tiên
Mở thư mục `my-app` bằng AI IDE rồi đi theo **Vòng lặp 4 bước hằng ngày** ở Mục 3 bên dưới.

</td>
<td valign="top">

### Bước 1B: Gắn Nexus Kit vào gốc dự án hiện có
`cd` vào **đúng thư mục gốc** của dự án rồi chạy lệnh **có dấu chấm `.`**:
```bash
cd /duong-dan/den/du-an-cua-ban
npx create-nexus-kit@latest .
```
> **Quan trọng:** Tuyệt đối **không quên dấu `.`** ở cuối. Nếu gõ thiếu dấu `.`, CLI sẽ tự tạo một thư mục con tên `nexus-kit-app/` bên trong dự án của bạn thay vì cài vào gốc.

Các file dự án sẵn có (như `README.md`, `.gitignore`) sẽ hiện `[SKIPPED]` và được giữ nguyên.

### Bước 2B: Khai báo Tech Stack + Đường dẫn thật
Mở `.specify/constitution.md` tại gốc dự án, sửa dòng 4 theo đúng công nghệ đang dùng và ghi rõ nơi chứa code nếu dự án không dùng mỗi `src/`:
```markdown
4. TECH STACK: React 18, Vite, Tailwind CSS, .NET 8 (AWS Lambda), xUnit, AWS SAM
5. REPO STRUCTURE: Frontend nằm ở `frontend/`, Backend nằm ở `backend/`, IaC nằm ở `template.yaml`.
```
> Lưu ý: Chỉ sửa `.specify/constitution.md`, **không sửa** 3 file trong `.agents/skills/*/SKILL.md` kẻo `--doctor` báo lỗi chuỗi tham chiếu.

### Bước 3B: Kiểm tra tích hợp
```bash
npx create-nexus-kit@latest --doctor
```
- Nếu thấy `[WARN]` báo `AGENTS.md` hoặc `CLAUDE.md` thiếu cross-reference (do file cũ của bạn có từ trước và bị skip): mở file đó ra và thêm đường dẫn tới `.specify/constitution.md` và `.agents/skills/`.
- Mục tiêu: đạt **`0 failed`**.

### Bước 4B: Áp dụng từ task tiếp theo trở đi
Mở đúng thư mục gốc dự án trong AI IDE, tạo phiên chat mới (**New Conversation**) để IDE nạp `.agents/skills/`, rồi bắt đầu từ **Mục 3**. Khi tạo spec, ghi rõ `Target Path` đúng với thư mục code thật của dự án.

</td>
</tr>
</table>

---

## 3. Quy trình làm việc hằng ngày (Dùng chung cho cả 2 bên)

Khi dự án đã qua bước cài đặt và đạt `0 failed` với `--doctor`, mọi tính năng mới hoặc chỉnh sửa lớn đều đi theo đúng vòng lặp 4 pha:

```text
[1] sdd-planner (Lập Spec) ➔ [2] Bạn duyệt & --approve (SHA-256) ➔ [3] sdd-coder (Code + Test) ➔ [4] sdd-verifier (Kiểm toán)
```

### Pha 1: Lập kế hoạch (`sdd-planner`)
- **Cách gọi:** Chọn **`sdd-planner`** từ menu gợi ý skill trong khung chat (hoặc nhắn trực tiếp):
  > *"Dùng `sdd-planner` lập spec cho tính năng [mô tả yêu cầu]. Chưa viết code vội."*
- **AI sẽ làm gì:** Đọc `.specify/constitution.md` và `.specify/templates/spec-template.md`, hỏi làm rõ các điểm mơ hồ, khóa ranh giới `In-Scope` / `Out-of-Scope`, thiết kế schema/luồng xử lý và tạo file `.specify/tasks/001-ten-tinh-nang-spec.md` với `Status: Draft`.

### Pha 2: Con người đọc duyệt & đóng dấu (`--approve`)
- Mở file `.specify/tasks/001-ten-tinh-nang-spec.md` để kiểm tra AI đã hiểu đúng yêu cầu và phạm vi chưa.
- Khi đồng ý, chạy lệnh trong terminal tại gốc dự án:
  ```bash
  npx create-nexus-kit@latest --approve .specify/tasks/001-ten-tinh-nang-spec.md
  # Hoặc kèm tên người duyệt:
  npx create-nexus-kit@latest --approve .specify/tasks/001-ten-tinh-nang-spec.md --by "Ten cua ban"
  ```
- **Ý nghĩa của `Approved-Hash` (`sha256:...`):** Là dấu niêm phong nội dung spec. Chỉ cần yêu cầu hoặc `In-Scope` bị sửa đổi sau khi duyệt, hash sẽ không khớp nữa và `sdd-coder` sẽ bị chặn lại.

### Pha 3: Triển khai code & test (`sdd-coder`)
- **Cách gọi:** Chọn **`sdd-coder`** từ menu skill (hoặc nhắn):
  > *"Triển khai spec `.specify/tasks/001-ten-tinh-nang-spec.md`."*
- **AI sẽ làm gì:**
  1. Tự chạy `npx create-nexus-kit@latest --verify-spec .specify/tasks/001-ten-tinh-nang-spec.md` để xác nhận spec đã `Approved` và chưa bị lệch hash.
  2. Chỉ code các hạng mục nằm trong `In-Scope`, viết unit/integration test và chạy test pass.

### Pha 4: Kiểm toán & đóng task (`sdd-verifier`)
- **Cách gọi:** Chọn **`sdd-verifier`** từ menu skill (hoặc nhắn):
  > *"Kiểm toán và đóng spec `.specify/tasks/001-ten-tinh-nang-spec.md`."*
- **AI sẽ làm gì:** Đối chiếu từng tiêu chí `AC-1`..`AC-N` với code và kết quả test thực tế, tick `- [x]`, đổi `Status: Completed` và chạy lại `npx create-nexus-kit@latest --doctor`. *(Việc tick `[x]` và đổi `Status` sang `Completed` không làm hỏng `Approved-Hash`.)*

---

## 4. Thay đổi yêu cầu giữa chừng (Change Management)

Nếu spec đã `--approve` nhưng bạn muốn thêm/bớt yêu cầu:
1. **Không** sửa tay trực tiếp rồi bảo `sdd-coder` code tiếp (sẽ bị lỗi `Spec drift detected!`).
2. Bảo **`sdd-planner`**: cập nhật lại spec, tăng `Version` (ví dụ `1.0.0` → `1.1.0`), ghi tóm tắt vào `## Change Log`, đưa `Status` về `In Review`.
3. Bạn kiểm tra lại và chạy `npx create-nexus-kit@latest --approve <file-spec>` để cấp dấu hash mới, rồi mới cho `sdd-coder` tiếp tục.

---

## 5. Xử lý nhanh các lỗi thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- |
| Chạy `--doctor` ở gốc dự án bị `[FAIL]` toàn bộ dù đã cài | Chạy thiếu dấu `.`, khiến CLI tạo nhầm thư mục con `nexus-kit-app/` | Chạy `npx create-nexus-kit@latest .` ở gốc dự án, chép `nexus-kit-app/.specify/constitution.md` ra `.specify/constitution.md` rồi `rm -rf nexus-kit-app` |
| `[WARN] TECH STACK placeholder is unconfigured` | Dòng 4 trong `.specify/constitution.md` ở gốc dự án vẫn còn chuỗi placeholder mặc định (hoặc bạn chưa lưu file) | Mở `.specify/constitution.md` tại gốc dự án, thay thế hoàn toàn phần `[Người dùng sẽ cập nhật công nghệ cụ thể tại đây]`, lưu file và chạy lại `--doctor` |
| Không thấy `sdd-planner`, `sdd-coder`, `sdd-verifier` trong IDE | Đang mở sai thư mục gốc, chưa tải lại chat sau khi cài, hoặc IDE dùng cơ chế gợi ý khác | Mở đúng thư mục gốc chứa `.agents/skills/`, mở **New Conversation**; nếu không hiện ở menu `/` vẫn có thể gọi thẳng tên skill trong câu chat |
| `Spec drift detected!` khi chạy `--verify-spec` hoặc `--doctor` | Nội dung spec đã bị chỉnh sửa sau khi `--approve` | Kiểm tra lại thay đổi trong spec; nếu hợp lệ thì chạy lại `npx create-nexus-kit@latest --approve <file-spec>` |
