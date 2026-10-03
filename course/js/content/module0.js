/* MODULE 0 — Nền tảng Java & Công cụ */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 0,
  title: "Nền tảng Java & Công cụ",
  subtitle: "Java hiện đại + Maven + môi trường",
  icon: "☕",
  desc: "Làm chủ Java 8→21 và Maven — nền móng vững trước khi chạm vào Spring.",
  lessons: [
    {
      id: "0-1",
      type: "lesson",
      title: "Giới thiệu khóa học & Setup môi trường",
      minutes: 45,
      content: `
## Chào mừng đến với Spring Boot Mastery! 🎉

Trong khóa này, bạn sẽ đi từ **người biết Java cơ bản** đến **dev Spring Boot tự tin làm việc ở môi trường production**. Mỗi bài học đều gắn với tình huống thực tế mà bạn sẽ gặp trong các hệ thống như LAAS/OLS: multi-tenant, Keycloak, Kafka, Jenkins, AWS.

### Bạn cần chuẩn bị gì?

- Một chiếc máy tính ~8GB RAM (16GB lý tưởng)
- Kiến thức Java OOP cơ bản (class, interface, inheritance)
- ~8-10 giờ/tuần trong 6 tháng — hoặc nhanh hơn nếu bạn đã đi làm với Java

---

## 1. Cài đặt JDK 21

Spring Boot 3.x yêu cầu **tối thiểu Java 17**. Ta dùng JDK 21 (LTS) để có đủ tính năng hiện đại.

Tải **Eclipse Temurin 21** (bản open-source, miễn phí, được dùng rộng rãi production):

- Windows: <https://adoptium.net/temurin/releases/?version=21>
- Cài xong, kiểm tra terminal:

~~~bash
java -version
# openjdk version "21.0.x" ...

javac -version
# javac 21.0.x
~~~

:::warn QUAN TRỌNG — JAVA_HOME
Hãy set biến môi trường <code>JAVA_HOME</code> trỏ tới thư mục JDK (ví dụ <code>C:\\Program Files\\Eclipse Adoptium\\jdk-21</code>). Maven và IDE đều cần nó.
:::

## 2. Cài IntelliJ IDEA

- Tải **IntelliJ IDEA Community Edition** (miễn phí): <https://www.jetbrains.com/idea/download>
- Khi mở project lần đầu, IntelliJ sẽ tự download dependencies — chờ nó chạy xong ở thanh progress dưới góc phải.
- Plugin nên bật: **Lombok** (cài sẵn), **Maven Helper**, **EnvFile** (đọc .env).

## 3. Tạo project đầu tiên

Vào <https://start.spring.io> và cấu hình:

| Mục | Giá trị |
|---|---|
| Project | **Maven** |
| Language | **Java** |
| Spring Boot | **3.4.x** (baseline ví dụ của khóa; không phải tuyên bố bản mới nhất) |
| Group | <code>vn.mastery</code> |
| Artifact | <code>taskmanager</code> |
| Packaging | **Jar** |
| Java | **21** |
| Dependencies | Spring Web, Spring Boot DevTools, Spring Boot Actuator |

Bấm **Generate** → giải nén → mở bằng IntelliJ.

### Cấu trúc project chuẩn

~~~text
taskmanager/
├── src/
│   ├── main/
│   │   ├── java/vn/mastery/taskmanager/
│   │   │   └── TaskmanagerApplication.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── static/
│   │       └── templates/
│   └── test/java/vn/mastery/taskmanager/
├── mvnw, mvnw.cmd          ← Maven wrapper (không cần cài Maven!)
└── pom.xml                 ← "trái tim" của project
~~~

## 4. Viết API đầu tiên

~~~java
package vn.mastery.taskmanager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class TaskmanagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TaskmanagerApplication.class, args);
    }
}

@RestController
class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Xin chào Spring Boot!";
    }
}
~~~

Chạy bằng nút ▶ cạnh <code>main()</code> hoặc lệnh:

~~~bash
./mvnw spring-boot:run
~~~

Mở trình duyệt tại <code>http://localhost:8080/hello</code> — bạn vừa chạy web service Java đầu tiên! 🎊

## 5. Đổi properties → YAML

YAML gọn hơn và dễ phân tầng môi trường. Đổi tên <code>application.properties</code> thành <code>application.yml</code>:

~~~yaml
spring:
  application:
    name: taskmanager

server:
  port: 8080

management:
  endpoints:
    web:
      exposure:
        include: health
~~~

Truy cập <code>http://localhost:8080/actuator/health</code> → <code>{"status":"UP"}</code>.

:::laas ĐỐI CHIẾU LAAS
Khi bạn debug dịch vụ platform-service không start được trên AWS, **Actuator /actuator/health** chính là endpoint đầu tiên để kiểm tra "service sống chưa". Các hệ thống production luôn expose ít nhất health + info.
:::

## 6. Từ mã nguồn đến HTTP response — hiểu đường đi trước khi debug

~~~text
.java → javac → .class → JVM nạp bytecode
                         ↓
main() → SpringApplication.run()
       → tạo ApplicationContext
       → đăng ký bean + auto-configuration theo điều kiện
       → khởi động embedded servlet container

GET /hello → Tomcat → DispatcherServlet
           → tìm handler mapping → HelloController.hello()
           → HttpMessageConverter → HTTP response
~~~

JDK chứa công cụ biên dịch và runtime. JVM thực thi bytecode; Maven điều phối build, không thay thế JVM. Spring quản lý object và dependency; Tomcat nhận HTTP. Phân biệt các vai trò này giúp bạn biết lỗi thuộc tầng nào thay vì sửa annotation ngẫu nhiên.

Controller được tìm thấy vì nằm trong package của lớp application hoặc package con. Đặt controller ở package anh em nằm ngoài phạm vi scan có thể khiến ứng dụng khởi động bình thường nhưng endpoint trả 404. Auto-configuration không có nghĩa Spring tự tìm mọi class trên máy.

## 7. Lab Windows — kiểm tra ba nguồn cấu hình Java

Chạy trong thư mục chứa pom.xml bằng PowerShell:

~~~powershell
Get-Command java | Select-Object Source
java -version
javac -version
$env:JAVA_HOME
.\u005cmvnw.cmd -version
~~~

Đối chiếu Java major version trong kết quả Maven với java trên PATH. Sau đó kiểm tra Project SDK và Maven Runner JRE trong IDE. Ba nơi này có thể trỏ tới ba JDK khác nhau. Wrapper cố định Maven, không tự cài hay cố định JDK.

**Kết quả đạt:** terminal và Maven cùng dùng JDK 21; IDE build cùng language level. Nếu Maven báo release version 21 not supported, kiểm tra JVM Maven đang dùng trước khi hạ java.version trong POM.

## 8. Lab đóng gói — chạy không phụ thuộc IDE

~~~powershell
.\u005cmvnw.cmd clean verify
Get-ChildItem target -Filter *.jar
# Thay tên bên dưới bằng đúng artifact vừa được build
java -jar target/taskmanager-0.0.1-SNAPSHOT.jar --server.port=8081
~~~

Mở terminal thứ hai:

~~~powershell
curl.exe -i http://localhost:8081/hello
curl.exe -i http://localhost:8081/actuator/health
~~~

Kỳ vọng endpoint hello trả HTTP 200 và chuỗi đã viết; health trả HTTP 200 với status UP khi các health contributor đều khỏe. Tham số dòng lệnh server.port ghi đè giá trị trong file cấu hình. Nếu vẫn gọi cổng 8080, bạn đang kiểm tra sai process hoặc sai URL.

Mở jar bằng công cụ ZIP hoặc chạy jar tf: executable jar của Spring Boot thường có BOOT-INF/classes cho mã ứng dụng và BOOT-INF/lib cho dependency. Jar thông thường không tự chứa toàn bộ dependency. Vì vậy build thành công chưa chứng minh jar đã được repackage để chạy bằng java -jar.

## 9. Thực hành debug có kiểm chứng

1. Đặt breakpoint tại hello(), chạy chế độ Debug rồi gọi curl.exe.
2. Xác nhận breakpoint dừng đúng một lần cho mỗi request; kiểm tra call stack.
3. Đổi mapping thành /greeting, rebuild/restart và gọi cả hai URL.
4. URL cũ phải trả 404, URL mới phải trả 200. Nếu không, kiểm tra process đang giữ cổng.
5. Chạy hai instance cùng cổng để quan sát lỗi bind; dừng đúng process thử nghiệm, không kill mọi tiến trình Java.

| Triệu chứng | Giả thuyết cần kiểm tra | Bằng chứng cần lấy |
|---|---|---|
| Connection refused | App chưa nghe cổng hoặc đã thoát | Log startup, cổng và process |
| HTTP 404 | Sai URL hoặc controller ngoài component scan | Mapping, package, context path |
| HTTP 500 | Request đã tới app nhưng xử lý lỗi | Stack trace tại request tương ứng |
| Port already in use | Có listener khác | Get-NetTCPConnection -LocalPort 8080 |
| UnsupportedClassVersionError | Runtime cũ hơn bytecode | java -version và JDK build |
| YAML không parse | Thụt lề hoặc cú pháp sai | Dòng/cột trong exception cấu hình |

## 10. Bài tập cuối bài và tiêu chí hoàn thành

Tạo GET /api/course-info trả về một record có hai field course và javaVersion. Chưa cần DB. Tách controller thành file riêng trong package con của application.

**Nộp bằng chứng:** lệnh build, HTTP status/header/body của endpoint, ảnh breakpoint và ghi chú một lỗi bạn chủ động gây ra rồi sửa. Không đưa token hoặc biến môi trường bí mật vào ảnh.

**Gợi ý lời giải:** @RestController + @GetMapping trả object để Jackson serialize JSON; không tự nối chuỗi JSON. Test lại bằng jar, không chỉ bằng nút Run. Bài đạt khi API trả JSON hợp lệ, hoạt động ở cổng cấu hình và có thể tái lập từ một terminal mới.

:::warn HEALTH KHÔNG ĐỒNG NGHĨA SẴN SÀNG PHỤC VỤ MỌI NGHIỆP VỤ
Chỉ expose health cho bài nhập môn. beans/env có thể tiết lộ cấu trúc và cấu hình hệ thống; không công khai chúng. Health UP của ứng dụng chưa có DB không chứng minh transaction hay hệ thống downstream hoạt động. Readiness, authentication và kiểm soát management network được học ở module vận hành.
:::

:::takeaways
- JDK 21 (Temurin) + IntelliJ CE là bộ đôi miễn phí đủ dùng đến production
- Maven wrapper <code>mvnw</code> giúp mọi người chạy build mà không cần cài Maven thủ công
- <code>@SpringBootApplication</code> = auto-configuration + component scan + cấu hình
- Actuator cho health-check — công cụ sống còn khi vận hành
:::
`
    },
    {
      id: "0-2",
      type: "lesson",
      title: "Java hiện đại: Lambda, Stream, Optional",
      minutes: 40,
      content: `
## Vì sao phải thành thạo Java 8+?

Code Spring hiện đại **ngập tràn** lambda và stream: từ định nghĩa route trong Security, đến converter trong JPA, đến filter collection trong service. Nếu không nhuần nhuyễn, bạn sẽ đọc code Spring như "chữ tượng hình".

---

## 1. Lambda & Functional Interface

Functional interface = interface có **đúng 1 abstract method**. Lambda là cú pháp viết nhanh implementation của nó.

~~~java
// Cách truyền thống — anonymous class
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Chạy!");
    }
};

// Lambda — ngắn gọn hơn 5 lần
Runnable r2 = () -> System.out.println("Chạy!");

// Function<T, R>: nhận T, trả R
Function<String, Integer> length = s -> s.length();

// Predicate<T>: trả boolean
Predicate<Integer> isEven = n -> n % 2 == 0;

// Consumer<T>: nhận T, không trả gì
Consumer<String> printer = s -> System.out.println(s);

// Supplier<T>: không nhận, trả T
Supplier<List<String>> listFactory = () -> new ArrayList<>();
~~~

### 4 functional interface phải thuộc lòng

| Interface | Chữ ký | Dùng khi |
|---|---|---|
| <code>Function<T,R></code> | <code>T → R</code> | Biến đổi dữ liệu |
| <code>Predicate<T></code> | <code>T → boolean</code> | Lọc / điều kiện |
| <code>Consumer<T></code> | <code>T → void</code> | Thực thi tác dụng phụ |
| <code>Supplier<T></code> | <code>() → T</code> | Tạo / lazy-init object |

**Method reference** — lambda gọn hơn nữa:

~~~java
Consumer<String> p1 = s -> System.out.println(s);
Consumer<String> p2 = System.out::println;   // method reference

Function<Task, String> t1 = task -> task.getTitle();
Function<Task, String> t2 = Task::getTitle;  // tham chiếu method của instance
~~~

## 2. Stream API — xử lý collection declarative

~~~java
record Task(String title, String assignee, int priority, boolean done) {}

List<Task> tasks = List.of(
    new Task("Viết API", "An", 2, true),
    new Task("Fix bug", "Bình", 1, false),
    new Task("Deploy", "An", 3, false),
    new Task("Review", "Cường", 2, true)
);

// Lấy tên các task CHƯA xong của "An", sắp theo ưu tiên
List<String> result = tasks.stream()
    .filter(t -> !t.done() && t.assignee().equals("An"))
    .sorted(Comparator.comparingInt(Task::priority).reversed())
    .map(Task::title)
    .toList();

// ["Deploy"]
~~~

### Các operation hay gặp nhất

| Operation | Loại | Ví dụ |
|---|---|---|
| <code>filter</code> | Intermediate | <code>.filter(t -> t.priority() > 1)</code> |
| <code>map</code> | Intermediate | <code>.map(Task::title)</code> |
| <code>flatMap</code> | Intermediate | Gộp nhiều stream con thành 1 |
| <code>sorted</code> | Intermediate | <code>.sorted(comparator)</code> |
| <code>distinct</code> | Intermediate | Bỏ phần tử trùng |
| <code>limit / skip</code> | Intermediate | Phân trang thủ công |
| <code>collect</code> | Terminal | <code>.collect(Collectors.toMap(...))</code> |
| <code>forEach</code> | Terminal | Duyệt side-effect |
| <code>reduce</code> | Terminal | Gộp về 1 giá trị (sum, concat...) |
| <code>anyMatch / allMatch</code> | Terminal | Kiểm tra điều kiện |
| <code>findFirst</code> | Terminal | Lấy phần tử đầu (thường sau filter) |

:::tip GHI NHỚ
Stream là **lazy**: intermediate operation không chạy gì cho tới khi gặp terminal operation. Đây là lý do stream có thể tối ưu (ví dụ <code>findFirst</code> dừng sớm).
:::

### Collector thông dụng

~~~java
// Nhóm task theo assignee
Map<String, List<Task>> byAssignee = tasks.stream()
    .collect(Collectors.groupingBy(Task::assignee));

// Đếm theo nhóm
Map<String, Long> countBy = tasks.stream()
    .collect(Collectors.groupingBy(Task::assignee, Collectors.counting()));

// Join chuỗi
String titles = tasks.stream().map(Task::title)
    .collect(Collectors.joining(", "));
~~~

## 3. Optional — diệt NPE có kỷ luật

~~~java
Optional<Task> found = tasks.stream()
    .filter(t -> t.title().equals("Deploy"))
    .findFirst();

// ❌ Đừng bao giờ: found.get() — ném NoSuchElementException nếu rỗng

// ✅ Kiểu 1: orElse
Task t = found.orElse(new Task("Mặc định", "-", 0, false));

// ✅ Kiểu 2: ném exception có ý nghĩa
Task t2 = found.orElseThrow(
    () -> new TaskNotFoundException("Không tìm thấy task Deploy"));

// ✅ Kiểu 3: chỉ làm gì đó khi có giá trị
found.ifPresent(task -> notify(task.assignee()));

// ✅ Kiểu 4: chain biến đổi
String title = found.map(Task::title)
    .filter(s -> s.length() > 3)
    .orElse("N/A");
~~~

:::danger TỎI KIẾN
Đừng dùng Optional cho **field của class** hay **tham số method** — nó chỉ designed cho **kiểu trả về**. Đừng gọi <code>.get()</code> trần — luôn kèm orElse/orElseThrow/isPresent.
:::

## 4. CompletableFuture — bất đồng bộ

~~~java
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> callExternalApi())           // chạy trên thread pool
    .thenApply(resp -> resp.toUpperCase())          // biến đổi
    .exceptionally(ex -> "FALLBACK");               // xử lý lỗi

// Kết hợp 2 call song song
CompletableFuture<User> userF = CompletableFuture.supplyAsync(() -> getUser(1));
CompletableFuture<Orders> ordersF = CompletableFuture.supplyAsync(() -> getOrders(1));

userF.thenCombine(ordersF, (user, orders) ->
    new UserDto(user, orders)).join();
~~~

Trong Spring, ta sẽ dùng <code>@Async</code> (Module 6) để Spring quản lý thread pool giúp — nhưng bên dưới vẫn là những concept này.

## 5. Đọc pipeline theo từng phần tử, không theo từng vòng lặp

Intermediate operation tạo mô tả phép tính; terminal operation kích hoạt traversal. Với filter → map → findFirst, stream thường xử lý từng phần tử qua các bước cho đến khi tìm được kết quả, không nhất thiết filter toàn bộ collection rồi mới map.

~~~java
var numbers = List.of(1, 2, 3, 4);
var result = numbers.stream()
    .filter(n -> n % 2 == 0)
    .map(n -> n * 10)
    .findFirst();
System.out.println(result); // Optional[20]
~~~

Trace bằng tay: 1 bị loại; 2 qua filter và thành 20; findFirst kết thúc. sorted là operation có state: thường phải thu và sắp dữ liệu trước khi trả phần tử đầu. Vì vậy thêm limit phía sau sorted không biến việc sort toàn bộ thành miễn phí.

Đừng dùng peek để ghi audit hay sửa database: stream có thể tối ưu bỏ các bước không ảnh hưởng kết quả, và short-circuit không duyệt mọi phần tử. Stream chỉ được tiêu thụ một lần; muốn tính hai kết quả hãy tạo hai stream hoặc thiết kế collector phù hợp.

## 6. Lab thống kê giao dịch — duplicate key là quyết định nghiệp vụ

~~~java
record Entry(String member, long points) {}
var entries = List.of(
    new Entry("A", 100),
    new Entry("B", 40),
    new Entry("A", 25)
);
Map<String, Long> totals = entries.stream().collect(
    java.util.stream.Collectors.toMap(
        Entry::member,
        Entry::points,
        (left, right) -> Math.addExact(left, right)
    )
);
System.out.println(totals.get("A")); // 125
System.out.println(totals.get("B")); // 40
~~~

Nếu bỏ merge function, member A trùng key sẽ gây IllegalStateException. Chọn cộng, giữ bản đầu hay giữ bản cuối không phải mẹo cú pháp: đó là quy tắc nghiệp vụ. Math.addExact làm overflow hiện thành lỗi thay vì âm thầm đảo dấu. Thứ tự in Map không phải hợp đồng của ví dụ này.

**Bài tập:** thêm Entry với Long.MAX_VALUE cho A. Kỳ vọng ArithmeticException, không phải tổng âm. Với dữ liệu rỗng, kết quả phải là map rỗng. Nếu points có thể âm để biểu diễn hoàn giao dịch, không được tự ý filter bỏ số âm.

## 7. Optional: có giá trị không có nghĩa fallback không chạy

~~~java
static String fallback() {
    System.out.println("fallback called");
    return "guest";
}

var name = java.util.Optional.of("An");
System.out.println(name.orElse(fallback()));
// fallback called, rồi An
System.out.println(name.orElseGet(() -> fallback()));
// chỉ An
~~~

Java đánh giá argument trước khi gọi method: orElse nhận một giá trị đã tính xong. orElseGet nhận Supplier và chỉ gọi khi Optional rỗng. Dùng orElseGet khi fallback có truy vấn DB, tạo object đắt hoặc side effect. Optional.of(null) ném NPE; ofNullable(null) trả empty. map biến đổi T → U; flatMap dùng khi hàm đã trả Optional<U>, tránh Optional lồng nhau.

## 8. CompletableFuture — executor, timeout và lỗi phải được thiết kế

~~~java
try (var executor = java.util.concurrent.Executors.newFixedThreadPool(4)) {
    var first = java.util.concurrent.CompletableFuture
        .supplyAsync(() -> "member-A", executor);
    var second = java.util.concurrent.CompletableFuture
        .supplyAsync(() -> 120L, executor);
    var summary = first.thenCombine(second,
        (member, points) -> member + ":" + points);
    System.out.println(summary.join()); // member-A:120
}
~~~

Đây là ví dụ độc lập chạy được trên Java 21; trong Spring, executor nên được quản lý như bean, không tạo pool mỗi request. supplyAsync không truyền executor thường dùng common pool. I/O blocking kéo dài có thể chiếm tài nguyên dùng chung. newFixedThreadPool giới hạn thread nhưng hàng đợi mặc định không bị chặn kích thước: ví dụ nhỏ này chưa phải admission control production.

thenApply biến đổi kết quả; thenCompose nối tác vụ trả Future khác; thenCombine kết hợp hai kết quả độc lập. join chờ và bọc lỗi trong CompletionException. exceptionally trả fallback có thể che sự cố: số dư không đọc được không nên tự biến thành 0 rồi dùng cho quyết định tài chính.

orTimeout làm future hoàn tất ngoại lệ khi quá hạn nhưng không đảm bảo dừng network call bên dưới. Cần timeout của HTTP client và giới hạn concurrency riêng. ThreadLocal như tenant, MDC hoặc security context không tự được truyền qua executor tùy ý.

## 9. Bài lab tổng hợp và đáp án định hướng

Viết hàm summarize(List<Entry>) trả tổng điểm theo member, không thay đổi input. Viết ít nhất các test: list rỗng; member lặp; tổng âm hợp lệ; overflow; cùng input cho cùng kết quả.

Tiếp theo viết lookupName trả Optional<String> và một fallback đếm số lần gọi. Test orElse gọi fallback ngay cả khi có name, còn orElseGet không gọi. Cuối cùng tạo một future thất bại có chủ đích và kiểm tra nguyên nhân bên trong CompletionException.

**Tiêu chí đạt:** giải thích được từng output trước khi chạy; không dùng shared mutable ArrayList trong parallelStream; không gọi DB cho từng phần tử rồi gọi đó là tối ưu; phân biệt xử lý collection trong RAM với filter/pagination phải đẩy xuống DB.

:::takeaways
- 4 functional interface: Function, Predicate, Consumer, Supplier — nền của mọi API hiện đại
- Stream = pipeline lazy: intermediate (filter/map) + terminal (collect/forEach)
- Optional chỉ cho return type; luôn orElse/orElseThrow
- CompletableFuture cho song song hóa I/O call
:::
`
    },
    {
      id: "0-3",
      type: "lesson",
      title: "Java 17/21: record, sealed, pattern matching",
      minutes: 35,
      content: `
## Java hiện đại = code ngắn hơn, an toàn hơn

Kể từ Spring Boot 3, tối thiểu đã là Java 17 — và các codebase mới (như LAAS) tận dụng mạnh các tính năng dưới đây. Đây là "ngôn ngữ mới" bạn cần nói thành thạo.

---

## 1. record — immutable data class trong 1 dòng

~~~java
// Trước: 40 dòng (fields, constructor, getter, equals, hashCode, toString)
public class Point {
    private final int x;
    private final int y;
    // constructor, getters, equals, hashCode, toString...
}

// Sau: 1 dòng
public record Point(int x, int y) {}

// Dùng
var p = new Point(3, 4);
p.x();          // accessor (không phải getX())
p.equals(new Point(3, 4));  // true — tự sinh
~~~

record tự động có constructor chuẩn tắc, accessor, equals/hashCode/toString. Các component là final, nhưng tính bất biến chỉ là **bất biến nông**: object mutable bên trong vẫn có thể thay đổi nếu không defensive copy.

### Record trong Spring — cực kỳ phổ biến

~~~java
// DTO cho REST API (Spring Boot 3 hỗ trợ record làm @RequestBody)
public record CreateTaskRequest(
    @NotBlank String title,
    @Future LocalDate dueDate,
    @Min(1) @Max(5) int priority
) {}

// Config binding
public record AppProperties(
    String apiUrl,
    int maxRetries
) {}

// Compact constructor — validate ngay khi tạo
public record Money(BigDecimal amount, String currency) {
    public Money {
        if (amount.signum() < 0)
            throw new IllegalArgumentException("amount >= 0");
        if (currency == null || currency.isBlank())
            throw new IllegalArgumentException("currency bắt buộc");
    }
}
~~~

## 2. sealed — kiểm soát ai được kế thừa

~~~java
// Chỉ PaymentResult hoặc con của nó mới được implement
public sealed interface PaymentResult
    permits Success, Pending, Failed {}

public record Success(String txnId) implements PaymentResult {}
public record Pending(String txnId, Instant checkAt) implements PaymentResult {}
public record Failed(String reason) implements PaymentResult {}
~~~

Lợi ích: compiler biết **tập hợp con bị đóng kín** → pattern matching switch có thể kiểm tra exhaustiveness (thiếu case nào là báo lỗi compile).

## 3. Pattern matching cho switch (Java 21)

~~~java
String describe(PaymentResult result) {
    return switch (result) {
        case Success s when s.txnId().startsWith("TX") -> // guard clause
            "Thành công, txn nội bộ: " + s.txnId();
        case Success s -> "Thành công";
        case Pending p -> "Đang chờ, kiểm tra lại lúc " + p.checkAt();
        case Failed f -> "Thất bại: " + f.reason();
        // KHÔNG cần default — compiler biết đã đủ case (nhờ sealed)!
    };
}

// Pattern matching cho instanceof (Java 16+)
if (obj instanceof String s && s.length() > 5) {
    System.out.println(s.toUpperCase());  // s đã cast sẵn
}

// Record pattern (Java 21) — bóc tách field ngay trong pattern
if (obj instanceof Money(BigDecimal amt, String cur)) {
    System.out.println("Số tiền: " + amt + " " + cur);
}
~~~

## 4. var, text blocks, các tiện ích khác

~~~java
// var — kiểu cục bộ tự suy luận (chỉ biến local)
var tasks = new ArrayList<Task>();       // ArrayList<Task>
var map = new HashMap<String, List<Order>>();

// Text block — chuỗi nhiều dòng (SQL, JSON)
String sql = """
    SELECT t.id, t.title, u.name
    FROM tasks t
    JOIN users u ON u.id = t.assignee_id
    WHERE t.done = false
    ORDER BY t.priority DESC
    """;

// Switch expression (Java 14+)
int numDays = switch (month) {
    case JAN, MAR, MAY, JUL, AUG, OCT, DEC -> 31;
    case APR, JUN, SEP, NOV -> 30;
    case FEB -> isLeapYear ? 29 : 28;
    default -> throw new IllegalArgumentException();
};
~~~

:::warn var — dùng đúng chỗ
Chỉ dùng <code>var</code> khi kiểu **rõ ràng ngay lập tức** (<code>var list = new ArrayList&lt;String&gt;()</code>) hoặc tên biến mô tả đủ (<code>var userService = ...</code>). Đừng dùng khi phải đoán: <code>var result = process(x);</code> ❌
:::

## 5. Bảng tra nhanh theo version

| Version | Tính năng chính |
|---|---|
| Java 8 | Lambda, Stream, Optional, CompletableFuture |
| Java 11 | <code>var</code> (10), HTTP Client, String methods |
| Java 17 | record (16), sealed, instanceof pattern, switch expression |
| Java 21 | **virtual threads**, record pattern, switch pattern matching |
| Java 25 (LTS) | Refined generics, structured concurrency (preview) |

:::info VIRTUAL THREADS (Java 21)
Spring Boot 3.2+ bật virtual threads chỉ bằng 1 dòng: <code>spring.threads.virtual.enabled=true</code>. Thread "rẻ như cơm bữa" → tối ưu throughput cho I/O-heavy service mà không đổi code. Ta sẽ thực hành ở Module 7.
:::

:::laas ĐỐI CHIẾU LAAS
Mở bất kỳ service LAAS nào và tìm <code>record</code> trong package dto/request — codebase production hiện đại đã dùng record làm DTO chuẩn. Biết đọc nó = đọc được nửa codebase.
:::

## 6. Record chỉ bất biến nông — thử phá invariant trước khi tin nó

~~~java
record UnsafeBatch(java.util.List<String> members) {}
var source = new java.util.ArrayList<String>();
source.add("A");
var batch = new UnsafeBatch(source);
source.add("B");
System.out.println(batch.members()); // [A, B]
~~~

Field members là final: không gán lại reference được, nhưng object được tham chiếu vẫn có thể mutable. Nếu DTO đại diện snapshot, phải bảo vệ cả đường vào lẫn đường ra.

~~~java
record Batch(java.util.List<String> members) {
    Batch {
        members = java.util.List.copyOf(members);
    }
}
~~~

Compact constructor chuẩn hóa tham số trước khi compiler gán vào field. copyOf tạo snapshot không cho sửa cấu trúc list và từ chối list/null element. Nó không deep-copy phần tử: List<MutableMember> vẫn có thể chứa member bị sửa. Với String bất biến, ví dụ trên đủ để bảo vệ dữ liệu.

## 7. Equality là hợp đồng domain, không phải chỉ để test tiện

~~~java
record Amount(java.math.BigDecimal value) {}
var a = new Amount(new java.math.BigDecimal("1.0"));
var b = new Amount(new java.math.BigDecimal("1.00"));
System.out.println(a.equals(b)); // false
~~~

Record sinh equals dựa trên component; BigDecimal.equals xét cả scale, khác compareTo. Nếu domain coi 1.0 và 1.00 là cùng tiền, cần chọn quy tắc chuẩn hóa scale và rounding rõ ràng trong constructor hoặc một value object chuyên biệt. Không dùng double cho tiền rồi mong record sửa sai số.

Record chứa array cũng không tự có deep equality theo phần tử. Record toString có thể đưa mọi component ra log; không đặt password/token vào DTO rồi log toàn bộ object. Tự sinh boilerplate không thay thế thiết kế bảo mật.

## 8. Sealed + exhaustive switch — làm thay đổi domain thành lỗi compile

Tạo file PaymentDemo.java với toàn bộ ví dụ sau:

~~~java
public class PaymentDemo {
    sealed interface Result permits Approved, Rejected {}
    record Approved(String transactionId) implements Result {}
    record Rejected(String reason) implements Result {}

    static String describe(Result result) {
        return switch (result) {
            case Approved a -> "OK:" + a.transactionId();
            case Rejected r -> "FAIL:" + r.reason();
        };
    }

    public static void main(String[] args) {
        System.out.println(describe(new Approved("TX-1")));
        System.out.println(describe(new Rejected("LIMIT")));
    }
}
~~~

Chạy java PaymentDemo.java bằng JDK 21. Output phải là OK:TX-1 và FAIL:LIMIT. Sau đó thêm record Pending implements Result và thêm Pending vào permits nhưng chưa sửa switch: compile phải thất bại vì thiếu case. Đây là lợi ích kiểm tra tĩnh thực sự, không phải giảm vài dòng code.

Thử describe(null): khi không có case null, switch ném NPE. Exhaustive theo các subtype không có nghĩa xử lý null. Có thể từ chối null ở biên API hoặc thêm case null khi domain cho phép; đừng thêm default chỉ để làm compiler im lặng.

## 9. Chọn record hay class trong ứng dụng Spring

| Nhu cầu | Lựa chọn và lý do |
|---|---|
| Request/response DTO | Record phù hợp khi payload không cần setter |
| Configuration binding | Record phù hợp với constructor binding, cần đăng ký properties đúng cách |
| JPA entity | Class thông thường đáp ứng yêu cầu entity; record không phù hợp làm entity JPA |
| Kết quả query projection | Record có thể phù hợp, không đồng nghĩa nó là entity |
| Domain object mutable có lifecycle | Class với method bảo vệ invariant |
| Event payload | Record tiện, nhưng schema compatibility vẫn phải quản lý |

Bean Validation chỉ chạy khi tích hợp validation được kích hoạt ở biên tương ứng. Đặt @NotBlank lên record không tự làm mọi lời gọi new Record(...) đều được kiểm tra. Constructor tự kiểm tra invariant nếu muốn bảo vệ mọi đường tạo object; validation annotation phục vụ thêm cơ chế validation của framework.

## 10. Bài tập và kiểm chứng

Thiết kế OrderSnapshot có id và danh sách Item. Item gồm sku và quantity dương. Test sửa list đầu vào không đổi snapshot; sửa list từ accessor bị từ chối; quantity bằng 0 bị từ chối; hai snapshot cùng dữ liệu so sánh bằng nhau.

**Hướng giải:** Item là record kiểm tra quantity trong compact constructor; OrderSnapshot dùng List.copyOf và kiểm tra id. Vì Item cũng bất biến, snapshot không lộ object con mutable. Viết một phiên bản sai dùng ArrayList trực tiếp rồi chứng minh test thất bại trước khi sửa.

:::takeaways
- record cho data class bất biến nông — DTO, config, event message
- sealed + switch pattern = mô hình hóa domain khít như "enum mở rộng"
- var chỉ cho biến local, khi kiểu hiển nhiên
- Text block cho SQL/JSON — đừng cộng chuỗi nữa
:::
`
    },
    {
      id: "0-4",
      type: "lesson",
      title: "Maven thành thạo: lifecycle, scope, multi-module",
      minutes: 35,
     content: `
## Maven — người quản lý dự án của bạn

Bạn đã từng thêm dependency vào <code>pom.xml</code> (như nimbus-jose-jwt cho Identity Service). Bài này biến bạn từ "biết copy dependency" thành "hiểu Maven vận hành".

---

## 1. pom.xml giải phẫu

~~~xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <!-- Tọa độ duy nhất của artifact — giống "địa chỉ nhà" -->
    <groupId>vn.mastery</groupId>
        <!-- tổ chức / domain ngược -->
    <artifactId>taskmanager</artifactId>
        <!-- tên project -->
    <version>0.0.1-SNAPSHOT</version>
        <!-- SNAPSHOT = đang phát triển, 1.0.0 = release -->

    <properties>
        <java.version>21</java.version>
        <!-- Phiên bản dependencies tập trung ở đây -->
        <mapstruct.version>1.6.3</mapstruct.version>
    </properties>

    <parent>
        <!-- Spring Boot BOM — quản lý phiên bản ~300 thư viện phổ biến -->
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.4.1</version>
    </parent>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <!-- KHÔNG cần <version> — BOM parent đã lo! -->
        </dependency>
    </dependencies>
</project>
~~~

:::tip VÌ SAO KHÔNG GHI VERSION?
Parent Spring Boot kế thừa quản lý version cho tập thư viện được phối hợp theo release. Không ghi version giúp dùng baseline đó; override, dependency ngoài BOM hoặc runtime khác vẫn có thể gây xung đột. Luôn kiểm tra effective POM và chạy test.
:::

## 2. Dependency scope — ai biên dịch, ai chạy

| Scope | Compile | Test | Runtime | Đóng gói vào jar? |
|---|---|---|---|---|
| <code>compile</code> (mặc định) | ✅ | ✅ | ✅ | ✅ |
| <code>provided</code> | ✅ | ✅ | ❌ | ❌ (container lo) |
| <code>runtime</code> | ❌ | ✅ | ✅ | ✅ (VD: JDBC driver) |
| <code>test</code> | ❌ | ✅ | ❌ | ❌ |
| <code>optional=true</code> (không phải scope) | Theo scope | Theo scope | Theo scope | Theo plugin; chủ yếu kiểm soát truyền bắc cầu |

Ví dụ điển hình:

~~~xml
<!-- Chỉ cần khi chạy — driver DB -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Lombok: chỉ cần lúc compile -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
~~~

## 3. Lifecycle — các phase phải thuộc

~~~text
validate → compile → test → package → verify → install → deploy
~~~

| Lệnh | Phase đạt được | Kết quả |
|---|---|---|
| <code>mvn compile</code> | compile | .class trong target/classes |
| <code>mvn test</code> | test | Chạy unit test |
| <code>mvn package</code> | package | Tạo jar/war trong target/ |
| <code>mvn verify</code> | verify | Chạy integration test (Failsafe) |
| <code>mvn install</code> | install | Đưa jar vào ~/.m2 local |
| <code>mvn clean</code> | — | Xóa target/ (thuần túy dọn dẹp) |

:::warn LỖI KINH ĐIỂN NHẤT
"Code mới không được build / dependency lạ lỗi" → chạy <code>mvn clean package</code>. Nếu vẫn lỗi: xóa cache <code>rm -rf ~/.m2/repository</code> (rất hiếm khi cần).
:::

## 4. Xử lý conflict dependency — kỹ năng cứu deadline

Khi 2 thư viện kéo về cùng 1 artifact khác version → **Maven lấy bản gần gốc nhất (nearest wins)**. Chẩn đoán:

~~~bash
# Xem cây dependency đầy đủ
./mvnw dependency:tree

# Lọc artifact đang nghi ngờ
./mvnw dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind
~~~

Override bắt buộc khi cần pin version:

~~~xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>com.nimbusds</groupId>
            <artifactId>nimbus-jose-jwt</artifactId>
            <version>9.37.3</version>
        </dependency>
    </dependencies>
</dependencyManagement>
~~~

:::laas ĐỐI CHIẾU LAAS
Trong conversation trước, bạn đã thêm <code>nimbus-jose-jwt</code> vào <code>&lt;dependencyManagement&gt;</code> của Identity Service — chính là kỹ thuật pin version này. Giờ bạn hiểu vì sao: đặt ở dependencyManagement = **điều khiển version tập trung** mà không ép tất cả module phải dùng.
:::

## 5. Multi-module — kiến trúc LAAS style

~~~text
laas-parent/
├── pom.xml                  ← packaging: pom, khai báo <modules>
├── laas-common/             ← DTO, util dùng chung
├── laas-domain/             ← entity + repository
├── laas-identity/           ← service authentication (bạn đang làm!)
├── laas-platform/           ← service chính
└── laas-notification/
~~~

Parent:

~~~xml
<packaging>pom</packaging>
<modules>
    <module>laas-common</module>
    <module>laas-domain</module>
    <module>laas-identity</module>
</modules>
~~~

Con (laas-identity) phụ thuộc common:

~~~xml
<parent>
    <groupId>vn.laas</groupId>
    <artifactId>laas-parent</artifactId>
    <version>1.2.0</version>
</parent>

<dependencies>
    <dependency>
        <groupId>vn.laas</groupId>
        <artifactId>laas-common</artifactId>
        <version>\${project.version}</version>
    </dependency>
</dependencies>
~~~

## 6. Maven Wrapper & build production

~~~bash
./mvnw clean verify                    # CI chạy lệnh này
./mvnw spring-boot:run                 # chạy app local
./mvnw clean package -DskipTests       # build nhanh (đừng dùng trong CI!)
./mvnw versions:set -DnewVersion=1.2.0 # bump version
~~~

## 7. Bốn khái niệm Maven dễ bị trộn lẫn

| Khái niệm | Có tác dụng | Không tự làm |
|---|---|---|
| dependencies | Thêm dependency vào classpath theo scope | Không đảm bảo thư viện tương thích nghiệp vụ |
| dependencyManagement | Cung cấp version/scope mặc định và quản lý dependency bắc cầu | Không tự thêm dependency chưa được dùng |
| pluginManagement | Cung cấp cấu hình/version plugin cho nơi sử dụng | Không tự buộc mọi goal chạy |
| modules | Chỉ định các project tham gia reactor | Không tự tạo quan hệ kế thừa parent |

Một project có thể vừa là parent vừa aggregator, nhưng hai vai trò độc lập. Dependency giữa module quyết định thứ tự build reactor; thứ tự liệt kê không thay thế quan hệ dependency.

BOM import trong dependencyManagement quản lý dependency version. Kế thừa starter-parent còn nhận cấu hình plugin và build defaults. Nếu công ty bắt buộc parent riêng, import Boot BOM là lựa chọn hợp lý, nhưng phải tự kiểm tra compiler và boot plugin: BOM không tự cấu hình tất cả plugin.

## 8. Lab điều tra dependency — từ triệu chứng tới effective model

Chạy tại thư mục chứa pom.xml:

~~~powershell
.\u005cmvnw.cmd help:effective-pom -Doutput=effective-pom.xml
.\u005cmvnw.cmd dependency:tree "-Dincludes=com.fasterxml.jackson.core:*"
.\u005cmvnw.cmd dependency:tree -Dscope=runtime
~~~

Effective POM giúp trả lời version đến từ parent, profile hay khai báo local. Dependency tree giúp trả lời ai kéo thư viện vào. Runtime classpath thực tế còn có thể chịu ảnh hưởng của container hoặc jar được triển khai nhầm, vì vậy đừng kết luận mọi NoSuchMethodError đều do hai jar trùng đang tồn tại.

NoSuchMethodError nghĩa là code gọi một method không có ở class được nạp lúc runtime. Điều tra theo thứ tự: xác định class/method trong stack trace; xem version được resolve; kiểm tra BOOT-INF/lib trong jar đã deploy; đối chiếu artifact checksum và cấu hình runtime. Sau đó mới sửa version/exclusion.

Nearest-wins là quy tắc mediation mặc định khi không có quản lý version chi phối; nếu cùng độ sâu, khai báo xuất hiện trước thắng. Đừng rải exclusion ngẫu nhiên: loại dependency bắt buộc có thể biến lỗi method thành ClassNotFoundException.

## 9. Scope không phải chính sách đóng gói duy nhất

Jar Java thông thường chứa class/resources của project, không tự nhét dependency vào jar. Spring Boot repackage tạo executable jar chứa dependency theo quy tắc plugin. Vì vậy phải phân biệt classpath Maven và nội dung artifact cuối cùng.

optional=true không phải scope và không loại dependency khỏi runtime của project khai báo nó. Nó chủ yếu ngăn project tiêu thụ thư viện của bạn nhận dependency đó một cách bắc cầu. Ví dụ A dùng B optional: A vẫn dùng B, nhưng C phụ thuộc A không tự nhận B. Với Lombok, kiểm tra thêm annotation processor và cấu hình loại khỏi executable artifact nếu cần.

provided biểu thị môi trường dự kiến cung cấp dependency khi chạy; cách đóng gói còn phụ thuộc jar/war và plugin. Không suy luận mọi provided dependency chắc chắn biến mất khỏi mọi loại Boot artifact: kiểm tra artifact thực tế.

## 10. Surefire, Failsafe và vì sao verify chưa chắc chạy integration test

~~~text
Unit test:         test → Surefire → *Test (theo convention mặc định)
Integration test:  integration-test → Failsafe integration-test
                   verify → Failsafe verify, đánh giá kết quả
~~~

Maven chỉ chạy integration test khi plugin/execution đã được cấu hình phù hợp. Chỉ đặt tên file *IT hoặc chạy verify chưa đủ nếu Failsafe chưa được bind.

Thêm vào build/plugins của một dự án dùng parent quản lý version Failsafe:

~~~xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <executions>
        <execution>
            <goals>
                <goal>integration-test</goal>
                <goal>verify</goal>
            </goals>
        </execution>
    </executions>
</plugin>
~~~

Kiểm tra effective POM để xác nhận plugin có version cụ thể. Tạo SmokeIT với một assertion cố ý sai; clean verify phải thất bại và có failsafe-reports. Sửa assertion rồi chạy lại phải xanh. Đây là cách chứng minh CI thực sự chạy test, không chỉ cấu hình trông đúng.

-DskipTests thường bỏ chạy test nhưng vẫn compile test; -Dmaven.test.skip=true còn bỏ compile test với các plugin chuẩn hỗ trợ thuộc tính này. Không dùng các cờ đó để chứng minh chất lượng release.

## 11. Lab reactor và xử lý lỗi có phạm vi

~~~powershell
# Chạy từ aggregator; thay artifactId bằng module thật
.\u005cmvnw.cmd -pl :laas-identity -am verify
~~~

-pl chọn project cần build; -am đưa các dependency module cần thiết trong reactor vào build. Không dùng install như nghi thức cho mọi thay đổi: trong cùng reactor Maven có thể resolve module dependency mà không cần cài thủ công từng jar vào local repository.

| Lỗi | Điều tra trước | Cách sửa có phạm vi |
|---|---|---|
| Could not resolve artifact | Tọa độ, repository, proxy, quyền truy cập | Sửa settings/repository; không đưa credentials vào POM |
| release version not supported | Maven dùng JDK nào | Sửa JAVA_HOME/Maven Runner |
| Test xanh nhưng *IT chưa chạy | Log goal, effective POM, reports | Bind Failsafe và test bằng assertion thất bại |
| Local chạy, CI không tìm module | Reactor và version dependency | Dùng -am, đồng bộ version, kiểm tra module khai báo |
| Jar không executable | Manifest và Boot repackage execution | Sửa cấu hình plugin, build lại và chạy jar |

Không xóa toàn bộ .m2 làm bước đầu. Chỉ khi có bằng chứng artifact tải hỏng mới xử lý cache đúng artifact; lỗi proxy hoặc sai tọa độ không được chữa bằng tải lại toàn bộ.

## 12. Bài tập cuối bài — chứng minh build tái lập được

Tạo parent với hai module domain và app. App phụ thuộc domain. Chạy -pl :app -am verify tại parent; ghi lại thứ tự reactor. Thêm một unit test và một integration test, làm từng test thất bại để chứng minh pipeline chặn đúng.

**Bằng chứng nộp:** cây dependency đã lọc; đoạn effective POM chỉ ra nguồn version; Surefire/Failsafe reports; executable jar chạy được. Không nộp settings.xml chứa credentials hoặc toàn bộ local repository.

**Câu hỏi tự giải thích:** chỉ khai báo thư viện trong dependencyManagement thì code có import được không? Vì sao optional không đồng nghĩa provided? Tại sao build xanh không chứng minh integration test đã chạy? Nếu chưa trả lời được bằng output thực tế, chưa hoàn thành bài.

:::takeaways
- BOM quản lý version dependency, không tự thêm thư viện và không thay thế kiểm thử tương thích
- Scope: runtime (JDBC driver), optional (Lombok), test (JUnit)
- <code>dependency:tree</code> là đèn pin khi dính conflict jar
- Multi-module: parent packaging pom + các module con
:::
`
    },
    {
      id: "0-quiz",
      type: "quiz",
      title: "Quiz Module 0 — Nền tảng",
      minutes: 10,
      questions: [
        {
          level: "easy",
          scenario: "Team bạn bắt đầu dự án mới trên máy company vừa cài lại. Tech lead yêu cầu dùng Spring Boot 3.4.x. Bạn mở start.spring.io và thấy option Java 8/11/17/21/23.",
          q: "Chọn Java version nào cho project mới và vì sao?",
          options: [
            "Java 8 — vì codebase legacy LAAS cũ vẫn chạy Java 8, đồng bộ cho dễ chuyển người",
            "Java 11 — LTS, ổn định, được Spring Boot 3 hỗ trợ đầy đủ",
            "Java 17 — vừa đủ baseline tối thiểu của Spring Boot 3, không cần hơn",
            "Java 21 — LTS mới nhất, có virtual threads, Spring Boot 3.2+ hỗ trợ đầy đủ"
          ],
          answer: 3,
          explain: "Java 21 là LTS (support đến 2031), có virtual threads miễn phí cấu hình cho I/O-heavy service. Spring Boot 3.4 + Java 21 là combo chuẩn production 2025.",
          why: [
            "Sai — Spring Boot 3.x KHÔNG chạy được trên Java 8 (baseline 17). Codebase cũ thì ở lại Spring Boot 2.7, dự án mới thì không lý do gì xuống mức này.",
            "Sai — Java 11 cũng dưới baseline 17 của Spring Boot 3. Đây là bẫy 'LTS nào cũng được' — phải đọc yêu cầu version của framework.",
            "Sai về chiến lược — đúng là 17 chạy được, nhưng chọn 'vừa đủ tối thiểu' nghĩa là bỏ lỡ virtual threads (21) và phải upgrade giữa dự án sau này — tốn kém hơn nhiều.",
            "✓ Đúng — LTS mới nhất, virtual threads bật bằng 1 dòng config, mọi tính năng Spring Boot 3.4 chạy trọn vẹn. Đó là lý do các service LAAS mới đều target 21."
          ]
        },
        {
          level: "easy",
          scenario: "Bạn review code của bạn mới vào team, thấy anh ấy loop qua danh sách task rồi check null thủ công từng field.",
          q: "Đoạn code sau in ra gì?",
          code: "var list = List.of(1, 2, 3, 4, 5);\nvar result = list.stream()\n    .filter(n -> n % 2 == 0)\n    .map(n -> n * 10)\n    .toList();\nSystem.out.println(result);",
          options: ["[10, 20, 30, 40, 50]", "[2, 4]", "[20, 40]", "Compile error — không chain được map sau filter"],
          answer: 2,
          explain: "filter giữ số chẵn (2, 4) → map nhân 10 → [20, 40]. Pipeline lazy nhưng toList() là terminal nên toàn bộ chạy.",
          why: [
            "Sai — đây là lỗi đọc thiếu filter. Nếu chỉ map thì mới ra [10,20,...,50]. Phải đọc pipeline theo thứ tự: filter TRƯỚC, map SAU.",
            "Sai — quên mất map đã nhân 10. Kết quả middle-step là [2,4] nhưng map biến đổi giá trị trước khi collect.",
            "✓ Đúng — filter(2,4) → map(n*10) → [20, 40]. Đây là pattern chuẩn khi transform data trước khi trả về DTO.",
            "Sai — Stream cho phép chain bao nhiêu intermediate operation tùy ý. Đây chính là sức mạnh declarative của nó."
          ]
        },
        {
          level: "medium",
          scenario: "Production LAAS 2 giờ sáng: 500 lỗi NoSuchElementException dồn về Sentry từ method getUserName(Long id). Log cho thấy user bị xóa mềm (soft-delete) nhưng record vẫn null khi query.",
          q: "Nguyên nhân gốc và cách sửa ĐÚNG nhất?",
          code: "// Code hiện tại đang gây sự cố\npublic String getUserName(Long id) {\n    return userRepository.findById(id).get().getFullName();\n}",
          options: [
            "Gốc rễ: DB mất kết nối → thêm retry + circuit breaker quanh findById",
            "Gốc rễ: .get() trên Optional rỗng ném NoSuchElementException → dùng orElseThrow với exception nghiệp vụ",
            "Gốc rễ: soft-delete filter chưa bật → thêm @Where(clause = \"deleted = false\")",
            "Gốc rễ: thiếu cache → user bị xóa vẫn nằm trong Redis, dùng @Cacheable"
          ],
          answer: 1,
          explain: "findById trả Optional rỗng khi không tìm thấy (kể cả soft-deleted nếu query không lọc) → .get() trần ném NoSuchElementException — crash 500 thay vì 404 sạch sẽ.",
          why: [
            "Không phải gốc rễ — nếu mất kết nối DB thì exception là DataAccessResourceFailureException, và lỗi sẽ không lặp đúng 1 chỗ thế này. Đây là cách đoán theo symptom.",
            "✓ Đúng — thay .get() bằng orElseThrow(() -> new UserNotFoundException(id)) để framework map sang 404 có thông điệp rõ ràng. Optional.get() trần là code smell cấp production.",
            "Có thể là tình huống thật nhưng không phải cái app crash — nếu filter soft-delete sai thì user vẫn được trả về (dữ liệu ảo), chứ không phải Optional rỗng.",
            "Sai hướng hoàn toàn — cache không liên quan việc Optional rỗng; ngược lại @Cacheable còn khiến dữ liệu xóa mềm cũ sống lâu hơn nữa."
          ]
        },
        {
          level: "medium",
          scenario: "Tech lead duyệt PR của bạn và hỏi: 'Em định dùng record cho class này — hợp không?'",
          q: "Trường hợp nào dùng record là ĐÚNG trong Spring Boot 3?",
          options: [
            "Làm @Entity JPA — vì record tự sinh equals/hashCode tiện so sánh",
            "Làm DTO request/response cho REST API (@RequestBody / @ResponseBody)",
            "Làm @Service business logic — code gọn hơn class thường",
            "Làm @ConfigurationProperties binding file yml"
          ],
          answer: 1,
          explain: "record immutable + tự sinh boilerplate → lý tưởng cho DTO. REST payload là dữ liệu một chiều, không cần thay đổi sau khi tạo.",
          why: [
            "Sai nghiêm trọng — JPA cần no-arg constructor + setter (hoặc field access) để proxy và dirty-checking. Record không có → Hibernate throw exception hoặc hành vi lạ. Entity PHẢI là class thường.",
            "✓ Đúng — Jackson 2.15+ và Spring Boot 3 bind record làm @RequestBody hoàn hảo, kể cả kèm Bean Validation (@NotBlank, @Past...). Codebase LAAS mới đã dùng record DTO chuẩn.",
            "Sai — @Service là component có hành vi + dependency injection; record là pure data. Compiler không cấm nhưng đánh mất toàn bộ mục đích thiết kế.",
            "Bẫy tinh vi — @ConfigurationProperties DÙNG được record (constructor binding từ Boot 2.6+) nhưng đây là Use case thứ yếu. Đáp án tốt nhất cho câu 'chuẩn nhất' vẫn là DTO."
          ]
        },
        {
          level: "hard",
          scenario: "Sáng thứ 2, service LAAS fail khởi động với: java.lang.NoSuchMethodError: com.fasterxml.jackson.databind.ObjectMapper.readerFor(Ljava/lang/Class;). Bạn vừa thêm dependency Kafka client mới.",
          q: "Chẩn đoán và xử lý theo đúng trình tự?",
          options: [
            "Restart Jenkins clean workspace rồi build lại — cache Jenkins bị bẩn",
            "Chạy ./mvnw dependency:tree -Dincludes=com.fasterxml.jackson.core:jackson-databind → xác định 2 version → pin version bằng <dependencyManagement>",
            "Xóa ~/.m2/repository toàn bộ rồi re-download",
            "Downgrade Kafka client về bản cũ hơn cho khớp Jackson"
          ],
          answer: 1,
          explain: "NoSuchMethodError = classpath có 2 version cùng artifact, runtime nạp bản cũ thiếu method. dependency:tree chỉ ra xung đột → dependencyManagement ép một version duy nhất cho toàn cây.",
          why: [
            "Không giải quyết gì — cache build sạch hay bẩn, cây dependency vẫn xung đột như cũ khi compile xong. Lỗi sẽ quay lại ở build sau.",
            "✓ Đúng quy trình chuẩn: (1) dependency:tree lọc đúng artifact nghi ngờ, (2) nhìn version nào thắng theo quy tắc nearest-wins, (3) dependencyManagement pin version tương thích mà Spring Boot BOM khuyên dùng.",
            "Quá mức — xóa cả local repo tải lại cả GB, và kết quả vẫn y hệt vì cây dependency logic không đổi. Chỉ là cách 'đập nhà làm lại' thay vì đọc bản đồ.",
            "Giải pháp ngược đời — downgrade thư viện mới để né xung đột nghĩa là đánh mất tính năng/cảnh báo security của bản mới. Nguyên tắc: pin version MỚI tương thích, không hạ cấp."
          ]
        },
        {
          level: "medium",
          scenario: "Đêm release LAAS, bạn deploy notification-service. Jenkins build thành công nhưng container exit ngay lập tức với log: 'Cannot find JAVA_HOME'. Máy local vẫn chạy OK.",
          q: "Root cause và fix bền vững nhất?",
          options: [
            "Thêm export JAVA_HOME=/usr/lib/jvm/... vào Dockerfile trước lệnh CMD",
            "Dùng base image chính thức có sẵn JDK: FROM eclipse-temurin:21-jre-alpine",
            "Mount biến môi trường từ host vào container qua -e JAVA_HOME",
            "Cài JDK thủ công bằng RUN apt-get install trong Dockerfile"
          ],
          answer: 1,
          explain: "Container không kế thừa môi trường host — image base phải tự chứa JRE. eclipse-temurin:21-jre là chuẩn công nghiệp: có sẵn JDK, slim, bảo mật update đều.",
          why: [
            "Hack cứng đường dẫn — chết khi đổi base image hoặc architecture (ARM vs x86). Fix kiểu 'dán băng keo' sẽ nổ vào lần refactor sau.",
            "✓ Đúng chuẩn production — base image chính thức đã set JAVA_HOME đúng, tối ưu size (jre thay vì jdk đầy đủ), và được bảo trì security patch bởi Adoptium.",
            "Sai kiến trúc cơ bản — container KHÔNG thấy được env host trừ khi pass -e, và -e lại phụ thuộc người chạy lệnh. Image phải self-contained để chạy được ở mọi orchestrator.",
            "Chạy được nhưng tệ — apt-get cài OpenJDK phình to image (~300MB thêm), không control được minor version, và các layer update phải rebuild thủ công."
          ]
        },
        {
          level: "medium",
          scenario: "Code review, mentor chỉ vào interface PaymentResult với 3 implementation (Success/Pending/Failed) và hỏi: 'Nếu thêm trạng thái Chargeback mà quên update switch, em muốn compiler bắt hay runtime bắt?'",
          q: "Cấu trúc nào cho compiler tự phát hiện thiếu case?",
          code: "// Cấu trúc đang xét\n??? interface PaymentResult\n    permits Success, Pending, Failed {}\n\nString classify(PaymentResult r) {\n    return switch (r) {\n        case Success s -> \"OK\";\n        case Pending p -> \"WAIT\";\n        case Failed f -> \"FAIL\";\n    }; // có cần default không?\n}",
          options: [
            "interface thường — rồi thêm default throw mới chắc chắn",
            "sealed interface — switch pattern matching không cần default, thiếu case là compile error",
            "abstract class + visitor pattern — visitor ép implement mỗi khi thêm subclass",
            "enum PaymentStatus — vì enum tự exhaustiveness trong switch"
          ],
          answer: 1,
          explain: "sealed + permits khóa tập implementation → compiler biết tập đóng → kiểm tra exhaustiveness. Thêm Chargeback mà không thêm case = lỗi build ngay tại CI, không chờ đến runtime.",
          why: [
            "Đi ngược tiến hóa — default throw đúng là cách runtime bắt lỗi nhưng chính là cái ta đang tránh. Người ta thêm default để 'im compiler' rồi quên update.",
            "✓ Đúng — sealed interface (Java 17) + switch pattern (Java 21) là cặp đôi hoàn hảo cho domain model đóng. LAAS có loại use case này ở payment/loyalty state machine.",
            "Hợp lý về lý thuyết nhưng nặng đô — visitor đòi ~4 interface + factory cho mỗi trạng thái. sealed đạt cùng guarantee bằng 2 từ khóa.",
            "Sai hướng — enum không chứa được data per-case (Success có txnId, Pending có checkAt...). Enum chỉ phù hợp khi mỗi case là hằng số thuần."
          ]
        },
        {
          level: "easy",
          scenario: "Bạn viết pom.xml lần đầu cho module mới, thắc mắc sao các dependency Spring đều không có tag <version>.",
          q: "Vì sao starter Spring Boot không cần khai báo version?",
          options: [
            "Maven tự download version mới nhất từ Maven Central",
            "spring-boot-starter-parent chứa dependencyManagement quản lý version ~300 thư viện tương thích đã test",
            "IDE tự động điền version khi save file",
            "Các thư viện Spring đặc biệt được Maven đối xử riêng"
          ],
          answer: 1,
          explain: "Parent POM của Spring Boot là 'bảng chỉ đạo version' — dependencyManagement khai báo version đã được test tương thích cho cả hệ sinh thái (Jackson, Hibernate, Logback...).",
          why: [
            "Nguy hiểm nếu đúng — version mới nhất có thể vỡ tương thích. Chính triết lý Spring Boot là NGĂN hành vi này: version phải deterministic.",
            "✓ Đúng — cứ nhìn pom của spring-boot-starter-parent: có <dependencyManagement> khổng lồ. Bạn ghi artifact không version → Maven tra bảng này. Muốn override thì tự khai ở dependencyManagement của mình.",
            "Hoàn toàn sai — Maven không quan tâm IDE. Build trên server Jenkins không có IDE vẫn chạy đúng.",
            "Không có cơ chế 'đối xử riêng' — mọi artifact Maven đều cùng luật. Khác biệt nằm ở POM kế thừa, không phải magic."
          ]
        },
        {
          level: "medium",
          scenario: "Audit bảo mật nội bộ yêu cầu giảm attack surface: image production không được chứa JDK đầy đủ (javac, tooling), chỉ cần chạy bytecode.",
          q: "Dependency scope + base image nào thỏa yêu cầu?",
          options: [
            "scope compile + image eclipse-temurin:21-jdk",
            "scope provided cho postgresql + image jdk",
            "postgresql scope runtime + base image eclipse-temurin:21-jre",
            "scope test cho postgresql + image jre"
          ],
          answer: 2,
          explain: "runtime scope: driver JDBC không cần lúc compile (code chỉ đụng JPA interface) nhưng phải có lúc chạy. JRE image: chỉ đủ chạy bytecode, không có compiler → nhẹ hơn ~40% và ít CVE hơn.",
          why: [
            "Đủ chạy nhưng phí — JDK đầy đủ trong production chứa tooling không bao giờ dùng: javac, jdb, jstack dev-only. Image phình + attack surface rộng vô ích.",
            "provided nghĩa là 'container lo' — hợp cho WAR deploy vào Tomcat ngoài, nhưng với Spring Boot fat-jar tự chạy thì driver sẽ BIẾN MẤT khỏi classpath khi start → NoClassDefFoundError.",
            "✓ Đúng cả hai đầu — scope runtime cho JDBC driver (chuẩn Spring Initializr tự generate) và jre-alpine/jre cho image tối giản production.",
            "test scope loại driver khỏi production runtime — service sẽ không kết nối được DB khi deploy. Chỉ dùng nếu thay bằng H2 in-memory cho test."
          ]
        },
        {
          level: "hard",
          scenario: "LAAS đang gánh 200 concurrent requests/insert order mỗi giây trên platform-service (Java 17, platform threads). CPU chỉ 30% nhưng latency P99 chạm 2s vì thread pool 200 đầy, request xếp hàng chờ.",
          q: "Giải pháp nào đúng bản chất vấn đề?",
          options: [
            "Tăng server.tomcat.threads.max lên 1000 — càng nhiều thread càng tốt",
            "Scale ngang thêm 2 pod — chia tải 3 phần",
            "Bật spring.threads.virtual.enabled=true (nâng Java 21) — virtual thread không block platform thread khi chờ I/O",
            "Thêm Redis cache toàn bộ order path — giảm DB hit"
          ],
          answer: 2,
          explain: "CPU rảnh + thread đầy = I/O-bound. Platform thread chờ DB/network thì cũng nằm chiếm chỗ. Virtual thread: khi chờ I/O nó 'trả' carrier thread về pool → 1 máy chạy hàng chục nghìn concurrent I/O operations.",
          why: [
            "Chữa đúng symptom sai bệnh — 1000 platform thread = 1GB stack mặc định, context-switch mở rộng, và nếu query DB chờ 2s thì 1000 thread cũng đầy như thường. Đáy bể chỉ dịch chứ không biến mất.",
            "Giảm tải thật nhưng không sửa thiết kế — mỗi pod vẫn dính ceiling 200. Tốn tiền infra cho vấn đề giải được bằng 1 dòng config.",
            "✓ Đúng căn nguyên — đây chính là use case lý tưởng của virtual threads (JDK 21): workload I/O-heavy, CPU idle. Loom project sinh ra cho kịch bản LAAS này.",
            "Cache không giúp insert path (write-heavy). Có thể giảm vài read phụ, nhưng bottleneck chính là thread chờ I/O vẫn nguyên vẹn."
          ]
        }
      ]
    }
  ]
});
