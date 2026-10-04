const fs = require('fs');
const path = require('path');

global.window = { COURSE_MODULES: [] };
const m5Path = path.join(__dirname, '..', 'js', 'content', 'module5.js');
new Function('window', fs.readFileSync(m5Path, 'utf8'))(window);
const oldM5 = window.COURSE_MODULES[0];

const topics = [
  { id: 1, title: "Spring Security 6 & Filter Chain", desc: "Kiến trúc SecurityFilterChain, AuthenticationManager, cơ chế Stateless và CORS/CSRF." },
  { id: 2, title: "Stateless JWT & Token Rotation", desc: "Cấu trúc RFC 7519, ký số RSA/ECDSA, bảo mật Refresh Token Rotation và thu hồi qua Redis." },
  { id: 3, title: "OAuth2 Resource Server & Keycloak", desc: "Tích hợp Identity Provider Keycloak, JWKS caching và ánh xạ phân quyền RBAC/ABAC." },
  { id: 4, title: "Advanced OAuth2, PKCE & BFF Pattern", desc: "Authorization Code Flow với PKCE và kiến trúc Backend-For-Frontend bảo mật tuyệt đối." }
];

const outcomes = [
  "Làm chủ kiến trúc Spring Security 6 với SecurityFilterChain cấu hình hoàn toàn bằng Lambda DSL",
  "Tự xây dựng hệ thống Stateless JWT với thuật toán Refresh Token Rotation an toàn",
  "Tích hợp OAuth2 Resource Server với Keycloak SSO xác thực tập trung quy mô doanh nghiệp",
  "Triển khai mô hình kiến trúc Backend-For-Frontend (BFF) loại bỏ hoàn toàn rủi ro rò rỉ Token qua XSS"
];

const retrievalWarmup = [
  {
    question: "Trong Module 4, tại sao việc sử dụng Testcontainers với Docker PostgreSQL thật lại được coi là tiêu chuẩn bắt buộc cho các bài test Integration tầng Professional?",
    options: [
      "Vì nó bảo đảm môi trường kiểm thử giống hệt 100% môi trường Production (SQL dialect, Row-level lock, MVCC), phát hiện sớm lỗi Deadlock mà database in-memory H2 bỏ lọt",
      "Vì Testcontainers giúp giảm dung lượng RAM của máy dev xuống dưới 100MB",
      "Vì Testcontainers không cần cài đặt Docker Engine",
      "Vì H2 đã bị loại bỏ khỏi hệ sinh thái Spring Boot"
    ],
    answer: 0,
    explain: "H2 in-memory có cơ chế locking và type conversion rất khác biệt so với PostgreSQL/MySQL. Nhiều lỗi Concurrency, JSONB, Trigger hoặc Deadlock chỉ xuất hiện trên database thật, do đó CES-2026 cấm H2 ở bài thi cấp Professional.",
    targetLessonId: "4-2-1"
  },
  {
    question: "Khi kiểm thử một tác vụ bất đồng bộ (@Async hoặc Kafka Consumer), tại sao thư viện Awaitility lại vượt trội hơn Thread.sleep()?",
    options: [
      "Awaitility liên tục polling kiểm tra điều kiện và cho bài test pass ngay khi điều kiện đạt được, tránh lãng phí thời gian và triệt tiêu lỗi Flaky Test",
      "Awaitility tự động sửa mã nguồn Java của Service",
      "Awaitility biến tác vụ bất đồng bộ thành đồng bộ cưỡng bức",
      "Awaitility chỉ chạy được trên môi trường Windows"
    ],
    answer: 0,
    explain: "Thread.sleep() buộc bài test phải chờ hết thời gian cố định và dễ fail nếu máy chủ CI quá tải. Awaitility poll liên tục với timeout linh hoạt, mang lại độ tin cậy tuyệt đối.",
    targetLessonId: "4-3-1"
  },
  {
    question: "Công cụ nào giúp lập trình viên viết các quy tắc kiểm soát kiến trúc Clean Architecture dưới dạng Unit Test để tự động gãy build nếu ai đó vi phạm ranh giới phân tầng?",
    options: [
      "Thư viện ArchUnit",
      "Thư viện Lombok",
      "Plugin Maven Shade",
      "Thư viện Jackson"
    ],
    answer: 0,
    explain: "ArchUnit phân tích bytecode của các file .class và kiểm tra các ràng buộc kiến trúc (ví dụ: Controller không được gọi Repository), tự động gãy build khi có vi phạm.",
    targetLessonId: "4-4-1"
  }
];

