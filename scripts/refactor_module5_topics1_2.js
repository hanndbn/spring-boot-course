const fs = require("fs");
const path = require("path");

const modulePath = path.join(__dirname, "..", "course", "js", "content", "module5.js");

global.window = { COURSE_MODULES: [] };
eval(fs.readFileSync(modulePath, "utf8"));
const m5 = window.COURSE_MODULES.find(m => m.id === 5);

// Refactor Lesson 5-1-1
const l511 = m5.lessons.find(l => l.id === "5-1-1");
if (l511) {
  l511.title = "Bài 5.1.1: Kiến trúc Spring Security 6, SecurityFilterChain & Cơ chế Ủy nhiệm Filter";
  l511.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã cỗ máy cốt lõi của Spring Security 6: **DelegatingFilterProxy** và **FilterChainProxy**.
- Hiểu tại sao trong Spring Security 6 (Spring Boot 3), class \`WebSecurityConfigurerAdapter\` đã bị khai tử hoàn toàn và thay thế bằng Bean \`SecurityFilterChain\`.
- Nắm vững thứ tự thực thi của các Filter chuẩn: \`CorsFilter\` -> \`CsrfFilter\` -> \`JwtAuthenticationFilter\` -> \`AuthorizationFilter\`.
- Đọc hiểu 100% từng dòng cấu hình Security qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: HỆ THỐNG CỔNG AN NINH SÂN BAY
**Hình tượng "Các trạm kiểm soát an ninh tại sân bay quốc tế":**
- Khách hàng (HTTP Request) muốn bước lên máy bay (Vào được Controller xử lý đơn hàng).
- Trước khi vào cửa lên máy bay, hành khách phải đi qua một chuỗi các cửa kiểm soát an ninh tuần tự (**SecurityFilterChain**):
  1. **Cổng 1 (CorsFilter)**: Kiểm tra hộ chiếu và quốc tịch — Khách từ trang web nào tới? Có được phép vào không?
  2. **Cổng 2 (CsrfFilter)**: Soi chiếu hành lý — Có mang vũ khí độc hại giả mạo request không? (Với REST API Stateless thì tắt cổng này).
  3. **Cổng 3 (JwtAuthenticationFilter)**: Quét thẻ căn cước / Vé máy bay — Xác định chính xác: *"Bạn là ai? Danh tính của bạn là gì?"* (Authentication).
  4. **Cổng 4 (AuthorizationFilter)**: Kiểm tra hạng vé — Khách vé thường không được bước vào phòng chờ hạng thương gia (Authorization / Roles).
- Nếu bất kỳ cổng nào từ chối, hành khách bị mời ra ngoài ngay lập tức (HTTP 401 hoặc 403)!
:::

---

## 1. Cái này là gì? (Kiến trúc DelegatingFilterProxy & SecurityFilterChain)

Servlet Container (Tomcat) không hề biết Spring Bean là gì. Spring Security sử dụng **DelegatingFilterProxy** làm cầu nối ủy nhiệm toàn bộ việc lọc request từ Servlet Container sang cho **FilterChainProxy** (một Spring Bean quản lý danh sách các \`SecurityFilterChain\`).

### Sơ Đồ Kiến Trúc: Chuỗi Lọc An Ninh SecurityFilterChain Trong Spring Boot 3

\`\`\`mermaid
flowchart LR
    A["HTTP Request từ Client"] --> B["Servlet Container (Tomcat)"]
    B --> C["DelegatingFilterProxy<br/>(Cầu nối ủy nhiệm)"]
    C --> D["FilterChainProxy<br/>(Quản lý SecurityFilterChain)"]
    
    subgraph CHAIN["SecurityFilterChain (Các trạm gác tuần tự)"]
        F1["CorsFilter"] --> F2["CsrfFilter (Disabled)"]
        F2 --> F3["JwtAuthenticationFilter<br/>(Đọc Bearer Token & Nạp Context)"]
        F3 --> F4["AuthorizationFilter<br/>(Kiểm tra @PreAuthorize / Roles)"]
    end
    
    D --> CHAIN
    F4 --> E["DispatcherServlet -> OrderController"]
    style CHAIN fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style C fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Bối cảnh thực tế E-Commerce)

Khi xây dựng kiến trúc REST API Stateless cho ứng dụng Web và Mobile trong hệ sinh thái thương mại điện tử:

### Ma trận So sánh: Spring Security 5 cũ vs Spring Security 6 (Boot 3)

| Tiêu chí | Spring Security 5 cũ | Spring Security 6 Chuẩn Mới (Boot 3) |
|---|---|---|
| **Cú pháp cấu hình** | Kế thừa \`WebSecurityConfigurerAdapter\` (Đã bị xóa bỏ) | Khai báo Component-based: \`@Bean SecurityFilterChain\` |
| **Cấu hình Lambda DSL** | Dùng chuỗi phương thức \`.and()\` dài dòng, dễ nhầm | **100% Lambda DSL**: \`authorizeHttpRequests(auth -> auth...)\` |
| **Cơ chế phân quyền** | \`antMatchers()\` và \`authorizeRequests()\` | Thay bằng **\`requestMatchers()\`** và **\`authorizeHttpRequests()\`** |
| **Bộ lọc ủy nhiệm** | Dễ nhầm lẫn giữa URL matching của Servlet và Spring MVC | Tự động đồng bộ chuẩn mực với \`MvcRequestMatcher\` |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Dưới đây là cấu hình \`SecurityFilterChain\` chuẩn mực của kỹ sư Senior:

\`\`\`java
package vn.mastery.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import vn.mastery.ecommerce.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Kích hoạt @PreAuthorize("hasRole('ADMIN')") trên Service/Controller
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            // 1. Tắt CSRF vì REST API dùng JWT hoàn toàn Stateless
            .csrf(AbstractHttpConfigurer::disable)
            // 2. Kích hoạt cấu hình CORS theo chuẩn CorsConfigurationSource
            .cors(Customizer.withDefaults())
            // 3. ÉP BUỘC KHÔNG TẠO HTTPSESSION (Stateless)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 4. Phân quyền Endpoint
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            // 5. Chèn JwtAuthenticationFilter trước UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
\`\`\`

### Bảng Giải Mã Các Thành Phần Cốt Lõi:

| Cú pháp cấu hình | Ý nghĩa kỹ thuật | Tác động an ninh |
|---|---|---|
| \`csrf(AbstractHttpConfigurer::disable)\` | Tắt bộ lọc CSRF Token | An toàn cho REST API vì client không dùng Cookie Session của trình duyệt |
| \`SessionCreationPolicy.STATELESS\` | Cấm tạo và lưu HttpSession | Server không lưu trạng thái đăng nhập, cho phép scale ngang hàng nghìn Pod trên Kubernetes |
| \`.addFilterBefore(jwtFilter, ...)\` | Chèn Filter tùy chỉnh vào chuỗi | Đọc và giải mã JWT token trước khi hệ thống xác thực mặc định kiểm tra |
| \`@EnableMethodSecurity\` | Kích hoạt bảo mật cấp phương thức | Cho phép bảo vệ từng method cụ thể: \`@PreAuthorize("hasRole('ADMIN')")\` |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa quên bật \`SessionCreationPolicy.STATELESS\`**:
   - Nếu bạn không cấu hình dòng này, Spring Security sẽ **tự động tạo một \`JSESSIONID\` cookie** sau lần đăng nhập đầu tiên!
   - Kết quả: Khi user gửi request tiếp theo mà không kèm JWT, Spring vẫn nhận ra user thông qua Session Cookie cũ trong RAM máy chủ! Ứng dụng bị biến thành Stateful ngoài ý muốn!
`;
}

