const exhibits = [
  {
    id: "chip-history",
    code: "EX-01",
    title: "芯片发展历程",
    theme: "从器件演进到智能终端",
    summary:
      "以半导体技术演进为线索，展示芯片从基础器件到智能交互终端的能力升级，并把当前系统定位为展厅里的新一代讲解入口。",
    detail:
      "终端负责唤醒、选择和提问，大屏负责完整展示，云端负责将问题重组为结构化讲解内容。这意味着一个展项被选中后，公共大屏能立即承接叙事，而不再依赖观众围着小屏观看。",
    followup: [
      "它与传统语音讲解器有什么区别？",
      "多屏协同为什么比单终端更适合展厅？"
    ]
  },
  {
    id: "smart-campus",
    code: "EX-02",
    title: "智慧校园沙盘",
    theme: "空间联动与实时感知",
    summary:
      "把校园模型、传感数据和中控页面结合，让观众理解空间场景、设备联动与公共信息展示之间的关系。",
    detail:
      "当观众切换到该展项时，中控重点强调空间映射、状态同步和多节点展示。它非常适合演示为什么网页大屏需要承担公共信息出口，而终端更适合个人交互入口。",
    followup: [
      "如果接入真实设备，沙盘状态如何同步？",
      "网页端和终端端分别该展示哪些信息？"
    ]
  },
  {
    id: "ai-lab",
    code: "EX-03",
    title: "AI 实验室成果",
    theme: "问题驱动的知识讲解",
    summary:
      "围绕实验室研究成果构建问答式展示，让观众不只是看说明板，而是能持续追问项目价值、实现路径和应用边界。",
    detail:
      "这个展项最适合展示云端问答链路。用户围绕某个成果发起问题后，云端返回 `intent`、`title`、`summary`、`detail`、`followup`，网页大屏和终端因此能各取所需，而不是重复展示同一段文本。",
    followup: [
      "结构化结果为什么要分成五类字段？",
      "后续设备端如何消费摘要字段？"
    ]
  }
];

const state = {
  awakened: false,
  deviceState: "待机",
  cloudStatus: "等待触发",
  selectedExhibitId: exhibits[0].id,
  lastIntent: "idle",
  lastQuestion: "尚未发起问答",
  environment: {
    temperature: "24.8°C（模拟）",
    humidity: "48% RH（模拟）",
    pressure: "1008 hPa（模拟）",
    airQuality: "良好（模拟）"
  },
  lastMessage: null,
  sessionId: `demo-session-${Date.now()}`,
  log: []
};

const elements = {
  clock: document.querySelector("#clock"),
  exhibitId: document.querySelector("#exhibit-id"),
  deviceMode: document.querySelector("#device-mode"),
  exhibitTitle: document.querySelector("#exhibit-title"),
  exhibitTheme: document.querySelector("#exhibit-theme"),
  heroSummary: document.querySelector("#hero-summary"),
  cloudStatus: document.querySelector("#cloud-status"),
  answerTitle: document.querySelector("#answer-title"),
  answerDetail: document.querySelector("#answer-detail"),
  followupList: document.querySelector("#followup-list"),
  stateDevice: document.querySelector("#state-device"),
  stateAwake: document.querySelector("#state-awake"),
  stateExhibit: document.querySelector("#state-exhibit"),
  stateIntent: document.querySelector("#state-intent"),
  stateQuestion: document.querySelector("#state-question"),
  stateLink: document.querySelector("#state-link"),
  stateTemperature: document.querySelector("#state-temperature"),
  stateHumidity: document.querySelector("#state-humidity"),
  statePressure: document.querySelector("#state-pressure"),
  stateAirQuality: document.querySelector("#state-air-quality"),
  eventLog: document.querySelector("#event-log"),
  messagePreview: document.querySelector("#message-preview"),
  questionInput: document.querySelector("#question-input")
};

