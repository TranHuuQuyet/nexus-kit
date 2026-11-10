# Nexus Kit 🌌

**A Spec-Driven Development (SDD) Template for AI Agents**

Nexus Kit là điểm giao thoa giữa **Luật lệ (Spec Kit)** và **Hành động (Agent Skills)**. Cấu trúc này thiết lập một môi trường làm việc kỷ luật, đảm bảo AI Agents luôn lập kế hoạch và tuân thủ nguyên tắc hệ thống trước khi tiến hành viết code.

## Khởi tạo nhanh với CLI

Bạn có thể nhanh chóng khởi tạo một dự án mới theo chuẩn Nexus Kit bằng công cụ dòng lệnh:

```bash
# Cách 1: Sử dụng npx (khuyên dùng)
npx create-nexus-kit my-project

# Cách 2: Sử dụng Curl (không cần cài trước Node.js)
curl -sL https://raw.githubusercontent.com/TranHuuQuyet/nexus-kit/main/create-nexus-kit/install.sh | bash
```

## Kiến trúc thư mục
- **`.specify/`**: Nơi chứa bộ luật (`constitution.md`) và các bản thiết kế tính năng (`tasks/`). Đây là "pháp luật" của dự án.
- **`.agents/skills/`**: Nơi chứa các kỹ năng (Skills) định hướng hành vi cho AI. Đây là "bộ não quy trình" giúp AI biết cách đọc luật và viết code đúng chuẩn.
- **`src/`**: Nơi chứa mã nguồn thực tế.

## Cách sử dụng cho Agent
1. Gọi Agent và yêu cầu lập kế hoạch tính năng (Agent sẽ dùng `sdd-planner` skill).
2. Duyệt bản spec được tạo trong `.specify/tasks/`.
3. Yêu cầu Agent tiến hành code (Agent sẽ dùng `sdd-coder` skill).
