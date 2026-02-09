import { FeedbackRequest, Feedback, ProblemType } from "@/types";
import { mockTeachers } from "./mock-teachers";

// 현재 시간 기준 상대 시간 생성 헬퍼
const hoursAgo = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

const hoursFromNow = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

export const mockFeedbackRequests: FeedbackRequest[] = [
  // SENT - 전송됨, 수락 대기중
  {
    id: "fr1",
    studentId: "student1",
    teacherId: "t1",
    teacher: mockTeachers.find((t) => t.id === "t1"),
    composer: "F. Chopin",
    piece: "Ballade No.1 in G minor, Op.23",
    measureStart: 32,
    measureEnd: 48,
    problemType: "technique",
    description:
      "왼손 아르페지오가 오른손 멜로디와 잘 맞지 않아요. 특히 36마디부터 템포가 흔들리는 것 같습니다.",
    videoUrl: "/videos/sample1.mp4",
    faceBlurred: true,
    status: "SENT",
    createdAt: hoursAgo(2),
    sentAt: hoursAgo(2),
    acceptDeadline: hoursFromNow(10),
    creditAmount: 50,
    paymentStatus: "held",
  },

  // ACCEPTED - 수락됨, 피드백 작성 대기
  {
    id: "fr2",
    studentId: "student1",
    teacherId: "t3",
    teacher: mockTeachers.find((t) => t.id === "t3"),
    composer: "L. v. Beethoven",
    piece: "Piano Sonata No.14 'Moonlight', 3rd mov.",
    measureStart: 1,
    measureEnd: 20,
    problemType: "tempo",
    description:
      "프레스토 아지타토 도입부에서 템포를 유지하면서 프레이징을 살리는 게 어렵습니다. 양손이 빨라지면 균형이 무너져요.",
    videoUrl: "/videos/sample2.mp4",
    faceBlurred: false,
    status: "ACCEPTED",
    createdAt: hoursAgo(24),
    sentAt: hoursAgo(24),
    acceptedAt: hoursAgo(18),
    submitDeadline: hoursFromNow(30),
    creditAmount: 40,
    paymentStatus: "held",
  },

  // SUBMITTED - 피드백 제출됨, 확인 대기
  {
    id: "fr3",
    studentId: "student1",
    teacherId: "t4",
    teacher: mockTeachers.find((t) => t.id === "t4"),
    composer: "J.S. Bach",
    piece: "Invention No.1 in C major, BWV 772",
    measureStart: 1,
    measureEnd: 22,
    problemType: "voicing",
    description:
      "두 성부의 밸런스를 어떻게 잡아야 할지 모르겠어요. 왼손이 너무 크게 들리는 것 같습니다.",
    videoUrl: "/videos/sample3.mp4",
    faceBlurred: true,
    status: "SUBMITTED",
    createdAt: hoursAgo(72),
    sentAt: hoursAgo(72),
    acceptedAt: hoursAgo(60),
    submittedAt: hoursAgo(12),
    creditAmount: 45,
    paymentStatus: "held",
  },

  // COMPLETED - 완료됨
  {
    id: "fr4",
    studentId: "student1",
    teacherId: "t2",
    teacher: mockTeachers.find((t) => t.id === "t2"),
    composer: "J. Brahms",
    piece: "Intermezzo in A major, Op.118 No.2",
    measureStart: 49,
    measureEnd: 64,
    problemType: "expression",
    description: "중간부 클라이맥스에서 감정 표현이 어색해요. 더 자연스럽게 고조시키고 싶습니다.",
    videoUrl: "/videos/sample4.mp4",
    faceBlurred: false,
    status: "COMPLETED",
    createdAt: hoursAgo(168),
    sentAt: hoursAgo(168),
    acceptedAt: hoursAgo(156),
    submittedAt: hoursAgo(96),
    completedAt: hoursAgo(72),
    creditAmount: 60,
    paymentStatus: "released",
  },

  // DECLINED - 거절됨
  {
    id: "fr5",
    studentId: "student1",
    teacherId: "t5",
    teacher: mockTeachers.find((t) => t.id === "t5"),
    composer: "F. Liszt",
    piece: "Liebestraum No.3",
    measureStart: 1,
    measureEnd: 16,
    problemType: "pedal",
    description: "페달링이 너무 뭉개지는 것 같은데, 어떻게 정리해야 할까요?",
    videoUrl: "/videos/sample5.mp4",
    faceBlurred: true,
    status: "DECLINED",
    createdAt: hoursAgo(48),
    sentAt: hoursAgo(48),
    creditAmount: 80,
    paymentStatus: "refunded",
    declineReason: "현재 일정이 많아 48시간 내 피드백이 어렵습니다. 다음 주에 다시 요청해 주세요.",
  },

  // DRAFT - 작성중
  {
    id: "fr6",
    studentId: "student1",
    teacherId: "t6",
    teacher: mockTeachers.find((t) => t.id === "t6"),
    composer: "C. Czerny",
    piece: "Etude Op.299 No.1",
    measureStart: 1,
    measureEnd: 8,
    problemType: "hands",
    description: "",
    faceBlurred: false,
    status: "DRAFT",
    createdAt: hoursAgo(1),
    creditAmount: 35,
    paymentStatus: "pending",
  },
];