// Refactor Lesson 5-1-2
const l512 = m5.lessons.find(l => l.id === "5-1-2");
if (l512) {
  l512.title = "Bài 5.1.2: Cấu hình SecurityFilterChain Stateless, CORS Chuẩn & Vô hiệu hóa CSRF";
  l512.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải quyết dứt điểm lỗi kinh điển khiến 90% lập trình viên frontend đau đầu: **CORS Policy (Cross-Origin Resource Sharing)**.
- Hiểu bản chất yêu cầu kiểm tra trước **HTTP OPTIONS Preflight Request** của trình duyệt.
- Tự tay cấu hình \`CorsConfigurationSource\` chuẩn chỉ cho phép Frontend React/Next.js gọi API.
- Đọc hiểu 100% từng dòng cấu hình CORS qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: CORS VÀ HTTP OPTIONS PREFLIGHT
**Hình tượng "Người đưa thư lịch sự hỏi trước khi giao kiện hàng lớn":**
- Trình duyệt Chrome của người dùng đang mở trang web \`https://shopee-frontend.com\`.
- Trang web này muốn gọi API lấy danh sách đơn hàng từ server \`https://api-backend.com\` (Hai tên miền khác nhau hoàn toàn -> Cross-Origin).
- **Trình duyệt rất cảnh giác**: *"Tôi không biết anh Backend kia có đồng ý cho trang web Shopee này gọi hay không!"*.
- Trước khi gửi request thật (\`POST /api/orders\`), trình duyệt **tự động gửi một yêu cầu thăm dò trước gọi là HTTP OPTIONS (Preflight Request)**:
  - *"Này Backend, tôi chuẩn bị gửi request kèm Header Authorization, anh có cho phép không?"*.
  - Nếu Backend trả về **HTTP 200 OK kèm Header \`Access-Control-Allow-Origin\`**: Trình duyệt mới cho phép gửi tiếp request thật.
  - Nếu Backend chặn lại hoặc trả về 403 Forbidden: Trình duyệt lập tức báo lỗi đỏ lòm trên Console: **CORS Blocked**!
:::

---

## 1. Cái này là gì? (Cơ Chế Vận Hành HTTP OPTIONS Preflight)

CORS không phải là một lỗi của Backend, mà là **cơ chế bảo mật của Trình duyệt (Browser Security)** ngăn chặn các trang web độc hại lén lút gọi API đến các dịch vụ nhạy cảm của người dùng.

### Sơ Đồ Cơ Chế: 2 Bước Giao Tiếp Của Trình Duyệt Với CORS Preflight:

\`\`\`mermaid
sequenceDiagram
    participant Browser as Web Browser (React Frontend)
    participant Spring as Spring Boot SecurityFilterChain
    
    Note over Browser: Bước 1: Trình duyệt gửi Preflight tự động
    Browser->>Spring: OPTIONS /api/v1/orders (Access-Control-Request-Method: POST)
    Spring-->>Browser: HTTP 200 OK (Access-Control-Allow-Origin: https://frontend.com)
    
    Note over Browser: Bước 2: Preflight thành công -> Gửi Request thật
    Browser->>Spring: POST /api/v1/orders (Kèm Bearer JWT Token)
    Spring-->>Browser: HTTP 201 Created (Tạo đơn thành công)
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Cấu Hình Chuẩn Sản Xuất)

### Ma trận So sánh: Cấu hình \`@CrossOrigin\` vs \`CorsConfigurationSource\`

| Tiêu chí | Dùng \`@CrossOrigin\` trên Controller | Cấu hình \`CorsConfigurationSource\` tập trung |
|---|---|---|
| **Vị trí áp dụng** | Rải rác trên từng Controller class / method | **Tập trung 1 nơi duy nhất** tại \`SecurityConfig\` |
| **Xử lý Preflight OPTIONS** | Thường bị Spring Security chặn trước khi tới được Controller | **Xử lý ngay tại đầu Filter Chain (CorsFilter)** |
| **Bảo trì môi trường** | Khó đổi danh sách allowed origins giữa dev/prod | Nạp từ biến môi trường \`application.yml\` dễ dàng |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cấu hình Bean \`CorsConfigurationSource\` chuẩn mực cho hệ thống E-Commerce:

\`\`\`java
package vn.mastery.ecommerce.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 1. Cho phép các domain Frontend được chỉ định gọi vào
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",      // Next.js Local Dev
            "https://ecommerce.mastery.vn" // Production Domain
        ));

        // 2. Cho phép các HTTP Methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));

        // 3. Cho phép các Headers cần thiết
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));

        // 4. Cho phép gửi kèm Credentials (Cookie/Auth)
        config.setAllowCredentials(true);

        // 5. Cache kết quả Preflight trong 1 giờ để trình duyệt không phải gửi OPTIONS liên tục
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config); // Áp dụng cho toàn bộ API
        return source;
    }
}
\`\`\`

### Bảng Giải Mã Các Thiết Lập CORS:

| Thiết lập | Giá trị | Ý nghĩa an ninh |
|---|---|---|
| \`setAllowedOrigins\` | Danh sách domain cụ thể | Tuyệt đối không dùng dấu sao (\`*\`) khi đã bật \`setAllowCredentials(true)\` |
| \`setMaxAge(3600L)\` | 1 giờ | Trình duyệt chỉ cần hỏi preflight 1 lần mỗi giờ, giảm 50% số lượng request lên server |
| \`registerCorsConfiguration("/**", ...)\` | Áp dụng toàn cục | Đảm bảo cả các endpoint Swagger, Auth và Order đều tuân thủ |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Lỗi đụng độ giữa \`allowedOrigins = "*"\` và \`allowCredentials = true\`**:
   - Chuẩn bảo mật W3C quy định: **Nếu cho phép gửi thông tin định danh (Credentials: true) thì TUYỆT ĐỐI KHÔNG ĐƯỢC dùng wildcard (\`*\`) cho Origin**.
   - Nếu bạn cấu hình cả 2 điều này, trình duyệt sẽ chặn request ngay lập tức!
   - Khắc phục: Liệt kê danh sách domain rõ ràng hoặc dùng \`setAllowedOriginPatterns(List.of("https://*.mastery.vn"))\`.
`;
}

