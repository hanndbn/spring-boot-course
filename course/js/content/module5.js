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
## Security là chuỗi filter — hiểu trước khi code

Mọi request đi qua **SecurityFilterChain** — dải filter xếp lớp như hành kiểm tra an ninh sân bay.

~~~text
Request
 → SecurityContextHolderFilter    (nạp authentication)
 → HeaderWriterFilter             (security headers)
 → CsrfFilter                     (chống CSRF)
 → UsernamePasswordAuthenticationFilter
 → BearerTokenAuthenticationFilter ← JWT ở đây!
 → AuthorizationFilter            (kiểm tra quyền truy cập URL)
 → ... → DispatcherServlet → Controller
~~~

---

## 1. Chuỗi filter hiện đại (lambda DSL)

Spring Security 6 bỏ hẳn <code>WebSecurityConfigurerAdapter</code> — cấu hình bằng bean:

~~~java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)      // REST API: tắt CSRF
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // token, không session
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()     // login công khai
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/tasks/**").hasRole("USER")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/tasks/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .httpBasic(Customizer.withDefaults())
            .build();
    }
}
~~~

:::tip STATELESS + CSRF
REST API token-based không dùng cookie session → CSRF (loại tấn công dựa vào cookie tự động gửi) không còn liên quan → tắt được. Form web truyền thống thì PHẢI giữ CSRF.
:::

## 2. Authentication vs Authorization

| | Authentication (xác thực) | Authorization (phân quyền) |
|---|---|---|
| Câu hỏi | "Bạn là ai?" | "Bạn được làm gì?" |
| Cơ chế | Login, token, biometrics | Role, permission |
| Trong Spring | <code>AuthenticationManager</code> | <code>AuthorizationFilter</code>, <code>@PreAuthorize</code> |

## 3. UserDetailsService — xác thực từ DB

~~~java
@Service
public class DbUserDetailsService implements UserDetailsService {

    private final UserRepository repo;

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = repo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException(username));

        return org.springframework.security.core.userdetails.User
            .withUsername(user.getUsername())
            .password(user.getPasswordHash())       // bcrypt hash!
            .roles(user.getRole())                  // ROLE_ prefix tự thêm
            .build();
    }
}

@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();     // KHÔNG BAO GIỜ lưu plaintext
}
~~~

## 4. Method Security — phân quyền tinh vet

~~~java
@Configuration
@EnableMethodSecurity          // bật @PreAuthorize
public class MethodSecurityConfig { }

@Service
public class TaskService {

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteTask(Long id) { ... }

    // SpEL: authority chứa ADMIN or MANAGER
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<TaskDto> report() { ... }

    // Theo dữ liệu: chỉ chủ sở hữu hoặc admin mới sửa
    @PreAuthorize("""
        hasRole('ADMIN') or
        @taskSecurity.isOwner(#taskId, authentication.name)
        """)
    public TaskDto update(Long taskId, UpdateTaskRequest req) { ... }

    @PostAuthorize("returnObject.assignee() == authentication.name")
    public TaskDto findById(Long id) { ... }    // kiểm tra SAU khi load
}
~~~

Component hỗ trợ:

~~~java
@Component("taskSecurity")
public class TaskSecurity {
    private final TaskRepository repo;

    public boolean isOwner(Long taskId, String username) {
        return repo.findById(taskId)
            .map(t -> t.getAssignee().getUsername().equals(username))
            .orElse(false);
    }
}
~~~

## 5. SecurityContext — đọc user hiện tại

~~~java
@GetMapping("/me")
public Map<String, Object> me(@AuthenticationPrincipal UserDetails user) {
    return Map.of("username", user.getUsername(),
                  "authorities", user.getAuthorities());
}

// Hoặc qua Authentication
@GetMapping("/me2")
public Map<String, Object> me2(Authentication auth) {
    return Map.of("name", auth.getName(),
                  "roles", auth.getAuthorities());
}
~~@

## 6. CSRF — 30 giây hiểu bản chất

Tấn công: user đã login bank.com (cookie tự động gửi) → vào evil.com có form POST chuyển tiền → browser gửi kèm cookie → transaction chạy.

Phòng: CSRF token — server sinh token, form phải kèm, evil.com không biết token. Session-based cần; token-based (JWT trong header) miễn nhiễm tự nhiên.

:::laas ĐỐI CHIẾU LAAS
Keycloak LAAS chính là External IdP: app của bạn không tự lưu password user mà **ủy thác** cho Keycloak. Bài tiếp: tích hợp resource server validate JWT do Keycloak phát hành — đúng như bạn đang làm với nimbus-jose-jwt ở Identity Service.
:::

:::takeaways
- Spring Security = SecurityFilterChain; JWT qua BearerTokenAuthenticationFilter
- STATELESS cho API token; CSRF chỉ cần cho session-cookie web
- UserDetailsService + BCrypt cho xác thực tự quản
- @PreAuthorize + SpEL phân quyền theo role + theo dữ liệu
- @AuthenticationPrincipal lấy user hiện tại trong controller
:::
`
    },
    {
      id: "5-2",
      type: "lesson",
      title: "JWT sâu: cấu trúc, signing, validation",
      minutes: 45,
      content: `
## Mổ xẻ JWT

~~~text
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiIxMjM0In0 . SflKxwRJSMeKKF2QT4f...
│                        │                    │
└── Header               └── Payload           └── Signature
    {"alg":"HS256"}          {"sub":"1234"}       HMAC(header.payload, secret)
~~~

- **Header**: thuật toán ký (HS256, RS256...)
- **Payload**: claims (sub, iss, exp, custom...)
- **Signature**: đảm bảo token không bị sửa

⚠️ Payload chỉ **base64 — KHÔNG mã hóa**. Ai cũng đọc được → đừng nhét mật khẩu/ thông tin nhạy cảm.

---

## 1. Claims quan trọng (RFC 7519)

| Claim | Ý nghĩa | Ví dụ |
|---|---|---|
| <code>sub</code> | Subject — user id | <code>"1234"</code> |
| <code>iss</code> | Issuer — ai phát hành | <code>"https://keycloak/auth/realms/laas"</code> |
| <code>aud</code> | Audience — token dành cho service nào | <code>"task-api"</code> |
| <code>exp</code> | Expiry (epoch seconds) | <code>1759459200</code> |
| <code>iat</code> | Issued at | <code>1759372800</code> |
| <code>jti</code> | Token ID — duy nhất, dùng revoke | <code>UUID</code> |

## 2. Ký đối xứng (HMAC) vs bất đối xứng (RSA/ECDSA)

| | HS256 (HMAC) | RS256 (RSA) |
|---|---|---|
| Số key | 1 secret dùng chung | Key pair: private ký / public verify |
| Ai verify | Chỉ ai giữ secret | **Ai cũng có public key** |
| Phù hợp | 1 service tự phát + tự verify (monolith) | **Keycloak phát, nhiều service verify** |

:::tip KEYCLOAK DÙNG RS256
IdP (Keycloak) ký bằng private key; mọi resource server chỉ cần tải **public key** từ endpoint <code>/certs</code> (JWKS) để verify. Không ai giả mạo được token nếu không có private key.
:::

## 3. Flow chuẩn: Keycloak + Resource Server

~~~text
1. Client login Keycloak (authorization code + PKCE)
2. Keycloak trả access_token (JWT) + refresh_token
3. Client gọi API: Authorization: Bearer <access_token>
4. Resource server:
   a. Lấy JWKS từ Keycloak (cache) — khóa public
   b. Verify signature + exp + iss + aud
   c. Map claims → authorities
   d. Chuyền qua AuthorizationFilter → controller
~~~

## 4. Tự tay với Nimbus (để hiểu — rồi dùng Spring abstraction)

~~~java
// Ký token (phía IdP)
SignedJWT jwt = new SignedJWT(
    new JWSHeader.Builder(JWSAlgorithm.HS256).build(),
    new JWTClaimsSet.Builder()
        .subject("1234")
        .issuer("https://auth.laas.vn")
        .expirationTime(Date.from(Instant.now().plus(30, ChronoUnit.MINUTES)))
        .claim("roles", List.of("USER", "ADMIN"))
        .build());

jwt.sign(new MACSigner(secret));          // HMAC
String token = jwt.serialize();

// Verify (phía resource server)
SignedJWT parsed = SignedJWT.parse(token);
JWSVerifier verifier = new MACVerifier(secret);
if (!parsed.verify(verifier)) throw new InvalidTokenException();
if (parsed.getJWTClaimsSet().getExpirationTime().before(new Date()))
    throw new TokenExpiredException();
~~~

:::warn NIMBUS vs SPRING ABSTRACTION
Bạn từng tích hợp Nimbus trực tiếp ở Identity Service — tuyệt vời để hiểu nguyên lý! Nhưng cho resource server, **spring-boot-starter-oauth2-resource-server** tự lo JWKS caching, clock skew, issuer validation... an toàn hơn tự viết.
:::

## 5. Access token vs Refresh token

| | Access token | Refresh token |
|---|---|---|
| Tuổi thọ | Ngắn (5-15 phút) | Dài (giờ-ngày) |
| Dùng để | Gọi API mỗi request | Đổi access token mới |
| Lưu ở client | Bộ nhớ (không localStorage XSS!) | HttpOnly cookie hoặc secure storage |

Access token ngắn = bị đánh cắp thì cửa sổ tấn công nhỏ. Refresh token cần bảo vệ hơn — Keycloak hỗ trợ rotation.

## 6. Những sai lầm chết người với JWT

:::danger CHECKLIST AN TOÀN
1. **Chỉ verify signature thôi là chưa đủ** — phải check <code>exp</code>, <code>iss</code>, <code>aud</code>
2. **Không tin claims chưa verify** — luôn verify trước khi đọc sub/roles
3. **Không lưu JWT trong localStorage** — XSS ăn sạch; dùng memory + refresh qua HttpOnly cookie
4. **Không nhét dữ liệu nhạy cảm vào payload** — base64 ≠ mã hóa
5. **alg: "none" tấn công** — thư viện chuẩn đã chặn, nhưng tự viết parser thì beware
6. **JWK rotation** — Keycloak xoay khóa định kỳ; luôn fetch JWKS động, đừng hardcode key
:::

## 7. Testing API bảo vệ bằng curl

~~~bash
# Lấy token từ Keycloak (client credentials flow)
curl -X POST http://localhost:8180/realms/demo/protocol/openid-connect/token \
  -d "grant_type=client_credentials" \
  -d "client_id=task-api" \
  -d "client_secret=xxx"

# Gọi API với token
curl http://localhost:8080/api/v1/tasks \
  -H "Authorization: Bearer eyJhbG..."
~~~

:::laas ĐỐI CHIẾU LAAS
LAAS Identity Service phát token Nimbus; các service khác validate. Khi debug lỗi 401, check theo thứ tự: (1) token hết hạn chưa, (2) issuer khớp config chưa, (3) audience có service không, (4) đồng hồ server lệch (clock skew) — nhất là khi deploy nhiều môi trường.
:::

:::takeaways
- JWT = header.payload.signature — payload KHÔNG mã hóa, chỉ chống sửa
- Keycloak RS256: private ký IdP, public verify mọi service qua JWKS
- Verify đầy đủ: signature + exp + iss + aud
- Access token ngắn + refresh token dài (rotation)
- Dùng oauth2-resource-server starter thay tự viết filter
:::
`
    },
    {
      id: "5-3",
      type: "lesson",
      title: "Tích hợp Keycloak thực chiến",
      minutes: 55,
      content: `
## Keycloak — IdP mã nguồn mở đứng sau LAAS

Keycloak quản lý: users, login UI, password policy, MFA, sessions, social login, admin console. App của bạn chỉ cần **ủy thác**.

---

## 1. Chạy Keycloak local

~~~bash
docker run -d --name keycloak -p 8180:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:26.0 \
  start-dev
~~~

Mở <code>http://localhost:8180</code> → Administration Console (admin/admin).

## 2. Setup realm + client (5 phút)

1. Tạo realm **demo**
2. Tạo client **task-api**:
   - Client type: **OpenID Connect**
   - Client authentication: ON (confidential)
   - Valid redirect URIs: <code>http://localhost:3000/*</code>
3. Tạo 2 users (an/user, binh/admin), đặt password ở tab Credentials
4. Tạo realm roles: <code>USER</code>, <code>ADMIN</code> — gán cho users
5. Client scopes → dedicated scope → thêm mapper <code>realm roles</code> → token claim <code>roles</code>

:::info REALM LÀ GÌ?
Realm = không gian cô lập: users, roles, clients của tenant/domain. 1 Keycloak chứa nhiều realm độc lập — LAAS có thể tách realm per môi trường/khách hàng lớn.
:::

## 3. Spring Boot resource server

~~~xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
~~~

~~~yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://localhost:8180/realms/demo
          # Spring tự fetch: {issuer}/.well-known/openid-configuration
          # → JWKS URI → public key → verify signature
~~~

~~~java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter())))
            .build();
    }

    // Map claim "roles" trong token → Spring authorities
    private JwtAuthenticationConverter jwtAuthConverter() {
        JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
        scopes.setAuthoritiesClaimName("roles");
        scopes.setAuthorityPrefix("");        // token đã có "ROLE_..." hoặc dùng prefix

        JwtAuthenticationConverter conv = new JwtAuthenticationConverter();
        conv.setJwtGrantedAuthoritiesConverter(scopes);
        return conv;
    }
}
~~~

Xong! Mọi request cần <code>Authorization: Bearer &lt;jwt&gt;</code> — Spring tự verify + map roles.

## 4. Kiểm tra bằng HTTPie/curl

~~~bash
# Password grant (test) — lấy token cho user "an"
TOKEN=$(curl -s -X POST \
  http://localhost:8180/realms/demo/protocol/openid-connect/token \
  -d grant_type=password \
  -d client_id=task-api \
  -d username=an -d password=123 \
  | jq -r .access_token)

# Gọi API
curl http://localhost:8080/api/v1/tasks \
  -H "Authorization: Bearer $TOKEN"
# 200 OK — roles đã map

curl -X DELETE http://localhost:8080/api/v1/tasks/1 \
  -H "Authorization: Bearer $TOKEN"
# 403 — user "an" chỉ có ROLE_USER, delete cần ADMIN
~~~

## 5. Phân quyền theo user — @PreAuthorize + custom claim

~~~java
@PreAuthorize("""
    hasRole('ADMIN') or
    #jwt.getClaimAsString('preferred_username') == #owner
    """)
@PutMapping("/{owner}/tasks/{id}")
public ResponseEntity<TaskDto> updateForOwner(
        @PathVariable String owner,
        @PathVariable Long id,
        @AuthenticationPrincipal Jwt jwt) { ... }
~~~

## 6. Testing secured API

~~~java
@WebMvcTest(TaskController.class)
class SecuredControllerTest {

    @Autowired MockMvc mockMvc;

    @Test
    void noTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/tasks"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void withTokenReturns200() throws Exception {
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "none")
            .subject("user-1")
            .claim("roles", List.of("ROLE_USER"))
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(600))
            .build();

        mockMvc.perform(get("/api/v1/tasks")
                .with(jwt().jwt(jwt)))         // security test support
            .andExpect(status().isOk());
    }

    @Test
    void userRoleCannotDelete() throws Exception {
        mockMvc.perform(delete("/api/v1/tasks/1")
                .with(jwt().jwt(mockJwt("ROLE_USER"))))
            .andExpect(status().isForbidden());
    }
}
~~~

## 7. Kiến trúc tổng thể sau khi tích hợp

~~~text
┌──────────┐   1. login    ┌───────────┐
│  Client  │ ────────────→ │ Keycloak  │
│ (SPA/app)│ ←──────────── │  (IdP)    │
└──────────┘  2. JWT       └───────────┘
      │
      │ 3. Bearer token
      ▼
┌──────────────────┐   4. verify (JWKS cache)   ┌───────────┐
│ Resource Server  │ ─────────────────────────→ │ Keycloak  │
│ (Spring Boot)    │   5. authorize @PreAuth    │  /certs    │
└──────────────────┘                            └───────────┘
~~~

:::laas ĐỐI CHIẾU LAAS — ĐỌC CODE THẬT
Mở repo LAAS: (1) tìm <code>issuer-uri</code> trong application.yml các service, (2) tìm class SecurityConfig/JwtAuthConverter, (3) xem cách LAAS map roles từ Keycloak token. Bạn sẽ thấy đúng pattern vừa học — giờ bạn đọc hiểu và modify được.
:::

:::takeaways
- Keycloak: realm (cô lập) → client (app) → roles (quyền)
- issuer-uri 1 dòng — Spring tự OIDC discovery + JWKS + verify
- JwtAuthenticationConverter map claims → authorities
- Test: jwt() request post-processor của spring-security-test
- Debug 401: exp → iss → aud → clock skew
:::
`
    },
    {
      id: "5-4",
      type: "lesson",
      title: "CORS & CSRF — hiểu đúng trước khi cấu hình",
      minutes: 40,
      content: `
## 2 chữ C gây nhầm lẫn nhất trong security

CORS và CSRF thường bị đồng nhầm là một hoặc bị tắt thô bạo (cors: *). Bài này tách bạch: CORS là cơ chế trình duyệter cho phép cross-origin; CSRF là tấn công giả mạo request từ site khác. Cái thứ 2 liên quan cookie, không liên quan token header.
---

## 1. CORS — Same-Origin Policy và cách mở có kiểm soát

Trình duyệt chặn JS ở origin A đọc response từ origin B (Same-Origin Policy). CORS là cơ chế LỘNG SẠCH: server trả header cho phép.

~~~text
Origin A: https://admin.addpay.africa     (SPA)
Origin B: https://api.addpay.africa       (Spring Boot)

Request: GET https://api.../members
→ Trình duyệt tự đính kèm Origin: https://admin...
→ Server trả: Access-Control-Allow-Origin: https://admin.addpay.africa
→ JS đọc được response
~~~

Preflight — request OPTIONS kiểm tra trước khi gửi thật (đối với method ngoài GET/POST đơn giản hoặc header tùy chỉnh):

~~~text
OPTIONS /api/v1/members
Access-Control-Request-Method: DELETE
Access-Control-Request-Headers: authorization, content-type
→ Server phê duyệt: Access-Control-Allow-Methods: DELETE
~~~

### Cấu hình Spring Boot

~~~java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("\${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOriginPatterns(allowedOrigins.toArray(String[]::new))
            .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH")
            .allowedHeaders("*")
            .exposedHeaders("Location", "X-Correlation-Id")
            .maxAge(3600);                      // cache preflight 1 giờ
    }
}
~~~

:::warn CẤU HÌNH CORS TRONG SECURITY FILTER CHAIN
Khi dùng Spring Security: CORS phải cấu hình ở 2 nơi — WebMvcConfigurer (để trình duyệt hiểu) VÀ http.cors(Customizer.withDefaults()) trong SecurityFilterChain (để preflight OPTIONS không bị 401 chặn trước khi đến MVC). Thiếu 1 trong 2: preflight bị chặn, browser báo lỗi CORS mơ hồ.
:::

## 2. CSRF — khi nào thật sự cần chống

CSRF lợi dụng cookie tự động đính kèm: user đang login bank.com (cookie session), vào evil.com, evil.com gửi POST bank.com/transfer — cookie tự đính, bank tưởng user thật.

| Kiểu API | Cookie tự đính? | Cần CSRF protection? |
|---|---|---|
| Session cookie (form login) | Có | **CÓ** |
| JWT trong Authorization header (SPA) | Không | Không (thường tắt) |
| JWT trong cookie (BFF) | Có | **CÓ** (cookie tự đính) |
| API-to-API server (machine) | Không | Không |

SPA dùng Authorization Bearer header: token nằm JS, evil.com không đọc được (SOP) → CSRF không thể — đó là lý do tắt csrf().disable() phổ biến ở API.

BFF pattern (Module 5 bài 5): access token lưu HttpOnly cookie — cookie TỰ ĐÍNH KÈM → phải bật CSRF protection trở lại + SameSite=Lax cookie + double-submit token.

~~~java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())           // JWT header — không cookie
        .cors(Customizer.withDefaults())        // dùng CorsConfig ở trên
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll()
            .anyRequest().authenticated())
        .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
        .build();
}
~~~

## 3. SameSite cookie — lớp chống CSRF của chính trình duyệt

~~~text
Set-Cookie: SESSION=abc; HttpOnly; Secure; SameSite=Lax
~~~

| Thuộc tính | Ý nghĩa |
|---|---|
| <code>HttpOnly</code> | JS không đọc được — chống XSS steal |
| <code>Secure</code> | Chỉ gửi qua HTTPS |
| <code>SameSite=Lax</code> | Chỉ gửi cùng-site request — chặn CSRF từ evil.com |
| <code>SameSite=Strict</code> | Không gửi kể cả link từ site khác — an toàn nhất, UX phiền |

Modern browser mặc định Lax — dòng thủ công là để rõ ý đồ + bảo vệ browser cũ.

## 4. Bẫy CORS thực chiến

- **Đổi response header sau khi chạy**: filter/interceptor thêm header vào response đã commit → vô nghĩa. CORS phải xử lý TRƯỚC controller.
- **allowedOrigins("\*") + allowCredentials(true)**: trình duyệt từ chối — spec không cho phép. Muốn credentials: phải liệt kê origin cụ thể.
- **Preflight 401**: OPTIONS không mang token (browser không đính Authorization cho preflight) — security chain phải permitAll OPTIONS hoặc http.cors() xử lý trước authentication.
- **Proxy che mất Origin**: nginx proxy đổi header — phải truyền X-Forwarded-For/Proto hoặc forwardheaders strategy trong Spring.

:::laas LAAS SPA admin (React) gọi API qua gateway. CORS cấu hình ở gateway theo whitelist domain; CSRF tắt vì Bearer header. Đối chiếu: nếu LAAS chuyển sang BFF (cookie HttpOnly), CSRF phải bật lại + SameSite — mọi cấu hình "tắt CSRF cho API" phải được xem xét lại theo kiểu lưu trữ token, không phải "API thì tắt" một chiều.
:::

:::takeaways
- CORS là cơ chế trình duyệt cho phép đọc cross-origin; server kiểm soát qua header
- Preflight OPTIONS phải được phép qua security chain — http.cors() xử lý
- CSRF liên quan COOKIE tự đính: session/BFF cookie cần, JWT header không
- SameSite=Lax mặc định browser — Explicit vì ý đồ + browser cũ
- allowedOrigins("*") + credentials = bị từ chối — liệt kê origin cụ thể
- Câu hỏi quyết định CSRF: token nằm đâu? Header → tắt được; Cookie → phải bật
:::
`
    },
    {
      id: "5-5",
      type: "lesson",
      title: "OAuth2 & OIDC Flows — Authorization Code + PKCE cho SPA/Mobile",
      minutes: 45,
      content: `
## 4 flows bạn sẽ gặp — và flow nào đã chết

SPA, mobile, web server, machine-to-machine: mỗi loại client một flow. Chọn sai = lỗ hổng token lộ. Bài này: bức tranh đầy đủ + PKCE cho SPA/mobile hiện đại.
---

## 1. 4 flows thực dụng

| Flow | Client | Token lộ chỗ nào? | Trạng thái 2025 |
|---|--- |---|---|
| Authorization Code + PKCE | SPA, Mobile | Public client — không client secret | **Chuẩn** |
| Client Credentials | Service-to-service | Backend giữ secret | **Chuẩn** |
| Authorization Code (thuần) | Web server truyền thống | Backend giữ secret + code | Chuẩn (web server-side) |
| Implicit / Password | (cũ) | Token trong URL / client xử lý password | **ĐÃ CHẾT** — OAuth 2.1 xóa |

## 2. Authorization Code + PKCE — flow SPA hiện đại

~~~text
1. SPA sinh code_verifier (random 64 chars) + code_challenge = BASE64URL(SHA256(verifier))

2. Redirect trình duyệt:
   GET https://keycloak/realms/laas/protocol/openid-connect/auth
       ?response_type=code
       &client_id=admin-spa
       &redirect_uri=https://admin.addpay.africa/callback
       &scope=openid profile email
       &code_challenge=xxxxx
       &code_challenge_method=S256

3. User login Keycloak → redirect về SPA kèm ?code=AUTH_CODE

4. SPA POST code + code_verifier:
   POST https://keycloak/realms/laas/protocol/openid-connect/token
       grant_type=authorization_code
       code=AUTH_CODE
       code_verifier=ORIGINAL_VERIFIER
       client_id=admin-spa
       redirect_uri=...

5. Keycloak verify SHA256(verifier) == challenge đã gửi ở bước 2 → issue token
~~~

Tại sao PKCE giải quyết vấn đề: code trong redirect URL có thể bị chặn (mobile deep link, log server). Không PKCE: kẻ chặn code đổi lấy token. Có PKCE: đổi token cần code_verifier — chỉ SPA gốc giữ trong memory.

## 3. Client Credentials — machine-to-machine

~~~yaml
spring:
  security:
    oauth2:
      client:
        registration:
          loyalty-client:
            provider: keycloak
            client-id: loyalty-service
            client-secret: \${KC_SECRET}
            authorization-grant-type: client_credentials
            scope: api.read api.write
~~~

~~~java
@Bean
public OAuth2AuthorizedClientManager clientManager(
        ClientRegistrationRepository repo,
        OAuth2AuthorizedClientRepository authRepo) {

    var manager = new AuthorizedClientServiceOAuth2AuthorizedClientManager(
        repo, authorizedClientService);

    manager.setAuthorizedClientProvider(
        OAuth2AuthorizedClientProviderBuilder.builder()
            .clientCredentials()      // tự refresh khi hết hạn
            .build());

    return manager;
}
~~~

Service gọi service: lấy token từ Keycloak bằng client-id/secret (hoặc mTLS / signed JWT — private_key_jwt), đính Bearer. Không user context — principal là service identity.

## 4. Client quét JWT — verifying audience & issuer

~~~java
@Bean
public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
    scopes.setAuthoritiesClaimName("scope");
    scopes.setAuthorityPrefix("");

    var conv = new JwtAuthenticationConverter();
    conv.setJwtGrantedAuthoritiesConverter(jwt -> {
        var authorities = new ArrayList<GrantedAuthority>(scopes.convert(jwt));
        // realm_access.roles → ROLE_ prefix
        Map<String, Object> realm = jwt.getClaimAsStringMap...
~~~

~~~java
        // (tiếp) — map realm roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            ((List<String>) realmAccess.get("roles")).forEach(r ->
                authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
        }
        return authorities;
    });
    conv.setPrincipalClaimName("preferred_username");
    return conv;
}
~~~

Audience validation:

~~~yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://keycloak:8180/realms/laas
          audiences: loyalty-api
~~~

<code>aud</code> claim phải chứa loyalty-api — token issue cho service khác không dùng được ở đây (mỗi API 1 audience riêng).

## 5. Token refresh — SPA giữ session

~~~text
Access token 15 phút + Refresh token 12 giờ (Keycloak session)
SPA: refresh token trong memory → gọi /token grant_type=refresh_token
BFF: refresh token HttpOnly cookie → BFF endpoint refresh, SPA không thấy token
~~~

| Mô hình | Access token | Refresh token |
|---|---|---|
| SPA thuần | memory | memory — mất khi reload → re-login |
| BFF | HttpOnly cookie (server set) | HttpOnly cookie — session sống qua reload |

BFF giải quyết trade-off: SPA không giữ secret, token không chạm JS (chống XSS), refresh tự động phía BFF. Chi phí: 1 tầng BFF phải vận hành.

## 6. Spring Authorization Server — khi nào tự host IdP

Spring có Authorization Server riêng (fork Keycloak-style). Dùng khi: cần embed IdP trong product, customization sâu mà Keycloak SPI không đạt, hoặc requirement on-prem khắt khe. Còn lại — Keycloak/Ory/Auth0 dịch vụ thành thục rẻ hơn tự viết IdP.

:::laas Keycloak LAAS: admin SPA dùng Authorization Code + PKCE; notification-service gọi loyalty-service bằng client credentials; mỗi API resource server verify aud riêng. Ba flows trong 1 hệ thống thật — bạn từng cấu hình realm này khi build Keycloak image sit-0.02.
:::

:::takeaways
- Authorization Code + PKCE: SPA/mobile — verifier chống code chặn
- Client Credentials: service-to-service — principal là service identity
- Implicit/Password đã chết — OAuth 2.1 xóa bỏ
- aud claim validate per-API: token một service không dùng cho service khác
- BFF: token không chạm JS — XSS không steal được, refresh tự động
- Keycloak đủ 95% nhu cầu — tự viết IdP chỉ khi customization sâu thật sự
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
        }
      ]
    }
  ]
});