function nowLabel() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function createEnvelope(type, payload, source = "mock-console", target = "web") {
  return {
    type,
    source,
    target,
    sessionId: state.sessionId,
    timestamp: new Date().toISOString(),
    payload
  };
}

function getExhibitById(exhibitId) {
  return exhibits.find((item) => item.id === exhibitId) || exhibits[0];
}

function buildCloudPayload(exhibit, question) {
  return {
    requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
    intent: "explain_exhibit",
    title: `围绕“${exhibit.title}”的讲解结果`,
    summary: `${exhibit.title} 当前由终端触发，大屏承接展示，云端负责将问题组织成结构化讲解结果。`,
    detail: `${exhibit.detail} 当前问题为“${question}”。在正式联调时，这一结果将来自云端大模型，而页面本身不需要更换字段结构。`,
    followup: exhibit.followup,
    confidence: 0.93,
    status: "completed"
  };
}

function pushLog(type, body) {
  state.log.unshift({
    type,
    body,
    time: nowLabel()
  });
  state.log = state.log.slice(0, 20);
}

function renderFollowups(followups) {
  elements.followupList.innerHTML = "";
  followups.forEach((text) => {
    const button = document.createElement("button");
    button.className = "followup-chip";
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", () => {
      elements.questionInput.value = text;
      handleMessage(
        createEnvelope(
          "ask_question",
          {
            requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
            exhibitId: state.selectedExhibitId,
            inputMode: "text",
            question: text
          },
          "web",
          "cloud"
        )
      );
    });
    elements.followupList.appendChild(button);
  });
}