const getL = (id) => oldM5.lessons.find(l => l.id === id);

// Topic 1: 5-1-1 to 5-1-4 (Consolidates 5-1 and 5-4)
const t1_l1 = {
  id: "5-1-1",
  type: "theory",
  title: "Bài 5.1.1: Kiến trúc Spring Security 6, SecurityFilterChain & Cơ chế Ủy nhiệm Filter",
  minutes: 8,
  content: getL("5-1-1").content + "\n\n" + getL("5-1-2").content + "\n\n" + getL("5-4-2").content
};

const t1_l2 = {
  id: "5-1-2",
  type: "practice",
  title: "Bài 5.1.2: Cấu hình SecurityFilterChain Stateless, CORS Chuẩn & Vô hiệu hóa CSRF",
  minutes: 8,
  content: getL("5-1-4").content + "\n\n" + getL("5-4-5").content
};

const t1_l3 = {
  id: "5-1-3",
  type: "pitfall",
  title: "Bài 5.1.3: Cạm bẫy Bật Session Trong REST API, Lỗi CORS Preflight 403 & AntMatcher Sai",
  minutes: 7,
  content: getL("5-1-6").content + "\n\n" + getL("5-4-7").content
};

const t1_l4 = {
  id: "5-1-4",
  type: "synthesis",
  title: "Bài 5.1.4: Milestone Synthesis: Bản đồ SecurityFilterChain & Ma trận Luồng Xác Thực",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Kiến Trúc Spring Security 6 & Filter Chain

### 1. Sơ Đồ Kiến Trúc: Chuỗi Bộ Lọc Bảo Mật (SecurityFilterChain) Trong Spring Security 6

\`\`\`mermaid
flowchart TD
    ClientReq["Client HTTP Request"] --> Delegating["DelegatingFilterProxy (Cầu nối Servlet -> Spring)"]
    Delegating --> FilterChainProxy["FilterChainProxy (Trái Tim Bảo Mật)"]
    
    subgraph Chain ["SecurityFilterChain (Đăng ký qua Lambda DSL)"]
        CorsFilter["1. CorsFilter: Xử lý Preflight OPTIONS"] --> CsrfFilter["2. CsrfFilter: Disabled (Stateless REST API)"]
        CsrfFilter --> JwtFilter["3. JwtAuthenticationFilter: Trích xuất & Xác thực Bearer Token"]
        JwtFilter --> ContextHolder["4. Nạp Authentication vào SecurityContextHolder"]
        ContextHolder --> AuthFilter["5. AuthorizationFilter: Kiểm tra URL matchers & Roles"]
    end

    FilterChainProxy --> Chain
    Chain --> DispatcherServlet["Chuyển giao Request hợp lệ cho DispatcherServlet"]
    Chain -- "Xác thực thất bại" --> EntryPoint["AuthenticationEntryPoint (HTTP 401 Unauthorized)"]
    Chain -- "Không đủ quyền" --> DeniedHandler["AccessDeniedHandler (HTTP 403 Forbidden)"]

    style Chain fill:#1e293b,stroke:#3b82f6,color:#fff
    style DispatcherServlet fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Cấu Hình Bảo Mật Cho Các Loại Ứng Dụng

| Tiêu chuẩn cấu hình | RESTful API Stateless (Microservices) | Web Monolith Render Server-Side (Thymeleaf/JSP) |
|---|---|---|
| **SessionCreationPolicy** | **BẮT BUỘC STATELESS** (\`SessionCreationPolicy.STATELESS\`) | \`SessionCreationPolicy.IF_REQUIRED\` (Dùng HttpSession) |
| **Bảo vệ CSRF** | **TẮT (\`csrf.disable()\`)** (Vì không dùng Cookie auth) | **BẬT BẮT BUỘC** (Kèm CSRF Token trong Form HTML) |
| **CORS (Cross-Origin)** | Cấu hình tường minh domain frontend qua \`CorsConfigurationSource\` | Không cần nếu Frontend và Backend cùng chung Domain |
| **Lưu trữ Context** | ThreadLocal trên từng request worker thread | Lưu vào HttpSession của máy chủ |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Spring Security 6 Lambda DSL**: Không còn phương thức \`authorizeRequests().and()\`; mọi cấu hình đều dùng cú pháp Lambda \`http.authorizeHttpRequests(auth -> ...)\`.
2. **Cạm bẫy CORS Preflight**: Trình duyệt luôn gửi request \`OPTIONS\` trước để kiểm tra CORS. Nếu cấu hình security chặn request OPTIONS, frontend sẽ báo lỗi CORS 403. Luôn để \`CorsFilter\` đứng đầu chain.
3. **HTTP 401 vs 403**: \`401 Unauthorized\` nghĩa là 'Bạn là ai? Hãy xuất trình thông tin đăng nhập'; \`403 Forbidden\` nghĩa là 'Tôi biết bạn là ai rồi, nhưng bạn không có quyền vào đây'.`
};

