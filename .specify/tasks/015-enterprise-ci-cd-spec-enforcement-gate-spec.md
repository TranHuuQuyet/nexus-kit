# SPEC-015: Enterprise CI/CD Spec Enforcement Gate (nexus-guard)

> **Status:** `Completed`  
> **Version:** `1.0.0`  
> **Author:** `sdd-planner`  
> **Date:** 2026-11-23  
> **Approved-By:** `quyettranhuu`  
> **Approved-At:** `2026-11-24T05:04:33.087Z`  
> **Approved-Hash:** `sha256:c9c714ee147f088ce7669f36219b36112907e9031d01c64695c20090bc89687d`  
> **Upstream Spec Kit:** Compatible with Spec Kit v1.0+  
> **Target Path:** `create-nexus-kit/lib/guard.js`, `create-nexus-kit/lib/nexus.js`, `create-nexus-kit/bin/index.js`, `action.yml`, `.github/workflows/nexus-guard.yml`, `create-nexus-kit/lib/templates.js`, `create-nexus-kit/install.sh`, `dist/agensi/nexus-kit/SKILL.md`, `create-nexus-kit/tests/guard.test.js`

---

## 1. Overview & Objective

### 1.1 Problem Statement
Trong môi trường phát triển hợp tác giữa nhiều kỹ sư và AI Coding Agents:
1. **Lỗ hổng Vibe Coding trên Remote/PR**: Mặc dù Nexus Kit đã có Git Pre-commit hook để chặn commit mã nguồn chưa có spec ở máy cục bộ, lập trình viên hoặc bot AI vẫn có thể bypass bằng cờ `git commit --no-verify`, hoặc tạo Pull Request từ các môi trường IDE/web không cài đặt pre-commit hook.
2. **Thiếu cơ chế CI Gate tập trung**: Chưa có một quality gate tự động chạy trên GitHub Actions (hoặc bất kỳ hệ thống CI/CD nào) để so sánh Git Diff giữa branch PR và base branch (ví dụ: `origin/main`), nhằm phát hiện code un-specced trong `src/`, phát hiện spec drift (hash không khớp), hoặc phát hiện code sửa ngoài phạm vi `Target Path`.
3. **Thiếu phản hồi trực quan trên PR**: Reviewer con người phải đọc diff thủ công để kiểm tra xem thay đổi này có bắt nguồn từ một spec hợp lệ hay không, thay vì có một bảng tóm tắt trạng thái (Spec Status & Compliance Summary) gắn trực tiếp vào PR.

### 1.2 User Stories
- **As a** Tech Lead / Repository Maintainer, **I want** hệ thống CI/CD tự động chặn đứng (exit 1) các Pull Request chứa code un-specced hoặc spec bị drift **so that** codebase giữ vững nguyên tắc tuyệt đối NO VIBE CODING.
- **As an** AI Coding Agent hoặc Developer mở PR, **I want** nhận được báo cáo kiểm toán Markdown trực quan ngay trên GitHub Actions Step Summary và bình luận trên PR **so that** tôi nắm rõ tình trạng hợp lệ của spec và các file vi phạm nếu có.
- **As a** Developer, **I want** có thể chạy lệnh kiểm tra trước ở máy cục bộ (`nexus-kit guard --base main`) **so that** tôi chắc chắn PR sẽ xanh trước khi push lên remote.

### 1.3 Scope Boundaries (Ranh giới phạm vi)
- **In-Scope (Đợt 3 - SPEC-015):**
  - **Core Guard Engine (`create-nexus-kit/lib/guard.js`)**:
    - Phân tích Git Diff giữa base ref và HEAD ref (`git diff --name-only <base>...<head>`).
    - Đối soát các file sửa đổi trong `src/` (hoặc scoped path) với danh sách các spec `Approved` / `Completed` trong `.specify/tasks/`.
    - Kiểm tra tính hợp lệ về mặt mật mã (Spec Hash verification) bằng `computeSpecHash`.
    - Phát hiện Scope Leak (sửa file ngoài `Target Path` đã cam kết).
    - Hỗ trợ cơ chế bypass an toàn qua flag commit/PR title `[skip-spec]` hoặc flag `--warn-only`.
    - Xuất kết quả có cấu trúc: JSON object, Terminal output, và GitHub Step Summary Markdown report.
    - Hỗ trợ gửi sticky comment lên PR qua GitHub REST API (sử dụng native `fetch`, zero third-party dependencies).
  - **CLI Subcommand (`create-nexus-kit/bin/index.js`)**:
    - Thêm lệnh `guard` (alias: `ci`, `check-pr`) với các tham số:
      `[target-dir] [--base <ref>] [--head <ref>] [--strict] [--warn-only] [--json] [--summary] [--comment-pr] [--token <token>]`.
  - **GitHub Action (`action.yml` & `.github/workflows/nexus-guard.yml`)**:
    - Cung cấp composite GitHub Action `action.yml` ở thư mục gốc để các dự án bên ngoài có thể nhúng dễ dàng (`uses: TranHuuQuyet/nexus-kit@v2.5.0`).
    - Thiết lập workflow `.github/workflows/nexus-guard.yml` thực thi guard trên mọi PR nhắm vào branch `main`.
  - **Ecosystem Parity & Automated Tests**:
    - Cập nhật templates trong `create-nexus-kit/lib/templates.js`, `install.sh`, và `dist/agensi/nexus-kit/SKILL.md`.
    - Xây dựng bộ test suite toàn diện `create-nexus-kit/tests/guard.test.js`.