function renderState() {
  const exhibit = getExhibitById(state.selectedExhibitId);
  const answerPayload =
    state.lastMessage && state.lastMessage.type === "cloud_result"
      ? state.lastMessage.payload
      : buildCloudPayload(exhibit, "这项技术为什么适合展厅讲解？");

  elements.exhibitId.textContent = exhibit.code;
  elements.deviceMode.textContent = state.deviceState;
  elements.exhibitTitle.textContent = exhibit.title;
  elements.exhibitTheme.textContent = exhibit.theme;
  elements.heroSummary.textContent = exhibit.summary;
  elements.cloudStatus.textContent = state.cloudStatus;
  elements.answerTitle.textContent = answerPayload.title;
  elements.answerDetail.textContent = answerPayload.detail;
  elements.stateDevice.textContent = state.deviceState;
  elements.stateAwake.textContent = state.awakened ? "已唤醒" : "未唤醒";
  elements.stateExhibit.textContent = exhibit.title;
  elements.stateIntent.textContent = state.lastIntent;
  elements.stateQuestion.textContent = state.lastQuestion;
  elements.stateLink.textContent = state.lastMessage ? state.lastMessage.source : "mock-console";
  elements.stateTemperature.textContent = state.environment.temperature;
  elements.stateHumidity.textContent = state.environment.humidity;
  elements.statePressure.textContent = state.environment.pressure;
  elements.stateAirQuality.textContent = state.environment.airQuality;

  renderFollowups(answerPayload.followup || exhibit.followup);

  elements.eventLog.innerHTML = "";
  state.log.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="event-head">
        <span class="event-type">${item.type}</span>
        <span class="event-time">${item.time}</span>
      </div>
      <p class="event-body">${item.body}</p>
    `;
    elements.eventLog.appendChild(li);
  });

  elements.messagePreview.textContent = JSON.stringify(
    state.lastMessage ||
      createEnvelope("wake", {
        state: "active",
        trigger: "manual"
      }),
    null,
    2
  );
}

function handleMessage(message) {
  state.lastMessage = message;

  switch (message.type) {
    case "wake": {
      state.awakened = true;
      state.deviceState = "激活";
      state.cloudStatus = "等待问题";
      pushLog("wake", "终端进入可交互状态，后续可切换展项或发起问题。");
      break;
    }

    case "select_exhibit": {
      const exhibit = getExhibitById(message.payload.exhibitId);
      state.selectedExhibitId = exhibit.id;
      state.deviceState = "展项浏览";
      pushLog("select_exhibit", `已切换至“${exhibit.title}”，大屏主展示区同步更新。`);
      break;
    }

    case "ask_question": {
      const exhibit = getExhibitById(message.payload.exhibitId);
      state.selectedExhibitId = exhibit.id;
      state.deviceState = "语音提问";
      state.cloudStatus = "云端处理中";
      state.lastQuestion = message.payload.question;
      state.lastIntent = "pending";
      pushLog("ask_question", `围绕“${exhibit.title}”发起问题：${message.payload.question}`);

      window.setTimeout(() => {
        handleMessage(
          createEnvelope(
            "cloud_result",
            buildCloudPayload(exhibit, message.payload.question),
            "cloud",
            "web"
          )
        );
      }, 700);
      break;
    }

    case "cloud_result": {
      state.deviceState = "结果展示";
      state.cloudStatus = "结果已返回";
      state.lastIntent = message.payload.intent;
      pushLog("cloud_result", "云端结构化结果已回流，可同时服务终端摘要与大屏长文展示。");
      break;
    }

    default: {
      pushLog("unknown", `收到未识别消息类型：${message.type}`);
    }
  }

  renderState();
}

function runDemoSequence() {
  handleMessage(
    createEnvelope("wake", {
      state: "active",
      trigger: "manual"
    })
  );

  window.setTimeout(() => {
    handleMessage(
      createEnvelope("select_exhibit", {
        exhibitId: "ai-lab",
        exhibitTitle: "AI 实验室成果",
        trigger: "touch"
      })
    );
  }, 450);

  window.setTimeout(() => {
    handleMessage(
      createEnvelope(
        "ask_question",
        {
          requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
          exhibitId: "ai-lab",
          inputMode: "voice",
          question: "结构化结果为什么适合多屏协同展示？"
        },
        "device",
        "cloud"
      )
    );
  }, 1000);
}

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.getAttribute("data-action");

    if (action === "wake") {
      handleMessage(
        createEnvelope("wake", {
          state: "active",
          trigger: "manual"
        })
      );
    }

    if (action === "ask") {
      handleMessage(
        createEnvelope(
          "ask_question",
          {
            requestId: `req-${Math.random().toString(36).slice(2, 8)}`,
            exhibitId: state.selectedExhibitId,
            inputMode: "text",
            question: elements.questionInput.value.trim() || "这项技术为什么适合展厅讲解？"
          },
          "web",
          "cloud"
        )
      );
    }

    if (action === "manual-cloud") {
      handleMessage(
        createEnvelope(
          "cloud_result",
          buildCloudPayload(
            getExhibitById(state.selectedExhibitId),
            elements.questionInput.value.trim() || "这项技术为什么适合展厅讲解？"
          ),
          "cloud",
          "web"
        )
      );
    }

    if (action === "run-demo") {
      runDemoSequence();
    }
  });
});

document.querySelectorAll("[data-exhibit-id]").forEach((button) => {
  button.addEventListener("click", () => {
    handleMessage(
      createEnvelope("select_exhibit", {
        exhibitId: button.getAttribute("data-exhibit-id"),
        exhibitTitle: button.textContent.trim(),
        trigger: "touch"
      })
    );
  });
});

window.zhizhanConsole = {
  ingest(message) {
    handleMessage(message);
  },
  runDemoSequence,
  getSnapshot() {
    return JSON.parse(JSON.stringify(state));
  }
};

window.addEventListener("zhizhan:message", (event) => {
  if (event.detail) {
    handleMessage(event.detail);
  }
});

window.setInterval(() => {
  elements.clock.textContent = nowLabel();
}, 1000);

elements.clock.textContent = nowLabel();
pushLog("system", "页面已载入模拟中控模式，等待触发演示事件。");
renderState();