// Topic 2: 5-2-1 to 5-2-4
const t2_l1 = {
  id: "5-2-1",
  type: "theory",
  title: "Bài 5.2.1: Cấu trúc Kỹ thuật JWT (RFC 7519), Ký số Bất đối xứng RSA & Refresh Token Rotation",
  minutes: 8,
  content: getL("5-2-1").content + "\n\n" + getL("5-2-2").content + "\n\n" + getL("5-2-3").content
};

const t2_l2 = {
  id: "5-2-2",
  type: "practice",
  title: "Bài 5.2.2: Triển khai JWT Authentication Filter & Quản lý Token Rotation với Redis",
  minutes: 8,
  content: getL("5-2-4").content
};

const t2_l3 = {
  id: "5-2-3",
  type: "pitfall",
  title: "Bài 5.2.3: Cạm bẫy Lỗ hổng Thuật toán 'none', Lưu Sensitive Data trong Payload & Rò rỉ Token",
  minutes: 7,
  content: getL("5-2-6").content + "\n\n" + getL("5-2-7").content
};

const t2_l4 = {
  id: "5-2-4",
  type: "synthesis",
  title: "Bài 5.2.4: Milestone Synthesis: Bản đồ Vòng đời JWT & Ma trận Quản Trị Phiên Đăng Nhập",
  minutes: 8,
  content: `## Milestone Synthesis: Tổng Hợp Cơ Chế Stateless JWT & Token Rotation

### 1. Sơ Đồ Kiến Trúc: Chu Trình Refresh Token Rotation & Thu Hồi Token Bị Đánh Cắp

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Client App
    participant Auth as Auth Server (Spring Boot)
    participant Redis as Redis Cache (Token Family Blacklist)

    Client->>Auth: POST /api/v1/auth/refresh { refreshToken: "RT-1" }
    activate Auth
    Auth->>Redis: Kiểm tra RT-1 trong Redis
    alt RT-1 Đã Từng Sử Dụng Trước Đó (Cảnh báo: Hacker đang tấn công!)
        Note over Auth,Redis: Phát hiện Reuse Token! Hacker đã lấy trộm RT-1!
        Auth->>Redis: Xóa toàn bộ Token Family của User này ngay lập tức!
        Auth-->>Client: HTTP 401 Unauthorized (Force Logout toàn bộ thiết bị)
    else RT-1 Hợp lệ
        Auth->>Redis: Đánh dấu RT-1 là 'USED' & Lưu RT-2 mới (TTL: 7 ngày)
        Auth-->>Client: Trả về { accessToken: "AT-Mới (15p)", refreshToken: "RT-2 (7 ngày)" }
    end
    deactivate Auth
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Thuật Toán Ký Số JWT (Signing Algorithm)

| Tiêu chuẩn | Ký đối xứng HMAC (HS256, HS512) | Ký bất đối xứng RSA/ECDSA (RS256, ES256) |
|---|---|---|
| **Cặp khóa sử dụng** | 1 Secret Key duy nhất (Dùng chung cho cả Ký và Kiểm) | Cặp Private Key (Ký) & Public Key (Kiểm) |
| **Phù hợp kiến trúc** | Monolith, hệ thống nhỏ 1 service duy nhất | **Microservices phân tán, OAuth2 / OIDC** |
| **Nguy cơ rò rỉ khóa** | Cực cao: Nếu 1 service bị hack, kẻ xấu có thể tự sinh token giả cho cả hệ thống | Cực thấp: Private Key chỉ nằm tại Auth Server; Resource servers chỉ đọc Public Key |
| **Tốc độ xác thực** | Nhanh hơn RSA một chút | Tốc độ nhanh khi dùng Public Key caching |
| **Khuyến nghị sử dụng** | Chỉ dùng cho demo hoặc service nội bộ khép kín | **BẮT BUỘC cho hệ thống Microservices doanh nghiệp** |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Thời hạn sống (TTL) của Access Token**: Luôn đặt ngắn (5 đến 15 phút) để giới hạn khung thời gian thiệt hại nếu token bị lọt.
2. **Refresh Token Rotation (RTR)**: Mỗi lần client dùng Refresh Token để đổi lấy Access Token mới, máy chủ phải **hủy ngay Refresh Token cũ và cấp Refresh Token mới**. Nếu token cũ bị dùng lại lần 2, lập tức thu hồi toàn bộ phiên đăng nhập của tài khoản.
3. **Cấm lưu dữ liệu nhạy cảm trong Payload**: Payload của JWT chỉ được Base64Url encode, hoàn toàn KHÔNG được mã hóa. Bất kỳ ai cũng có thể đọc được nội dung; do đó tuyệt đối không lưu password, số thẻ tín dụng hoặc secret key vào token.`
};