// Refactor Lesson 5-1-3
const l513 = m5.lessons.find(l => l.id === "5-1-3");
if (l513) {
  l513.title = "Bài 5.1.3: Cạm bẫy Bật Session Trong REST API, Lỗi CORS Preflight 403 & AntMatcher Sai";
  l513.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã nguyên nhân tại sao yêu cầu HTTP OPTIONS Preflight lại bị Spring Security trả về lỗi **HTTP 403 Forbidden**.
- Nắm vững cách Spring Security 6 xử lý \`CorsFilter\` đứng trước toàn bộ các Filter kiểm tra xác thực.
- Khắc phục lỗi cấu hình sai đường dẫn \`requestMatchers\` khiến các endpoint công khai (Public API) bị khóa nhầm.
- Đọc hiểu bảng phân tích triệu chứng lỗi và cách khắc phục chuẩn Senior.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TẠI SAO PREFLIGHT BỊ 403 FORBIDDEN?
**Hình tượng "Người hỏi đường bị cảnh sát bắt vì không có vé":**
- Yêu cầu Preflight \`OPTIONS\` của trình duyệt chỉ là một câu hỏi thăm dò: *"Cho tôi hỏi cổng này có mở không?"*.
- Vì chỉ là câu hỏi thăm dò, trình duyệt **hoàn toàn KHÔNG đính kèm Bearer Token JWT**!
- Nếu cấu hình bảo mật của bạn đặt cổng kiểm tra vé (\`AuthorizationFilter\`) **đứng trước cổng trả lời câu hỏi**:
- Cảnh sát nhìn thấy request không có token -> Lập tức quát: *"Không có vé, cấm vào!"* và ném về mã **HTTP 403**!
- Trình duyệt thấy 403 liền hủy luôn cả request thật -> Frontend gãy hoàn toàn!
- **Giải pháp**: Cổng CORS phải luôn đứng ở **vị trí số 1** để trả lời câu hỏi trước khi kiểm tra vé!
:::

---

## 1. Cái này là gì? (Bản chất Vị Trí Của CorsFilter)

Trong Spring Security, nếu không kích hoạt \`.cors(Customizer.withDefaults())\` đúng cách trong \`SecurityFilterChain\`, \`CorsFilter\` sẽ không được tích hợp vào chuỗi lọc an ninh. Kết quả là các request HTTP OPTIONS sẽ bị chuyển xuống cho các Filter phía sau kiểm tra và bị từ chối vì thiếu Authentication.

### Sơ Đồ Khắc Phục Lỗi CORS Preflight 403:

\`\`\`mermaid
flowchart TD
    A["Trình duyệt gửi OPTIONS Preflight (Không có Token)"] --> B{"Vị trí CorsFilter"}
    B -->|"Cấu hình SAI: Không kích hoạt http.cors()"| C["Request trôi xuống AuthorizationFilter"]
    C --> ERR["BÁO LỖI 403 FORBIDDEN!<br/>(Do không có JWT Token)"]
    
    B -->|"Cấu hình ĐÚNG: http.cors(Customizer.withDefaults())"| D["CorsFilter ở vị trí số 1"]
    D --> OK["Phản hồi ngay HTTP 200 OK + CORS Headers!<br/>(Không cần kiểm tra Token)"]
    style OK fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style ERR fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Quy Tắc Matcher Trong Spring Security 6)

### Ma trận So sánh: Cú pháp matcher cũ vs mới

| Cú pháp cũ (Spring Boot 2) | Cú pháp mới (Spring Boot 3) | Lỗi hay gặp |
|---|---|---|
| \`antMatchers("/auth/**")\` | **\`requestMatchers("/auth/**")\`** | Không hỗ trợ trên Spring Boot 3 |
| \`regexMatchers("...")\` | **\`requestMatchers(RegexRequestMatcher...)\`** | Cần import đúng class matcher |
| Tự phân tách HTTP Method rời | \`requestMatchers(HttpMethod.POST, "/orders")\` | Áp dụng chính xác cho từng phương thức |

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Cấu hình xử lý ngoại lệ AuthenticationEntryPoint để trả về JSON chuẩn RFC 7807 thay vì trang login HTML:

\`\`\`java
package vn.mastery.ecommerce.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.net.URI;
import java.util.Map;

@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // Trả về JSON ProblemDetails chuẩn hóa khi token không hợp lệ hoặc thiếu token
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

        Map<String, Object> body = Map.of(
            "type", URI.create("https://ecommerce.mastery.vn/errors/unauthorized"),
            "title", "Yêu cầu không được xác thực",
            "status", HttpStatus.UNAUTHORIZED.value(),
            "detail", authException.getMessage(),
            "instance", request.getRequestURI()
        );

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Luôn đăng ký \`AuthenticationEntryPoint\` trong SecurityConfig**:
   - Nếu bạn quên đăng ký entry point này: Khi khách gửi token sai, Spring Security mặc định sẽ chuyển hướng (Redirect 302) về trang \`/login\` HTML của ứng dụng web truyền thống!
   - Đăng ký bằng: \`http.exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))\`.
`;
}

