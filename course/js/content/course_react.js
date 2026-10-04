/* =========================================================================
   React 19 & Next.js 15 — Fullstack Enterprise
   Complete Course Content: 4 Modules, 9 Lessons, 4 Quizzes.
   ========================================================================= */
(function() {
  "use strict";

  window.EXTRA_COURSES = window.EXTRA_COURSES || {};

  window.EXTRA_COURSES["react-mastery"] = {
    id: "react-mastery",
    title: "React 19 & Next.js 15 — Fullstack Enterprise",
    shortTitle: "React 19 & Next.js 15",
    icon: "⚛️",
    badge: "Frontend & Fullstack",
    level: "Intermediate & Advanced",
    hours: "~45h",
    modulesCount: 4,
    lessonsCount: 9,
    quizCount: 4,
    desc: "Làm chủ React 19, Server Components, Server Actions, Next.js 15 App Router, TypeScript, Zustand và Clean Architecture cho ứng dụng Enterprise.",
    tags: ["React 19", "Next.js 15", "TypeScript", "Zustand", "Tailwind CSS", "Server Actions"],
    isAvailable: true,
    modules: [
  {
    "id": 0,
    "title": "Nền Tảng TypeScript & Modern JavaScript Cho React",
    "icon": "📜",
    "color": "#38bdf8",
    "desc": "TypeScript Generics, Discriminated Unions, Immutability & Modern ES2024 cho React Developers.",
    "lessons": [
      {
        "id": "react-0-1",
        "title": "Bài 0.1: TypeScript Nâng Cao cho React: Props, Generics & Discriminated Unions",
        "minutes": 25,
        "type": "theory",
        "content": "# Bài 0.1: TypeScript Nâng Cao cho React\n\nTypeScript là tiêu chuẩn bắt buộc cho mọi dự án React Enterprise. Trong bài học này, bạn sẽ làm chủ cách định kiểu mạnh mẽ cho Component Props và State.\n\n## 1. Discriminated Unions cho UI State\nThay vì quản lý state với hàng loạt biến cờ (`isLoading`, `isError`, `data`), hãy sử dụng Discriminated Unions để loại bỏ các trạng thái bất khả thi (Impossible States):\n\n~~~typescript\ntype AsyncState<T> =\n  | { status: 'idle' }\n  | { status: 'loading' }\n  | { status: 'success'; data: T }\n  | { status: 'error'; error: string };\n\nfunction UserProfile({ state }: { state: AsyncState<User> }) {\n  switch (state.status) {\n    case 'loading': return <Spinner />;\n    case 'error': return <Alert message={state.error} />;\n    case 'success': return <div>Xin chào, {state.data.name}!</div>;\n    default: return null;\n  }\n}\n~~~\n"
      },
      {
        "id": "react-0-2",
        "title": "Bài 0.2: Immutability & Cơ Chế So Sánh Tham Chiếu trong React",
        "minutes": 30,
        "type": "practice",
        "content": "# Bài 0.2: Immutability & Cơ Chế So Sánh Tham Chiếu trong React\n\nReact sử dụng cơ chế **Shallow Comparison** (so sánh nông `Object.is`) để quyết định một Component có cần phải re-render hay không.\n\n## 1. Anti-pattern: Mutate State Trực Tiếp\n~~~typescript\n// ❌ SAI LẦM: Thay đổi trực tiếp mảng\nconst [items, setItems] = useState(['A', 'B']);\nitems.push('C'); // Mutate tham chiếu cũ!\nsetItems(items); // React so sánh items === items -> BỎ QUA RE-RENDER!\n\n// ✅ ĐÚNG: Luôn tạo bản sao mới (Immutable)\nsetItems(prev => [...prev, 'C']);\n~~~\n"
      },
      {
        "id": "react-0-quiz",
        "title": "Quiz Module 0: TypeScript & Modern JS for React",
        "minutes": 15,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Một component React gọi 'setList(list.push(item))' nhưng giao diện không hề cập nhật.",
            "q": "Nguyên nhân chính là gì?",
            "options": [
              "Array.prototype.push() làm thay đổi trực tiếp mảng cũ và trả về độ dài mảng (number), React thấy tham chiếu không đổi nên không kích hoạt re-render",
              "React không hỗ trợ kiểu mảng",
              "Do chưa cài TypeScript",
              "Do thiếu key trong thẻ div"
            ],
            "answer": 0,
            "explain": "Array.push() làm mutate mảng gốc và trả về số nguyên. React kiểm tra Object.is(prev, next) thấy cùng một con trỏ vùng nhớ nên hủy bỏ render.",
            "why": [
              "✓ Đúng — Phải luôn dùng spread operator `[...list, item]` hoặc `concat()` để tạo tham chiếu mới.",
              "Sai — React hỗ trợ mảng hoàn hảo.",
              "Sai — Lỗi logic runtime, không phụ thuộc TypeScript.",
              "Sai — Lỗi re-render state, không phải lỗi render list item."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 1,
    "title": "React 19 Core & Hook Architecture Mới Nhất",
    "icon": "⚛️",
    "color": "#6366f1",
    "desc": "React 19 Hooks: useActionState, useOptimistic, use() Hook, Form Actions & Server Components.",
    "lessons": [
      {
        "id": "react-1-1",
        "title": "Bài 1.1: Đột phá React 19: useActionState, useOptimistic & Hook use()",
        "minutes": 35,
        "type": "theory",
        "content": "# Bài 1.1: Đột phá React 19: useActionState, useOptimistic & Hook use()\n\nReact 19 mang đến sự chuyển dịch căn bản: biến việc xử lý dữ liệu và biểu mẫu không đồng bộ trở thành tính năng cốt lõi của thư viện.\n\n## 1. useActionState: Xử lý Form Actions thanh lịch\nKhông còn cần `useState` cho loading và error khi submit form:\n\n~~~tsx\nimport { useActionState } from 'react';\n\nasync function updateNameAction(previousState: any, formData: FormData) {\n  const name = formData.get('name') as string;\n  const res = await api.updateName(name);\n  return res.data;\n}\n\nexport function NameForm() {\n  const [state, formAction, isPending] = useActionState(updateNameAction, null);\n\n  return (\n    <form action={formAction}>\n      <input name=\"name\" disabled={isPending} />\n      <button type=\"submit\" disabled={isPending}>\n        {isPending ? 'Đang lưu...' : 'Cập nhật'}\n      </button>\n    </form>\n  );\n}\n~~~\n\n## 2. useOptimistic: Phản Hồi Tức Thì (Zero-Latency UI)\nCho phép giao diện hiển thị kết quả thành công NGAY LẬP TỨC trước khi request từ server trả về!\n"
      },
      {
        "id": "react-1-quiz",
        "title": "Quiz Module 1: React 19 Core & Hooks",
        "minutes": 15,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Trong React 19, Hook nào cho phép đọc giá trị của một Promise hoặc Context trực tiếp ngay bên trong khối điều kiện 'if'?",
            "q": "Tên Hook mới mang tính cách mạng của React 19 là gì?",
            "options": [
              "use()",
              "useEffect()",
              "usePromise()",
              "useAsync()"
            ],
            "answer": 0,
            "explain": "Hook 'use()' trong React 19 là Hook duy nhất được phép gọi có điều kiện bên trong khối if hoặc vòng lặp để unwrap Promise hoặc Context.",
            "why": [
              "✓ Đúng — 'use(promise)' là tính năng đột phá của React 19 kết hợp với Suspense.",
              "Sai — useEffect không được gọi có điều kiện (vi phạm Rules of Hooks).",
              "Sai — Không có hook usePromise trong core React 19.",
              "Sai — Không có hook useAsync trong core React 19."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "title": "Quản Lý State & Data Fetching Chuyên Nghiệp",
    "icon": "🗄️",
    "color": "#10b981",
    "desc": "Zustand Global Store, TanStack Query (React Query) Caching, Invalidation & Optimistic Updates.",
    "lessons": [
      {
        "id": "react-2-1",
        "title": "Bài 2.1: Zustand: Quản Lý Global State Gọn Nhẹ Chuẩn Enterprise",
        "minutes": 30,
        "type": "practice",
        "content": "# Bài 2.1: Zustand: Quản Lý Global State Gọn Nhẹ\n\nRedux đã quá cồng kềnh với hàng tá boilerplate actions, reducers. **Zustand** là thư viện state management hiện đại số 1 hiện nay với kích thước chỉ 1KB.\n\n~~~typescript\nimport { create } from 'zustand';\nimport { persist } from 'zustand/middleware';\n\ninterface AuthState {\n  user: User | null;\n  token: string | null;\n  login: (token: string, user: User) => void;\n  logout: () => void;\n}\n\nexport const useAuthStore = create<AuthState>()(\n  persist(\n    (set) => ({\n      user: null,\n      token: null,\n      login: (token, user) => set({ token, user }),\n      logout: () => set({ token: null, user: null }),\n    }),\n    { name: 'auth-storage' }\n  )\n);\n~~~\n"
      },
      {
        "id": "react-2-quiz",
        "title": "Quiz Module 2: State Management & TanStack Query",
        "minutes": 15,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Khi dùng Zustand, tại sao nên dùng selector như 'const token = useAuthStore(s => s.token)' thay vì 'const { token } = useAuthStore()'?",
            "q": "Lợi ích hiệu năng của selector là gì?",
            "options": [
              "Giúp component chỉ re-render khi giá trị 'token' thay đổi, tránh re-render thừa khi các state khác trong store cập nhật",
              "Để mã hóa token trong RAM",
              "Bắt buộc theo cú pháp TypeScript",
              "Tự động lưu token vào cookie"
            ],
            "answer": 0,
            "explain": "Atomic Selector giúp tối ưu render: Component chỉ đăng ký lắng nghe thuộc tính cụ thể, ngăn chặn re-render dây chuyền khi các trường khác trong store biến động.",
            "why": [
              "✓ Đúng — Selector là kỹ thuật tối ưu cốt tử khi sử dụng Zustand trong ứng dụng quy mô lớn.",
              "Sai — Không mã hóa.",
              "Sai — Cả 2 cách đều hợp lệ về mặt TypeScript.",
              "Sai — Không tự lưu cookie."
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 3,
    "title": "Next.js 15 App Router & Production Fullstack",
    "icon": "⚡",
    "color": "#ec4899",
    "desc": "React Server Components (RSC), Server Actions, Dynamic Routing, Auth.js & Triển khai Production.",
    "lessons": [
      {
        "id": "react-3-1",
        "title": "Bài 3.1: Kiến Trúc Next.js 15: Server Components vs Client Components",
        "minutes": 40,
        "type": "theory",
        "content": "# Bài 3.1: Kiến Trúc Next.js 15: Server Components vs Client Components\n\nNext.js 15 App Router đưa **React Server Components (RSC)** thành mặc định.\n\n```mermaid\nflowchart TD\n    Req[\"Request từ Browser\"] --> Edge[\"Next.js Server\"]\n    Edge --> RSC[\"Server Component (Mặc định)<br>- Chạy 100% trên Server<br>- Truy vấn trực tiếp DB/File<br>- Zero Bundle Size chuyển xuống client\"]\n    RSC --> CC[\"Client Component ('use client')<br>- Gửi JS bundle xuống client<br>- Xử lý useState, onClick, useEffect\"]\n```\n\n## Khi nào dùng Server Component vs Client Component?\n- **Server Component (Mặc định)**: Fetch dữ liệu, truy cập Database, bảo mật API keys, tối ưu SEO, giảm dung lượng JS client.\n- **Client Component (`'use client'`)**: Khi cần tương tác người dùng (`onClick`, `onChange`), dùng Hooks (`useState`, `useEffect`), hoặc truy cập Browser API (`window`, `localStorage`).\n"
      },
      {
        "id": "react-3-quiz",
        "title": "Quiz Module 3: Next.js 15 & Server Components",
        "minutes": 15,
        "type": "quiz",
        "questions": [
          {
            "level": "medium",
            "scenario": "Trong Next.js 15 App Router, một component không có chỉ thị gì ở đầu file.",
            "q": "Mặc định component đó được xử lý ở đâu?",
            "options": [
              "Server Component chạy hoàn toàn trên server",
              "Client Component chạy trên trình duyệt",
              "Chỉ chạy trong lúc build static HTML",
              "Bị báo lỗi biên dịch"
            ],
            "answer": 0,
            "explain": "Trong Next.js App Router, tất cả các component bên trong thư mục /app mặc định đều là React Server Components (RSC). Muốn chuyển thành Client Component phải khai báo 'use client' ở đầu file.",
            "why": [
              "✓ Đúng — Mặc định là Server Component, mang lại zero-bundle size và SEO vượt trội.",
              "Sai — Phải có chỉ thị 'use client' mới trở thành Client Component.",
              "Sai — RSC hỗ trợ cả dynamic rendering trên server lúc runtime.",
              "Sai — Không báo lỗi."
            ]
          }
        ]
      }
    ]
  }
]
  };
})();
