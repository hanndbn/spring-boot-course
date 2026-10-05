/* =====================================================
   DevMastery — Multi-Course App Engine
   Fullstack & Cloud Native Learning Platform
   Router + Renderer + Multi-Course Architecture + Quiz Bank + Supabase Sync
   ===================================================== */
(function () {
  "use strict";

  const STORE_KEY = "sbmastery-progress-v1";
  const TOKEN_KEY = "sbmastery-jwt-token";
  const USER_KEY = "sbmastery-user-info";
  const ENROLL_KEY = "sbmastery-enrolled-modules-";
  const COURSE_ENROLL_KEY = "sbmastery-enrolled-courses-";
  const ACTIVE_COURSE_KEY = "sbmastery-active-course";
  const THEME_KEY = "sbmastery-theme";
  const API_BASE_KEY = "sbmastery-api-base";
  let API_BASE = window.API_BASE_URL || localStorage.getItem(API_BASE_KEY) || (location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "http://localhost:8080/api/v1" : "");

  // ---------- Multi-Course Catalog Architecture ----------
  // ---------- Track & Multi-Course Architecture (CES-2026 v2.5) ----------
  const TRACKS = [
    {
      id: "spring-boot-track",
      title: "Lộ Trình Kỹ Sư Spring Boot & Kiến Trúc Phân Tán",
      slug: "spring-boot-career-track",
      category: "backend",
      domainContext: "E-Commerce Order & Payment Management System",
      desc: "Lộ trình 3 chặng từ nền tảng Spring Boot đến kiến trúc Microservices và bảo mật doanh nghiệp.",
      stages: [
        {
          level: "foundation",
          courseId: "spring-boot-foundation",
          title: "Spring Boot Foundation — Core & Clean REST API",
          certificate: "DevMastery Verified — Spring Boot Foundation"
        },
        {
          level: "professional",
          courseId: "spring-boot-professional",
          title: "Spring Boot Professional — JPA, Security & Testing",
          certificate: "DevMastery Verified — Spring Boot Professional"
        },
        {
          level: "architect",
          courseId: "spring-boot-architect",
          title: "Spring Boot Architect — Kafka, Outbox & High-Scale",
          certificate: "DevMastery Verified — Spring Boot Architect"
        }
      ]
    },
    {
      id: "java-track",
      title: "Lộ Trình Chuyên Gia Ngôn Ngữ Java (Java Master Track)",
      slug: "java-master-career-track",
      category: "backend",
      domainContext: "E-Commerce Core & Financial Low-Latency Matching Engine",
      desc: "Lộ trình 3 chặng từ vững chắc Core OOP, Modern Java 21 đến chuyên gia tối ưu JVM, GC Tuning và Ultra Low-Latency.",
      stages: [
        {
          level: "foundation",
          courseId: "java-foundation",
          title: "Java 21 Foundation — Core Language, Memory & Clean OOP",
          certificate: "DevMastery Verified — Java 21 Foundation"
        },
        {
          level: "professional",
          courseId: "java-professional",
          title: "Modern Java 21 Professional — Generics, Streams & Concurrency",
          certificate: "DevMastery Verified — Modern Java 21 Professional"
        },
        {
          level: "expert",
          courseId: "java-expert",
          title: "Java 21 Expert — JVM Internals, GC Tuning & Ultra Low-Latency",
          certificate: "DevMastery Verified — Java 21 Expert"
        }
      ]
    }
  ];

  // ---------- Skill Placement Test Bank (15 Scenario Questions, 3 Tiers) ----------
  const PLACEMENT_QUESTIONS = [
    // --- Tier 1: Foundation (Q1 - Q5) ---
    {
      tier: "foundation",
      tierLabel: "Chặng 1: Foundation",
      q: "1. Trong Spring Boot 3, tại sao Constructor Injection lại được khuyến nghị thay vì Field Injection (@Autowired trên biến private)?",
      options: [
        "Constructor Injection cho phép các dependency là final (bất biến) và dễ dàng viết Unit Test mà không cần nạp Spring ApplicationContext.",
        "Constructor Injection giúp ứng dụng khởi động nhanh hơn 50% so với Field Injection.",
        "Field Injection đã bị loại bỏ hoàn toàn trong cú pháp Java 21 LTS.",
        "Constructor Injection tự động kích hoạt chế độ Lazy Loading cho mọi bean."
      ],
      answer: 0,
      explanation: "Constructor Injection bảo đảm các dependency là bắt buộc và bất biến (final), hỗ trợ kiểm thử đơn vị thuần túy không cần Spring Container, đồng thời phát hiện sớm lỗi vòng tròn phụ thuộc (Circular Dependency) ngay thời điểm khởi tạo."
    },
    {
      tier: "foundation",
      tierLabel: "Chặng 1: Foundation",
      q: "2. Khi thiết kế RESTful API theo chuẩn RFC 7807 (ProblemDetails), cấu trúc payload trả về cho lỗi 400 Bad Request gồm các trường tối thiểu nào?",
      options: [
        "type, title, status, detail, instance (hoặc các trường mô tả lỗi chuẩn hóa).",
        "message, code, data, timestamp.",
        "success: false, error_code, error_message.",
        "statusCode, errors: [], stackTrace."
      ],
      answer: 0,
      explanation: "RFC 7807 ProblemDetails quy định chuẩn hóa cấu trúc HTTP API error với các trường: type (URI định danh loại lỗi), title (mô tả ngắn), status (HTTP code), detail (chi tiết lỗi thân thiện) và instance (URI endpoint gặp lỗi)."
    },
    {
      tier: "foundation",
      tierLabel: "Chặng 1: Foundation",
      q: "3. Bean có scope Singleton mặc định trong Spring Container có đặc tính gì về Concurrency (đa luồng)?",
      options: [
        "Chỉ có một instance duy nhất được chia sẻ giữa mọi HTTP request thread, do đó TUYỆT ĐỐI không lưu mutable state trong biến instance.",
        "Spring tự động đồng bộ hóa (synchronize) tất cả các phương thức của Bean singleton.",
        "Mỗi HTTP request đến sẽ tự động nhân bản ra một instance Singleton mới trong memory.",
        "Singleton bean chỉ chạy trên một thread duy nhất nên không bao giờ xảy ra Race Condition."
      ],
      answer: 0,
      explanation: "Spring Singleton bean được chia sẻ cho hàng nghìn request worker threads chạy đồng thời. Nếu lưu biến trạng thái có thể thay đổi (mutable state) ở cấp độ class instance sẽ dẫn đến lỗi Race Condition và Data Corruption nghiêm trọng."
    },
    {
      tier: "foundation",
      tierLabel: "Chặng 1: Foundation",
      q: "4. Trong Clean Architecture phân tầng của Spring Boot, quy tắc phụ thuộc (Dependency Rule) nào là CHUẨN XÁC?",
      options: [
        "Controller phụ thuộc vào Service interface; Service phụ thuộc vào Repository interface; Repository tương tác với Database.",
        "Controller được phép gọi trực tiếp Spring Data JpaRepository để giảm độ trễ truy vấn.",
        "Repository gọi Service để thực thi nghiệp vụ trước khi ghi dữ liệu xuống database.",
        "Entity JPA phụ thuộc trực tiếp vào REST Controller để parse request payload."
      ],
      answer: 0,
      explanation: "Quy tắc phân tầng chuẩn: Presentation/Web Layer (Controller) -> Business/Application Layer (Service) -> Persistence/Data Layer (Repository). Không bao giờ cho phép Controller bypass Service gọi trực tiếp Repository."
    },
    {
      tier: "foundation",
      tierLabel: "Chặng 1: Foundation",
      q: "5. Annotation @SpringBootApplication tương đương với sự kết hợp của 3 annotation cốt lõi nào?",
      options: [
        "@Configuration, @EnableAutoConfiguration, @ComponentScan",
        "@Service, @Repository, @Controller",
        "@Component, @Autowired, @EnableWebMvc",
        "@EntityScan, @EnableJpaRepositories, @SpringBootConfiguration"
      ],
      answer: 0,
      explanation: "@SpringBootApplication là meta-annotation kết hợp của @SpringBootConfiguration (hoặc @Configuration), @EnableAutoConfiguration (kích hoạt các cấu hình tự động của Boot) và @ComponentScan (quét tìm bean trong package)."
    },

    // --- Tier 2: Professional (Q6 - Q10) ---
    {
      tier: "professional",
      tierLabel: "Chặng 2: Professional",
      q: "6. Vấn đề N+1 Query trong Spring Data JPA & Hibernate xảy ra do nguyên nhân nào và giải pháp triệt để là gì?",
      options: [
        "Do truy vấn 1 danh sách cha và Hibernate phát sinh thêm N câu query để nạp quan hệ lười (Lazy collection); giải pháp triệt để là dùng JOIN FETCH, @EntityGraph hoặc DTO Projection.",
        "Do database thiếu index; giải pháp là đánh composite index trên tất cả các cột khóa ngoại.",
        "Do Hibernate bật caching L2; giải pháp là tắt Hibernate L2 Cache.",
        "Do khai báo fetch type là EAGER; giải pháp là đổi toàn bộ sang LAZY."
      ],
      answer: 0,
      explanation: "N+1 query xảy ra khi truy vấn cha sinh 1 query, rồi lặp qua danh sách và gọi getter của quan hệ lazy sinh thêm N query phụ. Giải pháp chuẩn là JOIN FETCH trong JPQL, khai báo @EntityGraph hoặc fetch trực tiếp vào DTO Projection."
    },
    {
      tier: "professional",
      tierLabel: "Chặng 2: Professional",
      q: "7. Trong nghiệp vụ Flash Sale đặt hàng có tranh chấp cao (high concurrency), giải pháp nào ngăn chặn tình trạng bán âm kho (overselling) một cách an toàn nhất tại tầng Database?",
      options: [
        "Sử dụng Pessimistic Write Lock (SELECT ... FOR UPDATE qua @Lock(LockModeType.PESSIMISTIC_WRITE)) hoặc atomic update có điều kiện WHERE quantity >= :count.",
        "Sử dụng từ khóa Java synchronized trên phương thức của Service.",
        "Chỉ cần đặt annotation @Transactional trên phương thức đặt hàng là đủ an toàn.",
        "Tăng isolation level của database lên READ_UNCOMMITTED để xử lý nhanh hơn."
      ],
      answer: 0,
      explanation: "Java synchronized chỉ có tác dụng trên 1 JVM duy nhất (vô dụng khi scale nhiều pod). Giải pháp an toàn ở tầng Database là Pessimistic Lock (SELECT FOR UPDATE) hoặc Atomic Conditional Update (UPDATE product SET stock = stock - :qty WHERE id = :id AND stock >= :qty)."
    },
    {
      tier: "professional",
      tierLabel: "Chặng 2: Professional",
      q: "8. Trong Spring Security 6 với kiến trúc REST API Stateless dùng JWT, cấu hình nào là BẮT BUỘC để ngăn Spring tự động tạo HttpSession?",
      options: [
        "sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))",
        "httpBasic(Customizer.withDefaults())",
        "cors(Customizer.withDefaults()).csrf(AbstractHttpConfigurer::disable)",
        "authorizeHttpRequests(auth -> auth.anyRequest().permitAll())"
      ],
      answer: 0,
      explanation: "Cấu hình SessionCreationPolicy.STATELESS yêu cầu Spring Security không bao giờ tạo hoặc sử dụng HttpSession để lưu SecurityContext, bảo đảm tính chất hoàn toàn Stateless của JWT token trên phân tán."
    },
    {
      tier: "professional",
      tierLabel: "Chặng 2: Professional",
      q: "9. Tại sao theo quy chuẩn kỹ thuật CES-2026, các bài test tích hợp (Integration Test) cho tầng Data & Concurrency bắt buộc phải dùng Testcontainers với PostgreSQL thật thay vì H2 in-memory?",
      options: [
        "Vì H2 không phản ánh đúng dialect SQL, Transaction Isolation, cơ chế Locking và Row-level lock thực tế của PostgreSQL, dẫn đến test pass trên H2 nhưng lỗi dead-lock/data race khi lên Production.",
        "Vì H2 chạy chậm hơn Docker PostgreSQL trên môi trường máy yếu.",
        "Vì Testcontainers không tốn RAM và không cần cài đặt Docker Engine.",
        "Vì Spring Boot 3 đã ngừng hỗ trợ hoàn toàn cơ sở dữ liệu in-memory H2."
      ],
      answer: 0,
      explanation: "H2 in-memory có cơ chế locking và type conversion rất khác biệt so với PostgreSQL/MySQL. Nhiều lỗi Concurrency, JSONB, Trigger hoặc Deadlock chỉ xuất hiện trên database thật, do đó CES-2026 cấm H2 ở bài thi cấp Professional & Architect."
    },
    {
      tier: "professional",
      tierLabel: "Chặng 2: Professional",
      q: "10. Khi một phương thức mang @Transactional gọi một phương thức khác trong cùng class có @Transactional(propagation = Propagation.REQUIRES_NEW), tại sao REQUIRES_NEW KHÔNG có hiệu lực?",
      options: [
        "Do cơ chế Spring AOP Proxy; self-invocation (tự gọi nội bộ) không đi qua Spring Proxy nên advice transaction mới không được kích hoạt.",
        "Do JDBC Driver không hỗ trợ nhiều hơn 1 transaction đồng thời trên 1 thread.",
        "Do propagation REQUIRES_NEW chỉ áp dụng cho tầng Controller.",
        "Do Hibernate Session đã bị đóng sau lệnh gọi đầu tiên."
      ],
      answer: 0,
      explanation: "Spring Transactional hoạt động dựa trên Dynamic Proxy hoặc CGLIB Proxy bọc ngoài bean. Khi gọi this.methodB() bên trong methodA(), lệnh gọi đi thẳng vào instance gốc mà không qua Proxy, dẫn đến mọi cấu hình Transactional của methodB bị bỏ qua."
    },

    // --- Tier 3: Architect (Q11 - Q15) ---
    {
      tier: "architect",
      tierLabel: "Chặng 3: Architect",
      q: "11. Để giải quyết bài toán Dual-Write (ghi database cục bộ và gửi event Kafka đồng thời) tránh mất dữ liệu hoặc dữ liệu không nhất quán, kiến trúc sư nên áp dụng pattern nào?",
      options: [
        "Transactional Outbox Pattern (lưu event vào bảng outbox cùng local transaction của nghiệp vụ, rồi dùng CDC Debezium hoặc Poller xuất bản sang Kafka).",
        "Two-Phase Commit (2PC) phân tán giữa JDBC và Kafka producer trong cùng một JTA transaction.",
        "Gửi Kafka trước bằng asynchronous fire-and-forget, sau đó mới commit database nghiệp vụ.",
        "Bọc cả lệnh ghi database và kafkaTemplate.send() trong một khối try-catch."
      ],
      answer: 0,
      explanation: "Transactional Outbox Pattern đảm bảo tính nguyên tố cục bộ (Atomicity): Record nghiệp vụ và Event Outbox được commit trong cùng 1 local DB transaction. Sau đó một tiến trình riêng (CDC Debezium hoặc Outbox Relay) sẽ đẩy message lên Kafka đảm bảo At-least-once delivery."
    },
    {
      tier: "architect",
      tierLabel: "Chặng 3: Architect",
      q: "12. Khi triển khai Saga Pattern phân tán cho chuỗi giao dịch Order ➔ Payment ➔ Inventory, cơ chế xử lý khi bước Payment thất bại là gì?",
      options: [
        "Thực thi Compensating Transaction (Giao dịch bù trừ) theo chiều ngược lại để hoàn trả trạng thái về nhất quán cuối cùng (Eventual Consistency).",
        "Yêu cầu database của tất cả các microservices rollback lại snapshot ban đầu tự động.",
        "Khởi động lại toàn bộ pod Kubernetes của các microservice liên quan.",
        "Chờ 60 giây rồi thử thanh toán lại vô hạn lần (infinite retry)."
      ],
      answer: 0,
      explanation: "Trong hệ thống phân tán không dùng 2PC, Saga giải quyết rollback bằng cách kích hoạt chuỗi Compensating Transaction (giao dịch bù trừ - ví dụ: hủy đơn hàng, mở khóa tồn kho) để đưa toàn hệ thống về trạng thái nhất quán cuối cùng."
    },
    {
      tier: "architect",
      tierLabel: "Chặng 3: Architect",
      q: "13. Hiện tượng Cache Stampede (Dog-piling) xảy ra khi nào trong hệ thống Redis phân tán và giải pháp xử lý là gì?",
      options: [
        "Khi một hot key có hàng nghìn request/giây bị hết hạn (TTL expire), tất cả request ùa xuống Database cùng lúc gây sập DB; giải pháp là dùng Distributed Lock (Redlock) hoặc Probabilistic Early Expiration (XFetch) kết hợp Background Cache Warmer.",
        "Khi bộ nhớ Redis bị đầy và kích hoạt eviction policy; giải pháp là mua thêm RAM cho Redis.",
        "Khi dữ liệu trong cache bị sai định dạng JSON; giải pháp là dùng Jackson nhị phân.",
        "Khi kết nối mạng giữa Spring Boot và Redis bị ngắt; giải pháp là tắt cache."
      ],
      answer: 0,
      explanation: "Cache Stampede xuất hiện khi cache key cực hot hết hạn, khiến hàng nghìn thread đồng thời miss cache và đồng thời query database. Giải pháp là khóa phân tán (Distributed Lock) để chỉ 1 thread tải dữ liệu và nạp lại cache, hoặc làm mới cache trước khi hết hạn."
    },
    {
      tier: "architect",
      tierLabel: "Chặng 3: Architect",
      q: "14. Trong việc đóng gói container Docker cho ứng dụng Spring Boot 3 trên Kubernetes, kỹ thuật Layered JAR (spring-boot:layers) mang lại lợi ích kỹ thuật quan trọng nào?",
      options: [
        "Tách ứng dụng thành các lớp (dependencies, spring-boot-loader, application code); khi build lại phiên bản mới, Docker chỉ cần build lại lớp application (vài MB) thay vì toàn bộ fat JAR (hàng trăm MB), tối ưu tốc độ CI/CD và băng thông kéo image trên K8s.",
        "Tự động biên dịch mã nguồn Java thành file thực thi nhị phân GraalVM Native Image.",
        "Giúp ứng dụng không cần cài đặt JRE/JDK vẫn chạy được trên Linux container.",
        "Giảm mức chiếm dụng Heap memory của JVM xuống dưới 64MB khi vận hành."
      ],
      answer: 0,
      explanation: "Layered JAR tận dụng cơ chế Docker layer cache. Do thư viện bên thứ 3 (dependencies) ít thay đổi, Docker tái sử dụng các layer cũ và chỉ tải layer mã ứng dụng mới có dung lượng rất nhỏ, giúp deploy pod nhanh hơn gấp nhiều lần."
    },
    {
      tier: "architect",
      tierLabel: "Chặng 3: Architect",
      q: "15. Trong kiến trúc Microservices với Apache Kafka, tại sao Consumer BẮT BUỘC phải được thiết kế Idempotent (chống xử lý trùng)?",
      options: [
        "Vì Kafka chỉ đảm bảo ngữ nghĩa At-least-once delivery theo mặc định; mạng chập chờn hoặc rebalance có thể khiến message bị gửi lại, nếu consumer không idempotent sẽ dẫn đến xử lý duplicate (như trừ tiền hoặc cộng điểm 2 lần).",
        "Vì nếu không có Idempotent Consumer, Kafka Broker sẽ từ chối nhận message từ Producer.",
        "Vì Kafka partition chỉ cho phép một consumer duy nhất đọc dữ liệu trong suốt vòng đời.",
        "Vì Idempotent Consumer giúp tăng throughput của Kafka lên gấp 10 lần."
      ],
      answer: 0,
      explanation: "Tại tầng Consumer, việc xử lý trùng lặp do mạng hoặc retry là bình thường trong môi trường phân tán. Consumer phải kiểm tra message_id (hoặc idempotent key) trong database để tránh thực hiện lại thao tác giao dịch tài chính nhiều lần."
    }
  ];

  const COURSES = [
    {
      id: "spring-boot-foundation",
      trackId: "spring-boot-track",
      title: "Spring Boot 3 Core & RESTful API Architecture",
      shortTitle: "Spring Boot Foundation",
      icon: "🌱",
      badge: "Foundation Level",
      category: "backend",
      level: "foundation",
      hours: "~10h",
      moduleIds: [1, 2],
      certificateTitle: "DevMastery Verified — Spring Boot Foundation",
      instructor: "DevMastery Architecture Council",
      bestseller: true,
      themeGradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
      desc: "Khóa học thực chiến tập trung 100% vào Spring Boot: Nắm vững IoC Container, Dependency Injection, Bean Lifecycle, Auto-Configuration và xây dựng hệ thống RESTful API chuẩn RFC 7807 ProblemDetails.",
      outcomes: [
        "Hiểu sâu nguyên lý IoC Container, Dependency Injection và vòng đời Spring Bean",
        "Tự thiết kế và triển khai RESTful API chuẩn RFC 7807 ProblemDetails cho E-Commerce",
        "Làm chủ cơ chế Auto-Configuration và tự đóng gói Custom Spring Boot Starter",
        "Áp dụng Clean Architecture phân tầng rõ ràng giữa Web Controller, Service và DTO"
      ],
      prerequisites: [
        "Đã có kiến thức cú pháp Java cơ bản",
        "Hiểu nguyên lý hoạt động của HTTP/REST"
      ],
      notFor: [
        "Người chưa từng học bất kỳ ngôn ngữ lập trình nào (cần học Java cơ bản trước)",
        "Kỹ sư Senior đã thành thạo Spring Core cần học kiến trúc phân tán (nên học khóa Architect)"
      ],
      stackVersion: {
        java: "21 LTS",
        springBoot: "3.3+",
        hibernate: "6.5+",
        lastReviewedDate: "2026-10-04",
        maintainer: "DevMastery Architecture Council"
      },
      tags: ["Spring Boot 3", "IoC/DI", "REST API", "RFC 7807", "Clean Architecture", "Auto-Config"],
      stats: null,
      isAvailable: true,
      modules: []
    },
    {
      id: "java-21-foundation",
      title: "Nền Tảng Java 21 LTS & Bộ Công Cụ Backend",
      shortTitle: "Nền Tảng Java 21 (Phụ trợ)",
      icon: "☕",
      badge: "Khóa học phụ trợ",
      category: "backend",
      level: "foundation",
      hours: "~6h",
      moduleIds: [0],
      certificateTitle: "DevMastery Verified — Java 21 Foundation",
      instructor: "DevMastery Architecture Council",
      bestseller: false,
      themeGradient: "linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)",
      desc: "Khóa học bổ trợ tùy chọn: Dành cho những ai muốn củng cố chuyên sâu cú pháp Java 21 LTS, Stream API, Record, Sealed Interface và Maven trước khi vào Spring Boot.",
      outcomes: [
        "Làm chủ cú pháp Java 21 LTS: Record, Sealed Interface, Pattern Matching",
        "Hiểu sâu Stream API, Lambda và xử lý dữ liệu lập trình hàm",
        "Quản trị dự án Maven đa module chuẩn doanh nghiệp"
      ],
      prerequisites: ["Kiến thức lập trình căn bản"],
      tags: ["Java 21", "Stream API", "Record", "Maven"],
      stats: null,
      isAvailable: false,
      modules: []
    },
    {
      id: "spring-boot-professional",
      trackId: "spring-boot-track",
      title: "Spring Boot Enterprise JPA, Security & Testing",
      shortTitle: "Spring Boot Professional",
      icon: "🔒",
      badge: "Professional Level",
      category: "backend",
      level: "professional",
      hours: "~15h",
      moduleIds: [3, 4, 5],
      certificateTitle: "DevMastery Verified — Spring Boot Professional",
      instructor: "DevMastery Architecture Council",
      bestseller: true,
      themeGradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)",
      desc: "Tối ưu hóa Database chuyên sâu, triệt tiêu lỗi N+1, xử lý Concurrency/Locking chống bán âm, bảo mật ngân hàng với Spring Security 6 và Testcontainers CI/CD.",
      outcomes: [
        "Triệt tiêu 100% lỗi Hibernate N+1 bằng JOIN FETCH, EntityGraph và Projections",
        "Làm chủ Transaction Isolation, Pessimistic Locking chống bán âm hàng Flash Sale",
        "Thiết lập Spring Security 6 SecurityFilterChain, Stateless JWT và tích hợp Keycloak",
        "Viết Integration Test với Testcontainers chạy trên PostgreSQL thật đạt chuẩn CI/CD"
      ],
      prerequisites: [
        "Đã hoàn thành khóa Spring Boot Foundation hoặc đạt ≥50% trong bài Skill Placement Test",
        "Có kiến thức cơ bản về SQL và RDBMS (PostgreSQL/MySQL)"
      ],
      notFor: [
        "Lập trình viên mới bắt đầu chưa hiểu Bean IoC và HTTP status code cơ bản",
        "Người chỉ muốn học ví dụ in-memory H2 mà không muốn làm quen với Docker thật"
      ],
      stackVersion: {
        java: "21 LTS",
        springBoot: "3.3+",
        hibernate: "6.5+",
        lastReviewedDate: "2026-10-04",
        maintainer: "DevMastery Architecture Council"
      },
      tags: ["JPA/Hibernate", "N+1 Fix", "Pessimistic Lock", "Spring Security 6", "JWT", "Testcontainers"],
      stats: null,
      isAvailable: true,
      modules: []
    },
    {
      id: "spring-boot-architect",
      trackId: "spring-boot-track",
      title: "Spring Boot Cloud Native, Kafka & Distributed Architecture",
      shortTitle: "Spring Boot Architect",
      icon: "⚡",
      badge: "Architect Level",
      category: "backend",
      level: "architect",
      hours: "~18h",
      moduleIds: [6, 7],
      certificateTitle: "DevMastery Verified — Spring Boot Architect",
      instructor: "DevMastery Architecture Council",
      bestseller: false,
      themeGradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)",
      desc: "Thiết kế hệ thống phân tán chịu tải cao: Event-driven Kafka, Transactional Outbox, Saga Pattern, Redis Caching, Docker Layered Jar và Kubernetes Capstone.",
      outcomes: [
        "Triển khai Transactional Outbox Pattern với Apache Kafka và Idempotent Consumer",
        "Xử lý giao dịch phân tán bằng Saga Pattern (Orchestration/Choreography)",
        "Tối ưu Redis Caching, chống Cache Stampede và cấu hình Circuit Breaker Resilience4j",
        "Đóng gói Docker Layered Jar, cấu hình K8s Zero-Downtime và hoàn thành Capstone Project"
      ],
      prerequisites: [
        "Đã hoàn thành khóa Spring Boot Professional hoặc đạt ≥80% trong bài Skill Placement Test",
        "Đã quen thuộc với Docker, JPA transaction và microservice concepts cơ bản"
      ],
      notFor: [
        "Lập trình viên chưa vững JPA, Security hoặc Unit Testing",
        "Người chỉ tìm kiếm giải pháp monolithic đơn giản"
      ],
      stackVersion: {
        java: "21 LTS",
        springBoot: "3.3+",
        hibernate: "6.5+",
        lastReviewedDate: "2026-10-04",
        maintainer: "DevMastery Architecture Council"
      },
      tags: ["Kafka", "Transactional Outbox", "Saga Pattern", "Redis", "Resilience4j", "Kubernetes"],
      stats: null,
      isAvailable: true,
      modules: []
    },
    {
      id: "java-foundation",
      trackId: "java-track",
      title: "Java 21 Foundation — Core Language, Memory & Clean OOP",
      shortTitle: "Java 21 Foundation",
      icon: "☕",
      badge: "Foundation Level",
      category: "backend",
      level: "foundation",
      hours: "~12h",
      modulesCount: 4,
      lessonsCount: 16,
      quizCount: 16,
      certificateTitle: "DevMastery Verified — Java 21 Foundation",
      instructor: "DevMastery Java Architecture Council",
      bestseller: true,
      themeGradient: "linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)",
      desc: "Làm chủ nền tảng ngôn ngữ Java 21 LTS: Bản chất bộ nhớ Stack vs Heap, Pass-by-value, thiết kế hướng đối tượng sạch chuẩn SOLID, Java Collections Framework và Unit Testing JUnit 5.",
      outcomes: [
        "Nắm chắc bản chất bộ nhớ Stack, Heap, Metaspace và vòng đời Object",
        "Thiết kế class hướng đối tượng chuẩn mực theo 5 nguyên lý SOLID",
        "Làm chủ cấu trúc dữ liệu Java Collections: HashMap, ArrayList, Red-Black Tree",
        "Hoàn thành đồ án Console E-Commerce Order Manager có test JUnit 5 đạt 85% coverage"
      ],
      prerequisites: ["Tư duy logic lập trình căn bản"],
      stackVersion: {
        java: "21 LTS",
        buildTool: "Maven 3.9+",
        test: "JUnit 5.10+",
        lastReviewedDate: "2026-10-04",
        maintainer: "DevMastery Java Architecture Council"
      },
      tags: ["Java 21", "OOP", "SOLID", "Collections", "HashMap", "JUnit 5", "Clean Code"],
      stats: null,
      isAvailable: true,
      modules: []
    },
    {
      id: "java-professional",
      trackId: "java-track",
      title: "Modern Java 21 Professional — Generics, Streams & Concurrency",
      shortTitle: "Modern Java Professional",
      icon: "🚀",
      badge: "Professional Level",
      category: "backend",
      level: "professional",
      hours: "~16h",
      modulesCount: 4,
      lessonsCount: 16,
      quizCount: 16,
      certificateTitle: "DevMastery Verified — Modern Java 21 Professional",
      instructor: "DevMastery Java Architecture Council",
      bestseller: true,
      themeGradient: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)",
      desc: "Nâng cấp tư duy lập trình hiện đại: Record, Sealed Classes, Pattern Matching, Generics chuyên sâu (PECS), Stream API, CompletableFuture và Virtual Threads (Project Loom JEP 444).",
      outcomes: [
        "Làm chủ Modern Java 21: Records, Sealed Interfaces, Pattern Matching for switch",
        "Hiểu sâu Generics Type Erasure, Wildcards và quy tắc thiết kế API PECS",
        "Xây dựng Custom Collectors và xử lý dữ liệu song song an toàn",
        "Lập trình đa luồng hiệu năng cao với Virtual Threads và CompletableFuture"
      ],
      prerequisites: ["Đã hoàn thành Java 21 Foundation hoặc có 1+ năm kinh nghiệm Java Core"],
      stackVersion: {
        java: "21 LTS",
        concurrency: "Virtual Threads (JEP 444)",
        lastReviewedDate: "2026-10-04",
        maintainer: "DevMastery Java Architecture Council"
      },
      tags: ["Modern Java 21", "Virtual Threads", "Streams", "Generics", "CompletableFuture", "Records"],
      stats: null,
      isAvailable: true,
      modules: []
    },
    {
      id: "java-expert",
      trackId: "java-track",
      title: "Java 21 Expert — JVM Internals, GC Tuning & Ultra Low-Latency",
      shortTitle: "Java 21 Expert",
      icon: "⚡",
      badge: "Expert Level",
      category: "backend",
      level: "expert",
      hours: "~18h",
      modulesCount: 4,
      lessonsCount: 16,
      quizCount: 16,
      certificateTitle: "DevMastery Verified — Java 21 Expert",
      instructor: "DevMastery Java Architecture Council",
      bestseller: false,
      themeGradient: "linear-gradient(135deg, #7c2d12 0%, #b91c1c 50%, #ef4444 100%)",
      desc: "Chạm tới tầng vật lý của Java: HotSpot JIT C1/C2, Escape Analysis, Garbage Collection Tuning (G1GC & Generational ZGC), Java Memory Model, Lock-Free RingBuffer và đồ án Financial Matching Engine.",
      outcomes: [
        "Phân tích JIT Compilation (C1/C2), Method Inlining, Escape Analysis và Assembly code",
        "Làm chủ GC Tuning với G1GC và Generational ZGC đạt độ trễ sub-millisecond",
        "Hiểu sâu Java Memory Model: Happens-Before, Memory Barriers, VarHandle, FFM API",
        "Xây dựng Order Book Matching Engine zero-allocation với độ trễ P99.99 < 5µs"
      ],
      prerequisites: ["Đã hoàn thành Modern Java Professional và nắm vững Concurrency"],
      stackVersion: {
        java: "21 LTS",
        jvm: "HotSpot OpenJDK 21",
        gc: "Generational ZGC & G1GC",
        profiler: "Async-Profiler & JFR",
        lastReviewedDate: "2026-10-04",
        maintainer: "DevMastery Java Architecture Council"
      },
      tags: ["JVM Internals", "JIT Compiler", "ZGC", "Low Latency", "Lock-Free", "Disruptor", "JMH"],
      stats: null,
      isAvailable: true,
      modules: []
    },
    {
      id: "java-core-mastery",
      title: "Java Core & Clean Code Professional",
      shortTitle: "Java Core & Design Patterns",
      icon: "☕",
      badge: "Java Foundation & OOP",
      category: "backend",
      level: "foundation",
      hours: "~35h",
      modulesCount: 4,
      lessonsCount: 15,
      quizCount: 8,
      instructor: "DevMastery Academy & Java Architects",
      bestseller: false,
      themeGradient: "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)",
      desc: "Nền tảng vững chắc với Java 21 LTS: OOP, SOLID, Design Patterns, Collection Framework, Concurrency, Virtual Threads & Clean Code.",
      tags: ["Java 21", "OOP", "SOLID", "Collections", "Virtual Threads", "Design Patterns"],
      stats: null,
      isAvailable: false,
      modules: []
    },
    {
      id: "react-mastery",
      title: "React 19 & Next.js 15 — Fullstack Enterprise",
      shortTitle: "React 19 & Next.js 15",
      icon: "⚛️",
      badge: "Frontend & Fullstack",
      category: "frontend",
      level: "professional",
      hours: "~45h",
      modulesCount: 4,
      lessonsCount: 9,
      quizCount: 4,
      instructor: "DevMastery Academy & Senior Frontend Leads",
      bestseller: true,
      themeGradient: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)",
      desc: "Làm chủ React 19, Server Components, Server Actions, Next.js 15 App Router, TypeScript, Zustand và Clean Architecture cho ứng dụng Enterprise.",
      tags: ["React 19", "Next.js 15", "TypeScript", "Zustand", "Tailwind CSS", "Server Actions"],
      stats: null,
      isAvailable: true,
      modules: []
    },
    {
      id: "devops-k8s",
      title: "Cloud Native DevOps & Kubernetes Production",
      shortTitle: "DevOps & Kubernetes",
      icon: "☸️",
      badge: "DevOps & Cloud Native",
      category: "devops",
      level: "architect",
      hours: "~50h",
      modulesCount: 4,
      lessonsCount: 8,
      quizCount: 4,
      instructor: "DevMastery Cloud & SRE Specialists",
      bestseller: false,
      themeGradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)",
      desc: "Thực hành triển khai production: Docker containerization, Kubernetes cluster, Helm, CI/CD GitHub Actions, Prometheus, Grafana & ELK Stack.",
      tags: ["Docker", "Kubernetes", "CI/CD", "Helm", "Prometheus", "Grafana", "AWS"],
      stats: null,
      isAvailable: true,
      modules: []
    }
  ];

  // Initialize course data from window globals
  function initializeCoursesData() {
    const allMods = (window.COURSE_MODULES || []).slice().sort((a, b) => a.id - b.id);

    // 1. Distribute modules across the Spring Boot Track & Java Foundation courses
    const springTrackMap = [
      { id: "spring-boot-foundation", modIds: [1, 2] },
      { id: "spring-boot-professional", modIds: [3, 4, 5] },
      { id: "spring-boot-architect", modIds: [6, 7] },
      { id: "java-21-foundation", modIds: [0] }
    ];

    springTrackMap.forEach(st => {
      const c = COURSES.find(item => item.id === st.id);
      if (c) {
        c.modules = allMods.filter(m => st.modIds.includes(m.id));
        c.modulesCount = c.modules.length;
        c.lessonsCount = c.modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.filter(l => l.type !== "quiz").length : 0), 0);
        c.quizCount = c.modules.reduce((acc, m) => {
          const q = (m.lessons || []).find(l => l.type === "quiz");
          const exp = (window.EXPANDED_QUIZZES && window.EXPANDED_QUIZZES[String(m.id)]) || [];
          return acc + (q && q.questions ? q.questions.length : 0) + exp.length;
        }, 0);
      }
    });

    // 2. Extra courses (Java, React, DevOps)
    if (window.EXTRA_COURSES) {
      Object.keys(window.EXTRA_COURSES).forEach(cid => {
        const src = window.EXTRA_COURSES[cid];
        const target = COURSES.find(c => c.id === cid);
        if (target && src && src.modules) {
          target.modules = src.modules;
          target.modulesCount = src.modules.length;
          target.lessonsCount = src.modules.reduce((acc, m) => acc + (m.lessons ? m.lessons.filter(l => l.type !== "quiz").length : 0), 0);
          target.quizCount = src.modules.reduce((acc, m) => {
            const q = (m.lessons || []).find(l => l.type === "quiz") || m.quiz;
            return acc + (q && q.questions ? q.questions.length : 0);
          }, 0);
        } else if (!target && src) {
          COURSES.push(src);
        }
      });
    }

    // 3. Fallback bridge: If activeCourseId was 'spring-boot-mastery', default to 'spring-boot-foundation'
    if (state.activeCourseId === "spring-boot-mastery" || !COURSES.some(c => c.id === state.activeCourseId)) {
      state.activeCourseId = "spring-boot-foundation";
      localStorage.setItem(ACTIVE_COURSE_KEY, "spring-boot-foundation");
    }
  }

  // ---------- State ----------
  const state = {
    view: "courses",          // courses (Trang chủ) | dashboard | lesson | quiz | curriculum | user-dashboard
    activeCourseId: localStorage.getItem(ACTIVE_COURSE_KEY) || "spring-boot-mastery",
    currentLesson: null,      // lesson id
    currentQuizModule: null,  // module id
    completed: {},            // { lessonId: true }
    quizScores: {},           // { moduleId: {score, total} }
    enrolledCourses: {},      // { [courseId]: true }
    enrolledModules: {},      // legacy support
    catalogCategory: "all",   // all | backend | frontend | devops
    catalogSearch: "",
    activeTrackId: "spring-boot-track", // spring-boot-track | java-track
    pendingEnrollCourse: null,
    pendingTargetLesson: null,
    searchIdx: [],
    currentUser: null,        // { id, username, email, fullName, role }
    token: null               // JWT string
  };

  // Backward-compatibility: MODULES references active course modules
  function getActiveCourse() {
    return COURSES.find(c => c.id === state.activeCourseId) || COURSES[0];
  }

  function getActiveModules() {
    return getActiveCourse().modules || [];
  }

  function getCourse(courseId) {
    return COURSES.find(c => c.id === courseId) || COURSES[0];
  }

  // ---------- Utils ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---------- Theme Management (Udemy Dual-Theme) ----------
  function initTheme() {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY) || "light";
      document.documentElement.setAttribute("data-theme", savedTheme);
      updateThemeToggleUI(savedTheme);
    } catch (e) {}
  }

  function setTheme(theme) {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
      updateThemeToggleUI(theme);
      toast(theme === "dark" ? "🌙 Đã chuyển sang giao diện Tối (Udemy Dark)" : "☀️ Đã chuyển sang giao diện Sáng (Udemy Light)");
    } catch (e) {}
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    setTheme(current === "dark" ? "light" : "dark");
  }

  function updateThemeToggleUI(theme) {
    const btn = $("#btnThemeToggle");
    if (!btn) return;
    btn.setAttribute("title", theme === "dark" ? "Chuyển sang giao diện Sáng (Udemy Light)" : "Chuyển sang giao diện Tối (Udemy Dark)");
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      completed: state.completed,
      quizScores: state.quizScores
    }));
    const uid = state.currentUser ? state.currentUser.id : "guest";
    localStorage.setItem(ENROLL_KEY + uid, JSON.stringify(state.enrolledModules));
    localStorage.setItem(COURSE_ENROLL_KEY + uid, JSON.stringify(state.enrolledCourses));
    localStorage.setItem(ACTIVE_COURSE_KEY, state.activeCourseId);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        state.completed = data.completed || {};
        state.quizScores = data.quizScores || {};
      }
      const rawToken = localStorage.getItem(TOKEN_KEY);
      const rawUser = localStorage.getItem(USER_KEY);
      if (rawToken && rawUser) {
        state.token = rawToken;
        state.currentUser = JSON.parse(rawUser);
      }
      const uid = state.currentUser ? state.currentUser.id : "guest";
      const rawEnroll = localStorage.getItem(ENROLL_KEY + uid);
      if (rawEnroll) {
        state.enrolledModules = JSON.parse(rawEnroll) || {};
      } else {
        state.enrolledModules = {};
      }
      const rawCourseEnroll = localStorage.getItem(COURSE_ENROLL_KEY + uid);
      if (rawCourseEnroll) {
        state.enrolledCourses = JSON.parse(rawCourseEnroll) || {};
      } else {
        state.enrolledCourses = {};
      }
      // Purge legacy courses from enrolled state
      delete state.enrolledCourses["java-21-foundation"];
      delete state.enrolledCourses["java-core-mastery"];
      delete state.enrolledCourses["spring-boot-mastery"];

      // Migration bridge: If user previously enrolled any module or legacy course, grant all 3 Spring Boot Track courses
      if (Object.keys(state.enrolledModules).length > 0 || state.enrolledCourses["spring-boot-mastery"]) {
        state.enrolledCourses["spring-boot-foundation"] = true;
        state.enrolledCourses["spring-boot-professional"] = true;
        state.enrolledCourses["spring-boot-architect"] = true;
      }
      const savedActive = localStorage.getItem(ACTIVE_COURSE_KEY);
      if (savedActive && COURSES.some(c => c.id === savedActive && c.isAvailable !== false)) {
        state.activeCourseId = savedActive;
      } else {
        state.activeCourseId = "spring-boot-foundation";
      }
    } catch (e) { /* fresh */ }
  }

  // Course-level access control
  function isCourseEnrolled(courseId) {
    const c = COURSES.find(x => x.id === courseId);
    if (c && c.isAvailable === false) return false;
    const cId = String(courseId);

    // 1. Check local enrollment map (supports both guest & logged in users)
    if (state.enrolledCourses && state.enrolledCourses[cId]) return true;

    // 2. Bridge for spring boot track courses
    const isSpringTrack = ["spring-boot-foundation", "spring-boot-professional", "spring-boot-architect", "spring-boot-mastery"].includes(cId);
    if (isSpringTrack) {
      if (state.enrolledCourses && state.enrolledCourses["spring-boot-mastery"]) return true;
      if (state.enrolledModules && Object.keys(state.enrolledModules).length > 0) return true;
    }

    // 3. Auto-enrolled if user has completed any lesson or quiz in this course
    if (c && (c.modules || []).some(m => (m.lessons || []).some(l => state.completed[l.id]) || (state.quizScores && (state.quizScores[m.id] || state.quizScores[`${c.id}-${m.id}`])))) {
      return true;
    }

    // 4. If current active course, treat as accessible
    if (state.activeCourseId === cId) return true;

    return false;
  }

  function isModuleEnrolled(moduleId) {
    return isCourseEnrolled(state.activeCourseId);
  }

  async function enrollCourse(courseId, silent = false) {
    const cId = String(courseId);
    const course = COURSES.find(c => c.id === cId) || { title: cId, shortTitle: cId };

    // Enroll locally immediately (Guest & Logged-in friendly)
    state.enrolledCourses[cId] = true;
    if (["spring-boot-foundation", "spring-boot-professional", "spring-boot-architect"].includes(cId)) {
      if (course && course.modules) {
        course.modules.forEach(m => { state.enrolledModules[String(m.id)] = true; });
      }
    }
    save();

    // If user is authenticated, sync to Supabase Cloud
    if (state.currentUser) {
      supabaseCall("/user_enrollments", "POST", {
        user_id: state.currentUser.id,
        module_id: cId
      }, { "Prefer": "resolution=merge-duplicates" }).catch(err => console.warn(err));
    }

    if (!silent) {
      toast(`🎉 Chúc mừng! Bạn đã ghi danh thành công khóa học <strong>${escapeHtml(course.title || cId)}</strong>!`);
    }
    enterCourse(cId);
    return true;
  }

  async function unenrollCourse(courseId) {
    const cId = String(courseId);
    const course = COURSES.find(c => c.id === cId) || { title: cId };
    if (!confirm(`Bạn có chắc muốn hủy ghi danh khóa học "${course.title}" khỏi danh sách học cá nhân?\n(Lịch sử bài học đã làm vẫn được lưu trữ an toàn)`)) {
      return;
    }

    delete state.enrolledCourses[cId];
    if (cId === "spring-boot-mastery") {
      state.enrolledModules = {};
    }
    save();

    if (state.currentUser) {
      await supabaseCall("/user_enrollments?user_id=eq." + state.currentUser.id + "&module_id=eq." + encodeURIComponent(cId), "DELETE")
        .catch(e => console.warn(e));

      if (cId === "spring-boot-mastery") {
        for (let i = 0; i <= 7; i++) {
          supabaseCall("/user_enrollments?user_id=eq." + state.currentUser.id + "&module_id=eq." + i, "DELETE").catch(() => {});
        }
      }
    }

    toast(`ℹ️ Đã hủy ghi danh khóa học "${escapeHtml(course.title)}".`);
    renderAll();
  }

  function updateBrandText(c) {
    const brandText = $("#brandText");
    if (!brandText) return;
    const isPlatformMode = state.view === "courses" || state.view === "user-dashboard";
    if (isPlatformMode) {
      brandText.innerHTML = `DevMastery <span class="grad-text">Academy</span>`;
      return;
    }
    const target = c || getActiveCourse();
    const title = (target.shortTitle || target.title || "").trim();
    if (title.endsWith("Mastery")) {
      const prefix = title.replace(/\s*Mastery$/, "");
      brandText.innerHTML = `${escapeHtml(prefix)} <span class="grad-text">Mastery</span>`;
    } else {
      const parts = title.split(" ");
      if (parts.length > 1) {
        const last = parts.pop();
        brandText.innerHTML = `${escapeHtml(parts.join(" "))} <span class="grad-text">${escapeHtml(last)}</span>`;
      } else {
        brandText.innerHTML = `<span class="grad-text">${escapeHtml(title)}</span>`;
      }
    }
  }

  function enterCourse(courseId, forceLesson = false) {
    const c = COURSES.find(x => x.id === courseId);
    if (!c) return;
    state.activeCourseId = c.id;
    localStorage.setItem(ACTIVE_COURSE_KEY, c.id);
    updateBrandText(c);

    // Auto-enroll locally if not yet enrolled
    if (!state.enrolledCourses[c.id]) {
      state.enrolledCourses[c.id] = true;
      save();
    }

    const prog = overallProgress(c.id);
    if (forceLesson || prog.done > 0) {
      const items = allItems(c.id);
      const nextItem = items.find(x => x.lesson.type !== "quiz" && !state.completed[x.lesson.id]) || items[0];
      if (nextItem) {
        gotoLesson(nextItem.lesson.id);
        toast(`📚 Tiếp tục học khóa <strong>${escapeHtml(c.shortTitle)}</strong>: ${escapeHtml(nextItem.lesson.title)}`);
        return;
      }
    }
    gotoView("dashboard");
    toast(`📚 Đã mở khóa học: <strong>${escapeHtml(c.title)}</strong>`);
  }

  function switchCourse(courseId, targetLessonId = null) {
    const c = COURSES.find(x => x.id === courseId);
    if (!c) return;
    state.activeCourseId = c.id;
    localStorage.setItem(ACTIVE_COURSE_KEY, c.id);

    // Update Brand Text
    updateBrandText(c);

    if (targetLessonId) {
      gotoLesson(targetLessonId);
    } else {
      gotoView("dashboard");
    }
    toast(`📚 Đã chuyển sang khóa học: <strong>${escapeHtml(c.title)}</strong>`);
  }

  // Backward-compatibility aliases
  async function enrollModule(moduleId, silent = false) {
    return enrollCourse(state.activeCourseId, silent);
  }
  async function enrollAllModules() {
    return enrollCourse(state.activeCourseId);
  }
  async function unenrollModule(moduleId) {
    return unenrollCourse(state.activeCourseId);
  }

  // ---------- Supabase Direct Cloud Integration ----------
  const SUPABASE_URL = "https://rdtvdhliqnbflqstatsq.supabase.co";
  const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdHZkaGxpcW5iZmxxc3RhdHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTM2MTAsImV4cCI6MjA4MzQyOTYxMH0._PuQmvqp026dvpEYgM0sbEZqhQk6sg4C4dz0hKrxp90";

  async function hashPassword(str) {
    const enc = new TextEncoder().encode(str + "_sbmastery_salt");
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function supabaseCall(endpoint, method = "GET", body = null, extraHeaders = {}) {
    const headers = {
      "apikey": SUPABASE_ANON,
      "Authorization": "Bearer " + SUPABASE_ANON,
      "Content-Type": "application/json",
      ...extraHeaders
    };
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(SUPABASE_URL + "/rest/v1" + endpoint, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err && (err.message || err.detail) ? (err.message || err.detail) : ("Lỗi Supabase HTTP " + res.status));
      }
      if (res.status === 204) return null;
      return await res.json().catch(() => null);
    } catch (err) {
      console.warn("Supabase API Error [" + endpoint + "]:", err.message);
      throw err;
    }
  }

  async function syncLocalAndCloud() {
    if (!state.currentUser) return;
    const uid = state.currentUser.id;
    try {
      // 1. Lấy bài học đã hoàn thành từ Supabase
      const remoteLessons = await supabaseCall("/user_lesson_progress?user_id=eq." + uid + "&completed=eq.true&select=lesson_id");
      if (Array.isArray(remoteLessons)) {
        remoteLessons.forEach(r => { state.completed[r.lesson_id] = true; });
      }

      // 2. Lấy điểm quiz từ Supabase
      const remoteQuiz = await supabaseCall("/user_quiz_results?user_id=eq." + uid + "&select=module_id,score,total_questions");
      if (Array.isArray(remoteQuiz)) {
        remoteQuiz.forEach(r => {
          state.quizScores[r.module_id] = { score: r.score, total: r.total_questions };
        });
      }

      // 2b. Lấy danh sách khóa học đã ghi danh từ Supabase
      const remoteEnrolls = await supabaseCall("/user_enrollments?user_id=eq." + uid + "&select=module_id,enrolled_at");
      if (Array.isArray(remoteEnrolls)) {
        remoteEnrolls.forEach(r => {
          const mid = String(r.module_id);
          if (["spring-boot-foundation", "spring-boot-professional", "spring-boot-architect", "spring-boot-mastery", "0", "1", "2", "3", "4", "5", "6", "7"].includes(mid)) {
            state.enrolledCourses["spring-boot-foundation"] = true;
            state.enrolledCourses["spring-boot-professional"] = true;
            state.enrolledCourses["spring-boot-architect"] = true;
          } else {
            state.enrolledCourses[mid] = true;
          }
        });
      }

      save();
      renderAll();
    } catch (e) {
      console.warn("Sync cloud failed:", e);
    }
  }

  function syncCompleteLessonCloud(lessonId) {
    if (!state.currentUser) return;
    supabaseCall("/user_lesson_progress", "POST", {
      user_id: state.currentUser.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString()
    }, { "Prefer": "resolution=merge-duplicates" }).catch(err => console.warn(err));
  }

  function syncUncompleteLessonCloud(lessonId) {
    if (!state.currentUser) return;
    supabaseCall("/user_lesson_progress?user_id=eq." + state.currentUser.id + "&lesson_id=eq." + lessonId, "DELETE")
      .catch(err => console.warn(err));
  }

  function syncQuizCloud(moduleId, score, totalQuestions) {
    if (!state.currentUser) return;
    supabaseCall("/user_quiz_results", "POST", {
      user_id: state.currentUser.id,
      module_id: String(moduleId),
      score: score,
      total_questions: totalQuestions,
      passed: (score / totalQuestions) >= 0.8
    }, { "Prefer": "resolution=merge-duplicates" }).catch(err => console.warn(err));
  }

  // ---------- Auth & User UI ----------
  function updateAuthUI() {
    const authBtn = $("#authBtn");
    const authBtnText = $("#authBtnText");
    const userDropdown = $("#userDropdown");
    const dropdownAvatar = $("#dropdownAvatar");
    const dropdownName = $("#dropdownName");
    const dropdownEmail = $("#dropdownEmail");

    if (state.currentUser) {
      const displayName = state.currentUser.full_name || state.currentUser.fullName || state.currentUser.username;
      authBtnText.textContent = displayName;
      authBtn.title = "Xin chào, " + displayName;
      if (dropdownAvatar) dropdownAvatar.textContent = displayName.charAt(0).toUpperCase();
      if (dropdownName) dropdownName.textContent = displayName;
      if (dropdownEmail) dropdownEmail.textContent = state.currentUser.email || "";
    } else {
      authBtnText.textContent = "Đăng nhập";
      authBtn.title = "Tài khoản học viên";
      if (userDropdown) userDropdown.style.display = "none";
    }
  }

  function showAuthAlert(msg, isError = true) {
    const alert = $("#authAlert");
    if (!alert) return;
    alert.textContent = msg;
    alert.className = isError ? "auth-alert error" : "auth-alert success";
    alert.style.display = "block";
  }

  function hideAuthAlert() {
    const alert = $("#authAlert");
    if (alert) alert.style.display = "none";
  }

  function openAuthModal(tab = "login") {
    const backdrop = $("#authModalBackdrop");
    const tabLogin = $("#tabLogin");
    const tabRegister = $("#tabRegister");
    const formLogin = $("#loginForm");
    const formRegister = $("#registerForm");
    const modalTitle = $("#authModalTitle");

    hideAuthAlert();
    if (tab === "login") {
      if (tabLogin) tabLogin.classList.add("active");
      if (tabRegister) tabRegister.classList.remove("active");
      if (formLogin) formLogin.style.display = "flex";
      if (formRegister) formRegister.style.display = "none";
      if (modalTitle) modalTitle.textContent = "Đăng Nhập Khóa Học";
    } else {
      if (tabRegister) tabRegister.classList.add("active");
      if (tabLogin) tabLogin.classList.remove("active");
      if (formLogin) formLogin.style.display = "none";
      if (formRegister) formRegister.style.display = "flex";
      if (modalTitle) modalTitle.textContent = "Tạo Tài Khoản Khóa Học";
    }
    if (backdrop) {
      backdrop.style.display = "flex";
      backdrop.scrollTop = 0;
    }
    if (window.innerWidth > 640) {
      setTimeout(() => {
        const target = tab === "login" ? $("#loginUsername") : $("#regFullName");
        if (target) target.focus({ preventScroll: true });
      }, 50);
    }
  }

  function closeAuthModal() {
    const backdrop = $("#authModalBackdrop");
    if (backdrop) backdrop.style.display = "none";
    hideAuthAlert();
  }

  // ---------- Certificate Management ----------
  let currentCertData = null;

  function generateCertCode(courseId, studentName) {
    const cleanId = (courseId || "sb").replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase();
    const hash = Math.abs(
      (studentName + courseId).split("").reduce((acc, ch) => ((acc << 5) - acc) + ch.charCodeAt(0), 0)
    ) % 9000 + 1000;
    return `UC-DEVMASTERY-${cleanId}-${hash}`;
  }

  function openCertificateModal(courseId) {
    const course = COURSES.find((c) => c.id === courseId) || getActiveCourse();
    const user = state.currentUser;
    const defaultName = (user && (user.full_name || user.fullName || user.username)) || "Học viên DevMastery Pro";

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const dateFormatted = `${day}/${month}/${year}`;

    const code = generateCertCode(course.id, defaultName);

    currentCertData = {
      course,
      studentName: defaultName,
      date: dateFormatted,
      code: code
    };

    const inputName = $("#certStudentNameInput");
    if (inputName) inputName.value = defaultName;

    const nameDisplay = $("#certStudentNameDisplay");
    if (nameDisplay) nameDisplay.textContent = defaultName;

    const titleDisplay = $("#certCourseTitleDisplay");
    if (titleDisplay) titleDisplay.textContent = course.title;

    const descDisplay = $("#certCourseDescDisplay");
    if (descDisplay) {
      descDisplay.textContent = `${course.modulesCount || 8} Module kiến trúc Enterprise, ${course.lessonsCount || 64} bài giảng chuyên sâu & ${course.quizCount || 256} câu hỏi sát hạch kỹ sư phần mềm`;
    }

    const codeDisplay = $("#certCodeDisplay");
    if (codeDisplay) codeDisplay.textContent = code;

    const dateDisplay = $("#certDateDisplay");
    if (dateDisplay) dateDisplay.textContent = dateFormatted;

    const backdrop = $("#certModalBackdrop");
    if (backdrop) {
      backdrop.style.display = "flex";
      backdrop.scrollTop = 0;
    }
  }

  function closeCertificateModal() {
    const backdrop = $("#certModalBackdrop");
    if (backdrop) backdrop.style.display = "none";
  }

  function updateCertificateStudentName() {
    const input = $("#certStudentNameInput");
    if (!input || !currentCertData) return;
    const newName = input.value.trim() || "Học viên DevMastery Pro";
    currentCertData.studentName = newName;
    currentCertData.code = generateCertCode(currentCertData.course.id, newName);

    const nameDisplay = $("#certStudentNameDisplay");
    if (nameDisplay) nameDisplay.textContent = newName;

    const codeDisplay = $("#certCodeDisplay");
    if (codeDisplay) codeDisplay.textContent = currentCertData.code;

    toast(`✅ Đã cập nhật tên chứng chỉ: <strong>${escapeHtml(newName)}</strong>`);
  }

  function downloadCertificateAsPng() {
    if (!currentCertData) return;

    const canvas = document.createElement("canvas");
    canvas.width = 2400;
    canvas.height = 1700;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { course, studentName, date, code } = currentCertData;

    // 1. Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 2400, 1700);

    // Subtle inner gradient
    const gradBg = ctx.createRadialGradient(1200, 850, 200, 1200, 850, 1100);
    gradBg.addColorStop(0, "#ffffff");
    gradBg.addColorStop(1, "#faf8f2");
    ctx.fillStyle = gradBg;
    ctx.fillRect(80, 80, 2240, 1540);

    // 2. Borders
    ctx.strokeStyle = "#c29d45";
    ctx.lineWidth = 14;
    ctx.strokeRect(60, 60, 2280, 1580);

    ctx.strokeStyle = "#f3e8c9";
    ctx.lineWidth = 6;
    ctx.strokeRect(82, 82, 2236, 1536);

    ctx.strokeStyle = "#c29d45";
    ctx.lineWidth = 2;
    ctx.strokeRect(96, 96, 2208, 1508);

    // Corner Accents
    ctx.strokeStyle = "#b4690e";
    ctx.lineWidth = 4;
    ctx.strokeRect(108, 108, 36, 36);
    ctx.strokeRect(2256, 108, 36, 36);
    ctx.strokeRect(108, 1556, 36, 36);
    ctx.strokeRect(2256, 1556, 36, 36);

    // 3. Header: Brand & Code
    ctx.fillStyle = "#a435f0";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(140, 140, 64, 64, 12);
    } else {
      ctx.rect(140, 140, 64, 64);
    }
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 38px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("U", 172, 174);

    ctx.fillStyle = "#1c1d1f";
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("DevMastery Academy", 220, 174);

    ctx.fillStyle = "#6a6f73";
    ctx.font = "600 24px monospace";
    ctx.textAlign = "right";
    ctx.fillText("MÃ XÁC THỰC: " + code, 2260, 174);

    // 4. Kicker & Main Title
    ctx.textAlign = "center";
    ctx.fillStyle = "#b4690e";
    ctx.font = "800 28px system-ui, sans-serif";
    ctx.fillText("CHỨNG NHẬN TỐT NGHIỆP", 1200, 310);

    ctx.fillStyle = "#1c1d1f";
    ctx.font = "900 68px Georgia, serif";
    ctx.fillText("CERTIFICATE OF COMPLETION", 1200, 390);

    ctx.strokeStyle = "#c29d45";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(950, 430);
    ctx.lineTo(1450, 430);
    ctx.stroke();

    // 5. Body Text & Recipient Name
    ctx.fillStyle = "#555555";
    ctx.font = "italic 32px Georgia, serif";
    ctx.fillText("Chứng chỉ này trang trọng ghi nhận và xác nhận rằng", 1200, 520);

    ctx.fillStyle = "#1c1d1f";
    ctx.font = "900 76px Georgia, serif";
    ctx.fillText(studentName, 1200, 630);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    const nameWidth = Math.min(ctx.measureText(studentName).width + 120, 1400);
    ctx.beginPath();
    ctx.moveTo(1200 - nameWidth / 2, 660);
    ctx.lineTo(1200 + nameWidth / 2, 660);
    ctx.stroke();

    ctx.fillStyle = "#666666";
    ctx.font = "28px system-ui, sans-serif";
    ctx.fillText("đã hoàn thành xuất sắc toàn bộ yêu cầu học tập và sát hạch chuyên môn khóa học:", 1200, 740);

    ctx.fillStyle = "#a435f0";
    ctx.font = "900 56px system-ui, sans-serif";
    ctx.fillText(course.title, 1200, 830);

    ctx.fillStyle = "#6a6f73";
    ctx.font = "28px system-ui, sans-serif";
    const specs = `${course.modulesCount || 8} Module kiến trúc Enterprise, ${course.lessonsCount || 64} bài giảng chuyên sâu & ${course.quizCount || 256} câu hỏi sát hạch kỹ sư phần mềm`;
    ctx.fillText(specs, 1200, 900);

    // 6. Footer (Signatures, Seal, Date)
    ctx.textAlign = "left";
    ctx.font = "italic 60px 'Brush Script MT', 'Dancing Script', 'Caveat', cursive, Georgia";
    ctx.fillStyle = "#1c1d1f";
    ctx.fillText("Văn Đức IT", 260, 1260);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(260, 1290);
    ctx.lineTo(660, 1290);
    ctx.stroke();

    ctx.fillStyle = "#1c1d1f";
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.fillText("Nguyễn Văn Đức", 260, 1335);

    ctx.fillStyle = "#6a6f73";
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText("Trưởng ban Giảng huấn DevMastery", 260, 1375);

    // Center Gold Seal
    ctx.save();
    ctx.translate(1200, 1320);

    const sealGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 110);
    sealGrad.addColorStop(0, "#fffbee");
    sealGrad.addColorStop(0.7, "#fef3c7");
    sealGrad.addColorStop(1, "#fde68a");
    ctx.fillStyle = sealGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#b4690e";
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 98, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#b4690e";
    ctx.font = "20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★ ★ ★ ★ ★", 0, -50);

    ctx.fillStyle = "#92400e";
    ctx.font = "900 22px system-ui, sans-serif";
    ctx.fillText("VERIFIED", 0, -18);
    ctx.fillText("HONOR", 0, 10);
    ctx.fillText("GRADUATE", 0, 38);

    ctx.fillStyle = "#b4690e";
    ctx.font = "800 22px system-ui, sans-serif";
    ctx.fillText("2026", 0, 70);
    ctx.restore();

    // Right: Date & Verification
    ctx.textAlign = "right";
    ctx.fillStyle = "#1c1d1f";
    ctx.font = "700 32px system-ui, sans-serif";
    ctx.fillText(date, 2140, 1260);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(1740, 1290);
    ctx.lineTo(2140, 1290);
    ctx.stroke();

    ctx.fillStyle = "#6a6f73";
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText("Ngày cấp chứng chỉ", 2140, 1335);

    ctx.fillStyle = "#15803d";
    ctx.font = "700 22px system-ui, sans-serif";
    ctx.fillText("✓ Đã xác thực trên DevMastery", 2140, 1375);

    // Export to file download
    const cleanFileName = `Chung_Chi_DevMastery_${course.id}_${studentName.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = cleanFileName;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast(`🎉 Đã tải xuống chứng chỉ chất lượng cao: <strong>${escapeHtml(cleanFileName)}</strong>`);
  }

  window.DevMasteryOpenCert = openCertificateModal;

  // ---------- Image & Diagram Lightbox Controller ----------
  const lbState = {
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
  };

  function updateLightboxTransform() {
    const canvas = $("#lightboxCanvas");
    const zoomVal = $("#lightboxZoomVal");
    if (canvas) {
      canvas.style.transform = `translate(${lbState.panX}px, ${lbState.panY}px) scale(${lbState.zoom})`;
    }
    if (zoomVal) {
      zoomVal.textContent = Math.round(lbState.zoom * 100) + "%";
    }
  }

  function setLightboxZoom(newZoom) {
    lbState.zoom = Math.max(0.4, Math.min(5.0, Math.round(newZoom * 100) / 100));
    updateLightboxTransform();
  }

  function resetLightboxZoom() {
    lbState.zoom = 1.0;
    lbState.panX = 0;
    lbState.panY = 0;
    updateLightboxTransform();
  }

  function openImageLightbox(type, content, title) {
    const modal = $("#imageLightboxModal");
    const canvas = $("#lightboxCanvas");
    const titleEl = $("#lightboxTitle");
    if (!modal || !canvas) return;

    resetLightboxZoom();
    canvas.innerHTML = "";

    if (type === "img") {
      const img = document.createElement("img");
      img.src = content;
      img.alt = title || "Ảnh bài học";
      canvas.appendChild(img);
    } else if (type === "svg") {
      const clone = content.cloneNode(true);
      clone.removeAttribute("width");
      clone.removeAttribute("height");
      clone.style.maxWidth = "none";
      clone.style.height = "auto";
      canvas.appendChild(clone);
    }

    if (titleEl) {
      titleEl.textContent = title || (type === "svg" ? "Sơ đồ kiến trúc Mermaid" : "Hình ảnh minh họa");
    }

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeImageLightbox() {
    const modal = $("#imageLightboxModal");
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
    const canvas = $("#lightboxCanvas");
    if (canvas) canvas.innerHTML = "";
  }

  // ---------- Navigation & Progress Helpers ----------
  function findLesson(id) {
    // 1. Search active course
    const active = getActiveCourse();
    for (const m of (active.modules || [])) {
      const l = (m.lessons || []).find((x) => x.id === id);
      if (l) return { course: active, module: m, lesson: l };
    }
    // 2. Search all courses
    for (const c of COURSES) {
      for (const m of (c.modules || [])) {
        const l = (m.lessons || []).find((x) => x.id === id);
        if (l) return { course: c, module: m, lesson: l };
      }
    }
    return null;
  }

  function isLessonDemo(c, m, l) {
    if (!c || !l) return false;
    if (l.isFreePreview) return true;
    if (c.modules && c.modules.length > 0 && m && c.modules[0].id === m.id) {
      const firstLesson = (c.modules[0].lessons || []).find(x => x.type !== "quiz");
      return firstLesson && firstLesson.id === l.id;
    }
    return false;
  }

  function allItems(courseId = state.activeCourseId) {
    const c = COURSES.find(x => x.id === courseId) || getActiveCourse();
    const items = [];
    (c.modules || []).forEach((m) => (m.lessons || []).forEach((l) => items.push({ course: c, module: m, lesson: l })));
    return items;
  }

  function flatIndex(courseId = state.activeCourseId) {
    const items = allItems(courseId);
    return items.filter((x) => x.lesson.type !== "quiz")
      .concat(items.filter((x) => x.lesson.type === "quiz"));
  }

  function moduleProgress(m) {
    const lessons = m.lessons || [];
    const done = lessons.filter((l) => state.completed[l.id]).length;
    return { done, total: lessons.length, pct: lessons.length ? Math.round((done / lessons.length) * 100) : 0 };
  }

  function overallProgress(courseId = state.activeCourseId) {
    const items = allItems(courseId);
    const done = items.filter((x) => state.completed[x.lesson.id]).length;
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  }

  function totalPlatformProgress() {
    let totalDone = 0;
    let totalLessons = 0;
    COURSES.forEach(c => {
      const items = allItems(c.id);
      totalLessons += items.filter(x => x.lesson.type !== "quiz").length;
      totalDone += items.filter(x => x.lesson.type !== "quiz" && state.completed[x.lesson.id]).length;
    });
    return { done: totalDone, total: totalLessons, pct: totalLessons ? Math.round((totalDone / totalLessons) * 100) : 0 };
  }

  function toast(msg, duration = 3000) {
    const t = $("#toast");
    if (!t) return;
    t.innerHTML = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
      t.classList.remove("show");
    }, duration);
  }

  function dismissToast() {
    const t = $("#toast");
    if (t) {
      clearTimeout(t._timer);
      t.classList.remove("show");
    }
  }

  // ---------- Markdown Parser ----------
  function renderMarkdown(md) {
    if (!md) return "";
    let html = "";
    const lines = md.split("\n");
    let i = 0;

    const codeBlock = (fence, lang) => {
      let code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith(fence)) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      const rawCode = code.join("\n");
      const cleanLang = (lang || "java").trim().toLowerCase();
      if (cleanLang === "mermaid") {
        return `<div class="mermaid">${escapeHtml(rawCode)}</div>`;
      }
      return codeHtml(rawCode, cleanLang);
    };

    while (i < lines.length) {
      const line = lines[i];

      // Fenced code: support both ~~~ and ```
      if (line.startsWith("~~~") || line.startsWith("```")) {
        const fence = line.startsWith("~~~") ? "~~~" : "```";
        const lang = line.slice(3).trim();
        html += codeBlock(fence, lang);
        continue;
      }

      // Callouts :::type Title ... :::
      if (line.startsWith(":::")) {
        const parts = line.slice(3).trim().split(" ");
        const type = parts[0] || "info";
        const title = parts.slice(1).join(" ");
        const icons = { tip: "💡", warn: "⚠️", danger: "🚫", info: "ℹ️", laas: "🏢", takeaways: "🎯", beginner: "🌱", analogy: "💡" };
        let buf = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(":::")) {
          buf.push(lines[i]);
          i++;
        }
        i++; // skip closing
        const inner = renderMarkdown(buf.join("\n"));
        const icon = icons[type] || "ℹ️";
        const t = title ? `<div class="callout-title">${inline(title)}</div>` : "";
        if (type === "takeaways") {
          html += `<div class="key-takeaways"><h3>🎯 Ghi nhớ bài học</h3>${inner}</div>`;
        } else {
          html += `<div class="callout ${type}"><div class="callout-icon">${icon}</div><div class="callout-body">${t}${inner}</div></div>`;
        }
        continue;
      }

      // Headings
      if (line.startsWith("###### ")) { html += `<h6>${inline(line.slice(7))}</h6>`; i++; continue; }
      if (line.startsWith("##### ")) { html += `<h5>${inline(line.slice(6))}</h5>`; i++; continue; }
      if (line.startsWith("#### ")) { html += `<h4>${inline(line.slice(5))}</h4>`; i++; continue; }
      if (line.startsWith("### ")) { html += `<h3>${inline(line.slice(4))}</h3>`; i++; continue; }
      if (line.startsWith("## ")) { html += `<h2>${inline(line.slice(3))}</h2>`; i++; continue; }
      if (line.startsWith("# ")) { html += `<h1>${inline(line.slice(2))}</h1>`; i++; continue; }

      // HR
      if (/^---+$/.test(line.trim())) { html += `<hr>`; i++; continue; }

      // Table
      if (line.trim().startsWith("|") && i + 1 < lines.length &&
          /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        let tbl = [`<div class="table-wrap"><table>`];
        const parseRow = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "")
          .split("|").map((c) => c.trim());
        const headers = parseRow(line);
        tbl.push("<thead><tr>" + headers.map((h) => `<th>${inline(h)}</th>`).join("") + "</tr></thead>");
        i += 2;
        tbl.push("<tbody>");
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          const cells = parseRow(lines[i]);
          tbl.push("<tr>" + cells.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>");
          i++;
        }
        tbl.push("</tbody></table></div>");
        html += tbl.join("");
        continue;
      }

      // Checklist
      if (/^\s*- \[ \] /.test(line)) {
        let buf = [];
        while (i < lines.length && /^\s*- \[ \] /.test(lines[i])) {
          buf.push(`<li>${inline(lines[i].replace(/^\s*- \[ \] /, ""))}</li>`);
          i++;
        }
        html += `<ul class="checklist">${buf.join("")}</ul>`;
        continue;
      }

      // Lists
      if (/^\s*[-*] /.test(line)) {
        let buf = [];
        while (i < lines.length && /^\s*[-*] /.test(lines[i])) {
          buf.push(`<li>${inline(lines[i].replace(/^\s*[-*] /, ""))}</li>`);
          i++;
        }
        html += `<ul>${buf.join("")}</ul>`;
        continue;
      }
      if (/^\s*\d+\. /.test(line)) {
        let buf = [];
        while (i < lines.length && /^\s*\d+\. /.test(lines[i])) {
          buf.push(`<li>${inline(lines[i].replace(/^\s*\d+\. /, ""))}</li>`);
          i++;
        }
        html += `<ol>${buf.join("")}</ol>`;
        continue;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        let buf = [];
        while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
          buf.push(lines[i].replace(/^> ?/, ""));
          i++;
        }
        html += `<blockquote>${renderMarkdown(buf.join("\n"))}</blockquote>`;
        i++;
        continue;
      }

      // Paragraph
      if (line.trim() === "") { i++; continue; }
      let para = [line];
      i++;
      while (i < lines.length && lines[i].trim() !== "" &&
             !lines[i].startsWith("~~~") && !lines[i].startsWith("```") &&
             !lines[i].startsWith(":::") && !lines[i].startsWith("#") && !lines[i].trim().startsWith("|") &&
             !/^\s*[-*] /.test(lines[i]) && !/^\s*\d+\. /.test(lines[i]) &&
             !lines[i].startsWith("> ") && !/^---+$/.test(lines[i].trim())) {
        para.push(lines[i]);
        i++;
      }
      html += `<p>${inline(para.join("\n"))}</p>`;
    }

    return html;
  }

  function inline(s) {
    if (!s) return "";
    s = escapeHtml(s);
    // Restore safe inline tags
    s = s.replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/gi, "<code>$1</code>");
    s = s.replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/gi, "<mark>$1</mark>");
    s = s.replace(/&lt;kbd&gt;([\s\S]*?)&lt;\/kbd&gt;/gi, "<kbd>$1</kbd>");
    s = s.replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, "<b>$1</b>");
    s = s.replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/gi, "<strong>$1</strong>");
    s = s.replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, "<i>$1</i>");
    s = s.replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/gi, "<em>$1</em>");
    s = s.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, "<u>$1</u>");
    s = s.replace(/&lt;del&gt;([\s\S]*?)&lt;\/del&gt;/gi, "<del>$1</del>");
    s = s.replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/gi, "<s>$1</s>");
    s = s.replace(/&lt;sup&gt;([\s\S]*?)&lt;\/sup&gt;/gi, "<sup>$1</sup>");
    s = s.replace(/&lt;sub&gt;([\s\S]*?)&lt;\/sub&gt;/gi, "<sub>$1</sub>");
    s = s.replace(/&lt;small&gt;([\s\S]*?)&lt;\/small&gt;/gi, "<small>$1</small>");
    s = s.replace(/&lt;br\s*\/?&gt;/gi, "<br>");

    // Markdown formatting
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    s = s.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
    s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="lesson-img" loading="lazy" title="Nhấp để phóng to ảnh">');
    s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#)[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');

    s = s.replace(/\n/g, "<br>");
    return s;
  }

  // ---------- Udemy-Style Sidebar Architecture ----------
  function updateSidebarFooter() {
    const isPlatformMode = state.view === "courses" || state.view === "user-dashboard";
    const label = $(".streak-label");
    const val = $(".streak-value");
    const sub = $("#streakSub");
    if (!label || !val || !sub) return;

    if (isPlatformMode) {
      label.textContent = "🎯 Hệ sinh thái đào tạo";
      val.textContent = "DevMastery Platform";
      sub.textContent = `${COURSES.length} Khóa học thực chiến · 4 Lộ trình`;
    } else {
      const activeCourse = getActiveCourse();
      label.textContent = "🎯 Mục tiêu khóa học";
      val.textContent = activeCourse.level || "Zero → Production";
      sub.textContent = `${activeCourse.modulesCount} module · ${activeCourse.lessonsCount} bài · ${activeCourse.hours}`;
    }
  }

  function renderSidebar(activeLessonId) {
    const nav = $("#sidebarNav");
    if (!nav) return;

    updateSidebarFooter();

    const isPlatformMode = state.view === "courses" || state.view === "user-dashboard";
    if (isPlatformMode) {
      renderPlatformSidebar(nav);
    } else {
      renderCourseSidebar(nav, activeLessonId);
    }
  }

  // --- Mode 1: Platform Navigation Sidebar (Trang chủ / Khám phá & Học tập của tôi) ---
  function renderPlatformSidebar(nav) {
    const enrolledCourses = COURSES.filter(c => c.isAvailable !== false && isCourseEnrolled(c.id));
    const activeCat = state.catalogCategory || "all";

    let html = `
      <div class="sidebar-platform">
        <!-- Main Navigation Section -->
        <div class="sp-group">
          <div class="sp-group-title">ĐIỀU HƯỚNG NỀN TẢNG</div>
          <a class="sp-nav-item ${state.view === "courses" ? "active" : ""}" data-view="courses">
            <span class="sp-icon">🌟</span>
            <div class="sp-content">
              <div class="sp-title">Khám phá khóa học</div>
              <div class="sp-sub">Tất cả khóa học có sẵn (${COURSES.filter(c => c.isAvailable !== false).length})</div>
            </div>
          </a>
          <a class="sp-nav-item ${state.view === "user-dashboard" ? "active" : ""}" data-view="user-dashboard">
            <span class="sp-icon">📚</span>
            <div class="sp-content">
              <div class="sp-title">Học tập của tôi</div>
              <div class="sp-sub">${enrolledCourses.length > 0 ? `${enrolledCourses.length} khóa đã ghi danh` : "Tiến độ học & chứng chỉ"}</div>
            </div>
            ${enrolledCourses.length > 0 ? `<span class="sp-badge">${enrolledCourses.length}</span>` : ""}
          </a>
        </div>

        <div class="sp-divider"></div>

        <!-- Course Categories / Topics Section -->
        <div class="sp-group">
          <div class="sp-group-title">DANH MỤC KHÓA HỌC</div>
          <div class="sp-categories">
            <button class="sp-cat-btn ${activeCat === "all" ? "active" : ""}" data-cat-filter="all">
              <span class="sp-cat-icon">⚡</span>
              <span class="sp-cat-label">Tất cả danh mục</span>
              <span class="sp-cat-pill">${COURSES.filter(c => c.isAvailable !== false).length}</span>
            </button>
            <button class="sp-cat-btn ${activeCat === "backend" ? "active" : ""}" data-cat-filter="backend">
              <span class="sp-cat-icon">🍃</span>
              <span class="sp-cat-label">Backend &amp; Java</span>
              <span class="sp-cat-pill">${COURSES.filter(c => c.isAvailable !== false && c.category === "backend").length}</span>
            </button>
            <button class="sp-cat-btn ${activeCat === "frontend" ? "active" : ""}" data-cat-filter="frontend">
              <span class="sp-cat-icon">⚛️</span>
              <span class="sp-cat-label">Frontend &amp; Web</span>
              <span class="sp-cat-pill">${COURSES.filter(c => c.isAvailable !== false && c.category === "frontend").length}</span>
            </button>
            <button class="sp-cat-btn ${activeCat === "devops" ? "active" : ""}" data-cat-filter="devops">
              <span class="sp-cat-icon">☸️</span>
              <span class="sp-cat-label">DevOps &amp; Cloud</span>
              <span class="sp-cat-pill">${COURSES.filter(c => c.isAvailable !== false && c.category === "devops").length}</span>
            </button>
          </div>
        </div>

        <!-- Enrolled Courses Quick Access Section -->
        ${enrolledCourses.length > 0 ? `
          <div class="sp-divider"></div>
          <div class="sp-group">
            <div class="sp-group-title">KHÓA HỌC CỦA BẠN (TRUY CẬP NHANH)</div>
            <div class="sp-enrolled-courses">
              ${enrolledCourses.map(c => {
                const prog = overallProgress(c.id);
                const isCurActive = c.id === state.activeCourseId;
                return `
                  <div class="sp-enrolled-item ${isCurActive ? "current-learning" : ""}" data-enter-course="${c.id}" title="Nhấp để vào học ngay khóa này">
                    <div class="sp-ei-top">
                      <span class="sp-ei-icon">${c.icon}</span>
                      <div class="sp-ei-info">
                        <div class="sp-ei-title">${escapeHtml(c.shortTitle)}</div>
                        <div class="sp-ei-meta">${prog.done}/${c.lessonsCount} bài · ${prog.pct}%</div>
                      </div>
                      <span class="sp-ei-arrow">→</span>
                    </div>
                    <div class="sp-ei-bar">
                      <div class="sp-ei-fill" style="width: ${prog.pct}%"></div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : `
          <div class="sp-empty-enroll">
            <span class="sp-ee-icon">💡</span>
            <p>Bạn chưa ghi danh khóa học nào. Hãy chọn một khóa học để bắt đầu học ngay!</p>
          </div>
        `}

        <div class="sp-box-card">
          <div class="sp-bc-tag">🏆 LỘ TRÌNH ĐÀO TẠO</div>
          <div class="sp-bc-title">Fullstack &amp; Cloud Native</div>
          <p class="sp-bc-desc">Học từ Java Core, Spring Boot, React 19 đến Docker &amp; Kubernetes chuẩn kiến trúc Enterprise.</p>
        </div>
      </div>
    `;

    nav.innerHTML = html;

    // Attach listeners for Platform Sidebar
    $$(".sp-nav-item", nav).forEach(el => {
      el.addEventListener("click", () => gotoView(el.dataset.view));
    });

    $$("[data-cat-filter]", nav).forEach(btn => {
      btn.addEventListener("click", () => {
        state.catalogCategory = btn.dataset.catFilter;
        if (state.view !== "courses") {
          gotoView("courses");
        } else {
          renderCoursesCatalog();
          renderSidebar(null);
        }
      });
    });

    $$("[data-enter-course]", nav).forEach(item => {
      item.addEventListener("click", () => {
        enterCourse(item.dataset.enterCourse);
      });
    });
  }

  // --- Mode 2: Course Learning Sidebar (Udemy Course Content Player) ---
  function renderCourseSidebar(nav, activeLessonId) {
    const activeCourse = getActiveCourse();
    const modules = getActiveModules();
    const isGuest = !state.currentUser;
    const isEnrolled = isCourseEnrolled(activeCourse.id);
    const prog = overallProgress(activeCourse.id);

    let html = `
      <div class="sidebar-course-learning">
        <!-- Back to Courses Catalog Button -->
        <a class="sidebar-back-btn" data-view="courses" title="Quay về trang danh sách tất cả khóa học (Trang chủ)">
          <span class="sbb-arrow">←</span>
          <span class="sbb-text">Tất cả khóa học (Trang chủ)</span>
        </a>

        <!-- Active Course Info Card -->
        <div class="course-brand-box">
          <div class="cbb-header">
            <span class="cbb-icon">${activeCourse.icon}</span>
            <div class="cbb-body">
              <span class="cbb-badge">${escapeHtml(activeCourse.badge)}</span>
              <h3 class="cbb-title">${escapeHtml(activeCourse.shortTitle)}</h3>
            </div>
          </div>
          <div class="cbb-prog-block">
            <div class="cbb-prog-labels">
              <span>Tiến độ khóa học:</span>
              <strong>${prog.done}/${activeCourse.lessonsCount} bài (${prog.pct}%)</strong>
            </div>
            <div class="cbb-prog-bar">
              <div class="cbb-prog-fill" style="width: ${prog.pct}%"></div>
            </div>
            ${prog.pct === 100 ? `
              <button class="cbb-cert-btn" data-open-cert="${activeCourse.id}">
                🎓 Nhận chứng chỉ (100%)
              </button>
            ` : `
              <button class="cbb-cert-preview-btn" data-preview-cert="${activeCourse.id}">
                🎓 Xem mẫu chứng chỉ tốt nghiệp
              </button>
            `}
          </div>
        </div>

        <!-- Course Switcher Trigger Dropdown -->
        <div class="sidebar-course-selector" id="sidebarCourseSelector">
          <div class="scs-current" id="scsCurrentBtn" title="Chuyển đổi khóa học">
            <span class="scs-switch-icon">🔄</span>
            <span class="scs-name">Đổi khóa học khác...</span>
            <span class="scs-arrow">▾</span>
          </div>
          <div class="scs-dropdown" id="scsDropdown" style="display: none;">
            <div class="scs-dropdown-title">CHUYỂN SANG KHÓA HỌC:</div>
            ${COURSES.filter(c => c.isAvailable !== false).map(c => `
              <div class="scs-item ${c.id === activeCourse.id ? "active" : ""}" data-switch-course="${c.id}">
                <span class="scs-item-icon">${c.icon}</span>
                <div class="scs-item-body">
                  <div class="scs-item-title">${escapeHtml(c.shortTitle)}</div>
                  <div class="scs-item-sub">${c.modulesCount} Module · ${c.lessonsCount} bài</div>
                </div>
                ${c.id === activeCourse.id 
                  ? '<span class="scs-active-badge">Đang học</span>' 
                  : isCourseEnrolled(c.id) 
                  ? '<span class="scs-enrolled-badge">Đã ghi danh</span>' 
                  : '<span class="scs-free-badge">Miễn phí</span>'
                }
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Course Internal Navigation Links -->
        <div class="course-internal-nav">
          <a class="nav-home ${state.view === "dashboard" ? "active" : ""}" data-view="dashboard">
            🏠 Tổng quan khóa học
          </a>
          <a class="nav-home ${state.view === "curriculum" ? "active" : ""}" data-view="curriculum">
            📚 Toàn bộ giáo trình
          </a>
        </div>

        ${!isGuest && !isEnrolled ? `
          <div class="sidebar-course-cta">
            <div class="s-cta-title">${activeCourse.icon} ${escapeHtml(activeCourse.shortTitle)}</div>
            <p class="s-cta-desc">Chưa ghi danh khóa học này</p>
            <button class="btn btn-sm btn-primary s-cta-btn" id="btnSidebarEnroll">🚀 Ghi danh khóa này</button>
          </div>
        ` : ""}

        <!-- Course Curriculum Section Header -->
        <div class="sidebar-section-title">
          <span>NỘI DUNG KHÓA HỌC (${modules.length} MODULE)</span>
        </div>

        <!-- Module Accordions (THIS COURSE ONLY) -->
        <div class="course-curriculum-list">
          ${modules.map((m) => {
            const mProg = moduleProgress(m);
            const hasActive = (m.lessons || []).some((l) => l.id === activeLessonId) ||
                              (state.view === "quiz" && state.currentQuizModule === m.id);
            const open = hasActive || mProg.pct > 0;

            return `
            <div class="nav-module mc-${m.id} ${open ? "open" : ""} ${mProg.pct === 100 ? "done" : ""}">
              <div class="nav-module-head" data-module="${m.id}">
                <span class="nm-badge" style="background: var(--mc-color, #22c55e)">${m.icon}</span>
                <span class="nm-title">${m.id}. ${escapeHtml(m.title)}</span>
                ${isEnrolled ? (mProg.pct === 100 ? '<span class="nm-check">✓</span>' : '') : '<span class="nm-lock-icon">🔒</span>'}
                <span class="nm-count">${mProg.done}/${mProg.total}</span>
              </div>
              <div class="nav-lessons">
                ${m.topics && m.topics.length > 0 ? (
                  m.topics.map((t) => {
                    const tLessons = (m.lessons || []).filter(l => l.type !== "quiz" && l.id.split("-")[1] === String(t.id));
                    if (!tLessons.length) return "";
                    const doneCount = tLessons.filter(l => state.completed[l.id]).length;
                    const hasActiveTopic = tLessons.some(l => l.id === activeLessonId);
                    return `
                      <div class="nav-topic-group ${hasActiveTopic ? "open" : ""}">
                        <div class="nav-topic-head" data-topic="${m.id}-${t.id}">
                          <span class="nth-icon">🎯</span>
                          <span class="nth-title">Mục ${m.id}.${t.id}: ${escapeHtml(t.title)}</span>
                          <span class="nth-count ${doneCount === tLessons.length ? "done" : ""}">${doneCount}/${tLessons.length}</span>
                        </div>
                        <div class="nav-topic-lessons">
                          ${tLessons.map((l) => `
                            <div class="nav-lesson ${state.completed[l.id] ? "done" : ""} ${l.id === activeLessonId ? "active" : ""}"
                                 data-lesson="${l.id}">
                              <span class="nl-dot"></span>
                              <span class="nl-title">${isLessonDemo(activeCourse, m, l) ? '<span class="demo-tag-pill" style="background:#f59e0b;color:#000;font-size:9.5px;font-weight:800;padding:1px 4px;border-radius:3px;margin-right:4px;">DEMO</span>' : ''}${escapeHtml(l.title)}</span>
                              <span class="nl-mins">${l.minutes}p</span>
                            </div>
                          `).join("")}
                        </div>
                      </div>
                    `;
                  }).join("") +
                  (() => {
                    const q = (m.lessons || []).find(l => l.type === "quiz");
                    if (!q) return "";
                    const isQuizActive = state.view === "quiz" && state.currentQuizModule === m.id;
                    const quizDone = state.quizScores && typeof state.quizScores[m.id] === "number";
                    return `
                      <div class="nav-module-quiz ${isQuizActive ? "active" : ""} ${quizDone ? "done" : ""}" data-module-quiz="${m.id}">
                        <span class="nmq-icon">🏆</span>
                        <span class="nmq-title">${escapeHtml(q.title)}</span>
                        <span class="nmq-badge">${quizDone ? (state.quizScores[m.id] + "%") : "Sát hạch"}</span>
                      </div>
                    `;
                  })()
                ) : (
                  (m.lessons || []).map((l) => `
                    <div class="nav-lesson ${state.completed[l.id] ? "done" : ""} ${l.id === activeLessonId ? "active" : ""}"
                         data-lesson="${l.id}">
                      <span class="nl-dot"></span>
                      <span class="nl-title">${l.type === "quiz" ? "🏆 " : isLessonDemo(activeCourse, m, l) ? '<span class="demo-tag-pill" style="background:#f59e0b;color:#000;font-size:9.5px;font-weight:800;padding:1px 4px;border-radius:3px;margin-right:4px;">DEMO</span>' : ""}${escapeHtml(l.title)}</span>
                      <span class="nl-mins">${l.minutes}p</span>
                    </div>`).join("")
                )}
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>
    `;

    nav.innerHTML = html;

    // Attach listeners for Course Sidebar
    const scsCurrentBtn = $("#scsCurrentBtn", nav);
    const scsDropdown = $("#scsDropdown", nav);
    if (scsCurrentBtn && scsDropdown) {
      scsCurrentBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = scsDropdown.style.display !== "none";
        scsDropdown.style.display = isOpen ? "none" : "block";
      });
      document.addEventListener("click", () => {
        if (scsDropdown) scsDropdown.style.display = "none";
      });
    }

    $$("[data-switch-course]", nav).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (scsDropdown) scsDropdown.style.display = "none";
        enterCourse(el.dataset.switchCourse);
      });
    });

    const btnSidebarEnroll = $("#btnSidebarEnroll", nav);
    if (btnSidebarEnroll) {
      btnSidebarEnroll.addEventListener("click", () => enrollCourse(activeCourse.id));
    }
    $$(".sidebar-back-btn", nav).forEach(el =>
      el.addEventListener("click", () => gotoView("courses")));
    $$(".nav-home", nav).forEach((el) =>
      el.addEventListener("click", () => gotoView(el.dataset.view)));
    $$(".nav-module-head", nav).forEach((el) =>
      el.addEventListener("click", () => el.parentElement.classList.toggle("open")));
    $$(".nav-topic-head", nav).forEach((el) =>
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        el.parentElement.classList.toggle("open");
      }));
    $$(".nav-module-quiz", nav).forEach((el) =>
      el.addEventListener("click", () => startQuiz(parseInt(el.dataset.moduleQuiz, 10))));
    $$(".nav-lesson", nav).forEach((el) =>
      el.addEventListener("click", () => gotoLesson(el.dataset.lesson)));
  }

  function formatHeroTitle(title) {
    const main = (title || "").split("—")[0].trim();
    const parts = main.split(" ");
    if (parts.length <= 1) return escapeHtml(main);
    const last = parts.pop();
    return `${escapeHtml(parts.join(" "))} <span class="grad-text">${escapeHtml(last)}</span>`;
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    const activeCourse = getActiveCourse();
    const modules = getActiveModules();
    const total = overallProgress();
    const items = allItems();
    const lessonsDone = items.filter((x) => x.lesson.type !== "quiz" && state.completed[x.lesson.id]).length;
    const lessonsTotal = items.filter((x) => x.lesson.type !== "quiz").length;
    const modulesDone = modules.filter((m) => moduleProgress(m).pct === 100).length;
    
    // Quiz avg for active course
    const modIds = modules.map(m => m.id);
    const scores = Object.keys(state.quizScores)
      .filter(k => modIds.includes(k) || modIds.includes(parseInt(k, 10)))
      .map(k => state.quizScores[k]);
    const avg = scores.length
      ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length) + "%"
      : "—";

    // Hero title & sub
    const view = $("#view-dashboard");
    if (!view) return;

    view.innerHTML = `
      <div class="hero">
        <div class="hero-badge">${activeCourse.icon} ${escapeHtml(activeCourse.badge)} · ${activeCourse.level}</div>
        <h1>${formatHeroTitle(activeCourse.title)}</h1>
        <p class="hero-sub">${escapeHtml(activeCourse.desc)}</p>
        <div class="hero-actions">
          <button class="btn btn-primary" id="continueBtn">▶ Tiếp tục học</button>
          ${total.pct === 100 ? `
            <button class="btn btn-sm" data-open-cert="${activeCourse.id}" style="background: linear-gradient(135deg, #a435f0, #8710d8); color:#fff; font-weight:800; border:none; padding:10px 16px; border-radius:8px; box-shadow:0 4px 14px rgba(164,53,240,0.3); cursor:pointer;">
              🎓 Nhận chứng chỉ hoàn thành
            </button>
          ` : `
            <button class="btn btn-ghost" data-preview-cert="${activeCourse.id}">🎓 Xem mẫu chứng chỉ</button>
          `}
          <button class="btn btn-secondary" data-view="courses">🌟 Khám phá các khóa khác</button>
          <button class="btn btn-ghost" data-view="user-dashboard">📊 Tiến độ của tôi</button>
          <button class="btn btn-ghost" data-view="curriculum">Xem giáo trình</button>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-ring-lg">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>
              <circle cx="45" cy="45" r="36" fill="none" stroke="url(#ringGrad2)" stroke-width="8" stroke-linecap="round" stroke-dasharray="226.2" stroke-dashoffset="${226.2 - (226.2 * total.pct) / 100}" id="dashRing" transform="rotate(-90 45 45)"/>
              <defs><linearGradient id="ringGrad2" x1="0" y1="0" x2="90" y2="90"><stop stop-color="#8BE36B"/><stop offset="1" stop-color="#2DD4A7"/></linearGradient></defs>
              <text x="45" y="50" text-anchor="middle" class="ring-text" id="dashRingText">${total.pct}%</text>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-num" id="statLessonsDone">${lessonsDone}/${lessonsTotal}</div>
            <div class="stat-label">Bài đã hoàn thành</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🧩</div>
          <div class="stat-info">
            <div class="stat-num" id="statModulesDone">${modulesDone}/${modules.length}</div>
            <div class="stat-label">Module đã xong</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-info">
            <div class="stat-num" id="statQuizAvg">${avg}</div>
            <div class="stat-label">Điểm quiz trung bình</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-info">
            <div class="stat-num">${activeCourse.hours}</div>
            <div class="stat-label">Thời lượng ước tính</div>
          </div>
        </div>
      </div>

      <h2 class="section-title">📚 Các Module Khóa Học: ${escapeHtml(activeCourse.shortTitle)}</h2>
      <div class="module-grid" id="moduleGrid"></div>
    `;

    renderDashboardStats();

    const streakEl = $("#streakSub");
    if (streakEl) {
      const quizCount = modules.reduce((acc, m) => {
        const q = (m.lessons || []).find(l => l.type === "quiz");
        return acc + (q && q.questions ? q.questions.length : 0);
      }, 0);
      streakEl.textContent = `${lessonsTotal} bài · ${modules.length} module · ${quizCount} câu quiz`;
    }

    const grid = $("#moduleGrid", view);
    const isEnrolled = isCourseEnrolled(activeCourse.id);

    grid.innerHTML = modules.map((m) => {
      const prog = moduleProgress(m);
      const firstIncomplete = (m.lessons || []).find((l) => !state.completed[l.id]) || m.lessons[0];
      const allDone = prog.pct === 100;
      const started = prog.done > 0;
      const quiz = (m.lessons || []).find((l) => l.type === "quiz");

      let statusBadge = "";
      if (allDone) {
        statusBadge = '<span class="status-badge done">✓ Hoàn thành</span>';
      } else if (started) {
        statusBadge = `<span class="status-badge in-progress">Đang học (${prog.done}/${prog.total})</span>`;
      } else {
        statusBadge = '<span class="status-badge not-started">Chưa học</span>';
      }

      const buttonLabel = allDone
        ? "Ôn tập lại"
        : started
        ? `Học tiếp: ${escapeHtml(firstIncomplete.title)}`
        : `Bắt đầu: ${escapeHtml(firstIncomplete.title)}`;

      return `
      <div class="module-card mc-${m.id} ${allDone ? "done" : ""}" data-module="${m.id}" data-lesson="${firstIncomplete ? firstIncomplete.id : ""}">
        <div class="module-card-top">
          <span class="module-card-badge">${m.icon}</span>
          <span class="module-card-num">Module ${m.id}</span>
          ${statusBadge}
        </div>
        <h3 class="module-card-title">${escapeHtml(m.title)}</h3>
        <p class="module-card-desc">${escapeHtml(m.desc || "")}</p>
        <div class="module-card-meta">
          <span>📖 ${(m.lessons || []).length} bài</span>
          <span>⏱ ~${(m.lessons || []).reduce((a, l) => a + (l.minutes || 0), 0)}p</span>
          ${quiz ? `<span>🏆 Sát hạch 12/${(quiz.questions ? quiz.questions.length : 0) + ((window.EXPANDED_QUIZZES && window.EXPANDED_QUIZZES[String(m.id)]) ? window.EXPANDED_QUIZZES[String(m.id)].length : 0)} câu</span>` : ""}
        </div>
        <div class="module-card-progress">
          <div class="mcp-bar">
            <div class="mcp-fill" style="width: ${prog.pct}%"></div>
          </div>
          <span class="mcp-pct">${prog.pct}%</span>
        </div>
        <button class="btn btn-sm ${allDone ? "btn-ghost" : "btn-primary"} module-card-btn btn-card-action">
          ${buttonLabel} →
        </button>
        <div class="module-card-footer">
          ${isEnrolled ? `
            <span class="mc-enrolled-pill">✓ Đã mở khóa toàn bộ</span>
          ` : `
            <button class="btn btn-sm btn-primary btn-card-enroll-course" style="font-size:11px;padding:3px 8px;">
              🚀 Ghi danh khóa học
            </button>
          `}
        </div>
      </div>`;
    }).join("");

    $$(".module-card", grid).forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-card-enroll-course")) {
          e.stopPropagation();
          enrollCourse(activeCourse.id);
        } else {
          gotoLesson(card.dataset.lesson);
        }
      });
    });

    $$("[data-view]", view).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        gotoView(el.dataset.view);
      });
    });

    const continueBtn = $("#continueBtn", view);
    if (continueBtn) {
      continueBtn.addEventListener("click", async () => {
        if (!isCourseEnrolled(activeCourse.id)) {
          await enrollCourse(activeCourse.id, true);
        }
        for (const m of modules) {
          const nextInMod = (m.lessons || []).find(l => !state.completed[l.id]);
          if (nextInMod) {
            gotoLesson(nextInMod.id);
            return;
          }
        }
        if (modules.length > 0 && modules[0].lessons && modules[0].lessons.length > 0) {
          const firstL = modules[0].lessons.find(l => l.type !== "quiz") || modules[0].lessons[0];
          if (firstL) {
            gotoLesson(firstL.id);
            return;
          }
        }
        gotoView("curriculum");
      });
    }
  }

  // ---------- Dedicated Course Catalog Page ----------
  // ---------- Skill Placement Test Engine (CES-2026 v2.5) ----------
  let placementState = {
    currentIdx: 0,
    answers: {},
    isFinished: false
  };

  function openPlacementTestModal() {
    placementState = {
      currentIdx: 0,
      answers: {},
      isFinished: false
    };
    renderPlacementModal();
  }

  function closePlacementTestModal() {
    const el = $("#placementModalBackdrop");
    if (el) el.remove();
  }

  function renderPlacementModal() {
    let backdrop = $("#placementModalBackdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = "placementModalBackdrop";
      backdrop.className = "modal-backdrop";
      document.body.appendChild(backdrop);
    }

    if (placementState.isFinished) {
      renderPlacementResult(backdrop);
      return;
    }

    const qIdx = placementState.currentIdx;
    const qData = PLACEMENT_QUESTIONS[qIdx];
    const totalQ = PLACEMENT_QUESTIONS.length;
    const selectedAns = placementState.answers[qIdx];
    const progressPct = Math.round(((qIdx + 1) / totalQ) * 100);

    backdrop.innerHTML = `
      <div class="placement-modal-box">
        <div class="pm-header">
          <div class="pm-title">
            <span>🎯 Sát Hạch Định Vị Năng Lực (Placement Test)</span>
          </div>
          <button class="modal-close" id="pmCloseBtn" aria-label="Đóng">&times;</button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span class="pm-tier-pill pm-tier-${qData.tier}">${escapeHtml(qData.tierLabel)}</span>
          <span style="font-size: 13px; color: var(--text-2); font-weight: 600;">Câu hỏi ${qIdx + 1} / ${totalQ}</span>
        </div>

        <div class="pm-progress-bar">
          <div class="pm-progress-fill" style="width: ${progressPct}%;"></div>
        </div>

        <div class="pm-question-text">${escapeHtml(qData.q)}</div>

        <div class="pm-options-list">
          ${qData.options.map((opt, i) => `
            <div class="pm-option-item ${selectedAns === i ? 'selected' : ''}" data-pm-opt="${i}">
              <div style="width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${selectedAns === i ? '#a435f0' : 'var(--border-soft)'}; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: ${selectedAns === i ? '#a435f0' : 'var(--text-2)'}; flex-shrink: 0;">
                ${String.fromCharCode(65 + i)}
              </div>
              <div style="flex: 1; line-height: 1.4;">${escapeHtml(opt)}</div>
            </div>
          `).join('')}
        </div>

        <div class="pm-actions">
          <button class="btn btn-ghost" id="pmPrevBtn" ${qIdx === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>← Câu trước</button>
          <button class="btn btn-primary" id="pmNextBtn" ${selectedAns === undefined ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            ${qIdx === totalQ - 1 ? 'Hoàn thành bài thi ✓' : 'Câu tiếp theo →'}
          </button>
        </div>
      </div>
    `;

    $("#pmCloseBtn", backdrop)?.addEventListener("click", closePlacementTestModal);

    $$(".pm-option-item", backdrop).forEach(item => {
      item.addEventListener("click", () => {
        const opt = parseInt(item.dataset.pmOpt, 10);
        placementState.answers[qIdx] = opt;
        renderPlacementModal();
      });
    });

    $("#pmPrevBtn", backdrop)?.addEventListener("click", () => {
      if (placementState.currentIdx > 0) {
        placementState.currentIdx--;
        renderPlacementModal();
      }
    });

    $("#pmNextBtn", backdrop)?.addEventListener("click", () => {
      if (placementState.answers[qIdx] === undefined) return;
      if (placementState.currentIdx < totalQ - 1) {
        placementState.currentIdx++;
        renderPlacementModal();
      } else {
        placementState.isFinished = true;
        renderPlacementModal();
      }
    });
  }

  function renderPlacementResult(backdrop) {
    let totalCorrect = 0;
    let foundationCorrect = 0;
    let professionalCorrect = 0;
    let architectCorrect = 0;

    PLACEMENT_QUESTIONS.forEach((q, idx) => {
      const isCorrect = placementState.answers[idx] === q.answer;
      if (isCorrect) {
        totalCorrect++;
        if (q.tier === "foundation") foundationCorrect++;
        if (q.tier === "professional") professionalCorrect++;
        if (q.tier === "architect") architectCorrect++;
      }
    });

    let recCourseId = "spring-boot-foundation";
    let recCourseTitle = "Spring Boot 3 Core & RESTful API Architecture";
    let recReason = "Bạn nên bắt đầu từ Chặng 1 để làm chủ vững chắc Spring IoC Container, Bean Lifecycle và chuẩn RESTful API RFC 7807.";

    if (foundationCorrect >= 4 && professionalCorrect < 4) {
      recCourseId = "spring-boot-professional";
      recCourseTitle = "Spring Boot Enterprise JPA, Security & Testing";
      recReason = "Bạn đã có nền tảng tốt về Spring Core. Điểm xuất phát tối ưu nhất là đào sâu tối ưu hóa JPA N+1, Pessimistic Locking và Spring Security 6 với Testcontainers.";
    } else if (foundationCorrect >= 4 && professionalCorrect >= 4) {
      recCourseId = "spring-boot-architect";
      recCourseTitle = "Spring Boot Cloud Native, Kafka & Distributed Architecture";
      recReason = "Khả năng phân tích của bạn rất vững chắc. Bạn hoàn toàn sẵn sàng thử thách với kiến trúc phân tán Kafka, Transactional Outbox, Saga Pattern và Kubernetes.";
    }

    backdrop.innerHTML = `
      <div class="placement-modal-box">
        <div class="pm-header">
          <div class="pm-title">
            <span>🏆 KẾT QUẢ ĐỊNH VỊ NĂNG LỰC (CES-2026)</span>
          </div>
          <button class="modal-close" id="pmCloseBtn" aria-label="Đóng">&times;</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 20px 0; text-align: center;">
          <div style="background: var(--bg-1); padding: 12px; border-radius: 8px; border: 1px solid var(--border-soft);">
            <div style="font-size: 11px; color: var(--text-2); text-transform: uppercase;">Tổng điểm</div>
            <div style="font-size: 22px; font-weight: 800; color: #a435f0;">${totalCorrect}/15</div>
          </div>
          <div style="background: var(--bg-1); padding: 12px; border-radius: 8px; border: 1px solid var(--border-soft);">
            <div style="font-size: 11px; color: #10b981; text-transform: uppercase;">Foundation</div>
            <div style="font-size: 20px; font-weight: 700; color: #10b981;">${foundationCorrect}/5</div>
          </div>
          <div style="background: var(--bg-1); padding: 12px; border-radius: 8px; border: 1px solid var(--border-soft);">
            <div style="font-size: 11px; color: #3b82f6; text-transform: uppercase;">Professional</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${professionalCorrect}/5</div>
          </div>
          <div style="background: var(--bg-1); padding: 12px; border-radius: 8px; border: 1px solid var(--border-soft);">
            <div style="font-size: 11px; color: #a855f7; text-transform: uppercase;">Architect</div>
            <div style="font-size: 20px; font-weight: 700; color: #a855f7;">${architectCorrect}/5</div>
          </div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
          <div style="font-size: 12px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            🎯 ĐỀ XUẤT ĐIỂM XUẤT PHÁT TỐI ƯU
          </div>
          <div style="font-size: 17px; font-weight: 800; color: var(--text-1); margin-bottom: 6px;">
            ${escapeHtml(recCourseTitle)}
          </div>
          <div style="font-size: 13.5px; color: var(--text-2); line-height: 1.5;">
            ${escapeHtml(recReason)}
          </div>
        </div>

        <div class="pm-disclaimer-box">
          <strong>⚠️ QUY CHUẨN KỸ THUẬT CES-2026 v2.5 LƯU Ý:</strong><br>
          Bài thi Placement chỉ mang tính chất <em>gợi ý điểm xuất phát phù hợp</em> với kiến thức hiện có của bạn. Kết quả này <strong>KHÔNG MIỄN CHỨNG CHỈ CẤP DƯỚI</strong>. Để được cấp Chứng chỉ Kỹ sư chính quy (DevMastery Verified), học viên bắt buộc phải hoàn thành các Capstone Project và vượt qua bài thi Module thực chiến của từng khóa học tương ứng.
        </div>

        <div class="pm-actions" style="margin-top: 20px;">
          <button class="btn btn-ghost" id="pmCloseResultBtn">Đóng cửa sổ</button>
          <button class="btn btn-primary" id="pmStartRecCourseBtn" style="padding: 10px 20px; font-weight: 700;">
            🚀 Bắt đầu khóa học được đề xuất →
          </button>
        </div>
      </div>
    `;

    $("#pmCloseBtn", backdrop)?.addEventListener("click", closePlacementTestModal);
    $("#pmCloseResultBtn", backdrop)?.addEventListener("click", closePlacementTestModal);
    $("#pmStartRecCourseBtn", backdrop)?.addEventListener("click", () => {
      closePlacementTestModal();
      enrollCourse(recCourseId);
      enterCourse(recCourseId);
    });
  }

  // ---------- Dedicated Course Catalog Page ----------
  function renderCoursesCatalog() {
    const view = $("#view-courses");
    if (!view) return;

    const filtered = COURSES.filter(c => {
      if (c.isAvailable === false) return false;
      if (state.catalogCategory !== "all" && c.category !== state.catalogCategory) return false;
      if (state.catalogSearch) {
        const q = state.catalogSearch.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchTags = c.tags.some(t => t.toLowerCase().includes(q));
        const matchDesc = c.desc.toLowerCase().includes(q);
        if (!matchTitle && !matchTags && !matchDesc) return false;
      }
      return true;
    });

    const enrolledCount = COURSES.filter(c => isCourseEnrolled(c.id)).length;
    const showTrack = (state.catalogCategory === "all" || state.catalogCategory === "backend") && !state.catalogSearch;
    const springTrack = TRACKS[0];

    let html = `
      <div class="cat-page-container">
        <!-- Catalog Hero -->
        <!-- Udemy Billboard Hero -->
        <div class="udemy-billboard">
          <div class="ub-inner">
            <div class="ub-card">
              <div class="ub-badge">⚡ NỀN TẢNG ĐÀO TẠO ENTERPRISE</div>
              <h1 class="ub-title">Làm chủ công nghệ thực chiến. Mở lối sự nghiệp đỉnh cao.</h1>
              <p class="ub-desc">Lộ trình đào tạo chuẩn kỹ sư quốc tế CES-2026: Java Core, Spring Boot 3 &amp; Microservices phân tán, React 19 Enterprise và Cloud Native Kubernetes. Đánh giá sát hạch kiến trúc sư chuyên sâu.</p>
              <div class="ub-actions">
                <a href="#catCourseSection" class="ub-btn-primary" id="ubBtnExplore">Khám phá khóa học ngay ↓</a>
                <button class="ub-btn-outline" data-view="user-dashboard">📚 Khóa học của tôi (${enrolledCount})</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Header & Filter Tabs -->
        <div class="cat-section-header" id="catCourseSection">
          <div class="csh-title-row">
            <h2>Các khóa học nổi bật</h2>
            <div class="csh-subtitle">Tuyển tập các lộ trình đào tạo từ cơ bản đến production cho Kỹ sư phần mềm</div>
          </div>

          <!-- Search & Filter Controls -->
          <div class="cat-controls">
            <div class="cat-search-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" id="catSearchInput" placeholder="Tìm kiếm theo tên khóa học hoặc công nghệ (Java, Spring Boot, React, Kubernetes...)" value="${escapeHtml(state.catalogSearch)}">
              ${state.catalogSearch ? '<button class="cat-search-clear" id="catSearchClear">&times;</button>' : ''}
            </div>

            <div class="cat-filter-tabs">
              <button class="cat-tab ${state.catalogCategory === "all" ? "active" : ""}" data-category="all">
                Tất cả (${COURSES.filter(c => c.isAvailable !== false).length})
              </button>
              <button class="cat-tab ${state.catalogCategory === "backend" ? "active" : ""}" data-category="backend">
                🍃 Backend &amp; Java (${COURSES.filter(c => c.isAvailable !== false && c.category === "backend").length})
              </button>
              <button class="cat-tab ${state.catalogCategory === "frontend" ? "active" : ""}" data-category="frontend">
                ⚛️ Frontend &amp; Web (${COURSES.filter(c => c.isAvailable !== false && c.category === "frontend").length})
              </button>
              <button class="cat-tab ${state.catalogCategory === "devops" ? "active" : ""}" data-category="devops">
                ☸️ DevOps &amp; Cloud (${COURSES.filter(c => c.isAvailable !== false && c.category === "devops").length})
              </button>
            </div>
          </div>
        </div>

        <!-- 3-Stage Milestone Track Banners (CES-2026 v2.5) with Track Selector -->
        ${showTrack ? (() => {
          const availableTracks = TRACKS.filter(t => state.catalogCategory === "all" || t.category === state.catalogCategory);
          if (availableTracks.length === 0) return '';
          
          let activeTrack = availableTracks.find(t => t.id === state.activeTrackId) || availableTracks[0];

          return `
            <div class="track-roadmap-wrapper" style="margin-bottom: 2rem;">
              <!-- Track Switcher Tabs -->
              <div class="track-switcher-bar">
                <span class="tsb-title">⚡ LỘ TRÌNH ĐÀO TẠO KỸ SƯ:</span>
                <div class="tsb-tabs">
                  ${availableTracks.map(t => `
                    <button class="tsb-tab ${t.id === activeTrack.id ? 'active' : ''}" data-switch-track="${t.id}">
                      ${t.id === 'spring-boot-track' ? '🍃 Lộ Trình Spring Boot &amp; Microservices (3 Chặng)' : '☕ Lộ Trình Chuyên Gia Java (Java Master - 3 Chặng)'}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Single Selected Track Roadmap Card -->
              <div class="track-roadmap-container">
                <div class="track-header">
                  <div>
                    <div class="track-badge-pill">⚡ LỘ TRÌNH CHUẨN KỸ SƯ (CES-2026 v2.5)</div>
                    <h2 class="track-title">${escapeHtml(activeTrack.title)}</h2>
                    <p class="track-desc">${escapeHtml(activeTrack.desc)}</p>
                    <div class="track-domain-tag">🏢 Bối cảnh thực chiến: ${escapeHtml(activeTrack.domainContext)}</div>
                  </div>
                  <div>
                    <button class="btn-placement-test" id="${activeTrack.id === 'spring-boot-track' ? 'btnLaunchPlacement' : 'btnLaunchPlacement-' + activeTrack.id}">
                      🎯 Sát Hạch Định Vị Năng Lực (15 câu)
                    </button>
                  </div>
                </div>

                <div class="track-stages-grid">
                  ${activeTrack.stages.map((st, idx) => {
                    const c = COURSES.find(item => item.id === st.courseId);
                    const enrolled = isCourseEnrolled(st.courseId);
                    const prog = overallProgress(st.courseId);
                    return `
                      <div class="track-stage-card" data-goto-course="${st.courseId}">
                        <div>
                          <div class="stage-step-num">CHẶNG 0${idx + 1} · ${(st.level || '').toUpperCase()}</div>
                          <div class="stage-title">${escapeHtml(c ? c.shortTitle : st.title)}</div>
                          <div class="stage-modules-list">
                            ${c && c.modules && c.modules.length ? c.modules.map(m => `• M${m.id}: ${escapeHtml(m.title)}`).join('<br>') : (c && c.modulesCount ? `• ${c.modulesCount} Chuyên đề chuyên sâu · ${c.hours}` : '• 4 Chuyên đề chuyên sâu · 12h')}
                          </div>
                        </div>
                        <div class="stage-footer">
                          <span class="stage-cert-name">🏆 ${escapeHtml(st.certificate)}</span>
                          <span class="stage-action-link">${enrolled ? `Tiếp tục (${prog.pct}%) →` : 'Khám phá →'}</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          `;
        })() : ''}

        <!-- Udemy Course Cards Grid -->
        <div class="cat-cards-grid">
          ${filtered.map(c => {
            const enrolled = isCourseEnrolled(c.id);
            const isActive = c.id === state.activeCourseId;
            const prog = overallProgress(c.id);

            return `
            <div class="ud-course-card ${enrolled ? "enrolled" : ""}" data-card-course="${c.id}">
              <!-- Thumbnail Artwork (16:9 ratio) -->
              <div class="ud-card-thumb" style="background: ${c.themeGradient || 'linear-gradient(135deg, #1e293b, #0f172a)'};" data-goto-course="${c.id}" title="Vào học khóa ${escapeHtml(c.shortTitle)}">
                <div class="ud-thumb-overlay"></div>
                ${c.bestseller ? '<div class="ud-badge-ribbon bestseller">Bán chạy nhất</div>' : '<div class="ud-badge-ribbon hot">Mới &amp; Nổi bật</div>'}
                <div class="ud-thumb-center">
                  <span class="ud-thumb-icon">${c.icon}</span>
                  <span class="ud-thumb-title">${escapeHtml(c.shortTitle)}</span>
                </div>
                <div class="ud-thumb-duration">${c.hours}</div>
                <div class="ud-thumb-play-hover">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>

              <!-- Card Body -->
              <div class="ud-card-body" data-goto-course="${c.id}">
                <div class="ud-card-badge-row">
                  <span class="ud-card-cat-badge">${escapeHtml(c.badge)}</span>
                  ${isActive ? '<span class="ud-badge-learning">⚡ Đang học</span>' : ''}
                </div>

                <div class="ud-level-badge-row">
                  <span class="ud-level-pill ud-level-${c.level || 'foundation'}">${(c.level || 'foundation').toUpperCase()}</span>
                  <span class="ud-stack-info">${c.stackVersion ? `${c.stackVersion.java} · Boot ${c.stackVersion.springBoot}` : (c.badge || '')}</span>
                </div>

                <h3 class="ud-card-title" title="${escapeHtml(c.title)}">
                  ${escapeHtml(c.title)}
                </h3>

                <div class="ud-card-instructor">${escapeHtml(c.instructor || "DevMastery Academy")}</div>

                <!-- Specs -->
                <div class="ud-specs-row">
                  <span>⏱ ${c.hours}</span>
                  <span>📖 ${c.lessonsCount} bài micro</span>
                  <span>🏆 ${c.quizCount} câu quiz</span>
                </div>

                ${c.outcomes && c.outcomes.length ? `
                  <div class="ud-card-outcomes">
                    <div class="ud-co-title">Mục tiêu đầu ra:</div>
                    <ul>
                      ${c.outcomes.slice(0, 2).map(o => `<li>✓ ${escapeHtml(o)}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}

                <!-- Tags -->
                <div class="ud-tags-row">
                  ${(c.tags || []).slice(0, 4).map(t => `<span class="ud-tag">${escapeHtml(t)}</span>`).join('')}
                </div>

                <!-- Price Row -->
                <div class="ud-price-row">
                  <div class="ud-current-price">Học miễn phí</div>
                  <div class="ud-cert-verify-tag">${c.certificateTitle ? 'DevMastery Verified' : 'Thực chiến'}</div>
                </div>

                <!-- Progress if enrolled -->
                ${enrolled ? `
                  <div class="ud-card-progress">
                    <div class="ud-cp-bar"><div class="ud-cp-fill" style="width: ${prog.pct}%"></div></div>
                    <div class="ud-cp-labels">
                      <span>Tiến độ: <strong>${prog.pct}%</strong></span>
                      <span>${prog.done}/${prog.total} hoàn thành</span>
                    </div>
                  </div>
                ` : ''}
              </div>

              <!-- Actions -->
              <div class="ud-card-footer">
                ${enrolled ? `
                  <div class="ud-card-enrolled-actions">
                    <button class="ud-btn-continue" data-goto-course="${c.id}">
                      ${isActive ? "▶ Tiếp tục học" : "🚀 Vào khóa học"}
                    </button>
                    <button class="ud-btn-unenroll" data-unenroll-course="${c.id}" title="Hủy ghi danh">
                      ✕ Hủy
                    </button>
                  </div>
                ` : `
                  <div class="ud-card-guest-actions">
                    <button class="ud-btn-continue" data-goto-course="${c.id}" style="background: linear-gradient(135deg, #a435f0, #7928ca); color: #fff; font-weight: 700;">
                      🚀 Vào học ngay
                    </button>
                    <button class="ud-btn-demo" data-demo-course="${c.id}" title="Học thử ngay Bài 1.1 hoàn toàn miễn phí">
                      🎯 Học thử Demo
                    </button>
                    <button class="ud-btn-preview" data-goto-course="${c.id}" title="Xem cấu trúc toàn bộ giáo trình">
                      👁 Giáo trình
                    </button>
                  </div>
                `}
              </div>
            </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    view.innerHTML = html;

    // Search events
    const catSearchInput = $("#catSearchInput", view);
    if (catSearchInput) {
      catSearchInput.addEventListener("input", (e) => {
        state.catalogSearch = e.target.value;
        renderCoursesCatalog();
        $("#catSearchInput")?.focus();
      });
    }

    const catSearchClear = $("#catSearchClear", view);
    if (catSearchClear) {
      catSearchClear.addEventListener("click", () => {
        state.catalogSearch = "";
        renderCoursesCatalog();
      });
    }

    // Category Tabs
    $$(".cat-tab", view).forEach(tab => {
      tab.addEventListener("click", () => {
        state.catalogCategory = tab.dataset.category;
        renderCoursesCatalog();
      });
    });

    // Placement test launcher button
    $("#btnLaunchPlacement", view)?.addEventListener("click", () => {
      openPlacementTestModal();
    });

    // Track switcher buttons
    $$("[data-switch-track]", view).forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeTrackId = btn.dataset.switchTrack;
        renderCoursesCatalog();
      });
    });

    // Action buttons
    $$("[data-enroll-course]", view).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        enrollCourse(btn.dataset.enrollCourse);
      });
    });

    $$("[data-unenroll-course]", view).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        unenrollCourse(btn.dataset.unenrollCourse);
      });
    });

    $$("[data-demo-course]", view).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const courseId = btn.dataset.demoCourse;
        const c = COURSES.find(x => x.id === courseId);
        if (c && c.modules && c.modules.length > 0) {
          const firstLesson = (c.modules[0].lessons || []).find(l => l.type !== "quiz") || (c.modules[0].lessons && c.modules[0].lessons[0]);
          if (firstLesson) {
            state.activeCourseId = c.id;
            localStorage.setItem(ACTIVE_COURSE_KEY, c.id);
            gotoLesson(firstLesson.id);
            toast(`🎁 Đang mở bản học thử Demo: <strong>${escapeHtml(firstLesson.title)}</strong>`);
            return;
          }
        }
        enterCourse(courseId);
      });
    });

    $$("[data-goto-course]", view).forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        enterCourse(btn.dataset.gotoCourse);
      });
    });

    $$(".ud-course-card", view).forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest("a")) return;
        enterCourse(card.dataset.cardCourse);
      });
    });
  }

  // ---------- Lesson AI Teaching Assistant (GLM Powered) ----------
  const GLM_KEY_STORAGE = "sbc_glm_api_key";
  const GLM_MODEL_STORAGE = "sbc_glm_model";
  const GLM_ENDPOINT_STORAGE = "sbc_glm_endpoint";
  const GLM_MIGRATION_KEY = "sbc_glm_v53_migrated";
  const ZAI_CODING_ENDPOINT = "https://api.z.ai/api/coding/paas/v4/chat/completions";
  const BIGMODEL_CHINA_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  const DEFAULT_GLM_ENDPOINT = ZAI_CODING_ENDPOINT;
  const DEFAULT_GLM_MODEL = "glm-5.3";
  const lessonAiConversations = {};

  function getGlmConfig() {
    // One-time automatic migration: Ensure GLM-5.3 Flagship is the active default for all users
    if (localStorage.getItem(GLM_MIGRATION_KEY) !== "true") {
      localStorage.setItem(GLM_ENDPOINT_STORAGE, DEFAULT_GLM_ENDPOINT);
      localStorage.setItem(GLM_MODEL_STORAGE, DEFAULT_GLM_MODEL);
      localStorage.setItem(GLM_MIGRATION_KEY, "true");
    }

    let endpoint = localStorage.getItem(GLM_ENDPOINT_STORAGE) || DEFAULT_GLM_ENDPOINT;
    let model = localStorage.getItem(GLM_MODEL_STORAGE) || DEFAULT_GLM_MODEL;
    const apiKey = localStorage.getItem(GLM_KEY_STORAGE) || "";

    // If using Z.AI coding endpoint but model is set to an unsupported legacy/China model (e.g. glm-4-flash), normalize to glm-5.3
    if (endpoint.includes("z.ai/api/coding") && model !== "glm-5.3" && model !== "glm-4.5" && model !== "glm-5") {
      model = "glm-5.3";
      localStorage.setItem(GLM_MODEL_STORAGE, model);
    }

    return { apiKey, model, endpoint };
  }

  function saveGlmConfig(apiKey, model, endpoint) {
    if (apiKey !== undefined) {
      if (apiKey && apiKey.trim()) localStorage.setItem(GLM_KEY_STORAGE, apiKey.trim());
      else localStorage.removeItem(GLM_KEY_STORAGE);
    }
    if (model) localStorage.setItem(GLM_MODEL_STORAGE, model.trim());
    if (endpoint) localStorage.setItem(GLM_ENDPOINT_STORAGE, endpoint.trim());
  }

  function openAiConfigModal() {
    const modal = $("#aiConfigModal");
    if (!modal) return;
    const cfg = getGlmConfig();
    const keyInput = $("#glmApiKeyInput");
    const modelSelect = $("#glmModelSelect");
    const endpointInput = $("#glmEndpointInput");

    if (keyInput) keyInput.value = cfg.apiKey;
    if (modelSelect) modelSelect.value = cfg.model || DEFAULT_GLM_MODEL;
    if (endpointInput) endpointInput.value = cfg.endpoint || DEFAULT_GLM_ENDPOINT;

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    if (keyInput) setTimeout(() => keyInput.focus(), 80);
  }

  function closeAiConfigModal() {
    const modal = $("#aiConfigModal");
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "";
  }

  function renderLessonAiWidget(lessonId, c, m, lesson) {
    const cfg = getGlmConfig();
    const hasKey = !!cfg.apiKey;
    const history = lessonAiConversations[lessonId] || [];

    const defaultGreeting = `Xin chào! Tôi là Trợ lý AI Giảng Viên phụ trách bài học **[${escapeHtml(lesson.id)}] ${escapeHtml(lesson.title)}**.\n\nBạn có thể hỏi tôi bất kỳ thắc mắc nào về lý thuyết, mã nguồn Spring Boot, luồng xử lý hoặc bài toán thực chiến E-Commerce trong bài này. Toàn bộ ngữ cảnh của bài học đã được nạp sẵn để hỗ trợ bạn chính xác nhất!`;

    return `
      <section class="lesson-ai-assistant" id="lessonAiBox" aria-label="Trợ lý AI Giảng Viên">
        <div class="ai-box-header">
          <div class="ai-header-left">
            <div class="ai-avatar-badge">
              🤖
              <span class="ai-pulse-dot" title="Sẵn sàng hỗ trợ"></span>
            </div>
            <div>
              <div class="ai-box-title">
                <span>Trợ lý AI Giảng Viên (GLM)</span>
                <span class="ai-badge-model">${escapeHtml(cfg.model || DEFAULT_GLM_MODEL)}</span>
              </div>
              <div class="ai-box-subtitle">Hiểu sâu ngữ cảnh bài học ${escapeHtml(lesson.id)} &amp; kiến trúc Spring Boot Enterprise</div>
            </div>
          </div>
          <div class="ai-header-actions">
            ${history.length > 0 ? `<button type="button" class="btn-ai-header" id="btnClearAiChat" title="Xóa lịch sử đoạn hội thoại của bài này">🗑️ Xóa hội thoại</button>` : ""}
            <button type="button" class="btn-ai-header" id="btnOpenAiConfig" title="Cấu hình Token &amp; Model GLM">⚙️ Cấu hình AI</button>
          </div>
        </div>

        ${!hasKey ? `
        <div class="ai-setup-banner">
          <div class="ai-setup-icon">🔑</div>
          <div class="ai-setup-content" style="flex: 1;">
            <h4>Kích hoạt Trợ lý AI với Token GLM của bạn</h4>
            <p>Nhập API Key GLM để hỏi đáp chuyên sâu theo ngữ cảnh bài học này. Hỗ trợ cả <strong>Z.AI Coding Plan (z.ai)</strong> lẫn <strong>BigModel China (open.bigmodel.cn)</strong>. Token được lưu bảo mật cục bộ tại trình duyệt (LocalStorage).</p>
            <div class="ai-quick-key-row">
              <input type="password" id="aiQuickKeyInput" placeholder="Dán API Key GLM tại đây (vd: 956ae...)" autocomplete="off">
              <button type="button" class="btn btn-primary" id="btnSaveQuickKey" style="padding: 8px 16px; font-size: 13px;">Lưu &amp; Kích hoạt</button>
            </div>
            <div class="ai-setup-help">
              💡 Hỗ trợ: <a href="https://z.ai" target="_blank" rel="noopener">z.ai (GLM Coding Plan)</a> hoặc <a href="https://open.bigmodel.cn" target="_blank" rel="noopener">open.bigmodel.cn</a> (glm-4-flash miễn phí).
            </div>
          </div>
        </div>
        ` : ""}

        <div class="ai-chat-thread" id="aiChatThread">
          <!-- Bot Initial Greeting -->
          <div class="ai-msg ai-msg-bot">
            <div class="ai-msg-avatar">🤖</div>
            <div class="ai-msg-content">
              ${renderMarkdown(defaultGreeting)}
            </div>
          </div>

          ${history.map((msg) => `
            <div class="ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}">
              <div class="ai-msg-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
              <div class="ai-msg-content">${msg.role === 'user' ? escapeHtml(msg.content).replace(/\n/g, '<br>') : renderMarkdown(msg.content)}</div>
            </div>
          `).join("")}
        </div>

        <!-- Quick Action Chips -->
        <div class="ai-chips-wrap">
          <span class="ai-chips-label">💡 Gợi ý câu hỏi:</span>
          <button type="button" class="ai-chip" data-prompt="Giải thích trực quan và dễ hiểu nhất phần trọng tâm của bài học này cho người mới">🎯 Giải thích dễ hiểu trọng tâm</button>
          <button type="button" class="ai-chip" data-prompt="Liệt kê những lỗi sai và cạm bẫy thực tế (Pitfalls) hay gặp nhất khi triển khai kiến thức bài học này">⚠️ Những lỗi sai &amp; cạm bẫy hay gặp</button>
          <button type="button" class="ai-chip" data-prompt="Cho ví dụ code thực chiến mở rộng trong hệ thống E-Commerce cho phần này">🛒 Code E-Commerce thực chiến</button>
          <button type="button" class="ai-chip" data-prompt="Cách tối ưu hiệu năng và kiến trúc chuẩn Production cho bài học này">⚡ Tối ưu hiệu năng &amp; Production</button>
        </div>

        <div class="ai-input-bar">
          <div class="ai-input-wrap">
            <textarea id="aiQuestionInput" rows="1" placeholder="Đặt câu hỏi về bài học này... (Nhấn Enter để gửi, Shift+Enter để xuống dòng)"></textarea>
            <button type="button" class="btn-ai-send" id="btnSendAiQuestion" title="Gửi câu hỏi cho AI">
              <span>Gửi</span>
              <span>➤</span>
            </button>
          </div>
          <div class="ai-input-tip">
            💡 Toàn bộ nội dung, mã nguồn và sơ đồ bài học <strong>${escapeHtml(lesson.title)}</strong> sẽ tự động được gửi kèm làm ngữ cảnh cho AI.
          </div>
        </div>
      </section>
    `;
  }

  async function askLessonAi(lessonId, question) {
    if (!question || !question.trim()) return;
    const cleanQ = question.trim();

    const cfg = getGlmConfig();
    if (!cfg.apiKey) {
      openAiConfigModal();
      toast("⚠️ Vui lòng nhập API Key GLM của bạn để kích hoạt trợ lý AI!");
      return;
    }

    if (!lessonAiConversations[lessonId]) {
      lessonAiConversations[lessonId] = [];
    }

    // Add user message
    lessonAiConversations[lessonId].push({ role: "user", content: cleanQ });

    const thread = $("#aiChatThread");
    if (thread) {
      const userMsgEl = document.createElement("div");
      userMsgEl.className = "ai-msg ai-msg-user";
      userMsgEl.innerHTML = `
        <div class="ai-msg-avatar">👤</div>
        <div class="ai-msg-content">${escapeHtml(cleanQ).replace(/\n/g, "<br>")}</div>
      `;
      thread.appendChild(userMsgEl);

      // Loading indicator
      const loadingEl = document.createElement("div");
      loadingEl.className = "ai-msg ai-msg-bot ai-loading";
      loadingEl.id = "aiLoadingIndicator";
      loadingEl.innerHTML = `
        <div class="ai-msg-avatar">🤖</div>
        <div class="ai-msg-content">
          <div class="ai-typing-indicator"><span></span><span></span><span></span></div>
          <span>Trợ lý AI đang suy luận câu trả lời theo ngữ cảnh bài học...</span>
        </div>
      `;
      thread.appendChild(loadingEl);
      thread.scrollTop = thread.scrollHeight;
    }

    const input = $("#aiQuestionInput");
    const sendBtn = $("#btnSendAiQuestion");
    if (input) {
      input.value = "";
      input.style.height = "auto";
      input.disabled = true;
    }
    if (sendBtn) sendBtn.disabled = true;

    // Build context
    const found = findLesson(lessonId);
    const course = found ? found.course : null;
    const mod = found ? found.module : null;
    const lesson = found ? found.lesson : null;

    const systemPrompt = `Bạn là Trợ lý Giảng viên AI cao cấp chuyên sâu về Spring Boot, Microservices và Hệ thống E-Commerce quy mô lớn.
Nhiệm vụ của bạn là giải đáp thắc mắc, phân tích mã nguồn, và hướng dẫn học viên thực hành dựa trên ngữ cảnh chính xác của bài học hiện tại.

[NGỮ CẢNH BÀI HỌC]:
- Khóa học: ${course ? course.title : "Spring Boot"} (${course ? (course.shortTitle || course.id) : ""})
- Phân hệ/Module: Module ${mod ? mod.id : ""} - ${mod ? mod.title : ""}
- Bài học: [${lesson ? lesson.id : lessonId}] ${lesson ? lesson.title : ""} (${lesson ? lesson.minutes : 10} phút)
- Nội dung chi tiết bài học:
${lesson ? lesson.content : ""}

[QUY TẮC PHẢN HỒI]:
1. Luôn bám sát nội dung, tư tưởng và mã nguồn của bài học trên.
2. Trả lời bằng tiếng Việt chuyên nghiệp, súc tích, dễ hiểu, chuẩn văn phong kỹ thuật Spring Boot (Spring Framework 6+, Spring Boot 3+).
3. Khi đưa code minh họa, hãy kèm theo giải thích ngắn gọn, chú ý các cạm bẫy thực tế (Pitfalls), tối ưu hiệu năng (Performance) và Best Practices.
4. Sử dụng định dạng Markdown chuẩn với code block có chỉ định ngôn ngữ (vd: \`\`\`java, \`\`\`yaml, \`\`\`sql).
5. Nếu câu hỏi vượt ra ngoài bài học, hãy giải thích khái quát và gợi ý bài học hoặc tài liệu phù hợp.`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...lessonAiConversations[lessonId]
    ];

    async function requestChatCompletion(targetEndpoint, targetModel, targetKey, messagesList) {
      const payload = {
        model: targetModel,
        messages: messagesList,
        temperature: 1.0,
        max_tokens: 4096
      };

      // According to Z.AI official docs, enable thinking mode for reasoning models
      if (targetModel.includes("glm-5") || targetEndpoint.includes("z.ai")) {
        payload.thinking = { type: "enabled" };
        payload.reasoning_effort = "max";
      }

      const res = await fetch(targetEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${targetKey.trim()}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let errMsg = `Lỗi HTTP ${res.status}: ${res.statusText}`;
        let errJson = null;
        try {
          errJson = await res.json();
          if (errJson && errJson.error) {
            errMsg = errJson.error.message || errJson.error.code || JSON.stringify(errJson.error);
          }
        } catch (e) {}
        const error = new Error(errMsg);
        error.status = res.status;
        error.data = errJson;
        throw error;
      }

      return await res.json();
    }

    try {
      let data;
      try {
        data = await requestChatCompletion(cfg.endpoint, cfg.model || DEFAULT_GLM_MODEL, cfg.apiKey, apiMessages);
      } catch (primaryErr) {
        console.warn("Primary GLM request failed:", primaryErr);

        // Smart auto-fallback logic:
        let fallbackEndpoint = null;
        let fallbackModel = null;
        let fallbackLabel = "";

        const isBigModel = cfg.endpoint.includes("bigmodel.cn");
        const isZai = cfg.endpoint.includes("z.ai");

        if (isBigModel || primaryErr.status === 400 || primaryErr.status === 403 || primaryErr.status === 404) {
          // Fallback to Z.AI Coding Plan endpoint with glm-5.3
          fallbackEndpoint = ZAI_CODING_ENDPOINT;
          fallbackModel = "glm-5.3";
          fallbackLabel = "Z.AI GLM-5.3 Flagship";
        } else if (isZai && cfg.model !== "glm-5.3" && cfg.model !== "glm-4.5" && cfg.model !== "glm-5") {
          fallbackEndpoint = ZAI_CODING_ENDPOINT;
          fallbackModel = "glm-5.3";
          fallbackLabel = "Z.AI GLM-5.3 Flagship";
        }

        if (fallbackEndpoint && (fallbackEndpoint !== cfg.endpoint || fallbackModel !== cfg.model)) {
          try {
            console.info(`Auto-fallback to ${fallbackEndpoint} (${fallbackModel})...`);
            data = await requestChatCompletion(fallbackEndpoint, fallbackModel, cfg.apiKey, apiMessages);
            saveGlmConfig(cfg.apiKey, fallbackModel, fallbackEndpoint);
            toast(`💡 Đã tự động kết nối qua ${fallbackLabel} và lưu cấu hình!`, 3500);
          } catch (fallbackErr) {
            console.error("Auto-fallback also failed:", fallbackErr);
            throw primaryErr;
          }
        } else {
          // If browser CORS error (Failed to fetch)
          const isCors = primaryErr.name === "TypeError" || (primaryErr.message && primaryErr.message.includes("Failed to fetch"));
          if (isCors) {
            try {
              console.info("Direct call blocked by CORS. Attempting /api/chat proxy...");
              const vRes = await fetch("/api/chat", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${cfg.apiKey.trim()}`
                },
                body: JSON.stringify({
                  model: cfg.model || DEFAULT_GLM_MODEL,
                  messages: apiMessages,
                  temperature: 1.0,
                  max_tokens: 4096,
                  thinking: { type: "enabled" },
                  reasoning_effort: "max"
                })
              });
              if (vRes.ok) {
                data = await vRes.json();
                toast("💡 Đã tự động kết nối qua API Proxy!", 3000);
              } else {
                throw new Error("Proxy HTTP " + vRes.status);
              }
            } catch (proxyErr) {
              const cErr = new Error("CORS_POLICY_BLOCKED");
              cErr.isCors = true;
              throw cErr;
            }
          } else {
            throw primaryErr;
          }
        }
      }

      const choice = data?.choices?.[0]?.message;
      const reply = (choice?.content && choice.content.trim())
        ? choice.content
        : (choice?.reasoning_content && choice.reasoning_content.trim()
            ? choice.reasoning_content
            : "(Không nhận được phản hồi từ AI)");
      lessonAiConversations[lessonId].push({ role: "assistant", content: reply });

      const loadingEl = $("#aiLoadingIndicator");
      if (loadingEl) loadingEl.remove();

      if (thread) {
        const botMsgEl = document.createElement("div");
        botMsgEl.className = "ai-msg ai-msg-bot";
        botMsgEl.innerHTML = `
          <div class="ai-msg-avatar">🤖</div>
          <div class="ai-msg-content">${renderMarkdown(reply)}</div>
        `;
        thread.appendChild(botMsgEl);
        bindCopyButtons(botMsgEl);
        bindZoomableMedia(botMsgEl);
        if (window.mermaid) {
          try {
            const diags = botMsgEl.querySelectorAll(".mermaid");
            if (diags.length > 0) window.mermaid.run({ nodes: diags });
          } catch (e) {}
        }
        thread.scrollTop = thread.scrollHeight;
      }

      // If Clear button wasn't rendered before, ensure it shows
      const headerActions = $(".ai-header-actions");
      if (headerActions && !$("#btnClearAiChat")) {
        const btnClear = document.createElement("button");
        btnClear.type = "button";
        btnClear.className = "btn-ai-header";
        btnClear.id = "btnClearAiChat";
        btnClear.title = "Xóa lịch sử đoạn hội thoại của bài này";
        btnClear.textContent = "🗑️ Xóa hội thoại";
        btnClear.addEventListener("click", () => {
          if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử hỏi đáp của bài học này?")) {
            delete lessonAiConversations[lessonId];
            renderLesson(lessonId);
          }
        });
        headerActions.insertBefore(btnClear, headerActions.firstChild);
      }
    } catch (err) {
      console.error("GLM AI API Error:", err);
      const loadingEl = $("#aiLoadingIndicator");
      if (loadingEl) loadingEl.remove();

      const isCors = err.isCors || err.name === "TypeError" || (err.message && (err.message.includes("Failed to fetch") || err.message.includes("CORS")));

      if (thread) {
        const errEl = document.createElement("div");
        errEl.className = "ai-msg ai-msg-bot";
        if (isCors) {
          errEl.innerHTML = `
            <div class="ai-msg-avatar">⚠️</div>
            <div class="ai-msg-content" style="border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.08);">
              <p style="color: #fbbf24; font-weight: 700; margin-bottom: 6px; font-size: 14px;">⚠️ Trình duyệt chặn kết nối (CORS Policy của Z.AI)</p>
              <p style="font-size: 13px; color: var(--text-2); line-height: 1.6; margin: 0 0 10px;">
                Cổng máy chủ <code>api.z.ai</code> của Zhipu AI được thiết kế dạng <strong>Server-to-Server</strong>, hiện chưa mở CORS Header cho phép trình duyệt web (Chrome/Edge/Firefox) gọi trực tiếp.<br><br>
                <strong>💡 2 Cách khắc phục tức thì:</strong><br>
                1. <strong>Bật Tiện ích mở CORS (Nhanh nhất 30s):</strong> Cài extension <a href="https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">Allow CORS: Access-Control-Allow-Origin</a> trên Chrome/Edge và gạt nút <strong>ON</strong> (icon chuyển xanh) là chat được ngay lập tức!<br>
                2. <strong>Hoặc chạy Backend Spring Boot:</strong> Mở terminal chạy <code>cd backend &amp;&amp; mvn spring-boot:run</code>, hệ thống sẽ tự động chuyển tiếp qua Backend Proxy.
              </p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="btn btn-secondary btn-sm" id="btnErrOpenConfig" style="padding: 4px 10px; font-size: 12px;">⚙️ Mở Cấu hình AI</button>
                <a href="https://chromewebstore.google.com/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="padding: 4px 10px; font-size: 12px; text-decoration: none;">📥 Cài Allow CORS Extension</a>
              </div>
            </div>
          `;
        } else {
          errEl.innerHTML = `
            <div class="ai-msg-avatar">⚠️</div>
            <div class="ai-msg-content" style="border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.08);">
              <p style="color: #fca5a5; font-weight: 600; margin-bottom: 4px;">Không thể kết nối đến GLM AI API:</p>
              <p style="font-size: 13px; color: var(--text-2); margin: 0 0 8px;">${escapeHtml(err.message)}</p>
              <p style="font-size: 12px; margin: 0;">
                👉 Vui lòng kiểm tra lại API Key hoặc Endpoint: <button type="button" class="btn btn-secondary btn-sm" id="btnErrOpenConfig" style="padding: 3px 8px; font-size: 12px; margin-left: 6px;">⚙️ Kiểm tra Cấu hình</button>
              </p>
            </div>
          `;
        }
        thread.appendChild(errEl);
        $("#btnErrOpenConfig", errEl)?.addEventListener("click", openAiConfigModal);
        thread.scrollTop = thread.scrollHeight;
      }
      toast(isCors ? "⚠️ Bị chặn bởi CORS Policy của Z.AI" : `❌ Lỗi AI: ${err.message}`, 5000);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (input) {
        input.disabled = false;
        input.focus();
      }
    }
  }

  function bindLessonAiEvents(root, lessonId, c, m, lesson) {
    if (!root) return;

    // Quick Jump button from meta
    $("#btnJumpToAi", root)?.addEventListener("click", () => {
      const box = $("#lessonAiBox", root);
      if (box) {
        box.scrollIntoView({ behavior: "smooth", block: "start" });
        const input = $("#aiQuestionInput", root);
        if (input) setTimeout(() => input.focus(), 300);
      }
    });

    // Header actions
    $("#btnOpenAiConfig", root)?.addEventListener("click", openAiConfigModal);
    $("#btnClearAiChat", root)?.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử hỏi đáp của bài học này?")) {
        delete lessonAiConversations[lessonId];
        renderLesson(lessonId);
      }
    });

    // Quick key save button
    $("#btnSaveQuickKey", root)?.addEventListener("click", () => {
      const keyVal = $("#aiQuickKeyInput", root)?.value?.trim();
      if (!keyVal) {
        toast("⚠️ Vui lòng dán token GLM hợp lệ!");
        return;
      }
      saveGlmConfig(keyVal);
      toast("🎉 Đã lưu Token GLM thành công! Trợ lý AI đã sẵn sàng.");
      renderLesson(lessonId);
    });

    // Suggestion chips
    $$(".ai-chip", root).forEach((chip) => {
      chip.addEventListener("click", () => {
        const prompt = chip.dataset.prompt;
        if (!prompt) return;
        const input = $("#aiQuestionInput", root);
        if (input) input.value = prompt;
        askLessonAi(lessonId, prompt);
      });
    });

    // Input & Send button
    const input = $("#aiQuestionInput", root);
    const sendBtn = $("#btnSendAiQuestion", root);

    if (input) {
      input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 140) + "px";
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const val = input.value.trim();
          if (val) askLessonAi(lessonId, val);
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        const val = input ? input.value.trim() : "";
        if (val) askLessonAi(lessonId, val);
      });
    }
  }

  // ---------- Lesson ----------
  function renderLesson(lessonId) {
    const found = findLesson(lessonId);
    if (!found) return gotoView("dashboard");
    const { course: c, module: m, lesson } = found;
    state.currentLesson = lessonId;

    // Auto-sync active course
    if (state.activeCourseId !== c.id) {
      state.activeCourseId = c.id;
      localStorage.setItem(ACTIVE_COURSE_KEY, c.id);
    }

    const view = $("#view-lesson");
    if (!view) return;

    const isDemo = isLessonDemo(c, m, lesson);

    // Auto-enroll course locally so lesson & tracking are immediately accessible
    if (!state.enrolledCourses[c.id]) {
      state.enrolledCourses[c.id] = true;
      save();
    }

    const flat = flatIndex(c.id);
    const idx = flat.findIndex((x) => x.lesson.id === lessonId);
    const prev = flat[idx - 1];
    const next = flat[idx + 1];
    const done = !!state.completed[lessonId];

    const topicId = (lessonId || "").split("-")[1];
    const currentTopic = (m.topics || []).find(t => String(t.id) === topicId);

    const isPreviewGuest = isDemo && (!state.currentUser || !isCourseEnrolled(c.id));
    const demoBannerHtml = isPreviewGuest ? `
      <div class="demo-lesson-banner" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.22)); border: 1.5px solid rgba(245, 158, 11, 0.55); border-radius: 12px; padding: 14px 18px; margin-bottom: 22px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 12px; max-width: 650px;">
          <span style="font-size: 28px;">🎁</span>
          <div>
            <div style="font-weight: 700; color: #f59e0b; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.5px;">Bản Học Thử Miễn Phí (Free Demo Preview)</div>
            <div style="font-size: 13px; color: var(--text-secondary, #94a3b8); margin-top: 2px;">
              Bạn đang học thử <strong>${escapeHtml(lesson.title)}</strong> thuộc khóa <strong>${escapeHtml(c.title)}</strong>.<br>
              Tự do trải nghiệm toàn bộ bài giảng, sơ đồ Mermaid, chạy mã nguồn và thực hành chat cùng Trợ lý AI GLM-5.3!
            </div>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          ${!state.currentUser ? `
            <button class="btn btn-primary btn-sm" id="btnDemoLogin" style="font-weight: 700;">🔑 Đăng ký / Đăng nhập (Mở khóa trọn bộ)</button>
          ` : `
            <button class="btn btn-primary btn-sm" id="btnDemoEnroll" style="font-weight: 700;">🚀 Ghi danh miễn phí (Mở khóa ${c.modulesCount} Module)</button>
          `}
        </div>
      </div>
    ` : '';

    view.innerHTML = `
      <div class="lesson-header">
        <div class="breadcrumb">
          <a data-view="dashboard">${escapeHtml(c.shortTitle)}</a><span class="sep">›</span>
          <span>Module ${m.id}: ${escapeHtml(m.title)}</span><span class="sep">›</span>
          ${currentTopic ? `<span>Mục ${m.id}.${currentTopic.id}: ${escapeHtml(currentTopic.title)}</span><span class="sep">›</span>` : ""}
          <span>${escapeHtml(lesson.title)}</span>
        </div>
        <h1 class="lesson-title">
          ${isDemo ? '<span class="demo-tag-pill" style="background:#f59e0b;color:#000;font-size:12px;font-weight:800;padding:2px 8px;border-radius:4px;margin-right:8px;vertical-align:middle;">DEMO</span>' : ''}
          ${escapeHtml(lesson.title)}
        </h1>
        <div class="lesson-meta">
          <span>📖 ${lessonId}</span>
          <span>⏱ ${lesson.minutes} phút</span>
          <span>📦 Module ${m.id}</span>
          ${currentTopic ? `<span class="ud-topic-badge">🎯 Mục ${m.id}.${currentTopic.id}: ${escapeHtml(currentTopic.title)}</span>` : ""}
          <span class="ud-badge badge-user">${c.badge}</span>
          <button type="button" class="btn-meta-ask-ai" id="btnJumpToAi" title="Cuộn nhanh xuống Trợ lý AI bài này">🤖 Hỏi AI bài này</button>
        </div>
      </div>
      ${demoBannerHtml}
      <article class="lesson-body">${renderMarkdown(lesson.content)}</article>
      ${renderLessonAiWidget(lessonId, c, m, lesson)}
      <button class="btn-complete ${done ? "done" : ""}" id="completeBtn">
        ${done ? "✓ Đã hoàn thành bài này" : "☐ Đánh dấu hoàn thành"}
      </button>
      <div class="lesson-footer">
        ${prev ? `<button class="lf-btn" data-nav="${prev.lesson.id}">
            <span class="lf-label">← Bài trước</span>
            <span class="lf-title">${escapeHtml(prev.lesson.title)}</span>
          </button>` : `<div></div>`}
        ${next ? `<button class="lf-btn next" data-nav="${next.lesson.id}">
            <span class="lf-label">Bài tiếp theo →</span>
            <span class="lf-title ${next.lesson.type === "quiz" ? "finish" : ""}">${escapeHtml(next.lesson.title)}</span>
          </button>` : `<div></div>`}
      </div>`;

    if (isPreviewGuest) {
      $("#btnDemoLogin", view)?.addEventListener("click", () => {
        state.pendingTargetLesson = lessonId;
        state.pendingEnrollCourse = c.id;
        openAuthModal("register");
      });
      $("#btnDemoEnroll", view)?.addEventListener("click", async () => {
        await enrollCourse(c.id);
        renderLesson(lessonId);
      });
    }

    $("#completeBtn").addEventListener("click", () => {
      if (state.completed[lessonId]) {
        delete state.completed[lessonId];
        syncUncompleteLessonCloud(lessonId);
        toast("↩️ Đã hủy đánh dấu hoàn thành bài này");
        save();
        renderAll();
      } else {
        state.completed[lessonId] = true;
        const currentCourse = getActiveCourse();
        const prog = overallProgress(currentCourse.id);
        syncCompleteLessonCloud(lessonId);
        save();

        if (prog.pct === 100) {
          toast(`🏆 <strong>Chúc mừng! Bạn đã hoàn thành 100% khóa học ${escapeHtml(currentCourse.shortTitle)}!</strong>`, 5000);
          renderAll();
          setTimeout(() => openCertificateModal(currentCourse.id), 800);
        } else {
          if (next) {
            toast("🎉 <strong>Đã hoàn thành!</strong> Đang chuyển sang bài tiếp theo...", 1800);
            renderAll();
            setTimeout(() => gotoLesson(next.lesson.id), 750);
          } else {
            toast("🎉 Đã hoàn thành bài học!", 2500);
            renderAll();
          }
        }
      }
    });

    $$("[data-nav]", view).forEach((b) =>
      b.addEventListener("click", () => gotoLesson(b.dataset.nav)));
    $$(".breadcrumb [data-view]", view).forEach((b) =>
      b.addEventListener("click", () => gotoView(b.dataset.view)));
    bindCopyButtons(view);
    bindZoomableMedia(view);
    bindLessonAiEvents(view, lessonId, c, m, lesson);
    if (window.mermaid) {
      setTimeout(() => {
        try {
          const diagrams = view.querySelectorAll(".mermaid");
          if (diagrams.length > 0) {
            window.mermaid.run({ nodes: diagrams });
          }
          bindZoomableMedia(view);
        } catch (e) {
          console.warn("Mermaid execution error:", e);
        }
      }, 50);
    }
  }

  function bindZoomableMedia(root) {
    if (!root) return;
    $$(".lesson-body img", root).forEach((img) => {
      img.style.cursor = "zoom-in";
      img.onclick = (e) => {
        e.stopPropagation();
        openImageLightbox("img", img.src, img.alt || "Ảnh minh họa bài học");
      };
    });
    $$(".lesson-body .mermaid", root).forEach((m) => {
      m.style.cursor = "zoom-in";
      m.onclick = (e) => {
        e.stopPropagation();
        const svg = m.querySelector("svg");
        if (svg) {
          let prev = m.previousElementSibling;
          let headingText = "";
          while (prev) {
            if (/^H[1-4]$/i.test(prev.tagName)) {
              headingText = prev.textContent.trim();
              break;
            }
            prev = prev.previousElementSibling;
          }
          openImageLightbox("svg", svg, headingText ? `Sơ đồ: ${headingText}` : "Sơ đồ kiến trúc Mermaid");
        }
      };
    });
  }

  function bindCopyButtons(root) {
    $$(".cb-copy", root).forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const code = decodeURIComponent(btn.dataset.code);
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "✓ Đã sao chép";
          setTimeout(() => (btn.textContent = "Sao chép"), 1600);
        });
      });
    });
  }

  // ---------- Quiz (CES-2026 v2.5 Standardized Engine) ----------
  const quizState = {
    course: null,
    module: null,
    quiz: null,
    pool: [],
    questions: [],
    idx: 0,
    answers: [],
    finished: false
  };

  function getModuleQuizBank(m) {
    if (!m) return [];
    const quiz = (m.lessons || []).find((l) => l.type === "quiz");
    const inlineQ = (quiz && Array.isArray(quiz.questions)) ? quiz.questions : [];
    const expQ = (window.EXPANDED_QUIZZES && Array.isArray(window.EXPANDED_QUIZZES[String(m.id)]))
      ? window.EXPANDED_QUIZZES[String(m.id)]
      : [];
    
    const map = new Map();
    [...inlineQ, ...expQ].forEach((q) => {
      const key = (q.q || "").trim();
      if (key && !map.has(key)) {
        map.set(key, q);
      }
    });
    return Array.from(map.values());
  }

  function findRelevantLesson(q, module) {
    if (!module || !module.lessons) return null;
    const lessons = module.lessons.filter((l) => l.type !== "quiz");
    if (q.targetLessonId) {
      const found = lessons.find((l) => l.id === q.targetLessonId);
      if (found) return found;
    }
    const text = ((q.q || "") + " " + (q.scenario || "") + " " + (q.explain || "")).toLowerCase();
    let bestLesson = null;
    let maxMatches = 0;
    lessons.forEach((l) => {
      const lTitle = (l.title || "").toLowerCase();
      const words = lTitle.split(/[\s,–—\(\)\.\:\/]+/).filter((w) => w.length >= 3);
      let matches = 0;
      words.forEach((w) => {
        if (text.includes(w)) matches++;
      });
      if (matches > maxMatches) {
        maxMatches = matches;
        bestLesson = l;
      }
    });
    return bestLesson || lessons[0] || null;
  }

  function gotoQuiz(moduleId, courseId) {
    if (courseId && COURSES.some(c => c.id === courseId)) {
      state.activeCourseId = courseId;
      localStorage.setItem(ACTIVE_COURSE_KEY, courseId);
    }
    let activeCourse = getActiveCourse();
    let modules = getActiveModules();
    let m = modules.find((x) => String(x.id) === String(moduleId));
    if (!m) {
      for (const c of COURSES) {
        const foundM = (c.modules || []).find((x) => String(x.id) === String(moduleId));
        if (foundM) {
          state.activeCourseId = c.id;
          localStorage.setItem(ACTIVE_COURSE_KEY, c.id);
          activeCourse = c;
          modules = c.modules || [];
          m = foundM;
          break;
        }
      }
    }
    const quiz = m && (m.lessons || []).find((l) => l.type === "quiz");
    if (!quiz) return gotoView("dashboard");
    showView("quiz");
    setRouteHash("#/quiz/" + encodeURIComponent(moduleId));
    renderSidebar(quiz.id);
    renderDashboardStats();
    window.scrollTo({ top: 0 });
    closeSidebar();
    const view = $("#view-quiz");

    const fullBank = getModuleQuizBank(m);
    const poolSize = fullBank.length;
    const pullCount = Math.min(poolSize, 12);

    // Auto-enroll active course locally so quiz is immediately accessible
    if (!state.enrolledCourses[activeCourse.id]) {
      state.enrolledCourses[activeCourse.id] = true;
      save();
    }

    // Fisher-Yates shuffle to pull 12 random scenario questions from full bank
    const shuffled = [...fullBank];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const sessionQuestions = shuffled.slice(0, pullCount);

    quizState.course = activeCourse;
    quizState.module = m;
    quizState.quiz = quiz;
    quizState.pool = fullBank;
    quizState.questions = sessionQuestions;
    quizState.idx = 0;
    quizState.answers = new Array(sessionQuestions.length).fill(null);
    quizState.finished = false;
    state.currentQuizModule = moduleId;
    renderQuiz();
  }

  function renderQuiz() {
    const { questions, idx, answers, course, module, quiz, pool } = quizState;
    const view = $("#view-quiz");
    const total = questions.length;
    const scoreKey = quizState.course.id === "spring-boot-mastery" 
      ? quizState.module.id 
      : `${quizState.course.id}-${quizState.module.id}`;

    if (quizState.finished) {
      const score = answers.filter((a, i) => a === questions[i].answer).length;
      const pct = Math.round((score / total) * 100);
      const passed = pct >= 80;

      state.quizScores[scoreKey] = {
        score,
        total,
        pct,
        passed,
        poolSize: pool ? pool.length : total,
        timestamp: Date.now()
      };

      if (passed) {
        state.completed[quiz.id] = true;
        syncCompleteLessonCloud(quiz.id);
      } else {
        delete state.completed[quiz.id];
      }
      save();
      syncQuizCloud(scoreKey, score, total);

      const flat = flatIndex(course.id);
      const qIdx = flat.findIndex((x) => x.lesson.id === quiz.id);
      const next = flat[qIdx + 1];
      const courseProg = overallProgress(course.id);
      const isCourseDone = courseProg.pct === 100;

      const wrongItems = questions
        .map((qItem, i) => ({ q: qItem, chosen: answers[i], correct: qItem.answer, index: i }))
        .filter((item) => item.chosen !== item.correct);

      view.innerHTML = `
        <div class="quiz-wrap">
          <div class="quiz-result ${passed ? "passed" : "failed"}">
            <div class="qr-emoji">${passed ? "🏆" : "📖"}</div>
            <div class="qr-score">${score}<span class="qr-total">/${total}</span></div>
            <div class="qr-status-badge ${passed ? "pass" : "fail"}">
              ${passed ? "✓ ĐẠT CHUẨN ĐẦU RA SÁT HẠCH CES-2026 (≥ 80%)" : "✕ CHƯA ĐẠT CHUẨN ĐẦU RA (YÊU CẦU ≥ 80%)"}
            </div>
            <div style="font-weight:700;font-size:16px;color:var(--text-2);margin-bottom:8px;">${pct}% câu trả lời chính xác (${score}/${total} câu)</div>
            <p class="qr-msg">
              ${passed
                ? `Xuất sắc! Bạn đã vượt qua bài sát hạch kỹ thuật Module ${module.id} với 12 câu kịch bản ngẫu nhiên từ ngân hàng ${pool ? pool.length : total} câu. Năng lực của bạn đáp ứng tiêu chuẩn Certified Track!`
                : `Quy chuẩn CES-2026 yêu cầu đạt tối thiểu 80% (10/12 câu) để công nhận chứng chỉ Certified Track. Bạn làm đúng ${score}/${total} câu. Hãy ôn tập theo gợi ý dưới đây trước khi bốc đề mới.`
              }
            </p>
            <div class="qr-actions">
              <button class="btn btn-primary" id="retryQuiz" style="${passed ? "" : "background:var(--grad-main); font-weight:700;"}">
                🔄 Bốc đề mới & Thi lại (${total} câu từ pool ${pool ? pool.length : total} câu)
              </button>
              ${passed && isCourseDone ? `
                <button class="btn btn-primary" data-open-cert="${course.id}" style="background: linear-gradient(135deg, #a435f0, #8710d8); font-weight:800;">🎓 Nhận chứng chỉ tốt nghiệp</button>
              ` : ""}
              ${passed && next ? `<button class="btn btn-ghost" id="nextAfterQuiz">Tiếp tục: ${escapeHtml(next.lesson.title)} →</button>` : ""}
              <button class="btn btn-ghost" data-view="dashboard">📊 Về tổng quan khóa học</button>
            </div>

            ${!passed && wrongItems.length > 0 ? `
              <div class="qr-retake-box">
                <div class="qr-retake-head">
                  <span class="qr-retake-icon">🎯</span>
                  <div>
                    <h4>Đề Xuất Ôn Tập Thích Ứng (Adaptive Retake Guidance)</h4>
                    <p>Hệ thống phát hiện ${wrongItems.length} nội dung bạn cần củng cố lại trước khi thi lượt mới:</p>
                  </div>
                </div>
                <div class="qr-retake-list">
                  ${wrongItems.map((item) => {
                    const rel = findRelevantLesson(item.q, module);
                    return `
                      <div class="qr-retake-item">
                        <div class="qri-qnum">Câu ${item.index + 1}</div>
                        <div class="qri-info">
                          <div class="qri-question">${inline(item.q.q)}</div>
                          <div class="qri-explain"><strong>Phân tích:</strong> ${inline(item.q.explain)}</div>
                          ${rel ? `
                            <div class="qri-action">
                              <span class="qri-hint">Bài học cần đọc lại:</span>
                              <button class="btn-link qri-lesson-btn" data-goto-lesson="${rel.id}">
                                📖 [${rel.id}] ${escapeHtml(rel.title)} →
                              </button>
                            </div>
                          ` : ""}
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            ` : ""}

            <!-- Review all answers accordion -->
            <div class="qr-all-review">
              <details class="qr-details">
                <summary class="qr-summary">🔍 Xem lại chi tiết toàn bộ ${total} câu hỏi trong lượt thi này</summary>
                <div class="qr-review-cards">
                  ${questions.map((qItem, i) => {
                    const chosen = answers[i];
                    const isRight = chosen === qItem.answer;
                    const letters = ["A", "B", "C", "D", "E"];
                    return `
                      <div class="qr-review-card ${isRight ? "review-ok" : "review-bad"}">
                        <div class="qrc-head">
                          <span class="qrc-num">Câu ${i + 1}</span>
                          <span class="qrc-badge">${isRight ? "✅ Đúng" : "❌ Sai"}</span>
                        </div>
                        <div class="qrc-q">${inline(qItem.q)}</div>
                        <div class="qrc-ans-row">
                          <span>Bạn chọn: <strong>${chosen !== null ? letters[chosen] + ". " + inline(qItem.options[chosen] || "") : "Chưa chọn"}</strong></span>
                          ${!isRight ? `<span class="qrc-correct-ans">Đáp án đúng: <strong>${letters[qItem.answer]}. ${inline(qItem.options[qItem.answer])}</strong></span>` : ""}
                        </div>
                        <div class="qrc-exp">${inline(qItem.explain)}</div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </details>
            </div>
          </div>
        </div>`;

      $("#retryQuiz")?.addEventListener("click", () => gotoQuiz(quizState.module.id));
      const nxt = $("#nextAfterQuiz");
      if (nxt) nxt.addEventListener("click", () => gotoLesson(next.lesson.id));
      $$("[data-goto-lesson]", view).forEach((b) => {
        b.addEventListener("click", () => gotoLesson(b.dataset.gotoLesson));
      });
      $$("[data-view]", view).forEach((b) =>
        b.addEventListener("click", () => gotoView(b.dataset.view)));
      return;
    }

    const q = questions[idx];
    const chosen = answers[idx];
    const letters = ["A", "B", "C", "D", "E"];
    const answeredCount = answers.filter((a) => a !== null).length;

    view.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="q-badge">🏆 ${escapeHtml(quiz.title || `Sát hạch Module ${module.id}`)} · ${escapeHtml(course.shortTitle)}</div>
          <h2>Câu hỏi ${idx + 1} / ${total} <span class="q-pool-tag">(Rút ngẫu nhiên từ ngân hàng ${pool ? pool.length : total} câu)</span></h2>
          <p>Đã trả lời: <strong>${answeredCount}/${total}</strong> câu · Chuẩn CES-2026 Certified: <strong>≥ 80% (10/${total} câu)</strong></p>
        </div>

        <!-- Question Navigator Grid (Interactive 12 questions) -->
        <div class="quiz-nav-container">
          <div class="qnc-title">BẢNG ĐIỀU HƯỚNG CÂU HỎI (${total} CÂU SÁT HẠCH):</div>
          <div class="quiz-nav-grid">
            ${questions.map((_, i) => {
              const isCurrent = i === idx;
              const isAnswered = answers[i] !== null;
              const isCorrect = isAnswered && answers[i] === questions[i].answer;
              let cls = "qn-btn";
              if (isCurrent) cls += " current";
              if (isAnswered) cls += (isCorrect ? " correct" : " wrong");
              return `<button class="${cls}" data-jump-q="${i}" title="Câu ${i + 1}">${i + 1}</button>`;
            }).join("")}
          </div>
        </div>

        <div class="quiz-card">
          <div class="quiz-qnum">
            <span>Câu hỏi ${idx + 1} / ${total}</span>
            ${q.level ? `<span class="q-level ${q.level}">${q.level === "hard" ? "🔥 Khó / Senior" : q.level === "medium" ? "⚡ Vừa / Thực chiến" : "🎯 Cơ bản"}</span>` : ""}
          </div>
          ${q.scenario ? `<div class="quiz-scenario"><div class="qs-label">📋 Tình huống thực tế</div><div class="qs-text">${inline(q.scenario)}</div></div>` : ""}
          <div class="quiz-question">${inline(q.q)}</div>
          ${q.code ? `<div class="quiz-code">${codeHtml(q.code, q.codeLang || "java")}</div>` : ""}
          <div class="quiz-options">
            ${q.options.map((opt, oi) => {
              let cls = "quiz-opt";
              if (chosen !== null) {
                if (oi === q.answer) cls += " correct";
                else if (oi === chosen) cls += " wrong";
              }
              return `<button class="${cls}" data-opt="${oi}" ${chosen !== null ? "disabled" : ""}>
                <span class="qo-letter">${letters[oi]}</span>
                <span>${inline(opt)}</span>
              </button>`;
            }).join("")}
          </div>
          ${chosen !== null ? `
            <div class="quiz-explain ${chosen === q.answer ? "ok" : "bad"}">
              <strong>${chosen === q.answer ? "✅ Chính xác!" : `❌ Chưa đúng — đáp án đúng là ${letters[q.answer]}.`}</strong>
              ${inline(q.explain)}
            </div>
            ${q.why ? `<div class="quiz-why"><div class="qw-title">🔍 Mổ xẻ từng phương án</div>${q.why.map((w, wi) => `
              <div class="qw-row ${wi === q.answer ? "correct" : wi === chosen ? "chosen-wrong" : ""}">
                <span class="qw-letter">${letters[wi]}</span>
                <span class="qw-text">${inline(w)}</span>
              </div>`).join("")}</div>` : ""}` : ""}
        </div>
        <div class="quiz-actions">
          <button class="btn-secondary" id="quizPrev" ${idx === 0 ? "disabled" : ""}>← Trước</button>
          <button class="btn-primary btn" id="quizNext" style="border:none">
            ${chosen === null ? "Xác nhận →" : idx === total - 1 ? "Xem kết quả 🏁" : "Câu tiếp →"}
          </button>
        </div>
      </div>`;

    // Jump to specific question
    $$("[data-jump-q]", view).forEach((btn) => {
      btn.addEventListener("click", () => {
        quizState.idx = parseInt(btn.dataset.jumpQ, 10);
        renderQuiz();
      });
    });

    $$(".quiz-opt", view).forEach((b) =>
      b.addEventListener("click", () => {
        if (answers[idx] !== null) return;
        answers[idx] = parseInt(b.dataset.opt, 10);
        if (idx === total - 1 && answers.every((a) => a !== null)) {
          quizState.finished = true;
        }
        renderQuiz();
      }));

    $("#quizPrev").addEventListener("click", () => {
      if (idx > 0) { quizState.idx--; renderQuiz(); }
    });
    $("#quizNext").addEventListener("click", () => {
      if (answers[idx] === null && idx < total - 1) return;
      if (idx < total - 1) { quizState.idx++; renderQuiz(); }
      else { quizState.finished = true; renderQuiz(); }
    });
    bindCopyButtons(view);
  }

  function codeHtml(code, lang) {
    let highlighted = escapeHtml(code);
    if (window.hljs) {
      try { highlighted = window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value; } catch (e) {}
    }
    return `<div class="code-block"><div class="code-block-header"><span class="cb-lang">${lang}</span><button class="cb-copy" data-code="${encodeURIComponent(code)}">Sao chép</button></div><pre><code class="language-${lang} hljs">${highlighted}</code></pre></div>`;
  }

  // ---------- Curriculum ----------
  function renderCurriculum() {
    const view = $("#view-curriculum");
    const activeCourse = getActiveCourse();
    const modules = getActiveModules();
    const isEnrolled = isCourseEnrolled(activeCourse.id);

    view.innerHTML = `
      <div class="curr-intro">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h2>📚 Giáo trình: ${escapeHtml(activeCourse.title)}</h2>
            <p>${modules.length} module · ${allItems().length} bài học + quiz · ${activeCourse.hours} — click từng bài để bắt đầu học ngay.</p>
          </div>
          ${isEnrolled ? `
            <span class="mc-enrolled-pill" style="font-size:13px;padding:6px 12px;">✓ Đã ghi danh khóa học</span>
          ` : `
            <button class="btn btn-primary btn-sm" id="btnCurrEnrollCourse">🚀 Ghi danh khóa học (Miễn phí)</button>
          `}
        </div>
      </div>
      ${modules.map((m) => {
        const p = moduleProgress(m);
        return `
        <div class="curr-module mc-${m.id}">
          <div class="curr-module-head">
            <div class="cm-badge">${m.icon}</div>
            <div class="cm-info">
              <div class="cm-title">Module ${m.id}: ${escapeHtml(m.title)}</div>
              <div class="cm-meta">${(m.lessons || []).length} mục · ${(m.lessons || []).reduce((a, l) => a + (l.minutes || 0), 0)} phút · ${p.done}/${p.total} xong</div>
            </div>
            ${isEnrolled ? '<span class="mc-enrolled-pill" style="margin-right:10px;">✓ Đã mở khóa</span>' : '<span class="mc-unenrolled-pill" style="margin-right:10px;">🔒 Chưa ghi danh</span>'}
            <svg class="cm-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
          <div class="curr-lessons">
            ${m.topics && m.topics.length > 0 ? `
              <div class="curr-topics-container">
                ${m.topics.map(t => {
                  const tLessons = (m.lessons || []).filter(l => l.type !== "quiz" && l.id.split("-")[1] === String(t.id));
                  if (!tLessons.length) return "";
                  const doneCount = tLessons.filter(l => state.completed[l.id]).length;
                  return `
                    <div class="curr-topic-block">
                      <div class="ctb-head">
                        <span class="ctb-badge">Mục ${m.id}.${t.id}</span>
                        <div class="ctb-body">
                          <h4 class="ctb-title">${escapeHtml(t.title)}</h4>
                          <p class="ctb-desc">${escapeHtml(t.desc || "")}</p>
                        </div>
                        <div class="ctb-progress">
                          <span class="ctb-prog-text">${doneCount}/${tLessons.length} xong</span>
                          <div class="ctb-prog-bar">
                            <div class="ctb-prog-fill" style="width: ${Math.round((doneCount / tLessons.length) * 100)}%"></div>
                          </div>
                        </div>
                      </div>
                      <div class="ctb-lessons">
                        ${tLessons.map(l => `
                          <div class="curr-lesson ${state.completed[l.id] ? "done" : ""}" data-lesson="${l.id}">
                            <span class="cl-check">✓</span>
                            <span class="cl-title">${isLessonDemo(c, m, l) ? '<span class="demo-tag-pill" style="background:#f59e0b;color:#000;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;margin-right:6px;">HỌC THỬ</span>' : ''}${escapeHtml(l.title)}</span>
                            <span class="cl-type ${l.type}">${l.type === "theory" ? "Lý thuyết" : l.type === "practice" ? "Thực hành" : l.type === "pitfall" ? "Cạm bẫy" : "Synthesis"}</span>
                            <span class="cl-mins">${l.minutes} phút</span>
                          </div>
                        `).join("")}
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
              ${(() => {
                const q = (m.lessons || []).find(l => l.type === "quiz");
                if (!q) return "";
                const quizScore = state.quizScores && state.quizScores[m.id];
                return `
                  <div class="curr-quiz-cta" data-module-quiz="${m.id}">
                    <span class="cqc-icon">🏆</span>
                    <div class="cqc-info">
                      <h4>${escapeHtml(q.title)}</h4>
                      <p>Sát hạch toàn diện tư duy kiến trúc và kỹ năng giải quyết sự cố Module ${m.id}${typeof quizScore === "number" ? ` · Điểm cao nhất: <strong>${quizScore}%</strong>` : ""}</p>
                    </div>
                    <button class="btn btn-warning btn-sm" style="flex-shrink:0;">${typeof quizScore === "number" ? "Thi lại ↻" : "Bắt đầu sát hạch →"}</button>
                  </div>
                `;
              })()}
            ` : (
              (m.lessons || []).map((l) => `
                <div class="curr-lesson ${state.completed[l.id] ? "done" : ""}" data-lesson="${l.id}">
                  <span class="cl-check">✓</span>
                  <span class="cl-title">${isLessonDemo(c, m, l) ? '<span class="demo-tag-pill" style="background:#f59e0b;color:#000;font-size:10px;font-weight:800;padding:2px 6px;border-radius:4px;margin-right:6px;">HỌC THỬ</span>' : ''}${escapeHtml(l.title)}</span>
                  <span class="cl-type ${l.type}">${l.type === "quiz" ? "Quiz" : l.minutes >= 100 ? "Project" : "Bài học"}</span>
                  <span class="cl-mins">${l.minutes} phút</span>
                </div>`).join("")
            )}
          </div>
        </div>`;
      }).join("")}`;

    $("#btnCurrEnrollCourse", view)?.addEventListener("click", () => enrollCourse(activeCourse.id));
    $$(".curr-module-head", view).forEach((h) =>
      h.addEventListener("click", () => h.parentElement.classList.toggle("open")));
    $$(".curr-quiz-cta", view).forEach((el) =>
      el.addEventListener("click", () => startQuiz(parseInt(el.dataset.moduleQuiz, 10))));
    $$(".curr-lesson", view).forEach((el) =>
      el.addEventListener("click", () => gotoLesson(el.dataset.lesson)));
  }

  // ---------- User Dashboard & Personal Progress Page ----------
  function renderUserDashboard() {
    const view = $("#view-user-dashboard");
    if (!view) return;

    const scores = Object.values(state.quizScores);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length) + "%"
      : "—";

    const enrolledCourses = COURSES.filter((c) => isCourseEnrolled(c.id));
    const platProg = totalPlatformProgress();
    const user = state.currentUser;
    const displayName = user ? (user.full_name || user.fullName || user.username) : "Khách thăm quan";
    const initial = displayName.charAt(0).toUpperCase();
    const email = user ? (user.email || "") : "";
    const roleText = user && user.role === "ROLE_ADMIN" ? "Quản trị viên (Admin)" : user ? "Học viên chính thức" : "Chưa đăng nhập";

    let html = `
      <div class="ud-container">
        <!-- Profile Header -->
        <div class="ud-profile-header ${user ? "is-logged-in" : "is-guest"}">
          <div class="ud-profile-left">
            <div class="ud-avatar">${initial}</div>
            <div class="ud-profile-meta">
              <div class="ud-name-row">
                <h2>${escapeHtml(displayName)}</h2>
                <span class="ud-badge ${user && user.role === "ROLE_ADMIN" ? "badge-admin" : "badge-user"}">${roleText}</span>
                ${user ? '<span class="ud-badge badge-cloud">☁️ Đã kết nối Supabase Cloud</span>' : '<span class="ud-badge badge-local">🔒 Hãy đăng nhập để lưu trữ tiến độ &amp; ghi danh</span>'}
              </div>
              <p class="ud-email">${escapeHtml(email || "Đăng nhập để lưu tiến độ vĩnh viễn và đăng ký các khóa học")}</p>
            </div>
          </div>
          <div class="ud-profile-actions">
            ${user ? `
              <button class="btn btn-secondary btn-sm" id="udBtnSync">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Đồng bộ ngay
              </button>
              <button class="btn btn-ghost btn-sm" id="udBtnLogout">Đăng xuất</button>
            ` : `
              <button class="btn btn-primary btn-sm" id="udBtnLogin">🔑 Đăng nhập / Đăng ký</button>
            `}
          </div>
        </div>

        <!-- 4 Key Stat Cards -->
        <div class="ud-stats-grid">
          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Khóa học đã ghi danh</span>
              <span class="ud-stat-icon">🎓</span>
            </div>
            <div class="ud-stat-num">${enrolledCourses.length} / ${COURSES.filter(c => c.isAvailable !== false).length}</div>
            <div class="ud-stat-sub">Đang theo học ${enrolledCourses.length} lộ trình chuyên sâu</div>
          </div>

          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Tổng bài học hoàn thành</span>
              <span class="ud-stat-icon">📖</span>
            </div>
            <div class="ud-stat-num">${platProg.done} / ${platProg.total}</div>
            <div class="ud-stat-progress">
              <div class="ud-progress-bar"><div class="ud-progress-fill" style="width: ${platProg.pct}%"></div></div>
              <span>${platProg.pct}%</span>
            </div>
          </div>

          <div class="ud-stat-card">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Điểm Quiz trung bình</span>
              <span class="ud-stat-icon">🏆</span>
            </div>
            <div class="ud-stat-num">${avgScore}</div>
            <div class="ud-stat-sub">Đã thi ${scores.length} bài thi module</div>
          </div>

          <div class="ud-stat-card" style="cursor: pointer;" data-preview-cert="${state.activeCourseId}" title="Nhấp để xem mẫu chứng chỉ tốt nghiệp">
            <div class="ud-stat-top">
              <span class="ud-stat-title">Chứng chỉ tốt nghiệp</span>
              <span class="ud-stat-icon">🎓</span>
            </div>
            <div class="ud-stat-num">${enrolledCourses.filter(c => overallProgress(c.id).pct === 100).length} / ${enrolledCourses.length || 1}</div>
            <div class="ud-stat-sub">${enrolledCourses.filter(c => overallProgress(c.id).pct === 100).length > 0 ? "🏆 Đã đủ điều kiện nhận chứng chỉ" : "🎓 Xem mẫu chứng chỉ hoàn thành"}</div>
          </div>
        </div>

        <!-- Section 1: Khóa học đã ghi danh của tôi -->
        <div class="ud-section-head">
          <div class="ud-section-actions">
            <div>
              <h3>🎓 Khóa học đã ghi danh của tôi (${enrolledCourses.length}/${COURSES.filter(c => c.isAvailable !== false).length} khóa)</h3>
              <p>Toàn bộ các khóa học bạn đã đăng ký kèm tiến độ học tập chi tiết.</p>
            </div>
            <button class="btn btn-secondary btn-sm" data-view="courses">🌟 Khám phá thêm khóa học</button>
          </div>
        </div>

        ${!user ? `
          <div class="ud-empty-state">
            <div class="ud-empty-icon">🔒</div>
            <h3>Vui lòng đăng nhập để xem các khóa học của bạn</h3>
            <p>Sau khi đăng nhập hoặc tạo tài khoản miễn phí, bạn có thể ghi danh các khóa học mong muốn và theo dõi tiến độ học tập trên mọi thiết bị.</p>
            <button class="btn btn-primary" id="udBtnLoginPrompt">🔑 Đăng nhập / Đăng ký ngay</button>
          </div>
        ` : enrolledCourses.length === 0 ? `
          <div class="ud-empty-state">
            <div class="ud-empty-icon">📂</div>
            <h3>Chưa có khóa học nào trong danh sách học của bạn</h3>
            <p>Bạn chưa ghi danh vào khóa học nào. Hãy khám phá danh mục các khóa học bên dưới và bấm <strong>Ghi danh khóa học</strong> để bắt đầu!</p>
            <button class="btn btn-primary" id="udBtnEnrollSbEmpty">🚀 Ghi danh khóa Spring Boot Mastery (Miễn phí)</button>
          </div>
        ` : `
          <div class="ud-courses-list">
            ${enrolledCourses.map((c) => {
              const cProg = overallProgress(c.id);
              const cItems = allItems(c.id);
              const nextIncomplete = cItems.find(x => !state.completed[x.lesson.id]);
              const isActive = c.id === state.activeCourseId;

              return `
              <div class="ud-course-card ${isActive ? "active-learning" : ""}">
                <div class="ud-course-header">
                  <div class="ud-course-left">
                    <span class="ud-course-icon">${c.icon}</span>
                    <div>
                      <div class="ud-course-title">
                        ${escapeHtml(c.title)}
                        ${isActive ? '<span class="cat-badge-active" style="margin-left:8px;">⚡ Đang học</span>' : ''}
                      </div>
                      <div class="ud-course-meta">
                        <span>🧩 ${c.modulesCount} Module</span>
                        <span>📖 ${c.lessonsCount} Bài học</span>
                        <span>🏆 ${c.quizCount} Câu Quiz</span>
                        <span>⏱ ${c.hours}</span>
                        <span class="ud-badge badge-user">${c.badge}</span>
                      </div>
                    </div>
                  </div>
                  <div class="ud-course-right">
                    ${cProg.pct === 100 
                      ? '<span class="ud-mod-status done">🏆 Hoàn thành 100%</span>' 
                      : cProg.pct > 0 
                      ? `<span class="ud-mod-status in-progress">⚡ Đang học (${cProg.pct}%)</span>` 
                      : '<span class="ud-mod-status not-started">⏳ Chưa bắt đầu</span>'
                    }
                  </div>
                </div>

                <div class="ud-course-desc">${escapeHtml(c.desc)}</div>

                <!-- Progress Bar -->
                <div class="ud-course-progress-box">
                  <div class="ud-course-bar">
                    <div class="ud-course-fill" style="width: ${cProg.pct}%"></div>
                  </div>
                  <div class="ud-course-counts">
                    <span>${cProg.done}/${cProg.total} bài học hoàn thành</span>
                    <span>${cProg.pct}%</span>
                  </div>
                </div>

                <!-- Mini Modules Tracker -->
                <div class="ud-mini-modules">
                  ${(c.modules || []).map((m) => {
                    const p = moduleProgress(m);
                    const cls = p.pct === 100 ? "done" : p.pct > 0 ? "in-progress" : "";
                    const firstL = m.lessons && m.lessons[0];
                    return `<div class="ud-mini-chip ${cls}" data-goto-lesson="${firstL ? firstL.id : ""}" title="Module ${m.id}: ${escapeHtml(m.title)} (${p.done}/${p.total})">
                      M${m.id}: ${p.done}/${p.total} ${p.pct === 100 ? '✓' : ''}
                    </div>`;
                  }).join("")}
                </div>

                <!-- Next Step & Actions -->
                <div class="ud-course-footer">
                  <div class="ud-course-next">
                    ${cProg.pct === 100
                      ? '<span class="ud-next-done">🎉 Bạn đã hoàn thành toàn bộ khóa học này!</span>'
                      : nextIncomplete
                      ? `<span class="ud-next-label">Bài tiếp theo:</span> <strong>${escapeHtml(nextIncomplete.lesson.title)}</strong>`
                      : ""
                    }
                  </div>
                  <div class="ud-course-actions">
                    ${cProg.pct === 100 ? `
                      <button class="btn btn-sm" data-open-cert="${c.id}" style="background: linear-gradient(135deg, #a435f0, #8710d8); color:#fff; font-weight:700; border:none; padding:6px 14px; border-radius:6px; box-shadow:0 2px 8px rgba(164,53,240,0.3); cursor:pointer;">
                        🎓 Nhận chứng chỉ
                      </button>
                    ` : `
                      <button class="btn btn-ghost btn-sm" data-preview-cert="${c.id}" title="Xem trước mẫu chứng chỉ">
                        🎓 Mẫu chứng chỉ
                      </button>
                    `}
                    <button class="btn-unenroll" data-unenroll-course="${c.id}" title="Hủy ghi danh">✕ Hủy ghi danh</button>
                    <button class="btn btn-ghost btn-sm" data-switch-curriculum="${c.id}">📚 Xem giáo trình</button>
                    <button class="btn btn-primary btn-sm" data-switch-course="${c.id}" data-target-lesson="${nextIncomplete ? nextIncomplete.lesson.id : (cItems[0] ? cItems[0].lesson.id : '')}">
                      ${isActive ? "Học tiếp bài này →" : "🚀 Vào học khóa này →"}
                    </button>
                  </div>
                </div>
              </div>`;
            }).join("")}
          </div>
        `}

        <!-- Section 2: Khám phá tất cả khóa học (Course Catalog) -->
        <div class="ud-catalog-section">
          <div class="ud-section-actions">
            <div>
              <h3>🌟 Khám phá tất cả khóa học trên nền tảng (${COURSES.filter(c => c.isAvailable !== false).length} khóa học)</h3>
              <p>Ghi danh các khóa học chuyên sâu từ Backend, Frontend đến DevOps để hoàn thiện bộ kỹ năng Fullstack Enterprise.</p>
            </div>
            <button class="btn btn-secondary btn-sm" data-view="courses">Xem trang Catalog đầy đủ →</button>
          </div>

          <div class="ud-catalog-grid">
            ${COURSES.filter(c => c.isAvailable !== false).map((c) => {
              const enrolled = isCourseEnrolled(c.id);
              const isActive = c.id === state.activeCourseId;
              return `
              <div class="ud-catalog-card ${enrolled ? "enrolled-card" : ""}">
                <div>
                  <div class="ud-cat-top">
                    <div class="ud-cat-badge">${c.icon}</div>
                    <div>
                      <div class="ud-cat-title">${escapeHtml(c.title)}</div>
                      <div class="ud-cat-sub">${escapeHtml(c.badge)} · ${c.level}</div>
                    </div>
                  </div>
                  <div class="ud-cat-desc">${escapeHtml(c.desc)}</div>
                  <div class="ud-tags-row">
                    ${c.tags.map(t => `<span class="ud-tag">${t}</span>`).join("")}
                  </div>
                  <div class="ud-cat-meta">
                    <span>🧩 ${c.modulesCount} Module</span>
                    <span>📖 ${c.lessonsCount} Bài học</span>
                    <span>🏆 ${c.quizCount} Quiz</span>
                    <span>⏱ ${c.hours}</span>
                  </div>
                </div>
                <div class="ud-cat-footer">
                  ${enrolled ? `
                    <span class="mc-enrolled-pill">✓ Đã trong danh sách học</span>
                    <button class="btn btn-primary btn-sm" data-switch-course="${c.id}">
                      ${isActive ? "Đang học khóa này →" : "Vào học ngay →"}
                    </button>
                  ` : `
                    <span class="mc-unenrolled-pill">Miễn phí 100%</span>
                    <button class="btn btn-primary btn-sm" data-enroll-course="${c.id}">
                      🚀 Ghi danh khóa học
                    </button>
                  `}
                </div>
              </div>`;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    view.innerHTML = html;

    // Listeners
    $("#udBtnSync", view)?.addEventListener("click", async () => {
      toast("⏳ Đang đồng bộ với Supabase...");
      await syncLocalAndCloud();
      renderUserDashboard();
      toast("☁️ Đã đồng bộ mới nhất từ Supabase!");
    });

    $("#udBtnLogout", view)?.addEventListener("click", () => {
      state.currentUser = null;
      state.token = null;
      state.enrolledModules = {};
      state.enrolledCourses = {};
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      updateAuthUI();
      renderUserDashboard();
      toast("👋 Đã đăng xuất.");
    });

    $("#udBtnLogin", view)?.addEventListener("click", () => openAuthModal("login"));
    $("#udBtnLoginPrompt", view)?.addEventListener("click", () => openAuthModal("login"));
    $("#udBtnEnrollSbEmpty", view)?.addEventListener("click", () => enrollCourse("spring-boot-mastery"));

    $$("[data-enroll-course]", view).forEach((btn) => {
      btn.addEventListener("click", () => enrollCourse(btn.dataset.enrollCourse));
    });

    $$("[data-unenroll-course]", view).forEach((btn) => {
      btn.addEventListener("click", () => unenrollCourse(btn.dataset.unenrollCourse));
    });

    $$("[data-switch-course]", view).forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetLesson = btn.dataset.targetLesson;
        switchCourse(btn.dataset.switchCourse, targetLesson || null);
      });
    });

    $$("[data-switch-curriculum]", view).forEach((btn) => {
      btn.addEventListener("click", () => {
        state.activeCourseId = btn.dataset.switchCurriculum;
        localStorage.setItem(ACTIVE_COURSE_KEY, state.activeCourseId);
        gotoView("curriculum");
      });
    });

    $$("[data-goto-lesson]", view).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.gotoLesson) gotoLesson(btn.dataset.gotoLesson);
      });
    });

    $$("[data-view]", view).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        gotoView(el.dataset.view);
      });
    });
  }

  // ---------- Search ----------
  function buildSearchIndex() {
    state.searchIdx = [];
    COURSES.forEach(c => {
      (c.modules || []).forEach((m) => (m.lessons || []).forEach((l) => {
        if (l.type === "quiz") {
          (l.questions || []).forEach((q, i) =>
            state.searchIdx.push({
              title: `Quiz: ${q.q.slice(0, 60)}...`,
              snippet: `${c.shortTitle} · M${m.id} · Câu ${i + 1}`,
              target: l.id,
              courseId: c.id
            })
          );
        } else {
          state.searchIdx.push({
            title: l.title,
            snippet: `${c.shortTitle} · Module ${m.id}: ${m.title}`,
            target: l.id,
            courseId: c.id
          });
        }
      }));
    });
  }

  function doSearch(q) {
    const box = $("#searchResults");
    if (!q || q.trim().length < 2) {
      box.classList.remove("open");
      box.innerHTML = "";
      return;
    }
    const needle = q.toLowerCase();
    const hits = state.searchIdx
      .filter((x) => x.title.toLowerCase().includes(needle) || x.snippet.toLowerCase().includes(needle))
      .slice(0, 8);

    if (hits.length === 0) {
      box.innerHTML = `<div class="search-empty">Không tìm thấy bài học nào phù hợp</div>`;
    } else {
      box.innerHTML = hits
        .map((h) => `
          <div class="search-item" data-target="${h.target}" data-course="${h.courseId || ""}">
            <div class="si-title">${escapeHtml(h.title)}</div>
            <div class="si-mod">${escapeHtml(h.snippet)}</div>
          </div>`)
        .join("");

      $$(".search-item", box).forEach((el) =>
        el.addEventListener("click", () => {
          box.classList.remove("open");
          $("#searchInput").value = "";
          if (el.dataset.course) {
            state.activeCourseId = el.dataset.course;
          }
          gotoLesson(el.dataset.target);
        }));
    }
    box.classList.add("open");
  }

  // ---------- Router & History Hash Navigation ----------
  let isRoutingFromHash = false;

  function setRouteHash(hash) {
    if (isRoutingFromHash) return;
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }

  function handleHashRoute() {
    const raw = window.location.hash || "";
    const hash = raw.trim();

    if (!hash || hash === "#" || hash === "#/" || hash.startsWith("#/courses")) {
      isRoutingFromHash = true;
      try {
        showView("courses");
        renderCoursesCatalog();
        renderSidebar(null);
        renderDashboardStats();
      } finally {
        isRoutingFromHash = false;
      }
      return;
    }

    if (hash.startsWith("#/lesson/")) {
      const lessonId = decodeURIComponent(hash.replace("#/lesson/", "").split("?")[0].trim());
      if (lessonId) {
        isRoutingFromHash = true;
        try {
          gotoLesson(lessonId);
        } finally {
          isRoutingFromHash = false;
        }
        return;
      }
    }

    if (hash.startsWith("#/quiz/")) {
      const modId = decodeURIComponent(hash.replace("#/quiz/", "").split("?")[0].trim());
      if (modId) {
        isRoutingFromHash = true;
        try {
          gotoQuiz(modId);
        } finally {
          isRoutingFromHash = false;
        }
        return;
      }
    }

    if (hash.startsWith("#/dashboard")) {
      const queryIdx = hash.indexOf("?");
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.slice(queryIdx + 1));
        const cId = params.get("course");
        if (cId && COURSES.some(c => c.id === cId)) {
          state.activeCourseId = cId;
          localStorage.setItem(ACTIVE_COURSE_KEY, cId);
        }
      }
      isRoutingFromHash = true;
      try {
        showView("dashboard");
        renderDashboard();
        renderSidebar(null);
        renderDashboardStats();
      } finally {
        isRoutingFromHash = false;
      }
      return;
    }

    if (hash.startsWith("#/curriculum")) {
      const queryIdx = hash.indexOf("?");
      if (queryIdx !== -1) {
        const params = new URLSearchParams(hash.slice(queryIdx + 1));
        const cId = params.get("course");
        if (cId && COURSES.some(c => c.id === cId)) {
          state.activeCourseId = cId;
          localStorage.setItem(ACTIVE_COURSE_KEY, cId);
        }
      }
      isRoutingFromHash = true;
      try {
        showView("curriculum");
        renderCurriculum();
        renderSidebar(null);
        renderDashboardStats();
      } finally {
        isRoutingFromHash = false;
      }
      return;
    }

    if (hash.startsWith("#/user-dashboard")) {
      isRoutingFromHash = true;
      try {
        showView("user-dashboard");
        renderUserDashboard();
        renderSidebar(null);
        renderDashboardStats();
      } finally {
        isRoutingFromHash = false;
      }
      return;
    }

    // Direct lesson ID fallback (e.g. #0-1-1 or #j0-1-1)
    const directId = hash.replace(/^#\/?/, "");
    const found = findLesson(directId);
    if (found) {
      isRoutingFromHash = true;
      try {
        gotoLesson(directId);
      } finally {
        isRoutingFromHash = false;
      }
      return;
    }

    // Fallback to courses
    isRoutingFromHash = true;
    try {
      showView("courses");
      renderCoursesCatalog();
      renderSidebar(null);
      renderDashboardStats();
    } finally {
      isRoutingFromHash = false;
    }
  }

  function showView(name) {
    state.view = name;
    ["dashboard", "lesson", "quiz", "curriculum", "user-dashboard", "courses"].forEach((v) => {
      const el = $("#view-" + v);
      if (el) el.hidden = v !== name;
    });

    // Update Header active button states
    const btnCat = $("#btnHeaderCatalog");
    const btnMy = $("#btnHeaderMyLearning");
    if (btnCat) btnCat.classList.toggle("active", name === "courses");
    if (btnMy) btnMy.classList.toggle("active", name === "user-dashboard");

    // Context-aware brand text & sidebar footer
    updateBrandText();
    updateSidebarFooter();

    window.scrollTo({ top: 0 });
    closeSidebar();
  }

  function gotoView(name) {
    showView(name);
    if (name === "dashboard") {
      renderDashboard();
      renderSidebar(null);
      setRouteHash("#/dashboard?course=" + state.activeCourseId);
    } else if (name === "courses") {
      renderCoursesCatalog();
      renderSidebar(null);
      setRouteHash("#/courses");
    } else if (name === "curriculum") {
      renderCurriculum();
      renderSidebar(null);
      setRouteHash("#/curriculum?course=" + state.activeCourseId);
    } else if (name === "user-dashboard") {
      renderUserDashboard();
      renderSidebar(null);
      setRouteHash("#/user-dashboard");
    }
    renderDashboardStats();
  }

  function gotoLesson(id) {
    const found = findLesson(id);
    if (!found) return;
    if (found.course && state.activeCourseId !== found.course.id) {
      state.activeCourseId = found.course.id;
      localStorage.setItem(ACTIVE_COURSE_KEY, found.course.id);
    }
    if (found.lesson.type === "quiz") return gotoQuiz(found.module.id);
    showView("lesson");
    renderLesson(id);
    renderSidebar(id);
    renderDashboardStats();
    setRouteHash("#/lesson/" + encodeURIComponent(id));
    const t = $("#toast");
    if (t && t.textContent && t.textContent.includes("bài tiếp theo")) {
      setTimeout(() => dismissToast(), 600);
    }
  }

  function renderDashboardStats() {
    const total = overallProgress();
    const pctEl = $("#headerProgressPct");
    if (pctEl) pctEl.textContent = total.pct + "%";
    const ring = $("#headerRing");
    if (ring) {
      const HCIRC = 100.5;
      ring.style.strokeDashoffset = HCIRC - (HCIRC * total.pct) / 100;
    }
  }

  function renderAll() {
    renderSidebar(state.currentLesson);
    if (state.view === "courses") renderCoursesCatalog();
    else if (state.view === "user-dashboard") renderUserDashboard();
    else if (state.view === "curriculum") renderCurriculum();
    else if (state.view === "dashboard") renderDashboard();
    renderDashboardStats();
  }

  // ---------- Sidebar mobile ----------
  function closeSidebar() {
    $("#sidebar").classList.remove("open");
    $("#backdrop").classList.remove("show");
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    $("#btnThemeToggle")?.addEventListener("click", toggleTheme);
    initializeCoursesData();
    load();
    buildSearchIndex();

    // Brand title update
    const activeCourse = getActiveCourse();
    updateBrandText(activeCourse);

    $("#menuToggle").addEventListener("click", () => {
      $("#sidebar").classList.toggle("open");
      $("#backdrop").classList.toggle("show");
    });
    $("#backdrop").addEventListener("click", closeSidebar);

    // Auto-close mobile sidebar drawer when clicking an item
    $("#sidebarNav")?.addEventListener("click", (e) => {
      if (window.innerWidth <= 860) {
        const item = e.target.closest(".nav-lesson, .sp-nav-item, .sidebar-back-btn, [data-view], [data-goto-lesson], [data-enter-course], [data-switch-course]");
        if (item) {
          closeSidebar();
        }
      }
    });

    // Header Navigation Buttons
    $("#btnHeaderCatalog")?.addEventListener("click", (e) => {
      e.preventDefault();
      gotoView("courses");
    });
    $("#btnHeaderMyLearning")?.addEventListener("click", (e) => {
      e.preventDefault();
      gotoView("user-dashboard");
    });
    $("#brandLogoLink")?.addEventListener("click", (e) => {
      e.preventDefault();
      gotoView("courses");
    });

    $$("[data-view]").forEach((el) => {
      if (el.closest("#sidebarNav") || el.closest("#view-lesson") || el.closest("#view-quiz")) return;
      el.addEventListener("click", (e) => {
        e.preventDefault();
        gotoView(el.dataset.view);
      });
    });

    const searchInput = $("#searchInput");
    searchInput.addEventListener("input", (e) => doSearch(e.target.value));
    searchInput.addEventListener("focus", (e) => doSearch(e.target.value));
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === "Escape") {
        $("#searchResults").classList.remove("open");
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-box")) {
        $("#searchResults").classList.remove("open");
      }
    });

    $("#resetProgress").addEventListener("click", () => {
      if (confirm("Bạn có chắc muốn xóa toàn bộ tiến độ học và điểm quiz trên trình duyệt này không?")) {
        state.completed = {};
        state.quizScores = {};
        save();
        renderAll();
        toast("🗑️ Đã xóa tiến độ!");
      }
    });

    // Auth events
    $("#authBtn").addEventListener("click", () => {
      if (state.currentUser) {
        const dd = $("#userDropdown");
        dd.style.display = dd.style.display === "none" ? "block" : "none";
      } else {
        openAuthModal("login");
      }
    });

    document.addEventListener("click", (e) => {
      const wrapper = $("#userMenuWrapper");
      if (wrapper && !wrapper.contains(e.target)) {
        const dd = $("#userDropdown");
        if (dd) dd.style.display = "none";
      }
    });

    $("#tabLogin")?.addEventListener("click", () => openAuthModal("login"));
    $("#tabRegister")?.addEventListener("click", () => openAuthModal("register"));
    $("#modalClose")?.addEventListener("click", closeAuthModal);
    $("#authModalBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "authModalBackdrop") closeAuthModal();
    });

    $("#loginForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const u = $("#loginUsername").value.trim();
      const p = $("#loginPassword").value;
      const btn = $("#btnLoginSubmit");
      const btnText = btn.querySelector(".btn-text");

      try {
        btn.disabled = true;
        btnText.textContent = "Đang đăng nhập...";
        hideAuthAlert();

        const passHash = await hashPassword(p);
        const users = await supabaseCall("/users?or=(username.eq." + encodeURIComponent(u) + ",email.eq." + encodeURIComponent(u) + ")&password_hash.eq." + passHash + "&select=*");

        if (!users || users.length === 0) {
          throw new Error("Sai tên đăng nhập hoặc mật khẩu! Vui lòng kiểm tra lại.");
        }

        const user = users[0];
        state.currentUser = user;
        state.token = "sb_jwt_" + user.id + "_" + Date.now();
        localStorage.setItem(TOKEN_KEY, state.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        showAuthAlert("Đăng nhập thành công!", false);
        toast(`👋 Chào mừng bạn trở lại, <strong>${escapeHtml(user.full_name || user.username)}</strong>!`);

        await syncLocalAndCloud();
        updateAuthUI();

        setTimeout(() => {
          closeAuthModal();
          btn.disabled = false;
          btnText.textContent = "Đăng Nhập";

          if (state.pendingEnrollCourse) {
            enrollCourse(state.pendingEnrollCourse);
            state.pendingEnrollCourse = null;
          }
          if (state.pendingTargetLesson) {
            gotoLesson(state.pendingTargetLesson);
            state.pendingTargetLesson = null;
          }
        }, 500);
      } catch (err) {
        showAuthAlert(err.message || "Đăng nhập thất bại.");
        btn.disabled = false;
        btnText.textContent = "Đăng Nhập";
      }
    });

    $("#registerForm")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = $("#regFullName").value.trim();
      const u = $("#regUsername").value.trim();
      const em = $("#regEmail").value.trim();
      const p = $("#regPassword").value;
      const btn = $("#btnRegisterSubmit");
      const btnText = btn.querySelector(".btn-text");

      try {
        btn.disabled = true;
        btnText.textContent = "Đang tạo tài khoản...";
        hideAuthAlert();

        if (p.length < 6) throw new Error("Mật khẩu phải có tối thiểu 6 ký tự!");
        if (u.length < 3) throw new Error("Tên đăng nhập phải có ít nhất 3 ký tự!");

        const exist = await supabaseCall("/users?or=(username.eq." + encodeURIComponent(u) + ",email.eq." + encodeURIComponent(em) + ")&select=id");
        if (exist && exist.length > 0) {
          throw new Error("Username hoặc Email này đã tồn tại trong hệ thống!");
        }

        const passHash = await hashPassword(p);
        const newUser = {
          username: u,
          email: em,
          password_hash: passHash,
          full_name: fullName || u,
          role: "ROLE_USER"
        };

        const created = await supabaseCall("/users", "POST", newUser, { "Prefer": "return=representation" });
        const user = Array.isArray(created) ? created[0] : (created || newUser);

        state.currentUser = user;
        state.token = "sb_jwt_" + (user.id || u) + "_" + Date.now();
        localStorage.setItem(TOKEN_KEY, state.token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));

        showAuthAlert("Tạo tài khoản thành công!", false);
        toast(`🎉 Chúc mừng bạn đã đăng ký tài khoản thành công!`);

        await syncLocalAndCloud();
        updateAuthUI();

        setTimeout(() => {
          closeAuthModal();
          btn.disabled = false;
          btnText.textContent = "Tạo Tài Khoản";

          if (state.pendingEnrollCourse) {
            enrollCourse(state.pendingEnrollCourse);
            state.pendingEnrollCourse = null;
          }
          if (state.pendingTargetLesson) {
            gotoLesson(state.pendingTargetLesson);
            state.pendingTargetLesson = null;
          }
        }, 600);
      } catch (err) {
        showAuthAlert(err.message || "Đăng ký thất bại.");
        btn.disabled = false;
        btnText.textContent = "Tạo Tài Khoản";
      }
    });

    $("#btnLogout")?.addEventListener("click", () => {
      state.currentUser = null;
      state.token = null;
      state.enrolledModules = {};
      state.enrolledCourses = {};
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      updateAuthUI();
      renderAll();
      toast("👋 Đã đăng xuất.");
    });

    $("#btnGoUserDashboard")?.addEventListener("click", () => {
      const dd = $("#userDropdown");
      if (dd) dd.style.display = "none";
      gotoView("user-dashboard");
    });

    $("#btnSyncCloud")?.addEventListener("click", async () => {
      const dd = $("#userDropdown");
      if (dd) dd.style.display = "none";
      toast("⏳ Đang đồng bộ với Supabase Cloud...");
      await syncLocalAndCloud();
      toast("☁️ Đã đồng bộ tiến độ mới nhất!");
    });

    // Certificate Modal Events
    $("#certModalClose")?.addEventListener("click", closeCertificateModal);
    $("#certModalBackdrop")?.addEventListener("click", (e) => {
      if (e.target.id === "certModalBackdrop") closeCertificateModal();
    });
    $("#btnUpdateCertName")?.addEventListener("click", updateCertificateStudentName);
    $("#certStudentNameInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") updateCertificateStudentName();
    });
    $("#btnDownloadCertPng")?.addEventListener("click", downloadCertificateAsPng);
    $("#btnPrintCert")?.addEventListener("click", () => window.print());
    $("#btnCopyCertCode")?.addEventListener("click", () => {
      if (currentCertData && currentCertData.code) {
        navigator.clipboard.writeText(currentCertData.code);
        toast(`📋 Đã sao chép mã xác thực: <strong>${currentCertData.code}</strong>`);
      }
    });

    // Lightbox Modal Events
    $("#lightboxCloseBtn")?.addEventListener("click", closeImageLightbox);
    $("#imageLightboxModal")?.addEventListener("click", (e) => {
      if (e.target.id === "imageLightboxModal") closeImageLightbox();
    });
    $("#lightboxZoomIn")?.addEventListener("click", () => setLightboxZoom(lbState.zoom + 0.25));
    $("#lightboxZoomOut")?.addEventListener("click", () => setLightboxZoom(lbState.zoom - 0.25));
    $("#lightboxZoomReset")?.addEventListener("click", resetLightboxZoom);

    const lbStage = $("#lightboxStage");
    if (lbStage) {
      lbStage.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.2 : -0.2;
        setLightboxZoom(lbState.zoom + delta);
      }, { passive: false });

      lbStage.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        lbState.isDragging = true;
        lbState.startX = e.clientX - lbState.panX;
        lbState.startY = e.clientY - lbState.panY;
        lbStage.classList.add("grabbing");
      });

      window.addEventListener("mousemove", (e) => {
        if (!lbState.isDragging) return;
        lbState.panX = e.clientX - lbState.startX;
        lbState.panY = e.clientY - lbState.startY;
        updateLightboxTransform();
      });

      window.addEventListener("mouseup", () => {
        if (lbState.isDragging) {
          lbState.isDragging = false;
          lbStage.classList.remove("grabbing");
        }
      });

      // Double-click to toggle zoom
      $("#lightboxCanvas")?.addEventListener("dblclick", () => {
        if (lbState.zoom > 1.2) {
          resetLightboxZoom();
        } else {
          setLightboxZoom(2.0);
        }
      });
    }

    // AI Config Modal Events
    $("#aiConfigCloseBtn")?.addEventListener("click", closeAiConfigModal);
    $("#aiConfigModal")?.addEventListener("click", (e) => {
      if (e.target.id === "aiConfigModal") closeAiConfigModal();
    });

    // Preset buttons
    $("#btnPresetZaiFlagship")?.addEventListener("click", () => {
      const endpointInput = $("#glmEndpointInput");
      const modelSelect = $("#glmModelSelect");
      if (endpointInput) endpointInput.value = ZAI_CODING_ENDPOINT;
      if (modelSelect) modelSelect.value = "glm-5.3";
      toast("🌟 Đã chọn preset Z.AI GLM-5.3 Flagship (Deep Reasoning)!");
    });

    $("#btnPresetZaiCoding")?.addEventListener("click", () => {
      const endpointInput = $("#glmEndpointInput");
      const modelSelect = $("#glmModelSelect");
      if (endpointInput) endpointInput.value = ZAI_CODING_ENDPOINT;
      if (modelSelect) modelSelect.value = "glm-4.5";
      toast("⚡ Đã chọn preset Z.AI GLM-4.5 (Siêu nhanh)!");
    });

    $("#btnPresetBigmodel")?.addEventListener("click", () => {
      const endpointInput = $("#glmEndpointInput");
      const modelSelect = $("#glmModelSelect");
      if (endpointInput) endpointInput.value = BIGMODEL_CHINA_ENDPOINT;
      if (modelSelect) modelSelect.value = "glm-4-flash";
      toast("🇨🇳 Đã chọn preset BigModel China (glm-4-flash)!");
    });
    $("#btnToggleGlmKey")?.addEventListener("click", () => {
      const inp = $("#glmApiKeyInput");
      const btn = $("#btnToggleGlmKey");
      if (!inp) return;
      if (inp.type === "password") {
        inp.type = "text";
        if (btn) btn.textContent = "🙈";
      } else {
        inp.type = "password";
        if (btn) btn.textContent = "👁️";
      }
    });
    $("#btnClearGlmKey")?.addEventListener("click", () => {
      saveGlmConfig("");
      const keyInput = $("#glmApiKeyInput");
      if (keyInput) keyInput.value = "";
      toast("🗑️ Đã xóa token GLM khỏi trình duyệt");
      closeAiConfigModal();
      if (state.view === "lesson" && state.currentLesson) {
        renderLesson(state.currentLesson);
      }
    });
    $("#btnSaveGlmConfig")?.addEventListener("click", () => {
      const key = $("#glmApiKeyInput")?.value?.trim() || "";
      const model = $("#glmModelSelect")?.value || DEFAULT_GLM_MODEL;
      const endpoint = $("#glmEndpointInput")?.value?.trim() || DEFAULT_GLM_ENDPOINT;
      saveGlmConfig(key, model, endpoint);
      toast("✅ Đã lưu cấu hình AI thành công!");
      closeAiConfigModal();
      if (state.view === "lesson" && state.currentLesson) {
        renderLesson(state.currentLesson);
      }
    });

    // Keyboard shortcuts for Lightbox & Modals
    window.addEventListener("keydown", (e) => {
      const aiModal = $("#aiConfigModal");
      if (aiModal && aiModal.style.display !== "none" && e.key === "Escape") {
        closeAiConfigModal();
      }

      const modal = $("#imageLightboxModal");
      if (modal && modal.style.display !== "none") {
        if (e.key === "Escape") {
          closeImageLightbox();
        } else if (e.key === "+" || e.key === "=") {
          setLightboxZoom(lbState.zoom + 0.25);
        } else if (e.key === "-" || e.key === "_") {
          setLightboxZoom(lbState.zoom - 0.25);
        } else if (e.key === "0") {
          resetLightboxZoom();
        }
      }
    });

    // Global delegation for opening images & diagrams in lightbox
    document.addEventListener("click", (e) => {
      const img = e.target.closest(".lesson-body img, .article-body img");
      if (img && !img.closest("#imageLightboxModal")) {
        e.preventDefault();
        e.stopPropagation();
        openImageLightbox("img", img.src, img.alt || "Ảnh minh họa bài học");
        return;
      }
      const mermaidBox = e.target.closest(".mermaid");
      if (mermaidBox && mermaidBox.closest(".lesson-body, #view-lesson")) {
        const svg = mermaidBox.querySelector("svg");
        if (svg) {
          e.preventDefault();
          e.stopPropagation();
          let prev = mermaidBox.previousElementSibling;
          let headingText = "";
          while (prev) {
            if (/^H[1-4]$/i.test(prev.tagName)) {
              headingText = prev.textContent.trim();
              break;
            }
            prev = prev.previousElementSibling;
          }
          openImageLightbox("svg", svg, headingText ? `Sơ đồ: ${headingText}` : "Sơ đồ kiến trúc Mermaid");
        }
      }
    });

    // Global delegation for opening certificate modal
    document.addEventListener("click", (e) => {
      const certBtn = e.target.closest("[data-open-cert], [data-preview-cert]");
      if (certBtn) {
        e.preventDefault();
        e.stopPropagation();
        const cid = certBtn.dataset.openCert || certBtn.dataset.previewCert;
        openCertificateModal(cid);
      }
    });

    // Expose core navigation methods for routing & tests
    window.gotoLesson = gotoLesson;
    window.gotoView = gotoView;
    window.gotoQuiz = gotoQuiz;

    updateAuthUI();
    if (state.currentUser) {
      syncLocalAndCloud();
    }

    // Router listeners & initial route dispatch
    window.addEventListener("hashchange", handleHashRoute);
    window.addEventListener("popstate", handleHashRoute);

    if (window.location.hash && window.location.hash !== "#" && window.location.hash !== "#/") {
      handleHashRoute();
    } else {
      showView(state.view);
      renderAll();
      if (state.view === "lesson" && state.currentLesson) {
        setRouteHash("#/lesson/" + encodeURIComponent(state.currentLesson));
      } else if (state.view === "dashboard") {
        setRouteHash("#/dashboard?course=" + encodeURIComponent(state.activeCourseId));
      } else if (state.view === "curriculum") {
        setRouteHash("#/curriculum?course=" + encodeURIComponent(state.activeCourseId));
      } else if (state.view === "user-dashboard") {
        setRouteHash("#/user-dashboard");
      } else {
        setRouteHash("#/courses");
      }
    }
  }

  // Boot
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