// 피드백 목데이터 (SUBMITTED, COMPLETED 상태용)
export const mockFeedbacks: Record<string, Feedback> = {
  fr3: {
    id: "fb3",
    requestId: "fr3",
    comments: [
      {
        measureStart: 1,
        measureEnd: 4,
        text: "도입부에서 오른손이 주선율이므로, 왼손은 한 다이나믹 단계 낮게 연주하세요. 손가락 끝의 터치를 가볍게 유지하면서 손목은 유연하게 풀어주세요.",
      },
      {
        measureStart: 7,
        measureEnd: 11,
        text: "여기서 역할이 바뀝니다. 왼손이 주제를 가져가므로 오른손을 살짝 빼주세요. 왼손 4, 5번 손가락으로 선율을 강조하되, 나머지 음은 가볍게 처리합니다.",
      },
      {
        measureStart: 15,
        measureEnd: 18,
        text: "두 성부가 대화하는 부분입니다. 한 성부가 끝날 때 다른 성부가 시작되는 느낌으로, 약간의 시간차와 다이나믹 차이를 두면 더 입체적으로 들립니다.",
      },
      {
        measureStart: 19,
        measureEnd: 22,
        text: "종결부에서는 두 성부의 밸런스를 동등하게 맞추면서 함께 pp로 사라지듯 마무리하세요. 마지막 화음은 양손의 타이밍을 정확히 맞춰주세요.",
      },
    ],
    demoVideoUrl: "/videos/demo-fb3.mp4",
    practiceCard: {
      section: "마디 1-22 (전곡)",
      tempoProgression: "BPM 60 → 80 → 100",
      steps: [
        "각 손 따로 연습 (왼손/오른손 각각 주선율처럼 강조하며)",
        "두 손 합쳐서 한 성부씩 f로 연주 (다른 성부는 pp)",
        "역할에 따른 자연스러운 다이나믹 밸런스 연습",
        "전체 흐름을 이어서, 성부 교대를 의식하며 통주",
      ],
      dailyMinutes: 15,
    },
    submittedAt: hoursAgo(12),
  },
  fr4: {
    id: "fb4",
    requestId: "fr4",
    comments: [
      {
        measureStart: 49,
        measureEnd: 52,
        text: "클라이맥스로 가기 전 준비 구간입니다. 여기서는 아직 억제하며, 내성의 화성 변화에 주목하세요. 크레셴도는 53마디부터 시작합니다.",
      },
      {
        measureStart: 53,
        measureEnd: 57,
        text: "진정한 고조 시작점입니다. 베이스 라인의 상행을 따라 자연스럽게 크레셴도하세요. 오른손 멜로디는 노래하듯 rubato를 넣되, 전체 프레임은 유지해야 합니다.",
      },
      {
        measureStart: 58,
        measureEnd: 60,
        text: "클라이맥스 정점! 여기서 최대 다이나믹에 도달하되, 긴장을 유지하세요. fff가 아닌 열정적인 f로, 소리가 거칠어지지 않게 주의하세요.",
      },
      {
        measureStart: 61,
        measureEnd: 64,
        text: "해소 구간입니다. 급격히 빠지지 말고 점진적으로 디미누엔도하세요. 마지막 화음에서는 완전한 평화로움을 표현합니다.",
      },
    ],
    demoVideoUrl: "/videos/demo-fb4.mp4",
    practiceCard: {
      section: "마디 49-64",
      tempoProgression: "BPM 50 → 58 → 66 (원템포)",
      steps: [
        "베이스 라인만 따로 연습하며 방향성 느끼기",
        "오른손 멜로디를 노래처럼 부르면서 연습",
        "다이나믹 맵 그리기: 어디서 시작, 정점, 해소인지 표시",
        "전체 연주하며 호흡과 감정 연결 연습",
      ],
      dailyMinutes: 20,
    },
    submittedAt: hoursAgo(96),
  },
};

export const getFeedbackRequests = (studentId?: string): FeedbackRequest[] => {
  if (studentId) {
    return mockFeedbackRequests.filter((r) => r.studentId === studentId);
  }
  return mockFeedbackRequests;
};

export const getFeedbackRequestById = (id: string): FeedbackRequest | undefined => {
  return mockFeedbackRequests.find((r) => r.id === id);
};

export const getFeedbackByRequestId = (requestId: string): Feedback | undefined => {
  return mockFeedbacks[requestId];
};

// 선생님 인박스용: 특정 선생님에게 온 요청들
export const getRequestsForTeacher = (teacherId: string): FeedbackRequest[] => {
  return mockFeedbackRequests.filter((r) => r.teacherId === teacherId);
};