// Refactor Lesson 5-1-4
const l514 = m5.lessons.find(l => l.id === "5-1-4");
if (l514) {
  l514.title = "Bài 5.1.4: Tổng Kết Thực Chiến: Bản Đồ SecurityFilterChain & Ma Trận Luồng Xác Thực Spring Security 6";
  l514.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 5.1 thành Bản đồ kiến trúc chuỗi lọc an ninh hoàn chỉnh.
- Nắm chắc thứ tự xử lý của 12 Filter tiêu chuẩn bên trong \`SecurityFilterChain\`.
- Sẵn sàng bước sang Chuyên đề 5.2 (Stateless JWT, Ký số RSA & Refresh Token Rotation).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT HỆ THỐNG AN NINH
Bạn vừa thiết lập xong "Hàng rào phòng thủ đầu tiên" của hệ thống Spring Boot:
- Cổng CORS đã mở đúng hướng cho phép Frontend bước vào.
- Cánh cửa CSRF nguy hiểm đã được vô hiệu hóa an toàn cho kiến trúc REST API.
- Toàn bộ cơ chế tạo Session cồng kềnh trong RAM đã bị tắt sạch, nhường chỗ cho kỷ nguyên **Stateless Token**.
Bây giờ, chúng ta sẽ bắt tay vào việc phát hành những chiếc "Hộ chiếu số vạn năng": **JSON Web Token (JWT)!**
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc SecurityFilterChain Hoàn Chỉnh)

### Sơ Đồ Luồng: 12 Bước Thực Thi Chi Tiết Của Một HTTP Request Qua Spring Security:

\`\`\`mermaid
flowchart TD
    A["Client Request"] --> B["1. CorsFilter (Kiểm tra Origin)"]
    B --> C["2. CsrfFilter (Bypass nếu tắt)"]
    C --> D["3. SecurityContextHolderFilter (Nạp Context rỗng)"]
    D --> E["4. HeaderWriterFilter (Chèn HSTS, X-Content-Type)"]
    E --> F["5. LogoutFilter (Bắt endpoint /logout)"]
    F --> G["6. JwtAuthenticationFilter (TỰ VIẾT: Giải mã JWT)"]
    G --> H["7. UsernamePasswordAuthenticationFilter"]
    H --> I["8. SecurityContextHolderAwareRequestFilter"]
    I --> J["9. AnonymousAuthenticationFilter (Gán Anonymous nếu chưa login)"]
    J --> K["10. ExceptionTranslationFilter (Bắt lỗi 401/403)"]
    K --> L["11. AuthorizationFilter (Kiểm tra quyền cuối cùng)"]
    L --> M["12. Đi vào Controller xử lý nghiệp vụ!"]
    style G fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style L fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Chuyên đề 5.1**:
   - [ ] Đã tắt hoàn toàn \`csrf()\`.
   - [ ] Đã kích hoạt \`sessionCreationPolicy(SessionCreationPolicy.STATELESS)\`.
   - [ ] Đã cấu hình \`CorsConfigurationSource\` chuẩn chỉ.
   - [ ] Đã đăng ký \`AuthenticationEntryPoint\` trả về JSON RFC 7807.
`;
}