// Topic 3: 5-3-1 to 5-3-4
const t3_l1 = {
  id: "5-3-1",
  type: "theory",
  title: "Bài 5.3.1: Kiến trúc OAuth2 Resource Server, JWKS Endpoint & Cơ chế Phân quyền Keycloak",
  minutes: 8,
  content: getL("5-3-1").content + "\n\n" + getL("5-3-2").content + "\n\n" + getL("5-3-3").content
};

const t3_l2 = {
  id: "5-3-2",
  type: "practice",
  title: "Bài 5.3.2: Tích hợp Keycloak SSO với Custom JwtAuthenticationConverter & Method Security",
  minutes: 8,
  content: getL("5-3-4").content
};

const t3_l3 = {
  id: "5-3-3",
  type: "pitfall",
  title: "Bài 5.3.3: Cạm bẫy Không Caching JWKS Làm Nghẽn Mạng Keycloak & Lệch Prefix 'ROLE_'",
  minutes: 7,
  content: getL("5-3-6").content + "\n\n" + getL("5-3-7").content
};

const t3_l4 = {
  id: "5-3-4",
  type: "synthesis",
  title: "Bài 5.3.4: Milestone Synthesis: Bản đồ Phân quyền Keycloak & Ma trận RBAC vs ABAC",
  minutes: 8,
  content: `## Milestone Synthesis: Tích Hợp Keycloak SSO & Kiểm Soát Truy Cập Chuyên Sâu

### 1. Sơ Đồ Kiến Trúc: Xác Thực Không Cần Gọi Mạng (Zero-Network Validation) Qua JWKS

\`\`\`mermaid
flowchart LR
    Client["Client (Gửi Request kèm JWT do Keycloak cấp)"] --> SpringBoot["Spring Boot Resource Server"]
    SpringBoot --> CacheJWKS{"Có Public Key trong Cache chưa?"}
    CacheJWKS -- "CHƯA CÓ / HẾT HẠN" --> CallJWKS["Gọi Keycloak Endpoint: /protocol/openid-connect/certs"]
    CallJWKS --> Keycloak["Keycloak IAM Server"]
    Keycloak -- "Trả về tập khóa công khai JWKS" --> SaveCache["Lưu Public Key vào Cache (TTL 24h)"]
    SaveCache --> VerifyLocal["Xác Thực Chữ Ký Token Ngay Tại Bộ Nhớ Local!"]
    CacheJWKS -- "ĐÃ CÓ TRONG CACHE" --> VerifyLocal
    VerifyLocal --> AppLogic["Thực thi Controller & Business Logic (0 ms độ trễ mạng!)"]

    style Keycloak fill:#4c1d95,stroke:#8b5cf6,color:#fff
    style VerifyLocal fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Mô Hình Kiểm Soát Truy Cập

| Tiêu chuẩn | RBAC (Role-Based Access Control) | ABAC (Attribute-Based Access Control) |
|---|---|---|
| **Cơ sở phân quyền** | Vai trò của người dùng (\`ROLE_ADMIN\`, \`ROLE_STAFF\`) | Thuộc tính động của User, Resource, Môi trường |
| **Cú pháp Spring** | \`@PreAuthorize("hasRole('ADMIN')")\` | \`@PreAuthorize("#order.ownerId == authentication.principal.id")\` |
| **Tính linh hoạt** | Đơn giản, cứng nhắc khi nghiệp vụ phức tạp | Cực kỳ linh hoạt (VD: chỉ sửa order khi trạng thái là DRAFT) |
| **Độ phức tạp duy trì** | Thấp, dễ quản lý qua Keycloak Realm Roles | Cần viết biểu thức SpEL hoặc Open Policy Agent (OPA) |
| **Khuyến nghị sử dụng** | Dùng cho phân quyền chức năng trang quản trị | **Bắt buộc cho phân quyền sở hữu tài nguyên dữ liệu** |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Ánh xạ Role từ Keycloak**: Keycloak mặc định lưu role trong claim \`realm_access.roles\` hoặc \`resource_access.client.roles\`. Spring Security cần một \`JwtAuthenticationConverter\` tùy biến để map các role này thành \`GrantedAuthority\` có tiền tố \`ROLE_\`.
2. **Caching JWKS bắt buộc**: Spring Security tự động cache JWKS (JSON Web Key Set). Tuyệt đối không gọi Keycloak introspect token ở mỗi request (gây thắt cổ chai mạng và sập Keycloak khi traffic cao).
3. **Bật Method Security**: Đặt \`@EnableMethodSecurity\` ở class cấu hình để bảo vệ chi tiết từng phương thức ở tầng Service bằng \`@PreAuthorize\`.`
};

