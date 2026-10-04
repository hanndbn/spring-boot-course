/* =========================================================================
   Cloud Native DevOps & Kubernetes Production
   Complete Course Content: 4 Modules, 8 Lessons, 4 Quizzes.
   ========================================================================= */
(function() {
  "use strict";

  window.EXTRA_COURSES = window.EXTRA_COURSES || {};

  window.EXTRA_COURSES["devops-k8s"] = {
    id: "devops-k8s",
    title: "Cloud Native DevOps & Kubernetes Production",
    shortTitle: "DevOps & Kubernetes",
    icon: "☸️",
    badge: "DevOps & Cloud Native",
    level: "Advanced & Production",
    hours: "~50h",
    modulesCount: 4,
    lessonsCount: 8,
    quizCount: 4,
    desc: "Thực hành triển khai production: Docker containerization, Kubernetes cluster, Helm, CI/CD GitHub Actions, Prometheus, Grafana & ELK Stack.",
    tags: ["Docker", "Kubernetes", "CI/CD", "Helm", "Prometheus", "Grafana", "AWS"],
    isAvailable: true,
    modules: [
  {
    "id": 0,
    "title": "Nền Tảng Linux & Mạng Cho Cloud Native DevOps",
    "icon": "🐧",
    "color": "#f97316",
    "desc": "Linux CLI chuyên sâu, Process management, Systemd, SSH, IPTables, DNS & Networking cho kỹ sư DevOps.",
    "lessons": [
      {
        "id": "devops-0-1",
        "title": "Bài 0.1: Quản Trị Hệ Thống Linux: Tiến Trình, Bộ Nhớ & Quyền Hạn",
        "minutes": 30,
        "type": "theory",
        "content": "# Bài 0.1: Quản Trị Hệ Thống Linux Cho DevOps\n\nLinux là trái tim của mọi cụm máy chủ đám mây và Kubernetes container. Làm chủ Linux là bước đầu tiên để trở thành kỹ sư Cloud Native thực thụ.\n\n## 1. Giám sát tài nguyên hệ thống\n- `top` / `htop`: Theo dõi CPU, RAM, Load Average và tiến trình theo thời gian thực.\n- `free -m`: Kiểm tra RAM vật lý, Swap và Buffers/Cache.\n- `df -h` và `du -sh *`: Kiểm tra dung lượng ổ đĩa và thư mục chiếm nhiều dung lượng nhất.\n- `ps aux | grep java`: Tìm kiếm tiến trình JVM đang chạy.\n\n## 2. Quản lý tiến trình dịch vụ với Systemd\n~~~bash\nsudo systemctl status myapp.service\nsudo systemctl restart myapp.service\nsudo journalctl -u myapp.service -f --since \"10 minutes ago\"\n~~~\n"
      },
      {
        "id": "devops-0-quiz",
        "title": "Quiz Module 0: Linux & Networking",
        "minutes": 15,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Một máy chủ Linux báo Load Average là 4.5 trên CPU có 2 cores.",
            "q": "Tình trạng hệ thống hiện tại là gì?",
            "options": [
              "Hệ thống đang rảnh rỗi (idle)",
              "Hệ thống đang bị quá tải nghiêm trọng (Overloaded), có trung bình 2.5 tiến trình đang phải xếp hàng chờ CPU xử lý",
              "Máy tính bị hỏng ổ đĩa",
              "Hệ thống bị tắt mạng"
            ],
            "answer": 1,
            "explain": "Ngưỡng bão hòa là Load Average bằng đúng số CPU cores (2.0 cho 2 cores). Giá trị 4.5 nghĩa là CPU quá tải 225%, các tiến trình đang bị nghẽn.",
            "why": [
              "Sai — Load average cao biểu thị tải nặng.",
              "✓ Đúng — Load average > số cores phản ánh hàng đợi CPU bị tắc nghẽn.",
              "Sai — Chưa đủ căn cứ hỏng ổ đĩa.",
              "Sai — Không liên quan đến card mạng."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 1,
    "title": "Docker Containerization Thực Chiến Chuẩn Production",
    "icon": "🐳",
    "color": "#0ea5e9",
    "desc": "Dockerfile Multi-stage, Tối ưu Image layers, Rootless Container, Docker Compose & Registry.",
    "lessons": [
      {
        "id": "devops-1-1",
        "title": "Bài 1.1: Tối Ưu Dockerfile: Multi-Stage Build & Security Best Practices",
        "minutes": 35,
        "type": "practice",
        "content": "# Bài 1.1: Tối Ưu Dockerfile: Multi-Stage Build\n\n## 1. Vấn đề của Dockerfile truyền thống\nNếu gộp chung môi trường Build (JDK 500MB) và môi trường Chạy vào một image, kích thước container sẽ phình to lên tới 1GB, tốn thời gian kéo image trên Kubernetes và chứa nhiều công cụ thừa (compiler, git) gây rủi ro bảo mật.\n\n## 2. Dockerfile Multi-stage Chuẩn Production\n\n~~~dockerfile\n# Stage 1: Build stage với JDK đầy đủ\nFROM eclipse-temurin:21-jdk-alpine AS builder\nWORKDIR /app\nCOPY pom.xml mvnw ./\nCOPY .mvn .mvn\nRUN ./mvnw dependency:go-offline -B\nCOPY src src\nRUN ./mvnw clean package -DskipTests\n\n# Stage 2: Runtime stage siêu nhẹ với JRE\nFROM eclipse-temurin:21-jre-alpine AS runner\nWORKDIR /app\n# Tạo user thường không có quyền root\nRUN addgroup -S appgroup && adduser -S appuser -G appgroup\nUSER appuser:appgroup\n\nCOPY --from=builder /app/target/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT [\"java\", \"-XX:+UseZGC\", \"-XX:+ZGenerational\", \"-jar\", \"app.jar\"]\n~~~\n\n:::takeaways Lợi ích cốt lõi\n- Giảm kích thước image từ **800MB xuống còn 150MB**!\n- Loại bỏ toàn bộ công cụ build khỏi production, chạy dưới quyền non-root user an toàn tuyệt đối.\n:::\n"
      },
      {
        "id": "devops-1-quiz",
        "title": "Quiz Module 1: Docker Containerization",
        "minutes": 15,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Tại sao trong Dockerfile ta nên COPY file cấu hình dependency (pom.xml hoặc package.json) và tải thư viện TRƯỚC KHI copy toàn bộ mã nguồn 'src/'?",
            "q": "Nguyên lý tối ưu hóa Docker ở đây là gì?",
            "options": [
              "Tận dụng cơ chế Layer Caching của Docker: khi mã nguồn src/ thay đổi, Docker không cần tải lại hàng trăm MB thư viện, giúp build nhanh gấp 10 lần",
              "Bắt buộc theo cú pháp của Docker",
              "Để mã hóa dependency",
              "Để giảm tải CPU máy tính"
            ],
            "answer": 0,
            "explain": "Docker cache các layer từ trên xuống dưới. Đặt layer ít thay đổi (dependencies) lên trước giúp tái sử dụng cache tối đa khi developer sửa code trong src/.",
            "why": [
              "✓ Đúng — Layer Caching Optimization là kỹ thuật cơ bản bắt buộc của mọi kỹ sư Docker.",
              "Sai — Docker không ép buộc thứ tự.",
              "Sai — Không mã hóa.",
              "Sai — Không liên quan đến CPU."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "title": "Kubernetes Core: Pods, Deployments & Networking",
    "icon": "☸️",
    "color": "#3b82f6",
    "desc": "Kiến trúc K8s Control Plane, Worker Nodes, Pods, Deployments, Rolling Update, Services & ConfigMaps.",
    "lessons": [
      {
        "id": "devops-2-1",
        "title": "Bài 2.1: Kiến Trúc Cốt Lõi Kubernetes & Quản Trị Pods/Deployments",
        "minutes": 40,
        "type": "theory",
        "content": "# Bài 2.1: Kiến Trúc Cốt Lõi Kubernetes\n\nKubernetes (K8s) là nền tảng điều phối container (Container Orchestration) tiêu chuẩn của thế giới.\n\n```mermaid\ngraph TD\n    CP[\"Control Plane<br>- API Server<br>- etcd (Data Store)<br>- Kube-Scheduler<br>- Controller Manager\"]\n    CP --> W1[\"Worker Node 1<br>- Kubelet<br>- Kube-Proxy<br>- Container Runtime (containerd)\"]\n    CP --> W2[\"Worker Node 2<br>- Kubelet<br>- Kube-Proxy<br>- Container Runtime (containerd)\"]\n```\n\n## 1. Các thành phần chính\n- **Pod**: Đơn vị tính toán nhỏ nhất trong K8s, chứa một hoặc nhiều container chia sẻ chung mạng (IP) và ổ đĩa (Storage).\n- **Deployment**: Quản lý việc triển khai khai báo (Declarative), tự động Rolling Update, Rollback và duy trì số lượng bản sao (Replicas) luôn ổn định.\n- **Service**: Tạo một điểm truy cập ổn định (ClusterIP/NodePort) cân bằng tải cho các Pod có nhãn (Label Selector) tương ứng.\n"
      },
      {
        "id": "devops-2-quiz",
        "title": "Quiz Module 2: Kubernetes Core Architecture",
        "minutes": 15,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Một Pod trong Kubernetes bị crash và chết hoàn toàn. Kubernetes tự động tạo ra một Pod mới để thay thế.",
            "q": "Địa chỉ IP của Pod mới có gì đặc biệt so với Pod cũ?",
            "options": [
              "Pod mới sẽ được cấp một địa chỉ IP MỚI HOÀN TOÀN, do đó không bao giờ được kết nối trực tiếp đến IP của Pod mà phải kết nối qua K8s Service",
              "Pod mới giữ nguyên địa chỉ IP cũ vĩnh viễn",
              "Pod mới không có địa chỉ IP",
              "Tất cả Pod đều dùng chung 1 IP duy nhất"
            ],
            "answer": 0,
            "explain": "Pods trong Kubernetes mang tính chất phù du (Ephemeral). IP của Pod thay đổi liên tục khi restart. K8s Service cung cấp Virtual IP ổn định và DNS name để giao tiếp tin cậy.",
            "why": [
              "✓ Đúng — Tính chất Ephemeral của Pod là lý do K8s Service và CoreDNS ra đời.",
              "Sai — Pod mới không giữ IP cũ.",
              "Sai — Mọi Pod đều có IP trong mạng overlay CNI.",
              "Sai — Mỗi Pod có một IP riêng biệt."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 3,
    "title": "Helm, Ingress, CI/CD GitOps & Observability",
    "icon": "📊",
    "color": "#10b981",
    "desc": "Đóng gói Helm Charts, Nginx Ingress, CI/CD Pipeline GitHub Actions & Giám sát Prometheus Grafana.",
    "lessons": [
      {
        "id": "devops-3-1",
        "title": "Bài 3.1: Helm Charts & Tự Động Hóa CI/CD Pipeline với GitHub Actions",
        "minutes": 40,
        "type": "practice",
        "content": "# Bài 3.1: Helm Charts & CI/CD Pipeline GitHub Actions\n\n## 1. Đóng gói ứng dụng với Helm\nHelm là Package Manager cho Kubernetes (tương tự như apt hay npm). Nó cho phép tham số hóa các file manifest YAML thông qua `values.yaml`, giúp bạn deploy cùng một bộ template lên Dev, Staging, Production chỉ bằng cách đổi file cấu hình.\n\n## 2. GitHub Actions CI/CD Pipeline\nQuy trình tự động hóa hoàn chỉnh:\n1. `checkout`: Lấy mã nguồn mới nhất từ commit.\n2. `test & build`: Chạy JUnit test và build JAR.\n3. `docker build & push`: Build image gắn tag `${{ github.sha }}` và push lên Docker Registry (GHCR/ECR).\n4. `deploy`: Dùng Helm nâng cấp cụm Kubernetes `helm upgrade --install myapp ./chart --set image.tag=${{ github.sha }}`.\n"
      },
      {
        "id": "devops-3-quiz",
        "title": "Quiz Module 3: Helm, Ingress & CI/CD",
        "minutes": 15,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Trong kiến trúc GitOps (ví dụ dùng ArgoCD), đâu là nguồn chân lý duy nhất (Single Source of Truth) đại diện cho trạng thái mong muốn của hệ thống trên cụm Kubernetes?",
            "q": "Nguồn chân lý trong GitOps là gì?",
            "options": [
              "Git Repository chứa mã nguồn manifest/helm cấu hình",
              "Trực tiếp trong bộ nhớ của K8s cluster",
              "Trên máy tính cá nhân của lập trình viên",
              "Trong file Excel quản lý"
            ],
            "answer": 0,
            "explain": "Triết lý cốt lõi của GitOps: Mọi cấu hình hạ tầng và ứng dụng đều được lưu dưới dạng code trong Git. ArgoCD liên tục đối soát và tự động đồng bộ trạng thái thực tế trên K8s theo Git.",
            "why": [
              "✓ Đúng — 'Git as Single Source of Truth' là nền tảng tối cao của GitOps.",
              "Sai — Cluster chỉ phản chiếu trạng thái được khai báo từ Git.",
              "Sai — Máy cá nhân vi phạm nguyên tắc tập trung hóa.",
              "Sai — Không dùng file Excel."
            ]
          }
        ]
      }
    ]
  }
]
  };
})();
