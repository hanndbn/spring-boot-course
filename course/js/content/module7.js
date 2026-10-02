/* MODULE 7 — DevOps & Observability */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 7,
  title: "DevOps & Observability",
  subtitle: "Docker, Jenkins, Metrics, Tracing",
  icon: "🚀",
  desc: "Ship lên production: Docker tối ưu, CI/CD Jenkins, Prometheus/Grafana, OpenTelemetry — stack AWS của bạn.",
  lessons: [
    {
      id: "7-1",
      type: "lesson",
      title: "Docker cho Spring Boot production",
      minutes: 45,
      content: `
## Từ "chạy trên máy tao" đến "chạy mọi nơi"

Container đóng gói app + JRE + config thành 1 đơn vị deploy được mọi nơi. Nhưng Dockerfile sai → image 1GB, build chậm, security hole. Bài này: làm ĐÚNG.

---

## 1. Dockerfile tối ưu — multi-stage + layered jar

~~~dockerfile
# ─── Stage 1: Build ───
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy pom trước → cache dependency layer (đổi code không download lại)
COPY pom.xml .
COPY src src

RUN ./mvnw -q package -DskipTests

# Tách layer jar (dependencies / spring-boot-loader / app)
RUN java -Djarmode=layertools -jar target/*.jar extract

# ─── Stage 2: Runtime ───
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy theo layer: dependency ít đổi → app đổi thường xuyên
COPY --from=build /app/dependencies/ ./
COPY --from=build /app/spring-boot-loader/ ./
COPY --from=build /app/snapshot-dependencies/ ./
COPY --from=build /app/application/ ./

# Chạy với user không phải root — security baseline
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
~~~

:::tip VÌ SAO LAYERED JAR?
Docker cache theo layer. Dependencies (100+MB) ít đổi — code đổi mỗi commit. Tách layer: sửa 1 dòng code → chỉ rebuild layer app (vài MB), không kéo lại cả dependency. Build CI từ 5 phút xuống 20 giây.
:::

Trong <code>pom.xml</code> bật layertools:

~~~xml
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <layers><enabled>true</enabled></layers>
    </configuration>
</plugin>
~~~

## 2. docker-compose — môi trường local đầy đủ

~~~yaml
services:
  app:
    build: .
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/taskdb
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: secret
      SPRING_DATA_REDIS_HOST: redis
      SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI: http://keycloak:8180/realms/demo
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_started }
      keycloak: { condition: service_started }

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: taskdb
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports: ["8180:8080"]

volumes:
  pgdata:
~~~

~~~bash
docker compose up -d            # cả hệ thống sống trong 1 lệnh
docker compose logs -f app      # xem log app
~~~

:::info SERVICE DISCOVERY TRONG COMPOSE
Các service gọi nhau bằng **tên service** (<code>db</code>, <code>redis</code>, <code>keycloak</code>) — Docker network tự resolve. Đó chính là mini version của service discovery trong K8s.
:::

## 3. Config theo 12-factor — env vars

~~~yaml
spring:
  datasource:
    url: \${DB_URL:jdbc:postgresql://localhost:5432/taskdb}   # có default
    password: \${DB_PASSWORD}                                  # bắt buộc từ env
~~~

Mọi thứ thay đổi theo môi trường → env vars. Image build 1 lần, chạy mọi môi trường (dev/sit/uat/prod) chỉ đổi env.

## 4. Liveness & Readiness probes

~~~yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
      group:
        readiness:
          include: readinessState,db          # DB up + app sẵn sàng
        liveness:
          include: livenessState              # process sống (không restart oan)
~~~

~~~text
Liveness  = "process còn thở không?" → fail = restart container
Readiness = "sẵn sàng nhận traffic chưa?" → fail = bỏ khỏi load balancer
~~~

App đang khởi động (Spring context đang nạp) → readiness fail → LB không gửi traffic → không có lỗi 50x cho user.

## 5. Tối ưu JVM trong container

~~~dockerfile
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
~~~

<code>MaxRAMPercentage</code> thay cho <code>-Xmx</code> cứng — container limit 1GB thì JVM tự lấy 750MB, không cần sửa Dockerfile khi scale.

:::laas ĐỐI CHIẾU LAAS
Bạn từng build Keycloak production image từ branch sit-0.02 qua Jenkins: multi-stage, tag version, export deliver. Toàn bộ kỹ thuật ở bài này chính là "đằng sau" pipeline đó — giờ bạn tự xây được cho service Spring Boot của mình.
:::

:::takeaways
- Multi-stage build: stage build (JDK) + stage runtime (JRE) — image nhỏ
- Layered jar: dependency layer cache — build cực nhanh
- USER non-root — security baseline bắt buộc
- Env vars cho mọi config môi trường — build once, run anywhere
- Liveness/readiness probes: restart vs bỏ traffic — 2 thứ khác nhau
:::
`
    },
    {
      id: "7-2",
      type: "lesson",
      title: "CI/CD với Jenkins & Observability",
      minutes: 50,
      content: `
## Pipeline tự động — từ commit đến deploy

Jenkins bạn đã dùng để deploy Keycloak. Bài này: viết pipeline chuẩn cho service Spring Boot + quan sát nó khi chạy production.

---

## 1. Jenkinsfile — declarative pipeline

~~~groovy
pipeline {
    agent any

    environment {
        REGISTRY = 'registry.addie.africa'
        IMAGE    = "\${REGISTRY}/laas/task-service"
        TAG      = "\${env.BUILD_NUMBER}-\${env.GIT_COMMIT?.take(7)}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test') {
            steps {
                sh './mvnw -B clean verify'    // unit + integration test
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'   // report test
                }
            }
        }

        stage('Static Analysis') {
            steps {
                sh './mvnw -B checkstyle:check pmd:cpd'
                // hoặc SonarQube: withSonarQubeEnv() { sh './mvnw sonar:sonar' }
            }
        }

        stage('Build Image') {
            steps {
                sh "docker build -t \${IMAGE}:\${TAG} ."
            }
        }

        stage('Push Registry') {
            when { branch 'main' }              // chỉ main mới push
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'registry-creds',
                    usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh "echo $PASS | docker login $REGISTRY -u $USER --password-stdin"
                    sh "docker push \${IMAGE}:\${TAG}"
                    sh "docker tag \${IMAGE}:\${TAG} \${IMAGE}:latest && docker push \${IMAGE}:latest"
                }
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                input 'Deploy to SIT?'          // cần người bấm duyệt
                sh "oc rollout latest dc/task-service -n laas-sit"
                // hoặc kubectl set image deployment/task-service app=\${IMAGE}:\${TAG}
            }
        }
    }

    post {
        failure {
            slackSend channel: '#ci-alerts',
                     message: "❌ \${env.JOB_NAME} #\${env.BUILD_NUMBER} FAILED"
        }
        success {
            slackSend channel: '#ci-alerts',
                     message: "✅ \${IMAGE}:\${TAG} deployed"
        }
    }
}
~~~

### Các stage chuẩn của production pipeline

~~~text
Checkout → Build → Test → Static Analysis → Security Scan
        → Build Image → Push Registry → (Duyệt) → Deploy → Smoke test
~~~

Security scan: Trivy (image vulnerabilities), OWASP dependency-check (CVE trong thư viện).

## 2. Observability — 3 trụ cột

| Trụ cột | Trả lời | Công cụ |
|---|---|---|
| **Logging** | Chuyện gì đã xảy ra? | Logback JSON → CloudWatch |
| **Metrics** | Hệ thống khỏe không? | Micrometer → Prometheus/Grafana |
| **Tracing** | Request đi qua đâu, nghẽn ở đâu? | OpenTelemetry → Jaeger |

## 3. Structured logging + correlation ID

~~~xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>8.0</version>
</dependency>
~~~

~~~xml
<!-- logback-spring.xml: JSON ra stdout — CloudWatch/ELK parse được -->
<configuration>
    <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <includeMdcKeyName>correlationId</includeMdcKeyName>
            <includeMdcKeyName>tenantId</includeMdcKeyName>
        </encoder>
    </appender>
    <root level="INFO"><appender-ref ref="JSON"/></root>
</configuration>
~~~

Filter tự sinh correlationId per request:

~~~java
@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {
        String cid = Optional.ofNullable(req.getHeader("X-Correlation-Id"))
            .orElseGet(() -> UUID.randomUUID().toString());
        MDC.put("correlationId", cid);              // mọi log có cid
        res.setHeader("X-Correlation-Id", cid);     // trả lại client
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();                            // thread pool reuse!
        }
    }
}
~~~

:::tip MDC VÀ THREAD POOL
Thread bị tái sử dụng — nếu không clear() ở finally, request sau có thể inherit cid của request trước → log bị "nhiễu tần số". Luôn clear.
:::

## 4. Micrometer + Prometheus + Grafana

~~~xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
~~~

~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: health,prometheus
  metrics:
    tags:
      application: task-service       # label mọi metric
~~~

<code>/actuator/prometheus</code> giờ export metric chuẩn Prometheus:

~~~text
http_server_requests_seconds_count{uri="/api/v1/tasks",status="200"} 15432
http_server_requests_seconds_sum{uri="/api/v1/tasks"} 452.1
jvm_memory_used_bytes{area="heap"} 412354560
hikaricp_connections_active 5
~~~

Custom business metric:

~~~java
@Service
public class TaskService {
    private final Counter tasksCreated;

    public TaskService(MeterRegistry registry) {
        this.tasksCreated = Counter.builder("tasks_created_total")
            .description("Tổng task đã tạo")
            .register(registry);
    }

    public TaskDto create(...) {
        ...
        tasksCreated.increment();
    }
}
~~~

Grafana dashboard: p95 latency per endpoint, error rate, HikariCP pool usage, JVM heap — 4 chart đầu tiên nên có.

## 5. Distributed Tracing — OpenTelemetry

~~~xml
<dependency>
    <groupId>io.opentelemetry.javaagent</groupId>
    <artifactId>opentelemetry-javaagent</artifactId>
    <version>2.10.0</version>
</dependency>
~~~

Chỉ cần attach java agent (không sửa code!):

~~~dockerfile
COPY --from=build /otel/opentelemetry-javaagent.jar /otel.jar
ENV JAVA_TOOL_OPTIONS="-javaagent:/otel.jar"
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
ENV OTEL_SERVICE_NAME=task-service
ENV OTEL_TRACES_EXPORTER=otlp
~~~

Trace hiện trạng request xuyên suốt: gateway → task-service → DB query → Kafka publish — mỗi span timing rõ ràng. Nghẽn ở đâu thấy ngay.

:::laas ĐỐI CHIẾU LAAS
LAAS dùng OpenTelemetry (bạn từng audit). Khi bạn debug "platform-service không start" qua CloudWatch: JSON log + correlationId giúp lọc đúng request; metric HikariCP_heap giúp đoán OOM; trace span cho thấy nghẽn ở dependency nào — 3 trụ cột quan sát là "đèn pin" của SRE.
:::

## 6. Runbook mini — debug service không start trên production

~~~text
1. kubectl get pods — pod Restarting/CrashLoopBackOff?
2. kubectl describe pod <pod> — Events: OOMKilled? ImagePullBackOff?
3. kubectl logs <pod> --previous — log lần crash trước
4. CloudWatch: filter app + ERROR level, xem 50 dòng đầu
5. Check env vars: DB_URL đúng chưa? issuer-uri Keycloak resolve được?
6. Check probes: readiness fail do DB chưa ready?
7. Check resource: memory limit vs JVM MaxRAMPercentage
~~~

:::takeaways
- Jenkinsfile declarative: stages Build→Test→Scan→Image→Deploy + post notify
- Structured JSON logging + correlationId (MDC + clear trong finally)
- Micrometer expose /actuator/prometheus; Grafana: latency/error/pool/heap
- OpenTelemetry java agent: tracing không sửa code
- Runbook: pod events → logs previous → env → probes → resources
:::
`
    },
    {
      id: "7-3",
      type: "lesson",
      title: "Actuator & Health Groups — health endpoint production-grade",
      minutes: 40,
      content: `
## /health 200 nhưng service thực ra đã chết

Liveness trả UP, readiness trả UP — nhưng Kafka consumer lag 50k, Redis timeout, pool DB cạn. Health đơn lẻ không phản ánh "khả năng phục vụ". Health groups: tách readiness/liveness theo từng dependency, cảnh báo đúng layer.
---

## 1. Health groups — cấu hình chuẩn

~~~yaml
management:
  endpoint:
    health:
      probes:
        enabled: true
      group:
        readiness:
          include: readinessState, db, kafka, redis
        liveness:
          include: livenessState
        slow:
          include: db, kafka
          show-details: always
~~~

~~~text
GET /actuator/health/liveness   → {"status":"UP"} — pod còn sống không (restart khi DOWN)
GET /actuator/health/readiness  → {"status":"UP"} — pod sẵn sàng nhận traffic không (out-of-rotation khi DOWN)
GET /actuator/health/slow       → chi tiết db, kafka — debug không chặn traffic
~~~

:::warn LIVENESS ≠ READINESS
Liveness DOWN → K8s restart pod. Readiness DOWN → K8s ngừng route traffic nhưng KHÔNG restart. Liveness chỉ phản ánh "process còn chạy" — không check dependency (DB down không nên restart pod, DB sẽ lại up và pod mới cũng vẫn chết tương tự — restart vòng lặp). Readiness mới check dependency phục vụ request.
:::

## 2. Custom HealthIndicator — nghiệp vụ-specific

~~~java
@Component
public class OutboxLagHealthIndicator implements HealthIndicator {

    private final OutboxRepository outboxRepo;

    @Override
    public Health health() {
        long pending = outboxRepo.countByPublishedFalse();
        long oldestAgeMinutes = outboxRepo.findOldestPendingAgeInMinutes();

        if (oldestAgeMinutes > 30) {
            return Health.down()
                .withDetail("pendingCount", pending)
                .withDetail("oldestPendingMinutes", oldestAgeMinutes)
                .build();
        }
        return Health.up()
            .withDetail("pendingCount", pending)
            .withDetail("oldestPendingMinutes", oldestAgeMinutes)
            .build();
    }
}
~~~

Outbox worker chết 30 phút → readiness DOWN → traffic rời pod (KHÔNG restart — process sống). Ops thấy alert + Grafana → investigate worker thay vì blind restart.

## 3. Info endpoint & build metadata

~~~yaml
management:
  info:
    build:
      enabled: true
    env:
      enabled: true
    git:
      enabled: true
info:
  app:
    name: loyalty-service
    description: Loyalty engine cho LAAS platform
~~~

~~~text
GET /actuator/info
{
  "app": {...},
  "build": { "version": "1.4.2", "artifact": "loyalty-service" },
  "git": { "commit": "a3f8...", "branch": "sit-0.02", "time": "2026-10-01T..." }
}
~~~

Pod đang chạy version nào, commit nào — info endpoint trả lời ngay, không cần hỏi Jenkins.

## 4. Metric tagging — dimension cho Grafana

~~~java
@Bean
public MeterBinder outboxMetrics(OutboxRepository repo) {
    return registry -> Gauge.builder("outbox.pending", repo, OutboxRepository::countByPublishedFalse)
        .tag("service", "loyalty")
        .tag("env", "sit")
        .strongReference(true)
        .register(registry);
}
~~~

Metric không tag = vô dụng ở Grafana: 5 service cùng vẽ 1 đường line không phân biệt. Tag service + env + tenant là tối thiểu.

## 5. MeterRegistry custom — Prometheus format

~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    tags:
      application: \${spring.application.name}
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.95, 0.99
~~~

percentiles-histogram cho http.server.requests: p50/p95/p99 latency — 3 con số SRE nhìn đầu tiên mỗi sáng. Publisher cấu hình tự thêm tag application — mọi metric của loyalty-service mang label đó trong Prometheus.

:::laas LAAS dùng health groups tách readiness (db, kafka, redis) khỏi liveness (chỉ process). Outbox lag indicator custom — worker chết 30m readiness DOWN, traffic rời, alert #laas-ops. Đối chiếu điều bạn từng audit: OpenTelemetry + Prometheus + Grafana stack, health group là phần "SRE nhìn biết ngay service nào đang painful".
:::

:::takeaways
- Liveness = process sống (restart khi DOWN); readiness = sẵn sàng phục vụ (drain traffic)
- Health groups: tách nhóm dependency, không trộn liveness với dependency check
- Custom HealthIndicator cho nghiệp vụ: outbox lag, queue depth, pool saturation
- /actuator/info: version + git commit — biết pod chạy gì không cần hỏi CI
- Metric phải tag (service, env) — không tag thì Grafana không phân biệt
- p95/p99 http.server.requests là 3 con số vàng observability
:::
`
    },
    {
      id: "7-4",
      type: "lesson",
      title: "JVM & Performance Tuning — Spring Boot 3.4 + Java 21",
      minutes: 50,
      content: `
## Latency p99 4s, CPU 90%, GC pause 800ms — bắt đầu từ đâu?

Performance tuning không phải "max optimization" — là đo trước, tune đúng chỗ. Bài này: workflow đo lường → các layer tune (JVM, pool, connection) → JDK 21 virtual threads.
---

## 1. Workflow: ĐO → PHÂN TÍCH → TUNE → ĐO LẠI

~~~text
1. Đo: Prometheus + Grafana (p95/p99, GC, pool, CPU, MEM)
2. Phân tích: đâu là bottleneck? (GC pause? DB pool await? lock contention?)
3. Tune 1 tham số duy nhất
4. Đo lại so sánh — không khác biệt → revert
~~~

Không có baseline thì mọi tuning là mù quáng. Thiết lập dashboard trước, giữ snapshot trước/sau.

## 2. JVM heap & container awareness

~~~dockerfile
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:MaxGCPauseMillis=200"
~~~

| Tham số | Ý nghĩa |
|---|---|
| <code>-XX:MaxRAMPercentage=75.0</code> | Heap = 75% memory limit container — không OOMKilled |
| <code>-XX:+UseG1GC</code> | G1 collector — cân bằng latency/throughput, default JDK 17+ |
| <code>-XX:MaxGCPauseMillis=200</code> | Mục tiêu pause — G1 tự co giãn young gen |

:::warn -XMX VÀ CONTAINER
-Xmx2g cứng: pod limit 2GiB → heap 2g + metaspace + thread stack + native = OOMKilled. MaxRAMPercentage để JVM tự tính từ cgroup limit — container-native, không hardcode.
:::

## 3. Connection pool — HikariCP

~~~yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 3000
      max-lifetime: 1800000        # 30 phút — ngắn hơn DB-side timeout
      leak-detection-threshold: 60000
~~~

| Tham số | Ý nghĩa |
|---|---|
| maximum-pool-size | 20 cho đa số service — pool to không nhanh hơn (DB chịu không nổi) |
| connection-timeout | 3s chờ connection — timeout nhanh fail nhanh |
| leak-detection-threshold | Log WARN khi connection giữ > 60s — bắt code quên close |

Pool size không phải "càng to càng tốt": pool 100 nhưng DB max_connections 50 → 50 connection chờ vĩnh viễn. Công thức: <code>pool = (core_count * 2) + effective_spindle_count</code> — thường 10-20.

## 4. Tomcat threads & virtual threads

~~~yaml
server:
  tomcat:
    threads:
      max: 200                    # platform threads mặc định
~~~

~~~properties
# Java 21 — virtual threads (JEP 444)
spring.threads.virtual.enabled=true
~~~

Virtual threads: request chờ I/O (DB, Kafka, HTTP) không chiếm OS thread — scheduler mount/unmount tự động. Service I/O-bound (đa số Spring Boot API) throughput tăng 2-5x, p99 giảm rõ. CPU-bound (report aggregation) không lợi.

| | Platform threads (max 200) | Virtual threads |
|---|---|---|
| Chi phí | 1MB stack/thread, OS scheduling | Vài KB, JVM scheduling |
| Giới hạn | 200 concurrent | Hàng triệu |
| I/O block | Thread ngủ — pool cạn | Unmount — thread khác chạy |
| CPU-bound | Tốt | Không lợi — scheduler overhead |
| Pinning (synchronized) | Không vấn đề | Pin platform thread — cảnh giác |

## 5. JVM flags chẩn đoán — đọc GC log

~~~dockerfile
ENV JAVA_OPTS="-Xlog:gc*:stdout:time,uptime,level,tags"
~~~

~~~text
[2026-10-02T06:30:15.123+0700][12.5s] GC(25) Pause Young (G1 Evacuation Pause) 23M->2M(512M) 5.2ms
[2026-10-02T06:30:18.456+0700][15.8s] GC(26) Pause Full (G1 Compaction Pause) 480M->210M(512M) 850ms
~~~

Pause Young 5ms bình thường; Pause Full 850ms là tín hiệu: heap quá nhỏ hoặc memory leak (module 7 bài 2 OOM flow). p99 latency spike khớp timestamp Full GC → đó chính là nguyên nhân.

## 6. JFR — Java Flight Recorder

~~~bash
# Bắt 60s JFR recording trên pod đang chạy
jcmd 1 JFR.start name=demo duration=60s filename=/tmp/recording.jfr

# Tải về phân tích trong IntelliJ / JDK Mission Control
kubectl cp laas-loyalty-abc123:/tmp/recording.jfr ./recording.jfr
~~~

JFR chi phí <1% overhead — để bật production thường trực. Recording chứa: allocation hot path, lock contention, I/O wait, CPU flame graph. "Tại sao p99 4s?" — JFR trả lời chính xác đến method.

:::laas LAAS pods chạy MaxRAMPercentage=75 + G1 + virtual threads enabled (Java 21). Outbox worker vẫn platform thread pool riêng — job CPU-bound với Kafka batch không hưởng lợi virtual. Đối chiếu quyết định từng lớp bạn từng audit: đây là workflow ĐO → TUNE → ĐO LẠI được áp dụng thực tế, không "đoán tham số".
:::

:::takeaways
- Tuning workflow: ĐO (dashboard baseline) → phân tích → tune 1 tham số → đo lại
- MaxRAMPercentage thay -Xmx cứng trong container — tránh OOMKilled
- HikariCP 10-20 đủ đa số service; leak-detection bắt code quên close
- Virtual threads: I/O-bound +2-5x throughput; CPU-bound không lợi; synchronized pin
- GC log: Full GC pause khớp p99 spike → heap/leak issue
- JFR overhead <1% — bật production, flame graph chỉ method-level bottleneck
:::
`
    },
    {
      id: "7-5",
      type: "lesson",
      title: "Load Testing — k6, Gatling, JMeter: số liệu trước khi khách cháy",
      minutes: 45,
      content: `
## Load test = 1 user curl thử — đến 2h sáng production cháy với 500 TPS

Mọi thứ nhanh với 1 user. Điều quyết định go-live là hành vi ở ĐỈNH tải: p99 có vượt SLA, DB connection pool có cạn, Redis có stampede, pod có OOM. Load test là đưa câu hỏi đó về máy của bạn — trước khi khách hàng trả lời bằng cách rời đi.
---

## 1. Ba câu hỏi load test trả lời (và SLA của chúng)

| Chỉ số | Ý nghĩa | SLA điển hình |
|---|---|---|
| Throughput (req/s) | Hệ xử lý được bao nhiêu | 500 RPS sustained |
| p50 / p95 / p99 latency | 50%/95%/99% request nhanh hơn con số này | p99 < 800ms |
| Error rate | % request thất bại | < 0.1% dưới tải mục tiêu |

Trung bình (mean) gần như vô nghĩa — 1 request 30s bỏ vào giỏ 999 request 100ms vẫn ra mean "ổn". p99 mới là con số khách hàng khó chịu nhất nói về bạn — và là con số SRE dashboard theo dõi.

## 2. Công cụ — k6, Gatling, JMeter

| | k6 | Gatling | JMeter |
|---|---|---|---|
| Ngôn ngữ kịch bản | JavaScript (ES6) | Scala/Java (DSL) | XML/GUI |
| Nên viết bằng | Code — review được, git được | Code | GUI — khó review |
| Resource để chạy | Rất nhẹ (Go) | Nhẹ (JVM) | Nặng (GUI, thread/mỗi user) |
| CI-friendly | Xuất sắc | Tốt | Trung bình |
| Reports | HTML + cloud (Grafana k6) | HTML đẹp sẵn | HTML cơ bản |
| Chọn khi | API testing, team JS | Team Scala, report đẹp | Kịch bản GUI/legacy |

Khuyến nghị mặc định: k6 — script JS version được như code thường, chạy nhẹ trong CI container, output Prometheus/Grafana trực tiếp.

## 3. k6 — script thực chiến

~~~javascript
// load-test/redeem.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const redeemLatency = new Trend('redeem_latency');
const redeemSuccess = new Rate('redeem_success');

export const options = {
  scenarios: {
    ramp_to_target: {
      executor: 'ramping-arrival-rate',   // targeting RPS, không phải VU
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { target: 100, duration: '2m' },   // warm up
        { target: 500, duration: '5m' },   // tải mục tiêu sustained
        { target: 700, duration: '3m' },   // VƯỢT tải — tìm điểm gãy
        { target: 0,   duration: '1m' },   // hạ nhiệt
      ],
    },
  },
  thresholds: {
    'redeem_latency': ['p(99)<800'],       // FAIL test nếu p99 > 800ms
    'redeem_success': ['rate>0.999'],      // FAIL nếu error > 0.1%
    'http_req_failed': ['rate<0.001'],
  },
};

export default function () {
  const cif = \`CIF-\${__ENV.TENANT}-\${(__VU * __ITER) % 100000}\`;
  const res = http.post(\`\${__ENV.BASE_URL}/api/v1/redeem\`,
    JSON.stringify({ cif, amount: 100 }),
    { headers: { 'Content-Type': 'application/json',
                 'Authorization': \`Bearer \${__ENV.TOKEN}\` } });

  redeemLatency.add(res.timings.duration);
  redeemSuccess.add(check(res, { 'status 2xx': r => r.status >= 200 && r.status < 300 }));
  sleep(0.2);   // think time — mô phỏng người, không phải bot
}
~~~

Chạy: k6 run -e BASE_URL=https://sit.internal -e TOKEN=xxx redeem.js — exit code khác 0 khi vượt threshold → CI chặn merge ngay.

## 4. Đọc kết quả — tìm điểm GÃY, không chỉ điểm ĐẠT

~~~text
RPS    p50    p95    p99    err%   | nhận xét
100    120ms  210ms  340ms  0.00   | baseline khỏe
500    145ms  290ms  610ms  0.00   | tải mục tiêu — ĐẠT SLA
620    210ms  850ms  1900ms 0.4    | ↑đột ngột — knee point gần đây
700    890ms  3400ms 7200ms 12.3   | SỤP: saturation — queue dồn, timeout dây chuyền
~~~

Hình dạng quan trọng hơn con số: latency tăng TUYẾN TÍNH với tải là bình thường; tăng VƯỢT CHUẨN (knee) là giới hạn thực — thường trùng pool cạn (Hikari 50 nối hết), thread pool đầy, hoặc GC chứng cư (bài 7-4 JVM). Vượt qua knee: mọi thứ đều chậm, không gì chết — chết dần — nhìn Grafana thấy ngay.

Công thức dùng khi tối ưu: Little's Law — concurrency = throughput × latency. 500 RPS × 0.5s = 250 request in-flight — số đó phải nhỏ hơn pool DB + thread pool, không thì knee nằm đúng ở đó.

## 5. Kịch bản phải GIỐNG production

| Sai thường gặp | Hệ quả |
|---|---|
| Test 1 endpoint lặp thuần | Cache hit 100% — production cache miss cháy khác hẳn |
| Dataset 10 user quay vòng | Dataset lớn mới lộ lock contention, N+1, partition skew |
| Không think time | Ổ đĩa/CPU throttle không đúng tỷ lệ thật |
| Token chuẩn bị trước 1000 cái | Token expire giữa test — error rate giả |
| Test window ngắn | GC tail, Kafka rebalance không kịp lộ |

Luồng dữ liệu test: sinh dataset thật (member, campaign, balance) qua seed script — chạy trong Testcontainers hoặc namespace SIT riêng — KHÔNG chạy load test lên dữ liệu production.

## 6. Vòng lặp tối ưu — đo lường, không đoán

~~~text
1. Baseline: chạy k6 với tải mục tiêu — ghi p99, err, RPS max
2. Tìm knee: ramp vượt tải — xác định điểm sụp + corr với Grafana
   (pool active? GC pause? pod CPU throttle?)
3. Tối ưu 1 thay đổi duy nhất (batch fetch, index, pool size, cache)
4. Re-run cùng script — so sánh cùng điều kiện
5. Lặp — và commit threshold vào CI chặn regression
~~~

Mỗi tối ưu phải đối chứng cùng kịch bản — "cảm giác nhanh hơn" không phải số liệu. Threshold commit cùng code: regression hiệu năng bị chặn như regression logic.

:::laas Trước go-live Mini-LaaS, kịch bản k6 đáng chạy: (1) redeem 500 RPS sustained — p99 < 800ms, route qua Keycloak token thật không cache; (2) dashboard admin truy vấn bảng tổng hợp 1000 req/lần load — đã projection (bài 6-12) hay còn JOIN nóng; (3) job batch 2h sáng chạy SONG SONG traffic đỉnh — tranh connection pool với API. Cả 3 chỉ số commit vào Jenkins pipeline như verification step — deploy khi vượt p99 là fail build, không đợi 2h sáng khách gọi.
:::

:::takeaways
- p99 là chỉ số khách hàng khó chịu nhất — mean che giấu đuôi dài, đừng báo cáo mean
- k6 mặc định: script JS trong git, threshold là code, exit code chặn CI
- Tìm KNEE (điểm gãy) quan trọng hơn điểm đạt — ở đó corr với pool/GC/CPU trên Grafana
- Little's Law: in-flight = RPS × latency — đối chiếu pool DB và thread trước khi tối ưu mù
- Dataset + think time + token fresh phải giống production — không thì test số đẹp lừa mình
- Tối ưu 1 thay đổi/lần chạy, đối chứng cùng kịch bản — commit threshold chặn regression vào CI
:::
`
    },
    {
      id: "7-6",
      type: "lesson",
      title: "Dự án tốt nghiệp: Mini-LaaS",
      minutes: 120,
      content: `
## Gom toàn bộ 8 module vào 1 hệ thống thật

Đây là bài tổng kết — bạn xây **Mini-LaaS**: loyalty service thu nhỏ mô phỏng bài toán LAAS thật (multi-tenant, event-driven, secured).

---

## 1. Yêu cầu chức năng

| # | Tính năng | Áp dụng module |
|---|---|---|
| 1 | CRUD loyalty member + earn/redeem points | M0-M3 |
| 2 | REST API đầy đủ validation + ProblemDetail + Swagger | M2 |
| 3 | Multi-tenant (discriminator column tenant_id) | M3 |
| 4 | Idempotency cho redeem (không trừ điểm 2 lần) | M3 |
| 5 | Security: Keycloak JWT + RBAC (ADMIN/OPERATOR) | M5 |
| 6 | Event TASK_CREATED → Kafka → notification consumer | M6 |
| 7 | Transactional outbox cho event publishing | M6 |
| 8 | Redis cache member balance | M6 |
| 9 | Test: unit + @WebMvcTest + Testcontainers, coverage > 70% | M4 |
| 10 | Docker compose full stack + Jenkinsfile + Prometheus/Grafana | M7 |

## 2. Kiến trúc target

~~~text
┌────────┐     ┌─────────────────────────────────────────┐
│ Admin  │────▶│  loyalty-service (Spring Boot)          │
│ SPA    │     │  ├─ REST API (validation, ProblemDetail) │
└────────┘     │  ├─ Keycloak resource server (JWT)       │
               │  ├─ JPA + Flyway + tenant discriminator  │
               │  ├─ Outbox → Kafka publisher worker      │
               │  └─ Redis cache balance                  │
               └───────┬──────────────────────────────────┘
                       │ outbox_events
                       ▼
               ┌───────────────┐
               │    Kafka      │
               └───────┬───────┘
                       │ consume
                       ▼
               ┌───────────────────┐   ┌──────────┐
               │notification-svc   │──▶│  Redis   │
               └───────────────────┘   └──────────┘

Infrastructure: PostgreSQL | Kafka | Redis | Keycloak | Prometheus | Grafana
~~~

## 3. Data model

~~~sql
-- V1__init.sql
CREATE TABLE tenants (
    id   VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE members (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   VARCHAR(20) NOT NULL REFERENCES tenants(id),
    cif         VARCHAR(50) NOT NULL,
    full_name   VARCHAR(120) NOT NULL,
    points      BIGINT NOT NULL DEFAULT 0 CHECK (points >= 0),
    version     BIGINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, cif)
);

CREATE TABLE point_transactions (
    id             BIGSERIAL PRIMARY KEY,
    tenant_id      VARCHAR(20) NOT NULL,
    member_id      BIGINT NOT NULL REFERENCES members(id),
    type           VARCHAR(10) NOT NULL,        -- EARN / REDEEM
    amount         BIGINT NOT NULL,
    idempotency_key VARCHAR(64) UNIQUE,         -- khóa chống trùng
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE outbox_events (
    id             UUID PRIMARY KEY,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id   VARCHAR(50) NOT NULL,
    event_type     VARCHAR(50) NOT NULL,
    payload        JSONB NOT NULL,
    created_at     TIMESTAMP DEFAULT now(),
    published      BOOLEAN DEFAULT false
);
~~~

## 4. Service chính — earn idempotent

~~~java
@Service
public class LoyaltyService {

    private final MemberRepository members;
    private final TransactionRepository transactions;
    private final OutboxRepository outbox;
    private final PointEventMapper eventMapper;

    @Transactional(rollbackFor = Exception.class)
    public PointTransactionDto earn(EarnCommand cmd) {
        // 1. Idempotency check
        var existing = transactions
            .findByIdempotencyKey(cmd.idempotencyKey());
        if (existing.isPresent())
            return eventMapper.toDto(existing.get());   // retry → cùng kết quả

        // 2. Business + optimistic lock
        Member member = members
            .findByTenantIdAndCif(cmd.tenantId(), cmd.cif())
            .orElseThrow(() -> new MemberNotFoundException(cmd.cif()));
        member.addPoints(cmd.amount());          // @Version bảo vệ concurrent

        // 3. Lưu transaction
        PointTransaction txn = transactions.save(
            new PointTransaction(cmd.tenantId(), member.getId(),
                "EARN", cmd.amount(), cmd.idempotencyKey()));

        // 4. Outbox — event atomic với business
        outbox.save(OutboxEvent.of("PointTransaction", txn.getId(),
            "POINTS_EARNED", eventMapper.toJson(txn)));

        return eventMapper.toDto(txn);
    }
}
~~~

## 5. Definition of Done — checklist

- [ ] docker compose up → toàn hệ thống sống + Flyway migrate
- [ ] Swagger UI hiển thị đầy đủ API + test được
- [ ] Không token → 401; token USER → 403 khi redeem; OPERATOR → 200
- [ ] Gọi earn 2 lần cùng idempotency key → 1 transaction duy nhất
- [ ] Kafka consumer nhận event (log ra + record DB)
- [ ] Kill notification-svc, earn vẫn thành công — outbox worker publish khi nó sống lại
- [ ] Redeem concurrent 2 request → 1 thành công, 1 nhận 409
- [ ] mvn verify: unit + IT pass, jacoco > 70% service layer
- [ ] Grafana dashboard: latency + error rate + HikariCP
- [ ] Jenkinsfile build image + push registry

## 6. Gợi ý trình tự xây (2 tuần)

| Ngày | Việc |
|---|---|
| 1-2 | Init project, schema Flyway, entity + repo |
| 3-4 | REST API earn/redeem + validation + ProblemDetail |
| 5 | Keycloak realm setup + resource server |
| 6 | Idempotency + optimistic locking + test concurrent |
| 7 | Outbox + Kafka producer/consumer |
| 8 | Redis cache + evict |
| 9-10 | Testcontainers IT + JaCoCo |
| 11 | Dockerfile + compose toàn stack |
| 12 | Prometheus + Grafana + correlationId |
| 13 | Jenkinsfile + documentation |
| 14 | Demo + record video walkthrough |

## 7. Sau khi hoàn thành

Bạn đã chạm **mọi keyword** của LAAS: multi-tenant, idempotency, outbox, JWT/Keycloak, Kafka, Redis, observability, CI/CD. Đem project này vào CV + đối chiếu trực tiếp với codebase công ty — bạn không còn là "người mới" ở đó nữa.

:::takeaways
- Mini-LaaS = phòng thí nghiệm cho toàn bộ 8 module
- Trình tự: data → API → security → reliability (idempotency/outbox) → test → ops
- Definition of Done đo được — không "hoàn thành theo cảm tính"
- Đây là portfolio sẵn sàng phỏng vấn mid-level Spring Boot
:::
`
    },
    {
      id: "7-quiz",
      type: "quiz",
      title: "Quiz Module 7 — DevOps",
      minutes: 10,
      questions: [
        {
          level: "easy",
          scenario: "Docker build CI LAAS mất 8 phút mỗi commit. Copy pom.xml + copy src + mvn package trong 1 layer duy nhất — sửa 1 dòng code vẫn kéo lại 100MB dependency.",
          q: "Kỹ thuật Docker rút ngắn build đó?",
          options: [
            "Thêm .dockerignore — ít file hơn nhanh hơn",
            "Layered jar (-Djarmode=layertools extract) + COPY dependencies trước, app code sau: dependency ít đổi được cache, sửa code chỉ rebuild layer mỏng",
            "Tăng CPU cho Jenkins agent",
            "Bỏ stage test khỏi Dockerfile — test chạy ngoài"
          ],
          answer: 1,
          explain: "Docker cache theo layer. Dependency 100MB+ ít đổi → cache hit gần như luôn; code đổi mỗi commit → chỉ layer application (vài MB) rebuild. Build 8 phút xuống ~30s. Multi-stage JDK build/JRE chạy là kỹ thuật riêng làm image nhỏ.",
          why: [
            "dockerignore giúp (nếu đang copy rác) nhưng dependency layer vẫn rebuild mỗi lần code đổi — không giải quyết root cause là thứ tự layer.",
            "✓ Đúng — tách cái ÍT ĐỔI ra layer dưới, cái HAY ĐỔI ra layer trên: nguyên lý cache mọi build tool (Docker layer, Maven repo, npm cache).",
            "Tăng CPU giảm 8 phút xuống 5 phút — trả tiền hạ tầng cho vấn đề cấu trúc. Layer cache đưa về dưới 1 phút.",
            "Bỏ test trong image build là chuẩn (test chạy stage trước pipeline) — nhưng câu hỏi là build Image stage, không phải bỏ test tổng thể. Không liên quan layer cache."
          ]
        },
        {
          level: "medium",
          scenario: "Deploy LAAS lúc 2h sáng: pod mới khởi động Spring context 40s, DB pool chưa sẵn sàng, LB gửi traffic vào → user ăn lỗi 502 trong nửa phút đầu sau mỗi deploy.",
          q: "Cơ chế K8s đúng cho vấn đề này?",
          options: [
            "Liveness probe fail → restart container sớm hơn",
            "Readiness probe: pod chưa sẵn sàng → bị tách khỏi Service endpoints — LB không gửi traffic cho tới khi app báo 'ready' (DB connected, warm-up xong)",
            "Tăng replica +1 khi deploy — pod cũ gánh traffic",
            "Rollback deploy nếu thấy lỗi"
          ],
          answer: 1,
          explain: "Readiness trả lời 'sẵn sàng nhận traffic chưa?' — fail → endpoint bị bỏ khỏi pool (pod vẫn sống). Liveness trả lời 'process còn thở?' — fail → RESTART. App 40s khởi động là bình thường, readiness gate traffic đến khi sẵn sàng: 502 biến mất.",
          why: [
            "Restart khi app đang KHỞI ĐỘNG bình thường là hành vi phá hoại — pod không bao giờ kịp ready, CrashLoopBackOff. Liveness phải chỉ fail khi process thật sự hỏng.",
            "✓ Đúng — tách nghĩa 2 probe là kiến thức nền: readiness = traffic gate, liveness = restart trigger. Spring Boot management.endpoint.health.probes.+group readiness (include db) phản ánh đúng trạng thái.",
            "Rolling update + maxSurge mặc định đã giữ pod cũ trong lúc pod mới lên — nếu vẫn 502 nghĩa là readiness KHÔNG được cấu hình đúng, LB vẫn bắn vào pod chưa ready.",
            "Rollback là phản ứng, không phải giải pháp — deploy sau lại gặp y hệt. Fix phải ở tầng probe/traffic management."
          ]
        },
        {
          level: "hard",
          scenario: "Investigate sự cố LAAS: log CloudWatch tìm 'request của user X đi qua gateway → task-service → Kafka'. Log rải rác không nối được — log thiếu correlationId xuyên suốt.",
          q: "Chuẩn thực hành logging đúng cho hệ thống phân tán?",
          options: [
            "Tăng log level DEBUG toàn service — nhiều thông tin hơn",
            "CorrelationId filter (MDC): sinh cid per request, forward qua header X-Correlation-Id service kế tiếp, JSON structured log — lọc 1 cid ra toàn bộ hành trình request",
            "Log toàn bộ request/response body mọi service",
            "Dùng traceId của JDBC driver"
          ],
          answer: 1,
  explain: "MDC (Mapped Diagnostic Context) gắn cid vào mọi log line trong phạm vi request; header X-Correlation-Id truyền qua service chain; JSON encoder cho CloudWatch query được. Trace riêng của OpenTelemetry cũng dùng chung tinh thần — correlatable records.",
          why: [
            "DEBUG toàn hệ = nhiễu trắng cô đặc, chi phí I/O log khổng lồ, và VẪN không nối được log service A với service B nếu không có cid. Volume không thay thế correlation.",
            "✓ Đúng — '1 cái tên duy nhất cho 1 hành trình request' là nền của debugging phân tán. Kèm luật: MDC.clear() trong finally (thread reuse!), và cid trả về response header cho support đối chiếu.",
            "Log body = PII leak (số tài khoản, token) + volume dữ liệu khổng lồ. Có cid + metadata chọn lọc là đủ điều tra, body chỉ log khi có governance riêng.",
            "JDBC không có traceId chuẩn xuyên suốt application flow — công cụ sai tầng cho bài toán cross-service correlation."
          ]
        },
        {
          level: "medium",
          scenario: "Grafana LAAS: dashboard chỉ có CPU/Memory của pod. Incident production: user phàn nàn chậm nhưng CPU/Mem đều 'bình thường' — không tìm được manh mối.",
          q: "Bộ 4 metric đầu tiên của Spring Boot service nên là gì?",
          options: [
            "CPU, Memory, Disk I/O, Network",
            "http_server_requests (p95 latency + error rate per endpoint), hikaricp pool usage, JVM heap/GC pause, custom business counter",
            "Số dòng log/giây, số connection Redis, số topic Kafka, số pod",
            "Database size, table count, index usage, slow query log"
          ],
          answer: 1,
  explain: "RED method + JVM + business: latency p95 và error rate per URI cho biết user đang đau ở đâu; HikariCP active/pending cho biết nghẽn DB; heap/GC cho biết pressure bộ nhớ; business counter (transactions/earn) cho thấy symptom nghiệp vụ. CPU/Mem là hệ quả, không phải triệu chứng.",
          why: [
            "Infra metric cần nhưng không đủ — chính là dashboard hiện tại: 'bình thường' mà user chậm. Triệu chứng user-experienced nằm ở HTTP metric, không phải resource usage.",
            "✓ Đúng — từ trên xuống: user cảm nhận (HTTP) → dependency bottleneck (pool) → runtime (JVM) → business reality (counter). Mỗi tầng một câu hỏi điều tra.",
            "Hổn hợp không có narrative — đếm dòng log/giây không trả lời 'user nào chậm ở endpoint nào'. Metric phải gắn với hypothesis điều tra.",
            "DB internal metric quý nhưng là tầng sâu — nếu HTTP p95 ổn thì khỏi đào. Bắt đầu từ nơi user chạm."
          ]
        },
        {
          level: "hard",
          scenario: "p99 latency LAAS đột biến. Log mỗi service đều sạch. Trace OpenTelemetry cho thấy: gateway span 3s, task-service span 2.9s, trong đó span 'Kafka producer send' chiếm 2.8s.",
          q: "Trace giàu thông tin hơn log/metric ở điểm nào?",
          options: [
            "Trace log nhiều hơn — thay thế logging",
            "Trace gắn timing các span XUYÊN SUỐT service + dependency: thấy ngay 3s tổng được cấu thành từ đâu (2.8s Kafka) — causality chain mà log rời rạc không tái hiện được",
            "Trace tự sửa lỗi — APM có AI auto-remediation",
            "Trace rẻ hơn metric — nên dùng thay thế"
          ],
          answer: 1,
          explain: "3 trụ cột bổ sung nhau: log = event chi tiết, metric = aggregate theo thời gian, trace = causal journey. Nghẽn 2.8s ở Kafka send (broker đáp ứng chậm? acks=all + network?) hiện ra trong 1 cái nhìn — không phải grep log 3 service rồi tự ghép timeline.",
          why: [
            "Trace KHÔNG thay logging — trace không chứa business context chi tiết (stack trace, input). Ba trụ cột là squad: metric phát hiện CÓ vấn đề, trace chỉ ra Ở ĐÂU, log giải thích TẠI SAO.",
            "✓ Đúng — span tree với duration từng node: parent-child (gateway → service → kafka send) là biểu đồ quan hệ nhân quả trực quan. OpenTelemetry java agent instrumentation tự động mọi client phổ biến.",
            "Không có AI auto-fix trong OTel — observability là đèn pin, con người vẫn lái. Auto-remediation là sản phẩm riêng (khác category).",
            "Trace đắt hơn metric (sampled, backend storage) — vì thế strategy: metric 100%, trace sample 1-10%. Dùng đúng vai trò, không thay thế lẫn nhau."
          ]
        },
        {
          level: "medium",
          scenario: "Dev LAAS giữ Dockerfile cũ chạy root 'vì tiện ghi log ra host volume'. Security audit bắt buộc USER non-root.",
          q: "Vì sao non-root là baseline bắt buộc?",
          options: [
            "Chỉ để đẹp report audit — thực tế không khác biệt",
            "Container bị compromise (RCE qua dependency lỗi) → attacker có quyền root TRONG container; kết hợp container-escape/misconfig (mount host path, privileged) → leo thang lên host. Non-root chặn nhảy leo thang này",
            "Non-root chạy nhanh hơn — ít overhead permission check",
            "Kubernetes yêu cầu bắt buộc Pod Security Standards"
          ],
                    answer: 1,
  explain: "Defense in depth: container không phải VM — kernel chia sẻ host. Quyền root trong container + lỗ hổng escape (runc CVE-2019-5736-style) = root host. Chặn ở tầng quyền hạn là lớp rẻ nhất: USER appuser trong Dockerfile + readOnlyRootFilesystem + drop capabilities.",
          why: [
            "'Bình thường mới' là lý do audit tồn tại — attacker không cần 0-day nếu app đã chạy root sẵn. Baseline rẻ áp dụng sớm quý hơn incident đắt xử lý muộn.",
            "✓ Đúng — mô hình tấn công cụ thể: RCE → shell trong container → nếu root: đọc secret mounted, tamper filesystem, thử escape. Non-root + read-only fs + minimal caps thu hẹp từng bước.",
            "Permission check overhead không đáng kể — không phải lý do. Lý do là security posture, không phải performance.",
            "PSS restricted KHUYẾN NGHỊ non-root nhưng không tự enforce trên cluster cũ — baseline phải nằm trong artifact (image), không trông chờ policy runtime."
          ]
        },
        {
          level: "hard",
          scenario: "Tuần trước LAAS deploy lúc 18h. AM nhận alert ngay 19h: lỗi 500 tăng vọt. Cuối cùng điều tra ra: dependency mới (log4j-style) có CVE critical — image được scan duy nhất 1 lần khi mới thêm.",
          q: "Gap trong pipeline và giải pháp?",
          options: [
            "Deploy ban ngày để phát hiện nhanh hơn",
            "Scan định kỳ image trong registry (Trivy) + dependency-check mỗi build + renovate/dependabot tự PR nâng cấp + alert CVE mới trên image đang chạy",
            "Cấm dependency mới — chỉ dùng thư viện đã approve",
            "Cài antivirus trên Jenkins agent"
          ],
          answer: 1,
  explain: "CVE xuất hiện SAU khi thư viện đã được duyệt — scan 1 lần lúc thêm là snapshot chết. Cần: scan mỗi build (bắt mới khi PR), scan registry định kỳ (bắt CVE mới công bố trên image đang tồn tại), auto-PR nâng cấp (giảm friction sửa), runtime alert. Security là luồng liên tục không phải cổng một lần.",
          why: [
            "Deploy ban ngày giảm thời gian phát hiện 1-2h — không giải quyết việc CVE tồn tại trong artifact. Symptom mitigation.",
            "✓ Đúng — 4 lớp phủ vòng đời: build-time (PR), registry (image tồn tại), upgrade flow (dep bot), runtime (alert). CVE pipeline-style: thời điểm công bố ≠ thời điểm thêm dependency.",
            "Cấm dependency mới làm khô héo dev velocity và vẫn không bắt CVE trong thư viện CŨ — log4shell nằm trong dependency có sẵn từ lâu. Chính sách sai chiều vấn đề.",
            "AV quét file thực thi truyền thống — không hiểu dependency JAR/CVE database của hệ sinh thái Maven. Công cụ sai loại cho bài toán supply chain Java."
          ]
        },
        {
          level: "easy",
          scenario: "Nhân viên mới hỏi senior LAAS: 'Pod đang CrashLoopBackOff. Em restart cluster là xong chứ gì?'",
          q: "Bước debug đúng đắn đầu tiên?",
          options: [
            "Restart node — sách giáo khoa nói container tự heal",
            "kubectl describe pod (Events: OOMKilled? ImagePullBackOff? Probe fail?) + kubectl logs --previous (log lần crash trước) — chẩn đoán trước, hành động sau",
            "Tăng memory limit ngay — crash thường là hết bộ nhớ",
            "Rollback image trước rồi tìm hiểu sau"
          ],
          answer: 1,
  explain: "CrashLoopBackOff là container crash lặp — RESTART ĐÃ diễn ra tự động và thất bại. describe cho biết lý do hạ tầng (OOM, image, probe), logs --previous cho biết exception application. Chẩn đoán 2 phút định hướng đúng: OOM → tăng limit/fix leak; probe fail → sửa probe; app exception → fix code.",
          why: [
            "Container đã tự restart nhiều lần (đó là ý nghĩa CrashLoopBackOff) — restart node khi root cause là app exception chỉ reset vòng lặp. May mắn không phải chiến lược.",
            "✓ Đúng — kỷ luật điều tra: sự kiện hạ tầng (describe) + bằng chứng application (logs previous). 2 lệnh này phân loại được 90% trường hợp trước khi chạm bất cứ thứ gì.",
            "Tăng memory 'chắc ăn' là đốt symptom — nếu thực ra là NPE loop thì tăng memory không sửa gì mà che tín hiệu. Chỉ tăng khi OOMKilled được xác nhận.",
            "Rollback an toàn cho user (đúng khi urgent) nhưng phải kèm điều tra root cause — không phải 'rollback xong việc'. Câu hỏi hỏi bước ĐẦU TIÊN điều tra: hiểu trước."
          ]
        },
        {
          level: "medium",
          scenario: "Load test k6: 500 RPS đạt p99 600ms — mọi thresholds xanh, team chốt go-live. Đêm đầu production: 400 RPS thực tế nhưng p99 8s, error 5%. Giám sát cho thấy Hikari pool 50/50 active và hàng chục request chờ connection.",
          q: "Bài học load test nào bị bỏ sót?",
          options: [
            "Thiếu test 500 RPS — cần tăng tải test lên 1000 RPS cho chắc",
            "Chỉ test điểm ĐẠT, không tìm KNEE: pool 50 cạn ở đâu đó giữa 400-500 RPS тест đã dùng dataset nhỏ hơn nên lock ít hơn. Phải ramp vượt tải, corr pool/GC/CPU — và đối chiếu Little's Law: in-flight = RPS × latency vs pool size",
            "k6 không đủ tin cậy — đổi sang JMeter sẽ ra số đúng",
            "Production yếu hơn SIT — nâng CPU pod lên là xong"
          ],
          answer: 1,
          explain: "Threshold xanh ở MỘT điểm tải không nói gì về hành vi GẦN giới hạn. Pool 50 connection: 500 RPS × 0.5s = 250 in-flight trung bình ổn, nhưng p99 tail + dataset thật tăng thời gian giữ connection → 400 RPS thực đã bóp cạn pool. Vòng lặp đúng: ramp VƯỢT tải tìm knee, correlate với Grafana (pool active? GC pause? CPU throttle?), áp Little's Law đối chiếu in-flight với pool — thay vì chỉ chốt 'điểm xanh' và rời đi.",
          why: [
            "Tăng tải nhưng vẫn chỉ 1 điểm — không hiểu ĐỈNH sụp ở đâu và vì sao",
            "✓ Knee + Little's Law: dự đoán trước chỗ sụp bằng số, không đợi đêm go-live",
            "Công cụ không phải biến số — kịch bản + phân tích kết quả mới là",
            "Nâng CPU không giải pool cạn — giới hạn nằm ở connection config"
          ]
        }
      ]
    }
  ]
});