// Topic 4: 5-4-1 to 5-4-4 (Consolidates 5-5)
const t4_l1 = {
  id: "5-4-1",
  type: "theory",
  title: "Bài 5.4.1: Kiến trúc OAuth2 / OIDC: Authorization Code Flow với PKCE & Mô hình BFF",
  minutes: 8,
  content: getL("5-5-1").content + "\n\n" + getL("5-5-2").content + "\n\n" + getL("5-5-3").content
};

const t4_l2 = {
  id: "5-4-2",
  type: "practice",
  title: "Bài 5.4.2: Triển khai Spring Cloud Gateway làm BFF Che Giấu Token Khỏi Trình Duyệt",
  minutes: 8,
  content: getL("5-5-4").content
};

const t4_l3 = {
  id: "5-4-3",
  type: "pitfall",
  title: "Bài 5.4.3: Cạm bẫy Lưu Token trong LocalStorage (XSS) & Token Hijacking trên Mobile",
  minutes: 7,
  content: getL("5-5-6").content + "\n\n" + getL("5-5-7").content
};

const t4_l4 = {
  id: "5-4-4",
  type: "synthesis",
  title: "Bài 5.4.4: Milestone Synthesis: Bản đồ Kiến trúc BFF & Ma trận Bảo Mật Frontend/Mobile",
  minutes: 8,
  content: `## Milestone Synthesis: OAuth2 PKCE & Kiến Trúc Backend-For-Frontend (BFF)

### 1. Sơ Đồ Kiến Trúc: Mô Hình Backend-For-Frontend (BFF) Triệt Tiêu Lỗ Hổng XSS

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Browser as SPA Frontend (React / Vue)
    participant BFF as Spring Cloud Gateway (BFF Layer)
    participant Keycloak as Keycloak Identity Server
    participant Backend as Microservices (Order / Payment)

    Browser->>BFF: Đăng nhập (Authorization Code + PKCE)
    BFF->>Keycloak: Trao đổi Code lấy Token bằng Client Secret bảo mật
    Keycloak-->>BFF: Trả về Access Token + Refresh Token
    Note over BFF: BFF lưu JWT Token vào Redis Session nội bộ!
    BFF-->>Browser: Trả về HttpOnly, Secure, SameSite=Strict Cookie (Session ID)
    
    Note over Browser: Trình duyệt KHÔNG BAO GIỜ nhìn thấy JWT Token! 100% miễn nhiễm XSS!
    
    Browser->>BFF: GET /api/orders (Gửi kèm HttpOnly Cookie)
    activate BFF
    BFF->>BFF: TokenRelay Filter: Tra Session ID lấy JWT Token tương ứng
    BFF->>Backend: Forward request kèm Header: Authorization: Bearer <JWT>
    activate Backend
    Backend-->>BFF: Trả về kết quả JSON
    deactivate Backend
    BFF-->>Browser: Trả về dữ liệu cho Frontend
    deactivate BFF
\`\`\`

---

### 2. Ma Trận Quyết Định Công Nghệ: Nơi Lưu Trữ Token Trên Ứng Dụng Client

| Nơi lưu trữ | Trình duyệt LocalStorage / SessionStorage | HttpOnly, Secure, SameSite Cookie | Lưu trong BFF Gateway (Redis) |
|---|---|---|---|
| **Rủi ro XSS (Cross-Site Scripting)** | **CỰC KỲ NGUY HIỂM** (Mã độc JS đọc trộm token dễ dàng) | An toàn (JavaScript không thể đọc được Cookie) | **TUYỆT ĐỐI AN TOÀN** (Client không có token) |
| **Rủi ro CSRF** | Miễn nhiễm CSRF (vì gửi qua Header) | Có rủi ro nếu không có \`SameSite=Strict\` | An toàn tuyệt đối với SameSite Cookie |
| **Độ phức tạp triển khai** | Rất dễ, code đơn giản | Trung bình | Cần dựng thêm Gateway BFF layer |
| **Khuyến nghị theo CES-2026** | **CẤM DÙNG cho ứng dụng tài chính/ngân hàng** | Phù hợp ứng dụng web tiêu chuẩn | **TIÊU CHUẨN VÀNG cho kiến trúc Enterprise** |

---

### 3. Key Takeaways & Nguyên Tắc Sống Còn
1. **Sức mạnh của PKCE**: Proof Key for Code Exchange (RFC 7636) bảo vệ Authorization Code không bị đánh cắp trên ứng dụng Single Page App (SPA) và Mobile App.
2. **Kiến trúc BFF (Token Relay)**: Mô hình hiện đại nhất biến Frontend thành hoàn toàn không lưu giữ token, biến mọi rủi ro XSS thành vô hại đối với cơ chế xác thực.
3. **Thu hồi Token tức thì**: Khi người dùng logout, BFF xóa ngay session trong Redis và gửi yêu cầu Back-channel Logout đến Keycloak.`
};