- **Out-of-Scope:**
  - Viết server GitHub App hoặc Webhook daemon độc lập (giữ kiến trúc serverless, zero-infrastructure).

---

## 2. Data Models & Interface Contracts

### 2.1 Domain Models (TypeScript / Schemas)

```typescript
export interface GuardOptions {
  targetDir?: string;        // Thư mục root của project (default: cwd)
  baseRef?: string;          // Git base ref (default: origin/main hoặc github.base_ref hoặc HEAD~1)
  headRef?: string;          // Git head ref (default: HEAD)
  strict?: boolean;          // Bắt buộc fail nếu vi phạm (default: true)
  warnOnly?: boolean;        // Chỉ cảnh báo, không exit 1 (default: false)
  json?: boolean;            // Xuất output dạng JSON (default: false)
  summary?: boolean;         // Ghi output vào GITHUB_STEP_SUMMARY nếu tồn tại (default: true)
  commentPr?: boolean;       // Tự động post comment lên PR nếu có token (default: false)
  githubToken?: string;      // Token GitHub để gọi API (default: process.env.GITHUB_TOKEN)
}

export interface GuardViolation {
  type: 'UNSPECCED_CODE' | 'HASH_DRIFT' | 'UNAPPROVED_SPEC' | 'SCOPE_LEAK';
  file: string;
  message: string;
  specId?: string;
}

export interface GuardResult {
  passed: boolean;
  bypassed: boolean;
  bypassReason?: string;
  baseRef: string;
  headRef: string;
  totalChangedFiles: number;
  changedFiles: string[];
  speccedFiles: string[];
  unspeccedFiles: string[];
  activeSpecs: Array<{
    id: string;
    file: string;
    status: string;
    integrity: 'VALID' | 'DRIFT' | 'UNAPPROVED';
    targetPaths: string[];
  }>;
  violations: GuardViolation[];
  summaryMarkdown: string;
}
```

### 2.2 CLI Signature & Environment Variables
- **Command:** `npx create-nexus-kit guard [target-dir] [options]` (or `nexus-kit guard`)
- **Flags:**
  - `--base <ref>`: Base git branch/commit to diff against (default: `origin/main` or auto-detected).
  - `--head <ref>`: Head commit (default: `HEAD`).
  - `--strict`: Exit code 1 on violations (default unless `--warn-only` is set).
  - `--warn-only`: Report violations but exit code 0.
  - `--json`: Output raw JSON result to stdout.
  - `--summary`: Write markdown report to `$GITHUB_STEP_SUMMARY` if environment variable is set.
  - `--comment-pr`: Post sticky PR comment using GitHub API.
  - `--token <token>`: GitHub Token for PR comment API calls.
- **Environment Variables:**
  - `GITHUB_BASE_REF`: Tự động sử dụng làm base branch trên GitHub Actions PR events.
  - `GITHUB_STEP_SUMMARY`: Tự động ghi markdown summary nếu cờ `--summary` bật.
  - `GITHUB_TOKEN`: Sử dụng làm token mặc định khi gọi PR comment API.
  - `GITHUB_EVENT_PATH`: Đọc PR number và repo slug từ metadata event GitHub Actions.

### 2.3 Non-Functional Requirements (NFRs)
- **Zero Third-party Dependencies**: Không cài thêm bất kỳ package nào; tận dụng `node:child_process` cho git, `node:crypto` cho hash, và native `fetch` (Node.js 18+) cho GitHub API.
- **Execution Performance**: Kiểm toán toàn bộ Git Diff và Spec Hash trong < 300ms trên CI runner tiêu chuẩn.
- **Resilience & Safe Fallback**: Nếu không ở trong git repository hoặc không tìm thấy base ref, cảnh báo rõ ràng và không crash process với unhandled exceptions.

---

## 3. Logic Flow & State Transitions

