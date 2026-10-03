/* MODULE 4 — Testing */
window.COURSE_MODULES = window.COURSE_MODULES || [];
window.COURSE_MODULES.push({
  id: 4,
  title: "Testing",
  subtitle: "JUnit 5, Mockito, Testcontainers",
  icon: "🧪",
  desc: "Test pyramid bài bản: unit → slice → integration với DB thật qua Testcontainers.",
  lessons: [
    {
      id: "4-1",
      type: "lesson",
      title: "JUnit 5 & Mockito — Unit Test",
      minutes: 45,
      content: `
## JUnit 5 Jupiter Architecture & Mockito 5 Internals — Chiến lược Unit Test Chuẩn Doanh nghiệp

Trong mô hình phát triển phần mềm hiện đại (Agile/DevOps), Unit Test không chỉ là tấm lưới bảo vệ chống hồi quy (Regression Bug) mà còn là tài liệu kỹ thuật sống động nhất của hệ thống. Một bộ Unit Test được thiết kế tồi — chạy chậm, phụ thuộc vào thứ tự thực thi, hoặc lạm dụng Mocking một cách mù quáng — sẽ biến thành gánh nặng bảo trì (Maintenance Nightmare), khiến đội ngũ kỹ sư sợ hãi mỗi khi cần tái cấu trúc mã nguồn (Refactoring).

Bài học này sẽ đi sâu vào cấu trúc bên trong của **JUnit 5 (Jupiter Engine)**, cơ chế Bytecode Instrumentation của **Mockito 5**, và cách xây dựng một bộ kiểm thử đơn vị đạt chuẩn Enterprise với thư viện kiểm chứng **AssertJ**.

---

## 1. Bản chất Kỹ thuật & Vòng đời Kiểm thử JUnit 5 (Under the Hood)

### Kiến trúc Phân tầng của JUnit 5

Khác với kiến trúc nguyên khối của JUnit 4, JUnit 5 được tái cấu trúc hoàn toàn thành 3 phân vùng độc lập:

~~~text
+-----------------------------------------------------------------------------------+
|                              JUNIT 5 ARCHITECTURE                                 |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                              JUNIT PLATFORM                                 |  |
|  |  * Nền tảng điều phối chạy test trên JVM (Launcher API, Discovery, IDE/CLI) |  |
|  +-----------------------------------------------------------------------------+  |
|                       /                                                          |
|                      v                                  v                         |
|  +---------------------------------------+  +----------------------------------+  |
|  |            JUNIT JUPITER              |  |          JUNIT VINTAGE           |  |
|  |  * Programming Model & Engine mới     |  |  * TestEngine hỗ trợ chạy các    |  |
|  |  * @Test, Extensions, Assertions      |  |    test case cũ viết bằng JUnit 3|  |
|  |  * Jupiter Engine Provider            |  |    và JUnit 4                    |  |
|  +---------------------------------------+  +----------------------------------+  |
|                      |                                                            |
|                      v                                                            |
|  +-----------------------------------------------------------------------------+  |
|  |                  MOCKITO 5 (INLINE MOCK MAKER / BYTEBUDDY)                  |  |
|  |  * Instrument Bytecode động tại Runtime                                     |  |
|  |  * Cho phép mock Final Classes, Enums, Records và Static Methods             |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
~~~

### Vòng đời của một Test Class (Per-Method vs Per-Class)

Mặc định, JUnit 5 áp dụng chế độ vòng đời <code>TestInstance.Lifecycle.PER_METHOD</code>:
1. Với mỗi phương thức kiểm thử được đánh dấu <code>@Test</code>, JUnit 5 tạo ra một **Instance mới hoàn toàn** của lớp kiểm thử.
2. Mục đích: Đảm bảo tính độc lập tuyệt đối (Isolation). Trạng thái của các biến thành viên (Instance Variables) bị thay đổi ở Test A sẽ không bao giờ làm ô nhiễm (Pollute) hoặc ảnh hưởng đến Test B.

~~~text
+-----------------------------------------------------------------------------------+
|                     VÒNG ĐỜI THỰC THI JUNIT 5 (PER_METHOD)                        |
|                                                                                   |
|  1. @BeforeAll (Static Context - Chạy đúng 1 lần cho cả Class)                   |
|     |                                                                             |
|     +---> Khởi tạo TestClass Instance 1                                           |
|     |     |                                                                       |
|     |     +-> @BeforeEach (Chạy trước Test 1)                                     |
|     |     +-> @Test method 1: testCalculateInterest()                             |
|     |     +-> @AfterEach (Chạy sau Test 1)                                        |
|     |     v                                                                       |
|     |     Hủy TestClass Instance 1 (Đưa vào Garbage Collector)                   |
|     |                                                                             |
|     +---> Khởi tạo TestClass Instance 2                                           |
|     |     |                                                                       |
|     |     +-> @BeforeEach (Chạy trước Test 2)                                     |
|     |     +-> @Test method 2: testRejectOverdraft()                               |
|     |     +-> @AfterEach (Chạy sau Test 2)                                        |
|     |     v                                                                       |
|     |     Hủy TestClass Instance 2                                                |
|     |                                                                             |
|  2. @AfterAll (Static Context - Dọn dẹp tài nguyên sau khi tất cả test chạy xong) |
+-----------------------------------------------------------------------------------+
~~~

:::tip KHI NÀO DÙNG @TestInstance(Lifecycle.PER_CLASS)?
Khi việc khởi tạo tài nguyên quá tốn kém (ví dụ: cần nạp một file cấu hình dung lượng 500MB hoặc dựng kết nối gRPC giả lập), bạn có thể khai báo <code>@TestInstance(Lifecycle.PER_CLASS)</code>. Lúc này, JUnit chỉ tạo 1 instance duy nhất cho toàn bộ class, và phương thức <code>@BeforeAll</code> không cần phải khai báo <code>static</code>. Tuy nhiên, lập trình viên phải tự chịu trách nhiệm dọn sạch trạng thái trong <code>@AfterEach</code> để tránh Flaky Tests.
:::

---

## 2. Mockito 5 Internals: ByteBuddy & Inline Mock Maker

Trong các phiên bản cũ (Mockito 1.x / 2.x), Mockito sử dụng CGLIB hoặc Subclass Mock Maker để sinh lớp con dẫn xuất (Subclass) của đối tượng cần mock. Cách tiếp cận này có giới hạn chí mạng: **Không thể mock các class được khai báo <code>final</code>, các phương thức <code>final</code>, hoặc Java 14+ <code>record</code>**.

Từ Mockito 5.x (mặc định trong Spring Boot 3.x), Mockito chuyển sang sử dụng **Inline Mock Maker** kết hợp với thư viện can thiệp Bytecode **ByteBuddy**:
- Khi một lớp được mock, ByteBuddy can thiệp trực tiếp vào mã máy JVM (JVM Tool Interface / Instrumentation API) để thay thế phần thân (Body) của các hàm bằng logic chặn bắt (Interception Hook).
- Cho phép lập trình viên mock mượt mà các Java Records, Final Service Classes mà không cần phải bỏ từ khóa <code>final</code> trong mã nguồn Production!

### Mô hình BDDMockito (Behavior-Driven Development)

Trong môi trường Enterprise, thay vì dùng cú pháp cổ điển <code>when(...).thenReturn(...)</code>, chúng ta sử dụng **BDDMockito** (<code>given(...).willReturn(...)</code>) để cấu trúc bài test chuẩn theo 3 pha kinh điển:
1. **Given (Arrange)**: Chuẩn bị dữ liệu và hành vi giả định của các Dependency.
2. **When (Act)**: Kích hoạt phương thức nghiệp vụ cần kiểm thử.
3. **Then (Assert)**: Kiểm tra kết quả đầu ra và kiểm chứng tương tác (Interactions) với các Dependency.

---

## 3. Triển khai Production-Grade: Bộ Unit Test Phân hệ Quyết toán Giao dịch Tài chính

Chúng ta sẽ thiết kế một phân hệ nghiệp vụ tài chính khắt khe: **SettlementService (Dịch vụ Quyết toán & Tính Phí Giao dịch)**, bao gồm:
- Quy tắc tính phí giao dịch lũy tiến theo từng bậc số tiền.
- Chặn đứng các giao dịch vượt trần rủi ro.
- Tự động ghi nhận nhật ký kiểm toán qua Dependency.
- Bộ Unit Test sử dụng JUnit 5, AssertJ, BDDMockito, ArgumentCaptor và Parameterized Tests.

### 3.1. Mã nguồn Nghiệp vụ Sản xuất (Production Code)

~~~java
package com.bank.settlement.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

public record Transaction(
    String transactionId,
    String sourceAccount,
    String targetAccount,
    BigDecimal amount,
    String currency,
    Instant timestamp
) {
    public Transaction {
        Objects.requireNonNull(transactionId, "Transaction ID must not be null");
        Objects.requireNonNull(sourceAccount, "Source account must not be null");
        Objects.requireNonNull(targetAccount, "Target account must not be null");
        Objects.requireNonNull(amount, "Amount must not be null");
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be strictly positive");
        }
    }
}
~~~

~~~java
package com.bank.settlement.domain;

import java.math.BigDecimal;
import java.time.Instant;

public record SettlementResult(
    String settlementReference,
    String transactionId,
    BigDecimal netAmount,
    BigDecimal feeAmount,
    SettlementStatus status,
    Instant settledAt
) {
    public enum SettlementStatus {
        SETTLED,
        REJECTED_RISK_LIMIT,
        SUSPENDED_COMPLIANCE
    }
}
~~~

~~~java
package com.bank.settlement.service;

import com.bank.settlement.domain.SettlementResult;
import com.bank.settlement.domain.Transaction;

public interface SettlementAuditPort {
    void recordAuditLog(String eventType, String referenceId, String details);
}
~~~

~~~java
package com.bank.settlement.service;

import com.bank.settlement.domain.SettlementResult;
import com.bank.settlement.domain.SettlementResult.SettlementStatus;
import com.bank.settlement.domain.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettlementService {

    private final SettlementAuditPort auditPort;

    public static final BigDecimal RISK_LIMIT_USD = new BigDecimal("500000.00");
    public static final BigDecimal TIER_1_THRESHOLD = new BigDecimal("10000.00");
    public static final BigDecimal TIER_2_THRESHOLD = new BigDecimal("100000.00");

    public SettlementResult processSettlement(Transaction tx) {
        log.info("Processing settlement for txId={}", tx.transactionId());

        // 1. Kiểm tra trần rủi ro rửa tiền (AML Compliance)
        if (tx.amount().compareTo(RISK_LIMIT_USD) > 0) {
            auditPort.recordAuditLog("REJECTED_AML", tx.transactionId(), "Exceeded risk ceiling");
            return new SettlementResult(
                "REF-" + UUID.randomUUID(),
                tx.transactionId(),
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                SettlementStatus.REJECTED_RISK_LIMIT,
                Instant.now()
            );
        }

        // 2. Tính phí giao dịch bậc thang
        BigDecimal fee = calculateFee(tx.amount());
        BigDecimal netAmount = tx.amount().subtract(fee);

        String refId = "SETTLE-" + UUID.randomUUID();
        auditPort.recordAuditLog("SETTLED_SUCCESS", refId, "Net: " + netAmount + ", Fee: " + fee);

        return new SettlementResult(
            refId,
            tx.transactionId(),
            netAmount,
            fee,
            SettlementStatus.SETTLED,
            Instant.now()
        );
    }

    public BigDecimal calculateFee(BigDecimal amount) {
        if (amount.compareTo(TIER_1_THRESHOLD) <= 0) {
            // Dưới hoặc bằng 10k: Phí cố định 2.50 USD
            return new BigDecimal("2.50");
        } else if (amount.compareTo(TIER_2_THRESHOLD) <= 0) {
            // Từ 10k đến 100k: 0.15% số tiền
            return amount.multiply(new BigDecimal("0.0015")).setScale(2, RoundingMode.HALF_UP);
        } else {
            // Trên 100k: 0.08% số tiền, trần tối đa 250.00 USD
            BigDecimal percentageFee = amount.multiply(new BigDecimal("0.0008")).setScale(2, RoundingMode.HALF_UP);
            return percentageFee.min(new BigDecimal("250.00"));
        }
    }
}
~~~

---

### 3.2. Bộ Unit Test Hoàn chỉnh với JUnit 5, AssertJ & BDDMockito

~~~java
package com.bank.settlement.service;

import com.bank.settlement.domain.SettlementResult;
import com.bank.settlement.domain.SettlementResult.SettlementStatus;
import com.bank.settlement.domain.Transaction;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
@DisplayName("SettlementService Unit Tests")
class SettlementServiceTest {

    @Mock
    private SettlementAuditPort auditPort;

    @InjectMocks
    private SettlementService settlementService;

    @Captor
    private ArgumentCaptor<String> eventTypeCaptor;

    @Captor
    private ArgumentCaptor<String> refIdCaptor;

    @Captor
    private ArgumentCaptor<String> detailsCaptor;

    private Transaction standardTx;

    @BeforeEach
    void setUp() {
        standardTx = new Transaction(
            "TX-9901",
            "ACC-1001",
            "ACC-2002",
            new BigDecimal("5000.00"),
            "USD",
            Instant.now()
        );
    }

    @Nested
    @DisplayName("Fee Calculation Logic Tests")
    class FeeCalculationTests {

        @ParameterizedTest(name = "Amount {0} USD should yield fee of {1} USD")
        @CsvSource({
            "100.00, 2.50",       // Dưới 10k -> Phí cố định 2.50
            "10000.00, 2.50",     // Ngưỡng 10k -> Phí cố định 2.50
            "20000.00, 30.00",    // 20k * 0.15% = 30.00
            "100000.00, 150.00",  // 100k * 0.15% = 150.00
            "200000.00, 160.00",  // 200k * 0.08% = 160.00
            "400000.00, 250.00"   // 400k * 0.08% = 320 -> Vượt trần 250 -> 250.00
        })
        void shouldCalculateCorrectFeeAcrossDifferentTiers(String amountStr, String expectedFeeStr) {
            BigDecimal amount = new BigDecimal(amountStr);
            BigDecimal expectedFee = new BigDecimal(expectedFeeStr);

            BigDecimal actualFee = settlementService.calculateFee(amount);

            assertThat(actualFee)
                .isEqualByComparingTo(expectedFee);
        }
    }

    @Nested
    @DisplayName("Settlement Execution Flow Tests")
    class SettlementFlowTests {

        @Test
        @DisplayName("Should successfully settle standard transaction and record audit log")
        void shouldSettleStandardTransactionSuccessfully() {
            // Given: standardTx (5,000 USD)

            // When
            SettlementResult result = settlementService.processSettlement(standardTx);

            // Then: Assertions using AssertJ fluent API
            assertThat(result).isNotNull();
            assertThat(result.status()).isEqualTo(SettlementStatus.SETTLED);
            assertThat(result.transactionId()).isEqualTo("TX-9901");
            assertThat(result.feeAmount()).isEqualByComparingTo(new BigDecimal("2.50"));
            assertThat(result.netAmount()).isEqualByComparingTo(new BigDecimal("4997.50"));
            assertThat(result.settlementReference()).startsWith("SETTLE-");

            // Verify interactions and capture arguments
            then(auditPort).should(times(1)).recordAuditLog(
                eventTypeCaptor.capture(),
                refIdCaptor.capture(),
                detailsCaptor.capture()
            );

            assertThat(eventTypeCaptor.getValue()).isEqualTo("SETTLED_SUCCESS");
            assertThat(refIdCaptor.getValue()).isEqualTo(result.settlementReference());
            assertThat(detailsCaptor.getValue()).contains("Net: 4997.50", "Fee: 2.50");
        }

        @Test
        @DisplayName("Should reject transaction when amount exceeds AML risk threshold")
        void shouldRejectTransactionExceedingRiskLimit() {
            // Given: Giao dịch 600,000 USD vượt trần 500,000 USD
            Transaction highRiskTx = new Transaction(
                "TX-RISK-01",
                "ACC-111",
                "ACC-222",
                new BigDecimal("600000.00"),
                "USD",
                Instant.now()
            );

            // When
            SettlementResult result = settlementService.processSettlement(highRiskTx);

            // Then
            assertThat(result.status()).isEqualTo(SettlementStatus.REJECTED_RISK_LIMIT);
            assertThat(result.netAmount()).isEqualByComparingTo(BigDecimal.ZERO);

            then(auditPort).should(times(1)).recordAuditLog(
                "REJECTED_AML",
                "TX-RISK-01",
                "Exceeded risk ceiling"
            );
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when creating transaction with zero or negative amount")
        void shouldThrowExceptionWhenTransactionAmountIsInvalid() {
            assertThatThrownBy(() -> new Transaction(
                "TX-INVALID",
                "ACC-A",
                "ACC-B",
                new BigDecimal("-50.00"),
                "USD",
                Instant.now()
            ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Amount must be strictly positive");

            // Đảm bảo không có bất kỳ tương tác nào tới auditPort
            then(auditPort).shouldHaveNoInteractions();
        }
    }
}
~~~

---

## 4. Kiểm thử & Phân tích Độ bao phủ (Code Coverage với JaCoCo)

### Cấu hình JaCoCo Plugin trong pom.xml

~~~xml
<build>
    <plugins>
        <plugin>
            <groupId>org.jacoco</groupId>
            <artifactId>jacoco-maven-plugin</artifactId>
            <version>0.8.12</version>
            <executions>
                <execution>
                    <id>prepare-agent</id>
                    <goals>
                        <goal>prepare-agent</goal>
                    </goals>
                </execution>
                <execution>
                    <id>report</id>
                    <phase>test</phase>
                    <goals>
                        <goal>report</goal>
                    </goals>
                </execution>
                <execution>
                    <id>check</id>
                    <goals>
                        <goal>check</goal>
                    </goals>
                    <configuration>
                        <rules>
                            <rule>
                                <element>BUNDLE</element>
                                <limits>
                                    <limit>
                                        <counter>LINE</counter>
                                        <value>COVEREDRATIO</value>
                                        <minimum>0.85</minimum> <!-- Ép tối thiểu 85% line coverage -->
                                    </limit>
                                    <limit>
                                        <counter>BRANCH</counter>
                                        <value>COVEREDRATIO</value>
                                        <minimum>0.80</minimum> <!-- Ép tối thiểu 80% branch coverage -->
                                    </limit>
                                </limits>
                            </rule>
                        </rules>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
~~~

### Lệnh chạy Kiểm thử & Kiểm tra Báo cáo

~~~bash
# Chạy toàn bộ Unit Tests và sinh báo cáo JaCoCo
./mvnw clean test

# Mở báo cáo trực quan trên trình duyệt (target/site/jacoco/index.html)
~~~

Kết quả Console log khi chạy lệnh:
~~~text
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.bank.settlement.service.SettlementServiceTest
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.812 s -- in com.bank.settlement.service.SettlementServiceTest
[INFO] 
[INFO] --- jacoco:0.8.12:report (report) @ bank-settlement ---
[INFO] Loading execution data for target/jacoco.exec
[INFO] Analyzed bundle 'bank-settlement' with 4 classes
[INFO] Line Coverage: 96.4%
[INFO] Branch Coverage: 91.6%
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Cạm bẫy "Over-Mocking" — Mock cả những thứ không nên Mock

- **Triệu chứng**: Toàn bộ 500 bài test trong dự án đều chạy XANH (Green 100%), nhưng khi deploy lên môi trường Staging thì các API lập tức quăng lỗi 500 NullPointerException hoặc tính sai công thức số học.
- **Nguyên nhân cốt lõi**:
  Lập trình viên mock luôn cả các đối tượng thuần túy giá trị (Value Objects, DTOs, Helpers, Math Calculators):
  ~~~java
  // PHẢN MẪU (ANTI-PATTERN): Mock cả Transaction DTO
  Transaction mockTx = Mockito.mock(Transaction.class);
  given(mockTx.getAmount()).willReturn(new BigDecimal("100.00"));
  ~~~
  Khi mã nguồn của <code>Transaction</code> thay đổi phương thức hoặc bổ sung validation (ví dụ: cấm amount âm), bài test không hề phát hiện ra vì đối tượng thật không hề được tạo.
- **Quy tắc Vàng**:
  **CHỈ MOCK CÁC I/O BOUND BOUNDARIES (Ports/Adapters)**: Database Repositories, External REST Clients, Message Brokers, Email/SMS Gateways.
  **TUYỆT ĐỐI KHÔNG MOCK**: Entities, DTOs, Records, Value Objects, Domain Exceptions, và Pure In-Memory Business Functions! Hãy sử dụng đối tượng thật (Real Objects) cho các thành phần này.

### Post-mortem 2: Lỗi UnnecessaryStubbingException trong Mockito 5

- **Triệu chứng**: Bài test đang chạy bình thường, sau khi sửa một dòng code nhỏ thì Mockito quăng lỗi:
  <code>org.mockito.exceptions.misusing.UnnecessaryStubbingException: Unnecessary stubbings detected in test class...</code>
- **Nguyên nhân cốt lõi**:
  Trong Mockito 5, chế độ <code>Strictness.STRICT_STUBS</code> được bật mặc định khi sử dụng <code>@ExtendWith(MockitoExtension.class)</code>. Nếu bạn khai báo một hành vi giả lập (Stubbing) bằng <code>given(...)</code> nhưng trong suốt quá trình chạy test, phương thức đó không hề được gọi đến, Mockito sẽ chủ động làm bài test THẤT BẠI.
- **Ý nghĩa thiết kế**: Đây là một tính năng tuyệt vời của Mockito để ngăn chặn mã test rác (Dead Test Code) tích tụ qua năm tháng. Lập trình viên không được dùng <code>@MockitoSettings(strictness = Strictness.LENIENT)</code> để tắt cảnh báo một cách cẩu thả; thay vào đó, hãy xóa bỏ dòng <code>given(...)</code> thừa thãi đó.

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống chấm điểm tín dụng ngân hàng (Credit Scoring Engine) cần kiểm thử đơn vị cho dịch vụ **CreditAssessmentService**:
1. Đánh giá hồ sơ xin vay tiền (<code>LoanApplication</code>):
   - Nếu điểm tín dụng CIC dưới 550: Từ chối ngay lập tức (<code>REJECTED_BAD_CREDIT</code>), không cần kiểm tra thu nhập.
   - Nếu tỉ lệ nợ trên thu nhập (Debt-to-Income: DTI = tổng nợ hàng tháng / thu nhập) vượt quá 45%: Từ chối (<code>REJECTED_HIGH_DTI</code>).
   - Nếu thỏa mãn: Duyệt khoản vay (<code>APPROVED</code>) với hạn mức tối đa bằng 5 lần thu nhập hàng tháng.
2. Dịch vụ phụ thuộc: <code>CicScoreClientPort</code> (cổng gọi sang trung tâm tín dụng quốc gia) và <code>CreditDecisionRepository</code> (lưu quyết định).
3. **Yêu cầu**: Viết bài test JUnit 5 bao phủ 100% các nhánh nghiệp vụ, sử dụng BDDMockito, kiểm chứng không có tương tác thừa (Zero Unnecessary Interactions) khi hồ sơ bị từ chối sớm ở vòng CIC.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.credit.domain;

import java.math.BigDecimal;

public record LoanApplication(
    String applicationId,
    String citizenId,
    BigDecimal monthlyIncome,
    BigDecimal existingMonthlyDebt
) {}
~~~

~~~java
package com.bank.credit.domain;

import java.math.BigDecimal;

public record CreditDecision(
    String applicationId,
    DecisionStatus status,
    BigDecimal approvedLimit,
    String reason
) {
    public enum DecisionStatus {
        APPROVED,
        REJECTED_BAD_CREDIT,
        REJECTED_HIGH_DTI
    }
}
~~~

~~~java
package com.bank.credit.service;

public interface CicScoreClientPort {
    int getCreditScore(String citizenId);
}
~~~

~~~java
package com.bank.credit.service;

import com.bank.credit.domain.CreditDecision;

public interface CreditDecisionRepository {
    void saveDecision(CreditDecision decision);
}
~~~

~~~java
package com.bank.credit.service;

import com.bank.credit.domain.CreditDecision;
import com.bank.credit.domain.CreditDecision.DecisionStatus;
import com.bank.credit.domain.LoanApplication;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class CreditAssessmentService {

    private final CicScoreClientPort cicScoreClient;
    private final CreditDecisionRepository decisionRepository;

    private static final int MIN_PASSING_CREDIT_SCORE = 550;
    private static final BigDecimal MAX_ALLOWED_DTI = new BigDecimal("0.45");

    public CreditDecision assessApplication(LoanApplication app) {
        // 1. Kiểm tra điểm CIC
        int score = cicScoreClient.getCreditScore(app.citizenId());
        if (score < MIN_PASSING_CREDIT_SCORE) {
            CreditDecision decision = new CreditDecision(
                app.applicationId(),
                DecisionStatus.REJECTED_BAD_CREDIT,
                BigDecimal.ZERO,
                "Credit score " + score + " is below minimum requirement 550"
            );
            decisionRepository.saveDecision(decision);
            return decision;
        }

        // 2. Kiểm tra tỉ lệ nợ trên thu nhập (DTI)
        BigDecimal dti = app.existingMonthlyDebt().divide(app.monthlyIncome(), 4, RoundingMode.HALF_UP);
        if (dti.compareTo(MAX_ALLOWED_DTI) > 0) {
            CreditDecision decision = new CreditDecision(
                app.applicationId(),
                DecisionStatus.REJECTED_HIGH_DTI,
                BigDecimal.ZERO,
                "DTI ratio " + dti + " exceeds limit 0.45"
            );
            decisionRepository.saveDecision(decision);
            return decision;
        }

        // 3. Phê duyệt hạn mức tối đa = 5 x Thu nhập
        BigDecimal approvedLimit = app.monthlyIncome().multiply(new BigDecimal("5.00"));
        CreditDecision decision = new CreditDecision(
            app.applicationId(),
            DecisionStatus.APPROVED,
            approvedLimit,
            "Approved based on healthy financial profile"
        );
        decisionRepository.saveDecision(decision);
        return decision;
    }
}
~~~

~~~java
package com.bank.credit.service;

import com.bank.credit.domain.CreditDecision;
import com.bank.credit.domain.CreditDecision.DecisionStatus;
import com.bank.credit.domain.LoanApplication;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreditAssessmentService Unit Tests")
class CreditAssessmentServiceTest {

    @Mock
    private CicScoreClientPort cicScoreClient;

    @Mock
    private CreditDecisionRepository decisionRepository;

    @InjectMocks
    private CreditAssessmentService assessmentService;

    @Test
    @DisplayName("Should reject loan application immediately when CIC score is below 550")
    void shouldRejectWhenCicScoreIsSubprime() {
        // Given
        LoanApplication app = new LoanApplication(
            "APP-001", "ID-123456", new BigDecimal("3000.00"), new BigDecimal("500.00")
        );
        given(cicScoreClient.getCreditScore("ID-123456")).willReturn(520);

        // When
        CreditDecision decision = assessmentService.assessApplication(app);

        // Then
        assertThat(decision.status()).isEqualTo(DecisionStatus.REJECTED_BAD_CREDIT);
        assertThat(decision.approvedLimit()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(decision.reason()).contains("Credit score 520 is below minimum");

        // Verify repository was called once with the exact decision
        ArgumentCaptor<CreditDecision> captor = ArgumentCaptor.forClass(CreditDecision.class);
        then(decisionRepository).should(times(1)).saveDecision(captor.capture());
        assertThat(captor.getValue().status()).isEqualTo(DecisionStatus.REJECTED_BAD_CREDIT);
    }

    @Test
    @DisplayName("Should reject loan application when DTI ratio exceeds 45 percent")
    void shouldRejectWhenDtiRatioExceedsThreshold() {
        // Given: Thu nhập 2000, nợ hiện tại 1000 -> DTI = 50% (> 45%)
        LoanApplication app = new LoanApplication(
            "APP-002", "ID-888888", new BigDecimal("2000.00"), new BigDecimal("1000.00")
        );
        given(cicScoreClient.getCreditScore("ID-888888")).willReturn(700); // CIC tốt

        // When
        CreditDecision decision = assessmentService.assessApplication(app);

        // Then
        assertThat(decision.status()).isEqualTo(DecisionStatus.REJECTED_HIGH_DTI);
        assertThat(decision.approvedLimit()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(decision.reason()).contains("DTI ratio 0.5000 exceeds limit 0.45");

        then(decisionRepository).should(times(1)).saveDecision(decision);
    }

    @Test
    @DisplayName("Should approve loan application with 5x monthly income limit when all criteria pass")
    void shouldApproveWhenProfileIsHealthy() {
        // Given: Thu nhập 4000, nợ 800 -> DTI = 20% (< 45%), CIC = 750 (> 550)
        LoanApplication app = new LoanApplication(
            "APP-003", "ID-999999", new BigDecimal("4000.00"), new BigDecimal("800.00")
        );
        given(cicScoreClient.getCreditScore("ID-999999")).willReturn(750);

        // When
        CreditDecision decision = assessmentService.assessApplication(app);

        // Then
        assertThat(decision.status()).isEqualTo(DecisionStatus.APPROVED);
        assertThat(decision.approvedLimit()).isEqualByComparingTo(new BigDecimal("20000.00")); // 4000 * 5

        then(decisionRepository).should(times(1)).saveDecision(decision);
    }
}
~~~

:::takeaways
- **Kiến trúc JUnit 5 Độc lập**: Tách biệt Platform, Jupiter Engine và Vintage Engine. Mặc định chạy <code>PER_METHOD</code> đảm bảo cách ly tuyệt đối giữa các test case.
- **Mockito 5 với ByteBuddy**: Sử dụng Inline Mock Maker cho phép can thiệp Bytecode runtime để mock cả các lớp <code>final</code>, phương thức <code>final</code> và Java 14+ <code>record</code>.
- **Cú pháp BDDMockito Chuẩn**: Viết test theo cấu trúc 3 pha Given - When - Then với <code>BDDMockito.given()</code> và <code>BDDMockito.then()</code> giúp code sáng rõ, tự tài liệu hóa.
- **Chỉ Mock ở Ranh giới I/O**: Không bao giờ mock Entity, DTO, Record hoặc Value Object. Chỉ mock Database Repository, External Client, Message Broker.
- **Nghiêm trị UnnecessaryStubbing**: Tận dụng cơ chế Strict Stubbing mặc định của Mockito 5 để loại bỏ mã test rác, không dùng <code>LENIENT</code> để che giấu lỗi.
- **Đo lường Chất lượng bằng JaCoCo**: Không chỉ nhìn vào số lượng test mà cần theo dõi chặt chẽ Branch Coverage (độ phủ rẽ nhánh) để phát hiện các edge case bị bỏ quên.
:::
`
    },
    {
      id: "4-2",
      type: "lesson",
      title: "Slice & Integration tests, Testcontainers",
      minutes: 50,
      content: `
## Slice & Integration Tests, Testcontainers — Kiểm thử Tầng Cắt và Cơ sở Dữ liệu Thật

Khởi động toàn bộ Spring Context (<code>@SpringBootTest</code>) cho mỗi bài kiểm thử là một trong những nguyên nhân hàng đầu khiến thời gian xây dựng (Build Time) của các dự án Enterprise kéo dài từ 30 phút đến hàng tiếng đồng hồ. Ngược lại, việc lạm dụng cơ sở dữ liệu nhúng trong bộ nhớ (In-Memory Database như H2) để thay thế PostgreSQL/MySQL ở môi trường kiểm thử thường tạo ra "ảo giác an toàn" (False Sense of Security): bài test chạy qua nhưng ứng dụng sập ngay lập tức trên Production do khác biệt về cú pháp SQL, hàm JSONB hay cơ chế Locking.

Bài học này sẽ giải phẫu chuyên sâu cơ chế **Sliced Testing (Kiểm thử Tầng cắt)** của Spring Boot, kiến trúc điều phối Docker của **Testcontainers**, và mô hình **Singleton Container Pattern** giúp tối ưu hóa thời gian chạy kiểm thử tích hợp xuống mức mili-giây.

---

## 1. Cơ chế Ngầm của Sliced Testing (Under the Hood)

### Cơ chế lọc TypeExcludeFilter của Spring Boot

Khi bạn đánh dấu một lớp kiểm thử bằng các annotation tầng cắt như <code>@WebMvcTest</code> hoặc <code>@DataJpaTest</code>, Spring Boot không nạp toàn bộ các Bean trong mã nguồn. Thay vào đó, nó kích hoạt các bộ lọc loại trừ chuyên biệt (<code>TypeExcludeFilter</code>):

~~~text
+-----------------------------------------------------------------------------------+
|                        SPRING BOOT SLICED TESTING FILTERS                         |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  |                         FULL APPLICATION CONTEXT                            |  |
|  |  @Controller, @Service, @Repository, @Component, Security, Caching, Broker |  |
|  +-----------------------------------------------------------------------------+  |
|                         /                                                        |
|      @WebMvcTest       /                                     @DataJpaTest        |
|                       v                                   v                       |
|  +---------------------------------------+  +----------------------------------+  |
|  |           WEB MVC SLICE               |  |          DATA JPA SLICE          |  |
|  |  * CHỈ NẠP:                           |  |  * CHỈ NẠP:                     |  |
|  |    - Target @Controller               |  |    - @Entity, @Repository        |  |
|  |    - @ControllerAdvice (Exception)    |  |    - EntityManager, DataSource   |  |
|  |    - Filter, HandlerMethodArgument    |  |    - Flyway / Liquibase          |  |
|  |    - Jackson ObjectMapper             |  |    - TestEntityManager           |  |
|  |  * LOẠI BỎ TOÀN BỘ:                   |  |  * LOẠI BỎ TOÀN BỘ:             |  |
|  |    - @Service, @Repository, Database  |  |    - @Controller, Web MVC        |  |
|  |  ==> Khởi động trong ~1.5 giây!       |  |  ==> Tự động @Rollback sau test! |  |
|  +---------------------------------------+  +----------------------------------+  |
+-----------------------------------------------------------------------------------+
~~~

### TestEntityManager trong @DataJpaTest

Trong các bài test tầng Data, Spring cung cấp lớp tiện ích <code>TestEntityManager</code> bọc ngoài <code>EntityManager</code> chuẩn của JPA:
- Cho phép lập trình viên ép Hibernate bắn câu lệnh SQL ngay lập tức (<code>persistAndFlush()</code>) thay vì lưu tạm trong First-Level Cache.
- Phương thức <code>clear()</code> giúp xóa sạch Persistence Context để kiểm chứng chính xác xem câu lệnh <code>SELECT</code> có thực sự truy vấn xuống cơ sở dữ liệu hay không.
- Mặc định, mọi phương thức test trong <code>@DataJpaTest</code> đều được bọc trong một Transaction và **tự động Rollback** khi kết thúc test, giữ cho cơ sở dữ liệu luôn sạch sẽ.

---

## 2. Kiến trúc Testcontainers: Kiểm thử trên Cơ sở Dữ liệu Thật

### Ảo tưởng H2 Database (The In-Memory H2 Fallacy)

Nhiều lập trình viên sử dụng H2 Database cho bài test vì tính tiện lợi (không cần cài đặt gì). Tuy nhiên, đây là cạm bẫy cực kỳ nguy hiểm trong môi trường thực tế:
1. **Khác biệt về kiểu dữ liệu**: PostgreSQL có các kiểu dữ liệu mạnh mẽ như <code>JSONB</code>, <code>UUID</code>, <code>ARRAY</code>, <code>INET</code>, <code>TSVECTOR</code> mà H2 không hỗ trợ hoặc mô phỏng không chính xác.
2. **Khác biệt về Dialect & Khóa**: H2 không có cơ chế <code>SELECT ... FOR UPDATE SKIP LOCKED</code> của PostgreSQL. Các bài test kiểm tra xử lý đồng thời (Concurrency / Race Conditions) chạy trên H2 sẽ hoàn toàn vô nghĩa.
3. **Migration Scripts (Flyway)**: Các file Flyway migration viết bằng cú pháp đặc thù của PostgreSQL (ví dụ: <code>CREATE EXTENSION "uuid-ossp"</code>, <code>gin index</code>) sẽ văng lỗi cú pháp ngay khi khởi chạy trên H2.

### Kiến trúc Hoạt động của Testcontainers

Testcontainers sử dụng Docker Java API để giao tiếp trực tiếp với Docker Daemon trên máy của lập trình viên hoặc máy chủ CI/CD:

~~~text
+-----------------------------------------------------------------------------------+
|                        TESTCONTAINERS ARCHITECTURE FLOW                           |
|                                                                                   |
|  JVM Test Process (JUnit 5)                                                       |
|       |                                                                           |
|       +---> 1. Kết nối Docker Daemon (TCP 2375 hoặc Unix Socket)                  |
|       |                                                                           |
|       +---> 2. Khởi tạo container "testcontainers/ryuk" (Resource Reaper)        |
|       |        (Lắng nghe qua TCP socket; tự động dọn sạch container khi JVM chết)|
|       |                                                                           |
|       +---> 3. Khởi tạo container "postgres:16-alpine"                            |
|       |        Bắt cổng động ngẫu nhiên: Host Port 49152 -> Container Port 5432   |
|       |                                                                           |
|       v                                                                           |
|  [@DynamicPropertySource]                                                         |
|       |                                                                           |
|       +---> 4. Ghi đè cấu hình Spring Environment trước khi nạp Context:          |
|                spring.datasource.url = jdbc:postgresql://localhost:49152/testdb   |
|                spring.datasource.username = testuser                              |
|                spring.datasource.password = testpass                              |
|       |                                                                           |
|       v                                                                           |
|  [Flyway Auto-Migration] ---> Tạo bảng thật trên container PostgreSQL             |
|       |                                                                           |
|       v                                                                           |
|  [JUnit Tests Run]       ---> Chạy truy vấn trên PostgreSQL thật 100%!            |
+-----------------------------------------------------------------------------------+
~~~

:::tip CỔNG ĐỘNG (DYNAMIC EPHEMERAL PORTS)
Testcontainers **không bao giờ bind cổng cố định** (như <code>5432:5432</code>). Nó luôn ánh xạ cổng của container vào một cổng ngẫu nhiên khả dụng trên Host (ví dụ: <code>49152</code>). Điều này cho phép nhiều tiến trình kiểm thử chạy song song trong các pipeline CI/CD mà không bao giờ bị lỗi xung đột cổng (<code>BindException: Address already in use</code>).
:::

---

## 3. Triển khai Production-Grade: Sliced WebMvcTest & DataJpaTest với Testcontainers

Chúng ta sẽ xây dựng phân hệ **Quản lý Đơn hàng (Order Management Subsystem)** gồm 2 bài kiểm thử chuyên sâu:
1. <code>OrderControllerTest</code> (@WebMvcTest): Kiểm thử validation đầu vào, mã lỗi HTTP RFC 7807, bảo mật Spring Security với MockMvc.
2. <code>OrderRepositoryTest</code> (@DataJpaTest + Testcontainers): Kiểm thử truy vấn native PostgreSQL, ràng buộc khóa ngoại, và Flyway migration trên container PostgreSQL 16 thật.

### 3.1. Mã nguồn Nghiệp vụ (Production Code)

~~~java
package com.ecommerce.order.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "customer_orders")
@Getter
@Setter
@NoArgsConstructor
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_tracking_number", nullable = false, unique = true, length = 64)
    private String orderTrackingNumber;

    @Column(name = "customer_email", nullable = false, length = 128)
    private String customerEmail;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public enum OrderStatus {
        PENDING,
        PAID,
        CANCELLED
    }

    public CustomerOrder(String orderTrackingNumber, String customerEmail, BigDecimal totalAmount) {
        this.orderTrackingNumber = orderTrackingNumber;
        this.customerEmail = customerEmail;
        this.totalAmount = totalAmount;
    }
}
~~~

~~~java
package com.ecommerce.order.repository;

import com.ecommerce.order.domain.CustomerOrder;
import com.ecommerce.order.domain.CustomerOrder.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    Optional<CustomerOrder> findByOrderTrackingNumber(String trackingNumber);

    List<CustomerOrder> findByCustomerEmailAndStatus(String email, OrderStatus status);

    // Truy vấn Native tận dụng hàm PostgreSQL
    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM customer_orders WHERE customer_email = :email AND status = 'PAID'", nativeQuery = true)
    BigDecimal calculateTotalPaidAmountByCustomer(@Param("email") String email);
}
~~~

~~~java
package com.ecommerce.order.controller;

import com.ecommerce.order.domain.CustomerOrder;
import com.ecommerce.order.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        CustomerOrder order = orderService.placeOrder(request.customerEmail(), request.amount());
        return ResponseEntity.status(HttpStatus.CREATED).body(new OrderResponse(
            order.getOrderTrackingNumber(),
            order.getCustomerEmail(),
            order.getTotalAmount(),
            order.getStatus().name()
        ));
    }

    @GetMapping("/{trackingNumber}")
    public ResponseEntity<OrderResponse> getOrderByTrackingNumber(@PathVariable String trackingNumber) {
        CustomerOrder order = orderService.getOrderByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(new OrderResponse(
            order.getOrderTrackingNumber(),
            order.getCustomerEmail(),
            order.getTotalAmount(),
            order.getStatus().name()
        ));
    }

    public record CreateOrderRequest(
        @NotBlank(message = "Customer email must not be blank")
        @Email(message = "Invalid email format")
        String customerEmail,

        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be strictly greater than 0")
        BigDecimal amount
    ) {}

    public record OrderResponse(
        String orderTrackingNumber,
        String customerEmail,
        BigDecimal totalAmount,
        String status
    ) {}
}
~~~

---

### 3.2. Sliced Controller Test với MockMvc (@WebMvcTest)

~~~java
package com.ecommerce.order.controller;

import com.ecommerce.order.domain.CustomerOrder;
import com.ecommerce.order.domain.CustomerOrder.OrderStatus;
import com.ecommerce.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@DisplayName("OrderController WebMvc Slice Tests")
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    @WithMockUser(username = "buyer@bank.com", roles = {"CUSTOMER"})
    @DisplayName("POST /api/v1/orders - Should return 201 Created when payload is valid")
    void shouldCreateOrderSuccessfully() throws Exception {
        // Given
        OrderController.CreateOrderRequest request = new OrderController.CreateOrderRequest(
            "buyer@bank.com",
            new BigDecimal("150.00")
        );

        CustomerOrder createdOrder = new CustomerOrder("ORD-TRACK-999", "buyer@bank.com", new BigDecimal("150.00"));
        createdOrder.setStatus(OrderStatus.PENDING);

        given(orderService.placeOrder(eq("buyer@bank.com"), any(BigDecimal.class)))
            .willReturn(createdOrder);

        // When & Then
        mockMvc.perform(post("/api/v1/orders")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.orderTrackingNumber").value("ORD-TRACK-999"))
            .andExpect(jsonPath("$.customerEmail").value("buyer@bank.com"))
            .andExpect(jsonPath("$.totalAmount").value(150.00))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser
    @DisplayName("POST /api/v1/orders - Should return 400 Bad Request when email is invalid (RFC 7807)")
    void shouldReturnBadRequestWhenEmailIsInvalid() throws Exception {
        // Given: Email sai định dạng và số tiền bằng 0
        OrderController.CreateOrderRequest invalidRequest = new OrderController.CreateOrderRequest(
            "not-an-email",
            BigDecimal.ZERO
        );

        // When & Then: MockMvc kiểm tra validation trước khi chạm tới Controller/Service
        mockMvc.perform(post("/api/v1/orders")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.title").value("Bad Request"))
            .andExpect(jsonPath("$.detail", containsString("Invalid email format")));
    }

    @Test
    @WithMockUser
    @DisplayName("GET /api/v1/orders/{trackingNumber} - Should return order details")
    void shouldReturnOrderWhenExists() throws Exception {
        CustomerOrder order = new CustomerOrder("ORD-XYZ-123", "alice@test.com", new BigDecimal("49.99"));
        given(orderService.getOrderByTrackingNumber("ORD-XYZ-123")).willReturn(order);

        mockMvc.perform(get("/api/v1/orders/ORD-XYZ-123")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.orderTrackingNumber").value("ORD-XYZ-123"))
            .andExpect(jsonPath("$.totalAmount").value(49.99));
    }
}
~~~

---

### 3.3. Sliced Repository Test với Testcontainers PostgreSQL 16 Thật

~~~java
package com.ecommerce.order.repository;

import com.ecommerce.order.domain.CustomerOrder;
import com.ecommerce.order.domain.CustomerOrder.OrderStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE) // CẤM Spring thay thế bằng H2!
@DisplayName("CustomerOrderRepository Integration Tests with Real PostgreSQL")
class CustomerOrderRepositoryTest {

    // SINGLETON CONTAINER: Khởi chạy 1 container duy nhất cho toàn bộ test
    @Container
    private static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("orders_test_db")
        .withUsername("order_user")
        .withPassword("order_secret");

    // DynamicPropertySource tiêm URL cổng ngẫu nhiên vào DataSource của Spring
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private CustomerOrderRepository repository;

    @Autowired
    private TestEntityManager testEntityManager;

    @Test
    @DisplayName("Should persist order and calculate total paid amount using PostgreSQL native aggregation")
    void shouldPersistAndCalculateTotalPaidAmount() {
        // Given: Chuẩn bị 3 đơn hàng trong DB thật
        CustomerOrder order1 = new CustomerOrder("ORD-001", "vip@customer.com", new BigDecimal("100.00"));
        order1.setStatus(OrderStatus.PAID);

        CustomerOrder order2 = new CustomerOrder("ORD-002", "vip@customer.com", new BigDecimal("250.50"));
        order2.setStatus(OrderStatus.PAID);

        CustomerOrder order3 = new CustomerOrder("ORD-003", "vip@customer.com", new BigDecimal("50.00"));
        order3.setStatus(OrderStatus.PENDING); // Chưa thanh toán

        testEntityManager.persist(order1);
        testEntityManager.persist(order2);
        testEntityManager.persist(order3);
        testEntityManager.flush();
        testEntityManager.clear(); // Xóa sạch L1 Cache để ép buộc câu lệnh SELECT thật xuống PostgreSQL

        // When: Gọi native query tính tổng tiền đã thanh toán
        BigDecimal totalPaid = repository.calculateTotalPaidAmountByCustomer("vip@customer.com");

        // Then: 100.00 + 250.50 = 350.50 (Bỏ qua order3 vì PENDING)
        assertThat(totalPaid).isEqualByComparingTo(new BigDecimal("350.50"));
    }

    @Test
    @DisplayName("Should return empty when tracking number does not exist")
    void shouldReturnEmptyWhenNotFound() {
        Optional<CustomerOrder> result = repository.findByOrderTrackingNumber("NON-EXISTENT");
        assertThat(result).isEmpty();
    }
}
~~~

---

## 4. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Thảm họa Container Churn — Bộ Test chạy mất 40 phút

- **Triệu chứng**: Khi dự án phát triển lên 40 test classes sử dụng Testcontainers, thời gian build CI/CD kéo dài từ 2 phút lên 45 phút. Máy chủ Jenkins báo cạn kiệt tài nguyên CPU và Disk IOPS.
- **Nguyên nhân cốt lõi**:
  Mỗi lớp test khai báo <code>@Container private PostgreSQLContainer postgres = new PostgreSQLContainer(...)</code> ở mức instance (không có <code>static</code>) hoặc cấu hình khởi tạo lại container cho từng bài test:
  - 40 test classes x trung bình 5 tests = 200 lần khởi động và tắt Docker container!
  - Mỗi lần tạo container mất khoảng 5 - 10 giây (pull image, tạo filesystem layer, khởi động PostgreSQL daemon, chạy migration).
- **Giải pháp Chuẩn Sản xuất: Singleton Container Pattern**:
  Tạo một lớp trừu tượng cơ sở (Base Integration Test) chia sẻ **1 container duy nhất** xuyên suốt toàn bộ vòng đời của tiến trình test JVM:
  ~~~java
  public abstract class AbstractIntegrationTest {
      private static final PostgreSQLContainer<?> SHARED_POSTGRES = 
          new PostgreSQLContainer<>("postgres:16-alpine");

      static {
          SHARED_POSTGRES.start(); // Khởi động 1 lần duy nhất khi nạp Class
      }

      @DynamicPropertySource
      static void overrideProperties(DynamicPropertyRegistry registry) {
          registry.add("spring.datasource.url", SHARED_POSTGRES::getJdbcUrl);
          registry.add("spring.datasource.username", SHARED_POSTGRES::getUsername);
          registry.add("spring.datasource.password", SHARED_POSTGRES::getPassword);
      }
  }
  ~~~
  Toàn bộ 40 test classes chỉ cần kế thừa <code>AbstractIntegrationTest</code>. Thời gian chạy 200 tests giảm từ 45 phút xuống còn **25 giây**!

### Post-mortem 2: Ô nhiễm Context (Context Dirtying) do lạm dụng @MockBean

- **Triệu chứng**: Mặc dù mã nguồn không đổi, bộ kiểm thử ngày càng chậm và JVM bị văng lỗi <code>OutOfMemoryError: Metaspace</code>.
- **Nguyên nhân cốt lõi**:
  Spring TestContext Framework có cơ chế lưu đệm (Caching) ApplicationContext giữa các lớp test để tiết kiệm thời gian khởi động. Tuy nhiên:
  - Nếu Test Class A dùng: <code>@MockBean UserService, @MockBean EmailService</code>
  - Test Class B dùng: <code>@MockBean UserService, @MockBean SmsService</code>
  - Cấu hình Bean của hai lớp test bị khác nhau! Spring buộc phải tạo ra 2 ApplicationContext độc lập và nạp cả hai vào RAM.
  - Càng nhiều tổ hợp <code>@MockBean</code> khác nhau, Spring càng tạo ra hàng chục ApplicationContext ngầm, gây cạn kiệt bộ nhớ Metaspace.
- **Khắc phục**: Gom nhóm các <code>@MockBean</code> dùng chung vào một cấu hình tập trung hoặc ưu tiên sử dụng Sliced Test riêng biệt.

---

## 5. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Kho vận Thương mại điện tử (Warehouse Fulfillment) cần kiểm thử tích hợp cho phân hệ **Giữ trước Tồn kho (Inventory Reservation)**:
1. Entity <code>InventoryItem</code>:
   - <code>sku</code>: Mã sản phẩm (Unique).
   - <code>availableQuantity</code>: Số lượng tồn kho khả dụng.
   - <code>reservedQuantity</code>: Số lượng đang bị giữ trước cho các giỏ hàng.
2. Phương thức Repository:
   - Sử dụng PostgreSQL Native Query với câu lệnh <code>UPDATE ... SET available_quantity = available_quantity - :qty, reserved_quantity = reserved_quantity + :qty WHERE sku = :sku AND available_quantity &gt;= :qty</code> (Atomic Reservation để chống Overselling khi có tải đồng thời).
3. **Yêu cầu**: Viết bài kiểm thử <code>InventoryRepositoryTest</code> đạt chuẩn, kết nối PostgreSQL qua Testcontainers, kiểm chứng:
   - Giữ hàng thành công khi số lượng tồn kho còn đủ.
   - Trả về số dòng cập nhật = 0 (thất bại an toàn) khi số lượng yêu cầu vượt quá tồn kho khả dụng.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.ecommerce.warehouse.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "warehouse_inventory")
@Getter
@Setter
@NoArgsConstructor
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sku", nullable = false, unique = true, length = 64)
    private String sku;

    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity;

    @Column(name = "reserved_quantity", nullable = false)
    private Integer reservedQuantity;

    public InventoryItem(String sku, Integer availableQuantity, Integer reservedQuantity) {
        this.sku = sku;
        this.availableQuantity = availableQuantity;
        this.reservedQuantity = reservedQuantity;
    }
}
~~~

~~~java
package com.ecommerce.warehouse.repository;

import com.ecommerce.warehouse.domain.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findBySku(String sku);

    @Modifying
    @Query(value = """
        UPDATE warehouse_inventory
        SET available_quantity = available_quantity - :qty,
            reserved_quantity = reserved_quantity + :qty
        WHERE sku = :sku AND available_quantity >= :qty
        """, nativeQuery = true)
    int reserveStockAtomic(@Param("sku") String sku, @Param("qty") int qty);
}
~~~

~~~java
package com.ecommerce.warehouse.repository;

import com.ecommerce.warehouse.domain.InventoryItem;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("InventoryRepository Atomic Reservation Integration Tests")
class InventoryRepositoryTest {

    @Container
    private static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("inventory_test_db")
        .withUsername("inv_user")
        .withPassword("inv_secret");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("Should atomically reserve stock when available quantity is sufficient")
    void shouldReserveStockSuccessfullyWhenAvailable() {
        // Given: Sản phẩm có 50 cái khả dụng, 0 cái đang giữ
        InventoryItem item = new InventoryItem("SKU-LAPTOP-M3", 50, 0);
        entityManager.persistAndFlush(item);
        entityManager.clear();

        // When: Yêu cầu giữ 10 cái
        int updatedRows = inventoryRepository.reserveStockAtomic("SKU-LAPTOP-M3", 10);

        // Then
        assertThat(updatedRows).isEqualTo(1); // 1 dòng được cập nhật thành công

        entityManager.clear();
        InventoryItem updated = inventoryRepository.findBySku("SKU-LAPTOP-M3").orElseThrow();
        assertThat(updated.getAvailableQuantity()).isEqualTo(40);
        assertThat(updated.getReservedQuantity()).isEqualTo(10);
    }

    @Test
    @DisplayName("Should fail atomic reservation (0 rows updated) when requested quantity exceeds available stock")
    void shouldFailReservationWhenStockInsufficient() {
        // Given: Sản phẩm chỉ còn 5 cái khả dụng
        InventoryItem item = new InventoryItem("SKU-IPHONE-15", 5, 2);
        entityManager.persistAndFlush(item);
        entityManager.clear();

        // When: Yêu cầu giữ 10 cái (vượt quá 5 cái hiện có)
        int updatedRows = inventoryRepository.reserveStockAtomic("SKU-IPHONE-15", 10);

        // Then
        assertThat(updatedRows).isEqualTo(0); // Không có dòng nào bị cập nhật

        entityManager.clear();
        InventoryItem unchanged = inventoryRepository.findBySku("SKU-IPHONE-15").orElseThrow();
        assertThat(unchanged.getAvailableQuantity()).isEqualTo(5); // Dữ liệu nguyên vẹn
        assertThat(unchanged.getReservedQuantity()).isEqualTo(2);
    }
}
~~~

:::takeaways
- **Cơ chế Sliced Test (@WebMvcTest & @DataJpaTest)**: Chỉ khởi tạo phân vùng Context cần thiết thông qua <code>TypeExcludeFilter</code>, giúp thời gian khởi động bài test giảm từ hàng chục giây xuống dưới 2 giây.
- **Nói Không với Ảo tưởng H2**: H2 không thể mô phỏng đúng các tính năng nâng cao của PostgreSQL (JSONB, Trigram, Window Functions, Row-level Locking). Mọi test tích hợp dữ liệu bắt buộc phải chạy trên DB thật.
- **Sức mạnh Của Testcontainers**: Tự động điều phối container Docker thật, tự gán cổng động tránh xung đột trên CI/CD, và tự động thu hồi tài nguyên thông qua Ryuk Reaper.
- **Singleton Container Pattern**: Khởi tạo container dùng chung cho toàn bộ bài kiểm thử thay vì dựng lại từng lớp test, giảm thời gian build test từ 45 phút xuống dưới 30 giây.
- **Tận dụng TestEntityManager**: Bắt buộc dùng <code>flush()</code> và <code>clear()</code> khi test JPA Repository để đẩy SQL thật xuống database và tránh bẫy First-Level Cache.
:::
`
    },
    {
      id: "4-3",
      type: "lesson",
      title: "Mockito nâng cao — ArgumentCaptor, BDDMockito, spy",
      minutes: 45,
      content: `
## Mockito Nâng cao — ArgumentCaptor, BDDMockito, Spy, Mocking Static & Final

Trong các bài kiểm thử đơn vị thông thường, lập trình viên chỉ cần dùng <code>@Mock</code> và <code>given(...)</code> để giả lập các phương thức cơ bản. Tuy nhiên, khi đối mặt với các nghiệp vụ phức tạp của môi trường Enterprise — như xác thực chữ ký điện tử HMAC, xử lý thời gian hệ thống, kiểm chứng thứ tự thực thi nghiêm ngặt của các sự kiện tài chính, hoặc bóc tách dữ liệu phức tạp truyền vào các hàm phụ thuộc — các kỹ thuật cơ bản hoàn toàn bất lực.

Bài học này sẽ đào sâu vào cơ chế nội tại của **Mockito 5**: can thiệp vào các phương thức tĩnh (**Static Mocking**), kỹ thuật **Partial Mocking với Spy**, bẫy thực thi ngầm của <code>when()</code> vs <code>doReturn()</code>, và kiểm chứng thứ tự tương tác với **InOrder**.

---

## 1. Cơ chế Ngầm của Mockito Spy & Static Mocking (Under the Hood)

### Sự khác biệt bản chất giữa Mock và Spy

~~~text
+-----------------------------------------------------------------------------------+
|                           MOCK vs SPY TRONG MOCKITO                               |
|                                                                                   |
|  +----------------------------------+  +---------------------------------------+  |
|  |           MOCK OBJECT            |  |              SPY OBJECT               |  |
|  |       (Mockito.mock(Class))      |  |          (Mockito.spy(instance))      |  |
|  +----------------------------------+  +---------------------------------------+  |
|  | - Là một "vỏ bọc rỗng"           |  | - Bọc ngoài một đối tượng THẬT        |  |
|  | - Mọi method mặc định trả về:    |  | - Mặc định: GỌI THẲNG METHOD THẬT     |  |
|  |   null, 0, false, empty list     |  |   và thực thi logic thật của class    |  |
|  | - Chỉ trả giá trị khi được stub  |  | - Chỉ ghi đè (stub) một vài method    |  |
|  |   hành vi cụ thể                 |  |   được chỉ định (Partial Mocking)     |  |
|  +----------------------------------+  +---------------------------------------+  |
+-----------------------------------------------------------------------------------+
~~~

### Bẫy Chết người: when(spy.method()) vs doReturn().when(spy).method()

Xem xét đoạn mã thường gặp của lập trình viên khi sử dụng <code>@Spy</code>:

~~~java
@Spy
private PaymentSignatureValidator validator = new PaymentSignatureValidator();

@Test
void dangerousSpyTest() {
    // TAI HỌA: when(spy.method()) SẼ GỌI VÀO PHƯƠNG THỨC THẬT TRƯỚC!
    when(validator.verifyHmacSignature(anyString(), anyString())).thenReturn(true);
}
~~~

**Điều gì thực sự diễn ra bên dưới JVM?**
1. Trước khi Mockito kịp thiết lập hành vi giả lập, biểu thức <code>validator.verifyHmacSignature(...)</code> được Java Compiler đánh giá và **thực thi ngay lập tức** trên đối tượng thật.
2. Nếu phương thức thật có chứa logic: truy cập mạng, kết nối phần cứng bảo mật HSM, hoặc thao tác trên một biến chưa được khởi tạo (null) -> Phương thức thật sẽ quăng lỗi <code>NullPointerException</code> hoặc làm chậm bài test ngay tại dòng khai báo <code>when()</code>!
3. **Quy tắc Bắt buộc**: Khi làm việc với <code>@Spy</code>, **LUÔN LUÔN dùng cú pháp <code>doReturn()</code>**:
   ~~~java
   // CHUẨN AN TOÀN: Không bao giờ kích hoạt phương thức thật
   doReturn(true).when(validator).verifyHmacSignature(anyString(), anyString());
   ~~~

### Cơ chế Can thiệp Static Methods: MockedStatic & ThreadLocal Registry

Trước phiên bản Mockito 3.4, việc mock các phương thức tĩnh như <code>Instant.now()</code> hay <code>UUID.randomUUID()</code> đòi hỏi các thư viện can thiệp classloader nặng nề như PowerMock (thường xuyên xung đột với JVM mới).

Từ Mockito 5, Mockito sử dụng cơ chế **Inline Bytecode Interception**:
- Khi phương thức tĩnh được mock thông qua <code>Mockito.mockStatic(TargetClass.class)</code>, Mockito đăng ký một Interceptor vào một bảng tra cứu cục bộ của luồng hiện tại (**ThreadLocal Registry**).
- Khi Thread hiện tại gọi phương thức tĩnh, ByteBuddy chuyển hướng lời gọi vào Interceptor để trả về giá trị giả lập.
- Các Thread khác trên JVM vẫn gọi vào phương thức tĩnh thật mà không hề bị ảnh hưởng!

~~~text
+-----------------------------------------------------------------------------------+
|                       MOCKED STATIC THREADLOCAL LIFECYCLE                         |
|                                                                                   |
|  try (MockedStatic<Instant> mockedInstant = mockStatic(Instant.class)) {          |
|       |                                                                           |
|       +--> 1. Đăng ký Mock Interceptor vào ThreadLocal Registry                   |
|       |                                                                           |
|       +--> 2. Instant.now() trong luồng này trả về mốc thời gian cố định:         |
|       |       "2026-10-03T10:00:00Z"                                              |
|       |                                                                           |
|       v                                                                           |
|  } // 3. RA KHỎI TRY-WITH-RESOURCES:                                              |
|       |                                                                           |
|       +--> TỰ ĐỘNG GỌI mockedInstant.close()                                      |
|       +--> Hủy bỏ đăng ký trong ThreadLocal Registry                              |
|       +--> Khôi phục Instant.now() trở lại đồng hồ hệ thống thật!                 |
+-----------------------------------------------------------------------------------+
~~~

:::danger BẮT BUỘC DÙNG TRY-WITH-RESOURCES CHO MOCKED STATIC
Nếu bạn không bọc <code>mockStatic()</code> trong khối <code>try-with-resources</code> hoặc quên gọi <code>mockedStatic.close()</code>:
Phương thức tĩnh đó sẽ bị "đóng băng" vĩnh viễn trên Thread hiện tại. Khi các bài kiểm thử tiếp theo được chạy trên cùng Thread đó (do Thread Pool của JUnit tái sử dụng), chúng sẽ nhận dữ liệu sai lệch hoặc quăng lỗi <code>MockitoException: For Instant, static mocking is already registered in the current thread</code>.
:::

---

## 2. Triển khai Production-Grade: Webhook Xử lý Callback Cổng Thanh toán

Chúng ta sẽ thiết kế một phân hệ xử lý Webhook thanh toán bảo mật: **PaymentWebhookHandler**, bao gồm:
1. Xác thực chữ ký số HMAC-SHA256 (sử dụng <code>@Spy</code>).
2. Kiểm tra tính hợp lệ của dấu thời gian (Timestamp) trong phạm vi 5 phút chống tấn công phát lại (Replay Attack) bằng <code>mockStatic(Instant.class)</code>.
3. Cập nhật trạng thái giao dịch vào cơ sở dữ liệu.
4. Bắn sự kiện viễn thám (Telemetry Audit) và kiểm chứng sâu bằng <code>ArgumentCaptor</code> (bắt nhiều lần gọi <code>getAllValues()</code>) và <code>InOrder</code> (ép buộc kiểm tra chữ ký trước khi ghi DB).

### 2.1. Mã nguồn Nghiệp vụ (Production Code)

~~~java
package com.bank.payment.webhook;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentWebhookPayload(
    String transactionId,
    BigDecimal amount,
    String currency,
    String status,
    long timestampSeconds,
    String signature
) {}
~~~

~~~java
package com.bank.payment.webhook;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

@Component
public class PaymentSignatureVerifier {

    public boolean verifyHmac(String payloadData, String signature, String secretKey) {
        try {
            Mac hmacSha256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            hmacSha256.init(keySpec);
            byte[] hash = hmacSha256.doFinal(payloadData.getBytes(StandardCharsets.UTF_8));
            String expectedSignature = HexFormat.of().formatHex(hash);
            return expectedSignature.equalsIgnoreCase(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
~~~

~~~java
package com.bank.payment.webhook;

public interface TransactionAuditPort {
    void recordAudit(String eventType, String txId, String details);
}
~~~

~~~java
package com.bank.payment.webhook;

public interface TransactionStoragePort {
    void updateTransactionStatus(String txId, String status);
}
~~~

~~~java
package com.bank.payment.webhook;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookHandler {

    private final PaymentSignatureVerifier signatureVerifier;
    private final TransactionStoragePort storagePort;
    private final TransactionAuditPort auditPort;

    private static final String SHARED_WEBHOOK_SECRET = "super-secret-bank-key";
    private static final long MAX_ALLOWED_SKEW_SECONDS = 300; // 5 phút

    public boolean handleWebhook(PaymentWebhookPayload payload) {
        log.info("Receiving payment webhook for txId={}", payload.transactionId());

        // 1. Kiểm tra chữ ký bảo mật HMAC
        String rawData = payload.transactionId() + "|" + payload.amount() + "|" + payload.timestampSeconds();
        boolean isValidSig = signatureVerifier.verifyHmac(rawData, payload.signature(), SHARED_WEBHOOK_SECRET);
        if (!isValidSig) {
            log.warn("Invalid signature detected for txId={}", payload.transactionId());
            auditPort.recordAudit("SECURITY_VIOLATION", payload.transactionId(), "Invalid HMAC signature");
            return false;
        }

        // 2. Kiểm tra Timestamp chống tấn công Replay Attack (5 phút)
        long currentSeconds = Instant.now().getEpochSecond();
        if (Math.abs(currentSeconds - payload.timestampSeconds()) > MAX_ALLOWED_SKEW_SECONDS) {
            log.warn("Timestamp expired or future-skewed for txId={}", payload.transactionId());
            auditPort.recordAudit("REPLAY_ATTACK_SUSPECT", payload.transactionId(), "Timestamp out of range");
            return false;
        }

        // 3. Cập nhật trạng thái thanh toán vào Database
        storagePort.updateTransactionStatus(payload.transactionId(), payload.status());

        // 4. Ghi nhận nhật ký thành công
        auditPort.recordAudit("WEBHOOK_PROCESSED", payload.transactionId(), "Status: " + payload.status());
        return true;
    }
}
~~~

---

### 2.2. Bộ Test Nâng cao với MockedStatic, Spy, InOrder & ArgumentCaptor

~~~java
package com.bank.payment.webhook;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentWebhookHandler Advanced Mockito Tests")
class PaymentWebhookHandlerTest {

    @Spy
    private PaymentSignatureVerifier signatureVerifier;

    @Mock
    private TransactionStoragePort storagePort;

    @Mock
    private TransactionAuditPort auditPort;

    @InjectMocks
    private PaymentWebhookHandler webhookHandler;

    @Captor
    private ArgumentCaptor<String> eventTypeCaptor;

    @Captor
    private ArgumentCaptor<String> txIdCaptor;

    @Captor
    private ArgumentCaptor<String> detailsCaptor;

    @Test
    @DisplayName("Should successfully process webhook when signature is valid and timestamp is fresh")
    void shouldProcessWebhookSuccessfully() {
        // Cố định mốc thời gian hệ thống: 2026-10-03T10:00:00Z (epoch = 1791021600)
        Instant fixedNow = Instant.parse("2026-10-03T10:00:00Z");
        long currentEpochSeconds = fixedNow.getEpochSecond();

        PaymentWebhookPayload payload = new PaymentWebhookPayload(
            "TX-BANK-8888",
            new BigDecimal("1200.00"),
            "USD",
            "SUCCESS",
            currentEpochSeconds - 60, // Gửi cách đây 1 phút (hợp lệ)
            "valid_mock_signature"
        );

        // Kỹ thuật 1: MockedStatic Instant.now() trong try-with-resources
        try (MockedStatic<Instant> mockedInstant = mockStatic(Instant.class)) {
            mockedInstant.when(Instant::now).thenReturn(fixedNow);

            // Kỹ thuật 2: doReturn trên @Spy để không gọi vào phương thức crypto thật
            doReturn(true).when(signatureVerifier).verifyHmac(anyString(), eq("valid_mock_signature"), anyString());

            // When
            boolean result = webhookHandler.handleWebhook(payload);

            // Then
            assertThat(result).isTrue();

            // Kỹ thuật 3: InOrder - Kiểm chứng tuần tự các bước bắt buộc
            InOrder inOrderVerifier = inOrder(signatureVerifier, storagePort, auditPort);
            inOrderVerifier.verify(signatureVerifier).verifyHmac(anyString(), eq("valid_mock_signature"), anyString());
            inOrderVerifier.verify(storagePort).updateTransactionStatus("TX-BANK-8888", "SUCCESS");
            inOrderVerifier.verify(auditPort).recordAudit("WEBHOOK_PROCESSED", "TX-BANK-8888", "Status: SUCCESS");
        }
    }

    @Test
    @DisplayName("Should reject webhook and record security audit when HMAC signature fails")
    void shouldRejectWhenSignatureIsInvalid() {
        PaymentWebhookPayload payload = new PaymentWebhookPayload(
            "TX-FRAUD-001",
            new BigDecimal("50000.00"),
            "USD",
            "SUCCESS",
            Instant.now().getEpochSecond(),
            "forged_hacker_sig"
        );

        doReturn(false).when(signatureVerifier).verifyHmac(anyString(), eq("forged_hacker_sig"), anyString());

        boolean result = webhookHandler.handleWebhook(payload);

        assertThat(result).isFalse();

        // Kiểm chứng KHÔNG ĐƯỢC cập nhật trạng thái vào DB
        then(storagePort).shouldHaveNoInteractions();

        // Kiểm tra audit vi phạm bảo mật
        then(auditPort).should(times(1)).recordAudit(
            "SECURITY_VIOLATION",
            "TX-FRAUD-001",
            "Invalid HMAC signature"
        );
    }

    @Test
    @DisplayName("Should reject webhook when timestamp exceeds 5 minutes skew (Replay Attack)")
    void shouldRejectWhenTimestampSkewIsTooLarge() {
        Instant fixedNow = Instant.parse("2026-10-03T10:00:00Z");
        long currentEpoch = fixedNow.getEpochSecond();

        PaymentWebhookPayload oldPayload = new PaymentWebhookPayload(
            "TX-REPLAY-999",
            new BigDecimal("200.00"),
            "USD",
            "SUCCESS",
            currentEpoch - 600, // Gửi cách đây 10 phút (> 5 phút max skew)
            "valid_sig"
        );

        try (MockedStatic<Instant> mockedInstant = mockStatic(Instant.class)) {
            mockedInstant.when(Instant::now).thenReturn(fixedNow);
            doReturn(true).when(signatureVerifier).verifyHmac(anyString(), anyString(), anyString());

            boolean result = webhookHandler.handleWebhook(oldPayload);

            assertThat(result).isFalse();
            then(storagePort).shouldHaveNoInteractions();

            then(auditPort).should(times(1)).recordAudit(
                "REPLAY_ATTACK_SUSPECT",
                "TX-REPLAY-999",
                "Timestamp out of range"
            );
        }
    }
}
~~~

---

## 3. Kiểm chứng Nâng cao với ArgumentCaptor bóc tách Danh sách (Multi-Values Captor)

Khi một phương thức được gọi nhiều lần trong một vòng lặp, việc sử dụng <code>captor.getValue()</code> sẽ chỉ lấy được giá trị của **lần gọi cuối cùng**.

Để kiểm tra toàn bộ các giá trị đã truyền vào, ta sử dụng <code>captor.getAllValues()</code>:

~~~java
@Test
@DisplayName("Should capture all multiple audit events emitted sequentially")
void shouldCaptureMultipleAuditEvents() {
    auditPort.recordAudit("STEP_1", "TX-1", "Initialized");
    auditPort.recordAudit("STEP_2", "TX-1", "Validated");
    auditPort.recordAudit("STEP_3", "TX-1", "Completed");

    ArgumentCaptor<String> stepCaptor = ArgumentCaptor.forClass(String.class);
    then(auditPort).should(times(3)).recordAudit(stepCaptor.capture(), eq("TX-1"), anyString());

    // Trích xuất toàn bộ danh sách
    List<String> capturedSteps = stepCaptor.getAllValues();
    assertThat(capturedSteps)
        .containsExactly("STEP_1", "STEP_2", "STEP_3");
}
~~~

---

## 4. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Rò rỉ MockedStatic làm tê liệt toàn bộ Test Suite

- **Triệu chứng**: Khi chạy từng bài test riêng lẻ trong IntelliJ IDEA thì tất cả đều pass. Nhưng khi chạy <code>./mvnw test</code> trên CI, các bài test khác không liên quan đột ngột văng lỗi <code>JWT verification failed</code> hoặc <code>Cannot mock static method</code>.
- **Nguyên nhân cốt lõi**:
  Một kỹ sư viết code mock phương thức tĩnh mà không đóng đối tượng:
  ~~~java
  @Test
  void leakyStaticTest() {
      MockedStatic<Instant> mock = mockStatic(Instant.class);
      mock.when(Instant::now).thenReturn(fixedTime);
      // Kết thúc test mà KHÔNG gọi mock.close()!
  }
  ~~~
  Thư viện JWT Parser ở bài test tiếp theo gọi <code>Instant.now()</code> để kiểm tra hạn sử dụng (Expiration Time) của Token. Vì <code>Instant.now()</code> vẫn bị neo cứng vào mốc thời gian giả lập từ bài test trước, JWT Parser kết luận Token đã hết hạn và quăng lỗi xác thực!
- **Giải pháp**: Bắt buộc sử dụng cấu trúc <code>try (MockedStatic&lt;...&gt; m = mockStatic(...))</code>.

### Post-mortem 2: ClassCastException do Type Erasure với Generic ArgumentCaptor

- **Triệu chứng**: Sử dụng <code>ArgumentCaptor.forClass(List.class)</code> để chụp danh sách <code>List&lt;Transaction&gt;</code> gây lỗi <code>ClassCastException</code> khi ép kiểu ở runtime.
- **Giải pháp**: Khai báo bằng annotation <code>@Captor</code> ở cấp độ thuộc tính lớp:
  ~~~java
  @Captor
  private ArgumentCaptor<List<Transaction>> transactionListCaptor;
  ~~~
  MockitoExtension sẽ tự động phân tích Generic Type Metadata và khởi tạo Captor an toàn với Type-Safety.

---

## 5. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Trung tâm Thông báo Đa kênh (Multi-Channel Notification Dispatcher) cần kiểm thử đơn vị cho <code>NotificationDispatcherService</code>:
1. Gửi thông báo đến người dùng:
   - Ưu tiên 1: Gửi qua Push Notification (<code>PushClientPort</code>).
   - Nếu Push thất bại (quăng ngoại lệ <code>PushDeliveryException</code>): Tự động chuyển hướng (Fallback) gửi qua SMS (<code>SmsClientPort</code>).
   - Nếu cả 2 đều thất bại: Gửi cảnh báo khẩn cấp tới <code>DeadLetterAuditPort</code>.
2. Kiểm chứng bằng Mockito:
   - Sử dụng <code>InOrder</code> để đảm bảo hệ thống CHỈ gọi SMS SAU KHI Push đã thất bại.
   - Sử dụng <code>ArgumentCaptor</code> để kiểm tra nội dung tin nhắn SMS có được định dạng đúng số điện thoại và nội dung không.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.notification.service;

public interface PushClientPort {
    void sendPush(String userDeviceToken, String message);
}
~~~

~~~java
package com.bank.notification.service;

public interface SmsClientPort {
    void sendSms(String phoneNumber, String message);
}
~~~

~~~java
package com.bank.notification.service;

public interface NotificationAuditPort {
    void recordFailure(String userId, String channel, String errorMessage);
}
~~~

~~~java
package com.bank.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationDispatcherService {

    private final PushClientPort pushClient;
    private final SmsClientPort smsClient;
    private final NotificationAuditPort auditPort;

    public void dispatchAlert(String userId, String deviceToken, String phone, String alertContent) {
        try {
            pushClient.sendPush(deviceToken, alertContent);
            log.info("Push notification delivered successfully to user={}", userId);
        } catch (Exception pushEx) {
            log.warn("Push delivery failed for user={}, initiating SMS fallback", userId, pushEx);
            auditPort.recordFailure(userId, "PUSH", pushEx.getMessage());

            try {
                smsClient.sendSms(phone, alertContent);
                log.info("Fallback SMS delivered successfully to user={}", userId);
            } catch (Exception smsEx) {
                log.error("Both Push and SMS failed for user={}", userId, smsEx);
                auditPort.recordFailure(userId, "SMS", smsEx.getMessage());
            }
        }
    }
}
~~~

~~~java
package com.bank.notification.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.then;
import static org.mockito.BDDMockito.willThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationDispatcherService Fallback Tests")
class NotificationDispatcherServiceTest {

    @Mock
    private PushClientPort pushClient;

    @Mock
    private SmsClientPort smsClient;

    @Mock
    private NotificationAuditPort auditPort;

    @InjectMocks
    private NotificationDispatcherService dispatcherService;

    @Captor
    private ArgumentCaptor<String> phoneCaptor;

    @Captor
    private ArgumentCaptor<String> messageCaptor;

    @Test
    @DisplayName("Should successfully fallback to SMS in strict order when Push notification fails")
    void shouldFallbackToSmsWhenPushFails() {
        // Given: Giả lập Push bị lỗi mạng
        willThrow(new RuntimeException("APNS Connection Timeout"))
            .given(pushClient).sendPush("DEVICE-TOKEN-99", "Security Alert: New Login");

        // When
        dispatcherService.dispatchAlert("USER-001", "DEVICE-TOKEN-99", "+84901234567", "Security Alert: New Login");

        // Then: InOrder kiểm chứng tuần tự Push fail -> Audit Push fail -> Gửi SMS
        InOrder inOrder = inOrder(pushClient, auditPort, smsClient);
        inOrder.verify(pushClient).sendPush("DEVICE-TOKEN-99", "Security Alert: New Login");
        inOrder.verify(auditPort).recordFailure("USER-001", "PUSH", "APNS Connection Timeout");
        inOrder.verify(smsClient).sendSms(phoneCaptor.capture(), messageCaptor.capture());

        assertThat(phoneCaptor.getValue()).isEqualTo("+84901234567");
        assertThat(messageCaptor.getValue()).isEqualTo("Security Alert: New Login");
    }

    @Test
    @DisplayName("Should record multiple audit failures when both Push and SMS fail")
    void shouldRecordBothFailuresWhenAllChannelsFail() {
        willThrow(new RuntimeException("Push Gateway Down")).given(pushClient).sendPush(anyString(), anyString());
        willThrow(new RuntimeException("SMS Gateway Timeout")).given(smsClient).sendSms(anyString(), anyString());

        dispatcherService.dispatchAlert("USER-002", "DEV-TOKEN", "+84999999999", "Urgent Alert");

        ArgumentCaptor<String> channelCaptor = ArgumentCaptor.forClass(String.class);
        then(auditPort).should(times(2)).recordFailure(eq("USER-002"), channelCaptor.capture(), anyString());

        assertThat(channelCaptor.getAllValues()).containsExactly("PUSH", "SMS");
    }
}
~~~

:::takeaways
- **Bản chất của @Spy**: Bọc một instance thật và thực thi logic thật trừ khi được stub. Luôn sử dụng <code>doReturn().when(spy).method()</code> thay vì <code>when()</code> để tránh gọi nhầm phương thức thật.
- **An toàn Tuyệt đối với MockedStatic**: Sử dụng <code>try-with-resources</code> để tự động giải phóng can thiệp bytecode của phương thức tĩnh, ngăn chặn rò rỉ trạng thái sang các bài kiểm thử khác trong cùng JVM Thread.
- **Kiểm chứng Tuần tự với InOrder**: Sử dụng <code>InOrder</code> để khẳng định các rào chắn bảo mật hoặc xác thực chữ ký số bắt buộc phải diễn ra trước khi ghi dữ liệu xuống cơ sở dữ liệu.
- **ArgumentCaptor Đa giá trị**: Dùng <code>captor.getAllValues()</code> để kiểm tra toàn vẹn danh sách các tham số trong các kịch bản gọi lặp lại.
- **Tránh Lạm dụng Spy**: Trong thiết kế hướng đối tượng tốt, nếu bạn phải spy quá nhiều phương thức trong một class, đó là dấu hiệu (Code Smell) của việc vi phạm Single Responsibility Principle (SRP). Hãy cân nhắc tách nhỏ class đó ra!
:::
`
    },
    {
      id: "4-4",
      type: "lesson",
      title: "Test Async, Security & Kafka — những mảnh ghép khó",
      minutes: 50,
      content: `
## Test Async, Security & Kafka — Những Mảnh Ghép Khó Trong Kiểm Thử Doanh Nghiệp

Trong các ứng dụng doanh nghiệp hiện đại, hơn một nửa logic quan trọng không chạy tuần tự trên luồng HTTP Request thông thường. Thay vào đó, chúng diễn ra bất đồng bộ: các tác vụ xử lý nền (<code>@Async</code>), sự kiện trong JVM (<code>ApplicationEvent</code>), phân quyền người dùng phức tạp (<code>@PreAuthorize</code>, JWT OAuth2), và các dòng thông điệp phân tán qua **Apache Kafka**.

Kiểm thử các hệ thống này là thách thức lớn đối với nhiều kỹ sư: bài test chạy chập chờn (Flaky Tests — lúc xanh lúc đỏ), dùng <code>Thread.sleep()</code> làm chậm cả pipeline CI/CD, hoặc không thể tái hiện các lỗi tranh chấp luồng (Race Conditions).

Bài học này sẽ trang bị cho bạn các vũ khí tối thượng: thư viện thăm dò điều kiện **Awaitility**, kỹ thuật kiểm thử phân quyền **Spring Security Test**, và kiểm thử tích hợp Apache Kafka thật bằng **Testcontainers Kafka**.

---

## 1. Cơ chế Ngầm của Asynchronous Testing & Awaitility (Under the Hood)

### Cái chết thầm lặng của Thread.sleep()

Xem xét đoạn mã thường gặp của lập trình viên khi kiểm thử một tác vụ bất đồng bộ:

~~~java
// PHẢN MẪU TỒI TỆ (ANTI-PATTERN):
emailNotificationService.sendWelcomeEmailAsync(userId);
Thread.sleep(3000); // Ngủ 3 giây chờ email gửi xong...
assertThat(mailServer.getSentEmails()).hasSize(1);
~~~

**3 lý do khiến <code>Thread.sleep()</code> là kẻ thù số 1 của DevOps:**
1. **Lãng phí thời gian CI/CD**: Nếu tác vụ chỉ mất 50ms để hoàn thành, việc ngủ 3000ms đã lãng phí 2950ms. Nhân lên 500 bài test bất đồng bộ, pipeline của bạn bị kéo dài thêm 25 phút vô ích!
2. **Flaky Tests**: Trên máy local cấu hình mạnh, 3 giây là đủ. Nhưng trên máy chủ CI/CD (như GitHub Actions hoặc Jenkins) khi CPU bị nghẽn tải, tác vụ có thể mất 3.1 giây để hoàn thành. Bài test lập tức bị ĐỎ một cách ngẫu nhiên.
3. **Không có cơ chế Fail-Fast**: Nếu code bị lỗi quăng ngoại lệ ngay tại mili-giây thứ 10, bài test vẫn "ngu ngơ" ngủ tiếp cho hết 3 giây rồi mới báo lỗi.

### Cơ chế Thăm dò Thông minh của Awaitility

Thư viện **Awaitility** loại bỏ hoàn toàn <code>Thread.sleep()</code> bằng cơ chế thăm dò trạng thái (Condition Polling) với chu kỳ kiểm tra linh hoạt:

~~~text
+-----------------------------------------------------------------------------------+
|                        AWAITILITY CONDITION POLLING FLOW                          |
|                                                                                   |
|  Kích hoạt Async Job (Luồng Worker chạy ngầm)                                     |
|       |                                                                           |
|       v                                                                           |
|  [Awaitility Poller]                                                              |
|       |                                                                           |
|       +---> Kiểm tra điều kiện lần 1 (sau 50ms): Chưa thỏa mãn -> Chờ 100ms       |
|       +---> Kiểm tra điều kiện lần 2 (sau 150ms): Chưa thỏa mãn -> Chờ 100ms      |
|       +---> Kiểm tra điều kiện lần 3 (sau 250ms): THỎA MÃN (Condition Met)!       |
|       |                                                                           |
|       v                                                                           |
|  THOÁT NGAY LẬP TỨC tại mốc 250ms! Tiết kiệm 2.75 giây!                           |
|  (Nếu sau thời gian timeout tối đa, ví dụ: 5s, điều kiện vẫn không thỏa mãn       |
|   -> Quăng lỗi ConditionTimeoutException kèm chi tiết assertion rõ ràng).         |
+-----------------------------------------------------------------------------------+
~~~

---

## 2. Spring Security Test: Kiểm thử Phân quyền & JWT Token

Spring Security cung cấp module chuyên dụng <code>spring-security-test</code> để giả lập danh tính người dùng mà không cần phải thực hiện đăng nhập HTTP thật:
- <code>@WithMockUser(username = "admin", roles = {"ADMIN"})</code>: Giả lập nhanh một User với Role tương ứng trong <code>SecurityContext</code>.
- <code>SecurityMockMvcRequestPostProcessors.jwt()</code>: Giả lập một JWT Token thực thụ với các Claims tùy biến (ví dụ: <code>sub</code>, <code>scope</code>, <code>email</code>, <code>tenant_id</code>) để kiểm thử Resource Server OAuth2.

---

## 3. Testcontainers Kafka vs EmbeddedKafka

Trước đây, lập trình viên thường dùng <code>@EmbeddedKafka</code> (chạy broker Kafka trong cùng tiến trình JVM). Tuy nhiên:
- Embedded Kafka tiêu tốn bộ nhớ JVM rất lớn và thường xuyên gặp lỗi không giải phóng cổng hoặc lỗi tắt KRaft/Zookeeper giữa các bài test.
- Không thể kiểm thử chính xác hành vi mạng (Network Partition), tự động tạo Topic, hay cơ chế Consumer Rebalancing.

**Chuẩn Công nghiệp hiện nay**: Sử dụng **Testcontainers Kafka** (<code>org.testcontainers.kafka.KafkaContainer</code> hoặc Confluent Container) để chạy một Broker Kafka thực thụ trên Docker.

~~~text
+-----------------------------------------------------------------------------------+
|                       TESTCONTAINERS KAFKA TESTING ARCHITECTURE                   |
|                                                                                   |
|  JUnit Test Process                                                               |
|       |                                                                           |
|       +---> Khởi chạy Docker Container "confluentinc/cp-kafka:7.6.1"              |
|       |     (Ánh xạ cổng Broker động ra Host, ví dụ: localhost:55032)             |
|       |                                                                           |
|       v                                                                           |
|  [@DynamicPropertySource]                                                         |
|       |                                                                           |
|       +---> spring.kafka.bootstrap-servers = localhost:55032                      |
|       |                                                                           |
|       v                                                                           |
|  [KafkaTemplate] ---> Bắn TransactionEvent vào Topic "fraud-alerts"               |
|       |                                                                           |
|       v                                                                           |
|  [KafkaContainer Broker (Docker)]                                                 |
|       |                                                                           |
|       v                                                                           |
|  [@KafkaListener Consumer] ---> Xử lý cảnh báo gian lận & lưu Database           |
|       |                                                                           |
|       v                                                                           |
|  [Awaitility.await()] ---> Thăm dò Database xem bản ghi cảnh báo đã xuất hiện chưa|
+-----------------------------------------------------------------------------------+
~~~

---

## 4. Triển khai Production-Grade: Hệ thống Giám sát & Báo động Gian lận Tài chính

Chúng ta sẽ thiết kế phân hệ **Cảnh báo Gian lận Bất đồng bộ (Async Fraud Alert Subsystem)** bao gồm:
1. <code>FraudEventConsumer</code>: Lắng nghe thông điệp giao dịch từ Apache Kafka, lọc các giao dịch đáng ngờ và ghi nhận vào cơ sở dữ liệu.
2. <code>FraudReportController</code>: REST API được bảo mật bằng Spring Security, chỉ cho phép User có quyền <code>ROLE_COMPLIANCE_OFFICER</code> truy xuất báo cáo.
3. Bộ Integration Test toàn diện kết hợp: Testcontainers Kafka, MockMvc Security JWT, và Awaitility.

### 4.1. File cấu hình Dependencies (pom.xml)

~~~xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- Testing Dependencies -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.awaitility</groupId>
        <artifactId>awaitility</artifactId>
        <version>4.2.2</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>kafka</artifactId>
        <version>1.20.1</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
~~~

### 4.2. Mã nguồn Nghiệp vụ Sản xuất (Production Code)

~~~java
package com.bank.fraud.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "fraud_alerts")
@Getter
@Setter
@NoArgsConstructor
public class FraudAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_id", nullable = false, length = 64)
    private String transactionId;

    @Column(name = "account_number", nullable = false, length = 32)
    private String accountNumber;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt = Instant.now();

    public FraudAlert(String transactionId, String accountNumber, BigDecimal amount, String reason) {
        this.transactionId = transactionId;
        this.accountNumber = accountNumber;
        this.amount = amount;
        this.reason = reason;
    }
}
~~~

~~~java
package com.bank.fraud.consumer;

import com.bank.fraud.domain.FraudAlert;
import com.bank.fraud.repository.FraudAlertRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class FraudAlertConsumer {

    private final FraudAlertRepository fraudAlertRepository;
    private final ObjectMapper objectMapper;

    private static final BigDecimal SUSPICIOUS_CEILING = new BigDecimal("100000.00");

    @KafkaListener(topics = "bank-transactions", groupId = "fraud-detection-engine")
    public void consumeTransactionEvent(String messagePayload, Acknowledgment ack) {
        try {
            TransactionMessage event = objectMapper.readValue(messagePayload, TransactionMessage.class);
            log.info("Processing transaction event for fraud check: txId={}", event.transactionId());

            if (event.amount().compareTo(SUSPICIOUS_CEILING) >= 0) {
                FraudAlert alert = new FraudAlert(
                    event.transactionId(),
                    event.accountNumber(),
                    event.amount(),
                    "Amount exceeds 100,000 USD risk ceiling"
                );
                fraudAlertRepository.save(alert);
                log.warn("FRAUD ALERT CREATED for txId={}, amount={}", event.transactionId(), event.amount());
            }

            ack.acknowledge();
        } catch (Exception e) {
            log.error("Failed to process transaction message: {}", messagePayload, e);
        }
    }

    public record TransactionMessage(
        String transactionId,
        String accountNumber,
        BigDecimal amount,
        String currency
    ) {}
}
~~~

~~~java
package com.bank.fraud.controller;

import com.bank.fraud.domain.FraudAlert;
import com.bank.fraud.repository.FraudAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/fraud-alerts")
@RequiredArgsConstructor
public class FraudReportController {

    private final FraudAlertRepository repository;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_COMPLIANCE_OFFICER')")
    public ResponseEntity<List<FraudAlert>> listAllAlerts() {
        return ResponseEntity.ok(repository.findAll());
    }
}
~~~

---

### 4.3. Bộ Integration Test Đỉnh cao: Testcontainers Kafka + Awaitility + Security MockMvc

~~~java
package com.bank.fraud;

import com.bank.fraud.consumer.FraudAlertConsumer.TransactionMessage;
import com.bank.fraud.domain.FraudAlert;
import com.bank.fraud.repository.FraudAlertRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Testcontainers
@DisplayName("Fraud Detection End-to-End Async & Security Integration Tests")
class FraudDetectionIntegrationTest {

    @Container
    private static final KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.6.1")
    );

    @DynamicPropertySource
    static void configureKafkaProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.kafka.consumer.auto-offset-reset", () -> "earliest");
        registry.add("spring.kafka.listener.ack-mode", () -> "manual_immediate");
    }

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    @Autowired
    private FraudAlertRepository alertRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("End-to-End: Publish message to Kafka -> Async Consumer saves FraudAlert -> Verify via Awaitility")
    void shouldProcessFraudulentTransactionAsynchronously() throws Exception {
        // Given: Chuẩn bị giao dịch khả nghi 250,000 USD (vượt ngưỡng 100k)
        TransactionMessage suspiciousTx = new TransactionMessage(
            "TX-FRAUD-9999",
            "ACC-VIOLATOR-01",
            new BigDecimal("250000.00"),
            "USD"
        );

        String payloadJson = objectMapper.writeValueAsString(suspiciousTx);

        // When: Bắn thông điệp vào Kafka Broker thật trên Docker
        kafkaTemplate.send("bank-transactions", "TX-FRAUD-9999", payloadJson);

        // Then: Sử dụng Awaitility để thăm dò kết quả ghi vào Database bất đồng bộ
        await()
            .atMost(Duration.ofSeconds(10))           // Chờ tối đa 10s
            .pollInterval(Duration.ofMillis(200))     // Thăm dò mỗi 200ms
            .untilAsserted(() -> {
                List<FraudAlert> alerts = alertRepository.findAll();
                assertThat(alerts)
                    .isNotEmpty()
                    .anySatisfy(alert -> {
                        assertThat(alert.getTransactionId()).isEqualTo("TX-FRAUD-9999");
                        assertThat(alert.getAmount()).isEqualByComparingTo(new BigDecimal("250000.00"));
                        assertThat(alert.getReason()).contains("exceeds 100,000 USD");
                    });
            });
    }

    @Test
    @WithMockUser(username = "compliance_officer", authorities = {"ROLE_COMPLIANCE_OFFICER"})
    @DisplayName("Security: Compliance Officer should be allowed to access /api/v1/fraud-alerts (200 OK)")
    void shouldAllowComplianceOfficerToAccessAlerts() throws Exception {
        mockMvc.perform(get("/api/v1/fraud-alerts")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "regular_teller", authorities = {"ROLE_TELLER"})
    @DisplayName("Security: Teller should be forbidden from accessing fraud reports (403 Forbidden)")
    void shouldForbidUnauthorizedUsersFromAccessingAlerts() throws Exception {
        mockMvc.perform(get("/api/v1/fraud-alerts")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Unauthenticated request should be rejected (401 Unauthorized)")
    void shouldRejectAnonymousRequests() throws Exception {
        mockMvc.perform(get("/api/v1/fraud-alerts")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());
    }
}
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: Flaky Test do Kafka Rebalance Delay

- **Triệu chứng**: Bài test Kafka thỉnh thoảng bị timeout tại dòng <code>await()</code> khi chạy trên CI, mặc dù message đã được gửi đi thành công.
- **Nguyên nhân cốt lõi**:
  Khi Spring Kafka Consumer vừa khởi động, Kafka Coordinator cần một khoảng thời gian (khoảng 1 - 3 giây) để gán Partition cho Consumer Group (Group Rebalance Phase). Nếu bài test bắn message vào đúng khoảnh khắc Consumer chưa sẵn sàng và cấu hình <code>auto-offset-reset = latest</code> (mặc định), Consumer sẽ bỏ qua message đó và không bao giờ đọc được!
- **Giải pháp**:
  Trong môi trường test, luôn luôn ép cấu hình:
  ~~~properties
  spring.kafka.consumer.auto-offset-reset=earliest
  ~~~
  Điều này đảm bảo khi Consumer hoàn tất việc kết nối, nó sẽ tua lại từ đầu Topic để đọc đầy đủ các message đã bắn trước đó.

### Post-mortem 2: Tác vụ @Async nuốt ngoại lệ âm thầm (Silent Exception Swallowing)

- **Triệu chứng**: Một service được đánh dấu <code>@Async</code> bị văng <code>NullPointerException</code> ở bên trong. Tuy nhiên bài test vẫn pass và không có bất kỳ log lỗi nào xuất hiện trên console.
- **Nguyên nhân cốt lõi**:
  Mặc định, phương thức <code>@Async public void doWork()</code> không trả về <code>Future</code> hay <code>CompletableFuture</code>. Khi ngoại lệ xảy ra trên luồng phụ, <code>SimpleAsyncTaskExecutor</code> chỉ in log debug mờ nhạt và luồng chính của bài test không hề hay biết.
- **Khắc phục**: Luôn cấu hình <code>AsyncUncaughtExceptionHandler</code> hoặc trả về <code>CompletableFuture&lt;T&gt;</code> cho các tác vụ quan trọng.

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Webhook Delivery cần kiểm thử tính năng **Tự động Thử lại và Đẩy vào Dead Letter Queue (DLQ)**:
1. Khi gửi Webhook đến đối tác thất bại 3 lần liên tiếp:
   - Dịch vụ phải bắn thông điệp lỗi vào Kafka Topic <code>webhook-dlq-events</code>.
2. Viết bài kiểm thử sử dụng Testcontainers Kafka và Awaitility:
   - Kích hoạt gửi webhook đến một URL giả định bị lỗi mạng.
   - Thăm dò Topic DLQ để kiểm chứng thông điệp sự cố đã được bắn vào đúng cấu trúc và chứa nguyên nhân thất bại.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.webhook.domain;

public record WebhookDlqMessage(
    String deliveryId,
    String targetUrl,
    int retryCount,
    String finalError
) {}
~~~

~~~java
package com.bank.webhook.service;

import com.bank.webhook.domain.WebhookDlqMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebhookDeliveryService {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void processFailedDelivery(String deliveryId, String targetUrl, int retries, String error) {
        log.warn("Webhook delivery {} failed after {} retries, routing to DLQ", deliveryId, retries);
        try {
            WebhookDlqMessage dlqMessage = new WebhookDlqMessage(deliveryId, targetUrl, retries, error);
            String json = objectMapper.writeValueAsString(dlqMessage);
            kafkaTemplate.send("webhook-dlq-events", deliveryId, json);
        } catch (Exception e) {
            log.error("Failed to route to DLQ topic", e);
        }
    }
}
~~~

~~~java
package com.bank.webhook.service;

import com.bank.webhook.domain.WebhookDlqMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.Collections;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@SpringBootTest
@Testcontainers
@DisplayName("Webhook DLQ Delivery Kafka Integration Tests")
class WebhookDeliveryServiceTest {

    @Container
    private static final KafkaContainer kafka = new KafkaContainer(
        DockerImageName.parse("confluentinc/cp-kafka:7.6.1")
    );

    @DynamicPropertySource
    static void configureKafka(DynamicPropertyRegistry registry) {
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }

    @Autowired
    private WebhookDeliveryService deliveryService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Should successfully produce DLQ message to Kafka topic when retries are exhausted")
    void shouldProduceDlqMessageToKafka() {
        // Khởi tạo Consumer độc lập để lắng nghe DLQ Topic
        Properties consumerProps = new Properties();
        consumerProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
        consumerProps.put(ConsumerConfig.GROUP_ID_CONFIG, "test-dlq-listener");
        consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());

        KafkaConsumer<String, String> testConsumer = new KafkaConsumer<>(consumerProps);
        testConsumer.subscribe(Collections.singletonList("webhook-dlq-events"));

        // When: Kích hoạt dịch vụ đẩy thông điệp lỗi
        deliveryService.processFailedDelivery("DELIV-777", "https://api.partner.com/webhook", 3, "HTTP 504 Gateway Timeout");

        // Then: Sử dụng Awaitility thăm dò Consumer xem đã nhận được DLQ record chưa
        AtomicReference<WebhookDlqMessage> receivedMessage = new AtomicReference<>();

        await()
            .atMost(Duration.ofSeconds(10))
            .pollInterval(Duration.ofMillis(300))
            .untilAsserted(() -> {
                var records = testConsumer.poll(Duration.ofMillis(200));
                for (ConsumerRecord<String, String> record : records) {
                    WebhookDlqMessage msg = objectMapper.readValue(record.value(), WebhookDlqMessage.class);
                    if ("DELIV-777".equals(msg.deliveryId())) {
                        receivedMessage.set(msg);
                        break;
                    }
                }
                assertThat(receivedMessage.get()).isNotNull();
                assertThat(receivedMessage.get().targetUrl()).isEqualTo("https://api.partner.com/webhook");
                assertThat(receivedMessage.get().retryCount()).isEqualTo(3);
                assertThat(receivedMessage.get().finalError()).contains("HTTP 504");
            });

        testConsumer.close();
    }
}
~~~

:::takeaways
- **Cấm Tuyệt đối Thread.sleep()**: Gây lãng phí thời gian và sinh ra Flaky Tests. Thay thế hoàn toàn bằng <code>Awaitility.await().untilAsserted(...)</code> với cơ chế Condition Polling thông minh.
- **Spring Security Test Giả lập Nhanh**: Dùng <code>@WithMockUser</code> để test phân quyền theo Role/Authority mà không cần thực hiện xác thực HTTP thật.
- **Testcontainers Kafka là Tiêu chuẩn**: Thay thế Embedded Kafka bằng Docker container Kafka thật để đảm bảo tính nhất quán tuyệt đối về hành vi Broker, Consumer Group và Deserialization.
- **Bắt buộc auto-offset-reset=earliest trong Test**: Tránh việc Consumer bị bỏ lỡ thông điệp gửi đi trong lúc Kafka Group Coordinator đang thực hiện Rebalance.
:::
`
    },
    {
      id: "4-5",
      type: "lesson",
      title: "Property-Based Testing với jqwik & ArchUnit — để máy tìm case lỗi giùm bạn",
      minutes: 45,
      content: `
## Architecture Testing với ArchUnit & Property-Based Testing với jqwik

Hầu hết các dự án phần mềm bắt đầu với một bản thiết kế kiến trúc hoàn hảo: phân tầng rõ ràng (Controller -> Service -> Repository), quy ước đặt tên chuẩn mực, và các lớp nghiệp vụ (Domain) không bị phụ thuộc vào hạ tầng. Tuy nhiên, sau 1 - 2 năm phát triển với hàng chục kỹ sư tham gia, kiến trúc dần bị xói mòn (Architectural Erosion): Service gọi ngược lên Controller, Controller gọi thẳng xuống Repository để "cho nhanh", hoặc các Entity bị rò rỉ bừa bãi ra ngoài REST API.

Đồng thời, các bài kiểm thử thông thường (Example-Based Testing) chỉ kiểm tra được các trường hợp mà lập trình viên có thể tưởng tượng ra. Những lỗi nghiêm trọng nhất thường ẩn náu tại các giá trị biên kỳ dị (Edge Cases) mà con người dễ dàng bỏ sót.

Bài học này sẽ trang bị cho bạn hai công cụ mang tính cách mạng: **ArchUnit** (biến quy tắc kiến trúc thành các bài Unit Test tự động chạy trong vài giây) và **jqwik** (Property-Based Testing — để máy tính tự động sinh hàng nghìn trường hợp ngẫu nhiên và tự động thu nhỏ lỗi về điểm mấu chốt).

---

## 1. Bản chất Kỹ thuật của ArchUnit: Kiểm thử Kiến trúc qua Bytecode (Under the Hood)

### Cơ chế Quét Bytecode của ArchUnit

ArchUnit không cần khởi động Spring Context. Thay vào đó, nó sử dụng thư viện **ASM** để đọc trực tiếp các file <code>.class</code> đã được biên dịch:

~~~text
+-----------------------------------------------------------------------------------+
|                        KIẾN TRÚC HOẠT ĐỘNG CỦA ARCHUNIT                           |
|                                                                                   |
|  Source Code (.java) ---> Maven Compiler ---> Target Bytecode (.class)            |
|                                                     |                             |
|                                                     v                             |
|  [ClassFileImporter] ---------------------> Phân tích AST, Imports, Annotations   |
|                                                     |                             |
|                                                     v                             |
|  [JavaClasses Model in RAM]                Đại diện hướng đối tượng của Bytecode: |
|                                            - Các Class, Interfaces                |
|                                            - Các Field, Methods, Constructors     |
|                                            - Lời gọi phương thức (Method Calls)   |
|                                                     |                             |
|                                                     v                             |
|  [ArchRule Evaluation Engine] <---------- Quy tắc kiến trúc (ArchRules)           |
|                                            (e.g., layeredArchitecture())          |
|                                                     |                             |
|                                                     v                             |
|  KẾT QUẢ: 100% Tuân thủ hoặc Báo lỗi chi tiết dòng vi phạm kèm tên Class!         |
+-----------------------------------------------------------------------------------+
~~~

### 4 Quy tắc Kiến trúc Vàng cần Khóa chặt:
1. **Phân tầng nghiêm ngặt (Layered Architecture)**: Controller CHỈ ĐƯỢC gọi Service, Service CHỈ ĐƯỢC gọi Repository. Không ai được gọi ngược chiều!
2. **Cấm Field Injection**: Tuyệt đối không dùng <code>@Autowired</code> trên thuộc tính lớp. Bắt buộc dùng Constructor Injection.
3. **Chống Rò rỉ Entity**: Các phương thức công khai của Controller không bao giờ được phép nhận vào hoặc trả về JPA Entity (phải dùng DTO/Record).
4. **Quy ước Đặt tên (Naming Conventions)**: Lớp nằm trong package <code>service</code> bắt buộc phải có hậu tố <code>Service</code>, nằm trong <code>repository</code> phải có hậu tố <code>Repository</code>.

---

## 2. Bản chất Property-Based Testing (PBT) với jqwik: Để Máy Tìm Lỗi

### Giới hạn của Kiểm thử dựa trên Ví dụ (Example-Based Testing)

Trong kiểm thử truyền thống, bạn nghĩ ra vài ví dụ:
~~~java
@Test
void testDiscount() {
    assertEquals(10.0, calculateDiscount(100.0, 10)); // Thử 100$ giảm 10%
    assertEquals(0.0, calculateDiscount(100.0, 0));   // Thử giảm 0%
}
~~~
Cách này chỉ chứng minh code chạy đúng với **2 con số cụ thể**. Nó không chứng minh code chạy đúng với: số âm, số 0, số cực lớn (<code>Double.MAX_VALUE</code>), số thực dấu phẩy động (<code>NaN</code>, <code>Infinity</code>).

### Triết lý Property-Based Testing (Khởi nguồn từ QuickCheck)

Thay vì kiểm tra từng con số, ta định nghĩa các **Bất biến (Invariants)** — những thuộc tính luôn luôn phải đúng trong mọi hoàn cảnh:
1. **Thuộc tính Giới hạn**: Số tiền sau giảm giá không bao giờ được nhỏ hơn 0 và không bao giờ được lớn hơn giá gốc.
2. **Thuộc tính Đơn điệu (Monotonicity)**: Phần trăm giảm giá càng cao thì số tiền cuối cùng phải càng nhỏ hoặc bằng.
3. **Thuộc tính Nghịch đảo (Inverse Property)**: Mã hóa một chuỗi rồi giải mã ngược lại phải thu được chuỗi nguyên bản.

~~~text
+-----------------------------------------------------------------------------------+
|                        JQWIK PROPERTY TESTING & SHRINKING                         |
|                                                                                   |
|  1. Data Generator (Arbitrary) ---> Sinh ngẫu nhiên 1,000 bộ dữ liệu đầu vào      |
|                                                                                   |
|  2. Invariant Assertion Check  ---> Kiểm tra quy tắc bất biến                     |
|                                                                                   |
|  3. Nếu gặp lỗi tại giá trị: amount = 14,892,103.45; discount = 150%              |
|     |                                                                             |
|     v                                                                             |
|  [SHRINKING ALGORITHM (Thu nhỏ mẫu lỗi)]                                          |
|     - jqwik tự động chia đôi, giảm dần giá trị đầu vào để tìm ra:                 |
|       GIÁ TRỊ NHỎ NHẤT VẪN GÂY RA LỖI (Minimal Counterexample)                   |
|     - Kết quả báo cáo lập trình viên:                                             |
|       "Failed with amount = 1.0, discount = 101%"                                |
|     ==> Giúp kỹ sư xác định ngay lập tức bug logic mà không cần mò mẫm!           |
+-----------------------------------------------------------------------------------+
~~~

---

## 3. Triển khai Production-Grade: Bộ Quy tắc ArchUnit Toàn diện

Chúng ta sẽ thiết kế một bộ kiểm thử kiến trúc hoàn chỉnh để bảo vệ cấu trúc mã nguồn của toàn bộ dự án Enterprise.

### 3.1. Cấu hình Maven (pom.xml)

~~~xml
<dependencies>
    <dependency>
        <groupId>com.tngtech.archunit</groupId>
        <artifactId>archunit-junit5</artifactId>
        <version>1.3.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>net.jqwik</groupId>
        <artifactId>jqwik</artifactId>
        <version>1.9.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
~~~

### 3.2. Lớp Kiểm thử Kiến trúc: EnterpriseArchitectureTest

~~~java
package com.bank.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.Entity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.fields;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.methods;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

@AnalyzeClasses(packages = "com.bank", importOptions = ImportOption.DoNotIncludeTests.class)
public class EnterpriseArchitectureTest {

    // Quy tắc 1: Kiến trúc phân tầng nghiêm ngặt (Strict Layering)
    @ArchTest
    public static final ArchRule layered_architecture_must_be_respected = layeredArchitecture()
        .consideringAllDependencies()
        .layer("Controller").definedBy("..controller..")
        .layer("Service").definedBy("..service..")
        .layer("Repository").definedBy("..repository..")
        .layer("Domain").definedBy("..domain..")

        .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller", "Service")
        .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service")
        .whereLayer("Domain").mayOnlyBeAccessedByLayers("Controller", "Service", "Repository");

    // Quy tắc 2: Cấm hoàn toàn Field Injection (@Autowired trên thuộc tính)
    @ArchTest
    public static final ArchRule no_field_injection_allowed = fields()
        .should().notBeAnnotatedWith(Autowired.class)
        .because("Constructor injection must be strictly used instead of @Autowired field injection");

    // Quy tắc 3: Controller không bao giờ được phép trực tiếp gọi Repository
    @ArchTest
    public static final ArchRule controllers_must_not_access_repositories = noClasses()
        .that().resideInAPackage("..controller..")
        .should().accessClassesThat().resideInAPackage("..repository..")
        .because("Controllers must delegate to Service layer instead of directly accessing Repositories");

    // Quy tắc 4: Không bao giờ trả JPA Entity trực tiếp ra Controller methods
    @ArchTest
    public static final ArchRule controllers_must_not_return_entities = methods()
        .that().areDeclaredInClassesThat().resideInAPackage("..controller..")
        .and().arePublic()
        .should().notHaveRawReturnType(resideInEntityPackage())
        .because("Controllers must return DTOs or Records, never expose JPA Entities directly to clients");

    // Quy tắc 5: Lớp trong package service phải có hậu tố 'Service' hoặc 'ServiceImpl'
    @ArchTest
    public static final ArchRule service_naming_convention = classes()
        .that().resideInAPackage("..service..")
        .and().areAnnotatedWith(Service.class)
        .should().haveSimpleNameEndingWith("Service")
        .orShould().haveSimpleNameEndingWith("ServiceImpl");

    private static com.tngtech.archunit.base.DescribedPredicate<com.tngtech.archunit.core.domain.JavaClass> resideInEntityPackage() {
        return new com.tngtech.archunit.base.DescribedPredicate<>("is an Entity") {
            @Override
            public boolean test(com.tngtech.archunit.core.domain.JavaClass javaClass) {
                return javaClass.isAnnotatedWith(Entity.class);
            }
        };
    }
}
~~~

---

## 4. Triển khai Production-Grade: Property-Based Testing với jqwik

Chúng ta sẽ thiết kế một bộ tính toán chiết khấu tài chính **FinancialDiscountEngine** và sử dụng jqwik để kiểm chứng các đặc tính toán học bất biến.

### 4.1. Mã nguồn Nghiệp vụ (Production Code)

~~~java
package com.bank.pricing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

public class FinancialDiscountEngine {

    /**
     * Tính toán giá sau chiết khấu.
     * @param originalPrice Giá gốc (phải lớn hơn hoặc bằng 0)
     * @param discountPercentage Tỉ lệ chiết khấu (từ 0.00 đến 100.00%)
     * @return Số tiền thực tế phải trả sau chiết khấu, làm tròn 2 chữ số thập phân
     */
    public BigDecimal calculateDiscountedPrice(BigDecimal originalPrice, BigDecimal discountPercentage) {
        Objects.requireNonNull(originalPrice, "Original price must not be null");
        Objects.requireNonNull(discountPercentage, "Discount percentage must not be null");

        if (originalPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Original price cannot be negative");
        }
        if (discountPercentage.compareTo(BigDecimal.ZERO) < 0 || discountPercentage.compareTo(new BigDecimal("100.00")) > 0) {
            throw new IllegalArgumentException("Discount percentage must be between 0 and 100");
        }

        BigDecimal discountMultiplier = discountPercentage.divide(new BigDecimal("100.00"), 6, RoundingMode.HALF_UP);
        BigDecimal discountAmount = originalPrice.multiply(discountMultiplier).setScale(2, RoundingMode.HALF_UP);

        BigDecimal finalPrice = originalPrice.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);

        // Đảm bảo không bị âm do làm tròn
        return finalPrice.max(BigDecimal.ZERO);
    }
}
~~~

---

### 4.2. Bộ Property-Based Test với jqwik: Kiểm chứng Bất biến Toàn diện

~~~java
package com.bank.pricing;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.Combinators;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import org.junit.jupiter.api.Assertions;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class FinancialDiscountEnginePropertyTest {

    private final FinancialDiscountEngine engine = new FinancialDiscountEngine();

    // Bất biến 1: Giá sau chiết khấu LUÔN LUÔN nằm trong khoảng [0, Giá gốc]
    @Property(tries = 1000)
    void discountedPriceMustAlwaysBeBetweenZeroAndOriginalPrice(
            @ForAll("validPrices") BigDecimal price,
            @ForAll("validPercentages") BigDecimal percentage) {

        BigDecimal discounted = engine.calculateDiscountedPrice(price, percentage);

        assertThat(discounted)
            .isGreaterThanOrEqualTo(BigDecimal.ZERO)
            .isLessThanOrEqualTo(price);
    }

    // Bất biến 2: Chiết khấu 0% giữ nguyên giá; Chiết khấu 100% trả về 0.00
    @Property(tries = 500)
    void boundaryDiscountPercentages(@ForAll("validPrices") BigDecimal price) {
        BigDecimal zeroDiscount = engine.calculateDiscountedPrice(price, BigDecimal.ZERO);
        assertThat(zeroDiscount).isEqualByComparingTo(price);

        BigDecimal fullDiscount = engine.calculateDiscountedPrice(price, new BigDecimal("100.00"));
        assertThat(fullDiscount).isEqualByComparingTo(BigDecimal.ZERO);
    }

    // Bất biến 3: Tính chất đơn điệu — Tỉ lệ chiết khấu cao hơn phải cho giá bằng hoặc thấp hơn
    @Property(tries = 1000)
    void higherDiscountYieldsLowerOrEqualPrice(
            @ForAll("validPrices") BigDecimal price,
            @ForAll("validPercentages") BigDecimal p1,
            @ForAll("validPercentages") BigDecimal p2) {

        BigDecimal minPercentage = p1.min(p2);
        BigDecimal maxPercentage = p1.max(p2);

        BigDecimal priceWithLowerDiscount = engine.calculateDiscountedPrice(price, minPercentage);
        BigDecimal priceWithHigherDiscount = engine.calculateDiscountedPrice(price, maxPercentage);

        assertThat(priceWithHigherDiscount)
            .isLessThanOrEqualTo(priceWithLowerDiscount);
    }

    // Generator cung cấp các mức giá hợp lệ từ 0.01 đến 10,000,000 USD
    @Provide
    Arbitrary<BigDecimal> validPrices() {
        return Arbitraries.bigDecimals()
            .between(new BigDecimal("0.01"), new BigDecimal("10000000.00"))
            .ofScale(2);
    }

    // Generator cung cấp phần trăm hợp lệ từ 0.00 đến 100.00%
    @Provide
    Arbitrary<BigDecimal> validPercentages() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.ZERO, new BigDecimal("100.00"))
            .ofScale(2);
    }
}
~~~

---

## 5. Production Pitfalls & Post-mortems Thực chiến

### Post-mortem 1: ArchUnit vạch trần Circular Dependency làm sập Production

- **Triệu chứng**: Dự án sau khi nâng cấp lên Spring Boot mới đột nhiên không thể khởi động với lỗi <code>BeanCurrentlyInCreationException: Requested bean is currently in creation: Is there an unresolvable circular reference?</code>.
- **Nguyên nhân cốt lõi**:
  Service A tiêm Service B qua Constructor, nhưng Service B lại tiêm ngược lại Service A. Ở các phiên bản Spring Boot cũ, cơ chế tiêm lỏng lẻo cho phép ứng dụng khởi động. Nhưng khi chuyển sang Spring Boot 3+, cơ chế cấm Circular References mặc định đã đánh sập toàn bộ hệ thống!
- **Phòng chống tận gốc bằng ArchUnit**:
  Bổ sung rule kiểm tra vòng lặp phụ thuộc ngay ở tầng Unit Test:
  ~~~java
  @ArchTest
  public static final ArchRule no_cycles_between_slices = SlicesRuleDefinition.slices()
      .matching("com.bank.(*)..")
      .should().beFreeOfCycles();
  ~~~
  Bất kỳ lập trình viên nào cố tình tạo liên kết vòng lặp chéo giữa các module, lệnh <code>mvn test</code> trên máy local sẽ lập tức báo lỗi ngay trong vòng 500ms trước khi kịp Commit lên Git!

### Post-mortem 2: jqwik vạch trần lỗi làm tròn số học (Floating-point Leaks)

- **Triệu chứng**: Trong một hệ thống bán lẻ lớn, sau đợt sale Black Friday, kế toán đối soát phát hiện thất thoát hàng chục triệu đồng do các giao dịch bị lệch 1 xu (0.01 USD).
- **Nguyên nhân cốt lõi**:
  Lập trình viên sử dụng kiểu dữ liệu nguyên thủy <code>double</code> thay vì <code>BigDecimal</code> trong thuật toán tính giá:
  ~~~java
  double finalPrice = originalPrice * (1.0 - discountPercent / 100.0);
  ~~~
  Với giá gốc <code>100.05</code> và giảm giá <code>10%</code>, phép toán số thực trả về <code>90.04500000000002</code> dẫn đến việc làm tròn sai lệch trên hàng triệu hóa đơn.
- **Sức mạnh của jqwik**: Khi chạy bài test PBT với 1,000 mẫu ngẫu nhiên, jqwik lập tức phát hiện ra lỗi bất biến và tự động thu nhỏ về con số tối thiểu <code>100.05</code> giúp đội ngũ kỹ sư sửa tận gốc sang <code>BigDecimal</code> với chế độ làm tròn <code>RoundingMode.HALF_UP</code>.

---

## 6. Hands-on Challenge & Lời giải Hoàn chỉnh 100%

### Đề bài Thách thức Kỹ sư
Hệ thống Ngân hàng Cốt lõi (Core Banking) cần kiểm thử tự động thuật toán **Tính Lãi Tiết kiệm Tích lũy (Compound Interest Calculator)**:
1. Công thức lãi kép: $A = P 	imes (1 + r/n)^{n 	imes t}$
   - $P$: Số tiền gốc ban đầu ($P ge 0$).
   - $r$: Lãi suất năm ($0 le r le 0.50$ tức tối đa 50%/năm).
   - $n$: Số kỳ tính lãi trong năm ($n in {1, 4, 12}$ tương ứng năm, quý, tháng).
   - $t$: Số năm gửi ($1 le t le 30$).
2. Viết bộ kiểm thử jqwik kiểm chứng các bất biến:
   - Tổng tiền nhận được $A$ luôn lớn hơn hoặc bằng tiền gốc $P$.
   - Khi lãi suất $r = 0$, tổng tiền $A$ đúng bằng số tiền gốc ban đầu $P$.
   - Kỳ ghép lãi càng dày (ví dụ: tháng so với năm) thì số tiền lãi thu được phải càng lớn hơn hoặc bằng.

---

### Lời giải Mẫu Hoàn chỉnh (100% Compilable Enterprise Code)

~~~java
package com.bank.interest;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.Objects;

public class CompoundInterestCalculator {

    private static final MathContext MC = new MathContext(10, RoundingMode.HALF_UP);

    public BigDecimal calculateCompoundInterest(BigDecimal principal, BigDecimal annualRate, int frequencyPerYear, int years) {
        Objects.requireNonNull(principal, "Principal cannot be null");
        Objects.requireNonNull(annualRate, "Annual rate cannot be null");

        if (principal.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Principal cannot be negative");
        }
        if (annualRate.compareTo(BigDecimal.ZERO) < 0 || annualRate.compareTo(new BigDecimal("0.50")) > 0) {
            throw new IllegalArgumentException("Annual rate must be between 0 and 0.50 (50%)");
        }
        if (frequencyPerYear <= 0 || years <= 0) {
            throw new IllegalArgumentException("Frequency and years must be positive integers");
        }

        // ratePerPeriod = r / n
        BigDecimal ratePerPeriod = annualRate.divide(BigDecimal.valueOf(frequencyPerYear), MC);

        // base = 1 + ratePerPeriod
        BigDecimal base = BigDecimal.ONE.add(ratePerPeriod);

        // totalPeriods = n * t
        int totalPeriods = frequencyPerYear * years;

        // compoundFactor = base ^ totalPeriods
        BigDecimal compoundFactor = base.pow(totalPeriods, MC);

        // finalAmount = principal * compoundFactor
        return principal.multiply(compoundFactor).setScale(2, RoundingMode.HALF_UP);
    }
}
~~~

~~~java
package com.bank.interest;

import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class CompoundInterestCalculatorPropertyTest {

    private final CompoundInterestCalculator calculator = new CompoundInterestCalculator();

    // Bất biến 1: Tiền sau khi tính lãi không bao giờ nhỏ hơn tiền gốc ban đầu
    @Property(tries = 1000)
    void finalAmountMustBeGreaterThanOrEqualToPrincipal(
            @ForAll("validPrincipals") BigDecimal principal,
            @ForAll("validRates") BigDecimal rate,
            @ForAll("validFrequencies") int frequency,
            @ForAll("validYears") int years) {

        BigDecimal result = calculator.calculateCompoundInterest(principal, rate, frequency, years);

        assertThat(result).isGreaterThanOrEqualTo(principal);
    }

    // Bất biến 2: Lãi suất 0% thì tiền cuối cùng bằng đúng tiền gốc
    @Property(tries = 500)
    void zeroInterestRatePreservesPrincipal(
            @ForAll("validPrincipals") BigDecimal principal,
            @ForAll("validFrequencies") int frequency,
            @ForAll("validYears") int years) {

        BigDecimal result = calculator.calculateCompoundInterest(principal, BigDecimal.ZERO, frequency, years);

        assertThat(result).isEqualByComparingTo(principal);
    }

    // Bất biến 3: Ghép lãi theo tháng (n=12) cho số tiền lớn hơn hoặc bằng ghép lãi theo năm (n=1)
    @Property(tries = 1000)
    void monthlyCompoundingYieldsMoreOrEqualThanAnnualCompounding(
            @ForAll("validPrincipals") BigDecimal principal,
            @ForAll("validRates") BigDecimal rate,
            @ForAll("validYears") int years) {

        BigDecimal annualResult = calculator.calculateCompoundInterest(principal, rate, 1, years);
        BigDecimal monthlyResult = calculator.calculateCompoundInterest(principal, rate, 12, years);

        assertThat(monthlyResult).isGreaterThanOrEqualTo(annualResult);
    }

    @Provide
    Arbitrary<BigDecimal> validPrincipals() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.ZERO, new BigDecimal("10000000.00"))
            .ofScale(2);
    }

    @Provide
    Arbitrary<BigDecimal> validRates() {
        return Arbitraries.bigDecimals()
            .between(BigDecimal.ZERO, new BigDecimal("0.30")) // Lãi suất 0 - 30%
            .ofScale(4);
    }

    @Provide
    Arbitrary<Integer> validFrequencies() {
        return Arbitraries.of(1, 4, 12); // Năm, Quý, Tháng
    }

    @Provide
    Arbitrary<Integer> validYears() {
        return Arbitraries.integers().between(1, 20);
    }
}
~~~

:::takeaways
- **Bảo vệ Kiến trúc bằng Mã nguồn (ArchUnit)**: Biến các quy tắc kiến trúc (Layered Architecture, Dependency Rule, Naming Conventions) thành các bài Unit Test tự động chạy trong vài giây.
- **Cấm Triệt để Field Injection**: Bắt buộc dùng Constructor Injection trong toàn bộ dự án để đảm bảo tính bất biến và dễ dàng kiểm thử đơn vị.
- **Ngăn chặn Rò rỉ Entity**: Sử dụng ArchUnit để khẳng định không có bất kỳ Controller nào được phép trả JPA Entity trực tiếp ra ngoài API.
- **Sức mạnh Vượt trội của jqwik (Property-Based Testing)**: Định nghĩa các thuộc tính bất biến của thuật toán và để máy tính tự động sinh hàng nghìn mẫu thử ngẫu nhiên.
- **Thuật toán Shrinking**: Khi tìm thấy lỗi, jqwik tự động thu nhỏ mẫu thử về giá trị biên nhỏ nhất, chỉ điểm chính xác nguyên nhân gốc rễ của bug logic.
:::
`
    },
    {
      id: "4-quiz",
      type: "quiz",
      title: "Quiz Module 4 — Testing",
      minutes: 10,
      questions: [
        {
          level: "easy",
          scenario: "Team LAAS mới viết test: 90% là @SpringBootTest full context, build Jenkins mất 40 phút, dev bỏ chạy local vì chậm, bug production vẫn lọt.",
          q: "Bài học test pyramid áp dụng thế nào đây?",
          options: [
            "Tăng RAM Jenkins agent — xây cơ sở vật chất",
            "Phân bổ lại: ~70% unit test (Mockito, ms-scale), ~20% slice (@WebMvcTest/@DataJpaTest), ~10% E2E cho critical flow",
            "Xóa hết test cũ viết lại toàn bộ theo TDD",
            "Chỉ giữ lại test cho business logic quan trọng, bỏ phần còn lại"
          ],
          answer: 1,
          explain: "Pyramid không phảidogma 'bao nhiêu phần trăm' mà là nguyên tắc: tầng dưới nhanh-rẻ-phản hồi sớm. Unit ms-scale chạy mọi commit; E2E chậm đắt chỉ dành critical path (payment flow).",
          why: [
            "Tăng hạ tầng trả tiền cho vấn đề thiết kế test — 40 phút vẫn 40 phút, dev vẫn không chạy local, feedback loop vẫn chậm. Tiền mua không được kiến trúc test đúng.",
            "✓ Đúng — hạ tầng pyramid: feedback millisecond cho 70% logic (unit), second cho contract (slice), phút cho flow thật (E2E). Build tổng nhanh, phủ sâu, ổn định.",
            "Viết lại toàn bộ TDD là 'big bang' phi thực tế — mất tuần không ship feature, và TDD là kỹ năng viết test KHÔNG tự sửa phân bổ pyramid.",
            "Bỏ test phần 'không quan trọng' = vùng mù coverage — regression sẽ xuất hiện đúng chỗ không có test. Giảm số lượng không giải quyết phân bổ sai tầng."
          ]
        },
        {
          level: "medium",
          scenario: "Dev test controller: dùng @SpringBootTest load cả app (DB, Kafka, security...) chỉ để assert status 200 và jsonPath title.",
          q: "Công cụ đúng cho test HTTP contract này?",
          options: [
            "@WebMvcTest(TaskController.class) + MockMvc + @MockitoBean service — chỉ nạp MVC slice",
            "Giữ @SpringBootTest nhưng thêm @MockBean cho mọi dependency",
            "Dùng RestClient gọi URL thật deploy ở local",
            "@DataJpaTest vì controller cũng đi qua repository"
          ],
          answer: 0,
          explain: "@WebMvcTest chỉ nạp web layer: controller + converter + filter + exception handler. Service thay bằng mock → test status/jsonPath/ProblemDetail trong ~200ms, không cần DB.",
          why: [
            "✓ Đúng — slice test đúng tầng: HTTP contract (mapping, validation, status code, error format) là trách nhiệm controller. Không cần bean nào khác.",
            "@SpringBootTest + mock mọi thứ = load toàn bộ context (chậm) rồi lại mock đi phần lớn — công to mèo nhỏ. Slice annotation sinh ra cho đúng việc này.",
            "Gọi URL thật = E2E test: phụ thuộc môi trường local, chậm, khó assert chi tiết response — quá đắt cho mục đích 'kiểm contract 1 endpoint'.",
            "@DataJpaTest là JPA slice — không có MVC, không HTTP, không controller. Kiểu test hoàn toàn khác mục tiêu."
          ]
        },
        {
          level: "medium",
          scenario: "Repo test chạy H2 in-memory pass 100%. Deploy production PostgreSQL — native query findOverdue() bắn SQLSyntaxErrorException: function 'now()' không tồn tại như thế.",
          q: "Bài học và giải pháp test đúng?",
          options: [
            "Viết query thuần JPQL thay native — khỏi lo dialect",
            "Testcontainers PostgreSQLContainer: test trên cùng engine DB production dùng",
            "Chạy test trên PostgreSQL QA environment thay vì local",
            "Thêm try-catch quanh query để app không crash"
          ],
          answer: 1,
  explain: "H2 và PostgreSQL là 2 engine khác biệt (function, type system, lock, JSONB...). Testcontainers khởi postgres:16 Docker thật — dialect, function, index behavior y hệt prod. @ServiceConnection tự wire datasource.",
          why: [
            "JPQL portable hơn native thật — nhưng đôi khi native là bắt buộc (window function, CTE, performance). Tránh không phải giải pháp, là trốn tránh.",
            "✓ Đúng — 'test trên cái bạn deploy': container PostgreSQL thật trong test lifecycle, confidence production-level, chạy mọi nơi có Docker (Jenkins agent).",
            "QA environment test là staging smoke test — không phải developer test: chậm, không debug được, không chạy mỗi commit. Vấn đề cần bắt ở local/CI.",
            "try-catch nuốt SQL error = che bug dưới thảm. App 'không crash' nhưng tính năng hỏng âm thầm — tệ hơn crash."
          ]
        },
        {
          level: "easy",
          scenario: "Review: service.save(entity) được gọi nhưng test chỉ verify(repo, times(1)).save(any()) — 'chắc là ổn'. Reviewer gãi đầu.",
          q: "Cách test chặt chẽ hơn?",
          options: [
            "verify(repo, times(5)).save(any()) — gọi nhiều lần cho chắc",
            "ArgumentCaptor: verify(repo).save(captor.capture()) rồi assert từng field của entity truyền vào",
            "Thêm printStackTrace trong catch để xem log",
            "Kiểm tra coverage report — method đã 100% covered là đủ"
          ],
          answer: 1,
          explain: "any() chỉ khẳng định 'có gì đó được save' — có thể là entity rác. Captor chụp đúng object truyền vào: assert title, status, dueDate... từng field. Test nói được 'save ĐÚNG dữ liệu', không chỉ 'save có xảy ra'.",
          why: [
            "times(5) không liên quan — test đang sai ở CHẤT assertion chứ không phải SỐ LẦN verify. Gọi 5 lần vẫn any() vẫn mù.",
            "✓ Đúng — ArgumentCaptor nâng assertion từ 'hành vi xảy ra' lên 'hành vi xảy ra với dữ liệu đúng'. Đặc biệt quan trọng với mapping logic (request → entity).",
            "Print log là debug thủ công không phải assertion — test vẫn pass dù dữ liệu sai. CI log không ai đọc.",
            "100% coverage đo 'code được CHẠM tới', không đo 'code đúng'. save(garbage) vẫn coverage 100%."
          ]
        },
        {
          level: "hard",
          scenario: "Test interest calculation LAAS pass hôm qua, fail hôm nay. Logic: LocalDate.now() trực tiếp trong service — hôm nay là ngày 31 tháng, dữ liệu test fix cứng tháng 30 ngày.",
          q: "Root cause và pattern sửa đúng?",
          options: [
            "Fix cứng ngày trong dữ liệu test khớp hôm nay — sửa mỗi lần fail",
            "Inject Clock: service nhận Clock bean, test cung cấp Clock.fixed(...) — thời gian trở thành dependency kiểm soát được",
            "Đặt @Disabled cho test flaky, tạo ticket JIRA",
            "Randomize dữ liệu test để bù đắp mọi tháng"
          ],
          answer: 1,
          explain: "now() hardcoded = hidden dependency vào hệ thống ngoài (đồng hồ). Clock injectable: prod bean Clock.systemDefaultZone(), test Clock.fixed(Instant.parse(\"2026-01-15T10:00:00Z\"), ZoneId) — deterministic tuyệt đối.",
          why: [
            "Sửa dữ liệu mỗi lần fail = đuổi theo triệu chứng — cuối tháng lại fail, đầu tháng lại fail. Flaky test là nợ phải trả, không phải thói quen.",
            "✓ Đúng — thời gian là dependency như repository: inject thì control được. Test chạy 30/4 hay 31/12 đều như nhau — 'repeatable' trong F.I.R.S.T.",
            "@Disabled xóa tín hiệu regression — flaky test là canary phát hiện hidden dependency, disable = giết chim báo động.",
            "Randomize dữ liệu NGHĨA LÀ test không còn deterministic — flaky chuyển từ 'cuối tháng' sang 'random'. Trượt completely hướng giải pháp."
          ]
        },
        {
          level: "medium",
          scenario: "CI Jenkins: mvn test nhanh (unit) nhưng Testcontainers IT cần Docker — agent không có Docker, team tranh cãi nên bỏ Testcontainers.",
          q: "Giải pháp chuẩn Maven?",
          options: [
            "Bỏ Testcontainers, quay về H2 — dùng được là được",
            "Naming *IT + maven-failsafe-plugin: mvn test (Surefire) chỉ unit chạy local nhanh; mvn verify (Failsafe) chạy IT trên agent CÓ Docker ở pipeline Jenkins",
            "Chạy Docker-in-Docker trên mọi agent",
            "Đánh dấu Testcontainers test @Disabled cho đến khi có agent Docker"
          ],
          answer: 1,
          explain: "Surefire/*Test và Failsafe/*IT là cơ chế tách tầng built-in: dev local mvn test = nhanh; CI pipeline mvn verify trên agent đủ điều kiện = đầy đủ. Cùng 1 codebase, 2 chế độ chạy.",
          why: [
            "Quay về H2 = quay về vấn đề 'pass H2 fail PG' — chính lý do Testcontainers tồn tại. Giải quyết hạ tầng bằng cách hạ chất lượng test.",
            "✓ Đúng — kiến trúc standard: *Test chạy mọi nơi mỗi build (feedback nhanh), *IT chạy phase verify trên agent có Docker (confidence đầy đủ). Jenkins file cấu hình agent label cho IT stage.",
            "DinD mọi agent = phức tạp vận hành + rủi ro bảo mật (privileged container) cho vấn đề có giải pháp đơn giản hơn nhiều.",
            "@Disabled IT = mất toàn bộ giá trị Testcontainers — đúng lúc cần nhất (CI) lại không chạy. Vấn đề hạ tầng nên giải quyết bằng hạ tầng (agent label), không phải bằng cách tắt test."
          ]
        },
        {
          level: "hard",
          scenario: "UT service phức tạp: mock 5 dependency, verify 8 lần gọi, 15 assertion trong 1 method test. Refactor service đổi internals → 12 test fail dù HÀNH VI ngoài không đổi.",
          q: "Nguyên tắc test bị vi phạm?",
          options: [
            "Assertion quá ít — tăng lên 30 assertion cho chắc",
            "Test implementation thay vì behavior: mock verify chi tiết internal calls là khớp với CÁCH làm, không phải KẾT QUẢ. Assert input/output + vài tương tác then chốt",
            "Mockito không đủ mạnh — chuyển sang PowerMock",
            "Coverage thấp — bổ sung test phủ mọi branch"
          ],
          answer: 1,
          explain: "Mock verifying mọi internal call = coupling test với implementation. Refactor (đổi cách, giữ kết quả) không nên vỡ test. Chicago vs London school: với service có state, test hành vi quan sát được từ ngoài.",
          why: [
            "Tăng assertion làm tệ hơn — đã 15 assertion over-specified, 30 assertion là khóa implementation chặt hơn nữa.",
            "✓ Đúng — test contract của unit (input → output + side-effect chính), không test ánh xạ từng bước bên trong. Refactor tự do mà test vẫn xanh = test đúng vai trò regression safety net.",
            "PowerMock là công cụ legacy hack static/final — vấn đề ở đây không phải khả năng mock mà là THIẾT KẾ test. PowerMock thêm_complexity không giải quyết over-specification.",
            "Coverage không phải vấn đề — đã over-testing implementation. Thêm branch test chỉ đào sâu sai hướng."
          ]
        },
        {
          level: "easy",
          scenario: "PM hỏi: 'Coverage 85% có nghĩa 85% bug được phát hiện chứ?' Tech lead phải giải thích.",
          q: "Coverage thực sự nói lên điều gì?",
          options: [
            "85% bug bị bắt — coverage tương đương chất lượng test",
            "85% dòng/branch code được test THỰC THI qua — nhưng test có assert đúng không, có test case đủ không, coverage không nói gì",
            "85% requirement được verify",
            "85% khả năng không có bug production"
          ],
          answer: 1,
  explain: "Coverage đo 'code được chạy trong test' — mechanical fact. Test rác (assert tầm thường, không edge case) vẫn đạt coverage cao. Coverage là smoke detector: chỉ báo code KHÔNG được test chạm, không chứng minh code được test ĐÚNG.",
          why: [
            "Tương đương bug-caught là hiểu lầm phổ biến nhất — 100% coverage với assert 1==1 vẫn là 0 giá trị. Con số dễ đo bị lạm dụng thành KPI.",
            "✓ Đúng — coverage = 'đo sự thực thi', không phải 'đo sự đúng đắn'. Dùng coverage để tìm vùng MÙ (untested) thì giá trị; dùng làm mục tiêu chất lượng thì bị gaming.",
            "Requirement coverage là metrics khác (traceability matrix) — không liên quan line coverage.",
            "Xác suất bug là hàm của chất lượng test + độ phức tạp code — coverage chỉ 1 input yếu trong công thức đó."
          ]
        },
        {
          level: "hard",
          scenario: "Team viết property cho PointsCalculator: earn(amount, rate) với @ForAll int amount không giới hạn và @ForAll double rate không giới hạn. Test fail liên tục với rate âm và amount âm — nghiệp vụ thực tế không bao giờ có input này.",
          q: "Property sai ở đâu và sửa thế nào?",
          options: [
            "Framework lỗi — jqwik nên tự loại input âm",
            "Thiếu ràng buộc miền giá trị: @IntRange(min=0) cho amount, @DoubleRange(min=0,max=10) cho rate — property phải mô tả ĐÚNG tiền đề nghiệp vụ",
            "Thêm if (amount < 0) return; đầu hàm earn — cho code pass property",
            "Bỏ property testing — example-based đã đủ"
          ],
          answer: 1,
          explain: "Property-based test mạnh BẰNG chất lượng định nghĩa miền: @ForAll nghĩa là 'với MỌI input thỏa ràng buộc'. Không ràng buộc = kiểm cả vùng input không có ý nghĩa nghiệp vụ → fail không phải bug mà là property sai tiền đề. @IntRange/@DoubleRange/@Positive thu hẹp về miền hợp đồng thực — đúng nơi bug ẩn nấp. Sửa code cho qua property là đầu độc nguồn sự thật.",
          why: [
            "Framework sinh đúng những gì khai báo — vấn đề là khai báo thiếu",
            "✓ Miền giá trị là PHẦN của contract — ràng buộc đúng thì property có ý nghĩa",
            "Sửa production code cho test pass khi test sai tiền đề — đảo ngược vai trò",
            "Bỏ công cụ vì dùng sai tham số — mất đúng năng lực săn blind spot"
          ]
        },
        {
          level: "medium",
          scenario: "Trong cuộc họp kiến trúc, Tech Lead yêu cầu: Controllers không được phép gọi trực tiếp Repository (phải qua Service), tuyệt đối cấm @Autowired trên thuộc tính (bắt buộc Constructor Injection), và không rò rỉ Entity ra ngoài API. Team muốn tự động hóa quy tắc này trong CI/CD.",
          q: "Công cụ nào giải quyết bài toán kiểm thử kiến trúc này ở mức Unit Test tự động?",
          options: [
            "Viết checklist review code thủ công trong Pull Request template để reviewer tự nhớ kiểm tra",
            "ArchUnit: Viết các bài ArchTest phân tích Bytecode kiểm tra Layered Architecture, rò rỉ Entity và cấm Field Injection ngay trong lệnh mvn test",
            "Bật SonarQube Cloud quét định kỳ ban đêm và tạo ticket JIRA sau đó",
            "Dùng script bash grep chuỗi '@Autowired' trước khi commit git"
          ],
          answer: 1,
          explain: "ArchUnit cho phép mã hóa các quy tắc kiến trúc phần mềm thành các bài Unit Test tiêu chuẩn chạy bằng JUnit 5. Nó phân tích Java bytecode qua thư viện ASM, thực thi trong vài mili-giây và fail ngay lập tức khi phát hiện vi phạm tầng kiến trúc.",
          why: [
            "Review thủ công bằng mắt luôn luôn có xác suất bỏ lọt (Human Error) khi dự án phình to hàng trăm PR mỗi tuần.",
            "✓ Đúng — ArchUnit biến 'luật kiến trúc' thành 'mã test chạy tự động'. Nếu vi phạm, mvn test fail ngay trên máy lập trình viên trước khi tạo PR.",
            "SonarQube quét ban đêm có độ trễ lớn (hàng ngày) và khó tùy biến các quy tắc phân tầng đặc thù của dự án như ArchUnit.",
            "Grep chuỗi là giải pháp chắp vá, dễ bị false-positive (ví dụ: chuỗi nằm trong comment hoặc file cấu hình) và không hiểu được ngữ nghĩa hướng đối tượng."
          ]
        }
      ]
    }
  ]
});