// 6 Additional Quiz Questions for Module 5 (10 + 6 = 16 questions)
const additionalQuestions = [
  {
    level: "hard",
    scenario: "Khi một Single Page Application (React) lưu trữ JWT Access Token trực tiếp trong LocalStorage của trình duyệt, hacker cài cắm được một đoạn mã JavaScript độc hại thông qua thư viện bên thứ 3 (lỗ hổng XSS).",
    q: "Hậu quả bảo mật nghiêm trọng nhất và giải pháp kiến trúc khắc phục triệt để theo tiêu chuẩn hiện đại là gì?",
    options: [
      "Hacker có thể dùng document.defaultView.localStorage đọc trộm toàn bộ token và mạo danh người dùng vĩnh viễn; giải pháp là chuyển sang mô hình Backend-For-Frontend (BFF) dùng HttpOnly Secure Cookie",
      "Hacker chỉ đọc được thông tin mã hóa không sử dụng được",
      "Không có nguy cơ vì LocalStorage được bảo vệ bởi hệ điều hành",
      "Chỉ cần mã hóa chuỗi token bằng thuật toán MD5 trước khi lưu"
    ],
    answer: 0,
    explain: "LocalStorage hoàn toàn không có cơ chế bảo vệ trước mã độc chạy trên trình duyệt (XSS). Bất kỳ script nào chạy trên trang đều đọc được LocalStorage. Mô hình BFF che giấu token hoàn toàn ở tầng Gateway và chỉ giao tiếp với browser qua HttpOnly Cookie.",
    why: [
      "✓ Đúng — Đây là khuyến nghị bảo mật cốt lõi của OWASP và IETF OAuth2 Security Best Current Practice.",
      "JWT token dùng để xác thực, nếu hacker có được token thì có thể gửi request giả mạo ngay lập tức.",
      "LocalStorage chỉ được phân vùng theo Origin, không chống được script chạy cùng domain.",
      "MD5 là hàm băm một chiều, không thể giải mã để gửi lên header Authorization."
    ]
  },
  {
    level: "medium",
    scenario: "Trong kiến trúc Spring Boot 3 REST API Stateless sử dụng JWT, tại sao lập trình viên bắt buộc phải cấu hình 'csrf(AbstractHttpConfigurer::disable)'?",
    q: "Lý do kỹ thuật nào biện minh cho việc tắt bảo vệ CSRF trong trường hợp này?",
    options: [
      "Vì kiến trúc REST API Stateless dùng JWT truyền qua Header 'Authorization: Bearer' không tự động gửi theo request của trình duyệt như Cookie, do đó bản chất đã miễn nhiễm hoàn toàn với tấn công CSRF",
      "Vì CSRF làm giảm tốc độ xử lý của Spring Boot đi 50%",
      "Vì Spring Security 6 không còn hỗ trợ tính năng CSRF",
      "Vì cơ sở dữ liệu không thể lưu trữ CSRF token"
    ],
    answer: 0,
    explain: "CSRF (Cross-Site Request Forgery) lợi dụng cơ chế trình duyệt tự động đính kèm Cookie xác thực khi gọi chéo domain. Trong REST API thuần túy dùng Bearer Token lưu trong header, trình duyệt không tự động đính kèm token này, vì vậy CSRF hoàn toàn không thể xảy ra.",
    why: [
      "✓ Đúng — Hiểu đúng bản chất CSRF giúp lập trình viên tự tin tắt CSRF cho REST API mà không sợ hổng bảo mật.",
      "CSRF filter tốn rất ít CPU, không phải nguyên nhân hiệu năng.",
      "Spring Security vẫn hỗ trợ CSRF rất mạnh cho các ứng dụng dùng Cookie/Session.",
      "CSRF token thường lưu trong session hoặc cookie, không liên quan đến database."
    ]
  },
  {
    level: "hard",
    scenario: "Khi tích hợp Spring Boot làm OAuth2 Resource Server với Keycloak, tại sao việc Resource Server tự động cache JWKS (JSON Web Key Set) từ Keycloak lại là yêu cầu sống còn cho hạ tầng?",
    q: "Hậu quả gì sẽ xảy ra nếu mỗi HTTP request đến đều gọi sang Keycloak để kiểm tra token?",
    options: [
      "Keycloak sẽ bị quá tải (DDoS nội bộ) và sập máy chủ khi traffic tăng cao, đồng thời làm tăng độ trễ của mọi API lên thêm hàng chục mili-giây mạng",
      "Token sẽ bị biến đổi thành chuỗi rỗng",
      "Spring Boot sẽ bị từ chối kết nối mạng",
      "Không có ảnh hưởng nào vì Keycloak xử lý được hàng triệu request/giây"
    ],
    answer: 0,
    explain: "Xác thực JWT bất đối xứng (RSA/ECDSA) được thiết kế để kiểm tra chữ ký số cục bộ (In-memory) bằng Public Key. Bằng cách cache tập JWKS, Spring Boot chỉ cần tải public key 1 lần mỗi ngày và tự xác thực hàng triệu request trong bộ nhớ với độ trễ 0ms.",
    why: [
      "✓ Đúng — Đây là nguyên lý Zero-Network Verification cốt lõi của kiến trúc Microservices phân tán.",
      "Token là chuỗi bất biến từ client, không bị rỗng.",
      "Mạng vẫn thông suốt nhưng gây nghẽn đường truyền không đáng có.",
      "Gọi mạng nội bộ liên tục cho mỗi request là phản kiến trúc Microservices."
    ]
  },
  {
    level: "medium",
    scenario: "Khi người dùng đăng nhập thành công vào Keycloak, token JWT trả về chứa danh sách quyền trong 'realm_access.roles': ['admin', 'manager']. Khi gọi API, Spring Security lại báo lỗi 403 Forbidden.",
    q: "Nguyên nhân phổ biến nhất gây ra sự không tương thích này giữa Keycloak và Spring Security là gì?",
    options: [
      "Spring Security mặc định tìm quyền trong claim 'scope' hoặc 'scp' và yêu cầu tiền tố 'ROLE_'; cần viết Custom JwtAuthenticationConverter để ánh xạ đúng claim của Keycloak",
      "Do người dùng chưa bấm kích hoạt tài khoản qua email",
      "Do Keycloak bị lỗi phiên bản",
      "Do Spring Security cấm người dùng có nhiều hơn 1 role"
    ],
    answer: 0,
    explain: "Spring Security's DefaultJwtAuthenticationConverter tìm kiếm trong claim 'scope' hoặc 'scp' và gán prefix 'SCOPE_'. Trong khi đó, Keycloak lưu role trong JSON lồng nhau 'realm_access.roles'. Lập trình viên phải tùy biến converter để bóc tách và gán prefix 'ROLE_'.",
    why: [
      "✓ Đúng — Đây là lỗi tích hợp phổ biến nhất mà 90% kỹ sư gặp phải khi lần đầu kết nối Spring Boot với Keycloak.",
      "Nếu chưa kích hoạt thì Keycloak đã từ chối cấp token ngay từ bước login.",
      "Đây là đặc tả thiết kế khác nhau giữa 2 framework, không phải bug của Keycloak.",
      "Spring Security hỗ trợ hàng trăm role đồng thời cho một Principal."
    ]
  },
  {
    level: "medium",
    scenario: "Trong kiến trúc Microservices phân tán, thuật toán ký số JWT nào bắt buộc phải sử dụng để bảo đảm rằng các Resource Services chỉ có quyền kiểm tra tính hợp lệ của token mà KHÔNG THỂ tự ý sinh token giả mạo?",
    q: "Thuật toán ký số chuẩn xác là gì?",
    options: [
      "Ký số bất đối xứng (Asymmetric Signing, ví dụ: RS256 hoặc ES256) sử dụng cặp Private Key (tại Auth Server) và Public Key (chia sẻ cho Resource Servers)",
      "Ký số đối xứng (Symmetric Signing, ví dụ: HS256) với 1 secret key duy nhất",
      "Thuật toán mã hóa đối xứng AES-256",
      "Không cần ký số, chỉ cần Base64"
    ],
    answer: 0,
    explain: "Ký bất đối xứng sử dụng Private Key (chỉ Identity Server nắm giữ) để ký token và Public Key (chia sẻ công khai) để xác thực. Các Resource Server dù có bị hack cũng chỉ có Public Key, hoàn toàn bất khả thi trong việc tạo ra một token hợp lệ mới.",
    why: [
      "✓ Đúng — Ký bất đối xứng RS256 là tiêu chuẩn quốc tế cho OAuth2 và OpenID Connect.",
      "HS256 dùng chung 1 khóa, nếu 1 resource server bị xâm nhập thì toàn bộ hệ sinh thái bị lộ khóa ký.",
      "AES là thuật toán mã hóa dữ liệu (Encryption), không phải chữ ký số (Digital Signature).",
      "Base64 không có tính năng bảo mật, ai cũng có thể giả mạo dữ liệu."
    ]
  },
  {
    level: "medium",
    scenario: "Khi một Refresh Token bị rò rỉ và hacker sử dụng nó để lấy Access Token mới, sau đó người dùng hợp pháp cũng sử dụng chính Refresh Token đó để refresh.",
    q: "Cơ chế bảo mật nào của Refresh Token Rotation (RTR) sẽ được kích hoạt để bảo vệ tài khoản?",
    options: [
      "Cơ chế Phát hiện Tái sử dụng (Reuse Detection): Hệ thống nhận diện token đã qua sử dụng, lập tức thu hồi toàn bộ Token Family và bắt buộc người dùng đăng xuất trên mọi thiết bị",
      "Hệ thống tự động chuyển tiền sang tài khoản của hacker",
      "Hệ thống tự động xóa cơ sở dữ liệu người dùng",
      "Hệ thống gửi tin nhắn SMS cảnh báo nhưng vẫn cho cả hai tiếp tục dùng"
    ],
    answer: 0,
    explain: "Refresh Token Rotation quy định mỗi refresh token chỉ dùng được đúng 1 lần. Nếu một token đã bị đánh dấu 'USED' lại xuất hiện lần thứ 2, hệ thống kết luận có ít nhất 1 bên là kẻ trộm và kích hoạt thu hồi toàn bộ token của tài khoản để ngăn chặn truy cập trái phép.",
    why: [
      "✓ Đúng — Reuse Detection là cơ chế phòng thủ tối thượng của đặc tả OAuth2 RFC 6749.",
      "Hệ thống bảo mật sinh ra để bảo vệ tiền của người dùng.",
      "Xóa DB là hành vi phá hoại, không phải cơ chế bảo mật.",
      "Cho phép cả 2 tiếp tục dùng sẽ tạo điều kiện cho hacker đánh cắp toàn bộ dữ liệu."
    ]
  }
];