```mermaid
flowchart TD
    Start([Run: nexus-kit guard]) --> CheckGit{Is Git Repo?}
    CheckGit -- No --> WarnNoGit[Return Warning: Non-git workspace] --> ExitSafe([Exit 0])
    CheckGit -- Yes --> ResolveRefs[Resolve baseRef and headRef]
    ResolveRefs --> CheckBypass{Commit message or\nPR title contains\n[skip-spec]?}
    
    CheckBypass -- Yes --> MarkBypassed[Record Bypassed with warning] --> GenReport
    CheckBypass -- No --> GitDiff[Execute: git diff --name-only base...head]
    
    GitDiff --> ScanFiles[Classify Changed Files]
    ScanFiles --> CheckSrc{Any files in src/\nor code paths?}
    
    CheckSrc -- No --> VerifySpecsOnly[Verify touched specs integrity] --> GenReport
    CheckSrc -- Yes --> FindActiveSpecs[Find Specs covering changed files]
    
    FindActiveSpecs --> CheckUnspecced{Any file in src/\nwithout Approved Spec?}
    CheckUnspecced -- Yes --> AddUnspeccedViol[Add VIOLATION_UNSPECCED_CODE]
    CheckUnspecced -- No --> CheckHashDrift
    
    AddUnspeccedViol --> CheckHashDrift{Any Spec Hash Drift\nor Unapproved Status?}
    CheckHashDrift -- Yes --> AddHashViol[Add VIOLATION_HASH_DRIFT]
    CheckHashDrift -- No --> CheckScopeLeak
    
    AddHashViol --> CheckScopeLeak{Any file outside\nTarget Path modified?}
    CheckScopeLeak -- Yes --> AddScopeViol[Add VIOLATION_SCOPE_LEAK]
    CheckScopeLeak -- No --> GenReport
    AddScopeViol --> GenReport
    
    GenReport[Generate Markdown & JSON Report] --> WriteSummary{GITHUB_STEP_SUMMARY\nenv set?}
    WriteSummary -- Yes --> AppendSummary[Append Markdown to GITHUB_STEP_SUMMARY]
    WriteSummary -- No --> CheckComment
    AppendSummary --> CheckComment
    
    CheckComment{--comment-pr and\nGITHUB_TOKEN set?}
    CheckComment -- Yes --> PostPRComment[Post / Update Sticky PR Comment]
    CheckComment -- No --> CheckExit
    PostPRComment --> CheckExit
    
    CheckExit{Violations > 0\nand strict mode?}
    CheckExit -- Yes --> ExitFail([Exit 1 - CI FAILED])
    CheckExit -- No --> ExitPass([Exit 0 - CI PASSED])
```

---

## 4. Edge Cases & Error Handling

- [x] **Shallow Git Clones on CI**: `actions/checkout` mặc định `fetch-depth: 1` khiến `origin/main` có thể chưa được fetch $\rightarrow$ Engine tự động kiểm tra `git rev-parse --verify <baseRef>` và cung cấp hướng dẫn rõ ràng nếu thiếu lịch sử commit.
- [x] **First Commit / Empty Diff**: PR không có thay đổi mã nguồn (chỉ sửa markdown ngoài lề hoặc empty commit) $\rightarrow$ Guard báo cáo `totalChangedFiles: 0`, status `PASSED`.
- [x] **Bypass with `[skip-spec]`**: Developer bổ sung tag `[skip-spec]` trong commit message hoặc PR title $\rightarrow$ Guard cho phép vượt qua nhưng ghi rõ cảnh báo `BYPASSED` vào báo cáo PR.
- [x] **Missing GitHub Token during `--comment-pr`**: Không crash tiến trình; ghi log cảnh báo bỏ qua bước bình luận PR và vẫn hoàn thành việc kiểm toán.
- [x] **Multi-target Spec Paths**: Spec khai báo nhiều đường dẫn cách nhau bởi dấu phẩy hoặc wildcard (ví dụ: `` `src/auth/`, `src/utils/` ``) $\rightarrow$ Parser xử lý chuẩn xác không gây false positive scope leak.

---

## 5. Acceptance Criteria (Tiêu chí nghiệm thu)

- [x] **AC-1**: Triển khai `create-nexus-kit/lib/guard.js` xuất hàm `runGuardAudit` thực hiện đối soát Git Diff, phát hiện code un-specced trong `src/`, kiểm tra Spec Hash Drift, và phát hiện Scope Leaks.
- [x] **AC-2**: Bổ sung lệnh `guard` vào CLI `create-nexus-kit/bin/index.js` hỗ trợ đầy đủ các cờ `--base`, `--head`, `--strict`, `--warn-only`, `--json`, `--summary`, `--comment-pr`, `--token`.
- [x] **AC-3**: Tự động kết xuất báo cáo Markdown Spec Status & Compliance Report tương thích với GitHub Actions Step Summary (`$GITHUB_STEP_SUMMARY`) và hỗ trợ post sticky comment lên PR bằng native `fetch`.
- [x] **AC-4**: Tạo GitHub Action tái sử dụng `action.yml` tại root repository và bổ sung workflow `.github/workflows/nexus-guard.yml` bảo vệ branch `main`.
- [x] **AC-5**: Đồng bộ hóa hướng dẫn và templates vào `create-nexus-kit/lib/templates.js`, `create-nexus-kit/install.sh`, và `dist/agensi/nexus-kit/SKILL.md`.
- [x] **AC-6**: Tạo test suite `create-nexus-kit/tests/guard.test.js` kiểm chứng toàn diện mọi edge cases, mock git diff, detection rules, và CLI flags; 100% test suites trong dự án pass và `node create-nexus-kit/bin/index.js --doctor .` đạt chuẩn.

---

## 6. Change Log

| Version | Date | Author | Summary |
| :--- | :--- | :--- | :--- |
| `1.0.0` | 2026-11-23 | `sdd-planner` | Initial specification for Enterprise CI/CD Spec Enforcement Gate (SPEC-015). |