// Refactor Lesson 5-2-1
const l521 = m5.lessons.find(l => l.id === "5-2-1");
if (l521) {
  l521.title = "Bài 5.2.1: Cấu trúc Kỹ thuật JWT (RFC 7519), Ký số Bất đối xứng RSA & Refresh Token Rotation";
  l521.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải phẫu cấu trúc 3 phần chuẩn hóa của JSON Web Token (RFC 7519): **Header**, **Payload** và **Signature**.
- So sánh sự khác nhau giữa ký số đối xứng (HMAC-SHA256) và ký số bất đối xứng (RSA / ECDSA).
- Hiểu tại sao trong kiến trúc Microservices phân tán, **RSA Public/Private Key** là lựa chọn Senior bắt buộc.
- Nắm vững cơ chế bảo mật tối thượng: **Refresh Token Rotation (RTR)** chống trộm cắp token.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: JWT VÀ CƠ CHẾ KÝ SỐ BẤT ĐỐI XỨNG
**1. JWT là gì? — "Tấm bằng lái xe có tem chống giả":**
- Bạn nộp hồ sơ thi bằng lái một lần duy nhất tại Sở Giao Thông (**Auth Service**).
- Sở cấp cho bạn một tấm bằng lái (**JWT Token**). Trên bằng ghi rõ: Tên, Ngày sinh, Hạng bằng lái B2 (**Payload**).
- Cuối tấm bằng có con dấu nổi của giám đốc Sở (**Signature - Chữ ký số**).
- Khi bạn lái xe trên đường: Cảnh sát giao thông ở bất kỳ tỉnh thành nào (**Order Service, Payment Service**) chỉ cần nhìn vào con dấu để biết bằng thật hay giả, **hoàn toàn không cần gọi điện thoại về trụ sở để hỏi lại**!

**2. Ký số RSA — "Chìa khóa riêng để ký, Chìa khóa chung để kiểm tra":**
- **Private Key (Chìa khóa bí mật)**: Chỉ một mình Auth Service nắm giữ trong két sắt để ký bằng lái.
- **Public Key (Chìa khóa công khai)**: Được phát cho tất cả các microservices khác để kiểm tra con dấu. Dù ai đó có ăn cắp được Public Key thì cũng không bao giờ làm giả được chữ ký!
:::

---

## 1. Cái này là gì? (Cấu Trúc Kỹ Thuật RFC 7519)

Chuỗi JWT gồm 3 phần được mã hóa Base64Url và ngăn cách bởi dấu chấm (\`.\`):

\`\`\`
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJuYW1lIjoiQWxpY2UiLCJyb2xlcyI6WyJBRE1JTiJdfQ.SignatureHashValue...
[------- 1. HEADER -------] . [------------ 2. PAYLOAD ------------] . [------- 3. SIGNATURE -------]
\`\`\`

### Sơ Đồ Quy Trình Phát Hành & Xác Thực JWT Bằng Cặp Khóa RSA:

\`\`\`mermaid
flowchart LR
    subgraph AUTH["Auth Service (Identity Provider)"]
        U["User Login"] --> SIGN["Ký Token bằng PRIVATE KEY (RSA256)"]
        SIGN --> JWT["Chuỗi JWT Hoàn Chỉnh"]
    end
    
    JWT --> CLIENT["Client (App / Web)"]
    
    subgraph RESOURCE["Order Microservice (Resource Server)"]
        CLIENT -->|"Gửi Bearer JWT"| VERIFY["Xác thực bằng PUBLIC KEY"]
        VERIFY --> OK["Giải mã Payload & Cho phép đặt hàng!"]
    end
    style SIGN fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style VERIFY fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`

---

## 2. Dùng khi nào & Tại sao? (Cơ Chế Refresh Token Rotation)

Nếu Access Token có thời hạn ngắn (15 phút), khi hết hạn client phải dùng Refresh Token để xin cấp Access Token mới:

### Sơ Đồ Cơ Chế Refresh Token Rotation (RTR) Phát Hiện Đánh Cắp Token:

\`\`\`mermaid
sequenceDiagram
    participant User as Người Dùng Hợp Lệ
    participant Hacker as Kẻ Tấn Công (Đánh cắp RT 1)
    participant Auth as Auth Server (Redis Token Store)
    
    User->>Auth: 1. Đổi RT 1 -> Nhận về (AT 2, RT 2 mới). RT 1 bị hủy!
    Note over Hacker: Hacker cố tình dùng RT 1 cũ để đổi token:
    Hacker->>Auth: 2. Gửi RT 1 cũ
    Auth->>Auth: PHÁT HIỆN GIAN LẬN! RT 1 đã từng được sử dụng!
    Note right of Auth: LẬP TỨC HỦY TOÀN BỘ PHIÊN ĐĂNG NHẬP (RT 2 bị thu hồi)!
    Auth-->>Hacker: HTTP 401 Unauthorized!
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Định nghĩa Record chứa cặp Tokens trả về khi đăng nhập thành công:

\`\`\`java
package vn.mastery.ecommerce.dto;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresInSeconds
) {
    public static AuthResponse of(String accessToken, String refreshToken, long expiresIn) {
        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn);
    }
}
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa lưu thông tin nhạy cảm trong Payload**:
   - Header và Payload của JWT chỉ được mã hóa **Base64Url, KHÔNG HỀ ĐƯỢC MẬT MÃ HÓA (ENCRYPT)**! Bất kỳ ai cũng có thể giải mã xem được nội dung.
   - **TUYỆT ĐỐI KHÔNG LƯU**: Mật khẩu, số thẻ tín dụng, mã OTP bên trong Payload của JWT!
`;
}

// Refactor Lesson 5-2-2
const l522 = m5.lessons.find(l => l.id === "5-2-2");
if (l522) {
  l522.title = "Bài 5.2.2: Triển khai JWT Authentication Filter & Quản lý Token Rotation với Redis";
  l522.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tự tay xây dựng class **\`JwtAuthenticationFilter\`** kế thừa từ \`OncePerRequestFilter\`.
- Trích xuất Bearer Token từ Header \`Authorization\`, giải mã và nạp \`UsernamePasswordAuthenticationToken\` vào \`SecurityContextHolder\`.
- Lưu trữ và thu hồi Refresh Token theo thời gian thực (Real-time Revocation) trên **Redis**.
- Đọc hiểu 100% từng dòng code xử lý Filter qua Bảng giải mã chi tiết.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: ONCE PER REQUEST FILTER
**Tại sao phải dùng OncePerRequestFilter?**
- Trong các ứng dụng Web phức tạp, một request có thể được chuyển tiếp nội bộ nhiều lần (Forward, Include, Error Dispatch).
- Nếu dùng Filter thông thường, code giải mã JWT của bạn có thể bị chạy lại **2-3 lần cho cùng 1 request**, làm tốn CPU giải mã chữ ký vô ích!
- **\`OncePerRequestFilter\`** đảm bảo một lời hứa danh dự: *"Bất kể có chuyện gì xảy ra, bộ lọc này chỉ chạy đúng DUY NHẤT 1 LẦN cho mỗi HTTP Request!"*.
:::

---

## 1. Cái này là gì? (Kiến trúc Trích Xuất & Nạp Context)

### Sơ Đồ Xử Lý Của JwtAuthenticationFilter:

\`\`\`mermaid
flowchart TD
    A["HTTP Request đến"] --> B{"Có Header Authorization:<br/>Bearer eyJ...?"}
    B -->|"KHÔNG"| C["filterChain.doFilter() cho qua tiếp"]
    B -->|"CÓ"| D["Cắt chuỗi bỏ tiền tố 'Bearer '"]
    D --> E{"Giải mã chữ ký & Hạn dùng hợp lệ?"}
    E -->|"KHÔNG (Token giả/hết hạn)"| F["Bỏ qua, không nạp Context"]
    E -->|"HỢP LỆ"| G["Trích xuất Username & Roles"]
    G --> H["Tạo UsernamePasswordAuthenticationToken"]
    H --> I["SecurityContextHolder.getContext().setAuthentication(auth)"]
    I --> C
    style I fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style F fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
\`\`\`

---

## 3. Dùng như thế nào & Phân tích từng dòng code (How-to & Line-by-line Breakdown)

Mã nguồn chuẩn của \`JwtAuthenticationFilter\`:

\`\`\`java
package vn.mastery.ecommerce.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        // 1. Kiểm tra định dạng Header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7); // Cắt bỏ "Bearer "

        // 2. Xác thực và trích xuất thông tin
        if (jwtTokenService.isTokenValid(jwt) && SecurityContextHolder.getContext().getAuthentication() == null) {
            String username = jwtTokenService.extractUsername(jwt);
            List<SimpleGrantedAuthority> authorities = jwtTokenService.extractAuthorities(jwt);

            // 3. Tạo Authentication Token và nạp vào Context
            var authToken = new UsernamePasswordAuthenticationToken(username, null, authorities);
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // 4. Cho phép request đi tiếp qua các trạm gác sau
        filterChain.doFilter(request, response);
    }
}
\`\`\`

### Bảng Giải Mã Chi Tiết Từng Dòng Code:

| Dòng code | Cú pháp | Ý nghĩa kỹ thuật | Tác động hệ thống |
|---|---|---|---|
| \`authHeader.substring(7)\` | Cắt chuỗi chuỗi tiêu chuẩn | Lấy chuỗi mã hóa JWT thực sự phía sau tiền tố \`Bearer \` | Chuẩn bị dữ liệu để đưa vào bộ giải mã |
| \`SecurityContextHolder... == null\` | Kiểm tra trạng thái hiện tại | Chỉ nạp nếu request chưa từng được xác thực trước đó | Tránh ghi đè nếu đã có cơ chế xác thực khác |
| \`new UsernamePasswordAuthenticationToken(...)\` | Tạo đối tượng xác thực | Đóng gói Principal (username), Credentials (null) và Danh sách Quyền hạn (Authorities) | Spring Security hiểu rằng người dùng này đã được chứng thực thành công |

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Hiểm họa nuốt lỗi trong Filter làm sập API**:
   - Nếu trong Filter bạn ném thẳng \`throw new RuntimeException()\`, Spring \`@RestControllerAdvice\` sẽ **KHÔNG THỂ BẮT ĐƯỢC** vì Filter nằm ngoài phạm vi của DispatcherServlet!
   - Khắc phục: Dùng \`HandlerExceptionResolver\` để chuyển tiếp ngoại lệ sang cho ControllerAdvice xử lý.
`;
}

// Refactor Lesson 5-2-3
const l523 = m5.lessons.find(l => l.id === "5-2-3");
if (l523) {
  l523.title = "Bài 5.2.3: Cạm bẫy Lỗ hổng Thuật toán 'none', Lưu Sensitive Data trong Payload & Rò rỉ Token";
  l523.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Giải mã lỗ hổng bảo mật kinh điển: **Thuật toán \`alg: "none"\`** qua mặt các thư viện JWT lỏng lẻo.
- Chặn đứng cuộc tấn công tráo đổi thuật toán: **Key Confusion Attack** (Dùng Public Key RSA làm Secret Key HMAC).
- Thiết lập thời gian sống ngắn hạn an toàn cho Access Token (10 - 15 phút) và thu hồi tức thì qua Redis Blacklist.
- Đọc hiểu bảng phân tích các lỗ hổng bảo mật token phổ biến nhất OWASP Top 10.
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: LỖ HỔNG THUẬT TOÁN "NONE"
**Hình tượng "Tấm séc ngân hàng tự chọn chế độ không cần chữ ký":**
- Bạn cầm một tấm séc ghi: *"Ngân hàng hãy chuyển cho tôi 100 tỷ đồng"*.
- Trong quy định của tấm séc có ô: "Thuật toán kiểm tra chữ ký".
- Kẻ gian khôn lỏi điền vào ô đó: **\`alg: "none"\` (Nghĩa là: Không cần chữ ký nào cả!)** và xóa sạch chữ ký ở cuối.
- Nếu nhân viên ngân hàng (Thư viện JWT cũ) ngây thơ đọc thấy \`alg: none\` liền gật đầu: *"À, tấm séc này yêu cầu không cần ký tên!"* và chuyển ngay 100 tỷ!
- Các thư viện hiện đại ngày nay **CẤM TUYỆT ĐỐI** thuật toán \`none\` và bắt buộc phải chỉ định thuật toán tin cậy từ trước!
:::

---

## 1. Cái này là gì? (Bản chất Lỗ hổng Key Confusion)

Kẻ tấn công lấy **Public Key** của hệ thống (vốn được công khai cho tất cả mọi người) và dùng nó như một Secret Key để ký một JWT giả mạo bằng thuật toán **HMAC-SHA256 (HS256)**. Nếu server không kiểm tra chặt chẽ thuật toán trong Header, server sẽ dùng chính Public Key đó để xác thực và chấp nhận token giả!

### Sơ Đồ Chặn Đứng Cuộc Tấn Công Key Confusion Trong Spring Boot:

\`\`\`mermaid
flowchart TD
    A["Hacker gửi Token giả mạo Header: alg: HS256"] --> B["JwtParser của Server"]
    B --> C{"Thuật toán trong Header có phải là RS256 chuẩn không?"}
    C -->|"KHÔNG (Là HS256 hoặc none)"| ERR["REJECT TỨC THÌ!<br/>Ném BadCredentialsException!"]
    C -->|"ĐÚNG LÀ RS256"| D["Tiến hành xác thực bằng Public Key"]
    style ERR fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
    style D fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Luôn chỉ định tường minh thuật toán xác thực**:
   - Khi cấu hình JwtDecoder, luôn cố định thuật toán được phép: \`NimbusJwtDecoder.withPublicKey(key).signatureAlgorithm(SignatureAlgorithm.RS256).build()\`.
`;
}

// Refactor Lesson 5-2-4
const l524 = m5.lessons.find(l => l.id === "5-2-4");
if (l524) {
  l524.title = "Bài 5.2.4: Tổng Kết Thực Chiến: Bản Đồ Vòng Đời JWT & Kỹ Thuật Refresh Token Rotation với Redis";
  l524.content = `
:::target 🎯 MỤC TIÊU BÀI HỌC (10 PHÚT)
- Tổng hợp toàn bộ kiến thức Chuyên đề 5.2 thành Bản đồ Quản trị Vòng đời Phiên Đăng Nhập (Session-less Token Lifecycle).
- Nắm chắc kiến trúc kết hợp: Access Token ngắn hạn trong bộ nhớ + Refresh Token có trạng thái trên Redis.
- Sẵn sàng bước sang Chuyên đề 5.3 (Tích hợp Hệ thống Đăng nhập Tập trung Keycloak SSO & OAuth2 Resource Server).
:::

:::beginner 💡 GÓC GIẢI THÍCH TRỰC QUAN: TỔNG KẾT BẢO MẬT TOKEN
Chúng ta đã hoàn thiện hệ thống xác thực Stateless chuẩn công nghiệp:
- **Tốc độ ánh sáng**: 99% các request được xác thực độc lập tại chỗ bằng chữ ký số RSA mà không cần chọc vào database.
- **Bảo mật tối đa**: Thời gian sống của Access Token chỉ vỏn vẹn 15 phút.
- **Khả năng thu hồi tức thì**: Bất cứ khi nào người dùng bấm "Đăng xuất" hoặc đổi mật khẩu, Refresh Token trên Redis bị xóa sổ ngay lập tức!
:::

---

## 1. Cái này là gì? (Bản Đồ Kiến Trúc Toàn Cảnh Chuyên Đề 5.2)

### Sơ Đồ Luồng: Vòng Đời Hoàn Chỉnh Của Token Trong Hệ Sinh Thái Microservices:

\`\`\`mermaid
flowchart TD
    subgraph LOGIN["1. Đăng Nhập Ban Đầu"]
        L1["User nộp User/Pass"] --> L2["Auth Service kiểm tra"]
        L2 --> L3["Sinh AT (15m) + RT (7 ngày)"]
        L3 --> L4["Lưu RT hash vào Redis (Whitelist)"]
    end
    
    subgraph API_CALL["2. Gọi API Bình Thường"]
        A1["Client gửi Bearer AT"] --> A2["Resource Server xác thực bằng Public Key"]
        A2 --> A3["Thực thi nghiệp vụ (Không gọi DB Auth!)"]
    end
    
    subgraph REFRESH["3. Khi AT Hết Hạn"]
        R1["Client gửi RT lên Auth Service"] --> R2{"RT có trong Redis không?"}
        R2 -->|"CÓ"| R3["Hủy RT cũ, sinh RT mới (Rotation) + AT mới"]
        R2 -->|"KHÔNG"| R4["Từ chối! Bắt buộc đăng nhập lại!"]
    end
    style L4 fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style A3 fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style R3 fill:#4c1d95,stroke:#8b5cf6,stroke-width:2px,color:#fff
\`\`\`

---

## 4. Cạm bẫy thực tế & Best Practices

1. **Checklist tốt nghiệp Chuyên đề 5.2**:
   - [ ] Sử dụng thuật toán ký số bất đối xứng RSA256 thay vì khóa đối xứng bí mật dùng chung.
   - [ ] Triển khai \`OncePerRequestFilter\` cho \`JwtAuthenticationFilter\`.
   - [ ] Tuyệt đối không lưu dữ liệu nhạy cảm vào Payload.
   - [ ] Áp dụng Refresh Token Rotation kết hợp Redis để phát hiện gian lận.
`;
}

fs.writeFileSync(modulePath, "window.COURSE_MODULES = window.COURSE_MODULES || [];\nwindow.COURSE_MODULES.push(\n" + JSON.stringify(m5, null, 2) + "\n);\n", "utf8");
console.log("Successfully refactored Module 5 Topics 5.1 & 5.2 (Lessons 5-1-1 to 5-2-4)!");