const inlineQuiz = oldM5.lessons.find(l => l.type === 'quiz');
const updatedQuizQuestions = inlineQuiz.questions.concat(additionalQuestions);

const newLessons = [
  t1_l1, t1_l2, t1_l3, t1_l4,
  t2_l1, t2_l2, t2_l3, t2_l4,
  t3_l1, t3_l2, t3_l3, t3_l4,
  t4_l1, t4_l2, t4_l3, t4_l4,
  {
    id: "5-quiz",
    type: "quiz",
    title: "Quiz Module 5 — Sát Hạch Toàn Diện Bảo Mật JWT & Keycloak",
    questions: updatedQuizQuestions
  }
];

const newM5 = {
  id: 5,
  title: "Security: JWT & Keycloak",
  subtitle: "Spring Security 6, Stateless JWT, Keycloak SSO & BFF Pattern",
  icon: "🔒",
  desc: "Thiết lập bảo mật doanh nghiệp với Spring Security 6, Stateless JWT Token Rotation, OAuth2 Resource Server Keycloak và kiến trúc BFF.",
  topics: topics,
  outcomes: outcomes,
  retrievalWarmup: retrievalWarmup,
  lessons: newLessons
};

const outputContent = `/* MODULE 5 — Security: JWT & Keycloak (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(newM5, null, 2)});\n`;

fs.writeFileSync(m5Path, outputContent, 'utf8');
console.log('Successfully curated module5.js!');
console.log('Total content lessons:', newLessons.filter(l => l.type !== 'quiz').length);
console.log('Total quiz questions:', updatedQuizQuestions.length);
