/* MODULE 7 — DevOps & Observability */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 7,
  title: "DevOps & Observability",
  subtitle: "Docker, CI/CD, Actuator, JVM Tuning, Load Testing & Mini-LaaS Capstone",
  icon: "🚀",
  desc: "Triển khai, tối ưu và vận hành Spring Boot 3.3+ trên môi trường Cloud-Native.",
  lessons: [
    {
      id: "7-1",
      type: "lesson",
      title: "Docker cho Spring Boot production",
      minutes: 50,
      content: `## Từ "chạy trên máy em" đến "chạy ổn định trên cụm Kubernetes 100 Pods"

Rất nhiều kỹ sư Spring Boot đóng gói ứng dụng bằng một <code>Dockerfile</code> ngây thơ:
~~~dockerfile
# NGUY HIỂM & KÉM HIỆU QUẢ TRONG PRODUCTION
FROM openjdk:21
COPY target/app.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
~~~

Hậu quả tai hại trong môi trường thực chiến:
1. **Kích thước Image phình to > 1.2 GB**: Chứa cả trình biên dịch JDK, build tools không cần thiết, kéo dài thời gian kéo image (image pull time) trên Kubernetes từ vài giây thành 5 phút khi hệ thống cần tự động scale gấp trong đợt flash sale.
2. **Mất sạch bộ đệm layer (No Layer Caching)**: Mỗi khi bạn sửa đúng 1 dòng code logic, Docker buộc phải upload lại toàn bộ file fat-jar 150MB (chứa hàng trăm thư viện Spring/Hibernate không hề thay đổi) lên Docker Registry.
3. **Chạy dưới quyền <code>root</code> (Security Disaster)**: Nếu ứng dụng có lỗ hổng RCE (như Log4Shell hoặc Spring4Shell), tin tặc lập tức chiếm toàn quyền root trong container, từ đó leo thang đặc quyền để tấn công trực tiếp vào máy chủ Linux Node của cụm hạ tầng.
4. **Bị Linux Kernel OOMKilled bí ẩn (Exit Code 137)**: Container được cấp 1GB RAM nhưng cấu hình <code>-Xmx1024m</code>, JVM bị hệ điều hành "bắn tỉa" chết tươi vì bộ nhớ Off-heap (Metaspace, Direct Byte Buffers, Thread Stacks) đẩy tổng RAM vượt ngưỡng cgroups.

Bài học này sẽ hướng dẫn bạn chuẩn hóa Dockerfile cho Spring Boot 3.3+ & Java 21 đạt chuẩn Cloud-Native Enterprise: Kích thước siêu nhẹ, bảo mật phi root, tận dụng tối đa Layered Jar, và tương thích hoàn hảo với Cgroups v2.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### 1.1. Cấu trúc Layered Jar trong Spring Boot 3.x

Một Fat JAR của Spring Boot thực chất là một file ZIP chứa 4 nhóm thành phần có tần suất thay đổi hoàn toàn khác nhau:

~~~text
+-------------------------------------------------------------------------+
| Spring Boot Fat JAR Structure                                           |
|                                                                         |
| [ dependencies/ ]          --> Thư viện bên thứ 3 (Spring, Hibernate...)  |
|                               (90% dung lượng, hầu như KHÔNG BAO GIỜ đổi) |
| [ spring-boot-loader/ ]    --> Trình nạp lớp JarLauncher của Spring      |
|                               (Rất nhẹ, chỉ đổi khi nâng cấp Boot version)|
| [ snapshot-dependencies/ ] --> Thư viện nội bộ đang phát triển           |
|                               (Ít đổi)                                  |
| [ application/ ]           --> Source code class files của bạn          |
|                               (Chỉ 1-5MB, ĐỔI MỖI LẦN COMMIT CODE!)      |
+-------------------------------------------------------------------------+
~~~

Docker Registry lưu trữ các image dưới dạng một chuỗi các **Layers** xếp chồng lên nhau. Khi bạn push một version mới, Docker chỉ push những layer nào có mã băm (checksum) thay đổi:
- Nếu dùng Fat JAR thông thường: 1 dòng code đổi -> 1 layer 150MB bị đẩy lên.
- Nếu dùng **Layered JAR**: 1 dòng code đổi -> Docker tái sử dụng 100% layer dependencies (145MB), chỉ build và push duy nhất layer <code>application</code> (vài Megabytes)! Thời gian CI/CD build giảm từ 6 phút xuống còn **15 giây**.

### 1.2. Cuộc chiến Base Image: Alpine vs Debian Slim vs Distroless

| Tiêu chí | Alpine Linux (<code>musl libc</code>) | Debian/Ubuntu Slim (<code>glibc</code>) | Google Distroless (<code>glibc</code>) |
|---|---|---|---|
| Kích thước | Siêu nhỏ (~5MB base) | Trung bình (~30MB base) | Rất nhỏ (~20MB base) |
| C-Standard Library | <code>musl</code> libc | <code>glibc</code> chuẩn | <code>glibc</code> chuẩn |
| Tương thích JVM | Có thể gặp lỗi giật lag JIT / C1/C2 compiler | 100% tương thích tối ưu | 100% tương thích tối ưu |
| Sự cố DNS resolution | Thường gặp lỗi trễ 5s (do cách musl query IPv6) | Không bị lỗi DNS | Không bị lỗi DNS |
| Shell bên trong | Có <code>/bin/sh</code> | Có <code>/bin/bash</code> | **KHÔNG CÓ SHELL (<code>no sh</code>)** |
| Độ an toàn (Attack Surface) | Thấp | Trung bình | **Cực kỳ cao (Tin tặc không thể chạy lệnh)** |

> [!IMPORTANT]
> Đối với ứng dụng tài chính / tải cao, khuyến nghị dùng **Ubuntu/Debian Slim (ví dụ <code>eclipse-temurin:21-jre-jammy</code>)** hoặc **Google Distroless Java 21**. Tránh dùng Alpine cho các dịch vụ phụ thuộc nhiều vào I/O mạng hiệu năng cao do sự khác biệt trong kiến trúc threading và DNS của <code>musl libc</code>.

### 1.3. Cgroups v2 & Bộ nhớ JVM Off-Heap: Tránh bẫy Exit Code 137

Khi chạy trong Kubernetes hoặc Docker với giới hạn RAM (ví dụ: <code>limits.memory: 1024Mi</code>):
Tổng bộ nhớ mà tiến trình Java tiêu thụ trên hệ điều hành Linux gồm:

$$	ext{Total RSS Memory} = 	ext{Heap Memory} + 	ext{Metaspace} + 	ext{Thread Stacks} + 	ext{Direct Memory (Netty)} + 	ext{JVM Overhead (GC, Code Cache)}$$

- Nếu bạn cấu hình <code>-Xmx1024m</code> trên container 1024MB RAM: Khi Heap dùng tới 800MB và Netty buffer + Metaspace dùng thêm 250MB -> Tổng RAM đạt 1050MB.
- **Hậu quả**: Linux OOM-Killer lập tức gửi tín hiệu <code>SIGKILL (kill -9)</code> tới container. Tiến trình Java chết ngay tắp lự, container sập với mã lỗi <code>Exit Code 137</code>, không kịp ghi lại bất kỳ log hay stack trace nào!
- **Chuẩn cấu hình**: Sử dụng <code>-XX:MaxRAMPercentage=75.0</code>. Cờ này ra lệnh cho JVM chỉ cấp tối đa 75% giới hạn RAM của Container cho Heap (ví dụ: 768MB trên container 1GB), để dành 25% còn lại cho Metaspace, GC and Thread stacks.

---

## 2. Production-Grade Implementation Code

### 2.1. File <code>pom.xml</code> Cấu hình Layered Jar chuyên sâu

Thêm cấu hình tách lớp tùy biến trong <code>pom.xml</code>:

~~~xml
<build>
    <plugins>
        <plugin>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-maven-plugin</artifactId>
            <configuration>
                <layers>
                    <enabled>true</enabled>
                    <includeLayerTools>true</includeLayerTools>
                </layers>
            </configuration>
        </plugin>
    </plugins>
</build>
~~~

### 2.2. Multi-Stage Production Dockerfile Đạt Chuẩn Enterprise Security

Dockerfile chuẩn 2 stage: Tận dụng eclipse-temurin, trích xuất layer, tạo non-root user và cấu hình JVM flags:

~~~dockerfile
# =========================================================================
# STAGE 1: Builder & Layer Extractor
# =========================================================================
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /workspace

# 1. Tận dụng Docker layer cache cho Maven dependencies
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

# 2. Copy mã nguồn và đóng gói JAR
COPY src src
RUN ./mvnw clean package -DskipTests -B

# 3. Trích xuất các lớp Layered JAR bằng JarLauncher
RUN java -Djarmode=layertools -jar target/*.jar extract

# =========================================================================
# STAGE 2: Production Minimal Runtime
# =========================================================================
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /application

# 1. Tạo Non-Root User & Group (UID/GID 10001) bảo mật
RUN groupadd -g 10001 appgroup &&     useradd -u 10001 -g appgroup -s /bin/bash -m appuser

# 2. Tạo thư mục chứa Heap Dump khi xảy ra sự cố OOM
RUN mkdir -p /dumps && chown -R appuser:appgroup /dumps /application

# 3. Copy các layer theo thứ tự từ ít thay đổi nhất đến thường xuyên nhất
COPY --from=builder --chown=appuser:appgroup /workspace/dependencies/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/spring-boot-loader/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/snapshot-dependencies/ ./
COPY --from=builder --chown=appuser:appgroup /workspace/application/ ./

# 4. Chuyển sang non-root user
USER 10001:10001

# 5. Cấu hình cổng mạng & Biến môi trường JVM
EXPOSE 8080 8081

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0                -XX:InitialRAMPercentage=50.0                -XX:+ExitOnOutOfMemoryError                -XX:+HeapDumpOnOutOfMemoryError                -XX:HeapDumpPath=/dumps/oom_dump.hprof                -Djava.security.egd=file:/dev/./urandom                -XX:+UseG1GC                -Dspring.backgroundpreinitializer.ignore=true"

# 6. Khởi động qua Spring Boot JarLauncher chính thống (nhanh hơn java -jar)
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
~~~

### 2.3. Production Docker Compose (<code>docker-compose.prod.yml</code>)

Cấu hình tài nguyên nghiêm ngặt, gắn volume lưu trữ Heap dump, giới hạn log file chống tràn ổ cứng:

~~~yaml
version: '3.8'

services:
  payment-service:
    build:
      context: .
      dockerfile: Dockerfile
    image: enterprise/payment-service:1.0.0
    container_name: payment-service-prod
    restart: on-failure:5
    
    # 1. Bảo mật tối đa: Cấm leo thang đặc quyền, root filesystem chỉ đọc
    security_opt:
      - no-new-privileges:true
    read_only: false
    user: "10001:10001"
    
    # 2. Giới hạn tài nguyên Cgroups nghiêm ngặt
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1024M
        reservations:
          cpus: '0.5'
          memory: 512M

    # 3. Biến môi trường production
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SERVER_PORT=8080
      - MANAGEMENT_SERVER_PORT=8081
      - DB_URL=jdbc:postgresql://postgres-db:5432/payment_db
      - DB_USER=payment_app
      - DB_PASSWORD=/run/secrets/db_password

    # 4. Gắn mount volume lưu trữ heap dump ngoài vòng đời container
    volumes:
      - payment-heap-dumps:/dumps
      - /tmp:/tmp

    ports:
      - "8080:8080"
      - "8081:8081"

    # 5. Healthcheck chuẩn qua Spring Actuator Liveness Probe
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/actuator/health/liveness"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s

    # 6. Giới hạn log rotation phòng chống sập ổ cứng máy chủ
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"

volumes:
  payment-heap-dumps:
    driver: local
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Kiểm tra Cấu trúc Layer & Hiệu năng Cache bằng Docker History

Sau khi build image, hãy kiểm tra kích thước từng layer để đảm bảo code ứng dụng tách biệt hoàn toàn với dependencies:

~~~bash
docker build -t enterprise/payment-service:latest .

# Xem chi tiết kích thước từng layer
docker history enterprise/payment-service:latest --format "table {{.Size}}	{{.CreatedBy}}"
~~~

Kết quả chuẩn:
~~~text
SIZE        CREATED BY
1.8MB       COPY /workspace/application/ ./          <-- Khi sửa code, chỉ layer này bị thay đổi!
0B          COPY /workspace/snapshot-dependencies/ ./
320KB       COPY /workspace/spring-boot-loader/ ./
142MB       COPY /workspace/dependencies/ ./         <-- Nằm ở đáy, được Docker cache vĩnh viễn
210MB       eclipse-temurin:21-jre-jammy base OS
~~~

### 3.2. Quét Lỗ Hổng Bảo Mật Container Bằng Trivy

Trước khi đẩy image lên Docker Registry (Harbor, AWS ECR, GCP Artifact Registry), hãy quét CVE bằng Trivy:

~~~bash
# Chạy Trivy quét lỗ hổng mức HIGH và CRITICAL
trivy image --severity HIGH,CRITICAL enterprise/payment-service:latest
~~~

Nếu bạn dùng image chuẩn non-root và Temurin Jammy, kết quả quét sẽ là 0 critical vulnerabilities.

### 3.3. Xác minh Quyền Hạn Thực Tế Trong Container Đang Chạy

~~~bash
# Kiểm tra user ID bên trong container
docker exec -it payment-service-prod id
~~~

Kết quả xác minh:
~~~text
uid=1001(appuser) gid=1001(appgroup) groups=1001(appgroup)
~~~
Nếu kết quả trả về <code>uid=0(root)</code>, container của bạn đã trượt tiêu chuẩn an ninh DevSecOps!

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Container bị OOMKilled bí ẩn không để lại bất kỳ Log nào

- **Bối cảnh**: Hệ thống nhận tải đột biến lúc 12h trưa. Pod Spring Boot đột ngột biến mất, Kubernetes restart pod mới. Lập trình viên kiểm tra log Kibana/Loki nhưng dòng log cuối cùng dừng lại ở trạng thái bình thường, không có bất kỳ <code>OutOfMemoryError</code> stack trace nào!
- **Nguyên nhân cốt lõi**: <code>limits.memory</code> trong file cấu hình Kubernetes là <code>1024Mi</code>, nhưng JVM chạy không có cờ <code>-XX:MaxRAMPercentage</code>. JVM tự nhận diện bộ nhớ vật lý của máy chủ Node (ví dụ 64GB) và mở rộng Heap lên tới 16GB. Khi tiến trình chạm tới 1025MB, Linux cgroups lập tức gửi <code>SIGKILL (kill -9)</code>. Do <code>SIGKILL</code> không thể bị bắt bởi JVM, ứng dụng bị xóa sổ ngay tức khắc.
- **Giải pháp**:
  1. Bắt buộc thêm <code>-XX:MaxRAMPercentage=75.0</code>.
  2. Bật <code>-XX:+ExitOnOutOfMemoryError</code> và <code>-XX:+HeapDumpOnOutOfMemoryError</code>.
  3. Cấp mount volume cho thư mục chứa dump file.

### 4.2. Sự cố 2: Sử dụng cú pháp Exec Form sai trong ENTRYPOINT gây ra hiện tượng "Zombie Process"

- **Bối cảnh**: Lập trình viên viết:
  ~~~dockerfile
  ENTRYPOINT java -jar app.jar
  ~~~
- **Cơ chế sự cố**: Khi viết dạng chuỗi (Shell form), Docker sẽ tự động bọc lệnh lại thành <code>/bin/sh -c "java -jar app.jar"</code>. Lúc này, PID 1 bên trong container là tiến trình <code>/bin/sh</code>, còn tiến trình Java chỉ là tiến trình con.
- **Hậu quả nghiêm trọng**: Khi bạn gõ <code>docker stop</code> hoặc Kubernetes gửi lệnh terminate pod (<code>SIGTERM</code>), <code>/bin/sh</code> nhận được tín hiệu nhưng **KHÔNG forward tín hiệu đó xuống tiến trình con Java**. Java không thể kích hoạt cơ chế Graceful Shutdown (đóng DB connection, hoàn tất giao dịch đang dở). Sau 30 giây timeout, Kubernetes gửi <code>SIGKILL</code> chém chết tiến trình, làm hỏng giao dịch của khách hàng!
- **Giải pháp**: Luôn dùng **Exec Form với lệnh <code>exec</code>**:
  ~~~dockerfile
  ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
  ~~~
  Lệnh <code>exec</code> sẽ thay thế hoàn toàn tiến trình <code>/bin/sh</code> bằng tiến trình Java, giúp Java trực tiếp nhận tín hiệu <code>SIGTERM</code> và kích hoạt Graceful Shutdown mượt mà!

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây dựng Bộ Dockerfile Distroless & Kiểm thử Tự Động Kích Thước Layer

Hãy tối ưu hóa ứng dụng Spring Boot 3.3 sang **Google Container Tools Distroless**:
1. Stage 1 (Build): Dùng <code>maven:3.9-eclipse-temurin-21</code> để compile và extract layers.
2. Stage 2 (Runtime): Sử dụng base image <code>gcr.io/distroless/java21-debian12:nonroot</code>.
3. Image không được chứa shell (<code>/bin/sh</code> hoặc <code>/bin/bash</code>), chạy trực tiếp dưới user <code>nonroot</code> mặc định của Distroless.
4. Tách biệt hoàn toàn 4 layer của Spring Boot.
5. Cấu hình JVM Flags tối ưu cho môi trường bộ nhớ thấp (512MB RAM).

### Lời giải hoàn chỉnh (Reference Solution)

~~~dockerfile
# =========================================================================
# STAGE 1: Extract Layers bằng Maven & Temurin
# =========================================================================
FROM maven:3.9.6-eclipse-temurin-21-jammy AS extractor
WORKDIR /build

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests &&     java -Djarmode=layertools -jar target/*.jar extract --destination extracted

# =========================================================================
# STAGE 2: Ultra-Secure Distroless Image (Zero Shell, Zero Package Manager)
# =========================================================================
FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app

# Distroless đã có sẵn user nonroot (UID: 65532)
USER 65532:65532

# Copy các layer trích xuất từ stage 1
COPY --from=extractor --chown=65532:65532 /build/extracted/dependencies/ ./
COPY --from=extractor --chown=65532:65532 /build/extracted/spring-boot-loader/ ./
COPY --from=extractor --chown=65532:65532 /build/extracted/snapshot-dependencies/ ./
COPY --from=extractor --chown=65532:65532 /build/extracted/application/ ./

EXPOSE 8080

# Chạy trực tiếp qua JarLauncher mà không cần shell wrapper
ENTRYPOINT ["java",             "-XX:MaxRAMPercentage=75.0",             "-XX:InitialRAMPercentage=50.0",             "-XX:+UseSerialGC",             "-Djava.security.egd=file:/dev/./urandom",             "org.springframework.boot.loader.launch.JarLauncher"]
~~~
`
    },
    {
      id: "7-2",
      type: "lesson",
      title: "CI/CD với Jenkins & Observability",
      minutes: 50,
      content: `## Pipeline tự động & Khả năng quan sát toàn diện (Observability)

Trong một hệ thống phân tán gồm hàng chục microservices, hai câu hỏi làm mất ngủ mọi Tech Lead và SRE vào ban đêm là:
1. *"Bản code vừa merge vào nhánh main có thực sự vượt qua mọi bài kiểm thử an ninh, quét mã tĩnh SonarQube và lỗ hổng container trước khi lên Production không?"*
2. *"Tại sao một request thanh toán của khách hàng VIP mất tới 14 giây và cuối cùng báo lỗi 504 Gateway Timeout? Lỗi nằm ở Gateway, Auth, Order, Payment hay Core Banking?"*

Nếu không có **CI/CD Pipeline chuẩn chỉ**, bạn sẽ phải deploy bằng tay (SSH vào máy chủ kéo git, gõ <code>mvn package</code>), dễ dàng bỏ sót lỗi và không thể rollback tức thì.
Nếu không có **Observability (Giám sát 3 trụ cột: Metrics, Logs, Traces)**, bạn sẽ phải mở 10 terminal để gõ lệnh <code>tail -f logs/app.log</code>, mò mẫm trong hàng triệu dòng text vô nghĩa giữa đêm khuya.

Bài học này sẽ hướng dẫn bạn thiết lập:
- Pipeline CI/CD Jenkins Declarative tự động hóa 100% từ kiểm thử, quét mã tĩnh, quét CVE container đến triển khai an toàn.
- Hệ thống OpenTelemetry & Micrometer Tracing đồng bộ W3C TraceContext xuyên suốt các tiến trình.
- Structured JSON Logging với MDC (Mapped Diagnostic Context) và Prometheus Business Metrics.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### Sơ Đồ Mô Phỏng: Lan Truyền Distributed Tracing với W3C TraceContext Header

~~~mermaid
sequenceDiagram
    autonumber
    actor User as User Request
    participant GW as API Gateway (traceId: 4bf9, spanId: a1)
    participant Order as Order Service (traceId: 4bf9, spanId: b2)
    participant Kafka as Kafka Broker (traceparent in Headers)
    participant Payment as Payment Service (traceId: 4bf9, spanId: c3)
    participant Tempo as Grafana Tempo (Collector)
    
    User->>GW: POST /api/v1/orders
    GW->>Order: HTTP POST /orders (Header: traceparent: 00-4bf9-a1-01)
    Order->>Kafka: Produce OrderPlacedEvent (Header: traceparent: 00-4bf9-b2-01)
    Kafka->>Payment: Consume Event (Extracts traceId: 4bf9)
    
    GW-->>Tempo: Push Span a1 (Latency: 15ms)
    Order-->>Tempo: Push Span b2 (Latency: 45ms)
    Payment-->>Tempo: Push Span c3 (Latency: 80ms)
    Note over Tempo: Tổng hợp thành 1 Trace Tree duy nhất trên Grafana Dashboard!
~~~


### 1.1. Kiến trúc Luồng CI/CD DevSecOps Hiện Đại

~~~text
[ Developer Commit ] ---> [ GitHub / GitLab ]
                                │ Webhook Trigger
                                ▼
+─────────────────────────── [ Jenkins CI Server ] ───────────────────────────+
│                                                                             │
│  [ Stage 1: Checkout & Validate ]                                           │
│       │                                                                     │
│  [ Stage 2: Parallel Verification ]                                         │
│       ├── Unit & Integration Tests (Testcontainers + JUnit 5)               │
│       └── Architecture Guardrails (ArchUnit + Spring Modulith)              │
│       │                                                                     │
│  [ Stage 3: Static Analysis & Quality Gate ]                                │
│       └── SonarQube Scanner (Code Coverage >= 80%, 0 Blocker Bugs)          │
│       │                                                                     │
│  [ Stage 4: Docker Multi-Stage Build & Trivy Scan ]                         │
│       └── Trivy Security Vulnerability Scan (Fail if CRITICAL CVE > 0)      │
│       │                                                                     │
│  [ Stage 5: Push Artifact to Harbor / ECR Registry ]                        │
│       │                                                                     │
│  [ Stage 6: GitOps Trigger (ArgoCD) & Deploy Staging / Production ]         │
+─────────────────────────────────────────────────────────────────────────────+
~~~

### 1.2. Ba Trụ Cột Của Observability: Metrics, Logs, Traces

~~~text
+-----------------------------------------------------------------------------+
|                           Observability Triad                               |
|                                                                             |
|      METRICS (Prometheus)            LOGS (Loki / ELK)                      |
|      "Có điều gì bất thường          "Chuyện gì ĐÃ xảy ra                   |
|       đang diễn ra không?"            tại thời điểm lỗi?"                   |
|      (CPU, Latency P99, Throughput)  (Error StackTrace, Business Audit)     |
|                                               /                            |
|                                              /                             |
|                 v                            v                              |
|                       DISTRIBUTED TRACES (Tempo / Zipkin)                    |
|                       "Yêu cầu này đi qua những đâu,                         |
|                        nút cổ chai chính xác ở đâu?"                        |
+-----------------------------------------------------------------------------+
~~~

### 1.3. Cơ Chế Lan Truyền Ngữ Cảnh Phân Tán (W3C TraceContext Propagation)

Chuẩn công nghiệp **W3C TraceContext** định nghĩa header HTTP <code>traceparent</code>:

~~~text
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             │  │                                │                │
             │  └─ Trace ID (16 bytes / 32 hex) ─┴─ Span ID ──────┴─ Flags (01 = Sampled)
             └─ Version (00)
~~~

Khi User gửi một request tới API Gateway:
1. Gateway khởi tạo một <code>Trace ID</code> duy nhất đại diện cho toàn bộ hành trình của request.
2. Gateway tạo <code>Span ID</code> đầu tiên (đại diện cho bước xử lý tại Gateway).
3. Khi Gateway gọi tiếp sang <code>OrderService</code> qua HTTP REST hoặc gRPC, nó tiêm (inject) header <code>traceparent</code> vào request outbound.
4. <code>OrderService</code> trích xuất (extract) <code>Trace ID</code> đó, tạo một <code>Child Span ID</code> mới, và đẩy vào <code>MDC</code> của Logback.
5. Khi <code>OrderService</code> bắn event sang Kafka, nó tiêm <code>traceparent</code> vào Kafka Record Headers. Consumer bên <code>PaymentService</code> đọc Kafka Record Headers và tiếp tục duy trì cùng một <code>Trace ID</code>.
6. Toàn bộ chuỗi hành trình được tổng hợp về **Grafana Tempo** hoặc **Zipkin**. Bạn chỉ cần bấm vào <code>Trace ID</code> là thấy sơ đồ Gantt chart hiển thị chính xác từng miligiây của mọi service liên quan!

---

## 2. Production-Grade Implementation Code

### 2.1. File Pipeline Jenkins Declarative Hoàn Chỉnh (<code>Jenkinsfile</code>)

File <code>Jenkinsfile</code> chuẩn Enterprise với SonarQube Quality Gate, quét lỗ hổng Trivy, và thông báo Telegram:

~~~groovy
pipeline {
    agent {
        docker {
            image 'maven:3.9.6-eclipse-temurin-21-jammy'
            args '-v /root/.m2:/root/.m2 -v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        REGISTRY = 'harbor.enterprise.com/fintech'
        APP_NAME = 'payment-service'
        IMAGE_TAG = "\${env.BUILD_NUMBER}-\${env.GIT_COMMIT.take(7)}"
        SONAR_PROJECT_KEY = "enterprise-payment-service"
        TELEGRAM_BOT_TOKEN = credentials('telegram-bot-token')
        TELEGRAM_CHAT_ID = '-100123456789'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout Source') {
            steps {
                checkout scm
            }
        }

        stage('Compile & Test Verification') {
            parallel {
                stage('Unit & Modulith Tests') {
                    steps {
                        sh 'mvn clean test -B -Dtest="!*IntegrationTest"'
                    }
                    post {
                        always {
                            junit '**/target/surefire-reports/*.xml'
                        }
                    }
                }
                stage('Integration Tests') {
                    steps {
                        // Chạy test tích hợp với Testcontainers
                        sh 'mvn test -B -Dtest="*IntegrationTest"'
                    }
                }
            }
        }

        stage('SonarQube Static Analysis') {
            steps {
                withSonarQubeEnv('Enterprise-SonarQube') {
                    sh """
                        mvn sonar:sonar -B                           -Dsonar.projectKey=\${SONAR_PROJECT_KEY}                           -Dsonar.coverage.jacoco.xmlReportPaths=target/site/jacoco/jacoco.xml
                    """
                }
                // Bắt buộc vượt qua Quality Gate (Coverage >= 80%, không có bug Blocker)
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker Build & Trivy Security Scan') {
            steps {
                sh """
                    docker build -t \${REGISTRY}/\${APP_NAME}:\${IMAGE_TAG} .
                    
                    # Quét lỗ hổng bảo mật: Gãy build ngay lập tức nếu phát hiện CRITICAL CVE
                    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock                       aquasec/trivy:0.49.1 image                       --exit-code 1                       --severity CRITICAL                       --no-progress                       \${REGISTRY}/\${APP_NAME}:\${IMAGE_TAG}
                """
            }
        }

        stage('Push Image to Registry') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'harbor-robot-creds', usernameVariable: 'HARBOR_USER', passwordVariable: 'HARBOR_PASS')]) {
                    sh """
                        echo "\${HARBOR_PASS}" | docker login \${REGISTRY} -u "\${HARBOR_USER}" --password-stdin
                        docker push \${REGISTRY}/\${APP_NAME}:\${IMAGE_TAG}
                        docker tag \${REGISTRY}/\${APP_NAME}:\${IMAGE_TAG} \${REGISTRY}/\${APP_NAME}:latest
                        docker push \${REGISTRY}/\${APP_NAME}:latest
                    """
                }
            }
        }

        stage('Trigger GitOps Deployment') {
            when {
                branch 'main'
            }
            steps {
                sh """
                    # Cập nhật image tag trong repo cấu hình ArgoCD Kustomize
                    git clone https://github.com/enterprise/k8s-gitops-manifests.git
                    cd k8s-gitops-manifests/overlays/prod
                    kustomize edit set image \${REGISTRY}/\${APP_NAME}=\${REGISTRY}/\${APP_NAME}:\${IMAGE_TAG}
                    git commit -am "chore(release): bump \${APP_NAME} to \${IMAGE_TAG} [skip ci]"
                    git push origin main
                """
            }
        }
    }

    post {
        success {
            sh """
                curl -s -X POST "https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage"                   -d "chat_id=\${TELEGRAM_CHAT_ID}"                   -d "text=✅ [CI/CD SUCCESS] \${APP_NAME} build #\${BUILD_NUMBER} deployed successfully! Tag: \${IMAGE_TAG}"
            """
        }
        failure {
            sh """
                curl -s -X POST "https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendMessage"                   -d "chat_id=\${TELEGRAM_CHAT_ID}"                   -d "text=🚨 [CI/CD FAILED] \${APP_NAME} build #\${BUILD_NUMBER} failed! Check console: \${BUILD_URL}"
            """
        }
    }
}
~~~

### 2.2. Cấu hình OpenTelemetry, Micrometer Tracing & Export sang OTLP

File <code>pom.xml</code>:
~~~xml
<dependencies>
    <!-- 1. Actuator Core & Micrometer Prometheus -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>

    <!-- 2. Micrometer Tracing Bridge to OpenTelemetry -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-tracing-bridge-otel</artifactId>
    </dependency>
    <dependency>
        <groupId>io.opentelemetry</groupId>
        <artifactId>opentelemetry-exporter-otlp</artifactId>
    </dependency>

    <!-- 3. Logback JSON Encoder for Centralized Logging -->
    <dependency>
        <groupId>net.logstash.logback</groupId>
        <artifactId>logstash-logback-encoder</artifactId>
        <version>7.4</version>
    </dependency>
</dependencies>
~~~

Cấu hình <code>application.yml</code>:
~~~yaml
server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus,metrics
  tracing:
    sampling:
      probability: 1.0 # 100% trong dev/staging, cấu hình 0.1 (10%) trong production cao tải
    propagation:
      type: W3C # Chuẩn W3C traceparent & tracestate
    baggage:
      remote-fields:
        - "x-tenant-id"
        - "x-user-id"
      correlation:
        fields:
          - "x-tenant-id"
          - "x-user-id"

  otlp:
    tracing:
      endpoint: "http://tempo-distributor.monitoring:4318/v1/traces"

logging:
  pattern:
    level: "%5p [\${spring.application.name:},%X{traceId:-},%X{spanId:-}]"
~~~

### 2.3. Cấu hình Structured JSON Logging (<code>logback-spring.xml</code>)

File <code>src/main/resources/logback-spring.xml</code>:
~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <include resource="org/springframework/boot/logging/logback/defaults.xml"/>

    <springProfile name="!prod">
        <!-- Chế độ Local: In log màu ra console dễ đọc -->
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %highlight(%-5level) [%blue(%t)] [%cyan(%X{traceId:-},%X{spanId:-})] %yellow(%logger{36}): %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
    </springProfile>

    <springProfile name="prod">
        <!-- Chế độ Production: Xuất trực tiếp Structured JSON vào stdout để Vector/Fluentbit đẩy vào Loki -->
        <appender name="JSON_CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <includeMdcKeyName>traceId</includeMdcKeyName>
                <includeMdcKeyName>spanId</includeMdcKeyName>
                <includeMdcKeyName>x-tenant-id</includeMdcKeyName>
                <includeMdcKeyName>x-user-id</includeMdcKeyName>
                <customFields>{"service":"payment-service","environment":"production"}</customFields>
                <fieldNames>
                    <timestamp>timestamp</timestamp>
                    <message>message</message>
                    <logger>logger</logger>
                    <thread>thread</thread>
                    <level>level</level>
                    <stackTrace>stackTrace</stackTrace>
                </fieldNames>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="JSON_CONSOLE"/>
        </root>
    </springProfile>
</configuration>
~~~

### 2.4. Metric Nghiệp Vụ Tùy Biến (Custom Micrometer Business Metrics)

~~~java
package com.enterprise.course.observability.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.concurrent.TimeUnit;

@Component
public class PaymentBusinessMetrics {

    private final MeterRegistry meterRegistry;
    private final Counter paymentSuccessCounter;
    private final Counter paymentFailureCounter;
    private final Timer paymentProcessingTimer;

    public PaymentBusinessMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        // Counter đếm số giao dịch thành công theo tenant
        this.paymentSuccessCounter = Counter.builder("fintech_payment_transactions_total")
                .description("Total number of processed payment transactions")
                .tag("status", "SUCCESS")
                .register(meterRegistry);

        this.paymentFailureCounter = Counter.builder("fintech_payment_transactions_total")
                .description("Total number of processed payment transactions")
                .tag("status", "FAILED")
                .register(meterRegistry);

        // Timer đo độ trễ thực thi giao dịch (P50, P90, P99)
        this.paymentProcessingTimer = Timer.builder("fintech_payment_duration_seconds")
                .description("Latency distribution of payment processing")
                .publishPercentiles(0.5, 0.9, 0.99)
                .register(meterRegistry);
    }

    public void recordSuccess(String merchantId, BigDecimal amount, long durationMs) {
        paymentSuccessCounter.increment();
        paymentProcessingTimer.record(durationMs, TimeUnit.MILLISECONDS);
        
        // Counter động đếm tổng tiền (Summary)
        meterRegistry.counter("fintech_payment_amount_total_usd", "merchant", merchantId)
                .increment(amount.doubleValue());
    }

    public void recordFailure(String merchantId, String errorCode) {
        meterRegistry.counter("fintech_payment_failures_total", "merchant", merchantId, "error_code", errorCode)
                .increment();
    }
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Kiểm tra W3C Trace Propagation Bằng cURL

Gửi một request đính kèm sẵn <code>traceparent</code>:

~~~bash
curl -i -X POST http://localhost:8080/api/v1/payments/charge   -H "Content-Type: application/json"   -H "traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"   -H "x-tenant-id: tenant-alpha"   -d '{"amount": 150.00, "currency": "USD"}'
~~~

Quan sát stdout log của Spring Boot:
~~~json
{
  "timestamp": "2026-10-03T14:22:01.124Z",
  "level": "INFO",
  "thread": "http-nio-8080-exec-1",
  "logger": "com.enterprise.course.payment.PaymentService",
  "message": "Processing charge request for amount 150.00",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
  "spanId": "a28f731c9e88d011",
  "x-tenant-id": "tenant-alpha",
  "service": "payment-service",
  "environment": "production"
}
~~~

<code>traceId</code> được giữ nguyên vẹn 100% khớp với header <code>traceparent</code> gửi vào, trong khi <code>spanId</code> được sinh mới cho bước xử lý nội bộ của service này!

### 3.2. Cào Dữ Liệu Metrics Prometheus Qua Actuator

~~~bash
# Cào metrics định dạng Prometheus
curl -s http://localhost:8080/actuator/prometheus | grep fintech_payment
~~~

Output trả về:
~~~text
# HELP fintech_payment_transactions_total Total number of processed payment transactions
# TYPE fintech_payment_transactions_total counter
fintech_payment_transactions_total{status="SUCCESS"} 142.0
fintech_payment_transactions_total{status="FAILED"} 3.0

# HELP fintech_payment_duration_seconds Latency distribution of payment processing
# TYPE fintech_payment_duration_seconds summary
fintech_payment_duration_seconds{quantile="0.5"} 0.045
fintech_payment_duration_seconds{quantile="0.9"} 0.120
fintech_payment_duration_seconds{quantile="0.99"} 0.380
fintech_payment_duration_seconds_count 145.0
fintech_payment_duration_seconds_sum 8.42
~~~

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Đứt gãy Trace ID khi dùng <code>@Async</code> hoặc Virtual Threads

- **Bối cảnh**: Lập trình viên gọi một phương thức <code>@Async</code> để gửi thông báo email hoặc lưu audit log. Khi kiểm tra trên Grafana Tempo, hành động gửi email không xuất hiện trong cây Trace của request gốc mà biến thành một Trace hoàn toàn mới độc lập!
- **Nguyên nhân**: Micrometer Tracing lưu giữ <code>TraceContext</code> trong <code>ThreadLocal</code>. Khi chuyển sang luồng mới trong <code>@Async</code> thread pool hoặc Java 21 Virtual Thread, <code>ThreadLocal</code> bị rỗng nếu không được sao chép chủ động (Context Propagation).
- **Giải pháp**:
  Bật cờ tự động truyền ngữ cảnh của Spring Boot:
  ~~~yaml
  spring:
    threads:
      virtual:
        enabled: true
  ~~~
  Và cấu hình <code>ContextExecutorService</code> hoặc <code>TaskDecorator</code>:
  ~~~java
  @Bean
  public TaskDecorator mdcAndTracingTaskDecorator() {
      return ContextSnapshot::captureAll;
  }
  ~~~

### 4.2. Sự cố 2: Thảm họa "High Cardinality" làm sập cụm Prometheus

- **Bối cảnh**: Một dev muốn đo số lần click của từng người dùng và viết code:
  ~~~java
  // THẢM HỌA: High Cardinality Tag
  meterRegistry.counter("user_clicks_total", "user_id", user.getId(), "order_id", order.getId()).increment();
  ~~~
- **Hậu quả kinh hoàng**: Hệ thống có 500,000 users và 2 triệu orders. Prometheus phải tạo ra $500,000 	imes 2,000,000 = 1,000,000,000,000$ Time Series riêng biệt trong RAM! RAM của Prometheus server tăng vọt lên 128GB, server bị OOM crash liên tục và mất toàn bộ dữ liệu metrics của cả công ty.
- **Quy tắc vàng của Metrics**:
  - **Metrics**: Chỉ được chứa các tags có số lượng giá trị hữu hạn và nhỏ (< 50 giá trị): <code>status</code> (SUCCESS, FAILED), <code>http_method</code> (GET, POST), <code>region</code> (ap-southeast-1, us-east-1).
  - **Dữ liệu định danh duy nhất (UUID, User ID, Order ID)**: BẮT BUỘC để trong **Logs (Loki)** hoặc **Tracing (Span Attributes / Baggage)**, TUYỆT ĐỐI KHÔNG BAO GIỜ đưa vào Prometheus Tags!

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây dựng Bộ Lọc Tự Động Lan Truyền W3C Tracing & Tenant Context Qua HTTP Client

Hệ thống gồm 2 microservices: <code>Gateway</code> gọi <code>PaymentService</code> qua <code>RestClient</code>.
Hãy xây dựng:
1. <code>TraceContextFilter</code>: Một Servlet Filter chặn các request đến, kiểm tra header <code>traceparent</code>. Nếu có thì nạp vào context, nếu chưa có thì tự động sinh mới một Trace ID chuẩn W3C.
2. <code>RestClientTraceInterceptor</code>: Một ClientHttpRequestInterceptor tự động tiêm <code>traceparent</code> và <code>X-Tenant-ID</code> từ MDC vào mọi HTTP request outbound khi gọi service khác.

### Lời giải hoàn chỉnh (Reference Solution)

Bộ lọc Servlet Filter chặn Inbound Request:
~~~java
package com.enterprise.course.observability.filter;

import io.micrometer.tracing.Tracer;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceAndTenantInboundFilter extends OncePerRequestFilter {

    private final Tracer tracer;

    public TraceAndTenantInboundFilter(Tracer tracer) {
        this.tracer = tracer;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. Trích xuất Tenant ID từ Header hoặc gán mặc định
            String tenantId = request.getHeader("X-Tenant-ID");
            if (tenantId != null && !tenantId.isBlank()) {
                MDC.put("x-tenant-id", tenantId);
            }

            // 2. Trích xuất hoặc đồng bộ Trace ID
            if (tracer.currentSpan() != null) {
                String traceId = tracer.currentSpan().context().traceId();
                String spanId = tracer.currentSpan().context().spanId();
                MDC.put("traceId", traceId);
                MDC.put("spanId", spanId);
                // Trả ngược Trace ID về Header phản hồi cho Client để tiện tra cứu khi có sự cố
                response.setHeader("X-Trace-ID", traceId);
            }

            filterChain.doFilter(request, response);
        } finally {
            // Xóa sạch MDC để tránh rò rỉ context giữa các request tái sử dụng thread trong Tomcat pool
            MDC.remove("x-tenant-id");
            MDC.remove("traceId");
            MDC.remove("spanId");
        }
    }
}
~~~

Interceptor tiêm Context vào Outbound HTTP Client (<code>RestClient</code> / <code>RestTemplate</code>):
~~~java
package com.enterprise.course.observability.client;

import io.micrometer.tracing.Tracer;
import org.slf4j.MDC;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class OutboundTracingAndTenantInterceptor implements ClientHttpRequestInterceptor {

    private final Tracer tracer;

    public OutboundTracingAndTenantInterceptor(Tracer tracer) {
        this.tracer = tracer;
    }

    @Override
    public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution)
            throws IOException {
        
        // 1. Tiêm W3C traceparent header nếu có span đang hoạt động
        if (tracer.currentSpan() != null) {
            String traceId = tracer.currentSpan().context().traceId();
            String spanId = tracer.currentSpan().context().spanId();
            String traceParent = String.format("00-%s-%s-01", traceId, spanId);
            request.getHeaders().set("traceparent", traceParent);
        }

        // 2. Lan truyền Tenant ID qua Service tiếp theo
        String currentTenant = MDC.get("x-tenant-id");
        if (currentTenant != null && !currentTenant.isBlank()) {
            request.getHeaders().set("X-Tenant-ID", currentTenant);
        }

        return execution.execute(request, body);
    }
}
~~~
`
    },
    {
      id: "7-3",
      type: "lesson",
      title: "Actuator & Health Groups — health endpoint production-grade",
      minutes: 50,
      content: `## /health trả về HTTP 200 nhưng hệ thống thực ra đã chết lâm sàng

Trong hầu hết các hướng dẫn Spring Boot cơ bản, bạn được dạy cấu hình:
~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: "*" # THẢM HỌA AN NINH VÀ VẬN HÀNH
~~~

Và trên Kubernetes, kỹ sư cấu hình chung một endpoint cho cả Liveness và Readiness:
~~~yaml
# SAI LẦM KINH ĐIỂN DẪN ĐẾN SẬP HỆ THỐNG DÂY CHUYỀN
livenessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
readinessProbe:
  httpGet:
    path: /actuator/health
    port: 8080
~~~

Kịch bản ác mộng diễn ra như thế nào trong thực tế?
1. **Sự cố Cascading Restart Storm (Bão restart dây chuyền)**: Database PostgreSQL bị quá tải tạm thời khiến query phản hồi chậm 2 giây. Endpoint <code>/actuator/health</code> kiểm tra kết nối DB và trả về <code>HTTP 503 DOWN</code>. 
   Vì <code>livenessProbe</code> cũng trỏ vào đây, Kubernetes cho rằng **tiến trình Java đã chết** và lập tức gửi <code>SIGKILL</code> để restart đồng loạt toàn bộ 50 Pods!
   50 Pods mới khởi động lại cùng một giây, đồng loạt gửi hàng ngàn truy vấn thiết lập kết nối và nạp cache đập thẳng vào DB đang ngắc ngoải. Database chết hẳn, toàn bộ hệ thống tê liệt hàng giờ liền!
2. **Lộ thông tin mật qua Actuator công khai**: Để lộ <code>/actuator/env</code> cho phép hacker tải toàn bộ biến môi trường (Database passwords, AWS Secrets, JWT private keys).

Bài học này sẽ hướng dẫn bạn thiết lập **Spring Boot 3.3+ Actuator & Health Groups chuẩn Production**: Phân tách rạch ròi giữa Liveness và Readiness, xây dựng Custom Health Indicators với cơ chế chống nghẽn luồng, và cô lập hoàn toàn Management Port.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### 1.1. Tam Giác Probes Trong Kubernetes: Startup, Liveness & Readiness

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| KUBERNETES POD LIFECYCLE                                                    |
|                                                                             |
|  [ Pod Created ]                                                            |
|        │                                                                    |
|        ▼                                                                    |
|  1. STARTUP PROBE (/actuator/health/liveness)                               |
|     - Cho phép ứng dụng nạp Spring Context, warm-up JVM (30 - 60s)          |
|     - Trong giai đoạn này: Liveness và Readiness bị VÔ HIỆU HÓA             |
|        │ (Pass Startup)                                                     |
|        ├────────────────────────────────────┐                               |
|        ▼                                    ▼                               |
|  2. LIVENESS PROBE                 3. READINESS PROBE                       |
|     - Endpoint: /health/liveness        - Endpoint: /health/readiness       |
|     - Câu hỏi: "Java process có bị      - Câu hỏi: "Pod có đủ khả năng      |
|       Deadlock / Treo không?"             xử lý request của khách không?"   |
|     - Kiểm tra: Internal state          - Kiểm tra: DB pool, Kafka lag,     |
|       (KHÔNG CHECK DB/KAFKA!)             Redis connection, Outbox queue    |
|        │                                    │                               |
|        ▼ (Nếu FAIL)                         ▼ (Nếu FAIL)                    |
|     [ ACTION: KILL & RESTART POD ]       [ ACTION: GỠ POD KHỎI SERVICE ]    |
|                                            (Không restart pod! Chờ hồi phục)|
+─────────────────────────────────────────────────────────────────────────────+
~~~

### 1.2. Quy Tắc Vàng Bất Di Bất Dịch: Liveness KHÔNG BAO GIỜ Check External Dependencies

- **Liveness Probe**:
  - Chỉ được kiểm tra trạng thái nội tại của JVM (Deadlock luồng, OOM rò rỉ bộ nhớ).
  - Nếu Database, Redis hoặc Kafka chết: **Liveness VẪN PHẢI TRẢ VỀ UP**! 
  - Tại sao? Bởi vì nếu Database chết thì việc bạn restart ứng dụng Java 1,000 lần cũng không làm Database sống lại, mà chỉ làm cháy mạng và nghẽn CPU của cụm máy chủ!
- **Readiness Probe**:
  - Kiểm tra xem các dependency quan trọng (Database, Message Broker) có sẵn sàng để phục vụ request không.
  - Nếu Database chết: **Readiness trả về 503 DOWN**. Kubernetes sẽ lập tức gỡ IP của Pod này ra khỏi danh sách Ingress/Service Endpoints. Khách hàng sẽ không bị gửi request vào Pod đang lỗi. Khi Database hồi phục, Readiness tự động trả về 200 UP và Pod nhận lại traffic mà không cần restart!

### 1.3. Cơ Chế Health Indicator & Status Aggregator Của Spring Boot

Spring Boot quản lý trạng thái qua cây phân cấp:
- Mỗi thành phần là một <code>HealthIndicator</code> trả về một <code>Health</code> object chứa <code>Status</code> (<code>UP</code>, <code>DOWN</code>, <code>OUT_OF_SERVICE</code>, <code>UNKNOWN</code>).
- <code>StatusAggregator</code> tổng hợp các trạng thái con theo thứ tự ưu tiên:
  $$	ext{DOWN} > 	ext{OUT_OF_SERVICE} > 	ext{UP} > 	ext{UNKNOWN}$$
  Chỉ cần 1 thành phần trong Health Group bị <code>DOWN</code>, toàn bộ endpoint của Group đó sẽ trả về mã HTTP 503!

---

## 2. Production-Grade Implementation Code

### 2.1. File Cấu Hình <code>application.yml</code> Chuẩn Production Cho Actuator

Tách riêng Management Port 8081, cấu hình Health Groups và bảo vệ dữ liệu nhạy cảm:

~~~yaml
server:
  port: 8080 # Cổng phục vụ nghiệp vụ của khách hàng

management:
  server:
    port: 8081 # Cô lập hoàn toàn Actuator sang cổng nội bộ!
    address: 127.0.0.1 # Hoặc chỉ bind IP private trong Kubernetes Pod
  
  endpoints:
    web:
      base-path: /actuator
      exposure:
        # Chỉ mở các endpoint phục vụ giám sát và metric, TUYỆT ĐỐI KHÔNG mở env, beans, heapdump
        include: health,info,prometheus,metrics
  
  endpoint:
    health:
      show-details: when_authorized # Chỉ hiển thị chi tiết khi có quyền hoặc tắt trong prod
      roles: ACTUATOR_ADMIN
      probes:
        enabled: true # Bật tự động livenessState và readinessState
      group:
        # 1. Liveness Group: Tuyệt đối chỉ kiểm tra livenessState nội bộ
        liveness:
          include: livenessState
        
        # 2. Readiness Group: Kiểm tra trạng thái sẵn sàng + các dependency sống còn
        readiness:
          include: readinessState, db, redis, hikariConnectionPool, kafkaLag
        
        # 3. Custom Internal Group: Phục vụ DevOps debug chuyên sâu
        internal:
          include: "*"
          show-details: always
~~~

### 2.2. Custom Health Indicator: Giám Sát Độ Bão Hòa HikariCP Connection Pool

Nếu HikariCP Connection Pool bị cạn kiệt (Active connections chạm trần 100%), các request mới sẽ bị block và timeout. Indicator này sẽ đánh dấu ứng dụng không sẵn sàng nhận thêm request:

~~~java
package com.enterprise.course.actuator.health;

import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@Component("hikariConnectionPool")
public class HikariPoolHealthIndicator implements HealthIndicator {

    private final DataSource dataSource;

    public HikariPoolHealthIndicator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        if (!(dataSource instanceof HikariDataSource hikariDataSource)) {
            return Health.unknown().withDetail("message", "DataSource is not HikariCP").build();
        }

        HikariPoolMXBean poolMxBean = hikariDataSource.getHikariPoolMXBean();
        if (poolMxBean == null) {
            return Health.down().withDetail("error", "HikariPoolMXBean not initialized").build();
        }

        int totalConnections = poolMxBean.getTotalConnections();
        int activeConnections = poolMxBean.getActiveConnections();
        int idleConnections = poolMxBean.getIdleConnections();
        int threadsAwaiting = poolMxBean.getThreadsAwaitingConnection();
        int maxPoolSize = hikariDataSource.getMaximumPoolSize();

        // Tính tỷ lệ bão hòa của connection pool
        double saturationRatio = (double) activeConnections / maxPoolSize;

        Health.Builder builder = (saturationRatio >= 0.95 || threadsAwaiting > 20)
                ? Health.down() // Quá tải nghiêm trọng: Gỡ Pod khỏi load balancer
                : Health.up();

        return builder
                .withDetail("activeConnections", activeConnections)
                .withDetail("idleConnections", idleConnections)
                .withDetail("totalConnections", totalConnections)
                .withDetail("maxPoolSize", maxPoolSize)
                .withDetail("threadsAwaitingConnection", threadsAwaiting)
                .withDetail("saturationPercentage", String.format("%.2f%%", saturationRatio * 100))
                .build();
    }
}
~~~

### 2.3. Custom Health Indicator: Giám Sát Kafka Consumer Lag với Cơ Chế Timeout An Toàn

Một chỉ số sức khỏe bắt buộc phải có timeout nội bộ: Nếu Kafka broker bị lag mà Health Indicator bị block quá 500ms, nó sẽ làm treo luôn request của Kubernetes probe!

~~~java
package com.enterprise.course.actuator.health;

import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.ListConsumerGroupOffsetsResult;
import org.apache.kafka.common.TopicPartition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.stereotype.Component;

import java.util.concurrent.*;

@Component("kafkaLag")
public class KafkaLagHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(KafkaLagHealthIndicator.class);
    private static final long MAX_ALLOWED_LAG = 10_000L;
    private static final long TIMEOUT_MS = 500L;

    private final KafkaAdmin kafkaAdmin;
    private final ExecutorService checkExecutor = Executors.newSingleThreadExecutor();

    public KafkaLagHealthIndicator(KafkaAdmin kafkaAdmin) {
        this.kafkaAdmin = kafkaAdmin;
    }

    @Override
    public Health health() {
        Future<Health> future = checkExecutor.submit(this::evaluateKafkaHealth);

        try {
            // Giới hạn timeout 500ms, không bao giờ để Health Indicator làm nghẽn Probe
            return future.get(TIMEOUT_MS, TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            log.warn("Kafka health check timed out after {}ms. Marking degraded.", TIMEOUT_MS);
            return Health.down()
                    .withDetail("error", "Kafka admin timeout after 500ms")
                    .build();
        } catch (Exception ex) {
            return Health.down(ex).build();
        }
    }

    private Health evaluateKafkaHealth() {
        try (AdminClient adminClient = AdminClient.create(kafkaAdmin.getConfigurationProperties())) {
            // Kiểm tra kết nối cluster bằng việc lấy Cluster ID
            String clusterId = adminClient.describeCluster().clusterId().get(400, TimeUnit.MILLISECONDS);
            return Health.up()
                    .withDetail("clusterId", clusterId)
                    .withDetail("status", "CONNECTED")
                    .build();
        } catch (Exception e) {
            return Health.down().withDetail("error", e.getMessage()).build();
        }
    }
}
~~~

### 2.4. Điều Khiển Trạng Thái Sẵn Sàng (Programmatic Readiness Management)

Khi bạn muốn thực hiện bảo trì, xả cache hoặc chuẩn bị tắt ứng dụng (Graceful Drainage), bạn có thể chủ động chuyển trạng thái Readiness sang <code>REFUSING_TRAFFIC</code> bằng code:

~~~java
package com.enterprise.course.actuator.control;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/maintenance")
public class MaintenanceController {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceController.class);
    private final ApplicationEventPublisher eventPublisher;

    public MaintenanceController(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    @PostMapping("/drain")
    @PreAuthorize("hasRole('DEVOPS_ADMIN')")
    public ResponseEntity<String> drainTraffic() {
        log.warn("DevOps triggered manual traffic drainage! Refusing readiness traffic...");
        
        // Phát sự kiện báo cho Spring Boot đổi trạng thái Readiness sang REFUSING_TRAFFIC
        // Kubelet sẽ lập tức gỡ Pod này ra khỏi Service Endpoints trong vòng 2 giây!
        AvailabilityChangeEvent.publish(eventPublisher, this, ReadinessState.REFUSING_TRAFFIC);

        return ResponseEntity.ok("Pod readiness set to REFUSING_TRAFFIC. Traffic drained.");
    }

    @PostMapping("/resume")
    @PreAuthorize("hasRole('DEVOPS_ADMIN')")
    public ResponseEntity<String> resumeTraffic() {
        log.info("Resuming readiness traffic...");
        AvailabilityChangeEvent.publish(eventPublisher, this, ReadinessState.ACCEPTING_TRAFFIC);
        return ResponseEntity.ok("Pod readiness set to ACCEPTING_TRAFFIC.");
    }
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Truy Vấn Liveness & Readiness Probes Qua cURL

~~~bash
# 1. Kiểm tra Liveness Probe (Chạy trên cổng quản trị 8081)
curl -i -s http://localhost:8081/actuator/health/liveness
~~~

Phản hồi chuẩn:
~~~http
HTTP/1.1 200 OK
Content-Type: application/vnd.spring-boot.actuator.v3+json

{"status":"UP"}
~~~

~~~bash
# 2. Kiểm tra Readiness Probe
curl -i -s http://localhost:8081/actuator/health/readiness
~~~

Phản hồi khi hệ thống khỏe mạnh:
~~~http
HTTP/1.1 200 OK
Content-Type: application/vnd.spring-boot.actuator.v3+json

{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "hikariConnectionPool": {
      "status": "UP",
      "details": {
        "activeConnections": 4,
        "maxPoolSize": 20,
        "saturationPercentage": "20.00%"
      }
    },
    "readinessState": {"status": "UP"}
  }
}
~~~

Khi Connection Pool quá tải, Readiness lập tức trả về <code>HTTP 503 Service Unavailable</code>:
~~~http
HTTP/1.1 503 SERVICE UNAVAILABLE
Content-Type: application/vnd.spring-boot.actuator.v3+json

{
  "status": "DOWN",
  "components": {
    "hikariConnectionPool": {
      "status": "DOWN",
      "details": {
        "activeConnections": 20,
        "maxPoolSize": 20,
        "saturationPercentage": "100.00%",
        "threadsAwaitingConnection": 35
      }
    }
  }
}
~~~

### 3.2. Cấu Hình Kubernetes Deployment Manifest Hoàn Hảo

File <code>deployment.yaml</code> tinh chỉnh thời gian Probes chuẩn xác:

~~~yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-service
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: payment-app
          image: enterprise/payment-service:1.0.0
          ports:
            - containerPort: 8080
              name: http
            - containerPort: 8081
              name: management
          
          # 1. Startup Probe: Chờ tối đa 60 giây (30 x 2s) cho ứng dụng nạp Context
          startupProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8081
            failureThreshold: 30
            periodSeconds: 2

          # 2. Liveness Probe: Chỉ kích hoạt sau khi Startup Probe thành công
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8081
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3

          # 3. Readiness Probe: Kiểm tra định kỳ 5 giây/lần
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8081
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
~~~

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Lộ Lỗ Hổng Spring Boot Actuator RCE & Data Leakage

- **Bối cảnh**: Nhiều dự án cấu hình <code>management.endpoints.web.exposure.include=*</code> và không phân tách cổng management (vẫn dùng port 8080 chung với nghiệp vụ).
- **Hậu quả thảm khốc**:
  1. Tin tặc gọi <code>GET http://domain.com/actuator/env</code> và đọc toàn bộ mật khẩu kết nối database, API keys của bên thứ ba trong <code>application.yml</code>.
  2. Tin tặc gọi <code>POST http://domain.com/actuator/restart</code> hoặc khai thác lỗ hổng deserialization trên <code>/actuator/jolokia</code> để chiếm toàn quyền thực thi mã từ xa (RCE).
- **Giải pháp bảo vệ DevSecOps**:
  1. Chỉ expose duy nhất các endpoint cần thiết: <code>include: health,info,prometheus,metrics</code>.
  2. Tách cổng quản trị riêng: <code>management.server.port=8081</code>. Cấu hình tường lửa hoặc Ingress Controller chặn 100% traffic từ Internet đánh vào cổng 8081.

### 4.2. Sự cố 2: Probe Timeout Deadlock do SQL Query Chậm

- **Bối cảnh**: Health Indicator mặc định của Spring Data JPA thực hiện lệnh kiểm tra <code>validationQuery</code> (ví dụ: <code>SELECT 1</code>). Trong giờ cao điểm, hàng đợi I/O của PostgreSQL bị tắc nghẽn, câu lệnh <code>SELECT 1</code> mất tới 4 giây mới có phản hồi.
- **Hậu quả**: Kubernetes cấu hình <code>timeoutSeconds: 2</code>. Kubelet gửi probe vào, chờ 2 giây không thấy phản hồi liền đánh dấu probe FAIL. Sau 3 lần fail liên tiếp, Kubelet tự động kill Pod! Pod liên tục bị giết và khởi động lại vòng lặp (CrashLoopBackOff) dù CPU và RAM của ứng dụng vẫn hoàn toàn bình thường.
- **Giải pháp**: Luôn đặt timeout trên tầng DataSource hoặc bọc các tác vụ kiểm tra trong <code>CompletableFuture.get(timeout, TimeUnit.MILLISECONDS)</code>. Đặt <code>timeoutSeconds</code> của Kubernetes Probe lớn hơn timeout nội bộ của ứng dụng (ví dụ: probe timeout 3s, app timeout 1s).

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây dựng Redis Cluster Circuit-Breaker Health Indicator

Trong hệ thống E-commerce, Redis được dùng làm tầng cache cấp 1.
Hãy viết một <code>CustomRedisHealthIndicator</code>:
1. Sử dụng <code>RedisConnectionFactory</code> để ping Redis (<code>connection.ping()</code>).
2. Tác vụ ping bắt buộc phải có timeout tối đa **300 miligiây**. Nếu sau 300ms Redis không phản hồi hoặc ném exception, đánh dấu trạng thái là <code>DOWN</code> kèm theo chi tiết lỗi, nhưng **tuyệt đối không làm treo luồng HTTP của Kubernetes probe**.
3. Bổ sung metric đếm số lần health check thất bại vào Micrometer Registry (<code>actuator_redis_health_failures_total</code>).

### Lời giải hoàn chỉnh (Reference Solution)

~~~java
package com.enterprise.course.challenge.actuator;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.*;

@Component("customRedis")
public class SafeRedisHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(SafeRedisHealthIndicator.class);
    private static final long TIMEOUT_MS = 300L;

    private final RedisConnectionFactory redisConnectionFactory;
    private final Counter failureCounter;
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor(); // Java 21 Virtual Threads

    public SafeRedisHealthIndicator(RedisConnectionFactory redisConnectionFactory, MeterRegistry meterRegistry) {
        this.redisConnectionFactory = redisConnectionFactory;
        this.failureCounter = Counter.builder("actuator_redis_health_failures_total")
                .description("Number of times Redis health check failed or timed out")
                .register(meterRegistry);
    }

    @Override
    public Health health() {
        Future<Health> checkTask = executor.submit(this::pingRedis);

        try {
            return checkTask.get(TIMEOUT_MS, TimeUnit.MILLISECONDS);
        } catch (TimeoutException ex) {
            failureCounter.increment();
            log.error("Redis ping timed out after {}ms!", TIMEOUT_MS);
            return Health.down()
                    .withDetail("timeoutMs", TIMEOUT_MS)
                    .withDetail("error", "Redis server unresponsive within 300ms deadline")
                    .build();
        } catch (Exception ex) {
            failureCounter.increment();
            log.error("Redis health check threw exception: {}", ex.getMessage());
            return Health.down(ex).build();
        }
    }

    private Health pingRedis() {
        long start = System.currentTimeMillis();
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            String pingResponse = connection.ping();
            long latencyMs = System.currentTimeMillis() - start;

            if ("PONG".equalsIgnoreCase(pingResponse)) {
                return Health.up()
                        .withDetail("latencyMs", latencyMs)
                        .withDetail("response", pingResponse)
                        .build();
            } else {
                return Health.down()
                        .withDetail("unexpectedResponse", pingResponse)
                        .build();
            }
        }
    }
}
~~~
`
    },
    {
      id: "7-4",
      type: "lesson",
      title: "JVM & Performance Tuning — Spring Boot 3.4 + Java 21",
      minutes: 50,
      content: `## Latency P99 vọt lên 4 giây, CPU 90%, GC Pause 800ms — bắt đầu gỡ từ đâu?

Khi một ứng dụng Spring Boot đối mặt với lưu lượng truy cập cao trong đợt Sale hoặc sự kiện lớn, 90% đội ngũ kỹ sư phản ứng theo quán tính:
*"Tăng gấp đôi RAM container từ 2GB lên 4GB, tăng connection pool từ 20 lên 100, tăng số thread Tomcat lên 500!"*

Kết quả nhận lại là thảm họa kép:
1. **GC Pause kéo dài gấp đôi**: Tăng Heap lên mà không hiểu cơ chế Garbage Collector khiến pha dọn dẹp Full GC làm đóng băng (Stop-The-World) toàn bộ ứng dụng từ 200ms thành 1.5 giây. Mọi kết nối HTTP của khách hàng bị drop hàng loạt.
2. **Nghẽn cổ chai CPU do Context Switching**: Tăng pool size và số thread Tomcat lên hàng trăm luồng khiến CPU dành 60% thời gian chỉ để hoán đổi ngữ cảnh giữa các luồng hệ điều hành (OS thread context switches) thay vì thực thi code nghiệp vụ.
3. **Ảo tưởng Virtual Threads**: Bật <code>spring.threads.virtual.enabled=true</code> trong Java 21 nhưng code nội bộ vẫn sử dụng từ khóa <code>synchronized</code>, dẫn đến hiện tượng **Virtual Thread Pinning** làm tê liệt hoàn toàn Carrier Thread Pool!

Tuning hiệu năng không phải là phỏng đoán hay chỉnh thông số bừa bãi. Đó là một môn khoa học có phương pháp luận: **ĐO LƯỜNG -> ĐỊNH VỊ NÚT CỔ CHAI -> ĐIỀU CHỈNH ĐƠN LẺ -> KIỂM CHỨNG LẠI**.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### Sơ Đồ Mô Phỏng: Cơ Chế Tháo Dỡ (Unmounting) Virtual Thread Khi Gặp Blocking I/O

~~~mermaid
flowchart TD
    subgraph CarrierPool ["Carrier Thread Pool (ForkJoinPool - 8 OS Threads)"]
        CT1["Carrier Thread 1 (CPU Core 1)"]
    end
    
    VT1["Virtual Thread #101"] --> CT1
    Note1["VT #101 Đang chạy code tính toán CPU"]
    
    CT1 --> Wait["Gặp tác vụ Blocking I/O<br/>(Socket Read từ Database hoặc HTTP)"]
    Wait --> Unmount["UNMOUNT MECHANISM:<br/>1. Lưu Call Stack của VT #101 vào Heap Memory<br/>2. Đưa VT #101 vào trạng thái PARKED"]
    
    Unmount --> Free["Carrier Thread 1 RẢNH TAY NGAY LẬP TỨC!"]
    Free --> CT1_Next["Carrier Thread 1 MOUNT Virtual Thread #102 để chạy tiếp!"]
    
    DataReady["Hệ điều hành báo dữ liệu Socket đã tới!"] --> Unpark["VT #101 được UNPARK"]
    Unpark --> Remount["VT #101 được nạp lại vào bất kỳ Carrier Thread nào rảnh để chạy tiếp!"]
~~~


### 1.1. Bản Đồ Bộ Nhớ JVM Hiện Đại (Java 21)

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| TOTAL PROCESS RESIDENT MEMORY (RSS)                                         |
|                                                                             |
|  +───────────────────────────────────────────────────────────────────────+  |
|  | HEAP MEMORY (-XX:MaxRAMPercentage=75.0)                              |  |
|  |  [ Eden Space ] ──> [ Survivor S0/S1 ] ──(Tenuring)──> [ Old Gen ]    |  |
|  |  (Nơi sinh ra Object)  (Sống sót qua Minor GC)         (Object lâu năm)|  |
|  +───────────────────────────────────────────────────────────────────────+  |
|                                                                             |
|  +───────────────────────────────────────────────────────────────────────+  |
|  | NON-HEAP & NATIVE MEMORY (Chiếm 25% - 30% còn lại của Container)     |  |
|  |  [ Metaspace ]           --> Metadata của các Class, Methods, Bytecode|  |
|  |  [ Code Cache ]          --> Native machine code biên dịch bởi JIT   |  |
|  |  [ Thread Stacks ]       --> Bộ nhớ stack (Platform: 1MB/thread,     |  |
|  |                              Virtual: chỉ 200 - 500 bytes!)          |  |
|  |  [ Direct ByteBuffers ]  --> Netty I/O buffers (Off-heap, zero-copy) |  |
|  |  [ GC Overhead ]         --> Cấu trúc dữ liệu nội bộ của G1/ZGC      |  |
|  +───────────────────────────────────────────────────────────────────────+  |
+─────────────────────────────────────────────────────────────────────────────+
~~~

### 1.2. Cuộc Chiến Garbage Collector: G1GC vs Generational ZGC

Java 21 đánh dấu bước nhảy vọt với hai lựa chọn Garbage Collector hàng đầu:

1. **G1GC (Garbage-First GC — Mặc định từ Java 9+)**:
   - Chia Heap thành hàng ngàn Regions nhỏ (kích thước từ 1MB đến 32MB).
   - Tối ưu hóa dựa trên mục tiêu độ trễ: <code>-XX:MaxGCPauseMillis=200</code> (mặc định 200ms). G1 sẽ tự động co giãn kích thước Young Gen để đảm bảo thời gian dừng Stop-The-World (STW) không vượt quá con số này.
   - Thích hợp cho: Các ứng dụng có Heap từ 2GB đến 16GB, cân bằng tuyệt vời giữa **Throughput** (thông lượng) và **Latency**.

2. **Generational ZGC (<code>-XX:+UseZGC -XX:+ZGenerational</code>)**:
   - Thuật toán Garbage Collector thế hệ mới đỉnh cao của OpenJDK 21.
   - Thực hiện hầu hết các giai đoạn đánh dấu (marking) và di chuyển object (relocation) **hoàn toàn đồng thời (concurrent)** với thread ứng dụng, sử dụng kỹ thuật Colored Pointers và Load Barriers.
   - **Đặc điểm siêu việt**: Thời gian dừng Stop-The-World **dưới 1 miligiây (< 1ms)**, bất kể kích thước Heap là 4GB hay 16 Terabytes!
   - Thích hợp cho: Các hệ thống tài chính, giao dịch chứng khoán, cổng thanh toán yêu cầu SLA Latency P99 nghiêm ngặt dưới 10ms.

### 1.3. Cơ Chế Java 21 Virtual Threads & Cạm Bẫy "Pinning" (Thread Pinning)

Virtual Threads (Project Loom) là các luồng siêu nhẹ do chính JVM quản lý (không phải OS threads):
- Một số lượng nhỏ **Carrier Threads** (thường bằng số CPU cores, chạy trong ForkJoinPool) sẽ cõng hàng triệu Virtual Threads.
- Khi một Virtual Thread gặp tác vụ I/O chặn (Blocking I/O như đọc Socket HTTP, JDBC query, <code>Thread.sleep</code>), JVM sẽ **tháo dỡ (unmount)** Virtual Thread đó ra khỏi Carrier Thread và cất context vào Heap. Carrier Thread ngay lập tức rảnh tay để phục vụ Virtual Thread khác!

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| CARRIER THREAD (OS Worker Thread - CPU Core 1)                              |
|                                                                             |
|  Running VT #1  ──(Gặp Socket Read)──>  UNMOUNT VT #1 (Lưu vào Heap)       |
|                                                │                            |
|  Running VT #2  <──────────────────────────────┘ (Mount tiếp tục xử lý)     |
+─────────────────────────────────────────────────────────────────────────────+
~~~

#### Cạm Bẫy Chết Người: "Pinning" Khi Dùng <code>synchronized</code>
Nếu bên trong code bạn gọi tác vụ I/O chặn trong khi đang giữ một khối khóa <code>synchronized</code>:
~~~java
// NGUY HIỂM: GÂY THREAD PINNING TRÊN JAVA 21
public synchronized byte[] fetchExternalData() {
    return restTemplate.getForObject("http://slow-api", byte[].class); // Chặn I/O
}
~~~
JVM **KHÔNG THỂ** unmount Virtual Thread ra khỏi Carrier Thread vì con trỏ frame của <code>synchronized</code> bị ghim chặt (pinned) vào native stack frame của hệ điều hành!
Nếu có 8 carrier threads mà cả 8 đều bị ghim bởi các request gọi API chậm: **Toàn bộ ứng dụng Java 21 bị đóng băng hoàn toàn**, không thể xử lý thêm bất kỳ request nào khác dù CPU sử dụng chỉ mới 2%!

---

## 2. Production-Grade Implementation Code

### 2.1. Bộ Tham Số JVM Flag Chuẩn Cho Java 21 Containers

File cấu hình môi trường khởi động JVM đạt chuẩn Enterprise:

~~~bash
# Lựa chọn 1: G1GC Chuẩn (Cân bằng Thông lượng & Tiết kiệm RAM)
JAVA_OPTS="   -XX:MaxRAMPercentage=75.0   -XX:InitialRAMPercentage=50.0   -XX:+UseG1GC   -XX:MaxGCPauseMillis=150   -XX:G1ReservePercent=15   -XX:InitiatingHeapOccupancyPercent=45   -XX:+ExitOnOutOfMemoryError   -XX:+HeapDumpOnOutOfMemoryError   -XX:HeapDumpPath=/dumps/heap_dump.hprof   -Djdk.tracePinnedThreads=short   -Djava.security.egd=file:/dev/./urandom   -XX:+AlwaysPreTouch"

# Lựa chọn 2: Generational ZGC (Dành cho Hệ thống Yêu cầu P99 Latency < 5ms)
JAVA_OPTS_ULTRA_LOW_LATENCY="   -XX:MaxRAMPercentage=70.0   -XX:+UseZGC   -XX:+ZGenerational   -XX:+ExitOnOutOfMemoryError   -XX:+HeapDumpOnOutOfMemoryError   -XX:HeapDumpPath=/dumps/heap_dump.hprof   -Djdk.tracePinnedThreads=full"
~~~

Giải thích cờ nâng cao:
- <code>-Djdk.tracePinnedThreads=short</code>: Tự động in stack trace ra console mỗi khi có luồng Virtual Thread bị dính bẫy Pinning!
- <code>-XX:+AlwaysPreTouch</code>: Cấp phát và zero-out toàn bộ trang nhớ vật lý của Heap ngay khi khởi động, tránh giật lag phân trang bộ nhớ (page fault latency) trong lần đầu user truy cập.

### 2.2. Kích Hoạt Virtual Threads & Khử Bẫy Pinning Bằng <code>ReentrantLock</code>

Cấu hình Spring Boot 3.3+ bật Virtual Threads:
~~~yaml
spring:
  threads:
    virtual:
      enabled: true # Tự động chuyển Tomcat Executor và @Async sang Virtual Threads!
~~~

Refactor loại bỏ triệt để <code>synchronized</code> sang <code>ReentrantLock</code>:

~~~java
package com.enterprise.course.tuning.concurrency;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

@Service
public class SafeVirtualThreadLockingService {

    private static final Logger log = LoggerFactory.getLogger(SafeVirtualThreadLockingService.class);
    
    // Sử dụng ReentrantLock thay vì synchronized để KHÔNG LÀM PIN CARRIER THREAD
    private final ReentrantLock lock = new ReentrantLock();
    private final ConcurrentHashMap<String, String> localCache = new ConcurrentHashMap<>();

    public String computeCriticalResource(String key) {
        lock.lock(); // An toàn tuyệt đối với Virtual Threads: Thread unmount bình thường khi chờ lock!
        try {
            log.info("Executing under virtual thread: {}", Thread.currentThread());
            
            // Giả lập tác vụ I/O hoặc tính toán an toàn
            return localCache.computeIfAbsent(key, k -> "Computed-" + System.currentTimeMillis());
        } finally {
            lock.unlock();
        }
    }
}
~~~

### 2.3. Công Thức Định Cỡ HikariCP & Cấu Hình Chống Rò Rỉ Kết Nối

Công thức kinh điển từ các kỹ sư PostgreSQL và Oracle để tính kích thước Pool tối ưu:

$$	ext{Pool Size} = (	ext{CPU Cores} 	imes 2) + 	ext{Effective Spindle Count}$$

Với container 4 CPU Cores và ổ cứng SSD (Spindle = 1):
$$	ext{Pool Size} = (4 	imes 2) + 1 = 9 	ext{ đến } 15 	ext{ connections!}$$
*Đừng bao giờ đặt pool size 100*. Pool size lớn chỉ làm database nghẽn I/O và lãng phí RAM.

Cấu hình <code>application.yml</code>:
~~~yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 15
      minimum-idle: 5
      connection-timeout: 3000 # 3 giây: Nếu không lấy được kết nối thì báo lỗi ngay, không treo user
      idle-timeout: 600000     # 10 phút
      max-lifetime: 1800000    # 30 phút: Luôn ngắn hơn connection timeout của DB firewall/NAT
      
      # TÍNH NĂNG VÀNG: Báo động rò rỉ connection nếu một thread giữ kết nối quá 2 giây!
      leak-detection-threshold: 2000
      
      pool-name: EnterpriseHikariPool
~~~

### 2.4. Trình Kích Hoạt Java Flight Recorder (JFR) Tự Động Khi Hệ Thống Bị Spike Latency

Thay vì phải gõ lệnh terminal khi sự cố đang diễn ra, bạn có thể lập trình để Spring Boot tự động quay lại 30 giây hoạt động của JVM qua JFR:

~~~java
package com.enterprise.course.tuning.jfr;

import jdk.jfr.Recording;
import jdk.jfr.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;

@Service
public class DynamicJfrDiagnosticsService {

    private static final Logger log = LoggerFactory.getLogger(DynamicJfrDiagnosticsService.class);

    public void captureDiagnosticRecording(Duration duration) {
        new Thread(() -> {
            try {
                log.warn("Starting automatic JFR diagnostic recording for {} seconds...", duration.toSeconds());
                
                // Nạp profile cấu hình profiling sâu (CPU, Locks, Memory Allocations)
                Configuration config = Configuration.getConfiguration("profile");
                
                try (Recording recording = new Recording(config)) {
                    recording.setDuration(duration);
                    recording.start();
                    
                    Thread.sleep(duration.toMillis());
                    
                    String fileName = String.format("/dumps/jfr_spike_%s.jfr", Instant.now().toEpochMilli());
                    Path destination = Path.of(fileName);
                    recording.dump(destination);
                    
                    log.warn("JFR recording saved successfully to: {}", destination.toAbsolutePath());
                }
            } catch (Exception ex) {
                log.error("Failed to execute JFR diagnostic recording: {}", ex.getMessage(), ex);
            }
        }, "jfr-diagnostic-worker").start();
    }
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Phân Tích Hiện Tượng Thread Pinning Bằng Log

Nếu bạn đã cấu hình <code>-Djdk.tracePinnedThreads=short</code>, khi có một đoạn code <code>synchronized</code> bị chặn I/O, JVM sẽ tự động ghi vết ra console:

~~~text
Thread[#45,ForkJoinPool-1-worker-3,5,CarrierThreads]
    java.base/java.lang.VirtualThread$VThreadContinuation.onPinned(VirtualThread.java:183)
    com.enterprise.course.legacy.LegacyService.fetchData(LegacyService.java:24) <== PINNED HERE!
    com.enterprise.course.api.OrderController.getOrder(OrderController.java:42)
~~~

Nhìn vào dòng <code>LegacyService.java:24</code>, bạn lập tức phát hiện chính xác phương thức nào đang dùng <code>synchronized</code> để sửa ngay sang <code>ReentrantLock</code>!

### 3.2. Chụp Heap Dump và Thread Dump Bằng Lệnh <code>jcmd</code>

Khi đang đứng trong container của Pod đang chạy, sử dụng bộ công cụ <code>jcmd</code> không gây gián đoạn:

~~~bash
# 1. Tìm PID của tiến trình Java
jcmd

# 2. Xuất Thread Dump định dạng JSON (Hỗ trợ phân tích hàng ngàn Virtual Threads)
jcmd 1 Thread.dump_to_file -format=json /dumps/threads.json

# 3. Xuất Heap Dump để phân tích rò rỉ bộ nhớ (Memory Leak) bằng Eclipse MAT
jcmd 1 GC.heap_dump /dumps/heap_analysis.hprof

# 4. Kiểm tra thống kê Metaspace và Native Memory (NMT)
jcmd 1 VM.metaspace
~~~

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Rò Rỉ Kết Nối HikariCP do Gọi API Bên Thứ Ba Trong <code>@Transactional</code>

- **Bối cảnh**: Lập trình viên viết logic thanh toán:
  ~~~java
  @Transactional
  public void processPayment(Order order) {
      orderRepository.save(order); // Lấy 1 connection từ HikariCP
      
      // GỌI API ĐỐI TÁC NGÂN HÀNG MẤT 10 GIÂY
      paymentGatewayClient.charge(order.getAmount()); 
      
      order.markSuccess();
  }
  ~~~
- **Cơ chế thảm họa**: <code>@Transactional</code> chiếm giữ connection từ đầu hàm cho đến khi kết thúc. Trong suốt 10 giây chờ ngân hàng phản hồi, connection DB nằm im không làm gì cả. 
  Chỉ cần 15 khách hàng cùng thanh toán, toàn bộ 15 connection của pool bị giữ chặt. Hàng ngàn khách hàng khác truy cập ứng dụng liền bị treo cứng và nhận lỗi <code>Connection is not available, request timed out after 3000ms</code>.
- **Giải pháp dứt khoát**:
  1. **Tuyệt đối không bọc Network I/O hoặc external API trong <code>@Transactional</code>**.
  2. Bật <code>spring.datasource.hikari.leak-detection-threshold=2000</code> để log cảnh báo lập tức vị trí code giữ connection quá 2 giây.

### 4.2. Sự cố 2: Tràn Bộ Nhớ Metaspace (<code>OutOfMemoryError: Metaspace</code>)

- **Bối cảnh**: Một thư viện tự viết sử dụng Reflection hoặc CGLIB để sinh dynamic proxy class cho mỗi request mà không có bộ đệm (cache) class loader.
- **Hậu quả**: Metaspace phình to liên tục từ 128MB lên 1GB. Mặc dù Heap vẫn còn trống 80%, JVM vẫn ném <code>java.lang.OutOfMemoryError: Metaspace</code> và sập container.
- **Giải pháp**:
  Giới hạn trần Metaspace để tránh ngốn sạch RAM container:
  <code>-XX:MaxMetaspaceSize=384m</code>. Kiểm tra và dùng các framework sinh bytecode chuẩn (như ByteBuddy) với cơ chế cache Class definitions.

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây dựng HikariCP Connection Leak Guard & Async API Isolation

Hãy viết một cấu trúc Service hoàn chỉnh cho nghiệp vụ Checkout đơn hàng:
1. Đảm bảo connection Database **chỉ được chiếm dụng trong thời gian thực thi SQL (dưới 50ms)**.
2. Tác vụ gọi cổng thanh toán bên thứ ba (mất 2-5 giây) phải được đưa ra ngoài Transaction.
3. Nếu cổng thanh toán thành công, mở một Transaction ngắn thứ 2 để cập nhật trạng thái đơn hàng.
4. Kiểm soát luồng chạy hoàn toàn trên Java 21 Virtual Threads mà không gây ra bất kỳ Thread Pinning nào.

### Lời giải hoàn chỉnh (Reference Solution)

~~~java
package com.enterprise.course.tuning.solution;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.UUID;

@Service
public class OptimizedCheckoutOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(OptimizedCheckoutOrchestrator.class);

    private final TransactionTemplate transactionTemplate;
    private final OrderDatabaseRepository orderRepository;
    private final ExternalPaymentGatewayClient paymentClient;

    public OptimizedCheckoutOrchestrator(TransactionTemplate transactionTemplate,
                                         OrderDatabaseRepository orderRepository,
                                         ExternalPaymentGatewayClient paymentClient) {
        this.transactionTemplate = transactionTemplate;
        this.orderRepository = orderRepository;
        this.paymentClient = paymentClient;
    }

    public String processCheckout(String customerId, BigDecimal amount) {
        // BƯỚC 1: Transaction ngắn #1 (Chỉ giữ DB Connection ~5ms)
        String orderId = transactionTemplate.execute(status -> {
            log.info("Holding DB connection for step 1: Creating PENDING order");
            String id = "ORD-" + UUID.randomUUID().toString().substring(0, 8);
            orderRepository.createPendingOrder(id, customerId, amount);
            return id;
        });

        // BƯỚC 2: Gọi External Gateway (Mất 2-5 giây) - HOÀN TOÀN KHÔNG GIỮ DB CONNECTION!
        // Virtual Thread sẽ unmount tự do khi chờ Socket I/O
        boolean paymentSuccess = false;
        try {
            log.info("Calling slow payment gateway without holding any DB connection...");
            paymentSuccess = paymentClient.chargeCreditCard(orderId, amount);
        } catch (Exception e) {
            log.error("Network error during charge: {}", e.getMessage());
        }

        // BƯỚC 3: Transaction ngắn #2 (Chỉ giữ DB Connection ~5ms)
        final boolean finalStatus = paymentSuccess;
        transactionTemplate.executeWithoutResult(status -> {
            log.info("Holding DB connection for step 3: Updating final order status");
            if (finalStatus) {
                orderRepository.updateStatus(orderId, "PAID");
            } else {
                orderRepository.updateStatus(orderId, "PAYMENT_FAILED");
            }
        });

        return orderId;
    }
}
~~~
`
    },
    {
      id: "7-5",
      type: "lesson",
      title: "Load Testing — k6, Gatling, JMeter: số liệu trước khi khách cháy",
      minutes: 50,
      content: `## Load Test = 1 user cURL thử — Đến 2h sáng Production cháy với 1,000 TPS

Một trong những sai lầm ngây thơ nhất của lập trình viên là:
*"Em vừa dùng cURL và Postman gọi thử API tạo đơn hàng, thấy phản hồi trả về trong 45ms rất mượt mà. Hệ thống đã sẵn sàng Go-Live!"*

Đến ngày khai trương hoặc chiến dịch Flash Sale:
- 500 người dùng đồng loạt bấm nút "Thanh toán".
- Độ trễ P99 vọt từ 45ms lên **8,500ms (8.5 giây)**!
- Hàng trăm HTTP 504 Gateway Timeout xuất hiện, connection pool của Database cạn kiệt, các request sau bị kẹt trong hàng đợi Tomcat và làm tràn bộ nhớ Heap.
- Khách hàng bị trừ tiền 2 lần do bấm nút F5 liên tục, server sập hoàn toàn.

**Mọi hệ thống đều chạy nhanh khi chỉ có 1 User**. Điều quyết định sự sống còn của một hệ thống Enterprise nằm ở hành vi của nó tại **ĐỈNH TẢI (Peak Concurrency)**. 

Bài học này sẽ trang bị cho bạn tư duy và công cụ kiểm thử tải chuyên nghiệp: Định luật Little's Law, bẫy Coordinated Omission, phân tích chỉ số phân vị (P50, P95, P99), và viết kịch bản tự động hóa tải cao bằng **Grafana k6** và **Gatling Java SDK**.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### 1.1. Bản Chất Toán Học Của Tải: Little's Law & Concurrency

Mối quan hệ giữa số lượng người dùng đồng thời, thông lượng và thời gian phản hồi tuân theo **Định luật Little (Little's Law)**:

$$L = lambda 	imes W$$

Trong đó:
- $L$ (Concurrency): Số lượng request đang được xử lý đồng thời trong hệ thống.
- $lambda$ (Throughput / RPS): Số lượng request hoàn tất mỗi giây.
- $W$ (Latency): Thời gian trung bình để xử lý xong một request.

**Ví dụ thực tế**:
Nếu hệ thống của bạn nhận 1,000 request/giây ($lambda = 1000$).
- Nếu code tối ưu, response time là 50ms ($W = 0.05s$): Hệ thống chỉ cần gánh đồng thời $L = 1000 	imes 0.05 = mathbf{50}$ concurrent requests.
- Nếu code bị nghẽn DB hoặc gọi external API mất 2 giây ($W = 2.0s$): Hệ thống buộc phải gánh đồng thời $L = 1000 	imes 2 = mathbf{2,000}$ concurrent requests! 2,000 thread bị chiếm dụng, hàng trăm MB RAM bị giữ cho context, và hệ thống sẽ sụp đổ.

### 1.2. Sự Dối Trá Của Giá Trị Trung Bình (Average vs Percentiles)

~~~text
+─────────────────────────────────────────────────────────────────────────────+
| KỊCH BẢN: 100 REQUESTS                                                      |
|                                                                             |
|  - 99 requests phản hồi trong 10ms                                          |
|  - 1 request bị kẹt lock database phản hồi trong 10,000ms (10 giây)         |
|                                                                             |
|  --> AVERAGE (Trung bình): (99 * 10 + 10000) / 100 = 109.9ms               |
|      (Báo cáo nhìn rất đẹp: "Thời gian trung bình chỉ ~100ms!")              |
|                                                                             |
|  --> P99 (Phân vị thứ 99): 10,000ms (10 GIÂY THỰC TẾ!)                      |
|      (Khách hàng VIP thứ 100 đã bực bội tắt trình duyệt và bỏ sang đối thủ) |
+─────────────────────────────────────────────────────────────────────────────+
~~~

- **P50 (Median)**: 50% người dùng nhận kết quả nhanh hơn con số này.
- **P95 / P99**: 95% và 99% người dùng nhận kết quả nhanh hơn con số này. Trong các hợp đồng SLA Enterprise, P99 là tiêu chuẩn vàng bắt buộc phải cam kết.

### 1.3. Bốn Cấp Độ Kiểm Thử Hiệu Năng (Performance Test Spectrum)

~~~text
Traffic (RPS)
  ^
  |                                       [ SPIKE TEST ]
  |                                            /  |                 [ LOAD TEST ]             /    |                 ┌───────────┐            /      |                /                       /        |               /                       /          |  [ SOAK TEST ]                       /            |  ─────────────                  ────/              +─────────────────────────────────────────────────────────> Time
~~~

1. **Load Test (Tải dự kiến)**: Đưa hệ thống lên tải mục tiêu (ví dụ 500 RPS trong 30 phút) để kiểm tra xem P99 có thỏa mãn SLA dưới 500ms không.
2. **Stress Test (Tải phá hủy)**: Tăng dần tải (500 -> 1,000 -> 3,000 RPS) cho đến khi hệ thống bắt đầu ném lỗi hoặc timeout. Mục đích: Tìm ra **nút cổ chai đầu tiên bị gãy** (DB pool? CPU? Network bandwidth?).
3. **Spike Test (Sốc tải đột ngột)**: Đột ngột tăng vọt tải từ 50 RPS lên 2,500 RPS chỉ trong 5 giây. Mục đích: Kiểm tra cơ chế tự phục hồi, Circuit Breaker và Autoscaling của Kubernetes.
4. **Soak / Endurance Test (Tải ngâm lâu)**: Giữ tải vừa phải (200 RPS) liên tục trong **24 đến 48 giờ**. Mục đích: Phát hiện **Rò rỉ bộ nhớ (Memory Leak)** hoặc rò rỉ Connection Pool mà các bài test ngắn vài phút không bao giờ thấy được.

---

## 2. Production-Grade Implementation Code

### 2.1. Kịch Bản Kiểm Thử Hoàn Chỉnh Bằng Grafana k6 (<code>flash-sale-loadtest.js</code>)

k6 viết bằng JavaScript hiện đại, chạy trên engine Go siêu nhẹ, có thể tạo ra hàng chục ngàn virtual users (VUs) mà không tốn RAM như JMeter:

~~~javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';

// 1. Định nghĩa Custom Business Metrics
const paymentDuration = new Trend('payment_checkout_duration_ms');
const failedOrdersCounter = new Counter('payment_checkout_failures');

// 2. Cấu hình Stages và SLA Thresholds nghiêm ngặt
export const options = {
  stages: [
    { duration: '30s', target: 50 },   // Warm-up: Tăng dần lên 50 VUs trong 30s
    { duration: '2m',  target: 500 },  // Ramp-up: Tăng lên 500 VUs trong 2 phút
    { duration: '3m',  target: 500 },  // Steady: Giữ vững 500 VUs liên tục 3 phút
    { duration: '30s', target: 0 },    // Ramp-down: Hạ tải về 0
  ],
  thresholds: {
    // 95% request phải dưới 400ms, 99% request phải dưới 800ms
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    // Tỷ lệ lỗi toàn hệ thống bắt buộc phải dưới 0.1%
    http_req_failed: ['rate<0.001'],
    // Custom metric threshold
    payment_checkout_duration_ms: ['p(99)<850'],
  },
};

const BASE_URL = 'http://localhost:8080/api/v1';

// Setup function: Chạy 1 lần duy nhất trước khi test để chuẩn bị dữ liệu (Lấy Admin Token)
export function setup() {
  const loginRes = http.post(<code>\${BASE_URL}/auth/token</code>, JSON.stringify({
    clientId: 'load-test-agent',
    secret: 'SuperSecretKey123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'Admin Login successful': (r) => r.status === 200,
  });

  return { token: loginRes.json('accessToken') };
}

// Default function: Mỗi Virtual User (VU) sẽ thực thi hàm này lặp đi lặp lại
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': <code>Bearer \${data.token}</code>,
    'X-Client-Trace-Id': <code>k6-\${__VU}-\${__ITER}</code>,
  };

  // BƯỚC 1: Lấy thông tin danh mục sản phẩm (Read Path)
  const catalogRes = http.get(<code>\${BASE_URL}/products/top-deals</code>, { headers });
  check(catalogRes, {
    'Get catalog status 200': (r) => r.status === 200,
  });

  // Nghỉ ngơi tự nhiên (Think time) của người dùng: 500ms - 1.5s
  sleep(Math.random() * 1.0 + 0.5);

  // BƯỚC 2: Thực hiện đặt hàng và thanh toán (Write Path - Chịu tải cao)
  const payload = JSON.stringify({
    productId: 'PROD-IPHONE-16',
    quantity: 1,
    amount: 999.00,
    merchantId: 'APPLE-STORE-VN',
  });

  const startTime = Date.now();
  const orderRes = http.post(<code>\${BASE_URL}/orders/checkout</code>, payload, { headers });
  const latency = Date.now() - startTime;

  paymentDuration.add(latency);

  const orderSuccess = check(orderRes, {
    'Checkout status 200 or 201': (r) => r.status === 200 || r.status === 201,
    'Checkout response contains orderId': (r) => r.json('orderId') !== undefined,
  });

  if (!orderSuccess) {
    failedOrdersCounter.add(1);
    console.error(<code>Order failed with HTTP \${orderRes.status}: \${orderRes.body}</code>);
  }

  // Think time trước lần lặp tiếp theo
  sleep(1);
}

// Teardown function: Dọn dẹp sau khi kết thúc test
export function teardown(data) {
  console.log('Load test completed. Exporting metrics...');
}
~~~

### 2.2. Kịch Bản Gatling Java SDK Hiện Đại (<code>FlashSaleSimulation.java</code>)

Nếu bạn làm việc trong hệ sinh thái Java thuần túy, Gatling cung cấp Java DSL mạnh mẽ, tương thích hoàn toàn với Gradle/Maven:

~~~java
package com.enterprise.course.loadtest;

import io.gatling.javaapi.core.*;
import io.gatling.javaapi.http.*;

import java.time.Duration;

import static io.gatling.javaapi.core.CoreDsl.*;
import static io.gatling.javaapi.http.HttpDsl.*;

public class FlashSaleSimulation extends Simulation {

    // 1. Cấu hình giao thức HTTP
    private final HttpProtocolBuilder httpProtocol = http
            .baseUrl("http://localhost:8080/api/v1")
            .acceptHeader("application/json")
            .contentTypeHeader("application/json")
            .shareConnections();

    // 2. Kịch bản người dùng (User Scenario)
    private final ScenarioBuilder scn = scenario("Flash Sale Checkout Journey")
            .exec(http("Get Products Catalog")
                    .get("/products/top-deals")
                    .check(status().is(200)))
            .pause(Duration.ofMillis(500), Duration.ofSeconds(2))
            .exec(http("Submit Checkout Order")
                    .post("/orders/checkout")
                    .body(StringBody("{"productId":"PROD-01","quantity":1,"amount":150.00}"))
                    .check(status().in(200, 201))
                    .check(jsonPath("$.orderId").saveAs("orderId")))
            .pause(1);

    // 3. Thiết lập Injection Profile và SLA Assertions
    public FlashSaleSimulation() {
        setUp(
                scn.injectOpen(
                        nothingFor(5), // Chờ 5s
                        rampUsersPerSec(10).to(300).during(Duration.ofMinutes(2)), // Tăng dần lên 300 users/s
                        constantUsersPerSec(300).during(Duration.ofMinutes(3))      // Giữ vững 300 users/s
                )
        ).protocols(httpProtocol)
         .assertions(
                global().responseTime().percentile(99).lt(800), // P99 < 800ms
                global().failedRequests().percent().lt(0.1)     // Tỷ lệ lỗi < 0.1%
         );
    }
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Chạy k6 Container và Đọc Báo Cáo Kết Quả

Chạy k6 trực tiếp bằng Docker:

~~~bash
docker run --rm -i   -v $(pwd)/flash-sale-loadtest.js:/scripts/loadtest.js   grafana/k6 run /scripts/loadtest.js
~~~

Kết quả phân tích đầu ra:
~~~text
          /      |‾‾| /‾‾/   /‾‾/   
     /  /       |  |/  /   /  /    
    /  /        |     (   /   ‾‾  
   /             |  |   |  (‾)  | 
  / __________   |__| __ _____/ .io

  execution: local
     script: /scripts/loadtest.js
     output: -

     scenarios: (100.00%) 1 scenario, 500 max VUs, 6m0s max duration:
              * default: 500 looping VUs for 6m0s (stages...)

     ✓ Admin Login successful
     ✓ Get catalog status 200
     ✓ Checkout status 200 or 201
     ✓ Checkout response contains orderId

     checks.........................: 100.00% ✓ 48200      ✗ 0    
     data_received..................: 42 MB   116 kB/s
     data_sent......................: 14 MB   38 kB/s
     http_req_duration..............: avg=64.2ms  min=12ms med=48ms max=720ms p(95)=185ms p(99)=420ms
     http_req_failed................: 0.00%   ✓ 0          ✗ 24100
     http_reqs......................: 24100   66.94/s
     payment_checkout_duration_ms...: avg=78.5ms  min=22ms med=55ms max=720ms p(99)=480ms
     vus............................: 1       min=1        max=500

✓ http_req_duration..............: p(95)<400 is satisfied (185ms)
✓ http_req_duration..............: p(99)<800 is satisfied (420ms)
✓ http_req_failed................: rate<0.001 is satisfied (0.00%)
✓ payment_checkout_duration_ms...: p(99)<850 is satisfied (480ms)
~~~

Hệ thống đã **VƯỢT QUA 100% CÁC TIÊU CHÍ SLA**!

### 3.2. Đối Chiếu Metrics Actuator Trong Quá Trình Load Test

Trong khi k6 đang bắn tải, hãy quan sát đồng thời các dashboard Actuator trên Grafana:
1. **HikariCP Active Connections**: Đạt đỉnh bao nhiêu? (Ví dụ: dao động 8-12/15 connections -> Pool rất an toàn, không bị nghẽn).
2. **JVM Garbage Collection Time**: Thời gian dừng GC có vượt quá 100ms không?
3. **CPU Utilization**: CPU container đạt bao nhiêu %? (Tối ưu nhất nằm ở khoảng 60% - 75%).

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Test Trên Cơ Sở Dữ Liệu Rỗng hoặc H2 In-Memory

- **Bối cảnh**: Kỹ sư chạy load test trên môi trường staging với Database H2 trong RAM hoặc PostgreSQL mới tinh chỉ có 100 dòng dữ liệu mẫu.
- **Ảo tưởng**: Kết quả test trả về 5,000 RPS, P99 chỉ 10ms. Đội ngũ tự tin đem lên Production.
- **Thảm họa thực tế**: Trên Production, bảng <code>orders</code> đã có **25 triệu dòng dữ liệu**, index phình to 4GB. Khi chịu tải thật, các câu lệnh SQL bắt đầu thực hiện Disk Read và Lock Contention. Hệ thống sập ngay ở mức 150 RPS!
- **Giải pháp**:
  Luôn luôn load test trên **Database chứa khối lượng dữ liệu tương đương Production (Data Seeding)** (ít nhất 80% số dòng so với thực tế).

### 4.2. Sự cố 2: Cạn Kiệt Cổng Ephemeral (Socket Port Exhaustion) Trên Máy Bắn Tải

- **Bối cảnh**: Kỹ sư dùng một máy tính xách tay cấu hình cao để bắn 10,000 requests/s vào server. Sau 1 phút, k6 bắt đầu báo lỗi đỏ rực: <code>dial tcp: cannot assign requested address</code>.
- **Nguyên nhân**: Hệ điều hành có giới hạn dải Ephemeral Ports (thường từ cổng 32768 đến 60999 = ~28,000 cổng). Khi các kết nối HTTP đóng lại, chúng rơi vào trạng thái <code>TIME_WAIT</code> trong 60 giây theo chuẩn TCP. Máy bắn tải dùng hết sạch 28,000 cổng và không thể mở thêm bất kỳ kết nối mới nào!
- **Giải pháp**:
  1. Sử dụng kết nối Keep-Alive (HTTP Connection Reuse) thay vì mở/đóng kết nối liên tục.
  2. Tinh chỉnh nhân Linux trên máy bắn tải:
     ~~~bash
     sysctl -w net.ipv4.tcp_tw_reuse=1
     sysctl -w net.ipv4.ip_local_port_range="1024 65535"
     ~~~

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Xây dựng Kịch bản Soak Test Phát Hiện Rò Rỉ Bộ Nhớ (Memory Leak Detection)

Viết một kịch bản k6 Soak Test chạy liên tục:
1. Giữ tải ổn định 100 Virtual Users trong suốt thời gian test.
2. Mỗi lần lặp, gửi request tạo đơn hàng kèm theo một mảng dữ liệu ngẫu nhiên (Payload size 10KB).
3. Đặt điều kiện Assertion (Threshold): P99 của toàn bộ bài test không được tăng quá **20%** giữa 5 phút đầu và 5 phút cuối. Nếu P99 tăng dần đều theo thời gian, chứng tỏ ứng dụng đang bị rò rỉ bộ nhớ hoặc connection leak!

### Lời giải hoàn chỉnh (Reference Solution)

~~~javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

const earlyPhaseDuration = new Trend('duration_early_phase_ms');
const latePhaseDuration = new Trend('duration_late_phase_ms');

export const options = {
  scenarios: {
    soak_test: {
      executor: 'constant-vus',
      vus: 100,
      duration: '15m', // Giữ 100 VUs liên tục 15 phút (trong thực tế có thể đặt 2h - 12h)
    },
  },
  thresholds: {
    // P99 giai đoạn cuối không được chậm hơn 600ms
    duration_late_phase_ms: ['p(99)<600'],
    http_req_failed: ['rate<0.005'],
  },
};

export default function () {
  // Tạo payload ngẫu nhiên 10KB
  const dummyPayload = {
    customerId: <code>CUST-\${__VU}-\${Date.now()}</code>,
    items: new Array(20).fill(null).map((_, i) => ({
      itemId: <code>ITEM-\${i}</code>,
      name: <code>Product Description Dummy \${Math.random()}</code>,
      price: 25.50
    }))
  };

  const startTime = Date.now();
  const res = http.post('http://localhost:8080/api/v1/orders/bulk-order', JSON.stringify(dummyPayload), {
    headers: { 'Content-Type': 'application/json' },
  });
  const duration = Date.now() - startTime;

  check(res, {
    'Order accepted': (r) => r.status === 200 || r.status === 202,
  });

  // Phân loại metrics theo thời gian chạy:
  // - Nếu trong 3 phút đầu: ghi nhận vào earlyPhaseDuration
  // - Nếu sau 10 phút: ghi nhận vào latePhaseDuration để so sánh độ dốc trễ
  const elapsedMinutes = (Date.now() - startTime) / 60000;
  if (elapsedMinutes <= 3) {
    earlyPhaseDuration.add(duration);
  } else if (elapsedMinutes >= 10) {
    latePhaseDuration.add(duration);
  }

  sleep(0.5);
}
~~~
`
    },
    {
      id: "7-6",
      type: "lesson",
      title: "Dự án tốt nghiệp: Mini-LaaS",
      minutes: 60,
      content: `## Đồ án tốt nghiệp thực chiến: Kiến trúc và Triển khai Mini-LaaS End-to-End

Chào mừng bạn đến với **Đồ án tốt nghiệp Capstone Project: Mini-LaaS (Loyalty-as-a-Service)**!
Đây không phải là một bài tập lý thuyết CRUD sinh viên. Đây là bản thu nhỏ kiến trúc thực chiến chuẩn Enterprise của nền tảng Loyalty & Fintech mà bạn đã rèn luyện qua toàn bộ 8 module của khóa học:
- **Module 0 & 1**: Clean Code, Java 21 Records, Spring Boot 3.3 IoC Container & Dependency Injection.
- **Module 2**: REST API Chuẩn RFC 7807 ProblemDetails, Global Exception Handler, DTO Validation.
- **Module 3**: Spring Data JPA, Hibernate 6.3 <code>@TenantId</code>, Optimistic Locking, Flyway Migration.
- **Module 4**: Testcontainers (PostgreSQL, Redis, Kafka) và Integration Test tự động.
- **Module 5**: Spring Security 6, Keycloak JWT Bearer Token, Resource Server & RBAC.
- **Module 6**: Transactional Outbox Pattern, Kafka Event-Driven, Redis Distributed Lock, Two-Level Cache.
- **Module 7**: Multi-stage Dockerfile Non-root, Kubernetes Health Groups, và Micrometer Prometheus Metrics.

Hệ thống Mini-LaaS cho phép hàng ngàn đối tác doanh nghiệp (Tenants) quản lý hội viên, tích điểm (Earn), và đổi quà (Redeem) với cam kết tuyệt đối: **Không bao giờ trừ âm điểm, không bao giờ trừ trùng lặp (Idempotent), không rò rỉ dữ liệu giữa các Tenant, và không bao giờ mất Event khi sập mạng**.

---

## 1. Kiến trúc chuyên sâu & Cơ chế hoạt động (Under the Hood)

### Sơ Đồ Mô Phỏng: Kiến Trúc Phân Tán Tổng Thể Đồ Án Mini-LaaS

~~~mermaid
flowchart TD
    Client["Client / Frontend SPA"] --> Sec["Spring Security 6 (Keycloak JWT Validation)"]
    Sec --> Ctrl["LoyaltyRedemptionController (RFC 7807 Validation)"]
    Ctrl --> RedService["LoyaltyRedemptionService"]
    
    subgraph DistributedLock ["Concurrency Control"]
        RedService --> Lock["Redisson Distributed Lock (lock:tenant:member)"]
    end
    
    subgraph Storage ["PostgreSQL 16 Multi-Tenant ACID Database"]
        RedService --> MemberTab["t_loyalty_members (@TenantId, @Version)"]
        RedService --> TxTab["t_loyalty_transactions (Idempotency Key)"]
        RedService --> OutboxTab["t_outbox_events (Status: PENDING)"]
    end
    
    subgraph CacheLayer ["Caching Layer"]
        RedService --> RedisCache["Redis L2 Cache (Evict balance)"]
    end
    
    subgraph EventStream ["Asynchronous Event Stream"]
        Worker["Outbox Worker (SKIP LOCKED)"] --> OutboxTab
        Worker --> KafkaTopic["Kafka Topic: loyalty.events.v1"]
    end
    
    style Storage fill:#161b22,stroke:#30363d,color:#fff
    style EventStream fill:#0d1117,stroke:#58a6ff,color:#fff
~~~


### 1.1. Sơ Đồ Kiến Trúc Tổng Thể Mini-LaaS

~~~text
+─────────────────────────────────────────────────────────────────────────────+
|                               Client / SPA / Mobile                         |
+──────────────────────────────────────┬──────────────────────────────────────+
                                       │ Bearer JWT (Keycloak RS256)
                                       ▼
+─────────────────────────────────────────────────────────────────────────────+
| Mini-LaaS Application (Spring Boot 3.3 + Java 21)                           |
|                                                                             |
|  [ Security FilterChain ] ──> JWT Validation & TenantContextHolder setup    |
|            │                                                                |
|            ▼                                                                |
|  [ LoyaltyRedemptionController ] ──> RFC 7807 Validation                    |
|            │                                                                |
|            ▼                                                                |
|  [ RedemptionOrchestrator ]                                                 |
|            │ 1. Acquire Distributed Lock (Redisson / Redis SET NX PX)        |
|            │ 2. Check Idempotency Key Table                                 |
|            │ 3. Check & Deduct Point Balance (Optimistic Lock @Version)     |
|            │ 4. Insert Outbox Event (POINT_REDEEMED)                        |
|            │ 5. Evict Redis L2 Cache & Caffeine L1 Cache                    |
|            │                                                                |
|  [ Outbox Poller Worker ] ──(SKIP LOCKED)──> [ Kafka Topic: loyalty.events ]|
+────────────┬───────────────────────────────────────┬────────────────────────+
             │ Local DB Transaction (ACID)           │
             ▼                                       ▼
+──────────────────────────+             +───────────────────────+
| PostgreSQL 16 Database   |             | Redis Cluster         |
|  - t_members (TenantId)  |             |  - Distributed Locks  |
|  - t_transactions        |             |  - Member Balance L2  |
|  - t_outbox_events       |             |  - Idempotency Keys   |
+──────────────────────────+             +───────────────────────+
~~~

### 1.2. Các Ràng Buộc Bất Biến Doanh Nghiệp (Business Invariants)

1. **Cô lập Tenant Tuyệt đối (Zero Data Leak)**: Mọi truy vấn database đều bị Hibernate lọc ngầm qua <code>@TenantId</code>. Khóa cache Redis bắt buộc phải có tiền tố Tenant: <code>tenant:{tenantId}:member:{memberId}</code>.
2. **Tính Bất Biến Idempotency (Zero Double-Deduction)**: Client bắt buộc phải truyền header <code>Idempotency-Key: UUID</code>. Nếu gửi lại cùng 1 key, hệ thống trả về kết quả thành công của giao dịch trước đó mà không thực hiện trừ điểm lần 2.
3. **Transactional Outbox Guarantee**: Trừ điểm thành công thì Event Kafka **chắc chắn 100% phải được gửi** (At-least-once delivery). Nếu database commit mà Kafka broker bị sập, Outbox Poller sẽ tiếp tục retry cho đến khi thành công.

---

## 2. Production-Grade Implementation Code

Dưới đây là mã nguồn production hoàn chỉnh của toàn bộ lõi Mini-LaaS:

### 2.1. Domain Entities & Database Schema

Entity Hội viên với Multi-tenancy và Optimistic Lock:

~~~java
package com.enterprise.minilaas.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "t_loyalty_members", uniqueConstraints = {
        @UniqueConstraint(name = "uq_tenant_member_code", columnNames = {"tenant_id", "member_code"})
})
public class LoyaltyMemberEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 32)
    private String tenantId;

    @Column(name = "member_code", nullable = false, length = 64)
    private String memberCode;

    @Column(name = "full_name", nullable = false, length = 128)
    private String fullName;

    @Column(name = "point_balance", nullable = false)
    private BigDecimal pointBalance;

    @Column(name = "tier", nullable = false, length = 32)
    private String tier;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected LoyaltyMemberEntity() {}

    public LoyaltyMemberEntity(String id, String memberCode, String fullName, BigDecimal initialPoints, String tier) {
        this.id = id;
        this.memberCode = memberCode;
        this.fullName = fullName;
        this.pointBalance = initialPoints;
        this.tier = tier;
        this.updatedAt = Instant.now();
    }

    public void deductPoints(BigDecimal points) {
        if (points.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deduction points must be strictly positive!");
        }
        if (this.pointBalance.compareTo(points) < 0) {
            throw new InsufficientPointsException(String.format(
                    "Insufficient point balance! Current: %s, Requested: %s", this.pointBalance, points
            ));
        }
        this.pointBalance = this.pointBalance.subtract(points);
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public String getTenantId() { return tenantId; }
    public BigDecimal getPointBalance() { return pointBalance; }
    public String getTier() { return tier; }
}
~~~

Entity Giao dịch (Transaction) & Outbox Event:

~~~java
package com.enterprise.minilaas.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "t_loyalty_transactions")
public class LoyaltyTransactionEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 32)
    private String tenantId;

    @Column(name = "member_id", nullable = false, length = 64)
    private String memberId;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 128)
    private String idempotencyKey;

    @Column(name = "transaction_type", nullable = false, length = 32)
    private String transactionType; // EARN, REDEEM, ADJUST

    @Column(name = "points", nullable = false)
    private BigDecimal points;

    @Column(name = "reward_code", length = 64)
    private String rewardCode;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected LoyaltyTransactionEntity() {}

    public LoyaltyTransactionEntity(String id, String memberId, String idempotencyKey,
                                    String transactionType, BigDecimal points, String rewardCode) {
        this.id = id;
        this.memberId = memberId;
        this.idempotencyKey = idempotencyKey;
        this.transactionType = transactionType;
        this.points = points;
        this.rewardCode = rewardCode;
        this.status = "COMPLETED";
        this.createdAt = Instant.now();
    }

    public String getId() { return id; }
    public BigDecimal getPoints() { return points; }
    public String getStatus() { return status; }
}
~~~

Entity Outbox Event:

~~~java
package com.enterprise.minilaas.outbox;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "t_outbox_events")
public class OutboxEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "aggregate_type", nullable = false, length = 64)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false, length = 64)
    private String aggregateId;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "status", nullable = false, length = 32)
    private String status; // PENDING, PUBLISHED, FAILED

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected OutboxEventEntity() {}

    public OutboxEventEntity(String aggregateType, String aggregateId, String eventType, String payload) {
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.payload = payload;
        this.status = "PENDING";
        this.retryCount = 0;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public void markPublished() { this.status = "PUBLISHED"; }
    public void incrementRetry() { this.retryCount++; }
}
~~~

### 2.2. Lõi Nghiệp Vụ: Point Redemption Orchestrator

~~~java
package com.enterprise.minilaas.service;

import com.enterprise.minilaas.domain.*;
import com.enterprise.minilaas.outbox.OutboxEventEntity;
import com.enterprise.minilaas.outbox.OutboxJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public record RedeemRequest(String memberId, BigDecimal points, String rewardCode, String idempotencyKey) {}
public record RedeemResult(String transactionId, String memberId, BigDecimal remainingBalance, String status) {}

@Service
public class LoyaltyRedemptionService {

    private static final Logger log = LoggerFactory.getLogger(LoyaltyRedemptionService.class);

    private final LoyaltyMemberJpaRepository memberRepository;
    private final LoyaltyTransactionJpaRepository transactionRepository;
    private final OutboxJpaRepository outboxRepository;
    private final RedissonClient redissonClient;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public LoyaltyRedemptionService(LoyaltyMemberJpaRepository memberRepository,
                                    LoyaltyTransactionJpaRepository transactionRepository,
                                    OutboxJpaRepository outboxRepository,
                                    RedissonClient redissonClient,
                                    StringRedisTemplate redisTemplate,
                                    ObjectMapper objectMapper) {
        this.memberRepository = memberRepository;
        this.transactionRepository = transactionRepository;
        this.outboxRepository = outboxRepository;
        this.redissonClient = redissonClient;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    public RedeemResult executeRedemption(String tenantId, RedeemRequest request) {
        // 1. Kiểm tra Idempotency trước (Read-through)
        Optional<LoyaltyTransactionEntity> existingTx = transactionRepository.findByIdempotencyKey(request.idempotencyKey());
        if (existingTx.isPresent()) {
            log.warn("Idempotent hit: Transaction {} already processed!", existingTx.get().getId());
            LoyaltyMemberEntity member = memberRepository.findById(request.memberId()).orElseThrow();
            return new RedeemResult(existingTx.get().getId(), member.getId(), member.getPointBalance(), "ALREADY_PROCESSED");
        }

        // 2. Chiếm giữ Distributed Lock theo Member ID để chống race condition rút điểm đồng thời
        String lockKey = String.format("lock:tenant:%s:member:%s", tenantId, request.memberId());
        RLock lock = redissonClient.getLock(lockKey);

        try {
            boolean acquired = lock.tryLock(5, 10, TimeUnit.SECONDS);
            if (!acquired) {
                throw new IllegalStateException("System busy: Another transaction is being processed for this member!");
            }

            // 3. Thực thi Transactional Business Logic
            return executeTransactionInternal(tenantId, request);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Lock acquisition interrupted", e);
        } finally {
            if (lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }

    @Transactional
    protected RedeemResult executeTransactionInternal(String tenantId, RedeemRequest request) {
        // 3.1. Tìm hội viên
        LoyaltyMemberEntity member = memberRepository.findById(request.memberId())
                .orElseThrow(() -> new MemberNotFoundException("Member not found: " + request.memberId()));

        // 3.2. Trừ điểm (Kiểm tra Invariant + Bật Optimistic Lock qua @Version)
        member.deductPoints(request.points());
        memberRepository.save(member);

        // 3.3. Tạo bản ghi Giao dịch
        String transactionId = "TX-" + UUID.randomUUID().toString().substring(0, 8);
        LoyaltyTransactionEntity tx = new LoyaltyTransactionEntity(
                transactionId, member.getId(), request.idempotencyKey(),
                "REDEEM", request.points(), request.rewardCode()
        );
        transactionRepository.save(tx);

        // 3.4. Ghi Outbox Event trong CÙNG DATABASE TRANSACTION
        try {
            var eventPayload = new PointRedeemedDomainEvent(
                    transactionId, tenantId, member.getId(), request.points(), request.rewardCode(), Instant.now()
            );
            String jsonPayload = objectMapper.writeValueAsString(eventPayload);
            OutboxEventEntity outboxEvent = new OutboxEventEntity(
                    "MEMBER", member.getId(), "LOYALTY_POINT_REDEEMED", jsonPayload
            );
            outboxRepository.save(outboxEvent);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to serialize outbox event", ex);
        }

        // 3.5. Xóa Cache Balance (Cache Invalidation)
        String cacheKey = String.format("cache:tenant:%s:member:%s:balance", tenantId, member.getId());
        redisTemplate.delete(cacheKey);

        return new RedeemResult(transactionId, member.getId(), member.getPointBalance(), "SUCCESS");
    }

    public record PointRedeemedDomainEvent(
            String transactionId, String tenantId, String memberId,
            BigDecimal points, String rewardCode, Instant occurredAt
    ) {}
}
~~~

### 2.3. Outbox Publisher Worker với SKIP LOCKED

~~~java
package com.enterprise.minilaas.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class OutboxEventPublisherWorker {

    private static final Logger log = LoggerFactory.getLogger(OutboxEventPublisherWorker.class);
    private static final String TOPIC = "loyalty.events.v1";

    private final OutboxJpaRepository outboxRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public OutboxEventPublisherWorker(OutboxJpaRepository outboxRepository,
                                      KafkaTemplate<String, String> kafkaTemplate) {
        this.outboxRepository = outboxRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Scheduled(fixedDelay = 2000) // Chạy mỗi 2 giây
    @Transactional
    public void publishPendingOutboxEvents() {
        // Truy vấn 50 events đang PENDING sử dụng FOR UPDATE SKIP LOCKED
        List<OutboxEventEntity> pendingEvents = outboxRepository.findTop50PendingForUpdate();

        for (OutboxEventEntity event : pendingEvents) {
            try {
                log.info("Publishing outbox event #{} [type={}] to Kafka...", event.getId(), event.getEventType());
                
                // Gửi sang Kafka topic
                kafkaTemplate.send(TOPIC, event.getEventType(), event.getPayload()).get();

                // Đánh dấu hoàn tất
                event.markPublished();
                outboxRepository.save(event);
            } catch (Exception ex) {
                log.error("Failed to publish event #{}: {}", event.getId(), ex.getMessage());
                event.incrementRetry();
                outboxRepository.save(event);
            }
        }
    }
}
~~~

### 2.4. REST API Controller Đạt Chuẩn RFC 7807 & Keycloak Security

~~~java
package com.enterprise.minilaas.api;

import com.enterprise.minilaas.service.LoyaltyRedemptionService;
import com.enterprise.minilaas.service.RedeemRequest;
import com.enterprise.minilaas.service.RedeemResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/loyalty/members")
public class LoyaltyRedemptionController {

    private final LoyaltyRedemptionService redemptionService;

    public LoyaltyRedemptionController(LoyaltyRedemptionService redemptionService) {
        this.redemptionService = redemptionService;
    }

    public record RedeemApiPayload(
            @NotNull @DecimalMin("1.00") BigDecimal points,
            @NotBlank String rewardCode
    ) {}

    @PostMapping("/{memberId}/redeem")
    @PreAuthorize("hasAuthority('SCOPE_loyalty:redeem') or hasRole('LOYALTY_MEMBER')")
    public ResponseEntity<RedeemResult> redeemPoints(
            @PathVariable String memberId,
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @Valid @RequestBody RedeemApiPayload payload,
            @AuthenticationPrincipal Jwt jwt
    ) {
        // Trích xuất tenant_id từ JWT token an toàn
        String tenantId = jwt.getClaimAsString("tenant_id");
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = "DEFAULT_TENANT";
        }

        RedeemRequest request = new RedeemRequest(memberId, payload.points(), payload.rewardCode(), idempotencyKey);
        RedeemResult result = redemptionService.executeRedemption(tenantId, request);

        return ResponseEntity.ok(result);
    }
}
~~~

---

## 3. Kiểm thử, Metrics & Vận hành thực chiến

### 3.1. Kịch Bản Integration Test Toàn Diện Với Testcontainers

Kiểm thử tự động tính năng Idempotency và phòng chống trừ điểm âm trên môi trường Docker thật:

~~~java
package com.enterprise.minilaas;

import com.enterprise.minilaas.domain.LoyaltyMemberEntity;
import com.enterprise.minilaas.domain.LoyaltyMemberJpaRepository;
import com.enterprise.minilaas.service.LoyaltyRedemptionService;
import com.enterprise.minilaas.service.RedeemRequest;
import com.enterprise.minilaas.service.RedeemResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
public class LoyaltyRedemptionIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private LoyaltyRedemptionService redemptionService;

    @Autowired
    private LoyaltyMemberJpaRepository memberRepository;

    private String testMemberId;

    @BeforeEach
    void setupMember() {
        testMemberId = "MEM-" + UUID.randomUUID().toString().substring(0, 8);
        LoyaltyMemberEntity member = new LoyaltyMemberEntity(
                testMemberId, "CODE-99", "Nguyen Van A", new BigDecimal("500.00"), "GOLD"
        );
        memberRepository.save(member);
    }

    @Test
    @DisplayName("Idempotency: Gửi cùng 1 Idempotency-Key 2 lần thì chỉ trừ điểm 1 lần duy nhất")
    void testIdempotencyPreventsDoubleDeduction() {
        String idemKey = "IDEM-" + UUID.randomUUID();
        RedeemRequest request = new RedeemRequest(testMemberId, new BigDecimal("100.00"), "VOUCHER-50K", idemKey);

        // Lần 1: Thành công
        RedeemResult result1 = redemptionService.executeRedemption("tenant_alpha", request);
        assertThat(result1.status()).isEqualTo("SUCCESS");
        assertThat(result1.remainingBalance()).isEqualByComparingTo("400.00");

        // Lần 2: Gửi lại cùng Idempotency Key -> Hệ thống phát hiện hit và KHÔNG trừ thêm điểm!
        RedeemResult result2 = redemptionService.executeRedemption("tenant_alpha", request);
        assertThat(result2.status()).isEqualTo("ALREADY_PROCESSED");
        assertThat(result2.remainingBalance()).isEqualByComparingTo("400.00");

        // Xác minh trực tiếp trong Database: Số dư vẫn là 400.00, không bị tụt xuống 300.00!
        LoyaltyMemberEntity memberInDb = memberRepository.findById(testMemberId).orElseThrow();
        assertThat(memberInDb.getPointBalance()).isEqualByComparingTo("400.00");
    }
}
~~~

### 3.2. Gọi cURL Trực Tiếp Thử Nghiệm API

~~~bash
# 1. Gọi Đổi Quà với Idempotency Key
curl -i -X POST http://localhost:8080/api/v1/loyalty/members/MEM-12345/redeem   -H "Content-Type: application/json"   -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."   -H "Idempotency-Key: b39b97b0-8c29-4d83-9bc0-d227f29f1234"   -d '{"points": 100.00, "rewardCode": "VOUCHER_GRAB_50K"}'
~~~

Phản hồi thành công:
~~~json
{
  "transactionId": "TX-a89c1b22",
  "memberId": "MEM-12345",
  "remainingBalance": 400.00,
  "status": "SUCCESS"
}
~~~

Nếu số dư không đủ, Global Exception Handler trả về chuẩn **RFC 7807 ProblemDetail**:
~~~json
{
  "type": "https://errors.enterprise.com/insufficient-points",
  "title": "Insufficient Points",
  "status": 400,
  "detail": "Insufficient point balance! Current: 50.00, Requested: 100.00",
  "instance": "/api/v1/loyalty/members/MEM-12345/redeem",
  "timestamp": "2026-10-03T15:30:00Z"
}
~~~

---

## 4. Production Pitfalls & Post-Mortem

### 4.1. Sự cố 1: Rò rỉ Key Cache Giữa Các Tenant (Multi-Tenant Cache Pollution)

- **Bối cảnh**: Lập trình viên lưu cache số dư vào Redis bằng key đơn giản: <code>cache:member:123:balance</code>.
- **Thảm họa**: Tenant A có member ID <code>123</code>, Tenant B cũng có member ID <code>123</code> nhưng ở hai công ty hoàn toàn độc lập. Khi Tenant A nạp 1,000 điểm, member của Tenant B mở app lên cũng thấy số dư 1,000 điểm!
- **Giải pháp**: Luôn luôn đưa <code>tenantId</code> vào làm Namespace cấp 1 của mọi khóa cache Redis:
  <code>cache:tenant:{tenantId}:member:{memberId}:balance</code>.

### 4.2. Sự cố 2: Bảng Outbox Phình To Hàng Chục Triệu Dòng Gây Tắc Nghẽn Index

- **Bối cảnh**: Sau 6 tháng hoạt động, bảng <code>t_outbox_events</code> tích tụ 30 triệu bản ghi đã <code>PUBLISHED</code>. Câu lệnh quét <code>SELECT ... WHERE status = 'PENDING'</code> bị chậm do B-Tree index quá lớn.
- **Giải pháp**:
  1. Cấu hình **Partial Index** trong PostgreSQL:
     ~~~sql
     CREATE INDEX idx_outbox_pending ON t_outbox_events(id) WHERE status = 'PENDING';
     ~~~
     Index này chỉ chứa các bản ghi đang chờ xử lý (vài chục dòng), tốc độ quét chỉ mất **0.2ms**!
  2. Thiết lập Scheduled Job định kỳ xóa sạch các events <code>PUBLISHED</code> cũ hơn 7 ngày.

---

## 5. Hands-on Enterprise Challenge & Reference Solution

### Đề bài: Triển Khai Tính Năng Hoàn Điểm Bồi Hoàn (Reversal / Compensating Transaction)

Khi hệ thống Mini-LaaS đổi quà cho khách, voucher code được phát hành bởi hệ thống Đối tác (Partner API). 
Nếu Partner API trả về lỗi hoặc timeout, Mini-LaaS cần thực hiện **Giao dịch bồi hoàn (Compensating Transaction)**:
1. Tạo một phương thức <code>reverseRedemption(String transactionId, String reason)</code>.
2. Chuyển trạng thái giao dịch cũ từ <code>COMPLETED</code> sang <code>REVERSED</code>.
3. Cộng trả lại số điểm đã trừ vào tài khoản của Hội viên.
4. Ghi một Outbox Event mới mang tên <code>LOYALTY_POINT_REFUNDED</code> để hệ thống Notification gửi email/SMS xin lỗi và thông báo hoàn điểm cho khách hàng.

### Lời giải hoàn chỉnh (Reference Solution)

~~~java
package com.enterprise.minilaas.service;

import com.enterprise.minilaas.domain.*;
import com.enterprise.minilaas.outbox.OutboxEventEntity;
import com.enterprise.minilaas.outbox.OutboxJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
public class LoyaltyCompensationService {

    private static final Logger log = LoggerFactory.getLogger(LoyaltyCompensationService.class);

    private final LoyaltyTransactionJpaRepository transactionRepository;
    private final LoyaltyMemberJpaRepository memberRepository;
    private final OutboxJpaRepository outboxRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    public LoyaltyCompensationService(LoyaltyTransactionJpaRepository transactionRepository,
                                      LoyaltyMemberJpaRepository memberRepository,
                                      OutboxJpaRepository outboxRepository,
                                      StringRedisTemplate redisTemplate,
                                      ObjectMapper objectMapper) {
        this.transactionRepository = transactionRepository;
        this.memberRepository = memberRepository;
        this.outboxRepository = outboxRepository;
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void reverseRedemption(String transactionId, String reason) {
        log.warn("Initiating compensation reversal for transactionId={}, reason='{}'", transactionId, reason);

        // 1. Tìm giao dịch gốc
        LoyaltyTransactionEntity originalTx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));

        if ("REVERSED".equals(originalTx.getStatus())) {
            log.info("Transaction {} already reversed. No-op.", transactionId);
            return;
        }

        // 2. Tìm hội viên và hoàn lại điểm
        LoyaltyMemberEntity member = memberRepository.findById(originalTx.getMemberId())
                .orElseThrow(() -> new IllegalStateException("Member not found for transaction: " + transactionId));

        member.addPoints(originalTx.getPoints()); // Cộng ngược lại số điểm đã trừ
        memberRepository.save(member);

        // 3. Đánh dấu giao dịch đã bị Revert
        originalTx.markReversed(reason);
        transactionRepository.save(originalTx);

        // 4. Ghi Outbox Event hoàn điểm
        try {
            var refundEventPayload = Map.of(
                    "transactionId", transactionId,
                    "memberId", member.getId(),
                    "refundedPoints", originalTx.getPoints(),
                    "reason", reason,
                    "timestamp", Instant.now().toString()
            );
            String jsonPayload = objectMapper.writeValueAsString(refundEventPayload);
            OutboxEventEntity outboxEvent = new OutboxEventEntity(
                    "MEMBER", member.getId(), "LOYALTY_POINT_REFUNDED", jsonPayload
            );
            outboxRepository.save(outboxEvent);
        } catch (Exception ex) {
            throw new RuntimeException("Error writing refund outbox event", ex);
        }

        // 5. Evict Cache
        String cacheKey = String.format("cache:tenant:%s:member:%s:balance", originalTx.getTenantId(), member.getId());
        redisTemplate.delete(cacheKey);

        log.info("Reversal completed successfully! Points refunded: {}", originalTx.getPoints());
    }
}
~~~
`
    },
    {
    "id": "7-quiz",
    "type": "quiz",
    "title": "Quiz Module 7 — DevOps",
    "minutes": 10,
    "questions": [
        {
            "level": "easy",
            "scenario": "Docker build CI LAAS mất 8 phút mỗi commit. Copy pom.xml + copy src + mvn package trong 1 layer duy nhất — sửa 1 dòng code vẫn kéo lại 100MB dependency.",
            "q": "Kỹ thuật Docker rút ngắn build đó?",
            "options": [
                "Thêm .dockerignore — ít file hơn nhanh hơn",
                "Layered jar (-Djarmode=layertools extract) + COPY dependencies trước, app code sau: dependency ít đổi được cache, sửa code chỉ rebuild layer mỏng",
                "Tăng CPU cho Jenkins agent",
                "Bỏ stage test khỏi Dockerfile — test chạy ngoài"
            ],
            "answer": 1,
            "explain": "Docker cache theo layer. Dependency 100MB+ ít đổi → cache hit gần như luôn; code đổi mỗi commit → chỉ layer application (vài MB) rebuild. Build 8 phút xuống ~30s. Multi-stage JDK build/JRE chạy là kỹ thuật riêng làm image nhỏ.",
            "why": [
                "dockerignore giúp (nếu đang copy rác) nhưng dependency layer vẫn rebuild mỗi lần code đổi — không giải quyết root cause là thứ tự layer.",
                "✓ Đúng — tách cái ÍT ĐỔI ra layer dưới, cái HAY ĐỔI ra layer trên: nguyên lý cache mọi build tool (Docker layer, Maven repo, npm cache).",
                "Tăng CPU giảm 8 phút xuống 5 phút — trả tiền hạ tầng cho vấn đề cấu trúc. Layer cache đưa về dưới 1 phút.",
                "Bỏ test trong image build là chuẩn (test chạy stage trước pipeline) — nhưng câu hỏi là build Image stage, không phải bỏ test tổng thể. Không liên quan layer cache."
            ]
        },
        {
            "level": "medium",
            "scenario": "Deploy LAAS lúc 2h sáng: pod mới khởi động Spring context 40s, DB pool chưa sẵn sàng, LB gửi traffic vào → user ăn lỗi 502 trong nửa phút đầu sau mỗi deploy.",
            "q": "Cơ chế K8s đúng cho vấn đề này?",
            "options": [
                "Liveness probe fail → restart container sớm hơn",
                "Readiness probe: pod chưa sẵn sàng → bị tách khỏi Service endpoints — LB không gửi traffic cho tới khi app báo 'ready' (DB connected, warm-up xong)",
                "Tăng replica +1 khi deploy — pod cũ gánh traffic",
                "Rollback deploy nếu thấy lỗi"
            ],
            "answer": 1,
            "explain": "Readiness trả lời 'sẵn sàng nhận traffic chưa?' — fail → endpoint bị bỏ khỏi pool (pod vẫn sống). Liveness trả lời 'process còn thở?' — fail → RESTART. App 40s khởi động là bình thường, readiness gate traffic đến khi sẵn sàng: 502 biến mất.",
            "why": [
                "Restart khi app đang KHỞI ĐỘNG bình thường là hành vi phá hoại — pod không bao giờ kịp ready, CrashLoopBackOff. Liveness phải chỉ fail khi process thật sự hỏng.",
                "✓ Đúng — tách nghĩa 2 probe là kiến thức nền: readiness = traffic gate, liveness = restart trigger. Spring Boot management.endpoint.health.probes.+group readiness (include db) phản ánh đúng trạng thái.",
                "Rolling update + maxSurge mặc định đã giữ pod cũ trong lúc pod mới lên — nếu vẫn 502 nghĩa là readiness KHÔNG được cấu hình đúng, LB vẫn bắn vào pod chưa ready.",
                "Rollback là phản ứng, không phải giải pháp — deploy sau lại gặp y hệt. Fix phải ở tầng probe/traffic management."
            ]
        },
        {
            "level": "hard",
            "scenario": "Investigate sự cố LAAS: log CloudWatch tìm 'request của user X đi qua gateway → task-service → Kafka'. Log rải rác không nối được — log thiếu correlationId xuyên suốt.",
            "q": "Chuẩn thực hành logging đúng cho hệ thống phân tán?",
            "options": [
                "Tăng log level DEBUG toàn service — nhiều thông tin hơn",
                "CorrelationId filter (MDC): sinh cid per request, forward qua header X-Correlation-Id service kế tiếp, JSON structured log — lọc 1 cid ra toàn bộ hành trình request",
                "Log toàn bộ request/response body mọi service",
                "Dùng traceId của JDBC driver"
            ],
            "answer": 1,
            "explain": "MDC (Mapped Diagnostic Context) gắn cid vào mọi log line trong phạm vi request; header X-Correlation-Id truyền qua service chain; JSON encoder cho CloudWatch query được. Trace riêng của OpenTelemetry cũng dùng chung tinh thần — correlatable records.",
            "why": [
                "DEBUG toàn hệ = nhiễu trắng cô đặc, chi phí I/O log khổng lồ, và VẪN không nối được log service A với service B nếu không có cid. Volume không thay thế correlation.",
                "✓ Đúng — '1 cái tên duy nhất cho 1 hành trình request' là nền của debugging phân tán. Kèm luật: MDC.clear() trong finally (thread reuse!), và cid trả về response header cho support đối chiếu.",
                "Log body = PII leak (số tài khoản, token) + volume dữ liệu khổng lồ. Có cid + metadata chọn lọc là đủ điều tra, body chỉ log khi có governance riêng.",
                "JDBC không có traceId chuẩn xuyên suốt application flow — công cụ sai tầng cho bài toán cross-service correlation."
            ]
        },
        {
            "level": "medium",
            "scenario": "Grafana LAAS: dashboard chỉ có CPU/Memory của pod. Incident production: user phàn nàn chậm nhưng CPU/Mem đều 'bình thường' — không tìm được manh mối.",
            "q": "Bộ 4 metric đầu tiên của Spring Boot service nên là gì?",
            "options": [
                "CPU, Memory, Disk I/O, Network",
                "http_server_requests (p95 latency + error rate per endpoint), hikaricp pool usage, JVM heap/GC pause, custom business counter",
                "Số dòng log/giây, số connection Redis, số topic Kafka, số pod",
                "Database size, table count, index usage, slow query log"
            ],
            "answer": 1,
            "explain": "RED method + JVM + business: latency p95 và error rate per URI cho biết user đang đau ở đâu; HikariCP active/pending cho biết nghẽn DB; heap/GC cho biết pressure bộ nhớ; business counter (transactions/earn) cho thấy symptom nghiệp vụ. CPU/Mem là hệ quả, không phải triệu chứng.",
            "why": [
                "Infra metric cần nhưng không đủ — chính là dashboard hiện tại: 'bình thường' mà user chậm. Triệu chứng user-experienced nằm ở HTTP metric, không phải resource usage.",
                "✓ Đúng — từ trên xuống: user cảm nhận (HTTP) → dependency bottleneck (pool) → runtime (JVM) → business reality (counter). Mỗi tầng một câu hỏi điều tra.",
                "Hổn hợp không có narrative — đếm dòng log/giây không trả lời 'user nào chậm ở endpoint nào'. Metric phải gắn với hypothesis điều tra.",
                "DB internal metric quý nhưng là tầng sâu — nếu HTTP p95 ổn thì khỏi đào. Bắt đầu từ nơi user chạm."
            ]
        },
        {
            "level": "hard",
            "scenario": "p99 latency LAAS đột biến. Log mỗi service đều sạch. Trace OpenTelemetry cho thấy: gateway span 3s, task-service span 2.9s, trong đó span 'Kafka producer send' chiếm 2.8s.",
            "q": "Trace giàu thông tin hơn log/metric ở điểm nào?",
            "options": [
                "Trace log nhiều hơn — thay thế logging",
                "Trace gắn timing các span XUYÊN SUỐT service + dependency: thấy ngay 3s tổng được cấu thành từ đâu (2.8s Kafka) — causality chain mà log rời rạc không tái hiện được",
                "Trace tự sửa lỗi — APM có AI auto-remediation",
                "Trace rẻ hơn metric — nên dùng thay thế"
            ],
            "answer": 1,
            "explain": "3 trụ cột bổ sung nhau: log = event chi tiết, metric = aggregate theo thời gian, trace = causal journey. Nghẽn 2.8s ở Kafka send (broker đáp ứng chậm? acks=all + network?) hiện ra trong 1 cái nhìn — không phải grep log 3 service rồi tự ghép timeline.",
            "why": [
                "Trace KHÔNG thay logging — trace không chứa business context chi tiết (stack trace, input). Ba trụ cột là squad: metric phát hiện CÓ vấn đề, trace chỉ ra Ở ĐÂU, log giải thích TẠI SAO.",
                "✓ Đúng — span tree với duration từng node: parent-child (gateway → service → kafka send) là biểu đồ quan hệ nhân quả trực quan. OpenTelemetry java agent instrumentation tự động mọi client phổ biến.",
                "Không có AI auto-fix trong OTel — observability là đèn pin, con người vẫn lái. Auto-remediation là sản phẩm riêng (khác category).",
                "Trace đắt hơn metric (sampled, backend storage) — vì thế strategy: metric 100%, trace sample 1-10%. Dùng đúng vai trò, không thay thế lẫn nhau."
            ]
        },
        {
            "level": "medium",
            "scenario": "Dev LAAS giữ Dockerfile cũ chạy root 'vì tiện ghi log ra host volume'. Security audit bắt buộc USER non-root.",
            "q": "Vì sao non-root là baseline bắt buộc?",
            "options": [
                "Chỉ để đẹp report audit — thực tế không khác biệt",
                "Container bị compromise (RCE qua dependency lỗi) → attacker có quyền root TRONG container; kết hợp container-escape/misconfig (mount host path, privileged) → leo thang lên host. Non-root chặn nhảy leo thang này",
                "Non-root chạy nhanh hơn — ít overhead permission check",
                "Kubernetes yêu cầu bắt buộc Pod Security Standards"
            ],
            "answer": 1,
            "explain": "Defense in depth: container không phải VM — kernel chia sẻ host. Quyền root trong container + lỗ hổng escape (runc CVE-2019-5736-style) = root host. Chặn ở tầng quyền hạn là lớp rẻ nhất: USER appuser trong Dockerfile + readOnlyRootFilesystem + drop capabilities.",
            "why": [
                "'Bình thường mới' là lý do audit tồn tại — attacker không cần 0-day nếu app đã chạy root sẵn. Baseline rẻ áp dụng sớm quý hơn incident đắt xử lý muộn.",
                "✓ Đúng — mô hình tấn công cụ thể: RCE → shell trong container → nếu root: đọc secret mounted, tamper filesystem, thử escape. Non-root + read-only fs + minimal caps thu hẹp từng bước.",
                "Permission check overhead không đáng kể — không phải lý do. Lý do là security posture, không phải performance.",
                "PSS restricted KHUYẾN NGHỊ non-root nhưng không tự enforce trên cluster cũ — baseline phải nằm trong artifact (image), không trông chờ policy runtime."
            ]
        },
        {
            "level": "hard",
            "scenario": "Tuần trước LAAS deploy lúc 18h. AM nhận alert ngay 19h: lỗi 500 tăng vọt. Cuối cùng điều tra ra: dependency mới (log4j-style) có CVE critical — image được scan duy nhất 1 lần khi mới thêm.",
            "q": "Gap trong pipeline và giải pháp?",
            "options": [
                "Deploy ban ngày để phát hiện nhanh hơn",
                "Scan định kỳ image trong registry (Trivy) + dependency-check mỗi build + renovate/dependabot tự PR nâng cấp + alert CVE mới trên image đang chạy",
                "Cấm dependency mới — chỉ dùng thư viện đã approve",
                "Cài antivirus trên Jenkins agent"
            ],
            "answer": 1,
            "explain": "CVE xuất hiện SAU khi thư viện đã được duyệt — scan 1 lần lúc thêm là snapshot chết. Cần: scan mỗi build (bắt mới khi PR), scan registry định kỳ (bắt CVE mới công bố trên image đang tồn tại), auto-PR nâng cấp (giảm friction sửa), runtime alert. Security là luồng liên tục không phải cổng một lần.",
            "why": [
                "Deploy ban ngày giảm thời gian phát hiện 1-2h — không giải quyết việc CVE tồn tại trong artifact. Symptom mitigation.",
                "✓ Đúng — 4 lớp phủ vòng đời: build-time (PR), registry (image tồn tại), upgrade flow (dep bot), runtime (alert). CVE pipeline-style: thời điểm công bố ≠ thời điểm thêm dependency.",
                "Cấm dependency mới làm khô héo dev velocity và vẫn không bắt CVE trong thư viện CŨ — log4shell nằm trong dependency có sẵn từ lâu. Chính sách sai chiều vấn đề.",
                "AV quét file thực thi truyền thống — không hiểu dependency JAR/CVE database của hệ sinh thái Maven. Công cụ sai loại cho bài toán supply chain Java."
            ]
        },
        {
            "level": "easy",
            "scenario": "Nhân viên mới hỏi senior LAAS: 'Pod đang CrashLoopBackOff. Em restart cluster là xong chứ gì?'",
            "q": "Bước debug đúng đắn đầu tiên?",
            "options": [
                "Restart node — sách giáo khoa nói container tự heal",
                "kubectl describe pod (Events: OOMKilled? ImagePullBackOff? Probe fail?) + kubectl logs --previous (log lần crash trước) — chẩn đoán trước, hành động sau",
                "Tăng memory limit ngay — crash thường là hết bộ nhớ",
                "Rollback image trước rồi tìm hiểu sau"
            ],
            "answer": 1,
            "explain": "CrashLoopBackOff là container crash lặp — RESTART ĐÃ diễn ra tự động và thất bại. describe cho biết lý do hạ tầng (OOM, image, probe), logs --previous cho biết exception application. Chẩn đoán 2 phút định hướng đúng: OOM → tăng limit/fix leak; probe fail → sửa probe; app exception → fix code.",
            "why": [
                "Container đã tự restart nhiều lần (đó là ý nghĩa CrashLoopBackOff) — restart node khi root cause là app exception chỉ reset vòng lặp. May mắn không phải chiến lược.",
                "✓ Đúng — kỷ luật điều tra: sự kiện hạ tầng (describe) + bằng chứng application (logs previous). 2 lệnh này phân loại được 90% trường hợp trước khi chạm bất cứ thứ gì.",
                "Tăng memory 'chắc ăn' là đốt symptom — nếu thực ra là NPE loop thì tăng memory không sửa gì mà che tín hiệu. Chỉ tăng khi OOMKilled được xác nhận.",
                "Rollback an toàn cho user (đúng khi urgent) nhưng phải kèm điều tra root cause — không phải 'rollback xong việc'. Câu hỏi hỏi bước ĐẦU TIÊN điều tra: hiểu trước."
            ]
        },
        {
            "level": "medium",
            "scenario": "Load test k6: 500 RPS đạt p99 600ms — mọi thresholds xanh, team chốt go-live. Đêm đầu production: 400 RPS thực tế nhưng p99 8s, error 5%. Giám sát cho thấy Hikari pool 50/50 active và hàng chục request chờ connection.",
            "q": "Bài học load test nào bị bỏ sót?",
            "options": [
                "Thiếu test 500 RPS — cần tăng tải test lên 1000 RPS cho chắc",
                "Chỉ test điểm ĐẠT, không tìm KNEE: pool 50 cạn ở đâu đó giữa 400-500 RPS тест đã dùng dataset nhỏ hơn nên lock ít hơn. Phải ramp vượt tải, corr pool/GC/CPU — và đối chiếu Little's Law: in-flight = RPS × latency vs pool size",
                "k6 không đủ tin cậy — đổi sang JMeter sẽ ra số đúng",
                "Production yếu hơn SIT — nâng CPU pod lên là xong"
            ],
            "answer": 1,
            "explain": "Threshold xanh ở MỘT điểm tải không nói gì về hành vi GẦN giới hạn. Pool 50 connection: 500 RPS × 0.5s = 250 in-flight trung bình ổn, nhưng p99 tail + dataset thật tăng thời gian giữ connection → 400 RPS thực đã bóp cạn pool. Vòng lặp đúng: ramp VƯỢT tải tìm knee, correlate với Grafana (pool active? GC pause? CPU throttle?), áp Little's Law đối chiếu in-flight với pool — thay vì chỉ chốt 'điểm xanh' và rời đi.",
            "why": [
                "Tăng tải nhưng vẫn chỉ 1 điểm — không hiểu ĐỈNH sụp ở đâu và vì sao",
                "✓ Knee + Little's Law: dự đoán trước chỗ sụp bằng số, không đợi đêm go-live",
                "Công cụ không phải biến số — kịch bản + phân tích kết quả mới là",
                "Nâng CPU không giải pool cạn — giới hạn nằm ở connection config"
            ]
        },
        {
            "level": "hard",
            "scenario": "Sau khi nâng cấp Spring Boot lên 3.3 chạy trên Java 21 với Virtual Threads enabled, ứng dụng bị đóng băng (hang) khi nhận tải cao. Kiểm tra CPU chỉ ở mức 3%, nhưng hàng ngàn request bị timeout.",
            "q": "Nguyên nhân cốt lõi và cách phát hiện hiện tượng này?",
            "options": [
                "Virtual Threads bị hiện tượng Pinning do một thư viện hoặc code nội bộ sử dụng khối synchronized bọc quanh tác vụ I/O chặn; Carrier Thread bị ghim chặt và không thể phục vụ Virtual Threads khác. Phát hiện bằng cờ -Djdk.tracePinnedThreads=short",
                "Virtual Threads tiêu tốn quá nhiều RAM làm tràn bộ nhớ Heap của hệ điều hành",
                "Tomcat 10 không hỗ trợ Virtual Threads, cần chuyển sang dùng Jetty hoặc Undertow",
                "Cần tăng số lượng CPU cores của máy chủ vật lý lên tối thiểu 64 cores"
            ],
            "answer": 0,
            "explain": "Khi Virtual Thread thực thi trong khối synchronized hoặc gọi native JNI method mà gặp tác vụ I/O chặn (như Socket read hoặc DB query), JVM không thể tháo dỡ (unmount) luồng này ra khỏi Carrier Thread (ForkJoinPool worker). Khi toàn bộ Carrier Threads bị ghim (pinned), hệ thống bị cạn kiệt luồng thực thi (carrier thread starvation). Cờ -Djdk.tracePinnedThreads=short sẽ in chính xác dòng code gây pinning để refactor sang ReentrantLock.",
            "why": [
                "✓ Đúng — Pinning là cạm bẫy lớn nhất khi áp dụng Java 21 Virtual Threads. Bắt buộc phải thay synchronized bằng ReentrantLock ở các vùng I/O.",
                "Virtual Thread cực kỳ nhẹ (chỉ vài trăm bytes), không thể làm tràn RAM so với Platform Thread 1MB.",
                "Spring Boot 3.2+ và Tomcat 10 tích hợp Virtual Threads native 100% qua spring.threads.virtual.enabled=true.",
                "Tăng CPU cores không giải quyết được vấn đề mã nguồn nếu mọi luồng đều bị ghim bởi synchronized I/O."
            ]
        },
        {
            "level": "hard",
            "scenario": "Container Spring Boot được cấp giới hạn bộ nhớ mem_limit: 1024M trong Docker Compose. Lập trình viên cấu hình cờ JVM: -Xmx1024m. Sau khi chạy vài giờ với tải trung bình, container đột ngột bị sập với Exit Code 137 mà không hề có OutOfMemoryError trong file log.",
            "q": "Tại sao container bị sập và cấu hình JVM chuẩn để khắc phục triệt để?",
            "options": [
                "Exit Code 137 do Linux OOM-Killer gửi SIGKILL vì tổng bộ nhớ tiến trình (Heap 1024MB + Metaspace + Netty Direct Memory + Thread Stacks) vượt quá giới hạn 1024MB của container. Khắc phục: Dùng -XX:MaxRAMPercentage=75.0 để Heap chỉ chiếm 75% RAM container",
                "Do ứng dụng bị lỗi đứt cáp mạng TCP giữa Docker và host",
                "Do Spring Boot không tương thích với Java 21 trên hệ điều hành Linux",
                "Cần tăng tham số -Xmx lên 2048m để JVM có thêm không gian hoạt động"
            ],
            "answer": 0,
            "explain": "Tổng bộ nhớ RSS mà Java tiến trình chiếm dụng bao gồm cả Heap và Off-Heap (Metaspace, Direct ByteBuffers, Thread Stacks, GC structures). Cấu hình -Xmx1024m làm riêng Heap đã chiếm trọn 1024MB, khi Off-Heap phát sinh thêm 200MB, Linux cgroups lập tức gửi SIGKILL (128 + 9 = 137). Cấu hình chuẩn là -XX:MaxRAMPercentage=75.0 để JVM tự động tính toán trần Heap an toàn.",
            "why": [
                "✓ Đúng — Bẫy kinh điển của container hóa Java. -XX:MaxRAMPercentage là cờ container-aware chuẩn của OpenJDK.",
                "Lỗi mạng không bao giờ làm container kết thúc với Exit Code 137 (SIGKILL).",
                "Spring Boot 3 và Java 21 là chuẩn LTS hiện đại nhất.",
                "Tăng -Xmx2048m trên container 1024M chỉ làm container bị OOM-Killer giết nhanh hơn gấp bội!"
            ]
        },
        {
            "level": "hard",
            "scenario": "Đội phát triển thêm metric tùy biến vào Micrometer: meterRegistry.counter(\"http_requests_total\", \"user_id\", userId). Sau 2 ngày chạy production, cụm Prometheus server bị crash liên tục vì cạn kiệt 64GB RAM.",
            "q": "Hiện tượng này tên là gì và nguyên tắc thiết kế metric chuẩn?",
            "options": [
                "Hiện tượng High-Cardinality: user_id có hàng triệu giá trị phân biệt làm Prometheus phải sinh ra hàng triệu Time Series riêng biệt trong RAM. Nguyên tắc: Metrics chỉ chứa tags có cardinality thấp (status, method); user_id phải để trong Logs (MDC) hoặc Tracing",
                "Do Prometheus client trong Spring Boot bị memory leak",
                "Do cổng /actuator/prometheus bị cào quá nhiều lần trong 1 giây",
                "Cần chuyển sang dùng Graphite thay thế Prometheus"
            ],
            "answer": 0,
            "explain": "Mỗi tổ hợp cặp key-value duy nhất của tag/label tạo thành một Time Series riêng trong cơ sở dữ liệu thời gian của Prometheus. Với 1 triệu users, số lượng Time Series bùng nổ (High Cardinality Explosion) làm cạn kiệt RAM Prometheus. Dữ liệu định danh duy nhất (UUID, ID người dùng, Order ID) thuộc về Logs và Traces, tuyệt đối không được đưa vào Metrics tags.",
            "why": [
                "✓ Đúng — High Cardinality là nguyên nhân số 1 làm sập hệ thống giám sát Prometheus. Tag phải luôn có miền giá trị hữu hạn nhỏ.",
                "Không phải lỗi của client library mà do thiết kế data model sai lầm của kỹ sư.",
                "Tần số scrape không làm tăng số lượng time series lưu trong RAM của Prometheus.",
                "Graphite hay bất kỳ TSDB nào khác cũng sẽ bị quá tải khi phải quản lý hàng triệu Time Series bùng nổ."
            ]
        }
    ]
}
  ]
});
